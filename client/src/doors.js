// House-1 pocket-room pilot: mirrors interact.js's "press E" pattern for
// NPCs, but for entering/exiting a building. No server involvement — the
// teleport is a plain position set, same as every other position-setting
// call in main.js (position is client-authoritative/cosmetic, see CLAUDE.md).
import { player } from './state.js';
import { dist2 } from './utils.js';
import {
  DOOR_OUTSIDE, DOOR_ENTER_RADIUS,
  ROOM_SPAWN, ROOM_EXIT_TRIGGER, ROOM_EXIT_RADIUS, EXIT_SPAWN,
} from './world.js';

// Tracks which side of the teleport the player is on. Deliberately NOT
// persisted (session/profile only store x/z) — if the page reloads while
// inside, this resets to false, so the very next WASD press hits main.js's
// world-boundary clamp (skipped only while insideHouse1 is true) and pulls
// the player back into the main map instead of leaving them stranded.
export let insideHouse1 = false;

// Returns prompt HTML for the on-screen "press E" hint, or null.
export function doorPrompt() {
  if (!insideHouse1) {
    return dist2(player, DOOR_OUTSIDE) < DOOR_ENTER_RADIUS ? '<b>E</b> — enter the house' : null;
  }
  return dist2(player, ROOM_EXIT_TRIGGER) < ROOM_EXIT_RADIUS ? '<b>E</b> — leave the house' : null;
}

// Call on an E keydown when doorPrompt() was non-null. Returns true if it
// actually teleported (defensive re-check in case state changed this frame).
export function handleDoorInteract() {
  if (!insideHouse1) {
    if (dist2(player, DOOR_OUTSIDE) >= DOOR_ENTER_RADIUS) return false;
    player.x = ROOM_SPAWN.x; player.z = ROOM_SPAWN.z;
    insideHouse1 = true;
    return true;
  }
  if (dist2(player, ROOM_EXIT_TRIGGER) >= ROOM_EXIT_RADIUS) return false;
  player.x = EXIT_SPAWN.x; player.z = EXIT_SPAWN.z;
  insideHouse1 = false;
  return true;
}
