// Progressive enhancement: the original image link remains usable without dialogs or JS.
export function initBookPreview(root) {
  if (!root || root.dataset.previewInitialized) return;
  const dialog = root.querySelector('[data-book-preview-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;
  root.dataset.previewInitialized = 'true';
  const links = [...root.querySelectorAll('a[data-book-preview]')];
  const image = dialog.querySelector('[data-preview-image]');
  const caption = dialog.querySelector('[data-preview-caption]');
  const previous = dialog.querySelector('[data-preview-previous]');
  const next = dialog.querySelector('[data-preview-next]');
  let current = 0, opener = null;
  const show = index => {
    current = Math.max(0, Math.min(links.length - 1, index));
    const link = links[current];
    image.src = link.href;
    image.alt = link.querySelector('img').alt;
    caption.textContent = `${current + 1} / ${links.length} · ${link.dataset.previewTitle}`;
    previous.disabled = current === 0;
    next.disabled = current === links.length - 1;
  };
  links.forEach((link, index) => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
    if (root.ownerDocument.querySelector('dialog[open]')) return;
    show(index);
    dialog.showModal();
    opener = link;
    event.preventDefault();
    // Keep the original click bubbling for existing data-book-preview tracking.
  }));
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  dialog.querySelector('[data-preview-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener?.focus({ preventScroll: true }));
  dialog.addEventListener('keydown', event => {
    if (!dialog.open || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); show(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); show(current + 1); }
    // Escape is handled by the native dialog, including focus restoration on close.
  });
}
