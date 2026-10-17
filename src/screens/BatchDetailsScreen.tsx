/**
 * Batch details — read-only inspection of one persisted batch.
 *
 * Job: confirm identity, type, start count, start date and age. The age is
 * derived from the stored start date (never stored — AGENTS.md), and no
 * current bird count is shown because none is persisted yet; showing a
 * fabricated live count would be dishonest.
 */
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  InlineNotice,
  Screen,
  StatusBadge,
} from '../components';
import { getBatchById } from '../data/batchRepository';
import type { Batch, BatchStatus, PoultryType } from '../domain/batch';
import { daysSince, todayIso } from '../domain/dates';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslateFn } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, spacing } from '../theme/tokens';
import { formatCount } from '../utils/format';

const TYPE_KEYS: Readonly<Record<PoultryType, TranslationKey>> = {
  broiler: 'batches.type.broiler',
  layer: 'batches.type.layer',
  desi: 'batches.type.desi',
};

const STATUS_KEYS: Readonly<Record<BatchStatus, TranslationKey>> = {
  active: 'batches.status.active',
  closingReview: 'batches.status.closingReview',
  completed: 'batches.status.completed',
};

const STATUS_TONES: Readonly<Record<BatchStatus, 'success' | 'info' | 'neutral'>> = {
  active: 'success',
  closingReview: 'info',
  completed: 'neutral',
};

interface BatchDetailsScreenProps {
  readonly batchId: string;
  readonly onBack: () => void;
}

type DetailsState =
  | { readonly phase: 'loading' }
  | { readonly phase: 'error' }
  | { readonly phase: 'missing' }
  | { readonly phase: 'ready'; readonly batch: Batch };

export function BatchDetailsScreen({ batchId, onBack }: BatchDetailsScreenProps) {
  const { t } = useI18n();
  const [state, setState] = useState<DetailsState>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ phase: 'loading' });
    getBatchById(batchId)
      .then((batch) => {
        if (cancelled) {
          return;
        }
        setState(batch === null ? { phase: 'missing' } : { phase: 'ready', batch });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ phase: 'error' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [batchId, attempt]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return (
    <Screen title={t('batchDetails.title')} onBack={onBack}>
      {state.phase === 'loading' ? (
        <AppText variant="body" tone="muted">
          {t('common.loading')}
        </AppText>
      ) : null}

      {state.phase === 'error' ? (
        <View style={styles.stateBlock}>
          <InlineNotice tone="danger">{t('batchDetails.loadError')}</InlineNotice>
          <Button label={t('common.retry')} variant="secondary" onPress={retry} />
        </View>
      ) : null}

      {state.phase === 'missing' ? (
        <InlineNotice tone="danger">{t('batchDetails.notFound')}</InlineNotice>
      ) : null}

      {state.phase === 'ready' ? (
        <Card>
          <View style={styles.identity}>
            <AppText variant="title">{state.batch.name}</AppText>
            <View style={styles.badges}>
              <StatusBadge
                label={t(STATUS_KEYS[state.batch.status])}
                tone={STATUS_TONES[state.batch.status]}
              />
              {state.batch.status === 'completed' ? (
                <AppText variant="caption" tone="muted">
                  {t('batches.readOnly')}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.divider} />

          <DetailRow label={t('batchDetails.poultryType')} value={t(TYPE_KEYS[state.batch.poultryType])} />
          <DetailRow
            label={t('batchDetails.initialBirds')}
            value={`${formatCount(state.batch.initialBirdCount)} ${t('batches.birdsNoun')}`}
          />
          <DetailRow label={t('batchDetails.startDate')} value={state.batch.startDate} />
          <DetailRow
            label={t('batchDetails.age')}
            value={t('batches.age', { days: daysSince(state.batch.startDate, todayIso()) })}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <AppText variant="caption" tone="muted" style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText variant="bodyStrong" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  stateBlock: {
    gap: spacing.md,
  },
  identity: {
    gap: spacing.sm,
  },
  badges: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    flexShrink: 1,
  },
  detailValue: {
    flexShrink: 1,
    textAlign: 'right',
  },
});
