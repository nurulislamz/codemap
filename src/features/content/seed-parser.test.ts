import { describe, expect, it } from "vitest";
import {
  parseLeetcodeSeed,
  parseRoadmapSeed,
  parseSystemDesignSeed,
} from "./seed-parser";

describe("seed parser", () => {
  it("parses leetcode patterns, subpatterns, and problems", () => {
    const result = parseLeetcodeSeed(`# LeetCode Patterns

## Pattern: Two Pointers
Slug: two-pointers
Description: Move two indices through a sequence.

### Subpattern: Opposite Ends
Slug: opposite-ends
Description: Start at both sides and move inward.

- Problem: Two Sum II
  Slug: two-sum-ii
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers
`);

    expect(result.patterns[0]).toMatchObject({
      slug: "two-pointers",
      name: "Two Pointers",
      description: "Move two indices through a sequence.",
    });
    expect(result.subpatterns[0]).toMatchObject({
      slug: "opposite-ends",
      patternSlug: "two-pointers",
      description: "Start at both sides and move inward.",
    });
    expect(result.problems[0]).toMatchObject({
      slug: "two-sum-ii",
      subpatternSlug: "opposite-ends",
      difficulty: "medium",
      estimatedMinutes: 20,
      tags: ["array", "pointers"],
    });
  });

  it("parses roadmap topics and resources", () => {
    const result = parseRoadmapSeed(`# Backend Roadmap
Source: https://roadmap.sh/backend
Description: Backend engineering roadmap.

## Topic: Internet
Slug: internet
Description: Understand how the internet works.
Source: https://roadmap.sh/backend

- Resource: How DNS works
  URL: https://roadmap.sh/guides/dns-in-one-picture
  Type: article
  Summary: DNS resolution overview.
`);

    expect(result.roadmap).toMatchObject({
      slug: "backend",
      title: "Backend Roadmap",
      sourceUrl: "https://roadmap.sh/backend",
      description: "Backend engineering roadmap.",
    });
    expect(result.topics[0]).toMatchObject({
      slug: "internet",
      sourceUrl: "https://roadmap.sh/backend",
    });
    expect(result.resources[0]).toMatchObject({
      topicSlug: "internet",
      summary: "DNS resolution overview.",
    });
  });

  it("parses system design prompts", () => {
    const result = parseSystemDesignSeed(`# System Design Prompts

## Topic: URL Shortener
Slug: url-shortener
Description: Short links and redirects.
Tags: hashing, storage, caching

### Prompt: Design TinyURL
Slug: design-tinyurl
Difficulty: medium
Source: https://example.com/tinyurl
Expected Concepts: id generation, redirects, rate limiting

Design a URL shortener with analytics.
`);

    expect(result.topics[0]).toMatchObject({
      slug: "url-shortener",
      description: "Short links and redirects.",
      conceptTags: ["hashing", "storage", "caching"],
    });
    expect(result.prompts[0]).toMatchObject({
      topicSlug: "url-shortener",
      sourceUrl: "https://example.com/tinyurl",
      expectedConcepts: ["id generation", "redirects", "rate limiting"],
      promptText: "Design a URL shortener with analytics.",
    });
  });

  it("rejects invalid difficulty values", () => {
    expect(() =>
      parseLeetcodeSeed(`# LeetCode Patterns

## Pattern: Two Pointers
Slug: two-pointers
Description: Move two indices through a sequence.

### Subpattern: Opposite Ends
Slug: opposite-ends

- Problem: Two Sum II
  Slug: two-sum-ii
  Difficulty: moderate
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers
`),
    ).toThrow(/Invalid difficulty.*Two Sum II.*moderate/);
  });

  it("throws useful errors for missing required fields", () => {
    expect(() =>
      parseSystemDesignSeed(`# System Design Prompts

## Topic: URL Shortener
Slug: url-shortener
Tags: hashing

### Prompt: Design TinyURL
Difficulty: medium
Expected Concepts: redirects

Design a URL shortener.
`),
    ).toThrow(/Missing prompt slug.*Design TinyURL/);
  });

  it("does not read indented child fields as section metadata", () => {
    expect(() =>
      parseLeetcodeSeed(`# LeetCode Patterns

## Pattern: Two Pointers
Slug: two-pointers
Description: Move two indices through a sequence.

### Subpattern: Opposite Ends

- Problem: Two Sum II
  Slug: two-sum-ii
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers
`),
    ).toThrow(/Missing slug.*subpattern Opposite Ends/);
  });

  it("preserves prompt text that starts with a label-like line", () => {
    const result = parseSystemDesignSeed(`# System Design Prompts

## Topic: URL Shortener
Slug: url-shortener
Tags: hashing

### Prompt: Design TinyURL
Slug: design-tinyurl
Difficulty: medium
Expected Concepts: redirects

Requirements:
Design a URL shortener that supports analytics.
`);

    expect(result.prompts[0].promptText).toBe(
      "Requirements:\nDesign a URL shortener that supports analytics.",
    );
  });

  it("rejects duplicate leetcode problem slugs", () => {
    expect(() =>
      parseLeetcodeSeed(`# LeetCode Patterns

## Pattern: Two Pointers
Slug: two-pointers
Description: Move two indices through a sequence.

### Subpattern: Opposite Ends
Slug: opposite-ends

- Problem: Two Sum II
  Slug: duplicate-problem
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers

- Problem: Three Sum
  Slug: duplicate-problem
  Difficulty: medium
  URL: https://leetcode.com/problems/3sum/
  Estimated Minutes: 30
  Tags: array, pointers
`),
    ).toThrow(/Duplicate leetcode problem slug.*duplicate-problem/);
  });

  it("rejects duplicate roadmap topic slugs", () => {
    expect(() =>
      parseRoadmapSeed(`# Backend Roadmap
Source: https://roadmap.sh/backend

## Topic: Internet
Slug: duplicate-topic
Description: Understand how the internet works.

## Topic: HTTP
Slug: duplicate-topic
Description: Understand HTTP fundamentals.
`),
    ).toThrow(/Duplicate roadmap topic slug.*duplicate-topic/);
  });
});
