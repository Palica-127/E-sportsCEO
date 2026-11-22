import { GAMES, GameId } from './games';
import { clamp, rnd } from './rng';
import type { HallEntry, Player, Premiado, PremioAno, State } from './types';
import { forca } from './world';
import { lanca, moeda, msg, repoeElenco } from './org';
import { anoDe, isOrg, ligaDoTime, noticia } from './sim';
import { tecnicoDe } from './staff';
import { mudaHype } from './marca';
import { escalarAuto } from './world';

// ---------- temporada da org ----------
export function registraTemporada(s: State) {
  const ano = anoDe(s.dia);
  const reg: NonNullable<State['temporadas']>[number] = { ano, caixa: s.org.caixa, rep: s.org.rep, fas: s.org.fas, jogos: {} };
  for (const g of s.jogos) {
    const tid = s.orgTeams[g]!; const t = s.teams[tid]; if (!t) continue;
    let v = 0, d = 0;
    for (const m of Object.values(s.matches)) {
      if (m.sa == null || (m.a !== tid && m.b !== tid) || anoDe(m.dia) !== ano) continue;
      if ((m.a === tid) === (m.sa > m.sb!)) v++; else d++;
    }
    const titulos = s.hist.filter(h => h.ano === ano && h.game === g && h.campeao === t.nome).map(h => h.nome);
    reg.jogos[g] = { liga: ligaDoTime(s, tid).nome, v, d, titulos };
    for (const id of t.elenco) { const p = s.players[id]; if (p) p.orgAnos = (p.orgAnos ?? 0) + 1; }
  }
  (s.temporadas ??= []).push(reg);
}

// ---------- prêmios anuais ----------
const ref = (s: State, p: Player, motivo?: string): Premiado => {
  const t = s.teams[p.teamId ?? ''];
  return { pid: p.id, nick: p.nick, nat: p.nat ?? '', role: p.role, time: t?.nome ?? 'Sem time', sigla: t?.sigla ?? '—', nota: p.ovr, org: !!t?.org, motivo };
};

export function premiosDoAno(s: State) {
  const ano = anoDe(s.dia);
  const out: PremioAno[] = [];
  const orgGanhou: string[] = [];
  for (const g of s.jogos) {
    const titulosTime = new Map<string, number>();
    for (const h of s.hist) if (h.ano === ano && h.game === g) titulosTime.set(h.campeao, (titulosTime.get(h.campeao) ?? 0) + (['split', 'd2'].includes(h.kind) ? 1 : 2));
    const regiao = s.teams[s.orgTeams[g]!]?.region;
    const mundo = Object.values(s.players).filter(p => {
      if (p.game !== g || !p.teamId) return false;
      const t = s.teams[p.teamId];
      return !!t && (t.tier === 1 || (t.org && !t.acad)) && t.elenco.indexOf(p.id) < GAMES[g].roles.length;
    });
    const nota = (p: Player) => p.ovr + p.forma + (p.mvpAno ?? 0) * 0.5 + (titulosTime.get(s.teams[p.teamId!].nome) ?? 0) * 2;
    mundo.sort((a, b) => nota(b) - nota(a));
    // prêmios da liga da org (região dela); o melhor do mundo sai à parte
    const cand = mundo.filter(p => s.teams[p.teamId!].region === regiao);
    const liga = s.leagues[`${g}-${regiao}-1`]?.nome ?? GAMES[g].nome;
    const mvpP = cand[0] ?? null;
    const rev = cand.filter(p => p.idade <= 20).sort((a, b) => nota(b) - nota(a))[0] ?? null;
    const selecao = GAMES[g].roles.map((_, r) => cand.find(p => p.role === r)).filter(Boolean).map(p => ref(s, p!, `${p!.mvpAno ?? 0} MVPs no ano`));
    const daRegiao = (nome: string) => Object.values(s.teams).some(t => t.game === g && t.nome === nome && t.region === regiao);
    const timeDoAno = [...titulosTime.entries()].filter(([n]) => daRegiao(n)).sort((a, b) => b[1] - a[1])[0]?.[0]
      ?? Object.values(s.teams).filter(t => t.game === g && t.tier === 1 && t.region === regiao).sort((a, b) => forca(s, b) - forca(s, a))[0]?.nome ?? null;
    const orgT = s.teams[s.orgTeams[g]!];
    const tec = orgT && timeDoAno === orgT.nome ? tecnicoDe(s, g) : null;
    const pr: PremioAno = {
      ano, game: g, liga,
      mundial: mundo[0] ? ref(s, mundo[0], `nota ${mundo[0].ovr}, ${mundo[0].mvpAno ?? 0} MVPs no ano`) : null,
      mvp: mvpP ? ref(s, mvpP, `${mvpP.mvpAno ?? 0} MVPs de partida e nota ${mvpP.ovr}`) : null,
      revelacao: rev ? ref(s, rev, `${rev.idade} anos, nota ${rev.ovr}`) : null,
      selecao, timeDoAno, tecnico: tec ? { nome: tec.nome, time: orgT.nome } : undefined,
    };
    out.push(pr);
    const marca = (p: Premiado | null, t: string) => {
      if (!p) return;
      const pl = s.players[p.pid]; if (!pl) return;
      (pl.premios ??= []).push({ ano, t });
      (pl.hist ??= []).push({ d: s.dia, t: `🏅 ${t} ${ano}` });
      if (p.org) orgGanhou.push(`${p.nick} (${t})`);
    };
    marca(pr.mundial ?? null, `Melhor do mundo · ${GAMES[g].curto}`);
    marca(pr.mvp, `MVP do ano · ${liga}`);
    marca(pr.revelacao, `Revelação do ano · ${liga}`);
    for (const p of selecao) marca(p, `Seleção do ano · ${liga}`);
    if (tec) { orgGanhou.push(`${tec.nome} (Técnico do ano)`); tec.nota = clamp(tec.nota + 1, 40, 95); }
    noticia(s, `${GAMES[g].curto}: ${pr.mvp?.nick ?? '—'} (${pr.mvp?.sigla}) é o MVP do ano`);
  }
  for (const p of Object.values(s.players)) p.mvpAno = 0;
  (s.premiosAno ??= []).push(...out);
  if (orgGanhou.length) { s.org.rep = clamp(s.org.rep + Math.min(4, orgGanhou.length), 0, 100); mudaHype(s, 8); }
  msg(s, { de: 'Liga · Cerimônia de premiação', cargo: `Prêmios ${ano}`, cat: 'noticia', titulo: `🏅 Prêmios do ano ${ano}`,
    corpo: `A temporada ${ano} acabou e os prêmios foram entregues.\n\n${out.map(p => `${p.liga}: MVP ${p.mvp?.nick ?? '—'} (${p.mvp?.sigla ?? ''}) · melhor do mundo ${p.mundial?.nick ?? '—'} · Revelação ${p.revelacao?.nick ?? '—'} · Time do ano ${p.timeDoAno ?? '—'}`).join('\n')}\n\n${orgGanhou.length ? `Da sua org: ${orgGanhou.join(', ')}. A reputação subiu.` : 'Nenhum prêmio individual para a sua org desta vez.'}\n\nVeja tudo na tela História.`, dados: { tela: 'historia' } });
}

// ---------- aposentadoria e Hall da Fama ----------
export const pontosCarreira = (p: Player) =>
  (p.titulos ?? 0) * 3 + p.mvps * 0.08 + (p.premios ?? []).reduce((a, x) => a + (x.t.startsWith('Melhor do mundo') ? 15 : x.t.startsWith('MVP') ? 8 : x.t.startsWith('Revelação') ? 3 : 5), 0) + ((p.pico ?? p.ovr) >= 90 ? 6 : (p.pico ?? p.ovr) >= 85 ? 2 : 0);
export const LIMIAR_HALL = 28;

function chanceAposentar(s: State, p: Player): number {
  if (p.idade >= 35) return 1;
  if (p.idade >= 33) return 0.55;
  if (p.idade >= 31) return 0.2;
  if (p.idade >= 27 && !p.teamId && p.ovr < 62) return 0.5;
  return 0;
}

export function aposentadorias(s: State) {
  const ano = anoDe(s.dia);
  const saem: Player[] = [];
  for (const p of Object.values(s.players)) {
    if (!s.jogos.includes(p.game)) continue;
    p.pico = Math.max(p.pico ?? 0, p.ovr);
    if (rnd(s) < chanceAposentar(s, p)) saem.push(p);
  }
  const hofNovos: HallEntry[] = [];
  for (const p of saem) {
    const t = s.teams[p.teamId ?? ''];
    const pts = Math.round(pontosCarreira(p) * 10) / 10;
    const lendaOrg = (p.orgAnos ?? 0) >= 2 || (p.titulosOrg ?? 0) >= 1;
    const hof = pts >= LIMIAR_HALL;
    if (hof || lendaOrg) {
      const e: HallEntry = { pid: p.id, nick: p.nick, nat: p.nat ?? '', game: p.game, role: p.role, ano, inicio: p.desde ?? ano - (p.idade - 17), idade: p.idade,
        titulos: p.titulos ?? 0, mvps: p.mvps, jogos: p.jogos, pico: p.pico ?? p.ovr, premios: (p.premios ?? []).map(x => `${x.t} ${x.ano}`), ultimoTime: t?.nome ?? 'Sem time',
        pontos: pts, hof, lendaOrg, orgAnos: p.orgAnos ?? 0, titulosOrg: p.titulosOrg ?? 0 };
      (s.hall ??= []).push(e);
      if (hof) hofNovos.push(e);
    }
    if (t?.org) msg(s, { de: p.nick, cargo: t.acad ? 'Academy' : GAMES[p.game].curto, cat: 'tecnico', game: p.game, titulo: `${p.nick} anuncia a aposentadoria`,
      corpo: `CEO, chegou a hora. Com ${p.idade} anos, encerro a carreira. Obrigado por tudo na ${s.org.nome}.${lendaOrg ? '\n\nVou ficar na história da org. Se quiser, dá para aposentar a minha camisa na tela História.' : ''}` });
    else if (hof) noticia(s, `${GAMES[p.game].curto}: ${p.nick} se aposenta aos ${p.idade} anos e entra para o Hall da Fama`);
    // tira o jogador do mundo
    if (t) { t.elenco = t.elenco.filter(id => id !== p.id); if (t.org) escalarAuto(s, t); else repoeElenco(s, t); }
    s.alvos = s.alvos.filter(id => id !== p.id);
    delete s.conhecido[p.id];
    for (const n of s.negs) if (n.pid === p.id && n.etapa !== 'fechada') n.etapa = 'cancelada';
    for (const m of s.inbox) if (m.dados?.pid === p.id) m.resolvida = 'O jogador se aposentou.';
    for (const g of Object.keys(s.rosto) as GameId[]) if (s.rosto[g] === p.id) delete s.rosto[g];
    delete s.players[p.id];
  }
  if (hofNovos.length) msg(s, { de: 'Hall da Fama', cargo: `Classe de ${ano}`, cat: 'noticia', titulo: `Hall da Fama: classe de ${ano}`,
    corpo: `Entram para o Hall da Fama:\n\n${hofNovos.map(e => `${e.nick} (${GAMES[e.game].curto}) · ${e.titulos} títulos · ${e.premios.length} prêmios · ${e.pontos} pontos`).join('\n')}`, dados: { tela: 'historia' } });
}

/** aposentar a camisa de uma lenda da org */
export function aposentarCamisa(s: State, pid: string): string | null {
  const e = s.hall?.find(x => x.pid === pid);
  if (!e || !e.lendaOrg) return 'Só lendas da org.';
  if (e.camisa) return 'A camisa já foi aposentada.';
  const custo = 30_000;
  if (s.org.caixa < custo) return `A cerimônia custa ${moeda(custo)}.`;
  s.org.caixa -= custo; lanca(s, 'desp', 'Eventos', custo);
  e.camisa = true;
  s.org.rep = clamp(s.org.rep + 1, 0, 100);
  s.org.fas = Math.round(s.org.fas * 1.02);
  mudaHype(s, 6);
  noticia(s, `${s.org.nome} aposenta a camisa de ${e.nick} em cerimônia emocionante`);
  return `A camisa de ${e.nick} vai para a parede da sede. Os fãs adoraram.`;
}

/** maiores campeões de cada competição */
export function campeoesPorTorneio(s: State, g: GameId) {
  const m = new Map<string, { nome: string; kind: string; edicoes: { ano: number; campeao: string; vice: string; split?: string }[] }>();
  for (const h of s.hist) {
    if (h.game !== g) continue;
    const k = h.nome.replace(/\s\d{4}$/, '').replace(/ · Split \d+$/, '');
    const x = m.get(k) ?? { nome: k, kind: h.kind, edicoes: [] };
    x.edicoes.push({ ano: h.ano, campeao: h.campeao, vice: h.vice, split: / · Split (\d+)$/.exec(h.nome)?.[1] });
    m.set(k, x);
  }
  return [...m.values()];
}
export const isOrgNome = (s: State, nome: string) => nome === s.org.nome;
export { isOrg };
