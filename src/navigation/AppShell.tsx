/**
 * App shell: renders the active screen above a fixed tab bar.
 *
 * Lightweight state-based navigation (four tabs) — intentionally no
 * navigation dependency, which would need to be installed and approved.
 * Only the active screen is mounted, so tab switches reset transient UI
 * state (e.g. planned-workflow notices) instead of leaking it.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BatchesScreen } from '../screens/BatchesScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/tokens';
import { TabBar, type TabKey } from './TabBar';

export function AppShell() {
  const [tab, setTab] = useState<TabKey>('home');

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {tab === 'home' ? <HomeScreen /> : null}
        {tab === 'batches' ? <BatchesScreen /> : null}
        {tab === 'reports' ? <ReportsScreen /> : null}
        {tab === 'settings' ? <SettingsScreen /> : null}
      </View>
      <TabBar active={tab} onChange={setTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
