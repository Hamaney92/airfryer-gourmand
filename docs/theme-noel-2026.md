# Ambiance de Noël — 28 octobre 2026

Thème temporaire demandé par Youssef : vert sapin, bordeaux et or, bandeau vers le dossier apéro de Noël et les desserts existants. Les couleurs ordinaires restent la base ; la couche saisonnière est limitée à `christmas.css` et au composant `ChristmasTheme.astro`, utilisé dans les deux layouts.

Activation côté navigateur du 28 octobre 2026 inclus au 6 janvier 2027 exclu, selon la date à Paris. Le retrait ne dépend pas d'une nouvelle publication. Sans JavaScript, le site garde son apparence habituelle. Aucun service, police, image ou paquet ajouté.

Douze petits flocons décoratifs, six sur mobile, ignorés par les technologies d'assistance et sans interception des clics. Bouton « Neige : oui / non », état conservé seulement pour la session. Avec `prefers-reduced-motion: reduce`, ni neige ni bouton ; aucun effet à l'impression. Aucun changement du suivi analytics, des formulaires ou des réglages de consentement.

Les nouvelles pages Noël et le flux RSS présents sur la branche distante ont été conservés. Les styles du bandeau d'en-tête ne ciblent que l'en-tête principal, afin de préserver les en-têtes éditoriaux des articles.

Contrôles : script `verify-christmas-browser.mjs` dans un navigateur local isolé, sans requêtes externes, avec dates simulées, trois largeurs et vérification des deux limites calendaires à minuit Paris. Captures dans `outputs/noel-2026` à la racine de la tâche. Les contrôles locaux ne mesurent aucun effet sur le trafic ou les achats.

Résultats sur la version intégrant les derniers contenus distants : build réussi (148 pages), contrôle SEO réussi (107 schémas Recipe, 145 URL sitemap), vérification structurelle des contenus Noël réussie, 16 contrôles saisonniers réussis à 375/768/1440 px. Inspection des captures accueil mobile et menu Noël ordinateur : bandeau compact, en-tête éditorial vert préservé, aucun débordement relevé. Navigation : six parcours réussis. Formulaires et parcours commerciaux : dix contrôles locaux réussis sur la version intégrée (ordinateur et mobile).
