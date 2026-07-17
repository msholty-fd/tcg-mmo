// Client-side quest view. Definitions live in shared/quests.js; the state
// itself is a mirror of profile.quests, synced from server profileUpdate
// messages. The server validates all accepts, turn-ins, and progress.

import { $ } from './utils.js';
import { player, npcs } from './state.js';
import { QUESTS, questById, stateOf, canAccept, canTurnin, collectHave, objNeed } from '../../shared/quests.js';
import { marla, aldric, vex, grukNpc, yara, bram, sentinel, wynn, hobb } from './world.js';
import { getCards } from './collection.js';

let qs = {};   // { [id]: {state, have} } — server mirror

export function setQuests(quests) {
  qs = quests || {};
  for (const n of npcs) updateMark(n);
  renderTracker();
}

// cards are included so canTurnin/collectHave can check collect objectives
// against the client's mirrored collection (kept in sync via profileUpdate).
const profileView = () => ({ lvl: player.lvl, quests: qs, cards: getCards() });
// giver id -> NPC object; any NPC can be a quest giver (server doesn't care —
// see shared/quests.js). Vex, Gruk, and the Sentinel are duelists who also
// give quests; the Sentinel's night-only visibility gates his for free.
const GIVERS = { marla, aldric, vex, gruk: grukNpc, yara, bram, sentinel, wynn, hobb };
const giverNpc = key => GIVERS[key];

export function npcQuest(n) {
  return QUESTS.find(q => giverNpc(q.giver) === n && canAccept(profileView(), q.id));
}

export function npcTurnin(n) {
  return QUESTS.find(q => giverNpc(q.giver) === n && canTurnin(profileView(), q.id));
}

export function npcActiveQuest(n) {
  return QUESTS.find(q => giverNpc(q.giver) === n && stateOf(profileView(), q.id) === 'active');
}

export function questHave(id) {
  const q = questById(id);
  if (q?.collect) return Math.min(collectHave(profileView(), q), q.collect.need);
  return qs[id]?.have || 0;
}

// Where on the map does an active quest point? Fully derived, no hardcoded
// coords: duel quests point at the target duelist's spawn; collect quests
// point at the duelist whose reward pool drops the card (n.duelist.rewards);
// a finished objective points back at the giver ("return to X"). 'any'-target
// duel quests (win N anywhere) have no single spot, so they get no marker.
// Returns null when no location applies — fullmap.js just skips it.
function questLocation(q, done) {
  if (done) return giverNpc(q.giver);
  if (q.visit) return q.visit;   // visit quests carry their own {x, z}
  if (q.duels) {
    if (q.duels.target === 'any') return null;
    return npcs.find(n => n.duelist?.id === q.duels.target) || null;
  }
  if (q.collect) {
    return npcs.find(n => n.duelist?.rewards?.includes(q.collect.cardId))
      || giverNpc(q.giver);
  }
  return null;
}

// Marker data for the full map (fullmap.js). One entry per active quest that
// has a resolvable location: { x, z, title, done }. `done` (objective met,
// ready to turn in) points at the giver and is styled differently.
export function activeQuestMarkers() {
  const out = [];
  for (const q of QUESTS) {
    if (stateOf(profileView(), q.id) !== 'active') continue;
    const done = questHave(q.id) >= objNeed(q);
    const loc = questLocation(q, done);
    if (loc) out.push({ x: loc.x, z: loc.z, title: q.title, done });
  }
  return out;
}

export function updateMark(n) {
  const done = npcTurnin(n), avail = npcQuest(n);
  n.mark.visible = !!(done || avail);
  const c = n.mark.material.map.image.getContext('2d');
  c.clearRect(0, 0, 64, 64); c.font = 'bold 48px Georgia'; c.textAlign = 'center';
  c.shadowColor = '#000'; c.shadowBlur = 6; c.fillStyle = '#f0d060';
  c.fillText(done ? '?' : '!', 32, 46);
  n.mark.material.map.needsUpdate = true;
}

export function renderTracker() {
  const act = QUESTS.filter(q => stateOf(profileView(), q.id) === 'active');
  $('tracker-list').innerHTML = act.length
    ? act.map(q => {
        const have = questHave(q.id);
        const d = have >= objNeed(q);
        const giver = giverNpc(q.giver).name.split(' ').pop();
        return `<div class="q"><div class="t">${q.title}</div><div class="o ${d ? 'done' : ''}">${d ? '✓ Return to ' + giver : q.obj(have)}</div></div>`;
      }).join('')
    : '<div style="color:var(--ink-dim);font-style:italic">No quests. Look for a golden <span style="color:#f0d060">!</span></div>';
}
