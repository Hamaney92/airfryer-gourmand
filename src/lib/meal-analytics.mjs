export function trackMealEvent(name, parameters = {}) {
  if (location.hostname !== 'airfryergourmand.fr' ||
      window.__afgMealLocationBlocked ||
      typeof window.gtag !== 'function') return;
  try {
    window.gtag('event', name, {
      ...parameters,
      page_id: location.pathname,
      transport_type: 'beacon',
    });
  } catch {
    // Analytics failures must not change the recipe or menu experience.
  }
}
