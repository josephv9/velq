'use strict';
const mobileNav=document.querySelector('#mobile-nav');
const menuToggle=document.querySelector('#menu-toggle');
menuToggle.addEventListener('click',()=>{
  mobileNav.hidden=!mobileNav.hidden;
  menuToggle.setAttribute('aria-expanded',String(!mobileNav.hidden));
  menuToggle.setAttribute('aria-label',mobileNav.hidden?'Open menu':'Close menu');
});
mobileNav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{
  mobileNav.hidden=true;
  menuToggle.setAttribute('aria-expanded','false');
  menuToggle.setAttribute('aria-label','Open menu');
}));

const form=document.querySelector('#waitlist-form');
const interest=document.querySelector('#waitlist-interest');
const feedback=document.querySelector('#signup-feedback');
const submit=document.querySelector('#waitlist-submit');
document.querySelectorAll('[data-interest]').forEach(link=>link.addEventListener('click',()=>{interest.value='strawberry';}));
form.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!form.reportValidity())return;
  if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','waitlist_submit_attempt',{form_id:'waitlist-form'});
  submit.disabled=true;submit.textContent='JOINING…';feedback.textContent='';feedback.className='signup-feedback';
  try{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
    let response;
    try{response=await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.elements.email.value,interest:interest.value,consent:form.elements.consent.checked,company:form.elements.company.value}),signal:controller.signal});}finally{clearTimeout(timer);}
    const result=await response.json();
    if(!response.ok||result.ok!==true)throw new Error(result.error||'We couldn’t save your signup. Please try again.');
    if(!form.elements.company.value&&result.newLead===true&&result.eventId){window.dispatchEvent(new CustomEvent('velq:waitlist-success',{detail:{eventId:result.eventId}}));}
    form.reset();interest.value='strawberry';feedback.classList.add('success');feedback.textContent='You’re on the list! We’ll email you when Velq launches.';
  }catch(error){if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','waitlist_submit_failed',{form_id:'waitlist-form',failure_type:error.name==='AbortError'?'timeout':'request_failed'});feedback.classList.add('error');feedback.textContent=error.name==='AbortError'?'That took longer than expected. Please try again.':error.message||'Please check your connection and try again.';}
  finally{submit.disabled=false;submit.innerHTML='JOIN THE WAITLIST <span aria-hidden="true">↗</span>';}
});

const privacy=document.querySelector('#privacy-dialog');
document.querySelector('#privacy-open').addEventListener('click',()=>privacy.showModal());
document.querySelector('#privacy-close').addEventListener('click',()=>privacy.close());
const context=document.modelContext;
if(context?.registerTool){
  const lifecycle=new AbortController();
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  try{Promise.resolve(context.registerTool({name:'start_velq_waitlist_signup',description:'Navigate to the Velq strawberry gummy waitlist signup form. Does not submit an email or join the waitlist.',inputSchema:{type:'object',properties:{interest:{type:'string',enum:['strawberry']}},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(input?.interest&&input.interest!=='strawberry')throw new Error('Unknown product interest.');interest.value='strawberry';document.querySelector('#waitlist').scrollIntoView();document.querySelector('#waitlist-email').focus({preventScroll:true});return {status:'form_open',submitted:false};}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
}

const stickyAccess=document.querySelector('.mobile-early-access');
if(stickyAccess&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{stickyAccess.hidden=entries.some(e=>e.isIntersecting);},{threshold:0});observer.observe(document.querySelector('#waitlist'));}

// Use the approved product photo for the homepage hero and product card.
const approvedProductImage='/assets/velq-strawberry-gummies-target-20261015.jpeg';
document.querySelectorAll('#hero-image, .product-visual img').forEach(image=>{
  image.src=approvedProductImage;
  image.srcset='';
});
