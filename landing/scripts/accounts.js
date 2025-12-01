console.log('[accounts] boot');

const screen2 = document.getElementById('screen2');
const mainNav = document.getElementById('mainNav');
const navToggle = document.getElementById('navToggle');
const navMenu   = document.getElementById('navMenu');
const services  = document.getElementById('services');
const backBtn   = document.getElementById('backToTop');

function setNavOffset(){
  requestAnimationFrame(() => {
    if (!mainNav) return;
    const h = Math.ceil(mainNav.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--nav-offset', `${h}px`);
  });
}
window.addEventListener('load', setNavOffset);
window.addEventListener('resize', setNavOffset);

navToggle?.addEventListener('click', () => {
  const isOpen = navMenu?.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(!!isOpen));
});

/* Dropdown behavior similar to other pages */
(function dropdown(){
  const li = services; if (!li) return;
  const link = li.querySelector('.dropdown');
  const menu = li.querySelector('.dropdown-menu'); if (!link || !menu) return;

  link.addEventListener('click', (ev) => {
    ev.preventDefault();
    const willShow = !menu.classList.contains('show');
    menu.classList.toggle('show', willShow);
    link.setAttribute('aria-expanded', String(willShow));
  });
  document.addEventListener('click', (ev) => {
    if (!li.contains(ev.target)) {
      menu.classList.remove('show');
      link.setAttribute('aria-expanded','false');
    }
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

/* Tabs (event delegation) */
document.addEventListener('click', (ev) => {
  const tab = ev.target.closest('.tab');
  if (!tab) return;
  const allTabs = Array.from(document.querySelectorAll('.tab'));
  const panels  = Array.from(document.querySelectorAll('.panel'));
  allTabs.forEach(t => t.setAttribute('aria-selected', 'false'));
  panels.forEach(p => p.classList.remove('active'));

  tab.setAttribute('aria-selected','true');
  const panelId = tab.getAttribute('aria-controls');
  const target  = panelId ? document.getElementById(panelId) : null;
  if (target){ target.classList.add('active'); target.focus({ preventScroll:true }); target.scrollIntoView({ behavior:'smooth', block:'start' }); }
});

/* Quick action "Link a Broker" from Overview */
document.querySelectorAll('[data-tab="brokers"]').forEach(el => {
  el.addEventListener('click', (e) => {
    // simulate clicking the Brokers tab
    const brokersTab = document.getElementById('tab-brokers');
    if (brokersTab) brokersTab.click();
  });
});

/* Linked Brokers: simple mock linking */
const brokersEmpty = document.getElementById('brokersEmpty');
const brokersList  = document.getElementById('brokersList');
const btnConnect   = document.getElementById('btnConnectBroker');
const btnAddApi    = document.getElementById('btnAddApi');
const brokersCount = document.getElementById('brokers-count');

function renderBrokerRow(name, type){
  const row = document.createElement('div');
  row.className = 'row-line';
  row.innerHTML = `<div><strong>${name}</strong> <span class="muted">(${type})</span></div>
                   <div style="display:flex; gap:8px;">
                     <button class="btn" data-action="sync">Sync</button>
                     <button class="btn" data-action="remove">Remove</button>
                   </div>`;
  row.querySelector('[data-action="remove"]').addEventListener('click', () => {
    row.remove();
    if (!brokersList.children.length){ brokersList.style.display='none'; brokersEmpty.style.display='block'; setCount(0); }
  });
  row.querySelector('[data-action="sync"]').addEventListener('click', () => {
    row.querySelector('[data-action="sync"]').textContent = 'Synced ✓';
    setTimeout(()=> row.querySelector('[data-action="sync"]').textContent = 'Sync', 1200);
  });
  return row;
}

function setCount(n){
  brokersCount && (brokersCount.textContent = String(n));
}

btnConnect?.addEventListener('click', () => {
  brokersEmpty.style.display='none';
  brokersList.style.display='flex';
  brokersList.appendChild(renderBrokerRow('DemoBroker', 'OAuth'));
  setCount(brokersList.children.length);
});

btnAddApi?.addEventListener('click', () => {
  brokersEmpty.style.display='none';
  brokersList.style.display='flex';
  brokersList.appendChild(renderBrokerRow('AlphaTrade', 'API Keys'));
  setCount(brokersList.children.length);
});

/* Profile & KYC */
const kycForm = document.getElementById('kycForm');
const btnSubmitKyc = document.getElementById('btnSubmitKyc');
const kycMsg = document.getElementById('kycMsg');
const kycStatus = document.getElementById('kyc-status');

kycForm?.addEventListener('input', () => { btnSubmitKyc && (btnSubmitKyc.disabled = !kycForm.checkValidity()); });
kycForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  btnSubmitKyc.disabled = true;
  kycMsg.textContent = 'Submitted. Verification in progress (ETA: under review).';
  kycStatus.classList.remove('warn'); kycStatus.classList.add('ok'); kycStatus.textContent = 'Pending Review';
  setTimeout(()=> { kycStatus.textContent = 'Verified'; kycMsg.textContent = 'KYC verified. You’re good to go.'; }, 1500);
});

/* Security */
const twofaToggle = document.getElementById('twofaToggle');
const twofaLabel  = document.getElementById('twofaLabel');
const twofaStatus = document.getElementById('twofa-status');
twofaToggle?.addEventListener('change', () => {
  const on = twofaToggle.checked;
  twofaLabel.textContent = on ? 'Enabled' : 'Disabled';
  if (twofaStatus){ twofaStatus.textContent = on ? 'On' : 'Off'; twofaStatus.classList.toggle('ok', on); }
});

/* Alerts toggles just visual */
['alertLogin','alertWithdrawal'].forEach(id => {
  const el = document.getElementById(id);
  el?.addEventListener('change', () => console.log('[alerts]', id, el.checked));
});

/* Change Password (mock) */
const pwForm = document.getElementById('pwForm');
const btnChangePw = document.getElementById('btnChangePw');
const pwMsg = document.getElementById('pwMsg');
pwForm?.addEventListener('input', () => {
  const ok = pwForm.curPw?.value && (pwForm.newPw?.value || document.getElementById('newPw')?.value);
  btnChangePw && (btnChangePw.disabled = !ok);
});
pwForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  btnChangePw.disabled = true;
  pwMsg.textContent = 'Password updated.';
  setTimeout(()=> { pwMsg.textContent=''; btnChangePw.disabled=false; pwForm.reset(); }, 1200);
});

/* Preferences actions (mock) */
document.getElementById('btnExport')?.addEventListener('click', () => alert('Export request queued.'));
document.getElementById('btnDelete')?.addEventListener('click', () => alert('Deletion request submitted for review.'));
document.getElementById('themeToggle')?.addEventListener('change', (e) => {
  document.documentElement.classList.toggle('theme-dark', e.target.checked);
});

/* KPI demo pulse (optional) */
(function kpiPulse(){
  const el = document.getElementById('kpi-pl');
  if (!el) return;
  let v = 1284;
  setInterval(()=> { v += Math.round((Math.random()-0.5)*50); el.textContent = (v>=0?'+ ':'- $') + Math.abs(v); }, 2200);
})();