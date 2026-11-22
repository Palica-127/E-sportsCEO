import { CSSProperties, useState } from 'react';
import { GAMES, GameId } from '../../engine/games';
import { probSerie } from '../../engine/match';
import { moeda } from '../../engine/org';
import { anoDe, fmtData, isOrg, ligaDoTime, proximosJogosOrg, torneioDaLiga, ultimosJogosOrg } from '../../engine/sim';
import { forca } from '../../engine/world';
import { useGame } from '../../store';
import { Bar, Crest, Panel, pct } from '../common';
import { Resumo } from '../Resumo';
import { TabelaLiga } from '../Bracket';
import type { Tela } from '../Shell';

export function Inicio({ ir, abrirDia }: { ir: (t: Tela, a?: string) => void; abrirDia: () => void }) {
  const s = useGame()!;
  const [rever, setRever] = useState<string | null>(null);
  const [gTab, setGTab] = useState<GameId>(s.jogos[0]);
  const agenda = proximosJogosOrg(s, 8);
  const prox = s.jogos.map(g => agenda.find(m => m.game === g)).filter(Boolean);
  const ult = ultimosJogosOrg(s, 8);
  const conf = s.diretoria.confianca;
  const tor = torneioDaLiga(s, ligaDoTime(s, s.orgTeams[gTab]!).id);

  return (
    <div className="home">
      <div className="home-next">
        {prox.length === 0 && <Panel title="Próxima partida"><p className="mut">Nenhuma partida marcada. A próxima competição começa em breve.</p></Panel>}
        {prox.map(m => {
          const A = s.teams[m!.a], B = s.teams[m!.b];
          const pa = probSerie(forca(s, A), forca(s, B), m!.bo);
          const hoje = m!.dia === s.dia;
          const meuA = isOrg(s, A.id);
          return (
            <section key={m!.id} className={'nextm ' + (hoje ? 'hoje' : '')} style={{ '--g': GAMES[m!.game].cor } as CSSProperties} onClick={hoje ? abrirDia : () => ir('competicoes', m!.tor)}>
              <div className="nm-top"><span className="gtag">{GAMES[m!.game].curto}</span><span>{s.torneios[m!.tor]?.nome}</span><span className="nm-d">{hoje ? 'HOJE' : fmtData(m!.dia)}</span></div>
              <div className="nm-body">
                <div className="nm-t"><Crest s={s} team={A} size={44} /><b>{A.nome}</b><small>Força {forca(s, A).toFixed(1)}</small></div>
                <div className="nm-c"><small>{m!.label}</small><b>VS</b><small>Melhor de {m!.bo}</small></div>
                <div className="nm-t r"><Crest s={s} team={B} size={44} /><b>{B.nome}</b><small>Força {forca(s, B).toFixed(1)}</small></div>
              </div>
              <div className="prob"><span>{pct(pa)}</span><div><i style={{ width: pa * 100 + '%' }} /></div><span>{pct(1 - pa)}</span></div>
              <div className="nm-f">Chance de vitória da {s.org.nome}: <b>{meuA ? pct(pa) : pct(1 - pa)}</b>{hoje && <span className="go">Abrir dia de jogo ›</span>}</div>
            </section>
          );
        })}
      </div>

      <div className="home-grid">
        <div className="hc">
          <Panel title="Agenda" right={<button className="link" onClick={() => ir('calendario')}>Calendário ›</button>}>
            <table className="tab dense">
              <tbody>{agenda.length ? agenda.map(m => {
                const adv = s.teams[isOrg(s, m.a) ? m.b : m.a];
                return (
                  <tr key={m.id} style={{ '--g': GAMES[m.game].cor } as CSSProperties} className="clk" onClick={() => ir('competicoes', m.tor)}>
                    <td className="dt">{fmtData(m.dia, true).replace(/ \d{4}$/, '')}</td>
                    <td><span className="gtag">{GAMES[m.game].curto}</span></td>
                    <td className="tm"><Crest s={s} team={adv} size={18} />{adv.nome}</td>
                    <td className="mut sm">{m.label}</td>
                  </tr>
                );
              }) : <tr><td className="mut">Sem jogos marcados.</td></tr>}</tbody>
            </table>
          </Panel>
          <Panel title="Resultados">
            <table className="tab dense">
              <tbody>{ult.length ? ult.map(m => {
                const meu = isOrg(s, m.a) ? 'a' : 'b';
                const adv = s.teams[meu === 'a' ? m.b : m.a];
                const venceu = (meu === 'a') === (m.sa! > m.sb!);
                const placar = meu === 'a' ? `${m.sa}–${m.sb}` : `${m.sb}–${m.sa}`;
                return (
                  <tr key={m.id} style={{ '--g': GAMES[m.game].cor } as CSSProperties} className="clk" onClick={() => m.det && setRever(m.id)}>
                    <td className="dt">{fmtData(m.dia, false).replace(/ \d{4}$/, '')}</td>
                    <td><span className="gtag">{GAMES[m.game].curto}</span></td>
                    <td className="tm"><Crest s={s} team={adv} size={18} />{adv.nome}</td>
                    <td><b className="num">{placar}</b></td>
                    <td><span className={'pill ' + (venceu ? 'v' : 'd')}>{venceu ? 'V' : 'D'}</span></td>
                  </tr>
                );
              }) : <tr><td className="mut">Nenhuma partida jogada ainda.</td></tr>}</tbody>
            </table>
          </Panel>
        </div>

        <div className="hc">
          <Panel g={gTab} title={<>{tor ? tor.nome : 'Liga'}</>} right={<div className="seg sm">{s.jogos.map(x => <button key={x} className={x === gTab ? 'on' : ''} style={{ '--g': GAMES[x].cor } as CSSProperties} onClick={() => setGTab(x)}>{GAMES[x].curto}</button>)}</div>}>
            {tor ? <TabelaLiga s={s} tor={tor} compacta /> : <p className="mut">A liga começa no primeiro split.</p>}
            {tor && <button className="link" onClick={() => ir('competicoes', tor.id)}>Ver competição ›</button>}
          </Panel>
        </div>

        <div className="hc">
          <Panel title="Diretoria">
            <div className="dir">
              <small>Meta da temporada {anoDe(s.dia)}</small>
              <b>{s.diretoria.meta}</b>
              <div className="conf"><span>Confiança</span><Bar v={conf} /><b>{Math.round(conf)}%</b></div>
            </div>
          </Panel>
          <Panel title="Mensagens" right={<button className="link" onClick={() => ir('inbox')}>Todas ›</button>}>
            <ul className="msg-mini">
              {s.inbox.slice(0, 5).map(m => (
                <li key={m.id} className={(m.lida ? '' : 'nova ') + (m.acoes && !m.resolvida ? 'acao' : '')} onClick={() => ir('inbox', m.id)}>
                  <b>{m.titulo}</b><small>{m.de} · {fmtData(m.dia, false)}</small>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Organização">
            <div className="kv"><span>Caixa</span><b className={s.org.caixa < 0 ? 'neg' : ''}>{moeda(s.org.caixa)}</b></div>
            <div className="kv"><span>Reputação</span><b>{Math.round(s.org.rep)}/100</b></div>
            <div className="kv"><span>Seguidores</span><b>{s.org.fas.toLocaleString('pt-BR')}</b></div>
            <div className="kv"><span>Patrocinadores</span><b>{s.patro.length}/3</b></div>
          </Panel>
          {(s.noticiasDia?.length ?? 0) > 0 && (
            <Panel title="Notícias">
              <ul className="news">{s.noticiasDia!.slice(-7).reverse().map((n, i) => <li key={i}>{n}</li>)}</ul>
            </Panel>
          )}
        </div>
      </div>
      {rever && <div className="overlay" onClick={e => e.target === e.currentTarget && setRever(null)}><div className="modal dia"><Resumo s={s} m={s.matches[rever]} auto={false} onFim={() => setRever(null)} /></div></div>}
    </div>
  );
}
