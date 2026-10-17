/**
 * Batch report timeline hook for the batch reports list / form screens.
 *
 * Loads the batch plus its saved reports through the service (local SQLite
 * — works offline) and derives the inconsistency flags once, so list rows
 * and the form share the same "needs review" answer. Cancels in-flight
 * loads on unmount/reload so rapid navigation cannot apply stale results.
 */
import { useCallback, useEffect, useState } from 'react';

import { loadBatchReportContext, type BatchReportContext } from '../data/dailyReportService';

export interface BatchReportsState {
  readonly context: BatchReportContext | null;
  readonly loading: boolean;
  readonly error: boolean;
  readonly reload: () => void;
}

export function useBatchReports(batchId: string): BatchReportsState {
  const [context, setContext] = useState<BatchReportContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    loadBatchReportContext(batchId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result.ok) {
          setContext(result.context);
          setError(false);
        } else {
          setContext(null);
          setError(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setContext(null);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [batchId, attempt]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { context, loading, error, reload };
}
