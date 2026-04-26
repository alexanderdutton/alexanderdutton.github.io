import { S, FC, fc, FE, bar, fmt, ACT_TAG, TAG_COLOR } from './shared.js';

export function renderOverview() {
  const p = document.getElementById('p-overview');
  const totalActs = Object.values(S.D.actionCounts).reduce((a, b) => a + b, 0);
  const wounded = S.D.characters.filter(c => c.wounded).length;
  const busiest = S.D.characters.reduce((a, b) => {
    const ca = S.D.chronicle.filter(e => e.initiator === a.id).length;
    const cb = S.D.chronicle.filter(e => e.initiator === b.id).length;
    return ca >= cb ? a : b;
  });

  let h = `<div class="stats-row">
    <div class="stat-card"><div class="label">Total Actions</div><div class="value">${totalActs}</div></div>
    <div class="stat-card"><div class="label">Most Active</div><div class="value" style="font-size:1.1rem">${busiest.name}</div></div>
    <div class="stat-card"><div class="label">Wounded</div><div class="value">${wounded}</div></div>
    <div class="stat-card"><div class="label">Factions</div><div class="value">${S.D.factions.length}</div></div>
  </div>`;

  h += '<div class="faction-grid">';
  const maxT = Math.max(1, ...S.D.factions.map(f => f.treasury));
  const maxM = Math.max(1, ...S.D.factions.map(f => f.military));
  const maxR = Math.max(1, ...S.D.factions.map(f => f.monthly_revenue));
  const maxS = Math.max(1, ...S.D.factions.map(f => f.choam_shares));
  S.D.factions.forEach(f => {
    const c = FC[f.id] || '#888';
    h += `<div class="faction-card" style="border-left-color:${c}">
      <h3>${FE[f.id] || ''} ${f.name} <span style="color:#888;font-size:.75rem">${fmt(f.treasury)}₮</span></h3>
      ${bar('Treasury', f.treasury, maxT, c)}${bar('Revenue', f.monthly_revenue, maxR, c)}
      ${bar('CHOAM', f.choam_shares, maxS, c)}${bar('Military', f.military, maxM, c)}
    </div>`;
  });
  h += '</div>';

  h += '<div class="chart-section"><h3>Action Distribution</h3><canvas id="actionChart"></canvas></div>';
  p.innerHTML = h;
  drawActionChart();
}

function drawActionChart() {
  const cv = document.getElementById('actionChart'); if (!cv) return;
  const ctx = cv.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  cv.width = cv.clientWidth * dpr; cv.height = 300 * dpr; ctx.scale(dpr, dpr);
  const w = cv.clientWidth, h = 300;
  const sorted = Object.entries(S.D.actionCounts).sort((a, b) => b[1] - a[1]).slice(0, 15);
  const maxA = Math.max(1, ...sorted.map(s => s[1]));
  const bw = Math.min(40, (w - 60) / sorted.length - 4);
  const gap = (w - 40 - bw * sorted.length) / (sorted.length + 1);
  const barBottom = 200;
  sorted.forEach(([act, count], i) => {
    const x = 20 + gap + (bw + gap) * i; const bh = count / maxA * 170;
    const tag = ACT_TAG[act] || 'neutral';
    ctx.fillStyle = TAG_COLOR[tag] || '#666'; ctx.fillRect(x, barBottom - bh, bw, bh);
    ctx.fillStyle = '#aaa'; ctx.font = '10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(count, x + bw / 2, barBottom - bh - 4);
    ctx.fillStyle = '#999'; ctx.font = '11px system-ui'; ctx.textAlign = 'right'; ctx.save(); ctx.translate(x + bw / 2, barBottom + 8);
    ctx.rotate(-Math.PI / 3); ctx.fillText(act, 0, 0); ctx.restore();
  });
}
