/**
 * Daily report persistence — thin, parameterized-SQL repository.
 *
 * Business rules (opening derivation, closing calculation, gap/duplicate
 * guards) live in the domain + service layers; this module only reads and
 * writes rows. All SQL uses bound parameters.
 */
import type { DailyReport, ValidatedDailyReportInput } from '../domain/dailyReport';
import { uuidV4 } from '../utils/uuid';
import { rowToDailyReport, type DailyReportRow } from './db/dailyReportMappers';
import { getDatabase } from './db/database';

/** Raised when the DB rejects a (batch_id, report_date) duplicate. */
export class DuplicateReportError extends Error {}

const INSERT_SQL = `
  INSERT INTO daily_reports
    (id, batch_id, report_date, opening_bird_count, additions, transfers_in,
     deaths, culls, sales, transfers_out, closing_bird_count,
     feed_consumption_kg, water_consumption_litres, notes, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

/** Inserts a validated report. Throws {@link DuplicateReportError} on batch/date clashes. */
export async function insertDailyReport(
  batchId: string,
  input: ValidatedDailyReportInput,
): Promise<DailyReport> {
  const now = new Date().toISOString();
  const report: DailyReport = {
    id: uuidV4(),
    batchId,
    reportDate: input.reportDate,
    openingBirdCount: input.openingBirdCount,
    additions: input.movements.additions,
    transfersIn: input.movements.transfersIn,
    deaths: input.movements.deaths,
    culls: input.movements.culls,
    sales: input.movements.sales,
    transfersOut: input.movements.transfersOut,
    closingBirdCount: input.closingBirdCount,
    feedConsumptionKg: input.feedConsumptionKg,
    waterConsumptionLitres: input.waterConsumptionLitres,
    notes: input.notes,
    createdAt: now,
    updatedAt: now,
  };

  const db = await getDatabase();
  try {
    await db.runAsync(INSERT_SQL, [
      report.id,
      report.batchId,
      report.reportDate,
      report.openingBirdCount,
      report.additions,
      report.transfersIn,
      report.deaths,
      report.culls,
      report.sales,
      report.transfersOut,
      report.closingBirdCount,
      report.feedConsumptionKg,
      report.waterConsumptionLitres,
      report.notes,
      report.createdAt,
      report.updatedAt,
    ]);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new DuplicateReportError(`Report already exists for ${batchId} on ${input.reportDate}`);
    }
    throw error;
  }
  return report;
}

/**
 * Updates the mutable parts of a report (movements, closing, measurements,
 * notes). The report date is immutable after creation so the timeline never
 * reshuffles silently. Returns the updated row.
 */
export async function updateDailyReport(
  reportId: string,
  input: ValidatedDailyReportInput,
): Promise<DailyReport> {
  const updatedAt = new Date().toISOString();
  const db = await getDatabase();
  const result = await db.runAsync(
    `UPDATE daily_reports SET
       opening_bird_count = ?, additions = ?, transfers_in = ?, deaths = ?,
       culls = ?, sales = ?, transfers_out = ?, closing_bird_count = ?,
       feed_consumption_kg = ?, water_consumption_litres = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    [
      input.openingBirdCount,
      input.movements.additions,
      input.movements.transfersIn,
      input.movements.deaths,
      input.movements.culls,
      input.movements.sales,
      input.movements.transfersOut,
      input.closingBirdCount,
      input.feedConsumptionKg,
      input.waterConsumptionLitres,
      input.notes,
      updatedAt,
      reportId,
    ],
  );
  if (result.changes === 0) {
    throw new Error(`daily report ${reportId} not found`);
  }
  const report = await getDailyReportById(reportId);
  if (report === null) {
    throw new Error(`daily report ${reportId} vanished after update`);
  }
  return report;
}

/** Chronological (date ASC) list for one batch. */
export async function listReportsByBatch(batchId: string): Promise<readonly DailyReport[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<DailyReportRow>(
    'SELECT * FROM daily_reports WHERE batch_id = ? ORDER BY report_date ASC',
    [batchId],
  );
  return rows.map(rowToDailyReport);
}

export async function getDailyReportById(id: string): Promise<DailyReport | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<DailyReportRow>('SELECT * FROM daily_reports WHERE id = ?', [id]);
  return row === null ? null : rowToDailyReport(row);
}
