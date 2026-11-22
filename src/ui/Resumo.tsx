import { CSSProperties, useEffect, useRef, useState } from 'react';
import { GAMES } from '../engine/games';
import type { MapDet, Match, State } from '../engine/types';
import { Crest } from './common';

export const nomeFase = (m: Match) => m.label;
const ehFinal = (m: Match) => m.k === 'gf' || m.k === 'f';

/** resumo animado de ~30 s da série; termina mostrando o placar final e o MVP */
export function Resumo({ s, m, onFim, auto = true }: { s: State; m: Match; onFim?: () => void; auto?: boolean }) {
  const maps = m.det ?? [];
  const [mi, setMi] = useState(auto ? 0 : maps.length); // mapa atual (== length: terminou)
  const [prog, setProg] = useState(0);
  const [vel, setVel] = useState(1);
  const raf = useRef(0);
  const porMapa = Math.max(8000, 30000 / Math.max(1, maps.length));

  useEffect(() => {
    if (mi >= maps.length) return;
    let t0 = performance.now(), p0 = prog;
    const tick = (t: number) => {
      const p = Math.max(0, Math.min(1, p0 + (Math.max(0, t - t0) * vel) / porMapa));
      setProg(p);
      if (p >= 1) { setTimeout(() => { setMi(i => i + 1); setProg(0); }, 900 / vel); return; }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mi, vel]);

  const A = s.teams[m.a], B = s.teams[m.b];
  const g = GAMES[m.game];
  const fim = mi >= maps.length;
  const mapasA = maps.slice(0, fim ? maps.length : mi).filter(x => x.venc === 'a').length + (!fim && prog >= 1 && maps[mi]?.venc === 'a' ? 1 : 0);
  const mapasB = maps.slice(0, fim ? maps.length : mi).filter(x => x.venc === 'b').length + (!fim && prog >= 1 && maps[mi]?.venc === 'b' ? 1 : 0);
  const cur = fim ? null : maps[mi];
  const evs = cur ? cur.ev.filter(e => e.t <= prog) : [];
  const ult = evs[evs.length - 1];
  const sa = cur ? (prog >= 1 ? cur.sa : ult?.sa ?? 0) : 0, sb = cur ? (prog >= 1 ? cur.sb : ult?.sb ?? 0) : 0;
  const lbl = g.placar === 'moba' ? 'Abates' : g.placar === 'gols' ? 'Gols' : 'Rounds';
  const rounds = g.placar !== 'moba' && g.placar !== 'gols';
  const marca = (t: number) => (cur ? (rounds ? `R${Math.max(1, Math.round(t * (cur.sa + cur.sb)))}` : `${Math.round(t * cur.dur)}'`) : '');

  return (
    <div className="resumo" style={{ '--g': g.cor, '--ca': A.cor, '--cb': B.cor } as CSSProperties}>
      <div className="rs-top">
        <span className="rs-comp">{s.torneios[m.tor]?.nome} · {nomeFase(m)} · Bo{m.bo}</span>
        {!fim && <div className="rs-ctrl">{[1, 2, 4].map(v => <button key={v} className={'chip sm ' + (v === vel ? 'on' : '')} onClick={() => setVel(v)}>{v}x</button>)}<button className="chip sm" onClick={() => { cancelAnimationFrame(raf.current); setMi(maps.length); }}>Pular ⏭</button></div>}
      </div>
      <div className="rs-board">
        <div className={'rs-team a ' + (fim && m.sa! > m.sb! ? 'win' : '')}><Crest s={s} team={A} size={64} /><b>{A.nome}</b></div>
        <div className="rs-serie">
          <div className="rs-maps"><span>{fim ? m.sa : mapasA}</span><i>–</i><span>{fim ? m.sb : mapasB}</span></div>
          {cur && <div className="rs-live"><small>Mapa {mi + 1}{cur.mapa ? ` · ${cur.mapa}` : ''}</small><div className="rs-score"><b>{sa}</b><i>{lbl}</i><b>{sb}</b></div><small className="clock">{rounds ? `Round ${Math.max(1, Math.min(cur.sa + cur.sb, sa + sb + (prog < 1 ? 1 : 0)))}` : `${Math.floor(prog * cur.dur)}'`}</small></div>}
          {fim && <div className="rs-final">{ehFinal(m) ? '🏆 ' : ''}Final</div>}
        </div>
        <div className={'rs-team b ' + (fim && m.sb! > m.sa! ? 'win' : '')}><Crest s={s} team={B} size={64} /><b>{B.nome}</b></div>
      </div>
      {cur && (
        <>
          <div className="rs-prog"><i style={{ width: prog * 100 + '%' }} /></div>
          {cur.ouro && <Ouro det={cur} prog={prog} />}
          <ul className="rs-feed">
            {evs.slice(-6).reverse().map((e, i) => <li key={e.t + e.txt} className={(e.lado ?? '') + (i === 0 ? ' novo' : '')}><span className="min">{marca(e.t)}</span>{e.txt}</li>)}
          </ul>
        </>
      )}
      {fim && <Final s={s} m={m} onFim={onFim} />}
    </div>
  );
}

function Ouro({ det, prog }: { det: MapDet; prog: number }) {
  const W = 600, H = 70, max = Math.max(4, ...det.ouro!.map(Math.abs));
  const n = det.ouro!.length - 1;
  const lim = prog * n;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    if (i > lim) { const f = lim - Math.floor(lim); const a = det.ouro![i - 1], b = det.ouro![i]; pts.push(`${(lim / n) * W},${H / 2 - ((a + (b - a) * f) / max) * (H / 2 - 4)}`); break; }
    pts.push(`${(i / n) * W},${H / 2 - (det.ouro![i] / max) * (H / 2 - 4)}`);
  }
  const lastY = Number(pts[pts.length - 1].split(',')[1]);
  const val = ((H / 2 - lastY) / (H / 2 - 4)) * max;
  return (
    <div className="ouro">
      <span className="ouro-l">Ouro</span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="var(--line)" strokeDasharray="4 4" />
        <polyline points={pts.join(' ')} fill="none" stroke="var(--g)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className={'ouro-v ' + (val >= 0 ? 'a' : 'b')}>{val >= 0 ? '+' : '−'}{Math.abs(val).toFixed(1)}k</span>
    </div>
  );
}

function Final({ s, m, onFim }: { s: State; m: Match; onFim?: () => void }) {
  const [sel, setSel] = useState((m.det?.length ?? 1) - 1);
  const det = m.det?.[sel];
  const mvp = m.mvp ? s.players[m.mvp] : null;
  const g = GAMES[m.game];
  const moba = g.placar === 'moba';
  return (
    <div className="rs-fim">
      {mvp && <div className="mvp"><span className="mvp-l">MVP da série</span><b>{mvp.nick}</b><small>{s.teams[mvp.teamId ?? '']?.nome} · {g.roles[mvp.role]}</small></div>}
      {m.det && m.det.length > 1 && <div className="chips">{m.det.map((d, i) => <button key={i} className={'chip sm ' + (i === sel ? 'on' : '')} onClick={() => setSel(i)}>Mapa {i + 1}{d.mapa ? ` · ${d.mapa}` : ''}: {d.sa}–{d.sb}</button>)}</div>}
      {det && (
        <div className="box2">
          {(['a', 'b'] as const).map(lado => (
            <table key={lado}>
              <thead><tr><th>{s.teams[lado === 'a' ? m.a : m.b].sigla}</th><th>{moba ? 'K/D/A' : g.placar === 'gols' ? 'Placar' : 'K–D'}</th><th>{moba ? 'Nota' : g.placar === 'gols' ? '' : 'Rating'}</th></tr></thead>
              <tbody>{(lado === 'a' ? det.la : det.lb).map(l => (
                <tr key={l.pid} className={l.pid === det.mvp ? 'mvp-row' : ''}><td>{l.nick}{l.pid === det.mvp ? ' ★' : ''}</td><td>{moba ? `${l.k}/${l.d}/${l.a}` : g.placar === 'gols' ? `${l.k}–${l.d}` : `${l.k}–${l.d}`}</td><td>{moba ? l.nota.toFixed(1) : l.extra}</td></tr>
              ))}</tbody>
            </table>
          ))}
        </div>
      )}
      {onFim && <button className="btn primary" onClick={onFim}>Continuar</button>}
    </div>
  );
}
