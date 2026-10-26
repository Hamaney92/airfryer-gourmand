# AdSense : connexion préparée, annonces non activées

## État réel

- Aucun identifiant éditeur AdSense n'a été trouvé dans le dépôt le 26 octobre.
- Aucun statut d'approbation du site ou message CMP publié n'a été vérifié dans un compte AdSense.
- `src/config/adsense.json` conserve un identifiant vide et la vérification désactivée.
- Cette étape ajoute uniquement la possibilité de publier la balise meta de vérification et `/ads.txt` lorsque le véritable identifiant sera confirmé. Aucun script ni emplacement d'annonce n'est chargé.
- Les tests avec identifiant fictif ne constituent pas une connexion, une approbation ou une preuve de revenu.

## Après réception du véritable identifiant public

1. Vérifier que le compte concerne bien Airfryer Gourmand et reprendre exactement son identifiant `ca-pub-…`. Ne jamais créer un second compte pour contourner une difficulté.
2. Renseigner l'identifiant dans le fichier de configuration et activer `verificationEnabled`. Cette activation autorise uniquement la preuve de propriété, pas les annonces.
3. Construire, tester, examiner le diff et publier. Vérifier en production la balise meta sur l'accueil ainsi que `/ads.txt` en HTTP 200 avec la ligne fournie par le compte Google.
4. Contrôler dans AdSense le domaine, la preuve de propriété et l'état d'examen. Une demande d'examen envoyée n'est pas un site approuvé.
5. Avant toute diffusion : configurer et publier une CMP certifiée Google avec les choix appropriés, vérifier refus/acceptation/réouverture, actualiser les informations de confidentialité et tester le comportement des traceurs. Ne pas remplacer la CMP certifiée par une bannière maison.
6. Préparer ensuite un petit nombre d'emplacements manuels clairement signalés et séparés des boutons, des liens affiliés et des étapes culinaires. Commencer sans formats superposés ni interstitiels. Vérifier lisibilité, stabilité de mise en page et mobile avant activation.
7. Mesurer séparément visites, clics affiliés, commandes KDP, commissions et recettes AdSense. Ne pas prédire un RPM ou des revenus à partir de l'ancien trafic.

## Commandes de contrôle

- `npm run check:adsense` expose les prérequis manquants sans prétendre que l'intégration est active.
- `npm run check:adsense -- --require-publisher` échoue tant que la connexion ne peut pas être configurée.
- `npm run build`, `npm run check:seo`, puis `node --test scripts/test-*.mjs`.

## Autorisations et dépendances

L'identité, les conditions contractuelles, les coordonnées fiscales et bancaires restent à valider par le titulaire. Aucun abonnement payant, achat de trafic, clic sur une annonce ou auto-test publicitaire réel n'est autorisé ici. La récupération d'accès ne justifie aucun contournement de CAPTCHA ou d'authentification.

## Sources Google consultées le 26 octobre 2026

- Connexion et méthodes de vérification : https://support.google.com/adsense/answer/7584263?hl=fr
- ads.txt : https://support.google.com/adsense/answer/12171612?hl=fr
- État du site et approbation : https://support.google.com/adsense/answer/12170222?hl=fr
- CMP certifiées : https://support.google.com/adsense/answer/13554116?hl=fr

La lecture de ces documents n'est pas un audit juridique de conformité. La vérification technique et la validation réelle du compte/CMP restent des étapes distinctes.
