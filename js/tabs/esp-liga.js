/* Aba LIGA do Time de eSports (plugin): regiao, divisoes T2/T1, splits, promocao, MSI e Mundial.
   Sem relogio proprio: quem joga e a Semana (esp-semana.js), que chama ESPX.liga.step(S, semana, seed) 1x por semana.
   Numeros: ECO.C.lg (js/data/esp-eco.js). Regras: docs/ESPORTS_ECONOMIA.md secoes 5 e 9. */
(function () {
'use strict';
var G = GAMES.esp, L = G.lg, RG = G.regions, E = ECO;
window.ESPX = window.ESPX || {};
var NAMES = ['Raposas da Névoa', 'Corvos de Ferro', 'Lobos do Norte', 'Furacão Azul', 'Dragões do Vale', 'Tubarões da Maré', 'Águias Prata', 'Guardiões do Farol',
  'Titãs do Cerrado', 'Serpentes Rubras', 'Fênix Dourada', 'Ursos do Gelo', 'Corujas da Noite', 'Panteras Negras', 'Falcões do Sul', 'Leões da Savana',
  'Tempestade Verde', 'Cometas Roxos', 'Ceifadores', 'Sentinelas', 'Vulcão Rubro', 'Marés Vivas', 'Trovão do Leste', 'Aurora Boreal'];
function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function oppName(kind, i, reg) { return NAMES[hash(kind + ':' + i + ':' + reg) % NAMES.length]; }
function winP(S, opp) { return E.winP(S, opp, L.D); }

var s = null, UI = null, apiR = null, asked = false;
function fresh() {
  return { v: 2, on: 0, div: 'T2', yr: 1, sp: 1, ph: 'split', gi: 0, w: 0, l: 0, res: [], ser: null, q: { msi: 0, wd: 0 }, pts: 0,
    ti: { promo: 0, msi: 0, wd: 0 }, fail: { promo: 0, msi: 0, wd: 0 }, played: { msi: 0, wd: 0 }, intl: 0, log: [], champ: 0, perf: 0 };
}
function reg(api) { var r = api.shared.region; return RG[r] ? r : 'BR'; }
function rounds(kind) { return kind === 'promo' ? [{ bo: 5, s: L.promoOpp, n: 'Série de acesso' }] : (kind === 'msi' ? L.msi : L.worlds); }
function fk(kind) { return kind === 'worlds' ? 'wd' : kind; }
function strength(api, kind, noScrim) { var X = window.ESPX.semana; return X ? X.strength(api, kind ? fk(kind) : null, noScrim) : (api.shared.avg5 || 40); }
function logAdd(t) { s.log.unshift(t); if (s.log.length > 6) s.log.length = 6; }
function sync(api) { var sh = api.shared; sh.division = s.div; sh.intl = s.intl ? 1 : 0; if (!RG[sh.region] && s.on) sh.region = 'BR'; }
function newSplit() { s.ph = 'split'; s.gi = 0; s.w = 0; s.l = 0; s.res = []; s.ser = null; }
function startSeries(api, kind, out) {
  s.ph = kind; s.ser = { k: kind, r: 0, h: [], res: [] };
  if (kind !== 'promo') { s.intl = 1; s.played[kind === 'msi' ? 'msi' : 'wd']++; api.unlock(kind === 'msi' ? 'lgmsi' : 'wdp'); }
  api.toast(kind === 'promo' ? 'Série de acesso! Vença a melhor de 5 para subir.' : kind === 'msi' ? 'Classificados para o MSI!' : 'Classificados para o Mundial!');
  api.banner(kind === 'promo' ? 'Série de acesso' : kind === 'msi' ? 'MSI' : 'Mundial'); sync(api);
}
function newYear(out) { s.yr++; s.sp = 1; s.pts = 0; out.year = true; }

function playSplit(api, Sf, wk, seed, out) {
  var rg = reg(api), t2 = s.div === 'T2', list = t2 ? L.t2opp : L.t1opp, n = t2 ? L.t2games : L.t1games, F = E.C.fame, P = E.C.prize;
  var opp = list[s.gi % list.length], win = E.mix(seed, wk, 1) < winP(Sf(null, false), opp), nm = oppName(t2 ? 't2' : 't1', s.gi, rg);
  out.kind = 'split'; out.split = true; out.win = win; out.opp = nm; out.oppS = opp;
  s.res.push(win ? 'W' : 'L'); if (win) s.w++; else s.l++; s.gi++;
  out.fame += t2 ? (win ? F.t2win : 0) : (win ? F.t1win : F.t1loss);
  logAdd((win ? 'Vitória' : 'Derrota') + ' vs ' + nm);
  out.log = (win ? 'Vitória' : 'Derrota') + ' vs ' + nm;
  if (s.gi < n) return;
  /* fim do split */
  if (t2) {
    out.prize += s.w * P.t2win + (s.w >= L.promoW ? P.t2bonus : 0);
    if (s.w >= L.promoW && Sf('promo', true) >= L.promoS) startSeries(api, 'promo', out);
    else logAdd('Split ' + s.w + 'V-' + s.l + 'D: ' + (s.w >= L.promoW ? 'falta força para a promoção' : 'sem vaga na série de acesso'));
    if (s.ph !== 'promo') newSplit(); else { s.gi = 0; s.w = 0; s.l = 0; s.res = []; }
  } else {
    out.prize += s.w * P.t1win + (s.w >= L.qualW ? P.t1bonus : 0); s.pts += 3 * s.w;
    if (s.w === n) api.unlock('perf');
    var w = s.w;
    if (s.sp === 1 && w >= L.qualW) { s.q.msi = 1; out.fame += F.msiPart; out.pl += 1; s.gi = 0; s.w = 0; s.l = 0; s.res = []; startSeries(api, 'msi', out); }
    else if (s.sp === 2 && (w >= L.qualW || s.pts >= 33)) { s.q.wd = 1; out.fame += F.wdPart; out.pl += 2; s.gi = 0; s.w = 0; s.l = 0; s.res = []; startSeries(api, 'worlds', out); }
    else if (s.sp === 1) { logAdd('Fora do MSI (' + w + 'V-' + s.l + 'D)'); s.sp = 2; newSplit(); }
    else { logAdd('Fora do Mundial (' + w + 'V-' + s.l + 'D)'); newYear(out); newSplit(); }
  }
}
function playSeries(api, Sf, wk, seed, out) {
  var ser = s.ser, kind = ser.k, rds = rounds(kind), rd = rds[ser.r], need = (rd.bo + 1) >> 1, rg = reg(api), F = E.C.fame, P = E.C.prize;
  var sw = 0, sl = 0, g = 0, S = Sf(kind === 'worlds' ? 'wd' : kind, false), nm = oppName(kind, ser.r, rg);
  ser.h = [];
  while (sw < need && sl < need) { g++; if (E.mix(seed, wk, 10 + g) < winP(S, rd.s)) { sw++; ser.h.push('W'); } else { sl++; ser.h.push('L'); } }
  var won = sw >= need;
  out.kind = kind; out.win = won; out.round = ser.r; out.opp = nm; out.oppS = rd.s; out.score = sw + 'x' + sl;
  if (won) {
    ser.res[ser.r] = 'W';
    logAdd(rd.n + ': vitória por ' + sw + 'x' + sl + ' vs ' + nm); out.log = rd.n + ' vencida (' + sw + 'x' + sl + ') vs ' + nm;
    if (kind === 'msi') { out.fame += F.msiRound; out.prize += P.msiRound; } else if (kind === 'worlds') { out.fame += F.wdRound; out.prize += P.wdRound; }
    ser.r++;
    if (ser.r >= rds.length) { finish(api, kind, true, out); return; }
    api.toast(rd.n + ' vencida! Próxima: ' + rds[ser.r].n);
  } else { ser.res[ser.r] = 'L'; out.log = rd.n + ' perdida (' + sw + 'x' + sl + ') vs ' + nm; finish(api, kind, false, out); }
}
function finish(api, kind, won, out) {
  var rg = reg(api), F = E.C.fame, P = E.C.prize, rd = s.ser.r, nm = rounds(kind);
  out.done = true; out.title = won ? kind : null;
  if (kind === 'promo') {
    if (won) {
      s.div = 'T1'; s.ti.promo = 1; s.fail.promo = 0; s.sp = 1; s.yr = 1; s.pts = 0; out.prize += P.promo; out.fame += F.promo; out.pl += 1; api.unlock('promo');
      logAdd('Promovidos ao ' + RG[rg].l + '!'); api.toast('Promovidos ao ' + RG[rg].l + '!'); api.banner(RG[rg].l); api.sfx('up');
    } else { s.fail.promo++; logAdd('Série de acesso perdida'); api.toast('Perdeu a série de acesso. Treine mais e tente no próximo split.'); }
    newSplit();
  } else if (kind === 'msi') {
    if (won) { out.prize += P.msiWin; out.fame += F.msiWin; out.pl += 4; s.ti.msi++; s.fail.msi = 0; api.unlock('msit'); logAdd('Campeões do MSI!'); api.toast('Campeões do MSI!'); api.banner('Campeões do MSI'); s.champ = 12; api.sfx('up'); }
    else { out.prize += P.msiPart; s.fail.msi++; logAdd('Eliminados no MSI (' + nm[rd].n + ')'); api.toast('Eliminados no MSI: ' + nm[rd].n + '. Prêmio de consolação no caixa.'); }
    s.sp = 2; newSplit();
  } else {
    if (won) { out.prize += P.wdWin; out.fame += F.wdWin; out.pl += 10; s.ti.wd++; s.fail.wd = 0; api.unlock('wdt'); logAdd('Campeões do Mundo!'); api.toast('CAMPEÕES DO MUNDO!', { ms: 6000 }); api.banner('Campeões do Mundo!'); s.champ = 20; api.sfx('up'); api.buzz([30, 50, 30, 50, 60]); }
    else { out.prize += P.wdPart; s.fail.wd++; logAdd('Eliminados no Mundial (' + nm[rd].n + ')'); api.toast('Eliminados no Mundial: ' + nm[rd].n + '. O ano que vem tem mais.'); }
    newYear(out); newSplit();
  }
  sync(api);
}
/* Joga o jogo (ou a rodada) da semana. Sf(kind, noScrim) devolve a forca (a Semana monta forma, scrim, lesao e pity). */
function step(Sf, wk, seed) {
  var out = { win: null, kind: null, split: false, prize: 0, fame: 0, pl: 0, title: null, done: false, year: false, round: -1, log: '' };
  if (!s || !s.on || !apiR) return out;
  if (s.ser) playSeries(apiR, Sf, wk, seed, out); else playSplit(apiR, Sf, wk, seed, out);
  sync(apiR); return out;
}

/* ---------- HUD / tier / cena ---------- */
function phaseName(api, short) {
  var rg = reg(api), lg = RG[rg].l;
  if (s.div === 'T2') return s.ph === 'promo' ? 'T2 · Série de acesso' : 'T2 · ' + (short ? 'Desafiante ' + RG[rg].s : G.t2name(rg));
  if (s.ph === 'msi') return lg + ' · MSI'; if (s.ph === 'worlds') return lg + ' · Mundial';
  return s.ti.wd ? lg + ' · Campeão mundial' : lg + ' · Split ' + s.sp;
}
function hud(api) {
  var tit = api.owned('tit'), S = strength(api), n;
  if (!s.on) return { stage: 'Ranqueada · elo baixo', next: 'Inscrição: ' + tit + '/5 titulares', p: tit / 5 };
  var out = { stage: phaseName(api, true) };
  if (s.ser) {
    var rds = rounds(s.ser.k), rd = rds[s.ser.r];
    out.next = rd.n + ' · Bo' + rd.bo;
    out.p = s.ser.r / rds.length; return out;
  }
  if (s.div === 'T2') {
    n = L.t2games;
    if (S < L.promoS) { out.next = 'Promoção: força ' + Math.floor(S) + '/' + L.promoS; out.p = Math.max(0, (S - 50) / (L.promoS - 50)); }
    else { out.next = 'Acesso: ' + s.w + '/' + L.promoW + ' vitórias'; out.p = s.gi / n; }
    return out;
  }
  n = L.t1games; out.p = s.gi / n;
  out.next = (s.ti.wd && s.sp === 2 ? 'Mundial' : s.sp === 1 ? 'MSI' : 'Mundial') + ': ' + s.w + '/' + L.qualW + ' vitórias';
  return out;
}
function tier() { return !s.on ? 0 : s.ti.wd ? 5 : s.played.wd ? 4 : s.played.msi ? 3 : s.div === 'T1' ? 2 : 1; }

/* ---------- interface ---------- */
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function mount(root, api) {
  apiR = api; root.classList.add('lg');
  root.innerHTML = '<section class="lgc"><b id="lgDiv"></b><small id="lgSub"></small></section>' +
    '<section class="lgc" aria-label="Força do time"><div class="lg-row"><span>Força do time</span><b id="lgS"></b></div><div class="lg-bar"><i id="lgSb"></i><u id="lgSm"></u></div><small id="lgSd"></small></section>' +
    '<section class="lgc" aria-label="Em jogo"><div class="lg-row"><span id="lgVs"></span><b id="lgRec"></b></div><div class="lg-bar"><i id="lgMb"></i></div><div class="lg-dots" id="lgDots"></div><small id="lgMd"></small></section>' +
    '<section class="lgc" id="lgSerC" aria-label="Chave"><b id="lgSerT"></b><ol class="lg-rounds" id="lgRounds"></ol></section>' +
    '<section class="lgc" aria-label="Troféus"><div class="lg-tro" id="lgTro"></div></section>' +
    '<section class="lgc" aria-label="Últimos jogos"><b>Últimos jogos</b><ul class="lg-log" id="lgLog"></ul></section>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { div: q('lgDiv'), sub: q('lgSub'), S: q('lgS'), Sb: q('lgSb'), Sm: q('lgSm'), Sd: q('lgSd'), vs: q('lgVs'), rec: q('lgRec'), Mb: q('lgMb'), dots: q('lgDots'), Md: q('lgMd'),
    serC: q('lgSerC'), serT: q('lgSerT'), rounds: q('lgRounds'), tro: q('lgTro'), log: q('lgLog'), logC: q('lgLog').parentNode };
  for (var i = 0; i < 9; i++) UI.dots.appendChild(el('span', 'dt'));
  var dlg = el('dialog', 'dlg'), h = el('h2', '', 'Escolha a região do time'), p = el('p', '', 'Seu time entra na T2 da região e sobe até a liga principal. Dá para mudar só zerando o jogo.');
  dlg.setAttribute('aria-labelledby', 'regT'); h.id = 'regT';
  var grid = el('div', 'regs'); dlg.appendChild(h); dlg.appendChild(p); dlg.appendChild(grid);
  G.regionOrder.forEach(function (k) {
    var b = el('button', 'btn' + (k === 'BR' ? ' pri' : ''), RG[k].n + ' (' + RG[k].l + ')'); b.type = 'button'; if (k === 'BR') b.autofocus = true;
    b.addEventListener('click', function () { api.shared.region = k; asked = true; api.closeDialog(dlg); api.toast('Região: ' + RG[k].n + '. Bom split!'); sync(api); api.invalidate(); api.save(); });
    grid.appendChild(b);
  });
  dlg.addEventListener('cancel', function () { api.shared.region = api.shared.region || 'BR'; asked = true; });
  document.body.appendChild(dlg); UI.dlg = dlg;
}
function render(api) {
  if (!UI) return;
  var rg = reg(api), S = strength(api), U = api.ui, need = L.promoS, sh = api.shared, X = window.ESPX.semana, wp = X ? X.state().wp : 0;
  U.text(UI.div, s.on ? phaseName(api) : 'Ranqueada · elo baixo');
  U.text(UI.sub, RG[rg].n + ' · ' + (s.on ? 'Ano ' + s.yr + (s.div === 'T1' ? ' · Split ' + s.sp : '') : 'monte o time para se inscrever'));
  U.text(UI.S, Math.floor(S) + (s.div === 'T2' ? ' / ' + need : ''));
  var scale = s.div === 'T2' ? need : 125;
  U.bar(UI.Sb, S / scale); UI.Sm.hidden = s.div !== 'T2'; if (s.div === 'T2') UI.Sm.style.left = '100%';
  var infra = api.owned('treino') + api.owned('house') * 0.8 + api.owned('equip') * 0.8 + (api.owned('coach') + api.owned('anal') + api.owned('psi')) * 1.5;
  U.text(UI.Sd, 'Elenco ' + Math.round(sh.avg5 || 0) + ' + estrutura ' + Math.round(infra) + ' + moral e forma ' + Math.round(S - (sh.avg5 || 0) - infra) + (s.div === 'T2' && S < need ? ' · falta ' + Math.ceil(need - S) + ' para a promoção' : ''));
  var n = s.div === 'T2' ? L.t2games : L.t1games, opp, oppS, left = Math.max(0, Math.ceil(E.C.WK - wp));
  if (!s.on) { U.text(UI.vs, 'Aguardando inscrição'); U.text(UI.rec, api.owned('tit') + '/5'); U.bar(UI.Mb, 0); U.text(UI.Md, 'Contrate 5 titulares para disputar a ' + G.t2name(rg) + '.'); }
  else if (s.ser) {
    var rd = rounds(s.ser.k)[s.ser.r]; opp = oppName(s.ser.k, s.ser.r, rg);
    U.text(UI.vs, rd.n + ' · vs ' + opp + ' (força ' + rd.s + ')'); U.text(UI.rec, 'Bo' + rd.bo);
    U.bar(UI.Mb, wp / E.C.WK); U.text(UI.Md, 'Rodada em ' + left + ' s · chance por jogo ' + Math.round(winP(strength(api, s.ser.k === 'worlds' ? 'wd' : s.ser.k), rd.s) * 100) + '%');
  } else {
    var list = s.div === 'T2' ? L.t2opp : L.t1opp; oppS = list[s.gi % list.length]; opp = oppName(s.div === 'T2' ? 't2' : 't1', s.gi, rg);
    U.text(UI.vs, 'Jogo ' + Math.min(s.gi + 1, n) + '/' + n + ' · vs ' + opp + ' (força ' + oppS + ')'); U.text(UI.rec, s.w + 'V ' + s.l + 'D');
    U.bar(UI.Mb, wp / E.C.WK);
    U.text(UI.Md, (s.div === 'T2' ? 'Precisa de ' + L.promoW + ' vitórias e força ' + need + ' para a série de acesso' : 'Precisa de ' + L.qualW + ' vitórias para o ' + (s.sp === 1 ? 'MSI' : 'Mundial')) + ' · jogo em ' + left + ' s · chance ' + Math.round(winP(S, oppS) * 100) + '%');
  }
  var arr = s.ser ? s.ser.h : s.res, tot = s.ser ? rounds(s.ser.k)[s.ser.r].bo : n;
  Array.prototype.forEach.call(UI.dots.children, function (d, i) {
    var v = arr[i] || ''; d.hidden = i >= tot; U.data(d, 'r', v); U.text(d, v);
  });
  UI.serC.hidden = !s.ser;
  if (s.ser) {
    var rds = rounds(s.ser.k); U.text(UI.serT, s.ser.k === 'promo' ? 'Série de acesso' : s.ser.k === 'msi' ? 'Chave do MSI' : 'Chave do Mundial');
    while (UI.rounds.children.length < rds.length) UI.rounds.appendChild(el('li'));
    Array.prototype.forEach.call(UI.rounds.children, function (li, i) {
      li.hidden = i >= rds.length; if (i >= rds.length) return;
      var r = s.ser.res[i] || (i === s.ser.r ? 'now' : ''); U.data(li, 'r', r);
      U.text(li, (r === 'W' ? '✔ ' : r === 'L' ? '✖ ' : r === 'now' ? '▶ ' : '○ ') + rds[i].n + ' · Bo' + rds[i].bo + ' · força ' + rds[i].s);
    });
  }
  U.text(UI.tro, '🥇 Acesso ' + (s.ti.promo ? '✔' : '—') + '   🏆 MSI ' + s.ti.msi + '   🌍 Mundial ' + s.ti.wd);
  UI.logC.hidden = !s.log.length; var lg = UI.log; while (lg.children.length < 6) lg.appendChild(el('li'));
  Array.prototype.forEach.call(lg.children, function (li, i) { U.text(li, s.log[i] || ''); li.hidden = !s.log[i]; });
}

Engine.registerTab('esp', {
  id: 'liga', label: 'Liga', icon: '🏆',
  ach: [
    { id: 'promo', ic: '⬆️', n: 'Subimos!', d: 'Suba da T2 para a liga principal.' },
    { id: 'lgmsi', ic: '🛂', n: 'Passaporte carimbado', d: 'Dispute o MSI.' },
    { id: 'msit', ic: '🏆', n: 'Campeões do meio do ano', d: 'Vença o MSI.' },
    { id: 'wdp', ic: '🌍', n: 'Rumo ao Mundial', d: 'Dispute o Mundial.' },
    { id: 'wdt', ic: '👑', n: 'Campeões do Mundo', d: 'Vença o Mundial e vire lenda.' },
    { id: 'perf', ic: '💯', n: 'Split perfeito', d: 'Vença os 9 jogos de um split na liga principal.' }
  ],
  mount: mount,
  load: function (d, api) {
    apiR = api; s = fresh();
    if (d && typeof d === 'object' && d.v === 2) {
      var f = fresh(); for (var k in f) if (d[k] !== undefined && typeof d[k] === typeof f[k]) s[k] = d[k];
      ['q', 'ti', 'fail', 'played'].forEach(function (m) {
        s[m] = {}; Object.keys(f[m]).forEach(function (kk) { var v = d[m] && +d[m][kk]; s[m][kk] = isFinite(v) && v >= 0 && v < 1e4 ? Math.floor(v) : 0; });
      });
      if (!Array.isArray(s.log)) s.log = []; s.log = s.log.slice(0, 6).map(String);
      if (!Array.isArray(s.res)) s.res = []; s.res = s.res.slice(0, 9).map(function (x) { return x === 'W' ? 'W' : 'L'; });
      s.div = s.div === 'T1' ? 'T1' : 'T2'; s.sp = s.sp === 2 ? 2 : 1; s.yr = Math.max(1, Math.floor(+s.yr) || 1); s.pts = Math.max(0, +s.pts || 0);
      s.gi = Math.max(0, Math.min(9, Math.floor(+s.gi) || 0)); s.w = Math.max(0, Math.min(9, Math.floor(+s.w) || 0)); s.l = Math.max(0, Math.min(9, Math.floor(+s.l) || 0));
      if (s.ser && (typeof s.ser !== 'object' || !s.ser.k || !rounds(s.ser.k)[s.ser.r] || !Array.isArray(s.ser.h) || !Array.isArray(s.ser.res))) { s.ser = null; newSplit(); }
      if (s.ser) { s.ph = s.ser.k; s.ser.h = s.ser.h.slice(0, 5).map(function (x) { return x === 'W' ? 'W' : 'L'; }); s.ser.res = s.ser.res.slice(0, 4); } else s.ph = 'split';
    }
    if (api.owned('tit') >= 5) s.on = 1;
    asked = false; sync(api);
  },
  save: function () { return s; },
  update: function (dt, api) {
    if (!s) return;
    if (!api.shared.region && api.isCurrent() && !asked && UI && UI.dlg) { asked = true; api.openDialog(UI.dlg); }
    if (!s.on) { if (api.owned('tit') >= 5) { s.on = 1; sync(api); var rg = reg(api); api.toast('Inscritos no ' + G.t2name(rg) + '!'); api.banner('T2 · ' + RG[rg].n); } return; }
    if (s.champ > 0) s.champ = Math.max(0, s.champ - dt);
    sync(api);
  },
  render: render, hud: hud, tier: tier,
  scene: function (x, api) {
    if (!s) return;
    x.region = RG[reg(api)].n; x.champ = s.champ > 0 ? 1 : 0;
    x.division = s.ph === 'msi' ? 'MSI' : s.ph === 'worlds' ? 'MUNDIAL' : s.div;
  },
  onPrestige: function (api) { /* nova temporada: volta pra T2; troféus e "disputou internacional" ficam */
    var keep = { ti: s.ti, played: s.played, intl: s.intl };
    s = fresh(); s.ti = keep.ti; s.played = keep.played; s.intl = keep.intl;
    s.on = api.owned('tit') >= 5 ? 1 : 0; sync(api);
  }
});
window.ESPX.liga = { step: step, state: function () { return s; }, rounds: rounds, hud: hud, winP: winP, oppName: oppName };
window.LIGA = { strength: function (k) { return strength(apiR, k); }, state: function () { return s; }, winP: winP, step: step, rounds: rounds };
})();
