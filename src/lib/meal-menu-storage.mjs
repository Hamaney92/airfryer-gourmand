export const MENU_STORAGE_KEY = 'afg_menu_saved_v1';
export const SESSION_MENU_KEY = 'afg_menu_session_v1';
export function readSavedMenu(raw, catalog) {
  if (raw === null) return {status:'empty'};
  try {
    const value = JSON.parse(raw);
    if (!value || value.version !== 1 || !Array.isArray(value.ids) || !value.ids.length || value.ids.length > 6 ||
      value.ids.some(id => typeof id !== 'string') || new Set(value.ids).size !== value.ids.length ||
      !Number.isInteger(value.people) || value.people < 1 || value.people > 12 ||
      typeof value.savedAt !== 'string' || !Number.isFinite(Date.parse(value.savedAt))) return {status:'invalid'};
    const ids = value.ids.filter(id => catalog.some(recipe => recipe.id === id));
    return {status:ids.length ? 'ready' : 'unavailable', menu:{version:1, ids, people:value.people, savedAt:value.savedAt}, removed:value.ids.length-ids.length};
  } catch { return {status:'invalid'}; }
}
export function makeSavedMenu(ids, people, catalog, savedAt = new Date().toISOString()) {
  const menu = {version:1, ids:[...ids], people, savedAt};
  const checked = readSavedMenu(JSON.stringify(menu), catalog);
  if (checked.status !== 'ready' || checked.removed) throw Error('Menu non valide');
  return menu;
}
