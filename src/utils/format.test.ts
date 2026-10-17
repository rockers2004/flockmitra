import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { formatCount, UNKNOWN_VALUE } from './format.ts';

describe('formatCount — Indian digit grouping', () => {
  test('formats small numbers unchanged', () => {
    assert.equal(formatCount(0), '0');
    assert.equal(formatCount(7), '7');
    assert.equal(formatCount(999), '999');
  });

  test('groups thousands', () => {
    assert.equal(formatCount(1000), '1,000');
    assert.equal(formatCount(1050), '1,050');
    assert.equal(formatCount(1048), '1,048');
  });

  test('groups lakhs and crores', () => {
    assert.equal(formatCount(125000), '1,25,000');
    assert.equal(formatCount(12345678), '1,23,45,678');
  });

  test('keeps the sign for negative numbers', () => {
    assert.equal(formatCount(-42), '-42');
    assert.equal(formatCount(-1250), '-1,250');
  });

  test('truncates fractional input instead of inventing precision', () => {
    assert.equal(formatCount(12.7), '12');
    assert.equal(formatCount(-0.5), '0');
  });

  test('returns the unknown marker for non-finite values', () => {
    assert.equal(formatCount(Number.NaN), UNKNOWN_VALUE);
    assert.equal(formatCount(Infinity), UNKNOWN_VALUE);
    assert.equal(formatCount(-Infinity), UNKNOWN_VALUE);
  });
});
