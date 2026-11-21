// Testes do registro histórico (2027+): node tests/hist.js
global.window = global; ['lol', 'outros', 'hist', 'hist_val', 'hist_ff', 'hist_dota', 'hist_r6', 'hist_fifa', 'hist_wr'].forEach(f => require('../js/data/' + f + '.js')); require('../js/core.js');
const store = {}; global.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
let falhas = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) falhas++; };
const O = Org, ANOS = 9;
function novo(seed) { O.set(O.novoJogo()); O.iniciar({ game: 'lol', nome: 'Pantera Teste' }); const S = O.get(); S.setup = null; S.seed = seed; S.org.caixa = 9e7;
  const b = O.livres('lol').sort((a, b) => a.o - b.o); for (const r of O.GAMES.lol.roles) O.contratar('lol', 't1', b.find(x => x.r === r)); return S; }
function gerir(sem) { // "jogador" que renova contratos e repõe titulares a cada 13 semanas, como faria um usuário atento
  for (let i = 0; i < sem; i += 13) { O.avancar(Math.min(13, sem - i)); const S = O.get(); S.org.caixa = Math.max(S.org.caixa, 9e7);
    const q = S.games.lol.squads.t1; q.slots.forEach((p, k) => { if (p && p.ct < 30) O.renovar('lol', 't1', k); });
    const b = O.livres('lol').sort((a, b) => a.o - b.o); O.GAMES.lol.roles.forEach((r, k) => { if (!q.slots[k]) { const p = b.find(x => x.r === r); if (p) O.contratar('lol', 't1', p); } }); }
}
let S = novo(2027); const t0 = Date.now(); gerir(52 * ANOS); S = O.get();
console.log('(' + ANOS + ' anos simulados em ' + (Date.now() - t0) + ' ms)');
const jogos = Object.keys(O.GAMES), anosSim = []; for (let y = 2027; y < 2026 + ANOS; y++) anosSim.push(y);
ok(S.org.ano === 2026 + ANOS, 'avançou ' + ANOS + ' anos (' + S.org.ano + ')');
ok(!S.reg.lol || !S.reg.lol[2026], 'nada é gravado em 2026 (história real vai até 2026)');
// 1) internacionais gravados todo ano em todos os jogos (LoL jogado; os outros 7 nunca abertos)
for (const g of jogos) {
  const ks = Object.keys(O.intlDef(g)); let faltas = [];
  for (const y of anosSim) for (const t of ks) { const r = ((S.reg[g] || {})[y] || []).find(x => x.k === 'i' && x.t === t); if (!r || !r.c || !r.v || r.c === r.v) faltas.push(y + t); }
  ok(!faltas.length, g + ': ' + ks.join('+') + ' registrados em todos os anos 2027+' + (faltas.length ? ' (faltam ' + faltas.join(',') + ')' : ''));
}
ok(['MSI', 'WORLDS'].every(t => anosSim.every(y => S.reg.lol[y].filter(x => x.k === 'i' && x.t === t).length === 1)), 'LoL: exatamente 1 MSI e 1 Mundial por ano (sem duplicata)');
ok(S.reg.lol[2028].find(x => x.t === 'WORLDS').s.length === 2 && S.reg.lol[2028].find(x => x.t === 'WORLDS').m, 'Mundial tem 2 semifinalistas e MVP');
ok(/^\d-\d$/.test(S.reg.lol[2028].find(x => x.t === 'WORLDS').p), 'Mundial guarda o placar da final (' + S.reg.lol[2028].find(x => x.t === 'WORLDS').p + ')');
// 2) ligas regionais: LoL (6 regiões, jogador na sua) e jogo não aberto (todas as regiões)
const regs = y => S.reg.lol[y].filter(x => x.k === 'r' && !x.q);
ok(anosSim.every(y => new Set(regs(y).map(x => x.t)).size >= 5), 'LoL: campeões regionais de 5+ ligas por ano');
ok(regs(2028).some(x => x.t === O.regiaoDe('lol')), 'liga do usuário também é registrada');
ok(S.reg.cs2[2028].filter(x => x.k === 'r').length >= 6, 'CS2 (não aberto): 3 regiões x 2 splits registrados');
// 3) coerência com a participação do usuário
const meus = Object.entries(S.reg.lol).flatMap(([y, L]) => L.filter(x => x.eu).map(x => ({ y, ...x })));
ok(S.intlHist.filter((h, i, a) => h.g === 'lol' && h.y >= 2027 && a.findIndex(z => z.g === h.g && z.y === h.y && z.tipo === h.tipo) === i).every(h => { const r = S.reg.lol[h.y].find(x => x.k === 'i' && x.t === h.tipo); return r && r.c === h.camp && (r.eu || null) === (h.eu || null); }), 'registro bate com intlHist (campeão e participação do usuário; se o ano teve 2 do mesmo torneio vale o último)');
ok(meus.every(x => ['campeao', 'vice', 'semi', 'quartas', 'oitavas'].includes(x.eu)), 'marcação de participação válida (' + meus.length + ' participações)');
// 4) Bola de Ouro e honras
ok(anosSim.slice(0, -1).every(y => jogos.every(g => S.bo[g] && S.bo[g][y] && S.bo[g][y].t.length === 10)), 'Bola de Ouro (top 10) calculada em todo ano encerrado, todos os jogos');
ok(S.bo.lol[2027].a.length === 5 && S.bo.ff[2027].a.length === 4 && S.bo.fifa[2027].a.length === 1, 'time do ano por papel (LoL 5, FF 4, EA FC 1)');
ok(Object.keys(S.bo.lol).length === ANOS - 1, 'não há Bola de Ouro do ano em andamento');
const bo1 = S.bo.lol[2027].t; ok(bo1.every((r, i) => !i || bo1[i - 1][3] >= r[3]), 'ranking ordenado por pontos');
ok(new Set(Object.values(S.bo.lol).map(B => B.t[0][0])).size >= 2, 'a Bola de Ouro muda de mãos (por mérito, não fixa)');
ok(Object.values(S.hon.lol).some(h => (h.w || []).length) && Object.values(S.hon.lol).some(h => (h.b || []).length), 'honras acumuladas (título mundial, Bola de Ouro)');
ok(Object.keys(S.pts).length === 0, 'pontos do ano zerados após premiação');
// 5) estrutura usada pelo Hall
for (const g of jogos) {
  const h = O.histDe(g), ti = h.torneios.filter(t => t.tp !== 'REG'), H = window.HIST[g];
  ok(h.torneios.length > 0 && h.torneios.every(t => t.sim === 1 && t.n && t.a >= 2027 && t.c && t.n.includes(String(t.a))), g + ': histDe tem torneios simulados completos e nomeados com o ano (' + h.torneios.length + ')');
  if (H) ok(ti.every(t => H.tipos[t.tp]), g + ': tipos dos internacionais existem em HIST.tipos'); 
  ok(Object.keys(h.bo).length === ANOS - 1 && h.bo[2027].length === 10 && Object.keys(h.toy).length === ANOS - 1, g + ': histDe.bo e toy por ano');
}
// 6) save / load
O.save(); const antes = JSON.stringify(S.reg), antesBo = JSON.stringify(S.bo), antesH = JSON.stringify(S.hon); O.set(O.novoJogo()); ok(O.load(), 'load() devolve true');
S = O.get(); ok(JSON.stringify(S.reg) === antes && JSON.stringify(S.bo) === antesBo && JSON.stringify(S.hon) === antesH, 'registro, Bola de Ouro e honras sobrevivem a save/load');
ok(O.histDe('lol').torneios.some(t => t.tp === 'WORLDS' && t.a === 2027), 'histDe após load mantém o Mundial 2027');
const kb = (JSON.stringify(S).length / 1024).toFixed(0), kr = ((antes.length + antesBo.length + antesH.length) / 1024).toFixed(0);
ok(+kr < 400, 'tamanho do registro razoável em ' + ANOS + ' anos: ' + kr + ' KB (save inteiro ' + kb + ' KB)');
// 7) migração de save antigo
const velho = JSON.parse(JSON.stringify(S)); delete velho.reg; delete velho.hon; delete velho.bo; delete velho.pts; store['org-v1'] = JSON.stringify(velho); O.set(O.novoJogo()); ok(O.load(), 'save antigo carrega');
S = O.get(); ok(S.reg && S.hon && S.bo && S.pts && !Object.keys(S.reg).length, 'campos novos criados na migração'); gerir(52 * 2);
ok(O.get().reg.lol && O.get().reg.lol[2036] && O.get().reg.lol[2036].some(x => x.t === 'WORLDS'), 'save migrado continua registrando');
// 8) poda: ligas regionais antigas somem, internacionais ficam
S = novo(99); gerir(52 * 16); S = O.get(); const a0 = S.reg.lol[2027];
ok(a0 && a0.length && a0.every(x => x.k === 'i'), 'após 16 anos, 2027 só mantém internacionais (' + (a0 || []).length + ')');
ok(S.reg.lol[2041].some(x => x.k === 'r'), 'anos recentes mantêm ligas regionais');
// 9) determinismo
const ex = seed => { novo(seed); gerir(52 * 3); return JSON.stringify(O.get().reg) + JSON.stringify(O.get().bo); }; ok(ex(5) === ex(5), 'registro é determinístico por semente');
// 10) renomear a org não quebra títulos do usuário
console.log('FALHAS:', falhas); process.exit(falhas ? 1 : 0);
