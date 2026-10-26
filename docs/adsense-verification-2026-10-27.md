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

## Résultat après publication et validation Google

- Version de connexion publiée : `5435f60`, déploiement Cloudflare Pages terminé avec succès.
- Contrôle public le 27 octobre 2026 à 00 h 33, heure de Paris : accueil, dossier d'automne, recette de frites et collection de livres en HTTP 200, une balise exacte dans chaque en-tête vérifié, aucun script de diffusion publicitaire. `/ads.txt` en HTTP 200 et `text/plain`, ligne identique à celle du compte.
- Google a affiché « Votre site est validé » après vérification de la balise meta.
- La demande d'examen a ensuite été envoyée. L'écran de confirmation affiche « Merci d'avoir connecté le site » et « Votre site est en cours d'examen en vue de diffuser des annonces » pour Airfryer Gourmand.
- Capture de preuve conservée dans le dossier `outputs` du projet parent : `adsense-examen-2026-10-27.png`.
- Aucune acceptation de conditions, modification des paiements, de l'identité ou d'un autre domaine n'a été effectuée.

## Étapes distinctes restantes

Un examen demandé n'est pas une approbation. La diffusion reste dépendante de l'approbation réelle, d'une CMP certifiée correctement configurée et de tests de consentement avant chargement publicitaire. Aucun revenu AdSense n'est attesté par cette connexion.
