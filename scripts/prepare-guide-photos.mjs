import sharp from 'sharp';
import { stat } from 'node:fs/promises';
// Usage: node scripts/prepare-guide-photos.mjs choisir=/absolute/source.png ...
const allowed = new Set(['choisir','double-panier','familial','accessoires','marques','temps-cuisson']);
const sources = process.argv.slice(2).map(arg => {
  const separator = arg.indexOf('=');
  const name = arg.slice(0, separator);
  if (separator < 1 || !allowed.has(name)) throw new Error('Use name=source.png for one of the six guide photos');
  return [name, arg.slice(separator + 1)];
});
if (!sources.length) throw new Error('Provide name=source.png arguments');
for (const [name, source] of sources) {
  const widths = name === 'temps-cuisson' ? [600, 1000] : [360, 720];
  for (const width of widths) {
    const target = new URL(`../public/img/guides/${name}-photo-${width}.webp`, import.meta.url);
    await sharp(source).resize({width, height:Math.round(width*9/16), fit:'cover'}).webp({quality:80}).toFile(target.pathname.replace(/^\/(\w:)/,'$1'));
    console.log(name, width, (await stat(target)).size);
  }
}
