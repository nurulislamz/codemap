import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const collection = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/firestore", () => ({
  getFirestoreDb: () => ({
    collection,
    batch: () => batchMock,
  }),
}));

const batchMock = vi.hoisted(() => ({
  set: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn().mockResolvedValue(undefined),
}));

function collectionWithDocs(docs: Array<Record<string, unknown>>) {
  return {
    get: vi.fn().mockResolvedValue({
      docs: docs.map((data) => ({ data: () => data, ref: { id: data.id } })),
    }),
    where: vi.fn().mockReturnThis(),
    doc: vi.fn(),
  };
}

describe("daily plan persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    batchMock.commit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns only preferences with at least one track enabled", async () => {
    collection.mockReturnValue(
      collectionWithDocs([
        {
          user_id: "user-1",
          email: "one@example.com",
          leetcode_enabled: true,
          roadmap_enabled: false,
          system_design_enabled: false,
        },
        {
          user_id: "user-2",
          email: "two@example.com",
          leetcode_enabled: false,
          roadmap_enabled: false,
          system_design_enabled: false,
        },
        { malformed: "row" },
      ]),
    );
    const { listDailyEmailEnabledPreferences } = await import(
      "./daily-plan-persistence"
    );

    const prefs = await listDailyEmailEnabledPreferences();

    expect(prefs).toEqual([
      {
        user_id: "user-1",
        email: "one@example.com",
        leetcode_enabled: true,
        roadmap_enabled: false,
        system_design_enabled: false,
      },
    ]);
  });

  it("creates a daily plan document when none exists", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const planDoc = {
      get: vi.fn().mockResolvedValue({ exists: false }),
      set,
    };
    collection.mockReturnValue({ doc: vi.fn(() => planDoc) });
    const { upsertDailyPlanForUser } = await import("./daily-plan-persistence");

    const plan = await upsertDailyPlanForUser({
      userId: "user-1",
      planDate: "2026-06-11",
    });

    expect(plan.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        id: plan.id,
        user_id: "user-1",
        plan_date: "2026-06-11",
        status: "not_started",
      }),
    );
  });

  it("refreshes generated_at without resetting status when the plan exists", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    const planDoc = {
      get: vi.fn().mockResolvedValue({ exists: true }),
      set,
    };
    collection.mockReturnValue({ doc: vi.fn(() => planDoc) });
    const { upsertDailyPlanForUser } = await import("./daily-plan-persistence");

    await upsertDailyPlanForUser({ userId: "user-1", planDate: "2026-06-11" });

    expect(set).toHaveBeenCalledWith(
      { generated_at: expect.any(String) },
      { merge: true },
    );
  });

  it("replaces existing plan items in one batch", async () => {
    const existingRef = { id: "stale-item" };
    const itemsCollection = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        docs: [{ data: () => ({ id: "stale-item" }), ref: existingRef }],
      }),
      doc: vi.fn((id: string) => ({ id })),
    };
    collection.mockReturnValue(itemsCollection);
    const { replaceDailyPlanItemsForPlan } = await import(
      "./daily-plan-persistence"
    );

    const result = await replaceDailyPlanItemsForPlan({
      planId: "plan-1",
      items: [
        { track: "leetcode", title: "Two Sum", href: "/leetcode/two-sum" },
      ],
      stableKeyPrefix: "user-1:2026-06-11",
    });

    expect(result).toEqual({ upserted: 1 });
    expect(batchMock.delete).toHaveBeenCalledWith(existingRef);
    expect(batchMock.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        plan_id: "plan-1",
        track: "leetcode",
        title: "Two Sum",
        href: "/leetcode/two-sum",
        scheduled_order: 0,
      }),
    );
    expect(batchMock.commit).toHaveBeenCalled();
  });

  it("returns plan items sorted by scheduled order", async () => {
    const itemsCollection = {
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              plan_id: "plan-1",
              track: "roadmap",
              title: "HTTP",
              href: "/roadmap/http",
              scheduled_order: 1,
            }),
          },
          {
            data: () => ({
              plan_id: "plan-1",
              track: "leetcode",
              title: "Two Sum",
              href: "/leetcode/two-sum",
              scheduled_order: 0,
            }),
          },
        ],
      }),
    };
    collection.mockReturnValue(itemsCollection);
    const { getDailyPlanEmailItemsForUser } = await import(
      "./daily-plan-persistence"
    );

    const items = await getDailyPlanEmailItemsForUser({
      userId: "user-1",
      planDate: "2026-06-11",
    });

    expect(items).toEqual([
      { track: "leetcode", title: "Two Sum", href: "/leetcode/two-sum" },
      { track: "roadmap", title: "HTTP", href: "/roadmap/http" },
    ]);
  });

  it("queues an email notification and marks it sent", async () => {
    const set = vi.fn().mockResolvedValue(undefined);
    collection.mockReturnValue({ doc: vi.fn(() => ({ set })) });
    const {
      createEmailNotificationQueued,
      markEmailNotificationSent,
    } = await import("./daily-plan-persistence");

    const queued = await createEmailNotificationQueued({
      userId: "user-1",
      scheduledForIso: "2026-06-11T06:00:00.000Z",
      subject: "Today's plan",
      body: "<p>plan</p>",
      notificationType: "daily_plan",
    });

    expect(queued?.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        status: "queued",
        subject: "Today's plan",
      }),
    );

    await markEmailNotificationSent({
      id: queued!.id,
      sentAtIso: "2026-06-11T06:01:00.000Z",
      providerMessageId: "resend-123",
    });

    expect(set).toHaveBeenCalledWith(
      {
        status: "sent",
        sent_at: "2026-06-11T06:01:00.000Z",
        provider_message_id: "resend-123",
      },
      { merge: true },
    );
  });
});
