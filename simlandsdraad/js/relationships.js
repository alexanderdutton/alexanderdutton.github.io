import { S, FC, FE, fc } from './shared.js';

const NOTABLE_THRESHOLD = 15; // |affection| or |respect| must exceed this to show edge

let relNodes, relEdges, selectedNode = null, relAnim = null;

export function renderRelationships() {
  const p = document.getElementById('p-relationships');

  p.innerHTML = `
    <div style="margin-bottom:12px">
      <span style="font-size:.7rem;color:#666">Showing notable relationships only (|affection| or |respect| > ${NOTABLE_THRESHOLD})</span>
    </div>
    <div id="relLayout" style="display:flex;gap:16px;height:calc(100vh - 200px);min-height:500px">
      <div id="relGraph" style="flex:1;position:relative;min-width:0">
        <canvas id="relCanvas" style="width:100%;height:100%;border-radius:8px;background:var(--bg2)"></canvas>
      </div>
      <div id="relSidebar" style="width:280px;flex-shrink:0;overflow-y:auto;background:var(--bg3);border-radius:8px;padding:14px">
        <div style="color:#666;font-size:.8rem;text-align:center;padding-top:40px">Click a character<br>to see details</div>
      </div>
    </div>`;

  // Expose view switcher
  window._relView = () => {};

  buildGraph();
  startAnimation();
}

function buildGraph() {
  const container = document.getElementById('relGraph');
  const W = container.clientWidth;
  const H = container.clientHeight;

  // Build nodes
  relNodes = S.D.characters.map((c, i) => ({
    id: c.id, idx: i, faction: c.faction, name: c.name,
    x: W / 2 + Math.cos(i / S.D.characters.length * Math.PI * 2) * Math.min(220, W * 0.35),
    y: H / 2 + Math.sin(i / S.D.characters.length * Math.PI * 2) * Math.min(220, H * 0.35),
    vx: 0, vy: 0,
  }));

  // Build edges — only notable relationships
  relEdges = [];
  S.D.characters.forEach(c => {
    Object.entries(c.relationships).forEach(([tid, r]) => {
      if (!S.charMap[tid]) return;
      if (c.id >= tid) return; // avoid duplicates
      const aff = r.affection || 0;
      const res = r.respect || 0;
      if (Math.abs(aff) > NOTABLE_THRESHOLD || Math.abs(res) > NOTABLE_THRESHOLD) {
        relEdges.push({ s: c.id, t: tid, affection: aff, respect: res });
      }
    });
  });

  startAnimation();
}

function startAnimation() {
  if (relAnim) cancelAnimationFrame(relAnim);
  const cv = document.getElementById('relCanvas');
  if (!cv) return;
  const container = document.getElementById('relGraph');
  const dpr = window.devicePixelRatio || 1;

  function resize() {
    cv.width = container.clientWidth * dpr;
    cv.height = container.clientHeight * dpr;
  }
  resize();

  cv.onclick = (e) => {
    const rect = cv.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    let hit = null;
    relNodes.forEach(n => {
      const dx = n.x - mx, dy = n.y - my;
      if (Math.sqrt(dx * dx + dy * dy) < 24) hit = n;
    });
    selectedNode = hit ? hit.id : null;
    updateSidebar();
  };

  (function tick() {
    const W = container.clientWidth, H = container.clientHeight;
    if (cv.width !== W * dpr || cv.height !== H * dpr) resize();

    // Forces
    relNodes.forEach(n => { n.vx = 0; n.vy = 0; });
    // Repulsion
    for (let i = 0; i < relNodes.length; i++) {
      for (let j = i + 1; j < relNodes.length; j++) {
        let dx = relNodes[j].x - relNodes[i].x, dy = relNodes[j].y - relNodes[i].y;
        let d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = 18000 / (d * d);
        relNodes[i].vx -= dx / d * f; relNodes[i].vy -= dy / d * f;
        relNodes[j].vx += dx / d * f; relNodes[j].vy += dy / d * f;
      }
    }
    // Faction clustering — same-faction nodes attract gently
    {
      const factionCenters = {};
      relNodes.forEach(n => {
        if (!factionCenters[n.faction]) factionCenters[n.faction] = { x: 0, y: 0, count: 0 };
        factionCenters[n.faction].x += n.x;
        factionCenters[n.faction].y += n.y;
        factionCenters[n.faction].count++;
      });
      Object.values(factionCenters).forEach(fc => { fc.x /= fc.count; fc.y /= fc.count; });
      relNodes.forEach(n => {
        const fc = factionCenters[n.faction];
        n.vx += (fc.x - n.x) * 0.003;
        n.vy += (fc.y - n.y) * 0.003;
      });
    }
    // Attraction along edges
    relEdges.forEach(e => {
      const a = relNodes.find(n => n.id === e.s), b = relNodes.find(n => n.id === e.t);
      if (!a || !b) return;
      let dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - 140) * 0.008;
      a.vx += dx / d * f; a.vy += dy / d * f;
      b.vx -= dx / d * f; b.vy -= dy / d * f;
    });
    // Center
    relNodes.forEach(n => {
      n.vx += (W / 2 - n.x) * 0.001;
      n.vy += (H / 2 - n.y) * 0.001;
      n.x += n.vx * 0.5;
      n.y += n.vy * 0.5;
      n.x = Math.max(30, Math.min(W - 30, n.x));
      n.y = Math.max(30, Math.min(H - 30, n.y));
    });

    // Draw
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Edges
    relEdges.forEach(e => {
      const a = relNodes.find(n => n.id === e.s), b = relNodes.find(n => n.id === e.t);
      if (!a || !b) return;
      const connected = selectedNode && (selectedNode === e.s || selectedNode === e.t);
      const alpha = selectedNode ? (connected ? 0.85 : 0.04) : 0.25;
      const strength = Math.max(Math.abs(e.affection), Math.abs(e.respect));

      // Color by dominant sentiment
      let color;
      if (e.affection > 0 && e.respect > 0) color = `rgba(74,181,122,${alpha})`; // green = friends
      else if (e.affection < 0 && e.respect < 0) color = `rgba(181,74,74,${alpha})`; // red = enemies
      else if (e.affection < 0) color = `rgba(196,163,90,${alpha})`; // gold = disdain
      else color = `rgba(74,122,181,${alpha})`; // blue = respect-only

      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, strength / S.maxRel * 5) * (connected ? 2 : 1);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      // Show label on selected edges
      if (connected && selectedNode) {
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        ctx.fillStyle = '#fff';
        ctx.font = '10px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(`A:${e.affection > 0 ? '+' : ''}${Math.round(e.affection)} R:${e.respect > 0 ? '+' : ''}${Math.round(e.respect)}`, mx, my - 6);
      }
    });

    // Nodes
    const connectedIds = selectedNode
      ? new Set([selectedNode, ...relEdges.filter(e => e.s === selectedNode || e.t === selectedNode).flatMap(e => [e.s, e.t])])
      : null;

    relNodes.forEach(n => {
      const isSel = selectedNode === n.id;
      const isConnected = connectedIds?.has(n.id);
      const dim = selectedNode && !isConnected;
      const c = FC[n.faction] || '#888';
      const r = isSel ? 28 : isConnected ? 24 : 16;

      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = dim ? `${c}33` : c;
      ctx.fill();
      if (isSel) { ctx.strokeStyle = '#c4a35a'; ctx.lineWidth = 3; ctx.stroke(); }
      else if (isConnected) { ctx.strokeStyle = '#ffffff33'; ctx.lineWidth = 1; ctx.stroke(); }

      ctx.fillStyle = dim ? '#555' : '#fff';
      ctx.font = `${isSel || isConnected ? 'bold ' : ''}${isSel || isConnected ? 13 : 11}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText(n.name, n.x, n.y + r + 14);
    });

    relAnim = requestAnimationFrame(tick);
  })();
}

function updateSidebar() {
  const sidebar = document.getElementById('relSidebar');
  if (!selectedNode) {
    sidebar.innerHTML = '<div style="color:#666;font-size:.8rem;text-align:center;padding-top:40px">Click a character<br>to see details</div>';
    return;
  }
  const c = S.charMap[selectedNode];
  if (!c) return;

  const rels = Object.entries(c.relationships)
    .map(([id, r]) => ({ id, name: S.charMap[id]?.name || id, faction: S.charMap[id]?.faction || '', affection: r.affection || 0, respect: r.respect || 0 }))
    .sort((a, b) => (b.affection + b.respect) - (a.affection + a.respect));

  function valColor(v) {
    if (v > 0) { const t = Math.min(v / 50, 1); return `rgb(${Math.round(50 + 150 * (1 - t))},${Math.round(180 + 40 * t)},${Math.round(50 + 80 * (1 - t))})`; }
    if (v < 0) { const t = Math.min(-v / 50, 1); return `rgb(${Math.round(180 + 40 * t)},${Math.round(50 + 80 * (1 - t))},${Math.round(50)})`; }
    return '#888';
  }

  function barSection(label, field) {
    const sorted = [...rels].filter(r => r[field] !== 0).sort((a, b) => b[field] - a[field]);
    if (!sorted.length) return '';
    const localMax = Math.max(50, ...sorted.map(r => Math.abs(r[field])));
    return `<div style="margin-bottom:12px"><div style="font-size:.7rem;color:#666;margin-bottom:4px;text-transform:uppercase">${label}</div>` +
      sorted.map(r => {
        const v = r[field];
        const pct = Math.min(Math.abs(v) / localMax * 100, 100);
        const col = valColor(v);
        return `<div style="display:flex;align-items:center;gap:6px;font-size:.75rem;margin:3px 0">
          <span style="width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:${FC[r.faction] || '#888'}">${r.name}</span>
          <div style="flex:1;height:4px;background:var(--bg);border-radius:2px;overflow:hidden"><div style="width:${pct}%;background:${col};height:100%;border-radius:2px"></div></div>
          <span style="width:30px;text-align:right;color:${col}">${v > 0 ? '+' : ''}${Math.round(v)}</span>
        </div>`;
      }).join('') + '</div>';
  }

  const notable = rels.filter(r => Math.abs(r.affection) > NOTABLE_THRESHOLD || Math.abs(r.respect) > NOTABLE_THRESHOLD);

  sidebar.innerHTML = `
    <h3 style="color:${FC[c.faction] || '#888'};font-size:1rem;margin-bottom:4px">${FE[c.faction] || ''} ${c.name}</h3>
    <div style="font-size:.7rem;color:#666;margin-bottom:12px">${c.role} · ${notable.length} notable relationships</div>
    ${barSection('Affection', 'affection')}
    ${barSection('Respect', 'respect')}
  `;
}
