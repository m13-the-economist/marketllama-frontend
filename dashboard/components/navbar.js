// components/navbar.js
(async function () {
  const mount = document.getElementById("ml-navbar");
  if (!mount) return;

  // Load iconify (once)
  if (!document.querySelector('script[src*="iconify-icon"]')) {
    const s = document.createElement("script");
    s.src = "https://code.iconify.design/iconify-icon/1.0.8/iconify-icon.min.js";
    s.defer = true;
    document.head.appendChild(s);
  }

  // Load navbar.css once
  if (!document.querySelector('link[href="components/navbar.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "components/navbar.css";
    document.head.appendChild(link);
  }

  // Inject
  const res = await fetch("components/navbar.html", { cache: "no-store" });
  mount.innerHTML = await res.text();

  // ====== JS logic copied from your Profile page (same behavior) ======
  const params = new URLSearchParams(window.location.search);
  let currentLang = params.get('lang') || 'en';

  // Basic translations used by the nav labels (safe defaults)
  const translations = {
    en: { accounts:"Accounts", paymentsWallet:"Payments & Wallet", subscription:"Subscription Plan", transactionHistory:"Transaction History", insight:"Insight", performance:"Performance", chart:"Chart", settings:"Settings", instructions:"Instructions" },
    de: { accounts:"Konten", paymentsWallet:"Zahlungen & Wallet", subscription:"Abonnementplan", transactionHistory:"Transaktionsverlauf", insight:"Einblicke", performance:"Leistung", chart:"Diagramm", settings:"Einstellungen", instructions:"Anleitung" },
    es: { accounts:"Cuentas", paymentsWallet:"Pagos & Cartera", subscription:"Plan de Suscripción", transactionHistory:"Historial de Transacciones", insight:"Perspectiva", performance:"Rendimiento", chart:"Gráfico", settings:"Configuración", instructions:"Instrucciones" },
    fr: { accounts:"Comptes", paymentsWallet:"Paiements & Portefeuille", subscription:"Plan d'abonnement", transactionHistory:"Historique des transactions", insight:"Aperçu", performance:"Performance", chart:"Graphique", settings:"Paramètres", instructions:"Instructions" },
    ar: { accounts:"الحسابات", paymentsWallet:"المدفوعات والمحفظة", subscription:"خطة الاشتراك", transactionHistory:"سجل المعاملات", insight:"رؤى", performance:"الأداء", chart:"الرسم البياني", settings:"الإعدادات", instructions:"التعليمات" }
  };

  if (!translations[currentLang]) currentLang = 'en';

  function updateNavLinks() {
    // Use your original logic: map data-link -> page.html?lang=
    const pages = ['accounts', 'insight', 'performance', 'chart', 'instructions', 'profile'];
    pages.forEach(type => {
      mount.querySelectorAll('[data-link="' + type + '"]').forEach(a => {
        a.href = type + '.html?lang=' + currentLang;
      });
    });

    // Keep submenu links stable but add lang when possible
    mount.querySelectorAll('[data-link="subscriptionplan"]').forEach(a => {
      a.href = 'subscriptionplan.html?lang=' + currentLang;
    });
    mount.querySelectorAll('[data-link="transactions"]').forEach(a => {
      a.href = 'transactions.html?lang=' + currentLang;
    });
  }

  function applyLanguage(lang) {
    const t = translations[lang] || translations.en;

    mount.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key]) el.textContent = t[key];
    });

    if (lang === 'ar') document.documentElement.setAttribute('dir', 'rtl');
    else document.documentElement.setAttribute('dir', 'ltr');

    updateNavLinks();
  }

  // Active page highlight (by filename)
  const page = (location.pathname.split("/").pop() || "").toLowerCase().split("?")[0];
  mount.querySelectorAll(".side-menu li").forEach(li => li.classList.remove("active"));
  mount.querySelectorAll(".side-menu a[href]").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    const hrefFile = href.split("?")[0];
    if (hrefFile === page) {
      const li = a.closest("li");
      if (li) li.classList.add("active");
    }
  });

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
    accordion.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = accordion.getAttribute('aria-expanded') === 'true';
      accordion.setAttribute('aria-expanded', String(!isExpanded));
      submenu.hidden = isExpanded;
      chevron.setAttribute('icon', isExpanded ? 'mdi:chevron-down' : 'mdi:chevron-up');
    });
  }

  const mobileSideTrigger = mount.querySelector('#mobileSideTrigger');
  const sidebar = mount.querySelector('#sidebar');
  const backdrop = mount.querySelector('#backdrop');

  if (mobileSideTrigger && sidebar && backdrop) {
    mobileSideTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = mobileSideTrigger.getAttribute('aria-expanded') === 'true';
      mobileSideTrigger.setAttribute('aria-expanded', String(!isExpanded));
      sidebar.classList.toggle('open');
      backdrop.hidden = isExpanded;
      if (!sidebar.classList.contains('open')) closeDropdown();
    });

    backdrop.addEventListener('click', () => {
      mobileSideTrigger.setAttribute('aria-expanded', 'false');
      sidebar.classList.remove('open');
      backdrop.hidden = true;
      closeDropdown();
    });
  }

  const sideToggle = mount.querySelector('#sideToggle');
  if (sideToggle && sidebar) {
    sideToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isExpanded = sideToggle.getAttribute('aria-expanded') === 'true';
      sideToggle.setAttribute('aria-expanded', String(!isExpanded));
      sidebar.setAttribute('data-state', isExpanded ? 'collapsed' : 'expanded');
      const chevronIcon = sideToggle.querySelector('iconify-icon');
      if (chevronIcon) {
        chevronIcon.setAttribute('icon', isExpanded ? 'mdi:chevron-double-right' : 'mdi:chevron-double-left');
      }
      if (isExpanded) closeDropdown();
    });
  }

  const toggleBalance = mount.querySelector('#toggleBalance');
  const topBalance = mount.querySelector('#topBalance');
  const topEye = mount.querySelector('#topEye');
  let balanceHidden = false;

  if (toggleBalance && topBalance && topEye) {
    toggleBalance.addEventListener('click', (e) => {
      e.stopPropagation();
      balanceHidden = !balanceHidden;
      if (balanceHidden) {
        topBalance.textContent = '•••••';
        topEye.setAttribute('icon', 'mdi:eye-off-outline');
      } else {
        topBalance.textContent = '$ 15 400.00';
        topEye.setAttribute('icon', 'mdi:eye-outline');
      }
    });
  }

  const languageBtn = mount.querySelector('#languageBtn');
  const languageDropdown = mount.querySelector('#languageDropdown');

  function toggleLanguageDropdown() {
    if (!languageDropdown) return;
    languageDropdown.hidden = !languageDropdown.hidden;
  }

  if (languageBtn && languageDropdown) {
    languageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLanguageDropdown();
    });

    languageDropdown.addEventListener('click', (e) => e.stopPropagation());

    const langOptions = languageDropdown.querySelectorAll('.lang-option');
    langOptions.forEach(option => {
      option.addEventListener('click', () => {
        const lang = option.getAttribute('data-lang');
        if (!translations[lang]) return;
        currentLang = lang;

        const url = new URL(window.location.href);
        url.searchParams.set('lang', currentLang);
        window.location.href = url.pathname + '?' + url.searchParams.toString();
      });
    });

    document.addEventListener('click', () => {
      languageDropdown.hidden = true;
    });
  }

  document.addEventListener('click', () => closeDropdown());

  applyLanguage(currentLang);

  // Let the page run its own init AFTER navbar is present
  document.dispatchEvent(new CustomEvent("ml:navbar-ready"));
})();