# Livraison UX et conversion — 22 septembre 2026

## Périmètre

- Recherche par titre/ingrédient/mot-clé et filtres catégorie, durée totale et portions prévues. Les 106 recettes restent liées dans le HTML serveur, même sans JavaScript.
- Recherche depuis l'accueil. Catégories disponibles sans JavaScript.
- Promotions livres contextuelles après le contenu utile ; bandeau compact limité à l'accueil. Suppression du popup automatique.
- Téléchargement PDF direct et gratuit. Sauvegarde de recette via la messagerie du visiteur, distincte de l'abonnement volontaire.
- Newsletter avec consentement explicite, obligatoire et non précoché. Action MailerLite et champs de livraison existants conservés.
- Quatre aperçus authentiques du livre petites portions : sommaire, mode d'emploi, photo du flan et recette. Source : intérieur KDP v5 de 224 pages, pages PDF 5, 7, 10 et 11. Images WebP à chargement différé ; aucun manuscrit complet publié.
- Événements `book_preview_open` et `newsletter_form_submit`, sans adresse email. Le second mesure seulement une tentative de soumission valide, pas un abonnement confirmé.
- Clics Amazon et ventes restent distincts. Aucun gain de trafic ou de conversion n'est présumé.
- Cartes sur une colonne sous 420 px et tableaux de recettes défilables localement si nécessaire.
- Pinterest laissé au propriétaire ; aucune campagne payante ni inscription externe effectuée.

## Vérifications

- Construction du site réussie.
- 23 tests automatisés réussis : recherche, filtres, consentement, aperçus, événements, affiliation et non-régressions SEO du lot précédent.
- Contrôle SEO : 144 pages HTML, 106 schémas Recipe et 142 URL de sitemap ; liens internes résolus.
- Contrôle navigateur : recherche courgette (4 résultats), intersection des filtres, zéro résultat et réinitialisation ; parcours accueil vers résultats ; aperçu du livre ; ouverture volontaire du formulaire.
- Vérification responsive à 320 et 390 px puis sur ordinateur. Débordements corrigés sur catalogue et recette saumon ; aucune barre horizontale du document à 320 px après correction.
- Aucun formulaire réel soumis : livraison MailerLite, double opt-in et conservation de preuve de consentement côté fournisseur restent à contrôler. Cette livraison n'est pas un audit juridique de conformité.

## Point en attente

Le PDF Anti-Gaspi corrigé retrouvé compte 214 pages, mais le site indique 114 pages. L'aperçu et le nombre de pages n'ont pas été modifiés dans l'attente de confirmation de l'édition réellement vendue.

## Lecture des résultats ultérieurs

Comparer des périodes équivalentes et segmenter par appareil/source/page d'entrée. Observer les clics vers les livres, les ouvertures d'aperçus, les téléchargements et les soumissions ; confronter séparément aux abonnements confirmés MailerLite et commandes Amazon. Les changements simultanés ne constituent pas un test A/B et ne permettent pas une attribution causale isolée.
