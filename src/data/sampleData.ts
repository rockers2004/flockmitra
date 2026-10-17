/**
 * Clearly labelled SAMPLE data for the initial UI.
 *
 * Nothing here is persisted, loaded from storage, or synced — every screen
 * that displays it must show the "Preview only" notice (common.sampleNotice).
 * All counts stay consistent with the bird-stock formula:
 * closing == sum of non-completed batch counts (enforced by
 * sampleData.test.ts), so the dashboard and the batch list always agree.
 *
 * Type-only import of the domain module keeps this file free of runtime
 * dependencies (node --test strips it; Metro erases it).
 */
import type { BirdStockMovements } from '../domain/birdStock';

export type PoultryType = 'broiler' | 'layer' | 'desi';

/** Batch lifecycle states — mirrors AGENTS.md: active → closing review → completed. */
export type BatchStatus = 'active' | 'closingReview' | 'completed';

export interface SampleBatch {
  readonly id: string;
  readonly name: string;
  readonly poultryType: PoultryType;
  /** Current bird count for this batch (matches the farm-wide closing count). */
  readonly birdCount: number;
  readonly ageDays: number;
  readonly status: BatchStatus;
  /** Drives the "daily report pending" alert on Home. */
  readonly pendingDailyReport: boolean;
}

export type SampleAlertKind = 'pendingReport' | 'closingReview';

export interface SampleAlert {
  readonly id: string;
  readonly batchId: string;
  readonly kind: SampleAlertKind;
}

export const SAMPLE_FARM_NAME = 'Sample Farm';

export const SAMPLE_BATCHES: readonly SampleBatch[] = [
  {
    id: 'sample-batch-a',
    name: 'Broiler Batch A',
    poultryType: 'broiler',
    birdCount: 498,
    ageDays: 12,
    status: 'active',
    pendingDailyReport: true,
  },
  {
    id: 'sample-batch-b',
    name: 'Layer Batch B',
    poultryType: 'layer',
    birdCount: 350,
    ageDays: 64,
    status: 'active',
    pendingDailyReport: false,
  },
  {
    id: 'sample-batch-c',
    name: 'Desi Flock C',
    poultryType: 'desi',
    birdCount: 200,
    ageDays: 150,
    status: 'closingReview',
    pendingDailyReport: false,
  },
  {
    id: 'sample-batch-d',
    name: 'Broiler Batch D',
    poultryType: 'broiler',
    birdCount: 0,
    ageDays: 42,
    status: 'completed',
    pendingDailyReport: false,
  },
];

/**
 * Today's farm-wide movements (sample). Opening covers the three non-completed
 * batches plus the two recorded deaths; closing therefore equals
 * 498 + 350 + 200 = 1,048 — the same total the Batches screen shows.
 */
export const SAMPLE_TODAY_MOVEMENTS: BirdStockMovements = {
  opening: 1050,
  additions: 0,
  transfersIn: 0,
  deaths: 2,
  culls: 0,
  sales: 0,
  transfersOut: 0,
};

/** Derived from batch fields only — no invented alerts. */
export function deriveSampleAlerts(batches: readonly SampleBatch[]): SampleAlert[] {
  const alerts: SampleAlert[] = [];
  for (const batch of batches) {
    if (batch.status === 'completed') {
      continue;
    }
    if (batch.pendingDailyReport) {
      alerts.push({
        id: `${batch.id}:pending-report`,
        batchId: batch.id,
        kind: 'pendingReport',
      });
    }
    if (batch.status === 'closingReview') {
      alerts.push({
        id: `${batch.id}:closing-review`,
        batchId: batch.id,
        kind: 'closingReview',
      });
    }
  }
  return alerts;
}

/** Batches that still hold live birds (used for totals and opening counts). */
export function liveBatchBirdTotal(batches: readonly SampleBatch[]): number {
  return batches
    .filter((batch) => batch.status !== 'completed')
    .reduce((total, batch) => total + batch.birdCount, 0);
}
