// Montagem do mundo: times, jogadores e ligas a partir dos dados reais.
import { GAMES, GameId, rawLeagues, RawTeam } from './games';
import { HasSeed, hashStr, pick, ri, rnd, clamp, weighted } from './rng';
import type { League, Player, State, Team, Traco } from './types';
import LOLX from '../data/lolx.json';
import NOMES from '../data/nomes.json';
import LOGOS from '../data/logos.LOGOS.json';

const LOGO_SET = new Set<string>(LOGOS as string[]);
const LOGO_ALIAS: Record<string, string> = {
  'royal-never-give-up': 'royal-club', 'sk-telecom-t1': 't1', 'g2-esports': 'g2', 'damwon-gaming': 'dplus-kia',
  'dwg-kia': 'dplus-kia', 'bilibili-gaming': 'blg', 'gen-g-esports': 'gen-g', 'red-canids': 'red-canids-kalunga',
};

export function slug(nome: string): string {
  return nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
/** caminho do logo real, se o usuário colocou o arquivo na pasta logos/ */
export function logoUrl(sl: string): string | null {
  const s = LOGO_SET.has(sl) ? sl : LOGO_ALIAS[sl];
  return s && LOGO_SET.has(s) ? `${import.meta.env?.BASE_URL ?? '/'}logos/${s}.webp` : null;
}

const IGNORA = new Set(['gaming', 'esports', 'e-sports', 'team', 'club', 'clan', 'academy', 'the', 'de', 'do', 'da']);
export function siglaDe(nome: string): string {
  const limpo = nome.replace(/[^\p{L}\p{N} ]/gu, ' ').trim();
  if (limpo.replace(/ /g, '').length <= 4 && !limpo.includes(' ')) return limpo.toUpperCase();
  const ws = limpo.split(/\s+/).filter(w => !IGNORA.has(w.toLowerCase()));
  const base = ws.length ? ws : limpo.split(/\s+/);
  if (base.length === 1) return base[0].slice(0, 3).toUpperCase();
  return base.map(w => (/^\d+$/.test(w) ? w : w[0])).join('').slice(0, 4).toUpperCase();
}
export function corDe(nome: string): string {
  const h = hashStr(nome);
  return `hsl(${h % 360} ${55 + (h >> 9) % 25}% ${42 + (h >> 17) % 12}%)`;
}

export function salario(ovr: number): number {
  return Math.round((450 * Math.pow(1.125, ovr - 60)) / 100) * 100;
}
export function valorMercado(p: Player): number {
  const idadeF = p.idade <= 21 ? 1.4 : p.idade <= 25 ? 1.15 : p.idade <= 28 ? 1 : 0.7;
  return Math.round((salario(p.ovr) * 30 * idadeF * (1 + Math.max(0, p.pot - p.ovr) / 30)) / 1000) * 1000;
}

const TRACOS: Traco[] = ['lider', 'profissional', 'ambicioso', 'esquentado', 'tranquilo', 'irregular', 'talentoso'];
const isoMap = (LOLX as any).iso as Record<string, string>;
const lolNat = (LOLX as any).nat as Record<string, string>;
const N = NOMES as any;

function natCluster(g: GameId, region: string): string {
  return N.cluster?.[g]?.[region] ?? 'GLOBAL';
}
function sorteiaPais(s: HasSeed, cl: string): string {
  const pesos: Record<string, number> = N.pesos?.[cl] ?? { BR: 1 };
  const ccs = Object.keys(pesos).filter(c => N.paises[c]);
  return ccs.length ? weighted(s, ccs, (c: string) => pesos[c]) : 'BR';
}
export function geraNick(s: HasSeed, cc: string): string {
  const P = N.paises[cc] ?? N.paises.BR;
  const r = rnd(s);
  if (r < 0.45 && P.a?.length) return pick(s, P.a as string[]) + (P.suf ? pick(s, P.suf as string[]) : '');
  const n: string = pick(s, P.n);
  const forma = ri(s, 0, 3);
  if (forma === 0) return n + 'zin';
  if (forma === 1) return 'x' + n;
  if (forma === 2) return n + ri(s, 1, 99);
  return n.slice(0, Math.max(3, Math.ceil(n.length * 0.6))).toUpperCase();
}

export function novoId(s: State, pre: string): string {
  return pre + (s.nextId++).toString(36);
}

export function criaJogador(s: State, o: Partial<Player> & { game: GameId; role: number; ovr: number; nick: string }): Player {
  const idade = o.idade ?? ri(s, 18, 27);
  const pot = o.pot ?? clamp(Math.round(o.ovr + Math.max(0, 25 - idade) * (0.6 + rnd(s) * 1.4)), o.ovr, 97);
  const p: Player = {
    id: novoId(s, 'p'), nick: o.nick, game: o.game, role: o.role, ovr: o.ovr, pot, idade,
    nat: o.nat ?? null, teamId: o.teamId ?? null, sal: o.sal ?? salario(o.ovr), contrato: o.contrato ?? 2028 + ri(s, 0, 1),
    forma: 0, moral: ri(s, 58, 74), traco: o.traco ?? pick(s, TRACOS), real: o.real ?? false, jogos: 0, mvps: 0,
  };
  s.players[p.id] = p;
  return p;
}

function natDe(raw: any, nick: string, g: GameId): string | null {
  if (typeof raw === 'string') return raw.toLowerCase();
  if (g === 'lol' && lolNat[nick]) return isoMap[lolNat[nick]] ?? null;
  return null;
}

function criaTime(s: State, g: GameId, region: string, tier: 1 | 2, raw: RawTeam): Team {
  const t: Team = {
    id: novoId(s, 't'), nome: raw.n, sigla: siglaDe(raw.n), game: g, region, tier,
    cor: corDe(raw.n), slug: slug(raw.n), elenco: [], ult: [],
  };
  s.teams[t.id] = t;
  const nR = GAMES[g].roles.length;
  const cl = natCluster(g, region);
  for (let r = 0; r < nR; r++) {
    const rp = raw.p?.[r];
    let p: Player;
    if (rp) {
      let ovr = Number(rp[1]);
      // o T2 do LoL vem com nota única; espalha um pouco para dar personalidade
      if (g === 'lol' && tier === 2) ovr = clamp(ovr - 3 + (hashStr(String(rp[0])) % 8), 64, 78);
      p = criaJogador(s, { game: g, role: r, ovr, nick: String(rp[0]), idade: rp[2] ? Number(rp[2]) : undefined, nat: natDe(rp[3], String(rp[0]), g), teamId: t.id, real: true });
    } else {
      const cc = sorteiaPais(s, cl);
      p = criaJogador(s, { game: g, role: r, ovr: tier === 1 ? ri(s, 70, 76) : ri(s, 63, 71), nick: geraNick(s, cc), nat: cc.toLowerCase(), teamId: t.id });
    }
    t.elenco.push(p.id);
  }
  // 2 reservas por time
  for (let k = 0; k < 2; k++) {
    const cc = sorteiaPais(s, cl);
    const titular = s.players[t.elenco[k % nR]];
    const p = criaJogador(s, { game: g, role: ri(s, 0, nR - 1), ovr: clamp(titular.ovr - ri(s, 5, 11), 55, 85), nick: geraNick(s, cc), nat: cc.toLowerCase(), teamId: t.id, idade: ri(s, 17, 23) });
    t.elenco.push(p.id);
  }
  return t;
}

/** cria ligas T1/T2 de todas as regiões de um jogo */
export function criaJogo(s: State, g: GameId) {
  for (const [rid, raw] of Object.entries(rawLeagues(g))) {
    for (const tier of [1, 2] as const) {
      const lista = tier === 1 ? raw.t1 : raw.t2;
      const L: League = { id: `${g}-${rid}-${tier}`, game: g, region: rid, tier, nome: tier === 1 ? raw.nome : `${raw.nome} Challengers`, teams: [] };
      for (const rt of lista) L.teams.push(criaTime(s, g, rid, tier, rt).id);
      s.leagues[L.id] = L;
    }
  }
  // agentes livres de cada região (para peneira e reposição)
  for (const rid of Object.keys(rawLeagues(g))) {
    const cl = natCluster(g, rid);
    for (let k = 0; k < 20; k++) {
      const cc = sorteiaPais(s, cl);
      criaJogador(s, { game: g, role: k % GAMES[g].roles.length, ovr: ri(s, 60, 72), nick: geraNick(s, cc), nat: cc.toLowerCase(), idade: ri(s, 16, 26) });
    }
  }
}

export function titulares(s: State, t: Team): Player[] {
  const n = GAMES[t.game].roles.length;
  return t.elenco.slice(0, n).map(id => s.players[id]).filter(Boolean);
}
export function reservas(s: State, t: Team): Player[] {
  const n = GAMES[t.game].roles.length;
  return t.elenco.slice(n).map(id => s.players[id]).filter(Boolean);
}
export function forca(s: State, t: Team): number {
  const ts = titulares(s, t);
  if (!ts.length) return 50;
  const m = ts.reduce((a, p) => a + p.ovr + p.forma * 0.8 + (p.moral - 65) / 15, 0) / ts.length;
  return Math.round((m + bonusEstrutura(s, t)) * 10) / 10;
}
/** comissão técnica, sala de treino e periféricos. Times da IA têm uma estrutura padrão pela divisão */
export function bonusEstrutura(s: State, t: Team): number {
  if (!t.org) return t.tier === 1 ? 2 : 1;
  if (!s.staff) return 1.5;
  const doJogo = (c: string) => Object.values(s.staff).find(x => x.cargo === c && x.game === t.game);
  const tec = doJogo('tecnico'), an = doJogo('analista');
  const sede = s.sede?.comodos ?? {};
  const kit = s.kits?.[t.game];
  let b = (tec ? (tec.nota - 60) / 10 : -0.5) + (an ? ((an.nota - 60) / 12) * (sede.analise?.nivel ? 1 : 0.5) : 0) + (sede.treino?.nivel ?? 0) * 0.5;
  if (kit) b += kit.nivel * 0.45 * (1 - kit.desgaste / 160);
  if (s.sede?.mudancaAte && s.sede.mudancaAte > s.dia) b -= 1;
  return Math.round(b * 10) / 10;
}

/** escalação automática do técnico: melhor jogador de cada função */
export function escalarAuto(s: State, t: Team) {
  const n = GAMES[t.game].roles.length;
  const todos = t.elenco.map(id => s.players[id]).filter(Boolean);
  const usados = new Set<string>();
  const tit: string[] = [];
  const nota = (p: Player) => p.ovr + p.forma * 0.8 + (p.moral - 65) / 15;
  for (let r = 0; r < n; r++) {
    const c = todos.filter(p => !usados.has(p.id)).sort((x, y) => (y.role === r ? 1 : 0) * 100 + nota(y) - ((x.role === r ? 1 : 0) * 100 + nota(x)))[0];
    if (c) { usados.add(c.id); tit.push(c.id); }
  }
  t.elenco = [...tit, ...todos.filter(p => !usados.has(p.id)).sort((a, b) => b.ovr - a.ovr).map(p => p.id)];
}

/** atributos derivados da nota (radar da ficha): variam por jogador de forma estável */
export const ATRIBUTOS = ['Mecânica', 'Tática', 'Clutch', 'Liderança', 'Consistência'];
export function atributos(p: Player): number[] {
  const h = hashStr(p.nick + p.game);
  const ajuste: Record<string, number[]> = {
    lider: [0, 2, 0, 8, 1], profissional: [0, 3, 0, 1, 5], ambicioso: [2, 0, 3, 0, -1], esquentado: [3, -2, 2, -4, -4],
    tranquilo: [0, 1, 4, 1, 3], irregular: [3, -1, 1, 0, -8], talentoso: [6, -2, 2, -2, -3],
  };
  return ATRIBUTOS.map((_, i) => clamp(Math.round(p.ovr + (((h >> (i * 5)) % 11) - 5) + (ajuste[p.traco]?.[i] ?? 0)), 35, 99));
}
export function humor(p: Player): { txt: string; cls: 'ok' | 'meh' | 'bad' } {
  return p.moral >= 75 ? { txt: 'Feliz', cls: 'ok' } : p.moral >= 55 ? { txt: 'Contente', cls: 'ok' } : p.moral >= 40 ? { txt: 'Insatisfeito', cls: 'meh' } : { txt: 'Irritado', cls: 'bad' };
}
export const estrelas = (ovr: number) => clamp((ovr - 58) / 8, 0.5, 5);
