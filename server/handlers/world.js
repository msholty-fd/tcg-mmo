// World-presence handlers: position stream (with visit-quest progress) + chat.
// ctx supplies { send, sendProfile, broadcast, markDirty }.

import { progressVisit } from '../../shared/quests.js';

const WORLD_RADIUS = 220;   // playable disc is r=210 (client/src/main.js); slack for lag
const CHAT_MAX = 5, CHAT_WINDOW_MS = 5_000;   // per-connection chat lines

export function createWorldHandlers(ctx) {
  const { send, sendProfile, broadcast, markDirty } = ctx;

  return {
    pos(me, msg) {
      const x = +msg.x || 0, z = +msg.z || 0;
      const r = Math.hypot(x, z);
      const s = r > WORLD_RADIUS ? WORLD_RADIUS / r : 1;
      me.x = x * s; me.z = z * s; me.yaw = +msg.yaw || 0;
      // in-memory only at 10Hz; persisted by the disconnect markDirty and
      // whatever other saves happen along the way
      me.profile.x = me.x; me.profile.z = me.z; me.profile.yaw = me.yaw;
      // visit-quest progress rides the position stream (shared/quests.js
      // progressVisit — cheap scan, early-outs unless a visit quest is
      // active and newly satisfied). sendProfile syncs the client's quest
      // mirror; the questEvent is the chat-log ping, same as duel wins.
      const events = progressVisit(me.profile, me.x, me.z);
      if (events.length) {
        markDirty(me.profile);
        for (const ev of events) send(me, { t: 'questEvent', kind: 'progress', ...ev });
        sendProfile(me);
      }
    },

    chat(me, msg) {
      const now = Date.now();
      const chatTimes = me.chatTimes;
      while (chatTimes.length && chatTimes[0] < now - CHAT_WINDOW_MS) chatTimes.shift();
      if (chatTimes.length >= CHAT_MAX) {
        send(me, { t: 'chat', from: '[Server]', text: 'You are chatting too fast.' });
        return;
      }
      const text = String(msg.text || '').slice(0, 200).trim();
      if (text) { chatTimes.push(now); broadcast({ t: 'chat', from: me.name, text }); }
    },
  };
}
