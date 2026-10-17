/**
 * Section heading inside a screen's scrolling body.
 * The container already applies uniform gap; this adds the extra breathing
 * room a heading needs above its first item.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '../theme/tokens';
import { AppText } from './AppText';

interface SectionHeaderProps {
  readonly title: string;
  readonly action?: ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <AppText variant="section" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  title: {
    flexShrink: 1,
  },
});
