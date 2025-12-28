// accounts.js — FINAL, HTML-matched, production-safe
(() => {
  'use strict';

  /* =======================
     AUTH GATE
  ======================= */
  const token = localStorage.getItem('ml_access_token');
  if (!token) {
    window.location.href = '../landing/signin.html';
    return;
  }

  const API_BASE =
    location.hostname.includes('marketllama.com')
      ? 'https://marketllama.com'
      : 'http://127.0.0.1:8000';

  async function apiFetch(path) {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (!res.ok) throw new Error(res.status);
    return res.json();
  }

  /* =======================
     DOM
  ======================= */
  const userNameEl = document.querySelector('.user-name');
  const topBalanceEl = document.getElementById('topBalance');

  const liveContainer = document.getElementById('liveAccounts');
  const demoContainer = document.getElementById('demoAccounts');

  const tabLive = document.getElementById('tabLive');
  const tabDemo = document.getElementById('tabDemo');
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
      const user = await apiFetch('/api/auth/me');
      userNameEl.textContent =
        user.username ||
        user.full_name ||
        user.email?.split('@')[0] ||
        'Trader';
    } catch {
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

      liveContainer.innerHTML = '';
      demoContainer.innerHTML = '';

      balances.live.balance = 0;
      balances.demo.balance = 0;

      data.forEach(acc => {
        if (acc.type === 'live') {
          balances.live.balance += Number(acc.balance || 0);
        }
        if (acc.type === 'demo') {
          balances.demo.balance += Number(acc.balance || 0);
        }
        renderAccountCard(acc);
      });

      renderTopBalance();
    } catch (err) {
      console.error('Accounts fetch failed', err);
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

    const formatted = format(account.balance, account.currency || 'USD');

    card.innerHTML = `
      <div class="card-head">
        <span class="chip ${chipClass}">
          ${account.type === 'live' ? 'Live' : 'Demo'}
        </span>
        <span class="chip chip-broker">
          ${account.broker || 'Broker'}
        </span>
      </div>

      <div class="card-body">
        <div class="big-amount balance-value">${formatted}</div>
        <button class="icon-btn sm balance-toggle">
          <iconify-icon class="ic eye-icon" icon="mdi:eye-outline"></iconify-icon>
        </button>
      </div>

      <div class="line-art"></div>
    `;

    let hidden = false;
    const valueEl = card.querySelector('.balance-value');
    const eyeIcon = card.querySelector('.eye-icon');

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
     TOP BALANCE
  ======================= */
  function renderTopBalance() {
    const active = currentTab === 'live' ? balances.live : balances.demo;
    if (!topBalanceEl) return;

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

  tabLive?.addEventListener('click', () => {
    currentTab = 'live';
    renderTopBalance();
  });

  tabDemo?.addEventListener('click', () => {
    currentTab = 'demo';
    renderTopBalance();
  });

  /* =======================
     INIT
  ======================= */
  fetchUserProfile();
  fetchAccounts();
})();