# Simulation de l’espace animateur

19/10/2026 — sources reprises du sandbox v3 ; palette et polices reliées aux
jetons de la charte dans `assets/style.css` par `scripts/packager-simulation.py`.

Ouvrir `simulation.html` à la racine du dépôt, ou sa version GitHub Pages.
Cliquer sur **Créer un atelier** dans le bandeau en haut, donner un nom, puis
choisir **Partir d’un atelier vide** ou **Générer ou importer un JSON**.
19/10/2026 — mesuré : la génération propose un menu **Niveau du public**,
distinct du type de public : **Groupe hétérogène** (par défaut), **Découverte**,
**Débutant**, **Intermédiaire**, **Avancé**. Le choix et ses consignes pédagogiques
sont inclus dans le texte copié à l’IA pour adapter vocabulaire, difficulté et
guidage. Aucun champ n’est ajouté au format JSON d’import ou aux participants.
19/10/2026 — mesuré dans le code : **Fixer le nombre de questions** conserve
un nombre manuel de 1 à 30. **Fixer la durée de l’atelier** accepte 15 à 180 minutes
et affiche un nombre estimé, recalculé selon le niveau et le défi facultatif.
La durée, le nombre et le budget indicatif sont copiés dans la consigne.
Hypothèses de préparation, supposées le 19/10/2026 et non mesurées sur le terrain :
5 minutes d’accueil, 5 de conclusion ; 5 minutes par question en Découverte,
4 en Débutant, Avancé ou Groupe hétérogène, 3 en Intermédiaire, échanges compris ;
10 minutes réservées si le défi est coché. Le résultat est plafonné à 30 questions.
Une durée insuffisante pour ces réglages est signalée et empêche de copier une
consigne incohérente. Le retour au mode nombre conserve le choix manuel.
Dans le parcours JSON, copier une consigne pour une IA, coller sa réponse,
choisir un fichier ou charger un exemple, puis vérifier l’aperçu et cliquer
sur **Créer l’atelier**. Aucun nouvel atelier n’est enregistré avant cette
validation ; annuler conserve l’atelier actif.
Après création, **Préparer** propose l’ajout manuel et la modification des
questions ; la génération et l’import JSON restent dans la création.
L’atelier précédent reste accessible dans **Mes ateliers**, qui permet aussi
de rouvrir les autres essais conservés dans ce navigateur.

**Mes ateliers** propose **Dupliquer**, **Supprimer** avec confirmation et
**Archiver** sur chaque atelier. Une copie reprend les questions et la
conclusion avec les votes remis à zéro. Les archives restent dans la section
**Ateliers archivés**, avec leur bilan consultable et un bouton **Restaurer**.
La **Bibliothèque de modèles** contient les trois séances de démonstration,
distinctes des ateliers créés et des archives.

L’atelier s’organise en **Préparer → Pilotage → Animer → Bilan**.
**Pilotage** regroupe le QR code généré localement, le code et le lien de
démonstration, la copie/le partage de l’invitation, les inscriptions simulées
à fermer/rouvrir, le QR à afficher/masquer sur la projection et l’accueil.
**Animer** se concentre sur la question courante, le vote et les résultats,
avec un résumé compact de la session et un accès rapide à Pilotage. Passer
de l’un à l’autre conserve la question et les réponses.
Suivante ouvre le vote d’une question encore à venir ; Réinitialiser efface
ses réponses après confirmation. Dans Pilotage, les trois signaux sont
simulables et effaçables ; « Oser demander » s’ouvre/se ferme et permet de relire,
publier, retirer ou supprimer une question. **Activer les pseudonymes** affiche
la liste complète des inscrits fictifs ; **Simuler une inscription** ajoute un
participant et son pseudonyme. Les noms restent stables au rechargement et la
liste suit les inscriptions depuis un autre onglet du même navigateur.
Le podium présente seulement trois noms, avec des scores explicitement fictifs ;
les scores individuels ne sont pas calculés.

Le QR encode une invitation de simulation. Son parcours d’inscription fonctionne
dans le même navigateur ; un autre appareil affiche la limite de cet essai et
ne peut pas rejoindre une session réelle. Fermer les inscriptions empêche
les nouvelles inscriptions fictives, sans bloquer un participant déjà inscrit.

On peut également modifier la démonstration déjà chargée. Passer à **Animer**, simuler une réponse, ouvrir
l’aperçu participant et afficher les résultats dans la projection. Le lien
**Ouvrir la projection** utilise `target="_blank"` : un onglet dédié, sans
fenêtre intégrée. Les questions, votes et résultats se synchronisent par les
événements de stockage entre les onglets du même navigateur, sur la même
origine. Les commandes restent en haut ; **Plein écran** permet de projeter
sur un écran externe. Ce partage entre onglets ne connecte pas d’appareils
distants. **Afficher les graphes et réponses** devient **Masquer les graphes
et réponses** après publication, dans Animer et Projection. Le masquage retire
aussi les résultats de l’aperçu participant, tout en conservant les réponses
reçues. La commande Masquer fonctionne aussi pour une publication sans réponse.
19/10/2026 — mesuré dans le code : la projection et sa galerie mesurent leur
contenu et l’ajustent à l’espace disponible en largeur et hauteur. Le calcul
repart de la taille naturelle à chaque actualisation, redimensionnement ou
changement de plein écran. Les listes nombreuses utilisent plusieurs colonnes.
Le QR est cliquable dans Pilotage, l’accueil et la barre de projection : une
fenêtre l’agrandit, avec fermeture par bouton ou Échap et retour du focus.
**Bilan**
permet d’exporter les réponses fictives en CSV et le mémo. La bibliothèque
charge trois ateliers de démonstration ; « Recommencer » ouvre une nouvelle
démonstration en conservant l’atelier précédent.

L’aperçu participant suit aussi la question, l’ouverture du vote, l’accueil et
la publication des résultats. Quand la question reste identique, son formulaire
conserve la sélection ou le texte en cours de saisie lors d’une actualisation.
Après l’envoi, laisser cet aperçu ouvert permet de suivre la prochaine question.
Le bouton **Fermer l’aperçu** ferme volontairement cette fenêtre.

Tout reste dans ce navigateur. Aucun compte ni serveur PHP n’est utilisé,
aucune session partagée entre appareils n’est créée. Les huit types sondage,
QCM, Oui/Non, Vrai/Faux, échelle, étapes, texte et nuage de mots sont animables
en simulation. Points, mur, post-it et gommettes restent des aperçus de galerie.
Le lien « Voir tous les graphes » ouvre aussi la galerie des rendus réels.

19/10/2026 — mesuré : `node docs/simulation/qa.cjs` passe ses 45 scénarios et
`node docs/simulation/qa-preparation.cjs` ses 22 scénarios. Création vide,
conservation/réouverture des ateliers, annulation, création à partir de JSON,
échec d’enregistrement avec réessai, duplication, archivage/restauration,
suppression et import dans un atelier vide sont contrôlés.
La liste des inscrits, ses pseudonymes distincts jusqu’à la capacité de 18,
la fermeture des inscriptions et les trois places du podium sont contrôlés.
`node docs/simulation/qa-projection.cjs` passe ses quatorze scénarios de rendu et
de synchronisation logique de deux onglets, sans navigateur. Les scripts intégrés
sont syntaxiquement valides ; le fichier est autonome et les connexions réseau
automatiques sont bloquées. Ces scénarios utilisent un DOM simplifié : ils ne
remplacent pas un contrôle visuel ni un essai multiappareil.

Reconstruction : `python3 scripts/packager-simulation.py`.

19/10/2026 — contrôle navigateur : `node docs/simulation/qa-navigateur.cjs`
est exécuté par `.github/workflows/simulation-ui.yml`, avec Playwright et Chrome.
Il mesure le contenu visible des questions et des douze formes de la galerie
à 1920×1080, 1280×720, 1024×768 et 390×844 ; il contrôle aussi le redimensionnement,
le plein écran, le QR agrandi, les fermetures, le focus et les cinq niveaux copiés
dans la consigne. Le parcours couvre aussi le choix nombre/durée, son estimation,
le défi et les durées invalides. Les journaux de contrôle sont
dans GitHub Actions ; Chromium reste bloqué dans l’environnement local.
