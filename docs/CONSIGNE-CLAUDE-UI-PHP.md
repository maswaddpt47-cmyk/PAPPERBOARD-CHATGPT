# WoocLight — intégrer l’interface dans l’application PHP

## Mission et références

Consigne renforcée par l’utilisateur le 19/10/2026 : le site PHP doit reproduire
fidèlement le rendu de la simulation. La simulation constitue la référence
visuelle à reproduire ; elle ne sert pas seulement d’inspiration. Conserver
les fonctions réelles et les données de l’application PHP.

**Autorisation — instruction utilisateur du 19/10/2026 :** le feu vert explicite
pour intégrer sur PAPPERBOARD et publier après vérification est reçu. Il remplace
le gel précédent. Le chantier est lancé sur `codex/interface-simulation-fidele` ;
actualiser son état dans PAPPERBOARD avant de commencer un travail concurrent.

**État mesuré en lecture le 19/10/2026 :**

- Application de production : `maswaddpt47-cmyk/PAPPERBOARD`, référence lue
  base `98c91a61dac3782536ee2e804b543e5bd3135484` ; intégration en cours sur
  `codex/interface-simulation-fidele`. Les preuves fichier:ligne plus bas désignent
  la lecture historique de `3be45e5fb232918b50face1d125fd68d990a2084`, pas les lignes
  du chantier en cours. Actualiser la branche avant toute intervention.
- Référence d’interface : `maswaddpt47-cmyk/PAPPERBOARD-CHATGPT`, référence
  `7a80fc3a81083f3cb8adf4dfc5e79e686e9fb5bb`.
- [Simulation à consulter](https://maswaddpt47-cmyk.github.io/PAPPERBOARD-CHATGPT/simulation.html?v=7a80fc3).
- [Sources de la simulation à cette référence](https://github.com/maswaddpt47-cmyk/PAPPERBOARD-CHATGPT/tree/7a80fc3a81083f3cb8adf4dfc5e79e686e9fb5bb/docs/simulation).
- Les empreintes des sources et du fichier autonome sont fournies dans
  `docs/simulation/reference-ui.json` au même commit. Vérifier ces empreintes
  avant la transposition. Un paramètre `?v=` sur GitHub Pages force le
  rafraîchissement mais ne fige pas le contenu : pour la référence historique,
  lire les sources au commit indiqué, puis ouvrir son fichier autonome.
- Mesuré le 19/10/2026 : les 769 contrôles Chrome de cette référence passent
  dans GitHub Actions (exécution `39252873063`), ainsi que la suite PHP de la copie
  (`39252873015`). Ils concernent la simulation et ne prouvent pas l’intégration PHP.

Ces constats sont datés ; les sections suivantes sont des exigences à exécuter.
La simulation utilise des données fictives. La production doit garder son API PHP,
ses sessions serveur, ses inscriptions réelles et sa synchronisation entre appareils.

## 1. Audit préalable, avant toute modification

1. Actualiser le dépôt de production. Lire `AGENTS.md`, `CLAUDE.md`, `CHANTIERS.md`,
   `AGORA.md`, `INTEGRATION.md` et `docs/prompt-wooclight.md` lorsqu’ils existent.
   Respecter les décisions utilisateur les plus récentes et les règles du dépôt.
2. Créer ou utiliser la branche de travail prévue. Garder une base de comparaison.
3. Examiner `admin.php`, `index.php`, `screen.php`, `assets/style.css`,
   `assets/admin.js`, `assets/app.js`, `assets/screen.js`, `assets/common.js`,
   `assets/charts.js`, les exports, puis les contrats d’`api.php` et `lib.php`.
4. Examiner dans la copie : `docs/simulation/index.html`, `style.css`,
   `refinements.css`, `jetons.css`, `charte.css`, `app.js`, `preparation-tools.js`,
   `tooltips.js`, `reference-ui.json`, `qa-navigateur.cjs` et la galerie des résultats.
5. Rendre un tableau bref : **fonction / preuve PHP fichier:ligne / référence
   de simulation / écart / action prévue**. Inclure les fonctions déjà présentes,
   même si elles sont absentes du prototype. Ne pas refaire un audit déjà acquis
   sans changement de base ; vérifier ce qui a effectivement changé.

Signaler immédiatement tout accès ou fichier manquant, sa conséquence et la
solution proposée. Écrire « manquant » pour une valeur ou pièce réellement absente.
Continuer les travaux indépendants. Les références de code ci-dessus permettent
de travailler sans attendre d’anciennes captures ou une archive de sandbox.

## 2. Fidélité visuelle obligatoire

Exigence utilisateur du 19/10/2026. Une interface qui reprend uniquement les
couleurs ne satisfait pas la demande. Ne pas recomposer le prototype avec les
anciens gabarits PHP : reprendre sa structure visuelle et ses composants, puis
brancher les données et actions réelles sur cette présentation. Les anciennes
formulations permissives (« adapter la présentation », « reprendre l’esprit »)
ne doivent pas être utilisées pour modifier le rendu cible.

| Zone de référence | Éléments à reproduire |
|---|---|
| Coque | Largeur et comportement de la navigation latérale, marque, fil d’Ariane, marges du contenu, largeur utile sur PC et tiroir mobile. |
| Typographie | Georgia pour les titres, Verdana pour les textes, tailles calculées, graisses, interlignages et césures aux mêmes largeurs. |
| Composants | Cartes, fonds, bordures, ombres, rayons, champs, boutons, icônes, badges et états désactivés, actifs et au focus. |
| Navigation | Vues et regroupements du prototype ; Préparer, Pilotage, Animer, Bilan et Réglages dans l’atelier. Conserver les archives dans une présentation cohérente avec Mes ateliers. |
| Animation | Liste des questions, navigation au-dessus du contenu, zone centrale, cartes de participation et d’échanges, position et dimensions des commandes. |
| Fenêtres | Dimensions, espacements, en-têtes et pieds des formulaires ; QR agrandi, aperçu participant, création et import JSON. |
| Projection | Même hiérarchie, mêmes cartes de réponses, palette calculée, légendes, commandes en haut et ajustement au viewport. |
| Aides | Info-bulles explicatives au survol et au focus, association au contrôle, fermeture par Échap, lisibles dans les dialogues et la projection. |

- Lire les styles dans leur ordre réel : `style.css`, `refinements.css`,
  `jetons.css`, `charte.css`. Copier une seule de ces feuilles ne reproduit
  pas leur cascade. Les valeurs de référence viennent du code et des styles
  calculés dans un navigateur, pas d’une estimation d’après une capture.
- Utiliser la version figée indiquée au début et ses empreintes. Le prototype
  évoluant, ne pas mélanger ses versions. Les anciens arbitrages de palette
  doivent être rapprochés de la demande actuelle ; signaler un conflit précis
  avant de changer les valeurs, sans produire silencieusement une troisième palette.
- Garder les décisions de production sur la sécurité et les données. Remplacer
  les données et mentions de simulation par leur équivalent réel. Afficher la
  vraie date de purge en PHP ; réserver réponses et inscriptions fictives aux
  sessions de démonstration. Les nombres de participants et textes différents
  ne justifient pas de modifier le dessin des composants.
- Adapter les appels PHP/JS et les identifiants nécessaires sans changer le
  rendu demandé. Mettre à jour les tests si un identifiant change. Le fichier
  autonome contient des scripts et styles intégrés : les séparer dans les
  ressources locales du site en respectant sa CSP, sans ajouter `unsafe-inline`.
- Une fonction PHP absente du prototype reste disponible. L’intégrer avec les
  composants de la référence : ne pas la supprimer pour rendre deux captures
  identiques. Garder notamment relecture JSON, purge, démos, modération et exports.

### Comparaison exigée avant de déclarer le rendu conforme

1. Ouvrir la simulation figée et la branche PHP à **la même taille de viewport**
   et dans le même navigateur : 1920×1080, 1280×720, 1024×768 et 390×844.
2. Utiliser des données fictives équivalentes, les mêmes états de vote et de
   publication, la même question et la même longueur de texte. Attendre les
   polices et neutraliser les animations uniquement dans la comparaison.
3. Capturer Mes ateliers, Préparer, Pilotage, Animer, Bilan, Réglages, création
   JSON avec aperçu, aperçu participant, projection et QR agrandi. Comparer
   côte à côte et en superposition, y compris les états masqué et publié.
4. Relever les styles calculés et dimensions : navigation, marges, titres,
   cartes, boutons, colonnes, modales et réponses. Corriger les écarts de
   structure et d’espacement, pas seulement les couleurs. Ne pas masquer un
   décalage derrière un seuil global de différence d’image.
5. Fournir les captures et une liste des écarts restants, chacun expliqué.
   Une CI fonctionnelle verte ne suffit pas à déclarer le rendu identique.
   Toute divergence visuelle volontaire attend une décision de l’utilisateur.

## 3. Parcours à intégrer et fonctions à préserver

| Zone | Résultat attendu |
|---|---|
| Mes ateliers | Créer, ouvrir, renommer, dupliquer, archiver/restaurer et supprimer. Renommer conserve les questions, les réponses et l’identité de l’atelier, et actualise son titre sur les écrans. Utiliser les opérations serveur, leurs confirmations et leurs règles d’archivage anonyme. Une copie repart avec de nouveaux identifiants et sans votes. |
| Démonstrations et entretien | Garder « Créer une session de démonstration », « Supprimer la démo » / suppression groupée et le statut du dernier passage réel de la purge horaire dans Réglages. Utiliser les opérations serveur existantes et préserver les autres ateliers. |
| Bibliothèque et archives | Distinguer les modèles pédagogiques des ateliers actifs et des archives. Préserver les thèmes personnels, séances, historiques et bilans déjà présents. |
| Atelier | Préparer → Pilotage → Animer → Bilan. Changer d’onglet conserve la question, les réponses et l’état réel de la session. |
| Pilotage | QR/code/lien réels, copier/partager, inscriptions ouvertes/fermées, participants, visibilité du QR, accueil, signaux et acquittement, Oser demander et modération, pseudonymes et podium. Ajouter « Terminer la session » avec la confirmation existante, puis « Rouvrir la session » ; réutiliser l’action serveur déjà présente dans Réglages/Animer. |
| Animer | Questions, précédent/suivant en haut, ouverture/fermeture des votes, publication/masquage, réinitialisation confirmée, participation et raccourci vers Pilotage. |
| Bilan et exports | Conserver conclusion, synthèse, CSV, JSON des questions, impression, PowerPoint, mémo et autres exports présents. Respecter leurs filtres de confidentialité et leur cohérence graphique. |
| Participant | Joindre une vraie session, répondre, conserver une saisie en cours lors des mises à jour compatibles, voir la confirmation et suivre la question suivante. Préserver signaux, questions, variantes et réglages existants. |

Les réglages serveur, fonctions en essai, brise-glaces, clôtures, défis à étapes,
liens d’exercice, avant/après, murs, post-its et gommettes restent accessibles selon
leurs règles actuelles. Ne pas utiliser les limites, pseudonymes ou scores fictifs
de la simulation pour remplacer le fonctionnement serveur.

### Création et préparation du JSON

- Proposer un atelier vide ou le parcours Générer/importer un JSON. Préserver
  les questions et l’atelier existants tant que la nouvelle création n’est pas confirmée.
  Auditer les API nécessaires pour éviter une session orpheline lors d’une annulation.
- Placer Générer/importer un JSON dans la création, conformément au choix utilisateur.
  Après création, Préparer garde l’ajout manuel, la modification et l’ordre des
  questions. Préserver les usages techniques de l’import pour les modèles et
  la relecture ; ne pas ajouter de bouton de génération dans Animer.
- Public : garder les catégories et ajouter **Autres**, avec un champ libre
  conditionnel de 160 caractères. Le texte résolu sert à la génération et à la
  relecture. Un public prédéfini remplace la saisie libre dans la consigne.
- Niveau : **Groupe hétérogène** par défaut, **Découverte**, **Débutant**,
  **Intermédiaire**, **Avancé**, indépendamment de l’âge ou du type de public.
- Dimensionnement : nombre manuel de **1 à 30**, ou durée de **15 à 180 minutes**.
  Montrer l’estimation et la recalculer lorsque le niveau, la durée ou le défi change.
- Hypothèses indicatives retenues dans la simulation, **supposées le 19/10/2026,
  non mesurées sur le terrain** : accueil 5 min, conclusion 5 min ; par question,
  Découverte 5 min, Débutant/Avancé/Hétérogène 4 min, Intermédiaire 3 min, échanges
  compris ; défi facultatif 10 min. Calcul :
  `min(30, floor((durée - 10 - temps_du_défi) / temps_par_question))`.
  Signaler un budget insuffisant pour une question ; conserver le nombre manuel
  lorsqu’on revient à ce mode. Copier le budget indicatif dans la consigne.
- Garder les options quiz uniquement, QCM multiples et défi selon les capacités
  réelles. Les réglages de génération ne changent pas le format d’import ni les
  données des participants. Aucun appel automatique à une IA.

### Rélecture après import : exigence explicite

**Présence mesurée dans le PHP au 19/10/2026 :** `admin.php:340` affiche l’aperçu,
`admin.php:346` contient **Copier la consigne de relecture** ;
`assets/admin.js:1013` définit `reviewText`, `assets/admin.js:1041` définit
`reviewPrompt`. Le bouton manque dans la simulation de référence : il doit être
conservé dans la production, et ne doit pas disparaître lors de la reprise de l’UI.

1. Coller la réponse de l’IA ou charger le fichier JSON ; vérifier sa structure
   et ses limites côté serveur avant l’ajout.
2. Afficher l’aperçu : énoncé, choix, bonne(s) réponse(s), explication, avertissements,
   éléments invalides exclus et sélection des questions à conserver.
3. Garder la relecture humaine avant confirmation. Proposer aussi le bouton de
   relecture par **une autre IA ou une nouvelle conversation**. Cette aide reste
   facultative ; l’affichage d’un aperçu ne prouve pas que son contenu est juste.
4. Préserver l’ordre de la consigne existante : **public → fond et bonnes réponses
   → sources précises → forme**. Demander de signaler les incertitudes, de ne pas
   inventer de source et d’ouvrir les liens avant de s’y fier. Inclure les niveaux
   et objectifs de durée renseignés, sans casser les usages de relecture de la bibliothèque.
5. Le `reviewPrompt` de production demande actuellement une analyse et des
   corrections, pas systématiquement un JSON corrigé complet. Rendre clair le retour
   attendu : appliquer les corrections ou demander la version JSON corrigée, puis
   la remettre dans le champ d’import et **vérifier de nouveau**.
6. Toute modification du JSON invalide l’ancien aperçu et empêche d’ajouter une
   sélection devenue obsolète. L’ajout final concerne uniquement les questions
   cochées et la conclusion retenue ; conserver les contrôles et limites serveur.

### Projection et résultats

- Ouvrir la vraie page `screen.php?s=CODE` dans un onglet dédié
  (`target="_blank"`, `rel="noopener"`), avec plein écran et commandes en haut.
- Utiliser un bouton unique **Afficher les graphes et réponses / Masquer les graphes
  et réponses**, sans doublon en bas. Préserver les règles de publication décrites
  dans le dépôt : notamment aucune correction de quiz ni contribution écrite révélée
  avant l’action autorisée. Tester aussi le masquage sans réponse reçue.
- Adapter le contenu à l’espace disponible après question, réponse, publication,
  redimensionnement et plein écran. Repartir des dimensions naturelles à chaque
  calcul. Vérifier la dernière réponse et les légendes ; cacher un dépassement
  avec `overflow: hidden` ne suffit pas. Garder une lecture possible à distance.
- Couvrir les douze formes de la galerie et leurs états vide, vote ouvert, réponses,
  masqué et correction lorsqu’elle existe. Préserver les calculs réels de chaque format.
- QR noir sur blanc, généré localement, contenant le véritable lien participant.
  Au clic : fenêtre agrandie, fermeture par bouton, Échap et extérieur, retour
  du focus. Actualiser/fermer cette fenêtre si la session change ou le QR est masqué.
- Vérifier les échanges entre animateur, projection et plusieurs participants
  indépendants par HTTP ; les événements `localStorage` du prototype ne remplacent
  pas la synchronisation PHP entre appareils.

## 4. Exécution et vérifications, étape par étape

1. **Audit** : tableau des écarts, base Git, décisions connues, tests de départ.
2. **Structure et charte identiques à la référence** : reprendre la coque, la
   hiérarchie et les composants, puis vérifier les dimensions et styles calculés
   à viewport égal. Faire un commit logique et une comparaison visuelle avant
   d’étendre les modifications ; ne pas se limiter à une recoloration.
3. **Parcours** : création/import/relecture, Pilotage, Animer, participant, Bilan.
   Brancher chaque contrôle sur son opération réelle ; garder le fonctionnement
   et les messages d’erreur existants quand la présentation change.
4. **Projection et QR** : intégration et tests de contenu visible, états, masquage,
   redimensionnement, plein écran et fermeture accessible du QR.
5. **Recette PHP** : exécuter `bash tests/run.sh` selon le dépôt et compléter les
   scénarios nécessaires sur l’application PHP, pas seulement sur `simulation.html`.
   Contrôler 1920×1080, 1280×720, 1024×768 et 390×844 ; clavier, focus, contraste,
   débordements et réponses réellement visibles. Exercer deux contextes participant
   indépendants, inscriptions fermées, votes et publications, erreurs et reconnexion.
6. **Publication** : CI verte sur le commit exact, puis déploiement selon le workflow
   du dépôt et les autorisations déjà données. Ne pas demander de nouveau une
   permission déjà accordée. Vérifier le résultat et fournir l’URL exacte testable.

Préserver authentification, CSRF, cookies, anonymat, modération, purge, verrouillage,
limites et coût du polling. Ne pas lire ni commiter `config.php`, copier des données
de production dans les tests, ajouter un CDN ou modifier les secrets. Développer et
tester sans accès administratif Alwaysdata lorsque le dépôt et la CI suffisent.

## 5. Communication et rendu final

- Donner un point utile au moins toutes les 60 secondes. Dès un blocage : cause
  connue ou « cause inconnue », résultat déjà livré, solution et action attendue.
- Publier les étapes déjà prêtes et autorisées sans les immobiliser derrière un
  nouvel ajout indépendant. Distinguer local, commité, CI, prévisualisation et production.
- Livrer un bilan court : changements, fichiers, tests réellement exécutés,
  limites et URL. Joindre la matrice fonctionnelle finale et les mesures navigateur.
  Dire explicitement ce qui manque ou n’a pas pu être testé.

## Prompt court à donner à Claude

> Travaille dans `maswaddpt47-cmyk/PAPPERBOARD`. Actualise le dépôt et lis les règles
> locales, puis cette consigne complète. Le feu vert explicite du 19/10/2026 est
> reçu ; coordonne-toi avec le chantier déjà ouvert dans PAPPERBOARD. Reproduis fidèlement l’interface
> de la simulation au commit figé indiqué, avec sa structure, ses dimensions et
> ses composants ; branche les fonctions PHP réelles et compare les deux rendus
> aux mêmes tailles de viewport. Commence par l’audit des écarts,
> puis poursuis l’intégration autorisée avec un commit par étape vérifiée. Préserve
> toutes les fonctions existantes, en particulier la relecture du JSON par une autre
> IA et la validation avant ajout. N’invente aucune valeur ou pièce manquante.
> Signale immédiatement les blocages et fournis les URL réellement testables.
