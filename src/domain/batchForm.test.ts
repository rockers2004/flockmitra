import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_BATCH_NAME_LENGTH,
  MAX_INITIAL_BIRD_COUNT,
  validateCreateBatchInput,
  type CreateBatchFormValues,
} from './batchForm.ts';

const TODAY = '2026-10-17';

function form(overrides: Partial<CreateBatchFormValues> = {}): CreateBatchFormValues {
  return {
    name: 'Broiler Batch A',
    poultryType: 'broiler',
    initialBirdCount: '500',
    startDate: TODAY,
    ...overrides,
  };
}

function issueCodes(result: ReturnType<typeof validateCreateBatchInput>): readonly string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

describe('validateCreateBatchInput — success path', () => {
  test('accepts a minimal valid form', () => {
    const result = validateCreateBatchInput(form(), TODAY);
    assert.deepEqual(result, {
      ok: true,
      value: {
        name: 'Broiler Batch A',
        poultryType: 'broiler',
        initialBirdCount: 500,
        startDate: TODAY,
      },
    });
  });

  test('trims the name and count and accepts zero birds', () => {
    const result = validateCreateBatchInput(
      form({ name: '  Layer Batch B  ', initialBirdCount: ' 0 ' }),
      TODAY,
    );
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.name, 'Layer Batch B');
      assert.equal(result.value.initialBirdCount, 0);
    }
  });

  test('accepts an earlier start date and the exact cap values', () => {
    const result = validateCreateBatchInput(
      form({
        initialBirdCount: String(MAX_INITIAL_BIRD_COUNT),
        name: 'x'.repeat(MAX_BATCH_NAME_LENGTH),
        startDate: '2020-01-01',
      }),
      TODAY,
    );
    assert.equal(result.ok, true);
  });
});

describe('validateCreateBatchInput — name issues', () => {
  test('rejects empty or whitespace-only names', () => {
    for (const name of ['', '   ']) {
      const result = validateCreateBatchInput(form({ name }), TODAY);
      assert.deepEqual(issueCodes(result), ['name_required']);
    }
  });

  test('rejects names longer than the cap', () => {
    const result = validateCreateBatchInput(
      form({ name: 'x'.repeat(MAX_BATCH_NAME_LENGTH + 1) }),
      TODAY,
    );
    assert.deepEqual(issueCodes(result), ['name_too_long']);
  });
});

describe('validateCreateBatchInput — poultry type issues', () => {
  test('rejects an unknown poultry type', () => {
    const result = validateCreateBatchInput(form({ poultryType: 'duck' }), TODAY);
    assert.deepEqual(issueCodes(result), ['poultry_type_invalid']);
  });
});

describe('validateCreateBatchInput — count issues', () => {
  test('rejects an empty count', () => {
    const result = validateCreateBatchInput(form({ initialBirdCount: '' }), TODAY);
    assert.deepEqual(issueCodes(result), ['count_required']);
  });

  test('rejects non-numeric text', () => {
    const result = validateCreateBatchInput(form({ initialBirdCount: 'many' }), TODAY);
    assert.deepEqual(issueCodes(result), ['count_not_a_number']);
  });

  test('rejects decimals', () => {
    const result = validateCreateBatchInput(form({ initialBirdCount: '12.5' }), TODAY);
    assert.deepEqual(issueCodes(result), ['count_not_integer']);
  });

  test('rejects negative counts', () => {
    const result = validateCreateBatchInput(form({ initialBirdCount: '-5' }), TODAY);
    assert.deepEqual(issueCodes(result), ['count_negative']);
  });

  test('rejects counts above the sanity cap', () => {
    const result = validateCreateBatchInput(
      form({ initialBirdCount: String(MAX_INITIAL_BIRD_COUNT + 1) }),
      TODAY,
    );
    assert.deepEqual(issueCodes(result), ['count_too_large']);
  });
});

describe('validateCreateBatchInput — start date issues', () => {
  test('rejects an empty date', () => {
    const result = validateCreateBatchInput(form({ startDate: '' }), TODAY);
    assert.deepEqual(issueCodes(result), ['date_required']);
  });

  test('rejects malformed and rolled-over dates', () => {
    for (const startDate of ['2026-02-30', 'not-a-date', '17-10-2026']) {
      const result = validateCreateBatchInput(form({ startDate }), TODAY);
      assert.deepEqual(issueCodes(result), ['date_invalid'], startDate);
    }
  });

  test('rejects future dates', () => {
    const result = validateCreateBatchInput(form({ startDate: '2026-10-18' }), TODAY);
    assert.deepEqual(issueCodes(result), ['date_in_future']);
  });
});

describe('validateCreateBatchInput — collects every issue', () => {
  test('reports problems across all fields in one pass', () => {
    const result = validateCreateBatchInput(
      form({ name: '', poultryType: 'duck', initialBirdCount: 'x', startDate: '' }),
      TODAY,
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(
        result.issues.map((issue) => issue.field),
        ['name', 'poultryType', 'initialBirdCount', 'startDate'],
      );
      assert.deepEqual(issueCodes(result), [
        'name_required',
        'poultry_type_invalid',
        'count_not_a_number',
        'date_required',
      ]);
    }
  });
});
