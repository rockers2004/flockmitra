/**
 * Batches — grouped by lifecycle stage: active → closing review → completed.
 *
 * Job: scan batch identity, initial birds, age, status and reach the next
 * workflow action. Loads from local SQLite via the repository hook (works
 * offline); each state — loading, empty, error, data — is a deliberate
 * screen. "Record report" on active batches opens the real daily report
 * timeline; closing-review and completed actions still give honest
 * planned-workflow feedback until those workflows exist. Completed
 * batches stay read-only, per AGENTS.md.
 */
import { useState } from 'react';
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
import type { Batch, BatchStatus, PoultryType } from '../domain/batch';
import { daysSince, todayIso } from '../domain/dates';
import { useBatches } from '../hooks/useBatches';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslateFn } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, spacing } from '../theme/tokens';
import { formatCount } from '../utils/format';

interface Section {
  readonly status: BatchStatus;
  readonly titleKey: TranslationKey;
}

const SECTIONS: readonly Section[] = [
  { status: 'active', titleKey: 'batches.sectionActive' },
  { status: 'closingReview', titleKey: 'batches.sectionClosing' },
  { status: 'completed', titleKey: 'batches.sectionCompleted' },
];

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

/**
 * Badge tones: success = active, info = routine lifecycle step (closing
 * review), neutral = finished. "warning" stays reserved for items that need
 * attention (e.g. a missing daily report on Home).
 */
const STATUS_TONES: Readonly<Record<BatchStatus, 'success' | 'info' | 'neutral'>> = {
  active: 'success',
  closingReview: 'info',
  completed: 'neutral',
};

const ACTION_KEYS: Readonly<Record<BatchStatus, TranslationKey>> = {
  active: 'batches.action.record',
  closingReview: 'batches.action.review',
  completed: 'batches.action.summary',
};

interface BatchesScreenProps {
  /** One-shot "saved" notice from a just-completed create. */
  readonly flash: 'batchCreated' | null;
  readonly onCreateBatch: () => void;
  readonly onOpenBatchDetails: (batchId: string) => void;
  /** Opens a batch's daily report timeline (real workflow). */
  readonly onOpenBatchReports: (batchId: string) => void;
}

export function BatchesScreen({
  flash,
  onCreateBatch,
  onOpenBatchDetails,
  onOpenBatchReports,
}: BatchesScreenProps) {
  const { t } = useI18n();
  const { batches, loading, error, reload } = useBatches();
  const [showPlannedNotice, setShowPlannedNotice] = useState(false);

  return (
    <Screen title={t('batches.title')} subtitle={t('batches.subtitle')}>
      {flash === 'batchCreated' ? (
        <InlineNotice tone="info" liveRegion>
          {t('batches.createdNotice')}
        </InlineNotice>
      ) : null}

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
            {t('batches.emptyBody')}
          </AppText>
          <Button label={t('batches.newBatch')} onPress={onCreateBatch} />
        </View>
      ) : null}

      {!loading && !error && batches.length > 0 ? (
        <>
          <Button
            label={t('batches.newBatch')}
            onPress={onCreateBatch}
            style={styles.newBatch}
          />

          {SECTIONS.map((section) => {
            const sectionBatches = batches.filter((batch) => batch.status === section.status);
            if (sectionBatches.length === 0) {
              return null;
            }
            return (
              <View key={section.status} style={styles.section}>
                <SectionHeader title={t(section.titleKey)} />
                <View style={styles.sectionItems}>
                  {sectionBatches.map((batch) => (
                    <BatchRow
                      key={batch.id}
                      batch={batch}
                      t={t}
                      onOpenDetails={() => onOpenBatchDetails(batch.id)}
                      onRecordReport={() => onOpenBatchReports(batch.id)}
                      onPlannedAction={() => setShowPlannedNotice(true)}
                    />
                  ))}
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      {showPlannedNotice ? (
        <InlineNotice tone="info" liveRegion>
          {t('common.plannedNotice')}
        </InlineNotice>
      ) : null}
    </Screen>
  );
}

function BatchRow({
  batch,
  t,
  onOpenDetails,
  onRecordReport,
  onPlannedAction,
}: {
  batch: Batch;
  t: TranslateFn;
  onOpenDetails: () => void;
  onRecordReport: () => void;
  onPlannedAction: () => void;
}) {
  // Active batches open the real report timeline; closing-review and
  // completed workflows are still planned.
  const onStatusAction = batch.status === 'active' ? onRecordReport : onPlannedAction;
  return (
    <Card>
      <View style={styles.rowTop}>
        <View style={styles.identity}>
          <AppText variant="bodyStrong">{batch.name}</AppText>
          <AppText variant="caption" tone="muted">
            {`${t(TYPE_KEYS[batch.poultryType])} · ${t('batches.age', { days: daysSince(batch.startDate, todayIso()) })}`}
          </AppText>
        </View>
        <View style={styles.countBlock}>
          <AppText variant="metric" numeric>
            {formatCount(batch.initialBirdCount)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('batches.initialBirds')}
          </AppText>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.rowFooter}>
        <View style={styles.badges}>
          <StatusBadge label={t(STATUS_KEYS[batch.status])} tone={STATUS_TONES[batch.status]} />
          {batch.status === 'completed' ? (
            <AppText variant="caption" tone="muted">
              {t('batches.readOnly')}
            </AppText>
          ) : null}
        </View>
        <View style={styles.rowActions}>
          <Button variant="ghost" label={t('batches.action.details')} onPress={onOpenDetails} />
          <Button variant="ghost" label={t(ACTION_KEYS[batch.status])} onPress={onStatusAction} />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stateBlock: {
    gap: spacing.md,
  },
  newBatch: {
    alignSelf: 'stretch',
  },
  section: {
    gap: spacing.sm,
  },
  sectionItems: {
    gap: spacing.sm,
  },
  rowTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  identity: {
    flexShrink: 1,
    gap: spacing.xs,
    minWidth: '45%',
  },
  countBlock: {
    alignItems: 'flex-end',
    gap: 0,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
  },
  rowFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  badges: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.xs,
  },
  rowActions: {
    alignItems: 'center',
    columnGap: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
