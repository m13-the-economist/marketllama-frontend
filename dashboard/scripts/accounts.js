// accounts.js — summary-safe + multi-account ready
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
  const liveContainer = document.getElementById('liveAccounts');
  const demoContainer = document.getElementById('demoAccounts');

  const toggleBalanceBtn = document.getElementById('toggleBalance');

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
     USER
  ======================= */
  async function fetchUserProfile() {
    try {
      const user = await MLAuth.apiFetch('/api/auth/me');
      const name =
        user.username ||
        user.full_name ||
        (user.email ? user.email.split('@')[0] : 'Trader');
      userNameEl.textContent = name;
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

      balances.live.balance = Number(data.live_balance || 0);
      balances.demo.balance = Number(data.demo_balance || 0);
      balances.live.currency = data.currency || 'USD';
      balances.demo.currency = data.currency || 'USD';

      liveContainer.innerHTML = '';
      demoContainer.innerHTML = '';

      if (Array.isArray(data.accounts) && data.accounts.length) {
        // ✅ REAL MULTI-ACCOUNT MODE
        data.accounts.forEach(renderAccountCard);
      } else {
        // ✅ FALLBACK: SUMMARY MODE (ONE CARD PER TYPE)
        renderAccountCard({
          id: 'live-summary',
          type: 'live',
          broker: 'Deriv',
          balance: balances.live.balance,
          currency: balances.live.currency
        });

        renderAccountCard({
          id: 'demo-summary',
          type: 'demo',
          broker: 'Deriv',
          balance: balances.demo.balance,
          currency: balances.demo.currency
        });
      }

      renderTopBalance();
    } catch (err) {
      console.error('Account fetch failed', err);
      renderTopBalance();
    }
  }

  /* =======================
     CARD RENDERER
  ======================= */
  function renderAccountCard(account) {
    const container =
      account.type === 'live' ? liveContainer : demoContainer;
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'account-card';

    const chipClass =
      account.type === 'live' ? 'chip-live' : 'chip-demo';

    const formatted = format(account.balance, account.currency);

    card.innerHTML = `
      <div class="card-head">
        <span class="chip ${chipClass}">
          ${account.type === 'live' ? 'Live' : 'Demo'}
        </span>
        <span class="chip chip-broker">${account.broker || 'Broker'}</span>
      </div>

      <div class="card-body">
        <div class="big-amount balance-value">${formatted}</div>
        <button class="icon-btn sm balance-toggle">
          <iconify-icon class="ic eye-icon" icon="mdi:eye-outline"></iconify-icon>
        </button>
      </div>

      <div class="line-art"></div>
    `;

    const valueEl = card.querySelector('.balance-value');
    const eyeIcon = card.querySelector('.eye-icon');

    let hidden = false;
    card.querySelector('.balance-toggle').addEventListener('click', e => {
      e.stopPropagation();
      hidden = !hidden;
      valueEl.textContent = hidden ? '••••••' : formatted;
      eyeIcon.setAttribute(
        'icon',
        hidden ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
      );
    });

    container.appendChild(card);
  }

  /* =======================
     RENDER TOP BALANCE
  ======================= */
  function renderTopBalance() {
    const active = currentTab === 'live' ? balances.live : balances.demo;
    topBalanceEl.textContent = balanceHidden
      ? '••••••'
      : format(active.balance, active.currency);
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
     EVENTS
  ======================= */
  toggleBalanceBtn?.addEventListener('click', () => {
    balanceHidden = !balanceHidden;
    renderTopBalance();
  });

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