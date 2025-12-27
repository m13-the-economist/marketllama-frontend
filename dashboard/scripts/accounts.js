// accounts.js — aligned EXACTLY with /api/accounts/summary
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

  const balances = {
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
    } catch {
      MLAuth.logout();
    }
  }

  /* =======================
     FETCH ACCOUNTS
  ======================= */
  async function fetchAccounts() {
    try {
      const data = await MLAuth.apiFetch('/api/accounts/summary');

      balances.live.balance = data.live_balance || 0;
      balances.demo.balance = data.demo_balance || 0;

      if (liveContainer) liveContainer.innerHTML = '';
      if (demoContainer) demoContainer.innerHTML = '';

      if (Array.isArray(data.accounts)) {
        renderAccountCards(data.accounts);
      }

      renderTopBalance();
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
      renderTopBalance();
    }
  }

  /* =======================
     RENDER ACCOUNT CARDS
  ======================= */
  function renderAccountCards(accounts) {
    accounts.forEach(account => {
      const isDemo = !!account.is_demo;
      const container = isDemo ? demoContainer : liveContainer;
      if (!container) return;

      const card = createAccountCard(account, isDemo);
      container.appendChild(card);
    });
  }

  /* =======================
     CREATE ACCOUNT CARD
  ======================= */
  function createAccountCard(account, isDemo) {
    const card = document.createElement('div');
    card.className = 'account-card';
    card.dataset.accountId = account.account_id;

    const typeText = isDemo ? 'Demo' : 'Live';
    const typeChipClass = isDemo ? 'chip-demo' : 'chip-live';

    const formattedBalance = format(
      account.balance || 0,
      account.currency || 'USD'
    );

    card.innerHTML = `
      <div class="card-head">
        <span class="chip ${typeChipClass}">${typeText}</span>
        <span class="chip chip-broker">Deriv</span>
      </div>

      <div class="card-body">
        <div class="big-amount balance-value">${formattedBalance}</div>

        <div class="card-actions">
          <button class="icon-btn sm balance-toggle" aria-label="Toggle balance">
            <iconify-icon
              class="eye-icon"
              icon="mdi:eye-outline">
            </iconify-icon>
          </button>
        </div>
      </div>

      <div class="line-art" aria-hidden="true"></div>
    `;

    // Per-card eye toggle
    const eyeBtn = card.querySelector('.balance-toggle');
    const balanceEl = card.querySelector('.balance-value');
    const eyeIcon = card.querySelector('.eye-icon');

    let hidden = false;

    eyeBtn.addEventListener('click', e => {
      e.stopPropagation();
      hidden = !hidden;

      if (hidden) {
        balanceEl.textContent = '••••••';
        eyeIcon.setAttribute('icon', 'mdi:eye-off-outline');
      } else {
        balanceEl.textContent = formattedBalance;
        eyeIcon.setAttribute('icon', 'mdi:eye-outline');
      }
    });

    return card;
  }

  /* =======================
     TOP BALANCE
  ======================= */
  function renderTopBalance() {
    if (!topBalanceEl) return;

    if (balanceHidden) {
      topBalanceEl.textContent = '••••••';
      return;
    }

    const active =
      currentTab === 'live' ? balances.live : balances.demo;

    topBalanceEl.textContent = format(
      active.balance,
      active.currency
    );
  }

  /* =======================
     HELPERS
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