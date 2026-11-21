/* Núcleo: jogos, estado, save, regras de negócio e simulação de competições. Sem DOM aqui (testável em Node). */
(function (root) {
  'use strict';

  /* ---------- Jogos ---------- */
  /* roles = titulares (o tamanho do time vem daqui), subs = reservas. Só o LoL tem dados e competições por enquanto. */
  const GAMES = {
    lol:      { id: 'lol',      nome: 'League of Legends',   curto: 'LoL',      icone: '⚔️', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'] },
    cs2:      { id: 'cs2',      nome: 'Counter-Strike 2',    curto: 'CS2',      icone: '🔫', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['IGL', 'AWP', 'ENT', 'LUR', 'SUP'] },
    dota2:    { id: 'dota2',    nome: 'Dota 2',              curto: 'Dota 2',   icone: '🛡️', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['POS1', 'POS2', 'POS3', 'POS4', 'POS5'] },
    valorant: { id: 'valorant', nome: 'Valorant',            curto: 'Valorant', icone: '🎯', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['DUE', 'INI', 'CTR', 'SEN', 'FLX'] },
    ff:       { id: 'ff',       nome: 'Free Fire',           curto: 'Free Fire', icone: '🔥', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['IGL', 'RUSH', 'SNP', 'SUP'] },
    r6:       { id: 'r6',       nome: 'Rainbow Six Siege',   curto: 'R6',       icone: '🛰️', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['ENT', 'FLX', 'ANC', 'ROM', 'SUP'] },
    fifa:     { id: 'fifa',     nome: 'EA FC (FIFA)',        curto: 'EA FC',    icone: '⚽', get ativo() { return !!dataOf(this.id); }, subs: 1, roles: ['JOG'] },
    wr:       { id: 'wr',       nome: 'Wild Rift',           curto: 'Wild Rift', icone: '📱', get ativo() { return !!dataOf(this.id); }, subs: 2, roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'] },
  };
  const dataOf = g => { const d = g === 'lol' ? root.LOL : (root.DATA && root.DATA[g]) || null; if (d && !d.inicio) d.inicio = d.leagues.CBLOL ? 'CBLOL' : Object.keys(d.leagues)[0]; return d; };
  const slotsDe = g => GAMES[g].roles.length + GAMES[g].subs;
  /* premio = bolsa do campeonato do nível; licenca = custo para criar o time */
  const SQUADS = {
    t1:   { id: 't1',   nome: 'Time principal (T1)', licenca: 0,      premio: 300000 },
    t2:   { id: 't2',   nome: 'Time T2',             licenca: 250000, premio: 75000 },
    acad: { id: 'acad', nome: 'Academy',             licenca: 150000, premio: 25000 },
  };

  /* Estrutura (gaming house, periféricos, staff...). bonus = pontos de força por nível. */
  const INFRA = [
    { id: 'casa',     nome: 'Gaming house',        icone: '🏠', max: 5, base: 60000, bonus: 0.8, desc: 'Moradia e centro de treino do time.' },
    { id: 'perif',    nome: 'Teclados e mouses',   icone: '⌨️', max: 5, base: 15000, bonus: 0.4, desc: 'Periféricos de ponta para todo o elenco.' },
    { id: 'fone',     nome: 'Fones e monitores',   icone: '🎧', max: 5, base: 12000, bonus: 0.3, desc: 'Áudio e tela com taxa de atualização alta.' },
    { id: 'psi',      nome: 'Psicólogo',           icone: '🧠', max: 3, base: 40000, bonus: 0.6, desc: 'Cuida da cabeça do elenco em fase ruim.' },
    { id: 'nutri',    nome: 'Nutricionista',       icone: '🥗', max: 3, base: 30000, bonus: 0.4, desc: 'Alimentação e sono sob controle.' },
    { id: 'academia', nome: 'Academia',            icone: '🏋️', max: 3, base: 35000, bonus: 0.4, desc: 'Preparo físico e prevenção de lesões.' },
    { id: 'base',     nome: 'Categoria de base', icone: '🌱', max: 5, base: 50000, bonus: 0, desc: 'Revela jovens talentos a cada split (nível maior = jovens melhores).' },
    { id: 'cozinha',  nome: 'Cozinha',             icone: '🍳', max: 3, base: 20000, bonus: 0.3, desc: 'Comida caseira na gaming house.' },
  ];
  /* Loja: ofertas rotativas (a cada 4 semanas). tipo: buff = força temporária; seg = seguidores; merch = renda semanal por N semanas; caixa = dinheiro de patrocinador/sorteio */
  const LOJA = [
    { id: 'lanche',  nome: 'Pizza e integração',   icone: '🍕', tipo: 'buff', f: 0.8, sem: 3, c: 12000,  desc: '+0,8 de força por 3 semanas.' },
    { id: 'boot',    nome: 'Bootcamp intensivo',   icone: '🏕️', tipo: 'buff', f: 1.5, sem: 6, c: 45000,  desc: '+1,5 de força por 6 semanas.' },
    { id: 'coach',   nome: 'Coach convidado',      icone: '🎓', tipo: 'buff', f: 2.2, sem: 4, c: 95000,  desc: '+2,2 de força por 4 semanas.' },
    { id: 'analista',nome: 'Analista de dados',    icone: '📊', tipo: 'buff', f: 1,   sem: 10, c: 60000, desc: '+1 de força por 10 semanas.' },
    { id: 'ads',     nome: 'Campanha de anúncios', icone: '📣', tipo: 'seg', v: 1.12, c: 25000,          desc: '+12% de seguidores agora.' },
    { id: 'influ',   nome: 'Collab com influencer',icone: '🤳', tipo: 'seg', v: 1.3,  c: 70000,          desc: '+30% de seguidores agora.' },
    { id: 'camisa',  nome: 'Linha de camisas',     icone: '👕', tipo: 'merch', pay: 2500, sem: 12, c: 24000, desc: 'Vende R$ 2,5 mil/sem por 12 semanas (retorna R$ 30 mil).' },
    { id: 'skin',    nome: 'Pacote de skins da org', icone: '🎨', tipo: 'merch', pay: 6000, sem: 16, c: 80000, desc: 'Rende R$ 6 mil/sem por 16 semanas (retorna R$ 96 mil).' },
    { id: 'stream',  nome: 'Estúdio de streaming', icone: '🎥', tipo: 'merch', pay: 4500, sem: 20, c: 70000, desc: 'Rende R$ 4,5 mil/sem por 20 semanas (retorna R$ 90 mil).' },
  ];
  const LOJA_N = 5, LOJA_CICLO = 4, BUFF_MAX = 4;
  const INFRA_MULT = 2.6;      // custo de cada nível = base * INFRA_MULT^nivelAtual
  const UPKEEP = 0.004;        // manutenção semanal = 0,4% do total investido
  const CICLO = 26;            // semanas por split (2 splits por ano): jogos + playoffs + entretemporada
  const PRE = 3;               // semanas de pré-temporada no começo do jogo
  const CONTRATO = 104;          // semanas de contrato (2 anos)
  const PREMIO_PCT = { campeao: 1, vice: 0.5, semi: 0.25, quartas: 0.1 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const fee = o => Math.round(15000 * Math.pow(1.3, o - 70) / 1000) * 1000;   // custo de contratação por nota
  const salary = o => Math.round(fee(o) / 50);                                  // salário semanal
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
    return { v: 1, seed: (Date.now() & 0x7fffffff) || 12345, org: { nome: 'Minha Org', caixa: 500000, rep: 1, semana: 1, ano: 2026, regiao: 'CBLOL', logo: { s: '🐺', c: '#7c8cff', f: 'escudo' } }, setup: null, tempo: 0, inicio: 'lol', ordem: [], tent: 0, estrela: null,
             infra: {}, games, comp: {}, ligas: {}, base: {}, patro: [], ofertas: [], ofertaSem: 0, social: { seg: 5000 }, foco: 'nenhum', buff: null, aporte: 0, itens: [], loja: [], lojaSem: 0, evento: null, intlHist: [], log: [] };
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
        s.comp = s.comp || {}; s.ligas = s.ligas || {}; s.base = s.base || {}; s.tempo = s.tempo || 0; s.ordem = s.ordem || []; s.org.logo = s.org.logo || { s: '🐺', c: '#7c8cff', f: 'escudo' }; if (s.setup === undefined) s.setup = null; s.patro = s.patro || []; s.ofertas = s.ofertas || []; s.ofertaSem = s.ofertaSem || 0; s.social = s.social || { seg: 5000 }; s.foco = s.foco || 'nenhum'; s.intlHist = s.intlHist || []; s.seed = s.seed || base.seed; s.infra = s.infra || {}; s.itens = s.itens || []; s.loja = s.loja || []; s.lojaSem = s.lojaSem || 0; s.log = s.log || [];
        S = s; return true;
      }
    } catch (e) {}
    return false;
  }
  function reset() { comecar(); }
  /* ---------- Começo de jogo: logo, nome, jogo inicial e estrela ---------- */
  const aberto = g => S.games[g].aberto !== false;
  const desbloqueio = g => { const i = Math.max(0, S.ordem.indexOf(g)); return { sem: 26 * (i + 1), custo: 150000 * (i + 1) }; };
  function comecar() { S = novoJogo(); S.setup = 'config'; save(); }
  function iniciar(cfg) { // passo de configuração: nome, logo, jogo inicial e região
    const g = cfg.game; if (!GAMES[g] || !GAMES[g].ativo) return { ok: false, msg: 'Jogo inválido.' };
    S.org.nome = (cfg.nome || '').trim().slice(0, 24) || 'Minha Org'; S.org.logo = cfg.logo || S.org.logo; S.org.caixa = 600000;
    const reg = cfg.regiao && dataOf(g).leagues[cfg.regiao] ? cfg.regiao : dataOf(g).inicio;
    S.inicio = g; if (g === 'lol') S.org.regiao = reg; else S.games[g].regiao = reg;
    S.ordem = Object.keys(GAMES).filter(x => x !== g);
    for (const x in GAMES) { S.games[x].aberto = x === g; S.games[x].squads.t1.on = x === g; }
    S.setup = 'estrela'; S.tent = 3; save(); return { ok: true, msg: 'Org criada.' };
  }
  const chanceEstrela = o => Math.max(0.003, 1 / (1 + Math.exp((o - 76) / 3.2))); // nota 70: 87%, 80: 22%, 85: 5%, 91: 1%
  function convidarEstrela(p) {
    if (S.setup !== 'estrela') return { ok: false, msg: 'Fora da hora.' };
    const f = fee(p.o), ch = chanceEstrela(p.o); // estrela entra sem taxa de contratação, por 40% do salário (acredita no projeto)
    if (S.tent <= 0) { if (ch < 0.8) return { ok: false, msg: 'Sem tentativas: escolha alguém mais acessível.' }; }
    else { S.tent--; if (rnd() >= ch) {
      const t = ch < 0.03 ? [`${p.n} riu e desligou a chamada.`, `${p.n} nem respondeu: sua org ainda não existe pro mundo.`, `${p.n}: "quando vocês forem campeões, a gente conversa."`]
        : ch < 0.3 ? [`${p.n} recusou: prefere um projeto mais estabelecido.`, `${p.n} recusou: já tem proposta melhor.`] : [`${p.n} recusou: a proposta não bateu.`, `${p.n} pediu mais tempo e acabou recusando.`];
      save(); return { ok: false, recusou: true, msg: t[Math.floor(rnd() * t.length)] }; } }
    S.org.caixa += f; const r = contratar(S.inicio, 't1', p); S.org.caixa -= f; if (!r.ok) return r;
    const sl = S.games[S.inicio].squads.t1.slots.find(x => x && x.id === p.id); sl.estrela = true; sl.fee = 0;
    S.estrela = { id: p.id, n: p.n, o: p.o }; S.social.seg = 5000 + Math.max(0, p.o - 55) * 500; S.org.rep += Math.max(0, (p.o - 70) / 40);
    S.setup = null; log(`${p.n} aceitou ser a estrela da org!`); save();
    return { ok: true, msg: `${p.n} aceitou ser a estrela da ${S.org.nome}!` };
  }
  function semEstrela() { if (S.setup === 'estrela') { S.setup = null; save(); } return { ok: true, msg: 'Começando sem estrela.' }; }
  function abrirJogo(g) {
    if (aberto(g)) return { ok: false, msg: 'Já aberto.' }; const d = desbloqueio(g);
    if (S.tempo < d.sem) return { ok: false, msg: `Disponível em ${d.sem - S.tempo} semanas.` }; if (S.org.caixa < d.custo) return { ok: false, msg: 'Caixa insuficiente.' };
    S.org.caixa -= d.custo; S.games[g].aberto = true; S.games[g].squads.t1.on = true; log(`Abriu o time de ${GAMES[g].curto}`); save();
    return { ok: true, msg: `Time de ${GAMES[g].nome} aberto!` };
  }
  function log(msg) { S.logN = (S.logN || 0) + 1; S.log.unshift(`S${S.org.semana}/${S.org.ano}: ${msg}`); S.log.length = Math.min(S.log.length, 40); }
  function rnd() { // mulberry32 com estado salvo no jogo (resultados reproduzíveis)
    let t = (S.seed = (S.seed + 0x6D2B79F5) | 0);
    let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }

  /* ---------- Dados ---------- */
  const D = g => dataOf(g);
  const regiaoDe = g => g === 'lol' ? S.org.regiao : (S.games[g].regiao && D(g).leagues[S.games[g].regiao] ? S.games[g].regiao : D(g).inicio);
  const region = (g = 'lol') => D(g).leagues[regiaoDe(g)];
  const _pool = {};
  function pool(g) { // todos os jogadores do dataset do jogo (T1 de todas as ligas + T2 que tiverem elenco)
    if (_pool[g]) return _pool[g];
    const out = [], roles = D(g).roles, id0 = g === 'lol' ? '' : g + '-';
    for (const lg in D(g).leagues) {
      const L = D(g).leagues[lg];
      L.t1.forEach((t, ti) => t.p.forEach((p, i) => out.push({ id: `${id0}${lg}-1-${ti}-${i}`, n: p[0], o: p[1], a: p[2], r: roles[i], t: t.n, l: lg, tier: 'T1' })));
      L.t2.forEach((t, ti) => (t.p || []).forEach((p, i) => p && out.push({ id: `${id0}${lg}-2-${ti}-${i}`, n: p[0], o: p[1], a: p[2], r: roles[i], t: t.n, l: lg, tier: 'T2' })));
    }
    return (_pool[g] = out);
  }
  const poolLol = () => pool('lol');
  function contratados(game) {
    const ids = new Set();
    for (const sq of Object.values(S.games[game].squads)) sq.slots.forEach(p => p && ids.add(p.id));
    return ids;
  }
  function livres(game) { if (!D(game)) return []; const used = contratados(game); return pool(game).filter(p => !used.has(p.id)); }

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
    if (!aberto(game)) return { ok: false, msg: 'Abra este jogo primeiro.' };
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
    q.slots[slot] = { id: player.id, n: player.n, o: player.o, a: player.a, r: player.r, t: player.t, l: player.l, fee: f, ct: CONTRATO };
    S.org.caixa -= f; log(`Contratou ${player.n} (${player.o}) para o ${SQUADS[sq].nome}`); save();
    return { ok: true, msg: `${player.n} contratado${slot >= n ? ' como reserva' : ''}.` };
  }
  function dispensar(game, sq, slot) {
    const q = S.games[game].squads[sq], p = q.slots[slot]; if (!p) return { ok: false, msg: 'Vaga vazia.' };
    if (p.estrela) return { ok: false, msg: 'A estrela da org não pode ser dispensada.' };
    const back = Math.round(p.fee * 0.4); q.slots[slot] = null; S.org.caixa += back; log(`Dispensou ${p.n}`); save();
    return { ok: true, msg: `${p.n} dispensado. Devolução: ${money(back)}.` };
  }
  /* ---------- Patrocínios, redes sociais, foco e eventos ---------- */
  const MARCAS = ['TurboByte', 'Café Pixel', 'NeoBank', 'Lanches Zap', 'Gamer Chair Pro', 'EnergiaMax', 'FibraNet', 'Skin&Co', 'Pixel Drinks', 'Arena Seguros'];
  const EVENTOS = [
    { id: 'collab', txt: 'Um influenciador propõe uma collab com a sua org.', ops: [{ t: 'Aceitar (R$ 20 mil)', c: 20000, f: 'seg', v: 1.15 }, { t: 'Recusar' }] },
    { id: 'viral', txt: 'Um clipe do seu time viralizou!', ops: [{ t: 'Aproveitar a fama', f: 'seg', v: 1.2 }] },
    { id: 'boot', txt: 'Uma empresa oferece um bootcamp de treino.', ops: [{ t: 'Pagar R$ 30 mil (+1,5 de força por 8 semanas)', c: 30000, f: 'buff', v: 1.5 }, { t: 'Recusar' }] },
    { id: 'fisc', txt: 'Fiscalização: imposto atrasado.', ops: [{ t: 'Pagar R$ 15 mil', c: 15000 }, { t: 'Contestar (50%: pagar R$ 30 mil)', f: 'risco' }] },
    { id: 'pol', txt: 'Uma polêmica nas redes envolve um jogador.', ops: [{ t: 'Nota oficial (R$ 8 mil)', c: 8000 }, { t: 'Ignorar (-8% seguidores)', f: 'seg', v: 0.92 }] },
    { id: 'vaq', txt: 'Fãs organizam uma vaquinha para a org.', ops: [{ t: 'Aceitar R$ 10 mil', f: 'caixa', v: 10000 }] },
  ];
  function seguidores(m) { // crescimento com rendimento decrescente (evita bola de neve) e teto de 10 mi
    const g = m > 1 ? 1 + (m - 1) / (1 + S.social.seg / 5e5) : m;
    S.social.seg = clamp(Math.round(S.social.seg * g), 500, 1e7);
  }
  const rendaSocial = () => Math.round(S.social.seg * 0.003);
  const custoFoco = () => S.foco === 'midia' ? 3000 : 0;
  function ofertas() {
    if (!S.ofertas.length) S.ofertas = [0, 1, 2].map(() => ({ id: 'p' + Math.floor(rnd() * 1e9), n: MARCAS[Math.floor(rnd() * MARCAS.length)], pay: Math.round(8000 * Math.pow(S.org.rep, 0.8) * (1 + (S.estrela ? Math.max(0, S.estrela.o - 70) / 100 : 0)) * (0.8 + rnd() * 0.6) / 500) * 500, sem: [26, 52, 78][Math.floor(rnd() * 3)] }));
    return S.ofertas;
  }
  const rendaPatro = () => S.patro.reduce((a, x) => a + x.pay, 0);
  function aceitarPatro(id) {
    const o = ofertas().find(x => x.id === id); if (!o) return { ok: false, msg: 'Oferta expirou.' };
    if (S.patro.length >= 3) return { ok: false, msg: 'Máximo de 3 patrocinadores.' };
    S.ofertas = S.ofertas.filter(x => x !== o); S.patro.push({ id: o.id, n: o.n, pay: o.pay, sem: o.sem }); log(`Patrocínio: ${o.n} (${money(o.pay)}/sem)`); save();
    return { ok: true, msg: `${o.n} fechado: ${money(o.pay)} por semana.` };
  }
  function setFoco(f) { if (!['nenhum', 'treino', 'midia'].includes(f)) return { ok: false, msg: 'Foco inválido.' }; S.foco = f; save(); return { ok: true, msg: 'Foco da semana definido.' }; }
  function escolherEvento(i) {
    const ev = S.evento; if (!ev) return { ok: false, msg: 'Sem evento.' };
    const e = EVENTOS.find(x => x.id === ev.id), op = e.ops[i]; if (!op) return { ok: false, msg: 'Opção inválida.' };
    if (op.c && S.org.caixa < op.c) return { ok: false, msg: 'Caixa insuficiente.' };
    if (op.c) S.org.caixa -= op.c;
    if (op.f === 'seg') seguidores(op.v); else if (op.f === 'buff') S.buff = { f: op.v, sem: 8 }; else if (op.f === 'caixa') S.org.caixa += op.v;
    else if (op.f === 'risco' && rnd() < 0.5) S.org.caixa -= 30000;
    S.evento = null; log(`Evento: ${e.txt.replace(/\.$/, '')} → ${op.t.split(' (')[0]}`); save();
    return { ok: true, msg: 'Decisão tomada.' };
  }
  function semanalOrg() { // roda uma vez por semana, fora dos jogos
    S.patro.forEach(x => x.sem--); const fim = S.patro.filter(x => x.sem <= 0); S.patro = S.patro.filter(x => x.sem > 0); fim.forEach(x => log(`Patrocínio com ${x.n} terminou`));
    seguidores(1 + 0.002 + 0.0004 * S.org.rep + (S.estrela ? Math.max(0, S.estrela.o - 60) * 0.00004 : 0) + (S.foco === 'midia' ? 0.02 : 0));
    if (S.buff && --S.buff.sem <= 0) S.buff = null;
    if (S.aporte > 0) S.aporte--;
    if (S.org.caixa < 0 && !S.aporte && !Object.keys(GAMES).some(g => GAMES[g].ativo && prontos(g, 't1'))) { S.org.caixa += 300000; S.aporte = 52; log('Aporte emergencial: investidores injetaram R$ 300 mil na org'); }
    S.itens.forEach(x => x.sem--); S.itens = S.itens.filter(x => x.sem > 0);
    if (++S.lojaSem >= LOJA_CICLO) { S.lojaSem = 0; S.loja = []; lojaItens(); }
    if (++S.ofertaSem >= 6) { S.ofertaSem = 0; S.ofertas = []; ofertas(); }
    if (S.evento && --S.evento.sem <= 0) { S.evento = null; log('Evento expirou sem decisão'); }
    if (!S.evento && rnd() < 0.12) { const e = EVENTOS[Math.floor(rnd() * EVENTOS.length)]; S.evento = { id: e.id, sem: 4 }; log('Novo evento: ' + e.txt); }
  }
  function renovar(game, sq, slot) {
    const p = S.games[game].squads[sq].slots[slot]; if (!p) return { ok: false, msg: 'Vaga vazia.' };
    const c = Math.round(fee(p.o) * 0.5 / 1000) * 1000; if (S.org.caixa < c) return { ok: false, msg: 'Caixa insuficiente.' };
    S.org.caixa -= c; p.ct = (p.ct || 0) + CONTRATO; log(`Renovou ${p.n} (+2 anos)`); save();
    return { ok: true, msg: `${p.n} renovado por mais 2 anos (${money(c)}).` };
  }
  const custoRenovar = p => Math.round(fee(p.o) * 0.5 / 1000) * 1000;
  function mover(game, de, para, slot) {
    const a = S.games[game].squads[de], b = S.games[game].squads[para], p = a.slots[slot];
    if (!p) return { ok: false, msg: 'Vaga vazia.' }; if (!b.on) return { ok: false, msg: 'Crie o outro time primeiro.' };
    const n = GAMES[game].roles.length, idx = GAMES[game].roles.indexOf(p.r);
    let t = idx >= 0 && !b.slots[idx] ? idx : -1; if (t < 0) for (let i = n; i < b.slots.length; i++) if (!b.slots[i]) { t = i; break; }
    if (t < 0) return { ok: false, msg: 'Sem vaga livre no outro time.' };
    b.slots[t] = p; a.slots[slot] = null; log(`${p.n}: ${SQUADS[de].nome} → ${SQUADS[para].nome}`); save();
    return { ok: true, msg: `${p.n} movido para o ${SQUADS[para].nome}.` };
  }
  const SIL = ['ka','ro','zi','le','mo','tu','vex','dra','ni','sho','bal','tor','xe','pa','ru','fu','gi','lo','ze','ky'];
  function gerarBase() { // ao fim de cada split do T1: a base revela um jovem por jogo (até 3 guardados)
    const nv = infraNivel('base'); if (!nv) return;
    for (const g in GAMES) {
      if (!GAMES[g].ativo || !S.games[g].squads.t1.on) continue;
      const lst = S.base[g] = S.base[g] || []; if (lst.length >= 3) continue;
      const roles = GAMES[g].roles, r = roles[Math.floor(rnd() * roles.length)], o = Math.round(54 + nv * 2.5 + rnd() * 5);
      let n = ''; for (let k = 0, m = 2 + Math.floor(rnd() * 2); k < m; k++) n += SIL[Math.floor(rnd() * SIL.length)];
      lst.push({ id: 'b' + Math.floor(rnd() * 1e9), n: n[0].toUpperCase() + n.slice(1), o, pot: Math.min(88, o + 8 + nv * 2 + Math.floor(rnd() * 6)), a: 16 + Math.floor(rnd() * 3), r, t: 'Base', l: 'Base' });
      log(`Base (${GAMES[g].curto}): revelou ${lst[lst.length - 1].n} (${o}, pot. ${lst[lst.length - 1].pot})`);
    }
  }
  function evoluir() { // fim de split: jogadores jovens evoluem até o potencial
    const up = p => { if (p && p.pot && p.o < p.pot) { p.o = Math.min(p.pot, p.o + 1 + Math.floor(rnd() * 3)); if (p.a != null) p.a = Math.min(p.a + 0, 30); } };
    for (const g in GAMES) { for (const q of Object.values(S.games[g].squads)) q.slots.forEach(up); (S.base[g] || []).forEach(up); }
  }
  function promoverBase(game, sq, id) {
    const lst = S.base[game] || [], i = lst.findIndex(x => x.id === id), q = S.games[game].squads[sq]; if (i < 0) return { ok: false, msg: 'Jovem não encontrado.' };
    if (!q.on) return { ok: false, msg: 'Ative esse time primeiro.' };
    const p = lst[i], n = GAMES[game].roles.length, idx = GAMES[game].roles.indexOf(p.r);
    let t = idx >= 0 && !q.slots[idx] ? idx : -1; if (t < 0) for (let k = n; k < q.slots.length; k++) if (!q.slots[k]) { t = k; break; }
    if (t < 0) return { ok: false, msg: 'Sem vaga livre nesse time.' };
    q.slots[t] = Object.assign({}, p, { fee: 0, ct: CONTRATO }); lst.splice(i, 1); log(`Promoveu ${p.n} da base`); save();
    return { ok: true, msg: `${p.n} promovido da base.` };
  }
  function contratos() { // passa uma semana: contratos vencem e saem do elenco
    for (const g in GAMES) for (const sq in SQUADS) S.games[g].squads[sq].slots.forEach((p, i, arr) => {
      if (!p) return; p.ct = (p.ct === undefined ? CONTRATO : p.ct) - 1;
      if (p.ct === 8) log(`Contrato de ${p.n} acaba em 8 semanas`);
      if (p.ct <= 0) { if (p.estrela) S.estrela = null; arr[i] = null; log(`${p.n} saiu: contrato acabou`); }
    });
  }
  const salarioDe = p => Math.round(salary(p.o) * (p.estrela ? 0.4 : 1));
  const folha = (game, sq) => S.games[game].squads[sq].slots.reduce((a, p) => a + (p ? salarioDe(p) : 0), 0);
  const titulares = (game, sq) => S.games[game].squads[sq].slots.slice(0, GAMES[game].roles.length);
  const prontos = (game, sq) => { const q = S.games[game].squads[sq]; return q.on && titulares(game, sq).every(Boolean); };
  function forca(game, sq) { // média dos titulares (vaga vazia vale 55) + bônus da estrutura
    const st = titulares(game, sq);
    return st.reduce((a, p) => a + (p ? p.o : 55), 0) / st.length + infraBonus() + bonusTemp();
  }
  const bonusTemp = () => Math.min(BUFF_MAX, (S.foco === 'treino' ? 1 : 0) + (S.buff ? S.buff.f : 0) + S.itens.reduce((a, x) => a + (x.f || 0), 0));
  const rendaMerch = () => S.itens.reduce((a, x) => a + (x.pay || 0), 0);
  function lojaItens() { // 5 itens sorteados do catálogo, renovados a cada 4 semanas
    if (!S.loja.length) { const ids = LOJA.map(x => x.id); S.loja = []; while (S.loja.length < LOJA_N) S.loja.push(ids.splice(Math.floor(rnd() * ids.length), 1)[0]); }
    return S.loja.map(id => LOJA.find(x => x.id === id));
  }
  function comprarLoja(id) {
    const it = lojaItens().find(x => x && x.id === id); if (!it) return { ok: false, msg: 'Item fora de estoque.' };
    if (S.org.caixa < it.c) return { ok: false, msg: 'Caixa insuficiente.' };
    if (it.tipo !== 'seg' && S.itens.some(x => x.id === id)) return { ok: false, msg: 'Você já tem esse item ativo.' };
    S.org.caixa -= it.c;
    if (it.tipo === 'seg') seguidores(it.v); else S.itens.push({ id: it.id, nome: it.nome, f: it.f || 0, pay: it.pay || 0, sem: it.sem });
    S.loja = S.loja.filter(x => x !== id); log(`Loja: ${it.nome}`); save();
    return { ok: true, msg: `${it.nome} comprado.` };
  }
  const mediaTime = pl => pl && pl.length ? pl.reduce((a, p) => a + p[1], 0) / pl.length : 70;

  /* ---------- Competições (só LoL por enquanto) ---------- */
  /* Liga regional: pontos corridos (Bo1) + playoffs dos 6 primeiros (quartas Bo3, semis Bo3, final Bo5).
     Depois do split 1 de cada ano há MSI (8 times) e depois do split 2 o Mundial (16 times): só o T1 da org disputa.
     No fim do ano o pior time da IA do T1 é rebaixado e o melhor do T2 é promovido (na região da org).
     Resultado de cada jogo: força do elenco (+ estrutura) com sorteio por semente. */
  const INTL = {
    MSI:    { nome: 'MSI',    bolsa: 600000, rep: 0.4, semanas: 3, vagas: { LCK: 2, LPL: 2, LEC: 1, LCS: 1, CBLOL: 1, LCP: 1 } },
    WORLDS: { nome: 'Mundial', bolsa: 1500000, rep: 0.8, semanas: 4, vagas: { LCK: 3, LPL: 3, LEC: 3, LCS: 2, CBLOL: 2, LCP: 3 } },
  };
  const PCT_INTL = { campeao: 1, vice: 0.5, semi: 0.25, quartas: 0.1, oitavas: 0.04 };
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
  /* membros de cada divisão na região da org: d1 = T1, d2 = T2, d3 = Academy (times "Academy" gerados dos T1) */
  function ligaSync(g = 'lol') {
    const k = regiaoDe(g); S.ligas = S.ligas || {}; if (S.ligas[g] && S.ligas[g].reg === k) return S.ligas[g];
    const L = region(g), cp = t => ({ n: t.n, b: mediaTime(t.p), p: t.p || null });
    return (S.ligas[g] = { reg: k, d1: L.t1.map(cp), d2: L.t2.map(cp), d3: L.t1.map(t => ({ n: t.n + ' Academy', b: Math.max(60, mediaTime(t.p) - 8), p: null })) });
  }
  const divDe = (g, sq) => { const Lg = ligaSync(g); return sq === 't1' ? Lg.d1 : sq === 't2' ? Lg.d2 : Lg.d3; };
  const timesDe = (g, sq) => divDe(g, sq).map(t => ({ n: t.n, b: t.b, f: t.b, eu: false })).concat([{ n: null, b: 0, f: 0, eu: true }]);
  function novaComp(game, sq) {
    return { reg: regiaoDe(game), game, sq, teams: timesDe(game, sq), phase: 'off', wk: PRE, split: 0, round: 0, sched: [], w: [], l: [], po: null, intl: null, last: [], hist: [], aviso: false };
  }
  function compFor(game, sq) {
    if (!D(game)) return null; const q = S.games[game].squads[sq]; if (!q || !q.on || SQUADS[sq].semDados) return null;
    const k = game + '-' + sq; let c = S.comp[k];
    if (c && c.reg === regiaoDe(game)) return c;
    return (S.comp[k] = novaComp(game, sq));
  }
  const nomeT = t => t.eu ? S.org.nome : t.n;
  const nome = (c, i) => nomeT(c.teams[i]);
  const fT = (c, t) => t.eu ? forca(c.game, c.sq) : t.f;
  function classificacao(c) {
    const rows = c.teams.map((t, i) => ({ i, n: nomeT(t), w: c.w[i] || 0, l: c.l[i] || 0, f: fT(c, t), eu: t.eu }));
    rows.sort((a, b) => b.w - a.w || a.l - b.l || b.f - a.f); rows.forEach((r, k) => { r.pos = k + 1; });
    return rows;
  }
  function iniciarSplit(c) {
    c.split++; c.teams = timesDe(c.game, c.sq); c.teams.forEach(t => { if (!t.eu) t.f = t.b + (rnd() * 3 - 1.5); }); // forma do split
    c.sched = roundRobin(c.teams.length); c.round = 0; c.phase = 'reg'; c.po = null;
    c.w = c.teams.map(() => 0); c.l = c.teams.map(() => 0); c.aviso = false;
    log(`${GAMES[c.game].curto} ${SQUADS[c.sq].nome} (${c.reg}): split ${c.split} começou`);
  }
  function jogo(c, T, a, b, n, fase, ctx, bonus) { // joga uma série entre T[a] e T[b]; registra se o usuário participou; devolve o vencedor
    const [wa, wb] = serie(n, fT(c, T[a]), fT(c, T[b])), venc = wa > wb ? a : b, eu = T.findIndex(t => t.eu);
    if (a === eu || b === eu) {
      const op = a === eu ? b : a, meus = a === eu ? wa : wb, deles = a === eu ? wb : wa;
      c.last.unshift({ s: S.org.semana, y: S.org.ano, op: nomeT(T[op]), v: venc === eu, pl: `${meus}-${deles}`, f: fase }); c.last.length = Math.min(c.last.length, 8);
      seguidores(venc === eu ? 1.012 : 0.997);
      if (bonus && venc === eu) S.org.caixa += Math.round(SQUADS[c.sq].premio * 0.01);
      ctx.jogou = true;
    }
    return venc;
  }
  function iniciarPlayoffs(c) {
    const rs = classificacao(c).map(r => r.i), seeds = rs.slice(0, 6);
    c.po = { stage: 0, seeds, rs, res: [], lugar: {} };
    c.po.pares = [[seeds[2], seeds[5]], [seeds[3], seeds[4]]]; c.phase = 'po';
  }
  function jogarPlayoffs(c, ctx) {
    const po = c.po, eu = c.teams.findIndex(t => t.eu);
    const nomeFase = po.stage === 2 ? 'Final' : (po.stage === 1 ? 'Semifinal' : 'Quartas');
    const bo = po.stage === 2 ? 5 : 3, venc = [], pos = i => po.seeds.indexOf(i);
    for (const [a, b] of po.pares) {
      const w = jogo(c, c.teams, a, b, bo, 'Playoffs · ' + nomeFase, ctx, true), l = w === a ? b : a;
      venc.push(w); po.res.push({ st: po.stage, a, b, w });
      po.lugar[l] = po.stage === 2 ? 'vice' : (po.stage === 1 ? 'semi' : 'quartas');
    }
    if (po.stage === 0) { // semifinais: 1º seed enfrenta o pior seed vencedor; 2º enfrenta o outro
      const ord = venc.slice().sort((x, y) => pos(y) - pos(x));
      po.pares = [[po.seeds[0], ord[0]], [po.seeds[1], ord[1]]]; po.stage = 1;
    } else if (po.stage === 1) { po.pares = [[venc[0], venc[1]]]; po.stage = 2; }
    else finalizar(c, venc[0], eu);
  }
  function finalizar(c, campeao, eu) {
    const po = c.po; po.lugar[campeao] = 'campeao';
    const vice = +Object.keys(po.lugar).find(k => po.lugar[k] === 'vice');
    const meu = po.lugar[eu]; if (meu === 'campeao') seguidores(1.25);
    if (meu) {
      const bolsa = Math.round(SQUADS[c.sq].premio * PREMIO_PCT[meu]); S.org.caixa += bolsa;
      S.org.rep = clamp(S.org.rep + ({ campeao: 0.3, vice: 0.15, semi: 0.08, quartas: 0.04 })[meu] * (c.sq === 't1' ? 1 : 0.3), 0.5, 10);
      log(`${GAMES[c.game].curto} ${SQUADS[c.sq].nome}: ${({ campeao: 'CAMPEÃO', vice: 'vice-campeão', semi: 'semifinalista', quartas: 'eliminado nas quartas' })[meu]} (+${money(bolsa)})`);
    } else { S.org.rep = clamp(S.org.rep - 0.03 * (c.sq === 't1' ? 1 : 0.3), 0.5, 10); log(`${GAMES[c.game].curto} ${SQUADS[c.sq].nome}: fora dos playoffs`); }
    c.hist.unshift({ y: S.org.ano, s: c.split, camp: nome(c, campeao), vice: nome(c, vice), eu: meu || null }); c.hist.length = Math.min(c.hist.length, 12);
    const pr = i => po.rs.indexOf(i), com = k => Object.keys(po.lugar).filter(x => po.lugar[x] === k).map(Number).sort((x, y) => pr(x) - pr(y));
    const ordem = [campeao, vice].concat(com('semi'), com('quartas'), po.rs.filter(i => !(i in po.lugar) && i !== campeao));
    c.po = null; c.phase = 'off'; if (c.sq === 't1') { gerarBase(); evoluir(); } c.wk = Math.max(2, CICLO - c.sched.length - 3);
    if (c.sq === 't1') { const ks = Object.keys(intlDef(c.game)); iniciarIntl(c, c.split % 2 === 1 ? ks[0] : ks[1], ordem); }
  }
  /* liga de outra região (ou divisão) simulada de uma vez; devolve a ordem final dos índices (campeão primeiro) */
  function simRapida(times) {
    const n = times.length, w = Array(n).fill(0);
    for (const rd of roundRobin(n)) for (const [a, b] of rd) { const [x, y] = serie(1, times[a].f, times[b].f); w[x > y ? a : b]++; }
    const rs = times.map((_, i) => i).sort((a, b) => w[b] - w[a] || times[b].f - times[a].f), s = rs.slice(0, 6);
    const v = (a, b, bo) => { const [x, y] = serie(bo, times[a].f, times[b].f); return x > y ? a : b; };
    const q1 = v(s[2], s[5], 3), q2 = v(s[3], s[4], 3), ord = [q1, q2].sort((x, y) => s.indexOf(y) - s.indexOf(x));
    const f1 = v(s[0], ord[0], 3), f2 = v(s[1], ord[1], 3), camp = v(f1, f2, 5), vice = camp === f1 ? f2 : f1;
    const semis = [s[0], ord[0], s[1], ord[1]].filter(x => x !== f1 && x !== f2).sort((x, y) => rs.indexOf(x) - rs.indexOf(y));
    const quartas = [q1, q2].map((x, k) => [s[2], s[3]][k] === x ? [s[5], s[4]][k] : [s[2], s[3]][k]).sort((x, y) => rs.indexOf(x) - rs.indexOf(y));
    const dentro = new Set([camp, vice, ...semis, ...quartas]);
    return [camp, vice, ...semis, ...quartas, ...rs.filter(i => !dentro.has(i))];
  }
  const intlDef = g => g === 'lol' ? INTL : D(g).intl;
  function sortear(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function iniciarIntl(c, tipo, ordem) {
    const I = intlDef(c.game)[tipo], q = [];
    for (const reg in I.vagas) {
      if (reg === c.reg) ordem.slice(0, I.vagas[reg]).forEach(i => { const t = c.teams[i]; q.push(t.eu ? { n: null, f: 0, eu: true, reg } : { n: t.n, f: t.f, eu: false, reg }); });
      else {
        const times = D(c.game).leagues[reg].t1.map(t => ({ n: t.n, f: mediaTime(t.p) + rnd() * 3 - 1.5 }));
        simRapida(times).slice(0, I.vagas[reg]).forEach(i => q.push({ n: times[i].n, f: times[i].f, eu: false, reg }));
      }
    }
    const T = sortear(q), intl = { tipo, teams: T, alive: T.map((_, i) => i), res: [], lugar: {} };
    if (T.some(t => t.eu)) { c.intl = intl; c.phase = 'intl'; log(`${GAMES[c.game].curto}: classificado para o ${I.nome}!`); return; }
    c.intl = intl; while (intl.alive.length > 1) etapaIntl(c, intl, { jogou: false }); finalizarIntl(c, intl);
  }
  function etapaIntl(c, intl, ctx) {
    const n = intl.alive.length, I = intlDef(c.game)[intl.tipo], fase = n === 2 ? 'Final' : n === 4 ? 'Semifinal' : n === 8 ? 'Quartas' : 'Oitavas', bo = n <= 4 ? 5 : 3, venc = [];
    for (let k = 0; k < n; k += 2) {
      const a = intl.alive[k], b = intl.alive[k + 1], w = jogo(c, intl.teams, a, b, bo, I.nome + ' · ' + fase, ctx, false);
      venc.push(w); intl.res.push({ st: fase, a, b, w }); intl.lugar[w === a ? b : a] = n === 2 ? 'vice' : n === 4 ? 'semi' : n === 8 ? 'quartas' : 'oitavas';
    }
    intl.alive = venc;
  }
  function finalizarIntl(c, intl) {
    const I = intlDef(c.game)[intl.tipo], camp = intl.alive[0], eu = intl.teams.findIndex(t => t.eu); intl.lugar[camp] = 'campeao';
    const meu = intl.lugar[eu]; if (meu === 'campeao') seguidores(1.5);
    if (meu) {
      const bolsa = Math.round(I.bolsa * PCT_INTL[meu]); S.org.caixa += bolsa; S.org.rep = clamp(S.org.rep + I.rep * PCT_INTL[meu] * 2, 0.5, 10);
      log(`${GAMES[c.game].curto} ${I.nome}: ${({ campeao: 'CAMPEÃO', vice: 'vice-campeão', semi: 'semifinalista', quartas: 'eliminado nas quartas', oitavas: 'eliminado nas oitavas' })[meu]} (+${money(bolsa)})`);
    } else log(`${GAMES[c.game].curto} ${I.nome} ${S.org.ano}: campeão ${nomeT(intl.teams[camp])}`);
    S.intlHist = S.intlHist || []; S.intlHist.unshift({ g: c.game, nome: I.nome, y: S.org.ano, tipo: intl.tipo, camp: nomeT(intl.teams[camp]), reg: intl.teams[camp].reg, eu: meu || null }); S.intlHist.length = Math.min(S.intlHist.length, 30);
    c.intl = null; c.phase = 'off'; c.wk = Math.max(2, CICLO - c.sched.length - 3 - I.semanas);
    if (intl.tipo === Object.keys(intlDef(c.game))[1]) promoRebaixa(c);
  }
  function promoRebaixa(c) { // fim do ano: pior time da IA do T1 cai; o melhor do T2 (IA) sobe
    const Lg = ligaSync(c.game); if (!Lg.d2.length) return;
    const rs = c.teams.length ? classificacao(c).map(r => r.i) : [], pior = rs.slice().reverse().map(i => c.teams[i]).find(t => !t.eu);
    let sobe = null; const c2 = S.comp[c.game + '-t2'];
    if (c2 && c2.hist.length && c2.hist[0].y === S.org.ano && Lg.d2.some(t => t.n === c2.hist[0].camp)) sobe = c2.hist[0].camp;
    if (!sobe) { const times = Lg.d2.map(t => ({ n: t.n, f: t.b + rnd() * 3 - 1.5 })); sobe = times[simRapida(times)[0]].n; }
    const out = pior && Lg.d1.find(t => t.n === pior.n), up = Lg.d2.find(t => t.n === sobe);
    if (!out || !up) return;
    Lg.d1 = Lg.d1.filter(t => t !== out).concat([up]); Lg.d2 = Lg.d2.filter(t => t !== up).concat([out]);
    log(`Fim do ano: ${up.n} sobe para o T1 e ${out.n} cai para o T2`);
  }
  /* ---------- Calendário: datas e agenda do usuário ---------- */
  const MDN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  function dataDe(semana, ano, dia) { // cada semana tem 7 dias; o jogo é no sábado (dia = 6). Devolve {d, m, y, doy}
    let doy = Math.min(365, (semana - 1) * 7 + (dia || 6)), m = 0; const doy0 = doy;
    while (doy > MDN[m]) { doy -= MDN[m]; m++; }
    return { d: doy, m, y: ano, doy: doy0, txt: `${doy} ${MES[m]}` };
  }
  function emSemanas(em) { const abs = S.org.semana + em; return { semana: ((abs - 1) % 52) + 1, ano: S.org.ano + Math.floor((abs - 1) / 52) }; }
  function agenda(game, sq, n) { // próximos compromissos do usuário (em = semanas a partir de agora)
    const c = compFor(game, sq); if (!c) return []; n = n || 8;
    const eu = c.teams.findIndex(t => t.eu), out = [], push = (em, tipo, label, op) => { const w = emSemanas(em); out.push({ em, tipo, label, op: op || null, semana: w.semana, ano: w.ano, data: dataDe(w.semana, w.ano) }); };
    const rounds = Math.max(1, c.teams.length - 1 + (c.teams.length % 2 ? 0 : 0)), tot = c.sched.length || (c.teams.length % 2 ? c.teams.length : c.teams.length - 1);
    let em0, k0 = 0, split = c.split;
    if (c.phase === 'off') { em0 = c.wk + 1; split++; push(c.wk, 'ini', `Início do split ${split}`); }
    else if (c.phase === 'wait') { em0 = 2; split++; push(1, 'ini', `Início do split ${split}`); }
    else if (c.phase === 'reg') { em0 = 1; k0 = c.round; }
    let em = em0;
    if (em0 !== undefined) {
      for (let k = k0; k < tot; k++, em++) {
        const par = (c.sched[k] || []).find(([a, b]) => a === eu || b === eu), op = par ? c.teams[par[0] === eu ? par[1] : par[0]] : null;
        if (c.sched[k] && !par) { push(em, 'folga', `Rodada ${k + 1}`, 'Folga'); continue; }
        push(em, 'jogo', `Rodada ${k + 1}`, op ? nomeT(op) : null);
      }
      ['Quartas', 'Semifinal', 'Final'].forEach((f, i) => push(em + i, 'po', `Playoffs · ${f}`, 'se classificar'));
      em += 3;
    } else if (c.phase === 'po') {
      const st = c.po.stage; ['Quartas', 'Semifinal', 'Final'].forEach((f, i) => { if (i >= st) push(i - st + 1, 'po', `Playoffs · ${f}`, i === st ? 'a seguir' : null); });
      em = 3 - st + 1;
    } else if (c.phase === 'intl') { push(1, 'int', intlDef(c.game)[c.intl.tipo].nome, c.intl.alive.length + ' times vivos'); em = 2; }
    if (c.sq === 't1' && c.phase !== 'intl') { const ks = Object.keys(intlDef(c.game)), I = intlDef(c.game)[ks[(c.phase === 'reg' || c.phase === 'po' ? c.split : split) % 2 === 1 ? 0 : 1]]; push(em, 'int', I.nome, 'se classificar'); }
    return out.filter(x => x.em >= 1).slice(0, n);
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
      for (const [a, b] of c.sched[c.round]) { const w = jogo(c, c.teams, a, b, 1, 'Rodada ' + (c.round + 1), ctx, true); c.w[w]++; c.l[w === a ? b : a]++; }
      c.round++; if (c.round >= c.sched.length) iniciarPlayoffs(c);
    } else if (c.phase === 'po') jogarPlayoffs(c, ctx);
    else if (c.phase === 'intl') { etapaIntl(c, c.intl, ctx); if (c.intl.alive.length === 1) finalizarIntl(c, c.intl); }
    return ctx.jogou;
  }

  /* ---------- Economia semanal e avanço do tempo ---------- */
  function projecao(game) { // receita de patrocínio-base (só de times com titulares completos) e folha do jogo
    let receita = 0, despesa = 0;
    for (const sq in SQUADS) {
      const q = S.games[game].squads[sq]; if (!q.on) continue;
      if (prontos(game, sq)) receita += Math.round(8000 * Math.pow(S.org.rep, 0.5) * (sq === 't1' ? 1 : 0.2));
      despesa += folha(game, sq);
    }
    return { receita, despesa, saldo: receita - despesa };
  }
  function projecaoOrg() { // total semanal da org: todos os jogos + patrocínios + redes - foco - manutenção
    let receita = rendaPatro() + rendaSocial() + rendaMerch(), despesa = upkeepSemanal() + custoFoco();
    for (const g in GAMES) if (GAMES[g].ativo) { const p = projecao(g); receita += p.receita; despesa += p.despesa; }
    return { receita, despesa, saldo: receita - despesa };
  }
  function avancar(semanas) {
    let jogou = false;
    for (let i = 0; i < semanas; i++) {
      S.org.caixa += projecaoOrg().saldo;
      for (const g in GAMES) { if (!GAMES[g].ativo) continue; for (const sq in SQUADS) { const c = compFor(g, sq); if (c && semanaComp(c)) jogou = true; } }
      contratos(); semanalOrg(); S.tempo++;
      S.org.semana++; if (S.org.semana > 52) { S.org.semana = 1; S.org.ano++; }
    }
    save(); return jogou;
  }
  /* Avanço contínuo: o UI chama passo() em loop e para quando vier um motivo (evento, contrato, fim de split, etc.) ou o jogador parar */
  const IMPORTANTE = /Contrato|saiu|terminou|revelou|classificado|CAMPE|vice-|semifinalista|eliminado|fora dos playoffs|Fim do ano|Novo evento|Abriu|aceitou|split \d+ começou|split à espera|pode ser aberto|promoveu/i;
  function passo() {
    const n0 = S.logN || 0, tinhaEv = !!S.evento, jogou = avancar(1);
    for (const g of S.ordem) if (!aberto(g) && S.tempo === desbloqueio(g).sem) log(`${GAMES[g].nome} já pode ser aberto (aba do jogo)`);
    const novas = S.log.slice(0, Math.min((S.logN || 0) - n0, S.log.length));
    let motivo = null;
    if (S.evento && !tinhaEv) motivo = 'Novo evento: decida na aba Negócios.';
    else if (S.org.caixa < 0) motivo = 'Caixa negativo!';
    else { const l = novas.find(x => IMPORTANTE.test(x)); if (l) motivo = l.replace(/^S\d+\/\d+: /, ''); }
    return { jogou, motivo, semana: S.org.semana, ano: S.org.ano };
  }
  function avancarAteJogo() { // avança semana a semana até o time jogar (no máximo 60 semanas)
    let n = 0;
    while (n < 60) { n++; if (avancar(1)) break; }
    return n;
  }
  function trocarRegiao(k, g = 'lol') {
    if (g === 'lol') S.org.regiao = k; else S.games[g].regiao = k;
    for (const key in S.comp) if (key.startsWith(g + '-')) delete S.comp[key];
    S.ligas = S.ligas || {}; delete S.ligas[g]; save();
  }

  root.Org = { LOJA, lojaItens, comprarLoja, rendaMerch, GAMES, SQUADS, INFRA, KEY, CICLO, slotsDe, get, set, save, load, reset, log, novoJogo, money, fee, salary, region, poolLol, pool, regiaoDe, dataOf, intlDef, livres,
    infraNivel, infraBonus, infraCusto, upkeepSemanal, projecaoOrg, salarioDe, passo, agenda, dataDe, emSemanas, MES, MDN, comecar, iniciar, convidarEstrela, semEstrela, abrirJogo, aberto, desbloqueio, chanceEstrela, comprarInfra, ativarSquad, contratar, ofertas, aceitarPatro, setFoco, escolherEvento, EVENTOS, rendaPatro, rendaSocial, custoFoco, bonusTemp, renovar, custoRenovar, mover, promoverBase, CONTRATO, dispensar, folha, forca, titulares, prontos, mediaTime,
    compFor, classificacao, nome, nomeT, ligaSync, INTL, simRapida, projecao, avancar, avancarAteJogo, trocarRegiao, probVit, serie, roundRobin };
})(typeof window !== 'undefined' ? window : globalThis);
