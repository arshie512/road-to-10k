import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const platform = process.argv[2];

async function edit(relativePath, transform) {
  const filePath = path.join(root, relativePath);
  let content = await readFile(filePath, "utf8");
  content = transform(content);
  await writeFile(filePath, content, "utf8");
}

async function prepareAndroid() {
  const readOnlyHealthPermissions = new Set([
    "android.permission.health.READ_STEPS",
    "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
    "android.permission.health.READ_HEART_RATE"
  ]);
  const healthTypes = [
    "STEPS", "DISTANCE", "ACTIVE_CALORIES_BURNED", "HEART_RATE", "WEIGHT", "SLEEP",
    "RESPIRATORY_RATE", "OXYGEN_SATURATION", "RESTING_HEART_RATE", "HEART_RATE_VARIABILITY",
    "VO2_MAX", "BLOOD_PRESSURE", "BLOOD_GLUCOSE", "BODY_TEMPERATURE", "HEIGHT",
    "FLOORS_CLIMBED", "BODY_FAT", "BASAL_BODY_TEMPERATURE", "BASAL_METABOLIC_RATE",
    "TOTAL_CALORIES_BURNED", "MINDFULNESS", "HYDRATION", "NUTRITION", "EXERCISE"
  ];
  const permissionNames = healthTypes.flatMap((type) => [
    `android.permission.health.READ_${type}`,
    `android.permission.health.WRITE_${type}`
  ]);
  const removals = permissionNames
    .filter((name) => !readOnlyHealthPermissions.has(name))
    .map((name) => `    <uses-permission android:name="${name}" tools:node="remove" />`)
    .join("\n");

  await edit("android/app/src/main/AndroidManifest.xml", (manifest) => {
    if (!manifest.includes("xmlns:tools=")) {
      manifest = manifest.replace(
        'xmlns:android="http://schemas.android.com/apk/res/android"',
        'xmlns:android="http://schemas.android.com/apk/res/android"\n    xmlns:tools="http://schemas.android.com/tools"'
      );
    }
    if (!manifest.includes('tools:node="remove"')) {
      const applicationStart = manifest.indexOf("<application");
      if (applicationStart < 0) throw new Error("Android manifest has no application element.");
      manifest = `${manifest.slice(0, applicationStart)}${removals}\n\n    ${manifest.slice(applicationStart)}`;
    }
    return manifest;
  });

  await edit("android/variables.gradle", (gradle) => gradle.replace(/minSdkVersion\s*=\s*\d+/, "minSdkVersion = 26"));
  await edit("android/app/src/main/res/values/strings.xml", (strings) => {
    const key = "health_connect_privacy_policy_url";
    if (strings.includes(`name="${key}"`)) return strings;
    return strings.replace(
      "</resources>",
      `    <string name="${key}">https://arshie512.github.io/road-to-10k/privacypolicy.html</string>\n</resources>`
    );
  });
}

async function prepareIos() {
  await edit("ios/App/App/Info.plist", (plist) => {
    if (plist.includes("NSHealthShareUsageDescription")) return plist;
    return plist.replace(
      "</dict>",
      "\t<key>NSHealthShareUsageDescription</key>\n\t<string>Road to 10K reads your steps, active calories, and heart rate to show your daily activity. Your health data stays on this device.</string>\n</dict>"
    );
  });

  const entitlements = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
\t<key>com.apple.developer.healthkit</key>
\t<true/>
</dict>
</plist>
`;
  await writeFile(path.join(root, "ios/App/App/App.entitlements"), entitlements, "utf8");

  await edit("ios/App/App.xcodeproj/project.pbxproj", (project) => {
    const marker = "ASSETCATALOG_COMPILER_APPICON_NAME = AppIcon;";
    if (project.includes("CODE_SIGN_ENTITLEMENTS = App/App.entitlements;")) return project;
    const occurrences = project.split(marker).length - 1;
    if (occurrences < 2) throw new Error("Could not find both iOS app build configurations.");
    return project.replaceAll(marker, `${marker}\n\t\t\t\tCODE_SIGN_ENTITLEMENTS = App/App.entitlements;`);
  });
}

if (platform === "android") {
  await prepareAndroid();
} else if (platform === "ios") {
  await prepareIos();
} else {
  throw new Error("Choose a native platform: android or ios.");
}

console.log(`Prepared the ${platform} health permissions and privacy settings.`);
