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

  const liveCard = document.querySelector(
    '.account-card[data-account-type="live"]'
  );

  const toggleEls = [
    document.getElementById('toggleBalance'),
    document.getElementById('cardBalanceToggle'),
    document.getElementById('cardBalanceToggleDemo')
  ];

  // Add Account modal
  const addAccountBtn = document.getElementById('addAccountBtn');
  const addAccountModal = document.getElementById('addAccountModal');
  const closeAddAccount = document.getElementById('closeAddAccount');
  const connectDerivModalBtn = document.getElementById(
    'connectDerivModalBtn'
  );

  /* =======================
     STATE
  ======================= */
  let balanceHidden = false;
  let currentTab = 'live';

  let accounts = {
    live: null,
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

      const live = data.find(a => a.type === 'live');
      const demo = data.find(a => a.type === 'demo');

      if (live) {
        accounts.live = live;
        revealLiveAccount();
      }

      if (demo) {
        accounts.demo = demo;
      }

      renderBalances();
    } catch (err) {
      console.error('Accounts fetch failed:', err);
      renderBalances();
    }
  }

  function revealLiveAccount() {
    if (liveCard) {
      liveCard.hidden = false;
    }
  }

  /* =======================
     DERIV CONNECT (MODAL ONLY)
  ======================= */
  async function connectDeriv() {
    try {
      const res = await fetch('/api/deriv/oauth/url', {
        credentials: 'include'
      });

      if (!res.ok) throw new Error('OAuth URL fetch failed');

      const { url } = await res.json();
      if (!url) throw new Error('Invalid OAuth response');

      window.location.href = url;
    } catch (err) {
      console.error('Deriv connect failed:', err);
      alert('Unable to connect Deriv. Please try again.');
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

    const active =
      currentTab === 'live' && accounts.live
        ? accounts.live
        : accounts.demo;

    topBalanceEl &&
      (topBalanceEl.textContent = format(active.balance, active.currency));

    if (accounts.live) {
      liveAmountEl &&
        (liveAmountEl.textContent = format(
          accounts.live.balance,
          accounts.live.currency
        ));
    }

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

  // Add Account modal controls
  addAccountBtn?.addEventListener('click', () => {
    addAccountModal.hidden = false;
  });

  closeAddAccount?.addEventListener('click', () => {
    addAccountModal.hidden = true;
  });

  connectDerivModalBtn?.addEventListener('click', connectDeriv);

  /* =======================
     INIT
  ======================= */
  fetchUserProfile();
  fetchAccounts();
})();