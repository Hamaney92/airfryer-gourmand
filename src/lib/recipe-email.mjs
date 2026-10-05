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
  const opener = doc.querySelector('[data-recipe-email-open]');
  const form = dialog.querySelector('form');
  const status = dialog.querySelector('[data-recipe-email-status]');
  const submit = form.querySelector('button[type=submit]');
  opener.addEventListener('click', () => { if (!doc.querySelector('dialog[open]')) dialog.showModal(); });
  dialog.querySelector('[data-recipe-email-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => opener.focus());
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submit.disabled || !form.reportValidity()) return;
    submit.disabled = true;
    status.textContent = 'Enregistrement de votre demande…';
    const controller = new AbortController();
    const timeout = env.setTimeout(() => controller.abort(), 20000);
    try {
      await requestRecipeEmail(form, env.fetch.bind(env), controller.signal);
      status.textContent = 'Demande enregistrée. Le lien sera envoyé par email ; pensez à vérifier vos courriers indésirables.';
      form.reset();
    } catch {
      status.textContent = 'La demande n’a pas pu être confirmée. Réessayez dans un instant.';
    } finally {
      env.clearTimeout(timeout);
      submit.disabled = false;
    }
  });
}
