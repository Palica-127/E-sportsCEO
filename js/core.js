/* Núcleo: jogos, estado, save, regras de negócio e simulação de competições. Sem DOM aqui (testável em Node). */
(function (root) {
  'use strict';

  /* ---------- Jogos ---------- */
  /* roles = titulares (o tamanho do time vem daqui), subs = reservas. Só o LoL tem dados e competições por enquanto. */
  const GAMES = {
    lol:      { id: 'lol',      nome: 'League of Legends',   curto: 'LoL',      icone: '⚔️', ativo: true,  subs: 2, roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'] },
    cs2:      { id: 'cs2',      nome: 'Counter-Strike 2',    curto: 'CS2',      icone: '🔫', ativo: false, subs: 2, roles: ['IGL', 'AWP', 'ENT', 'LUR', 'SUP'] },
    dota2:    { id: 'dota2',    nome: 'Dota 2',              curto: 'Dota 2',   icone: '🛡️', ativo: false, subs: 2, roles: ['POS1', 'POS2', 'POS3', 'POS4', 'POS5'] },
    valorant: { id: 'valorant', nome: 'Valorant',            curto: 'Valorant', icone: '🎯', ativo: false, subs: 2, roles: ['DUE', 'INI', 'CTR', 'SEN', 'FLX'] },
    ff:       { id: 'ff',       nome: 'Free Fire',           curto: 'Free Fire', icone: '🔥', ativo: false, subs: 2, roles: ['IGL', 'RUSH', 'SNP', 'SUP'] },
    r6:       { id: 'r6',       nome: 'Rainbow Six Siege',   curto: 'R6',       icone: '🛰️', ativo: false, subs: 2, roles: ['ENT', 'FLX', 'ANC', 'ROM', 'SUP'] },
    fifa:     { id: 'fifa',     nome: 'EA FC (FIFA)',        curto: 'EA FC',    icone: '⚽', ativo: false, subs: 1, roles: ['JOG'] },
    wr:       { id: 'wr',       nome: 'Wild Rift',           curto: 'Wild Rift', icone: '📱', ativo: false, subs: 2, roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'] },
  };
  const slotsDe = g => GAMES[g].roles.length + GAMES[g].subs;
  /* premio = bolsa do campeonato do nível; licenca = custo para criar o time */
  const SQUADS = {
    t1:   { id: 't1',   nome: 'Time principal (T1)', licenca: 0,      premio: 600000 },
    t2:   { id: 't2',   nome: 'Time T2',             licenca: 250000, premio: 150000 },
    acad: { id: 'acad', nome: 'Academy',             licenca: 150000, premio: 50000, semDados: true },
  };

  /* Estrutura (gaming house, periféricos, staff...). bonus = pontos de força por nível. */
  const INFRA = [
    { id: 'casa',     nome: 'Gaming house',        icone: '🏠', max: 5, base: 60000, bonus: 0.8, desc: 'Moradia e centro de treino do time.' },
    { id: 'perif',    nome: 'Teclados e mouses',   icone: '⌨️', max: 5, base: 15000, bonus: 0.4, desc: 'Periféricos de ponta para todo o elenco.' },
    { id: 'fone',     nome: 'Fones e monitores',   icone: '🎧', max: 5, base: 12000, bonus: 0.3, desc: 'Áudio e tela com taxa de atualização alta.' },
    { id: 'psi',      nome: 'Psicólogo',           icone: '🧠', max: 3, base: 40000, bonus: 0.6, desc: 'Cuida da cabeça do elenco em fase ruim.' },
    { id: 'nutri',    nome: 'Nutricionista',       icone: '🥗', max: 3, base: 30000, bonus: 0.4, desc: 'Alimentação e sono sob controle.' },
    { id: 'academia', nome: 'Academia',            icone: '🏋️', max: 3, base: 35000, bonus: 0.4, desc: 'Preparo físico e prevenção de lesões.' },
    { id: 'cozinha',  nome: 'Cozinha',             icone: '🍳', max: 3, base: 20000, bonus: 0.3, desc: 'Comida caseira na gaming house.' },
  ];
  const INFRA_MULT = 2.6;      // custo de cada nível = base * INFRA_MULT^nivelAtual
  const UPKEEP = 0.004;        // manutenção semanal = 0,4% do total investido
  const CICLO = 26;            // semanas por split (2 splits por ano): jogos + playoffs + entretemporada
  const PRE = 3;               // semanas de pré-temporada no começo do jogo
  const PREMIO_PCT = { campeao: 1, vice: 0.5, semi: 0.25, quartas: 0.1 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fee = o => Math.round(15000 * Math.pow(1.3, o - 70) / 1000) * 1000;   // custo de contratação por nota
  const salary = o => Math.round(fee(o) / 80);                                  // salário semanal
  const money = n => {
    const a = Math.abs(n), s = n < 0 ? '-' : '';
    if (a >= 1e6) return s + 'R$ ' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace('.', ',') + ' mi';
    if (a >= 1e3) return s + 'R$ ' + (a / 1e3).toFixed(a >= 1e5 ? 0 : 1).replace('.', ',').replace(',0', '') + ' mil';
    return s + 'R$ ' + Math.round(a);
  };

  /* ---------- Estado ---------- */
  const KEY = 'org-v1';
  function novoJogo() {
    const games = {};
    for (const g in GAMES) {
      const mk = () => ({ on: false, slots: Array(slotsDe(g)).fill(null) });
      games[g] = { squads: { t1: Object.assign(mk(), { on: true }), t2: mk(), acad: mk() } };
    }
    return { v: 1, seed: (Date.now() & 0x7fffffff) || 12345, org: { nome: 'Minha Org', caixa: 500000, rep: 1, semana: 1, ano: 2026, regiao: 'CBLOL' },
             infra: {}, games, comp: {}, log: [] };
  }
  let S = novoJogo();
  const get = () => S;
  const set = s => { S = s; };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1 && s.org && s.games) { // completa campos que faltarem (saves de versões anteriores)
        const base = novoJogo();
        for (const g in base.games) if (!s.games[g]) s.games[g] = base.games[g];
        s.comp = s.comp || {}; s.seed = s.seed || base.seed; s.infra = s.infra || {}; s.log = s.log || [];
        S = s; return true;
      }
    } catch (e) {}
    return false;
  }
  function reset() { S = novoJogo(); save(); }
  function log(msg) { S.log.unshift(`S${S.org.semana}/${S.org.ano}: ${msg}`); S.log.length = Math.min(S.log.length, 40); }
  function rnd() { // mulberry32 com estado salvo no jogo (resultados reproduzíveis)
    let t = (S.seed = (S.seed + 0x6D2B79F5) | 0);
    let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  /* ---------- Dados ---------- */
  const LOL = () => root.LOL;
  const region = () => LOL().leagues[S.org.regiao];
  let _pool = null;
  function poolLol() { // todos os jogadores do dataset (T1 de todas as ligas + T2 que tiverem elenco)
    if (_pool) return _pool;
    const out = []; const roles = LOL().roles;
    for (const lg in LOL().leagues) {
      const L = LOL().leagues[lg];
      L.t1.forEach((t, ti) => t.p.forEach((p, i) => out.push({ id: `${lg}-1-${ti}-${i}`, n: p[0], o: p[1], a: p[2], r: roles[i], t: t.n, l: lg, tier: 'T1' })));
      L.t2.forEach((t, ti) => (t.p || []).forEach((p, i) => p && out.push({ id: `${lg}-2-${ti}-${i}`, n: p[0], o: p[1], a: p[2], r: roles[i], t: t.n, l: lg, tier: 'T2' })));
    }
    return (_pool = out);
  }
  function contratados(game) {
    const ids = new Set();
    for (const sq of Object.values(S.games[game].squads)) sq.slots.forEach(p => p && ids.add(p.id));
    return ids;
  }
  function livres(game) { if (game !== 'lol') return []; const used = contratados(game); return poolLol().filter(p => !used.has(p.id)); }

  /* ---------- Org: estrutura, times, elenco ---------- */
  const infraNivel = id => S.infra[id] || 0;
  function infraBonus() { return INFRA.reduce((a, it) => a + infraNivel(it.id) * it.bonus, 0); }
  function infraInvestido() { return INFRA.reduce((a, it) => { let t = 0; for (let l = 0; l < infraNivel(it.id); l++) t += it.base * Math.pow(INFRA_MULT, l); return a + t; }, 0); }
  const infraCusto = it => Math.round(it.base * Math.pow(INFRA_MULT, infraNivel(it.id)) / 1000) * 1000;
  const upkeepSemanal = () => Math.round(infraInvestido() * UPKEEP);

  function comprarInfra(id) {
    const it = INFRA.find(x => x.id === id); if (!it) return { ok: false, msg: 'Item inválido.' };
    if (infraNivel(id) >= it.max) return { ok: false, msg: 'Nível máximo.' };
    const c = infraCusto(it); if (S.org.caixa < c) return { ok: false, msg: 'Caixa insuficiente.' };
    S.org.caixa -= c; S.infra[id] = infraNivel(id) + 1; log(`${it.nome} nível ${S.infra[id]}`); save();
    return { ok: true, msg: `${it.nome} agora no nível ${S.infra[id]}.` };
  }
  function ativarSquad(game, sq) {
    const q = S.games[game].squads[sq], d = SQUADS[sq];
    if (q.on) return { ok: false, msg: 'Já ativo.' };
    if (d.semDados) return { ok: false, msg: 'Ainda sem dados desta divisão.' };
    if (S.org.caixa < d.licenca) return { ok: false, msg: 'Caixa insuficiente.' };
    S.org.caixa -= d.licenca; q.on = true; log(`${d.nome} criado (${GAMES[game].curto})`); save();
    return { ok: true, msg: `${d.nome} criado.` };
  }
  function contratar(game, sq, player) {
    const q = S.games[game].squads[sq]; if (!q || !q.on) return { ok: false, msg: 'Ative esse time primeiro.' };
    const f = fee(player.o); if (S.org.caixa < f) return { ok: false, msg: 'Caixa insuficiente.' };
    const n = GAMES[game].roles.length, idx = GAMES[game].roles.indexOf(player.r);
    let slot = idx >= 0 && !q.slots[idx] ? idx : -1;
    if (slot < 0) for (let i = n; i < q.slots.length; i++) if (!q.slots[i]) { slot = i; break; }
    if (slot < 0) return { ok: false, msg: 'Titular da função e reservas já ocupados.' };
    q.slots[slot] = { id: player.id, n: player.n, o: player.o, a: player.a, r: player.r, t: player.t, l: player.l, fee: f };
    S.org.caixa -= f; log(`Contratou ${player.n} (${player.o}) para o ${SQUADS[sq].nome}`); save();
    return { ok: true, msg: `${player.n} contratado${slot >= n ? ' como reserva' : ''}.` };
  }
  function dispensar(game, sq, slot) {
    const q = S.games[game].squads[sq], p = q.slots[slot]; if (!p) return { ok: false, msg: 'Vaga vazia.' };
    const back = Math.round(p.fee * 0.4); q.slots[slot] = null; S.org.caixa += back; log(`Dispensou ${p.n}`); save();
    return { ok: true, msg: `${p.n} dispensado. Devolução: ${money(back)}.` };
  }
  const folha = (game, sq) => S.games[game].squads[sq].slots.reduce((a, p) => a + (p ? salary(p.o) : 0), 0);
  const titulares = (game, sq) => S.games[game].squads[sq].slots.slice(0, GAMES[game].roles.length);
  const prontos = (game, sq) => { const q = S.games[game].squads[sq]; return q.on && titulares(game, sq).every(Boolean); };
  function forca(game, sq) { // média dos titulares (vaga vazia vale 55) + bônus da estrutura
    const st = titulares(game, sq);
    return st.reduce((a, p) => a + (p ? p.o : 55), 0) / st.length + infraBonus();
  }
  const mediaTime = pl => pl && pl.length ? pl.reduce((a, p) => a + p[1], 0) / pl.length : 70;

  /* ---------- Competições (só LoL por enquanto): pontos corridos + playoffs de 6, Bo1/Bo3/Bo5 por força ---------- */
  const probVit = (fa, fb) => 1 / (1 + Math.exp(-(fa - fb) / 4));       // diferença de 4 pontos de força ≈ 73%
  function serie(n, fa, fb) {                                             // melhor de n; devolve [vitoriasA, vitoriasB]
    const alvo = Math.ceil(n / 2); let a = 0, b = 0; const p = probVit(fa, fb);
    while (a < alvo && b < alvo) { if (rnd() < p) a++; else b++; }
    return [a, b];
  }
  function roundRobin(n) { // método do círculo; índice -1 = folga
    const t = []; for (let i = 0; i < n; i++) t.push(i); if (n % 2) t.push(-1);
    const m = t.length, rounds = [];
    for (let r = 0; r < m - 1; r++) {
      const par = []; for (let i = 0; i < m / 2; i++) { const a = t[i], b = t[m - 1 - i]; if (a >= 0 && b >= 0) par.push([a, b]); }
      rounds.push(par); t.splice(1, 0, t.pop());
    }
    return rounds;
  }
  function novaComp(game, sq) {
    const L = region(), list = sq === 't2' ? L.t2 : L.t1;
    const teams = list.map(t => ({ n: t.n, b: mediaTime(t.p), f: mediaTime(t.p), eu: false }));
    teams.push({ n: null, b: 0, f: 0, eu: true });
    return { reg: S.org.regiao, game, sq, teams, phase: 'off', wk: PRE, split: 0, round: 0, sched: [], w: [], l: [], po: null, last: [], hist: [], aviso: false };
  }
  function compFor(game, sq) {
    if (game !== 'lol') return null; const q = S.games[game].squads[sq]; if (!q || !q.on || SQUADS[sq].semDados) return null;
    const k = game + '-' + sq; let c = S.comp[k];
    if (c && c.reg === S.org.regiao) return c;
    return (S.comp[k] = novaComp(game, sq));
  }
  const nome = (c, i) => c.teams[i].eu ? S.org.nome : c.teams[i].n;
  const fDe = (c, i) => c.teams[i].eu ? forca(c.game, c.sq) : c.teams[i].f;
  function classificacao(c) {
    const rows = c.teams.map((t, i) => ({ i, n: nome(c, i), w: c.w[i] || 0, l: c.l[i] || 0, f: fDe(c, i), eu: t.eu }));
    rows.sort((a, b) => b.w - a.w || a.l - b.l || b.f - a.f); rows.forEach((r, k) => { r.pos = k + 1; });
    return rows;
  }
  function iniciarSplit(c) {
    c.split++; c.teams.forEach(t => { if (!t.eu) t.f = t.b + (rnd() * 3 - 1.5); }); // forma do split
    c.sched = roundRobin(c.teams.length); c.round = 0; c.phase = 'reg'; c.po = null;
    c.w = c.teams.map(() => 0); c.l = c.teams.map(() => 0); c.aviso = false;
    log(`${SQUADS[c.sq].nome} (${S.org.regiao}): split ${c.split} começou`);
  }
  function jogo(c, a, b, n, fase, ctx) { // joga uma série; registra se o usuário participou; devolve índice do vencedor
    const [wa, wb] = serie(n, fDe(c, a), fDe(c, b)), venc = wa > wb ? a : b, eu = c.teams.findIndex(t => t.eu);
    if (a === eu || b === eu) {
      const op = a === eu ? b : a, meus = a === eu ? wa : wb, deles = a === eu ? wb : wa;
      c.last.unshift({ s: S.org.semana, y: S.org.ano, op: nome(c, op), v: venc === eu, pl: `${meus}-${deles}`, f: fase }); c.last.length = Math.min(c.last.length, 8);
      if (venc === eu) S.org.caixa += Math.round(SQUADS[c.sq].premio * 0.01);
      ctx.jogou = true;
    }
    return venc;
  }
  function iniciarPlayoffs(c) {
    const seeds = classificacao(c).slice(0, 6).map(r => r.i);
    c.po = { stage: 0, seeds, res: [], lugar: {} };
    c.po.pares = seeds.length >= 6 ? [[seeds[2], seeds[5]], [seeds[3], seeds[4]]] : [[seeds[0], seeds[3]], [seeds[1], seeds[2]]];
    c.po.skipR1 = seeds.length < 6; c.phase = 'po';
    if (seeds.length < 6) c.po.stage = 1;
  }
  function jogarPlayoffs(c, ctx) {
    const po = c.po, eu = c.teams.findIndex(t => t.eu);
    const nomeFase = po.stage === 2 ? 'Final' : (po.stage === 1 ? 'Semifinal' : 'Quartas');
    const bo = po.stage === 2 ? 5 : 3, venc = [], pos = i => po.seeds.indexOf(i);
    for (const [a, b] of po.pares) {
      const w = jogo(c, a, b, bo, 'Playoffs · ' + nomeFase, ctx), l = w === a ? b : a;
      venc.push(w); po.res.push({ st: po.stage, a, b, w });
      po.lugar[l] = po.stage === 2 ? 'vice' : (po.stage === 1 ? 'semi' : 'quartas');
    }
    if (po.stage === 0) { // semifinais: 1º seed enfrenta o pior seed vencedor; 2º enfrenta o outro
      const ord = venc.slice().sort((x, y) => pos(y) - pos(x));
      po.pares = [[po.seeds[0], ord[0]], [po.seeds[1], ord[1]]]; po.stage = 1;
    } else if (po.stage === 1) { po.pares = [[venc[0], venc[1]]]; po.stage = 2; }
    else { finalizar(c, venc[0], eu); }
  }
  function finalizar(c, campeao, eu) {
    const po = c.po; po.lugar[campeao] = 'campeao';
    const vice = Object.keys(po.lugar).find(k => po.lugar[k] === 'vice');
    const meu = po.lugar[eu];
    if (meu) {
      const bolsa = Math.round(SQUADS[c.sq].premio * PREMIO_PCT[meu]); S.org.caixa += bolsa;
      S.org.rep = clamp(S.org.rep + ({ campeao: 0.3, vice: 0.15, semi: 0.08, quartas: 0.04 })[meu] * (c.sq === 't1' ? 1 : 0.3), 0.5, 10);
      log(`${SQUADS[c.sq].nome}: ${({ campeao: 'CAMPEÃO', vice: 'vice-campeão', semi: 'semifinalista', quartas: 'eliminado nas quartas' })[meu]} (+${money(bolsa)})`);
    } else { S.org.rep = clamp(S.org.rep - 0.03 * (c.sq === 't1' ? 1 : 0.3), 0.5, 10); log(`${SQUADS[c.sq].nome}: fora dos playoffs`); }
    c.hist.unshift({ y: S.org.ano, s: c.split, camp: nome(c, campeao), vice: vice != null ? nome(c, +vice) : '', eu: meu || null }); c.hist.length = Math.min(c.hist.length, 12);
    c.phase = 'off'; c.wk = Math.max(2, CICLO - c.sched.length - 3); c.po = null;
  }
  function semanaComp(c) { // devolve true se o time do usuário jogou nesta semana
    const ctx = { jogou: false };
    if (c.phase === 'off') { if (--c.wk > 0) return false; c.phase = 'wait'; }
    if (c.phase === 'wait') {
      if (prontos(c.game, c.sq)) iniciarSplit(c);
      else if (!c.aviso) { c.aviso = true; log(`${SQUADS[c.sq].nome}: split à espera, complete os titulares para se inscrever`); }
      return false;
    }
    if (c.phase === 'reg') {
      for (const [a, b] of c.sched[c.round]) { const w = jogo(c, a, b, 1, 'Rodada ' + (c.round + 1), ctx); c.w[w]++; c.l[w === a ? b : a]++; }
      c.round++; if (c.round >= c.sched.length) iniciarPlayoffs(c);
    } else if (c.phase === 'po') jogarPlayoffs(c, ctx);
    return ctx.jogou;
  }

  /* ---------- Economia semanal e avanço do tempo ---------- */
  function projecao(game) { // receita fixa (patrocínio) e despesas semanais dos times ativos do jogo
    let receita = 0, despesa = upkeepSemanal();
    for (const sq in SQUADS) {
      const q = S.games[game].squads[sq]; if (!q.on) continue;
      receita += Math.round(25000 * S.org.rep * (sq === 't1' ? 1 : 0.2));
      despesa += folha(game, sq);
    }
    return { receita, despesa, saldo: receita - despesa };
  }
  function avancar(semanas) {
    let jogou = false;
    for (let i = 0; i < semanas; i++) {
      let r = 0, d = 0;
      for (const g in GAMES) {
        if (!GAMES[g].ativo) continue;
        const p = projecao(g); r += p.receita; d += p.despesa;
        for (const sq in SQUADS) { const c = compFor(g, sq); if (c && semanaComp(c)) jogou = true; }
      }
      S.org.caixa += r - d;
      S.org.semana++; if (S.org.semana > 52) { S.org.semana = 1; S.org.ano++; }
    }
    save(); return jogou;
  }
  function avancarAteJogo() { // avança semana a semana até o time jogar (no máximo 60 semanas)
    let n = 0;
    while (n < 60) { n++; if (avancar(1)) break; }
    return n;
  }
  function trocarRegiao(k) { S.org.regiao = k; S.comp = {}; save(); }

  root.Org = { GAMES, SQUADS, INFRA, KEY, CICLO, slotsDe, get, set, save, load, reset, log, novoJogo, money, fee, salary, region, poolLol, livres,
    infraNivel, infraBonus, infraCusto, upkeepSemanal, comprarInfra, ativarSquad, contratar, dispensar, folha, forca, titulares, prontos, mediaTime,
    compFor, classificacao, nome, projecao, avancar, avancarAteJogo, trocarRegiao, probVit, serie, roundRobin };
})(typeof window !== 'undefined' ? window : globalThis);
