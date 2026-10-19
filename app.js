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
const pendingKey='velq_pending_waitlist';
const storeReceipt=receipt=>{try{if(receipt)sessionStorage.setItem(pendingKey,receipt);else sessionStorage.removeItem(pendingKey);}catch{}};
const savedReceipt=()=>{try{return sessionStorage.getItem(pendingKey);}catch{return null;}};
async function waitlistRequest(body){
  const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
  try{const response=await fetch('/api/waitlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal});return {response,result:await response.json()};}finally{clearTimeout(timer);}
}
async function completeWaitlist(initial){
  let {response,result}=initial;const started=Date.now();let delay=1500;
  while(result.status==='pending'&&result.receipt&&Date.now()-started<10*60*1000){
    storeReceipt(result.receipt);
    feedback.textContent='Your request is saved. Weâre confirming your subscriptionâ¦';
    await new Promise(resolve=>setTimeout(resolve,delay));delay=Math.min(10000,delay*1.5);
    ({response,result}=await waitlistRequest({receipt:result.receipt}));
  }
  if(result.status==='pending'){feedback.textContent='Your request is saved and confirmation is still pending. Return to this page to check again.';return;}
  if(!response.ok||result.ok!==true){storeReceipt(null);throw new Error(result.status==='suppressed'?'This address cannot be subscribed through this form. Please contact Velq.':result.error||'We couldnât save your signup. Please try again.');}
  storeReceipt(null);
  if(result.status==='confirmed'&&result.newLead===true&&result.eventId)window.dispatchEvent(new CustomEvent('velq:waitlist-success',{detail:{eventId:result.eventId}}));
  form.reset();interest.value='strawberry';feedback.classList.add('success');feedback.textContent='Youâre on the list! Weâll email you when Velq launches.';
}
function signupError(error){
  // An interrupted poll is not a failed subscription or a successful conversion.
  if(savedReceipt()){feedback.textContent='Your request is saved. Return to this page to check confirmation.';return;}
  if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','waitlist_submit_failed',{form_id:'waitlist-form',failure_type:error.name==='AbortError'?'timeout':'request_failed'});
  feedback.classList.add('error');feedback.textContent=error.name==='AbortError'?'That took longer than expected. Please try again.':error.message||'Please check your connection and try again.';
}
form.addEventListener('submit',async event=>{
  event.preventDefault();if(submit.disabled||!form.reportValidity())return;
  if(window.VELQ_ANALYTICS?.ga4)window.gtag?.('event','waitlist_submit_attempt',{form_id:'waitlist-form'});
  submit.disabled=true;submit.textContent='JOININGâ¦';feedback.textContent='';feedback.className='signup-feedback';
  try{await completeWaitlist(await waitlistRequest(savedReceipt()?{receipt:savedReceipt()}:{email:form.elements.email.value,interest:interest.value,consent:form.elements.consent.checked,company:form.elements.company.value}));}
  catch(error){signupError(error);}
  finally{submit.disabled=false;submit.innerHTML='JOIN THE WAITLIST <span aria-hidden="true">â</span>';}
});
if(savedReceipt()){
  submit.disabled=true;
  completeWaitlist({response:{ok:true},result:{status:'pending',receipt:savedReceipt()}}).catch(signupError).finally(()=>{submit.disabled=false;});
}

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

/* Lead-capture popup: same first-party waitlist API and confirmed-lead tracking as the inline form. */
(() => {
  if (!document.querySelector('#waitlist-form') || document.querySelector('#velq-lead-popup')) return;
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = '/velq-lead-popup.css?v=1';
  document.head.appendChild(sheet);

  const shell = document.createElement('div');
  shell.id = 'velq-lead-popup';
  shell.hidden = true;
  shell.setAttribute('aria-hidden', 'true');
  shell.innerHTML = `
    <section class="vlp-card" role="dialog" aria-modal="true" aria-labelledby="vlp-title" aria-describedby="vlp-desc">
      <button type="button" class="vlp-close" aria-label="Close early access popup" data-vlp-close>&times;</button>
      <div class="vlp-content">
        <p class="vlp-eyebrow">A little more in your routine</p>
        <h2 id="vlp-title" class="vlp-heading">Be first to meet Velq.</h2>
        <p id="vlp-desc" class="vlp-copy">Strawberry protein + fiber gummies are in development. Join for launch news and your first chance to shop.</p>
        <form id="velq-popup-form">
          <label class="vlp-label" for="vlp-email">Email address</label>
          <input class="vlp-email" id="vlp-email" type="email" name="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required>
          <label class="vlp-consent"><input type="checkbox" name="consent" required><span>Yes, email me Velq launch and product updates. I can unsubscribe any time.</span></label>
          <p class="vlp-error" role="alert" aria-live="polite" hidden></p>
          <button class="vlp-button" type="submit">GET EARLY ACCESS &rarr;</button>
        </form>
        <p class="vlp-fine">Free to join. No purchase required. <a href="/privacy/">Privacy policy</a>.</p>
      </div>
      <div class="vlp-success" role="status" aria-live="polite" hidden>
        <p class="vlp-eyebrow">You're on the list</p>
        <h2 class="vlp-heading">See you at launch!</h2>
        <p class="vlp-copy">We'll email you when Velq is ready.</p>
        <button class="vlp-button" type="button" data-vlp-close>BACK TO VELQ</button>
      </div>
    </section>`;
  document.body.appendChild(shell);

  const popupForm = shell.querySelector('#velq-popup-form');
  const email = shell.querySelector('#vlp-email');
  const error = shell.querySelector('.vlp-error');
  const submit = popupForm.querySelector('button[type="submit"]');
  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch {} }
  };
  let opened = false;
  let lastFocus = null;
  let closedInSession = false;
  const startedAt = Date.now();

  function analytics(name, extra = {}) {
    const params = { form_id: 'velq-popup-form', popup_name: 'velq_early_access', ...extra };
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...params });
    if (window.VELQ_ANALYTICS?.ga4 && typeof window.gtag === 'function') window.gtag('event', name, params);
  }
  function eligible() {
    if (opened || closedInSession || storage.get('velq_waitlist_joined') === '1' || savedReceipt()) return false;
    const dismissed = Number(storage.get('velq_popup_dismissed_at') || 0);
    if (dismissed && Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) return false;
    if (document.visibilityState === 'hidden' || document.querySelector('dialog[open]')) return false;
    if (document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) return false;
    const section = document.querySelector('#waitlist');
    if (section) {
      const rect = section.getBoundingClientRect();
      if (rect.top < innerHeight * 0.85 && rect.bottom > 0) return false;
    }
    return true;
  }
  function open() {
    if (!eligible()) return;
    opened = true;
    lastFocus = document.activeElement;
    shell.hidden = false;
    shell.setAttribute('aria-hidden', 'false');
    document.body.classList.add('velq-lead-popup-open');
    shell.querySelector('.vlp-close').focus({ preventScroll: true });
    analytics('lead_popup_view');
  }
  function close() {
    if (shell.hidden) return;
    shell.hidden = true;
    shell.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('velq-lead-popup-open');
    closedInSession = true;
    if (storage.get('velq_waitlist_joined') !== '1') {
      storage.set('velq_popup_dismissed_at', String(Date.now()));
      analytics('lead_popup_dismiss');
    }
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
  }
  shell.querySelectorAll('[data-vlp-close]').forEach(button => button.addEventListener('click', close));
  shell.addEventListener('mousedown', event => { if (event.target === shell) close(); });
  document.addEventListener('keydown', event => {
    if (shell.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (event.key !== 'Tab') return;
    const focusables = [...shell.querySelectorAll('button:not([disabled]):not([hidden]),input:not([disabled]):not([hidden]),a[href]')]
      .filter(el => el.getClientRects().length && !el.closest('[hidden]'));
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  popupForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (!popupForm.reportValidity()) return;
    analytics('lead_popup_submit_attempt');
    submit.disabled = true;
    submit.textContent = 'JOINING...';
    error.hidden = true;
    error.textContent = '';
    try {
      // Keep the live waitlist's pending-receipt protocol and resume it on return visits.
      let { response, result } = await waitlistRequest({
        email: email.value.trim(), interest: 'strawberry', consent: true, company: ''
      });
      const started = Date.now();
      let delay = 1500;
      while (result.status === 'pending' && result.receipt && Date.now() - started < 10 * 60 * 1000) {
        storeReceipt(result.receipt);
        submit.textContent = 'CONFIRMING...';
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(10000, delay * 1.5);
        ({ response, result } = await waitlistRequest({ receipt: result.receipt }));
      }
      if (result.status === 'pending') {
        error.textContent = 'Your request is saved. Confirmation is still pending. Return to this page to check.';
        error.hidden = false;
        return;
      }
      if (!response.ok || result.ok !== true) {
        storeReceipt(null);
        throw new Error(result.status === 'suppressed'
          ? 'This address cannot be subscribed here. Please contact Velq.'
          : (result.error || 'We could not save your signup. Please try again.'));
      }
      storeReceipt(null);
      storage.set('velq_waitlist_joined', '1');
      shell.querySelector('.vlp-content').hidden = true;
      shell.querySelector('.vlp-success').hidden = false;
      shell.querySelector('.vlp-success button').focus({ preventScroll: true });
      analytics('lead_popup_signup_success', { new_lead: result.newLead === true });
      // Only a genuinely new, server-confirmed signup triggers the existing GA4 generate_lead event.
      if (result.status === 'confirmed' && result.newLead === true && typeof result.eventId === 'string' && result.eventId) {
        window.dispatchEvent(new CustomEvent('velq:waitlist-success', { detail: { eventId: result.eventId } }));
      }
    } catch (e) {
      error.textContent = savedReceipt() ? 'Your request was saved. Return later to check confirmation.' : (e?.name === 'AbortError' ? 'The request timed out. Please try again.' : (e?.message || 'Please check your connection and try again.'));
      error.hidden = false;
      if (!savedReceipt()) analytics('lead_popup_submit_failed', { failure_type: e?.name === 'AbortError' ? 'timeout' : 'request_failed' });
    } finally {
      submit.disabled = false;
      submit.textContent = 'GET EARLY ACCESS →';
    }
  });

  window.addEventListener('velq:waitlist-success', () => {
    storage.set('velq_waitlist_joined', '1');
    if (!shell.hidden && !shell.querySelector('.vlp-success').hidden) return;
    if (!shell.hidden) close();
  });
  setTimeout(open, 15000);
  window.addEventListener('scroll', () => {
    if (opened || Date.now() - startedAt < 8000) return;
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    if (scrollable > 0 && scrollY / scrollable > 0.55) open();
  }, { passive: true });
})();
