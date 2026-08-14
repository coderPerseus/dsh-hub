# DSH Hub development

本文档面向参与 DSH Hub 开发、部署和目录维护的贡献者。产品介绍和插件分类请从[项目 README](../README.md) 开始。

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
  client/              公共 catalog API 的 TypeScript client
  cli/                 面向开发者和 Agent 的 dshhub CLI
  contracts/           前后端共享的 oRPC 契约
  dsh-plugin/           注册搜索和详情工具的 DSH 原生插件
skills/
  find-dsh-plugins/     原生工具优先、CLI 回退的 Agent workflow
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
- Catalog REST API：<http://localhost:3000/api/v1/plugins>

## Agent 与开发者入口

CLI 默认访问 `https://dshhub.org/api/v1`，也可通过 `DSHHUB_API_URL` 或 `--api-url` 覆盖：

```bash
pnpm --filter @dshhubs/cli build
node packages/cli/lib/bin.js search "cross-session memory" --limit 10 --json
node packages/cli/lib/bin.js plugin owner/repository --json
```

DSH 插件注册 `search_dsh_plugins` 和 `get_dsh_plugin` 两个只读工具：

```bash
npx -p @deepseek-ai/dsh dsh plugin --profile web add @dshhubs/plugin-search
```

仓库内的 `skills/find-dsh-plugins` 负责搜索、检查和比较流程；它优先使用 DSH 原生工具，不可用时调用 CLI。插件和 Skill 都不会自动安装搜索结果。

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

GitHub Actions 每小时搜索新发布的 DSH 插件，每周刷新已收录仓库。目录构建会更新根 README 中每个分类的 5 个代表插件；完整列表由网站分类页提供。

发现、资格验证、翻译、缓存和发布细节见 [Catalog pipeline](catalog-pipeline.md)。

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
