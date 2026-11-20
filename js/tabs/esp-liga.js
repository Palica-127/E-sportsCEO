/* Aba LIGA do Time de eSports (plugin): regiao, divisoes T2/T1, splits, promocao, MSI e Mundial.
   Regras e numeros: docs/LOL_MERCADO.md. Usa so a API publica de abas (docs/TABS_API.md). */
(function () {
'use strict';
var G = GAMES.esp, L = G.lg, RG = G.regions;
var NAMES = ['Raposas da Névoa', 'Corvos de Ferro', 'Lobos do Norte', 'Furacão Azul', 'Dragões do Vale', 'Tubarões da Maré', 'Águias Prata', 'Guardiões do Farol',
  'Titãs do Cerrado', 'Serpentes Rubras', 'Fênix Dourada', 'Ursos do Gelo', 'Corujas da Noite', 'Panteras Negras', 'Falcões do Sul', 'Leões da Savana',
  'Tempestade Verde', 'Cometas Roxos', 'Ceifadores', 'Sentinelas', 'Vulcão Rubro', 'Marés Vivas', 'Trovão do Leste', 'Aurora Boreal'];
function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function oppName(kind, i, reg) { return NAMES[hash(kind + ':' + i + ':' + reg) % NAMES.length]; }
function off(api) { return L.offs[reg(api)] || 0; }
function winP(S, opp) { return 1 / (1 + Math.pow(10, (opp - S) / L.D)); }

var s = null, UI = null, apiR = null, asked = false;
function fresh() {
  return { v: 1, on: 0, div: 'T2', yr: 1, sp: 1, ph: 'split', gi: 0, w: 0, l: 0, res: [], cd: 0, ser: null, q: { msi: 0, wd: 0 }, seed: (Math.random() * 4294967296) >>> 0,
    ti: { promo: 0, msi: 0, wd: 0 }, fail: { promo: 0, msi: 0, wd: 0 }, played: { msi: 0, wd: 0 }, intl: 0, log: [], champ: 0, perf: 0 };
}
function rnd() { s.seed = (s.seed + 0x6D2B79F5) | 0; var t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
function reg(api) { var r = api.shared.region; return RG[r] ? r : 'BR'; }
function strength(api, kind) {
  var sh = api.shared, o = api.owned, A = sh.avg5 != null ? sh.avg5 : (o('tit') * G.mk.genNota + (5 - o('tit')) * G.mk.emptyNota) / 5;
  var U = o('treino') * L.uw.treino + o('house') * L.uw.house + o('equip') * L.uw.equip + (o('coach') + o('anal') + o('psi')) * L.uw.staff;
  var pity = kind && s ? Math.min(L.pityMax, (s.fail[kind] || 0) * L.pity) : 0;
  return A + U + (sh.subS || 0) + pity;
}
function logAdd(t) { s.log.unshift(t); if (s.log.length > 6) s.log.length = 6; }
function applyBonus(api) {
  api.mult('liga:promo', s.ti.promo ? L.bonus.promo : 1);
  api.mult('liga:msi', Math.pow(L.bonus.msi, Math.min(3, s.ti.msi)));
  api.mult('liga:wd', Math.pow(L.bonus.wd, Math.min(3, s.ti.wd)));
}
function sync(api) { var sh = api.shared; sh.division = s.div; sh.intl = s.intl ? 1 : 0; if (!RG[sh.region] && s.on) sh.region = 'BR'; }

function newSplit() { s.ph = 'split'; s.gi = 0; s.w = 0; s.l = 0; s.res = []; s.ser = null; s.cd = L.breakT; }
function startSeries(api, kind) {
  var rounds = kind === 'promo' ? [{ bo: 5, s: L.promoOpp, n: 'Série de acesso' }] : (kind === 'msi' ? L.msi : L.worlds);
  s.ph = kind; s.ser = { k: kind, r: 0, sw: 0, sl: 0, h: [], res: [] }; s.cd = L.breakT;
  if (kind !== 'promo') { s.intl = 1; s.played[kind === 'msi' ? 'msi' : 'wd']++; api.unlock(kind === 'msi' ? 'lgmsi' : 'wdp'); }
  api.toast(kind === 'promo' ? 'Série de acesso! Vença a melhor de 5 para subir.' : kind === 'msi' ? 'Classificados para o MSI!' : 'Classificados para o Mundial!');
  api.banner(kind === 'promo' ? 'Série de acesso' : kind === 'msi' ? 'MSI' : 'Mundial'); sync(api);
}
function rounds(kind) { return kind === 'promo' ? [{ bo: 5, s: L.promoOpp, n: 'Série de acesso' }] : (kind === 'msi' ? L.msi : L.worlds); }
function finish(api, kind, won) {
  var rg = reg(api), ps = api.ps(), k = kind === 'worlds' ? 'wd' : kind, R = L.rw, rd = s.ser.r, nr = rounds(kind).length;
  s.ser = null;
  if (kind === 'promo') {
    if (won) {
      s.div = 'T1'; s.ti.promo = 1; s.fail.promo = 0; api.earn(R.promo * ps); applyBonus(api); api.unlock('promo');
      logAdd('Promovidos ao ' + RG[rg].l + '!'); api.toast('Promovidos ao ' + RG[rg].l + '! +' + api.cur + ' ' + api.fmt(R.promo * ps) + ' e +10% de renda'); api.banner(RG[rg].l); api.sfx('up');
      s.yr = 1; s.sp = 1; newSplit();
    } else { s.fail.promo++; logAdd('Série de acesso perdida'); api.toast('Perdeu a série de acesso. Treine mais e tente no próximo split.'); newSplit(); }
  } else if (kind === 'msi') {
    var reward = won ? R.msiWin : rd === nr - 1 ? R.msiFin : R.msiPart;
    api.earn(reward * ps);
    if (won) { s.ti.msi++; s.fail.msi = 0; applyBonus(api); api.unlock('msit'); logAdd('Campeões do MSI!'); api.toast('Campeões do MSI! +' + api.cur + ' ' + api.fmt(reward * ps) + ' e bônus de renda'); api.banner('Campeões do MSI'); s.champ = 12; api.sfx('up'); }
    else { if (rd >= nr - 2) s.fail.msi++; logAdd('Eliminados no MSI (' + rounds('msi')[rd].n + ')'); api.toast('Eliminados no MSI: ' + rounds('msi')[rd].n + '. +' + api.cur + ' ' + api.fmt(reward * ps)); }
    s.sp = 2; newSplit();
  } else {
    var rw = won ? R.wdWin : R.wdPart; api.earn(rw * ps);
    if (won) { s.ti.wd++; s.fail.wd = 0; applyBonus(api); api.unlock('wdt'); logAdd('Campeões do Mundo!'); api.toast('CAMPEÕES DO MUNDO! +' + api.cur + ' ' + api.fmt(rw * ps), { ms: 6000 }); api.banner('Campeões do Mundo!'); s.champ = 20; api.sfx('up'); api.buzz([30, 50, 30, 50, 60]); }
    else { if (rd >= nr - 2) s.fail.wd++; logAdd('Eliminados no Mundial (' + rounds('worlds')[rd].n + ')'); api.toast('Eliminados no Mundial: ' + rounds('worlds')[rd].n + '. O ano que vem tem mais.'); }
    s.yr++; s.sp = 1; newSplit();
  }
  sync(api);
}
function playSplitGame(api) {
  var rg = reg(api), t2 = s.div === 'T2', list = t2 ? L.t2opp : L.t1opp, n = t2 ? L.t2games : L.t1games;
  var opp = list[s.gi % list.length] + (t2 ? 0 : off(api)), win = rnd() < winP(strength(api), opp);
  s.res.push(win ? 'W' : 'L'); if (win) s.w++; else s.l++; s.gi++;
  logAdd((win ? 'Vitória' : 'Derrota') + ' vs ' + oppName(t2 ? 't2' : 't1', s.gi - 1, rg));
  s.cd = L.matchT;
  if (s.gi < n) return;
  /* fim do split */
  s.cd = L.breakT;
  if (t2) {
    if (s.w >= L.promoW && strength(api, 'promo') >= L.promoS) startSeries(api, 'promo');
    else { logAdd('Split ' + s.w + 'V-' + s.l + 'D: ' + (s.w >= L.promoW ? 'falta força para a promoção' : 'sem vaga na série de acesso')); newSplit(); }
  } else {
    if (s.w === n) api.unlock('perf');
    if (s.sp === 1) { if (s.w >= L.qualW) { s.q.msi = 1; startSeries(api, 'msi'); } else { logAdd('Fora do MSI (' + s.w + 'V-' + s.l + 'D)'); s.sp = 2; newSplit(); } }
    else { if (s.w >= L.qualW) { s.q.wd = 1; startSeries(api, 'worlds'); } else { logAdd('Fora do Mundial (' + s.w + 'V-' + s.l + 'D)'); s.yr++; s.sp = 1; newSplit(); } }
  }
}
function playSeriesGame(api) {
  var ser = s.ser, kind = ser.k, rd = rounds(kind)[ser.r], need = (rd.bo + 1) >> 1, rg = reg(api);
  var pp = winP(strength(api, kind === 'worlds' ? 'wd' : kind), rd.s + (kind === 'promo' ? 0 : off(api))), win = rnd() < pp;
  ser.h.push(win ? 'W' : 'L'); if (win) ser.sw++; else ser.sl++;
  s.cd = L.matchT;
  if (ser.sw >= need) {
    ser.res[ser.r] = 'W'; logAdd(rd.n + ': vitória por ' + ser.sw + 'x' + ser.sl + ' vs ' + oppName(kind, ser.r, rg));
    if (ser.r + 1 >= rounds(kind).length) { finish(api, kind, true); return; }
    ser.r++; ser.sw = 0; ser.sl = 0; ser.h = []; s.cd = L.breakT;
    if (kind !== 'promo') api.toast(rd.n + ' vencida! Próxima: ' + rounds(kind)[ser.r].n);
  } else if (ser.sl >= need) { ser.res[ser.r] = 'L'; finish(api, kind, false); }
}
function step(api) { if (s.ser) playSeriesGame(api); else playSplitGame(api); }

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
    out.next = rd.n + ' · ' + s.ser.sw + 'x' + s.ser.sl;
    out.p = (s.ser.r + Math.min(1, (s.ser.sw + s.ser.sl) / rd.bo)) / rds.length; return out;
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
  var rg = reg(api), S = strength(api), U = api.ui, need = L.promoS, sh = api.shared;
  U.text(UI.div, s.on ? phaseName(api) : 'Ranqueada · elo baixo');
  U.text(UI.sub, RG[rg].n + ' · ' + (s.on ? 'Ano ' + s.yr + (s.div === 'T1' ? ' · Split ' + s.sp : '') : 'monte o time para se inscrever'));
  U.text(UI.S, Math.floor(S) + (s.div === 'T2' ? ' / ' + need : ''));
  var scale = s.div === 'T2' ? need : 110;
  U.bar(UI.Sb, S / scale); UI.Sm.hidden = s.div !== 'T2'; if (s.div === 'T2') UI.Sm.style.left = '100%';
  U.text(UI.Sd, 'Elenco ' + Math.round(sh.avg5 || 0) + ' + estrutura ' + Math.round(S - (sh.avg5 || 0) - (sh.subS || 0)) + (sh.subS ? ' + reservas ' + Math.round(sh.subS) : '') + (s.div === 'T2' && S < need ? ' · falta ' + Math.ceil(need - S) + ' para a promoção' : ''));
  var n = s.div === 'T2' ? L.t2games : L.t1games, opp, oppS, label;
  if (!s.on) { U.text(UI.vs, 'Aguardando inscrição'); U.text(UI.rec, api.owned('tit') + '/5'); U.bar(UI.Mb, 0); U.text(UI.Md, 'Contrate 5 titulares para disputar a ' + G.t2name(rg) + '.'); }
  else if (s.ser) {
    var rd = rounds(s.ser.k)[s.ser.r]; opp = oppName(s.ser.k, s.ser.r, rg);
    var rs = rd.s + (s.ser.k === 'promo' ? 0 : off(api)); U.text(UI.vs, rd.n + ' · vs ' + opp + ' (força ' + rs + ')'); U.text(UI.rec, s.ser.sw + ' x ' + s.ser.sl);
    U.bar(UI.Mb, 1 - Math.max(0, s.cd) / (s.cd > L.matchT ? L.breakT : L.matchT)); U.text(UI.Md, 'Melhor de ' + rd.bo + ' · chance por jogo ' + Math.round(winP(strength(api, s.ser.k === 'worlds' ? 'wd' : s.ser.k), rs) * 100) + '%');
  } else {
    var list = s.div === 'T2' ? L.t2opp : L.t1opp; oppS = list[s.gi % list.length] + (s.div === 'T2' ? 0 : off(api)); opp = oppName(s.div === 'T2' ? 't2' : 't1', s.gi, rg);
    U.text(UI.vs, 'Jogo ' + Math.min(s.gi + 1, n) + '/' + n + ' · vs ' + opp + ' (força ' + oppS + ')'); U.text(UI.rec, s.w + 'V ' + s.l + 'D');
    U.bar(UI.Mb, 1 - Math.max(0, s.cd) / (s.cd > L.matchT ? L.breakT : L.matchT));
    U.text(UI.Md, (s.div === 'T2' ? 'Precisa de ' + L.promoW + ' vitórias e força ' + need + ' para a série de acesso' : 'Precisa de ' + L.qualW + ' vitórias para o ' + (s.sp === 1 ? 'MSI' : 'Mundial')) + ' · chance ' + Math.round(winP(S, oppS) * 100) + '%');
  }
  var arr = s.ser ? s.ser.h : s.res, tot = s.ser ? rounds(s.ser.k)[s.ser.r].bo : n;
  Array.prototype.forEach.call(UI.dots.children, function (d, i) {
    var v = arr[i] || ''; d.hidden = i >= tot; U.data(d, 'r', v); U.text(d, v);
  });
  /* chave */
  UI.serC.hidden = !s.ser;
  if (s.ser) {
    var rds = rounds(s.ser.k); U.text(UI.serT, s.ser.k === 'promo' ? 'Série de acesso' : s.ser.k === 'msi' ? 'Chave do MSI' : 'Chave do Mundial');
    while (UI.rounds.children.length < rds.length) UI.rounds.appendChild(el('li'));
    Array.prototype.forEach.call(UI.rounds.children, function (li, i) {
      li.hidden = i >= rds.length; if (i >= rds.length) return;
      var r = s.ser.res[i] || (i === s.ser.r ? 'now' : ''); U.data(li, 'r', r);
      U.text(li, (r === 'W' ? '✔ ' : r === 'L' ? '✖ ' : r === 'now' ? '▶ ' : '○ ') + rds[i].n + ' · Bo' + rds[i].bo + ' · força ' + (rds[i].s + (s.ser.k === 'promo' ? 0 : off(api))));
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
    s = fresh();
    if (d && typeof d === 'object') {
      var f = fresh(); for (var k in f) if (d[k] !== undefined && typeof d[k] === typeof f[k]) s[k] = d[k];
      ['q', 'ti', 'fail', 'played'].forEach(function (m) { s[m] = Object.assign({}, f[m], d[m] && typeof d[m] === 'object' ? d[m] : {}); });
      if (!Array.isArray(s.log)) s.log = []; s.log = s.log.slice(0, 6).map(String); if (!Array.isArray(s.res)) s.res = [];
      s.div = s.div === 'T1' ? 'T1' : 'T2';
      if (s.ser && (!s.ser.k || !rounds(s.ser.k)[s.ser.r] || !Array.isArray(s.ser.h) || !Array.isArray(s.ser.res))) { s.ser = null; newSplit(); }
      s.seed = s.seed >>> 0;
    } else if (!api.shared.region && (api.life() > 0 || api.owned('tit') > 0)) { api.shared.region = 'BR'; } /* save antigo: Brasil / T2 */
    if (api.owned('tit') >= 5) s.on = 1;
    asked = false; applyBonus(api); sync(api);
  },
  save: function () { return s; },
  update: function (dt, api) {
    if (!s) return;
    if (!api.shared.region && api.isCurrent() && !asked && UI && UI.dlg) { asked = true; api.openDialog(UI.dlg); }
    if (!s.on) { if (api.owned('tit') >= 5) { s.on = 1; s.cd = L.breakT; sync(api); var rg = reg(api); api.toast('Inscritos no ' + G.t2name(rg) + '!'); api.banner('T2 · ' + RG[rg].n); } return; }
    if (s.champ > 0) s.champ = Math.max(0, s.champ - dt);
    s.cd -= dt; var guard = 0;
    while (s.cd <= 0 && guard++ < 40) step(api);
    sync(api);
  },
  render: render, hud: hud, tier: tier,
  scene: function (x, api) {
    x.region = RG[reg(api)].n; x.champ = s.champ > 0 ? 1 : 0;
    x.division = s.ph === 'msi' ? 'MSI' : s.ph === 'worlds' ? 'MUNDIAL' : s.div;
  },
  onPrestige: function (api) { /* nova temporada: volta pra T2; troféus, bônus e "disputou internacional" ficam */
    var keep = { ti: s.ti, played: s.played, intl: s.intl, seed: s.seed };
    s = fresh(); s.ti = keep.ti; s.played = keep.played; s.intl = keep.intl; s.seed = keep.seed;
    s.on = api.owned('tit') >= 5 ? 1 : 0; applyBonus(api); sync(api);
  }
});
window.LIGA = { strength: function (k) { return strength(apiR, k); }, state: function () { return s; }, winP: winP, step: function () { step(apiR); }, rounds: rounds };
})();
