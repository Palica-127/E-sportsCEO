// História real dos jogos (antes do save) + o que acontece no save: títulos dos times, lendas e técnicos reais.
// Dados: src/data/hist*.json (torneios, campeão, vice, elenco, MVP, ranking anual) e tecnicos.json (buscar_tecnicos.py).
import H_CS from '../data/hist.json';
import H_DOTA from '../data/hist_dota.json';
import H_FF from '../data/hist_ff.json';
import H_FIFA from '../data/hist_fifa.json';
import H_LOL from '../data/hist_lol.json';
import H_R6 from '../data/hist_r6.json';
import H_VAL from '../data/hist_val.json';
import H_WR from '../data/hist_wr.json';
import LOLX from '../data/lolx.json';
import TEC from '../data/tecnicos.json';
import type { GameId } from './games';
import type { State, Team, TorKind } from './types';

export interface TorReal { n: string; a: number; tp: string; c: string; v?: string; p?: string; r?: string[]; mvp?: [string, string, string] }
export interface HistJogo { nome: string; main: string; tipos: Record<string, string>; torneios: TorReal[]; bo?: Record<string, (string | number)[][]>; boNome?: string }

const BRUTO: Record<string, any> = { ...H_LOL, ...H_CS, ...H_DOTA, ...H_FF, ...H_FIFA, ...H_R6, ...H_VAL, ...H_WR };
export const histJogo = (g: GameId): HistJogo | null => BRUTO[g] ?? null;

// ---------- nomes antigos -> times do jogo ----------
const norm = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const base = (x: string) => norm(x.replace(/\b(team|e-?sports?|gaming|club|clan)\b/gi, ''));
const ALIAS: Partial<Record<GameId, Record<string, string>>> = {
  lol: {
    'SK Telecom T1': 'T1', 'Samsung White': 'Gen.G', 'Samsung Galaxy': 'Gen.G', 'KSV': 'Gen.G', 'DAMWON Gaming': 'Dplus KIA', 'Damwon Gaming': 'Dplus KIA',
    'DWG KIA': 'Dplus KIA', 'Edward Gaming': 'EDward Gaming', 'G2 Esports': 'G2', 'Kingzone DragonX': 'DRX', 'Star Horn Royal Club': 'Royal Club',
    'Suning': 'Weibo Gaming', 'Bilibili Gaming': 'BLG', 'Afreeca Freecs': 'DN SOOPers', 'Kwangdong Freecs': 'DN SOOPers', 'Team oNe': 'LOS',
  },
  cs2: { 'NiP': 'Ninjas in Pyjamas', 'mousesports': 'MOUZ', 'Spirit': 'Team Spirit', 'Natus Vincere': 'NAVI', 'Envy': 'Team Envy', 'Falcons': 'Team Falcons' },
  dota2: { 'PSG.LGD': 'LGD Gaming', 'Aurora Gaming': 'Aurora', 'Team Aster': 'Aster', 'NAVI': 'Natus Vincere' },
  valorant: { 'Team Envy': 'ENVY', 'NAVI': 'Natus Vincere' },
  ff: { 'Vivo Keyd': 'Vivo Keyd Stars', 'Vivo Keyd Stats': 'Vivo Keyd Stars', 'EVOS Phoenix': 'EVOS Esports', 'EVOS Divine': 'EVOS Esports', 'RRQ Kazu': 'Rex Regum Qeon' },
};
const cacheIdx = new WeakMap<State, Map<string, Map<string, Team>>>();
function indice(s: State, g: GameId) {
  let porJogo = cacheIdx.get(s);
  if (!porJogo) cacheIdx.set(s, (porJogo = new Map()));
  let m = porJogo.get(g);
  if (!m) {
    m = new Map();
    for (const t of Object.values(s.teams)) if (t.game === g && !t.acad && !t.org) { m.set('n:' + norm(t.nome), t); m.set('b:' + base(t.nome), t); }
    porJogo.set(g, m);
  }
  return m;
}
/** time do save que corresponde a um nome histórico (ou undefined) */
export function timeHist(s: State, g: GameId, nome: string | undefined): Team | undefined {
  if (!nome) return undefined;
  const m = indice(s, g);
  const al = ALIAS[g]?.[nome];
  return m.get('n:' + norm(al ?? nome)) ?? m.get('b:' + base(al ?? nome)) ?? undefined;
}

// ---------- títulos de um time ----------
/** tipo do torneio do save no vocabulário da história real do jogo */
export function tipoDoKind(g: GameId, kind: TorKind): string {
  const h = histJogo(g); const tipos = h ? Object.keys(h.tipos) : [];
  if (kind === 'worlds' || kind === 'intlB') return h?.main ?? 'Mundial';
  if (kind === 'msi' || kind === 'intlA') return tipos.find(x => x !== h?.main && x !== 'EWC' && x !== 'Liga') ?? 'Internacional';
  if (kind === 'ewc') return 'EWC';
  if (kind === 'fs') return 'First Stand';
  return 'Liga';
}
export interface Titulo { ano: number; nome: string; tp: string; vice?: string; campeao?: string; r?: string[]; mvp?: string; save: boolean }
export function titulosDoTime(s: State, t: Team): { titulos: Titulo[]; vices: Titulo[] } {
  const g = t.game, h = histJogo(g);
  const titulos: Titulo[] = [], vices: Titulo[] = [];
  for (const x of h?.torneios ?? []) {
    if (timeHist(s, g, x.c) === t) titulos.push({ ano: x.a, nome: x.n, tp: x.tp, vice: x.v || undefined, r: x.r, mvp: x.mvp?.[0], save: false });
    else if (x.v && timeHist(s, g, x.v) === t) vices.push({ ano: x.a, nome: x.n, tp: x.tp, campeao: x.c, save: false });
  }
  for (const x of s.hist) {
    if (x.game !== g) continue;
    if (x.campeao === t.nome) titulos.push({ ano: x.ano, nome: x.nome, tp: tipoDoKind(g, x.kind), vice: x.vice, save: true });
    else if (x.vice === t.nome) vices.push({ ano: x.ano, nome: x.nome, tp: tipoDoKind(g, x.kind), campeao: x.campeao, save: true });
  }
  const ord = (a: Titulo, b: Titulo) => b.ano - a.ano;
  return { titulos: titulos.sort(ord), vices: vices.sort(ord) };
}

// ---------- lendas (ranking de todos os tempos) ----------
export const PTS_ANO = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export interface Lenda { nick: string; nat: string | null; pts: number; tit: Record<string, number>; top1: number; tops: number; mvps: number; anos: [number, number]; ultimoTime?: string; pid?: string; save: number }
function pesoTipo(h: HistJogo, tp: string) {
  if (tp === h.main) return 30;
  if (tp === 'Liga') return 1;
  if (tp === 'EWC') return 7.5;
  const ordem = Object.keys(h.tipos).filter(x => x !== h.main && x !== 'EWC' && x !== 'Liga');
  return ordem[0] === tp ? 15 : 7.5;
}
const NAT3: Record<string, string> = (LOLX as any).iso ?? {};
export function lendas(s: State, g: GameId): Lenda[] {
  const h = histJogo(g);
  const L = new Map<string, Lenda>();
  const pega = (nick: string, nat?: string | null) => {
    const k = norm(nick);
    let x = L.get(k);
    if (!x) L.set(k, (x = { nick, nat: null, pts: 0, tit: {}, top1: 0, tops: 0, mvps: 0, anos: [9999, 0], save: 0 }));
    if (nat && !x.nat) x.nat = nat.length === 2 ? nat.toLowerCase() : NAT3[nat] ?? null;
    return x;
  };
  const ano = (x: Lenda, a: number) => { x.anos = [Math.min(x.anos[0], a), Math.max(x.anos[1], a)]; };
  if (h) {
    // ranking anual (Melhor Jogador do Ano / top 20 da época)
    for (const [a, lst] of Object.entries(h.bo ?? {})) lst.slice(0, 10).forEach((r, i) => {
      const x = pega(String(r[0]), r[1] ? String(r[1]) : null); x.pts += PTS_ANO[i]; x.tops++; if (i === 0) x.top1++; ano(x, +a);
    });
    if (g === 'lol') {
      const PT: Record<string, [string, number]> = { w: [h.main, 30], m: ['MSI', 15], f: ['First Stand', 7.5], l: ['Liga', 1], c: ['Copa', 0.5] };
      for (const [nick, lst] of Object.entries((LOLX as any).rtit as Record<string, [number, string, string][]>)) for (const [a, k] of lst) {
        const x = pega(nick); const [tp, p] = PT[k] ?? ['Outros', 0.5]; x.tit[tp] = (x.tit[tp] ?? 0) + 1; x.pts += p; ano(x, a);
      }
      for (const [nick, hh] of Object.entries((LOLX as any).hon as Record<string, { mv?: [number, string][] }>)) for (const [a, txt] of hh.mv ?? []) {
        const x = pega(nick); const grande = /Mundial|MSI/.test(txt); x.mvps += grande ? 1 : 0; x.pts += grande ? 5 : 1; ano(x, a);
      }
    } else {
      for (const t of h.torneios) {
        const p = pesoTipo(h, t.tp);
        const quem = t.r?.length ? t.r : (g === 'fifa' && !t.r ? [t.c] : []);
        for (const n of quem) { const x = pega(n); x.tit[t.tp] = (x.tit[t.tp] ?? 0) + 1; x.pts += p; ano(x, t.a); }
        if (t.mvp?.[0]) { const x = pega(t.mvp[0]); x.mvps++; x.pts += 5; ano(x, t.a); }
      }
    }
  }
  // o que aconteceu no save
  for (const p of Object.values(s.players)) {
    if (p.game !== g) continue;
    const x = L.get(norm(p.nick)) ?? ((p.titulos || p.mvpAno) ? pega(p.nick, p.nat) : undefined);
    if (!x) continue;
    x.pid = p.id; x.nat = x.nat ?? p.nat ?? null; x.ultimoTime = p.teamId ? s.teams[p.teamId]?.nome : undefined;
    const sv = (p.titulos ?? 0) * 4 + (p.mvpAno ?? 0) * 10;
    x.save += sv; x.pts += sv;
  }
  for (const hh of s.hall ?? []) {
    if (hh.game !== g || s.players[hh.pid]) continue;
    const x = pega(hh.nick, hh.nat); const sv = hh.titulos * 4; x.save += sv; x.pts += sv; x.ultimoTime = x.ultimoTime ?? hh.ultimoTime; ano(x, hh.ano);
  }
  return [...L.values()].filter(x => x.pts > 0).sort((a, b) => b.pts - a.pts || b.top1 - a.top1 || a.nick.localeCompare(b.nick));
}

// ---------- técnicos reais ----------
export interface TecnicoReal { nick: string; nome?: string | null; nat?: string | null; nasc?: string | null; foto?: boolean }
export function tecnicoReal(t: Team): TecnicoReal | null {
  return ((TEC as any)[t.game]?.[t.nome] as TecnicoReal | undefined) ?? null;
}
export const fotoTecnico = (g: GameId, nick: string) => `/fotos/staff/${g}/${nick.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')}.webp`;
