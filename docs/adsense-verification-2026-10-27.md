# Connexion AdSense — 27 octobre 2026

## Preuve de compte et périmètre

Le compte AdSense ouvert et autorisé par le titulaire présente bien `airfryergourmand.fr`, avec le statut « Examen requis ». La fiche du site fournit :

- `<meta name="google-adsense-account" content="ca-pub-9484796866041402">` ;
- `google.com, pub-9484796866041402, DIRECT, f08c47fec0942fa0` pour ads.txt.

Ces valeurs ont été lues dans les deux méthodes de validation de la fiche Airfryer Gourmand, pas déduites d'un autre domaine du compte. Aucune modification de l'autre site, des paiements, de l'identité ou des conditions contractuelles.

## Changement

La configuration active uniquement la preuve de propriété préparée précédemment : balise meta dans les deux layouts et fichier racine `/ads.txt`. Aucun script publicitaire, emplacement d'annonce ni paramètre de consentement n'est activé.

## Vérifications avant mise en ligne

- Build réussi : 146 pages, génération de `/ads.txt`.
- 75 tests réussis, dont exactitude de la balise sur tous les HTML et correspondance du fichier ads.txt avec la configuration.
- Contrôle SEO réussi : 146 HTML, 107 Recipe, 143 URL du sitemap.
- `check:adsense -- --require-publisher` : `verification_configured_not_approval`, `adDelivery: not_enabled`.
- Diff circonscrit, sans modification préexistante écrasée.

## Étapes distinctes restantes

Vérifier les fichiers réellement servis après déploiement, faire valider la propriété dans l'interface Google, puis demander l'examen si aucune acceptation contractuelle n'est exigée. Une validation de propriété ou un examen demandé n'est pas une approbation. La diffusion reste dépendante de l'approbation réelle, d'une CMP certifiée correctement configurée et de tests de consentement avant chargement publicitaire.
