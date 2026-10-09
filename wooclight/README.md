# WoocLight

Participation en direct pour les ateliers de médiation numérique. Interface entièrement française, participants sans compte, animateur avec mot de passe, projection et QR code local.

## Installation FTP en 5 étapes

1. Choisissez un hébergement **Apache avec PHP 8.1 ou supérieur**, sessions PHP et fichiers `.htaccess` autorisés. Décompressez `wooclight.zip` et envoyez le dossier `wooclight/` par FTP dans votre espace web. Activez HTTPS si disponible.
2. Copiez `config.sample.php` vers `config.php` (l’archive contient déjà un exemplaire vierge). Définissez `admin_hash` avec le résultat de `php -r 'echo password_hash(readline("Mot de passe : "), PASSWORD_DEFAULT), PHP_EOL;'`. Cette commande demande le mot de passe dans votre terminal, sans l’inscrire dans l’historique. Avec PHP CLI, le terminal peut afficher la saisie : exécutez-la en privé. Sans terminal, générez le hash avec PHP sur votre ordinateur, jamais sur un site tiers.
3. Définissez `rate_salt` avec le résultat de `php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'`. Gardez ce secret local. Ajustez les autres paramètres : polling (2 000 ms), capacité (150), expiration (30 jours), mots interdits. N’ajoutez pas le mot de passe en clair au fichier.
4. Accordez au processus PHP l’écriture dans `data/` (généralement 700 ou 750 ; selon l’hébergeur 755 et propriétaire adapté). Ne donnez pas systématiquement 777. Vérifiez la présence des fichiers cachés `data/.htaccess` et `.htaccess`. **Avant usage**, créez un fichier `data/probe.txt`, demandez son URL : Apache doit répondre **403**. Supprimez le fichier. Le serveur intégré PHP n’applique pas `.htaccess` et sert uniquement au développement local.
5. Ouvrez `admin.php`, connectez-vous, créez un atelier, ajoutez une question Oui / Non, ouvrez les votes. Scannez le QR code depuis un téléphone, votez et affichez les résultats. Ouvrez `screen.php?s=CODE` depuis le bouton de projection.

Aucun Composer, framework, npm, MySQL ou CDN n’est nécessaire à l’hébergement. PHP 8.1 minimum est requis pour les fonctions natives utilisées ; aucun module optionnel comme mbstring, intl ou SQLite n’est requis. Le dossier `data/` est créé automatiquement si absent, mais **sa protection Apache doit être installée avant toute collecte**. Pour plus de protection, `data_dir` peut pointer vers un dossier inscriptible hors de la racine web.

## Atelier de 20 personnes, pas à pas

1. Avant l’arrivée, créez « Découverte du numérique », puis vos questions : brise-glace Oui / Non, sondage, QCM, nuage de mots et échelle finale. Chaque question peut avoir une durée en secondes (0 signifie illimitée). Les réponses restent anonymes.
2. Ouvrez la projection, choisissez le thème et activez le plein écran. Partagez l’URL, le QR code ou le code de cinq caractères. Les téléphones doivent pouvoir accéder à l’hébergement ; ils n’ont pas besoin de compte.
3. Activez la première question et ouvrez les votes. Le nombre de participants correspond aux appareils ayant voté. Expliquez que les participants peuvent modifier leur réponse tant que cette option est activée et que le vote est ouvert.
4. Fermez les votes puis affichez les résultats. Pour un quiz, indiquez les numéros des bonnes réponses dans l’éditeur : la correction reste cachée jusqu’à l’affichage des résultats. Avec plusieurs réponses possibles, les pourcentages représentent le nombre de participants qui ont choisi chaque option : leur somme peut dépasser 100 %.
5. Passez à la question suivante, puis ouvrez les votes. Pour un classement, demandez de répartir exactement le budget de points. Pour un nuage, plusieurs mots courts sont possibles ; casse et accents français sont regroupés.
6. Masquez les réponses libres inadaptées depuis le tableau animateur. Elles disparaissent du mur et des exports ; elles restent dans le fichier de votes jusqu’à réinitialisation/suppression/expiration. Le filtre de mots configuré s’applique aux nouvelles réponses libres et au nuage.
7. Terminez par une échelle de satisfaction, exportez le CSV (UTF-8 BOM, séparateur point-virgule) et imprimez le bilan. Dupliquez l’atelier pour le réutiliser sans aucune réponse. Supprimez l’atelier si les données ne doivent pas être conservées.

La modification d’une question ayant des votes nécessite sa réinitialisation. Réinitialiser ferme les votes. Ajouter ou modifier une question ferme aussi les votes pour éviter une réponse sur un contenu en cours d’édition. Réordonner conserve la question active.

## Confidentialité et sécurité

Aucun nom, e-mail, service de suivi ou cookie tiers. Un jeton aléatoire de 256 bits est fourni par le serveur, conservé en cookie HttpOnly et dans le stockage local du navigateur pour retrouver la participation. Les votes utilisent son empreinte SHA-256, jamais l’IP. Une empreinte HMAC salée de l’IP sert uniquement à la limite de fréquence ; ses compteurs expirent après une minute et sont supprimés à la requête suivante. Les sessions expirent après 30 jours **d’inactivité**, paramétrable. La purge s’effectue à la prochaine requête API, pas via une tâche planifiée. Les journaux Apache de votre hébergeur peuvent contenir des IP : leur conservation relève de sa configuration.

Ne demandez pas de renseignements personnels dans les réponses libres. Informez les participants des règles de l’atelier et de la durée de conservation. Un identifiant aléatoire reste une donnée pseudonyme, même sans identité déclarée.

Actions animateur protégées par session, CSRF et vérification du mot de passe. Validation serveur, sorties HTML échappées, CSP sans scripts/styles inline ni domaine externe, prévention des formules Excel dans le CSV. JSON remplacé atomiquement sous verrou stable `flock`. Les résultats/corrections sont cachés côté API tant qu’ils ne sont pas publiés. Le réseau lent conserve la saisie affichée et permet de renvoyer manuellement une réponse ; le polling reprend automatiquement. Il n’y a pas de file d’envoi hors connexion ni de sauvegarde de brouillon après fermeture de la page.

Le code de session donne l’accès aux questions et résultats publiés : ne l’utilisez pas pour des informations confidentielles. Un appareil différent ou un stockage navigateur effacé peut obtenir un autre jeton : l’anonymat ne permet pas de garantir « une personne physique = un vote ».

## Développement et tests

Pour une utilisation manuelle : configurez un `config.php` local, puis depuis `wooclight/` lancez `php -S localhost:8000`. Si le répertoire des sessions PHP n’existe pas, créez un dossier temporaire et ajoutez `-d session.save_path=/chemin/inscriptible`. Ne publiez jamais ce serveur intégré sur Internet.

Les tests sont dans `tests/` à la racine du dépôt. Python 3, PHP, Node et Playwright avec Chromium sont des outils de test seulement. Sur une machine de développement, `npm install --no-save playwright` puis `npx playwright install chromium` si nécessaire. Définissez `CHROMIUM_PATH` vers votre Chromium installé (le test utilise `/usr/bin/chromium` par défaut).

```sh
# Depuis la racine du dépôt ; les tests créent une copie jetable hors du projet.
python3 tests/run.py
# Autre exécutable PHP : PHP_BIN=/chemin/php python3 tests/run.py
```

Le lanceur exécute `php -l`, `node --check`, les contrôles des limites et les tests HTTP sur **chacun des neuf types** (3 participants, modification, double vote refusé, fermeture, résultats, export), ETag/304, CSRF, modération, durée, duplication, ordre, réinitialisation, suppression, purge, capacité de 150 participants et refus du 151e. Les tests navigateur contrôlent login, vote mobile, projection, QR, thème, CSV téléchargé pour les neuf types, version imprimable, XSS et absence de ressource tierce. La limite de fréquence est relevée uniquement dans la copie jetable pour tester la capacité ; elle est testée séparément avec des seuils bas.

## Dépannage et limites

- **Mot de passe non configuré** : renseignez `admin_hash` ; un hash commence généralement par `$2y$` ou `$argon2…`. Ne copiez pas le mot de passe en clair.
- **Configuration incomplète / rate_salt** : renseignez le secret aléatoire indiqué à l’étape 3.
- **Erreur interne** : vérifiez les droits du stockage, le chemin `data_dir`, les journaux PHP et PHP ≥ 8.1. Ne modifiez pas un JSON à la main pendant un atelier.
- **Connexion animateur oubliée** : vérifiez les sessions PHP et leur dossier inscriptible, les cookies et l’utilisation cohérente de HTTP/HTTPS.
- **Code inconnu** : code erroné, session supprimée ou expirée. Les caractères ambigus I et O sont exclus des codes générés.
- **Vote fermé** : ouvrez les votes ; une durée écoulée ferme les votes même sans intervention de l’animateur.
- **Connexion perdue** : la reconnexion est automatique toutes les 2 secondes ; gardez la page ouverte puis renvoyez votre réponse si son envoi a échoué.
- **Trop de demandes sur un réseau partagé** : ajustez `rate_ip` (1 000 votes/minute par défaut) ; `rate_token` vaut 40/minute. N’abaissez pas la limite IP sous le nombre de participants d’un atelier. Les tentatives de connexion animateur sont également limitées.
- **Hébergement Nginx / serveur PHP intégré** : `.htaccess` n’est pas interprété. Configurez le refus d’accès à `data/` ou placez-le hors de la racine web avant déploiement.
- Stockage adapté aux petits ateliers : toutes les sessions partagent un verrou, sans garantie de montée en charge. La capacité fonctionnelle de 150 est vérifiée ; un test de charge multiutilisateur sur votre hébergement reste nécessaire.
- Les variantes d’accents français sont regroupées sans intl ; ce n’est pas une normalisation linguistique universelle.
- Le CSV et l’impression nécessitent JavaScript. L’impression a été vérifiée côté DOM ; son rendu dépend de l’imprimante/navigateur.
- Contrastes et zones tactiles sont prévus dans le CSS ; aucune certification d’accessibilité ni campagne de tests avec des utilisateurs n’a été réalisée.

## GitHub et déploiement FTP

Le dépôt contient `wooclight/`, les tests et l’archive. `wooclight/.gitignore` exclut le `config.php` local et les données ; les protections de `data/` restent suivies. Ne commitez ni mot de passe ni résultats d’atelier.

```sh
git add wooclight tests README.md wooclight.zip
git commit -m "Créer WoocLight"
git push -u origin main
```

Pour reconstruire l’archive sans données ni secrets : `python3 scripts/package.py`. L’archive inclut un `config.php` vierge issu de l’exemple. Lors d’une mise à jour FTP, **conservez le config.php et data/ existants** ; ne les écrasez pas avec l’exemplaire vierge. Sauvegardez vos données hors de la racine web.

Déploiement GitHub Actions par FTP : optionnel, non activé. Il nécessitera les secrets GitHub `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD`, le chemin distant et un client FTPS ; privilégiez FTPS avec vérification du certificat. Le workflow devra envoyer le code seulement, exclure `config.php` et les données, inclure les fichiers `.htaccess` et ne jamais effacer les données distantes. Le déploiement manuel FTP reste directement disponible sans ce workflow.

## Bibliothèque embarquée

`assets/qrcode.js` : qrcode-generator de Kazuhiko Arase, sous licence MIT (copie dans `assets/qrcode.LICENSE.txt`). Tout est servi localement ; aucune requête vers l’auteur ou un CDN à l’exécution.
