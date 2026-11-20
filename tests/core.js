// Testes da lógica (sem navegador): node tests/core.js
global.window = global; require('../js/data/lol.js'); require('../js/data/outros.js'); require('../js/core.js');
let falhas = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) falhas++; };
const O = Org;
// jogos novos no esqueleto
ok(Object.keys(O.GAMES).length === 8, '8 jogos cadastrados');
ok(O.slotsDe('ff') === 6 && O.slotsDe('fifa') === 2 && O.slotsDe('lol') === 7 && O.slotsDe('r6') === 7 && O.slotsDe('wr') === 7, 'tamanhos de elenco por jogo (FF 4+2, EA FC 1+1, LoL 5+2)');
const S0 = O.get(); ok(S0.games.ff.squads.t1.slots.length === 6 && S0.games.fifa.squads.t1.slots.length === 2, 'slots criados conforme o jogo');
// contratar 5 titulares baratos
const baratos = O.livres('lol').sort((a, b) => a.o - b.o);
for (const r of O.GAMES.lol.roles) { const p = baratos.find(x => x.r === r); const res = O.contratar('lol', 't1', p); ok(res.ok, 'contrata ' + r + ': ' + res.msg); }
ok(O.prontos('lol', 't1'), 'titulares completos');
// determinismo: mesma semente, mesmos resultados
function rodar(seed, semanas) { O.set(O.novoJogo()); const S = O.get(); S.seed = seed; S.org.caixa = 5e6;
  const b = O.livres('lol').sort((a, b) => a.o - b.o); for (const r of O.GAMES.lol.roles) O.contratar('lol', 't1', b.find(x => x.r === r));
  O.avancar(semanas); return JSON.stringify(O.compFor('lol', 't1').hist) + O.get().org.caixa; }
ok(rodar(777, 104) === rodar(777, 104), 'simulação é determinística por semente');
// 3 anos de jogo: splits, playoffs, campeões
O.set(O.novoJogo()); let S = O.get(); S.seed = 42; S.org.caixa = 5e6;
const b2 = O.livres('lol').sort((a, b) => a.o - b.o); for (const r of O.GAMES.lol.roles) O.contratar('lol', 't1', b2.find(x => x.r === r));
O.avancar(156); const c = O.compFor('lol', 't1');
ok(c.split >= 5, 'pelo menos 5 splits em 3 anos (' + c.split + ')');
ok(c.hist.length >= 5 && c.hist.every(h => h.camp), 'campeões registrados (' + c.hist.length + ')');
const rows = O.classificacao(c); ok(rows.length === 9 && new Set(rows.map(r => r.i)).size === 9, 'tabela com 9 times (8 + a org)');
ok(c.sched.length === 9 && c.sched.every(r => r.length === 4), '9 rodadas com 4 jogos e 1 folga');
ok(Number.isFinite(S.org.caixa) && Number.isFinite(S.org.rep), 'caixa e reputação válidos');
const jogos = c.last.length; ok(jogos > 0, 'usuário tem histórico de jogos');
// sem titulares completos não entra no split
O.set(O.novoJogo()); O.avancar(10); const c2 = O.compFor('lol', 't1'); ok(c2.phase === 'wait' && c2.split === 0, 'sem titulares completos o split não começa');
// próximo jogo
O.set(O.novoJogo()); S = O.get(); S.org.caixa = 5e6; const b3 = O.livres('lol').sort((a, b) => a.o - b.o); for (const r of O.GAMES.lol.roles) O.contratar('lol', 't1', b3.find(x => x.r === r));
const n = O.avancarAteJogo(); ok(n >= 3 && n < 60 && O.compFor('lol', 't1').last.length === 1, 'avança até o primeiro jogo (' + n + ' semanas)');
// T2 e troca de região
S.org.caixa = 5e6; ok(O.ativarSquad('lol', 't2').ok, 'cria T2'); ok(!!O.compFor('lol', 't2'), 'T2 compete'); O.trocarRegiao('LCK'); ok(O.compFor('lol', 't1').teams.length === 11, 'trocar região recria competições (LCK: 10 times + org)');
// força: time mais forte vence mais
let v = 0; for (let i = 0; i < 2000; i++) { const [a, bb] = O.serie(3, 85, 75); if (a > bb) v++; } ok(v / 2000 > 0.8, 'força 85 vs 75 vence >80% das séries Bo3 (' + (v / 20).toFixed(0) + '%)');
// ---- passo 2: internacionais, pro/rel, academy
O.set(O.novoJogo()); S = O.get(); S.seed = 9; S.org.caixa = 5e7;
const b4 = O.livres('lol').sort((a, b) => a.o - b.o); for (const r of O.GAMES.lol.roles) O.contratar('lol', 't1', b4.find(x => x.r === r));
const d1antes = O.ligaSync().d1.map(t => t.n).join('|'), n1 = O.ligaSync().d1.length, n2 = O.ligaSync().d2.length;
O.avancar(26 * 3); const ih = O.get().intlHist;
ok(ih.some(x => x.tipo === 'MSI') && ih.some(x => x.tipo === 'WORLDS'), 'MSI e Mundial disputados (' + ih.map(x => x.tipo + x.y).join(',') + ')');
ok(ih.every(x => x.camp), 'campeões internacionais registrados');
ok(O.ligaSync().d1.length === n1 && O.ligaSync().d2.length === n2, 'promoção/rebaixamento mantém tamanho das divisões');
ok(O.ligaSync().d1.map(t => t.n).join('|') !== d1antes, 'T1 mudou após promoção/rebaixamento');
ok(Number.isFinite(O.get().org.caixa), 'caixa finito após internacionais');
const vagasMSI = Object.values(O.INTL.MSI.vagas).reduce((a, b) => a + b, 0), vagasW = Object.values(O.INTL.WORLDS.vagas).reduce((a, b) => a + b, 0);
ok(vagasMSI === 8 && vagasW === 16, 'vagas: 8 no MSI e 16 no Mundial');
ok(O.simRapida(O.ligaSync().d1.map(t => ({ n: t.n, f: t.b }))).length === n1, 'simRapida devolve ordem completa');
O.set(O.novoJogo()); S = O.get(); S.org.caixa = 5e7; ok(O.ativarSquad('lol', 'acad').ok, 'cria Academy'); ok(O.compFor('lol', 'acad').teams.length === 9, 'Academy com 8 times + a org');
O.trocarRegiao('LCK'); ok(!O.get().ligas.lol && O.ligaSync().reg === 'LCK', 'trocar região recria a liga');
// ---- passo 3: todos os jogos com campeonatos
for (const g of Object.keys(O.GAMES)) {
  ok(O.GAMES[g].ativo, g + ' ativo');
  O.set(O.novoJogo()); S = O.get(); S.seed = 5; S.org.caixa = 9e7;
  const roles = O.GAMES[g].roles, liv = O.livres(g).sort((a, b) => a.o - b.o);
  ok(liv.length > 100 || g === 'fifa' && liv.length > 40, g + ': mercado com jogadores (' + liv.length + ')');
  for (const r of roles) { const res = O.contratar(g, 't1', liv.find(x => x.r === r)); ok(res.ok, g + ' contrata ' + r); }
  ok(O.prontos(g, 't1'), g + ': titulares completos');
  O.avancar(26 * 2); const cg = O.compFor(g, 't1'), ihg = O.get().intlHist.filter(x => x.g === g);
  ok(cg && cg.hist.length >= 2, g + ': splits disputados (' + (cg && cg.hist.length) + ')');
  ok(ihg.length >= 2 && ihg.every(x => x.camp), g + ': internacionais (' + ihg.map(x => x.nome).join(', ') + ')');
  ok(O.classificacao(cg).length === 9, g + ': tabela com 9 times');
}
O.set(O.novoJogo()); S = O.get(); O.trocarRegiao('EU', 'cs2'); ok(O.regiaoDe('cs2') === 'EU' && O.regiaoDe('lol') === 'CBLOL', 'região por jogo é independente');
// save e carga
const mem = {}; global.localStorage = { setItem: (k, x) => mem[k] = x, getItem: k => mem[k] || null }; O.set(O.novoJogo()); O.get().org.nome = 'Teste'; O.save(); O.set(O.novoJogo()); ok(O.load() && O.get().org.nome === 'Teste', 'save e load');
console.log('FALHAS:', falhas); process.exit(falhas ? 1 : 0);
