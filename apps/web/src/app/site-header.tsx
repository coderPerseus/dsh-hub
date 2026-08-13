"use client";

import { useEffect, useState } from "react";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M27.9 8.5c-3.3-4.2-9.6-6.1-15.2-4.2C7.5 6 4.1 10.4 4 15.2c0 3.7 2 7 5.2 8.9l-2.4 4.1 6-2.3c1.1.2 2.2.3 3.3.2 6.4-.4 11.4-4.5 12.7-10.1-1.7 1.5-4.1 2.4-6.5 2.2-3.2-.2-5.8-2-7-4.6 2 1.3 4.7 1.6 7 .6 2.2-.9 4.1-3 5.6-5.7Z" />
      <circle cx="21.2" cy="11" r="1.25" fill="#102a4a" />
    </svg>
  );
}

export function SiteHeader({
  docsLabel,
  homeAria,
  navAria,
  pluginsLabel,
}: {
  docsLabel: string;
  homeAria: string;
  navAria: string;
  pluginsLabel: string;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={scrolled ? "site-header is-scrolled" : "site-header"}>
      <a className="wordmark" href="/" aria-label={homeAria}>
        <Mark />
        <span className="wordmark-text"><span className="wordmark-lead">DeepSeek </span>Harness</span>
        <b>Hub</b>
      </a>
      <nav className="site-nav" aria-label={navAria}>
        <a href="/">{pluginsLabel}</a>
        <a href="https://deepseek-harness.github.io/deepseek-harness/guide/quickstart" rel="noreferrer" target="_blank">
          {docsLabel}
        </a>
        <a href="https://github.com/deepseek-ai/deepseek-harness" rel="noreferrer" target="_blank">
          GitHub
        </a>
      </nav>
    </header>
  );
}
