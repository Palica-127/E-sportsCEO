/* Time de eSports: numeros e funcoes PURAS da nova economia (docs/ESPORTS_ECONOMIA.md). Sem DOM; roda em Node.
   Carregado antes do engine e das abas: window.ECO. */
(function (root) {
'use strict';
var C = {
  cash0: 3000, seg0: 120, moral0: 60, WK: 40,
  away: { eff: 0.9, max: 14400 },
  cd: { imprensa: 2, negociar: 3, bootcamp: 8 },
  gen: { nota: 58, kT: 2, kH: 1, sal: 150, resSal: 80, empty: 40 },
  upkeep: 0.004, staffS: 1.5,
  uw: { treino: 1, house: 0.8, equip: 0.8 },
  staffSal: { coach: 2500, anal: 4000, psi: 4500, smm: 2000 },
  tv: { ranq: 900, T2: 1500, T1: 9000 }, tvIntl: 30000,
  travel: { msi: 12000, worlds: 30000 },
  loja: 5, lojaExp: 1.2, arenaRev: [0, 6000, 18000, 60000, 180000], pub: 0.30,
  star: { starMin: 80 },
  price: { P0: 70000, kp: 0.30, S0: 700, ks: 0.20, agio: 1.5, impSal: 1.25, refund: 0.6, sold: 0.7 },
  reg: { BR: ['CBLOL', 0.85, 1.0], NA: ['LCS', 1.0, 1.1], EU: ['LEC', 1.0, 1.1], KR: ['LCK', 1.2, 1.2], CN: ['LPL', 1.15, 1.2], AP: ['LCP', 0.85, 1.0] },
  lg: { D: 16, t2games: 8, t1games: 9, promoW: 5, qualW: 6, promoS: 68, promoOpp: 66, pity: 1.0, pityMax: 6,
    t2opp: [47, 50, 53, 55, 57, 60, 63, 59], t1opp: [60, 64, 68, 71, 74, 77, 80, 83, 86],
    msi: [{ bo: 3, s: 88, n: 'Quartas' }, { bo: 5, s: 95, n: 'Semifinal' }, { bo: 5, s: 102, n: 'Final' }],
    worlds: [{ bo: 3, s: 98, n: 'Oitavas' }, { bo: 5, s: 105, n: 'Quartas' }, { bo: 5, s: 112, n: 'Semifinal' }, { bo: 5, s: 118, n: 'Final' }] },
  prize: { t2win: 1500, t2bonus: 6000, promo: 30000, t1win: 4000, t1bonus: 15000, msiPart: 40000, msiRound: 25000, msiWin: 200000, wdPart: 100000, wdRound: 50000, wdWin: 1200000 },
  fame: { t2win: 0.5, t1win: 1.0, t1loss: -0.2, msiRound: 3, wdRound: 5, promo: 20, msiPart: 8, wdPart: 15, msiWin: 50, wdWin: 120, press: 2.5, decay: 0.997 },
  tiers: [ /* [marca, fama minima, R$/sem, prazo (sem), meta de vitorias, so T1] */
    ['Padaria do Zé', 0, 700, 12, 0, false], ['Posto Tanque Cheio', 15, 1800, 16, 0.40, false],
    ['Energético Raio Verde', 60, 4500, 20, 0.50, false], ['Banco Faísca', 150, 11000, 24, 0.50, true],
    ['Periféricos Nexa', 320, 26000, 26, 0.60, true], ['Aurora Global', 550, 60000, 40, 0.65, true]],
  slotsF: [0, 60, 320], offerEvery: 4, offerLife: 4, review: 8,
  focusFloor: { bootcampCash: 30000 },
  spend: { scrimT2: 600, scrimT1: 1800, bootcamp: 25000 },
  evChance: 0.25, evGap: 4
};
/* hash de 32 bits: mesma entrada = mesmo resultado (recarregar nao rerrola) */
function mix(a, b, c) {
  var x = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2246822519) + 0x9E3779B9) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
function winP(S, opp, D) { return 1 / (1 + Math.pow(10, (opp - S) / (D || C.lg.D))); }
function r2(n) { if (!(n >= 1)) return 1; var e = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1)); return Math.max(1, Math.round(n / e) * e); }
function ageP(a) { return a <= 21 ? 1.3 : a <= 24 ? 1.1 : a <= 27 ? 1.0 : a <= 29 ? 0.8 : 0.65; }
function ageS(a) { return a <= 21 ? 0.8 : a <= 27 ? 1.0 : 1.1; }
function league(reg) { return (C.reg[reg] || C.reg.BR)[0]; }
function regSal(reg) { return (C.reg[reg] || C.reg.BR)[1]; }
function regOffer(reg) { return (C.reg[reg] || C.reg.BR)[2]; }
function isImp(p, reg) { return p.l !== league(reg); }
function price(p, reg, nota, idade) {
  var o = nota == null ? p.o : nota, a = idade == null ? p.a : idade;
  return r2(C.price.P0 * Math.exp(C.price.kp * (o - 74)) * ageP(a) * regSal(reg) * (isImp(p, reg) ? C.price.agio : 1));
}
function salary(p, reg, nota, idade) {
  var o = nota == null ? p.o : nota, a = idade == null ? p.a : idade;
  return r2(C.price.S0 * Math.exp(C.price.ks * (o - 74)) * ageS(a) * regSal(reg) * (isImp(p, reg) ? C.price.impSal : 1));
}
function fmtM(n) {
  if (!isFinite(n)) return 'R$ 0';
  var neg = n < 0; n = Math.abs(n); var s;
  if (n < 1000) s = String(Math.floor(n));
  else { var S = ['mil', 'mi', 'bi', 'tri'], i = -1; while (n >= 1000 && i < S.length - 1) { n /= 1000; i++; } s = (n < 100 ? Math.floor(n * 10) / 10 : Math.floor(n)).toString().replace('.', ',') + ' ' + S[i]; }
  return (neg ? '-' : '') + 'R$ ' + s;
}
var FOCOS = [
  { id: 'treino', ic: '🏋️', n: 'Treino pesado', d: 'Time afiado. +força por 3 semanas.' },
  { id: 'conteudo', ic: '🎥', n: 'Conteúdo e lives', d: 'Seguidores x3 e mais publi.' },
  { id: 'descanso', ic: '😴', n: 'Descanso', d: 'Moral +10. O time agradece.' },
  { id: 'scrims', ic: '🎯', n: 'Scrims', d: 'Próximo jogo +3 de força.' },
  { id: 'imprensa', ic: '🎤', n: 'Imprensa', d: 'Fama +2,5. Fale bonito.' },
  { id: 'negociar', ic: '🤝', n: 'Negociar', d: 'Chega uma oferta de patrocínio (+15%).' },
  { id: 'bootcamp', ic: '🏕️', n: 'Bootcamp', d: 'Força +4 por 4 semanas. Ocupa 2 semanas.' }
];
var FIDX = {}; FOCOS.forEach(function (f, i) { FIDX[f.id] = i; });
root.ECO = { C: C, mix: mix, winP: winP, r2: r2, ageP: ageP, ageS: ageS, league: league, regSal: regSal, regOffer: regOffer, isImp: isImp, price: price, salary: salary, fmtM: fmtM, FOCOS: FOCOS, FIDX: FIDX };
if (typeof module !== 'undefined' && module.exports) module.exports = root.ECO;
})(typeof window !== 'undefined' ? window : globalThis);
