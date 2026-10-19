# AGORA — WoocLight (PAPPERBOARD)

Créée le 17/10/2026. Une décision qui engage le projet est soumise ici à une
**autre session Claude**, qui lit le code et la contredit ou la complète. Ce
fichier et la section 6 de `CLAUDE.md` suffisent pour répondre : `MD-LIB/agora.md`
n'est **pas requis** (il explique le pourquoi). Les questions de **sécurité,
d'authentification ou de données personnelles** ne vont pas ici mais à Codex
(consigne : `docs/consigne-audit-codex-17-10-2026.md`).

## Règles de réponse (celles qui ne se déduisent pas du gabarit)

1. **Ne jamais répondre à un bloc qu'on a ouvert soi-même.** Avant de répondre :
   `git log -1 --format=%B <sha du bloc>` et comparer son `Claude-Session:` à celui
   de la session courante. Identiques : on ne répond pas. Trailer absent : demander
   à l'utilisateur.
2. **Append-only.** On ajoute son bloc ou sa réponse, on n'édite jamais ceux d'une
   autre session. `git pull --rebase origin main` avant de pousser. **Écart
   assumé par rapport à `agora.md` §7** (17/10/2026) : `main` est protégée ici (tests
   exigés), donc pas de push direct : pousser la branche, attendre la CI verte,
   puis `git push origin <sha>:main` en avance rapide (`CLAUDE.md` §1). Compter
   quelques minutes.
3. **Aucune donnée d'usager** dans un bloc (réponses, noms, journaux réels).

## Sincérité (contre la politesse)

1. « **Amendé** » n'est valable que s'il nomme ce qui serait faux, manquant ou
   coûteux si la proposition était appliquée telle quelle. Sinon : « confirmé ».
2. « **Confirmé** » est une réponse pleine et utile. Ne jamais chercher un
   amendement pour justifier sa présence.
3. **Aucune appréciation** de la proposition ni de son auteur (ni compliment, ni
   « bien vu ») : une réponse commence par un constat. Une réponse sans
   `fichier:ligne`, mesure ou log ne compte pas.

Le total des verdicts (tableau « Blocs tranchés ») est **une alerte, pas un
objectif** : le verdict découle de la contrainte 1, jamais du total.

## Cycle de relais

Dépôt du bloc → l'utilisateur colle la phrase de relais dans l'autre session
(« pull, lis AGORA.md, réponds à AG-00N, tu es la session B ») → la réponse arrive
dans le fichier → **l'utilisateur tranche**. Aucune notification ne passe d'un
compte Claude à l'autre : le relais est humain. L'AGORA ne bloque jamais le travail.
*Supposé, pas mesuré (17/10/2026).*

## Gabarit d'un bloc

```markdown
## AG-00N — Titre court — ouvert le JJ/MM/AAAA
**Auteur** : session A — <8 premiers caractères du Claude-Session> — lu sur `<sha court>`
**Proposition** : en 3 lignes maximum.
**Critère déclencheur** : n° et lequel (CLAUDE.md §6).
**Ce que ça engage** : ce qui serait coûteux à défaire.
**Non vérifié par l'auteur** : ...
**Si personne ne répond, je fais quoi ?** : (« je continue pareil » = pas de bloc)
**Où regarder** : fichier:ligne

### Réponse — JJ/MM/AAAA
**Auteur** : session B — <8 caractères> — lu sur `<sha court>`
**Verdict** : confirmé | amendé | contredit
**Constat** : avec fichier:ligne, mesure ou log.
**Amendement** : ...

### Tranché le JJ/MM/AAAA — décision : ...
```

Un bloc tranché sort du fichier : sa conclusion remonte dans `CHANTIERS.md`
(« Points à ne pas défaire »), le récit reste dans `git log`.

## Blocs ouverts

## AG-007 — Contraste des variantes de graphes — ouvert le 19/10/2026
**Auteur** : session A — Codex / ChatGPT (identifiant `Claude-Session` : manquant) — lu sur `3a99948`, copie locale `codex/charte-pc`.
**Proposition** : conserver les huit primitifs validés ; foncer uniquement les variantes claires de série moutarde (`#8A6500`) et neutre (`#7A6A5C`), réutiliser la moutarde contrastée pour les pastilles, et adapter les mêmes séries du PowerPoint. Les variantes de projection sombre restent celles d'AG-006.
**Critère déclencheur** : 5 — les variantes d'AG-006 sont explicitement gardées dans `CHANTIERS.md`. Cette correction de rendu est réversible, mais son écart à cette note est soumis avant modification.
**Ce que ça engage** : aucune règle de vote ni donnée ; deux variantes et leur déclinaison PowerPoint. La palette de base reste identique.
**Non vérifié par l'auteur** : rendu visuel au navigateur et projection physique, impossibles dans cet environnement. Mesuré le 19/10/2026 : `node tests/contrastes.js` échoue sur 7 couples ; moutarde/trace 2,322:1, neutre/trace 2,824:1, pastille/trace 1,528:1, moutarde/piste PowerPoint 2,498:1. Les 119 couples sont calculés à partir des jetons et du code d'export, pas des commentaires.
**Si personne ne répond, je fais quoi ?** : livrer cette variante dans la copie d'essai demandée par l'utilisateur, sans fusion ni déploiement ; garder l'arbitrage sur la palette de production à l'utilisateur.
**Où regarder** : au ref `3a99948`, `assets/style.css:47` (séries), `assets/style.css:49` (pastilles), `assets/style.css:368` (jauge), `assets/bilan-pptx.js:32` (palette) ; `tests/contrastes.js:48` (couples sur les fonds réellement utilisés).

## Blocs tranchés

| Bloc | Date | Verdict | Décision |
|---|---|---|---|
| AG-001 format `steps` / variantes | 17/10/2026 | amendé | Format gardé tel quel. L'amendement (étape retirée après réponses) était sans objet : `wl_structure_changed` efface déjà les réponses, vérifié par un test le 17/10/2026. |
| AG-002 `prefs.json` | 17/10/2026 | amendé | Fichier gardé ; écriture sous verrou, erreur explicite si elle échoue (`efdfe11`, vérifié le 17/10/2026). |
| AG-003 aide « Bloqué » par étape | 17/10/2026 | amendé | Signal éphémère gardé. Amendement juste, reproduit en navigateur puis corrigé : le défi ne revient plus à l'écran après un changement de question (`40a1e1f`). |
| AG-004 avant / après sur les mêmes personnes | 17/10/2026 | confirmé | Seuil de 3 et texte « mêmes N personnes » gardés. Limites notées : trois personnes passant toutes de 0 % à 100 % laissent voir le changement de chacune. |
| AG-005 thèmes ajoutés (`seances.json`) | 17/10/2026 | amendé | Stockage serveur gardé. Amendement juste, reproduit en e2e puis corrigé : un texte collé depuis l'application mobile d'une IA (`\[ \]`) est accepté, comme à l'import (`2eb4dc7`). |
| AG-006 nouvelle charte graphique | 18/10/2026 | amendé | Évolution de « Papier & Terre », pas un remplacement. Les trois amendements de Codex sont traités : palette cible validée par l'utilisateur le 18/10/2026 (8 valeurs, variantes et contrastes mesurés), PowerPoint adapté (`bilan-pptx.js`), ratios remesurés sur les jetons réels (`tests/charte.php`). Georgia / Verdana, projection sombre bleu pétrole et projection claire gardés ; ne pas défaire sans nouveau bloc. |

Total des verdicts : 1 confirmé, 5 amendé, 0 contredit. Un des quatre amendements (AG-001) s'est
révélé faux à la vérification : un verdict « amendé » n'est pas une preuve qu'il y avait un défaut.
