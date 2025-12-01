console.log('[support] JS loaded');

const screen2 = document.getElementById("screen2");
const mainNav = document.getElementById("mainNav");
const navBackdrop = document.getElementById("navBackdrop");
const services = document.getElementById("services");
const navToggle = document.getElementById("navToggle");
const navMenu   = document.getElementById("navMenu");
const backBtn   = document.getElementById("backToTop");

/* Nav offset */
function setNavOffset(){
  requestAnimationFrame(() => {
    if (!mainNav) return;
    const h = Math.ceil(mainNav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-offset', `${h}px`);
  });
}
window.addEventListener('load', setNavOffset);
window.addEventListener('resize', setNavOffset);

/* Mobile nav */
navToggle?.addEventListener('click', () => {
  const isOpen = navMenu?.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(!!isOpen));
});

/* Dropdown */
(function dropdown(){
  const li = services; if (!li) return;
  const link = li.querySelector('.dropdown');
  const menu = li.querySelector('.dropdown-menu'); if (!link || !menu) return;

  link.addEventListener('click', ev => {
    ev.preventDefault();
    const willShow = !menu.classList.contains('show');
    menu.classList.toggle('show', willShow);
    link.setAttribute('aria-expanded', String(willShow));
    navBackdrop?.classList.toggle('show', willShow);
  });

  document.addEventListener('click', (ev) => {
    if (!li.contains(ev.target)) {
      menu.classList.remove('show');
      link.setAttribute('aria-expanded','false');
      navBackdrop?.classList.remove('show');
    }
  });

  navBackdrop?.addEventListener('click', () => {
    menu.classList.remove('show');
    link.setAttribute('aria-expanded','false');
    navBackdrop.classList.remove('show');
  });
})();

/* Back to top */
function trackBackToTop(){
  const st = screen2?.scrollTop || 0;
  if (st > 300) backBtn?.classList.add('show'); else backBtn?.classList.remove('show');
}
screen2?.addEventListener('scroll', trackBackToTop, { passive:true });
backBtn?.addEventListener('click', () => screen2?.scrollTo({ top:0, behavior:'smooth' }));
trackBackToTop();

/* ===== Chat widget (Support screen) ===== */
const chatFab   = document.getElementById('chatFab');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatForm  = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBody  = document.getElementById('chatBody');

function openChat(){ chatPanel?.classList.add('open'); chatPanel?.setAttribute('aria-hidden','false'); setTimeout(()=>chatInput?.focus(), 20); }
function closeChat(){ chatPanel?.classList.remove('open'); chatPanel?.setAttribute('aria-hidden','true'); }

// Toggle on FAB
chatFab?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (chatPanel?.classList.contains('open')) closeChat(); else openChat();
});
chatClose?.addEventListener('click', closeChat);
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeChat(); });

// Outside click / tap-to-dismiss
function outsideClickHandler(ev){
  if (!chatPanel?.classList.contains('open')) return;
  const target = ev.target;
  const clickedInsidePanel = chatPanel.contains(target);
  const clickedFab = chatFab && chatFab.contains(target);
  if (!clickedInsidePanel && !clickedFab) closeChat();
}
document.addEventListener('pointerdown', outsideClickHandler);
document.addEventListener('click', outsideClickHandler);

/* Global chat triggers via event delegation */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-open-chat], a[href="#chat"], a[href="#livechat"], a[href$="#chat"], a[href$="#livechat"]');
  if (!t) return;
  ev.preventDefault();
  openChat();
});

/* Deep-link open */
(function maybeOpenChatFromHash(){
  const h = (location.hash || '').toLowerCase();
  if (h === '#chat' || h === '#livechat') openChat();
})();

/* --- Critical flag: enforce Screen 2 on index when navigating back --- */
window.addEventListener('pagehide', () => {
  try { sessionStorage.setItem('forceScreen2', '1'); } catch(e){}
});