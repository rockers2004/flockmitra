/**
 * App-localization context.
 *
 * Deliberately dependency-free: `i18next` (AGENTS.md "when introduced") can
 * replace this later without touching screens, because screens only use the
 * `t(key, params)` contract. The language choice lives in memory only —
 * Settings tells the user it is not persisted, so we never imply otherwise.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { dictionaries, type Language, type TranslationKey } from './strings';
import { translate, type TranslationParams } from './translate';

export type TranslateFn = (key: TranslationKey, params?: TranslationParams) => string;

interface I18nValue {
  readonly language: Language;
  readonly setLanguage: (language: Language) => void;
  readonly t: TranslateFn;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback<TranslateFn>(
    (key, params) => translate(dictionaries[language], key, params),
    [language],
  );

  const value = useMemo<I18nValue>(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value === null) {
    throw new Error('useI18n must be used inside <I18nProvider>');
  }
  return value;
}
