// Aba "Lendas" (modelo do BrasLOL): ranking de todos os tempos, galeria de cada torneio, títulos por time e recordes.
// Junta a história real (src/data/hist*.json) com o que acontece no save.
import { CSSProperties, useMemo, useState } from 'react';
import { GAMES, GameId } from '../../engine/games';
import { histJogo, lendas, Lenda, timeHist, tipoDoKind } from '../../engine/historiaReal';
import { useGame } from '../../store';
import { Crest, Flag, fotoDe, NomeJogador, NomeTime, Panel, Retrato } from '../common';
import { irPara } from '../nav';

const TODOS: GameId[] = ['lol', 'cs2', 'valorant', 'dota2', 'r6', 'ff', 'fifa', 'wr'];

function resumo(x: Lenda, tipos: Record<string, string>, main: string) {
  const ord = Object.keys(x.tit).sort((a, b) => (b === main ? 1 : 0) - (a === main ? 1 : 0) || (x.tit[b] - x.tit[a]));
  return [
    ...ord.filter(t => x.tit[t]).map(t => `${x.tit[t]}× ${tipos[t] ?? t}`),
    x.top1 ? `${x.top1}× nº 1 do ano` : '',
    x.mvps ? `${x.mvps} MVP${x.mvps > 1 ? 's' : ''}` : '',
  ].filter(Boolean).join(' · ');
}

export function Lendas() {
  const s = useGame()!;
  const jogos = [...s.jogos, ...TODOS.filter(g => !s.jogos.includes(g))].filter(g => histJogo(g));
  const [g, setG] = useState<GameId>(jogos[0]);
  const h = histJogo(g)!;
  const tipos = Object.keys(h.tipos);
  const [v, setV] = useState<string>('rank');
  const lista = useMemo(() => lendas(s, g), [s, g]);
  const vista = v === 'rank' || v === 'times' || v === 'rec' || tipos.includes(v) ? v : 'rank';
  return (
    <div style={{ '--g': GAMES[g].cor } as CSSProperties}>
      <div className="tabs sub">{jogos.map(x => <button key={x} className={x === g ? 'on' : ''} onClick={() => setG(x)}>{GAMES[x].nome}</button>)}</div>
      <div className="tabs sub lend-tabs">
        {[['rank', 'Ranking'], ...tipos.map(t => [t, h.tipos[t]]), ['times', 'Times'], ['rec', 'Recordes']].map(([k, n]) => <button key={k} className={vista === k ? 'on' : ''} onClick={() => setV(k)}>{n}</button>)}
      </div>
      {vista === 'rank' && <Ranking g={g} lista={lista} />}
      {tipos.includes(vista) && <Galeria g={g} tp={vista} />}
      {vista === 'times' && <Times g={g} />}
      {vista === 'rec' && <Recordes g={g} lista={lista} />}
    </div>
  );
}

function Ranking({ g, lista }: { g: GameId; lista: Lenda[] }) {
  const s = useGame()!;
  const h = histJogo(g)!;
  const top = lista.slice(0, 30);
  const abre = (x: Lenda) => x.pid && s.players[x.pid] && irPara('perfil', x.pid);
  const sub = (x: Lenda) => `${x.pid && s.players[x.pid]?.teamId ? s.teams[s.players[x.pid].teamId!]?.nome : x.ultimoTime ?? 'aposentado'}${x.anos[1] ? ` · ${x.anos[0]}–${x.anos[1]}` : ''}`;
  if (!top.length) return <Panel title="Ranking"><p className="mut">Sem dados ainda.</p></Panel>;
  return (
    <>
      <div className="lend-pod">
        {top.slice(0, 3).map((x, i) => (
          <button key={x.nick} className={'lend-p p' + (i + 1)} onClick={() => abre(x)} disabled={!x.pid}>
            <span className="lend-n">{i + 1}</span>
            <Retrato nome={x.nick} cor={GAMES[g].cor} size={i === 0 ? 130 : 104} foto={fotoDe(g, x.nick)} />
            <b>{x.nick}</b>
            <small><Flag nat={x.nat} /> {sub(x)}</small>
            <small className="mut">{resumo(x, h.tipos, h.main)}</small>
            <span className="lend-pts">{Math.round(x.pts)} pts</span>
          </button>
        ))}
      </div>
      <Panel title="Top 30 de todos os tempos">
        {top.slice(3).map((x, i) => (
          <div key={x.nick} className={'lend-l' + (x.pid ? ' vivo' : '')} onClick={() => abre(x)}>
            <span className="pos">{i + 4}</span>
            <Retrato nome={x.nick} cor="#4a5568" size={40} foto={fotoDe(g, x.nick)} />
            <span className="grow"><b>{x.nick}</b> <Flag nat={x.nat} /> <small className="mut">{sub(x)}</small><br /><small>{resumo(x, h.tipos, h.main)}</small></span>
            <b className="num">{Math.round(x.pts)}</b>
          </div>
        ))}
        <p className="mut" style={{ marginTop: 10 }}>
          Pontos: ranking anual ({h.boNome ?? 'melhores do ano'}: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1) + {h.tipos[h.main]} 30 + segundo torneio 15 + EWC 7,5 + MVP de final 5 + liga 1.
          No save: cada título vale 4 e cada prêmio de MVP do ano vale 10. Toque num jogador ativo para abrir o perfil.
        </p>
      </Panel>
    </>
  );
}

function Galeria({ g, tp }: { g: GameId; tp: string }) {
  const s = useGame()!;
  const h = histJogo(g)!;
  const reais = h.torneios.filter(t => t.tp === tp).map(t => ({ a: t.a, n: t.n, c: t.c, v: t.v, p: t.p, mvp: t.mvp?.[0], r: t.r, save: false }));
  const save = s.hist.filter(x => x.game === g && tipoDoKind(g, x.kind) === tp).map(x => ({ a: x.ano, n: x.nome, c: x.campeao, v: x.vice, p: '', mvp: undefined, r: undefined, save: true }));
  const todos = [...save, ...reais].sort((a, b) => b.a - a.a);
  const cont = new Map<string, number>();
  for (const x of todos) { const k = timeHist(s, g, x.c)?.nome ?? x.c; cont.set(k, (cont.get(k) ?? 0) + 1); }
  const maior = [...cont.entries()].sort((a, b) => b[1] - a[1])[0];
  const Nome = ({ n }: { n?: string }) => { const t = timeHist(s, g, n); return t ? <><Crest s={s} team={t} size={20} /><NomeTime s={s} id={t.id}>{n}</NomeTime></> : <>{n || '—'}</>; };
  return (
    <Panel title={h.tipos[tp]} right={maior && maior[1] > 1 ? <span className="mut">Maior campeão: {maior[0]} ({maior[1]})</span> : undefined}>
      {todos.length === 0 ? <p className="mut">Nenhuma edição registrada.</p> : todos.map((x, i) => (
        <div key={i} className={'lend-g' + (x.save ? ' save' : '')}>
          <span className="y">{x.a}</span>
          <span className="grow"><b className="lend-c">🏆 <Nome n={x.c} /></b>{x.v ? <small className="mut"> · vice <Nome n={x.v} /></small> : null}{x.p ? <small className="mut"> · {x.p}</small> : null}
            <br /><small className="mut">{x.n}{x.mvp ? ` · MVP ${x.mvp}` : ''}{x.r?.length ? ` · ${x.r.join(', ')}` : ''}</small></span>
          {x.save && <em className="chip2 ok">save</em>}
        </div>
      ))}
    </Panel>
  );
}

function Times({ g }: { g: GameId }) {
  const s = useGame()!;
  const h = histJogo(g)!;
  const tipos = Object.keys(h.tipos);
  const m = new Map<string, { nome: string; id?: string; c: Record<string, number>; v: number }>();
  const pega = (n: string) => { const t = timeHist(s, g, n); const k = t?.id ?? n; let x = m.get(k); if (!x) m.set(k, (x = { nome: t?.nome ?? n, id: t?.id, c: {}, v: 0 })); return x; };
  for (const t of h.torneios) { if (t.c) { const x = pega(t.c); x.c[t.tp] = (x.c[t.tp] ?? 0) + 1; } if (t.v) pega(t.v).v++; }
  for (const x of s.hist) if (x.game === g) { const tp = tipoDoKind(g, x.kind); const a = pega(x.campeao); a.c[tp] = (a.c[tp] ?? 0) + 1; if (x.vice) pega(x.vice).v++; }
  const rows = [...m.values()].filter(x => Object.keys(x.c).length).sort((a, b) => {
    for (const t of tipos) { const d = (b.c[t] ?? 0) - (a.c[t] ?? 0); if (d) return d; }
    return b.v - a.v;
  });
  return (
    <Panel title="Títulos por time">
      <table className="tab">
        <thead><tr><th>#</th><th className="tm">Time</th>{tipos.map(t => <th key={t}>{h.tipos[t]}</th>)}<th>Vices</th></tr></thead>
        <tbody>{rows.slice(0, 40).map((x, i) => (
          <tr key={x.nome}><td className="pos">{i + 1}</td>
            <td className="tm">{x.id ? <><Crest s={s} team={s.teams[x.id]} size={20} /><NomeTime s={s} id={x.id} /></> : x.nome}</td>
            {tipos.map(t => <td key={t}>{x.c[t] ?? '—'}</td>)}<td>{x.v || '—'}</td></tr>
        ))}</tbody>
      </table>
      <p className="mut" style={{ marginTop: 8 }}>Nomes antigos da mesma organização contam para o clube atual (ex.: SK Telecom T1 → T1). Times fora do jogo aparecem sem link.</p>
    </Panel>
  );
}

function Recordes({ g, lista }: { g: GameId; lista: Lenda[] }) {
  const s = useGame()!;
  const h = histJogo(g)!;
  const max = (f: (x: Lenda) => number) => lista.reduce<Lenda | null>((b, x) => (f(x) > (b ? f(b) : 0) ? x : b), null);
  const rec: [string, Lenda | null, (x: Lenda) => number][] = [
    [`Mais ${h.tipos[h.main]}`, max(x => x.tit[h.main] ?? 0), x => x.tit[h.main] ?? 0],
    ['Mais vezes nº 1 do ano', max(x => x.top1), x => x.top1],
    ['Mais anos no top 10', max(x => x.tops), x => x.tops],
    ['Mais MVPs de final', max(x => x.mvps), x => x.mvps],
    ['Mais títulos no total', max(x => Object.values(x.tit).reduce((a, b) => a + b, 0)), x => Object.values(x.tit).reduce((a, b) => a + b, 0)],
  ];
  return (
    <Panel title="Recordes">
      <div className="lend-rec">
        {rec.filter(r => r[1]).map(([n, x, f]) => (
          <div key={n} className="rec"><small>{n}</small><b className="num">{f(x!)}</b><span><Flag nat={x!.nat} /> {x!.pid ? <NomeJogador s={s} id={x!.pid}>{x!.nick}</NomeJogador> : x!.nick}</span></div>
        ))}
      </div>
    </Panel>
  );
}
