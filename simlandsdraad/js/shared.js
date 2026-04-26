// Shared state & constants for SimLandsdraad dashboard
export const FC = {atreides:'#4a7ab5',harkonnen:'#b54a4a',corrino:'#b5a04a',fenring:'#4ab57a',richese:'#9a4ab5',vernal:'#4ab5a5',moritani:'#b57a4a',ecaz:'#7ab54a',metulli:'#7a7a7a',sulaiman:'#c4a35a',calix:'#a54a6b'};
export const FE = {atreides:'🔵',harkonnen:'🔴',corrino:'🟡',fenring:'🟢',richese:'🟣',vernal:'🌊',moritani:'⚔️',ecaz:'🌿',metulli:'⛏️',sulaiman:'🏜️',calix:'🦴'};
export const ACT_TAG = {
  'insult':'hostile','provoke':'hostile','wound':'hostile','retaliate':'hostile',
  'compliment':'friendly','confide':'friendly','offer-favor':'friendly','seek-solace':'friendly','call-in-favor':'friendly',
  'hatch-scheme':'strategic','fund-operation':'strategic','military-buildup':'strategic','infrastructure':'strategic','choam-investment':'strategic',
  'spy-network':'espionage','bribe-servant':'espionage','bribe-official':'espionage','gossip':'espionage',
  'host-feast':'political','request-favor':'political','buy-gift':'political','settle-debt':'political',
  'idle':'neutral','gamble':'neutral','nurse-grudge':'neutral','indulge-vice':'neutral','outfit-retainers':'neutral'
};
export const TAG_COLOR = {hostile:'#b54a4a',friendly:'#4ab57a',political:'#c4a35a',espionage:'#9a4ab5',strategic:'#4a7ab5',neutral:'#666'};
export const FIDS = ['atreides','harkonnen','corrino','fenring','richese','vernal','moritani','ecaz','metulli','sulaiman','calix'];
export const FNAMES = {atreides:'Atreides',harkonnen:'Harkonnen',corrino:'Corrino',fenring:'Fenring',richese:'Richese'};
export const TREND_COLORS = {valence:'#4a7ab5',arousal:'#b54a4a',health:'#4ab57a',wealth:'#b5a04a',prestige:'#9a4ab5'};

// Mutable shared state (object so mutations propagate across modules)
export const S = {
  D: null,
  charMap: {},
  maxRel: 0,
  maxWealth: 0,
  activeFilter: 'all',
  trendMetric: 'wealth',
  trendChars: new Set(),
};

export function setSimData(data) {
  S.D = data;
  S.D.characters.forEach(c => { S.charMap[c.id] = c; });
  S.maxRel = Math.max(200, ...S.D.characters.flatMap(c => Object.values(c.relationships).flatMap(r => [Math.abs(r.affection), Math.abs(r.respect)])));
  S.maxWealth = Math.max(1, ...S.D.characters.map(c => c.wealth));
}

export function fc(id) { return FC[S.charMap[id]?.faction || 'atreides'] || '#888'; }
export function fmt(n) { return Number.isInteger(n) ? n.toString() : n.toFixed(1); }
export function bar(label, val, max, color) {
  const pct = Math.round(val / max * 100);
  return `<div class="bar-row"><span class="lbl">${label}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="num">${fmt(val)}</span></div>`;
}
export function miniBar(label, pct, val, color) {
  return `<div class="bar-row"><span class="lbl">${label}</span><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color}"></div></div><span class="num">${fmt(val)}</span></div>`;
}
