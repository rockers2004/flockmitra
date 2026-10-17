import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { rowToBatch, type BatchRow } from './batchMappers.ts';

function row(overrides: Partial<BatchRow> = {}): BatchRow {
  return {
    id: 'abc-123',
    name: 'Broiler Batch A',
    poultry_type: 'broiler',
    initial_bird_count: 500,
    start_date: '2026-10-01',
    status: 'active',
    created_at: '2026-10-01T08:00:00.000Z',
    updated_at: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

describe('rowToBatch', () => {
  test('maps a valid row to the domain shape', () => {
    const batch = rowToBatch(row());
    assert.deepEqual(batch, {
      id: 'abc-123',
      name: 'Broiler Batch A',
      poultryType: 'broiler',
      initialBirdCount: 500,
      startDate: '2026-10-01',
      status: 'active',
      createdAt: '2026-10-01T08:00:00.000Z',
      updatedAt: '2026-10-01T08:00:00.000Z',
    });
  });

  test('maps every supported enum value', () => {
    for (const poultryType of ['broiler', 'layer', 'desi'] as const) {
      for (const status of ['active', 'closingReview', 'completed'] as const) {
        const batch = rowToBatch(row({ poultry_type: poultryType, status }));
        assert.equal(batch.poultryType, poultryType);
        assert.equal(batch.status, status);
      }
    }
  });

  test('throws on an unknown poultry type instead of rendering it', () => {
    assert.throws(() => rowToBatch(row({ poultry_type: 'duck' })), /poultry_type/);
  });

  test('throws on an unknown status instead of mislabeling lifecycle state', () => {
    assert.throws(() => rowToBatch(row({ status: 'archived' })), /status/);
  });
});
