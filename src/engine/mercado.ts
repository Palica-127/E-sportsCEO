import { mudaHype } from './marca';
// Mercado: janelas, olheiros (notas escondidas), negociação em 2 etapas, rivais, propostas pelos seus
// jogadores, renovação, dispensa, transferências da IA e o Rosto da Org.
import { GAMES, GameId } from './games';
import { chance, clamp, pick, ri, rnd } from './rng';
import type { Neg, Player, State, Team } from './types';
import { escalarAuto, forca, novoId, salario, titulares, valorMercado } from './world';
import { doCargo, tecnicoDe } from './staff';

const anoAtual = (s: State) => 2027 + Math.floor(s.dia / 364);
const dy = (s: State) => s.dia % 364;
const fmt = (v: number) => (Math.abs(v) >= 1e6 ? `R$ ${(v / 1e6).toFixed(2).replace('.', ',')} mi` : `R$ ${Math.round(v / 1000)} mil`);

// ---------- janelas ----------
const JANELAS: [number, number][] = [[0, 11], [70, 93], [150, 202], [330, 363]];
export function janelaAberta(s: State): boolean { const d = dy(s); return JANELAS.some(([a, b]) => d >= a && d <= b); }
export function proximaJanela(s: State): number {
  const d = dy(s);
  for (const [a] of JANELAS) if (a > d) return s.dia - d + a;
  return s.dia - d + 364;
}
export const maxElenco = (g: GameId) => GAMES[g].roles.length + 3;

// ---------- conhecimento (olheiros) ----------
export function famoso(p: Player): boolean { return p.real && p.ovr >= 80; }
/** o que a org sabe da nota do jogador */
export function notaVista(s: State, p: Player): { a: number; b: number; exata: boolean; txt: string } {
  return { a: p.ovr, b: p.ovr, exata: true, txt: String(p.ovr) }; // todas as notas são visíveis (sem sistema de olheiro)
  const k = s.conhecido[p.id];
  if (k?.n === 2) return { a: k.a, b: k.b, exata: k.a === k.b, txt: k.a === k.b ? String(k.a) : `${k.a}-${k.b}` };
  if (k) return { a: k.a, b: k.b, exata: false, txt: `${k.a}-${k.b}` };
  if (famoso(p)) { const w = 3; const c = p.ovr + ((p.id.charCodeAt(1) % 3) - 1); return { a: c - w, b: c + w, exata: false, txt: `${c - w}-${c + w}` }; }
  return { a: 0, b: 0, exata: false, txt: '?' };
}
export function interesse(s: State, p: Player, g: GameId): number {
  const t = s.teams[s.orgTeams[g]!];
  const fama = (p.ovr - 60) * 2.6;
  let v = 52 + s.org.rep * 0.7 - fama * 0.7 + (t?.tier === 1 ? 12 : -6) + (s.rosto[g] ? 8 : 0);
  if (p.teamId && !s.teams[p.teamId].org && s.teams[p.teamId].elenco.indexOf(p.id) >= GAMES[g].roles.length) v += 12; // reserva quer jogar
  if (p.traco === 'ambicioso') v += t?.tier === 1 ? 0 : -12;
  if (!p.teamId) v += 10;
  return Math.round(clamp(v, 4, 96));
}

export function observar(s: State, pid: string): string | null {
  const livres = doCargo(s, 'olheiro').filter(o => !o.tarefa);
  if (!livres.length) return 'Todos os olheiros estão ocupados.';
  if (s.conhecido[pid]?.n === 2) return 'Já existe relatório desse jogador.';
  if (Object.values(s.staff).some(o => o.tarefa?.pid === pid)) return 'Já tem olheiro observando.';
  const o = livres.sort((a, b) => b.nota - a.nota)[0];
  o.tarefa = { pid, fim: s.dia + Math.max(3, Math.round(10 - (o.nota - 60) / 6)) };
  return null;
}

export type Msgr = (m: { de: string; cargo: string; titulo: string; corpo: string; cat: any; game?: GameId; acoes?: { id: string; txt: string; tipo?: 'bom' | 'ruim' }[]; dados?: any }) => void;

function relatorios(s: State, msg: Msgr) {
  for (const o of doCargo(s, 'olheiro')) {
    if (!o.tarefa || o.tarefa.fim > s.dia) continue;
    const p = s.players[o.tarefa.pid];
    o.tarefa = undefined;
    if (!p) continue;
    const err = o.nota >= 82 ? 0 : o.nota >= 70 ? 1 : 2;
    const c = p.ovr + (err ? ri(s, -1, 1) : 0);
    const g = p.game;
    const int = interesse(s, p, g);
    s.conhecido[p.id] = { n: 2, a: c - err, b: c + err, int };
    const potE = Math.max(1, Math.min(5, Math.round((p.pot - 60) / 7)));
    const time = p.teamId ? s.teams[p.teamId].nome : 'agente livre';
    msg({ de: o.nome, cargo: 'Olheiro', cat: 'peneira', game: g, titulo: `Relatório: ${p.nick}`,
      corpo: `${p.nick} (${GAMES[g].roleNomes[p.role]}, ${p.idade} anos, ${time}).\n\nNota: ${err ? `${c - err} a ${c + err}` : c}. Potencial: ${'★'.repeat(potE)}${'☆'.repeat(5 - potE)}.\nPerfil: ${p.traco}. Forma recente: ${p.forma >= 0.5 ? 'boa' : p.forma <= -0.5 ? 'ruim' : 'normal'}.\nInteresse em vir para a ${s.org.nome}: ${int >= 65 ? 'alto' : int >= 40 ? 'médio' : 'baixo'} (${int}%).\nValor estimado: ${fmt(valorMercado(p))}. Salário pedido: ~${fmt(salario(p.ovr) * 4)}/mês.`,
      dados: { pid: p.id } });
  }
}

// ---------- negociação ----------
export function abrirNeg(s: State, pid: string, o: { fee: number; sal: number; anos: number; papel: 'titular' | 'reserva'; rosto?: boolean }): string | null {
  const p = s.players[pid];
  if (!p) return 'Jogador não encontrado.';
  const g = p.game;
  if (!s.orgTeams[g]) return 'A org não joga esse jogo.';
  if (s.teams[p.teamId ?? '']?.org) return 'Ele já é seu.';
  if (p.teamId && !janelaAberta(s)) return 'Janela de transferências fechada. Agentes livres podem ser contratados a qualquer momento.';
  const t = s.teams[s.orgTeams[g]!];
  if (t.elenco.length >= maxElenco(g)) return `Elenco cheio (máximo ${maxElenco(g)}). Dispense ou venda alguém.`;
  if (s.negs.some(n => n.pid === pid && (n.etapa === 'clube' || n.etapa === 'jogador'))) return 'Já existe negociação aberta com ele.';
  if (s.org.caixa < o.fee) return 'Caixa insuficiente para essa proposta.';
  const n: Neg = { id: novoId(s, 'n'), pid, game: g, etapa: p.teamId ? 'clube' : 'jogador', fee: p.teamId ? o.fee : 0, sal: o.sal, anos: o.anos, papel: o.papel, resp: s.dia + ri(s, 1, 3), rosto: o.rosto };
  s.negs.push(n);
  if (!s.alvos.includes(pid)) s.alvos.push(pid);
  return null;
}
export const pedidoSalario = (s: State, p: Player) => Math.round((salario(p.ovr) * (1 + (p.traco === 'ambicioso' ? 0.25 : 0) + (s.org.rep < 30 ? 0.1 : 0))) / 100) * 100;
export function valorClube(s: State, p: Player): number {
  const t = p.teamId ? s.teams[p.teamId] : null;
  const titular = t ? t.elenco.indexOf(p.id) < GAMES[p.game].roles.length : false;
  const anosRest = Math.max(0, p.contrato - anoAtual(s));
  return Math.round(valorMercado(p) * (titular ? 1.25 : 0.85) * (anosRest >= 2 ? 1.15 : anosRest === 0 ? 0.6 : 1) * (p.venda ? 0.8 : 1) / 1000) * 1000;
}
function rivalDe(s: State, p: Player): Team | null {
  const cands = Object.values(s.teams).filter(t => !t.org && t.game === p.game && t.tier === 1 && t.id !== p.teamId && forca(s, t) > forca(s, s.teams[p.teamId ?? ''] ?? t) - 2);
  return cands.length ? pick(s, cands) : null;
}

function respondeNegs(s: State, msg: Msgr) {
  for (const n of s.negs) {
    if ((n.etapa !== 'clube' && n.etapa !== 'jogador') || n.resp > s.dia || n.pedido != null) continue;
    const p = s.players[n.pid];
    if (!p) { n.etapa = 'cancelada'; continue; }
    const time = p.teamId ? s.teams[p.teamId] : null;
    if (n.etapa === 'clube' && time) {
      let val = valorClube(s, p);
      if (!n.rival && p.ovr >= 72 && chance(s, 0.25)) { const r = rivalDe(s, p); if (r) { n.rival = r.nome; val = Math.round(Math.max(val, n.fee) * 1.15 / 1000) * 1000; } }
      if (n.fee >= val) { n.etapa = 'jogador'; n.resp = s.dia + ri(s, 1, 2); msg({ de: time.nome, cargo: 'Diretoria do clube', cat: 'jogo', game: n.game, titulo: `${time.nome} aceita a proposta por ${p.nick}`, corpo: `Aceitamos ${fmt(n.fee)} pelo ${p.nick}. Agora é com o jogador e o empresário dele.` }); }
      else if (n.fee >= val * 0.7) {
        n.pedido = val;
        msg({ de: time.nome, cargo: 'Diretoria do clube', cat: 'jogo', game: n.game, titulo: `Contraproposta por ${p.nick}`,
          corpo: `Recebemos sua oferta de ${fmt(n.fee)} pelo ${p.nick}, mas só liberamos por ${fmt(val)}.${n.rival ? `\n\nO ${n.rival} também está na disputa.` : ''}`,
          acoes: [{ id: 'aceitar', txt: `Pagar ${fmt(val)}`, tipo: 'bom' }, { id: 'desistir', txt: 'Desistir', tipo: 'ruim' }], dados: { neg: n.id } });
      } else { n.etapa = 'cancelada'; msg({ de: time.nome, cargo: 'Diretoria do clube', cat: 'jogo', game: n.game, titulo: `Proposta por ${p.nick} recusada`, corpo: `${fmt(n.fee)} não chega perto do que o ${p.nick} vale para nós. Nem vamos contrapropor.` }); }
      continue;
    }
    if (n.etapa === 'jogador') {
      const int = interesse(s, p, n.game) + (n.rosto ? 30 : 0);
      const ped = pedidoSalario(s, p);
      const t = s.teams[s.orgTeams[n.game]!];
      const piorTit = titulares(s, t).filter(x => x.role === p.role)[0];
      const querTitular = !piorTit || p.ovr >= piorTit.ovr - 1;
      if (int < 25) { n.etapa = 'cancelada'; msg({ de: `Empresário de ${p.nick}`, cargo: 'Agente', cat: 'jogo', game: n.game, titulo: `${p.nick} não quer negociar`, corpo: `O ${p.nick} agradece, mas não vê a ${s.org.nome} como o próximo passo da carreira agora.` }); continue; }
      if (querTitular && n.papel === 'reserva') { n.etapa = 'cancelada'; msg({ de: `Empresário de ${p.nick}`, cargo: 'Agente', cat: 'jogo', game: n.game, titulo: `${p.nick} recusa ser reserva`, corpo: `Ele só aceita vir como titular. Refaça a proposta.` }); continue; }
      if (n.sal >= ped) { fechar(s, n, msg); continue; }
      if (n.sal >= ped * 0.75) {
        n.pedido = ped;
        msg({ de: `Empresário de ${p.nick}`, cargo: 'Agente', cat: 'jogo', game: n.game, titulo: `${p.nick} pede mais salário`,
          corpo: `O ${p.nick} topa vir, mas quer ${fmt(ped * 4)} por mês (${fmt(ped)}/semana), contrato de ${n.anos} ano${n.anos > 1 ? 's' : ''} como ${n.papel}.`,
          acoes: [{ id: 'aceitar', txt: 'Aceitar o salário', tipo: 'bom' }, { id: 'desistir', txt: 'Desistir', tipo: 'ruim' }], dados: { neg: n.id } });
      } else { n.etapa = 'cancelada'; msg({ de: `Empresário de ${p.nick}`, cargo: 'Agente', cat: 'jogo', game: n.game, titulo: `${p.nick} recusa o salário`, corpo: `A proposta ficou muito abaixo do que ele ganha hoje. Negociação encerrada.` }); }
    }
  }
}

export function respostaNeg(s: State, negId: string, acao: string, msg: Msgr): string {
  const n = s.negs.find(x => x.id === negId);
  if (!n || n.pedido == null) return '';
  if (acao === 'desistir') { n.etapa = 'cancelada'; return 'Negociação encerrada.'; }
  if (n.etapa === 'clube') {
    if (s.org.caixa < n.pedido) { n.etapa = 'cancelada'; return 'Caixa insuficiente. Negociação encerrada.'; }
    n.fee = n.pedido; n.pedido = undefined; n.etapa = 'jogador'; n.resp = s.dia + 1;
    return 'Valor aceito. Agora falta o jogador.';
  }
  n.sal = n.pedido; n.pedido = undefined;
  return fechar(s, n, msg);
}

function fechar(s: State, n: Neg, msg: Msgr): string {
  const p = s.players[n.pid];
  const g = n.game;
  const t = s.teams[s.orgTeams[g]!];
  if (t.elenco.length >= maxElenco(g)) { n.etapa = 'cancelada'; return 'Elenco cheio.'; }
  if (s.org.caixa < n.fee) { n.etapa = 'cancelada'; return 'Caixa insuficiente.'; }
  const antigo = p.teamId ? s.teams[p.teamId] : null;
  if (antigo) { antigo.elenco = antigo.elenco.filter(x => x !== p.id); repoe(s, antigo); }
  s.org.caixa -= n.fee;
  p.teamId = t.id; p.sal = n.sal; p.contrato = anoAtual(s) + n.anos; p.venda = false;
  p.moral = clamp(p.moral + 10, 0, 98);
  t.elenco.push(p.id);
  if (n.papel === 'titular') {
    const nR = GAMES[g].roles.length;
    const idx = t.elenco.slice(0, nR).findIndex(id => s.players[id].role === p.role);
    if (idx >= 0) { const sai = t.elenco[idx]; t.elenco[idx] = p.id; t.elenco[t.elenco.length - 1] = sai; s.players[sai].moral = clamp(s.players[sai].moral - 8, 0, 98); }
  }
  if (!t.manual) escalarAuto(s, t);
  (p.hist ??= []).push({ d: s.dia, t: `Contratado pela ${s.org.nome}${n.fee ? ` por ${fmt(n.fee)}` : ' (sem custo de transferência)'}${antigo ? `, vindo da ${antigo.nome}` : ''}` });
  if (n.rosto) { s.rosto[g] = p.id; p.sal = Math.round(p.sal * 1.2); s.org.rep = clamp(s.org.rep + 6, 0, 100); s.org.fas = Math.round(s.org.fas * 1.25); mudaHype(s, 15); }
  n.etapa = 'fechada';
  s.alvos = s.alvos.filter(x => x !== p.id);
  msg({ de: 'Departamento de esports', cargo: 'Contratações', cat: 'jogo', game: g, titulo: `${n.rosto ? '⭐ ' : ''}${p.nick} é da ${s.org.nome}!`,
    corpo: `${p.nick} assinou por ${n.anos} ano${n.anos > 1 ? 's' : ''}, salário de ${fmt(n.sal * 4)}/mês, como ${n.papel}.${n.fee ? `\nTransferência: ${fmt(n.fee)}.` : ''}${n.rosto ? `\n\nEle é o novo Rosto da Org no ${GAMES[g].curto}. Seguidores e patrocinadores já sentiram.` : ''}` });
  post(s, `Bem-vindo, ${p.nick}! 🔥 ${s.org.sigla} cada vez mais forte`, 'bom');
  return `${p.nick} contratado!`;
}

/** time da IA que perdeu jogador repõe com agente livre da mesma função */
export function repoe(s: State, t: Team) {
  const nR = GAMES[t.game].roles.length;
  for (let r = 0; r < nR; r++) {
    if (t.elenco.some(id => s.players[id]?.role === r)) continue;
    const livre = Object.values(s.players).filter(p => p.game === t.game && !p.teamId && p.role === r).sort((a, b) => b.ovr - a.ovr)[0];
    if (livre) { livre.teamId = t.id; t.elenco.push(livre.id); }
  }
  escalarAuto(s, t);
}

// ---------- seus jogadores: venda, dispensa, renovação ----------
export function dispensar(s: State, pid: string): string | null {
  const p = s.players[pid];
  const t = s.teams[p?.teamId ?? ''];
  if (!t?.org) return 'Não é seu jogador.';
  if (t.elenco.length <= GAMES[t.game].roles.length) return 'O elenco ficaria incompleto.';
  const semanas = Math.max(4, (p.contrato - anoAtual(s)) * 52 + (52 - Math.floor(dy(s) / 7)));
  const multa = Math.round(p.sal * semanas * 0.5);
  if (s.org.caixa < multa) return `Rescisão custa ${fmt(multa)}. Caixa insuficiente.`;
  s.org.caixa -= multa;
  t.elenco = t.elenco.filter(x => x !== pid); p.teamId = null;
  if (s.rosto[t.game] === pid) delete s.rosto[t.game];
  (p.hist ??= []).push({ d: s.dia, t: `Dispensado pela ${s.org.nome}` });
  escalarAuto(s, t);
  return null;
}
export const custoRescisao = (s: State, p: Player) => Math.round(p.sal * Math.max(4, (p.contrato - anoAtual(s)) * 52 + (52 - Math.floor(dy(s) / 7))) * 0.5);

export function renovar(s: State, pid: string, sal: number, anos: number): { ok: boolean; txt: string } {
  const p = s.players[pid];
  const ped = pedidoSalario(s, p);
  const g = p.game;
  const minimo = ped * (p.moral >= 70 ? 0.9 : p.moral < 45 ? 1.2 : 1);
  if (sal >= minimo) { p.sal = sal; p.contrato = Math.max(p.contrato, anoAtual(s)) + anos; p.moral = clamp(p.moral + 6, 0, 98); (p.hist ??= []).push({ d: s.dia, t: `Renovou até ${p.contrato}` }); return { ok: true, txt: `${p.nick} renovou até ${p.contrato}.` }; }
  p.moral = clamp(p.moral - 4, 0, 98);
  void g;
  return { ok: false, txt: `${p.nick} quer pelo menos ${fmt(Math.round(minimo) * 4)}/mês.` };
}

// ---------- IA no mercado ----------
function propostasPelosSeus(s: State, msg: Msgr) {
  for (const g of s.jogos) {
    const t = s.teams[s.orgTeams[g]!];
    if (!t) continue;
    const cands = t.elenco.map(id => s.players[id]).filter(p => p && (p.venda || p.ovr >= 74));
    if (!cands.length || !chance(s, cands.some(p => p.venda) ? 0.5 : 0.18)) continue;
    const p = pick(s, cands);
    const compradores = Object.values(s.teams).filter(x => !x.org && x.game === g && x.tier === 1 && forca(s, x) >= forca(s, t) - 3);
    if (!compradores.length) continue;
    const c = pick(s, compradores);
    const oferta = Math.round(valorMercado(p) * (0.85 + rnd(s) * 0.55) / 1000) * 1000;
    msg({ de: c.nome, cargo: 'Diretoria do clube', cat: 'jogo', game: g, titulo: `${c.nome} faz proposta por ${p.nick}`,
      corpo: `A ${c.nome} oferece ${fmt(oferta)} pelo ${p.nick}.${p.traco === 'ambicioso' && c.tier === 1 ? '\n\nO jogador já deixou claro que gostaria de ir.' : ''}`,
      acoes: [{ id: 'vender', txt: `Vender por ${fmt(oferta)}`, tipo: 'bom' }, { id: 'mais', txt: 'Pedir 25% a mais' }, { id: 'recusar', txt: 'Recusar', tipo: 'ruim' }],
      dados: { venda: { pid: p.id, comprador: c.id, oferta }, expira: s.dia + 5 } });
  }
}
export function respostaVenda(s: State, d: { pid: string; comprador: string; oferta: number }, acao: string): string {
  const p = s.players[d.pid], c = s.teams[d.comprador], t = s.teams[p.teamId ?? ''];
  if (!p || !c || !t?.org) return '';
  if (acao === 'recusar') { if (p.traco === 'ambicioso') p.moral = clamp(p.moral - 12, 0, 98); return 'Proposta recusada.'; }
  let valor = d.oferta;
  if (acao === 'mais') { if (!chance(s, 0.5)) return `A ${c.nome} não aceitou pagar mais e desistiu.`; valor = Math.round(valor * 1.25 / 1000) * 1000; }
  if (!janelaAberta(s)) return 'A janela fechou antes de concluir.';
  t.elenco = t.elenco.filter(x => x !== p.id);
  if (t.elenco.length < GAMES[t.game].roles.length) repoe(s, t);
  escalarAuto(s, t);
  const sai = c.elenco.map(id => s.players[id]).filter(x => x.role === p.role).sort((a, b) => a.ovr - b.ovr)[0];
  if (sai && c.elenco.length >= GAMES[c.game].roles.length + 2) { c.elenco = c.elenco.filter(x => x !== sai.id); sai.teamId = null; }
  p.teamId = c.id; c.elenco.push(p.id); escalarAuto(s, c);
  s.org.caixa += valor;
  if (s.rosto[t.game] === p.id) delete s.rosto[t.game];
  (p.hist ??= []).push({ d: s.dia, t: `Vendido para a ${c.nome} por ${fmt(valor)}` });
  post(s, `${p.nick} se despede da ${s.org.sigla}. Obrigado por tudo!`, 'neutro');
  return `${p.nick} vendido para a ${c.nome} por ${fmt(valor)}.`;
}

/** a IA troca jogadores entre si durante a janela (gera notícias) */
function iaContrata(s: State, noticia: (t: string) => void) {
  for (let k = 0; k < 2; k++) {
    const g = pick(s, s.jogos);
    const times = Object.values(s.teams).filter(t => !t.org && t.game === g);
    const t = pick(s, times);
    const nR = GAMES[g].roles.length;
    const tit = t.elenco.slice(0, nR).map(id => s.players[id]);
    const pior = tit.sort((a, b) => a.ovr - b.ovr)[0];
    if (!pior) continue;
    const pool = Object.values(s.players).filter(p => p.game === g && p.role === pior.role && p.ovr >= pior.ovr + 2 && p.teamId !== t.id && !s.teams[p.teamId ?? '']?.org
      && (!p.teamId || s.teams[p.teamId].tier >= t.tier && s.teams[p.teamId].elenco.indexOf(p.id) >= nR - (s.teams[p.teamId].tier > t.tier ? nR : 0)));
    if (!pool.length) continue;
    const novo = pick(s, pool);
    const de = novo.teamId ? s.teams[novo.teamId] : null;
    if (de) { de.elenco = de.elenco.filter(x => x !== novo.id); }
    t.elenco = t.elenco.filter(x => x !== pior.id);
    pior.teamId = de ? de.id : null;
    if (de) de.elenco.push(pior.id);
    novo.teamId = t.id; t.elenco.push(novo.id);
    escalarAuto(s, t); if (de) escalarAuto(s, de);
    (novo.hist ??= []).push({ d: s.dia, t: `Contratado pela ${t.nome}` });
    noticia(`${GAMES[g].curto}: ${t.nome} contrata ${novo.nick}${de ? ` (ex-${de.nome})` : ''}; ${pior.nick} ${de ? `vai para a ${de.nome}` : 'fica livre'}.`);
  }
}

// ---------- Rosto da Org ----------
export function candidatosRosto(s: State, g: GameId): Player[] {
  const ps = Object.values(s.players).filter(p => p.game === g && !s.teams[p.teamId ?? '']?.org && p.teamId);
  return ps.sort((a, b) => b.ovr - a.ovr).slice(0, 6);
}
export function exigenciasRosto(s: State, g: GameId, p: Player): { txt: string; ok: boolean }[] {
  const t = s.teams[s.orgTeams[g]!];
  const tec = tecnicoDe(s, g);
  const repMin = Math.min(85, 40 + Math.max(0, p.ovr - 84) * 4);
  const sedeMin = p.ovr >= 90 ? 2 : 1;
  const custo = valorClube(s, p) * 1.1 + pedidoSalario(s, p) * 1.2 * 8;
  return [
    { txt: `Reputação da org ≥ ${repMin} (hoje ${Math.round(s.org.rep)})`, ok: s.org.rep >= repMin },
    { txt: 'Time na liga principal (elite)', ok: t?.tier === 1 },
    { txt: `Sede ${['Casa mediana', 'Casa grande', 'Mansão', 'Prédio'][sedeMin]} ou melhor`, ok: s.sede.nivel >= sedeMin },
    { txt: `Técnico com nota ≥ 75${tec ? ` (hoje ${tec.nota})` : ''}`, ok: !!tec && tec.nota >= 75 },
    { txt: `Caixa ≥ ${fmt(custo)} (transferência + luvas)`, ok: s.org.caixa >= custo },
    { txt: 'Janela de transferências aberta', ok: janelaAberta(s) },
  ];
}
export function convidarRosto(s: State, g: GameId, pid: string): string | null {
  const p = s.players[pid];
  if (exigenciasRosto(s, g, p).some(e => !e.ok)) return 'Ainda faltam exigências.';
  if (s.rosto[g]) return 'Você já tem um Rosto da Org nesse jogo.';
  return abrirNeg(s, pid, { fee: Math.round(valorClube(s, p) * 1.1 / 1000) * 1000, sal: Math.round(pedidoSalario(s, p) * 1.2 / 100) * 100, anos: 3, papel: 'titular', rosto: true });
}

// ---------- redes sociais ----------
const PERFIS = ['@torcida_{s}', '@{s}_fanclub', '@capivara_gamer', '@analista_br', '@zoeira_esports', '@mae_do_pro', '@tryhard99', '@fã_n1'];
export function post(s: State, txt: string, tom: 'bom' | 'ruim' | 'neutro') {
  const social = doCargo(s, 'social')[0];
  const likes = Math.round(s.org.fas * (0.01 + rnd(s) * 0.03) * (social ? 1 + (social.nota - 60) / 60 : 1));
  s.redes = [...(s.redes ?? []), { dia: s.dia, autor: pick(s, PERFIS).replace('{s}', s.org.sigla.toLowerCase()), txt, tom, likes }].slice(-40);
}

/** rotina diária do mercado */
export function tickMercado(s: State, msg: Msgr, noticia: (t: string) => void) {
  relatorios(s, msg);
  respondeNegs(s, msg);
  const d = dy(s);
  if (JANELAS.some(([a]) => a === d) && s.dia > 0) msg({ de: 'Departamento de esports', cargo: 'Mercado', cat: 'noticia', titulo: 'Janela de transferências aberta', corpo: 'A janela abriu. Dá para contratar jogadores com contrato e vender os seus. Agentes livres podem ser contratados a qualquer momento.' });
  if (JANELAS.some(([, b]) => b + 1 === d)) msg({ de: 'Departamento de esports', cargo: 'Mercado', cat: 'noticia', titulo: 'Janela de transferências fechada', corpo: `A janela fechou. A próxima abre em breve; veja o calendário.` });
  if (janelaAberta(s) && d % 7 === 3) { propostasPelosSeus(s, msg); iaContrata(s, noticia); }
  // contratos que acabam: aviso no dia 300, saída no fim do ano
  if (d === 300) {
    const fim = s.jogos.flatMap(g => s.teams[s.orgTeams[g]!]?.elenco ?? []).map(id => s.players[id]).filter(p => p && p.contrato <= anoAtual(s));
    if (fim.length) msg({ de: 'Departamento de esports', cargo: 'Contratos', cat: 'jogo', titulo: 'Contratos terminando', corpo: `Terminam no fim do ano: ${fim.map(p => p.nick).join(', ')}.\nRenove na ficha de cada jogador (Elenco), ou eles saem de graça.` });
  }
}
/** fim de temporada: quem tem contrato vencido sai; a IA renova os seus */
export function contratosFimDeAno(s: State, msg: Msgr) {
  const ano = anoAtual(s);
  for (const p of Object.values(s.players)) {
    if (!p.teamId || p.contrato > ano) continue;
    const t = s.teams[p.teamId];
    if (!t.org) { p.contrato = ano + ri(s, 1, 2); continue; }
    if (t.elenco.length <= GAMES[t.game].roles.length) { p.contrato = ano + 1; continue; }
    t.elenco = t.elenco.filter(x => x !== p.id); p.teamId = null;
    if (s.rosto[t.game] === p.id) delete s.rosto[t.game];
    (p.hist ??= []).push({ d: s.dia, t: `Saiu da ${t.nome} no fim do contrato` });
    msg({ de: 'Departamento de esports', cargo: 'Contratos', cat: 'jogo', game: t.game, titulo: `${p.nick} deixa a org`, corpo: `O contrato de ${p.nick} acabou e ele saiu como agente livre.` });
    escalarAuto(s, t);
  }
}
