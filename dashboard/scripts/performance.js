// performance.js — LIVE DATA WIRING (NO UI SIDE EFFECTS)
(() => {
    'use strict';
  
    if (window.__ML_PERFORMANCE_READY__) return;
    window.__ML_PERFORMANCE_READY__ = true;
  
    document.addEventListener('DOMContentLoaded', start);
  
    function start() {
      if (!window.MLAuth) {
        console.warn('MLAuth not ready, retrying...');
        setTimeout(start, 100);
        return;
      }
  
      if (!MLAuth.getToken()) {
        window.location.href = '../landing/signin.html';
        return;
      }
  
      init();
    }
  
    function init() {
      wireKPIs();
      wireTradeHistory();
    }
  
    /* =========================
       KPIs
    ========================= */
    async function wireKPIs() {
      try {
        const data = await MLAuth.apiFetch('/api/performance/overview');
  
        setText('kpiDays', data.days_traded);
        setText('kpiTrades', data.total_trades);
        setText('kpiLots', data.total_lots);
        setText('kpiWin', data.win_rate + '%');
        setText('kpiLoss', data.loss_rate + '%');
  
      } catch (e) {
        console.error('Performance KPI fetch failed', e);
      }
    }
  
    /* =========================
       TRADE HISTORY
    ========================= */
    async function wireTradeHistory() {
      try {
        const rows = await MLAuth.apiFetch('/api/performance/history');
        const tbody = document.getElementById('tradeBody');
  
        if (!tbody) return;
  
        tbody.innerHTML = '';
  
        if (!Array.isArray(rows) || rows.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="6" style="text-align:center;color:#888;">
                No trades yet
              </td>
            </tr>
          `;
          return;
        }
  
        rows.forEach(trade => {
          const tr = document.createElement('tr');
  
          const pnlClass = trade.pnl >= 0 ? 'pnl-green' : 'pnl-red';
          const sideClass = trade.side === 'buy' ? 'buy' : 'sell';
  
          tr.innerHTML = `
            <td>${trade.symbol}</td>
            <td><span class="badge ${sideClass}">${trade.side.toUpperCase()}</span></td>
            <td>${trade.lot_size}</td>
            <td>${trade.entry_price}</td>
            <td>${trade.exit_price}</td>
            <td class="${pnlClass}">
              ${trade.pnl >= 0 ? '+' : ''}${trade.pnl}
            </td>
          `;
  
          tbody.appendChild(tr);
        });
  
      } catch (e) {
        console.error('Trade history fetch failed', e);
      }
    }
  
    /* =========================
       HELPERS
    ========================= */
    function setText(id, value) {
      const el = document.getElementById(id);
      if (el && value !== undefined && value !== null) {
        el.textContent = value;
      }
    }
  })();