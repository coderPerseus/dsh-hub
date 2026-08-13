import Link from "next/link";

export default function NotFound() {
  return (
    <main className="detail-main">
      <div className="empty-state">
        <span>404</span>
        <h1>没有找到这个插件</h1>
        <p>它可能尚未收录，或已经从目录中移除。</p>
        <Link href="/#catalog">返回插件目录</Link>
      </div>
    </main>
  );
}
