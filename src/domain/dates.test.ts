import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { addDays, daysSince, isValidIsoDate, todayIso } from './dates.ts';

describe('isValidIsoDate', () => {
  test('accepts real calendar dates', () => {
    assert.equal(isValidIsoDate('2026-10-17'), true);
    assert.equal(isValidIsoDate('2026-01-01'), true);
    assert.equal(isValidIsoDate('2026-12-31'), true);
  });

  test('accepts leap days only in leap years', () => {
    assert.equal(isValidIsoDate('2024-02-29'), true); // leap
    assert.equal(isValidIsoDate('2000-02-29'), true); // 400-year rule
    assert.equal(isValidIsoDate('2023-02-29'), false);
    assert.equal(isValidIsoDate('2100-02-29'), false); // 100-year rule
  });

  test('rejects rolled-over and malformed dates', () => {
    assert.equal(isValidIsoDate('2026-02-30'), false);
    assert.equal(isValidIsoDate('2026-13-01'), false);
    assert.equal(isValidIsoDate('2026-00-10'), false);
    assert.equal(isValidIsoDate('2026-1-5'), false); // must be zero-padded
    assert.equal(isValidIsoDate('abc'), false);
    assert.equal(isValidIsoDate(''), false);
    assert.equal(isValidIsoDate('2026/10/17'), false);
  });
});

describe('todayIso', () => {
  test('formats the local calendar date as YYYY-MM-DD', () => {
    const now = new Date(2026, 9, 17, 23, 30, 0); // 17 Oct 2026, late evening
    assert.equal(todayIso(now), '2026-10-17');
  });

  test('pads single-digit months and days', () => {
    const now = new Date(2026, 0, 5);
    assert.equal(todayIso(now), '2026-01-05');
  });
});

describe('daysSince', () => {
  test('same day is zero', () => {
    assert.equal(daysSince('2026-10-17', '2026-10-17'), 0);
  });

  test('counts forward across days, months and years', () => {
    assert.equal(daysSince('2026-10-16', '2026-10-17'), 1);
    assert.equal(daysSince('2026-09-30', '2026-10-01'), 1);
    assert.equal(daysSince('2025-12-31', '2026-01-01'), 1);
    assert.equal(daysSince('2026-01-01', '2026-10-17'), 289);
  });

  test('handles leap days', () => {
    assert.equal(daysSince('2024-02-28', '2024-03-01'), 2); // leap year
    assert.equal(daysSince('2023-02-28', '2023-03-01'), 1); // non-leap
  });

  test('negative when start is after today (form rejects that earlier)', () => {
    assert.equal(daysSince('2026-10-18', '2026-10-17'), -1);
  });
});

describe('addDays', () => {
  test('steps forward and backward across months and years', () => {
    assert.equal(addDays('2026-10-01', 1), '2026-10-02');
    assert.equal(addDays('2026-10-31', 1), '2026-11-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2026-01-01', -1), '2025-12-31');
    assert.equal(addDays('2026-10-01', 0), '2026-10-01');
  });

  test('handles leap days', () => {
    assert.equal(addDays('2024-02-28', 1), '2024-02-29');
    assert.equal(addDays('2024-02-29', 1), '2024-03-01');
    assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  });

  test('throws on invalid input dates', () => {
    assert.throws(() => addDays('2026-13-01', 1), /invalid date/);
  });
});
