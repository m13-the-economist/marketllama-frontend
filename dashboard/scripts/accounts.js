// scripts/accounts.js — v13 (plain JS, delegated accordion)
// - Navbar Hide Balance masks nav + main + big in sync
// - Sidebar toggle label << / >>
// - Tabs render Live/Demo/Archived using configured balances
// - Payments & Wallet accordion uses EVENT DELEGATION (rock-solid across DOM changes)
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

    var mainAmount = document.getElementById('mainAmount'); // main KPI balance (if present)
    var mainEye    = document.getElementById('mainEye');    // eye for main balance (optional)

    var bigAmount      = document.getElementById('bigAmount'); // large balance display (if present)
    var currentBigText = bigAmount ? bigAmount.textContent.trim() : '15,400.00 USD';

    // Central balance config per tab
    var BALANCES = {
      live:     { num: '15,400', suffix: '.00' },
      demo:     { num: '10,000', suffix: '.00' },
      archived: { num: '8,250', suffix: '.50' } // keep .50 for archived
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
      var accs = document.querySelectorAll('.accordion');
      for (var i = 0; i < accs.length; i++) {
        accs[i].setAttribute('aria-expanded', 'false');
      }

      var subs = document.querySelectorAll('.submenu');
      for (var j = 0; j < subs.length; j++) {
        var ul = subs[j];
        ul.style.display = 'none';
        ul.setAttribute('hidden', '');
        ul.dataset.open = 'false';
      }

      var chevrons = document.querySelectorAll('.accordion iconify-icon:last-child');
      for (var k = 0; k < chevrons.length; k++) {
        chevrons[k].setAttribute('icon', 'mdi:chevron-down');
      }
    }

    function setSideToggleLabel() {
      if (!sideToggle) return;
      sideToggle.textContent = isCollapsed() ? '>>' : '<<';
    }

    // ---------- Sidebar collapse/expand
    if (sideToggle) {
      sideToggle.addEventListener('click', function () {
        var collapsed = isCollapsed();
        if (!collapsed) closeAllSubmenus();
        if (sidebar) sidebar.dataset.state = collapsed ? 'expanded' : 'collapsed';
        setAria(sideToggle, 'aria-expanded', collapsed ? 'true' : 'false');
        setSideToggleLabel();
      });
      setSideToggleLabel();
    }

    // ---------- Mobile drawer
    function openMobileSide() {
      if (sidebar) sidebar.classList.add('open');
      if (backdrop) backdrop.removeAttribute('hidden');
      setAria(mobileTrigger, 'aria-expanded', true);
    }

    function closeMobileSide() {
      if (sidebar) sidebar.classList.remove('open');
      if (backdrop) backdrop.setAttribute('hidden', 'hidden');
      setAria(mobileTrigger, 'aria-expanded', false);
      closeAllSubmenus();
    }

    if (mobileTrigger) {
      mobileTrigger.addEventListener('click', function () {
        if (sidebar && sidebar.classList.contains('open')) {
          closeMobileSide();
        } else {
          openMobileSide();
        }
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', closeMobileSide);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMobileSide();
    });

    var sideLinks = document.querySelectorAll('.side-menu a');
    for (var sl = 0; sl < sideLinks.length; sl++) {
      sideLinks[sl].addEventListener('click', closeMobileSide);
    }

    // ---------- Balances (SYNC nav + main + big)
    var MASK    = '••••••••';
    var DISPLAY = topBalance ? topBalance.textContent.trim() : '$ 15 400.00';

    var hidden = (topBalance && topBalance.textContent.indexOf('•') !== -1) ||
                 (mainAmount && mainAmount.textContent.indexOf('•') !== -1) ||
                 (bigAmount && bigAmount.textContent.indexOf('•') !== -1);

    function formatAmountHTML(cfg) {
      return '<span style="font-size:21px">' + cfg.num + '</span>' + cfg.suffix + ' <span>USD</span>';
    }

    function getCurrentConfig() {
      return BALANCES[currentTab] || BALANCES.live;
    }

    function renderBalances() {
      var cfg = getCurrentConfig();
      currentBigText = cfg.num + cfg.suffix + ' USD';

      if (topBalance) {
        topBalance.textContent = hidden ? MASK : DISPLAY;
      }

      if (mainAmount) {
        if (hidden) {
          mainAmount.textContent = MASK;
        } else {
          mainAmount.innerHTML = formatAmountHTML(cfg);
        }
      }

      if (bigAmount) {
        bigAmount.textContent = hidden ? MASK : currentBigText;
      }

      if (topEye) {
        topEye.setAttribute('icon', hidden ? 'mdi:eye-off' : 'mdi:eye');
      }
      if (mainEye) {
        mainEye.setAttribute('icon', hidden ? 'mdi:eye-off' : 'mdi:eye');
      }
    }

    function toggleAllBalances() {
      hidden = !hidden;
      renderBalances();
    }

    if (toggleBalanceBtn) {
      toggleBalanceBtn.addEventListener('click', toggleAllBalances);
    }

    // ---------- Tabs (Live/Demo/Archived using BALANCES config)
    function applyTab(tabKey) {
      currentTab = tabKey || 'live';
      var cfg = getCurrentConfig();
      currentBigText = cfg.num + cfg.suffix + ' USD';

      if (bigAmount) {
        bigAmount.textContent = hidden ? MASK : currentBigText;
      }

      if (mainAmount) {
        if (hidden) {
          mainAmount.textContent = MASK;
        } else {
          mainAmount.innerHTML = formatAmountHTML(cfg);
        }
      }
    }

    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].addEventListener('click', function () {
        for (var j = 0; j < tabs.length; j++) {
          tabs[j].classList.remove('active');
        }
        this.classList.add('active');

        var which = this.getAttribute('data-tab');
        applyTab(which);

        // Update first chip label to match active tab text
        var chip = document.querySelector('.chip');
        if (chip) {
          chip.textContent = this.textContent.trim();
        }
      });
    }

    // ---------- Accordion (EVENT DELEGATION)
    function findSubmenu(btn) {
      var el = btn.nextElementSibling;
      while (el && !(el.classList && el.classList.contains('submenu'))) {
        el = el.nextElementSibling;
      }
      return el;
    }

    function setSubmenuState(btn, open) {
      var submenu = findSubmenu(btn);
      if (!submenu) return;

      btn.setAttribute('aria-expanded', String(open));

      if (open) {
        submenu.style.display = 'block';
        submenu.removeAttribute('hidden');
        submenu.dataset.open = 'true';
      } else {
        submenu.style.display = 'none';
        submenu.setAttribute('hidden', '');
        submenu.dataset.open = 'false';
      }

      var chevron = btn.querySelector('iconify-icon:last-child');
      if (chevron) {
        chevron.setAttribute('icon', open ? 'mdi:chevron-up' : 'mdi:chevron-down');
      }
    }

    // Initialize all accordions to their aria-expanded state on load
    var accInit = document.querySelectorAll('.accordion');
    for (var a = 0; a < accInit.length; a++) {
      var btn = accInit[a];
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      setSubmenuState(btn, expanded);
    }

    // Delegate clicks from the sidebar container so it works on first try AND after any DOM changes
    if (sidebar) {
      sidebar.addEventListener('click', function (e) {
        var acc = e.target && e.target.closest ? e.target.closest('.accordion') : null;
        if (!acc || !sidebar.contains(acc)) return;
        e.preventDefault();
        if (isCollapsed()) return;
        var isOpen = acc.getAttribute('aria-expanded') === 'true';
        setSubmenuState(acc, !isOpen);
      });
    }

    // ---------- Initial render
    (function initOnLoad() {
      var active = document.querySelector('.tab.active');
      var which = active ? active.getAttribute('data-tab') : 'live';
      currentTab = which || 'live';
      applyTab(currentTab);
      renderBalances();
      setSideToggleLabel();
    })();
  });
})();