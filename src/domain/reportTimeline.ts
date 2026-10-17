/**
 * Report timeline — pure rules for opening counts, gaps, duplicates and
 * historical consistency (AGENTS.md batch-entry workflow).
 *
 * All functions operate on minimal report projections ({reportDate,
 * closingBirdCount, …}) so they never depend on React Native, SQLite or the
 * full entity shape. Input arrays are treated as unordered; copies are
 * sorted, callers' arrays are never mutated.
 *
 * Rules implemented:
 * - First report opening  = batch initial bird count.
 * - Later report opening  = the previous (chronologically nearest earlier)
 *   saved report's closing count. Missing days are never treated as zero.
 * - A date with an existing report is a duplicate.
 * - A candidate date after a run of missing days is a `gap`: the opening is
 *   carried forward, and the caller must obtain explicit acknowledgement.
 * - Editing an earlier report flags later reports as potentially stale;
 *   nothing is silently rewritten.
 */
import { addDays } from './dates.ts';

/** Minimal projection of a saved report needed for timeline rules. */
export interface ReportTimelineEntry {
  readonly id: string;
  readonly reportDate: string;
  readonly openingBirdCount: number;
  readonly closingBirdCount: number;
}

export type ReportOpening =
  | {
      readonly kind: 'first';
      readonly opening: number;
    }
  | {
      readonly kind: 'continuation';
      readonly opening: number;
      readonly previousDate: string;
    }
  | {
      readonly kind: 'gap';
      readonly opening: number;
      readonly previousDate: string;
      /** Whole calendar days between the previous report and this date, minus one. */
      readonly missingDays: number;
    }
  | {
      readonly kind: 'duplicate';
      readonly previousDate: string;
    };

function sortedByDate(entries: readonly ReportTimelineEntry[]): readonly ReportTimelineEntry[] {
  return [...entries].sort((a, b) => (a.reportDate < b.reportDate ? -1 : a.reportDate > b.reportDate ? 1 : 0));
}

/** True when `candidateDate` has a saved report in `entries`. */
export function hasReportForDate(
  entries: readonly ReportTimelineEntry[],
  candidateDate: string,
): boolean {
  return entries.some((entry) => entry.reportDate === candidateDate);
}

/**
 * Derive the opening count and timeline situation for a candidate date.
 *
 * `batchInitialCount` seeds the first report. For later dates the opening
 * is the closing of the chronologically nearest earlier report; a jump over
 * missing days yields `gap` (carry-forward, needs acknowledgement).
 */
export function deriveReportOpening(
  entries: readonly ReportTimelineEntry[],
  candidateDate: string,
  batchInitialCount: number,
): ReportOpening {
  const sorted = sortedByDate(entries);

  const sameDay = sorted.find((entry) => entry.reportDate === candidateDate);
  if (sameDay !== undefined) {
    return { kind: 'duplicate', previousDate: sameDay.reportDate };
  }

  const earlier = sorted.filter((entry) => entry.reportDate < candidateDate);
  if (earlier.length === 0) {
    return { kind: 'first', opening: batchInitialCount };
  }

  const previous = earlier[earlier.length - 1];
  const missingDays = daysBetween(previous.reportDate, candidateDate) - 1;
  if (missingDays > 0) {
    return {
      kind: 'gap',
      opening: previous.closingBirdCount,
      previousDate: previous.reportDate,
      missingDays,
    };
  }
  return {
    kind: 'continuation',
    opening: previous.closingBirdCount,
    previousDate: previous.reportDate,
  };
}

/** Inclusive-free day count from `from` to `to` (to - from). Both valid dates. */
export function daysBetween(from: string, to: string): number {
  // addDays keeps the pure-calendar convention; daysSince validates nothing,
  // so anchor on addDays' strict validation of `from` and compute via stepping
  // the difference through UTC math on validated parts.
  const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
  const [toYear, toMonth, toDay] = to.split('-').map(Number);
  const fromUtc = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const toUtc = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

export interface LaterReportImpact {
  readonly id: string;
  readonly reportDate: string;
}

/**
 * Reports strictly later than the edited one whose opening may no longer
 * match their predecessor's closing. Returned in chronological order.
 */
export function findAffectedLaterReports(
  entries: readonly ReportTimelineEntry[],
  editedReportId: string,
): readonly LaterReportImpact[] {
  const sorted = sortedByDate(entries);
  const editedIndex = sorted.findIndex((entry) => entry.id === editedReportId);
  if (editedIndex === -1) {
    return [];
  }
  return sorted
    .slice(editedIndex + 1)
    .map((entry) => ({ id: entry.id, reportDate: entry.reportDate }));
}

/**
 * Reports whose stored opening no longer equals their predecessor's
 * closing — i.e. history that needs human review after an edit or a
 * gap-filled insertion. Never mutates data.
 */
/**
 * Reports whose stored opening no longer matches their predecessor's
 * closing — plus every later report in the chain (once one link breaks,
 * everything after it may need recalculation once the break is fixed).
 * Never mutates data.
 */
export function findInconsistentReports(
  entries: readonly ReportTimelineEntry[],
): readonly string[] {
  const sorted = sortedByDate(entries);
  const inconsistent: string[] = [];
  let chainBroken = false;
  for (let i = 1; i < sorted.length; i += 1) {
    if (chainBroken || sorted[i].openingBirdCount !== sorted[i - 1].closingBirdCount) {
      inconsistent.push(sorted[i].id);
      chainBroken = true;
    }
  }
  return inconsistent;
}

/** Default candidate date for a new report: day after the latest, else batch start. */
export function nextReportDate(
  entries: readonly ReportTimelineEntry[],
  batchStartDate: string,
): string {
  const sorted = sortedByDate(entries);
  if (sorted.length === 0) {
    return batchStartDate;
  }
  return addDays(sorted[sorted.length - 1].reportDate, 1);
}
