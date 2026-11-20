/* Aba TECNOLOGIA da Caverna ao Espaco (plugin: Engine.registerTab). Regras e numeros: docs/TABS_CIV.md.
   Tres caminhos (Guerra, Comercio, Ciencia), escolhas excludentes e uma unica doutrina final. */
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

var G = GAMES.civ;
/* Cada caminho tem 6 passos em sequencia; passo com 2 nos = escolha excludente (so um). O passo 6 e a doutrina final:
   so UMA em todo o jogo (grupo 'cap'). need = passos de outros caminhos exigidos ('c:3' = passo 3 do Comercio). */
var PATHS = [
  { id: 'g', n: 'Guerra', ic: '⚔️', st: 'Conquistador', steps: [
    [{ id: 'g1', n: 'Armas de bronze', ic: '🗡️', e: 1, v: 0.35, fx: { d: { map: 4 } }, d: 'A Idade do Bronze começou por volta de 3300 a.C. no Oriente Próximo. Cobre e estanho: bromance metalúrgico.' }],
    [{ id: 'g2', n: 'Fortificações', ic: '🏰', e: 1, v: 0.3, fx: { ps: 0.3 }, d: 'Muralhas seguram invasores e também o fiscal do vizinho.' }],
    [{ id: 'g3a', n: 'Falange', ic: '🛡️', e: 2, v: 0.6, fx: { d: { map: 8 } }, d: 'Hoplitas gregos, escudo com escudo, desde o século VII a.C. Ninguém passa, ninguém dispersa.' },
     { id: 'g3b', n: 'Legião', ic: '🦅', e: 2, v: 0.5, fx: { ps: 0.5 }, d: 'Os soldados romanos marchavam e, de quebra, construíam estradas e fortes. Eram o RH e a engenharia ao mesmo tempo.' }],
    [{ id: 'g4', n: 'Cavalaria', ic: '🐎', e: 2, v: 0.3, fx: { ps: 0.3 }, d: 'O cavalo mudou a velocidade das notícias, dos impostos e das invasões.' }],
    [{ id: 'g5a', n: 'Pólvora', ic: '💥', e: 3, v: 0.5, fx: { ps: 0.5 }, need: ['c:3'], d: 'Inventada na China e levada a campos de batalha de toda a Eurásia. Exércitos custam dinheiro: exige o passo 3 do Comércio.' },
     { id: 'g5b', n: 'Engenharia militar', ic: '🏗️', e: 3, v: 0.5, fx: { t: 8 }, need: ['c:3'], d: 'Pontes, trincheiras e fortalezas: quem sabe cercar também sabe construir. Exige o passo 3 do Comércio.' }],
    [{ id: 'g6', n: 'Superpotência', ic: '🎖️', e: 4, v: 0.9, x: 'cap', fx: { ps: 0.7, d: { map: 10 } }, d: 'Doutrina final: poder e influência no mundo todo. Só uma doutrina final por civilização.' }]
  ] },
  { id: 'c', n: 'Comércio', ic: '💰', st: 'Mercador', steps: [
    [{ id: 'c1', n: 'Moeda', ic: '🪙', e: 1, v: 0.4, fx: { ps: 0.4 }, d: 'As primeiras moedas surgiram na Lídia (atual Turquia) por volta do século VII a.C. Troco, enfim.' }],
    [{ id: 'c2', n: 'Rotas comerciais', ic: '🐪', e: 1, v: 0.4, fx: { ps: 0.4 }, d: 'Caravanas, barcos e muita negociação de preço no caminho.' }],
    [{ id: 'c3a', n: 'Bancos', ic: '🏦', e: 2, v: 0.6, fx: { ps: 0.6 }, d: 'Os bancos modernos nasceram em cidades italianas, como Florença e Gênova. Juros: invenção antiga, graça nenhuma.' },
     { id: 'c3b', n: 'Guildas', ic: '🧰', e: 2, v: 0.6, fx: { d: { tec: 8 } }, d: 'Associações de artesãos que treinavam aprendizes e guardavam os segredos do ofício.' }],
    [{ id: 'c4', n: 'Cartografia comercial', ic: '🗺️', e: 2, v: 0.4, fx: { d: { map: 6 } }, d: 'Bons mapas valiam mais que ouro: quem sabe o caminho vende a rota.' }],
    [{ id: 'c5a', n: 'Bolsa de valores', ic: '📈', e: 3, v: 0.6, fx: { ps: 0.6 }, need: ['s:4'], d: 'A Bolsa de Amsterdã, do início do século XVII, é considerada a primeira bolsa moderna. Exige a Imprensa (Ciência, passo 4).' },
     { id: 'c5b', n: 'Livre comércio', ic: '🚢', e: 3, v: 0.55, fx: { d: { mar: 10 } }, need: ['s:4'], d: 'Menos taxa nas fronteiras, mais navio nos portos. Exige a Imprensa (Ciência, passo 4).' }],
    [{ id: 'c6', n: 'Globalização', ic: '🌐', e: 4, v: 0.9, x: 'cap', fx: { ps: 0.8, d: { mar: 6 } }, d: 'Doutrina final: o mundo inteiro como um grande mercado. Só uma doutrina final por civilização.' }]
  ] },
  { id: 's', n: 'Ciência', ic: '🔬', st: 'Estudioso', steps: [
    [{ id: 's1', n: 'Calendário', ic: '🌙', e: 1, v: 0.3, fx: { ps: 0.3 }, d: 'Observar o céu ajudou a saber a hora de plantar e a hora de fazer festa.' }],
    [{ id: 's2', n: 'Matemática', ic: '📐', e: 1, v: 0.35, fx: { d: { tec: 4 } }, d: 'Os babilônios já calculavam em base 60, herança que ainda vive nos minutos da hora.' }],
    [{ id: 's3a', n: 'Universidades', ic: '🎓', e: 2, v: 0.5, fx: { ps: 0.5 }, d: 'A Universidade de Bolonha, fundada em 1088, é considerada a mais antiga em funcionamento contínuo. Provas existem desde então.' },
     { id: 's3b', n: 'Casa da Sabedoria', ic: '🏛️', e: 2, v: 0.6, fx: { d: { tec: 8 } }, d: 'Em Bagdá, a partir do século IX, sábios traduziram e ampliaram obras gregas, persas e indianas.' }],
    [{ id: 's4', n: 'Imprensa', ic: '🖨️', e: 2, v: 0.4, fx: { ps: 0.4 }, d: 'Gutenberg imprimiu sua Bíblia por volta de 1455. Antes, cada cópia era um ano de trabalho do monge.' }],
    [{ id: 's5a', n: 'Método científico', ic: '🧪', e: 3, v: 0.6, fx: { ps: 0.6 }, d: 'Hipótese, experimento e revisão: errar de forma organizada.' },
     { id: 's5b', n: 'Engenharia aplicada', ic: '⚙️', e: 3, v: 0.6, fx: { t: 10 }, d: 'Da ciência para a prática: canteiros mais rápidos e menos achismo.' }],
    [{ id: 's6', n: 'Era da Informação', ic: '💾', e: 4, v: 0.9, x: 'cap', fx: { ps: 0.9 }, d: 'Doutrina final: o ENIAC é de 1945; hoje o saber cabe no bolso. Só uma doutrina final por civilização.' }]
  ] }
];
var NODE = {}, PBY = {}, FLAT = [];
PATHS.forEach(function (p) {
  PBY[p.id] = p;
  p.steps.forEach(function (st, i) { st.forEach(function (n) { n.p = p.id; n.i = i; n.pair = st.length > 1 ? st : null; NODE[n.id] = n; FLAT.push(n); }); });
});

var S = fresh(), UI = null, cur = 'g', sel = '', apiRef = null;
function fresh() { return { v: 1, u: 0, n: {} }; }
function own(id) { return !!S.n[id]; }
function stepDone(pid, i) { return PBY[pid].steps[i].some(function (n) { return own(n.id); }); }
function costOf(n) { return CT.cost(n.e, n.v, CT.PB.tec); }
function costNow(n) { return Math.max(1, Math.round(costOf(n) * (1 - CT.disc('tec')))); }
function blocker(n) {          /* no que impede por escolha excludente */
  var o = null;
  if (n.pair) n.pair.forEach(function (m) { if (m !== n && own(m.id)) o = m; });
  if (!o && n.x) FLAT.forEach(function (m) { if (m !== n && m.x === n.x && own(m.id)) o = m; });
  return o;
}
function reqList(n) {          /* requisitos nao cumpridos (texto) */
  var out = [];
  if (n.i > 0 && !stepDone(n.p, n.i - 1)) out.push('passo ' + n.i + ' de ' + PBY[n.p].n);
  (n.need || []).forEach(function (r) { var a = r.split(':'), pp = PBY[a[0]], k = +a[1] - 1; if (!stepDone(a[0], k)) out.push('passo ' + a[1] + ' de ' + pp.n + ' (' + pp.steps[k].map(function (m) { return m.n; }).join(' ou ') + ')'); });
  return out;
}
function nstate(n, tr, money) {
  if (own(n.id)) return { k: 'own' };
  var b = blocker(n); if (b) return { k: 'blk', by: b };
  var rq = reqList(n); if (rq.length) return { k: 'lock', why: 'Requer ' + rq.join(' e '), rq: rq };
  var c = costNow(n);
  if (tr < n.e) return { k: 'lock', why: 'Requer ' + CT.tn(apiRef, n.e), era: true, cost: c };
  return { k: money >= c ? 'can' : 'ok', cost: c };
}
function bonusFx() {
  var o = { ps: 0, mult: 1, d: { map: 0, tec: 0, mar: 0 }, t: 0, slot: 0 };
  FLAT.forEach(function (n) {
    if (!own(n.id)) return;
    if (n.fx.ps) { o.ps += n.fx.ps; o.mult *= 1 + n.fx.ps / 100; }
    if (n.fx.d) for (var c in n.fx.d) o.d[c] += n.fx.d[c];
    if (n.fx.t) o.t += n.fx.t;
  });
  return o;
}
function apply(api) { var o = bonusFx(); CT.fx.tec = o; api.mult('civ-tec:ps', o.mult); }
function nOwned(pid) { var n = 0; FLAT.forEach(function (m) { if (m.p === pid && own(m.id)) n++; }); return n; }
function styleName() {
  var best = '', bn = 0, tie = false;
  PATHS.forEach(function (p) { var n = nOwned(p.id); if (n > bn) { bn = n; best = p.st; tie = false; } else if (n === bn && n > 0) tie = true; });
  return !bn ? 'Sem estilo ainda' : tie ? 'Equilibrado' : best;
}

/* ---------- interface ---------- */
function mountUI(root, api) {
  root.classList.add('civ-root');
  root.innerHTML = '<section class="civ-sum" aria-label="Resumo da tecnologia"><div class="civ-sum-r"><b id="ct-t1"></b><span id="ct-t2"></span></div><p id="ct-t3"></p></section>' +
    '<div class="civ-paths" id="ct-paths" role="group" aria-label="Caminhos"></div>' +
    '<ol class="civ-tree" id="ct-tree" aria-label="Árvore do caminho"></ol>' +
    '<section class="civ-sheet" id="ct-sheet" hidden aria-label="Tecnologia selecionada">' +
    '<div class="civ-sh-h"><b id="ct-sn"></b><button type="button" class="civ-x" id="ct-sx" aria-label="Fechar painel">✕</button></div>' +
    '<div class="civ-sh-b"><p class="civ-era" id="ct-se"></p><p id="ct-sd"></p><p class="civ-bn"><b>Efeito: </b><span id="ct-sf"></span></p><p class="civ-warn" id="ct-sw"></p></div>' +
    '<button type="button" class="btn pri civ-act" id="ct-sa"><span class="civ-b1"></span><span class="civ-b2"></span></button></section>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { root: root, t1: q('ct-t1'), t2: q('ct-t2'), t3: q('ct-t3'), paths: q('ct-paths'), tree: q('ct-tree'), sheet: q('ct-sheet'), sn: q('ct-sn'), se: q('ct-se'), sd: q('ct-sd'), sf: q('ct-sf'), sw: q('ct-sw'), sa: q('ct-sa'), pb: {} };
  PATHS.forEach(function (p) {
    var b = CT.el('button', 'chip civ-pth'); b.type = 'button'; b.dataset.act = 'path'; b.dataset.id = p.id; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span aria-hidden="true">' + p.ic + '</span> ' + p.n + ' <small></small>'; UI.paths.appendChild(b); UI.pb[p.id] = b;
  });
  UI.pl = api.list(UI.tree, { key: function (it) { return it.p + it.i; }, create: mkStep });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function mkStep(it) {
  var li = CT.el('li', 'civ-step'), nb = CT.el('span', 'civ-sn', String(it.i + 1)), box = CT.el('div', 'civ-nodes'), btns = [];
  box.setAttribute('data-n', String(it.nodes.length)); li.appendChild(nb); li.appendChild(box);
  it.nodes.forEach(function (n, j) {
    if (j) box.appendChild(CT.el('span', 'civ-or', 'ou'));
    var b = CT.el('button', 'civ-node'); b.type = 'button'; b.dataset.act = 'node'; b.dataset.id = n.id;
    b.innerHTML = '<span class="civ-nic" aria-hidden="true"></span><span class="civ-nt"><b></b><small></small></span><span class="civ-nc"></span>';
    box.appendChild(b); btns.push({ b: b, ic: b.children[0], n: b.children[1].children[0], e: b.children[1].children[1], c: b.children[2], node: n });
  });
  return { el: li, update: function () { var U = apiRef.ui, tr = apiRef.stage().tier, m = apiRef.money(); btns.forEach(function (x) { paintNode(U, x, tr, m); }); } };
}
function paintNode(U, x, tr, money) {
  var n = x.node, s = nstate(n, tr, money), api = apiRef;
  U.text(x.ic, s.k === 'own' ? '✔' : s.k === 'blk' ? '🚫' : s.k === 'lock' ? '🔒' : n.ic); U.text(x.n, n.n); U.text(x.e, CT.fxShort(n.fx));
  U.text(x.c, s.k === 'own' ? 'Pesquisada' : s.k === 'blk' ? 'Bloqueada' : s.k === 'lock' ? (s.era ? CT.tn(api, n.e) : 'Bloqueada') : api.cur + ' ' + api.fmt(s.cost));
  U.data(x.b, 'st', s.k); U.data(x.b, 'sel', sel === n.id ? '1' : '0');
  U.attr(x.b, 'aria-label', n.n + ': ' + CT.fxShort(n.fx) + '. ' + (s.k === 'own' ? 'Pesquisada' : s.k === 'blk' ? 'Bloqueada pela escolha ' + s.by.n : s.k === 'lock' ? s.why : 'Custo ' + api.fmt(s.cost) + ' de ciência'));
}
function render(api) {
  if (!UI) return;
  var U = api.ui, tr = api.stage().tier, money = api.money(), fx = CT.fx.tec || bonusFx(), tot = 0;
  PATHS.forEach(function (p) { var n = nOwned(p.id); tot += n; U.text(UI.pb[p.id].children[1], n + '/' + p.steps.length); U.attr(UI.pb[p.id], 'aria-pressed', String(cur === p.id)); });
  U.text(UI.t1, 'Estilo: ' + styleName()); U.text(UI.t2, 'Tecnologia: +' + CT.r1((fx.mult - 1) * 100) + '% de renda');
  U.text(UI.t3, tot + ' pesquisadas' + (CT.sumLine() ? ' · Descontos: ' + CT.sumLine() : '') + ' · escolhas excludentes são definitivas até a próxima civilização');
  var p = PBY[cur]; UI.pl.set(p.steps.map(function (nodes, i) { return { p: p.id, i: i, nodes: nodes }; }));
  UI.sheet.hidden = !sel;
  if (sel) paintSheet(api, NODE[sel], nstate(NODE[sel], tr, money));
  if (UI.want && sel) CT.reveal(UI.root, UI.want, UI.sheet, api.rm(), 8);
  UI.want = null;
}
function paintSheet(api, n, s) {
  var U = api.ui, a = UI.sa, rq = [];
  U.text(UI.sn, n.ic + ' ' + n.n); U.text(UI.se, PBY[n.p].n + ' · passo ' + (n.i + 1) + ' · requer ' + CT.tn(api, n.e));
  U.text(UI.sd, n.d); U.text(UI.sf, CT.fxText(n.fx, 1));
  var other = n.pair ? n.pair.filter(function (m) { return m !== n; }) : [];
  if (n.x) other = FLAT.filter(function (m) { return m !== n && m.x === n.x; });
  var w = other.length ? (s.k === 'blk' ? 'Bloqueada: você escolheu ' + s.by.n + '.' : s.k === 'own' ? '' : 'Ao escolher, bloqueia para sempre: ' + other.map(function (m) { return m.n; }).join(', ') + '.') : '';
  U.text(UI.sw, w); UI.sw.hidden = !w;
  var lab = s.k === 'own' ? 'Pesquisada ✔' : s.k === 'blk' ? 'Bloqueada' : s.k === 'lock' ? (s.why || 'Bloqueada') : 'Pesquisar';
  U.text(a.children[0], lab);
  U.text(a.children[1], s.cost && s.k !== 'blk' ? api.cur + ' ' + api.fmt(s.cost) + (s.k === 'can' || s.k === 'lock' ? '' : ' · faltam ' + api.fmt(Math.max(0, s.cost - api.money()))) : '');
  U.attr(a, 'aria-disabled', s.k === 'can' ? 'false' : 'true');
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
  if (b.id === 'ct-sx') { sel = ''; api.invalidate(); return; }
  if (b.id === 'ct-sa') { if (sel) research(api, sel); return; }
  if (b.dataset.act === 'path') { cur = b.dataset.id; api.sfx('tap'); api.invalidate(); return; }
  if (b.dataset.act === 'node') { sel = sel === b.dataset.id ? '' : b.dataset.id; UI.want = sel ? b : null; api.sfx('tap'); api.invalidate(); }
}
function research(api, id) {
  var n = NODE[id], s = nstate(n, api.stage().tier, api.money());
  if (!n || s.k === 'own') return { ok: false, msg: 'já' };
  if (s.k === 'blk') { api.toast('Você já escolheu ' + s.by.n + '. Só uma nova civilização muda isso.'); api.sfx('no'); return { ok: false, msg: 'blk' }; }
  if (s.k === 'lock') { api.toast(s.why); api.sfx('no'); return { ok: false, msg: 'lock' }; }
  if (!api.spend(s.cost)) { api.toast('Faltam ' + api.cur + ' ' + api.fmt(s.cost - api.money())); api.sfx('no'); return { ok: false, msg: 'saldo' }; }
  S.n[id] = 1; apply(api);
  api.toast(n.ic + ' ' + n.n + ' pesquisada! ' + CT.fxText(n.fx, 1) + '.'); api.sfx('up'); api.buzz(12);
  var tot = FLAT.filter(function (m) { return own(m.id); }).length;
  api.unlock('ct1'); if (n.x) api.unlock('ct6'); if (tot >= 10) api.unlock('ct10');
  api.save(); api.invalidate();
  return { ok: true, cost: s.cost };
}

Engine.registerTab('civ', {
  id: 'tecnologia', label: 'Árvore', icon: '🌳',
  ach: [
    { id: 'ct1', ic: '💡', n: 'Primeira ideia', d: 'Pesquise sua primeira tecnologia.' },
    { id: 'ct10', ic: '🧠', n: 'Cabeça funcionando', d: 'Pesquise 10 tecnologias.' },
    { id: 'ct6', ic: '🎯', n: 'Doutrina final', d: 'Escolha uma doutrina final de Guerra, Comércio ou Ciência.' }
  ],
  unlock: function (api) { if (!S.u && api.owned('escr') >= 1) S.u = 1; return !!S.u; },
  mount: function (root, api) { apiRef = api; mountUI(root, api); },
  load: function (d, api) {
    S = fresh(); sel = '';
    if (d && typeof d === 'object') {
      S.u = d.u ? 1 : 0;
      if (d.n && typeof d.n === 'object') FLAT.forEach(function (n) { if (d.n[n.id]) S.n[n.id] = 1; });
      FLAT.forEach(function (n) { if (own(n.id) && blocker(n)) delete S.n[n.id]; });      /* save adulterado: respeita as escolhas excludentes */
    }
    apply(api);
  },
  save: function () { return { v: 1, u: S.u, n: S.n }; },
  update: function () { },      /* so existir faz o motor avaliar unlock() a cada tick (a aba fica aberta de vez) */
  show: function (api) { api.invalidate(); },
  render: render,
  onPrestige: function (api) { S.n = {}; sel = ''; apply(api); api.invalidate(); }   /* nova civilização: a árvore recomeça (escolha outro estilo) */
});
CT.tec = { PATHS: PATHS, NODE: NODE, FLAT: FLAT, state: function () { return S; }, costOf: costOf, costNow: costNow, nstate: function (id) { return nstate(NODE[id], apiRef.stage().tier, apiRef.money()); }, research: function (id) { return research(apiRef, id); }, bonus: bonusFx, blocker: blocker };
})();
