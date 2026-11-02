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
    // Canonical backend monetary amounts are in Paisa (1 NPR = 100 Paisa)
    const rupees = amount >= 1000 ? Math.round(amount / 100) : Math.round(amount);
    const formattedNum = rupees.toLocaleString('en-IN');
    
    if (language === 'ne') {
      const devanagariDigits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
      const neFormatted = formattedNum.replace(/\d/g, (d) => devanagariDigits[parseInt(d, 10)]);
      return `${symbol} ${neFormatted}`;
    }

    return `${symbol} ${formattedNum}`;
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
