# Correction des invitations après retour navigateur

Le compteur était annulé lors de `pagehide`, sans reprise lors de `pageshow`. Une recette restaurée depuis le cache de navigation du navigateur pouvait donc ne plus déclencher ses invitations.

Correction circonscrite : reprise d'un seul intervalle sur `pageshow.persisted`, remise à zéro de la référence temporelle pour ne pas compter l'absence, arrêt à chaque `pagehide`. Les délais, limites par session et règles de consentement restent inchangés.

Test de régression : navigation après 20 secondes, absence de 300 secondes, reprise et affichage newsletter après les 10 secondes de lecture restantes ; deuxième départ/retour et affichage livres à 120 secondes visibles cumulées sur cette page. Une notification de restauration répétée ne crée pas un deuxième intervalle.

La défaillance est reproduite par le test avant correction. Elle n'est pas établie comme cause de l'incident utilisateur : son URL et son navigateur restent à préciser. Les tests automatisés ne constituent pas une vérification du cache de navigation sur son appareil.
