// Simulação de partidas: resultado por força dos elencos e, para jogos da org, um resumo com eventos.
import { GAMES } from './games';
import { HasSeed, chance, clamp, pick, ri, rnd, shuffle, weighted } from './rng';
import type { Match, MapDet, MapEvent, Player, PlayerLine, State, Team } from './types';
import { forca, titulares } from './world';

export function probMapa(fa: number, fb: number): number {
  return 1 / (1 + Math.exp(-(fa - fb) / 4.2));
}
/** chance de vencer a série (Bo1/Bo3/Bo5) */
export function probSerie(fa: number, fb: number, bo: number): number {
  const p = probMapa(fa, fb);
  const need = Math.ceil(bo / 2);
  // soma das combinações em que A chega a "need" vitórias primeiro
  let tot = 0;
  for (let l = 0; l < need; l++) tot += comb(need - 1 + l, l) * Math.pow(p, need) * Math.pow(1 - p, l);
  return tot;
}
function comb(n: number, k: number) { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; }

export function simulaSerie(s: State, m: Match, detalhe: boolean) {
  const A = s.teams[m.a], B = s.teams[m.b];
  const fa = forca(s, A), fb = forca(s, B);
  const need = Math.ceil(m.bo / 2);
  let wa = 0, wb = 0;
  const dets: MapDet[] = [];
  const mapasUsados: string[] = [];
  const pontos: Record<string, number> = {};
  while (wa < need && wb < need) {
    const pa = probMapa(fa + (rnd(s) - 0.5) * 2, fb + (rnd(s) - 0.5) * 2);
    const vA = rnd(s) < pa;
    if (vA) wa++; else wb++;
    const d = geraMapa(s, A, B, vA ? 'a' : 'b', pa, mapasUsados);
    for (const l of [...d.la, ...d.lb]) pontos[l.pid] = (pontos[l.pid] ?? 0) + l.nota;
    if (detalhe) dets.push(d);
  }
  m.sa = wa; m.sb = wb;
  const venc = wa > wb ? A : B;
  const cand = titulares(s, venc);
  const mvp = cand.slice().sort((x, y) => (pontos[y.id] ?? 0) - (pontos[x.id] ?? 0))[0];
  m.mvp = mvp?.id;
  if (detalhe) m.det = dets;
  posJogo(s, A, wa > wb, pontos, m.mvp);
  posJogo(s, B, wb > wa, pontos, m.mvp);
}

/** atualiza forma, moral e histórico dos times depois da série */
function posJogo(s: State, t: Team, venceu: boolean, pontos: Record<string, number>, mvp?: string) {
  t.ult = [...t.ult, venceu ? 'V' : 'D'].slice(-5) as ('V' | 'D')[];
  const tit = titulares(s, t);
  const media = tit.reduce((a, p) => a + (pontos[p.id] ?? 6), 0) / Math.max(1, tit.length);
  for (const p of tit) {
    const perf = ((pontos[p.id] ?? media) - media) * 0.6 + (venceu ? 0.6 : -0.6) + (p.id === mvp ? 1.2 : 0);
    const peso = p.traco === 'irregular' ? 0.5 : 0.35;
    p.forma = clamp(Math.round((p.forma * (1 - peso) + perf * peso * 2) * 10) / 10, -3, 3);
    p.moral = clamp(p.moral + (venceu ? 2 : -2) + (p.id === mvp ? 2 : 0) - (p.traco === 'tranquilo' && !venceu ? -1 : 0), 20, 98);
    p.jogos++;
    if (p.id === mvp) { p.mvps++; p.mvpAno = (p.mvpAno ?? 0) + 1; }
  }
  for (const p of t.elenco.slice(tit.length).map(id => s.players[id]).filter(Boolean)) {
    p.moral = clamp(p.moral + (p.moral > 55 ? -0.5 : 0.2), 20, 98);
  }
}

// ---------- geração do mapa (placar, eventos, linhas dos jogadores) ----------

function geraMapa(s: State, A: Team, B: Team, venc: 'a' | 'b', pa: number, usados: string[]): MapDet {
  const g = GAMES[A.game];
  const ta = titulares(s, A), tb = titulares(s, B);
  const dom = venc === 'a' ? pa : 1 - pa; // quanto o vencedor era favorito
  let mapa: string | undefined;
  if (g.mapas) { mapa = pick(s, g.mapas.filter(x => !usados.includes(x))); usados.push(mapa); }
  switch (g.placar) {
    case 'moba': return mapaMoba(s, A, B, ta, tb, venc, dom);
    case 'gols': return mapaGols(s, A, B, ta, tb, venc, dom);
    default: return mapaRounds(s, A, B, ta, tb, venc, dom, mapa);
  }
}

function distribui(s: HasSeed, total: number, ps: Player[], pesoRole: number[]): number[] {
  const out = ps.map(() => 0);
  for (let i = 0; i < total; i++) {
    const k = weighted(s, ps.map((_, j) => j), j => (pesoRole[ps[j].role] ?? 1) * (0.6 + (ps[j].ovr - 60) / 40) * (0.7 + rnd(s) * 0.6));
    out[k]++;
  }
  return out;
}

function mapaMoba(s: State, A: Team, B: Team, ta: Player[], tb: Player[], venc: 'a' | 'b', dom: number): MapDet {
  const wr = A.game === 'wr', dota = A.game === 'dota2';
  const dur = wr ? ri(s, 14, 22) : dota ? ri(s, 28, 52) : ri(s, 24, 40);
  const lamb = clamp(dom, 0.5, 0.9);
  const kW = Math.round((dota ? ri(s, 22, 40) : ri(s, 12, 26)) * (0.85 + lamb * 0.3));
  const kL = Math.max(0, Math.round(kW * (1.05 - lamb) * (0.5 + rnd(s) * 0.8)));
  const [ka, kb] = venc === 'a' ? [kW, kL] : [kL, kW];
  // eventos ao longo do tempo
  const ev: MapEvent[] = [];
  const nomeA = A.sigla, nomeB = B.sigla;
  const lado = (favW: number) => (rnd(s) < favW ? venc : venc === 'a' ? 'b' : 'a');
  const nom = (l: 'a' | 'b') => (l === 'a' ? nomeA : nomeB);
  const jog = (l: 'a' | 'b') => pick(s, l === 'a' ? ta : tb).nick;
  let ca = 0, cb = 0;
  const fb = lado(0.6);
  const obj = A.game === 'dota2'
    ? [['Roshan', 0.45], ['Roshan (Aegis)', 0.7], ['Tormentor', 0.3]]
    : [['Dragão', 0.25], ['Arauto', 0.3], ['Dragão', 0.45], ['Barão', 0.65], ['Dragão Ancião', 0.85]];
  ev.push({ t: rnd(s) * 0.12 + 0.04, txt: `First blood! ${jog(fb)} abre o placar para a ${nom(fb)}`, lado: fb, sa: 0, sb: 0, tipo: 'kill' });
  for (const [o, tt] of obj) {
    if (wr && o === 'Arauto') continue;
    if (chance(s, 0.8)) { const l = lado(0.68); ev.push({ t: (tt as number) + (rnd(s) - 0.5) * 0.08, txt: `${nom(l)} garante o ${o}`, lado: l, sa: 0, sb: 0, tipo: 'obj' }); }
  }
  const nLutas = ri(s, 2, 4);
  for (let i = 0; i < nLutas; i++) {
    const l = lado(0.65);
    const n = ri(s, 2, 4);
    ev.push({ t: 0.2 + rnd(s) * 0.6, txt: `Teamfight! ${nom(l)} vence a luta ${n}x${ri(s, 0, n - 1)}${n >= 4 ? ' e quase faz o ACE' : ''}`, lado: l, sa: 0, sb: 0, tipo: 'luta' });
  }
  if (chance(s, 0.35)) { const l = venc === 'a' ? 'b' : 'a'; ev.push({ t: 0.5 + rnd(s) * 0.25, txt: `${nom(l)} rouba o objetivo e reacende o jogo!`, lado: l, sa: 0, sb: 0, tipo: 'virada' }); }
  ev.push({ t: 0.985, txt: `${nom(venc)} derruba o ${dota ? 'Ancião' : 'Nexus'}. Vitória!`, lado: venc, sa: 0, sb: 0, tipo: 'fim' });
  ev.sort((x, y) => x.t - y.t);
  let ia = 0, ib = 0;
  for (const e of ev) {
    const prog = e.t;
    ia = Math.max(ia, Math.round(ka * prog)); ib = Math.max(ib, Math.round(kb * prog));
    if (e.tipo === 'kill' && ia + ib === 0) { if (e.lado === 'a') ia = 1; else ib = 1; }
    e.sa = ia; e.sb = ib;
  }
  ca = ka; cb = kb;
  const fim = ev[ev.length - 1]; fim.sa = ka; fim.sb = kb;
  // curva de ouro
  const pts = 12;
  const alvo = (venc === 'a' ? 1 : -1) * (wr ? 3 + rnd(s) * 5 : 5 + rnd(s) * 10);
  const ouro: number[] = [0];
  let v = 0;
  for (let i = 1; i <= pts; i++) {
    const x = i / pts;
    v = alvo * Math.pow(x, 1.3) + (rnd(s) - 0.5) * 2.2 * Math.sin(x * Math.PI);
    ouro.push(Math.round(v * 10) / 10);
  }
  // linhas dos jogadores
  const peso = [1, 1, 1.4, 1.6, 0.3];
  const la = linhasMoba(s, ta, ca, cb, peso), lb = linhasMoba(s, tb, cb, ca, peso);
  const vencL = venc === 'a' ? la : lb;
  const mvp = vencL.slice().sort((x, y) => y.nota - x.nota)[0];
  return { venc, sa: ca, sb: cb, dur, ev, ouro, la, lb, mvp: mvp.pid };
}
function linhasMoba(s: State, ps: Player[], k: number, d: number, peso: number[]): PlayerLine[] {
  const ks = distribui(s, k, ps, peso);
  const ds = distribui(s, d, ps, [1, 1.1, 1, 1, 1.2]);
  return ps.map((p, i) => {
    const a = Math.max(0, Math.round(k * (0.3 + rnd(s) * 0.4)) - ks[i]);
    const kda = (ks[i] + a) / Math.max(1, ds[i]);
    return { pid: p.id, nick: p.nick, k: ks[i], d: ds[i], a, nota: Math.round((5 + kda * 0.9 + (p.ovr - 75) / 10 + rnd(s)) * 10) / 10 };
  });
}

function mapaRounds(s: State, A: Team, B: Team, ta: Player[], tb: Player[], venc: 'a' | 'b', dom: number, mapa?: string): MapDet {
  const g = A.game;
  const alvo = g === 'r6' ? 7 : g === 'ff' ? 4 : 13;
  const lamb = clamp(dom, 0.5, 0.9);
  let perde = Math.round((alvo - 1) * (1.15 - lamb) * (0.4 + rnd(s) * 0.9));
  perde = clamp(perde, 0, alvo - 1);
  let vW = alvo;
  if (perde === alvo - 1 && g !== 'ff' && chance(s, 0.4)) { vW = alvo + (g === 'r6' ? 1 : 3); perde = vW - 2; } // prorrogação
  const [fa, fb] = venc === 'a' ? [vW, perde] : [perde, vW];
  // sequência de rounds: embaralha e guarda o último round para o vencedor
  const lose: 'a' | 'b' = venc === 'a' ? 'b' : 'a';
  const seq = shuffle(s, [...Array(vW - 1).fill(venc), ...Array(perde).fill(lose)] as ('a' | 'b')[]);
  seq.push(venc);
  const ev: MapEvent[] = [];
  const nom = (l: 'a' | 'b') => (l === 'a' ? A.sigla : B.sigla);
  const jog = (l: 'a' | 'b') => pick(s, l === 'a' ? ta : tb).nick;
  let sa = 0, sb = 0;
  const N = seq.length;
  const momentos = new Set<number>([0, N - 1]);
  if (g !== 'ff') momentos.add(Math.min(N - 1, alvo === 13 ? 12 : 6));
  while (momentos.size < Math.min(N, 7)) momentos.add(ri(s, 1, N - 2));
  seq.forEach((l, i) => {
    if (l === 'a') sa++; else sb++;
    if (!momentos.has(i)) return;
    let txt: string;
    if (i === 0) txt = g === 'ff' ? `${nom(l)} vence a primeira rodada` : `${nom(l)} vence o pistol round`;
    else if (i === N - 1) txt = `${nom(l)} fecha o mapa${mapa ? ' em ' + mapa : ''}!`;
    else if (alvo === 13 && i === 12) txt = `Troca de lado: ${sa}–${sb}`;
    else if (alvo === 7 && i === 6) txt = `Troca de lado: ${sa}–${sb}`;
    else txt = pick(s, [
      `${jog(l)} faz um clutch 1v${ri(s, 2, 3)} para a ${nom(l)}`,
      `ACE de ${jog(l)}!`,
      `${nom(l)} ganha o round de eco e quebra a economia rival`,
      `${jog(l)} abre o round com um multi-kill`,
      `${nom(l)} segura o retake no último segundo`,
    ]);
    ev.push({ t: (i + 1) / N, txt, lado: l, sa, sb, tipo: i === N - 1 ? 'fim' : 'round' });
  });
  const linhas = (ps: Player[], meus: number, deles: number): PlayerLine[] => {
    const ks = distribui(s, Math.round(N * 3.3 * (0.8 + (meus / Math.max(1, N)) * 0.5)), ps, [1, 1.3, 1.25, 1, 0.8]);
    const ds = distribui(s, Math.round(N * 3.3 * (0.8 + (deles / Math.max(1, N)) * 0.5)), ps, [1, 1, 1.2, 1, 1]);
    return ps.map((p, i) => {
      const rating = clamp(0.55 + (ks[i] - ds[i]) / (N * 1.2) + ks[i] / (N * 1.6) + (rnd(s) - 0.5) * 0.15, 0.4, 2.2);
      return { pid: p.id, nick: p.nick, k: ks[i], d: ds[i], a: ri(s, 1, Math.max(2, Math.round(N / 3))), extra: rating.toFixed(2), nota: Math.round((rating * 6.5) * 10) / 10 };
    });
  };
  const la = linhas(ta, fa, fb), lb = linhas(tb, fb, fa);
  const mvp = (venc === 'a' ? la : lb).slice().sort((x, y) => y.nota - x.nota)[0];
  return { venc, mapa, sa: fa, sb: fb, dur: Math.round(N * (g === 'ff' ? 2.5 : 1.9)), ev, la, lb, mvp: mvp.pid };
}

function mapaGols(s: State, A: Team, B: Team, ta: Player[], tb: Player[], venc: 'a' | 'b', dom: number): MapDet {
  const lamb = clamp(dom, 0.5, 0.9);
  const gw = ri(s, 1, 3) + (chance(s, lamb - 0.4) ? 1 : 0);
  const gl = clamp(gw - ri(s, 1, Math.max(1, gw)), 0, gw - 1);
  const [ga, gb] = venc === 'a' ? [gw, gl] : [gl, gw];
  const ordem = shuffle(s, [...Array(ga).fill('a'), ...Array(gb).fill('b')] as ('a' | 'b')[]);
  // garante que o vencedor não termina atrás (o último gol decisivo é dele)
  const mins = ordem.map(() => ri(s, 3, 89)).sort((x, y) => x - y);
  const ev: MapEvent[] = [];
  let sa = 0, sb = 0;
  const nome = (l: 'a' | 'b') => (l === 'a' ? ta[0] : tb[0]).nick;
  ordem.forEach((l, i) => {
    if (l === 'a') sa++; else sb++;
    ev.push({ t: mins[i] / 90, txt: `${mins[i]}' GOL! ${nome(l)} marca (${sa}–${sb})`, lado: l, sa, sb, tipo: 'gol' });
  });
  if (chance(s, 0.5)) ev.push({ t: ri(s, 20, 80) / 90, txt: `Defesaça! O goleiro de ${nome(venc === 'a' ? 'b' : 'a')} salva no reflexo`, lado: venc === 'a' ? 'b' : 'a', sa: 0, sb: 0, tipo: 'lance' });
  ev.sort((x, y) => x.t - y.t);
  let xa = 0, xb = 0;
  for (const e of ev) { if (e.tipo === 'gol') { xa = e.sa; xb = e.sb; } else { e.sa = xa; e.sb = xb; } }
  ev.push({ t: 1, txt: `Fim de jogo: ${ga}–${gb}`, lado: venc, sa: ga, sb: gb, tipo: 'fim' });
  const la: PlayerLine[] = ta.map(p => ({ pid: p.id, nick: p.nick, k: ga, d: gb, a: 0, extra: `${ri(s, 45, 65)}% posse`, nota: Math.round((6 + (ga - gb) * 0.6 + rnd(s)) * 10) / 10 }));
  const lb: PlayerLine[] = tb.map(p => ({ pid: p.id, nick: p.nick, k: gb, d: ga, a: 0, extra: '', nota: Math.round((6 + (gb - ga) * 0.6 + rnd(s)) * 10) / 10 }));
  lb[0].extra = `${100 - parseInt(la[0].extra!)}% posse`;
  return { venc, sa: ga, sb: gb, dur: 90, ev, la, lb, mvp: (venc === 'a' ? la : lb)[0].pid };
}
