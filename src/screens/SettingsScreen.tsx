/**
 * Settings — plain grouped rows, no decorative dashboard.
 *
 * The language picker is real: it switches the app's active dictionary
 * immediately. It also states honestly that the choice is not persisted.
 * Farm identity is labelled sample data; the about note spells out which
 * features (accounts, sync, AI) are not enabled in this build.
 */
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, InlineNotice, Screen, SectionHeader, StatusBadge } from '../components';
import { SAMPLE_FARM_NAME } from '../data/sampleData';
import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES, type Language } from '../i18n/strings';
import packageJson from '../../package.json';
import { spacing } from '../theme/tokens';

const LANGUAGE_LABEL_KEYS: Readonly<Record<Language, 'settings.langEn' | 'settings.langMr'>> = {
  en: 'settings.langEn',
  mr: 'settings.langMr',
};

export function SettingsScreen() {
  const { t, language, setLanguage } = useI18n();

  return (
    <Screen title={t('settings.title')} subtitle={t('common.tagline')}>
      <SectionHeader title={t('settings.language')} />
      <Card>
        <View style={styles.languageRow}>
          {LANGUAGES.map((option) => {
            const selected = option === language;
            return (
              <Button
                key={option}
                label={t(LANGUAGE_LABEL_KEYS[option])}
                variant={selected ? 'primary' : 'secondary'}
                selected={selected}
                onPress={() => setLanguage(option)}
                style={styles.languageButton}
              />
            );
          })}
        </View>
        <AppText variant="caption" tone="muted">
          {t('settings.languageNote')}
        </AppText>
      </Card>

      <SectionHeader title={t('settings.farm')} />
      <Card>
        <View style={styles.farmRow}>
          <AppText variant="bodyStrong">{SAMPLE_FARM_NAME}</AppText>
          <StatusBadge label={t('common.sampleBadge')} tone="info" />
        </View>
      </Card>

      <SectionHeader title={t('settings.about')} />
      <Card>
        <View style={styles.aboutRow}>
          <AppText variant="caption" tone="muted">
            {t('settings.version')}
          </AppText>
          <AppText variant="bodyStrong" numeric>
            {packageJson.version}
          </AppText>
        </View>
      </Card>

      <InlineNotice tone="info">{t('settings.notEnabled')}</InlineNotice>
    </Screen>
  );
}

const styles = StyleSheet.create({
  languageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  languageButton: {
    flexGrow: 1,
    flexBasis: '40%',
  },
  farmRow: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aboutRow: {
    alignItems: 'center',
    columnGap: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
