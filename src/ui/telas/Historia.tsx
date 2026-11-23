import { CSSProperties, useState } from 'react';
import { GAMES, GameId } from '../../engine/games';
import { aposentarCamisa, campeoesPorTorneio, LIMIAR_HALL } from '../../engine/legado';
import { moeda } from '../../engine/org';
import { anoDe } from '../../engine/sim';
import type { Premiado, State, TorKind } from '../../engine/types';
import { slug } from '../../engine/world';
import { act, useGame } from '../../store';
import { Crest, Escudo, Flag, FOTO_SET, Panel, Retrato } from '../common';

const trofeu = (kind: TorKind, nome: string) => {
  const m: Partial<Record<TorKind, string>> = { worlds: 'w', msi: 'm', fs: 'f', ewc: 'e', intlA: 'm', intlB: 'w' };
  if (m[kind]) return `/trofeus/${m[kind]}.png`;
  const liga = ['CBLOL', 'LCK', 'LCS', 'LEC', 'LPL'].find(l => nome.startsWith(l) && !nome.includes('Challengers'));
  return `/trofeus/${liga ?? 'c'}.png`;
};
const timePorNome = (s: State, g: GameId, nome: string) => Object.values(s.teams).find(t => t.game === g && t.nome === nome && !t.acad);
const foto = (nick: string) => { const k = slug(nick).replace(/-/g, ''); return FOTO_SET.has(k) ? `/fotos/${k}.webp` : null; };

export function Historia({ abrir }: { abrir: (tela: string, arg?: string) => void }) {
  const s = useGame()!;
  const [aba, setAba] = useState<'trofeus' | 'premios' | 'hall' | 'campeoes'>('trofeus');
  return (
    <div>
      <div className="tabs">{([['trofeus', 'Sala de troféus'], ['premios', 'Prêmios do ano'], ['hall', 'Hall da Fama'], ['campeoes', 'Campeões']] as const).map(([k, n]) => <button key={k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{n}</button>)}</div>
      {aba === 'trofeus' && <Trofeus />}
      {aba === 'premios' && <Premios abrir={abrir} />}
      {aba === 'hall' && <Hall />}
      {aba === 'campeoes' && <Campeoes />}
    </div>
  );
}

function Trofeus() {
  const s = useGame()!;
  const titulos = s.hist.filter(h => h.campeao === s.org.nome).sort((a, b) => b.ano - a.ano);
  const vices = s.hist.filter(h => h.vice === s.org.nome).length;
  const temps = (s.temporadas ?? []).slice().reverse();
  const premiosOrg = (s.premiosAno ?? []).flatMap(p => [p.mvp, p.revelacao, ...p.selecao].filter(x => x?.org)).length;
  return (
    <>
      <div className="sala">
        <div className="sala-org">{s.org.logo ? <img src={s.org.logo} width={96} height={96} /> : <Escudo sigla={s.org.sigla} cor={s.org.cor} size={96} />}
          <div><h2>{s.org.nome}</h2><small>Fundada em {anoDe(0)} · {temps.length} temporada{temps.length === 1 ? '' : 's'} completa{temps.length === 1 ? '' : 's'}</small></div></div>
        <div className="sala-kpi"><b>{titulos.length}</b><span>títulos</span></div>
        <div className="sala-kpi"><b>{vices}</b><span>vices</span></div>
        <div className="sala-kpi"><b>{premiosOrg}</b><span>prêmios individuais</span></div>
        <div className="sala-kpi"><b>{(s.hall ?? []).filter(h => h.lendaOrg).length}</b><span>lendas</span></div>
      </div>
      <Panel ico="trofeu" title="Estante">
        {titulos.length === 0 ? <p className="mut">A estante ainda está vazia. O primeiro troféu vai ficar bem aqui.</p> : (
          <div className="estante">
            {titulos.map(h => (
              <div key={h.tor + h.ano} className="trofeu" style={{ '--g': GAMES[h.game].cor } as CSSProperties}>
                <img src={trofeu(h.kind, h.nome)} alt="" onError={e => ((e.target as HTMLImageElement).style.visibility = 'hidden')} />
                <b>{h.nome}</b>
                <small><span className="gtag">{GAMES[h.game].curto}</span> {h.ano} · vice {h.vice}</small>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <Panel ico="livro" title="Temporadas da org">
        {temps.length === 0 ? <p className="mut">O resumo de cada temporada aparece aqui no fim do ano (dia 6 de dezembro).</p> : (
          <table className="tbl temps">
            <thead><tr><th>Ano</th>{s.jogos.map(g => <th key={g}>{GAMES[g].curto}</th>)}<th>Caixa</th><th>Reputação</th><th>Fãs</th></tr></thead>
            <tbody>{temps.map(t => (
              <tr key={t.ano}>
                <td><b>{t.ano}</b></td>
                {s.jogos.map(g => { const x = t.jogos[g]; return <td key={g}>{x ? <><small>{x.liga}</small><br /><b>{x.v}V {x.d}D</b>{x.titulos.length > 0 && <span className="tt"> 🏆×{x.titulos.length}</span>}</> : <span className="mut">—</span>}</td>; })}
                <td>{moeda(t.caixa)}</td><td>{t.rep}</td><td>{t.fas.toLocaleString('pt-BR')}</td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </Panel>
    </>
  );
}

function CardPremio({ s, titulo, p, g, grande, abrir }: { s: State; titulo: string; p: Premiado | null; g: GameId; grande?: boolean; abrir: (tela: string, arg?: string) => void }) {
  if (!p) return null;
  const vivo = !!s.players[p.pid];
  return (
    <button className={'premio ' + (grande ? 'grande ' : '') + (p.org ? 'org' : '')} onClick={() => vivo && abrir('perfil', p.pid)} disabled={!vivo}>
      <span className="pr-tit">{titulo}</span>
      <Retrato nome={p.nick + p.pid} cor={p.org ? s.org.cor : timePorNome(s, g, p.time)?.cor ?? '#4a5568'} size={grande ? 150 : 84} foto={foto(p.nick)} sigla={p.sigla} />
      <b>{p.nick}</b>
      <small><Flag nat={p.nat} /> {GAMES[g].roleNomes[p.role]} · {p.time}</small>
      {p.motivo && <small className="mut">{p.motivo}</small>}
      {p.org && <em>SUA ORG</em>}
    </button>
  );
}

function Premios({ abrir }: { abrir: (tela: string, arg?: string) => void }) {
  const s = useGame()!;
  const todos = s.premiosAno ?? [];
  const anos = [...new Set(todos.map(p => p.ano))].sort((a, b) => b - a);
  const [ano, setAno] = useState(anos[0] ?? anoDe(s.dia));
  const jogos = [...new Set(todos.filter(p => p.ano === ano).map(p => p.game))];
  const [g, setG] = useState<GameId>(jogos[0] ?? s.jogos[0]);
  const pr = todos.find(p => p.ano === ano && p.game === g);
  if (!todos.length) return <Panel title="Prêmios do ano"><p className="mut">A cerimônia acontece no fim de cada temporada (6 de dezembro). Em cada jogo, a liga da sua org premia MVP, Revelação, Seleção, Time e Técnico do ano, e sai também o Melhor do mundo.</p></Panel>;
  const tdA = pr?.timeDoAno ? timePorNome(s, g, pr.timeDoAno) : null;
  return (
    <>
      <div className="tabs sub">
        {anos.map(a => <button key={a} className={a === ano ? 'on' : ''} onClick={() => setAno(a)}>{a}</button>)}
        <span className="sep" />
        {jogos.map(x => <button key={x} className={x === g ? 'on' : ''} onClick={() => setG(x)}>{GAMES[x].nome}</button>)}
      </div>
      {pr && (
        <div className="cerimonia" style={{ '--g': GAMES[g].cor } as CSSProperties}>
          <div className="cer-top">
            <CardPremio s={s} titulo={`MVP do ano · ${pr.liga ?? ''}`} p={pr.mvp} g={g} grande abrir={abrir} />
            <div className="cer-lado">
              <CardPremio s={s} titulo="Revelação" p={pr.revelacao} g={g} abrir={abrir} />
              <CardPremio s={s} titulo="Melhor do mundo" p={pr.mundial ?? null} g={g} abrir={abrir} />
              <div className="premio time">
                <span className="pr-tit">Time do ano</span>
                {tdA ? <Crest s={s} team={tdA} size={84} /> : <Escudo sigla="?" cor="#555" size={84} />}
                <b>{pr.timeDoAno ?? '—'}</b>
                {pr.tecnico && <small className="pos">Técnico do ano: {pr.tecnico.nome} (sua org)</small>}
              </div>
            </div>
          </div>
          <h4 className="sub">Seleção do ano · {pr.liga}</h4>
          <div className="selecao">{pr.selecao.map(p => <CardPremio key={p.pid} s={s} titulo={GAMES[g].roles[p.role]} p={p} g={g} abrir={abrir} />)}</div>
        </div>
      )}
    </>
  );
}

function Hall() {
  const s = useGame()!;
  const [f, setF] = useState<'hof' | 'org'>('hof');
  const [aviso, setAviso] = useState('');
  const lista = (s.hall ?? []).filter(h => (f === 'hof' ? h.hof : h.lendaOrg)).sort((a, b) => b.pontos - a.pontos);
  return (
    <>
      <div className="tabs sub">
        <button className={f === 'hof' ? 'on' : ''} onClick={() => setF('hof')}>Hall da Fama</button>
        <button className={f === 'org' ? 'on' : ''} onClick={() => setF('org')}>Lendas da {s.org.nome}</button>
      </div>
      {aviso && <div className="alerta ok" style={{ marginBottom: 12 }}><b>!</b>{aviso}</div>}
      <p className="mut" style={{ marginBottom: 12 }}>
        {f === 'hof' ? `Quando um jogador se aposenta, a carreira vira pontos: título vale 3, Seleção 5, Revelação 3, além de MVPs de partida e pico de nota. Melhor do mundo vale 15 e MVP da liga 8. Com ${LIMIAR_HALL} pontos ou mais, ele entra no Hall da Fama.` : 'Quem jogou 2 temporadas ou foi campeão pela org vira lenda quando se aposenta. Dá para aposentar a camisa numa cerimônia (R$ 30 mil): os fãs adoram.'}
      </p>
      {lista.length === 0 ? <Panel title={f === 'hof' ? 'Hall da Fama' : 'Lendas'}><p className="mut">Ninguém ainda. As aposentadorias acontecem no fim de cada temporada.</p></Panel> : (
        <div className="hall">
          {lista.map(h => (
            <div key={h.pid} className={'placa ' + (h.lendaOrg ? 'org ' : '') + (h.camisa ? 'camisa' : '')} style={{ '--g': GAMES[h.game].cor } as CSSProperties}>
              <Retrato nome={h.nick + h.pid} cor={h.lendaOrg ? s.org.cor : '#8a6d2f'} size={96} foto={foto(h.nick)} />
              <div className="pl-info">
                <b>{h.nick}</b>
                <small><Flag nat={h.nat} /> <span className="gtag">{GAMES[h.game].curto}</span> {GAMES[h.game].roleNomes[h.role]} · {h.inicio}–{h.ano}</small>
                <div className="pl-num"><span><b>{h.titulos}</b>títulos</span><span><b>{h.premios.length}</b>prêmios</span><span><b>{h.mvps}</b>MVPs</span><span><b>{h.pico}</b>pico</span></div>
                {h.premios.length > 0 && <small className="mut">{h.premios.slice(0, 3).join(' · ')}{h.premios.length > 3 ? '…' : ''}</small>}
                <small className="mut">Último time: {h.ultimoTime}{h.lendaOrg ? ` · ${h.orgAnos} temp. na org, ${h.titulosOrg} títulos` : ''}</small>
                {h.lendaOrg && (h.camisa ? <span className="chip2 ok">Camisa aposentada</span> : <button className="btn sm" onClick={() => setAviso(act(st => aposentarCamisa(st, h.pid)) ?? '')}>Aposentar a camisa</button>)}
              </div>
              <div className="pl-pts">{h.pontos}<small>pts</small></div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Campeoes() {
  const s = useGame()!;
  const [g, setG] = useState<GameId>(s.jogos[0]);
  const tors = campeoesPorTorneio(s, g);
  return (
    <>
      <div className="tabs sub">{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} onClick={() => setG(x)}>{GAMES[x].nome}</button>)}</div>
      {tors.length === 0 ? <p className="mut">Nenhuma competição terminou ainda.</p> : (
        <div className="campeoes">
          {tors.map(t => {
            const cont = new Map<string, number>();
            for (const e of t.edicoes) cont.set(e.campeao, (cont.get(e.campeao) ?? 0) + 1);
            const maior = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
            return (
              <Panel key={t.nome} title={t.nome} right={maior && maior[1] > 1 ? <span className="mut">Maior campeão: {maior[0]} ({maior[1]})</span> : undefined}>
                {t.edicoes.slice().reverse().map(e => {
                  const tc = timePorNome(s, g, e.campeao);
                  return (
                    <div key={e.ano + (e.split ?? '')} className={'camp-l ' + (e.campeao === s.org.nome ? 'org' : '')}>
                      <span>{e.ano}{e.split ? ` · S${e.split}` : ''}</span>
                      {tc ? <Crest s={s} team={tc} size={22} /> : <span style={{ width: 22 }} />}
                      <b>{e.campeao}</b>
                      <small className="mut">vice {e.vice}</small>
                    </div>
                  );
                })}
              </Panel>
            );
          })}
        </div>
      )}
    </>
  );
}
