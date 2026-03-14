(() => {
  const form = document.getElementById("etfForm");
  const monthlyInput = document.getElementById("etfMonthly");
  const yearsInput = document.getElementById("etfYears");

  const totalInvestedEl = document.getElementById("etfTotalInvested");
  const expectedEl = document.getElementById("etfExpected");
  const optimisticEl = document.getElementById("etfOptimistic");
  const pessimisticEl = document.getElementById("etfPessimistic");

  if (
    !form ||
    !monthlyInput ||
    !yearsInput ||
    !totalInvestedEl ||
    !expectedEl ||
    !optimisticEl ||
    !pessimisticEl ||
    !window.BudgetApp
  ) {
    return;
  }

  const { getState, updateState, toNumber, currency } = window.BudgetApp;

  function amountToInput(value) {
    const n = Math.max(0, toNumber(value));
    return n.toFixed(2).replace(".", ",");
  }

  function futureValue(monthlyAmount, years, annualRate) {
    const months = Math.max(0, Math.round(years * 12));
    if (months === 0 || monthlyAmount <= 0) return 0;

    const monthlyRate = annualRate / 12;
    if (monthlyRate === 0) return monthlyAmount * months;

    return monthlyAmount * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  function readInputs() {
    const monthly = Math.max(0, toNumber(monthlyInput.value));
    const years = Math.max(1, Math.round(toNumber(yearsInput.value || 1)));
    return { monthly, years };
  }

  function renderProjection(monthly, years) {
    const months = Math.max(0, Math.round(years * 12));
    const totalInvested = monthly * months;

    totalInvestedEl.textContent = currency(totalInvested);
    expectedEl.textContent = currency(futureValue(monthly, years, 0.07));
    optimisticEl.textContent = currency(futureValue(monthly, years, 0.10));
    pessimisticEl.textContent = currency(futureValue(monthly, years, 0.04));
  }

  function syncFromState() {
    const { etf } = getState();
    monthlyInput.value = amountToInput(etf.monthlyAmount ?? 0);
    yearsInput.value = String(etf.years ?? 10);

    const { monthly, years } = readInputs();
    renderProjection(monthly, years);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const { monthly, years } = readInputs();

    updateState((draft) => {
      draft.etf.monthlyAmount = monthly;
      draft.etf.years = years;
    });

    renderProjection(monthly, years);
  });

  monthlyInput.addEventListener("input", () => {
    const { monthly, years } = readInputs();
    renderProjection(monthly, years);
  });

  yearsInput.addEventListener("input", () => {
    const { monthly, years } = readInputs();
    renderProjection(monthly, years);
  });

  document.addEventListener("budget:state-changed", () => {
    const active = document.activeElement;
    if (active !== monthlyInput && active !== yearsInput) {
      const { etf } = getState();
      monthlyInput.value = amountToInput(etf.monthlyAmount ?? 0);
      yearsInput.value = String(etf.years ?? 10);
    }

    const { monthly, years } = readInputs();
    renderProjection(monthly, years);
  });

  syncFromState();
})();