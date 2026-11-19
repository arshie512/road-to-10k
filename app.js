const CHECKPOINT_DATE = "2026-12-05";
const STORAGE_KEY = "road-to-10k-runs-v1";
const BASELINE_KM = 1;
const GOAL_KM = 10;

const milestones = [
  { date: "2026-11-21", title: "Build toward 1.5 km", kind: "Easy progression" },
  { date: "2026-11-28", title: "Build toward 2 km", kind: "Steady run" },
  { date: "2026-12-02", title: "Easy run and recovery", kind: "Recovery" },
  { date: "2026-12-04", title: "Rest, hydrate and prepare", kind: "Rest day" },
  { date: "2026-12-05", title: "Personal 2–3 km milestone", kind: "Checkpoint" },
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

function daysUntil(value) {
  return Math.max(0, Math.ceil((parseDate(value) - today) / 86400000));
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

function renderCountdown() {
  const days = daysUntil(CHECKPOINT_DATE);
  $("#days-left").textContent = days === 0 ? "Today" : days;
  if (days === 0) $(".hero-countdown span:last-child").innerHTML = "<b>Today</b> is the December 5 checkpoint";
}

function renderMilestones() {
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
  renderCountdown();
  renderMilestones();
  renderProgress();
  renderRuns();

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

