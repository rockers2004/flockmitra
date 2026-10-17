/**
 * Daily report form — create and edit one day of a batch's timeline.
 *
 * Job: fast, honest entry of daily movements. The opening count is derived
 * from the batch timeline (never typed); closing updates live as movements
 * are entered so mistakes are visible before saving. A date that skips
 * saved days shows a carry-forward notice that must be acknowledged.
 *
 * Edit mode locks the report date, prefills stored values, and — after a
 * save that changes the closing count — reports how many later days may
 * need review instead of silently rewriting them (AGENTS.md).
 */
import { useEffect, useMemo, useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  Card,
  InlineNotice,
  Screen,
  SectionHeader,
  TextField,
} from '../components';
import { getDailyReportById } from '../data/dailyReportRepository';
import {
  createDailyReport,
  updateExistingDailyReport,
} from '../data/dailyReportService';
import type { Batch } from '../domain/batch';
import { calculateClosingStock } from '../domain/birdStock';
import {
  MAX_NOTES_LENGTH,
  type DailyReport,
  type DailyReportFormValues,
  type DailyReportIssue,
  type DailyReportIssueCode,
} from '../domain/dailyReport';
import { todayIso } from '../domain/dates';
import { deriveReportOpening, type ReportOpening } from '../domain/reportTimeline';
import { useBatchReports } from '../hooks/useBatchReports';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { spacing } from '../theme/tokens';
import { formatCount, UNKNOWN_VALUE } from '../utils/format';

const ISSUE_KEYS: Readonly<Record<DailyReportIssueCode, TranslationKey>> = {
  date_required: 'dailyReport.error.dateRequired',
  date_invalid: 'dailyReport.error.dateInvalid',
  date_before_batch_start: 'dailyReport.error.dateBeforeBatchStart',
  date_in_future: 'dailyReport.error.dateInFuture',
  date_duplicate: 'dailyReport.error.dateDuplicate',
  movement_not_a_number: 'dailyReport.error.movementNotANumber',
  movement_not_an_integer: 'dailyReport.error.movementNotInteger',
  movement_negative: 'dailyReport.error.movementNegative',
  movement_negative_closing: 'dailyReport.error.negativeClosing',
  feed_not_a_number: 'dailyReport.error.feedNotANumber',
  feed_negative: 'dailyReport.error.feedNegative',
  feed_too_large: 'dailyReport.error.feedTooLarge',
  water_not_a_number: 'dailyReport.error.waterNotANumber',
  water_negative: 'dailyReport.error.waterNegative',
  water_too_large: 'dailyReport.error.waterTooLarge',
  notes_too_long: 'dailyReport.error.notesTooLong',
  gap_not_acknowledged: 'dailyReport.error.gapNotAcknowledged',
};

const MOVEMENT_FIELDS = [
  { key: 'additions', labelKey: 'dailyReport.additionsLabel' },
  { key: 'transfersIn', labelKey: 'dailyReport.transfersInLabel' },
  { key: 'deaths', labelKey: 'dailyReport.deathsLabel' },
  { key: 'culls', labelKey: 'dailyReport.cullsLabel' },
  { key: 'sales', labelKey: 'dailyReport.salesLabel' },
  { key: 'transfersOut', labelKey: 'dailyReport.transfersOutLabel' },
] as const satisfies readonly {
  key: keyof DailyReportFormValues;
  labelKey: TranslationKey;
}[];

const EMPTY_FORM: DailyReportFormValues = {
  reportDate: '',
  additions: '',
  transfersIn: '',
  deaths: '',
  culls: '',
  sales: '',
  transfersOut: '',
  feedConsumption: '',
  waterConsumption: '',
  notes: '',
};

function reportToForm(report: DailyReport): DailyReportFormValues {
  return {
    reportDate: report.reportDate,
    additions: report.additions === 0 ? '' : String(report.additions),
    transfersIn: report.transfersIn === 0 ? '' : String(report.transfersIn),
    deaths: report.deaths === 0 ? '' : String(report.deaths),
    culls: report.culls === 0 ? '' : String(report.culls),
    sales: report.sales === 0 ? '' : String(report.sales),
    transfersOut: report.transfersOut === 0 ? '' : String(report.transfersOut),
    feedConsumption: report.feedConsumptionKg === null ? '' : String(report.feedConsumptionKg),
    waterConsumption:
      report.waterConsumptionLitres === null ? '' : String(report.waterConsumptionLitres),
    notes: report.notes ?? '',
  };
}

/**
 * Display-only closing preview (the domain validator remains the single
 * authority on save). Returns null when the preview cannot be computed
 * (e.g. a movement is not a whole number, or the flock would go negative).
 */
function previewClosing(opening: number, form: DailyReportFormValues): number | null {
  const movements: Record<
    'additions' | 'transfersIn' | 'deaths' | 'culls' | 'sales' | 'transfersOut',
    number
  > = {
    additions: 0,
    transfersIn: 0,
    deaths: 0,
    culls: 0,
    sales: 0,
    transfersOut: 0,
  };
  for (const field of Object.keys(movements) as (keyof typeof movements)[]) {
    const trimmed = form[field].trim();
    if (trimmed.length === 0) {
      continue;
    }
    if (!/^\d+$/.test(trimmed)) {
      return null;
    }
    movements[field] = Number(trimmed);
  }
  const stock = calculateClosingStock({ opening, ...movements });
  return stock.ok ? stock.closing : null;
}

interface DailyReportFormScreenProps {
  readonly batchId: string;
  /** Present → edit this report; absent → create. */
  readonly reportId?: string;
  readonly onCancel: () => void;
  /** Called after a successful save; `affectedLater` is 0 for creates. */
  readonly onSaved: (affectedLater: number) => void;
}

export function DailyReportFormScreen({
  batchId,
  reportId,
  onCancel,
  onSaved,
}: DailyReportFormScreenProps) {
  const { t } = useI18n();
  const editing = reportId !== undefined;
  const { context, loading, error, reload } = useBatchReports(batchId);

  const [existing, setExisting] = useState<DailyReport | null>(null);
  const [form, setForm] = useState<DailyReportFormValues>(EMPTY_FORM);
  const [issues, setIssues] = useState<readonly DailyReportIssue[]>([]);
  const [systemError, setSystemError] = useState<'load' | 'save' | 'notFound' | 'readOnly' | null>(null);
  const [saving, setSaving] = useState(false);
  const [gapAcknowledged, setGapAcknowledged] = useState(false);

  // Prefill when editing; default the create date to the next timeline day
  // once the batch context arrives (usual flow: open → save).
  useEffect(() => {
    let cancelled = false;
    if (!editing) {
      setExisting(null);
      if (context !== null) {
        setForm((current) =>
          current.reportDate.trim().length === 0
            ? { ...current, reportDate: context.suggestedNextDate }
            : current,
        );
      }
      return () => {
        cancelled = true;
      };
    }
    getDailyReportById(reportId)
      .then((report) => {
        if (!cancelled) {
          if (report === null || report.batchId !== batchId) {
            setSystemError('notFound');
            return;
          }
          setExisting(report);
          setForm(reportToForm(report));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSystemError('load');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [batchId, context, editing, reportId]);

  const setField = (key: keyof DailyReportFormValues, value: string): void => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const opening: ReportOpening | null = useMemo(() => {
    if (context === null) {
      return null;
    }
    if (editing && existing !== null) {
      return { kind: 'continuation', opening: existing.openingBirdCount, previousDate: existing.reportDate };
    }
    return deriveReportOpening(
      context.reports,
      form.reportDate.trim(),
      context.batch.initialBirdCount,
    );
  }, [context, editing, existing, form.reportDate]);

  const openingCount = opening === null || opening.kind === 'duplicate' ? 0 : opening.opening;
  const closingPreview = useMemo(
    () => (opening === null || opening.kind === 'duplicate' ? null : previewClosing(openingCount, form)),
    [form, opening, openingCount],
  );

  const fieldError = (field: string): string | undefined => {
    const issue = issues.find((item) => item.field === field);
    return issue === undefined ? undefined : t(ISSUE_KEYS[issue.code]);
  };

  const onSave = async (): Promise<void> => {
    if (saving || context === null) {
      return;
    }
    // Keep validation results reachable: the keyboard can overlay the
    // issue notices and the save button on short screens.
    Keyboard.dismiss();
    setSystemError(null);
    setIssues([]);

    setSaving(true);
    try {
      if (editing && existing !== null) {
        const result = await updateExistingDailyReport(existing.id, form, todayIso());
        if (result.ok) {
          onSaved(result.affectedLaterReports.length);
          return;
        }
        if ('issues' in result) {
          setIssues(result.issues);
          return;
        }
        setSystemError('notFound' in result ? 'notFound' : 'readOnly');
        return;
      }
      const result = await createDailyReport(batchId, form, todayIso(), gapAcknowledged);
      if (result.ok) {
        onSaved(0);
        return;
      }
      if ('issues' in result) {
        setIssues(result.issues);
        return;
      }
      setSystemError('notFound');
    } catch {
      setSystemError('save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen title={editing ? t('dailyReport.editTitle') : t('dailyReport.newTitle')} onBack={onCancel}>
        <AppText variant="body" tone="muted">
          {t('common.loading')}
        </AppText>
      </Screen>
    );
  }

  if (error || context === null || systemError === 'load') {
    return (
      <Screen title={editing ? t('dailyReport.editTitle') : t('dailyReport.newTitle')} onBack={onCancel}>
        <View style={styles.stateBlock}>
          <InlineNotice tone="danger">{t('dailyReport.saveError')}</InlineNotice>
          <Button label={t('common.retry')} variant="secondary" onPress={reload} />
        </View>
      </Screen>
    );
  }

  if (systemError === 'notFound') {
    return (
      <Screen title={editing ? t('dailyReport.editTitle') : t('dailyReport.newTitle')} onBack={onCancel}>
        <InlineNotice tone="danger">{t('dailyReport.error.batchNotFound')}</InlineNotice>
      </Screen>
    );
  }

  const batch: Batch = context.batch;
  const openingCaption: TranslationKey =
    opening?.kind === 'first'
      ? 'dailyReport.openingFromInitial'
      : 'dailyReport.openingFromPrevious';

  return (
    <Screen
      title={editing ? t('dailyReport.editTitle') : t('dailyReport.newTitle')}
      subtitle={batch.name}
      onBack={onCancel}
    >
      {/* One notice per issue, plain string children (InlineNotice wraps AppText). */}
      {issues.length > 0 ? (
        <View style={styles.issueList}>
          {issues.map((issue) => (
            <InlineNotice key={`${issue.field}:${issue.code}`} tone="danger" liveRegion>
              {t(ISSUE_KEYS[issue.code])}
            </InlineNotice>
          ))}
        </View>
      ) : null}
      {systemError === 'save' ? (
        <InlineNotice tone="danger" liveRegion>
          {t('dailyReport.saveError')}
        </InlineNotice>
      ) : null}
      {systemError === 'readOnly' ? (
        <InlineNotice tone="warning" liveRegion>
          {t('batches.readOnly')}
        </InlineNotice>
      ) : null}

      <TextField
        label={t('dailyReport.dateLabel')}
        value={form.reportDate}
        onChangeText={(value) => setField('reportDate', value)}
        hint={editing ? t('dailyReport.dateLocked') : undefined}
        error={fieldError('reportDate')}
        autoCapitalize="none"
        maxLength={10}
        editable={!editing}
        testID="field-report-date"
      />

      <Card>
        <AppText variant="label" tone="muted">
          {t('dailyReport.openingLabel')}
        </AppText>
        <AppText variant="metric" numeric accessibilityRole="text">
          {formatCount(openingCount)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t(openingCaption)}
        </AppText>
      </Card>

      {opening?.kind === 'gap' && !editing ? (
        <View style={styles.gapBlock}>
          <InlineNotice tone="warning" liveRegion>
            {t('dailyReport.gapNotice', {
              days: opening.missingDays,
              date: opening.previousDate,
            })}
          </InlineNotice>
          <Button
            variant={gapAcknowledged ? 'primary' : 'secondary'}
            label={t('dailyReport.gapAckLabel')}
            selected={gapAcknowledged}
            onPress={() => setGapAcknowledged((value) => !value)}
          />
        </View>
      ) : null}

      <SectionHeader title={t('dailyReport.movementsHeader')} />
      {MOVEMENT_FIELDS.map((field) => (
        <TextField
          key={field.key}
          label={t(field.labelKey)}
          value={form[field.key]}
          onChangeText={(value) => setField(field.key, value)}
          keyboardType="numeric"
          maxLength={9}
          error={fieldError(field.key)}
          testID={`field-movement-${field.key}`}
        />
      ))}
      <AppText variant="caption" tone="muted">
        {t('dailyReport.zeroHint')}
      </AppText>

      <Card>
        <AppText variant="label" tone="muted">
          {t('dailyReport.closingLabel')}
        </AppText>
        <AppText variant="metric" numeric accessibilityRole="text">
          {closingPreview === null ? UNKNOWN_VALUE : formatCount(closingPreview)}
        </AppText>
      </Card>

      <SectionHeader title={t('dailyReport.measurementsHeader')} />
      <TextField
        label={t('dailyReport.feedLabel')}
        value={form.feedConsumption}
        onChangeText={(value) => setField('feedConsumption', value)}
        placeholder={t('dailyReport.notRecorded')}
        hint={t('dailyReport.optionalHint')}
        keyboardType="decimal-pad"
        maxLength={10}
        error={fieldError('feedConsumption')}
        testID="field-feed"
      />
      <TextField
        label={t('dailyReport.waterLabel')}
        value={form.waterConsumption}
        onChangeText={(value) => setField('waterConsumption', value)}
        placeholder={t('dailyReport.notRecorded')}
        hint={t('dailyReport.optionalHint')}
        keyboardType="decimal-pad"
        maxLength={10}
        error={fieldError('waterConsumption')}
        testID="field-water"
      />
      <TextField
        label={t('dailyReport.notesLabel')}
        value={form.notes}
        onChangeText={(value) => setField('notes', value)}
        maxLength={MAX_NOTES_LENGTH + 50}
        multiline
        error={fieldError('notes')}
        testID="field-notes"
      />

      <View style={styles.actions}>
        <Button
          variant="ghost"
          label={t('common.cancel')}
          onPress={onCancel}
          disabled={saving}
          style={styles.actionButton}
        />
        <Button
          label={saving ? t('dailyReport.saving') : t('dailyReport.save')}
          onPress={() => void onSave()}
          disabled={saving}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stateBlock: {
    gap: spacing.md,
  },
  issueList: {
    gap: spacing.xs,
  },
  gapBlock: {
    gap: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '40%',
  },
});
