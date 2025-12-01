console.log("[app] boot");

const screen1 = document.getElementById("screen1");
const screen2 = document.getElementById("screen2");
const reactiveBg = document.getElementById("reactiveBg");

const nextBtn   = document.getElementById("nextBtn");
const hero      = document.getElementById("hero");
const services  = document.getElementById("services");
const mainNav   = document.getElementById("mainNav");
const navToggle = document.getElementById("navToggle");
const navMenu   = document.getElementById("navMenu");
const navBackdrop = document.getElementById("navBackdrop");
const backBtn   = document.getElementById("backToTop");

/* ---------- Force Screen 2 on certain arrivals ---------- */
function ensureScreen2() {
  if (!screen2) return;
  if (screen1) { screen1.classList.remove('active'); screen1.style.opacity = '0'; }
  screen2.classList.add('active');
  setNavOffset();
}

function shouldForceScreen2(evt) {
  const hash = (location.hash || '').toLowerCase();
  const hasHash = !!hash;
  const fromSupport = /support\.html(\?|#|$)/i.test(document.referrer || '');
  let forceFlag = false;
  try { forceFlag = sessionStorage.getItem('forceScreen2') === '1'; } catch(e){}
  const isBFCache = evt && typeof evt.persisted === 'boolean' ? evt.persisted : false;
  return hasHash || forceFlag || fromSupport || (isBFCache && fromSupport);
}

function clearForceFlag() { try { sessionStorage.removeItem('forceScreen2'); } catch(e){} }

window.addEventListener('DOMContentLoaded', (e) => {
  if (shouldForceScreen2(e)) { ensureScreen2(); clearForceFlag(); }
  maybeOpenChatFromHash();
  initializeAuth();
  initializeDropdowns(); // Initialize dropdowns
});

window.addEventListener('pageshow', (e) => {
  if (shouldForceScreen2(e)) { ensureScreen2(); clearForceFlag(); }
  maybeOpenChatFromHash();
});

/* Nav offset */
function setNavOffset() {
  requestAnimationFrame(() => {
    if (!mainNav) return;
    const h = Math.ceil(mainNav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-offset', `${h}px`);
  });
}
window.addEventListener('load', setNavOffset);
window.addEventListener('resize', setNavOffset);

/* Welcome → Main */
nextBtn?.addEventListener("click", () => {
  if (!screen1 || !screen2) return;
  screen1.style.opacity = "0";
  setTimeout(() => { screen1.classList.remove("active"); screen2.classList.add("active"); setNavOffset(); }, 600);
});

/* Services hover blur */
services?.addEventListener("mouseenter", () => hero?.classList.add("fade"));
services?.addEventListener("mouseleave", () => hero?.classList.remove("fade"));

/* Mobile nav */
navToggle?.addEventListener('click', () => {
  const open = navMenu?.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(!!open));
});

/* ===== DROPDOWN SYSTEM ===== */
function initializeDropdowns() {
    const services = document.getElementById('services');
    if (!services) return;

    const link = services.querySelector('.dropdown');
    const arrow = services.querySelector('.dropdown-arrow');
    const menu = services.querySelector('.dropdown-menu');
    if (!link || !arrow || !menu) return;

    // Click handler for dropdown arrow only
    arrow.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const willShow = !menu.classList.contains('show');
        
        // Close all other dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
            if (otherMenu !== menu) {
                otherMenu.classList.remove('show');
                const otherArrow = otherMenu.closest('.has-dropdown')?.querySelector('.dropdown-arrow');
                if (otherArrow) {
                    otherArrow.style.transform = 'rotate(0deg)';
                    otherArrow.setAttribute('aria-expanded', 'false');
                }
            }
        });

        // Toggle this dropdown
        menu.classList.toggle('show', willShow);
        arrow.style.transform = willShow ? 'rotate(180deg)' : 'rotate(0deg)';
        arrow.setAttribute('aria-expanded', String(willShow));
        navBackdrop?.classList.toggle('show', willShow);
        hero?.classList.toggle('fade', willShow);
    });

    // Keep the text link functional for navigation/hover
    link.addEventListener('click', (ev) => {
        // Allow default behavior for the text link
        // Or you can make it go to a services page if you want
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (ev) => {
        if (!services.contains(ev.target)) {
            menu.classList.remove('show');
            arrow.style.transform = 'rotate(0deg)';
            arrow.setAttribute('aria-expanded', 'false');
            navBackdrop?.classList.remove('show');
            hero?.classList.remove('fade');
        }
    });

    // Close dropdown when pressing Escape key
    document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && menu.classList.contains('show')) {
            menu.classList.remove('show');
            arrow.style.transform = 'rotate(0deg)';
            arrow.setAttribute('aria-expanded', 'false');
            navBackdrop?.classList.remove('show');
            hero?.classList.remove('fade');
        }
    });

    // Close dropdown when clicking on backdrop
    navBackdrop?.addEventListener('click', () => {
        menu.classList.remove('show');
        arrow.style.transform = 'rotate(0deg)';
        arrow.setAttribute('aria-expanded', 'false');
        navBackdrop.classList.remove('show');
        hero?.classList.remove('fade');
    });

    // Close dropdown when clicking on menu items
    menu.querySelectorAll('a').forEach(menuItem => {
        menuItem.addEventListener('click', () => {
            menu.classList.remove('show');
            arrow.style.transform = 'rotate(0deg)';
            arrow.setAttribute('aria-expanded', 'false');
            navBackdrop?.classList.remove('show');
            hero?.classList.remove('fade');
        });
    });

    // Keyboard navigation for arrow
    arrow.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            arrow.click();
        }
    });
}

/* Smooth scroll from menu links (skip chat triggers) */
const qsa = (s) => Array.from(document.querySelectorAll(s));
qsa('nav a[href^="#"]').forEach(a => {
  a.addEventListener('click', (ev) => {
    const href = a.getAttribute('href') || '';
    const hash = href.toLowerCase();
    if (hash === '#chat' || hash === '#livechat') {
      ev.preventDefault(); ensureScreen2(); openChat(); return;
    }
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    ev.preventDefault();
    const go = () => { target.scrollIntoView({ behavior:"smooth", block:"start" }); revealSection(target); };
    if (!screen2?.classList.contains('active')) {
      screen1.style.opacity = "0";
      setTimeout(() => { screen1.classList.remove("active"); screen2.classList.add("active"); setOffset(); setTimeout(go, 120); }, 600);
    } else { go(); }
    document.querySelector('.dropdown-menu')?.classList.remove('show');
    navBackdrop?.classList.remove('show');
    hero?.classList.remove('fade');
  });
});

/* Reveal on scroll */
(function revealOnScroll(){
  const sections = qsa('section');
  if (!('IntersectionObserver' in window)) {
    sections.forEach(s => { s.querySelector('.section-content')?.classList.add('visible'); s.querySelector('.feature-visual')?.classList.add('show'); });
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        entry.target.querySelector('.section-content')?.classList.add('visible');
        entry.target.querySelector('.feature-visual')?.classList.add('show');
      }
    });
  }, { root: screen2, rootMargin: '0px 0px -10% 0px', threshold: [0,0.6,1] });
  sections.forEach(s => obs.observe(s));
})();

/* Back to top */
function trackBackToTop(){
  const st = screen2?.scrollTop || 0;
  if (st > 300) backBtn?.classList.add('show'); else backBtn?.classList.remove('show');
}
screen2?.addEventListener('scroll', trackBackToTop, { passive:true });
backBtn?.addEventListener('click', () => screen2?.scrollTo({ top:0, behavior:'smooth' }));
trackBackToTop();

/* ===== AUTH SYSTEM ===== */
function initializeAuth() {
  // Check if user is already logged in
  const userData = getUserData();
  if (userData) {
    updateAuthState(true, userData.email);
  }
  
  // Auth overlay close
  const closeAuth = document.getElementById('closeAuth');
  const authOverlay = document.getElementById('authOverlay');
  
  closeAuth?.addEventListener('click', closeAuthOverlay);
  authOverlay?.addEventListener('click', (e) => { 
    if (e.target === authOverlay) closeAuthOverlay(); 
  });
  
  // Global auth triggers
  document.addEventListener('click', function(e) {
    // Sign up triggers
    if (e.target.matches('#openSignup, #heroSignUp, [data-auth="signup"]') || 
        e.target.closest('#openSignup, #heroSignUp, [data-auth="signup"]')) {
      e.preventDefault();
      openAuth('signup');
    }
    
    // Sign in triggers  
    if (e.target.matches('#openLogin, [data-auth="login"]') || 
        e.target.closest('#openLogin, [data-auth="login"]')) {
      e.preventDefault();
      openAuth('login');
    }
    
    // Logout triggers
    if (e.target.matches('#logoutBtn') || e.target.closest('#logoutBtn')) {
      e.preventDefault();
      handleLogout();
    }
  });
  
  // Password toggle functionality
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('authPassword');
  
  if (togglePassword && passwordInput) {
    const ICON_OPEN = `<path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"/>`;
    const ICON_CLOSED = `<path d="M2.39 1.73L1.11 3l2.66 2.66C2.73 8.11 1 12 1 12s1.73 3.89 6 7c2.12 1.38 4.48 2 7 2 1.44 0 2.84-.21 4.13-.58L20.84 22l1.27-1.27L2.39 1.73zM12 17c-2.76 0-5-2.24-5-5 0-.86.22-1.66.6-2.36l1.53 1.53A3.94 3.94 0 0 0 8 12c0 2.21 1.79 4 4 4 .62 0 1.21-.15 1.74-.42l1.54 1.54A5.97 5.97 0 0 1 12 17z"/>`;
    
    togglePassword.innerHTML = ICON_OPEN;
    let isPwVisible = false;
    
    togglePassword.addEventListener('click', () => {
      isPwVisible = !isPwVisible;
      passwordInput.type = isPwVisible ? 'text' : 'password';
      togglePassword.innerHTML = isPwVisible ? ICON_CLOSED : ICON_OPEN;
    });
  }
  
  // Password strength indicator
  const passwordHint = document.getElementById('passwordHint');
  passwordInput?.addEventListener('input', (e) => {
    const v = e.target.value || '';
    const score = passwordScore(v);
    if (passwordHint){ 
      passwordHint.textContent = score.hint; 
      passwordHint.style.color = score.color; 
    }
  });
  
  // Form submission
  const authForm = document.getElementById('authForm');
  authForm?.addEventListener('submit', handleAuthSubmit);
  
  // Form validation on input
  authForm?.addEventListener('input', () => { 
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = false; 
  });
}

function showSignupFields(show) {
  const signupFields = document.querySelectorAll('.signup-field');
  signupFields.forEach(el => { 
    el.style.display = show ? 'block' : 'none'; 
  });
}

function setAuthMode(mode) {
  const submitBtn = document.getElementById('submitBtn');
  const authTitle = document.getElementById('authTitle');
  const authContainer = document.getElementById('authContainer');
  
  if (!submitBtn || !authTitle || !authContainer) return;
  
  submitBtn.dataset.mode = mode;
  if (mode === 'signup') { 
    authTitle.textContent = "Create Account"; 
    authContainer.classList.add('bubble'); 
    showSignupFields(true); 
  } else { 
    authTitle.textContent = "Sign In"; 
    authContainer.classList.remove('bubble'); 
    showSignupFields(false); 
  }
  submitBtn.disabled = false; 
  submitBtn.textContent = 'Continue'; 
  setFeedback('', true);
}

function openAuth(mode = 'signup') {
  const authOverlay = document.getElementById('authOverlay');
  if (!authOverlay) return;
  
  setAuthMode(mode); 
  authOverlay.classList.add('active'); 
  authOverlay.setAttribute('aria-hidden', 'false');
  
  // Reset form
  const authForm = document.getElementById('authForm');
  if (authForm) authForm.reset();
  
  // Clear feedback
  setFeedback('', true);
}

function closeAuthOverlay() {
  const authOverlay = document.getElementById('authOverlay');
  if (!authOverlay) return;
  
  authOverlay.classList.remove('active'); 
  authOverlay.setAttribute('aria-hidden', 'true');
}

function setFeedback(msg, ok) {
  const formFeedback = document.getElementById('formFeedback');
  if (!formFeedback) return;
  
  formFeedback.textContent = msg; 
  formFeedback.style.color = ok ? '#7dffb3' : '#ffd166';
}

function passwordScore(pw) {
  let s = 0; 
  if (pw.length >= 8) s++; 
  if (/[A-Z]/.test(pw)) s++; 
  if (/[a-z]/.test(pw)) s++; 
  if (/\d/.test(pw)) s++; 
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  
  const map = [
    {hint:"Too weak — use 8+ chars.", color:"#ff6b6b"},
    {hint:"Weak — add numbers.", color:"#ff8c69"},
    {hint:"Fair — add symbols.", color:"#ffd166"},
    {hint:"Good — add variety.", color:"#c1ff72"},
    {hint:"Strong password.", color:"#7dffb3"},
  ];
  return map[Math.min(s-1, map.length-1)] || map[0];
}

// Auth form submission
async function handleAuthSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;
  
  const mode = submitBtn.dataset.mode || 'signup';
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());
  
  const errors = validateAuth(payload, mode);
  if (errors.length) { 
    setFeedback(errors.join(' '), false); 
    return; 
  }
  
  setLoading(true);
  const res = await mockAuthAPI(payload, mode);
  setLoading(false);
  
  if (!res.ok) { 
    setFeedback(`❌ ${capitalize(mode)} failed: ${res.error}`, false); 
    return; 
  }
  
  setFeedback(`✅ ${capitalize(mode)} successful!`, true);
  setTimeout(() => {
    closeAuthOverlay();
    saveUserData(res.data.user);
    updateAuthState(true, res.data.user.email);
  }, 1500);
}

function validateAuth(p, mode) {
  const errs = [];
  if (!p.email || !/.+@.+\..+/.test(p.email)) errs.push('Valid email required.');
  if (!p.password || p.password.length < 8) errs.push('Password must be at least 8 characters.');
  if (mode === 'signup') { 
    ['firstName', 'lastName', 'dob', 'username', 'country'].forEach(f => { 
      if (!p[f]) errs.push(`${f.replace(/([A-Z])/g, ' $1').toLowerCase()} is required.`); 
    }); 
  }
  return errs;
}

function setLoading(is) { 
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;
  
  submitBtn.disabled = is; 
  submitBtn.textContent = is ? 'Please wait…' : 'Continue'; 
}

// Mock API - replace with real backend
async function mockAuthAPI(payload, mode) {
  return new Promise(resolve => {
    setTimeout(() => {
      // Simulate successful auth
      if (mode === 'signup') {
        resolve({ 
          ok: true, 
          data: { 
            user: {
              ...payload,
              id: Date.now().toString(),
              joined: new Date().toISOString()
            }, 
            token: 'mock-jwt-token' 
          } 
        });
      } else {
        // For login, check if user exists
        const existingUser = getUserData();
        if (existingUser && existingUser.email === payload.email) {
          resolve({ 
            ok: true, 
            data: { 
              user: existingUser,
              token: 'mock-jwt-token' 
            } 
          });
        } else {
          resolve({ ok: false, error: 'Invalid email or password' });
        }
      }
    }, 1000);
  });
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// User data management
function saveUserData(user) {
  try {
    localStorage.setItem('fintech_user', JSON.stringify(user));
    localStorage.setItem('fintech_logged_in', 'true');
  } catch (e) {
    console.warn('Local storage not available');
  }
}

function getUserData() {
  try {
    const user = localStorage.getItem('fintech_user');
    const loggedIn = localStorage.getItem('fintech_logged_in');
    return loggedIn === 'true' && user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function clearUserData() {
  try {
    localStorage.removeItem('fintech_user');
    localStorage.removeItem('fintech_logged_in');
  } catch (e) {
    console.warn('Local storage not available');
  }
}

function handleLogout() {
  clearUserData();
  updateAuthState(false);
  setFeedback('Logged out successfully', true);
}

// User state management
function updateAuthState(isLoggedIn, userEmail = '') {
  const authButtons = document.querySelector('.auth-buttons');
  if (!authButtons) return;
  
  if (isLoggedIn) {
    const userData = getUserData();
    const displayName = userData?.firstName || userData?.email || userEmail;
    
    authButtons.innerHTML = `
      <span class="user-welcome">Welcome, ${displayName}</span>
      <a href="#" class="sign-in" id="logoutBtn">Logout</a>
    `;
    
    // Update plan buttons for logged-in users
    document.querySelectorAll('[data-select-plan]').forEach(btn => {
      if (btn.textContent.includes('Select Plan')) {
        btn.textContent = btn.textContent.replace('Select Plan', 'Upgrade');
        btn.style.background = '#22c55e'; // Green for upgrade
      }
    });
  } else {
    authButtons.innerHTML = `
      <a href="#" class="sign-in" id="openLogin">Sign In</a>
      <a href="#" class="sign-up-btn" id="openSignup">Sign Up</a>
    `;
    
    // Reset plan buttons for logged-out users
    document.querySelectorAll('[data-select-plan]').forEach(btn => {
      if (btn.textContent.includes('Upgrade')) {
        btn.textContent = btn.textContent.replace('Upgrade', 'Select Plan');
        btn.style.background = ''; // Reset to default
      }
    });
  }
}

/* Calm animated background */
(function calmBackground(){
  if (!reactiveBg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const grid = reactiveBg.querySelector('.bg-grid');
  function tick(ts){
    const x = 0.50 + Math.sin(ts*0.0005)*0.08 + Math.sin(ts*0.0013 + 1.3)*0.02;
    const y = 0.45 + Math.cos(ts*0.0007)*0.06 + Math.sin(ts*0.0011 + 0.6)*0.02;
    reactiveBg.style.setProperty('--mx', `${(x*100).toFixed(2)}%`);
    reactiveBg.style.setProperty('--my', `${(y*100).toFixed(2)}%`);
    const g1 = 0.16 + 0.04*Math.sin(ts*0.0010 + 0.2);
    const g2 = 0.11 + 0.03*Math.sin(ts*0.0008 + 1.1);
    const g3 = 0.09 + 0.02*Math.sin(ts*0.0006 + 2.2);
    reactiveBg.style.setProperty('--g1', g1.toFixed(3));
    reactiveBg.style.setProperty('--g2', g2.toFixed(3));
    reactiveBg.style.setProperty('--g3', g3.toFixed(3));
    const tx = Math.sin(ts*0.00018)*10, ty = Math.cos(ts*0.00016)*10, rot = Math.sin(ts*0.00005)*0.6;
    grid && (grid.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${rot}deg)`);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

function revealSection(el){ 
  el.querySelector('.section-content')?.classList.add('visible'); 
  el.querySelector('.feature-visual')?.classList.add('show'); 
}

/* ===== Chat widget (Screen 2) ===== */
const chatFab   = document.getElementById('chatFab');
const chatPanel = document.getElementById('chatPanel');
const chatClose = document.getElementById('chatClose');
const chatForm  = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatBody  = document.getElementById('chatBody');

function openChat(){ 
  chatPanel?.classList.add('open'); 
  chatPanel?.setAttribute('aria-hidden','false'); 
  chatPanel?.removeAttribute('inert');
  setTimeout(()=>chatInput?.focus(), 20); 
}

function closeChat(){ 
  chatPanel?.classList.remove('open'); 
  chatPanel?.setAttribute('aria-hidden','true'); 
  chatPanel?.setAttribute('inert', 'true');
}

// Toggle on FAB
chatFab?.addEventListener('click', (e) => {
  e.stopPropagation();
  if (chatPanel?.classList.contains('open')) closeChat(); else openChat();
});

chatClose?.addEventListener('click', closeChat);
document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeChat(); });

// Chat form submission
chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = chatInput?.value.trim();
  if (!message) return;
  
  // Add user message
  addChatMessage(message, 'user');
  chatInput.value = '';
  
  // Simulate bot response
  setTimeout(() => {
    const responses = [
      "I understand you're asking about: " + message,
      "Thanks for your question! Our support team can help with that.",
      "I've noted your inquiry. Would you like me to connect you with a specialist?",
      "That's a great question! Let me find the best resources for you."
    ];
    const response = responses[Math.floor(Math.random() * responses.length)];
    addChatMessage(response, 'bot');
  }, 1000);
});

function addChatMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}`;
  msgDiv.textContent = text;
  chatBody?.appendChild(msgDiv);
  chatBody?.scrollTo(0, chatBody.scrollHeight);
}

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

/* Global chat triggers via event delegation (robust) */
document.addEventListener('click', (ev) => {
  const t = ev.target.closest('[data-open-chat], a[href="#chat"], a[href="#livechat"], a[href$="#chat"], a[href$="#livechat"]');
  if (!t) return;
  ev.preventDefault();
  ensureScreen2();
  openChat();
});

/* Deep-link open */
function maybeOpenChatFromHash(){
  const h = (location.hash || '').toLowerCase();
  if (h === '#chat' || h === '#livechat') { ensureScreen2(); openChat(); }
}

// Initialize chat panel state
if (chatPanel) {
  chatPanel.setAttribute('aria-hidden', 'true');
  chatPanel.setAttribute('inert', 'true');
}