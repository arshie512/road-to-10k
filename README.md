# Road to 10K

A small, responsive running journal built around the original `run3` and `run4` posters. The page reflects the milestones shown in those images:

- Starting point: 1 km
- December 1–30, 2026 date range by default, with a 2–3 km checkpoint on December 30
- Long-term goal: 10 km

Visitors can change both the start and checkpoint dates on the page. The countdown and training milestones adjust to the selected range, and the dates are saved in that browser. The run log and best distance are also stored locally; neither is sent to a server.

## Run locally

Open `index.html` in a browser, or serve this folder with any static file server.

## Publish with GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the repository root to GitHub Pages whenever a commit is pushed to `main`. In the repository's Pages settings, select **GitHub Actions** as the build and deployment source if it is not already selected.

## Project files

- `index.html` — page structure and copy
- `styles.css` — responsive visual design
- `app.js` — editable date range, adjusted milestones, countdown, and local run log
- `assets/run3.png`, `assets/run4.png` — supplied project posters

