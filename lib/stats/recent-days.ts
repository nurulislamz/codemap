type DatedEntry = {
  date: string;
};

/**
 * Returns exactly `count` consecutive day entries ending at `endDate`,
 * taking matching entries from `days` and zero-filling gaps via
 * `makeEmptyDay`. Dates are UTC days in ISO `YYYY-MM-DD` form.
 */
export function fillRecentDays<T extends DatedEntry>(
  days: T[],
  count: number,
  makeEmptyDay: (date: string) => T,
  endDate: Date,
): T[] {
  const byDate = new Map(days.map((day) => [day.date, day]));

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(endDate);
    date.setUTCDate(endDate.getUTCDate() - (count - index - 1));
    const isoDate = date.toISOString().slice(0, 10);

    return byDate.get(isoDate) ?? makeEmptyDay(isoDate);
  });
}

/** Formats an ISO `YYYY-MM-DD` UTC day as a short `12 Jun` label. */
export function formatDayLabel(date: string) {
  if (!date) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
