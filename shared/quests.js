// Quest definitions + gating logic — shared so the server can validate
// accepts/turn-ins and award progress, while the client renders text and
// markers from the same data.
//
// Quest state lives in profile.quests: { [id]: { state: 'active'|'completed', have } }
// (absent = hidden). All duel-objective: duels.target is a duelist id or 'any'.

export const QUESTS = [
  {
    id: 'ropes', giver: 'marla', title: 'Learning the Ropes', minLvl: 1, prereq: null,
    duels: { target: 'rowan', need: 1 }, xp: 120, coins: 10,
    offer: "New face, new deck. Rowan by the well fancies himself the village champion — go show him what your cards can do. Win or lose, you'll learn something.",
    obj: have => `Defeat Duelist Rowan: ${have}/1`,
    thanks: "Beat Rowan at his own table! He'll sulk for a week. The realm thanks you.",
  },
  {
    id: 'practice', giver: 'marla', title: 'Table Stakes', minLvl: 2, prereq: 'ropes',
    duels: { target: 'any', need: 3 }, xp: 200, coins: 15,
    offer: "Talent needs sharpening. Win three duels — I don't care against whom. Every opponent plays the game differently, and you should see it all.",
    obj: have => `Win duels: ${have}/3`,
    thanks: "Three wins. You're getting a reputation around the hearth.",
  },
  {
    id: 'vex', giver: 'aldric', title: 'Red Sashes at Dusk', minLvl: 2, prereq: null,
    duels: { target: 'vex', need: 1 }, xp: 280, coins: 20,
    offer: "The Red-Sash camp in the western woods runs on one thing: Vex never loses a duel. Beat her in front of her own crew and the whole outfit loses its swagger.",
    obj: have => `Defeat Vex the Red-Sash: ${have}/1`,
    thanks: "Vex, beaten at her own game. The road breathes easier tonight.",
  },
  {
    id: 'gruk', giver: 'aldric', title: 'The Boar King', minLvl: 3, prereq: 'vex',
    duels: { target: 'gruk', need: 1 }, xp: 500, coins: 50,
    offer: "East past the ridge there's a hollow of bones, and in it, Gruk — the Boar King. They say he plays cards. They say nobody's ever won. Don't be like everybody.",
    obj: have => `Defeat Gruk the Boar King: ${have}/1`,
    thanks: "You out-played the Boar King himself. You'll be a story in this village for a hundred years.",
  },
];

export const questById = id => QUESTS.find(q => q.id === id);

export const stateOf = (profile, id) => profile.quests?.[id]?.state || 'hidden';

export function canAccept(profile, id) {
  const q = questById(id);
  return !!q && stateOf(profile, id) === 'hidden' && profile.lvl >= q.minLvl &&
    (!q.prereq || stateOf(profile, q.prereq) === 'completed');
}

export function canTurnin(profile, id) {
  const q = questById(id);
  const st = profile.quests?.[id];
  return !!q && st?.state === 'active' && st.have >= q.duels.need;
}

// duel-win progress: mutates profile.quests, returns [{id, have}] increments.
// npcId is null for PvP wins (only 'any' quests progress).
export function progressDuelWin(profile, npcId) {
  const events = [];
  for (const q of QUESTS) {
    const st = profile.quests?.[q.id];
    if (st?.state === 'active' && st.have < q.duels.need &&
        (q.duels.target === 'any' || q.duels.target === npcId)) {
      st.have++;
      events.push({ id: q.id, have: st.have });
    }
  }
  return events;
}
