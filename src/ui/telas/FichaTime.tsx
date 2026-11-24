// Ficha do time (modelo do BrasLOL): elenco + técnico, estante de títulos (história real + save), histórico e liga.
import { CSSProperties, useState } from 'react';
import { GAMES } from '../../engine/games';
import { fotoTecnico, histJogo, tecnicoReal, titulosDoTime, Titulo } from '../../engine/historiaReal';
import { notaVista } from '../../engine/mercado';
import { anoDe, ligaDoTime, tabelaTorneio, torneioDaLiga } from '../../engine/sim';
import { tecnicoDe } from '../../engine/staff';
import { forca, reservas, titulares } from '../../engine/world';
import { useGame } from '../../store';
import { Crest, Flag, NomeTime, Panel, Retrato, RetratoJogador, RetratoStaff, Ult } from '../common';
import { irPara } from '../nav';

const idadeDe = (nasc?: string | null) => {
  if (!nasc || !/^\d{4}-\d\d-\d\d/.test(nasc)) return null;
  const n = new Date(nasc + 'T00:00:00Z'), h = new Date();
  return h.getUTCFullYear() - n.getUTCFullYear() - (h.getUTCMonth() * 31 + h.getUTCDate() < n.getUTCMonth() * 31 + n.getUTCDate() ? 1 : 0);
};

export function FichaTime({ id }: { id: string }) {
  const s = useGame()!;
  const t = s.teams[id];
  const [aba, setAba] = useState<'elenco' | 'titulos' | 'hist' | 'liga'>('elenco');
  if (!t) return <Panel title="Time"><p className="mut">Time não encontrado.</p></Panel>;
  const g = t.game, def = GAMES[g], h = histJogo(g);
  const { titulos, vices } = titulosDoTime(s, t);
  const liga = ligaDoTime(s, t.id);
  const tiposOrd = h ? Object.keys(h.tipos) : [...new Set(titulos.map(x => x.tp))];
  const cont = (tp: string, l: Titulo[]) => l.filter(x => x.tp === tp).length;
  const outros = [...new Set(titulos.map(x => x.tp))].filter(x => !tiposOrd.includes(x));
  return (
    <div className="ficha-time" style={{ '--g': def.cor, '--tc': t.org ? s.org.cor : t.cor } as CSSProperties}>
      <div className="ft-top">
        <Crest s={s} team={t} size={96} />
        <div className="ft-nome">
          <h2>{t.nome}{t.org && <span className="chip2 ok">SUA ORG</span>}</h2>
          <small><span className="gtag">{def.curto}</span> {liga?.nome ?? t.region}{t.tier === 2 ? ' · 2ª divisão' : ''} · força {Math.round(forca(s, t))}</small>
          <div className="ft-ult"><Ult r={t.ult} /></div>
        </div>
        <div className="ft-kpis">
          {tiposOrd.map(tp => <div key={tp} className={'sala-kpi' + (tp === h?.main ? ' main' : '')}><b>{cont(tp, titulos)}</b><span>{h?.tipos[tp] ?? tp}</span></div>)}
          <div className="sala-kpi"><b>{vices.length}</b><span>vices</span></div>
        </div>
      </div>
      <div className="tabs">{([['elenco', 'Elenco'], ['titulos', 'Títulos'], ['hist', 'Histórico'], ['liga', 'Liga']] as const).map(([k, n]) => <button key={k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{n}</button>)}</div>

      {aba === 'elenco' && <Elenco id={id} />}

      {aba === 'titulos' && (
        <>
          <Panel ico="trofeu" title="Estante">
            {titulos.length === 0 ? <p className="mut">Nenhum título ainda.</p> : (
              <div className="ft-estante">
                {[...tiposOrd, ...outros].filter(tp => cont(tp, titulos)).map(tp => (
                  <div key={tp} className="ft-prat">
                    <h4>{h?.tipos[tp] ?? tp} <b>×{cont(tp, titulos)}</b></h4>
                    <div className="ft-anos">{titulos.filter(x => x.tp === tp).map((x, i) => <span key={i} className={'ft-ano' + (x.save ? ' save' : '')} title={x.nome}>{x.ano}</span>)}</div>
                  </div>
                ))}
              </div>
            )}
            <p className="mut" style={{ marginTop: 8 }}>Anos em destaque foram conquistados no seu save. Os demais são a história real do time (nomes antigos da organização contam).</p>
          </Panel>
          {titulos.length > 0 && <Panel title="Detalhes dos títulos">
            {titulos.map((x, i) => (
              <div key={i} className="ft-tit">
                <span className="y">{x.ano}</span>
                <span><b>{x.nome}</b>{x.vice && <small> · final contra {x.vice}</small>}{x.save && <em className="chip2 ok">save</em>}
                  {x.r?.length ? <small className="mut"><br />{x.r.join(', ')}{x.mvp ? ` · MVP ${x.mvp}` : ''}</small> : x.mvp ? <small className="mut"><br />MVP {x.mvp}</small> : null}</span>
              </div>
            ))}
          </Panel>}
          {vices.length > 0 && <Panel title={`Vices (${vices.length})`}>
            {vices.map((x, i) => <div key={i} className="ft-tit"><span className="y">{x.ano}</span><span>{x.nome} <small className="mut">· campeão {x.campeao}</small>{x.save && <em className="chip2 ok">save</em>}</span></div>)}
          </Panel>}
        </>
      )}

      {aba === 'hist' && <Historico titulos={titulos} vices={vices} />}

      {aba === 'liga' && <Liga id={id} />}
    </div>
  );
}

function Elenco({ id }: { id: string }) {
  const s = useGame()!;
  const t = s.teams[id], def = GAMES[t.game];
  const tit = titulares(s, t), res = reservas(s, t);
  const tec = t.org ? null : tecnicoReal(t);
  const tecOrg = t.org ? tecnicoDe(s, t.game) : undefined;
  const Card = ({ p, i }: { p: (typeof tit)[number]; i?: number }) => (
    <button className="ft-jog" onClick={() => irPara('perfil', p.id)}>
      <RetratoJogador s={s} p={p} size={96} />
      <span className="ft-role">{def.roles[i ?? p.role]}</span>
      <b>{p.nick}</b>
      {p.nome && <small className="mut">{p.nome}</small>}
      <small><Flag nat={p.nat} /> {p.idade} anos · nota {notaVista(s, p).txt}</small>
    </button>
  );
  return (
    <>
      <Panel title="Titulares"><div className="ft-elenco">{tit.map((p, i) => <Card key={p.id} p={p} i={i} />)}</div></Panel>
      <div className="two">
        <Panel title="Reservas">{res.length ? <div className="ft-elenco sm">{res.map(p => <Card key={p.id} p={p} />)}</div> : <p className="mut">Sem reservas.</p>}</Panel>
        <Panel title="Técnico">
          {tec ? (
            <div className="ft-tec">
              <Retrato nome={tec.nick} cor={t.cor} size={110} foto={tec.foto ? fotoTecnico(t.game, tec.nick) : null} fone={false} sigla={t.sigla} />
              <div><b>{tec.nick}</b>{tec.nome && <small className="mut">{tec.nome}</small>}
                <small><Flag nat={tec.nat ?? null} /> {idadeDe(tec.nasc) != null ? `${idadeDe(tec.nasc)} anos` : ''}</small>
                <small className="mut">Técnico real do time</small></div>
            </div>
          ) : tecOrg ? (
            <div className="ft-tec"><RetratoStaff s={s} x={tecOrg} size={110} /><div><b>{tecOrg.nome}</b><small><Flag nat={tecOrg.nat} /> nota {tecOrg.nota}</small></div></div>
          ) : <p className="mut">{t.org ? 'Sem técnico contratado.' : 'Técnico não identificado nas fontes.'}</p>}
        </Panel>
      </div>
    </>
  );
}

function Historico({ titulos, vices }: { titulos: Titulo[]; vices: Titulo[] }) {
  const anos = new Map<number, { t: Titulo; c: boolean }[]>();
  for (const x of titulos) (anos.get(x.ano) ?? anos.set(x.ano, []).get(x.ano)!).push({ t: x, c: true });
  for (const x of vices) (anos.get(x.ano) ?? anos.set(x.ano, []).get(x.ano)!).push({ t: x, c: false });
  const lista = [...anos.entries()].sort((a, b) => b[0] - a[0]);
  return (
    <Panel title="Linha do tempo (finais)">
      {lista.length === 0 ? <p className="mut">Nenhuma final registrada ainda.</p> : lista.map(([a, xs]) => (
        <div key={a} className="ft-ano-l">
          <b className="y">{a}</b>
          <div>{xs.map((x, i) => <div key={i} className={x.c ? 'pos' : 'mut'}>{x.c ? '🏆' : '🥈'} {x.t.nome}{x.c ? (x.t.vice ? ` · vs ${x.t.vice}` : '') : ` · campeão ${x.t.campeao}`}{x.t.save && <em className="chip2 ok">save</em>}</div>)}</div>
        </div>
      ))}
    </Panel>
  );
}

function Liga({ id }: { id: string }) {
  const s = useGame()!;
  const t = s.teams[id];
  const liga = ligaDoTime(s, id);
  const tor = liga ? torneioDaLiga(s, liga.id) : undefined;
  if (!liga || !tor) return <Panel title="Liga"><p className="mut">Sem liga em andamento.</p></Panel>;
  const tab = tabelaTorneio(s, tor);
  return (
    <Panel title={`${tor.nome} · ${anoDe(s.dia)}`}>
      <table className="tab">
        <thead><tr><th>#</th><th className="tm">Time</th><th>J</th><th>V</th><th>D</th><th>Saldo</th></tr></thead>
        <tbody>{tab.map((l, i) => <tr key={l.id} className={(s.teams[l.id].org ? 'org ' : '') + (l.id === t.id ? 'eu' : '')}><td className="pos">{i + 1}</td><td className="tm"><Crest s={s} team={s.teams[l.id]} size={20} /><NomeTime s={s} id={l.id} /></td><td>{l.j}</td><td>{l.v}</td><td>{l.d}</td><td>{l.mp - l.mc}</td></tr>)}</tbody>
      </table>
    </Panel>
  );
}
