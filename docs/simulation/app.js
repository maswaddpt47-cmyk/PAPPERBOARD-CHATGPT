(function () {
  'use strict';

  var STORAGE_KEY = 'wl_sandbox_v3';
  var WORKSHOPS_KEY = 'wl_sandbox_workshops_v1';
  var workspace = document.getElementById('workspace');
  if (!workspace) return;
  var activeView = 'workshop';
  var activeTab = 'prep';
  var workshopTabs = [['prep', 'Préparer', 'list'], ['control', 'Pilotage', 'settings'], ['live', 'Animer', 'play'], ['recap', 'Bilan', 'chart']];
  var modalKind = '';
  var dialog = null;
  var dialogReturnFocus = null;
  var toastTimer;
  var galleryIndex = 0;
  var projectionOnly = !!(window.location && new URLSearchParams(window.location.search).get('projection') === '1');
  var projectionGallery = false;
  var joinOnly = !!(window.location && new URLSearchParams(window.location.search).get('join'));
  var joinedHere = false;
  var qrCache = Object.create(null);
  var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var preparationTools = null;
  var creationDraft = null;
  var participantDevices = Object.create(null);
  var supportedTypes = ['poll', 'mcq', 'yesno', 'truefalse', 'scale', 'steps', 'text', 'wordcloud'];
  function isQuiz(q) { return ['mcq', 'yesno', 'truefalse'].indexOf(q.type) !== -1; }
  function isMulti(q) { return q.type === 'mcq' && q.multi === true; }
  function correctIndices(q) {
    if (Array.isArray(q.correct)) return q.correct;
    return Number.isInteger(q.correct) ? [q.correct] : [];
  }
  function isWritten(q) { return q.type === 'text' || q.type === 'wordcloud'; }
  function makeId() { return 'q-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10); }
  var library = [
    { id: 'scams', title: 'Repérer les arnaques en ligne', category: 'Sécurité numérique', duration: '35 min', description: 'Reconnaître les signaux d’alerte et prendre les bons réflexes avant de cliquer.', color: 'amber' },
    { id: 'phone', title: 'Prendre en main son smartphone', category: 'Les essentiels', duration: '30 min', description: 'Paramètres utiles, mises à jour et petits gestes pour un téléphone plus simple.', color: 'blue' },
    { id: 'footprint', title: 'Comprendre ses traces numériques', category: 'Vie privée', duration: '40 min', description: 'Choisir ce que l’on partage et retrouver la maîtrise de ses données.', color: 'green' }
  ];

  function fixture(id) {
    var item = library.find(function (entry) { return entry.id === id; }) || library[0];
    var questions = [
      { id: 'q1', type: 'poll', title: 'Avez-vous déjà reçu un message qui vous semblait suspect ?', description: 'Un premier tour pour partager nos expériences.', options: ['Oui, plusieurs fois', 'Oui, une fois', 'Pas à ma connaissance'], counts: [9, 4, 1], responses: 14, state: 'closed', published: true },
      { id: 'q2', type: 'mcq', title: 'Ce message vous promet un remboursement. Quel indice doit vous alerter ?', description: '« Votre remboursement de 148 € vous attend. Confirmez vos coordonnées avant ce soir. »', options: ['Le montant est précis', 'Le message est court', 'On vous presse de donner vos coordonnées', 'Il est arrivé sur votre téléphone'], counts: [2, 1, 10, 1], responses: 14, correct: 2, explanation: 'L’urgence et la demande de coordonnées sont deux signaux d’alerte. Vérifiez auprès de l’organisme par un canal que vous connaissez.', state: 'open', published: false },
      { id: 'q3', type: 'scale', title: 'Vous sentez-vous capable de repérer un message frauduleux ?', description: 'De 1 « pas encore » à 5 « tout à fait ». Il n’y a pas de mauvaise réponse.', options: ['1', '2', '3', '4', '5'], counts: [0, 0, 0, 0, 0], responses: 0, state: 'draft', published: false },
      { id: 'q4', type: 'mcq', title: 'Un SMS annonce un colis bloqué. Que faites-vous en premier ?', description: 'Le SMS vous demande de payer 1,99 € pour débloquer la livraison.', options: ['Je paie pour recevoir mon colis', 'J’ouvre le site officiel du transporteur moi-même', 'Je réponds avec mon adresse', 'Je transfère le lien à un proche pour qu’il paie'], counts: [0, 0, 0, 0], responses: 0, correct: 1, explanation: 'Ouvrez vous-même le site ou l’application officielle. Un petit montant peut servir à obtenir vos coordonnées bancaires.', state: 'draft', published: false },
      { id: 'q5', type: 'steps', title: 'Les trois réflexes avant de cliquer', description: 'Cochez chaque geste que vous avez essayé pendant l’atelier.', options: ['Je prends le temps de lire le message', 'Je vérifie l’expéditeur et l’adresse', 'Je contacte l’organisme par un autre moyen'], counts: [0, 0, 0], responses: 0, state: 'draft', published: false },
      { id: 'q6', type: 'text', title: 'Quel réflexe allez-vous garder ?', description: 'Une idée, en quelques mots. N’indiquez aucun nom ni donnée personnelle.', options: [], counts: [], texts: [], responses: 0, state: 'draft', published: false },
      { id: 'q7', type: 'yesno', title: 'Notez-vous vos mots de passe sur papier ?', description: 'Une réponse Oui/Non, affichée sous forme d’anneau.', options: ['Oui', 'Non'], counts: [8, 4], responses: 12, explanation: 'Un carnet rangé chez soi est plus sûr qu’un seul mot de passe pour tout.', state: 'closed', published: true },
      { id: 'q8', type: 'mcq', multi: true, title: 'Quels mots de passe sont solides ?', description: 'Plusieurs réponses peuvent être correctes.', options: ['Trois mots au hasard', 'Une phrase de passe', 'Sa date de naissance', 'azerty123'], counts: [7, 10, 1, 4], responses: 12, correct: [0, 1], explanation: 'Une phrase longue et des mots choisis au hasard sont plus résistants qu’une information personnelle ou une suite connue.', state: 'closed', published: true }
    ];
    if (item.id === 'phone') {
      questions[0].title = 'À quelle fréquence utilisez-vous votre smartphone ?';
      questions[0].options = ['Tous les jours', 'Quelques fois par semaine', 'Rarement'];
      questions[1].title = 'Que faire quand une mise à jour du téléphone est proposée ?';
      questions[1].description = 'Votre téléphone vous propose une mise à jour depuis ses réglages.';
      questions[1].options = ['L’ignorer systématiquement', 'Éteindre le téléphone définitivement', 'L’installer depuis les réglages avec une connexion fiable', 'Partager mon code de déverrouillage'];
      questions[1].explanation = 'Les mises à jour corrigent des problèmes et améliorent la sécurité. Utilisez les réglages du téléphone et gardez assez de batterie.';
      questions[2].title = 'Vous sentez-vous à l’aise avec les réglages de votre téléphone ?';
      questions[3].title = 'Où télécharger une nouvelle application ?';
      questions[3].description = 'Vous cherchez une application pour discuter avec vos proches.';
      questions[3].options = ['Dans n’importe quel message reçu', 'Dans la boutique officielle du téléphone', 'Sur une publicité promettant un cadeau', 'En donnant mon mot de passe à un inconnu'];
      questions[3].explanation = 'Privilégiez la boutique officielle et vérifiez l’éditeur, les avis et les autorisations demandées.';
      questions[4].title = 'Trois réglages utiles à explorer';
      questions[4].options = ['J’agrandis la taille du texte', 'Je règle les notifications', 'Je repère les mises à jour'];
    }
    if (item.id === 'footprint') {
      questions[0].title = 'Avez-vous déjà vérifié les réglages de confidentialité d’un compte ?';
      questions[1].title = 'Quelle information vaut-il mieux éviter de publier ?';
      questions[1].description = 'Vous préparez une publication visible par tout le monde.';
      questions[1].options = ['Le titre d’un livre que vous aimez', 'Une photo de paysage', 'Une photo de votre document d’identité', 'Une recette de cuisine'];
      questions[1].explanation = 'Un document d’identité contient des informations sensibles. Même une publication supprimée peut avoir été copiée.';
      questions[2].title = 'Vous sentez-vous capable de choisir qui voit vos publications ?';
      questions[3].title = 'Une application demande votre localisation en permanence. Que vérifier ?';
      questions[3].description = 'L’application sert uniquement à retoucher vos photos.';
      questions[3].options = ['La couleur de son icône', 'Si cette autorisation est utile à son fonctionnement', 'Le nombre de publicités', 'Si mes amis ont accepté'];
      questions[3].explanation = 'N’accordez que les autorisations utiles. Vous pouvez les revoir dans les réglages de votre appareil.';
      questions[4].title = 'Trois gestes pour choisir ce que l’on partage';
      questions[4].options = ['Je vérifie qui voit mon profil', 'Je relis les autorisations des applications', 'Je retire une information inutile de mon profil'];
    }
    var conclusion = item.id === 'phone' ? 'À retenir : je prends le temps d’explorer les réglages de mon téléphone, je fais les mises à jour et je demande de l’aide si besoin.' : item.id === 'footprint' ? 'À retenir : je choisis les informations que je partage, les personnes qui les voient et les autorisations des applications.' : 'À retenir : j’écris moi-même l’adresse du service, je prends le temps de vérifier et je ne donne jamais mes coordonnées dans l’urgence.';
    return { version: 1, workshopId: makeId(), libraryId: item.id, title: item.title, conclusion: conclusion, current: 1, capacity: 18, participants: 14, ended: false, helpCount: 2, anonymousPublished: false, anonymousAnswered: false, questions: questions, updated: new Date().toISOString() };
  }

  function readState() {
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (parsed && parsed.conclusion === undefined) parsed.conclusion = '';
      if (validState(parsed)) return parsed;
    } catch (error) { /* Local storage is optional. */ }
    return fixture('scams');
  }
  function newWorkshopState(title) {
    return { version: 1, workshopId: makeId(), libraryId: 'custom', title: title, conclusion: '', current: 0, capacity: 18, participants: 0, ended: false, helpCount: 0, anonymousPublished: false, anonymousAnswered: false, questions: [], updated: new Date().toISOString() };
  }
  function sessionSettings(value) {
    var target = value || state;
    if (!target.session) target.session = {
      registrationsOpen: true, showQr: true, welcome: false, asksOpen: true,
      showAsks: false, pseudos: false, podium: false,
      signals: { fast: 0, again: 0, help: target.helpCount || 0 },
      asks: target.libraryId === 'custom' ? [] : [{ id: 'ask-demo', text: 'Comment vérifier un lien sans cliquer dessus ?', published: !!target.anonymousPublished }]
    };
    return target.session;
  }
  function validSession(value) {
    if (value === undefined) return true;
    if (!value || !['registrationsOpen', 'showQr', 'welcome', 'asksOpen', 'showAsks', 'pseudos', 'podium'].every(function (key) { return typeof value[key] === 'boolean'; })) return false;
    if (!value.signals || !['fast', 'again', 'help'].every(function (key) { return Number.isInteger(value.signals[key]) && value.signals[key] >= 0 && value.signals[key] <= 18; })) return false;
    return Array.isArray(value.asks) && value.asks.length <= 50 && value.asks.every(function (ask, index) { return ask && typeof ask.id === 'string' && ask.id.length > 0 && ask.id.length <= 100 && value.asks.findIndex(function (entry) { return entry.id === ask.id; }) === index && typeof ask.text === 'string' && ask.text.length > 0 && ask.text.length <= 240 && typeof ask.published === 'boolean'; });
  }
  function validState(value) {
    function integer(number, min, max) { return Number.isInteger(number) && number >= min && number <= max; }
    function text(string, min, max) { return typeof string === 'string' && string.length >= min && string.length <= max; }
    if (value && ((value.archived !== undefined && typeof value.archived !== 'boolean') || (value.placeholder !== undefined && typeof value.placeholder !== 'boolean'))) return false;
    if (value && !validSession(value.session)) return false;
    if (!value || value.version !== 1 || !text(value.title, 1, 120) || !text(value.conclusion === undefined ? '' : value.conclusion, 0, 600) || value.capacity !== 18 || !integer(value.participants, 0, 18) || !integer(value.helpCount, 0, 18) || typeof value.ended !== 'boolean' || typeof value.anonymousPublished !== 'boolean' || !Array.isArray(value.questions) || value.questions.length > 50 || !integer(value.current, 0, Math.max(0, value.questions.length - 1))) return false;
    var ids = new Set();
    return value.questions.every(function (q) {
      if (!q || !text(q.id, 1, 100) || ids.has(q.id) || !text(q.title, 1, 240) || !text(q.description, 0, 400) || supportedTypes.indexOf(q.type) === -1 || (q.multi !== undefined && (q.type !== 'mcq' || typeof q.multi !== 'boolean')) || ['draft', 'open', 'closed'].indexOf(q.state) === -1 || typeof q.published !== 'boolean' || !integer(q.responses, 0, 18) || q.responses > value.participants || !Array.isArray(q.options) || !Array.isArray(q.counts) || q.counts.length !== q.options.length || !q.options.every(function (option) { return text(option, 1, 1500); }) || !q.counts.every(function (count) { return integer(count, 0, q.responses); })) return false;
      ids.add(q.id);
      if (q.variants !== undefined && (!Array.isArray(q.variants) || q.variants.length > 4 || !q.variants.every(function (v) { return v && text(v.name, 1, 20) && Array.isArray(v.steps) && v.steps.length === q.options.length && v.steps.every(function (step) { return text(step, 1, 160); }); }))) return false;
      if (q.link !== undefined && (typeof q.link !== 'string' || q.link.length > 300)) return false;
      if (isWritten(q)) return q.options.length === 0 && Array.isArray(q.texts) && q.texts.length === q.responses && q.texts.every(function (answer) { return text(answer, 1, q.type === 'wordcloud' ? 80 : 240); });
      if (q.options.length < (q.type === 'steps' ? 1 : 2) || q.options.length > 10 || (q.type === 'scale' && ([5, 10].indexOf(q.options.length) === -1 || q.options.some(function (option, i) { return option !== String(i + 1); })))) return false;
      if (q.type === 'yesno' && q.options.join('|') !== 'Oui|Non') return false;
      if (q.type === 'truefalse' && q.options.join('|') !== 'Vrai|Faux') return false;
      if (isQuiz(q)) {
        var correct = correctIndices(q);
        if (q.correct !== undefined && (!correct.length || new Set(correct).size !== correct.length || !correct.every(function (index) { return integer(index, 0, q.options.length - 1); }) || (isMulti(q) ? !Array.isArray(q.correct) : Array.isArray(q.correct)))) return false;
        if (q.explanation !== undefined && !text(q.explanation, 0, 600)) return false;
      }
      var sum = q.counts.reduce(function (total, count) { return total + count; }, 0);
      return q.type === 'steps' || isMulti(q) ? sum >= q.responses && sum <= q.responses * q.options.length : sum === q.responses;
    });
  }
  var state = readState();
  if (typeof state.workshopId !== 'string' || !state.workshopId || state.workshopId.length > 100) state.workshopId = makeId();
  sessionSettings(state);
  var savedWorkshops = readSavedWorkshops();

  function readSavedWorkshops() {
    try {
      var values = JSON.parse(localStorage.getItem(WORKSHOPS_KEY));
      return Array.isArray(values) ? values.filter(function (entry) { return validState(entry) && typeof entry.workshopId === 'string' && entry.workshopId.length > 0 && entry.workshopId.length <= 100; }) : [];
    } catch (error) { return []; }
  }
  function switchWorkshop(next) {
    var previous = state;
    var snapshot = JSON.parse(JSON.stringify(previous));
    var saved = previous.placeholder ? savedWorkshops : [snapshot].concat(savedWorkshops.filter(function (entry) { return entry.workshopId !== snapshot.workshopId; }));
    if (!persistSavedWorkshops(saved)) return false;
    if (!next.workshopId) next.workshopId = makeId();
    state = next;
    if (!save()) { state = previous; return false; }
    participantDevices = Object.create(null);
    return true;
  }
  function persistSavedWorkshops(entries) {
    try { localStorage.setItem(WORKSHOPS_KEY, JSON.stringify(entries)); savedWorkshops = entries; return true; }
    catch (error) { return false; }
  }
  function allWorkshops() {
    return (state.placeholder ? [] : [state]).concat(savedWorkshops.filter(function (entry) { return !entry.placeholder && entry.workshopId !== state.workshopId; }));
  }
  function duplicateWorkshop(source) {
    var copy = JSON.parse(JSON.stringify(source));
    copy.workshopId = makeId(); copy.title = ('Copie de ' + source.title).slice(0, 120);
    copy.libraryId = 'custom'; copy.current = 0; copy.participants = 0;
    copy.ended = false; copy.archived = false; copy.helpCount = 0;
    copy.anonymousPublished = false; copy.anonymousAnswered = false;
    delete copy.session; sessionSettings(copy); copy.session.signals.help = 0;
    copy.questions.forEach(function (q) { q.id = makeId(); q.counts = q.options.map(function () { return 0; }); q.texts = []; q.responses = 0; q.state = 'draft'; q.published = false; });
    return switchWorkshop(copy);
  }
  function setWorkshopArchived(source, archived) {
    var next = JSON.parse(JSON.stringify(source)); next.archived = archived;
    if (source.workshopId === state.workshopId) {
      var previous = state; state = next;
      if (!save()) { state = previous; return false; }
      return true;
    }
    next.updated = new Date().toISOString();
    return persistSavedWorkshops(savedWorkshops.map(function (entry) { return entry.workshopId === next.workshopId ? next : entry; }));
  }
  function deleteWorkshop(source) {
    var remaining = allWorkshops().filter(function (entry) { return entry.workshopId !== source.workshopId; });
    if (!persistSavedWorkshops(remaining)) return false;
    if (source.workshopId !== state.workshopId) return true;
    var previous = state;
    var replacement = remaining.find(function (entry) { return !entry.archived; }) || remaining[0];
    state = replacement ? JSON.parse(JSON.stringify(replacement)) : newWorkshopState('Aucun atelier');
    if (!replacement) state.placeholder = true;
    if (!save()) { state = previous; return false; }
    return true;
  }

  function save() {
    state.updated = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; } catch (error) { return false; }
  }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(name) { return typeof window.icon === 'function' ? window.icon(name) : ''; }
  function button(action, label, iconName, style, attrs) { return '<button type="button" class="btn ' + (style || 'secondary') + '" data-action="' + action + '" ' + (attrs || '') + '>' + (iconName ? ico(iconName) : '') + '<span>' + label + '</span></button>'; }
  function badge(label, color) { return '<span class="badge ' + (color || 'neutral') + '">' + label + '</span>'; }
  function current() { return state.questions[state.current]; }
  function typeLabel(q) { return q.type === 'scale' ? 'Échelle de 1 à ' + q.options.length : { poll: 'Sondage', mcq: isMulti(q) ? 'Quiz · plusieurs réponses' : 'Quiz · un choix', yesno: 'Oui / Non', truefalse: 'Vrai / Faux', steps: 'Défi à étapes', text: 'Réponse libre', wordcloud: 'Nuage de mots' }[q.type]; }
  function stateLabel(q) { return q.state === 'open' ? 'Vote ouvert' : q.state === 'closed' ? 'Vote fermé' : 'À venir'; }
  function isDisabled(test) { return test ? 'disabled' : ''; }
  function heading(kicker, title, subtitle, actions) { return '<div class="page-heading"><div class="heading-copy"><p class="eyebrow">' + kicker + '</p><h1 class="page-title">' + esc(title) + '</h1><p class="page-subtitle">' + subtitle + '</p></div><div class="heading-actions">' + (actions || '') + '</div></div>'; }
  function toast(message) {
    var node = document.getElementById('sandbox-toast');
    if (!node) { node = document.createElement('div'); node.id = 'sandbox-toast'; node.className = 'toast'; node.setAttribute('role', 'status'); document.body.appendChild(node); }
    node.textContent = message;
    node.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.hidden = true; }, 4200);
  }

  function render() {
    if (joinOnly) { renderJoin(); refreshParticipant(); return; }
    if (projectionOnly) {
      document.body.classList.add('projection-mode');
      if (projectionGallery) resultGallery(); else projection();
      return;
    }
    var focusedBeforeRender = captureFocus();
    document.querySelectorAll('[data-nav]').forEach(function (node) {
      var on = node.dataset.nav === activeView;
      node.classList.toggle('active', on);
      if (on) node.setAttribute('aria-current', 'page'); else node.removeAttribute('aria-current');
    });
    var header = document.getElementById('header-session');
    if (header) header.textContent = state.title;
    if (activeView === 'overview') renderOverview();
    else if (activeView === 'library') renderLibrary();
    else if (activeView === 'history') renderHistory();
    else renderWorkshop();
    refreshParticipant();
    if (focusedBeforeRender && focusedBeforeRender.node && !focusedBeforeRender.node.isConnected) restoreFocus(focusedBeforeRender);
  }

  function renderWorkshop() {
    if (state.placeholder) { renderNoWorkshop(); return; }
    if (state.archived) activeTab = 'recap';
    var subtitle = badge(state.libraryId === 'custom' ? 'Atelier personnalisé' : 'Atelier de démonstration', 'neutral') + ' <span class="heading-detail">Essai local · ' + state.questions.length + ' questions</span>';
    workspace.innerHTML = heading('VOTRE ATELIER', state.title, subtitle,
      button('participant', 'Aperçu participant', 'phone', 'secondary', isDisabled(!state.questions.length || state.archived)) + button('result-gallery', 'Galerie des résultats', 'chart', 'secondary') + projectionLink()) +
      (state.archived ? '<div class="archive-notice"><p>Cet atelier est archivé. Son bilan reste consultable ; restaurez-le pour le modifier ou l’animer.</p>' + button('restore-workshop', 'Restaurer l’atelier', 'refresh', 'secondary small', 'data-id="' + esc(state.workshopId) + '"') + '</div>' : '') + '<div class="view-tabs" id="workshop-tabs" role="tablist" aria-label="Étapes de l’atelier">' + workshopTabs.map(function (tab) {
        return '<button type="button" role="tab" id="tab-' + tab[0] + '" class="tab' + (activeTab === tab[0] ? ' active' : '') + '" aria-selected="' + (activeTab === tab[0]) + '" aria-controls="workshop-panel" tabindex="' + (activeTab === tab[0] ? '0' : '-1') + '" data-action="tab" data-tab="' + tab[0] + '" ' + isDisabled(state.archived && tab[0] !== 'recap') + '>' + ico(tab[2]) + tab[1] + '</button>';
      }).join('') + '</div><div id="workshop-panel" role="tabpanel" aria-labelledby="tab-' + activeTab + '">' + (activeTab === 'prep' ? preparation() : activeTab === 'control' ? pilotage() : activeTab === 'recap' ? recap() : live()) + '</div>';
  }

  function rail() {
    return '<aside class="question-rail panel" aria-label="Questions de l’atelier"><div class="panel-head"><h2 class="panel-title">Les questions</h2><span class="muted">' + state.questions.length + '</span></div><ol class="question-list">' + state.questions.map(function (q, index) {
      return '<li><button type="button" class="question-item' + (index === state.current ? ' active' : '') + '" data-action="select-question" data-index="' + index + '" ' + (index === state.current ? 'aria-current="step"' : '') + '><span class="question-number">' + (q.state === 'closed' ? ico('check') : index + 1) + '</span><span class="question-copy"><span class="question-name">' + esc(q.title) + '</span><span class="question-meta">' + esc(typeLabel(q)) + '</span></span><span class="question-state ' + (q.state === 'open' ? 'is-live' : '') + '" title="' + stateLabel(q) + '"></span></button></li>';
    }).join('') + '</ol><div class="rail-footer">' + button('go-prep', 'Gérer les questions', 'edit', 'ghost small') + '</div></aside>';
  }

  function answers(q, publicView) {
    if (publicView && !q.published) return '<div class="empty-state"><span class="empty-icon">' + ico('eye-off') + '</span><h3>Les résultats restent masqués</h3><p>Ils apparaîtront quand l’animateur les publiera.</p></div>';
    if (q.type === 'wordcloud') {
      var words = new Map();
      (q.texts || []).forEach(function (text) { var key = text.toLocaleLowerCase('fr'); var item = words.get(key) || { text: text, n: 0 }; item.n++; words.set(key, item); });
      return words.size ? '<div class="word-cloud">' + Array.from(words.values()).sort(function (a, b) { return b.n - a.n; }).map(function (word) { return '<span class="cloud-word" style="font-size:' + Math.min(32, 17 + word.n * 3) + 'px">' + esc(word.text) + '<small> × ' + word.n + '</small></span>'; }).join('') + '</div>' : '<div class="empty-state"><p>Les mots du groupe apparaîtront ici.</p></div>';
    }
    if (q.type === 'text') {
      return (q.texts || []).length ? '<div class="answer-list">' + q.texts.map(function (text) { return '<div class="answer-row"><span class="answer-text">' + esc(text) + '</span></div>'; }).join('') + '</div>' : '<div class="empty-state"><p>Les réponses écrites apparaîtront ici.</p></div>';
    }
    if (q.type === 'yesno' || q.type === 'truefalse') {
      var total = q.responses || 0;
      var firstPercent = total ? Math.round((Number(q.counts[0]) || 0) / total * 100) : 0;
      var secondPercent = total ? Math.round((Number(q.counts[1]) || 0) / total * 100) : 0;
      var binaryCorrect = correctIndices(q);
      return '<div class="binary-chart" role="img" aria-label="' + esc(q.options[0] + ' ' + firstPercent + ' %, ' + q.options[1] + ' ' + secondPercent + ' %, ' + total + ' réponses') + '"><div class="donut-chart" style="--donut-first:' + firstPercent + '%"><span class="donut-total">' + total + '</span><span class="donut-caption">' + (total > 1 ? 'réponses' : 'réponse') + '</span></div><div class="binary-legend">' + q.options.map(function (option, index) {
        var value = Number(q.counts[index]) || 0;
        var percent = index === 0 ? firstPercent : secondPercent;
        var correct = binaryCorrect.indexOf(index) !== -1;
        return '<div class="legend-row"><span class="chart-swatch ' + (index === 0 ? 'chart-swatch-primary' : 'chart-swatch-secondary') + '"></span><span class="legend-label">' + esc(option) + (correct && (q.published || !publicView) ? ' <span class="legend-correct">· bonne réponse</span>' : '') + '</span><strong>' + percent + ' % <span class="legend-count">' + value + '</span></strong></div>';
      }).join('') + '</div></div><p class="chart-foot">' + total + ' / ' + state.capacity + ' ont répondu</p>';
    }
    return '<div class="answer-list answer-chart' + (isMulti(q) ? ' is-multi' : '') + '">' + q.options.map(function (option, index) {
      var value = Number(q.counts[index]) || 0;
      var percent = q.responses ? Math.round(value / q.responses * 100) : 0;
      var correct = isQuiz(q) && correctIndices(q).indexOf(index) !== -1;
      return '<div class="answer-row' + (correct && (q.published || !publicView) ? ' is-correct' : '') + '"><div class="answer-head"><span class="answer-letter">' + (q.type === 'scale' ? index + 1 : letters[index]) + '</span><span class="answer-text">' + esc(option) + '</span>' + (correct && (q.published || !publicView) ? '<span class="correct-check" title="Bonne réponse">' + ico('check-circle') + '</span>' : '') + '<span class="answer-value">' + value + ' <span class="muted">· ' + percent + ' %</span></span></div><div class="answer-bar"><span class="answer-fill" style="width:' + Math.min(percent, 100) + '%"></span></div></div>';
    }).join('') + '</div><p class="chart-foot">' + q.responses + ' / ' + state.capacity + ' ont répondu' + (isMulti(q) ? ' · chaque choix est rapporté aux participants' : '') + '</p>';
  }

  function live() {
    var q = current();
    if (!q) return liveSessionSummary() + '<section class="panel empty-state"><h2>Aucune question pour le moment</h2><p>Ajoutez votre première question pour lancer l’animation.</p><div class="empty-workshop-actions">' + button('add-question', 'Ajouter une question', 'plus', 'primary') + '</div></section>';
    var complete = q.responses >= state.capacity;
    return liveSessionSummary() + '<div class="workbench">' + rail() + '<section class="panel current-panel" id="current-question"><nav class="toolbar-nav question-navigation" aria-label="Navigation entre les questions">' + button('previous', 'Précédente', 'arrow-left', 'ghost small', isDisabled(sessionSettings().welcome)) + '<span class="muted">' + (sessionSettings().welcome ? 'Accueil' : (state.current + 1) + ' / ' + state.questions.length) + '</span>' + button('next', sessionSettings().welcome ? 'Commencer les questions' : 'Suivante', 'arrow-right', 'secondary small', isDisabled(!sessionSettings().welcome && state.current === state.questions.length - 1)) + '</nav>' + (sessionSettings().welcome ? '<p class="info-note">La projection affiche l’accueil avec le code et l’adresse. « Commencer les questions » lance la première question et ouvre son vote.</p>' : '') + '<div class="question-topline">' + badge('Question ' + (state.current + 1) + ' sur ' + state.questions.length, 'neutral') + badge(state.ended ? 'Atelier terminé' : stateLabel(q), q.state === 'open' && !state.ended ? 'green' : 'neutral') + '<span class="question-type">' + esc(typeLabel(q)) + '</span></div><h2 class="question-title">' + esc(q.title) + '</h2><p class="question-description">' + esc(q.description) + '</p><div class="result-explainer"><span>' + ico('chart') + ' Vue animateur</span><span>' + (q.published ? ico('eye') + ' Résultats visibles par les participants' : ico('eye-off') + ' Résultats masqués aux participants') + '</span></div>' + answers(q, false) +
      '<div class="live-toolbar"><div class="toolbar-main">' + button('toggle-vote', q.state === 'open' ? 'Fermer le vote' : 'Ouvrir le vote', q.state === 'open' ? 'pause' : 'play', 'primary', isDisabled(state.ended)) + button('toggle-results', q.published ? 'Masquer les résultats' : 'Afficher les résultats', q.published ? 'eye-off' : 'eye', 'secondary') + '</div></div><div class="simulation-row"><span>' + ico('sparkles') + ' Essayez l’atelier avec des réponses fictives.</span>' + button('simulate', complete ? 'Toutes les réponses reçues' : 'Simuler une réponse', 'plus', 'ghost small', isDisabled(complete || q.state !== 'open' || state.ended)) + '</div></section>' +
      '<aside class="insights"><section class="panel metric-card"><div class="panel-head"><h2 class="panel-title">Participation</h2>' + ico('users') + '</div><div class="metric-number">' + q.responses + '<span> / ' + state.capacity + '</span></div><p class="metric-caption">' + (q.type === 'steps' ? 'personnes ont participé' : 'personnes ont répondu') + '</p><div class="progress-track" role="progressbar" aria-label="Réponses reçues" aria-valuemin="0" aria-valuemax="' + state.capacity + '" aria-valuenow="' + q.responses + '"><span class="progress-fill" style="width:' + Math.min(q.responses / state.capacity * 100, 100) + '%"></span></div><p class="muted">' + (complete ? 'Tout le monde a répondu.' : (state.capacity - q.responses) + ' réponses encore attendues') + '</p></section>' +
      '<p class="info-note">' + ico('help') + ' Ceci est un atelier d’essai. Tout reste dans ce navigateur.</p></aside></div><div class="session-footer">' + button('reset-question', 'Réinitialiser la question', 'refresh', 'danger small', isDisabled(state.ended)) + button('end-session', state.ended ? 'Rouvrir l’atelier' : 'Terminer l’atelier', state.ended ? 'refresh' : 'check-circle', 'ghost small') + '</div>';
  }
  function pilotage() {
    return '<div class="pilotage-toolbar"><p class="muted">Gérez l’accueil, les inscriptions et les échanges du groupe. Les questions et les votes se pilotent depuis Animer.</p>' + button('go-live', 'Aller aux questions', 'play', 'primary') + '</div>' + liveSessionControls() + '<div class="pilotage-questions">' + asksControls() + '</div>';
  }
  function liveSessionSummary() {
    var s = sessionSettings();
    var signals = s.signals.fast + s.signals.again + s.signals.help;
    var pending = s.asks.filter(function (ask) { return !ask.published; }).length;
    return '<section class="live-session-summary" aria-label="État de la session"><div><span>' + ico('users') + ' ' + state.participants + ' / ' + state.capacity + ' inscrits fictifs</span><span>Inscriptions ' + (s.registrationsOpen ? 'ouvertes' : 'fermées') + '</span><span>' + signals + ' signal' + (signals > 1 ? 's' : '') + '</span><span>Oser demander : ' + (s.asksOpen ? 'ouvert' : 'fermé') + ' · ' + pending + ' à relire</span></div>' + button('go-pilotage', 'Ouvrir Pilotage', 'settings', 'secondary small') + '</section>';
  }
  function openWorkshopTab(tab) {
    activeView = 'workshop'; activeTab = tab; render();
    var target = document.getElementById('tab-' + activeTab);
    if (target) target.focus({ preventScroll: true });
    var tabs = document.getElementById('workshop-tabs');
    if (tabs && typeof tabs.scrollIntoView === 'function') tabs.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function sessionCode() {
    var hash = 2166136261, id = state.workshopId || state.title;
    for (var i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619) >>> 0;
    var alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code = '';
    for (var j = 0; j < 5; j++) { code += alphabet[hash % alphabet.length]; hash = Math.floor(hash / alphabet.length); }
    return code;
  }
  function invitationUrl() {
    var base = window.location ? (window.location.origin || '') + window.location.pathname : '';
    return base + '?join=' + sessionCode() + '&workshop=' + encodeURIComponent(state.workshopId);
  }
  function qrMarkup() {
    var url = invitationUrl();
    if (typeof qrcode !== 'function') return '<p class="muted">Le QR code ne peut pas être affiché. Utilisez le lien ci-dessous.</p>';
    if (!qrCache[url]) { var code = qrcode(0, 'M'); code.addData(url); code.make(); qrCache[url] = code.createDataURL(5, 4); }
    return '<img class="session-qr" src="' + qrCache[url] + '" alt="QR code du parcours participant simulé">';
  }
  function liveSessionControls() {
    var s = sessionSettings();
    return '<div class="session-controls"><section class="panel content-card"><h2>Rejoindre l’atelier</h2><div class="join-overview">' + qrMarkup() + '<div><p>Code de démonstration : <strong class="session-code">' + sessionCode() + '</strong></p><p class="muted">' + state.participants + ' / ' + state.capacity + ' participants fictifs inscrits · Inscriptions ' + (s.registrationsOpen ? 'ouvertes' : 'fermées') + '</p><a class="invitation-url" href="' + esc(invitationUrl()) + '" target="_blank" rel="noopener">' + esc(invitationUrl()) + '</a></div></div><div class="session-actions">' + button('copy-invitation', 'Copier l’invitation', 'copy', 'secondary small') + button('share-invitation', 'Partager', 'external', 'secondary small') + projectionLink() + button('toggle-registrations', s.registrationsOpen ? 'Fermer les inscriptions' : 'Rouvrir les inscriptions', 'users', 'secondary small') + button('simulate-registration', 'Simuler une inscription', 'plus', 'secondary small', isDisabled(!s.registrationsOpen || state.ended || state.participants >= state.capacity)) + button('toggle-qr', s.showQr ? 'Masquer le QR code sur la projection' : 'Afficher le QR code sur la projection', 'screen', 'secondary small') + '</div><p class="generator-note">Invitation de simulation : le parcours est testable dans ce navigateur. Scanner le QR depuis un autre appareil ne le connecte pas à cet atelier.</p></section><section class="panel content-card"><h2>Pilotage en direct</h2><div class="session-actions">' + button('show-welcome', 'Afficher l’accueil', 'screen', 'secondary small') + button('toggle-asks', s.asksOpen ? 'Fermer « Oser demander »' : 'Ouvrir « Oser demander »', 'help', 'secondary small') + '</div><p class="muted">Envoyer un signal fictif pour tester le retour du groupe :</p><div class="session-actions">' + [['fast', 'Trop vite'], ['again', 'À réexpliquer'], ['help', 'Besoin d’aide']].map(function (signal) { return button('send-signal', signal[1] + ' · ' + s.signals[signal[0]], signal[0] === 'help' ? 'hand' : 'help', 'secondary small', 'data-kind="' + signal[0] + '"'); }).join('') + button('acknowledge-help', 'Effacer les signaux', 'check', 'ghost small') + '</div><h3>Pseudonymes et classement</h3><div class="session-actions">' + button('toggle-pseudos', s.pseudos ? 'Désactiver les pseudonymes' : 'Activer les pseudonymes', 'users', 'secondary small') + button('toggle-podium', s.podium ? 'Masquer le podium' : 'Projeter le podium', 'chart', 'secondary small', isDisabled(!s.pseudos)) + '</div>' + (s.pseudos ? podiumContent() : '<p class="muted">Activez les pseudonymes pour prévisualiser le classement.</p>') + '</section></div>';
  }
  function podiumContent() {
    var names = ['Panda curieux', 'Loutre attentive', 'Héron paisible'];
    return '<div class="podium-demo"><p class="generator-note">Exemple de classement fictif pour tester l’affichage ; les scores individuels ne sont pas calculés dans cette simulation.</p>' + (state.participants ? '<ol>' + names.slice(0, Math.min(3, state.participants)).map(function (name, i) { return '<li>' + name + ' — ' + (3 - i) + ' point' + (i < 2 ? 's' : '') + '</li>'; }).join('') + '</ol>' : '<p>Aucun participant inscrit.</p>') + '</div>';
  }
  function asksControls() {
    var s = sessionSettings();
    return '<section class="panel content-card"><h2>Oser demander</h2><p class="muted">Questions anonymes : relisez-les avant de les publier.</p><div class="session-actions">' + button('toggle-asks', s.asksOpen ? 'Fermer les questions' : 'Ouvrir les questions', 'help', 'secondary small') + button('simulate-ask', 'Simuler une question', 'plus', 'secondary small', isDisabled(!s.asksOpen || s.asks.length >= 50)) + button('project-asks', s.showAsks ? 'Revenir à la question' : 'Projeter les questions publiées', 'screen', 'secondary small') + '</div>' + (s.asks.length ? s.asks.map(function (ask) { var attrs = 'data-id="' + esc(ask.id) + '"'; return '<article class="anonymous-ask"><p>' + esc(ask.text) + '</p><div class="session-actions">' + button('publish-question', ask.published ? 'Retirer de la projection' : 'Publier', 'eye', 'secondary small', attrs) + button('delete-ask', 'Supprimer', 'trash', 'danger small', attrs) + '</div></article>'; }).join('') : '<p class="muted">Aucune question reçue.</p>') + '</section>';
  }
  function addAnonymousQuestion(text) {
    var s = sessionSettings(); text = String(text || '').trim();
    if (!s.asksOpen || !text || text.length > 240 || s.asks.length >= 50) return false;
    s.asks.push({ id: makeId(), text: text, published: false }); save(); return true;
  }
  function registerParticipant() {
    if (!sessionSettings().registrationsOpen || state.ended || state.archived || state.participants >= state.capacity) return false;
    state.participants++; save(); return true;
  }
  function renderJoin() {
    document.body.classList.add('participant-mode');
    var expected = window.location && new URLSearchParams(window.location.search).get('workshop');
    if (expected !== state.workshopId || state.placeholder) { workspace.innerHTML = '<section class="panel content-card join-page"><h1>Invitation de simulation</h1><p>Cette invitation correspond à un essai conservé dans le navigateur de l’animateur. Cet appareil ne peut pas s’y connecter sans serveur de session.</p></section>'; return; }
    var s = sessionSettings();
    workspace.innerHTML = '<section class="panel content-card join-page"><p class="eyebrow">PARTICIPANT FICTIF · SIMULATION LOCALE</p><h1>' + esc(state.title) + '</h1><p>Code : ' + sessionCode() + ' · ' + (s.registrationsOpen ? 'Inscriptions ouvertes' : 'Inscriptions fermées') + '</p>' + (joinedHere ? '<p>Votre inscription fictive est enregistrée dans cet essai.</p>' + button('participant', 'Répondre à la question', 'play', 'primary', isDisabled(!current() || s.welcome)) : button('join-session', 'S’inscrire en participant fictif', 'users', 'primary', isDisabled(!s.registrationsOpen || state.ended || state.archived || state.participants >= state.capacity))) + '<p class="generator-note">Les essais restent dans ce navigateur ; aucun appareil distant n’est connecté.</p></section>';
  }
  async function shareInvitation(share) {
    var text = 'Invitation de simulation — ' + state.title + '\nCode : ' + sessionCode() + '\n' + invitationUrl() + '\nEssai local, sans connexion de participants depuis un autre appareil.';
    try {
      if (share && window.navigator && window.navigator.share) { await window.navigator.share({ title: state.title, text: text }); return; }
      if (window.navigator && window.navigator.clipboard && window.navigator.clipboard.writeText) { await window.navigator.clipboard.writeText(text); toast('L’invitation a été copiée.'); return; }
    } catch (error) { if (error.name === 'AbortError') return; }
    showDialog('Copier l’invitation', '<p>Copiez ce texte pour tester le parcours d’invitation.</p><textarea class="textarea" id="invitation-copy" rows="7" readonly>' + esc(text) + '</textarea>', button('close-dialog', 'Fermer', '', 'secondary'), 'invitation');
    var field = document.getElementById('invitation-copy'); field.focus(); if (typeof field.select === 'function') field.select();
  }

  function quickQuestion(kind, key) {
    var q = { id: makeId(), type: 'poll', title: '', description: '', options: [], counts: [], responses: 0, texts: [], state: 'draft', published: false };
    if (kind === 'ice') {
      if (key === 'meteo') { q.title = 'Quelle est votre météo du jour ?'; q.options = ['Grand soleil', 'Quelques nuages', 'Petite pluie', 'Orage']; q.description = 'Choisissez la météo qui décrit le mieux votre état d’esprit.'; }
      else if (key === 'energie') { q.type = 'scale'; q.title = 'Quel est votre niveau d’énergie aujourd’hui ?'; q.description = 'De 1 « petite batterie » à 5 « en pleine forme ».'; q.options = ['1', '2', '3', '4', '5']; }
      else if (key === 'mot') { q.type = 'wordcloud'; q.title = 'Un mot pour vous décrire aujourd’hui ?'; q.description = 'Un seul mot, sans nom ni donnée personnelle.'; }
      else return null;
    } else if (kind === 'closing') {
      q.type = 'text'; q.description = 'Quelques mots, sans nom ni donnée personnelle.';
      if (key === 'reflexe') q.title = 'Quel réflexe allez-vous garder après cet atelier ?';
      else if (key === 'question') q.title = 'Quelle question vous reste-t-il ?';
      else if (key === 'mot') { q.type = 'wordcloud'; q.title = 'En un mot, comment repartez-vous ?'; }
      else if (key === 'pas') q.title = 'Quel petit pas allez-vous essayer ensuite ?';
      else return null;
    } else if (kind === 'challenge') {
      q.type = 'steps';
      if (key === 'notifs') {
        q.title = 'Couper les notifications inutiles'; q.description = 'Choisissez votre appareil dans l’aperçu participant, puis essayez chaque geste.';
        q.options = ['Ouvrir les réglages des notifications', 'Choisir une application', 'Désactiver les notifications inutiles'];
        q.variants = [
          { name: 'Windows', steps: ['Ouvrez Démarrer, Paramètres, Système, puis Notifications.', 'Repérez une application dans la liste des expéditeurs.', 'Désactivez ses notifications si vous n’en avez pas besoin.'] },
          { name: 'Mac', steps: ['Ouvrez Réglages Système, puis Notifications.', 'Sélectionnez une application dans la liste.', 'Désactivez Autoriser les notifications si elles sont inutiles.'] },
          { name: 'iPhone', steps: ['Ouvrez Réglages, puis Notifications.', 'Choisissez une application dans la liste.', 'Désactivez Autoriser les notifications si elles sont inutiles.'] },
          { name: 'Android', steps: ['Ouvrez Paramètres, puis Notifications. Le nom varie selon le téléphone.', 'Ouvrez Notifications des applications et choisissez une application.', 'Désactivez les notifications dont vous n’avez pas besoin.'] }
        ];
      } else if (key === 'temps') {
        q.title = 'Regarder son temps d’écran'; q.description = 'Les intitulés peuvent varier selon votre version du téléphone.';
        q.options = ['Ouvrir le bilan du temps d’écran', 'Repérer l’application la plus utilisée', 'Choisir un petit changement à essayer'];
        q.variants = [
          { name: 'iPhone', steps: ['Ouvrez Réglages, puis Temps d’écran et l’activité des apps.', 'Regardez les durées des applications. Gardez ces informations pour vous.', 'Choisissez un petit changement réaliste pour cette semaine.'] },
          { name: 'Android', steps: ['Ouvrez Paramètres, puis Bien-être numérique ou l’option équivalente.', 'Regardez les durées des applications. Gardez ces informations pour vous.', 'Choisissez un petit changement réaliste pour cette semaine.'] }
        ];
      } else return null;
    } else return null;
    q.counts = q.options.map(function () { return 0; });
    return q;
  }
  function quickInsertCard(kind, title, description, choices, label, symbol) {
    return '<section class="quick-card"><div class="quick-card-title">' + ico(symbol) + '<h3>' + title + '</h3></div><p>' + description + '</p><label class="sr-only" for="quick-' + kind + '">' + title + '</label><select class="input" id="quick-' + kind + '"><option value="">Choisir…</option>' + choices.map(function (choice) { return '<option value="' + choice[0] + '">' + choice[1] + '</option>'; }).join('') + '</select>' + button('quick-insert', label, 'plus', 'secondary', 'data-kind="' + kind + '" ' + isDisabled(state.questions.length >= 50)) + '</section>';
  }
  function conclusionCard() {
    return '<section class="panel conclusion-card"><div class="section-heading"><div><p class="eyebrow">LE MESSAGE À EMPORTER</p><h2>Conclusion de l’atelier</h2><p class="muted">Affichée sur la projection et dans l’aperçu participant quand vous terminez l’atelier. Également reprise dans le mémo.</p></div>' + ico('book') + '</div><label class="field-label" for="conclusion-text">À retenir</label><textarea class="textarea" id="conclusion-text" rows="4" maxlength="600" placeholder="Les idées à retenir, en quelques phrases…">' + esc(state.conclusion || '') + '</textarea><div class="conclusion-actions">' + button('save-conclusion', 'Enregistrer la conclusion', 'check', 'primary') + '<span class="muted" id="conclusion-status" role="status">600 caractères maximum</span></div></section>';
  }
  function preparation() {
    return '<section class="panel preparation-panel"><div class="section-heading"><div><h2 class="panel-title">Le déroulé de votre atelier</h2><p class="muted">Préparez vos questions ici. Le vote se lance depuis Animer.</p></div><div class="preparation-actions">' + button('add-question', state.questions.length >= 50 ? '50 questions maximum' : 'Ajouter une question', 'plus', 'primary', isDisabled(state.questions.length >= 50)) + '</div></div>' + (!state.questions.length ? '<div class="empty-state"><h3>Votre atelier est vide</h3><p>Cliquez sur « Ajouter une question » pour commencer à préparer votre atelier.</p></div>' : '') + '<ol class="prep-list">' + state.questions.map(function (q, index) {
      return '<li class="prep-item"><span class="number-bubble">' + (index + 1) + '</span><div class="grow"><h3>' + esc(q.title) + '</h3><p class="muted">' + esc(typeLabel(q)) + ' · ' + q.responses + ' réponse' + (q.responses > 1 ? 's' : '') + '</p></div><div class="prep-actions">' + button('move-up', '<span class="sr-only">Monter la question ' + (index + 1) + '</span>', 'arrow-up', 'ghost icon-btn', 'data-index="' + index + '" aria-label="Monter la question ' + (index + 1) + '" ' + isDisabled(index === 0)) + button('move-down', '<span class="sr-only">Descendre la question ' + (index + 1) + '</span>', 'arrow-down', 'ghost icon-btn', 'data-index="' + index + '" aria-label="Descendre la question ' + (index + 1) + '" ' + isDisabled(index === state.questions.length - 1)) + button('edit-question', 'Modifier', 'edit', 'secondary small', 'data-index="' + index + '"') + button('delete-question', '<span class="sr-only">Supprimer la question ' + (index + 1) + '</span>', 'trash', 'ghost icon-btn', 'data-index="' + index + '" aria-label="Supprimer la question ' + (index + 1) + '" ' + isDisabled(state.questions.length === 1)) + '</div></li>';
    }).join('') + '</ol><div class="info-note">' + ico('book') + ' Les changements sont enregistrés uniquement dans cet essai local.</div></section><div class="section-heading"><div><h2>Des séquences prêtes à ajouter</h2><p class="muted">Un accueil, un geste pratique, une dernière parole : composez le rythme de votre atelier.</p></div></div><div class="quick-grid">' +
      quickInsertCard('ice', 'Brise-glace', 'Pour accueillir le groupe. La question est ajoutée en premier.', [['meteo', 'Votre météo du jour'], ['energie', 'Votre énergie de 1 à 5'], ['mot', 'Un mot pour vous décrire']], 'Ajouter en premier', 'sparkles') +
      quickInsertCard('closing', 'Clôture', 'Pour faire le point ensemble. La question est ajoutée à la fin.', [['reflexe', 'Le réflexe que vous gardez'], ['question', 'La question qui reste'], ['mot', 'Votre mot de la fin'], ['pas', 'Le prochain petit pas']], 'Ajouter à la fin', 'check-circle') +
      quickInsertCard('challenge', 'Défi à étapes', 'Un exercice pratique avec des consignes adaptées à l’appareil.', [['notifs', 'Couper les notifications inutiles'], ['temps', 'Regarder son temps d’écran']], 'Ajouter à la fin', 'hand') + '</div>' + conclusionCard();
  }

  function recap() {
    var total = state.questions.reduce(function (sum, q) { return sum + q.responses; }, 0);
    return '<div class="section-heading"><div><h2 class="panel-title">Ce que l’atelier nous apprend</h2><p class="muted">Les réponses de cette démonstration sont entièrement fictives.</p></div><div class="row">' + button('export-csv', 'Exporter les résultats', 'download', 'secondary') + button('export-memo', 'Télécharger le mémo', 'book', 'primary') + '</div></div><div class="card-grid recap-metrics"><div class="panel metric-card"><div class="metric-number">' + state.capacity + '</div><p class="metric-caption">participants dans cet essai</p></div><div class="panel metric-card"><div class="metric-number">' + state.questions.length + '</div><p class="metric-caption">questions préparées</p></div><div class="panel metric-card"><div class="metric-number">' + total + '</div><p class="metric-caption">réponses au total</p></div></div><div class="recap-grid">' + state.questions.map(function (q, index) {
      return '<section class="panel result-group"><div class="question-topline">' + badge('Question ' + (index + 1), 'neutral') + '<span class="muted">' + q.responses + ' réponses</span></div><h3>' + esc(q.title) + '</h3>' + (q.responses ? answers(q, false) : '<p class="muted">Cette question n’a pas encore reçu de réponse.</p>') + (q.explanation ? '<p class="info-note">' + esc(q.explanation) + '</p>' : '') + '</section>';
    }).join('') + '</div>' + (state.conclusion ? '<section class="panel saved-conclusion"><p class="eyebrow">À RETENIR</p><h2>Conclusion de l’atelier</h2><p class="conclusion-copy">' + esc(state.conclusion) + '</p></section>' : '');
  }

  function renderOverview() {
    if (state.placeholder) { renderNoWorkshop(); return; }
    var done = state.questions.filter(function (q) { return q.responses > 0; }).length;
    workspace.innerHTML = heading('VOTRE ESPACE', 'Un atelier, des échanges.', 'Préparez simplement. Gardez le contact avec votre groupe.', button('create-workshop', 'Créer un atelier', 'plus', 'primary') + button('open-workshop', 'Reprendre l’atelier', 'arrow-right', 'secondary')) +
      '<div class="card-grid"><section class="panel content-card session-summary"><div class="question-topline">' + badge(state.ended ? 'Terminé' : 'En cours', state.ended ? 'neutral' : 'green') + badge('Démonstration', 'neutral') + '</div><h2>' + esc(state.title) + '</h2><p class="muted">Un espace pour expérimenter, sans lancer de vraie session.</p><div class="library-meta"><span>' + ico('users') + ' 18 participants fictifs</span><span>' + ico('list') + ' ' + state.questions.length + ' questions</span></div>' + button('open-workshop', 'Revenir à l’animation', 'play', 'primary') + '</section><section class="panel content-card"><p class="eyebrow">VOTRE PROGRESSION</p><div class="metric-number">' + done + '<span> / ' + state.questions.length + '</span></div><h2>questions explorées</h2><p class="muted">Simulez des votes, regardez l’écran participant et retrouvez les résultats dans le bilan.</p>' + button('help', 'Comment essayer ?', 'help', 'ghost') + '</section></div><div class="section-heading"><div><h2 class="panel-title">Une idée pour le prochain atelier ?</h2><p class="muted">Trois séances d’essai, prêtes à personnaliser.</p></div>' + button('open-library', 'Explorer la bibliothèque', 'arrow-right', 'ghost') + '</div><div class="card-grid">' + library.slice(1).map(libraryCard).join('') + '</div>';
  }
  function libraryCard(item) {
    return '<article class="panel content-card"><div class="question-topline">' + badge(esc(item.category), item.color) + '</div><h2>' + esc(item.title) + '</h2><p class="muted">' + esc(item.description) + '</p><div class="library-meta"><span>' + ico('clock') + ' ' + item.duration + '</span><span>' + ico('list') + ' 6 questions</span></div>' + button('load-library', 'Essayer cette séance', 'plus', 'secondary', 'data-id="' + item.id + '"') + '</article>';
  }
  function renderLibrary() {
    workspace.innerHTML = heading('POUR VOUS INSPIRER', 'Bibliothèque de modèles', 'Des modèles de démonstration pour démarrer un nouvel atelier. Vos créations et leurs archives restent dans Mes ateliers.', '') + '<div class="card-grid library-grid">' + library.map(libraryCard).join('') + '</div><p class="info-note">' + ico('sparkles') + ' Toutes les séances sont des démonstrations. Relisez et adaptez les contenus avant un véritable atelier.</p>';
  }
  function renderHistory() {
    var entries = allWorkshops();
    var active = entries.filter(function (entry) { return !entry.archived; });
    var archived = entries.filter(function (entry) { return entry.archived; });
    workspace.innerHTML = heading('VOS ESSAIS', 'Mes ateliers', 'Vos créations, leurs résultats et leurs archives dans ce navigateur.', button('create-workshop', 'Créer un atelier', 'plus', 'primary')) + workshopGroup('Ateliers en cours', active) + workshopGroup('Ateliers archivés', archived) + '<p class="info-note">Archiver conserve les questions et les résultats. La bibliothèque de modèles propose des séances de démonstration pour créer un nouvel atelier.</p>';
  }
  function workshopGroup(title, entries) {
    return '<section class="panel workshop-group"><div class="panel-head"><h2 class="panel-title">' + title + '</h2><span class="muted">' + entries.length + '</span></div><div class="history-list">' + (entries.length ? entries.map(workshopRow).join('') : '<p class="workshop-empty muted">Aucun atelier dans cette section.</p>') + '</div></section>';
  }
  function workshopRow(entry) {
    var active = entry.workshopId === state.workshopId;
    var attrs = 'data-id="' + esc(entry.workshopId) + '"';
    var open = active ? button('go-prep', entry.archived ? 'Voir le bilan' : 'Préparer', entry.archived ? 'chart' : 'edit', 'secondary small') : button('open-saved-workshop', entry.archived ? 'Voir le bilan' : 'Ouvrir', 'arrow-right', 'secondary small', attrs);
    return '<div class="prep-item workshop-row"><span class="number-bubble">' + ico('book') + '</span><div class="grow"><h3>' + esc(entry.title) + '</h3><p class="muted">' + entry.questions.length + ' question' + (entry.questions.length > 1 ? 's' : '') + ' · ' + (entry.archived ? 'Archivé' : active ? 'Atelier actuel' : entry.ended ? 'Terminé' : 'En préparation') + '</p></div><div class="workshop-row-actions">' + open + button('duplicate-workshop', 'Dupliquer', 'copy', 'secondary small', attrs) + button(entry.archived ? 'restore-workshop' : 'archive-workshop', entry.archived ? 'Restaurer' : 'Archiver', entry.archived ? 'refresh' : 'book', 'secondary small', attrs) + button('delete-workshop', 'Supprimer', 'trash', 'danger small', attrs) + '</div></div>';
  }
  function renderNoWorkshop() {
    workspace.innerHTML = heading('VOTRE ESPACE', 'Aucun atelier pour le moment', 'Créez un atelier vide, générez ou importez un JSON, ou partez d’un modèle.', button('create-workshop', 'Créer un atelier', 'plus', 'primary')) + '<section class="panel empty-state"><h2>À vous de préparer le prochain atelier</h2><p>Vos futurs ateliers et leurs archives apparaîtront dans « Mes ateliers ».</p>' + button('open-library', 'Voir les modèles', 'book', 'secondary') + '</section>';
  }

  function createWorkshop() {
    creationDraft = null;
    showDialog('Créer un atelier', '<form id="workshop-form"><p>Donnez un nom à votre atelier et choisissez comment le préparer.</p><div class="form-field"><label class="field-label" for="workshop-title">Nom de l’atelier</label><input class="input" id="workshop-title" name="title" maxlength="120" required placeholder="Ex. Bien protéger ses comptes"></div><fieldset class="workshop-methods"><legend class="field-label">Comment commencer ?</legend><label class="workshop-method"><input type="radio" name="source" value="empty" checked><span><strong>Partir d’un atelier vide</strong><small>Ajouter vos questions une à une.</small></span></label><label class="workshop-method"><input type="radio" name="source" value="json"><span><strong>Générer ou importer un JSON</strong><small>Préparer une consigne pour l’IA, coller sa réponse ou importer un fichier.</small></span></label></fieldset><p class="generator-note">Votre atelier actuel sera conservé dans « Mes ateliers ». Le nouvel atelier reste dans ce navigateur.</p><p id="workshop-error" class="form-error" role="alert"></p><div class="modal-actions">' + button('close-dialog', 'Annuler', '', 'secondary') + '<button type="submit" class="btn primary">' + ico('arrow-right') + ' Continuer</button></div></form>', '', 'create-workshop');
    document.getElementById('workshop-title').focus();
  }
  function showWorkshopPreparation() {
    closeDialog(); activeView = 'workshop'; activeTab = state.archived ? 'recap' : 'prep'; render();
    workspace.focus({ preventScroll: true });
    if (typeof workspace.scrollIntoView === 'function') workspace.scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  function captureFocus() {
    var node = document.activeElement;
    return node ? { node: node, id: node.id, action: node.dataset && node.dataset.action, index: node.dataset && node.dataset.index } : null;
  }
  function restoreFocus(target) {
    if (!target) return;
    var node = target.node && target.node.isConnected ? target.node : target.id ? document.getElementById(target.id) : null;
    if (!node && target.action) {
      node = Array.from(document.querySelectorAll('[data-action]')).find(function (candidate) { return candidate.dataset.action === target.action && candidate.dataset.index === target.index; });
    }
    if (!node || node.disabled) node = document.querySelector('.view-tabs .tab.active') || workspace;
    if (node && typeof node.focus === 'function') { if (node === workspace) node.setAttribute('tabindex', '-1'); node.focus({ preventScroll: true }); }
  }
  function closeDialog(restore) {
    var instance = dialog;
    var returnTo = dialogReturnFocus;
    if (restore !== false && modalKind === 'preparation-import') creationDraft = null;
    dialog = null; dialogReturnFocus = null; modalKind = '';
    if (instance) { instance.close(); instance.remove(); }
    if (restore !== false) restoreFocus(returnTo);
    return returnTo;
  }
  function showDialog(title, body, actions, kind) {
    var returnTo = dialog ? dialogReturnFocus : captureFocus();
    var projected = kind === 'projection' || kind === 'gallery';
    closeDialog(false);
    dialogReturnFocus = returnTo;
    modalKind = kind || '';
    dialog = document.createElement('dialog');
    dialog.id = 'sandbox-dialog';
    dialog.className = 'modal' + ((kind === 'projection' || kind === 'gallery') ? ' projection-modal' : kind === 'preparation-import' ? ' generator-modal' : '');
    dialog.setAttribute('aria-labelledby', 'sandbox-dialog-title');
    var navigation = projected && actions ? '<nav class="modal-actions projection-navigation" aria-label="' + (kind === 'gallery' ? 'Navigation entre les résultats' : 'Navigation entre les questions projetées') + '">' + actions + '</nav>' : '';
    dialog.innerHTML = '<div class="modal-head"><div><p class="eyebrow">' + (projected ? (kind === 'gallery' ? 'APERÇU DES RÉSULTATS' : 'APERÇU PROJECTION') : kind === 'participant' ? 'APERÇU PARTICIPANT' : 'VOTRE ESPACE D’ESSAI') + '</p><h2 id="sandbox-dialog-title">' + esc(title) + '</h2></div>' + button('close-dialog', '<span class="sr-only">Fermer</span>', 'close', 'ghost icon-btn', 'aria-label="Fermer la fenêtre"') + '</div>' + navigation + '<div class="modal-body">' + body + '</div>' + (!projected && actions ? '<div class="modal-actions">' + actions + '</div>' : '');
    document.body.appendChild(dialog);
    var instance = dialog;
    instance.addEventListener('close', function () { if (dialog === instance) closeDialog(); else instance.remove(); });
    dialog.addEventListener('click', function (event) { if (event.target === dialog) { var rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });
    dialog.showModal();
    if (projected) {
      dialog.scrollTop = 0;
      var content = dialog.querySelector('.modal-body');
      if (content) content.scrollTop = 0;
    }
  }

  function endingCopy() { return '<p class="conclusion-copy">' + esc(state.conclusion || 'Merci pour votre participation. Gardez un petit geste à essayer après cet atelier.') + '</p>'; }
  function participantOptions(q) {
    if (isWritten(q)) return '<label class="field-label" for="participant-text">' + (q.type === 'wordcloud' ? 'Votre mot' : 'Votre réponse') + '</label><textarea class="textarea" id="participant-text" name="text" maxlength="' + (q.type === 'wordcloud' ? 80 : 240) + '" required placeholder="' + (q.type === 'wordcloud' ? 'Le mot qui vous vient…' : 'Votre idée, en quelques mots…') + '"></textarea>';
    var variants = q.type === 'steps' && q.variants ? q.variants : [];
    var selected = Math.min(participantDevices[q.id] || 0, Math.max(0, variants.length - 1));
    var devices = variants.length ? '<div class="form-field"><label class="field-label" for="participant-device">Mon appareil</label><select class="input" id="participant-device">' + variants.map(function (variant, index) { return '<option value="' + index + '" ' + (index === selected ? 'selected' : '') + '>' + esc(variant.name) + '</option>'; }).join('') + '</select></div>' : '';
    var multiple = isMulti(q) || q.type === 'steps';
    return devices + '<fieldset class="participant-options"><legend class="sr-only">Votre réponse</legend>' + (multiple ? '<p class="participant-hint">' + (isMulti(q) ? 'Plusieurs réponses possibles.' : 'Cochez les étapes réalisées.') + '</p>' : '') + q.options.map(function (option, index) {
      var detail = variants[selected] ? variants[selected].steps[index] : '';
      return '<label class="option-choice"><input type="' + (multiple ? 'checkbox' : 'radio') + '" name="answer" value="' + index + '" ' + (multiple ? '' : 'required') + '><span class="answer-letter">' + (q.type === 'scale' ? index + 1 : q.type === 'steps' ? ico('check') : letters[index]) + '</span><span>' + esc(option) + (detail ? '<small class="step-variant-detail" data-step="' + index + '">' + esc(detail) + '</small>' : '') + '</span></label>';
    }).join('') + '</fieldset>';
  }

  function refreshParticipant() {
    if (modalKind !== 'participant' || !dialog) return;
    var same = !!current() && dialog.dataset.questionId === current().id;
    var sent = same && dialog.dataset.sent === 'true';
    var form = same && document.getElementById('participant-form');
    var checked = form ? Array.from(form.querySelectorAll('input[name="answer"]:checked')).map(function (node) { return node.value; }) : [];
    var text = form && form.querySelector('[name="text"]');
    var draft = text ? text.value : '';
    var anonymous = document.getElementById('anonymous-question');
    var anonymousDraft = anonymous ? anonymous.value : '';
    var focus = document.activeElement && document.activeElement.id;
    participant(sent);
    var newAnonymous = document.getElementById('anonymous-question');
    if (newAnonymous) newAnonymous.value = anonymousDraft;
    var updated = same && document.getElementById('participant-form');
    if (updated) {
      updated.querySelectorAll('input[name="answer"]').forEach(function (node) { node.checked = checked.indexOf(node.value) !== -1; });
      var field = updated.querySelector('[name="text"]'); if (field) field.value = draft;
      var target = focus && document.getElementById(focus); if (target) target.focus({ preventScroll: true });
    }
  }
  function participant(sent) {
    var q = current();
    if (!q) { toast('Ajoutez ou importez une question avant d’ouvrir cet aperçu.'); return; }
    if (state.archived) { showDialog('Atelier archivé', '<p>Cet atelier est archivé. Il doit être restauré pour reprendre les réponses.</p>', button('close-dialog', 'Fermer', '', 'secondary'), 'participant'); return; }
    if (state.ended) { showDialog('Merci pour votre participation', '<div class="participant-success">' + ico('check-circle') + '<h3>L’atelier est terminé</h3>' + endingCopy() + '</div>', button('close-dialog', 'Revenir à l’atelier', 'arrow-left', 'secondary'), 'participant'); return; }
    var fields = participantOptions(q);
    var canAnswer = !sent && !sessionSettings().welcome && q.state === 'open' && q.responses < state.capacity;
    var content = '<div class="phone-preview"><div class="phone-top">' + badge('Participant fictif', 'neutral') + '<span class="muted">Question ' + (state.current + 1) + ' / ' + state.questions.length + '</span></div><h3>' + esc(q.title) + '</h3><p class="muted">' + esc(q.description) + '</p>' + (canAnswer ? '<form id="participant-form" data-question-id="' + esc(q.id) + '">' + fields + '<p id="participant-error" class="form-error" role="alert"></p><button class="btn primary" type="submit">' + ico('check') + ' Envoyer ma réponse</button></form>' : '<p class="info-note">' + (q.responses >= state.capacity ? 'Toutes les réponses de cet essai ont été reçues.' : 'Le vote est fermé. Ouvrez-le depuis l’écran animateur pour essayer.') + '</p>') + (q.published ? '<div class="participant-results"><h4>Les résultats du groupe</h4>' + answers(q, true) + (q.explanation ? '<p class="info-note">' + esc(q.explanation) + '</p>' : '') + '</div>' : '<p class="participant-privacy muted">' + ico('eye-off') + ' Les résultats du groupe ne sont pas encore publiés.</p>') + '</div>';
    if (sent) content = content.replace('Le vote est fermé. Ouvrez-le depuis l’écran animateur pour essayer.', 'Votre réponse est envoyée. Attendez la prochaine question.');
    if (sessionSettings().welcome) content = content.replace('Le vote est fermé. Ouvrez-le depuis l’écran animateur pour essayer.', 'L’accueil est affiché. La question apparaîtra quand l’animateur commencera.');
    content += '<section class="participant-extras"><h3>Signaler une difficulté</h3><div class="session-actions">' + [['fast', 'Trop vite'], ['again', 'À réexpliquer'], ['help', 'Besoin d’aide']].map(function (signal) { return button('send-signal', signal[1], 'hand', 'secondary small', 'data-kind="' + signal[0] + '"'); }).join('') + '</div><h3>Oser demander</h3>' + (sessionSettings().asksOpen ? '<form id="anonymous-question-form"><label class="field-label" for="anonymous-question">Votre question, sans nom ni donnée personnelle</label><textarea class="textarea" id="anonymous-question" name="text" maxlength="240" required></textarea><button type="submit" class="btn secondary">Envoyer la question</button></form>' : '<p>Les questions anonymes sont fermées pour le moment.</p>') + '</section>';
    showDialog('Dans la peau d’un participant', content, '', 'participant');
    dialog.dataset.questionId = q.id; dialog.dataset.sent = sent ? 'true' : 'false';
  }
  function projection() {
    var q = current();
    if (state.archived || state.placeholder) {
      renderProjectionFrame('Projection de l’atelier', '<div class="projection-preview"><h3>' + (state.archived ? 'Cet atelier est archivé' : 'Aucune question à projeter pour le moment') + '</h3><p>Préparez ou ouvrez un atelier depuis l’écran animateur. La projection se mettra à jour automatiquement.</p></div>', button('result-gallery', 'Voir les formes de résultats', 'chart', 'secondary'));
      return;
    }
    var settings = sessionSettings();
    if (settings.welcome || !q || settings.showAsks || settings.podium) {
      var extra = (settings.welcome || !q) ? '<h3>Bienvenue dans « ' + esc(state.title) + ' »</h3><p>Code de démonstration : <strong>' + sessionCode() + '</strong></p><p>' + (settings.registrationsOpen ? 'Inscriptions ouvertes' : 'Inscriptions fermées') + ' · ' + state.participants + ' participants fictifs</p>' + (settings.showQr ? '<div class="welcome-qr">' + qrMarkup() + '<p>' + esc(invitationUrl()) + '</p></div>' : '') : settings.podium ? '<h3>Podium de démonstration</h3>' + podiumContent() : '<h3>Questions du groupe</h3>' + (settings.asks.some(function (a) { return a.published; }) ? settings.asks.filter(function (a) { return a.published; }).map(function (a) { return '<article class="answer-row"><p>' + esc(a.text) + '</p></article>'; }).join('') : '<p>Aucune question publiée pour le moment.</p>');
      renderProjectionFrame('L’écran de votre groupe', '<div class="projection-preview">' + extra + '</div>', button('projection-next', (settings.welcome || !q) ? 'Commencer les questions' : 'Revenir à la question', 'arrow-right', 'secondary', isDisabled(!q)) + button('result-gallery', 'Toutes les formes', 'chart', 'secondary small'));
      return;
    }
    var hasResponses = q.responses > 0;
    var resultHint = !q.published && hasResponses ? '<div class="projection-result-hint"><span>' + ico('eye-off') + ' Les réponses sont prêtes mais encore masquées.</span><button type="button" class="btn secondary small" data-action="projection-toggle-results">Afficher le graphe</button></div>' : '';
    var projectionContent;
    if (state.ended) {
      projectionContent = '<div class="projection-ending"><p class="eyebrow">MERCI POUR VOTRE PARTICIPATION</p><h3>Les idées à emporter</h3>' + endingCopy() + '</div>';
    } else {
      var hiddenOptions = isWritten(q) ? '<p>' + (q.type === 'wordcloud' ? 'Envoyez un mot depuis votre appareil.' : 'Écrivez votre réponse sur votre appareil.') + '</p>' : q.options.map(function (option, index) { return '<div class="answer-row"><span class="answer-letter">' + letters[index] + '</span><span class="answer-text">' + esc(option) + '</span></div>'; }).join('');
      var hiddenResults = '<div class="projection-options">' + hiddenOptions + '</div><div class="projection-wait">' + ico('users') + '<strong>' + q.responses + ' / ' + state.capacity + '</strong> réponses reçues <span>· Résultats masqués</span></div>' + resultHint;
      projectionContent = '<div class="question-topline">' + badge(stateLabel(q), q.state === 'open' ? 'green' : 'neutral') + '</div><h3>' + esc(q.title) + '</h3><p class="question-description">' + esc(q.description) + '</p>' + (q.published ? answers(q, true) + (q.explanation ? '<p class="info-note">' + esc(q.explanation) + '</p>' : '') : hiddenResults);
      settings.asks.filter(function (ask) { return ask.published; }).forEach(function (ask) { projectionContent += '<div class="projected-question"><p class="eyebrow">UNE QUESTION DU GROUPE</p><p>' + esc(ask.text) + '</p></div>'; });
    }
    var body = '<div class="projection-preview"><div class="projection-meta"><span>WoocLight · ' + esc(state.title) + '</span><span>Question ' + (state.current + 1) + ' / ' + state.questions.length + '</span></div>' + projectionContent + '</div>';
    var projectionResultsButton = q.published ? button('projection-toggle-results', 'Masquer le graphe', 'eye-off', 'secondary small') : (hasResponses ? button('projection-toggle-results', 'Afficher le graphe', 'eye', 'primary small') : '');
    renderProjectionFrame('L’écran de votre groupe', body, button('projection-previous', 'Précédente', 'arrow-left', 'ghost', isDisabled(state.current === 0)) + button('projection-next', 'Suivante', 'arrow-right', 'secondary', isDisabled(state.current === state.questions.length - 1)) + projectionResultsButton + button('result-gallery', 'Toutes les formes', 'chart', 'ghost small'));
  }
  function projectionUrl() {
    if (!window.location) return '?projection=1';
    var query = new URLSearchParams(window.location.search); query.set('projection', '1');
    return window.location.pathname + '?' + query.toString();
  }
  function projectionLink() {
    if (state.archived || state.placeholder) return button('projection', 'Ouvrir la projection', 'screen', 'primary', 'disabled');
    return '<a class="btn primary" href="' + esc(projectionUrl()) + '" target="_blank" rel="noopener" data-action="projection" aria-label="Ouvrir la projection dans un nouvel onglet">' + ico('screen') + '<span>Ouvrir la projection</span>' + ico('external') + '</a>';
  }
  function renderProjectionFrame(title, body, actions) {
    var invitation = current() && !sessionSettings().welcome && sessionSettings().showQr ? '<aside class="projection-invitation">' + qrMarkup() + '<span>Code de démonstration : <strong>' + sessionCode() + '</strong></span></aside>' : '';
    workspace.innerHTML = '<section class="projection-screen projection-modal"><header class="modal-head"><div><p class="eyebrow">WOOCLIGHT · PROJECTION SIMULÉE</p><h1>' + esc(title) + '</h1></div><div class="projection-window-actions">' + button('projection-fullscreen', document.fullscreenElement ? 'Quitter le plein écran' : 'Plein écran', 'screen', 'secondary small') + button('projection-close', 'Fermer la projection', 'close', 'secondary small') + '</div></header><nav class="modal-actions projection-navigation" aria-label="Commandes de la projection">' + actions + invitation + '</nav><div class="modal-body">' + body + '</div></section>';
    var content = workspace.querySelector('.modal-body');
    if (content) content.scrollTop = 0;
  }

  function galleryScaleContent() {
    var values = [1, 2, 4, 3, 2];
    var labels = ['1', '2', '3', '4', '5'];
    var highest = Math.max.apply(Math, values);
    return '<div class="gallery-scale" role="img" aria-label="Répartition sur une échelle de 1 à 5">' + values.map(function (value, index) {
      var height = Math.max(12, Math.round(value / highest * 100));
      return '<div class="scale-column"><div class="scale-bar-wrap"><span class="scale-bar" style="height:' + height + '%"></span></div><strong>' + value + '</strong><span>' + labels[index] + '</span></div>';
    }).join('') + '</div><p class="gallery-chart-foot">Moyenne fictive : 3,3 / 5 · 12 réponses</p>';
  }

  function galleryPointsContent() {
    var rows = [['Vérifier l’adresse', 18], ['Prendre une pause', 14], ['Demander conseil', 11], ['Passer par le site officiel', 8]];
    return '<div class="gallery-ranking" role="list" aria-label="Classement de points fictif"><div class="gallery-ranking-head"><span>Classement</span><span>Points</span></div>' + rows.map(function (row, index) {
      return '<div class="gallery-ranking-row" role="listitem"><span class="rank-number">' + (index + 1) + '</span><span class="rank-label">' + esc(row[0]) + '</span><strong>' + row[1] + '</strong></div>';
    }).join('') + '</div><p class="gallery-chart-foot">Les points expriment les priorités du groupe. Aucune bonne réponse n’est attendue.</p>';
  }

  function galleryWallContent() {
    var cards = [['Je vérifie l’adresse en la retapant.', 'Anonyme · il y a 2 min', 8], ['Je demande conseil avant de cliquer.', 'Anonyme · il y a 5 min', 5], ['Je garde mon calme face à l’urgence.', 'Anonyme · il y a 7 min', 11]];
    return '<div class="gallery-wall" role="list" aria-label="Mur de contributions fictives">' + cards.map(function (card) {
      return '<article class="gallery-wall-card" role="listitem"><p>' + esc(card[0]) + '</p><div><span>' + esc(card[1]) + '</span><strong>♥ ' + card[2] + '</strong></div></article>';
    }).join('') + '</div><p class="gallery-chart-foot">Un mur permet de lire les contributions et de les apprécier ensemble.</p>';
  }

  function galleryPostitContent() {
    var columns = [
      { title: 'À retenir', color: 'yellow', notes: ['Vérifier l’adresse', 'Ne pas agir dans l’urgence'] },
      { title: 'À essayer', color: 'mint', notes: ['Passer par le site officiel', 'Demander un second avis'] },
      { title: 'Questions', color: 'pink', notes: ['Comment reconnaître le vrai expéditeur ?', 'Que faire après un clic ?'] }
    ];
    return '<div class="gallery-board" role="list" aria-label="Mur de post-it fictif">' + columns.map(function (column) {
      return '<section class="gallery-board-column" role="listitem"><h4>' + esc(column.title) + '</h4>' + column.notes.map(function (note) { return '<div class="sticky-note sticky-' + column.color + '">' + esc(note) + '</div>'; }).join('') + '</section>';
    }).join('') + '</div><p class="gallery-chart-foot">Les post-it regroupent les idées par thème et restent lisibles en projection.</p>';
  }

  function galleryDotsContent() {
    var rows = [['Je me sens prêt·e', 9, 'teal'], ['J’ai encore un doute', 5, 'amber'], ['Je veux en parler', 3, 'plum']];
    return '<div class="gallery-dots" role="list" aria-label="Gommettes de vote fictives">' + rows.map(function (row) {
      return '<div class="gallery-dots-row" role="listitem"><span class="dots-label">' + esc(row[0]) + '</span><span class="dot-pills dot-pills-' + row[2] + '" aria-hidden="true">' + '●'.repeat(row[1]) + '</span><strong>' + row[1] + '</strong></div>';
    }).join('') + '</div><p class="gallery-chart-foot">Les gommettes donnent un aperçu très rapide des préférences du groupe.</p>';
  }

  function gallerySlides() {
    var binary = { type: 'yesno', title: 'Notez-vous vos mots de passe sur papier ?', description: 'Une répartition Oui / Non affichée en anneau.', options: ['Oui', 'Non'], counts: [8, 4], responses: 12, published: true };
    var poll = { type: 'poll', title: 'Combien de mots de passe différents utilisez-vous ?', description: 'Un sondage à choix unique.', options: ['1 seul', '2 ou 3', 'Plus de 3', 'Je ne sais pas'], counts: [5, 3, 2, 2], responses: 12, published: true };
    var single = { type: 'mcq', title: 'Quel indice doit vous alerter ?', description: 'Un QCM avec une bonne réponse signalée.', options: ['Le montant est précis', 'Le message est court', 'On vous presse de donner vos coordonnées', 'Il est arrivé sur votre téléphone'], counts: [2, 1, 10, 1], responses: 14, correct: 2, published: true };
    var multiple = { type: 'mcq', multi: true, title: 'Quels mots de passe sont solides ?', description: 'Plusieurs réponses peuvent être correctes.', options: ['Trois mots au hasard', 'Une phrase de passe', 'Sa date de naissance', 'azerty123'], counts: [7, 10, 1, 4], responses: 12, correct: [0, 1], published: true };
    var wordcloud = { type: 'wordcloud', title: 'Un mot pour décrire ce que vous retenez ?', description: 'Les mots sont regroupés et leur taille suit leur fréquence.', options: [], texts: ['Confiance', 'Pause', 'Confiance', 'Vérifier', 'Pause', 'Prudence'], responses: 6, published: true };
    var text = { type: 'text', title: 'Quel réflexe allez-vous garder ?', description: 'Les réponses libres restent affichées sous forme de cartes.', options: [], texts: ['Je vérifie l’adresse avant de cliquer.', 'Je demande conseil en cas de doute.', 'Je prends une pause face à l’urgence.'], responses: 3, published: true };
    var steps = { type: 'steps', title: 'Les trois réflexes avant de cliquer', description: 'Chaque barre montre combien de participants ont réalisé l’étape.', options: ['Lire le message', 'Vérifier l’adresse', 'Contacter l’organisme autrement'], counts: [9, 7, 5], responses: 12, published: true };
    return [
      { label: 'Anneau Oui / Non', title: 'Une réponse binaire en un coup d’œil', description: 'La part de chaque réponse reste visible même à distance.', content: answers(binary, false), note: 'Utile pour une question fermée et une lecture immédiate du groupe.' },
      { label: 'Barres de sondage', title: 'Comparer des choix', description: 'Les barres affichent le nombre et le pourcentage de réponses.', content: answers(poll, false), note: 'Utile pour faire ressortir une tendance sans hiérarchie de bonnes réponses.' },
      { label: 'QCM — une réponse', title: 'Montrer la bonne réponse', description: 'La réponse correcte est marquée dans la projection après publication.', content: answers(single, false), note: 'Utile pour corriger collectivement et garder une explication sous le graphe.' },
      { label: 'QCM — plusieurs réponses', title: 'Lire des choix multiples', description: 'Chaque choix est rapporté aux participants ; les bonnes réponses sont repérées.', content: answers(multiple, false), note: 'Utile quand plusieurs propositions peuvent être justes.' },
      { label: 'Échelle', title: 'Distribuer un niveau de 1 à 5', description: 'Une colonne par niveau rend la dispersion facile à comparer.', content: galleryScaleContent(), note: 'Utile pour une auto-évaluation ou une mesure avant / après.' },
      { label: 'Nuage de mots', title: 'Faire émerger les mots du groupe', description: 'Les mots fréquents grandissent et gardent leur nombre de mentions.', content: answers(wordcloud, false), note: 'Utile en ouverture, en clôture ou pour collecter des idées sans imposer de choix.' },
      { label: 'Réponses libres', title: 'Lire les contributions textuelles', description: 'Chaque contribution est isolée pour faciliter la lecture et le commentaire.', content: answers(text, false), note: 'Utile pour une question ouverte, une intention ou un retour d’expérience.' },
      { label: 'Défi à étapes', title: 'Suivre les gestes réalisés', description: 'Une barre par étape montre où le groupe avance ou a besoin d’aide.', content: answers(steps, false), note: 'Utile pour un exercice pratique à cocher étape par étape.' },
      { label: 'Classement à points', title: 'Afficher les priorités du groupe', description: 'Les points sont répartis entre les idées ou les actions proposées.', content: galleryPointsContent(), note: 'Utile pour choisir ensemble une priorité ou répartir un budget.' },
      { label: 'Mur de contributions', title: 'Projeter les contributions', description: 'Les réponses sont présentées comme des cartes que le groupe peut lire ou apprécier.', content: galleryWallContent(), note: 'Utile pour afficher des idées, des phrases ou des réactions au fil de l’atelier.' },
      { label: 'Post-it', title: 'Regrouper les idées par thème', description: 'Les post-it se déplacent mentalement dans trois colonnes : retenir, essayer, questionner.', content: galleryPostitContent(), note: 'Utile pour une synthèse collective et une animation de tri en fin d’atelier.' },
      { label: 'Gommettes', title: 'Faire voter très rapidement', description: 'Chaque point représente une gommette ou un vote express.', content: galleryDotsContent(), note: 'Utile pour prendre la température du groupe sans interrompre le rythme.' }
    ];
  }

  function resultGallery() {
    var slides = gallerySlides();
    galleryIndex = Math.max(0, Math.min(galleryIndex, slides.length - 1));
    var slide = slides[galleryIndex];
    var body = '<div class="result-gallery-preview"><div class="projection-meta"><span>WoocLight · formes de résultats</span><span>Résultat ' + (galleryIndex + 1) + ' / ' + slides.length + '</span></div><div class="gallery-slide-head"><p class="eyebrow">' + esc(slide.label) + '</p><h3>' + esc(slide.title) + '</h3><p class="gallery-description">' + esc(slide.description) + '</p></div><div class="gallery-stage">' + slide.content + '</div><p class="gallery-note">' + esc(slide.note) + '</p></div>';
    var actions = button('gallery-prev', 'Précédent', 'arrow-left', 'ghost', isDisabled(galleryIndex === 0)) + button('gallery-next', 'Suivant', 'arrow-right', 'secondary', isDisabled(galleryIndex === slides.length - 1)) + button(projectionOnly ? 'projection-home' : 'close-dialog', projectionOnly ? 'Revenir à la question' : 'Quitter la galerie', 'close', 'primary');
    if (projectionOnly) renderProjectionFrame('Galerie des résultats', body, actions);
    else showDialog('Galerie des résultats', body, actions, 'gallery');
  }

  function editQuestion(index) {
    var q = index == null ? { type: 'mcq', title: '', description: '', options: ['', '', '', ''], correct: 0, multi: false } : state.questions[index];
    var correctValue = Array.isArray(q.correct) ? q.correct.map(function (value) { return value + 1; }).join(', ') : (Number.isInteger(q.correct) ? q.correct + 1 : '1');
    var body = '<form id="question-form" data-index="' + (index == null ? '' : index) + '"><div class="form-field"><label class="field-label" for="edit-type">Type de question</label><select class="input" id="edit-type" name="type">' + [['mcq', 'Quiz — une bonne réponse ou plusieurs'], ['yesno', 'Oui / Non'], ['truefalse', 'Vrai / Faux'], ['poll', 'Sondage — un choix'], ['scale', 'Échelle de 1 à 5 (ou 10 si importée)'], ['steps', 'Défi à étapes'], ['text', 'Réponse libre'], ['wordcloud', 'Nuage de mots']].map(function (entry) { return '<option value="' + entry[0] + '" ' + (q.type === entry[0] ? 'selected' : '') + '>' + entry[1] + '</option>'; }).join('') + '</select></div><div class="form-field"><label class="field-label" for="edit-title">Votre question</label><textarea class="textarea" id="edit-title" name="title" rows="2" maxlength="240" required placeholder="Quelle question souhaitez-vous poser ?">' + esc(q.title) + '</textarea></div><div class="form-field"><label class="field-label" for="edit-description">Un peu de contexte <span class="muted">(facultatif)</span></label><textarea class="textarea" id="edit-description" name="description" rows="2" maxlength="400">' + esc(q.description) + '</textarea></div><div id="edit-options-field" class="form-field"><label class="field-label" for="edit-options">Choix ou étapes — un par ligne</label><textarea class="textarea" id="edit-options" name="options" rows="4" maxlength="1500">' + esc(q.options.join('\n')) + '</textarea><p class="muted">De 2 à 10 choix. Une étape par ligne. Les variantes sont conservées si le nombre d’étapes reste identique.</p></div><div id="edit-correct-field" class="form-field"><label class="field-label" for="edit-correct">Numéro(s) de la bonne réponse</label><input class="input" id="edit-correct" name="correct" type="text" inputmode="numeric" value="' + esc(correctValue) + '"><small class="muted">Pour plusieurs réponses, séparez les numéros par des virgules.</small></div><div id="edit-multi-field" class="form-field"><label class="check-line"><input id="edit-multi" name="multi" type="checkbox" ' + (q.multi ? 'checked' : '') + '> Plusieurs réponses possibles</label><small class="muted">Les pourcentages seront calculés sur le nombre de participants, comme dans le graphe projeté.</small></div><div id="edit-explanation-field" class="form-field"><label class="field-label" for="edit-explanation">L’explication à retenir <span class="muted">(facultatif)</span></label><textarea class="textarea" id="edit-explanation" name="explanation" rows="2" maxlength="600">' + esc(q.explanation || '') + '</textarea></div>' + (index != null && q.responses ? '<p class="info-note">Modifier cette question remettra ses réponses fictives à zéro.</p>' : '') + '<p id="question-error" class="form-error" role="alert"></p><div class="modal-actions">' + button('close-dialog', 'Annuler', '', 'secondary') + '<button class="btn primary" type="submit">' + ico('check') + ' Enregistrer la question</button></div></form>';
    showDialog(index == null ? 'Ajouter une question' : 'Modifier la question', body, '', 'edit');
    updateQuestionFields();
    document.getElementById('edit-title').focus();
  }
  function updateQuestionFields() {
    var input = document.getElementById('edit-type');
    if (!input) return;
    var type = input.value;
    document.getElementById('edit-options-field').hidden = isWritten({ type: type }) || ['scale', 'yesno', 'truefalse'].indexOf(type) !== -1;
    document.getElementById('edit-correct-field').hidden = !isQuiz({ type: type });
    document.getElementById('edit-multi-field').hidden = type !== 'mcq';
    document.getElementById('edit-explanation-field').hidden = false;
  }

  function recordAnswer(q, values, text) {
    if (!sessionSettings().registrationsOpen && q.responses >= state.participants) return false;
    if (q.responses >= state.capacity || q.state !== 'open' || state.ended || state.archived) return false;
    if (isWritten(q)) { if (typeof text !== 'string' || !text.trim() || text.length > (q.type === 'wordcloud' ? 80 : 240)) return false; }
    else if (!Array.isArray(values) || !values.length || values.some(function (v) { return !Number.isInteger(v) || v < 0 || v >= q.options.length; }) || new Set(values).size !== values.length || (q.type !== 'steps' && !isMulti(q) && values.length !== 1)) return false;
    q.responses++;
    if (isWritten(q)) { q.texts = q.texts || []; q.texts.push(text.trim()); }
    else values.forEach(function (value) { q.counts[value] = (Number(q.counts[value]) || 0) + 1; });
    state.participants = Math.max(Number(state.participants) || 0, q.responses);
    save();
    return true;
  }
  function navigateQuestion(delta) {
    if (!current()) return;
    var settings = sessionSettings();
    if (settings.showAsks || settings.podium) { settings.showAsks = false; settings.podium = false; save(); render(); return; }
    if (settings.welcome && delta > 0) { settings.welcome = false; state.current = 0; if (current().state === 'draft') current().state = 'open'; save(); render(); return; }
    if (delta < 0 && state.current === 0) { settings.welcome = true; save(); render(); return; }
    state.current = Math.max(0, Math.min(state.questions.length - 1, state.current + delta));
    if (delta > 0 && current().state === 'draft') current().state = 'open';
    save(); render();
  }
  function revealCurrentQuestion() {
    if (activeView !== 'workshop' || activeTab !== 'live') return;
    var panel = document.getElementById('current-question');
    if (panel) panel.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  function download(filename, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function csvCell(value) {
    var text = String(value == null ? '' : value);
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function exportCSV() {
    var rows = [['Atelier', 'N°', 'Question', 'Type', 'Choix ou réponse', 'Nombre', 'Réponses reçues']];
    state.questions.forEach(function (q, index) {
      if (isWritten(q)) {
        if (!(q.texts || []).length) rows.push([state.title, index + 1, q.title, typeLabel(q), '', 0, q.responses]);
        (q.texts || []).forEach(function (text) { rows.push([state.title, index + 1, q.title, typeLabel(q), text, 1, q.responses]); });
      }
      else q.options.forEach(function (option, n) { rows.push([state.title, index + 1, q.title, typeLabel(q), option, q.counts[n] || 0, q.responses]); });
    });
    download('wooclight-resultats-demo.csv', '\uFEFF' + rows.map(function (row) { return row.map(csvCell).join(';'); }).join('\r\n'), 'text/csv;charset=utf-8');
    toast('Les résultats fictifs ont été téléchargés en CSV.');
  }
  function exportMemo() {
    var text = 'WOOCLIGHT — MÉMO DE DÉMONSTRATION\n' + state.title + '\n\n' + state.questions.map(function (q, index) { return (index + 1) + '. ' + q.title + '\n' + (q.explanation || (q.type === 'steps' ? q.options.map(function (option) { return '• ' + option; }).join('\n') : 'À reprendre ensemble pendant l’atelier.')); }).join('\n\n') + (state.conclusion ? '\n\nÀ RETENIR\n' + state.conclusion : '') + '\n\nDocument issu d’un essai local. Aucune réponse personnelle n’est incluse.\n';
    download('wooclight-memo-demo.txt', text.replace('WO OCLIGHT', 'WOOCLIGHT'), 'text/plain;charset=utf-8');
    toast('Votre mémo de démonstration a été téléchargé.');
  }
  function help() {
    showDialog('Faites un tour de l’atelier', '<div class="stack"><p>Vous êtes dans une maquette interactive. Les 18 participants et toutes leurs réponses sont fictifs.</p><ol class="help-steps"><li><strong>Pilotage :</strong> gérez le QR, les inscriptions, les signaux, les questions anonymes et le podium.</li><li><strong>Animer :</strong> choisissez une question, ouvrez son vote et simulez des réponses.</li><li><strong>Aperçu participant :</strong> répondez comme un membre du groupe. Votre réponse alimente les graphiques.</li><li><strong>Projection :</strong> les réponses du groupe restent masquées tant que vous ne cliquez pas sur « Afficher les résultats ».</li><li><strong>Préparer et Bilan :</strong> modifiez les questions, puis téléchargez un CSV ou un mémo.</li></ol><p class="info-note">Votre essai reste dans ce navigateur. « Recommencer » permet de repartir du début.</p></div>', button('close-dialog', 'C’est parti', 'arrow-right', 'primary'), 'help');
  }

  document.addEventListener('click', function (event) {
    var nav = event.target.closest('[data-nav]');
    if (nav) { activeView = nav.dataset.nav; render(); return; }
    if (event.target.closest('#reset-demo')) { if (confirm('Recommencer la démonstration ? Votre atelier actuel sera conservé dans « Mes ateliers ».')) { if (!switchWorkshop(fixture('scams'))) { toast('Impossible d’enregistrer le changement. Votre atelier actuel est conservé.'); return; } showWorkshopPreparation(); toast('La démonstration est prête à recommencer.'); } return; }
    if (event.target.closest('#help-demo')) { help(); return; }
    var target = event.target.closest('[data-action]');
    if (!target || target.disabled) return;
    var action = target.dataset.action;
    var index = Number(target.dataset.index);
    var q = current();
    if (action === 'toggle-registrations') { sessionSettings().registrationsOpen = !sessionSettings().registrationsOpen; save(); render(); return; }
    if (action === 'toggle-qr') { sessionSettings().showQr = !sessionSettings().showQr; save(); render(); return; }
    if (action === 'show-welcome') { sessionSettings().welcome = true; sessionSettings().showAsks = false; sessionSettings().podium = false; save(); render(); return; }
    if (action === 'simulate-registration' || action === 'join-session') { if (registerParticipant()) { if (action === 'join-session') joinedHere = true; render(); toast('Une inscription fictive a été ajoutée.'); } else toast('Les inscriptions sont fermées ou l’atelier est complet.'); return; }
    if (action === 'toggle-asks') { sessionSettings().asksOpen = !sessionSettings().asksOpen; save(); render(); return; }
    if (action === 'simulate-ask') { if (addAnonymousQuestion('Comment retrouver le site officiel sans utiliser le lien reçu ?')) render(); return; }
    if (action === 'project-asks') { sessionSettings().showAsks = !sessionSettings().showAsks; sessionSettings().welcome = false; sessionSettings().podium = false; save(); render(); return; }
    if (action === 'delete-ask') { var asks = sessionSettings().asks; if (confirm('Supprimer cette question anonyme ?')) { sessionSettings().asks = asks.filter(function (a) { return a.id !== target.dataset.id; }); save(); render(); } return; }
    if (action === 'send-signal') { var kind = target.dataset.kind; if (['fast', 'again', 'help'].indexOf(kind) !== -1) { sessionSettings().signals[kind] = Math.min(18, sessionSettings().signals[kind] + 1); state.helpCount = sessionSettings().signals.help; save(); render(); } return; }
    if (action === 'toggle-pseudos') { sessionSettings().pseudos = !sessionSettings().pseudos; if (!sessionSettings().pseudos) sessionSettings().podium = false; save(); render(); return; }
    if (action === 'toggle-podium') { if (sessionSettings().pseudos) { sessionSettings().podium = !sessionSettings().podium; sessionSettings().showAsks = false; sessionSettings().welcome = false; save(); render(); } return; }
    if (action === 'reset-question') { if (q && confirm('Effacer les réponses de cette question pour la reposer ?')) { q.counts = q.options.map(function () { return 0; }); q.responses = 0; q.texts = []; q.published = false; q.state = 'draft'; save(); render(); } return; }
    if (action === 'copy-invitation' || action === 'share-invitation') { shareInvitation(action === 'share-invitation'); return; }
    if (action === 'create-workshop') { createWorkshop(); return; }
    if (['duplicate-workshop', 'archive-workshop', 'restore-workshop', 'delete-workshop'].indexOf(action) !== -1) {
      var managed = allWorkshops().find(function (entry) { return entry.workshopId === target.dataset.id; });
      if (!managed) return;
      if (action === 'delete-workshop' && !confirm('Supprimer définitivement l’atelier « ' + managed.title + ' » et ses réponses de ce navigateur ?')) return;
      var changed = action === 'duplicate-workshop' ? duplicateWorkshop(managed) : action === 'delete-workshop' ? deleteWorkshop(managed) : setWorkshopArchived(managed, action === 'archive-workshop');
      if (!changed) { toast('Impossible d’enregistrer cette action. Vos ateliers sont conservés.'); return; }
      if (action === 'duplicate-workshop') showWorkshopPreparation();
      else { activeView = 'history'; render(); }
      toast(action === 'duplicate-workshop' ? 'Atelier dupliqué : les questions sont reprises et les votes remis à zéro.' : action === 'delete-workshop' ? 'L’atelier a été supprimé.' : action === 'archive-workshop' ? 'L’atelier est rangé dans « Ateliers archivés ».' : 'L’atelier est restauré.'); return;
    }
    if (action === 'open-saved-workshop') {
      var saved = savedWorkshops.find(function (entry) { return entry.workshopId === target.dataset.id; });
      if (!saved) return;
      if (!switchWorkshop(JSON.parse(JSON.stringify(saved)))) { toast('Impossible d’enregistrer le changement d’atelier. Votre atelier actuel est conservé.'); return; }
      showWorkshopPreparation(); return;
    }
    if (action === 'quick-insert') {
      if (state.questions.length >= 50) { toast('Cet essai peut contenir jusqu’à 50 questions.'); return; }
      var kind = target.dataset.kind;
      var select = document.getElementById('quick-' + kind);
      var added = select ? quickQuestion(kind, select.value) : null;
      if (!added) { toast('Choisissez une proposition avant de l’ajouter.'); if (select) select.focus(); return; }
      if (kind === 'ice') { state.questions.unshift(added); state.current = state.questions.length === 1 ? 0 : state.current + 1; } else state.questions.push(added);
      save(); render(); toast(kind === 'ice' ? 'Le brise-glace a été ajouté en premier.' : kind === 'closing' ? 'La question de clôture a été ajoutée à la fin.' : 'Le défi et ses variantes par appareil ont été ajoutés.'); return;
    }
    if (action === 'save-conclusion') {
      var conclusion = document.getElementById('conclusion-text').value.trim();
      if (conclusion.length > 600) { toast('La conclusion est limitée à 600 caractères.'); return; }
      state.conclusion = conclusion; save(); document.getElementById('conclusion-status').textContent = '✓ Conclusion enregistrée pour la fin de l’atelier.'; toast('La conclusion est enregistrée.'); return;
    }
    if (action === 'tab') { openWorkshopTab(target.dataset.tab); return; }
    if (action === 'go-pilotage') { openWorkshopTab('control'); return; }
    if (action === 'go-live') { openWorkshopTab('live'); return; }
    if (action === 'close-dialog') { closeDialog(); return; }
    if (action === 'participant') { participant(); return; }
    if (action === 'projection') { if (!save()) { event.preventDefault(); toast('Impossible d’enregistrer l’atelier pour ouvrir la projection. Réessayez.'); } return; }
    if (action === 'projection-home') { projectionGallery = false; render(); return; }
    if (action === 'projection-close') { window.close(); return; }
    if (action === 'projection-fullscreen') {
      var full = document.fullscreenElement ? document.exitFullscreen && document.exitFullscreen() : document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (full && typeof full.catch === 'function') full.catch(function () { toast('Le navigateur n’a pas pu activer le plein écran.'); });
      return;
    }
    if (action === 'result-gallery') { galleryIndex = 0; projectionGallery = projectionOnly; resultGallery(); return; }
    if (action === 'gallery-prev' || action === 'gallery-next') { galleryIndex += action === 'gallery-next' ? 1 : -1; resultGallery(); return; }
    if (action === 'help') { help(); return; }
    if (action === 'open-workshop') { activeView = 'workshop'; activeTab = 'live'; render(); return; }
    if (action === 'open-library') { activeView = 'library'; render(); return; }
    if (action === 'go-prep') { activeView = 'workshop'; activeTab = 'prep'; render(); return; }
    if (action === 'select-question') { state.current = index; sessionSettings().welcome = false; sessionSettings().showAsks = false; sessionSettings().podium = false; save(); render(); revealCurrentQuestion(); return; }
    if (action === 'previous' || action === 'next') { navigateQuestion(action === 'next' ? 1 : -1); revealCurrentQuestion(); return; }
    if (action === 'projection-previous' || action === 'projection-next') { navigateQuestion(action === 'projection-next' ? 1 : -1); return; }
    if (action === 'projection-toggle-results') { if (q && !state.archived && q.responses > 0) { q.published = !q.published; save(); render(); toast(q.published ? 'Le graphe est maintenant visible dans la projection.' : 'Le graphe est masqué dans la projection.'); } return; }
    if (action === 'toggle-vote') { q.state = q.state === 'open' ? 'closed' : 'open'; save(); render(); toast(q.state === 'open' ? 'Le vote est ouvert. Vous pouvez simuler une réponse.' : 'Le vote est fermé.'); return; }
    if (action === 'toggle-results') { q.published = !q.published; save(); render(); toast(q.published ? 'Les résultats sont maintenant visibles dans les aperçus.' : 'Les résultats sont masqués aux participants et à la projection.'); return; }
    if (action === 'simulate') {
      var sampleTexts = ['Prendre le temps de vérifier', 'Ne pas agir dans l’urgence', 'Demander conseil en cas de doute', 'Passer par le site officiel'];
      var correct = correctIndices(q);
      var answer = isQuiz(q) && correct.length && Math.random() < 0.72 ? correct[0] : Math.floor(Math.random() * Math.max(q.options.length, 1));
      var choices;
      if (q.type === 'steps') choices = q.options.map(function (_, n) { return n; }).filter(function () { return Math.random() > 0.2; });
      else if (isMulti(q)) {
        choices = correct.length && Math.random() < 0.72 ? correct.slice() : [answer];
        if (choices.length === 1 && q.options.length > 1 && Math.random() > 0.45) {
          var extra = Math.floor(Math.random() * q.options.length);
          if (choices.indexOf(extra) === -1) choices.push(extra);
        }
      } else choices = [answer];
      if (!choices.length && q.type === 'steps') choices = [0];
      var sampleWords = ['Confiance', 'Pause', 'Curiosité', 'Vérifier', 'Prudence'];
      if (recordAnswer(q, choices, q.type === 'wordcloud' ? sampleWords[Math.floor(Math.random() * sampleWords.length)] : sampleTexts[Math.floor(Math.random() * sampleTexts.length)])) { render(); toast(q.responses === state.capacity ? '18 sur 18 : tout le groupe a répondu !' : 'Une nouvelle réponse fictive a été ajoutée.'); }
      return;
    }
    if (action === 'acknowledge-help') { state.helpCount = 0; sessionSettings().signals = { fast: 0, again: 0, help: 0 }; save(); render(); toast('Les signaux ont été pris en compte.'); return; }
    if (action === 'publish-question') { var ask = sessionSettings().asks.find(function (entry) { return entry.id === target.dataset.id; }) || sessionSettings().asks[0]; if (ask) { ask.published = !ask.published; state.anonymousPublished = sessionSettings().asks.some(function (a) { return a.published; }); save(); render(); } return; }
    if (action === 'add-question') { if (state.questions.length >= 50) { toast('Cet essai peut contenir jusqu’à 50 questions.'); return; } editQuestion(null); return; }
    if (action === 'edit-question') { editQuestion(index); return; }
    if (action === 'delete-question') {
      if (state.questions.length > 1 && confirm('Supprimer cette question et ses réponses fictives ?')) { var activeId = q.id; state.questions.splice(index, 1); state.current = Math.max(0, state.questions.findIndex(function (entry) { return entry.id === activeId; })); save(); render(); toast('La question a été supprimée de cet essai.'); } return;
    }
    if (action === 'move-up' || action === 'move-down') {
      var destination = index + (action === 'move-up' ? -1 : 1);
      if (destination >= 0 && destination < state.questions.length) { var selectedId = q.id; var moved = state.questions.splice(index, 1)[0]; state.questions.splice(destination, 0, moved); state.current = state.questions.findIndex(function (entry) { return entry.id === selectedId; }); save(); render(); toast('L’ordre des questions a été mis à jour.'); } return;
    }
    if (action === 'export-csv') { exportCSV(); return; }
    if (action === 'export-memo') { exportMemo(); return; }
    if (action === 'end-session') {
      if (state.ended || confirm('Terminer cet atelier de démonstration ? Les votes seront fermés.')) { state.ended = !state.ended; if (state.ended) state.questions.forEach(function (entry) { if (entry.state === 'open') entry.state = 'closed'; }); save(); render(); toast(state.ended ? 'L’atelier est terminé. Retrouvez ses résultats dans Bilan.' : 'L’atelier est rouvert. Vous pouvez ouvrir un vote.'); } return;
    }
    if (action === 'load-library') {
      if (confirm('Ouvrir cette séance de démonstration ? Votre atelier actuel sera conservé dans « Mes ateliers ».')) { if (!switchWorkshop(fixture(target.dataset.id))) { toast('Impossible d’enregistrer le changement. Votre atelier actuel est conservé.'); return; } showWorkshopPreparation(); toast('Votre séance d’essai est prête à personnaliser.'); } return;
    }
  });

  document.addEventListener('change', function (event) {
    if (event.target.id === 'edit-type') updateQuestionFields();
    if (event.target.id === 'participant-device') {
      var q = current(); var device = Number(event.target.value);
      if (!q.variants || !q.variants[device]) return;
      participantDevices[q.id] = device;
      document.querySelectorAll('.step-variant-detail[data-step]').forEach(function (node) { node.textContent = q.variants[device].steps[Number(node.dataset.step)] || ''; });
    }
  });
  document.addEventListener('submit', function (event) {
    if (event.target.id === 'anonymous-question-form') {
      event.preventDefault();
      if (addAnonymousQuestion(new FormData(event.target).get('text'))) { var field = document.getElementById('anonymous-question'); if (field) field.value = ''; render(); toast('Votre question a été envoyée à l’animateur pour relecture.'); }
      else toast('Les questions sont fermées ou le texte est invalide.');
      return;
    }
    if (event.target.id === 'workshop-form') {
      event.preventDefault();
      var creationForm = new FormData(event.target);
      var name = String(creationForm.get('title') || '').trim();
      if (!name || name.length > 120) { document.getElementById('workshop-error').textContent = 'Donnez un nom à l’atelier (120 caractères maximum).'; return; }
      if (creationForm.get('source') === 'json') {
        if (!preparationTools) { document.getElementById('workshop-error').textContent = 'L’outil JSON n’a pas pu être chargé. Rechargez la page pour réessayer.'; return; }
        creationDraft = newWorkshopState(name);
        preparationTools.open({ creating: true }); return;
      }
      if (!switchWorkshop(newWorkshopState(name))) { document.getElementById('workshop-error').textContent = 'Impossible d’enregistrer le nouvel atelier dans ce navigateur. Votre atelier actuel est conservé.'; return; }
      showWorkshopPreparation(); toast('Votre atelier est créé. Ajoutez votre première question.'); return;
    }
    if (event.target.id === 'participant-form') {
      event.preventDefault();
      var q = current();
      if (!q || (event.target.dataset && event.target.dataset.questionId && event.target.dataset.questionId !== q.id)) { refreshParticipant(); return; }
      var checked = Array.from(event.target.querySelectorAll('input[name="answer"]:checked')).map(function (input) { return Number(input.value); });
      var textField = event.target.querySelector('[name="text"]');
      var text = textField ? textField.value.trim() : '';
      if (isWritten(q) ? !text : !checked.length) { document.getElementById('participant-error').textContent = isWritten(q) ? 'Écrivez quelques mots avant d’envoyer.' : 'Choisissez au moins une réponse.'; return; }
      if (!recordAnswer(q, checked, text)) return;
      render();
      showDialog('Votre réponse est envoyée', '<div class="participant-success">' + ico('check-circle') + '<h3>Merci, c’est bien reçu !</h3><p>Votre réponse fictive est enregistrée. Laissez cet aperçu ouvert : il suivra automatiquement la prochaine question.</p><p class="muted">' + q.responses + ' personnes sur ' + state.capacity + ' ont répondu.</p></div>', button('close-dialog', 'Fermer l’aperçu', 'close', 'secondary'), 'participant');
      dialog.dataset.questionId = q.id; dialog.dataset.sent = 'true';
      return;
    }
    if (event.target.id === 'question-form') {
      event.preventDefault();
      var form = event.target;
      var formData = new FormData(form);
      var type = formData.get('type');
      var multi = type === 'mcq' && formData.get('multi') === 'on';
      var title = String(formData.get('title') || '').trim();
      var index = form.dataset.index === '' ? null : Number(form.dataset.index);
      var old = index === null ? null : state.questions[index];
      var options = isWritten({ type: type }) ? [] : type === 'yesno' ? ['Oui', 'Non'] : type === 'truefalse' ? ['Vrai', 'Faux'] : type === 'scale' ? (old && old.type === 'scale' ? old.options.slice() : ['1', '2', '3', '4', '5']) : String(formData.get('options') || '').split(/\r?\n/).map(function (line) { return line.trim(); }).filter(Boolean);
      var correctRaw = String(formData.get('correct') || '').trim();
      var correct = multi ? correctRaw.split(/[,;\s]+/).filter(Boolean).map(function (value) { return Number(value) - 1; }) : Number(correctRaw) - 1;
      var correctList = Array.isArray(correct) ? correct : [correct];
      var correctValid = correctList.length > 0 && correctList.every(function (value) { return Number.isInteger(value) && value >= 0 && value < options.length; }) && new Set(correctList).size === correctList.length;
      var error = supportedTypes.indexOf(type) === -1 ? 'Ce type de question n’est pas pris en charge.' : !title || title.length > 240 ? 'Écrivez l’intitulé de la question (240 caractères maximum).' : (!isWritten({ type: type }) && (options.length < (type === 'steps' ? 1 : 2) || options.length > 10)) ? 'Indiquez de 2 à 10 choix, un par ligne (une seule étape est possible).' : (isQuiz({ type: type }) && (!correctValid || (multi && correctList.length < 2))) ? (multi ? 'Indiquez au moins deux numéros de bonnes réponses, séparés par des virgules.' : 'Le numéro de la bonne réponse doit correspondre à un choix.') : (multi && type !== 'mcq') ? 'Les réponses multiples sont réservées aux QCM.' : '';
      if (error) { document.getElementById('question-error').textContent = error; return; }
      if (index == null && state.questions.length >= 50) { document.getElementById('question-error').textContent = 'Cet essai peut contenir jusqu’à 50 questions.'; return; }
      var entry = Object.assign({}, old || {}, { id: old ? old.id : makeId(), type: type, title: title, description: String(formData.get('description') || '').trim(), options: options, counts: options.map(function () { return 0; }), responses: 0, texts: [], state: 'draft', published: false });
      delete entry.correct; delete entry.explanation;
      delete entry.multi;
      if (isQuiz(entry)) entry.correct = multi ? correctList : correct;
      if (type === 'mcq' && multi) entry.multi = true;
      var explanationValue = formData.get('explanation');
      entry.explanation = String(explanationValue === null && old ? old.explanation || '' : explanationValue || '').trim();
      if (type !== 'steps' || !old || old.type !== 'steps' || old.options.length !== options.length) entry.variants = [];
      if (index == null) state.questions.push(entry); else state.questions[index] = entry;
      var returnTo = closeDialog(false); save(); render(); restoreFocus(returnTo); toast(index == null ? 'Votre question a été ajoutée.' : 'Votre question a été enregistrée.');
    }
  });
  document.addEventListener('keydown', function (event) {
    if (event.target.getAttribute('role') !== 'tab') return;
    var order = state.archived ? ['recap'] : workshopTabs.map(function (tab) { return tab[0]; });
    var offset = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!offset && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    activeTab = event.key === 'Home' ? 'prep' : event.key === 'End' ? 'recap' : order[(order.indexOf(activeTab) + offset + order.length) % order.length];
    render(); document.getElementById('tab-' + activeTab).focus();
  });
  document.addEventListener('fullscreenchange', function () { if (projectionOnly) render(); });
  if (typeof window.addEventListener === 'function') window.addEventListener('storage', function (event) {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      var incoming = JSON.parse(event.newValue);
      if (!validState(incoming)) return;
      state = incoming;
      savedWorkshops = readSavedWorkshops();
      render();
    } catch (error) { /* Ignore incomplete data from another browser tab. */ }
  });

  if (window.WLPreparation) preparationTools = window.WLPreparation.create({
    getState: function () { return creationDraft || state; },
    save: function () {
      if (!creationDraft) return save();
      if (!switchWorkshop(creationDraft)) return false;
      creationDraft = null; return true;
    },
    render: showWorkshopPreparation,
    showDialog: function (title, body, actions, kind) { showDialog(title, body, actions, kind); return dialog; },
    closeDialog: closeDialog, toast: toast, esc: esc, icon: ico, button: button, makeId: makeId
  });
  render();
}());
