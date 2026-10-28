# Maintenance des dépendances — 28 octobre 2026

Périmètre : mise à jour du verrouillage des dépendances dans les plages déjà autorisées par package.json. `npm update --ignore-scripts`, sans `--force`, sans changement de dépendance directe déclarée, sans ajouter de service, clé ou droit d’accès.

Avant : `npm audit` signalait9 dépendances (7high,2moderate). Après mise à jour :0 signalée dans les catégories info/low/moderate/high/critical. Cela décrit le résultat de la base d’avis consultée, pas une certification d’absence de toute vulnérabilité.

Version Astro installée après mise à jour :7.4.2. @astrojs/sitemap reste3.7.4. package.json conserve les plages ^7.2.10 et ^3.7.4. Le site reste en sortie statique.

Validation locale après mise à jour :

- Build réussi :148 pages HTML.
- check:seo réussi :107 schémas Recipe,145 URL sitemap et cibles internes résolues.
- test-christmas-content réussi : H1, canonicals, JSON-LD, sitemap, assets, recettes publiées, liens affiliés et CTA livres.
- test-contextual-commerce :7 tests réussis,0échec.
- git diff --check sans erreur.

Les autres modifications de l’ancienne copie de travail sont restées hors du lot. Les deux nouvelles formules de recettes préparées localement ne sont pas publiées ni programmées. Le rendu visuel mobile n’est pas certifié par ces tests de structure.
