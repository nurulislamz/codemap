const intervalsByRecallRating: Record<number, number> = {
  0: 1,
  1: 1,
  2: 2,
  3: 4,
  4: 7,
  5: 14,
};

export function nextReviewDate(reviewedAt: string, recallRating: number): Date {
  const intervalDays = intervalsByRecallRating[recallRating];

  if (intervalDays === undefined) {
    throw new Error(`Recall rating must be between 0 and 5. Received ${recallRating}.`);
  }

  const nextReviewAt = new Date(reviewedAt);
  nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + intervalDays);

  return nextReviewAt;
}
