import { getSeedDate } from "./seed-date";
import { writeSeedFile } from "./write-seed";

async function main(): Promise<void> {
  const seedDate = getSeedDate();
  const force = process.argv.includes("--force");
  const markdown = `# LeetCode Patterns

Source: https://leetcode.com/problemset/
Seed Date: ${seedDate}
Review Status: curated starter seed
Seed Method: curated constants

## Pattern: Two Pointers
Slug: two-pointers
Description: Use two indices to scan arrays or strings efficiently.

### Subpattern: Opposite Ends
Slug: opposite-ends
Description: Start pointers at opposite ends and move them inward based on comparisons.

- Problem: Two Sum II - Input Array Is Sorted
  Slug: two-sum-ii-input-array-is-sorted
  Difficulty: medium
  URL: https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/
  Estimated Minutes: 20
  Tags: array, pointers

## Pattern: Sliding Window
Slug: sliding-window
Description: Maintain a moving range over contiguous data.

### Subpattern: Variable Window
Slug: variable-window
Description: Expand and shrink a window while preserving an invariant.

- Problem: Longest Substring Without Repeating Characters
  Slug: longest-substring-without-repeating-characters
  Difficulty: medium
  URL: https://leetcode.com/problems/longest-substring-without-repeating-characters/
  Estimated Minutes: 30
  Tags: string, hash-map, window

## Pattern: Binary Search
Slug: binary-search
Description: Repeatedly halve an ordered search space.

### Subpattern: Search Answer Space
Slug: search-answer-space
Description: Binary search the minimum or maximum feasible answer.

- Problem: Koko Eating Bananas
  Slug: koko-eating-bananas
  Difficulty: medium
  URL: https://leetcode.com/problems/koko-eating-bananas/
  Estimated Minutes: 35
  Tags: binary-search, arrays

## Pattern: BFS
Slug: bfs
Description: Explore graph or tree levels with a queue.

### Subpattern: Level Order
Slug: level-order
Description: Process nodes breadth-first by distance or depth.

- Problem: Binary Tree Level Order Traversal
  Slug: binary-tree-level-order-traversal
  Difficulty: medium
  URL: https://leetcode.com/problems/binary-tree-level-order-traversal/
  Estimated Minutes: 25
  Tags: tree, queue, bfs

## Pattern: DFS
Slug: dfs
Description: Explore paths recursively or with an explicit stack.

### Subpattern: Backtracking
Slug: backtracking
Description: Build candidates depth-first and undo choices while searching.

- Problem: Subsets
  Slug: subsets
  Difficulty: medium
  URL: https://leetcode.com/problems/subsets/
  Estimated Minutes: 25
  Tags: backtracking, bitmask, dfs

## Pattern: Dynamic Programming
Slug: dynamic-programming
Description: Reuse overlapping subproblem results.

### Subpattern: One Dimensional DP
Slug: one-dimensional-dp
Description: Track optimal or count states over a one-dimensional index.

- Problem: Climbing Stairs
  Slug: climbing-stairs
  Difficulty: easy
  URL: https://leetcode.com/problems/climbing-stairs/
  Estimated Minutes: 20
  Tags: dp, math

## Pattern: Heap
Slug: heap
Description: Use priority queues to repeatedly access min or max elements.

### Subpattern: Top K
Slug: top-k
Description: Keep the most relevant k elements with a bounded priority queue.

- Problem: Top K Frequent Elements
  Slug: top-k-frequent-elements
  Difficulty: medium
  URL: https://leetcode.com/problems/top-k-frequent-elements/
  Estimated Minutes: 30
  Tags: heap, hash-map, bucket-sort

## Pattern: Graph
Slug: graph
Description: Model relationships as nodes and edges.

### Subpattern: Connectivity
Slug: connectivity
Description: Traverse connected components and mark visited nodes.

- Problem: Number of Islands
  Slug: number-of-islands
  Difficulty: medium
  URL: https://leetcode.com/problems/number-of-islands/
  Estimated Minutes: 30
  Tags: graph, dfs, bfs, matrix
`;

  await writeSeedFile("content/seeds/leetcode-patterns.md", markdown, { force });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
