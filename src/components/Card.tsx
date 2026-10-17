/**
 * Surface container: white, hairline border, modest radius.
 * Screens may pass a style (e.g. tinted hero panel); nesting cards inside
 * cards is not supported by design.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';

interface CardProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
});
