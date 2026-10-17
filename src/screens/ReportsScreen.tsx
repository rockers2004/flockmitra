/**
 * Reports — the entry point to a batch's daily timeline.
 *
 * Job: pick which batch to record or view. Non-completed batches are
 * listed with their identity and age; completed batches are read-only and
 * appear under their own section (viewable, not recordable). Batch summary
 * remains a clearly marked planned workflow.
 */
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  InlineNotice,
  Screen,
  SectionHeader,
  StatusBadge,
} from '../components';
import type { Batch, BatchStatus } from '../domain/batch';
import { daysSince, todayIso } from '../domain/dates';
import { useBatches } from '../hooks/useBatches';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, spacing } from '../theme/tokens';
import { formatCount } from '../utils/format';

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

interface ReportsScreenProps {
  readonly onOpenBatchReports: (batchId: string) => void;
}

export function ReportsScreen({ onOpenBatchReports }: ReportsScreenProps) {
  const { t } = useI18n();
  const { batches, loading, error, reload } = useBatches();

  const recordable = batches.filter((batch) => batch.status !== 'completed');
  const completed = batches.filter((batch) => batch.status === 'completed');

  return (
    <Screen title={t('reports.title')}>
      {loading ? (
        <AppText variant="body" tone="muted">
          {t('common.loading')}
        </AppText>
      ) : null}

      {error ? (
        <View style={styles.stateBlock}>
          <InlineNotice tone="danger">{t('batches.loadError')}</InlineNotice>
          <Button label={t('common.retry')} variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {!loading && !error && batches.length === 0 ? (
        <View style={styles.stateBlock}>
          <AppText variant="bodyStrong">{t('batches.emptyTitle')}</AppText>
          <AppText variant="body" tone="muted">
            {t('reports.selectBatch')}
          </AppText>
        </View>
      ) : null}

      {!loading && !error && batches.length > 0 ? (
        <>
          <SectionHeader title={t('reports.activeBatches')} />
          {recordable.length === 0 ? (
            <AppText variant="body" tone="muted">
              {t('reports.selectBatch')}
            </AppText>
          ) : (
            <View style={styles.list}>
              {recordable.map((batch) => (
                <BatchPickRow
                  key={batch.id}
                  batch={batch}
                  onPress={() => onOpenBatchReports(batch.id)}
                />
              ))}
            </View>
          )}

          {completed.length > 0 ? (
            <>
              <SectionHeader title={t('batches.sectionCompleted')} />
              <View style={styles.list}>
                {completed.map((batch) => (
                  <BatchPickRow
                    key={batch.id}
                    batch={batch}
                    onPress={() => onOpenBatchReports(batch.id)}
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      <SectionHeader title={t('reports.summary')} />
      <Card>
        <AppText variant="bodyStrong">{t('reports.summaryDesc')}</AppText>
      </Card>
      <InlineNotice tone="info">{t('reports.plannedNote')}</InlineNotice>
    </Screen>
  );
}

function BatchPickRow({ batch, onPress }: { batch: Batch; onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Card>
      <View style={styles.rowTop}>
        <View style={styles.identity}>
          <AppText variant="bodyStrong">{batch.name}</AppText>
          <AppText variant="caption" tone="muted">
            {`${t('batches.age', { days: daysSince(batch.startDate, todayIso()) })} · ${formatInitial(batch.initialBirdCount, t)}`}
          </AppText>
        </View>
        <StatusBadge label={t(STATUS_KEYS[batch.status])} tone={STATUS_TONES[batch.status]} />
      </View>
      <Button variant="ghost" label={t('dailyReport.title')} onPress={onPress} style={styles.openButton} />
    </Card>
  );
}

function formatInitial(count: number, t: ReturnType<typeof useI18n>['t']): string {
  return `${t('batches.initialBirds')}: ${formatCount(count)}`;
}

const styles = StyleSheet.create({
  stateBlock: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  rowTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  identity: {
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: '50%',
  },
  openButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
});
