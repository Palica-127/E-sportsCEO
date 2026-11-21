// A org do jogador: cenários de início, peneira, finanças, patrocínios, caixa de entrada e decisões.
import { GAMES, GameId } from './games';
import { chance, clamp, pick, ri, rnd, shuffle } from './rng';
import type { Candidato, Cenario, League, Msg, Player, State, Team } from './types';
import { TRACOS } from './types';
import { criaJogador, criaJogo, escalarAuto, forca, geraNick, novoId, salario, titulares, valorMercado } from './world';
import { DIAS_ANO, anoDe, diaDoAno, diaSemana, tabela } from './sim';

export const CENARIOS: Record<Cenario, { nome: string; resumo: string; caixa: number; meta: string; metaId: 'subir' | 'playoffs' | 'titulo'; detalhes: string[] }> = {
  nova: {
    nome: 'Org nova', resumo: 'Você compra uma vaga na liga de acesso e monta o time do zero numa peneira.',
    caixa: 900_000, meta: 'Subir para a elite em até 2 anos', metaId: 'subir',
    detalhes: ['Caixa: R$ 900 mil', 'Liga Challengers (T2)', 'Peneira para montar o elenco', 'Diretoria paciente'],
  },
  crise: {
    nome: 'Org em crise', resumo: 'Você compra um time da elite endividado e com moral baixa, e faz o rebrand.',
    caixa: 250_000, meta: 'Chegar aos playoffs e sanear as contas', metaId: 'playoffs',
    detalhes: ['Caixa: R$ 250 mil', 'Dívida: R$ 20 mil/semana por 2 anos', 'Elenco pronto, moral baixa', 'Liga principal (T1)'],
  },
  investidor: {
    nome: 'Investidor', resumo: 'Você entra pesado numa org grande e faz o rebrand. Dinheiro sobra, paciência não.',
    caixa: 5_000_000, meta: 'Ser campeão já no primeiro ano', metaId: 'titulo',
    detalhes: ['Caixa: R$ 5 mi', 'Time forte da elite', 'Diretoria exigente', 'Confiança cai rápido'],
  },
};

export function novoEstado(seed: number, jogos: GameId[]): State {
  const s: State = {
    v: 2, seed, nextId: 1, dia: 0, fase: 'peneira',
    org: { nome: '', sigla: '', cor: '#d4af37', cenario: 'nova', caixa: 0, rep: 20, fas: 5000 },
    jogos, orgTeams: {}, tecnicos: {}, players: {}, teams: {}, leagues: {}, matches: {},
    inbox: [], patro: [], fin: [], finSemana: { rec: {}, desp: {} }, hist: [],
    diretoria: { meta: '', metaId: 'subir', confianca: 60 }, peneira: {},
  };
  for (const g of jogos) criaJogo(s, g);
  for (const t of Object.values(s.teams)) escalarAuto(s, t);
  return s;
}

/** times que o cenário permite assumir naquela região */
export function opcoesDeTime(s: State, g: GameId, region: string, cen: Cenario): Team[] {
  if (cen === 'nova') return [];
  const L = s.leagues[`${g}-${region}-1`];
  const ts = L.teams.map(id => s.teams[id]).sort((a, b) => forca(s, b) - forca(s, a));
  const meio = Math.ceil(ts.length / 2);
  return cen === 'investidor' ? ts.slice(0, meio) : ts.slice(meio - 1);
}

const TEC_NOMES: Record<string, string[]> = {
  br: ['Rodrigo "Peixoto" Lima', 'Carlos "Tockers" Alves', 'Fábio "Fabinho" Souza', 'Marcelo "Mylon" Dias'],
  kr: ['Kim "Hwang" Jin', 'Lee "Daeny" Soo', 'Park "Cain" Min'],
  us: ['Mark "Zikz" Ryan', 'Chris "Reapered" Bae'],
  eu: ['Dylan "Falco" Petit', 'Tomás "Melzhet" Ruiz'],
};
const ESTILOS = ['Agressivo, gosta de lutas cedo', 'Metódico, joga por objetivos', 'Formador, aposta em jovens', 'Disciplinador, cobra treino', 'Motivador, cuida do vestiário'];

export interface CarreiraCfg {
  nome: string; sigla: string; cor: string; logo?: string;
  cenario: Cenario;
  regioes: Partial<Record<GameId, string>>;
  times: Partial<Record<GameId, string>>; // time assumido (crise/investidor)
}

export function assumirCarreira(s: State, cfg: CarreiraCfg) {
  const C = CENARIOS[cfg.cenario];
  s.org = { nome: cfg.nome, sigla: cfg.sigla.toUpperCase().slice(0, 4), cor: cfg.cor, logo: cfg.logo, cenario: cfg.cenario, caixa: C.caixa, rep: cfg.cenario === 'investidor' ? 55 : cfg.cenario === 'crise' ? 35 : 15, fas: cfg.cenario === 'investidor' ? 400000 : cfg.cenario === 'crise' ? 120000 : 8000 };
  s.diretoria = { meta: C.meta, metaId: C.metaId, confianca: cfg.cenario === 'investidor' ? 55 : 65 };
  for (const g of s.jogos) {
    const region = cfg.regioes[g]!;
    let t: Team;
    if (cfg.cenario === 'nova') {
      const L = s.leagues[`${g}-${region}-2`];
      // compra a vaga do time mais fraco da Challengers
      const fraco = L.teams.map(id => s.teams[id]).sort((a, b) => forca(s, a) - forca(s, b))[0];
      for (const pid of fraco.elenco) s.players[pid].teamId = null;
      fraco.elenco = [];
      t = fraco;
      noticia2(s, g, `${s.org.nome} compra a vaga da ${fraco.nome} na ${L.nome}`);
      s.peneira[g] = montaPeneira(s, g, region, fraco.id);
    } else {
      t = s.teams[cfg.times[g]!];
      noticia2(s, g, `${s.org.nome} assume a ${t.nome} e anuncia rebrand`);
    }
    const antigo = t.nome;
    t.nome = s.org.nome; t.sigla = s.org.sigla; t.cor = s.org.cor; t.slug = '__org'; t.org = true;
    s.orgTeams[g] = t.id;
    if (cfg.cenario === 'crise') for (const p of titulares(s, t)) p.moral = clamp(p.moral - 18, 25, 90);
    if (cfg.cenario !== 'nova') for (const pid of t.elenco) s.players[pid].contrato = Math.max(s.players[pid].contrato, 2028);
    const reg = region.toLowerCase();
    const pool = TEC_NOMES[reg === 'cblol' || reg === 'br' || reg === 'sa' ? 'br' : reg === 'lck' ? 'kr' : reg === 'lcs' || reg === 'am' ? 'us' : 'eu'] ?? TEC_NOMES.br;
    s.tecnicos[g] = { nome: pick(s, pool), nat: 'br', estilo: pick(s, ESTILOS) };
    msg(s, { de: s.tecnicos[g]!.nome, cargo: `Técnico · ${GAMES[g].curto}`, cat: 'tecnico', game: g,
      titulo: `Apresentação: técnico de ${GAMES[g].nome}`,
      corpo: `Prazer, CEO. Sou o novo técnico do ${GAMES[g].curto}. Meu estilo: ${s.tecnicos[g]!.estilo.toLowerCase()}.\n\nEu cuido de treino, escalação e tática. Você cuida do resto. Se quiser mexer na escalação, é só ir em Elenco e tirar do automático.${cfg.cenario !== 'nova' ? `\n\nAssumimos o elenco da antiga ${antigo}. Força atual do time: ${forca(s, t).toFixed(1)}.` : ''}` });
  }
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria',
    titulo: `Bem-vindo à ${s.org.nome}`,
    corpo: `Seja bem-vindo, CEO. A meta para esta temporada: ${C.meta.toLowerCase()}.\n\nVamos acompanhar seu trabalho de perto. Resultados e contas em dia aumentam nossa confiança. Fracassos seguidos, não.` });
  if (cfg.cenario === 'nova') {
    msg(s, { de: 'Departamento de scouting', cargo: 'Scouting', cat: 'peneira', titulo: 'Peneira aberta',
      corpo: 'Reunimos os candidatos para a peneira: agentes livres, talentos da solo queue e alguns jogadores com contrato que gostaram do projeto. Monte 1 titular por função e até 2 reservas.' });
  } else {
    s.fase = 'jogo';
  }
}

function noticia2(s: State, g: GameId, txt: string) { s.noticiasDia = [...(s.noticiasDia ?? []), `${GAMES[g].curto}: ${txt}`].slice(-30); }

export function msg(s: State, m: Omit<Msg, 'id' | 'dia' | 'lida'>): Msg {
  const mm: Msg = { id: novoId(s, 'i'), dia: s.dia, lida: false, ...m };
  s.inbox.unshift(mm);
  if (s.inbox.length > 150) s.inbox = s.inbox.filter((x, i) => i < 120 || (x.acoes && !x.resolvida));
  return mm;
}

// ---------- peneira ----------
function montaPeneira(s: State, g: GameId, region: string, slotTeam: string) {
  const nR = GAMES[g].roles.length;
  const livres = Object.values(s.players).filter(p => p.game === g && !p.teamId);
  const T2 = s.leagues[`${g}-${region}-2`];
  const T1 = s.leagues[`${g}-${region}-1`];
  const media = T2.teams.filter(id => id !== slotTeam).flatMap(id => titulares(s, s.teams[id])).reduce((a, p, _, arr) => a + p.ovr / arr.length, 0);
  const cand: Candidato[] = [];
  const faixa = (p: Player): [number, number] => { const w = ri(s, 2, 4); const c = p.ovr + ri(s, -2, 2); return [c - w, c + w]; };
  // agentes livres: os melhores de cada função
  for (let r = 0; r < nR; r++) {
    const daFuncao = livres.filter(p => p.role === r).sort((a, b) => b.ovr - a.ovr).slice(0, 4);
    for (const p of daFuncao) cand.push({ pid: p.id, luvas: Math.round(salario(p.ovr) * 10 / 1000) * 1000, multa: 0, faixa: faixa(p) });
  }
  // talentos da solo queue (jovens com potencial)
  for (let k = 0; k < Math.max(4, nR * 2); k++) {
    const cc = pick(s, ['BR', 'BR', 'AR', 'KR', 'US', 'FR', 'CN']);
    const p = criaJogador(s, { game: g, role: k % nR, ovr: ri(s, 62, 69), nick: geraNick(s, cc), nat: cc.toLowerCase(), idade: ri(s, 16, 19), traco: chance(s, 0.4) ? 'talentoso' : undefined });
    p.pot = clamp(p.ovr + ri(s, 8, 20), p.ovr, 92);
    cand.push({ pid: p.id, luvas: Math.round(salario(p.ovr) * 6 / 1000) * 1000, multa: 0, faixa: faixa(p), motivo: 'Destaque da solo queue' });
  }
  // poucos jogadores com contrato que se interessaram pelo projeto
  const comTime = [...T2.teams, ...T1.teams.slice(-3)].filter(id => id !== slotTeam).flatMap(id => titulares(s, s.teams[id]))
    .filter(p => p.ovr <= media + 6 && p.ovr >= media - 1);
  const motivos = ['Gostou do projeto da org', 'Quer ser protagonista', 'Busca um novo desafio', 'Quer jogar com a estrutura nova'];
  for (const p of shuffle(s, comTime).slice(0, 5)) {
    cand.push({ pid: p.id, luvas: Math.round(salario(p.ovr) * 10 / 1000) * 1000, multa: Math.round(valorMercado(p) * 0.8 / 1000) * 1000, faixa: faixa(p), motivo: motivos[ri(s, 0, motivos.length - 1)] });
  }
  return { candidatos: cand, escolhidos: [] as string[], verba: s.org.caixa };
}

export function custoCandidato(s: State, c: Candidato): number { return c.luvas + c.multa; }

export function verbaPeneira(s: State): { total: number; gasto: number } {
  let gasto = 0;
  for (const g of s.jogos) {
    const P = s.peneira[g]; if (!P) continue;
    for (const pid of P.escolhidos) gasto += custoCandidato(s, P.candidatos.find(c => c.pid === pid)!);
  }
  return { total: s.org.caixa, gasto };
}

export function validaPeneira(s: State, g: GameId): string | null {
  const P = s.peneira[g]!;
  const nR = GAMES[g].roles.length;
  const ps = P.escolhidos.map(id => s.players[id]);
  for (let r = 0; r < nR; r++) if (!ps.some(p => p.role === r)) return `Falta um ${GAMES[g].roleNomes[r].toLowerCase()}.`;
  if (ps.length > nR + 2) return `Máximo de ${nR + 2} jogadores.`;
  const v = verbaPeneira(s);
  if (v.gasto > v.total) return 'Passou da verba.';
  return null;
}

export function comentarioTecnico(s: State, g: GameId, pid: string): string {
  const p = s.players[pid];
  const t = s.teams[s.orgTeams[g]!];
  const L = Object.values(s.leagues).find(l => l.teams.includes(t.id))!;
  const media = L.teams.filter(id => id !== t.id).flatMap(id => titulares(s, s.teams[id])).reduce((a, q, _, arr) => a + q.ovr / arr.length, 0);
  const partes: string[] = [];
  if (p.ovr >= media + 3) partes.push('Já chega pronto para ser titular e destaque da liga.');
  else if (p.ovr >= media - 1) partes.push('Nível de titular para essa liga.');
  else partes.push('Hoje está abaixo da média da liga.');
  if (p.pot - p.ovr >= 8) partes.push('Tem muito potencial, dá pra lapidar.');
  if (p.idade >= 28) partes.push('Experiente, mas não vai evoluir muito.');
  if (p.traco === 'esquentado') partes.push('Cuidado com o temperamento.');
  if (p.traco === 'lider') partes.push('Perfil de líder, ajuda o vestiário.');
  if (p.traco === 'irregular') partes.push('Oscila bastante.');
  return partes.join(' ');
}

export function confirmarPeneira(s: State): string | null {
  for (const g of s.jogos) { const e = s.peneira[g] && validaPeneira(s, g); if (e) return `${GAMES[g].curto}: ${e}`; }
  for (const g of s.jogos) {
    const P = s.peneira[g]; if (!P) continue;
    const t = s.teams[s.orgTeams[g]!];
    for (const pid of P.escolhidos) {
      const c = P.candidatos.find(x => x.pid === pid)!;
      const p = s.players[pid];
      if (p.teamId) {
        const antigo = s.teams[p.teamId];
        antigo.elenco = antigo.elenco.filter(x => x !== pid);
        repoeElenco(s, antigo);
        noticia2(s, g, `${p.nick} deixa a ${antigo.nome} e assina com a ${s.org.nome}`);
      }
      p.teamId = t.id; p.contrato = anoDe(s.dia) + 2; p.sal = salario(p.ovr);
      t.elenco.push(pid);
      s.org.caixa -= custoCandidato(s, c);
      lanca(s, 'desp', 'Luvas e multas', custoCandidato(s, c));
    }
    escalarAuto(s, t);
  }
  s.peneira = {};
  s.fase = 'jogo';
  msg(s, { de: 'Departamento de scouting', cargo: 'Scouting', cat: 'peneira', titulo: 'Peneira encerrada', corpo: `Elencos fechados. Agora é com o técnico: a pré-temporada começa e o primeiro split abre em 3 semanas.` });
  return null;
}

/** time da IA que perdeu jogador contrata um agente livre da mesma função */
export function repoeElenco(s: State, t: Team) {
  const nR = GAMES[t.game].roles.length;
  for (let r = 0; r < nR; r++) {
    if (t.elenco.some(id => s.players[id]?.role === r)) continue;
    const livre = Object.values(s.players).filter(p => p.game === t.game && !p.teamId && p.role === r).sort((a, b) => b.ovr - a.ovr)[0];
    const p = livre ?? criaJogador(s, { game: t.game, role: r, ovr: ri(s, 62, 70), nick: geraNick(s, 'BR'), nat: 'br' });
    p.teamId = t.id; t.elenco.push(p.id);
  }
  escalarAuto(s, t);
}

// ---------- finanças ----------
function lanca(s: State, tipo: 'rec' | 'desp', cat: string, v: number) {
  s.finSemana[tipo][cat] = (s.finSemana[tipo][cat] ?? 0) + v;
}

export function folhaSemanal(s: State): number {
  let t = 0;
  for (const g of s.jogos) { const tm = s.teams[s.orgTeams[g]!]; if (tm) for (const id of tm.elenco) t += s.players[id]?.sal ?? 0; }
  return t;
}
export function custosFixos(s: State): Record<string, number> {
  const c: Record<string, number> = { 'Comissão técnica': s.jogos.length * 4000, 'Sede (aluguel)': 4000 };
  if (s.org.cenario === 'crise' && s.dia < DIAS_ANO * 2) c['Parcela da dívida'] = 20000;
  return c;
}
export function receitasFixas(s: State): Record<string, number> {
  const r: Record<string, number> = {};
  const p = s.patro.reduce((a, x) => a + x.semanal, 0);
  if (p) r['Patrocínios'] = p;
  r['Conteúdo e streams'] = Math.round(s.org.fas * 0.012 / 100) * 100;
  r['Repasse da liga'] = s.jogos.reduce((a, g) => a + (s.teams[s.orgTeams[g]!]?.tier === 1 ? 14000 : 6000), 0);
  return r;
}

function fechaSemana(s: State) {
  const fixos = custosFixos(s);
  lanca(s, 'desp', 'Salários', folhaSemanal(s));
  for (const [k, v] of Object.entries(fixos)) lanca(s, 'desp', k, v);
  for (const [k, v] of Object.entries(receitasFixas(s))) lanca(s, 'rec', k, v);
  const rec = Object.values(s.finSemana.rec).reduce((a, b) => a + b, 0);
  const desp = Object.entries(s.finSemana.desp).filter(([k]) => k !== 'Luvas e multas').reduce((a, [, b]) => a + b, 0);
  s.org.caixa += Object.entries(s.finSemana.rec).filter(([k]) => k !== 'Premiações').reduce((a, [, b]) => a + b, 0)
    - Object.entries(s.finSemana.desp).filter(([k]) => k !== 'Luvas e multas' && k !== 'Bootcamp').reduce((a, [, b]) => a + b, 0);
  s.fin.push({ sem: Math.floor(s.dia / 7), rec, desp, caixa: s.org.caixa });
  s.fin = s.fin.slice(-60);
  s.finSemana = { rec: {}, desp: {} };
  // seguidores crescem com reputação
  s.org.fas = Math.round(s.org.fas * (1.002 + s.org.rep / 30000));
  if (s.org.caixa < 0 && Math.floor(s.dia / 7) % 4 === 0) {
    msg(s, { de: 'Gerente financeiro', cargo: 'Finanças', cat: 'financas', titulo: 'Caixa no vermelho', corpo: `Estamos com ${moeda(s.org.caixa)} em caixa. A diretoria não vai tolerar isso por muito tempo. Corte custos ou traga patrocínio.` });
    s.diretoria.confianca = clamp(s.diretoria.confianca - 3, 0, 100);
  }
}

export function moeda(v: number): string {
  const a = Math.abs(v);
  const t = a >= 1e6 ? `${(a / 1e6).toFixed(a >= 1e7 ? 1 : 2).replace('.', ',')} mi` : a >= 1e3 ? `${Math.round(a / 1e3)} mil` : `${Math.round(a)}`;
  return `${v < 0 ? '−' : ''}R$ ${t}`;
}

// ---------- patrocínios e eventos ----------
const MARCAS = ['VoltCola', 'NexaBank', 'Hyperion Energy', 'KeyForge Periféricos', 'PixelFood', 'Órbita Telecom', 'Zênite Seguros', 'Nimbus Cloud', 'Pulse Fitness', 'Aurora Motors', 'Vértice Imóveis', 'Cometa Delivery'];

function ofertaPatrocinio(s: State) {
  if (s.patro.length >= 3) return;
  if (s.inbox.some(m => m.cat === 'patrocinio' && !m.resolvida && m.acoes)) return;
  const usadas = new Set(s.patro.map(p => p.marca));
  const marca = pick(s, MARCAS.filter(m => !usadas.has(m)));
  const tier1 = s.jogos.filter(g => s.teams[s.orgTeams[g]!]?.tier === 1).length;
  const semanal = Math.round((3000 + s.org.rep * 150 + tier1 * 4000) * (0.75 + rnd(s) * 0.6) / 500) * 500;
  const semanas = pick(s, [26, 39, 52]);
  msg(s, { de: `${marca}`, cargo: 'Proposta de patrocínio', cat: 'patrocinio', titulo: `${marca} quer patrocinar a ${s.org.nome}`,
    corpo: `A ${marca} oferece ${moeda(semanal)} por semana durante ${semanas} semanas (${moeda(semanal * semanas)} no total) para estampar a marca na camisa e nas lives.\n\nA proposta vale por 10 dias.`,
    acoes: [{ id: 'aceitar', txt: 'Aceitar', tipo: 'bom' }, { id: 'recusar', txt: 'Recusar', tipo: 'ruim' }],
    dados: { marca, semanal, semanas, expira: s.dia + 10 } });
}

function eventoReserva(s: State) {
  const g = pick(s, s.jogos);
  const t = s.teams[s.orgTeams[g]!];
  const nR = GAMES[g].roles.length;
  const res = t.elenco.slice(nR).map(id => s.players[id]).filter(p => p && p.moral < 60);
  if (!res.length) return;
  const p = pick(s, res);
  msg(s, { de: p.nick, cargo: `Reserva · ${GAMES[g].curto}`, cat: 'jogo', game: g, titulo: `${p.nick} quer mais chances`,
    corpo: `CEO, estou treinando forte e não tenho jogado. Quero saber se tenho futuro aqui. ${p.traco === 'ambicioso' ? 'Se não for pra jogar, prefiro procurar outro projeto.' : ''}`,
    acoes: [{ id: 'prometer', txt: 'Prometer chances', tipo: 'bom' }, { id: 'paciencia', txt: 'Pedir paciência' }, { id: 'ignorar', txt: 'Ignorar', tipo: 'ruim' }],
    dados: { pid: p.id } });
}

function eventoBootcamp(s: State) {
  const g = pick(s, s.jogos);
  const custo = 40000 + s.org.rep * 800;
  msg(s, { de: s.tecnicos[g]!.nome, cargo: `Técnico · ${GAMES[g].curto}`, cat: 'tecnico', game: g, titulo: 'Pedido: bootcamp de uma semana',
    corpo: `CEO, quero levar o time do ${GAMES[g].curto} para um bootcamp com scrims contra times fortes. Custa ${moeda(custo)}. Acho que melhora a forma e a moral do grupo.`,
    acoes: [{ id: 'aprovar', txt: `Aprovar (${moeda(custo)})`, tipo: 'bom' }, { id: 'negar', txt: 'Negar', tipo: 'ruim' }],
    dados: { custo } });
}

export function resolver(s: State, msgId: string, acao: string): string {
  const m = s.inbox.find(x => x.id === msgId);
  if (!m || m.resolvida) return '';
  m.resolvida = acao; m.lida = true;
  const g = m.game;
  if (m.cat === 'patrocinio') {
    if (acao === 'aceitar') {
      s.patro.push({ id: novoId(s, 's'), marca: m.dados.marca, semanal: m.dados.semanal, ate: s.dia + m.dados.semanas * 7 });
      s.org.rep = clamp(s.org.rep + 1, 0, 100);
      return `Contrato assinado com a ${m.dados.marca}.`;
    }
    return 'Proposta recusada.';
  }
  if (m.dados?.pid) {
    const p = s.players[m.dados.pid];
    if (!p) return '';
    if (acao === 'prometer') { p.moral = clamp(p.moral + 15, 0, 100); return `${p.nick} ficou animado com a promessa.`; }
    if (acao === 'paciencia') { p.moral = clamp(p.moral + (p.traco === 'ambicioso' ? -4 : 4), 0, 100); return p.traco === 'ambicioso' ? `${p.nick} não gostou muito.` : `${p.nick} entendeu.`; }
    p.moral = clamp(p.moral - 12, 0, 100); return `${p.nick} ficou chateado.`;
  }
  if (m.titulo.startsWith('Pedido: bootcamp') && g) {
    if (acao === 'aprovar') {
      s.org.caixa -= m.dados.custo; lanca(s, 'desp', 'Bootcamp', m.dados.custo);
      for (const p of titulares(s, s.teams[s.orgTeams[g]!])) { p.forma = clamp(p.forma + 1, -3, 3); p.moral = clamp(p.moral + 6, 0, 100); }
      return 'Bootcamp aprovado. O elenco agradece.';
    }
    for (const p of titulares(s, s.teams[s.orgTeams[g]!])) p.moral = clamp(p.moral - 2, 0, 100);
    return 'Pedido negado.';
  }
  return '';
}

/** rotina diária da org (chamada a cada novo dia) */
export function tickOrg(s: State) {
  const dy = diaDoAno(s.dia);
  if (diaSemana(s.dia) === 0) fechaSemana(s);
  // patrocínios vencidos
  for (const p of s.patro.filter(x => x.ate <= s.dia)) msg(s, { de: p.marca, cargo: 'Patrocínio', cat: 'patrocinio', titulo: `Fim do contrato com a ${p.marca}`, corpo: 'O contrato de patrocínio chegou ao fim.' });
  s.patro = s.patro.filter(x => x.ate > s.dia);
  // propostas expiradas
  for (const m of s.inbox) if (m.acoes && !m.resolvida && m.dados?.expira && m.dados.expira < s.dia) { m.resolvida = 'expirou'; }
  // eventos
  if (s.dia === 3 || (dy % 42 === 10)) ofertaPatrocinio(s);
  if (dy % 35 === 17 && chance(s, 0.7)) eventoReserva(s);
  if (dy % 56 === 30 && chance(s, 0.6)) eventoBootcamp(s);
  if (dy === 0 && s.dia > 0) novaTemporada(s);
}

function novaTemporada(s: State) {
  const ano = anoDe(s.dia);
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', titulo: `Temporada ${ano}`, corpo: `Começa a temporada ${ano}. Meta: ${s.diretoria.meta.toLowerCase()}. Confiança atual da diretoria: ${Math.round(s.diretoria.confianca)}%.` });
}

/** chamado pela simulação quando o split de uma liga com a org termina */
export function aoFimDaSerieOrg(s: State, L: League, split: number, fase: string, premio: number, rep: number) {
  const g = L.game;
  if (premio) { s.org.caixa += premio; lanca(s, 'rec', 'Premiações', premio); }
  s.org.rep = clamp(s.org.rep + rep, 0, 100);
  s.org.fas = Math.round(s.org.fas * (1 + Math.max(0, rep) * 0.02));
  const camp = fase === 'CAMPEÃ';
  // diretoria reage conforme a meta
  const meta = s.diretoria.metaId;
  let dc = 0;
  if (camp) dc = 15;
  else if (fase.includes('vice') || fase.includes('semi')) dc = meta === 'titulo' ? -4 : 6;
  else if (fase.includes('quartas')) dc = meta === 'titulo' ? -8 : 2;
  else dc = meta === 'titulo' ? -14 : meta === 'playoffs' ? -9 : -4;
  s.diretoria.confianca = clamp(s.diretoria.confianca + dc, 0, 100);
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', game: g,
    titulo: camp ? `🏆 ${s.org.nome} CAMPEÃ da ${L.nome}!` : `${GAMES[g].curto}: split ${split} encerrado`,
    corpo: `${GAMES[g].nome}, ${L.nome}, split ${split}: ${fase}.${premio ? `\nPremiação: ${moeda(premio)}.` : ''}\n\nConfiança da diretoria: ${Math.round(s.diretoria.confianca)}% (${dc >= 0 ? '+' : ''}${dc}).` });
}

/** CEO intervém: troca titular e reserva */
export function trocar(s: State, teamId: string, a: string, b: string) {
  const t = s.teams[teamId];
  const ia = t.elenco.indexOf(a), ib = t.elenco.indexOf(b);
  if (ia < 0 || ib < 0) return;
  [t.elenco[ia], t.elenco[ib]] = [t.elenco[ib], t.elenco[ia]];
  t.manual = true;
}
export function voltarAuto(s: State, teamId: string) {
  const t = s.teams[teamId]; t.manual = false; escalarAuto(s, t);
}
export const nomeTraco = (t: keyof typeof TRACOS) => TRACOS[t].nome;
export { tabela };
