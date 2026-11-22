import { CSSProperties, useState } from 'react';
import { GAMES } from '../engine/games';
import { fmtData, isOrg, jogarDia, jogosDoDia } from '../engine/sim';
import { act, useGame } from '../store';
import { Crest } from './common';
import { Resumo } from './Resumo';
import { PreDados, PreJogo, preDados } from './PreJogo';

/** dia de jogo: para cada partida da org, a tela de pré-jogo (stats, confrontos, chances) e a escolha entre assistir ou simular */
export function DiaDeJogo({ onFechar }: { onFechar: () => void }) {
  const s = useGame()!;
  const jaJogou = s.diaJogo?.dia === s.dia;
  const [fase, setFase] = useState<'pre' | 'play' | 'res'>(jaJogou ? 'res' : 'pre');
  const [idx, setIdx] = useState(0);
  const [assistir, setAssistir] = useState(true);
  // o pré-jogo de todas as partidas é calculado antes de simular, para a 2ª não mostrar o resultado
  const [pre] = useState<PreDados[]>(() => (jaJogou ? [] : jogosDoDia(s, s.dia).filter(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b))).map(m => preDados(s, m))));
  const [ids, setIds] = useState<string[]>(jaJogou ? s.diaJogo!.ids : pre.map(d => d.id));

  function escolher(ver: boolean) {
    if (s.diaJogo?.dia !== s.dia) { const ms = act(st => jogarDia(st)); if (idx === 0) setIds(ms.map(m => m.id)); }
    setAssistir(ver);
    setFase('play');
  }
  function proxima() {
    if (idx + 1 < pre.length) { setIdx(idx + 1); setFase('pre'); } else setFase('res');
  }
  const atual = pre[idx] ? s.matches[pre[idx].id] : null;

  return (
    <div className="overlay">
      <div className={'modal dia ' + (fase === 'pre' ? 'largo' : '')}>
        {fase === 'pre' && atual && (
          <PreJogo s={s} m={atual} d={pre[idx]} n={idx + 1} total={pre.length}
            onAssistir={() => escolher(true)} onSimular={() => escolher(false)} onDepois={idx === 0 && !jaJogou && s.diaJogo?.dia !== s.dia ? onFechar : undefined} />
        )}
        {fase === 'play' && atual && (
          <>
            {pre.length > 1 && <div className="play-count">Partida {idx + 1} de {pre.length}</div>}
            <Resumo key={atual.id + (assistir ? 'v' : 's')} s={s} m={atual} auto={assistir} onFim={proxima} />
          </>
        )}
        {fase === 'res' && <Resultados ids={ids} onFechar={onFechar} />}
      </div>
    </div>
  );
}

function Resultados({ ids, onFechar }: { ids: string[]; onFechar: () => void }) {
  const s = useGame()!;
  const [rever, setRever] = useState<string | null>(null);
  const org = ids.map(id => s.matches[id]).filter(Boolean);
  const ligas = new Set(org.map(m => m.tor));
  const academy = jogosDoDia(s, s.dia).filter(m => m.sa != null && (s.teams[m.a].acad || s.teams[m.b].acad));
  const outros = jogosDoDia(s, s.dia).filter(m => !ids.includes(m.id) && m.sa != null && ligas.has(m.tor) && !academy.includes(m));
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
      {academy.length > 0 && (
        <>
          <h4 className="sub">Academy</h4>
          <div className="res-outros">
            {academy.map(m => (
              <div key={m.id} className="ro">
                <span className={m.sa! > m.sb! ? 'w' : ''}><Crest s={s} team={s.teams[m.a]} size={20} />{s.teams[m.a].sigla}</span>
                <b>{m.sa}–{m.sb}</b>
                <span className={m.sb! > m.sa! ? 'w' : ''}>{s.teams[m.b].sigla}<Crest s={s} team={s.teams[m.b]} size={20} /></span>
              </div>
            ))}
          </div>
        </>
      )}
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
