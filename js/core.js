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
  const dataOf = g => { mundoSync(); const d = g === 'lol' ? root.LOL : (root.DATA && root.DATA[g]) || null; if (d && !d.inicio) d.inicio = d.leagues.CBLOL ? 'CBLOL' : Object.keys(d.leagues)[0]; return d; };
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
    const J = { v: 1, seed: (Date.now() & 0x7fffffff) || 12345, org: { nome: 'Minha Org', caixa: 500000, rep: 1, semana: 1, ano: 2026, regiao: 'CBLOL', logo: { s: '🐺', c: '#7c8cff', f: 'escudo' } }, setup: null, tempo: 0, inicio: 'lol', ordem: [], tent: 0, estrela: null,
             infra: {}, games, comp: {}, ligas: {}, base: {}, patro: [], ofertas: [], ofertaSem: 0, social: { seg: 5000 }, foco: 'nenhum', buff: null, aporte: 0, itens: [], loja: [], lojaSem: 0, evento: null, intlHist: [], log: [] };
    J.mundo = novoMundo(J.org.ano); return J;
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
        s.comp = s.comp || {}; s.ligas = s.ligas || {}; s.base = s.base || {}; s.tempo = s.tempo || 0; s.ordem = s.ordem || []; s.org.logo = s.org.logo || { s: '🐺', c: '#7c8cff', f: 'escudo' }; if (s.setup === undefined) s.setup = null; s.patro = s.patro || []; s.ofertas = s.ofertas || []; s.ofertaSem = s.ofertaSem || 0; s.social = s.social || { seg: 5000 }; s.foco = s.foco || 'nenhum'; s.intlHist = s.intlHist || []; s.seed = s.seed || base.seed; s.infra = s.infra || {}; if (Object.values(s.infra).some(v => typeof v === 'number')) { const old = s.infra; s.infra = {}; for (const g in base.games) s.infra[g] = Object.assign({}, old); }; s.itens = s.itens || []; s.loja = s.loja || []; s.lojaSem = s.lojaSem || 0; s.log = s.log || [];
        ajustarMundo(s); S = s; return true;
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
      L.t1.forEach((t, ti) => t.p.forEach((p, i) => out.push({ id: `${id0}${lg}-1-${ti}-${i}${p[4] ? '~' + p[4] : ''}`, n: p[0], o: p[1], a: p[2], c: p[3], r: roles[i], t: t.n, l: lg, tier: 'T1' })));
      L.t2.forEach((t, ti) => (t.p || []).forEach((p, i) => p && out.push({ id: `${id0}${lg}-2-${ti}-${i}${p[4] ? '~' + p[4] : ''}`, n: p[0], o: p[1], a: p[2], c: p[3], r: roles[i], t: t.n, l: lg, tier: 'T2' })));
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
  // estrutura é POR JOGO: S.infra[jogo][id] = nível (cada jogo tem sua própria gaming house, equipe de apoio etc.)
  const infraNivel = (id, game) => ((S.infra[game] || {})[id]) || 0;
  function infraBonus(game) { return INFRA.reduce((a, it) => a + infraNivel(it.id, game) * it.bonus, 0); }
  function infraInvestido() { let t = 0; for (const g in GAMES) INFRA.forEach(it => { for (let l = 0; l < infraNivel(it.id, g); l++) t += it.base * Math.pow(INFRA_MULT, l); }); return t; }
  const infraCusto = (it, game) => Math.round(it.base * Math.pow(INFRA_MULT, infraNivel(it.id, game)) / 1000) * 1000;
  const upkeepSemanal = () => Math.round(infraInvestido() * UPKEEP);

  function comprarInfra(id, game) {
    const it = INFRA.find(x => x.id === id); if (!it) return { ok: false, msg: 'Item inválido.' };
    if (!GAMES[game]) return { ok: false, msg: 'Jogo inválido.' };
    if (infraNivel(id, game) >= it.max) return { ok: false, msg: 'Nível máximo.' };
    const c = infraCusto(it, game); if (S.org.caixa < c) return { ok: false, msg: 'Caixa insuficiente.' };
    const m = S.infra[game] = S.infra[game] || {}; S.org.caixa -= c; m[id] = infraNivel(id, game) + 1; log(`${GAMES[game].curto}: ${it.nome} nível ${m[id]}`); save();
    return { ok: true, msg: `${it.nome} (${GAMES[game].curto}) agora no nível ${m[id]}.` };
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
    q.slots[slot] = { id: player.id, n: player.n, o: player.o, a: player.a, c: player.c, r: player.r, t: player.t, l: player.l, fee: f, ct: CONTRATO };
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
  // retornos decrescentes: quanto maior a reputação, mais difícil subir (evita bola de neve no fim de jogo)
function ganhoRep(d) { return d * Math.max(0.15, 1 - S.org.rep / 9); }
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
    for (const g in GAMES) {
      const nv = infraNivel('base', g); if (!nv) continue;
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
    return st.reduce((a, p) => a + (p ? p.o : 55), 0) / st.length + infraBonus(game) + bonusTemp(game);
  }
  const bonusTemp = game => Math.min(BUFF_MAX, (S.foco === 'treino' ? 1 : 0) + (S.buff ? S.buff.f : 0) + S.itens.reduce((a, x) => a + (x.g == null || x.g === game ? x.f || 0 : 0), 0));
  const rendaMerch = () => S.itens.reduce((a, x) => a + (x.pay || 0), 0);
  function lojaItens() { // 5 itens sorteados do catálogo, renovados a cada 4 semanas
    if (!S.loja.length) { const ids = LOJA.map(x => x.id); S.loja = []; while (S.loja.length < LOJA_N) S.loja.push(ids.splice(Math.floor(rnd() * ids.length), 1)[0]); }
    return S.loja.map(id => LOJA.find(x => x.id === id));
  }
  const itemAtivo = (it, game) => it.tipo !== 'seg' && S.itens.some(x => x.id === it.id && (it.tipo !== 'buff' || x.g === game));
  function comprarLoja(id, game) { // reforços (buff) valem só para o jogo escolhido; seguidores e merch são da org inteira
    const it = lojaItens().find(x => x && x.id === id); if (!it) return { ok: false, msg: 'Item fora de estoque.' };
    if (it.tipo === 'buff' && !GAMES[game]) return { ok: false, msg: 'Escolha o jogo do reforço.' };
    if (S.org.caixa < it.c) return { ok: false, msg: 'Caixa insuficiente.' };
    if (itemAtivo(it, game)) return { ok: false, msg: 'Você já tem esse item ativo.' };
    S.org.caixa -= it.c;
    if (it.tipo === 'seg') seguidores(it.v); else S.itens.push({ id: it.id, nome: it.nome, f: it.f || 0, pay: it.pay || 0, sem: it.sem, g: it.tipo === 'buff' ? game : null });
    if (it.tipo !== 'buff') S.loja = S.loja.filter(x => x !== id);
    log(`Loja: ${it.nome}${it.tipo === 'buff' ? ' (' + GAMES[game].curto + ')' : ''}`); save();
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
    mundoSync(); const k = regiaoDe(g); S.ligas = S.ligas || {};
    if (S.ligas[g] && S.ligas[g].reg === k) { if (S.ligas[g].mv !== S.mundo.n) mundoRefrescarLiga(S.ligas[g], g); return S.ligas[g]; }
    const L = region(g), cp = t => ({ n: t.n, b: mediaTime(t.p), p: t.p || null });
    return (S.ligas[g] = { reg: k, mv: S.mundo.n, d1: L.t1.map(cp), d2: L.t2.map(cp), d3: L.t1.map(t => ({ n: t.n + ' Academy', b: Math.max(60, mediaTime(t.p) - 8), p: null })) });
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
      S.org.rep = clamp(S.org.rep + ganhoRep(({ campeao: 0.3, vice: 0.15, semi: 0.08, quartas: 0.04 })[meu] * (c.sq === 't1' ? 1 : 0.3)), 0.5, 10);
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
      const bolsa = Math.round(I.bolsa * PCT_INTL[meu]); S.org.caixa += bolsa; S.org.rep = clamp(S.org.rep + ganhoRep(I.rep * PCT_INTL[meu] * 2), 0.5, 10);
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
      mundoTick();
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

  /* ---------- Mundo que envelhece ----------
     A cada virada de ano do jogo, TODOS os pros de TODOS os jogos (ativos ou não) envelhecem, evoluem pela curva de idade, os veteranos
     se aposentam e cada vaga é reposta por um "regen" (jovem talento). Estado persistente e compacto em S.mundo:
       y = último ano processado, n = nº de viradas, s = semente própria (mulberry32, independente do rnd() das partidas),
       ov[jogo][idDoSlot] = [ovr, idade, pot, geração, nick, bandeira, anoDeEstreia] (só os 3 primeiros p/ quem nunca se aposentou),
       apos = aposentadorias de lendas (as últimas 60). O talento dos regens acompanha a média original de cada liga/divisão (termostato).
     Os arrays estáticos (window.LOL / window.DATA) são reescritos NO LUGAR por mundoSync() sempre que o estado muda (novo jogo, load, virada),
     então pool(), ligas, fichas e mercado leem idade/ovr atuais sem custo extra por render. Linha do jogador = [nick, ovr, idade, bandeira, geração, pot]. */
  function novoMundo(ano) { return { y: ano, n: 0, s: null, ov: {}, apos: [] }; }
  function ajustarMundo(s) { // migração de saves antigos (sem S.mundo): o mundo começa no estado dos dados, no ano atual do save
    const m = s.mundo, ano = (s.org && s.org.ano) || 2026;
    if (!m || typeof m !== 'object') { s.mundo = novoMundo(ano); return; }
    m.y = m.y || ano; m.n = m.n | 0; m.ov = m.ov || {}; m.apos = m.apos || []; if (m.s === undefined) m.s = null;
  }
  /* curva por jogo: pk = idade em que acaba o crescimento, dec0 = idade em que começa o declínio, dec = queda/ano (acelera),
     r50 = idade em que a chance anual de aposentar é 50%, rs = largura, rmin = idade mínima p/ aposentar, max = aposentadoria certa, m = idade média p/ idades ausentes */
  const PERF = {
    lol:      { pk: 23, dec0: 26, dec: 1.0, r50: 29.5, rs: 1.4, rmin: 23, max: 36, m: 22.5 },
    cs2:      { pk: 25, dec0: 28, dec: 0.9, r50: 31.5, rs: 1.7, rmin: 24, max: 40, m: 25 },
    dota2:    { pk: 25, dec0: 29, dec: 0.7, r50: 32,   rs: 1.8, rmin: 25, max: 40, m: 24 },
    valorant: { pk: 24, dec0: 27, dec: 1.0, r50: 30,   rs: 1.5, rmin: 24, max: 37, m: 23.5 },
    ff:       { pk: 23, dec0: 28, dec: 0.6, r50: 30,   rs: 1.7, rmin: 23, max: 38, m: 23.5 },
    r6:       { pk: 25, dec0: 28, dec: 0.8, r50: 31,   rs: 1.7, rmin: 24, max: 38, m: 24 },
    fifa:     { pk: 24, dec0: 30, dec: 0.4, r50: 33,   rs: 2,   rmin: 25, max: 40, m: 23 },
    wr:       { pk: 23, dec0: 26, dec: 0.9, r50: 29,   rs: 1.4, rmin: 23, max: 35, m: 23 },
  };
  const MU_OFF = 3, MU_GANHO = 0.8, MU_REV = 0.3;               // regens: centro do potencial = média do grupo + MU_OFF (+ termostato)
  const MU = { idx: {}, ap: null, apN: -1, nicks0: null, nicks: new Set(), natAdd: [], isoRev: null };
  const muHash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const muHf = (str, k) => muHash(str + '|' + k) / 4294967296;
  function mrnd() { // mulberry32 com estado em S.mundo.s
    const M = S.mundo; if (M.s == null) M.s = (muHash(String(S.seed) + 'mundo') | 0) || 777;
    let t = (M.s = (M.s + 0x6D2B79F5) | 0), r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  }
  const mgau = () => (mrnd() + mrnd() + mrnd() - 1.5) * 2;                  // ~N(0,1)
  const rawData = g => g === 'lol' ? root.LOL : (root.DATA && root.DATA[g]) || null;
  const FLAGS_OK = new Set('AR AU BA BE BG BR BY CA CL CN CO CZ DE DK EE ES FI FR GB GR GT HK HR HU ID IL IT JP KR KZ LT LV MN MX MY NL NO PE PL PT RO RS RU SA SE SG SI SK TH TR TW UA US UY VN ZA'.split(' ')); // bandeiras que existem em flags/ (regens só sorteiam entre elas)
  const FLAG_REG = { CBLOL: ['BR'], LCS: ['US', 'CA', 'KR'], LEC: ['DE', 'FR', 'ES', 'DK', 'SE', 'PL'], LCK: ['KR'], LPL: ['CN'], LCP: ['TW', 'VN', 'JP', 'AU', 'HK'] };
  /* índice dos slots (cada posição de jogador nos dados), com a linha original guardada para restaurar */
  function muIndice(g) {
    if (MU.idx[g] !== undefined) return MU.idx[g];
    const d = rawData(g); if (!d) return (MU.idx[g] = null);
    const id0 = g === 'lol' ? '' : g + '-', slots = [], grp = {}, flags = {}, todas = {}, X = root.LOLX;
    if (!MU.nicks0) MU.nicks0 = new Set();
    for (const lg in d.leagues) {
      const L = d.leagues[lg]; flags[lg] = [];
      [['t1', 1], ['t2', 2]].forEach(([tk, k]) => (L[tk] || []).forEach((t, ti) => {
        const rows = (t.p || []).filter(Boolean), base = rows.length ? rows.reduce((a, r) => a + r[1], 0) / rows.length : 0, tm = { base, nome: t.n };
        (t.p || []).forEach((row, i) => {
          if (!row) return; MU.nicks0.add(String(row[0]).toLowerCase());
          const s = { id: `${id0}${lg}-${k}-${ti}-${i}`, row, orig: row.slice(), lg, tier: k === 1 ? 'T1' : 'T2', tm, i }, gk = lg + '|' + s.tier, G = grp[gk] = grp[gk] || { n: 0, soma: 0 };
          G.n++; G.soma += row[1]; slots.push(s);
          const fl = row[3] || (X && X.nat && X.iso && X.iso[X.nat[row[0]]]) || null; if (fl && FLAGS_OK.has(String(fl).toUpperCase())) { flags[lg].push(String(fl).toUpperCase()); todas[String(fl).toUpperCase()] = 1; }
        });
      }));
    }
    for (const k in grp) grp[k].alvo = grp[k].soma / grp[k].n;
    if (X) for (const tb of ['nat', 'hon', 'rtit']) for (const n in (X[tb] || {})) MU.nicks0.add(n.toLowerCase());
    return (MU.idx[g] = { d, slots, grp, flags, todas: Object.keys(todas), byId: null });
  }
  /* escreve a linha do slot a partir do override (ou restaura o original) */
  function muEscreve(s, e) {
    const row = s.row; row.length = 0; for (const v of s.orig) row.push(v);
    if (!e) return;
    row[1] = e[0]; row[2] = e[1]; row[3] = s.orig[3]; row[4] = 0; row[5] = e[2];
    if (e[3]) { row[0] = e[4]; row[3] = e[5]; row[4] = e[3]; MU.nicks.add(String(e[4]).toLowerCase()); muNat(e[4], e[5]); }
  }
  function muNat(nick, flag) { // LoL guarda nacionalidade em LOLX.nat (código de 3 letras); regens entram lá para a ficha mostrar a bandeira
    const X = root.LOLX; if (!X || !X.nat || !X.iso || !flag) return;
    if (!MU.isoRev) { MU.isoRev = {}; for (const c in X.iso) if (!MU.isoRev[X.iso[c]]) MU.isoRev[X.iso[c]] = c; }
    const c = MU.isoRev[String(flag).toLowerCase()]; if (c && !(nick in X.nat)) { X.nat[nick] = c; MU.natAdd.push(nick); }
  }
  function mundoSync() { // reaplica o estado do mundo nos dados estáticos quando S.mundo mudou (novo jogo, load, set)
    if (!S.mundo) ajustarMundo(S); const M = S.mundo;
    if (MU.ap === M && MU.apN === M.n) return;
    MU.ap = M; MU.apN = M.n;
    const X = root.LOLX; if (X && X.nat) { MU.natAdd.forEach(n => { delete X.nat[n]; }); } MU.natAdd = [];
    for (const g in GAMES) { if (MU.idx[g] === undefined) muIndice(g); }
    MU.nicks = new Set(MU.nicks0 || []);
    for (const g in GAMES) { const I = MU.idx[g]; if (!I) continue; const ov = M.ov[g] || {}; for (const s of I.slots) muEscreve(s, ov[s.id]); delete _pool[g]; }
  }
  /* ----- nomes plausíveis por nacionalidade ----- */
  const NOMES = {
    lat: [['du','ka','ga','pe','ra','lu','ti','ne','ze','bi','vi','ma','jo','fe','ro','ca','da','le','to','mi','san','mar','ric','cris','fer','ale','guil','nan'], ['du','io','nho','zin','ka','to','nd','el','lo','xo','ex','ito','ao','z','ry','ke','ni','ba','co','dy']],
    kr:  [['ka','min','hyun','seo','woo','ji','tae','sung','joon','yoo','dong','han','ryu','shin','bae','gyu','do','ha'], ['ng','jun','ho','min','su','won','woo','hyuk','sang','ki','ri','do','ya','seo']],
    cn:  [['xiao','ming','zhe','yu','hao','jun','wei','lin','chen','tian','kai','long','feng','shi','yan','bo','ze','an'], ['ng','long','xi','hao','yu','an','kun','ze','xin','tao','lei','ye','wen']],
    jp:  [['ha','ru','ki','sa','to','ko','ya','mi','ta','ro','shi','no','ke','ju','ryu','ren','hi'], ['to','ki','ro','ya','ta','mi','ru','ma','shi','ko','na','ji','su']],
    sea: [['an','minh','tuan','nam','duc','khoa','hieu','phuc','long','son','bao','kien','tri','vy','nat','pop','boom','arm','non','dewa','riz','putra','ald','faj','bay','haf'], ['h','ng','an','ky','ky','o','i','ra','ko','ny','zy','dy','tan','ki','ri']],
    sla: [['vla','ki','sa','ni','mi','ro','ale','dmi','ste','ma','bo','zo','pa','ja','ti','ko','an','vo','da','ruz'], ['d','ril','sha','ko','lav','ek','ik','ic','ski','ov','ya','vich','ton','zer','nik','an','tek','mir']],
    nor: [['ox','fre','ja','ni','mal','el','sig','ste','hen','ma','ba','jo','lu','ku','ri','ha','tor','vik','ras','kri'], ['ke','x','ar','ik','mus','ne','dor','ten','ard','son','by','ner','ler','ee','z','ie']],
    ang: [['ja','ty','bre','cal','ry','no','hu','za','ke','mi','jax','ash','cole','dex','nate','finn','reed','max','kai','lo'], ['x','den','son','vin','sh','lex','ton','ley','ck','n','dy','ro','z','rr','ze']],
    med: [['ale','gio','lu','ma','pa','el','ni','ro','fa','da','ste','vi','ba','xe','jo','ti','zo','co'], ['ex','ic','ou','ro','is','ano','ino','eo','ch','oux','ty','ni','la','ac','ot','y']],
    tr:  [['ka','em','bu','ey','ce','ya','er','tu','ha','me','os','ber','alp','ay','can'], ['ner','han','kan','ar','ay','gur','ra','lp','can','ti','ze','du','sal','is']],
  };
  const GRUPO = {}; [['lat', 'br pt ar mx cl co pe uy es gt sv ve ec bo py cr pa do cu'], ['kr', 'kr'], ['cn', 'cn hk tw mn'], ['jp', 'jp'], ['sea', 'vn th id my sg ph kh'],
    ['sla', 'ru ua by kz pl cz sk rs hr si bg ro hu lt lv ee ba mk me al ge am az uz'], ['nor', 'se dk no fi de nl be at ch is ie'], ['ang', 'us ca gb au nz za in'], ['med', 'fr it gr cy mt lu'], ['tr', 'tr sa il ae eg ma tn dz jo lb']]
    .forEach(([g, l]) => l.split(' ').forEach(c => { GRUPO[c] = g; }));
  function muNick(flag) {
    const T = NOMES[GRUPO[String(flag).toLowerCase()] || 'ang'], pick = a => a[Math.floor(mrnd() * a.length)];
    for (let t = 0; t < 40; t++) {
      let n = pick(T[0]) + pick(T[1]); if (mrnd() < 0.2) n += pick(T[1]);
      const r = mrnd(); n = r < 0.3 ? n : r < 0.34 && n.length <= 4 ? n.toUpperCase() : n[0].toUpperCase() + n.slice(1);
      if (n.length < 3 || n.length > 10 || MU.nicks.has(n.toLowerCase())) continue; return n;
    }
    let n; do { n = pick(T[0]) + pick(T[1]) + Math.floor(mrnd() * 90 + 10); } while (MU.nicks.has(n.toLowerCase())); return n[0].toUpperCase() + n.slice(1);
  }
  /* ----- curva de idade, aposentadoria, regens ----- */
  const idadeBase = (g, nick, o) => clamp(Math.round(PERF[g].m + (muHf(g + nick, 'a1') + muHf(g + nick, 'a2') - 1) * 8 + (o - 70) * 0.05), 17, PERF[g].max - 6);
  const potBase = (g, nick, a, o) => a >= PERF[g].pk ? o : o + Math.round(Math.pow(muHf(g + nick, 'p'), 1.3) * (PERF[g].pk - a) * 1.1);
  function evolOvr(P, o, a, pot, rev) { // idade a = já incrementada; rev = empurrão do termostato da liga
    let d;
    if (a <= P.pk) { const r = a <= 19 ? 0.5 : a <= 21 ? 0.42 : a <= 23 ? 0.36 : 0.3; d = Math.max(0, pot - o) * r + mgau() * (a <= 21 ? 1.3 : 0.9); }
    else if (a <= P.dec0) d = Math.max(0, pot - o) * 0.15 + mgau() * 0.9;
    else d = -P.dec * (1 + 0.15 * (a - P.dec0 - 1)) + mgau() * 0.9;
    return clamp(Math.floor(o + d + (rev || 0) + mrnd()), 42, 98); // arredondamento estocástico (sem viés)
  }
  const muAposenta = (P, a, o) => a >= P.max || (a >= P.rmin && mrnd() < 1 / (1 + Math.exp(-(a - P.r50 + (70 - o) * 0.06) / P.rs)));
  function muRegen(g, I, s, ano, adj) {
    const G = I.grp[s.lg + '|' + s.tier];
    let pot = G.alvo + 0.6 * ((s.tm.base || G.alvo) - G.alvo) + MU_OFF + adj + mgau() * (G.n < 12 ? 2.5 : 5);
    if (mrnd() < (G.n < 12 ? 0.04 : 0.08)) pot += 6 + mrnd() * 4;
    pot = Math.round(clamp(pot, 58, 96));
    const fl = I.flags[s.lg].length ? I.flags[s.lg] : (FLAG_REG[s.lg] || (I.todas.length ? I.todas : ['BR', 'US', 'KR', 'DE', 'CN'])), flag = fl[Math.floor(mrnd() * fl.length)];
    const r = mrnd(), a = r < 0.15 ? 16 : r < 0.45 ? 17 : r < 0.75 ? 18 : 19, o = clamp(Math.round(pot - (G.n < 12 ? 4 + mrnd() * 4 : 9 + mrnd() * 7)), 46, 76), nick = muNick(flag);
    MU.nicks.add(nick.toLowerCase());
    return [o, a, pot, (s.row[4] || 0) + 1, nick, flag, ano];
  }
  function muDonos() { const own = new Map(); for (const g in GAMES) for (const q of Object.values(S.games[g].squads)) q.slots.forEach(p => { if (p && p.id) { const k = g + '|' + p.id; if (!own.has(k)) own.set(k, []); own.get(k).push(p); } }); return own; }
  function mundoVirarAno() { // processa UMA virada de ano (y -> y+1) para todos os jogos
    const M = S.mundo, ano = ++M.y; M.n++; MU.apN = M.n;
    const own = muDonos(), tocados = new Set(), aposLog = [];
    for (const g in GAMES) {
      const I = muIndice(g); if (!I) continue; const P = PERF[g], ov = M.ov[g] = M.ov[g] || {}, grp = {}, fila = [];
      const pots = I.slots.map(s => s.row[5] != null ? s.row[5] : s.row[1]).sort((a, b) => a - b), lenda = pots[Math.floor(pots.length * 0.85)];
      const atual = {}; for (const s of I.slots) { const k = s.lg + '|' + s.tier, A = atual[k] = atual[k] || [0, 0]; A[0] += s.row[1]; A[1]++; }
      for (const s of I.slots) { // passo 1: envelhece, evolui e decide quem se aposenta (contratados pelo usuário não se aposentam)
        const row = s.row, id = s.id + (row[4] ? '~' + row[4] : ''), dono = own.get(g + '|' + id), o0 = row[1];
        const gk = s.lg + '|' + s.tier, GI = I.grp[gk], A = atual[gk], rev = MU_REV * (GI.n < 12 ? 1.6 : 1) * (GI.alvo - A[0] / A[1]);
        const a = (row[2] == null ? idadeBase(g, row[0], o0) : row[2]) + 1, pot = row[5] != null ? row[5] : potBase(g, row[0], a - 1, o0), o = evolOvr(P, o0, a, pot, rev);
        const ret = !dono && muAposenta(P, a, o), G = grp[s.lg + '|' + s.tier] = grp[s.lg + '|' + s.tier] || { soma: 0, n: 0, ret: 0 };
        G.n++; if (ret) G.ret++; else G.soma += o;
        fila.push({ s, o, a, pot, ret, dono, o0 });
      }
      for (const x of fila) { // passo 2: grava; cada vaga vazia vira um regen cujo talento acompanha o alvo do grupo (termostato)
        const s = x.s, row = s.row, G = grp[s.lg + '|' + s.tier], alvo = I.grp[s.lg + '|' + s.tier].alvo;
        if (x.ret) {
          if (x.pot >= lenda) { M.apos.unshift([ano, g, row[0], x.a, Math.max(x.o, x.pot), String(row[3] || (root.LOLX && root.LOLX.iso && root.LOLX.iso[(root.LOLX.nat || {})[row[0]]]) || '').toUpperCase(), s.tm.nome || '']); M.apos.length = Math.min(M.apos.length, 60); aposLog.push({ g, nick: row[0], a: x.a, pot: x.pot }); }
          const adj = clamp((alvo - (G.soma + G.ret * (alvo - 6)) / G.n) * MU_GANHO * (G.n < 12 ? 1.8 : 1), -6, 7), e = muRegen(g, I, s, ano, adj); ov[s.id] = e; muEscreve(s, e);
        } else {
          const e = ov[s.id] ? ov[s.id].slice() : []; e[0] = x.o; e[1] = x.a; e[2] = x.pot; ov[s.id] = e;
          row[1] = x.o; row[2] = x.a; row[5] = x.pot; if (row[4] == null) row[4] = 0; if (e.length < 4) row[3] = s.orig[3];
          if (x.dono) x.dono.forEach(p => { p.o = clamp(p.o + (x.o - x.o0), 40, 99); p.a = x.a; tocados.add(p); });
        }
      }
      delete _pool[g];
    }
    for (const g in GAMES) { // jogadores sem linha no mundo (promovidos da base) só envelhecem; a base também
      for (const q of Object.values(S.games[g].squads)) q.slots.forEach(p => { if (p && !tocados.has(p) && p.a != null) { p.a++; tocados.add(p); } });
      (S.base[g] || []).forEach(p => { if (p.a != null) p.a++; });
    }
    if (S.estrela) { const p = [...own.values()].flat().find(x => x.estrela); if (p) S.estrela.o = p.o; }
    for (const g in S.ligas || {}) mundoRefrescarLiga(S.ligas[g], g);
    aposLog.filter(x => aberto(x.g)).sort((x, y) => y.pot - x.pot).slice(0, 3).forEach(x => log(`${x.nick} se aposentou aos ${x.a} anos (${GAMES[x.g].curto})`));
  }
  function mundoTick() { mundoSync(); while (S.mundo.y < S.org.ano) mundoVirarAno(); }
  function mundoRefrescarLiga(Lg, g) { // recalcula p/b dos times da liga do usuário a partir dos dados atualizados
    const d = rawData(g), L = d && d.leagues[Lg.reg]; Lg.mv = S.mundo.n; if (!L) return;
    const todos = {}, t1 = {}; L.t2.forEach(t => { todos[t.n] = t; }); L.t1.forEach(t => { todos[t.n] = t; t1[t.n] = t; });
    const up = t => { const m = todos[t.n]; if (m) { t.p = m.p || null; t.b = mediaTime(m.p); } };
    Lg.d1.forEach(up); Lg.d2.forEach(up);
    Lg.d3.forEach(t => { const m = t1[t.n.replace(/ Academy$/, '')]; if (m) t.b = Math.max(60, mediaTime(m.p) - 8); });
  }
  const aposentados = g => (S.mundo.apos || []).filter(x => !g || x[1] === g).map(x => ({ ano: x[0], g: x[1], nick: x[2], idade: x[3], o: x[4], flag: x[5] }));

  root.Org = { LOJA, lojaItens, comprarLoja, itemAtivo, rendaMerch, GAMES, SQUADS, INFRA, KEY, CICLO, slotsDe, get, set, save, load, reset, log, novoJogo, money, fee, salary, region, poolLol, pool, regiaoDe, dataOf, intlDef, livres,
    infraNivel, infraBonus, infraCusto, upkeepSemanal, projecaoOrg, salarioDe, passo, agenda, dataDe, emSemanas, MES, MDN, comecar, iniciar, convidarEstrela, semEstrela, abrirJogo, aberto, desbloqueio, chanceEstrela, comprarInfra, ativarSquad, contratar, ofertas, aceitarPatro, setFoco, escolherEvento, EVENTOS, rendaPatro, rendaSocial, custoFoco, bonusTemp, renovar, custoRenovar, mover, promoverBase, CONTRATO, dispensar, folha, forca, titulares, prontos, mediaTime,
    compFor, classificacao, nome, nomeT, ligaSync, INTL, simRapida, projecao, avancar, avancarAteJogo, trocarRegiao, probVit, serie, roundRobin,
    mundoSync, mundoTick, mundoVirarAno, aposentados, MUNDO_PERF: PERF };
})(typeof window !== 'undefined' ? window : globalThis);
