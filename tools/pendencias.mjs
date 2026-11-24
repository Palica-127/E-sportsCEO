// Gera public/pendencias.html: times sem logo e jogadores sem foto, com link direto para a wiki.
// Ordem de prioridade: ligas principais primeiro, depois Challengers. Uso: node tools/pendencias.mjs
import fs from 'node:fs';
import path from 'node:path';
const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const D = f => JSON.parse(fs.readFileSync(path.join(RAIZ, 'src/data', f), 'utf8'));
const lol = D('lol.json'), outros = D('outros.json');
const logos = new Set(D('logos.LOGOS.json')), FOTOS = D('fotos.json'), fotosDe = g => new Set(FOTOS[g] || []);
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const WIKI = { lol: null, cs2: 'counterstrike', valorant: 'valorant', dota2: 'dota2', ff: 'freefire', r6: 'rainbowsix', fifa: 'fifa', wr: 'wildrift' };
const NOME = { lol: 'League of Legends', cs2: 'Counter-Strike 2', valorant: 'VALORANT', dota2: 'Dota 2', ff: 'Free Fire', r6: 'Rainbow Six Siege', fifa: 'EA SPORTS FC', wr: 'Wild Rift' };
const link = (g, nome) => g === 'lol'
  ? `https://lol.fandom.com/wiki/Special:Search?search=${encodeURIComponent(nome)}&go=Go`
  : `https://liquipedia.net/${WIKI[g]}/index.php?search=${encodeURIComponent(nome)}&go=Go`;
const jogos = { lol: lol.leagues, ...Object.fromEntries(Object.entries(outros).map(([g, d]) => [g, d.leagues])) };
let html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pendências de imagens</title>
<style>body{font:15px Barlow,system-ui,sans-serif;background:#0a0e16;color:#e7ecf5;max-width:980px;margin:auto;padding:20px}a{color:#d4af37}h2{margin-top:32px;border-bottom:1px solid #233049;padding-bottom:6px}
.item{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #182033}.mut{color:#8592aa}code{background:#172134;padding:1px 6px;border-radius:4px}
details{margin:8px 0}summary{cursor:pointer;font-weight:600}</style>
<h1>Pendências de imagens</h1><p class="mut">Abra o link, salve a imagem em <code>entrada/logos</code> ou <code>entrada/fotos</code> com qualquer nome e rode <code>python3 tools/importar_imagens.py</code>.</p>`;
let totL = 0, totF = 0;
for (const [g, ligas] of Object.entries(jogos)) {
  let blocoL = '', blocoF = '';
  for (const tier of ['t1', 't2']) for (const L of Object.values(ligas)) for (const t of L[tier]) {
    if (!logos.has(slug(t.n))) { totL++; blocoL += `<div class="item"><span>${t.n} <span class="mut">· ${L.nome}${tier === 't2' ? ' Challengers' : ''}</span></span><a href="${link(g, t.n)}" target="_blank">abrir</a></div>`; }
    if (tier === 't1') for (const p of t.p || []) {
      const k = slug(String(p[0])).replace(/-/g, '');
      if (!fotosDe(g).has(k)) { totF++; blocoF += `<div class="item"><span>${p[0]} <span class="mut">· ${t.n}</span></span><a href="${link(g, String(p[0]))}" target="_blank">abrir</a></div>`; }
    }
  }
  html += `<h2>${NOME[g]}</h2><details ${blocoL ? 'open' : ''}><summary>Logos que faltam</summary>${blocoL || '<p class="mut">Completo!</p>'}</details><details><summary>Fotos que faltam (só ligas principais)</summary>${blocoF || '<p class="mut">Completo!</p>'}</details>`;
}
html = html.replace('</h1>', ` <small class="mut">(${totL} logos, ${totF} fotos)</small></h1>`);
fs.writeFileSync(path.join(RAIZ, 'public/pendencias.html'), html);
console.log(`pendencias.html: ${totL} logos e ${totF} fotos faltando`);
