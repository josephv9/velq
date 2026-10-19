/* Velq site analytics (GA4).
   Production measurement ID provided by the Velq account owner.
   Loaded once per HTML page by the existing PHP output filter. */
(function () {
  var ID = 'G-F93RK1P0H5';
  if (!/^G-[A-Z0-9]{6,}$/.test(ID) || ID.indexOf('X') !== -1) return;
  // The packed /analytics.js owns page views and confirmed waitlist events.
  // Feed it the real ID, but never initialize GA4 twice on those pages.
  var config = window.VELQ_ANALYTICS;
  if (!config || typeof config !== 'object') config = {};
  config.ga4 = ID;
  window.VELQ_ANALYTICS = config;
  if (document.querySelector('script[src="/analytics.js"]')) return;
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  /* Linker keeps sessions intact across the Shopify checkout domain. Also add
     qusbk4-9s.myshopify.com under Admin > Data streams > Configure tag settings
     > Configure your domains in GA4 itself. */
  gtag('config', ID, {
    linker: { domains: ['velqnutrition.com', 'qusbk4-9s.myshopify.com'] }
  });
})();
