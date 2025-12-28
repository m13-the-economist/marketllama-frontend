// accounts.js — FINAL, CONTRACT-SAFE
(() => {
  'use strict';

  /* =======================
     AUTH
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
  const liveContainer = document.getElementById('liveAccounts');
  const demoContainer = document.getElementById('demoAccounts');

  /* =======================
     STATE
  ======================= */
  let currentTab = 'live';
  let balances = {
    live: { balance: 0, currency: 'USD' },
    demo: { balance: 0, currency: 'USD' }
  };

  /* =======================
     USER
  ======================= */
  async function fetchUserProfile() {
    try {
      const user = await MLAuth.apiFetch('/api/auth/me');
      userNameEl.textContent =
        user.username ||
        user.full_name ||
        user.email?.split('@')[0] ||
        'Trader';
    } catch {
      MLAuth.logout();
    }
  }

  /* =======================
     ACCOUNTS
  ======================= */
  async function fetchAccounts() {
    try {
      const data = await MLAuth.apiFetch('/api/accounts/summary');

      liveContainer.innerHTML = '';
      demoContainer.innerHTML = '';

      balances.live.balance = Number(data.live_balance || 0);
      balances.demo.balance = Number(data.demo_balance || 0);
      balances.live.currency = 'USD';
      balances.demo.currency = 'USD';

      const accounts = Array.isArray(data.accounts) ? data.accounts : [];

      accounts.forEach(acc => {
        const isDemo =
          acc.is_demo === true ||
          acc.mode === 'demo' ||
          acc.account_type === 'demo';

        renderAccountCard({
          id: acc.id,
          type: isDemo ? 'demo' : 'live',
          broker: acc.broker || 'Deriv',
          balance: Number(acc.balance || 0),
          currency: acc.currency || 'USD'
        });
      });

      // ALWAYS show placeholder if empty
      if (!demoContainer.children.length) {
        renderAccountCard({
          id: 'demo-empty',
          type: 'demo',
          broker: 'Deriv',
          balance: balances.demo.balance,
          currency: 'USD'
        });
      }

      if (!liveContainer.children.length) {
        renderAccountCard({
          id: 'live-empty',
          type: 'live',
          broker: 'Deriv',
          balance: balances.live.balance,
          currency: 'USD'
        });
      }

      renderTopBalance();
    } catch (err) {
      console.error('Accounts fetch failed', err);
      renderTopBalance();
    }
  }

  /* =======================
     CARD
  ======================= */
  function renderAccountCard(account) {
    const container =
      account.type === 'demo' ? demoContainer : liveContainer;

    const card = document.createElement('div');
    card.className = 'account-card';

    card.innerHTML = `
      <div class="card-head">
        <span class="chip ${
          account.type === 'demo' ? 'chip-demo' : 'chip-live'
        }">
          ${account.type === 'demo' ? 'Demo' : 'Live'}
        </span>
        <span class="chip chip-broker">${account.broker}</span>
      </div>

      <div class="card-body">
        <div class="big-amount balance-value">
          ${format(account.balance, account.currency)}
        </div>
        <button class="icon-btn sm balance-toggle">
          <iconify-icon class="ic eye-icon" icon="mdi:eye-outline"></iconify-icon>
        </button>
      </div>

      <div class="line-art"></div>
    `;

    container.appendChild(card);
  }

  /* =======================
     TOP BALANCE
  ======================= */
  function renderTopBalance() {
    const active =
      currentTab === 'demo' ? balances.demo : balances.live;

    topBalanceEl.textContent = format(
      active.balance,
      active.currency
    );
  }

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

  /* =======================
     TABS
  ======================= */
  document.getElementById('tabLive')?.addEventListener('click', () => {
    currentTab = 'live';
    renderTopBalance();
  });

  document.getElementById('tabDemo')?.addEventListener('click', () => {
    currentTab = 'demo';
    renderTopBalance();
  });

  /* =======================
     INIT
  ======================= */
  fetchUserProfile();
  fetchAccounts();
})();