// accounts.js — Production-ready, hardened
(() => {
  'use strict';

  /* =======================
     AUTH GATE
  ======================= */
  if (!window.MLAuth || !MLAuth.getToken()) {
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

  // Optional Deriv connect button
  const connectDerivBtn = document.getElementById('connectDerivBtn');

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
     USER PROFILE
  ======================= */
  async function fetchUserProfile() {
    try {
      const user = await MLAuth.apiFetch('/api/auth/me');

      const name =
        user.username ||
        user.full_name ||
        (user.email ? user.email.split('@')[0] : 'Trader');

      if (userNameEl) userNameEl.textContent = name;

      // Ensure user_id is available for Deriv callback
      if (user.id) {
        localStorage.setItem('ml_user_id', String(user.id));
      }
    } catch {
      MLAuth.logout();
    }
  }

  /* =======================
     ACCOUNTS
  ======================= */
  async function fetchAccounts() {
    try {
      const data = await MLAuth.apiFetch('/api/accounts');

      accounts.live = data.find(a => a.type === 'live') || accounts.live;
      accounts.demo = data.find(a => a.type === 'demo') || accounts.demo;

      renderBalances();
    } catch (err) {
      console.error('Accounts fetch failed:', err);
      renderBalances();
    }
  }

  /* =======================
     DERIV CONNECT
  ======================= */
  async function connectDeriv() {
    try {
      const res = await fetch('https://marketllama.com/api/deriv/oauth/url', {
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('Failed to get Deriv OAuth URL');
      }

      const data = await res.json();
      if (!data.url) {
        throw new Error('Invalid OAuth response');
      }

      // Redirect user to Deriv OAuth
      window.location.href = data.url;
    } catch (err) {
      console.error('Deriv connect failed:', err);
      alert('Unable to start Deriv connection. Please try again.');
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
      topBalanceEl && (topBalanceEl.textContent = MASK);
      liveAmountEl && (liveAmountEl.textContent = MASK);
      demoAmountEl && (demoAmountEl.textContent = MASK);
      return;
    }

    const active = currentTab === 'live' ? accounts.live : accounts.demo;

    topBalanceEl &&
      (topBalanceEl.textContent = format(active.balance, active.currency));

    liveAmountEl &&
      (liveAmountEl.textContent = format(
        accounts.live.balance,
        accounts.live.currency
      ));

    demoAmountEl &&
      (demoAmountEl.textContent = format(
        accounts.demo.balance,
        accounts.demo.currency
      ));
  }

  /* =======================
     UI EVENTS
  ======================= */
  toggleEls.forEach(el =>
    el?.addEventListener('click', () => {
      balanceHidden = !balanceHidden;
      renderBalances();
    })
  );

  document.getElementById('tabLive')?.addEventListener('click', () => {
    currentTab = 'live';
    renderBalances();
  });

  document.getElementById('tabDemo')?.addEventListener('click', () => {
    currentTab = 'demo';
    renderBalances();
  });

  // Deriv connect button (if present)
  connectDerivBtn?.addEventListener('click', connectDeriv);

  /* =======================
     INIT
  ======================= */
  fetchUserProfile();
  fetchAccounts();
})();