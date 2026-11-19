# Road to 10K

A small, responsive running journal built around the original `run3` and `run4` posters. The page reflects the milestones shown in those images:

- Starting point: 1 km
- December 1–30, 2026 date range by default, with a 2–3 km checkpoint on December 30
- Long-term goal: 10 km

Visitors can change both the start and checkpoint dates on the page. The countdown and training milestones adjust to the selected range, and the dates are saved in that browser. The run log and best distance are also stored locally; neither is sent to a server.

The daily activity check-in lets visitors save steps, active calories, and a heart-rate reading for a selected day. It shows a seven-day steps view and keeps records in the current browser. Motivational lines rotate by day, and visitors can choose another line at any time.

## Wearable data

This GitHub Pages site does not connect directly to smartwatches. For now, visitors can copy readings from a watch or fitness app into the daily check-in. Automatic Apple Health or Android Health Connect syncing needs a native phone companion app, user permissions, and support from the watch's companion app. Saved activity data remains in the visitor's browser and is not uploaded.

## Run locally

Open `index.html` in a browser, or serve this folder with any static file server.

## Publish with GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the repository root to GitHub Pages whenever a commit is pushed to `main`. In the repository's Pages settings, select **GitHub Actions** as the build and deployment source if it is not already selected.

## Project files

- `index.html` — page structure and copy
- `styles.css` — responsive visual design
- `app.js` — editable date range, adjusted milestones, countdown, local run log, daily activity history, and motivational lines
- `assets/run3.png`, `assets/run4.png` — supplied project posters

