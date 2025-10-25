import React, { createContext, useContext, useEffect } from 'react';
import type { UserProfile } from '../types';
import { locales } from '../data/locales';

type Locale = 'en' | 'ar';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: keyof typeof locales.en, replacements?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode, profile: UserProfile, setProfile: React.Dispatch<React.SetStateAction<UserProfile>> }> = ({ children, profile, setProfile }) => {
  
  const setLocale = (newLocale: Locale) => {
    setProfile(prev => ({...prev, appLanguage: newLocale}));
  }

  const t = (key: keyof typeof locales.en, replacements?: Record<string, string | number>): string => {
    const lang = profile.appLanguage || 'en';
    let str = (locales[lang] as any)?.[key] || locales.en[key] || String(key);
    if (replacements) {
        Object.keys(replacements).forEach(rKey => {
            str = str.replace(`{${rKey}}`, String(replacements[rKey]));
        });
    }
    return str;
  };
  
  useEffect(() => {
    const lang = profile.appLanguage || 'en';
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [profile.appLanguage]);

  return (
    <LocaleContext.Provider value={{ locale: profile.appLanguage, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = (): LocaleContextType => {
  const context = useContext(LocaleContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
};