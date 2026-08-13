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
  contracts/           前后端共享的 oRPC 契约
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

Generated at 2026-08-13T16:13:41.283Z from snapshot `2026-08-13T16:13:41.283Z-local-develo`.

Plugins: **0**

No categories yet.

| Plugin | Description | Categories | Evidence |
| --- | --- | --- | --- |
| — | No plugins registered yet. | — | — |
<!-- catalog:end -->
