import { S, setSimData } from './shared.js';
import { renderOverview } from './overview.js';
import { renderCharacters } from './characters.js';
import { renderRelationships } from './relationships.js';
import { renderTimeline } from './timeline.js';
import { renderChronicle } from './chronicle.js';
import { renderTrends } from './trends.js';
import { renderFactions } from './factions.js';
import { renderCombat } from './combat.js';
import { renderMissions } from './missions.js';

async function init() {
  try {
    const r = await fetch('./sim_output.json');
    const data = await r.json();
    setSimData(data);
  } catch (e) {
    document.body.innerHTML = '<h2 style="color:#c4a35a;text-align:center;margin-top:20%">No sim_output.json found. Place it next to index.html or serve via http.</h2>';
    return;
  }
  document.getElementById('subtitle').textContent = `${S.D.meta.totalTicks} ticks · ${S.D.characters.length} characters · ${S.D.chronicle.length} events · ${new Date(S.D.meta.runDate).toLocaleDateString()}`;
  buildTabs();
  renderOverview();
  renderCharacters();
  renderChronicle();
}

function buildTabs() {
  document.querySelectorAll('.tab').forEach(t => {
    t.onclick = () => {
      document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById('p-' + t.dataset.tab).classList.add('active');
      if (t.dataset.tab === 'relationships') renderRelationships();
      if (t.dataset.tab === 'timeline') renderTimeline();
      if (t.dataset.tab === 'trends') renderTrends();
      if (t.dataset.tab === 'factions') renderFactions();
      if (t.dataset.tab === 'missions') renderMissions();
      if (t.dataset.tab === 'combat') renderCombat();
    };
  });
}

init();
