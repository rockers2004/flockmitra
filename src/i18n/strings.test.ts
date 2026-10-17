import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { en, mr } from './strings.ts';
import { extractPlaceholders } from './translate.ts';

describe('dictionary integrity', () => {
  test('en and mr define exactly the same keys', () => {
    assert.deepEqual(Object.keys(mr).sort(), Object.keys(en).sort());
  });

  test('every en value is a non-empty string', () => {
    for (const [key, value] of Object.entries(en)) {
      assert.equal(typeof value, 'string', `en:${key} must be a string`);
      assert.ok(value.trim().length > 0, `en:${key} must not be empty`);
    }
  });

  test('every mr value is a non-empty string', () => {
    for (const [key, value] of Object.entries(mr)) {
      assert.equal(typeof value, 'string', `mr:${key} must be a string`);
      assert.ok(value.trim().length > 0, `mr:${key} must not be empty`);
    }
  });

  test('placeholders match between en and mr for every key', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      assert.deepEqual(
        extractPlaceholders(mr[key]),
        extractPlaceholders(en[key]),
        `placeholder mismatch for "${key}"`,
      );
    }
  });

  test('Marathi is actually translated (not an English copy)', () => {
    // Allow intentionally identical values (brand name, language names).
    const allowedIdentical = new Set([
      'common.appName',
      'settings.langEn',
      'settings.langMr',
    ]);
    const untranslated = (Object.keys(en) as (keyof typeof en)[]).filter(
      (key) => !allowedIdentical.has(key) && en[key] === mr[key],
    );
    assert.deepEqual(untranslated, []);
  });
});
