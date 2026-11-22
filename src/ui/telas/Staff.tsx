import { CSSProperties, useState } from 'react';
import { Lock, UserPlus } from 'lucide-react';
import { GAMES, GameId } from '../../engine/games';
import { moeda } from '../../engine/org';
import { CARGOS, CARGOS_JOGO, CARGOS_ORG, NOME_COMODO, cobertura, contratarStaff, demitirStaff, doCargo, multaStaff } from '../../engine/staff';
import type { Cargo, Staff } from '../../engine/types';
import { act, useGame } from '../../store';
import { Estrelas, Flag, Panel, RetratoStaff } from '../common';

export function StaffTela() {
  const s = useGame()!;
  const [pool, setPool] = useState<{ cargo: Cargo; game?: GameId } | null>(null);
  const [msg, setMsg] = useState('');

  const Card = ({ x, cargo, game }: { x?: Staff; cargo: Cargo; game?: GameId }) => {
    const info = CARGOS[cargo];
    const travado = info.comodo && !(s.sede.comodos[info.comodo]?.nivel);
    if (!x) return (
      <div className="scard vazio">
        <span className="sc-cargo">{info.nome}</span>
        <span className="sc-ic">{travado ? <Lock /> : <UserPlus />}</span>
        <p>{info.desc}</p>
        {travado ? <span className="lock">Precisa do cômodo “{NOME_COMODO[info.comodo!]}” na sede</span> : <button className="btn sm" onClick={() => setPool({ cargo, game })}>Contratar</button>}
      </div>
    );
    return (
      <div className="scard">
        <span className="sc-cargo">{info.nome}</span>
        <RetratoStaff s={s} x={x} size={110} />
        <b>{x.nome}</b>
        <Estrelas v={Math.max(0.5, Math.min(5, (x.nota - 50) / 9))} size={16} />
        <small><Flag nat={x.nat} /> Nota {x.nota} · {moeda(x.sal * 4)}/mês</small>
        <p>{x.estilo}{x.tarefa ? ` · observando ${s.players[x.tarefa.pid]?.nick ?? ''}` : ''}{info.cap ? ` · cobertura ${Math.round(cobertura(s, cargo) * 100)}%` : ''}</p>
        <button className="btn danger sm" onClick={() => { if (confirm(`Demitir ${x.nome}? Multa de ${moeda(multaStaff(x))}.`)) act(st => demitirStaff(st, x.id)); }}>Demitir</button>
      </div>
    );
  };

  return (
    <div>
      {s.jogos.map(g => (
        <section key={g} className="sec" style={{ marginBottom: 26, '--g': GAMES[g].cor } as CSSProperties}>
          <header className="sec-h"><h3><span className="chev">»</span>Comissão técnica · {GAMES[g].nome}</h3></header>
          <div className="staff-grid">{CARGOS_JOGO.map(c => <Card key={c} cargo={c} game={g} x={doCargo(s, c, g)[0]} />)}</div>
        </section>
      ))}
      <section className="sec">
        <header className="sec-h"><h3><span className="chev">»</span>Staff da organização</h3><span className="mut">Atendem todos os elencos · olheiros: até 3</span></header>
        <div className="staff-grid">
          {CARGOS_ORG.flatMap(c => (c === 'olheiro' ? [...doCargo(s, c).map(x => <Card key={x.id} cargo={c} x={x} />), ...(doCargo(s, c).length < 3 ? [<Card key="o-novo" cargo={c} />] : [])] : [<Card key={c} cargo={c} x={doCargo(s, c)[0]} />]))}
        </div>
      </section>
      {msg && <div className="retorno">{msg}</div>}
      {pool && (
        <div className="overlay" onClick={e => e.target === e.currentTarget && setPool(null)}>
          <div className="modal">
            <h2>Contratar {CARGOS[pool.cargo].nome.toLowerCase()} <small>{pool.game ? GAMES[pool.game].nome : 'organização'}</small></h2>
            <p className="mut">O mercado de profissionais renova a cada 4 semanas. Luvas: 1 mês de salário.</p>
            <Panel solto>
              <div className="staff-grid">
                {s.staffPool.filter(x => x.cargo === pool.cargo).map(x => (
                  <div key={x.id} className="scard">
                    <RetratoStaff s={s} x={x} size={90} /><b>{x.nome}</b>
                    <Estrelas v={Math.max(0.5, Math.min(5, (x.nota - 50) / 9))} size={16} />
                    <small>Nota {x.nota} · {moeda(x.sal * 4)}/mês</small><p>{x.estilo}</p>
                    <button className="btn primary sm" onClick={() => { const e = act(st => contratarStaff(st, x.id, pool.game)); if (e) setMsg(e); else { setMsg(`${x.nome} contratado.`); setPool(null); } }}>Contratar</button>
                  </div>
                ))}
                {!s.staffPool.some(x => x.cargo === pool.cargo) && <p className="mut">Ninguém disponível agora. Volte depois.</p>}
              </div>
            </Panel>
            <div className="modal-f"><span className="mut">Caixa: {moeda(s.org.caixa)}</span><button className="btn ghost" onClick={() => setPool(null)}>Fechar</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
