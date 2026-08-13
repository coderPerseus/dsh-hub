import type { Locale } from "./i18n/locales";
import type { Messages } from "./i18n/messages";

export function categoryLabel(category: string, labels: Record<string, string>): string {
  return labels[category] ?? category.replaceAll("-", " ");
}

export function compatibilityTone(status: "compatible" | "incompatible" | "unknown"): string {
  return status === "compatible" ? "is-compatible" : status === "incompatible" ? "is-incompatible" : "is-unknown";
}

export function compatibilityLabel(
  status: "compatible" | "incompatible" | "unknown",
  level: "unverified" | "declared" | "validated" | "tested",
  labels: Messages["compatibility"],
): string {
  return `${labels[status]} · ${labels[level]}`;
}

export function formatDate(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export function formatStars(value: number): string {
  return value >= 1_000 ? `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k` : String(value);
}
