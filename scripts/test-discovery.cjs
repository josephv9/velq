#!/usr/bin/env node
'use strict';
// Local release gate: production PHP bodies and assets, with no HTTP requests.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
process.chdir(root);
const origin = 'https://velqnutrition.com';
const imageNamespace = 'http://www.google.com/schemas/sitemap-image/1.1';

function php(program, args = [], input = '') {
  // Keep input in a positional argument: some local PHP builds leave pipe EOF
  // open under spawnSync, while these rendered page/sitemap bodies fit argv.
  program = program.replace(/file_get_contents\((["'])php:\/\/stdin\1\)/g, '$testInput');
  program = `$testInput=base64_decode($argv[${args.length + 1}]);` + program;
  const result = spawnSync('php', ['-d', 'display_errors=1', '-r', program, ...args, Buffer.from(input).toString('base64')], {
    cwd: root, encoding: 'utf8', timeout: 10000, maxBuffer: 8 * 1024 * 1024
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message || 'PHP failed');
  assert(!/Fatal error|Warning:|Parse error|Deprecated:/.test(result.stdout + result.stderr), 'PHP emitted a diagnostic');
  return result.stdout;
}

const pages = JSON.parse(php('require "discovery-extension.php"; echo json_encode(velq_discovery_images());'));
// The approved discovery map currently covers 32 canonical routes, including
// research/tools and published Journal guides. Keep this as a release gate.
assert.equal(Object.keys(pages).length, 32, 'Review the release scope when changing the image map');
const standalone = new Set([
  '/media', '/research', '/research/gummy-serving-study-2026',
  '/tools/serving-comparison-calculator', '/tools/nutrition-label-value-calculator',
  '/blog/protein-gummies-with-fiber-comparison'
]);
const rewrites = fs.readFileSync('.htaccess', 'utf8');
const legacyImageRule = rewrites.split(/\r?\n/).find(line => /^\s*RewriteRule\s+/.test(line)
  && line.includes('velq-fruit-snacks-original') && line.includes('[R=302,L,NE,NC]'));
assert(legacyImageRule, 'Review the legacy product-image redirect');
const [, legacyImagePattern, legacyImageTarget] = legacyImageRule.trim().split(/\s+/);
const legacyImageRegex = new RegExp(legacyImagePattern, 'i');

function renderRoute(route, withoutDiscovery = false) {
  // Execute the real route handler, including the packed Journal cover overrides.
  // For the comparison baseline only, disable the new filter calls in memory;
  // retain all existing research, authority, photo and responsive-image behavior.
  const entry = standalone.has(route) ? 'research-content.php'
    : route === '/blog/fiber-gummies-vs-fiber-powder' ? 'standalone-powder'
    : route.startsWith('/blog/') || route === '/sitemap.xml' ? 'nutrition-content.php'
    : 'velq-site.php';
  return php(`
    $_SERVER['REQUEST_URI']=$argv[1]; $_SERVER['HTTP_HOST']='velqnutrition.com';
    $_SERVER['REQUEST_METHOD']='GET'; $_SERVER['QUERY_STRING']='';
    if ($argv[3] === 'baseline') {
      $source=file_get_contents('image-patch.php');
      $source=str_replace('velq_discovery_response(velq_growth_response($html, $assetPath), $assetPath)', 'velq_growth_response($html, $assetPath)', $source, $count);
      if ($count !== 2) throw new RuntimeException('Review discovery integration points');
      eval(substr($source, 5));
    } else { require 'image-patch.php'; }
    if ($argv[2] === 'standalone-powder') { readfile('blog/fiber-gummies-vs-fiber-powder/index.html'); }
    else { require $argv[2]; }
  `, [route, entry, withoutDiscovery ? 'baseline' : 'release']);
}

function filter(route, body, integrated = false) {
  const program = integrated
    ? '$_SERVER["REQUEST_URI"]=$argv[1]; require "image-patch.php"; echo file_get_contents("php://stdin");'
    : 'require "discovery-extension.php"; echo velq_discovery_response(file_get_contents("php://stdin"), $argv[1]);';
  return php(program, [route], body);
}

function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39|#(\d+)|#x([0-9a-f]+));/gi, (token, decimal, hex) => {
    if (decimal) return String.fromCodePoint(Number(decimal));
    if (hex) return String.fromCodePoint(parseInt(hex, 16));
    return ({'&amp;':'&','&quot;':'"','&apos;':"'",'&lt;':'<','&gt;':'>','&#39;':"'"})[token.toLowerCase()];
  });
}

function attrs(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])([\s\S]*?)\2/g)]
    .map(match => [match[1].toLowerCase(), decode(match[3])]));
}

function head(html) {
  const match = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  assert(match, 'Missing document head');
  return match[1];
}

function body(html) {
  const match = html.match(/<body\b[^>]*>[\s\S]*<\/body>/i);
  assert(match, 'Missing document body');
  return match[0];
}

function metadata(html) {
  const result = new Map();
  for (const tag of head(html).match(/<meta\b[^>]*>/gi) || []) {
    const data = attrs(tag), key = (data.property || data.name || '').toLowerCase();
    if (!key) continue;
    if (!result.has(key)) result.set(key, []);
    result.get(key).push(data.content || '');
  }
  return result;
}

function schema(html) {
  return [...head(html).matchAll(/(<script\b[^>]*>)([\s\S]*?)<\/script>/gi)]
    .filter(match => attrs(match[1]).type?.toLowerCase() === 'application/ld+json')
    .map(match => JSON.parse(match[2]));
}

function walk(value, visitor) {
  if (!value || typeof value !== 'object') return;
  visitor(value);
  for (const item of Object.values(value)) walk(item, visitor);
}

function withoutImageFields(value) {
  if (Array.isArray(value)) return value.map(withoutImageFields);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !['image', 'logo', 'primaryImageOfPage'].includes(key))
    .map(([key, item]) => [key, withoutImageFields(item)]));
}

function heroTag(html) {
  return (html.match(/<img\b[^>]*>/gi) || []).find(tag => attrs(tag).id === 'hero-image');
}

const rendered = new Map();
for (const [route, record] of Object.entries(pages)) {
  const baseline = renderRoute(route, true), output = renderRoute(route);
  rendered.set(route, output);
  const image = record.primary, meta = metadata(output), previous = metadata(baseline);
  const expected = {
    'og:image': image.url, 'og:image:secure_url': image.url,
    'og:image:width': String(image.width), 'og:image:height': String(image.height),
    'og:image:type': image.type, 'og:image:alt': image.alt,
    'twitter:card': 'summary_large_image', 'twitter:image': image.url, 'twitter:image:alt': image.alt
  };
  for (const [key, value] of Object.entries(expected)) {
    assert.deepEqual(meta.get(key), [value], `${route}: expected one exact ${key}`);
  }
  assert.match(image.url, /^https:\/\//, `${route}: primary image is not absolute HTTPS`);
  assert(image.width > 0 && image.height > 0 && image.alt.length > 20, `${route}: incomplete image metadata`);
  for (const key of ['description', 'og:title', 'og:description', 'og:url', 'twitter:title', 'twitter:description']) {
    assert.deepEqual(meta.get(key), previous.get(key), `${route}: unrelated ${key} changed`);
  }
  const canonical = html => (head(html).match(/<link\b[^>]*>/gi) || [])
    .map(attrs).filter(tag => tag.rel?.toLowerCase().split(/\s+/).includes('canonical'));
  assert.deepEqual(canonical(output), canonical(baseline), `${route}: canonical changed`);
  assert.equal(canonical(output)[0]?.href, origin + route, `${route}: wrong canonical source`);
  assert.equal(filter(route, output), output, `${route}: discovery pass is not idempotent`);
  assert.equal(filter(route, output, true), output, `${route}: integrated filter is not idempotent`);

  let expectedBody = body(baseline);
  if (route === '/') {
    const before = heroTag(baseline), after = heroTag(output);
    assert(before && after, 'Homepage hero image is missing');
    const beforeAttrs = attrs(before), afterAttrs = attrs(after);
    assert.equal(afterAttrs.width, '1122'); assert.equal(afterAttrs.height, '1402');
    for (const key of ['src', 'srcset', 'sizes', 'fetchpriority', 'loading', 'decoding', 'alt']) {
      assert.equal(afterAttrs[key], beforeAttrs[key], 'Homepage hero ' + key + ' changed');
    }
    assert.equal(afterAttrs.fetchpriority, 'high');
    assert.match(afterAttrs.srcset, /480w, .*800w, .*1200w$/);
    const preload = (head(output).match(/<link\b[^>]*>/gi) || []).find(tag => tag.includes('data-velq-responsive-preload'));
    assert(preload, 'Responsive hero preload missing');
    assert.equal(attrs(preload).imagesrcset, afterAttrs.srcset);
    assert.equal(attrs(preload).imagesizes, afterAttrs.sizes);
    expectedBody = expectedBody.replace(before, before.replace(/\bwidth="[^"]*"/, 'width="1122"').replace(/\bheight="[^"]*"/, 'height="1402"'));
  }
  assert.equal(body(output), expectedBody, `${route}: visible content changed beyond the corrected hero dimensions`);

  const beforeSchema = schema(baseline), afterSchema = schema(output);
  assert(afterSchema.length > 0, `${route}: no structured metadata`);
  assert.deepEqual(afterSchema.map(withoutImageFields), beforeSchema.map(withoutImageFields),
    `${route}: non-image schema facts, dates, types or identities changed`);
  let imageEntities = 0;
  for (const document of afterSchema) {
    const primaryEntities = new Set(document['@graph'] || [document]);
    walk(document, node => {
      const types = [].concat(node['@type'] || []);
      assert(!types.includes('VideoObject'), `${route}: fabricated video metadata`);
      if (types.includes('ImageObject')) {
        for (const key of ['url', 'contentUrl']) if (node[key]) assert.match(node[key], /^https:\/\//, `${route}: relative ImageObject ${key}`);
        if (node.url === origin + '/apple-touch-icon.png') {
          assert.equal(node.width, 180); assert.equal(node.height, 180);
        }
      }
      if (primaryEntities.has(node) && types.some(type => ['Article', 'BlogPosting', 'WebApplication', 'WebPage', 'CollectionPage'].includes(type))) {
        const field = types.some(type => ['WebPage', 'CollectionPage'].includes(type)) ? 'primaryImageOfPage' : 'image';
        assert.equal(node[field]?.['@type'], 'ImageObject', `${route}: ${field} is not ImageObject`);
        assert.equal(node[field].url, image.url); assert.equal(node[field].contentUrl, image.url);
        assert.equal(node[field].width, image.width); assert.equal(node[field].height, image.height);
        imageEntities++;
      }
    });
  }
  assert(imageEntities > 0, `${route}: primary image missing from schema`);
  for (const url of record.images) {
    const relative = url.startsWith(origin) ? url.slice(origin.length) : url;
    const visibleRedirect = url === legacyImageTarget && (body(output).match(/<img\b[^>]*>/gi) || [])
      .map(attrs).some(image => image.src?.startsWith('/') && legacyImageRegex.test(image.src.slice(1)));
    assert(body(output).includes(relative) || body(output).includes(relative.replace(/&/g, '&amp;')) || visibleRedirect,
      `${route}: sitemap image is absent from the visible page: ${url}`);
  }
}
console.log('PASS: all 31 real main/Journal/standalone pages; exact social images and dimensions; valid image schema; idempotence; canonical, visible content, research facts and responsive hero behavior preserved.');

// Explicit restrictions must survive; the filter must not loosen crawl controls.
const sample = '<html><head>ROBOTS<link rel="canonical" href="https://velqnutrition.com/research"></head><body><main>Visible text</main></body></html>';
for (const name of ['robots', 'googlebot', 'bingbot']) {
  for (const rule of ['noindex,follow', 'none', 'noimageindex', 'nosnippet', 'max-image-preview:none', 'max-image-preview:standard']) {
    const tag = `<meta name="${name}" content="${rule}">`;
    const output = filter('/research', sample.replace('ROBOTS', tag));
    assert(head(output).includes(tag), `${name}: ${rule} restriction was changed`);
    assert(!head(output).includes('max-image-preview:large'), `${name}: ${rule} was contradicted`);
  }
}
const unrestricted = filter('/research', sample.replace('ROBOTS', '<meta name="robots" content="index,follow">'));
assert.deepEqual(metadata(unrestricted).get('robots'), ['index,follow,max-image-preview:large']);
assert.equal(filter('/research', unrestricted), unrestricted);
const absent = filter('/research', sample.replace('ROBOTS', ''));
assert.deepEqual(metadata(absent).get('robots'), ['max-image-preview:large']);

for (const [route, content] of [
  ['/api/waitlist', '{"ok":true,"newLead":true,"eventId":"local-example"}'],
  ['/api/waitlist', '{"ok":true,"newLead":false}'],
  ['/api/waitlist', '{"error":"Validation failed"}'],
  ['/analytics.js', 'window.existingAnalytics = true;'],
  ['/assets/example.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>'],
  ['/unknown-page', sample.replace('ROBOTS', '')],
  ['/robots.txt', 'User-agent: *\nAllow: /\n'],
  ['/research', 'Not found'],
]) {
  assert.equal(filter(route, content), content, `${route}: unrelated response changed`);
  if (!content.includes('<html')) assert.equal(filter(route, content, true), content, `${route}: integration changed response`);
}
console.log('PASS: explicit Google/Bing/general robots restrictions retained; APIs, scripts, robots.txt, assets and unknown responses unchanged.');

function sitemapEntries(xml) {
  return JSON.parse(php(`
    libxml_use_internal_errors(true);
    $xml=simplexml_load_string(file_get_contents('php://stdin'));
    if ($xml===false) throw new RuntimeException('Invalid sitemap XML');
    $xml->registerXPathNamespace('s', 'http://www.sitemaps.org/schemas/sitemap/0.9');
    $result=[];
    foreach ($xml->xpath('/s:urlset/s:url') as $url) {
      $s=$url->children('http://www.sitemaps.org/schemas/sitemap/0.9');
      $images=[];
      foreach ($url->children('http://www.google.com/schemas/sitemap-image/1.1')->image as $image) {
        $images[]=(string)$image->children('http://www.google.com/schemas/sitemap-image/1.1')->loc;
      }
      $result[]=['loc'=>(string)$s->loc, 'lastmod'=>isset($s->lastmod)?(string)$s->lastmod:null, 'images'=>$images];
    }
    echo json_encode($result);
  `, [], xml));
}

const baselineSitemap = renderRoute('/sitemap.xml', true), releaseSitemap = renderRoute('/sitemap.xml');
assert(baselineSitemap.includes('xmlns:ns1="' + imageNamespace + '"'), 'Review the generated sitemap namespace fixture');
assert(releaseSitemap.includes('xmlns:ns1="' + imageNamespace + '"'));
assert(!releaseSitemap.includes('xmlns:image='), 'Image namespace was duplicated rather than reused');
const beforeEntries = sitemapEntries(baselineSitemap), afterEntries = sitemapEntries(releaseSitemap);
assert.equal(new Set(afterEntries.map(item => item.loc)).size, afterEntries.length, 'Duplicate page URLs');
assert.deepEqual(afterEntries.map(({loc, lastmod}) => ({loc, lastmod})), beforeEntries.map(({loc, lastmod}) => ({loc, lastmod})),
  'Existing canonical URLs or dates changed');
for (const [route, record] of Object.entries(pages)) {
  const entry = afterEntries.find(item => item.loc === origin + route);
  assert(entry, `${route}: absent from production sitemap`);
  assert.equal(new Set(entry.images).size, entry.images.length, `${route}: duplicate sitemap image`);
  for (const image of record.images) assert(entry.images.includes(image), `${route}: mapped image missing from sitemap`);
  if (route === '/') assert(!entry.images.includes(origin + '/assets/velq-fruit-snacks-original.jpg'));
}
assert.equal(filter('/sitemap.xml', releaseSitemap), releaseSitemap, 'Sitemap pass is not idempotent');
sitemapEntries(fs.readFileSync('sitemap.xml', 'utf8'));

for (const prefix of ['image', 'ns1']) {
  const fixture = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:${prefix}="${imageNamespace}">`
    + `<url><loc>${origin}/research</loc><lastmod>2025-01-02</lastmod><${prefix}:image><${prefix}:loc>${origin}/keep.png</${prefix}:loc></${prefix}:image></url>`
    + `<url><loc>${origin}/tools/serving-comparison-calculator</loc><lastmod>2026-10-01</lastmod></url>`
    + `<url><loc>${origin}/tools/nutrition-label-value-calculator</loc><lastmod>2026-11-03</lastmod></url>`
    + `<url><loc>${origin}/unknown</loc><lastmod>2020-01-01</lastmod></url></urlset>`;
  const output = filter('/sitemap.xml', fixture), entries = sitemapEntries(output);
  assert.deepEqual(entries.map(item => item.loc), sitemapEntries(fixture).map(item => item.loc));
  assert.equal(entries[0].lastmod, '2025-01-02'); assert(entries[0].images.includes(origin + '/keep.png'));
  assert.equal(entries[1].lastmod, '2026-10-20'); assert.equal(entries[2].lastmod, '2026-11-03');
  assert.deepEqual(entries[3], {loc: origin + '/unknown', lastmod:'2020-01-01', images:[]});
  assert.equal(filter('/sitemap.xml', output), output);
}
const noImageNamespace = `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/tools/nutrition-label-value-calculator</loc></url></urlset>`;
assert.equal(sitemapEntries(filter('/sitemap.xml', noImageNamespace))[0].lastmod, '2026-10-20');
console.log('PASS: generated ns1 sitemap and static XML parse; canonical URLs and dates retained; old home alias replaced; existing images retained; calculator dates added/advanced without overwriting later edits.');

for (const [route, basename] of [
  ['/tools/serving-comparison-calculator', 'gummy-serving-label-guide'],
  ['/tools/nutrition-label-value-calculator', 'nutrition-label-value-guide'],
]) {
  const png = fs.readFileSync(`assets/discovery/${basename}.png`);
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Invalid PNG signature');
  assert.equal(png.readUInt32BE(16), 1200); assert.equal(png.readUInt32BE(20), 675);
  const svg = fs.readFileSync(`assets/discovery/${basename}.svg`, 'utf8');
  const svgAttributes = attrs(svg.match(/<svg\b[^>]*>/)[0]);
  const viewBox = svgAttributes.viewbox.split(/\s+/).map(Number);
  assert.equal(viewBox[0], 0); assert.equal(viewBox[1], 0);
  assert.equal(viewBox[2] / viewBox[3], 1200 / 675, 'Scalable SVG must preserve the PNG aspect ratio');
  assert.match(svg, /<title\b[^>]*>[\s\S]+?<\/title>/);
  assert.match(svg, /<text\b[^>]*>[\s\S]+?<\/text>/, 'SVG must retain readable text, not only outlines');
  const html = rendered.get(route);
  const figure = (body(html).match(/<figure\b[^>]*>[\s\S]*?<\/figure>/gi) || []).find(item => item.includes(basename));
  assert(figure, `${route}: visual guide has no visible figure`);
  assert.match(figure, /<figcaption>[\s\S]+?<\/figcaption>/);
  assert.match(figure, /fictional/i);
  assert(figure.includes(`href="/assets/discovery/${basename}.svg"`), `${route}: SVG alternative missing`);
  const image = attrs(figure.match(/<img\b[^>]*>/i)[0]);
  assert.equal(image.width, '1200'); assert.equal(image.height, '675');
  assert.equal(image.loading, 'lazy'); assert(image.alt.length > 40, `${route}: meaningful text alternative missing`);
}
console.log('PASS: both calculator guides have real 1200×675 PNGs and scalable SVGs with readable text, visible fictional examples, captions and lazy loading; no invented video metadata.');
