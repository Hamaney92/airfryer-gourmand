export function initNewsletterPopup(dialog, env = window) {
  if (!dialog || dialog.dataset.popupInitialized) return;
  dialog.dataset.popupInitialized = 'true';
  const doc = dialog.ownerDocument;
  const frame = dialog.querySelector('iframe');
  const sessionKey = 'afg_newsletter_intro_v1';
  let opener = null, elapsed = 0, lastTick = env.performance.now(), shown = false;
  try { shown = !!env.sessionStorage.getItem(sessionKey); } catch {}
  const open = (trigger = null, automatic = false) => {
    if (dialog.open || typeof dialog.showModal !== 'function' || doc.querySelector('dialog[open]')) return false;
    opener = trigger;
    if (!frame.src) frame.src = frame.dataset.newsletterUrl;
    dialog.showModal();
    doc.documentElement.dataset.newsletterHandled = 'true';
    shown = true;
    try { env.sessionStorage.setItem(sessionKey, '1'); } catch {}
    if (automatic && env.location.hostname === 'airfryergourmand.fr' && typeof env.gtag === 'function')
      env.gtag('event', 'newsletter_popup_view', { placement: 'entry_popup', page_id: env.location.pathname });
    return true;
  };
  doc.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || (event.button && event.button !== 0)) return;
    const trigger = event.target.closest?.('a[data-newsletter-signup]');
    if (!trigger) return;
    if (dialog.open || open(trigger)) event.preventDefault();
  });
  // RecipePrompts already owns its dialog's close button and focus restoration.
  if (!doc.querySelector('[data-recipe-prompts]')) {
    dialog.querySelector('[data-newsletter-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  }
  const tick = () => {
    const now = env.performance.now();
    const delta = Math.min((now - lastTick) / 1000, 2);
    lastTick = now;
    if (doc.hidden || shown || !dialog.hasAttribute('data-auto-newsletter')) return;
    elapsed += delta;
    if (elapsed >= 5 && !/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName || '')) open(null, true);
  };
  let timer = env.setInterval(tick, 1000);
  doc.addEventListener('visibilitychange', () => { lastTick = env.performance.now(); });
  env.addEventListener('pagehide', () => { env.clearInterval(timer); timer = null; });
  env.addEventListener('pageshow', event => {
    if (event.persisted && timer === null) { lastTick = env.performance.now(); timer = env.setInterval(tick, 1000); }
  });
}
