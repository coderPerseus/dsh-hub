import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./styles.css";

export const metadata: Metadata = {
  description: "发现、筛选和安装 DeepSeek Harness 社区插件。",
  title: {
    default: "DSH Hub — DeepSeek Harness 插件目录",
    template: "%s · DSH Hub",
  },
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <header className="site-header">
          <a className="wordmark" href="/" aria-label="DSH Hub 首页">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path fill="currentColor" d="M27.9 8.5c-3.3-4.2-9.6-6.1-15.2-4.2C7.5 6 4.1 10.4 4 15.2c0 3.7 2 7 5.2 8.9l-2.4 4.1 6-2.3c1.1.2 2.2.3 3.3.2 6.4-.4 11.4-4.5 12.7-10.1-1.7 1.5-4.1 2.4-6.5 2.2-3.2-.2-5.8-2-7-4.6 2 1.3 4.7 1.6 7 .6 2.2-.9 4.1-3 5.6-5.7Z" />
              <circle cx="21.2" cy="11" r="1.25" fill="#102a4a" />
            </svg>
            <span>DSH</span><b>Hub</b>
          </a>
          <nav aria-label="站点导航">
            <a href="/#catalog">插件目录</a>
            <a href="https://github.com/deepseek-ai/deepseek-harness" rel="noreferrer" target="_blank">
              Harness ↗
            </a>
          </nav>
        </header>
        {children}
        <footer className="site-footer">
          <span>由公开仓库数据生成</span>
          <span>每个结论保留证据级别</span>
        </footer>
      </body>
    </html>
  );
}
