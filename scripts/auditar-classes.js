// Compara as classes usadas no HTML com as que têm regra no CSS.
// Pega classe usada sem estilo (o bug do switcher) e regra sem uso (CSS morto).
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/../index.html', 'utf8');
const css = fs.readFileSync(__dirname + '/../assets/css/styles.css', 'utf8');
const js = fs.readFileSync(__dirname + '/../assets/js/main.js', 'utf8');

const noHtml = new Set();
for (const m of html.matchAll(/class="([^"]+)"/g)) {
  m[1].split(/\s+/).filter(Boolean).forEach(c => noHtml.add(c));
}
// classes que o JS adiciona em tempo de execução
for (const m of js.matchAll(/classList\.(?:add|toggle|remove)\("([^"]+)"/g)) noHtml.add(m[1]);
for (const m of js.matchAll(/class="([^"]+)"/g)) m[1].split(/\s+/).forEach(c => noHtml.add(c));

// remove comentários antes de ler os seletores
const cssLimpo = css.replace(/\/\*[\s\S]*?\*\//g, '');
const noCss = new Set();
for (const m of cssLimpo.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)) noCss.add(m[1]);

// Divs estruturais e ganchos de JS não precisam de regra própria
const SEM_ESTILO_OK = new Set([
  'js-cta', 'hero__copy', 'vitrine__copy', 'band__copy', 'footer__brand',
  'profile__section', 'field--consent',
]);

const semEstilo = [...noHtml].filter(c => !noCss.has(c) && !SEM_ESTILO_OK.has(c)).sort();
const semUso = [...noCss].filter(c => !noHtml.has(c)).sort();

console.log('Classes usadas no HTML sem nenhuma regra no CSS (' + semEstilo.length + '):');
console.log(semEstilo.length ? '  ' + semEstilo.join('\n  ') : '  nenhuma');
console.log('\nRegras no CSS sem uso no HTML (' + semUso.length + '):');
console.log(semUso.length ? '  ' + semUso.join('\n  ') : '  nenhuma');
process.exit(semEstilo.length ? 1 : 0);
