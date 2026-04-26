import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeSeedFile(path: string, content: string): Promise<void> {
  if (!content.includes("Source:") && !content.includes("URL:")) {
    throw new Error(`Seed file ${path} must include source URLs.`);
  }

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, "utf8");
}
