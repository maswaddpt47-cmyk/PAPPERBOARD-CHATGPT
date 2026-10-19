'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');
const html = fs.readFileSync(path.join(__dirname, '../../simulation.html'));
const sizes = [[1920, 1080], [1280, 720], [1024, 768], [390, 844]];
let checks = 0;
function check(condition, message) { checks++; assert(condition, message); }
async function settle(page) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}
async function fits(page, label) {
  await settle(page);
  const measured = await page.evaluate(() => {
    const viewport = document.querySelector('.projection-fit-viewport');
    const canvas = document.querySelector('.projection-fit-canvas');
    const area = viewport.getBoundingClientRect();
    const outside = [...canvas.querySelectorAll('h3, p, .answer-row, .cloud-word, .gallery-stage')].filter(node => {
      const r = node.getBoundingClientRect();
      return r.width && r.height && (r.top < area.top - 1 || r.bottom > area.bottom + 1 || r.left < area.left - 1 || r.right > area.right + 1);
    }).map(node => ({tag: node.className || node.tagName, text: node.textContent.slice(0, 45), bottom: node.getBoundingClientRect().bottom}));
    const response = canvas.querySelector('.answer-text');
    return { outside, height: area.height, bottom: area.bottom, scale: Number(canvas.dataset.fitScale),
      overflow: getComputedStyle(viewport).overflowY,
      horizontal: document.documentElement.scrollWidth - innerWidth,
      vertical: document.documentElement.scrollHeight - innerHeight,
      font: response ? parseFloat(getComputedStyle(response).fontSize) * Number(canvas.dataset.fitScale) : null };
  });
  check(measured.height > 0 && measured.scale > 0 && measured.scale <= 1, label + ': zone invalide ' + JSON.stringify(measured));
  check(!measured.outside.length, label + ': contenu coupe ' + JSON.stringify(measured));
  check(measured.overflow === 'hidden' && measured.horizontal <= 1 && measured.vertical <= 1, label + ': defilement ' + JSON.stringify(measured));
  return measured;
}
(async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
    res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch(process.env.WOOCLIGHT_BROWSER ? {executablePath: process.env.WOOCLIGHT_BROWSER} : {});
    const context = await browser.newContext();
    context.setDefaultTimeout(10000);
    const animateur = await context.newPage();
    const projection = await context.newPage();
    const errors = [];
    for (const page of [animateur, projection]) page.on('pageerror', error => errors.push(error.message));
    const url = 'http://127.0.0.1:' + server.address().port + '/simulation.html';
    await animateur.goto(url);
    await animateur.locator('[data-action="tab"][data-tab="live"]').click();
    await animateur.locator('[data-action="toggle-vote"]').click();
    const initial = await animateur.evaluate(() => JSON.parse(localStorage.getItem('wl_sandbox_v3')));
    await projection.goto(url + '?projection=1');
    const cases = initial.questions.map(q => JSON.parse(JSON.stringify(q)));
    const wordcloud = {...cases[5], type: 'wordcloud', title: 'Quels mots retenez-vous ?', responses: 8, texts: ['Prudence', 'Vérifier', 'Prudence', 'Calme', 'Adresse officielle', 'Conseil', 'Entraide', 'Vérifier']};
    const truefalse = {...cases[6], type: 'truefalse', options: ['Vrai', 'Faux']};
    const scale10 = {...cases[2], options: Array.from({length: 10}, (_, i) => String(i + 1)), counts: [0, 0, 0, 1, 2, 3, 3, 2, 2, 1], responses: 14};
    const manyChoices = {...cases[3], options: Array.from({length: 10}, (_, i) => 'Choix ' + (i + 1) + ' : je prends le temps de vérifier l’adresse du service et de demander conseil avant de suivre les instructions reçues.'), counts: [2, 2, 2, 2, 1, 1, 1, 1, 1, 1], responses: 14};
    const manyTexts = {...cases[5], responses: 18, texts: Array.from({length: 18}, (_, i) => 'Réponse ' + (i + 1) + ' : prendre le temps de vérifier les informations, retrouver le site officiel et demander conseil quand le message paraît inhabituel.')};
    cases.push(wordcloud, truefalse, scale10, manyChoices, manyTexts);
    async function present(question, published) {
      const state = {...initial, participants: 18, current: 0, questions: [{...question, id: 'fit-case', published}], ended: false};
      state.session = {...initial.session, welcome: false, showAsks: false, podium: false, showQr: true};
      await animateur.evaluate(state => localStorage.setItem('wl_sandbox_v3', JSON.stringify(state)), state);
      await settle(projection);
      check(await projection.locator('.projection-preview > h3').textContent() === question.title, 'La question projetee n’a pas ete actualisee : ' + question.type);
    }
    for (const [width, height] of sizes) {
      await projection.setViewportSize({width, height});
      for (const [index, question] of cases.entries()) for (const published of [false, true]) {
        await present(question, published);
        const label = width + 'x' + height + ' ' + question.type + ' ' + index + ' publie=' + published;
        const m = await fits(projection, label);
        if (width >= 1024 && index < initial.questions.length && m.font) check(m.font >= 14, label + ': texte trop petit ' + m.font);
      }
      await projection.locator('[data-action="result-gallery"]').click();
      for (let index = 0; index < 12; index++) {
        await fits(projection, width + 'x' + height + ' galerie ' + index);
        if (index < 11) await projection.locator('[data-action="gallery-next"]').click();
      }
      await projection.locator('[data-action="projection-home"]').click();
    }
    await projection.setViewportSize({width: 1280, height: 720});
    await present(cases[3], true);
    const firstScale = (await fits(projection, 'avant mises a jour')).scale;
    for (let index = 0; index < 4; index++) await present(cases[3], true);
    check((await fits(projection, 'apres mises a jour')).scale === firstScale, 'Les mises a jour reduisent cumulativement le contenu');
    await projection.setViewportSize({width: 1920, height: 1080});
    await fits(projection, 'redimensionnement sans rechargement');
    await projection.getByRole('button', {name: 'Plein écran', exact: true}).click();
    await projection.waitForFunction(() => !!document.fullscreenElement);
    await fits(projection, 'plein ecran');
    await projection.getByRole('button', {name: 'Quitter le plein écran', exact: true}).click();
    await projection.waitForFunction(() => !document.fullscreenElement);
    await fits(projection, 'retour du plein ecran');
    for (const [width, height] of [[1280, 720], [390, 844]]) {
      await projection.setViewportSize({width, height});
      const trigger = projection.getByRole('button', {name: 'Agrandir le QR code de l’atelier'});
      const small = await trigger.locator('img').boundingBox();
      await trigger.click();
      const dialog = projection.getByRole('dialog');
      check(await dialog.isVisible(), 'Le QR ne s’ouvre pas');
      const large = await dialog.locator('img').boundingBox();
      check(large.width > small.width * 3 && large.width <= width, 'QR insuffisamment agrandi');
      check(await dialog.locator('[data-action="zoom-qr"]').count() === 0, 'Le QR agrandi contient un bouton imbrique');
      await projection.keyboard.press('Escape');
      check(await dialog.count() === 0, 'Echap ne ferme pas le QR');
      check(await trigger.evaluate(node => node === document.activeElement), 'Le focus ne revient pas au QR');
      await trigger.click();
      await dialog.getByRole('button', {name: 'Fermer le QR code', exact: true}).click();
      check(await dialog.count() === 0, 'Le bouton ne ferme pas le QR');
    }
    await projection.setViewportSize({width: 1280, height: 720});
    await projection.getByRole('button', {name: 'Agrandir le QR code de l’atelier'}).click();
    await animateur.locator('[data-action="tab"][data-tab="control"]').click();
    await animateur.locator('[data-action="toggle-qr"]').click();
    await settle(projection);
    check(await projection.getByRole('dialog').count() === 0, 'Masquer le QR laisse sa fenetre ouverte');
    check(await projection.locator('.projection-invitation').count() === 0, 'Le QR masque reste dans la projection');
    await animateur.locator('[data-action="zoom-qr"]').click();
    check(await animateur.getByRole('dialog').isVisible(), 'Le QR de Pilotage ne peut plus etre agrandi');
    await animateur.keyboard.press('Escape');
    check(errors.length === 0, 'Erreurs JavaScript : ' + errors.join(' | '));
    console.log('Simulation navigateur : ' + checks + ' controles reussis ; ' + cases.length + ' jeux de questions, 12 formes, 4 tailles, QR et fermeture clavier.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
