"use client";

import { useState } from "react";

import { CopyButton } from "./copy-button";

const commands = {
  source: "git clone https://github.com/deepseek-ai/deepseek-harness",
  web: "npx @deepseek-ai/dsh web",
} as const;

export function HeroTerminal() {
  const [tab, setTab] = useState<keyof typeof commands>("web");
  const command = commands[tab];

  return (
    <div className="terminal-wrap hero-enter delay-3">
      <div className="tabs" role="tablist" aria-label="安装方式">
        <button
          aria-selected={tab === "web"}
          className={tab === "web" ? "active" : undefined}
          onClick={() => setTab("web")}
          role="tab"
          type="button"
        >
          一键使用
        </button>
        <button
          aria-selected={tab === "source"}
          className={tab === "source" ? "active" : undefined}
          onClick={() => setTab("source")}
          role="tab"
          type="button"
        >
          源码安装
        </button>
      </div>
      <div className="terminal">
        <div className="terminal-head">
          <div className="traffic" aria-hidden="true"><i /><i /><i /></div>
          <CopyButton value={command} />
        </div>
        <code><em>$</em> {command}</code>
      </div>
    </div>
  );
}
