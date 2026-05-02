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
  return [];
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
  void input;
}
