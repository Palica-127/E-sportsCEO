// A org do jogador: cenários de início, peneira, finanças, patrocínios, caixa de entrada e decisões.
import { GAMES, GameId } from './games';
import { chance, clamp, pick, ri, rnd, shuffle } from './rng';
import type { Candidato, Cenario, Msg, Player, State, Team, Torneio } from './types';
import { TRACOS } from './types';
import { criaJogador, criaJogo, escalarAuto, forca, geraNick, novoId, salario, titulares, valorMercado } from './world';
import { DIAS_ANO, anoDe, diaDoAno, diaSemana, noticia } from './sim';
import { CARGOS, cobertura, doCargo, moralSemanal, renovaPool, staffInicial, tecnicoDe, treinoMensal } from './staff';
import { custoSede, obrasProntas, sedeInicial, tickSede } from './sede';
import { treinoAcademy } from './academy';
import { tickMarcaDia, tickMarcaSemana } from './marca';
import { contratosFimDeAno, post, respostaNeg, respostaVenda, tickMercado } from './mercado';

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
    v: 3, seed, nextId: 1, dia: 0, fase: 'peneira',
    org: { nome: '', sigla: '', cor: '#d4af37', cenario: 'nova', caixa: 0, rep: 20, fas: 5000 },
    jogos, orgTeams: {}, players: {}, teams: {}, leagues: {}, matches: {},
    torneios: {}, ranks: {}, inbox: [], patro: [], fin: [], finSemana: { rec: {}, desp: {} }, hist: [],
    diretoria: { meta: '', metaId: 'subir', confianca: 60 }, peneira: {},
    staff: {}, staffPool: [], conhecido: {}, alvos: [], negs: [], sede: { nivel: 0, posse: 'aluguel', comodos: {} }, kits: {}, rosto: {}, redes: [],
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
  const antigos: Partial<Record<GameId, string>> = {};
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
    antigos[g] = antigo;
  }
  staffInicial(s);
  sedeInicial(s);
  for (const g of s.jogos) {
    const t = s.teams[s.orgTeams[g]!], antigo = antigos[g];
    const tec = tecnicoDe(s, g);
    msg(s, { de: tec.nome, cargo: `Técnico · ${GAMES[g].curto}`, cat: 'tecnico', game: g,
      titulo: `Apresentação: técnico de ${GAMES[g].nome}`,
      corpo: `Prazer, CEO. Sou o novo técnico do ${GAMES[g].curto} (nota ${tec.nota}). Meu estilo: ${tec.estilo.toLowerCase()}.\n\nEu cuido de treino, escalação e tática. Você cuida do resto. Se quiser mexer na escalação, é só ir em Elenco e tirar do automático.${cfg.cenario !== 'nova' ? `\n\nAssumimos o elenco da antiga ${antigo}. Força atual do time: ${forca(s, t).toFixed(1)}.` : ''}` });
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

export function noticia2(s: State, g: GameId, txt: string) { s.noticiasDia = [...(s.noticiasDia ?? []), `${GAMES[g].curto}: ${txt}`].slice(-30); }

export function msg(s: State, m: Omit<Msg, 'id' | 'dia' | 'lida'>): Msg {
  const mm: Msg = { id: novoId(s, 'i'), dia: s.dia, lida: false, ...m };
  s.inbox.unshift(mm);
  if (s.inbox.length > 150) s.inbox = s.inbox.filter((x, i) => i < 120 || (x.acoes && !x.resolvida));
  return mm;
}

// ---------- peneira ----------
export function montaPeneira(s: State, g: GameId, region: string, slotTeam: string) {
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
    for (const p of daFuncao) cand.push({ pid: p.id, luvas: Math.round(salario(p.ovr) * 2 / 1000) * 1000, multa: 0, faixa: faixa(p) });
  }
  // talentos da solo queue (jovens com potencial)
  for (let k = 0; k < Math.max(4, nR * 2); k++) {
    const cc = pick(s, ['BR', 'BR', 'AR', 'KR', 'US', 'FR', 'CN']);
    const p = criaJogador(s, { game: g, role: k % nR, ovr: ri(s, 62, 69), nick: geraNick(s, cc), nat: cc.toLowerCase(), idade: ri(s, 16, 19), traco: chance(s, 0.4) ? 'talentoso' : undefined });
    p.pot = clamp(p.ovr + ri(s, 8, 20), p.ovr, 92);
    cand.push({ pid: p.id, luvas: Math.round(salario(p.ovr) * 1 / 1000) * 1000, multa: 0, faixa: faixa(p), motivo: 'Destaque da solo queue' });
  }
  // poucos jogadores com contrato que se interessaram pelo projeto
  const comTime = [...T2.teams, ...T1.teams.slice(-3)].filter(id => id !== slotTeam).flatMap(id => titulares(s, s.teams[id]))
    .filter(p => p.ovr <= media + 6 && p.ovr >= media - 1);
  const motivos = ['Gostou do projeto da org', 'Quer ser protagonista', 'Busca um novo desafio', 'Quer jogar com a estrutura nova'];
  for (const p of shuffle(s, comTime).slice(0, 5)) {
    cand.push({ pid: p.id, luvas: Math.round(salario(p.ovr) * 3 / 1000) * 1000, multa: Math.round(valorMercado(p) * 0.6 / 1000) * 1000, faixa: faixa(p), motivo: motivos[ri(s, 0, motivos.length - 1)] });
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
      (p.hist ??= []).push({ d: s.dia, t: `Aprovado na peneira da ${s.org.nome}` });
      t.elenco.push(pid);
      s.org.caixa -= custoCandidato(s, c);
      lanca(s, 'desp', 'Luvas e multas', custoCandidato(s, c));
    }
    escalarAuto(s, t);
  }
  s.peneira = {};
  s.fase = 'jogo';
  msg(s, { de: 'Departamento de scouting', cargo: 'Scouting', cat: 'peneira', titulo: 'Peneira encerrada', corpo: s.dia < 5 ? `Elencos fechados. Agora é com o técnico: a pré-temporada começa e o primeiro split abre em 3 semanas.` : 'Elenco fechado. O time estreia no próximo split; até lá é pré-temporada.' });
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
export function lanca(s: State, tipo: 'rec' | 'desp', cat: string, v: number) {
  s.finSemana[tipo][cat] = (s.finSemana[tipo][cat] ?? 0) + v;
}

export function folhaSemanal(s: State): number {
  let t = 0;
  for (const g of s.jogos) for (const tid of [s.orgTeams[g], s.academias?.[g]]) { const tm = tid ? s.teams[tid] : null; if (tm) for (const id of tm.elenco) t += s.players[id]?.sal ?? 0; }
  return t;
}
export function custosFixos(s: State): Record<string, number> {
  const c: Record<string, number> = { 'Comissão técnica e staff': Object.values(s.staff ?? {}).reduce((a, x) => a + x.sal, 0), 'Sede e cômodos': custoSede(s) };
  if (s.org.cenario === 'crise' && s.dia < DIAS_ANO * 2) c['Parcela da dívida'] = 20000;
  const emp = (s.emprestimos ?? []).filter(e => e.ate > s.dia).reduce((a, e) => a + e.parcela, 0);
  if (emp) c['Empréstimo'] = emp;
  return c;
}
export function receitasFixas(s: State): Record<string, number> {
  const r: Record<string, number> = {};
  const p = s.patro.reduce((a, x) => a + x.semanal, 0);
  if (p) r['Patrocínios'] = p;
  const est = s.sede?.comodos?.estudio?.nivel ?? 0;
  r['Conteúdo e streams'] = Math.round((s.jogos.length * 1000 + s.org.fas * 0.012) * (1 + est * 0.25 + cobertura(s, 'social') * 0.5) / 100) * 100;
  r['Repasse da liga'] = s.jogos.reduce((a, g) => a + (s.teams[s.orgTeams[g]!]?.tier === 1 ? 16000 : 6000), 0);
  return r;
}

/** categorias que já entraram/saíram do caixa na hora (só aparecem no extrato da semana) */
const REC_NA_HORA = new Set(['Premiações', 'Ingressos']);
const DESP_NA_HORA = new Set(['Luvas e multas', 'Bootcamp', 'Expansão', 'Produção da loja', 'Eventos']);

function fechaSemana(s: State) {
  tickMarcaSemana(s);
  const fixos = custosFixos(s);
  lanca(s, 'desp', 'Salários', folhaSemanal(s));
  for (const [k, v] of Object.entries(fixos)) lanca(s, 'desp', k, v);
  for (const [k, v] of Object.entries(receitasFixas(s))) lanca(s, 'rec', k, v);
  const rec = Object.values(s.finSemana.rec).reduce((a, b) => a + b, 0);
  const desp = Object.values(s.finSemana.desp).reduce((a, b) => a + b, 0);
  s.org.caixa += Object.entries(s.finSemana.rec).filter(([k]) => !REC_NA_HORA.has(k)).reduce((a, [, b]) => a + b, 0)
    - Object.entries(s.finSemana.desp).filter(([k]) => !DESP_NA_HORA.has(k)).reduce((a, [, b]) => a + b, 0);
  s.fin.push({ sem: Math.floor(s.dia / 7), rec, desp, caixa: s.org.caixa });
  s.fin = s.fin.slice(-60);
  s.finSemana = { rec: {}, desp: {} };
  // seguidores crescem com reputação
  s.org.fas = Math.round(s.org.fas * (1.002 + s.org.rep / 30000 + cobertura(s, 'social') * 0.002 + (Object.keys(s.rosto ?? {}).length * 0.002)));
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

/** quantos patrocinadores a org consegue manter (cresce com a reputação) */
export const maxPatro = (s: State) => Math.min(5, 2 + Math.floor(s.org.rep / 25));

/** banco oferece crédito quando o caixa aperta */
function ofertaEmprestimo(s: State) {
  if (s.inbox.some(m => m.dados?.emprestimo && !m.resolvida)) return;
  if ((s.emprestimos ?? []).filter(e => e.ate > s.dia).length >= 2) return;
  const valor = Math.round(Math.max(200_000, s.org.rep * 12_000) / 50_000) * 50_000;
  const semanas = 52, total = Math.round(valor * 1.18), parcela = Math.round(total / semanas / 100) * 100;
  const banco = pick(s, ['NexaBank', 'Banco Órbita', 'Crédito Vértice']);
  msg(s, { de: banco, cargo: 'Crédito empresarial', cat: 'financas', titulo: `${banco} oferece ${moeda(valor)} de crédito`,
    corpo: `Vimos que o caixa da ${s.org.nome} está apertado. Oferecemos ${moeda(valor)} agora, pagos em ${semanas} parcelas semanais de ${moeda(parcela)} (${moeda(total)} no total, juros de 18%).\n\nA proposta vale por 10 dias.`,
    acoes: [{ id: 'aceitar', txt: 'Pegar o crédito', tipo: 'bom' }, { id: 'recusar', txt: 'Recusar', tipo: 'ruim' }],
    dados: { emprestimo: { banco, valor, parcela, semanas }, expira: s.dia + 10 } });
}

function ofertaPatrocinio(s: State) {
  if (s.patro.length >= maxPatro(s)) return;
  if (s.inbox.some(m => m.cat === 'patrocinio' && !m.resolvida && m.acoes)) return;
  const usadas = new Set(s.patro.map(p => p.marca));
  const marca = pick(s, MARCAS.filter(m => !usadas.has(m)));
  const tier1 = s.jogos.filter(g => s.teams[s.orgTeams[g]!]?.tier === 1).length;
  const semanal = Math.round((4000 + s.org.rep * 50 + tier1 * 3000 + Math.sqrt(s.org.fas) * 2) * (0.75 + rnd(s) * 0.6) / 500) * 500;
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
  msg(s, { de: tecnicoDe(s, g)?.nome ?? 'Técnico', cargo: `Técnico · ${GAMES[g].curto}`, cat: 'tecnico', game: g, titulo: 'Pedido: bootcamp de uma semana',
    corpo: `CEO, quero levar o time do ${GAMES[g].curto} para um bootcamp com scrims contra times fortes. Custa ${moeda(custo)}. Acho que melhora a forma e a moral do grupo.`,
    acoes: [{ id: 'aprovar', txt: `Aprovar (${moeda(custo)})`, tipo: 'bom' }, { id: 'negar', txt: 'Negar', tipo: 'ruim' }],
    dados: { custo } });
}

export function resolver(s: State, msgId: string, acao: string): string {
  const m = s.inbox.find(x => x.id === msgId);
  if (!m || m.resolvida) return '';
  m.resolvida = acao; m.lida = true;
  const g = m.game;
  if (m.dados?.neg) return respostaNeg(s, m.dados.neg, acao, mm => msg(s, mm));
  if (m.dados?.venda) return respostaVenda(s, m.dados.venda, acao);
  if (m.dados?.conflito) {
    const [a, b] = m.dados.conflito.map((id: string) => s.players[id]);
    if (acao === 'multar') { a.moral = clamp(a.moral - 8, 0, 98); b.moral = clamp(b.moral - 8, 0, 98); return 'Os dois foram multados. O clima pesou, mas a disciplina ficou clara.'; }
    const psi = doCargo(s, 'psicologo')[0];
    if (psi) { a.moral = clamp(a.moral + 6, 0, 98); b.moral = clamp(b.moral + 6, 0, 98); return `${psi.nome} mediou a conversa e eles se acertaram.`; }
    a.moral = clamp(a.moral - 3, 0, 98); return 'Sem psicólogo, a conversa não resolveu muito.';
  }
  if (m.dados?.sair) {
    const p = s.players[m.dados.sair];
    if (acao === 'vender') { p.venda = true; return `${p.nick} foi colocado à venda.`; }
    if (chance(s, 0.5)) { p.moral = clamp(p.moral + 15, 0, 98); return `${p.nick} topou ficar e dar a volta por cima.`; }
    p.venda = true; return `${p.nick} não mudou de ideia. Ele está à venda.`;
  }
  if (m.dados?.emprestimo) {
    if (acao !== 'aceitar') return 'Crédito recusado.';
    const e = m.dados.emprestimo;
    s.org.caixa += e.valor;
    (s.emprestimos ??= []).push({ id: novoId(s, 'e'), banco: e.banco, parcela: e.parcela, ate: s.dia + e.semanas * 7 });
    return `${moeda(e.valor)} entraram no caixa. Parcela de ${moeda(e.parcela)} por semana.`;
  }
  if (m.cat === 'patrocinio') {
    if (acao === 'aceitar') {
      s.patro.push({ id: novoId(s, 's'), marca: m.dados.marca, semanal: m.dados.semanal, ate: s.dia + m.dados.semanas * 7 });
      if (m.dados.marca.includes('Periféricos')) for (const k of Object.values(s.kits)) if (k) k.patro = m.dados.marca;
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
  if (s.dia === 3 || s.dia === 12 || (dy % 21 === 10)) ofertaPatrocinio(s);
  if (diaSemana(s.dia) === 1 && s.org.caixa < 60_000 && s.fase === 'jogo') ofertaEmprestimo(s);
  if (dy % 35 === 17 && chance(s, 0.7)) eventoReserva(s);
  if (dy % 56 === 30 && chance(s, 0.6)) eventoBootcamp(s);
  if (dy === 0 && s.dia > 0) novaTemporada(s);
  // Fase 2: mercado, sede, staff, vestiário
  tickMercado(s, mm => msg(s, mm), t => noticia(s, t));
  tickMarcaDia(s);
  for (const o of obrasProntas(s)) msg(s, { de: 'Gerente da sede', cargo: 'Sede', cat: 'financas', titulo: `Obra concluída: ${o}`, corpo: `A obra terminou e o cômodo já está funcionando.` });
  if (diaSemana(s.dia) === 0) { tickSede(s); moralSemanal(s); }
  if (dy % 28 === 14) { treinoMensal(s); treinoAcademy(s); evolucaoMensal(s); vestiario(s); }
  if (dy % 28 === 0) renovaPool(s);
}

function evolucaoMensal(s: State) {
  for (const g of s.jogos) for (const id of [...(s.teams[s.orgTeams[g]!]?.elenco ?? []), ...(s.teams[s.academias?.[g] ?? '']?.elenco ?? [])]) { const p = s.players[id]; if (p) p.evo = [...(p.evo ?? []), p.ovr].slice(-36); }
}

function vestiario(s: State) {
  for (const g of s.jogos) {
    const t = s.teams[s.orgTeams[g]!];
    if (!t) continue;
    const ps = t.elenco.map(id => s.players[id]).filter(Boolean);
    const quente = ps.filter(p => p.traco === 'esquentado');
    if (quente.length && chance(s, 0.35)) {
      const a = pick(s, quente), b = pick(s, ps.filter(p => p !== a));
      if (b) msg(s, { de: tecnicoDe(s, g)?.nome ?? 'Técnico', cargo: `Técnico · ${GAMES[g].curto}`, cat: 'tecnico', game: g, titulo: `Briga no treino: ${a.nick} x ${b.nick}`,
        corpo: `O ${a.nick} perdeu a cabeça com o ${b.nick} depois de uma scrim ruim. O clima ficou pesado na gaming house. Como resolvemos?`,
        acoes: [{ id: 'multar', txt: 'Multar os dois' }, { id: 'conversar', txt: doCargo(s, 'psicologo').length ? 'Psicólogo media a conversa' : 'Conversar com eles', tipo: 'bom' }], dados: { conflito: [a.id, b.id] } });
    }
    const triste = ps.find(p => p.moral < 32 && !p.venda);
    if (triste) msg(s, { de: triste.nick, cargo: `Jogador · ${GAMES[g].curto}`, cat: 'jogo', game: g, titulo: `${triste.nick} quer sair`,
      corpo: `CEO, não estou feliz aqui. ${triste.traco === 'ambicioso' ? 'Quero um projeto que brigue por título.' : 'Preciso jogar e me sentir importante.'} Prefiro ser negociado.`,
      acoes: [{ id: 'conversar', txt: 'Tentar convencer a ficar', tipo: 'bom' }, { id: 'vender', txt: 'Colocar à venda' }], dados: { sair: triste.id } });
    const rosto = s.rosto[g] ? s.players[s.rosto[g]!] : null;
    if (rosto && s.diretoria.confianca < 35) {
      rosto.moral = clamp(rosto.moral - 10, 0, 98);
      msg(s, { de: rosto.nick, cargo: `Rosto da Org · ${GAMES[g].curto}`, cat: 'jogo', game: g, titulo: `${rosto.nick} cobra resultados`, corpo: `Vim para a ${s.org.nome} para ganhar. Do jeito que está, não dá. Quero ver investimento e títulos.` });
    }
  }
}

function novaTemporada(s: State) {
  const ano = anoDe(s.dia);
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', titulo: `Temporada ${ano}`, corpo: `Começa a temporada ${ano}. Meta: ${s.diretoria.meta.toLowerCase()}. Confiança atual da diretoria: ${Math.round(s.diretoria.confianca)}%.` });
}

const PREMIO: Record<string, number> = { split: 200000, d2: 50000, acesso: 0, fs: 500000, msi: 2000000, ewc: 1500000, worlds: 4000000, intlA: 800000, intlB: 2000000 };
const INTL = new Set(['fs', 'msi', 'ewc', 'worlds', 'intlA', 'intlB']);

/** a org se classificou para um internacional */
export function aoClassificarOrg(s: State, tor: Torneio) {
  const g = tor.game;
  s.org.rep = clamp(s.org.rep + 2, 0, 100);
  s.diretoria.confianca = clamp(s.diretoria.confianca + 4, 0, 100);
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', game: g, titulo: `Classificados para o ${tor.nome}!`,
    corpo: `O time de ${GAMES[g].nome} garantiu vaga no ${tor.nome}. É a chance de colocar a ${s.org.nome} no mapa do mundo.\n\nFormato: ${tor.stages.map(x => x.nome).join(' → ')}.`, dados: { tor: tor.id, tipo: 'classificado' } });
}

/** chamado quando termina um torneio em que a org jogou */
export function aoFimTorneioOrg(s: State, tor: Torneio) {
  const g = tor.game, org = s.orgTeams[g]!;
  if (tor.kind === 'acesso') {
    const [ultimo, desafiante] = tor.teams;
    const subiu = desafiante === org && tor.campeao === org, caiu = ultimo === org && tor.campeao !== org;
    const ficou = ultimo === org && tor.campeao === org;
    if (subiu) { s.diretoria.confianca = clamp(s.diretoria.confianca + 20, 0, 100); s.org.rep = clamp(s.org.rep + 8, 0, 100); }
    if (caiu) { s.diretoria.confianca = clamp(s.diretoria.confianca - 18, 0, 100); s.org.rep = clamp(s.org.rep - 6, 0, 100); }
    msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', game: g,
      titulo: subiu ? `ACESSO! ${s.org.nome} sobe para a elite` : caiu ? 'Rebaixados para a Challengers' : ficou ? 'Vaga na elite mantida' : 'Acesso adiado',
      dados: { tor: tor.id, fase: subiu ? 'Subiu' : caiu ? 'Caiu' : ficou ? 'Ficou' : 'Não subiu' },
      corpo: subiu ? 'Vitória na série de acesso. No próximo split o time joga a liga principal. Projeto no caminho certo.' : caiu ? 'Perdemos a série de acesso e vamos jogar a Challengers no próximo split.' : ficou ? 'Sofremos, mas vencemos a série de acesso e seguimos na elite.' : 'Batemos na trave na série de acesso. Fica para o próximo split.' });
    return;
  }
  let fase: string;
  if (tor.campeao === org) fase = 'CAMPEÃ';
  else if (tor.elim[org]) fase = tor.elim[org];
  else fase = `${(tor.rank ?? []).indexOf(org) + 1}º lugar`;
  const mult = fase === 'CAMPEÃ' ? 1 : fase === 'Vice' ? 0.5 : /3º|4º|Semi/.test(fase) ? 0.25 : /Quartas|5º/.test(fase) ? 0.12 : INTL.has(tor.kind) ? 0.05 : 0;
  const premio = Math.round((PREMIO[tor.kind] ?? 0) * mult);
  const intl = INTL.has(tor.kind);
  const rep = fase === 'CAMPEÃ' ? (intl ? 12 : tor.kind === 'split' ? 8 : 4) : fase === 'Vice' ? (intl ? 6 : 3) : mult >= 0.12 ? (intl ? 3 : 1) : intl ? 1 : -2;
  if (premio) { s.org.caixa += premio; lanca(s, 'rec', 'Premiações', premio); }
  s.org.rep = clamp(s.org.rep + rep, 0, 100);
  s.org.fas = Math.round(s.org.fas * (1 + Math.max(0, rep) * 0.02));
  const meta = s.diretoria.metaId;
  let dc = 0;
  if (fase === 'CAMPEÃ') dc = intl ? 20 : 12;
  else if (intl) dc = mult >= 0.25 ? 6 : 1;
  else if (mult >= 0.25) dc = meta === 'titulo' ? -4 : 5;
  else if (mult > 0) dc = meta === 'titulo' ? -8 : 1;
  else dc = meta === 'titulo' ? -12 : meta === 'playoffs' ? -8 : -3;
  s.diretoria.confianca = clamp(s.diretoria.confianca + dc, 0, 100);
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', game: g,
    titulo: fase === 'CAMPEÃ' ? `🏆 ${s.org.nome} CAMPEÃ do ${tor.nome}!` : `${GAMES[g].curto}: ${tor.nome} encerrado`,
    corpo: `${tor.nome}: ${fase === 'CAMPEÃ' ? 'campeã' : fase.toLowerCase()}.${premio ? `\nPremiação: ${moeda(premio)}.` : ''}\n\nConfiança da diretoria: ${Math.round(s.diretoria.confianca)}% (${dc >= 0 ? '+' : ''}${dc}).`, dados: { tor: tor.id, fase, premio, rep, dc } });
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
