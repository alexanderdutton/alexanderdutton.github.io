// Missions panel for SimLandsdraad dashboard
import { S, FC, FE, fmt, bar, miniBar, fc } from './shared.js';

const TYPE_ICON = { intelligence: '🔍', diplomatic: '🤝', economic: '💰', covert: '🗡️', ceremonial: '👑' };
const TYPE_COLOR = { intelligence: '#9a4ab5', diplomatic: '#4ab57a', economic: '#b5a04a', covert: '#b54a4a', ceremonial: '#c4a35a' };
const OUTCOME_ICON = { success: '✅', partial: '🔶', failure: '❌', betrayal: '💀' };
const OUTCOME_COLOR = { success: '#4ab57a', partial: '#c4a35a', failure: '#b54a4a', betrayal: '#b54a4a' };

export function renderMissions() {
  const panel = document.getElementById('p-missions');
  if (!panel || !S.D?.missions) return;

  const missions = S.D.missions || [];
  const active = missions.filter(m => !m.outcome);
  const completed = missions.filter(m => m.outcome);

  // Stats
  const stats = {
    total: missions.length,
    active: active.length,
    success: completed.filter(m => m.outcome === 'success').length,
    partial: completed.filter(m => m.outcome === 'partial').length,
    failed: completed.filter(m => m.outcome === 'failure').length,
    betrayed: completed.filter(m => m.outcome === 'betrayal').length,
  };

  // Group by leader
  const byLeader = {};
  for (const m of missions) {
    const key = m.leaderName || m.leaderId;
    if (!byLeader[key]) byLeader[key] = [];
    byLeader[key].push(m);
  }

  let html = `
    <div class="stats-row">
      <div class="stat-card"><div class="label">Total Missions</div><div class="value">${stats.total}</div></div>
      <div class="stat-card"><div class="label">Active</div><div class="value" style="color:#4a7ab5">${stats.active}</div></div>
      <div class="stat-card"><div class="label">Successes</div><div class="value" style="color:#4ab57a">${stats.success}</div></div>
      <div class="stat-card"><div class="label">Failures</div><div class="value" style="color:#b54a4a">${stats.failed}</div></div>
      ${stats.betrayed ? `<div class="stat-card"><div class="label">Betrayals</div><div class="value" style="color:#b54a4a">${stats.betrayed}</div></div>` : ''}
    </div>`;

  // Active missions
  if (active.length > 0) {
    html += `<h3 style="color:var(--gold);font-size:.9rem;margin:16px 0 8px">Active Missions</h3>`;
    for (const m of active) {
      html += renderMissionCard(m);
    }
  }

  // Completed missions
  if (completed.length > 0) {
    html += `<h3 style="color:var(--gold);font-size:.9rem;margin:16px 0 8px">Completed Missions</h3>`;
    for (const m of completed.reverse()) {
      html += renderMissionCard(m);
    }
  }

  // By leader summary
  if (Object.keys(byLeader).length > 0) {
    html += `<h3 style="color:var(--gold);font-size:.9rem;margin:16px 0 8px">Mission Ledger by Leader</h3>`;
    html += `<div class="faction-grid">`;
    for (const [leader, leaderMissions] of Object.entries(byLeader)) {
      const leaderChar = S.D.characters.find(c => c.name === leader);
      const color = leaderChar ? fc(leaderChar.id) : '#888';
      const wins = leaderMissions.filter(m => m.outcome === 'success').length;
      const losses = leaderMissions.filter(m => m.outcome === 'failure' || m.outcome === 'betrayal').length;
      const ongoing = leaderMissions.filter(m => !m.outcome).length;
      html += `<div class="faction-card" style="border-left-color:${color}">
        <h3 style="color:${color}">${leader} <span style="color:#666;font-size:.75rem">${wins}W ${losses}L ${ongoing} active</span></h3>
        <div style="font-size:.75rem;color:#888">
        ${leaderMissions.map(m => `<div>${TYPE_ICON[m.type] || '📋'} ${m.goal} — ${m.outcome ? OUTCOME_ICON[m.outcome] + ' ' + m.outcome : '⏳ ' + Math.round(m.progress * 100) + '%'}</div>`).join('')}
        </div>
      </div>`;
    }
    html += `</div>`;
  }

  if (missions.length === 0) {
    html += `<p style="color:#666;text-align:center;margin-top:20%">No missions recorded in this run.</p>`;
  }

  panel.innerHTML = html;
}

function renderMissionCard(m) {
  const leaderChar = S.D.characters.find(c => c.name === (m.leaderName || m.leaderId));
  const delegateChar = S.D.characters.find(c => c.name === (m.delegateName || m.delegateId));
  const color = TYPE_COLOR[m.type] || '#888';
  const outcomeColor = m.outcome ? OUTCOME_COLOR[m.outcome] : '#4a7ab5';

  return `<div style="background:var(--bg3);border-radius:8px;padding:10px 14px;border-left:3px solid ${color};margin-bottom:8px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
      <span style="font-weight:600;font-size:.85rem">${TYPE_ICON[m.type] || '📋'} ${m.goal}</span>
      <span style="font-size:.75rem;padding:2px 8px;border-radius:4px;background:${outcomeColor}22;color:${outcomeColor}">${m.outcome ? OUTCOME_ICON[m.outcome] + ' ' + m.outcome : '⏳ ' + Math.round(m.progress * 100) + '%'}</span>
    </div>
    <div style="font-size:.75rem;color:#888">
      <span style="color:${leaderChar ? fc(leaderChar.id) : '#888'}">${m.leaderName}</span> →
      <span style="color:${delegateChar ? fc(delegateChar.id) : '#888'}">${m.delegateName}</span>
      ${m.targetFaction ? ` → <span style="color:${FC[m.targetFaction] || '#888'}">${FE[m.targetFaction] || ''} ${m.targetFaction}</span>` : ''}
      <span style="margin-left:8px">🔍 Secrecy: ${m.secrecy}</span>
      ${m.remainingTicks ? `<span style="margin-left:8px">⏱ ${m.remainingTicks} ticks left</span>` : ''}
    </div>
    ${!m.outcome ? `<div style="margin-top:6px"><div class="bar-track" style="height:6px;background:var(--bg)"><div class="bar-fill" style="width:${Math.round(m.progress * 100)}%;background:${color}"></div></div></div>` : ''}
  </div>`;
}
