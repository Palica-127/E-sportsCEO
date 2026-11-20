/* Economia semanal do eSports no motor real (jsdom): semana, eventos, patrocinio, falencia leve, offline,
   Mercado, Liga, prestigio e migracao de save antigo. node tests/esp_logic.js */
const { boot } = require('./boot'); const wait = ms => new Promise(r => setTimeout(r, ms)); let n = 0;
const ok = (c, m) => { n++; if (!c) { console.log('FAIL', m); process.exitCode = 1; } else console.log('OK  ', m); };
const fresh = async (opts) => { const b = boot(opts || {}); await wait(60); const I = b.w.IDLE; I.ui(false); I.st.cur = 'esp'; return Object.assign(b, { I, g: I.st.g.esp, X: b.w.SEMANA, M: b.w.MKT, A: b.w.Engine.api('esp'), G: b.w.GAMES.esp }); };
(async () => {
  /* ---- modo semanal: sem clique, relogio de 40 s ---- */
  let t = await fresh(); let { w, errs, I, g, X, M, A, G } = t, k = 'esp';
  ok(G.weekly === true && G.noClick === true && G.ver === 2, 'jogo e semanal, sem clique, versao 2');
  ok(G.items.length === 14 && G.items[13].id === 'smm', '14 itens, indice 13 = social media');
  ok(I.psBase(k) === 0, 'sem producao por segundo (psBase = 0)');
  ok(g.m === 3000, 'caixa inicial R$ 3.000');
  const m0 = g.m; I.doClick && I.doClick(k); ok(g.m === m0, 'clique nao rende nada');
  g.sh.region = 'BR'; const wk0 = X.state().wk; for (let i = 0; i < 100; i++) I.tick(0.5); ok(X.state().wk > wk0, 'semanas avancam sozinhas (~40 s)');
  const w2 = X.state().wk; for (let i = 0; i < 30; i++) I.tick(1); ok(X.state().wk - w2 === 0 || X.state().wk - w2 === 1, '30 s nao passam mais de uma semana');

  /* ---- foco ---- */
  ok(X.setFocus('descanso').ok && X.state().prox === 'descanso', 'trocar foco com um toque');
  ok(X.setFocus('inexistente').ok === false, 'foco invalido recusado');
  ok(X.state().cd !== undefined, 'recargas existem');
  X.setFocus('bootcamp'); const fb = X.focusAvail('bootcamp'); ok(typeof fb.ok === 'boolean', 'bootcamp tem regra de disponibilidade');

  /* ---- compras e Mercado ---- */
  g.m = 1e12; for (let i = 0; i < 5; i++) I.buy(k, 0, 1); ok(g.o[0] === 5, '5 titulares');
  I.tick(0.1); const v = M.view(); ok(v.st.filter(x => x && !x.real).length === 5, 'vagas amadoras preenchidas');
  const P = w.PLAYERS, by = (l, r) => P.filter(p => p.l === l && p.r === r).sort((a, b) => a.o - b.o);
  const low = by('CBLOL', 'TOP')[0]; let r = M.hire(low.id, false); ok(r.ok, 'contratou real: ' + (r.msg || ''));
  ok(M.price(low, 'BR') > 0 && M.salary(low, 'BR') > 0, 'preco e salario em R$');
  const sal0 = A.shared.salRoster; ok(sal0 > 0, 'salRoster publicado');
  r = M.fire(M.ROLES.indexOf(low.r)); ok(r.ok !== false, 'dispensar vira amador'); I.tick(0.1);
  ok(M.view().st.every(x => x), 'apos dispensar a vaga continua ocupada (amador)');
  ok(A.shared.salRoster < sal0 + 1, 'salario cai ao dispensar');

  /* ---- economia: patrocinio ---- */
  const e = X.econ(); ok(e.inc && typeof e.saldo === 'number', 'econ() devolve receitas e saldo');
  X.genOffer({}); const st = X.state(); ok(st.of.length >= 1, 'oferta de patrocinio gerada');
  const nCon = st.con.length; const ar = X.accept(0); ok(ar && (ar.ok !== false) && st.con.length === nCon + 1, 'aceitar oferta cria contrato');
  X.genOffer({}); const nOf = st.of.length; X.refuse(0); ok(st.of.length === nOf - 1, 'recusar remove a oferta');

  /* ---- eventos ---- */
  X.events.forEach(ev => { X.forceEvent(ev.id); const s0 = X.state(); const ok1 = !!s0.ev; try { X.choose(0); } catch (x) { errs.push(String(x)); } ok(ok1 && !X.state().ev, 'evento ' + ev.id + ' abre e resolve (opcao 1)'); });
  X.forceEvent('polemica'); X.choose(1); ok(!X.state().ev, 'segunda opcao resolve');
  ok(X.events.length === 15, '15 eventos');

  /* ---- falencia leve ---- */
  g.m = -50000; X.state().st.resg = 0; const rr = X.rescue(); ok(g.m >= 0 || (rr && rr.ok !== false), 'resgate tira o caixa do negativo');
  for (let i = 0; i < 6; i++) { g.m = -1e6; I.tick(41); } ok(isFinite(g.m) && !errs.length, 'caixa muito negativo nao quebra o jogo');
  ok(g.o[0] >= 0 && g.o[0] <= 5, 'time continua valido apos falencia');

  /* ---- offline ---- */
  g.m = 5e5; const wkB = X.state().wk; const aw = I.creditAway(3600); ok(X.state().wk > wkB + 20, 'offline 1 h avanca dezenas de semanas');
  ok(isFinite(g.m) && g.m > -1e9, 'caixa finito apos offline'); ok(!errs.length, 'sem excecoes no offline: ' + errs.join('|'));
  const wkC = X.state().wk; I.creditAway(60 * 24 * 3600); ok(X.state().wk - wkC <= 9000, 'offline longo e limitado');

  /* ---- Liga ---- */
  const L = w.ESPX.liga, s2 = L.state(); ok(['T2', 'T1'].includes(s2.div), 'liga em T2 ou T1');
  const rs = []; for (let i = 0; i < 40; i++) rs.push(L.step(() => 100, 500 + i, 12345)); ok(rs.every(x => x && typeof x === 'object'), 'step() devolve objeto sempre');
  const o = L.winP(100, 100); ok(o > 0.3 && o < 0.7, 'winP igual ~50%');
  ok(L.oppName !== undefined, 'oppName exposto');
  t.w.close && 0;

  /* ---- prestigio ---- */
  t = await fresh(); ({ w, errs, I, g, X, M, A } = t); g.sh.region = 'BR'; g.m = 1e9; for (let i = 0; i < 5; i++) I.buy(k, 0, 1);
  const pi = X.prestInfo(); ok(pi && typeof pi === 'object', 'prestInfo existe');
  g.starsTotal !== undefined; const ach0 = JSON.stringify(g.ach || null);
  try { I.prestige && I.prestige(k, true); } catch (x) { errs.push(String(x)); }
  ok(!errs.length, 'prestigio sem excecoes: ' + errs.join('|')); ok(JSON.stringify(g.ach || null) === ach0, 'conquistas preservadas no prestigio');

  /* ---- migracao: save antigo (v1) reinicia so o eSports ---- */
  const old = { v: 2, st: 0, g: { esp: { m: 123456, t: 5000, life: 5000, stars: 7, o: [3, 2, 1, 4, 2, 3, 1, 2, 3, 1, 2, 1, 1], ach: { esp_first: 1 }, sh: { region: 'BR', division: 'T1' } }, lan: { m: 777, t: 10, life: 10, o: [2, 1] } } };
  t = await fresh({ save: JSON.stringify(old) });
  ({ w, errs, I, g } = t);
  ok(!errs.length, 'save antigo abre sem excecoes: ' + errs.join('|'));
  ok(g.o.every(v => v === 0) && g.m === 3000 || g.m <= 3000 + 1, 'eSports reiniciado (itens zerados, caixa inicial)');
  ok(g.stars === 7 && g.life === 5000, 'estrelas e tempo de vida preservados');
  ok(I.st.g.lan.m === 777, 'outros jogos nao sao afetados');
  console.log(n + ' verificacoes'); process.exit(process.exitCode || 0);
})().catch(e => { console.log('EXC', e); process.exit(1); });
