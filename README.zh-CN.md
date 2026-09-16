<div align="center">

# DSH Hub

**发现、比较和安装 DeepSeek Harness 社区插件。**

[English](README.md) | **简体中文**

[浏览插件](https://dshhub.org/zh-CN/) · [DeepSeek Harness](https://deepseek-harness.github.io/deepseek-harness/guide/quickstart) · [反馈问题](https://github.com/coderPerseus/dsh-hub/issues)

</div>

<a href="https://dshhub.org/zh-CN/">
  <img src="docs/assets/dsh-hub-catalog.png" alt="DSH Hub 插件目录" width="100%" />
</a>

## 项目介绍

DSH Hub 是 DeepSeek Harness 社区插件目录。它从 GitHub 发现可安装的插件，集中展示项目说明、兼容性依据、使用文档和安装命令。

- 按关键词、分类、Stars、更新时间和兼容状态搜索插件。
- 比较插件能力，安装前查看原始仓库及使用要求。
- 通过网站、TypeScript 客户端、CLI 或 Harness 原生工具访问同一份静态目录。
- 通过 GitHub Issue 提交仓库或反馈过时信息。

目录每日发现和刷新插件。原始描述来自项目作者；中文简介与 AI 分析根据官方资料离线生成，源内容变化后缓存失效。兼容性标签表示已收集的依据，不保证插件一定能在你的环境运行。

## 快速开始

### 浏览网站

打开 [dshhub.org/zh-CN](https://dshhub.org/zh-CN/)，搜索所需能力，进入详情页查看文档和安装命令。

### 在终端中搜索

静态目录需要 0.2.0 版客户端。在 npm 版本发布前，请从本仓库构建并运行 CLI：

```bash
git clone https://github.com/coderPerseus/dsh-hub.git
cd dsh-hub
pnpm install --frozen-lockfile
pnpm --filter @dshhubs/cli build
node packages/cli/lib/bin.js search "跨会话记忆" --limit 10 --json
node packages/cli/lib/bin.js plugin owner/repository --json
```

需要 Node.js 22+ 和 pnpm 10.34.5。旧版 0.1.0 使用的动态 API 已下线。

### 给 Agent 使用

原生搜索插件提供两个只读工具：

| 工具 | 用途 |
| --- | --- |
| `search_dsh_plugins` | 按能力、分类和兼容状态搜索。 |
| `get_dsh_plugin` | 查看使用文档、兼容性依据和安装命令。 |

安装说明见[插件 README](packages/dsh-plugin/README.md)。支持静态目录的 npm 版本发布前，请使用 0.2.0 源码构建。仓库中的 [find-dsh-plugins Skill](skills/find-dsh-plugins/SKILL.md) 提供相同工作流，并支持回退到 CLI。

可以这样告诉 Agent：

> 帮我找一个能实现跨会话记忆的 DeepSeek Harness 插件，比较兼容性后给出安装命令。

搜索工具不会自动安装搜索结果。

## 本地开发

安装依赖后，恢复公开目录快照并启动静态预览：

```bash
pnpm --filter @dshhub/web exec tsx ../../scripts/restore-catalog.mts
pnpm dev
```

打开 [localhost:3000/zh-CN](http://localhost:3000/zh-CN/)。生产环境提供预生成的 HTML 和 JSON，用户请求不会查询数据库或调用 AI 推理。

| 目录 | 职责 |
| --- | --- |
| `apps/web` | 静态网站、浏览器搜索和预览服务 |
| `packages/catalog` | GitHub 发现、资格校验、分类和 README 生成 |
| `packages/client`、`packages/cli` | 静态目录 SDK 和命令行工具 |
| `packages/dsh-plugin` | Harness 原生搜索工具 |
| `scripts`、`data` | 目录构建、离线内容补充和发布 |
| `apps/api`、`packages/contracts` | 保留的旧 API 与契约 |

目录修改可运行以下针对性检查：

```bash
pnpm --filter @dshhub/catalog typecheck
pnpm --filter @dshhub/catalog test
```

当前架构、快照恢复和部署方式见[静态目录运维文档](docs/static-operations.md)。[开发文档](docs/development.md)与[目录流水线](docs/catalog-pipeline.md)还保留了已标明的旧架构参考。

## 参与贡献

在网站点击 **Submit plugin** 打开仓库提交表单。若已收录信息过时，请提交 [Issue](https://github.com/coderPerseus/dsh-hub/issues)，附上仓库地址、错误字段及当前 package.json 或 README 依据。维护者可以单独刷新该仓库，无需等待全目录轮询。

欢迎通过 Pull Request 改进目录准确性、搜索、文档和插件生态，并说明修改原因与相关验证结果。

<details>
<summary>查看自动生成的分类推荐</summary>

<!-- catalog:start -->
## 按分类探索插件

目录包含 **18623 个社区插件**，覆盖 11 个分类。每类展示五个插件，完整列表请访问网站。

### agents · 6547

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/f36c28b2ab004fe9390ace8907c6ce61238710d1/packages/dsh-plugin) | 用于在 dshhub 目录中查找和检查插件的 DeepSeek Harness 工具 | ★ 2 | declared |
| [@deepseek-ai/dsh-acp](https://github.com/deepseek-ai/deepseek-harness/tree/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/packages/acp/acp) | 仅面向自动化的代理客户端协议服务，经标准输入输出通信。 | ★ 226042 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | 提供基于标准输入输出协议的运行环境 | ★ 95736 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | 通过MCP连接简历与职位申请数据 | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 42449 | declared |

[查看全部 6547 个 agents 插件 →](https://dshhub.org/zh-CN/?category=agents)

### development · 3231

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@deepseek-ai/dsh-api-terminal-controller](https://github.com/deepseek-ai/deepseek-harness/tree/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/packages/api/terminal-controller) | 在会话工作区提供交互终端，含shell发现、屏幕恢复与远程控制。 | ★ 226042 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | 提供基于标准输入输出协议的运行环境 | ★ 95736 | declared |
| [dsh-loopx-plugin](https://github.com/huangruiteng/loopx/tree/bfd1ec8db846bca3af47e559aa5fe7e515e57370/packages/dsh-loopx-plugin) | 一键引导安装LoopX并驱动同会话智能体 | ★ 5812 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | 提供智能体、会话和工具的终端交互界面 | ★ 2985 | declared |
| [@zilliz/memsearch-dsh](https://github.com/zilliztech/memsearch/tree/f863056e0b113d44e860dd6abf5bb892781e29ca/plugins/dsh) | 提供智能体间共享的Markdown记忆与上下文注入 | ★ 2595 | declared |

[查看全部 3231 个 development 插件 →](https://dshhub.org/zh-CN/?category=development)

### finance · 844

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | 提供支持流式Markdown和多主题的终端UI | ★ 274 | declared |
| [@kihara777/dsh-api-balance](https://github.com/Kihara777/NixKits/tree/e5027f4a4466e0d6db9d6502bd33f52b1e9b5465/packages/dsh-api-balance) | API 用量余额插件：在 WebUI 原有用量显示旁添加标签切换，展示当前 API KEY 的用量、花费与余额。 | ★ 25 | declared |
| [dsh-damage-pulse](https://github.com/wssfk12138/dsh-damage-pulse) | 带缓存感知伤害数字动画的 DSH 实时余额监控与 Token 消耗统计插件。 | ★ 24 | declared |
| [@feiyang666/dsh-usage-plugin](https://github.com/feiyang-dev/dsh-usage-plugin) | DeepSeek Harness 用量与成本追踪插件：记录单次调用 Token/缓存统计、支持峰谷计费、余额查询及数据导出。 | ★ 22 | declared |
| [@pinkbanana/dsh-balance](https://github.com/crazywoola/dsh-balance) | DSH 余额查询插件，在设置中显示 API 余额和可用模型，并在聊天框下方持续展示余额摘要。 | ★ 19 | declared |

[查看全部 844 个 finance 插件 →](https://dshhub.org/zh-CN/?category=finance)

### integrations · 2501

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@deepseek-ai/dsh-api-gateway](https://github.com/deepseek-ai/deepseek-harness/tree/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/packages/api/gateway) | 提供Host与Client两侧的类型化RPC端点，处理调用、流与事件转发。 | ★ 226042 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | 通过MCP连接简历与职位申请数据 | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 40988 | declared |
| [@open-pets/dsh](https://github.com/OpenPetsHQ/openpets/tree/39ba8c539b4a628bcfbc94cdbb2ce4e2bdb9f10b/packages/dsh) | 具有动画宠物、插件 SDK 和编码智能体集成的本地优先桌面伴侣平台。 | ★ 1156 | declared |

[查看全部 2501 个 integrations 插件 →](https://dshhub.org/zh-CN/?category=integrations)

### interface · 6541

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@deepseek-ai/dsh-client-ui-agent-preset](https://github.com/deepseek-ai/deepseek-harness/tree/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/packages/client/ui-agent-preset) | 智能体预设界面：新会话默认、当前会话席位与组合编辑器。 | ★ 226042 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | 提供基于标准输入输出协议的运行环境 | ★ 95736 | declared |
| [@deepseek-harness-tui/dsh-tui](https://github.com/ccch1mneyyy/dsh-TUI) | 提供智能体、会话和工具的终端交互界面 | ★ 2985 | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | DSH 网页端插件，提供类似 VSCode 的右侧边栏（包含资源管理器、编辑器、终端、Git 和浏览器），每个会话独立隔离。 | ★ 1712 | declared |
| [@open-pets/dsh](https://github.com/OpenPetsHQ/openpets/tree/39ba8c539b4a628bcfbc94cdbb2ce4e2bdb9f10b/packages/dsh) | 具有动画宠物、插件 SDK 和编码智能体集成的本地优先桌面伴侣平台。 | ★ 1156 | declared |

[查看全部 6541 个 interface 插件 →](https://dshhub.org/zh-CN/?category=interface)

### memory · 1053

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@agentscope-ai/reme](https://github.com/agentscope-ai/ReMe/tree/01ef1a6efb6e84be29347334b9043ab284e0ca73/packages/typescript) | 适用于 TypeScript 智能体的 ReMe 客户端与记忆集成。 | ★ 3339 | declared |
| [@zilliz/memsearch-dsh](https://github.com/zilliztech/memsearch/tree/f863056e0b113d44e860dd6abf5bb892781e29ca/plugins/dsh) | 提供智能体间共享的Markdown记忆与上下文注入 | ★ 2595 | declared |
| [@mindmemos/deepseek-harness-plugin](https://github.com/mindscale-noah/MindMemOS/tree/0c2fdb1ed41d09c7446f809d00bc11821e96cb24/plugins/deepseek-harness-plugin) | DeepSeek Harness 插件，通过 mindmemos CLI 在每轮对话前检索长期记忆注入上下文，并在完成后自动写入新记忆。 | ★ 938 | declared |
| [graph-memory](https://github.com/adoresever/graph-memory) | 适用于 DeepSeek Harness 和 OpenClaw 的知识图谱记忆库：支持跨会话召回、PageRank、社区发现和向量搜索。 | ★ 563 | declared |
| [@ningbainb/dsh-memory](https://github.com/ningbainb/deepseek-harness-desktop/tree/f30137e7d72942d2cd851a0fa0713f596ed06ad6/packages/dsh-memory) | 提供本地隔离的记忆管理与系统提示词注入。 | ★ 491 | declared |

[查看全部 1053 个 memory 插件 →](https://dshhub.org/zh-CN/?category=memory)

### notifications · 656

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@deepseek-ai/dsh-client-ui-notifications](https://github.com/whitelonng/dshcode/tree/058e9f949ca15bcd973164d4d4e9218923f4eb26/packages/client/ui-notifications) | 通过操作系统通知栏提醒审批等待与任务完成，并提供设置项。 | ★ 715 | declared |
| [dsh-notifier](https://github.com/THEWOLFWALKER/dsh-notifier) | 多渠道统一通知推送与远程双向审批插件 | ★ 96 | declared |
| [dsh-notification](https://github.com/omdsh-dev/dsh-notification) | DSH 浏览器桌面通知插件：支持基于执行结果和关键词规则的自定义通知推送 | ★ 55 | declared |
| [dsh-lark-bot](https://github.com/PlutoKeating/dsh-lark-bot) | 将 DeepSeek Harness 桥接到飞书/Lark 的插件：支持流式卡片、项目工作区、审批和调度。 | ★ 18 | declared |
| [dsh-reminder](https://github.com/Aisland-SJL/dsh-reminder) | 适用于DSH Web GUI的右下角提示卡：审批等待时显示黄色常驻卡，任务完成时显示绿色自动消失卡。 | ★ 18 | declared |

[查看全部 656 个 notifications 插件 →](https://dshhub.org/zh-CN/?category=notifications)

### other · 4077

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [dshmarket](https://github.com/dsh-market/dsh-market) | DeepSeek Harness 可视化插件市场：支持在设置中浏览、搜索和一键安装社区插件与主题 | ★ 637 | declared |
| [@k8e-sandbox/dsh-k8e-sandbox](https://github.com/xiaods/k8e/tree/37b71dd03e0aa63d6bb2e336c7232db00b579f07/plugins/deepseek-harness/packages/dsh-k8e-sandbox) | 为 DSH 提供 k8e-sandbox 沙箱执行服务，暴露 ctx.k8eSandbox。 | ★ 494 | declared |
| [anime-find](https://github.com/cocofhu/anime-find) | DeepSeek Harness 插件：对话内多源搜番、卡片详情、磁力复制与流媒体播放 | ★ 131 | declared |
| [dsh-plugin-liang-calibrator](https://github.com/BruzWJ/Liang-Saint-Slider) | 提供31档模型与思考深度滑动调节选择器。 | ★ 95 | declared |
| [dsh-research-report](https://github.com/PerryLink/dsh-research-report) | 提供可验证的学术与研究报告生成引擎 | ★ 94 | declared |

[查看全部 4077 个 other 插件 →](https://dshhub.org/zh-CN/?category=other)

### productivity · 4886

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@deepseek-ai/dsh-acp](https://github.com/deepseek-ai/deepseek-harness/tree/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/packages/acp/acp) | 仅面向自动化的代理客户端协议服务，经标准输入输出通信。 | ★ 226042 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | 通过MCP连接简历与职位申请数据 | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 40988 | declared |
| [dsh-loopx-plugin](https://github.com/huangruiteng/loopx/tree/bfd1ec8db846bca3af47e559aa5fe7e515e57370/packages/dsh-loopx-plugin) | 一键引导安装LoopX并驱动同会话智能体 | ★ 5812 | declared |

[查看全部 4886 个 productivity 插件 →](https://dshhub.org/zh-CN/?category=productivity)

### skills · 1884

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@dshhubs/plugin-search](https://github.com/coderPerseus/dsh-hub/tree/f36c28b2ab004fe9390ace8907c6ce61238710d1/packages/dsh-plugin) | 用于在 dshhub 目录中查找和检查插件的 DeepSeek Harness 工具 | ★ 2 | declared |
| [@open-design/dsh-runtime](https://github.com/nexu-io/open-design/tree/ad9078b87c2d08e537ca3e041c46c124e7380c9c/packages/dsh-runtime) | 提供基于标准输入输出协议的运行环境 | ★ 95736 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/reactive-resume/tree/fd3494ccac6ef4c47d01614a8a5dcdea08df85eb/packages/dsh-plugin) | 通过MCP连接简历与职位申请数据 | ★ 42525 | declared |
| [dsh-plugin-reactive-resume](https://github.com/reactive-resume/app/tree/0a4608bf9d1dcafcbeba97b6217d5557b9f10221/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 42449 | declared |
| [dsh-plugin-reactive-resume](https://github.com/amruthpillai/reactive-resume/tree/ab811b5f10296871ede5c6cf913050269239f11c/packages/dsh-plugin) | Reactive Resume 的 DSH 插件：通过 MCP 协议将您的简历和求职申请连接到 Harness 会话中，支持读取、创建和编辑。 | ★ 40988 | declared |

[查看全部 1884 个 skills 插件 →](https://dshhub.org/zh-CN/?category=skills)

### vision · 1359

| 插件 | 简介 | Stars | 兼容性依据 |
| --- | --- | ---: | --- |
| [@deepseek-ai/dsh-client-ui-attachment](https://github.com/deepseek-ai/deepseek-harness/tree/0d1f50007f9bca3f52b06e1c3074fa14d5fb0720/packages/client/ui-attachment) | 会话输入、消息图片与轨迹图片槽位的动态附件展示。 | ★ 226042 | declared |
| [dsh-tongflow](https://github.com/tong-io/tongflow/tree/8d47404f5b4c0027351f0af6ad607aaeeeef7ab2/packages/dsh-tongflow) | 集成 TongFlow 工作流与画布的媒体生成插件 | ★ 1020 | declared |
| [@anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 集成图像问答、OCR、UI恢复等视觉工具 | ★ 880 | declared |
| [@deepseek-ai/dsh-client-ui-attachment](https://github.com/whitelonng/dshcode/tree/058e9f949ca15bcd973164d4d4e9218923f4eb26/packages/client/ui-attachment) | 会话附件展示插件，含草稿图栏、拖放目标、历史图库与灯箱 | ★ 715 | declared |
| [@yuxianglin/dsh-bridge-browser](https://github.com/Lum1104/dsh-browser/tree/50b70028d1f702eada5f19dfce0c26444a4886b2/packages/browser/bridge-browser) | 令牌认证 WebSocket 桥接扩展，以文本工具驱动 Chrome。 | ★ 666 | declared |

[查看全部 1359 个 vision 插件 →](https://dshhub.org/zh-CN/?category=vision)

<sub>目录快照 `2026-09-16T10:07:05.699Z-recovery`，生成于 2026-09-16T10:07:05.699Z。</sub>
<!-- catalog:end -->

</details>
