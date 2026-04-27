import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { stableUuidFromString } from "../../src/server/ids/stable-uuid";
import { clearAndInsertLeetcodePatterns } from "../../src/server/data/leetcode-patterns-db";

type ParsedMinor = {
  majorName: string;
  minorName: string;
  problemsCsv: string;
};

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur.trim());
  return out;
}

function normalizeMajorTitle(raw: string): string {
  // Examples:
  // "I. Two Pointer Patterns" -> "Two Pointer"
  // "II. Sliding Window Patterns" -> "Sliding Window"
  const trimmed = raw.trim().replace(/,+$/, "");
  const withoutPrefix = trimmed.replace(/^[IVXLCDM]+\.\s*/i, "");
  return withoutPrefix.replace(/\s*Patterns\s*$/i, "").trim();
}

function normalizeMinorTitle(raw: string): string {
  // Examples:
  // "Pattern 1: Converging : video" -> "Converging"
  // "Pattern 2: Fast & Slow" -> "Fast & Slow"
  const trimmed = raw.trim().replace(/,+$/, "");
  const withoutPatternNumber = trimmed.replace(/^Pattern\s*\d+\s*:\s*/i, "");
  // Drop suffix decorations like ": video" or ":VIDEO"
  return withoutPatternNumber.replace(/\s*:\s*video\s*$/i, "").trim();
}

function parsePatternsCsv(text: string): ParsedMinor[] {
  const lines = text.split(/\r?\n/);
  let currentMajor: string | null = null;
  let inTable = false;
  const minors: ParsedMinor[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Find the actual table header.
    if (!inTable) {
      if (/^Pattern\s*,\s*Problems\s*$/i.test(trimmed)) {
        inTable = true;
      }
      continue;
    }

    const cells = parseCsvLine(line);
    const left = (cells[0] ?? "").trim();
    const right = (cells[1] ?? "").trim();

    // Major pattern lines tend to be single-column with "Patterns".
    if (left && !right && /Patterns\s*$/i.test(left)) {
      currentMajor = normalizeMajorTitle(left);
      continue;
    }

    if (!currentMajor) continue;

    if (!left || /^Pattern$/i.test(left)) continue;
    if (/^Author:/i.test(left)) continue;

    if (/^Pattern\s*\d+/i.test(left)) {
      minors.push({
        majorName: currentMajor,
        minorName: normalizeMinorTitle(left),
        problemsCsv: right,
      });
    }
  }

  return minors;
}

async function main(): Promise<void> {
  const fileFlag = process.argv.find((arg) => arg.startsWith("--file="));
  const filePath = fileFlag
    ? fileFlag.slice("--file=".length)
    : resolve(process.cwd(), "leetcode_patterns.csv");

  const raw = await readFile(filePath, "utf8");
  const minors = parsePatternsCsv(raw);

  const majorNames = Array.from(new Set(minors.map((m) => m.majorName)));
  const majors = majorNames.map((name, idx) => ({
    id: stableUuidFromString(`leetcode-major:${name}`),
    name,
    displayOrder: idx,
  }));

  const majorIdByName = new Map(majors.map((m) => [m.name, m.id]));

  const minorRows = minors.map((minor, idx) => {
    const majorId = majorIdByName.get(minor.majorName);
    if (!majorId) {
      throw new Error(`Missing major id for ${minor.majorName}`);
    }

    return {
      id: stableUuidFromString(`leetcode-minor:${minor.majorName}:${minor.minorName}`),
      majorId,
      name: minor.minorName,
      displayOrder: idx,
      problemsCsv: minor.problemsCsv,
    };
  });

  await clearAndInsertLeetcodePatterns({ majors, minors: minorRows });

  console.log(
    JSON.stringify({ majors: majors.length, minors: minorRows.length, filePath }, null, 2),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
