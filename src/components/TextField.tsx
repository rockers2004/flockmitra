/**
 * Labelled text input used by forms.
 *
 * One input style for the whole app: label above, 48dp-min field, optional
 * hint below, and an inline error when the field has a validation issue
 * (the form also shows all issues at once in its notice block). Text grows
 * and wraps — no fixed widths, safe for Marathi.
 */
import { StyleSheet, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { colors, layout, radii, spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface TextFieldProps {
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly placeholder?: string;
  readonly hint?: string;
  readonly error?: string;
  readonly keyboardType?: KeyboardTypeOptions;
  readonly maxLength?: number;
  readonly autoCapitalize?: 'none' | 'sentences';
  readonly multiline?: boolean;
  /** Locked fields (e.g. a report date after save) stay visible but uneditable. */
  readonly editable?: boolean;
  /** Stable automation id for the input (Maestro), distinct from the label text. */
  readonly testID?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  error,
  keyboardType,
  maxLength,
  autoCapitalize = 'sentences',
  multiline = false,
  editable = true,
  testID,
}: TextFieldProps) {
  return (
    <View style={styles.field}>
      <AppText variant="label" tone="muted" style={styles.label}>
        {label}
      </AppText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        editable={editable}
        testID={testID}
        accessibilityLabel={label}
        accessibilityHint={hint}
        accessibilityState={{ ...(error ? { invalid: true } : null), ...(editable ? null : { disabled: true }) }}
        style={[
          styles.input,
          multiline ? styles.inputMultiline : null,
          error ? styles.inputError : null,
          editable ? null : styles.inputLocked,
        ]}
      />
      {error ? (
        <AppText variant="caption" tone="danger" accessibilityRole="alert">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" tone="muted">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: spacing.xs,
  },
  label: {
    textTransform: 'none',
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.sm,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    minHeight: layout.touchTargetMin,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputMultiline: {
    minHeight: layout.touchTargetMin * 2,
    textAlignVertical: 'top',
  },
  inputLocked: {
    color: colors.inkMuted,
  },
});
