import { CSSProperties, useState } from 'react';
import { GAMES } from '../../engine/games';
import { anoDe, dataDe, isOrg, nomeMes } from '../../engine/sim';
import { calendario, inicioAno, nomeIntl } from '../../engine/comp';
import type { Match } from '../../engine/types';
import { useGame } from '../../store';
import { Crest } from '../common';
import { Resumo, nomeFase } from '../Resumo';

const BASE = Date.UTC(2027, 0, 4);

export function Calendario() {
  const s = useGame()!;
  const hoje = dataDe(s.dia);
  const [ym, setYm] = useState({ y: hoje.getUTCFullYear(), m: hoje.getUTCMonth() });
  const [rever, setRever] = useState<string | null>(null);
  const primeiro = Date.UTC(ym.y, ym.m, 1);
  const diasMes = new Date(Date.UTC(ym.y, ym.m + 1, 0)).getUTCDate();
  const offset = (new Date(primeiro).getUTCDay() + 6) % 7;
  const diaIdx = (d: number) => Math.round((Date.UTC(ym.y, ym.m, d) - BASE) / 86400000);
  const porDia: Record<number, Match[]> = {};
  for (const m of Object.values(s.matches)) if (isOrg(s, m.a) || isOrg(s, m.b)) (porDia[m.dia] ??= []).push(m);
  const evs: Record<number, { g: string; txt: string }[]> = {};
  for (const a of [ym.y - 1, ym.y, ym.y + 1]) if (a >= 2027) for (const g of s.jogos) for (const e of calendario(g)) (evs[inicioAno(a) + e.d] ??= []).push({ g, txt: e.kind === 'split' ? `Split ${e.split}` : nomeIntl(g, e.kind) });
  void anoDe;
  const mudar = (k: number) => { const d = new Date(Date.UTC(ym.y, ym.m + k, 1)); setYm({ y: d.getUTCFullYear(), m: d.getUTCMonth() }); };
  const doMes = Array.from({ length: diasMes }, (_, i) => porDia[diaIdx(i + 1)] ?? []).flat().sort((a, b) => a.dia - b.dia);

  return (
    <div className="cal">
      <div className="cal-h">
        <button className="btn ghost sm" onClick={() => mudar(-1)}>‹</button>
        <h2>{nomeMes(ym.m)} {ym.y}</h2>
        <button className="btn ghost sm" onClick={() => mudar(1)}>›</button>
        <div className="legend">{s.jogos.map(g => <span key={g} className="gtag" style={{ '--g': GAMES[g].cor } as CSSProperties}>{GAMES[g].curto}</span>)}</div>
      </div>
      <div className="cal-grid">
        {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(d => <div key={d} className="cal-wd">{d}</div>)}
        {Array.from({ length: offset }, (_, i) => <div key={'e' + i} className="cal-d vazio" />)}
        {Array.from({ length: diasMes }, (_, i) => {
          const di = diaIdx(i + 1);
          const ms = porDia[di] ?? [];
          return (
            <div key={i} className={'cal-d ' + (di === s.dia ? 'hoje ' : '') + (di < s.dia ? 'passou' : '')}>
              <span className="n">{i + 1}</span>
              {(evs[di] ?? []).map((e, k) => <span key={k} className="cal-ev" style={{ '--g': GAMES[e.g as keyof typeof GAMES].cor } as CSSProperties}>{e.txt}</span>)}
              {ms.map(m => {
                const meuA = isOrg(s, m.a);
                const adv = s.teams[meuA ? m.b : m.a];
                const jogado = m.sa != null;
                const venceu = jogado && (meuA ? m.sa! > m.sb! : m.sb! > m.sa!);
                return (
                  <button key={m.id} className={'cal-m ' + (jogado ? (venceu ? 'v' : 'd') : '')} style={{ '--g': GAMES[m.game].cor } as CSSProperties} onClick={() => m.det && setRever(m.id)}>
                    <Crest s={s} team={adv} size={16} /><span>{adv.sigla}</span>{jogado && <b>{meuA ? `${m.sa}-${m.sb}` : `${m.sb}-${m.sa}`}</b>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="cal-lista">
        {doMes.map(m => {
          const meuA = isOrg(s, m.a);
          return (
            <div key={m.id} className="cl-row" style={{ '--g': GAMES[m.game].cor } as CSSProperties} onClick={() => m.det && setRever(m.id)}>
              <span className="gtag">{GAMES[m.game].curto}</span>
              <span className="cl-d">{dataDe(m.dia).getUTCDate()}/{dataDe(m.dia).getUTCMonth() + 1}</span>
              <span className="cl-t"><Crest s={s} team={s.teams[meuA ? m.b : m.a]} size={20} />{meuA ? 'vs' : '@'} {s.teams[meuA ? m.b : m.a].nome}</span>
              <span className="cl-f">{nomeFase(m)}</span>
              <b>{m.sa != null ? (meuA ? `${m.sa}–${m.sb}` : `${m.sb}–${m.sa}`) : ''}</b>
            </div>
          );
        })}
      </div>
      {rever && <div className="overlay" onClick={e => e.target === e.currentTarget && setRever(null)}><div className="modal dia"><Resumo s={s} m={s.matches[rever]} auto={false} onFim={() => setRever(null)} /></div></div>}
    </div>
  );
}
