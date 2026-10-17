/**
 * Pure calendar-date helpers for batch start dates and derived ages.
 *
 * Convention: `startDate` is a farm-local calendar date stored as
 * `YYYY-MM-DD` with no timezone (AGENTS.md: make timezone assumptions
 * explicit). Ages are always derived from the stored date — never stored —
 * so they cannot drift out of sync with corrections later.
 *
 * No React Native imports: fully testable under `node --test`.
 */

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Strictly validates a calendar date in YYYY-MM-DD form (no rollover dates). */
export function isValidIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (match === null) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) {
    return false;
  }
  const maxDay = month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];
  return day >= 1 && day <= maxDay;
}

/** Today as a farm-local calendar date (YYYY-MM-DD). */
export function todayIso(now: Date = new Date()): string {
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Whole days from `startDate` to `today`. Both must be valid ISO dates;
 * returns 0 for the same day and a negative number if start is after today
 * (callers reject future start dates before this is shown).
 */
export function daysSince(startDate: string, today: string): number {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = today.split('-').map(Number);
  const startUtc = Date.UTC(startYear, startMonth - 1, startDay);
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((todayUtc - startUtc) / 86_400_000);
}

/**
 * Calendar arithmetic on YYYY-MM-DD dates (no timezone involvement: pure
 * UTC-based day stepping, then reformatted). `days` may be negative.
 * Throws if `isoDate` is not a valid calendar date.
 */
export function addDays(isoDate: string, days: number): string {
  if (!isValidIsoDate(isoDate)) {
    throw new Error(`addDays: invalid date ${isoDate}`);
  }
  const [year, month, day] = isoDate.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const outYear = String(shifted.getUTCFullYear()).padStart(4, '0');
  const outMonth = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const outDay = String(shifted.getUTCDate()).padStart(2, '0');
  return `${outYear}-${outMonth}-${outDay}`;
}
