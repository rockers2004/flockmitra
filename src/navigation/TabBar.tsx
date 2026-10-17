/**
 * Bottom tab bar: four destinations, no icon dependency (none is installed).
 * Selection is signalled three ways — top indicator mark, colour, and
 * accessibility selected state — so it never relies on colour alone.
 */
import { Platform, Pressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { useI18n } from '../i18n/I18nProvider';
import type { TranslationKey } from '../i18n/strings';
import { colors, elevation, layout, spacing } from '../theme/tokens';
import { AppText } from '../components';

export type TabKey = 'home' | 'batches' | 'reports' | 'settings';

export const TABS: readonly { key: TabKey; labelKey: TranslationKey }[] = [
  { key: 'home', labelKey: 'tabs.home' },
  { key: 'batches', labelKey: 'tabs.batches' },
  { key: 'reports', labelKey: 'tabs.reports' },
  { key: 'settings', labelKey: 'tabs.settings' },
];

interface TabBarProps {
  readonly active: TabKey;
  readonly onChange: (tab: TabKey) => void;
}

export function TabBar({ active, onChange }: TabBarProps) {
  const { t } = useI18n();
  const bottomPadding = Platform.OS === 'android' ? layout.androidNavBarPadding : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.row, { paddingBottom: bottomPadding }]}>
        {TABS.map((tab) => {
          const selected = tab.key === active;
          const label = t(tab.labelKey);
          return (
            <Pressable
              key={tab.key}
              onPress={() => onChange(tab.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              android_ripple={{ color: colors.brandSoft }}
              style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}
            >
              <View
                style={[styles.indicator, { backgroundColor: selected ? colors.brand : colors.transparent }]}
              />
              <AppText variant="label" tone={selected ? 'brand' : 'muted'} numberOfLines={1}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopWidth: 1,
    ...elevation.tabBar,
  },
  row: {
    flexDirection: 'row',
    height: layout.tabBarHeight,
  },
  item: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  itemPressed: {
    backgroundColor: colors.brandSoft,
  },
  indicator: {
    borderRadius: 2,
    height: 3,
    width: 18,
  },
});
