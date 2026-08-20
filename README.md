<div align="center">

# DSH Hub

**发现、比较和安装 DeepSeek Harness 社区插件。**

[浏览插件](https://dshhub.org) · [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/guide/quickstart) · [开发文档](docs/development.md) · [目录流水线](docs/catalog-pipeline.md)

</div>

<a href="https://dshhub.org">
  <img src="docs/assets/dsh-hub-catalog.png" alt="DSH Hub plugin catalog" width="100%" />
</a>

## 关于 DSH Hub

DSH Hub 是 DeepSeek Harness 社区插件的发现入口。它持续扫描 GitHub 上可安装的插件，整理能力分类、项目说明、兼容性线索和安装命令，让使用者和 Agent 更快找到适合当前任务的扩展。

你可以在 DSH Hub：

- 按能力分类、关键词、stars、更新时间和兼容状态查找插件；
- 在详情页查看插件用途、安装方式、使用说明和来源仓库；
- 复制安装命令，回到 DeepSeek Harness 中启用插件；
- 从网页、公共 API、CLI 或 DSH 原生工具访问同一份目录；
- 提交自己的插件，让社区更容易发现它。

## 开始使用

DSH Hub 提供两种使用方法。

### 方法一：给人使用

打开 [dshhub.org](https://dshhub.org)，搜索想要的能力，或从下方分类进入完整列表。进入插件详情页后，可以查看用途、兼容性依据、来源仓库和安装命令。

也可以通过 CLI 在终端中搜索和查看详情：

```bash
# 搜索插件
npx -y @dshhubs/cli@0.1.0 search "跨会话记忆" --limit 10

# 查看某个搜索结果的详情
npx -y @dshhubs/cli@0.1.0 plugin owner/repository
```

需要让脚本处理结果时加上 `--json`。

### 方法二：给 Agent 使用

在 DeepSeek Harness 中安装 DSH Hub 搜索插件：

```bash
npx -p @deepseek-ai/dsh dsh plugin --profile web add @dshhubs/plugin-search
```

安装后，Agent 会获得两个只读工具：

- `search_dsh_plugins`：根据能力、分类和兼容状态搜索插件；
- `get_dsh_plugin`：读取候选插件的兼容性依据、使用说明和安装命令。

你可以直接告诉 Agent：

> 帮我找一个能实现跨会话记忆的 DSH 插件，比较兼容性后给出安装命令。

Agent 会先搜索并检查候选项，不会自动安装搜索结果。仓库中的 `find-dsh-plugins` Skill 提供同一套工作流，并在原生工具不可用时回退到 CLI。详细接口见[开发文档](docs/development.md#agent-与开发者入口)。

<!-- catalog:start -->
## Explore plugins by category

Discover **1700 community plugins** across 11 categories. Each category highlights five plugins; open the category to search and browse the complete list.

### agents · 527

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/65215d345547f70ba670d46904e6ac2a655da4f9/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 3 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/057b0f4e10636dd5bbb09cef546d0e47f1090661/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 89324 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/dbbab6fd7610cf1472d0e0377fc0e966faf7acda/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 41178 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 2331 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 2077 | declared |

[View all 527 agents plugins →](https://dshhub.org/?category=agents)

### development · 234

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/057b0f4e10636dd5bbb09cef546d0e47f1090661/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 89324 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 2331 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 2077 | declared |
| [@agentrq/dsh-plugin-agentrq](https://github.com/agentrq/agentrq/tree/f3ce8eec13e1909719ad86819ddaa24916bc86eb/plugins/deepseek-harness) | AgentRQ task manager for DeepSeek Harness: create, manage, and auto-pull AgentRQ tasks without leaving the harness | ★ 1081 | declared |
| [@huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui: an interactive terminal UI plugin for the official DeepSeek Harness — streaming markdown/tool cards, 16+ themes, slash commands, session tabs,… | ★ 220 | declared |

[View all 234 development plugins →](https://dshhub.org/?category=development)

### finance · 61

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui: an interactive terminal UI plugin for the official DeepSeek Harness — streaming markdown/tool cards, 16+ themes, slash commands, session tabs,… | ★ 220 | declared |
| [dsh-web-billing](https://github.com/bpc-oss/dsh-web-billing) | RMB/USD token-billing plugin for DSH web: official-policy auto pricing (incl. peak/off-peak), full coding-plan billing by provider routing, Settings→Cost summa… | ★ 11 | declared |
| [dsh-deepseek-usage](https://github.com/mmzm0808/dsh-deepseek-usage) | DeepSeek API 用量监测：侧边栏悬浮球 + 展开面板，展示真实余额、当日 Tokens、分模型用量与预估消费。 | ★ 9 | declared |
| [@dsh-external/dsh-route-boost](https://github.com/SeaOf0/dsh-redteam-model/tree/94d5e25b2b834a3f5cb611556859e6cb86389f3e/plugins/dsh-route-boost) | DSH host-plane route booster for the nine security presets: infers the current (mode, phase) from the latest user message (sticky phase memory) and re-injects… | ★ 5 | declared |
| [dsh-calculator](https://github.com/bobcat848/dsh-calculator) | DeepSeek Harness web plugin: DeepSeek API spend (per session / all sessions) and account balance in a top-right overlay card. Only deepseek-official routes are… | ★ 5 | declared |

[View all 61 finance plugins →](https://dshhub.org/?category=finance)

### integrations · 166

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/dbbab6fd7610cf1472d0e0377fc0e966faf7acda/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 41178 | declared |
| [@agentrq/dsh-plugin-agentrq](https://github.com/agentrq/agentrq/tree/f3ce8eec13e1909719ad86819ddaa24916bc86eb/plugins/deepseek-harness) | AgentRQ task manager for DeepSeek Harness: create, manage, and auto-pull AgentRQ tasks without leaving the harness | ★ 1081 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 751 | declared |
| [dsh-pocket](https://github.com/shaobeichen/dsh-pocket) | 把 DeepSeek Harness 装进你的口袋：一个包、一个设置页，手机扫码即同步访问电脑上的 DSH（局域网 + 公网，实时同屏）。 | ★ 222 | declared |
| [dsh-code-review](https://github.com/Dominic789654/awesome-deepseek-harness/tree/ee8a6299b17cb0e39da085f8adc19004c4a1cff1/plugins/dsh-code-review) | Code review assistant for DeepSeek Harness: code_review_context collects deterministic git diff context; a bundled skill drives the review checklist. | ★ 159 | declared |

[View all 166 integrations plugins →](https://dshhub.org/?category=integrations)

### interface · 348

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/057b0f4e10636dd5bbb09cef546d0e47f1090661/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 89324 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 2331 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 2077 | declared |
| [@agentrq/dsh-plugin-agentrq](https://github.com/agentrq/agentrq/tree/f3ce8eec13e1909719ad86819ddaa24916bc86eb/plugins/deepseek-harness) | AgentRQ task manager for DeepSeek Harness: create, manage, and auto-pull AgentRQ tasks without leaving the harness | ★ 1081 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 751 | declared |

[View all 348 interface plugins →](https://dshhub.org/?category=interface)

### memory · 78

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-mnemon](https://github.com/omdsh-dev/dsh-mnemon) | Three-tier memory control plane for DeepSeek Harness: persistent runtime context, searchable project documents, pluggable long-term memory, smart routing, supe… | ★ 123 | declared |
| [@modusensus/dsh-mneme](https://github.com/modusensus/dsh-mneme) | Structured memory engine for DeepSeek Harness. Offline semantic search, entity-attribute-timeline, autoDream self-consolidation, and human-editable Markdown st… | ★ 27 | declared |
| [@raullenchai/dsh-provider](https://github.com/raullenchai/rapid-mlx-dsh-provider) | Native Rapid-MLX provider for DeepSeek Harness — teaches DSH what the local server already knows (memory-fitted context via max_model_len), plus model-manageme… | ★ 19 | declared |
| [dsh-archived-sessions](https://github.com/Zephyr-vibe/dsh-archived-sessions) | DSH web plugin: an Archived Sessions manager in Settings — browse archived conversations, expand per-session details (disk usage, downloads, tool usage, lineag… | ★ 16 | declared |
| [dsh-continual-evolve](https://github.com/ZK-Andy/dsh-continual-evolve) | Continual self-evolution plugin for DeepSeek Harness: versioned, auditable, rollback-safe harness state (prompt notes, memories, skills, subagent specs) refine… | ★ 14 | declared |

[View all 78 memory plugins →](https://dshhub.org/?category=memory)

### notifications · 47

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-im-gateway](https://github.com/zhuiyueya/dsh-im-gateway) | 聚合 IM 网关插件（DeepSeek Harness）：把 dsh agent 接入微信、飞书、钉钉、企业微信、QQ、Telegram、Discord、Slack、WhatsApp 等 25+ 渠道，统一会话路由、审批桥、交互提问、定时提醒、白名单与扫码接入。 | ★ 30 | declared |
| [dsh-lark-bot](https://github.com/PlutoKeating/dsh-lark-bot) | 把 DeepSeek Harness (dsh) 装进飞书/Lark 的 bot，扫码即用：流式卡片、项目工作区、并行任务、多角色 Agent、安全网守护。\| Bridge DeepSeek Harness (dsh) into Feishu / Lark, scan-to-connect: streaming c… | ★ 22 | declared |
| [@just-genius/dsh-desktop-update](https://github.com/JustGenius-s/DSH-Plugs/tree/5db59cb42e0c0b4697aa1091891ba9d99e515585/plugins/dsh-desktop-update) | Desktop update plugin for DSH-Desktop: sidebar badge plus native seats and notifications via window.dshDesktop (updates / seats / notify) | ★ 6 | declared |
| [dsh-telegram-relay](https://github.com/congchuanling-dot/DSH-Telegram-Relay) | A DeepSeek Harness plugin bundle for Telegram relay integration. | ★ 6 | declared |
| [@dsh-external/dsh-refusal-guard](https://github.com/SeaOf0/dsh-redteam-model/tree/94d5e25b2b834a3f5cb611556859e6cb86389f3e/plugins/dsh-refusal-guard) | DSH host-plane refusal-repair proximity injection for the five security presets: watches assistant turn text on session/event, detects refusal/moralizing patte… | ★ 5 | declared |

[View all 47 notifications plugins →](https://dshhub.org/?category=notifications)

### other · 658

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dshmarket](https://github.com/dsh-market/dsh-market) | Visual plugin market inside DeepSeek Harness — browse, search, and one-click install community plugins. · DSH 可视化插件市场：逛一逛，点一下，装好。 | ★ 1245 | declared |
| [@cocofhu/anime-find](https://github.com/cocofhu/anime-find) | DeepSeek Harness 插件：对话内多源搜番，卡片详情、磁力复制与规则流媒体在线播放 | ★ 152 | declared |
| [dsh-plugin-liang-calibrator](https://github.com/BruzWJ/Liang-Saint-Slider) | 滑动变祖器 — the liang-intensity-calibrator as the DeepSeek Harness model + thinking-effort slider. Clicking the composer's model seat opens the 31-level calibrator… | ★ 89 | declared |
| [dsh-skin-market](https://github.com/kingOfSoySauce/dsh-skin-market) | Native skin marketplace and lifecycle manager for DeepSeek Harness | ★ 49 | declared |
| [dsh-codex-connect](https://github.com/franksong2702/dsh-codex-connect) | ChatGPT OAuth and Codex models for DeepSeek Harness. | ★ 30 | declared |

[View all 658 other plugins →](https://dshhub.org/?category=other)

### productivity · 304

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/dbbab6fd7610cf1472d0e0377fc0e966faf7acda/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 41178 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 2331 | declared |
| [@agentrq/dsh-plugin-agentrq](https://github.com/agentrq/agentrq/tree/f3ce8eec13e1909719ad86819ddaa24916bc86eb/plugins/deepseek-harness) | AgentRQ task manager for DeepSeek Harness: create, manage, and auto-pull AgentRQ tasks without leaving the harness | ★ 1081 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 751 | declared |
| [@huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui: an interactive terminal UI plugin for the official DeepSeek Harness — streaming markdown/tool cards, 16+ themes, slash commands, session tabs,… | ★ 220 | declared |

[View all 304 productivity plugins →](https://dshhub.org/?category=productivity)

### skills · 299

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/65215d345547f70ba670d46904e6ac2a655da4f9/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 3 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/057b0f4e10636dd5bbb09cef546d0e47f1090661/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 89324 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/dbbab6fd7610cf1472d0e0377fc0e966faf7acda/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 41178 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 751 | declared |
| [@omdsh-dev/dsh-genui](https://github.com/omdsh-dev/dsh-genui) | GenUI for DeepSeek Harness: interactive UI components rendered inline in assistant replies via the ```dsh-ui fence — layout, charts, plots, forms, quizzes, mer… | ★ 250 | declared |

[View all 299 skills plugins →](https://dshhub.org/?category=skills)

### vision · 97

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | Eyes for text-only DeepSeek Harness agents: built-in free vision chain (no key) + pixel-level vision tools (Q&A, grounding, crop, pixel diff, colors, OCR, SVG… | ★ 845 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 751 | declared |
| [dsh-image-gen](https://github.com/shanliuling/dsh-image-gen) | Bring ChatGPT-like image generation to DeepSeek Harness — Gemini, OpenAI, Seedream & more. | ★ 79 | declared |
| [@zseven-w/dsh-crew](https://github.com/ZSeven-W/dsh-crew) | DeepSeek Harness plugin: dispatch work to DSH agents from Claude Code / Codex, as native subagents with live progress | ★ 61 | declared |
| [picturereader](https://github.com/jing-hy/picturereader) | Unified image understanding plugin for DeepSeek Harness (DSH). Visual twin adapter for native thumbnails + auto-analysis on any text-only model (incl. pi-ai pr… | ★ 26 | declared |

[View all 97 vision plugins →](https://dshhub.org/?category=vision)

<sub>Catalog snapshot `2026-08-20T01:54:02.418Z-c4bb7c1251d1`, generated 2026-08-20T01:54:02.418Z.</sub>
<!-- catalog:end -->

## 提交插件

访问 [DSH Hub](https://dshhub.org)，点击页面右上角的 **Submit plugin**，填写 GitHub 仓库地址。目录服务会检查仓库结构、安装信息和文档，并在后续目录更新中收录符合条件的插件。

## 开发与贡献

本地开发、项目结构、Cloudflare 资源和校验命令见[开发文档](docs/development.md)。插件发现、分类、翻译和发布流程见 [Catalog pipeline](docs/catalog-pipeline.md)。

欢迎通过 Issue 或 Pull Request 改进目录、搜索体验和插件生态。
