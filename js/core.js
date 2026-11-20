/* Núcleo: jogos, estado, save, regras de negócio. Sem DOM aqui (testável em Node). */
(function (root) {
  'use strict';

  /* ---------- Jogos (só o LoL tem dados e está ativo; os outros são esqueleto) ---------- */
  const GAMES = {
    lol:      { id: 'lol',      nome: 'League of Legends', curto: 'LoL',      icone: '⚔️', ativo: true,  roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'] },
    cs2:      { id: 'cs2',      nome: 'Counter-Strike 2',  curto: 'CS2',      icone: '🔫', ativo: false, roles: ['IGL', 'AWP', 'ENT', 'LUR', 'SUP'] },
    dota2:    { id: 'dota2',    nome: 'Dota 2',            curto: 'Dota 2',   icone: '🛡️', ativo: false, roles: ['POS1', 'POS2', 'POS3', 'POS4', 'POS5'] },
    valorant: { id: 'valorant', nome: 'Valorant',          curto: 'Valorant', icone: '🎯', ativo: false, roles: ['DUE', 'INI', 'CTR', 'SEN', 'FLX'] },
  };
  /* Times da org dentro de cada jogo. T1 e T2 usam dados do BrasLOL; Academy ainda não tem dados. */
  const SQUADS = {
    t1:   { id: 't1',   nome: 'Time principal (T1)', licenca: 0,       premio: 120000 },
    t2:   { id: 't2',   nome: 'Time T2',             licenca: 250000,  premio: 30000 },
    acad: { id: 'acad', nome: 'Academy',             licenca: 150000,  premio: 10000, semDados: true },
  };
  const SLOTS = 7; // 5 titulares (um por função) + 2 reservas

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
    const squads = () => ({
      t1: { on: true, slots: Array(SLOTS).fill(null) },
      t2: { on: false, slots: Array(SLOTS).fill(null) },
      acad: { on: false, slots: Array(SLOTS).fill(null) },
    });
    const games = {};
    for (const g in GAMES) games[g] = { squads: squads() };
    return { v: 1, org: { nome: 'Minha Org', caixa: 500000, rep: 1, semana: 1, ano: 2026, regiao: 'CBLOL' },
             infra: {}, games, log: [] };
  }
  let S = novoJogo();
  const get = () => S;
  const set = s => { S = s; };
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === 1 && s.org && s.games) { // completa campos novos se faltarem
        const base = novoJogo();
        for (const g in base.games) if (!s.games[g]) s.games[g] = base.games[g];
        S = s; return true;
      }
    } catch (e) {}
    return false;
  }
  function reset() { S = novoJogo(); save(); }
  function log(msg) { S.log.unshift(`S${S.org.semana}/${S.org.ano}: ${msg}`); S.log.length = Math.min(S.log.length, 30); }

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
      L.t2.forEach((t, ti) => (t.p || []).forEach((p, i) => out.push({ id: `${lg}-2-${ti}-${i}`, n: p[0], o: p[1], a: p[2], r: roles[i], t: t.n, l: lg, tier: 'T2' })));
    }
    return (_pool = out);
  }
  function contratados(game) {
    const ids = new Set();
    for (const sq of Object.values(S.games[game].squads)) sq.slots.forEach(p => p && ids.add(p.id));
    return ids;
  }
  function livres(game) { const used = contratados(game); return poolLol().filter(p => !used.has(p.id)); }

  /* ---------- Regras ---------- */
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
    const idx = GAMES[game].roles.indexOf(player.r);
    let slot = idx >= 0 && !q.slots[idx] ? idx : -1;
    if (slot < 0) slot = q.slots[5] ? (q.slots[6] ? -1 : 6) : 5;
    if (slot < 0) return { ok: false, msg: 'Titular da função e reservas já ocupados.' };
    q.slots[slot] = { id: player.id, n: player.n, o: player.o, a: player.a, r: player.r, t: player.t, l: player.l, fee: f };
    S.org.caixa -= f; log(`Contratou ${player.n} (${player.o}) para o ${SQUADS[sq].nome}`); save();
    return { ok: true, msg: `${player.n} contratado${slot > 4 ? ' como reserva' : ''}.` };
  }
  function dispensar(game, sq, slot) {
    const q = S.games[game].squads[sq], p = q.slots[slot]; if (!p) return { ok: false, msg: 'Vaga vazia.' };
    const back = Math.round(p.fee * 0.4); q.slots[slot] = null; S.org.caixa += back; log(`Dispensou ${p.n}`); save();
    return { ok: true, msg: `${p.n} dispensado. Devolução: ${money(back)}.` };
  }
  const folha = (game, sq) => S.games[game].squads[sq].slots.reduce((a, p) => a + (p ? salary(p.o) : 0), 0);
  function forca(game, sq) { // média dos 5 titulares (vaga vazia vale 55) + bônus da estrutura
    const st = S.games[game].squads[sq].slots.slice(0, 5);
    return st.reduce((a, p) => a + (p ? p.o : 55), 0) / 5 + infraBonus();
  }
  const timeForca = pl => pl.reduce((a, p) => a + p[1], 0) / Math.max(1, pl.length);
  function tabela(game, sq) { // ranking por força na liga da região (provisório: ainda não há partidas)
    const L = region(); const times = sq === 't2' ? L.t2 : L.t1;
    const rows = times.map(t => ({ n: t.n, f: t.p ? timeForca(t.p) : 70, eu: false }));
    rows.push({ n: S.org.nome, f: forca(game, sq), eu: true });
    rows.sort((a, b) => b.f - a.f); rows.forEach((r, i) => r.pos = i + 1);
    return rows;
  }
  function projecao(game) { // receita/despesa semanal projetada (só times ativos do jogo)
    let receita = 0, despesa = upkeepSemanal();
    for (const sq in SQUADS) {
      const q = S.games[game].squads[sq]; if (!q.on) continue;
      const rows = tabela(game, sq), me = rows.find(r => r.eu), N = rows.length;
      receita += Math.round(SQUADS[sq].premio * Math.pow((N - me.pos) / (N - 1), 2));
      receita += Math.round(25000 * S.org.rep * (sq === 't1' ? 1 : 0.2));
      despesa += folha(game, sq);
    }
    return { receita, despesa, saldo: receita - despesa };
  }
  function avancar(semanas) {
    for (let i = 0; i < semanas; i++) {
      let r = 0, d = 0;
      for (const g in GAMES) { if (!GAMES[g].ativo) continue; const p = projecao(g); r += p.receita; d += p.despesa;
        const t1 = S.games[g].squads.t1; if (t1.on) { const me = tabela(g, 't1').find(x => x.eu); const N = tabela(g, 't1').length;
          S.org.rep = clamp(S.org.rep + (me.pos <= 3 ? 0.02 : me.pos > N / 2 ? -0.005 : 0.005), 0.5, 10); } }
      S.org.caixa += r - d;
      S.org.semana++; if (S.org.semana > 52) { S.org.semana = 1; S.org.ano++; }
      log(`Receita ${money(r)}, despesa ${money(d)}`);
    }
    save();
  }

  root.Org = { GAMES, SQUADS, INFRA, SLOTS, KEY, get, set, save, load, reset, log, novoJogo, money, fee, salary, region, poolLol, livres,
    infraNivel, infraBonus, infraCusto, upkeepSemanal, comprarInfra, ativarSquad, contratar, dispensar, folha, forca, tabela, projecao, avancar };
})(typeof window !== 'undefined' ? window : globalThis);
