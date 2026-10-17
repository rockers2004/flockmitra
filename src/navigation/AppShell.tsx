/**
 * App shell: renders the active screen above a fixed tab bar, plus
 * stack-style overlay routes (create batch, batch details, batch reports,
 * report form, report details).
 *
 * Lightweight state-based navigation — intentionally no navigation
 * dependency, which would need to be installed and approved. Only the
 * active screen is mounted, so tab switches reset transient UI state
 * (e.g. planned-workflow notices) instead of leaking it.
 *
 * Android hardware back: pops an overlay, otherwise steps back toward the
 * Home tab, otherwise falls through to the default app-exit behaviour on
 * Home (Android convention).
 */
import { useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';

import { CreateBatchScreen } from '../screens/CreateBatchScreen';
import { BatchDetailsScreen } from '../screens/BatchDetailsScreen';
import { BatchesScreen } from '../screens/BatchesScreen';
import { BatchReportsScreen } from '../screens/BatchReportsScreen';
import { DailyReportDetailsScreen } from '../screens/DailyReportDetailsScreen';
import { DailyReportFormScreen } from '../screens/DailyReportFormScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { colors } from '../theme/tokens';
import { TabBar, type TabKey } from './TabBar';

/** One-shot notice after a successful create or report save. */
export type Flash =
  | 'batchCreated'
  | 'reportSaved'
  | { readonly kind: 'reportUpdated'; readonly affectedLater: number }
  | null;

/** Narrow to the report-list flash values (excludes 'batchCreated'). */
function reportFlash(flash: Flash): 'reportSaved' | 'reportUpdated' | null {
  if (flash === 'reportSaved') {
    return 'reportSaved';
  }
  if (typeof flash === 'object' && flash !== null && flash.kind === 'reportUpdated') {
    return 'reportUpdated';
  }
  return null;
}

/** Later-report count carried by an object flash, or 0. */
function flashAffectedLater(flash: Flash): number {
  return typeof flash === 'object' && flash !== null ? flash.affectedLater : 0;
}

type Route =
  | { readonly name: 'tabs' }
  | { readonly name: 'createBatch' }
  | { readonly name: 'batchDetails'; readonly batchId: string }
  | { readonly name: 'batchReports'; readonly batchId: string }
  | { readonly name: 'reportForm'; readonly batchId: string; readonly reportId?: string }
  | { readonly name: 'reportDetails'; readonly batchId: string; readonly reportId: string };

export function AppShell() {
  const [tab, setTab] = useState<TabKey>('home');
  const [route, setRoute] = useState<Route>({ name: 'tabs' });
  const [flash, setFlash] = useState<Flash>(null);

  // Auto-dismiss success notices; screens are fresh mounts on each visit,
  // so a stale notice would otherwise confuse.
  useEffect(() => {
    if (flash === null) {
      return;
    }
    const timer = setTimeout(() => setFlash(null), 4000);
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (route.name !== 'tabs') {
        // Step back one overlay level where a parent overlay exists.
        if (route.name === 'reportForm' || route.name === 'reportDetails') {
          setRoute({ name: 'batchReports', batchId: route.batchId });
        } else {
          setRoute({ name: 'tabs' });
        }
        return true;
      }
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [route, tab]);

  const openCreateBatch = () => setRoute({ name: 'createBatch' });
  const openBatchDetails = (batchId: string) => setRoute({ name: 'batchDetails', batchId });
  const openBatchReports = (batchId: string) => {
    setFlash(null);
    setRoute({ name: 'batchReports', batchId });
  };
  const openReportForm = (batchId: string, reportId?: string) =>
    setRoute({ name: 'reportForm', batchId, reportId });
  const openReportDetails = (batchId: string, reportId: string) =>
    setRoute({ name: 'reportDetails', batchId, reportId });

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {route.name === 'createBatch' ? (
          <CreateBatchScreen
            onCancel={() => setRoute({ name: 'tabs' })}
            onSaved={() => {
              setRoute({ name: 'tabs' });
              setTab('batches');
              setFlash('batchCreated');
            }}
          />
        ) : null}
        {route.name === 'batchDetails' ? (
          <BatchDetailsScreen
            batchId={route.batchId}
            onBack={() => setRoute({ name: 'tabs' })}
          />
        ) : null}
        {route.name === 'batchReports' ? (
          <BatchReportsScreen
            batchId={route.batchId}
            flash={reportFlash(flash)}
            affectedLaterCount={flashAffectedLater(flash)}
            onBack={() => setRoute({ name: 'tabs' })}
            onCreateReport={(batchId) => openReportForm(batchId)}
            onOpenReport={openReportDetails}
          />
        ) : null}
        {route.name === 'reportForm' ? (
          <DailyReportFormScreen
            batchId={route.batchId}
            reportId={route.reportId}
            onCancel={() => setRoute({ name: 'batchReports', batchId: route.batchId })}
            onSaved={(affectedLater) => {
              setRoute({ name: 'batchReports', batchId: route.batchId });
              setFlash(
                affectedLater > 0
                  ? { kind: 'reportUpdated', affectedLater }
                  : 'reportSaved',
              );
            }}
          />
        ) : null}
        {route.name === 'reportDetails' ? (
          <DailyReportDetailsScreen
            batchId={route.batchId}
            reportId={route.reportId}
            onBack={() => setRoute({ name: 'batchReports', batchId: route.batchId })}
            onEdit={openReportForm}
          />
        ) : null}
        {route.name === 'tabs' && tab === 'home' ? (
          <HomeScreen onCreateBatch={openCreateBatch} onRecordReport={() => setTab('reports')} />
        ) : null}
        {route.name === 'tabs' && tab === 'batches' ? (
          <BatchesScreen
            flash={flash === 'batchCreated' ? 'batchCreated' : null}
            onCreateBatch={openCreateBatch}
            onOpenBatchDetails={openBatchDetails}
            onOpenBatchReports={openBatchReports}
          />
        ) : null}
        {route.name === 'tabs' && tab === 'reports' ? (
          <ReportsScreen onOpenBatchReports={openBatchReports} />
        ) : null}
        {route.name === 'tabs' && tab === 'settings' ? <SettingsScreen /> : null}
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
