import { defineConfig } from 'astro/config';

// Le `site` est indispensable : il alimente les URLs canoniques, Open Graph
// et le sitemap. `trailingSlash: 'always'` aligne les URLs sur celles
// déclarées dans sitemap.xml.ts (ex. /recettes/mon-plat/).
export default defineConfig({
  site: 'https://airfryergourmand.fr',
  trailingSlash: 'always',
  // CSS inliné dans le <head> : supprime la requête bloquant le rendu
  // (~1,6 s gagnée sur mobile d'après PageSpeed, le fichier ne fait que ~10 Ko).
  build: { inlineStylesheets: 'always' },
});
