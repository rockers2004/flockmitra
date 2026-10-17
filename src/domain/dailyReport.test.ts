import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_MEASUREMENT,
  MAX_NOTES_LENGTH,
  validateDailyReportForm,
  type DailyReportFormContext,
  type DailyReportFormValues,
} from './dailyReport.ts';

const BASE_CONTEXT: DailyReportFormContext = {
  batchStartDate: '2026-10-01',
  openingCount: 500,
  today: '2026-10-05',
  gapRequiresAcknowledgement: false,
  duplicateDate: false,
  editingExisting: false,
};

function form(overrides: Partial<DailyReportFormValues> = {}): DailyReportFormValues {
  return {
    reportDate: '2026-10-05',
    additions: '',
    transfersIn: '',
    deaths: '2',
    culls: '',
    sales: '',
    transfersOut: '',
    feedConsumption: '',
    waterConsumption: '',
    notes: '',
    ...overrides,
  };
}

function issueCodes(result: ReturnType<typeof validateDailyReportForm>): string[] {
  return result.ok ? [] : result.issues.map((issue) => `${issue.field}:${issue.code}`);
}

describe('validateDailyReportForm — happy path', () => {
  test('computes closing via the shared invariant with derived opening', () => {
    const result = validateDailyReportForm(form(), BASE_CONTEXT);
    assert.ok(result.ok);
    if (!result.ok) {
      return;
    }
    // 500 opening - 2 deaths = 498
    assert.equal(result.value.closingBirdCount, 498);
    assert.equal(result.value.openingBirdCount, 500);
    assert.equal(result.value.movements.opening, 500);
    assert.equal(result.value.reportDate, '2026-10-05');
  });

  test('additions, transfers in, sales and transfers out shift the closing', () => {
    const result = validateDailyReportForm(
      form({ additions: '10', transfersIn: '5', sales: '20', transfersOut: '3' }),
      BASE_CONTEXT,
    );
    assert.ok(result.ok);
    if (!result.ok) {
      return;
    }
    // 500 + 10 + 5 - 2 - 20 - 3 = 490
    assert.equal(result.value.closingBirdCount, 490);
  });

  test('all-zero movements close at the opening count', () => {
    const result = validateDailyReportForm(
      form({ deaths: '0', additions: '0' }),
      { ...BASE_CONTEXT, openingCount: 0 },
    );
    assert.ok(result.ok);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.closingBirdCount, 0);
  });
});

describe('validateDailyReportForm — optional measurements', () => {
  test('blank feed and water stay null, never zero', () => {
    const result = validateDailyReportForm(form(), BASE_CONTEXT);
    assert.ok(result.ok);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.feedConsumptionKg, null);
    assert.equal(result.value.waterConsumptionLitres, null);
  });

  test('explicit zero measurements are preserved as recorded values', () => {
    const result = validateDailyReportForm(
      form({ feedConsumption: '0', waterConsumption: '0' }),
      BASE_CONTEXT,
    );
    assert.ok(result.ok);
    if (!result.ok) {
      return;
    }
    assert.equal(result.value.feedConsumptionKg, 0);
    assert.equal(result.value.waterConsumptionLitres, 0);
  });

  test('decimal measurements are accepted; negatives and excess are rejected', () => {
    const ok = validateDailyReportForm(
      form({ feedConsumption: '12.5', waterConsumption: '100' }),
      BASE_CONTEXT,
    );
    assert.ok(ok.ok);
    if (ok.ok) {
      assert.equal(ok.value.feedConsumptionKg, 12.5);
    }

    const negative = validateDailyReportForm(form({ feedConsumption: '-1' }), BASE_CONTEXT);
    assert.deepEqual(issueCodes(negative), ['feedConsumption:feed_negative']);

    const excessive = validateDailyReportForm(
      form({ waterConsumption: String(MAX_MEASUREMENT + 1) }),
      BASE_CONTEXT,
    );
    assert.deepEqual(issueCodes(excessive), ['waterConsumption:water_too_large']);

    const garbage = validateDailyReportForm(form({ feedConsumption: 'abc' }), BASE_CONTEXT);
    assert.deepEqual(issueCodes(garbage), ['feedConsumption:feed_not_a_number']);
  });
});

describe('validateDailyReportForm — movement validation', () => {
  test('rejects fractional movements', () => {
    const result = validateDailyReportForm(form({ deaths: '1.5' }), BASE_CONTEXT);
    assert.deepEqual(issueCodes(result), ['deaths:movement_not_an_integer']);
  });

  test('rejects non-numeric movements', () => {
    const result = validateDailyReportForm(form({ sales: 'ten' }), BASE_CONTEXT);
    assert.deepEqual(issueCodes(result), ['sales:movement_not_a_number']);
  });

  test('rejects negative movements', () => {
    const result = validateDailyReportForm(form({ culls: '-3' }), BASE_CONTEXT);
    assert.deepEqual(issueCodes(result), ['culls:movement_negative']);
  });

  test('rejects movement combinations with negative closing', () => {
    const result = validateDailyReportForm(form({ deaths: '501' }), BASE_CONTEXT);
    const codes = issueCodes(result);
    assert.ok(codes.includes('form:movement_negative_closing'), codes.join(','));
  });

  test('collects multiple movement problems in one pass', () => {
    const result = validateDailyReportForm(form({ deaths: '-1', sales: 'x', culls: '2.5' }), BASE_CONTEXT);
    const codes = issueCodes(result);
    assert.ok(codes.includes('deaths:movement_negative'));
    assert.ok(codes.includes('sales:movement_not_a_number'));
    assert.ok(codes.includes('culls:movement_not_an_integer'));
  });
});

describe('validateDailyReportForm — dates', () => {
  test('requires, validates and bounds the report date', () => {
    assert.deepEqual(
      issueCodes(validateDailyReportForm(form({ reportDate: '' }), BASE_CONTEXT)),
      ['reportDate:date_required'],
    );
    assert.deepEqual(
      issueCodes(validateDailyReportForm(form({ reportDate: '2026-13-01' }), BASE_CONTEXT)),
      ['reportDate:date_invalid'],
    );
    assert.deepEqual(
      issueCodes(validateDailyReportForm(form({ reportDate: '2025-12-31' }), BASE_CONTEXT)),
      ['reportDate:date_before_batch_start'],
    );
    assert.deepEqual(
      issueCodes(validateDailyReportForm(form({ reportDate: '2026-10-06' }), BASE_CONTEXT)),
      ['reportDate:date_in_future'],
    );
  });

  test('rejects duplicate batch/date combinations via context', () => {
    const result = validateDailyReportForm(form(), {
      ...BASE_CONTEXT,
      duplicateDate: true,
    });
    assert.deepEqual(issueCodes(result), ['reportDate:date_duplicate']);
  });

  test('edit mode allows dates after today rules to be skipped (date is fixed by UI)', () => {
    const result = validateDailyReportForm(form({ reportDate: '2026-10-10' }), {
      ...BASE_CONTEXT,
      today: '2026-10-05',
      editingExisting: true,
    });
    assert.ok(result.ok);
  });

  test('gap requires explicit acknowledgement on create', () => {
    const result = validateDailyReportForm(form(), {
      ...BASE_CONTEXT,
      gapRequiresAcknowledgement: true,
    });
    assert.deepEqual(issueCodes(result), ['reportDate:gap_not_acknowledged']);

    const acknowledged = validateDailyReportForm(form(), {
      ...BASE_CONTEXT,
      gapRequiresAcknowledgement: true,
      editingExisting: true, // acknowledgement applies to creation only
    });
    assert.ok(acknowledged.ok);
  });
});

describe('validateDailyReportForm — notes and opening', () => {
  test('blank notes become null; overlong notes are rejected', () => {
    const blank = validateDailyReportForm(form({ notes: '   ' }), BASE_CONTEXT);
    assert.ok(blank.ok);
    if (blank.ok) {
      assert.equal(blank.value.notes, null);
    }

    const long = validateDailyReportForm(
      form({ notes: 'x'.repeat(MAX_NOTES_LENGTH + 1) }),
      BASE_CONTEXT,
    );
    assert.deepEqual(issueCodes(long), ['notes:notes_too_long']);
  });
});
