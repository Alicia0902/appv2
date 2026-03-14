(() => {
  const API_URL = "/api/state";

  async function pull(token) {
    const res = await fetch(API_URL, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return res.json(); // { version, updatedAt, data }
  }

  async function push(token, envelope) {
    await fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(envelope)
    });
  }

  function merge(localEnv, remoteEnv) {
    if (!localEnv) return remoteEnv || null;
    if (!remoteEnv) return localEnv;
    const l = new Date(localEnv.updatedAt).getTime() || 0;
    const r = new Date(remoteEnv.updatedAt).getTime() || 0;
    return r > l ? remoteEnv : localEnv;
  }

  window.BudgetSync = { pull, push, merge };
})();