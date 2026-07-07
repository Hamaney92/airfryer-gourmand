import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://airfryergourmand.fr';

export const GET: APIRoute = async () => {
  const recipes = (await getCollection('recipes'))
    .filter((r) => r.data.pubDate.getTime() <= Date.now())
    .sort((a, b) => b.data.reviews - a.data.reviews);

  const recipeLines = recipes
    .map((r) => `- [${r.data.title}](${SITE}/recettes/${r.slug}/): ${r.data.description}`)
    .join('\n');

  const body = `# Airfryer Gourmand

> Le guide francophone pour tout réussir à l'air fryer : temps de cuisson exacts, températures, astuces testées et un convertisseur four vers air fryer. Chaque recette est testée avant publication.

## Outils

- [Convertisseur temps de cuisson air fryer](${SITE}/temps-de-cuisson/): tableau interactif des temps et températures par aliment, plus un convertisseur four vers air fryer.

## Recettes

${recipeLines}

## Pages

- [Toutes les recettes air fryer](${SITE}/recettes/): l'ensemble des recettes testées, par catégorie.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
