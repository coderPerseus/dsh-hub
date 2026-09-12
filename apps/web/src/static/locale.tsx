import { createContext, useContext } from 'react';
import { getMessages } from '../lib/i18n/messages';
import type { Locale } from '../lib/i18n/locales';
export const LocaleContext = createContext<Locale>('zh-CN');
export function useTranslator() { const locale = useContext(LocaleContext); return { locale, t: getMessages(locale) }; }
