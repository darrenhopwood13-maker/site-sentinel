# Day timeline, instant reports, zone dropdown

Three focused changes to the Day View, all frontend.

## 1. Day timeline
Replace the plain "Today's log" list with a vertical timeline running down the screen:
- A time rail on the left (HH:MM) with a marker per entry, colour-coded by capture type (tap, photo, voice).
- Entries in chronological order (earliest at the top, newest at the bottom) so the day reads forward toward Reports.
- Each row keeps the existing card content: photo thumbnail or type icon, section + zone, label, and the "Check me — confirm / Bin it" actions.
- A closing "Reports" marker at the end of the rail showing the total number of entries logged so far, so the run-up to reports is visible.
- Empty state keeps the existing "How the day flows" card.

## 2. Generate reports now
Add a full-width "Generate my reports now" button on the Day View, directly below the timeline:
- Taps through to the Reports screen with the customer report auto-started, so the result appears without extra taps.
- The Reports screen keeps its three existing buttons for the other report types; nothing about report generation logic changes.

## 3. Zone picker as a dropdown
Replace the horizontal scrolling zone strip with a single tap-to-open dropdown:
- One large button showing the current zone plus coverage count ("Ground - 2/6 zones covered").
- Tapping opens a sheet listing all six zones as big thumb-sized rows, each with a green dot when that zone already has a photo.
- Selecting a zone closes the sheet. No keyboard, no horizontal scrolling.

## Technical notes
- `src/routes/index.tsx`: timeline rendering, chronological sort, the new button, and dropdown state.
- `src/components/ZoneStrip.tsx` is replaced by a new `ZonePicker.tsx` (button + sheet), same props.
- Auto-start: navigate to `/reports?generate=customer`; `src/routes/reports.tsx` reads the search param on mount and runs that report once.
- No backend, schema, or AI prompt changes.
