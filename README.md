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

Discover **768 community plugins** across 11 categories. Each category highlights five plugins; open the category to search and browse the complete list.

### agents · 307

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/c3c80405693d4edbc341315cb5143be36f7a8b31/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 1 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [@linxin666/dsh-ssh](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-ssh) | Remote SSH operations for the dsh web GUI: host config store (~/.dsh/dsh-ssh.json, import from ~/.ssh/config), a persistent ssh2 connection pool with jump-host… | ★ 514 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 387 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 202 | declared |

[View all 307 agents plugins →](https://dshhub.org/?category=agents)

### development · 171

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [@linxin666/dsh-client-ui-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-aionui-panel) | DSH web GUI right-panel system: a pixel-faithful re-implementation of AionUi's Explorer + Preview columns (file tree, filename search, git changes, multi-tab p… | ★ 514 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 387 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 202 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 129 | declared |

[View all 171 development plugins →](https://dshhub.org/?category=development)

### finance · 44

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-usage-plugin](https://github.com/Yihong89/dsh-usage-plugin/tree/c6b4cb340422fca2f18be4f0884c98383683bb8d/packages/usage-report) | DeepSeek Harness plugin: per-session token usage and estimated cost report (/usage command + usage_report tool + live cost in the web composer dock), priced fr… | ★ 2 | declared |
| [@deepseek-ai/dsh-client-ui-billing](https://github.com/WilliamLIiii/DeepSeek-Harness-billing-plugin/tree/7ab1dae615afbd72a7bcf503c17a0291ddc55477/packages/ui-billing) | Session-header DeepSeek account balance badge over the billing Remote | ★ 2 | declared |
| [context-vista](https://github.com/GooodWei/context-vista) | A live context-window donut for DeepSeek Harness: token usage, compaction savings, and cost at a glance | ★ 2 | declared |
| [dsh-cost](https://github.com/GiantGKL/dsh-cost) | DeepSeek Harness (DSH) plugin: live conversation cost and DeepSeek account balance in the composer stats row — RMB in Chinese UI, USD in English UI | ★ 2 | declared |
| [dsh-usage-dashboard](https://github.com/1690834643/dsh-usage-dashboard) | DeepSeek Harness (dsh) web plugin: API balance + today's spend widget in the sidebar footer. /api/dsh-usage route + React client bundle, no build step required. | ★ 2 | declared |

[View all 44 finance plugins →](https://dshhub.org/?category=finance)

### integrations · 126

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@linxin666/dsh-client-ui-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-aionui-panel) | DSH web GUI right-panel system: a pixel-faithful re-implementation of AionUi's Explorer + Preview columns (file tree, filename search, git changes, multi-tab p… | ★ 514 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [dsh-code-review](https://github.com/Dominic789654/awesome-deepseek-harness/tree/986e7fb75e52402afe475d38527a83aebb14e2f2/plugins/dsh-code-review) | Code review assistant for DeepSeek Harness: code_review_context collects deterministic git diff context; a bundled skill drives the review checklist. | ★ 10 | declared |
| [@loserfox/telegram](https://github.com/LoserFox/telegram) | Telegram Bot API bridge plugin: relay Telegram chats to harness agent sessions (long polling, per-chat sessions, HTML formatting) | ★ 6 | declared |
| [@orbisapp/remote-dsh](https://github.com/icodesign/orbis/tree/a1615a283a1fa8eeb08c0bd5c0c91e579f0fa730/packages/orbis-remote-dsh) | Orbis remote plugin for DeepSeek Harness | ★ 5 | declared |

[View all 126 integrations plugins →](https://dshhub.org/?category=integrations)

### interface · 160

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [@linxin666/dsh-client-ui-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-aionui-panel) | DSH web GUI right-panel system: a pixel-faithful re-implementation of AionUi's Explorer + Preview columns (file tree, filename search, git changes, multi-tab p… | ★ 514 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 387 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 202 | declared |
| [@dsh-external/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | DSH ad-infestation plugin: localized Chinese portal ads and English scam-ad parody, with fake pop-ups, a jackpot wheel, rewarded inference ads, and fake-game a… | ★ 163 | declared |

[View all 160 interface plugins →](https://dshhub.org/?category=interface)

### memory · 43

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@mstar-harness/dsh](https://github.com/btspoony/mstar-harness/tree/fb2f6ba496ad38e9d578c0a7395450e4179a106b/packages/dsh) | Morning Star harness dsh (DeepSeek Harness) cordis function plugin — in-process engine gates (status/dispatch/lease) with hard refusal channels. | ★ 39 | declared |
| [resanity](https://github.com/Thhoho/reSanity) | reSanity 散修：散户研究心法 skill + DeepSeek Harness 插件（skill provider、锚体检定时提醒、/resanity-check 命令） | ★ 4 | declared |
| [@graycode/dsh-plugin](https://github.com/Komeiji-Shiki/graycode-for-dsh/tree/a697a6f42be82786842fb1965763807dda8e3f9a/packages/plugin) | GrayCode host plugin for DeepSeek Harness: workflows, permanent memory, and workspace checkpoints | ★ 3 | declared |
| [@deepseek-ai/dsh-tool-diff](https://github.com/omdsh-dev/dsh-tool-diff) | DSH diff tool: structured comparison of text/JSON/CSV/Markdown plus unified diff generation and in-memory patch validation. Zero-dependency, read-only. | ★ 2 | declared |
| [dsh-plugin-claude-bridge](https://github.com/YYTbit/dsh-plugin-claude-bridge) | Bridge Claude Code's memory, skills, and configuration into DeepSeek Harness — zero migration, full compatibility | ★ 2 | declared |

[View all 43 memory plugins →](https://dshhub.org/?category=memory)

### notifications · 23

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-notification](https://github.com/omdsh-dev/dsh-notification) | Browser desktop notifications when the DeepSeek Harness finishes a turn: configurable per-outcome toggles and include/exclude keyword rules, shown through the… | ★ 25 | declared |
| [resanity](https://github.com/Thhoho/reSanity) | reSanity 散修：散户研究心法 skill + DeepSeek Harness 插件（skill provider、锚体检定时提醒、/resanity-check 命令） | ★ 4 | declared |
| [dsh-telegram-relay](https://github.com/congchuanling-dot/DSH-Telegram-Relay) | A DeepSeek Harness plugin bundle for Telegram relay integration. | ★ 3 | declared |
| [@deepseek-ai/dsh-client-ui-billing](https://github.com/WilliamLIiii/DeepSeek-Harness-billing-plugin/tree/7ab1dae615afbd72a7bcf503c17a0291ddc55477/packages/ui-billing) | Session-header DeepSeek account balance badge over the billing Remote | ★ 2 | declared |
| [dsh-plugin-usage-dashboard](https://github.com/hnmrxz/dsh-plugin-usage-dashboard) | DeepSeek usage & cost dashboard for the DeepSeek Harness bottom status bar: token/cost aggregation per session, budget alert, and a balance guard. | ★ 1 | declared |

[View all 23 notifications plugins →](https://dshhub.org/?category=notifications)

### other · 145

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@zseven-w/dsh-openpencil](https://github.com/ZSeven-W/dsh-openpencil) | OpenPencil plugin for DSH with exact multi-frame previews, an interactive canvas, and managed editor workbenches. | ★ 34 | declared |
| [dsh-interconnect](https://github.com/Chinesezjc/dsh-interconnect) | Cross-instance message/event handoff plugins for DeepSeek Harness (DSH): interconnect service + model-facing tools | ★ 15 | declared |
| [@deepseek-ai/dsh-plugin-check](https://github.com/omdsh-dev/dsh-plugin-check) | DSH plugin health checker: scan plugin repos for manifest protocol / patch format / build pitfalls / hub registration, zero-dependency read-only diagnostics | ★ 11 | declared |
| [@deepseek-ai/dsh-toolkit](https://github.com/omdsh-dev/dsh-toolkit) | DSH zero-dependency toolkit collection: time / encoding / json / calculator / csv / regex / markdown / diff / stat / schema in one entry point | ★ 10 | declared |
| [dsh-stock-market](https://github.com/AnacondaKC/dsh-stock-market) | DSH Shanghai and Shenzhen A-share market plugin | ★ 5 | declared |

[View all 145 other plugins →](https://dshhub.org/?category=other)

### productivity · 187

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@linxin666/dsh-client-ui-git-graph](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-git-graph) | External dsh web GUI plugin: a git branch selector + Git graph in the conversation header's context hole (beside the official workspace selector), with real ho… | ★ 514 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 129 | declared |
| [@dsh-external/dsh-visualize](https://github.com/Nagi-ovo/dsh-visualize) | DSH inline visualization plugin: a visualize tool + bundled skill let the model render interactive HTML fragments as sandboxed cards in the conversation (Codex… | ★ 44 | declared |
| [@mstar-harness/dsh](https://github.com/btspoony/mstar-harness/tree/fb2f6ba496ad38e9d578c0a7395450e4179a106b/packages/dsh) | Morning Star harness dsh (DeepSeek Harness) cordis function plugin — in-process engine gates (status/dispatch/lease) with hard refusal channels. | ★ 39 | declared |

[View all 187 productivity plugins →](https://dshhub.org/?category=productivity)

### skills · 90

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/c3c80405693d4edbc341315cb5143be36f7a8b31/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 1 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [@dsh-external/dsh-visualize](https://github.com/Nagi-ovo/dsh-visualize) | DSH inline visualization plugin: a visualize tool + bundled skill let the model render interactive HTML fragments as sandboxed cards in the conversation (Codex… | ★ 44 | declared |
| [@mstar-harness/dsh](https://github.com/btspoony/mstar-harness/tree/fb2f6ba496ad38e9d578c0a7395450e4179a106b/packages/dsh) | Morning Star harness dsh (DeepSeek Harness) cordis function plugin — in-process engine gates (status/dispatch/lease) with hard refusal channels. | ★ 39 | declared |

[View all 90 skills plugins →](https://dshhub.org/?category=skills)

### vision · 57

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dsh-external/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | DSH ad-infestation plugin: localized Chinese portal ads and English scam-ad parody, with fake pop-ups, a jackpot wheel, rewarded inference ads, and fake-game a… | ★ 163 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [deepseek-harness-wecom](https://github.com/sliverp/DeepSeek-harness-wecom) | WeCom AI Bot text, image, and file channel bridge for DeepSeek Harness | ★ 3 | declared |
| [dsh-expression](https://github.com/yyh-001/dsh-expression) | selfloom 表情包层作为 DeepSeek Harness 插件:直接读 selfloom 表情包库(SQLite 索引 + 图片),bigram Dice 搜索,经 QQ 通道或 Web 对话发图;设置页内置管理面板。 | ★ 2 | declared |
| [@lhmd/dsh-director-toolkit](https://github.com/lhmd/dsh-director-toolkit) | DeepSeek Harness plugin that turns a 3D idea into a shootable scene brief and publish-ready showcase copy. | ★ 2 | declared |

[View all 57 vision plugins →](https://dshhub.org/?category=vision)

<sub>Catalog snapshot `2026-08-14T06:44:58.566Z-3a7a140cf26b`, generated 2026-08-14T06:44:58.566Z.</sub>
<!-- catalog:end -->

## 提交插件

访问 [DSH Hub](https://dshhub.org)，点击页面右上角的 **Submit plugin**，填写 GitHub 仓库地址。目录服务会检查仓库结构、安装信息和文档，并在后续目录更新中收录符合条件的插件。

## 开发与贡献

本地开发、项目结构、Cloudflare 资源和校验命令见[开发文档](docs/development.md)。插件发现、分类、翻译和发布流程见 [Catalog pipeline](docs/catalog-pipeline.md)。

欢迎通过 Issue 或 Pull Request 改进目录、搜索体验和插件生态。
