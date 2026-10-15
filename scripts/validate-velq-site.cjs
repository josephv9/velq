#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const php = fs.readFileSync('velq-site.php', 'utf8');
const match = php.match(/\$assets=json_decode\(base64_decode\('([A-Za-z0-9+/=]+)'\),true\)/);
assert(match, 'Embedded PHP asset map must be intact');
const assets = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
const paths = Object.keys(assets);
assert(paths.length >= 40, 'Expected at least 40 packed assets');
const content = path => {
  assert(assets[path], 'Missing essential asset ' + path);
  return Buffer.from(assets[path].data, 'base64').toString('utf8');
};
let pages = 0, ld = 0;
for (const [path, info] of Object.entries(assets)) {
  assert(info.type && info.data, 'Invalid asset entry: ' + path);
  if (info.type.includes('javascript')) {
    if (path === '/app.js' || path === '/analytics.js' || path === '/journal.js') {
      new vm.Script(content(path), {filename: path});
    }
  }
  if (!info.type.startsWith('text/html') || path === '/tools/snack-finder/index.html') continue;
  pages++;
  const html = content(path);
  assert(/<title>[^<]+<\/title>/i.test(html), 'Missing page title: ' + path);
  assert(/<h1\b/i.test(html), 'Missing H1: ' + path);
  assert(/rel="canonical"/i.test(html), 'Missing canonical: ' + path);
  assert(!html.includes('https://velqnutrition.comhttps://'), 'Broken absolute image URL: ' + path);
  assert(!/href=["']\/tools\/snack-finder(?:[\/"'?]|$)/i.test(html), 'Link to retired snack finder: ' + path);
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(m[1]);
    ld++;
  }
}
assert(pages >= 25, 'Expected at least 25 active HTML pages');
assert(ld >= 25, 'Expected structured data on site pages');
const home = content('/index.html');
assert(home.includes('id="hero-title">Protein + Fiber <em>Gummies</em>'), 'Homepage product headline changed');
assert(home.includes('id="waitlist-form"') && home.includes('name="email"') && home.includes('name="consent"'), 'Waitlist form missing');
assert(!home.includes('No shaker, no mixing.'), 'Removed homepage copy has returned');
const app = content('/app.js');
assert(app.includes('velq:waitlist-success') && app.includes('result.newLead===true'), 'Confirmed signup dispatch guard missing');
const analytics = content('/analytics.js');
assert(analytics.includes('waitlist_signup_success') && analytics.includes('generate_lead'), 'GA4 signup events missing');
assert(analytics.includes("entry_referrer_type") && analytics.includes("protein_fiber"), 'Buyer intent attribution missing');
assert(content('/compare/index.html').includes('planned six-gummy packet'), 'Outdated Velq packet count in comparison hub');
assert(content('/compare/index.html').includes('href="/blog/protein-gummies-with-fiber-comparison"'), 'Buyer intent link missing from comparison hub');

const sitemap = content('/sitemap.xml');
assert(sitemap.includes('<urlset') && sitemap.includes('https://velqnutrition.com/blog'), 'Malformed or incomplete sitemap');
assert(!sitemap.includes('https://velqnutrition.com/tools/snack-finder'), 'Retired URL in sitemap');


const retired = ["/blog/protein-gummies-vs-protein-powder","/blog/fiber-gummies-vs-fiber-powder","/guides/can-you-mix-protein-and-electrolytes","/guides/how-to-mix-protein-powder-in-16-oz-of-water","/guides/why-does-clear-protein-foam","/guides/protein-powder-for-people-who-hate-shakes","/guides/protein-and-fiber-snacks-without-protein-powder","/guides/what-is-protein-hydration-powder","/guides/protein-water-vs-protein-shakes","/guides/protein-powder-with-prebiotic-fiber","/guides/protein-drink-for-your-morning-routine","/products/lemonade-protein-hydration-powder"];
for(const url of retired){
  assert(!assets[url+'/index.html'],'Retired page served: '+url);
  assert(!sitemap.includes('<loc>https://velqnutrition.com'+url+'</loc>'),'Retired page in sitemap: '+url);
}
for(const [path,info] of Object.entries(assets)){
  if(!info.type.startsWith('text/html'))continue;
  const html=content(path);
  for(const url of retired){
    assert(!html.includes('href="'+url+'"'),'Retired link from '+path+': '+url);
    assert(!html.includes('"url":"https://velqnutrition.com'+url+'"'),'Retired schema on '+path+': '+url);
  }
}
assert(!content('/guides/index.html').includes('Drink preparation guides'),'Powder guide hub still promoted');
assert(!content('/compare/index.html').includes('powder'),'Powder comparison hub still promoted');
const editorialImages = [
  ['/blog/fiber-gummies-vs-psyllium-husk/index.html','/assets/fiber-gummies-vs-psyllium-husk.svg'],
  ['/blog/caffeine-l-theanine-vs-caffeine/index.html','/assets/caffeine-l-theanine-vs-caffeine.svg']
];
for (const [page, picture] of editorialImages) {
  const markup = content(page);
  const url = 'https://velqnutrition.com' + picture;
  assert(markup.includes('<img src="' + picture + '"'), 'Visible cover image missing: ' + page);
  assert(markup.includes('property="og:image" content="' + url + '"'), 'Social image missing: ' + page);
  const block = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map(m => JSON.parse(m[1]));
  const article = block.flatMap(x => x['@graph'] || [x]).find(x => x['@type'] === 'Article');
  assert(article && article.image && article.image.url === url, 'Article image missing or mismatched: ' + page);
  assert(assets[picture].type.startsWith('image/svg+xml'), 'Missing SEO cover SVG or incorrect MIME: ' + picture);
  const svg = content(picture);
  assert(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"'), 'Invalid SVG image start: ' + picture);
  assert(svg.includes('viewBox="0 0 1200 675"') && svg.trimEnd().endsWith('</svg>'), 'Image dimensions or closing tag invalid: ' + picture);
}
const labelPage = content('/tools/nutrition-label-value-calculator/index.html');
const labelTitle = labelPage.match(/<title>([^<]+)<\/title>/i)?.[1] || '';
assert(labelTitle.length <= 60, 'Nutrition label calculator title exceeds 60 characters');
const calculatorPage = content('/tools/protein-fiber-calculator/index.html');
const calculatorMeta = calculatorPage.match(/<meta name="description" content="([^"]+)"/i)?.[1] || '';
assert(calculatorMeta.length <= 160, 'Protein and fiber calculator meta description exceeds 160 characters');
const shortlist = content('/blog/best-fiber-gummies-2026/index.html');
assert(shortlist.includes("<h1>Best Fiber Gummies in 2026: The Buyer's Shortlist</h1>"), 'Shortlist H1 missing');
assert((shortlist.match(/<table>/g) || []).length === 2, 'Shortlist HTML comparison tables missing');
assert((shortlist.match(/<details>/g) || []).length === 8, 'Shortlist FAQs missing');
assert(shortlist.includes('data-waitlist-cta="article-end"'), 'Shortlist waitlist attribution missing');
assert(shortlist.includes('href="/assets/best-fiber-gummies-2026.css"'), 'Shortlist external stylesheet missing');
assert(!shortlist.includes('<style>'), 'Shortlist inline CSS blocked by CSP');
assert(assets['/assets/best-fiber-gummies-2026.css']?.type?.includes('text/css'), 'Shortlist CSS asset missing');
assert(shortlist.includes('Velq publishes this comparison'), 'Commercial affiliation disclosure missing');
assert(content('/sitemap.xml').includes('/blog/best-fiber-gummies-2026'), 'Shortlist absent from sitemap');
assert(content('/index.html').includes('href="/blog/best-fiber-gummies-2026"'), 'Shortlist not linked from homepage');
assert(content('/guides/index.html').includes('href="/blog/best-fiber-gummies-2026"'), 'Shortlist not linked from guides');

const directGuide = content('/blog/protein-gummies-with-fiber-comparison/index.html');
assert(directGuide.includes('<h1>Protein Gummies With Fiber: 2026 Label Comparison</h1>'),'New protein gummies comparison H1 missing');
assert((directGuide.match(/<table>/g)||[]).length===2,'Protein gummies comparison tables missing');
assert((directGuide.match(/<details>/g)||[]).length===8,'Protein gummies buyer FAQs missing');
assert(directGuide.includes('data-waitlist-cta="article-end"'),'Buyer journey tracking missing');
assert(directGuide.includes('This guide is published by Velq'),'Conflict disclosure missing');
assert(directGuide.includes('OAKA: for plant-based 20g'), 'OAKA competitor section missing');
assert(directGuide.includes('Soluble tapioca fiber listed; grams unconfirmed'), 'OAKA uncertainty disclosure missing');
assert(directGuide.includes('rel="canonical" href="https://velqnutrition.com/blog/protein-gummies-with-fiber-comparison"'),'Buyer comparison canonical missing');
assert(content('/sitemap.xml').includes('https://velqnutrition.com/blog/protein-gummies-with-fiber-comparison'),'New protein gummies guide missing in sitemap');
assert(content('/blog/index.html').includes('href="/blog/protein-gummies-with-fiber-comparison"'),'New comparison unlinked from Journal');
assert(content('/index.html').includes('href="/blog/protein-gummies-with-fiber-comparison"'),'New comparison unlinked from homepage');


const priorityGuides = [
  '/blog/protein-and-fiber-gummies-buying-guide/index.html',
  '/blog/protein-gummies-for-adults/index.html',
  '/blog/fiber-gummies-for-adults-guide/index.html'
];
for (const path of priorityGuides) {
  const markup = content(path);
  assert(markup.includes('velq-gummy-label-worksheet.csv'), 'Missing downloadable comparison resource: ' + path);
  assert(markup.includes('fda.gov'), 'Missing FDA source reference: ' + path);
  const data = [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const article = data.flatMap(x => x['@graph'] || [x]).find(x => ['Article','BlogPosting'].includes(x['@type']));
  assert(article && article.author?.logo?.url && article.publisher?.logo?.url, 'Missing structured-data organization logos: ' + path);
}
assert(content('/assets/velq-gummy-label-worksheet.csv').includes('Label source URL'), 'Missing worksheet columns');
assert(content('/index.html').includes('sizes="(max-width: 650px) 90vw'), 'Responsive homepage imagery missing');
for (const [path, info] of Object.entries(assets)) {
  if (!info.type.startsWith('text/html')) continue;
  const markup = content(path);
  assert(!markup.includes('<script src="/analytics-config.js"></script>'), 'Parser-blocking analytics configuration returned: ' + path);
}
const powderGuide = fs.readFileSync('blog/fiber-gummies-vs-fiber-powder/index.html','utf8');
const powderGraph = [...powderGuide.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .flatMap(m => { const x = JSON.parse(m[1]); return x['@graph'] || [x]; });
const powderArticle = powderGraph.find(x => x['@type'] === 'Article');
assert(powderArticle && powderArticle.image?.url && powderArticle.author?.logo?.url && powderArticle.publisher?.logo?.url,
  'Standalone fiber comparison structured data missing image or logos');
assert(powderGuide.includes('property="og:image"'), 'Standalone fiber comparison social image missing');

console.log('PASS: ' + paths.length + ' packaged assets, ' + pages + ' live pages, ' + ld + ' valid JSON-LD blocks; canonical, mobile-related scripts and waitlist code present.');
