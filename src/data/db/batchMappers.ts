/**
 * Pure mapping between SQLite rows and domain `Batch` objects.
 *
 * Keeps SQL column names (`poultry_type`, …) out of the UI layer, and fails
 * loudly on unknown enum values written by future/buggy code instead of
 * silently showing wrong status or type (AGENTS.md: validate at trust
 * boundaries). Tested with fake rows under node --test.
 */
import { isBatchStatus, isPoultryType, type Batch } from '../../domain/batch.ts';

export interface BatchRow {
  readonly id: string;
  readonly name: string;
  readonly poultry_type: string;
  readonly initial_bird_count: number;
  readonly start_date: string;
  readonly status: string;
  readonly created_at: string;
  readonly updated_at: string;
}

export function rowToBatch(row: BatchRow): Batch {
  if (!isPoultryType(row.poultry_type)) {
    throw new Error(`Unknown poultry_type in database: ${String(row.poultry_type)}`);
  }
  if (!isBatchStatus(row.status)) {
    throw new Error(`Unknown batch status in database: ${String(row.status)}`);
  }
  return {
    id: row.id,
    name: row.name,
    poultryType: row.poultry_type,
    initialBirdCount: row.initial_bird_count,
    startDate: row.start_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
