import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { rowToDailyReport, type DailyReportRow } from './dailyReportMappers.ts';

function row(overrides: Partial<DailyReportRow> = {}): DailyReportRow {
  return {
    id: 'r1',
    batch_id: 'b1',
    report_date: '2026-10-05',
    opening_bird_count: 500,
    additions: 10,
    transfers_in: 0,
    deaths: 2,
    culls: 0,
    sales: 0,
    transfers_out: 0,
    closing_bird_count: 508,
    feed_consumption_kg: 25.5,
    water_consumption_litres: null,
    notes: 'Watch leg health',
    created_at: '2026-10-05T10:00:00.000Z',
    updated_at: '2026-10-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('rowToDailyReport', () => {
  test('maps snake_case columns to the domain shape', () => {
    assert.deepEqual(rowToDailyReport(row()), {
      id: 'r1',
      batchId: 'b1',
      reportDate: '2026-10-05',
      openingBirdCount: 500,
      additions: 10,
      transfersIn: 0,
      deaths: 2,
      culls: 0,
      sales: 0,
      transfersOut: 0,
      closingBirdCount: 508,
      feedConsumptionKg: 25.5,
      waterConsumptionLitres: null,
      notes: 'Watch leg health',
      createdAt: '2026-10-05T10:00:00.000Z',
      updatedAt: '2026-10-05T10:00:00.000Z',
    });
  });

  test('preserves null measurements and notes', () => {
    const report = rowToDailyReport(
      row({ feed_consumption_kg: null, water_consumption_litres: null, notes: null }),
    );
    assert.equal(report.feedConsumptionKg, null);
    assert.equal(report.waterConsumptionLitres, null);
    assert.equal(report.notes, null);
  });

  test('preserves recorded zero measurements (not null)', () => {
    const report = rowToDailyReport(row({ feed_consumption_kg: 0, water_consumption_litres: 0 }));
    assert.equal(report.feedConsumptionKg, 0);
    assert.equal(report.waterConsumptionLitres, 0);
  });
});
