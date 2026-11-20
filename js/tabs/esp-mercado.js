/* Aba MERCADO do Time de eSports (plugin: Engine.registerTab). Jogadores reais do BrasLOL (js/data/jogadores.js).
   Regras e numeros: docs/LOL_MERCADO.md. Contrato com a cena: x.roster (ver docs). */
(function () {
'use strict';
var G = GAMES.esp, C = G.mk, E = ECO, EC = E.C, PL = window.PLAYERS || [];
window.ESPX = window.ESPX || {};
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

function isImp(p, reg) { return E.isImp(p, reg); }
/* nota e idade do contratado (mudam na passagem de ano; o resto vem do cadastro do jogador) */
function noteOf(e) { return isFinite(+e.o) ? +e.o : BYID[e.id].o; }
function ageOf(e) { return isFinite(+e.a) ? +e.a : BYID[e.id].a; }
function price(p, reg) { return E.price(p, reg); }
function salaryOf(e, reg) { return E.salary(BYID[e.id], reg, noteOf(e), ageOf(e)); }
function salaryP(p, reg) { return E.salary(p, reg); }
function initials(n) { var t = n.replace(/[^A-Za-z0-9À-ÿ ]/g, '').trim().split(/\s+/); return (t.length > 1 ? t[0][0] + t[1][0] : (t[0] || '?').slice(0, 2)).toUpperCase(); }
function genNota(api) { return EC.gen.nota + EC.gen.kT * api.owned('treino') + EC.gen.kH * api.owned('house'); }

/* ---------- estado ---------- */
var S = { s: [null, null, null, null, null], v: 0, v0: 0 }, sigPrev = '', view = null, apiRef = null;
function ctx(api) { var sh = api.shared; return { reg: G.regions[sh.region] ? sh.region : 'BR', div: sh.division === 'T1' ? 'T1' : 'T2', intl: !!sh.intl }; }
function nReal(arr) { var n = 0; arr.forEach(function (e) { if (e) n++; }); return n; }
function nImp() { var n = 0; S.s.forEach(function (e) { if (e && e.imp) n++; }); return n; }
function avail(p, c) {
  var imp = isImp(p, c.reg), own = G.regions[c.reg].l;
  if (!imp) return c.div === 'T1' || LOW[p.id] ? { ok: true } : { ok: false, why: 'Sobe com a promoção para o ' + own };
  if (c.div !== 'T1') return { ok: false, why: 'Imports só depois da promoção' };
  if ((p.l === 'LCK' || p.l === 'LPL') && !c.intl) return { ok: false, why: 'Dispute o MSI ou o Mundial' };
  return { ok: true, imp: true };
}
/* vagas: reais + amadores derivados de o[tit] */
function build(api) {
  var o = api.owned('tit'), i, gen, k, st = [], gn = genNota(api);
  gen = Math.max(0, o - nReal(S.s)); k = 0;
  for (i = 0; i < 5; i++) {
    var e = S.s[i];
    if (e) { var p = BYID[e.id]; st.push({ n: p.n, r: p.r, real: true, o: noteOf(e), p: p, e: e, slot: i, sal: salaryOf(e, ctx(api).reg) }); }
    else if (k < gen) { k++; st.push({ n: 'Amador ' + k, r: ROLES[i], real: false, o: gn, slot: i, gen: true, sal: EC.gen.sal }); }
    else st.push(null);
  }
  return { st: st };
}
/* publica o elenco para a Semana e a Liga (api.shared.roster) */
function effects(api) {
  var sum = 0, star = 0, sal = 0, reais = [], c = ctx(api), notas = [];
  view = build(api);
  view.st.forEach(function (x) {
    var n = x ? x.o : EC.gen.empty; notas.push(n); sum += n;
    if (x && x.real) { star += Math.max(0, x.o - EC.star.starMin); sal += x.sal; reais.push({ id: x.p.id, o: x.o, a: ageOf(x.e), paid: x.e.paid, imp: x.e.imp ? 1 : 0, sal: x.sal }); }
    else if (x) sal += x.sal;
  });
  var sh = api.shared;
  sh.avg5 = sum / 5; sh.nReal = reais.length; sh.imports = nImp(); sh.star = star; sh.salRoster = sal;
  sh.roster = { notas: notas, reais: reais, star: star, avg5: sum / 5 };
  var rs = { starters: view.st.map(function (x) { return x && { n: x.n, r: x.r, real: !!x.real, o: x.o }; }) };
  S.roster = rs; S.v++;
}
function ensure(api) { if (api.owned('tit') < nReal(S.s)) api.setOwned('tit', nReal(S.s)); }
function sync(api, force) {
  ensure(api);
  var sig = api.owned('tit') + ',' + api.owned('treino') + ',' + api.owned('house') + ',' + S.v0 + ',' + (api.shared.division || '') + (api.shared.region || '');
  if (force || sig !== sigPrev) { sigPrev = sig; effects(api); if (UI) UI.dirty = true; api.invalidate(); }
}
function bumpMoral(v) { var X = window.ESPX.semana; if (X && X.bump) X.bump({ M: v }); }
function hireCore(api, id, replace) {
  var p = BYID[id], c = ctx(api); if (!p) return { ok: false, msg: 'Jogador não encontrado' };
  var av = avail(p, c); if (!av.ok) return { ok: false, msg: av.why };
  var slot = ROLES.indexOf(p.r), old = S.s[slot], cost = price(p, c.reg), imp = isImp(p, c.reg);
  if (S.s.some(function (e) { return e && e.id === id; })) return { ok: false, msg: 'Já está no elenco' };
  if (old && !replace) return { ok: false, need: 'replace', msg: 'A vaga está ocupada' };
  var impAfter = nImp() - (old && old.imp ? 1 : 0) + (imp ? 1 : 0);
  if (impAfter > C.importMax) return { ok: false, msg: 'Limite de ' + C.importMax + ' importados no elenco' };
  var refund = old ? Math.floor(old.paid * EC.price.refund) : 0;
  if (api.money() + refund < cost) return { ok: false, msg: 'Faltam ' + api.fmtM(cost - refund - api.money()), poor: true };
  if (refund) api.earn(refund, false);
  api.spend(cost);
  var wasGen = false, v = build(api);
  if (!old) { var cur = v.st[slot]; wasGen = !!(cur && cur.gen); }
  S.s[slot] = { id: id, paid: cost, imp: imp ? 1 : 0, o: p.o, a: p.a };
  if (!old && !wasGen) api.setOwned('tit', api.owned('tit') + 1);
  bumpMoral(-6); /* entrosamento */
  S.v0++; sync(api, true);
  return { ok: true, msg: p.n + ' contratado por ' + api.fmtM(cost) + '. Entrosamento: moral -6', p: p, cost: cost };
}
function fireCore(api, slot) {
  var e = S.s[slot]; if (!e) return { ok: false };
  var back = Math.floor(e.paid * EC.price.refund); api.earn(back, false); S.s[slot] = null;
  S.v0++; sync(api, true); /* um amador assume a vaga: o[tit] nao muda */
  return { ok: true, msg: BYID[e.id].n + ' dispensado: +' + api.fmtM(back) + '. Um amador assume a vaga.', back: back };
}
/* resgate da diretoria: vende o titular real de maior salario por 70% do que foi pago */
function sellForced(api, minNote) {
  var best = -1, bs = -1, i, c = ctx(api);
  S.s.forEach(function (e, j) { if (e) { var sl = salaryOf(e, c.reg); if (sl > bs) { bs = sl; best = j; } } });
  if (best < 0) return null;
  var e = S.s[best], amount = Math.floor(e.paid * EC.price.sold), nm = BYID[e.id].n;
  api.earn(amount, false); S.s[best] = null; S.v0++; sync(api, true);
  return { name: nm, amount: amount };
}
/* evento "Proposta por jogador": vende o titular real de menor nota por 130% */
function sellOne(api, mult) {
  var best = -1, bo = 1e9;
  S.s.forEach(function (e, j) { if (e && noteOf(e) < bo) { bo = noteOf(e); best = j; } });
  if (best < 0) return null;
  var e = S.s[best], amount = Math.floor(e.paid * mult), nm = BYID[e.id].n;
  api.earn(amount, false); S.s[best] = null; S.v0++; sync(api, true);
  return { name: nm, amount: amount };
}
function yearEnd(api) { /* +1 de idade; os jovens evoluem e os veteranos caem */
  S.s.forEach(function (e) {
    if (!e) return; e.a = ageOf(e) + 1; var o = noteOf(e);
    if (e.a <= 23 && o < 96) o++; else if (e.a >= 31) o--;
    e.o = o;
  });
  S.v0++; sync(api, true);
}
function gainHire(api, p) { /* quanto a media do elenco sobe (em pontos de forca) */
  var v = view || build(api), x = v.st[ROLES.indexOf(p.r)], cur = x ? x.o : EC.gen.empty;
  return (p.o - cur) / 5;
}

/* ---------- interface ---------- */
var NOIMG = {}, UI = null, arm = { k: '', until: 0 }, F = { role: 'ALL', lg: '', sort: 0, q: '', open: false, shown: 20, ros: true }, SORTS = ['Nota ↓', 'Nota ↑', 'Preço ↑', 'Preço ↓'];
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function armed(api, k) { return arm.k === k && api.now() < arm.until; }
function doArm(api, k) { arm.k = k; arm.until = api.now() + 5; }

function mountUI(root, api) {
  root.classList.add('mk');
  root.innerHTML = '<section class="ros" aria-label="Elenco"><button type="button" class="ros-h" data-act="ros" aria-expanded="true"><b>Elenco <small id="mkst"></small></b><span id="mksum"></span><i aria-hidden="true">▾</i></button>' +
    '<div class="ros-g" id="rosS"></div><p class="ros-i" id="mkinfo"></p></section>' +
    '<section class="mf" aria-label="Filtros"><div class="mf-r"><input type="search" id="mkq" placeholder="Buscar jogador ou time" aria-label="Buscar jogador ou time" autocomplete="off" autocapitalize="off" spellcheck="false">' +
    '<button type="button" class="chip" id="mksort" data-act="sort"></button></div>' +
    '<div class="mf-c" id="mkrole" role="group" aria-label="Função"></div><div class="mf-c" id="mklg" role="group" aria-label="Liga"></div></section>' +
    '<p class="mk-cnt" id="mkcnt"></p><div class="pl" id="mklist"></div><button type="button" class="btn mk-more" id="mkmore" data-act="more" hidden></button>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { root: root, st: q('mkst'), sum: q('mksum'), rs: q('rosS'), info: q('mkinfo'), q: q('mkq'), sort: q('mksort'), role: q('mkrole'), lg: q('mklg'), cnt: q('mkcnt'), list: q('mklist'), more: q('mkmore'), cells: [], dirty: true, items: [], filt: '' };
  var i;
  for (i = 0; i < 5; i++) UI.cells.push(mkCell(UI.rs, i));
  ['ALL'].concat(ROLES).forEach(function (r) { var b = el('button', 'chip', r === 'ALL' ? 'Todas' : r); b.type = 'button'; b.dataset.act = 'role'; b.dataset.v = r; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', r === 'ALL' ? 'Todas as funções' : RN[r]); UI.role.appendChild(b); });
  ['ALL'].concat(LEAGUES).forEach(function (l) { var b = el('button', 'chip', l === 'ALL' ? 'Todas' : l); b.type = 'button'; b.dataset.act = 'lg'; b.dataset.v = l; b.setAttribute('aria-pressed', 'false'); UI.lg.appendChild(b); });
  var ob = el('button', 'chip', '🔓 Liberados'); ob.type = 'button'; ob.dataset.act = 'open'; ob.setAttribute('aria-pressed', 'false'); UI.lg.appendChild(ob); UI.ob = ob;
  UI.pl = api.list(UI.list, { key: function (it) { return it.p.id; }, create: mkCard });
  UI.q.addEventListener('input', function () { F.q = UI.q.value.trim().toLowerCase(); F.shown = 20; UI.dirty = true; api.invalidate(); });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function mkCell(host, i) {
  var b = el('button', 'rc'); b.type = 'button'; b.dataset.act = 'cell'; b.dataset.slot = i;
  b.innerHTML = '<span class="rc-r"></span><b class="rc-n"></b><span class="rc-o"></span><span class="rc-g"></span>';
  host.appendChild(b);
  return { b: b, r: b.children[0], n: b.children[1], o: b.children[2], g: b.children[3], slot: i };
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
  var bt = el('div', 'pbt'), b1 = el('button', 'pb pb1'), lk = el('div', 'plk');
  b1.type = 'button'; b1.dataset.act = 'hire'; b1.dataset.id = p.id;
  b1.innerHTML = '<span class="b1"></span><span class="b2"></span>';
  bt.appendChild(b1); bt.appendChild(lk);
  d.appendChild(av); d.appendChild(mid); d.appendChild(bt);
  return { el: d, update: function () {} };
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
function owner(id) { var i = S.s.findIndex(function (e) { return e && e.id === id; }); return i >= 0 ? { slot: i } : null; }

function render(api) {
  if (!UI) return;
  var c = ctx(api), rg = G.regions[c.reg], lgOwn = rg.l;
  if (!F.lg) F.lg = lgOwn;
  if (UI.dirty) {
    UI.dirty = false; UI.items = listItems(api);
    UI.pl.set(UI.items.slice(0, F.shown));
  }
  setT(UI.st, rg.n + ' · ' + (c.div === 'T1' ? lgOwn : 'T2'));
  var v = view || build(api), folha = 0;
  v.st.forEach(function (x, idx) {
    var cell = UI.cells[idx];
    if (!x) { setT(cell.r, ROLES[idx]); setT(cell.n, 'vaga livre'); setT(cell.o, '—'); setT(cell.g, ''); setA(cell.b, 'data-st', 'empty'); setA(cell.b, 'aria-label', 'Vaga livre'); return; }
    folha += x.sal;
    setT(cell.r, x.r); setT(cell.n, x.n); setT(cell.o, 'nota ' + x.o); setT(cell.g, api.fmtM(x.sal).replace('R$ ', '') + '/sem');
    setA(cell.b, 'data-st', x.real ? 'real' : 'gen'); cell.b.style.setProperty('--rc', RC[x.r] || 'var(--line-strong)');
    if (x.real && armed(api, 'f:' + idx)) setT(cell.g, 'Dispensar?');
    setA(cell.b, 'aria-label', 'Titular ' + x.n + ', nota ' + x.o + ', salário ' + api.fmtM(x.sal) + ' por semana' + (x.real ? ', toque para dispensar' : ''));
  });
  setT(UI.sum, 'Folha ' + api.fmtM(folha) + '/sem');
  setT(UI.info, 'Importados ' + nImp() + '/' + C.importMax + (c.div === 'T1' ? ' · todos os jogadores da sua liga liberados' : ' · imports só depois da promoção') + ' · dispensar devolve 60%');
  UI.rs.hidden = UI.info.hidden = !F.ros; setA(UI.root.querySelector('.ros-h'), 'aria-expanded', String(F.ros));
  Array.prototype.forEach.call(UI.role.children, function (b) { setA(b, 'aria-pressed', String(b.dataset.v === F.role)); });
  Array.prototype.forEach.call(UI.lg.children, function (b) { if (b.dataset.act === 'lg') { setA(b, 'aria-pressed', String(b.dataset.v === F.lg)); setT(b, b.dataset.v === 'ALL' ? 'Todas' : b.dataset.v === lgOwn ? b.dataset.v + ' ★' : b.dataset.v); } });
  setA(UI.ob, 'aria-pressed', String(F.open)); setT(UI.sort, SORTS[F.sort]); setA(UI.sort, 'aria-label', 'Ordenar: ' + SORTS[F.sort]);
  setT(UI.cnt, UI.items.length + (UI.items.length === 1 ? ' jogador' : ' jogadores') + (UI.items.length ? '' : ' · tente outro filtro'));
  var more = UI.items.length > F.shown; if (UI.more.hidden === more) UI.more.hidden = !more; setT(UI.more, 'Carregar mais (' + Math.min(20, UI.items.length - F.shown) + ')');
  var money = api.money(), nI = nImp();
  UI.items.slice(0, F.shown).forEach(function (it, i) {
    var e = UI.list.children[i]; if (!e) return;
    cardPaint(api, it, e, c, money, nI, v);
  });
}
function cardPaint(api, it, d, c, money, nI, v) {
  var ui = d._ui || (d._ui = { b1: d.querySelector('.pb1'), lk: d.querySelector('.plk'), tag: d.querySelector('.ptag'), d: d.querySelector('.pd'), x: [d.querySelector('.pb1 .b1'), d.querySelector('.pb1 .b2')] });
  var p = it.p, av = avail(p, c), own = owner(p.id), imp = isImp(p, c.reg), sal = salaryP(p, c.reg);
  setT(ui.tag, imp ? 'Importado' : ''); ui.tag.hidden = !imp;
  d.dataset.lock = av.ok ? '0' : '1';
  if (!av.ok) { setT(ui.lk, '🔒 ' + av.why); ui.lk.hidden = false; ui.b1.hidden = true; setT(ui.d, api.fmtM(it.pr) + ' · ' + api.fmtM(sal) + '/sem'); return; }
  ui.lk.hidden = true; ui.b1.hidden = false;
  if (own) {
    var e = S.s[own.slot], a = armed(api, 'f:' + own.slot);
    ui.b1.dataset.act = 'fire'; ui.b1.dataset.slot = own.slot;
    setT(ui.x[0], a ? 'Confirmar?' : 'Dispensar'); setT(ui.x[1], '+' + api.fmtM(Math.floor(e.paid * EC.price.refund)));
    setA(ui.b1, 'aria-disabled', 'false'); setT(ui.d, 'titular · ' + api.fmtM(salaryOf(e, c.reg)) + '/sem'); setA(ui.b1, 'aria-label', 'Dispensar ' + p.n + ', devolve 60%'); return;
  }
  var slot = ROLES.indexOf(p.r), occ = S.s[slot], pr = it.pr, full = imp && nI >= C.importMax && !(occ && occ.imp);
  var swap = !!occ, pr2 = swap ? pr - Math.floor(occ.paid * EC.price.refund) : pr, ok = money >= pr2 && !full;
  ui.b1.dataset.act = 'hire'; ui.b1.dataset.id = p.id;
  var a1 = armed(api, 'r:' + p.id);
  setT(ui.x[0], full ? 'Limite de imports' : a1 ? 'Confirmar?' : swap ? 'Trocar titular' : 'Contratar'); setT(ui.x[1], api.fmtM(pr2));
  setA(ui.b1, 'aria-disabled', ok ? 'false' : 'true');
  setA(ui.b1, 'aria-label', (swap ? 'Trocar titular por ' : 'Contratar ') + p.n + ' por ' + api.fmtM(pr2) + ', salário ' + api.fmtM(sal) + ' por semana');
  var g = gainHire(api, p);
  setT(ui.d, (g >= 0 ? '+' : '') + (Math.round(g * 10) / 10).toString().replace('.', ',') + ' força · ' + api.fmtM(sal) + '/sem');
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
  else if (act === 'cell' || act === 'fire') {
    var i = +b.dataset.slot, ent = S.s[i], key = 'f:' + i;
    if (!ent) { if (act === 'cell') api.toast('Vaga livre: compre um Titular amador ou contrate um jogador de ' + RN[ROLES[i]]); return; }
    if (armed(api, key)) { arm.k = ''; r = fireCore(api, i); api.toast(r.msg); api.sfx('no'); api.save(); }
    else { doArm(api, key); api.toast('Toque de novo para dispensar ' + BYID[ent.id].n + ' (devolve 60% do que foi pago)'); }
  } else if (act === 'hire') {
    var id = b.dataset.id, p = BYID[id], pl = ctx(api), cost = price(p, pl.reg), occ = S.s[ROLES.indexOf(p.r)];
    if (b.getAttribute('aria-disabled') === 'true') {
      api.toast(isImp(p, pl.reg) && nImp() >= C.importMax && !(occ && occ.imp) ? 'Limite de ' + C.importMax + ' importados no elenco' : 'Faltam ' + api.fmtM(Math.max(0, cost - (occ ? Math.floor(occ.paid * EC.price.refund) : 0) - api.money())));
      api.sfx('no'); return;
    }
    var X = window.ESPX.semana, dSal = salaryP(p, pl.reg) - (occ ? salaryOf(occ, pl.reg) : EC.gen.sal);
    var warn = X && X.confirmText ? X.confirmText(cost - (occ ? Math.floor(occ.paid * EC.price.refund) : 0), dSal) : null;
    if ((occ || warn) && !armed(api, 'r:' + id)) {
      doArm(api, 'r:' + id);
      api.toast((occ ? 'Trocar titular? O atual é dispensado e devolve 60%. ' : '') + (warn ? warn + ' ' : '') + 'Toque de novo para confirmar.', { ms: 6000 });
      api.sfx('no'); api.invalidate(); UI.dirty = true; return;
    }
    arm.k = '';
    r = hireCore(api, id, !!occ);
    api.toast(r.msg); if (r.ok) { api.sfx('buy'); api.buzz(10); api.save(); } else api.sfx('no');
  }
  UI.dirty = true; api.invalidate();
}

/* ---------- registro ---------- */
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
    apiRef = api; S = { s: [null, null, null, null, null], v: 0, v0: 0 };
    if (d && typeof d === 'object') {
      var okE = function (e, role) { return e && BYID[e.id] && BYID[e.id].r === role && isFinite(+e.paid) ? { id: e.id, paid: Math.max(0, +e.paid), imp: e.imp ? 1 : 0, o: isFinite(+e.o) ? Math.max(40, Math.min(99, +e.o)) : BYID[e.id].o, a: isFinite(+e.a) ? Math.max(15, Math.min(45, +e.a)) : BYID[e.id].a } : null; };
      for (var i = 0; i < 5; i++) S.s[i] = okE(d.s && d.s[i], ROLES[i]);
    }
    sigPrev = ''; sync(api, true);
    if (UI) { UI.dirty = true; }
  },
  save: function () { return { s: S.s }; },
  update: function (dt, api) { sync(api); achT += dt; if (achT > 1) { achT = 0; ach(api); } },
  render: render,
  scene: function (x) { if (S.roster) x.roster = S.roster; },
  onPrestige: function (api) { /* camisa aposentada: so o titular de maior nota fica; o resto sai sem devolucao */
    var best = -1, bo = -1;
    S.s.forEach(function (e, j) { if (e && noteOf(e) > bo) { bo = noteOf(e); best = j; } });
    S.s = S.s.map(function (e, j) { return j === best ? e : null; });
    sigPrev = ''; api.setOwned('tit', nReal(S.s)); S.v0++; sync(api, true);
  }
});
var achT = 0;
function ach(api) {
  if (nReal(S.s) > 0) api.unlock('mk1');
  if (nReal(S.s) === 5) api.unlock('mk5');
  if (nImp() > 0) api.unlock('mkimp');
  S.s.forEach(function (e) { if (e && noteOf(e) >= 95) api.unlock('mk95'); });
}
window.ESPX.mercado = { refresh: function (api) { sync(api || apiRef, true); }, sellForced: function (api) { return sellForced(api || apiRef); }, sellOne: function (api, m) { return sellOne(api || apiRef, m || 1.3); }, yearEnd: function (api) { yearEnd(api || apiRef); }, genNota: genNota };
window.MKT = {
  ROLES: ROLES, BYID: BYID, LOW: LOW, price: price, salary: salaryP, salaryOf: salaryOf, noteOf: noteOf, avail: avail, isImp: isImp,
  hire: function (id, rep) { return hireCore(apiRef, id, !!rep); }, fire: function (slot) { return fireCore(apiRef, slot); },
  gain: function (id) { return gainHire(apiRef, BYID[id]); }, state: function () { return S; }, view: function () { return view; },
  ctx: function () { return ctx(apiRef); }, nImp: nImp
};
})();
