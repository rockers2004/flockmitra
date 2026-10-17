/**
 * Typography primitive. All screen text goes through AppText so every string
 * uses the token scale and palette instead of ad-hoc styles.
 */
import type { ReactNode } from 'react';
import { Text, type AccessibilityRole, type StyleProp, type TextStyle } from 'react-native';

import { colors, typography } from '../theme/tokens';

export type TextVariant = keyof typeof typography;

export type TextTone = 'default' | 'muted' | 'brand' | 'onBrand' | 'danger';

const toneColors: Readonly<Record<TextTone, string>> = {
  default: colors.ink,
  muted: colors.inkMuted,
  brand: colors.brand,
  onBrand: colors.onBrand,
  danger: colors.danger,
};

interface AppTextProps {
  readonly variant?: TextVariant;
  readonly tone?: TextTone;
  /** Tabular figures for counts and metrics that need to align. */
  readonly numeric?: boolean;
  readonly style?: StyleProp<TextStyle>;
  readonly numberOfLines?: number;
  readonly accessibilityRole?: AccessibilityRole;
  readonly children: ReactNode;
}

export function AppText({
  variant = 'body',
  tone = 'default',
  numeric = false,
  style,
  numberOfLines,
  accessibilityRole,
  children,
}: AppTextProps) {
  return (
    <Text
      style={[
        typography[variant],
        { color: toneColors[tone] },
        numeric ? { fontVariant: ['tabular-nums'] } : null,
        style,
      ]}
      numberOfLines={numberOfLines}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </Text>
  );
}
