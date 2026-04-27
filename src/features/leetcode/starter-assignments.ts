export type StarterLeetCodeAssignment = {
  id: string;
  pattern: string;
  subpattern: string;
  problemTitle: string;
  description: string;
  timeLimitMinutes: number;
  sourceUrl: string;
};

export const starterLeetCodeAssignments: StarterLeetCodeAssignment[] = [
  {
    id: "two-sum-ii",
    pattern: "Two Pointers",
    subpattern: "Opposite Ends",
    problemTitle: "Two Sum II - Input Array Is Sorted",
    description:
      "Practice converging pointers on a sorted array while preserving O(1) extra space.",
    timeLimitMinutes: 30,
    sourceUrl: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/",
  },
  {
    id: "longest-substring",
    pattern: "Sliding Window",
    subpattern: "Variable Window",
    problemTitle: "Longest Substring Without Repeating Characters",
    description:
      "Track a moving window and last-seen positions to maintain a valid substring.",
    timeLimitMinutes: 35,
    sourceUrl:
      "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
  },
];

export function findStarterLeetCodeAssignment(assignmentId: string) {
  return starterLeetCodeAssignments.find(
    (assignment) => assignment.id === assignmentId,
  );
}

