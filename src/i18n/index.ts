import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { en } from './en';
import { ne } from './ne';
import type { Language, Translations } from './types';

const LANGUAGE_KEY = 'purple_haze_user_lang';

interface LanguageState {
  language: Language;
  translations: Translations;
  setLanguage: (lang: Language) => Promise<void>;
  initLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  translations: en,
  setLanguage: async (lang: Language) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, lang);
    } catch {
      // In-memory fallback
    }
    set({
      language: lang,
      translations: lang === 'ne' ? ne : en,
    });
  },
  initLanguage: async () => {
    try {
      const saved = await SecureStore.getItemAsync(LANGUAGE_KEY);
      if (saved === 'ne' || saved === 'en') {
        set({
          language: saved,
          translations: saved === 'ne' ? ne : en,
        });
      }
    } catch {
      // Keep default 'en'
    }
  },
}));

export const useI18n = () => {
  const { language, translations, setLanguage } = useLanguageStore();

  const formatCurrency = (amount: number): string => {
    const symbol = translations.common.currency;
    return `${symbol} ${amount.toLocaleString()}`;
  };

  return {
    t: translations,
    language,
    setLanguage,
    formatCurrency,
    isNepali: language === 'ne',
  };
};

export * from './types';
