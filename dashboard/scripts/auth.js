// auth.js — single source of truth for auth
(() => {
  'use strict';

  const API_BASE =
    window.ML_CONFIG?.API_BASE_URL ||
    (location.hostname.includes('marketllama.com')
      ? 'https://marketllama.com'
      : 'http://127.0.0.1:8000');

  const TOKEN_KEY = 'ml_access_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = '../landing/signin.html';
  }

  async function apiFetch(path, options = {}) {
    const token = getToken();
    if (!token) logout();

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 401) logout();
    if (!res.ok) throw new Error(res.status);

    return res.json();
  }

  window.MLAuth = Object.freeze({
    getToken,
    logout,
    apiFetch
  });
})();