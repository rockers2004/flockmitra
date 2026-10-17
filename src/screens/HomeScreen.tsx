/**
 * Home — the farm overview.
 *
 * Job: within one glance show the flock's starting size from locally saved
 * batches, what needs attention today, and the two workflows the user
 * reaches for most (daily report, new batch). Hierarchy: hero count →
 * attention → actions.
 *
 * The hero sums the initial birds of non-completed batches persisted on
 * this device. It is labelled as initial birds, not a live count — a
 * "current" count needs daily reports to be meaningful. "Record daily
 * report" opens the batch picker on the Reports tab; "New batch" opens
 * the real create form.
 */
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  InlineNotice,
  Screen,
  SectionHeader,
} from '../components';
import { useBatches } from '../hooks/useBatches';
import { useI18n } from '../i18n/I18nProvider';
import { colors, spacing } from '../theme/tokens';
import { formatCount } from '../utils/format';

interface HomeScreenProps {
  readonly onCreateBatch: () => void;
  /** Opens the Reports tab to pick a batch and record a daily report. */
  readonly onRecordReport: () => void;
}

export function HomeScreen({ onCreateBatch, onRecordReport }: HomeScreenProps) {
  const { t } = useI18n();
  const { batches, loading, error, reload } = useBatches();

  const totalInitialBirds = batches
    .filter((batch) => batch.status !== 'completed')
    .reduce((total, batch) => total + batch.initialBirdCount, 0);

  return (
    <Screen title={t('home.title')} subtitle={t('home.subtitle')}>
      <Card style={styles.hero}>
        <AppText variant="label" tone="muted">
          {t('home.totalInitialBirds')}
        </AppText>
        {loading ? (
          <AppText variant="metric" tone="muted">
            {t('common.loading')}
          </AppText>
        ) : error ? (
          <AppText variant="metric" tone="danger">
            —
          </AppText>
        ) : (
          <AppText variant="hero" numeric accessibilityRole="text">
            {formatCount(totalInitialBirds)}
          </AppText>
        )}
        <AppText variant="caption" tone="muted">
          {t('home.fromBatches')}
        </AppText>
      </Card>

      {error ? (
        <View style={styles.stateBlock}>
          <InlineNotice tone="danger">{t('home.loadError')}</InlineNotice>
          <Button label={t('common.retry')} variant="secondary" onPress={reload} />
        </View>
      ) : null}

      <SectionHeader title={t('home.needsAttention')} />
      <AppText variant="body" tone="muted">
        {t('home.noAlerts')}
      </AppText>

      <SectionHeader title={t('home.todayActions')} />
      <View style={styles.actions}>
        <Button
          label={t('home.recordReport')}
          onPress={onRecordReport}
          accessibilityLabel={t('home.recordReport')}
          style={styles.actionButton}
        />
        <Button
          label={t('home.newBatch')}
          variant="secondary"
          onPress={onCreateBatch}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brandBorder,
    gap: spacing.xs,
  },
  stateBlock: {
    gap: spacing.md,
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
