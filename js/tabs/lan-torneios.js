/* Aba TORNEIOS da Lan House (plugin: Engine.registerTab). Regras e numeros: docs/TABS_LAN.md.
   Organize campeonatos locais: paga premiacao + estrutura, recebe inscricoes e consumo, rola um evento
   (apagao, trapaca, briga de torcida...) e ganha R$ e Reputacao da lan. Usa so a API publica (docs/TABS_API.md). */
(function () {
'use strict';
var BONUS_CAP = 0.04;           /* teto da renda permanente vinda da Reputacao: +4% */
var HIST_MAX = 8;
var TIERS = [
  { n: 'Rachão do quarteirão', r: 0 }, { n: 'Copa Interbairros', r: 6 }, { n: 'Torneio da cidade', r: 22 },
  { n: 'Estadual das lans', r: 60 }, { n: 'Nacional ao vivo', r: 130 }
];
var JG = [
  { id: 'cs', n: 'CS 1.6', ic: '🔫', t: 0, cost: 1.0, snack: 1.0, rep: 1.0, d: 'Bomba, AWP e reclamação de lag.', ln: 'A bomba foi plantada. O defuse, não.' },
  { id: 'fifa', sn: 'FIFA', n: 'FIFA / PES', ic: '⚽', t: 0, cost: 0.95, snack: 1.3, rep: 1.0, d: 'Torcida na janela e controle trocando de mão.', ln: 'Gol de bicicleta e a torcida invadiu o balcão.' },
  { id: 'mk', sn: 'MK', n: 'Mortal Kombat', ic: '🥋', t: 1, cost: 1.0, snack: 0.9, rep: 1.1, d: 'Fatality na frente da mãe do adversário.', ln: 'Alguém apertou ↓ → ↓ B e o salão foi abaixo.' },
  { id: 'lol', n: 'LoL', ic: '🧙', t: 2, cost: 1.1, snack: 1.0, rep: 1.25, need: { pc: 5 }, d: 'Times de 5, 40 min de partida e culpa do jungle.', ln: 'Três torres caíram. A culpa já é do suporte.' },
  { id: 'war', sn: 'DotA', n: 'DotA / Warcraft III', ic: '🛡️', t: 3, cost: 1.1, snack: 0.9, rep: 1.4, need: { pc: 8 }, d: 'Mapa customizado e rivalidade de bairro.', ln: 'Alguém desconectou "sem querer" no teamfight.' },
  { id: 'rag', n: 'Ragnarök', ic: '⚔️', t: 4, cost: 1.2, snack: 1.1, rep: 1.6, need: { net: 2 }, d: 'Guerra de guildas valendo a honra da rua.', ln: 'A guilda do fundo da lan chamou reforço do cybercafé vizinho.' }
];
var FM = [
  { id: 'rel', n: 'Mata-mata relâmpago', sh: '30 s', s: 30, t: 0, c: 0.09, rep: 1 },
  { id: 'grp', n: 'Grupos + final', sh: '90 s', s: 90, t: 1, c: 0.10, rep: 3 },
  { id: 'pts', n: 'Pontos corridos', sh: '3 min', s: 180, t: 2, c: 0.11, rep: 6 },
  { id: 'dbl', n: 'Chave dupla', sh: '5 min', s: 300, t: 3, c: 0.12, rep: 10 }
];
var EV = [
  { id: 'apagao', k: 'neg', w: 3, rev: 0.55, rep: 0, ic: '🔌', n: 'Apagão no bairro', x: 'Caiu a luz no meio da semifinal. O gerador era boato.', av: 'A companhia de luz ficou quieta. Milagre.' },
  { id: 'trapaca', k: 'neg', w: 3, rev: 0.85, rep: -3, ic: '🕵️', n: 'Trapaça', x: 'Pegaram um wallhack no mata-mata. A plateia descobriu antes do juiz.', av: 'Um "gamer" suspeito foi barrado na porta.' },
  { id: 'briga', k: 'neg', w: 3, rev: 0.8, rep: -4, ic: '🥊', n: 'Briga de torcida', x: 'A torcida do time rival invadiu o balcão. Sobrou até pra coxinha.', av: 'A torcida quis brigar, mas ouviu "olha o segurança".' },
  { id: 'lag', k: 'neg', w: 2, rev: 0.9, rep: -1, ic: '📶', n: 'Ping 999', x: 'O link caiu na final. Ping: 999 e choro coletivo.', av: 'O link aguentou. Ninguém acredita.' },
  { id: 'calote', k: 'neg', w: 2, rev: 0.85, rep: 0, ic: '📒', n: 'Inscrição fiada', x: '"Sábado eu pago, tio." Foram 8 inscrições no caderninho.', av: 'Todo mundo pagou na hora. Estranho.' },
  { id: 'fiscal', k: 'neg', w: 1, rev: 0.85, rep: -1, ic: '📋', n: 'Fiscal na porta', x: 'O fiscal quis ver alvará e extintor. O alvará estava na gaveta, atrás do mouse.', av: 'O fiscal olhou, anotou e foi embora.' },
  { id: 'cheia', k: 'pos', w: 3, rev: 1.25, rep: 1, ic: '🎉', n: 'Casa cheia', x: 'Fila na calçada e gente jogando sentada no chão.' },
  { id: 'viral', k: 'pos', w: 2, rev: 1.12, rep: 3, ic: '📣', n: 'Bombou no Orkut', x: 'Alguém postou o replay no Orkut e a cidade inteira viu.' },
  { id: 'epica', k: 'pos', w: 2, rev: 1.08, rep: 4, ic: '🏅', n: 'Final épica', x: 'Virada no último segundo. Quem estava lá vai contar por anos.' },
  { id: 'padaria', k: 'pos', w: 2, rev: 1.18, rep: 1, ic: '🥖', n: 'Padaria patrocinou', x: 'A padaria da esquina bancou o prêmio e mandou pão de queijo.' }
];
var EVID = {}; EV.forEach(function (e) { EVID[e.id] = e; });
var JID = {}; JG.forEach(function (g) { JID[g.id] = g; });
var FID = {}; FM.forEach(function (f) { FID[f.id] = f; });
var PHASE = ['Inscrições e sorteio', 'Fase de grupos', 'Mata-mata', 'Final'];
var WINNERS = ['Os Ligeirinhos', 'Time do Fundão', 'A Resenha FC', 'Skol e Coxinha', 'Os Desempregados', 'Quinta Série B'];

/* ---------- estado ---------- */
var S = null, UI = null, apiR = null, achT = 0, selDirty = true;
function fresh() {
  return { v: 1, rep: 0, life: 0, n: 0, wins: 0, cur: null, hist: [], sel: { g: 'cs', f: 'rel' }, last: null, auto: 0, seed: (Math.random() * 4294967296) >>> 0, ts: 0, seq: 0, best: 0, ev: 0, prof: 0 };
}
function rnd() { S.seed = (S.seed + 0x6D2B79F5) | 0; var t = Math.imul(S.seed ^ (S.seed >>> 15), 1 | S.seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function num(v, d, lo, hi) { v = +v; return isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; }
function f1(n) { return (Math.round(n * 10) / 10).toString().replace('.', ','); }
function fx(api) { var o = api.shared['fn:fx']; return o && typeof o === 'object' ? o : {}; }
function tierOf() { var t = 0; TIERS.forEach(function (x, i) { if (S.life >= x.r) t = i; }); return t; }
function bonus() { return 1 + BONUS_CAP * S.rep / (S.rep + 80); }
function applyMult(api) { api.mult('tn:rep', bonus()); }

/* ---------- plano de um torneio ---------- */
function lock(api, g, f) {
  var t = tierOf();
  if (g.t > t) return 'Reputação ' + TIERS[g.t].r + ' (' + TIERS[g.t].n + ')';
  if (f.t > t) return 'Reputação ' + TIERS[f.t].r + ' (' + TIERS[f.t].n + ')';
  if (g.need && g.need.pc && api.owned('pc') < g.need.pc) return g.need.pc + ' PCs';
  if (g.need && g.need.net && api.owned('net') < g.need.net) return 'Internet nível ' + g.need.net;
  return '';
}
function plan(api, g, f) {
  var pc = api.owned('pc'), net = api.owned('net'), cant = api.owned('cant'), P = Math.max(2, api.psBase()), F = fx(api);
  var rho = 0.14 + 0.10 * pc / 12 + 0.04 * net / 5 + 0.04 * cant / 6;
  var cost = f.c * f.s * P * g.cost, base = cost * (1 + rho);
  var snack = base * 0.28 * g.snack * (0.7 + 0.3 * cant / 6) * (1 + (+F.snack || 0)), entries = base * 0.72;
  return { cost: cost, prize: cost * 0.65, struct: cost * 0.35, entries: entries, snack: snack, rev: entries + snack, rho: rho,
    players: Math.max(2, Math.round(pc * (1.4 + 0.3 * net) * (g.id === 'lol' ? 0.8 : 1))), rep: f.rep * g.rep * (0.9 + 0.2 * pc / 12), dur: f.s, P: P };
}
function pickWinner(api, g) {
  var pool = api.shared['rk:pool'], best = null, tot = 0, i, w, r;
  if (!Array.isArray(pool) || !pool.length) return { id: '', n: WINNERS[(rnd() * WINNERS.length) | 0] };
  var ws = pool.map(function (c) { w = Math.pow(Math.max(1, +c.sk || 1) / 100, 3) * (c.g === g.id ? 2 : 1) * (c.sp ? 1.25 : 1) + 0.01; tot += w; return w; });
  r = rnd() * tot;
  for (i = 0; i < pool.length; i++) { r -= ws[i]; if (r <= 0) { best = pool[i]; break; } }
  best = best || pool[pool.length - 1];
  return { id: String(best.id), n: String(best.n) };
}
function rollEvent(api, g) {
  if (rnd() > 0.55) return { id: '', av: '' };
  var tot = 0; EV.forEach(function (e) { tot += e.w; });
  var r = rnd() * tot, ev = EV[EV.length - 1];
  for (var i = 0; i < EV.length; i++) { r -= EV[i].w; if (r <= 0) { ev = EV[i]; break; } }
  if (ev.k === 'neg') {
    var mit = num(((fx(api).mit || {})[ev.id]), 0, 0, 0.85);
    if (rnd() < mit) return { id: '', av: ev.av };     /* a equipe evitou o problema */
  }
  return { id: ev.id, av: '' };
}

function start(api, gid, fid, auto) {
  var g = JID[gid], f = FID[fid]; if (!g || !f || S.cur) return false;
  var lk = lock(api, g, f); if (lk) { if (!auto) api.toast('Trava: ' + lk); return false; }
  var p = plan(api, g, f);
  if (!api.spend(p.cost)) { if (!auto) { api.toast('Faltam ' + api.cur + ' ' + api.fmt(p.cost - api.money()) + ' para organizar'); api.sfx('no'); } return false; }
  var ev = rollEvent(api, g), w = pickWinner(api, g);
  S.cur = { g: gid, f: fid, el: 0, dur: f.s, cost: p.cost, rev: p.rev, snack: p.snack, players: p.players, rep: p.rep, ev: ev.id, av: ev.av, evAt: 0.5 + rnd() * 0.3, wn: w.n, wi: w.id, lines: [], sh: 0, auto: auto ? 1 : 0 };
  S.last = { g: gid, f: fid };
  pushLine('Inscrições abertas: ' + p.players + ' jogadores. O caixa já perdeu a conta duas vezes.');
  api.sfx('buy'); api.buzz(10); api.save(); api.invalidate();
  return true;
}
function pushLine(t) { S.cur.lines.unshift(t); if (S.cur.lines.length > 3) S.cur.lines.length = 3; }
function advance(api, dt) {
  var c = S.cur; if (!c) return; c.el = Math.min(c.dur, c.el + dt);
  var p = c.el / c.dur, g = JID[c.g];
  if (c.sh < 1 && p >= 0.25) { c.sh = 1; pushLine(g.ln); }
  if (c.sh < 2 && p >= c.evAt) {
    c.sh = 2; var e = EVID[c.ev];
    if (e) { pushLine(e.ic + ' ' + e.x); api.toast(e.ic + ' ' + e.n + (e.k === 'neg' ? '!' : '.')); api.sfx(e.k === 'neg' ? 'no' : 'up'); }
    else if (c.av) pushLine('🛡️ ' + c.av);
  }
  if (c.sh < 3 && p >= 0.85) { c.sh = 3; pushLine('Final: ' + c.wn + ' contra o resto do bairro.'); }
  if (c.el >= c.dur) finish(api);
}
function finish(api) {
  var c = S.cur, g = JID[c.g], f = FID[c.f], e = EVID[c.ev]; S.cur = null;
  var rev = c.rev * (e ? e.rev : 1), net = rev - c.cost;
  if (rev >= c.cost) { api.earn(c.cost, false); api.earn(rev - c.cost); } else api.earn(rev, false);
  var dr = c.rep + (e ? e.rep : 0); dr = Math.max(-2, Math.round(dr * 10) / 10);
  var before = tierOf(); S.rep = Math.max(0, S.rep + dr); if (dr > 0) S.life += dr;
  S.n++; S.seq++; S.prof += net; if (e) S.ev++; if (net > S.best) S.best = net;
  S.hist.unshift({ g: c.g, f: c.f, net: net, rep: dr, ev: c.ev, wn: c.wn, n: S.seq, p: c.players });
  if (S.hist.length > HIST_MAX) S.hist.length = HIST_MAX;
  api.shared['tn:res'] = { seq: S.seq, g: c.g, f: c.f, wi: c.wi, wn: c.wn, p: c.players };
  applyMult(api);
  api.toast(g.ic + ' ' + g.n + ' acabou: ' + (net >= 0 ? '+' : '−') + api.cur + ' ' + api.fmt(Math.abs(net)) + ' · ' + (dr >= 0 ? '+' : '') + f1(dr) + ' ⭐', { ms: 4200 });
  api.sfx(net >= 0 ? 'up' : 'no'); api.buzz(15);
  if (tierOf() > before) { api.toast('Novo nível: ' + TIERS[tierOf()].n + '! Torneios maiores liberados.', { ms: 5000 }); api.banner(TIERS[tierOf()].n); }
  ach(api); api.save(); selDirty = true; api.invalidate();
}
function away(api, sec) {
  if (!S || !S.cur || !(sec > 0)) return;
  var before = S.n; advance(api, Math.min(sec, 4 * 3600));
  if (S.n > before) api.toast('Enquanto você estava fora, o torneio terminou. Veja o histórico.', { ms: 4500 });
}
function ach(api) {
  if (S.n >= 1) api.unlock('tn1'); if (S.n >= 10) api.unlock('tn10'); if (S.life >= 60) api.unlock('tnrep'); if (S.ev >= 5) api.unlock('tnev');
  if (S.hist.some(function (h) { return h.ev === 'briga'; })) api.unlock('tnbrig');
}

/* ---------- interface ---------- */
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function mount(root, api) {
  apiR = api; root.classList.add('lan-root');
  root.innerHTML =
    '<section class="lan-card" aria-label="Reputação"><div class="lan-r2"><b>⭐ Reputação <span data-r="rep"></span></b><span class="lan-tag" data-r="bonus"></span></div>' +
    '<div class="lan-bar" role="presentation"><i data-r="repbar"></i></div><small class="lan-sm" data-r="tier"></small></section>' +
    '<section class="lan-card" data-r="org" aria-label="Organizar torneio"><b class="lan-h">Organizar torneio</b>' +
    '<div class="lan-chips" role="group" aria-label="Jogo" data-r="games"></div><div class="lan-chips" role="group" aria-label="Formato" data-r="fms"></div>' +
    '<p class="lan-d" data-r="desc"></p>' +
    '<dl class="lan-kv"><div><dt>Duração</dt><dd data-r="dur"></dd></div><div><dt>Inscritos</dt><dd data-r="pl"></dd></div><div><dt>Custo (prêmio + estrutura)</dt><dd data-r="cost"></dd></div>' +
    '<div><dt>Retorno esperado</dt><dd data-r="ret"></dd></div><div><dt>Reputação</dt><dd data-r="rp"></dd></div></dl>' +
    '<button type="button" class="btn pri lan-go" data-act="go"></button>' +
    '<button type="button" class="chip lan-auto" data-act="auto" aria-pressed="false" hidden>Agenda automática do gerente</button></section>' +
    '<section class="lan-card lan-run" data-r="run" aria-label="Torneio em andamento" hidden><div class="lan-r2"><b data-r="rt"></b><span class="lan-tag" data-r="rleft"></span></div>' +
    '<div class="lan-bar lan-bar-lg" role="presentation"><i data-r="rbar"></i></div><small class="lan-sm" data-r="rph"></small>' +
    '<ul class="lan-feed" data-r="feed" aria-live="polite"></ul></section>' +
    '<section class="lan-card" aria-label="Histórico"><b class="lan-h">Últimos torneios</b><p class="lan-d" data-r="empty">Nenhum torneio ainda. O quarteirão está esperando.</p><ul class="lan-list" data-r="hist"></ul></section>';
  var q = function (k) { return root.querySelector('[data-r="' + k + '"]'); };
  UI = { root: root };
  ['rep', 'bonus', 'repbar', 'tier', 'org', 'games', 'fms', 'desc', 'dur', 'pl', 'cost', 'ret', 'rp', 'run', 'rt', 'rleft', 'rbar', 'rph', 'feed', 'empty', 'hist'].forEach(function (k) { UI[k] = q(k); });
  UI.go = root.querySelector('[data-act="go"]'); UI.auto = root.querySelector('[data-act="auto"]');
  UI.gb = JG.map(function (g) { var b = el('button', 'chip', g.ic + ' ' + (g.sn || g.n)); b.type = 'button'; b.dataset.act = 'g'; b.dataset.v = g.id; b.setAttribute('aria-pressed', 'false'); UI.games.appendChild(b); return b; });
  UI.fb = FM.map(function (f) { var b = el('button', 'chip', '⏱ ' + f.sh); b.type = 'button'; b.dataset.act = 'f'; b.dataset.v = f.id; b.setAttribute('aria-pressed', 'false'); UI.fms.appendChild(b); return b; });
  for (var i = 0; i < 3; i++) UI.feed.appendChild(el('li'));
  UI.hl = api.list(UI.hist, { key: function (h) { return h.n; }, create: function (h) {
    var li = el('li', 'lan-hrow'); li.innerHTML = '<span class="lan-hic" aria-hidden="true"></span><div><b></b><small></small></div><span class="lan-hv"></span>';
    var c = li.children; return { el: li, update: function (d) {
      var g = JID[d.g] || JG[0], f = FID[d.f] || FM[0], e = EVID[d.ev];
      api.ui.text(c[0], g.ic); api.ui.text(c[1].children[0], g.n + ' · ' + f.sh);
      api.ui.text(c[1].children[1], (e ? e.ic + ' ' + e.n + ' · ' : '') + 'campeão: ' + d.wn);
      api.ui.text(c[2], (d.net >= 0 ? '+' : '−') + api.cur + ' ' + api.fmt(Math.abs(d.net)) + ' · ' + (d.rep >= 0 ? '+' : '') + f1(d.rep) + ' ⭐'); api.ui.data(c[2], 'neg', d.net < 0 ? '1' : '0');
    } };
  } });
  root.addEventListener('click', function (e) { onClick(e, api); });
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b || !S) return;
  var act = b.dataset.act;
  if (act === 'g' || act === 'f') {
    var d = act === 'g' ? JID[b.dataset.v] : FID[b.dataset.v], lk = act === 'g' ? lock(api, d, FM[0]) : lock(api, JG[0], d);
    if (lk) { api.toast('Trava: ' + lk); api.sfx('no'); return; }
    S.sel[act] = b.dataset.v; api.sfx('tap');
  } else if (act === 'go') {
    if (b.getAttribute('aria-disabled') === 'true') {
      var g0 = JID[S.sel.g], f0 = FID[S.sel.f], lk0 = lock(api, g0, f0);
      api.toast(S.cur ? 'Já tem torneio rolando' : lk0 ? 'Trava: ' + lk0 : 'Faltam ' + api.cur + ' ' + api.fmt(Math.max(0, plan(api, g0, f0).cost - api.money())) + ' para organizar'); api.sfx('no'); return;
    }
    start(api, S.sel.g, S.sel.f, false);
  } else if (act === 'auto') { S.auto = S.auto ? 0 : 1; api.toast(S.auto ? 'O gerente vai repetir o último torneio' : 'Agenda automática desligada'); api.sfx('tap'); }
  api.invalidate();
}
function setSel(b, on) { b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
function render(api) {
  if (!UI || !S) return;
  var U = api.ui, t = tierOf(), nx = TIERS[t + 1], F = fx(api);
  U.text(UI.rep, f1(S.rep)); U.text(UI.bonus, '+' + f1((bonus() - 1) * 100) + '% de renda');
  U.bar(UI.repbar, nx ? (S.life - TIERS[t].r) / (nx.r - TIERS[t].r) : 1);
  U.text(UI.tier, TIERS[t].n + (nx ? ' · próximo: ' + nx.n + ' com ' + nx.r + ' de reputação acumulada (' + f1(Math.max(0, nx.r - S.life)) + ' a mais)' : ' · nível máximo'));
  var g = JID[S.sel.g] || JG[0], f = FID[S.sel.f] || FM[0];
  JG.forEach(function (x, i) { var lk = lock(api, x, FM[0]); setSel(UI.gb[i], x.id === g.id); U.text(UI.gb[i], (lk ? '🔒 ' : x.ic + ' ') + (x.sn || x.n)); U.attr(UI.gb[i], 'aria-label', x.n + (lk ? ', trancado: ' + lk : '')); U.data(UI.gb[i], 'lock', lk ? '1' : '0'); });
  FM.forEach(function (x, i) { var lk = lock(api, JG[0], x); setSel(UI.fb[i], x.id === f.id); U.text(UI.fb[i], (lk ? '🔒 ' : '⏱ ') + x.sh); U.attr(UI.fb[i], 'aria-label', x.n + ', ' + x.sh + (lk ? ', trancado: ' + lk : '')); U.data(UI.fb[i], 'lock', lk ? '1' : '0'); });
  var p = plan(api, g, f), lk2 = lock(api, g, f), run = !!S.cur;
  U.hide(UI.org, run); U.hide(UI.run, !run);
  U.text(UI.desc, f.n + ' · ' + g.d);
  U.text(UI.dur, api.fmtT(p.dur)); U.text(UI.pl, '~' + p.players + ' (' + api.owned('pc') + ' PCs, link nível ' + api.owned('net') + ')');
  U.text(UI.cost, api.cur + ' ' + api.fmt(p.cost) + ' (' + api.fmt(p.prize) + ' + ' + api.fmt(p.struct) + ')');
  U.text(UI.ret, api.cur + ' ' + api.fmt(p.rev) + ' (consumo ' + api.fmt(p.snack) + ')'); U.text(UI.rp, '+' + f1(p.rep) + ' ⭐ (eventos mudam isso)');
  var ok = !run && !lk2 && api.money() >= p.cost;
  U.text(UI.go, lk2 ? '🔒 Precisa de ' + lk2 : 'Organizar por ' + api.cur + ' ' + api.fmt(p.cost)); U.attr(UI.go, 'aria-disabled', ok ? 'false' : 'true');
  U.hide(UI.auto, !F.agenda); setSel(UI.auto, !!S.auto);
  if (run) {
    var c = S.cur, cg = JID[c.g], cf = FID[c.f], pr = c.el / c.dur;
    U.text(UI.rt, cg.ic + ' ' + cg.n + ' · ' + cf.n); U.text(UI.rleft, api.fmtT(Math.max(0, c.dur - c.el))); U.bar(UI.rbar, pr);
    U.text(UI.rph, PHASE[Math.min(3, (pr * 4) | 0)] + ' · ' + c.players + ' jogadores');
    for (var i = 0; i < 3; i++) { U.text(UI.feed.children[i], c.lines[i] || ''); U.hide(UI.feed.children[i], !c.lines[i]); }
  }
  U.hide(UI.empty, S.hist.length > 0); UI.hl.set(S.hist);
}

/* ---------- registro ---------- */
Engine.registerTab('lan', {
  id: 'torneios', label: 'Torneios', icon: '🏆',
  ach: [
    { id: 'tn1', ic: '🏆', n: 'Primeiro rachão', d: 'Organize seu primeiro torneio na lan.' },
    { id: 'tn10', ic: '📋', n: 'Organizador oficial', d: 'Organize 10 torneios.' },
    { id: 'tnrep', ic: '⭐', n: 'Nome na boca do bairro', d: 'Acumule 60 de Reputação da lan.' },
    { id: 'tnev', ic: '🎲', n: 'Sem tédio', d: 'Passe por 5 eventos de torneio.' },
    { id: 'tnbrig', ic: '🥊', n: 'Torcida organizada', d: 'Aguente uma briga de torcida.' }
  ],
  unlock: function (api) { return api.owned('pc') >= 4 && api.owned('gpu') >= 1; },
  mount: mount,
  load: function (d, api) {
    S = fresh();
    if (d && typeof d === 'object') {
      S.rep = num(d.rep, 0, 0, 1e6); S.life = num(d.life, S.rep, 0, 1e6); S.n = Math.floor(num(d.n, 0, 0, 1e9)); S.seq = Math.floor(num(d.seq, S.n, 0, 1e9));
      S.wins = Math.floor(num(d.wins, 0, 0, 1e9)); S.ev = Math.floor(num(d.ev, 0, 0, 1e9)); S.best = num(d.best, 0, 0, 1e30); S.prof = num(d.prof, 0, -1e30, 1e30); S.auto = d.auto ? 1 : 0;
      S.seed = (+d.seed || S.seed) >>> 0;
      if (d.sel && JID[d.sel.g] && FID[d.sel.f]) S.sel = { g: d.sel.g, f: d.sel.f };
      if (d.last && JID[d.last.g] && FID[d.last.f]) S.last = { g: d.last.g, f: d.last.f };
      if (Array.isArray(d.hist)) S.hist = d.hist.slice(0, HIST_MAX).filter(function (h) { return h && JID[h.g] && FID[h.f]; }).map(function (h) {
        return { g: h.g, f: h.f, net: num(h.net, 0, -1e30, 1e30), rep: num(h.rep, 0, -50, 1e4), ev: EVID[h.ev] ? h.ev : '', wn: String(h.wn || '').slice(0, 40), n: Math.floor(num(h.n, 0, 0, 1e9)), p: Math.floor(num(h.p, 0, 0, 1e5)) };
      });
      var c = d.cur;
      if (c && JID[c.g] && FID[c.f] && isFinite(+c.dur) && +c.dur > 0) {
        S.cur = { g: c.g, f: c.f, el: num(c.el, 0, 0, +c.dur), dur: num(c.dur, 30, 1, 3600), cost: num(c.cost, 0, 0, 1e30), rev: num(c.rev, 0, 0, 1e30), snack: num(c.snack, 0, 0, 1e30),
          players: Math.floor(num(c.players, 2, 0, 1e5)), rep: num(c.rep, 0, 0, 1e4), ev: EVID[c.ev] ? c.ev : '', av: String(c.av || '').slice(0, 120), evAt: num(c.evAt, 0.6, 0.3, 0.95),
          wn: String(c.wn || WINNERS[0]).slice(0, 40), wi: String(c.wi || '').slice(0, 20), lines: Array.isArray(c.lines) ? c.lines.slice(0, 3).map(function (x) { return String(x).slice(0, 160); }) : [], sh: Math.floor(num(c.sh, 0, 0, 3)), auto: c.auto ? 1 : 0 };
      }
      if (S.life < S.rep) S.life = S.rep;
      S.ts = num(d.ts, 0, 0, 1e15);
    }
    S.wall = Date.now(); selDirty = true; applyMult(api);
    if (S.ts && S.cur) away(api, Math.min(4 * 3600, (Date.now() - S.ts) / 1000));
  },
  save: function () { S.ts = Date.now(); return S; },
  update: function (dt, api) {
    if (!S) return;
    var w = Date.now(), gap = (w - S.wall) / 1000 - dt; S.wall = w;
    if (gap > 2) away(api, gap);
    var rp = api.shared['rk:repOut']; if (rp > 0) { api.shared['rk:repOut'] = 0; S.rep += rp; S.life += rp; applyMult(api); api.invalidate(); }
    if (S.cur) advance(api, dt);
    else if (S.auto && fx(api).agenda && S.last) {
      var g = JID[S.last.g], f = FID[S.last.f];
      if (!lock(api, g, f) && api.money() >= plan(api, g, f).cost * 2.5) start(api, S.last.g, S.last.f, true);
    }
    achT += dt; if (achT > 2) { achT = 0; ach(api); }
  },
  render: render,
  onPrestige: function (api) { applyMult(api); api.invalidate(); }   /* reputacao, historico e torneio em curso permanecem */
});
window.LAN_TN = { JG: JG, FM: FM, EV: EV, TIERS: TIERS, plan: function (g, f) { return plan(apiR, JID[g], FID[f]); }, start: function (g, f) { return start(apiR, g, f, true); }, state: function () { return S; }, bonus: bonus, tierOf: tierOf, lock: function (g, f) { return lock(apiR, JID[g], FID[f]); } };
})();
