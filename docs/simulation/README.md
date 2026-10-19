# Simulation de l’espace animateur

19/10/2026 — sources reprises du sandbox v3 ; palette et polices reliées aux
jetons de la charte dans `assets/style.css` par `scripts/packager-simulation.py`.

Ouvrir `simulation.html` à la racine du dépôt, ou sa version GitHub Pages.
Cliquer sur **Créer un atelier** dans le bandeau en haut, donner un nom, puis
choisir **Partir d’un atelier vide** ou **Générer ou importer un JSON**.
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
distants. **Bilan**
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
`node docs/simulation/qa-preparation.cjs` ses 16 scénarios. Création vide,
conservation/réouverture des ateliers, annulation, création à partir de JSON,
échec d’enregistrement avec réessai, duplication, archivage/restauration,
suppression et import dans un atelier vide sont contrôlés.
La liste des inscrits, ses pseudonymes distincts jusqu’à la capacité de 18,
la fermeture des inscriptions et les trois places du podium sont contrôlés.
`node docs/simulation/qa-projection.cjs` passe ses douze scénarios de rendu et
de synchronisation logique de deux onglets, sans navigateur. Les scripts intégrés
sont syntaxiquement valides ; le fichier est autonome et les connexions réseau
automatiques sont bloquées. Ces scénarios utilisent un DOM simplifié : ils ne
remplacent pas un contrôle visuel ni un essai multiappareil.

Reconstruction : `python3 scripts/packager-simulation.py`.
