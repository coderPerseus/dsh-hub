// Public GA4 measurement ID for DSH Hub Web (https://dshhub.org).
export const googleAnalyticsId = 'G-XDSMRTQ5PW';

// Enhanced measurement owns page views, including history changes. Do not add
// a second manual page_view handler. Local previews must not send production data.
export const googleAnalyticsScript = `
if (window.location.hostname === 'dshhub.org') {
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${googleAnalyticsId}', {
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  var script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}';
  document.head.appendChild(script);
}
`;
