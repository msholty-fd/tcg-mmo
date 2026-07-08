import { $, dist2 } from './utils.js';
import { player, npcs } from './state.js';
import { say } from './ui.js';
import { npcQuest, npcTurnin, npcActiveQuest, questHave } from './quests.js';
import { objNeed } from '../../shared/quests.js';
import { marla } from './world.js';
import { startDuel } from './duel/duelManager.js';
import { openShop } from './shop.js';
import { isConnected, requestNpcDuel, sendQuestAccept, sendQuestTurnin } from './net.js';

export let dialogueT = 0;

export function tickDialogue(dt) {
  if (dialogueT > 0) { dialogueT -= dt; if (dialogueT <= 0) $('dialogue').style.display = 'none'; }
}

export function nearestInteract() {
  let best = null, bd = 3.9;
  for (const n of npcs) {
    if (n.mesh && n.mesh.visible === false) continue;   // e.g. the night-only Ashen Sentinel by day
    const d = dist2(n, player); if (d < bd) { bd = d; best = n; }
  }
  return best;
}

export function handleInteract() {
  const n = nearestInteract(); if (!n) return;

  // quests are server-managed — the dialogue is optimistic, the server
  // validates and the profileUpdate/questEvent messages confirm. This runs
  // BEFORE the duel check so a duelist who is also a quest giver (Vex, Gruk)
  // hands out turn-ins/offers instead of always launching a duel — but an
  // active, not-yet-completable quest does NOT block dueling them (see the
  // duel check just below), since some of their own quests require beating
  // them again.
  const turnin = npcTurnin(n);
  if (turnin && isConnected()) {
    sendQuestTurnin(turnin.id);
    say(n.name, turnin.thanks, `Reward: ${turnin.xp} XP, ${turnin.coins} coins`);
    dialogueT = 7;
    return;
  }

  const offer = npcQuest(n);
  if (offer && isConnected()) {
    sendQuestAccept(offer.id);
    say(n.name, offer.offer, `New quest: ${offer.title}`);
    dialogueT = 7;
    return;
  }

  if ((turnin || offer) && !isConnected()) {
    say(n.name, 'The realm is quiet right now — reconnect to take on quests.');
    dialogueT = 5;
    return;
  }

  if (n.duelist) {
    // online: server runs the duel (authoritative rewards); offline: local engine
    if (isConnected()) requestNpcDuel(n.duelist.id);
    else startDuel(n.duelist);
    return;
  }

  // Marla's default conversation is her pack shop (quest business wins above)
  if (n === marla) {
    openShop();
    return;
  }

  const active = npcActiveQuest(n);
  if (active) {
    const done = questHave(active.id) >= objNeed(active);
    say(n.name, done ? 'Well?' : '(' + active.obj(questHave(active.id)) + ') Off you go — the cards won\'t play themselves.');
    dialogueT = 7;
    return;
  }

  // Optional per-NPC flavor lines (n.flavor: string | string[]) for NPCs with
  // nothing mechanical to offer — Old Bram at Bram's Rest is the first user
  // (see DESIGN.md). A single string always shows the same line, an array
  // picks one at random each time; anything without .flavor keeps the
  // original generic line so every earlier NPC is unaffected.
  if (n.flavor) {
    const line = Array.isArray(n.flavor) ? n.flavor[Math.floor(Math.random() * n.flavor.length)] : n.flavor;
    say(n.name, line);
    dialogueT = 6;
    return;
  }

  say(n.name, 'Keep to the roads after dark, adventurer.');
  dialogueT = 5;
}
