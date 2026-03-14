(() => {
  const KEY = "budget-flow.state.v1";
  const VERSION = 1;

  function parse(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save(data) {
    const envelope = {
      version: VERSION,
      updatedAt: new Date().toISOString(),
      data
    };
    try {
      localStorage.setItem(KEY, JSON.stringify(envelope));
      return envelope;
    } catch {
      return null;
    }
  }

  function load() {
    const env = parse(localStorage.getItem(KEY));
    if (!env || env.version !== VERSION) return null;
    return env;
  }

  window.BudgetPersistence = { save, load };
})();