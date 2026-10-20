"use strict";
(() => {
  const status = document.getElementById("copy-status");
  const fallbackWrap = document.getElementById("copy-fallback-wrap");
  const fallback = document.getElementById("copy-fallback");
  document.querySelectorAll("[data-copy-target], [data-copy-text]").forEach((button) => {
    button.hidden = false;
    button.addEventListener("click", async () => {
      const target = button.dataset.copyTarget && document.getElementById(button.dataset.copyTarget);
      const text = button.dataset.copyText || (target && target.textContent.trim());
      if (!text || !status || !fallbackWrap || !fallback) return;
      const label = button.dataset.copyLabel || "Text";
      fallbackWrap.hidden = true;
      status.textContent = "";
      try {
        if (!navigator.clipboard || !window.isSecureContext) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        status.textContent = label + " copied.";
      } catch (_) {
        fallback.value = text;
        fallbackWrap.hidden = false;
        fallback.focus();
        fallback.select();
        fallback.setSelectionRange(0, text.length);
        status.textContent = "Automatic copying is unavailable. The text is selected below so you can copy it.";
      }
    });
  });
})();
