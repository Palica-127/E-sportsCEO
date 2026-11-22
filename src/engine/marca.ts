import { GAMES } from './games';
import { clamp, rnd } from './rng';
import type { FaixaPreco, Marca, Match, State } from './types';
import { lanca, moeda, msg } from './org';
import { anoDe, isOrg } from './sim';
import { post } from './mercado';

// ---------- loja da marca, sócio-torcedor e eventos com ingresso ----------

export interface ProdutoDef { nome: string; desc: string; ico: string; custo: number; preco: number; design: number; peso: number; lote?: number; req?: (s: State) => string | null }
const temTituloRecente = (s: State) => s.hist.some(h => h.org && h.campeao === s.org.nome && h.ano === anoDe(s.dia));

export const PRODUTOS: Record<string, ProdutoDef> = {
  camisa: { nome: 'Camisa oficial', desc: 'O uniforme da temporada. O produto que mais vende.', ico: '👕', custo: 45, preco: 189, design: 15_000, peso: 1 },
  moletom: { nome: 'Moletom', desc: 'Vende bem no inverno e para quem já tem a camisa.', ico: '🧥', custo: 85, preco: 299, design: 10_000, peso: 0.35 },
  bone: { nome: 'Boné', desc: 'Barato, margem boa, vende o ano todo.', ico: '🧢', custo: 18, preco: 89, design: 5_000, peso: 0.5 },
  mousepad: { nome: 'Mousepad gamer', desc: 'Para o fã que joga. Vende mais com kit de patrocinador de periféricos.', ico: '🖱', custo: 28, preco: 129, design: 8_000, peso: 0.4 },
  assinada: { nome: 'Camisa assinada pelo Rosto', desc: 'Edição limitada autografada pela estrela da org.', ico: '✍', custo: 60, preco: 499, design: 5_000, peso: 0.6, lote: 1000,
    req: s => (Object.keys(s.rosto ?? {}).length ? null : 'Precisa de um Rosto da Org.') },
  campeoes: { nome: 'Coleção "Campeões"', desc: 'Camisa comemorativa de título. Esgota rápido enquanto a festa dura.', ico: '🏆', custo: 50, preco: 229, design: 10_000, peso: 1.6,
    req: s => (temTituloRecente(s) ? null : 'Só depois de um título nesta temporada.') },
  colab: { nome: 'Collab streetwear', desc: 'Coleção com uma marca de rua. Cara de fazer, vira assunto nas redes.', ico: '🔥', custo: 95, preco: 399, design: 60_000, peso: 0.8,
    req: s => (s.org.rep >= 50 ? null : 'Reputação 50.') },
};
export const FAIXAS: Record<FaixaPreco, { nome: string; mp: number; md: number }> = {
  pop: { nome: 'Popular', mp: 0.8, md: 1.45 },
  padrao: { nome: 'Padrão', mp: 1, md: 1 },
  premium: { nome: 'Premium', mp: 1.3, md: 0.62 },
};
export const LOTES = [200, 500, 1000, 3000, 10000];
export const DIAS_PRODUCAO = 14;

export const LOCAIS: Record<string, { nome: string; cap: number; custo: number; preco: number; rep: number; desc: string }> = {
  bar: { nome: 'Bar parceiro', cap: 250, custo: 8_000, preco: 40, rep: 0, desc: 'Watch party num bar. Pequeno e barato.' },
  teatro: { nome: 'Teatro', cap: 1_500, custo: 60_000, preco: 80, rep: 25, desc: 'Fan fest com telão, convidados e loja.' },
  ginasio: { nome: 'Ginásio', cap: 6_000, custo: 250_000, preco: 120, rep: 40, desc: 'Evento grande, com ativações de patrocinador.' },
  arena: { nome: 'Arena', cap: 15_000, custo: 700_000, preco: 160, rep: 60, desc: 'Coisa de time gigante. Lotar é história; vazio é vexame.' },
};
export const PRECOS_SOCIO = [14.9, 29.9, 49.9];

export function marca(s: State): Marca {
  return (s.marca ??= { hype: 30, produtos: {}, eventos: [], hist: [] });
}
const multHype = (h: number) => 0.5 + h / 50; // 0,5x .. 2,5x

export function mudaHype(s: State, d: number) { const m = marca(s); m.hype = clamp(m.hype + d, 0, 100); }

/** vendas previstas por semana (unidades) de um produto */
export function demanda(s: State, id: string, faixa: FaixaPreco): number {
  const P = PRODUTOS[id], st = marca(s).produtos[id];
  const semanas = st ? Math.max(0, (s.dia - st.lancado) / 7) : 0;
  const novidade = id === 'campeoes' ? Math.max(0.15, 1 - semanas * 0.08) : Math.max(0.35, 1 - semanas * 0.025);
  const fas = s.org.fas / 1000 * 0.15;
  const kit = id === 'mousepad' && Object.values(s.kits).some(k => k?.patro) ? 1.3 : 1;
  return Math.max(0, fas * P.peso * multHype(marca(s).hype) * FAIXAS[faixa].md * novidade * kit);
}
export const precoVenda = (id: string, f: FaixaPreco) => Math.round(PRODUTOS[id].preco * FAIXAS[f].mp);

export function lancar(s: State, id: string, lote: number, faixa: FaixaPreco): string | null {
  const P = PRODUTOS[id]; const e = P.req?.(s); if (e) return e;
  const m = marca(s); const st = m.produtos[id];
  if (st?.chegando) return 'Já tem um lote em produção.';
  const qtd = Math.min(lote, P.lote ?? lote);
  const novo = !st || s.dia - st.lancado > 364 / 2;
  const custo = qtd * P.custo + (novo ? P.design : 0);
  if (s.org.caixa < custo) return `Precisa de ${moeda(custo)}.`;
  s.org.caixa -= custo; lanca(s, 'desp', 'Produção da loja', custo);
  m.produtos[id] = { lancado: novo ? s.dia + DIAS_PRODUCAO : st!.lancado, estoque: st?.estoque ?? 0, chegando: { qtd, dia: s.dia + DIAS_PRODUCAO }, preco: faixa, vendidos: st?.vendidos ?? 0, receita: st?.receita ?? 0 };
  return null;
}
export const custoLote = (s: State, id: string, lote: number) => {
  const P = PRODUTOS[id], st = marca(s).produtos[id];
  const novo = !st || s.dia - st.lancado > 364 / 2;
  return Math.min(lote, P.lote ?? lote) * P.custo + (novo ? P.design : 0);
};
export function mudarFaixa(s: State, id: string, f: FaixaPreco) { const st = marca(s).produtos[id]; if (st) st.preco = f; }
/** queima de estoque: vende metade do que sobrou a 45% do preço */
export function liquidar(s: State, id: string): string | null {
  const st = marca(s).produtos[id]; if (!st || st.estoque <= 0) return 'Sem estoque.';
  const q = Math.ceil(st.estoque / 2), v = Math.round(q * precoVenda(id, st.preco) * 0.45);
  st.estoque -= q; st.vendidos += q; st.receita += v;
  lanca(s, 'rec', 'Loja da marca', v);
  mudaHype(s, -2);
  return `${q} unidades vendidas na liquidação por ${moeda(v)}.`;
}

export function ativarSocio(s: State, preco: number): string | null {
  const m = marca(s);
  if (!m.socio && s.org.caixa < 20_000) return 'Precisa de R$ 20 mil para montar o programa.';
  if (!m.socio) { s.org.caixa -= 20_000; lanca(s, 'desp', 'Produção da loja', 20_000); m.socio = { preco, membros: 0, desde: s.dia }; }
  else m.socio.preco = preco;
  return null;
}
export function alvoSocios(s: State, preco: number): number {
  const mp = preco <= 15 ? 1.5 : preco <= 30 ? 1 : 0.55;
  const est = s.sede.comodos.estudio?.nivel ? 1.25 : 1;
  return Math.round(s.org.fas * 0.0015 * (0.4 + s.org.rep / 60) * multHype(marca(s).hype) * mp * est);
}

export function agendarEvento(s: State, mid: string, local: string, preco: number): string | null {
  const L = LOCAIS[local], m = marca(s), j = s.matches[mid];
  if (!L || !j) return 'Escolha a partida e o local.';
  if (s.org.rep < L.rep) return `Esse local pede reputação ${L.rep}.`;
  if (m.eventos.some(e => e.mid === mid)) return 'Já tem evento nessa partida.';
  if (s.org.caixa < L.custo) return `Precisa de ${moeda(L.custo)}.`;
  s.org.caixa -= L.custo; lanca(s, 'desp', 'Eventos', L.custo);
  m.eventos.push({ id: `ev${s.nextId++}`, mid, local, preco, dia: j.dia });
  return null;
}
const importancia = (s: State, j: Match) => {
  const t = s.torneios[j.tor];
  if (!t) return 1;
  if (['msi', 'worlds', 'ewc', 'fs', 'intlA', 'intlB'].includes(t.kind)) return 2.4;
  if (j.k === 'gf' || j.k === 'f') return 2.2;
  return j.k === 'rr' ? 1 : 1.5;
};
/** público esperado (antes do jogo) */
export function publicoPrevisto(s: State, mid: string, local: string, preco: number): number {
  const j = s.matches[mid], L = LOCAIS[local]; if (!j || !L) return 0;
  const pm = Math.pow(L.preco / Math.max(10, preco), 1.1);
  return Math.min(L.cap, Math.round(s.org.fas * 0.01 * multHype(marca(s).hype) * importancia(s, j) * pm));
}

// ---------- rotinas ----------
export function tickMarcaSemana(s: State) {
  if (!s.marca) return;
  const m = s.marca;
  let loja = 0;
  for (const [id, st] of Object.entries(m.produtos)) {
    if (st.estoque <= 0) { st.semana = 0; continue; }
    const q = Math.min(st.estoque, Math.round(demanda(s, id, st.preco) * (0.8 + rnd(s) * 0.4)));
    const v = q * precoVenda(id, st.preco);
    st.estoque -= q; st.vendidos += q; st.receita += v; st.semana = q; loja += v;
    if (st.estoque === 0 && q > 0) msg(s, { de: 'Loja da marca', cargo: 'Loja', cat: 'financas', titulo: `${PRODUTOS[id].nome}: estoque esgotado!`, corpo: `Vendemos tudo. Se quiser continuar vendendo, encomende um novo lote (a produção leva ${DIAS_PRODUCAO} dias).` });
  }
  if (loja) lanca(s, 'rec', 'Loja da marca', loja);
  let soc = 0;
  if (m.socio) {
    const alvo = alvoSocios(s, m.socio.preco);
    m.socio.membros = Math.max(0, Math.round(m.socio.membros + (alvo - m.socio.membros) * 0.2));
    soc = Math.round((m.socio.membros * m.socio.preco * 0.75) / 4.3); // 25% vira benefícios
    if (soc) lanca(s, 'rec', 'Sócio-torcedor', soc);
  }
  m.hist = [...m.hist, { sem: Math.floor(s.dia / 7), loja, socio: soc }].slice(-52);
  m.hype = clamp(m.hype + (30 - m.hype) * 0.06, 0, 100); // a empolgação volta ao normal aos poucos
}

export function tickMarcaDia(s: State) {
  if (!s.marca) return;
  const m = s.marca;
  for (const [id, st] of Object.entries(m.produtos)) if (st.chegando && st.chegando.dia <= s.dia) {
    st.estoque += st.chegando.qtd; delete st.chegando;
    msg(s, { de: 'Loja da marca', cargo: 'Loja', cat: 'financas', titulo: `${PRODUTOS[id].nome} chegou à loja`, corpo: `${st.estoque} unidades disponíveis. As vendas entram toda semana.` });
    post(s, `${PRODUTOS[id].ico} saiu ${PRODUTOS[id].nome.toLowerCase()} nova da ${s.org.sigla}! já garanti a minha`, 'bom');
  }
  for (const e of m.eventos) {
    if (e.res) continue;
    const j = s.matches[e.mid];
    if (!j) { e.res = { publico: 0, receita: 0, cap: LOCAIS[e.local].cap }; continue; }
    if (j.sa == null) continue;
    const L = LOCAIS[e.local];
    const prev = publicoPrevisto(s, e.mid, e.local, e.preco);
    const publico = Math.min(L.cap, Math.round(prev * (0.85 + rnd(s) * 0.3)));
    const venceu = isOrg(s, j.a) === (j.sa > j.sb!);
    const consumo = Math.round(publico * (venceu ? 45 : 25)); // camisa, comida e bebida na hora
    const receita = publico * e.preco + consumo;
    s.org.caixa += receita; lanca(s, 'rec', 'Ingressos', receita);
    e.res = { publico, receita, cap: L.cap };
    const ocup = publico / L.cap;
    mudaHype(s, ocup >= 0.9 ? 8 : ocup >= 0.6 ? 3 : ocup < 0.35 ? -6 : 0);
    s.org.fas = Math.round(s.org.fas + publico * (venceu ? 3 : 1.5));
    const adv = s.teams[isOrg(s, j.a) ? j.b : j.a];
    msg(s, { de: 'Eventos', cargo: L.nome, cat: 'financas', titulo: `${L.nome}: ${publico.toLocaleString('pt-BR')} pessoas ${ocup >= 0.9 ? '(LOTADO!)' : ''}`,
      corpo: `O evento do jogo contra a ${adv.nome} recebeu ${publico.toLocaleString('pt-BR')} de ${L.cap.toLocaleString('pt-BR')} lugares (${Math.round(ocup * 100)}%).\n\nIngressos: ${moeda(publico * e.preco)} · consumo e loja no local: ${moeda(consumo)}.${venceu ? '\nCom a vitória, a festa foi até tarde.' : ''}${ocup < 0.35 ? '\n\nO local ficou vazio e virou piada nas redes.' : ''}` });
    post(s, ocup >= 0.9 ? `que energia no ${L.nome.toLowerCase()} da ${s.org.sigla}!!! ${venceu ? 'e ainda ganhamos 🔥' : ''}` : ocup < 0.35 ? `evento da ${s.org.sigla} mais vazio que servidor de madrugada kkk` : `fui no evento da ${s.org.sigla}, foi massa`, ocup < 0.35 ? 'ruim' : 'bom');
  }
  m.eventos = m.eventos.filter(e => !e.res || e.dia > s.dia - 180);
}

/** chamado após cada série do time principal */
export function hypePartida(s: State, j: Match) {
  const venceu = isOrg(s, j.a) === (j.sa! > j.sb!);
  const imp = importancia(s, j);
  mudaHype(s, (venceu ? 2 : -2) * imp);
}
export const nomeJogoPartida = (s: State, j: Match) => `${GAMES[j.game].curto} · ${s.torneios[j.tor]?.nome ?? ''}`;
