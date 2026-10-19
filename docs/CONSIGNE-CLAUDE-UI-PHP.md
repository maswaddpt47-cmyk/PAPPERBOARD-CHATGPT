# WoocLight — intégrer l’interface dans l’application PHP

## Mission et références

Consigne du 19/10/2026. Appliquer la présentation et les parcours retenus dans la
simulation à l’application PHP réelle, en conservant ses fonctions et ses données.
Livrer une intégration testable, puis suivre le processus de déploiement du dépôt.

**État mesuré en lecture le 19/10/2026 :**

- Application de production : `maswaddpt47-cmyk/PAPPERBOARD`, référence lue
  `3be45e5fb232918b50face1d125fd68d990a2084`. Actualiser cette base avant de travailler.
- Référence d’interface : `maswaddpt47-cmyk/PAPPERBOARD-CHATGPT`, référence
  `57add977d200f21e1f9bdfb08370b0b2ad4f0d78`.
- [Simulation à consulter](https://maswaddpt47-cmyk.github.io/PAPPERBOARD-CHATGPT/simulation.html?v=57add97).
- [Sources de la simulation à cette référence](https://github.com/maswaddpt47-cmyk/PAPPERBOARD-CHATGPT/tree/57add977d200f21e1f9bdfb08370b0b2ad4f0d78/docs/simulation).
- La simulation a passé 674 contrôles Chrome sur cette référence : questions,
  douze formes, quatre tailles, QR, niveaux, durée et public personnalisé.
  Ce résultat concerne la simulation ; il ne prouve pas l’intégration PHP.

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
4. Examiner dans la copie : `docs/simulation/index.html`, `charte.css`, `app.js`,
   `preparation-tools.js`, `qa-navigateur.cjs`, ainsi que la galerie des résultats.
5. Rendre un tableau bref : **fonction / preuve PHP fichier:ligne / référence
   de simulation / écart / action prévue**. Inclure les fonctions déjà présentes,
   même si elles sont absentes du prototype. Ne pas refaire un audit déjà acquis
   sans changement de base ; vérifier ce qui a effectivement changé.

Signaler immédiatement tout accès ou fichier manquant, sa conséquence et la
solution proposée. Écrire « manquant » pour une valeur ou pièce réellement absente.
Continuer les travaux indépendants. Les références de code ci-dessus permettent
de travailler sans attendre d’anciennes captures ou une archive de sandbox.

## 2. Référence graphique et limites de transposition

- Garder la charte « Papier & Terre » : interface claire ivoire/terracotta,
  projection sombre pétrole, projection claire, titres Georgia et texte Verdana.
  Utiliser les jetons `--wl-*` et les composants existants ; aucune police distante.
- La source des couleurs est `assets/style.css`, avec ses rôles par thème.
  Vérifier les couleurs effectivement calculées, y compris sur les pistes des graphes,
  les cartes, les états désactivés et les exports. Ne pas mesurer une capture pour
  remplacer une valeur déjà définie dans le code.
- **Point ouvert mesuré le 19/10/2026 :** AG-006 est tranché dans la production ;
  AG-007 reste ouvert dans `PAPPERBOARD-CHATGPT/AGORA.md`. Il propose des variantes
  de contraste en clair, notamment moutarde `#8A6500` contre `#B18400` en production.
  Ne pas présenter ces variantes d’essai comme déjà validées en production.
  Vérifier l’état actuel de ce bloc et appliquer la procédure du dépôt ; poursuivre
  les autres adaptations indépendantes de cet arbitrage.
- Reprendre les espacements, cartes, hiérarchie, navigation et états du prototype
  en les adaptant aux gabarits PHP et aux composants réels. Préserver les identifiants
  utilisés par le JS, l’accessibilité et les tests, ou adapter leurs usages ensemble.
- Conserver la CSP du site et les ressources locales. Le HTML autonome et ses
  scripts intégrés servent de référence visuelle ; leur politique `unsafe-inline`
  ne doit pas être transposée à la production.

## 3. Parcours à intégrer et fonctions à préserver

| Zone | Résultat attendu |
|---|---|
| Mes ateliers | Créer, ouvrir, renommer, dupliquer, archiver/restaurer et supprimer. Renommer conserve les questions, les réponses et l’identité de l’atelier, et actualise son titre sur les écrans. Utiliser les opérations serveur, leurs confirmations et leurs règles d’archivage anonyme. Une copie repart avec de nouveaux identifiants et sans votes. |
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
2. **Structure et charte** : navigation, cartes, boutons, champs, thèmes et focus.
   Faire un commit logique et vérifier les écrans avant d’étendre les modifications.
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
> locales, puis cette consigne complète. Applique-la étape par étape à l’application
> PHP réelle à partir des références indiquées. Commence par l’audit des écarts,
> puis poursuis l’intégration autorisée avec un commit par étape vérifiée. Préserve
> toutes les fonctions existantes, en particulier la relecture du JSON par une autre
> IA et la validation avant ajout. N’invente aucune valeur ou pièce manquante.
> Signale immédiatement les blocages et fournis les URL réellement testables.
