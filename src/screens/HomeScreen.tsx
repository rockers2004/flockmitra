/**
 * Home — the farm overview.
 *
 * Job: within one glance, show the current flock size, what needs attention
 * today, and the two workflows the user reaches for most (daily report,
 * new batch). Hierarchy: sample banner → hero count → alerts → actions.
 *
 * The hero count is produced by the real `calculateClosingStock` domain
 * function from labelled sample movements — no fabricated metrics. Planned
 * actions give honest feedback instead of opening fake forms.
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
} from '../components';
import {
  deriveSampleAlerts,
  SAMPLE_BATCHES,
  SAMPLE_TODAY_MOVEMENTS,
} from '../data/sampleData';
import type { SampleAlert } from '../data/sampleData';
import { calculateClosingStock } from '../domain/birdStock';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, spacing } from '../theme/tokens';
import { formatCount } from '../utils/format';

const ALERT_TEXT_KEYS: Readonly<Record<SampleAlert['kind'], TranslationKey>> = {
  pendingReport: 'home.alertPendingReport',
  closingReview: 'home.alertClosingReady',
};

const ALERT_TONES: Readonly<Record<SampleAlert['kind'], 'warning' | 'info'>> = {
  pendingReport: 'warning',
  closingReview: 'info',
};

export function HomeScreen() {
  const { t } = useI18n();
  const [showPlannedNotice, setShowPlannedNotice] = useState(false);

  const movements = SAMPLE_TODAY_MOVEMENTS;
  const stock = calculateClosingStock(movements);

  const inflow = movements.additions + movements.transfersIn;
  const losses = movements.deaths + movements.culls;
  const outflow = movements.sales + movements.transfersOut;

  const alerts = deriveSampleAlerts(SAMPLE_BATCHES);
  const batchName = (batchId: string) =>
    SAMPLE_BATCHES.find((batch) => batch.id === batchId)?.name ?? '';

  const onPlannedAction = () => setShowPlannedNotice(true);

  return (
    <Screen title={t('home.title')} subtitle={t('home.subtitle')}>
      <InlineNotice tone="info">{t('common.sampleNotice')}</InlineNotice>

      <Card style={styles.hero}>
        <AppText variant="label" tone="muted">
          {t('home.currentBirds')}
        </AppText>
        {stock.ok ? (
          <AppText variant="hero" numeric accessibilityRole="text">
            {formatCount(stock.closing)}
          </AppText>
        ) : (
          <AppText variant="metric" tone="danger">
            —
          </AppText>
        )}
        <AppText variant="caption" tone="muted">
          {t('home.fromMovements')}
        </AppText>

        {stock.ok ? (
          <>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Stat label={t('home.opening')} value={movements.opening} />
              <Stat label={t('home.inflow')} value={inflow} />
              <Stat label={t('home.losses')} value={losses} />
              <Stat label={t('home.outflow')} value={outflow} />
            </View>
          </>
        ) : null}
      </Card>

      {!stock.ok ? <InlineNotice tone="danger">{t('common.stockInvalid')}</InlineNotice> : null}

      <SectionHeader title={t('home.needsAttention')} />
      {alerts.length > 0 ? (
        <View style={styles.alertList}>
          {alerts.map((alert) => (
            <InlineNotice key={alert.id} tone={ALERT_TONES[alert.kind]}>
              {t(ALERT_TEXT_KEYS[alert.kind], { batch: batchName(alert.batchId) })}
            </InlineNotice>
          ))}
        </View>
      ) : (
        <AppText variant="body" tone="muted">
          {t('home.noAlerts')}
        </AppText>
      )}

      <SectionHeader title={t('home.todayActions')} />
      <View style={styles.actions}>
        <Button
          label={t('home.recordReport')}
          onPress={onPlannedAction}
          accessibilityLabel={t('home.recordReport')}
          style={styles.actionButton}
        />
        <Button
          label={t('home.newBatch')}
          variant="secondary"
          onPress={onPlannedAction}
          style={styles.actionButton}
        />
      </View>

      {showPlannedNotice ? (
        <InlineNotice tone="info" liveRegion>
          {t('common.plannedNotice')}
        </InlineNotice>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <AppText variant="bodyStrong" numeric>
        {formatCount(value)}
      </AppText>
      <AppText variant="caption" tone="muted" numberOfLines={2}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandBorder,
    gap: spacing.xs,
  },
  divider: {
    backgroundColor: colors.brandBorder,
    height: 1,
    marginTop: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  stat: {
    flexGrow: 1,
    flexBasis: '20%',
    gap: 2,
  },
  alertList: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '45%',
  },
});
