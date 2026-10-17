/**
 * Batch reports — the chronological daily timeline for one batch.
 *
 * Job: scan recent days (opening → movements → closing), spot days that
 * need review after an edit, and reach the next new report. The batch
 * identity stays visible in the subtitle; historical rows are read-only
 * entry points to the day's details.
 */
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  InlineNotice,
  Screen,
  StatusBadge,
} from '../components';
import type { DailyReport } from '../domain/dailyReport';
import { useBatchReports } from '../hooks/useBatchReports';
import { useI18n } from '../i18n/I18nProvider';
import { spacing } from '../theme/tokens';
import { formatCount } from '../utils/format';

interface BatchReportsScreenProps {
  readonly batchId: string;
  /** One-shot save notices from the form. */
  readonly flash: 'reportSaved' | 'reportUpdated' | null;
  readonly affectedLaterCount: number;
  readonly onBack: () => void;
  readonly onCreateReport: (batchId: string) => void;
  readonly onOpenReport: (batchId: string, reportId: string) => void;
}

export function BatchReportsScreen({
  batchId,
  flash,
  affectedLaterCount,
  onBack,
  onCreateReport,
  onOpenReport,
}: BatchReportsScreenProps) {
  const { t } = useI18n();
  const { context, loading, error, reload } = useBatchReports(batchId);

  // Newest first: the latest closing count is what a farmer checks daily.
  const reportsDescending =
    context === null ? [] : [...context.reports].reverse();

  return (
    <Screen
      title={t('dailyReport.title')}
      subtitle={context?.batch.name}
      onBack={onBack}
    >
      {flash === 'reportSaved' ? (
        <InlineNotice tone="info" liveRegion>
          {t('dailyReport.savedNotice')}
        </InlineNotice>
      ) : null}
      {flash === 'reportUpdated' ? (
        <View style={styles.flashBlock}>
          <InlineNotice tone="info" liveRegion>
            {t('dailyReport.updatedNotice')}
          </InlineNotice>
          {affectedLaterCount > 0 ? (
            <InlineNotice tone="warning">
              {t('dailyReport.updatedAffected', { count: affectedLaterCount })}
            </InlineNotice>
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <AppText variant="body" tone="muted">
          {t('common.loading')}
        </AppText>
      ) : null}

      {error ? (
        <View style={styles.stateBlock}>
          <InlineNotice tone="danger">{t('dailyReport.saveError')}</InlineNotice>
          <Button label={t('common.retry')} variant="secondary" onPress={reload} />
        </View>
      ) : null}

      {!loading && !error && context !== null && reportsDescending.length === 0 ? (
        <View style={styles.stateBlock}>
          <AppText variant="bodyStrong">{t('dailyReport.listEmpty')}</AppText>
          <AppText variant="body" tone="muted">
            {t('dailyReport.listEmptyBody')}
          </AppText>
          <Button label={t('dailyReport.newReport')} onPress={() => onCreateReport(batchId)} />
        </View>
      ) : null}

      {!loading && !error && context !== null && reportsDescending.length > 0 ? (
        <>
          <Button
            label={t('dailyReport.newReport')}
            onPress={() => onCreateReport(batchId)}
            style={styles.newReport}
          />
          <View style={styles.list}>
            {reportsDescending.map((report) => (
              <ReportRow
                key={report.id}
                report={report}
                needsReview={context.inconsistentIds.includes(report.id)}
                onPress={() => onOpenReport(batchId, report.id)}
              />
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function ReportRow({
  report,
  needsReview,
  onPress,
}: {
  report: DailyReport;
  needsReview: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const movementBits: string[] = [];
  if (report.deaths > 0) {
    movementBits.push(`${t('dailyReport.deathsLabel')} ${formatCount(report.deaths)}`);
  }
  if (report.culls > 0) {
    movementBits.push(`${t('dailyReport.cullsLabel')} ${formatCount(report.culls)}`);
  }
  if (report.sales > 0) {
    movementBits.push(`${t('dailyReport.salesLabel')} ${formatCount(report.sales)}`);
  }
  const openingLine = `${t('dailyReport.openingLabel')} ${formatCount(report.openingBirdCount)}${
    movementBits.length > 0 ? ` · ${movementBits.join(' · ')}` : ''
  }`;

  return (
    <Card>
      <View style={styles.rowTop}>
        <View style={styles.identity}>
          <AppText variant="bodyStrong">{report.reportDate}</AppText>
          <AppText variant="caption" tone="muted">
            {openingLine}
          </AppText>
        </View>
        <View style={styles.countBlock}>
          <AppText variant="metric" numeric>
            {formatCount(report.closingBirdCount)}
          </AppText>
          <AppText variant="caption" tone="muted">
            {t('dailyReport.closingLabel')}
          </AppText>
        </View>
      </View>
      {needsReview ? (
        <View style={styles.reviewRow}>
          <StatusBadge label={t('dailyReport.needReview')} tone="warning" />
        </View>
      ) : null}
      <View style={styles.rowFooter}>
        <Button variant="ghost" label={t('batches.action.details')} onPress={onPress} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stateBlock: {
    gap: spacing.md,
  },
  flashBlock: {
    gap: spacing.xs,
  },
  newReport: {
    alignSelf: 'stretch',
  },
  list: {
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
  reviewRow: {
    marginTop: spacing.sm,
  },
  rowFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
});
