#!/usr/bin/env python3
"""Build editorial additions without changing the homepage or signup backend."""
import base64,gzip,html,json,re,subprocess,xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT.parent/'Velq_Blog_Growth_Pack'
OUTPUT.mkdir(exist_ok=True)
src=(ROOT/'velq-site.php').read_text()
base=json.loads(base64.b64decode(re.search(r"\$assets=json_decode\(base64_decode\('([^']+)'\),true\);",src)[1]))
BASELINE='1ecbe243c812e08d25cb39d2d382aee13966c425'
def original(path):
 return subprocess.check_output(['git','show',BASELINE+':'+path],cwd=ROOT,text=True)
router=original('nutrition-content.php')
delta=json.loads(gzip.decompress(base64.b64decode(re.search(r"base64_decode\('([^']+)'",router)[1])))
assets={**base,**delta}
def get(k):return base64.b64decode(assets[k]['data']).decode()
def put(k,s,mime='text/html; charset=utf-8'):assets[k]={'type':mime,'data':base64.b64encode(s.encode()).decode()}
def esc(t):return html.escape(t,quote=True)

# A primary intent per page; these are intent targets, not invented search-volume estimates.
MAP=[
('protein-vs-fiber-why-your-body-needs-both','protein vs fiber','Protein','Different jobs: compare the two nutrients, not competing products.','Protein and fiber do different jobs. Build meals with both.','Pair a protein food with a fiber-containing plant food.','Use meals as your foundation; supplements are optional.'),
('how-much-fiber-do-you-need-every-day','how much fiber per day','Fiber','Daily intake guidance; link to the practical 30g planner for meal examples.','A daily fiber number is only the starting point.','Choose a target appropriate to your age, diet, health, and tolerance.','Increase gradually instead of changing everything overnight.'),
('caffeine-gummies-vs-coffee-whats-the-difference','caffeine gummies vs coffee','Energy','Compare labeled dose, coffee variability, timing and ingredients.','Coffee and caffeine gummies are different formats.','Compare the amount of caffeine in the portion you actually use.','Check timing, other caffeine sources, and your own tolerance.'),
('how-much-protein-do-you-actually-need','how much protein per day','Protein','Explain daily needs; distinguish from muscle-building meal implementation.','A protein goal should fit the person.','Body size, activity, health, and overall diet all matter.','Translate a suitable target into foods you can eat consistently.'),
('simple-daily-wellness-routine-that-sticks','simple daily wellness routine','Protein','Habit formation, rather than supplement comparison.','A wellness routine should fit an ordinary day.','Choose one manageable meal, movement, or sleep habit.','Repeat it before adding another complicated rule.'),
('protein-gummies-vs-protein-bars','protein gummies vs protein bars','Protein','Format comparison; use real labels rather than unsupported category averages.','Protein gummies or a protein bar? Start with the label.','Compare a full serving, protein source, fiber, and other ingredients.','Choose the format that fits the occasion and your needs.'),
('caffeine-gummies-vs-energy-drinks','caffeine gummies vs energy drinks','Energy','Compare caffeine dose and full ingredients, not promised speed or performance.','An energy label does not tell the whole story.','Check caffeine per serving and the full ingredient list.','Count every caffeine source across the day.'),
('protein-and-fiber-gummies-vs-separate-supplements','combined protein and fiber gummies vs separate supplements','Protein','Bundled ingredients versus independent dose control.','One combined product or separate ingredients?','A combined format can be convenient; separate products allow more control.','Check the amounts and whether you want every ingredient.'),
('protein-and-fiber-gummies-buying-guide','protein and fiber gummies buying guide','Protein','General buying checklist; distinguish from the named-product comparison.','Before buying gummies, compare a complete serving.','Check protein source, fiber type, caffeine, allergens, and price.','Mark missing label information as unknown instead of guessing.'),
('fiber-gummies-vs-psyllium-husk','fiber gummies vs psyllium husk','Fiber','Ingredient-versus-format comparison; no universal symptom-treatment claim.','Psyllium and fiber gummies are not automatically equivalent.','Read the named fiber ingredient and the grams per serving.','Follow directions and discuss persistent symptoms with a clinician.'),
('caffeine-l-theanine-vs-caffeine','caffeine and l theanine vs caffeine','Energy','Explain evidence and limits; avoid blanket calm-focus promises.','Caffeine plus L-theanine: check the evidence and the dose.','An ingredient study is not proof that every combined product works.','Look at caffeine timing and the full finished-product label.'),
('best-fiber-gummies-2026','best fiber gummies 2026','Fiber','Current named-product shortlist, distinct from the general adults checklist.','The best fiber gummy depends on what you need.','Compare the named fiber, serving size, directions, and price.','A higher number is not automatically a better fit.'),
('protein-gummies-with-fiber-comparison','protein gummies with fiber comparison','Protein','Named products and verifiable label data; no generic format winner.','Compare protein gummies with fiber using real label facts.','Use the same complete-serving basis for each product.','Separate verified facts from prelaunch targets.'),
('protein-gummies-for-adults','protein gummies for adults','Protein','Adult suitability and buying checklist, not a duplicate brand ranking.','Adult protein gummies still need a full-label check.','Look for protein source, serving directions, allergens, and caffeine.','Small format does not mean suitable for everyone.'),
('fiber-gummies-for-adults-guide','fiber gummies for adults','Fiber','Adult ingredient and tolerance education, not a ranked shortlist.','Fiber gummies vary in more than flavor.','Compare the ingredient, grams, serving count, and directions.','Choose based on your needs and tolerance.'),
('fiber-gummies-vs-fiber-powder','fiber powder vs gummies','Fiber','Powder-versus-gummy format and cost; keep separate from ingredient-specific psyllium.','Fiber powder or gummies? Compare more than convenience.','The fiber ingredient and full serving matter more than the format alone.','Read water directions, other ingredients, and cost per serving.'),
('high-protein-high-fiber-snacks-no-refrigeration','high protein high fiber snacks no refrigeration','Protein','Shelf-stable combinations with storage guidance; distinguish from the shorter travel guide.','Need protein and fiber without a fridge?','Pair shelf-stable protein foods with fruit or whole grains.','Check storage directions after opening and avoid hot-car storage.'),
('30-grams-fiber-high-protein-diet','30 grams of fiber a day high protein diet','Fiber','Practical example day and editable planner, not another general daily-needs article.','Protein goals do not have to crowd out fiber.','Add a fiber source to meals you already enjoy.','Use a manageable example day and increase gradually.'),
('build-muscle-without-protein-shakes','build muscle without protein shakes','Protein','Food-first implementation, distinct from daily-protein target guidance.','You do not need a shaker bottle to plan protein.','Use foods you enjoy and can prepare consistently.','Keep strength training, overall food intake, and recovery in the plan.'),
('portion-sizes-muscle-gain-without-counting-calories','portion sizes for muscle gain','Protein','Visual meal structure and deliberate adjustment process.','Muscle-gain portions do not have to mean tracking every bite.','Start with a repeatable meal structure.','Review training, recovery, and appetite before changing everything.'),
('what-to-eat-glp1-not-hungry','what to eat on glp1 when not hungry','GLP-1','Low-appetite meal structure; avoid duplicate snack list.','Not hungry on a GLP-1? Nutrition still matters.','Discuss smaller, manageable meals with your care team.','Report persistent inability to eat or drink; do not self-adjust medication.'),
('glp1-protein-snacks-without-shakes','glp1 protein snacks without shakes','GLP-1','Food alternatives to shakes with actual-portion label arithmetic.','Tired of shakes while taking a GLP-1?','Consider manageable portions of foods such as yogurt, eggs, or tofu.','Protein amount and tolerance vary; personalize with your care team.'),
('glp1-constipation-fiber','glp1 constipation fiber','GLP-1','Fiber tolerance, hydration and red flags; no gummy cure claim.','Constipated on a GLP-1? More fiber is not always the next step.','Sudden increases can worsen bloating or fullness.','Persistent or severe symptoms need clinical advice.'),
('maintain-muscle-glp1-low-appetite','maintain muscle on glp1 low appetite','GLP-1','Muscle preservation during treatment, distinct from general muscle gain.','Weight loss is only part of the picture.','Discuss adequate nutrition and appropriate strength training.','Protein alone does not guarantee muscle preservation.'),
('tired-on-glp1-food-fluids-causes','tired on glp1 food fluids','GLP-1','Fatigue discussion checklist, not caffeine-based treatment.','Tired on a GLP-1? Look beyond another coffee.','Review food, fluids, sleep, symptoms, and medication timing with your clinician.','Fatigue has several possible causes; do not assume a deficiency.')
]
items=[]
for slug,keyword,cluster,intent,hook,tip1,tip2 in MAP:
 key='/blog/'+slug+'/index.html'
 if key not in assets:put(key,original(key.lstrip('/')))
 s=get(key)
 title=html.unescape(re.search(r'<h1[^>]*>(.*?)</h1>',s,re.S)[1]);title=re.sub('<[^>]+>','',title)
 items.append(dict(slug=slug,keyword=keyword,cluster=cluster,intent=intent,title=title,hook=hook,tip1=tip1,tip2=tip2))

titles={
 'protein-gummies-vs-protein-bars':'Protein Gummies vs Protein Bars: Label Comparison | Velq',
 'fiber-gummies-vs-psyllium-husk':'Fiber Gummies vs Psyllium Husk: Types & Doses | Velq',
 'high-protein-high-fiber-snacks-no-refrigeration':'High-Protein, High-Fiber Snacks: No Fridge Needed | Velq',
 '30-grams-fiber-high-protein-diet':'30 Grams of Fiber a Day on a High-Protein Diet | Velq',
 'what-to-eat-glp1-not-hungry':'What to Eat on a GLP-1 When You’re Not Hungry | Velq',
 'glp1-protein-snacks-without-shakes':'GLP-1 Protein Snacks Without Shakes: 7 Options | Velq',
 'tired-on-glp1-food-fluids-causes':'Tired on a GLP-1? Food, Fluids & When to Get Help | Velq'
}
def link(i):return '<a href="/blog/'+i['slug']+'">'+esc(i['title'])+'</a>'
resource='/assets/growth/nutrition-workbook.html'
for i,item in enumerate(items):
 key='/blog/'+item['slug']+'/index.html';s=get(key)
 if item['slug'] in titles:
  t=titles[item['slug']];s=re.sub(r'<title>.*?</title>','<title>'+esc(t)+'</title>',s,flags=re.S)
  s=re.sub(r'(<meta property="og:title" content=")[^"]*(")',lambda m:m[1]+esc(t)+m[2],s)
 # Medical authorship is disclosed, never fabricated.
 policy='<section class="growth-editorial"><h2>How this article was prepared</h2><p>Published by <a href="/blog/editorial-policy">Velq Editorial</a>, the brand’s editorial byline. Read our sourcing, AI-assistance, and correction policy. This article is educational and has not been independently clinically reviewed.</p></section>'
 same=[a for a in items if a['cluster']==item['cluster'] and a['slug']!=item['slug']]
 # Ensure established articles send readers into new resources and vice versa.
 priority={'Protein':['high-protein-high-fiber-snacks-no-refrigeration','build-muscle-without-protein-shakes','portion-sizes-muscle-gain-without-counting-calories'], 'Fiber':['30-grams-fiber-high-protein-diet','glp1-constipation-fiber'], 'GLP-1':['what-to-eat-glp1-not-hungry','glp1-protein-snacks-without-shakes','maintain-muscle-glp1-low-appetite'], 'Energy':['tired-on-glp1-food-fluids-causes','caffeine-l-theanine-vs-caffeine']}
 chosen=[]
 for slug in priority[item['cluster']]+[a['slug'] for a in same]:
  if slug!=item['slug'] and slug not in [a['slug'] for a in chosen]:chosen.append(next(a for a in items if a['slug']==slug))
  if len(chosen)==3:break
 related='<section class="growth-related"><h2>Explore the next question</h2>'+''.join('<p>'+link(a)+'</p>' for a in chosen)+'</section>'
 if item['cluster']=='GLP-1':
  intro='<aside class="growth-invite"><p class="eyebrow">CURIOUS ABOUT VELQ?</p><p>We’re developing a portable protein + fiber gummy. Get launch updates and review the final label when available. The planned caffeine and fiber may not suit your treatment or symptoms; ask your clinician.</p><a class="button button-dark" href="/#waitlist" data-waitlist-cta="article-intro">Get Velq launch updates ↗</a></aside>'
 else:
  intro='<aside class="growth-invite"><p class="eyebrow">MAKE NUTRITION FIT YOUR DAY</p><p>Curious about a portable protein + fiber format? Velq’s strawberry gummies are in development. Join for launch news and your first chance to shop.</p><a class="button button-dark" href="/#waitlist" data-waitlist-cta="article-intro">Get early access to Velq ↗</a></aside>'
 worksheet='<section class="growth-resource"><h2>A practical worksheet to use next</h2><p><a href="'+resource+'">Open the free nutrition planning workbook</a>: compare label values and costs, plan meal portions, or prepare questions for your care team. It works without an email signup and can be printed.</p></section>'
 start='<div class="article-body">'
 if start in s:
  s=s.replace(start,start+intro,1)
 else:
  # Existing standalone page uses main/article sections rather than article-body.
  s=s.replace('</h1>','</h1>'+intro,1)
 # Keep additions within the article, before end CTA where identifiable.
 marker='<aside class="velq-article-cta"'
 addition=worksheet+related+policy
 if marker in s:s=s.replace(marker,addition+marker,1)
 elif '</article>'in s:s=s.replace('</article>',addition+'</article>',1)
 else:s=s.replace('</main>',addition+'</main>',1)
 s=s.replace('</head>','<link rel="stylesheet" href="/assets/growth/journal-growth.css"><script src="/assets/growth/journal-growth.js" defer></script></head>')
 put(key,s)

css='''/* Scoped Journal growth components. */
.growth-invite,.growth-resource,.growth-related,.growth-editorial{padding:24px;margin:30px 0;border:1px solid #e5dfd3;border-radius:14px;line-height:1.7}.growth-invite{background:#fff3ba}.growth-invite .button{margin-top:12px;white-space:normal;text-align:center}.growth-related{background:#f7faf5}.growth-related a,.growth-resource a,.growth-editorial a{text-decoration:underline;text-underline-offset:3px}.growth-editorial{font-size:.9rem;color:#505050}.growth-tool{padding:24px;margin:32px 0;background:#fff8e5;border-radius:16px;border:1px solid #ddd3bb}.growth-tool label{display:block;margin:12px 0}.growth-tool input,.growth-tool select{padding:10px;border:1px solid #aaa;border-radius:8px;font:inherit;max-width:100%;background:white;color:#222}.growth-tool input[type=number]{width:100px}.growth-tool button,.growth-tool .tool-link{display:inline-block;padding:12px 18px;border:0;border-radius:9px;background:#bf2832;color:white;font:inherit;font-weight:700;cursor:pointer;text-decoration:none}.growth-tool output{display:block;margin:18px 0;font-weight:700}.growth-tool table{border-collapse:collapse;width:100%;font-size:.9rem}.growth-tool th,.growth-tool td{padding:10px;text-align:left;border-bottom:1px solid #ddd}.growth-tool .tool-table{overflow-x:auto}.growth-tool table{min-width:500px}.growth-plate{display:block;width:100%;height:auto;max-width:640px;margin:20px auto}.growth-hub{padding:30px 5%;max-width:1250px;margin:auto}.growth-hub h2{font-size:clamp(1.7rem,4vw,2.7rem);margin-bottom:18px}.growth-hub nav{display:flex;flex-wrap:wrap;gap:12px}.growth-hub nav a{border:1px solid #ddd3bb;border-radius:22px;padding:10px 18px}.growth-sources{overflow-wrap:anywhere}@media(max-width:600px){.growth-invite,.growth-resource,.growth-related,.growth-editorial,.growth-tool{padding:18px}.growth-invite .button{width:100%;min-width:0;font-size:.85rem}}
'''
(ROOT/'assets/growth/journal-growth.css').write_text(css)
js='''"use strict";
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
 const path=location.pathname.replace(/\\/+$/,'');
 if(path.startsWith('/blog/')&&!path.includes('/category/')&&path!=='/blog/editorial-policy'){
  // No personal identifiers, user-entered food values, or medication data are collected.
  if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','article_view',{article_path:path});
  const milestone=new Set();const handler=()=>{const available=document.documentElement.scrollHeight-innerHeight;if(available<=0)return;const pct=100*scrollY/available;for(const n of [50,90])if(pct>=n&&!milestone.has(n)){milestone.add(n);if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','article_scroll',{article_path:path,percent_scrolled:n});}};window.addEventListener('scroll',handler,{passive:true});
 }
 for(const a of document.querySelectorAll('a[href="/assets/growth/nutrition-workbook.html"]'))a.addEventListener('click',()=>{if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','article_resource_click',{article_path:path,resource:'nutrition_workbook'});});
})();
'''
(ROOT/'assets/growth/journal-growth.js').write_text(js)

planner='''<section class="growth-tool" data-fiber-planner><h2 id="fiber-planner">Plan protein and fiber across your day</h2><p>Enter values from your labels or a reliable food database. A portion multiplier of 0.5 means half the stated food serving. Values are examples for arithmetic, not recommended intake. Your entries stay in this page and are not saved or sent.</p><div class="tool-table"><table><thead><tr><th>Meal</th><th>Protein per portion (g)</th><th>Fiber per portion (g)</th><th>Portions</th></tr></thead><tbody>'''
for name,protein,fiber in [('Breakfast',20,8),('Lunch',25,8),('Snack',10,5),('Dinner',25,9)]:
 planner+=f'<tr data-food-row><th scope="row">{name}</th><td><input aria-label="{name} protein grams" data-protein type="number" min="0" max="10000" step="0.1" value="{protein}"></td><td><input aria-label="{name} fiber grams" data-fiber type="number" min="0" max="10000" step="0.1" value="{fiber}"></td><td><input aria-label="{name} portions" data-portions type="number" min="0" max="20" step="0.25" value="1"></td></tr>'
planner+='''</tbody></table></div><output aria-live="polite">Example entered portions: 80 g protein · 30 g fiber. Not a recommended target.</output><p>Adjust gradually toward needs discussed with a qualified professional. Do not force a high-fiber target during digestive symptoms.</p><button type="button" data-print-workbook>Print this plan</button></section>'''
snacks='''<section class="growth-tool"><h2 id="snack-selector">Choose a shelf-stable snack combination</h2><label>Show options <select data-snack-filter><option value="all">All combinations</option><option value="plant">Plant-based combinations</option><option value="no-nuts">No nut ingredient listed in this idea</option><option value="savory">Savory choices</option></select></label><p>Filter by the ingredients in these ideas, not certified allergen status. Always check packaging and cross-contact warnings. No refrigeration refers to unopened items explicitly labeled shelf-stable.</p><ul>'''
for tags,t in [('plant no-nuts savory','Dry-roasted edamame with whole-grain crackers: check soy, wheat, and storage directions.'),('plant','Nut-butter packet with whole fruit: keep fruit whole and check nut allergens.'),('no-nuts savory','Shelf-stable salmon pouch with whole-grain crispbread: eat promptly after opening; check fish and wheat allergens.'),('plant no-nuts savory','Dry-roasted chickpeas with pumpkin seeds: check processing, added ingredients, and cross-contact warnings.')]:snacks+=f'<li data-snack-tags="{tags}">{t}</li>'
snacks+='</ul><p><a href="https://www.fda.gov/consumers/consumer-updates/are-you-storing-food-safely">FDA food-storage guidance</a>. Follow each manufacturer’s directions.</p></section>'
plate='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" role="img" aria-labelledby="title desc"><title id="title">A repeatable meal structure</title><desc id="desc">Four meal components: a protein food, a carbohydrate food, fruit or vegetables, and a fat-containing food. The diagram is a checklist, not a portion ratio.</desc><rect width="900" height="600" fill="#fff9e9"/><text x="55" y="70" font-family="Arial,sans-serif" font-size="32" font-weight="700" fill="#20251f">Build a meal you can repeat.</text><g font-family="Arial,sans-serif" fill="#20251f"><rect x="55" y="110" width="375" height="170" rx="22" fill="#f8cdd2"/><text x="80" y="160" font-size="28" font-weight="700">Protein food</text><text x="80" y="205" font-size="21">Eggs, yogurt, chicken, fish,</text><text x="80" y="239" font-size="21">tofu, tempeh, or beans</text><rect x="470" y="110" width="375" height="170" rx="22" fill="#ffe9a2"/><text x="495" y="160" font-size="28" font-weight="700">Carbohydrate food</text><text x="495" y="205" font-size="21">Oats, rice, potatoes,</text><text x="495" y="239" font-size="21">bread, or pasta</text><rect x="55" y="310" width="375" height="170" rx="22" fill="#dcebd6"/><text x="80" y="360" font-size="28" font-weight="700">Fruit or vegetables</text><text x="80" y="405" font-size="21">Choose a familiar side</text><text x="80" y="439" font-size="21">you enjoy and tolerate</text><rect x="470" y="310" width="375" height="170" rx="22" fill="#e0e8fa"/><text x="495" y="360" font-size="28" font-weight="700">Fat-containing food</text><text x="495" y="405" font-size="21">Olive oil, nuts, seeds,</text><text x="495" y="439" font-size="21">avocado, or nut butter</text><text x="55" y="535" font-size="21">A component checklist, not a portion ratio or personal prescription.</text></g></svg>'''
(ROOT/'assets/growth/meal-components.svg').write_text(plate)
platehtml='<section class="growth-tool"><h2 id="portion-visual">A visual meal checklist</h2><img class="growth-plate" src="/assets/growth/meal-components.svg" width="900" height="600" alt="Four components to consider when building a meal: protein, carbohydrate, fruit or vegetables, and fat; not prescribed proportions"><p>Use this checklist to make meals repeatable. The four equal boxes do not prescribe equal portions. <a href="/assets/growth/meal-components.svg" download>Download the meal checklist</a>.</p></section>'
compare='''<section class="growth-tool" data-label-compare><h2 id="label-worksheet">Compare the real cost per full serving</h2><p>Enter a current package price and number of complete servings from the label. Illustrative inputs below are fictional, not current product prices. Compare ingredient quality and suitability alongside cost.</p>'''
for n in [1,2]:compare+=f'<div data-product-row><h3>Option {n}</h3><label>Package price ($) <input data-price type="number" min="0" max="10000" step="0.01" value="{24 if n==1 else 18}"></label><label>Complete servings <input data-servings type="number" min="0" max="10000" step="1" value="{8 if n==1 else 12}"></label><output aria-live="polite">Enter values to compare.</output></div>'
compare+='</section>'
for slug,tool in [('30-grams-fiber-high-protein-diet',planner),('high-protein-high-fiber-snacks-no-refrigeration',snacks),('portion-sizes-muscle-gain-without-counting-calories',platehtml),('protein-and-fiber-gummies-buying-guide',compare)]:
 k='/blog/'+slug+'/index.html';put(k,get(k).replace('<section class="growth-resource">',tool+'<section class="growth-resource">',1))

shell=get('/blog/what-to-eat-glp1-not-hungry/index.html')
head=shell[:shell.index('<body>')]
header=shell[shell.index('<body>')+6:shell.index('<main id="main">')]
footer=shell[shell.index('<footer>'):shell.index('</body>')]
def standalone(title,path,body):
 h=re.sub(r'<title>.*?</title>','<title>'+esc(title)+' | Velq</title>',head,flags=re.S)
 h=re.sub(r'<script type="application/ld\+json">.*?</script>','',h,flags=re.S)
 h=re.sub(r'<link rel="canonical" href="[^"]+">','<link rel="canonical" href="https://velqnutrition.com'+path+'">',h)
 h=re.sub(r'<meta (?:name="twitter:[^"]+"|property="og:[^"]+") content="[^"]+">','',h)
 h=re.sub(r'<meta name="description" content="[^"]+">','<meta name="description" content="'+esc(title)+': practical resources from Velq Editorial.">',h)
 return h+'<body>'+header+'<main id="main"><div class="article-wrap"><h1>'+esc(title)+'</h1><div class="article-body">'+body+'</div></div></main>'+footer+'</body></html>'

policy='''<p>Velq publishes nutrition education alongside a product it is developing. Our commercial interest is disclosed so readers can distinguish education from product marketing.</p><h2>Who writes these articles?</h2><p>Velq Editorial is the brand’s editorial byline, not a medical credential or an independent review board. Articles are prepared with AI assistance and edited against the sources linked in each article.</p><h2>Clinical review status</h2><p>The GLP-1 articles have not been independently reviewed by a qualified clinician. We do not list a clinician or claim medical approval without an actual completed review and permission to name the reviewer. Use these articles to prepare questions for your own prescriber or registered dietitian.</p><h2>How sources are selected</h2><p>We prioritize public clinical guidance, government nutrition information, original research, and current manufacturer labels for product facts. Preliminary formulation targets are not verified finished-product nutrition facts. Illustrative calculations and planning examples are labeled as such.</p><h2>What a clinical review must check</h2><ul><li>Accuracy and suitability of protein, fiber, hydration, and symptom guidance.</li><li>Medication-specific cautions and when to seek urgent help.</li><li>Whether the wording implies unsupported product benefits or suitability.</li><li>Source quality and whether the cited evidence supports each claim.</li></ul><h2>Corrections and updates</h2><p>If you find an error, <a href="/contact/">contact Velq</a> with the article URL and the specific claim or source. A meaningful content update should be accompanied by an updated date; dates are not changed merely to look fresh.</p><h2>Product disclosures</h2><p>Velq gummies are in development. Final ingredients, protein source, serving directions, and nutrition information may change. Articles do not establish Velq as a treatment or as suitable for a medical condition.</p>'''
put('/blog/editorial-policy/index.html',standalone('Editorial policy and clinical review status','/blog/editorial-policy',policy))

workbook=standalone('Your nutrition planning workbook','/assets/growth/nutrition-workbook.html','<p>Four practical tools for everyday planning. No email is required. Values remain in this page. This workbook does not diagnose symptoms or prescribe nutrition.</p>'+planner+platehtml+compare+snacks+'<section><h2>Questions for your care team</h2><ul><li>What nutrition goals suit my health and medication?</li><li>Which symptoms should prompt a call?</li><li>What food portions can I comfortably manage?</li><li>How should I monitor progress?</li></ul><p><a href="/blog/category/glp-1">Explore the GLP-1 nutrition articles</a> or <a href="/blog">return to the Journal</a>.</p></section>')
# Workbook is a utility, not another indexable article competing with the original guides.
workbook=workbook.replace('index,follow,max-image-preview:large','noindex,follow')
(ROOT/'assets/growth/nutrition-workbook.html').write_text(workbook)

for route in ['/blog/index.html','/blog/category/glp-1/index.html']:
 s=get(route)
 nav='<section class="growth-hub"><h2>Choose your next step</h2><nav aria-label="Nutrition topic guides"><a href="/blog/category/protein">Protein and portions</a><a href="/blog/category/fiber">Fiber</a><a href="/blog/category/glp-1">GLP-1 nutrition</a><a href="/blog/category/energy">Caffeine and energy</a><a href="'+resource+'">Free planning workbook</a><a href="/blog/editorial-policy">Editorial policy</a></nav></section>'
 s=s.replace('</main>',nav+'</main>').replace('</head>','<link rel="stylesheet" href="/assets/growth/journal-growth.css"></head>')
 put(route,s)

ns='http://www.sitemaps.org/schemas/sitemap/0.9';ET.register_namespace('',ns);sm=ET.fromstring(get('/sitemap.xml'))
node=ET.SubElement(sm,'{'+ns+'}url');ET.SubElement(node,'{'+ns+'}loc').text='https://velqnutrition.com/blog/editorial-policy';ET.SubElement(node,'{'+ns+'}lastmod').text='2026-10-15'
put('/sitemap.xml',ET.tostring(sm,encoding='unicode',xml_declaration=True),'application/xml; charset=utf-8')
(ROOT/'blog/fiber-gummies-vs-fiber-powder/index.html').write_text(get('/blog/fiber-gummies-vs-fiber-powder/index.html'))
delta={k:v for k,v in assets.items() if base.get(k)!=v}
encoded=base64.b64encode(gzip.compress(json.dumps(delta,separators=(',',':')).encode(),mtime=0)).decode()
router=re.sub(r"base64_decode\('[^']+'",lambda m:"base64_decode('"+encoded+"'",router,count=1)
(ROOT/'nutrition-content.php').write_text(router)

# Widen only the explicitly enumerated active article paths, preserving all other rules.
ht=(ROOT/'.htaccess').read_text();lines=ht.splitlines()
for n,line in enumerate(lines):
 if 'nutrition-content.php' in line and 'blog/category/'in line:
  paths=['blog','blog/editorial-policy','blog/category/(?:protein|fiber|fitness|wellness|energy|glp-1)']+['blog/'+re.escape(a['slug'])for a in items]
  lines[n]='  RewriteRule ^(?:'+'|'.join(paths)+r')(?:/|/index\.html)?$ nutrition-content.php [END]'
(ROOT/'.htaccess').write_text('\n'.join(lines)+'\n')

manifest={'articles':items,'resources':[resource,'/assets/growth/meal-components.svg'],'clinicalReview':'Not completed; packet prepared for qualified reviewer.','volumeValidation':'Unavailable: Bing keyword data is not connected; no exact monthly volumes or numeric difficulty asserted.','competitionCheck':'Public search results inspected October 15, 2026 for the new topics and selected existing comparisons. Broad GLP-1 terms include major clinical and publisher sites; narrower questions are hypotheses, not proven low competition.','measurementBaseline':{'period':'September 15–October 12, 2026','ga4Sessions':365,'organicSearchSessions':7,'generateLeadEvents':0,'generateLeadMarkedKeyEvent':True},'publication':'Website updates prepared; social assets are not posted or sent automatically.'}
(ROOT/'reports/journal-growth-2026-10-15.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
(OUTPUT/'keyword-and-distribution-plan.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False))
Path('/tmp/growth-final-assets.json').write_text(json.dumps(assets))
Path('/tmp/growth-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False))
print('Prepared',len(items),'article enhancements,',len(delta),'extension routes and four workbook tools.')
