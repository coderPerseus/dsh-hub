import { PageStage } from "../../../page-stage";

export default function LoadingPlugin() {
  return (
    <PageStage>
      <div className="detail-main" aria-busy="true">
        <div className="ds-container">
          <div className="loading-line" />
          <div className="loading-title" />
          <div className="loading-panel" />
        </div>
      </div>
    </PageStage>
  );
}
