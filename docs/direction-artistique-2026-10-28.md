# Direction artistique — 28 octobre 2026

## Demande et méthode

Améliorer le style artistique du site avec les skills et Agency Agents. La revue du profil `work/agency-agents/design/design-ui-designer.md` a été réalisée par l’agent UI Designer, en lecture des sources ; elle ne constituait pas une inspection visuelle. Ses cinq axes ont servi au travail : identité, typographie, place des plats, sobriété des encadrés et détails accessibles.

Méthode du skill `gstack-design-review`, adaptée aux outils disponibles. Le navigateur gstack complet et ses détecteurs ne sont pas installés ; les vérifications ci-dessous utilisent Playwright dans un navigateur local isolé. Aucun score automatique ou avis extérieur supplémentaire n’est revendiqué.

## Changements et critères vérifiables

| Axe | Changement livré dans le code | Preuve attendue |
| --- | --- | --- |
| Identité | Même mot-symbole dans les deux layouts ; liens de navigation existants conservés | Captures accueil, recette, guides et livres ; métadonnées des liens livres conservées |
| Typographie | Georgia déjà employée par les livres reprise pour les titres éditoriaux ; interface conservée en police système | Styles calculés et captures, retours à la ligne sur cinq largeurs |
| Photos | Plat de feta existant dans l’accueil avec légende et lien vers la recette ; cartes en ratio 4:3 et pieds alignés | Image locale chargée, liens valides, inspection des recadrages |
| Hiérarchie | Encadrés outil, anti-gaspi, livre et newsletter plus sobres ; vrais H2 pour les sections de recettes de l’accueil | HTML généré, captures et contrôle SEO |
| Usage | Bouton menu 44 px ; menu replié jusqu’à 1100 px ; lien d’évitement fonctionnel ; focus visible ; animations des cartes neutralisées en mouvement réduit | Navigation mobile/tablette, Tab/Entrée vers le contenu, Échap, absence de débordement |

Le fil d’Ariane des guides utilisait `#ffb648` sur `#fffaf5` (contraste calculé 1,68:1). Le lien utilise désormais la couleur de marque sombre : 6,35:1 avec la palette ordinaire, 9,68:1 avec la palette Noël. Ce calcul sur ces couleurs ne constitue pas un audit complet d’accessibilité.

Les deux navigations gardent leurs rubriques propres : c’est le mot-symbole et le comportement qui sont unifiés. Les titres déjà spécifiques des pages livres restent en place. La photographie de feta est un asset existant ; aucune nouvelle séance photo ni expérience culinaire n’est revendiquée.

## Vérification et limites

- Build : 148 pages HTML. Contrôle SEO : 107 schémas Recipe, 145 URL sitemap, liens internes résolus.
- Suite existante : 76 tests réussis, aucun échec. Aucun test préexistant modifié.
- `verify-art-direction.mjs` : cinq familles de pages à 375, 768, 900, 1024 et 1440 px ; captures avant/après et fichier de résultats dans `outputs/design-2026-10-28` à la racine de la tâche. Images différées chargées par défilement avant la capture complète.
- Résultats : 25 parcours de pages réussis pendant la saison, puis 10 hors saison (date du 15 janvier 2027 simulée, 375/1440 px), lien d’évitement et menu inclus. Aucun débordement constaté dans ces parcours. Bouton de menu visible mesuré à 44 px de haut ; les boutons cachés de la version ordinateur ne sont pas comptés. Le bandeau newsletter de l’accueil mesure environ 156 px à 375 px de large.
- Navigation : six parcours. Formulaires et parcours commerciaux : dix contrôles locaux. Thème Noël : seize contrôles, dont dates de retrait et mouvement réduit.
- Requêtes tierces bloquées dans le navigateur de test ; une couverture Amazon distante absente dans une capture locale n’est donc pas une preuve d’image défaillante en production. Aucun email d’essai, clic publicitaire ou achat réalisé.
- Pas de modification de recettes, de collecte, de consentement, de prix ou de schéma Recipe. Pas de police, paquet ou service ajouté. Les gains de trafic et de conversion ne sont pas établis par une revue visuelle.

## Publication

La première publication du thème Noël (`c933a08`) a échoué avant le build : Cloudflare indique une coupure HTTP/2 pendant le clonage GitHub, `early EOF` puis `invalid index-pack output`. Le journal a été lu dans la console Cloudflare. Ce défaut de transfert ne prouve pas une erreur du code. Le lot de direction artistique doit être publié après les contrôles locaux ; seul un statut Cloudflare réussi et un contrôle des pages publiques prouvent sa disponibilité.
