# Application PHP de test

19/10/2026 — mesuré : la copie complète est dans PAPPERBOARD-CHATGPT ; ses tests
PHP et JavaScript sont verts sur le commit `4e38a74`. L'aperçu GitHub Pages est
une page autonome de données fictives. Il ne fournit pas de serveur PHP.

19/10/2026 — mesuré : la création d'une branche de déploiement dans PAPPERBOARD
est refusée au connecteur (`403 Resource not accessible by integration`).

La branche `deploy/test-php` prépare une installation séparée sur Alwaysdata :

- adresse prévue, à confirmer par le job :
  `https://wooclight.alwaysdata.net/test-chatgpt/admin.php` ;
- application dans `~/www/test-chatgpt/` ;
- données dans `~/wooclight-chatgpt-data/` ;
- mot de passe animateur repris par le serveur depuis sa configuration actuelle,
  sans afficher ni transmettre le hash ; secret et données indépendants ;
- refus de remplacer un dossier inconnu ou un lien symbolique ;
- contrôles HTTP de la version, des pages et des fichiers internes.

Le job `acces` contrôle uniquement la présence de trois secrets GitHub :
`ALWAYSDATA_COMPTE`, `ALWAYSDATA_SSH_KEY`, `ALWAYSDATA_KNOWN_HOSTS`.
Il n'en affiche aucune valeur et bloque le déploiement s'ils sont absents.
Les renseigner uniquement dans les paramètres de GitHub, jamais dans une
conversation, un fichier du dépôt ou un commentaire.

Si ces accès ne sont disponibles que dans PAPPERBOARD, autoriser l'intégration
à y créer la branche de déploiement permettra d'utiliser le mécanisme existant.
Cette voie ne nécessite aucune fusion dans le `main` de production.

19/10/2026 — en attente : exécution des tests de l'installateur et des contrôles
d'accès. Ne pas annoncer cette adresse PHP comme opérationnelle avant une
réussite du job `deployer` et de ses contrôles HTTP.
