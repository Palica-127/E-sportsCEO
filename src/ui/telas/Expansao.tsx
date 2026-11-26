import { CSSProperties, useState } from 'react';
import { GAMES, GAME_IDS, GameId, regioes } from '../../engine/games';
import { CUSTO_ACADEMY, abrirAcademy, academyDe, camas, fecharAcademy, moradores, podeAbrirAcademy } from '../../engine/academy';
import { MAX_JOGOS, MODOS, ModoEntrada, entrarNoJogo, estreia, opcoesCompra, pendencias, prepararJogo, preco, repMinima } from '../../engine/expansao';
import { moeda } from '../../engine/org';
import { fmtData, ligaDoTime } from '../../engine/sim';
import { forca } from '../../engine/world';
import { act, useGame } from '../../store';
import { Crest, Panel } from '../common';

/** painel de modalidades: os 8 jogos, entrada em jogo novo e Academies */
export function Modalidades() {
  const s = useGame()!;
  const [novo, setNovo] = useState<GameId | null>(null);
  const [aviso, setAviso] = useState('');
  return (
    <>
      <Panel title={`Modalidades (${s.jogos.length}/${MAX_JOGOS})`} right={<span className="mut">Próximo jogo pede reputação {repMinima(s)} · {moradores(s)}/{camas(s)} camas na sede</span>}>
        {aviso && <div className="alerta ok" style={{ marginBottom: 10 }}><b>!</b>{aviso}</div>}
        <div className="modal-grid">
          {GAME_IDS.map(g => {
            const tem = s.jogos.includes(g);
            const t = tem ? s.teams[s.orgTeams[g]!] : null;
            const ac = academyDe(s, g);
            const errAc = tem ? podeAbrirAcademy(s, g) : null;
            return (
              <div key={g} className={'mod-card ' + (tem ? 'tem' : '')} style={{ '--g': GAMES[g].cor } as CSSProperties}>
                <div className="mc-h"><span className="gtag">{GAMES[g].curto}</span><b>{GAMES[g].nome}</b></div>
                {t ? (
                  <>
                    <div className="mc-t"><Crest link={false} s={s} team={t} size={34} /><div><b>{t.nome}</b><small>{ligaDoTime(s, t.id).nome} · força {forca(s, t).toFixed(1)}</small></div></div>
                    <div className="mc-ac">
                      {ac ? (
                        <>
                          <div className="mc-t"><Crest link={false} s={s} team={ac} size={26} /><div><b>{ac.nome}</b><small>{ligaDoTime(s, ac.id).nome} · {ac.elenco.length} jovens</small></div></div>
                          <button className="btn ghost sm" onClick={() => { if (confirm('Vender a vaga da Academy? Os jovens ficam livres.')) act(st => fecharAcademy(st, g, 'ceo')); }}>Fechar</button>
                        </>
                      ) : (
                        <>
                          <small className="mut">{errAc ?? `Academy na Challengers: ${moeda(CUSTO_ACADEMY)}`}</small>
                          <button className="btn sm" disabled={!!errAc} onClick={() => { const e = act(st => abrirAcademy(st, g)); setAviso(e ?? `Academy de ${GAMES[g].curto} aberta!`); }}>Abrir Academy</button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mc-novo">
                    <small className="mut">A org ainda não está aqui.</small>
                    <button className="btn primary sm" onClick={() => { act(st => prepararJogo(st, g)); setNovo(g); }}>Entrar no {GAMES[g].curto}</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
      {novo && <Entrada g={novo} onFechar={(msg) => { setNovo(null); if (msg) setAviso(msg); }} />}
    </>
  );
}

function Entrada({ g, onFechar }: { g: GameId; onFechar: (msg?: string) => void }) {
  const s = useGame()!;
  const regs = regioes(g);
  const [reg, setReg] = useState(regs.find(r => /BR|CBLOL|Brasil|AM|SA/i.test(r.id + r.nome))?.id ?? regs[0].id);
  const [modo, setModo] = useState<ModoEntrada>('compra');
  const [time, setTime] = useState<string | undefined>();
  const ops = opcoesCompra(s, g, reg, modo);
  const p = preco(s, g, reg, modo, time);
  const pend = pendencias(s, g, reg, modo, time);
  const dEst = estreia(s, g);
  function confirmar() {
    const e = act(st => entrarNoJogo(st, g, reg, modo, time));
    if (e) return;
    onFechar(modo === 'zero' ? undefined : `Bem-vindos ao ${GAMES[g].nome}! Estreia em ${fmtData(dEst, false)}.`);
  }
  return (
    <div className="overlay">
      <div className="modal largo2" style={{ '--g': GAMES[g].cor } as CSSProperties}>
        <h2><span className="gtag">{GAMES[g].curto}</span> Entrar no {GAMES[g].nome}</h2>
        <p className="mut">O time estreia no próximo split ({fmtData(dEst, false)}). Até lá é pré-temporada. Um técnico é contratado junto.</p>
        <label className="lbl">Região</label>
        <div className="reg-row">{regs.map(r => <button key={r.id} className={'chip ' + (r.id === reg ? 'on' : '')} onClick={() => { setReg(r.id); setTime(undefined); }}>{r.nome}<small>{r.regiao}</small></button>)}</div>
        <label className="lbl">Forma de entrada</label>
        <div className="modos">
          {(Object.keys(MODOS) as ModoEntrada[]).map(k => (
            <button key={k} className={'modo ' + (modo === k ? 'on' : '')} onClick={() => { setModo(k); setTime(undefined); }}>
              <b>{MODOS[k].nome}</b><span>{MODOS[k].desc}</span>{k === 'zero' && <small>{moeda(preco(s, g, reg, 'zero'))} + peneira</small>}
            </button>
          ))}
        </div>
        {modo !== 'zero' && (
          <>
            <label className="lbl">Time</label>
            <div className="team-list exp">
              {ops.map(t => (
                <button key={t.id} className={'team-row ' + (t.id === time ? 'on' : '')} onClick={() => setTime(t.id)}>
                  <Crest link={false} s={s} team={t} size={30} /><b>{t.nome}</b><small>{t.tier === 1 ? 'Elite' : 'Challengers'} · força {forca(s, t).toFixed(1)}</small><span>{moeda(preco(s, g, reg, modo, t.id))}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <div className="exp-res">
          <div><span>Preço</span><b>{moeda(p)}</b></div>
          <div><span>Caixa depois</span><b className={s.org.caixa - p < 0 ? 'neg' : ''}>{moeda(s.org.caixa - p)}</b></div>
          <div><span>Estreia</span><b>{fmtData(dEst, false)}</b></div>
        </div>
        {pend.length > 0 && <ul className="pend">{pend.map(x => <li key={x}>✗ {x}</li>)}</ul>}
        <div className="modal-f">
          <button className="btn ghost" onClick={() => onFechar()}>Cancelar</button>
          <button className="btn primary big" disabled={pend.length > 0} onClick={confirmar}>{modo === 'zero' ? 'Comprar vaga e ir para a peneira' : 'Fechar negócio'}</button>
        </div>
      </div>
    </div>
  );
}
