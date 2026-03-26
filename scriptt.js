// ==================================//
// ==== Main application script =====//
//  ================================//

//Firebase Auth Logic
(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyC5gkCjHI0kRkilUSSPaW1VbqREiFYiZAU",
    authDomain: "todolist-315e6.firebaseapp.com",
    projectId: "todolist-315e6",
    storageBucket: "todolist-315e6.firebasestorage.app",
    messagingSenderId: "1063693394482",
    appId: "1:1063693394482:web:507eed081eecd8ffb8922b",
    measurementId: "G-76JX96V06Q"
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  let currentUser = null;
  let userMenuOpen = false;

  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) { hideAuthGate(); injectUserButton(user); }
    else       { showAuthGate(); removeUserButton(); }
  });

  function showAuthGate() {
    document.getElementById('auth-gate').classList.remove('auth-hidden');
    document.body.classList.add('auth-open');
  }
  function hideAuthGate() {
    document.getElementById('auth-gate').classList.add('auth-hidden');
    document.body.classList.remove('auth-open');
  }

  window.authSwitchTab = function(tab) {
    ['login','signup','reset'].forEach(t => {
      document.getElementById('panel-' + t).classList.toggle('active', t === tab);
      const el = document.getElementById('tab-' + t);
      if (el) el.classList.toggle('active', t === tab);
    });
    clearAllErrors();
  };

  window.authTogglePw = function(id, btn) {
    const input = document.getElementById(id);
    const isText = input.type === 'text';
    input.type = isText ? 'password' : 'text';
    btn.innerHTML = isText
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  };

  window.authPwStrength = function(pw) {
    const wrap  = document.getElementById('pw-strength-wrap');
    const fill  = document.getElementById('pw-strength-fill');
    const label = document.getElementById('pw-strength-label');
    if (!pw) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    let score = 0;
    if (pw.length >= 8)  score++;
    if (pw.length >= 12) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw))   score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { w:'20%', color:'#ef4444', text:'Too Weak'  },
      { w:'40%', color:'#f97316', text:'Weak'      },
      { w:'60%', color:'#eab308', text:'Fair'      },
      { w:'80%', color:'#3b82f6', text:'Good'      },
      { w:'100%',color:'#1fad96', text:'Strong'    },
    ];
    const l = levels[Math.min(score, 4)];
    fill.style.width      = l.w;
    fill.style.background = l.color;
    label.textContent     = l.text;
    label.style.color     = l.color;
  };

  function showErr(id, msg) {
    const el = document.getElementById(id);
    if (el) { el.textContent = msg; el.classList.add('visible'); }
  }
  function clearErr(id) {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  }
  function clearAllErrors() {
    ['login-email-err','login-pw-err','signup-name-err','signup-email-err',
     'signup-pw-err','signup-confirm-err','reset-email-err'].forEach(clearErr);
    ['login-banner','signup-banner','reset-banner'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.className = 'auth-banner'; el.textContent = ''; }
    });
  }
  function showBanner(id, msg, type = 'error') {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = 'auth-banner ' + type;
    el.textContent = msg;
  }
  function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    const labels = { 'login-btn':'Sign In', 'signup-btn':'Create Account', 'reset-btn':'Send Reset Link' };
    btn.innerHTML = loading
      ? '<div class="auth-spinner"></div>'
      : `<span>${labels[btnId] || 'Submit'}</span>`;
  }
  function friendlyError(code) {
    const map = {
      'auth/user-not-found':       'No account found with this email.',
      'auth/wrong-password':       'Incorrect password. Try again.',
      'auth/invalid-credential':   'Invalid email or password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password':        'Password must be at least 6 characters.',
      'auth/invalid-email':        'Please enter a valid email address.',
      'auth/too-many-requests':    'Too many attempts. Try again later.',
      'auth/network-request-failed':'Network error. Check your connection.',
      'auth/popup-closed-by-user': 'Sign-in popup was closed.',
      'auth/cancelled-popup-request': '',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }

  window.authLogin = async function() {
    clearAllErrors();
    const email = document.getElementById('login-email').value.trim();
    const pw    = document.getElementById('login-password').value;
    let valid = true;
    if (!email) { showErr('login-email-err', 'Email is required'); valid = false; }
    if (!pw)    { showErr('login-pw-err',    'Password is required'); valid = false; }
    if (!valid) return;
    setLoading('login-btn', true);
    try { await auth.signInWithEmailAndPassword(email, pw); }
    catch (e) { const m = friendlyError(e.code); if (m) showBanner('login-banner', m, 'error'); }
    finally   { setLoading('login-btn', false); }
  };

  window.authSignup = async function() {
    clearAllErrors();
    const name    = document.getElementById('signup-name').value.trim();
    const email   = document.getElementById('signup-email').value.trim();
    const pw      = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    let valid = true;
    if (!name)            { showErr('signup-name-err',    'Display name is required'); valid = false; }
    if (!email)           { showErr('signup-email-err',   'Email is required'); valid = false; }
    if (!pw)              { showErr('signup-pw-err',      'Password is required'); valid = false; }
    else if (pw.length<8) { showErr('signup-pw-err',      'Minimum 8 characters'); valid = false; }
    if (pw !== confirm)   { showErr('signup-confirm-err', 'Passwords do not match'); valid = false; }
    if (!valid) return;
    setLoading('signup-btn', true);
    try {
      const cred = await auth.createUserWithEmailAndPassword(email, pw);
      await cred.user.updateProfile({ displayName: name });
    }
    catch (e) { const m = friendlyError(e.code); if (m) showBanner('signup-banner', m, 'error'); }
    finally   { setLoading('signup-btn', false); }
  };

  window.authResetPassword = async function() {
    clearAllErrors();
    const email = document.getElementById('reset-email').value.trim();
    if (!email) { showErr('reset-email-err', 'Email is required'); return; }
    setLoading('reset-btn', true);
    try {
      await auth.sendPasswordResetEmail(email);
      showBanner('reset-banner', 'Reset link sent! Check your inbox.', 'success');
    }
    catch (e) { const m = friendlyError(e.code); if (m) showBanner('reset-banner', m, 'error'); }
    finally   { setLoading('reset-btn', false); }
  };

  // Enter key
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const gate = document.getElementById('auth-gate');
    if (gate && gate.classList.contains('auth-hidden')) return;
    if (document.getElementById('panel-login').classList.contains('active'))  window.authLogin();
    else if (document.getElementById('panel-signup').classList.contains('active')) window.authSignup();
    else if (document.getElementById('panel-reset').classList.contains('active'))  window.authResetPassword();
  });

  // ── Header user button ──
  function getInitials(str) {
    if (!str) return '?';
    const p = str.trim().split(/\s+/);
    return p.length >= 2 ? (p[0][0] + p[1][0]).toUpperCase() : str.substring(0,2).toUpperCase();
  }

  function injectUserButton(user) {
    removeUserButton();
    const header = document.querySelector('.header-inner');
    if (!header) return;
    const initials = getInitials(user.displayName || user.email);
    const firstName = user.displayName ? user.displayName.split(' ')[0] : 'Account';
    const wrap = document.createElement('div');
    wrap.className = 'auth-user-wrap';
    wrap.id = 'auth-user-wrap';
    wrap.innerHTML = `
      <button class="auth-user-btn" onclick="authToggleMenu()" aria-label="Account menu">
        <div class="auth-avatar">${initials}</div>
        <span>${firstName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="auth-user-menu" id="auth-user-menu" style="display:none">
        <div class="auth-user-menu-header">
          <div class="auth-user-menu-name">${user.displayName || 'Athlete'}</div>
          <div class="auth-user-menu-email">${user.email}</div>
        </div>
        <button class="auth-menu-item" onclick="authGoToProfile()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Body Profile
        </button>
        <button class="auth-menu-item danger" onclick="authSignOut()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>
    `;
    const darkToggle = header.querySelector('.dark-toggle');
    if (darkToggle) header.insertBefore(wrap, darkToggle);
    else header.appendChild(wrap);
    document.addEventListener('click', outsideMenuClose);
  }

  function removeUserButton() {
    const el = document.getElementById('auth-user-wrap');
    if (el) el.remove();
    document.removeEventListener('click', outsideMenuClose);
  }

  function outsideMenuClose(e) {
    const wrap = document.getElementById('auth-user-wrap');
    if (wrap && !wrap.contains(e.target)) closeUserMenu();
  }

  window.authToggleMenu = function() {
    const menu = document.getElementById('auth-user-menu');
    if (!menu) return;
    userMenuOpen = !userMenuOpen;
    menu.style.display = userMenuOpen ? 'block' : 'none';
  };

  function closeUserMenu() {
    const menu = document.getElementById('auth-user-menu');
    if (menu) menu.style.display = 'none';
    userMenuOpen = false;
  }

  window.authSignOut = async function() {
    closeUserMenu();
    await auth.signOut();
    if (typeof showToast === 'function') showToast('Signed out. See you next session 💪', 'success');
  };

  window.authGoToProfile = function() {
    closeUserMenu();
    if (typeof navigate === 'function') navigate('profile');
  };

  window.getAuthUser = () => currentUser;
})();
// ── PWA Install Prompt ──────────────────────────────────────────────
let pwaInstallPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  pwaInstallPrompt = e;
  showToast("📲 Install FitForge on your device!", "success");
});

async function triggerPWAInstall() {
  if (!pwaInstallPrompt) return;
  pwaInstallPrompt.prompt();
  const { outcome } = await pwaInstallPrompt.userChoice;
  console.log("[PWA] Install outcome:", outcome);
  pwaInstallPrompt = null;
}

window.addEventListener("appinstalled", () => {
  console.log("[PWA] App installed!");
  pwaInstallPrompt = null;
});
// ── End PWA Install Prompt ──────────────────────────────────────────

// localStorage key constants used throughout the app
const KEYS = {
  food: "ns_food",
  goals: "ns_goals",
  default_goals: "ns_default_goals",
  gym: "ns_gym",
  profile: "ns_profile",
};

// Counter used to generate unique numeric IDs
let _uidCounter = 0;
function uniqueId() {
  return Date.now() * 1000 + (++_uidCounter % 1000);
}
 
// Generic localStorage read helper — returns parsed JSON or null
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}
// Generic localStorage write helper — serialises value to JSON
function save(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// Returns array of food entries logged on the given date
function getFoodLog(dateStr) {
  const d = load(KEYS.food) || {};
  return d[dateStr] || [];
}
// Persists the food log array for a specific date
function saveFoodLog(dateStr, entries) {
  const d = load(KEYS.food) || {};
  d[dateStr] = entries;
  save(KEYS.food, d);
}

// Returns macro goals for a date, falling back to the default goals
function getGoals(dateStr) {
  const d = load(KEYS.goals) || {};
  if (d[dateStr]) return d[dateStr];
  return getDefaultGoals();
}
// Saves macro goals that apply only to a specific date
function saveGoalsForDate(dateStr, g) {
  const d = load(KEYS.goals) || {};
  d[dateStr] = g;
  save(KEYS.goals, d);
}
// Returns the user's default daily macro goals
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
// Persists the default goals so they apply to all future dates
function saveDefaultGoals(g) {
  save(KEYS.default_goals, g);
}

// Returns the workout object (muscle group + exercise list) for a date
function getGymDay(dateStr) {
  const d = load(KEYS.gym) || {};
  return d[dateStr] || { muscleGroup: "", exercises: [] };
}
// Persists a workout object for the given date
function saveGymDay(dateStr, wd) {
  const d = load(KEYS.gym) || {};
  d[dateStr] = wd;
  save(KEYS.gym, d);
}
// Collects every unique exercise name logged across all gym days
function getAllExerciseNames() {
  const d = load(KEYS.gym) || {};
  const names = new Set();
  Object.values(d).forEach((day) =>
    (day.exercises || []).forEach((e) => names.add(e.name)),
  );
  return [...names].sort();
}
// Returns a chronologically sorted array of weight/sets/reps entries for one exercise
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

// Returns the stored user profile or sensible defaults
function getProfile() {
  return (
    load(KEYS.profile) || {
      height: 175,
      weight: 60,
      age: 20,
      gender: "male",
      activityLevel: "moderate",
      goal: "maintain",
    }
  );
}
// Saves the user profile object to localStorage
function saveProfile_(p) {
  save(KEYS.profile, p);
}

let currentPage = "dashboard";
let dashDate = new Date();
let gymDate = new Date();
let progressChart = null;

// Switches the page between light and dark themes
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

// Toggles dark mode and persists the preference
function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  applyTheme(!isDark);
  localStorage.setItem('fitforge_theme', !isDark ? 'dark' : 'light');
}

// Immediately-invoked function: restores the saved theme on page load
(function initTheme() {
  const saved = localStorage.getItem('fitforge_theme');
  if (saved) {
    applyTheme(saved === 'dark');
  } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark);
  }
})();

// Fades out the current page, then fades in the requested one
function navigate(page) {
  currentPage = page;

  document.querySelectorAll('.page.active').forEach(p => {
    p.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
    p.style.opacity = '0';
    p.style.transform = 'translateY(-6px)';
  });

  setTimeout(() => {
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
      p.style.transition = '';
      p.style.opacity = '';
      p.style.transform = '';
    });

    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    const allBtns = [
      ...document.querySelectorAll('.nav-btn'),
      ...document.querySelectorAll('.mobile-nav-btn'),
    ];
    allBtns.forEach(b => b.classList.remove('active'));
    allBtns
      .filter(b => b.getAttribute('onclick') === `navigate('${page}')`)
      .forEach(b => b.classList.add('active'));

    if (page === 'dashboard') renderDashboard();
    if (page === 'gym') renderGym();
    if (page === 'profile') loadProfile();
  }, 150);
}

// Formats a Date object as YYYY-MM-DD (used as localStorage key)
function fmt(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Returns true if the given Date is today
function isToday(d) {
  return fmt(d) === fmt(new Date());
}
// Returns a human-readable label — 'Today' or a formatted date string
function displayDate(d) {
  if (isToday(d)) return "Today";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
// Returns the full weekday name for a Date object
function weekday(d) {
  return d.toLocaleDateString("en-US", { weekday: "long" });
}
// Returns a new Date shifted by n days relative to d
function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Advances or retreats the dashboard date by n days, then re-renders
function changeDay(n) {
  dashDate = addDays(dashDate, n);
  renderDashboard();
}

// Updates date-nav arrow states and shows/hides the logging-locked banner
function updateDateNavUI(date, forwardBtnId, bannerContainerId) {
  const todayStr = fmt(new Date());
  const dateStr  = fmt(date);
  const isNow    = dateStr === todayStr;
  const isFuture = dateStr > todayStr;

  // Disable forward arrow if already on today or beyond
  const fwdBtn = document.getElementById(forwardBtnId);
  if (fwdBtn) {
    fwdBtn.disabled = isNow || isFuture;
    fwdBtn.style.opacity = (isNow || isFuture) ? '0.3' : '';
    fwdBtn.style.cursor  = (isNow || isFuture) ? 'not-allowed' : '';
  }

  // Show/hide the "read-only day" banner
  const banner = document.getElementById(bannerContainerId);
  if (banner) {
    if (!isNow) {
      banner.innerHTML = `
        <div class="date-lock-banner">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span>${isFuture ? 'Future dates are read-only.' : 'Past dates are read-only.'} Logging is only allowed for today.</span>
        </div>`;
      banner.style.display = 'block';
    } else {
      banner.style.display = 'none';
      banner.innerHTML = '';
    }
  }
}

// Rebuilds the entire dashboard view for the currently selected date
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
  updateDateNavUI(dashDate, 'dash-fwd-btn', 'dash-lock-banner');
  const addFoodBtn = document.getElementById('add-food-btn');
  if (addFoodBtn) addFoodBtn.style.display = isToday(dashDate) ? '' : 'none';
}

// Generates the four macro cards (calories, protein, carbs, fat)
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

// Renders the list of food entries or an empty-state message
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
          <span class="food-macro-tag fat-color">🥑 ${e.fat}g Fat</span>
        </div>
      </div>
      <button class="btn-icon delete-btn" onclick="deleteFood(${e.id})">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>`,
    )
    .join("");
}

// Reads the Add-Food modal inputs, validates, and saves a new entry
function addFood() {
  if (!isToday(dashDate)) {
    closeModal("add-food-modal");
    showToast("You can only log data for today.");
    return;
  }
  const name = document.getElementById("f-name").value.trim();
  if (!name) {
    document.getElementById("f-name-err").style.display = "block";
    return;
  }
  document.getElementById("f-name-err").style.display = "none";
  const entry = {
    id: uniqueId(),
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

// Removes a single food entry by ID and refreshes the dashboard
function deleteFood(id) {
  if (!isToday(dashDate)) {
    showToast("Logging is only allowed for the current day.");
    return;
  }
  const dateStr = fmt(dashDate);
  const numId = Number(id);
  const entries = getFoodLog(dateStr).filter((e) => Number(e.id) !== numId);
  saveFoodLog(dateStr, entries);
  renderDashboard();
}

// Reads the Edit-Goals modal inputs and persists goals for the current date
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

// Available muscle-group labels shown as selectable chips on the Gym page
const MUSCLE_GROUPS = [
  "Chest", "Back", "Legs", "Shoulders", "Arms", "Core / Abs", "Glutes", "Full Body", "Cardio",
];

// Advances or retreats the gym date by n days, then re-renders
function changeGymDay(n) {
  gymDate = addDays(gymDate, n);
  renderGym();
}

// Rebuilds the Gym page (date header, muscle chips, exercise list)
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
  updateDateNavUI(gymDate, 'gym-fwd-btn', 'gym-lock-banner');
  const addExBtn = document.getElementById('add-exercise-btn');
  const setMuscleContainer = document.getElementById('muscle-chips');
  if (addExBtn) addExBtn.style.display = isToday(gymDate) ? '' : 'none';
  if (setMuscleContainer) { const chips = setMuscleContainer.querySelectorAll('.muscle-chip'); chips.forEach(c => { c.style.pointerEvents = isToday(gymDate) ? '' : 'none'; c.style.opacity = isToday(gymDate) ? '' : '0.4'; }); }
}

// Saves the chosen muscle group for the current gym date
function setMuscleGroup(mg) {
  if (!isToday(gymDate)) {
    showToast("You can only log data for today.");
    return;
  }
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  wd.muscleGroup = mg;
  saveGymDay(dateStr, wd);
  renderGym();
}

// Generates the exercise table rows with inline edit panels
function renderExercises(exercises) {
  const el = document.getElementById("exercises-container");
  if (!exercises.length) {
    el.innerHTML = `<div class="empty-state"><p>No exercises logged yet</p><p>Add your first exercise to track your workout.</p></div>`;
    return;
  }

  el.innerHTML = `
    <div class="ex-list">
      <div class="ex-list-header">
        <span class="ex-col-name">Exercise</span>
        <span class="ex-col-stat">Sets</span>
        <span class="ex-col-stat">Reps</span>
        <span class="ex-col-stat">Weight</span>
        <span class="ex-col-actions"></span>
      </div>
      ${exercises.map((ex) => {
        const safeId = String(ex.id).replace(/[^a-zA-Z0-9_-]/g, '_');
        const showNote = ex.notes && !ex.notes.includes('\u2022');
        return `
      <div class="ex-row" id="ex-row-${safeId}">
        <div class="ex-row-main">
          <div class="ex-col-name">
            <div class="exercise-name">${escHtml(ex.name)}</div>
            ${showNote ? `<div class="exercise-notes">${escHtml(ex.notes)}</div>` : ""}
          </div>
          <div class="ex-col-stat">${ex.sets}</div>
          <div class="ex-col-stat">${ex.reps}</div>
          <div class="ex-col-stat">${ex.weight} kg</div>
          <div class="ex-col-actions">
            <button class="ex-btn-edit" onclick="startEdit('${safeId}')" title="Edit">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="ex-btn-delete" onclick="deleteExercise('${safeId}')" title="Delete">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
        <div class="ex-edit-panel" id="edit-row-${safeId}">
          <div class="ex-edit-grid">
            <div class="form-group"><label class="form-label">Name</label><input id="ee-name-${safeId}" class="form-input" style="height:38px" value="${escHtml(ex.name)}"></div>
            <div class="form-group"><label class="form-label">Sets</label><input id="ee-sets-${safeId}" type="number" class="form-input" style="height:38px;text-align:center" value="${ex.sets}"></div>
            <div class="form-group"><label class="form-label">Reps</label><input id="ee-reps-${safeId}" type="number" class="form-input" style="height:38px;text-align:center" value="${ex.reps}"></div>
            <div class="form-group"><label class="form-label">Weight (kg)</label><input id="ee-weight-${safeId}" type="number" step="0.5" class="form-input" style="height:38px;text-align:center" value="${ex.weight}"></div>
          </div>
          <div style="display:flex;gap:.5rem;margin-top:.6rem">
            <button class="btn btn-primary" style="height:36px" onclick="saveEdit('${safeId}')">✓ Save</button>
            <button class="btn btn-ghost" style="height:36px" onclick="cancelEdit('${safeId}')">Cancel</button>
          </div>
        </div>
      </div>`;
      }).join("")}
    </div>`;
}

// Reads the Add-Exercise modal inputs, validates, and saves a new exercise
function addExercise() {
  if (!isToday(gymDate)) {
    closeModal("add-exercise-modal");
    showToast("You can only log data for today.");
    return;
  }
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
    id: uniqueId(),
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

// Removes a single exercise by safe ID and refreshes the gym view
function deleteExercise(id) {
  if (!isToday(gymDate)) {
    showToast("Logging is only allowed for the current day.");
    return;
  }
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  wd.exercises = (wd.exercises || []).filter(
    (e) => String(e.id).replace(/[^a-zA-Z0-9_-]/g, '_') !== String(id)
  );
  saveGymDay(dateStr, wd);
  renderGym();
}

// Opens the inline edit panel for one exercise row
function startEdit(id) {
  document.querySelectorAll(".ex-edit-panel.open").forEach((p) => p.classList.remove("open"));
  const panel = document.getElementById(`edit-row-${id}`);
  if (panel) panel.classList.add("open");
}

// Closes the inline edit panel without saving
function cancelEdit(id) {
  const panel = document.getElementById(`edit-row-${id}`);
  if (panel) panel.classList.remove("open");
}

// Reads the inline edit inputs and updates the matching exercise
function saveEdit(id) {
  if (!isToday(gymDate)) {
    showToast("Logging is only allowed for the current day.");
    cancelEdit(id);
    return;
  }
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

// Renders the legacy strength-progress section (deprecated in favour of progress page)
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

// Draws a Chart.js line chart for the selected exercise
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

// Populates the datalist for the Add-Exercise input with known exercise names
function updateExerciseSuggestions() {
  const names = getAllExerciseNames();
  document.getElementById("exercise-suggestions").innerHTML = names
    .map((n) => `<option value="${escHtml(n)}">`)
    .join("");
}

// Populates the Profile form fields from stored profile data
function loadProfile() {
  const p = getProfile();
  document.getElementById("p-height").value = p.height;
  document.getElementById("p-weight").value = p.weight;
  document.getElementById("p-age").value = p.age;
  document.getElementById("p-gender").value = p.gender;
  const activityMap = { low: "sedentary", moderate: "moderate5", high: "high" };
  const activity = activityMap[p.activityLevel] || p.activityLevel || "moderate5";
  document.getElementById("p-activity").value = activity;
  document.getElementById("p-goal").value = p.goal;
}

// Reads the Profile form, validates, saves, calculates macros, and navigates
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

  const banner = document.getElementById('onboard-banner');
  if (banner) {
    banner.style.transition = 'opacity 0.3s ease';
    banner.style.opacity = '0';
    setTimeout(() => {
      banner.remove();
      navigate('dashboard');
    }, 320);
  }
}

// Calculates TDEE and recommended macros using Mifflin-St Jeor + adjustments
function calcGoals(p) {
  let bmr =
    10 * p.weight +
    6.25 * p.height -
    5 * p.age +
    (p.gender === "male" ? 5 : -161);

  const multMap = {
    sedentary: 1.2,
    light:     1.375,
    moderate3: 1.465,
    moderate5: 1.55,
    high:      1.725,
    athlete:   1.9,
    low:      1.2,
    moderate: 1.55,
  };
  const mult = multMap[p.activityLevel] || 1.55;

  let tdee = bmr * mult;

  let calAdj = 0;
  let proteinMult, fatPct;

  if (p.goal === "build_muscle") {
    calAdj     = 250;       
    proteinMult = 1.8;         
    fatPct      = 0.25;        
  } else if (p.goal === "lose_fat") {
    calAdj     = -400;
    proteinMult = 1.8;  
    fatPct      = 0.28;    
  } else if (p.goal === "strength") {
    calAdj     = 150;     
    proteinMult = 1.8;
    fatPct      = 0.30;
  } else {
    calAdj     = 0;
    proteinMult = 1.6;
    fatPct      = 0.28;
  }

  const calories = Math.round(tdee + calAdj);
  const protein  = Math.round(p.weight * proteinMult);
  const fat      = Math.round((calories * fatPct) / 9);
  const carbs    = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));

  return { calories, protein, carbs, fat };
}

// Renders the recommended-goals panel with calories and macro pills
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

// Saves the calculated macro targets as the user's default daily goals
function applyGoals(cal, pro, carb, fat) {
  const g = { calories: cal, protein: pro, carbs: carb, fat: fat };
  saveDefaultGoals(g);
  showToast("Applied to today & future days!");
}

// Shows a modal overlay by adding the 'open' class
function openModal(id) {
  document.getElementById(id).classList.add("open");
}
// Hides a modal overlay by removing the 'open' class
function closeModal(id) {
  document.getElementById(id).classList.remove("open");
}
// Closes a modal when the user clicks the semi-transparent overlay backdrop
function overlayClose(ev, id) {
  if (ev.target.id === id) closeModal(id);
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    document
      .querySelectorAll(".modal-overlay.open")
      .forEach((m) => m.classList.remove("open"));
});

// Displays a brief notification toast, then fades it out after 2.5 s
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

// Escapes special HTML characters to prevent XSS when inserting user content
function escHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Kick-start the app on first page load
renderDashboard();
updateExerciseSuggestions();

// Attaches click-ripple animations to all present and future buttons
(function initRipple() {
  function addRipple(e) {
    const btn = e.currentTarget;
    btn.classList.add('ripple-host');
    const existing = btn.querySelector('.ripple-wave');
    if (existing) existing.remove();

    const rect = btn.getBoundingClientRect();
    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.left = (e.clientX - rect.left) + 'px';
    wave.style.top  = (e.clientY - rect.top)  + 'px';
    btn.appendChild(wave);
    wave.addEventListener('animationend', () => wave.remove(), { once: true });
  }

  function attachTo(el) {
    if (el.tagName === 'BUTTON' && !el.dataset.rippleAttached) {
      el.dataset.rippleAttached = '1';
      el.addEventListener('click', addRipple);
    }
  }

  document.querySelectorAll('button').forEach(attachTo);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => m.addedNodes.forEach(node => {
      if (node.nodeType !== 1) return;
      if (node.tagName === 'BUTTON') attachTo(node);
      node.querySelectorAll && node.querySelectorAll('button').forEach(attachTo);
    }));
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();

// Detects a first-time visitor (no saved profile) and redirects to the Profile page
(function checkFirstTimeUser() {
  const hasProfile = localStorage.getItem(KEYS.profile);
  if (!hasProfile) {
    const profilePage = document.getElementById('page-profile');
    if (profilePage) {
      const banner = document.createElement('div');
      banner.id = 'onboard-banner';
      banner.className = 'onboard-banner';
      banner.innerHTML = `
        <div class="onboard-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        </div>
        <div class="onboard-body">
          <h2>Welcome to FitForge! 👋</h2>
          <p>Fill in your details below — age, height, weight, goal and activity level — so we can calculate your personalised macro targets and get you started.</p>
        </div>`;
      profilePage.insertBefore(banner, profilePage.firstChild);
    }
    setTimeout(() => navigate('profile'), 80);
  }
})();


// Current filter selections for the Workout Programs page
const WP_STATE = { gender: 'male', level: 'beginner', goal: 'build_muscle', muscle: 'chest' };
const WP_MUSCLE_TO_GYM = { chest:'Chest', back:'Back', legs:'Legs', shoulders:'Shoulders', arms:'Arms', core:'Core / Abs', glutes:'Glutes' };

// Human-readable labels for each sub-target muscle zone used in exercise cards
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

// Brand colours assigned to each muscle sub-target for badge styling
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

// Per-goal training parameters: rep ranges, set counts, rest periods and exercise filters
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

// Master exercise database keyed by muscle → gender → level
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

// Selects a diverse set of exercises ensuring no two share the same sub-target
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

// Accent colours and backgrounds used to theme each goal's plan card
const GOAL_STYLES = {
  build_muscle: { color:'#7c3aed', bg:'rgba(139,92,246,.08)', border:'rgba(139,92,246,.25)' },
  lose_fat:     { color:'#ea580c', bg:'rgba(249,115,22,.08)',  border:'rgba(249,115,22,.25)'  },
  maintain:     { color:'#0891b2', bg:'rgba(6,182,212,.08)',   border:'rgba(6,182,212,.25)'   },
  strength:     { color:'#b45309', bg:'rgba(245,158,11,.08)',  border:'rgba(245,158,11,.25)'  },
};
const WP_MUSCLE_LABELS = { chest:'Chest', back:'Back', legs:'Legs', shoulders:'Shoulders', arms:'Arms', core:'Core / Abs', glutes:'Glutes' };
const LEVEL_LABELS = { beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced' };

// Updates the active state of a toggle button group and the WP_STATE object
function wpSetToggle(type, val) {
  WP_STATE[type] = val;
  const groupId = { gender:'wp-gender-group', level:'wp-level-group', goal:'wp-goal-group', muscle:'wp-muscle-group' }[type];
  document.querySelectorAll('#' + groupId + ' .wp-toggle').forEach(b => b.classList.toggle('active', b.dataset.val === val));
}

// Picks a random set count within the range defined for the goal/level combo
function wpGetSets(goal, level) {
  const [min, max] = GOAL_CONFIG[goal].setsRange[level];
  return min + Math.floor(Math.random() * (max - min + 1));
}

// Holds the currently generated workout plan so save/undo actions can reference it
let wpCurrentPlan = null;

// Picks exercises and builds wpCurrentPlan, then renders it
function generateWorkoutPlan() {
  const { gender, level, goal, muscle } = WP_STATE;
  const gc = GOAL_CONFIG[goal];
  const exercises = wpPickExercises(muscle, gender, level, goal);
  wpCurrentPlan = exercises.map((ex, i) => ({
    id: uniqueId(),
    name: ex.name,
    sub: ex.sub,
    sets: wpGetSets(goal, level),
    reps: gc.repRange[level],
    rest: gc.restSec[level],
    saved: false,
  }));

  // Reset batch-save state whenever a fresh plan is generated
  wpAllSaved    = false;
  wpAllSavedIds = [];

  wpRenderPlan(gender, level, goal, muscle);
}

// Renders the workout plan card with badges, stats, exercise list and action buttons
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
        <button id="wp-save-all-btn" class="btn btn-primary" onclick="wpSaveAllToLog()">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          Save All to Gym Log
        </button>
      </div>
    </div>`;
}

// Toggles a single plan exercise in/out of the gym log for today
function wpSaveOne(id) {
  if (!wpCurrentPlan) return;
  const ex = wpCurrentPlan.find(e => e.id === id);
  if (!ex) return;
  const dateStr = fmt(gymDate);
  const btn = document.getElementById('wp-save-' + id);

  if (!ex.saved) {
    // ── SAVE ──
    const wd = getGymDay(dateStr);
    const repsNum = parseInt(String(ex.reps).split('\u2013')[0]) || 10;
    const newId = uniqueId();
    ex.gymEntryId = newId;
    wd.exercises.push({
      id: newId, name: ex.name, sets: ex.sets, reps: repsNum, weight: 0,
      notes: (SUB_TARGET_LABELS[ex.sub] || ex.sub) + ' \u2022 ' + ex.sets + '\xD7' + ex.reps,
    });
    wd.muscleGroup = WP_MUSCLE_TO_GYM[WP_STATE.muscle] || WP_STATE.muscle;
    saveGymDay(dateStr, wd);
    ex.saved = true;
    if (btn) { btn.textContent = '\u2713 Saved'; btn.classList.add('saved'); }
    showToast(ex.name + ' added to gym log!');
  } else {
    // ── UNDO ──
    const wd = getGymDay(dateStr);
    wd.exercises = wd.exercises.filter(e => e.id !== ex.gymEntryId);
    saveGymDay(dateStr, wd);
    ex.saved = false;
    ex.gymEntryId = null;
    if (btn) { btn.textContent = '+ Log'; btn.classList.remove('saved'); }
    showToast(ex.name + ' removed from gym log.');
  }
}

// Tracks whether all exercises have been batch-saved (for toggle button state)
let wpAllSaved = false;
// Stores the gym entry IDs added by the last "Save All" action for bulk removal
let wpAllSavedIds = [];

// Helper SVG icons for the Save All button
const WP_SAVE_ALL_ICON   = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
const WP_UNSAVE_ALL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>';

// Resets the Save All button back to its default state
function wpResetSaveAllBtn() {
  const btn = document.getElementById('wp-save-all-btn');
  if (!btn) return;
  btn.innerHTML = WP_SAVE_ALL_ICON + ' Save All to Gym Log';
  btn.classList.remove('btn-danger');
  btn.classList.add('btn-primary');
}

// Switches the Save All button to "Unsave All" state
function wpSetUnsaveAllBtn() {
  const btn = document.getElementById('wp-save-all-btn');
  if (!btn) return;
  btn.innerHTML = WP_UNSAVE_ALL_ICON + ' Unsave All Exercises';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-danger');
}

// Saves all unsaved plan exercises to the gym log at once,
// or removes them all if already batch-saved (toggle behaviour)
function wpSaveAllToLog() {
  if (!wpCurrentPlan || !wpCurrentPlan.length) return;
  const dateStr = fmt(gymDate);

  if (wpAllSaved && wpAllSavedIds.length > 0) {
    // ── UNSAVE ALL ──
    const idsToRemove = new Set(wpAllSavedIds);
    const wd = getGymDay(dateStr);
    wd.exercises = wd.exercises.filter(e => !idsToRemove.has(e.id));
    saveGymDay(dateStr, wd);

    // Reset every exercise card button
    wpCurrentPlan.forEach(ex => {
      if (wpAllSavedIds.includes(ex.gymEntryId)) {
        ex.saved      = false;
        ex.gymEntryId = null;
      }
      const btn = document.getElementById('wp-save-' + ex.id);
      if (btn && !ex.saved) { btn.textContent = '+ Log'; btn.classList.remove('saved'); }
    });

    wpAllSaved    = false;
    wpAllSavedIds = [];
    wpResetSaveAllBtn();
    showToast('All exercises removed from Gym Log.');
    return;
  }

  // ── SAVE ALL ──
  const newIds = [];
  wpCurrentPlan.forEach(ex => {
    if (ex.saved) return;
    const repsNum = parseInt(String(ex.reps).split('\u2013')[0]) || 10;
    const newId   = uniqueId();
    const wd      = getGymDay(dateStr);
    ex.gymEntryId = newId;
    wd.exercises.push({
      id:     newId,
      name:   ex.name,
      sets:   ex.sets,
      reps:   repsNum,
      weight: 0,
      notes:  (SUB_TARGET_LABELS[ex.sub] || ex.sub) + ' \u2022 ' + ex.sets + '\xD7' + ex.reps,
    });
    wd.muscleGroup = WP_MUSCLE_TO_GYM[WP_STATE.muscle] || WP_STATE.muscle;
    saveGymDay(dateStr, wd);
    ex.saved = true;
    newIds.push(newId);

    const btn = document.getElementById('wp-save-' + ex.id);
    if (btn) { btn.textContent = '\u2713 Saved'; btn.classList.add('saved'); }
  });

  if (newIds.length === 0) {
    showToast('All exercises already saved!');
    return;
  }

  wpAllSaved    = true;
  wpAllSavedIds = newIds;
  wpSetUnsaveAllBtn();
  showToast(newIds.length + ' exercise' + (newIds.length > 1 ? 's' : '') + ' saved to gym log!');
}

// Meal database keyed by goal → meal type, each entry containing name/ingredients/macros
const MEAL_DB = {

  weight_gain: {
    breakfast: [
      { name:'Peanut Butter Banana Oatmeal',  ingredients:'100g oats, 1 banana, 2 tbsp peanut butter, 250ml whole milk, 1 tbsp honey',                         cal:620, pro:22, carb:88, fat:18 },
      { name:'Egg & Avocado Toast Stack',     ingredients:'2 slices whole wheat toast, 3 eggs, ½ avocado, 1 tomato, 1 tbsp olive oil',                         cal:580, pro:25, carb:42, fat:32 },
      { name:'Greek Yogurt Granola Bowl',     ingredients:'200g full-fat Greek yogurt, 60g granola, 80g mixed berries, 1 tbsp honey',                          cal:540, pro:24, carb:72, fat:14 },
      { name:'Cheese Omelette & Toast',       ingredients:'3 eggs, 40g cheddar, 1 tsp butter, 2 slices whole wheat toast, 200ml OJ',                           cal:600, pro:28, carb:44, fat:30 },
      { name:'Cottage Cheese Pancakes',       ingredients:'150g cottage cheese, 2 eggs, 80g oats, 1 banana, 2 tbsp maple syrup',                               cal:560, pro:30, carb:68, fat:12 },
      { name:'Whole Milk Smoothie Bowl',      ingredients:'300ml whole milk, 100g frozen mango, 1 banana, 1 tbsp chia seeds, 20g almonds',                     cal:590, pro:20, carb:78, fat:16 },
      { name:'Full English Breakfast',        ingredients:'2 eggs, 2 rashers bacon, 2 sausages, 100g baked beans, 2 toast slices, 1 tomato',                   cal:700, pro:35, carb:48, fat:34 },
      { name:'Nut Butter Banana Crepes',      ingredients:'100g flour, 2 eggs, 200ml milk, 3 tbsp almond butter, 1 banana, 2 tbsp syrup',                      cal:620, pro:22, carb:80, fat:20 },
      { name:'Quinoa Breakfast Bowl',         ingredients:'100g quinoa, 250ml whole milk, 30g almonds, 30g dried cranberries, 1 tbsp honey',                   cal:560, pro:18, carb:82, fat:14 },
      { name:'Smoked Salmon Bagel',           ingredients:'1 bagel, 60g cream cheese, 80g smoked salmon, 1 tbsp capers, ¼ red onion',                          cal:580, pro:30, carb:52, fat:22 },
      { name:'Baked Oatmeal Casserole',       ingredients:'100g oats, 1 banana, 30g walnuts, 2 tbsp brown sugar, 1 tsp cinnamon, 200ml milk',                  cal:550, pro:16, carb:80, fat:16 },
      { name:'Breakfast Burrito',             ingredients:'1 large tortilla, 3 scrambled eggs, 40g cheese, 80g black beans, 2 tbsp salsa',                     cal:640, pro:30, carb:65, fat:26 },
      { name:'French Toast with Berries',     ingredients:'2 slices brioche, 2 eggs, 50ml cream, ½ tsp vanilla, 80g berries, 2 tbsp syrup',                    cal:600, pro:20, carb:82, fat:18 },
      { name:'High-Cal Muesli Bowl',          ingredients:'80g muesli, 250ml whole milk, 40g dried fruit, 30g almonds, 1 banana',                              cal:610, pro:16, carb:90, fat:16 },
      { name:'Protein Waffles Stack',         ingredients:'150g waffle mix, 1 scoop protein powder, 1 banana, 1 tbsp butter, 3 tbsp syrup',                    cal:660, pro:34, carb:84, fat:14 },
      { name:'Avocado & Egg Skillet',         ingredients:'3 eggs, ½ avocado, 60g spinach, 1 tbsp olive oil, 30g feta, 2 toast slices',                        cal:570, pro:26, carb:38, fat:34 },
      { name:'Banana Nut Porridge',           ingredients:'100g oats, 1 banana, 30g walnuts, 250ml milk, 1 tbsp honey, ½ tsp cinnamon',                        cal:530, pro:14, carb:76, fat:18 },
      { name:'Breakfast Quesadilla',          ingredients:'1 large flour tortilla, 3 eggs, 40g cheese, ½ bell pepper, 2 tbsp salsa',                           cal:620, pro:28, carb:58, fat:28 },
      { name:'Overnight Oats Deluxe',         ingredients:'100g oats, 250ml milk, 1 tbsp chia seeds, 2 tbsp peanut butter, 1 banana, 1 tbsp honey',            cal:580, pro:20, carb:80, fat:18 },
      { name:'Steak & Egg Plate',             ingredients:'150g sirloin steak, 2 fried eggs, 150g roasted potatoes, 2 toast slices',                           cal:720, pro:42, carb:48, fat:32 },
      { name:'Chocolate Protein Smoothie',    ingredients:'1 banana, 300ml whole milk, 1 tbsp cocoa, 1 scoop protein powder, 1 tbsp almond butter',            cal:600, pro:35, carb:68, fat:18 },
      { name:'Chickpea Scramble',             ingredients:'120g chickpeas, 2 eggs, ¼ tsp turmeric, 60g spinach, 2 toast slices, 1 tbsp olive oil',             cal:520, pro:26, carb:52, fat:18 },
      { name:'Ricotta Toast & Honey',         ingredients:'2 slices sourdough, 80g ricotta, 1 tbsp honey, 20g walnuts, 2 fresh figs',                          cal:540, pro:22, carb:64, fat:18 },
      { name:'Blueberry Protein Pancakes',    ingredients:'80g oats, 2 eggs, 1 scoop protein powder, 80g blueberries, 2 tbsp syrup',                           cal:580, pro:36, carb:72, fat:10 },
      { name:'Hash Brown Egg Muffins',        ingredients:'150g shredded potato, 3 eggs, 40g cheese, 2 rashers bacon, 1 tbsp chives',                          cal:560, pro:26, carb:40, fat:30 },
    ],
    lunch: [
      { name:'Beef & Rice Power Bowl',        ingredients:'150g ground beef, 150g basmati rice, 100g broccoli, 2 tbsp soy sauce, 1 tsp sesame oil',            cal:720, pro:40, carb:78, fat:22 },
      { name:'Chicken Alfredo Pasta',         ingredients:'150g fettuccine, 150g chicken breast, 100ml heavy cream, 40g parmesan, 1 tbsp butter',              cal:780, pro:42, carb:72, fat:34 },
      { name:'Tuna Melt Sub',                 ingredients:'1 sub roll, 150g tuna, 2 tbsp mayo, 40g cheddar, 2 lettuce leaves, 2 tomato slices',                cal:680, pro:36, carb:56, fat:30 },
      { name:'Loaded Burrito Bowl',           ingredients:'150g rice, 100g black beans, 130g chicken, 2 tbsp guacamole, 2 tbsp sour cream, 30g cheese',        cal:750, pro:38, carb:80, fat:28 },
      { name:'Pulled Pork Sandwich',          ingredients:'1 brioche bun, 150g pulled pork, 60g coleslaw, 2 tbsp BBQ sauce, pickles',                          cal:760, pro:36, carb:78, fat:28 },
      { name:'Salmon Rice Bowl',              ingredients:'150g salmon fillet, 150g white rice, 50g edamame, ½ avocado, 2 tbsp soy sauce',                     cal:700, pro:44, carb:64, fat:26 },
      { name:'Beef Stir-Fry Noodles',         ingredients:'150g udon noodles, 130g beef strips, 100g broccoli, 2 tbsp oyster sauce, 1 tsp sesame oil',         cal:730, pro:38, carb:84, fat:20 },
      { name:'Double Cheese Burger',          ingredients:'2×100g beef patties, 2 cheese slices, 1 brioche bun, lettuce, 150g fries',                          cal:820, pro:44, carb:72, fat:38 },
      { name:'Creamy Chicken Pasta',          ingredients:'150g rigatoni, 130g chicken, 60g spinach, 100ml cream sauce, 30g parmesan',                         cal:760, pro:40, carb:74, fat:30 },
      { name:'BBQ Chicken Flatbread',         ingredients:'1 flatbread, 130g chicken, 3 tbsp BBQ sauce, 50g cheese, ¼ red onion',                              cal:680, pro:38, carb:66, fat:24 },
      { name:'Shrimp Fried Rice',             ingredients:'150g shrimp, 200g white rice, 50g peas, 50g carrots, 2 eggs, 2 tbsp soy sauce',                     cal:660, pro:34, carb:82, fat:16 },
      { name:'Lamb & Couscous Bowl',          ingredients:'130g ground lamb, 150g couscous, ½ cucumber, 40g feta, 3 tbsp tzatziki',                            cal:700, pro:38, carb:68, fat:26 },
      { name:'Turkey & Avocado Wrap',         ingredients:'1 large flour tortilla, 130g turkey, ½ avocado, 2 rashers bacon, 1 swiss slice, 1 tbsp mayo',       cal:650, pro:36, carb:52, fat:30 },
      { name:'Pork Loin & Mash',              ingredients:'150g pork loin, 200g mashed potato, 80ml gravy, 80g carrots, 60g peas',                             cal:740, pro:42, carb:66, fat:28 },
      { name:'Mac & Cheese Deluxe',           ingredients:'150g macaroni, 80g cheddar, 100ml cream, 30g breadcrumbs, 50g bacon',                               cal:780, pro:28, carb:88, fat:34 },
      { name:'Beef Tacos ×3',                 ingredients:'3 corn tortillas, 150g ground beef, 40g cheese, 60g pico de gallo, 2 tbsp sour cream',              cal:720, pro:36, carb:64, fat:30 },
      { name:'Chicken Caesar Salad Sub',      ingredients:'1 sub roll, 130g grilled chicken, 60g romaine, 20g parmesan, 2 tbsp Caesar dressing',               cal:640, pro:38, carb:54, fat:24 },
      { name:'Egg Fried Noodles & Pork',      ingredients:'150g egg noodles, 130g pork mince, 2 eggs, 2 tbsp soy sauce, 2 spring onions',                      cal:700, pro:36, carb:76, fat:22 },
      { name:'Baked Potato with Fillings',    ingredients:'1 large russet potato (300g), 120g tuna, 40g cheese, 2 tbsp sour cream, 80g broccoli',              cal:680, pro:32, carb:80, fat:22 },
      { name:'Chickpea & Spinach Curry',      ingredients:'200g chickpeas, 80g spinach, 100g tomato, 100ml coconut milk, 1 naan, 150g rice',                   cal:720, pro:24, carb:94, fat:22 },
      { name:'Steak Sandwich',                ingredients:'1 ciabatta roll, 150g sirloin, 50g caramelised onion, 30g rocket, 1 tsp mustard',                   cal:760, pro:44, carb:58, fat:34 },
      { name:'Lentil & Sausage Stew',         ingredients:'150g red lentils, 2 pork sausages, 100g tomato, 60g spinach, 1 bread roll',                         cal:700, pro:34, carb:72, fat:24 },
      { name:'Grilled Chicken Wrap',          ingredients:'1 tortilla, 130g grilled chicken, 3 tbsp hummus, 50g roasted pepper, 30g feta',                     cal:640, pro:38, carb:56, fat:20 },
      { name:'Spaghetti Bolognese',           ingredients:'150g spaghetti, 130g beef mince, 120g tomato sauce, 20g parmesan, fresh basil',                     cal:760, pro:38, carb:82, fat:24 },
      { name:'Sweet Potato & Beef Bowl',      ingredients:'200g sweet potato, 130g beef, 80g black beans, 30g cheese, 2 tbsp salsa, ½ avocado',                cal:740, pro:38, carb:80, fat:26 },
    ],
    post_workout: [
      { name:'Chicken & Sweet Potato Bowl',   ingredients:'150g grilled chicken, 200g sweet potato, 100g broccoli, 1 tbsp olive oil',                          cal:600, pro:42, carb:62, fat:12 },
      { name:'Protein Shake & Banana',        ingredients:'2 scoops whey protein, 300ml whole milk, 1 banana, 60g oats, 1 tbsp peanut butter',                 cal:560, pro:40, carb:68, fat:12 },
      { name:'Tuna & Rice Cake Stack',        ingredients:'150g canned tuna, 6 rice cakes, ½ avocado, juice of ½ lemon, black pepper',                         cal:440, pro:36, carb:40, fat:12 },
      { name:'Beef & Veggie Stir-Fry',        ingredients:'150g lean beef, ½ bell pepper, 100g broccoli, 2 tbsp oyster sauce, 150g rice',                      cal:580, pro:38, carb:56, fat:14 },
      { name:'Greek Yogurt & Berries',        ingredients:'200g full-fat Greek yogurt, 50g granola, 80g strawberries, 1 tbsp honey',                           cal:480, pro:28, carb:62, fat:10 },
      { name:'Egg White Omelette & Potato',   ingredients:'5 egg whites, 150g diced potato, 60g spinach, 30g feta, 1 tsp olive oil',                           cal:440, pro:34, carb:44, fat:10 },
      { name:'Cottage Cheese & Crackers',     ingredients:'150g cottage cheese, 10 whole grain crackers, 2 tomatoes, ½ cucumber',                              cal:420, pro:32, carb:38, fat:8  },
      { name:'Turkey & Rice Bowl',            ingredients:'150g ground turkey, 150g white rice, 100g broccoli, 3 tbsp teriyaki sauce',                         cal:560, pro:44, carb:60, fat:10 },
      { name:'Salmon & Quinoa Plate',         ingredients:'150g baked salmon, 100g quinoa, 80g asparagus, juice of ½ lemon, 1 tsp olive oil',                  cal:580, pro:46, carb:44, fat:18 },
      { name:'High-Protein Smoothie',         ingredients:'1 scoop protein powder, 1 banana, 300ml whole milk, 60g oats, 1 tbsp nut butter',                   cal:600, pro:44, carb:70, fat:14 },
      { name:'Shrimp & Brown Rice',           ingredients:'150g shrimp, 150g brown rice, 50g edamame, 1 tsp ginger, 2 tbsp soy sauce',                         cal:520, pro:42, carb:56, fat:8  },
      { name:'Chicken Quesadilla',            ingredients:'1 large tortilla, 130g shredded chicken, 40g cheese, ½ pepper, 2 tbsp salsa',                       cal:560, pro:38, carb:50, fat:18 },
      { name:'Peanut Butter Rice Cakes',      ingredients:'6 rice cakes, 3 tbsp peanut butter, 1 banana, 1 tbsp honey',                                        cal:480, pro:14, carb:66, fat:14 },
      { name:'Hard-Boiled Eggs & Oats',       ingredients:'100g oats, 200ml milk, 1 tbsp honey, 3 hard-boiled eggs, 20g almonds',                              cal:540, pro:32, carb:62, fat:16 },
      { name:'Chocolate Milk & Banana',       ingredients:'350ml whole chocolate milk, 1 banana, 20g almonds',                                                  cal:500, pro:18, carb:70, fat:16 },
      { name:'Lean Mince & Pasta',            ingredients:'120g whole wheat pasta, 130g lean mince, 100g tomato sauce, 20g parmesan',                          cal:600, pro:40, carb:64, fat:16 },
      { name:'Edamame & Tuna Bowl',           ingredients:'100g edamame, 150g tuna, 150g brown rice, 2 tbsp soy sauce, 1 tsp sesame oil',                      cal:520, pro:46, carb:46, fat:10 },
      { name:'Protein Pancake Stack',         ingredients:'80g oats, 4 egg whites, 1 scoop protein powder, 1 banana, 2 tbsp maple syrup',                      cal:540, pro:38, carb:68, fat:8  },
      { name:'Baked Cod & Veggie Rice',       ingredients:'150g cod fillet, 150g white rice, 80g green beans, juice of ½ lemon, 1 tsp olive oil',              cal:500, pro:44, carb:48, fat:10 },
      { name:'Chocolate Protein Pudding',     ingredients:'1 scoop casein protein, 1 tbsp cocoa, 1 tbsp peanut butter, 200ml almond milk, 50g oats',           cal:540, pro:42, carb:52, fat:14 },
      { name:'Chicken Salad Pita',            ingredients:'1 pita bread, 130g chicken, 3 tbsp Greek yogurt, ½ cucumber, juice of ½ lemon',                     cal:480, pro:36, carb:46, fat:10 },
      { name:'Beef Jerky & Trail Mix',        ingredients:'50g beef jerky, 30g mixed nuts, 30g dried mango, 1 oat bar',                                        cal:460, pro:28, carb:44, fat:16 },
      { name:'Turkey Meatballs & Rice',       ingredients:'4 turkey meatballs (130g), 150g white rice, 80g marinara, 15g parmesan',                            cal:560, pro:40, carb:56, fat:14 },
      { name:'Lentil Soup & Bread',           ingredients:'150g red lentils, 100g tomato, 60g spinach, 1 tsp cumin, 1 slice sourdough',                        cal:520, pro:24, carb:72, fat:10 },
      { name:'Pork Tenderloin & Potato',      ingredients:'150g lean pork tenderloin, 200g baked potato, 80g green beans, 1 tsp olive oil',                    cal:580, pro:44, carb:52, fat:14 },
    ],
    dinner: [
      { name:'Ribeye Steak & Fries',          ingredients:'220g ribeye steak, 200g thick-cut fries, 1 tbsp garlic butter, 60g side salad',                     cal:880, pro:52, carb:60, fat:44 },
      { name:'Creamy Chicken Casserole',      ingredients:'200g chicken thighs, 120ml cream, 200g potatoes, 100g mushrooms, fresh herbs',                      cal:820, pro:46, carb:56, fat:38 },
      { name:'Pork Belly & Fried Rice',       ingredients:'150g pork belly, 200g fried rice, 80g bok choy, 1 egg, 2 tbsp soy sauce',                           cal:860, pro:36, carb:80, fat:38 },
      { name:'Lamb Chops & Mash',             ingredients:'2 lamb chops (200g), 200g mashed potato, 80g peas, 2 tbsp mint sauce, 1 tsp butter',                cal:840, pro:46, carb:58, fat:42 },
      { name:'Pasta Carbonara',               ingredients:'150g spaghetti, 80g guanciale, 2 eggs, 40g pecorino, black pepper',                                  cal:800, pro:36, carb:86, fat:30 },
      { name:'Chicken Tikka Masala & Rice',   ingredients:'180g chicken, 150ml tikka masala sauce, 200g basmati rice, 1 naan bread',                           cal:860, pro:42, carb:92, fat:28 },
      { name:'BBQ Pulled Beef & Potato',      ingredients:'200g beef brisket, 3 tbsp BBQ sauce, 250g baked potato, 80g coleslaw',                              cal:880, pro:48, carb:82, fat:34 },
      { name:'Salmon & Pesto Pasta',          ingredients:'150g pappardelle, 150g salmon, 3 tbsp basil pesto, 80g cherry tomatoes, 50ml cream',                cal:820, pro:44, carb:74, fat:34 },
      { name:'Thai Green Curry & Rice',       ingredients:'180g chicken, 150ml coconut milk, 2 tbsp green curry paste, 200g rice, fresh basil',                cal:800, pro:38, carb:84, fat:30 },
      { name:'Beef Lasagne',                  ingredients:'150g lasagne sheets, 150g beef mince, 100ml béchamel, 100g tomato sauce, 30g parmesan',             cal:840, pro:42, carb:78, fat:36 },
      { name:'Roast Chicken & Veggies',       ingredients:'1 chicken leg (250g), 200g roasted potatoes, 100g carrots, 100ml gravy',                            cal:780, pro:52, carb:60, fat:34 },
      { name:'Sausage & Lentil Casserole',    ingredients:'3 Italian sausages, 150g lentils, 100g tomato, 50ml red wine, 1 crusty roll',                       cal:820, pro:38, carb:80, fat:32 },
      { name:'Duck Breast & Potato Gratin',   ingredients:'180g duck breast, 200g potato gratin, 100g green beans, 80ml red wine jus',                         cal:860, pro:42, carb:64, fat:44 },
      { name:'Beef Enchiladas',               ingredients:'2 flour tortillas, 150g beef, 100ml enchilada sauce, 50g cheese, 2 tbsp sour cream',                cal:840, pro:44, carb:80, fat:34 },
      { name:'Prawn Butter Pasta',            ingredients:'150g linguine, 150g king prawns, 2 tbsp garlic butter, ½ tsp chilli flakes, 20g parmesan',          cal:760, pro:36, carb:80, fat:28 },
      { name:'Chicken Shawarma & Rice',       ingredients:'180g chicken thigh, 1 tsp shawarma spice, 200g rice, 3 tbsp tzatziki, 1 pita',                      cal:820, pro:46, carb:84, fat:26 },
      { name:'Pork Schnitzel & Potatoes',     ingredients:'180g pork schnitzel, 200g roasted potatoes, 80g sauerkraut, 1 tbsp mustard',                        cal:800, pro:44, carb:70, fat:34 },
      { name:'Beef & Black Bean Stew',        ingredients:'150g beef chunks, 120g black beans, 100g tomato, 1 tsp cumin, 150g rice, 1 cornbread slice',        cal:860, pro:48, carb:86, fat:26 },
      { name:'Coconut Shrimp Curry',          ingredients:'180g shrimp, 150ml coconut milk, 80g tomato, 1 tsp ginger, 200g basmati, 1 naan',                   cal:780, pro:38, carb:80, fat:28 },
      { name:'Tuna Noodle Casserole',         ingredients:'150g egg noodles, 150g tuna, 100ml cream of mushroom, 60g peas, 40g cheese',                        cal:760, pro:40, carb:76, fat:26 },
      { name:'Stuffed Bell Peppers',          ingredients:'2 bell peppers, 130g beef mince, 100g rice, 80g tomato sauce, 40g mozzarella',                      cal:740, pro:40, carb:70, fat:28 },
      { name:'Gnocchi & Sausage Ragu',        ingredients:'200g potato gnocchi, 2 Italian sausages, 100g tomato, fresh basil, 20g parmesan',                   cal:820, pro:34, carb:88, fat:30 },
      { name:'Teriyaki Chicken Bowl',         ingredients:'180g chicken thigh, 3 tbsp teriyaki sauce, 200g white rice, 100g broccoli, 1 tsp sesame',           cal:780, pro:44, carb:82, fat:22 },
      { name:'Moussaka',                      ingredients:'150g aubergine, 130g lamb mince, 80ml béchamel, 100g tomato, 150g potato, cinnamon',                cal:800, pro:36, carb:68, fat:40 },
      { name:'Cheesy Chicken Rice Bake',      ingredients:'180g chicken, 150g white rice, 100ml cream of chicken, 50g cheese, 80g broccoli',                   cal:820, pro:46, carb:78, fat:30 },
    ],
  },

  build_muscle: {
    breakfast: [
      { name:'Protein Oat Bowl',              ingredients:'100g oats, 1 scoop whey protein, 1 banana, 250ml almond milk, 1 tbsp chia seeds',                   cal:480, pro:40, carb:58, fat:8  },
      { name:'4-Egg White Omelette',          ingredients:'5 egg whites, 1 whole egg, 60g spinach, 80g mushrooms, 30g feta, 2 toast slices',                   cal:440, pro:38, carb:32, fat:14 },
      { name:'Cottage Cheese & Berries',      ingredients:'200g cottage cheese, 80g mixed berries, 40g granola, 1 tbsp honey, 1 tbsp flaxseed',               cal:420, pro:32, carb:48, fat:6  },
      { name:'Greek Yogurt Parfait',          ingredients:'200g Greek yogurt, 50g protein granola, 80g blueberries, 1 tbsp honey',                             cal:460, pro:34, carb:52, fat:8  },
      { name:'Chicken & Egg Breakfast Bowl',  ingredients:'100g grilled chicken, 2 scrambled eggs, 60g spinach, 2 tbsp salsa, 2 toast slices',                 cal:500, pro:44, carb:34, fat:14 },
      { name:'Protein Pancakes',              ingredients:'80g oats, 1 scoop protein powder, 2 eggs, 1 banana, 100ml almond milk',                             cal:480, pro:40, carb:52, fat:8  },
      { name:'Smoked Salmon Egg Wrap',        ingredients:'1 whole wheat wrap, 80g smoked salmon, 2 eggs, 2 tbsp cream cheese, 1 tbsp capers',                 cal:440, pro:38, carb:30, fat:16 },
      { name:'Quinoa Protein Bowl',           ingredients:'100g quinoa, 150g Greek yogurt, 20g almonds, 1 tbsp honey, 1 banana, 1 tbsp chia',                  cal:500, pro:30, carb:58, fat:12 },
      { name:'Turkey Scramble',               ingredients:'100g ground turkey, 2 eggs, 60g spinach, 80g cherry tomatoes, 2 whole wheat toast slices',          cal:460, pro:42, carb:32, fat:14 },
      { name:'Overnight Protein Oats',        ingredients:'80g oats, 1 scoop casein, 250ml almond milk, 1 banana, 1 tbsp peanut butter, 50g berries',          cal:500, pro:36, carb:56, fat:12 },
      { name:'Egg Muffin Cups',               ingredients:'4 eggs, 2 turkey bacon rashers, ½ bell pepper, 30g cheese, 30g spinach',                            cal:400, pro:36, carb:12, fat:20 },
      { name:'Bodybuilder Breakfast',         ingredients:'100g oats, 3 eggs, 1 banana, 1 whey shake (300ml milk), 1 tbsp almond butter',                      cal:560, pro:46, carb:60, fat:14 },
      { name:'High-Protein French Toast',     ingredients:'2 slices Ezekiel bread, 3 egg whites, ½ tsp cinnamon, ½ tsp vanilla, 80g berries',                  cal:420, pro:32, carb:44, fat:8  },
      { name:'Tuna Omelette',                 ingredients:'3 eggs, 100g canned tuna, 60g spinach, ¼ onion, 1 tsp olive oil, 2 toast slices',                   cal:460, pro:42, carb:28, fat:16 },
      { name:'Protein Smoothie Bowl',         ingredients:'1 scoop protein powder, 100g frozen acai, 1 banana, 40g granola, 1 tsp mixed seeds',                cal:480, pro:36, carb:54, fat:10 },
      { name:'Ricotta & Honey Toast',         ingredients:'2 slices sourdough, 80g low-fat ricotta, 1 tbsp honey, 20g walnuts, 1 banana',                      cal:440, pro:24, carb:52, fat:12 },
      { name:'Beef & Egg Breakfast Plate',    ingredients:'100g lean beef strips, 2 fried eggs, 100g sautéed peppers, 2 tbsp salsa',                           cal:500, pro:44, carb:20, fat:26 },
      { name:'Lentil Breakfast Bowl',         ingredients:'100g red lentils, 1 egg, 60g spinach, 30g feta, 2 slices whole grain toast',                        cal:460, pro:30, carb:48, fat:14 },
      { name:'Almond Butter Protein Wrap',    ingredients:'1 whole wheat wrap, 2 tbsp almond butter, 1 banana, 1 protein shake (250ml milk)',                  cal:480, pro:32, carb:56, fat:14 },
      { name:'Shrimp & Veggie Scramble',      ingredients:'100g shrimp, 3 eggs, 40g kale, 80g tomato, 80g mushrooms, 1 tsp olive oil',                         cal:420, pro:40, carb:14, fat:18 },
      { name:'Chocolate Banana Protein Shake',ingredients:'1 scoop whey protein, 1 banana, 1 tbsp cocoa, 50g oats, 250ml almond milk',                         cal:460, pro:40, carb:56, fat:6  },
      { name:'Sardine Toast',                 ingredients:'2 slices rye bread, 100g sardines, ½ avocado, juice of ½ lemon, ¼ red onion',                       cal:440, pro:36, carb:30, fat:18 },
      { name:'Tofu Scramble',                 ingredients:'200g firm tofu, ¼ tsp turmeric, 60g spinach, ½ bell pepper, 2 tbsp nutritional yeast',              cal:380, pro:30, carb:20, fat:16 },
      { name:'High-Protein Muesli',           ingredients:'80g protein-enriched muesli, 250ml milk, 1 banana, 2 tbsp hemp seeds',                              cal:480, pro:32, carb:62, fat:10 },
      { name:'Egg & Salmon Rye Stack',        ingredients:'2 slices rye bread, 2 poached eggs, 80g smoked salmon, 30g spinach, 1 tsp mustard',                 cal:460, pro:40, carb:28, fat:16 },
    ],
    lunch: [
      { name:'Grilled Chicken & Brown Rice',  ingredients:'170g grilled chicken breast, 150g brown rice, 100g broccoli, 2 tbsp soy sauce',                     cal:580, pro:52, carb:58, fat:10 },
      { name:'Tuna Protein Bowl',             ingredients:'150g tuna, 100g quinoa, ½ cucumber, 80g edamame, 2 tbsp sesame dressing',                            cal:520, pro:46, carb:46, fat:10 },
      { name:'Lean Beef Wrap',                ingredients:'1 whole wheat wrap, 130g lean beef, 2 lettuce leaves, 1 tomato, 1 tsp mustard',                     cal:560, pro:44, carb:46, fat:16 },
      { name:'Turkey & Quinoa Salad',         ingredients:'150g turkey breast, 100g quinoa, 60g baby spinach, 80g cherry tomatoes, juice of ½ lemon',          cal:500, pro:44, carb:42, fat:10 },
      { name:'Salmon Stir-Fry & Rice',        ingredients:'150g salmon, 100g broccoli, 60g snap peas, 1 tsp ginger, 150g brown rice, 2 tbsp soy sauce',        cal:580, pro:46, carb:52, fat:16 },
      { name:'Chicken & Lentil Soup',         ingredients:'150g chicken breast, 100g red lentils, 1 carrot, 2 celery stalks, 1 crusty roll',                   cal:520, pro:44, carb:54, fat:8  },
      { name:'High-Protein Pasta',            ingredients:'120g chickpea pasta, 130g chicken, 100g tomato, 60g spinach, 20g parmesan',                         cal:580, pro:50, carb:56, fat:12 },
      { name:'Shrimp & Veggie Bowl',          ingredients:'150g shrimp, 150g brown rice, 80g zucchini, 80g carrot, 3 tbsp teriyaki sauce',                     cal:520, pro:42, carb:56, fat:8  },
      { name:'Turkey Meatball Sub',           ingredients:'1 sub roll, 4 turkey meatballs (130g), 80ml marinara, 40g mozzarella, fresh basil',                 cal:560, pro:44, carb:54, fat:16 },
      { name:'Lean Pork Loin & Veg',          ingredients:'150g pork loin, 200g sweet potato, 80g asparagus, 1 tbsp Dijon mustard',                            cal:540, pro:46, carb:44, fat:12 },
      { name:'Chicken Burrito Bowl',          ingredients:'130g chicken, 150g rice, 80g black beans, 2 tbsp salsa, ½ avocado, 2 tbsp Greek yogurt',            cal:580, pro:48, carb:58, fat:14 },
      { name:'Baked Cod & Quinoa',            ingredients:'150g cod fillet, 100g quinoa, 80g green beans, juice of ½ lemon, 1 tsp olive oil',                  cal:500, pro:46, carb:42, fat:10 },
      { name:'Ground Turkey Tacos',           ingredients:'2 corn tortillas, 130g lean turkey, 3 tbsp salsa, ¼ avocado, juice of ½ lime, 30g cheese',          cal:540, pro:42, carb:44, fat:16 },
      { name:'Tofu & Edamame Bowl',           ingredients:'150g firm tofu, 80g edamame, 150g brown rice, 1 tsp sesame, ½ cucumber, 2 tbsp soy sauce',          cal:520, pro:36, carb:52, fat:14 },
      { name:'Chicken Caesar Wrap',           ingredients:'1 whole wheat wrap, 130g chicken, 60g romaine, 20g parmesan, 2 tbsp light Caesar dressing',         cal:520, pro:44, carb:42, fat:14 },
      { name:'Egg & Chickpea Salad',          ingredients:'3 hard-boiled eggs, 100g chickpeas, ½ cucumber, 30g feta, 1 tbsp olive oil',                        cal:500, pro:30, carb:40, fat:18 },
      { name:'Lean Lamb Pitta',               ingredients:'1 pita, 130g lean lamb mince, 3 tbsp tzatziki, 1 tomato, ½ cucumber',                               cal:540, pro:40, carb:46, fat:16 },
      { name:'Muscle-Building Stir-Fry',      ingredients:'150g lean beef, 150g rice, 100g broccoli, 60g edamame, 1 tsp ginger, 2 tbsp oyster sauce',          cal:580, pro:48, carb:56, fat:12 },
      { name:'White Fish & Rice',             ingredients:'150g tilapia, 150g white rice, 100g steamed veg, juice of ½ lemon, fresh herbs',                    cal:500, pro:46, carb:50, fat:8  },
      { name:'Greek Chicken Bowl',            ingredients:'130g chicken, 150g brown rice, 3 tbsp tzatziki, 80g cherry tomatoes, 30g feta',                     cal:540, pro:46, carb:46, fat:14 },
      { name:'Protein Grain Bowl',            ingredients:'80g mixed grains, 130g chicken, 60g roasted peppers, 3 tbsp hummus, 40g spinach',                   cal:560, pro:40, carb:54, fat:14 },
      { name:'Lemon Herb Turkey Plate',       ingredients:'150g turkey breast, 200g roasted potato, 80g broccolini, juice of 1 lemon',                         cal:520, pro:48, carb:42, fat:10 },
      { name:'Tuna-Stuffed Avocado',          ingredients:'1 avocado, 150g tuna, ¼ red onion, juice of ½ lemon, 40g mixed greens, 6 crackers',                 cal:500, pro:38, carb:26, fat:24 },
      { name:'Teriyaki Salmon Bowl',          ingredients:'150g salmon, 3 tbsp teriyaki sauce, 150g brown rice, 60g edamame, ½ cucumber',                      cal:580, pro:46, carb:54, fat:16 },
      { name:'Spicy Chicken Rice Plate',      ingredients:'150g chicken thigh, 150g jasmine rice, 1 tbsp sriracha, 80g bok choy, 1 egg',                       cal:560, pro:46, carb:52, fat:12 },
    ],
    post_workout: [
      { name:'Protein Shake & Banana',        ingredients:'2 scoops whey protein, 1 banana, 250ml almond milk, 50g oats',                                      cal:400, pro:40, carb:48, fat:4  },
      { name:'Chicken & Potato Bowl',         ingredients:'150g grilled chicken, 200g boiled potato, 80g green beans, 1 tsp olive oil',                        cal:480, pro:44, carb:44, fat:10 },
      { name:'Greek Yogurt & Granola',        ingredients:'200g low-fat Greek yogurt, 40g granola, 1 tbsp honey, 1 banana',                                    cal:380, pro:28, carb:52, fat:6  },
      { name:'Egg Whites & Rice Cakes',       ingredients:'5 egg whites, 6 rice cakes, ½ avocado, pinch of salt',                                              cal:340, pro:30, carb:36, fat:8  },
      { name:'Casein Protein Pudding',        ingredients:'1 scoop casein powder, 200ml almond milk, 1 tsp cocoa, 1 banana, 1 tsp honey',                      cal:380, pro:38, carb:38, fat:4  },
      { name:'Tuna Rice Bowl',                ingredients:'150g tuna, 150g white rice, ½ cucumber, 2 tbsp soy sauce, ½ tsp sesame oil',                        cal:440, pro:42, carb:46, fat:6  },
      { name:'Turkey & Sweet Potato',         ingredients:'150g turkey mince, 200g sweet potato, 60g spinach, 2 cloves garlic',                                cal:460, pro:40, carb:48, fat:8  },
      { name:'Post-Workout Smoothie',         ingredients:'1 scoop whey, 1 banana, 50g oats, 250ml almond milk, 1 tsp honey',                                  cal:420, pro:36, carb:50, fat:4  },
      { name:'Salmon & Quinoa',               ingredients:'150g salmon, 100g quinoa, 80g asparagus, juice of ½ lemon, 1 tsp olive oil',                        cal:480, pro:44, carb:40, fat:14 },
      { name:'Peanut Butter Rice Cakes',      ingredients:'6 rice cakes, 2 tbsp peanut butter, 1 banana, 1 protein shake (250ml)',                             cal:440, pro:34, carb:50, fat:12 },
      { name:'Chicken & Oats Mix',            ingredients:'50g oats, 100g shredded chicken, 200ml almond milk, 1 tbsp honey, 20g almonds',                     cal:460, pro:38, carb:52, fat:10 },
      { name:'Cottage Cheese & Crackers',     ingredients:'150g low-fat cottage cheese, 10 whole grain crackers, 2 tomatoes',                                  cal:360, pro:32, carb:34, fat:6  },
      { name:'Shrimp & Brown Rice',           ingredients:'150g shrimp, 150g brown rice, 50g edamame, 2 tbsp soy sauce, 1 tsp ginger',                         cal:440, pro:42, carb:48, fat:6  },
      { name:'High-Protein Chocolate Milk',   ingredients:'350ml protein-enriched chocolate milk, 1 banana, 20g almonds',                                      cal:420, pro:32, carb:52, fat:8  },
      { name:'Tilapia & Veggie Bowl',         ingredients:'150g tilapia, 150g brown rice, 100g broccoli, 2 cloves garlic, juice of ½ lemon',                   cal:440, pro:44, carb:42, fat:8  },
      { name:'Low-Fat Ricotta Toast',         ingredients:'2 slices Ezekiel bread, 80g ricotta, 1 banana, 1 tbsp honey, 1 tbsp flaxseed',                      cal:380, pro:26, carb:48, fat:8  },
      { name:'Tuna-Stuffed Egg Whites',       ingredients:'5 egg whites, 100g tuna, 1 tsp mustard, ½ tsp paprika, ½ cucumber',                                 cal:340, pro:38, carb:6,  fat:4  },
      { name:'Whey & Berry Smoothie',         ingredients:'1 scoop whey protein, 100g frozen berries, 50g oats, 250ml almond milk, 1 banana',                  cal:400, pro:36, carb:50, fat:4  },
      { name:'Turkey & Rice Plate',           ingredients:'150g lean turkey, 150g white rice, 100g steamed broccoli, 2 tbsp soy sauce',                        cal:460, pro:44, carb:48, fat:6  },
      { name:'Lean Beef & Sweet Potato',      ingredients:'130g lean ground beef, 200g sweet potato, 60g spinach, 1 tsp olive oil',                            cal:480, pro:40, carb:46, fat:10 },
      { name:'Edamame & Egg Salad',           ingredients:'100g edamame, 2 hard-boiled eggs, 80g quinoa, juice of ½ lemon, fresh herbs',                       cal:400, pro:30, carb:36, fat:12 },
      { name:'Whey Pancakes',                 ingredients:'1 scoop whey protein, 60g oats, 4 egg whites, 100ml almond milk, 50g berries',                      cal:420, pro:38, carb:44, fat:6  },
      { name:'Lemon Herb Salmon',             ingredients:'150g salmon, juice of 1 lemon, 1 tbsp dill, 150g boiled potato, 80g green beans',                   cal:480, pro:44, carb:40, fat:14 },
      { name:'Baked Chicken & Veg',           ingredients:'150g chicken breast, 80g zucchini, 80g capsicum, 1 tsp olive oil, fresh herbs',                     cal:400, pro:44, carb:16, fat:14 },
      { name:'Chocolate Whey Oats',           ingredients:'80g oats, 1 scoop chocolate whey, 200ml almond milk, 1 tsp cocoa, 1 banana',                        cal:440, pro:38, carb:50, fat:6  },
    ],
    dinner: [
      { name:'Grilled Chicken & Veg',         ingredients:'180g chicken breast, 200g roasted sweet potato, 120g broccoli, 1 tbsp olive oil',                   cal:520, pro:50, carb:44, fat:12 },
      { name:'Baked Salmon & Brown Rice',     ingredients:'180g salmon fillet, 150g brown rice, 100g asparagus, juice of ½ lemon, 1 tbsp dill',                cal:560, pro:48, carb:50, fat:16 },
      { name:'Turkey Mince Pasta',            ingredients:'120g chickpea pasta, 150g turkey mince, 100g tomato sauce, 60g spinach',                            cal:540, pro:50, carb:52, fat:10 },
      { name:'Tuna & Veggie Stir-Fry',        ingredients:'150g tuna steak, 150g stir-fry veg, 150g brown rice, 3 tbsp teriyaki sauce',                        cal:520, pro:50, carb:46, fat:10 },
      { name:'Lean Beef & Sweet Potato',      ingredients:'160g lean sirloin, 200g mashed sweet potato, 100g green beans, 80ml gravy',                         cal:560, pro:48, carb:52, fat:12 },
      { name:'Chicken & Black Bean Bowl',     ingredients:'160g chicken, 100g black beans, 150g brown rice, 2 tbsp salsa, ½ avocado',                          cal:540, pro:48, carb:56, fat:10 },
      { name:'Baked Cod & Quinoa',            ingredients:'160g cod, 100g quinoa, 80g roasted peppers, juice of ½ lemon, 40g spinach',                         cal:480, pro:46, carb:44, fat:8  },
      { name:'Chicken & Vegetable Soup',      ingredients:'160g chicken breast, 80g red lentils, 60g kale, 1 carrot, 2 celery stalks, 500ml broth',            cal:460, pro:44, carb:40, fat:8  },
      { name:'Prawn & Brown Rice Bowl',       ingredients:'180g king prawns, 150g brown rice, 80g bok choy, 1 tsp sesame, 1 tsp ginger, 2 tbsp soy',           cal:520, pro:44, carb:50, fat:8  },
      { name:'Lean Lamb & Roast Veg',         ingredients:'160g lamb loin, 150g courgette, 150g potato, 1 tsp rosemary, 1 tbsp olive oil',                     cal:540, pro:46, carb:40, fat:18 },
      { name:'High-Protein Chicken Tikka',    ingredients:'180g chicken, 2 tbsp tikka paste, 100ml Greek yogurt, 200g basmati rice',                           cal:520, pro:50, carb:48, fat:10 },
      { name:'White Fish & Lentil Stew',      ingredients:'160g tilapia, 100g green lentils, 100g tomato, 60g spinach, 1 crusty roll',                         cal:500, pro:46, carb:48, fat:8  },
      { name:'Turkey Stuffed Peppers',        ingredients:'2 bell peppers, 150g ground turkey, 100g rice, 80g tomato sauce, 40g mozzarella',                   cal:480, pro:44, carb:42, fat:10 },
      { name:'Chicken & Cauliflower Mash',    ingredients:'180g chicken breast, 250g cauliflower mash, 80g peas, 150ml chicken stock',                         cal:440, pro:46, carb:28, fat:10 },
      { name:'Muscle Mince Bowl',             ingredients:'150g lean mince, 150g brown rice, 80g edamame, 100g broccoli, 2 tbsp soy sauce',                    cal:560, pro:50, carb:52, fat:10 },
      { name:'Pork Tenderloin & Veg',         ingredients:'180g pork tenderloin, 200g roasted potato, 100g asparagus, 1 tbsp Dijon mustard',                   cal:520, pro:48, carb:42, fat:10 },
      { name:'Tuna Jacket Potato',            ingredients:'1 large baked potato (300g), 150g tuna, 3 tbsp low-fat Greek yogurt, 60g sweetcorn',                cal:500, pro:44, carb:52, fat:6  },
      { name:'Chicken & Bok Choy Noodles',    ingredients:'160g chicken, 150g soba noodles, 80g bok choy, 1 tsp ginger, 2 tbsp soy, 1 tsp sesame',            cal:520, pro:46, carb:48, fat:10 },
      { name:'Beef & Broccoli Rice Bowl',     ingredients:'150g lean beef, 100g broccoli, 150g white rice, 2 tbsp oyster sauce, 2 cloves garlic',              cal:540, pro:48, carb:52, fat:10 },
      { name:'Baked Trout & Potato',          ingredients:'180g rainbow trout, 200g baby potatoes, 100g green beans, juice of ½ lemon, herbs',                 cal:520, pro:46, carb:40, fat:14 },
      { name:'Chicken & Edamame Bowl',        ingredients:'160g chicken, 80g edamame, 100g quinoa, 2 tbsp sesame dressing, ½ cucumber',                        cal:540, pro:50, carb:42, fat:12 },
      { name:'Turkey & Vegetable Curry',      ingredients:'160g turkey breast, 80g chickpeas, 60g spinach, 100g tomato, 150g brown rice',                      cal:520, pro:46, carb:50, fat:8  },
      { name:'Lean Meatballs & Pasta',        ingredients:'4 turkey meatballs (150g), 120g whole wheat spaghetti, 100g tomato sauce, fresh basil',             cal:540, pro:46, carb:52, fat:10 },
      { name:'Chicken Fajita Bowl',           ingredients:'160g chicken, 1 tsp fajita spice, 150g rice, ½ bell pepper, ¼ avocado, 2 tbsp salsa',              cal:540, pro:48, carb:48, fat:14 },
      { name:'Grilled Swordfish & Quinoa',    ingredients:'180g swordfish, 100g quinoa, 80g cherry tomatoes, 1 tbsp basil pesto, 40g spinach',                 cal:520, pro:46, carb:42, fat:16 },
    ],
  },

  lose_weight: {
    breakfast: [
      { name:'Veggie Egg White Omelette',     ingredients:'5 egg whites, 60g spinach, 80g mushrooms, 1 tomato, fresh herbs',                                   cal:220, pro:26, carb:8,  fat:6  },
      { name:'Berry Greek Yogurt Bowl',       ingredients:'180g non-fat Greek yogurt, 80g mixed berries, 1 tsp flaxseed, pinch of cinnamon',                   cal:240, pro:24, carb:28, fat:2  },
      { name:'Overnight Oats (Slim)',         ingredients:'60g oats, 200ml almond milk, 1 tbsp chia seeds, 60g blueberries',                                   cal:300, pro:12, carb:48, fat:6  },
      { name:'Avocado Toast (Half)',          ingredients:'1 slice rye bread, ¼ avocado, 6 cherry tomatoes, pinch of red pepper flakes',                       cal:280, pro:8,  carb:32, fat:14 },
      { name:'Protein Smoothie (Low-cal)',    ingredients:'1 scoop whey protein, 250ml almond milk, 60g spinach, 80g frozen berries',                          cal:280, pro:30, carb:24, fat:4  },
      { name:'Boiled Egg & Rye Toast',        ingredients:'2 boiled eggs, 2 slices rye bread, ½ cucumber, 2 tomatoes',                                         cal:300, pro:20, carb:28, fat:10 },
      { name:'Cottage Cheese & Fruit',        ingredients:'150g low-fat cottage cheese, 80g pineapple, 1 kiwi, fresh mint',                                    cal:250, pro:24, carb:26, fat:2  },
      { name:'Banana Protein Smoothie',       ingredients:'1 banana, 1 scoop whey protein, 200ml skimmed milk, ice, ½ tsp cinnamon',                           cal:300, pro:28, carb:36, fat:2  },
      { name:'Smashed Avocado Egg Toast',     ingredients:'1 slice sourdough, ¼ avocado, 1 poached egg, 1 tomato',                                             cal:330, pro:16, carb:28, fat:16 },
      { name:'Veggie Scramble',               ingredients:'2 eggs, ½ capsicum, ¼ onion, 60g spinach, 1 tomato, olive oil spray',                               cal:280, pro:18, carb:14, fat:14 },
      { name:'Chia Pudding',                  ingredients:'3 tbsp chia seeds, 200ml almond milk, ½ tsp vanilla, 60g berries, 1 tsp honey',                     cal:260, pro:8,  carb:28, fat:12 },
      { name:'High-Protein Cereal Bowl',      ingredients:'60g protein-enriched cereal, 200ml skimmed milk, 80g strawberries',                                 cal:310, pro:22, carb:40, fat:4  },
      { name:'Spinach Omelette',              ingredients:'4 egg whites, 1 whole egg, 60g spinach, 20g feta, 1 tomato',                                        cal:250, pro:24, carb:8,  fat:10 },
      { name:'Fruit & Seed Bowl',             ingredients:'150g Greek yogurt, 1 kiwi, ½ apple, 1 tbsp pumpkin seeds, ½ tsp cinnamon',                          cal:280, pro:16, carb:34, fat:8  },
      { name:'Protein-Packed Porridge',       ingredients:'60g oats, 200ml water, 1 scoop protein powder, ½ banana, ½ tsp cinnamon',                           cal:320, pro:28, carb:42, fat:4  },
      { name:'Smoked Salmon & Egg Cup',       ingredients:'80g smoked salmon, 1 egg, 1 tbsp capers, 1 slice rye toast, 20g rocket',                            cal:300, pro:26, carb:18, fat:12 },
      { name:'Almond Milk Smoothie Bowl',     ingredients:'1 frozen banana, 200ml almond milk, 40g spinach, 30g granola, 50g berries',                         cal:310, pro:10, carb:50, fat:6  },
      { name:'Low-Cal Breakfast Wrap',        ingredients:'1 small whole wheat wrap, 3 egg whites, 2 tbsp salsa, 40g spinach, 1 jalapeño',                     cal:300, pro:20, carb:32, fat:6  },
      { name:'Mango Protein Shake',           ingredients:'1 scoop whey protein, 100g frozen mango, 250ml coconut water, ice',                                 cal:260, pro:28, carb:30, fat:2  },
      { name:'Turkish Eggs (Çılbır)',         ingredients:'2 poached eggs, 100g Greek yogurt, ½ tsp butter, ½ tsp paprika, dill, 1 rye toast',                 cal:310, pro:18, carb:22, fat:14 },
      { name:'Savoury Quinoa Bowl',           ingredients:'80g quinoa, 1 soft-boiled egg, ¼ avocado, 6 cherry tomatoes, juice of ½ lemon',                     cal:340, pro:16, carb:38, fat:12 },
      { name:'Skyr & Berry Bowl',             ingredients:'180g skyr, 80g strawberries, ½ banana, 1 tbsp hemp seeds, 1 tsp honey',                             cal:270, pro:24, carb:34, fat:4  },
      { name:'Soft-Boiled Egg & Ryvita',      ingredients:'2 soft-boiled eggs, 4 Ryvita crackers, ½ cucumber, 2 tomatoes',                                     cal:260, pro:18, carb:22, fat:8  },
      { name:'Green Protein Smoothie',        ingredients:'40g spinach, 1 scoop pea protein, 1 kiwi, ½ banana, 250ml almond milk',                             cal:280, pro:26, carb:32, fat:4  },
      { name:'Low-Fat Banana Pancakes',       ingredients:'60g oats, 1 banana, 3 egg whites, ½ tsp cinnamon, 1 tbsp low-cal syrup',                            cal:310, pro:18, carb:44, fat:4  },
    ],
    lunch: [
      { name:'Grilled Chicken Salad',         ingredients:'150g chicken breast, 80g mixed greens, 80g cherry tomatoes, ½ cucumber, 1 tbsp lemon dressing',     cal:320, pro:38, carb:14, fat:10 },
      { name:'Tuna Lettuce Cups',             ingredients:'150g tuna, 4 cos lettuce leaves, ½ cucumber, 1 tomato, juice of ½ lemon',                           cal:260, pro:36, carb:8,  fat:6  },
      { name:'Turkey & Spinach Wrap',         ingredients:'1 low-carb wrap, 120g turkey, 40g spinach, 1 tsp mustard, 1 tomato',                                cal:340, pro:32, carb:28, fat:8  },
      { name:'Lentil Soup (Slim)',            ingredients:'120g red lentils, 1 carrot, 2 celery stalks, 1 tsp cumin, 40g spinach, 500ml broth',                cal:300, pro:18, carb:44, fat:4  },
      { name:'Shrimp & Zucchini Noodles',     ingredients:'150g shrimp, 2 medium zucchinis spiralised, 2 cloves garlic, 1 tsp olive oil, 80g cherry tomatoes', cal:280, pro:30, carb:12, fat:12 },
      { name:'Salmon & Cucumber Bowl',        ingredients:'130g salmon, ½ cucumber, 60g edamame, 1 tsp sesame, 80g brown rice',                                cal:360, pro:36, carb:28, fat:12 },
      { name:'Chicken Vegetable Soup',        ingredients:'150g chicken, 500ml broth, 1 carrot, 2 celery stalks, 80g zucchini, fresh herbs',                   cal:280, pro:32, carb:20, fat:6  },
      { name:'Egg & Veggie Frittata',         ingredients:'3 eggs, ½ courgette, 80g cherry tomatoes, 40g spinach, 20g feta',                                   cal:300, pro:22, carb:10, fat:16 },
      { name:'Chickpea Salad',                ingredients:'150g chickpeas, ½ cucumber, 80g cherry tomatoes, ¼ red onion, juice of 1 lemon, fresh herbs',       cal:320, pro:14, carb:44, fat:8  },
      { name:'White Fish Salad',              ingredients:'150g poached cod, 60g mixed leaves, 4 radishes, 1 tbsp lemon dressing, 1 tbsp capers',              cal:260, pro:36, carb:8,  fat:6  },
      { name:'Vietnamese Prawn Roll Bowl',    ingredients:'100g prawns, ½ cucumber, fresh mint, coriander, 2 tbsp sweet chilli sauce, rice paper pieces',       cal:300, pro:26, carb:34, fat:4  },
      { name:'Lean Turkey Lettuce Wrap',      ingredients:'130g turkey mince, 4 butter lettuce leaves, 1 tbsp hoisin, 1 carrot, ½ cucumber',                   cal:280, pro:28, carb:22, fat:6  },
      { name:'Cauliflower Rice Stir-Fry',     ingredients:'300g cauliflower rice, 130g chicken, 100g broccoli, 2 tbsp soy sauce, 1 tsp ginger',                cal:300, pro:32, carb:18, fat:8  },
      { name:'Greek Salad with Grilled Feta', ingredients:'2 tomatoes, ½ cucumber, 6 olives, 60g feta, ¼ red onion, 1 tsp oregano',                            cal:280, pro:10, carb:16, fat:18 },
      { name:'Stuffed Mushrooms',             ingredients:'2 large portobello caps, 100g tuna, 60g ricotta, 40g spinach, 80g cherry tomatoes',                 cal:260, pro:28, carb:12, fat:10 },
      { name:'Smoked Salmon Rye',             ingredients:'4 rye crackers, 80g smoked salmon, 2 tbsp light cream cheese, fresh dill',                          cal:300, pro:26, carb:22, fat:8  },
      { name:'Tofu & Spinach Bowl',           ingredients:'150g firm tofu, 60g spinach, 1 tsp sesame, 150g brown rice, 2 tbsp soy sauce',                      cal:340, pro:22, carb:36, fat:10 },
      { name:'Chicken & Broth Noodles',       ingredients:'500ml chicken broth, 130g chicken, 2 zucchinis spiralised, 80g mushrooms',                          cal:260, pro:28, carb:16, fat:6  },
      { name:'Egg Salad Bowl',                ingredients:'3 hard-boiled eggs, 60g mixed greens, ¼ avocado, juice of ½ lemon, 1 tsp mustard',                  cal:300, pro:18, carb:8,  fat:20 },
      { name:'Lean Beef Salad',               ingredients:'130g grilled lean beef, 40g rocket, 80g cherry tomatoes, juice of ½ lemon, 1 tsp olive oil',        cal:340, pro:34, carb:8,  fat:16 },
      { name:'Baked Cod & Salad',             ingredients:'150g cod, 60g mixed salad, 4 radishes, ½ cucumber, juice of ½ lemon, 1 tsp olive oil',              cal:280, pro:36, carb:8,  fat:10 },
      { name:'Pea & Mint Soup',               ingredients:'150g split peas, fresh mint, 500ml veg broth, 2 tbsp yogurt, 1 slice rye bread',                    cal:300, pro:14, carb:46, fat:4  },
      { name:'Turkey & Avocado Salad',        ingredients:'120g turkey, ¼ avocado, 60g mixed greens, 1 tomato, 1 tbsp lemon dressing',                         cal:320, pro:30, carb:10, fat:16 },
      { name:'Low-Fat Chicken Tacos',         ingredients:'3 butter lettuce cups, 130g chicken, 3 tbsp pico de gallo, ¼ avocado, juice of ½ lime, coriander',  cal:300, pro:30, carb:18, fat:10 },
      { name:'Watermelon & Prawn Salad',      ingredients:'100g prawn, 150g watermelon, 30g rocket, 20g feta, ½ cucumber, fresh mint',                         cal:260, pro:22, carb:24, fat:6  },
    ],
    dinner: [
      { name:'Baked Salmon & Greens',         ingredients:'160g salmon fillet, 120g steamed broccoli, 80g asparagus, juice of ½ lemon',                        cal:380, pro:40, carb:12, fat:18 },
      { name:'Zucchini Bolognese',            ingredients:'130g lean beef mince, 2 zucchinis spiralised, 100g tomato sauce, fresh basil',                      cal:360, pro:36, carb:18, fat:14 },
      { name:'Grilled Chicken & Broccoli',    ingredients:'160g chicken breast, 150g broccoli, juice of ½ lemon, 2 cloves garlic, 1 tsp olive oil',            cal:340, pro:44, carb:12, fat:10 },
      { name:'Shrimp & Cauliflower Rice',     ingredients:'160g shrimp, 300g cauliflower rice, 2 cloves garlic, juice of 1 lime, fresh herbs',                 cal:300, pro:34, carb:14, fat:10 },
      { name:'White Fish & Salsa Verde',      ingredients:'160g cod, 2 tbsp salsa verde, 100g steamed green beans, 80g cherry tomatoes',                       cal:320, pro:38, carb:10, fat:12 },
      { name:'Turkey Meatballs & Veg',        ingredients:'4 turkey meatballs (130g), 1 zucchini, 100g tomato sauce, 15g parmesan',                            cal:380, pro:38, carb:20, fat:14 },
      { name:'Chicken & Kale Stir-Fry',       ingredients:'160g chicken, 80g kale, 100g broccoli, 1 tsp ginger, 2 tbsp low-sodium soy sauce',                  cal:340, pro:40, carb:14, fat:8  },
      { name:'Baked Trout & Asparagus',       ingredients:'160g rainbow trout, 100g asparagus, juice of ½ lemon, 1 tbsp dill, 1 tbsp capers',                  cal:360, pro:42, carb:8,  fat:18 },
      { name:'Lean Beef Stuffed Peppers',     ingredients:'2 bell peppers, 130g lean beef, 60g quinoa, 80g tomato sauce, fresh herbs',                         cal:380, pro:36, carb:26, fat:12 },
      { name:'Thai Basil Chicken',            ingredients:'150g chicken mince, 10 thai basil leaves, 2 tbsp fish sauce, 300g cauliflower rice',                 cal:340, pro:36, carb:16, fat:10 },
      { name:'Tofu Green Curry',              ingredients:'180g firm tofu, 100ml light coconut milk, 2 tbsp green curry paste, 150g mixed veg',                cal:360, pro:20, carb:20, fat:18 },
      { name:'Lemon Herb Chicken',            ingredients:'160g chicken breast, juice of 1 lemon, mixed herbs, 150g sweet potato, 60g greens',                 cal:360, pro:42, carb:24, fat:8  },
      { name:'Seared Tuna Steak',             ingredients:'160g tuna steak, 2 tbsp sesame seeds, 100g bok choy, 2 tbsp soy sauce, 1 tsp ginger',               cal:340, pro:46, carb:8,  fat:12 },
      { name:'Prawn & Vegetable Bowl',        ingredients:'160g prawns, 100g broccoli, 60g snap peas, 1 tsp ginger, 2 cloves garlic, 2 tbsp oyster sauce',     cal:300, pro:30, carb:14, fat:8  },
      { name:'Chicken & Tomato Casserole',    ingredients:'160g chicken thigh (skinless), 100g tomato, 10 olives, 1 tbsp capers, fresh herbs',                 cal:360, pro:38, carb:12, fat:14 },
      { name:'Egg & Vegetable Bake',          ingredients:'3 eggs, 80g roasted peppers, 80g courgette, 20g feta, 80g cherry tomatoes',                         cal:320, pro:22, carb:14, fat:18 },
      { name:'Lamb & Roasted Veg',            ingredients:'150g lean lamb, 80g courgette, 80g aubergine, 80g tomato, 1 tsp rosemary',                          cal:380, pro:36, carb:14, fat:18 },
      { name:'Spicy Chicken Soup',            ingredients:'150g chicken, 1 chilli, 100g tomato, 2 celery stalks, 1 carrot, 500ml broth, herbs',                cal:300, pro:32, carb:16, fat:8  },
      { name:'Baked Lemon Snapper',           ingredients:'160g snapper fillet, juice of 1 lemon, 1 tbsp capers, 80g steamed kale, 80g tomato',                cal:320, pro:40, carb:8,  fat:12 },
      { name:'Chicken Lettuce Wraps',         ingredients:'150g chicken mince, 50g water chestnuts, 1 tsp sesame oil, 2 tbsp hoisin sauce, 4 lettuce cups',    cal:300, pro:32, carb:20, fat:6  },
      { name:'Edamame & Tofu Salad',          ingredients:'80g edamame, 150g firm tofu, ¼ avocado, 60g mixed greens, 2 tbsp sesame dressing',                  cal:340, pro:22, carb:18, fat:18 },
      { name:'Pork & Bok Choy Stir-Fry',     ingredients:'150g lean pork, 200g bok choy, 1 tsp ginger, 2 tbsp soy sauce, 1 tsp sesame oil',                   cal:360, pro:36, carb:14, fat:14 },
      { name:'Baked Chicken & Tomato',        ingredients:'160g chicken breast, 80g cherry tomatoes, fresh basil, 20g feta, 1 tsp olive oil',                  cal:340, pro:42, carb:8,  fat:12 },
      { name:'Broccoli & Beef Bowl',          ingredients:'130g lean beef strips, 150g broccoli, 2 tbsp low-sodium soy sauce, 80g brown rice',                 cal:380, pro:36, carb:28, fat:10 },
      { name:'Spiced Cod & Roast Veg',        ingredients:'160g cod, 1 tsp sumac, 80g roasted courgette, 80g bell pepper, juice of ½ lemon, herbs',            cal:320, pro:38, carb:12, fat:10 },
    ],
  },

  maintain: {
    breakfast: [
      { name:'Classic Overnight Oats',        ingredients:'80g oats, 200ml milk, 1 tbsp chia seeds, 1 banana, 1 tbsp honey, 20g almonds',                      cal:420, pro:16, carb:62, fat:12 },
      { name:'Poached Egg Avocado Toast',     ingredients:'2 slices sourdough, 2 poached eggs, ½ avocado, 1 tomato, juice of ½ lemon',                         cal:440, pro:20, carb:40, fat:20 },
      { name:'Greek Yogurt & Granola',        ingredients:'180g Greek yogurt, 50g granola, 80g mixed berries, 1 tbsp honey',                                   cal:400, pro:22, carb:54, fat:10 },
      { name:'Balanced Omelette',             ingredients:'2 eggs, 30g cheese, 80g mushrooms, 40g spinach, 2 slices whole wheat toast',                        cal:440, pro:28, carb:36, fat:18 },
      { name:'Smoothie Bowl',                 ingredients:'100g frozen acai, 1 banana, 200ml almond milk, 40g granola, 20g coconut flakes, 1 kiwi',             cal:420, pro:12, carb:64, fat:10 },
      { name:'Wholegrain Toast & Eggs',       ingredients:'2 slices wholegrain toast, 2 scrambled eggs, 1 tomato, 40g spinach, 1 tsp butter',                   cal:420, pro:22, carb:44, fat:16 },
      { name:'Muesli & Fruit Bowl',           ingredients:'80g Swiss muesli, 200ml whole milk, 80g strawberries, 1 banana',                                    cal:400, pro:14, carb:62, fat:10 },
      { name:'Protein Pancakes',              ingredients:'80g oats, 2 eggs, 1 scoop protein powder, 1 banana, 2 tbsp maple syrup',                            cal:440, pro:28, carb:54, fat:8  },
      { name:'Smoked Salmon Bagel',           ingredients:'1 bagel, 50g cream cheese, 80g smoked salmon, 1 tbsp capers, ¼ red onion',                          cal:460, pro:26, carb:50, fat:16 },
      { name:'Frittata Slice & Toast',        ingredients:'2 slices egg frittata, 2 slices whole wheat toast, 1 tomato, 20g rocket',                           cal:420, pro:24, carb:38, fat:18 },
      { name:'Banana Nut Oatmeal',            ingredients:'100g oats, 1 banana, 30g walnuts, 1 tbsp honey, 250ml almond milk, ½ tsp cinnamon',                 cal:440, pro:14, carb:64, fat:14 },
      { name:'Veggie Breakfast Bowl',         ingredients:'2 scrambled eggs, 100g roasted veggies, ¼ avocado, 20g feta, 2 toast slices',                       cal:460, pro:20, carb:40, fat:22 },
      { name:'Bircher Muesli',                ingredients:'80g oats, ½ grated apple, 100g yogurt, 20g almonds, 20g raisins, ½ tsp cinnamon',                   cal:410, pro:12, carb:60, fat:12 },
      { name:'Blueberry Muffin & Yogurt',     ingredients:'1 homemade oat muffin, 150g Greek yogurt, 80g blueberries',                                         cal:440, pro:16, carb:62, fat:12 },
      { name:'Egg & Cheese Croissant',        ingredients:'1 butter croissant, 2 scrambled eggs, 30g gruyere, 1 tomato',                                       cal:480, pro:20, carb:42, fat:24 },
      { name:'Chia Pudding & Fruit',          ingredients:'3 tbsp chia seeds, 200ml coconut milk, 80g mango, 1 passionfruit, 20g granola',                     cal:400, pro:8,  carb:54, fat:14 },
      { name:'Ricotta Pancakes',              ingredients:'100g ricotta, 2 eggs, 60g flour, zest of ½ lemon, 1 tbsp honey, 80g fresh berries',                 cal:420, pro:18, carb:48, fat:14 },
      { name:'Peanut Butter Toast & Banana',  ingredients:'2 slices wholegrain toast, 2 tbsp peanut butter, 1 banana, 1 tsp honey, 1 tsp seeds',               cal:440, pro:14, carb:56, fat:16 },
      { name:'Shakshuka',                     ingredients:'2 eggs poached in 150g tomato sauce, ½ bell pepper, ½ tsp cumin, 20g feta, 1 pita',                 cal:460, pro:22, carb:44, fat:18 },
      { name:'Hummus Veggie Toast',           ingredients:'2 slices sourdough, 4 tbsp hummus, ½ cucumber, 60g roasted pepper, 1 tsp olive oil',                cal:380, pro:12, carb:50, fat:14 },
      { name:'Granola Bark Bowl',             ingredients:'150g low-fat yogurt, 40g granola bark, 80g mixed berries, 1 tbsp nut butter',                       cal:420, pro:16, carb:52, fat:14 },
      { name:'Egg & Mushroom Toast',          ingredients:'2 slices whole wheat toast, 120g sautéed mushrooms, 1 poached egg, 1 tsp thyme',                    cal:380, pro:18, carb:42, fat:14 },
      { name:'Apple Cinnamon Oats',           ingredients:'100g oats, 200ml milk, 1 apple, 1 tsp cinnamon, 1 tsp brown sugar, 20g walnuts',                    cal:410, pro:10, carb:64, fat:12 },
      { name:'Tofu Scramble & Avocado',       ingredients:'180g firm tofu, ¼ tsp turmeric, 60g spinach, ¼ avocado, 2 slices rye toast',                        cal:400, pro:18, carb:36, fat:18 },
      { name:'Matcha Smoothie Bowl',          ingredients:'1 tsp matcha, 1 banana, 200ml almond milk, 30g granola, 20g coconut, 1 kiwi',                       cal:400, pro:10, carb:62, fat:12 },
    ],
    lunch: [
      { name:'Chicken & Quinoa Bowl',         ingredients:'150g grilled chicken, 100g quinoa, 100g roasted veg, 2 tbsp tahini dressing',                       cal:520, pro:40, carb:48, fat:14 },
      { name:'Mediterranean Salad Plate',     ingredients:'130g grilled chicken, 80g fattoush salad, 3 tbsp hummus, 1 pita',                                   cal:500, pro:36, carb:48, fat:14 },
      { name:'Tuna Nicoise',                  ingredients:'130g tuna, 80g green beans, 1 boiled egg, 100g potato, 10 olives, 40g lettuce',                     cal:480, pro:36, carb:34, fat:18 },
      { name:'Balanced Buddha Bowl',          ingredients:'150g brown rice, 130g salmon, ½ avocado, 60g edamame, ½ cucumber, 1 tsp sesame',                    cal:520, pro:36, carb:52, fat:16 },
      { name:'Chicken Soup & Bread',          ingredients:'400ml chicken vegetable soup, 1 whole grain roll, 1 small apple',                                   cal:480, pro:32, carb:56, fat:10 },
      { name:'Prawn & Avocado Wrap',          ingredients:'1 whole wheat wrap, 130g prawn, ½ avocado, 2 lettuce leaves, juice of ½ lemon',                     cal:480, pro:30, carb:46, fat:18 },
      { name:'Veggie Grain Bowl',             ingredients:'100g farro, 100g roasted veg, 80g chickpeas, 30g feta, juice of ½ lemon, 1 tsp olive oil',          cal:500, pro:18, carb:62, fat:16 },
      { name:'Turkey Club Sandwich',          ingredients:'3 slices wholegrain bread, 120g turkey, lettuce, tomato, ¼ avocado',                                cal:500, pro:36, carb:46, fat:16 },
      { name:'Salmon Salad Bowl',             ingredients:'150g salmon, 60g mixed leaves, 80g quinoa, ½ cucumber, 1 tbsp lemon dressing',                      cal:520, pro:40, carb:38, fat:18 },
      { name:'Lentil & Roast Veg Bowl',       ingredients:'150g green lentils, 100g roasted carrot, 80g beetroot, 20g feta, 2 tbsp dressing',                  cal:480, pro:22, carb:60, fat:12 },
      { name:'Lean Steak Pita',               ingredients:'1 whole wheat pita, 130g lean steak, 3 tbsp tzatziki, 1 tomato, ½ cucumber',                        cal:500, pro:38, carb:44, fat:14 },
      { name:'Chicken & Sweet Potato',        ingredients:'150g chicken, 200g sweet potato, 100g steamed broc, 2 tbsp tahini, juice of ½ lemon',               cal:480, pro:38, carb:46, fat:12 },
      { name:'Halloumi & Quinoa',             ingredients:'80g grilled halloumi, 100g quinoa, 80g roasted peppers, 40g spinach, 6 olives',                     cal:500, pro:24, carb:46, fat:20 },
      { name:'Poke Bowl',                     ingredients:'150g salmon, 150g sushi rice, 60g edamame, ¼ avocado, 1 tsp sesame, 2 tbsp soy sauce',              cal:520, pro:36, carb:52, fat:16 },
      { name:'Chicken & Vegetable Pasta',     ingredients:'120g whole wheat pasta, 130g chicken, 100g broccoli, juice of ½ lemon, 20g parmesan',               cal:500, pro:38, carb:52, fat:12 },
      { name:'Egg & Roasted Veg Bowl',        ingredients:'2 boiled eggs, 150g roasted courgette and pepper, 3 tbsp hummus, 6 crackers',                       cal:460, pro:22, carb:44, fat:18 },
      { name:'Tomato Basil Soup & Roll',      ingredients:'350ml tomato soup, 1 whole grain roll, 100g grilled chicken on the side',                           cal:480, pro:28, carb:56, fat:10 },
      { name:'Couscous & Veg Plate',          ingredients:'120g couscous, 150g roasted veg, 3 tbsp mint yogurt, 2 tbsp pomegranate seeds',                     cal:460, pro:14, carb:70, fat:8  },
      { name:'Fish & Chips (Healthy)',        ingredients:'150g baked fish, 200g oven sweet potato fries, 80g peas, 1 tbsp tartare sauce',                     cal:500, pro:34, carb:56, fat:12 },
      { name:'Chicken Noodle Bowl',           ingredients:'130g rice noodles, 130g chicken, 80g bok choy, 400ml broth, 1 tsp ginger, 2 tbsp soy',              cal:480, pro:36, carb:52, fat:8  },
      { name:'Black Bean Burrito',            ingredients:'1 whole wheat tortilla, 120g black beans, 80g rice, 3 tbsp salsa, ¼ avocado',                       cal:500, pro:18, carb:70, fat:12 },
      { name:'Soba Noodle Salad',             ingredients:'130g soba noodles, 80g edamame, ½ cucumber, 2 tbsp sesame dressing, 1 tsp ginger',                  cal:480, pro:20, carb:66, fat:12 },
      { name:'Tuna & White Bean Salad',       ingredients:'130g tuna, 120g cannellini beans, 80g cherry tomatoes, ¼ red onion, juice of ½ lemon',              cal:460, pro:36, carb:42, fat:10 },
      { name:'Grilled Veg & Halloumi Wrap',   ingredients:'1 whole wheat wrap, 60g halloumi, 100g grilled veg, 2 tbsp hummus, 20g rocket',                     cal:500, pro:22, carb:50, fat:20 },
      { name:'Prawn Pad Thai',                ingredients:'130g rice noodles, 130g prawn, 1 egg, 80g beansprouts, 20g peanuts, juice of ½ lime',               cal:520, pro:30, carb:58, fat:16 },
    ],
    post_workout: [
      { name:'Protein Banana Smoothie',       ingredients:'1 scoop whey protein, 1 banana, 250ml almond milk, 1 tbsp peanut butter',                           cal:380, pro:32, carb:42, fat:8  },
      { name:'Turkey & Crackers',             ingredients:'100g turkey slices, 8 whole grain crackers, 3 tbsp hummus, ½ cucumber',                             cal:340, pro:28, carb:32, fat:8  },
      { name:'Greek Yogurt & Seeds',          ingredients:'180g Greek yogurt, 1 tbsp pumpkin seeds, 1 tsp honey, 1 banana',                                    cal:360, pro:24, carb:42, fat:8  },
      { name:'Egg & Rice Cake Stack',         ingredients:'2 boiled eggs, 6 rice cakes, ¼ avocado, 6 cherry tomatoes',                                         cal:360, pro:22, carb:32, fat:14 },
      { name:'Tuna & Crackers',               ingredients:'130g tuna, 6 rye crackers, ¼ avocado, juice of ½ lemon, black pepper',                              cal:340, pro:32, carb:26, fat:12 },
      { name:'Cottage Cheese & Fruit',        ingredients:'150g low-fat cottage cheese, 1 kiwi, 80g pineapple, ½ banana, 1 tbsp flaxseed',                     cal:320, pro:24, carb:38, fat:4  },
      { name:'Chicken Rice Bowl (Light)',     ingredients:'130g chicken breast, 120g white rice, 80g steamed veg, 2 tbsp soy sauce',                           cal:400, pro:36, carb:42, fat:6  },
      { name:'Balanced Recovery Shake',       ingredients:'1 scoop whey protein, 50g oats, 1 banana, 250ml almond milk, 1 tsp honey',                          cal:380, pro:30, carb:50, fat:4  },
      { name:'Salmon Avocado Snack',          ingredients:'60g smoked salmon, ¼ avocado, 4 rye crispbreads, juice of ½ lemon',                                 cal:360, pro:26, carb:22, fat:18 },
    ],
    dinner: [
      { name:'Grilled Salmon & Veg',          ingredients:'180g salmon fillet, 120g roasted broccoli, 200g sweet potato, 1 tbsp olive oil',                    cal:560, pro:44, carb:44, fat:20 },
      { name:'Chicken Stir-Fry & Noodles',    ingredients:'150g chicken, 120g egg noodles, 120g stir-fry veg, 2 tbsp oyster sauce, 1 tsp sesame',              cal:540, pro:40, carb:56, fat:14 },
      { name:'Beef & Vegetable Stew',         ingredients:'150g lean beef, 150g potato, 1 carrot, 2 celery stalks, 100g tomato, 1 crusty roll',                cal:580, pro:40, carb:52, fat:16 },
      { name:'Baked Pesto Salmon & Rice',     ingredients:'180g salmon, 2 tbsp basil pesto, 150g basmati rice, 80g cherry tomatoes, 40g spinach',              cal:560, pro:42, carb:50, fat:18 },
      { name:'Chicken & Vegetable Curry',     ingredients:'160g chicken, 80g chickpeas, 60g tomato, 40g spinach, 150g basmati rice, 2 tbsp yogurt',            cal:540, pro:40, carb:54, fat:12 },
      { name:'Lean Lamb & Potato',            ingredients:'160g lamb loin, 200g roasted potato, 80g peas, 2 tbsp mint sauce, 60g side salad',                  cal:560, pro:40, carb:48, fat:18 },
      { name:'Tuna & Pasta Bake',             ingredients:'130g pasta, 130g tuna, 100ml light cream sauce, 60g corn, 20g parmesan, 20g breadcrumb',            cal:540, pro:38, carb:58, fat:14 },
      { name:'Grilled Pork & Salad',          ingredients:'160g pork tenderloin, 60g mixed salad, 200g baked potato, 1 tbsp light dressing',                   cal:540, pro:42, carb:46, fat:16 },
      { name:'Prawn & Vegetable Pasta',       ingredients:'120g whole wheat pasta, 150g prawns, 80g cherry tomatoes, 2 cloves garlic, 1 tbsp olive oil',       cal:520, pro:36, carb:56, fat:14 },
      { name:'Turkey & Vegetable Roast',      ingredients:'180g turkey breast, 120g roast veg, 80ml gravy, 200g roast potato, 80g peas',                       cal:560, pro:44, carb:50, fat:16 },
      { name:'Chicken Fajitas',               ingredients:'160g chicken, 1 bell pepper, 2 small whole wheat tortillas, ¼ avocado, 3 tbsp salsa',               cal:540, pro:40, carb:52, fat:14 },
      { name:'Baked Sea Bass & Quinoa',       ingredients:'180g sea bass, 100g quinoa, 100g roasted asparagus, juice of ½ lemon, herbs',                       cal:500, pro:40, carb:44, fat:14 },
      { name:'Lamb & Lentil Tagine',          ingredients:'150g lamb, 100g green lentils, 100g tomato, 1 tsp ras-el-hanout, 120g couscous, 2 tbsp yogurt',     cal:560, pro:38, carb:54, fat:16 },
      { name:'Turkey Bolognese & Pasta',      ingredients:'150g turkey mince, 120g whole wheat spaghetti, 100g tomato sauce, fresh basil',                     cal:520, pro:40, carb:56, fat:10 },
      { name:'Chicken & Mushroom Risotto',    ingredients:'150g arborio rice, 150g chicken, 120g mushrooms, 20g parmesan, 50ml white wine',                    cal:560, pro:36, carb:66, fat:14 },
      { name:'Soy Glazed Salmon',             ingredients:'180g salmon, 3 tbsp soy glaze, 150g jasmine rice, 100g bok choy, 1 tsp sesame',                     cal:560, pro:42, carb:50, fat:18 },
      { name:'Lean Beef Taco Bowl',           ingredients:'150g lean beef, 150g brown rice, 80g black beans, 3 tbsp salsa, ¼ avocado, juice of ½ lime',        cal:540, pro:38, carb:52, fat:14 },
      { name:'Chicken & Orzo Bake',           ingredients:'160g chicken, 120g orzo, 80g cherry tomatoes, 10 olives, 20g feta, fresh basil, juice of ½ lemon', cal:520, pro:36, carb:54, fat:14 },
      { name:'Grilled Swordfish & Veg',       ingredients:'180g swordfish, 80g courgette, 80g bell pepper, juice of ½ lemon, 1 tbsp olive oil',                cal:500, pro:42, carb:22, fat:22 },
      { name:'Chickpea & Spinach Curry',      ingredients:'180g chickpeas, 80g spinach, 100g tomato, 100ml coconut milk, 1 small naan, 100g rice',             cal:540, pro:20, carb:72, fat:14 },
      { name:'Turkey Stuffed Peppers',        ingredients:'2 bell peppers, 150g turkey mince, 100g brown rice, 80g tomato sauce, 30g mozzarella',              cal:500, pro:36, carb:44, fat:14 },
      { name:'Baked Trout & Roast Veg',       ingredients:'180g trout, 200g sweet potato, 100g broccoli, juice of ½ lemon, herbs, 1 tsp olive oil',            cal:520, pro:40, carb:42, fat:16 },
      { name:'Beef & Broccoli Bowl',          ingredients:'150g lean beef, 150g brown rice, 120g broccoli, 2 tbsp oyster sauce, 1 tsp sesame oil',             cal:540, pro:40, carb:52, fat:14 },
      { name:'Spiced Chicken & Couscous',     ingredients:'160g chicken, 1 tsp ras-el-hanout, 120g couscous, 2 tbsp pomegranate seeds, fresh herbs',           cal:520, pro:40, carb:54, fat:12 },
      { name:'Prawn Green Curry',             ingredients:'180g prawns, 150ml coconut milk, 2 tbsp green curry paste, 150g basmati, Thai basil leaves',        cal:540, pro:34, carb:56, fat:16 },
    ],
  },
};


// Per-goal meal plan config: labels, calorie ranges, macro targets and tips
const MP_GOAL_CONFIG = {
  weight_gain: {
    label: 'Weight Gain',
    emoji: '📈',
    mealTypes: ['breakfast','lunch','post_workout','dinner'],
    calRange: '2500–3000 kcal',
    bannerClass: 'mp-banner-weight_gain',
    textClass: 'mp-banner-text-weight_gain',
    desc: 'High-calorie meals to help you reach a calorie surplus and pack on size.',
    tip: '🍽️ Eat every 3–4 hours and aim for calorie-dense whole foods.',
    targets: {
      calories: { min: 2500, max: 3000 },
      protein:  { min: 160,  max: 200,  unit: 'g', note: '1.8–2.2g per kg bodyweight' },
      carbs:    { min: 350,  max: 420,  unit: 'g', note: 'Primary energy source for size' },
      fat:      { min: 70,   max: 95,   unit: 'g', note: 'Hormonal health & calorie density' },
      fiber:    { min: 30,   max: 40,   unit: 'g', note: 'Digestive health' },
      water:    { min: 3.0,  max: 4.0,  unit: 'L', note: 'Supports muscle volume' },
    },
  },
  build_muscle: {
    label: 'Build Muscle',
    emoji: '💪',
    mealTypes: ['breakfast','lunch','post_workout','dinner'],
    calRange: '2400–2800 kcal',
    bannerClass: 'mp-banner-build_muscle',
    textClass: 'mp-banner-text-build_muscle',
    desc: 'High-protein, balanced-carb meals optimised for hypertrophy and recovery.',
    tip: '💪 Hit your protein target every day — consistency is key to muscle growth.',
    targets: {
      calories: { min: 2400, max: 2800 },
      protein:  { min: 150,  max: 200,  unit: 'g', note: '1.6–2.2g per kg bodyweight' },
      carbs:    { min: 280,  max: 350,  unit: 'g', note: 'Fuel training & glycogen refill' },
      fat:      { min: 60,   max: 80,   unit: 'g', note: 'Testosterone & hormone support' },
      fiber:    { min: 25,   max: 35,   unit: 'g', note: 'Gut health & nutrient absorption' },
      water:    { min: 3.0,  max: 3.5,  unit: 'L', note: 'Essential for muscle protein synthesis' },
    },
  },
  lose_weight: {
    label: 'Lose Weight',
    emoji: '🔥',
    mealTypes: ['breakfast','lunch','dinner'],
    calRange: '1700–2100 kcal',
    bannerClass: 'mp-banner-lose_weight',
    textClass: 'mp-banner-text-lose_weight',
    desc: 'Lower-calorie, high-protein meals to preserve muscle while burning fat.',
    tip: '🔥 Stay hydrated and avoid liquid calories to maximise your deficit.',
    targets: {
      calories: { min: 1700, max: 2100 },
      protein:  { min: 130,  max: 170,  unit: 'g', note: '1.6–2.0g per kg — preserves muscle' },
      carbs:    { min: 150,  max: 220,  unit: 'g', note: 'Prioritise complex, high-fibre carbs' },
      fat:      { min: 45,   max: 65,   unit: 'g', note: 'Keep saturated fat low' },
      fiber:    { min: 30,   max: 40,   unit: 'g', note: 'Increases satiety & curbs hunger' },
      water:    { min: 2.5,  max: 3.5,  unit: 'L', note: 'Suppresses appetite & aids fat loss' },
    },
  },
  maintain: {
    label: 'Maintain Fitness',
    emoji: '⚡',
    mealTypes: ['breakfast','lunch','post_workout','dinner'],
    calRange: '2100–2500 kcal',
    bannerClass: 'mp-banner-maintain',
    textClass: 'mp-banner-text-maintain',
    desc: 'Balanced macros to fuel your training and sustain your current physique.',
    tip: '⚡ Balanced meals mean balanced energy — keep portions consistent day to day.',
    targets: {
      calories: { min: 2100, max: 2500 },
      protein:  { min: 120,  max: 160,  unit: 'g', note: '1.4–1.8g per kg bodyweight' },
      carbs:    { min: 240,  max: 310,  unit: 'g', note: 'Balanced energy for daily training' },
      fat:      { min: 55,   max: 75,   unit: 'g', note: 'Healthy fats for long-term wellbeing' },
      fiber:    { min: 25,   max: 35,   unit: 'g', note: 'Digestive regularity & gut health' },
      water:    { min: 2.5,  max: 3.0,  unit: 'L', note: 'Hydration for performance & recovery' },
    },
  },
};

// Display metadata (label, emoji, CSS classes) for each meal type slot
const MP_MEAL_TYPE_META = {
  breakfast:    { label:'Breakfast',     emoji:'🌅', numClass:'mp-num-breakfast', badgeClass:'mp-badge-breakfast' },
  lunch:        { label:'Lunch',         emoji:'☀️',  numClass:'mp-num-lunch',     badgeClass:'mp-badge-lunch'     },
  post_workout: { label:'Post Workout',  emoji:'⚡',  numClass:'mp-num-postwork',  badgeClass:'mp-badge-postwork'  },
  dinner:       { label:'Dinner',        emoji:'🌙', numClass:'mp-num-dinner',    badgeClass:'mp-badge-dinner'    },
};

// Active goal selection on the Meals page (default: lose weight)
let mpCurrentGoal = 'weight_gain';
// Array of meal objects that make up the current generated plan
let mpCurrentPlan = [];

// Updates the active goal chip and regenerates the meal plan
function mpSetGoal(goal) {
  mpCurrentGoal = goal;
  document.querySelectorAll('.mp-goal-chip').forEach(b =>
    b.classList.toggle('active', b.dataset.goal === goal)
  );
  mpGeneratePlan();
}

// Randomly selects one meal from the database for the given goal and meal type
function mpPickMeal(goal, type) {
  const pool = (MEAL_DB[goal] || {})[type] || [];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Generates a full day plan (one meal per slot) and triggers a render
function mpGeneratePlan() {
  const gc = MP_GOAL_CONFIG[mpCurrentGoal];

  mpCurrentPlan = gc.mealTypes.map(type => {
    const meal = mpPickMeal(mpCurrentGoal, type);
    return meal ? { ...meal, type, id: uniqueId(), logged: false } : null;
  }).filter(Boolean);

  // Reset batch-log state whenever a fresh plan is generated
  mpAllLogged    = false;
  mpAllLoggedIds = [];
  mpResetLogAllBtn();

  mpRenderTargetBanner();
  mpRenderPlan();
}

// Renders the daily nutrition targets banner at the top of the meals plan
function mpRenderTargetBanner() {
  const gc = MP_GOAL_CONFIG[mpCurrentGoal];
  const banner = document.getElementById('mp-target-banner');
  const t = gc.targets;

  banner.className = 'mp-target-banner ' + gc.bannerClass;
  banner.innerHTML = `
    <div class="mp-req-header">
      <div class="mp-req-title ${gc.textClass}">${gc.emoji} ${gc.label} · Daily Requirements</div>
      <div class="mp-req-subtitle ${gc.textClass}">${gc.calRange} per day</div>
    </div>
    <div class="mp-req-grid">
      <div class="mp-req-card mp-req-calories">
        <div class="mp-req-card-icon">🔥</div>
        <div class="mp-req-card-body">
          <div class="mp-req-card-label">Calories</div>
          <div class="mp-req-card-value">${t.calories.min}–${t.calories.max}</div>
          <div class="mp-req-card-unit">kcal / day</div>
        </div>
      </div>
      <div class="mp-req-card mp-req-protein">
        <div class="mp-req-card-icon">🥩</div>
        <div class="mp-req-card-body">
          <div class="mp-req-card-label">Protein</div>
          <div class="mp-req-card-value">${t.protein.min}–${t.protein.max}${t.protein.unit}</div>
          <div class="mp-req-card-note">${t.protein.note}</div>
        </div>
      </div>
      <div class="mp-req-card mp-req-carbs">
        <div class="mp-req-card-icon">🌾</div>
        <div class="mp-req-card-body">
          <div class="mp-req-card-label">Carbohydrates</div>
          <div class="mp-req-card-value">${t.carbs.min}–${t.carbs.max}${t.carbs.unit}</div>
          <div class="mp-req-card-note">${t.carbs.note}</div>
        </div>
      </div>
      <div class="mp-req-card mp-req-fat">
        <div class="mp-req-card-icon">🥑</div>
        <div class="mp-req-card-body">
          <div class="mp-req-card-label">Fat</div>
          <div class="mp-req-card-value">${t.fat.min}–${t.fat.max}${t.fat.unit}</div>
          <div class="mp-req-card-note">${t.fat.note}</div>
        </div>
      </div>
      <div class="mp-req-card mp-req-fiber">
        <div class="mp-req-card-icon">🥦</div>
        <div class="mp-req-card-body">
          <div class="mp-req-card-label">Fiber</div>
          <div class="mp-req-card-value">${t.fiber.min}–${t.fiber.max}${t.fiber.unit}</div>
          <div class="mp-req-card-note">${t.fiber.note}</div>
        </div>
      </div>
      <div class="mp-req-card mp-req-water">
        <div class="mp-req-card-icon">💧</div>
        <div class="mp-req-card-body">
          <div class="mp-req-card-label">Water</div>
          <div class="mp-req-card-value">${t.water.min}–${t.water.max}${t.water.unit}</div>
          <div class="mp-req-card-note">${t.water.note}</div>
        </div>
      </div>
    </div>
  `;
}

// Renders the meal cards and totals summary for the current plan
function mpRenderPlan() {
  const gc = MP_GOAL_CONFIG[mpCurrentGoal];
  const totals = mpCurrentPlan.reduce((a,m) => ({
    cal: a.cal + m.cal, pro: a.pro + m.pro, carb: a.carb + m.carb, fat: a.fat + m.fat
  }), { cal:0, pro:0, carb:0, fat:0 });

  const cardsHtml = mpCurrentPlan.map((meal, idx) => {
    const meta = MP_MEAL_TYPE_META[meal.type];
    return `
    <div class="mp-meal-card" id="mp-card-${meal.id}" style="animation-delay:${idx * 0.07}s">
      <div class="mp-meal-num ${meta.numClass}">${idx + 1}</div>
      <div class="mp-meal-content">
        <span class="mp-meal-type-badge ${meta.badgeClass}">${meta.emoji} ${meta.label}</span>
        <div class="mp-meal-name">${escHtml(meal.name)}</div>
        <div class="mp-meal-ingredients">${escHtml(meal.ingredients)}</div>
        <div class="mp-meal-macros">
          <span class="mp-macro-tag mp-macro-cal">🔥 ${meal.cal} kcal</span>
          <span class="mp-macro-tag mp-macro-pro">🥩 ${meal.pro}g</span>
          <span class="mp-macro-tag mp-macro-carb">🌾 ${meal.carb}g</span>
          <span class="mp-macro-tag mp-macro-fat">🥑 ${meal.fat}g</span>
        </div>
        <button class="mp-log-btn${meal.logged ? ' logged' : ''}"
                id="mp-log-${meal.id}"
                onclick="mpLogMeal('${meal.id}')">
          ${meal.logged
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Logged'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Log Meal'}
        </button>
      </div>
    </div>`;
  }).join('');

  document.getElementById('mp-plan-output').innerHTML = `
    <div class="mp-plan-summary">
      <div class="mp-sum-pill"><div class="s-label">Meals</div><div class="s-val">${mpCurrentPlan.length}</div></div>
      <div class="mp-sum-pill"><div class="s-label">Calories</div><div class="s-val">${totals.cal}</div></div>
      <div class="mp-sum-pill"><div class="s-label">Protein</div><div class="s-val">${totals.pro}g</div></div>
      <div class="mp-sum-pill"><div class="s-label">Carbs</div><div class="s-val">${totals.carb}g</div></div>
      <div class="mp-sum-pill"><div class="s-label">Fat</div><div class="s-val">${totals.fat}g</div></div>
    </div>
    <div class="wp-goal-banner ${mpGoalBannerClass(mpCurrentGoal)}" style="margin-bottom:1.25rem">
      <div style="flex-shrink:0">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
      </div>
      <div>
        <div style="font-weight:700;font-size:.88rem;margin-bottom:.2rem">${gc.label} Nutrition Protocol</div>
        <div style="font-size:.82rem;color:#374151;line-height:1.4">${gc.desc}</div>
        <div style="font-size:.78rem;color:#6b7280;margin-top:.35rem;font-style:italic">${gc.tip}</div>
      </div>
    </div>
    <div class="mp-meals-grid">${cardsHtml}</div>
  `;

  document.getElementById('mp-log-all-bar').style.display = 'flex';
}

// Returns an inline-style string for the goal banner's colour theme
function mpGoalBannerClass(goal) {
  const map = {
    weight_gain: 'style="border-color:rgba(245,122,61,.25);background:rgba(245,122,61,.06);color:#c2410c"',
    build_muscle: 'style="border-color:rgba(124,58,237,.25);background:rgba(124,58,237,.06);color:#6d28d9"',
    lose_weight: 'style="border-color:rgba(239,68,68,.25);background:rgba(239,68,68,.06);color:#dc2626"',
    maintain: 'style="border-color:rgba(31,173,150,.25);background:rgba(31,173,150,.06);color:#0f766e"',
  };
  return map[goal] || '';
}

// Toggles a single meal's logged state and adds/removes it from the food log
function mpLogMeal(idStr) {
  const meal = mpCurrentPlan.find(m => String(m.id) === idStr);
  if (!meal) return;

  const dateStr = fmt(dashDate);
  const btn = document.getElementById('mp-log-' + idStr);

  if (!meal.logged) {
    // ── LOG ──
    const logId = uniqueId();
    meal.logEntryId = logId;
    const entries = getFoodLog(dateStr);
    entries.push({
      id: logId,
      name: meal.name,
      ingredients: meal.ingredients,
      calories: meal.cal,
      protein: meal.pro,
      carbs: meal.carb,
      fat: meal.fat,
    });
    saveFoodLog(dateStr, entries);
    meal.logged = true;
    if (btn) {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Logged';
      btn.classList.add('logged');
    }
    showToast(meal.name + ' added to Food Log!');
  } else {
    // ── UNDO ──
    const entries = getFoodLog(dateStr).filter(e => e.id !== meal.logEntryId);
    saveFoodLog(dateStr, entries);
    meal.logged = false;
    meal.logEntryId = null;
    if (btn) {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Log Meal';
      btn.classList.remove('logged');
    }
    showToast(meal.name + ' removed from Food Log.');
  }
}

// Tracks whether all meals have been batch-logged (for toggle button state)
let mpAllLogged = false;
// Stores the log entry IDs added by the last "Log All" action for bulk removal
let mpAllLoggedIds = [];

// Helper SVG icons for the Log All button
const MP_LOG_ALL_ICON  = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
const MP_UNSAVE_ALL_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>';

// Resets the Log All button back to its default "Log All" state
function mpResetLogAllBtn() {
  const btn = document.getElementById('mp-log-all-btn');
  if (!btn) return;
  btn.innerHTML = MP_LOG_ALL_ICON + ' Log All Meals to Food Log';
  btn.classList.remove('btn-danger');
  btn.classList.add('btn-primary');
}

// Switches the Log All button to "Unsave All" state
function mpSetUnsaveAllBtn() {
  const btn = document.getElementById('mp-log-all-btn');
  if (!btn) return;
  btn.innerHTML = MP_UNSAVE_ALL_ICON + ' Unsave All Meals';
  btn.classList.remove('btn-primary');
  btn.classList.add('btn-danger');
}

// Logs every unlogged meal in the current plan to the food log at once,
// or removes them all if already batch-logged (toggle behaviour)
function mpLogAllMeals() {
  const dateStr = fmt(dashDate);

  if (mpAllLogged && mpAllLoggedIds.length > 0) {
    // ── UNSAVE ALL ──
    const idsToRemove = new Set(mpAllLoggedIds);
    const remaining = getFoodLog(dateStr).filter(e => !idsToRemove.has(e.id));
    saveFoodLog(dateStr, remaining);

    // Reset every meal card button
    mpCurrentPlan.forEach(meal => {
      if (mpAllLoggedIds.includes(meal.logEntryId)) {
        meal.logged     = false;
        meal.logEntryId = null;
      }
      const btn = document.getElementById('mp-log-' + meal.id);
      if (btn && !meal.logged) {
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Log Meal';
        btn.classList.remove('logged');
      }
    });

    mpAllLogged    = false;
    mpAllLoggedIds = [];
    mpResetLogAllBtn();
    showToast('All meals removed from Food Log.');
    return;
  }

  // ── LOG ALL ──
  // Commit any pending single-item mobile toast first
  if (typeof MUT !== 'undefined' && MUT.active) MUT.active = false;

  const newIds = [];
  mpCurrentPlan.forEach(meal => {
    if (meal.logged) return;
    const logId = uniqueId();
    meal.logEntryId = logId;
    const entries = getFoodLog(dateStr);
    entries.push({
      id:          logId,
      name:        meal.name,
      ingredients: meal.ingredients,
      calories:    meal.cal,
      protein:     meal.pro,
      carbs:       meal.carb,
      fat:         meal.fat,
    });
    saveFoodLog(dateStr, entries);
    meal.logged = true;
    newIds.push(logId);

    const btn = document.getElementById('mp-log-' + meal.id);
    if (btn) {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Logged';
      btn.classList.add('logged');
    }
  });

  if (newIds.length === 0) {
    showToast('All meals already logged!');
    return;
  }

  mpAllLogged    = true;
  mpAllLoggedIds = newIds;
  mpSetUnsaveAllBtn();
  showToast(newIds.length + ' meal' + (newIds.length > 1 ? 's' : '') + ' added to Food Log!');
}

const _origNavigate = navigate;
window.navigate = function(page) {
  _origNavigate(page);
  if (page === 'meals' && mpCurrentPlan.length === 0) mpGeneratePlan();
};

// localStorage key for personal records
const KEYS_PR = 'ns_records';
// localStorage key for the user's weight history log
const KEYS_WEIGHT_HISTORY = 'ns_weight_history';

// Returns the saved personal records object (exercise → {weight, date})
function getPRs() {
  return load(KEYS_PR) || {};
}
// Persists the personal records object
function savePRs(prs) {
  save(KEYS_PR, prs);
}

// Compares a new lift to the stored PR and updates it if it's heavier
function checkAndUpdatePR(exerciseName, weight, dateStr) {
  if (!exerciseName || weight <= 0) return false;
  const prs = getPRs();
  const existing = prs[exerciseName];
  if (!existing || weight > existing.weight) {
    prs[exerciseName] = { weight, date: dateStr };
    savePRs(prs);
    return true;
  }
  return false;
}

// Scans the entire gym history and rebuilds all personal records from scratch
function recalculateAllPRs() {
  const gymData = load(KEYS.gym) || {};
  const prs = {};
  Object.entries(gymData).forEach(([date, day]) => {
    (day.exercises || []).forEach(ex => {
      if (!ex.name || ex.weight <= 0) return;
      if (!prs[ex.name] || ex.weight > prs[ex.name].weight) {
        prs[ex.name] = { weight: ex.weight, date };
      }
    });
  });
  savePRs(prs);
}

// Recalculates PRs and renders the trophy-card grid on the Records page
function renderRecordsPage() {
  recalculateAllPRs();
  const prs = getPRs();
  const entries = Object.entries(prs).sort((a, b) => a[0].localeCompare(b[0]));
  const grid = document.getElementById('records-grid');
  const emptyEl = document.getElementById('records-empty');

  if (!entries.length) {
    grid.innerHTML = '';
    emptyEl.style.display = 'block';
    return;
  }
  emptyEl.style.display = 'none';

  grid.innerHTML = entries.map(([name, pr], i) => {
    const dateStr = pr.date ? new Date(pr.date).toLocaleDateString('en-US', { day:'2-digit', month:'short', year:'numeric' }) : '—';
    const isNew = pr.date && (Date.now() - new Date(pr.date).getTime()) < 7 * 24 * 60 * 60 * 1000;
    return `
    <div class="pr-card card" style="animation-delay:${i * 0.05}s">
      ${isNew ? '<div class="pr-new-badge">🏆 New PR!</div>' : ''}
      <div class="pr-card-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
      </div>
      <div class="pr-card-body">
        <div class="pr-card-name">${escHtml(name)}</div>
        <div class="pr-card-weight">${pr.weight} <span class="pr-card-unit">kg</span></div>
        <div class="pr-card-date">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
          ${dateStr}
        </div>
      </div>
    </div>`;
  }).join('');
}

// Returns the array of {date, weight} entries
function getWeightHistory() {
  return load(KEYS_WEIGHT_HISTORY) || [];
}
// Persists the weight history array
function saveWeightHistory(arr) {
  save(KEYS_WEIGHT_HISTORY, arr);
}
// Adds or updates a weight entry for today (upserts by date)
function logWeightEntry(weight) {
  const arr = getWeightHistory();
  const today = fmt(new Date());
  const idx = arr.findIndex(e => e.date === today);
  if (idx >= 0) arr[idx].weight = weight;
  else arr.push({ date: today, weight });
  arr.sort((a, b) => a.date.localeCompare(b.date));
  saveWeightHistory(arr);
}

// Holds active Chart.js instances so they can be destroyed before re-drawing
let progCharts = { weight: null, calories: null, strength: null, protein: null, carbs: null, fat: null };

// Activates the selected progress tab and renders its corresponding chart
function switchProgTab(tab) {
  document.querySelectorAll('.prog-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.prog-panel').forEach(p => p.classList.remove('active'));
  const tabBtn = document.getElementById('ptab-' + tab);
  const panel = document.getElementById('prog-panel-' + tab);
  if (tabBtn) tabBtn.classList.add('active');
  if (panel) panel.classList.add('active');

  if (tab === 'weight') renderWeightChart();
  if (tab === 'calories') renderCaloriesChart();
  if (tab === 'strength') renderStrengthChartInit();
  if (tab === 'protein') renderMacroChart('protein');
  if (tab === 'carbs') renderMacroChart('carbs');
  if (tab === 'fat') renderMacroChart('fat');
}

// Returns grid and tick colours appropriate for the current theme
function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    grid: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
    tick: isDark ? '#8899aa' : '#65758b',
  };
}

// Factory that creates a Chart.js line chart with consistent theme and options
function makeLineChart(canvasId, labels, datasets, yLabel) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  const c = getChartColors();
  return new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: datasets.length > 1, labels: { color: c.tick, font: { size: 11 }, boxWidth: 12, padding: 16 } },
        tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y}${yLabel}` } },
      },
      scales: {
        x: { grid: { color: c.grid }, ticks: { color: c.tick, font: { size: 11 } } },
        y: { grid: { color: c.grid }, ticks: { color: c.tick, font: { size: 11 }, callback: v => `${v}${yLabel}` } },
      },
    },
  });
}

// Draws the body-weight trend line chart from the stored weight history
function renderWeightChart() {
  const history = getWeightHistory();
  const wrap = document.getElementById('prog-chart-wrap-weight');
  const emptyEl = document.getElementById('prog-weight-empty');
  const statsEl = document.getElementById('prog-weight-stats');

  if (progCharts.weight) { progCharts.weight.destroy(); progCharts.weight = null; }

  if (history.length < 1) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const labels = history.map(e => {
    const d = new Date(e.date);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  progCharts.weight = makeLineChart('chart-weight', labels, [{
    label: 'Weight (kg)',
    data: history.map(e => e.weight),
    borderColor: '#1fad96',
    backgroundColor: 'rgba(31,173,150,0.1)',
    borderWidth: 2.5,
    tension: 0.35,
    pointBackgroundColor: '#1fad96',
    pointRadius: 5,
    fill: true,
  }], ' kg');

  const weights = history.map(e => e.weight);
  const min = Math.min(...weights), max = Math.max(...weights);
  const latest = weights[weights.length - 1];
  const change = weights.length > 1 ? (latest - weights[0]).toFixed(1) : null;
  if (statsEl) statsEl.innerHTML = `
    <div class="prog-stat-chip"><span class="psc-label">Current</span><span class="psc-val">${latest} kg</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Min</span><span class="psc-val">${min} kg</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Max</span><span class="psc-val">${max} kg</span></div>
    ${change !== null ? `<div class="prog-stat-chip"><span class="psc-label">Change</span><span class="psc-val" style="color:${+change <= 0 ? '#1fad96' : '#f57a3d'}">${+change > 0 ? '+' : ''}${change} kg</span></div>` : ''}
  `;
}

// Draws daily calorie intake vs goal as a dual-dataset line chart
function renderCaloriesChart() {
  const foodData = load(KEYS.food) || {};
  const goalsData = load(KEYS.goals) || {};
  const defaultGoal = getDefaultGoals();

  if (progCharts.calories) { progCharts.calories.destroy(); progCharts.calories = null; }

  const dates = Object.keys(foodData).sort();
  const emptyEl = document.getElementById('prog-cal-empty');
  const statsEl = document.getElementById('prog-cal-stats');

  if (!dates.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const labels = dates.map(d => {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
  });
  const calIntake = dates.map(d =>
    (foodData[d] || []).reduce((s, e) => s + (e.calories || 0), 0)
  );
  const calGoals = dates.map(d => (goalsData[d] || defaultGoal).calories);

  progCharts.calories = makeLineChart('chart-calories', labels, [
    {
      label: 'Intake (kcal)',
      data: calIntake,
      borderColor: '#f57a3d',
      backgroundColor: 'rgba(245,122,61,0.1)',
      borderWidth: 2.5,
      tension: 0.35,
      pointBackgroundColor: '#f57a3d',
      pointRadius: 5,
      fill: true,
    },
    {
      label: 'Goal (kcal)',
      data: calGoals,
      borderColor: '#1fad96',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 4],
      tension: 0,
      pointRadius: 0,
    },
  ], ' kcal');

  const avg = Math.round(calIntake.reduce((a, b) => a + b, 0) / calIntake.length);
  const maxVal = Math.max(...calIntake);
  const minVal = Math.min(...calIntake);
  if (statsEl) statsEl.innerHTML = `
    <div class="prog-stat-chip"><span class="psc-label">Avg/day</span><span class="psc-val">${avg} kcal</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Best</span><span class="psc-val">${minVal} kcal</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Peak</span><span class="psc-val">${maxVal} kcal</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Days</span><span class="psc-val">${dates.length}</span></div>
  `;
}

// Config objects for the three macro charts (protein, carbs, fat)
const MACRO_CONFIG = {
  protein: { label: 'Protein',  unit: 'g', color: '#6366f1', goalKey: 'protein',  emptyId: 'prog-protein-empty', statsId: 'prog-protein-stats', chartId: 'chart-protein' },
  carbs:   { label: 'Carbs',    unit: 'g', color: '#f59e0b', goalKey: 'carbs',    emptyId: 'prog-carbs-empty',   statsId: 'prog-carbs-stats',   chartId: 'chart-carbs'   },
  fat:     { label: 'Fat',      unit: 'g', color: '#ec4899', goalKey: 'fat',      emptyId: 'prog-fat-empty',     statsId: 'prog-fat-stats',     chartId: 'chart-fat'     },
};

// Draws a macro intake-vs-goal chart for the given macro key
function renderMacroChart(macro) {
  const cfg = MACRO_CONFIG[macro];
  if (!cfg) return;
  const foodData = load(KEYS.food) || {};
  const goalsData = load(KEYS.goals) || {};
  const defaultGoal = getDefaultGoals();

  if (progCharts[macro]) { progCharts[macro].destroy(); progCharts[macro] = null; }

  const dates = Object.keys(foodData).sort();
  const emptyEl = document.getElementById(cfg.emptyId);
  const statsEl = document.getElementById(cfg.statsId);

  if (!dates.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const labels = dates.map(d => {
    const dt = new Date(d);
    return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}`;
  });
  const intake = dates.map(d =>
    Math.round((foodData[d] || []).reduce((s, e) => s + (e[macro] || 0), 0) * 10) / 10
  );
  const goals = dates.map(d => (goalsData[d] || defaultGoal)[cfg.goalKey] || 0);

  const hexToRgba = (hex, a) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };

  progCharts[macro] = makeLineChart(cfg.chartId, labels, [
    {
      label: `${cfg.label} (${cfg.unit})`,
      data: intake,
      borderColor: cfg.color,
      backgroundColor: hexToRgba(cfg.color, 0.1),
      borderWidth: 2.5,
      tension: 0.35,
      pointBackgroundColor: cfg.color,
      pointRadius: 5,
      fill: true,
    },
    {
      label: `Goal (${cfg.unit})`,
      data: goals,
      borderColor: '#1fad96',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 4],
      tension: 0,
      pointRadius: 0,
    },
  ], cfg.unit);

  if (statsEl && intake.length) {
    const avg = Math.round(intake.reduce((a, b) => a + b, 0) / intake.length * 10) / 10;
    const maxVal = Math.max(...intake);
    const minVal = Math.min(...intake);
    statsEl.innerHTML = `
      <div class="prog-stat-chip"><span class="psc-label">Avg/day</span><span class="psc-val">${avg}${cfg.unit}</span></div>
      <div class="prog-stat-chip"><span class="psc-label">Min</span><span class="psc-val">${minVal}${cfg.unit}</span></div>
      <div class="prog-stat-chip"><span class="psc-label">Max</span><span class="psc-val">${maxVal}${cfg.unit}</span></div>
      <div class="prog-stat-chip"><span class="psc-label">Days</span><span class="psc-val">${dates.length}</span></div>
    `;
  }
}

// Populates the exercise dropdown on the Strength tab and triggers the chart
function renderStrengthChartInit() {
  const select = document.getElementById('prog-ex-select');
  if (!select) return;
  const names = getAllExerciseNames();
  const currentVal = select.value;
  select.innerHTML = '<option value="">Select exercise…</option>' +
    names.map(n => `<option value="${escHtml(n)}" ${n === currentVal ? 'selected' : ''}>${escHtml(n)}</option>`).join('');
  renderStrengthChart();
}

// Draws the weight-over-time line chart for the selected exercise
function renderStrengthChart() {
  const select = document.getElementById('prog-ex-select');
  const name = select ? select.value : '';
  const emptyEl = document.getElementById('prog-str-empty');
  const statsEl = document.getElementById('prog-str-stats');

  if (progCharts.strength) { progCharts.strength.destroy(); progCharts.strength = null; }

  if (!name) {
    if (emptyEl) emptyEl.style.display = 'block';
    if (statsEl) statsEl.innerHTML = '';
    return;
  }

  const data = getExerciseProgress(name);
  if (!data.length) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  const labels = data.map(e => {
    const d = new Date(e.date);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
  });

  progCharts.strength = makeLineChart('chart-strength', labels, [{
    label: 'Weight (kg)',
    data: data.map(e => e.weight),
    borderColor: '#8e5eed',
    backgroundColor: 'rgba(142,94,237,0.1)',
    borderWidth: 2.5,
    tension: 0.35,
    pointBackgroundColor: '#8e5eed',
    pointRadius: 5,
    fill: true,
  }], ' kg');

  const pr = data.reduce((mx, e) => e.weight > mx.weight ? e : mx, data[0]);
  const latest = data[data.length - 1];
  const first = data[0];
  const gained = (latest.weight - first.weight).toFixed(1);

  if (statsEl) statsEl.innerHTML = `
    <div class="prog-stat-chip"><span class="psc-label">Sessions</span><span class="psc-val">${data.length}</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Best</span><span class="psc-val" style="color:#f59e0b">${pr.weight} kg</span></div>
    <div class="prog-stat-chip"><span class="psc-label">Gained</span><span class="psc-val" style="color:${+gained >= 0 ? '#1fad96' : '#ef4444'}">${+gained >= 0 ? '+' : ''}${gained} kg</span></div>
  `;
}

const _origSaveProfile = saveProfile_;
window.saveProfile_ = function(p) {
  _origSaveProfile(p);
  if (p.weight) logWeightEntry(p.weight);
};

const _origAddExercise = addExercise;
window.addExercise = function() {
  const name = document.getElementById('e-name').value.trim();
  const weight = +document.getElementById('e-weight').value || 0;
  const dateStr = fmt(gymDate);
  _origAddExercise();
  if (name && weight > 0) {
    const isNewPR = checkAndUpdatePR(name, weight, dateStr);
    if (isNewPR) {
      setTimeout(() => showToast(`🏆 New Personal Record! ${name}: ${weight} kg`, 'pr'), 300);
    }
  }
};

const _origSaveEdit = saveEdit;
window.saveEdit = function(id) {
  _origSaveEdit(id);
  const dateStr = fmt(gymDate);
  const wd = getGymDay(dateStr);
  const ex = (wd.exercises || []).find(
    e => String(e.id).replace(/[^a-zA-Z0-9_-]/g, '_') === String(id)
  );
  if (ex && ex.weight > 0) {
    const isNewPR = checkAndUpdatePR(ex.name, ex.weight, dateStr);
    if (isNewPR) {
      setTimeout(() => showToast(`🏆 New Personal Record! ${ex.name}: ${ex.weight} kg`, 'pr'), 300);
    }
  }
};

const _origNavigate2 = window.navigate;
window.navigate = function(page) {
  _origNavigate2(page);
  if (page === 'progress') {
    setTimeout(() => {
      switchProgTab('calories');
    }, 180);
  }
  if (page === 'records') {
    setTimeout(() => renderRecordsPage(), 180);
  }
};

const _origShowToast = showToast;
window.showToast = function(msg, type) {
  if (type === 'pr') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast toast-pr';
    toast.textContent = msg;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  } else {
    _origShowToast(msg);
  }
};

// Expands or collapses the label-based quantity calculator panel
function toggleQtyCalc() {
  const panel   = document.getElementById('qty-calc-panel');
  const chevron = document.getElementById('qty-calc-chevron');
  const btn     = document.getElementById('qty-calc-toggle-btn');
  const isOpen  = panel.classList.contains('open');

  panel.classList.toggle('open', !isOpen);
  chevron.classList.toggle('open', !isOpen);
  btn.classList.toggle('active', !isOpen);
}

// Scales per-100g nutrition values to the consumed amount and fills the form
function runQtyCalc() {
  const base     = parseFloat(document.getElementById('qc-base').value)     || 0;
  const consumed = parseFloat(document.getElementById('qc-consumed').value) || 0;
  const cal      = parseFloat(document.getElementById('qc-cal').value)      || 0;
  const pro      = parseFloat(document.getElementById('qc-pro').value)      || 0;
  const carb     = parseFloat(document.getElementById('qc-carb').value)     || 0;
  const fat      = parseFloat(document.getElementById('qc-fat').value)      || 0;

  if (base <= 0) { showToast('Base amount must be greater than 0.'); return; }
  if (consumed <= 0) { showToast('Please enter the consumed amount.'); return; }

  const m = consumed / base;

  const rCal  = Math.round(cal  * m * 10) / 10;
  const rPro  = Math.round(pro  * m * 10) / 10;
  const rCarb = Math.round(carb * m * 10) / 10;
  const rFat  = Math.round(fat  * m * 10) / 10;

  document.getElementById('f-cal').value  = rCal;
  document.getElementById('f-pro').value  = rPro;
  document.getElementById('f-carb').value = rCarb;
  document.getElementById('f-fat').value  = rFat;

  const chips = document.getElementById('qty-calc-result-chips');
  chips.innerHTML = `
    <div class="qc-chip"><span class="qc-chip-label">Cals</span><span class="qc-chip-val calories-color">${rCal}</span></div>
    <div class="qc-chip"><span class="qc-chip-label">Protein</span><span class="qc-chip-val protein-color">${rPro}g</span></div>
    <div class="qc-chip"><span class="qc-chip-label">Carbs</span><span class="qc-chip-val carbs-color">${rCarb}g</span></div>
    <div class="qc-chip"><span class="qc-chip-label">Fat</span><span class="qc-chip-val fat-color">${rFat}g</span></div>
  `;
  document.getElementById('qty-calc-result').style.display = 'block';
}

const _origCloseModal = closeModal;
window.closeModal = function(id) {
  _origCloseModal(id);
  if (id === 'add-food-modal') {
    const panel   = document.getElementById('qty-calc-panel');
    const chevron = document.getElementById('qty-calc-chevron');
    const btn     = document.getElementById('qty-calc-toggle-btn');
    if (panel)   panel.classList.remove('open');
    if (chevron) chevron.classList.remove('open');
    if (btn)     btn.classList.remove('active');
    const result = document.getElementById('qty-calc-result');
    if (result) result.style.display = 'none';
    ['qc-base','qc-consumed','qc-cal','qc-pro','qc-carb','qc-fat'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = id === 'qc-base' ? '100' : '0';
    });
  }
};


// Prefix for per-date water intake keys in localStorage
const WATER_KEY_PREFIX = 'water_';

// Builds the full localStorage key for a given date's water intake
function getWaterKey(dateStr) {
  return WATER_KEY_PREFIX + dateStr;
}

// Returns the total water intake in ml for the given date
function getWaterIntake(dateStr) {
  const raw = localStorage.getItem(getWaterKey(dateStr));
  return raw !== null ? parseInt(raw, 10) : 0;
}

// Persists the water intake value (in ml) for the given date
function saveWaterIntake(dateStr, ml) {
  localStorage.setItem(getWaterKey(dateStr), String(ml));
}

// Calculates a personalised daily water target based on weight and goal
function calcWaterGoal() {
  const profile = getProfile();
  const weight  = parseFloat(profile.weight) || 70;
  const goal    = (profile.goal || 'maintain').toLowerCase();

  let goalMl = weight * 35;
  if (goal === 'lose fat' || goal === 'lose_fat' || goal === 'losefat') {
    goalMl += 300;
  } else if (goal === 'build muscle' || goal === 'build_muscle' || goal === 'buildmuscle') {
    goalMl += 500;
  }
  return Math.round(goalMl);
}

// Updates the water-intake card UI (bar, percentage badge, remaining label)
function renderWaterCard() {
  const dateStr  = fmt(dashDate);
  const intake   = getWaterIntake(dateStr);
  const goalMl   = calcWaterGoal();
  const pct      = Math.min(Math.round((intake / goalMl) * 100), 100);
  const done     = intake >= goalMl;
  const remaining = Math.max(goalMl - intake, 0);

  const consumedEl  = document.getElementById('water-consumed-display');
  const goalEl      = document.getElementById('water-goal-display');
  const barEl       = document.getElementById('water-bar-fill');
  const pctEl       = document.getElementById('water-pct-badge');
  const remainEl    = document.getElementById('water-remaining-label');
  const remainRow   = document.getElementById('water-remaining-text');

  if (!consumedEl) return;

  consumedEl.textContent = intake.toLocaleString();
  goalEl.textContent     = goalMl.toLocaleString();
  barEl.style.width      = pct + '%';
  pctEl.textContent      = pct + '% completed';

  if (done) {
    barEl.classList.add('complete');
    pctEl.classList.add('done');
    remainEl.textContent = '🎉 Goal reached!';
    remainRow.classList.add('complete');
  } else {
    barEl.classList.remove('complete');
    pctEl.classList.remove('done');
    remainEl.textContent = remaining.toLocaleString() + ' ml left';
    remainRow.classList.remove('complete');
  }
}

// Decreases the day's water intake by ml (undo last cup)
function cancelWater(ml) {
  if (!isToday(dashDate)) {
    showToast('Water tracking only available for today.');
    return;
  }
  const dateStr = fmt(dashDate);
  const current = getWaterIntake(dateStr);
  if (current <= 0) {
    showToast('No water intake to cancel.');
    return;
  }
  const newVal = Math.max(current - ml, 0);
  saveWaterIntake(dateStr, newVal);

  const consumedEl = document.getElementById('water-consumed-display');
  if (consumedEl) {
    consumedEl.classList.remove('pulse');
    void consumedEl.offsetWidth;
    consumedEl.classList.add('pulse');
  }

  renderWaterCard();
  showToast('💧 Removed 250 ml.');
}

// Increases the day's water intake by ml and re-renders the card
function addWater(ml) {
  if (!isToday(dashDate)) {
    showToast('Water tracking only available for today.');
    return;
  }

  const dateStr = fmt(dashDate);
  const current = getWaterIntake(dateStr);
  const newVal  = current + ml;
  saveWaterIntake(dateStr, newVal);

  const consumedEl = document.getElementById('water-consumed-display');
  if (consumedEl) {
    consumedEl.classList.remove('pulse');
    void consumedEl.offsetWidth;
    consumedEl.classList.add('pulse');
  }

  renderWaterCard();

  const goalMl = calcWaterGoal();
  if (newVal >= goalMl && (newVal - ml) < goalMl) {
    showToast('💧 Daily water goal reached! Great job!');
  }
}

const _origRenderDashboard = renderDashboard;
window.renderDashboard = function() {
  _origRenderDashboard();
  renderWaterCard();
};

document.addEventListener('DOMContentLoaded', function() {
  renderWaterCard();
});

const _origSaveProfileWater = window.saveProfile_;
window.saveProfile_ = function(p) {
  _origSaveProfileWater(p);
  renderWaterCard();
};

/*ENHANCEMENT 1 — Loading state for Generate Workout Plan*/

// Wrap the original generateWorkoutPlan with a loading state
(function wrapGenerateWorkoutPlan() {
  const _orig = window.generateWorkoutPlan || generateWorkoutPlan;

  window.generateWorkoutPlan = function () {
    const output = document.getElementById('wp-plan-output');
    if (!output) { _orig(); return; }

    // Show skeleton + spinner
    output.innerHTML = `
      <div class="wp-loading-state">
        <div class="wp-loading-spinner-wrap">
          <div class="wp-loading-ring"></div>
          <div class="wp-loading-icon">🏋️</div>
        </div>
        <div class="wp-loading-msg">Generating your workout plan…</div>
        <div class="wp-loading-sub">Selecting optimal exercises for your goal &amp; level</div>
      </div>
      <div class="wp-skeleton-card" style="margin-top:.75rem">
        <div class="wp-skeleton-bar bar-title"></div>
        <div class="wp-skeleton-bar bar-badge"></div>
        <div class="wp-skeleton-bar bar-desc"></div>
        <div class="wp-skeleton-bar bar-desc2"></div>
        <div class="wp-skeleton-bar bar-row"></div>
        <div style="height:.5rem"></div>
        <div class="wp-skeleton-bar bar-row2"></div>
        <div style="height:.5rem"></div>
        <div class="wp-skeleton-bar bar-row3"></div>
      </div>`;

    // Simulate 1.5 s processing, then render real plan
    setTimeout(() => {
      _orig();
    }, 1500);
  };
})();


/* ENHANCEMENT 2 — Loading state for Profile Goal Calculation*/

(function wrapSaveProfile() {
  const _origSave = window.saveProfile || saveProfile;

  window.saveProfile = function () {
    // Validate first (re-use original logic for error check)
    const p = {
      height: +document.getElementById('p-height').value,
      weight: +document.getElementById('p-weight').value,
      age:    +document.getElementById('p-age').value,
      gender: document.getElementById('p-gender').value,
      activityLevel: document.getElementById('p-activity').value,
      goal:   document.getElementById('p-goal').value,
    };
    if (p.height < 50 || p.height > 300 || p.weight < 20 || p.weight > 400 || p.age < 10 || p.age > 120) {
      showToast('Please check your inputs.');
      return;
    }

    const resultEl = document.getElementById('calc-result');
    if (!resultEl) { _origSave(); return; }

    // Show skeleton loading
    resultEl.innerHTML = `
      <div class="goals-loading-state">
        <div class="goals-loading-ring"></div>
        <div class="goals-loading-msg">Calculating your goals…</div>
        <div class="goals-loading-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
      <div class="goals-skeleton">
        <div class="goals-skeleton-big"></div>
        <div class="goals-skeleton-pill">
          <div class="goals-skeleton-item"></div>
          <div class="goals-skeleton-item"></div>
          <div class="goals-skeleton-item"></div>
        </div>
      </div>`;

    // Save profile immediately in background
    saveProfile_(p);
    showToast('Profile saved!');

    const banner = document.getElementById('onboard-banner');

    // After 1 second show results
    setTimeout(() => {
      const r = calcGoals(p);
      showCalcResult(r);

      if (banner) {
        banner.style.transition = 'opacity 0.3s ease';
        banner.style.opacity = '0';
        setTimeout(() => {
          banner.remove();
          navigate('dashboard');
        }, 320);
      }
    }, 1000);
  };
})();


/*ENHANCEMENT 3 — Smart Messages System (Dashboard)*/

function computeSmartMessages(totals, goals, foodEntries) {
  const messages = [];
  const hasLogged = foodEntries.length > 0;

  // 1. No activity at all today
  if (!hasLogged) {
    messages.push({
      type: 'neutral',
      icon: '📋',
      text: "You haven't logged anything today. Start now!",
    });
    return messages; // only show this one when nothing logged
  }

  const calPct   = goals.calories > 0 ? totals.calories / goals.calories : 0;
  const protPct  = goals.protein  > 0 ? totals.protein  / goals.protein  : 0;
  const carbsPct = goals.carbs    > 0 ? totals.carbs    / goals.carbs    : 0;
  const fatPct   = goals.fat      > 0 ? totals.fat      / goals.fat      : 0;

  const allGoalsMet = calPct >= 0.95 && protPct >= 0.95 && carbsPct >= 0.95 && fatPct >= 0.95;

  // 2. All goals reached — celebratory message
  if (allGoalsMet) {
    messages.push({
      type: 'success',
      icon: '🎉',
      text: 'Great job! You hit your daily goals today!',
    });
    return messages;
  }

  // 3. Calorie under goal
  if (calPct < 0.85 && goals.calories > 0) {
    const remaining = Math.round(goals.calories - totals.calories);
    messages.push({
      type: 'warning',
      icon: '🔥',
      text: `You are under your calorie goal by ${remaining} kcal. Eat more to stay on track.`,
    });
  }

  // 4. Calorie over goal
  if (calPct > 1.1 && goals.calories > 0) {
    const over = Math.round(totals.calories - goals.calories);
    messages.push({
      type: 'warning',
      icon: '⚠️',
      text: `You're ${over} kcal over your calorie goal today. Consider lighter meals.`,
    });
  }

  // 5. Protein low
  if (protPct < 0.75 && goals.protein > 0) {
    const needed = Math.round(goals.protein - totals.protein);
    messages.push({
      type: 'info',
      icon: '💪',
      text: `You still need ${needed}g more protein today. Add a high-protein meal or snack.`,
    });
  }

  // 6. Protein reached
  if (protPct >= 0.95 && calPct < 0.95) {
    messages.push({
      type: 'success',
      icon: '✅',
      text: 'Protein goal reached! Focus on hitting your calorie target next.',
    });
  }

  // 7. Carbs low (only mention if calorie goal not also low — avoid redundancy)
  if (carbsPct < 0.70 && calPct >= 0.85 && goals.carbs > 0) {
    messages.push({
      type: 'info',
      icon: '🌾',
      text: `Carbs are low today — you still need ${Math.round(goals.carbs - totals.carbs)}g to hit your carb goal.`,
    });
  }

  // 8. Good progress message (50-85% across all)
  if (calPct >= 0.5 && calPct < 0.95 && protPct >= 0.5 && messages.length === 0) {
    messages.push({
      type: 'info',
      icon: '📈',
      text: `Good progress! You're ${Math.round(calPct * 100)}% of the way to your calorie goal. Keep it up!`,
    });
  }

  return messages;
}

function renderSmartMessages() {
  const panel = document.getElementById('smart-messages-panel');
  if (!panel) return;

  // Only show for today
  if (!isToday(dashDate)) {
    panel.style.display = 'none';
    return;
  }

  const dateStr = fmt(dashDate);
  const entries = getFoodLog(dateStr);
  const goals   = getGoals(dateStr);
  const totals  = entries.reduce(
    (a, e) => ({
      calories: a.calories + e.calories,
      protein:  a.protein  + e.protein,
      carbs:    a.carbs    + e.carbs,
      fat:      a.fat      + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const messages = computeSmartMessages(totals, goals, entries);

  if (!messages.length) {
    panel.style.display = 'none';
    return;
  }

  panel.innerHTML = messages.map(m => `
    <div class="smart-msg msg-${m.type}">
      <span class="smart-msg-icon">${m.icon}</span>
      <span class="smart-msg-text">${m.text}</span>
    </div>
  `).join('');
  panel.style.display = 'flex';
}

// Hook into renderDashboard to always refresh smart messages
const _origRenderDashForSmartMsg = window.renderDashboard;
window.renderDashboard = function () {
  _origRenderDashForSmartMsg();
  renderSmartMessages();
};

// Also refresh smart messages after food is added/deleted
const _origAddFoodSmart = window.addFood;
window.addFood = function () {
  _origAddFoodSmart();
  // renderDashboard already called inside addFood, which now calls renderSmartMessages
};


/* ENHANCEMENT 4 — Mobile Toast + Undo system for Meals & Programs
   Applies ONLY when window.innerWidth < 768px (mobile devices).
   Desktop keeps the original "+ Log → ✓ Saved / Logged" behaviour. */

(function initMobileUndoToast() {

  /* ── Helpers ── */
  function isMobile() {
    return window.innerWidth < 768;
  }

  /* ── State ── */
  const MUT = {
    timer:      null,   // auto-save timeout handle
    undoFn:     null,   // function to call when UNDO is tapped
    commitFn:   null,   // function to call when item becomes permanent
    active:     false,  // is a toast currently pending?
  };

  /* ── DOM refs (resolved lazily after DOMContentLoaded) ── */
  function getToast()    { return document.getElementById('mobile-undo-toast'); }
  function getMsgText()  { return document.getElementById('mut-msg-text'); }
  function getProgress() { return document.getElementById('mut-progress'); }

  /* ── Show a new undo toast ──
       msg      : string shown in the toast
       undoFn   : called immediately if user taps UNDO
       commitFn : called when item is permanently saved (auto or next-tap)
  ── */
  function showMobileToast(msg, undoFn, commitFn) {
    // If a previous item is still pending → commit it first
    if (MUT.active) {
      _commitPending();
    }

    MUT.undoFn   = undoFn;
    MUT.commitFn = commitFn;
    MUT.active   = true;

    // Update message
    const msgEl = getMsgText();
    if (msgEl) msgEl.textContent = msg;

    // Restart progress bar animation by toggling the class
    const toast = getToast();
    if (!toast) return;

    // Reset animation
    const prog = getProgress();
    if (prog) {
      prog.style.animation = 'none';
      void prog.offsetWidth; // reflow
      prog.style.animation = '';
    }

    // Show
    toast.style.display = 'flex';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('show'));
    });

    // Auto-save after 4 seconds
    clearTimeout(MUT.timer);
    MUT.timer = setTimeout(() => {
      _commitPending();
      _hideToast();
    }, 4000);
  }

  /* ── Commit the pending item (make it permanent) ── */
  function _commitPending() {
    if (!MUT.active) return;
    clearTimeout(MUT.timer);
    if (typeof MUT.commitFn === 'function') MUT.commitFn();
    MUT.active   = false;
    MUT.undoFn   = null;
    MUT.commitFn = null;
  }

  /* ── Hide the toast with slide-out animation ── */
  function _hideToast() {
    const toast = getToast();
    if (!toast) return;
    toast.classList.remove('show');
    setTimeout(() => {
      if (!MUT.active) toast.style.display = 'none';
    }, 320);
  }

  /* ── Public: called by the UNDO button in the HTML ── */
  window.mobileUndoAction = function () {
    if (!MUT.active) return;
    clearTimeout(MUT.timer);
    if (typeof MUT.undoFn === 'function') MUT.undoFn();
    MUT.active   = false;
    MUT.undoFn   = null;
    MUT.commitFn = null;
    _hideToast();
  };

  /*INTERCEPT 1 — Programs page: wpSaveOne(id) "+" Log button on workout exercise cards*/
  const _origWpSaveOne = window.wpSaveOne || wpSaveOne;

  window.wpSaveOne = function (id) {
    // Desktop → original behaviour unchanged
    if (!isMobile()) {
      _origWpSaveOne(id);
      return;
    }

    if (!wpCurrentPlan) return;
    const ex = wpCurrentPlan.find(e => e.id === id);
    if (!ex) return;

    // If already saved → act as undo (toggle off), same as desktop
    if (ex.saved) {
      _origWpSaveOne(id);
      return;
    }

    /* ── Add to gym log immediately (temporary) ── */
    const dateStr = fmt(gymDate);
    const wd      = getGymDay(dateStr);
    const repsNum = parseInt(String(ex.reps).split('\u2013')[0]) || 10;
    const newId   = uniqueId();
    ex.gymEntryId = newId;
    wd.exercises.push({
      id:    newId,
      name:  ex.name,
      sets:  ex.sets,
      reps:  repsNum,
      weight: 0,
      notes: (SUB_TARGET_LABELS[ex.sub] || ex.sub) + ' \u2022 ' + ex.sets + '\xD7' + ex.reps,
    });
    wd.muscleGroup = WP_MUSCLE_TO_GYM[WP_STATE.muscle] || WP_STATE.muscle;
    saveGymDay(dateStr, wd);
    ex.saved = true;

    // Update button to "✓ Saved"
    const btn = document.getElementById('wp-save-' + id);
    if (btn) { btn.textContent = '\u2713 Saved'; btn.classList.add('saved'); }

    /* ── Show mobile undo toast ── */
    showMobileToast(
      ex.name + ' added to Gym Log',
      /* undoFn */ function () {
        // Remove from gym log
        const wdUndo = getGymDay(dateStr);
        wdUndo.exercises = wdUndo.exercises.filter(e => e.id !== ex.gymEntryId);
        saveGymDay(dateStr, wdUndo);
        ex.saved      = false;
        ex.gymEntryId = null;
        const btnU = document.getElementById('wp-save-' + id);
        if (btnU) { btnU.textContent = '+ Log'; btnU.classList.remove('saved'); }
      },
      /* commitFn — item already in localStorage, nothing extra needed */ null
    );
  };

  /* ════════════════════════════════════════════════
     INTERCEPT 2 — Meals page: mpLogMeal(idStr)
     "Log Meal" button on meal plan cards
  ════════════════════════════════════════════════ */
  const _origMpLogMeal = window.mpLogMeal || mpLogMeal;

  window.mpLogMeal = function (idStr) {
    // Desktop → original behaviour unchanged
    if (!isMobile()) {
      _origMpLogMeal(idStr);
      return;
    }

    const meal = mpCurrentPlan.find(m => String(m.id) === idStr);
    if (!meal) return;

    // If already logged → act as undo (toggle off), same as desktop
    if (meal.logged) {
      _origMpLogMeal(idStr);
      return;
    }

    /* ── Add to food log immediately (temporary) ── */
    const dateStr = fmt(dashDate);
    const logId   = uniqueId();
    meal.logEntryId = logId;
    const entries = getFoodLog(dateStr);
    entries.push({
      id:          logId,
      name:        meal.name,
      ingredients: meal.ingredients,
      calories:    meal.cal,
      protein:     meal.pro,
      carbs:       meal.carb,
      fat:         meal.fat,
    });
    saveFoodLog(dateStr, entries);
    meal.logged = true;

    // Update button to "✓ Logged"
    const btn = document.getElementById('mp-log-' + idStr);
    if (btn) {
      btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Logged';
      btn.classList.add('logged');
    }

    /* ── Show mobile undo toast ── */
    showMobileToast(
      meal.name + ' added to Food Log',
      /* undoFn */ function () {
        // Remove from food log
        const undoEntries = getFoodLog(dateStr).filter(e => e.id !== meal.logEntryId);
        saveFoodLog(dateStr, undoEntries);
        meal.logged     = false;
        meal.logEntryId = null;
        const btnU = document.getElementById('mp-log-' + idStr);
        if (btnU) {
          btnU.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Log Meal';
          btnU.classList.remove('logged');
        }
      },
      /* commitFn — item already in localStorage, nothing extra needed */ null
    );
  };

})();
// Service Worker Registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js")
        .then(reg => console.log("[SW] Registered:", reg.scope))
        .catch(err => console.error("[SW] Registration failed:", err));
    });
  }