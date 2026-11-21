// Testes do "mundo que envelhece" (sem navegador): node tests/mundo.js
global.window = global; require('../js/data/lol.js'); require('../js/data/outros.js'); require('../js/data/lolx.js'); require('../js/core.js');
let falhas = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) falhas++; };
const O = Org, JOGOS = Object.keys(O.GAMES);
const novo = seed => { O.set(O.novoJogo()); const S = O.get(); S.seed = seed; O.mundoSync(); return S; };
const anos = (S, n) => { for (let i = 0; i < n; i++) { S.org.ano++; O.mundoTick(); } };
const snap = g => O.pool(g).map(p => ({ id: p.id, n: p.n, o: p.o, a: p.a, c: p.c, r: p.r, t: p.t, l: p.l, tier: p.tier }));
const media = (g, l) => { const q = O.pool(g).filter(p => p.l === l && p.tier === 'T1'); return q.reduce((a, p) => a + p.o, 0) / q.length; };
const ligas = g => [...new Set(O.pool(g).map(p => p.l))];

// ---- 1) idades sobem, idades ausentes ganham valor plausível
let S = novo(101); const t0 = {}; for (const g of JOGOS) t0[g] = snap(g);
ok(JOGOS.some(g => t0[g].some(p => p.a == null)), 'dados originais têm idades ausentes (CS2 etc.)');
anos(S, 1);
for (const g of JOGOS) {
  const a1 = snap(g), m = new Map(a1.map(p => [p.id, p])); let sobem = 0, total = 0, nulos = 0, nulosOk = 0, errados = 0;
  for (const p of t0[g]) { const q = m.get(p.id); if (!q) continue; total++; if (p.a == null) { nulos++; if (q.a >= 17 && q.a <= 36) nulosOk++; } else if (q.a === p.a + 1) sobem++; else errados++; }
  ok(errados === 0 && sobem + nulos === total, `${g}: quem fica no elenco envelhece 1 ano (${sobem}/${total - nulos})`);
  ok(nulos === nulosOk, `${g}: idade ausente vira idade plausível (${nulos})`);
  ok(a1.every(p => p.a >= 16 && p.a <= 41 && p.o >= 42 && p.o <= 98), `${g}: idades e notas dentro de faixas`);
}
ok(S.mundo.y === S.org.ano && S.mundo.n === 1, 'mundo.y acompanha o ano do jogo');

// ---- 2) 15 anos: tamanho dos elencos, ids únicos, regens, aposentadorias
S = novo(202); const t = Date.now(); const tam0 = {}, rows0 = {};
for (const g of JOGOS) { tam0[g] = O.pool(g).length; rows0[g] = O.dataOf(g) && Object.values(O.dataOf(g).leagues).map(L => L.t1.concat(L.t2).map(x => (x.p || []).length).join(',')).join(';'); }
let erro = null; try { anos(S, 15); } catch (e) { erro = e; console.log(e.stack); }
ok(!erro, '15 anos simulados sem erro (' + (Date.now() - t) + ' ms)');
for (const g of JOGOS) {
  const p = O.pool(g), ids = new Set(p.map(x => x.id)), nicks = p.map(x => x.n.toLowerCase());
  ok(p.length === tam0[g], `${g}: nº de profissionais constante (${p.length})`);
  ok(Object.values(O.dataOf(g).leagues).map(L => L.t1.concat(L.t2).map(x => (x.p || []).length).join(',')).join(';') === rows0[g], `${g}: cada time mantém o nº de jogadores`);
  ok(ids.size === p.length, `${g}: ids únicos`); ok(new Set(nicks).size === nicks.length, `${g}: nicks únicos`);
  const regens = p.filter(x => x.id.includes('~')); ok(regens.length > p.length * 0.3, `${g}: renovação do elenco (${regens.length} regens de ${p.length})`);
  ok(regens.every(x => x.n && x.c && /^[A-Z]{2}$/.test(x.c)), `${g}: regens com nick e bandeira ISO`);
  ok(O.livres(g).length === p.length, `${g}: mercado lista todos os pros atuais`);
}
ok(JOGOS.every(g => Object.values(S.mundo.ov[g]).every(e => e.length === 3 || (e.length === 7 && e[3] >= 1 && e[1] >= 16))), 'overrides compactos (3 campos; 7 para regens)');
const apos = O.aposentados(); ok(apos.length > 5 && apos.every(x => x.idade >= 22 && x.nick), 'lendas aposentadas registradas (' + apos.length + ')');
ok(apos.length <= 60, 'lista de aposentadas limitada');
ok(S.log.filter(x => /se aposentou aos \d+ anos/.test(x)).length <= 40, 'log limitado');
const regLol = O.pool('lol').filter(p => p.id.includes('~')), idades = regLol.map(p => p.a);
ok(Math.min(...Object.values(S.mundo.ov.lol).filter(e => e.length === 7).map(e => e[1])) >= 16, 'regens estreiam com 16+ anos');
const estreia = Object.values(S.mundo.ov.lol).filter(e => e.length === 7); ok(estreia.every(e => e[1] >= 16 && e[1] <= 19 + 15), 'idades de regens coerentes');
const estrelas = JOGOS.map(g => O.pool(g).filter(p => p.id.includes('~') && p.o >= 80).length); ok(estrelas.every(n => n > 0) || estrelas.filter(n => n > 0).length >= 6, 'alguns regens viram estrelas (' + estrelas.join(',') + ')');
const elite = Object.values(S.mundo.ov.lol).filter(e => e.length === 7 && e[2] >= 85).length; ok(elite > 0, 'há regens de potencial altíssimo no LoL (' + elite + ')');
ok(O.pool('lol') === O.pool('lol'), 'pool em cache entre chamadas');
ok(JSON.stringify(S.mundo).length < 150000, 'estado do mundo compacto (' + Math.round(JSON.stringify(S.mundo).length / 1000) + ' KB em 15 anos)');

// ---- 3) distribuição de ovr plausível: média dos titulares de cada liga dentro de ±4 em 15 anos
for (const seed of [1, 2, 3]) {
  S = novo(seed); const m0 = {}; for (const g of JOGOS) for (const l of ligas(g)) m0[g + l] = media(g, l); let pior = 0, onde = '';
  for (let y = 1; y <= 15; y++) { anos(S, 1); for (const g of JOGOS) for (const l of ligas(g)) { const d = Math.abs(media(g, l) - m0[g + l]); if (d > pior) { pior = d; onde = g + '/' + l + '@' + y; } } }
  ok(pior <= 4, `seed ${seed}: média dos titulares de toda liga T1 fica a ±4 em 15 anos (pior ${pior.toFixed(2)} em ${onde})`);
}
{ S = novo(7); anos(S, 15); const idadeMedia = O.pool('lol').reduce((a, p) => a + p.a, 0) / O.pool('lol').length; ok(idadeMedia > 21 && idadeMedia < 26, 'idade média do LoL estável (' + idadeMedia.toFixed(1) + ')'); }

// ---- 4) curva por idade: jovens sobem, veteranos caem, reflexo cai mais que EA FC
{ const P = O.MUNDO_PERF; ok(P.cs2.dec > P.fifa.dec && P.valorant.dec > P.ff.dec && P.lol.dec > P.fifa.dec, 'declínio mais forte em jogos de reflexo que em EA FC/FF');
  S = novo(33); const jovens = O.pool('lol').filter(p => p.a <= 19), vet = O.pool('lol').filter(p => p.a >= 29), idj = new Set(jovens.map(p => p.id)), idv = new Set(vet.map(p => p.id));
  const ov0 = new Map(O.pool('lol').map(p => [p.id, p.o])); anos(S, 2);
  const j1 = O.pool('lol').filter(p => idj.has(p.id)), v1 = O.pool('lol').filter(p => idv.has(p.id));
  const o0j = j1.reduce((a, p) => a + ov0.get(p.id), 0) / (j1.length || 1), o0v = v1.reduce((a, p) => a + ov0.get(p.id), 0) / (v1.length || 1); // só quem ficou, antes x depois
  ok(jovens.length > 0 && j1.reduce((a, p) => a + p.o, 0) / j1.length > o0j + 0.5, `jovens (<=19) evoluem em 2 anos (${o0j.toFixed(1)} -> ${(j1.reduce((a, p) => a + p.o, 0) / j1.length).toFixed(1)})`);
  ok(vet.length === 0 || v1.length === 0 || v1.reduce((a, p) => a + p.o, 0) / v1.length < o0v, `veteranos (>=29) perdem nota (${o0v.toFixed(1)} -> ${v1.length ? (v1.reduce((a, p) => a + p.o, 0) / v1.length).toFixed(1) : 'todos aposentados'})`);
  ok(v1.length < vet.length * 0.85, `veteranos se aposentam (${vet.length} -> ${v1.length} ainda ativos)`); }

// ---- 5) determinismo
{ const run = seed => { const S = novo(seed); anos(S, 6); return JSON.stringify(S.mundo); }; ok(run(5) === run(5), 'mesmo seed, mesmo mundo'); ok(run(5) !== run(6), 'seeds diferentes, mundos diferentes'); }

// ---- 6) jogador contratado continua do usuário (ids estáveis) e envelhece
S = novo(404); S.org.caixa = 9e8; const mine = {};
for (const g of ['lol', 'cs2']) { for (const r of O.GAMES[g].roles) { const p = O.livres(g).filter(x => x.r === r).sort((a, b) => b.o - a.o)[3]; const res = O.contratar(g, 't1', p); ok(res.ok, g + ' contrata ' + r); mine[p.id] = { g, o: p.o, a: p.a, n: p.n }; } }
for (const g of ['lol', 'cs2']) S.games[g].squads.t1.slots.filter(Boolean).forEach(p => { p.ct = 9999; });
const ids0 = JSON.stringify(['lol', 'cs2'].map(g => S.games[g].squads.t1.slots.filter(Boolean).map(p => p.id)));
O.avancar(52 * 12 + 1);
ok(S.org.ano === 2038 && S.mundo.y === 2038 && S.mundo.n === 12, 'avancar dispara as viradas de ano (' + S.org.ano + ', n=' + S.mundo.n + ')');
ok(ids0 === JSON.stringify(['lol', 'cs2'].map(g => S.games[g].squads.t1.slots.filter(Boolean).map(p => p.id))), 'contratados continuam no elenco com os mesmos ids');
{ let idadeOk = true, vivo = true; for (const g of ['lol', 'cs2']) S.games[g].squads.t1.slots.filter(Boolean).forEach(p => { const m = mine[p.id]; if (m.a != null && p.a !== m.a + 12) idadeOk = false; if (p.a == null || p.o < 40) vivo = false; });
  ok(idadeOk, 'contratados envelhecem 1 ano por virada'); ok(vivo, 'contratados mantêm idade e nota válidas'); }
ok(O.livres('lol').every(p => !(p.id in mine)), 'contratados não aparecem no mercado');
ok(S.games.lol.squads.t1.slots.filter(Boolean).length === 5 && S.games.lol.squads.t1.slots.filter(Boolean).every(p => !String(p.id).includes('~')), 'contratados nunca são aposentados enquanto sob contrato');
ok(Number.isFinite(S.org.caixa), 'caixa finito após 12 anos de jogo');
// força dos times reflete evolução: b dos times da liga acompanha o elenco atual
{ const Lg = O.ligaSync('lol'), L = O.dataOf('lol').leagues[Lg.reg]; const alvo = L.t1.map(t => O.mediaTime(t.p)); ok(Lg.d1.every(t => { const src = L.t1.concat(L.t2).find(x => x.n === t.n); return Math.abs(t.b - O.mediaTime(src.p)) < 1e-9; }), 'força dos times (ligaSync) reflete os elencos atuais');
  const c = O.compFor('lol', 't1'); ok(c.teams.filter(x => !x.eu).every(x => Number.isFinite(x.b) && x.b > 55 && x.b < 100), 'timesDe/compFor com forças válidas'); }
{ const S2 = novo(9); const b0 = O.ligaSync('lol').d1.map(t => t.b).join(','); anos(S2, 4); ok(O.ligaSync('lol').d1.map(t => t.b).join(',') !== b0, 'forças dos times mudam com os anos'); }

// ---- 7) jogos fechados também envelhecem
O.comecar(); S = O.get(); O.iniciar({ nome: 'X', game: 'cs2', regiao: 'AM' }); S.seed = 11; { const a0 = O.pool('wr')[0].a; anos(S, 1); ok(!O.aberto('wr') && O.pool('wr').find(p => p.id === 'wr-BR-1-0-0').a === a0 + 1, 'jogo ainda fechado (WR) envelhece'); }

// ---- 8) migração de save antigo (sem S.mundo)
{ const mem = {}; global.localStorage = { setItem: (k, x) => mem[k] = x, getItem: k => mem[k] || null };
  const old = O.novoJogo(); delete old.mundo; old.org.ano = 2031; old.org.nome = 'Velha'; mem['org-v1'] = JSON.stringify(old);
  ok(O.load() && O.get().org.nome === 'Velha', 'save antigo carrega'); const S3 = O.get();
  ok(S3.mundo && S3.mundo.y === 2031 && S3.mundo.n === 0 && S3.mundo.ov && Array.isArray(S3.mundo.apos), 'migração cria S.mundo no ano do save');
  ok(JSON.stringify(snap('lol')) === JSON.stringify(t0.lol), 'migração mantém os dados originais (sem retroativo)');
  S3.seed = 3; O.avancar(52); ok(S3.mundo.y === 2032 && S3.mundo.n === 1, 'save migrado vira o ano normalmente');
  O.save(); O.set(O.novoJogo()); ok(JSON.stringify(snap('lol')) === JSON.stringify(t0.lol), 'set(novoJogo) restaura o mundo original');
  O.load(); ok(O.get().mundo.n === 1 && O.get().org.ano === 2032, 'load traz o mundo salvo (n=1)');
  const antes = JSON.stringify(snap('lol')); O.set(O.novoJogo()); O.load(); ok(JSON.stringify(snap('lol')) === antes, 'save -> load reproduz exatamente o mundo'); }
// save com mundo avançado, recarregado em "outra sessão"
{ const mem = {}; global.localStorage = { setItem: (k, x) => mem[k] = x, getItem: k => mem[k] || null }; S = novo(77); anos(S, 5); O.save(); const ref = JSON.stringify(JSON.parse(JSON.stringify(snap('cs2')))); O.set(O.novoJogo()); O.load();
  ok(JSON.stringify(snap('cs2')) === ref && O.get().mundo.n === 5, 'mundo de 5 anos sobrevive a save/load'); anos(O.get(), 1); ok(O.get().mundo.n === 6, 'e continua evoluindo depois do load'); }

// ---- 9) aposentadorias de lendas no log, com limite por ano
{ S = novo(1234); let maxAno = 0; for (let y = 0; y < 15; y++) { const n0 = S.logN || 0; anos(S, 1); const novas = S.log.slice(0, Math.min((S.logN || 0) - n0, S.log.length)).filter(x => /se aposentou aos \d+ anos/.test(x)); maxAno = Math.max(maxAno, novas.length); }
  ok(maxAno <= 3, 'no máximo 3 aposentadorias no log por ano (' + maxAno + ')'); ok(S.mundo.apos.length > 0, 'lendas registradas no histórico do mundo'); ok(S.log.length <= 40, 'log do jogo respeita o limite'); }
// ---- 10) integração: run longa com liga rodando
{ S = novo(55); S.org.caixa = 5e7; for (const r of O.GAMES.lol.roles) O.contratar('lol', 't1', O.livres('lol').filter(x => x.r === r).sort((a, b) => a.o - b.o)[0]); const t1 = Date.now(); let e2 = null; try { O.avancar(52 * 15); } catch (e) { e2 = e; console.log(e.stack); }
  ok(!e2 && S.mundo.n === 15, 'run de 15 anos com campeonatos rodando (' + (Date.now() - t1) + ' ms)'); ok(O.compFor('lol', 't1').hist.length > 0 && Number.isFinite(S.org.caixa), 'competições seguem coerentes depois de 15 anos'); }
console.log('FALHAS:', falhas); process.exit(falhas ? 1 : 0);
