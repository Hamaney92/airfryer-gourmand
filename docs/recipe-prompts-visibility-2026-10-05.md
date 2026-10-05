# Invitations manquées : correction de visibilité

Signalement : absence des invitations sur la recette de feta, avec Chrome ordinateur. Leur présence visuelle a été constatée dans Chrome lors du contrôle précédent, mais cela ne prouve pas le parcours exact de l'utilisateur.

Défaut UX confirmé par le code : toute impression supprimait les affichages suivants dans la session, y compris quand la carte disparaissait automatiquement après 45 secondes sans interaction. L'utilisateur pouvait donc manquer la carte, actualiser et ne rien voir.

Changement : suppression de la fermeture automatique ; seule une fermeture volontaire (croix ou Échap), une ouverture du formulaire newsletter ou un clic de livre mémorise le choix pour la session. Une simple impression reste limitée à une fois par page, mais ne supprime plus une invitation sur la page suivante ou après rechargement. Les marqueurs `afg_prompt_v2_*` ne reprennent pas les anciens marqueurs d'impression `v1`, dont le sens ne permet pas de distinguer un refus volontaire d'un affichage manqué. Une ancienne fermeture peut donc être suivie d'une nouvelle invitation une fois après cette mise à jour.

Newsletter : 30 secondes visibles et défilement, avant la priorité livres ; elle est remplacée par la carte livres à 120 secondes si aucun formulaire ni contrôle n'est en cours d'utilisation. Livres : 120 secondes visibles, puis maintien jusqu'à fermeture ou clic. Aucune superposition de cartes ni interruption du formulaire.

Validation : 41 tests réussis, dont conservation de visibilité, rechargement après impression manquée, marqueurs historiques, fermeture intentionnelle, clics, clavier, formulaire, lecture visible et cache de navigation. Les clics ne sont toujours pas assimilés à un abonnement ou à une vente. Aucun réglage MailerLite ni consentement modifié.
