// Headless starter-deck balance sim.
//   node scripts/sim-starters.mjs [gamesPerSide]
// Plays every starter pairing both ways (each deck goes first half the time)
// and prints win rates + basic diagnostics. Also usable mid-balance-pass to
// measure a candidate change.

import '../shared/sets/core/cards.js';
import { STARTER_DECKS } from '../shared/sets/core/cards.js';
import { createDuel } from '../shared/engine/state.js';
import { startTurn } from '../shared/engine/engine.js';
import { takeTurn } from '../shared/engine/ai.js';

const N = +(process.argv[2] || 100);   // games per side per pairing
const names = Object.keys(STARTER_DECKS);

function playGame(deckA, deckB, seed) {
  const duel = createDuel([...deckA], [...deckB], { seed });
  startTurn(duel);
  let turns = 0;
  while (duel.winner === null && ++turns < 200) takeTurn(duel, duel.active);
  return { winner: duel.winner, turns, stuck: duel.winner === null };
}

console.log(`starter round-robin, ${N} games per side per pairing (${2 * N} per pairing)\n`);
for (let i = 0; i < names.length; i++) {
  for (let j = i + 1; j < names.length; j++) {
    const [a, b] = [names[i], names[j]];
    let aWins = 0, bWins = 0, stuck = 0, totalTurns = 0;
    for (let g = 0; g < N; g++) {
      const r1 = playGame(STARTER_DECKS[a], STARTER_DECKS[b], 1000 + g);   // a first
      const r2 = playGame(STARTER_DECKS[b], STARTER_DECKS[a], 5000 + g);   // b first
      for (const [r, firstIsA] of [[r1, true], [r2, false]]) {
        if (r.stuck) { stuck++; continue; }
        totalTurns += r.turns;
        const aWon = firstIsA ? r.winner === 0 : r.winner === 1;
        if (aWon) aWins++; else bWins++;
      }
    }
    const done = aWins + bWins;
    console.log(`${a} vs ${b}: ${aWins}-${bWins} (${(100 * aWins / done).toFixed(0)}% ${a})` +
      `  avg ${(totalTurns / done).toFixed(1)} turns${stuck ? `  STUCK: ${stuck}` : ''}`);
  }
}
