// components/navbar.js - COMPLETE VERSION
(function() {
  const mount = document.getElementById("ml-navbar");
  if (!mount) {
    console.error('❌ #ml-navbar mount point not found');
    return;
  }

  // Load navbar HTML
  fetch("components/navbar.html")
    .then(res => res.text())
    .then(html => {
      mount.innerHTML = html;
      console.log('✅ Navbar HTML loaded');
      initializeNavbar();
    })
    .catch(err => console.error('❌ Failed to load navbar:', err));

  function initializeNavbar() {
    // ===== LANGUAGE SYSTEM =====
    const params = new URLSearchParams(window.location.search);
    let currentLang = params.get('lang') || 'en';

    const translations = {
      en: { 
        accounts: "Accounts", 
        paymentsWallet: "Payments & Wallet", 
        subscription: "Subscription Plan", 
        transactionHistory: "Transaction History", 
        insight: "Insight", 
        performance: "Performance", 
        chart: "Chart", 
        settings: "Settings", 
        instructions: "Instructions" 
      },
      de: { 
        accounts: "Konten", 
        paymentsWallet: "Zahlungen & Wallet", 
        subscription: "Abonnementplan", 
        transactionHistory: "Transaktionsverlauf", 
        insight: "Einblicke", 
        performance: "Leistung", 
        chart: "Diagramm", 
        settings: "Einstellungen", 
        instructions: "Anleitung" 
      },
      es: { 
        accounts: "Cuentas", 
        paymentsWallet: "Pagos & Cartera", 
        subscription: "Plan de Suscripción", 
        transactionHistory: "Historial de Transacciones", 
        insight: "Perspectiva", 
        performance: "Rendimiento", 
        chart: "Gráfico", 
        settings: "Configuración", 
        instructions: "Instrucciones" 
      },
      fr: { 
        accounts: "Comptes", 
        paymentsWallet: "Paiements & Portefeuille", 
        subscription: "Plan d'abonnement", 
        transactionHistory: "Historique des transactions", 
        insight: "Aperçu", 
        performance: "Performance", 
        chart: "Graphique", 
        settings: "Paramètres", 
        instructions: "Instructions" 
      },
      ar: { 
        accounts: "الحسابات", 
        paymentsWallet: "المدفوعات والمحفظة", 
        subscription: "خطة الاشتراك", 
        transactionHistory: "سجل المعاملات", 
        insight: "رؤى", 
        performance: "الأداء", 
        chart: "الرسم البياني", 
        settings: "الإعدادات", 
        instructions: "التعليمات" 
      }
    };

    if (!translations[currentLang]) currentLang = 'en';

    function updateNavLinks() {
      const pages = ['accounts', 'insight', 'performance', 'chart', 'instructions', 'profile', 'subscriptionplan', 'transactions'];
      pages.forEach(type => {
        mount.querySelectorAll('[data-link="' + type + '"]').forEach(a => {
          a.href = type + '.html?lang=' + currentLang;
        });
      });
    }

    function applyLanguage(lang) {
      const t = translations[lang] || translations.en;
      mount.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) el.textContent = t[key];
      });
      document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
      updateNavLinks();
    }

    // ===== ACTIVE PAGE HIGHLIGHT =====
    const page = (location.pathname.split("/").pop() || "").toLowerCase().split("?")[0];
    mount.querySelectorAll(".side-menu li").forEach(li => li.classList.remove("active"));
    mount.querySelectorAll(".side-menu a[href]").forEach(a => {
      const hrefFile = (a.getAttribute("href") || "").toLowerCase().split("?")[0];
      if (hrefFile === page) {
        const li = a.closest("li");
        if (li) li.classList.add("active");
      }
    });

    // ===== ACCORDION SUBMENU =====
    const accordion = mount.querySelector('.accordion');
    const submenu = mount.querySelector('.submenu');
    const chevron = mount.querySelector('.chevron');

    function closeDropdown() {
      if (submenu && !submenu.hidden) {
        submenu.hidden = true;
        if (accordion) accordion.setAttribute('aria-expanded', 'false');
        if (chevron) chevron.setAttribute('icon', 'mdi:chevron-down');
      }
    }

    if (accordion && submenu && chevron) {
      accordion.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isExpanded = accordion.getAttribute('aria-expanded') === 'true';
        accordion.setAttribute('aria-expanded', String(!isExpanded));
        submenu.hidden = isExpanded;
        chevron.setAttribute('icon', isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-up');
      });
    }

    // ===== MOBILE SIDEBAR =====
    const mobileSideTrigger = mount.querySelector('#mobileSideTrigger');
    const sidebar = mount.querySelector('#sidebar');
    const backdrop = mount.querySelector('#backdrop');

    if (mobileSideTrigger && sidebar && backdrop) {
      mobileSideTrigger.addEventListener('click', function(e) {
        e.stopPropagation();
        const isExpanded = mobileSideTrigger.getAttribute('aria-expanded') === 'true';
        mobileSideTrigger.setAttribute('aria-expanded', String(!isExpanded));
        sidebar.classList.toggle('open');
        backdrop.hidden = isExpanded;
        if (!sidebar.classList.contains('open')) {
          closeDropdown();
        }
      });

      backdrop.addEventListener('click', function() {
        mobileSideTrigger.setAttribute('aria-expanded', 'false');
        sidebar.classList.remove('open');
        backdrop.hidden = true;
        closeDropdown();
      });
    }

    // ===== DESKTOP SIDEBAR TOGGLE =====
    const sideToggle = mount.querySelector('#sideToggle');
    if (sideToggle && sidebar) {
      sideToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        const isExpanded = sideToggle.getAttribute('aria-expanded') === 'true';
        sideToggle.setAttribute('aria-expanded', String(!isExpanded));
        sidebar.setAttribute('data-state', isExpanded ? 'collapsed' : 'expanded');
        
        const chevronIcon = sideToggle.querySelector('iconify-icon');
        if (chevronIcon) {
          chevronIcon.setAttribute('icon', isExpanded ? 'mdi:chevron-double-right' : 'mdi:chevron-double-left');
        }
        
        if (isExpanded) {
          closeDropdown();
        }
      });
    }

    // ===== BALANCE TOGGLE =====
    const toggleBalance = mount.querySelector('#toggleBalance');
    const topBalance = mount.querySelector('#topBalance');
    const topEye = mount.querySelector('#topEye');
    let balanceHidden = false;

    if (toggleBalance && topBalance && topEye) {
      toggleBalance.addEventListener('click', function(e) {
        e.stopPropagation();
        balanceHidden = !balanceHidden;
        
        if (balanceHidden) {
          topBalance.textContent = '•••••';
          topEye.setAttribute('icon', 'mdi:eye-off-outline');
        } else {
          // Restore balance from global state if available
          topBalance.textContent = window.currentBalance || '— USD';
          topEye.setAttribute('icon', 'mdi:eye-outline');
        }
      });
    }

    // ===== LANGUAGE DROPDOWN =====
    const languageBtn = mount.querySelector('#languageBtn');
    const languageDropdown = mount.querySelector('#languageDropdown');

    if (languageBtn && languageDropdown) {
      languageBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        languageDropdown.hidden = !languageDropdown.hidden;
      });

      languageDropdown.addEventListener('click', function(e) {
        e.stopPropagation();
      });

      languageDropdown.querySelectorAll('.lang-option').forEach(function(option) {
        option.addEventListener('click', function() {
          const lang = option.getAttribute('data-lang');
          if (!translations[lang]) return;
          
          currentLang = lang;
          const url = new URL(window.location.href);
          url.searchParams.set('lang', currentLang);
          window.location.href = url.toString();
        });
      });

      document.addEventListener('click', function() {
        languageDropdown.hidden = true;
      });
    }

    // ===== GLOBAL CLICK HANDLERS =====
    document.addEventListener('click', function() {
      closeDropdown();
    });

    // ===== FINALIZE =====
    applyLanguage(currentLang);
    
    // Signal that navbar is ready
    document.dispatchEvent(new CustomEvent("ml:navbar-ready"));
    console.log('✅ Navbar initialized with all features');
  }
})();