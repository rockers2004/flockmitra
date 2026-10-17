import { StatusBar } from 'expo-status-bar';

import { I18nProvider } from './src/i18n/I18nProvider';
import { AppShell } from './src/navigation/AppShell';

export default function App() {
  return (
    <I18nProvider>
      {/* Light theme surfaces throughout; dark icons/text for contrast. */}
      <StatusBar style="dark" />
      <AppShell />
    </I18nProvider>
  );
}
