import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const recipesDir = path.resolve('src/content/recipes');
const files = (await readdir(recipesDir)).filter((file) => file.endsWith('.md'));
const recipes = await Promise.all(
  files.map(async (file) => {
    const source = await readFile(path.join(recipesDir, file), 'utf8');
    const pubDate = source.match(/^pubDate:\s*(\d{4}-\d{2}-\d{2})/m)?.[1];
    return { slug: path.basename(file, '.md'), source, pubDate: pubDate ? new Date(`${pubDate}T00:00:00Z`) : null };
  }),
);

const now = new Date();
const upcoming = new Set(recipes.filter((recipe) => recipe.pubDate && recipe.pubDate > now).map((recipe) => recipe.slug));
const brokenLinks = [];

for (const recipe of recipes.filter((recipe) => recipe.pubDate && recipe.pubDate <= now)) {
  for (const match of recipe.source.matchAll(/\/recettes\/([^/\)\]"'?#]+)/g)) {
    if (upcoming.has(match[1])) brokenLinks.push(`${recipe.slug} -> ${match[1]}`);
  }
}

if (brokenLinks.length) {
  console.error('Des recettes publiées lient encore vers des recettes non publiées :');
  console.error(brokenLinks.map((link) => `- ${link}`).join('\n'));
  process.exit(1);
}

console.log('Liens internes publiés : OK');
