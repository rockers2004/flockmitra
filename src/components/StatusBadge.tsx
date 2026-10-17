/**
 * Status pill: coloured dot + text label. The label is always present, so
 * status is never communicated by colour alone (AGENTS.md / a11y rule).
 * Tones map to fixed meanings across the whole app:
 * success=healthy/active, warning=needs attention, info=neutral info,
 * danger=problem, neutral=finished/inactive.
 */
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { AppText } from './AppText';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  readonly label: string;
  readonly tone: StatusTone;
}

const tonePalette: Readonly<
  Record<StatusTone, { background: string; dot: string; text: string }>
> = {
  success: { background: colors.successSoft, dot: colors.success, text: colors.success },
  warning: { background: colors.warningSoft, dot: colors.warning, text: colors.warning },
  danger: { background: colors.dangerSoft, dot: colors.danger, text: colors.danger },
  info: { background: colors.infoSoft, dot: colors.info, text: colors.info },
  neutral: { background: colors.neutralSoft, dot: colors.neutral, text: colors.neutral },
};

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const palette = tonePalette[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette.background }]}>
      <View style={[styles.dot, { backgroundColor: palette.dot }]} />
      <AppText variant="label" style={[styles.label, { color: palette.text }]}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: radii.pill,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    rowGap: spacing.xs,
  },
  dot: {
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  label: {
    flexShrink: 1,
  },
});
