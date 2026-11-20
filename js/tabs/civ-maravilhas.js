/* Aba MARAVILHAS da Caverna ao Espaco (plugin: Engine.registerTab). Regras e numeros: docs/TABS_CIV.md.
   Obras longas em tempo real (Date.now), com progresso offline; limite de canteiros simultaneos. */
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
function arches(y, h, n, x0, dx) { var s = '', i; for (i = 0; i < n; i++) s += '<rect x="' + (x0 + i * dx) + '" y="' + y + '" width="3.6" height="' + h + '" rx="1.8" fill="#5b4a2e"/>'; return s; }
function cols(n, x0, dx) { var s = '', i; for (i = 0; i < n; i++) s += '<rect x="' + (x0 + i * dx) + '" y="20" width="5" height="20" fill="#e5e7eb"/>'; return s; }
var ART = {
  giza: '<polygon points="6,44 30,10 54,44" fill="#d9b26f"/><polygon points="30,10 54,44 38,44" fill="#b8924f"/><polygon points="40,44 52,26 62,44" fill="#c9a25f"/><circle cx="52" cy="9" r="5" fill="#fbbf24"/>',
  jardins: '<rect x="8" y="36" width="48" height="8" fill="#a8956f"/><rect x="14" y="26" width="36" height="10" fill="#bba67d"/><rect x="20" y="17" width="24" height="9" fill="#a8956f"/><circle cx="12" cy="34" r="3.5" fill="#4ade80"/><circle cx="52" cy="34" r="3.5" fill="#4ade80"/><circle cx="18" cy="24" r="3.5" fill="#22c55e"/><circle cx="46" cy="24" r="3.5" fill="#22c55e"/><circle cx="26" cy="15" r="3" fill="#4ade80"/><circle cx="38" cy="15" r="3" fill="#4ade80"/><rect x="29" y="7" width="6" height="10" fill="#a8956f"/>',
  zeus: '<rect x="18" y="12" width="4" height="30" fill="#8b6b3e"/><rect x="42" y="22" width="4" height="20" fill="#8b6b3e"/><rect x="22" y="29" width="22" height="9" fill="#f1e4c3"/><rect x="26" y="15" width="12" height="14" fill="#fcd34d"/><circle cx="32" cy="10" r="5" fill="#f1e4c3"/><rect x="48" y="6" width="2.5" height="36" fill="#fbbf24"/><rect x="12" y="41" width="40" height="4" fill="#a8a29e"/>',
  farol: '<polygon points="26,44 38,44 35,16 29,16" fill="#e5e7eb"/><rect x="28" y="11" width="8" height="6" fill="#cbd5e1"/><polygon points="32,2 37,10 27,10" fill="#fbbf24"/><path d="M38 9 L60 3 M38 9 L62 13" stroke="#fde68a" stroke-width="1.6"/><path d="M0 44 q5 -4 10 0 t10 0 t10 0 t10 0 t10 0 t10 0 t8 0" stroke="#60a5fa" fill="none" stroke-width="2.4"/>',
  biblio: '<polygon points="7,17 32,5 57,17" fill="#cbd5e1"/><rect x="9" y="17" width="46" height="3" fill="#94a3b8"/>' + cols(5, 12, 10) + '<rect x="7" y="40" width="50" height="5" fill="#94a3b8"/>',
  muralha: '<path d="M0 44 L10 30 L20 36 L30 22 L42 30 L52 14 L64 20 L64 44 Z" fill="#475569"/><path d="M2 34 L12 26 L22 31 L32 17 L44 25 L54 9 L62 13" stroke="#d9b26f" stroke-width="4" fill="none"/><rect x="29" y="10" width="6" height="8" fill="#b8924f"/><rect x="51" y="2" width="6" height="8" fill="#b8924f"/><rect x="9" y="20" width="6" height="8" fill="#b8924f"/>',
  coliseu: '<path d="M3 34 Q3 12 32 12 Q61 12 61 34 L61 43 L3 43 Z" fill="#c8a977"/>' + arches(17, 7, 7, 9, 7.5) + arches(28, 8, 7, 9, 7.5) + '<rect x="3" y="43" width="58" height="3" fill="#8b7a55"/>',
  angkor: '<polygon points="28,42 36,42 34,13 32,4 30,13" fill="#a3a38f"/><polygon points="13,42 21,42 19,23 17,15 15,23" fill="#8f8f7d"/><polygon points="43,42 51,42 49,23 47,15 45,23" fill="#8f8f7d"/><rect x="8" y="38" width="48" height="5" fill="#7c7c6c"/><rect x="0" y="44" width="64" height="4" fill="#60a5fa"/>',
  chichen: '<polygon points="8,44 56,44 52,36 12,36" fill="#cbbf9f"/><polygon points="12,36 52,36 48,28 16,28" fill="#bfb28f"/><polygon points="16,28 48,28 44,20 20,20" fill="#cbbf9f"/><rect x="25" y="11" width="14" height="9" fill="#a39770"/><rect x="29" y="14" width="6" height="6" fill="#4b4328"/><rect x="29" y="20" width="6" height="24" fill="#a39770"/>',
  machu: '<polygon points="0,44 18,16 30,32 44,6 64,44" fill="#4d7c5b"/><path d="M10 44 h24 M14 40 h20 M18 36 h16" stroke="#a3d9a5" stroke-width="2"/><rect x="36" y="33" width="11" height="8" fill="#b8b3a3"/><polygon points="36,33 41.5,28 47,33" fill="#8f8a7a"/>',
  taj: '<rect x="14" y="30" width="36" height="14" fill="#f3f4f6"/><path d="M20 30 Q32 4 44 30 Z" fill="#f9fafb"/><rect x="31" y="2" width="2" height="7" fill="#fbbf24"/><rect x="6" y="18" width="4" height="26" fill="#e5e7eb"/><rect x="54" y="18" width="4" height="26" fill="#e5e7eb"/><circle cx="8" cy="17" r="3" fill="#f3f4f6"/><circle cx="56" cy="17" r="3" fill="#f3f4f6"/><path d="M29 44 v-8 q3 -5 6 0 v8 Z" fill="#475569"/>',
  eiffel: '<polygon points="32,2 36,20 40,34 47,44 40,44 32,30 24,44 17,44 24,34 28,20" fill="#a8a29e"/><path d="M27 25 H37 M24 34 H40" stroke="#d6d3d1" stroke-width="2"/><rect x="26" y="19" width="12" height="2.5" fill="#d6d3d1"/><path d="M26 44 Q32 36 38 44" stroke="#78716c" stroke-width="2" fill="none"/>',
  cristo: '<path d="M0 44 Q32 16 64 44 Z" fill="#4d7c5b"/><rect x="26" y="24" width="12" height="10" fill="#cbd5e1"/><rect x="30" y="9" width="4" height="15" fill="#f1f5f9"/><rect x="14" y="12" width="36" height="3.6" fill="#f1f5f9"/><circle cx="32" cy="7" r="3.2" fill="#f1f5f9"/>',
  iss: '<rect x="8" y="22" width="48" height="3" fill="#cbd5e1"/><rect x="26" y="17" width="12" height="12" rx="2" fill="#e5e7eb"/><rect x="6" y="8" width="12" height="9" fill="#38bdf8"/><rect x="6" y="30" width="12" height="9" fill="#38bdf8"/><rect x="46" y="8" width="12" height="9" fill="#38bdf8"/><rect x="46" y="30" width="12" height="9" fill="#38bdf8"/><path d="M0 48 Q32 38 64 48 Z" fill="#2563eb"/>',
  apollo: '<circle cx="52" cy="11" r="7" fill="#cbd5e1"/><rect x="27" y="8" width="9" height="30" fill="#f1f5f9"/><polygon points="27,8 31.5,0 36,8" fill="#e5e7eb"/><polygon points="27,33 20,42 27,40" fill="#94a3b8"/><polygon points="36,33 43,42 36,40" fill="#94a3b8"/><rect x="27" y="18" width="9" height="3" fill="#0f172a"/><polygon points="28,38 35,38 31.5,47" fill="#fb923c"/>'
};
/* e = era minima; dur = segundos de obra (tempo real); v = valor do bonus (% de renda equivalente) p/ o custo; k = fator de custo dentro da era */
var WON = [
  { id: 'giza', n: 'Pirâmide de Gizé', e: 2, dur: 360, v: 0.6, k: 1, fx: { slot: 1 }, bn: 'Canteiros organizados', yr: 'c. 2560 a.C. · Egito',
    fun: 'Feita para o faraó Quéops, foi o edifício mais alto do mundo por cerca de 3.800 anos. Os operários eram equipes organizadas, com direito a pão, cerveja e cuidados médicos.' },
  { id: 'jardins', n: 'Jardins Suspensos da Babilônia', e: 2, dur: 480, v: 0.5, k: 1.2, fx: { ps: 0.5 }, bn: 'Irrigação elegante', yr: 'Lenda · Babilônia',
    fun: 'É a única das Sete Maravilhas da Antiguidade cuja existência nunca foi confirmada pela arqueologia. Alguns estudiosos sugerem que ficavam em Nínive, e não na Babilônia.' },
  { id: 'zeus', n: 'Estátua de Zeus em Olímpia', e: 2, dur: 480, v: 0.6, k: 1.5, fx: { d: { mar: 8 } }, bn: 'Mestre Fídias', yr: 'c. 435 a.C. · Grécia',
    fun: 'Obra do escultor Fídias, tinha cerca de 12 metros, com marfim e ouro sobre uma estrutura de madeira. Ficava em Olímpia, sede dos Jogos Olímpicos antigos.' },
  { id: 'farol', n: 'Farol de Alexandria', e: 2, dur: 600, v: 0.55, k: 1.9, fx: { d: { map: 8 } }, bn: 'Rotas bem iluminadas', yr: 'c. 280 a.C. · Egito',
    fun: 'Erguido na ilha de Faros, guiou navios por mais de mil anos. A palavra "farol" vem de seu nome. Terremotos o derrubaram na Idade Média.' },
  { id: 'biblio', n: 'Biblioteca de Alexandria', e: 2, dur: 720, v: 0.6, k: 2.4, fx: { d: { tec: 8 } }, bn: 'Acervo do mundo', yr: 'séc. III a.C. · Egito',
    fun: 'Fundada sob os Ptolomeus, queria reunir o saber de todos os povos. Não sumiu em um único incêndio: o declínio foi gradual, ao longo de séculos.' },
  { id: 'muralha', n: 'Muralha da China', e: 2, dur: 840, v: 0.8, k: 3, fx: { ps: 0.8 }, bn: 'Fronteira segura', yr: 'a partir de c. 220 a.C. · China',
    fun: 'Trechos antigos foram unidos sob Qin Shi Huang, mas a muralha que se vê hoje é em grande parte da dinastia Ming. E não, não dá para vê-la do espaço a olho nu.' },
  { id: 'coliseu', n: 'Coliseu', e: 2, dur: 840, v: 0.7, k: 3.6, fx: { ps: 0.7 }, bn: 'Pão e circo', yr: '80 d.C. · Roma',
    fun: 'Seu nome oficial é Anfiteatro Flávio. Recebia cerca de 50 mil espectadores e tinha saídas planejadas para esvaziar rápido, sem fila no banheiro (ou quase).' },
  { id: 'angkor', n: 'Angkor Wat', e: 2, dur: 960, v: 0.7, k: 4.4, fx: { ps: 0.7 }, bn: 'Reservatórios e canais', yr: 'início do séc. XII · Camboja',
    fun: 'Erguido no reinado de Suryavarman II, é o maior monumento religioso do mundo e aparece na bandeira do Camboja.' },
  { id: 'chichen', n: 'Chichén Itzá', e: 2, dur: 900, v: 0.55, k: 5.2, fx: { t: 8 }, bn: 'Calendário na pedra', yr: 'c. 600 a 1200 d.C. · México',
    fun: 'Nos equinócios, a luz e a sombra desenham uma serpente descendo a escadaria do Castelo. Cada lado tem 91 degraus; com a plataforma, são 365.' },
  { id: 'taj', n: 'Taj Mahal', e: 3, dur: 1200, v: 0.9, fx: { ps: 0.9 }, bn: 'Mármore e simetria', yr: '1632 a 1653 · Índia',
    fun: 'Mausoléu mandado erguer pelo imperador Shah Jahan em memória de sua esposa Mumtaz Mahal. As obras duraram cerca de 20 anos.' },
  { id: 'machu', n: 'Machu Picchu', e: 3, dur: 1080, v: 0.8, fx: { ps: 0.8 }, bn: 'Terraços produtivos', yr: 'c. 1450 · Peru',
    fun: 'Cidadela inca nos Andes, Patrimônio Mundial da UNESCO desde 1983. Tornou-se famosa no mundo todo em 1911, com o explorador Hiram Bingham.' },
  { id: 'eiffel', n: 'Torre Eiffel', e: 3, dur: 1200, v: 0.9, fx: { ps: 0.5, slot: 1 }, bn: 'Estrutura de ferro', yr: '1889 · França',
    fun: 'Feita para a Exposição Universal de 1889, devia ser desmontada depois de 20 anos. Ficou porque servia de antena de rádio.' },
  { id: 'cristo', n: 'Cristo Redentor', e: 3, dur: 1200, v: 0.8, fx: { ps: 0.8 }, bn: 'Vista privilegiada', yr: '1931 · Brasil',
    fun: 'Inaugurado em 12 de outubro de 1931, no Corcovado, tem 30 metros de altura, fora o pedestal de 8 metros. É de concreto armado revestido de pedra-sabão.' },
  { id: 'iss', n: 'Estação Espacial Internacional', e: 4, dur: 1500, v: 0.9, fx: { ps: 0.9 }, bn: 'Laboratório em órbita', yr: '1998 · órbita da Terra',
    fun: 'O primeiro módulo subiu em 1998 e há tripulação a bordo sem interrupção desde 2 de novembro de 2000. Uma volta na Terra leva cerca de 90 minutos: são uns 16 nasceres do sol por dia.' },
  { id: 'apollo', n: 'Programa Apollo', e: 4, dur: 1800, v: 1.0, fx: { ps: 1.0 }, bn: 'Um grande salto', yr: '1969 · Lua',
    fun: 'A Apollo 11 pousou na Lua em 20 de julho de 1969. Ao todo, 12 astronautas caminharam na superfície lunar, em seis missões.' }
];
var BY = {}; WON.forEach(function (w) { BY[w.id] = w; });
function art(id, cls) { return '<svg class="' + cls + '" viewBox="0 0 64 48" aria-hidden="true" focusable="false">' + ART[id] + '</svg>'; }

var S = fresh(), UI = null, sel = '', apiRef = null, arm = '', armT = 0;
function fresh() { return { v: 1, u: 0, b: {}, q: [] }; }
function built(id) { return !!S.b[id]; }
function queued(id) { for (var i = 0; i < S.q.length; i++) if (S.q[i].id === id) return S.q[i]; return null; }
function costOf(w) { return CT.cost(w.e, w.v * (w.k || 1), CT.PB.mar); }      /* k = sobe o custo das obras da mesma era, em ordem */
function costNow(w) { return Math.max(1, Math.round(costOf(w) * (1 - CT.disc('mar')))); }
function durNow(w) { return Math.max(30, Math.round(w.dur * (1 - CT.fast()))); }
function slots() { return CT.slots(); }
function bonusFx() {
  var o = { ps: 0, mult: 1, d: { map: 0, tec: 0, mar: 0 }, t: 0, slot: 0 };
  WON.forEach(function (w) {
    if (!built(w.id)) return; var f = w.fx;
    if (f.ps) { o.ps += f.ps; o.mult *= 1 + f.ps / 100; }
    if (f.d) for (var c in f.d) o.d[c] += f.d[c];
    if (f.t) o.t += f.t;
    if (f.slot) o.slot += f.slot;
  });
  return o;
}
function apply(api) { var o = bonusFx(); CT.fx.mar = o; api.mult('civ-mar:ps', o.mult); }
function prog(q, now) { return Math.max(0, Math.min(1, (now - q.s) / Math.max(1, q.e - q.s))); }
function finish(api, silent) {          /* conclui obras cujo prazo passou (inclusive enquanto o jogo estava fechado) */
  var now = CT.clock(), done = [], keep = [];
  S.q.forEach(function (q) { if (now >= q.e) done.push(q); else keep.push(q); });
  if (!done.length) return 0;
  S.q = keep; done.forEach(function (q) { S.b[q.id] = 1; });
  apply(api); ach(api);
  if (!silent) {
    if (done.length === 1) { var w = BY[done[0].id]; api.toast('🏛️ ' + w.n + ' concluída! ' + CT.fxText(w.fx, 1) + '.', { ms: 6000 }); api.banner(w.n); }
    else api.toast('🏛️ ' + done.length + ' maravilhas concluídas: ' + done.map(function (q) { return BY[q.id].n; }).join(', ') + '.', { ms: 7000 });
    api.sfx('up'); api.buzz([20, 40, 20]); api.save();
  }
  api.invalidate();
  return done.length;
}
function ach(api) {
  var n = Object.keys(S.b).length;
  if (n >= 1) api.unlock('cw1'); if (n >= 5) api.unlock('cw5'); if (n >= WON.length) api.unlock('cw15');
}
function wstate(w, tr, money) {
  if (built(w.id)) return { k: 'done' };
  var q = queued(w.id); if (q) return { k: 'build', q: q };
  if (tr < w.e) return { k: 'lock', why: 'Requer ' + CT.tn(apiRef, w.e) };
  var c = costNow(w);
  if (S.q.length >= slots()) return { k: 'full', cost: c };
  return { k: money >= c ? 'can' : 'ok', cost: c };
}
function start(api, id) {
  var w = BY[id], s = wstate(w, api.stage().tier, api.money());
  if (!w || s.k === 'done' || s.k === 'build') return { ok: false, msg: 'já' };
  if (s.k === 'lock') { api.toast(s.why + ' para esta obra.'); api.sfx('no'); return { ok: false, msg: 'lock' }; }
  if (s.k === 'full') { api.toast('Todos os canteiros estão ocupados (' + slots() + '). Espere uma obra terminar.'); api.sfx('no'); return { ok: false, msg: 'slots' }; }
  if (!api.spend(s.cost)) { api.toast('Faltam ' + api.cur + ' ' + api.fmt(s.cost - api.money())); api.sfx('no'); return { ok: false, msg: 'saldo' }; }
  var now = CT.clock(), d = durNow(w);
  S.q.push({ id: id, s: now, e: now + d * 1000, c: s.cost });
  api.toast('🚧 Obra iniciada: ' + w.n + ' (' + api.fmtT(d) + '). Pode fechar o jogo: ela continua.'); api.sfx('buy'); api.buzz(12);
  api.save(); api.invalidate();
  return { ok: true, cost: s.cost, dur: d };
}
function cancel(api, id) {
  var q = queued(id); if (!q) return { ok: false };
  var back = Math.floor(q.c * 0.5); S.q = S.q.filter(function (x) { return x !== q; });
  api.earn(back, false); api.toast('Obra cancelada: ' + api.cur + ' ' + api.fmt(back) + ' devolvidos (50%).'); api.sfx('no');
  api.save(); api.invalidate();
  return { ok: true, back: back };
}

/* ---------- interface ---------- */
function mountUI(root, api) {
  root.classList.add('civ-root');
  root.innerHTML = '<section class="civ-sum" aria-label="Resumo das maravilhas"><div class="civ-sum-r"><b id="cw-t1"></b><span id="cw-t2"></span></div><p id="cw-t3"></p></section>' +
    '<ul class="civ-wl" id="cw-list" aria-label="Maravilhas"></ul>' +
    '<section class="civ-sheet" id="cw-sheet" hidden aria-label="Maravilha selecionada">' +
    '<div class="civ-sh-h"><b id="cw-sn"></b><button type="button" class="civ-x" id="cw-sx" aria-label="Fechar painel">✕</button></div>' +
    '<div class="civ-sh-b civ-sh-w"><div class="civ-sh-art" id="cw-art"></div><div><p class="civ-era" id="cw-se"></p><p class="civ-bn"><b id="cw-sb"></b><span id="cw-sbt"></span></p><p id="cw-sd"></p></div></div>' +
    '<div class="civ-sh-b"><p class="civ-fun" id="cw-sf"></p></div>' +
    '<button type="button" class="btn pri civ-act" id="cw-sa"><span class="civ-b1"></span><span class="civ-b2"></span></button></section>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { root: root, t1: q('cw-t1'), t2: q('cw-t2'), t3: q('cw-t3'), list: q('cw-list'), sheet: q('cw-sheet'), sn: q('cw-sn'), se: q('cw-se'), sb: q('cw-sb'), sbt: q('cw-sbt'), sd: q('cw-sd'), sf: q('cw-sf'), sa: q('cw-sa'), art: q('cw-art'), artId: '' };
  UI.pl = api.list(UI.list, { key: function (it) { return it.w.id; }, create: mkCard });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function mkCard(it) {
  var li = CT.el('li', 'civ-wi'), b = CT.el('button', 'civ-wc'); b.type = 'button'; b.dataset.act = 'sel'; b.dataset.id = it.w.id;
  b.innerHTML = art(it.w.id, 'civ-ill') + '<span class="civ-wt"><b></b><small></small><span class="civ-wbar"><i></i></span><em></em></span>';
  li.appendChild(b);
  var t = b.children[1], u = { n: t.children[0], y: t.children[1], bar: t.children[2].children[0], barw: t.children[2], s: t.children[3] };
  u.n.textContent = it.w.n; u.y.textContent = it.w.yr;
  return { el: li, update: function (d) { paintCard(u, b, d); } };
}
function paintCard(u, b, d) {
  var U = apiRef.ui, w = d.w, s = d.s, api = apiRef, bonus = CT.fxShort(w.fx);
  var txt = s.k === 'done' ? '✔ Concluída · ' + bonus : s.k === 'build' ? '🚧 ' + api.fmtT(Math.max(0, (s.q.e - CT.clock()) / 1000)) + ' restantes · ' + bonus :
    s.k === 'lock' ? '🔒 ' + s.why : api.cur + ' ' + api.fmt(s.cost) + ' · ' + api.fmtT(durNow(w)) + ' · ' + bonus;
  U.text(u.s, txt); u.barw.hidden = s.k !== 'build'; if (s.k === 'build') U.bar(u.bar, prog(s.q, CT.clock()));
  U.data(b, 'st', s.k); U.data(b, 'sel', sel === w.id ? '1' : '0');
  U.attr(b, 'aria-label', w.n + ', ' + w.yr + '. ' + txt);
}
var RANK = { build: 0, can: 1, ok: 1, full: 1, lock: 2, done: 3 };
function render(api) {
  if (!UI) return;
  var U = api.ui, tr = api.stage().tier, money = api.money(), items = [], nb = Object.keys(S.b).length, fx = CT.fx.mar || bonusFx(), now = CT.clock();
  WON.forEach(function (w, i) { items.push({ w: w, s: wstate(w, tr, money), i: i, t: now }); });
  items.sort(function (a, b) { return RANK[a.s.k] - RANK[b.s.k] || a.i - b.i; });
  UI.pl.set(items);
  U.text(UI.t1, nb + '/' + WON.length + ' maravilhas'); U.text(UI.t2, 'Obras: ' + S.q.length + '/' + slots() + ' · +' + CT.r1((fx.mult - 1) * 100) + '% de renda');
  U.text(UI.t3, S.q.length ? 'Em construção: ' + S.q.map(function (q) { return BY[q.id].n; }).join(', ') : 'Nenhuma obra em andamento. Elas continuam com o jogo fechado.');
  UI.sheet.hidden = !sel;
  if (sel) paintSheet(api, BY[sel], wstate(BY[sel], tr, money));
  if (UI.want && sel) CT.reveal(UI.root, UI.want, UI.sheet, api.rm(), 8);
  UI.want = null;
}
function paintSheet(api, w, s) {
  var U = api.ui, a = UI.sa, armed = arm === w.id && api.now() < armT;
  if (UI.artId !== w.id) { UI.artId = w.id; UI.art.innerHTML = art(w.id, 'civ-ill civ-ill-big'); }
  U.text(UI.sn, w.n); U.text(UI.se, w.yr + (s.k === 'lock' ? ' · ' + s.why.toLowerCase() : '')); U.text(UI.sb, w.bn + ': '); U.text(UI.sbt, CT.fxText(w.fx, 1));
  U.text(UI.sd, s.k === 'build' ? 'Em obra: ' + api.fmtT(Math.max(0, (s.q.e - CT.clock()) / 1000)) + ' restantes.' : s.k === 'done' ? 'Concluída e ativa.' : 'Duração: ' + api.fmtT(durNow(w)) + ' de tempo real, mesmo offline.');
  U.text(UI.sf, s.k === 'done' ? '📜 ' + w.fun : 'Construa para revelar uma curiosidade.');
  var lab, sub = '', dis = true;
  if (s.k === 'done') lab = 'Maravilha concluída ✔';
  else if (s.k === 'build') { lab = armed ? 'Toque de novo para cancelar' : 'Cancelar obra'; sub = 'devolve ' + api.cur + ' ' + api.fmt(Math.floor(s.q.c * 0.5)) + ' (50%)'; dis = false; }
  else if (s.k === 'lock') lab = s.why;
  else if (s.k === 'full') { lab = 'Canteiros ocupados'; sub = api.cur + ' ' + api.fmt(s.cost); }
  else { lab = 'Construir'; sub = api.cur + ' ' + api.fmt(s.cost) + ' · ' + api.fmtT(durNow(w)) + (s.k === 'can' ? '' : ' · faltam ' + api.fmt(Math.max(0, s.cost - api.money()))); dis = s.k !== 'can'; }
  U.text(a.children[0], lab); U.text(a.children[1], sub); U.attr(a, 'aria-disabled', dis ? 'true' : 'false'); U.data(a, 'k', s.k);
  a.classList.toggle('danger', s.k === 'build');
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('button') : null; if (!b) return;
  if (b.id === 'cw-sx') { sel = ''; api.invalidate(); return; }
  if (b.id === 'cw-sa') {
    if (!sel) return;
    if (queued(sel)) { if (arm === sel && api.now() < armT) { arm = ''; cancel(api, sel); } else { arm = sel; armT = api.now() + 4; api.toast('Toque de novo para cancelar (devolve 50%).'); api.invalidate(); } return; }
    start(api, sel); return;
  }
  if (b.dataset.act === 'sel') { sel = sel === b.dataset.id ? '' : b.dataset.id; UI.want = sel ? b : null; api.sfx('tap'); api.invalidate(); }
}

Engine.registerTab('civ', {
  id: 'maravilhas', label: 'Maravilhas', icon: '🏛️',
  ach: [
    { id: 'cw1', ic: '🧱', n: 'Primeira pedra', d: 'Conclua uma maravilha.' },
    { id: 'cw5', ic: '🏛️', n: 'Cidade turística', d: 'Conclua 5 maravilhas.' },
    { id: 'cw15', ic: '🌟', n: 'Patrimônio da Humanidade', d: 'Conclua as 15 maravilhas.' }
  ],
  unlock: function (api) { if (!S.u && api.owned('cid') >= 1) S.u = 1; return !!S.u; },
  mount: function (root, api) { apiRef = api; mountUI(root, api); },
  load: function (d, api) {
    S = fresh(); sel = ''; arm = '';
    var now = CT.clock();
    if (d && typeof d === 'object') {
      S.u = d.u ? 1 : 0;
      if (d.b && typeof d.b === 'object') WON.forEach(function (w) { if (d.b[w.id]) S.b[w.id] = 1; });
      if (Array.isArray(d.q)) d.q.slice(0, 5).forEach(function (q) {
        if (!q || !BY[q.id] || S.b[q.id] || queued(q.id)) return;
        var s = +q.s, e = +q.e, c = +q.c; if (!isFinite(s) || !isFinite(e) || !isFinite(c)) return;
        s = Math.min(s, now); e = Math.max(e, s + 1000); e = Math.min(e, s + 3 * 3600 * 1000);   /* relogio adulterado nao cria obras infinitas */
        S.q.push({ id: q.id, s: s, e: e, c: Math.max(0, c) });
      });
    }
    apply(api); finish(api, true);
  },
  save: function () { return { v: 1, u: S.u, b: S.b, q: S.q }; },
  update: function (dt, api) {
    if (S.q.length) {
      var now = CT.clock(); S.q.forEach(function (q) { if (q.s - now > 60000) { q.e -= q.s - now; q.s = now; } });   /* relogio voltou: nao trava a obra */
      finish(api, false);
    }
  },
  show: function (api) { api.invalidate(); },
  render: render,
  onPrestige: function (api) { apply(api); api.invalidate(); }   /* maravilhas (e obras em andamento) sao patrimônio: permanecem na nova civilização */
});
CT.mar = { WON: WON, ART: ART, state: function () { return S; }, costOf: costOf, costNow: costNow, durNow: durNow, slots: slots, start: function (id) { return start(apiRef, id); }, cancel: function (id) { return cancel(apiRef, id); }, bonus: bonusFx, finish: function () { return finish(apiRef, false); } };
})();
