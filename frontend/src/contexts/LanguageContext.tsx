import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { t as translate, type Language } from '@/lib/i18n';
import { useUser } from '@/contexts/UserContext';

interface LanguageContextType {
  language: Language;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { settings, currentUser } = useUser();
  const language = (currentUser && settings?.language ? settings.language : 'en') as Language;

  const t = useCallback(
    (key: string, params?: Record<string, string>) => translate(language, key, params),
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
