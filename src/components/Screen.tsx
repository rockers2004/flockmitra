/**
 * Standard screen frame: fixed header (title + optional subtitle) over a
 * scrolling body with consistent padding and tab-bar clearance.
 *
 * Safe areas: iOS is handled by SafeAreaView; Android is edge-to-edge under
 * Expo, so the status-bar height is applied manually (no safe-area-context
 * dependency installed in this project).
 */
import type { ReactNode } from 'react';
import { Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';

import { useI18n } from '../i18n/I18nProvider';
import { colors, layout, spacing } from '../theme/tokens';
import { AppText } from './AppText';
import { Button } from './Button';

interface ScreenProps {
  readonly title: string;
  readonly subtitle?: string;
  /** Renders a Back action above the title (overlay/detail screens). */
  readonly onBack?: () => void;
  readonly children: ReactNode;
}

export function Screen({ title, subtitle, onBack, children }: ScreenProps) {
  const { t } = useI18n();
  const androidTopInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;

  return (
    <SafeAreaView style={[styles.safe, { paddingTop: androidTopInset }]}>
      {onBack ? (
        <View style={styles.backRow}>
          <Button variant="ghost" label={t('common.back')} onPress={onBack} style={styles.backButton} />
        </View>
      ) : null}
      <View style={styles.header}>
        <AppText variant="title" accessibilityRole="header">
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  backRow: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
  },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: layout.touchTargetMin,
  },
  header: {
    gap: spacing.xs,
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: layout.tabScreenBottomSpace,
    paddingHorizontal: layout.screenPadding,
  },
});
