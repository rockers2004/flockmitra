/**
 * Report details — read view of one saved day.
 *
 * Job: show what was recorded (opening, movements, closing, optional
 * measurements) and surface when the day no longer chains cleanly with
 * its predecessor after a historical edit. Editing reopens the form with
 * the stored values; completed batches stay read-only.
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
import { getDailyReportById } from '../data/dailyReportRepository';
import type { DailyReport } from '../domain/dailyReport';
import { useBatchReports } from '../hooks/useBatchReports';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslateFn } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, spacing } from '../theme/tokens';
import { formatCount, UNKNOWN_VALUE } from '../utils/format';
import { useEffect, useState } from 'react';

interface DailyReportDetailsScreenProps {
  readonly batchId: string;
  readonly reportId: string;
  readonly onBack: () => void;
  readonly onEdit: (batchId: string, reportId: string) => void;
}

export function DailyReportDetailsScreen({
  batchId,
  reportId,
  onBack,
  onEdit,
}: DailyReportDetailsScreenProps) {
  const { t } = useI18n();
  const { context, loading: contextLoading } = useBatchReports(batchId);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyReportById(reportId)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (result === null || result.batchId !== batchId) {
          setNotFound(true);
        } else {
          setReport(result);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [batchId, reportId]);

  if (loading || contextLoading) {
    return (
      <Screen title={t('dailyReport.detailsTitle')} onBack={onBack}>
        <AppText variant="body" tone="muted">
          {t('common.loading')}
        </AppText>
      </Screen>
    );
  }

  if (notFound || report === null || context === null) {
    return (
      <Screen title={t('dailyReport.detailsTitle')} onBack={onBack}>
        <InlineNotice tone="danger">{t('dailyReport.error.batchNotFound')}</InlineNotice>
      </Screen>
    );
  }

  const needsReview = context.inconsistentIds.includes(report.id);
  const readOnly = context.batch.status === 'completed';

  return (
    <Screen
      title={t('dailyReport.detailsTitle')}
      subtitle={`${context.batch.name} · ${report.reportDate}`}
      onBack={onBack}
    >
      {needsReview ? (
        <InlineNotice tone="warning" liveRegion>
          {t('dailyReport.reviewNotice')}
        </InlineNotice>
      ) : null}
      {readOnly ? (
        <InlineNotice tone="info">{t('batches.readOnly')}</InlineNotice>
      ) : null}

      <Card>
        <DetailRow
          labelKey="dailyReport.openingLabel"
          value={formatCount(report.openingBirdCount)}
          t={t}
        />
        <View style={styles.divider} />
        {MOVEMENT_ROWS.map((row) => (
          <DetailRow
            key={row.field}
            labelKey={row.labelKey}
            value={formatCount(report[row.field])}
            t={t}
          />
        ))}
        <View style={styles.divider} />
        <DetailRow
          labelKey="dailyReport.closingLabel"
          value={formatCount(report.closingBirdCount)}
          t={t}
          emphasize
        />
      </Card>

      <SectionHeader title={t('dailyReport.measurementsHeader')} />
      <Card>
        <DetailRow
          labelKey="dailyReport.feedLabel"
          value={
            report.feedConsumptionKg === null
              ? t('dailyReport.notRecorded')
              : String(report.feedConsumptionKg)
          }
          t={t}
        />
        <DetailRow
          labelKey="dailyReport.waterLabel"
          value={
            report.waterConsumptionLitres === null
              ? t('dailyReport.notRecorded')
              : String(report.waterConsumptionLitres)
          }
          t={t}
        />
      </Card>

      {report.notes !== null ? (
        <>
          <SectionHeader title={t('dailyReport.notesLabel')} />
          <Card>
            <AppText variant="body">{report.notes}</AppText>
          </Card>
        </>
      ) : null}

      {!readOnly ? (
        <Button
          label={t('dailyReport.edit')}
          onPress={() => onEdit(batchId, report.id)}
          style={styles.editButton}
        />
      ) : null}
    </Screen>
  );
}

const MOVEMENT_ROWS = [
  { field: 'additions', labelKey: 'dailyReport.additionsLabel' },
  { field: 'transfersIn', labelKey: 'dailyReport.transfersInLabel' },
  { field: 'deaths', labelKey: 'dailyReport.deathsLabel' },
  { field: 'culls', labelKey: 'dailyReport.cullsLabel' },
  { field: 'sales', labelKey: 'dailyReport.salesLabel' },
  { field: 'transfersOut', labelKey: 'dailyReport.transfersOutLabel' },
] as const satisfies readonly {
  field: 'additions' | 'transfersIn' | 'deaths' | 'culls' | 'sales' | 'transfersOut';
  labelKey: TranslationKey;
}[];

function DetailRow({
  labelKey,
  value,
  t,
  emphasize = false,
}: {
  labelKey: TranslationKey;
  value: string;
  t: TranslateFn;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <AppText variant={emphasize ? 'bodyStrong' : 'body'} tone={emphasize ? 'default' : 'muted'}>
        {t(labelKey)}
      </AppText>
      <AppText variant={emphasize ? 'metric' : 'bodyStrong'} numeric>
        {value === '' ? UNKNOWN_VALUE : value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.sm,
  },
  detailRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    rowGap: spacing.xs,
  },
  editButton: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});
