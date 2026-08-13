import Link from "next/link";

import { getTranslator } from "../lib/i18n/get-locale";
import { PageStage } from "./page-stage";

export default async function NotFound() {
  const { t } = await getTranslator();

  return (
    <PageStage>
      <div className="detail-main">
        <div className="ds-container">
          <div className="empty-state">
            <span>404</span>
            <h1>{t.notFoundTitle}</h1>
            <p>{t.notFoundHint}</p>
            <Link href="/#catalog">{t.backToCatalog}</Link>
          </div>
        </div>
      </div>
    </PageStage>
  );
}
