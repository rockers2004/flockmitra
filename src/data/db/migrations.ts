/**
 * Ordered, append-only schema migrations.
 *
 * Pure data — no expo-sqlite import — so structure is testable under
 * `node --test` (SQL text itself is executed only on-device).
 *
 * Rules (AGENTS.md: do not silently change database schemas):
 * - Never edit a migration that may have shipped; add version N+1.
 * - Versions are strictly increasing starting at 1.
 * - The runner applies only migrations newer than PRAGMA user_version.
 */
export interface Migration {
  readonly version: number;
  readonly name: string;
  readonly statements: readonly string[];
}

export const MIGRATIONS: readonly Migration[] = [
  {
    version: 1,
    name: 'create_batches',
    statements: [
      `CREATE TABLE batches (
        id                  TEXT    PRIMARY KEY NOT NULL,
        name                TEXT    NOT NULL CHECK (length(trim(name)) > 0),
        poultry_type        TEXT    NOT NULL CHECK (poultry_type IN ('broiler', 'layer', 'desi')),
        initial_bird_count  INTEGER NOT NULL CHECK (initial_bird_count >= 0),
        start_date          TEXT    NOT NULL,
        status              TEXT    NOT NULL DEFAULT 'active'
                                  CHECK (status IN ('active', 'closingReview', 'completed')),
        created_at          TEXT    NOT NULL,
        updated_at          TEXT    NOT NULL
      )`,
      // Status drives the Batches screen's lifecycle sections.
      'CREATE INDEX idx_batches_status ON batches(status)',
      // Start date drives sorting and future date-based queries.
      'CREATE INDEX idx_batches_start_date ON batches(start_date)',
    ],
  },
  {
    version: 2,
    name: 'create_daily_reports',
    statements: [
      `CREATE TABLE daily_reports (
        id                      TEXT    PRIMARY KEY NOT NULL,
        batch_id                TEXT    NOT NULL REFERENCES batches(id),
        report_date             TEXT    NOT NULL,
        opening_bird_count      INTEGER NOT NULL CHECK (opening_bird_count >= 0),
        additions               INTEGER NOT NULL CHECK (additions >= 0),
        transfers_in            INTEGER NOT NULL CHECK (transfers_in >= 0),
        deaths                  INTEGER NOT NULL CHECK (deaths >= 0),
        culls                   INTEGER NOT NULL CHECK (culls >= 0),
        sales                   INTEGER NOT NULL CHECK (sales >= 0),
        transfers_out           INTEGER NOT NULL CHECK (transfers_out >= 0),
        closing_bird_count      INTEGER NOT NULL CHECK (closing_bird_count >= 0),
        feed_consumption_kg     REAL    CHECK (feed_consumption_kg IS NULL OR feed_consumption_kg >= 0),
        water_consumption_litres REAL   CHECK (water_consumption_litres IS NULL OR water_consumption_litres >= 0),
        notes                   TEXT,
        created_at              TEXT    NOT NULL,
        updated_at              TEXT    NOT NULL,
        UNIQUE (batch_id, report_date)
      )`,
      // Listing a batch's reports in date order is the hot path.
      'CREATE INDEX idx_daily_reports_batch_date ON daily_reports(batch_id, report_date)',
    ],
  },
];

export const LATEST_MIGRATION_VERSION: number =
  MIGRATIONS.length > 0 ? MIGRATIONS[MIGRATIONS.length - 1].version : 0;
