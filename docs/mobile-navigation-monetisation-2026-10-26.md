# Monétisation : accès mobile aux livres

## Défaut reproduit

Le 26 octobre 2026, sur le site construit avant correction (`79fca9c`), le test Chrome local à 390 px échoue après un clic sur le bouton de menu du dossier `/dossiers/recettes-air-fryer-automne/` : « Nos livres » reste masqué. Le layout `Base.astro` affiche un bouton sans gestionnaire, contrairement à `Layout.astro`. Ce défaut est une friction avérée ; aucune perte de ventes ne peut être quantifiée avec les accès actuels.

## Correction

- Les deux layouts utilisent maintenant le même comportement de navigation.
- Ouverture/fermeture du menu, état accessible annoncé, touche Échap et restitution du focus au bouton si le focus était dans le menu.
- Fermeture lors d'un changement mobile/ordinateur pour éviter un état ouvert résiduel.
- Le lien « Nos livres » du layout Base porte les mêmes métadonnées de suivi d'entrée que celui des recettes. Aucun nouvel événement clé ni nouveau traceur.
- Aucun changement de recette, d'offre, de prix, de newsletter, de consentement ou de configuration AdSense.

## Vérifications avant publication

- `npm run build` : succès, 146 pages.
- `node --test scripts/test-*.mjs` : 75/75.
- `npm run check:seo` : succès, 146 HTML, 107 Recipe, 143 URL du sitemap.
- `scripts/verify-navigation-browser.mjs` : 6 parcours réussis, dossier d'automne et recette de frites vers la collection de livres, à 390, 768 et 1366 px. Échap/focus et changements de largeur vérifiés sur les formats mobiles. Requêtes externes bloquées.
- `scripts/verify-conversion-browser.mjs` : 10 contrôles réussis ordinateur/mobile, dont extraits, destinations Amazon et matériel. Requêtes externes bloquées ; aucun achat effectué.
- `git diff --check` : aucun défaut d'espacement.

## Limites

Les tests de parcours prouvent le fonctionnement, pas une augmentation des achats. Les ventes KDP, commissions et revenus AdSense n'ont pas été vérifiés. AdSense demeure en préparation : identifiant éditeur réel, état d'approbation et CMP certifiée restent nécessaires avant diffusion.
