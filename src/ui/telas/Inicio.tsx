import { CSSProperties, useState } from 'react';
import { GAMES } from '../../engine/games';
import { probSerie } from '../../engine/match';
import { moeda } from '../../engine/org';
import { anoDe, fmtData, isOrg, proximosJogosOrg, splitAtual, tabela, ultimosJogosOrg } from '../../engine/sim';
import { forca } from '../../engine/world';
import { useGame } from '../../store';
import { Bar, Crest, Panel, pct } from '../common';
import { Resumo, nomeFase } from '../Resumo';
import type { Tela } from '../Shell';

export function Inicio({ ir, abrirDia }: { ir: (t: Tela, a?: string) => void; abrirDia: () => void }) {
  const s = useGame()!;
  const [rever, setRever] = useState<string | null>(null);
  const prox = s.jogos.map(g => proximosJogosOrg(s, 30).find(m => m.game === g)).filter(Boolean);
  const ult = ultimosJogosOrg(s, 6);
  const msgs = s.inbox.slice(0, 5);
  const conf = s.diretoria.confianca;

  return (
    <div className="grid-home">
      <div className="col-main">
        <div className="next-row">
          {prox.length === 0 && <Panel title="Próximas partidas"><p className="mut">Sem partidas marcadas. O próximo split começa em breve: aperte Continuar.</p></Panel>}
          {prox.map(m => {
            const A = s.teams[m!.a], B = s.teams[m!.b];
            const pa = probSerie(forca(s, A), forca(s, B), m!.bo);
            const meuA = isOrg(s, A.id);
            const hoje = m!.dia === s.dia;
            return (
              <section key={m!.id} className={'next ' + (hoje ? 'hoje' : '')} style={{ '--g': GAMES[m!.game].cor } as CSSProperties} onClick={hoje ? abrirDia : undefined}>
                <div className="nx-h"><span className="gtag">{GAMES[m!.game].curto}</span><span>{hoje ? 'HOJE' : fmtData(m!.dia)}</span></div>
                <div className="nx-teams">
                  <span><Crest s={s} team={A} size={54} /><b>{A.sigla}</b></span>
                  <i>VS</i>
                  <span><Crest s={s} team={B} size={54} /><b>{B.sigla}</b></span>
                </div>
                <div className="nx-c">{s.leagues[m!.league].nome} · {nomeFase(m!)} · Bo{m!.bo}</div>
                <div className="prob"><span>{pct(pa)}</span><div><i style={{ width: pa * 100 + '%' }} /></div><span>{pct(1 - pa)}</span></div>
                <small className="mut">Chance de vitória {meuA ? pct(pa) : pct(1 - pa)}</small>
              </section>
            );
          })}
        </div>

        <Panel title="Últimos resultados" right={<button className="link" onClick={() => ir('calendario')}>Calendário →</button>}>
          {ult.length === 0 ? <p className="mut">Nenhuma partida jogada ainda.</p> : (
            <div className="ult-list">
              {ult.map(m => {
                const meu = isOrg(s, m.a) ? 'a' : 'b';
                const venceu = (meu === 'a') === (m.sa! > m.sb!);
                return (
                  <button key={m.id} className="ul-row" style={{ '--g': GAMES[m.game].cor } as CSSProperties} onClick={() => m.det && setRever(m.id)}>
                    <span className="gtag">{GAMES[m.game].curto}</span>
                    <span className="ul-d">{fmtData(m.dia, false)}</span>
                    <span className="ul-t r"><span className="nm-l">{s.teams[m.a].nome}</span><span className="nm-s">{s.teams[m.a].sigla}</span><Crest s={s} team={s.teams[m.a]} size={22} /></span>
                    <b className="ul-s">{m.sa}–{m.sb}</b>
                    <span className="ul-t"><Crest s={s} team={s.teams[m.b]} size={22} /><span className="nm-l">{s.teams[m.b].nome}</span><span className="nm-s">{s.teams[m.b].sigla}</span></span>
                    <span className={'pill ' + (venceu ? 'v' : 'd')}>{venceu ? 'V' : 'D'}</span>
                  </button>
                );
              })}
            </div>
          )}
        </Panel>

        <div className="two">
          {s.jogos.map(g => {
            const t = s.teams[s.orgTeams[g]!];
            const L = Object.values(s.leagues).find(l => l.teams.includes(t.id))!;
            const tab = tabela(s, L.id, splitAtual(s.dia));
            return (
              <Panel key={g} g={g} title={<><span className="gtag">{GAMES[g].curto}</span> {L.nome}</>} right={<button className="link" onClick={() => ir('competicoes', L.id)}>Tabela →</button>}>
                <table className="tab mini">
                  <tbody>{tab.map(l => (
                    <tr key={l.team.id} className={l.team.org ? 'org' : ''}><td className="pos">{l.pos}</td><td className="tm"><Crest s={s} team={l.team} size={18} />{l.team.nome}</td><td>{l.v}-{l.d}</td></tr>
                  ))}</tbody>
                </table>
              </Panel>
            );
          })}
        </div>
      </div>

      <div className="col-side">
        <Panel title="Diretoria">
          <div className="dir">
            <small>Meta da temporada {anoDe(s.dia)}</small>
            <b>{s.diretoria.meta}</b>
            <div className="conf"><span>Confiança</span><Bar v={conf} /><b>{Math.round(conf)}%</b></div>
          </div>
        </Panel>
        <Panel title="Caixa de entrada" right={<button className="link" onClick={() => ir('inbox')}>Ver tudo →</button>}>
          <ul className="msg-mini">
            {msgs.map(m => (
              <li key={m.id} className={(m.lida ? '' : 'nova ') + (m.acoes && !m.resolvida ? 'acao' : '')} onClick={() => ir('inbox', m.id)}>
                <b>{m.titulo}</b><small>{m.de} · {fmtData(m.dia, false)}</small>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Org">
          <div className="kv"><span>Caixa</span><b className={s.org.caixa < 0 ? 'neg' : ''}>{moeda(s.org.caixa)}</b></div>
          <div className="kv"><span>Reputação</span><b>{Math.round(s.org.rep)}/100</b></div>
          <div className="kv"><span>Seguidores</span><b>{s.org.fas.toLocaleString('pt-BR')}</b></div>
          <div className="kv"><span>Patrocinadores</span><b>{s.patro.length}/3</b></div>
        </Panel>
        {(s.noticiasDia?.length ?? 0) > 0 && (
          <Panel title="Notícias">
            <ul className="news">{s.noticiasDia!.slice(-6).reverse().map((n, i) => <li key={i}>{n}</li>)}</ul>
          </Panel>
        )}
      </div>
      {rever && <div className="overlay" onClick={e => e.target === e.currentTarget && setRever(null)}><div className="modal dia"><Resumo s={s} m={s.matches[rever]} auto={false} onFim={() => setRever(null)} /></div></div>}
    </div>
  );
}
