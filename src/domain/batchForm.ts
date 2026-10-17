/**
 * Create-batch form validation — pure, deterministic, React-free.
 *
 * Mirrors the birdStock.ts conventions: machine-readable issue codes (the
 * UI maps them to Marathi/English strings), every problem collected in one
 * pass so the farmer sees all of them at once, and no user-facing text
 * here. `today` is injected so future-date checks are testable.
 */
import { isPoultryType, type CreateBatchInput } from './batch.ts';
import { isValidIsoDate } from './dates.ts';

export const MAX_BATCH_NAME_LENGTH = 100;
export const MAX_INITIAL_BIRD_COUNT = 1_000_000;

export type BatchFormIssueCode =
  | 'name_required'
  | 'name_too_long'
  | 'poultry_type_invalid'
  | 'count_required'
  | 'count_not_a_number'
  | 'count_not_integer'
  | 'count_negative'
  | 'count_too_large'
  | 'date_required'
  | 'date_invalid'
  | 'date_in_future';

export type BatchFormField = 'name' | 'poultryType' | 'initialBirdCount' | 'startDate';

export interface BatchFormIssue {
  readonly field: BatchFormField;
  readonly code: BatchFormIssueCode;
}

/** Raw form state — everything arrives as text from the inputs. */
export interface CreateBatchFormValues {
  readonly name: string;
  readonly poultryType: string;
  readonly initialBirdCount: string;
  readonly startDate: string;
}

export type CreateBatchValidation =
  | { readonly ok: true; readonly value: CreateBatchInput }
  | { readonly ok: false; readonly issues: readonly BatchFormIssue[] };

const DECIMAL_PATTERN = /^-?\d+(?:\.\d+)?$/;
const INTEGER_PATTERN = /^-?\d+$/;

function validateName(name: string): BatchFormIssue[] {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return [{ field: 'name', code: 'name_required' }];
  }
  if (trimmed.length > MAX_BATCH_NAME_LENGTH) {
    return [{ field: 'name', code: 'name_too_long' }];
  }
  return [];
}

function validateCount(raw: string): BatchFormIssue[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return [{ field: 'initialBirdCount', code: 'count_required' }];
  }
  if (!DECIMAL_PATTERN.test(trimmed)) {
    return [{ field: 'initialBirdCount', code: 'count_not_a_number' }];
  }
  if (!INTEGER_PATTERN.test(trimmed)) {
    return [{ field: 'initialBirdCount', code: 'count_not_integer' }];
  }
  const value = Number(trimmed);
  if (value < 0) {
    return [{ field: 'initialBirdCount', code: 'count_negative' }];
  }
  if (value > MAX_INITIAL_BIRD_COUNT) {
    return [{ field: 'initialBirdCount', code: 'count_too_large' }];
  }
  return [];
}

function validateStartDate(raw: string, today: string): BatchFormIssue[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return [{ field: 'startDate', code: 'date_required' }];
  }
  if (!isValidIsoDate(trimmed)) {
    return [{ field: 'startDate', code: 'date_invalid' }];
  }
  // ISO YYYY-MM-DD strings compare correctly lexicographically.
  if (trimmed > today) {
    return [{ field: 'startDate', code: 'date_in_future' }];
  }
  return [];
}

/**
 * Validate and normalize the create-batch form.
 * On success the returned value is ready for the repository (trimmed name,
 * parsed count, narrowed poultry type).
 */
export function validateCreateBatchInput(
  form: CreateBatchFormValues,
  today: string,
): CreateBatchValidation {
  const poultryType = form.poultryType.trim();

  const issues: BatchFormIssue[] = [
    ...validateName(form.name),
    ...(isPoultryType(poultryType)
      ? []
      : ([{ field: 'poultryType', code: 'poultry_type_invalid' }] as const)),
    ...validateCount(form.initialBirdCount),
    ...validateStartDate(form.startDate, today),
  ];

  if (issues.length > 0) {
    return { ok: false, issues };
  }
  if (!isPoultryType(poultryType)) {
    // Unreachable (the issue above already returned), but keeps the
    // narrowing to PoultryType explicit for the type checker.
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      name: form.name.trim(),
      poultryType,
      initialBirdCount: Number(form.initialBirdCount.trim()),
      startDate: form.startDate.trim(),
    },
  };
}
