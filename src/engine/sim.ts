// Calendário dia a dia: abre os campeonatos de cada jogo nas datas do ano, joga as partidas e avança fases.
import { GAMES, GameId } from './games';
import { clamp, ri } from './rng';
import type { Match, State, Torneio } from './types';
import { simulaSerie } from './match';
import { escalarAuto, salario } from './world';
import { aoFimTorneioOrg, aoClassificarOrg, tickOrg, msg } from './org';
import { contratosFimDeAno, post } from './mercado';
import { FIM_TEMPORADA, Ganchos, LinhaRR, anoDe, avancaTorneio, calendario, criaAcesso, criaIntl, criaSplit, iniciaTorneio, inicioAno, tabelaRR } from './comp';

export { anoDe };
export const ANO0 = 2027;
export const DIAS_ANO = 364;

const BASE = Date.UTC(2027, 0, 4); // segunda-feira
export function dataDe(dia: number): Date { return new Date(BASE + dia * 86400000); }
export function diaDoAno(dia: number): number { return dia % DIAS_ANO; }
export function diaSemana(dia: number): number { return dia % 7; }
const SEM = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function fmtData(dia: number, comSemana = true): string {
  const d = dataDe(dia);
  return `${comSemana ? SEM[diaSemana(dia)] + ', ' : ''}${d.getUTCDate()} ${MES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export const nomeMes = (m: number) => MES[m];

export function isOrg(s: State, teamId: string): boolean { return !!s.teams[teamId]?.org; }

// ---------- índices em memória (não vão para o save) ----------
interface Idx { dia: Map<number, Match[]>; tor: Map<string, Match[]> }
const cache = new WeakMap<State, Idx>();
function idx(s: State): Idx {
  let c = cache.get(s);
  if (!c) { c = { dia: new Map(), tor: new Map() }; for (const m of Object.values(s.matches)) indexa(c, m); cache.set(s, c); }
  return c;
}
function indexa(c: Idx, m: Match) {
  (c.dia.get(m.dia) ?? c.dia.set(m.dia, []).get(m.dia)!).push(m);
  (c.tor.get(m.tor) ?? c.tor.set(m.tor, []).get(m.tor)!).push(m);
}
export function jogosDoDia(s: State, dia: number): Match[] { return idx(s).dia.get(dia) ?? []; }
export function jogosDoTorneio(s: State, torId: string): Match[] { return idx(s).tor.get(torId) ?? []; }

function ganchos(s: State): Ganchos {
  return {
    onAdd: m => indexa(idx(s), m),
    byId: id => s.matches[id],
    doTorneio: id => jogosDoTorneio(s, id),
    fimTorneio: tor => fimTorneio(s, tor),
  };
}

/** torneio em andamento (ou o último) de uma liga */
export function torneioDaLiga(s: State, leagueId: string): Torneio | undefined {
  const ts = Object.values(s.torneios).filter(t => t.league === leagueId && (t.kind === 'split' || t.kind === 'd2'));
  return ts.sort((a, b) => b.ano - a.ano || (b.split ?? 0) - (a.split ?? 0))[0];
}
export function tabelaTorneio(s: State, tor: Torneio): LinhaRR[] {
  return tabelaRR(s, tor, tor.stages[0], jogosDoTorneio(s, tor.id));
}
export function ligaDoTime(s: State, teamId: string) {
  return Object.values(s.leagues).find(l => l.teams.includes(teamId))!;
}

// ---------- abertura de campeonatos pelo calendário ----------
function abreEventos(s: State) {
  const ano = anoDe(s.dia), dy = diaDoAno(s.dia);
  const h = ganchos(s);
  for (const g of s.jogos) {
    for (const ev of calendario(g)) {
      if (ev.d !== dy) continue;
      if (ev.kind === 'split') {
        for (const L of Object.values(s.leagues).filter(l => l.game === g)) {
          const tor = criaSplit(s, g, L.id, ev.split!, s.dia, ev.W!);
          iniciaTorneio(s, tor, h);
        }
        continue;
      }
      const tor = criaIntl(s, g, ev.kind, ano);
      if (!tor) continue;
      iniciaTorneio(s, tor, h);
      const org = s.orgTeams[g];
      if (org && tor.teams.includes(org)) aoClassificarOrg(s, tor);
      noticia(s, `${GAMES[g].curto}: começa o ${tor.nome} com ${tor.teams.length} times.`);
    }
  }
}

function fimTorneio(s: State, tor: Torneio) {
  const g = tor.game;
  const campeao = s.teams[tor.campeao!], vice = s.teams[tor.vice!];
  if (tor.kind !== 'acesso') {
    s.hist.push({ ano: tor.ano, game: g, tor: tor.id, nome: tor.nome, kind: tor.kind, campeao: campeao.nome, vice: vice.nome, org: !!(campeao.org || vice.org) });
    noticia(s, `${GAMES[g].curto}: ${campeao.nome} é campeã do ${tor.nome}!`);
    for (const id of campeao.elenco) { const p = s.players[id]; if (p) (p.hist ??= []).push({ d: s.dia, t: `🏆 Campeão do ${tor.nome} pela ${campeao.nome}` }); }
    if (campeao.org) post(s, `É CAMPEÃ! 🏆 ${tor.nome} é da ${campeao.sigla}!!!`, 'bom');
  }
  if (tor.kind === 'split' || tor.kind === 'd2') {
    const L = s.leagues[tor.league!];
    s.ranks[`${tor.ano}-${g}-${L.region}-${L.tier}-${tor.split}`] = tor.rank!;
    // os dois splits (elite e Challengers) terminaram: marca a série de acesso
    const outra = Object.values(s.torneios).find(t => t.ano === tor.ano && t.split === tor.split && t.game === g && t.league === `${g}-${L.region}-${L.tier === 1 ? 2 : 1}`);
    if (outra?.fim) {
      const t1 = L.tier === 1 ? tor : outra, t2 = L.tier === 1 ? outra : tor;
      const ultimo = t1.rank![t1.rank!.length - 1];
      const ultimoDia = Math.max(...[t1, t2].flatMap(t => jogosDoTorneio(s, t.id).map(m => m.dia)));
      const ac = criaAcesso(s, g, L.region, tor.split!, Math.max(s.dia + 2, ultimoDia + 2), ultimo, t2.campeao!);
      iniciaTorneio(s, ac, ganchos(s));
    }
  }
  if (tor.kind === 'acesso') {
    const [ultimo, desafiante] = tor.teams;
    if (tor.campeao === desafiante) {
      const T1 = s.leagues[tor.league!], T2 = s.leagues[tor.league!.replace(/-1$/, '-2')];
      T1.teams = T1.teams.filter(x => x !== ultimo).concat(desafiante);
      T2.teams = T2.teams.filter(x => x !== desafiante).concat(ultimo);
      s.teams[ultimo].tier = 2; s.teams[desafiante].tier = 1;
      noticia(s, `${GAMES[g].curto}: ${s.teams[desafiante].nome} vence a série de acesso e sobe para a ${T1.nome}; ${s.teams[ultimo].nome} cai.`);
    } else noticia(s, `${GAMES[g].curto}: ${s.teams[ultimo].nome} vence a série de acesso e segue na elite.`);
  }
  const org = s.orgTeams[g];
  if (org && tor.teams.includes(org)) aoFimTorneioOrg(s, tor);
}

// ---------- fim de temporada: idade, evolução e limpeza ----------
function fimDeTemporada(s: State) {
  for (const p of Object.values(s.players)) {
    if (!s.jogos.includes(p.game)) continue;
    p.idade++;
    let delta = 0;
    if (p.idade <= 22) delta = Math.min(p.pot - p.ovr, ri(s, 1, 4) + (p.traco === 'profissional' ? 1 : 0));
    else if (p.idade <= 26) delta = Math.min(p.pot - p.ovr, ri(s, 0, 2));
    else if (p.idade >= 29) delta = -ri(s, 0, 2) - (p.idade >= 31 ? 1 : 0);
    p.ovr = clamp(p.ovr + delta, 45, 97);
    if (!s.teams[p.teamId ?? '']?.org) p.sal = salario(p.ovr);
  }
  contratosFimDeAno(s, m => msg(s, m));
  for (const t of Object.values(s.teams)) if (!t.org || !t.manual) escalarAuto(s, t);
  const ano = anoDe(s.dia);
  // apaga torneios de 2 anos atrás e partidas antigas que não são da org
  for (const t of Object.values(s.torneios)) if (t.ano < ano) delete s.torneios[t.id];
  for (const m of Object.values(s.matches)) if (!s.torneios[m.tor] && !isOrg(s, m.a) && !isOrg(s, m.b)) delete s.matches[m.id];
  cache.delete(s);
  Object.values(s.matches).filter(m => m.det).sort((a, b) => b.dia - a.dia).slice(40).forEach(m => delete m.det);
}

const pick2 = (s: State, xs: string[]) => xs[Math.floor((s.dia * 7 + s.nextId) % xs.length)];
export function noticia(s: State, txt: string) {
  s.noticiasDia = [...(s.noticiasDia ?? []), txt].slice(-40);
}

// ---------- avanço de dia ----------
function simulaDia(s: State, dia: number, comDetalhe: boolean) {
  const hoje = jogosDoDia(s, dia).slice();
  for (const m of hoje) {
    if (m.sa != null) continue;
    const daOrg = isOrg(s, m.a) || isOrg(s, m.b);
    if (daOrg && !comDetalhe) continue;
    for (const id of [m.a, m.b]) { const t = s.teams[id]; if (!t.org || !t.manual) escalarAuto(s, t); }
    simulaSerie(s, m, daOrg);
  }
  const h = ganchos(s);
  const tors = new Set(hoje.map(m => m.tor));
  for (const id of tors) { const t = s.torneios[id]; if (t) avancaTorneio(s, t, h, jogosDoTorneio(s, id)); }
}

/** existe partida da org hoje ainda não jogada? */
export function temJogoOrgHoje(s: State): boolean {
  return jogosDoDia(s, s.dia).some(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b)));
}

/** passa um dia. Retorna o motivo para parar, se houver. */
export function passo(s: State): 'jogo' | 'decisao' | null {
  if (s.fase !== 'jogo') return null;
  if (temJogoOrgHoje(s)) return 'jogo';
  simulaDia(s, s.dia, false);
  const antes = s.inbox.filter(m => m.acoes && !m.resolvida).length;
  s.dia++;
  s.diaJogo = null;
  const dy = diaDoAno(s.dia);
  abreEventos(s);
  if (dy === FIM_TEMPORADA) fimDeTemporada(s);
  tickOrg(s);
  const depois = s.inbox.filter(m => m.acoes && !m.resolvida).length;
  if (depois > antes) return 'decisao';
  if (temJogoOrgHoje(s)) return 'jogo';
  return null;
}

/** joga as partidas da org do dia (com resumo detalhado) e o resto da rodada */
export function jogarDia(s: State): Match[] {
  const ms = jogosDoDia(s, s.dia).filter(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b)));
  simulaDia(s, s.dia, true);
  s.diaJogo = { dia: s.dia, ids: ms.map(m => m.id) };
  for (const m of ms) {
    const meuA = isOrg(s, m.a), venceu = meuA === (m.sa! > m.sb!);
    const adv = s.teams[meuA ? m.b : m.a], mvp = m.mvp ? s.players[m.mvp] : null;
    const placar = meuA ? `${m.sa}-${m.sb}` : `${m.sb}-${m.sa}`;
    post(s, venceu ? `VITÓRIA! ${placar} na ${adv.sigla}${mvp && isOrg(s, mvp.teamId ?? '') ? `. ${mvp.nick} jogou demais 🔥` : ''}` : `Derrota ${placar} pra ${adv.sigla}... ${pick2(s, ['bora reagir', 'cadê o técnico?', 'próximo jogo é outro', 'tá difícil'])}`, venceu ? 'bom' : 'ruim');
  }
  return ms;
}

export function proximosJogosOrg(s: State, n = 5): Match[] {
  return Object.values(s.matches).filter(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b))).sort((a, b) => a.dia - b.dia).slice(0, n);
}
export function ultimosJogosOrg(s: State, n = 5): Match[] {
  return Object.values(s.matches).filter(m => m.sa != null && (isOrg(s, m.a) || isOrg(s, m.b))).sort((a, b) => b.dia - a.dia).slice(0, n);
}
/** próximo compromisso (para o botão "avançar até") */
export function proximoEvento(s: State): { dia: number; txt: string } | null {
  const j = proximosJogosOrg(s, 1)[0];
  const ano = anoDe(s.dia);
  let ev: { dia: number; txt: string } | null = j ? { dia: j.dia, txt: 'Próxima partida' } : null;
  for (const g of s.jogos) for (const e of calendario(g)) {
    for (const a of [ano, ano + 1]) {
      const d = inicioAno(a) + e.d;
      if (d > s.dia && (!ev || d < ev.dia)) ev = { dia: d, txt: e.kind === 'split' ? `${GAMES[g].curto} · Split ${e.split}` : `${GAMES[g].curto} · internacional` };
    }
  }
  return ev;
}
export function splitAtual(s: State, g: GameId): number {
  const dy = diaDoAno(s.dia);
  const sp = calendario(g).filter(e => e.kind === 'split' && e.d <= dy).pop();
  return sp?.split ?? 1;
}
