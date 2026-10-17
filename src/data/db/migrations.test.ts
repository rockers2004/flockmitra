import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { LATEST_MIGRATION_VERSION, MIGRATIONS } from './migrations.ts';

describe('migrations structure', () => {
  test('versions start at 1, are unique and strictly increasing', () => {
    assert.ok(MIGRATIONS.length > 0, 'at least one migration must exist');
    assert.equal(MIGRATIONS[0].version, 1);
    for (let i = 1; i < MIGRATIONS.length; i += 1) {
      assert.ok(
        MIGRATIONS[i].version > MIGRATIONS[i - 1].version,
        `migration ${i} must increase version`,
      );
    }
    const versions = MIGRATIONS.map((migration) => migration.version);
    assert.equal(new Set(versions).size, versions.length, 'versions must be unique');
  });

  test('latest version points at the newest migration', () => {
    assert.equal(LATEST_MIGRATION_VERSION, MIGRATIONS[MIGRATIONS.length - 1].version);
  });

  test('every migration has a name and non-empty SQL statements', () => {
    for (const migration of MIGRATIONS) {
      assert.ok(migration.name.trim().length > 0, `migration ${migration.version} needs a name`);
      assert.ok(migration.statements.length > 0, `migration ${migration.version} needs SQL`);
      for (const statement of migration.statements) {
        assert.ok(statement.trim().length > 0, `migration ${migration.version} has empty SQL`);
      }
    }
  });

  test('v1 creates the batches table with key constraints and both indexes', () => {
    const v1 = MIGRATIONS[0];
    const sql = v1.statements.join('\n');
    assert.match(sql, /CREATE TABLE batches/);
    assert.match(sql, /id\s+TEXT\s+PRIMARY KEY NOT NULL/);
    assert.match(sql, /poultry_type IN \('broiler', 'layer', 'desi'\)/);
    assert.match(sql, /initial_bird_count\s+INTEGER NOT NULL CHECK \(initial_bird_count >= 0\)/);
    assert.match(sql, /CHECK \(length\(trim\(name\)\) > 0\)/);
    assert.match(sql, /status IN \('active', 'closingReview', 'completed'\)/);
    assert.match(sql, /CREATE INDEX idx_batches_status/);
    assert.match(sql, /CREATE INDEX idx_batches_start_date/);
  });

  test('v2 creates daily_reports with uniqueness, checks, FK and index', () => {
    const v2 = MIGRATIONS[1];
    assert.equal(v2.version, 2);
    assert.equal(v2.name, 'create_daily_reports');
    const sql = v2.statements.join('\n');
    assert.match(sql, /CREATE TABLE daily_reports/);
    assert.match(sql, /batch_id\s+TEXT\s+NOT NULL REFERENCES batches\(id\)/);
    assert.match(sql, /UNIQUE \(batch_id, report_date\)/);
    assert.match(sql, /closing_bird_count\s+INTEGER NOT NULL CHECK \(closing_bird_count >= 0\)/);
    assert.match(sql, /additions\s+INTEGER NOT NULL CHECK \(additions >= 0\)/);
    assert.match(sql, /deaths\s+INTEGER NOT NULL CHECK \(deaths >= 0\)/);
    assert.match(sql, /feed_consumption_kg\s+REAL\s+CHECK \(feed_consumption_kg IS NULL OR feed_consumption_kg >= 0\)/);
    assert.match(sql, /water_consumption_litres REAL\s+CHECK \(water_consumption_litres IS NULL OR water_consumption_litres >= 0\)/);
    assert.match(sql, /CREATE INDEX idx_daily_reports_batch_date/);
  });
});
