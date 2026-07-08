// SQLite persistence for player profiles (node:sqlite — built into Node 22+,
// no native deps). One row per profile keyed by the server-issued token; the
// full profile lives in a JSON `data` column because the game mutates profile
// objects in place and the in-memory map stays the runtime source of truth.
// The DB is the durable copy: dirty profiles are upserted in one transaction
// instead of rewriting every player like the old profiles.json did.
//
// First boot migrates a legacy profiles.json (DATA_FILE) into the DB, then
// renames it to *.migrated so it can't be imported twice but survives as a
// backup.

import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

export function openProfileStore(dbFile, legacyJsonFile) {
  const db = new DatabaseSync(dbFile);
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      token      TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      data       TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  const upsert = db.prepare(`
    INSERT INTO profiles (token, name, data, updated_at) VALUES (?, ?, ?, ?)
    ON CONFLICT(token) DO UPDATE SET name = excluded.name,
      data = excluded.data, updated_at = excluded.updated_at
  `);

  function saveMany(entries) {   // entries: [token, profile][]
    if (!entries.length) return;
    db.exec('BEGIN');
    try {
      const now = Date.now();
      for (const [token, profile] of entries) {
        upsert.run(token, profile.name, JSON.stringify(profile), now);
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }

  const count = () => db.prepare('SELECT COUNT(*) AS n FROM profiles').get().n;

  // one-time import of the legacy JSON file; a corrupt file is fatal on
  // purpose — silently starting empty would orphan every player
  if (count() === 0 && legacyJsonFile && fs.existsSync(legacyJsonFile)) {
    let legacy;
    try {
      legacy = JSON.parse(fs.readFileSync(legacyJsonFile, 'utf8'));
    } catch (err) {
      console.error(`FATAL: legacy ${legacyJsonFile} exists but could not be parsed: ${err.message}`);
      console.error('Refusing to start with an empty DB. Fix or move the file, then restart.');
      process.exit(1);
    }
    saveMany(Object.entries(legacy));
    fs.renameSync(legacyJsonFile, legacyJsonFile + '.migrated');
    console.log(`migrated ${Object.keys(legacy).length} profiles from ${legacyJsonFile} into ${dbFile}`);
  }

  function loadAll() {
    const out = {};
    for (const row of db.prepare('SELECT token, data FROM profiles').all()) {
      out[row.token] = JSON.parse(row.data);
    }
    return out;
  }

  return { loadAll, saveMany, close: () => db.close() };
}
