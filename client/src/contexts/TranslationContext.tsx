import React, { createContext, useContext, useState, useRef } from 'react';
import { API_URL } from '../globals';

//type Translations = Record<string, string>;

interface TranslationContextValue {
  language: string;
  setLanguage: (lang: string) => void;
  t: (text: string) => string; // sync: return cached translation or original
  translate: (text: string) => Promise<string>; // async: fetch translation
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<string>(localStorage.getItem('lang') || 'en');
  const cacheRef = useRef<Map<string, string>>(new Map());

  const setLanguage = (lang: string) => {
    localStorage.setItem('lang', lang);
    setLanguageState(lang);
  };

  const t = (text: string) => {
    if (language === 'en') return text;
    const key = `${language}:${text}`;
    return cacheRef.current.get(key) ?? text;
  };

  const translate = async (text: string) => {
    if (!text) return '';
    if (language === 'en') return text;
    const key = `${language}:${text}`;
    const cached = cacheRef.current.get(key);
    if (cached) return cached;

    try {
      const resp = await fetch(`${API_URL}/api/db/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, target: language }),
      });
      if (!resp.ok) {
        console.error('Translate proxy failed', resp.status);
        return text;
      }
      const data = await resp.json();
      // v2 response: data.data.translations[0].translatedText
      const translated = data?.data?.translations?.[0]?.translatedText ?? text;
      cacheRef.current.set(key, translated);
      return translated;
    } catch (err) {
      console.error('Translate error', err);
      return text;
    }
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, translate }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const ctx = useContext(TranslationContext);
  if (!ctx) throw new Error('useTranslation must be used within TranslationProvider');
  return ctx;
};

export default TranslationContext;
