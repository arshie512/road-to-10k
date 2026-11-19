import { Capacitor } from "@capacitor/core";
import { Health } from "@capgo/capacitor-health";

const STORAGE_KEY = "road-to-10k-runs-v1";
const ACTIVITY_STORAGE_KEY = "road-to-10k-activity-v1";
const START_STORAGE_KEY = "road-to-10k-start-date-v1";
const CHECKPOINT_STORAGE_KEY = "road-to-10k-checkpoint-date-v1";
const GOAL_STORAGE_KEY = "road-to-10k-goal-distance-v1";
const QUOTE_STORAGE_KEY = "road-to-10k-quote-v1";
const DEFAULT_START_DATE = "2026-12-01";
const DEFAULT_CHECKPOINT_DATE = "2026-12-30";
const BASELINE_KM = 1;
const DEFAULT_GOAL_KM = 10;
const MIN_GOAL_KM = 1;
const MAX_GOAL_KM = 100;
const MOTIVATIONAL_LINES = [
  "Slow is a pace. Showing up is the win.",
  "A short run still moves you forward.",
  "You can begin again at the very next step.",
  "Progress is allowed to be quiet.",
  "Your effort counts, even when nobody sees it.",
  "Keep the promise small enough to keep.",
  "Every steady day is building something.",
  "You do not have to feel ready to begin.",
  "Rest is part of the distance, too.",
  "One good choice can change the shape of a day.",
  "Meet yourself where you are, then go gently.",
  "A little farther is still farther.",
  "There is no rush in a real beginning.",
  "Your next step is enough for right now.",
  "Consistency can be kind and still be strong.",
  "Let today be a practice, not a test.",
  "You are allowed to take the scenic route.",
  "Small wins make a path you can follow.",
  "The work is becoming someone who returns.",
  "Take a breath. Then take the next step.",
  "A gentler pace can carry you a long way.",
  "The finish starts with deciding to begin.",
  "You are building trust with every promise kept.",
  "There is strength in starting where you are.",
  "Today's effort is enough to be proud of.",
  "Keep going in a way that lets you keep going.",
  "The road gets shorter one step at a time.",
  "You do not need a perfect day to make progress.",
  "A pause is not the end of your story.",
  "You are closer than you were when you started."
];

const $ = (selector) => document.querySelector(selector);
const today = atMidnight(new Date());

function atMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function localDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value, options = { day: "numeric", month: "short", year: "numeric" }) {
  return parseDate(value).toLocaleDateString("en-IN", options);
}

function isValidDateValue(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = parseDate(value);
  return Number.isFinite(date.getTime())
    && date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

function loadStoredDate(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved && isValidDateValue(saved) ? saved : fallback;
  } catch {
    return fallback;
  }
}

function loadStoredGoalDistance() {
  try {
    const saved = Number(localStorage.getItem(GOAL_STORAGE_KEY));
    return Number.isFinite(saved) && saved >= MIN_GOAL_KM && saved <= MAX_GOAL_KM
      ? Math.round(saved * 10) / 10
      : DEFAULT_GOAL_KM;
  } catch {
    return DEFAULT_GOAL_KM;
  }
}

function formatDistance(distance) {
  return Number.isInteger(distance) ? String(distance) : Number(distance).toFixed(1);
}

function shiftDate(value, offset) {
  const date = parseDate(value);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMilestones() {
  const spanDays = Math.max(0, Math.round((parseDate(checkpointDate) - parseDate(startDate)) / 86400000));
  const goalTitle = `Reach your ${formatDistance(goalDistance)} km goal`;
  if (spanDays === 0) {
    return [{ date: checkpointDate, title: goalTitle, kind: "Goal day" }];
  }

  const plan = [{ offset: 0, title: `Start with your ${formatDistance(BASELINE_KM)} km baseline`, kind: "Start" }];
  const distanceAt = (fraction) => Math.round((BASELINE_KM + (goalDistance - BASELINE_KM) * fraction) * 10) / 10;
  if (spanDays >= 10 && goalDistance > BASELINE_KM) {
    plan.push(
      { offset: Math.round(spanDays / 3), title: `Build toward ${formatDistance(distanceAt(1 / 3))} km`, kind: "Progression" },
      { offset: Math.round((spanDays * 2) / 3), title: `Build toward ${formatDistance(distanceAt(2 / 3))} km`, kind: "Steady run" },
      { offset: spanDays - 2, title: "Easy run and recovery", kind: "Recovery" },
    );
  } else if (spanDays >= 4 && goalDistance > BASELINE_KM) {
    plan.push({ offset: Math.floor(spanDays / 2), title: `Build toward ${formatDistance(distanceAt(0.5))} km`, kind: "Build" });
  }
  if (spanDays >= 2 && spanDays < 10) plan.push({ offset: spanDays - 1, title: "Rest, hydrate and prepare", kind: "Rest day" });
  plan.push({ offset: spanDays, title: goalTitle, kind: "Goal day" });

  return plan.map((item) => ({ ...item, date: shiftDate(startDate, item.offset) }));
}

function loadRuns() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((run) => Number.isFinite(Number(run.distance)) && run.date) : [];
  } catch {
    return [];
  }
}

function loadActivityRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(ACTIVITY_STORAGE_KEY) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};

    return Object.fromEntries(Object.entries(saved)
      .filter(([date, record]) => isValidDateValue(date) && date <= localDateValue(today) && record && typeof record === "object")
      .map(([date, record]) => [date, {
        steps: isValidMetric(record.steps, 0, 250000) ? Number(record.steps) : null,
        calories: isValidMetric(record.calories, 0, 10000) ? Number(record.calories) : null,
        heartRate: isValidMetric(record.heartRate, 25, 240) ? Number(record.heartRate) : null,
        source: record.source === "health" ? "health" : "manual"
      }])
      .filter(([, record]) => record.steps !== null || record.calories !== null || record.heartRate !== null));
  } catch {
    return {};
  }
}

function isValidMetric(value, minimum, maximum) {
  return value !== null && value !== "" && Number.isFinite(Number(value)) && Number(value) >= minimum && Number(value) <= maximum;
}

function loadQuoteIndex() {
  const dayNumber = Math.floor((parseDate(localDateValue(today)) - parseDate("2026-01-01")) / 86400000);
  const dailyIndex = ((dayNumber % MOTIVATIONAL_LINES.length) + MOTIVATIONAL_LINES.length) % MOTIVATIONAL_LINES.length;
  try {
    const [savedDate, savedIndex] = (localStorage.getItem(QUOTE_STORAGE_KEY) || "").split("|");
    const index = Number(savedIndex);
    return savedDate === localDateValue(today) && Number.isInteger(index) && index >= 0 && index < MOTIVATIONAL_LINES.length
      ? index
      : dailyIndex;
  } catch {
    return dailyIndex;
  }
}

let runs = loadRuns();
let activityRecords = loadActivityRecords();
let quoteIndex = loadQuoteIndex();
let startDate = loadStoredDate(START_STORAGE_KEY, DEFAULT_START_DATE);
let checkpointDate = loadStoredDate(CHECKPOINT_STORAGE_KEY, DEFAULT_CHECKPOINT_DATE);
let goalDistance = loadStoredGoalDistance();
if (parseDate(checkpointDate) < parseDate(startDate)) {
  startDate = DEFAULT_START_DATE;
  checkpointDate = DEFAULT_CHECKPOINT_DATE;
}

function renderCountdown() {
  const delta = Math.round((parseDate(checkpointDate) - today) / 86400000);
  const days = Math.abs(delta);
  const unit = days === 1 ? "day" : "days";
  $("#days-left").textContent = delta === 0 ? "Today" : days;
  $("#countdown-label").textContent = delta === 0
    ? "is your goal date"
    : delta > 0
      ? `${unit} to your goal date`
      : `${unit} since your goal date`;
}

function renderCheckpointDate() {
  const date = parseDate(checkpointDate);
  const fullDate = date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#start-date").value = startDate;
  $("#checkpoint-date").value = checkpointDate;
  $("#checkpoint-date-display").textContent = `Goal date · ${fullDate.replace(",", " ·")}`;
  $("#goal-date-stat").textContent = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function renderMilestones() {
  const milestones = getMilestones();
  const upcoming = milestones.find((item) => parseDate(item.date) >= today);
  const container = $("#milestone-list");
  container.replaceChildren();

  for (const item of milestones) {
    const date = parseDate(item.date);
    const isPast = date < today;
    const isToday = date.getTime() === today.getTime();
    const isNext = upcoming?.date === item.date;
    const row = document.createElement("article");
    row.className = `milestone${isNext ? " is-next" : ""}`;

    const dateEl = document.createElement("span");
    dateEl.className = "milestone-date";
    dateEl.textContent = formatDate(item.date, { weekday: "short", day: "numeric", month: "short" });

    const title = document.createElement("strong");
    title.className = "milestone-name";
    title.textContent = item.title;

    const kind = document.createElement("span");
    kind.className = "milestone-kind";
    kind.textContent = isToday ? "Today" : isPast ? "Earlier" : isNext ? "Up next" : item.kind;

    row.append(dateEl, title, kind);
    container.append(row);
  }
}

function bestDistance() {
  return Math.max(BASELINE_KM, ...runs.map((run) => Number(run.distance)));
}

function renderProgress() {
  const best = bestDistance();
  const percent = Math.min(100, (best / goalDistance) * 100);
  const formattedGoal = formatDistance(goalDistance);
  $("#best-distance").textContent = best.toFixed(1);
  $("#goal-distance-display").textContent = `${formattedGoal} KM`;
  $("#goal-distance-summary").textContent = `${formattedGoal} km`;
  $("#goal-distance-stat").textContent = `${formattedGoal} km`;
  $("#goal-start-label").textContent = `${formatDistance(BASELINE_KM)} km`;
  $("#goal-end-label").textContent = `${formattedGoal} km`;
  $("#goal-progress-fill").style.width = `${Math.max(percent, 1.5)}%`;
  $("#goal-progress").setAttribute("aria-valuenow", Math.min(best, goalDistance).toFixed(1));
  $("#goal-progress").setAttribute("aria-valuemax", String(goalDistance));
  $("#goal-progress").setAttribute("aria-label", `Longest run toward your ${formattedGoal} kilometre goal`);
  $("#goal-progress").setAttribute("aria-valuetext", `${best.toFixed(1)} kilometres run toward a ${formattedGoal} kilometre goal`);
  $("#progress-percent").textContent = percent >= 100 ? "Goal reached · keep building" : `${Math.floor(percent)}% of your goal`;
  document.querySelectorAll("[data-goal-distance]").forEach((button) => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.goalDistance) === goalDistance));
  });
}

function renderRuns() {
  const list = $("#run-list");
  list.replaceChildren();
  $("#run-count").textContent = `${runs.length} ${runs.length === 1 ? "ENTRY" : "ENTRIES"}`;

  if (runs.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.append("Your baseline is ");
    const baseline = document.createElement("b");
    baseline.textContent = "1.0 km";
    empty.append(baseline, " from the original poster. Add your next run when you’re ready.");
    list.append(empty);
    return;
  }

  [...runs]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 8)
    .forEach((run) => {
      const row = document.createElement("article");
      row.className = "run-entry";
      const details = document.createElement("div");
      details.className = "run-entry-main";
      const date = document.createElement("span");
      date.className = "run-entry-date";
      date.textContent = formatDate(run.date);
      details.append(date);
      if (run.note) {
        const note = document.createElement("span");
        note.className = "run-entry-note";
        note.textContent = run.note;
        details.append(note);
      }
      const distance = document.createElement("strong");
      distance.className = "run-entry-distance";
      distance.textContent = `${Number(run.distance).toFixed(1)} km`;
      row.append(details, distance);
      list.append(row);
    });
}

function renderQuote() {
  $("#daily-quote").textContent = `“${MOTIVATIONAL_LINES[quoteIndex]}”`;
}

function setActivityMetric(valueSelector, captionSelector, value, missingCaption, source, format = (number) => new Intl.NumberFormat("en-IN").format(number)) {
  $(valueSelector).textContent = value === null || value === undefined ? "—" : format(value);
  $(captionSelector).textContent = value === null || value === undefined
    ? missingCaption
    : source === "health" ? "Synced from your health app" : "Saved from your check-in";
}

function renderActivity() {
  const selectedDate = $("#activity-date").value || localDateValue(today);
  const record = activityRecords[selectedDate] || {};
  const isToday = selectedDate === localDateValue(today);
  $("#activity-date-label").textContent = isToday
    ? "Today"
    : parseDate(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  setActivityMetric("#activity-steps-value", "#activity-steps-caption", record.steps ?? null, "Not added for this day", record.source);
  setActivityMetric("#activity-calories-value", "#activity-calories-caption", record.calories ?? null, "Not added for this day", record.source);
  $("#activity-heart-label").textContent = record.source === "health" ? "AVERAGE HEART RATE" : "HEART RATE";
  setActivityMetric("#activity-heart-value", "#activity-heart-caption", record.heartRate ?? null, "Not added for this day", record.source, (number) => String(number));

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(selectedDate, index - 6);
    return { date, record: activityRecords[date] || null };
  });
  const firstDate = parseDate(days[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const lastDate = parseDate(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  $("#week-range-label").textContent = `${firstDate} – ${lastDate}`;

  const knownStepValues = days.map(({ record: dayRecord }) => dayRecord?.steps).filter((value) => value !== null && value !== undefined);
  const maximumSteps = Math.max(1, ...knownStepValues);
  const chart = $("#week-chart");
  chart.replaceChildren();

  for (const { date, record: dayRecord } of days) {
    const steps = dayRecord?.steps ?? null;
    const column = document.createElement("div");
    column.className = "week-day";
    column.setAttribute("role", "listitem");
    const label = parseDate(date).toLocaleDateString("en-IN", { weekday: "short" });
    const value = document.createElement("span");
    value.className = "week-day-value";
    value.textContent = steps === null ? "—" : steps >= 1000 ? `${(steps / 1000).toFixed(steps >= 10000 ? 0 : 1)}k` : String(steps);
    const track = document.createElement("div");
    track.className = "week-bar-track";
    const fill = document.createElement("span");
    fill.className = "week-bar-fill";
    fill.style.height = steps === null ? "3px" : `${Math.max(5, (steps / maximumSteps) * 100)}%`;
    track.append(fill);
    const day = document.createElement("span");
    day.className = "week-day-label";
    day.textContent = label;
    column.setAttribute("aria-label", `${label}, ${formatDate(date)}: ${steps === null ? "no step entry" : `${new Intl.NumberFormat("en-IN").format(steps)} steps`}`);
    column.append(value, track, day);
    chart.append(column);
  }

  const savedDays = days.filter(({ record: dayRecord }) => dayRecord);
  if (savedDays.length === 0) {
    $("#week-summary").textContent = "Your weekly view will grow with each check-in.";
  } else {
    const summary = [];
    if (days.some(({ record: dayRecord }) => dayRecord?.steps !== null && dayRecord?.steps !== undefined)) {
      const stepTotal = days.reduce((total, { record: dayRecord }) => total + (dayRecord?.steps ?? 0), 0);
      summary.push(`${new Intl.NumberFormat("en-IN").format(stepTotal)} saved steps`);
    }
    if (days.some(({ record: dayRecord }) => dayRecord?.calories !== null && dayRecord?.calories !== undefined)) {
      const calorieTotal = days.reduce((total, { record: dayRecord }) => total + (dayRecord?.calories ?? 0), 0);
      summary.push(`${new Intl.NumberFormat("en-IN").format(calorieTotal)} active kcal`);
    }
    const heartReadings = days.map(({ record: dayRecord }) => dayRecord?.heartRate).filter((value) => value !== null && value !== undefined);
    if (heartReadings.length) {
      const average = Math.round(heartReadings.reduce((total, value) => total + value, 0) / heartReadings.length);
      summary.push(`${average} bpm average of ${heartReadings.length} saved ${heartReadings.length === 1 ? "reading" : "readings"}`);
    }
    $("#week-summary").textContent = summary.join(" · ");
  }
}

function loadActivityDraft() {
  const date = $("#activity-date").value;
  const record = activityRecords[date] || {};
  $("#activity-steps").value = record.steps ?? "";
  $("#activity-calories").value = record.calories ?? "";
  $("#activity-heart-rate").value = record.heartRate ?? "";
  $("#activity-message").textContent = "";
  renderActivity();
}

function saveActivityRecords() {
  try {
    localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(activityRecords));
    return true;
  } catch {
    return false;
  }
}

function mergeHealthSamples(samples, field, aggregation, changedDates) {
  for (const sample of samples || []) {
    const date = localDateValue(new Date(sample.startDate));
    const rawValue = Number(sample.values?.[aggregation] ?? sample.value);
    if (!isValidDateValue(date) || date > localDateValue(today) || !Number.isFinite(rawValue) || rawValue < 0) continue;

    const record = activityRecords[date] || { steps: null, calories: null, heartRate: null, source: "health" };
    record[field] = Math.round(rawValue);
    record.source = "health";
    activityRecords[date] = record;
    changedDates.add(date);
  }
}

function initializeHealthSync() {
  const isNativeApp = Capacitor.isNativePlatform();
  $("#health-sync-label").textContent = isNativeApp ? "Not connected" : "Manual for now";
  $("#wearable-heading").textContent = isNativeApp ? "WATCH SYNC · YOUR HEALTH APP" : "WATCH SYNC · MANUAL FOR NOW";
  $("#wearable-description").textContent = isNativeApp
    ? "Sync daily totals from Apple Health on iPhone or Health Connect on Android. Your watch must share its readings with that health app."
    : "Enter readings from your watch app here. Automatic Apple Health or Android Health Connect syncing needs the Road to 10K+ phone app; support depends on your watch and its app.";
  $("#sync-health-data").textContent = isNativeApp ? "Sync health data" : "Why can’t I connect here?";
  $("#health-sync-status").textContent = isNativeApp
    ? "Connect to request permission for steps, active calories, and heart rate. Readings stay on this device."
    : "This browser can save manual entries. It cannot request watch-health permissions.";

  $("#sync-health-data").addEventListener("click", async () => {
    const status = $("#health-sync-status");
    const button = $("#sync-health-data");
    if (!Capacitor.isNativePlatform()) {
      status.textContent = "Automatic syncing needs the installable phone app. You can still enter numbers from your watch here.";
      return;
    }

    button.disabled = true;
    button.textContent = "Connecting…";
    status.textContent = "Checking health data access…";
    $("#health-sync-label").textContent = "Checking…";
    $("#health-sync-badge").classList.remove("is-connected");
    try {
      const availability = await Health.isAvailable();
      if (!availability.available) {
        $("#health-sync-label").textContent = "Unavailable";
        status.textContent = availability.reason || "Health data access is not available on this phone.";
        return;
      }

      await Health.requestAuthorization({ read: ["steps", "calories", "heartRate"], write: [] });
      const startDate = parseDate(shiftDate(localDateValue(today), -6)).toISOString();
      const endDate = new Date().toISOString();
      const results = await Promise.allSettled([
        Health.queryAggregated({ dataType: "steps", startDate, endDate, bucket: "day", aggregation: "sum" }),
        Health.queryAggregated({ dataType: "calories", startDate, endDate, bucket: "day", aggregation: "sum" }),
        Health.queryAggregated({ dataType: "heartRate", startDate, endDate, bucket: "day", aggregation: "average" })
      ]);

      const changedDates = new Set();
      const imported = [
        [results[0], "steps", "sum"],
        [results[1], "calories", "sum"],
        [results[2], "heartRate", "average"]
      ];
      for (const [result, field, aggregation] of imported) {
        if (result.status === "fulfilled") mergeHealthSamples(result.value.samples, field, aggregation, changedDates);
      }

      if (changedDates.size === 0) {
        const failed = results.find((result) => result.status === "rejected");
        $("#health-sync-label").textContent = "No data yet";
        status.textContent = failed
          ? "Could not read health data. Check the app’s permissions and try again."
          : "No readings found. Check permissions and that your watch app syncs to Apple Health or Health Connect.";
        return;
      }
      if (!saveActivityRecords()) {
        $("#health-sync-label").textContent = "Not saved";
        status.textContent = "The readings were found, but this phone could not save them. Check available storage and try again.";
        return;
      }

      $("#activity-date").value = localDateValue(today);
      loadActivityDraft();
      $("#health-sync-label").textContent = "Synced";
      $("#health-sync-badge").classList.add("is-connected");
      status.textContent = `Synced ${changedDates.size} ${changedDates.size === 1 ? "day" : "days"}. Your data stays on this device.`;
    } catch {
      $("#health-sync-label").textContent = "Not connected";
      status.textContent = "Could not connect right now. Check permissions and try again.";
    } finally {
      button.disabled = false;
      button.textContent = "Sync health data";
    }
  });
}

function saveRuns() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function init() {
  const startInput = $("#start-date");
  const checkpointInput = $("#checkpoint-date");
  const goalInput = $("#goal-distance");
  startInput.value = startDate;
  checkpointInput.value = checkpointDate;
  goalInput.value = formatDistance(goalDistance);
  renderCountdown();
  renderCheckpointDate();
  renderMilestones();
  renderProgress();
  renderRuns();

  const activityDateInput = $("#activity-date");
  activityDateInput.max = localDateValue(today);
  activityDateInput.value = localDateValue(today);
  loadActivityDraft();

  activityDateInput.addEventListener("change", () => {
    if (!isValidDateValue(activityDateInput.value)) return;
    loadActivityDraft();
  });

  $("#activity-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const date = activityDateInput.value;
    const fields = {
      steps: $("#activity-steps").value.trim(),
      calories: $("#activity-calories").value.trim(),
      heartRate: $("#activity-heart-rate").value.trim()
    };

    if (!isValidDateValue(date) || date > localDateValue(today)) {
      $("#activity-message").textContent = "Choose today or an earlier day for your check-in.";
      return;
    }
    if (Object.values(fields).every((value) => value === "")) {
      $("#activity-message").textContent = "Add at least one number to save your check-in.";
      return;
    }
    if ((fields.steps !== "" && !isValidMetric(fields.steps, 0, 250000))
      || (fields.calories !== "" && !isValidMetric(fields.calories, 0, 10000))
      || (fields.heartRate !== "" && !isValidMetric(fields.heartRate, 25, 240))) {
      $("#activity-message").textContent = "Check the numbers and try again.";
      return;
    }

    const previousRecord = activityRecords[date];
    activityRecords[date] = {
      steps: fields.steps === "" ? null : Number(fields.steps),
      calories: fields.calories === "" ? null : Number(fields.calories),
      heartRate: fields.heartRate === "" ? null : Number(fields.heartRate),
      source: "manual"
    };
    if (!saveActivityRecords()) {
      if (previousRecord) activityRecords[date] = previousRecord;
      else delete activityRecords[date];
      $("#activity-message").textContent = "This browser could not save the check-in. Please try again.";
      return;
    }

    renderActivity();
    $("#activity-message").textContent = "Saved. You can edit this day any time.";
  });

  initializeHealthSync();

  $("#next-quote").addEventListener("click", () => {
    quoteIndex = (quoteIndex + 1) % MOTIVATIONAL_LINES.length;
    renderQuote();
    try {
      localStorage.setItem(QUOTE_STORAGE_KEY, `${localDateValue(today)}|${quoteIndex}`);
    } catch {
      // The quote still changes for this visit if browser storage is unavailable.
    }
  });
  renderQuote();

  const handleDateRangeChange = () => {
    if (!isValidDateValue(startInput.value) || !isValidDateValue(checkpointInput.value)) {
      $("#checkpoint-date-status").textContent = "Choose both dates to update your plan.";
      return;
    }
    if (parseDate(checkpointInput.value) < parseDate(startInput.value)) {
      $("#checkpoint-date-status").textContent = "Your end date must be on or after your start date.";
      return;
    }

    startDate = startInput.value;
    checkpointDate = checkpointInput.value;
    try {
      localStorage.setItem(START_STORAGE_KEY, startDate);
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, checkpointDate);
      $("#checkpoint-date-status").textContent = "Date range saved in this browser.";
    } catch {
      $("#checkpoint-date-status").textContent = "Date range updated for this visit.";
    }
    renderCountdown();
    renderCheckpointDate();
    renderMilestones();
  };
  startInput.addEventListener("change", handleDateRangeChange);
  checkpointInput.addEventListener("change", handleDateRangeChange);

  const updateGoalDistance = () => {
    const nextGoal = Number(goalInput.value);
    if (!Number.isFinite(nextGoal) || nextGoal < MIN_GOAL_KM || nextGoal > MAX_GOAL_KM) {
      goalInput.value = formatDistance(goalDistance);
      $("#goal-distance-status").textContent = `Choose a goal from ${MIN_GOAL_KM} to ${MAX_GOAL_KM} km.`;
      return;
    }

    goalDistance = Math.round(nextGoal * 10) / 10;
    goalInput.value = formatDistance(goalDistance);
    try {
      localStorage.setItem(GOAL_STORAGE_KEY, String(goalDistance));
      $("#goal-distance-status").textContent = "Distance goal saved in this browser.";
    } catch {
      $("#goal-distance-status").textContent = "Distance goal updated for this visit.";
    }
    renderProgress();
    renderMilestones();
  };
  goalInput.addEventListener("change", updateGoalDistance);
  document.querySelectorAll("[data-goal-distance]").forEach((button) => {
    button.addEventListener("click", () => {
      goalInput.value = button.dataset.goalDistance;
      updateGoalDistance();
    });
  });

  const dateInput = $("#run-date");
  const now = new Date();
  dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  $("#run-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const distance = Number(form.get("distance"));
    const date = String(form.get("date"));
    const note = String(form.get("note") || "").trim();
    if (!Number.isFinite(distance) || distance < 0.1 || distance > 100 || !date) return;

    runs.push({ distance, date, note, createdAt: Date.now() });
    saveRuns();
    renderRuns();
    renderProgress();
    event.currentTarget.reset();
    dateInput.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    $("#form-message").textContent = `Run saved · ${distance.toFixed(1)} km added to your log.`;
    $("#run-distance").focus();
  });
}

init();

