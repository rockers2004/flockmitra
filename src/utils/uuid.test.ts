import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { uuidV4 } from './uuid.ts';

const UUID_V4_PATTERN = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;

describe('uuidV4', () => {
  test('produces RFC 4122 version-4 format strings', () => {
    for (let i = 0; i < 100; i += 1) {
      assert.match(uuidV4(), UUID_V4_PATTERN);
    }
  });

  test('stays unique across a large batch', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 10_000; i += 1) {
      ids.add(uuidV4());
    }
    assert.equal(ids.size, 10_000);
  });
});
