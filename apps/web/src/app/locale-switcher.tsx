"use client";

import { useRouter } from "next/navigation";

import { localeCookie, localeOptions, type Locale } from "../lib/i18n/locales";

export function LocaleSwitcher({
  current,
  label,
}: {
  current: Locale;
  label: string;
}) {
  const router = useRouter();

  const choose = (locale: Locale) => {
    document.cookie = `${localeCookie}=${locale}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };

  return (
    <nav className="locale-switch" aria-label={label}>
      {localeOptions.map(option => (
        <button
          aria-pressed={option.id === current}
          className={option.id === current ? "is-active" : undefined}
          key={option.id}
          onClick={() => choose(option.id)}
          title={option.label}
          type="button"
        >
          {option.code}
        </button>
      ))}
    </nav>
  );
}
