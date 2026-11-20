/* Mini Idle 3 em 1 - motor. Sem dependencias, script classico. */
(function () {
'use strict';
var K = 'miniidle-v2', MAXAWAY = 4 * 3600, EFF = 0.5;
var KEYS = ['lan', 'civ', 'esp'];
var $ = function (id) { return document.getElementById(id); };

/* ---------- formatacao ---------- */
function fmt(n) {
  if (!isFinite(n)) return '0';
  if (n < 10) return (Math.floor(n * 10) / 10).toString().replace('.', ',');
  if (n < 1000) return Math.floor(n).toString();
  var S = ['mil', 'mi', 'bi', 'tri', 'qua', 'qui', 'sex', 'sep'], i = -1;
  while (n >= 1000 && i < S.length - 1) { n /= 1000; i++; }
  return (Math.floor(n * 100) / 100).toString().replace('.', ',') + ' ' + S[i];
}
function fx(n) { return String(Math.round(n * 100) / 100).replace('.', ','); }
function fmtT(s) { return s < 60 ? Math.ceil(s) + ' s' : s < 3600 ? Math.ceil(s / 60) + ' min' : (Math.ceil(s / 360) / 10).toString().replace('.', ',') + ' h'; }
function fmtD(s) { var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' h ' + m + ' min' : Math.max(1, m) + ' min'; }
function tryf(f) { try { return f(); } catch (e) { return undefined; } }

/* ---------- preparo dos dados ---------- */
function marcos(it) {
  if (it.t !== 'u' || it.max < 2) return [];
  return it.max === 2 ? [2] : [Math.ceil(it.max / 2), it.max];
}
KEYS.forEach(function (k) {
  var G = GAMES[k]; G.idx = {}; G.units = []; G.alls = []; G.tg = {};
  G.items.forEach(function (it, i) { G.idx[it.id] = i; it.i = i; it.mc = marcos(it); });
  G.items.forEach(function (it) {
    it.ri = it.req ? G.idx[it.req[0]] : -1;
    if (it.t === 'u') G.units.push(it);
    else if (it.tgt === 'all') G.alls.push(it);
    else { var j = G.idx[it.tgt]; (G.tg[j] = G.tg[j] || []).push(it); }
  });
  G.tiers.forEach(function (t) { t.ci = t.c ? G.idx[t.c[0]] : -1; });
  G.ach.forEach(function (a) { if (a.c[1] && typeof a.c[1] === 'string') a.ci = G.idx[a.c[1]]; });
  if (G.goals) G.goals.forEach(function (g) { g.ci = G.idx[g.id]; });
  G.facts = G.msgs.filter(function (m) { return m.indexOf('Fato') === 0; });
});

/* ---------- estado ---------- */
var st, RT = {}, C = {}, T = 0;
function num(v, d) { v = +v; return isFinite(v) && v >= 0 && v < 1e30 ? v : d; }
function newG(k) {
  var G = GAMES[k];
  return { m: 0, t: 0, o: G.items.map(function () { return 0; }), life: 0, stars: 0, pc: 0, ach: {}, goal: 0,
    vis: G.items.map(function () { return false; }), rt: 0, c: 0, evn: 0 };
}
function newSt() {
  var s = { v: 2, cur: 'lan', mode: '1', last: Date.now(), set: { sound: false, haptic: true, motion: 'auto' },
    stats: { clicks: 0, buys: 0, play: 0, since: Date.now(), awayMax: 0 }, g: {} };
  KEYS.forEach(function (k) { s.g[k] = newG(k); });
  return s;
}
function sanitize(d) {
  if (!d || typeof d !== 'object' || typeof d.g !== 'object' || !d.g) throw new Error('Save sem dados');
  var s = newSt();
  s.cur = KEYS.indexOf(d.cur) >= 0 ? d.cur : 'lan';
  s.mode = ['1', '10', 'max'].indexOf(d.mode) >= 0 ? d.mode : '1';
  s.last = num(d.last, Date.now());
  var ds = d.set || {};
  s.set = { sound: !!ds.sound, haptic: ds.haptic !== false, motion: ['auto', 'reduce', 'full'].indexOf(ds.motion) >= 0 ? ds.motion : 'auto' };
  var dt = d.stats || {};
  s.stats = { clicks: num(dt.clicks, 0), buys: num(dt.buys, 0), play: num(dt.play, 0), since: num(dt.since, Date.now()), awayMax: num(dt.awayMax, 0) };
  KEYS.forEach(function (k) {
    var G = GAMES[k], r = d.g[k], g = s.g[k];
    if (!r || typeof r !== 'object') return;
    g.m = num(r.m, 0); g.t = num(r.t, 0); g.life = Math.max(num(r.life, 0), g.t); g.stars = Math.floor(num(r.stars, 0));
    g.pc = Math.floor(num(r.pc, 0)); g.rt = num(r.rt, 0); g.c = Math.floor(num(r.c, 0)); g.evn = Math.floor(num(r.evn, 0));
    g.goal = Math.min(Math.floor(num(r.goal, 0)), G.goals ? G.goals.length : 0);
    g.o = G.items.map(function (it, i) { var n = Math.floor(num(r.o && r.o[i], 0)); return Math.min(n, it.max); });
    g.vis = G.items.map(function (it, i) { return !!(r.vis && r.vis[i]) || g.o[i] > 0; });
    if (r.ach && typeof r.ach === 'object') G.ach.forEach(function (a) { if (r.ach[a.id]) g.ach[a.id] = num(r.ach[a.id], 1); });
  });
  return s;
}
function load() {
  var raw = tryf(function () { return localStorage.getItem(K); });
  if (!raw) return newSt();
  try { return sanitize(JSON.parse(raw)); } catch (e) { return newSt(); }
}
function save() {
  if (!st) return;
  st.last = Date.now();
  tryf(function () { localStorage.setItem(K, JSON.stringify(st)); });
}
function initRT() {
  KEYS.forEach(function (k) {
    var E = GAMES[k].ev;
    RT[k] = { ev: null, bt: 0, bm: 1, bk: '', combo: 0, lastClick: -9, evN: E.a + Math.random() * (E.b - E.a), sg: -1 };
    C[k] = {};
  });
}
function dirty(k) { C[k] = {}; }

/* ---------- logica ---------- */
function nMarcos(k) {
  var G = GAMES[k], g = st.g[k], n = 0;
  if (!G.bonusAch) return 0;
  G.ach.forEach(function (a) { if (a.m && g.ach[a.id]) n++; });
  return n;
}
function multU(G, o, i) {
  var it = G.items[i], m = 1, j, l;
  for (j = 0; j < it.mc.length; j++) if (o[i] >= it.mc[j]) m *= 2;
  l = G.tg[i];
  if (l) for (j = 0; j < l.length; j++) m *= Math.pow(l[j].f, o[l[j].i]);
  return m;
}
function psRaw(k, o) {
  var G = GAMES[k], g = st.g[k], s = 0, i, u, m;
  for (i = 0; i < G.units.length; i++) { u = G.units[i]; if (o[u.i]) s += u.p * o[u.i] * multU(G, o, u.i); }
  m = (1 + 0.10 * g.stars) * (1 + (G.bonusAch || 0) * nMarcos(k));
  for (i = 0; i < G.alls.length; i++) m *= Math.pow(G.alls[i].f, o[G.alls[i].i]);
  return s * m;
}
function psBase(k) { var c = C[k]; if (c.pb === undefined) c.pb = psRaw(k, st.g[k].o); return c.pb; }
function boost(k) {
  var r = RT[k], b = 1;
  if (r.bt > 0) b *= r.bm;
  if (r.ev && r.ev.type === 'apagao') b *= 0.25;
  return b;
}
function ps(k) { return psBase(k) * boost(k); }
function comboMul(k) { return GAMES[k].combo ? 1 + RT[k].combo / 10 : 1; }
function clickVal(k) { var G = GAMES[k], g = st.g[k]; return ((G.clickBase + 0.10 * g.stars) + G.clickPs * ps(k)) * comboMul(k); }
function cost1(k, i) { var it = GAMES[k].items[i]; return it.c0 * Math.pow(it.g, st.g[k].o[i]); }
function costK(k, i, n) {
  var it = GAMES[k].items[i], c = cost1(k, i);
  return n === 1 ? c : it.g === 1 ? c * n : c * (Math.pow(it.g, n) - 1) / (it.g - 1);
}
function qty(k, i, mode) {
  var it = GAMES[k].items[i], g = st.g[k], left = it.max - g.o[i], n;
  mode = mode || st.mode;
  if (left <= 0) return 0;
  if (mode === '1' || it.g === 1) return 1;
  if (mode === '10') return Math.min(10, left);
  n = Math.floor(Math.log(1 + g.m * (it.g - 1) / cost1(k, i)) / Math.log(it.g));
  n = Math.max(1, Math.min(left, n));
  while (n > 1 && costK(k, i, n) > g.m) n--;
  return n;
}
function reqMet(k, i) {
  var G = GAMES[k], it = G.items[i], g = st.g[k];
  return !it.req || g.o[it.ri] >= it.req[1];
}
function refreshVis(k) {
  var G = GAMES[k], g = st.g[k], ch = false;
  G.items.forEach(function (it, i) {
    if (g.vis[i]) return;
    if (reqMet(k, i) || (g.pc > 0 && g.t >= 0.5 * it.c0)) { g.vis[i] = true; ch = true; }
  });
  return ch;
}
function tierIdx(k) {
  var G = GAMES[k], o = st.g[k].o, r = 0;
  G.tiers.forEach(function (t, j) { if (!t.c || o[t.ci] >= t.c[1]) r = j; });
  return r;
}
function pending(k) {
  var P = GAMES[k].pr, g = st.g[k];
  return Math.max(0, Math.floor(Math.cbrt(g.life / P.T0)) - g.stars);
}
function earn(k, dt) { var v = ps(k) * dt, g = st.g[k]; g.m += v; g.t += v; g.life += v; return v; }

/* ---------- UI helpers ---------- */
var UIready = false;
function setText(n, v) { if (n._v !== v) { n._v = v; n.textContent = v; } }
function setAttr(n, a, v) { if (n['_' + a] !== v) { n['_' + a] = v; n.setAttribute(a, v); } }
function setData(n, a, v) { if (n.dataset[a] !== v) n.dataset[a] = v; }
function setBar(n, p) { p = Math.round(Math.min(1, Math.max(0, p || 0)) * 100) / 100; if (n._q !== p) { n._q = p; n.style.transform = 'scaleX(' + p + ')'; } }
function setHid(n, h) { if (n.hidden !== h) n.hidden = h; }

var mq = window.matchMedia ? tryf(function () { return window.matchMedia('(prefers-reduced-motion: reduce)'); }) : null;
function RM() { return st.set.motion === 'reduce' || (st.set.motion === 'auto' && !!(mq && mq.matches)); }
function openDlg(d) { if (d.showModal) { if (!d.open) d.showModal(); } else d.setAttribute('open', ''); }
function closeDlg(d) { if (d.close) d.close(); else { d.removeAttribute('open'); d.dispatchEvent(new Event('close')); } }

var tt = 0, tfn = null;
function toast(msg, opt) {
  if (!UIready) return;
  var el = $('toast');
  clearTimeout(tt); tfn = opt && opt.fn || null;
  el.textContent = '';
  var s = document.createElement('span'); s.textContent = msg; el.appendChild(s);
  if (opt && opt.action) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = opt.action;
    b.onclick = function () { if (tfn) tfn(); el.classList.remove('show', 'act'); };
    el.appendChild(b);
  }
  el.classList.toggle('act', !!(opt && opt.action)); el.classList.add('show');
  tt = setTimeout(function () { el.classList.remove('show', 'act'); }, (opt && opt.ms) || 3200);
}

/* som e vibracao */
var AC, lastTapS = 0;
var SND = { tap: [[660, .03]], buy: [[523, .06], [784, .09]], no: [[196, .1]], up: [[392, .08], [523, .08], [659, .08], [784, .22]], ach: [[523, .07], [659, .07], [784, .07], [1047, .16]] };
function sfx(n) {
  if (!st || !st.set.sound) return;
  tryf(function () {
    var now = performance.now();
    if (n === 'tap') { if (now - lastTapS < 50) return; lastTapS = now; }
    var AX = window.AudioContext || window.webkitAudioContext; if (!AX) return;
    AC = AC || new AX(); if (AC.state === 'suspended') AC.resume();
    var t = AC.currentTime;
    SND[n].forEach(function (p) {
      var o = AC.createOscillator(), g = AC.createGain(); o.type = n === 'no' ? 'sawtooth' : 'square'; o.frequency.value = p[0];
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.05, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + p[1]);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + p[1] + .02); t += p[1] * .9;
    });
  });
}
function buzz(p) { if (st.set.haptic && !RM() && navigator.vibrate) tryf(function () { navigator.vibrate(p); }); }

/* ---------- canvas / cena ---------- */
var cv, cx, cw = 0, ch = 0, dirtyScene = true, sheetOpen = false, lastFr = 0, sceneErr = {};
var XS = { tier: 0, ev: null, boost: 1, combo: 0, stars: 0, ach: 0, goal: 0 };
function sceneX(k) {
  var r = RT[k], g = st.g[k], ev = null;
  if (r.ev) ev = r.ev.type; else if (r.bt > 0) ev = r.bk;
  XS.tier = tierIdx(k); XS.ev = ev; XS.boost = Math.max(1, boost(k)); XS.combo = r.combo; XS.stars = g.stars;
  XS.ach = nMarcos(k); XS.goal = g.goal;
  return XS;
}
function sceneO(k) { return st.g[k].o; }
function drawScene(ts) {
  var k = st.cur, sc = window.SCENES && window.SCENES[k];
  if (!sc || !cw || !cx) return;
  try { sc.draw(cx, cw, ch, sceneO(k), ts / 1000, sceneX(k)); }
  catch (e) { if (!sceneErr[k]) { sceneErr[k] = 1; console.error('cena ' + k, e); } }
}
function burst() {
  var k = st.cur, sc = window.SCENES && window.SCENES[k];
  if (RM() || !sc || !sc.burst || !cx) return;
  try { sc.burst(cx, cw, ch, performance.now() / 1000); } catch (e) { if (!sceneErr['b' + k]) { sceneErr['b' + k] = 1; console.error('burst ' + k, e); } }
}
function fit() {
  var sc = window.SCENES && window.SCENES[st.cur], box = $('scene'); if (!box || !cv) return;
  var w = box.clientWidth; if (!w) return;
  var dpr = Math.min(window.devicePixelRatio || 1, 2), sh = (sc && sc.h) || 230;
  var h = Math.round(Math.max(176, Math.min(sh, window.innerHeight * 0.30))), z = h / sh;
  cw = Math.round(w / z); ch = sh;
  document.documentElement.style.setProperty('--stage-h', h + 'px');
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  if (cx && cx.setTransform) cx.setTransform(dpr * z, 0, 0, dpr * z, 0, 0);
  dirtyScene = true;
}
function frame(ts) {
  requestAnimationFrame(frame);
  if (document.hidden || sheetOpen || !cw) return;
  if (RM()) { if (!dirtyScene) return; dirtyScene = false; ts = 2000; }
  else if (ts - lastFr < 32) return;
  lastFr = ts; drawScene(ts);
}

/* ---------- compras ---------- */
function buy(k, i, n) {
  var g = st.g[k], G = GAMES[k], it = G.items[i];
  if (!g.vis[i]) return false;
  n = n || qty(k, i);
  if (n < 1) return false;
  var c = costK(k, i, n);
  if (g.m < c * (1 - 1e-12)) return false;
  var before = multU(G, g.o, i);
  g.m = Math.max(0, g.m - c); g.o[i] += n; st.stats.buys += n;
  dirty(k); refreshVis(k);
  if (it.t === 'u' && multU(G, g.o, i) > before && UIready) { toast('Marco! ' + it.n + ' rende x2'); }
  if (it.t === 'l' && UIready) toast(it.n + ': ' + it.lv[g.o[i] - 1]);
  if (G.goals) checkGoal(k);
  return true;
}
function checkGoal(k) {
  var G = GAMES[k], g = st.g[k], got = false;
  while (G.goals && g.goal < G.goals.length && g.o[G.goals[g.goal].ci] >= G.goals[g.goal].k) {
    var rw = Math.max((G.goalMul || 300) * ps(k), 100 * clickVal(k)); g.m += rw; g.t += rw; g.life += rw;
    g.goal++; got = true; dirty(k);
    toast((k === st.cur ? '' : G.short + ': ') + 'Meta cumprida! +' + G.cur + ' ' + fmt(rw)); sfx('ach'); buzz([10, 30, 10]);
  }
  return got;
}

/* ---------- clique ---------- */
function doClick(k) {
  var r = RT[k], G = GAMES[k], g = st.g[k];
  if (G.combo) {
    if (T - r.lastClick < G.combo.gap) {
      r.combo = Math.min(G.combo.max, r.combo + 1);
      if (r.combo === G.combo.max && !r.rush) { r.rush = 1; toast(G.combo.msg); }
    }
    r.lastClick = T;
  }
  var v = clickVal(k); g.m += v; g.t += v; g.life += v; g.c++; st.stats.clicks++;
  return v;
}
var pool = [], NPOP = 8, pi = 0;
function mkPool() {
  var f = $('fx');
  for (var i = 0; i < NPOP; i++) { var d = document.createElement('div'); d.className = 'pop'; d.hidden = true; f.appendChild(d); pool.push(d); }
}
function pop(txt, x, y) {
  var d = pool[pi++ % NPOP];
  if (d.getAnimations) d.getAnimations().forEach(function (a) { a.cancel(); });
  d.textContent = txt; d.style.left = x + 'px'; d.style.top = y + 'px'; d.hidden = false;
  if (!d.animate) { setTimeout(function () { d.hidden = true; }, 600); return; }
  var rm = RM();
  var fr = rm ? [{ opacity: 1, transform: 'translate(-50%,-50%)' }, { opacity: 0, transform: 'translate(-50%,-50%)' }]
    : [{ opacity: 0, transform: 'translate(-50%,-50%) scale(.8)' }, { opacity: 1, transform: 'translate(-50%,-70%) scale(1.1)', offset: .2 }, { opacity: 0, transform: 'translate(-50%,-260%) scale(1)' }];
  d.animate(fr, { duration: rm ? 500 : 800, easing: 'ease-out' }).onfinish = function () { d.hidden = true; };
}
function anim(el, fr, o) { if (!RM() && el && el.animate) el.animate(fr, o); }
function bump(el) { anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 200 }); }
function shake(el) { anim(el, [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 240 }); }
function flash(el) { anim(el, [{ background: 'var(--c-soft)' }, { background: 'var(--s2)' }], { duration: 450, easing: 'ease-out' }); }
function tap(x, y) {
  var k = st.cur, v = doClick(k), f = $('fx');
  var w = f.clientWidth || 300, h = f.clientHeight || 200;
  var rc = f.getBoundingClientRect ? f.getBoundingClientRect() : { left: 0, top: 0 };
  var px = x == null ? w / 2 : Math.min(Math.max(x - rc.left, 24), Math.max(24, w - 24));
  var py = y == null ? h * .6 : Math.min(Math.max(y - rc.top, 28), Math.max(28, h - 8));
  pop('+' + fmt(v), px, py);
  burst(); bump($('bigic')); sfx('tap'); buzz(6); scheduleRender();
}

/* ---------- eventos ---------- */
var evEl;
function spawnEvent(k) {
  var G = GAMES[k], E = G.ev, r = RT[k];
  r.ev = { type: E.type, left: E.dur, taps: 0 };
  var b = evEl;
  b.style.left = (8 + Math.random() * 40) + '%'; b.style.top = (14 + Math.random() * 30) + '%';
  paintEvent(k);
  toast(E.type === 'apagao' ? 'Apagão! Toque 3 vezes no disjuntor.' : E.type === 'descoberta' ? 'Uma ideia surgiu! Toque na lâmpada.' : 'Hora do clutch! Toque rápido.');
  sfx('no');
}
function paintEvent(k) {
  var r = RT[k], on = !!(r && r.ev && k === st.cur), b = evEl;
  setHid(b, !on);
  if (!on) return;
  var e = r.ev.type;
  setText(b, e === 'apagao' ? '⚡ Ligar o disjuntor (' + r.ev.taps + '/3)' : e === 'descoberta' ? '💡' : '🔥 CLUTCH!');
  setAttr(b, 'aria-label', e === 'apagao' ? 'Ligar o disjuntor, ' + r.ev.taps + ' de 3 toques' : e === 'descoberta' ? 'Descoberta! Toque para coletar Ciência' : 'Clutch! Toque para triplicar a produção');
}
function endEvent(k, ok) {
  var r = RT[k], G = GAMES[k], E = G.ev, g = st.g[k];
  r.ev = null; r.evN = E.a + Math.random() * (E.b - E.a);
  if (ok) { g.evn++; }
  dirty(k); paintEvent(k);
}
function evTap() {
  var k = st.cur, r = RT[k], G = GAMES[k], g = st.g[k];
  if (!r.ev) return;
  var e = r.ev.type;
  if (e === 'apagao') {
    r.ev.taps++; sfx('tap'); buzz(8);
    if (r.ev.taps >= 3) {
      r.bt = 30; r.bm = 2; r.bk = 'bonus';
      endEvent(k, true); toast('Luz de volta! A galera aplaudiu: produção x2 por 30 s'); sfx('up'); buzz([20, 40, 20]);
    } else paintEvent(k);
  } else if (e === 'descoberta') {
    var v = Math.max(20 * ps(k), 20 * clickVal(k)); g.m += v; g.t += v; g.life += v;
    var f = G.facts[Math.random() * G.facts.length | 0];
    endEvent(k, true); toast('Eureka! ' + f.replace(/^Fato:\s*/, 'Fato: ') + ' (+' + G.cur + ' ' + fmt(v) + ')', { ms: 5000 }); sfx('up'); buzz(15);
  } else {
    r.bt = 20; r.bm = 3; r.bk = 'clutch';
    endEvent(k, true); toast('O ADC fez um 1v4! Produção x3 por 20 s'); sfx('up'); buzz([20, 40, 20]);
  }
  burst(); scheduleRender();
}
function evTick(dt) {
  KEYS.forEach(function (k) {
    var r = RT[k], E = GAMES[k].ev;
    if (r.bt > 0) { r.bt -= dt; if (r.bt <= 0) { r.bt = 0; r.bm = 1; r.bk = ''; dirty(k); } }
    if (r.ev) {
      r.ev.left -= dt;
      if (r.ev.left <= 0) {
        var e = r.ev.type; endEvent(k, false);
        if (k === st.cur) toast(e === 'apagao' ? 'A luz voltou sozinha... teve cliente pedindo reembolso.' : e === 'clutch' ? 'Perdeu a jogada... tem a próxima.' : 'A ideia passou... a próxima vem aí.');
      }
    } else if (k === st.cur && !document.hidden && !r.bt && st.g[k].rt >= E.min && psBase(k) > 0) {
      r.evN -= dt;
      if (r.evN <= 0) spawnEvent(k);
    }
    if (GAMES[k].combo && T - r.lastClick > GAMES[k].combo.reset) { r.combo = 0; r.rush = 0; }
  });
}

/* ---------- conquistas ---------- */
function achCur(k, a) {
  var g = st.g[k], c = a.c, G = GAMES[k];
  switch (c[0]) {
    case 'own': return [g.o[a.ci], c[2]];
    case 'max': return [g.o[a.ci], G.items[a.ci].max];
    case 'ps': return [psBase(k), c[1]];
    case 'tot': return [g.life, c[1]];
    case 'click': return [g.c, c[1]];
    case 'ev': return [g.evn, c[1]];
    case 'stars': return [g.stars, c[1]];
    case 'goal': return [g.goal, c[1]];
  }
  return [0, 1];
}
function checkAch() {
  KEYS.forEach(function (k) {
    var G = GAMES[k], g = st.g[k];
    G.ach.forEach(function (a) {
      if (g.ach[a.id]) return;
      var v = achCur(k, a);
      if (v[0] >= v[1]) {
        g.ach[a.id] = Date.now();
        if (a.m) { dirty(k); toast('🏅 Marco: ' + a.n + ' (+2% para sempre)'); } else toast('Conquista: ' + a.n);
        sfx('ach'); buzz([10, 30, 10]);
      }
    });
  });
  var tot = 0; KEYS.forEach(function (k) { tot += Object.keys(st.g[k].ach).length; });
  if (UIready) { var mc = $('menucnt'); setText(mc, String(tot)); setHid(mc, tot === 0); }
}
function checkStages() {
  KEYS.forEach(function (k) {
    var r = RT[k], i = tierIdx(k);
    if (r.sg < 0) { r.sg = i; return; }
    if (i > r.sg) {
      r.sg = i; var nome = GAMES[k].tiers[i].n;
      if (k === st.cur) stageUp(nome); else toast(GAMES[k].name + ': ' + nome + '!');
    }
  });
}
function stageUp(nome) {
  if (!UIready) return;
  var b = $('banner'); b.querySelector('b').textContent = nome;
  b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
  toast('Nova fase: ' + nome); sfx('up'); buzz([20, 40, 20]);
  if (!RM()) for (var j = 0; j < 3; j++) setTimeout(burst, j * 220);
}

/* ---------- prestigio ---------- */
function prestige(k) {
  var g = st.g[k], G = GAMES[k], p = pending(k);
  if (p < 3) return false;
  g.stars += p; g.pc++;
  g.m = 0; g.t = 0; g.rt = 0; g.goal = 0;
  g.o = G.items.map(function () { return 0; });
  g.vis = G.items.map(function () { return false; });
  var r = RT[k]; r.ev = null; r.bt = 0; r.bm = 1; r.bk = ''; r.combo = 0; r.sg = 0;
  r.evN = G.ev.a + Math.random() * (G.ev.b - G.ev.a);
  dirty(k); refreshVis(k); checkAch();
  toast(G.pr.coin + ' +' + p + ' (+' + (p * 10) + '% para sempre)'); sfx('up'); buzz([30, 50, 30]);
  if (UIready) { dirtyScene = true; buildRows(); scheduleRender(); }
  save();
  return p;
}

/* ---------- tick ---------- */
var acc = 0, acc2 = 0;
function tick(dt) {
  T += dt; st.stats.play += dt;
  KEYS.forEach(function (k) { st.g[k].rt += dt; earn(k, dt); });
  evTick(dt);
  acc += dt;
  if (acc >= 1) {
    acc = 0;
    KEYS.forEach(function (k) { if (refreshVis(k)) { /* nova linha */ } if (GAMES[k].goals) checkGoal(k); });
    checkAch(); checkStages();
  }
  if (UIready) { paintHud(); acc2 += dt; if (acc2 >= 0.3) { acc2 = 0; paintRows(); paintEvent(st.cur); } }
}

/* ---------- offline ---------- */
function creditAway(sec) {
  if (!(sec >= 30)) return null;
  var cap = Math.min(sec, MAXAWAY), b = {}, d = {};
  KEYS.forEach(function (k) { b[k] = st.g[k].m; });
  KEYS.forEach(function (k) { var g = st.g[k], v = psBase(k) * cap * EFF; g.m += v; g.t += v; g.life += v; d[k] = v; });
  st.stats.awayMax = Math.max(st.stats.awayMax, sec);
  if (UIready) showAway(sec, d);
  return d;
}
function showAway(sec, d) {
  setText($('awayT'), 'Você ficou fora por ' + fmtD(sec) + '. Ganho offline: 50% da produção, até 4 h' + (sec > MAXAWAY ? ' (o resto do tempo não conta)' : '') + '.');
  $('awayL').innerHTML = KEYS.map(function (k) { return '<div class="stat"><span>' + GAMES[k].name + '</span><b>+' + GAMES[k].cur + ' ' + fmt(d[k]) + '</b></div>'; }).join('');
  openDlg($('away')); sfx('buy');
}

/* ---------- render ---------- */
var H, UI = [], MYST, MORE, STRIP, PRES, NAV = {}, rq = 0, presArm = 0;
function scheduleRender() { if (rq) return; rq = requestAnimationFrame(function () { rq = 0; paintHud(); paintRows(); paintNav(); }); }
function paintHud() {
  var k = st.cur, G = GAMES[k], g = st.g[k], i = tierIdx(k), nx = G.tiers[i + 1], p = 1, txt = 'Fase final';
  setText(H.bal, G.cur + ' ' + fmt(g.m));
  setText(H.ps, G.cur + ' ' + fmt(ps(k)) + '/s');
  setText(H.stage, G.tiers[i].n);
  if (nx) {
    var it = G.items[nx.ci], o = g.o[nx.ci], c = cost1(k, nx.ci);
    p = (Math.min(o, nx.c[1]) + (o < nx.c[1] && g.vis[nx.ci] ? Math.min(1, g.m / c) : 0)) / nx.c[1];
    txt = 'Próx.: ' + nx.n + ' · ' + Math.min(o, nx.c[1]) + '/' + nx.c[1] + ' ' + it.n;
  }
  setText(H.next, txt); setBar(H.bar, p);
  if (H.bigv) {
    var G2 = GAMES[k], r = RT[k];
    setText(H.bigv, '+' + fmt(clickVal(k)) + ' por toque' + (G2.combo && r.combo > 1 ? ' · ' + G2.combo.name + ' x' + r.combo : ''));
    setBar(H.cbar.firstElementChild, G2.combo ? r.combo / G2.combo.max : 0);
  }
}
function buildRows() {
  var k = st.cur, G = GAMES[k], list = $('rows');
  list.textContent = '';
  var html = '<li class="pres" id="pres" hidden><div><b></b><small></small></div><button class="btn pri" type="button"></button></li>';
  html += G.items.map(function (it, i) {
    return '<li class="row" data-i="' + i + '" data-state="hidden" hidden><div class="ic" aria-hidden="true"></div>' +
      '<div><div class="l1"><span class="nm"></span><span class="own"></span></div><div class="ds"></div><div class="lvn"></div>' +
      '<div class="ms"><span class="mg"></span><span class="mbar"><b></b></span><span class="mt"></span></div></div>' +
      '<div class="bw"><button class="buy" type="button" data-i="' + i + '" aria-disabled="true"><i class="fill"></i><span class="b1"></span><span class="b2"></span></button></div></li>';
  }).join('');
  html += '<li class="row" id="myst" data-state="mystery" hidden><div class="ic" aria-hidden="true">?</div><div><div class="l1"><span class="nm"></span></div><div class="ds"></div>' +
    '<div class="ms"><span class="mbar" style="width:80px"><b></b></span></div></div></li>';
  html += '<li class="more" id="more" hidden></li><li class="strip" id="strip" hidden aria-label="Itens completos"></li>';
  list.innerHTML = html;
  var q = function (r, s) { return r.querySelector(s); };
  UI = Array.prototype.map.call(list.querySelectorAll('.row[data-i]'), function (r) {
    return { r: r, nm: q(r, '.nm'), own: q(r, '.own'), ds: q(r, '.ds'), lv: q(r, '.lvn'), mg: q(r, '.mg'), mb: q(r, '.mbar>b'), mt: q(r, '.mt'),
      buy: q(r, '.buy'), fill: q(r, '.fill'), b1: q(r, '.b1'), b2: q(r, '.b2'), ic: q(r, '.ic') };
  });
  var my = $('myst');
  MYST = { r: my, nm: q(my, '.nm'), ds: q(my, '.ds'), mb: q(my, '.mbar>b') };
  MORE = $('more'); STRIP = $('strip');
  var pr = $('pres'); PRES = { r: pr, t: q(pr, 'b'), s: q(pr, 'small'), b: q(pr, 'button') };
  PRES.b.addEventListener('click', onPres);
  UI.forEach(function (u, i) { u.ic.textContent = G.items[i].ic; u.nm.textContent = G.items[i].n; u.ds.textContent = G.items[i].d; });
}
function gainOf(k, i, n) {
  var g = st.g[k], o = g.o.slice(); o[i] += n;
  return (psRaw(k, o) - psBase(k));
}
function paintRows() {
  var k = st.cur, G = GAMES[k], g = st.g[k], rate = ps(k), best = -1, bestC = Infinity, done = [], firstLocked = -1, locked = 0;
  G.items.forEach(function (it, i) {
    var u = UI[i]; if (!u) return;
    var o = g.o[i];
    if (o >= it.max) { setData(u.r, 'state', 'done'); setHid(u.r, false); done.push(it); return; }
    if (!g.vis[i]) { setHid(u.r, true); setData(u.r, 'state', 'hidden'); locked++; if (firstLocked < 0) firstLocked = i; return; }
    setHid(u.r, false);
    var n = qty(k, i), c = costK(k, i, n), ok = g.m >= c;
    setText(u.own, it.t === 'u' ? o + '/' + it.max : 'nv ' + o + '/' + it.max);
    setText(u.mg, '+' + fmt(gainOf(k, i, n)) + '/s');
    if (it.t === 'u') {
      var nm = 0; for (var q = 0; q < it.mc.length; q++) if (o < it.mc[q]) { nm = it.mc[q]; break; }
      setBar(u.mb, nm ? o / nm : 1); setText(u.mt, nm ? 'x2 ao ter ' + nm : 'marcos completos');
    } else {
      setBar(u.mb, o / it.max);
      setText(u.mt, 'x' + fx(it.f) + (it.tgt === 'all' ? ' em tudo' : ' em ' + G.items[G.idx[it.tgt]].n));
      setText(u.lv, (o > 0 ? it.lv[o - 1] + ' › ' : 'Próx.: ') + it.lv[o]);
    }
    setText(u.b1, ok ? 'Comprar x' + n : (rate > 0 ? 'faltam ' + fmtT((c - g.m) / rate) : 'faltam ' + fmt(c - g.m)));
    setText(u.b2, G.cur + ' ' + fmt(c)); setBar(u.fill, g.m / c);
    setAttr(u.buy, 'aria-disabled', ok ? 'false' : 'true');
    setAttr(u.buy, 'aria-label', 'Comprar ' + n + ' ' + it.n + ' por ' + G.cur + ' ' + fmt(c) + (ok ? '' : ', ainda não disponível'));
    setData(u.r, 'state', ok ? 'afford' : 'poor');
    if (ok && cost1(k, i) < bestC) { best = i; bestC = cost1(k, i); }
  });
  /* itens completos: so a faixa compacta */
  UI.forEach(function (u, i) { setData(u.r, 'best', i === best ? '1' : '0'); });
  var sk = done.map(function (it) { return it.n; }).join('|');
  if (STRIP._k !== sk) {
    STRIP._k = sk; STRIP.textContent = '';
    done.forEach(function (it) { var s = document.createElement('span'); s.textContent = '✔ ' + it.n; STRIP.appendChild(s); });
  }
  setHid(STRIP, done.length === 0);
  if (firstLocked >= 0) {
    var it2 = G.items[firstLocked], rq2 = G.items[it2.ri], need = it2.req[1];
    setHid(MYST.r, false); setText(MYST.nm, '🔒 ???');
    setText(MYST.ds, rq2.t === 'u' ? 'Tenha ' + need + ' ' + rq2.n : 'Compre ' + rq2.n + (need > 1 ? ' (nível ' + need + ')' : ''));
    setBar(MYST.mb, g.o[it2.ri] / need);
  } else setHid(MYST.r, true);
  setText(MORE, locked > 1 ? '+ ' + (locked - 1) + ' por descobrir' : ''); setHid(MORE, locked <= 1);
  paintPres(); paintGoal();
}
function paintPres() {
  var k = st.cur, g = st.g[k], P = GAMES[k].pr, p = pending(k), show = p > 0;
  setHid(PRES.r, !show); if (!show) return;
  setText(PRES.t, P.coin + ' ' + g.stars + ' (+' + (g.stars * 10) + '%)');
  var can = p >= 3;
  setText(PRES.s, can ? P.name + ': ganhe ' + P.coin.split(' ')[0] + ' ' + p + ' (+' + (p * 10) + '% para sempre)' : 'Pendente: ' + p + ' (precisa de 3 para ' + P.name.toLowerCase() + ')');
  setText(PRES.b, presArm ? 'Confirmar?' : (can ? P.name : 'Em breve'));
  setAttr(PRES.b, 'aria-disabled', can ? 'false' : 'true');
}
function onPres() {
  var k = st.cur, p = pending(k);
  if (p < 3) { toast('Faltam ' + (3 - p) + ' para poder recomeçar.'); return; }
  if (!presArm) { presArm = 1; paintPres(); toast(GAMES[k].pr.ask + ' Toque de novo para confirmar.'); setTimeout(function () { presArm = 0; if (UIready) paintPres(); }, 4000); return; }
  presArm = 0; prestige(k);
}
function paintGoal() {
  var k = st.cur, G = GAMES[k], g = st.g[k], el = $('goal');
  if (!G.goals) { setHid(el, true); return; }
  setHid(el, false);
  if (g.goal >= G.goals.length) { setText($('goalT'), 'Todas as metas da temporada cumpridas'); setText($('goalV'), ''); setBar($('goalB'), 1); return; }
  var m = G.goals[g.goal], o = g.o[m.ci];
  setText($('goalT'), 'Meta: ' + m.n + ' (' + G.items[m.ci].n + ' ' + m.k + ')');
  setText($('goalV'), Math.min(o, m.k) + '/' + m.k); setBar($('goalB'), o / m.k);
}
function paintNav() {
  KEYS.forEach(function (k) {
    var n = NAV[k]; if (!n) return;
    setText(n.ps, GAMES[k].cur + ' ' + fmt(ps(k)) + '/s');
    var can = false, G = GAMES[k], g = st.g[k];
    if (k !== st.cur) G.items.forEach(function (it, i) { if (g.vis[i] && g.o[i] < it.max && g.m >= cost1(k, i)) can = true; });
    setHid(n.dot, !can);
    setAttr(n.b, 'aria-current', k === st.cur ? 'page' : 'false');
  });
}
function build() {
  var k = st.cur, G = GAMES[k], r = document.documentElement.style;
  r.setProperty('--c', G.color); r.setProperty('--c-tx', G.tx); r.setProperty('--c-soft', G.color + '29'); r.setProperty('--c-glow', G.color + '66');
  document.title = G.name + ' | Mini Idle';
  $('bigic').textContent = G.clickIc; $('bigtx').textContent = G.click;
  $('cbar').classList.toggle('on', !!G.combo);
  cv.setAttribute('aria-label', 'Cena animada: ' + G.name);
  Array.prototype.forEach.call(document.querySelectorAll('#modes .mode'), function (b) { b.setAttribute('aria-checked', String(b.dataset.m === st.mode)); });
  buildRows(); fit(); say(); dirtyScene = true; paintHud(); paintRows(); paintNav(); paintEvent(k);
}
var tk;
function say() {
  var m = GAMES[st.cur].msgs; tk.classList.remove('on');
  setTimeout(function () { tk.textContent = m[Math.random() * m.length | 0]; tk.classList.add('on'); }, 420);
}

/* ---------- menu ---------- */
function openSheet(tab) { showTab(tab || 'pAch'); document.body.classList.toggle('rm', RM()); sheetOpen = true; openDlg($('sheet')); }
function showTab(id) {
  Array.prototype.forEach.call(document.querySelectorAll('.stab'), function (t) { t.setAttribute('aria-selected', String(t.dataset.p === id)); });
  Array.prototype.forEach.call(document.querySelectorAll('.sbody>section'), function (p) { p.hidden = p.id !== id; });
  if (id === 'pAch') renderAch(); if (id === 'pStats') renderStats(); if (id === 'pSet') paintSettings();
}
function renderAch() {
  var html = '', tot = 0, done = 0;
  KEYS.forEach(function (k) { tot += GAMES[k].ach.length; done += Object.keys(st.g[k].ach).length; });
  html += '<p class="stat"><span>Conquistas</span><b>' + done + ' / ' + tot + '</b></p>';
  KEYS.forEach(function (k) {
    var G = GAMES[k], g = st.g[k];
    html += '<h4 class="gh" style="--c-tx:' + G.tx + '">' + G.emoji + ' ' + G.name + '</h4><div class="agrid">';
    G.ach.forEach(function (a) {
      var on = !!g.ach[a.id], v = achCur(k, a), p = Math.min(1, v[0] / v[1]);
      html += '<div class="ach" data-on="' + (on ? 1 : 0) + '" style="--c:' + G.color + '"><div class="ai" aria-hidden="true">' + a.ic + '</div><b>' + a.n + '</b><small>' + a.d + '</small>' +
        (a.m ? '<span class="st">' + (on ? 'Marco ativo: +2%' : 'Marco: +2% de produção') + '</span>' : '') +
        (on ? '' : '<div class="pb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.floor(p * 100) + '"><i style="width:' + (p * 100) + '%"></i></div>') + '</div>';
    });
    html += '</div>';
  });
  $('pAch').innerHTML = html;
}
function renderStats() {
  var s = st.stats, rows = [['Toques', fmt(s.clicks)], ['Compras', fmt(s.buys)], ['Tempo jogado', fmtD(s.play)],
    ['Primeira partida', new Date(s.since).toLocaleDateString('pt-BR')]];
  KEYS.forEach(function (k) {
    var G = GAMES[k], g = st.g[k];
    rows.push([G.name + ' · renda total', G.cur + ' ' + fmt(g.life)], [G.name + ' · fase', (tierIdx(k) + 1) + ' / ' + G.tiers.length],
      [G.name + ' · ' + G.pr.coin.split(' ').slice(1).join(' '), g.stars + ' (+' + g.stars * 10 + '%)']);
  });
  $('pStats').innerHTML = rows.map(function (r) { return '<div class="stat"><span>' + r[0] + '</span><b>' + r[1] + '</b></div>'; }).join('');
}
function paintSettings() {
  Array.prototype.forEach.call(document.querySelectorAll('.set[data-s]'), function (b) { b.setAttribute('aria-checked', String(!!st.set[b.dataset.s])); });
  Array.prototype.forEach.call(document.querySelectorAll('#motion button'), function (b) { b.setAttribute('aria-checked', String(b.dataset.v === st.set.motion)); });
}
function crc(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(36); }
function exportSave() {
  st.last = Date.now();
  var j = JSON.stringify({ v: 2, d: st });
  return 'MI2:' + btoa(unescape(encodeURIComponent(j))) + ':' + crc(j);
}
function parseSave(txt) {
  var p = String(txt).trim().split(':');
  if (p[0] !== 'MI2' || !p[1]) throw new Error('Formato inválido');
  var j;
  try { j = decodeURIComponent(escape(atob(p[1]))); } catch (e) { throw new Error('Texto incompleto ou alterado'); }
  if (crc(j) !== p[2]) throw new Error('Texto incompleto ou alterado');
  var o = JSON.parse(j);
  return sanitize(o.d);
}
function applyState(s) {
  st = s; KEYS.forEach(function (k) { dirty(k); RT[k].ev = null; RT[k].bt = 0; RT[k].bm = 1; RT[k].combo = 0; refreshVis(k); RT[k].sg = tierIdx(k); });
  document.body.classList.toggle('rm', RM());
  if (UIready) { build(); checkAch(); paintSettings(); }
}
function importSave(txt) {
  var d = parseSave(txt), old = JSON.stringify(st);
  tryf(function () { localStorage.setItem(K + '-undo', old); });
  applyState(d); save();
  return true;
}
var zerar = null, undoSnap = null;
function askReset(scope) { zerar = scope; $('dlgTitle').textContent = scope === 'all' ? 'Zerar os 3 jogos?' : 'Zerar ' + GAMES[st.cur].name + '?'; openDlg($('dlg')); }
function doReset() {
  closeDlg($('dlg'));
  var snap = JSON.stringify(st);
  (zerar === 'all' ? KEYS : [st.cur]).forEach(function (k) {
    st.g[k] = newG(k); dirty(k); refreshVis(k); RT[k].ev = null; RT[k].bt = 0; RT[k].combo = 0; RT[k].sg = 0;
  });
  build(); save(); closeDlg($('sheet'));
  toast('Jogo zerado.', { action: 'Desfazer', ms: 10000, fn: function () { applyState(sanitize(JSON.parse(snap))); save(); } });
}

/* ---------- inicializacao ---------- */
function initUI() {
  cv = $('sc'); cx = tryf(function () { return cv.getContext('2d'); }); tk = $('msg'); evEl = $('evbtn');
  H = { bal: $('bal'), ps: $('ps'), stage: $('stage'), next: $('next'), bar: $('stbar').firstElementChild, bigv: $('bigv'), cbar: $('cbar') };
  mkPool();
  Array.prototype.forEach.call(document.querySelectorAll('.nv[data-k]'), function (b) { NAV[b.dataset.k] = { b: b, ps: b.querySelector('.nv-ps'), dot: b.querySelector('.dot') }; });
  UIready = true;
  var box = $('stagebox');
  box.addEventListener('pointerdown', function (e) { if (e.button > 0) return; if (e.target.closest && e.target.closest('#evbtn')) return; tap(e.clientX, e.clientY); });
  $('big').addEventListener('click', function (e) { if (e.detail === 0) tap(); });
  evEl.addEventListener('click', evTap);
  $('rows').addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.buy') : null; if (!b) return;
    var k = st.cur, i = +b.dataset.i, n = qty(k, i), c = costK(k, i, n), g = st.g[k], row = b.closest('.row');
    if (g.m < c) {
      shake(b); sfx('no'); buzz(12);
      var r = ps(k); toast('Faltam ' + GAMES[k].cur + ' ' + fmt(c - g.m) + (r > 0 ? ' (~' + fmtT((c - g.m) / r) + ')' : ''));
      return;
    }
    buy(k, i, n);
    flash(row); bump(row.querySelector('.own')); sfx('buy'); buzz(10);
    pop('-' + fmt(c), ($('fx').clientWidth || 300) / 2, ($('fx').clientHeight || 200) * .5);
    burst(); dirtyScene = true; paintHud(); paintRows(); paintNav(); save();
  });
  document.querySelector('.nav').addEventListener('click', function (e) {
    var b = e.target.closest('.nv'); if (!b) return;
    if (b.id === 'menu') return openSheet();
    if (b.dataset.k !== st.cur) { st.cur = b.dataset.k; $('rows').scrollTop = 0; presArm = 0; build(); save(); sfx('tap'); }
  });
  $('modes').addEventListener('click', function (e) {
    var b = e.target.closest('.mode'); if (!b) return;
    st.mode = b.dataset.m; Array.prototype.forEach.call(document.querySelectorAll('#modes .mode'), function (x) { x.setAttribute('aria-checked', String(x === b)); });
    paintRows(); save();
  });
  /* colapso da cena */
  var app = $('app'), list = $('rows'), compact = false;
  function setCompact(v) {
    if (v === compact) return; compact = v; app.classList.toggle('compact', v); $('fold').textContent = v ? 'v' : '^';
    $('fold').setAttribute('aria-expanded', String(!v)); $('fold').setAttribute('aria-label', v ? 'Mostrar cena' : 'Ampliar lista');
  }
  list.addEventListener('scroll', function () {
    var y = list.scrollTop, spare = list.scrollHeight - list.clientHeight;
    if (!compact && y > 40 && spare > 120) setCompact(true); else if (compact && y < 4) setCompact(false);
  }, { passive: true });
  $('fold').addEventListener('click', function () { setCompact(!compact); });
  /* menu */
  var sheet = $('sheet');
  sheet.addEventListener('close', function () { sheetOpen = false; dirtyScene = true; });
  sheet.addEventListener('click', function (e) { if (e.target === sheet) closeDlg(sheet); });
  $('stabs').addEventListener('click', function (e) { var t = e.target.closest('.stab'); if (t) showTab(t.dataset.p); });
  $('xclose').addEventListener('click', function () { closeDlg(sheet); });
  document.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('.set[data-s]') : null;
    if (b) { st.set[b.dataset.s] = !st.set[b.dataset.s]; paintSettings(); save(); if (b.dataset.s === 'sound') sfx('buy'); return; }
    var m = e.target.closest ? e.target.closest('#motion button') : null;
    if (m) { st.set.motion = m.dataset.v; document.body.classList.toggle('rm', RM()); dirtyScene = true; paintSettings(); save(); }
  });
  $('btnExport').addEventListener('click', function () { var t = $('saveTxt'); t.value = exportSave(); t.select(); toast('Save exportado. Toque em Copiar.'); });
  $('btnCopy').addEventListener('click', function () {
    var t = $('saveTxt'); if (!t.value) t.value = exportSave(); t.select();
    var ok = function () { toast('Save copiado'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t.value).then(ok, function () { tryf(function () { document.execCommand('copy'); }); ok(); });
    else { tryf(function () { document.execCommand('copy'); }); ok(); }
  });
  $('btnImport').addEventListener('click', function () {
    try {
      importSave($('saveTxt').value);
      toast('Save importado.', { action: 'Desfazer', ms: 10000, fn: function () { var u = tryf(function () { return localStorage.getItem(K + '-undo'); }); if (u) { applyState(sanitize(JSON.parse(u))); save(); } } });
    } catch (err) { toast('Importar falhou: ' + err.message); }
  });
  $('btnResetOne').addEventListener('click', function () { askReset('one'); });
  $('btnResetAll').addEventListener('click', function () { askReset('all'); });
  $('dlgNo').addEventListener('click', function () { closeDlg($('dlg')); });
  $('dlgYes').addEventListener('click', doReset);
  $('awayOk').addEventListener('click', function () { closeDlg($('away')); });
  if (window.ResizeObserver) {
    var rzT = 0, lw = 0, lh = 0;
    new ResizeObserver(function () { clearTimeout(rzT); rzT = setTimeout(function () { var w = $('scene').clientWidth; if (w !== lw || Math.abs(window.innerHeight - lh) > 80) { lw = w; lh = window.innerHeight; fit(); } }, 150); }).observe($('scene'));
  }
  setInterval(function () { if (!document.hidden) say(); }, 12000);
  requestAnimationFrame(frame);
}

var prev = Date.now(), hiddenAt = 0;
function start() {
  st = load(); initRT();
  KEYS.forEach(function (k) { refreshVis(k); RT[k].sg = tierIdx(k); });
  initUI();
  document.body.classList.toggle('rm', RM());
  creditAway((Date.now() - st.last) / 1000);
  build(); checkAch(); paintSettings();
  setInterval(function () {
    if (document.hidden) return;
    var n = Date.now(), dt = Math.min((n - prev) / 1000, 5); prev = n;
    if (dt > 0) tick(dt);
  }, 100);
  setInterval(save, 5000);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { hiddenAt = Date.now(); save(); }
    else { if (hiddenAt) creditAway((Date.now() - hiddenAt) / 1000); hiddenAt = 0; prev = Date.now(); dirtyScene = true; build(); }
  });
  window.addEventListener('pagehide', save);
}

window.IDLE = {
  get st() { return st; }, KEYS: KEYS, RT: RT, tick: tick, tap: tap, doClick: doClick, buy: buy, qty: qty, costK: costK, cost1: cost1,
  ps: ps, psBase: psBase, clickVal: clickVal, pending: pending, prestige: prestige, creditAway: creditAway, tierIdx: tierIdx,
  exportSave: exportSave, importSave: importSave, save: save, evTap: evTap, spawnEvent: spawnEvent, fmt: fmt, refreshVis: refreshVis,
  setT: function (v) { T = v; }, get T() { return T; }, newSt: newSt, applyState: applyState, build: build, load: load,
  paintRows: paintRows, openSheet: openSheet, showTab: showTab, ui: function (v) { UIready = v; }
};
start();
})();
