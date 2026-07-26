import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export function requireCliValue(flag: string, value: string | undefined): string {
  if (!value || value.startsWith("--")) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

export function runCli(main: () => Promise<void>, entryFile: string): void {
  const thisFile = fileURLToPath(entryFile);
  if (resolve(process.argv[1] ?? "") !== thisFile) return;

  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
