/**
 * Reports — an honest planned state.
 *
 * Job: show which reports are coming (daily report, batch summary) without
 * fabricating recorded entries or pretending a viewer exists. The intro and
 * "nothing recorded yet" note make the current state unambiguous.
 */
import { StyleSheet, View } from 'react-native';

import { AppText, Card, InlineNotice, Screen, StatusBadge } from '../components';
import { useI18n } from '../i18n/I18nProvider';
import { spacing } from '../theme/tokens';

export function ReportsScreen() {
  const { t } = useI18n();

  const plannedReports = [
    { titleKey: 'reports.daily', descKey: 'reports.dailyDesc' as const },
    { titleKey: 'reports.summary', descKey: 'reports.summaryDesc' as const },
  ] as const;

  return (
    <Screen title={t('reports.title')}>
      <AppText variant="body" tone="muted">
        {t('reports.intro')}
      </AppText>

      <View style={styles.list}>
        {plannedReports.map((report) => (
          <Card key={report.titleKey}>
            <View style={styles.row}>
              <AppText variant="bodyStrong" style={styles.title}>
                {t(report.titleKey)}
              </AppText>
              <StatusBadge label={t('common.planned')} tone="neutral" />
            </View>
            <AppText variant="caption" tone="muted">
              {t(report.descKey)}
            </AppText>
          </Card>
        ))}
      </View>

      <InlineNotice tone="info">{t('reports.plannedNote')}</InlineNotice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
  },
  row: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  title: {
    flexShrink: 1,
  },
});
