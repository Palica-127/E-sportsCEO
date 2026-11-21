// Testes do motor da "partida no calendário": node tests/partida.js  (saída final: 'FALHAS: n')
global.window = global; require('../js/data/lol.js'); require('../js/data/outros.js'); require('../js/core.js');
let falhas = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) falhas++; };
const O = Org, JOGOS = Object.keys(O.GAMES);
function novo(seed, jogos, melhores) { // org rica com times principais completos nos jogos indicados
  O.set(O.novoJogo()); const S = O.get(); S.seed = seed; S.org.caixa = 5e9;
  for (const g of jogos) {
    const liv = O.livres(g).sort((a, b) => melhores ? b.o - a.o : a.o - b.o);
    for (const r of O.GAMES[g].roles) O.contratar(g, 't1', liv.find(x => x.r === r));
  }
  return S;
}
const estado = () => JSON.stringify(O.get());

// ---- 1. o avanço para na semana de jogo, sem simular nada
let S = novo(11, ['lol']);
let r, sem = 0, parou = null;
for (; sem < 60; sem++) { r = O.passo({ parar: true }); if (r.parou) { parou = r; break; } }
ok(parou && sem >= 3 && sem < 30, `parou numa semana com partida (após ${sem} semanas)`);
ok(parou.partidas.length === 1 && parou.partidas[0].game === 'lol' && parou.partidas[0].sq === 't1', 'fila com a partida do LoL T1');
const pd = parou.partidas[0];
ok(/^Partida: LoL · Time principal vs .+/.test(parou.motivo), 'motivo de parada claro: ' + parou.motivo);
ok(pd.op && pd.fase.startsWith('Rodada') && pd.bo === 1 && pd.p > 0 && pd.p < 1 && pd.fMeu > 0 && pd.fOp > 0 && pd.euNome === S.org.nome, 'detalhes do confronto (rodada, bo, forças, chance)');
const sem0 = S.org.semana, snap = estado(), seed0 = S.seed;
const r2 = O.passo({ parar: true }); ok(r2.parou && estado() === snap && S.seed === seed0 && S.org.semana === sem0, 'parar não altera o estado nem consome sorteio (repetível)');
ok(O.partidasSemana().length === 1 && estado() === snap, 'partidasSemana() é só leitura');
const c0 = O.compFor('lol', 't1'), n0 = c0.last.length;
r = O.passo(); // resolve a semana
ok(S.org.semana === sem0 + 1 && c0.last.length === n0 + 1, 'depois de resolver, a semana avançou e o jogo foi registrado');
ok(r.partidas.length === 1 && r.partidas[0].op === pd.op && r.partidas[0].nar, 'resultado traz a partida com narração');
const d = r.partidas[0], u = c0.last[0];
ok(d.v === u.v && `${d.meus}-${d.deles}` === u.pl && d.op === u.op, 'detalhe coincide com o resultado gravado no motor');
ok(d.efeito && Number.isFinite(d.efeito.caixa) && Number.isFinite(d.efeito.rep) && d.efeito.seg !== 0 && Array.isArray(d.notas), 'efeitos (caixa, reputação, torcida) registrados');
ok(!d.v || d.efeito.caixa === Math.round(O.SQUADS.t1.premio * 0.01), 'vitória na fase regular paga o bônus de premiação');

// ---- 2. parar + resolver dá exatamente o mesmo mundo que avançar sem parar
function trilha(modo) {
  novo(77, ['lol']); let paradas = 0;
  for (let i = 0; i < 80; i++) { if (modo) { const x = O.passo({ parar: true }); if (x.parou) { paradas++; O.passo(); } } else O.passo(); }
  return [estado(), paradas];
}
const A = trilha(false), B = trilha(true);
ok(A[0] === B[0] && B[1] > 3, `parar em cada partida não muda os resultados (${B[1]} paradas em 80 semanas)`);

// ---- 3. modo auto (passo() sem parar) nunca para e ainda assim registra as partidas
novo(5, ['lol', 'cs2']); let paradasAuto = 0, jogos = 0;
for (let i = 0; i < 80; i++) { const x = O.passo(); if (x.parou) paradasAuto++; jogos += x.partidas.length; }
ok(paradasAuto === 0 && jogos > 6, `modo auto não para (${jogos} partidas jogadas em silêncio)`);

// ---- 4. fila: vários times / jogos na mesma semana
novo(3, JOGOS); let fila = null;
for (let i = 0; i < 40 && !fila; i++) { const x = O.passo({ parar: true }); if (x.parou) { if (x.partidas.length >= 3) fila = x; else O.passo(); } }
ok(fila && fila.partidas.length === 8, 'com 8 jogos ativos a fila tem 8 partidas na mesma semana (' + (fila && fila.partidas.length) + ')');
ok(fila && new Set(fila.partidas.map(p => p.key)).size === fila.partidas.length && /\(\+7 na fila\)/.test(fila.motivo), 'fila sem repetidos e motivo informa o restante');
const filaChaves = fila.partidas.map(p => p.key).join();
const fim = O.passo();
ok(fim.partidas.map(p => p.key).join() === filaChaves, 'depois de resolver, os detalhes saem na mesma ordem da fila');
// time T2 do mesmo jogo também entra na fila
S = novo(4, ['lol']); O.ativarSquad('lol', 't2'); const t2 = S.games.lol.squads.t2, liv2 = O.livres('lol').sort((a, b) => a.o - b.o);
for (const rr of O.GAMES.lol.roles) O.contratar('lol', 't2', liv2.filter(x => x.r === rr)[3]);
let filaT = null; for (let i = 0; i < 60 && !filaT; i++) { const x = O.passo({ parar: true }); if (x.parou) { if (x.partidas.length >= 2) filaT = x; else O.passo(); } }
ok(filaT && filaT.partidas.map(p => p.sq).join() === 't1,t2', 'T1 e T2 do mesmo jogo geram duas partidas na fila');

// ---- 5. playoffs e internacionais também param, com contexto
S = novo(21, ['lol'], true); const vistos = { reg: 0, po: 0, intl: 0 }, fases = new Set();
for (let i = 0; i < 700; i++) { const x = O.passo({ parar: true }); if (x.parou) { x.partidas.forEach(p => { vistos[p.tipo]++; fases.add(p.fase); }); O.passo(); } if (vistos.intl >= 2 && vistos.po >= 3) break; }
ok(vistos.reg > 5 && vistos.po >= 3 && vistos.intl >= 1, `para em rodadas, playoffs e internacional (${JSON.stringify(vistos)})`);
ok([...fases].some(f => /^Playoffs · (Quartas|Semifinal|Final)$/.test(f)) && [...fases].some(f => /^(MSI|Mundial) · (Oitavas|Quartas|Semifinal|Final)$/.test(f)), 'contexto das fases: ' + [...fases].filter(f => !/^Rodada/.test(f)).join(', '));
// quando o usuário já caiu fora, os jogos do torneio seguem em silêncio
{ S = novo(21, ['lol'], false); let semParada = 0, c = O.compFor('lol', 't1'); for (let i = 0; i < 400; i++) { const x = O.passo({ parar: true }); if (x.parou) O.passo(); else if (c.phase === 'intl' || c.phase === 'po') semParada++; }
  ok(true, 'ciclo longo sem travar (' + semParada + ' semanas silenciosas em fase de mata-mata/intl)'); }

// ---- 6. narração coerente com o resultado, para todos os formatos e melhores de 1/3/5
function det(game, bo, meus, deles, i) {
  const roles = O.GAMES[game].roles, j = o => roles.map((r, k) => ({ n: o + k, r, o: 70 + k * 3 }));
  return { key: game + '-t1', game, sq: 't1', fase: 'Playoffs · Final', bo, euNome: 'Minha Org', op: 'Rival', meus, deles, v: meus > deles, s: 1 + i % 52, y: 2026 + (i % 5), meusJ: j('Eu'), opJ: j('Op') };
}
const casos = [[1, 1, 0], [1, 0, 1], [3, 2, 0], [3, 2, 1], [3, 1, 2], [3, 0, 2], [5, 3, 0], [5, 3, 2], [5, 2, 3], [5, 1, 3]];
let bons = 0, total = 0, problemas = [];
for (const g of JOGOS) for (const [bo, m, dl] of casos) for (let i = 0; i < 12; i++) {
  const dt = det(g, bo, m, dl, i), n = O.narrar(dt); total++;
  const mv = n.jogos.filter(j => j.venc === 'm').length, ov = n.jogos.length - mv, ult = n.jogos[n.jogos.length - 1], campeao = m > dl ? 'm' : 'o';
  let coerente = n.jogos.length === m + dl && mv === m && ov === dl && ult.venc === campeao && n.venc === campeao && n.placar[0] === m && n.placar[1] === dl;
  // placar de cada jogo bate com o vencedor (no MOBA decidem as torres; abates podem ser apertados)
  for (const j of n.jogos) { const p = j.m[n.fmt === 'moba' ? 1 : 0], quem = p.a === p.b ? null : (p.a > p.b ? 'm' : 'o'); if (g !== 'ff' && quem !== j.venc) coerente = false; if (g === 'ff' && !(j.m[2].a < j.m[2].b ? j.venc === 'm' : j.venc === 'o')) coerente = false; if (g === 'ff' && (j.m[0].a > j.m[0].b) !== (j.venc === 'm')) coerente = false; }
  if (n.fmt === 'rounds') for (const j of n.jogos) { const a = j.seq.filter(x => x === 'm').length; if (a !== j.m[0].a || j.seq.length !== j.m[0].a + j.m[0].b || j.seq[j.seq.length - 1] !== j.venc) coerente = false; }
  if (n.fmt === 'gols') for (const j of n.jogos) { const a = j.gols.filter(x => x[1] === 'm').length; if (a !== j.m[0].a || j.gols.length !== j.m[0].a + j.m[0].b || j.m[0].a === j.m[0].b) coerente = false; }
  const mm = n.momentos; if (mm.length < 3 || mm.length > 5 || mm.some(x => !x.txt || x.g < 0 || x.g >= n.jogos.length || x.p < 0 || x.p > 1 || /\{[pt]\}/.test(x.txt))) coerente = false;
  if (!n.mvp || !n.mvp.n || !n.mvp.stat || (n.mvp.lado !== 'm' && n.mvp.lado !== 'o')) coerente = false;
  if (JSON.stringify(O.narrar(dt)) !== JSON.stringify(n)) coerente = false; // determinística
  if (coerente) bons++; else if (problemas.length < 4) problemas.push(`${g} bo${bo} ${m}-${dl} #${i}`);
}
ok(bons === total, `narração coerente em ${bons}/${total} casos (8 jogos x 10 placares x 12 sementes) ${problemas.join('; ')}`);
// formatos esperados por jogo
const fmts = Object.fromEntries(JOGOS.map(g => [g, O.narrar(det(g, 3, 2, 1, 0)).fmt]));
ok(fmts.lol === 'moba' && fmts.wr === 'moba' && fmts.dota2 === 'moba' && fmts.cs2 === 'rounds' && fmts.valorant === 'rounds' && fmts.r6 === 'rounds' && fmts.ff === 'ff' && fmts.fifa === 'gols', 'formato por jogo (mapas/torres, rounds, pontos, gols)');
const nc = O.narrar(det('cs2', 3, 2, 1, 0)); ok(nc.jogos.every(j => /^Mapa \d/.test(j.lbl) && j.sub) && nc.jogos.every(j => Math.max(j.m[0].a, j.m[0].b) >= 13), 'CS2: mapas com placar de rounds até 13+');
const nr = O.narrar(det('r6', 1, 1, 0, 0)); ok(Math.max(nr.jogos[0].m[0].a, nr.jogos[0].m[0].b) >= 7, 'R6: rounds até 7+');
const nl = O.narrar(det('lol', 3, 2, 1, 0)); ok(nl.jogos.every(j => j.m[0].n === 'Abates' && j.m[1].n === 'Torres'), 'LoL: abates e torres por jogo');
const nf = O.narrar(det('ff', 1, 1, 0, 0)); ok(nf.jogos.length === 1 && nf.jogos[0].m.some(x => x.n === 'Pontos') && nf.jogos[0].m.some(x => x.n === 'Posição'), 'Free Fire: partida de pontos com posição e abates');
// a narração não mexe no sorteio do jogo
S = novo(9, ['lol']); const sd = S.seed; O.narrar(det('lol', 5, 3, 2, 1)); ok(S.seed === sd, 'narrar() não consome o sorteio do motor');
// resultado real: narração usa o resultado de verdade, inclusive nas séries longas dos mata-matas
S = novo(21, ['lol'], true); let checados = 0, incoerentes = 0;
for (let i = 0; i < 500; i++) { const x = O.passo({ parar: true }); if (x.parou) { const y = O.passo(); y.partidas.forEach(p => { checados++; const n = p.nar; if (n.placar[0] !== p.meus || n.placar[1] !== p.deles || n.venc !== (p.v ? 'm' : 'o') || n.jogos.length !== p.meus + p.deles) incoerentes++; }); } }
ok(checados > 20 && incoerentes === 0, `narração do motor coerente com ${checados} partidas reais de uma campanha`);

console.log('FALHAS:', falhas); process.exit(falhas ? 1 : 0);
