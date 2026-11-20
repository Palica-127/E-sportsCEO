/* Aba MAPA-MUNDI da Caverna ao Espaco (plugin: Engine.registerTab). Regras e numeros: docs/TABS_CIV.md.
   Explorar > Colonizar > Conquistar 16 regioes pagando Ciencia; cada etapa libera parte de um bonus permanente. */
(function () {
'use strict';
/* ---- base compartilhada das 3 abas da Caverna (idempotente: a 1a aba carregada cria, as outras reusam) ---- */
var CT = window.CIVT = window.CIVT || {};
if (!CT.v) {
  CT.v = 1; CT.fx = {};
  CT.clock = function () { return Date.now(); };                                  /* tempo real (ms); os testes trocam */
  CT.PSREF = [2e3, 3e4, 5e5, 4e7, 2e9];                                          /* producao/s tipica ao entrar em cada era */
  CT.PB = { map: 14000, tec: 12000, mar: 30000 };                                    /* "retorno" de referencia (s de producao) de cada aba: calibrado pela simulacao, ver docs/TABS_CIV.md */
  CT.CAP = 40;                                                                      /* teto de desconto/tempo por categoria (%) */
  CT.cost = function (tier, v, pb, share) {
    var x = CT.PSREF[Math.max(0, Math.min(4, tier))] * v / 100 * pb * (share == null ? 1 : share);
    var e = Math.pow(10, Math.max(0, Math.floor(Math.log10(x)) - 1));
    return Math.max(1, Math.round(x / e) * e);
  };
  CT.sum = function (kind, cat) {
    var s = 0, id, f;
    for (id in CT.fx) { f = CT.fx[id]; if (f) s += cat ? (f[kind] && f[kind][cat]) || 0 : f[kind] || 0; }
    return s;
  };
  CT.disc = function (cat) { return Math.min(CT.CAP, CT.sum('d', cat)) / 100; };
  CT.fast = function () { return Math.min(CT.CAP, CT.sum('t')) / 100; };
  CT.slots = function () { return 1 + CT.sum('slot'); };
  CT.r1 = function (x) { return String(Math.round(x * 10) / 10).replace('.', ','); };
  CT.DN = { map: 'do mapa', tec: 'das tecnologias', mar: 'das maravilhas' };
  CT.DS = { map: 'mapa', tec: 'tecnologias', mar: 'maravilhas' };
  CT.fxText = function (b, f) {
    var p = [], k; f = f == null ? 1 : f;
    if (b.ps) p.push('+' + CT.r1(b.ps * f) + '% de renda');
    if (b.d) for (k in b.d) p.push('−' + CT.r1(b.d[k] * f) + '% no custo ' + CT.DN[k]);
    if (b.t) p.push('−' + CT.r1(b.t * f) + '% no tempo de obras');
    if (b.slot) p.push('+' + b.slot + ' obra simultânea');
    return p.join(' e ');
  };
  CT.fxShort = function (b) {
    var p = [], k;
    if (b.ps) p.push('+' + CT.r1(b.ps) + '% renda');
    if (b.d) for (k in b.d) p.push('−' + CT.r1(b.d[k]) + '% ' + CT.DS[k]);
    if (b.t) p.push('−' + CT.r1(b.t) + '% tempo');
    if (b.slot) p.push('+' + b.slot + ' obra');
    return p.join(' · ');
  };
  CT.el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  CT.tn = function (api, i) { var t = api.G.tiers; return t[Math.max(0, Math.min(t.length - 1, i))].n; };
  CT.reveal = function (root, el, sheet, rm, pad) {       /* rola ate o elemento ficar visivel acima do painel inferior */
    var rr = root.getBoundingClientRect(), er = el.getBoundingClientRect(), sr = sheet.getBoundingClientRect();
    if (er.top >= rr.top + 4 && er.bottom + (pad || 0) <= sr.top) return;
    var top = Math.max(0, root.scrollTop + er.top - rr.top - 12);
    if (root.scrollTo) root.scrollTo({ top: top, behavior: rm ? 'auto' : 'smooth' }); else root.scrollTop = top;
  };
  CT.sumLine = function () {
    var p = [], k, d;
    for (k in CT.DS) { d = CT.disc(k) * 100; if (d > 0) p.push('−' + CT.r1(d) + '% ' + CT.DS[k]); }
    d = CT.fast() * 100; if (d > 0) p.push('−' + CT.r1(d) + '% tempo de obras');
    return p.join(' · ');
  };
}

var G = GAMES.civ, W = 440, H = 306;
var SH = [0.15, 0.30, 0.55];            /* fatia do custo total em cada etapa */
var FR = [0, 0.3, 0.6, 1];              /* fracao acumulada do bonus por etapa */
var ST_N = ['Desconhecida', 'Explorada', 'Colonizada', 'Conquistada'];
var ACT = ['Explorar', 'Colonizar', 'Conquistar'];
var GLY = ['?', '🧭', '🏘️', '⭐'];
/* e = era minima (indice de GAMES.civ.tiers); x,y = posicao no mapa estilizado; v = valor do bonus (% de renda equivalente) p/ o custo */
var REG = [
  { id: 'mes', n: 'Mesopotâmia', s: 'Mesopotâmia', e: 1, x: 310, y: 122, lp: 't', v: 1.0, bn: 'Contabilidade suméria', fx: { ps: 1.0 },
    info: 'A "terra entre rios": Tigre e Eufrates, em grande parte no atual Iraque. Aqui nasceram cidades, escrita e burocracia.',
    fun: 'O Hino a Ninkasi (c. 1800 a.C.) é um poema à deusa da cerveja que descreve, em versos, como a bebida era feita. Foi o primeiro vídeo de receita.' },
  { id: 'nil', n: 'Vale do Nilo', s: 'Nilo', e: 1, x: 232, y: 160, lp: 'l', v: 0.8, bn: 'Cheias do Nilo', fx: { ps: 0.8 },
    info: 'O Nilo corre do sul para o norte, e suas cheias adubavam as margens do Egito.',
    fun: 'Os egípcios usavam um calendário civil de 365 dias: 12 meses de 30 dias mais 5 dias extras. Ele inspirou o calendário que usamos hoje.' },
  { id: 'ind', n: 'Vale do Indo', s: 'Indo', e: 1, x: 340, y: 176, lp: 'l', v: 0.5, bn: 'Planejamento urbano', fx: { d: { tec: 6 } },
    info: 'Harappa e Mohenjo-daro, entre 2600 e 1900 a.C. mais ou menos, no atual Paquistão e noroeste da Índia.',
    fun: 'As cidades do Indo tinham ruas em grade e esgoto coberto. Já a escrita delas segue sem decifração: bom trabalho para o próximo estagiário.' },
  { id: 'chn', n: 'China (Rio Amarelo)', s: 'China', e: 1, x: 402, y: 140, v: 0.9, bn: 'Seda e papel', fx: { ps: 0.9 },
    info: 'Do Rio Amarelo ao Yangtzé: painço ao norte, arroz ao sul e muita burocracia desde cedo.',
    fun: 'O papel surgiu na China. A tradição o atribui a Cai Lun, em 105 d.C., embora existam achados ainda mais antigos.' },
  { id: 'med', n: 'Mediterrâneo (Grécia e Roma)', s: 'Mediterrâneo', e: 1, x: 212, y: 102, v: 0.5, bn: 'Arquitetura clássica', fx: { d: { mar: 6 } },
    info: 'Gregos e romanos fizeram do mar interno uma estrada. Os romanos o chamavam de Mare Nostrum, "nosso mar".',
    fun: 'Os Jogos Olímpicos da Antiguidade são datados, pela tradição, de 776 a.C. O prêmio não era medalha: era uma coroa de ramos de oliveira.' },
  { id: 'eur', n: 'Europa', s: 'Europa', e: 2, x: 200, y: 42, v: 0.7, bn: 'Feiras medievais', fx: { ps: 0.7 },
    info: 'Florestas, rios navegáveis e castelos demais para um mapa só.',
    fun: 'Por volta do ano 1000, vikings chegaram à América do Norte: em L\'Anse aux Meadows, na Terra Nova (Canadá), há um sítio arqueológico nórdico.' },
  { id: 'asc', n: 'Ásia Central', s: 'Ásia Central', e: 2, x: 326, y: 52, lp: 't', v: 0.5, bn: 'Caravanas', fx: { d: { map: 8 } },
    info: 'Estepes, desertos e oásis: a ponte entre o Leste e o Oeste.',
    fun: 'O nome "Rota da Seda" foi cunhado em 1877 pelo geógrafo alemão Ferdinand von Richthofen. Os comerciantes da época só chamavam de trabalho.' },
  { id: 'afr', n: 'África Subsaariana', s: 'África', e: 2, x: 236, y: 222, v: 0.8, bn: 'Ouro do Sahel', fx: { ps: 0.8 },
    info: 'Do Sahel ao Cabo: reinos, savanas e o berço da nossa espécie.',
    fun: 'Em 1324, o imperador Mansa Musa, do Mali, fez uma peregrinação a Meca levando tanto ouro que, segundo os relatos, o metal se desvalorizou no Cairo.' },
  { id: 'sea', n: 'Sudeste Asiático', s: 'Sudeste', e: 2, x: 392, y: 206, lp: 'l', v: 0.7, bn: 'Especiarias', fx: { ps: 0.7 },
    info: 'Arquipélagos, monções e as Ilhas das Especiarias.',
    fun: 'O cravo e a noz-moscada vinham das Molucas, na Indonésia, as "Ilhas das Especiarias". A cobiça por elas ajudou a impulsionar as Grandes Navegações.' },
  { id: 'jap', n: 'Japão', s: 'Japão', e: 2, x: 404, y: 66, lp: 't', v: 0.55, bn: 'Carpintaria precisa', fx: { t: 8 },
    info: 'Um arquipélago de milhares de ilhas, com terremotos de brinde.',
    fun: 'O templo Hōryū-ji, em Nara, do século VII, é considerado um dos edifícios de madeira mais antigos do mundo.' },
  { id: 'mso', n: 'Mesoamérica', s: 'Mesoamérica', e: 3, x: 62, y: 120, lp: 't', v: 0.6, bn: 'Calendário maia', fx: { ps: 0.6 },
    info: 'Terra de milho, pirâmides e calendários, do México à América Central.',
    fun: 'Os maias usavam o zero na sua numeração, séculos antes de a ideia se difundir pela Europa.' },
  { id: 'and', n: 'Andes', s: 'Andes', e: 3, x: 84, y: 212, lp: 'l', v: 0.45, bn: 'Estradas incas', fx: { t: 6 },
    info: 'Montanhas, terraços de cultivo e batatas em milhares de variedades.',
    fun: 'Os incas não tinham escrita alfabética, mas guardavam números e registros em cordas com nós, os quipos.' },
  { id: 'amz', n: 'Amazônia (Brasil)', s: 'Amazônia', e: 3, x: 140, y: 172, lp: 'l', v: 0.7, bn: 'Terra preta', fx: { ps: 0.7 },
    info: 'A maior floresta tropical do mundo, e bem menos "intocada" do que parece.',
    fun: 'A terra preta de índio, solo escuro e fértil criado por povos amazônicos ao longo de séculos, ainda é mais produtiva que a terra ao redor.' },
  { id: 'nam', n: 'América do Norte', s: 'Am. do Norte', e: 3, x: 50, y: 50, lp: 'r', v: 0.5, bn: 'Rios navegáveis', fx: { ps: 0.5 },
    info: 'Pradarias, florestas e rios enormes: do Ártico ao Golfo.',
    fun: 'Cahokia, perto de St. Louis (EUA), chegou a ter de 10 a 20 mil habitantes por volta de 1100 d.C. e erguia enormes montes de terra.' },
  { id: 'oce', n: 'Oceania', s: 'Oceania', e: 3, x: 388, y: 268, v: 0.5, bn: 'Navegação polinésia', fx: { d: { map: 8 } },
    info: 'A Austrália e milhares de ilhas espalhadas pelo Pacífico.',
    fun: 'Povos aborígenes vivem na Austrália há pelo menos 50 mil anos, e os polinésios cruzaram o Pacífico lendo estrelas, ondas e aves.' },
  { id: 'ant', n: 'Antártida', s: 'Antártida', e: 3, x: 236, y: 284, lp: 'l', v: 0.5, bn: 'Ciência polar', fx: { d: { tec: 6 } },
    lab: ['Explorar', 'Montar base', 'Pesquisar'], stn: ['Desconhecida', 'Explorada', 'Com base', 'Estudada'],
    info: 'O continente mais frio, seco e ventoso. Aluguel barato, vizinhança escassa.',
    fun: 'O Tratado Antártico, de 1959, reserva o continente à paz e à ciência. Roald Amundsen chegou ao Polo Sul em 14 de dezembro de 1911.' }
];
var BY = {}; REG.forEach(function (r) { BY[r.id] = r; });

var S = fresh(), UI = null, sel = '', apiRef = null, armUntil = 0;
function fresh() { return { v: 1, u: 0, r: {}, seen: {} }; }
function stage(id) { return S.r[id] || 0; }
function gateTier(r, s) { return Math.min(4, r.e + s); }       /* era exigida para comprar a etapa s+1 */
function costOf(r, s) { return CT.cost(gateTier(r, s), r.v, CT.PB.map, SH[s]); }
function costNow(r, s) { return Math.max(1, Math.round(costOf(r, s) * (1 - CT.disc('map')))); }
function bonusFx(f) {
  var o = { ps: 0, mult: 1, d: { map: 0, tec: 0, mar: 0 }, t: 0, slot: 0 };
  REG.forEach(function (r) {
    var k = FR[stage(r.id)]; if (!k) return;
    if (r.fx.ps) { o.ps += r.fx.ps * k; o.mult *= 1 + r.fx.ps * k / 100; }
    if (r.fx.d) for (var c in r.fx.d) o.d[c] += r.fx.d[c] * k;
    if (r.fx.t) o.t += r.fx.t * k;
  });
  return o;
}
function apply(api) {
  var o = bonusFx();
  CT.fx.mapa = o; api.mult('civ-mapa:ps', o.mult);
}
function counts() { var a = 0, b = 0, c = 0; REG.forEach(function (r) { var s = stage(r.id); if (s >= 1) a++; if (s >= 2) b++; if (s >= 3) c++; }); return [a, b, c]; }
function info(r, tr, money) {
  var s = stage(r.id), full = s >= 3, g = full ? 0 : gateTier(r, s), ok = tr >= (full ? 0 : g), cost = full ? 0 : costNow(r, s);
  return { s: s, full: full, gate: g, ok: ok, cost: cost, can: ok && !full && money >= cost, ent: r.e };
}

/* ---------- interface ---------- */
var CONT = [
  '10,22 64,8 118,20 128,52 108,82 100,110 94,138 74,158 56,150 42,126 30,98 14,74 6,46',
  '70,168 118,152 158,168 168,196 150,232 124,264 104,272 90,238 76,214 62,190',
  '172,70 176,52 188,24 232,10 300,8 360,10 380,36 378,70 392,102 430,114 436,152 430,178 420,200 410,232 394,240 376,218 366,196 356,192 346,214 336,228 322,204 308,174 296,166 288,190 276,190 266,170 262,146 250,132 236,124 214,126 196,122 182,112 174,92',
  '392,38 414,34 428,60 420,92 404,100 394,76',
  '194,138 214,132 250,134 268,150 272,176 262,196 252,226 238,254 220,256 204,232 194,200 184,168',
  '350,244 380,232 410,238 430,252 428,276 400,290 366,284 348,264',
  '110,292 160,276 236,270 320,276 346,292 320,304 200,306 130,302'
];
function blob(cx, cy, r, seed) {
  var pts = [], i, a, k, rr, q = seed * 9301 + 49297;
  for (i = 0; i < 10; i++) {
    q = (q * 9301 + 49297) % 233280; k = q / 233280; a = i * Math.PI / 5; rr = r * (0.8 + 0.32 * k);
    pts.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr * 0.9).toFixed(1));
  }
  return pts.join(' ');
}
function mountUI(root, api) {
  root.classList.add('civ-root');
  var svg = '<svg class="civ-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true" focusable="false">';
  [76, 153, 230].forEach(function (y) { svg += '<line x1="0" y1="' + y + '" x2="' + W + '" y2="' + y + '" class="civ-grat"/>'; });
  [110, 220, 330].forEach(function (x) { svg += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + H + '" class="civ-grat"/>'; });
  CONT.forEach(function (p) { svg += '<polygon points="' + p + '" class="civ-land"/>'; });
  REG.forEach(function (r, i) { svg += '<polygon id="cm-b-' + r.id + '" points="' + blob(r.x, r.y, 25, i + 3) + '" class="civ-blob" data-st="lock"/>'; });
  svg += '</svg>';
  root.innerHTML = '<section class="civ-sum" aria-label="Resumo do mapa"><div class="civ-sum-r"><b id="cm-t1"></b><span id="cm-t2"></span></div><p id="cm-t3"></p></section>' +
    '<div class="civ-map" id="cm-map" role="group" aria-label="Mapa-múndi estilizado, com 16 regiões">' + svg + '</div>' +
    '<ul class="civ-list" id="cm-list" aria-label="Regiões"></ul>' +
    '<section class="civ-sheet" id="cm-sheet" hidden aria-label="Região selecionada">' +
    '<div class="civ-sh-h"><b id="cm-sn"></b><button type="button" class="civ-x" id="cm-sx" aria-label="Fechar painel">✕</button></div>' +
    '<div class="civ-sh-b"><p class="civ-era" id="cm-se"></p><div class="civ-steps" id="cm-ss"></div><p id="cm-si"></p>' +
    '<p class="civ-bn"><b id="cm-sb"></b><span id="cm-sbt"></span></p><p class="civ-fun" id="cm-sf"></p></div>' +
    '<button type="button" class="btn pri civ-act" id="cm-sa"><span class="civ-b1"></span><span class="civ-b2"></span></button></section>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { root: root, t1: q('cm-t1'), t2: q('cm-t2'), t3: q('cm-t3'), map: q('cm-map'), list: q('cm-list'), sheet: q('cm-sheet'), sn: q('cm-sn'), se: q('cm-se'), ss: q('cm-ss'), si: q('cm-si'),
    sb: q('cm-sb'), sbt: q('cm-sbt'), sf: q('cm-sf'), sa: q('cm-sa'), pins: {}, blobs: {} };
  for (var i = 0; i < 3; i++) UI.ss.appendChild(CT.el('span', 'civ-stp'));
  REG.forEach(function (r) {
    var b = CT.el('button', 'civ-pin'); b.type = 'button'; b.dataset.id = r.id; b.dataset.act = 'sel';
    b.style.left = (r.x / W * 100).toFixed(2) + '%'; b.style.top = (r.y / H * 100).toFixed(2) + '%';
    b.innerHTML = '<i class="civ-pg" aria-hidden="true"></i><span class="civ-pn"></span>';
    b.children[1].textContent = r.s; b.children[1].dataset.p = r.lp || 'b'; UI.map.appendChild(b); UI.pins[r.id] = { b: b, g: b.children[0] };
    UI.blobs[r.id] = root.querySelector('#cm-b-' + r.id);
  });
  UI.pl = api.list(UI.list, { key: function (it) { return it.r.id; }, create: mkRow });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function mkRow(it) {
  var li = CT.el('li', 'civ-li'), b = CT.el('button', 'civ-row'); b.type = 'button'; b.dataset.act = 'sel'; b.dataset.id = it.r.id;
  b.innerHTML = '<i class="civ-pg" aria-hidden="true"></i><span class="civ-rt"><b></b><small></small></span><span class="civ-rb"></span>';
  li.appendChild(b);
  var u = { g: b.children[0], n: b.children[1].children[0], s: b.children[1].children[1], x: b.children[2] };
  return { el: li, update: function (d) { paintRow(u, b, d); } };
}
function stN(r, s) { return (r.stn || ST_N)[s]; }
function paintRow(u, b, d) {
  var U = apiRef.ui, r = d.r, i = d.i;
  U.text(u.g, GLY[i.s] === '?' && !i.ok ? '🔒' : GLY[i.s]); U.text(u.n, r.n);
  U.text(u.s, i.full ? stN(r, 3) + ' · ' + r.bn : i.ok ? stN(r, i.s) + ' · próxima: ' + (r.lab || ACT)[i.s] : 'Requer ' + CT.tn(apiRef, i.gate));
  U.text(u.x, i.full ? '✔' : i.ok ? apiRef.cur + ' ' + apiRef.fmt(i.cost) : '🔒');
  U.data(b, 'st', i.s ? 's' + i.s : i.ok ? 'open' : 'lock'); U.data(b, 'can', i.can ? '1' : '0'); U.data(b, 'sel', sel === r.id ? '1' : '0');
  U.attr(b, 'aria-label', r.n + ', ' + stN(r, i.s) + (i.full ? '' : i.ok ? ', próxima etapa ' + apiRef.fmt(i.cost) + ' de ciência' : ', requer ' + CT.tn(apiRef, i.gate)));
}
function render(api) {
  if (!UI) return;
  var U = api.ui, tr = api.stage().tier, money = api.money(), c = counts(), items = [];
  REG.forEach(function (r) {
    var i = info(r, tr, money); items.push({ r: r, i: i });
    var p = UI.pins[r.id], st = i.s ? 's' + i.s : i.ok ? 'open' : 'lock';
    U.text(p.g, i.s === 0 && !i.ok ? '🔒' : GLY[i.s]);
    U.data(p.b, 'st', st); U.data(p.b, 'can', i.can ? '1' : '0'); U.data(p.b, 'sel', sel === r.id ? '1' : '0');
    U.attr(p.b, 'aria-label', r.n + ', ' + stN(r, i.s) + (i.full ? '' : i.ok ? ', toque para abrir' : ', requer ' + CT.tn(api, i.gate)));
    U.data(UI.blobs[r.id], 'st', st); U.data(UI.blobs[r.id], 'sel', sel === r.id ? '1' : '0');
  });
  UI.pl.set(items);
  var fx = CT.fx.mapa || bonusFx();
  U.text(UI.t1, c[2] + '/' + REG.length + ' conquistadas');
  U.text(UI.t2, 'Mapa: +' + CT.r1((fx.mult - 1) * 100) + '% de renda');
  U.text(UI.t3, c[0] + ' exploradas · ' + c[1] + ' colonizadas' + (CT.sumLine() ? ' · Descontos: ' + CT.sumLine() : ''));
  UI.sheet.hidden = !sel;
  if (sel) paintSheet(api, BY[sel], info(BY[sel], tr, money));
  if (UI.want && sel) CT.reveal(UI.root, UI.want, UI.sheet, api.rm(), 22);
  UI.want = null;
}
function paintSheet(api, r, i) {
  var U = api.ui, k = FR[i.s], a = UI.sa;
  U.text(UI.sn, r.n); U.text(UI.se, 'Disponível desde: ' + CT.tn(api, r.e) + ' · ' + stN(r, i.s));
  Array.prototype.forEach.call(UI.ss.children, function (sp, j) { U.text(sp, (j < i.s ? '✔ ' : '○ ') + (r.lab || ACT)[j]); U.data(sp, 'on', j < i.s ? '1' : '0'); });
  U.text(UI.si, r.info);
  U.text(UI.sb, r.bn + ': '); U.text(UI.sbt, CT.fxText(r.fx, 1) + (i.s && !i.full ? ' (agora ' + CT.fxText(r.fx, k) + ')' : ''));
  U.text(UI.sf, S.seen[r.id] ? '📜 ' + r.fun : 'Conquiste a região para revelar uma curiosidade.');
  var lab = i.full ? 'Região conquistada ✔' : i.ok ? (r.lab || ACT)[i.s] : 'Requer ' + CT.tn(api, i.gate);
  U.text(a.children[0], lab); U.text(a.children[1], i.full || !i.ok ? '' : api.cur + ' ' + api.fmt(i.cost) + (i.can ? '' : ' · faltam ' + api.fmt(Math.max(0, i.cost - api.money()))));
  U.attr(a, 'aria-disabled', i.can ? 'false' : 'true'); U.data(a, 'id', r.id);
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
  if (b.id === 'cm-sx') { sel = ''; api.invalidate(); return; }
  if (b.id === 'cm-sa') { if (sel) act(api, sel); return; }
  if (b.dataset.act === 'sel') {
    sel = sel === b.dataset.id ? '' : b.dataset.id; api.sfx('tap'); api.invalidate();
    UI.want = sel && b.classList.contains('civ-pin') ? b : null;     /* pinos: rola ate ficarem acima do painel */
  }
}
function act(api, id) {
  var r = BY[id], s = stage(id), tr = api.stage().tier, i = info(r, tr, api.money());
  if (s >= 3) return { ok: false, msg: 'Já conquistada' };
  if (!i.ok) { api.toast('Requer ' + CT.tn(api, i.gate) + ' para ' + (r.lab || ACT)[s].toLowerCase() + ' ' + r.s); api.sfx('no'); return { ok: false, msg: 'era' }; }
  if (!api.spend(i.cost)) { api.toast('Faltam ' + api.cur + ' ' + api.fmt(i.cost - api.money())); api.sfx('no'); return { ok: false, msg: 'saldo' }; }
  S.r[id] = s + 1; if (s + 1 === 3) S.seen[id] = 1;
  apply(api); ach(api);
  if (s + 1 === 3) api.toast('📜 ' + r.n + ' conquistada! ' + r.fun, { ms: 8000 });
  else api.toast(r.n + ' ' + (s === 0 ? 'explorada' : 'colonizada') + '. ' + CT.fxText(r.fx, FR[s + 1]) + ' no total.');
  api.sfx('buy'); api.buzz(12); api.save(); api.invalidate();
  return { ok: true, cost: i.cost };
}
function ach(api) {
  var c = counts();
  if (c[0] >= 1) api.unlock('cm1');
  if (c[2] >= 1) api.unlock('cm3');
  if (c[1] >= 8) api.unlock('cm8');
  if (c[2] >= REG.length) api.unlock('cm16');
}

/* ---------- registro ---------- */
Engine.registerTab('civ', {
  id: 'mapa', label: 'Mapa', icon: '🗺️',
  ach: [
    { id: 'cm1', ic: '🧭', n: 'Primeira expedição', d: 'Explore uma região do mapa-múndi.' },
    { id: 'cm3', ic: '🚩', n: 'Bandeira fincada', d: 'Conquiste uma região.' },
    { id: 'cm8', ic: '🗺️', n: 'Cartógrafo', d: 'Colonize 8 regiões.' },
    { id: 'cm16', ic: '🌍', n: 'Mundo pequeno', d: 'Conquiste as 16 regiões do mapa.' }
  ],
  unlock: function (api) { if (!S.u && api.owned('agri') >= 1) S.u = 1; return !!S.u; },
  mount: function (root, api) { apiRef = api; mountUI(root, api); },
  load: function (d, api) {
    S = fresh(); sel = '';
    if (d && typeof d === 'object') {
      S.u = d.u ? 1 : 0;
      if (d.r && typeof d.r === 'object') REG.forEach(function (r) { var n = Math.floor(+d.r[r.id]); if (n >= 1) S.r[r.id] = Math.min(3, n); });
      if (d.seen && typeof d.seen === 'object') REG.forEach(function (r) { if (d.seen[r.id]) S.seen[r.id] = 1; });
      REG.forEach(function (r) { if (stage(r.id) >= 3) S.seen[r.id] = 1; });
    }
    apply(api);
  },
  save: function () { return { v: 1, u: S.u, r: S.r, seen: S.seen }; },
  update: function () { },      /* so existir faz o motor avaliar unlock() a cada tick (a aba fica aberta de vez) */
  show: function (api) { api.invalidate(); },
  render: render,
  onPrestige: function (api) { S.r = {}; sel = ''; apply(api); api.invalidate(); }   /* nova civilização: mapa recomeça; curiosidades já vistas ficam */
});
CT.mapa = { REG: REG, FR: FR, SH: SH, state: function () { return S; }, costOf: costOf, costNow: costNow, gateTier: gateTier, act: function (id) { return act(apiRef, id); }, bonus: bonusFx };
})();
