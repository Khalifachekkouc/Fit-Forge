const KEYS = {
  food: "ns_food",
  goals: "ns_goals",
  default_goals: "ns_default_goals",
  gym: "ns_gym",
  profile: "ns_profile",
};

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

function getFoodLog(dateStr) {
  const d = load(KEYS.food) || {};
  return d[dateStr] || [];
}
function saveFoodLog(dateStr, entries) {
  const d = load(KEYS.food) || {};
  d[dateStr] = entries;
  save(KEYS.food, d);
}

function getGoals(dateStr) {
  const d = load(KEYS.goals) || {};
  if (d[dateStr]) return d[dateStr];
  return getDefaultGoals();
}
function saveGoalsForDate(dateStr, g) {
  const d = load(KEYS.goals) || {};
  d[dateStr] = g;
  save(KEYS.goals, d);
}
function getDefaultGoals() {
  return (
    load(KEYS.default_goals) || {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
    }
  );
}
function saveDefaultGoals(g) {
  save(KEYS.default_goals, g);
}

function getGymDay(dateStr) {
  const d = load(KEYS.gym) || {};
  return d[dateStr] || { muscleGroup: "", exercises: [] };
}
function saveGymDay(dateStr, wd) {
  const d = load(KEYS.gym) || {};
  d[dateStr] = wd;
  save(KEYS.gym, d);
}
function getAllExerciseNames() {
  const d = load(KEYS.gym) || {};
  const names = new Set();
  Object.values(d).forEach((day) =>
    (day.exercises || []).forEach((e) => names.add(e.name)),
  );
  return [...names].sort();
}
function getExerciseProgress(name) {
  const d = load(KEYS.gym) || {};
  return Object.entries(d)
    .filter(([, day]) => (day.exercises || []).some((e) => e.name === name))
    .map(([date, day]) => {
      const ex = day.exercises.find((e) => e.name === name);
      return { date, weight: ex.weight, sets: ex.sets, reps: ex.reps };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getProfile() {
  return (
    load(KEYS.profile) || {
      height: 175,
      weight: 70,
      age: 30,
      gender: "male",
      activityLevel: "moderate",
      goal: "maintain",
    }
  );
}
function saveProfile_(p) {
  save(KEYS.profile, p);
}

let currentPage = "dashboard";
let dashDate = new Date();
let gymDate = new Date();
let progressChart = null;

function navigate(page) {
  currentPage = page;
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document.getElementById("page-" + page).classList.add("active");
  document
    .querySelectorAll(".nav-btn")
    .forEach((b) => b.classList.remove("active"));
  document
    .querySelectorAll(".mobile-nav-btn")
    .forEach((b) => b.classList.remove("active"));
  const btns = [
    ...document.querySelectorAll(".nav-btn"),
    ...document.querySelectorAll(".mobile-nav-btn"),
  ];
  btns
    .filter((b) => b.getAttribute("onclick") === `navigate('${page}')`)
    .forEach((b) => b.classList.add("active"));

  if (page === "dashboard") renderDashboard();
  if (page === "gym") renderGym();
  if (page === "profile") loadProfile();
}

function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isToday(d) {
  return fmt(d) === fmt(new Date());
}
function displayDate(d) {
  if (isToday(d)) return "Today";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function weekday(d) {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function changeDay(n) {
  dashDate = addDays(dashDate, n);
  renderDashboard();
}

function renderDashboard() {
  const dateStr = fmt(dashDate);
  document.getElementById("dash-date-label").textContent =
    displayDate(dashDate);
  document.getElementById("dash-weekday").textContent = weekday(dashDate);

  const goals = getGoals(dateStr);
  document.getElementById("g-cal").value = goals.calories;
  document.getElementById("g-pro").value = goals.protein;
  document.getElementById("g-carb").value = goals.carbs;
  document.getElementById("g-fat").value = goals.fat;
  document.getElementById("edit-goals-title").textContent =
    `Edit Goals for ${isToday(dashDate) ? "Today" : dateStr}`;

  const entries = getFoodLog(dateStr);
  const totals = entries.reduce(
    (a, e) => ({
      calories: a.calories + e.calories,
      protein: a.protein + e.protein,
      carbs: a.carbs + e.carbs,
      fat: a.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );

  renderMacros(totals, goals);
  renderFoodLog(entries);
}

function renderMacros(totals, goals) {
  const macros = [
    {
      label: "Calories",
      consumed: totals.calories,
      target: goals.calories,
      unit: "kcal",
      color: "hsl(20, 90%, 60%)",
      cls: "calories-color",
      bgCls: "calories-bg",
      delay: 0.1,
    },
    {
      label: "Protein",
      consumed: totals.protein,
      target: goals.protein,
      unit: "g",
      color: "hsl(190, 85%, 45%)",
      cls: "protein-color",
      bgCls: "protein-bg",
      delay: 0.2,
    },
    {
      label: "Carbs",
      consumed: totals.carbs,
      target: goals.carbs,
      unit: "g",
      color: "hsl(260, 80%, 65%)",
      cls: "carbs-color",
      bgCls: "carbs-bg",
      delay: 0.3,
    },
    {
      label: "Fat",
      consumed: totals.fat,
      target: goals.fat,
      unit: "g",
      color: "hsl(45, 95%, 55%)",
      cls: "fat-color",
      bgCls: "fat-bg",
      delay: 0.4,
    },
  ];
  const grid = document.getElementById("macros-grid");
  grid.innerHTML = macros
    .map((m) => {
      const pct =
        m.target > 0
          ? Math.min(Math.round((m.consumed / m.target) * 100), 100)
          : 0;
      const over = m.target > 0 && m.consumed > m.target;
      return `
    <div class="card macro-card" style="animation-delay:${m.delay}s">
      <div class="macro-header">
        <div>
          <div class="macro-label">${m.label}</div>
          <div class="macro-value">
            <span class="macro-big ${over ? "" : "${m.cls}"}" style="color:${over ? "hsl(0, 84%, 60%)" : m.color}">${Math.round(m.consumed)}</span>
            <span class="macro-target">/ ${Math.round(m.target)}${m.unit}</span>
          </div>
        </div>
        <div class="macro-badge ${m.bgCls}" style="color:${m.color}">${pct}%</div>
      </div>
      <div class="macro-bar-track">
        <div class="macro-bar-fill" style="width:${pct}%; background:${over ? "hsl(0, 84%, 60%)" : m.color}"></div>
      </div>
      ${over ? `<div class="macro-over-text">Over by ${Math.round(m.consumed - m.target)}${m.unit}</div>` : ""}
    </div>`;
    })
    .join("");
}

function renderFoodLog(entries) {
  const el = document.getElementById("food-entries");
  if (!entries.length) {
    el.innerHTML = `<div class="empty-state"><p>No food logged yet</p><p>Add your first meal to see your progress.</p></div>`;
    return;
  }
  el.innerHTML = entries
    .map(
      (e, i) => `
    <div class="food-entry" style="animation-delay:${i * 0.05}s">
      <div>
        <div class="food-name">${escHtml(e.name)}</div>
        <div class="food-macros">
          <span class="food-macro-tag calories-color">🔥 ${e.calories} kcal</span>
          <span class="food-macro-tag protein-color">🥩 ${e.protein}g Protein</span>
          <span class="food-macro-tag carbs-color">🌾 ${e.carbs}g Carbs</span>
          <span class="food-macro-tag fat-color">💧 ${e.fat}g Fat</span>
        </div>
      </div>
      <button class="btn-icon delete-btn" onclick="deleteFood(${e.id})">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>`,
    )
    .join("");
}

function addFood() {
  const name = document.getElementById("f-name").value.trim();
  if (!name) {
    document.getElementById("f-name-err").style.display = "block";
    return;
  }
  document.getElementById("f-name-err").style.display = "none";
  const entry = {
    id: Date.now(),
    name,
    calories: +document.getElementById("f-cal").value || 0,
    protein: +document.getElementById("f-pro").value || 0,
    carbs: +document.getElementById("f-carb").value || 0,
    fat: +document.getElementById("f-fat").value || 0,
  };
  const dateStr = fmt(dashDate);
  const entries = getFoodLog(dateStr);
  entries.push(entry);
  saveFoodLog(dateStr, entries);
  closeModal("add-food-modal");
  document.getElementById("f-name").value = "";
  ["f-cal", "f-pro", "f-carb", "f-fat"].forEach(
    (id) => (document.getElementById(id).value = 0),
  );
  renderDashboard();
  showToast("Food logged!");
}

function deleteFood(id) {
  const dateStr = fmt(dashDate);
  const entries = getFoodLog(dateStr).filter((e) => e.id !== id);
  saveFoodLog(dateStr, entries);
  renderDashboard();
}

function saveGoals() {
  const dateStr = fmt(dashDate);
  const g = {
    calories: +document.getElementById("g-cal").value || 0,
    protein: +document.getElementById("g-pro").value || 0,
    carbs: +document.getElementById("g-carb").value || 0,
    fat: +document.getElementById("g-fat").value || 0,
  };
  saveGoalsForDate(dateStr, g);
  closeModal("edit-goals-modal");
  renderDashboard();
  showToast("Goals updated!");
}

const MUSCLE_GROUPS = [
  "Back",
  "Chest",
  "Legs",
  "Arms",
  "Shoulders",
  "Full Body",
  "Core",
  "Cardio",
];

function changeGymDay(n) {
  gymDate = addDays(gymDate, n);
  renderGym();
}

function renderGym() {
  const dateStr = fmt(gymDate);
  document.getElementById("gym-date-label").textContent = displayDate(gymDate);
  document.getElementById("gym-weekday").textContent = weekday(gymDate);

  const workout = getGymDay(dateStr);

  document.getElementById("muscle-chips").innerHTML = MUSCLE_GROUPS.map(
    (mg) => `
    <button class="muscle-chip ${workout.muscleGroup === mg ? "active" : ""}" onclick="setMuscleGroup('${mg}')">${mg}</button>`,
  ).join("");

  const lbl = document.getElementById("muscle-group-label");
  if (workout.muscleGroup) {
    lbl.style.display = "block";
    lbl.innerHTML = `Training: <strong>${workout.muscleGroup}</strong>`;
  } else lbl.style.display = "none";

  renderExercises(workout.exercises || []);
  renderProgress();
}

function setMuscleGroup(mg) {
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  wd.muscleGroup = mg;
  saveGymDay(dateStr, wd);
  renderGym();
}

function renderExercises(exercises) {
  const el = document.getElementById("exercises-container");
  if (!exercises.length) {
    el.innerHTML = `<div class="empty-state"><p>No exercises logged yet</p><p>Add your first exercise to track your workout.</p></div>`;
    return;
  }
  el.innerHTML = `
    <table class="exercises-table">
      <thead><tr>
        <th>Exercise</th><th>Sets</th><th>Reps</th><th>Weight</th><th></th>
      </tr></thead>
      <tbody>
      ${exercises
        .map(
          (ex, i) => `
        <tr class="exercise-row" id="ex-row-${ex.id}">
          <td>
            <div class="exercise-name">${escHtml(ex.name)}</div>
            ${ex.notes ? `<div class="exercise-notes">${escHtml(ex.notes)}</div>` : ""}
          </td>
          <td>${ex.sets}</td>
          <td>${ex.reps}</td>
          <td>${ex.weight} kg</td>
          <td style="text-align:right;white-space:nowrap">
            <button class="btn btn-ghost" style="padding:.3rem .6rem;border-radius:8px;font-size:.78rem" onclick="startEdit(${ex.id})">✏️</button>
            <button class="btn-icon" onclick="deleteExercise(${ex.id})" style="display:inline-flex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </td>
        </tr>
        <tr class="edit-row" id="edit-row-${ex.id}">
          <td colspan="5" style="padding:.75rem">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.6rem;align-items:end">
              <div class="form-group"><label class="form-label">Name</label><input id="ee-name-${ex.id}" class="form-input" style="height:38px" value="${escHtml(ex.name)}"></div>
              <div class="form-group"><label class="form-label">Sets</label><input id="ee-sets-${ex.id}" type="number" class="form-input" style="height:38px;text-align:center" value="${ex.sets}"></div>
              <div class="form-group"><label class="form-label">Reps</label><input id="ee-reps-${ex.id}" type="number" class="form-input" style="height:38px;text-align:center" value="${ex.reps}"></div>
              <div class="form-group"><label class="form-label">Weight</label><input id="ee-weight-${ex.id}" type="number" step="0.5" class="form-input" style="height:38px;text-align:center" value="${ex.weight}"></div>
            </div>
            <div style="display:flex;gap:.5rem;margin-top:.5rem">
              <button class="btn btn-primary" style="height:36px" onclick="saveEdit(${ex.id})">✓ Save</button>
              <button class="btn btn-ghost" style="height:36px" onclick="cancelEdit(${ex.id})">Cancel</button>
            </div>
          </td>
        </tr>`,
        )
        .join("")}
      </tbody>
    </table>`;
}

function addExercise() {
  const name = document.getElementById("e-name").value.trim();
  if (!name) {
    document.getElementById("e-name-err").style.display = "block";
    return;
  }
  document.getElementById("e-name-err").style.display = "none";
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  if (!wd.muscleGroup) wd.muscleGroup = "Full Body";
  wd.exercises = wd.exercises || [];
  wd.exercises.push({
    id: Date.now(),
    name,
    sets: +document.getElementById("e-sets").value || 3,
    reps: +document.getElementById("e-reps").value || 10,
    weight: +document.getElementById("e-weight").value || 0,
    notes: document.getElementById("e-notes").value.trim(),
  });
  saveGymDay(dateStr, wd);
  closeModal("add-exercise-modal");
  ["e-name", "e-notes"].forEach(
    (id) => (document.getElementById(id).value = ""),
  );
  document.getElementById("e-sets").value = 3;
  document.getElementById("e-reps").value = 10;
  document.getElementById("e-weight").value = 0;
  renderGym();
  updateExerciseSuggestions();
  showToast("Exercise added!");
}

function deleteExercise(id) {
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  wd.exercises = (wd.exercises || []).filter((e) => e.id !== id);
  saveGymDay(dateStr, wd);
  renderGym();
}

function startEdit(id) {
  document
    .querySelectorAll(".edit-row")
    .forEach((r) => r.classList.remove("open"));
  document.getElementById(`edit-row-${id}`).classList.add("open");
}

function cancelEdit(id) {
  document.getElementById(`edit-row-${id}`).classList.remove("open");
}

function saveEdit(id) {
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  const ex = (wd.exercises || []).find((e) => e.id === id);
  if (ex) {
    ex.name = document.getElementById(`ee-name-${id}`).value.trim() || ex.name;
    ex.sets = +document.getElementById(`ee-sets-${id}`).value || ex.sets;
    ex.reps = +document.getElementById(`ee-reps-${id}`).value || ex.reps;
    ex.weight = +document.getElementById(`ee-weight-${id}`).value;
  }
  saveGymDay(dateStr, wd);
  renderGym();
  showToast("Exercise updated!");
}

function renderProgress() {
  const names = getAllExerciseNames();
  const el = document.getElementById("progress-section-inner");
  if (!names.length) {
    el.innerHTML = `<div class="empty-state"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="margin:0 auto .75rem;opacity:.3"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/></svg><p>Log exercises to see your strength progress over time.</p></div>`;
    return;
  }
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:.75rem;flex-wrap:wrap;margin-bottom:1.25rem">
      <label class="form-label" style="white-space:nowrap">Filter by exercise:</label>
      <select id="progress-select" class="form-select" style="width:220px;height:38px" onchange="updateProgressChart()">
        <option value="">Select exercise…</option>
        ${names.map((n) => `<option value="${escHtml(n)}">${escHtml(n)}</option>`).join("")}
      </select>
    </div>
    <div id="progress-chart-area" style="display:none">
      <div id="pr-banner" class="pr-badge" style="display:none"></div>
      <div class="progress-chart-wrap"><canvas id="progress-chart"></canvas></div>
      <div class="stat-pills mt-4" id="stat-pills"></div>
    </div>`;
}

function updateProgressChart() {
  const name = document.getElementById("progress-select").value;
  const area = document.getElementById("progress-chart-area");
  if (!name) {
    area.style.display = "none";
    return;
  }
  area.style.display = "block";

  const data = getExerciseProgress(name);
  if (!data.length) {
    area.style.display = "none";
    return;
  }

  const pr = data.reduce(
    (max, e) => (e.weight > max.weight ? e : max),
    data[0],
  );
  const prBanner = document.getElementById("pr-banner");
  if (pr) {
    prBanner.style.display = "flex";
    prBanner.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      <div><div class="pr-label">Personal Record</div><div class="pr-val">${pr.weight} kg — ${new Date(pr.date).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}</div></div>`;
  }

  if (progressChart) {
    progressChart.destroy();
    progressChart = null;
  }
  const ctx = document.getElementById("progress-chart").getContext("2d");
  progressChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map((e) => {
        const d = new Date(e.date);
        return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
      }),
      datasets: [
        {
          label: "Weight (kg)",
          data: data.map((e) => e.weight),
          borderColor: "hsl(170,70%,40%)",
          backgroundColor: "rgba(0,150,120,.1)",
          borderWidth: 2.5,
          tension: 0.35,
          pointBackgroundColor: "hsl(170,70%,40%)",
          pointRadius: 5,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} kg` } },
      },
      scales: {
        x: {
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 11 } },
        },
        y: {
          grid: { color: "rgba(0,0,0,.06)" },
          ticks: { font: { size: 11 }, callback: (v) => `${v} kg` },
        },
      },
    },
  });

  document.getElementById("stat-pills").innerHTML = `
    <div class="stat-pill"><div class="s-label">Sessions</div><div class="s-val">${data.length}</div></div>
    <div class="stat-pill"><div class="s-label">Best Weight</div><div class="s-val" style="color:#f59e0b">${pr.weight} kg</div></div>
    <div class="stat-pill"><div class="s-label">Latest</div><div class="s-val">${data[data.length - 1].weight} kg</div></div>`;
}

function updateExerciseSuggestions() {
  const names = getAllExerciseNames();
  document.getElementById("exercise-suggestions").innerHTML = names
    .map((n) => `<option value="${escHtml(n)}">`)
    .join("");
}

function loadProfile() {
  const p = getProfile();
  document.getElementById("p-height").value = p.height;
  document.getElementById("p-weight").value = p.weight;
  document.getElementById("p-age").value = p.age;
  document.getElementById("p-gender").value = p.gender;
  document.getElementById("p-activity").value = p.activityLevel;
  document.getElementById("p-goal").value = p.goal;
}

function saveProfile() {
  const p = {
    height: +document.getElementById("p-height").value,
    weight: +document.getElementById("p-weight").value,
    age: +document.getElementById("p-age").value,
    gender: document.getElementById("p-gender").value,
    activityLevel: document.getElementById("p-activity").value,
    goal: document.getElementById("p-goal").value,
  };
  if (
    p.height < 50 ||
    p.height > 300 ||
    p.weight < 20 ||
    p.weight > 400 ||
    p.age < 10 ||
    p.age > 120
  ) {
    showToast("Please check your inputs.");
    return;
  }
  saveProfile_(p);
  const r = calcGoals(p);
  showCalcResult(r);
  showToast("Profile saved!");
}

function calcGoals(p) {
  let bmr =
    10 * p.weight +
    6.25 * p.height -
    5 * p.age +
    (p.gender === "male" ? 5 : -161);
  const mult =
    p.activityLevel === "high"
      ? 1.725
      : p.activityLevel === "moderate"
        ? 1.55
        : 1.2;
  let tdee = bmr * mult;
  let proteinMult = 1.6;
  if (p.goal === "build_muscle") {
    tdee += 350;
    proteinMult = 2.0;
  } else if (p.goal === "lose_fat") {
    tdee -= 300;
    proteinMult = 2.0;
  }
  const protein = Math.round(p.weight * proteinMult);
  const fat = Math.round(p.weight * 0.9);
  const carbs = Math.max(0, Math.round((tdee - protein * 4 - fat * 9) / 4));
  return { calories: Math.round(tdee), protein, carbs, fat };
}

function showCalcResult(r) {
  document.getElementById("calc-result").innerHTML = `
    <div class="calories-display">
      <div class="label">Target Calories</div>
      <div class="big">${r.calories}</div>
      <div class="sub">kcal / day</div>
    </div>
    <div class="macro-pills">
      <div class="macro-pill"><div class="pill-label">Protein</div><div class="pill-val protein-color">${r.protein}g</div></div>
      <div class="macro-pill"><div class="pill-label">Carbs</div><div class="pill-val carbs-color">${r.carbs}g</div></div>
      <div class="macro-pill"><div class="pill-label">Fat</div><div class="pill-val fat-color">${r.fat}g</div></div>
    </div>
    <button class="apply-btn" onclick="applyGoals(${r.calories},${r.protein},${r.carbs},${r.fat})">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Apply to Today &amp; Future
    </button>`;
}

function applyGoals(cal, pro, carb, fat) {
  const g = { calories: cal, protein: pro, carbs: carb, fat: fat };
  saveDefaultGoals(g);
  showToast("Applied to today & future days!");
}

function openModal(id) {
  document.getElementById(id).classList.add("open");
}
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
function overlayClose(ev, id) {
  if (ev.target.id === id) closeModal(id);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    document
      .querySelectorAll(".modal-overlay.open")
      .forEach((m) => m.classList.remove("open"));
});

function showToast(msg) {
  const c = document.getElementById("toast-container");
  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = msg;
  c.innerHTML = "";
  c.appendChild(t);
  setTimeout(() => {
    t.classList.add("out");
    setTimeout(() => t.remove(), 350);
  }, 2500);
}

function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

renderDashboard();
updateExerciseSuggestions();
