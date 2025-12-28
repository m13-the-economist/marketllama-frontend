/* =========================
   ACCOUNTS PAGE LOGIC
   ========================= */

   const liveContainer = document.getElementById('liveAccounts');
   const demoContainer = document.getElementById('demoAccounts');
   
   const balances = {
     live: { balance: 0, currency: 'USD' },
     demo: { balance: 0, currency: 'USD' }
   };
   
   /* -------------------------
      RENDER ACCOUNT CARD
   -------------------------- */
   function renderAccountCard({ id, type, broker, balance, currency }) {
     const card = document.createElement('div');
     card.className = 'account-card';
     card.dataset.id = id;
   
     card.innerHTML = `
       <div class="card-head">
         <span class="chip chip-${type}">${type.toUpperCase()}</span>
         <span class="chip chip-broker">${broker}</span>
       </div>
   
       <div class="card-body">
         <div class="big-amount balance-value">
           ${Number(balance).toFixed(2)} ${currency}
         </div>
         <button class="icon-btn sm balance-toggle">
           <iconify-icon class="ic eye-icon" icon="mdi:eye-outline"></iconify-icon>
         </button>
       </div>
   
       <div class="line-art"></div>
     `;
   
     if (type === 'live') {
       liveContainer.appendChild(card);
     } else {
       demoContainer.appendChild(card);
     }
   }
   
   /* -------------------------
      TOP BALANCE
   -------------------------- */
   function renderTopBalance() {
     const el = document.querySelector('.total-balance');
     if (!el) return;
   
     const total =
       balances.live.balance + balances.demo.balance;
   
     el.textContent = `${total.toFixed(2)} USD`;
   }
   
   /* -------------------------
      FETCH + RENDER ACCOUNTS
   -------------------------- */
   async function fetchAccounts() {
     try {
       const res = await fetch('/api/accounts');
       const data = await res.json();
   
       // Reset containers
       liveContainer.innerHTML = '';
       demoContainer.innerHTML = '';
   
       // Reset balances
       balances.live.balance = 0;
       balances.demo.balance = 0;
   
       const liveAccounts = data.filter(a => a.type === 'live');
       const demoAccounts = data.filter(a => a.type === 'demo');
   
       /* ---- LIVE ---- */
       if (liveAccounts.length > 0) {
         liveAccounts.forEach(acc => {
           balances.live.balance += Number(acc.balance || 0);
           balances.live.currency = acc.currency || 'USD';
   
           renderAccountCard({
             id: acc.id,
             type: 'live',
             broker: acc.broker || 'Deriv',
             balance: acc.balance || 0,
             currency: acc.currency || 'USD'
           });
         });
       } else {
         // 🔒 GUARANTEED LIVE VISIBILITY
         renderAccountCard({
           id: 'live-default',
           type: 'live',
           broker: 'Deriv',
           balance: 0,
           currency: 'USD'
         });
       }
   
       /* ---- DEMO ---- */
       if (demoAccounts.length > 0) {
         demoAccounts.forEach(acc => {
           balances.demo.balance += Number(acc.balance || 0);
           balances.demo.currency = acc.currency || 'USD';
   
           renderAccountCard({
             id: acc.id,
             type: 'demo',
             broker: acc.broker || 'Deriv',
             balance: acc.balance || 0,
             currency: acc.currency || 'USD'
           });
         });
       } else {
         renderAccountCard({
           id: 'demo-default',
           type: 'demo',
           broker: 'Deriv',
           balance: 0,
           currency: 'USD'
         });
       }
   
       renderTopBalance();
   
     } catch (err) {
       console.error('Accounts fetch failed', err);
   
       // Absolute fallback — UI NEVER EMPTY
       liveContainer.innerHTML = '';
       demoContainer.innerHTML = '';
   
       renderAccountCard({
         id: 'live-fallback',
         type: 'live',
         broker: 'Deriv',
         balance: 0,
         currency: 'USD'
       });
   
       renderAccountCard({
         id: 'demo-fallback',
         type: 'demo',
         broker: 'Deriv',
         balance: 0,
         currency: 'USD'
       });
   
       renderTopBalance();
     }
   }
   
   /* -------------------------
      INIT
   -------------------------- */
   document.addEventListener('DOMContentLoaded', fetchAccounts);