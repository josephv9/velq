/* Velq research interactions. Never transmit calculator inputs or product names. */
'use strict';
(() => {
  if (window.__velqResearchEvents) return;
  window.__velqResearchEvents = true;
  const contentId = 'gummy-serving-study-2026';
  const send = (eventName, parameters) => {
    if (window.VELQ_ANALYTICS?.ga4 && typeof window.gtag === 'function') {
      window.gtag('event', eventName, parameters);
    }
  };

  window.addEventListener('velq:calculator-complete', event => {
    const detail = event.detail || {};
    const allowed = ['serving-comparison', 'nutrition-label-value'];
    const modes = ['manual', 'example', 'preset'];
    if (!allowed.includes(detail.calculatorId) || !modes.includes(detail.mode)) return;
    send('calculator_complete', {
      calculator_id: detail.calculatorId,
      input_mode: detail.mode,
      content_group: 'research_tools'
    });
  });

  document.querySelectorAll('[data-research-download]').forEach(link => {
    link.addEventListener('click', () => {
      const format = link.dataset.researchDownload;
      if (!['csv', 'json'].includes(format)) return;
      send('research_download', {content_id: contentId, file_format: format});
    });
  });

  document.querySelectorAll('[data-copy-citation]').forEach(button => {
    button.addEventListener('click', async () => {
      const source = document.getElementById(button.dataset.copyCitation || '');
      const status = document.getElementById(button.dataset.copyStatus || 'citation-status');
      if (!source || !source.textContent.trim()) return;
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(source.textContent.trim());
        if (status) status.textContent = 'Citation copied.';
        send('citation_copy', {content_id: contentId});
      } catch {
        if (status) status.textContent = 'Select the citation text and copy it using your device’s copy command.';
      }
    });
  });
})();
