# Affiliation contextuelle et livres — 30 septembre 2026

Statut : publication explicitement autorisée par l'utilisateur le 30 septembre 2026. Lot validé et intégré à la dernière version de main ; contrôle du déploiement après envoi. Les changements de bandeaux déjà présents dans le checkout sont conservés.

## Résultat

Les 107 recettes générées ont chacune une section matériel et une publicité livre. Les châtaignes conservent la sélection spécifique préparée auparavant. Les autres recettes utilisent une ou deux familles de produits, choisies selon le slug avant la catégorie : ramequins pour œufs cocotte, moules individuels pour muffins, plat pour gratins, thermomètre pour volailles, mandoline pour chips, découpe et huile pour légumes. Les accessoires sont facultatifs et leurs limites de compatibilité sont visibles.

Les dossiers, catégories et outils de cuisson proposent une sélection complémentaire. Les guides d'achat conservent leurs offres existantes et gagnent une publicité livre en fin de contenu. Les pages légales, contact et catalogue de livres ne reçoivent pas ces nouveaux blocs.

Chaque publicité livre montre sa couverture, son bénéfice, une entrée vers l'aperçu et une fiche Amazon directe. Anti-Gaspi pour les restes, batch cooking et usages associés ; petites portions pour les autres repas. Ce choix ne prétend pas que toutes les recettes du site figurent dans les livres.

## Nature des liens

Accessoires : recherches Amazon ciblées par usage, avec tag existant airfryergourm-21, et non fiches produits testées. Aucun prix ou disponibilité inventés. Une sélection de modèles précis et une validation marchande restent une amélioration ultérieure. Aucune activation de programme partenaire, candidature ou nouveau contrat.

Livres : ASIN B0HCSM8ZMD (petites portions) et B0HHZM8TYR (Anti-Gaspi), déjà utilisés dans le catalogue existant.

## Mesure

Événements affiliate_click, book_cta_click et book_page_entry_click conservés. Ajout de product_id, product_type et book_id aux clics commerciaux. Placement contextual_products pour les accessoires ; contextual_book_purchase pour l'achat du livre. La mesure du clic n'établit pas une vente ou une commission.

Comparer après déploiement les clics par offre et par URL, puis les ventes et commissions validées dans les rapports partenaires lorsqu'une attribution est disponible. Ne pas promettre de hausse des ventes sur la seule base de ces changements.

## Validation

Compilation : 145 pages, 107 schémas Recipe, 143 URLs sitemap. Contrôles SEO et liens internes valides. 20 tests réussis : contrôle de toutes les recettes pour section matériel et publicité uniques, tag d'affiliation, attributs sponsored, choix sur neuf cas représentatifs, exclusion des pages légales, suivi des clics et parcours existants. Affichage vérifié sur œuf cocotte : deux colonnes sur ordinateur, une colonne sur mobile 390 px, aucune largeur dépassant la fenêtre.

## Fichiers

src/lib/commerce.ts centralise le choix. ContextualProducts.astro affiche les cartes. BookOffer.astro affiche la publicité livre. Le template recettes et les deux layouts les intègrent. test-contextual-commerce.mjs vérifie les pages réellement générées.

Validation après intégration de main : compilation et contrôles SEO réussis, 22 tests réussis. Le suivi newsletter ajouté sur main est conservé. La confirmation du déploiement public doit être vérifiée séparément après le push.
