19/10/2026 — mise à jour mesurée : l’aperçu autonome est publié dans `maswaddpt47-cmyk/PAPPERBOARD-CHATGPT`, avec un déploiement GitHub Pages réussi (`39206406840`). Les mentions de livraison locale ci-dessous décrivent la livraison initiale. GitHub Pages sert les graphes fictifs ; il n’exécute pas l’application PHP.

# Copie d'essai PAPPERBOARD-CHATGPT

19/10/2026 — **mesuré** : copie Git locale issue de `test/nouvelle-charte`, commit
`3a999487c9d65b0cf0dfa7ffedbf332fd976100c`, avec les 73 fichiers et l'arbre Git
vérifiés par empreinte. La récupération s'est faite par le connecteur GitHub,
après échec du transport Git réseau. La copie possède une branche de travail
locale `codex/charte-pc`. Aucun dépôt distant `PAPPERBOARD-CHATGPT` n'a été créé.

## Premier essai, sans serveur

Ouvrir [l'aperçu autonome](../galerie-resultats/apercu-autonome.html) dans un
navigateur récent. Il affiche immédiatement l'anneau avec douze réponses fictives.
Choisir une forme, un état et un mode ; utiliser **Suivant / Précédent**, ou les
flèches du clavier hors des listes de choix.

Les douze formes utilisent les vrais rendus de l'application : anneau, sondage,
QCM simple et multiple, échelle, nuage de mots, texte, étapes, points, mur,
post-it et gommettes. Les commandes de la galerie n'envoient aucun vote.
L'aperçu autonome contient les styles et scripts et interdit les connexions réseau.
Il ne contient pas le serveur PHP, les fonctions d'inscription ou une session réelle.

## Modifications de cette copie

19/10/2026 — **mesuré dans les sources** :

- La branche source applique déjà les huit couleurs de la charte, Georgia/Verdana,
  les trois interfaces, les deux thèmes de projection et le PowerPoint.
- La copie augmente la largeur de l'espace animateur sur PC à partir de 1100 px
  et garde ses onglets accessibles pendant le défilement.
- Deux variantes claires de graphes et les pastilles sont foncées, avec la même
  adaptation dans PowerPoint. Les huit primitifs et les variantes sombres restent
  ceux de la source. La proposition est consignée dans AG-007 pour relecture.
- La galerie démarre avec des réponses, possède une navigation et accepte un
  lien dont les paramètres sont incomplets ou invalides.

## Vérifications et limites

19/10/2026 — **mesuré** : le test de contrastes a d'abord reproduit sept échecs
sur la source, puis vérifié 119 couples sans échec après correction. Les scénarios
de commandes sont des tests de logique, pas une validation visuelle. Les commandes
et résultats exécutés figurent dans `VERIFICATION-CODEX.txt` livré avec la copie.

La suite PHP complète ne peut pas être exécutée ici : PHP n'est pas installé.
Le lancement Chromium est refusé par les restrictions de l'environnement
(`setsockopt: Operation not permitted`). Aucun contrôle visuel aux dimensions
390 / 768 / 1024 / 1280 / 1440 px ni test de lecteur d'écran n'est revendiqué.
Les mesures navigateur annoncées par la branche source restent des résultats
antérieurs de cette branche, pas une nouvelle exécution Codex.

Pour une installation fonctionnelle de l'application PHP, suivre le `README.md`
du dépôt avec une configuration et des données de test. Relancer `bash tests/run.sh`
dans un environnement disposant de PHP et d'un navigateur utilisable avant de
fusionner cette copie. Aucun déploiement ni modification d'Alwaysdata n'a été réalisé.

## Reconstruire l'aperçu

```bash
python3 scripts/packager-charte.py
node tests/contrastes.js
node tests/galerie-commandes.cjs
```
