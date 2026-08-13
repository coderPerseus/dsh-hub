export default function LoadingPlugin() {
  return (
    <main className="detail-main" aria-busy="true">
      <div className="loading-line" />
      <div className="loading-title" />
      <div className="loading-panel" />
    </main>
  );
}
