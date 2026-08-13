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
            <span aria-hidden="true">DSH/</span>HUB
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
