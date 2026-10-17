/**
 * Callout row: tinted surface with a leading accent border and plain text.
 * Used for sample-data notices, planned-workflow feedback, needs-attention
 * items and error states — one visual language for "information the user
 * must read". No icons; the text carries the meaning.
 *
 * `liveRegion` makes Android TalkBack announce the message when it appears
 * (used for planned-workflow feedback after a button press).
 */
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '../theme/tokens';
import { AppText } from './AppText';

export type NoticeTone = 'info' | 'warning' | 'danger';

interface InlineNoticeProps {
  readonly tone: NoticeTone;
  readonly children: ReactNode;
  readonly liveRegion?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

const tonePalette: Readonly<Record<NoticeTone, { background: string; edge: string; text: Parameters<typeof AppText>[0]['tone'] }>> = {
  info: { background: colors.infoSoft, edge: colors.info, text: 'default' },
  warning: { background: colors.warningSoft, edge: colors.warning, text: 'default' },
  danger: { background: colors.dangerSoft, edge: colors.danger, text: 'danger' },
};

export function InlineNotice({ tone, children, liveRegion = false, style }: InlineNoticeProps) {
  const palette = tonePalette[tone];
  return (
    <View
      accessibilityLiveRegion={liveRegion ? 'polite' : 'none'}
      style={[styles.notice, { backgroundColor: palette.background, borderLeftColor: palette.edge }, style]}
    >
      <AppText variant="body" tone={palette.text} style={styles.text}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  notice: {
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  text: {
    flexShrink: 1,
  },
});
