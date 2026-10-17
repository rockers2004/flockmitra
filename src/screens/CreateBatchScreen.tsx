/**
 * Create batch — the first-run data entry screen.
 *
 * Job: capture the static batch attributes once (AGENTS.md: batch-entry
 * workflow). Validation runs locally through the pure domain validator;
 * on success the row is persisted via the repository and the shell returns
 * to Batches with a "saved" notice. No network involved — offline-first.
 *
 * Sensible defaults: poultry type preselected (broiler is the common case),
 * start date defaults to today so the usual flow is name + count + save.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AppText,
  Button,
  InlineNotice,
  Screen,
  TextField,
} from '../components';
import { insertBatch } from '../data/batchRepository';
import type { PoultryType } from '../domain/batch';
import { todayIso } from '../domain/dates';
import {
  MAX_BATCH_NAME_LENGTH,
  MAX_INITIAL_BIRD_COUNT,
  validateCreateBatchInput,
  type BatchFormIssueCode,
} from '../domain/batchForm';
import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, spacing } from '../theme/tokens';

const ISSUE_KEYS: Readonly<Record<BatchFormIssueCode, TranslationKey>> = {
  name_required: 'batchForm.error.nameRequired',
  name_too_long: 'batchForm.error.nameTooLong',
  poultry_type_invalid: 'batchForm.error.poultryTypeInvalid',
  count_required: 'batchForm.error.countRequired',
  count_not_a_number: 'batchForm.error.countNotANumber',
  count_not_integer: 'batchForm.error.countNotInteger',
  count_negative: 'batchForm.error.countNegative',
  count_too_large: 'batchForm.error.countTooLarge',
  date_required: 'batchForm.error.dateRequired',
  date_invalid: 'batchForm.error.dateInvalid',
  date_in_future: 'batchForm.error.dateInFuture',
};

const POULTRY_TYPE_OPTIONS: readonly { value: PoultryType; labelKey: TranslationKey }[] = [
  { value: 'broiler', labelKey: 'batches.type.broiler' },
  { value: 'layer', labelKey: 'batches.type.layer' },
  { value: 'desi', labelKey: 'batches.type.desi' },
];

interface CreateBatchScreenProps {
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}

export function CreateBatchScreen({ onCancel, onSaved }: CreateBatchScreenProps) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [poultryType, setPoultryType] = useState<PoultryType>('broiler');
  const [initialBirdCount, setInitialBirdCount] = useState('');
  const [startDate, setStartDate] = useState(() => todayIso());
  const [issues, setIssues] = useState<readonly BatchFormIssueCode[]>([]);
  const [saveFailed, setSaveFailed] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async (): Promise<void> => {
    if (saving) {
      return;
    }
    setSaveFailed(false);

    const validation = validateCreateBatchInput(
      { name, poultryType, initialBirdCount, startDate },
      todayIso(),
    );
    if (!validation.ok) {
      setIssues(validation.issues.map((issue) => issue.code));
      return;
    }
    setIssues([]);

    setSaving(true);
    try {
      await insertBatch(validation.value);
      onSaved();
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={t('batchForm.title')} onBack={onCancel}>
      {issues.length > 0 ? (
        // One notice per issue, each with plain string children: InlineNotice
        // already wraps its content in AppText, and nesting View/AppText
        // inside it drops those texts from the iOS accessibility tree.
        <View style={styles.issueList}>
          {issues.map((code) => (
            <InlineNotice key={code} tone="danger" liveRegion>
              {t(ISSUE_KEYS[code])}
            </InlineNotice>
          ))}
        </View>
      ) : null}
      {saveFailed ? (
        <InlineNotice tone="danger" liveRegion>
          {t('batchForm.saveError')}
        </InlineNotice>
      ) : null}

      <TextField
        label={t('batchForm.nameLabel')}
        value={name}
        onChangeText={setName}
        placeholder={t('batchForm.namePlaceholder')}
        maxLength={MAX_BATCH_NAME_LENGTH}
        testID="field-batch-name"
      />

      <View>
        <AppText variant="label" tone="muted" style={styles.poultryLabel}>
          {t('batchForm.poultryTypeLabel')}
        </AppText>
        <View style={styles.poultryRow}>
          {POULTRY_TYPE_OPTIONS.map((option) => {
            const selected = option.value === poultryType;
            return (
              <Button
                key={option.value}
                variant={selected ? 'primary' : 'secondary'}
                label={t(option.labelKey)}
                selected={selected}
                onPress={() => setPoultryType(option.value)}
                style={styles.poultryButton}
                accessibilityLabel={t(option.labelKey)}
              />
            );
          })}
        </View>
      </View>

      <TextField
        label={t('batchForm.initialBirdsLabel')}
        value={initialBirdCount}
        onChangeText={setInitialBirdCount}
        placeholder={t('batchForm.initialBirdsPlaceholder')}
        keyboardType="numeric"
        maxLength={String(MAX_INITIAL_BIRD_COUNT).length + 3}
        testID="field-initial-birds"
      />

      <TextField
        label={t('batchForm.startDateLabel')}
        value={startDate}
        onChangeText={setStartDate}
        hint={t('batchForm.startDateHint')}
        autoCapitalize="none"
        testID="field-start-date"
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
          label={saving ? t('batchForm.saving') : t('batchForm.save')}
          onPress={() => void onSave()}
          disabled={saving}
          style={styles.actionButton}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  issueList: {
    gap: spacing.xs,
  },
  poultryLabel: {
    marginBottom: spacing.xs,
    textTransform: 'none',
  },
  poultryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  poultryButton: {
    flexGrow: 1,
    flexBasis: '28%',
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
