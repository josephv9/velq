(() => {
'use strict';
const form=document.getElementById('wholesale-inquiry');
if(!form)return;
let started=false;
const event=name=>{if(typeof window.gtag==='function')window.gtag('event',name,{form_id:'wholesale-inquiry',business_channel:'wholesale'});};
form.addEventListener('input',()=>{if(!started){started=true;event('wholesale_inquiry_start');}},{once:true});
form.addEventListener('submit',e=>{
e.preventDefault();if(!form.reportValidity())return;
const data=new FormData(form);const fields=[['Name','contact'],['Business','business'],['Email','email'],['Phone','phone'],['Location','location'],['Business type','business_type'],['Request','request'],['Opening quantity','quantity'],['Message','message']];
const body=fields.map(([label,key])=>label+': '+String(data.get(key)||'').trim()).join('\n');
const href='mailto:support@velqnutrition.com?subject='+encodeURIComponent('Velq wholesale inquiry')+'&body='+encodeURIComponent(body);
const link=document.getElementById('inquiry-email');link.href=href;link.hidden=false;
document.getElementById('inquiry-feedback').textContent='Your inquiry is prepared. Review and send it in your email app. If it did not open, use the link below.';
event('wholesale_inquiry_email_open');window.location.href=href;
});
})();
