import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { calculateClosingStock, type BirdStockMovements } from './birdStock.ts';

function movements(overrides: Partial<BirdStockMovements> = {}): BirdStockMovements {
  return {
    opening: 0,
    additions: 0,
    transfersIn: 0,
    deaths: 0,
    culls: 0,
    sales: 0,
    transfersOut: 0,
    ...overrides,
  };
}

describe('calculateClosingStock — closing formula', () => {
  test('no movements closes at the opening count', () => {
    const result = calculateClosingStock(movements({ opening: 1200 }));
    assert.deepEqual(result, { ok: true, closing: 1200 });
  });

  test('all-zero input closes at zero', () => {
    assert.deepEqual(calculateClosingStock(movements()), { ok: true, closing: 0 });
  });

  test('additions and transfers in increase stock', () => {
    const result = calculateClosingStock(
      movements({ opening: 1000, additions: 250, transfersIn: 50 }),
    );
    assert.deepEqual(result, { ok: true, closing: 1300 });
  });

  test('deaths, culls, sales and transfers out decrease stock', () => {
    const result = calculateClosingStock(
      movements({
        opening: 1000,
        deaths: 12,
        culls: 3,
        sales: 200,
        transfersOut: 35,
      }),
    );
    assert.deepEqual(result, { ok: true, closing: 750 });
  });

  test('full flock day uses the AGENTS.md formula exactly', () => {
    const result = calculateClosingStock(
      movements({
        opening: 1000,
        additions: 250,
        transfersIn: 50,
        deaths: 12,
        culls: 3,
        sales: 200,
        transfersOut: 35,
      }),
    );
    // 1000 + 250 + 50 - 12 - 3 - 200 - 35 = 1050
    assert.deepEqual(result, { ok: true, closing: 1050 });
  });

  test('stock exactly consumed to zero is valid', () => {
    const result = calculateClosingStock(movements({ opening: 10, sales: 10 }));
    assert.deepEqual(result, { ok: true, closing: 0 });
  });

  test('is deterministic for the same input', () => {
    const input = movements({ opening: 500, deaths: 5, sales: 100 });
    assert.deepEqual(calculateClosingStock(input), calculateClosingStock(input));
  });
});

describe('calculateClosingStock — input validation', () => {
  test('rejects non-numeric values', () => {
    const result = calculateClosingStock(movements({ opening: NaN as unknown as number }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'opening', code: 'not_a_number' }]);
    }
  });

  test('rejects values that are not numbers at runtime', () => {
    const result = calculateClosingStock(movements({ sales: '50' as unknown as number }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'sales', code: 'not_a_number' }]);
    }
  });

  test('rejects Infinity', () => {
    const result = calculateClosingStock(
      movements({ transfersIn: Infinity as unknown as number }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'transfersIn', code: 'not_finite' }]);
    }
  });

  test('rejects -Infinity', () => {
    const result = calculateClosingStock(movements({ deaths: -Infinity as unknown as number }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'deaths', code: 'not_finite' }]);
    }
  });

  test('rejects fractional counts', () => {
    const result = calculateClosingStock(movements({ sales: 12.5 }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'sales', code: 'not_an_integer' }]);
    }
  });

  test('rejects negative counts on every movement field', () => {
    const fields = [
      'opening',
      'additions',
      'transfersIn',
      'deaths',
      'culls',
      'sales',
      'transfersOut',
    ] as const;
    for (const field of fields) {
      const result = calculateClosingStock(movements({ [field]: -1 }));
      assert.equal(result.ok, false, `expected rejection for negative ${field}`);
      if (!result.ok) {
        assert.deepEqual(result.issues, [{ field, code: 'negative' }]);
      }
    }
  });

  test('collects all invalid fields instead of failing fast', () => {
    const result = calculateClosingStock(
      movements({ opening: -5, additions: 1.5, deaths: Number.NaN }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [
        { field: 'opening', code: 'negative' },
        { field: 'additions', code: 'not_an_integer' },
        { field: 'deaths', code: 'not_a_number' },
      ]);
    }
  });
});

describe('calculateClosingStock — negative closing stock rejection', () => {
  test('rejects sales that exceed available birds', () => {
    const result = calculateClosingStock(movements({ opening: 100, sales: 150 }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'closing', code: 'negative_closing_stock' }]);
    }
  });

  test('rejects outflows that exceed opening plus inflows', () => {
    const result = calculateClosingStock(
      movements({ opening: 100, additions: 20, transfersIn: 10, deaths: 200 }),
    );
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.deepEqual(result.issues, [{ field: 'closing', code: 'negative_closing_stock' }]);
    }
  });

  test('valid inputs that land on zero are not treated as negative', () => {
    const result = calculateClosingStock(
      movements({ opening: 50, transfersIn: 25, sales: 75 }),
    );
    assert.deepEqual(result, { ok: true, closing: 0 });
  });
});
