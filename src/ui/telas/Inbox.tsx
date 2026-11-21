import { useEffect, useState } from 'react';
import { resolver } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import { act, useGame } from '../../store';
import { GameTag } from '../common';

const ICO: Record<string, string> = { diretoria: '🏛', tecnico: '📋', financas: '💰', patrocinio: '🤝', jogo: '🎮', noticia: '📰', peneira: '🔎' };

export function Inbox({ abrir }: { abrir?: string }) {
  const s = useGame()!;
  const [sel, setSel] = useState<string | undefined>(abrir ?? s.inbox.find(m => m.acoes && !m.resolvida)?.id ?? s.inbox[0]?.id);
  const [retorno, setRetorno] = useState('');
  const m = s.inbox.find(x => x.id === sel);
  useEffect(() => { if (m && !m.lida) act(() => { m.lida = true; }); }, [sel]);
  useEffect(() => { if (abrir) setSel(abrir); }, [abrir]);

  return (
    <div className={'inbox ' + (sel ? 'aberto' : '')}>
      <ul className="ib-list">
        {s.inbox.map(x => (
          <li key={x.id} className={(x.id === sel ? 'on ' : '') + (x.lida ? '' : 'nova ') + (x.acoes && !x.resolvida ? 'acao' : '')} onClick={() => { setSel(x.id); setRetorno(''); }}>
            <span className="ib-ico">{ICO[x.cat]}</span>
            <span className="ib-t"><b>{x.titulo}</b><small>{x.de} · {fmtData(x.dia, false)}</small></span>
            {x.acoes && !x.resolvida && <span className="pill acao">decisão</span>}
          </li>
        ))}
      </ul>
      <article className="ib-msg">
        {m ? (
          <>
            <button className="link voltar" onClick={() => setSel(undefined)}>← Mensagens</button>
            <header>
              <span className="ib-ico big">{ICO[m.cat]}</span>
              <div><h2>{m.titulo}</h2><small>{m.de} · {m.cargo} · {fmtData(m.dia)}</small></div>
              {m.game && <GameTag g={m.game} />}
            </header>
            <div className="ib-body">{m.corpo.split('\n').map((p, i) => (p ? <p key={i}>{p}</p> : <br key={i} />))}</div>
            {m.acoes && (
              <div className="ib-acoes">
                {m.resolvida ? <span className="mut">Decisão: {m.resolvida === 'expirou' ? 'a proposta expirou' : m.acoes.find(a => a.id === m.resolvida)?.txt}</span> :
                  m.acoes.map(a => <button key={a.id} className={'btn ' + (a.tipo === 'bom' ? 'primary' : a.tipo === 'ruim' ? 'ghost' : '')} onClick={() => setRetorno(act(st => resolver(st, m.id, a.id)))}>{a.txt}</button>)}
              </div>
            )}
            {retorno && <div className="retorno">{retorno}</div>}
          </>
        ) : <p className="mut">Nenhuma mensagem selecionada.</p>}
      </article>
    </div>
  );
}
