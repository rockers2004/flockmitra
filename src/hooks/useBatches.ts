/**
 * Shared batch-loading hook for Home and Batches.
 *
 * Loads through the repository (local SQLite — works offline), exposes
 * loading/error/retry states, and cancels in-flight loads on unmount or
 * reload so rapid tab switches cannot apply stale results.
 */
import { useCallback, useEffect, useState } from 'react';

import { listBatches } from '../data/batchRepository';
import type { Batch } from '../domain/batch';

export interface BatchesState {
  readonly batches: readonly Batch[];
  readonly loading: boolean;
  readonly error: boolean;
  readonly reload: () => void;
}

export function useBatches(): BatchesState {
  const [batches, setBatches] = useState<readonly Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    listBatches()
      .then((result) => {
        if (!cancelled) {
          setBatches(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBatches([]);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const reload = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  return { batches, loading, error, reload };
}
