import { S, fc } from './shared.js';

export function renderChronicle(){
  const p=document.getElementById('p-chronicle');
  p.innerHTML=`<div class="chron-controls">
    <input type="text" id="chronSearch" placeholder="Search actions...">
    <select id="chronChar"><option value="">All Characters</option>${S.D.characters.map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select>
    <select id="chronAction"><option value="">All Actions</option>${Object.keys(S.D.actionCounts).map(a=>`<option value="${a}">${a}</option>`).join('')}</select>
  </div><div id="chronicle"></div>`;
  const draw=()=>{
    const q=document.getElementById('chronSearch').value.toLowerCase();
    const charF=document.getElementById('chronChar').value;
    const actF=document.getElementById('chronAction').value;
    let filtered=S.D.chronicle;
    if(charF)filtered=filtered.filter(e=>e.initiator===charF);
    if(actF)filtered=filtered.filter(e=>e.action===actF);
    if(q)filtered=filtered.filter(e=>e.action.includes(q)||S.charMap[e.initiator]?.name?.toLowerCase().includes(q)||JSON.stringify(e.bindings).toLowerCase().includes(q));
    const show=filtered.slice(0,200);
    document.getElementById('chronicle').innerHTML=show.map(e=>{
      const initName=S.charMap[e.initiator]?.name||e.initiator;
      const binds=Object.entries(e.bindings||{}).map(([k,v])=>`${k}: ${(!Array.isArray(v)?[v]:v).map(x=>S.charMap[x]?.name||x).join(', ')}`).join('; ');
      return`<div class="chron-row"><span class="tick">T${e.tick}</span><span class="initiator" style="color:${fc(e.initiator)}">${initName}</span><span class="action-type">${e.action}</span><span class="bindings">${binds}</span></div>`;
    }).join('')+(filtered.length>200?`<div style="padding:10px;text-align:center;color:#555">Showing 200 of ${filtered.length}</div>`:'');
  };
  document.getElementById('chronSearch').oninput=draw;
  document.getElementById('chronChar').onchange=draw;
  document.getElementById('chronAction').onchange=draw;
  draw();
}

// ── Trends ──
const TREND_COLORS = {valence:'#4a7ab5',arousal:'#b54a4a',health:'#4ab57a',wealth:'#b5a04a',prestige:'#9a4ab5'};
let trendMetric='wealth', trendChars=new Set();

