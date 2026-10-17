import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { extractPlaceholders, interpolate, translate } from './translate.ts';

describe('interpolate', () => {
  test('replaces a single placeholder', () => {
    assert.equal(interpolate('{batch}: report pending', { batch: 'Batch A' }), 'Batch A: report pending');
  });

  test('replaces repeated and multiple placeholders', () => {
    assert.equal(
      interpolate('{a} and {a} and {b}', { a: 'x', b: 42 }),
      'x and x and 42',
    );
  });

  test('stringifies numeric params', () => {
    assert.equal(interpolate('{days} days', { days: 12 }), '12 days');
  });

  test('leaves unknown placeholders untouched', () => {
    assert.equal(interpolate('hi {missing}', { other: 1 }), 'hi {missing}');
  });

  test('returns the template unchanged without params', () => {
    assert.equal(interpolate('no params here'), 'no params here');
  });
});

describe('extractPlaceholders', () => {
  test('returns sorted unique placeholder names', () => {
    assert.deepEqual(extractPlaceholders('{b} {a} {b}'), ['a', 'b']);
  });

  test('returns an empty list for plain text', () => {
    assert.deepEqual(extractPlaceholders('plain'), []);
  });
});

describe('translate', () => {
  const dictionary = { greeting: 'Hello {name}', plain: 'Plain' } as const;

  test('resolves a key and interpolates params', () => {
    assert.equal(translate(dictionary, 'greeting', { name: 'Meera' }), 'Hello Meera');
  });

  test('returns the plain template when no params are given', () => {
    assert.equal(translate(dictionary, 'plain'), 'Plain');
  });

  test('falls back to the key when the key is missing at runtime', () => {
    assert.equal(translate({} as Record<string, string>, 'nope'), 'nope');
  });
});
