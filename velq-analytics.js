/* Velq site analytics (GA4).
   Paste the GA4 measurement ID below (Admin > Data streams > velqnutrition.com).
   Until a real G- ID is set, this file does nothing. After editing, redeploy
   this one file to the site branch. */
(function () {
  var ID = 'G-XXXXXXXXXX';
  if (!/^G-[A-Z0-9]{6,}$/.test(ID) || ID.indexOf('X') !== -1) return;
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
