// Shared disclosure behaviour for both page layouts. No tracking or storage.
export function initSiteNavigation(root = document) {
  const button = root.querySelector('[aria-controls="primary-navigation"]');
  const navigation = root.querySelector('#primary-navigation');
  if (!button || !navigation) return;
  const setOpen = open => {
    navigation.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setOpen(false);
  });
  root.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || button.getAttribute('aria-expanded') !== 'true') return;
    const focusInMenu = navigation.contains(root.activeElement);
    setOpen(false);
    if (focusInMenu) button.focus();
  });
  // Do not leave an expanded menu behind after rotating/resizing the viewport.
  const mobile = root.defaultView.matchMedia('(max-width: 1100px)');
  mobile.addEventListener('change', () => setOpen(false));
  setOpen(false);
}
