# Calendrier des publications

Les créneaux du 16 novembre au 3 décembre 2026 correspondent au lot de 79 sujets. La colonne État distingue les recettes datées dans le dépôt des sujets encore à préparer.

| Date cible | Contenus | État |
|---|---|---|
| 2026-11-16 | 002 · Bol de poulet shawarma et chou-fleur à l’air fryer / 005 · Chou-fleur rôti, pois chiches et sauce tahini / [021 · Pois chiches](../src/content/recipes/pois-chiches-air-fryer.md) · programmée / 054 · Petits gratins de poireaux au comté | 1 programmée, 3 à valider |
| 2026-11-17 | 006 · Patate douce farcie au poulet effiloché et au maïs / 014 · Poivrons farcis au quinoa, épinards et feta / 047 · Pommes de terre écrasées et croustillantes / 066 · Granola maison en petites fournées | À préparer |
| 2026-11-18 | 007 · Aubergine garnie de lentilles, tomate et yaourt / 011 · Keuftas de bœuf au cumin et salade de chou / 038 · Polenta croustillante en bâtonnets / 057 · Mini-muffins salés courgette et chèvre | À préparer |
| 2026-11-19 | 018 · Chou pointu rôti, œuf et sauce moutarde / 042 · Petits pains complets au yaourt / 046 · Bouchées de riz au fromage façon arancini / 061 · Poires rôties à la cardamome | À préparer |
| 2026-11-20 | 043 · Mini-focaccias au romarin / 049 · Galettes de restes de pâtes au fromage / 072 · Cheesecakes individuels au citron / 076 · Petits roulés à la cannelle | À préparer |
| 2026-11-21 | 083 · Retrouver le bon tiroir de remplacement / 085 · Quelle taille de pizza entre dans un air fryer ? / 087 · Fumée pendant la cuisson, les vérifications à faire / 090 · Vérifier si une grille étagée vaut la place qu’elle prend / 100 · Comparer un moule métallique et un moule en silicone pour les muffins | À préparer |
| 2026-11-22 | 003 · Filet de lieu noir et courgettes au citron / 008 · Bol de tempeh au gingembre et de chou rouge rôti / 009 · Galettes de lentilles corail et salade de concombre / 023 · Chou-rave rôti en bâtonnets / 024 · Quartiers de céleri-rave à la moutarde | À qualifier |
| 2026-11-23 | 004 · Brochettes de dinde et poivrons avec semoule / 010 · Filets de maquereau et fenouil au citron / 019 · Poulet au citron, pommes et oignons rouges / 025 · Endives rôties à l’orange et aux noix / 026 · Navets glacés au miel et au thym | À qualifier |
| 2026-11-24 | 013 · Crevettes au paprika fumé et ananas rôti / 015 · Champignons portobello façon burger au chèvre / 017 · Brochettes de boulettes de dinde et tomates cerises / 028 · Topinambours rôtis à l’ail et au persil / 030 · Gombos croustillants au cumin | À qualifier |
| 2026-11-25 | 022 · Edamames en gousses, citron et sésame / 027 · Radis rôtis et sauce aux fanes / 029 · Chou kale croustillant au sésame / 031 · Oignons rouges rôtis à la mélasse de grenade / 032 · Chou rouge rôti et vinaigrette pomme-moutarde | À qualifier |
| 2026-11-26 | 034 · Pak-choï rôti au gingembre / 036 · Racines de persil rôties au cumin / 037 · Galettes de chou-fleur à l’avoine / 039 · Galettes de sarrasin garnies aux épinards et à la ricotta / 040 · Oignons nouveaux rôtis et sauce au miso | À qualifier |
| 2026-11-27 | 041 · Petits pains pita croustillants au zaatar / 044 · Naans au yaourt à garnir / 045 · Mini-calzones tomate et mozzarella / 048 · Croquettes de purée au comté / 050 · Crackers aux graines et aux flocons d’avoine | À qualifier |
| 2026-11-28 | 051 · Palmiers salés à la tapenade / 052 · Feuilletés aux champignons et à la moutarde / 053 · Bouchées de chèvre panées aux noisettes / 055 · Tomates gratinées à la chapelure persillée | À qualifier |
| 2026-11-29 | 056 · Mini-clafoutis salés aux tomates cerises / 058 · Sablés salés au parmesan et au thym / 059 · Poivrons miniatures farcis au fromage frais / 060 · Tortillas croustillantes garnies de haricots blancs | À qualifier |
| 2026-11-30 | 062 · Pêches rôties au romarin / 063 · Prunes rôties et yaourt vanillé / 064 · Ananas rôti à la vanille et au citron vert / 065 · Abricots rôtis à la pistache | À qualifier |
| 2026-12-01 | 067 · Ramequins d’avoine et myrtilles à l’air fryer / 068 · Petits scones aux raisins secs / 069 · Rochers à la noix de coco / 070 · Sablés citron et pavot | À qualifier |
| 2026-12-02 | 071 · Petits moelleux à la carotte / 073 · Tartelettes rustiques aux poires et aux amandes / 074 · Petites crèmes de maïs à la vanille / 075 · Bouchées feuilletées framboise et chocolat blanc | À qualifier |
| 2026-12-03 | 077 · Petits pots de crème au chocolat / 078 · Gâteau de semoule à l’orange en portions / 079 · Tarte fine à la rhubarbe / 080 · Biscuits tahini et sésame | À qualifier |

## Publication et découverte par Google

La date effective d’une recette se règle dans son champ `pubDate`. [GitHub Actions](../.github/workflows/daily-rebuild.yml) déclenche une reconstruction quotidienne. L’heure d’exécution peut varier. Les pages de guide statiques sont mises en ligne avec le déploiement qui les contient.

Le [sitemap public](https://airfryergourmand.fr/sitemap.xml) est généré par [Astro](../src/pages/sitemap.xml.ts) à partir des recettes dont la date est arrivée. La page canonique et son entrée sitemap sont générées dans le même build. `robots.txt` indique l’adresse du sitemap. Après une mise en ligne, vérifier la réponse HTTP, l’URL canonique et l’entrée sitemap. Le suivi de l’indexation se fait ensuite dans Search Console.
