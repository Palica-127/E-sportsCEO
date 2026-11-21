import { CSSProperties, useState } from 'react';
import { GAMES, GameId } from '../../engine/games';
import { moeda, trocar, voltarAuto } from '../../engine/org';
import { TRACOS } from '../../engine/types';
import type { Player } from '../../engine/types';
import { forca, valorMercado } from '../../engine/world';
import { act, useGame } from '../../store';
import { Avatar, Bar, Crest, Flag, Forma, Ovr } from '../common';

export function Elenco({ jogo }: { jogo?: string }) {
  const s = useGame()!;
  const [g, setG] = useState<GameId>((jogo as GameId) ?? s.jogos[0]);
  const [sel, setSel] = useState<string | null>(null);
  const [ficha, setFicha] = useState<string | null>(null);
  const t = s.teams[s.orgTeams[g]!];
  const def = GAMES[g];
  const nR = def.roles.length;
  const L = Object.values(s.leagues).find(l => l.teams.includes(t.id))!;
  const ps = t.elenco.map(id => s.players[id]);

  function clicar(p: Player) {
    if (!sel) { setSel(p.id); return; }
    if (sel === p.id) { setSel(null); return; }
    act(st => trocar(st, t.id, sel, p.id));
    setSel(null);
  }

  return (
    <div className="elenco" style={{ '--g': def.cor } as CSSProperties}>
      <div className="tabs">{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} style={{ '--g': GAMES[x].cor } as CSSProperties} onClick={() => { setG(x); setSel(null); }}>{GAMES[x].nome}</button>)}</div>
      <div className="el-h">
        <Crest s={s} team={t} size={56} />
        <div><h2>{t.nome} <span className="gtag">{def.curto}</span></h2><small>{L.nome} · Técnico: {s.tecnicos[g]?.nome}</small></div>
        <div className="el-f"><small>Força do time</small><b>{forca(s, t).toFixed(1)}</b></div>
        <div className="el-modo">
          <small>Escalação</small>
          {t.manual ? <><b>Manual (você)</b><button className="btn ghost sm" onClick={() => act(st => voltarAuto(st, t.id))}>Devolver ao técnico</button></> : <><b>Técnico decide</b><small className="mut">Clique em dois jogadores para trocar</small></>}
        </div>
      </div>
      <section className="panel">
        <table className="tab elenco-tab">
          <thead><tr><th></th><th>Função</th><th className="tm">Jogador</th><th>Idade</th><th>Nota</th><th>Forma</th><th className="hide-sm">Moral</th><th className="hide-sm">Perfil</th><th className="hide-sm">Salário</th><th className="hide-sm">Contrato</th></tr></thead>
          <tbody>
            {ps.map((p, i) => (
              <tr key={p.id} className={(i < nR ? 'tit ' : 'res ') + (sel === p.id ? 'sel ' : '') + (i === nR ? 'sep' : '')} onClick={() => clicar(p)}>
                <td className="st">{i < nR ? def.roles[i] : 'RES'}</td>
                <td><span className="role">{def.roles[p.role]}</span></td>
                <td className="tm"><Avatar p={p} size={28} /><Flag nat={p.nat} /><button className="link nick" onClick={e => { e.stopPropagation(); setFicha(p.id); }}>{p.nick}</button></td>
                <td>{p.idade}</td>
                <td><Ovr v={p.ovr} /></td>
                <td><Forma v={p.forma} /></td>
                <td className="hide-sm"><Bar v={p.moral} /></td>
                <td className="hide-sm"><span className="traco" title={TRACOS[p.traco].desc}>{TRACOS[p.traco].nome}</span></td>
                <td className="hide-sm">{moeda(p.sal)}/sem</td>
                <td className="hide-sm">até {p.contrato}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {sel && <p className="mut">Selecionado: <b>{s.players[sel].nick}</b>. Clique em outro jogador para trocar de posição (isso coloca a escalação no manual).</p>}
      {ficha && <Ficha p={s.players[ficha]} onFechar={() => setFicha(null)} />}
    </div>
  );
}

function Ficha({ p, onFechar }: { p: Player; onFechar: () => void }) {
  const s = useGame()!;
  const def = GAMES[p.game];
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal ficha" style={{ '--g': def.cor } as CSSProperties}>
        <div className="fi-h"><Avatar p={p} size={72} /><div><h2><Flag nat={p.nat} /> {p.nick}</h2><small>{def.roleNomes[p.role]} · {p.idade} anos · {s.teams[p.teamId ?? '']?.nome ?? 'Agente livre'}</small></div><Ovr v={p.ovr} /></div>
        <div className="fi-grid">
          <div className="kv"><span>Potencial</span><b>{'★'.repeat(Math.max(1, Math.min(5, Math.round((p.pot - 60) / 7))))}</b></div>
          <div className="kv"><span>Perfil</span><b>{TRACOS[p.traco].nome}</b></div>
          <div className="kv"><span>Forma</span><Forma v={p.forma} /></div>
          <div className="kv"><span>Moral</span><Bar v={p.moral} /></div>
          <div className="kv"><span>Jogos pela carreira</span><b>{p.jogos}</b></div>
          <div className="kv"><span>MVPs</span><b>{p.mvps}</b></div>
          <div className="kv"><span>Salário</span><b>{moeda(p.sal)}/sem</b></div>
          <div className="kv"><span>Valor de mercado</span><b>{moeda(valorMercado(p))}</b></div>
        </div>
        <p className="mut">{TRACOS[p.traco].desc}</p>
        <div className="modal-f"><span /><button className="btn primary" onClick={onFechar}>Fechar</button></div>
      </div>
    </div>
  );
}
