import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  daysBetween,
  deriveReportOpening,
  findAffectedLaterReports,
  findInconsistentReports,
  hasReportForDate,
  nextReportDate,
  type ReportTimelineEntry,
} from './reportTimeline.ts';

function entry(
  id: string,
  reportDate: string,
  openingBirdCount: number,
  closingBirdCount: number,
): ReportTimelineEntry {
  return { id, reportDate, openingBirdCount, closingBirdCount };
}

describe('deriveReportOpening', () => {
  test('first report opens at the batch initial count', () => {
    const result = deriveReportOpening([], '2026-10-01', 500);
    assert.deepEqual(result, { kind: 'first', opening: 500 });
  });

  test('next-day report opens at the previous closing', () => {
    const reports = [entry('a', '2026-10-01', 500, 498)];
    const result = deriveReportOpening(reports, '2026-10-02', 500);
    assert.deepEqual(result, {
      kind: 'continuation',
      opening: 498,
      previousDate: '2026-10-01',
    });
  });

  test('uses the chronologically nearest earlier report, not array order', () => {
    const reports = [
      entry('c', '2026-10-05', 490, 488),
      entry('a', '2026-10-01', 500, 498),
      entry('b', '2026-10-02', 498, 495),
    ];
    const result = deriveReportOpening(reports, '2026-10-06', 500);
    assert.deepEqual(result, {
      kind: 'continuation',
      opening: 488,
      previousDate: '2026-10-05',
    });
  });

  test('flags a gap over missing days and carries the count forward', () => {
    const reports = [entry('a', '2026-10-01', 500, 498)];
    const result = deriveReportOpening(reports, '2026-10-04', 500);
    assert.deepEqual(result, {
      kind: 'gap',
      opening: 498,
      previousDate: '2026-10-01',
      missingDays: 2, // Oct 2 and Oct 3
    });
  });

  test('detects duplicate dates', () => {
    const reports = [entry('a', '2026-10-01', 500, 498)];
    const result = deriveReportOpening(reports, '2026-10-01', 500);
    assert.deepEqual(result, { kind: 'duplicate', previousDate: '2026-10-01' });
  });

  test('a report before all existing reports is a fresh first', () => {
    const reports = [entry('a', '2026-10-05', 490, 488)];
    const result = deriveReportOpening(reports, '2026-10-03', 500);
    assert.deepEqual(result, { kind: 'first', opening: 500 });
  });

  test('crossing month boundaries yields the right missing-day count', () => {
    const reports = [entry('a', '2026-01-30', 100, 99)];
    const result = deriveReportOpening(reports, '2026-02-03', 100);
    assert.ok(result.kind === 'gap');
    if (result.kind === 'gap') {
      assert.equal(result.missingDays, 3); // Jan 31, Feb 1, Feb 2
    }
  });
});

describe('hasReportForDate / nextReportDate / daysBetween', () => {
  test('hasReportForDate matches exactly', () => {
    const reports = [entry('a', '2026-10-01', 500, 498)];
    assert.equal(hasReportForDate(reports, '2026-10-01'), true);
    assert.equal(hasReportForDate(reports, '2026-10-02'), false);
  });

  test('nextReportDate defaults to batch start, then day after latest', () => {
    assert.equal(nextReportDate([], '2026-10-01'), '2026-10-01');
    const reports = [entry('a', '2026-10-01', 500, 498), entry('b', '2026-10-03', 498, 497)];
    assert.equal(nextReportDate(reports, '2026-10-01'), '2026-10-04');
  });

  test('daysBetween counts whole days', () => {
    assert.equal(daysBetween('2026-10-01', '2026-10-02'), 1);
    assert.equal(daysBetween('2026-10-01', '2026-10-01'), 0);
    assert.equal(daysBetween('2026-10-04', '2026-10-01'), -3);
  });
});

describe('edit impact and consistency', () => {
  const reports = [
    entry('a', '2026-10-01', 500, 498),
    entry('b', '2026-10-02', 498, 495),
    entry('c', '2026-10-03', 495, 490),
  ];

  test('findAffectedLaterReports lists everything after the edited report', () => {
    assert.deepEqual(findAffectedLaterReports(reports, 'a'), [
      { id: 'b', reportDate: '2026-10-02' },
      { id: 'c', reportDate: '2026-10-03' },
    ]);
    assert.deepEqual(findAffectedLaterReports(reports, 'b'), [
      { id: 'c', reportDate: '2026-10-03' },
    ]);
    assert.deepEqual(findAffectedLaterReports(reports, 'c'), []);
    assert.deepEqual(findAffectedLaterReports(reports, 'missing'), []);
  });

  test('consistent chain reports no inconsistency', () => {
    assert.deepEqual(findInconsistentReports(reports), []);
  });

  test('an edit that changes closing marks later reports inconsistent', () => {
    const edited = [
      entry('a', '2026-10-01', 500, 460), // closing changed 498 → 460
      entry('b', '2026-10-02', 498, 495), // opening 498 ≠ 460
      entry('c', '2026-10-03', 495, 490),
    ];
    assert.deepEqual(findInconsistentReports(edited), ['b', 'c']);
  });

  test('does not mutate the input array', () => {
    const input = [entry('b', '2026-10-02', 1, 1), entry('a', '2026-10-01', 2, 2)];
    const copy = [...input];
    deriveReportOpening(input, '2026-10-03', 0);
    nextReportDate(input, '2026-10-01');
    assert.deepEqual(input, copy);
  });
});
