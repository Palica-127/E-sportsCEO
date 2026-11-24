import type React from 'react';
// Chaves, fase suíça, grupos e tabela: os mesmos componentes para todas as modalidades.
import { Fragment } from 'react';
import { SPECS } from '../engine/comp';
import type { Match, SpecId, Stage, State, Torneio } from '../engine/types';
import { jogosDoTorneio, tabelaTorneio } from '../engine/sim';
import { forca } from '../engine/world';
import { Crest, Ult, NomeTime } from './common';

const CW = 172, CH = 58, GX = 34;
const X = (c: number) => c * (CW + GX);
// posições (coluna, y) de cada confronto, no estilo do BrasLOL
const POS: Record<SpecId, { p: Record<string, [number, number]>; h: number; heads: [number, number, string][] }> = {
  de6: { p: { uq1: [0, 36], uq2: [0, 118], us1: [1, 36], us2: [1, 118], uf: [2, 77], l1: [1, 256], l2: [1, 338], ls: [2, 297], lf: [3, 297], gf: [4, 187] }, h: 420,
    heads: [[0, 6, 'Superior · Quartas'], [1, 6, 'Superior · Semis'], [2, 6, 'Superior · Final'], [1, 226, 'Inferior · Rodada 1'], [2, 226, 'Inferior · Semi'], [3, 226, 'Inferior · Final'], [4, 157, 'Grande final']] },
  de8: { p: { u1: [0, 36], u2: [0, 112], u3: [0, 188], u4: [0, 264], us1: [1, 74], us2: [1, 226], uf: [2, 150], lb1: [1, 382], lb2: [1, 458], lb3: [2, 382], lb4: [2, 458], lb5: [3, 420], lbf: [4, 420], gf: [5, 285] }, h: 540,
    heads: [[0, 6, 'Superior · Quartas'], [1, 6, 'Superior · Semis'], [2, 6, 'Superior · Final'], [1, 352, 'Inferior · R1'], [2, 352, 'Inferior · R2'], [3, 352, 'Inferior · R3'], [4, 352, 'Inferior · Final'], [5, 255, 'Grande final']] },
  de4: { p: { u1: [0, 36], u2: [0, 112], uf: [1, 74], lb1: [1, 216], lbf: [2, 216], gf: [3, 145] }, h: 300,
    heads: [[0, 6, 'Superior · R1'], [1, 6, 'Superior · Final'], [1, 186, 'Inferior · R1'], [2, 186, 'Inferior · Final'], [3, 115, 'Final']] },
  se4: { p: { s1: [0, 36], s2: [0, 136], f: [1, 86] }, h: 210, heads: [[0, 6, 'Semifinais'], [1, 56, 'Final']] },
  ko8: { p: { q1: [0, 36], q2: [0, 112], q3: [0, 188], q4: [0, 264], s1: [1, 74], s2: [1, 226], f: [2, 150] }, h: 340, heads: [[0, 6, 'Quartas'], [1, 44, 'Semifinais'], [2, 120, 'Final']] },
  gsl4: { p: { u1: [0, 30], u2: [0, 100], w: [1, 30], l: [1, 100], d: [2, 65] }, h: 170, heads: [[0, 4, 'Abertura'], [1, 4, 'Vencedores / Eliminação'], [2, 40, 'Decisiva']] },
  bo: { p: { a: [0, 36] }, h: 110, heads: [[0, 6, 'Série de acesso']] },
};

function Card({ s, m, a, b, tba, x, y, fin }: { s: State; m?: Match; a?: string; b?: string; tba: [string, string]; x: number; y: number; fin?: boolean }) {
  const row = (id: string | undefined, lado: 'a' | 'b', vazio: string) => {
    if (!id) return <div className="bt tba"><span className="bt-c" /><span className="bt-n">{vazio}</span><b>–</b></div>;
    const t = s.teams[id];
    const sc = m?.sa != null ? (lado === 'a' ? m.sa : m.sb) : null;
    const ot = m?.sa != null ? (lado === 'a' ? m.sb : m.sa) : null;
    return <div className={'bt ' + (sc != null ? (sc > ot! ? 'w' : 'l') : '') + (t.org ? ' org' : '')} title={t.nome}><Crest s={s} team={t} size={20} /><span className="bt-n"><NomeTime s={s} id={t.id} /></span><b>{sc ?? ''}</b></div>;
  };
  return (
    <div className={'bcard' + (m && m.sa == null ? ' pend' : '') + (fin ? ' fin' : '')} style={{ left: x, top: y, width: CW }}>
      {row(m?.a ?? a, 'a', tba[0])}{row(m?.b ?? b, 'b', tba[1])}
      {m && m.sa == null && <span className="bdate">Bo{m.bo}</span>}
    </div>
  );
}

const desc = (ref: string) => (ref[0] === 's' ? `Seed ${Number(ref.slice(1)) + 1}` : `${ref[0] === 'w' ? 'Vencedor' : 'Perdedor'} ${ref.slice(1).toUpperCase()}`);

/** chave de uma fase (ou de um grupo GSL) */
export function Chave({ s, st, pre = '', seeds, campeao }: { s: State; st: Stage; pre?: string; seeds: string[]; campeao?: string }) {
  const spec = SPECS[st.spec!];
  const L = POS[st.spec!];
  const byK = (k: string) => (st.res[pre + k] ? s.matches[st.res[pre + k]] : undefined);
  const venc = (m?: Match) => (m && m.sa != null ? (m.sa > m.sb! ? m.a : m.b) : undefined);
  const perd = (m?: Match) => (m && m.sa != null ? (m.sa > m.sb! ? m.b : m.a) : undefined);
  const src = (ref: string) => (ref[0] === 's' ? seeds[Number(ref.slice(1))] : ref[0] === 'w' ? venc(byK(ref.slice(1))) : perd(byK(ref.slice(1))));
  const cols = Math.max(...Object.values(L.p).map(p => p[0])) + 1;
  const ultimo = spec.r[spec.r.length - 1][0];
  const temCampeao = !pre && st.spec !== 'gsl4' && st.spec !== 'de4';
  const W = X(cols) - GX + (temCampeao ? 184 : 0);
  const linhas: React.ReactElement[] = [];
  for (const [k, [ra, rb]] of Object.entries(spec.m)) {
    for (const ref of [ra, rb]) {
      if (ref[0] !== 'w') continue;
      const o = L.p[ref.slice(1)], d = L.p[k];
      if (!o || !d) continue;
      const x1 = X(o[0]) + CW, y1 = o[1] + CH / 2, x2 = X(d[0]), y2 = d[1] + CH / 2, xm = x1 + (x2 - x1) / 2;
      linhas.push(<path key={k + ref} d={`M${x1} ${y1}H${xm}V${y2}H${x2}`} className={byK(ref.slice(1))?.sa != null ? 'on' : ''} />);
    }
  }
  const fm = byK(ultimo);
  const camp = campeao ?? venc(fm);
  return (
    <div className="chave-wrap">
      <div className="chave" style={{ width: W, height: L.h }}>
        <svg className="chave-l" width={W} height={L.h}>{linhas}</svg>
        {L.heads.map(([c, y, t], i) => <div key={i} className="chave-h" style={{ left: X(c), top: y, width: CW }}>{t}</div>)}
        {Object.entries(L.p).map(([k, [c, y]]) => {
          const [ra, rb] = spec.m[k];
          return <Card key={k} s={s} m={byK(k)} a={src(ra)} b={src(rb)} tba={[desc(ra), desc(rb)]} x={X(c)} y={y} fin={k === ultimo} />;
        })}
        {temCampeao && (
          <div className="champ" style={{ left: X(cols) - GX + 24, top: L.p[ultimo][1] + CH / 2 }}>
            <small>Campeão</small>
            {camp ? <><Crest s={s} team={s.teams[camp]} size={46} /><b><NomeTime s={s} id={camp} /></b></> : <b className="q">?</b>}
          </div>
        )}
      </div>
    </div>
  );
}

/** fase suíça: campanha de cada time e os confrontos rodada a rodada */
export function Suico({ s, tor, st, si }: { s: State; tor: Torneio; st: Stage; si: number }) {
  const ms = jogosDoTorneio(s, tor.id).filter(m => m.st === si);
  const rec = st.rec ?? {};
  const rodadas = Math.max(5, ...ms.map(m => m.rodada));
  const ord = st.seeds.slice().sort((a, b) => (rec[b]?.w ?? 0) - (rec[a]?.w ?? 0) || (rec[a]?.l ?? 0) - (rec[b]?.l ?? 0) || forca(s, s.teams[b]) - forca(s, s.teams[a]));
  return (
    <table className="tab suico">
      <thead><tr><th>#</th><th className="tm">Time</th><th>V-D</th>{Array.from({ length: rodadas }, (_, i) => <th key={i}>R{i + 1}</th>)}<th>Situação</th></tr></thead>
      <tbody>{ord.map((id, i) => {
        const r = rec[id] ?? { w: 0, l: 0 };
        const t = s.teams[id];
        return (
          <tr key={id} className={(t.org ? 'org ' : '') + (r.w >= 3 ? 'ok' : r.l >= 3 ? 'out' : '')}>
            <td className="pos">{i + 1}</td>
            <td className="tm"><Crest s={s} team={t} size={20} /><NomeTime s={s} id={t.id} /></td>
            <td><b>{r.w}-{r.l}</b></td>
            {Array.from({ length: rodadas }, (_, k) => {
              const m = ms.find(x => x.rodada === k + 1 && (x.a === id || x.b === id));
              if (!m) return <td key={k} className="sw-x" />;
              const adv = s.teams[m.a === id ? m.b : m.a];
              const win = m.sa != null ? (m.a === id) === (m.sa > m.sb!) : null;
              return <td key={k} className={'sw-c ' + (win == null ? '' : win ? 'v' : 'd')} title={`${t.sigla} x ${adv.sigla}${m.sa != null ? ` (${m.sa}-${m.sb})` : ''}`}>{adv.sigla}</td>;
            })}
            <td>{r.w >= 3 ? <span className="pill v">Classificado</span> : r.l >= 3 ? <span className="pill d">Eliminado</span> : <span className="mut">Em disputa</span>}</td>
          </tr>
        );
      })}</tbody>
    </table>
  );
}

/** grupos GSL: classificação e mini-chave de cada grupo */
export function Grupos({ s, st }: { s: State; st: Stage }) {
  return (
    <div className="grupos">
      {st.grupos!.map(g => {
        const ms = Object.entries(st.res).filter(([k]) => k.startsWith(g.n + ':')).map(([, id]) => s.matches[id]);
        const vd = (id: string) => ms.reduce((a, m) => (m.sa == null || (m.a !== id && m.b !== id) ? a : (m.a === id) === (m.sa > m.sb!) ? [a[0] + 1, a[1]] : [a[0], a[1] + 1]), [0, 0]);
        const ord = g.ids.slice().sort((a, b) => vd(b)[0] - vd(a)[0] || vd(a)[1] - vd(b)[1]);
        return (
          <section key={g.n} className="panel">
            <header className="panel-h"><h3>Grupo {g.n}</h3></header>
            <table className="tab mini"><tbody>{ord.map((id, i) => <tr key={id} className={(s.teams[id].org ? 'org ' : '') + (i < 2 && vd(id)[0] >= 2 ? 'ok' : '')}><td className="pos">{i + 1}</td><td className="tm"><Crest s={s} team={s.teams[id]} size={18} /><NomeTime s={s} id={id} /></td><td>{vd(id)[0]}-{vd(id)[1]}</td></tr>)}</tbody></table>
            <Chave s={s} st={st} pre={g.n + ':'} seeds={g.ids} />
          </section>
        );
      })}
    </div>
  );
}

/** tabela de pontos corridos */
export function TabelaLiga({ s, tor, compacta }: { s: State; tor: Torneio; compacta?: boolean }) {
  const tab = tabelaTorneio(s, tor);
  const po = tor.stages[1]?.spec ? SPECS[tor.stages[1].spec!].n : 0;
  return (
    <table className={'tab' + (compacta ? ' mini' : '')}>
      <thead><tr><th>#</th><th className="tm">Time</th><th>J</th><th>V</th><th>D</th>{!compacta && <><th>Mapas</th><th>Saldo</th><th className="hide-sm">Últimos 5</th><th className="hide-sm">Força</th></>}</tr></thead>
      <tbody>{tab.map((l, i) => {
        const t = s.teams[l.id];
        return (
          <tr key={l.id} className={(t.org ? 'org ' : '') + (i < po ? 'po ' : '') + (i === tab.length - 1 && tor.kind === 'split' ? 'rel' : '')}>
            <td className="pos">{i + 1}</td>
            <td className="tm"><Crest s={s} team={t} size={compacta ? 16 : 20} /><NomeTime s={s} id={t.id} /></td>
            <td>{l.j}</td><td><b>{l.v}</b></td><td>{l.d}</td>
            {!compacta && <><td>{l.mp}–{l.mc}</td><td className={l.mp - l.mc > 0 ? 'pos-n' : l.mp - l.mc < 0 ? 'neg' : ''}>{l.mp - l.mc > 0 ? '+' : ''}{l.mp - l.mc}</td><td className="hide-sm"><Ult r={t.ult} /></td><td className="hide-sm">{forca(s, t).toFixed(1)}</td></>}
          </tr>
        );
      })}</tbody>
    </table>
  );
}

/** confrontos por rodada (lista) */
export function ListaJogos({ s, ms }: { s: State; ms: Match[] }) {
  const por: Record<string, Match[]> = {};
  for (const m of ms) (por[`${m.dia}|${m.label}`] ??= []).push(m);
  const ks = Object.keys(por).sort((a, b) => Number(a.split('|')[0]) - Number(b.split('|')[0]));
  if (!ks.length) return <p className="mut pad">Ainda sem jogos.</p>;
  return (
    <div className="lista-jogos">
      {ks.map(k => (
        <Fragment key={k}>
          <div className="lj-h">{k.split('|')[1]}<span>{new Date(Date.UTC(2027, 0, 4) + Number(k.split('|')[0]) * 864e5).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}</span></div>
          {por[k].map(m => (
            <div key={m.id} className={'lj ' + (s.teams[m.a].org || s.teams[m.b].org ? 'org' : '')}>
              <span className={'lj-t r ' + (m.sa != null && m.sa > m.sb! ? 'w' : '')}><NomeTime s={s} id={m.a} /><Crest s={s} team={s.teams[m.a]} size={18} /></span>
              <b>{m.sa != null ? `${m.sa} – ${m.sb}` : `Bo${m.bo}`}</b>
              <span className={'lj-t ' + (m.sb != null && m.sb > m.sa! ? 'w' : '')}><Crest s={s} team={s.teams[m.b]} size={18} /><NomeTime s={s} id={m.b} /></span>
            </div>
          ))}
        </Fragment>
      ))}
    </div>
  );
}
