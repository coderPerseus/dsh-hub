# Google Analytics

DSH Hub uses Google Analytics 4 in the existing `luckySnail` account.

- Property: `DSH Hub` (`553845635`)
- Web stream: `DSH Hub Web` (`15765836911`), `https://dshhub.org`
- Public measurement ID: `G-XDSMRTQ5PW` (not a secret)
- Reports: https://analytics.google.com/analytics/web/#/a324238930p553845635/reports/intelligenthome
- Reporting time zone: China, UTC+08:00

`apps/web/src/lib/google-analytics.ts` supplies the Google tag to the shared HTML template in `scripts/build-static.mts`. All generated pages include it. The script initializes only on `dshhub.org`, so localhost and Workers preview domains do not send production events. It loads asynchronously and requires no server, API secret or new package.

Enhanced measurement is enabled for the web stream and owns automatic page views, including browser history changes. Do not also send manual `page_view` events for those navigations. Google signals and advertising personalization signals are disabled in the tag configuration.

After deployment, check the homepage and a plugin detail page for the measurement ID, then use Chrome's Network panel to verify `gtag/js` loads and a Google Analytics `g/collect` request sends `en=page_view` with `tid=G-XDSMRTQ5PW`. Confirm receipt in GA4 Realtime; report data can appear later than network delivery. Local tests intentionally send no events.
