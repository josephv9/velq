#!/usr/bin/env python3
"""Differential reliability audit for intermittent Velq 404/500 responses.
Read-only requests, gentle cadence, no signup API writes.
"""
import json, time, urllib.request, urllib.error, hashlib, random
BASE='https://velqnutrition.com'
paths=[
'/',
'/compare',
'/guides',
'/blog/protein-and-fiber-gummies-buying-guide',
'/blog/protein-gummies-with-fiber-comparison',
'/blog/build-muscle-without-protein-shakes',
'/blog/portion-sizes-muscle-gain-without-counting-calories',
'/blog/what-to-eat-glp1-not-hungry',
'/blog/glp1-protein-snacks-without-shakes',
'/blog/glp1-constipation-fiber',
'/blog/maintain-muscle-glp1-low-appetite'
]
obs=[]
for pass_no in range(1,4):
  for path in paths:
    headers={'User-Agent':'Mozilla/5.0 (compatible; Velq-Sitemap-QA/1.0; +https://velqnutrition.com/robots.txt)'}
    if pass_no==2: headers['Cache-Control']='no-cache'
    url=BASE+path
    req=urllib.request.Request(url,headers=headers)
    try:
      with urllib.request.urlopen(req,timeout=16) as response:
        status=response.status; final=response.geturl(); h=dict(response.headers); body=response.read(250000)
    except urllib.error.HTTPError as e:
      status=e.code; final=e.geturl(); h=dict(e.headers); body=e.read(250000)
    except Exception as e:
      status=0;final=url;h={};body=b'';err=str(e)
    record={
      'pass':pass_no,'path':path,'status':status,'final':final,
      'body_hash':hashlib.sha256(body).hexdigest()[:12],
      'bytes':len(body),'server':h.get('Server',''),
      'via':h.get('Via',''),'x_cache':h.get('X-Cache',h.get('x-cache','')),
      'age':h.get('Age',''),'cache_control':h.get('Cache-Control',''),
      'cf_ray':h.get('CF-RAY',''),'vary':h.get('Vary',''),
      'error':err if status==0 else None
    }
    print('ROUTE',json.dumps(record,sort_keys=True),flush=True)
    obs.append(record)
    time.sleep(0.18)
summary={}
for path in paths:
  matches=[r for r in obs if r['path']==path]
  summary[path]={'statuses':[r['status'] for r in matches],'body_hashes':[r['body_hash'] for r in matches]}
print('SUMMARY',json.dumps(summary,indent=2))
