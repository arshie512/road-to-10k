# Road to 10K

A small, responsive running journal built around the original `run3` and `run4` posters. The page reflects the milestones shown in those images:

- Starting point: 1 km
- December 1–30, 2026 date range by default, with a 2–3 km checkpoint on December 30
- Long-term goal: 10 km

Visitors can change both the start and checkpoint dates on the page. The countdown and training milestones adjust to the selected range, and the dates are saved in that browser. The run log and best distance are also stored locally; neither is sent to a server.

The daily activity check-in lets visitors save steps, active calories, and a heart-rate reading for a selected day. It shows a seven-day steps view and keeps records in the current browser. Motivational lines rotate by day, and visitors can choose another line at any time.

## Wearable data

The website keeps manual entry for browsers. The companion app can read daily steps, active calories, and average heart rate from Apple Health on iPhone or Health Connect on Android, after the user grants read access. The user taps **Sync health data** to refresh the last seven days. Data stays in local app storage and is not uploaded to a server.

The watch must first share its readings with Apple Health or Health Connect. Support depends on the watch model and its companion app, so direct connection to every watch is not guaranteed. The phone app requests read access only; it does not write health data.

## Run locally

Run `npm ci`, then `npm run start` and open the local address shown in the terminal. Create the production website with `npm run build`.

## Phone companion

Generate a native project with `npx cap add android` or `npx cap add ios`, then run `node scripts/prepare-native.mjs android` or `node scripts/prepare-native.mjs ios` for the required health permissions and privacy settings. Use `npm run cap:sync` after website changes. Open the generated project in Android Studio or Xcode to build locally. Android builds need the Android SDK and Java 21. iOS device builds need Xcode and an Apple signing setup with the HealthKit capability enabled.

The **Build phone apps** workflow builds an Android debug APK and an iOS simulator app on GitHub Actions. The iOS simulator file is not installable on a physical iPhone; publishing an iPhone app requires Apple signing and a developer account.

## Publish with GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the website and deploys `dist/` to GitHub Pages whenever a commit is pushed to `main`. In the repository's Pages settings, select **GitHub Actions** as the build and deployment source if it is not already selected.

## Project files

- `index.html` — page structure and copy
- `styles.css` — responsive visual design
- `app.js` — editable date range, running plan, run log, activity check-in, HealthKit/Health Connect sync, and motivational lines
- `assets/run3.png`, `assets/run4.png` — supplied project posters
- `scripts/prepare-native.mjs` — minimal platform health permissions and privacy setup
- `public/privacypolicy.html` — health-data permission privacy notice
