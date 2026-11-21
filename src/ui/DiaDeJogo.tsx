import { CSSProperties, useState } from 'react';
import { GAMES } from '../engine/games';
import { probSerie } from '../engine/match';
import { fmtData, isOrg, jogarDia, jogosDoDia } from '../engine/sim';
import type { Match } from '../engine/types';
import { forca } from '../engine/world';
import { act, useGame } from '../store';
import { Crest, pct } from './common';
import { Resumo, nomeFase } from './Resumo';

/** tela do dia de jogo: antes, durante (resumos) e depois (resultados de todos os jogos da org) */
export function DiaDeJogo({ onFechar }: { onFechar: () => void }) {
  const s = useGame()!;
  const [fase, setFase] = useState<'pre' | 'play' | 'res'>(s.diaJogo?.dia === s.dia ? 'res' : 'pre');
  const [idx, setIdx] = useState(0);
  const [ids, setIds] = useState<string[]>(s.diaJogo?.dia === s.dia ? s.diaJogo.ids : []);
  const hoje = jogosDoDia(s, s.dia);
  const daOrg = fase === 'pre' ? hoje.filter(m => isOrg(s, m.a) || isOrg(s, m.b)) : ids.map(id => s.matches[id]);

  function jogar() {
    const ms = act(st => jogarDia(st));
    setIds(ms.map(m => m.id));
    setIdx(0);
    setFase('play');
  }

  return (
    <div className="overlay">
      <div className="modal dia">
        {fase === 'pre' && (
          <>
            <h2>Dia de jogo <small>{fmtData(s.dia)}</small></h2>
            <div className="pre-list">
              {daOrg.map(m => <Confronto key={m.id} m={m} />)}
            </div>
            <div className="modal-f"><button className="btn ghost" onClick={onFechar}>Depois</button><button className="btn primary big" onClick={jogar}>Jogar {daOrg.length > 1 ? `as ${daOrg.length} partidas` : 'a partida'}</button></div>
          </>
        )}
        {fase === 'play' && daOrg[idx] && (
          <>
            {daOrg.length > 1 && <div className="play-count">Partida {idx + 1} de {daOrg.length}</div>}
            <Resumo key={daOrg[idx].id} s={s} m={daOrg[idx]} onFim={() => (idx + 1 < daOrg.length ? setIdx(idx + 1) : setFase('res'))} />
          </>
        )}
        {fase === 'res' && <Resultados ids={ids} onFechar={onFechar} />}
      </div>
    </div>
  );
}

function Confronto({ m }: { m: Match }) {
  const s = useGame()!;
  const A = s.teams[m.a], B = s.teams[m.b];
  const pa = probSerie(forca(s, A), forca(s, B), m.bo);
  return (
    <div className="confronto" style={{ '--g': GAMES[m.game].cor } as CSSProperties}>
      <div className="cf-top"><span className="gtag">{GAMES[m.game].curto}</span>{s.leagues[m.league].nome} · {nomeFase(m)} · Bo{m.bo}</div>
      <div className="cf-row">
        <span className="cf-t"><Crest s={s} team={A} size={44} /><b>{A.nome}</b><small>Força {forca(s, A).toFixed(1)}</small></span>
        <span className="vs">VS</span>
        <span className="cf-t r"><Crest s={s} team={B} size={44} /><b>{B.nome}</b><small>Força {forca(s, B).toFixed(1)}</small></span>
      </div>
      <div className="prob"><span>{pct(pa)}</span><div><i style={{ width: pa * 100 + '%' }} /></div><span>{pct(1 - pa)}</span></div>
    </div>
  );
}

function Resultados({ ids, onFechar }: { ids: string[]; onFechar: () => void }) {
  const s = useGame()!;
  const [rever, setRever] = useState<string | null>(null);
  const org = ids.map(id => s.matches[id]).filter(Boolean);
  const ligas = new Set(org.map(m => m.league));
  const outros = jogosDoDia(s, s.dia).filter(m => !ids.includes(m.id) && m.sa != null && ligas.has(m.league));
  if (rever) return <Resumo s={s} m={s.matches[rever]} onFim={() => setRever(null)} auto={false} />;
  return (
    <>
      <h2>Resultados do dia <small>{fmtData(s.dia)}</small></h2>
      <div className="res-org">
        {org.map(m => {
          const meu = isOrg(s, m.a) ? 'a' : 'b';
          const venceu = (meu === 'a') === (m.sa! > m.sb!);
          return (
            <button key={m.id} className={'res-card ' + (venceu ? 'v' : 'd')} style={{ '--g': GAMES[m.game].cor } as CSSProperties} onClick={() => setRever(m.id)}>
              <span className="gtag">{GAMES[m.game].curto}</span>
              <span className="rc-t"><Crest s={s} team={s.teams[m.a]} size={36} />{s.teams[m.a].sigla}</span>
              <span className="rc-s">{m.sa}–{m.sb}</span>
              <span className="rc-t">{s.teams[m.b].sigla}<Crest s={s} team={s.teams[m.b]} size={36} /></span>
              <span className={'rc-r ' + (venceu ? 'v' : 'd')}>{venceu ? 'VITÓRIA' : 'DERROTA'}</span>
              {m.mvp && <small>MVP: {s.players[m.mvp]?.nick}</small>}
            </button>
          );
        })}
      </div>
      {outros.length > 0 && (
        <>
          <h4 className="sub">Outros jogos das suas ligas</h4>
          <div className="res-outros">
            {outros.map(m => (
              <div key={m.id} className="ro">
                <span className={m.sa! > m.sb! ? 'w' : ''}><Crest s={s} team={s.teams[m.a]} size={20} />{s.teams[m.a].sigla}</span>
                <b>{m.sa}–{m.sb}</b>
                <span className={m.sb! > m.sa! ? 'w' : ''}>{s.teams[m.b].sigla}<Crest s={s} team={s.teams[m.b]} size={20} /></span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="modal-f"><span className="mut">Clique num resultado seu para rever o resumo.</span><button className="btn primary big" onClick={onFechar}>OK</button></div>
    </>
  );
}
