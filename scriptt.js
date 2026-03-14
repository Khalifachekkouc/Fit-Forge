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
  "Chest", "Back", "Legs", "Shoulders", "Arms", "Core / Abs", "Glutes", "Full Body", "Cardio",
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
      ${exercises.map((ex) => {
            const safeId = String(ex.id).replace(/[^a-zA-Z0-9_-]/g, '_');
            return `
        <tr class="exercise-row" id="ex-row-${safeId}">
          <td><div class="exercise-name">${escHtml(ex.name)}</div>${ex.notes ? `<div class="exercise-notes">${escHtml(ex.notes)}</div>` : ""}</td>
          <td>${ex.sets}</td><td>${ex.reps}</td><td>${ex.weight} kg</td>
          <td style="text-align:right;white-space:nowrap">
            <button class="btn btn-ghost" style="padding:.3rem .6rem;border-radius:8px;font-size:.78rem" onclick="startEdit('${safeId}')">✏️</button>
            <button class="btn-icon" onclick="deleteExercise('${safeId}')" style="display:inline-flex"><svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
          </td>
        </tr>
        <tr class="edit-row" id="edit-row-${safeId}">
          <td colspan="5" style="padding:.75rem">
            <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:.6rem;align-items:end">
              <div class="form-group"><label class="form-label">Name</label><input id="ee-name-${safeId}" class="form-input" style="height:38px" value="${escHtml(ex.name)}"></div>
              <div class="form-group"><label class="form-label">Sets</label><input id="ee-sets-${safeId}" type="number" class="form-input" style="height:38px;text-align:center" value="${ex.sets}"></div>
              <div class="form-group"><label class="form-label">Reps</label><input id="ee-reps-${safeId}" type="number" class="form-input" style="height:38px;text-align:center" value="${ex.reps}"></div>
              <div class="form-group"><label class="form-label">Weight</label><input id="ee-weight-${safeId}" type="number" step="0.5" class="form-input" style="height:38px;text-align:center" value="${ex.weight}"></div>
            </div>
            <div style="display:flex;gap:.5rem;margin-top:.5rem">
              <button class="btn btn-primary" style="height:36px" onclick="saveEdit('${safeId}')">✓ Save</button>
              <button class="btn btn-ghost" style="height:36px" onclick="cancelEdit('${safeId}')">Cancel</button>
            </div>
          </td>
        </tr>`;
          }).join("")}
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
  wd.exercises = (wd.exercises || []).filter(
    (e) => String(e.id).replace(/[^a-zA-Z0-9_-]/g, '_') !== String(id)
  );
  saveGymDay(dateStr, wd);
  renderGym();
}
function startEdit(id) {
  document.querySelectorAll(".edit-row").forEach((r) => r.classList.remove("open"));
  document.getElementById(`edit-row-${id}`).classList.add("open");
}
function cancelEdit(id) {
  document.getElementById(`edit-row-${id}`).classList.remove("open");
}

function saveEdit(id) {
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  const ex = (wd.exercises || []).find(
    (e) => String(e.id).replace(/[^a-zA-Z0-9_-]/g, '_') === String(id)
  );
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


const WP_STATE = { gender: 'male', level: 'beginner', goal: 'build_muscle', muscle: 'chest' };
const WP_MUSCLE_TO_GYM = { chest:'Chest', back:'Back', legs:'Legs', shoulders:'Shoulders', arms:'Arms', core:'Core / Abs', glutes:'Glutes' };

// ── Sub-target labels (what the user sees) ───────────────────
const SUB_TARGET_LABELS = {
  // Chest
  'mid-chest':    'Mid Chest',
  'upper-chest':  'Upper Chest',
  'lower-chest':  'Lower Chest',
  'inner-chest':  'Inner Chest',
  'chest-stretch':'Chest Stretch',
  // Back
  'lats-width':   'Lat Width',
  'lats-thickness':'Lat Thickness',
  'mid-back':     'Mid Back',
  'rear-delt-back':'Rear Delt',
  'lower-back':   'Lower Back',
  // Legs
  'quads':        'Quads',
  'hamstrings':   'Hamstrings',
  'glutes-legs':  'Glutes',
  'calves':       'Calves',
  'adductors':    'Adductors',
  // Shoulders
  'front-delt':   'Front Delt',
  'side-delt':    'Side Delt',
  'rear-delt':    'Rear Delt',
  'traps':        'Traps',
  'rotator':      'Rotator Cuff',
  // Arms
  'bicep-long':   'Bicep (Long Head)',
  'bicep-short':  'Bicep (Short Head)',
  'tricep-long':  'Tricep (Long Head)',
  'tricep-lateral':'Tricep (Lateral)',
  'forearms':     'Forearms',
  // Core
  'upper-abs':    'Upper Abs',
  'lower-abs':    'Lower Abs',
  'obliques':     'Obliques',
  'deep-core':    'Deep Core',
  'lower-back-core':'Lower Back',
  // Glutes
  'glute-max':    'Glute Max',
  'glute-med':    'Glute Med',
  'hip-flexors':  'Hip Flexors',
  'hamstring-glute':'Ham-Glute Tie-In',
  'abductors':    'Abductors',
};

// Sub-target color map (subtle pill colors)
const SUB_TARGET_COLORS = {
  // Chest
  'mid-chest':    '#0ea5e9','upper-chest':'#7c3aed','lower-chest':'#ea580c',
  'inner-chest':  '#16a34a','chest-stretch':'#db2777',
  // Back
  'lats-width':   '#0ea5e9','lats-thickness':'#7c3aed','mid-back':'#ea580c',
  'rear-delt-back':'#16a34a','lower-back':'#b45309',
  // Legs
  'quads':'#0ea5e9','hamstrings':'#7c3aed','glutes-legs':'#ea580c',
  'calves':'#16a34a','adductors':'#db2777',
  // Shoulders
  'front-delt':'#0ea5e9','side-delt':'#7c3aed','rear-delt':'#ea580c',
  'traps':'#16a34a','rotator':'#b45309',
  // Arms
  'bicep-long':'#0ea5e9','bicep-short':'#7c3aed','tricep-long':'#ea580c',
  'tricep-lateral':'#16a34a','forearms':'#b45309',
  // Core
  'upper-abs':'#0ea5e9','lower-abs':'#7c3aed','obliques':'#ea580c',
  'deep-core':'#16a34a','lower-back-core':'#b45309',
  // Glutes
  'glute-max':'#0ea5e9','glute-med':'#7c3aed','hip-flexors':'#ea580c',
  'hamstring-glute':'#16a34a','abductors':'#db2777',
};

//           Goal config
const GOAL_CONFIG = {
  build_muscle: {
    label: '\uD83D\uDCAA Build Muscle',
    desc: 'Moderate weight, higher volume — ideal for hypertrophy.',
    repRange:  { beginner:'10\u201312', intermediate:'8\u201312', advanced:'8\u201312' },
    setsRange: { beginner:[3,3], intermediate:[3,4], advanced:[4,5] },
    exCount:   { beginner:[3,4], intermediate:[4,5], advanced:[5,6] },
    restSec:   { beginner:60, intermediate:75, advanced:75 },
    weightHint:'Moderate weight — last 2 reps should be challenging.',
    filter: null,
  },
  lose_fat: {
    label: '\uD83D\uDD25 Lose Fat',
    desc: 'Higher reps, shorter rest — keeps heart rate elevated.',
    repRange:  { beginner:'12\u201315', intermediate:'12\u201315', advanced:'15\u201320' },
    setsRange: { beginner:[3,3], intermediate:[3,4], advanced:[3,4] },
    exCount:   { beginner:[4,5], intermediate:[5,6], advanced:[5,6] },
    restSec:   { beginner:45, intermediate:45, advanced:30 },
    weightHint:'Light-to-moderate weight — focus on form and pace.',
    filter: (name) => !/(heavy|rack pull|snatch|cluster|chain|barbell squat)/i.test(name),
  },
  maintain: {
    label: '\u26A1 Maintain Fitness',
    desc: 'Balanced sets & reps — keeps you strong and consistent.',
    repRange:  { beginner:'10\u201312', intermediate:'10\u201312', advanced:'8\u201312' },
    setsRange: { beginner:[3,3], intermediate:[3,3], advanced:[3,4] },
    exCount:   { beginner:[3,4], intermediate:[4,5], advanced:[4,5] },
    restSec:   { beginner:60, intermediate:60, advanced:60 },
    weightHint:'Comfortable working weight — maintain consistent form.',
    filter: null,
  },
  strength: {
    label: '\uD83C\uDFC6 Increase Strength',
    desc: 'Heavy compounds, low reps — maximal force development.',
    repRange:  { beginner:'6\u20138', intermediate:'4\u20136', advanced:'3\u20135' },
    setsRange: { beginner:[4,4], intermediate:[4,5], advanced:[5,6] },
    exCount:   { beginner:[3,4], intermediate:[3,4], advanced:[4,5] },
    restSec:   { beginner:90, intermediate:120, advanced:150 },
    weightHint:'Heavy weight — aim for 85–95% of your max effort.',
    filter: (name) => /(barbell|squat|deadlift|press|row|pull.up|bench|dip|weighted|heavy|loaded|paused)/i.test(name),
  },
};

const EXERCISE_DB = {
  chest: {
    male: {
      beginner: [
        { name:'Push-Up',                    sub:'mid-chest'     },
        { name:'Incline Push-Up',            sub:'upper-chest'   },
        { name:'Decline Push-Up',            sub:'lower-chest'   },
        { name:'Dumbbell Fly (flat)',         sub:'inner-chest'   },
        { name:'TRX Push-Up',                sub:'chest-stretch' },
        { name:'Knee Push-Up',               sub:'mid-chest'     },
        { name:'Dumbbell Chest Press',       sub:'mid-chest'     },
        { name:'Machine Chest Press',        sub:'mid-chest'     },
        { name:'Incline Dumbbell Press',     sub:'upper-chest'   },
        { name:'Cable Fly (low to high)',    sub:'upper-chest'   },
        { name:'Cable Chest Press',          sub:'mid-chest'     },
        { name:'Pec Deck Machine',           sub:'inner-chest'   },
        { name:'Svend Press',                sub:'inner-chest'   },
        { name:'Resistance Band Chest Press',sub:'mid-chest'     },
        { name:'Landmine Press',             sub:'upper-chest'   },
        { name:'Floor Press',                sub:'mid-chest'     },
        { name:'Band Fly',                   sub:'chest-stretch' },
        { name:'Dumbbell Pullover',          sub:'chest-stretch' },
        { name:'Smith Machine Press',        sub:'mid-chest'     },
        { name:'Wide-Grip Push-Up',          sub:'inner-chest'   },
        { name:'Cable Fly (high to low)',    sub:'lower-chest'   },
        { name:'Bosu Ball Push-Up',          sub:'chest-stretch' },
        { name:'Neutral-Grip DB Press',      sub:'mid-chest'     },
        { name:'Chest Dip (assisted)',       sub:'lower-chest'   },
        { name:'Single-Arm Cable Press',     sub:'inner-chest'   },
      ],
      intermediate: [
        { name:'Barbell Bench Press',        sub:'mid-chest'     },
        { name:'Incline Barbell Press',      sub:'upper-chest'   },
        { name:'Decline Bench Press',        sub:'lower-chest'   },
        { name:'Cable Crossover',            sub:'inner-chest'   },
        { name:'Dumbbell Pullover',          sub:'chest-stretch' },
        { name:'Dumbbell Fly',               sub:'chest-stretch' },
        { name:'Incline Dumbbell Press',     sub:'upper-chest'   },
        { name:'Incline Cable Fly',          sub:'upper-chest'   },
        { name:'Chest Dip',                  sub:'lower-chest'   },
        { name:'Guillotine Press',           sub:'upper-chest'   },
        { name:'Close-Grip Bench Press',     sub:'inner-chest'   },
        { name:'Decline Dumbbell Press',     sub:'lower-chest'   },
        { name:'Landmine Press',             sub:'upper-chest'   },
        { name:'Cable Fly (high to low)',    sub:'lower-chest'   },
        { name:'Low Cable Fly',              sub:'lower-chest'   },
        { name:'Weighted Dip',               sub:'lower-chest'   },
        { name:'DB Squeeze Press',           sub:'inner-chest'   },
        { name:'Pec Deck',                   sub:'inner-chest'   },
        { name:'Smith Incline Press',        sub:'upper-chest'   },
        { name:'Cross-Body Cable Fly',       sub:'inner-chest'   },
        { name:'Floor Press (barbell)',      sub:'mid-chest'     },
        { name:'Single-Arm DB Press',        sub:'mid-chest'     },
        { name:'Machine Incline Press',      sub:'upper-chest'   },
        { name:'Seated Cable Fly',           sub:'chest-stretch' },
        { name:'Low to High Cable Fly',      sub:'upper-chest'   },
      ],
      advanced: [
        { name:'Paused Bench Press',         sub:'mid-chest'     },
        { name:'Steep Incline Barbell Press',sub:'upper-chest'   },
        { name:'Decline Barbell Press',      sub:'lower-chest'   },
        { name:'Heavy Cable Crossover',      sub:'inner-chest'   },
        { name:'Loaded Dip',                 sub:'lower-chest'   },
        { name:'Spoto Press',                sub:'mid-chest'     },
        { name:'Board Press',                sub:'mid-chest'     },
        { name:'Barbell Floor Press',        sub:'mid-chest'     },
        { name:'Reverse-Grip Bench Press',   sub:'upper-chest'   },
        { name:'Pin Press',                  sub:'mid-chest'     },
        { name:'Plyometric Push-Up',         sub:'chest-stretch' },
        { name:'One-Arm Push-Up',            sub:'mid-chest'     },
        { name:'Chain Bench Press',          sub:'mid-chest'     },
        { name:'Decline Cable Fly',          sub:'lower-chest'   },
        { name:'Steep Incline Cable Fly',    sub:'upper-chest'   },
        { name:'Weighted Chest Dip',         sub:'lower-chest'   },
        { name:'Heavy DB Fly',               sub:'chest-stretch' },
        { name:'Loaded Landmine Press',      sub:'upper-chest'   },
        { name:'Band-Resisted Bench Press',  sub:'mid-chest'     },
        { name:'One-Arm Cable Press',        sub:'inner-chest'   },
        { name:'Explosive Push-Up',          sub:'chest-stretch' },
        { name:'Cluster Set Bench Press',    sub:'mid-chest'     },
        { name:'Tempo Bench Press',          sub:'mid-chest'     },
        { name:'Cross-Body Cable Fly',       sub:'inner-chest'   },
        { name:'Heavy Incline DB Press',     sub:'upper-chest'   },
      ],
    },
    female: {
      beginner: [
        { name:'Knee Push-Up',               sub:'mid-chest'     },
        { name:'Incline Push-Up',            sub:'upper-chest'   },
        { name:'Cable Fly (high to low)',    sub:'lower-chest'   },
        { name:'Pec Deck (light)',           sub:'inner-chest'   },
        { name:'Band Fly',                   sub:'chest-stretch' },
        { name:'Wall Push-Up',               sub:'mid-chest'     },
        { name:'Dumbbell Chest Press',       sub:'mid-chest'     },
        { name:'Machine Chest Press',        sub:'mid-chest'     },
        { name:'Incline DB Press (light)',   sub:'upper-chest'   },
        { name:'Cable Fly (low to high)',    sub:'upper-chest'   },
        { name:'Resistance Band Press',      sub:'mid-chest'     },
        { name:'Svend Press',                sub:'inner-chest'   },
        { name:'Dumbbell Pullover (light)',  sub:'chest-stretch' },
        { name:'Low Cable Fly',              sub:'lower-chest'   },
        { name:'Chest Dip (assisted)',       sub:'lower-chest'   },
        { name:'TRX Push-Up',                sub:'chest-stretch' },
        { name:'Wide-Grip Push-Up',          sub:'inner-chest'   },
        { name:'Floor Press (light DB)',     sub:'mid-chest'     },
        { name:'Neutral-Grip DB Press',      sub:'mid-chest'     },
        { name:'Single-Arm Band Press',      sub:'inner-chest'   },
        { name:'Stability Ball DB Press',    sub:'chest-stretch' },
        { name:'Half Push-Up',               sub:'mid-chest'     },
        { name:'Smith Machine Press',        sub:'mid-chest'     },
        { name:'Bosu Ball Push-Up',          sub:'chest-stretch' },
        { name:'Seated DB Chest Press',      sub:'mid-chest'     },
      ],
      intermediate: [
        { name:'Push-Up (full)',             sub:'mid-chest'     },
        { name:'Incline Dumbbell Press',     sub:'upper-chest'   },
        { name:'Decline DB Press',           sub:'lower-chest'   },
        { name:'Cable Fly',                  sub:'inner-chest'   },
        { name:'Dumbbell Pullover',          sub:'chest-stretch' },
        { name:'Dumbbell Bench Press',       sub:'mid-chest'     },
        { name:'Incline Cable Fly',          sub:'upper-chest'   },
        { name:'Chest Dip (assisted)',       sub:'lower-chest'   },
        { name:'Cable Crossover',            sub:'inner-chest'   },
        { name:'Landmine Press',             sub:'upper-chest'   },
        { name:'Low Cable Fly',              sub:'lower-chest'   },
        { name:'DB Squeeze Press',           sub:'inner-chest'   },
        { name:'Pec Deck',                   sub:'inner-chest'   },
        { name:'Weighted Push-Up',           sub:'mid-chest'     },
        { name:'Smith Machine Bench',        sub:'mid-chest'     },
        { name:'TRX Push-Up (elevated)',     sub:'chest-stretch' },
        { name:'Band-Resisted Push-Up',      sub:'chest-stretch' },
        { name:'Seated Cable Fly',           sub:'chest-stretch' },
        { name:'Close-Grip Push-Up',         sub:'inner-chest'   },
        { name:'Floor Press',                sub:'mid-chest'     },
        { name:'Single-Arm Cable Press',     sub:'inner-chest'   },
        { name:'Machine Chest Press',        sub:'mid-chest'     },
        { name:'Svend Press (heavier)',      sub:'inner-chest'   },
        { name:'Incline Band Press',         sub:'upper-chest'   },
        { name:'Low to High Cable Fly',      sub:'upper-chest'   },
      ],
      advanced: [
        { name:'Barbell Bench Press',        sub:'mid-chest'     },
        { name:'Incline Barbell Press',      sub:'upper-chest'   },
        { name:'Decline Barbell Press',      sub:'lower-chest'   },
        { name:'Heavy Cable Crossover',      sub:'inner-chest'   },
        { name:'Plyometric Push-Up',         sub:'chest-stretch' },
        { name:'Paused DB Press',            sub:'mid-chest'     },
        { name:'Spoto Press',                sub:'mid-chest'     },
        { name:'Weighted Chest Dip',         sub:'lower-chest'   },
        { name:'Steep Incline Cable Fly',    sub:'upper-chest'   },
        { name:'One-Arm DB Press',           sub:'mid-chest'     },
        { name:'Reverse Grip Press',         sub:'upper-chest'   },
        { name:'Loaded Push-Up',             sub:'mid-chest'     },
        { name:'Barbell Floor Press',        sub:'mid-chest'     },
        { name:'Close-Grip Bench',           sub:'inner-chest'   },
        { name:'Single-Arm Cable Fly',       sub:'inner-chest'   },
        { name:'Band-Resisted Bench',        sub:'chest-stretch' },
        { name:'Heavy DB Fly',               sub:'chest-stretch' },
        { name:'Decline Cable Fly',          sub:'lower-chest'   },
        { name:'Loaded Landmine Press',      sub:'upper-chest'   },
        { name:'Cross-Body Cable Fly',       sub:'inner-chest'   },
        { name:'Explosive Push-Up',          sub:'chest-stretch' },
        { name:'Heavy Incline DB Press',     sub:'upper-chest'   },
        { name:'Cluster Set Bench Press',    sub:'mid-chest'     },
        { name:'Heavy Pec Deck',             sub:'inner-chest'   },
        { name:'Chain Push-Up',              sub:'chest-stretch' },
      ],
    },
  },
  back: {
    male: {
      beginner: [
        { name:'Lat Pulldown',               sub:'lats-width'    },
        { name:'Seated Cable Row',           sub:'lats-thickness'},
        { name:'Dumbbell Row',               sub:'lats-thickness'},
        { name:'Reverse Fly',                sub:'rear-delt-back'},
        { name:'Good Morning (BW)',          sub:'lower-back'    },
        { name:'Assisted Pull-Up',           sub:'lats-width'    },
        { name:'Wide-Grip Lat Pulldown',     sub:'lats-width'    },
        { name:'Face Pull',                  sub:'rear-delt-back'},
        { name:'TRX Row',                    sub:'mid-back'      },
        { name:'Resistance Band Row',        sub:'mid-back'      },
        { name:'Straight-Arm Pulldown',      sub:'lats-width'    },
        { name:'Superman Hold',              sub:'lower-back'    },
        { name:'Machine Row',                sub:'lats-thickness'},
        { name:'Underhand Lat Pulldown',     sub:'lats-width'    },
        { name:'Chest-Supported Row',        sub:'mid-back'      },
        { name:'Inverted Row',               sub:'mid-back'      },
        { name:'Hip Hinge (BW)',             sub:'lower-back'    },
        { name:'Band Pull-Apart',            sub:'rear-delt-back'},
        { name:'Bent-Over DB Row',           sub:'lats-thickness'},
        { name:'Kneeling Cable Row',         sub:'mid-back'      },
        { name:'Low Row Machine',            sub:'lats-thickness'},
        { name:'Single-Arm Cable Row',       sub:'lats-thickness'},
        { name:'Incline DB Row',             sub:'mid-back'      },
        { name:'Seated Band Row',            sub:'mid-back'      },
        { name:'Stability Ball Back Ext',    sub:'lower-back'    },
      ],
      intermediate: [
        { name:'Pull-Ups',                   sub:'lats-width'    },
        { name:'Barbell Row',                sub:'lats-thickness'},
        { name:'T-Bar Row',                  sub:'lats-thickness'},
        { name:'Face Pull',                  sub:'rear-delt-back'},
        { name:'Rack Pull',                  sub:'lower-back'    },
        { name:'Lat Pulldown',               sub:'lats-width'    },
        { name:'Seated Cable Row',           sub:'lats-thickness'},
        { name:'Wide-Grip Pull-Up',          sub:'lats-width'    },
        { name:'Chest-Supported Row',        sub:'mid-back'      },
        { name:'Pendlay Row',                sub:'lats-thickness'},
        { name:'Meadows Row',                sub:'lats-thickness'},
        { name:'Reverse Fly (cable)',        sub:'rear-delt-back'},
        { name:'Underhand Barbell Row',      sub:'lats-thickness'},
        { name:'High Cable Row',             sub:'mid-back'      },
        { name:'Cable Pullover',             sub:'lats-width'    },
        { name:'Straight-Arm Pulldown',      sub:'lats-width'    },
        { name:'Good Morning',               sub:'lower-back'    },
        { name:'Single-Arm Cable Row',       sub:'lats-thickness'},
        { name:'Incline DB Row',             sub:'mid-back'      },
        { name:'Close-Grip Pulldown',        sub:'lats-thickness'},
        { name:'TRX Row (feet elevated)',    sub:'mid-back'      },
        { name:'Band-Assisted Pull-Up',      sub:'lats-width'    },
        { name:'Yates Row',                  sub:'lats-thickness'},
        { name:'Machine Row',                sub:'mid-back'      },
        { name:'Back Extension (weighted)',  sub:'lower-back'    },
      ],
      advanced: [
        { name:'Weighted Pull-Ups',          sub:'lats-width'    },
        { name:'Heavy Barbell Row',          sub:'lats-thickness'},
        { name:'Rack Deadlift',              sub:'lower-back'    },
        { name:'Heavy Face Pull',            sub:'rear-delt-back'},
        { name:'Snatch-Grip Deadlift',       sub:'lower-back'    },
        { name:'T-Bar Row (heavy)',          sub:'lats-thickness'},
        { name:'Pendlay Row',                sub:'lats-thickness'},
        { name:'Chest-Supported Row (heavy)',sub:'mid-back'      },
        { name:'Paused Pull-Up',             sub:'lats-width'    },
        { name:'Archer Row',                 sub:'lats-width'    },
        { name:'Deficit Deadlift',           sub:'lower-back'    },
        { name:'Renegade Row',               sub:'mid-back'      },
        { name:'Explosive Pull-Up',          sub:'lats-width'    },
        { name:'Heavy Meadows Row',          sub:'lats-thickness'},
        { name:'Single-Arm DB Row (heavy)',  sub:'lats-thickness'},
        { name:'Straight-Arm Pulldown (heavy)',sub:'lats-width'  },
        { name:'Yates Row',                  sub:'lats-thickness'},
        { name:'Behind-Neck Pulldown',       sub:'lats-width'    },
        { name:'Heavy Cable Row',            sub:'mid-back'      },
        { name:'Cable Pullover',             sub:'lats-width'    },
        { name:'Loaded Back Extension',      sub:'lower-back'    },
        { name:'Cluster Pull-Up',            sub:'lats-width'    },
        { name:'Single-Arm Cable Pullover',  sub:'lats-width'    },
        { name:'Band-Resisted Row',          sub:'mid-back'      },
        { name:'Inverted Row (weighted)',    sub:'mid-back'      },
      ],
    },
    female: {
      beginner: [
        { name:'Lat Pulldown (light)',       sub:'lats-width'    },
        { name:'Seated Cable Row (light)',   sub:'lats-thickness'},
        { name:'Resistance Band Row',        sub:'mid-back'      },
        { name:'Reverse Fly (light)',        sub:'rear-delt-back'},
        { name:'Good Morning (BW)',          sub:'lower-back'    },
        { name:'Assisted Pull-Up',           sub:'lats-width'    },
        { name:'Wide-Grip Lat Pulldown',     sub:'lats-width'    },
        { name:'Face Pull',                  sub:'rear-delt-back'},
        { name:'TRX Row',                    sub:'mid-back'      },
        { name:'Dumbbell Row (light)',       sub:'lats-thickness'},
        { name:'Superman Hold',              sub:'lower-back'    },
        { name:'Machine Row',                sub:'lats-thickness'},
        { name:'Underhand Lat Pulldown',     sub:'lats-width'    },
        { name:'Chest-Supported Row (light)',sub:'mid-back'      },
        { name:'Inverted Row',               sub:'mid-back'      },
        { name:'Band Pull-Apart',            sub:'rear-delt-back'},
        { name:'Kneeling Cable Row',         sub:'mid-back'      },
        { name:'Low Row Machine',            sub:'lats-thickness'},
        { name:'Incline DB Row',             sub:'mid-back'      },
        { name:'Hip Hinge (BW)',             sub:'lower-back'    },
        { name:'Seated Band Row',            sub:'mid-back'      },
        { name:'Single-Arm Band Row',        sub:'lats-thickness'},
        { name:'Straight-Arm Pulldown',      sub:'lats-width'    },
        { name:'Band Reverse Fly',           sub:'rear-delt-back'},
        { name:'Stability Ball Back Ext',    sub:'lower-back'    },
      ],
      intermediate: [
        { name:'Pull-Up (assisted)',         sub:'lats-width'    },
        { name:'Lat Pulldown',               sub:'lats-width'    },
        { name:'Dumbbell Row',               sub:'lats-thickness'},
        { name:'Face Pull',                  sub:'rear-delt-back'},
        { name:'Back Extension (weighted)',  sub:'lower-back'    },
        { name:'Cable Row',                  sub:'lats-thickness'},
        { name:'Wide-Grip Pulldown',         sub:'lats-width'    },
        { name:'Chest-Supported Row',        sub:'mid-back'      },
        { name:'Incline DB Row',             sub:'mid-back'      },
        { name:'Reverse Fly (cable)',        sub:'rear-delt-back'},
        { name:'Machine Row',                sub:'mid-back'      },
        { name:'Close-Grip Pulldown',        sub:'lats-thickness'},
        { name:'Straight-Arm Pulldown',      sub:'lats-width'    },
        { name:'Meadows Row (light)',        sub:'lats-thickness'},
        { name:'Single-Arm Cable Row',       sub:'lats-thickness'},
        { name:'High Cable Row',             sub:'mid-back'      },
        { name:'Good Morning',               sub:'lower-back'    },
        { name:'Renegade Row (light)',       sub:'mid-back'      },
        { name:'TRX Row (feet elevated)',    sub:'mid-back'      },
        { name:'Superman (weighted)',        sub:'lower-back'    },
        { name:'Kneeling Pulldown',          sub:'lats-width'    },
        { name:'T-Bar Row (light)',          sub:'lats-thickness'},
        { name:'Cable Pullover',             sub:'lats-width'    },
        { name:'Pendlay Row (light)',        sub:'lats-thickness'},
        { name:'Band Pull-Apart',            sub:'rear-delt-back'},
      ],
      advanced: [
        { name:'Full Pull-Up',               sub:'lats-width'    },
        { name:'Barbell Row',                sub:'lats-thickness'},
        { name:'Rack Pull',                  sub:'lower-back'    },
        { name:'Heavy Face Pull',            sub:'rear-delt-back'},
        { name:'Weighted TRX Row',           sub:'mid-back'      },
        { name:'Heavy Lat Pulldown',         sub:'lats-width'    },
        { name:'T-Bar Row',                  sub:'lats-thickness'},
        { name:'Single-Arm DB Row',          sub:'lats-thickness'},
        { name:'Pendlay Row',                sub:'lats-thickness'},
        { name:'Chest-Supported Row (heavy)',sub:'mid-back'      },
        { name:'Straight-Arm Pulldown (heavy)',sub:'lats-width'  },
        { name:'Close-Grip Weighted Pulldown',sub:'lats-thickness'},
        { name:'Loaded Back Extension',      sub:'lower-back'    },
        { name:'Heavy Cable Row',            sub:'mid-back'      },
        { name:'Meadows Row',                sub:'lats-thickness'},
        { name:'Loaded Renegade Row',        sub:'mid-back'      },
        { name:'Yates Row',                  sub:'lats-thickness'},
        { name:'Deficit Pull',               sub:'lower-back'    },
        { name:'Paused Pull-Up',             sub:'lats-width'    },
        { name:'Explosive Pulldown',         sub:'lats-width'    },
        { name:'Cable Pullover',             sub:'lats-width'    },
        { name:'Archer Row',                 sub:'lats-width'    },
        { name:'Snatch-Grip Row',            sub:'lower-back'    },
        { name:'Band-Resisted Row',          sub:'mid-back'      },
        { name:'Single-Arm Pullover',        sub:'lats-width'    },
      ],
    },
  },
  legs: {
    male: {
      beginner: [
        { name:'Bodyweight Squat',           sub:'quads'         },
        { name:'Romanian Deadlift (light)',  sub:'hamstrings'    },
        { name:'Glute Bridge',               sub:'glutes-legs'   },
        { name:'Calf Raise',                 sub:'calves'        },
        { name:'Lateral Band Walk',          sub:'adductors'     },
        { name:'Goblet Squat',               sub:'quads'         },
        { name:'Leg Press',                  sub:'quads'         },
        { name:'Leg Curl',                   sub:'hamstrings'    },
        { name:'Hip Thrust (BW)',            sub:'glutes-legs'   },
        { name:'Leg Extension',              sub:'quads'         },
        { name:'Sumo Squat',                 sub:'adductors'     },
        { name:'Lunges (BW)',                sub:'quads'         },
        { name:'Step-Up',                    sub:'glutes-legs'   },
        { name:'Calf Raise (seated)',        sub:'calves'        },
        { name:'Wall Sit',                   sub:'quads'         },
        { name:'Resistance Band Squat',      sub:'quads'         },
        { name:'Dumbbell Squat',             sub:'quads'         },
        { name:'Reverse Lunge',              sub:'glutes-legs'   },
        { name:'Split Squat',                sub:'quads'         },
        { name:'Leg Abduction Machine',      sub:'adductors'     },
        { name:'Hip Hinge (BW)',             sub:'hamstrings'    },
        { name:'Single-Leg Press',           sub:'quads'         },
        { name:'Box Squat (light)',          sub:'quads'         },
        { name:'Step-Down',                  sub:'quads'         },
        { name:'TRX Squat',                  sub:'quads'         },
      ],
      intermediate: [
        { name:'Barbell Squat',              sub:'quads'         },
        { name:'Romanian Deadlift',          sub:'hamstrings'    },
        { name:'Hip Thrust',                 sub:'glutes-legs'   },
        { name:'Calf Raise (standing)',      sub:'calves'        },
        { name:'Lateral Lunge',              sub:'adductors'     },
        { name:'Leg Press',                  sub:'quads'         },
        { name:'Leg Curl',                   sub:'hamstrings'    },
        { name:'Bulgarian Split Squat',      sub:'quads'         },
        { name:'Hack Squat',                 sub:'quads'         },
        { name:'Front Squat',                sub:'quads'         },
        { name:'Sumo Deadlift',              sub:'adductors'     },
        { name:'Single-Leg Romanian DL',     sub:'hamstrings'    },
        { name:'Leg Extension',              sub:'quads'         },
        { name:'Nordic Curl',                sub:'hamstrings'    },
        { name:'Glute Ham Raise',            sub:'glutes-legs'   },
        { name:'Good Morning',               sub:'hamstrings'    },
        { name:'Box Jump',                   sub:'quads'         },
        { name:'Step-Up (weighted)',         sub:'glutes-legs'   },
        { name:'Lunges (weighted)',          sub:'quads'         },
        { name:'Leg Abduction',              sub:'adductors'     },
        { name:'Calf Raise (seated, weighted)',sub:'calves'      },
        { name:'Leg Press (wide stance)',    sub:'adductors'     },
        { name:'Goblet Squat (heavy)',       sub:'quads'         },
        { name:'Dumbbell Split Squat',       sub:'quads'         },
        { name:'Reverse Lunge (weighted)',   sub:'glutes-legs'   },
      ],
      advanced: [
        { name:'Heavy Barbell Squat',        sub:'quads'         },
        { name:'Romanian Deadlift (heavy)',  sub:'hamstrings'    },
        { name:'Hip Thrust (barbell)',       sub:'glutes-legs'   },
        { name:'Calf Raise (heavy)',         sub:'calves'        },
        { name:'Sumo Deadlift (heavy)',      sub:'adductors'     },
        { name:'Paused Squat',               sub:'quads'         },
        { name:'Front Squat (heavy)',        sub:'quads'         },
        { name:'Nordic Hamstring Curl',      sub:'hamstrings'    },
        { name:'Bulgarian Split Squat (heavy)',sub:'quads'       },
        { name:'Hack Squat (heavy)',         sub:'quads'         },
        { name:'Glute Ham Raise',            sub:'glutes-legs'   },
        { name:'Single-Leg Squat (pistol)', sub:'quads'         },
        { name:'Box Squat (heavy)',          sub:'quads'         },
        { name:'Zercher Squat',              sub:'quads'         },
        { name:'Safety Bar Squat',           sub:'quads'         },
        { name:'Single-Leg Romanian DL (heavy)',sub:'hamstrings' },
        { name:'Loaded Box Jump',            sub:'quads'         },
        { name:'Heavy Leg Press',            sub:'quads'         },
        { name:'Heavy Leg Curl',             sub:'hamstrings'    },
        { name:'Overhead Squat',             sub:'quads'         },
        { name:'Cyclist Squat',              sub:'quads'         },
        { name:'Chain Squat',                sub:'quads'         },
        { name:'Weighted Step-Up',           sub:'glutes-legs'   },
        { name:'Tempo Squat',                sub:'quads'         },
        { name:'Split Squat (heavy)',        sub:'quads'         },
      ],
    },
    female: {
      beginner: [
        { name:'Glute Bridge',               sub:'glutes-legs'   },
        { name:'Romanian DL (light)',        sub:'hamstrings'    },
        { name:'Sumo Squat',                 sub:'adductors'     },
        { name:'Calf Raise',                 sub:'calves'        },
        { name:'Lateral Band Walk',          sub:'adductors'     },
        { name:'Hip Thrust (BW)',            sub:'glutes-legs'   },
        { name:'Leg Press',                  sub:'quads'         },
        { name:'Leg Curl',                   sub:'hamstrings'    },
        { name:'Bodyweight Squat',           sub:'quads'         },
        { name:'Donkey Kick (BW)',           sub:'glutes-legs'   },
        { name:'Fire Hydrant',               sub:'adductors'     },
        { name:'Clamshell',                  sub:'adductors'     },
        { name:'Step-Up',                    sub:'glutes-legs'   },
        { name:'Reverse Lunge (BW)',         sub:'glutes-legs'   },
        { name:'Goblet Squat',               sub:'quads'         },
        { name:'Leg Extension',              sub:'quads'         },
        { name:'Hip Abduction Machine',      sub:'adductors'     },
        { name:'Single-Leg Bridge',          sub:'glutes-legs'   },
        { name:'Resistance Band Squat',      sub:'quads'         },
        { name:'Glute Kickback (machine)',   sub:'glutes-legs'   },
        { name:'Calf Raise (seated)',        sub:'calves'        },
        { name:'Banded Squat Pulse',         sub:'quads'         },
        { name:'Sumo Deadlift (light)',      sub:'adductors'     },
        { name:'TRX Squat',                  sub:'quads'         },
        { name:'Step-Down',                  sub:'quads'         },
      ],
      intermediate: [
        { name:'Hip Thrust (barbell)',       sub:'glutes-legs'   },
        { name:'Romanian Deadlift',          sub:'hamstrings'    },
        { name:'Bulgarian Split Squat',      sub:'quads'         },
        { name:'Calf Raise (weighted)',      sub:'calves'        },
        { name:'Sumo Deadlift',              sub:'adductors'     },
        { name:'Leg Press',                  sub:'quads'         },
        { name:'Leg Curl',                   sub:'hamstrings'    },
        { name:'Glute Bridge (weighted)',    sub:'glutes-legs'   },
        { name:'Cable Kickback',             sub:'glutes-legs'   },
        { name:'Single-Leg Romanian DL',     sub:'hamstrings'    },
        { name:'Lateral Lunge',              sub:'adductors'     },
        { name:'Goblet Squat (heavy)',       sub:'quads'         },
        { name:'Curtsy Lunge',               sub:'adductors'     },
        { name:'Hack Squat',                 sub:'quads'         },
        { name:'Donkey Kick (cable)',        sub:'glutes-legs'   },
        { name:'Nordic Curl (assisted)',     sub:'hamstrings'    },
        { name:'Hip Abduction',              sub:'adductors'     },
        { name:'Step-Up (weighted)',         sub:'glutes-legs'   },
        { name:'Glute Kickback (cable)',     sub:'glutes-legs'   },
        { name:'Leg Extension',              sub:'quads'         },
        { name:'Sumo Squat (DB)',            sub:'adductors'     },
        { name:'Box Jump',                   sub:'quads'         },
        { name:'Reverse Lunge (weighted)',   sub:'glutes-legs'   },
        { name:'Smith Machine Squat',        sub:'quads'         },
        { name:'Fire Hydrant (cable)',       sub:'adductors'     },
      ],
      advanced: [
        { name:'Barbell Hip Thrust (heavy)', sub:'glutes-legs'   },
        { name:'Romanian Deadlift (heavy)',  sub:'hamstrings'    },
        { name:'Barbell Squat',              sub:'quads'         },
        { name:'Calf Raise (heavy)',         sub:'calves'        },
        { name:'Sumo Deadlift (heavy)',      sub:'adductors'     },
        { name:'Front Squat',                sub:'quads'         },
        { name:'Nordic Hamstring Curl',      sub:'hamstrings'    },
        { name:'Bulgarian Split Squat (heavy)',sub:'quads'       },
        { name:'Hack Squat (heavy)',         sub:'quads'         },
        { name:'Paused Hip Thrust',          sub:'glutes-legs'   },
        { name:'Single-Leg RDL (heavy)',     sub:'hamstrings'    },
        { name:'Loaded Curtsy Lunge',        sub:'adductors'     },
        { name:'Heavy Cable Kickback',       sub:'glutes-legs'   },
        { name:'Glute Ham Raise',            sub:'glutes-legs'   },
        { name:'Pistol Squat',               sub:'quads'         },
        { name:'Heavy Leg Press',            sub:'quads'         },
        { name:'Single-Leg Squat',           sub:'quads'         },
        { name:'Cyclist Squat',              sub:'quads'         },
        { name:'Box Squat',                  sub:'quads'         },
        { name:'Hip Thrust 21s',             sub:'glutes-legs'   },
        { name:'Loaded Box Jump',            sub:'quads'         },
        { name:'Band-Resisted Squat',        sub:'quads'         },
        { name:'Weighted Donkey Kick',       sub:'glutes-legs'   },
        { name:'Loaded Lateral Lunge',       sub:'adductors'     },
        { name:'Chain Squat',                sub:'quads'         },
      ],
    },
  },
  shoulders: {
    male: {
      beginner: [
        { name:'Dumbbell Shoulder Press',   sub:'front-delt'    },
        { name:'Lateral Raise (light)',      sub:'side-delt'     },
        { name:'Rear Delt Fly (light)',      sub:'rear-delt'     },
        { name:'DB Shrug',                   sub:'traps'         },
        { name:'Band Pull-Apart',            sub:'rotator'       },
        { name:'Arnold Press (light)',       sub:'front-delt'    },
        { name:'Machine Shoulder Press',    sub:'front-delt'    },
        { name:'Front Raise (light)',        sub:'front-delt'    },
        { name:'Cable Lateral Raise',        sub:'side-delt'     },
        { name:'Upright Row (light)',        sub:'traps'         },
        { name:'TRX Face Pull',              sub:'rear-delt'     },
        { name:'Resistance Band Press',      sub:'front-delt'    },
        { name:'Bent-Over Rear Delt Raise',  sub:'rear-delt'     },
        { name:'Resistance Band Lat Raise',  sub:'side-delt'     },
        { name:'DB Y-Raise',                 sub:'rotator'       },
        { name:'Plate Front Raise',          sub:'front-delt'    },
        { name:'Wall Slide',                 sub:'rotator'       },
        { name:'Prone Y/T/W',               sub:'rotator'       },
        { name:'Incline Rear Delt Fly',      sub:'rear-delt'     },
        { name:'Seated DB Press',            sub:'front-delt'    },
        { name:'Single-Arm Cable Raise',     sub:'side-delt'     },
        { name:'Cable Front Raise',          sub:'front-delt'    },
        { name:'Landmine Press (light)',     sub:'front-delt'    },
        { name:'Kneeling Band Press',        sub:'front-delt'    },
        { name:'Resistance Band Shrug',      sub:'traps'         },
      ],
      intermediate: [
        { name:'Barbell Overhead Press',    sub:'front-delt'    },
        { name:'Lateral Raise',              sub:'side-delt'     },
        { name:'Face Pull',                  sub:'rear-delt'     },
        { name:'Dumbbell Shrug',             sub:'traps'         },
        { name:'Band Pull-Apart',            sub:'rotator'       },
        { name:'Arnold Press',               sub:'front-delt'    },
        { name:'Push Press',                 sub:'front-delt'    },
        { name:'Rear Delt Fly',              sub:'rear-delt'     },
        { name:'Cable Lateral Raise',        sub:'side-delt'     },
        { name:'Upright Row',                sub:'traps'         },
        { name:'Prone Y/T/W (weighted)',    sub:'rotator'       },
        { name:'Landmine Press',             sub:'front-delt'    },
        { name:'Cable Front Raise',          sub:'front-delt'    },
        { name:'High Cable Row',             sub:'rear-delt'     },
        { name:'DB Y-Raise',                 sub:'rotator'       },
        { name:'Incline Rear Delt Fly',      sub:'rear-delt'     },
        { name:'Plate Raise',                sub:'front-delt'    },
        { name:'Kneeling Cable Press',       sub:'front-delt'    },
        { name:'Seated Barbell Press',       sub:'front-delt'    },
        { name:'Machine Shoulder Press',    sub:'front-delt'    },
        { name:'Single-Arm OHP',             sub:'front-delt'    },
        { name:'Cable Shrug',                sub:'traps'         },
        { name:'Behind-Neck Press',          sub:'side-delt'     },
        { name:'Front Raise',                sub:'front-delt'    },
        { name:'Band Pull-Apart (heavy)',    sub:'rotator'       },
      ],
      advanced: [
        { name:'Heavy Barbell OHP',          sub:'front-delt'    },
        { name:'Lateral Raise (heavy)',      sub:'side-delt'     },
        { name:'Heavy Face Pull',            sub:'rear-delt'     },
        { name:'Snatch-Grip High Pull',      sub:'traps'         },
        { name:'Cuban Press',                sub:'rotator'       },
        { name:'Push Press (heavy)',         sub:'front-delt'    },
        { name:'Hang Clean & Press',         sub:'front-delt'    },
        { name:'Rear Delt Fly (heavy)',      sub:'rear-delt'     },
        { name:'Heavy Cable Lateral Raise',  sub:'side-delt'     },
        { name:'Upright Row (heavy)',        sub:'traps'         },
        { name:'Javelin Press',              sub:'rotator'       },
        { name:'Bradford Press',             sub:'front-delt'    },
        { name:'Seated Barbell Press',       sub:'front-delt'    },
        { name:'Z-Press',                    sub:'front-delt'    },
        { name:'Paused OHP',                 sub:'front-delt'    },
        { name:'Arnold Press (heavy)',       sub:'front-delt'    },
        { name:'Bottoms-Up KB Press',        sub:'rotator'       },
        { name:'Band-Resisted OHP',          sub:'front-delt'    },
        { name:'Cluster OHP Set',            sub:'front-delt'    },
        { name:'Half-Kneeling OHP',          sub:'front-delt'    },
        { name:'Lateral Raise 21s',          sub:'side-delt'     },
        { name:'Dumbbell OHP (heavy)',       sub:'front-delt'    },
        { name:'Heavy Upright Row',          sub:'traps'         },
        { name:'Single-Arm DB OHP',          sub:'front-delt'    },
        { name:'Behind-Neck Press',          sub:'side-delt'     },
      ],
    },
    female: {
      beginner: [
        { name:'DB Shoulder Press (light)', sub:'front-delt'    },
        { name:'Lateral Raise (light)',      sub:'side-delt'     },
        { name:'Rear Delt Fly (light)',      sub:'rear-delt'     },
        { name:'Resistance Band Shrug',      sub:'traps'         },
        { name:'Band Pull-Apart',            sub:'rotator'       },
        { name:'Arnold Press (light)',       sub:'front-delt'    },
        { name:'Machine Shoulder Press',    sub:'front-delt'    },
        { name:'Front Raise (light)',        sub:'front-delt'    },
        { name:'Cable Lateral Raise',        sub:'side-delt'     },
        { name:'TRX Face Pull',              sub:'rear-delt'     },
        { name:'Prone Y/T/W',               sub:'rotator'       },
        { name:'Resistance Band Press',      sub:'front-delt'    },
        { name:'Bent-Over Rear Delt Raise',  sub:'rear-delt'     },
        { name:'DB Y-Raise',                 sub:'rotator'       },
        { name:'Plate Front Raise',          sub:'front-delt'    },
        { name:'Wall Slide',                 sub:'rotator'       },
        { name:'Seated DB Press',            sub:'front-delt'    },
        { name:'Single-Arm Cable Raise',     sub:'side-delt'     },
        { name:'Cable Front Raise',          sub:'front-delt'    },
        { name:'Incline Rear Delt Raise',    sub:'rear-delt'     },
        { name:'Kneeling Band Press',        sub:'front-delt'    },
        { name:'Light Upright Row',          sub:'traps'         },
        { name:'Stability Ball Press',       sub:'front-delt'    },
        { name:'Resistance Band Lat Raise',  sub:'side-delt'     },
        { name:'Single-Arm Band Press',      sub:'front-delt'    },
      ],
      intermediate: [
        { name:'Dumbbell Shoulder Press',   sub:'front-delt'    },
        { name:'Lateral Raise',              sub:'side-delt'     },
        { name:'Face Pull',                  sub:'rear-delt'     },
        { name:'DB Shrug',                   sub:'traps'         },
        { name:'Band Pull-Apart',            sub:'rotator'       },
        { name:'Arnold Press',               sub:'front-delt'    },
        { name:'Rear Delt Fly',              sub:'rear-delt'     },
        { name:'Cable Lateral Raise',        sub:'side-delt'     },
        { name:'Upright Row',                sub:'traps'         },
        { name:'Prone Y/T/W (weighted)',    sub:'rotator'       },
        { name:'Landmine Press',             sub:'front-delt'    },
        { name:'Cable Front Raise',          sub:'front-delt'    },
        { name:'High Cable Row',             sub:'rear-delt'     },
        { name:'Incline Rear Delt Fly',      sub:'rear-delt'     },
        { name:'Plate Raise',                sub:'front-delt'    },
        { name:'Kneeling Cable Press',       sub:'front-delt'    },
        { name:'Machine Shoulder Press',    sub:'front-delt'    },
        { name:'Push Press (light)',         sub:'front-delt'    },
        { name:'Single-Arm OHP',             sub:'front-delt'    },
        { name:'Cable Shrug',                sub:'traps'         },
        { name:'Seated Barbell Press (light)',sub:'front-delt'   },
        { name:'Resistance Band Shrug',      sub:'traps'         },
        { name:'DB Y-Raise',                 sub:'rotator'       },
        { name:'Front Raise',                sub:'front-delt'    },
        { name:'Seated Band Press',          sub:'front-delt'    },
      ],
      advanced: [
        { name:'Barbell OHP',                sub:'front-delt'    },
        { name:'Lateral Raise (heavy)',      sub:'side-delt'     },
        { name:'Heavy Face Pull',            sub:'rear-delt'     },
        { name:'Snatch-Grip High Pull',      sub:'traps'         },
        { name:'Cuban Press',                sub:'rotator'       },
        { name:'Push Press',                 sub:'front-delt'    },
        { name:'Heavy Arnold Press',         sub:'front-delt'    },
        { name:'Rear Delt Fly (heavy)',      sub:'rear-delt'     },
        { name:'Heavy Cable Lateral Raise',  sub:'side-delt'     },
        { name:'Heavy Upright Row',          sub:'traps'         },
        { name:'Javelin Press',              sub:'rotator'       },
        { name:'Bradford Press',             sub:'front-delt'    },
        { name:'Z-Press',                    sub:'front-delt'    },
        { name:'Paused OHP',                 sub:'front-delt'    },
        { name:'Bottoms-Up KB Press',        sub:'rotator'       },
        { name:'Band-Resisted OHP',          sub:'front-delt'    },
        { name:'Cluster OHP Set',            sub:'front-delt'    },
        { name:'Lateral Raise 21s',          sub:'side-delt'     },
        { name:'Heavy DB OHP',               sub:'front-delt'    },
        { name:'Seated Barbell Press',       sub:'front-delt'    },
        { name:'Hang Clean & Press',         sub:'front-delt'    },
        { name:'Half-Kneeling OHP',          sub:'front-delt'    },
        { name:'Single-Arm DB OHP',          sub:'front-delt'    },
        { name:'Behind-Neck Press',          sub:'side-delt'     },
        { name:'Landmine Press (heavy)',     sub:'front-delt'    },
      ],
    },
  },
  arms: {
    male: {
      beginner: [
        { name:'Incline DB Curl',            sub:'bicep-long'    },
        { name:'Concentration Curl',         sub:'bicep-short'   },
        { name:'Overhead DB Tricep Ext',     sub:'tricep-long'   },
        { name:'Tricep Kickback',            sub:'tricep-lateral'},
        { name:'Wrist Curl',                 sub:'forearms'      },
        { name:'Hammer Curl',                sub:'bicep-long'    },
        { name:'Dumbbell Biceps Curl',       sub:'bicep-short'   },
        { name:'Tricep Pushdown (rope)',     sub:'tricep-lateral'},
        { name:'TRX Tricep Extension',       sub:'tricep-long'   },
        { name:'Resistance Band Curl',       sub:'bicep-short'   },
        { name:'Band Tricep Pushdown',       sub:'tricep-lateral'},
        { name:'Seated DB Curl',             sub:'bicep-short'   },
        { name:'Narrow Push-Up',             sub:'tricep-lateral'},
        { name:'Cross-Body Hammer Curl',     sub:'bicep-long'    },
        { name:'Overhead Band Extension',    sub:'tricep-long'   },
        { name:'EZ-Bar Curl (light)',        sub:'bicep-short'   },
        { name:'Cable Curl (light)',         sub:'bicep-short'   },
        { name:'Reverse Curl',               sub:'forearms'      },
        { name:'Skull Crusher (light)',      sub:'tricep-long'   },
        { name:'Zottman Curl',               sub:'forearms'      },
        { name:'Tricep Dip (bench)',         sub:'tricep-lateral'},
        { name:'Machine Preacher Curl',      sub:'bicep-short'   },
        { name:'Single-Arm Pushdown',        sub:'tricep-lateral'},
        { name:'Cable Overhead Extension',   sub:'tricep-long'   },
        { name:'Forearm Curl',               sub:'forearms'      },
      ],
      intermediate: [
        { name:'Incline DB Curl',            sub:'bicep-long'    },
        { name:'Preacher Curl',              sub:'bicep-short'   },
        { name:'Overhead Tricep Extension',  sub:'tricep-long'   },
        { name:'Rope Pushdown',              sub:'tricep-lateral'},
        { name:'Wrist Curl (weighted)',      sub:'forearms'      },
        { name:'Barbell Curl',               sub:'bicep-short'   },
        { name:'Hammer Curl',                sub:'bicep-long'    },
        { name:'Skull Crusher',              sub:'tricep-long'   },
        { name:'Tricep Dip',                 sub:'tricep-lateral'},
        { name:'EZ-Bar Curl',                sub:'bicep-short'   },
        { name:'Cable Curl',                 sub:'bicep-short'   },
        { name:'Close-Grip Bench Press',     sub:'tricep-lateral'},
        { name:'Concentration Curl',         sub:'bicep-short'   },
        { name:'Zottman Curl',               sub:'forearms'      },
        { name:'Cable Hammer Curl',          sub:'bicep-long'    },
        { name:'Single-Arm Preacher Curl',   sub:'bicep-short'   },
        { name:'Overhead Cable Extension',   sub:'tricep-long'   },
        { name:'DB Skull Crusher',           sub:'tricep-long'   },
        { name:'Cross-Body Curl',            sub:'bicep-long'    },
        { name:'21s Curl',                   sub:'bicep-short'   },
        { name:'Tate Press',                 sub:'tricep-lateral'},
        { name:'Reverse Pushdown',           sub:'forearms'      },
        { name:'Machine Curl',               sub:'bicep-short'   },
        { name:'Reverse Curl',               sub:'forearms'      },
        { name:'Single-Arm Overhead Ext',    sub:'tricep-long'   },
      ],
      advanced: [
        { name:'Incline DB Curl (heavy)',    sub:'bicep-long'    },
        { name:'Preacher Curl (heavy)',      sub:'bicep-short'   },
        { name:'Overhead Tricep Ext (heavy)',sub:'tricep-long'   },
        { name:'Rope Pushdown (heavy)',      sub:'tricep-lateral'},
        { name:'Forearm Roller',             sub:'forearms'      },
        { name:'Heavy Barbell Curl',         sub:'bicep-short'   },
        { name:'Drag Curl',                  sub:'bicep-long'    },
        { name:'Skull Crusher (heavy)',      sub:'tricep-long'   },
        { name:'Loaded Tricep Dip',          sub:'tricep-lateral'},
        { name:'EZ-Bar Curl (heavy)',        sub:'bicep-short'   },
        { name:'Spider Curl',                sub:'bicep-short'   },
        { name:'Close-Grip Bench (heavy)',   sub:'tricep-lateral'},
        { name:'Hammer Curl (heavy)',        sub:'bicep-long'    },
        { name:'Zottman Curl (heavy)',       sub:'forearms'      },
        { name:'Cable Curl (heavy)',         sub:'bicep-short'   },
        { name:'French Press',               sub:'tricep-long'   },
        { name:'Band-Resisted Curl',         sub:'bicep-short'   },
        { name:'Tate Press (heavy)',         sub:'tricep-lateral'},
        { name:'21s (heavy)',                sub:'bicep-short'   },
        { name:'Cluster Curl Set',           sub:'bicep-short'   },
        { name:'Barbell Reverse Curl',       sub:'forearms'      },
        { name:'One-Arm Cable Curl',         sub:'bicep-short'   },
        { name:'Reverse Barbell Curl',       sub:'forearms'      },
        { name:'Weighted Dip',               sub:'tricep-lateral'},
        { name:'Single-Arm Overhead Ext (heavy)',sub:'tricep-long'},
      ],
    },
    female: {
      beginner: [
        { name:'Incline DB Curl',            sub:'bicep-long'    },
        { name:'Concentration Curl',         sub:'bicep-short'   },
        { name:'Overhead DB Tricep Ext (light)',sub:'tricep-long'},
        { name:'Tricep Kickback',            sub:'tricep-lateral'},
        { name:'Wrist Curl',                 sub:'forearms'      },
        { name:'Hammer Curl',                sub:'bicep-long'    },
        { name:'Dumbbell Biceps Curl (light)',sub:'bicep-short'  },
        { name:'Band Tricep Pushdown',       sub:'tricep-lateral'},
        { name:'TRX Tricep Extension',       sub:'tricep-long'   },
        { name:'Resistance Band Curl',       sub:'bicep-short'   },
        { name:'Narrow Push-Up',             sub:'tricep-lateral'},
        { name:'Seated DB Curl',             sub:'bicep-short'   },
        { name:'Cross-Body Hammer Curl',     sub:'bicep-long'    },
        { name:'Overhead Band Extension',    sub:'tricep-long'   },
        { name:'EZ-Bar Curl (light)',        sub:'bicep-short'   },
        { name:'Cable Curl (light)',         sub:'bicep-short'   },
        { name:'Reverse Curl',               sub:'forearms'      },
        { name:'Zottman Curl (light)',       sub:'forearms'      },
        { name:'Tricep Dip (bench)',         sub:'tricep-lateral'},
        { name:'Machine Preacher Curl (light)',sub:'bicep-short' },
        { name:'Single-Arm Pushdown',        sub:'tricep-lateral'},
        { name:'Rope Pushdown (light)',      sub:'tricep-lateral'},
        { name:'Forearm Curl',               sub:'forearms'      },
        { name:'Band Curl',                  sub:'bicep-short'   },
        { name:'Single-Arm Band Extension',  sub:'tricep-long'   },
      ],
      intermediate: [
        { name:'Incline DB Curl',            sub:'bicep-long'    },
        { name:'Preacher Curl',              sub:'bicep-short'   },
        { name:'Overhead Extension',         sub:'tricep-long'   },
        { name:'Rope Pushdown',              sub:'tricep-lateral'},
        { name:'Wrist Curl (weighted)',      sub:'forearms'      },
        { name:'Dumbbell Curl',              sub:'bicep-short'   },
        { name:'Hammer Curl',                sub:'bicep-long'    },
        { name:'Skull Crusher (light)',      sub:'tricep-long'   },
        { name:'Tricep Dip (assisted)',      sub:'tricep-lateral'},
        { name:'EZ-Bar Curl',                sub:'bicep-short'   },
        { name:'Cable Curl',                 sub:'bicep-short'   },
        { name:'Close-Grip Push-Up',         sub:'tricep-lateral'},
        { name:'Concentration Curl',         sub:'bicep-short'   },
        { name:'Zottman Curl',               sub:'forearms'      },
        { name:'Cable Hammer Curl',          sub:'bicep-long'    },
        { name:'Single-Arm Preacher Curl',   sub:'bicep-short'   },
        { name:'Overhead Cable Extension',   sub:'tricep-long'   },
        { name:'DB Skull Crusher',           sub:'tricep-long'   },
        { name:'Cross-Body Curl',            sub:'bicep-long'    },
        { name:'21s Curl',                   sub:'bicep-short'   },
        { name:'Tate Press (light)',         sub:'tricep-lateral'},
        { name:'Reverse Pushdown',           sub:'forearms'      },
        { name:'Machine Curl',               sub:'bicep-short'   },
        { name:'Reverse Curl',               sub:'forearms'      },
        { name:'Single-Arm Overhead Ext',    sub:'tricep-long'   },
      ],
      advanced: [
        { name:'Incline DB Curl (heavy)',    sub:'bicep-long'    },
        { name:'Preacher Curl (heavy)',      sub:'bicep-short'   },
        { name:'Overhead Extension (heavy)',sub:'tricep-long'    },
        { name:'Rope Pushdown (heavy)',      sub:'tricep-lateral'},
        { name:'Forearm Roller',             sub:'forearms'      },
        { name:'Barbell Curl',               sub:'bicep-short'   },
        { name:'Drag Curl',                  sub:'bicep-long'    },
        { name:'Skull Crusher',              sub:'tricep-long'   },
        { name:'Weighted Tricep Dip',        sub:'tricep-lateral'},
        { name:'EZ-Bar Curl (heavy)',        sub:'bicep-short'   },
        { name:'Spider Curl',                sub:'bicep-short'   },
        { name:'Close-Grip Bench',           sub:'tricep-lateral'},
        { name:'Hammer Curl (heavy)',        sub:'bicep-long'    },
        { name:'Zottman Curl (heavy)',       sub:'forearms'      },
        { name:'Cable Curl (heavy)',         sub:'bicep-short'   },
        { name:'French Press',               sub:'tricep-long'   },
        { name:'Band-Resisted Curl',         sub:'bicep-short'   },
        { name:'Tate Press',                 sub:'tricep-lateral'},
        { name:'21s (heavy)',                sub:'bicep-short'   },
        { name:'Cluster Curl Set',           sub:'bicep-short'   },
        { name:'Barbell Reverse Curl',       sub:'forearms'      },
        { name:'One-Arm Cable Curl',         sub:'bicep-short'   },
        { name:'Reverse Barbell Curl',       sub:'forearms'      },
        { name:'Loaded Narrow Push-Up',      sub:'tricep-lateral'},
        { name:'Single-Arm Overhead Ext (heavy)',sub:'tricep-long'},
      ],
    },
  },
  core: {
    male: {
      beginner: [
        { name:'Crunches',                   sub:'upper-abs'     },
        { name:'Leg Raise',                  sub:'lower-abs'     },
        { name:'Russian Twist (BW)',         sub:'obliques'      },
        { name:'Plank',                      sub:'deep-core'     },
        { name:'Superman Hold',              sub:'lower-back-core'},
        { name:'Bicycle Crunch',             sub:'obliques'      },
        { name:'Reverse Crunch',             sub:'lower-abs'     },
        { name:'Dead Bug',                   sub:'deep-core'     },
        { name:'Bird Dog',                   sub:'lower-back-core'},
        { name:'Side Plank',                 sub:'obliques'      },
        { name:'Mountain Climber',           sub:'upper-abs'     },
        { name:'Flutter Kick',               sub:'lower-abs'     },
        { name:'Heel Tap',                   sub:'obliques'      },
        { name:'Hollow Body Hold',           sub:'deep-core'     },
        { name:'Toe Touch Crunch',           sub:'upper-abs'     },
        { name:'Seated Knee Tuck',           sub:'lower-abs'     },
        { name:'High Knee March',            sub:'lower-abs'     },
        { name:'Ab Wheel (kneeling)',        sub:'deep-core'     },
        { name:'Pallof Press (light)',       sub:'deep-core'     },
        { name:'V-Up (modified)',            sub:'upper-abs'     },
        { name:'Side Crunch',                sub:'obliques'      },
        { name:'Stability Ball Crunch',      sub:'upper-abs'     },
        { name:'Cable Crunch (light)',       sub:'upper-abs'     },
        { name:'Glute Bridge',               sub:'lower-back-core'},
        { name:'Standing Oblique Crunch',    sub:'obliques'      },
      ],
      intermediate: [
        { name:'Weighted Crunch',            sub:'upper-abs'     },
        { name:'Hanging Leg Raise',          sub:'lower-abs'     },
        { name:'Russian Twist (weighted)',   sub:'obliques'      },
        { name:'Ab Wheel Rollout',           sub:'deep-core'     },
        { name:'Good Morning',               sub:'lower-back-core'},
        { name:'Cable Crunch',               sub:'upper-abs'     },
        { name:'Toes-to-Bar',                sub:'lower-abs'     },
        { name:'V-Up',                       sub:'upper-abs'     },
        { name:'Copenhagen Plank',           sub:'obliques'      },
        { name:'L-Sit Hold',                 sub:'deep-core'     },
        { name:'Windshield Wiper',           sub:'obliques'      },
        { name:'Wood Chop (cable)',          sub:'obliques'      },
        { name:'Plank with Reach',           sub:'deep-core'     },
        { name:'Side Plank (weighted)',      sub:'obliques'      },
        { name:'GHD Crunch',                 sub:'upper-abs'     },
        { name:'Decline Crunch',             sub:'upper-abs'     },
        { name:'Hanging Knee Raise',         sub:'lower-abs'     },
        { name:'Suitcase Carry',             sub:'obliques'      },
        { name:'Farmer Walk',                sub:'deep-core'     },
        { name:'Hollow Body Rock',           sub:'deep-core'     },
        { name:'Dragon Flag (assisted)',     sub:'lower-abs'     },
        { name:'Pallof Press',               sub:'deep-core'     },
        { name:'Stability Ball Rollout',     sub:'deep-core'     },
        { name:'Ab Wheel (standing)',        sub:'deep-core'     },
        { name:'Single-Leg Dead Bug',        sub:'lower-back-core'},
      ],
      advanced: [
        { name:'GHD Sit-Up',                 sub:'upper-abs'     },
        { name:'Dragon Flag',                sub:'lower-abs'     },
        { name:'Weighted Russian Twist',     sub:'obliques'      },
        { name:'Barbell Rollout',            sub:'deep-core'     },
        { name:'Loaded Good Morning',        sub:'lower-back-core'},
        { name:'Cable Crunch (heavy)',       sub:'upper-abs'     },
        { name:'Toes-to-Bar (strict)',       sub:'lower-abs'     },
        { name:'L-Sit',                      sub:'deep-core'     },
        { name:'Copenhagen Plank (elevated)',sub:'obliques'      },
        { name:'Planche Lean',               sub:'deep-core'     },
        { name:'Windshield Wiper (straight)',sub:'obliques'      },
        { name:'Heavy Wood Chop',            sub:'obliques'      },
        { name:'Weighted Hanging Leg Raise', sub:'lower-abs'     },
        { name:'Advanced Copenhagen',        sub:'obliques'      },
        { name:'Ab Wheel Dragon Flag',       sub:'lower-abs'     },
        { name:'Heavy Suitcase Carry',       sub:'obliques'      },
        { name:'Hanging Windshield Wiper',   sub:'obliques'      },
        { name:'Front Lever (tuck)',         sub:'deep-core'     },
        { name:'Hollow Body Press',          sub:'deep-core'     },
        { name:'Pallof Press (heavy)',       sub:'deep-core'     },
        { name:'Weighted V-Up',              sub:'upper-abs'     },
        { name:'Dragon Flag Negative',       sub:'lower-abs'     },
        { name:'Single-Arm Farmer Walk',     sub:'deep-core'     },
        { name:'Loaded Plank',               sub:'deep-core'     },
        { name:'Tuck Planche Hold',          sub:'deep-core'     },
      ],
    },
    female: {
      beginner: [
        { name:'Crunches',                   sub:'upper-abs'     },
        { name:'Leg Raise (bent knee)',      sub:'lower-abs'     },
        { name:'Side Crunch',                sub:'obliques'      },
        { name:'Plank',                      sub:'deep-core'     },
        { name:'Superman Hold',              sub:'lower-back-core'},
        { name:'Bicycle Crunch',             sub:'obliques'      },
        { name:'Reverse Crunch',             sub:'lower-abs'     },
        { name:'Dead Bug',                   sub:'deep-core'     },
        { name:'Bird Dog',                   sub:'lower-back-core'},
        { name:'Side Plank',                 sub:'obliques'      },
        { name:'Mountain Climber',           sub:'upper-abs'     },
        { name:'Flutter Kick',               sub:'lower-abs'     },
        { name:'Heel Tap',                   sub:'obliques'      },
        { name:'Hollow Body Hold',           sub:'deep-core'     },
        { name:'Toe Touch Crunch',           sub:'upper-abs'     },
        { name:'Seated Knee Tuck',           sub:'lower-abs'     },
        { name:'High Knee March',            sub:'lower-abs'     },
        { name:'Ab Bike',                    sub:'obliques'      },
        { name:'Pallof Press (light)',       sub:'deep-core'     },
        { name:'V-Up (modified)',            sub:'upper-abs'     },
        { name:'Glute Bridge',               sub:'lower-back-core'},
        { name:'Stability Ball Crunch',      sub:'upper-abs'     },
        { name:'Scissor Kick',               sub:'lower-abs'     },
        { name:'Standing Oblique Crunch',    sub:'obliques'      },
        { name:'Single-Leg Dead Bug',        sub:'lower-back-core'},
      ],
      intermediate: [
        { name:'Weighted Crunch',            sub:'upper-abs'     },
        { name:'Hanging Knee Raise',         sub:'lower-abs'     },
        { name:'Russian Twist (weighted)',   sub:'obliques'      },
        { name:'Ab Wheel Rollout',           sub:'deep-core'     },
        { name:'Back Extension (weighted)',  sub:'lower-back-core'},
        { name:'Cable Crunch',               sub:'upper-abs'     },
        { name:'Toes-to-Bar',                sub:'lower-abs'     },
        { name:'V-Up',                       sub:'upper-abs'     },
        { name:'Copenhagen Plank',           sub:'obliques'      },
        { name:'L-Sit Hold (tuck)',          sub:'deep-core'     },
        { name:'Windshield Wiper (bent)',    sub:'obliques'      },
        { name:'Wood Chop (cable)',          sub:'obliques'      },
        { name:'Plank with Reach',           sub:'deep-core'     },
        { name:'Side Plank (weighted)',      sub:'obliques'      },
        { name:'GHD Crunch',                 sub:'upper-abs'     },
        { name:'Decline Crunch',             sub:'upper-abs'     },
        { name:'Hanging Leg Raise',          sub:'lower-abs'     },
        { name:'Suitcase Carry',             sub:'obliques'      },
        { name:'Farmer Walk',                sub:'deep-core'     },
        { name:'Hollow Body Rock',           sub:'deep-core'     },
        { name:'Dragon Flag (assisted)',     sub:'lower-abs'     },
        { name:'Pallof Press',               sub:'deep-core'     },
        { name:'Stability Ball Rollout',     sub:'deep-core'     },
        { name:'Ab Wheel (standing)',        sub:'deep-core'     },
        { name:'Single-Leg Dead Bug',        sub:'lower-back-core'},
      ],
      advanced: [
        { name:'GHD Sit-Up',                 sub:'upper-abs'     },
        { name:'Dragon Flag',                sub:'lower-abs'     },
        { name:'Weighted Russian Twist',     sub:'obliques'      },
        { name:'Barbell Rollout',            sub:'deep-core'     },
        { name:'Loaded Back Extension',      sub:'lower-back-core'},
        { name:'Cable Crunch (heavy)',       sub:'upper-abs'     },
        { name:'Toes-to-Bar',                sub:'lower-abs'     },
        { name:'L-Sit',                      sub:'deep-core'     },
        { name:'Copenhagen Plank (elevated)',sub:'obliques'      },
        { name:'Planche Lean',               sub:'deep-core'     },
        { name:'Windshield Wiper (straight)',sub:'obliques'      },
        { name:'Heavy Wood Chop',            sub:'obliques'      },
        { name:'Weighted Hanging Leg Raise', sub:'lower-abs'     },
        { name:'Advanced Copenhagen',        sub:'obliques'      },
        { name:'Ab Wheel Dragon Flag',       sub:'lower-abs'     },
        { name:'Heavy Suitcase Carry',       sub:'obliques'      },
        { name:'Hanging Windshield Wiper',   sub:'obliques'      },
        { name:'Front Lever (tuck)',         sub:'deep-core'     },
        { name:'Hollow Body Press',          sub:'deep-core'     },
        { name:'Pallof Press (heavy)',       sub:'deep-core'     },
        { name:'Weighted V-Up',              sub:'upper-abs'     },
        { name:'Dragon Flag Negative',       sub:'lower-abs'     },
        { name:'Single-Arm Farmer Walk',     sub:'deep-core'     },
        { name:'Loaded Plank',               sub:'deep-core'     },
        { name:'Stomach Vacuum',             sub:'deep-core'     },
      ],
    },
  },
  glutes: {
    male: {
      beginner: [
        { name:'Hip Thrust (BW)',            sub:'glute-max'     },
        { name:'Romanian DL (light)',        sub:'hamstring-glute'},
        { name:'Fire Hydrant',               sub:'glute-med'     },
        { name:'Kneeling Squat',             sub:'hip-flexors'   },
        { name:'Lateral Band Walk',          sub:'abductors'     },
        { name:'Glute Bridge',               sub:'glute-max'     },
        { name:'Donkey Kick (BW)',           sub:'glute-max'     },
        { name:'Clamshell',                  sub:'glute-med'     },
        { name:'Reverse Lunge (BW)',         sub:'hip-flexors'   },
        { name:'Step-Up',                    sub:'glute-max'     },
        { name:'Sumo Squat',                 sub:'abductors'     },
        { name:'Single-Leg Glute Bridge',    sub:'glute-max'     },
        { name:'Banded Squat',               sub:'glute-med'     },
        { name:'Hip Hinge (BW)',             sub:'hamstring-glute'},
        { name:'Glute Squeeze Hold',         sub:'glute-max'     },
        { name:'Seated Hip Abduction',       sub:'abductors'     },
        { name:'Prone Hip Extension',        sub:'glute-max'     },
        { name:'TRX Hip Thrust',             sub:'glute-max'     },
        { name:'Resistance Band Hip Thrust', sub:'glute-max'     },
        { name:'Box Squat (BW)',             sub:'glute-max'     },
        { name:'Frog Pump',                  sub:'glute-max'     },
        { name:'Side-Lying Clam',            sub:'glute-med'     },
        { name:'Standing Band Kickback',     sub:'glute-max'     },
        { name:'Supine Hip Abduction',       sub:'abductors'     },
        { name:'Cable Hip Extension (light)',sub:'glute-max'     },
      ],
      intermediate: [
        { name:'Hip Thrust (barbell)',       sub:'glute-max'     },
        { name:'Romanian Deadlift',          sub:'hamstring-glute'},
        { name:'Cable Kickback',             sub:'glute-med'     },
        { name:'Good Morning',               sub:'hip-flexors'   },
        { name:'Lateral Lunge',              sub:'abductors'     },
        { name:'Bulgarian Split Squat',      sub:'glute-max'     },
        { name:'Sumo Deadlift',              sub:'abductors'     },
        { name:'Glute Bridge (weighted)',    sub:'glute-max'     },
        { name:'Hip Abduction Machine',      sub:'abductors'     },
        { name:'Single-Leg Romanian DL',     sub:'hamstring-glute'},
        { name:'Reverse Hyper',              sub:'glute-max'     },
        { name:'Cable Pull-Through',         sub:'hamstring-glute'},
        { name:'Donkey Kick (cable)',        sub:'glute-max'     },
        { name:'Fire Hydrant (cable)',       sub:'glute-med'     },
        { name:'Back Extension',             sub:'glute-max'     },
        { name:'Box Squat',                  sub:'glute-max'     },
        { name:'Frog Pump (weighted)',       sub:'glute-max'     },
        { name:'Banded Hip Thrust',          sub:'glute-max'     },
        { name:'Step-Up (weighted)',         sub:'glute-max'     },
        { name:'Hex Bar Deadlift',           sub:'glute-max'     },
        { name:'Curtsy Lunge',               sub:'abductors'     },
        { name:'Nordic Curl',                sub:'hamstring-glute'},
        { name:'Leg Press (high foot)',      sub:'glute-max'     },
        { name:'Single-Leg Press',           sub:'glute-max'     },
        { name:'Glute Ham Raise',            sub:'hamstring-glute'},
      ],
      advanced: [
        { name:'Heavy Barbell Hip Thrust',   sub:'glute-max'     },
        { name:'Romanian DL (heavy)',        sub:'hamstring-glute'},
        { name:'Heavy Cable Kickback',       sub:'glute-med'     },
        { name:'Loaded Good Morning',        sub:'hip-flexors'   },
        { name:'Loaded Lateral Lunge',       sub:'abductors'     },
        { name:'Sumo Deadlift (heavy)',      sub:'abductors'     },
        { name:'Barbell Glute Bridge',       sub:'glute-max'     },
        { name:'Single-Leg Hip Thrust',      sub:'glute-max'     },
        { name:'Paused Hip Thrust',          sub:'glute-max'     },
        { name:'Single-Leg RDL (heavy)',     sub:'hamstring-glute'},
        { name:'Reverse Hyper (weighted)',   sub:'glute-max'     },
        { name:'Cable Pull-Through (heavy)', sub:'hamstring-glute'},
        { name:'GHD Hip Extension',          sub:'glute-max'     },
        { name:'Deficit Hip Thrust',         sub:'glute-max'     },
        { name:'Loaded Back Extension',      sub:'glute-max'     },
        { name:'Box Squat (heavy)',          sub:'glute-max'     },
        { name:'Hip Thrust 21s',             sub:'glute-max'     },
        { name:'Band-Resisted Hip Thrust',   sub:'glute-max'     },
        { name:'Curtsy Lunge (heavy)',       sub:'abductors'     },
        { name:'Glute Ham Raise (weighted)', sub:'hamstring-glute'},
        { name:'Nordic Hamstring Curl',      sub:'hamstring-glute'},
        { name:'Hex Bar Hip Hinge',          sub:'glute-max'     },
        { name:'Heavy Leg Press (high foot)',sub:'glute-max'     },
        { name:'Loaded Step-Up',             sub:'glute-max'     },
        { name:'Explosive Hip Thrust',       sub:'glute-max'     },
      ],
    },
    female: {
      beginner: [
        { name:'Hip Thrust (BW)',            sub:'glute-max'     },
        { name:'Romanian DL (light)',        sub:'hamstring-glute'},
        { name:'Fire Hydrant',               sub:'glute-med'     },
        { name:'Reverse Lunge (BW)',         sub:'hip-flexors'   },
        { name:'Lateral Band Walk',          sub:'abductors'     },
        { name:'Glute Bridge',               sub:'glute-max'     },
        { name:'Donkey Kick (BW)',           sub:'glute-max'     },
        { name:'Clamshell',                  sub:'glute-med'     },
        { name:'Single-Leg Glute Bridge',    sub:'glute-max'     },
        { name:'Frog Pump',                  sub:'glute-max'     },
        { name:'Sumo Squat (BW)',            sub:'abductors'     },
        { name:'Banded Squat',               sub:'glute-med'     },
        { name:'Hip Hinge (BW)',             sub:'hamstring-glute'},
        { name:'Glute Squeeze Hold',         sub:'glute-max'     },
        { name:'Seated Hip Abduction Machine',sub:'abductors'    },
        { name:'Prone Hip Extension',        sub:'glute-max'     },
        { name:'TRX Hip Thrust',             sub:'glute-max'     },
        { name:'Resistance Band Hip Thrust', sub:'glute-max'     },
        { name:'Step-Up',                    sub:'glute-max'     },
        { name:'Donkey Kick (band)',         sub:'glute-max'     },
        { name:'Side-Lying Hip Abduction',   sub:'abductors'     },
        { name:'Standing Band Kickback',     sub:'glute-max'     },
        { name:'Kneeling Squat',             sub:'hip-flexors'   },
        { name:'Supine Hip Abduction',       sub:'abductors'     },
        { name:'Cable Hip Extension (light)',sub:'glute-max'     },
      ],
      intermediate: [
        { name:'Hip Thrust (barbell)',       sub:'glute-max'     },
        { name:'Romanian Deadlift',          sub:'hamstring-glute'},
        { name:'Cable Kickback',             sub:'glute-med'     },
        { name:'Curtsy Lunge',               sub:'hip-flexors'   },
        { name:'Hip Abduction Machine',      sub:'abductors'     },
        { name:'Bulgarian Split Squat',      sub:'glute-max'     },
        { name:'Sumo Deadlift',              sub:'abductors'     },
        { name:'Glute Bridge (weighted)',    sub:'glute-max'     },
        { name:'Donkey Kick (cable)',        sub:'glute-med'     },
        { name:'Single-Leg Romanian DL',     sub:'hamstring-glute'},
        { name:'Reverse Hyper',              sub:'glute-max'     },
        { name:'Cable Pull-Through',         sub:'hamstring-glute'},
        { name:'Fire Hydrant (cable)',       sub:'glute-med'     },
        { name:'Back Extension',             sub:'glute-max'     },
        { name:'Box Squat',                  sub:'glute-max'     },
        { name:'Frog Pump (weighted)',       sub:'glute-max'     },
        { name:'Banded Hip Thrust',          sub:'glute-max'     },
        { name:'Step-Up (weighted)',         sub:'glute-max'     },
        { name:'Glute Kickback (cable)',     sub:'glute-max'     },
        { name:'Lateral Lunge',              sub:'abductors'     },
        { name:'Good Morning',               sub:'hip-flexors'   },
        { name:'Nordic Curl (assisted)',     sub:'hamstring-glute'},
        { name:'Leg Press (high foot)',      sub:'glute-max'     },
        { name:'Single-Leg Press',           sub:'glute-max'     },
        { name:'Glute Ham Raise',            sub:'hamstring-glute'},
      ],
      advanced: [
        { name:'Heavy Barbell Hip Thrust',   sub:'glute-max'     },
        { name:'Romanian DL (heavy)',        sub:'hamstring-glute'},
        { name:'Heavy Cable Kickback',       sub:'glute-med'     },
        { name:'Loaded Curtsy Lunge',        sub:'hip-flexors'   },
        { name:'Loaded Lateral Lunge',       sub:'abductors'     },
        { name:'Sumo Deadlift (heavy)',      sub:'abductors'     },
        { name:'Barbell Glute Bridge',       sub:'glute-max'     },
        { name:'Single-Leg Hip Thrust',      sub:'glute-max'     },
        { name:'Paused Hip Thrust',          sub:'glute-max'     },
        { name:'Single-Leg RDL (heavy)',     sub:'hamstring-glute'},
        { name:'Reverse Hyper (weighted)',   sub:'glute-max'     },
        { name:'Cable Pull-Through (heavy)', sub:'hamstring-glute'},
        { name:'GHD Hip Extension',          sub:'glute-max'     },
        { name:'Deficit Hip Thrust',         sub:'glute-max'     },
        { name:'Loaded Back Extension',      sub:'glute-max'     },
        { name:'Box Squat (heavy)',          sub:'glute-max'     },
        { name:'Hip Thrust 21s',             sub:'glute-max'     },
        { name:'Band-Resisted Hip Thrust',   sub:'glute-max'     },
        { name:'Glute Ham Raise (weighted)', sub:'hamstring-glute'},
        { name:'Nordic Hamstring Curl',      sub:'hamstring-glute'},
        { name:'Heavy Leg Press (high foot)',sub:'glute-max'     },
        { name:'Loaded Step-Up',             sub:'glute-max'     },
        { name:'Explosive Hip Thrust',       sub:'glute-max'     },
        { name:'Barbell Squat (glute focus)',sub:'glute-max'     },
        { name:'Weighted Donkey Kick',       sub:'glute-med'     },
      ],
    },
  },
};

function wpPickExercises(muscle, gender, level, goal) {
  const pool = ((EXERCISE_DB[muscle] || {})[gender] || {})[level] || [];
  const gc = GOAL_CONFIG[goal];
  const [minCount, maxCount] = gc.exCount[level];

  let filtered = gc.filter ? pool.filter(e => gc.filter(e.name)) : pool;
  if (filtered.length < minCount) filtered = pool;

  const shuffled = [...filtered].sort(() => Math.random() - 0.5);

  const usedSubs = new Set();
  const selected = [];
  for (const ex of shuffled) {
    if (!usedSubs.has(ex.sub)) {
      usedSubs.add(ex.sub);
      selected.push(ex);
      if (selected.length >= maxCount) break;
    }
  }

  if (selected.length < minCount) {
    for (const ex of shuffled) {
      if (!selected.includes(ex)) {
        selected.push(ex);
        if (selected.length >= minCount) break;
      }
    }
  }

  return selected;
}

const GOAL_STYLES = {
  build_muscle: { color:'#7c3aed', bg:'rgba(139,92,246,.08)', border:'rgba(139,92,246,.25)' },
  lose_fat:     { color:'#ea580c', bg:'rgba(249,115,22,.08)',  border:'rgba(249,115,22,.25)'  },
  maintain:     { color:'#0891b2', bg:'rgba(6,182,212,.08)',   border:'rgba(6,182,212,.25)'   },
  strength:     { color:'#b45309', bg:'rgba(245,158,11,.08)',  border:'rgba(245,158,11,.25)'  },
};
const WP_MUSCLE_LABELS = { chest:'Chest', back:'Back', legs:'Legs', shoulders:'Shoulders', arms:'Arms', core:'Core / Abs', glutes:'Glutes' };
const LEVEL_LABELS = { beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced' };

function wpSetToggle(type, val) {
  WP_STATE[type] = val;
  const groupId = { gender:'wp-gender-group', level:'wp-level-group', goal:'wp-goal-group', muscle:'wp-muscle-group' }[type];
  document.querySelectorAll('#' + groupId + ' .wp-toggle').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}

function wpGetSets(goal, level) {
  const [min, max] = GOAL_CONFIG[goal].setsRange[level];
  return min + Math.floor(Math.random() * (max - min + 1));
}

let wpCurrentPlan = null;

function generateWorkoutPlan() {
  const { gender, level, goal, muscle } = WP_STATE;
  const gc = GOAL_CONFIG[goal];
  const exercises = wpPickExercises(muscle, gender, level, goal);
  wpCurrentPlan = exercises.map((ex, i) => ({
    id: Date.now() + i,
    name: ex.name,
    sub: ex.sub,
    sets: wpGetSets(goal, level),
    reps: gc.repRange[level],
    rest: gc.restSec[level],
    saved: false,
  }));
  wpRenderPlan(gender, level, goal, muscle);
}

function wpRenderPlan(gender, level, goal, muscle) {
  const gc = GOAL_CONFIG[goal];
  const gs = GOAL_STYLES[goal];
  const totalSets = wpCurrentPlan.reduce((s, e) => s + e.sets, 0);
  const restSec = gc.restSec[level];
  const restLabel = restSec >= 60
    ? Math.floor(restSec / 60) + (restSec % 60 ? ':' + String(restSec % 60).padStart(2, '0') : '') + ' min'
    : restSec + ' sec';

  const exHtml = wpCurrentPlan.map((ex, i) => {
    const subLabel = SUB_TARGET_LABELS[ex.sub] || ex.sub;
    const subColor = SUB_TARGET_COLORS[ex.sub] || '#64748b';
    return `
    <div class="wp-exercise-item" id="wp-ex-${ex.id}">
      <div class="wp-ex-num">${i + 1}</div>
      <div class="wp-ex-info">
        <div class="wp-ex-name">${escHtml(ex.name)}</div>
        <div class="wp-ex-meta">
          <span class="wp-sub-badge" style="background:${subColor}18;color:${subColor};border:1px solid ${subColor}30">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="${subColor}"><circle cx="4" cy="4" r="4"/></svg>
            ${subLabel}
          </span>
          <span class="wp-ex-sets-label">${ex.sets} sets × ${ex.reps} reps</span>
        </div>
      </div>
      <div class="wp-ex-actions">
        <button class="wp-save-btn" onclick="wpSaveOne(${ex.id})" id="wp-save-${ex.id}">+ Log</button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('wp-plan-output').innerHTML = `
    <div class="card wp-plan-card">
      <div class="wp-plan-title">${WP_MUSCLE_LABELS[muscle] || muscle} Day</div>
      <div class="wp-meta-badges">
        <span class="wp-badge wp-badge-gender">${gender === 'male' ? '\u2642 Male' : '\u2640 Female'}</span>
        <span class="wp-badge wp-badge-level">${LEVEL_LABELS[level]}</span>
        <span class="wp-badge" style="background:${gs.bg};color:${gs.color};border:1px solid ${gs.border}">${gc.label}</span>
      </div>
      <div class="wp-goal-banner" style="border-color:${gs.border};background:${gs.bg}">
        <div class="wp-goal-banner-icon" style="color:${gs.color}">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
        </div>
        <div>
          <div class="wp-goal-banner-title" style="color:${gs.color}">${gc.label} Protocol</div>
          <div class="wp-goal-banner-desc">${gc.desc}</div>
          <div class="wp-goal-banner-hint">💪 ${gc.weightHint}</div>
        </div>
      </div>
      <div class="wp-summary-strip">
        <div class="wp-summary-pill"><div class="s-label">Exercises</div><div class="s-val">${wpCurrentPlan.length}</div></div>
        <div class="wp-summary-pill"><div class="s-label">Total Sets</div><div class="s-val">${totalSets}</div></div>
        <div class="wp-summary-pill"><div class="s-label">Reps</div><div class="s-val" style="font-size:.85rem">${gc.repRange[level]}</div></div>
        <div class="wp-summary-pill"><div class="s-label">Rest</div><div class="s-val" style="font-size:.85rem">${restLabel}</div></div>
      </div>
      <div class="wp-coverage-row">
        ${wpCurrentPlan.map(ex => {
          const subLabel = SUB_TARGET_LABELS[ex.sub] || ex.sub;
          const subColor = SUB_TARGET_COLORS[ex.sub] || '#64748b';
          return `<span class="wp-coverage-pill" style="background:${subColor}15;color:${subColor};border:1px solid ${subColor}25">${subLabel}</span>`;
        }).join('')}
      </div>
      <div class="wp-rest-hint">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Rest <strong>${restLabel}</strong> between sets · Each exercise targets a <strong>different muscle zone</strong>
      </div>
      <div class="wp-exercises-list">${exHtml}</div>
      <div class="wp-save-all-bar">
        <button class="btn btn-outline" onclick="generateWorkoutPlan()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Regenerate
        </button>
        <button class="btn btn-primary" onclick="wpSaveAllToLog()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save All to Gym Log
        </button>
      </div>
    </div>`;
}

function wpSaveOne(id) {
  if (!wpCurrentPlan) return;
  const ex = wpCurrentPlan.find(e => e.id === id);
  if (!ex || ex.saved) return;
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  const repsNum = parseInt(String(ex.reps).split('\u2013')[0]) || 10;
  const newId = Date.now() + Math.floor(Math.random() * 9999);
  wd.exercises.push({
    id: newId, name: ex.name, sets: ex.sets, reps: repsNum, weight: 0,
    notes: (SUB_TARGET_LABELS[ex.sub] || ex.sub) + ' \u2022 ' + ex.sets + '\xD7' + ex.reps,
  });
  wd.muscleGroup = WP_MUSCLE_TO_GYM[WP_STATE.muscle] || WP_STATE.muscle;
  saveGymDay(dateStr, wd);
  ex.saved = true;
  const btn = document.getElementById('wp-save-' + id);
  if (btn) { btn.textContent = '\u2713 Saved'; btn.classList.add('saved'); }
  showToast(ex.name + ' added to gym log!');
}

function wpSaveAllToLog() {
  if (!wpCurrentPlan || !wpCurrentPlan.length) return;
  let count = 0;
  wpCurrentPlan.forEach(ex => { if (!ex.saved) { wpSaveOne(ex.id); count++; } });
  if (count === 0) showToast('All exercises already saved!');
  else showToast(count + ' exercise' + (count > 1 ? 's' : '') + ' saved to gym log!');
}
ENDJS