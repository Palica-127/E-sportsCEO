import type { GameId } from './games';

export type Traco = 'lider' | 'profissional' | 'ambicioso' | 'esquentado' | 'tranquilo' | 'irregular' | 'talentoso';
export const TRACOS: Record<Traco, { nome: string; desc: string }> = {
  lider: { nome: 'Líder', desc: 'Segura o vestiário em fase ruim.' },
  profissional: { nome: 'Profissional', desc: 'Treina sério, evolui com constância.' },
  ambicioso: { nome: 'Ambicioso', desc: 'Quer títulos e salário. Cobra o projeto.' },
  esquentado: { nome: 'Esquentado', desc: 'Joga com o coração. Pode brigar.' },
  tranquilo: { nome: 'Tranquilo', desc: 'Não se abala com pressão.' },
  irregular: { nome: 'Irregular', desc: 'Oscila muito de partida para partida.' },
  talentoso: { nome: 'Talentoso', desc: 'Muito potencial, mas precisa de lapidação.' },
};

export interface Player {
  id: string;
  nick: string;
  game: GameId;
  role: number;
  ovr: number;
  pot: number;
  idade: number;
  nat: string | null; // iso2 minúsculo (bandeira)
  teamId: string | null;
  sal: number; // salário semanal (R$)
  contrato: number; // ano em que termina
  forma: number; // -3..+3
  moral: number; // 0..100
  traco: Traco;
  real: boolean;
  jogos: number;
  mvps: number;
}

export interface Team {
  id: string;
  nome: string;
  sigla: string;
  game: GameId;
  region: string;
  tier: 1 | 2;
  cor: string;
  slug: string;
  /** índices: [0..nRoles-1] titulares por função, resto reservas */
  elenco: string[];
  org?: boolean;
  manual?: boolean; // CEO interveio na escalação
  ult: ('V' | 'D')[];
}

export interface League {
  id: string;
  game: GameId;
  region: string;
  tier: 1 | 2;
  nome: string;
  teams: string[];
}

export interface PlayerLine { pid: string; nick: string; k: number; d: number; a: number; extra?: string; nota: number }
export interface MapEvent { t: number; txt: string; lado: 'a' | 'b' | null; sa: number; sb: number; tipo?: string }
export interface MapDet {
  venc: 'a' | 'b';
  mapa?: string;
  sa: number;
  sb: number;
  dur: number; // minutos
  ev: MapEvent[];
  ouro?: number[]; // diferença de ouro (a - b) ao longo do jogo, em mil
  la: PlayerLine[];
  lb: PlayerLine[];
  mvp: string;
}

export type Fase = 'reg' | 'qf' | 'sf' | 'f';
export interface Match {
  id: string;
  game: GameId;
  league: string;
  split: number;
  dia: number;
  a: string;
  b: string;
  bo: number;
  fase: Fase;
  rodada: number;
  slot?: number; // posição na chave
  sa?: number;
  sb?: number;
  mvp?: string;
  det?: MapDet[];
}

export type Cenario = 'nova' | 'crise' | 'investidor';

export interface Org {
  nome: string;
  sigla: string;
  cor: string;
  logo?: string;
  cenario: Cenario;
  caixa: number;
  rep: number; // 0..100
  fas: number; // seguidores
}

export interface Acao { id: string; txt: string; tipo?: 'bom' | 'ruim' }
export interface Msg {
  id: string;
  dia: number;
  de: string;
  cargo: string;
  titulo: string;
  corpo: string;
  cat: 'diretoria' | 'tecnico' | 'financas' | 'patrocinio' | 'jogo' | 'noticia' | 'peneira';
  lida: boolean;
  acoes?: Acao[];
  resolvida?: string;
  dados?: any;
  game?: GameId;
}

export interface Patro { id: string; marca: string; semanal: number; ate: number; game?: GameId }

export interface Candidato {
  pid: string;
  luvas: number; // custo de assinatura
  multa: number; // pago ao time atual (0 se agente livre)
  faixa: [number, number];
  motivo?: string;
}

export interface Tecnico { nome: string; nat: string; estilo: string }

export interface State {
  v: 2;
  seed: number;
  nextId: number;
  dia: number;
  fase: 'peneira' | 'jogo';
  org: Org;
  jogos: GameId[];
  orgTeams: Partial<Record<GameId, string>>;
  tecnicos: Partial<Record<GameId, Tecnico>>;
  players: Record<string, Player>;
  teams: Record<string, Team>;
  leagues: Record<string, League>;
  matches: Record<string, Match>;
  inbox: Msg[];
  patro: Patro[];
  fin: { sem: number; rec: number; desp: number; caixa: number }[];
  finSemana: { rec: Record<string, number>; desp: Record<string, number> };
  hist: { ano: number; split: number; game: GameId; league: string; campeao: string; vice: string; org?: boolean }[];
  diretoria: { meta: string; metaId: 'subir' | 'playoffs' | 'titulo'; confianca: number };
  peneira: Partial<Record<GameId, { candidatos: Candidato[]; escolhidos: string[]; verba: number }>>;
  diaJogo?: { dia: number; ids: string[] } | null;
  noticiasDia?: string[];
}
