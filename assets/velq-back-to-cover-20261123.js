(() => {
  const link = document.querySelector('a.back-top');
  const cover = document.getElementById('home-cover');
  if (!link || !cover) return;

  link.addEventListener('click', (event) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      cover.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    } catch {
      window.scrollTo(0, 0);
    }
    if (window.location.hash !== '#home-cover') {
      window.history.replaceState(null, '', '#home-cover');
    }
  });
})();
