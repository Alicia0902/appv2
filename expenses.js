(() => {
  const form = document.getElementById("expenseForm");
  const list = document.getElementById("expenseList");
  const dateInput = document.getElementById("expenseDate");
  if (!form || !list || !window.BudgetApp) return;

  const { updateState, getState, makeId, toNumber, currency, escapeHTML } = window.BudgetApp;

  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  function formatDate(dateValue) {
    if (!dateValue) return "No date";
    const parsed = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dateValue;
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = (document.getElementById("expenseName")?.value || "").trim();
    const category = (document.getElementById("expenseCategory")?.value || "Other").trim();
    const amount = Math.max(0, toNumber(document.getElementById("expenseAmount")?.value));
    const date = document.getElementById("expenseDate")?.value || "";

    if (!name || amount <= 0 || !date) return;

    updateState((draft) => {
      draft.expenses.unshift({
        id: makeId(),
        name,
        category,
        amount,
        date
      });
    });

    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".js-delete-expense");
    if (!button) return;

    const entryId = button.dataset.id;
    if (!entryId) return;

    updateState((draft) => {
      draft.expenses = draft.expenses.filter((entry) => entry.id !== entryId);
    });
  });

  function renderExpenses() {
    const { expenses } = getState();

    if (!expenses.length) {
      list.innerHTML = `<div class="empty-state">No expense entries yet.</div>`;
      return;
    }

    const sorted = [...expenses].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    list.innerHTML = sorted
      .map((entry) => {
        const subtitle = `${entry.category} • ${formatDate(entry.date)}`;
        return `
          <article class="list-item">
            <div>
              <div class="item-title">${escapeHTML(entry.name)}</div>
              <div class="item-subtitle">${escapeHTML(subtitle)}</div>
            </div>
            <div class="amount negative">${currency(entry.amount)}</div>
            <button type="button" class="btn-icon js-delete-expense" data-id="${escapeHTML(
              entry.id
            )}">Delete</button>
          </article>
        `;
      })
      .join("");
  }

  document.addEventListener("budget:state-changed", renderExpenses);
  renderExpenses();
})();