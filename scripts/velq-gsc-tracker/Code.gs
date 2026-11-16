// VELQ Search Console > Google Sheets, no paid service.
// In the tracker: Extensions > Apps Script; paste this as Code.gs.
// Also replace appsscript.json with the linked manifest. Run setupVelqTracker once.
const SITE='https://velqnutrition.com/', TZ='America/Los_Angeles';
function onOpen(){
 SpreadsheetApp.getUi().createMenu('VELQ SEO')
 .addItem('Refresh Search Console + GA4','refreshVelqReport')
 .addItem('Refresh GA4 only','refreshVelqGA4')
 .addItem('Inspect Google indexing','refreshVelqIndexing')
 .addItem('Set up daily refresh','setupVelqTracker').addToUi();
}
function setupVelqTracker(){
 refreshVelqReport();
 ScriptApp.getProjectTriggers().filter(x=>['refreshVelqGSC','refreshVelqReport'].includes(x.getHandlerFunction()))
 .forEach(x=>ScriptApp.deleteTrigger(x));
 ScriptApp.newTrigger('refreshVelqReport').timeBased().everyDays(1).atHour(8).create();
 SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setup').getRange('B11')
 .setValue('Active — daily near 8 AM Pacific');
}
function dateShift(iso,days){
 const d=new Date(iso+'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days);
 return Utilities.formatDate(d,'GMT','yyyy-MM-dd');
}
function dayDate(iso){return new Date(iso+'T12:00:00Z');}
function gsc(start,end,dimensions,limit){
 const url='https://www.googleapis.com/webmasters/v3/sites/'+encodeURIComponent(SITE)+'/searchAnalytics/query';
 const resp=UrlFetchApp.fetch(url,{
  method:'post',contentType:'application/json',
  headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},
  payload:JSON.stringify({startDate:start,endDate:end,dimensions:dimensions,rowLimit:limit,type:'web',dataState:'final'}),
  muteHttpExceptions:true
 });
 if(resp.getResponseCode()!==200){
  let msg=resp.getContentText();try{msg=JSON.parse(msg).error.message||msg;}catch(e){}
  throw Error('Search Console '+resp.getResponseCode()+': '+msg.slice(0,260));
 }
 return JSON.parse(resp.getContentText()).rows||[];
}
function fill(ss,name,rows,n){
 const sh=ss.getSheetByName(name);
 if(!sh)throw Error('Missing tracker tab: '+name);
 const old=sh.getLastRow()-1;
 if(old>0)sh.getRange(2,1,old,n).clearContent();
 if(!rows.length)return;
 if(sh.getMaxRows()<rows.length+1)sh.insertRowsAfter(sh.getMaxRows(),rows.length+1-sh.getMaxRows());
 for(let i=0;i<rows.length;i+=500){
  const part=rows.slice(i,i+500);
  sh.getRange(i+2,1,part.length,n).setValues(part);
 }
}
function refreshVelqGSC(){
 const ss=SpreadsheetApp.getActiveSpreadsheet(), setup=ss.getSheetByName('Setup');
 setup.getRange('B10').setValue('Syncing…');SpreadsheetApp.flush();
 const end=Utilities.formatDate(new Date(Date.now()-3*86400000),TZ,'yyyy-MM-dd');
 const start=dateShift(end,-27),prevEnd=dateShift(start,-1),prevStart=dateShift(prevEnd,-27);
 const dayStart=dateShift(end,-119);
 try{
  const cur=gsc(start,end,[],1)[0]||{clicks:0,impressions:0,ctr:0,position:0};
  const prev=gsc(prevStart,prevEnd,[],1)[0]||{clicks:0,impressions:0,ctr:0,position:0};
  const daily=gsc(dayStart,end,['date'],150);
  const q=gsc(start,end,['query'],1000),p=gsc(start,end,['page'],1000);
  const qp=gsc(start,end,['query','page'],2000),device=gsc(start,end,['device'],10);
  fill(ss,'Daily',daily.map(r=>[dayDate(r.keys[0]),r.clicks,r.impressions,r.ctr,r.position]),5);
  fill(ss,'Queries',q.map(r=>[r.keys[0],r.clicks,r.impressions,r.ctr,r.position]),5);
  fill(ss,'Pages',p.map(r=>[r.keys[0],r.clicks,r.impressions,r.ctr,r.position]),5);
  fill(ss,'Query Pages',qp.map(r=>[r.keys[0],r.keys[1],r.clicks,r.impressions,r.ctr,r.position]),6);
  fill(ss,'Devices',device.map(r=>[r.keys[0],r.clicks,r.impressions,r.ctr,r.position]),5);
  const opp=q.filter(r=>r.impressions>=25&&r.position>=3&&r.position<=30)
   .sort((a,b)=>b.impressions-a.impressions).slice(0,100).map(r=>[
    r.keys[0],r.impressions,r.clicks,r.ctr,r.position,
    r.position<=10?'Review title, snippet and intent':'Improve relevance and internal links'
   ]);
  fill(ss,'Opportunities',opp,6);
  const overview=ss.getSheetByName('Overview');
  overview.getRange('B6:C9').setValues([
   [cur.clicks,prev.clicks],[cur.impressions,prev.impressions],
   [cur.ctr,prev.ctr],[cur.position,prev.position]
  ]);
  overview.getRange('B12').setValue(new Date());
  overview.getRange('B13').setValue(start+' to '+end);
  overview.getRange('B14').setValue('Active — Search Console API');
  setup.getRange('B4').setValue(SITE);
  setup.getRange('B5:B8').setValues([[dayDate(start)],[dayDate(end)],[dayDate(prevStart)],[dayDate(prevEnd)]]);
  setup.getRange('B5:B8').setNumberFormat('yyyy-mm-dd');
  setup.getRange('B9').setValue(new Date());
  setup.getRange('B10').setValue('Connected — successful data refresh');
  ss.getSheetByName('Daily').getRange('A2:A121').setNumberFormat('yyyy-mm-dd');
  ss.getSheetByName('Daily').getRange('D2:D121').setNumberFormat('0.00%');
  for(const name of ['Queries','Pages','Devices']){
    const sh=ss.getSheetByName(name);
    sh.getRange(2,4,Math.max(1,sh.getMaxRows()-1),1).setNumberFormat('0.00%');
  }
  const pairs=ss.getSheetByName('Query Pages');
  pairs.getRange(2,5,Math.max(1,pairs.getMaxRows()-1),1).setNumberFormat('0.00%');
  ss.getSheetByName('Opportunities').getRange('D2:D101').setNumberFormat('0.00%');
  return 'Updated through '+end;
 }catch(e){
  setup.getRange('B10').setValue('ERROR — '+String(e.message||e).slice(0,300));
  throw e;
 }
}


// VELQ GA4 site-only organic acquisition and server-confirmed early-access leads.
// Uses the free Analytics Admin and Analytics Data APIs, no third-party subscription.
// Analytics is only read; no customer emails or contact details are exported.
const VELQ_MEASUREMENT_ID = 'G-F93RK1P0H5';

function refreshVelqReport(){
  const gscResult=refreshVelqGSC();
  try{refreshVelqGA4();}
  catch(e){
    const setup=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setup');
    if(setup)setup.getRange('B31').setValue('GA4 needs setup: '+String(e.message||e).slice(0,180));
    // Search Console collection should keep working even if GA4 permission fails.
  }
  try{refreshVelqIndexing();}
  catch(e){
    const setup=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setup');
    if(setup)setup.getRange('B32').setValue('Indexing needs setup: '+String(e.message||e).slice(0,180));
  }
  return gscResult;
}
function velqApi(url,payload){
  const opts={
    method:payload?'post':'get',contentType:'application/json',
    headers:{Authorization:'Bearer '+ScriptApp.getOAuthToken()},
    muteHttpExceptions:true
  };
  if(payload)opts.payload=JSON.stringify(payload);
  const response=UrlFetchApp.fetch(url,opts);
  const raw=response.getContentText();
  let parsed={};
  try{parsed=raw?JSON.parse(raw):{};}catch(e){}
  if(response.getResponseCode()<200||response.getResponseCode()>=300)
    throw Error('Google API '+response.getResponseCode()+': '+String(parsed.error?.message||raw).slice(0,230));
  return parsed;
}
function velqGA4Property(){
  const setup=SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Setup');
  const manual=String(setup.getRange('B12').getValue()||'').trim();
  if(/^\d{5,}$/.test(manual))return manual;
  // Discover the exact GA4 web stream; a G- ID is NOT the numeric property ID.
  let pageToken='',properties=[];
  for(let page=0;page<5;page++){
    const url='https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200'+(pageToken?'&pageToken='+encodeURIComponent(pageToken):'');
    const response=velqApi(url);
    for(const account of (response.accountSummaries||[]))
      for(const property of (account.propertySummaries||[]))
        if(/^properties\/\d+$/.test(property.property||''))properties.push(property.property);
    pageToken=response.nextPageToken||'';
    if(!pageToken)break;
  }
  properties=[...new Set(properties)];
  for(const property of properties.slice(0,100)){
    try{
      const response=velqApi('https://analyticsadmin.googleapis.com/v1beta/'+property+'/dataStreams?pageSize=200');
      if((response.dataStreams||[]).some(stream=>stream.webStreamData?.measurementId===VELQ_MEASUREMENT_ID)){
        const id=property.split('/')[1];setup.getRange('B12').setValue(id);return id;
      }
    }catch(e){
      // Ignore inaccessible streams in other properties; continue looking for ours.
    }
  }
  throw Error('Could not find the GA4 property with '+VELQ_MEASUREMENT_ID+'. Enter its numeric Property ID in Setup!B12 or authorize the Google account that owns the stream.');
}
function velqGA4Rows(propertyId,start,end,leadOnly){
  const hostFilter={filter:{fieldName:'hostName',stringFilter:{matchType:'FULL_REGEXP',value:'^(www\\.)?velqnutrition\\.com$',caseSensitive:false}}};
  const leadFilter={filter:{fieldName:'eventName',stringFilter:{matchType:'EXACT',value:'generate_lead',caseSensitive:true}}};
  const body={
    dateRanges:[{startDate:start,endDate:end}],
    dimensions:[{name:'sessionDefaultChannelGroup'},{name:'hostName'}],
    metrics:[{name:leadOnly?'eventCount':'sessions'}],
    limit:'10000',
    dimensionFilter:leadOnly?{andGroup:{expressions:[hostFilter,leadFilter]}}:hostFilter
  };
  if(leadOnly)body.dimensions.push({name:'eventName'});
  const result=velqApi('https://analyticsdata.googleapis.com/v1beta/properties/'+propertyId+':runReport',body);
  return result.rows||[];
}
function velqGA4Totals(propertyId,start,end){
  const sessionRows=velqGA4Rows(propertyId,start,end,false);
  const leadRows=velqGA4Rows(propertyId,start,end,true);
  const sum=(rows,predicate)=>rows.reduce((n,row)=>n+(predicate(row)?Number(row.metricValues?.[0]?.value||0):0),0);
  return {
    organicSessions:sum(sessionRows,r=>r.dimensionValues?.[0]?.value==='Organic Search'),
    organicLeads:sum(leadRows,r=>r.dimensionValues?.[0]?.value==='Organic Search'),
    allLeads:sum(leadRows,()=>true)
  };
}
function refreshVelqGA4(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  const setup=ss.getSheetByName('Setup');
  let sh=ss.getSheetByName('GA4 Organic');
  if(!sh){
    sh=ss.insertSheet('GA4 Organic');
    sh.getRange('A1').setValue('VELQ | GA4 ORGANIC TRAFFIC & CONFIRMED EARLY-ACCESS LEADS');
    sh.getRange('A5:D5').setValues([['METRIC','LATEST 28 DAYS','PREVIOUS 28 DAYS','CHANGE']]);
    sh.getRange('A6:A9').setValues([['Organic Search sessions'],['Organic Search confirmed leads'],['All-channel confirmed leads'],['Organic lead / session rate']]);
    sh.getRange('A11:A13').setValues([['Reporting window'],['Last synced'],['Connection status']]);
  }
  const id=velqGA4Property();
  // Align GA4 to finalized Search Console dates (usually a few days delayed).
  const end=Utilities.formatDate(new Date(Date.now()-3*86400000),TZ,'yyyy-MM-dd');
  const start=dateShift(end,-27),prevEnd=dateShift(start,-1),prevStart=dateShift(prevEnd,-27);
  try{
    const now=velqGA4Totals(id,start,end),previous=velqGA4Totals(id,prevStart,prevEnd);
    sh.getRange('B6:C8').setValues([
      [now.organicSessions,previous.organicSessions],
      [now.organicLeads,previous.organicLeads],
      [now.allLeads,previous.allLeads]
    ]);
    sh.getRange('B9:D9').setFormulas([['=IFERROR(B7/B6,0)','=IFERROR(C7/C6,0)','=IFERROR((B9-C9)/C9,"")']]);
    sh.getRange('D6:D8').setFormulas([
      ['=IFERROR((B6-C6)/C6,"")'],
      ['=IFERROR((B7-C7)/C7,"")'],
      ['=IFERROR((B8-C8)/C8,"")']
    ]);
    sh.getRange('B9:D9').setNumberFormat('0.00%');
    sh.getRange('D6:D8').setNumberFormat('0.0%');
    sh.getRange('B11').setValue(start+' to '+end);
    sh.getRange('B12').setValue(new Date());
    sh.getRange('B13').setValue('Connected — GA4 property '+id+'; website only');
    setup.getRange('B31').setValue('Connected — GA4 property '+id+'; daily report');
    return 'GA4 updated through '+end;
  }catch(e){
    sh.getRange('B13').setValue('ERROR — '+String(e.message||e).slice(0,200));
    setup.getRange('B31').setValue('GA4 ERROR — '+String(e.message||e).slice(0,200));
    throw e;
  }
}


// Inspect Google's indexed copy (NOT a live fetch) for high-value Velq pages.
function refreshVelqIndexing(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  let sh=ss.getSheetByName('Indexing');
  if(!sh){
    sh=ss.insertSheet('Indexing');
    sh.getRange('A1:G1').setValues([[
      'PAGE URL','INDEX STATUS','GOOGLE COVERAGE','LAST GOOGLE CRAWL',
      'GOOGLE CANONICAL','ROBOTS STATUS','LAST INSPECTED'
    ]]);
    sh.setFrozenRows(1);
  }
  const urls=[
    'https://velqnutrition.com/',
    'https://velqnutrition.com/products/strawberry-protein-fiber-gummies',
    'https://velqnutrition.com/blog/protein-gummies-for-adults',
    'https://velqnutrition.com/blog/fiber-gummies-for-adults-guide',
    'https://velqnutrition.com/blog/caffeine-gummies-vs-coffee-whats-the-difference',
    'https://velqnutrition.com/blog/caffeine-l-theanine-vs-caffeine',
    'https://velqnutrition.com/wholesale/'
  ];
  const checked=new Date();
  const results=[];
  for(const url of urls){
    try{
      const result=velqApi('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',{
        inspectionUrl:url,siteUrl:SITE,languageCode:'en-US'
      }).inspectionResult?.indexStatusResult||{};
      const status=result.verdict==='PASS'?'Indexed (PASS)':result.verdict==='NEUTRAL'?'Excluded (NEUTRAL)':result.verdict==='FAIL'?'Index error (FAIL)':'Unknown / not inspected';
      results.push([url,status,result.coverageState||'',result.lastCrawlTime||'',
        result.googleCanonical||'',result.robotsTxtState||'',checked]);
    }catch(e){
      results.push([url,'API error (not verified)',String(e.message||e).slice(0,180),'','','',checked]);
    }
  }
  fill(ss,'Indexing',results,7);
  ss.getSheetByName('Setup').getRange('B14').setValue('Inspected '+results.length+' pages '+Utilities.formatDate(checked,TZ,'yyyy-MM-dd HH:mm'));
  return results.map(r=>r[1]);
}
