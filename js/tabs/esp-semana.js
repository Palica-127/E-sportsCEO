/* SEMANA do Time de eSports (plugin "home" da tela Time): relogio de 40 s, Foco da semana, Piloto automatico, receitas e despesas,
   patrocinios (aceitar/recusar), eventos com escolha, falencia amena, progresso offline e Nova temporada.
   Regras e numeros: docs/ESPORTS_ECONOMIA.md. Funcoes puras: js/data/esp-eco.js (ECO). */
(function () {
'use strict';
var G = GAMES.esp, E = ECO, C = E.C, WK = C.WK, RG = G.regions, FOC = E.FOCOS, TIERS = C.tiers;
window.ESPX = window.ESPX || {};
var fm = E.fmtM;
var FAME_LV = [[550, 'Ícone'], [320, 'Lenda'], [150, 'Estrela'], [60, 'Famoso'], [15, 'Em alta'], [5, 'Conhecido'], [0, 'Desconhecido']];
var SEG_LV = [100, 1e3, 1e4, 1e5, 1e6, 5e6], FAME_MIR = [5, 15, 60, 150, 320, 550];
var STAFF = ['psi', 'anal', 'coach', 'smm'], STAFF_N = { coach: 'o Coach', anal: 'o Analista', psi: 'o Psicólogo', smm: 'o Social media' };
var s = null, apiR = null, UI = null, lastAlert = 0, evSig = '', ofSig = '';

/* ---------- estado ---------- */
function rand32() { return (Math.random() * 4294967296) >>> 0; }
function fresh() {
  return { v: 1, seed: rand32(), rc: 0, wk: 0, wp: 0, foco: 'conteudo', prox: 'conteudo', auto: 0, bc: 0, F: 0, seg: C.seg0, M: C.moral0,
    forma: [0, 0], scrim: 0, lesao: [0, 0], cd: { imprensa: 0, negociar: 0, bootcamp: 0 }, con: [], of: [], gh: [], inv: 0, evcd: 0, ev: null,
    pl: 0, ren: 1, log: [], wr: [], last: null, lw: null, lwT: 0, st: { resg: 0, ev: 0, venda: 0, sem: 0 } };
}
function nz(v, d, lo, hi) { v = +v; if (!isFinite(v)) return d; return Math.max(lo == null ? 0 : lo, Math.min(hi == null ? 1e15 : hi, v)); }
function ns(v, d) { v = +v; return isFinite(v) ? Math.max(-1e12, Math.min(1e12, v)) : d; }
function rnd() { return E.mix(s.seed, 100000 + (s.rc++), 77); }
function reg(api) { var r = api.shared.region; return RG[r] ? r : 'BR'; }
function div(api) { var L = window.ESPX.liga && ESPX.liga.state(); return api.shared.division === 'T1' ? 'T1' : (L && L.on ? 'T2' : 'ranq'); }
function lg() { return window.ESPX.liga ? ESPX.liga.state() : null; }
function lv(api, id) { return api.owned(id); }
function star(api) { return +api.shared.star || 0; }
function avg5(api) { var a = api.shared.avg5; return a != null ? a : (api.owned('tit') * E.C.gen.nota + (5 - api.owned('tit')) * C.gen.empty) / 5; }
function hallMul(api) { return 1 + 0.05 * Math.min(16, api.stars()); }
function pct1(v) { return (Math.round(v * 10) / 10).toString().replace('.', ','); }
function logAdd(t) { s.log.unshift(t); if (s.log.length > 6) s.log.length = 6; }
function fameName(F) { for (var i = 0; i < FAME_LV.length; i++) if (F >= FAME_LV[i][0]) return FAME_LV[i][1]; return 'Desconhecido'; }
function slots(F) { return 1 + (F >= C.slotsF[1] ? 1 : 0) + (F >= C.slotsF[2] ? 1 : 0); }

/* ---------- forca e economia ---------- */
function strength(api, kind, noScrim, base) {
  var I = lv(api, 'treino') * C.uw.treino + lv(api, 'house') * C.uw.house + lv(api, 'equip') * C.uw.equip;
  var St = C.staffS * (lv(api, 'coach') + lv(api, 'anal') + lv(api, 'psi'));
  var Mo = Math.max(-6, Math.min(6, (s.M - 50) / 8));
  var f = !base && s.forma[1] > 0 ? s.forma[0] : 0, pen = !base && s.lesao[1] > 0 ? s.lesao[0] : 0;
  var pity = kind ? Math.min(C.lg.pityMax, C.lg.pity * ((lg() && lg().fail[kind]) || 0)) : 0;
  return avg5(api) + I + St + Mo + f - pen + (noScrim || base ? 0 : s.scrim) + pity;
}
function expWR(api) { /* vitoria esperada no split (forca base +3 de scrim) */
  var L = lg(), list = L && L.div === 'T1' ? C.lg.t1opp : C.lg.t2opp, S = strength(api, null, true, true) + 3, t = 0;
  list.forEach(function (o) { t += E.winP(S, o); }); return t / list.length;
}
function staffSal(api) { var t = 0; STAFF.forEach(function (k) { if (lv(api, k)) t += C.staffSal[k]; }); return t; }
function invested(api) { /* total gasto em estrutura (manutencao de 0,4% por semana) */
  var t = 0;
  ['treino', 'house', 'equip', 'arena'].forEach(function (id) {
    var i = G.idx[id], it = G.items[i], n = api.owned(id); if (n > 0) t += it.c0 * (Math.pow(it.g, n) - 1) / (it.g - 1);
  });
  return t;
}
function costsParts(api) {
  var sal = api.shared.salRoster != null ? api.shared.salRoster : api.owned('tit') * C.gen.sal;
  return { sal: sal + api.owned('res') * C.gen.resSal, staff: staffSal(api), upkeep: C.upkeep * invested(api) };
}
function costs(api) { var c = costsParts(api); return c.sal + c.staff + c.upkeep; }
function wrNow() { var n = s.wr.length; if (!n) return 0.5; var w = 0; s.wr.forEach(function (x) { w += x; }); return w / n; }
function income(api, focus, intl) {
  var d = div(api), ar = lv(api, 'arena'), smm = lv(api, 'smm'), mult = hallMul(api);
  var tv = C.tv[d] + (intl ? C.tvIntl : 0), spons = 0;
  s.con.forEach(function (c) { spons += c.v; });
  var social = C.pub * Math.pow(s.seg, 0.75) * (1 + 0.5 * smm) * (1 + star(api) / 40) * (focus === 'conteudo' ? 1.5 : 1);
  var loja = C.loja * Math.pow(Math.max(0, s.F), C.lojaExp) * (1 + 0.25 * ar);
  var ticket = d === 'ranq' ? 0 : C.arenaRev[ar] * (0.4 + 0.6 * wrNow());
  return { tv: tv * mult, spons: spons * mult, social: social * mult, loja: loja * mult, ticket: ticket * mult, sum: (tv + spons + social + loja + ticket) * mult };
}
function avgGross(api) { if (s.gh.length) { var t = 0; s.gh.forEach(function (x) { t += x; }); return t / s.gh.length; } return income(api, s.foco, false).sum; }
function saldo(api) { return avgGross(api) - costs(api); }
function U() { var t = 0; s.gh.forEach(function (x) { t += x; }); return Math.max(1500, s.gh.length ? t / s.gh.length : 1500); }
function runway(api) { var sd = saldo(api); return sd >= 0 ? Infinity : api.money() / -sd; }
function alertLv(api) { var sd = saldo(api); if (sd >= 0) return 0; var m = api.money(); return m < 2 * -sd ? 2 : m < 4 * -sd ? 1 : 0; }
function confirmText(api, dCost, dSal) { /* "Seu caixa vai cair R$ 31 mil por semana. Da para ~2 semanas. Continuar?" */
  var ns = saldo(api) - dSal, m = api.money() - dCost;
  if (ns >= 0 || m >= 8 * -ns) return null;
  return 'Seu caixa vai cair ' + fm(-ns) + ' por semana. Dá para ~' + Math.max(0, Math.floor(m / -ns)) + ' semanas. Continuar?';
}
function focusCost(api, id) {
  var d = div(api);
  return id === 'scrims' ? (d === 'T1' ? C.spend.scrimT1 : C.spend.scrimT2) : id === 'bootcamp' ? C.spend.bootcamp : 0;
}
function formaOf(api, base) { return base * (1 + 0.4 * lv(api, 'coach') + 0.2 * lv(api, 'anal')); }

/* ---------- foco ---------- */
function focusAvail(api, id) {
  var d = div(api), c = C.cd[id];
  if (s.bc) return { ok: false, why: 'Bootcamp em andamento' };
  if (c && s.cd[id] > 0) return { ok: false, why: 'Pronto em ' + s.cd[id] + ' sem' };
  if (id === 'negociar' && d === 'ranq') return { ok: false, why: 'Precisa de 5 titulares' };
  if (id === 'bootcamp') {
    if (d !== 'T1') return { ok: false, why: 'Só na liga principal' };
    if (api.money() < C.focusFloor.bootcampCash + 3 * costs(api)) return { ok: false, why: 'Caixa: ' + fm(C.focusFloor.bootcampCash + 3 * costs(api)) };
  }
  if (id === 'scrims' && api.money() < focusCost(api, id)) return { ok: false, why: 'Sem caixa' };
  return { ok: true };
}
function pickAuto(api) {
  var L = lg(), ser = L && L.ser, c = costs(api), run = api.money() / Math.max(1, c), d = div(api), f = 'conteudo';
  if (s.M < 40) f = 'descanso';
  else if (run < 4) f = 'conteudo';
  else if (ser && (ser.k === 'msi' || ser.k === 'worlds') && ser.r === 0 && d === 'T1' && s.cd.bootcamp <= 0 && api.money() > C.focusFloor.bootcampCash + 3 * c) f = 'bootcamp';
  else if (ser) f = 'scrims';
  else if (s.forma[1] <= 0 || s.forma[0] < 3) f = 'treino';
  else if (s.cd.imprensa <= 0 && s.wk % 2 === 0) f = 'imprensa';
  else f = s.wk % 2 ? 'conteudo' : 'treino';
  return focusAvail(api, f).ok ? f : 'conteudo';
}
function beginWeek(api, forceAuto) { /* escolhe o foco da semana que comeca */
  if (s.bc) { s.foco = 'bootcamp2'; return; }
  if (s.foco === 'bootcamp2') s.foco = 'conteudo';
  if (s.auto || forceAuto) s.foco = pickAuto(api);
  else if (!focusAvail(api, s.foco).ok) s.foco = 'conteudo';
  s.prox = s.foco;
}
function setFocus(api, id) {
  if (s.ev) return { ok: false, why: 'Decida o evento primeiro' };
  if (E.FIDX[id] === undefined) return { ok: false, why: 'Foco desconhecido' };
  var a = focusAvail(api, id); if (!a.ok) return a;
  s.foco = id; s.prox = id; return { ok: true };
}

/* ---------- patrocinio ---------- */
function tierOk(api, F, d) { var ok = []; TIERS.forEach(function (t, i) { if (F >= t[1] && (!t[5] || d === 'T1')) ok.push(i); }); return ok; }
function genOffer(api, o) { /* o = {mult, dm} => oferta "especial" do maior tier; senao sorteio entre os 3 maiores */
  var ok = tierOk(api, s.F, div(api)), i, t, rm = E.regOffer(reg(api)), val, meta;
  if (!ok.length) return null;
  if (o && o.mult) { i = ok[ok.length - 1]; t = TIERS[i]; val = E.r2(t[2] * o.mult * rm); meta = t[4] ? Math.min(0.8, t[4] + (o.dm || 0)) : 0; }
  else {
    if (s.of.length >= 3) return null;
    var top = ok.slice(-3).reverse(), w = [50, 30, 20].slice(0, top.length), tot = 0, r, j;
    w.forEach(function (x) { tot += x; }); r = rnd() * tot;
    for (j = 0; j < w.length; j++) { r -= w[j]; if (r < 0) break; } i = top[Math.min(j, top.length - 1)]; t = TIERS[i];
    val = E.r2(t[2] * (0.9 + 0.25 * rnd()) * rm); meta = t[4];
  }
  var of = { t: i + 1, v: val, prazo: t[3], meta: meta, vida: C.offerLife };
  s.of.push(of); return of;
}
function brand(t) { return TIERS[t - 1][0]; }
function acceptOffer(api, idx, swapIdx, quiet) {
  var o = s.of[idx]; if (!o) return { ok: false, why: 'A oferta sumiu' };
  if (s.con.length >= slots(s.F)) {
    if (swapIdx == null || !s.con[swapIdx]) return { ok: false, need: 'swap', why: 'Sem vaga livre: escolha qual contrato rescindir' };
    var old = s.con[swapIdx], multa = 2 * old.v0; api.pay(multa); s.con.splice(swapIdx, 1);
    logAdd('Rescisão com ' + brand(old.t) + ': multa ' + fm(multa));
  }
  var luvas = 2 * o.v; api.earn(luvas);
  s.con.push({ t: o.t, v: o.v, v0: o.v, rest: o.prazo, rev: C.review, st: 0, h: [] });
  s.of.splice(idx, 1);
  logAdd('Contrato com ' + brand(o.t) + ': ' + fm(o.v) + '/sem');
  mirrors(api); if (o.t >= 6) api.unlock('sonho');
  if (!quiet) { api.toast(brand(o.t) + ' fechou! Luvas de ' + fm(luvas) + ' no caixa.'); api.sfx('buy'); api.buzz(10); api.invalidate(); api.save(); }
  if (api.money() < 0) rescue(api);
  return { ok: true, luvas: luvas };
}
function refuseOffer(api, idx) { var o = s.of[idx]; if (!o) return false; s.of.splice(idx, 1); api.sfx('tap'); api.invalidate(); return true; }
function autoAccept(api, quiet) { /* Piloto automatico: so aceita oferta "segura" (vitoria esperada >= meta + 7 pontos) */
  var wr = expWR(api), list = s.of.slice().sort(function (a, b) { return b.v - a.v; });
  list.forEach(function (o) {
    var i = s.of.indexOf(o); if (i < 0) return;
    if (o.meta > 0 && wr < o.meta + 0.07) return;
    var sw = null;
    if (s.con.length >= slots(s.F)) {
      var wi = 0; s.con.forEach(function (c, j) { if (c.v < s.con[wi].v) wi = j; });
      if (o.v < 1.8 * s.con[wi].v) return;
      sw = wi;
    }
    acceptOffer(api, i, sw, quiet);
  });
}
function reviewContracts(api, evl) {
  s.con.slice().forEach(function (c) {
    c.rest--; c.rev--; var t = TIERS[c.t - 1], meta = t[4], i = s.con.indexOf(c);
    if (c.rev <= 0) {
      c.rev = C.review; var h = c.h.slice(-8), wr = h.length >= 4 ? h.reduce(function (a, b) { return a + b; }, 0) / h.length : 1;
      if (wr < meta) {
        c.st++;
        if (c.st === 1) { c.v = Math.floor(c.v0 * 0.7); evl.push(t[0] + ' está de olho em vocês: valor reduzido por 8 semanas.'); }
        else { api.pay(2 * c.v0); s.con.splice(i, 1); evl.push(t[0] + ' rompeu o contrato. Multa: ' + fm(2 * c.v0) + '.'); return; }
      } else { c.st = 0; c.v = c.v0; }
    }
    if (c.rest <= 0) {
      api.earn(3 * c.v0);
      var higher = false; TIERS.slice(c.t).forEach(function (x) { if (s.F >= x[1] && (div(api) === 'T1' || !x[5])) higher = true; });
      if (s.F >= t[1] && !higher && s.ren) { c.v0 = Math.floor(Math.min(c.v0 * 1.1, 1.6 * t[2] * E.regOffer(reg(api)))); c.v = c.v0; c.rest = t[3]; evl.push(t[0] + ' renovou: ' + fm(c.v0) + '/sem. Bônus de renovação: ' + fm(3 * c.v0) + '.'); }
      else { s.con.splice(i, 1); evl.push(t[0] + ' encerrou o contrato (bônus de ' + fm(3 * c.v0) + ').'); }
    }
  });
}

/* ---------- eventos (15) ---------- */
function cx(api, UU) {
  return {
    U: UU, rnd: rnd,
    M: function (v) { s.M = Math.max(0, Math.min(100, s.M + v)); },
    F: function (v) { s.F = Math.max(0, Math.min(1000, s.F + v)); },
    seg: function (m) { s.seg = Math.max(50, s.seg * m); },
    pay: function (v) { if (v > 0) api.pay(v); }, earn: function (v) { if (v > 0) api.earn(v); },
    forma: function (v, w) { if (v >= (s.forma[1] > 0 ? s.forma[0] : 0)) s.forma = [v, w]; },
    pen: function (v, w) { var k = 1 - 0.25 * lv(api, 'res'); v *= k; s.lesao = [Math.max(v, s.lesao[1] > 0 ? s.lesao[0] : 0), w]; },
    scrim: function (v) { s.scrim = Math.max(s.scrim, v); },
    offer: function (m, dm) { genOffer(api, { mult: m, dm: dm }); }
  };
}
function u(k) { return function (UU) { return fm(k * UU); }; }
var EVS = [
  { id: 'polemica', ic: '🐦', n: 'Polêmica no Twitter', t: 'O suporte tuitou "o jogo tá fácil" às 3 da manhã. O print já virou figurinha.', cond: function () { return s.seg > 1500; },
    o: [{ t: 'Pedir desculpas', d: 'Moral -2, Fama -1', fn: function (x) { x.M(-2); x.F(-1); } },
        { t: 'Dobrar a aposta', d: '50%: seguidores +10%, Fama +2 e ganho. 50%: Fama -4, perda e moral -3', fn: function (x) { if (x.rnd() < 0.5) { x.seg(1.10); x.F(2); x.earn(0.5 * x.U); return 'Deu certo: o print virou meme a favor.'; } x.F(-4); x.pay(0.5 * x.U); x.M(-3); return 'Deu errado: a internet não perdoou.'; } }] },
  { id: 'viral', ic: '📹', n: 'Clipe viral', t: 'O atirador errou o flash e o vídeo bombou. Metade ri, metade chora.', cond: function () { return s.seg > 800; },
    o: [{ t: 'Impulsionar com anúncio', d: function (UU) { return 'Custa ' + fm(0.3 * UU) + '. Seguidores +12%, Fama +2'; }, fn: function (x) { x.pay(0.3 * x.U); x.seg(1.12); x.F(2); } },
        { t: 'Deixar orgânico', d: 'Seguidores +4%', fn: function (x) { x.seg(1.04); } }] },
  { id: 'lesao', ic: '🩹', n: 'Lesão', t: 'O meio sentiu o punho depois de 9 horas de rankeada. O fisio usou a palavra "repouso".', cond: function (api) { return api.owned('tit') >= 5; },
    o: [{ t: 'Jogar machucado', d: 'Força -3 por 3 sem (30% de chance de -6)', fn: function (x) { x.pen(x.rnd() < 0.3 ? 6 : 3, 3); } },
        { t: 'Fisio e reserva', d: function (UU) { return 'Custa ' + fm(0.3 * UU) + '. Força -1,5 por 2 sem'; }, fn: function (x) { x.pay(0.3 * x.U); x.pen(1.5, 2); } }] },
  { id: 'proposta', ic: '📨', n: 'Proposta relâmpago', t: 'Uma marca mandou DM às 23h47: "bora fechar?". Parece urgente. Parece.', cond: function () { return s.F >= 15; },
    o: [{ t: 'Fechar na hora', d: 'Oferta do maior tier liberado, +25% de valor, meta +10 pontos', fn: function (x) { x.offer(1.25, 0.10); } },
        { t: 'Negociar mais', d: '50%: oferta +45%. 50%: a marca some', fn: function (x) { if (x.rnd() < 0.5) { x.offer(1.45, 0); return 'A marca topou: oferta +45% no quadro.'; } return 'A marca sumiu do mapa.'; } }] },
  { id: 'bootcamp', ic: '✈️', n: 'Convite de bootcamp', t: 'Um time coreano chamou vocês para Seul. Kimchi incluso.', cond: function (api) { return div(api) === 'T1'; },
    o: [{ t: 'Aceitar', d: function (UU) { return 'Custa ' + fm(UU) + '. Força +4 por 4 sem, moral +6, Fama +1'; }, fn: function (x) { x.pay(x.U); x.forma(4, 4); x.M(6); x.F(1); } },
        { t: 'Recusar', d: 'Moral +1 ("vamos treinar o que sabemos")', fn: function (x) { x.M(1); } }] },
  { id: 'rival', ic: '😤', n: 'Rivalidade', t: 'O rival disse na live que vocês "só ganham por sorte". A sorte está de camisa do seu time.', cond: function (api) { return div(api) !== 'ranq'; },
    o: [{ t: 'Responder em campo', d: 'Próximo jogo +3 de força, Fama -0,5', fn: function (x) { x.scrim(3); x.F(-0.5); } },
        { t: 'Postar meme', d: 'Seguidores +5%, Fama +1, moral +2', fn: function (x) { x.seg(1.05); x.F(1); x.M(2); } }] },
  { id: 'vazamento', ic: '🕵️', n: 'Vazamento de scrim', t: 'O scrim vazou no Discord. O rival já sabe o que o seu atirador vai pickar.', cond: function (api) { return div(api) !== 'ranq'; },
    o: [{ t: 'Mudar o draft', d: function (UU) { return 'Custa ' + fm(0.3 * UU) + '. Força +2 por 2 sem'; }, fn: function (x) { x.pay(0.3 * x.U); x.forma(2, 2); } },
        { t: 'Fingir que não viu', d: 'Força -2 por 2 sem', fn: function (x) { x.pen(2, 2); } }] },
  { id: 'briga', ic: '🍽️', n: 'Treta na gaming house', t: 'A discussão sobre quem esqueceu a louça virou "conversa séria".', cond: function (api) { return api.owned('tit') >= 5; },
    o: [{ t: 'Chamar o psicólogo', d: function (UU) { return 'Custa ' + fm(0.2 * UU) + '. Moral +5 (+9 se tiver psicólogo)'; }, fn: function (x, api) { x.pay(0.2 * x.U); x.M(lv(api, 'psi') ? 9 : 5); } },
        { t: 'Deixar resolver sozinhos', d: '60%: moral +6. 40%: moral -10', fn: function (x) { if (x.rnd() < 0.6) { x.M(6); return 'Fizeram as pazes.'; } x.M(-10); return 'Piorou: ninguém fala com ninguém.'; } }] },
  { id: 'collab', ic: '🎙️', n: 'Collab com streamer', t: 'Um streamer famoso quer jogar uma ranked com vocês. E aparecer no seu canal.', cond: function () { return s.seg > 3000; },
    o: [{ t: 'Aceitar collab', d: function (UU) { return 'Custa ' + fm(0.3 * UU) + '. Seguidores +15%, Fama +2'; }, fn: function (x) { x.pay(0.3 * x.U); x.seg(1.15); x.F(2); } },
        { t: 'Cobrar cachê', d: function (UU) { return 'Ganha ' + fm(0.8 * UU) + ' e seguidores +3%'; }, fn: function (x) { x.earn(0.8 * x.U); x.seg(1.03); } }] },
  { id: 'reality', ic: '📺', n: 'Reality show', t: 'A liga propôs "Bastidores da Gaming House". A câmera entra até na cozinha.', cond: function (api) { return div(api) === 'T1'; },
    o: [{ t: 'Participar', d: function (UU) { return 'Ganha ' + fm(1.2 * UU) + ', moral -5'; }, fn: function (x) { x.earn(1.2 * x.U); x.M(-5); } },
        { t: 'Recusar', d: 'Moral +2, Fama +0,5', fn: function (x) { x.M(2); x.F(0.5); } }] },
  { id: 'compra', ic: '💼', n: 'Proposta por jogador', t: 'Um clube rival ofereceu 1,3x o que você pagou pelo seu menos estrelado. Ele está lendo com muito interesse.', cond: function (api) { return (api.shared.nReal || 0) > 0; },
    o: [{ t: 'Vender', d: 'Recebe 130% do que pagou, vira Amador, moral -3', fn: function (x, api) { var r = ESPX.mercado.sellOne(api, 1.3); x.M(-3); if (r) { s.st.venda++; return r.name + ' foi vendido por ' + fm(r.amount) + '.'; } } },
        { t: 'Recusar', d: 'Moral +4', fn: function (x) { x.M(4); } }] },
  { id: 'vaquinha', ic: '🥩', n: 'Vaquinha da torcida', t: 'A torcida fez uma rifa para comprar mouses novos. O prêmio é um churrasco.', cond: function () { return s.F >= 5; },
    o: [{ t: 'Aceitar a rifa', d: function (UU) { return 'Ganha ' + fm(0.8 * UU) + ', Fama +1'; }, fn: function (x) { x.earn(0.8 * x.U); x.F(1); } },
        { t: 'Agradecer e recusar', d: 'Fama +2, moral +2', fn: function (x) { x.F(2); x.M(2); } }] },
  { id: 'ativacao', ic: '📸', n: 'Ação do patrocinador', t: 'O patrocinador quer foto de todos segurando o produto. Sorrindo!', cond: function () { return s.con.length > 0; },
    o: [{ t: 'Fazer a ação', d: function (UU) { return 'Ganha ' + fm(0.6 * UU) + ', moral -3'; }, fn: function (x) { x.earn(0.6 * x.U); x.M(-3); } },
        { t: 'Recusar educadamente', d: function (UU) { return '25% de chance de perder ' + fm(0.3 * UU); }, fn: function (x) { if (x.rnd() < 0.25) { x.pay(0.3 * x.U); return 'A marca ficou chateada.'; } } }] },
  { id: 'internet', ic: '📡', n: 'A internet caiu', t: 'Minutos antes do scrim. A operadora disse que "é normal".', cond: function (api) { return div(api) !== 'ranq'; },
    o: [{ t: 'Fibra dedicada', d: function (UU) { return 'Custa ' + fm(0.4 * UU) + '. Força +1 por 6 sem'; }, fn: function (x) { x.pay(0.4 * x.U); x.forma(1, 6); } },
        { t: 'Jogar no 4G', d: '50%: força -3 por 1 sem', fn: function (x) { if (x.rnd() < 0.5) { x.pen(3, 1); return 'O 4G falhou no meio do scrim.'; } } }] },
  { id: 'staff', ic: '🧲', n: 'Rival tenta roubar o staff', t: 'Chegou uma proposta "irrecusável" para o seu coach (e um salário com dois dígitos a mais).', cond: function (api) { return STAFF.some(function (k) { return lv(api, k); }); },
    o: [{ t: 'Cobrir a oferta', d: function (UU) { return 'Custa ' + fm(0.5 * UU) + '. Nada muda'; }, fn: function (x) { x.pay(0.5 * x.U); } },
        { t: 'Deixar ir', d: function (UU) { return 'Perde 1 membro do staff (recontratar custa de novo), ganha ' + fm(0.3 * UU); }, fn: function (x, api) { var k = ['coach', 'anal', 'psi', 'smm'].filter(function (z) { return lv(api, z); })[0]; if (k) { api.setOwned(k, 0); x.earn(0.3 * x.U); return STAFF_N[k].replace(/^o /, 'O ') + ' foi embora.'; } } }] }
];
var EVIDX = {}; EVS.forEach(function (e, i) { EVIDX[e.id] = i; });
function maybeEvent(api) {
  if (s.ev || s.evcd > 0 || div(api) === 'ranq' || rnd() >= C.evChance) return;
  var ok = []; EVS.forEach(function (e, i) { if (e.cond(api)) ok.push(i); });
  if (!ok.length) return;
  s.ev = { id: EVS[ok[Math.floor(rnd() * ok.length)]].id, U: Math.round(U()) }; s.evcd = C.evGap;
  api.toast('Evento: ' + EVS[EVIDX[s.ev.id]].n + '. Decida no Time.', { action: 'Ver', ms: 6000, fn: function () { api.select('time'); } });
}
function chooseEvent(api, i) {
  if (!s.ev) return null;
  var e = EVS[EVIDX[s.ev.id]], o = e && e.o[i]; if (!o) return null;
  var x = cx(api, s.ev.U), msg = o.fn(x, api); s.ev = null; s.st.ev++;
  var txt = e.n + ': ' + o.t + (msg ? '. ' + msg : '.'); logAdd(txt);
  if (s.st.ev >= 10) api.unlock('crise');
  api.toast(txt, { ms: 4500 }); api.sfx('buy');
  mirrors(api); if (api.money() < 0) rescue(api);
  evSig = ''; api.invalidate(); api.save(); return txt;
}

/* ---------- resgate (falencia amena) ---------- */
function rescue(api) {
  if (api.money() >= 0) return null;
  var r = ESPX.mercado.sellForced(api), msg;
  s.st.resg++;
  if (r) { msg = 'A diretoria vendeu ' + r.name + ' por ' + fm(r.amount) + ' para fechar as contas. Ele deixa saudades e um buraco na defesa.'; api.unlock('vendeu'); }
  else {
    var k = STAFF.filter(function (z) { return lv(api, z); })[0];
    if (k) { api.setOwned(k, 0); msg = 'A diretoria dispensou ' + STAFF_N[k] + ' para fechar as contas.'; }
  }
  s.M = Math.max(0, s.M - 8);
  if (api.money() < 0) { api.earn(C.cash0 - api.money(), false); msg = (msg ? msg + ' ' : '') + 'A diretoria cobriu o rombo: caixa de ' + fm(C.cash0) + '.'; }
  logAdd(msg); api.toast(msg, { ms: 7000 }); api.sfx('no');
  return msg;
}

/* ---------- a semana ---------- */
function mirrors(api) {
  var t = 0; s.con.forEach(function (c) { if (c.t > t) t = c.t; });
  var seg = 0; SEG_LV.forEach(function (v, i) { if (s.seg >= v) seg = i + 1; });
  var fa = 0; FAME_MIR.forEach(function (v, i) { if (s.F >= v) fa = i + 1; });
  var L = lg(), ti = L ? Math.min(6, (L.ti.promo ? 1 : 0) + Math.min(3, L.ti.msi) + (L.ti.wd ? 2 : 0)) : 0;
  [['patro', t], ['canal', seg], ['fa', fa], ['titulo', ti]].forEach(function (p) { if (api.owned(p[0]) !== p[1]) api.setOwned(p[0], p[1]); });
}
function closeWeek(api, off) {
  var r = { win: null, kind: null, title: null, done: false, net: 0, gross: 0, cost: 0 }, f = s.foco, c0 = api.money(), F0 = s.F, dM = 0, dF = 0, segmul = 1, spend = 0, evl = [];
  if (window.ESPX.mercado) ESPX.mercado.refresh(api);
  s.wk++;
  ['imprensa', 'negociar', 'bootcamp'].forEach(function (k) { s.cd[k] = Math.max(0, s.cd[k] - 1); });
  if (C.cd[f]) s.cd[f] = C.cd[f];
  var coach = lv(api, 'coach'), anal = lv(api, 'anal'), psi = lv(api, 'psi'), smm = lv(api, 'smm');
  /* 1) foco */
  if (f === 'treino') { s.forma = [formaOf(api, 2.5), 3]; dM -= psi ? 1 : 2; }
  else if (f === 'conteudo') { segmul = 3; dM -= 1; }
  else if (f === 'descanso') dM += 10 + 3 * psi;
  else if (f === 'scrims') { s.scrim = 3 + anal; spend = focusCost(api, f); dM -= 0.5; }
  else if (f === 'imprensa') dF += C.fame.press * (1 + star(api) / 60) * (1 + 0.5 * smm);
  else if (f === 'negociar') { if (div(api) !== 'ranq') { if (s.of.length >= 3) s.of.shift(); var o = genOffer(api); if (o) o.v = Math.floor(o.v * 1.15); } }
  else if (f === 'bootcamp') { s.forma = [formaOf(api, 4), 4]; dM += 8; dF += 2; spend = C.spend.bootcamp; s.bc = 1; }
  else if (f === 'bootcamp2') { s.forma = [s.forma[0], Math.max(s.forma[1], 3)]; dM += 2; s.bc = 0; }
  /* 2) partida */
  var L = window.ESPX.liga, res = L.step(function (kind, noScrim) { return strength(api, kind, noScrim); }, s.wk, s.seed);
  var win = res.win; r.win = win; r.kind = res.kind; r.title = res.title; r.done = res.done; r.res = res;
  if (win !== null) { s.scrim = 0; s.wr.push(win ? 1 : 0); if (s.wr.length > 8) s.wr.shift(); }
  if (res.split) s.con.forEach(function (c) { c.h.push(win ? 1 : 0); if (c.h.length > 8) c.h.shift(); });
  s.F += res.fame; s.pl += res.pl;
  /* 3) receitas e despesas */
  var intl = res.kind === 'msi' || res.kind === 'worlds', inc = income(api, f, intl), gross = inc.sum + res.prize;
  var travel = intl ? C.travel[res.kind] : 0, cost = costs(api) + spend + travel;
  api.earn(gross); api.pay(cost);
  r.gross = gross; r.cost = cost;
  /* 4) seguidores, fama, moral */
  var g = (s.seg * 0.02 + 20) * (1 + star(api) / 25) * (1 + 0.5 * smm) * segmul * (win ? 1.3 : 1);
  var cap = Math.min(8e6, 2000 * Math.pow(1 + Math.max(0, s.F), 1.5));
  s.seg = Math.max(50, s.seg + g * Math.max(0, 1 - s.seg / cap) - (s.seg > cap ? 0.002 * s.seg : 0));
  s.F = Math.max(0, Math.min(1000, s.F * C.fame.decay + dF * (1 - s.F / 1000) + 0.004 * star(api)));
  var tgt = 55 + 3 * lv(api, 'house') + 5 * psi, d = div(api);
  s.M += (tgt - s.M) * 0.08 + dM + (win ? (d === 'T1' ? 2 : 1.5) : (win === false ? -2.5 * (psi ? 0.5 : 1) : 0));
  s.M = Math.max(0, Math.min(100, s.M));
  if (s.forma[1] > 0) s.forma[1]--; if (s.lesao[1] > 0) s.lesao[1]--;
  s.gh.push(gross); if (s.gh.length > 4) s.gh.shift();
  if (res.year && ESPX.mercado) ESPX.mercado.yearEnd(api);
  /* 5) evento (so online) e patrocinio */
  if (!off) maybeEvent(api);
  s.evcd--;
  reviewContracts(api, evl);
  if (s.wk % C.offerEvery === 0 && (div(api) !== 'ranq' || true)) genOffer(api);
  if (!off) s.of.forEach(function (o) { o.vida--; });
  s.of = s.of.filter(function (o) { return o.vida > 0; });
  if (s.auto || off) autoAccept(api, off);
  evl.forEach(function (t) { logAdd(t); if (!off) api.toast(t, { ms: 5000 }); });
  /* 6) resgate, espelhos, resumo */
  rescue(api); mirrors(api);
  r.net = api.money() - c0; s.st.sem++;
  var dFame = s.F - F0;
  s.last = { wk: s.wk, win: win, kind: res.kind, txt: res.log || 'Sem jogo (monte o time)', net: Math.round(r.net), gross: Math.round(gross), cost: Math.round(cost), dF: Math.round(dFame * 10) / 10, f: f };
  if (win !== null) { s.lw = win ? 'W' : 'L'; s.lwT = 2.6; } else { s.lw = null; s.lwT = 0; }
  if (f === 'bootcamp2') s.foco = 'conteudo';
  if (s.wk >= 100) api.unlock('sem100'); if (s.F >= 100) api.unlock('fama100');
  if (res.title === 'worlds' || res.title === 'msi') api.invalidate();
  return r;
}
function advance(api) { closeWeek(api, false); beginWeek(api); }

/* ---------- offline ---------- */
function away(api, sec) {
  if (!s || !api.shared.region) return null;
  var secs = Math.min(sec, C.away.max), n = Math.floor(secs * C.away.eff / WK);
  if (n < 1) return null;
  var m0 = api.money(), t = { n: 0, w: 0, l: 0, tro: 0 }, recess = false, i;
  for (i = 0; i < n; i++) {
    var d = div(api);
    if (d !== 'ranq' && api.money() < 2 * costs(api)) { recess = true; break; }
    if (d === 'ranq' && api.owned('tit') < 5 && api.money() < 1) break;
    beginWeek(api, true);
    var r = closeWeek(api, true); t.n++;
    if (r.win === true) t.w++; else if (r.win === false) t.l++;
    if (r.title) t.tro++;
  }
  beginWeek(api, false);
  var lines = ['O Piloto automático tocou ' + t.n + ' semanas: ' + t.w + ' vitórias, ' + t.l + ' derrotas, ' + t.tro + ' troféus. Caixa: ' + (api.money() - m0 >= 0 ? '+' : '') + fm(api.money() - m0) + '.'];
  if (recess) lines.push('O time entrou em recesso: o caixa estava baixo e a comissão preferiu não arriscar. Volte e ajuste as contas.');
  api.invalidate(); return { lines: lines, t: t, recess: recess };
}

/* ---------- prestigio ---------- */
function prestInfo(api) {
  var legacy = +api.shared.legacy || 0, target = Math.floor(s.pl / 10), gain = Math.max(0, target - Math.max(0, api.stars() - legacy));
  var L = lg(), champ = L && L.ti.wd > 0;
  return { gain: gain, can: gain >= 1, why: gain >= 1 ? '' : 'Precisa de 10 Pontos de Lenda (você tem ' + Math.floor(s.pl) + ') ou um título mundial' };
}
function doPrestige(api) { /* o motor ja somou as estrelas, zerou itens e dinheiro */
  var cash = C.cash0 * (1 + api.stars());
  api.earn(cash - api.money(), false);
  s.F *= 0.25; s.seg = Math.max(C.seg0, s.seg * 0.25); s.M = C.moral0; s.forma = [0, 0]; s.scrim = 0; s.lesao = [0, 0];
  s.cd = { imprensa: 0, negociar: 0, bootcamp: 0 }; s.con = []; s.of = []; s.gh = []; s.ev = null; s.evcd = 0; s.bc = 0; s.wr = [];
  s.foco = 'conteudo'; s.prox = 'conteudo'; s.wp = 0; s.last = null; s.lw = null; s.lwT = 0; evSig = ofSig = '';
  logAdd('Nova temporada! Caixa inicial ' + fm(cash) + '.'); mirrors(api);
}

/* ---------- hooks do motor ---------- */
function hud(api) {
  var h = window.ESPX.liga ? ESPX.liga.hud(api) : {}, sd = saldo(api);
  h = h || {};
  h.bal = fm(api.money()); h.ps = (sd >= 0 ? '+' : '-') + fm(Math.abs(sd)) + '/sem'; h.tone = sd >= 0 ? 'ok' : 'bad'; h.rate = sd / WK; h.nav = 'Sem ' + s.wk;
  return h;
}
function sceneHook(x, api) {
  if (!s) return;
  x.focus = s.foco === 'bootcamp2' ? 'bootcamp' : s.foco; x.mood = s.M; x.wp = Math.max(0, Math.min(1, s.wp / WK));
  x.last = s.lwT > 0 ? s.lw : null; x.alert = alertLv(api); x.net = s.lwT > 0 && s.last ? s.last.net : undefined;
}
function goalRw(api) { return C.goalMul * avgGross(api); }
function itemGate(id, api) { if (id === 'arena' && div(api) !== 'T1') return 'Só na liga principal'; }
function confirmBuy(id, cost, api) {
  var it = G.items[G.idx[id]], dSal = (it.sal || 0) + (it.up ? C.upkeep * cost : 0);
  if (!dSal) return null; return confirmText(api, cost, dSal);
}

/* ---------- interface ---------- */
function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function mount(root, api) {
  apiR = api; root.classList.add('wk');
  root.innerHTML = '<div class="wk-top">' +
    '<div class="wk-alert" id="wkAl" role="status" hidden><span id="wkAlT"></span><button type="button" class="btn" data-act="fin">Ver finanças</button></div>' +
    '<div class="wk-week"><div class="wk-wt"><b id="wkWk"></b><span id="wkSec"></span></div>' +
    '<div class="wk-pb" id="wkPbx" role="progressbar" aria-label="Progresso da semana" aria-valuemin="0" aria-valuemax="40"><i id="wkPb"></i></div><p class="wk-sum" id="wkSum"></p></div>' +
    '<div class="wk-chips">' + ['cash', 'fame', 'seg', 'mor'].map(function (k) { return '<div class="wk-chip" data-k="' + k + '"><small></small><b></b><span></span><i><u></u></i></div>'; }).join('') + '</div></div>' +
    '<div class="wk-cards" id="wkCards" aria-live="polite"></div>' +
    '<section class="wk-focus" aria-labelledby="wkFh"><h3 id="wkFh">Foco da semana</h3><div class="wk-grid" id="wkGrid"></div></section>';
  var q = function (id) { return root.querySelector('#' + id); };
  UI = { root: root, al: q('wkAl'), alT: q('wkAlT'), wk: q('wkWk'), sec: q('wkSec'), pb: q('wkPb'), pbx: q('wkPbx'), sum: q('wkSum'), cards: q('wkCards'), grid: q('wkGrid'),
    chips: {}, fb: {} };
  Array.prototype.forEach.call(root.querySelectorAll('.wk-chip'), function (c) { UI.chips[c.dataset.k] = { el: c, l: c.children[0], v: c.children[1], s: c.children[2], bar: c.children[3].firstChild }; });
  FOC.forEach(function (f) {
    var b = el('button', 'wk-f'); b.type = 'button'; b.dataset.act = 'focus'; b.dataset.f = f.id; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span class="wk-fi" aria-hidden="true">' + f.ic + '</span><span class="wk-ft"><b>' + f.n + '</b><small></small><em></em></span>';
    UI.grid.appendChild(b); UI.fb[f.id] = { b: b, d: b.querySelector('small'), c: b.querySelector('em') };
  });
  var ab = el('button', 'wk-f wk-auto'); ab.type = 'button'; ab.dataset.act = 'auto'; ab.setAttribute('role', 'switch'); ab.setAttribute('aria-checked', 'false');
  ab.innerHTML = '<span class="wk-fi" aria-hidden="true">🤖</span><span class="wk-ft"><b>Piloto automático</b><small>O jogo escolhe o foco e aceita ofertas seguras.</small><em></em></span>';
  UI.grid.appendChild(ab); UI.auto = { b: ab, c: ab.querySelector('em') };
  root.addEventListener('click', function (e) { onClick(e, api); });
  /* dialogo de troca de contrato */
  var dlg = el('dialog', 'dlg'); dlg.setAttribute('aria-labelledby', 'wkSwT');
  dlg.innerHTML = '<h2 id="wkSwT">Rescindir qual contrato?</h2><p id="wkSwP"></p><div class="regs" id="wkSwL"></div><div class="acts"><button type="button" class="btn" id="wkSwX">Cancelar</button></div>';
  document.body.appendChild(dlg); UI.sw = dlg; UI.swL = dlg.querySelector('#wkSwL'); UI.swP = dlg.querySelector('#wkSwP');
  dlg.querySelector('#wkSwX').addEventListener('click', function () { api.closeDialog(dlg); });
  UI.swL.addEventListener('click', function (e) {
    var b = e.target.closest ? e.target.closest('button[data-ci]') : null; if (!b) return;
    var r = acceptOffer(api, +dlg.dataset.oi, +b.dataset.ci); api.closeDialog(dlg); if (!r.ok) api.toast(r.why || 'Não deu');
  });
}
function openSwap(api, oi) {
  var o = s.of[oi]; if (!o || !UI) return;
  UI.sw.dataset.oi = oi; UI.swP.textContent = 'Todas as vagas estão ocupadas. Rescindir um contrato custa 2x o valor semanal dele de multa. ' + brand(o.t) + ' paga luvas de ' + fm(2 * o.v) + '.';
  UI.swL.textContent = '';
  s.con.forEach(function (c, i) {
    var b = el('button', 'btn'); b.type = 'button'; b.dataset.ci = i;
    b.textContent = brand(c.t) + ' · ' + fm(c.v) + '/sem · multa ' + fm(2 * c.v0); UI.swL.appendChild(b);
  });
  apiR.openDialog(UI.sw);
}
function metaWarn(o) { /* "Meta 60% - seu time vence ~48%. Risco de multa." */
  if (!o.meta) return ''; var wr = expWR(apiR);
  return 'Meta: vencer ' + Math.round(o.meta * 100) + '% dos jogos (você vence ~' + Math.round(wr * 100) + '%).' + (wr < o.meta ? ' Risco de multa.' : '');
}
function onClick(e, api) {
  var b = e.target.closest ? e.target.closest('[data-act]') : null; if (!b) return;
  var act = b.dataset.act;
  if (act === 'focus') {
    var r = setFocus(api, b.dataset.f);
    if (!r.ok) { api.toast(r.why); api.sfx('no'); } else { api.sfx('tap'); api.buzz(6); }
  } else if (act === 'auto') { s.auto = s.auto ? 0 : 1; if (s.auto && !s.ev && focusAvail(api, s.foco).ok === false) beginWeek(api); api.toast(s.auto ? 'Piloto automático ligado: o foco muda sozinho.' : 'Piloto automático desligado: o foco se repete.'); api.sfx('tap'); }
  else if (act === 'ev') { chooseEvent(api, +b.dataset.i); }
  else if (act === 'acc') { var oi = +b.dataset.i, o = s.of[oi]; if (!o) return; var rr = acceptOffer(api, oi, null); if (rr.need === 'swap') openSwap(api, oi); else if (!rr.ok) api.toast(rr.why); }
  else if (act === 'ref') { refuseOffer(api, +b.dataset.i); }
  else if (act === 'fin') { api.select('negocios'); }
  api.invalidate(); render(api);
}
function cardsSig() { return (s.ev ? s.ev.id + ':' + s.ev.U : '') + '|' + (s.of[0] ? [s.of[0].t, s.of[0].v, s.of.length, s.con.length, Math.floor(s.F / 10)].join() : ''); }
function renderCards(api) {
  var sig = cardsSig() + '|' + Math.round(expWR(api) * 100) + '|' + slots(s.F); if (sig === evSig) return; evSig = sig;
  var h = '';
  if (s.ev) {
    var e = EVS[EVIDX[s.ev.id]];
    h += '<article class="wk-card wk-ev" aria-labelledby="wkEvT"><h3 id="wkEvT"><span aria-hidden="true">' + e.ic + '</span> ' + esc(e.n) + '</h3><p>' + esc(e.t) + '</p><div class="wk-opts">';
    e.o.forEach(function (o, i) { h += '<button type="button" class="wk-opt' + (i ? '' : ' safe') + '" data-act="ev" data-i="' + i + '"><b>' + esc(o.t) + '</b><small>' + esc(typeof o.d === 'function' ? o.d(s.ev.U) : o.d) + '</small></button>'; });
    h += '</div><p class="wk-pause">A semana está pausada até você decidir.</p></article>';
  }
  if (s.of.length) {
    var of = s.of[0], full = s.con.length >= slots(s.F), mw = metaWarn(of);
    h += '<article class="wk-card wk-off" aria-labelledby="wkOfT"><h3 id="wkOfT"><span aria-hidden="true">🤝</span> ' + esc(brand(of.t)) + ' quer patrocinar</h3>' +
      '<p><b>' + fm(of.v) + '/sem</b> · ' + of.prazo + ' semanas · luvas de ' + fm(2 * of.v) + (mw ? '<br><small>' + esc(mw) + '</small>' : '') + '</p>' +
      '<div class="wk-opts"><button type="button" class="wk-opt safe" data-act="acc" data-i="0"><b>' + (full ? 'Trocar contrato' : 'Aceitar') + '</b><small>' + (full ? 'Sem vaga: escolher qual rescindir' : '+' + fm(2 * of.v) + ' agora') + '</small></button>' +
      '<button type="button" class="wk-opt" data-act="ref" data-i="0"><b>Recusar</b><small>A oferta some</small></button></div>' +
      (s.of.length > 1 ? '<button type="button" class="wk-more" data-act="fin">Mais ' + (s.of.length - 1) + (s.of.length > 2 ? ' ofertas' : ' oferta') + ' em Negócios</button>' : '') + '</article>';
  }
  UI.cards.innerHTML = h;
}
function renderTop(api) {
  var U_ = api.ui, f = FOC[E.FIDX[s.foco === 'bootcamp2' ? 'bootcamp' : s.foco]], sd = saldo(api), al = alertLv(api), pc = Math.floor(Math.max(0, runway(api)));
  U_.text(UI.wk, 'Semana ' + (s.wk + 1) + ' · ' + (s.foco === 'bootcamp2' ? 'Bootcamp (2/2)' : f.n));
  U_.text(UI.sec, s.ev ? 'pausada' : Math.max(0, Math.ceil(WK - s.wp)) + ' s');
  U_.bar(UI.pb, s.wp / WK); U_.attr(UI.pbx, 'aria-valuenow', String(Math.round(s.wp)));
  var l = s.last;
  U_.text(UI.sum, l ? 'Sem ' + l.wk + ': ' + l.txt + ' · ' + (l.net >= 0 ? '+' : '') + fm(l.net) + (l.dF ? ' · Fama ' + (l.dF > 0 ? '+' : '') + pct1(l.dF) : '') : 'Primeira semana: escolha um foco e acompanhe o caixa.');
  var c = UI.chips;
  U_.text(c.cash.l, 'Caixa'); U_.text(c.cash.v, fm(api.money())); U_.text(c.cash.s, (sd >= 0 ? '+' : '-') + fm(Math.abs(sd)).replace('R$ ', '') + '/sem'); U_.data(c.cash.el, 'tone', sd >= 0 ? 'ok' : 'bad');
  U_.text(c.fame.l, 'Fama'); U_.text(c.fame.v, String(Math.floor(s.F))); U_.text(c.fame.s, fameName(s.F));
  U_.text(c.seg.l, 'Seguidores'); U_.text(c.seg.v, api.fmt(s.seg)); U_.text(c.seg.s, '+' + fm(income(api, s.foco, false).social).replace('R$ ', '') + '/sem');
  U_.text(c.mor.l, 'Moral'); U_.text(c.mor.v, String(Math.round(s.M))); U_.text(c.mor.s, s.M < 40 ? 'Baixa' : s.M > 80 ? 'Ótima' : 'Boa');
  U_.bar(c.mor.bar, s.M / 100); U_.data(c.mor.el, 'tone', s.M < 40 ? 'bad' : s.M < 60 ? 'warn' : 'ok');
  UI.al.hidden = al === 0; U_.data(UI.al, 'lv', String(al));
  if (al) U_.text(UI.alT, al === 2 || pc < 2 ? 'Caixa para 1 semana! A diretoria vai intervir.' : 'Caixa para ' + pc + ' semanas. Troque para Conteúdo ou venda um jogador.');
  if (al === 2 && lastAlert !== 2) api.buzz(40); lastAlert = al;
}
function focusDesc(api, id) {
  var coach = lv(api, 'coach'), anal = lv(api, 'anal'), psi = lv(api, 'psi'), smm = lv(api, 'smm');
  switch (id) {
    case 'treino': return 'Força +' + pct1(formaOf(api, 2.5)) + ' por 3 sem. Moral -' + (psi ? 1 : 2) + '.';
    case 'conteudo': return 'Seguidores x3, publi x1,5. Moral -1.';
    case 'descanso': return 'Moral +' + (10 + 3 * psi) + '. O time agradece.';
    case 'scrims': return 'Próximo jogo +' + (3 + anal) + ' de força.';
    case 'imprensa': return 'Fama +' + pct1(C.fame.press * (1 + star(api) / 60) * (1 + 0.5 * smm)) + '. Fale bonito.';
    case 'negociar': return 'Chega uma oferta de patrocínio (+15%).';
    default: return 'Força +' + pct1(formaOf(api, 4)) + ' por 4 sem. Ocupa 2 semanas.';
  }
}
function renderFocus(api) {
  var U_ = api.ui, cur = s.foco === 'bootcamp2' ? 'bootcamp' : s.foco;
  FOC.forEach(function (f) {
    var ui = UI.fb[f.id], a = focusAvail(api, f.id), on = f.id === cur, cost = focusCost(api, f.id);
    U_.attr(ui.b, 'aria-pressed', String(on)); U_.data(ui.b, 'st', on ? 'on' : a.ok ? 'ok' : 'off');
    U_.attr(ui.b, 'aria-disabled', a.ok || on ? 'false' : 'true');
    U_.text(ui.d, focusDesc(api, f.id));
    U_.text(ui.c, on ? (s.foco === 'bootcamp2' ? '2/2' : 'Agora') : !a.ok ? a.why : cost ? fm(cost) : '');
    U_.attr(ui.b, 'aria-label', f.n + '. ' + focusDesc(api, f.id) + (on ? ' Foco atual.' : !a.ok ? ' Indisponível: ' + a.why : cost ? ' Custa ' + fm(cost) + '.' : ''));
  });
  U_.attr(UI.auto.b, 'aria-checked', String(!!s.auto)); U_.data(UI.auto.b, 'st', s.auto ? 'on' : 'ok'); U_.text(UI.auto.c, s.auto ? 'Ligado' : 'Desligado');
}
function render(api) {
  if (!UI || !s) return;
  renderTop(api); renderCards(api); renderFocus(api);
}

/* ---------- registro ---------- */
Engine.registerTab('esp', {
  id: 'semana', label: 'Time', icon: '🎮', home: true,
  ach: [
    { id: 'sem100', ic: '📅', n: 'Cem semanas de gestão', d: 'Passe 100 semanas no comando do time.' },
    { id: 'fama100', ic: '🔥', n: 'Fama 100', d: 'Chegue a 100 de Fama.' },
    { id: 'crise', ic: '🧯', n: 'Gestão de crise', d: 'Resolva 10 eventos da semana.' },
    { id: 'vendeu', ic: '💸', n: 'Vendeu o craque', d: 'A diretoria teve que vender um jogador para fechar as contas.' },
    { id: 'sonho', ic: '🌠', n: 'Contrato dos sonhos', d: 'Feche contrato com a Aurora Global.' }
  ],
  mount: mount,
  load: function (d, api) {
    apiR = api; s = fresh();
    if (d && typeof d === 'object' && d.v === 1) {
      var f = fresh();
      s.seed = (+d.seed >>> 0) || f.seed; s.rc = nz(d.rc, 0, 0, 1e9); s.wk = Math.floor(nz(d.wk, 0, 0, 1e7)); s.wp = nz(d.wp, 0, 0, WK - 0.01);
      var ok = function (x) { return x === 'bootcamp2' || E.FIDX[x] !== undefined; };
      s.foco = ok(d.foco) ? d.foco : 'conteudo'; s.prox = E.FIDX[d.prox] !== undefined ? d.prox : s.foco; s.auto = d.auto ? 1 : 0; s.bc = d.bc ? 1 : 0;
      s.F = nz(d.F, 0, 0, 1000); s.seg = nz(d.seg, C.seg0, 50, 1e8); s.M = nz(d.M, C.moral0, 0, 100);
      var pair = function (a) { return Array.isArray(a) ? [nz(a[0], 0, 0, 50), Math.floor(nz(a[1], 0, 0, 20))] : [0, 0]; };
      s.forma = pair(d.forma); s.lesao = pair(d.lesao); s.scrim = nz(d.scrim, 0, 0, 20);
      ['imprensa', 'negociar', 'bootcamp'].forEach(function (k) { s.cd[k] = Math.floor(nz(d.cd && d.cd[k], 0, 0, 20)); });
      s.con = (Array.isArray(d.con) ? d.con : []).slice(0, 3).map(function (c) {
        var t = Math.floor(nz(c && c.t, 0, 0, 6)); if (!t) return null;
        return { t: t, v: nz(c.v, 0, 0, 1e9), v0: nz(c.v0, 0, 0, 1e9), rest: Math.floor(nz(c.rest, 1, 0, 200)), rev: Math.floor(nz(c.rev, C.review, 0, 20)), st: Math.floor(nz(c.st, 0, 0, 5)),
          h: (Array.isArray(c.h) ? c.h : []).slice(-8).map(function (x) { return x ? 1 : 0; }) };
      }).filter(Boolean);
      s.of = (Array.isArray(d.of) ? d.of : []).slice(0, 3).map(function (o) {
        var t = Math.floor(nz(o && o.t, 0, 0, 6)); if (!t) return null;
        return { t: t, v: nz(o.v, 0, 0, 1e9), prazo: Math.floor(nz(o.prazo, 12, 1, 100)), meta: nz(o.meta, 0, 0, 1), vida: Math.floor(nz(o.vida, 1, 1, 10)) };
      }).filter(Boolean);
      s.gh = (Array.isArray(d.gh) ? d.gh : []).slice(-4).map(function (x) { return nz(x, 0, 0, 1e12); });
      s.evcd = Math.floor(nz(d.evcd, 0, 0, 20)); s.ev = d.ev && d.ev.id && EVIDX[d.ev.id] !== undefined ? { id: d.ev.id, U: nz(d.ev.U, 1500, 1500, 1e12) } : null;
      s.pl = nz(d.pl, 0, 0, 1e6); s.ren = d.ren === 0 ? 0 : 1; s.log = (Array.isArray(d.log) ? d.log : []).slice(0, 6).map(String);
      s.wr = (Array.isArray(d.wr) ? d.wr : []).slice(-8).map(function (x) { return x ? 1 : 0; });
      if (d.last && typeof d.last === 'object') s.last = { wk: Math.floor(nz(d.last.wk, 0)), win: d.last.win === true ? true : d.last.win === false ? false : null, kind: String(d.last.kind || '').slice(0, 10), txt: String(d.last.txt || '').slice(0, 80), net: ns(d.last.net, 0), gross: nz(d.last.gross, 0), cost: nz(d.last.cost, 0), dF: ns(d.last.dF, 0), f: String(d.last.f || '') };
      ['resg', 'ev', 'venda', 'sem'].forEach(function (k) { s.st[k] = Math.floor(nz(d.st && d.st[k], 0, 0, 1e7)); });
    }
    evSig = ''; ofSig = '';
    mirrors(api);
  },
  save: function () { return s; },
  update: function (dt, api) {
    if (!s) return;
    if (s.lwT > 0) s.lwT = Math.max(0, s.lwT - dt);
    if (!api.shared.region) return; /* o relogio so comeca depois de escolher a regiao */
    if (s.ev) return; /* a barra pausa enquanto o evento espera a escolha */
    s.wp += dt;
    var guard = 0;
    while (s.wp >= WK && guard++ < 3 && !s.ev) { s.wp -= WK; advance(api); }
    if (s.wp >= WK) s.wp = WK - 0.01;
  },
  render: render,
  hud: hud, scene: sceneHook, goalRw: goalRw, gate: itemGate,
  confirmBuy: function (id, cost, api) { return confirmBuy(id, cost, api); },
  bought: function (id, n, api) { if (id === 'tit' || id === 'res') { api.invalidate(); } },
  away: function (sec, api) { return away(api, sec); },
  prestigeInfo: function (api) { return prestInfo(api); },
  onPrestige: function (api) { doPrestige(api); }
});

/* API para as outras abas, testes e simulacao */
window.ESPX.semana = {
  state: function () { return s; }, strength: strength, setFocus: function (id) { return setFocus(apiR, id); }, focusAvail: function (id) { return focusAvail(apiR, id); },
  pickAuto: function () { return pickAuto(apiR); }, closeWeek: function (off) { return closeWeek(apiR, !!off); }, advance: function () { advance(apiR); },
  econ: function (focus) { var i = income(apiR, focus || s.foco, false), c = costsParts(apiR); return { inc: i, costs: c, costsTotal: c.sal + c.staff + c.upkeep, saldo: saldo(apiR), gross: avgGross(apiR), U: U(), runway: runway(apiR), expWR: expWR(apiR) }; },
  accept: function (i, sw) { return acceptOffer(apiR, i, sw); }, refuse: function (i) { return refuseOffer(apiR, i); }, openSwap: function (i) { openSwap(apiR, i); },
  choose: function (i) { return chooseEvent(apiR, i); }, events: EVS, forceEvent: function (id) { s.ev = { id: id, U: Math.round(U()) }; evSig = ''; },
  autoAccept: function () { autoAccept(apiR); }, away: function (sec) { return away(apiR, sec); }, rescue: function () { return rescue(apiR); },
  bump: function (o) { if (o.M) s.M = Math.max(0, Math.min(100, s.M + o.M)); if (o.F) s.F = Math.max(0, Math.min(1000, s.F + o.F)); },
  confirmText: function (dCost, dSal) { return confirmText(apiR, dCost, dSal); }, alertLv: function () { return alertLv(apiR); },
  genOffer: function (o) { return genOffer(apiR, o); }, slots: function () { return slots(s.F); }, brand: brand, metaWarn: metaWarn, fameName: fameName,
  prestInfo: function () { return prestInfo(apiR); }, mirrors: function () { mirrors(apiR); }, U: U, costs: function () { return costs(apiR); }
};
window.SEMANA = window.ESPX.semana;
})();
