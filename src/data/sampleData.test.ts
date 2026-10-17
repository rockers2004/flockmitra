import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { SAMPLE_FARM_NAME } from './sampleData.ts';

describe('sampleData', () => {
  test('keeps a non-empty placeholder farm name', () => {
    assert.equal(typeof SAMPLE_FARM_NAME, 'string');
    assert.ok(SAMPLE_FARM_NAME.trim().length > 0);
  });
});
