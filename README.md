# dshhub

基于 Cloudflare 的全栈 pnpm Monorepo，项目结构参考 `folk-job`。

## 技术栈

| 模块 | 技术 |
| --- | --- |
| Web | Next.js 16、React 19、OpenNext for Cloudflare |
| API | Hono、Cloudflare Workers |
| 契约 | oRPC contract-first、Zod |
| 数据库 | Cloudflare D1 |
| 存储 | Cloudflare KV、R2 |
| 异步任务 | Cloudflare Queues |
| 包管理 | pnpm workspace |
| 部署 | Wrangler |

## 项目结构

```text
apps/
  api/                 Hono Worker、D1 migration、Queue consumer
  web/                 Next.js 应用与 OpenNext Cloudflare 配置
packages/
  catalog/             GitHub 自动发现、资格验证、README renderer
  contracts/           前后端共享的 oRPC 契约
scripts/               Catalog 构建和发布入口
```

## 本地开发

需要 Node.js 22+ 和 pnpm 10。

```bash
pnpm install
pnpm cf:typegen
pnpm --filter @dshhub/api run db:migrate:local
pnpm dev
```

- Web：<http://localhost:3000>
- API：<http://localhost:8787>
- API health：<http://localhost:8787/health>
- oRPC：<http://localhost:8787/rpc>

## Cloudflare 资源

`apps/api/wrangler.jsonc` 声明了 D1、KV、R2 和 Queue。配置没有账号资源 ID；Wrangler 首次部署时会自动 provision 支持的资源，并回写生成的信息。部署前先确认当前身份：

```bash
pnpm exec wrangler whoami
pnpm deploy:api
pnpm --filter @dshhub/api run db:migrate:remote
pnpm deploy:web
```

如需接入自定义域名，在 `apps/web/wrangler.jsonc` 中增加 `routes`。敏感配置使用 `wrangler secret put <NAME>`，不要提交 `.dev.vars` 或 `.env`。

## 插件目录流水线

GitHub Actions 每 8 小时搜索 `dsh-plugin`、`deepseek-harness-plugin` 和 `deepseek-harness-plugins` topics，自动验证根包及 `packages/*`、`plugins/*` 多包仓库中的可安装 `package.json`，读取 bundle 路径和 README 文档章节，并生成同一份快照的两种投影：

- README 中的可审阅目录；
- R2 原始 JSON + D1 搜索、分类和详情数据。

分类由仓库 topics、包名、描述和关键词自动推导。无效或空仓库会被记录并跳过；整批结果低于安全下限时构建失败。发布经 Queue 异步导入，完整写入新 run 后再切换 `current`，Web 不会读到一半导入的数据。配置和发布命令见 [Catalog pipeline](docs/catalog-pipeline.md)。

```bash
pnpm catalog:build
CATALOG_API_URL=http://localhost:8787 CATALOG_INGEST_TOKEN=... pnpm catalog:publish
```

## 校验

```bash
pnpm typecheck
pnpm test
pnpm build
pnpm --filter @dshhub/web run build:cloudflare
pnpm --filter @dshhub/api exec wrangler deploy --dry-run
```

<!-- catalog:start -->
## Plugin catalog

Generated at 2026-08-13T21:32:50.623Z from snapshot `2026-08-13T21:32:50.623Z-7b56a6fa7d42`.

Plugins: **6**

- `agents`: 1
- `development`: 2
- `interface`: 2
- `productivity`: 5
- `vision`: 2

| Plugin | Description | Categories | Evidence |
| --- | --- | --- | --- |
| [@dsh-external/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等｜DeepSeek Harness-native integration for agent-vision-toolkit: image Q&A, long-screenshot OCR, UI restoration, grounding, pixel diff, Artifacts, and Web UI. | vision, productivity | declared |
| [@liustack/modlens](https://github.com/liustack/modlens) | The first vision plugin for DeepSeek Harness, and the vision bridge for every text-only coding agent. Paste an image, get structured JSON evidence (OCR, layout, semantics). | vision, development | unverified |
| [dsh-agent-teams](https://github.com/NanmiCoder/dsh-agent-teams) | AgentTeams plugin for DeepSeek Harness | agents, productivity | declared |
| [dsh-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 一个侧边栏的完整工作台，支持三方拓展注册新Tab页面，内置文件渲染编辑/终端/Git/子代理 | interface, productivity | declared |
| [dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | DSH 官方尚无终端 TUI 的补位之作：Claude Code 风格全屏交互终端插件——像素鲸鱼顶栏、实时工作状态行、思考流式展开、双击 Esc 回滚、上下文进度条 + TPS 仪表。npm 一键安装。 | interface, productivity | declared |
| [dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) | Open DeepSeek Harness workspace directories in VS Code directly from the web GUI. | development, productivity | declared |
<!-- catalog:end -->
