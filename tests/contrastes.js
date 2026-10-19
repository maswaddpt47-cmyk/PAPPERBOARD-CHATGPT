// Vérifie les vrais couples de couleurs des graphiques, y compris les pistes SVG
// et PowerPoint : le contraste sur le fond de la page seul ne suffit pas.
'use strict';
const fs = require('fs');
const path = require('path');
const assert = require('assert/strict');
const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'assets/style.css'), 'utf8');
const pptx = fs.readFileSync(path.join(root, 'assets/bilan-pptx.js'), 'utf8');
function tokens(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const block = css.match(new RegExp(escaped + '\\s*\\{([^}]+)\\}'));
  assert(block, 'Bloc de thème manquant : ' + selector);
  return Object.fromEntries(Array.from(block[1].matchAll(/(--wl-[a-z0-9-]+):\s*([^;]+);/g), m => [m[1], m[2].trim()]));
}
function resolve(theme, token, seen = new Set()) {
  assert(!seen.has(token), 'Cycle de jetons : ' + token);
  seen.add(token);
  const value = theme[token];
  assert(value, 'Jeton manquant : ' + token);
  const ref = value.match(/^var\((--wl-[a-z0-9-]+)\)$/);
  return ref ? resolve(theme, ref[1], seen) : value;
}
function luminance(hex) {
  assert(/^#[\da-f]{6}$/i.test(hex), 'Couleur non prise en charge : ' + hex);
  const channel = n => { const v = parseInt(hex.slice(n, n + 2), 16) / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return channel(1) * 0.2126 + channel(3) * 0.7152 + channel(5) * 0.0722;
}
function ratio(a, b) {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
let count = 0;
const errors = [];
const measurements = [];
function check(label, a, b, minimum) {
  const actual = ratio(a, b);
  count++;
  measurements.push({ label, couleur: a, fond: b, contraste: Number(actual.toFixed(3)), minimum });
  if (actual < minimum) errors.push(label + ' : ' + actual.toFixed(3) + ':1 < ' + minimum + ':1');
}
const light = tokens(':root');
const themes = { clair: light, sombre: { ...light, ...tokens('[data-theme="dark"] .screen') } };
for (const [name, theme] of Object.entries(themes)) {
  const color = token => resolve(theme, '--wl-' + token);
  for (const ink of ['texte', 'texte-doux', 'primaire', 'ok', 'ko', 'accent']) {
    for (const background of ['fond', 'carte']) check(name + ' texte ' + ink + '/' + background, color(ink), color(background), 4.5);
  }
  check(name + ' bouton principal', color('sur-primaire'), color('primaire'), 4.5);
  check(name + ' alerte', color('alerte-texte'), color('alerte-fond'), 4.5);
  for (const ink of ['b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'pastille', 'barre-ok']) {
    for (const background of ['fond', 'carte', 'piste', 'trace']) check(name + ' graphe ' + ink + '/' + background, color(ink), color(background), 3);
  }
  for (let n = 0; n < 6; n++) check(name + ' post-it ' + n, color('postit-texte'), color('postit-' + n), 4.5);
}
const palette = pptx.match(/var PAL = \[([^\]]+)\]/);
const track = pptx.match(/var PISTE = '([\da-f]{6})'/i);
assert(palette && track, 'Palette ou piste PowerPoint manquante');
const colors = Array.from(palette[1].matchAll(/'([\da-f]{6})'/gi), m => '#' + m[1]);
assert.equal(colors.length, 7, 'Sept séries PowerPoint attendues');
colors.forEach((color, n) => {
  check('PowerPoint série ' + (n + 1) + '/piste', color, '#' + track[1], 3);
  assert.equal(color.toLowerCase(), resolve(light, '--wl-b' + (n + 1)).toLowerCase(), 'Série PowerPoint différente du thème clair');
});
const out = process.argv.indexOf('--json');
if (out !== -1) {
  assert(process.argv[out + 1], 'Chemin de rapport manquant');
  fs.writeFileSync(process.argv[out + 1], JSON.stringify({ mesures: measurements, echecs: errors }, null, 2) + '\n');
}
errors.forEach(message => console.error('ÉCHEC : ' + message));
console.log('Contrastes : ' + count + ' couples mesurés, ' + errors.length + ' échec(s).');
process.exitCode = errors.length ? 1 : 0;
