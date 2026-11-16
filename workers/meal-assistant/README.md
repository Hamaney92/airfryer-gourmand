# Assistant Airfryer Gourmand

Source reprise du pilote autorisé du 16 novembre 2026, désormais versionnée avec le site. Le pilote historique `/api/repas` et son menu restent disponibles. La page du site appelle `/api/recherche` : l'IA extrait une intention bornée, puis le navigateur retrouve exclusivement les recettes du catalogue généré au build.

Déployer avec l'accès Wrangler existant : `wrangler deploy --config workers/meal-assistant/wrangler.jsonc --var TRIAL_ENABLED:true`. Sans cet override explicite, le fichier de configuration désactive l'essai par défaut. Aucune clé utilisateur nécessaire ni secret dans le front. Aucun nouveau plan payant activé.

Origines CORS : domaine principal, www, domaine du pilote. Limiteur partagé avec le pilote : 10 appels/minute par localisation Cloudflare, pas un plafond mondial strict. Sortie modèle validée, 220 jetons maximum, aucun nouvel essai automatique. La recherche locale reste disponible si l'IA échoue. Aucun texte libre du modèle ou URL produite par le modèle n'est rendu.

Limites : recherche lexicale + interprétation facultative, sans compréhension universelle. La disponibilité d'ingrédients n'établit ni quantité ni absence d'allergène. Les adaptations intégrées sont limitées à des herbes aromatiques ; aucun nouveau temps de cuisson généré. Le filtre écarte aussi certains produits préparés ambigus. La page de résultats est noindex et n'entre pas dans le sitemap. Le catalogue ne contient que les recettes publiées au build.

Maintenance : la documentation Cloudflare consultée le 16 novembre annonce une dépréciation de llama-3.2-3b-instruct le 20 novembre 2026. Préparer et valider son remplacement avant cette date ; aucun changement de modèle/facturation implicite. Le catalogue local est indépendant du modèle. Sources : https://developers.cloudflare.com/workers-ai/models/llama-3.2-3b-instruct/ et https://developers.cloudflare.com/workers/examples/cors-header-proxy/ .

Tests : `node --test scripts/test-meal-search.mjs workers/meal-assistant/*.test.mjs workers/meal-assistant/test.mjs` ; `npm run build` ; `npm run check:seo` ; `node scripts/verify-meal-search.cjs` (Playwright existant dans le dossier de sortie du pilote, configurable via MEAL_PLAYWRIGHT_PACKAGE). Vérification du véritable modèle dans outputs/moteur-site-2026-11-16/api-live.json, distincte des réponses simulées des tests UI.
