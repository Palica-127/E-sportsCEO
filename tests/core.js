// Testes da lógica (sem navegador): node tests/core.js
global.window = global; require('../js/data/lol.js'); require('../js/core.js');
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
// save e carga
const mem = {}; global.localStorage = { setItem: (k, x) => mem[k] = x, getItem: k => mem[k] || null }; O.set(O.novoJogo()); O.get().org.nome = 'Teste'; O.save(); O.set(O.novoJogo()); ok(O.load() && O.get().org.nome === 'Teste', 'save e load');
console.log('FALHAS:', falhas); process.exit(falhas ? 1 : 0);
