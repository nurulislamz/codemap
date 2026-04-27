import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

interface WriteSeedOptions {
  force?: boolean;
}

export async function writeSeedFile(
  path: string,
  content: string,
  options: WriteSeedOptions = {},
): Promise<void> {
  if (!content.includes("Source:") && !content.includes("URL:")) {
    throw new Error(`Seed file ${path} must include source URLs.`);
  }

  const existingContent = await readExistingFile(path);
  if (existingContent === content) {
    return;
  }

  if (existingContent !== null && !options.force) {
    throw new Error(
      `Refusing to overwrite existing seed file ${path}. Re-run with --force to replace it.`,
    );
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}

async function readExistingFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }

    throw error;
  }
}
