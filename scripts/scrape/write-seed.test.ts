import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
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

  it("refuses to overwrite differing existing seed content without force", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "seed-writer-"));
    const target = join(tempDir, "seed.md");
    await writeFile(target, "# Existing\nSource: https://example.com/old\n", "utf8");

    await expect(
      writeSeedFile(target, "# Generated\nSource: https://example.com/new\n"),
    ).rejects.toThrow(/Refusing to overwrite existing seed file/);

    await expect(readFile(target, "utf8")).resolves.toContain("https://example.com/old");
  });

  it("allows overwriting differing existing seed content with force", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "seed-writer-"));
    const target = join(tempDir, "seed.md");
    await writeFile(target, "# Existing\nSource: https://example.com/old\n", "utf8");

    await writeSeedFile(target, "# Generated\nSource: https://example.com/new\n", {
      force: true,
    });

    await expect(readFile(target, "utf8")).resolves.toContain("https://example.com/new");
  });

  it("exits cleanly when existing seed content is identical", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "seed-writer-"));
    const target = join(tempDir, "seed.md");
    const content = "# Existing\nSource: https://example.com/same\n";
    await writeFile(target, content, "utf8");

    await writeSeedFile(target, content);

    await expect(readFile(target, "utf8")).resolves.toBe(content);
  });
});
