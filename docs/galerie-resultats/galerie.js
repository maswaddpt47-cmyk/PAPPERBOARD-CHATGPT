/* Galerie des résultats : les 12 formes, les états adaptés à chacune, 4 modes, avec les vraies fonctions de
 * rendu de l'application. Données fictives. Paramètres d'adresse : #type=poll&etat=reponses&mode=screen-dark */
'use strict';
(function () {
  var $ = WL.$;
  var OPTS = ['Réseau A', 'Réseau B', 'Réseau C', 'Réseau D'];
  var FORMS = [
    { id: 'yesno', label: 'Anneau Oui / Non', q: { type: 'yesno', text: 'Faut-il un mot de passe différent pour chaque compte ?', options: ['Oui', 'Non'], correct: [0] },
      res: { total: 12, counts: [8, 4] }, empty: { total: 0, counts: [0, 0] } },
    { id: 'poll', label: 'Barres de sondage', q: { type: 'poll', text: 'Le réseau que vous ouvrez le plus ?', options: OPTS },
      res: { total: 12, counts: [6, 4, 1, 1] }, empty: { total: 0, counts: [0, 0, 0, 0] } },
    { id: 'mcq', label: 'QCM, une réponse', q: { type: 'mcq', multi: false, text: 'Quel mot de passe est le plus solide ?', options: ['azerty123', 'Sa date de naissance', 'Trois mots au hasard', 'Le prénom du chat'], correct: [2] },
      res: { total: 12, counts: [1, 3, 7, 1] }, empty: { total: 0, counts: [0, 0, 0, 0] } },
    { id: 'mcqm', label: 'QCM, réponses multiples', q: { type: 'mcq', multi: true, text: 'Quelles informations éviter de publier ?', options: ['Votre adresse', 'Une photo de vacances', 'Votre code bancaire', 'Un avis sur un film'], correct: [0, 2] },
      res: { total: 12, counts: [9, 3, 11, 2] }, empty: { total: 0, counts: [0, 0, 0, 0] } },
    { id: 'scale', label: 'Échelle', q: { type: 'scale', text: 'Vos mots de passe sont-ils assez sûrs ?', scaleMax: 5, options: [] },
      res: { total: 12, counts: [1, 2, 4, 3, 2], average: 3.3 }, empty: { total: 0, counts: [0, 0, 0, 0, 0], average: null } },
    { id: 'wordcloud', label: 'Nuage de mots', q: { type: 'wordcloud', text: 'Un mot pour « mot de passe » ?', options: [] },
      res: { total: 12, words: [{ text: 'Oubli', n: 5 }, { text: 'Code', n: 3 }, { text: 'Clé', n: 3 }, { text: 'Carnet', n: 2 }, { text: 'Sécurité', n: 2 }, { text: 'Stress', n: 1 }, { text: 'Protection', n: 1 }] },
      empty: { total: 0, words: [] } },
    { id: 'text', label: 'Réponses libres', q: { type: 'text', text: 'Qu\'est-ce qui vous inquiète le plus ?', options: [] },
      res: { total: 4, texts: [{ id: 't1', text: 'Les faux messages de ma banque' }, { id: 't2', text: 'Oublier mon mot de passe' }, { id: 't3', text: 'Un message masqué par l\'animateur', hidden: true }, { id: 't4', text: 'Les arnaques au téléphone' }] },
      empty: { total: 0, texts: [] } },
    { id: 'steps', label: 'Défi à étapes', q: { type: 'steps', text: 'Activez la double authentification', options: ['Ouvrir les réglages', 'Choisir « Sécurité »', 'Activer le code par SMS', 'Tester la connexion'] },
      res: { total: 12, counts: [12, 10, 7, 4], finished: 4 }, empty: { total: 0, counts: [0, 0, 0, 0], finished: 0 } },
    { id: 'points', label: 'Classement à points', q: { type: 'points', text: 'Répartissez 10 points : quoi protéger d\'abord ?', options: ['Mes photos', 'Mon compte bancaire', 'Ma messagerie', 'Mes réseaux sociaux'], budget: 10 },
      res: { total: 12, counts: [18, 52, 31, 19] }, empty: { total: 0, counts: [0, 0, 0, 0] } },
    { id: 'wall', label: 'Mur de contributions', q: { type: 'wall', text: 'Une astuce pour retenir un mot de passe ?', options: [] },
      res: { total: 5, posts: [{ id: 'n1', text: 'Une phrase de chanson', likes: 4 }, { id: 'n2', text: 'Trois mots au hasard', likes: 2 }, { id: 'n3', text: 'Un carnet rangé', likes: 1 }, { id: 'n4', text: 'Les initiales d\'une phrase', likes: 0, hidden: true }] },
      empty: { total: 0, posts: [] } },
    { id: 'postit', label: 'Post-it collectif', q: { type: 'postit', text: 'Que faire en cas de message suspect ?', options: [] },
      res: { total: 5, columns: ['Je le signale', 'Je l\'ignore', 'Je demande conseil'], posts: [{ id: 'p1', text: 'Appeler ma banque', col: 2 }, { id: 'p2', text: 'Ne pas cliquer', col: 1 }, { id: 'p3', text: 'Transférer au 33700', col: 0 }, { id: 'p4', text: 'Supprimer', col: 1, parent: 'p2' }, { id: 'p5', text: 'En parler à un proche', col: 2 }] },
      empty: { total: 0, columns: ['Je le signale', 'Je l\'ignore', 'Je demande conseil'], posts: [] } },
    { id: 'dots', label: 'Gommettes', q: { type: 'dots', text: 'Quelle idée retenez-vous ?', options: [] },
      res: { total: 12, items: [{ id: 'd1', text: 'Un mot de passe par site', n: 7, grouped: [] }, { id: 'd2', text: 'Trois mots au hasard', n: 4, grouped: ['Une phrase longue'] }, { id: 'd3', text: 'Un carnet rangé', n: 1, grouped: [] }] },
      empty: { total: 0, items: [] } }
  ];
  FORMS.forEach(function (f, i) { f.q.id = 'g' + i; });
  var STATES = [['vide', 'Sans réponse'], ['reponses', 'Avec réponses'], ['corrige', 'Avec la bonne réponse'], ['masque', 'Résultats masqués (compteur)']];

  var selType = $('g-type'), selState = $('g-state'), selMode = $('g-mode');
  FORMS.forEach(function (f) { selType.appendChild(WL.el('option', { value: f.id }, f.label)); });
  STATES.forEach(function (s) { selState.appendChild(WL.el('option', { value: s[0] }, s[1])); });
  selState.value = 'reponses';
  var correctionAvailable = true;

  function selectState(form, requested) {
    var canCorrect = Array.isArray(form.q.correct) && form.q.correct.length > 0;
    var allowed = STATES.filter(function (s) { return s[0] !== 'corrige' || canCorrect; });
    if (correctionAvailable !== canCorrect) {
      WL.clear(selState);
      allowed.forEach(function (s) { selState.appendChild(WL.el('option', { value: s[0] }, s[1])); });
      correctionAvailable = canCorrect;
    }
    selState.value = allowed.some(function (s) { return s[0] === requested; }) ? requested : 'reponses';
    return canCorrect;
  }

  function fromHash() {
    var p = {}; location.hash.replace(/^#/, '').split('&').forEach(function (kv) {
      var a = kv.split('=');
      if (!a[0]) return;
      try { p[a[0]] = decodeURIComponent(a[1] || ''); } catch (error) { /* Une adresse mal encodée garde les valeurs par défaut. */ }
    });
    if (p.type) selType.value = p.type; if (p.mode) selMode.value = p.mode;
    return p.etat || selState.value;
  }

  function draw(requestedState) {
    var f = FORMS.filter(function (x) { return x.id === selType.value; })[0];
    if (!f) { f = FORMS[0]; selType.value = f.id; }
    var canCorrect = selectState(f, typeof requestedState === 'string' ? requestedState : selState.value);
    if (['screen-dark', 'screen-light', 'participant', 'admin'].indexOf(selMode.value) === -1) selMode.value = 'screen-dark';
    var position = FORMS.indexOf(f);
    $('g-position').textContent = (position + 1) + ' / ' + FORMS.length;
    $('g-previous').disabled = position === 0;
    $('g-next').disabled = position === FORMS.length - 1;
    var state = selState.value, mode = selMode.value;
    $('g-note').textContent = 'Données fictives · ' + (canCorrect
      ? (state === 'corrige' ? 'La coche ✓ indique la bonne réponse.' : 'Choisissez « Avec la bonne réponse » pour afficher la correction du quiz.')
      : (f.q.type === 'points' ? 'Ce classement exprime les priorités du groupe. Il n’y a pas de bonne réponse.' : 'Ce format ne comporte pas de bonne réponse à révéler.'));
    var body = $('g-body'), out = $('g-out');
    body.className = (mode.indexOf('screen') === 0 ? 'screen' : mode) + ' mode-' + (mode.indexOf('screen') === 0 ? 'screen' : mode);
    document.documentElement.setAttribute('data-theme', mode === 'screen-dark' ? 'dark' : 'light');
    $('g-text').textContent = f.q.text;
    $('g-meta').textContent = 'Question 1 / 1 — ' + WL.typeLabel(f.q);
    var q = JSON.parse(JSON.stringify(f.q));
    if (state !== 'corrige') delete q.correct;
    WL.clear(out);
    out.className = '';
    if (state === 'masque') {
      out.className = mode.indexOf('screen') === 0 ? 's-results' : 'results';
      WL.counter(out, q.id, '7 / 12 ont répondu', 7, 12, false, 'Les résultats s\'affichent quand l\'animateur les publie.');
      return;
    }
    var onScreen = mode.indexOf('screen') === 0;
    out.className = onScreen ? 's-results' : mode === 'admin' ? 'live-results' : 'results';
    var res = JSON.parse(JSON.stringify(state === 'vide' ? f.empty : f.res));
    var opts = onScreen ? { participants: 12 } : (mode === 'admin' ? { onHide: function () {}, onAdmin: function () {} } : {});
    WL.renderResults(out, q, res, opts);
    if (onScreen) { WL.fitResults(out); }
  }
  [selType, selState, selMode].forEach(function (s) { s.addEventListener('change', function () { location.hash = 'type=' + selType.value + '&etat=' + selState.value + '&mode=' + selMode.value; }); });
  function navigate(offset) {
    var index = FORMS.findIndex(function (f) { return f.id === selType.value; });
    var next = Math.max(0, Math.min(FORMS.length - 1, index + offset));
    location.hash = 'type=' + FORMS[next].id + '&etat=' + selState.value + '&mode=' + selMode.value;
  }
  $('g-previous').addEventListener('click', function () { navigate(-1); });
  $('g-next').addEventListener('click', function () { navigate(1); });
  document.addEventListener('keydown', function (event) {
    var editing = event.target && event.target.closest && event.target.closest('input, select, textarea, [contenteditable]');
    if (event.altKey || event.ctrlKey || event.metaKey || editing) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
    }
  });
  window.addEventListener('hashchange', function () { draw(fromHash()); });
  window.addEventListener('resize', draw);
  draw(fromHash());
}());
