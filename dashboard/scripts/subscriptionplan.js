// subscriptionplan.js — pricing + Flutterwave checkout
(() => {
    'use strict';
  
    /* =========================
       SHARED CONFIG
    ========================= */
    const API_BASE =
      window.ML_CONFIG?.API_BASE_URL ||
      (location.hostname.includes('marketllama.com')
        ? 'https://marketllama.com'
        : 'http://127.0.0.1:8000');
  
    const TOKEN_KEY = 'ml_access_token';
  
    function getToken() {
      return localStorage.getItem(TOKEN_KEY);
    }
  
    function logout() {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '../landing/signin.html';
    }
  
    async function apiFetch(path, options = {}) {
      const token = getToken();
      if (!token) logout();
  
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });
  
      if (res.status === 401) logout();
      if (!res.ok) throw new Error(res.status);
  
      return res.json();
    }
  
    /* =========================
       STATE
    ========================= */
    let billingCycle = 'monthly'; // or 'annual'
    let plans = [];
  
    /* =========================
       LOAD PLANS FROM BACKEND
    ========================= */
    async function loadPlans() {
      try {
        plans = await apiFetch('/api/plans');
        bindPrices();
      } catch (err) {
        console.error('Failed to load plans', err);
      }
    }
  
    /* =========================
       PRICE BINDING
    ========================= */
    function bindPrices() {
      plans.forEach(plan => {
        const card = document.querySelector(`[data-plan="${plan.code}"]`);
        if (!card) return;
  
        const amountEl = card.querySelector('.amount');
        const perEl = card.querySelector('.per');
  
        if (!amountEl || !perEl) return;
  
        const monthly = plan.price_usd;
        const annual = +(monthly * 10).toFixed(2); // 2 months free logic
  
        amountEl.textContent =
          billingCycle === 'monthly' ? monthly.toFixed(2) : annual.toFixed(2);
  
        perEl.textContent =
          billingCycle === 'monthly' ? '/month' : '/year';
      });
    }
  
    /* =========================
       BILLING TOGGLE
    ========================= */
    function initBillingToggle() {
      const monthlyBtn = document.querySelector('[data-billing="monthly"]');
      const annualBtn = document.querySelector('[data-billing="annual"]');
  
      if (!monthlyBtn || !annualBtn) return;
  
      monthlyBtn.addEventListener('click', () => {
        billingCycle = 'monthly';
        monthlyBtn.classList.add('active');
        annualBtn.classList.remove('active');
        bindPrices();
      });
  
      annualBtn.addEventListener('click', () => {
        billingCycle = 'annual';
        annualBtn.classList.add('active');
        monthlyBtn.classList.remove('active');
        bindPrices();
      });
    }
  
    /* =========================
       CHECKOUT
    ========================= */
    function startCheckout(planCode) {
      const user = JSON.parse(localStorage.getItem('ml_user'));
      if (!user) return logout();
  
      const plan = plans.find(p => p.code === planCode);
      if (!plan) return;
  
      const amount =
        billingCycle === 'monthly'
          ? plan.price_usd
          : +(plan.price_usd * 10).toFixed(2);
  
      FlutterwaveCheckout({
        public_key: 'FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxx-X', // replace
        tx_ref: `ml-${Date.now()}`,
        amount,
        currency: 'USD',
        payment_options: 'card,ussd,banktransfer',
        customer: {
          email: user.email,
          id: user.id
        },
        meta: {
          user_id: user.id,
          plan_code: plan.code,
          billing_cycle: billingCycle
        },
        callback: function () {
          alert('Payment received. Subscription activating...');
        },
        onclose: function () {},
        customizations: {
          title: 'Market Llama',
          description: plan.name,
          logo: 'https://marketllama.com/assets/logo.png'
        }
      });
    }
  
    /* =========================
       PLAN BUTTONS
    ========================= */
    function initPlanButtons() {
      document.querySelectorAll('[data-select-plan]').forEach(btn => {
        btn.addEventListener('click', () => {
          const planCode = btn.dataset.selectPlan;
          if (planCode !== 'EARLY_ADOPTER') return;
          startCheckout(planCode);
        });
      });
    }
  
    /* =========================
       INIT
    ========================= */
    document.addEventListener('DOMContentLoaded', () => {
      initBillingToggle();
      initPlanButtons();
      loadPlans();
    });
  
  })();