(() => {
  const link = document.querySelector('a.back-top');
  if (!link) return;

  link.addEventListener('click', (event) => {
    event.preventDefault();
    if (window.location.hash !== '#home-cover') {
      window.history.replaceState(null, '', '#home-cover');
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo(0, 0);
    if (!reduceMotion) {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }
  });
})();
