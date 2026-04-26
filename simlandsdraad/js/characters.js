import { S, FC, FE, fc, miniBar } from './shared.js';

const DYNAMIC_TAGS = new Set(['paranoid','suspicious','guarded','grieving','emboldened','battle-scarred','ruthless','isolated','blood-feud']);

export function renderCharacters() {
  const p = document.getElementById('p-characters');
  let h = '<div class="filter-bar"><button class="filter-btn active" data-f="all">All</button>';
  S.D.factions.forEach(f => { h += `<button class="filter-btn" data-f="${f.id}" style="--fc:${FC[f.id]}">${FE[f.id]} ${f.name}</button>` });
  h += '</div><div class="char-grid" id="charGrid"></div>';
  p.innerHTML = h;
  p.querySelectorAll('.filter-btn').forEach(b => {
    b.onclick = () => { p.querySelectorAll('.filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active'); S.activeFilter = b.dataset.f; drawChars(); };
  });
  drawChars();
}

function drawChars() {
  const g = document.getElementById('charGrid');
  const chars = S.activeFilter === 'all' ? S.D.characters : S.D.characters.filter(c => c.faction === S.activeFilter);
  const maxV = Math.max(1, ...S.D.characters.map(c => c.valence));
  const maxW = Math.max(1, ...chars.map(c => c.wealth));
  g.innerHTML = chars.map(c => {
    const col = fc(c.id);
    const vp = Math.min(100, c.valence / 200 * 100), ap = Math.min(100, c.arousal / 100 * 100), hp = c.health;
    const wp = Math.min(100, c.wealth / maxW * 100);
    let favors = '';
    if (c.favors_owed?.length) favors += `Owes: ${c.favors_owed.map(f => `${f.count}→${S.charMap[f.to]?.name || f.to}`).join(', ')} `;
    if (c.favors_held?.length) favors += `Held: ${c.favors_held.map(f => `${f.count}←${S.charMap[f.from]?.name || f.from}`).join(', ')}`;
    return `<div class="char-card${c.wounded ? ' wounded' : ''}" style="border-top-color:${col}">
      <h3>${FE[c.faction] || ''} ${c.name} ${c.wounded ? '<span class="wounded-badge">WOUNDED</span>' : ''}<span class="rank">R${c.rank}</span></h3>
      <div class="tags">${[...c.tags, ...(c.personalityTags || [])].map(t => `<span class="tag${c.personalityTags?.includes(t) ? ' personality' : ''}${DYNAMIC_TAGS.has(t) ? ' dynamic ' + t : ''}">${t}</span>`).join('')}</div>
      ${miniBar('Valence', vp, c.valence, col)}${miniBar('Arousal', ap, c.arousal, '#d4763c')}
      ${miniBar('Health', hp, c.health, c.wounded ? '#b54a4a' : '#4ab57a')}${miniBar('Wealth', wp, c.wealth, '#c4a35a')}
      ${favors ? `<div class="favors">${favors}</div>` : ''}
      <div style="font-size:.7rem;color:#666;margin-top:4px">Prestige: ${c.prestige}</div>
    </div>`;
  }).join('');
}
