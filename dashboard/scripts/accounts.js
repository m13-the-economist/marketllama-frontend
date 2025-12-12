// scripts/accounts.js — v14 (AUTH-CLEAN, BACKEND-DRIVEN GREETING)
// - All existing UI logic preserved
// - Greeting is fetched authoritatively from backend (/api/auth/me)
// - No inline HTML logic
// - No token decoding
// - No fragile hacks

(function () {
  'use strict';

  function onReady(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    // ---------- Elements
    var sidebar        = document.getElementById('sidebar');
    var sideToggle     = document.getElementById('sideToggle');
    var mobileTrigger  = document.getElementById('mobileSideTrigger');
    var backdrop       = document.getElementById('backdrop');

    var topBalance       = document.getElementById('topBalance');
    var toggleBalanceBtn = document.getElementById('toggleBalance');
    var topEye           = document.getElementById('topEye');

    var mainAmount = document.getElementById('mainAmount');
    var mainEye    = document.getElementById('mainEye');

    var bigAmount      = document.getElementById('bigAmount');
    var currentBigText = bigAmount ? bigAmount.textContent.trim() : '15,400.00 USD';

    // ---------- BALANCES
    var BALANCES = {
      live:     { num: '15,400', suffix: '.00' },
      demo:     { num: '10,000', suffix: '.00' },
      archived: { num: '8,250',  suffix: '.50' }
    };

    var currentTab = 'live';

    // ---------- Utils
    function setAria(el, attr, val) {
      if (el) el.setAttribute(attr, String(val));
    }

    function isCollapsed() {
      return sidebar && sidebar.dataset && sidebar.dataset.state === 'collapsed';
    }

    function closeAllSubmenus() {
      document.querySelectorAll('.accordion').forEach(btn => {
        btn.setAttribute('aria-expanded', 'false');
      });

      document.querySelectorAll('.submenu').forEach(ul => {
        ul.style.display = 'none';
        ul.setAttribute('hidden', '');
        ul.dataset.open = 'false';
      });

      document
        .querySelectorAll('.accordion iconify-icon:last-child')
        .forEach(icon => icon.setAttribute('icon', 'mdi:chevron-down'));
    }

    function setSideToggleLabel() {
      if (sideToggle) sideToggle.textContent = isCollapsed() ? '>>' : '<<';
    }

    // ---------- Sidebar toggle
    if (sideToggle) {
      sideToggle.addEventListener('click', function () {
        if (!isCollapsed()) closeAllSubmenus();
        sidebar.dataset.state = isCollapsed() ? 'expanded' : 'collapsed';
        setSideToggleLabel();
      });
      setSideToggleLabel();
    }

    // ---------- Mobile drawer
    function openMobileSide() {
      sidebar.classList.add('open');
      backdrop.removeAttribute('hidden');
    }

    function closeMobileSide() {
      sidebar.classList.remove('open');
      backdrop.setAttribute('hidden', '');
      closeAllSubmenus();
    }

    if (mobileTrigger) {
      mobileTrigger.addEventListener('click', function () {
        sidebar.classList.contains('open') ? closeMobileSide() : openMobileSide();
      });
    }

    backdrop?.addEventListener('click', closeMobileSide);
    document.addEventListener('keydown', e => e.key === 'Escape' && closeMobileSide());

    document.querySelectorAll('.side-menu a').forEach(a =>
      a.addEventListener('click', closeMobileSide)
    );

    // ---------- Balance masking
    var MASK    = '••••••••';
    var DISPLAY = topBalance ? topBalance.textContent.trim() : '$ 15 400.00';

    var hidden =
      topBalance?.textContent.includes('•') ||
      mainAmount?.textContent.includes('•') ||
      bigAmount?.textContent.includes('•');

    function formatAmountHTML(cfg) {
      return `<span style="font-size:21px">${cfg.num}</span>${cfg.suffix} <span>USD</span>`;
    }

    function getConfig() {
      return BALANCES[currentTab] || BALANCES.live;
    }

    function renderBalances() {
      var cfg = getConfig();
      currentBigText = cfg.num + cfg.suffix + ' USD';

      if (topBalance) topBalance.textContent = hidden ? MASK : DISPLAY;

      if (mainAmount) {
        mainAmount.innerHTML = hidden ? MASK : formatAmountHTML(cfg);
      }

      if (bigAmount) bigAmount.textContent = hidden ? MASK : currentBigText;

      if (topEye) topEye.setAttribute('icon', hidden ? 'mdi:eye-off' : 'mdi:eye');
      if (mainEye) mainEye.setAttribute('icon', hidden ? 'mdi:eye-off' : 'mdi:eye');
    }

    toggleBalanceBtn?.addEventListener('click', function () {
      hidden = !hidden;
      renderBalances();
    });

    // ---------- Tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentTab = this.dataset.tab || 'live';
        renderBalances();
        var chip = document.querySelector('.chip');
        if (chip) chip.textContent = this.textContent.trim();
      });
    });

    // ---------- Accordion (delegated)
    sidebar?.addEventListener('click', function (e) {
      var btn = e.target.closest('.accordion');
      if (!btn || isCollapsed()) return;
      e.preventDefault();

      var submenu = btn.nextElementSibling;
      var open = btn.getAttribute('aria-expanded') === 'true';

      btn.setAttribute('aria-expanded', String(!open));
      submenu.style.display = open ? 'none' : 'block';
      submenu.toggleAttribute('hidden', open);
      submenu.dataset.open = String(!open);

      var icon = btn.querySelector('iconify-icon:last-child');
      if (icon) icon.setAttribute('icon', open ? 'mdi:chevron-down' : 'mdi:chevron-up');
    });

    // ---------- User greeting from backend
(function loadUserGreeting() {
  var token = localStorage.getItem("ml_access_token");
  if (!token) {
    console.warn("No ml_access_token in localStorage; skipping greeting fetch.");
    return;
  }

  fetch("http://72.61.201.223:8000/api/auth/me", {
    headers: {
      "Authorization": "Bearer " + token,
      "Accept": "application/json"
    }
  })
    .then(function (res) {
      if (!res.ok) {
        console.warn("Failed /api/auth/me", res.status);
        return null;
      }
      return res.json();
    })
    .then(function (user) {
      if (!user) return;

      // STRICT priority: username → full_name → email prefix → Trader
      var displayName =
        (user.username && user.username.trim()) ||
        (user.full_name && user.full_name.trim()) ||
        (user.email && user.email.split("@")[0]) ||
        "Trader";

      console.log("Greeting name from backend:", displayName);

      var el = document.getElementById("ml-user-greeting-name");
      if (el) {
        el.textContent = displayName;
      }
    })
    .catch(function (err) {
      console.error("Failed to load user greeting", err);
    });
})();

    // ---------- Initial render
    (function init() {
      currentTab =
        document.querySelector('.tab.active')?.dataset.tab || 'live';
      renderBalances();
      setSideToggleLabel();
    })();
  });
})();