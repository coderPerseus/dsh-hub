import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type PluginReadmeProps = {
  markdown: string;
  missingLabel: string;
  sourceLabel: string;
  sourceUrl: string;
  title: string;
};

function safeHref(href: string | undefined): string | undefined {
  if (!href || href.startsWith("#")) return href;
  try {
    const url = new URL(href, "https://dshhub.org");
    if (url.protocol === "http:" || url.protocol === "https:") return href;
  } catch {
    return undefined;
  }
  return undefined;
}

export function PluginReadme(props: PluginReadmeProps) {
  return (
    <section className="detail-docs" aria-labelledby="readme-title">
      <div className="detail-docs-head">
        <h2 id="readme-title">{props.title}</h2>
        <a className="source-link" href={props.sourceUrl} rel="noreferrer" target="_blank">
          {props.sourceLabel}
        </a>
      </div>
      {props.markdown ? (
        <div className="markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => {
                const safe = safeHref(href);
                return safe
                  ? <a href={safe} rel="noreferrer" target={safe.startsWith("#") ? undefined : "_blank"}>{children}</a>
                  : <span>{children}</span>;
              },
              img: ({ src, alt }) => {
                const href = typeof src === "string" ? src : undefined;
                const safe = safeHref(href);
                return safe ? <img src={safe} alt={alt ?? ""} loading="lazy" /> : null;
              },
            }}
          >
            {props.markdown}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="missing-docs">{props.missingLabel}</p>
      )}
    </section>
  );
}
