# Road to 10K

A small, responsive running journal built around the original `run3` and `run4` posters. The page reflects the milestones shown in those images:

- Starting point: 1 km
- December 5, 2026 checkpoint: 2–3 km
- Long-term goal: 10 km

The countdown updates from the viewer's local date. The run log and best distance are stored in the browser's local storage; they are not sent to a server.

## Run locally

Open `index.html` in a browser, or serve this folder with any static file server.

## Publish with GitHub Pages

The workflow in `.github/workflows/pages.yml` deploys the repository root to GitHub Pages whenever a commit is pushed to `main`. In the repository's Pages settings, select **GitHub Actions** as the build and deployment source if it is not already selected.

## Project files

- `index.html` — page structure and copy
- `styles.css` — responsive visual design
- `app.js` — countdown, milestones, and local run log
- `assets/run3.png`, `assets/run4.png` — supplied project posters

