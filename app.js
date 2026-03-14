(() => {
  const STORAGE_KEY = "budget-flow.v2";
  const THEME_KEY = "budget-flow.theme";

  const UI_LOCALE = "en-GB";   // English text/date
  const MONEY_LOCALE = "nl-NL"; // Netherlands money style with comma decimals

  const DEFAULT_STATE = {
    goals: [],
    incomes: [],
    expenses: [],
    etf: {
      monthlyAmount: 300,
      years: 10
    }
  };

  const currencyFormatter = new Intl.NumberFormat(MONEY_LOCALE, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  });

  let state = normalizeState(loadState());
  let dateClockIntervalId = null;

  function clone(value) {
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function toNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value !== "string") return 0;

    let normalized = value.trim();
    if (!normalized) return 0;

    normalized = normalized
      .replace(/\s+/g, "")
      .replace(/[€$£]/g, "")
      .replace(/['’]/g, "")
      .replace(/[^\d,.\-]/g, "");

    if (!normalized || normalized === "-" || normalized === "," || normalized === ".") {
      return 0;
    }

    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > -1 && lastDot > -1) {
      // 1.234,56 OR 1,234.56
      if (lastComma > lastDot) {
        normalized = normalized.replace(/\./g, "").replace(",", ".");
      } else {
        normalized = normalized.replace(/,/g, "");
      }
    } else if (lastComma > -1) {
      // 778,99
      normalized = normalized.replace(",", ".");
    } else if (lastDot > -1) {
      // Handle possible thousands dots: 1.234.567 -> 1234567
      const parts = normalized.split(".");
      if (parts.length > 2) {
        const decimals = parts.pop();
        normalized = `${parts.join("")}.${decimals}`;
      }
    }

    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function makeId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHTML(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function currency(value) {
    return currencyFormatter.format(toNumber(value));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : clone(DEFAULT_STATE);
    } catch {
      return clone(DEFAULT_STATE);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function normalizeState(raw) {
    const safe = raw && typeof raw === "object" ? raw : {};

    return {
      goals: Array.isArray(safe.goals)
        ? safe.goals.map((goal) => ({
            id: goal.id || makeId(),
            name: String(goal.name || "Goal"),
            targetAmount: Math.max(0, toNumber(goal.targetAmount)),
            savedAmount: Math.max(0, toNumber(goal.savedAmount))
          }))
        : [],
      incomes: Array.isArray(safe.incomes)
        ? safe.incomes.map((entry) => ({
            id: entry.id || makeId(),
            source: String(entry.source || "Income"),
            amount: Math.max(0, toNumber(entry.amount)),
            date: typeof entry.date === "string" ? entry.date : ""
          }))
        : [],
      expenses: Array.isArray(safe.expenses)
        ? safe.expenses.map((entry) => ({
            id: entry.id || makeId(),
            name: String(entry.name || "Expense"),
            category: String(entry.category || "Other"),
            amount: Math.max(0, toNumber(entry.amount)),
            date: typeof entry.date === "string" ? entry.date : ""
          }))
        : [],
      etf: {
        monthlyAmount: Math.max(
          0,
          toNumber(safe.etf?.monthlyAmount ?? DEFAULT_STATE.etf.monthlyAmount)
        ),
        years: Math.max(1, Math.round(toNumber(safe.etf?.years ?? DEFAULT_STATE.etf.years)))
      }
    };
  }

  function getState() {
    return clone(state);
  }

  function setState(nextState) {
    state = normalizeState(nextState);
    saveState();
    renderDashboard();
    emitState();
  }

  function updateState(mutator) {
    const draft = getState();
    mutator(draft);
    setState(draft);
  }

  function emitState() {
    document.dispatchEvent(new CustomEvent("budget:state-changed", { detail: getState() }));
  }

  function setupTabs() {
    const buttons = Array.from(document.querySelectorAll(".tab-btn"));
    const panels = Array.from(document.querySelectorAll(".tab-panel"));

    const activate = (tabName) => {
      buttons.forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.tab === tabName);
      });

      panels.forEach((panel) => {
        panel.classList.toggle("active", panel.id === `tab-${tabName}`);
      });
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => activate(button.dataset.tab || "dashboard"));
    });

    const initial = document.querySelector(".tab-btn.active")?.dataset.tab || "dashboard";
    activate(initial);
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    const next = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);

    const switchEl = document.getElementById("themeSwitch");
    if (switchEl) {
      switchEl.checked = next === "dark";
      switchEl.setAttribute("aria-checked", String(switchEl.checked));
    }

    const labelEl = document.getElementById("themeLabel");
    if (labelEl) {
      labelEl.textContent = next === "dark" ? "Dark" : "Light";
    }
  }

  function setupThemeSwitch() {
    applyTheme(getPreferredTheme());

    const switchEl = document.getElementById("themeSwitch");
    if (!switchEl) return;

    switchEl.addEventListener("change", () => {
      const next = switchEl.checked ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
    });
  }

  function renderDatePill() {
    const el = document.getElementById("todayDate");
    if (!el) return;

    const now = new Date();

    const datePart = now.toLocaleDateString(UI_LOCALE, {
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric"
    });

    const timePart = now.toLocaleTimeString(UI_LOCALE, {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });

    el.textContent = `${datePart} • ${timePart}`;
  }

  function startDateTimeClock() {
    renderDatePill();
    if (dateClockIntervalId) clearInterval(dateClockIntervalId);
    dateClockIntervalId = setInterval(renderDatePill, 1000);
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function getMonthKey(dateValue) {
    if (typeof dateValue !== "string") return "No date";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return "No date";
    return dateValue.slice(0, 7);
  }

  function formatMonthLabel(monthKey) {
    if (monthKey === "No date") return monthKey;
    const [year, month] = monthKey.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    if (Number.isNaN(date.getTime())) return monthKey;
    return date.toLocaleDateString(UI_LOCALE, { month: "short", year: "numeric" });
  }

  function renderMonthlyOverview(incomes, expenses) {
    const container = document.getElementById("monthlyOverview");
    if (!container) return;

    const byMonth = new Map();

    incomes.forEach((entry) => {
      const key = getMonthKey(entry.date);
      const row = byMonth.get(key) || { income: 0, expense: 0 };
      row.income += toNumber(entry.amount);
      byMonth.set(key, row);
    });

    expenses.forEach((entry) => {
      const key = getMonthKey(entry.date);
      const row = byMonth.get(key) || { income: 0, expense: 0 };
      row.expense += toNumber(entry.amount);
      byMonth.set(key, row);
    });

    if (!byMonth.size) {
      container.innerHTML = `<div class="empty-state">No monthly activity yet.</div>`;
      return;
    }

    const sorted = Array.from(byMonth.entries()).sort((a, b) => {
      if (a[0] === "No date") return 1;
      if (b[0] === "No date") return -1;
      return a[0] < b[0] ? 1 : -1;
    });

    container.innerHTML = sorted
      .map(([month, value]) => {
        const monthlySurplus = value.income - value.expense;
        return `
          <div class="list-item overview-row">
            <span>${escapeHTML(formatMonthLabel(month))}</span>
            <span>${currency(value.income)} income</span>
            <span>${currency(value.expense)} expenses</span>
            <strong class="${monthlySurplus >= 0 ? "positive" : "negative"}">${currency(
          monthlySurplus
        )}</strong>
          </div>
        `;
      })
      .join("");
  }

  function renderGoalSnapshot(goals) {
    const container = document.getElementById("goalSnapshot");
    if (!container) return;

    if (!goals.length) {
      container.innerHTML = `<div class="empty-state">No savings goals added yet.</div>`;
      return;
    }

    container.innerHTML = goals
      .map((goal) => {
        const target = Math.max(0, toNumber(goal.targetAmount));
        const saved = Math.max(0, toNumber(goal.savedAmount));
        const remaining = Math.max(0, target - saved);
        const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

        return `
          <article class="card">
            <div class="item-title">${escapeHTML(goal.name)}</div>
            <div class="progress-track">
              <span class="progress-fill" style="width:${percent.toFixed(2)}%"></span>
            </div>
            <div class="goal-meta">
              <span>${currency(saved)} saved</span>
              <span>${currency(remaining)} remaining</span>
              <span>${percent.toFixed(1)}%</span>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderDashboard() {
    const totalIncome = state.incomes.reduce((sum, entry) => sum + toNumber(entry.amount), 0);
    const totalExpenses = state.expenses.reduce((sum, entry) => sum + toNumber(entry.amount), 0);
    const surplus = totalIncome - totalExpenses;

    setText("sumIncome", currency(totalIncome));
    setText("sumExpenses", currency(totalExpenses));

    const surplusEl = document.getElementById("sumSurplus");
    if (surplusEl) {
      surplusEl.textContent = currency(surplus);
      surplusEl.classList.toggle("positive", surplus >= 0);
      surplusEl.classList.toggle("negative", surplus < 0);
    }

    renderMonthlyOverview(state.incomes, state.expenses);
    renderGoalSnapshot(state.goals);
  }

  window.BudgetApp = {
    getState,
    setState,
    updateState,
    currency,
    toNumber,
    makeId,
    escapeHTML
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupThemeSwitch();
    setupTabs();
    startDateTimeClock();
    renderDashboard();
    emitState();
  });

  window.addEventListener("beforeunload", () => {
    if (dateClockIntervalId) clearInterval(dateClockIntervalId);
  });
})();

// ...existing code...
function setState(nextState) {
  state = normalizeState(nextState);
  saveState();
  window.BudgetPersistence?.save(state);
  renderDashboard();
  emitState();
}
// ...existing code...

document.addEventListener("DOMContentLoaded", async () => {
  setupThemeSwitch();
  setupTabs();
  startDateTimeClock();

  const localEnv = window.BudgetPersistence?.load();
  if (localEnv?.data) {
    state = normalizeState(localEnv.data);
  }

  renderDashboard();
  emitState();

  // optional cloud sync (requires backend + auth token)
  const token = window.Auth?.getToken?.();
  if (token && window.BudgetSync) {
    const remoteEnv = await window.BudgetSync.pull(token);
    const merged = window.BudgetSync.merge(localEnv, remoteEnv);
    if (merged?.data) {
      setState(merged.data);
      await window.BudgetSync.push(token, merged);
    }
  }
});
// ...existing code...