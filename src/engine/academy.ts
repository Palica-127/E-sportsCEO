import { GAMES, GameId } from './games';
import { clamp, ri, rnd } from './rng';
import type { State, Team } from './types';
import { criaJogador, escalarAuto, forca, geraNick, natCluster, salario, sorteiaPais } from './world';
import { lanca, moeda, msg, noticia2, repoeElenco } from './org';
import { anoDe } from './sim';
import { QUARTOS } from './staff';

export const CUSTO_ACADEMY = 180_000;
export const maxAcademy = (g: GameId) => GAMES[g].roles.length + 3;

export const academyDe = (s: State, g: GameId): Team | null => { const id = s.academias?.[g]; return id ? s.teams[id] ?? null : null; };

/** jogadores morando na sede (principal + Academy de todos os jogos) */
export function moradores(s: State): number {
  let n = 0;
  for (const g of s.jogos) { n += s.teams[s.orgTeams[g]!]?.elenco.length ?? 0; n += academyDe(s, g)?.elenco.length ?? 0; }
  return n;
}
export const camas = (s: State) => QUARTOS[s.sede.nivel];

export function podeAbrirAcademy(s: State, g: GameId): string | null {
  const t = s.teams[s.orgTeams[g]!];
  if (!t) return 'Você não tem time nesse jogo.';
  if (academyDe(s, g)) return 'Já existe uma Academy.';
  if (t.tier !== 1) return 'A Academy só abre quando o time principal está na elite (ela joga a Challengers).';
  if (s.org.caixa < CUSTO_ACADEMY) return `Precisa de ${moeda(CUSTO_ACADEMY)} em caixa.`;
  if (moradores(s) + GAMES[g].roles.length + 2 > camas(s)) return `Faltam camas na sede: ${moradores(s)} moradores para ${camas(s)} camas. Mude para uma sede maior.`;
  return null;
}

/** compra a vaga do time mais fraco da Challengers e monta um elenco de base com jovens */
export function abrirAcademy(s: State, g: GameId): string | null {
  const e = podeAbrirAcademy(s, g); if (e) return e;
  const main = s.teams[s.orgTeams[g]!];
  const L = s.leagues[`${g}-${main.region}-2`];
  const fraco = L.teams.map(id => s.teams[id]).filter(t => !t.org).sort((a, b) => forca(s, a) - forca(s, b))[0];
  if (!fraco) return 'Não há vaga na Challengers.';
  for (const pid of fraco.elenco) s.players[pid].teamId = null;
  fraco.elenco = [];
  const antigo = fraco.nome;
  fraco.nome = `${s.org.nome} Academy`; fraco.sigla = (s.org.sigla.slice(0, 3) + 'A').toUpperCase(); fraco.cor = s.org.cor; fraco.slug = '__org';
  fraco.org = true; fraco.acad = true; fraco.manual = false;
  const nR = GAMES[g].roles.length, cl = natCluster(g, main.region);
  for (let k = 0; k < nR + 2; k++) {
    const cc = sorteiaPais(s, cl);
    const p = criaJogador(s, { game: g, role: k % nR, ovr: ri(s, 58, 66), nick: geraNick(s, cc), nat: cc.toLowerCase(), idade: ri(s, 16, 19) });
    p.pot = clamp(p.ovr + ri(s, 10, 24), p.ovr, 93);
    p.teamId = fraco.id; p.sal = salario(p.ovr); p.contrato = anoDe(s.dia) + 2;
    (p.hist ??= []).push({ d: s.dia, t: `Entrou na base da ${s.org.nome}` });
    fraco.elenco.push(p.id);
  }
  escalarAuto(s, fraco);
  (s.academias ??= {})[g] = fraco.id;
  s.org.caixa -= CUSTO_ACADEMY; lanca(s, 'desp', 'Expansão', CUSTO_ACADEMY);
  noticia2(s, g, `${s.org.nome} compra a vaga da ${antigo} e lança sua Academy na ${L.nome}`);
  msg(s, { de: 'Departamento de scouting', cargo: 'Base', cat: 'tecnico', game: g, titulo: `${GAMES[g].curto}: Academy aberta`,
    corpo: `A ${fraco.nome} vai disputar a ${L.nome} com ${nR + 2} jovens da solo queue. Eles evoluem mais rápido jogando partidas oficiais.\n\nNa ficha de cada jogador dá para promover ao principal ou mandar para a Academy. A Academy não pode subir de divisão.` });
  return null;
}

export function fecharAcademy(s: State, g: GameId, motivo: 'rebaixamento' | 'ceo') {
  const t = academyDe(s, g); if (!t) return;
  for (const pid of t.elenco) { const p = s.players[pid]; p.teamId = null; (p.hist ??= []).push({ d: s.dia, t: `Saiu com o fim da Academy da ${s.org.nome}` }); }
  t.elenco = [];
  t.nome = `${GAMES[g].curto} Challengers ${t.id.slice(-3)}`; t.sigla = 'CHL'; t.cor = '#7a8699'; t.slug = ''; t.org = false; t.acad = false;
  repoeElenco(s, t);
  delete s.academias![g];
  const reembolso = Math.round(CUSTO_ACADEMY * 0.6);
  s.org.caixa += reembolso;
  msg(s, { de: 'Conselho da diretoria', cargo: 'Diretoria', cat: 'diretoria', game: g, titulo: `${GAMES[g].curto}: Academy encerrada`,
    corpo: motivo === 'rebaixamento' ? `Com o rebaixamento do time principal, a Academy não pode dividir a Challengers com ele. A vaga foi vendida por ${moeda(reembolso)} e os jovens ficaram livres.` : `A vaga da Academy foi vendida por ${moeda(reembolso)}. Os jovens ficaram livres no mercado.` });
}

/** move um jogador entre principal e Academy */
export function moverBase(s: State, g: GameId, pid: string): string | null {
  const main = s.teams[s.orgTeams[g]!], ac = academyDe(s, g), p = s.players[pid];
  if (!ac || !p) return 'Sem Academy nesse jogo.';
  const nR = GAMES[g].roles.length;
  if (p.teamId === ac.id) {
    if (main.elenco.length >= nR + 3) return 'Elenco principal cheio. Libere uma vaga antes.';
    ac.elenco = ac.elenco.filter(x => x !== pid); main.elenco.push(pid); p.teamId = main.id;
    p.moral = clamp(p.moral + 10, 0, 98); p.sal = Math.max(p.sal, salario(p.ovr));
    (p.hist ??= []).push({ d: s.dia, t: `Promovido ao time principal da ${s.org.nome}` });
    if (!main.manual) escalarAuto(s, main);
    escalarAuto(s, ac); if (ac.elenco.length < nR) repoeAcademy(s, g);
    return `${p.nick} subiu para o time principal.`;
  }
  if (p.teamId === main.id) {
    if (ac.elenco.length >= maxAcademy(g)) return 'A Academy está cheia.';
    if (main.elenco.length <= nR) return 'O principal ficaria sem titulares.';
    main.elenco = main.elenco.filter(x => x !== pid); ac.elenco.push(pid); p.teamId = ac.id;
    p.moral = clamp(p.moral - (p.idade >= 22 ? 15 : 5), 10, 98);
    (p.hist ??= []).push({ d: s.dia, t: 'Enviado para a Academy' });
    if (!main.manual) escalarAuto(s, main); else repoeTitular(s, main);
    escalarAuto(s, ac);
    return `${p.nick} foi para a Academy.`;
  }
  return 'Esse jogador não é da org.';
}
function repoeTitular(s: State, t: Team) { escalarAuto(s, t); t.manual = false; }
/** a base sempre tem pelo menos um jogador por função */
function repoeAcademy(s: State, g: GameId) {
  const ac = academyDe(s, g)!; const nR = GAMES[g].roles.length;
  for (let r = 0; r < nR; r++) {
    if (ac.elenco.some(id => s.players[id]?.role === r)) continue;
    const cc = sorteiaPais(s, natCluster(g, ac.region));
    const p = criaJogador(s, { game: g, role: r, ovr: ri(s, 57, 63), nick: geraNick(s, cc), nat: cc.toLowerCase(), idade: ri(s, 16, 18) });
    p.pot = clamp(p.ovr + ri(s, 10, 22), p.ovr, 92); p.teamId = ac.id; p.sal = salario(p.ovr); p.contrato = anoDe(s.dia) + 2;
    ac.elenco.push(p.id);
  }
  escalarAuto(s, ac);
}

/** evolução mensal dos jovens da base (jogam partidas oficiais: crescem mais) */
export function treinoAcademy(s: State) {
  for (const g of s.jogos) {
    const ac = academyDe(s, g); if (!ac) continue;
    for (const id of ac.elenco) {
      const p = s.players[id]; if (!p || p.ovr >= p.pot) continue;
      if (rnd(s) < (p.idade <= 19 ? 0.5 : 0.35)) { p.ovr++; if (p.ovr % 3 === 0) (p.hist ??= []).push({ d: s.dia, t: `Evoluiu para nota ${p.ovr} na Academy` }); }
    }
  }
}
