(() => {
'use strict';
if(window.__velqChannelsLoaded)return;window.__velqChannelsLoaded=true;
const key='velq_channel_v1';const allowed=['tiktok','instagram','creator','wholesale','email','google','bing','youtube','facebook'];
let context={channel:'direct_or_other'};
try {const saved=JSON.parse(sessionStorage.getItem(key)||'null');if(saved&&allowed.concat('direct_or_other','tiktok_live').includes(saved.channel))context={channel:saved.channel};
const query=new URLSearchParams(location.search);const source=(query.get('utm_source')||'').toLowerCase();const medium=(query.get('utm_medium')||'').toLowerCase();
if(allowed.includes(source))context={channel:source==='tiktok'&&medium==='live'?'tiktok_live':source};
else if(['affiliate','creator'].includes(medium))context={channel:'creator'};
else if(!saved){const host=new URL(document.referrer||location.origin).hostname;if(/(^|\.)tiktok\.com$/.test(host))context={channel:'tiktok'};else if(/(^|\.)instagram\.com$/.test(host))context={channel:'instagram'};else if(/(^|\.)google\.[a-z.]+$/.test(host))context={channel:'google'};}
sessionStorage.setItem(key,JSON.stringify(context));
}catch{}
const track=(name,extra={})=>{if(typeof window.gtag==='function')window.gtag('event',name,{acquisition_channel:context.channel,...extra});};
track('channel_landing');
const seen=new Set();
window.addEventListener('velq:waitlist-success',event=>{const id=event.detail?.eventId;if(typeof id!=='string'||!id||seen.has(id))return;seen.add(id);track('channel_waitlist_confirmed');});
document.addEventListener('click',event=>{const a=event.target.closest?.('a');if(!a)return;if(a.matches('[data-wholesale-cta]'))track('wholesale_cta_click',{cta_position:a.dataset.wholesaleCta});if(a.matches('[data-buyer-sheet]'))track('wholesale_buyer_sheet_view');});
if(location.pathname.replace(/\/$/,'')==='/wholesale')track('wholesale_page_view');
})();
