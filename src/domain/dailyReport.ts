/**
 * Daily report domain — entity shape and create/update form validation.
 *
 * Pure and React-Free (node --test compatible; runtime cross-imports use
 * explicit .ts extensions for Node ESM). Movements and the closing-stock
 * invariant are NOT re-implemented here: validation delegates to
 * birdStock.calculateClosingStock so one set of rules governs the app
 * (AGENTS.md: do not duplicate bird-stock rules).
 *
 * Conventions:
 * - `reportDate` is a farm-local calendar date (YYYY-MM-DD, no timezone).
 * - Blank movement input means "no birds of this kind moved" (= 0).
 * - Feed/water/notes are genuinely optional: blank stays null; zero is
 *   never substituted for missing measurements (AGENTS.md).
 * - `opening` is derived by the timeline service, never typed by the user.
 */
import {
  calculateClosingStock,
  type BirdStockMovements,
  type BirdStockValidationIssue,
} from './birdStock.ts';
import { isValidIsoDate } from './dates.ts';

export const MAX_NOTES_LENGTH = 500;
export const MAX_MEASUREMENT = 1_000_000;

/** A persisted daily report for one batch and one calendar day. */
export interface DailyReport {
  readonly id: string;
  readonly batchId: string;
  readonly reportDate: string;
  readonly openingBirdCount: number;
  readonly additions: number;
  readonly transfersIn: number;
  readonly deaths: number;
  readonly culls: number;
  readonly sales: number;
  readonly transfersOut: number;
  readonly closingBirdCount: number;
  /** Kilograms; null = not recorded. */
  readonly feedConsumptionKg: number | null;
  /** Litres; null = not recorded. */
  readonly waterConsumptionLitres: number | null;
  readonly notes: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Raw form values — everything the user types arrives as text. */
export interface DailyReportFormValues {
  readonly reportDate: string;
  readonly additions: string;
  readonly transfersIn: string;
  readonly deaths: string;
  readonly culls: string;
  readonly sales: string;
  readonly transfersOut: string;
  readonly feedConsumption: string;
  readonly waterConsumption: string;
  readonly notes: string;
}

/** Movement + measurement fields on the form (opening excluded — derived). */
export type DailyReportFormField =
  | 'form'
  | 'reportDate'
  | 'additions'
  | 'transfersIn'
  | 'deaths'
  | 'culls'
  | 'sales'
  | 'transfersOut'
  | 'feedConsumption'
  | 'waterConsumption'
  | 'notes';

export type DailyReportIssueCode =
  | 'date_required'
  | 'date_invalid'
  | 'date_before_batch_start'
  | 'date_in_future'
  | 'date_duplicate'
  | 'movement_not_a_number'
  | 'movement_not_an_integer'
  | 'movement_negative'
  | 'movement_negative_closing'
  | 'feed_not_a_number'
  | 'feed_negative'
  | 'feed_too_large'
  | 'water_not_a_number'
  | 'water_negative'
  | 'water_too_large'
  | 'notes_too_long'
  | 'gap_not_acknowledged';

export interface DailyReportIssue {
  readonly field: DailyReportFormField;
  readonly code: DailyReportIssueCode;
}

/** Validated, normalized payload ready for the repository/service. */
export interface ValidatedDailyReportInput {
  readonly reportDate: string;
  readonly openingBirdCount: number;
  readonly movements: BirdStockMovements;
  readonly closingBirdCount: number;
  readonly feedConsumptionKg: number | null;
  readonly waterConsumptionLitres: number | null;
  readonly notes: string | null;
}

export type DailyReportValidation =
  | { readonly ok: true; readonly value: ValidatedDailyReportInput }
  | { readonly ok: false; readonly issues: readonly DailyReportIssue[] };

export interface DailyReportFormContext {
  readonly batchStartDate: string;
  /** Opening count derived by the timeline (first report: initial birds). */
  readonly openingCount: number;
  readonly today: string;
  /** True when the candidate date skips days after the previous report. */
  readonly gapRequiresAcknowledgement: boolean;
  /** True when a report already exists for this batch and date. */
  readonly duplicateDate: boolean;
  /** True when the form is editing an existing report (date is fixed). */
  readonly editingExisting: boolean;
}

const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;

function parseMovement(
  field: DailyReportFormField,
  raw: string,
  issues: DailyReportIssue[],
): number {
  const trimmed = raw.trim();
  if (trimmed.length === 0 || trimmed === '0') {
    return 0;
  }
  if (!INTEGER_PATTERN.test(trimmed)) {
    issues.push({
      field,
      code: DECIMAL_PATTERN.test(trimmed) ? 'movement_not_an_integer' : 'movement_not_a_number',
    });
    return 0;
  }
  const value = Number(trimmed);
  if (value < 0) {
    issues.push({ field, code: 'movement_negative' });
    return 0;
  }
  return value;
}

function parseMeasurement(
  field: 'feedConsumption' | 'waterConsumption',
  raw: string,
  issues: DailyReportIssue[],
): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null; // Not recorded — never substitute zero.
  }
  if (!DECIMAL_PATTERN.test(trimmed)) {
    issues.push({ field, code: field === 'feedConsumption' ? 'feed_not_a_number' : 'water_not_a_number' });
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    issues.push({ field, code: field === 'feedConsumption' ? 'feed_not_a_number' : 'water_not_a_number' });
    return null;
  }
  if (value < 0) {
    issues.push({ field, code: field === 'feedConsumption' ? 'feed_negative' : 'water_negative' });
    return null;
  }
  if (value > MAX_MEASUREMENT) {
    issues.push({ field, code: field === 'feedConsumption' ? 'feed_too_large' : 'water_too_large' });
    return null;
  }
  return value;
}

function validateDate(
  raw: string,
  context: DailyReportFormContext,
  issues: DailyReportIssue[],
): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    issues.push({ field: 'reportDate', code: 'date_required' });
    return '';
  }
  if (!isValidIsoDate(trimmed)) {
    issues.push({ field: 'reportDate', code: 'date_invalid' });
    return '';
  }
  if (trimmed < context.batchStartDate) {
    issues.push({ field: 'reportDate', code: 'date_before_batch_start' });
    return '';
  }
  if (!context.editingExisting && trimmed > context.today) {
    issues.push({ field: 'reportDate', code: 'date_in_future' });
    return '';
  }
  if (context.duplicateDate) {
    issues.push({ field: 'reportDate', code: 'date_duplicate' });
  }
  return trimmed;
}

/**
 * Validate and normalize the daily report form. `openingCount` comes from
 * the timeline service (never from user input). Closing stock is computed
 * by the shared bird-stock domain function; a negative closing rejects the
 * whole form. Every problem is collected in one pass.
 */
export function validateDailyReportForm(
  form: DailyReportFormValues,
  context: DailyReportFormContext,
): DailyReportValidation {
  const issues: DailyReportIssue[] = [];

  const reportDate = validateDate(form.reportDate, context, issues);

  const movements: BirdStockMovements = {
    opening: context.openingCount,
    additions: parseMovement('additions', form.additions, issues),
    transfersIn: parseMovement('transfersIn', form.transfersIn, issues),
    deaths: parseMovement('deaths', form.deaths, issues),
    culls: parseMovement('culls', form.culls, issues),
    sales: parseMovement('sales', form.sales, issues),
    transfersOut: parseMovement('transfersOut', form.transfersOut, issues),
  };

  const feedConsumptionKg = parseMeasurement('feedConsumption', form.feedConsumption, issues);
  const waterConsumptionLitres = parseMeasurement('waterConsumption', form.waterConsumption, issues);

  const trimmedNotes = form.notes.trim();
  let notes: string | null = trimmedNotes.length > 0 ? trimmedNotes : null;
  if (trimmedNotes.length > MAX_NOTES_LENGTH) {
    issues.push({ field: 'notes', code: 'notes_too_long' });
    notes = null;
  }

  if (context.gapRequiresAcknowledgement && !context.editingExisting) {
    issues.push({ field: 'reportDate', code: 'gap_not_acknowledged' });
  }

  const stock = calculateClosingStock(movements);
  if (!stock.ok) {
    for (const issue of stock.issues as readonly BirdStockValidationIssue[]) {
      issues.push({
        // Opening is derived (trusted) and closing is a form-level result:
        // both attach to 'form' so the UI shows them in the summary block
        // rather than under a movement field.
        field:
          issue.field === 'opening' || issue.field === 'closing'
            ? 'form'
            : (issue.field as DailyReportFormField),
        code:
          issue.code === 'negative_closing_stock'
            ? 'movement_negative_closing'
            : issue.code === 'not_an_integer'
              ? 'movement_not_an_integer'
              : issue.code === 'negative'
                ? 'movement_negative'
                : 'movement_not_a_number',
      });
    }
  }

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  if (!stock.ok) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      reportDate,
      openingBirdCount: movements.opening,
      movements,
      closingBirdCount: stock.closing,
      feedConsumptionKg,
      waterConsumptionLitres,
      notes,
    },
  };
}
