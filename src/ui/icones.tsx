import type { Msg, State } from '../engine/types';

/** categoria da mensagem: cor da faixa + ícone 3D padrão */
export const CAT: Record<Msg['cat'], { ico: string; cor: string; nome: string }> = {
  diretoria: { ico: 'predio-classico', cor: '#8b5cf6', nome: 'Diretoria' },
  tecnico: { ico: 'prancheta', cor: '#2ec5e8', nome: 'Comissão' },
  financas: { ico: 'dinheiro', cor: '#3fd17a', nome: 'Finanças' },
  patrocinio: { ico: 'aperto', cor: '#f59e0b', nome: 'Patrocínio' },
  jogo: { ico: 'controle', cor: '#e5484d', nome: 'Elenco e mercado' },
  noticia: { ico: 'jornal', cor: '#64748b', nome: 'Notícias' },
  peneira: { ico: 'lupa', cor: '#14b8c4', nome: 'Scouting' },
};

/** ícone 3D mais específico pelo assunto da mensagem */
export function ico3dMsg(m: Msg): string {
  const t = `${m.titulo} ${m.de} ${m.cargo}`;
  const r: [RegExp, string][] = [
    [/Hall da Fama/i, 'coroa'], [/Prêmios|premiação/i, 'ouro'], [/CAMPE[ÃA]|🏆/i, 'trofeu'], [/vice|encerrad/i, 'medalha'],
    [/aposentadoria/i, 'mao-acenando'], [/Academy|base/i, 'formatura'],
    [/Banco|Bank|Crédito|NexaBank|Órbita|Vértice/i, 'banco'], [/esgotado/i, 'festa'], [/chegou à loja/i, 'pacote'], [/Loja/i, 'sacolas'],
    [/LOTADO/i, 'festa'], [/Eventos|evento/i, 'ingresso'], [/obra|Obra|pronta|construç/i, 'obra'], [/sede|Sede|mudança/i, 'predio'],
    [/kit|Kit|periférico|teclado|headset/i, 'teclado'], [/Janela de transferências/i, 'maleta'], [/renova|contrato|Contrato/i, 'contrato'],
    [/patrocin/i, 'aperto'], [/caixa|Caixa|vermelho|dívida/i, 'alerta'], [/bootcamp|Bootcamp/i, 'foguete'], [/relatório|Relatório|olheiro|Olheiro/i, 'lupa'],
    [/meta|Meta|confiança/i, 'alvo'], [/redes|Redes|polêmica|viral/i, 'celular'], [/peneira|Peneira/i, 'lupa'],
  ];
  for (const [re, n] of r) if (re.test(t)) return n;
  return CAT[m.cat].ico;
}

/** quem mandou: um clube (escudo), um jogador (retrato), uma pessoa da comissão (rosto) ou uma instituição (ícone 3D) */
export type Remetente = { tipo: 'time'; id: string } | { tipo: 'jogador'; id: string } | { tipo: 'pessoa'; nome: string } | { tipo: '3d'; n: string };
export function remetente(s: State, m: Msg): Remetente {
  if (m.dados?.venda && s.teams[m.dados.venda.comprador]) return { tipo: 'time', id: m.dados.venda.comprador };
  if (m.dados?.neg) {
    const n = s.negs.find(x => x.id === m.dados.neg);
    const dono = n && s.players[n.pid]?.teamId;
    if (n && n.etapa === 'clube' && dono && s.teams[dono] && m.de === s.teams[dono].nome) return { tipo: 'time', id: dono };
    if (n && s.players[n.pid]) return { tipo: 'jogador', id: n.pid };
  }
  const time = Object.values(s.teams).find(t => t.nome === m.de && !t.org);
  if (time) return { tipo: 'time', id: time.id };
  for (const k of ['pid', 'sair']) if (m.dados?.[k] && s.players[m.dados[k]] && s.players[m.dados[k]].nick === m.de) return { tipo: 'jogador', id: m.dados[k] };
  const porNick = Object.values(s.players).find(p => p.nick === m.de && p.teamId && s.teams[p.teamId]?.org);
  if (porNick) return { tipo: 'jogador', id: porNick.id };
  if (Object.values(s.staff).some(x => x.nome === m.de) || (m.cat === 'tecnico' && /^[A-ZÁÉÍÓÚ][a-zà-ú]+ [A-ZÁÉÍÓÚ]/.test(m.de) && !/Departamento|Conselho|Gerente/.test(m.de))) return { tipo: 'pessoa', nome: m.de };
  return { tipo: '3d', n: ico3dMsg(m) };
}

/** ícone 3D de cada linha de receita/despesa */
const ICO_FIN: Record<string, string> = {
  'Salários': 'nota', 'Folha salarial': 'nota', 'Comissão técnica e staff': 'prancheta', 'Sede e cômodos': 'casa', 'Parcela da dívida': 'alerta',
  'Empréstimo': 'banco', 'Patrocínios': 'aperto', 'Conteúdo e streams': 'microfone', 'Repasse da liga': 'predio-classico', 'Loja da marca': 'sacolas',
  'Sócio-torcedor': 'bilhete', 'Ingressos': 'ingresso', 'Premiações': 'trofeu', 'Periféricos': 'teclado', 'Expansão': 'foguete',
  'Produção da loja': 'pacote', 'Eventos': 'festa', 'Luvas e multas': 'contrato', 'Bootcamp': 'foguete', 'Obras': 'obra', 'Vendas': 'dinheiro-voando',
};
export const icoFin = (k: string) => ICO_FIN[k] ?? (/obra|cômodo/i.test(k) ? 'obra' : /venda|transfer/i.test(k) ? 'dinheiro-voando' : 'dinheiro');
/** ícone 3D de cada cargo */
export const ICO_CARGO: Record<string, string> = {
  tecnico: 'prancheta', auxiliar: 'contrato', analista: 'analise', psicologo: 'cerebro', nutricionista: 'cozinha', chef: 'cozinha',
  preparador: 'academia', social: 'celular', olheiro: 'lupa',
};
