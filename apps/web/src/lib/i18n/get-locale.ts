import { cookies, headers } from "next/headers";

import { defaultLocale, isLocale, localeCookie, localeHeader, type Locale } from "./locales";
import { getMessages } from "./messages";

export async function getLocale(): Promise<Locale> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const fromHeader = headerStore.get(localeHeader);
  const fromCookie = cookieStore.get(localeCookie)?.value;
  if (isLocale(fromHeader)) return fromHeader;
  if (isLocale(fromCookie)) return fromCookie;
  return defaultLocale;
}

export async function getTranslator() {
  const locale = await getLocale();
  return { locale, t: getMessages(locale) };
}
