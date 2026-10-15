"use strict";
(() => {
 const finite=(v,max=10000)=>{const x=Number(v);return Number.isFinite(x)&&x>=0?Math.min(x,max):0;};
 const totals=rows=>rows.reduce((a,r)=>({protein:a.protein+finite(r.protein)*finite(r.portions,20),fiber:a.fiber+finite(r.fiber)*finite(r.portions,20)}),{protein:0,fiber:0});
 const unitCost=(price,servings)=>finite(servings)>0?finite(price)/finite(servings):null;
 if(typeof module!=="undefined"&&module.exports)module.exports={finite,totals,unitCost};
 if(typeof document==="undefined")return;
 const planner=document.querySelector('[data-fiber-planner]');
 if(planner){const update=()=>{const rows=[...planner.querySelectorAll('[data-food-row]')].map(r=>({protein:r.querySelector('[data-protein]').value,fiber:r.querySelector('[data-fiber]').value,portions:r.querySelector('[data-portions]').value}));const t=totals(rows);planner.querySelector('output').textContent=`Your entered portions: ${t.protein.toFixed(1)} g protein · ${t.fiber.toFixed(1)} g fiber. Planning arithmetic only; not a recommended target.`;};planner.addEventListener('input',update);update();}
 const compare=document.querySelector('[data-label-compare]');
 if(compare){const update=()=>{for(const row of compare.querySelectorAll('[data-product-row]')){const n=unitCost(row.querySelector('[data-price]').value,row.querySelector('[data-servings]').value);row.querySelector('output').textContent=n===null?'Enter servings':`$${n.toFixed(2)} per serving`;}};compare.addEventListener('input',update);update();}
 const choices=document.querySelector('[data-snack-filter]');
 if(choices)choices.addEventListener('change',()=>{const filter=choices.value;for(const item of document.querySelectorAll('[data-snack-tags]'))item.hidden=filter!=='all'&&!item.dataset.snackTags.split(' ').includes(filter);});
 for(const button of document.querySelectorAll('[data-print-workbook]'))button.addEventListener('click',()=>window.print());
 const path=location.pathname.replace(/\/+$/,'');
 if(path.startsWith('/blog/')&&!path.includes('/category/')&&path!=='/blog/editorial-policy'){
  // No personal identifiers, user-entered food values, or medication data are collected.
  if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','article_view',{article_path:path});
  const milestone=new Set();const handler=()=>{const available=document.documentElement.scrollHeight-innerHeight;if(available<=0)return;const pct=100*scrollY/available;for(const n of [50,90])if(pct>=n&&!milestone.has(n)){milestone.add(n);if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','article_scroll',{article_path:path,percent_scrolled:n});}};window.addEventListener('scroll',handler,{passive:true});
 }
 for(const a of document.querySelectorAll('a[href="/assets/growth/nutrition-workbook.html"]'))a.addEventListener('click',()=>{if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','article_resource_click',{article_path:path,resource:'nutrition_workbook'});});
})();
