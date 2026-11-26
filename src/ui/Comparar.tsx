// comparação lado a lado de dois jogadores do mesmo jogo (aba "Comparar" do perfil)
import { useMemo, useState } from 'react';
import { GAMES } from '../engine/games';
import { moeda } from '../engine/org';
import { ATRIBUTOS, atributos, slug, valorMercado } from '../engine/world';
import { TRACOS } from '../engine/types';
import type { Player, State } from '../engine/types';
import { Flag, NomeJogador, Radar, RetratoJogador } from './common';

const norm = (x: string) => slug(x).replace(/-/g, '');

/** rival padrão: se o jogador é de outro time, o nosso titular da mesma função; se é nosso, o melhor da função fora da org */
export function rivalPadrao(s: State, p: Player): string | undefined {
  const meu = s.teams[p.teamId ?? '']?.org;
  const mesmos = Object.values(s.players).filter(x => x.game === p.game && x.role === p.role && x.id !== p.id);
  const nossos = mesmos.filter(x => s.teams[x.teamId ?? '']?.org);
  const fora = mesmos.filter(x => !s.teams[x.teamId ?? '']?.org);
  const lista = !meu && nossos.length ? nossos : fora;
  return lista.sort((a, b) => b.ovr - a.ovr)[0]?.id;
}

export function Comparar({ s, p }: { s: State; p: Player }) {
  const [outro, setOutro] = useState<string | undefined>(() => rivalPadrao(s, p));
  const [q, setQ] = useState('');
  const def = GAMES[p.game];
  const opcoes = useMemo(() => {
    const k = norm(q);
    if (k.length < 2) return [];
    return Object.values(s.players).filter(x => x.game === p.game && x.id !== p.id && norm(x.nick).includes(k)).sort((a, b) => b.ovr - a.ovr).slice(0, 8);
  }, [s, q, p]);
  const o = outro ? s.players[outro] : undefined;
  const linhas: [string, (x: Player) => number | null, (v: number) => string, boolean?][] = [
    ['Nota', x => x.ovr, v => String(v)],
    ['Potencial', x => x.pot, v => String(v)],
    ['Idade', x => x.idade, v => `${v} anos`, true],
    ['Forma', x => x.forma, v => (v > 0 ? '+' : '') + v],
    ['Moral', x => x.moral, v => String(v)],
    ['Partidas', x => x.jogos, v => String(v)],
    ['MVPs', x => x.mvps, v => String(v)],
    ['Títulos', x => x.titulos ?? 0, v => String(v)],
    ['Salário (mês)', x => x.sal * 4, v => moeda(v), true],
    ['Valor de mercado', x => valorMercado(x), v => moeda(v), true],
  ];
  const time = (x: Player) => s.teams[x.teamId ?? '']?.nome ?? 'Agente livre';
  return (
    <section className="sec">
      <header className="sec-h"><h3><span className="chev">»</span>Comparar</h3></header>
      <div className="box">
        <div className="cmp-busca">
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.stopPropagation()} placeholder={`Comparar com outro jogador de ${def.curto}…`} />
          {opcoes.length > 0 && <div className="busca-r">{opcoes.map(x => (
            <button key={x.id} onClick={() => { setOutro(x.id); setQ(''); }}>
              <RetratoJogador s={s} p={x} size={26} /><span className="grow"><b><Flag nat={x.nat} /> {x.nick}</b><small>{def.roleNomes[x.role]} · {time(x)}</small></span>
            </button>))}</div>}
        </div>
        {!o ? <p className="mut">Escolha um jogador para comparar.</p> : (
          <>
            <div className="cmp-top">
              <div className="cmp-a"><RetratoJogador s={s} p={p} size={64} /><div><b>{p.nick}</b><small>{def.roleNomes[p.role]} · {time(p)}</small></div></div>
              <span className="mut">vs</span>
              <div className="cmp-b"><div><b><NomeJogador s={s} id={o.id}>{o.nick}</NomeJogador></b><small>{def.roleNomes[o.role]} · {time(o)}</small></div><RetratoJogador s={s} p={o} size={64} /></div>
            </div>
            <div style={{ display: 'grid', placeItems: 'center' }}><Radar labels={ATRIBUTOS} vals={atributos(p)} vals2={atributos(o)} size={280} /></div>
            <table className="cmp-tab"><tbody>
              {linhas.map(([n, f, fmt, menor]) => {
                const a = f(p), b = f(o);
                const ga = a != null && b != null && (menor ? a < b : a > b), gb = a != null && b != null && (menor ? b < a : b > a);
                return <tr key={n}><td className={ga ? 'win' : ''}>{a == null ? '?' : fmt(a)}</td><th>{n}</th><td className={gb ? 'win' : ''}>{b == null ? '?' : fmt(b)}</td></tr>;
              })}
              <tr><td>{TRACOS[p.traco].nome}</td><th>Perfil</th><td>{TRACOS[o.traco].nome}</td></tr>
            </tbody></table>
            <p className="mut" style={{ fontSize: 12, marginTop: 8 }}>Azul: {p.nick} · Laranja: {o.nick}.</p>
          </>
        )}
      </div>
    </section>
  );
}
