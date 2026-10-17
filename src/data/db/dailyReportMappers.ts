/**
 * Pure mapping between SQLite rows and domain `DailyReport` objects.
 * Tested with fake rows under node --test (no expo-sqlite import).
 */
import type { DailyReport } from '../../domain/dailyReport';

export interface DailyReportRow {
  readonly id: string;
  readonly batch_id: string;
  readonly report_date: string;
  readonly opening_bird_count: number;
  readonly additions: number;
  readonly transfers_in: number;
  readonly deaths: number;
  readonly culls: number;
  readonly sales: number;
  readonly transfers_out: number;
  readonly closing_bird_count: number;
  readonly feed_consumption_kg: number | null;
  readonly water_consumption_litres: number | null;
  readonly notes: string | null;
  readonly created_at: string;
  readonly updated_at: string;
}

export function rowToDailyReport(row: DailyReportRow): DailyReport {
  return {
    id: row.id,
    batchId: row.batch_id,
    reportDate: row.report_date,
    openingBirdCount: row.opening_bird_count,
    additions: row.additions,
    transfersIn: row.transfers_in,
    deaths: row.deaths,
    culls: row.culls,
    sales: row.sales,
    transfersOut: row.transfers_out,
    closingBirdCount: row.closing_bird_count,
    feedConsumptionKg: row.feed_consumption_kg,
    waterConsumptionLitres: row.water_consumption_litres,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
