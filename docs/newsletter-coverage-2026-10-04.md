# Couverture du suivi newsletter — 4 octobre 2026

## Défaut confirmé

Le modèle `Base.astro` affichait le bandeau newsletter depuis le 30 septembre sans inclure `ConversionTracking`. Le test sur le HTML construit avant correction trouve 12 pages concernées : l'index des guides, six dossiers (dont automne et réchauffage) et cinq guides. Les deux modèles de page avaient aussi un lien newsletter de pied de page sans attribut de suivi. Les pages livres utilisent `Layout.astro` : leur script était déjà présent.

Cela prouve une lacune de couverture, pas que cette lacune explique à elle seule l'absence d'événements newsletter dans le relevé GA4 du 24–30 septembre.

## Correctif

- Inclusion du composant existant dans Base, une seule fois.
- Attribution des liens newsletter des deux pieds de page via `data-newsletter-signup` et `footer_${pageType}`.
- Aucun changement visuel, de destination, de consentement, de configuration GA4 ou d'événement clé. Aucun email transmis. Le clic reste une intention, ni une ouverture externe confirmée ni un abonnement confirmé.

## Validation locale

Les deux nouveaux tests échouent avant correction et passent après : couverture de tous les bandeaux dans le HTML généré et attribution des pieds de page représentatifs des deux modèles. Build et liens internes réussis ; contrôle SEO : 145 pages HTML, 107 Recipe, 143 URL sitemap. Les six suites exécutées totalisent 31 tests réussis, notamment les événements livres, l'absence de données personnelles et les protections contre les doublons.

## Mesure après livraison

Vérifier la présence du script dans le HTML public et observer ensuite la réception de clics réels dans GA4. Ne pas générer de clic de production ou d'inscription factice. Annoter le 4 octobre comme nouvelle rupture de couverture ; une hausse des événements après correction ne démontrera pas une hausse du taux d'inscription. Aucun nouveau relevé GA4 n'est effectué dans ce correctif ; le bilan du 4 octobre reste la référence, avec ses périodes explicitement indiquées.
