import { CSSProperties, useState } from 'react';
import { GAMES, GameId } from '../../engine/games';
import { anoDe, splitAtual, tabela, vagasPlayoff } from '../../engine/sim';
import type { Match } from '../../engine/types';
import { forca } from '../../engine/world';
import { useGame } from '../../store';
import { Crest, Ult } from '../common';
import type { Tela } from '../Shell';

export function Competicoes({ ir }: { ir: (t: Tela, a?: string) => void }) {
  const s = useGame()!;
  const [lid, setLid] = useState<string>(() => {
    const g = s.jogos[0];
    return Object.values(s.leagues).find(l => l.teams.includes(s.orgTeams[g]!))!.id;
  });
  const L = s.leagues[lid];
  const [split, setSplit] = useState(splitAtual(s.dia));
  const [aba, setAba] = useState<'tab' | 'jogos' | 'po' | 'hist'>('tab');
  const g = L.game;
  const ligas = Object.values(s.leagues).filter(l => l.game === g);
  const ano = anoDe(s.dia);
  const ms = Object.values(s.matches).filter(m => m.league === lid && m.split === split && anoDe(m.dia) === ano);
  const tab = tabela(s, lid, split);
  const vagas = vagasPlayoff(tab.length);
  const trocaJogo = (x: GameId) => { const l = Object.values(s.leagues).find(l => l.teams.includes(s.orgTeams[x]!))!; setLid(l.id); };

  return (
    <div className="comp" style={{ '--g': GAMES[g].cor } as CSSProperties}>
      <div className="tabs">{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} style={{ '--g': GAMES[x].cor } as CSSProperties} onClick={() => trocaJogo(x)}>{GAMES[x].nome}</button>)}</div>
      <div className="comp-h">
        <select value={lid} onChange={e => setLid(e.target.value)}>
          {ligas.map(l => <option key={l.id} value={l.id}>{l.nome}{l.teams.some(id => s.teams[id].org) ? ' ★' : ''}</option>)}
        </select>
        <div className="chips">{[1, 2, 3].map(n => <button key={n} className={'chip sm ' + (n === split ? 'on' : '')} onClick={() => setSplit(n)}>Split {n}</button>)}</div>
        <div className="chips">{([['tab', 'Tabela'], ['jogos', 'Jogos'], ['po', 'Playoffs'], ['hist', 'Campeões']] as const).map(([k, n]) => <button key={k} className={'chip sm ' + (aba === k ? 'on' : '')} onClick={() => setAba(k)}>{n}</button>)}</div>
      </div>

      {aba === 'tab' && (
        <section className="panel">
          <table className="tab">
            <thead><tr><th>#</th><th className="tm">Time</th><th>J</th><th>V</th><th>D</th><th>Mapas</th><th className="hide-sm">Últimos</th><th className="hide-sm">Força</th></tr></thead>
            <tbody>{tab.map(l => (
              <tr key={l.team.id} className={(l.team.org ? 'org ' : '') + (l.pos <= vagas ? 'po' : '')}>
                <td className="pos">{l.pos}</td>
                <td className="tm"><Crest s={s} team={l.team} size={24} />{l.team.nome}</td>
                <td>{l.j}</td><td><b>{l.v}</b></td><td>{l.d}</td><td>{l.mp}–{l.mc}</td>
                <td className="hide-sm"><Ult r={l.team.ult} /></td><td className="hide-sm">{forca(s, l.team).toFixed(1)}</td>
              </tr>
            ))}</tbody>
          </table>
          <p className="mut foot">Os {vagas} primeiros vão aos playoffs.{L.tier === 1 ? ' O pior do ano (somando os 3 splits) cai para a Challengers.' : ' O campeão do split 3 sobe para a elite.'}</p>
        </section>
      )}

      {aba === 'jogos' && <Rodadas ms={ms.filter(m => m.fase === 'reg')} />}
      {aba === 'po' && <Bracket ms={ms.filter(m => m.fase !== 'reg')} />}
      {aba === 'hist' && (
        <section className="panel">
          <table className="tab">
            <thead><tr><th>Ano</th><th>Split</th><th className="tm">Campeão</th><th className="tm">Vice</th></tr></thead>
            <tbody>{s.hist.filter(h => h.league === lid).slice().reverse().map((h, i) => <tr key={i} className={h.org ? 'org' : ''}><td>{h.ano}</td><td>{h.split}</td><td className="tm">🏆 {h.campeao}</td><td className="tm">{h.vice}</td></tr>)}</tbody>
          </table>
          {!s.hist.some(h => h.league === lid) && <p className="mut foot">Ainda sem campeões nesta carreira.</p>}
        </section>
      )}
    </div>
  );
}

function Rodadas({ ms }: { ms: Match[] }) {
  const s = useGame()!;
  const por: Record<number, Match[]> = {};
  for (const m of ms) (por[m.rodada] ??= []).push(m);
  const rods = Object.keys(por).map(Number).sort((a, b) => a - b);
  if (!rods.length) return <p className="mut">A agenda deste split ainda não saiu.</p>;
  return (
    <div className="rodadas">
      {rods.map(r => (
        <section key={r} className="panel">
          <header className="panel-h"><h3>Rodada {r}</h3></header>
          <div className="panel-b">
            {por[r].map(m => (
              <div key={m.id} className={'ro ' + (s.teams[m.a].org || s.teams[m.b].org ? 'org' : '')}>
                <span className={m.sa != null && m.sa > m.sb! ? 'w' : ''}>{s.teams[m.a].sigla}<Crest s={s} team={s.teams[m.a]} size={18} /></span>
                <b>{m.sa != null ? `${m.sa}–${m.sb}` : 'vs'}</b>
                <span className={m.sb != null && m.sb > m.sa! ? 'w' : ''}><Crest s={s} team={s.teams[m.b]} size={18} />{s.teams[m.b].sigla}</span>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Bracket({ ms }: { ms: Match[] }) {
  const s = useGame()!;
  if (!ms.length) return <p className="mut">Os playoffs começam quando a fase regular terminar.</p>;
  const col = (f: string, nome: string) => {
    const xs = ms.filter(m => m.fase === f).sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));
    if (!xs.length) return null;
    return (
      <div className="br-col"><h4>{nome}</h4>
        {xs.map(m => (
          <div key={m.id} className="br-m">
            {(['a', 'b'] as const).map(l => {
              const t = s.teams[l === 'a' ? m.a : m.b];
              const sc = l === 'a' ? m.sa : m.sb, ot = l === 'a' ? m.sb : m.sa;
              return <div key={l} className={'br-t ' + (t.org ? 'org ' : '') + (sc != null && sc > ot! ? 'w' : '')}><Crest s={s} team={t} size={20} /><span>{t.nome}</span><b>{sc ?? ''}</b></div>;
            })}
          </div>
        ))}
      </div>
    );
  };
  return <div className="bracket">{col('qf', 'Quartas')}{col('sf', 'Semifinais')}{col('f', 'Final')}</div>;
}
