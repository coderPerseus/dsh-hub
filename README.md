<div align="center">

# DSH Hub

**Discover, compare, and install DeepSeek Harness community plugins.**

**English** | [简体中文](README.zh-CN.md)

[Browse plugins](https://dshhub.org/en/) · [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/guide/quickstart) · [Report an issue](https://github.com/coderPerseus/dsh-hub/issues)

</div>

<a href="https://dshhub.org/en/">
  <img src="docs/assets/dsh-hub-catalog.png" alt="DSH Hub plugin catalog" width="100%" />
</a>

## Overview

DSH Hub is a community catalog for DeepSeek Harness plugins. It discovers installable packages on GitHub and brings their descriptions, compatibility evidence, documentation, and installation commands together in one place.

- Search by keyword, category, stars, recent updates, and compatibility status.
- Compare plugin capabilities and inspect the original repository before installing.
- Access the same static catalog through the website, TypeScript client, CLI, or native Harness tools.
- Submit a repository or report outdated metadata through GitHub Issues.

Catalog discovery and refresh run daily. Repository descriptions remain source-authored; Chinese summaries and AI analysis are generated offline and invalidated when their source changes. Compatibility labels show collected evidence, not a guarantee that a plugin will work in your environment.

## Getting started

### Browse the website

Open [dshhub.org/en](https://dshhub.org/en/), search for a capability, and open a plugin to inspect its documentation and installation command.

### Search from the terminal

The static catalog requires client version 0.2.0. Until the npm release is available, build and run the CLI from this repository:

```bash
git clone https://github.com/coderPerseus/dsh-hub.git
cd dsh-hub
pnpm install --frozen-lockfile
pnpm --filter @dshhubs/cli build
node packages/cli/lib/bin.js search "cross-session memory" --limit 10 --json
node packages/cli/lib/bin.js plugin owner/repository --json
```

Node.js 22+ and pnpm 10.34.5 are required. The old 0.1.0 dynamic API is retired.

### Use with an agent

The native search plugin exposes two read-only tools:

| Tool | Purpose |
| --- | --- |
| `search_dsh_plugins` | Search by capability, category, and compatibility. |
| `get_dsh_plugin` | Inspect documentation, compatibility evidence, and installation commands. |

See the [plugin README](packages/dsh-plugin/README.md) for installation details. Use the 0.2.0 source build until the static-compatible npm release is available. The repository's [find-dsh-plugins skill](skills/find-dsh-plugins/SKILL.md) provides the same workflow with a CLI fallback.

Example request:

> Find a DeepSeek Harness plugin for cross-session memory, compare compatibility, and give me its installation command.

The search tools do not install results automatically.

## Local development

After installing dependencies, restore the public catalog snapshot and start the static preview:

```bash
pnpm --filter @dshhub/web exec tsx ../../scripts/restore-catalog.mts
pnpm dev
```

Open [localhost:3000/en](http://localhost:3000/en/). Production serves pre-rendered HTML and JSON; public requests do not query a database or run AI inference.

| Directory | Responsibility |
| --- | --- |
| `apps/web` | Static website, browser search, and preview server |
| `packages/catalog` | GitHub discovery, qualification, categories, and README generation |
| `packages/client`, `packages/cli` | Static catalog SDK and command-line interface |
| `packages/dsh-plugin` | Native Harness search tools |
| `scripts`, `data` | Catalog builds, offline enrichment, and publishing |
| `apps/api`, `packages/contracts` | Retained legacy API and contracts |

Run focused checks for catalog changes:

```bash
pnpm --filter @dshhub/catalog typecheck
pnpm --filter @dshhub/catalog test
```

For current architecture, snapshot recovery, and deployment, see [Static catalog operations](docs/static-operations.md). [Development notes](docs/development.md) and [Catalog pipeline](docs/catalog-pipeline.md) also contain clearly marked legacy architecture references.

## Contributing

Use **Submit plugin** on the website to open the repository submission form. For an outdated listing, open an [issue](https://github.com/coderPerseus/dsh-hub/issues) with the repository URL, incorrect fields, and current package or README evidence. Maintainers can refresh a single repository without waiting for the rotating catalog refresh.

Pull requests for catalog accuracy, search, documentation, and the plugin ecosystem are welcome. Include the reason for the change and relevant validation.

<details>
<summary>Browse the generated category highlights</summary>

<!-- catalog:start -->
## Explore plugins by category

Discover **14253 community plugins** across 11 categories. Each category highlights five plugins; open the category to search and browse the complete list.

### agents · 4448

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/f36c28b2ab004fe9390ace8907c6ce61238710d1/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 2 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 95736 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 40988 | declared |

[View all 4448 agents plugins →](https://dshhub.org/en/?category=agents)

### development · 2366

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 95736 | declared |
| [dsh-loopx-plugin](https://github.com/huangruiteng/loopx/tree/bfd1ec8db846bca3af47e559aa5fe7e515e57370/packages/dsh-loopx-plugin) | One-step LoopX bootstrap, same-session driver, and local GoalBar for DeepSeek Harness | ★ 5812 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Interactive terminal interface for DeepSeek Harness agents, sessions and tools. | ★ 2985 | declared |
| [@zilliz/memsearch-dsh](https://github.com/zilliztech/memsearch/tree/f863056e0b113d44e860dd6abf5bb892781e29ca/plugins/dsh) | MemSearch plugin for DeepSeek Harness: shared markdown memory across agents, with capture, pre-step context injection, memory-recall skill, and a skill-candida… | ★ 2595 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 1712 | declared |

[View all 2366 development plugins →](https://dshhub.org/en/?category=development)

### finance · 773

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui: an interactive terminal UI plugin for the official DeepSeek Harness — streaming markdown/tool cards, 16+ themes, slash commands, session tabs,… | ★ 274 | declared |
| [@kihara777/dsh-api-balance](https://github.com/Kihara777/NixKits/tree/e5027f4a4466e0d6db9d6502bd33f52b1e9b5465/packages/dsh-api-balance) | API 用量余额插件 for the DeepSeek Harness — 在 webui 原有用量显示旁添加「用量 / 开销」标签切换，切换为「开销」后展示当前 API KEY 的用量信息、账户花费与余额（DeepSeek /user/balance） | ★ 25 | declared |
| [dsh-damage-pulse](https://github.com/wssfk12138/dsh-damage-pulse) | DeepSeek Harness balance monitor with cache-aware damage-number animations for every token charge. | ★ 24 | declared |
| [@feiyang666/dsh-usage-plugin](https://github.com/feiyang-dev/dsh-usage-plugin) | DeepSeek Harness usage & cost tracker plugin: per-call token/cache-hit stats, peak/off-peak billing, DeepSeek balance query, CSV/JSON/PNG export with custom de… | ★ 22 | declared |
| [@pinkbanana/dsh-balance](https://github.com/crazywoola/dsh-balance) | DeepSeek Harness plugin that shows API balances and models in Settings, with balance below the chat composer | ★ 19 | declared |

[View all 773 finance plugins →](https://dshhub.org/en/?category=finance)

### integrations · 1700

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 40988 | declared |
| [@open-pets/dsh](https://github.com/OpenPetsHQ/openpets/tree/39ba8c539b4a628bcfbc94cdbb2ce4e2bdb9f10b/packages/dsh) | Local first, desktop companion platform with animated pets, plugin SDK and coding-agent integrations. | ★ 1156 | declared |
| [@agentrq/dsh-plugin-agentrq](https://github.com/agentrq/agentrq/tree/7ed7a2e9188db919b467d8cecea3118875234190/plugins/deepseek-harness) | AgentRQ task manager for DeepSeek Harness: create, manage, and auto-pull AgentRQ tasks without leaving the harness | ★ 1115 | declared |

[View all 1700 integrations plugins →](https://dshhub.org/en/?category=integrations)

### interface · 3970

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 95736 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Interactive terminal interface for DeepSeek Harness agents, sessions and tools. | ★ 2985 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 1712 | declared |
| [@open-pets/dsh](https://github.com/OpenPetsHQ/openpets/tree/39ba8c539b4a628bcfbc94cdbb2ce4e2bdb9f10b/packages/dsh) | Local first, desktop companion platform with animated pets, plugin SDK and coding-agent integrations. | ★ 1156 | declared |
| [@agentrq/dsh-plugin-agentrq](https://github.com/agentrq/agentrq/tree/7ed7a2e9188db919b467d8cecea3118875234190/plugins/deepseek-harness) | AgentRQ task manager for DeepSeek Harness: create, manage, and auto-pull AgentRQ tasks without leaving the harness | ★ 1115 | declared |

[View all 3970 interface plugins →](https://dshhub.org/en/?category=interface)

### memory · 835

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@agentscope-ai/reme](https://github.com/agentscope-ai/ReMe/tree/01ef1a6efb6e84be29347334b9043ab284e0ca73/packages/typescript) | ReMe client and memory integrations for TypeScript agents | ★ 3339 | declared |
| [@zilliz/memsearch-dsh](https://github.com/zilliztech/memsearch/tree/f863056e0b113d44e860dd6abf5bb892781e29ca/plugins/dsh) | MemSearch plugin for DeepSeek Harness: shared markdown memory across agents, with capture, pre-step context injection, memory-recall skill, and a skill-candida… | ★ 2595 | declared |
| [@mindmemos/deepseek-harness-plugin](https://github.com/mindscale-noah/MindMemOS/tree/0c2fdb1ed41d09c7446f809d00bc11821e96cb24/plugins/deepseek-harness-plugin) | DeepSeek Harness (dsh) plugin that recalls and writes MindMemOS memories through the mindmemos CLI. | ★ 938 | declared |
| [graph-memory](https://github.com/adoresever/graph-memory) | Knowledge graph memory for DeepSeek Harness and OpenClaw — cross-session recall, PageRank, communities, and vector search | ★ 563 | declared |
| [@ningbainb/dsh-memory](https://github.com/ningbainb/deepseek-harness-desktop/tree/f30137e7d72942d2cd851a0fa0713f596ed06ad6/packages/dsh-memory) | Owner-isolated, local-only memory with explicit confirmation and bounded SystemPrompt injection. | ★ 491 | declared |

[View all 835 memory plugins →](https://dshhub.org/en/?category=memory)

### notifications · 551

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-notifier](https://github.com/THEWOLFWALKER/dsh-notifier) | DSH 统一通知推送插件：一个 notify() API 打天下 + 多渠道 adapter；远程审批/远程会话支持 telegram/feishu/qq/wxpusher/wechat/dingtalk 六通道双向回传；移动指挥中心（长任务心跳 / 疑似卡住提醒 / 通知按钮停止任务）；开放事件源（其他插件经 no… | ★ 96 | declared |
| [dsh-notification](https://github.com/omdsh-dev/dsh-notification) | Browser desktop notifications when the DeepSeek Harness finishes a turn: configurable per-outcome toggles and include/exclude keyword rules, shown through the… | ★ 55 | declared |
| [dsh-lark-bot](https://github.com/PlutoKeating/dsh-lark-bot) | Bridge DeepSeek Harness (dsh) into Feishu / Lark with streaming cards, project workspaces, approvals and scheduling | ★ 18 | declared |
| [dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder) | Bottom-right reminder cards for the DeepSeek Harness web GUI: an amber persistent card when an approval waits for you, a green self-dismissing card when a task… | ★ 18 | declared |
| [dsh-ui-tweaks](https://github.com/wlj521/dsh-ui-tweaks) | DSH web plugin: live-tune the conversation UI — code font size (px input), a timeline switch (DSH's native turn rail, or the classic v0.11 web rail: hover to p… | ★ 17 | declared |

[View all 551 notifications plugins →](https://dshhub.org/en/?category=notifications)

### other · 3290

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dshmarket](https://github.com/dsh-market/dsh-market) | Visual plugin market inside DeepSeek Harness — browse, search, and one-click install community plugins. · DSH 可视化插件市场：逛一逛，点一下，装好。 | ★ 637 | declared |
| [anime-find](https://github.com/cocofhu/anime-find) | DeepSeek Harness 插件：对话内多源搜番，卡片详情、磁力复制与规则流媒体在线播放 | ★ 131 | declared |
| [dsh-research-report](https://github.com/PerryLink/dsh-research-report) | Verifiable research-report engine for DeepSeek Harness: a content-addressed evidence ledger (claim ↔ snapshot binding, tamper-evident) plus versioned sealed re… | ★ 94 | declared |
| [@nanmicoder/dsh-auto-mode](https://github.com/NanmiCoder/dsh-auto-mode) | Sandbox-first automatic permission policy for DeepSeek Harness | ★ 74 | declared |
| [dsh-prompt-enhancer](https://github.com/Fishsb/dsh-prompt-enhancer) | DeepSeek Harness (DSH) plugin: one-click prompt enhancement (✨) and voice recognition (💬, cloud/local dual engines) for the composer, plus one-click DSH servi… | ★ 69 | declared |

[View all 3290 other plugins →](https://dshhub.org/en/?category=other)

### productivity · 3573

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 40988 | declared |
| [dsh-loopx-plugin](https://github.com/huangruiteng/loopx/tree/bfd1ec8db846bca3af47e559aa5fe7e515e57370/packages/dsh-loopx-plugin) | One-step LoopX bootstrap, same-session driver, and local GoalBar for DeepSeek Harness | ★ 5812 | declared |
| [@wxg-prc-cpg/browser-skill-dsh-plugin](https://github.com/Tencent/BrowserSkill/tree/72876cc20b1cc4f3a34f9dd8a48b2e7e91f0d08f/packages/dsh-plugin-browserskill) | DeepSeek Harness tool plugin that exposes BrowserSkill browser automation (browser_* tools) to the model | ★ 1957 | declared |

[View all 3573 productivity plugins →](https://dshhub.org/en/?category=productivity)

### skills · 1422

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/f36c28b2ab004fe9390ace8907c6ce61238710d1/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 2 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | DeepSeek Harness profile runtime for OpenDesign | ★ 95736 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | DeepSeek Harness plugin for Reactive Resume: bridges your resumes and job applications into a Harness session over MCP. | ★ 40988 | declared |

[View all 1422 skills plugins →](https://dshhub.org/en/?category=skills)

### vision · 974

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-tongflow](https://github.com/tong-io/tongflow/tree/8d47404f5b4c0027351f0af6ad607aaeeeef7ab2/packages/dsh-tongflow) | TongFlow studio plugin for DeepSeek Harness (dsh): agent-designed project folders, one TongFlow workflow per generated asset stored next to its outputs, determ… | ★ 1020 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 880 | declared |
| [dsh-vision-router](https://github.com/ysr666/dsh-vision-router) | Eyes for text-only DeepSeek Harness agents: built-in free vision chain (no key) + pixel-level vision tools (Q&A, grounding, crop, pixel diff, colors, OCR, SVG… | ★ 469 | declared |
| [dsh-image-gen](https://github.com/shanliuling/dsh-image-gen) | Bring ChatGPT-like image generation to DeepSeek Harness — Gemini, OpenAI, Seedream, DashScope, local ComfyUI & more. | ★ 400 | declared |
| [@dsh-external/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | DSH ad-infestation plugin: localized Chinese portal ads and English scam-ad parody, with fake pop-ups, a jackpot wheel, rewarded inference ads, and fake-game a… | ★ 163 | declared |

[View all 974 vision plugins →](https://dshhub.org/en/?category=vision)

<sub>Catalog snapshot `2026-09-16T08:54:20.870Z-local-develo`, generated 2026-09-16T08:54:20.870Z.</sub>
<!-- catalog:end -->

</details>
