// Player-to-player trading: proximity invite → offers (cards + coins) →
// double-confirm → atomic execution. Any offer change resets BOTH
// confirmations (anti-scam); deck cards can't be traded so decks stay valid;
// owners[] provenance grows on every transfer.
// ctx supplies { players, tradeInvites, send, broadcast, sendProfile,
//   markDirty, CHALLENGE_TTL_MS, CHALLENGE_RANGE }.
//
// Returns { handlers, endTrade } — endTrade is also called from index.js on
// disconnect / session supersede.

const TRADE_MAX_CARDS = 8;

export function createTradeModule(ctx) {
  const { players, tradeInvites, send, broadcast, sendProfile, markDirty,
    CHALLENGE_TTL_MS, CHALLENGE_RANGE } = ctx;

  function validOffer(profile, iids, coins) {
    if (!Array.isArray(iids) || iids.length > TRADE_MAX_CARDS || new Set(iids).size !== iids.length) return false;
    if (!Number.isInteger(coins) || coins < 0 || coins > profile.coins) return false;
    const owned = new Set(profile.cards.map(c => c.iid));
    const decked = new Set(profile.deck);   // deck cards can't be traded — decks stay valid
    return iids.every(iid => typeof iid === 'string' && owned.has(iid) && !decked.has(iid));
  }

  function startTrade(a, b) {
    const tr = { players: [a, b], offers: [{ iids: [], coins: 0 }, { iids: [], coins: 0 }], confirmed: [false, false] };
    a.trade = tr; b.trade = tr;
    for (let s = 0; s < 2; s++) send(tr.players[s], { t: 'tradeStart', partner: tr.players[1 - s].name });
    sendTradeState(tr);
    console.log(`trade start: ${a.name} <-> ${b.name}`);
  }

  function sendTradeState(tr) {
    for (let s = 0; s < 2; s++) {
      const other = tr.players[1 - s];
      const byId = new Map(other.profile.cards.map(c => [c.iid, c]));
      send(tr.players[s], {
        t: 'tradeState',
        yours: { iids: [...tr.offers[s].iids], coins: tr.offers[s].coins },
        theirs: { cards: tr.offers[1 - s].iids.map(iid => byId.get(iid)).filter(Boolean), coins: tr.offers[1 - s].coins },
        confirmed: [tr.confirmed[s], tr.confirmed[1 - s]],   // [you, them]
      });
    }
  }

  function endTrade(tr, reason) {
    for (const p of tr.players) {
      if (p.trade !== tr) continue;
      p.trade = null;
      send(p, { t: 'tradeCancelled', reason });
    }
  }

  function executeTrade(tr) {
    const [a, b] = tr.players;
    if (!validOffer(a.profile, tr.offers[0].iids, tr.offers[0].coins) ||
        !validOffer(b.profile, tr.offers[1].iids, tr.offers[1].coins)) {
      return endTrade(tr, 'Trade failed validation.');
    }
    const move = (from, to, iids) => {
      for (const iid of iids) {
        const i = from.profile.cards.findIndex(c => c.iid === iid);
        const [inst] = from.profile.cards.splice(i, 1);
        inst.owners.push(to.profile.name);   // provenance grows with the trade
        to.profile.cards.push(inst);
      }
    };
    move(a, b, tr.offers[0].iids);
    move(b, a, tr.offers[1].iids);
    a.profile.coins += tr.offers[1].coins - tr.offers[0].coins;
    b.profile.coins += tr.offers[0].coins - tr.offers[1].coins;
    markDirty(a.profile);
    markDirty(b.profile);
    for (const p of tr.players) {
      p.trade = null;
      send(p, { t: 'tradeComplete' });
      sendProfile(p);
    }
    broadcast({ t: 'chat', from: '[Server]', text: `${a.name} and ${b.name} completed a trade.` });
    console.log(`trade done: ${a.name} gave ${tr.offers[0].iids.length} cards + ${tr.offers[0].coins}c, ${b.name} gave ${tr.offers[1].iids.length} cards + ${tr.offers[1].coins}c`);
  }

  const handlers = {
    tradeRequest(me, msg) {
      const target = players.get(msg.target);
      if (target && !target.room && !me.room && !target.trade && !me.trade && target !== me
          && Math.hypot(target.x - me.x, target.z - me.z) <= CHALLENGE_RANGE) {
        tradeInvites.set(me.id + ':' + target.id, Date.now() + CHALLENGE_TTL_MS);
        send(target, { t: 'tradeInvite', from: me.id, name: me.name });
        send(me, { t: 'chat', from: '[Server]', text: 'Trade offer sent to ' + target.name + '.' });
      }
    },

    tradeAccept(me, msg) {
      const key = msg.from + ':' + me.id;
      const expiry = tradeInvites.get(key);
      tradeInvites.delete(key);
      if (!expiry || expiry < Date.now()) return;
      const other = players.get(msg.from);
      if (other && !other.room && !me.room && !other.trade && !me.trade && other !== me) startTrade(other, me);
    },

    tradeOffer(me, msg) {
      const tr = me.trade;
      if (!tr) return;
      const iids = Array.isArray(msg.iids) ? msg.iids : [];
      const coins = Number.isInteger(msg.coins) ? msg.coins : 0;
      if (!validOffer(me.profile, iids, coins)) {
        send(me, { t: 'chat', from: '[Server]', text: 'Trade offer rejected — cards in your active deck can’t be traded.' });
        return;
      }
      tr.offers[tr.players.indexOf(me)] = { iids: [...iids], coins };
      tr.confirmed = [false, false];   // any change voids both confirmations
      sendTradeState(tr);
    },

    tradeConfirm(me) {
      const tr = me.trade;
      if (!tr) return;
      tr.confirmed[tr.players.indexOf(me)] = true;
      if (tr.confirmed[0] && tr.confirmed[1]) executeTrade(tr);
      else sendTradeState(tr);
    },

    tradeCancel(me) {
      if (me.trade) endTrade(me.trade, me.name + ' cancelled the trade.');
    },
  };

  return { handlers, endTrade };
}
