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

  // The older production popup emits a server-confirmed lead event, but
  // doesn't emit Velq's canonical GA4 event. Add only the missing aliases.
  function installNativePopupBridge() {
    var queue = window.dataLayer;
    if (!queue || typeof queue.push !== 'function') return;
    if (window.__velqNativePopupLeadBridgeInstalled) return;
    window.__velqNativePopupLeadBridgeInstalled = true;
    var originalPush = queue.push;
    var bridgedOnce = false;
    queue.push = function () {
      var result = originalPush.apply(this, arguments);
      for (var i = 0; i < arguments.length; i++) {
        var command = arguments[i];
        if (!command || command[0] !== 'event' ||
            command[1] !== 'lead_popup_signup_success' ||
            !command[2] || command[2].new_lead !== true || bridgedOnce) continue;
        bridgedOnce = true;
        var params = {
          lead_source: 'velq_launch_waitlist',
          form_id: 'velq-popup-form',
          cta_position: 'popup',
          signup_page: window.location && window.location.pathname || '/',
          popup_name: 'velq_early_access'
        };
        originalPush.call(this, ['event', 'waitlist_signup_success', params]);
        originalPush.call(this, ['event', 'generate_lead', params]);
      }
      return result;
    };
  }
  if (document.querySelector('script[src="/analytics.js"]')) {
    if (document.readyState === 'loading' && document.addEventListener) {
      document.addEventListener('DOMContentLoaded', installNativePopupBridge, {once:true});
    } else {
      installNativePopupBridge();
    }
    return;
  }
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
  installNativePopupBridge();
})();
