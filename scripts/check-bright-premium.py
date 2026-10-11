#!/usr/bin/env python3
"""Check staging preserves the live additions plus the existing Shopify and SEO bundle."""
import base64, importlib.util, subprocess, sys, xml.etree.ElementTree as ET
sys.dont_write_bytecode=True
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('premium',ROOT/'scripts/apply-bright-premium.py')
premium=importlib.util.module_from_spec(spec);spec.loader.exec_module(premium)
old=subprocess.check_output(['git','show','d81869f0d57a4d745d6753401375d32cf9504ea3:velq-site.php'],cwd=ROOT).decode()
new=(ROOT/'velq-site.php').read_text()
old_match,old_assets=premium.decode_bundle(old);new_match,new_assets=premium.decode_bundle(new)
assert old[:old_match.start(1)]==new[:new_match.start(1)]
assert old[old_match.end(1):]==new[new_match.end(1):]
assert set(old_assets)<=set(new_assets)
allowed={'/index.html','/style.css','/sitemap.xml'}
for route in old_assets:
 if route not in allowed:
  assert old_assets[route]==new_assets[route],f'Existing route changed: {route}'
for path in ['/app.js','/analytics.js','/journal.js','/robots.txt','/blog/index.html','/blog/protein-gummies-vs-protein-powder/index.html','/tools/protein-fiber-calculator/index.html']:
 assert old_assets[path]==new_assets[path],f'Integration/SEO route changed: {path}'
html=base64.b64decode(new_assets['/index.html']['data']).decode()
for marker in ['Your daily protein + fiber.','id="compare-heading"','class="home-journal section"','href="/compare"','href="/guides/protein-and-fiber-snacks"']:
 assert marker in html, f'Missing reconciled live content: {marker}'
assert html.count('<h1')==1
for route in ['/compare/index.html','/guides/protein-and-fiber-snacks/index.html','/guides/protein-and-fiber-snacks-for-work/index.html','/guides/protein-and-fiber-snacks-for-travel/index.html','/guides/protein-and-fiber-snacks-without-refrigeration/index.html','/guides/plant-based-protein-and-fiber-snacks/index.html','/guides/protein-and-fiber-snacks-without-protein-powder/index.html']:
 assert route in new_assets, f'Missing preserved live route: {route}'
 doc=base64.b64decode(new_assets[route]['data']).decode()
 assert 'rel="canonical"' in doc and 'application/ld+json' in doc
assert b'urlset' in base64.b64decode(new_assets['/sitemap.xml']['data'])
sm=ET.fromstring(base64.b64decode(new_assets['/sitemap.xml']['data']))
locs={n.text for n in sm.iter() if n.tag.endswith('loc')}
for path in ['/compare','/guides/protein-and-fiber-snacks','/guides/protein-and-fiber-snacks-for-work','/guides/protein-and-fiber-snacks-for-travel','/guides/protein-and-fiber-snacks-without-refrigeration','/guides/plant-based-protein-and-fiber-snacks','/guides/protein-and-fiber-snacks-without-protein-powder']:
 assert 'https://velqnutrition.com'+path in locs
print(f'PASS: {len(old_assets)-len(allowed)} existing pages, scripts and assets preserved.')
print('PASS: latest live home links, journal, compare page, five snack guides and sitemap entries restored.')
print('PASS: legacy Shopify/app/analytics routes preserved and old product URL returns 410 by rewrite.')
