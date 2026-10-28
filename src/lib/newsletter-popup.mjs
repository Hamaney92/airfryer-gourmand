export function initNewsletterPopup(dialog) {
  if (!dialog || dialog.dataset.popupInitialized) return;
  dialog.dataset.popupInitialized = 'true';
  const doc = dialog.ownerDocument;
  const frame = dialog.querySelector('iframe');
  let opener = null;
  const open = trigger => {
    if (dialog.open || typeof dialog.showModal !== 'function' || doc.querySelector('dialog[open]')) return false;
    opener = trigger;
    if (!frame.src) frame.src = frame.dataset.newsletterUrl;
    dialog.showModal();
    doc.documentElement.dataset.newsletterHandled = 'true';
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
  // Opening is always an explicit choice. The click listener also survives
  // Back/Forward cache restoration, without restarting an entry timer.
}
