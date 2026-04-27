// Travel & Schedule dashboard panel
import { S, fmt, setSimData } from './shared.js';

const LOC_NAMES = {
    'arrakeen': 'Arrakeen',
    'keep-atreides': 'Atreides Keep',
    'sietch-tabr': 'Sietch Tabr',
    'kaitain-palace': 'Imperial Palace',
    'landsdraad-hall': 'Landsdraad Hall',
    'giedi-prime-citadel': 'Giedi Prime',
    'fenring-estate': 'Fenring Estate',
    'richese-factories': 'Richese',
    'guild-nav-chamber': 'Guild Chamber',
    'arrakis-desert': 'Deep Desert',
};

const SCHEDULE = {
    'arrakeen':            { mod: 2, phase: 0 },
    'kaitain-palace':      { mod: 2, phase: 1 },
    'landsdraad-hall':     { mod: 3, phase: 0 },
    'keep-atreides':       { mod: 3, phase: 1 },
    'giedi-prime-citadel': { mod: 4, phase: 0 },
    'fenring-estate':      { mod: 4, phase: 2 },
    'richese-factories':   { mod: 4, phase: 1 },
    'guild-nav-chamber':   { mod: 5, phase: 0 },
    'sietch-tabr':         { mod: 5, phase: 2 },
    'arrakis-desert':      { mod: 6, phase: 0 },
};

const EVENTS = [
    { id: 'landsraad-session', name: 'Landsraad Session', interval: 10, firstTick: 8 },
    { id: 'choam-summit', name: 'CHOAM Summit', interval: 8, firstTick: 5 },
    { id: 'spice-ceremony', name: 'Spice Ceremony', interval: 7, firstTick: 6 },
    { id: 'imperial-reception', name: 'Imperial Reception', interval: 12, firstTick: 10 },
];

let travelFilter = 'all';
let timelineFilter = 'all';

export function renderTravel() {
    const panel = document.getElementById('p-travel');
    if (!panel || !S.D) return;

    const maxTick = S.D.tickHistory?.length ? S.D.tickHistory[S.D.tickHistory.length - 1].tick : 0;
    const chars = S.D.characters || [];
    const log = S.D.travelLog || [];

    // Group characters by location
    const byLoc = {};
    const traveling = [];
    for (const c of chars) {
        const ts = c.travelState;
        if (ts?.status === 'traveling') {
            traveling.push(c);
        } else {
            const loc = c.location || 'unknown';
            if (!byLoc[loc]) byLoc[loc] = [];
            byLoc[loc].push(c);
        }
    }

    let html = '';

    // ── Heighliner Schedule ──
    html += `<div class="travel-section">
        <h3>🚀 Heighliner Schedule</h3>
        <div class="schedule-grid">
            <div class="schedule-header"><span>Location</span><span>Cadence</span><span>Next Window${maxTick ? ' (from tick ' + maxTick + ')' : ''}</span></div>`;

    for (const [locId, sched] of Object.entries(SCHEDULE)) {
        const name = LOC_NAMES[locId] || locId;
        const freq = sched.mod === 2 ? 'Frequent' : sched.mod <= 4 ? 'Regular' : 'Rare';
        let nextWin = '—';
        if (maxTick) {
            const rem = (maxTick + 1 - sched.phase) % sched.mod;
            nextWin = rem === 0 ? 'NOW' : `tick ${maxTick + 1 + (sched.mod - rem)}`;
        }
        const freqClass = sched.mod <= 2 ? 'freq-high' : sched.mod <= 4 ? 'freq-mid' : 'freq-low';
        html += `<div class="schedule-row">
            <span class="loc-name">${name}</span>
            <span class="freq ${freqClass}">Every ${sched.mod} ticks</span>
            <span class="next-win">${nextWin}</span>
        </div>`;
    }
    html += `</div></div>`;

    // ── Upcoming Events ──
    html += `<div class="travel-section">
        <h3>📅 Upcoming Events</h3>
        <div class="events-grid">`;
    if (maxTick) {
        for (const ev of EVENTS) {
            let next = null;
            for (let t = maxTick + 1; t <= maxTick + 15; t++) {
                if (t >= ev.firstTick && (t - ev.firstTick) % ev.interval === 0) {
                    next = t; break;
                }
            }
            if (next !== null) {
                html += `<div class="event-card">
                    <span class="event-name">${ev.name}</span>
                    <span class="event-when">tick ${next}</span>
                </div>`;
            }
        }
    }
    html += `</div></div>`;

    // ── Current Locations ──
    html += `<div class="travel-section">
        <h3>📍 Current Locations</h3>
        <div class="locations-grid">`;

    // Show locations with characters
    const locOrder = ['kaitain-palace', 'landsdraad-hall', 'arrakeen', 'keep-atreides',
        'giedi-prime-citadel', 'fenring-estate', 'richese-factories',
        'guild-nav-chamber', 'sietch-tabr', 'arrakis-desert'];

    for (const locId of locOrder) {
        const people = byLoc[locId];
        if (!people || people.length === 0) continue;
        const name = LOC_NAMES[locId] || locId;
        const sched = SCHEDULE[locId];
        html += `<div class="location-card">
            <div class="location-header">
                <span class="loc-title">${name}</span>
                <span class="loc-cadence">🚀 every ${sched?.mod || '?'} ticks</span>
            </div>
            <div class="location-people">${people.map(c => {
                const faction = c.faction || '';
                return `<span class="person-badge faction-${faction}">${c.name}</span>`;
            }).join('')}</div>
        </div>`;
    }

    // Traveling characters
    if (traveling.length > 0) {
        html += `<div class="location-card in-transit">
            <div class="location-header">
                <span class="loc-title">🚀 In Transit</span>
            </div>
            <div class="location-people">${traveling.map(c => {
                const dest = LOC_NAMES[c.travelState?.destination] || c.travelState?.destination || '?';
                return `<span class="person-badge faction-${c.faction || ''} traveling">${c.name} → ${dest}</span>`;
            }).join('')}</div>
        </div>`;
    }
    html += `</div></div>`;

    // ── Travel Timeline ──
    html += `<div class="travel-section">
        <h3>🕰 Travel Timeline</h3>
        <div class="timeline-controls">
            <select id="travel-timeline-filter">
                <option value="all">All Events</option>
                <option value="departure">Departures Only</option>
                <option value="arrival">Arrivals Only</option>
                <option value="event">Event-Related</option>
            </select>
        </div>
        <div class="timeline-entries">`;

    const filtered = log.filter(e => {
        if (timelineFilter === 'departure') return e.type === 'departure';
        if (timelineFilter === 'arrival') return e.type === 'arrival';
        if (timelineFilter === 'event') return e.reason && e.reason !== 'travel-spontaneous';
        return true;
    }).reverse(); // newest first

    for (const e of filtered.slice(0, 80)) {
        const fromName = LOC_NAMES[e.from] || e.from;
        const toName = LOC_NAMES[e.to] || e.to;
        const icon = e.type === 'departure' ? '🚀' : '📍';
        const reason = e.reason && e.reason !== 'travel-spontaneous'
            ? `<span class="travel-reason">${e.reason.replace(/-/g, ' ')}</span>` : '';
        html += `<div class="timeline-entry">
            <span class="tl-tick">t${e.tick}</span>
            <span class="tl-icon">${icon}</span>
            <span class="tl-char">${e.charName}</span>
            <span class="tl-route">${fromName} → ${toName}</span>
            ${reason}
        </div>`;
    }
    if (filtered.length === 0) html += `<div class="timeline-empty">No travel events</div>`;
    html += `</div></div>`;

    panel.innerHTML = html;

    // Wire filter
    const sel = document.getElementById('travel-timeline-filter');
    if (sel) {
        sel.value = timelineFilter;
        sel.addEventListener('change', (ev) => {
            timelineFilter = ev.target.value;
            renderTravel();
        });
    }
}
