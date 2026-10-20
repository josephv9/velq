#!/usr/bin/env python3
"""Rebuild the published study, CSV and exact chart from the dated JSON snapshot.

Uses standard library only. The optional --chart-png flag also renders a social
image with matplotlib; SVG and all tabulated values always share the same data.
Never fetches products, invents missing values or updates observation dates.
"""
from pathlib import Path
import argparse
import csv
import html
import json
import math

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/research'
DATA_PATH = ASSETS / 'gummy-labels-2026-10-20.json'
BASE = 'https://velqnutrition.com'
STUDY = '/research/gummy-serving-study-2026'
DATE = '2026-10-20'
TITLE = 'Protein & Fiber Gummies: 2026 Serving-Size Study'
DESCRIPTION = 'A dated label audit of seven protein and fiber gummies. Compare complete servings, fiber per gummy, source labels and downloadable research data.'
FDA = 'https://www.fda.gov/food/nutrition-facts-label/serving-size-nutrition-facts-label'

def esc(value):
    return html.escape(str(value), quote=True)

def number(value):
    if value is None:
        return 'Not reported'
    return f'{value:.2f}'.rstrip('0').rstrip('.')

def measured(row, key, suffix=' g'):
    value = row.get(key)
    qualifier = row.get('qualifiers', {}).get(key)
    if value is None:
        if qualifier == 'less_than_1g':
            return '&lt;1 g'
        return '<span class="research-small">Not reported</span>'
    return number(value) + suffix

def per_piece(row, key):
    value, pieces = row.get(key), row.get('pieces_per_serving')
    return value / pieces if isinstance(value, (int, float)) and isinstance(pieces, (int, float)) and pieces > 0 else None

def validate(data):
    assert data['version'] == DATE
    assert data['schema_version'] == '1.0.0'
    assert len(data['products']) >= 6
    seen = set()
    for row in data['products']:
        assert row['id'] not in seen
        seen.add(row['id'])
        assert row['brand'].lower() != 'velq', 'Unfinished formula must not enter study data'
        assert row['source_url'].startswith('https://')
        assert row['observed_at'].startswith(DATE)
        for key in ('pieces_per_serving', 'serving_mass_g', 'protein_g', 'fiber_g', 'sugars_g', 'added_sugars_g', 'calories_kcal', 'caffeine_mg'):
            value = row.get(key)
            assert value is None or (isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) and value >= 0), (row['id'], key)
        assert row.get('pieces_per_serving') != 0
        for key, qualifier in row.get('qualifiers', {}).items():
            if qualifier == 'less_than_1g':
                assert row.get(key) is None, 'A bound is not an exact value'

def schema(data, page_type='study'):
    org = {'@type':'Organization','name':'Velq Nutrition LLC','url':BASE+'/', 'logo':{'@type':'ImageObject','url':BASE+'/apple-touch-icon.png'}}
    if page_type == 'hub':
        return {'@context':'https://schema.org','@graph':[
            {'@type':'CollectionPage','@id':BASE+'/research#page','name':'Velq Research & Nutrition Calculators','url':BASE+'/research','description':'Source-backed gummy serving research, downloadable label data and free comparison calculators.','publisher':org,'hasPart':[{'@type':'WebPage','url':BASE+STUDY,'name':TITLE}]},
            {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':BASE+'/'},{'@type':'ListItem','position':2,'name':'Research','item':BASE+'/research'}]}
        ]}
    ds_id = BASE+STUDY+'#dataset'
    return {'@context':'https://schema.org','@graph':[
        {'@type':'Article','@id':BASE+STUDY+'#article','headline':TITLE,'description':DESCRIPTION,'url':BASE+STUDY,'mainEntityOfPage':BASE+STUDY,'datePublished':DATE,'dateModified':DATE,'author':org,'publisher':org,'image':BASE+'/assets/research/gummy-serving-comparison-2026.png','about':{'@id':ds_id}},
        {'@type':'Dataset','@id':ds_id,'name':'Velq protein and fiber gummy label snapshot — 20 October 2026','description':f"An original compilation of manufacturer-published nutrition information for {len(data['products'])} selected gummy products, observed on 20 October 2026. Includes product version, labeled serving, available piece count, protein, dietary fiber, sugars, calories, field qualifiers, source links and reproducible per-piece calculations. This is a non-random descriptive label audit, not laboratory testing or a clinical study. Velq development targets are excluded.",'url':BASE+STUDY,'identifier':'velq-gummy-labels-2026-10-20','version':DATE,'datePublished':DATE,'dateModified':DATE,'temporalCoverage':DATE,'creator':org,'isAccessibleForFree':True,'keywords':['protein gummies','fiber gummies','serving size','gummy nutrition labels','fiber per gummy'],'measurementTechnique':'Manual transcription of manufacturer label panels and product pages; arithmetic normalization to one gummy only where the piece count is published.','variableMeasured':['Labeled serving','Gummies per serving','Protein (g)','Dietary fiber (g)','Total sugars (g)','Added sugars (g)','Energy (kcal)'],'isBasedOn':[row['source_url'] for row in data['products']],'distribution':[{'@type':'DataDownload','encodingFormat':'application/json','contentUrl':BASE+'/assets/research/gummy-labels-2026-10-20.json'},{'@type':'DataDownload','encodingFormat':'text/csv','contentUrl':BASE+'/assets/research/gummy-labels-2026-10-20.csv'}]},
        {'@type':'BreadcrumbList','itemListElement':[{'@type':'ListItem','position':1,'name':'Home','item':BASE+'/'},{'@type':'ListItem','position':2,'name':'Research','item':BASE+'/research'},{'@type':'ListItem','position':3,'name':'Gummy serving study','item':BASE+STUDY}]}
    ]}

def page(title, description, path, body, graph, article=False):
    structured=json.dumps(graph,ensure_ascii=False,separators=(',',':')).replace('<','\\u003c')
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | Velq</title><meta name="description" content="{esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="{BASE+path}">
<meta property="og:type" content="{'article' if article else 'website'}"><meta property="og:site_name" content="Velq"><meta property="og:title" content="{esc(title)}"><meta property="og:description" content="{esc(description)}"><meta property="og:url" content="{BASE+path}"><meta property="og:image" content="{BASE}/assets/research/gummy-serving-comparison-2026.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="675"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#fffcec">
<link rel="icon" href="/favicon-32x32.png" type="image/png"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/assets/research/research.css">
<script src="/analytics-config.js" defer></script><script src="/analytics.js" defer></script><script src="/journal.js" defer></script><script src="/assets/research/research-events.js" defer></script>
<script type="application/ld+json">{structured}</script></head><body>
<a class="skip-link" href="#main">Skip to content</a><div class="announcement"><span>GET ON THE LIST.</span> Velq protein + fiber gummies are in development.</div>
<header class="header"><a class="wordmark" href="/" aria-label="Velq home">velq</a><nav class="desktop-nav" aria-label="Main navigation"><a href="/#products">Meet Velq</a><a href="/compare">Compare</a><a href="/blog">Journal</a><a href="/research" aria-current="{'page' if path=='/research' else 'false'}">Research</a><a href="/tools/serving-comparison-calculator">Calculators</a></nav><div class="header-actions"><a class="button nav-signup" href="/#waitlist" data-waitlist-cta="header">GET EARLY ACCESS</a><button class="icon-button menu-toggle" id="menu-toggle" aria-label="Open menu" aria-expanded="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button></div></header>
<nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation" hidden><a href="/#products">Meet Velq</a><a href="/compare">Compare</a><a href="/blog">Journal</a><a href="/research">Research</a><a href="/tools/serving-comparison-calculator">Calculators</a></nav>
<main id="main"><div class="research-wrap">{body}</div></main>
<footer><div class="footer-top"><a class="wordmark" href="/">velq</a><p>More from your everyday.<br>Less from your routine.</p><nav aria-label="Footer navigation"><a href="/research">Research</a><a href="/compare">Compare</a><a href="/blog">Journal</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a></nav></div><div class="footer-bottom"><span>© 2026 Velq Nutrition LLC</span><span>Products in development. Final labeling and availability may change.</span></div></footer></body></html>
'''

def downloads():
    return '''<div class="research-actions"><a class="research-button" href="/assets/research/gummy-labels-2026-10-20.csv" download data-research-download="csv">Download label data (CSV)</a><a class="research-button secondary" href="/assets/research/gummy-labels-2026-10-20.json" download data-research-download="json">Download JSON</a></div>'''

def cta():
    return '''<aside class="research-cta"><p class="research-kicker">VELQ · IN DEVELOPMENT</p><h2>Compare the finished label when it is ready.</h2><p>Velq is developing strawberry protein + fiber gummies. Its formula, price and availability are still being finalized, so Velq targets are excluded from this dataset. Join the free launch list for the final product details.</p><a class="research-button" href="/#waitlist" data-waitlist-cta="article-end">Get Velq launch updates</a></aside>'''

def chart(rows):
    # Fixed coordinates, exact values; the complete table also remains in HTML.
    width,height=1200,675
    colors=['#ae3830','#295b46']
    pieces = [r for r in rows if per_piece(r,'fiber_g') is not None]
    out=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">Fiber per labeled serving and per gummy</title><desc id="desc">Four selected fiber gummy products, based on manufacturer information checked 20 October 2026. Values are label arithmetic, not an efficacy ranking.</desc><rect width="1200" height="675" fill="#fffcec"/><g font-family="Arial,sans-serif" fill="#23372b"><text x="48" y="56" font-size="16" font-weight="bold" letter-spacing="2">VELQ RESEARCH · OCTOBER 2026</text><text x="48" y="104" font-size="36" font-weight="bold">A serving is not always one gummy.</text><text x="48" y="137" font-size="18">Four selected fiber gummy products · exact serving basis shown in the study</text>']
    for i,(key,title,scale,x) in enumerate([('fiber_g','Fiber per labeled serving',8,50),('per_piece','Fiber per gummy',3,640)]):
        out.append(f'<text x="{x}" y="192" font-size="23" font-weight="bold">{title}</text>')
        for j,r in enumerate(pieces):
            v=per_piece(r,'fiber_g') if key=='per_piece' else r['fiber_g']
            y=226+j*82
            label=r['brand']
            portion=number(r['pieces_per_serving'])+' gummies'
            out.append(f'<text x="{x}" y="{y}" font-size="17">{esc(label)} <tspan fill="#5e685e" font-size="14">({esc(portion)})</tspan></text><rect x="{x}" y="{y+12}" width="{v/scale*430:.2f}" height="23" fill="{colors[i]}" rx="3"/><text x="{x+v/scale*430+10:.2f}" y="{y+30}" font-size="17" font-weight="bold">{number(v)} g</text>')
    out.append('<text x="48" y="600" font-size="16">Source: manufacturer label panels and product pages · observed 20 October 2026 (UTC).</text><text x="48" y="629" font-size="15" fill="#5e685e">Selected sample, not a market average. Per-gummy figures are arithmetic, not suggested doses.</text></g></svg>')
    (ASSETS/'gummy-serving-comparison-2026.svg').write_text(''.join(out))

def chart_png(rows):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11})
    fig,axs=plt.subplots(1,2,figsize=(12,6.75),dpi=100,facecolor='#fffcec')
    fig.subplots_adjust(left=.15,right=.96,bottom=.22,top=.68,wspace=.56)
    fig.text(.055,.92,'VELQ RESEARCH  /  OCTOBER 2026',fontsize=12,weight='bold',color='#a22d29')
    fig.text(.055,.83,'A serving is not always one gummy.',fontsize=27,weight='bold',color='#23372b')
    fig.text(.055,.775,'Four selected fiber gummy products • same source snapshot, two serving bases',fontsize=12,color='#535f53')
    eligible=[r for r in rows if per_piece(r,'fiber_g') is not None]
    for i,ax in enumerate(axs):
        values=[r['fiber_g'] if i==0 else per_piece(r,'fiber_g') for r in eligible]
        ys=list(range(len(eligible)))
        ax.set_facecolor('#fffcec')
        ax.barh(ys,values,color='#ae3830' if i==0 else '#295b46',height=.36)
        ax.set_yticks(ys,labels=[r['brand']+'\n'+number(r['pieces_per_serving'])+' gummies' for r in eligible],fontsize=10)
        ax.invert_yaxis();ax.set_xlim(0,9.2 if i==0 else 3.5)
        ax.set_title('Fiber per labeled serving' if i==0 else 'Fiber per gummy',loc='left',pad=17,fontsize=14,weight='bold')
        ax.set_xticks([]);ax.tick_params(left=False)
        for spine in ax.spines.values():spine.set_visible(False)
        for y,v in zip(ys,values):ax.text(v+(.13 if i==0 else .05),y,number(v)+' g',va='center',fontsize=11,weight='bold',color='#23372b')
    fig.text(.055,.13,'Manufacturer label panels and product pages, checked 20 October 2026 (UTC).',fontsize=10,color='#465746')
    fig.text(.055,.088,'Selected sample; no laboratory testing. Per-gummy values are arithmetic, not suggested doses.',fontsize=10,color='#465746')
    fig.savefig(ASSETS/'gummy-serving-comparison-2026.png',dpi=100,facecolor=fig.get_facecolor())
    plt.close(fig)

def study(data):
    rows=data['products'];fiber=[r for r in rows if r['category']=='fiber-gummy'];protein=[r for r in rows if r['category']=='protein-gummy']
    exact_fiber=[r['fiber_g'] for r in fiber if isinstance(r.get('fiber_g'),(int,float))]
    counts=[r['pieces_per_serving'] for r in fiber if isinstance(r.get('pieces_per_serving'),(int,float))]
    assert len(fiber)==4, 'Review narrative before changing cohort size'
    body=f'''<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / <a href="/research">Research</a> / Gummy serving study</nav>
<header class="research-hero"><p class="research-kicker">ORIGINAL LABEL RESEARCH · VERSION {DATE}</p><h1>{TITLE}</h1><p class="research-dek">How much protein or fiber is in a full serving—and how much is in one gummy? We recorded the manufacturer-published information for {len(rows)} selected products and made the serving math reproducible.</p><p class="research-meta">Compiled by <a href="/#story">Velq Nutrition LLC</a> · Published and sources checked <time datetime="2026-10-20">October 20, 2026</time> (UTC) · Descriptive label audit</p><ul class="research-pills"><li>{len(rows)} exact product versions</li><li>Primary manufacturer sources</li><li>Free CSV + JSON</li><li>No email required</li></ul>{downloads()}</header>
<div class="research-summary" aria-label="Study facts"><div class="research-stat"><p class="research-kicker">OBSERVED PRODUCTS</p><strong>{len(rows)}</strong><p>{len(fiber)} fiber gummies and {len(protein)} protein gummies. Selected examples, not a random market sample.</p></div><div class="research-stat"><p class="research-kicker">FIBER-GUMMY SERVINGS</p><strong>{number(min(counts))}–{number(max(counts))}</strong><p>Gummies in the serving basis used for the {len(counts)} fiber products. One piece is not the full serving.</p></div><div class="research-stat"><p class="research-kicker">FIBER PER SERVING</p><strong>{number(min(exact_fiber))}–{number(max(exact_fiber))} g</strong><p>Published dietary fiber in the selected serving of each of the {len(exact_fiber)} fiber-gummy products.</p></div></div>
<p class="research-note"><strong>What this research measures:</strong> published label information and serving arithmetic. Velq is developing a competing gummy product. We did not purchase or laboratory-test these products, verify clinical outcomes or rank them by effectiveness. Velq development targets are excluded from every data row and calculation.</p>
<nav class="research-nav" aria-label="Study sections"><a href="#findings">Findings</a><a href="#label-table">Serving data</a><a href="#methodology">Methodology</a><a href="#sources">Source notes</a><a href="#cite">Cite or download</a></nav>
<section class="research-section" id="findings"><h2>What changes when you compare one gummy?</h2><p>Metamucil and OLLY both report <strong>5 g of dietary fiber</strong> in the serving used here. Metamucil uses three gummies; OLLY uses two. Dividing by the piece count gives approximately <strong>1.67 g versus 2.5 g per gummy</strong>. The advertised fiber amount can match even when the number of pieces differs. <a href="#sources">See manufacturer sources below.</a></p><p>Vitafusion Fiber Well publishes a panel with two serving columns: 5 g fiber for two gummies and 7.5 g for three. Both normalize to 2.5 g per gummy. We use the three-gummy column highlighted on the product page. The two columns alone do not establish a formula change.</p>
<figure class="research-figure"><img src="/assets/research/gummy-serving-comparison-2026.svg" width="1200" height="675" alt="Fiber per labeled serving and per gummy for the four fiber gummy products. All exact figures are in the next table." loading="lazy" decoding="async"><figcaption>Same source snapshot, two different denominators. The left panel uses each product’s selected complete serving; the right divides that value by its published piece count. This comparison does not establish differences in fiber type, tolerance or clinical effect.</figcaption></figure>
<h3>Why the product version matters</h3><p>The OAKA source in this snapshot is the current Mixed Berry pouch product. It establishes nutrients per pouch, but the inspected page and label do not establish an exact gummy count. We therefore leave its per-gummy figures blank. Combining that pouch with the eight-gummy serving of an older product listing would create a serving that the sources do not support.</p><p>To compare your own package, open the <a href="/tools/serving-comparison-calculator">serving comparison calculator</a>. Use the serving and nutrient numbers from the same label. The <a href="{FDA}">FDA explains that a Nutrition Facts serving size is not an instruction for how much to eat</a>; supplement directions also need to be followed.</p></section>
<section class="research-section" id="label-table"><h2>Published nutrients per complete labeled serving</h2><p>All figures below belong to the exact product and serving shown. “Not reported” means the inspected source did not establish that field; it does not mean zero. A value such as “&lt;1 g” stays a bound, not an exact measurement. Brand source links are attached to every row.</p>'''
    for cohort,label in [(fiber,'Fiber gummy products'),(protein,'Protein gummy products')]:
        body+=f'<div class="research-table-scroll" role="region" tabindex="0" aria-label="{label}; scroll horizontally"><table class="research-table"><caption>{label} · manufacturer information checked 20 October 2026 (UTC)</caption><thead><tr><th scope="col">Exact product / source</th><th scope="col">Serving basis</th><th scope="col">Protein</th><th scope="col">Dietary fiber</th><th scope="col">Total sugars</th><th scope="col">Calories</th><th scope="col">Fiber / gummy</th></tr></thead><tbody>'
        for row in cohort:
            i=rows.index(row)+1
            piece=per_piece(row,'fiber_g')
            body+=f'<tr data-product-id="{esc(row["id"])}"><th scope="row">{esc(row["product_name"])}<small><a href="#source-{esc(row["id"])}">Source {i} + notes</a></small></th><td>{esc(row["serving_label"])}'+(f'<small>{number(row["serving_mass_g"])} g serving mass</small>' if row.get('serving_mass_g') is not None else '')+f'</td><td class="numeric">{measured(row,"protein_g")}</td><td class="numeric">{measured(row,"fiber_g")}</td><td class="numeric">{measured(row,"sugars_g")}</td><td class="numeric">{measured(row,"calories_kcal"," kcal")}</td><td class="numeric">{number(piece)+" g" if piece is not None else "Not calculable"}</td></tr>'
        body+='</tbody></table></div>'
    body+='''<p class="research-small">Per-gummy values are rounded to two decimal places for display, using the unrounded division internally. Nutrient values inherit the manufacturer’s label rounding. The full download also records added sugars when established, source type, qualifiers and limitations. No competitor prices or serving-frequency recommendations are included.</p></section>
<section class="research-section" id="methodology"><h2>Methodology you can reproduce</h2><dl class="research-method"><dt>Research question</dt><dd>How do the published full-serving and per-piece nutrient amounts differ across selected protein and fiber gummies?</dd><dt>Sample selection</dt><dd>Purposive examples related to Velq’s existing protein and fiber gummy comparison pages: four fiber-gummy and three protein-gummy products with accessible manufacturer information. This is not a comprehensive market census or a representative sample.</dd><dt>Observation</dt><dd>Manufacturer product pages and linked label images inspected on 20 October 2026 (UTC). Each row identifies the exact variant and the primary source. A website statement and a readable label panel are recorded as different evidence types.</dd><dt>Transcription</dt><dd>Copy only established serving values from a matching product version. A blank field becomes JSON null and an empty CSV cell. Less-than statements are stored as qualifiers with no invented exact number. A zero is entered only when the source reports zero.</dd><dt>Normalization</dt><dd>Per gummy = labeled grams ÷ gummies in that labeled serving. Only rows with both an exact numerator and a verified nonzero piece count enter per-gummy comparisons. We do not borrow counts, calories or grams from another SKU.</dd><dt>Summary denominator</dt><dd>The serving-size and dietary-fiber range above use only the four fiber-gummy rows. The three protein-gummy rows are shown separately. Different source ingredients are not treated as clinically interchangeable.</dd><dt>Exclusions</dt><dd>Velq’s development formula, unverified prices, consumer reviews and clinical outcomes are excluded. PROTEDY was considered but its live source could not be reliably retrieved during this observation, so cached search figures were not added to the primary dataset. OAKA’s piece count is excluded from normalization.</dd><dt>Limitations</dt><dd>Manufacturer claims have not been independently verified against a purchased package or laboratory analysis. Websites and labels can contain inconsistencies or change after this snapshot. A higher number is not a general product recommendation. Sampling and commercial affiliation limit how these findings can be interpreted.</dd><dt>Reproduction</dt><dd>Download the dated JSON or CSV. Divide each available fiber or protein amount by its matching piece count, leaving unavailable or bounded values uncalculated. The study table and chart are generated from the same JSON snapshot.</dd></dl></section>
<section class="research-section" id="sources"><h2>Primary sources and product-version notes</h2><p>Check the current package before a purchase. Links below let you inspect the evidence behind each row, including the full label when one was accessible.</p><ol class="research-sources">'''
    for i,row in enumerate(rows,1):
        notes=row.get('notes','')
        if isinstance(notes,list):notes=' '.join(notes)
        body+=f'<li id="source-{esc(row["id"])}"><strong>{i}. {esc(row["product_name"])}</strong><p>{esc(notes)}</p><p class="research-small">Evidence: {"manufacturer label panel" if row["source_kind"]=="label-panel" else "manufacturer product-page statement"} · observed {esc(row["observed_at"])}.</p><div class="research-source-links"><a href="{esc(row["source_url"])}" rel="noopener noreferrer">Official product page ↗</a>'
        if row.get('label_url'):body+=f'<a href="{esc(row["label_url"])}" rel="noopener noreferrer">Source label panel ↗</a>'
        body+='</div></li>'
    citation=f'Velq Nutrition LLC. (2026, October 20). {TITLE}. Label snapshot version 2026-10-20. {BASE+STUDY}'
    body+=f'''</ol><p class="research-small">Method reference: <a href="{FDA}">FDA, Serving Size on the Nutrition Facts Label</a>. Product facts remain attributable to the manufacturers; the selection, normalization and analysis are Velq’s work.</p></section>
<section class="research-section" id="cite"><h2>Cite the study or reuse the figures</h2><p>Include the exact product, serving basis, observation date and source when citing a figure. The study URL stays the reference page; the dated downloads identify this specific snapshot.</p><div class="research-citation"><p class="research-kicker">SUGGESTED CITATION</p><blockquote id="citation-text">{esc(citation)}</blockquote><button class="research-button" type="button" data-copy-citation="citation-text" data-copy-status="citation-status">Copy citation</button><p id="citation-status" role="status" aria-live="polite"></p></div>{downloads()}<p class="research-small">Correction requests: <a href="/contact/">contact Velq</a> with the product, country/variant and current official label URL. Substantive corrections should receive a new dated snapshot and an explanatory change note. This initial version was compiled on 20 October 2026.</p></section>
<section class="research-section"><h2>Use the numbers for your own comparison</h2><div class="research-grid"><article class="research-card"><p class="research-kicker">SERVING TOOL</p><h3>Compare a serving, a gummy or your portion.</h3><p>Start from verified study rows or enter your own label. Unknown fields stay unknown.</p><a href="/tools/serving-comparison-calculator">Open serving comparison calculator →</a></article><article class="research-card"><p class="research-kicker">COST TOOL</p><h3>Compare price on the same basis.</h3><p>Enter today’s actual price and package serving count to calculate cost per serving and nutrient amount.</p><a href="/tools/nutrition-label-value-calculator">Open nutrition-label value calculator →</a></article></div><p>For shopping context, read the <a href="/blog/protein-gummies-with-fiber-comparison">protein gummies with fiber comparison</a>, the <a href="/blog/best-fiber-gummies-2026">fiber-gummy buyer shortlist</a> and the <a href="/blog/protein-and-fiber-gummies-buying-guide">label buying checklist</a>.</p></section>
<section class="research-section research-faq"><h2>Questions about these findings</h2><details><summary>Does “per gummy” tell me how many gummies to take?</summary><p>No. It is a mathematical restatement of the published serving. Follow the product directions and do not use normalized amounts to work out a supplement dose.</p></details><details><summary>Why does this study leave some numbers blank?</summary><p>A missing nutrient or serving count is not evidence of zero. A number is calculated only when the exact inputs are established by the source for the same product version.</p></details><details><summary>Is this independent clinical or laboratory research?</summary><p>No. This is Velq’s original compilation and descriptive analysis of manufacturer-published information. Velq has a commercial interest in this category. No effectiveness, absorption, tolerance or ingredient-purity findings are established.</p></details><details><summary>Why are Velq’s proposed grams not in the table?</summary><p>Velq is still in development. An unfinished target formula cannot be compared as if it were a verified commercial label.</p></details></section>{cta()}'''
    return page(TITLE,DESCRIPTION,STUDY,body,schema(data),True)

def hub(data):
    body=f'''<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a> / Research</nav><header class="research-hero"><p class="research-kicker">THE VELQ RESEARCH DESK</p><h1>Useful numbers.<br>Visible sources.</h1><p class="research-dek">Explore original label research and free calculators for protein and fiber gummies. Start with the complete serving, inspect the sources, then compare the numbers that matter to you.</p><ul class="research-pills"><li>Open data</li><li>Clear methodology</li><li>Free tools</li></ul></header><section class="research-section"><p class="research-kicker">LATEST RESEARCH · 20 OCTOBER 2026</p><h2>{TITLE}</h2><p>Seven exact product versions, four fiber-gummy examples and three protein-gummy examples. See how published nutrients change when expressed per serving or per gummy, with source notes for every row.</p><figure class="research-figure"><a href="{STUDY}"><img src="/assets/research/gummy-serving-comparison-2026.svg" width="1200" height="675" alt="Preview of the 2026 gummy serving-size study: fiber per complete serving compared with fiber per gummy." loading="lazy" decoding="async"></a><figcaption>The same nutrient claim can refer to different numbers of gummies. See the exact label basis in the study.</figcaption></figure><a class="research-button" href="{STUDY}">Read the original study</a>{downloads()}</section><section class="research-section"><h2>Free serving and label calculators</h2><div class="research-grid"><article class="research-card"><p class="research-kicker">PORTIONS</p><h3>Serving comparison calculator</h3><p>Compare two products per full serving, per piece and per portion. Load an observed label or enter your own figures.</p><a href="/tools/serving-comparison-calculator">Compare serving sizes →</a></article><article class="research-card"><p class="research-kicker">VALUE</p><h3>Nutrition-label value calculator</h3><p>Use current package prices and serving counts to compare cost per serving, per 10 g protein and per 5 g fiber.</p><a href="/tools/nutrition-label-value-calculator">Compare label value →</a></article></div><p>Planning your overall intake? The existing <a href="/tools/protein-fiber-calculator">protein and fiber calculator</a> explains its assumptions separately.</p></section><section class="research-section"><h2>How we publish research</h2><p>Every numerical product row needs an identifiable source, exact variant and observation date. We distinguish reported zero from missing information and label bounds. Our original work is the data compilation and analysis; a manufacturer claim does not become a laboratory finding because it appears here.</p><p>Velq is developing a gummy product and has a commercial interest in this category. Its development targets are excluded from the current research sample. Read the study’s <a href="{STUDY}#methodology">full methodology and limits</a> and the <a href="/blog/editorial-policy">editorial policy</a>.</p></section>{cta()}'''
    return page('Research & Nutrition Calculators','Explore Velq’s original gummy serving research, source-linked label data and free protein, fiber and cost comparison calculators.','/research',body,schema(data,'hub'))

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--chart-png',action='store_true');args=parser.parse_args()
    data=json.loads(DATA_PATH.read_text());validate(data)
    rows=data['products']
    columns=['id','brand','product_name','category','serving_label','pieces_per_serving','serving_mass_g','protein_g','fiber_g','sugars_g','added_sugars_g','calories_kcal','caffeine_mg','fiber_per_gummy_g','protein_per_gummy_g','qualifiers','source_url','label_url','source_kind','observed_at','notes']
    with (ASSETS/'gummy-labels-2026-10-20.csv').open('w',newline='') as stream:
        writer=csv.DictWriter(stream,fieldnames=columns,lineterminator='\n');writer.writeheader()
        for row in rows:
            item={key:row.get(key) for key in columns}
            item['qualifiers']=json.dumps(row.get('qualifiers',{}),ensure_ascii=False,sort_keys=True)
            if isinstance(item['notes'],list):item['notes']=' '.join(item['notes'])
            item['fiber_per_gummy_g']=per_piece(row,'fiber_g');item['protein_per_gummy_g']=per_piece(row,'protein_g')
            writer.writerow(item)
    for path,content in [('research/index.html',hub(data)),('research/gummy-serving-study-2026/index.html',study(data))]:
        dest=ROOT/path;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(content)
    fiber=[r for r in rows if r['category']=='fiber-gummy']
    chart(fiber)
    if args.chart_png:chart_png(fiber)
    print(f'Built research hub, study, CSV and chart from {len(rows)} observed rows.')

if __name__=='__main__':main()
