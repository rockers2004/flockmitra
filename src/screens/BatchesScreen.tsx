/**
 * Batches — grouped by lifecycle stage: active → closing review → completed.
 *
 * Job: scan batch identity, bird count, age, status and reach the next
 * workflow action. Compact cards per batch, one action each, actions give
 * honest planned-workflow feedback (no fake forms or persistence).
 * Completed batches are presented as read-only, per AGENTS.md.
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
import {
  SAMPLE_BATCHES,
  type BatchStatus,
  type PoultryType,
  type SampleBatch,
} from '../data/sampleData';
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

export function BatchesScreen() {
  const { t } = useI18n();
  const [showPlannedNotice, setShowPlannedNotice] = useState(false);

  return (
    <Screen title={t('batches.title')} subtitle={t('batches.subtitle')}>
      <InlineNotice tone="info">{t('common.sampleNotice')}</InlineNotice>

      <Button
        label={t('batches.newBatch')}
        onPress={() => setShowPlannedNotice(true)}
        style={styles.newBatch}
      />

      {SECTIONS.map((section) => {
        const batches = SAMPLE_BATCHES.filter((batch) => batch.status === section.status);
        if (batches.length === 0) {
          return null;
        }
        return (
          <View key={section.status} style={styles.section}>
            <SectionHeader title={t(section.titleKey)} />
            <View style={styles.sectionItems}>
              {batches.map((batch) => (
                <BatchRow
                  key={batch.id}
                  batch={batch}
                  t={t}
                  onAction={() => setShowPlannedNotice(true)}
                />
              ))}
            </View>
          </View>
        );
      })}

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
  onAction,
}: {
  batch: SampleBatch;
  t: TranslateFn;
  onAction: () => void;
}) {
  return (
    <Card>
      <View style={styles.rowTop}>
        <View style={styles.identity}>
          <AppText variant="bodyStrong">{batch.name}</AppText>
          <AppText variant="caption" tone="muted">
            {`${t(TYPE_KEYS[batch.poultryType])} · ${t('batches.age', { days: batch.ageDays })}`}
          </AppText>
        </View>
        <View style={styles.countBlock}>
          <AppText variant="metric" numeric>
            {formatCount(batch.birdCount)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('batches.birdsNoun')}
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
        <Button variant="ghost" label={t(ACTION_KEYS[batch.status])} onPress={onAction} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
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
});
