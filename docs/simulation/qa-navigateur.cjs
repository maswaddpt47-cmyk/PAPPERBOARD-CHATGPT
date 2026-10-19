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
    await present(manyChoices, true);
    const firstScale = (await fits(projection, 'avant mises a jour')).scale;
    check(firstScale < 1, 'Le cas de regression doit necessiter une reduction');
    for (let index = 1; index <= 4; index++) {
      const counts = [...manyChoices.counts]; counts[0] += index;
      await present({...manyChoices, counts, responses: manyChoices.responses + index}, true);
    }
    const updatedScale = (await fits(projection, 'apres mises a jour')).scale;
    await projection.reload();
    check(Math.abs((await fits(projection, 'rechargement apres mises a jour')).scale - updatedScale) < 0.000001, 'Les mises a jour reduisent cumulativement le contenu');
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
    const beforeCreation = await animateur.evaluate(() => localStorage.getItem('wl_sandbox_v3'));
    await animateur.locator('[data-action="create-workshop"]').first().click();
    await animateur.getByLabel('Nom de l’atelier').fill('Atelier des niveaux');
    await animateur.locator('input[name="source"][value="json"]').check();
    await animateur.getByRole('button', {name: 'Continuer', exact: true}).click();
    const levelSelect = animateur.getByLabel('Niveau du public', {exact: true});
    check(await levelSelect.inputValue() === 'mixed', 'Le niveau par defaut est incorrect');
    check(await levelSelect.locator('option').count() === 5, 'Le menu doit proposer cinq niveaux');
    await animateur.getByLabel('Public', {exact: true}).selectOption('seniors');
    for (const [level, label] of Object.entries({mixed: 'Groupe hétérogène', discovery: 'Découverte', beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé'})) {
      await levelSelect.selectOption(level);
      await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
      const prompt = await animateur.locator('#prep-prompt-output').inputValue();
      check(prompt.includes('Niveau du public : ' + label + '.'), 'Le niveau choisi n’est pas copie : ' + level);
      check(prompt.includes('Public : seniors.'), 'Le niveau remplace le type de public');
    }
    await levelSelect.selectOption('mixed');
    await animateur.locator('#prep-by-duration').check();
    check(await animateur.locator('#prep-duration').isVisible() && !await animateur.locator('#prep-count').isVisible(), 'Le choix de duree ne bascule pas les champs');
    await animateur.locator('#prep-duration').fill('45');
    check((await animateur.locator('#prep-planning-summary').textContent()).includes('Estimation : 8 questions'), 'Le budget de 45 minutes est incorrect');
    await levelSelect.selectOption('discovery');
    check((await animateur.locator('#prep-planning-summary').textContent()).includes('Estimation : 7 questions'), 'Le niveau Decouverte ne change pas le budget');
    await levelSelect.selectOption('mixed');
    await animateur.locator('#prep-challenge').check();
    check((await animateur.locator('#prep-planning-summary').textContent()).includes('Estimation : 6 questions + 1 défi'), 'Le defi ne reserve pas son temps');
    await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
    let prompt = await animateur.locator('#prep-prompt-output').inputValue();
    check(prompt.includes('Durée totale de l’atelier : 45 minutes.') && prompt.includes('exactement 6 questions'), 'La duree n’est pas transmise a l’IA');
    await animateur.locator('#prep-duration').fill('15');
    await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
    check((await animateur.locator('#prep-prompt-status').textContent()).includes('au moins 24 minutes'), 'La duree trop courte est acceptee');
    check(await animateur.locator('#prep-prompt-output').isHidden(), 'Une ancienne consigne reste affichable apres une duree invalide');
    await animateur.locator('#prep-challenge').uncheck();
    await levelSelect.selectOption('intermediate');
    await animateur.locator('#prep-duration').fill('180');
    check((await animateur.locator('#prep-planning-summary').textContent()).includes('30 questions maximum'), 'La limite de generation n’est pas expliquee');
    await animateur.locator('#prep-by-count').check();
    check(await animateur.locator('#prep-count').inputValue() === '8', 'Le retour au nombre perd le choix manuel');
    check(await animateur.locator('#prep-count').isVisible() && !await animateur.locator('#prep-duration').isVisible(), 'Le choix du nombre ne bascule pas les champs');
    await animateur.locator('#prep-count').fill('12');
    await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
    prompt = await animateur.locator('#prep-prompt-output').inputValue();
    check(prompt.includes('exactement 12 questions') && !prompt.includes('Durée totale de l’atelier'), 'Le mode nombre reprend la duree precedente');
    const audience = animateur.getByLabel('Public', {exact: true});
    const customAudience = animateur.getByLabel('Précisez le public', {exact: true});
    check(await customAudience.isHidden() && await customAudience.isDisabled(), 'Le champ Autres apparait avant sa selection');
    await audience.selectOption('other');
    check(await customAudience.isVisible() && await customAudience.isEnabled(), 'Autres n’ouvre pas le champ libre');
    check(await customAudience.evaluate(node => node === document.activeElement), 'Le champ libre ne recoit pas le focus');
    await customAudience.fill('   ');
    await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
    check((await animateur.locator('#prep-prompt-status').textContent()).includes('Précisez le public'), 'Un public libre vide est accepte');
    check(await animateur.locator('#prep-prompt-output').isHidden(), 'Une ancienne consigne reste disponible avec Autres vide');
    await customAudience.fill('  Parents et bénévoles  ');
    await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
    prompt = await animateur.locator('#prep-prompt-output').inputValue();
    check(prompt.includes('Public : Parents et bénévoles.'), 'Le public libre n’est pas copie dans la consigne');
    check(prompt.includes('Niveau du public : Intermédiaire.') && prompt.includes('exactement 12 questions'), 'Le public libre modifie les autres reglages');
    await audience.selectOption('seniors');
    check(await customAudience.isHidden() && await customAudience.isDisabled(), 'Un public standard laisse le champ libre ouvert');
    await animateur.getByRole('button', {name: 'Copier la consigne pour l’IA', exact: true}).click();
    prompt = await animateur.locator('#prep-prompt-output').inputValue();
    check(prompt.includes('Public : seniors.') && !prompt.includes('Parents et bénévoles'), 'Le public standard reprend le texte cache');
    await audience.selectOption('other');
    check(await customAudience.inputValue() === '  Parents et bénévoles  ', 'Le retour a Autres perd le texte saisi');
    await animateur.getByRole('button', {name: 'Annuler la création', exact: true}).click();
    check(await animateur.evaluate(() => localStorage.getItem('wl_sandbox_v3')) === beforeCreation, 'La preparation de consigne modifie l’atelier actif');
    await animateur.locator('[data-action="tab"][data-tab="control"]').click();
    const beforeEnd = await animateur.evaluate(() => JSON.parse(localStorage.getItem('wl_sandbox_v3')));
    for (const [width, height] of [[1280, 720], [390, 844]]) {
      await animateur.setViewportSize({width, height});
      const end = animateur.getByRole('button', {name: 'Terminer la session', exact: true});
      check(await end.isVisible(), 'Terminer la session manque dans Pilotage');
      animateur.once('dialog', dialog => dialog.dismiss());
      await end.click();
      check(await animateur.evaluate(() => !JSON.parse(localStorage.getItem('wl_sandbox_v3')).ended), 'Annuler termine quand meme la session');
      animateur.once('dialog', dialog => dialog.accept());
      await end.click();
      await projection.locator('.projection-ending').waitFor();
      const closed = await animateur.evaluate(() => JSON.parse(localStorage.getItem('wl_sandbox_v3')));
      check(closed.ended && closed.questions.every(q => q.state !== 'open'), 'Terminer ne ferme pas les votes');
      check(JSON.stringify(closed.questions.map(q => q.counts)) === JSON.stringify(beforeEnd.questions.map(q => q.counts)), 'Terminer perd des reponses');
      await animateur.getByRole('button', {name: 'Rouvrir la session', exact: true}).click();
      check(await animateur.evaluate(() => !JSON.parse(localStorage.getItem('wl_sandbox_v3')).ended), 'Rouvrir ne remet pas la session en cours');
      await animateur.locator('[data-nav="history"]').evaluate(node => node.click());
      const currentRow = animateur.locator('.workshop-row').filter({hasText: 'Atelier actuel'});
      await currentRow.getByRole('button', {name: 'Renommer', exact: true}).click();
      const rename = animateur.getByRole('dialog');
      const title = rename.getByLabel('Nom de l’atelier', {exact: true});
      check(await title.inputValue() === beforeEnd.title, 'Le nom actuel n’est pas prerempli');
      await title.fill('Nom annule');
      await rename.getByRole('button', {name: 'Annuler', exact: true}).click();
      check(await currentRow.locator('h3').textContent() === beforeEnd.title, 'Annuler change le nom');
      await currentRow.getByRole('button', {name: 'Renommer', exact: true}).click();
      await title.fill('   ');
      await rename.getByRole('button', {name: 'Enregistrer le nom', exact: true}).click();
      check((await rename.getByRole('alert').textContent()).includes('120 caractères'), 'Un nom vide est accepte');
      const newTitle = 'Atelier renomme ' + width;
      await title.fill(newTitle);
      await rename.getByRole('button', {name: 'Enregistrer le nom', exact: true}).click();
      check(await currentRow.locator('h3').textContent() === newTitle, 'Le nouveau nom n’apparait pas dans Mes ateliers');
      check(await animateur.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'Les actions de Mes ateliers depassent de l’ecran');
      await projection.locator('.projection-meta span').first().filter({hasText: newTitle}).waitFor();
      await animateur.reload();
      check(await animateur.locator('.page-title').textContent() === newTitle, 'Le nom est perdu au rechargement');
      await animateur.locator('[data-action="tab"][data-tab="control"]').click();
      await animateur.locator('[data-nav="history"]').evaluate(node => node.click());
      await animateur.locator('.workshop-row').filter({hasText: 'Atelier actuel'}).getByRole('button', {name: 'Renommer', exact: true}).click();
      await title.fill(beforeEnd.title);
      await rename.getByRole('button', {name: 'Enregistrer le nom', exact: true}).click();
      await animateur.locator('[data-nav="workshop"]').evaluate(node => node.click());
      await animateur.locator('[data-action="tab"][data-tab="control"]').click();
    }
    check(errors.length === 0, 'Erreurs JavaScript : ' + errors.join(' | '));
    console.log('Simulation navigateur : ' + checks + ' controles reussis ; ' + cases.length + ' jeux de questions, 12 formes, 4 tailles, QR, fermeture clavier, 5 niveaux et modes nombre/duree dans la consigne.');
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
