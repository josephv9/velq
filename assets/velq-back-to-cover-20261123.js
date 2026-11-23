(() => {
  const link = document.querySelector('a.back-top');
  const cover = document.getElementById('home-cover');
  if (!link || !cover) return;

  link.addEventListener('click', (event) => {
    event.preventDefault();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = reduceMotion ? 'auto' : 'smooth';

    if (window.location.hash !== '#home-cover') {
      window.history.replaceState(null, '', '#home-cover');
    }
    window.scrollTo({ top: 0, behavior });
  });
})();
