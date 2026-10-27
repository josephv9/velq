'use strict';
(() => {
  if (window.__velqAnalyticsLoaded) return;
  window.__velqAnalyticsLoaded = true;
  const config=window.VELQ_ANALYTICS||{};
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){dataLayer.push(arguments);};

  if(config.ga4){
    const script=document.createElement('script');
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(config.ga4)}`;
    document.head.appendChild(script);
    gtag('js',new Date());
    gtag('config',config.ga4,{linker:{domains:['velqnutrition.com','shop.velqnutrition.com','qusbk4-9s.myshopify.com']}});
  }

  if(config.meta){
    window.fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments);};
    fbq.queue=[];fbq.loaded=true;fbq.version='2.0';
    const script=document.createElement('script');script.async=true;script.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(script);
    fbq('init',config.meta);fbq('track','PageView');
  }

  if(config.tiktok){
    window.ttq=window.ttq||[];ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie','holdConsent','revokeConsent','grantConsent'];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)));};};for(let i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.load=function(id){const s=document.createElement('script');s.async=true;s.src='https://analytics.tiktok.com/i18n/pixel/events.js?sdkid='+encodeURIComponent(id)+'&lib=ttq';document.head.appendChild(s);};
    ttq.load(config.tiktok);ttq.page();
  }

  // Shopify owns checkout and purchase events. Prelaunch product views are separate.
  if (document.body?.dataset.productDetail === 'strawberry-protein-fiber-gummies' && config.ga4) {
    window.gtag('event', 'product_detail_view', {product_id:'strawberry-protein-fiber-gummies', product_status:'prelaunch'});
  }

})();

// Only server-confirmed waitlist success generates a lead. No email is sent to analytics.
(() => {
  const config=window.VELQ_ANALYTICS||{};
  const cleanPath=value=>{
    if(typeof value!=='string')return '';
    const path=value.replace(/\/+$/,'')||'/';
    return /^(?:\/|\/compare|\/media|\/research(?:\/[a-z0-9-]+)?|\/products\/[a-z0-9-]+|\/blog(?:\/(?:category\/)?[a-z0-9-]+)?|\/guides(?:\/[a-z0-9-]+)?|\/tools\/[a-z0-9-]+)$/.test(path)?path:'';
  };
  // Native GA4 source / medium is the source of truth for organic acquisition.
  // Referrer category is an auxiliary hint when a search origin is visible.
  const entryReferrerType=()=>{
    try{
      const host=new URL(document.referrer).hostname.toLowerCase();
      if(/(^|\.)google\.[a-z.]+$/.test(host)||/(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com|ecosia\.org|brave\.com)$/.test(host))return 'search_referrer';
      if(/(^|\.)(instagram\.com|tiktok\.com|facebook\.com|pinterest\.com|reddit\.com|youtube\.com|x\.com)$/.test(host))return 'social_referrer';
      return host?'other_referrer':'direct_or_unknown';
    }catch{return 'direct_or_unknown';}
  };
  try{
    if(!sessionStorage.getItem('velq_landing_page'))sessionStorage.setItem('velq_landing_page',cleanPath(location.pathname));
    if(!sessionStorage.getItem('velq_entry_referrer_type'))sessionStorage.setItem('velq_entry_referrer_type',entryReferrerType());
  }catch{}
  const readContext=()=>{try{return JSON.parse(sessionStorage.getItem('velq_journal_signup')||'{}');}catch{return {};}};
  document.querySelectorAll('[data-waitlist-cta]').forEach(link=>link.addEventListener('click',()=>{
    const previous=readContext();
    const now=Date.now();
    const current=cleanPath(location.pathname);
    const recentPrevious=Number.isFinite(previous.clicked_at)&&now-previous.clicked_at<30*60*1000;
    // A buyer who follows an article CTA to the homepage must retain that article attribution.
    const prior=recentPrevious?cleanPath(previous.article_path):'';
    const article=current==='/'&&prior&&prior!=='/'?prior:current;
    let entry='';
    try{entry=cleanPath(sessionStorage.getItem('velq_landing_page')||location.pathname);}catch{entry=current;}
    const context={article_path:article,landing_page:entry,cta_position:link.dataset.waitlistCta,clicked_at:now};
    try{sessionStorage.setItem('velq_journal_signup',JSON.stringify(context));}catch{}
    if(config.ga4)window.gtag('event','waitlist_cta_click',{article_path:context.article_path,cta_position:context.cta_position});
  }));
  const seen=new Set();
  try { for (const id of JSON.parse(sessionStorage.getItem('velq_counted_signup_events_v2') || '[]')) if (typeof id === 'string') seen.add(id); } catch {}
  window.addEventListener('velq:waitlist-success',event=>{
    const id=event.detail?.eventId;
    if(typeof id!=='string'||!id.trim()||id.includes('@')||seen.has(id))return;
    seen.add(id);
    try { sessionStorage.setItem('velq_counted_signup_events_v2', JSON.stringify([...seen].slice(-20))); } catch {}
    const context=readContext();
    const recent=Number.isFinite(context.clicked_at)&&Date.now()-context.clicked_at<30*60*1000;
    let initialPath='';
    try{initialPath=sessionStorage.getItem('velq_landing_page')||'';}catch{}
    const landing=cleanPath(initialPath)||cleanPath(location.pathname)||'/';
    const sourcePath=recent?cleanPath(context.article_path):'';
    const isPopup=event.detail?.source==='popup';
    const position=isPopup?'popup':recent&&['intro','end','home','header','hero','sticky','finder','calculator','article-intro','article-end','commercial-journey','product-hero','product-footer'].includes(context.cta_position)?context.cta_position:'direct';
    const intentPath=sourcePath||landing;
    const topic=/protein/.test(intentPath)&&/fiber/.test(intentPath)?'protein_fiber':/fiber|psyllium/.test(intentPath)?'fiber':/caffeine|theanine|energy/.test(intentPath)?'energy':/protein|powder/.test(intentPath)?'protein':/calculator|compare/.test(intentPath)?'comparison':'general';
    const params={lead_source:'velq_launch_waitlist',form_id:isPopup?'velq-lead-form':'waitlist-form',event_id:id,
      landing_page:landing,signup_page:cleanPath(location.pathname)||'/',cta_position:position,content_topic:topic};
    if(isPopup&&['exit_intent','time_on_page'].includes(event.detail?.trigger))params.popup_trigger=event.detail.trigger;
    if(sourcePath&&sourcePath!=='/')params.article_path=sourcePath;
    try{
      const type=sessionStorage.getItem('velq_entry_referrer_type');
      if(['search_referrer','social_referrer','other_referrer','direct_or_unknown'].includes(type))params.entry_referrer_type=type;
    }catch{}
    window.dataLayer.push({event:'velq_waitlist_confirmed',...params});
    if(config.ga4){window.gtag('event','waitlist_signup_success',params);window.gtag('event','waitlist_signup_complete',params);window.gtag('event','generate_lead',params);}
    if(config.meta)window.fbq('track','Lead',{}, {eventID:id});
    if(config.tiktok)window.ttq.track('SubmitForm',{event_id:id});
    try{sessionStorage.removeItem('velq_journal_signup');}catch{}
  });
})();
