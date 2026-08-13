export const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dshhub-web.snailrun160.workers.dev",
);

export function absoluteUrl(path = "/"): string {
  return new URL(path, siteUrl).toString();
}
