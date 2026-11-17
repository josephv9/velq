(() => {
  'use strict';
  const form = document.getElementById('claim-form');
  if (!form) return;
  const email = document.getElementById('claim-email');
  const consent = document.getElementById('claim-consent');
  const button = document.getElementById('claim-button');
  const message = document.getElementById('claim-message');
  const originalButton = button.innerHTML;
  let busy = false;
  const track = (name) => {
    // Do not send email addresses, coupon codes or personal details to GA4.
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, { offer: 'velq_bag_qr_10', surface: 'qr_claim' });
    } else if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: name, offer: 'velq_bag_qr_10', surface: 'qr_claim' });
    }
  };
  track('qr_offer_view');
  const show = (text, state) => {
    message.textContent = text;
    message.dataset.state = state;
  };
  const finish = (text, state, buttonText) => {
    show(text, state);
    button.textContent = buttonText;
    button.disabled = true;
    email.readOnly = true;
    consent.disabled = true;
    form.setAttribute('aria-busy', 'false');
  };
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (busy) return;
    email.value = email.value.trim();
    email.setAttribute('aria-invalid', 'false');
    if (!email.checkValidity()) {
      email.setAttribute('aria-invalid', 'true');
      show('Please enter a valid email address.', 'error');
      email.focus();
      return;
    }
    if (!consent.checked) {
      show('Please agree to receive emails to claim your offer.', 'error');
      consent.focus();
      return;
    }
    busy = true;
    button.disabled = true;
    button.textContent = 'CHECKING…';
    form.setAttribute('aria-busy', 'true');
    show('', '');
    track('qr_offer_submit');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    try {
      const response = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          email: email.value,
          consent: true,
          company: form.elements.company.value
        })
      });
      const result = await response.json();
      if (!result || typeof result !== 'object') throw new Error('Unexpected response.');
      if (response.ok && result.status === 'claimed') {
        finish('Your claim is saved. Please check your inbox for your single-use 10% code.', 'success', 'CHECK YOUR INBOX');
        track('qr_offer_claimed');
        return;
      }
      if (response.ok && result.status === 'already') {
        finish('This email has already claimed the 10% offer. Check your inbox for your original code.', 'pending', 'ALREADY CLAIMED');
        track('qr_offer_already_claimed');
        return;
      }
      if (response.ok && result.status === 'processing') {
        finish('Your claim is being processed. Check your inbox; submitting again will not generate another code.', 'pending', 'CHECK YOUR INBOX');
        return;
      }
      const errorMessage = typeof result.message === 'string' && result.message.length < 220
        ? result.message : 'We could not complete your request. Please try again later.';
      show(errorMessage, 'error');
    } catch (_) {
      show('We could not confirm your claim. Please check your inbox before trying again.', 'error');
    } finally {
      clearTimeout(timer);
      busy = false;
      form.setAttribute('aria-busy', 'false');
      if (!email.readOnly) {
        button.disabled = false;
        button.innerHTML = originalButton;
      }
    }
  });
})();