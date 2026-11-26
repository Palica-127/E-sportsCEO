import { CSSProperties } from 'react';
import { GAMES } from '../engine/games';
import { probMapa, probSerie } from '../engine/match';
import { notaVista } from '../engine/mercado';
import { fmtData, isOrg, jogosDoTorneio } from '../engine/sim';
import { tecnicoDe } from '../engine/staff';
import type { Match, Player, State, Team } from '../engine/types';
import { forca, titulares } from '../engine/world';
import { Crest, Flag, RetratoJogador, Ult, pct } from './common';
import { nomeFase } from './Resumo';

/** retrato do confronto calculado ANTES de simular o dia (para a 2ª partida não "vazar" o resultado) */
export interface PreDados {
  id: string;
  fa: number; fb: number; pa: number;
  placares: { a: number; b: number; p: number }[];
  ta: LadoDados; tb: LadoDados;
  h2h: { id: string; dia: number; tor: string; sa: number; sb: number; aEhA: boolean }[];
}
interface LadoDados {
  rank: number;
  media: number;
  camp: { v: number; d: number; mv: number; md: number };
  ult: ('V' | 'D')[];
  seq: string;
  tec: string | null;
  jog: { id: string; role: string; nota: string; forma: number; moral: number; kda: string; media: string; mvps: number }[];
}

/** probabilidade de cada placar exato numa série melhor de `bo` */
function placaresExatos(p: number, bo: number) {
  const w = Math.ceil(bo / 2), out: { a: number; b: number; p: number }[] = [];
  const comb = (n: number, k: number) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
  for (let l = 0; l < w; l++) out.push({ a: w, b: l, p: comb(w - 1 + l, l) * p ** w * (1 - p) ** l });
  for (let l = w - 1; l >= 0; l--) out.push({ a: l, b: w, p: comb(w - 1 + l, l) * (1 - p) ** w * p ** l });
  return out;
}

function lado(s: State, m: Match, t: Team): LadoDados {
  const rank = Object.values(s.teams).filter(x => x.game === t.game && (x.tier === 1 || (x.org && !x.acad))).sort((a, b) => forca(s, b) - forca(s, a)).findIndex(x => x.id === t.id) + 1;
  const ts = titulares(s, t);
  const ve = (p: Player) => notaVista(s, p);
  const conhecidas = ts.map(ve).filter(v => v.a > 0);
  const media = conhecidas.length ? conhecidas.reduce((a, v) => a + (v.a + v.b) / 2, 0) / conhecidas.length : 0;
  const camp = { v: 0, d: 0, mv: 0, md: 0 };
  for (const x of jogosDoTorneio(s, m.tor)) {
    if (x.sa == null || (x.a !== t.id && x.b !== t.id)) continue;
    const meus = x.a === t.id ? x.sa : x.sb!, deles = x.a === t.id ? x.sb! : x.sa;
    if (meus > deles) camp.v++; else camp.d++;
    camp.mv += meus; camp.md += deles;
  }
  const passados = Object.values(s.matches).filter(x => x.sa != null && (x.a === t.id || x.b === t.id)).sort((a, b) => b.dia - a.dia);
  const ult = passados.slice(0, 5).map(x => ((x.a === t.id) === (x.sa! > x.sb!) ? 'V' : 'D') as 'V' | 'D');
  let seq = '';
  if (ult.length) { let n = 0; while (n < ult.length && ult[n] === ult[0]) n++; seq = `${n} ${ult[0] === 'V' ? (n > 1 ? 'vitórias' : 'vitória') : n > 1 ? 'derrotas' : 'derrota'} seguida${n > 1 ? 's' : ''}`; }
  // estatísticas das partidas detalhadas (temporada atual)
  const st: Record<string, { k: number; d: number; a: number; n: number; nota: number }> = {};
  const ano0 = s.dia - (s.dia % 364);
  for (const x of passados) {
    if (x.dia < ano0 || !x.det) continue;
    for (const mp of x.det) for (const l of [...mp.la, ...mp.lb]) {
      const r = (st[l.pid] ??= { k: 0, d: 0, a: 0, n: 0, nota: 0 });
      r.k += l.k; r.d += l.d; r.a += l.a; r.n++; r.nota += l.nota;
    }
  }
  const g = GAMES[t.game];
  const jog = ts.map((p, i) => {
    const r = st[p.id];
    const kda = !r ? '—' : g.placar === 'moba' ? ((r.k + r.a) / Math.max(1, r.d)).toFixed(1) : (r.k / Math.max(1, r.d)).toFixed(2);
    return { id: p.id, role: g.roles[i] ?? '', nota: ve(p).txt, forma: p.forma, moral: p.moral, kda, media: r ? (r.nota / r.n).toFixed(1) : '—', mvps: p.mvps };
  });
  const tec = t.org ? tecnicoDe(s, t.game)?.nome ?? null : null;
  return { rank, media, camp, ult, seq, tec, jog };
}

export function preDados(s: State, m: Match): PreDados {
  const A = s.teams[m.a], B = s.teams[m.b];
  const fa = forca(s, A), fb = forca(s, B);
  const pa = probSerie(fa, fb, m.bo);
  const h2h = Object.values(s.matches)
    .filter(x => x.sa != null && x.id !== m.id && ((x.a === m.a && x.b === m.b) || (x.a === m.b && x.b === m.a)))
    .sort((a, b) => b.dia - a.dia).slice(0, 5)
    .map(x => ({ id: x.id, dia: x.dia, tor: s.torneios[x.tor]?.nome ?? '', sa: x.sa!, sb: x.sb!, aEhA: x.a === m.a }));
  return { id: m.id, fa, fb, pa, placares: placaresExatos(probMapa(fa, fb), m.bo), ta: lado(s, m, A), tb: lado(s, m, B), h2h };
}

const seta = (f: number) => (f >= 1.5 ? '▲▲' : f >= 0.5 ? '▲' : f <= -1.5 ? '▼▼' : f <= -0.5 ? '▼' : '●');
const clsF = (f: number) => (f >= 0.5 ? 'up' : f <= -0.5 ? 'down' : 'eq');

export function PreJogo({ s, m, d, n, total, onAssistir, onSimular, onDepois }: {
  s: State; m: Match; d: PreDados; n: number; total: number;
  onAssistir: () => void; onSimular: () => void; onDepois?: () => void;
}) {
  const A = s.teams[m.a], B = s.teams[m.b], g = GAMES[m.game];
  const meuA = isOrg(s, m.a);
  const linha = (rot: string, va: string, vb: string, na?: number, nb?: number) => {
    const melhor = na != null && nb != null && na !== nb ? (na > nb ? 'a' : 'b') : '';
    return <div className="pj-cmp"><b className={melhor === 'a' ? 'best' : ''}>{va}</b><span>{rot}</span><b className={melhor === 'b' ? 'best' : ''}>{vb}</b></div>;
  };
  const tor = s.torneios[m.tor];
  const fav = d.pa >= 0.5 ? A : B;
  return (
    <div className="pj" style={{ '--g': g.cor, '--ca': A.cor, '--cb': B.cor } as CSSProperties}>
      <div className="pj-top">
        <span className="gtag">{g.curto}</span>
        <span>{tor?.nome} · {nomeFase(m)} · Bo{m.bo}</span>
        <span className="pj-dia">{fmtData(m.dia)}</span>
        {total > 1 && <span className="pj-n">Partida {n} de {total}</span>}
      </div>

      <div className="pj-board">
        <div className="pj-team"><Crest link={false} s={s} team={A} size={88} /><b>{A.nome}</b><small>#{d.ta.rank} no ranking · {d.ta.camp.v}V {d.ta.camp.d}D</small>{meuA && <em>SUA ORG</em>}</div>
        <div className="pj-mid">
          <div className="pj-pct"><b>{d.pa > 0.995 ? ">99%" : d.pa < 0.005 ? "<1%" : pct(d.pa)}</b><span>chance de vitória</span><b>{d.pa < 0.005 ? ">99%" : d.pa > 0.995 ? "<1%" : pct(1 - d.pa)}</b></div>
          <div className="pj-bar"><i style={{ width: d.pa * 100 + '%' }} /></div>
          <div className="pj-forca"><span>Força {d.fa.toFixed(1)}</span><span>Força {d.fb.toFixed(1)}</span></div>
          <div className="pj-placares">
            {d.placares.map(p => <span key={`${p.a}-${p.b}`} className={p.a > p.b ? 'a' : 'b'}><b>{p.a}–{p.b}</b><small>{p.p < 0.005 ? "<1%" : pct(p.p)}</small></span>)}
          </div>
          <small className="mut">Favorito: <b>{fav.nome}</b>{Math.abs(d.pa - 0.5) < 0.07 ? ' (jogo equilibrado)' : ''}</small>
        </div>
        <div className="pj-team"><Crest link={false} s={s} team={B} size={88} /><b>{B.nome}</b><small>#{d.tb.rank} no ranking · {d.tb.camp.v}V {d.tb.camp.d}D</small>{!meuA && isOrg(s, m.b) && <em>SUA ORG</em>}</div>
      </div>

      <div className="pj-grid">
        <section className="pj-box">
          <h4>» Comparativo</h4>
          {linha('Força', d.fa.toFixed(1), d.fb.toFixed(1), d.fa, d.fb)}
          {linha('Nota média dos titulares', d.ta.media ? d.ta.media.toFixed(1) : '?', d.tb.media ? d.tb.media.toFixed(1) : '?', d.ta.media || undefined, d.tb.media || undefined)}
          {linha('Campanha no torneio', `${d.ta.camp.v}–${d.ta.camp.d}`, `${d.tb.camp.v}–${d.tb.camp.d}`, d.ta.camp.v - d.ta.camp.d, d.tb.camp.v - d.tb.camp.d)}
          {linha('Mapas', `${d.ta.camp.mv}–${d.ta.camp.md}`, `${d.tb.camp.mv}–${d.tb.camp.md}`, d.ta.camp.mv - d.ta.camp.md, d.tb.camp.mv - d.tb.camp.md)}
          {linha('Ranking mundial', `#${d.ta.rank}`, `#${d.tb.rank}`, -d.ta.rank, -d.tb.rank)}
          <div className="pj-cmp"><Ult r={d.ta.ult} /><span>Últimos 5</span><Ult r={d.tb.ult} /></div>
          <div className="pj-cmp small"><b>{d.ta.seq || '—'}</b><span>Sequência</span><b>{d.tb.seq || '—'}</b></div>
        </section>

        <section className="pj-box">
          <h4>» Últimos confrontos</h4>
          {d.h2h.length === 0 ? <p className="mut">Primeiro confronto entre os dois.</p> : (
            <>
              <div className="pj-h2h-res">
                <b>{d.h2h.filter(h => (h.aEhA ? h.sa > h.sb : h.sb > h.sa)).length}</b><span>vitórias</span><b>{d.h2h.filter(h => (h.aEhA ? h.sb > h.sa : h.sa > h.sb)).length}</b>
              </div>
              {d.h2h.map(h => {
                const a = h.aEhA ? h.sa : h.sb, b = h.aEhA ? h.sb : h.sa;
                return (
                  <div key={h.id} className="pj-h2h">
                    <small>{fmtData(h.dia, false)}</small>
                    <span className={a > b ? 'w' : ''}>{A.sigla}</span>
                    <b>{a}–{b}</b>
                    <span className={b > a ? 'w' : ''}>{B.sigla}</span>
                    <small className="tor">{h.tor}</small>
                  </div>
                );
              })}
            </>
          )}
        </section>
      </div>

      <div className="pj-lineups">
        {([[A, d.ta], [B, d.tb]] as const).map(([t, ld]) => (
          <section key={t.id} className="pj-box">
            <h4>» {t.nome}{ld.tec ? <small> · Técnico {ld.tec}</small> : null}</h4>
            <div className="pj-jh"><span>Função</span><span>Jogador</span><span>Nota</span><span>Forma</span><span>{g.placar === 'moba' ? 'KDA' : 'K/D'}</span><span title="Nota média por partida na temporada">Média</span><span>MVPs</span></div>
            {ld.jog.map(j => {
              const p = s.players[j.id];
              return (
                <div key={j.id} className="pj-j">
                  <span className="role">{j.role}</span>
                  <span className="nm">{p && <RetratoJogador s={s} p={p} size={30} />}{p && <Flag nat={p.nat} />}<b>{p?.nick}</b></span>
                  <span className="nota">{j.nota}</span>
                  <span className={'forma ' + clsF(j.forma)}>{seta(j.forma)}</span>
                  <span>{j.kda}</span>
                  <span>{j.media}</span>
                  <span>{j.mvps}</span>
                </div>
              );
            })}
          </section>
        ))}
      </div>

      <div className="modal-f">
        {onDepois ? <button className="btn ghost" onClick={onDepois}>Depois</button> : <span />}
        <div className="pj-acoes">
          <button className="btn" onClick={onSimular} title="Vai direto para o resultado">SIMULAR</button>
          <button className="btn primary big" onClick={onAssistir}>▶ ASSISTIR</button>
        </div>
      </div>
    </div>
  );
}
