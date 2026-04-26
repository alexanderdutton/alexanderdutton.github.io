import { S, FC, FE, FIDS, FNAMES, bar } from './shared.js';

export function renderFactions(){
  const p=document.getElementById('p-factions');
  const hist=S.D.tickHistory||[];
  // Extract faction/choam data from tick history
  const fData={},cData={};
  FIDS.forEach(f=>{fData[f]=[];cData[f]=[];});
  hist.forEach(snap=>{
    FIDS.forEach(f=>{
      fData[f].push(snap._factions?.[f]?.treasury??null);
      cData[f].push(snap._choam?.[f]??null);
    });
  });
  // Character wealth grouped by faction
  const charByFaction={};
  S.D.characters.forEach(c=>{
    if(!charByFaction[c.faction])charByFaction[c.faction]=[];
    charByFaction[c.faction].push(c);
  });

  let h='<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">';
  // Faction cards
  S.D.factions.forEach(f=>{
    const c=FC[f.id]||'#888';
    const members=charByFaction[f.id]||[];
    const totalWealth=members.reduce((s,m)=>s+(m.wealth||0),0);
    h+=`<div class="faction-card" style="border-left-color:${c};flex:1;min-width:180px">
      <h3>${FE[f.id]||''} ${f.name}</h3>
      <div style="font-size:12px;color:#aaa">Treasury: <span style="color:${c}">${Math.round(f.treasury)}₮</span></div>
      <div style="font-size:12px;color:#aaa">Member Wealth: <span style="color:${c}">${totalWealth}₮</span></div>
      <div style="font-size:12px;color:#aaa">CHOAM: <span style="color:${c}">${f.choam_shares} shares</span></div>
      ${f.supplies?`<div style="margin-top:4px;font-size:10px;display:grid;grid-template-columns:repeat(3,1fr);gap:2px 8px">
        ${['spice','industry','tech','biomass','population','exotics'].map(cm=>{
          const v=f.supplies[cm]||0;
          const col=v<20?'#e74c3c':v<40?'#e67e22':v<60?'#f1c40f':'#2ecc71';
          const tag=v<20?'⚠️':v<40?'⚡':'';
          const lbl=cm==='population'?'pop':cm==='biomass'?'bio':cm==='exotics'?'exo':cm==='industry'?'ind':cm.slice(0,4);
          return`<span style="color:${col}">${tag}${lbl} ${Math.round(v)}</span>`;
        }).join('')}
      </div>`:''}
      ${f.divisions?`<div style="font-size:11px;color:#888;margin-top:2px">⚔️ ${f.divisions} division${f.divisions>1?'s':''}${f.deployed?' ('+f.deployed+' deployed)':''}</div>`:''}
      <div style="margin-top:6px;font-size:11px">
        ${members.map(m=>`<span style="color:${FC[m.faction]||'#888'}">${m.name} (${m.wealth||0}₮)</span>`).join(' · ')}
      </div>
    </div>`;
  });
  h+='</div>';

  // Charts
  h+=`<div style="display:flex;gap:12px;flex-wrap:wrap">
    <div class="chart-section" style="flex:2;min-width:400px"><h3>Treasury Over Time</h3><canvas id="factionTreasuryChart"></canvas></div>
    <div class="chart-section" style="flex:1;min-width:300px"><h3>CHOAM Share Price</h3><canvas id="factionChoamChart"></canvas></div>
  </div>`;
  h+=`<div class="chart-section" style="margin-top:12px"><h3>Member Wealth Over Time (Stacked by Faction)</h3><canvas id="factionWealthChart"></canvas></div>`;
  // Commodity supply charts
  h+=`<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px">
    <div class="chart-section" style="flex:1;min-width:400px"><h3>Commodity Supply Over Time (Galactic Average)</h3><canvas id="commodityAvgChart"></canvas></div>
    <div class="chart-section" style="flex:1;min-width:400px"><h3>Commodity Scarcity Events (Supply < 20)</h3><canvas id="commodityScarcityChart"></canvas></div>
  </div>`;
  // Per-faction commodity detail
  h+=`<div class="chart-section" style="margin-top:12px"><h3>Faction Commodity Breakdown</h3>
    <div style="margin-bottom:8px;font-size:12px;color:#888">Select faction: <select id="commodityFactionSelect" style="background:#1a1a1a;color:#ddd;border:1px solid #333;padding:4px 8px;border-radius:4px">${FIDS.map(f=>`<option value="${f}">${FE[f]||''} ${FNAMES[f]}</option>`).join('')}</select></div>
    <canvas id="commodityFactionChart"></canvas></div>`;
  p.innerHTML=h;

  // Draw treasury chart
  drawFactionLine('factionTreasuryChart',fData,'₮');
  // Draw CHOAM single price line
  drawChoamPrice('factionChoamChart',hist);
  // Draw stacked wealth chart
  drawFactionWealth('factionWealthChart',hist,charByFaction);
  // Draw commodity charts
  drawCommodityAvg('commodityAvgChart',hist);
  drawCommodityScarcity('commodityScarcityChart',hist);
  drawCommodityFaction('commodityFactionChart',hist,FIDS[0]);
  document.getElementById('commodityFactionSelect').addEventListener('change',e=>drawCommodityFaction('commodityFactionChart',hist,e.target.value));
}

function drawFactionLine(canvasId,data,unit){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const cw=cv.parentElement.clientWidth-20,ch=220;
  cv.style.width=cw+'px';cv.style.height=ch+'px';
  cv.width=cw*dpr;cv.height=ch*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,cw,ch);

  const allVals=Object.values(data).flat().filter(v=>v!==null);
  if(!allVals.length)return;
  const yMin=Math.min(0,...allVals),yMax=Math.max(1,...allVals);
  const yScale=v=>ch-40-((v-yMin)/(yMax-yMin))*(ch-60);
  const xScale=(cw-80)/(Math.max(1,(data[FIDS[0]]||[]).length-1));

  // Grid
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=20+i*(ch-60)/4;ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(cw-10,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(Math.round(yMax-i*(yMax-yMin)/4)+unit,65,y+4);}

  FIDS.forEach(f=>{
    const vals=data[f];if(!vals||!vals.some(v=>v!==null))return;
    ctx.strokeStyle=FC[f]||'#888';ctx.lineWidth=2;ctx.beginPath();
    let started=false;
    vals.forEach((v,i)=>{if(v!==null){const x=70+i*xScale,y=yScale(v);started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);}});
    ctx.stroke();
    // Label at end
    const last=vals.filter(v=>v!==null);
    if(last.length){
      const li=vals.lastIndexOf(last[last.length-1]);
      ctx.fillStyle=FC[f]||'#888';ctx.font='11px system-ui';ctx.textAlign='left';ctx.fillText(FNAMES[f],cw-8,yScale(vals[li]));
    }
  });
}

function drawChoamPrice(canvasId,hist){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const cw=cv.parentElement.clientWidth-20,ch=220;
  cv.style.width=cw+'px';cv.style.height=ch+'px';
  cv.width=cw*dpr;cv.height=ch*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,cw,ch);

  const prices=hist.map(s=>s._choam?.price).filter(v=>v!=null);
  if(!prices.length)return;
  const yMin=Math.min(...prices)-5,yMax=Math.max(...prices)+5;
  const yScale=v=>ch-40-((v-yMin)/(yMax-yMin))*(ch-60);
  const xScale=(cw-80)/(Math.max(1,hist.length-1));

  // Grid
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=20+i*(ch-60)/4;ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(cw-10,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(Math.round(yMax-i*(yMax-yMin)/4)+'₮',65,y+4);}

  // Price line
  ctx.strokeStyle='#e8b635';ctx.lineWidth=2;ctx.beginPath();
  let started=false;
  hist.forEach((snap,i)=>{const p=snap._choam?.price;if(p!=null){const x=70+i*xScale,y=yScale(p);started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);}});
  ctx.stroke();

  // Share holdings legend (latest tick)
  const latest=hist[hist.length-1]?._choam?.shares;
  if(latest){
    let ly=20;
    ctx.font='11px system-ui';ctx.textAlign='left';
    FIDS.forEach(f=>{
      const s=latest[f]||0;
      ctx.fillStyle=FC[f]||'#888';ctx.fillRect(cw-90,ly,10,10);
      ctx.fillStyle='#aaa';ctx.fillText(FNAMES[f]+': '+s,cw-76,ly+9);
      ly+=16;
    });
  }

  // X labels
  ctx.fillStyle='#555';ctx.textAlign='center';
  [0,Math.floor(hist.length/4),Math.floor(hist.length/2),Math.floor(3*hist.length/4),hist.length-1].forEach(i=>ctx.fillText('W'+i,70+i*xScale,ch-8));
}

function drawFactionWealth(canvasId,hist,charByFaction){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const cw=cv.parentElement.clientWidth-20,ch=220;
  cv.style.width=cw+'px';cv.style.height=ch+'px';
  cv.width=cw*dpr;cv.height=ch*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,cw,ch);

  // Stack faction wealth per tick
  const stacked=FIDS.map(f=>[]);
  const totals=new Array(hist.length).fill(0);
  hist.forEach((snap,i)=>{
    FIDS.forEach((f,fi)=>{
      const chars=charByFaction[f]||[];
      const w=chars.reduce((s,c)=>s+(snap[c.id]?.wealth||0),0);
      stacked[fi].push(w);
      totals[i]+=w;
    });
  });

  const yMax=Math.max(1,...totals);
  const yScale=v=>(v/yMax)*(ch-50);
  const barW=Math.max(1,(cw-80)/hist.length);

  // Y axis
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const v=Math.round(yMax*i/4);const y=ch-30-yScale(v);ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(cw-10,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(v+'₮',65,y+4);}

  // Stacked bars
  hist.forEach((_,i)=>{
    let cumY=0;
    FIDS.forEach((f,fi)=>{
      const h=stacked[fi][i];
      if(h>0){
        ctx.fillStyle=FC[f]||'#888';
        ctx.fillRect(70+i*barW,ch-30-yScale(cumY+h),barW,yScale(h));
        cumY+=h;
      }
    });
  });

  // Legend
  let lx=80;
  FIDS.forEach(f=>{ctx.fillStyle=FC[f]||'#888';ctx.fillRect(lx,ch-12,10,10);ctx.fillStyle='#aaa';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText(FNAMES[f],lx+14,ch-3);lx+=80;});
}

function drawCommodityAvg(canvasId,hist){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const cw=cv.parentElement.clientWidth-20,ch=240;
  cv.style.width=cw+'px';cv.style.height=ch+'px';
  cv.width=cw*dpr;cv.height=ch*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,cw,ch);

  const COMMODITIES=['spice','industry','tech','biomass','population','exotics'];
  const COM_COLORS={spice:'#e8b635',industry:'#e74c3c',tech:'#3498db',biomass:'#2ecc71',population:'#9b59b6',exotics:'#e67e22'};
  const COM_LABELS={spice:'Spice',industry:'Industry',tech:'Tech',biomass:'Bio',population:'Pop',exotics:'Exotics'};

  // Calculate galactic average per commodity per tick
  const comData={};
  COMMODITIES.forEach(c=>comData[c]=[]);
  hist.forEach(snap=>{
    const fs=snap._factions||{};
    const fids=Object.keys(fs);
    COMMODITIES.forEach(c=>{
      const avg=fids.reduce((s,fid)=>s+(fs[fid]?.supplies?.[c]||50),0)/Math.max(1,fids.length);
      comData[c].push(Math.round(avg*10)/10);
    });
  });

  const allVals=COMMODITIES.flatMap(c=>comData[c]);
  const yMin=Math.min(0,...allVals),yMax=Math.max(100,...allVals);
  const yScale=v=>ch-40-((v-yMin)/(yMax-yMin))*(ch-60);
  const xScale=(cw-80)/(Math.max(1,hist.length-1));

  // Danger zone (<20)
  const dangerY=yScale(20);
  ctx.fillStyle='rgba(231,76,60,0.08)';ctx.fillRect(70,dangerY,cw-80,ch-30-dangerY);
  ctx.strokeStyle='rgba(231,76,60,0.3)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(70,dangerY);ctx.lineTo(cw-10,dangerY);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='rgba(231,76,60,0.5)';ctx.font='9px system-ui';ctx.textAlign='right';ctx.fillText('scarcity',65,dangerY+4);

  // Grid
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=20+i*(ch-60)/4;ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(cw-10,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(Math.round(yMax-i*(yMax-yMin)/4),65,y+4);}

  // Lines
  COMMODITIES.forEach(c=>{
    const vals=comData[c];
    ctx.strokeStyle=COM_COLORS[c];ctx.lineWidth=1.5;ctx.beginPath();
    let started=false;
    vals.forEach((v,i)=>{const x=70+i*xScale,y=yScale(v);started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);});
    ctx.stroke();
    // End label
    ctx.fillStyle=COM_COLORS[c];ctx.font='10px system-ui';ctx.textAlign='left';
    ctx.fillText(COM_LABELS[c]+':'+Math.round(vals[vals.length-1]),cw-8,yScale(vals[vals.length-1])+(COMMODITIES.indexOf(c)-2)*11);
  });

  // X labels
  ctx.fillStyle='#555';ctx.textAlign='center';
  [0,Math.floor(hist.length/4),Math.floor(hist.length/2),Math.floor(3*hist.length/4),hist.length-1].forEach(i=>ctx.fillText('W'+i,70+i*xScale,ch-8));
}

function drawCommodityScarcity(canvasId,hist){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const cw=cv.parentElement.clientWidth-20,ch=240;
  cv.style.width=cw+'px';cv.style.height=ch+'px';
  cv.width=cw*dpr;cv.height=ch*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,cw,ch);

  const COMMODITIES=['spice','industry','tech','biomass','population','exotics'];
  const COM_COLORS={spice:'#e8b635',industry:'#e74c3c',tech:'#3498db',biomass:'#2ecc71',population:'#9b59b6',exotics:'#e67e22'};
  const FIDS_LOCAL=FIDS;

  // Count scarcity events per tick (how many factions have a commodity < 20)
  const scarcityData={};
  COMMODITIES.forEach(c=>scarcityData[c]=[]);
  hist.forEach(snap=>{
    const fs=snap._factions||{};
    COMMODITIES.forEach(c=>{
      const count=FIDS_LOCAL.filter(fid=>(fs[fid]?.supplies?.[c]||50)<20).length;
      scarcityData[c].push(count);
    });
  });

  const yMax=Math.max(1,...COMMODITIES.flatMap(c=>scarcityData[c]));
  const yScale=v=>(v/Math.max(1,yMax))*(ch-50);
  const barW=Math.max(1,(cw-80)/hist.length);

  // Y axis
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const v=Math.round(yMax*i/4);const y=ch-30-yScale(v);ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(cw-10,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(v+' factions',65,y+4);}

  // Stacked scarcity bars
  hist.forEach((_,i)=>{
    let cumY=0;
    COMMODITIES.forEach(c=>{
      const h=scarcityData[c][i];
      if(h>0){
        ctx.fillStyle=COM_COLORS[c];
        ctx.fillRect(70+i*barW,ch-30-yScale(cumY+h),barW,yScale(h));
        cumY+=h;
      }
    });
  });

  // Legend
  let lx=80;
  COMMODITIES.forEach(c=>{ctx.fillStyle=COM_COLORS[c];ctx.fillRect(lx,ch-12,10,10);ctx.fillStyle='#aaa';ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillText(c,lx+14,ch-3);lx+=70;});

  // X labels
  ctx.fillStyle='#555';ctx.textAlign='center';
  [0,Math.floor(hist.length/4),Math.floor(hist.length/2),Math.floor(3*hist.length/4),hist.length-1].forEach(i=>ctx.fillText('W'+i,70+i*barW,ch-8));
}

function drawCommodityFaction(canvasId,hist,factionId){
  const cv=document.getElementById(canvasId);if(!cv)return;
  const dpr=window.devicePixelRatio||1;
  const cw=cv.parentElement.clientWidth-20,ch=240;
  cv.style.width=cw+'px';cv.style.height=ch+'px';
  cv.width=cw*dpr;cv.height=ch*dpr;
  const ctx=cv.getContext('2d');ctx.scale(dpr,dpr);
  ctx.fillStyle='#0d0d0d';ctx.fillRect(0,0,cw,ch);

  const COMMODITIES=['spice','industry','tech','biomass','population','exotics'];
  const COM_COLORS={spice:'#e8b635',industry:'#e74c3c',tech:'#3498db',biomass:'#2ecc71',population:'#9b59b6',exotics:'#e67e22'};

  const comData={};
  COMMODITIES.forEach(c=>comData[c]=[]);
  hist.forEach(snap=>{
    const fs=snap._factions||{};
    COMMODITIES.forEach(c=>comData[c].push(fs[factionId]?.supplies?.[c]??50));
  });

  const allVals=COMMODITIES.flatMap(c=>comData[c]);
  const yMin=Math.min(0,...allVals),yMax=Math.max(100,...allVals);
  const yScale=v=>ch-40-((v-yMin)/(yMax-yMin))*(ch-60);
  const xScale=(cw-80)/(Math.max(1,hist.length-1));

  // Danger zone
  const dangerY=yScale(20);
  ctx.fillStyle='rgba(231,76,60,0.08)';ctx.fillRect(70,dangerY,cw-80,ch-30-dangerY);
  ctx.strokeStyle='rgba(231,76,60,0.3)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(70,dangerY);ctx.lineTo(cw-10,dangerY);ctx.stroke();ctx.setLineDash([]);

  // Grid
  ctx.strokeStyle='#222';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=20+i*(ch-60)/4;ctx.beginPath();ctx.moveTo(70,y);ctx.lineTo(cw-10,y);ctx.stroke();ctx.fillStyle='#555';ctx.font='10px system-ui';ctx.textAlign='right';ctx.fillText(Math.round(yMax-i*(yMax-yMin)/4),65,y+4);}

  // Lines
  COMMODITIES.forEach(c=>{
    const vals=comData[c];
    ctx.strokeStyle=COM_COLORS[c];ctx.lineWidth=1.5;ctx.beginPath();
    let started=false;
    vals.forEach((v,i)=>{const x=70+i*xScale,y=yScale(v);started?ctx.lineTo(x,y):(ctx.moveTo(x,y),started=true);});
    ctx.stroke();
    ctx.fillStyle=COM_COLORS[c];ctx.font='10px system-ui';ctx.textAlign='left';
    ctx.fillText(c+':'+Math.round(vals[vals.length-1]),cw-8,yScale(vals[vals.length-1])+(COMMODITIES.indexOf(c)-2)*11);
  });

  // X labels
  ctx.fillStyle='#555';ctx.textAlign='center';
  [0,Math.floor(hist.length/4),Math.floor(hist.length/2),Math.floor(3*hist.length/4),hist.length-1].forEach(i=>ctx.fillText('W'+i,70+i*xScale,ch-8));
}


