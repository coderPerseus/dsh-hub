const stack = [
  "Next.js 16",
  "Hono",
  "oRPC",
  "D1",
  "KV",
  "R2",
  "Queues",
  "OpenNext",
];

export default function Home() {
  return (
    <main>
      <p className="eyebrow">CLOUDFLARE MONOREPO</p>
      <h1>dshhub</h1>
      <p className="intro">
        全栈项目已经就绪。Web、API、共享契约和 Cloudflare 资源由一个 pnpm workspace 管理。
      </p>
      <ul aria-label="技术栈">
        {stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="status">
        <span aria-hidden="true" />
        初始化完成
      </div>
    </main>
  );
}
