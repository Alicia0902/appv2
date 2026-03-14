(() => {
  const form = document.getElementById("goalForm");
  const list = document.getElementById("goalsList");
  if (!form || !list || !window.BudgetApp) return;

  const { updateState, getState, makeId, toNumber, currency, escapeHTML } = window.BudgetApp;

  function amountToInput(value) {
    const n = Math.max(0, toNumber(value));
    return n.toFixed(2).replace(".", ",");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = (document.getElementById("goalName")?.value || "").trim();
    const targetAmount = Math.max(0, toNumber(document.getElementById("goalTarget")?.value));
    const savedAmount = Math.max(0, toNumber(document.getElementById("goalSaved")?.value));

    if (!name || targetAmount <= 0) return;

    updateState((draft) => {
      draft.goals.unshift({
        id: makeId(),
        name,
        targetAmount,
        savedAmount
      });
    });

    form.reset();
  });

  list.addEventListener("click", (event) => {
    const card = event.target.closest("[data-goal-id]");
    if (!card) return;

    const goalId = card.dataset.goalId;
    if (!goalId) return;

    if (event.target.closest(".js-delete-goal")) {
      updateState((draft) => {
        draft.goals = draft.goals.filter((goal) => goal.id !== goalId);
      });
      return;
    }

    if (event.target.closest(".js-update-goal")) {
      const nextName = (card.querySelector(".js-goal-name")?.value || "").trim();
      const nextTarget = Math.max(0, toNumber(card.querySelector(".js-goal-target")?.value));
      const nextSaved = Math.max(0, toNumber(card.querySelector(".js-goal-saved")?.value));

      if (!nextName || nextTarget <= 0) return;

      updateState((draft) => {
        const goal = draft.goals.find((item) => item.id === goalId);
        if (!goal) return;

        goal.name = nextName;
        goal.targetAmount = nextTarget;
        goal.savedAmount = nextSaved;
      });
    }
  });

  function renderGoals() {
    const { goals } = getState();

    if (!goals.length) {
      list.innerHTML = `<div class="empty-state">Add a goal to start tracking progress.</div>`;
      return;
    }

    list.innerHTML = goals
      .map((goal) => {
        const target = Math.max(0, toNumber(goal.targetAmount));
        const saved = Math.max(0, toNumber(goal.savedAmount));
        const remaining = Math.max(0, target - saved);
        const percent = target > 0 ? Math.min(100, (saved / target) * 100) : 0;

        return `
          <article class="card goal-card" data-goal-id="${escapeHTML(goal.id)}">
            <div class="goal-grid">
              <label class="form-field">
                <span>Name</span>
                <input class="js-goal-name" value="${escapeHTML(goal.name)}" />
              </label>

              <label class="form-field">
                <span>Target amount (€)</span>
                <input class="js-goal-target" type="text" inputmode="decimal" value="${escapeHTML(
                  amountToInput(target)
                )}" />
              </label>

              <label class="form-field">
                <span>Saved so far (€)</span>
                <input class="js-goal-saved" type="text" inputmode="decimal" value="${escapeHTML(
                  amountToInput(saved)
                )}" />
              </label>
            </div>

            <div class="progress-track">
              <span class="progress-fill" style="width:${percent.toFixed(2)}%"></span>
            </div>

            <div class="goal-meta">
              <span>${currency(saved)} saved</span>
              <span>${currency(remaining)} remaining</span>
              <span>${percent.toFixed(1)}%</span>
            </div>

            <div class="actions">
              <button type="button" class="btn-secondary js-update-goal">Update</button>
              <button type="button" class="btn-danger js-delete-goal">Delete</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  document.addEventListener("budget:state-changed", renderGoals);
  renderGoals();
})();