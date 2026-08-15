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

Discover **2576 community plugins** across 11 categories. Each category highlights five plugins; open the category to search and browse the complete list.

### agents · 884

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/c3c80405693d4edbc341315cb5143be36f7a8b31/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 1 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [aegis](https://github.com/GanyuanRan/Aegis) | Make AI coding agents architecture-aware: baseline-first, evidence-verified, drift-checked, and safe across long tasks. | ★ 1002 | declared |
| [@linxin666/dsh-ssh](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-ssh) | Remote SSH operations for the dsh web GUI: host config store (~/.dsh/dsh-ssh.json, import from ~/.ssh/config), a persistent ssh2 connection pool with jump-host… | ★ 514 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 387 | declared |

[View all 884 agents plugins →](https://dshhub.org/?category=agents)

### development · 470

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [aegis](https://github.com/GanyuanRan/Aegis) | Make AI coding agents architecture-aware: baseline-first, evidence-verified, drift-checked, and safe across long tasks. | ★ 1002 | declared |
| [@linxin666/dsh-client-ui-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-aionui-panel) | DSH web GUI right-panel system: a pixel-faithful re-implementation of AionUi's Explorer + Preview columns (file tree, filename search, git changes, multi-tab p… | ★ 514 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 387 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 202 | declared |

[View all 470 development plugins →](https://dshhub.org/?category=development)

### finance · 151

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@pinkbanana/dsh-balance](https://github.com/crazywoola/dsh-balance) | DeepSeek Harness plugin that shows API balances and available models in Settings | ★ 9 | declared |
| [dsh-plugin-deepseek-balance](https://github.com/hnmrxz/dsh-plugin-deepseek-balance) | Real-time DeepSeek account balance in the DSH bottom status bar (composer dock). | ★ 5 | declared |
| [dsh-balance-plugin](https://github.com/stevenx65/dsh-balance-plugin) | DeepSeek API balance and token usage monitor for the dsh web sidebar | ★ 4 | declared |
| [deepseek-harness-external-migration](https://github.com/buguoshixc/deepseek-harness-external-migration) | Safely migrate Codex, Claude Code, Qoder and OpenCode configuration and sessions into DeepSeek Harness. | ★ 3 | declared |
| [@deepforce/dsh-balance](https://github.com/deepforce/dsh-balance) | DeepSeek account balance: /balance command plus a composer-dock readout in the web GUI | ★ 2 | declared |

[View all 151 finance plugins →](https://dshhub.org/?category=finance)

### integrations · 328

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@linxin666/dsh-client-ui-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-aionui-panel) | DSH web GUI right-panel system: a pixel-faithful re-implementation of AionUi's Explorer + Preview columns (file tree, filename search, git changes, multi-tab p… | ★ 514 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [@deepseek-ai/dsh-product-bridge](https://github.com/vibeinging/deepseek-harness-desktop-app/tree/a7cfa02b2937730fd3e3d75b97524550afa957f7/packages/dsh-product-bridge) | Session-scoped DeepSeek Harness Desktop App capabilities for the current DSH Web profile | ★ 111 | declared |
| [@multica-ai/dsh-runtime](https://github.com/multica-ai/dsh-multica-runtime) | Private DeepSeek Harness runtime bridge for Multica | ★ 30 | declared |
| [@deepseek-ai/dsh-product-bridge](https://github.com/vibeinging/dsh-work/tree/b4c477d554e8f9fbeed212c84d7cf45b043493a8/packages/dsh-product-bridge) | Session-scoped dsh-work product capabilities for the current DSH Web profile | ★ 25 | declared |

[View all 328 integrations plugins →](https://dshhub.org/?category=integrations)

### interface · 677

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [@linxin666/dsh-client-ui-aionui-panel](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-aionui-panel) | DSH web GUI right-panel system: a pixel-faithful re-implementation of AionUi's Explorer + Preview columns (file tree, filename search, git changes, multi-tab p… | ★ 514 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-TUI) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 387 | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | Claude Code style interactive TUI front door for DeepSeek Harness agents, built on the ported Ink core. | ★ 202 | declared |
| [@dsh-external/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | DSH ad-infestation plugin: localized Chinese portal ads and English scam-ad parody, with fake pop-ups, a jackpot wheel, rewarded inference ads, and fake-game a… | ★ 163 | declared |

[View all 677 interface plugins →](https://dshhub.org/?category=interface)

### memory · 165

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@mstar-harness/dsh](https://github.com/btspoony/mstar-harness/tree/fb2f6ba496ad38e9d578c0a7395450e4179a106b/packages/dsh) | Morning Star harness dsh (DeepSeek Harness) cordis function plugin — in-process engine gates (status/dispatch/lease) with hard refusal channels. | ★ 39 | declared |
| [powercontext-dsh](https://github.com/knqiufan/powercontext-dsh) | DeepSeek Harness plugin that connects to a PowerContext Server over HTTP for recall, memory, handoff, experience, and skills. | ★ 8 | declared |
| [@graycode/dsh-plugin](https://github.com/GrayCodeTeam/graycode-for-dsh/tree/4c71da7f553a3bef025315e24a2bd0e985d17bac/packages/plugin) | GrayCode host plugin for DeepSeek Harness: workflows, permanent memory, and workspace checkpoints | ★ 5 | declared |
| [dsh-archived-sessions](https://github.com/Zephyr-vibe/dsh-archived-sessions) | DSH web plugin: an Archived Sessions manager in Settings — browse archived conversations, expand per-session details (disk usage, downloads, tool usage, lineag… | ★ 4 | declared |
| [resanity](https://github.com/Thhoho/reSanity) | reSanity 散修：散户研究心法 skill + DeepSeek Harness 插件（skill provider、锚体检定时提醒、/resanity-check 命令） | ★ 4 | declared |

[View all 165 memory plugins →](https://dshhub.org/?category=memory)

### notifications · 84

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [dsh-notification](https://github.com/omdsh-dev/dsh-notification) | Browser desktop notifications when the DeepSeek Harness finishes a turn: configurable per-outcome toggles and include/exclude keyword rules, shown through the… | ★ 25 | declared |
| [resanity](https://github.com/Thhoho/reSanity) | reSanity 散修：散户研究心法 skill + DeepSeek Harness 插件（skill provider、锚体检定时提醒、/resanity-check 命令） | ★ 4 | declared |
| [@lyhalal/dsh-notification-center](https://github.com/610la/dsh-notification-center) | 通知中心：对话/任务完成、报错、等待批准等事件触发浏览器通知 + 21 种匹配音效，每类事件独立配置（音效/文件/URL/音量/开关）。 | ★ 3 | declared |
| [dsh-telegram-relay](https://github.com/congchuanling-dot/DSH-Telegram-Relay) | A DeepSeek Harness plugin bundle for Telegram relay integration. | ★ 3 | declared |
| [@deepseek-ai/dsh-pet-maid](https://github.com/skylar-fei/dsh-wechat-maid/tree/957394fd646c1c1e78bc55c1c03d27302be306f1/packages/dsh-pet-maid) | deepseek 娘桌宠插件 for the dsh web GUI: a cute desktop pet that reacts to model activity (idle/waiting/thinking/tool/done), with petting/feeding interactions and a… | ★ 2 | declared |

[View all 84 notifications plugins →](https://dshhub.org/?category=notifications)

### other · 492

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@zseven-w/dsh-openpencil](https://github.com/ZSeven-W/dsh-openpencil) | OpenPencil plugin for DSH with exact multi-frame previews, an interactive canvas, and managed editor workbenches. | ★ 34 | declared |
| [dsh-toy](https://github.com/c3ll256/dsh-toy) | DeepSeek Harness plugin for safety-bounded Buttplug/Intiface and MonsterParty toy control | ★ 24 | declared |
| [dsh-interconnect](https://github.com/Chinesezjc/dsh-interconnect) | Cross-instance message/event handoff plugins for DeepSeek Harness (DSH): interconnect service + model-facing tools | ★ 15 | declared |
| [@yejiming/dsh-gomoku](https://github.com/omdsh-dev/dsh-gomoku) | Gomoku (five-in-a-row) for the dsh web GUI: AI move routes, model catalog, and default prompt (node half) plus the conversation-view tab with the board (browse… | ★ 13 | declared |
| [@dsh-scholar/research-plugin](https://github.com/lzszq/dsh-scholar) | DSH Research OS — a fully automated scientific research plugin for DSH (DeepSeek Harness): survey, idea, experiment contract, durable runner jobs, claim-eviden… | ★ 11 | declared |

[View all 492 other plugins →](https://dshhub.org/?category=other)

### productivity · 630

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@linxin666/dsh-client-ui-git-graph](https://github.com/zhu1090093659/dsh-web-ui/tree/ef3ef0dbcb057135c41bcd2b9b5cf85cfb3716e8/packages/dsh-git-graph) | External dsh web GUI plugin: a git branch selector + Git graph in the conversation header's context hole (beside the official workspace selector), with real ho… | ★ 514 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH web plugin: a VSCode-like right sidebar (explorer / editor / terminal / git / browser), isolated per conversation session. Exposes a service for other plug… | ★ 129 | declared |
| [@deepseek-ai/dsh-product-bridge](https://github.com/vibeinging/deepseek-harness-desktop-app/tree/a7cfa02b2937730fd3e3d75b97524550afa957f7/packages/dsh-product-bridge) | Session-scoped DeepSeek Harness Desktop App capabilities for the current DSH Web profile | ★ 111 | declared |
| [@dsh-external/dsh-visualize](https://github.com/Nagi-ovo/dsh-visualize) | DSH inline visualization plugin: a visualize tool + bundled skill let the model render interactive HTML fragments as sandboxed cards in the conversation (Codex… | ★ 44 | declared |

[View all 630 productivity plugins →](https://dshhub.org/?category=productivity)

### skills · 243

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/c3c80405693d4edbc341315cb5143be36f7a8b31/packages/dsh-plugin) | DeepSeek Harness tools for finding and inspecting plugins in the dshhub catalog | ★ 1 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/eea8a8522dfc10951ff3e3575488c83ffcad8a33/packages/dsh-runtime) | DeepSeek Harness profile runtime for Open Design | ★ 85660 | declared |
| [aegis](https://github.com/GanyuanRan/Aegis) | Make AI coding agents architecture-aware: baseline-first, evidence-verified, drift-checked, and safe across long tasks. | ★ 1002 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [@dsh-external/dsh-visualize](https://github.com/Nagi-ovo/dsh-visualize) | DSH inline visualization plugin: a visualize tool + bundled skill let the model render interactive HTML fragments as sandboxed cards in the conversation (Codex… | ★ 44 | declared |

[View all 243 skills plugins →](https://dshhub.org/?category=skills)

### vision · 210

| Plugin | Description | Stars | Evidence |
| --- | --- | ---: | --- |
| [@dsh-external/dsh-ads](https://github.com/Nagi-ovo/dsh-ads) | DSH ad-infestation plugin: localized Chinese portal ads and English scam-ad parody, with fake pop-ups, a jackpot wheel, rewarded inference ads, and fake-game a… | ★ 163 | declared |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, OCR, grounding, UI restoration, pixel diff, Artifacts, and Web UI. | ★ 153 | declared |
| [@dsh-external/dsh-share](https://github.com/hellodigua/dsh-share) | Share a DSH conversation turn as a PNG image. | ★ 14 | declared |
| [@linenxi-ctrl/dsh-vision](https://github.com/linenxi-ctrl/dsh-vision) | 为 DeepSeek Harness 提供外挂识图模型：网页配置面板、发送图片识图自动回传、模型自主截图识图工具，支持多协议与一键安装。 | ★ 9 | declared |
| [@dsh-external/dsh-drop-to-path](https://github.com/loudMore/dsh-drop-to-path) | Drop or paste images, PDFs, office docs, zips, videos and audio into the DSH composer as workspace file paths instead of model attachments — lets a text-only m… | ★ 6 | declared |

[View all 210 vision plugins →](https://dshhub.org/?category=vision)

<sub>Catalog snapshot `2026-08-15T10:42:20.985Z-196d052482bd`, generated 2026-08-15T10:42:20.985Z.</sub>
<!-- catalog:end -->

## 提交插件

访问 [DSH Hub](https://dshhub.org)，点击页面右上角的 **Submit plugin**，填写 GitHub 仓库地址。目录服务会检查仓库结构、安装信息和文档，并在后续目录更新中收录符合条件的插件。

## 开发与贡献

本地开发、项目结构、Cloudflare 资源和校验命令见[开发文档](docs/development.md)。插件发现、分类、翻译和发布流程见 [Catalog pipeline](docs/catalog-pipeline.md)。

欢迎通过 Issue 或 Pull Request 改进目录、搜索体验和插件生态。
