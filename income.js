(() => {
  const form = document.getElementById("incomeForm");
  const list = document.getElementById("incomeList");
  const dateInput = document.getElementById("incomeDate");
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

    const source = (document.getElementById("incomeSource")?.value || "").trim();
    const amount = Math.max(0, toNumber(document.getElementById("incomeAmount")?.value));
    const date = document.getElementById("incomeDate")?.value || "";

    if (!source || amount <= 0 || !date) return;

    updateState((draft) => {
      draft.incomes.unshift({
        id: makeId(),
        source,
        amount,
        date
      });
    });

    form.reset();
    if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest(".js-delete-income");
    if (!button) return;

    const entryId = button.dataset.id;
    if (!entryId) return;

    updateState((draft) => {
      draft.incomes = draft.incomes.filter((entry) => entry.id !== entryId);
    });
  });

  function renderIncome() {
    const { incomes } = getState();

    if (!incomes.length) {
      list.innerHTML = `<div class="empty-state">No income entries yet.</div>`;
      return;
    }

    const sorted = [...incomes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

    list.innerHTML = sorted
      .map((entry) => {
        return `
          <article class="list-item">
            <div>
              <div class="item-title">${escapeHTML(entry.source)}</div>
              <div class="item-subtitle">${escapeHTML(formatDate(entry.date))}</div>
            </div>
            <div class="amount positive">${currency(entry.amount)}</div>
            <button type="button" class="btn-icon js-delete-income" data-id="${escapeHTML(
              entry.id
            )}">Delete</button>
          </article>
        `;
      })
      .join("");
  }

  document.addEventListener("budget:state-changed", renderIncome);
  renderIncome();
})();