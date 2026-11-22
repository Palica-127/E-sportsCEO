// Campeonatos no formato do BrasLOL: pontos corridos, playoffs com chave superior e inferior, mata-mata,
// fase suíça, grupos GSL e série de acesso. O mesmo motor serve para todas as modalidades; cada jogo só
// muda o calendário, os nomes e as vagas.
import { GAMES, GameId, rawLeagues } from './games';
import OUTROS from '../data/outros.json';
import type { Match, SpecId, Stage, State, TorKind, Torneio } from './types';
import { forca, novoId } from './world';
import { shuffle } from './rng';

// ---------- chaves por tabela: cada partida diz de onde vêm os dois times (sN = seed N, wX/lX = vencedor/perdedor de X) ----------
export interface Spec { n: number; m: Record<string, [string, string]>; r: string[][]; nomes: string[]; out: Record<string, string> }
export const SPECS: Record<SpecId, Spec> = {
  // playoffs das ligas (6 times): quartas da chave superior 3x6 e 4x5; o 1º e o 2º esperam nas semis
  de6: {
    n: 6,
    m: { uq1: ['s2', 's5'], uq2: ['s3', 's4'], us1: ['s0', 'wuq2'], us2: ['s1', 'wuq1'], uf: ['wus1', 'wus2'], l1: ['luq1', 'lus1'], l2: ['luq2', 'lus2'], ls: ['wl1', 'wl2'], lf: ['wls', 'luf'], gf: ['wuf', 'wlf'] },
    r: [['uq1', 'uq2'], ['us1', 'us2'], ['uf', 'l1', 'l2'], ['ls'], ['lf'], ['gf']],
    nomes: ['Quartas da chave superior', 'Semifinais da chave superior', 'Final superior · Inferior rodada 1', 'Semifinal da chave inferior', 'Final da chave inferior', 'Grande final'],
    out: { l1: '5º-6º', l2: '5º-6º', ls: '4º lugar', lf: '3º lugar', gf: 'Vice' },
  },
  de8: {
    n: 8,
    m: { u1: ['s0', 's7'], u2: ['s3', 's4'], u3: ['s2', 's5'], u4: ['s1', 's6'], us1: ['wu1', 'wu2'], us2: ['wu3', 'wu4'], lb1: ['lu1', 'lu2'], lb2: ['lu3', 'lu4'], uf: ['wus1', 'wus2'], lb3: ['wlb1', 'lus2'], lb4: ['wlb2', 'lus1'], lb5: ['wlb3', 'wlb4'], lbf: ['wlb5', 'luf'], gf: ['wuf', 'wlbf'] },
    r: [['u1', 'u2', 'u3', 'u4'], ['us1', 'us2', 'lb1', 'lb2'], ['uf', 'lb3', 'lb4'], ['lb5'], ['lbf'], ['gf']],
    nomes: ['Quartas da chave superior', 'Rodada 2', 'Rodada 3', 'Rodada 4', 'Final da chave inferior', 'Grande final'],
    out: { lb1: 'Quartas', lb2: 'Quartas', lb3: 'Quartas', lb4: 'Quartas', lb5: 'Semifinal', lbf: 'Semifinal', gf: 'Vice' },
  },
  de4: {
    n: 4,
    m: { u1: ['s0', 's3'], u2: ['s1', 's2'], uf: ['wu1', 'wu2'], lb1: ['lu1', 'lu2'], lbf: ['wlb1', 'luf'], gf: ['wuf', 'wlbf'] },
    r: [['u1', 'u2'], ['uf', 'lb1'], ['lbf'], ['gf']],
    nomes: ['Rodada 1', 'Rodada 2', 'Final da chave inferior', 'Final do Play-In'],
    out: { lb1: 'Play-In', lbf: 'Play-In', gf: 'Play-In' },
  },
  se4: {
    n: 4, m: { s1: ['s0', 's3'], s2: ['s1', 's2'], f: ['ws1', 'ws2'] },
    r: [['s1', 's2'], ['f']], nomes: ['Semifinais', 'Final'], out: { s1: 'Semifinal', s2: 'Semifinal', f: 'Vice' },
  },
  ko8: {
    n: 8, m: { q1: ['s0', 's1'], q2: ['s2', 's3'], q3: ['s4', 's5'], q4: ['s6', 's7'], s1: ['wq1', 'wq2'], s2: ['wq3', 'wq4'], f: ['ws1', 'ws2'] },
    r: [['q1', 'q2', 'q3', 'q4'], ['s1', 's2'], ['f']], nomes: ['Quartas de final', 'Semifinais', 'Grande final'],
    out: { q1: 'Quartas', q2: 'Quartas', q3: 'Quartas', q4: 'Quartas', s1: 'Semifinal', s2: 'Semifinal', f: 'Vice' },
  },
  gsl4: {
    n: 4, m: { u1: ['s0', 's3'], u2: ['s1', 's2'], w: ['wu1', 'wu2'], l: ['lu1', 'lu2'], d: ['lw', 'wl'] },
    r: [['u1', 'u2'], ['w', 'l'], ['d']], nomes: ['Grupos · Abertura', 'Grupos · Vencedores e eliminação', 'Grupos · Decisiva'],
    out: { l: 'Grupos', d: 'Grupos' },
  },
  bo: { n: 2, m: { a: ['s0', 's1'] }, r: [['a']], nomes: ['Série de acesso'], out: { a: 'Acesso' } },
};
const FINAIS = new Set(['gf', 'f']);

// ---------- calendário anual por jogo (dia do ano; o BrasLOL foi a base) ----------
export interface Evento { d: number; kind: TorKind; split?: number; W?: number }
const CAL_LOL: Evento[] = [
  { d: 12, kind: 'split', split: 1, W: 55 }, { d: 72, kind: 'fs' }, { d: 94, kind: 'split', split: 2, W: 55 },
  { d: 158, kind: 'msi' }, { d: 187, kind: 'ewc' }, { d: 203, kind: 'split', split: 3, W: 64 }, { d: 272, kind: 'worlds' },
];
const CAL_OUTROS: Evento[] = [
  { d: 12, kind: 'split', split: 1, W: 55 }, { d: 94, kind: 'split', split: 2, W: 55 }, { d: 158, kind: 'intlA' },
  { d: 203, kind: 'split', split: 3, W: 64 }, { d: 272, kind: 'intlB' },
];
export function calendario(g: GameId): Evento[] { return g === 'lol' ? CAL_LOL : CAL_OUTROS; }
export const FIM_TEMPORADA = 340;

const DIAS = {
  fs: [72, 75, 78, 81, 84, 87],
  msiPI: [158, 160, 162, 164], msi: [168, 171, 174, 177, 180, 183],
  ewcG: [187, 189, 191], ewcK: [194, 196, 198],
  wPI: [272, 274, 276, 278], wSw: [285, 288, 291, 294, 297], wK: [311, 317, 324],
  aA: [160, 163, 166, 169, 172, 175],
  bSw: [280, 283, 286, 289, 292], bK: [304, 310, 316],
};

export function nomeIntl(g: GameId, kind: TorKind): string {
  if (g === 'lol') return ({ fs: 'First Stand', msi: 'MSI', ewc: 'Esports World Cup', worlds: 'Mundial' } as Record<string, string>)[kind] ?? kind;
  const intl = (OUTROS as any)[g].intl;
  return kind === 'intlA' ? intl.A.nome : intl.B.nome;
}

// ---------- utilidades ----------
const ANO0 = 2027, DIAS_ANO = 364;
export const anoDe = (dia: number) => ANO0 + Math.floor(dia / DIAS_ANO);
export const inicioAno = (ano: number) => (ano - ANO0) * DIAS_ANO;

function boPadrao(g: GameId) { return g === 'lol' || g === 'wr' ? 5 : 3; }
function roundRobin(ids: string[]): [string, string][][] {
  const t: (string | null)[] = ids.slice();
  if (t.length % 2) t.push(null);
  const n = t.length, rs: [string, string][][] = [];
  for (let r = 0; r < n - 1; r++) {
    const ps: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) { const a = t[i], b = t[n - 1 - i]; if (a && b) ps.push(r % 2 ? [b, a] : [a, b]); }
    rs.push(ps);
    t.splice(1, 0, t.pop()!);
  }
  return [...rs, ...rs.map(p => p.map(([a, b]) => [b, a] as [string, string]))];
}

function addMatch(s: State, m: Omit<Match, 'id'>, onAdd: (m: Match) => void): Match {
  const mm: Match = { id: novoId(s, 'm'), ...m };
  s.matches[mm.id] = mm;
  onAdd(mm);
  return mm;
}
const venc = (m: Match) => (m.sa! > m.sb! ? m.a : m.b);
const perd = (m: Match) => (m.sa! > m.sb! ? m.b : m.a);

// ---------- criação dos torneios ----------
function novoTorneio(s: State, t: Omit<Torneio, 'id' | 'si' | 'elim'>): Torneio {
  const tor: Torneio = { id: novoId(s, 'T'), si: 0, elim: {}, ...t };
  s.torneios[tor.id] = tor;
  return tor;
}
function stage(p: Partial<Stage> & Pick<Stage, 'tipo' | 'nome' | 'dias' | 'bo' | 'boF'>): Stage {
  return { seeds: [], ri: 0, res: {}, ...p };
}

/** split regional: elite com pontos corridos (ida e volta) + playoffs de 6; Challengers com pontos corridos + semis e final */
export function criaSplit(s: State, g: GameId, leagueId: string, split: number, dia0: number, W: number): Torneio {
  const L = s.leagues[leagueId];
  const ids = shuffle(s, L.teams);
  const rounds = roundRobin(ids);
  const n = rounds.length;
  const elite = L.tier === 1;
  const vagas = ids.length >= 6 && elite ? 6 : 4;
  const poR = vagas === 6 ? 6 : 2;
  const gap = Math.max(2, Math.floor((W - (elite ? 0 : 4)) / (n + poR + 1)));
  const dRR = rounds.map((_, i) => dia0 + i * gap);
  const dPO = Array.from({ length: poR }, (_, i) => dia0 + (n + i) * gap + 1);
  const bo = GAMES[g].boReg;
  const tor = novoTorneio(s, {
    game: g, ano: anoDe(dia0), kind: elite ? 'split' : 'd2', nome: `${L.nome} · Split ${split}`, league: leagueId, split, teams: ids,
    stages: [
      stage({ tipo: 'rr', nome: 'Fase de pontos', dias: dRR, bo, boF: bo, rounds, seeds: ids }),
      stage({ tipo: 'br', spec: vagas === 6 ? 'de6' : 'se4', nome: 'Playoffs', dias: dPO, bo: boPadrao(g), boF: 5 }),
    ],
  });
  return tor;
}

/** série de acesso: último da elite x campeão da Challengers (melhor de 5) */
export function criaAcesso(s: State, g: GameId, region: string, split: number, dia: number, ultimo: string, campeao: string): Torneio {
  return novoTorneio(s, {
    game: g, ano: anoDe(dia), kind: 'acesso', nome: `${s.leagues[`${g}-${region}-1`].nome} · Acesso (split ${split})`, league: `${g}-${region}-1`, split,
    teams: [ultimo, campeao], stages: [stage({ tipo: 'br', spec: 'bo', nome: 'Série de acesso', dias: [dia], bo: 5, boF: 5, seeds: [ultimo, campeao] })],
  });
}

/** classificados de uma região pelo ranking do split (campeão, vice, ...) */
function rankRegiao(s: State, g: GameId, region: string, split: number, ano: number): string[] {
  return s.ranks[`${ano}-${g}-${region}-1-${split}`] ?? s.leagues[`${g}-${region}-1`].teams.slice().sort((a, b) => forca(s, s.teams[b]) - forca(s, s.teams[a]));
}
interface Vaga { id: string; region: string; seed: number }
function vagas(s: State, g: GameId, split: number, ano: number, slots: Record<string, number>): Vaga[] {
  const out: Vaga[] = [];
  for (const [region, n] of Object.entries(slots)) rankRegiao(s, g, region, split, ano).slice(0, n).forEach((id, i) => out.push({ id, region, seed: i + 1 }));
  return out;
}
function ordemSeed(s: State, v: Vaga[]): Vaga[] {
  return v.slice().sort((a, b) => a.seed - b.seed || forca(s, s.teams[b.id]) - forca(s, s.teams[a.id]));
}
/** no de8, evita times da mesma região na primeira rodada quando dá (como no BrasLOL) */
function semMesmaRegiao(s: State, ids: string[]): string[] {
  if (ids.length !== 8) return ids;
  const tI = [0, 3, 2, 1], bI = [7, 4, 5, 6];
  const reg = (id: string) => s.teams[id].region;
  const top = tI.map(i => ids[i]), bot = bI.map(i => ids[i]);
  let best = bot, bc = 1e9;
  const perm = (arr: string[]): string[][] => (arr.length <= 1 ? [arr] : arr.flatMap((x, i) => perm([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [x, ...p])));
  for (const p of perm(bot)) {
    const c = p.reduce((n, id, i) => n + (reg(id) === reg(top[i]) ? 1000 : 0) + Math.abs(bot.indexOf(id) - i), 0);
    if (c < bc) { bc = c; best = p; }
  }
  const out = ids.slice();
  tI.forEach((ti, i) => { out[ti] = top[i]; out[bI[i]] = best[i]; });
  return out;
}

const SLOTS = {
  fs: { LCK: 2, LPL: 2, LEC: 1, LCS: 1, LCP: 1, CBLOL: 1 },
  msi: { LCK: 2, LPL: 2, LEC: 2, LCS: 2, LCP: 2, CBLOL: 1 },
  ewc: { LCK: 4, LPL: 2, LEC: 4, LCS: 2, LCP: 2, CBLOL: 2 },
  worlds: { LCK: 3, LPL: 3, LEC: 3, LCS: 3, LCP: 3, CBLOL: 2 },
};

export function criaIntl(s: State, g: GameId, kind: TorKind, ano: number): Torneio | null {
  const y0 = inicioAno(ano);
  const D = (xs: number[]) => xs.map(d => y0 + d);
  const nome = `${nomeIntl(g, kind)} ${ano}`;
  const pb = boPadrao(g);
  if (kind === 'fs') {
    const q = ordemSeed(s, vagas(s, g, 1, ano, SLOTS.fs)).map(v => v.id);
    return novoTorneio(s, { game: g, ano, kind, nome, teams: q, stages: [stage({ tipo: 'br', spec: 'de8', nome: 'Chave', dias: D(DIAS.fs), bo: 5, boF: 5, seeds: semMesmaRegiao(s, q) })] });
  }
  if (kind === 'msi') {
    const q = vagas(s, g, 2, ano, SLOTS.msi);
    const primeiros = q.filter(v => v.seed === 1);
    const segundos = q.filter(v => v.seed > 1).sort((a, b) => forca(s, s.teams[b.id]) - forca(s, s.teams[a.id]));
    const direct = ordemSeed(s, [...primeiros, ...segundos.slice(0, 1)]).map(v => v.id);
    const pi = segundos.slice(1).map(v => v.id);
    return novoTorneio(s, {
      game: g, ano, kind, nome, teams: q.map(v => v.id), direct,
      stages: [
        stage({ tipo: 'br', spec: 'de4', nome: 'Play-In', dias: D(DIAS.msiPI), bo: 5, boF: 5, seeds: pi }),
        stage({ tipo: 'br', spec: 'de8', nome: 'Chave', dias: D(DIAS.msi), bo: 5, boF: 5 }),
      ],
    });
  }
  if (kind === 'ewc') {
    const q = ordemSeed(s, vagas(s, g, 2, ano, SLOTS.ewc));
    const potes = [0, 1, 2, 3].map(i => q.slice(i * 4, i * 4 + 4));
    let best: string[][] = [], bc = 1e9;
    for (let a = 0; a < 200 && bc > 0; a++) {
      const P = potes.map(p => (a ? shuffle(s, p) : p.slice()));
      const G = [0, 1, 2, 3].map(gi => P.map(p => p[gi]).filter(Boolean));
      const c = G.reduce((n, gr) => n + gr.reduce((k, x, i) => k + gr.slice(i + 1).filter(y => y.region === x.region).length, 0), 0);
      if (c < bc) { bc = c; best = G.map(gr => gr.map(v => v.id)); }
    }
    return novoTorneio(s, {
      game: g, ano, kind, nome, teams: q.map(v => v.id),
      stages: [
        stage({ tipo: 'gsl', spec: 'gsl4', nome: 'Grupos', dias: D(DIAS.ewcG), bo: 1, boF: 1, grupos: best.map((ids, i) => ({ n: 'ABCD'[i], ids })) }),
        stage({ tipo: 'br', spec: 'ko8', nome: 'Mata-mata', dias: D(DIAS.ewcK), bo: 3, boF: 5 }),
      ],
    });
  }
  if (kind === 'worlds') {
    const slots: Record<string, number> = { ...SLOTS.worlds };
    const msi = Object.values(s.torneios).find(t => t.kind === 'msi' && t.ano === ano && t.game === g);
    if (msi?.campeao) slots[s.teams[msi.campeao].region]++;
    if (msi?.vice) slots[s.teams[msi.vice].region]++;
    const q = vagas(s, g, 3, ano, slots);
    // Play-In: os 4 seeds mais fracos (sem repetir região quando dá); nenhum campeão de liga
    const cand = q.filter(v => v.seed > 1).sort((a, b) => b.seed - a.seed || forca(s, s.teams[a.id]) - forca(s, s.teams[b.id]));
    const pi: Vaga[] = [];
    for (const v of cand) if (pi.length < 4 && !pi.some(x => x.region === v.region)) pi.push(v);
    for (const v of cand) if (pi.length < 4 && !pi.includes(v)) pi.push(v);
    const direct = q.filter(v => !pi.includes(v)).map(v => v.id);
    return novoTorneio(s, {
      game: g, ano, kind, nome, teams: q.map(v => v.id), direct,
      stages: [
        stage({ tipo: 'br', spec: 'de4', nome: 'Play-In', dias: D(DIAS.wPI), bo: 5, boF: 5, seeds: ordemSeed(s, pi).map(v => v.id) }),
        stage({ tipo: 'swiss', nome: 'Fase suíça', dias: D(DIAS.wSw), bo: 1, boF: 3 }),
        stage({ tipo: 'br', spec: 'ko8', nome: 'Mata-mata', dias: D(DIAS.wK), bo: 5, boF: 5 }),
      ],
    });
  }
  const intl = (OUTROS as any)[g].intl;
  if (kind === 'intlA') {
    const q = ordemSeed(s, vagas(s, g, 2, ano, intl.A.vagas)).map(v => v.id);
    return novoTorneio(s, { game: g, ano, kind, nome, teams: q, stages: [stage({ tipo: 'br', spec: 'de8', nome: 'Chave', dias: D(DIAS.aA), bo: pb, boF: 5, seeds: semMesmaRegiao(s, q) })] });
  }
  if (kind === 'intlB') {
    const q = ordemSeed(s, vagas(s, g, 3, ano, intl.B.vagas)).map(v => v.id);
    return novoTorneio(s, {
      game: g, ano, kind, nome, teams: q,
      stages: [
        stage({ tipo: 'swiss', nome: 'Fase suíça', dias: D(DIAS.bSw), bo: 1, boF: 3, seeds: q }),
        stage({ tipo: 'br', spec: 'ko8', nome: 'Mata-mata', dias: D(DIAS.bK), bo: pb, boF: 5 }),
      ],
    });
  }
  return null;
}

// ---------- andamento ----------
export interface Ganchos { onAdd: (m: Match) => void; fimTorneio: (tor: Torneio) => void; byId: (id: string) => Match; doTorneio: (torId: string) => Match[] }

/** cria as partidas da rodada atual da fase atual */
export function abreRodada(s: State, tor: Torneio, h: Ganchos) {
  const st = tor.stages[tor.si];
  const dia = st.dias[st.ri] ?? (st.dias[st.dias.length - 1] + 2 * (st.ri - st.dias.length + 1));
  const base = { game: tor.game, tor: tor.id, st: tor.si, dia, rodada: st.ri + 1 };
  if (st.tipo === 'rr') {
    for (const [a, b] of st.rounds![st.ri]) addMatch(s, { ...base, k: 'rr', label: `Rodada ${st.ri + 1}`, a, b, bo: st.bo }, h.onAdd);
    return;
  }
  if (st.tipo === 'swiss') {
    const rec = st.rec!;
    const abertos = st.seeds.filter(id => rec[id].w < 3 && rec[id].l < 3);
    const grupos: Record<string, string[]> = {};
    for (const id of abertos) (grupos[`${rec[id].w}-${rec[id].l}`] ??= []).push(id);
    for (const k of Object.keys(grupos).sort()) {
      let ids = grupos[k];
      let pares: [string, string][] = [];
      if (st.ri === 0) { const h2 = ids.length / 2; ids = [...ids.slice(0, h2), ...shuffle(s, ids.slice(h2))]; for (let i = 0; i < h2; i++) pares.push([ids[i], ids[i + h2]]); }
      else {
        let best: string[] | null = null;
        for (let a = 0; a < 80 && !best; a++) { const x = shuffle(s, ids); let ok = true; for (let i = 0; i < x.length; i += 2) if (rec[x[i]].opp.includes(x[i + 1])) { ok = false; break; } if (ok) best = x; }
        best ??= shuffle(s, ids);
        for (let i = 0; i + 1 < best.length; i += 2) pares.push([best[i], best[i + 1]]);
      }
      for (const [a, b] of pares) {
        const decisivo = [a, b].some(id => rec[id].w === 2 || rec[id].l === 2);
        addMatch(s, { ...base, k: 'sw' + k, label: `Suíço · Rodada ${st.ri + 1} (${k})`, a, b, bo: decisivo ? st.boF : st.bo }, h.onAdd);
      }
    }
    return;
  }
  const sp = SPECS[st.spec!];
  const src = (seeds: string[], res: Record<string, string>, ref: string, pre: string) => {
    if (ref[0] === 's') return seeds[Number(ref.slice(1))];
    const m = h.byId(res[pre + ref.slice(1)]);
    return ref[0] === 'w' ? venc(m) : perd(m);
  };
  const grupos = st.tipo === 'gsl' ? st.grupos!.map(g => ({ pre: g.n + ':', seeds: g.ids, nome: `Grupo ${g.n}` })) : [{ pre: '', seeds: st.seeds, nome: '' }];
  for (const gr of grupos) {
    for (const k of sp.r[st.ri]) {
      const [ra, rb] = sp.m[k];
      const a = src(gr.seeds, st.res, ra, gr.pre), b = src(gr.seeds, st.res, rb, gr.pre);
      const lbl = gr.nome ? `${gr.nome} · ${sp.nomes[st.ri].replace('Grupos · ', '')}` : (st.nome === 'Play-In' ? 'Play-In · ' : '') + sp.nomes[st.ri];
      const m = addMatch(s, { ...base, k: gr.pre + k, label: lbl, a, b, bo: FINAIS.has(k) ? st.boF : st.bo }, h.onAdd);
      st.res[gr.pre + k] = m.id;
    }
  }
}

export function iniciaTorneio(s: State, tor: Torneio, h: Ganchos) {
  const st = tor.stages[0];
  if (st.tipo === 'swiss') st.rec = Object.fromEntries(st.seeds.map(id => [id, { w: 0, l: 0, opp: [] }]));
  abreRodada(s, tor, h);
}

/** chamado depois que as partidas de um dia foram jogadas */
export function avancaTorneio(s: State, tor: Torneio, h: Ganchos, jogos: Match[]) {
  if (tor.fim) return;
  const st = tor.stages[tor.si];
  const daRodada = jogos.filter(m => m.st === tor.si && m.rodada === st.ri + 1);
  if (!daRodada.length || daRodada.some(m => m.sa == null)) return;
  // registra resultados da rodada
  if (st.tipo === 'swiss') {
    for (const m of daRodada) {
      const w = venc(m), l = perd(m);
      st.rec![w].w++; st.rec![l].l++; st.rec![w].opp.push(l); st.rec![l].opp.push(w);
      if (st.rec![l].l === 3) tor.elim[l] = 'Fase suíça';
    }
  } else if (st.tipo !== 'rr') {
    const sp = SPECS[st.spec!];
    for (const m of daRodada) { const k = m.k.includes(':') ? m.k.split(':')[1] : m.k; const o = sp.out[k]; if (o && o !== 'Vice') tor.elim[perd(m)] = o; }
  }
  const terminou = st.tipo === 'rr' ? st.ri >= st.rounds!.length - 1
    : st.tipo === 'swiss' ? st.seeds.every(id => st.rec![id].w >= 3 || st.rec![id].l >= 3)
      : st.ri >= SPECS[st.spec!].r.length - 1;
  if (!terminou) { st.ri++; abreRodada(s, tor, h); return; }
  st.fim = true;
  st.out = saidaDaFase(s, tor, st, h);
  if (tor.si < tor.stages.length - 1) {
    const nx = tor.stages[tor.si + 1];
    nx.seeds = seedsSeguinte(s, tor, st, nx);
    tor.si++;
    if (nx.tipo === 'swiss') nx.rec = Object.fromEntries(nx.seeds.map(id => [id, { w: 0, l: 0, opp: [] }]));
    abreRodada(s, tor, h);
    return;
  }
  // fim do torneio
  tor.fim = true;
  tor.campeao = st.out[0];
  tor.vice = st.out[1];
  tor.elim[tor.vice] = 'Vice';
  const vistos = new Set<string>();
  tor.rank = [];
  for (let i = tor.stages.length - 1; i >= 0; i--) for (const id of tor.stages[i].out ?? []) if (!vistos.has(id)) { vistos.add(id); tor.rank.push(id); }
  for (const id of tor.teams) if (!vistos.has(id)) tor.rank.push(id);
  h.fimTorneio(tor);
}

function saidaDaFase(s: State, tor: Torneio, st: Stage, h: Ganchos): string[] {
  if (st.tipo === 'rr') return tabelaRR(s, tor, st, h.doTorneio(tor.id)).map(l => l.id);
  if (st.tipo === 'swiss') {
    const r = st.rec!;
    return st.seeds.slice().sort((a, b) => (r[b].w >= 3 ? 1 : 0) - (r[a].w >= 3 ? 1 : 0) || r[a].l - r[b].l || r[b].w - r[a].w || forca(s, s.teams[b]) - forca(s, s.teams[a]));
  }
  if (st.tipo === 'gsl') {
    const q: Record<string, [string, string]> = {};
    for (const g of st.grupos!) q[g.n] = [venc(h.byId(st.res[g.n + ':w'])), venc(h.byId(st.res[g.n + ':d']))];
    const ord = [q.A[0], q.B[1], q.C[0], q.D[1], q.B[0], q.A[1], q.D[0], q.C[1]];
    return [...ord, ...st.grupos!.flatMap(g => g.ids).filter(id => !ord.includes(id))];
  }
  // chave: campeão, vice e o resto pela rodada em que caiu (mais tarde = melhor)
  const sp = SPECS[st.spec!];
  const fin = h.byId(st.res[sp.r[sp.r.length - 1][0]]);
  const caiu: Record<string, number> = {};
  sp.r.forEach((ks, ri) => ks.forEach(k => { const id = st.res[k]; if (id) { const m = h.byId(id); if (sp.out[k]) caiu[perd(m)] = ri; } }));
  const resto = st.seeds.filter(id => id !== venc(fin) && id !== perd(fin)).sort((a, b) => (caiu[b] ?? -1) - (caiu[a] ?? -1) || st.seeds.indexOf(a) - st.seeds.indexOf(b));
  return [venc(fin), perd(fin), ...resto];
}

function seedsSeguinte(s: State, tor: Torneio, st: Stage, nx: Stage): string[] {
  const out = st.out!;
  if (st.tipo === 'rr') return out.slice(0, SPECS[nx.spec!].n);
  if (st.tipo === 'br' && st.spec === 'de4') { // campeão do Play-In entra como último seed
    const ids = [...(tor.direct ?? []), out[0]];
    return nx.tipo === 'br' && nx.spec === 'de8' ? semMesmaRegiao(s, ids) : ids.sort((a, b) => forca(s, s.teams[b]) - forca(s, s.teams[a]));
  }
  if (st.tipo === 'swiss') { const q = out.slice(0, 8); return [q[0], q[7], q[3], q[4], q[2], q[5], q[1], q[6]]; }
  return out.slice(0, SPECS[nx.spec!].n);
}

// ---------- tabela de pontos corridos ----------
export interface LinhaRR { id: string; j: number; v: number; d: number; mp: number; mc: number }
export function tabelaRR(s: State, tor: Torneio, st: Stage, jogos: Match[]): LinhaRR[] {
  const L: Record<string, LinhaRR> = {};
  for (const id of st.seeds) L[id] = { id, j: 0, v: 0, d: 0, mp: 0, mc: 0 };
  for (const m of jogos) {
    if (m.k !== 'rr' || m.sa == null || m.tor !== tor.id) continue;
    const a = L[m.a], b = L[m.b];
    if (!a || !b) continue;
    a.j++; b.j++; a.mp += m.sa; a.mc += m.sb!; b.mp += m.sb!; b.mc += m.sa;
    if (m.sa > m.sb!) { a.v++; b.d++; } else { b.v++; a.d++; }
  }
  return Object.values(L).sort((x, y) => y.v - x.v || (y.mp - y.mc) - (x.mp - x.mc) || forca(s, s.teams[y.id]) - forca(s, s.teams[x.id]));
}

/** ordem das regiões de um jogo (para listas) */
export const regioesDe = (g: GameId) => Object.keys(rawLeagues(g));
