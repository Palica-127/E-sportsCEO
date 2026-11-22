import { GAMES, GAME_IDS, GameId } from './games';
import { clamp, ri } from './rng';
import type { State, Team } from './types';
import { criaJogo, escalarAuto, forca, valorMercado } from './world';
import { lanca, moeda, montaPeneira, msg, noticia2 } from './org';
import { anoDe, diaDoAno, inicioAnoDia } from './sim';
import { calendario } from './comp';
import { geraStaff } from './staff';
import { camas, moradores } from './academy';

export type ModoEntrada = 'zero' | 'compra' | 'investidor';
export const MAX_JOGOS = 8;
export const MODOS: Record<ModoEntrada, { nome: string; desc: string }> = {
  zero: { nome: 'Do zero', desc: 'Compra a vaga do time mais fraco da Challengers e monta o elenco numa peneira. Barato, mas começa por baixo.' },
  compra: { nome: 'Comprar uma org', desc: 'Compra vaga e elenco de um time (elite ou Challengers) e faz o rebrand. Elenco pronto.' },
  investidor: { nome: 'Investidor master', desc: 'Entra pesado num dos grandes da elite, com rebrand. Caro, traz fãs e reputação, e a diretoria cobra título.' },
};

/** reputação mínima para abrir o n-ésimo jogo (o 3º pede 25, o 8º pede 75) */
export const repMinima = (s: State) => (s.jogos.length < 2 ? 0 : 15 + 10 * (s.jogos.length - 1));

/** cria o mundo do jogo (ligas, times, jogadores) se ainda não existe; não entra no calendário até virar jogo da org */
export function prepararJogo(s: State, g: GameId) {
  if (Object.values(s.leagues).some(l => l.game === g)) return;
  criaJogo(s, g);
  for (const t of Object.values(s.teams)) if (t.game === g) escalarAuto(s, t);
}

export const jogosDisponiveis = (s: State) => GAME_IDS.filter(g => !s.jogos.includes(g));

export function opcoesCompra(s: State, g: GameId, region: string, modo: ModoEntrada): Team[] {
  const T1 = s.leagues[`${g}-${region}-1`], T2 = s.leagues[`${g}-${region}-2`];
  const ord = (ids: string[]) => ids.map(id => s.teams[id]).filter(t => !t.org).sort((a, b) => forca(s, b) - forca(s, a));
  if (modo === 'investidor') { const t1 = ord(T1.teams); return t1.slice(0, Math.ceil(t1.length / 2)); }
  if (modo === 'compra') return [...ord(T1.teams).slice(Math.floor(T1.teams.length / 2) - 1), ...ord(T2.teams).slice(0, 5)];
  return [];
}

const valorElenco = (s: State, t: Team) => t.elenco.reduce((a, id) => a + valorMercado(s.players[id]), 0);
export function preco(s: State, g: GameId, region: string, modo: ModoEntrada, teamId?: string): number {
  if (modo === 'zero') return 150_000;
  const t = teamId ? s.teams[teamId] : null;
  if (!t) return 0;
  const vaga = t.tier === 1 ? 1_200_000 : 150_000;
  const k = modo === 'investidor' ? 0.8 : 0.5;
  return Math.round((vaga + valorElenco(s, t) * k + (modo === 'investidor' ? 1_500_000 : 0)) / 50_000) * 50_000;
}

export function pendencias(s: State, g: GameId, region: string, modo: ModoEntrada, teamId?: string): string[] {
  const out: string[] = [];
  if (s.jogos.includes(g)) out.push('A org já está nesse jogo.');
  if (s.jogos.length >= MAX_JOGOS) out.push('Limite de 8 jogos.');
  if (s.org.rep < repMinima(s)) out.push(`Reputação ${repMinima(s)} (hoje ${s.org.rep}).`);
  const p = preco(s, g, region, modo, teamId);
  if (modo !== 'zero' && !teamId) out.push('Escolha o time.');
  if (s.org.caixa < p + 100_000) out.push(`Caixa de ${moeda(p + 100_000)} (preço + reserva de R$ 100 mil). Hoje: ${moeda(s.org.caixa)}.`);
  const novos = modo === 'zero' ? GAMES[g].roles.length + 1 : teamId ? s.teams[teamId].elenco.length : GAMES[g].roles.length;
  if (moradores(s) + novos > camas(s)) out.push(`Camas na sede: ${moradores(s) + novos} jogadores para ${camas(s)} camas.`);
  return out;
}

/** dia do próximo início de split desse jogo (quando o time estreia) */
export function estreia(s: State, g: GameId): number {
  const dy = diaDoAno(s.dia), y0 = inicioAnoDia(s.dia);
  const prox = calendario(g).filter(e => e.kind === 'split' && e.d > dy).sort((a, b) => a.d - b.d)[0];
  if (prox) return y0 + prox.d;
  const prim = calendario(g).filter(e => e.kind === 'split').sort((a, b) => a.d - b.d)[0];
  return y0 + 364 + prim.d;
}

export function entrarNoJogo(s: State, g: GameId, region: string, modo: ModoEntrada, teamId?: string): string | null {
  prepararJogo(s, g);
  const pend = pendencias(s, g, region, modo, teamId);
  if (pend.length) return pend[0];
  const custo = preco(s, g, region, modo, teamId);
  let t: Team;
  let antigo: string;
  if (modo === 'zero') {
    const L = s.leagues[`${g}-${region}-2`];
    t = L.teams.map(id => s.teams[id]).filter(x => !x.org).sort((a, b) => forca(s, a) - forca(s, b))[0];
    for (const pid of t.elenco) s.players[pid].teamId = null;
    t.elenco = [];
    antigo = t.nome;
  } else {
    t = s.teams[teamId!];
    antigo = t.nome;
    for (const pid of t.elenco) s.players[pid].contrato = Math.max(s.players[pid].contrato, anoDe(s.dia) + 1);
  }
  t.nome = s.org.nome; t.sigla = s.org.sigla; t.cor = s.org.cor; t.slug = '__org'; t.org = true; t.manual = false;
  s.jogos.push(g);
  s.orgTeams[g] = t.id;
  s.org.caixa -= custo; lanca(s, 'desp', 'Expansão', custo);
  const faixa = modo === 'investidor' ? [74, 82] : modo === 'compra' ? [66, 74] : [60, 68];
  const tec = geraStaff(s, 'tecnico', ri(s, faixa[0], faixa[1]), g); tec.contrato = anoDe(s.dia) + 2; s.staff[tec.id] = tec;
  s.kits[g] = { nivel: modo === 'investidor' ? 2 : 0, desgaste: 10 };
  if (modo === 'investidor') {
    s.org.rep = clamp(s.org.rep + 5, 0, 100); s.org.fas += 150_000;
    s.diretoria.confianca = clamp(s.diretoria.confianca - 5, 0, 100);
  } else if (modo === 'compra') s.org.fas += t.tier === 1 ? 40_000 : 8_000;
  const dEst = estreia(s, g);
  noticia2(s, g, modo === 'zero' ? `${s.org.nome} compra a vaga da ${antigo} e entra no ${GAMES[g].nome}` : `${s.org.nome} compra a ${antigo} e anuncia rebrand`);
  msg(s, { de: tec.nome, cargo: `Técnico · ${GAMES[g].curto}`, cat: 'tecnico', game: g, titulo: `Novo jogo: ${GAMES[g].nome}`,
    corpo: `Prazer, CEO. Sou o técnico do novo time de ${GAMES[g].nome} (nota ${tec.nota}). ${modo === 'zero' ? 'Vamos montar o elenco na peneira.' : `Assumimos o elenco da antiga ${antigo}. Força atual: ${forca(s, t).toFixed(1)}.`}\n\nA estreia é no próximo split, dia ${dEst - inicioAnoDia(s.dia) >= 364 ? 'no começo da próxima temporada' : `${dEst - s.dia} dias a partir de hoje`}. Até lá é pré-temporada.${modo === 'investidor' ? '\n\nA diretoria espera título nesse jogo já no primeiro ano.' : ''}` });
  if (modo === 'zero') {
    s.peneira = { [g]: montaPeneira(s, g, region, t.id) };
    s.fase = 'peneira';
  } else escalarAuto(s, t);
  return null;
}
