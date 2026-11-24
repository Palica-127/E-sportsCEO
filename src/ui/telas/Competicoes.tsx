import { CSSProperties, useMemo, useState } from 'react';
import { GAMES, GameId } from '../../engine/games';
import { calendario, inicioAno, nomeIntl } from '../../engine/comp';
import { anoDe, fmtData, jogosDoTorneio, ligaDoTime, torneioDaLiga } from '../../engine/sim';
import type { State, Torneio } from '../../engine/types';
import { useGame } from '../../store';
import { Chave, Grupos, ListaJogos, Suico, TabelaLiga } from '../Bracket';
import { Crest, GameTag, NomeTime } from '../common';

interface Item { id: string; nome: string; tor?: Torneio; dia: number; sub?: boolean; org?: boolean }
interface Grupo { titulo: string; itens: Item[] }

function arvore(s: State, g: GameId): Grupo[] {
  const ano = anoDe(s.dia), y0 = inicioAno(ano);
  const tors = Object.values(s.torneios).filter(t => t.game === g && t.ano === ano);
  const out: Grupo[] = [];
  for (const ev of calendario(g)) {
    if (ev.kind === 'split') {
      const ligas = Object.values(s.leagues).filter(l => l.game === g).sort((a, b) => a.tier - b.tier);
      const itens: Item[] = ligas.map(L => {
        const tor = tors.find(t => t.league === L.id && t.split === ev.split && t.kind !== 'acesso');
        return { id: tor?.id ?? `fut-${L.id}-${ev.split}`, nome: L.nome, tor, dia: y0 + ev.d, sub: L.tier === 2, org: L.teams.includes(s.orgTeams[g]!) };
      });
      for (const ac of tors.filter(t => t.kind === 'acesso' && t.split === ev.split && t.league === ligaDoTime(s, s.orgTeams[g]!).id.replace(/-2$/, '-1'))) itens.push({ id: ac.id, nome: `Acesso · ${s.leagues[ac.league!].nome}`, tor: ac, dia: ac.stages[0].dias[0], sub: true, org: ac.teams.includes(s.orgTeams[g]!) });
      out.push({ titulo: `Split ${ev.split}`, itens });
    } else {
      const tor = tors.find(t => t.kind === ev.kind);
      out.push({ titulo: nomeIntl(g, ev.kind), itens: [{ id: tor?.id ?? `fut-${ev.kind}`, nome: `${nomeIntl(g, ev.kind)} ${ano}`, tor, dia: y0 + ev.d, org: !!tor?.teams.includes(s.orgTeams[g]!) }] });
    }
  }
  return out;
}

export function Competicoes({ abrir }: { abrir?: string }) {
  const s = useGame()!;
  const [g, setG] = useState<GameId>(() => (abrir && s.torneios[abrir]?.game) || s.jogos[0]);
  const [sel, setSel] = useState<string>(() => {
    if (abrir && s.torneios[abrir]) return abrir;
    return torneioDaLiga(s, ligaDoTime(s, s.orgTeams[g]!).id)?.id ?? '';
  });
  const grupos = useMemo(() => arvore(s, g), [s, g, s.dia]);
  const todos = grupos.flatMap(x => x.itens);
  const item = todos.find(i => i.id === sel) ?? todos.find(i => i.tor && i.org) ?? todos.find(i => i.tor);

  return (
    <div className="comp2" style={{ '--g': GAMES[g].cor } as CSSProperties}>
      <aside className="comp-tree">
        <div className="seg">{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} style={{ '--g': GAMES[x].cor } as CSSProperties} onClick={() => { setG(x); setSel(torneioDaLiga(s, ligaDoTime(s, s.orgTeams[x]!).id)?.id ?? ''); }}>{GAMES[x].curto}</button>)}</div>
        <div className="tree-ano">Temporada {anoDe(s.dia)}</div>
        {grupos.map(gr => (
          <div key={gr.titulo} className="tree-g">
            <div className="tree-t">{gr.titulo}</div>
            {gr.itens.map(i => (
              <button key={i.id} className={'tree-i ' + (i.id === item?.id ? 'on ' : '') + (i.sub ? 'ch ' : '') + (!i.tor ? 'fut' : '')} onClick={() => setSel(i.id)}>
                <span>{i.nome}{i.org && <i className="star">★</i>}</span>
                <small className={i.tor && !i.tor.fim ? 'live' : ''}>{!i.tor ? fmtData(i.dia, false).replace(/ \d{4}$/, '') : i.tor.fim ? 'encerrado' : 'ao vivo'}</small>
              </button>
            ))}
          </div>
        ))}
      </aside>
      <section className="comp-main">
        {!item ? <p className="mut pad">Nenhuma competição ainda.</p> : !item.tor ? (
          <div className="panel"><div className="panel-b"><h2>{item.nome}</h2><p className="mut">Começa em {fmtData(item.dia)}. Os classificados saem das competições anteriores.</p></div></div>
        ) : <Detalhe key={item.tor.id} s={s} tor={item.tor} />}
      </section>
    </div>
  );
}

function Detalhe({ s, tor }: { s: State; tor: Torneio }) {
  const ehLiga = tor.kind === 'split' || tor.kind === 'd2';
  const abas: { k: string; n: string }[] = [];
  tor.stages.forEach((st, i) => abas.push({ k: 'st' + i, n: st.tipo === 'rr' ? 'Tabela' : st.nome }));
  abas.push({ k: 'jogos', n: 'Jogos' }, { k: 'times', n: ehLiga ? 'Campeões' : 'Classificados' });
  const [aba, setAba] = useState('st' + Math.min(tor.si, tor.stages.length - 1));
  const st = tor.stages[tor.si];
  const ms = jogosDoTorneio(s, tor.id);
  return (
    <>
      <header className="det-h">
        <div><h2>{tor.nome}</h2><div className="det-s"><GameTag g={tor.game} /><span>{tor.stages.map(x => x.nome).join('  →  ')}</span></div></div>
        <div className="det-st">
          {tor.fim ? <><small>Campeão</small><b><Crest s={s} team={s.teams[tor.campeao!]} size={22} /> <NomeTime s={s} id={tor.campeao!} /></b></>
            : <><small>Em andamento</small><b>{st.nome} · rodada {st.ri + 1}</b></>}
        </div>
      </header>
      <div className="subtabs">{abas.map(a => <button key={a.k} className={a.k === aba ? 'on' : ''} onClick={() => setAba(a.k)}>{a.n}</button>)}</div>
      <div className="panel det-b">
        {abas.filter(a => a.k === aba).map(a => {
          if (a.k.startsWith('st')) {
            const i = Number(a.k.slice(2));
            const x = tor.stages[i];
            if (i > tor.si) return <p key={a.k} className="mut pad">Esta fase ainda não começou.</p>;
            if (x.tipo === 'rr') return <TabelaLiga key={a.k} s={s} tor={tor} />;
            if (x.tipo === 'swiss') return <Suico key={a.k} s={s} tor={tor} st={x} si={i} />;
            if (x.tipo === 'gsl') return <Grupos key={a.k} s={s} st={x} />;
            return <Chave key={a.k} s={s} st={x} seeds={x.seeds} campeao={i === tor.stages.length - 1 ? tor.campeao : undefined} />;
          }
          if (a.k === 'jogos') return <ListaJogos key={a.k} s={s} ms={ms} />;
          if (ehLiga) return <Historico key={a.k} s={s} tor={tor} />;
          return (
            <table key={a.k} className="tab">
              <thead><tr><th>#</th><th className="tm">Time</th><th>Região</th><th>Entrada</th><th>Resultado</th></tr></thead>
              <tbody>{(tor.rank ?? tor.teams).map((id, i) => <tr key={id} className={s.teams[id].org ? 'org' : ''}><td className="pos">{i + 1}</td><td className="tm"><Crest s={s} team={s.teams[id]} size={20} /><NomeTime s={s} id={id} /></td><td>{s.leagues[`${tor.game}-${s.teams[id].region}-1`]?.nome ?? s.teams[id].region}</td><td>{tor.direct && !tor.direct.includes(id) ? 'Play-In' : 'Direto'}</td><td>{tor.campeao === id ? '🏆 Campeão' : tor.elim[id] ?? (tor.fim ? '' : 'Vivo')}</td></tr>)}</tbody>
            </table>
          );
        })}
      </div>
    </>
  );
}

function Historico({ s, tor }: { s: State; tor: Torneio }) {
  const L = s.leagues[tor.league!];
  const h = s.hist.filter(x => x.nome.startsWith(L.nome + ' · Split')).slice().reverse();
  if (!h.length) return <p className="mut pad">Ainda sem campeões nesta carreira.</p>;
  return (
    <table className="tab">
      <thead><tr><th>Ano</th><th className="tm">Competição</th><th className="tm">Campeão</th><th className="tm">Vice</th></tr></thead>
      <tbody>{h.map((x, i) => <tr key={i} className={x.org ? 'org' : ''}><td>{x.ano}</td><td className="tm">{x.nome}</td><td className="tm">🏆 {x.campeao}</td><td className="tm">{x.vice}</td></tr>)}</tbody>
    </table>
  );
}
