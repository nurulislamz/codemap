import { asc } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { leetcodeMajorPatterns, leetcodeMinorPatterns } from "@/server/db/schema";

export type LeetcodeMinorPatternRow = {
  id: string;
  majorId: string;
  name: string;
  displayOrder: number;
  problemsCsv: string;
};

export type LeetcodeMajorPatternWithMinors = {
  id: string;
  name: string;
  displayOrder: number;
  minors: LeetcodeMinorPatternRow[];
};

export async function listLeetcodePatternsFromDb(): Promise<LeetcodeMajorPatternWithMinors[]> {
  const db = await getDb();
  const majors = await db
    .select()
    .from(leetcodeMajorPatterns)
    .orderBy(asc(leetcodeMajorPatterns.displayOrder));

  if (majors.length === 0) return [];

  const minors = await db
    .select()
    .from(leetcodeMinorPatterns)
    .orderBy(asc(leetcodeMinorPatterns.displayOrder));

  const minorsByMajor = new Map<string, LeetcodeMinorPatternRow[]>();
  for (const row of minors) {
    const list = minorsByMajor.get(row.majorId) ?? [];
    list.push({
      id: row.id,
      majorId: row.majorId,
      name: row.name,
      displayOrder: row.displayOrder,
      problemsCsv: row.problemsCsv,
    });
    minorsByMajor.set(row.majorId, list);
  }

  return majors.map((major) => ({
    id: major.id,
    name: major.name,
    displayOrder: major.displayOrder,
    minors: minorsByMajor.get(major.id) ?? [],
  }));
}

export async function clearAndInsertLeetcodePatterns(input: {
  majors: Array<{ id: string; name: string; displayOrder: number }>;
  minors: Array<{
    id: string;
    majorId: string;
    name: string;
    displayOrder: number;
    problemsCsv: string;
  }>;
}) {
  const db = await getDb();

  // Replace-all import keeps DB consistent with the CSV.
  await db.delete(leetcodeMinorPatterns);
  await db.delete(leetcodeMajorPatterns);

  if (input.majors.length) {
    await db.insert(leetcodeMajorPatterns).values(input.majors);
  }
  if (input.minors.length) {
    await db.insert(leetcodeMinorPatterns).values(input.minors);
  }
}
