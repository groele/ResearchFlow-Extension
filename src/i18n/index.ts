import { useState, useEffect, useCallback } from 'react';
import { loadSettings, saveSettings } from '../storage/settings';
import { en, type TranslationKey } from './en';
import { zh } from './zh';

const dictionaries: Record<string, Record<TranslationKey, string>> = { en, zh };

let currentLang: 'en' | 'zh' = 'en';
let listeners: Array<(lang: 'en' | 'zh') => void> = [];

function notifyListeners(lang: 'en' | 'zh') {
  listeners.forEach(fn => fn(lang));
}

export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = dictionaries[currentLang] || en;
  let value = dict[key] || en[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
  }
  return value;
}

export function useLang() {
  const [lang, setLang] = useState<'en' | 'zh'>(currentLang);

  useEffect(() => {
    loadSettings().then(settings => {
      const saved = settings.profile?.language || 'en';
      currentLang = saved;
      setLang(saved);
    });

    const listener = (newLang: 'en' | 'zh') => setLang(newLang);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const switchLang = useCallback(async (newLang: 'en' | 'zh') => {
    currentLang = newLang;
    notifyListeners(newLang);
    const settings = await loadSettings();
    await saveSettings({
      profile: {
        ...settings.profile,
        displayName: settings.profile?.displayName || '',
        chineseName: settings.profile?.chineseName || '',
        englishName: settings.profile?.englishName || '',
        affiliation: settings.profile?.affiliation || '',
        orcid: settings.profile?.orcid || '',
        language: newLang,
      },
    });
  }, []);

  return { t, lang, switchLang };
}
