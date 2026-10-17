/**
 * Batch domain types.
 *
 * Shared by the UI, validation and persistence layers. `PoultryType` and
 * `BatchStatus` were moved here from the retired sample data so the real
 * data layer and screens use one source of truth.
 *
 * Statuses mirror the AGENTS.md lifecycle:
 * active → closing review → completed/archived.
 * (Transitions are not implemented in this milestone.)
 */

export type PoultryType = 'broiler' | 'layer' | 'desi';

export type BatchStatus = 'active' | 'closingReview' | 'completed';

export const POULTRY_TYPES: readonly PoultryType[] = ['broiler', 'layer', 'desi'];

export const BATCH_STATUSES: readonly BatchStatus[] = ['active', 'closingReview', 'completed'];

export function isPoultryType(value: unknown): value is PoultryType {
  return typeof value === 'string' && (POULTRY_TYPES as readonly string[]).includes(value);
}

export function isBatchStatus(value: unknown): value is BatchStatus {
  return typeof value === 'string' && (BATCH_STATUSES as readonly string[]).includes(value);
}

/** A persisted batch. Dates are documented in AGENTS.md terms:
 * `startDate` is a farm-local calendar date (YYYY-MM-DD, no timezone);
 * `createdAt`/`updatedAt` are ISO-8601 UTC timestamps. */
export interface Batch {
  readonly id: string;
  readonly name: string;
  readonly poultryType: PoultryType;
  readonly initialBirdCount: number;
  readonly startDate: string;
  readonly status: BatchStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** Validated payload for creating a batch (id/timestamps added by the repository). */
export interface CreateBatchInput {
  readonly name: string;
  readonly poultryType: PoultryType;
  readonly initialBirdCount: number;
  readonly startDate: string;
}
