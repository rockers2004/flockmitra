import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { calculateClosingStock } from '../domain/birdStock.ts';
import {
  deriveSampleAlerts,
  liveBatchBirdTotal,
  SAMPLE_BATCHES,
  SAMPLE_TODAY_MOVEMENTS,
} from './sampleData.ts';

describe('sample batches', () => {
  test('all bird counts and ages are valid non-negative integers', () => {
    for (const batch of SAMPLE_BATCHES) {
      assert.ok(Number.isInteger(batch.birdCount), `${batch.name}: birdCount`);
      assert.ok(batch.birdCount >= 0, `${batch.name}: birdCount >= 0`);
      assert.ok(Number.isInteger(batch.ageDays) && batch.ageDays >= 0, `${batch.name}: ageDays`);
      assert.ok(batch.name.trim().length > 0, `${batch.name}: name`);
    }
  });

  test('batch ids are unique', () => {
    const ids = SAMPLE_BATCHES.map((batch) => batch.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});

describe('sample movements', () => {
  test('pass the real bird-stock validation', () => {
    const result = calculateClosingStock(SAMPLE_TODAY_MOVEMENTS);
    assert.equal(result.ok, true);
  });

  test('closing stock equals the live-batch total shown on the Batches screen', () => {
    const result = calculateClosingStock(SAMPLE_TODAY_MOVEMENTS);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.closing, liveBatchBirdTotal(SAMPLE_BATCHES));
    }
  });

  test('opening stock is consistent with closing plus recorded movements', () => {
    const m = SAMPLE_TODAY_MOVEMENTS;
    const inflow = m.additions + m.transfersIn;
    const outflow = m.deaths + m.culls + m.sales + m.transfersOut;
    assert.equal(m.opening + inflow - outflow, liveBatchBirdTotal(SAMPLE_BATCHES));
  });
});

describe('deriveSampleAlerts', () => {
  test('flags exactly the batches with pending reports or closing review', () => {
    const alerts = deriveSampleAlerts(SAMPLE_BATCHES);
    const byKind = {
      pendingReport: alerts.filter((a) => a.kind === 'pendingReport').map((a) => a.batchId),
      closingReview: alerts.filter((a) => a.kind === 'closingReview').map((a) => a.batchId),
    };
    assert.deepEqual(byKind.pendingReport, ['sample-batch-a']);
    assert.deepEqual(byKind.closingReview, ['sample-batch-c']);
  });

  test('never alerts on completed batches, even with legacy flags', () => {
    const alerts = deriveSampleAlerts([
      {
        id: 'done',
        name: 'Done',
        poultryType: 'broiler',
        birdCount: 0,
        ageDays: 40,
        status: 'completed',
        pendingDailyReport: true,
      },
    ]);
    assert.deepEqual(alerts, []);
  });

  test('returns an empty list for no batches', () => {
    assert.deepEqual(deriveSampleAlerts([]), []);
  });

  test('alert ids are unique', () => {
    const ids = deriveSampleAlerts(SAMPLE_BATCHES).map((alert) => alert.id);
    assert.equal(new Set(ids).size, ids.length);
  });
});
