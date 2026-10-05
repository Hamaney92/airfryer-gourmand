# Invitations newsletter et livres — 5 octobre 2026

Ajout demandé par Youssef sur les pages recette, en remplacement de la préférence précédente pour l'absence d'invitations automatiques. Le PDF reste accessible directement.

## Comportement

- Newsletter : invitation compacte après 30 secondes visibles et un début de défilement. Texte contextualisé : desserts, poulet (dont recettes déjà classées légères), légumes/poissons ou autres repas. Le texte d'invitation change, sans création de nouveaux segments MailerLite ni promesse d'envoi de la recette consultée.
- Le bouton ouvre volontairement une boîte de dialogue contenant le formulaire MailerLite actuel. Champ email, accord explicite et bouton d'inscription sont rendus par MailerLite. Inscription directe configurée le 5 octobre ; aucun nouveau double opt-in introduit. L'iframe n'est chargée qu'à la demande ; lien de secours vers le formulaire hébergé.
- Livres : après 120 secondes dans l'onglet visible, mise en avant du livre choisi par la logique existante (Anti-Gaspi ou petites portions), bouton direct vers la fiche Amazon affiliée et lien pour feuilleter les deux livres. Aucune rareté, remise, note client ou expérience culinaire inventée.
- Chaque invitation apparaît au maximum une fois par session et disparaît après 45 secondes si elle n'a pas le focus. Fermeture au bouton ou à Échap. Le formulaire ouvert et la saisie dans un champ suspendent les nouvelles invitations. L'onglet en arrière-plan ne compte pas dans le délai. Les promotions restent compactes, sans masque ni capture de focus automatique.

## Suivi

`recipe_prompt_view` et `recipe_prompt_dismiss` distinguent newsletter/livre, avec chemin de page et aucun email. Ouverture du formulaire : `newsletter_signup_click`, placement `recipe_popup`. Le clic Amazon et l'entrée livres utilisent les écouteurs existants, placements `timed_recipe_book` et `timed_recipe_books`. Aucun événement clé automatiquement activé. Une ouverture de formulaire ne prouve pas un abonnement ; un clic Amazon ne prouve pas une vente.

## Vérification

Build et contrôle SEO réussis : 145 HTML, 107 schémas Recipe, 143 URL sitemap. 37 tests réussis, dont six nouveaux couvrant les délais, l'arrière-plan, l'absence de superposition avec le formulaire, la fréquence par session, le focus et le stockage bloqué.

Contrôle navigateur local : apparition contextuelle poulet, ouverture réelle du formulaire MailerLite avec champ et accord, fermeture. Contrôle visuel du composant livres à 390 × 844 dans une page temporaire locale, supprimée avant livraison : aucun débordement horizontal, CTA Amazon accessible. Le délai livres est vérifié par le test de l'horloge ; la capture mobile de contrôle ne constitue pas une preuve de son déclenchement réel après deux minutes.

Sources : Google recommande des promotions compactes plutôt que des interstitiels qui masquent le contenu : https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials . Cela ne garantit ni gain SEO ni absence d'effet sur l'engagement. Surveiller les inscriptions réelles, l'engagement et les clics commerciaux après publication.

Captures locales dans outputs : `popup-newsletter-poulet-2026-10-05.jpg` et `popup-livre-mobile-2026-10-05.jpg`. Aucune inscription de test ni clic Amazon de production effectué.
