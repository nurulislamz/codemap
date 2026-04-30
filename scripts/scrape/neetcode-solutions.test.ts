import { describe, expect, it } from "vitest";

import {
  addNeetcodeSolution,
  buildNeetcodeSolutionUrl,
  extractLeetcodeSlug,
  extractYoutubeUrl,
  hasNeetcodeSolutionPage,
  parseLeetcodePatterns,
  resolvePythonExecutable,
  serializeLeetcodePatterns,
} from "./neetcode-solutions";

describe("extractLeetcodeSlug", () => {
  it("extracts the problem slug from a LeetCode URL", () => {
    expect(extractLeetcodeSlug("https://leetcode.com/problems/container-with-most-water/")).toBe(
      "container-with-most-water",
    );
  });
});

describe("buildNeetcodeSolutionUrl", () => {
  it("builds the deterministic NeetCode solution URL from a LeetCode slug", () => {
    expect(buildNeetcodeSolutionUrl("container-with-most-water")).toBe(
      "https://neetcode.io/solutions/container-with-most-water",
    );
  });
});

describe("hasNeetcodeSolutionPage", () => {
  it("accepts scraped solution pages that include the requested slug and solution content", () => {
    expect(
      hasNeetcodeSolutionPage(
        `
          <html>
            <head><title>Container With Most Water - Leetcode 11 - NeetCode</title></head>
            <body>
              <a href="/solutions/container-with-most-water">Container With Most Water</a>
              <h1>Container With Most Water</h1>
              <section>Solution</section>
            </body>
          </html>
        `,
        "container-with-most-water",
      ),
    ).toBe(true);
  });

  it("rejects generic not-found pages", () => {
    expect(
      hasNeetcodeSolutionPage(
        `
          <html>
            <head><title>404 - NeetCode</title></head>
            <body>Page not found</body>
          </html>
        `,
        "missing-problem",
      ),
    ).toBe(false);
  });
});

describe("extractYoutubeUrl", () => {
  it("extracts the first YouTube video URL from scraped HTML", () => {
    expect(
      extractYoutubeUrl(`
        <iframe src="https://www.youtube.com/embed/UuiTKBwPgAo?si=abc"></iframe>
      `),
    ).toBe("https://www.youtube.com/watch?v=UuiTKBwPgAo");
  });
});

describe("JSON enrichment", () => {
  it("adds a NeetCode text and video solution without removing the leading comment", () => {
    const input = `// Add a Solution to each of these files (video/text)

{
  "patterns": [
    {
      "name": "Two Pointer",
      "subPatterns": [
        {
          "name": "Converging",
          "problems": [
            {
              "number": "11",
              "title": "Container With Most Water",
              "leetcodeUrl": "https://leetcode.com/problems/container-with-most-water/",
              "difficulty": "medium"
            }
          ]
        }
      ]
    }
  ]
}
`;

    const parsed = parseLeetcodePatterns(input);
    addNeetcodeSolution(parsed.data.patterns[0].subPatterns[0].problems[0], {
      textUrl: "https://neetcode.io/solutions/container-with-most-water",
      videoUrl: "https://www.youtube.com/watch?v=UuiTKBwPgAo",
    });

    const output = serializeLeetcodePatterns(parsed);

    expect(output.startsWith("// Add a Solution")).toBe(true);
    expect(output).toContain('"solutions"');
    expect(output).toContain('"textUrl": "https://neetcode.io/solutions/container-with-most-water"');
    expect(output).toContain('"videoUrl": "https://www.youtube.com/watch?v=UuiTKBwPgAo"');
  });
});

describe("resolvePythonExecutable", () => {
  it("prefers an explicit Python executable over venv defaults", () => {
    expect(resolvePythonExecutable("/custom/python")).toBe("/custom/python");
  });
});
