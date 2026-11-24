// Definição dos 8 jogos: nomes, cores, funções, formato das partidas e dias de jogo.
import LOL from '../data/lol.json';
import OUTROS from '../data/outros.json';
import ELENCOS from '../data/elencos.json';

export type GameId = 'lol' | 'cs2' | 'valorant' | 'dota2' | 'ff' | 'r6' | 'fifa' | 'wr';

export interface GameDef {
  id: GameId;
  nome: string;
  curto: string;
  cor: string;
  roles: string[];
  roleNomes: string[];
  /** melhor de N na fase regular */
  boReg: number;
  /** dias da semana com partidas (0 = segunda) */
  dias: number[];
  /** tipo de placar de cada mapa */
  placar: 'moba' | 'rounds13' | 'rounds7' | 'clash' | 'gols';
  mapas?: string[];
}

export const GAMES: Record<GameId, GameDef> = {
  lol: { id: 'lol', nome: 'League of Legends', curto: 'LoL', cor: '#d4af37', roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'], roleNomes: ['Top', 'Caçador', 'Meio', 'Atirador', 'Suporte'], boReg: 1, dias: [5, 6], placar: 'moba' },
  cs2: { id: 'cs2', nome: 'Counter-Strike 2', curto: 'CS2', cor: '#f08c2e', roles: ['IGL', 'AWP', 'ENT', 'LUR', 'SUP'], roleNomes: ['Capitão', 'AWPer', 'Entry', 'Lurker', 'Suporte'], boReg: 3, dias: [1, 3], placar: 'rounds13', mapas: ['Mirage', 'Inferno', 'Nuke', 'Ancient', 'Anubis', 'Dust2', 'Train'] },
  valorant: { id: 'valorant', nome: 'VALORANT', curto: 'VAL', cor: '#ff4655', roles: ['DUE', 'INI', 'CTR', 'SEN', 'FLX'], roleNomes: ['Duelista', 'Iniciador', 'Controlador', 'Sentinela', 'Flex'], boReg: 3, dias: [2, 4], placar: 'rounds13', mapas: ['Ascent', 'Bind', 'Haven', 'Lotus', 'Sunset', 'Split', 'Pearl'] },
  dota2: { id: 'dota2', nome: 'Dota 2', curto: 'Dota', cor: '#c23c2a', roles: ['POS1', 'POS2', 'POS3', 'POS4', 'POS5'], roleNomes: ['Carry', 'Meio', 'Offlane', 'Suporte 4', 'Suporte 5'], boReg: 3, dias: [1, 4], placar: 'moba' },
  ff: { id: 'ff', nome: 'Free Fire', curto: 'FF', cor: '#f5b400', roles: ['IGL', 'RUSH', 'SNP', 'SUP'], roleNomes: ['Capitão', 'Rusher', 'Sniper', 'Suporte'], boReg: 3, dias: [3, 5], placar: 'clash', mapas: ['Bermuda', 'Purgatório', 'Kalahari', 'Alpine', 'Nexterra'] },
  r6: { id: 'r6', nome: 'Rainbow Six Siege', curto: 'R6', cor: '#3d8bff', roles: ['ENT', 'FLX', 'ANC', 'ROM', 'SUP'], roleNomes: ['Entry', 'Flex', 'Âncora', 'Roamer', 'Suporte'], boReg: 3, dias: [2, 6], placar: 'rounds7', mapas: ['Clubhouse', 'Oregon', 'Bank', 'Kafe', 'Chalet', 'Border', 'Skyscraper'] },
  fifa: { id: 'fifa', nome: 'EA SPORTS FC', curto: 'FC', cor: '#19c37d', roles: ['JOG'], roleNomes: ['Jogador'], boReg: 3, dias: [0, 3], placar: 'gols' },
  wr: { id: 'wr', nome: 'Wild Rift', curto: 'WR', cor: '#4fc3f7', roles: ['TOP', 'JNG', 'MID', 'ADC', 'SUP'], roleNomes: ['Top', 'Caçador', 'Meio', 'Atirador', 'Suporte'], boReg: 1, dias: [4, 6], placar: 'moba' },
};

export const GAME_IDS = Object.keys(GAMES) as GameId[];

export interface RawTeam { n: string; p: (string | number | null)[][] | null; real?: boolean }
export interface RawLeague { nome: string; regiao: string; t1: RawTeam[]; t2: RawTeam[] }

// elencos reais pesquisados (tools/buscar_elencos.py): [nick, nota, idade, nac, nome real], por cima dos dados base
const cacheLigas: Partial<Record<GameId, Record<string, RawLeague>>> = {};
export function rawLeagues(g: GameId): Record<string, RawLeague> {
  if (cacheLigas[g]) return cacheLigas[g]!;
  const base: Record<string, RawLeague> = g === 'lol' ? (LOL as any).leagues : (OUTROS as any)[g].leagues;
  const over = ((ELENCOS as any)[g] ?? {}) as Record<string, RawTeam['p']>;
  const troca = (t: RawTeam): RawTeam => (over[t.n] ? { n: t.n, p: over[t.n], real: true } : t);
  const res: Record<string, RawLeague> = {};
  for (const [k, L] of Object.entries(base)) res[k] = { ...L, t1: L.t1.map(troca), t2: L.t2.map(troca) };
  return (cacheLigas[g] = res);
}

export function regioes(g: GameId): { id: string; nome: string; regiao: string }[] {
  return Object.entries(rawLeagues(g)).map(([id, l]) => ({ id, nome: l.nome, regiao: l.regiao }));
}
