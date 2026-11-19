const STORAGE_KEY = "road-to-10k-runs-v1";
const CHECKPOINT_STORAGE_KEY = "road-to-10k-checkpoint-date-v1";
const DEFAULT_CHECKPOINT_DATE = "2026-12-30";
const BASELINE_KM = 1;
const GOAL_KM = 10;

const milestonePlan = [
  { offset: -14, title: "Build toward 1.5 km", kind: "Easy progression" },
  { offset: -7, title: "Build toward 2 km", kind: "Steady run" },
  { offset: -3, title: "Easy run and recovery", kind: "Recovery" },
  { offset: -1, title: "Rest, hydrate and prepare", kind: "Rest day" },
  { offset: 0, title: "Personal 2–3 km milestone", kind: "Checkpoint" },
];

const $ = (selector) => document.querySelector(selector);
const today = atMidnight(new Date());

function atMidnight(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

function loadCheckpointDate() {
  try {
    const saved = localStorage.getItem(CHECKPOINT_STORAGE_KEY);
    return saved && isValidDateValue(saved) ? saved : DEFAULT_CHECKPOINT_DATE;
  } catch {
    return DEFAULT_CHECKPOINT_DATE;
  }
}

function shiftDate(value, offset) {
  const date = parseDate(value);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getMilestones() {
  return milestonePlan.map((item) => ({
    ...item,
    date: shiftDate(checkpointDate, item.offset),
  }));
}

function loadRuns() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter((run) => Number.isFinite(Number(run.distance)) && run.date) : [];
  } catch {
    return [];
  }
}

let runs = loadRuns();
let checkpointDate = loadCheckpointDate();

function renderCountdown() {
  const delta = Math.round((parseDate(checkpointDate) - today) / 86400000);
  const days = Math.abs(delta);
  const unit = days === 1 ? "day" : "days";
  $("#days-left").textContent = delta === 0 ? "Today" : days;
  $("#countdown-label").textContent = delta === 0
    ? "is your checkpoint"
    : delta > 0
      ? `${unit} to the checkpoint`
      : `${unit} since the checkpoint`;
}

function renderCheckpointDate() {
  const date = parseDate(checkpointDate);
  const fullDate = date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  $("#checkpoint-date").value = checkpointDate;
  $("#checkpoint-date-display").textContent = fullDate.replace(",", " ·");
  $("#checkpoint-stat-date").textContent = `Build steadily by ${date.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`;
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
  const percent = Math.min(100, (best / GOAL_KM) * 100);
  $("#best-distance").textContent = best.toFixed(1);
  $("#goal-progress-fill").style.width = `${Math.max(percent, 1.5)}%`;
  $("#goal-progress").setAttribute("aria-valuenow", best.toFixed(1));
  $("#progress-percent").textContent = `${Math.round(percent)}% of the distance`;
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

function saveRuns() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
}

function init() {
  const checkpointInput = $("#checkpoint-date");
  checkpointInput.value = checkpointDate;
  renderCountdown();
  renderCheckpointDate();
  renderMilestones();
  renderProgress();
  renderRuns();

  checkpointInput.addEventListener("change", () => {
    if (!isValidDateValue(checkpointInput.value)) {
      checkpointInput.value = checkpointDate;
      return;
    }
    checkpointDate = checkpointInput.value;
    try {
      localStorage.setItem(CHECKPOINT_STORAGE_KEY, checkpointDate);
      $("#checkpoint-date-status").textContent = "Date saved in this browser.";
    } catch {
      $("#checkpoint-date-status").textContent = "Date updated for this visit.";
    }
    renderCountdown();
    renderCheckpointDate();
    renderMilestones();
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

