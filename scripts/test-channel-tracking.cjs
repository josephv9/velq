const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('assets/velq-channel-tracking.js','utf8');
const saved=new Map(),events=[];let listeners={};
function run(search,referrer=''){
 const ctx={URL,URLSearchParams,Set,JSON,location:{search,pathname:'/',origin:'https://velqnutrition.com'},sessionStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},document:{referrer,addEventListener(){}},gtag:(...a)=>events.push(a),addEventListener:(n,f)=>listeners[n]=f};ctx.window=ctx;vm.runInNewContext(src,ctx);return ctx;
}
run('?utm_source=tiktok&utm_medium=live&email=private@example.com');assert.equal(events[0][2].acquisition_channel,'tiktok_live');
run('');assert.equal(events.at(-1)[2].acquisition_channel,'tiktok_live','preserve attribution across pages');
listeners['velq:waitlist-success']({detail:{eventId:'confirmed-123'}});listeners['velq:waitlist-success']({detail:{eventId:'confirmed-123'}});
assert.equal(events.filter(x=>x[1]==='channel_waitlist_confirmed').length,1);assert(!JSON.stringify(events).includes('private@example.com'));
run('?utm_source=instagram&utm_medium=organic');assert.equal(events.at(-1)[2].acquisition_channel,'instagram');
console.log('PASS: channel attribution persists, updates with a new campaign, deduplicates confirmed leads, excludes contact data.');
