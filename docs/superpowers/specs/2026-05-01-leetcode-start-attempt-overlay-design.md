# LeetCode Start Attempt Overlay Design

## Goal

Clicking `Start` from the LeetCode problem table should begin a focused timed attempt without leaving the dashboard. The app should show a full-screen attempt overlay, open the LeetCode problem in another tab after a short delay, keep the remaining time visible in the browser tab title, warn near the end, and collect attempt results when the user finishes.

## Current Context

- The problem table renders the current `Start` action in `src/app/(dashboard)/leetcode/leetcode-problem-table.tsx`.
- The existing timer route at `/leetcode/[problemId]/timer` records attempts through `saveLeetCodeAttemptFromForm`.
- `CountdownTimer` and `TimerPanel` live in `src/ui/timer-panel.tsx`.
- The current attempt data model supports `isSuccessful`, `durationSeconds`, `failureReason`, and `notes`, but does not yet have a first-class outcome enum for statuses like `time_ran_out` or `completed_overtime`.

## User Flow

1. User clicks `Start` on a problem row.
2. The app opens a blank tab immediately from the click event so the browser treats it as user-initiated.
3. The dashboard is dimmed behind a full-screen planner overlay.
4. The overlay starts a 30-minute timer and shows the selected problem title, pattern, subpattern, launch status, and primary controls.
5. After a short delay, the blank tab is navigated to the problem's LeetCode URL.
6. While the attempt is active, the current browser tab title includes the countdown, for example `24:13 - Container With Most Water`.
7. At five minutes left, one minute left, and zero, the app plays a short warning sound.
8. The user can finish manually before time expires, or the app can move to result mode when time reaches zero.
9. Result mode collects final status and notes, then saves the attempt.

## Result Capture

Result mode should show these final status options:

- `Completed`: user solved within the expected time.
- `Completed after time limit`: user solved, but the timer already hit zero or elapsed time exceeded the limit.
- `Failed`: user did not solve successfully.
- `Skipped`: user decided not to continue.
- `Time ran out`: time expired and the user did not complete the problem.

The overlay should prompt for the overtime case when appropriate:

- If the timer has expired and the user chooses a successful result, ask whether they took more time than needed.
- If they confirm they completed after the time limit, save it as successful for now, but mark the current record through notes text because the deeper model enum is deferred.

Notes:

- General notes are always available.
- Failure notes are available for `Failed` and `Time ran out`.
- For the first implementation pass, map statuses onto the current model:
  - `Completed` -> `isSuccessful: true`, no failure reason.
  - `Completed after time limit` -> `isSuccessful: true`, add an overtime marker in `notes`.
  - `Failed` -> `isSuccessful: false`, use failure notes as `failureReason`.
  - `Skipped` -> `isSuccessful: false`, use a skipped marker as `failureReason`.
  - `Time ran out` -> `isSuccessful: false`, use a timeout marker plus failure notes as `failureReason`.

## Interface Shape

Add a focused client component for the attempt overlay rather than pushing this behavior into the table itself. The table should own row rendering and pass the selected problem into the overlay controller.

Proposed units:

- `LeetcodeAttemptOverlay`: active timer, tab launching, title updates, audio warnings, and result form.
- `AttemptCountdown` or an extension to `CountdownTimer`: exposes remaining seconds and threshold callbacks.
- `submitLeetCodeAttempt`: existing client persistence path, extended to accept notes and failure reason from the overlay.

The overlay should be fixed-position, cover the viewport, dim the existing dashboard, and keep controls readable on desktop and mobile.

## Second Step: Data Model

Do not remodel persistence in this first pass. A follow-up change should add a first-class attempt outcome to the data model so reporting can distinguish:

- completed within time
- completed after time limit
- failed
- skipped
- timed out

That follow-up should update schema validation, storage, historical attempt rows, stats calculations, and any display labels that currently infer status from `isSuccessful` and `failureReason`.

## Testing

Use test-first coverage for:

- Clicking `Start` opens the overlay and calls `window.open` from the click path.
- The delayed LeetCode launch assigns the opened tab location.
- The timer updates the document title while active and restores it afterward.
- Warning callbacks/audio fire once for five minutes, one minute, and zero.
- Result mode submits `notes`, `failureReason`, elapsed duration, and the correct success boolean for each status mapping.

Manual/browser verification should confirm the overlay covers the page cleanly, does not overlap incoherently on mobile widths, and the browser allows the LeetCode tab launch.
