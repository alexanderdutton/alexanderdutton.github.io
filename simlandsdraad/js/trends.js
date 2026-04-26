import { S, FC, TREND_COLORS } from './shared.js';

export function renderTrends(){
  const p=document.getElementById('p-trends');
  if(!S.D.tickHistory||!S.D.tickHistory.length){p.innerHTML='<h3 style="color:var(--gold)">No tick history data</h3>';return;}
  if(!p.querySelector('#trendControls')){
    const metricOpts=Object.keys(TREND_COLORS).map(k=>`<option value="${k}"${k===S.trendMetric?' selected':''}>${k[0].toUpperCase()+k.slice(1)}</option>`).join('');
    const charBtns=S.D.characters.map(c=>`<button class="filter-btn" data-c="${c.id}" style="border-color:${FC[c.faction]||'#888'};color:${FC[c.faction]||'#888'}">${c.name}</button>`).join('');
    p.innerHTML=`<div id="trendControls" class="chron-controls" style="margin-bottom:12px">
      <select id="S.trendMetric">${metricOpts}</select>
      <button id="trendAtreides">Atreides</button>
      <button id="trendHarkonnen">Harkonnen</button>
      <button id="trendAll">All</button>
      <button id="trendNone">None</button>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">${charBtns}</div>
    <canvas id="trendChart" style="width:100%;height:500px;background:var(--bg2);border-radius:8px"></canvas>`;
    // Toggle character buttons
    p.querySelectorAll('.filter-btn[data-c]').forEach(b=>{
      b.onclick=()=>{const c=b.dataset.c;S.trendChars.has(c)?S.trendChars.delete(c):S.trendChars.add(c);b.classList.toggle('active');drawTrend();};
    });
    document.getElementById('S.trendMetric').onchange=e=>{S.trendMetric=e.target.value;drawTrend();};
    document.getElementById('trendAtreides').onclick=()=>{S.trendChars.clear();['paul','duncan','gurney','leto','jessica','thufir'].forEach(c=>S.trendChars.add(c));updateTrendBtns();drawTrend();};
    document.getElementById('trendHarkonnen').onclick=()=>{S.trendChars.clear();['feyd','vladimir','rabban','piter','umman','iakin'].forEach(c=>S.trendChars.add(c));updateTrendBtns();drawTrend();};
    document.getElementById('trendAll').onclick=()=>{S.trendChars=new Set(S.D.characters.map(c=>c.id));updateTrendBtns();drawTrend();};
    document.getElementById('trendNone').onclick=()=>{S.trendChars.clear();updateTrendBtns();drawTrend();};
    // Default to Atreides
    S.trendChars=new Set(['paul','duncan','gurney','leto','jessica','thufir']);
    updateTrendBtns();
  }
  drawTrend();
}

function updateTrendBtns(){
  const p=document.getElementById('p-trends');
  p.querySelectorAll('.filter-btn[data-c]').forEach(b=>{b.classList.toggle('active',S.trendChars.has(b.dataset.c));});
}
function drawTrend(){
  const cv=document.getElementById('trendChart');if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  cv.width=cv.clientWidth*dpr;cv.height=500*dpr;
  const ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);
  const w=cv.clientWidth,h=500;
  ctx.clearRect(0,0,w,h);
  if(!S.trendChars.size)return;
  const hist=S.D.tickHistory;
  const metrics=['valence','arousal','health','wealth','prestige'];
  const m=S.trendMetric;
  // Find range
  let min=Infinity,max=-Infinity;
  hist.forEach(snap=>{S.trendChars.forEach(id=>{if(snap[id]&&snap[id][m]!==undefined){const v=snap[id][m];if(v<min)min=v;if(v>max)max=v;}});});
  if(min===Infinity){min=0;max=100;}
  const pad=min<0?Math.abs(max-min)*0.1:0;
  const yMin=min-pad,yMax=max+pad;
  const xScale=(w-80)/(hist.length-1||1);
  const yScale=v=>h-40-((v-yMin)/(yMax-yMin)*(h-60));
  // Grid
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=5;i++){const y=20+i*(h-60)/5;ctx.beginPath();ctx.moveTo(60,y);ctx.lineTo(w-20,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(Math.round(yMax-i*(yMax-yMin)/5),55,y+4);}
  // X axis labels
  ctx.fillStyle='#555';ctx.textAlign='center';
  [0,Math.floor(hist.length/4),Math.floor(hist.length/2),Math.floor(3*hist.length/4),hist.length-1].forEach(i=>{if(hist[i])ctx.fillText('W'+i,60+i*xScale,h-8);});
  // Lines
  S.trendChars.forEach(id=>{
    const char=S.D.characters.find(c=>c.id===id);if(!char)return;
    ctx.strokeStyle=FC[char.faction]||'#888';ctx.lineWidth=2;ctx.beginPath();
    let started=false;
    hist.forEach((snap,i)=>{if(snap[id]&&snap[id][m]!==undefined){const x=60+i*xScale,y=yScale(snap[id][m]);started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);}});
    ctx.stroke();
    // Label
    if(started){const lastSnap=hist[hist.length-1];if(lastSnap[id]){ctx.fillStyle=FC[char.faction]||'#888';ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillText(char.name,w-16,yScale(lastSnap[id][m]));}}
  });
}

// ── Factions ──
const FIDS=['atreides','harkonnen','corrino','fenring','richese','vernal','moritani','ecaz','metulli','sulaiman','calix'];
const FNAMES={atreides:'Atreides',harkonnen:'Harkonnen',corrino:'Corrino',fenring:'Fenring',richese:'Richese'};

