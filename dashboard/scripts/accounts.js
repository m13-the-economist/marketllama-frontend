// accounts.js — aligned with /api/accounts/summary
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

  /* =======================
     STATE
  ======================= */
  let balanceHidden = false;
  let currentTab = 'live';

  let balances = {
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

      userNameEl && (userNameEl.textContent = name);
    } catch {
      MLAuth.logout();
    }
  }

  /* =======================
     ACCOUNTS (CORRECT ENDPOINT)
  ======================= */
  async function fetchAccounts() {
    try {
      const data = await MLAuth.apiFetch('/api/accounts/summary');

      balances.live.balance = data.live_balance || 0;
      balances.demo.balance = data.demo_balance || 0;

      renderBalances();
    } catch (err) {
      console.error('Account summary fetch failed:', err);
      renderBalances();
    }
  }

  /* =======================
     RENDERING
  ======================= */
  function format(amount, currency) {
    return (
      Number(amount).toLocaleString(undefined, {
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

    const active =
      currentTab === 'live' ? balances.live : balances.demo;

    topBalanceEl &&
      (topBalanceEl.textContent = format(active.balance, active.currency));

    liveAmountEl &&
      (liveAmountEl.textContent = format(
        balances.live.balance,
        balances.live.currency
      ));

    demoAmountEl &&
      (demoAmountEl.textContent = format(
        balances.demo.balance,
        balances.demo.currency
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

  /* =======================
     INIT
  ======================= */
  fetchUserProfile();
  fetchAccounts();
})();a