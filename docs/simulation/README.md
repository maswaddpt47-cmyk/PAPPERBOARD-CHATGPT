# Simulation de l’espace animateur

19/10/2026 — sources reprises du sandbox v3 ; palette et polices reliées aux
jetons de la charte dans `assets/style.css` par `scripts/packager-simulation.py`.

Ouvrir `simulation.html` à la racine du dépôt, ou sa version GitHub Pages.
Commencer dans **Préparer** : modifier une question, générer une consigne pour
une IA ou importer un JSON. Passer à **Animer**, simuler une réponse, ouvrir
l’aperçu participant et afficher les résultats dans la projection. **Bilan**
permet d’exporter les réponses fictives en CSV et le mémo. La bibliothèque
charge trois ateliers de démonstration ; « Recommencer » réinitialise l’essai.

Tout reste dans ce navigateur. Aucun compte ni serveur PHP n’est utilisé,
aucune session partagée entre appareils n’est créée. Les huit types sondage,
QCM, Oui/Non, Vrai/Faux, échelle, étapes, texte et nuage de mots sont animables
en simulation. Points, mur, post-it et gommettes restent des aperçus de galerie.
Le lien « Voir tous les graphes » ouvre aussi la galerie des rendus réels.

19/10/2026 — mesuré : `node docs/simulation/qa.cjs` passe ses 18 scénarios et
`node docs/simulation/qa-preparation.cjs` ses 14 scénarios. Les scripts intégrés
sont syntaxiquement valides ; le fichier est autonome et les connexions réseau
automatiques sont bloquées. Ces scénarios utilisent un DOM simplifié : ils ne
remplacent pas un contrôle visuel ni un essai multiappareil.

Reconstruction : `python3 scripts/packager-simulation.py`.
