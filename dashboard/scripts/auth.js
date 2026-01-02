// auth.js — CORE AUTH SERVICE (PRODUCTION SAFE)
(() => {
  'use strict';

  if (window.MLAuth) return; // idempotent

  const API_BASE =
    window.ML_CONFIG?.API_BASE_URL ||
    (location.hostname.includes('marketllama.com')
      ? 'https://marketllama.com'
      : 'http://127.0.0.1:8000');

  const TOKEN_KEY = 'ml_access_token';

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function isAuthenticated() {
    return !!getToken();
  }

  function logout(redirect = true) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('ml_user');
    if (redirect) {
      window.location.href = '../landing/signin.html';
    }
  }

  async function apiFetch(path, options = {}) {
    const token = getToken();
    if (!token) throw new Error('UNAUTHENTICATED');

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (res.status === 401) {
      logout();
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new Error(`HTTP_${res.status}`);
    }

    return res.json();
  }

  window.MLAuth = Object.freeze({
    getToken,
    isAuthenticated,
    logout,
    apiFetch
  });
})();