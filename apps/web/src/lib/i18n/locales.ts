export const locales = ["zh-CN", "en", "ja", "ko", "zh-TW"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-CN";
export const localeCookie = "dshhub-locale";
export const localeHeader = "x-dshhub-locale";

export const localeOptions: Array<{ code: string; id: Locale; label: string }> = [
  { id: "zh-CN", code: "中", label: "简体中文" },
  { id: "en", code: "EN", label: "English" },
  { id: "ja", code: "日", label: "日本語" },
  { id: "ko", code: "한", label: "한국어" },
  { id: "zh-TW", code: "繁", label: "繁體中文" },
];

export function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale);
}

export function detectLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale;

  const candidates = acceptLanguage.split(",").map(part => {
    const [tag, qValue] = part.trim().split(";");
    const quality = qValue?.startsWith("q=") ? Number(qValue.slice(2)) : 1;
    return { quality: Number.isFinite(quality) ? quality : 1, tag: tag.trim().toLowerCase() };
  }).sort((left, right) => right.quality - left.quality);

  for (const { tag } of candidates) {
    if (tag.startsWith("zh-hant") || tag.startsWith("zh-tw") || tag.startsWith("zh-hk") || tag.startsWith("zh-mo")) {
      return "zh-TW";
    }
    if (tag.startsWith("zh")) return "zh-CN";
    if (tag.startsWith("ja")) return "ja";
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("en")) return "en";
  }

  return defaultLocale;
}

export function htmlLang(locale: Locale): string {
  return locale;
}

export function dateLocale(locale: Locale): string {
  return locale;
}
