// accounts.js — PRODUCTION SAFE, NO INFINITE LOOPS
(() => {
  'use strict';

  if (window.__ML_ACCOUNTS_READY__) return;
  window.__ML_ACCOUNTS_READY__ = true;

  // Expose state globally for navbar
  window.currentTab = 'live';
  window.balances = {
    live: { balance: 0, currency: 'USD' },
    demo: { balance: 0, currency: 'USD' }
  };

  let isTopBalanceHidden = false;
  let initAttempts = 0;
  const MAX_ATTEMPTS = 30; // 3 seconds max

  /* =========================
     STARTUP - Wait for DOM
  ========================= */
  document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, waiting for auth...');
    waitForAuth();
  });

  function waitForAuth() {
    if (!window.MLAuth || typeof MLAuth.getToken !== 'function') {
      setTimeout(waitForAuth, 100);
      return;
    }

    if (!MLAuth.getToken()) {
      console.log('❌ No token, redirecting to login...');
      window.location.href = '../landing/signin.html';
      return;
    }

    console.log('✅ Auth ready, checking for navbar...');
    waitForNavbar();
  }

  function waitForNavbar() {
    const topBalance = document.getElementById('topBalance');
    
    if (!topBalance) {
      initAttempts++;
      
      if (initAttempts >= MAX_ATTEMPTS) {
        console.error('❌ FATAL: Navbar never loaded after 3 seconds');
        alert('Page failed to load. Please refresh.');
        return;
      }
      
      console.log(`⏳ Waiting for navbar... (attempt ${initAttempts}/${MAX_ATTEMPTS})`);
      setTimeout(waitForNavbar, 100);
      return;
    }

    console.log('✅ Navbar loaded, initializing accounts...');
    init();
  }

  /* =========================
     INIT - Single execution
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

    if (!userNameEl || !liveContainer || !demoContainer) {
      console.error('❌ FATAL: Dashboard elements missing:', {
        userNameEl: !!userNameEl,
        liveContainer: !!liveContainer,
        demoContainer: !!demoContainer
      });
      return;
    }

    console.log('✅ All elements found, fetching data...');

    // Fetch data
    fetchUserProfile(userNameEl);
    fetchAccounts(liveContainer, demoContainer, topBalanceEl);

    // Tab switching
    if (tabLive) {
      tabLive.addEventListener('click', () => {
        window.currentTab = 'live';
        renderTopBalance(topBalanceEl);
      });
    }

    if (tabDemo) {
      tabDemo.addEventListener('click', () => {
        window.currentTab = 'demo';
        renderTopBalance(topBalanceEl);
      });
    }

    // Top balance toggle
    if (toggleTopBtn && topBalanceEl && topEye) {
      toggleTopBtn.addEventListener('click', () => {
        isTopBalanceHidden = !isTopBalanceHidden;

        if (isTopBalanceHidden) {
          topBalanceEl.textContent = '•••••';
          topEye.setAttribute('icon', 'mdi:eye-off-outline');
        } else {
          renderTopBalance(topBalanceEl);
          topEye.setAttribute('icon', 'mdi:eye-outline');
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
      
      // Store for callback.html
      localStorage.setItem('ml_user', JSON.stringify(user));
      
      console.log('✅ User loaded:', name);
    } catch (e) {
      console.error('❌ User fetch failed', e);
      if (e.message === 'UNAUTHORIZED') MLAuth.logout();
    }
  }

  /* =========================
     FETCH ACCOUNTS
  ========================= */
  async function fetchAccounts(liveContainer, demoContainer, topBalanceEl) {
    try {
      const data = await MLAuth.apiFetch('/api/accounts/summary');
      console.log('✅ Backend response:', data);

      const accounts = Array.isArray(data.accounts) ? data.accounts : [];

      liveContainer.innerHTML = '';
      demoContainer.innerHTML = '';

      // Reset balances
      window.balances.live.balance = data.live_balance || 0;
      window.balances.demo.balance = data.demo_balance || 0;

      // Render individual account cards
      if (accounts.length === 0) {
        console.warn('⚠️ No accounts found, showing placeholders');
      }

      accounts.forEach(acc => {
        const isDemo = acc.is_demo === true;
        const amount = Number(acc.balance || 0);
        const currency = acc.currency || 'USD';

        renderAccountCard({
          id: acc.account_id || acc.id || 'unknown',
          type: isDemo ? 'demo' : 'live',
          broker: acc.broker || 'Deriv',
          balance: amount,
          currency
        }, liveContainer, demoContainer);
      });

      // Fallback placeholders if no accounts
      if (!liveContainer.children.length) {
        renderAccountCard({
          id: 'live-placeholder',
          type: 'live',
          broker: 'Deriv',
          balance: window.balances.live.balance,
          currency: 'USD'
        }, liveContainer, demoContainer);
      }

      if (!demoContainer.children.length) {
        renderAccountCard({
          id: 'demo-placeholder',
          type: 'demo',
          broker: 'Deriv',
          balance: window.balances.demo.balance,
          currency: 'USD'
        }, liveContainer, demoContainer);
      }

      // Update top balance
      if (!isTopBalanceHidden) {
        renderTopBalance(topBalanceEl);
      }

      console.log('✅ Accounts rendered successfully');
    } catch (e) {
      console.error('❌ Accounts fetch failed', e);
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
    if (!el) return;
    const active = window.currentTab === 'demo' ? window.balances.demo : window.balances.live;
    el.textContent = format(active.balance, active.currency);
    
    // Notify navbar
    document.dispatchEvent(new CustomEvent('ml:balance-updated', {
      detail: { currentTab: window.currentTab, balances: window.balances }
    }));
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