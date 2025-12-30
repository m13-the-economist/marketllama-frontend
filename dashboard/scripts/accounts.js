// accounts.js — STABLE, SINGLE-INIT, PRODUCTION SAFE
(() => {
  'use strict';

  if (window.__ML_ACCOUNTS_READY__) return;
  window.__ML_ACCOUNTS_READY__ = true;

  /* =========================
     STATE
  ========================= */
  let currentTab = 'live';
  let balances = {
    live: { balance: 0, currency: 'USD' },
    demo: { balance: 0, currency: 'USD' }
  };
  let isTopBalanceHidden = false;

  /* =========================
     SAFE STARTUP
  ========================= */
  document.addEventListener('DOMContentLoaded', () => {
    waitForAuth();
  });

  function waitForAuth() {
    if (!window.MLAuth || typeof MLAuth.getToken !== 'function') {
      setTimeout(waitForAuth, 100);
      return;
    }

    if (!MLAuth.getToken()) {
      window.location.href = '../landing/signin.html';
      return;
    }

    init();
  }

  /* =========================
     INIT
  ========================= */
  function init() {
    const userNameEl = document.querySelector('.user-name');
    const topBalanceEl = document.getElementById('topBalance');
    const liveContainer = document.getElementById('liveAccounts');
    const demoContainer = document.getElementById('demoAccounts');
    const tabLive = document.getElementById('tabLive');
    const tabDemo = document.getElementById('tabDemo');
    const toggleTopBtn = document.getElementById('toggleBalance');
    const topEye = document.getElementById('topEye');

    if (!userNameEl || !topBalanceEl || !liveContainer || !demoContainer) {
      console.warn('Dashboard elements missing, retrying...');
      setTimeout(init, 300);
      return;
    }

    /* =========================
       USER
    ========================= */
    fetchUserProfile(userNameEl);

    /* =========================
       ACCOUNTS
    ========================= */
    fetchAccounts(liveContainer, demoContainer, topBalanceEl);

    /* =========================
       TABS
    ========================= */
    if (tabLive) {
      tabLive.addEventListener('click', () => {
        currentTab = 'live';
        renderTopBalance(topBalanceEl);
      });
    }

    if (tabDemo) {
      tabDemo.addEventListener('click', () => {
        currentTab = 'demo';
        renderTopBalance(topBalanceEl);
      });
    }

    /* =========================
       TOP BALANCE TOGGLE
    ========================= */
    if (toggleTopBtn) {
      toggleTopBtn.addEventListener('click', () => {
        isTopBalanceHidden = !isTopBalanceHidden;

        if (isTopBalanceHidden) {
          topBalanceEl.textContent = '•••• USD';
          if (topEye) topEye.setAttribute('icon', 'mdi:eye-off-outline');
        } else {
          renderTopBalance(topBalanceEl);
          if (topEye) topEye.setAttribute('icon', 'mdi:eye-outline');
        }
      });
    }
  }

  /* =========================
     FETCH USER
  ========================= */
  async function fetchUserProfile(userNameEl) {
    try {
      const user = await MLAuth.apiFetch('/api/auth/me');
      const name =
        user.username ||
        user.full_name ||
        user.email?.split('@')[0] ||
        'Trader';

      userNameEl.textContent = name;
    } catch (e) {
      console.error('User fetch failed', e);
      if (e.message === '401') MLAuth.logout();
    }
  }

  /* =========================
     FETCH ACCOUNTS
  ========================= */
  async function fetchAccounts(liveContainer, demoContainer, topBalanceEl) {
    try {
      const data = await MLAuth.apiFetch('/api/accounts/summary');
      const accounts = Array.isArray(data.accounts) ? data.accounts : [];

      liveContainer.innerHTML = '';
      demoContainer.innerHTML = '';

      balances.live.balance = 0;
      balances.demo.balance = 0;

      accounts.forEach(acc => {
        const isDemo = acc.is_demo === true;
        const amount = Number(acc.balance || 0);
        const currency = acc.currency || 'USD';

        if (isDemo) balances.demo.balance += amount;
        else balances.live.balance += amount;

        renderAccountCard({
          id: acc.account_id || acc.id,
          type: isDemo ? 'demo' : 'live',
          broker: acc.broker || 'Deriv',
          balance: amount,
          currency
        }, liveContainer, demoContainer);
      });

      // Fallback placeholders
      if (!liveContainer.children.length) {
        renderAccountCard({
          id: 'live-placeholder',
          type: 'live',
          broker: 'Deriv',
          balance: balances.live.balance,
          currency: 'USD'
        }, liveContainer, demoContainer);
      }

      if (!demoContainer.children.length) {
        renderAccountCard({
          id: 'demo-placeholder',
          type: 'demo',
          broker: 'Deriv',
          balance: balances.demo.balance,
          currency: 'USD'
        }, liveContainer, demoContainer);
      }

      if (!isTopBalanceHidden) {
        renderTopBalance(topBalanceEl);
      }
    } catch (e) {
      console.error('Accounts fetch failed', e);
    }
  }

  /* =========================
     RENDER CARD
  ========================= */
  function renderAccountCard(account, liveContainer, demoContainer) {
    const container = account.type === 'demo' ? demoContainer : liveContainer;
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'account-card';

    card.innerHTML = `
      <div class="card-head">
        <span class="chip ${account.type === 'demo' ? 'chip-demo' : 'chip-live'}">
          ${account.type === 'demo' ? 'Demo' : 'Live'}
        </span>
        <span class="chip chip-broker">${account.broker}</span>
      </div>

      <div class="card-body">
        <div class="big-amount balance-value">
          ${format(account.balance, account.currency)}
        </div>
        <button class="icon-btn sm balance-toggle" aria-label="Toggle balance">
          <iconify-icon class="ic" icon="mdi:eye-outline"></iconify-icon>
        </button>
      </div>

      <div class="line-art"></div>
    `;

    const btn = card.querySelector('.balance-toggle');
    const value = card.querySelector('.balance-value');
    const icon = card.querySelector('iconify-icon');

    let hidden = false;

    btn.addEventListener('click', () => {
      hidden = !hidden;
      if (hidden) {
        value.textContent = '•••• ' + account.currency;
        icon.setAttribute('icon', 'mdi:eye-off-outline');
      } else {
        value.textContent = format(account.balance, account.currency);
        icon.setAttribute('icon', 'mdi:eye-outline');
      }
    });

    container.appendChild(card);
  }

  /* =========================
     TOP BALANCE
  ========================= */
  function renderTopBalance(el) {
    const active = currentTab === 'demo' ? balances.demo : balances.live;
    el.textContent = format(active.balance, active.currency);
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
})();