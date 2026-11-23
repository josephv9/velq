(() => {
  const signup = document.getElementById('waitlist');
  const hero = document.getElementById('home-cover');
  const banner = document.querySelector('.velq-benefit-marquee');
  if (!signup || !hero || !banner || !signup.parentNode) return;

  const originalPosition = document.createComment('velq-mobile-signup-original-position');
  signup.parentNode.insertBefore(originalPosition, signup);

  const mobile = window.matchMedia('(max-width: 700px)');
  const placeSignup = () => {
    if (mobile.matches) {
      if (signup.previousElementSibling !== banner) banner.insertAdjacentElement('afterend', signup);
    } else if (originalPosition.parentNode) {
      originalPosition.parentNode.insertBefore(signup, originalPosition);
    }
  };

  placeSignup();
  if (typeof mobile.addEventListener === 'function') mobile.addEventListener('change', placeSignup);
  else mobile.addListener(placeSignup);
})();
