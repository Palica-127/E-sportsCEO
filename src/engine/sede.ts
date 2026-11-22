// Sede da org: casa mediana → casa grande → mansão → prédio. Cômodos com nível e obra, e kits de periféricos.
import { GAMES, GameId } from './games';
import { clamp } from './rng';
import type { ComodoId, State } from './types';
import { NOME_COMODO, QUARTOS } from './staff';

export const SEDES = [
  { nome: 'Casa mediana', vagas: 3, aluguel: 4000, compra: 900_000, desc: 'Sobrado num bairro tranquilo. Apertado, mas é o começo.' },
  { nome: 'Casa grande', vagas: 5, aluguel: 9000, compra: 2_200_000, desc: 'Casa com quintal e espaço para dois elencos.' },
  { nome: 'Mansão', vagas: 7, aluguel: 18000, compra: 5_000_000, desc: 'Mansão com piscina. Vira atração nas redes.' },
  { nome: 'Prédio (CT)', vagas: 8, aluguel: 35000, compra: 12_000_000, desc: 'Centro de treinamento com um andar por jogo.' },
];
export { QUARTOS };

export const COMODOS: Record<Exclude<ComodoId, 'quartos'>, { ico: string; custo: number; desc: string; cor: string }> = {
  treino: { ico: '🖥', custo: 60000, desc: 'PCs e mesas de treino. Cada nível: força do time em partida.', cor: '#3d8bff' },
  academia: { ico: '🏋', custo: 50000, desc: 'Libera o preparador físico. Evolução e forma.', cor: '#35c47c' },
  cozinha: { ico: '🍳', custo: 45000, desc: 'Libera nutricionista e chef. Forma e moral.', cor: '#f0b13a' },
  consultorio: { ico: '🧠', custo: 40000, desc: 'Libera o psicólogo. Moral sob pressão.', cor: '#a855f7' },
  analise: { ico: '📊', custo: 55000, desc: 'Libera o máximo do analista. Força em partida.', cor: '#14b8c4' },
  estudio: { ico: '🎥', custo: 50000, desc: 'Libera o social media. Streams, seguidores e renda.', cor: '#ec4899' },
  lazer: { ico: '🎮', custo: 35000, desc: 'Sinuca, videogame e descanso. Moral do elenco.', cor: '#e8524f' },
};
export const ORDEM_COMODOS = Object.keys(COMODOS) as Exclude<ComodoId, 'quartos'>[];
export { NOME_COMODO };

export const custoComodo = (id: Exclude<ComodoId, 'quartos'>, nivel: number) => COMODOS[id].custo * nivel * nivel;
export const diasObra = (nivel: number) => [0, 7, 14, 21][nivel];
export const usados = (s: State) => Object.keys(s.sede.comodos).length;

export function sedeInicial(s: State) {
  const c = s.org.cenario;
  if (c === 'investidor') s.sede = { nivel: 2, posse: 'compra', comodos: { treino: { nivel: 2 }, academia: { nivel: 1 }, cozinha: { nivel: 1 }, analise: { nivel: 1 }, consultorio: { nivel: 1 } } };
  else if (c === 'crise') s.sede = { nivel: 1, posse: 'aluguel', comodos: { treino: { nivel: 1 }, academia: { nivel: 1 } } };
  else s.sede = { nivel: 0, posse: 'aluguel', comodos: { treino: { nivel: 1 } } };
  for (const g of s.jogos) s.kits[g] = { nivel: c === 'investidor' ? 2 : c === 'crise' ? 1 : 0, desgaste: 10 };
}

export function construir(s: State, id: Exclude<ComodoId, 'quartos'>): string | null {
  const atual = s.sede.comodos[id];
  if (atual?.obraAte && atual.obraAte > s.dia) return 'Já está em obra.';
  const nivel = (atual?.nivel ?? 0) + 1;
  if (nivel > 3) return 'Nível máximo.';
  if (!atual && usados(s) >= SEDES[s.sede.nivel].vagas) return 'Sem espaço na sede. Mude para uma maior.';
  const custo = custoComodo(id, nivel);
  if (s.org.caixa < custo) return 'Caixa insuficiente.';
  s.org.caixa -= custo;
  s.sede.comodos[id] = { nivel: atual?.nivel ?? 0, obraAte: s.dia + diasObra(nivel) };
  return null;
}

/** custo de mudança: aluguel adiantado (4 semanas) ou compra; a mudança atrapalha o treino por 7 dias */
export function mudarSede(s: State, nivel: number, posse: 'aluguel' | 'compra'): string | null {
  if (nivel === s.sede.nivel && posse === s.sede.posse) return 'Você já está nessa sede.';
  const T = SEDES[nivel];
  const custo = posse === 'compra' ? T.compra : T.aluguel * 4;
  const venda = s.sede.posse === 'compra' ? Math.round(SEDES[s.sede.nivel].compra * 0.8) : 0;
  if (s.org.caixa + venda < custo) return 'Caixa insuficiente.';
  if (usados(s) > T.vagas) return `Essa sede tem só ${T.vagas} vagas de cômodo e você usa ${usados(s)}.`;
  s.org.caixa += venda - custo;
  s.sede.nivel = nivel; s.sede.posse = posse; s.sede.mudancaAte = s.dia + 7;
  return null;
}

/** custo semanal da sede: aluguel + manutenção dos cômodos */
export function custoSede(s: State): number {
  const alug = s.sede.posse === 'aluguel' ? SEDES[s.sede.nivel].aluguel : Math.round(SEDES[s.sede.nivel].aluguel * 0.2);
  const manut = Object.values(s.sede.comodos).reduce((a, c) => a + (c?.nivel ?? 0) * 500, 0);
  return alug + manut;
}

// ---------- periféricos ----------
export const KITS = [
  { nome: 'Básico', custo: 0, desc: 'Equipamento de loja. Funciona.' },
  { nome: 'Gamer', custo: 25000, desc: 'Mouses e teclados bons, monitores 144 Hz.' },
  { nome: 'Pro', custo: 70000, desc: 'Monitores 240 Hz, cadeiras ergonômicas.' },
  { nome: 'Elite', custo: 160000, desc: 'O que os melhores times do mundo usam.' },
];
export function trocarKit(s: State, g: GameId): string | null {
  const k = s.kits[g] ?? { nivel: 0, desgaste: 0 };
  const nivel = Math.min(3, k.nivel + (k.desgaste >= 60 ? 0 : 1));
  const custo = k.patro ? Math.round(KITS[nivel].custo * 0.3) : KITS[nivel].custo;
  if (k.nivel === 3 && k.desgaste < 60) return 'O kit já é Elite e está novo.';
  if (s.org.caixa < custo) return 'Caixa insuficiente.';
  s.org.caixa -= custo;
  s.kits[g] = { ...k, nivel, desgaste: 0 };
  return null;
}

/** semanal: desgaste dos kits e fim das obras */
export function tickSede(s: State) {
  for (const g of s.jogos) {
    const k = s.kits[g];
    if (!k) continue;
    k.desgaste = clamp(k.desgaste + (k.nivel >= 2 ? 1.6 : 1.1), 0, 100);
    if (k.desgaste >= 100 && k.nivel > 0) { k.nivel--; k.desgaste = 40; }
  }
}
export function obrasProntas(s: State): string[] {
  const prontas: string[] = [];
  for (const [id, c] of Object.entries(s.sede.comodos)) {
    if (c?.obraAte && c.obraAte <= s.dia) { c.nivel++; delete c.obraAte; prontas.push(`${NOME_COMODO[id as ComodoId]} nível ${c.nivel}`); }
  }
  return prontas;
}
export const nomeKit = (g: GameId, s: State) => `${KITS[s.kits[g]?.nivel ?? 0].nome} · ${GAMES[g].curto}`;
