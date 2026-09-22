export function normalizeSearch(value = '') {
  return value.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
export function matchesRecipe(recipe, filters) {
  const words = normalizeSearch(filters.query).split(' ').filter(Boolean);
  const tokens = normalizeSearch(recipe.search).split(' ');
  return words.every(word => tokens.some(token => token.startsWith(word)))
    && (!filters.category || recipe.category === filters.category)
    && (!filters.duration || Number(recipe.minutes) <= Number(filters.duration))
    && (!filters.portions || (filters.portions === '2'
      ? Number(recipe.servings) <= 2 : Number(recipe.servings) >= 3));
}
