# Recherche intégrée — 16 novembre 2026

Demande Youssef : champ central accueil, nouvelle page de résultats, recettes existantes d'abord, alternatives et ingrédients disponibles, loader Père Noël silencieux et logo AG approuvé.

Livrable : `/recherche/?q=saumon`, catalogue JSON de 84 recettes publiées retenues au build du 16 novembre. Les recettes contenant porc/alcool ou certains produits préparés ambigus sont exclues de ce nouveau moteur ; l'ancien catalogue n'est pas réécrit. Le champ du placard compare des mentions, pas les quantités. Seules les herbes disposent de substitutions bornées, explicitement non testées. Les durées et portions sont celles des recettes sources, pas un calcul pour le repas complet.

L'IA ne fabrique aucune recette. Correspondances exactes et demandes générales : recherche locale sans jetons. Autres demandes : extraction d'intention Cloudflare, avec repli local en cas de quota/panne. Sorties bornées, aucune URL ni HTML du modèle. Aucun secret client. Résultats noindex, sans ajout au sitemap ; routes de recettes et anciennes recherches conservées. Aucun événement de mesure ou consentement modifié.

Logo : dérivé du monogramme AG vert forêt/citron approuvé, outil imagegen intégré, prompt « isoler uniquement le monogramme ag supérieur gauche, conserver la forme et le trait citron, retirer texte et fond, transparence ». Original généré exec-342a77d7-550b-4103-b18c-b786caed1e45.png, livré en public/img/brand/ag-monogram.webp (160px) et ag-favicon.png (64px). Les deux layouts utilisent Brand.astro. Loader SVG natif vert/crème/bordeaux, silencieux, animation neutralisée avec prefers-reduced-motion.

Validation : 33 tests Node (recherche + Worker + pilote existant), build 159 pages, contrôle SEO 108 Recipe/155 URLs. Scénarios navigateur à 390 et 1440 : recherche accueil, navigation, ingrédients disponibles, suggestions, repli 429, aucun résultat, retour historique, texte non interprété comme HTML, absence de débordement/erreur JS, reduced motion, accès sans JavaScript au catalogue classique. API modèle réelle vérifiée séparément : trois réponses 200 le 16 novembre ; interprétation imparfaite sur un terme anglais, les correspondances locales restent prioritaires. Pas de prétention de validation culinaire ou de compréhension exhaustive. Contrôles effectués par le coordinateur, sans prétendre à une exécution de spécialiste indépendant.

Preuves détaillées dans outputs/moteur-site-2026-11-16 du workspace central. Worker publié : 718649f2-f599-47f7-9d34-c86e696b365e ; version précédente 192a8be3-2b1e-4bf3-99e5-5cab63fde746. Pour retour arrière : revert ciblé du commit de ce lot et restauration de cette version Worker si nécessaire. Ne pas reset les travaux ultérieurs. Le pilote historique reste disponible.

Prochaine amélioration : évaluer les recherches réelles autorisées, enrichir les adaptations validées et préparer le remplacement du modèle avant la dépréciation annoncée du 20 novembre (source officielle dans workers/meal-assistant/README.md). Aucun changement de tarif ou plan autorisé par cette livraison.

Vérification publique du premier déploiement e58c61f : accueil et résultats sur 390/1440 px, appel IA réel HTTP 200 depuis le domaine, 84 entrées du catalogue et en-tête noindex confirmés. Ajustement final : toutes les correspondances exactes restent accessibles (exemple poulet : 17 recettes, sans coupure à 12).
