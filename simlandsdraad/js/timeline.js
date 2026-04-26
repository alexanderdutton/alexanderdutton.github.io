import { S, FC, fc } from './shared.js';

export function renderTimeline(){
  const p=document.getElementById('p-timeline');
  if(!p.querySelector('.hm-info')){
    // Build heatmap data: characters × action types
    const allActions=[...new Set(S.D.chronicle.map(e=>e.action))].sort();
    const matrix={};
    S.D.characters.forEach(c=>{matrix[c.id]={total:0};allActions.forEach(a=>{matrix[c.id][a]=0});});
    S.D.chronicle.forEach(e=>{if(matrix[e.initiator]){matrix[e.initiator][e.action]=(matrix[e.initiator][e.action]||0)+1;matrix[e.initiator].total++;}});
    // Sort characters by total actions desc
    const sortedChars=[...S.D.characters].sort((a,b)=>(matrix[b.id]?.total||0)-(matrix[a.id]?.total||0));
    const maxVal=Math.max(1,...sortedChars.flatMap(c=>allActions.map(a=>matrix[c.id]?.[a]||0)));
    const cellW=Math.max(40,Math.min(60,(p.clientWidth-140)/allActions.length));
    const cellH=28;
    const canvasW=140+allActions.length*cellW;
    const canvasH=40+sortedChars.length*cellH;
    // Tooltip
    const tip=document.createElement('div');tip.className='hm-info';tip.style.cssText='position:absolute;display:none;background:var(--bg2);border:1px solid var(--gold);padding:6px 10px;border-radius:4px;font-size:12px;color:var(--text);pointer-events:none;z-index:10';
    // Color scale: 0 → dark, max → faction color
    function cellColor(charId,val){
      if(!val)return '#1a1a1a';
      const f=0.2+0.8*(val/maxVal);
      const fc=FC[S.D.characters.find(c=>c.id===charId)?.faction]||'#888';
      // Parse hex
      const r=parseInt(fc.slice(1,3),16),g=parseInt(fc.slice(3,5),16),b=parseInt(fc.slice(5,7),16);
      return `rgba(${Math.round(r*f)},${Math.round(g*f)},${Math.round(b*f)},1)`;
    }
    let html=`<div style="position:relative;overflow-x:auto"><canvas id="hmCanvas" width="${canvasW*2}" height="${canvasH*2}" style="width:${canvasW}px;height:${canvasH}px;cursor:crosshair"></canvas></div>`;
    html+=`<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;font-size:11px;color:var(--muted)">`;
    html+=`<span style="color:var(--gold)">Rows: characters sorted by activity</span>`;
    html+=`<span>Columns: action types</span>`;
    html+=`<span>Brightness = frequency</span></div>`;
    p.innerHTML=html;
    p.style.position='relative';p.appendChild(tip);
    const cv=document.getElementById('hmCanvas');
    const ctx=cv.getContext('2d');ctx.scale(2,2);
    // Column headers
    ctx.fillStyle='var(--muted)';ctx.font='10px system-ui';ctx.textAlign='right';
    allActions.forEach((a,i)=>{
      const x=140+i*cellW+cellW/2;
      ctx.save();ctx.translate(x,32);ctx.rotate(-Math.PI/3);ctx.fillStyle='#777';ctx.fillText(a,0,0);ctx.restore();
    });
    // Row labels + cells
    sortedChars.forEach((c,ri)=>{
      const y=40+ri*cellH;
      ctx.fillStyle=FC[c.faction]||'#888';ctx.font='12px system-ui';ctx.textAlign='right';
      ctx.fillText(c.name,130,y+cellH/2+4);
      allActions.forEach((a,ci)=>{
        const val=matrix[c.id]?.[a]||0;
        ctx.fillStyle=cellColor(c.id,val);
        ctx.fillRect(140+ci*cellW+1,y+1,cellW-2,cellH-2);
        if(val>0){ctx.fillStyle=val>maxVal*0.6?'#fff':'#aaa';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText(val,140+ci*cellW+cellW/2,y+cellH/2+4);}
      });
    });
    // Hover tooltip
    cv.onmousemove=e=>{
      const rect=cv.getBoundingClientRect();
      const mx=e.clientX-rect.left,my=e.clientY-rect.top;
      const ci=Math.floor((mx-140)/cellW),ri=Math.floor((my-40)/cellH);
      if(ci>=0&&ci<allActions.length&&ri>=0&&ri<sortedChars.length){
        const c=sortedChars[ri],a=allActions[ci],val=matrix[c.id]?.[a]||0;
        tip.style.display='block';
        tip.style.left=(mx+12)+'px';tip.style.top=(my-20)+'px';
        tip.textContent=val?`${c.name} → ${a}: ${val}x`:`${c.name} → ${a}: none`;
      }else{tip.style.display='none';}
    };
    cv.onmouseleave=()=>{tip.style.display='none';};
  }
}

// ── Chronicle ──

