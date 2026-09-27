# Suivi du formulaire newsletter hébergé — 27 septembre 2026

Le formulaire newsletter est désormais hébergé par MailerLite. Les liens portent `data-newsletter-signup`, mais le suivi local n'écoutait que la soumission d'un ancien formulaire intégré. Ajout de `newsletter_signup_click` sur le clic du lien pour mesurer l'ouverture demandée par le visiteur.

Paramètres envoyés : `placement` (`recipe` ou `inline_pdf`), chemin de page sans chaîne de requête, transport beacon. Aucune adresse email, valeur de champ ou URL de destination transmise. L'événement utilise le mécanisme GA4 déjà présent, uniquement sur le domaine de production, et ne modifie aucun réglage de consentement ni événement clé. Il indique une intention d'inscription ; l'ouverture effective de la page externe, le formulaire soumis et l'abonnement confirmé ne sont pas prouvés par ce clic.

Vérifications : 7 tests du suivi passent, dont clic newsletter sans donnée personnelle, absence d'émission en local/sans GA4, absence de doublon et maintien du suivi des aperçus livres. Build réussi : 145 pages HTML, 107 schémas Recipe, 143 URL sitemap ; liens internes et contrôle SEO réussis.

Après déploiement : vérifier la présence du script dans les pages publiques. La réception d'un événement réel et les inscriptions confirmées MailerLite resteront à confronter dans un prochain relevé. Ne pas générer une fausse inscription ou un clic de production pour gonfler le suivi.
