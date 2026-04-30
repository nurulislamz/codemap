import { describe, expect, it } from "vitest";

import { assertCronRequest } from "./auth";

describe("assertCronRequest", () => {
  it("accepts matching bearer token", () => {
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer secret" },
    });

    expect(assertCronRequest(request, "secret")).toBe(true);
  });

  it("rejects missing bearer token", () => {
    const request = new Request("http://localhost");
    expect(assertCronRequest(request, "secret")).toBe(false);
  });

  it("rejects wrong bearer token", () => {
    const request = new Request("http://localhost", {
      headers: { authorization: "Bearer not-secret" },
    });

    expect(assertCronRequest(request, "secret")).toBe(false);
  });
});

