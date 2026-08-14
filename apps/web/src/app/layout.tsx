import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getTranslator } from "../lib/i18n/get-locale";
import { htmlLang } from "../lib/i18n/locales";
import { absoluteUrl, siteUrl } from "../lib/site";
import { LocaleSwitcher } from "./locale-switcher";
import { SiteHeader } from "./site-header";
import "./styles.css";
import "./submission.css";

export const viewport = {
  initialScale: 1,
  viewportFit: "cover" as const,
  width: "device-width",
};

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getTranslator();
  return {
    alternates: { canonical: "/" },
    applicationName: "DSH Hub",
    description: t.siteDescription,
    keywords: ["DeepSeek Harness", "DSH plugins", "DeepSeek plugins", "Agent plugins", "DSH Hub"],
    metadataBase: siteUrl,
    openGraph: {
      description: t.siteDescription,
      images: [{ alt: "DSH Hub", url: absoluteUrl("/icon.png") }],
      locale,
      siteName: "DSH Hub",
      title: t.siteTitle,
      type: "website",
      url: "/",
    },
    robots: { follow: true, index: true },
    title: {
      default: t.siteTitle,
      template: "%s · DSH Hub",
    },
    twitter: {
      card: "summary",
      description: t.siteDescription,
      images: [absoluteUrl("/icon.png")],
      title: t.siteTitle,
    },
  };
}

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const { locale, t } = await getTranslator();

  return (
    <html lang={htmlLang(locale)} data-theme="dark">
      <body>
        <SiteHeader
          docsLabel={t.docs}
          homeAria={t.homeAria}
          navAria={t.navAria}
          pluginsLabel={t.plugins}
          submission={t.submission}
        />
        {children}
        <footer className="site-footer">
          <div className="ds-container footer-inner">
            <span>{t.footerNote}</span>
            <div className="footer-right">
              <a href="https://www.deepseek.com/harness/" rel="noreferrer" target="_blank">
                DeepSeek Harness
              </a>
              <LocaleSwitcher current={locale} label={t.language} />
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
