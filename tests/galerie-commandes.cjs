// Contrôle les commandes et les données de la galerie dans un DOM minimal.
// Ce test ne mesure ni la mise en page ni le rendu des graphiques.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const elements = new Map();
const windowEvents = {}, documentEvents = {};
const renders = [];
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, value: id === 'g-mode' ? 'screen-dark' : '', textContent: '', className: '', children: [], disabled: false,
    events: {}, addEventListener(name, fn) { this.events[name] = fn; },
    appendChild(node) { this.children.push(node); if (!this.value && node.value) this.value = node.value; },
    setAttribute() {}, closest() { return null; }
  });
  return elements.get(id);
}
let hash = '';
const location = {};
Object.defineProperty(location, 'hash', {
  get: () => hash,
  set(value) { hash = '#' + String(value).replace(/^#/, ''); if (windowEvents.hashchange) windowEvents.hashchange(); }
});
const context = {
  location,
  document: { documentElement: { setAttribute() {} }, addEventListener(name, fn) { documentEvents[name] = fn; } },
  window: { addEventListener(name, fn) { windowEvents[name] = fn; } },
  WL: {
    $: element, el: (tag, attrs, text) => ({ value: attrs.value, textContent: text }),
    clear(node) { node.children = []; return node; },
    typeLabel: q => q.type,
    renderResults(out, q, res) { renders.push(JSON.parse(JSON.stringify({ kind: 'result', q, res }))); },
    counter(out, id, label) { renders.push({ kind: 'counter', id, label }); },
    fitResults() {}
  }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../docs/galerie-resultats/galerie.js'), 'utf8'), context);
const last = () => renders[renders.length - 1];
let count = 0;
function test(label, run) { run(); count++; console.log('OK ' + label); }
test('Le premier écran contient des réponses et un anneau à 8 / 4', () => {
  assert.equal(last().q.type, 'yesno'); assert.equal(last().res.total, 12);
  assert.deepEqual(last().res.counts, [8, 4]); assert(!('correct' in last().q));
  assert.equal(element('g-position').textContent, '1 / 12'); assert.equal(element('g-previous').disabled, true);
});
test('Suivant et Précédent parcourent les formes', () => {
  element('g-next').events.click(); assert.equal(last().q.type, 'poll');
  element('g-previous').events.click(); assert.equal(last().q.type, 'yesno');
});
test('Les touches des listes de choix restent disponibles', () => {
  const before = hash;
  documentEvents.keydown({ key: 'ArrowRight', target: { closest: () => ({}) }, preventDefault() { throw new Error('Touche de liste interceptée'); } });
  assert.equal(hash, before);
});
test('Une flèche sur la page passe à la forme suivante', () => {
  let prevented = false;
  documentEvents.keydown({ key: 'ArrowRight', target: element('g-body'), preventDefault() { prevented = true; } });
  assert(prevented); assert.equal(last().q.type, 'poll');
});
test('La galerie distingue résultats, absence de réponse et compteur masqué', () => {
  location.hash = 'type=postit&etat=reponses&mode=screen-dark';
  assert.equal(last().res.posts.length, 5);
  location.hash = 'type=postit&etat=vide&mode=screen-dark'; assert.equal(last().res.total, 0);
  location.hash = 'type=postit&etat=masque&mode=screen-dark'; assert.equal(last().kind, 'counter');
});
test('Le QCM multiple conserve le nombre de répondants', () => {
  location.hash = 'type=mcqm&etat=corrige&mode=participant';
  assert.equal(last().res.total, 12); assert.equal(last().res.counts[2], 11);
  assert.deepEqual(last().q.correct, [0, 2]); assert.equal(element('g-mode').value, 'participant');
});
test('Les douze formes ont des données et le dernier bouton est désactivé', () => {
  const forms = element('g-type').children.map(node => node.value);
  assert.equal(forms.length, 12);
  for (const type of forms) {
    location.hash = 'type=' + type + '&etat=reponses&mode=screen-light';
    assert.equal(last().kind, 'result'); assert(last().res.total > 0);
  }
  assert.equal(element('g-next').disabled, true);
});
test('Un lien incomplet ou invalide revient à un aperçu utilisable', () => {
  location.hash = 'type=inconnu&etat=inconnu&mode=inconnu';
  assert.equal(last().q.type, 'yesno'); assert.equal(last().res.total, 12);
  assert.equal(element('g-mode').value, 'screen-dark'); assert.equal(element('g-state').value, 'reponses');
  location.hash = 'type=%&etat=%&mode=%';
  assert.equal(last().q.type, 'yesno'); assert.equal(last().res.total, 12);
});
test('Le classement par points ne propose pas de bonne réponse', () => {
  location.hash = 'type=points&etat=reponses&mode=screen-dark';
  assert.equal(element('g-state').children.some(option => option.value === 'corrige'), false);
  assert.match(element('g-note').textContent, /priorités du groupe/);
  location.hash = 'type=points&etat=corrige&mode=screen-dark';
  assert.equal(element('g-state').value, 'reponses');
  assert.deepEqual(last().res.counts, [18, 52, 31, 19]);
  assert(!('correct' in last().q));
});
test('Les formes sans correction gardent leurs résultats et leurs états utiles', () => {
  for (const type of ['poll', 'scale', 'wordcloud', 'text', 'steps', 'points', 'wall', 'postit', 'dots']) {
    location.hash = 'type=' + type + '&etat=corrige&mode=screen-light';
    assert.deepEqual(element('g-state').children.map(option => option.value), ['vide', 'reponses', 'masque']);
    assert.equal(element('g-state').value, 'reponses');
    assert(last().res.total > 0); assert(!('correct' in last().q));
  }
});
test('Un quiz révèle sa correction après une forme qui en est dépourvue', () => {
  for (const type of ['yesno', 'mcq', 'mcqm']) {
    location.hash = 'type=points&etat=reponses&mode=screen-dark';
    location.hash = 'type=' + type + '&etat=corrige&mode=screen-dark';
    assert.equal(element('g-state').value, 'corrige');
    assert(last().q.correct.length > 0);
    assert(element('g-state').children.some(option => option.value === 'corrige'));
    assert.match(element('g-note').textContent, /coche/);
    const corrected = last().res;
    location.hash = 'type=' + type + '&etat=reponses&mode=screen-dark';
    assert(!('correct' in last().q)); assert.deepEqual(last().res, corrected);
  }
});
console.log('Galerie : ' + count + ' scénarios de commandes validés, sans navigateur.');
