// Calendário dia a dia, ligas, playoffs, acesso/rebaixamento e virada de ano.
import { GAMES, GameId } from './games';
import { clamp, ri, rnd, shuffle } from './rng';
import type { Fase, League, Match, State, Team } from './types';
import { simulaSerie } from './match';
import { escalarAuto, forca, novoId, salario } from './world';
import { aoFimDaSerieOrg, tickOrg } from './org';

export const ANO0 = 2027;
export const DIAS_ANO = 364;
export const SPLITS = [21, 133, 245]; // dia do ano em que cada split começa (segunda-feira)
export const FIM_ANO = 357;

const BASE = Date.UTC(2027, 0, 4); // segunda-feira
export function dataDe(dia: number): Date { return new Date(BASE + dia * 86400000); }
export function anoDe(dia: number): number { return ANO0 + Math.floor(dia / DIAS_ANO); }
export function diaDoAno(dia: number): number { return dia % DIAS_ANO; }
export function diaSemana(dia: number): number { return dia % 7; }
const SEM = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export function fmtData(dia: number, comSemana = true): string {
  const d = dataDe(dia);
  return `${comSemana ? SEM[diaSemana(dia)] + ', ' : ''}${d.getUTCDate()} ${MES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
export const nomeMes = (m: number) => MES[m];

export function splitAtual(dia: number): number {
  const dy = diaDoAno(dia);
  return dy >= SPLITS[2] ? 3 : dy >= SPLITS[1] ? 2 : 1;
}

/** próximo dia (>= de) em que o jogo tem partidas */
function proxDiaJogo(g: GameId, de: number): number {
  let d = de;
  while (!GAMES[g].dias.includes(diaSemana(d))) d++;
  return d;
}

export function isOrg(s: State, teamId: string): boolean { return !!s.teams[teamId]?.org; }
// índices em memória (não vão para o save)
interface Idx { dia: Map<number, Match[]>; liga: Map<string, Match[]> }
const cache = new WeakMap<State, Idx>();
function idx(s: State): Idx {
  let c = cache.get(s);
  if (!c) { c = { dia: new Map(), liga: new Map() }; for (const m of Object.values(s.matches)) indexa(c, m); cache.set(s, c); }
  return c;
}
function indexa(c: Idx, m: Match) {
  (c.dia.get(m.dia) ?? c.dia.set(m.dia, []).get(m.dia)!).push(m);
  (c.liga.get(m.league) ?? c.liga.set(m.league, []).get(m.league)!).push(m);
}
export function jogosDoDia(s: State, dia: number): Match[] {
  return idx(s).dia.get(dia) ?? [];
}
export function jogosDaLiga(s: State, leagueId: string): Match[] {
  return idx(s).liga.get(leagueId) ?? [];
}

// ---------- tabela ----------
export interface Linha { team: Team; j: number; v: number; d: number; mp: number; mc: number; pos: number }
export function tabela(s: State, leagueId: string, split: number): Linha[] {
  const L = s.leagues[leagueId];
  const ano = anoDe(s.dia);
  const ls: Record<string, Linha> = {};
  for (const id of L.teams) ls[id] = { team: s.teams[id], j: 0, v: 0, d: 0, mp: 0, mc: 0, pos: 0 };
  for (const m of jogosDaLiga(s, leagueId)) {
    if (m.league !== leagueId || m.split !== split || m.fase !== 'reg' || m.sa == null || anoDe(m.dia) !== ano) continue;
    const a = ls[m.a], b = ls[m.b];
    if (!a || !b) continue;
    a.j++; b.j++;
    a.mp += m.sa; a.mc += m.sb!; b.mp += m.sb!; b.mc += m.sa;
    if (m.sa > m.sb!) { a.v++; b.d++; } else { b.v++; a.d++; }
  }
  const arr = Object.values(ls).sort((x, y) => y.v - x.v || (y.mp - y.mc) - (x.mp - x.mc) || forca(s, y.team) - forca(s, x.team));
  arr.forEach((l, i) => (l.pos = i + 1));
  return arr;
}

// ---------- agenda do split ----------
function roundRobin(ids: string[], duplo: boolean): [string, string][][] {
  const t = ids.slice();
  if (t.length % 2) t.push('BYE');
  const n = t.length;
  const rodadas: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const jogos: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const a = t[i], b = t[n - 1 - i];
      if (a !== 'BYE' && b !== 'BYE') jogos.push(r % 2 ? [b, a] : [a, b]);
    }
    rodadas.push(jogos);
    t.splice(1, 0, t.pop()!);
  }
  if (duplo) return [...rodadas, ...rodadas.map(r => r.map(([a, b]) => [b, a] as [string, string]))];
  return rodadas;
}

export function criaAgendaSplit(s: State, split: number) {
  const ano = anoDe(s.dia);
  const inicio = (ano - ANO0) * DIAS_ANO + SPLITS[split - 1];
  for (const L of Object.values(s.leagues)) {
    if (!s.jogos.includes(L.game)) continue;
    const ids = shuffle(s, L.teams);
    const rr = roundRobin(ids, ids.length <= 8);
    const g = GAMES[L.game];
    let d = inicio;
    rr.forEach((rodada, ri_) => {
      d = proxDiaJogo(L.game, d);
      for (const [a, b] of rodada) addMatch(s, { game: L.game, league: L.id, split, dia: d, a, b, bo: g.boReg, fase: 'reg', rodada: ri_ + 1 });
      d++;
    });
  }
}

function addMatch(s: State, m: Omit<Match, 'id'>): Match {
  const mm: Match = { id: novoId(s, 'm'), ...m };
  s.matches[mm.id] = mm;
  indexa(idx(s), mm);
  return mm;
}

// ---------- playoffs ----------
function boPlayoff(g: GameId, f: Fase): number {
  if (f === 'f') return 5;
  if (f === 'sf' && (g === 'lol' || g === 'wr')) return 5;
  return 3;
}
function jogosDe(s: State, L: League, split: number, fase?: Fase): Match[] {
  const ano = anoDe(s.dia);
  return jogosDaLiga(s, L.id).filter(m => m.split === split && anoDe(m.dia) === ano && (!fase || m.fase === fase));
}
const venc = (m: Match) => (m.sa! > m.sb! ? m.a : m.b);
const perd = (m: Match) => (m.sa! > m.sb! ? m.b : m.a);

/** quantos times vão aos playoffs */
export function vagasPlayoff(n: number): number { return n >= 8 ? 6 : n >= 6 ? 4 : 2; }

function avancaPlayoffs(s: State, L: League, split: number, hoje: number) {
  const reg = jogosDe(s, L, split, 'reg');
  if (!reg.length || reg.some(m => m.sa == null)) return;
  const tab = tabela(s, L.id, split);
  const vagas = vagasPlayoff(tab.length);
  const seed = tab.map(l => l.team.id);
  const qf = jogosDe(s, L, split, 'qf'), sf = jogosDe(s, L, split, 'sf'), fi = jogosDe(s, L, split, 'f');
  const prox = proxDiaJogo(L.game, hoje + 3);
  const cria = (fase: Fase, a: string, b: string, slot: number) => addMatch(s, { game: L.game, league: L.id, split, dia: prox, a, b, bo: boPlayoff(L.game, fase), fase, rodada: 0, slot });
  if (vagas === 6 && !qf.length) { cria('qf', seed[2], seed[5], 0); cria('qf', seed[3], seed[4], 1); return; }
  if (vagas === 6 && qf.some(m => m.sa == null)) return;
  if (!sf.length && vagas >= 4) {
    if (vagas === 6) {
      const w0 = venc(qf.find(m => m.slot === 0)!), w1 = venc(qf.find(m => m.slot === 1)!);
      // o 1º pega o pior classificado restante
      const pior = seed.indexOf(w0) > seed.indexOf(w1) ? w0 : w1, melhor = pior === w0 ? w1 : w0;
      cria('sf', seed[0], pior, 0); cria('sf', seed[1], melhor, 1);
    } else { cria('sf', seed[0], seed[3], 0); cria('sf', seed[1], seed[2], 1); }
    return;
  }
  if (sf.some(m => m.sa == null)) return;
  if (!fi.length) {
    if (vagas === 2) cria('f', seed[0], seed[1], 0);
    else cria('f', venc(sf.find(m => m.slot === 0)!), venc(sf.find(m => m.slot === 1)!), 0);
    return;
  }
  const f = fi[0];
  if (f.sa == null) return;
  if (s.hist.some(h => h.league === L.id && h.split === split && h.ano === anoDe(f.dia))) return;
  const camp = venc(f), vice = perd(f);
  s.hist.push({ ano: anoDe(f.dia), split, game: L.game, league: L.id, campeao: s.teams[camp].nome, vice: s.teams[vice].nome, org: isOrg(s, camp) || isOrg(s, vice) });
  premiacao(s, L, split, camp, vice, sf, qf, tab);
}

function premiacao(s: State, L: League, split: number, camp: string, vice: string, sf: Match[], qf: Match[], tab: { team: Team }[]) {
  const orgId = s.orgTeams[L.game];
  if (!orgId || !L.teams.includes(orgId)) return;
  const base = L.tier === 1 ? 500000 : 100000;
  let fase = 'fora dos playoffs', valor = 0, rep = 0;
  if (orgId === camp) { fase = 'CAMPEÃ'; valor = base; rep = L.tier === 1 ? 8 : 4; }
  else if (orgId === vice) { fase = 'vice-campeã'; valor = base * 0.5; rep = L.tier === 1 ? 4 : 2; }
  else if (sf.some(m => perd(m) === orgId)) { fase = 'semifinalista'; valor = base * 0.25; rep = 2; }
  else if (qf.some(m => perd(m) === orgId)) { fase = 'eliminada nas quartas'; valor = base * 0.12; rep = 1; }
  else { const pos = tab.findIndex(l => l.team.id === orgId) + 1; fase = `${pos}º lugar, fora dos playoffs`; rep = -2; }
  aoFimDaSerieOrg(s, L, split, fase, Math.round(valor), rep);
}

// ---------- virada de ano: acesso, rebaixamento, idade e evolução ----------
function viradaAno(s: State) {
  const ano = anoDe(s.dia);
  const pontos = (L: League, id: string) => SPLITS.reduce((a, _, i) => a + (tabela(s, L.id, i + 1).find(l => l.team.id === id)?.v ?? 0), 0);
  for (const g of s.jogos) {
    const regs = new Set(Object.values(s.leagues).filter(l => l.game === g).map(l => l.region));
    for (const r of regs) {
      const T1 = s.leagues[`${g}-${r}-1`], T2 = s.leagues[`${g}-${r}-2`];
      if (!T1 || !T2) continue;
      const cai = T1.teams.slice().sort((a, b) => pontos(T1, a) - pontos(T1, b))[0];
      const campT2 = s.hist.filter(h => h.league === T2.id && h.ano === ano && h.split === SPLITS.length)[0];
      const sobe = T2.teams.find(id => s.teams[id].nome === campT2?.campeao) ?? T2.teams.slice().sort((a, b) => pontos(T2, b) - pontos(T2, a))[0];
      T1.teams = T1.teams.filter(x => x !== cai).concat(sobe);
      T2.teams = T2.teams.filter(x => x !== sobe).concat(cai);
      s.teams[cai].tier = 2; s.teams[sobe].tier = 1;
      if (isOrg(s, sobe)) require_msg(s, g, `Acesso! Sua equipe sobe para a ${T1.nome}`, `Título da Challengers garantido e vaga na elite. A diretoria está em festa: o projeto deu o primeiro grande passo.`, 'diretoria');
      if (isOrg(s, cai)) require_msg(s, g, `Rebaixamento para a ${T2.nome}`, `A pior campanha do ano custou a vaga na elite. Vamos precisar reconstruir para voltar.`, 'diretoria');
      noticia(s, `${GAMES[g].curto}: ${s.teams[sobe].nome} sobe para a ${T1.nome}; ${s.teams[cai].nome} cai.`);
    }
  }
  // idade e evolução
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
  for (const t of Object.values(s.teams)) if (!t.org || !t.manual) escalarAuto(s, t);
  // limpa jogos antigos de outros times (mantém os da org)
  for (const m of Object.values(s.matches)) {
    if (anoDe(m.dia) < ano && !isOrg(s, m.a) && !isOrg(s, m.b)) delete s.matches[m.id];
  }
  cache.delete(s);
  const orgMs = Object.values(s.matches).filter(m => m.det).sort((a, b) => b.dia - a.dia);
  orgMs.slice(40).forEach(m => delete m.det);
}

// mensagens (definidas aqui para evitar import circular com org.ts)
function require_msg(s: State, g: GameId, titulo: string, corpo: string, cat: 'diretoria' | 'tecnico') {
  s.inbox.unshift({ id: novoId(s, 'i'), dia: s.dia, de: cat === 'diretoria' ? 'Conselho da diretoria' : s.tecnicos[g]?.nome ?? 'Técnico', cargo: cat === 'diretoria' ? 'Diretoria' : `Técnico · ${GAMES[g].curto}`, titulo, corpo, cat, lida: false, game: g });
}
export function noticia(s: State, txt: string) {
  s.noticiasDia = [...(s.noticiasDia ?? []), txt].slice(-30);
}

// ---------- avanço de dia ----------
function simulaPendentes(s: State, dia: number, comDetalhe: boolean) {
  for (const m of jogosDoDia(s, dia)) {
    if (m.sa != null) continue;
    const daOrg = isOrg(s, m.a) || isOrg(s, m.b);
    if (daOrg && !comDetalhe) continue;
    for (const id of [m.a, m.b]) { const t = s.teams[id]; if (!t.org || !t.manual) escalarAuto(s, t); }
    simulaSerie(s, m, daOrg);
  }
}
function posDia(s: State, dia: number) {
  const ligas = new Set(jogosDoDia(s, dia).map(m => m.league + '|' + m.split));
  for (const k of ligas) {
    const [lid, sp] = k.split('|');
    avancaPlayoffs(s, s.leagues[lid], Number(sp), dia);
  }
}

/** um passo do botão Continuar. Retorna o motivo da parada, se houver. */
export function passo(s: State): 'jogo' | 'decisao' | null {
  if (s.fase !== 'jogo') return null;
  const pendOrg = jogosDoDia(s, s.dia).filter(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b)));
  if (pendOrg.length) return 'jogo';
  simulaPendentes(s, s.dia, false);
  posDia(s, s.dia);
  const antes = s.inbox.filter(m => m.acoes && !m.resolvida).length;
  s.dia++;
  s.diaJogo = null;
  const dy = diaDoAno(s.dia);
  if (dy === 0 && s.dia > 0) { /* novo ano */ }
  if (SPLITS.includes(dy)) criaAgendaSplit(s, SPLITS.indexOf(dy) + 1);
  if (dy === FIM_ANO) viradaAno(s);
  tickOrg(s);
  const depois = s.inbox.filter(m => m.acoes && !m.resolvida).length;
  if (depois > antes) return 'decisao';
  return null;
}

/** joga as partidas da org do dia (com resumo detalhado) e o resto da rodada */
export function jogarDia(s: State): Match[] {
  const ms = jogosDoDia(s, s.dia).filter(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b)));
  simulaPendentes(s, s.dia, true);
  posDia(s, s.dia);
  s.diaJogo = { dia: s.dia, ids: ms.map(m => m.id) };
  return ms;
}

export function proximosJogosOrg(s: State, n = 5): Match[] {
  return Object.values(s.matches).filter(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b))).sort((a, b) => a.dia - b.dia).slice(0, n);
}
export function ultimosJogosOrg(s: State, n = 5): Match[] {
  return Object.values(s.matches).filter(m => m.sa != null && (isOrg(s, m.a) || isOrg(s, m.b))).sort((a, b) => b.dia - a.dia).slice(0, n);
}
export const rndExport = rnd;
