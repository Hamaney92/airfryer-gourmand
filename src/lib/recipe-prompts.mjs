// The clock counts visible reading time. Invitations never overlap the form.
export function initRecipePrompts(root, env = window) {
  if (root.dataset.initialized) return;
  root.dataset.initialized = 'true';
  const doc = root.ownerDocument;
  const newsletter = root.querySelector('[data-prompt="newsletter"]');
  const book = root.querySelector('[data-prompt="book"]');
  const dialog = root.querySelector('dialog');
  const frame = root.querySelector('iframe');
  let elapsed = 0, lastTick = env.performance.now(), active = null, opener = null;
  const seen = new Set();
  // v1 remembered any display, including invitations missed before auto-hide.
  // v2 remembers an intentional dismissal or CTA, not a mere impression.
  const key = type => `afg_prompt_v2_${type}`;
  for (const type of ['newsletter', 'book']) {
    try { if (env.sessionStorage.getItem(key(type))) seen.add(type); } catch {}
  }
  const send = (name, params) => {
    if (env.location.hostname === 'airfryergourmand.fr' && typeof env.gtag === 'function')
      env.gtag('event', name, { ...params, page_id: env.location.pathname, transport_type: 'beacon' });
  };
  const hide = () => {
    if (!active) return;
    const restore = active.contains(doc.activeElement);
    active.hidden = true;
    active = null;
    if (restore) doc.querySelector('h1')?.focus({ preventScroll: true });
  };
  const show = type => {
    hide();
    active = type === 'book' ? book : newsletter;
    active.hidden = false;
    seen.add(type);
    send('recipe_prompt_view', { prompt_type: type });
  };
  const remember = type => {
    if (!type) return;
    seen.add(type);
    try { env.sessionStorage.setItem(key(type), '1'); } catch {}
  };
  const dismiss = () => {
    if (!active) return;
    const type = active.dataset.prompt;
    remember(type);
    send('recipe_prompt_dismiss', { prompt_type: type });
    hide();
  };
  const tick = () => {
    const now = env.performance.now();
    const delta = Math.min((now - lastTick) / 1000, 2);
    lastTick = now;
    if (doc.hidden) return;
    elapsed += delta;
    if (dialog.open || /^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement?.tagName || '') || active?.contains(doc.activeElement)) return;
    if (elapsed >= 120 && !seen.has('book')) { show('book'); return; }
    const read = env.scrollY >= Math.min(300, (doc.documentElement.scrollHeight - env.innerHeight) * 0.2) && env.scrollY > 0;
    if (!active && elapsed >= 30 && elapsed < 110 && read && !seen.has('newsletter')) show('newsletter');
  };
  let timer = env.setInterval(tick, 1000);
  // Update the clock boundary when the tab changes visibility (no background time).
  doc.addEventListener('visibilitychange', () => { lastTick = env.performance.now(); });
  env.addEventListener('pagehide', () => {
    env.clearInterval(timer);
    timer = null;
  });
  // A cached page is restored without rerunning its module script.
  // Resume the timer on browser Back/Forward, excluding time spent away.
  env.addEventListener('pageshow', event => {
    if (!event.persisted || timer !== null) return;
    lastTick = env.performance.now();
    timer = env.setInterval(tick, 1000);
  });
  root.querySelectorAll('[data-prompt-close]').forEach(button => button.addEventListener('click', dismiss));
  doc.addEventListener('keydown', event => { if (event.key === 'Escape' && !dialog.open) dismiss(); });
  root.querySelectorAll('[data-prompt="book"] a').forEach(link => link.addEventListener('click', () => {
    remember('book');
    hide();
  }));
  root.querySelector('[data-newsletter-open]').addEventListener('click', event => {
    opener = event.currentTarget;
    remember('newsletter');
    hide();
    if (!frame.src) frame.src = frame.dataset.newsletterUrl;
    if (typeof dialog.showModal !== 'function') { env.location.assign(frame.dataset.newsletterUrl); return; }
    dialog.showModal();
    send('newsletter_signup_click', { placement: 'recipe_popup', consent_version: 'newsletter_2026_09_22' });
  });
  root.querySelector('[data-newsletter-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    if (opener && !opener.closest('[hidden]')) opener.focus();
    else doc.querySelector('h1')?.focus({ preventScroll: true });
  });
  doc.querySelector('h1')?.setAttribute('tabindex', '-1');
}
