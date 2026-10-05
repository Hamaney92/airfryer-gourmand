# Parcours newsletter et recette — 5 octobre 2026

- Cinq illustrations SVG originales ajoutées aux cartes /guides/ ; aucune photographie de produit ou expérience de test inventée.
- Newsletter : ouverture sur le site après cinq secondes visibles, une fois par session, uniquement pages éditoriales. Les liens rouvrent le même dialog, avec repli /newsletter/ interne. Consentement newsletter toujours explicite dans le formulaire existant 199341135344174725, case non cochée observée dans Chrome.
- Demande de recette : remplacement du mailto par un dialog propre au site ; email, titre et URL canonique envoyés en POST, sans inscription newsletter ni analytics contenant ces valeurs. Succès affiché seulement après success:true du fournisseur, sans prétendre réception confirmée. Timeout et erreur permettent une nouvelle tentative.
- Nouveau formulaire MailerLite 200506049966376365, groupe « Demandes de recette — envoi ponctuel », double opt-in désactivé vérifié via bouton gris translate-x-0.
- Workflow 200506634977412442 actif (bouton Pause observé), déclencheur Completes a form, un email puis sortie. Email 200506701921650401 : sujet Votre recette : {$recette}, titre et lien {$url_recette}, aucun abonnement ou suivi commercial. Aucun abonné existant ajouté : Started 0, Total emails sent 0 à l’activation. Réentrée configurée dans l’éditeur ; persistance à confirmer si demandes répétées.
- POST sans email validé : réponse JSON success:false/email required, aucun contact créé. OPTIONS confirme CORS POST autorisé. Ce n’est pas un test de livraison.
- Tests : build 146 pages, liens internes et SEO OK (107 schémas Recipe), 48 tests existants/nouveau popup réussis avant ajout du test POST simulé. Recette feta : ouverture automatique newsletter et dialog demande de recette vérifiés dans Chrome local.
- Limite : adresse de test demandée à Youssef ; réception réelle et personnalisation dans un email reçu restent à vérifier, aucune fausse inscription créée. Le mail transmet le titre et le lien, pas l’intégralité des ingrédients/étapes.

Les anciens formulaires/automations et les contacts existants ne sont pas modifiés. Aucun clic n’est traité comme inscription ou livraison confirmée.
