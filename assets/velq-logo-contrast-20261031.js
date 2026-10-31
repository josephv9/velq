/* Choose readable monochrome logos from the actual rendered background. */
(() => {
  const apply = () => document.querySelectorAll('.velq-bag-logo').forEach(logo => {
    let dark = !!logo.closest('.cover-home');
    if (!dark) {
      let node = logo.parentElement;
      let rgb = [255, 255, 255];
      while (node) {
        const values = getComputedStyle(node).backgroundColor.match(/[\d.]+/g);
        if (values && (values.length < 4 || Number(values[3]) >= 0.9)) {
          rgb = values.slice(0, 3).map(Number);
          break;
        }
        node = node.parentElement;
      }
      const linear = rgb.map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
      dark = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2] < 0.179;
    }
    logo.classList.toggle('velq-logo-on-dark', dark);
    logo.classList.toggle('velq-logo-on-light', !dark);
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply);
  else apply();
})();
