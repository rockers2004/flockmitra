/**
 * Daily report service — orchestration between the pure domain rules and
 * the thin repository.
 *
 * Responsibilities (kept out of UI components per AGENTS.md):
 * - Load the batch and its report timeline.
 * - Derive the opening count (first report: batch initial birds; later:
 *   previous closing; gaps: explicit carry-forward flag).
 * - Run form validation with the derived opening.
 * - Persist through the repository (DB uniqueness as the final guard).
 * - On edits: preserve the stored opening/date, recalculate closing, and
 *   report which later reviews may need review — never rewrite history.
 *
 * No user-facing strings: results carry machine-readable codes only.
 */
import type { Batch } from '../domain/batch';
import {
  validateDailyReportForm,
  type DailyReportFormValues,
  type DailyReportIssue,
  type ValidatedDailyReportInput,
} from '../domain/dailyReport';
import { isValidIsoDate } from '../domain/dates';
import {
  deriveReportOpening,
  findAffectedLaterReports,
  findInconsistentReports,
  hasReportForDate,
  nextReportDate,
  type LaterReportImpact,
  type ReportTimelineEntry,
} from '../domain/reportTimeline';
import {
  DuplicateReportError,
  getDailyReportById,
  insertDailyReport,
  listReportsByBatch,
  updateDailyReport,
} from './dailyReportRepository';
import { getBatchById } from './batchRepository';
import type { DailyReport } from '../domain/dailyReport';

export interface BatchReportContext {
  readonly batch: Batch;
  readonly reports: readonly DailyReport[];
  /** Report ids whose opening no longer matches the previous closing. */
  readonly inconsistentIds: readonly string[];
  /** Default date for the next new report (latest + 1 day, or batch start). */
  readonly suggestedNextDate: string;
}

export type BatchReportContextResult =
  | { readonly ok: true; readonly context: BatchReportContext }
  | { readonly ok: false; readonly batchNotFound: true };

export async function loadBatchReportContext(batchId: string): Promise<BatchReportContextResult> {
  const batch = await getBatchById(batchId);
  if (batch === null) {
    return { ok: false, batchNotFound: true };
  }
  const reports = await listReportsByBatch(batchId);
  return {
    ok: true,
    context: {
      batch,
      reports,
      inconsistentIds: findInconsistentReports(reports as readonly ReportTimelineEntry[]),
      suggestedNextDate: nextReportDate(reports as readonly ReportTimelineEntry[], batch.startDate),
    },
  };
}

export type CreateDailyReportResult =
  | { readonly ok: true; readonly report: DailyReport }
  | { readonly ok: false; readonly batchNotFound: true }
  | { readonly ok: false; readonly issues: readonly DailyReportIssue[] };

/**
 * Validate and persist a new daily report for `batchId`.
 *
 * `acknowledgeGap` must be true when the UI showed a gap notice and the
 * user confirmed carrying the count forward; otherwise a gap-date create
 * is rejected with a `gap_not_acknowledged` issue.
 */
export async function createDailyReport(
  batchId: string,
  form: DailyReportFormValues,
  today: string,
  acknowledgeGap = false,
): Promise<CreateDailyReportResult> {
  const batch = await getBatchById(batchId);
  if (batch === null) {
    return { ok: false, batchNotFound: true };
  }
  const reports = (await listReportsByBatch(batchId)) as readonly ReportTimelineEntry[];

  const candidateDate = form.reportDate.trim();
  const opening = isValidIsoDate(candidateDate)
    ? deriveReportOpening(reports, candidateDate, batch.initialBirdCount)
    : { kind: 'first' as const, opening: batch.initialBirdCount };

  const validation = validateDailyReportForm(form, {
    batchStartDate: batch.startDate,
    // Unused when kind === 'duplicate' (that path fails validation anyway).
    openingCount: opening.kind === 'duplicate' ? 0 : opening.opening,
    today,
    gapRequiresAcknowledgement: opening.kind === 'gap' && !acknowledgeGap,
    duplicateDate: opening.kind === 'duplicate',
    editingExisting: false,
  });
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }

  try {
    const report = await insertDailyReport(batchId, validation.value);
    return { ok: true, report };
  } catch (error) {
    if (error instanceof DuplicateReportError) {
      return {
        ok: false,
        issues: [{ field: 'reportDate', code: 'date_duplicate' }],
      };
    }
    throw error;
  }
}

export interface UpdateDailyReportSuccess {
  readonly ok: true;
  readonly report: DailyReport;
  /** Reports strictly after the edited one that may now be stale. */
  readonly affectedLaterReports: readonly LaterReportImpact[];
}

export type UpdateDailyReportResult =
  | UpdateDailyReportSuccess
  | { readonly ok: false; readonly notFound: true }
  | { readonly ok: false; readonly batchReadOnly: true }
  | { readonly ok: false; readonly issues: readonly DailyReportIssue[] };

/**
 * Edit an existing report's movements/measurements/notes. The report date
 * and stored opening count stay fixed; closing is recalculated. Later
 * reports are never rewritten — the caller surfaces the impact instead.
 */
export async function updateExistingDailyReport(
  reportId: string,
  form: DailyReportFormValues,
  today: string,
): Promise<UpdateDailyReportResult> {
  const existing = await getDailyReportById(reportId);
  if (existing === null) {
    return { ok: false, notFound: true };
  }
  const batch = await getBatchById(existing.batchId);
  if (batch === null) {
    return { ok: false, notFound: true };
  }
  if (batch.status === 'completed') {
    return { ok: false, batchReadOnly: true };
  }

  const reports = (await listReportsByBatch(existing.batchId)) as readonly ReportTimelineEntry[];
  const duplicateElsewhere = reports.some(
    (entry) => entry.id !== reportId && entry.reportDate === existing.reportDate,
  );

  const validation = validateDailyReportForm(form, {
    batchStartDate: batch.startDate,
    openingCount: existing.openingBirdCount,
    today,
    gapRequiresAcknowledgement: false,
    duplicateDate: duplicateElsewhere,
    editingExisting: true,
  });
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }

  const report = await updateDailyReport(reportId, validation.value as ValidatedDailyReportInput);
  return {
    ok: true,
    report,
    affectedLaterReports: findAffectedLaterReports(reports, reportId),
  };
}

/** Re-export for UI convenience (date field checks). */
export { hasReportForDate };
