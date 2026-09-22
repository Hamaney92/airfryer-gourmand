// Input: page PNGs rendered from the verified book interior with pdftoppm.
// Never copy the complete manuscript into public/.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const output = new URL('../public/img/books/previews/', import.meta.url);
await mkdir(output, { recursive: true });
for (const [input, name] of [['seniors-5','seniors-sommaire'],['seniors-7','seniors-mode-emploi'],['seniors-010','seniors-flan-photo'],['seniors-011','seniors-flan-recette']]) {
  await sharp(fileURLToPath(new URL(`../tmp/book-previews/${input}.png`, import.meta.url)))
    .webp({ quality: 90 }).toFile(fileURLToPath(new URL(`${name}.webp`, output)));
  console.log(name);
}
// Anti-Gaspi v4, 214 pages; PDF pages 4, 5, 6 and 7 rendered with -singlefile.
for (const name of ['anti-gaspi-sommaire', 'anti-gaspi-chapitre', 'anti-gaspi-croutons-photo', 'anti-gaspi-croutons-recette']) {
  await sharp(fileURLToPath(new URL(`../tmp/pdfs/${name}.png`, import.meta.url)))
    .webp({ quality: 90 }).toFile(fileURLToPath(new URL(`${name}.webp`, output)));
  console.log(name);
}
