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
  nome?: string; // nome verdadeiro (jogadores reais pesquisados)
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
  hist?: { d: number; t: string }[]; // carreira: transferências, títulos, marcos
  titulos?: number; titulosOrg?: number; mvpAno?: number; pico?: number; orgAnos?: number; desde?: number;
  premios?: { ano: number; t: string }[];
  evo?: number[]; // nota no fim de cada mês (gráfico de evolução)
  venda?: boolean; // colocado à venda
  prometido?: number; // dia até quando o CEO prometeu chances
}

export type Cargo = 'tecnico' | 'auxiliar' | 'analista' | 'psicologo' | 'nutricionista' | 'chef' | 'preparador' | 'social' | 'olheiro';
export interface Staff {
  id: string;
  nome: string;
  nat: string;
  cargo: Cargo;
  nota: number; // 50..95
  sal: number; // semanal
  estilo: string;
  game?: GameId; // técnico, auxiliar e analista são de um jogo
  contrato: number; // ano
  tarefa?: { pid: string; fim: number }; // olheiro observando alguém
  real?: boolean; // técnico real pesquisado (buscar_tecnicos.py)
  foto?: string; // foto do técnico real
  fem?: boolean; // para escolher o rosto gerado
}

export interface Neg {
  id: string;
  pid: string;
  game: GameId;
  etapa: 'clube' | 'jogador' | 'fechada' | 'cancelada';
  fee: number; // proposta ao clube
  sal: number; // salário semanal oferecido
  anos: number;
  papel: 'titular' | 'reserva';
  resp: number; // dia da resposta
  pedido?: number; // contraproposta do clube (taxa) ou do jogador (salário)
  rival?: string; // time rival na disputa
  rosto?: boolean;
  msg?: string;
}

export type ComodoId = 'treino' | 'quartos' | 'academia' | 'cozinha' | 'consultorio' | 'analise' | 'estudio' | 'lazer';
export interface Sede {
  nivel: number; // 0 casa mediana, 1 casa grande, 2 mansão, 3 prédio
  posse: 'aluguel' | 'compra';
  comodos: Partial<Record<ComodoId, { nivel: number; obraAte?: number }>>;
  mudancaAte?: number;
}
export interface Kit { nivel: number; desgaste: number; patro?: string }
export interface Post { dia: number; autor: string; txt: string; tom: 'bom' | 'ruim' | 'neutro'; likes: number }

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
  acad?: boolean; // Academy da org (joga a Challengers, não sobe)
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

export interface Match {
  id: string;
  game: GameId;
  tor: string; // torneio
  st: number; // índice da fase dentro do torneio
  k: string; // chave do confronto (rr, u1, gf, A:u1, sw...)
  rodada: number;
  label: string; // "Rodada 3", "Final da chave inferior"...
  dia: number;
  a: string;
  b: string;
  bo: number;
  sa?: number;
  sb?: number;
  mvp?: string;
  det?: MapDet[];
}

export type SpecId = 'de6' | 'de8' | 'de4' | 'se4' | 'ko8' | 'gsl4' | 'bo';
export interface Stage {
  tipo: 'rr' | 'br' | 'swiss' | 'gsl';
  nome: string;
  spec?: SpecId;
  seeds: string[];
  dias: number[];
  ri: number;
  bo: number;
  boF: number;
  rounds?: [string, string][][];
  rec?: Record<string, { w: number; l: number; opp: string[] }>;
  grupos?: { n: string; ids: string[] }[];
  res: Record<string, string>; // chave -> id da partida
  fim?: boolean;
  out?: string[];
}
export type TorKind = 'split' | 'd2' | 'acesso' | 'fs' | 'msi' | 'ewc' | 'worlds' | 'intlA' | 'intlB';
export interface Torneio {
  id: string;
  game: GameId;
  ano: number;
  kind: TorKind;
  nome: string;
  league?: string;
  split?: number;
  teams: string[];
  stages: Stage[];
  si: number;
  direct?: string[]; // classificados direto para a fase seguinte (MSI/Mundial)
  campeao?: string;
  vice?: string;
  elim: Record<string, string>;
  rank?: string[];
  fim?: boolean;
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
  v: 3;
  seed: number;
  nextId: number;
  dia: number;
  fase: 'peneira' | 'jogo';
  org: Org;
  jogos: GameId[];
  orgTeams: Partial<Record<GameId, string>>;
  academias?: Partial<Record<GameId, string>>;
  marca?: Marca;
  premiosAno?: PremioAno[];
  hall?: HallEntry[];
  temporadas?: TemporadaOrg[];
  players: Record<string, Player>;
  teams: Record<string, Team>;
  leagues: Record<string, League>;
  matches: Record<string, Match>;
  torneios: Record<string, Torneio>;
  ranks: Record<string, string[]>;
  inbox: Msg[];
  patro: Patro[];
  emprestimos?: { id: string; banco: string; parcela: number; ate: number }[];
  fin: { sem: number; rec: number; desp: number; caixa: number }[];
  finSemana: { rec: Record<string, number>; desp: Record<string, number> };
  hist: { ano: number; game: GameId; tor: string; nome: string; kind: TorKind; campeao: string; vice: string; org?: boolean }[];
  diretoria: { meta: string; metaId: 'subir' | 'playoffs' | 'titulo'; confianca: number };
  peneira: Partial<Record<GameId, { candidatos: Candidato[]; escolhidos: string[]; verba: number }>>;
  staff: Record<string, Staff>;
  staffPool: Staff[];
  conhecido: Record<string, { n: 1 | 2; a: number; b: number; int?: number }>;
  alvos: string[];
  negs: Neg[];
  sede: Sede;
  kits: Partial<Record<GameId, Kit>>;
  rosto: Partial<Record<GameId, string>>;
  redes: Post[];
  diaJogo?: { dia: number; ids: string[] } | null;
  noticiasDia?: string[];
}

export type FaixaPreco = 'pop' | 'padrao' | 'premium';
export interface ProdutoEstado { lancado: number; estoque: number; chegando?: { qtd: number; dia: number }; preco: FaixaPreco; vendidos: number; receita: number; semana?: number }
export interface EventoFa { id: string; mid: string; local: string; preco: number; dia: number; res?: { publico: number; receita: number; cap: number } }
export interface Marca {
  hype: number; // 0..100
  produtos: Record<string, ProdutoEstado>;
  socio?: { preco: number; membros: number; desde: number };
  eventos: EventoFa[];
  hist: { sem: number; loja: number; socio: number }[];
}

export interface Premiado { pid: string; nick: string; nat: string; role: number; time: string; sigla: string; nota: number; org?: boolean; motivo?: string }
export interface PremioAno { ano: number; game: GameId; liga?: string; mundial?: Premiado | null; mvp: Premiado | null; revelacao: Premiado | null; selecao: Premiado[]; timeDoAno: string | null; tecnico?: { nome: string; time: string } }
export interface HallEntry { pid: string; nick: string; nat: string; game: GameId; role: number; ano: number; inicio: number; idade: number; titulos: number; mvps: number; jogos: number; pico: number; premios: string[]; ultimoTime: string; pontos: number; hof: boolean; lendaOrg: boolean; orgAnos: number; titulosOrg: number; camisa?: boolean }
export interface TemporadaOrg { ano: number; caixa: number; rep: number; fas: number; jogos: Partial<Record<GameId, { liga: string; v: number; d: number; titulos: string[] }>> }
