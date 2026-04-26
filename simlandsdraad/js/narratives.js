// js/narratives.js — Narrative chronicle panel
import { S } from './shared.js';

export function renderNarratives() {
  const panel = document.getElementById('p-narratives');
  if (!panel || !S.D) return;

  const contexts = S.D.narrativeContexts || [];
  if (!contexts.length) {
    panel.innerHTML = '<p style="padding:16px;color:#888">No narratives generated.</p>';
    return;
  }

  // Group by tick
  const byTick = {};
  for (const c of contexts) {
    const tick = c.tick ?? '?';
    if (!byTick[tick]) byTick[tick] = [];
    byTick[tick].push(c);
  }

  const ticks = Object.keys(byTick).sort((a, b) => b - a);

  let html = `<div style="padding:12px 16px;display:flex;justify-content:space-between;align-items:center">
    <h3 style="margin:0;color:var(--gold)">Narrative Chronicle</h3>
    <span style="color:#888;font-size:.85rem">${contexts.length} entries across ${ticks.length} weeks</span>
  </div>`;

  // Filter controls
  html += `<div style="padding:4px 16px 8px;display:flex;gap:8px;flex-wrap:wrap">
    <input id="narr-search" placeholder="Search narratives..." style="flex:1;min-width:200px;padding:6px 10px;background:var(--bg);border:1px solid #333;color:var(--text);border-radius:4px;font-size:.85rem">
    <select id="narr-action-filter" style="padding:6px 10px;background:var(--bg);border:1px solid #333;color:var(--text);border-radius:4px;font-size:.85rem">
      <option value="">All actions</option>
    </select>
    <select id="narr-char-filter" style="padding:6px 10px;background:var(--bg);border:1px solid #333;color:var(--text);border-radius:4px;font-size:.85rem">
      <option value="">All characters</option>
    </select>
  </div>`;

  // Build entries
  html += '<div id="narr-entries" style="max-height:calc(100vh - 180px);overflow-y:auto">';
  for (const tick of ticks) {
    const entries = byTick[tick];
    html += `<div class="narr-tick" style="padding:8px 16px;border-bottom:1px solid #222">
      <div style="color:var(--gold);font-size:.8rem;font-weight:600;margin-bottom:4px">Week ${tick}</div>`;
    for (const c of entries) {
      const char = c.character?.name || c.character || '?';
      const action = c.action?.name || c.action || '?';
      const narrative = c.narrative || '';
      const faction = c.character?.faction || c.faction || '';
      if (!narrative) continue;

      html += `<div class="narr-entry" data-action="${action}" data-char="${char}" style="padding:4px 0 8px;margin-left:8px;border-left:2px solid #333;padding-left:10px">
        <div style="display:flex;gap:8px;align-items:baseline;margin-bottom:2px">
          <span style="color:var(--text);font-weight:600;font-size:.85rem">${char}</span>
          <span style="color:#666;font-size:.75rem">${action}</span>
          ${faction ? `<span style="color:#555;font-size:.7rem">${faction}</span>` : ''}
        </div>
        <div style="color:#aaa;font-size:.85rem;line-height:1.5">${narrative}</div>
      </div>`;
    }
    html += '</div>';
  }
  html += '</div>';

  panel.innerHTML = html;

  // Populate filters
  const actions = [...new Set(contexts.map(c => c.action?.name || c.action).filter(Boolean))].sort();
  const chars = [...new Set(contexts.map(c => c.character?.name || c.character).filter(Boolean))].sort();

  const actionSelect = document.getElementById('narr-action-filter');
  for (const a of actions) {
    const opt = document.createElement('option');
    opt.value = a; opt.textContent = a;
    actionSelect.appendChild(opt);
  }

  const charSelect = document.getElementById('narr-char-filter');
  for (const ch of chars) {
    const opt = document.createElement('option');
    opt.value = ch; opt.textContent = ch;
    charSelect.appendChild(opt);
  }

  // Filter logic
  const applyFilter = () => {
    const search = (document.getElementById('narr-search')?.value || '').toLowerCase();
    const actionF = document.getElementById('narr-action-filter')?.value || '';
    const charF = document.getElementById('narr-char-filter')?.value || '';

    for (const entry of panel.querySelectorAll('.narr-entry')) {
      const matchAction = !actionF || entry.dataset.action === actionF;
      const matchChar = !charF || entry.dataset.char === charF;
      const matchSearch = !search || entry.textContent.toLowerCase().includes(search);
      entry.style.display = (matchAction && matchChar && matchSearch) ? '' : 'none';
    }
  };

  document.getElementById('narr-search')?.addEventListener('input', applyFilter);
  document.getElementById('narr-action-filter')?.addEventListener('change', applyFilter);
  document.getElementById('narr-char-filter')?.addEventListener('change', applyFilter);
}
