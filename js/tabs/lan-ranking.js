/* Aba RANKING da Lan House (plugin: Engine.registerTab). Regras e numeros: docs/TABS_LAN.md.
   Clientes fixos gerados proceduralmente que jogam entre si e nos torneios, evoluem, fazem rivalidades,
   disputam o titulo semanal de "Campeao da lan" e, quando fieis, rendem um bonus pequeno (teto +7%). */
(function () {
'use strict';
var MATCH_EVERY = 20, WEEK = 480, ARRIVE = 120, FIEL = 50, FIEL_B = 0.0022, SPON_B = 0.005, BONUS_CAP = 0.07, SPON_MAX = 3, CLMAX = 20;
var GM = { cs: ['🔫', 'CS 1.6'], fifa: ['⚽', 'FIFA'], mk: ['🥋', 'MK'], lol: ['🧙', 'LoL'], war: ['🛡️', 'DotA'], rag: ['⚔️', 'Ragnarök'] };
var FAV = ['cs', 'cs', 'cs', 'fifa', 'fifa', 'fifa', 'mk', 'mk', 'lol', 'lol', 'war', 'rag'];
var A1 = ['Zé', 'Lucão', 'Biel', 'Magrão', 'Tiaguinho', 'Naldo', 'Jão', 'Kaká', 'Fabinho', 'Paulinho', 'Dudu', 'Rafinha', 'Cabeção', 'Pardal', 'Juninho', 'Vitinho', 'Marquinhos', 'Chico', 'Gabi', 'Tio Beto'];
var B1 = ['do AWP', 'Headshot', 'Rush B', 'do Ping', 'Sem Lag', 'Noob Master', 'do Fiado', 'da Mãe', 'Campeiro', 'do Orkut', 'do Habbo', 'Mid ou Feed', 'Pistoleiro', 'das Antigas', 'Tilt', 'AFK', 'Aimbot (jura que não)', 'da Coxinha'];
var W1 = ['Sniper', 'Dragão', 'Ninja', 'Goku', 'Lobo', 'Shadow', 'Killer', 'Naruto', 'Pikachu', 'Viper', 'Fúria', 'Tigrão', 'Bruxo', 'Capitão', 'Doido', 'Sasuke'];
var QT = ['"Foi lag."', '"Joguei de olho fechado."', '"Minha mãe mandou voltar."', '"Já volto, vou no banheiro."', '"Joga aí, que eu só olho."', '"O mouse tá errado."', '"Rodada final, juro."'];

var S = null, UI = null, apiR = null, tM = 0, tX = 0;
function fresh() { return { v: 1, seed: (Math.random() * 4294967296) >>> 0, cl: [], nid: 1, wk: 1, wt: WEEK, tm: MATCH_EVERY, ta: 30, seen: 0, champs: [], rec: { streak: { n: '', c: 0 }, pts: { n: '', c: 0 }, tw: { n: '', c: 0 }, ti: { n: '', c: 0 } }, rv: [], spons: 0, gifts: 0, first: 0 }; }
function rnd() { S.seed = (S.seed + 0x6D2B79F5) | 0; var t = Math.imul(S.seed ^ (S.seed >>> 15), 1 | S.seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function pick(a) { return a[(rnd() * a.length) | 0]; }
function num(v, d, lo, hi) { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
function P(api) { return Math.max(2, api.psBase()); }
function f1(n) { return (Math.round(n * 10) / 10).toString().replace('.', ','); }
function byId(id) { for (var i = 0; i < S.cl.length; i++) if (S.cl[i].id === id) return S.cl[i]; return null; }
function cap(api) { return Math.min(CLMAX, 4 + api.owned('pc') + api.owned('net') + api.owned('cant')); }
function nSp() { var n = 0; S.cl.forEach(function (c) { if (c.sp) n++; }); return n; }
function sponCost(api) { return 40 * P(api) * (1 + 0.75 * nSp()); }
function bonus() { var b = 0; S.cl.forEach(function (c) { if (c.ly >= FIEL) b += FIEL_B; if (c.sp) b += SPON_B; }); return Math.min(BONUS_CAP, b); }
function nFiel() { var n = 0; S.cl.forEach(function (c) { if (c.ly >= FIEL) n++; }); return n; }

function mkNick() {
  var n, i = 0;
  do {
    var r = rnd();
    n = r < 0.5 ? pick(A1) + ' ' + pick(B1) : r < 0.78 ? 'xX_' + pick(W1) + '_Xx' : r < 0.9 ? pick(W1) + (2001 + ((rnd() * 10) | 0)) : pick(W1) + '_BR';
    if (i++ > 6) n += ' ' + (S.nid);
  } while (S.cl.some(function (c) { return c.n === n; }));
  return n;
}
function newClient(api) {
  var sk = 18 + rnd() * 48 + Math.min(14, (api.life ? Math.log10(1 + api.life()) : 0) * 1.4);
  var c = { id: S.nid++, n: mkNick(), g: pick(FAV), sk: Math.min(85, sk), pt: 0, ly: 4 + rnd() * 10, w: 0, pl: 0, st: 0, bs: 0, sp: 0, rv: 0, wp: 0, tw: 0, tt: 0, age: 0, q: (rnd() * QT.length) | 0 };
  c.pt = 1000 + (c.sk - 40) * 3; S.cl.push(c); return c;
}
function exportPool(api) { api.shared['rk:pool'] = S.cl.map(function (c) { return { id: c.id, n: c.n, g: c.g, sk: Math.round(c.sk), sp: c.sp }; }); }
function effects(api) { api.mult('rk:fiel', 1 + bonus()); api.invalidate(); }

function recUpd(key, c, val) { var r = S.rec[key]; if (val > r.c) { r.c = val; r.n = c.n; } }
function pairRv(api) {
  S.rv = S.rv.filter(function (r) { return byId(r.a) && byId(r.b); });
  S.cl.forEach(function (c) { c.rv = 0; }); S.rv.forEach(function (r) { byId(r.a).rv = r.b; byId(r.b).rv = r.a; });
  var tries = 0;
  while (S.rv.length < 3 && tries++ < 20) {
    var free = S.cl.filter(function (c) { return !c.rv; }); if (free.length < 2) break;
    var a = pick(free), cand = free.filter(function (c) { return c !== a && (c.g === a.g || Math.abs(c.sk - a.sk) < 12); });
    if (!cand.length) continue; var b = pick(cand);
    S.rv.push({ a: a.id, b: b.id, wa: 0, wb: 0 }); a.rv = b.id; b.rv = a.id;
  }
}
function play(a, b, rival) {
  var p = 1 / (1 + Math.exp(-(a.sk - b.sk) / 10)), aw = rnd() < p, w = aw ? a : b, l = aw ? b : a, k = 24;
  var ew = 1 / (1 + Math.pow(10, (l.pt - w.pt) / 400));
  w.pt += k * (1 - ew); l.pt -= k * (1 - ew); w.w++; a.pl++; b.pl++;
  w.st++; l.st = 0; if (w.st > w.bs) w.bs = w.st; w.wp += rival ? 5 : 3; l.wp += 1;
  [a, b].forEach(function (c) { c.sk = Math.min(100, c.sk + 0.35 * (1 - c.sk / 100) * (c.sp ? 2 : 1)); c.ly = Math.min(100, c.ly + 3); });
  if (rival) { var r = S.rv.filter(function (x) { return (x.a === a.id && x.b === b.id) || (x.a === b.id && x.b === a.id); })[0]; if (r) { if (r.a === w.id) r.wa++; else r.wb++; } }
  recUpd('streak', w, w.st); recUpd('pts', w, Math.round(w.pt));
}
function matchRound(api) {
  if (S.cl.length < 2) return;
  var a, b;
  if (S.rv.length && rnd() < 0.5) { var r = pick(S.rv); a = byId(r.a); b = byId(r.b); play(a, b, true); }
  else { a = pick(S.cl); do { b = pick(S.cl); } while (b === a); play(a, b, false); }
}
function onTournament(api, res) {
  var w = byId(+res.wi);
  S.cl.forEach(function (c) {
    var fav = c.g === res.g; c.ly = Math.min(100, c.ly + (fav ? 6 : 2)); c.pl += fav ? 1 : 0;
    if (fav) { c.sk = Math.min(100, c.sk + 1.2 * (1 - c.sk / 100) * (c.sp ? 2 : 1)); c.wp += 1; }
  });
  if (w) {
    w.tw++; w.wp += 10; w.pt += 30; w.sk = Math.min(100, w.sk + 2 * (1 - w.sk / 100)); recUpd('tw', w, w.tw);
    api.toast('🏆 ' + w.n + ' levou o troféu do torneio', { ms: 3000 });
  }
  var tp = top10()[0]; if (tp) recUpd('pts', tp, Math.round(tp.pt));
  exportPool(api); effects(api);
}
function weekEnd(api) {
  var lead = null; S.cl.forEach(function (c) { if (!lead || c.wp > lead.wp) lead = c; });
  if (lead && lead.wp > 0) {
    lead.tt++; recUpd('ti', lead, lead.tt); S.champs.unshift({ w: S.wk, n: lead.n, id: lead.id }); if (S.champs.length > 5) S.champs.length = 5;
    var prize = 6 * P(api); api.earn(prize); S.gifts++;
    api.shared['rk:repOut'] = (+api.shared['rk:repOut'] || 0) + 1 + (lead.sp ? 1 : 0);
    api.toast('👑 ' + lead.n + ' é o Campeão da lan da semana ' + S.wk + '! +' + api.cur + ' ' + api.fmt(prize), { ms: 4500 }); api.banner('Campeão da lan'); api.sfx('up'); api.unlock('rkchamp');
  }
  S.wk++; S.wt = WEEK;
  S.cl.forEach(function (c) { c.wp = 0; c.age++; c.sk = Math.min(100, c.sk + 0.8 * (1 - c.sk / 100) * (c.sp ? 2 : 1)); });
  if (S.cl.length >= cap(api) && rnd() < 0.5) {
    var out = null; S.cl.forEach(function (c) { if (!c.sp && (!out || c.ly < out.ly)) out = c; });
    if (out && S.cl.length > 4) { S.cl = S.cl.filter(function (c) { return c !== out; }); api.toast(out.n + ' mudou de bairro: ' + QT[out.q]); }
  }
  pairRv(api); exportPool(api); effects(api);
}
function sponsor(api, id) {
  var c = byId(id); if (!c) return { ok: false, msg: 'Cliente não encontrado' };
  if (c.sp) return { ok: false, msg: c.n + ' já tem patrocínio' };
  if (nSp() >= SPON_MAX) return { ok: false, msg: 'Só dá pra patrocinar ' + SPON_MAX + ' clientes' };
  var cost = sponCost(api); if (!api.spend(cost)) return { ok: false, msg: 'Faltam ' + api.cur + ' ' + api.fmt(cost - api.money()) };
  c.sp = 1; S.spons++; c.ly = Math.min(100, c.ly + 10); exportPool(api); effects(api); api.unlock('rkspon');
  return { ok: true, msg: c.n + ' agora usa a camisa da sua lan', cost: cost };
}
function ach(api) { if (nFiel() >= 1) api.unlock('rk1'); if (nFiel() >= 10) api.unlock('rk10'); }

/* ---------- interface ---------- */
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function top10() { return S.cl.slice().sort(function (a, b) { return b.pt - a.pt || a.id - b.id; }).slice(0, 10); }
function mount(root, api) {
  apiR = api; root.classList.add('lan-root');
  root.innerHTML =
    '<section class="lan-card lan-champ" aria-label="Campeão da lan"><div class="lan-r2"><b data-r="ch"></b><span class="lan-tag" data-r="wk"></span></div><small class="lan-sm" data-r="chd"></small><div class="lan-bar" role="presentation"><i data-r="wbar"></i></div></section>' +
    '<section class="lan-card" aria-label="Clientes fiéis"><div class="lan-r2"><b>Clientes fiéis <span data-r="nf"></span></b><span class="lan-tag" data-r="bn"></span></div><small class="lan-sm" data-r="bd"></small></section>' +
    '<section class="lan-card" aria-label="Top 10 da lan"><b class="lan-h">Top 10 da lan</b><p class="lan-d" data-r="empty">Os clientes ainda estão chegando. Aposta que o primeiro vai pedir senha do Wi-Fi.</p><ul class="lan-list lan-rank" data-r="top"></ul></section>' +
    '<section class="lan-card" aria-label="Rivalidades"><b class="lan-h">Rivalidades</b><ul class="lan-plain" data-r="rv"></ul></section>' +
    '<section class="lan-card" aria-label="Recordes"><b class="lan-h">Recordes da lan</b><ul class="lan-plain" data-r="rec"></ul></section>';
  var q = function (k) { return root.querySelector('[data-r="' + k + '"]'); };
  UI = { root: root };
  ['ch', 'wk', 'chd', 'wbar', 'nf', 'bn', 'bd', 'empty', 'top', 'rv', 'rec'].forEach(function (k) { UI[k] = q(k); });
  for (var i = 0; i < 3; i++) UI.rv.appendChild(el('li')); for (i = 0; i < 5; i++) UI.rec.appendChild(el('li'));
  UI.list = api.list(UI.top, { key: function (it) { return it.c.id; }, create: function (it) {
    var li = el('li', 'lan-rk');
    li.innerHTML = '<span class="lan-pos"></span><div class="lan-ri"><b></b><small></small></div><button type="button" class="btn lan-sp" data-act="sp"></button>';
    var c = li.children, ri = c[1].children, b = c[2]; b.dataset.id = it.c.id;
    return { el: li, update: function (d) {
      var x = d.c, U = api.ui, g = GM[x.g] || GM.cs, fiel = x.ly >= FIEL;
      U.text(c[0], '#' + d.pos); U.text(ri[0], (x.id === S.champId ? '👑 ' : '') + x.n + (x.sp ? ' ⭐' : ''));
      U.text(ri[1], g[0] + ' ' + g[1] + ' · hab. ' + Math.round(x.sk) + ' · ' + Math.round(x.pt) + ' pts · ' + (fiel ? '❤ fiel' : '🤍 ' + Math.round(x.ly) + '/' + FIEL) + (x.rv && byId(x.rv) ? ' · ⚔ ' + byId(x.rv).n : '') + (x.st >= 3 ? ' · 🔥' + x.st : ''));
      var cost = sponCost(api);
      if (x.sp) { U.text(b, 'Patrocinado'); U.attr(b, 'aria-disabled', 'true'); }
      else if (nSp() >= SPON_MAX) { U.text(b, 'Sem vagas'); U.attr(b, 'aria-disabled', 'true'); }
      else { U.text(b, 'Patrocinar ' + api.fmt(cost)); U.attr(b, 'aria-disabled', api.money() >= cost ? 'false' : 'true'); }
      U.attr(b, 'aria-label', (x.sp ? 'Já patrocinado: ' : 'Patrocinar ') + x.n + (x.sp ? '' : ' por ' + api.cur + ' ' + api.fmt(cost)));
      U.data(li, 'fiel', fiel ? '1' : '0'); U.data(li, 'rank', String(d.pos <= 3 ? d.pos : 0));
    } };
  } });
  root.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b || !S) return;
    if (b.getAttribute('aria-disabled') === 'true') {
      var c = byId(+b.dataset.id); api.sfx('no');
      api.toast(c && c.sp ? c.n + ' já tem patrocínio' : nSp() >= SPON_MAX ? 'Só dá pra patrocinar ' + SPON_MAX + ' clientes' : 'Faltam ' + api.cur + ' ' + api.fmt(Math.max(0, sponCost(api) - api.money())) + ' para patrocinar'); return;
    }
    var r = sponsor(api, +b.dataset.id); api.toast(r.msg); if (r.ok) { api.sfx('buy'); api.buzz(10); api.save(); } else api.sfx('no');
    api.invalidate();
  });
}
function render(api) {
  if (!UI || !S) return; var U = api.ui, t = top10(), lead = null;
  S.cl.forEach(function (c) { if (!lead || c.wp > lead.wp) lead = c; });
  var ch = S.champs[0]; S.champId = ch ? ch.id : 0;
  U.text(UI.ch, ch ? '👑 Campeão da lan: ' + ch.n : '👑 Campeão da lan: ainda ninguém');
  U.text(UI.wk, 'Semana ' + S.wk);
  U.text(UI.chd, (lead && lead.wp > 0 ? 'Líder da semana: ' + lead.n + ' (' + lead.wp + ' pts) · ' : 'Semana sem placar ainda · ') + 'fecha em ' + api.fmtT(S.wt));
  U.bar(UI.wbar, 1 - S.wt / WEEK);
  U.text(UI.nf, nFiel() + '/' + S.cl.length); U.text(UI.bn, '+' + f1(bonus() * 100) + '% de renda');
  U.text(UI.bd, 'Fiel = lealdade ≥ ' + FIEL + ' (+0,22% cada). Patrocínios: ' + nSp() + '/' + SPON_MAX + ' (+0,5% cada, treinam o dobro, e o campeão patrocinado rende Reputação extra). Vagas na lan: ' + S.cl.length + '/' + cap(api) + '.');
  U.hide(UI.empty, S.cl.length > 0);
  UI.list.set(t.map(function (c, i) { return { c: c, pos: i + 1 }; }));
  var rl = UI.rv.children, k;
  for (k = 0; k < 3; k++) {
    var r = S.rv[k], a = r && byId(r.a), b = r && byId(r.b);
    U.text(rl[k], a && b ? '⚔ ' + a.n + ' ' + r.wa + ' x ' + r.wb + ' ' + b.n : k === 0 ? 'Sem rivalidades por enquanto. Calma, é só uma questão de tempo.' : ''); U.hide(rl[k], !(a && b) && k > 0);
  }
  var R = S.rec, rc = UI.rec.children;
  U.text(rc[0], '🔥 Maior sequência: ' + (R.streak.c ? R.streak.n + ' (' + R.streak.c + ' vitórias)' : '—'));
  U.text(rc[1], '📈 Maior pontuação: ' + (R.pts.c ? R.pts.n + ' (' + R.pts.c + ' pts)' : '—'));
  U.text(rc[2], '🏆 Mais torneios vencidos: ' + (R.tw.c ? R.tw.n + ' (' + R.tw.c + ')' : '—'));
  U.text(rc[3], '👑 Mais títulos semanais: ' + (R.ti.c ? R.ti.n + ' (' + R.ti.c + ')' : '—'));
  U.text(rc[4], S.champs.length ? '🗓 Últimos campeões: ' + S.champs.slice(0, 3).map(function (x) { return 'S' + x.w + ' ' + x.n; }).join(' · ') : '🗓 Últimos campeões: —');
}

Engine.registerTab('lan', {
  id: 'ranking', label: 'Ranking', icon: '🥇',
  ach: [
    { id: 'rk1', ic: '❤️', n: 'Cliente cativo', d: 'Tenha um cliente fiel no ranking da lan.' },
    { id: 'rk10', ic: '🏘️', n: 'Fã-clube do bairro', d: 'Tenha 10 clientes fiéis ao mesmo tempo.' },
    { id: 'rkchamp', ic: '👑', n: 'Campeão da semana', d: 'Veja alguém ganhar o título semanal da lan.' },
    { id: 'rkspon', ic: '⭐', n: 'Camisa da casa', d: 'Patrocine um cliente da lan.' }
  ],
  unlock: function (api) { return api.owned('ssd') >= 1; },
  mount: mount,
  load: function (d, api) {
    S = fresh();
    if (d && typeof d === 'object') {
      S.seed = (+d.seed || S.seed) >>> 0; S.wk = Math.floor(num(d.wk, 1, 1, 1e6)); S.wt = num(d.wt, WEEK, 1, WEEK); S.tm = num(d.tm, MATCH_EVERY, 0, MATCH_EVERY); S.ta = num(d.ta, 30, 0, 3600);
      S.seen = Math.floor(num(d.seen, 0, 0, 1e9)); S.spons = Math.floor(num(d.spons, 0, 0, 1e9)); S.gifts = Math.floor(num(d.gifts, 0, 0, 1e9));
      if (Array.isArray(d.cl)) d.cl.slice(0, CLMAX).forEach(function (c) {
        if (!c || typeof c !== 'object') return;
        var o = { id: Math.floor(num(c.id, 0, 1, 1e9)), n: String(c.n || '').slice(0, 40), g: GM[c.g] ? c.g : 'cs', sk: num(c.sk, 30, 1, 100), pt: num(c.pt, 1000, 0, 1e5), ly: num(c.ly, 0, 0, 100), w: Math.floor(num(c.w, 0, 0, 1e9)),
          pl: Math.floor(num(c.pl, 0, 0, 1e9)), st: Math.floor(num(c.st, 0, 0, 1e6)), bs: Math.floor(num(c.bs, 0, 0, 1e6)), sp: c.sp ? 1 : 0, rv: 0, wp: Math.floor(num(c.wp, 0, 0, 1e6)), tw: Math.floor(num(c.tw, 0, 0, 1e6)), tt: Math.floor(num(c.tt, 0, 0, 1e6)), age: Math.floor(num(c.age, 0, 0, 1e6)), q: Math.floor(num(c.q, 0, 0, QT.length - 1)) };
        if (!o.id || !o.n || byId(o.id)) return; S.cl.push(o);
      });
      var mx = 0; S.cl.forEach(function (c) { if (c.id > mx) mx = c.id; }); S.nid = Math.max(mx + 1, Math.floor(num(d.nid, 1, 1, 1e9)));
      if (Array.isArray(d.champs)) S.champs = d.champs.slice(0, 5).map(function (x) { return { w: Math.floor(num(x && x.w, 0, 0, 1e6)), n: String(x && x.n || '').slice(0, 40), id: Math.floor(num(x && x.id, 0, 0, 1e9)) }; });
      if (d.rec && typeof d.rec === 'object') ['streak', 'pts', 'tw', 'ti'].forEach(function (k) { var r = d.rec[k]; if (r && typeof r === 'object') S.rec[k] = { n: String(r.n || '').slice(0, 40), c: num(r.c, 0, 0, 1e9) }; });
      if (Array.isArray(d.rv)) S.rv = d.rv.slice(0, 3).map(function (r) { return { a: Math.floor(num(r && r.a, 0, 0, 1e9)), b: Math.floor(num(r && r.b, 0, 0, 1e9)), wa: Math.floor(num(r && r.wa, 0, 0, 1e9)), wb: Math.floor(num(r && r.wb, 0, 0, 1e9)) }; });
      var sp = 0; S.cl.forEach(function (c) { if (c.sp && ++sp > SPON_MAX) c.sp = 0; });
    }
    if (!S.seen && api.shared['tn:res']) S.seen = +api.shared['tn:res'].seq || 0;   /* nao reprocessa torneios antigos */
    pairRv(api); exportPool(api); effects(api);
  },
  save: function () { return S; },
  update: function (dt, api) {
    if (!S) return; apiR = api;
    if (!S.cl.length) { for (var i = 0; i < 4; i++) newClient(api); pairRv(api); exportPool(api); effects(api); }
    S.cl.forEach(function (c) { c.ly = Math.min(100, c.ly + dt * (c.sp ? 0.075 : 0.05)); });
    S.tm -= dt; var g = 0; while (S.tm <= 0 && g++ < 5) { S.tm += MATCH_EVERY; matchRound(api); }
    S.ta -= dt; if (S.ta <= 0) { S.ta = ARRIVE * (0.8 + rnd() * 0.5); if (S.cl.length < cap(api)) { var c = newClient(api); api.toast('Cliente novo na lan: ' + c.n, { ms: 2400 }); pairRv(api); exportPool(api); } }
    S.wt -= dt; if (S.wt <= 0) weekEnd(api);
    var res = api.shared['tn:res']; if (res && +res.seq > S.seen) { S.seen = +res.seq; onTournament(api, res); }
    tM += dt; if (tM > 3) { tM = 0; exportPool(api); effects(api); }
    tX += dt; if (tX > 2) { tX = 0; ach(api); }
  },
  render: render,
  onPrestige: function (api) { effects(api); }   /* os clientes seguem voce para a nova lan; so o multiplicador e reaplicado */
});
window.LAN_RK = { state: function () { return S; }, bonus: bonus, sponsor: function (id) { return sponsor(apiR, id); }, play: function (a, b) { play(byId(a), byId(b), false); }, weekEnd: function () { weekEnd(apiR); }, newClient: function () { return newClient(apiR); }, cap: function () { return cap(apiR); }, matchRound: function () { matchRound(apiR); }, sponCost: function () { return sponCost(apiR); } };
})();
