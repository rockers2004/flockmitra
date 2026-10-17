/**
 * Bird stock calculation and validation.
 *
 * Pure business logic: no React Native, persistence, or i18n dependencies.
 * Error `code` values are machine-readable so the UI layer can map them to
 * Marathi/English messages later; this module must not contain user-facing text.
 *
 * Formula (AGENTS.md — poultry data integrity):
 *   closing = opening + additions + transfersIn
 *             - deaths - culls - sales - transfersOut
 */

/** Bird movement counts for a flock over a period. All values are bird counts. */
export interface BirdStockMovements {
  /** Birds present at the start of the period. */
  readonly opening: number;
  /** Birds added during the period (e.g. new chicks placed). */
  readonly additions: number;
  /** Birds moved in from another flock or farm. */
  readonly transfersIn: number;
  /** Birds that died during the period. */
  readonly deaths: number;
  readonly culls: number;
  readonly sales: number;
  readonly transfersOut: number;
}

/** A single movement field name on {@link BirdStockMovements}. */
export type BirdStockField = keyof BirdStockMovements;

/** Machine-readable validation error codes. Map to i18n keys in the UI layer. */
export type BirdStockErrorCode =
  | 'not_a_number'
  | 'not_finite'
  | 'not_an_integer'
  | 'negative'
  | 'negative_closing_stock';

export interface BirdStockValidationIssue {
  readonly field: BirdStockField | 'closing';
  readonly code: BirdStockErrorCode;
}

export type BirdStockCalculationResult =
  | { readonly ok: true; readonly closing: number }
  | { readonly ok: false; readonly issues: readonly BirdStockValidationIssue[] };

const MOVEMENT_FIELDS: readonly BirdStockField[] = [
  'opening',
  'additions',
  'transfersIn',
  'deaths',
  'culls',
  'sales',
  'transfersOut',
];

function validateCount(field: BirdStockField, value: number): BirdStockValidationIssue[] {
  // typeof NaN is 'number', so NaN is reported as not_a_number; ±Infinity as not_finite.
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return [{ field, code: 'not_a_number' }];
  }
  if (!Number.isFinite(value)) {
    return [{ field, code: 'not_finite' }];
  }
  const issues: BirdStockValidationIssue[] = [];
  if (!Number.isInteger(value)) {
    issues.push({ field, code: 'not_an_integer' });
  }
  if (value < 0) {
    issues.push({ field, code: 'negative' });
  }
  return issues;
}

/**
 * Validate bird movements and calculate the closing stock.
 *
 * Deterministic and side-effect free. Collects every validation issue rather
 * than failing fast, so callers can show all problems at once. Closing stock
 * is only computed when every input count is a finite, non-negative integer;
 * a result that would be negative is rejected as `negative_closing_stock`.
 */
export function calculateClosingStock(movements: BirdStockMovements): BirdStockCalculationResult {
  const issues: BirdStockValidationIssue[] = MOVEMENT_FIELDS.flatMap((field) =>
    validateCount(field, movements[field]),
  );

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const closing =
    movements.opening +
    movements.additions +
    movements.transfersIn -
    movements.deaths -
    movements.culls -
    movements.sales -
    movements.transfersOut;

  if (closing < 0) {
    return {
      ok: false,
      issues: [{ field: 'closing', code: 'negative_closing_stock' }],
    };
  }

  return { ok: true, closing };
}
