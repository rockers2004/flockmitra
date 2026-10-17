/**
 * Database open + migration runner.
 *
 * Single memoized connection for the app's lifetime (one local user, one
 * farm). Migrations apply inside transactions keyed off PRAGMA user_version,
 * so a failed migration rolls back and can be retried; a database newer than
 * the app understands (downgrade) fails fast instead of guessing.
 *
 * This module imports expo-sqlite and is therefore exercised on-device, not
 * under node --test (see migrations.test.ts for the pure structure tests).
 */
import * as SQLite from 'expo-sqlite';

import { LATEST_MIGRATION_VERSION, MIGRATIONS } from './migrations.ts';

const DATABASE_NAME = 'flockmitra.db';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

export class DatabaseVersionError extends Error {}

async function openAndMigrate(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);

  // Enforce daily_reports.batch_id → batches.id for the connection's lifetime.
  await db.execAsync('PRAGMA foreign_keys = ON');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  if (currentVersion > LATEST_MIGRATION_VERSION) {
    throw new DatabaseVersionError(
      `Database schema v${currentVersion} is newer than this app supports (v${LATEST_MIGRATION_VERSION}).`,
    );
  }

  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) {
      continue;
    }
    await db.withTransactionAsync(async () => {
      for (const statement of migration.statements) {
        await db.execAsync(statement);
      }
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
    });
  }

  return db;
}

/**
 * Opens (and if needed migrates) the app database. Failures clear the memo
 * so callers can retry; `reload` style UI states rely on that.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (databasePromise === null) {
    databasePromise = openAndMigrate().catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
