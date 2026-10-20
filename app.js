/* Velq navigation and inline waitlist. The shared client owns signup state. */
(() => {
  'use strict';
  if (window.__velqAppLoaded) return;
  window.__velqAppLoaded = true;
  const mobileNav = document.querySelector('#mobile-nav');
  const menuToggle = document.querySelector('#menu-toggle');
  function closeMenu() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.hidden = true;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open menu');
  }
  if (mobileNav && menuToggle) {
    menuToggle.addEventListener('click', () => {
      mobileNav.hidden = !mobileNav.hidden;
      menuToggle.setAttribute('aria-expanded', String(!mobileNav.hidden));
      menuToggle.setAttribute('aria-label', mobileNav.hidden ? 'Open menu' : 'Close menu');
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menuToggle.focus(); }
    });
  }
  const form = document.querySelector('#waitlist-form');
  const interest = document.querySelector('#waitlist-interest');
  if (form && window.VelqWaitlist) {
    window.VelqWaitlist.bindForm({ form, submit: document.querySelector('#waitlist-submit'), feedback: document.querySelector('#signup-feedback'), source: 'inline', autoResume: true });
    document.querySelectorAll('[data-interest]').forEach(link => link.addEventListener('click', () => { if (interest) interest.value = 'strawberry'; }));
    document.querySelectorAll('a[href="#waitlist"]').forEach(link => link.addEventListener('click', () => {
      const email = form.elements.email;
      if (email && !email.disabled) email.focus({ preventScroll: true });
    }));
  }
  const privacy = document.querySelector('#privacy-dialog');
  document.querySelector('#privacy-open')?.addEventListener('click', () => privacy?.showModal());
  document.querySelector('#privacy-close')?.addEventListener('click', () => privacy?.close());
  const context = document.modelContext;
  if (context?.registerTool && form) {
    const lifecycle = new AbortController();
    window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
    try {
      Promise.resolve(context.registerTool({ name: 'start_velq_waitlist_signup', description: 'Navigate to the Velq strawberry gummy waitlist signup form. Does not submit an email or join the waitlist.', inputSchema: { type: 'object', properties: { interest: { type: 'string', enum: ['strawberry'] } }, additionalProperties: false }, annotations: { readOnlyHint: false }, execute(input) {
        if (input?.interest && input.interest !== 'strawberry') throw new Error('Unknown product interest.');
        if (interest) interest.value = 'strawberry';
        document.querySelector('#waitlist')?.scrollIntoView();
        if (!form.elements.email?.disabled) form.elements.email?.focus({ preventScroll: true });
        return { status: 'form_open', submitted: false };
      } }, { signal: lifecycle.signal })).catch(() => {});
    } catch {}
  }
  const stickyAccess = document.querySelector('.mobile-early-access');
  const waitlist = document.querySelector('#waitlist');
  const hideJoinedSticky = () => { if (stickyAccess) stickyAccess.hidden = true; };
  if (stickyAccess && waitlist && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => { stickyAccess.hidden = Boolean(window.VelqWaitlist?.joined()) || entries.some(entry => entry.isIntersecting); }, { threshold: 0 });
    observer.observe(waitlist);
  }
  if (window.VelqWaitlist?.joined()) hideJoinedSticky();
  window.addEventListener('velq:waitlist-confirmed', hideJoinedSticky);
})();
