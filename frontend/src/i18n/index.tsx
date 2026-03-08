import { createContext, useContext, useState, ReactNode } from 'react';
import { en, Translations } from './en';
import { vi } from './vi';

export type Lang = 'en' | 'vi';

const translations: Record<Lang, Translations> = { en, vi };

interface I18nContextType {
  lang: Lang;
  t: Translations;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
}

const I18nContext = createContext<I18nContextType>({
  lang: 'vi',
  t: vi,
  setLang: () => {},
  toggleLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem('life-sim-lang');
    return (saved === 'en' || saved === 'vi') ? saved : 'vi';
  });

  const handleSetLang = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('life-sim-lang', newLang);
  };

  const toggleLang = () => {
    handleSetLang(lang === 'vi' ? 'en' : 'vi');
  };

  return (
    <I18nContext.Provider value={{ lang, t: translations[lang], setLang: handleSetLang, toggleLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export { en, vi };
export type { Translations };
