import { afterEach, describe, expect, it } from "vitest";

import {
  localProgressKey,
  readLocalProgress,
  roadmapProgressDocumentId,
  writeLocalProgress,
} from "./progress-shared";

describe("roadmap progress storage contract", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("builds the localStorage key from roadmap and topic slugs", () => {
    expect(localProgressKey("backend", "whatIsHttp")).toBe(
      "codemap:roadmap-progress:backend:whatIsHttp",
    );
  });

  it("builds the Firestore document id from roadmap and topic slugs", () => {
    expect(roadmapProgressDocumentId("backend", "whatIsHttp")).toBe(
      "backend__whatIsHttp",
    );
  });

  it("round-trips progress through localStorage", () => {
    const progress = {
      roadmapSlug: "backend",
      topicSlug: "whatIsHttp",
      learned: true,
      notes: "HTTP notes",
      links: ["https://developer.mozilla.org/en-US/docs/Web/HTTP"],
    };

    writeLocalProgress(progress);

    expect(readLocalProgress("backend", "whatIsHttp")).toEqual(progress);
  });

  it("returns null when no progress is saved", () => {
    expect(readLocalProgress("backend", "missingTopic")).toBeNull();
  });

  it("removes corrupt entries and returns null", () => {
    const key = localProgressKey("backend", "whatIsHttp");
    window.localStorage.setItem(key, "{not valid json");

    expect(readLocalProgress("backend", "whatIsHttp")).toBeNull();
    expect(window.localStorage.getItem(key)).toBeNull();
  });
});
