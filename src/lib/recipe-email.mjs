export async function requestRecipeEmail(form, fetcher = fetch, signal) {
  const body = new URLSearchParams(new FormData(form));
  body.set('ajax', '1');
  const response = await fetcher(form.action, { method: 'POST', body, signal, credentials: 'omit' });
  if (!response.ok) throw new Error('provider');
  const result = await response.json();
  if (result.success !== true) throw new Error('rejected');
  return true;
}
export function initRecipeEmail(dialog, env = window) {
  if (!dialog || dialog.dataset.initialized) return;
  dialog.dataset.initialized = 'true';
  const doc = dialog.ownerDocument;
  const openers = doc.querySelectorAll('[data-recipe-email-open]');
  let opener = null;
  let placement = 'recipe_save';
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('[data-recipe-email-status]');
  const submit = form.querySelector('button[type=submit]');
  // Provider acceptance is distinct from delivery and from newsletter consent.
  // Never include field values, email addresses or query strings in analytics.
  const track = name => {
    if (env.location?.hostname !== 'airfryergourmand.fr' || typeof env.gtag !== 'function') return;
    try {
      env.gtag('event', name, { placement, page_id: env.location.pathname, transport_type: 'beacon' });
    } catch { /* Analytics must never interrupt the requested email. */ }
  };
  openers.forEach(trigger => trigger.addEventListener('click', () => {
    if (doc.querySelector('dialog[open]')) return;
    opener = trigger;
    const source = trigger.dataset.leadSource || trigger.dataset.placement;
    placement = ['recipe_save', 'banner_recipe', 'reading_recipe'].includes(source) ? source : 'recipe_save';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else if (typeof dialog.show === 'function') dialog.show();
    else {
      if (!trigger.dataset.emailFallbackShown) {
        trigger.insertAdjacentText('afterend', ' Ce navigateur ne permet pas d’ouvrir le formulaire. Vous pouvez garder cette page dans vos favoris ou réessayer avec un navigateur récent.');
        trigger.dataset.emailFallbackShown = 'true';
      }
      track('recipe_email_unavailable');
      return;
    }
    track('recipe_email_open');
  }));
  dialog.querySelector('[data-recipe-email-close]').addEventListener('click', () => {
    if (typeof dialog.close === 'function') dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (opener?.closest?.('[hidden]')) doc.querySelector('h1')?.focus({ preventScroll: true });
    else opener?.focus();
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    submit.disabled = true;
    track('recipe_email_attempt');
    status.textContent = 'Enregistrement de votre demande…';
    const controller = new AbortController();
    const timeout = env.setTimeout(() => controller.abort(), 20000);
    try {
      await requestRecipeEmail(form, env.fetch.bind(env), controller.signal);
      track('recipe_email_request_accepted');
      status.textContent = 'Demande enregistrée. Le lien sera envoyé par email ; pensez à vérifier vos courriers indésirables.';
      form.reset();
    } catch {
      track('recipe_email_error');
      status.textContent = 'La demande n’a pas pu être confirmée. Réessayez dans un instant.';
    } finally {
      env.clearTimeout(timeout);
      submit.disabled = false;
    }
  });
}
