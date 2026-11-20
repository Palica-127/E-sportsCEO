/* Aba MERCADO do Time de eSports (plugin: Engine.registerTab). Jogadores reais do BrasLOL (js/data/jogadores.js).
   Regras e numeros: docs/LOL_MERCADO.md. Contrato com a cena: x.roster (ver docs). */
(function () {
'use strict';
var G = GAMES.esp, C = G.mk, PL = window.PLAYERS || [];
var ROLES = ['TOP', 'JNG', 'MID', 'ADC', 'SUP'];
var RN = { TOP: 'Top', JNG: 'Selva', MID: 'Meio', ADC: 'Atirador', SUP: 'Suporte' };
var RC = { TOP: '#f97316', JNG: '#22c55e', MID: '#60a5fa', ADC: '#f87171', SUP: '#facc15' };
var RI = { TOP: '🛡️', JNG: '🌲', MID: '🔮', ADC: '🏹', SUP: '💚' };
var LEAGUES = ['CBLOL', 'LCS', 'LEC', 'LCK', 'LPL', 'LCP'];
var BYID = {}, LOW = {};
PL.forEach(function (p) { BYID[p.id] = p; });
(function () { /* T2 mostra os de menor nota de cada funcao da liga */
  var grp = {};
  PL.forEach(function (p) { var k = p.l + '|' + p.r; (grp[k] = grp[k] || []).push(p); });
  Object.keys(grp).forEach(function (k) {
    var a = grp[k].sort(function (x, y) { return x.o - y.o || (x.id < y.id ? -1 : 1); });
    a.slice(0, Math.max(1, Math.ceil(a.length * C.lowFrac))).forEach(function (p) { LOW[p.id] = 1; });
  });
})();

function r2(n) { var e = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.max(1, Math.round(n / e) * e); }
function isImp(p, reg) { return p.l !== G.regions[reg].l; }
function base(o) { return C.P0 * Math.exp(C.kp * Math.min(o - 74, C.knee - 74) + C.kp2 * Math.max(0, o - C.knee)); }
function price(p, reg) { return r2(base(p.o) * (isImp(p, reg) ? C.agio : 1)); }
function subPrice(p, reg) { return r2(price(p, reg) * C.subF); }
function mult(o) { return C.m74 * Math.exp(C.mk * (o - 74)); }
function subBonus(o) { return C.sb74 + (C.sb96 - C.sb74) * (o - 74) / 22; }
function initials(n) { var t = n.replace(/[^A-Za-z0-9À-ÿ ]/g, '').trim().split(/\s+/); return (t.length > 1 ? t[0][0] + t[1][0] : (t[0] || '?').slice(0, 2)).toUpperCase(); }

/* ---------- estado ---------- */
var S = { s: [null, null, null, null, null], b: [null, null], v: 0, v0: 0 }, A = null, sigPrev = '', view = null;
function ctx(api) { var sh = api.shared; return { reg: G.regions[sh.region] ? sh.region : 'BR', div: sh.division === 'T1' ? 'T1' : 'T2', intl: !!sh.intl }; }
function nReal(arr) { var n = 0; arr.forEach(function (e) { if (e) n++; }); return n; }
function nImp() { var n = 0; S.s.concat(S.b).forEach(function (e) { if (e && e.imp) n++; }); return n; }
function avail(p, c) {
  var imp = isImp(p, c.reg), own = G.regions[c.reg].l;
  if (!imp) return c.div === 'T1' || LOW[p.id] ? { ok: true } : { ok: false, why: 'Sobe com a promoção para o ' + own };
  if (c.div !== 'T1') return { ok: false, why: 'Imports só depois da promoção' };
  if ((p.l === 'LCK' || p.l === 'LPL') && !c.intl) return { ok: false, why: 'Dispute o MSI ou o Mundial' };
  return { ok: true, imp: true };
}
/* vagas: reais + genericas derivadas de o[tit] / o[res] */
function build(api) {
  var o = api.owned('tit'), ob = api.owned('res'), i, gen, k;
  var st = [], sb = [];
  gen = Math.max(0, o - nReal(S.s)); k = 0;
  for (i = 0; i < 5; i++) {
    var e = S.s[i];
    if (e) { var p = BYID[e.id]; st.push({ n: p.n, r: p.r, real: true, o: p.o, p: p, e: e, slot: i }); }
    else if (k < gen) { k++; st.push({ n: 'Amador ' + k, r: ROLES[i], real: false, o: C.genNota, slot: i, gen: true }); }
    else st.push(null);
  }
  gen = Math.max(0, ob - nReal(S.b)); k = 0;
  for (i = 0; i < 2; i++) {
    var e2 = S.b[i];
    if (e2) { var p2 = BYID[e2.id]; sb.push({ n: p2.n, r: p2.r, real: true, o: p2.o, p: p2, e: e2, slot: i }); }
    else if (k < gen) { k++; sb.push({ n: 'Reserva ' + k, r: ROLES[i], real: false, o: C.genNota, slot: i, gen: true }); }
    else sb.push(null);
  }
  return { st: st, sb: sb };
}
function effects(api) {
  var ex = 0, sbm = 0, sum = 0, subS = 0;
  view = build(api);
  view.st.forEach(function (x) { if (x && x.real) { ex += mult(x.o) - 1; sum += x.o; } else sum += x ? C.genNota : C.emptyNota; });
  view.sb.forEach(function (x) { if (x && x.real) { sbm += subBonus(x.o); subS += (x.o - 70) * C.subS; } });
  api.setExtra('mkt', 'tit', ex); api.mult('mkt:subs', 1 + sbm);
  api.shared.avg5 = sum / 5; api.shared.subS = subS; api.shared.nReal = nReal(S.s); api.shared.imports = nImp();
  var rs = {}; rs.starters = view.st.map(function (x) { return x && { n: x.n, r: x.r, real: !!x.real, o: x.o }; });
  rs.subs = view.sb.map(function (x) { return x && { n: x.n, r: x.r, real: !!x.real, o: x.o }; });
  S.roster = rs; S.v++;
}
function ensure(api) { /* o[tit] >= reais */
  if (api.owned('tit') < nReal(S.s)) api.setOwned('tit', nReal(S.s));
  if (api.owned('res') < nReal(S.b)) api.setOwned('res', nReal(S.b));
}
function sync(api, force) {
  ensure(api);
  var sig = api.owned('tit') + ',' + api.owned('res') + ',' + S.v0 + ',' + (api.shared.division || '') + (api.shared.region || '');
  if (force || sig !== sigPrev) { sigPrev = sig; effects(api); if (UI) UI.dirty = true; api.invalidate(); }
}
function hireCore(api, id, asSub, replace) {
  var p = BYID[id], c = ctx(api); if (!p) return { ok: false, msg: 'Jogador não encontrado' };
  var av = avail(p, c); if (!av.ok) return { ok: false, msg: av.why };
  var arr = asSub ? S.b : S.s, slot, old, cost = asSub ? subPrice(p, c.reg) : price(p, c.reg), imp = isImp(p, c.reg);
  if (S.s.concat(S.b).some(function (e) { return e && e.id === id; })) return { ok: false, msg: 'Já está no elenco' };
  if (asSub) { slot = arr.indexOf(null); if (slot < 0) return { ok: false, msg: 'Reservas cheias: dispense um antes', need: 'full' }; }
  else { slot = ROLES.indexOf(p.r); }
  old = arr[slot];
  if (old && !replace) return { ok: false, need: 'replace', msg: 'A vaga está ocupada' };
  var impAfter = nImp() - (old && old.imp ? 1 : 0) + (imp ? 1 : 0);
  if (impAfter > C.importMax) return { ok: false, msg: 'Limite de ' + C.importMax + ' importados no elenco' };
  var refund = old ? Math.floor(old.paid * C.refund) : 0;
  if (api.money() + refund < cost) return { ok: false, msg: 'Faltam ' + api.cur + ' ' + api.fmt(cost - refund - api.money()), poor: true };
  if (refund) api.earn(refund, false);
  api.spend(cost);
  var wasGen = false, v = build(api);
  if (!old) { var cur = (asSub ? v.sb : v.st)[slot]; wasGen = !!(cur && cur.gen); }
  arr[slot] = { id: id, paid: cost, imp: imp ? 1 : 0 };
  if (!old && !wasGen) { var it = asSub ? 'res' : 'tit'; api.setOwned(it, api.owned(it) + 1); }
  S.v0++; sync(api, true);
  return { ok: true, msg: p.n + ' contratado' + (asSub ? ' (reserva)' : '') + ' por ' + api.cur + ' ' + api.fmt(cost), p: p, cost: cost };
}
function fireCore(api, asSub, slot) {
  var arr = asSub ? S.b : S.s, e = arr[slot]; if (!e) return { ok: false };
  var back = Math.floor(e.paid * C.refund); api.earn(back, false); arr[slot] = null;
  var it = asSub ? 'res' : 'tit'; api.setOwned(it, Math.max(0, api.owned(it) - 1));
  S.v0++; sync(api, true);
  return { ok: true, msg: BYID[e.id].n + ' dispensado: +' + api.cur + ' ' + api.fmt(back), back: back };
}
function gainHire(api, p, asSub) {
  var c = ctx(api), v = view || build(api), base = api.previewPs({}), i;
  if (asSub) {
    var cur = 0; v.sb.forEach(function (x) { if (x && x.real) cur += subBonus(x.o); });
    var slot = S.b.indexOf(null), occ = slot >= 0 ? v.sb[slot] : null;
    return api.previewPs({ mult: { 'mkt:subs': 1 + cur + subBonus(p.o) }, owned: occ && occ.gen ? {} : { res: 1 } }) - base;
  }
  i = ROLES.indexOf(p.r); var o = v.st[i], m = mult(p.o);
  if (o && o.real) return api.previewPs({ extra: { tit: m - mult(o.o) } }) - base;
  if (o && o.gen) return api.previewPs({ extra: { tit: m - 1 } }) - base;
  return api.previewPs({ extra: { tit: m - 1 }, owned: { tit: 1 } }) - base;
}

/* ---------- interface ---------- */
var NOIMG = {}, UI = null, arm = { k: '', until: 0 }, F = { role: 'ALL', lg: '', sort: 0, q: '', open: false, shown: 20, ros: true }, SORTS = ['Nota ↓', 'Nota ↑', 'Preço ↑', 'Preço ↓'];
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function armed(api, k) { return arm.k === k && api.now() < arm.until; }
function doArm(api, k) { arm.k = k; arm.until = api.now() + 4; }

function mountUI(root, api) {
  root.classList.add('mk');
  root.innerHTML = '<section class="ros" aria-label="Elenco"><button type="button" class="ros-h" data-act="ros" aria-expanded="true"><b>Elenco <small id="mkst"></small></b><span id="mksum"></span><i aria-hidden="true">▾</i></button>' +
    '<div class="ros-g" id="rosS"></div><div class="ros-g ros-b" id="rosB"></div></section>' +
    '<section class="mf" aria-label="Filtros"><div class="mf-r"><input type="search" id="mkq" placeholder="Buscar jogador ou time" aria-label="Buscar jogador ou time" autocomplete="off" autocapitalize="off" spellcheck="false">' +
    '<button type="button" class="chip" id="mksort" data-act="sort"></button></div>' +
    '<div class="mf-c" id="mkrole" role="group" aria-label="Função"></div><div class="mf-c" id="mklg" role="group" aria-label="Liga"></div></section>' +
    '<p class="mk-cnt" id="mkcnt"></p><div class="pl" id="mklist"></div><button type="button" class="btn mk-more" id="mkmore" data-act="more" hidden></button>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { root: root, st: q('mkst'), sum: q('mksum'), rs: q('rosS'), rb: q('rosB'), q: q('mkq'), sort: q('mksort'), role: q('mkrole'), lg: q('mklg'), cnt: q('mkcnt'), list: q('mklist'), more: q('mkmore'), cells: [], dirty: true, items: [], filt: '' };
  var i;
  for (i = 0; i < 5; i++) UI.cells.push(mkCell(UI.rs, 's', i));
  for (i = 0; i < 2; i++) UI.cells.push(mkCell(UI.rb, 'b', i));
  var info = el('div', 'rc-info'); info.innerHTML = '<span></span><small></small>'; UI.rb.appendChild(info); UI.info = info;
  ['ALL'].concat(ROLES).forEach(function (r) { var b = el('button', 'chip', r === 'ALL' ? 'Todas' : r); b.type = 'button'; b.dataset.act = 'role'; b.dataset.v = r; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', r === 'ALL' ? 'Todas as funções' : RN[r]); UI.role.appendChild(b); });
  ['ALL'].concat(LEAGUES).forEach(function (l) { var b = el('button', 'chip', l === 'ALL' ? 'Todas' : l); b.type = 'button'; b.dataset.act = 'lg'; b.dataset.v = l; b.setAttribute('aria-pressed', 'false'); UI.lg.appendChild(b); });
  var ob = el('button', 'chip', '🔓 Liberados'); ob.type = 'button'; ob.dataset.act = 'open'; ob.setAttribute('aria-pressed', 'false'); UI.lg.appendChild(ob); UI.ob = ob;
  UI.pl = api.list(UI.list, { key: function (it) { return it.p.id; }, create: mkCard });
  UI.q.addEventListener('input', function () { F.q = UI.q.value.trim().toLowerCase(); F.shown = 20; UI.dirty = true; api.invalidate(); });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function mkCell(host, kind, i) {
  var b = el('button', 'rc'); b.type = 'button'; b.dataset.act = 'cell'; b.dataset.kind = kind; b.dataset.slot = i;
  b.innerHTML = '<span class="rc-r"></span><b class="rc-n"></b><span class="rc-o"></span><span class="rc-g"></span>';
  host.appendChild(b);
  return { b: b, r: b.children[0], n: b.children[1], o: b.children[2], g: b.children[3], kind: kind, slot: i };
}
function mkCard(it) {
  var p = it.p, d = el('div', 'pc'), av = el('div', 'pav'), t = el('span', '', initials(p.n)), ic = el('i', '', RI[p.r]);
  av.style.background = RC[p.r]; av.appendChild(t); av.appendChild(ic);
  var img = new Image(); img.alt = ''; img.className = 'pimg'; img.decoding = 'async'; img.loading = 'lazy';
  img.onload = function () { av.classList.add('ph'); };
  if (C.photos !== false && !NOIMG[p.id]) { img.onerror = function () { NOIMG[p.id] = 1; img.remove(); }; img.src = 'img/jogadores/' + p.id + '.webp'; av.appendChild(img); }
  var mid = el('div', 'pin'), l1 = el('div', 'pn'), nm = el('span', 'pnm', p.n), tag = el('span', 'ptag'); l1.appendChild(nm); l1.appendChild(tag);
  var l2 = el('div', 'pm', p.t + ' · ' + p.l + ' · ' + p.a + ' anos'), l3 = el('div', 'pg');
  l3.innerHTML = '<span class="pr" style="color:' + RC[p.r] + '">' + RN[p.r] + '</span><b class="po">Nota ' + p.o + '</b><span class="pd"></span>';
  mid.appendChild(l1); mid.appendChild(l2); mid.appendChild(l3);
  var bt = el('div', 'pbt'), b1 = el('button', 'pb pb1'), b2 = el('button', 'pb pb2'), lk = el('div', 'plk');
  b1.type = b2.type = 'button'; b1.dataset.act = 'hire'; b1.dataset.id = p.id; b2.dataset.act = 'sub'; b2.dataset.id = p.id;
  b1.innerHTML = '<span class="b1"></span><span class="b2"></span>'; b2.innerHTML = '<span class="b1"></span><span class="b2"></span>';
  bt.appendChild(b1); bt.appendChild(b2); bt.appendChild(lk);
  d.appendChild(av); d.appendChild(mid); d.appendChild(bt);
  var ui = { b1: b1, b2: b2, lk: lk, tag: tag, d: l3.lastChild, x: [b1.children[0], b1.children[1], b2.children[0], b2.children[1]] };
  return { el: d, ui: ui, update: function () {} };
}
function setT(n, v) { if (n._v !== v) { n._v = v; n.textContent = v; } }
function setA(n, a, v) { if (n['_' + a] !== v) { n['_' + a] = v; n.setAttribute(a, v); } }

function listItems(api) {
  var c = ctx(api), lg = F.lg || G.regions[c.reg].l, out = [];
  PL.forEach(function (p) {
    if (F.role !== 'ALL' && p.r !== F.role) return;
    if (lg !== 'ALL' && p.l !== lg) return;
    if (F.q && (p.n.toLowerCase().indexOf(F.q) < 0 && p.t.toLowerCase().indexOf(F.q) < 0)) return;
    var av = avail(p, c);
    if (F.open && !av.ok) return;
    out.push({ p: p, pr: price(p, c.reg) });
  });
  var s = F.sort;
  out.sort(function (a, b) {
    var d = s === 0 ? b.p.o - a.p.o : s === 1 ? a.p.o - b.p.o : s === 2 ? a.pr - b.pr : b.pr - a.pr;
    return d || (a.p.n < b.p.n ? -1 : 1);
  });
  return out;
}
function owner(id) { var i = S.s.findIndex(function (e) { return e && e.id === id; }); if (i >= 0) return { sub: false, slot: i }; i = S.b.findIndex(function (e) { return e && e.id === id; }); return i >= 0 ? { sub: true, slot: i } : null; }

function render(api) {
  if (!UI) return;
  var c = ctx(api), rg = G.regions[c.reg], lgOwn = rg.l;
  if (!F.lg) F.lg = lgOwn;
  if (UI.dirty) {
    UI.dirty = false; UI.items = listItems(api);
    UI.pl.set(UI.items.slice(0, F.shown));
  }
  setT(UI.st, rg.n + ' · ' + (c.div === 'T1' ? lgOwn : 'T2'));
  var v = view || build(api), base = api.previewPs({}), tot = 0;
  v.st.concat(v.sb).forEach(function (x, idx) {
    var cell = UI.cells[idx], g = 0;
    if (!x) { setT(cell.r, idx < 5 ? ROLES[idx] : 'RES'); setT(cell.n, 'vaga livre'); setT(cell.o, '—'); setT(cell.g, ''); setA(cell.b, 'data-st', 'empty'); setA(cell.b, 'aria-label', 'Vaga livre'); return; }
    if (x.real) {
      if (idx < 5) g = base - api.previewPs({ extra: { tit: -(mult(x.o) - 1) } });
      else { var cur = 0; v.sb.forEach(function (y) { if (y && y.real) cur += subBonus(y.o); }); g = base - api.previewPs({ mult: { 'mkt:subs': 1 + cur - subBonus(x.o) } }); }
      tot += g;
    }
    setT(cell.r, x.real ? x.r : (idx < 5 ? x.r : 'RES')); setT(cell.n, x.n); setT(cell.o, x.real ? 'nota ' + x.o : 'genérico'); setT(cell.g, x.real ? '+' + api.fmt(g) + '/s' : '');
    setA(cell.b, 'data-st', x.real ? 'real' : 'gen'); cell.b.style.setProperty('--rc', RC[x.r] || 'var(--line-strong)');
    var key = 'f:' + cell.kind + cell.slot, a = armed(api, key);
    if (a) { setT(cell.g, 'Dispensar?'); }
    setA(cell.b, 'aria-label', (idx < 5 ? 'Titular ' : 'Reserva ') + x.n + (x.real ? ', nota ' + x.o + ', toque para dispensar' : ''));
  });
  setT(UI.sum, '+' + api.fmt(tot) + '/s dos contratados');
  setT(UI.info.children[0], 'Importados ' + nImp() + '/' + C.importMax);
  setT(UI.info.children[1], c.div === 'T1' ? 'Reserva: +% de renda' : 'Imports após a promoção');
  UI.rs.hidden = UI.rb.hidden = !F.ros; setA(UI.root.querySelector('.ros-h'), 'aria-expanded', String(F.ros));
  /* filtros */
  Array.prototype.forEach.call(UI.role.children, function (b) { setA(b, 'aria-pressed', String(b.dataset.v === F.role)); });
  Array.prototype.forEach.call(UI.lg.children, function (b) { if (b.dataset.act === 'lg') { setA(b, 'aria-pressed', String(b.dataset.v === F.lg)); setT(b, b.dataset.v === 'ALL' ? 'Todas' : b.dataset.v === lgOwn ? b.dataset.v + ' ★' : b.dataset.v); } });
  setA(UI.ob, 'aria-pressed', String(F.open)); setT(UI.sort, SORTS[F.sort]); setA(UI.sort, 'aria-label', 'Ordenar: ' + SORTS[F.sort]);
  setT(UI.cnt, UI.items.length + (UI.items.length === 1 ? ' jogador' : ' jogadores') + (UI.items.length ? '' : ' · tente outro filtro'));
  var more = UI.items.length > F.shown; if (UI.more.hidden === more) UI.more.hidden = !more; setT(UI.more, 'Carregar mais (' + Math.min(20, UI.items.length - F.shown) + ')');
  /* cartoes visiveis */
  var money = api.money(), nI = nImp();
  UI.items.slice(0, F.shown).forEach(function (it, i) {
    var e = UI.list.children[i]; if (!e) return;
    cardPaint(api, it, e, c, money, nI);
  });
}
function cardPaint(api, it, d, c, money, nI) {
  var ui = d._ui || (d._ui = (function () { var b = d.querySelectorAll('.pb'); return { b1: b[0], b2: b[1], lk: d.querySelector('.plk'), tag: d.querySelector('.ptag'), d: d.querySelector('.pd'), x: [b[0].children[0], b[0].children[1], b[1].children[0], b[1].children[1]], pbt: d.querySelector('.pbt') }; })());
  var p = it.p, av = avail(p, c), own = owner(p.id), imp = isImp(p, c.reg);
  setT(ui.tag, imp ? 'Importado' : ''); ui.tag.hidden = !imp;
  d.dataset.lock = av.ok ? '0' : '1';
  if (!av.ok) { setT(ui.lk, '🔒 ' + av.why); ui.lk.hidden = false; ui.b1.hidden = ui.b2.hidden = true; setT(ui.d, 'preço ' + api.cur + ' ' + api.fmt(it.pr)); return; }
  ui.lk.hidden = true;
  if (own) {
    var e = own.sub ? S.b[own.slot] : S.s[own.slot], key = 'f:' + (own.sub ? 'b' : 's') + own.slot, a = armed(api, key);
    ui.b1.hidden = false; ui.b2.hidden = true; ui.b1.dataset.act = 'fire'; ui.b1.dataset.kind = own.sub ? 'b' : 's'; ui.b1.dataset.slot = own.slot;
    setT(ui.x[0], a ? 'Confirmar?' : 'Dispensar'); setT(ui.x[1], '+' + api.cur + ' ' + api.fmt(Math.floor(e.paid * C.refund)));
    setA(ui.b1, 'aria-disabled', 'false'); ui.b1.dataset.on = 'fire'; setT(ui.d, own.sub ? 'reserva' : 'titular'); setA(ui.b1, 'aria-label', 'Dispensar ' + p.n + ', devolve 50%'); return;
  }
  var slot = ROLES.indexOf(p.r), occ = S.s[slot], pr = it.pr, sp = subPrice(p, c.reg);
  var full = imp && nI >= C.importMax;
  ui.b1.hidden = false; ui.b2.hidden = false; ui.b1.dataset.act = 'hire';
  var swap = !!occ, pr2 = swap ? pr - Math.floor(occ.paid * C.refund) : pr, ok1 = money >= pr2 && !(full && !(occ && occ.imp)), ok2 = money >= sp && !(full) ;
  var ak = 'r:' + p.id, a1 = armed(api, ak);
  setT(ui.x[0], full ? 'Limite de imports' : a1 ? 'Confirmar troca?' : swap ? 'Trocar titular' : 'Contratar'); setT(ui.x[1], api.cur + ' ' + api.fmt(pr2));
  setT(ui.x[2], full ? 'Limite de imports' : 'Reserva'); setT(ui.x[3], api.cur + ' ' + api.fmt(sp));
  setA(ui.b1, 'aria-disabled', ok1 ? 'false' : 'true'); setA(ui.b2, 'aria-disabled', ok2 ? 'false' : 'true');
  setA(ui.b1, 'aria-label', (swap ? 'Trocar titular por ' : 'Contratar ') + p.n + ' por ' + api.cur + ' ' + api.fmt(pr2));
  setA(ui.b2, 'aria-label', 'Contratar ' + p.n + ' como reserva por ' + api.cur + ' ' + api.fmt(sp));
  setT(ui.d, '+' + api.fmt(Math.max(0, gainHire(api, p, false))) + '/s');
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b) return;
  var act = b.dataset.act, r;
  if (act === 'role') { F.role = b.dataset.v; F.shown = 20; }
  else if (act === 'lg') { F.lg = b.dataset.v; F.shown = 20; }
  else if (act === 'open') F.open = !F.open;
  else if (act === 'sort') { F.sort = (F.sort + 1) % 4; }
  else if (act === 'more') F.shown += 20;
  else if (act === 'ros') { F.ros = !F.ros; }
  else if (act === 'cell') {
    var sub = b.dataset.kind === 'b', i = +b.dataset.slot, ent = (sub ? S.b : S.s)[i], key = 'f:' + b.dataset.kind + i;
    if (!ent) { api.toast(sub ? 'Reserva livre: contrate qualquer função' : 'Vaga livre: compre um Titular ou contrate um jogador de ' + RN[ROLES[i]]); return; }
    if (armed(api, key)) { arm.k = ''; r = fireCore(api, sub, i); api.toast(r.msg); api.sfx('no'); api.save(); }
    else { doArm(api, key); api.toast('Toque de novo para dispensar ' + BYID[ent.id].n + ' (devolve 50%)'); }
  } else if (act === 'fire') {
    var sb2 = b.dataset.kind === 'b', i2 = +b.dataset.slot, key2 = 'f:' + b.dataset.kind + i2;
    if (armed(api, key2)) { arm.k = ''; r = fireCore(api, sb2, i2); api.toast(r.msg); api.sfx('no'); api.save(); }
    else { doArm(api, key2); api.toast('Toque de novo para confirmar: devolve 50% do valor'); }
  } else if (act === 'hire' || act === 'sub') {
    if (b.getAttribute('aria-disabled') === 'true') { var pl = BYID[b.dataset.id], cc = ctx(api); var imp = isImp(pl, cc.reg);
      api.toast(imp && nImp() >= C.importMax ? 'Limite de ' + C.importMax + ' importados no elenco' : 'Faltam ' + api.cur + ' ' + api.fmt(Math.max(0, (act === 'sub' ? subPrice(pl, cc.reg) : price(pl, cc.reg)) - api.money()))); api.sfx('no'); return; }
    var id = b.dataset.id, replace = false, p = BYID[id];
    if (act === 'hire' && S.s[ROLES.indexOf(p.r)]) { if (!armed(api, 'r:' + id)) { doArm(api, 'r:' + id); api.toast('Trocar titular? O atual é dispensado e devolve 50%.'); api.invalidate(); return; } replace = true; arm.k = ''; }
    r = hireCore(api, id, act === 'sub', replace);
    api.toast(r.msg); if (r.ok) { api.sfx('buy'); api.buzz(10); api.save(); } else api.sfx('no');
  }
  UI.dirty = true; api.invalidate();
}

/* ---------- registro ---------- */
var apiRef = null;
Engine.registerTab('esp', {
  id: 'mercado', label: 'Mercado', icon: '🛒',
  ach: [
    { id: 'mk1', ic: '🛒', n: 'Contratação de peso', d: 'Contrate seu primeiro jogador real.' },
    { id: 'mk5', ic: '🏅', n: 'Cinco reais', d: 'Tenha os 5 titulares reais.' },
    { id: 'mkimp', ic: '✈️', n: 'Mala pronta', d: 'Importe um jogador de outra região.' },
    { id: 'mk95', ic: '💎', n: 'Estrela de 95', d: 'Contrate um jogador de nota 95 ou mais.' }
  ],
  unlock: function (api) { return api.owned('tit') >= 2 || nReal(S.s) > 0; },
  mount: function (root, api) { apiRef = api; mountUI(root, api); },
  load: function (d, api) {
    S = { s: [null, null, null, null, null], b: [null, null], v: 0, v0: 0 };
    if (d && typeof d === 'object') {
      var okE = function (e, role) { return e && BYID[e.id] && (role === null || BYID[e.id].r === role) && isFinite(+e.paid) ? { id: e.id, paid: Math.max(0, +e.paid), imp: e.imp ? 1 : 0 } : null; };
      for (var i = 0; i < 5; i++) S.s[i] = okE(d.s && d.s[i], ROLES[i]);
      for (i = 0; i < 2; i++) S.b[i] = okE(d.b && d.b[i], null);
    }
    sigPrev = ''; sync(api, true);
    if (UI) { UI.dirty = true; }
  },
  save: function () { return { s: S.s, b: S.b }; },
  update: function (dt, api) { sync(api); achT += dt; if (achT > 1) { achT = 0; ach(api); } },
  render: render,
  scene: function (x) { if (S.roster) x.roster = S.roster; },
  onPrestige: function (api) { /* contratados permanecem; genericos reiniciam */
    sigPrev = ''; api.setOwned('tit', nReal(S.s)); api.setOwned('res', nReal(S.b)); sync(api, true);
  }
});
var achT = 0;
function ach(api) {
  if (nReal(S.s) + nReal(S.b) > 0) api.unlock('mk1');
  if (nReal(S.s) === 5) api.unlock('mk5');
  if (nImp() > 0) api.unlock('mkimp');
  S.s.concat(S.b).forEach(function (e) { if (e && BYID[e.id].o >= 95) api.unlock('mk95'); });
}
window.MKT = {
  ROLES: ROLES, BYID: BYID, LOW: LOW, price: price, subPrice: subPrice, mult: mult, subBonus: subBonus, avail: avail, isImp: isImp,
  hire: function (id, sub, rep) { return hireCore(apiRef, id, !!sub, !!rep); }, fire: function (sub, slot) { return fireCore(apiRef, !!sub, slot); },
  gain: function (id, sub) { return gainHire(apiRef, BYID[id], !!sub); }, state: function () { return S; }, view: function () { return view; },
  ctx: function () { return ctx(apiRef); }, nImp: nImp
};
})();
