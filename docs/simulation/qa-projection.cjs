'use strict';
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const source = fs.readFileSync(__dirname + '/app.js', 'utf8').replace(/\}\(\)\);\s*$/, 'globalThis.app={state:()=>state};}());');
const memory = new Map(), tabs = [];
function tab(projection, options = {}) {
  const nodes = new Map(), events = {}, browserEvents = {};
  let dialogs = 0, document, lastDialog;
  function node(id = '') {
    const classes = new Set();
    return { id, dataset: {}, innerHTML: '', textContent: '', isConnected: true, disabled: false,
      classList: { add: k => classes.add(k), remove: k => classes.delete(k), contains: k => classes.has(k), toggle() {} },
      setAttribute() {}, removeAttribute() {}, getAttribute() { return null; }, addEventListener() {},
      focus() { document.activeElement = this; }, querySelector() { return null; }, querySelectorAll() { return []; },
      appendChild() {}, remove() {}, showModal() {}, close() {}, scrollIntoView() {}, closest() { return null; }
    };
  }
  document = { activeElement: null, body: node(), documentElement: node(),
    getElementById(id) { if (!nodes.has(id)) nodes.set(id, node(id)); return nodes.get(id); },
    querySelectorAll() { return []; }, querySelector() { return null; },
    createElement(tag) { const created=node(); if (tag === 'dialog') { dialogs++; lastDialog=created; } return created; },
    addEventListener(k, fn) { (events[k] ||= []).push(fn); }
  };
  const search = options.join ? '?join=DEMO&workshop=' + options.join : '?v=qa' + (projection ? '&projection=1' : '');
  const window = { document, icon: () => '', close() {},
    location: { search, pathname: '/PAPPERBOARD-CHATGPT/simulation.html' },
    addEventListener(k, fn) { (browserEvents[k] ||= []).push(fn); }
  };
  let instance;
  const localStorage = { getItem: k => memory.get(k) || null, setItem(k, v) {
    const oldValue = memory.get(k) || null; memory.set(k, v);
    for (const other of tabs) if (other !== instance) other.storage({key:k, oldValue, newValue:v});
  }};
  const context = { document, window, localStorage, URLSearchParams, console, setTimeout: () => 1, clearTimeout() {}, confirm: () => true };
  vm.createContext(context); vm.runInContext(source, context);
  instance = { state: context.app.state, html: () => document.getElementById('workspace').innerHTML,
    dialog: () => lastDialog,
    dialogs: () => dialogs, projectionClass: () => document.body.classList.contains('projection-mode'),
    storage(event) { (browserEvents.storage || []).forEach(fn => fn(event)); },
    action(action, extra = {}) {
      const target = node(); target.dataset = {action, ...extra};
      target.closest = selector => selector === '[data-action]' ? target : null;
      (events.click || []).forEach(fn => fn({target, preventDefault() {}}));
    }
  };
  tabs.push(instance); return instance;
}
const animateur = tab(false);
animateur.action('projection');
const projection = tab(true);
let tests = 0;
function test(label, run) { run(); tests++; console.log('OK ' + label); }
test('Le lien de projection utilise target blank et conserve la version de la simulation', () => {
  assert.match(animateur.html(), /href="[^\"]*v=qa&amp;projection=1" target="_blank" rel="noopener"/);
  assert.equal(animateur.dialogs(), 0);
});
test('Le nouvel onglet rend la projection directement, avec les commandes au-dessus du contenu', () => {
  assert(projection.projectionClass()); assert.equal(projection.dialogs(), 0);
  assert(projection.html().includes('projection-screen'));
  assert(projection.html().indexOf('projection-navigation') < projection.html().indexOf('projection-preview'));
});
test('Changer de question dans l’animateur actualise l’onglet de projection', () => {
  animateur.action('next');
  assert.equal(projection.state().current, animateur.state().current);
  assert(projection.html().includes(animateur.state().questions[animateur.state().current].title));
});
test('Les votes et la publication des résultats se synchronisent entre les onglets', () => {
  assert.equal(animateur.state().questions[animateur.state().current].state, 'open'); animateur.action('simulate');
  assert.equal(projection.state().questions[projection.state().current].responses, 1);
  assert(projection.html().includes('Résultats masqués'));
  animateur.action('toggle-results');
  assert(projection.state().questions[projection.state().current].published);
  assert(projection.html().includes('answer-chart'));
});
test('Les commandes de la projection synchronisent aussi l’écran animateur', () => {
  projection.action('projection-previous');
  assert.equal(animateur.state().current, projection.state().current);
  projection.action('projection-toggle-results');
  assert.equal(animateur.state().questions[animateur.state().current].published, true);
});
test('La galerie reste dans l’onglet de projection et revient à la question sans modale', () => {
  projection.action('result-gallery'); projection.action('gallery-next');
  assert(projection.html().includes('Résultat 2 / 12')); assert.equal(projection.dialogs(), 0);
  projection.action('projection-home'); assert(projection.html().includes('projection-preview'));
});
test('Archiver puis restaurer l’atelier actualise la projection sans rechargement', () => {
  const id = animateur.state().workshopId;
  animateur.action('archive-workshop', {id}); assert(projection.html().includes('Cet atelier est archivé'));
  animateur.action('restore-workshop', {id}); assert(projection.html().includes('projection-preview'));
});
test('L’aperçu participant suit la question et les résultats pilotés par la projection', () => {
  animateur.action('participant');
  projection.action('projection-next');
  assert.equal(animateur.dialog().dataset.questionId, projection.state().questions[projection.state().current].id);
  assert(animateur.dialog().innerHTML.includes(projection.state().questions[projection.state().current].title));
  projection.action('projection-toggle-results');
  assert.equal(animateur.dialog().innerHTML.includes('participant-results'), projection.state().questions[projection.state().current].published);
});
test('Le QR et l’ouverture des inscriptions se synchronisent avec la projection', () => {
  animateur.action('toggle-qr');assert(!projection.html().includes('projection-invitation'));
  animateur.action('toggle-qr');assert(projection.html().includes('projection-invitation'));
  animateur.action('toggle-registrations');assert.equal(projection.state().session.registrationsOpen,false);
});
test('L’invitation locale respecte les inscriptions et synchronise le nombre d’inscrits', () => {
  const invitation = tab(false, {join:animateur.state().workshopId});
  const before = animateur.state().participants;
  invitation.action('join-session');assert.equal(animateur.state().participants,before);
  animateur.action('toggle-registrations');invitation.action('join-session');
  assert.equal(animateur.state().participants,before+1);assert.equal(projection.state().participants,before+1);
  assert(invitation.html().includes('Votre inscription fictive est enregistrée'));
});
test('Une invitation absente de ce navigateur affiche la limite de simulation', () => {
  const invitation = tab(false, {join:'atelier-absent'});
  assert(invitation.html().includes('Cet appareil ne peut pas s’y connecter sans serveur de session'));
});
test('Les pseudonymes suivent les inscriptions entre onglets et après rechargement', () => {
  function names(browser) {
    const list=browser.html().match(/<ol class="participant-roster-list">([\s\S]*?)<\/ol>/);
    return list?[...list[1].matchAll(/<li>([^<]+)<\/li>/g)].map(match=>match[1]):[];
  }
  animateur.action('tab',{tab:'control'});animateur.action('toggle-pseudos');
  const before=names(animateur);assert.equal(before.length,animateur.state().participants);assert(before.length>3);
  const invitation=tab(false,{join:animateur.state().workshopId});invitation.action('join-session');
  const after=names(animateur);assert.equal(after.length,before.length+1);assert.deepEqual(after.slice(0,-1),before);
  const reloaded=tab(false);reloaded.action('tab',{tab:'control'});assert.deepEqual(names(reloaded),after);
  animateur.action('toggle-podium');assert(projection.html().includes('Podium de démonstration'));
  assert.equal((projection.html().match(/<li>/g)||[]).length,3);assert.equal(names(animateur).length,after.length);
});
console.log(tests + ' scénarios de projection et de synchronisation validés. Contrôle logique, sans navigateur.');
