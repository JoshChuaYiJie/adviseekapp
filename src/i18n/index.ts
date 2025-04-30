
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en';
import zhTranslation from './locales/zh';
import msTranslation from './locales/ms';
import taTranslation from './locales/ta';

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      zh: {
        translation: zhTranslation
      },
      ms: {
        translation: msTranslation
      },
      ta: {
        translation: taTranslation
      }
    },
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false // React already handles escaping
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n;
