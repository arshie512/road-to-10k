# Road to 10K+

A responsive running journal inspired by the original `run3` and `run4` posters. The poster's 10K goal is the starting idea; each visitor can set a personal goal from 1 km to 100 km.

## Personalise your plan

- Change the start date and goal date whenever you need to.
- Choose a distance goal directly or use the 5K, 10K, half-marathon, and marathon quick picks.
- Watch the countdown, progress bar, goal summaries, and training milestones update to match your choices.
- Save your goal and dates in the current browser. They are not sent to a server.

The run log and daily activity check-in are also saved locally. Daily activity includes steps, active calories, heart rate, and a seven-day step view. Motivational lines rotate daily, with an option to choose another.

## Wearable data

The website supports manual entry. The phone companion can read daily steps, active calories, and average heart rate from Apple Health on iPhone or Health Connect on Android after the user grants read access. Tap **Sync health data** to refresh the last seven days. Health readings stay in local app storage and are not uploaded.

A watch must first share its readings with Apple Health or Health Connect. Support depends on the watch model and its companion app, so direct connection to every watch is not guaranteed. The phone app requests read access only; it does not write health data.

## Run locally

Run `npm ci`, then `npm run start` and open the local address shown in the terminal. Create the production website with `npm run build`.

## Phone companion

Generate a native project with `npx cap add android` or `npx cap add ios`, then run `node scripts/prepare-native.mjs android` or `node scripts/prepare-native.mjs ios` for the required health permissions and privacy settings. Use `npm run cap:sync` after website changes. Open the generated project in Android Studio or Xcode to build locally. Android builds need the Android SDK and Java 21. iOS device builds need Xcode and an Apple signing setup with the HealthKit capability enabled.

The **Build phone apps** workflow builds an Android debug APK and an iOS simulator app on GitHub Actions. The iOS simulator file is not installable on a physical iPhone; publishing an iPhone app requires Apple signing and a developer account.

## Publish with GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the website and deploys `dist/` to GitHub Pages whenever a commit is pushed to `main`. In the repository's Pages settings, select **GitHub Actions** as the build and deployment source if it is not already selected.

## Project files

- `index.html` — website layout and copy
- `styles.css` — responsive visual design
- `app.js` — personal goal and date settings, progress, milestones, run log, daily activity, health sync, and motivational lines
- `assets/run3.png`, `assets/run4.png` — supplied project posters
- `scripts/prepare-native.mjs` — health permissions and privacy setup for phone builds
- `public/privacypolicy.html` — health-data permission notice

