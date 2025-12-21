// accounts.js — Production-ready, backend-connected
(() => {
    'use strict';
  
    /* =======================
       CONFIG
    ======================= */
    const API_BASE =
      window.ML_CONFIG?.API_BASE_URL ||
      (location.hostname.includes('marketllama.com')
        ? 'https://marketllama.com'
        : 'http://127.0.0.1:8000');
  
    const token = localStorage.getItem('ml_access_token');
  
    if (!token) {
      window.location.href = '../landing/signin.html';
      return;
    }
  
    /* =======================
       DOM
    ======================= */
    const userNameEl = document.querySelector('.user-name');
    const topBalanceEl = document.getElementById('topBalance');
    const liveAmountEl = document.getElementById('liveAmount');
    const demoAmountEl = document.getElementById('demoAmount');
  
    const toggleEls = [
      document.getElementById('toggleBalance'),
      document.getElementById('cardBalanceToggle'),
      document.getElementById('cardBalanceToggleDemo')
    ];
  
    /* =======================
       STATE
    ======================= */
    let balanceHidden = false;
    let currentTab = 'live';
    let accounts = {
      live: { balance: 0, currency: 'USD' },
      demo: { balance: 0, currency: 'USD' }
    };
  
    /* =======================
       API HELPER
    ======================= */
    async function apiFetch(path) {
      const res = await fetch(`${API_BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
  
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    }
  
    /* =======================
       USER PROFILE
    ======================= */
    async function fetchUserProfile() {
      try {
        const user = await apiFetch('/api/auth/me');
  
        const name =
          user.username ||
          user.full_name ||
          (user.email ? user.email.split('@')[0] : null) ||
          'Trader';
  
        if (userNameEl) userNameEl.textContent = name;
      } catch (err) {
        console.error('Auth failed:', err);
        localStorage.removeItem('ml_access_token');
        window.location.href = '../landing/signin.html';
      }
    }
  
    /* =======================
       ACCOUNTS
    ======================= */
    async function fetchAccounts() {
      try {
        const data = await apiFetch('/api/accounts');
  
        const live = data.find(a => a.type === 'live');
        const demo = data.find(a => a.type === 'demo');
  
        accounts.live = live || accounts.live;
        accounts.demo = demo || accounts.demo;
  
        renderBalances();
      } catch (err) {
        console.error('Accounts fetch failed:', err);
        renderBalances();
      }
    }
  
    /* =======================
       RENDERING
    ======================= */
    function format(amount, currency) {
      return (
        Number(amount || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) +
        ' ' +
        currency
      );
    }
  
    function renderBalances() {
      const MASK = '••••••';
  
      if (balanceHidden) {
        if (topBalanceEl) topBalanceEl.textContent = MASK;
        if (liveAmountEl) liveAmountEl.textContent = MASK;
        if (demoAmountEl) demoAmountEl.textContent = MASK;
        return;
      }
  
      const active =
        currentTab === 'live' ? accounts.live : accounts.demo;
  
      if (topBalanceEl) {
        topBalanceEl.textContent = format(
          active.balance,
          active.currency
        );
      }
  
      if (liveAmountEl) {
        liveAmountEl.textContent = format(
          accounts.live.balance,
          accounts.live.currency
        );
      }
  
      if (demoAmountEl) {
        demoAmountEl.textContent = format(
          accounts.demo.balance,
          accounts.demo.currency
        );
      }
    }
  
    /* =======================
       TOGGLES
    ======================= */
    toggleEls.forEach(el =>
      el?.addEventListener('click', () => {
        balanceHidden = !balanceHidden;
        renderBalances();
      })
    );
  
    document
      .getElementById('tabLive')
      ?.addEventListener('click', () => {
        currentTab = 'live';
        renderBalances();
      });
  
    document
      .getElementById('tabDemo')
      ?.addEventListener('click', () => {
        currentTab = 'demo';
        renderBalances();
      });
  
    /* =======================
       INIT
    ======================= */
    fetchUserProfile();
    fetchAccounts();
  })();