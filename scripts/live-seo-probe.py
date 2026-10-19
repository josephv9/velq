#!/usr/bin/env python3
"""Live Velq deployment and sitemap error diagnostics. GET only; no signups."""
import json, re, time, urllib.request, urllib.error
BASE='https://velqnutrition.com'
AGENTS={
  'audit':'Velq-SEO-QA/1.0',
  'browser':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36',
}
PATHS=[
 '/blog/build-muscle-without-protein-shakes',
 '/blog/portion-sizes-muscle-gain-without-counting-calories',
 '/blog/what-to-eat-glp1-not-hungry',
 '/blog/glp1-protein-snacks-without-shakes',
 '/blog/glp1-constipation-fiber',
 '/blog/maintain-muscle-glp1-low-appetite',
 '/blog/protein-gummies-with-fiber-comparison',
]
def fetch(path, agent):
    url=BASE+path
    req=urllib.request.Request(url, headers={'User-Agent':AGENTS[agent], 'Cache-Control':'no-cache'})
    try:
        with urllib.request.urlopen(req,timeout=16) as response:
            status=response.status; headers=dict(response.headers); body=response.read(500000).decode('utf-8','replace')
            dest=response.geturl()
    except urllib.error.HTTPError as error:
        status=error.code; headers=dict(error.headers);body=error.read(500000).decode('utf-8','replace');dest=error.geturl()
    except Exception as error:
        return {'path':path,'agent':agent,'error':str(error)}
    title=re.search(r'<title>([^<]*)</title>',body,re.I)
    ids=sorted(set(re.findall(r'G-[A-Z0-9]{8,}',body)))
    return {'path':path,'agent':agent,'status':status,'destination':dest,'title':title.group(1)[:85] if title else '',
            'bytes':len(body),'ids':ids,'loader_bridge_present':'single GA4 initializer' in body or 'config.ga4 = ID;' in body,
            'has_waitlist_success':'waitlist_signup_success' in body,'cache':headers.get('X-Cache',headers.get('x-cache',''))}
for path in ['/robots.txt','/sitemap.xml','/analytics-config.js','/analytics.js','/velq-analytics.js','/']+PATHS:
    agents=['browser','audit'] if path in PATHS else ['browser']
    for agent in agents:
        print('PROBE',json.dumps(fetch(path,agent),sort_keys=True),flush=True)
    time.sleep(0.15)
