/**
 * Action button.
 *
 * - primary: the screen's main action (brand fill)
 * - secondary: supporting action (outline)
 * - ghost: low-emphasis in-row action (no fill)
 * Minimum height honours the ~48dp Android touch target; labels wrap instead
 * of clipping, so Marathi text and large fonts are safe.
 * `selected` adds radio semantics (used by the language picker).
 */
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, layout, radii, spacing } from '../theme/tokens';
import { AppText, type TextTone } from './AppText';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly disabled?: boolean;
  /** Radio-style selected state (a11y only; visual variant is chosen by the caller). */
  readonly selected?: boolean;
  readonly accessibilityLabel?: string;
  readonly style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  selected,
  accessibilityLabel,
  style,
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const tone: TextTone = isPrimary ? 'onBrand' : 'brand';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityState={{ disabled, ...(selected === undefined ? {} : { selected }) }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      <AppText
        variant="bodyStrong"
        tone={tone}
        style={styles.label}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    minHeight: layout.touchTargetMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  label: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});

const variantStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.brand,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.brand,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: colors.transparent,
    paddingHorizontal: spacing.sm,
  },
});
