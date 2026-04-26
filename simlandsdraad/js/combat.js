import { S, FC } from './shared.js';

const TYPE_ICON = { ordered: '⚔️', kanly: '🗡️', spar: '🥊' };
const TYPE_LABEL = { ordered: 'Ordered Combat', kanly: 'Kanly Duel', spar: 'Training Spar' };
const END_COLOR = { death: '#e53e3e', submission: '#ed8936', knockout: '#ed8936', spar_stop: '#48bb78' };

export function renderCombat() {
    const p = document.getElementById('p-combat');
    const log = S.D.combatLog || [];
    if (!log.length) { p.innerHTML = '<h3 style="color:var(--gold)">No combat events this run</h3>'; return; }

    // Stats
    const deaths = log.filter(e => e.endType === 'death').length;
    const spars = log.filter(e => e.type === 'spar').length;
    const ordered = log.filter(e => e.type === 'ordered').length;
    const duels = log.filter(e => e.type === 'kanly').length;

    // Kill board
    const kills = {};
    log.filter(e => e.endType === 'death').forEach(e => { kills[e.winner] = (kills[e.winner] || 0) + 1; });
    const killRows = Object.entries(kills).sort((a, b) => b[1] - a[1]).map(([name, count]) =>
        `<span style="color:#e53e3e">💀 ${name}: ${count} kill${count > 1 ? 's' : ''}</span>`
    ).join(' &middot; ');

    // Fighter record
    const records = {};
    log.forEach(e => {
        if (!records[e.attacker]) records[e.attacker] = { wins: 0, losses: 0, kills: 0, deaths: 0, spars: 0 };
        if (!records[e.defender]) records[e.defender] = { wins: 0, losses: 0, kills: 0, deaths: 0, spars: 0 };
        if (e.type === 'spar') { records[e.attacker].spars++; records[e.defender].spars++; }
        records[e.winner].wins++;
        records[e.loser].losses++;
        if (e.endType === 'death') { records[e.winner].kills++; records[e.loser].deaths++; }
    });

    const recordRows = Object.entries(records)
        .sort((a, b) => (b[1].wins - b[1].losses) - (a[1].wins - a[1].losses))
        .map(([name, r]) => {
            const char = S.D.characters.find(c => c.name === name);
            const color = char ? FC[char.faction] || '#888' : '#888';
            return `<tr>
                <td style="color:${color}">${name}</td>
                <td style="color:#48bb78">${r.wins}</td>
                <td style="color:#e53e3e">${r.losses}</td>
                <td>${r.spars}</td>
                <td style="color:#e53e3e">${r.kills}</td>
                <td style="color:#e53e3e">${r.deaths}</td>
            </tr>`;
        }).join('');

    // Event log (newest first)
    const eventRows = [...log].reverse().map((e, i) => {
        const icon = TYPE_ICON[e.type] || '⚔️';
        const endColor = END_COLOR[e.endType] || '#888';
        const roundLog = (e.log || []).map(l => `<div class="combat-round">${l}</div>`).join('');
        const detailId = `combat-detail-${i}`;
        return `<div class="combat-event" style="border-left:3px solid ${endColor};margin-bottom:8px;padding:8px 12px;background:var(--bg3);border-radius:4px;cursor:pointer" onclick="this.querySelector('.combat-detail').classList.toggle('hidden')">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                    <span style="font-size:1.1em">${icon}</span>
                    <strong>W${e.tick}</strong> &middot;
                    <span style="color:${endColor}">${e.attacker}</span> vs <span style="color:${endColor}">${e.defender}</span>
                    ${e.orderedBy ? `<span style="color:#888;font-size:.85em">(ordered by ${e.orderedBy})</span>` : ''}
                </div>
                <div style="color:${endColor};font-weight:600">${e.endType.toUpperCase()}</div>
            </div>
            <div class="combat-detail hidden" style="margin-top:8px;font-size:.85em;color:#aaa">
                <div>${TYPE_LABEL[e.type] || e.type} &middot; ${e.rounds} rounds &middot; Winner: ${e.winner}</div>
                ${roundLog}
            </div>
        </div>`;
    }).join('');

    p.innerHTML = `
        <div style="display:flex;gap:24px;margin-bottom:16px;flex-wrap:wrap">
            <div style="background:var(--bg3);padding:12px 20px;border-radius:8px;text-align:center">
                <div style="font-size:1.5em;font-weight:700">${log.length}</div><div style="color:#888;font-size:.8em">Total Fights</div>
            </div>
            <div style="background:var(--bg3);padding:12px 20px;border-radius:8px;text-align:center">
                <div style="font-size:1.5em;font-weight:700;color:#e53e3e">${deaths}</div><div style="color:#888;font-size:.8em">Deaths</div>
            </div>
            <div style="background:var(--bg3);padding:12px 20px;border-radius:8px;text-align:center">
                <div style="font-size:1.5em;font-weight:700">${ordered}</div><div style="color:#888;font-size:.8em">Ordered</div>
            </div>
            <div style="background:var(--bg3);padding:12px 20px;border-radius:8px;text-align:center">
                <div style="font-size:1.5em;font-weight:700">${duels}</div><div style="color:#888;font-size:.8em">Kanly</div>
            </div>
            <div style="background:var(--bg3);padding:12px 20px;border-radius:8px;text-align:center">
                <div style="font-size:1.5em;font-weight:700">${spars}</div><div style="color:#888;font-size:.8em">Spars</div>
            </div>
        </div>
        ${killRows ? `<div style="margin-bottom:16px;padding:8px 12px;background:var(--bg3);border-radius:6px">${killRows}</div>` : ''}
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
            <div style="flex:1;min-width:300px">
                <h3 style="color:var(--gold);margin:0 0 8px;font-size:1rem">Fighter Records</h3>
                <table style="width:100%;border-collapse:collapse;font-size:.85em">
                    <tr style="color:#888"><th style="text-align:left">Fighter</th><th>W</th><th>L</th><th>Spars</th><th>Kills</th><th>Deaths</th></tr>
                    ${recordRows}
                </table>
            </div>
        </div>
        <h3 style="color:var(--gold);margin:0 0 8px;font-size:1rem">Combat Log</h3>
        <div style="max-height:500px;overflow-y:auto">${eventRows}</div>
    `;
}
