# Signaler une page publiée à IndexNow

Après succès Cloudflare et vérification du changement en production :

```sh
node scripts/submit-indexnow.mjs https://airfryergourmand.fr/guides/accessoires-air-fryer/
node scripts/submit-indexnow.mjs --submit https://airfryergourmand.fr/guides/accessoires-air-fryer/
```

Le premier appel vérifie sans envoyer. Le second vérifie aussi le fichier de propriété public et transmet à IndexNow. Seules les URL explicites du domaine, présentes dans le sitemap public, HTML, sans noindex détecté et avec canonique exacte sont acceptées. Pas de paramètres, ancres, redirections, URL futures ni autres domaines. Limite de 100 URL par appel ; aucun renvoi automatique après erreur. Ce script concerne les ajouts et mises à jour, pas les suppressions.

Consigner le statut HTTP et la liste des URL. 200 signifie reçu ; 202 signifie reçu avec validation de clé en attente. Aucun des deux ne prouve l’indexation ou le classement. Ne pas envoyer toutes les URL inchangées chaque jour.

La clé IndexNow est une preuve hébergée publiquement, pas un jeton donnant accès à un compte. Le sitemap et robots.txt existants sont conservés.

L’envoi reste explicite : aucun nouveau cron ajouté. Crawler Hints Cloudflare et la propriété Bing Webmaster Tools restent à vérifier dans leurs consoles. Si Crawler Hints assure déjà l’envoi, choisir un seul circuit de notification courante. IndexNow est indépendant de la soumission du sitemap dans Bing ; cette soumission reste à terminer.

Sources consultées le 15 novembre 2026 : https://www.indexnow.org/documentation et https://developers.cloudflare.com/cache/advanced-configuration/crawler-hints/.
