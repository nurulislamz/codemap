import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { afterEach, describe, expect, it } from "vitest";

import { writeSeedFile } from "./write-seed";

let tempDir: string | null = null;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

describe("writeSeedFile", () => {
  it("creates parent directories and writes UTF-8 seed content with source attribution", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "seed-writer-"));
    const target = join(tempDir, "content/seeds/example.md");

    await writeSeedFile(target, "# Example\nSource: https://example.com\n\nRésumé seed.\n");

    await expect(readFile(target, "utf8")).resolves.toContain("Résumé seed.");
  });

  it("rejects seed content without Source or URL attribution", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "seed-writer-"));

    await expect(writeSeedFile(join(tempDir, "seed.md"), "# Seed\n")).rejects.toThrow(
      /must include source URLs/,
    );
  });
});
