import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { getPlugin } from "../../../../lib/catalog";
import {
  categoryLabel,
  compatibilityLabel,
  compatibilityTone,
  formatDate,
  formatStars,
} from "../../../../lib/presentation";

type PluginPageProps = {
  params: Promise<{ owner: string; repository: string }>;
};

export async function generateMetadata({ params }: PluginPageProps): Promise<Metadata> {
  const { owner, repository } = await params;
  const result = await getPlugin(owner, repository);
  return result.ok && result.plugin
    ? { title: result.plugin.name, description: result.plugin.description }
    : { title: "插件详情" };
}

export default async function PluginPage({ params }: PluginPageProps) {
  const { owner, repository } = await params;
  const result = await getPlugin(owner, repository);
  if (result.ok && result.plugin === null) notFound();

  if (!result.ok) {
    return (
      <main className="detail-main">
        <Link className="back-link" href="/">← 返回插件目录</Link>
        <div className="empty-state error-state">
          <span>503</span>
          <h1>插件详情暂时不可用</h1>
          <p>目录 API 没有响应，请稍后重试。</p>
        </div>
      </main>
    );
  }

  const plugin = result.plugin;
  if (plugin === null) notFound();

  return (
    <main className="detail-main">
      <Link className="back-link" href="/#catalog">← 返回插件目录</Link>
      <article className="plugin-detail">
        <header className="detail-hero">
          <div>
            <p className="kicker"><span>PLUGIN</span> {plugin.slug}</p>
            <h1>{plugin.name}</h1>
            <p className="detail-summary">{plugin.description || "仓库暂未提供描述。"}</p>
            <div className="tags">
              {plugin.categories.map(category => <span key={category}>{categoryLabel(category)}</span>)}
            </div>
          </div>
          <dl className="facts">
            <div><dt>兼容性</dt><dd className={`compatibility ${compatibilityTone(plugin.compatibility.status)}`}>{compatibilityLabel(plugin.compatibility.status, plugin.compatibility.level)}</dd></div>
            <div><dt>GitHub</dt><dd>★ {formatStars(plugin.repository.stars)}</dd></div>
            <div><dt>版本</dt><dd>{plugin.package.version ?? "未声明"}</dd></div>
            <div><dt>许可证</dt><dd>{plugin.repository.license ?? "未声明"}</dd></div>
            <div><dt>最近更新</dt><dd>{plugin.repository.pushedAt ? formatDate(plugin.repository.pushedAt) : "未知"}</dd></div>
          </dl>
        </header>

        <section className="detail-section install-section" aria-labelledby="install-title">
          <div className="section-number">01</div>
          <div>
            <p className="kicker">INSTALLATION</p>
            <h2 id="install-title">安装</h2>
            {plugin.installation.command ? (
              <div className="command-block">
                <span>$</span><code>{plugin.installation.command}</code>
              </div>
            ) : (
              <div className="manual-notice">
                <strong>需要手动安装</strong>
                <p>此插件尚未提供可验证的 bundle，或兼容性检查未通过。请先阅读仓库说明。</p>
              </div>
            )}
            {plugin.installation.markdown && (
              <div className="markdown-body install-markdown">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plugin.installation.markdown}</ReactMarkdown>
              </div>
            )}
            {plugin.installation.notes.map(note => <p className="install-note" key={note}>⚠ {note}</p>)}
            <p className="pin-note">目录固定到提交 <code>{plugin.repository.commit.slice(0, 12)}</code>，避免安装结果随默认分支变化。</p>
          </div>
        </section>

        <section className="detail-section" aria-labelledby="evidence-title">
          <div className="section-number">02</div>
          <div>
            <p className="kicker">COMPATIBILITY EVIDENCE</p>
            <h2 id="evidence-title">兼容性证据</h2>
            <div className="check-list">
              {plugin.compatibility.checks.map(check => (
                <div className={`check check-${check.status}`} key={check.id}>
                  <span>{check.status === "pass" ? "✓" : check.status === "fail" ? "×" : check.status === "warn" ? "!" : "–"}</span>
                  <div><strong>{check.id}</strong><p>{check.summary}</p></div>
                </div>
              ))}
            </div>
            <dl className="range-list">
              <div><dt>Harness peer range</dt><dd>{plugin.compatibility.harnessRange ?? "未声明"}</dd></div>
              <div><dt>Cordis peer range</dt><dd>{plugin.compatibility.cordisRange ?? "未声明"}</dd></div>
            </dl>
          </div>
        </section>

        <section className="detail-section" aria-labelledby="usage-title">
          <div className="section-number">03</div>
          <div>
            <p className="kicker">USAGE NOTES</p>
            <h2 id="usage-title">使用方法</h2>
            {plugin.usage.markdown ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{plugin.usage.markdown}</ReactMarkdown>
              </div>
            ) : (
              <p className="missing-docs">没有抓取到安装、使用或配置章节。请查看仓库 README。</p>
            )}
            <a className="source-link" href={plugin.usage.readmeUrl} rel="noreferrer" target="_blank">阅读完整 README ↗</a>
          </div>
        </section>

        <aside className="source-panel">
          <div><span>PACKAGE</span><code>{plugin.package.name}</code></div>
          <div><span>SOURCE</span><a href={plugin.repository.url} rel="noreferrer" target="_blank">{plugin.slug} ↗</a></div>
          <div><span>DEFAULT BRANCH</span><code>{plugin.repository.defaultBranch}</code></div>
        </aside>
      </article>
    </main>
  );
}
