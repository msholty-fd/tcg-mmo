// Headless test for the supply-pack system (the coin sink).
//   node scripts/test-packs.mjs
// Registers both sets, then checks every pack in the global registry:
// definition shape, zone-scoped rolls (a pack only pulls from its own set),
// rarity-weight behavior, and deterministic-rng edge cases.

import '../shared/sets/core/cards.js';            // registers the core set
import '../shared/sets/emberpeaks/cards.js';      // registers the emberpeaks set
import { getCard, cardsInSet } from '../shared/engine/cards.js';
import { PACKS, rollPack } from '../shared/sets/core/packs.js';

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; } else { fail++; console.error('  ✗ ' + msg); } };

// ---- 1. registry shape ------------------------------------------------------
console.log('1. registry shape');
ok(Object.keys(PACKS).length === 2, `registry has 2 packs (got ${Object.keys(PACKS).length})`);
for (const [key, p] of Object.entries(PACKS)) {
  ok(p.id === key, `pack "${key}" id matches its registry key`);
  ok(typeof p.name === 'string' && p.name.length > 0, `pack "${key}" has a name`);
  ok(typeof p.desc === 'string' && p.desc.length > 0, `pack "${key}" has a desc (shop UI reads it)`);
  ok(Number.isInteger(p.price) && p.price > 0, `pack "${key}" has a positive price`);
  ok(Number.isInteger(p.size) && p.size > 0, `pack "${key}" has a positive size`);
  ok(p.vendor && typeof p.vendor.name === 'string'
     && Number.isFinite(p.vendor.x) && Number.isFinite(p.vendor.z),
     `pack "${key}" has a vendor with name + coords`);
  ok(cardsInSet(p.set).length > 0, `pack "${key}" set "${p.set}" has cards registered`);
  const rarities = new Set(cardsInSet(p.set).map(c => c.rarity));
  for (const r of Object.keys(p.weights)) {
    ok(rarities.has(r), `pack "${key}" weight rarity "${r}" exists in set "${p.set}"`);
  }
}

// ---- 2. rolls are zone-scoped and resolve -----------------------------------
console.log('2. rolls (200 per pack)');
for (const p of Object.values(PACKS)) {
  const setIds = new Set(cardsInSet(p.set).map(c => c.id));
  const seenRarities = new Set();
  for (let i = 0; i < 200; i++) {
    const ids = rollPack(p);
    ok(ids.length === p.size, `pack "${p.id}" roll has ${p.size} cards`);
    for (const id of ids) {
      ok(setIds.has(id), `pack "${p.id}" pull "${id}" belongs to set "${p.set}"`);
      let def; try { def = getCard(id); } catch {}
      ok(!!def, `pack "${p.id}" pull "${id}" resolves via getCard`);
      if (def) seenRarities.add(def.rarity);
    }
  }
  // over 1000 pulls every weighted rarity should show up
  for (const r of Object.keys(p.weights)) {
    ok(seenRarities.has(r), `pack "${p.id}" pulled at least one ${r} in 200 rolls`);
  }
}

// ---- 3. deterministic rng edges ---------------------------------------------
console.log('3. rng edges');
for (const p of Object.values(PACKS)) {
  const setIds = new Set(cardsInSet(p.set).map(c => c.id));
  const lo = rollPack(p, () => 0);          // always the first weight bucket + first card
  const hi = rollPack(p, () => 0.999999);   // always the last bucket + last card
  ok(lo.length === p.size && lo.every(id => setIds.has(id)), `pack "${p.id}" rng=0 roll is valid`);
  ok(hi.length === p.size && hi.every(id => setIds.has(id)), `pack "${p.id}" rng→1 roll is valid`);
}

// ---- 4. vendor coords match the client world spawns --------------------------
// world.js is THREE-laden (can't import here); assert the literals instead so
// a coord drift between packs.js and world.js fails the test at least one way.
console.log('4. vendor coords');
import { readFileSync } from 'node:fs';
const world = readFileSync(new URL('../client/src/world.js', import.meta.url), 'utf8');
ok(/spawnNPC\('Quartermaster Marla', 3\.5, 4/.test(world), 'Marla spawn matches boarlands vendor (3.5, 4)');
ok(PACKS.boarlands.vendor.x === 3.5 && PACKS.boarlands.vendor.z === 4, 'boarlands vendor coords are (3.5, 4)');
ok(/spawnNPC\('Sutler Varn', EP\.x \+ 14, EP\.z - 39/.test(world), 'Varn spawn matches emberpeaks vendor (EP 0,235 → 14, 196)');
ok(PACKS.emberpeaks.vendor.x === 14 && PACKS.emberpeaks.vendor.z === 196, 'emberpeaks vendor coords are (14, 196)');
ok(/vendorPack = 'boarlands'/.test(world) && /vendorPack = 'emberpeaks'/.test(world),
   'both vendors carry .vendorPack for interact.js');

console.log(`\n${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
