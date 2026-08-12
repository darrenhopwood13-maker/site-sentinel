# Make the daily workflow and "5pm" obvious

The app currently works, but the user cannot see how the daily captures turn into reports and the "5pm" button is confusing. We will make the flow self-explanatory without adding typing or complexity.

## What we will change

1. Rename the "5pm" button
   - Change the bottom-right capture-bar button label from "5pm" to "Reports".
   - Keep the link to `/reports`.
   - Add a small subtitle on the Reports screen explaining that reports are built from today's captures and can be shared at the end of the day.

2. Add a first-run welcome overlay
   - Show a 3-step overlay the first time the app opens.
   - Steps: 1) Pick your zone, 2) Tap / photo / voice to log, 3) Tap Reports at the end of the day.
   - Store a "hasSeenWelcome" flag in `localStorage` so it only appears once.
   - One "Got it" button to dismiss; no forms or text entry.

3. Improve in-screen labels
   - Change the section sheet subtext from "One tap logs it. No typing." to a line that names the action, e.g. "Tap a chip to log it under {section} in {zone}.".
   - Add a short, non-blocking hint card at the top of the log when it is empty: "Pick a zone, then tap a button, take a photo, or record a voice note."
   - On the Reports screen, add a one-line explanation above each report type: "Built from today's photos, voice notes and taps."

4. Keep existing behaviour intact
   - No changes to the capture pipeline, AI analysis, report generation, auth, or database schema.
   - No new text input fields; the workflow stays tap/photo/voice only.

## Technical details

- Files to edit:
  - `src/components/CaptureBar.tsx` — rename the "5pm" button label to "Reports".
  - `src/routes/index.tsx` — add the welcome overlay component, the empty-state hint, and the dynamic section-sheet subtext.
  - `src/routes/reports.tsx` — add the end-of-day explanation and per-report helper text.
- State: the welcome overlay will use `localStorage` key `instructbrain-welcome-seen` (or similar) read in a `useEffect` to avoid SSR/hydration mismatch.
- No new dependencies, no backend changes.
