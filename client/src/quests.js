// Client-side quest view. Definitions live in shared/quests.js; the state
// itself is a mirror of profile.quests, synced from server profileUpdate
// messages. The server validates all accepts, turn-ins, and progress.

import { $ } from './utils.js';
import { player, npcs } from './state.js';
import { QUESTS, stateOf, canAccept, canTurnin } from '../../shared/quests.js';
import { marla, aldric } from './world.js';

let qs = {};   // { [id]: {state, have} } — server mirror

export function setQuests(quests) {
  qs = quests || {};
  for (const n of npcs) updateMark(n);
  renderTracker();
}

const profileView = () => ({ lvl: player.lvl, quests: qs });
const giverNpc = key => (key === 'marla' ? marla : aldric);

export function npcQuest(n) {
  return QUESTS.find(q => giverNpc(q.giver) === n && canAccept(profileView(), q.id));
}

export function npcTurnin(n) {
  return QUESTS.find(q => giverNpc(q.giver) === n && canTurnin(profileView(), q.id));
}

export function npcActiveQuest(n) {
  return QUESTS.find(q => giverNpc(q.giver) === n && stateOf(profileView(), q.id) === 'active');
}

export function questHave(id) { return qs[id]?.have || 0; }

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
        const d = have >= q.duels.need;
        const giver = giverNpc(q.giver).name.split(' ').pop();
        return `<div class="q"><div class="t">${q.title}</div><div class="o ${d ? 'done' : ''}">${d ? '✓ Return to ' + giver : q.obj(have)}</div></div>`;
      }).join('')
    : '<div style="color:var(--ink-dim);font-style:italic">No quests. Look for a golden <span style="color:#f0d060">!</span></div>';
}
