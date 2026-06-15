import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const collection = vi.hoisted(() => vi.fn());
const userDoc = vi.hoisted(() => vi.fn());
const pomodoroCollection = vi.hoisted(() => vi.fn());
const tasksDoc = vi.hoisted(() => vi.fn());
const setTasks = vi.hoisted(() => vi.fn());
const getTasks = vi.hoisted(() => vi.fn());

vi.mock("@/lib/firebase/firestore", () => ({
  getFirestoreDb: () => ({
    collection,
  }),
}));

const validTask = {
  id: "11111111-1111-4111-8111-111111111111",
  text: "Write the report",
  done: false,
  createdAt: "2026-06-12T09:00:00.000Z",
};

describe("pomodoro task db-server", () => {
  beforeEach(() => {
    const pomodoroColl = { doc: tasksDoc };
    const userDocument = { collection: pomodoroCollection };
    const usersCollection = { doc: userDoc };

    collection.mockReturnValue(usersCollection);
    userDoc.mockReturnValue(userDocument);
    pomodoroCollection.mockReturnValue(pomodoroColl);
    tasksDoc.mockReturnValue({ set: setTasks, get: getTasks });
    getTasks.mockResolvedValue({ data: () => ({ tasks: [] }) });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("writes the validated task list under the authenticated user", async () => {
    const { replacePomodoroTasks } = await import("./task-db-server");

    await replacePomodoroTasks([validTask], "firebase-user-123");

    expect(collection).toHaveBeenCalledWith("users");
    expect(userDoc).toHaveBeenCalledWith("firebase-user-123");
    expect(pomodoroCollection).toHaveBeenCalledWith("pomodoro");
    expect(tasksDoc).toHaveBeenCalledWith("tasks");
    expect(setTasks).toHaveBeenCalledWith({ tasks: [validTask] });
  });

  it("rejects a task list with an empty task text", async () => {
    const { replacePomodoroTasks } = await import("./task-db-server");

    await expect(
      replacePomodoroTasks([{ ...validTask, text: "" }], "firebase-user-123"),
    ).rejects.toThrow();
    expect(setTasks).not.toHaveBeenCalled();
  });

  it("reads tasks and drops malformed entries", async () => {
    getTasks.mockResolvedValue({
      data: () => ({ tasks: [validTask, { malformed: "row" }] }),
    });
    const { getPomodoroTasks } = await import("./task-db-server");

    const tasks = await getPomodoroTasks("firebase-user-123");

    expect(tasks).toEqual([validTask]);
  });

  it("returns an empty list when the document is missing", async () => {
    getTasks.mockResolvedValue({ data: () => undefined });
    const { getPomodoroTasks } = await import("./task-db-server");

    expect(await getPomodoroTasks("firebase-user-123")).toEqual([]);
  });
});
