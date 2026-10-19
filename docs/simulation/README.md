# Simulation de l’espace animateur

19/10/2026 — sources reprises du sandbox v3 ; palette et polices reliées aux
jetons de la charte dans `assets/style.css` par `scripts/packager-simulation.py`.

Ouvrir `simulation.html` à la racine du dépôt, ou sa version GitHub Pages.
Cliquer sur **Créer un atelier** dans le bandeau en haut, donner un nom, puis
utiliser **Générer ou importer un JSON** dans **Préparer**. La fenêtre permet
de copier une consigne pour une IA, coller sa réponse, choisir un fichier JSON
ou charger un exemple ; vérifier l’aperçu puis ajouter la sélection.
L’atelier précédent reste accessible dans **Mes ateliers**, qui permet aussi
de rouvrir les autres essais conservés dans ce navigateur.

On peut également modifier la démonstration déjà chargée. Passer à **Animer**, simuler une réponse, ouvrir
l’aperçu participant et afficher les résultats dans la projection. **Bilan**
permet d’exporter les réponses fictives en CSV et le mémo. La bibliothèque
charge trois ateliers de démonstration ; « Recommencer » ouvre une nouvelle
démonstration en conservant l’atelier précédent.

Tout reste dans ce navigateur. Aucun compte ni serveur PHP n’est utilisé,
aucune session partagée entre appareils n’est créée. Les huit types sondage,
QCM, Oui/Non, Vrai/Faux, échelle, étapes, texte et nuage de mots sont animables
en simulation. Points, mur, post-it et gommettes restent des aperçus de galerie.
Le lien « Voir tous les graphes » ouvre aussi la galerie des rendus réels.

19/10/2026 — mesuré : `node docs/simulation/qa.cjs` passe ses 24 scénarios et
`node docs/simulation/qa-preparation.cjs` ses 16 scénarios. Création vide,
conservation/réouverture des ateliers, échec d’enregistrement et import JSON
dans un atelier vide sont contrôlés. Les scripts intégrés
sont syntaxiquement valides ; le fichier est autonome et les connexions réseau
automatiques sont bloquées. Ces scénarios utilisent un DOM simplifié : ils ne
remplacent pas un contrôle visuel ni un essai multiappareil.

Reconstruction : `python3 scripts/packager-simulation.py`.
