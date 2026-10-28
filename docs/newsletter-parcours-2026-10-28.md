# Parcours email — corrections du 28 octobre 2026

Base : main 41784d586a7f10b0abf17368fae8418b1a1c61af. Changements préparés localement, sans publication ni modification du compte MailerLite.

## Changements

- Suppression de la fenêtre newsletter automatique à cinq secondes. Les liens volontaires ouvrent toujours le formulaire newsletter.
- Sur une recette, le bandeau et l'invitation après lecture proposent le lien de cette recette par email. Tous les boutons ouvrent un seul formulaire ponctuel existant, sans inscription commerciale automatique.
- L'invitation après lecture nécessite toujours trente secondes visibles et du défilement. Les livres restent présentés séparément.
- Sur les autres pages, promesse simplifiée : idées de recettes et conseils hebdomadaires. Information sur les livres, recommandations affiliées et désinscription conservée.
- Boutons mobiles à largeur adaptée, textes pouvant passer à la ligne, retour du focus après fermeture et solution explicative si le navigateur ne gère pas les dialogues.

## Mesure et limites

- `banner_view` : au moins 50 % du bandeau visible, une fois par page ; offre recette ou newsletter. Dépend de la disponibilité d'Analytics et d'IntersectionObserver.
- `recipe_email_open`, `recipe_email_attempt`, `recipe_email_request_accepted`, `recipe_email_error`, `recipe_email_unavailable` : étapes distinctes. Placements autorisés : banner_recipe, reading_recipe, recipe_save.
- L'acceptation exige une réponse HTTP réussie et `success === true`. Elle ne prouve ni la livraison du mail ni un nouvel abonnement.
- `newsletter_signup_click` reste une intention. L'ancien `newsletter_form_submit` trompeur est supprimé. Le succès dans l'iframe externe doit être vérifié dans MailerLite.
- Les événements n'incluent aucun email, valeur de champ ou paramètre de requête. Une erreur Analytics ne doit pas empêcher la demande.
- Les tests utilisent un fournisseur simulé et n'envoient aucun email. Livraison réelle, remontée effective GA4 et rendu visuel au clavier mobile non vérifiés dans cette exécution.

## Lecture des résultats après déploiement

Comparer sur une même période complète les utilisateurs exposés, ouvertures, tentatives et demandes acceptées, par placement et appareil. Lire séparément les nouveaux consentements newsletter et les envois ponctuels dans MailerLite. Ne pas comparer directement le nombre total de visiteurs au solde net des abonnés.
