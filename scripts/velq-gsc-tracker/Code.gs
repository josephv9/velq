// VELQ Search Console > Google Sheets, no paid service.
// In the tracker: Extensions > Apps Script; paste this as Code.gs.
// Also replace appsscript.json with the linked manifest. Run setupVelqTracker once.
const SITE='https://velqnutrition.com/', TZ='America/Los_Angeles';
function onOpen(){
 SpreadsheetApp.getUi().createMenu('VELQ SEO')
 .addItem('Refresh now','refreshVelqGSC')
 .addItem('Set up daily refresh','setupVelqTracker').addToUi();
}
function setupVelqTracker(){
 refreshVelqGSC();
 ScriptApp.getProjectTriggers().filter(x=>x.getHandlerFunction()==='refreshVelqGSC')
 .forEach(x=>ScriptApp.deleteTrigger(x));
 ScriptApp.newTrigger('refreshVelqGSC').timeBased().everyDays(1).atHour(8).create();
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