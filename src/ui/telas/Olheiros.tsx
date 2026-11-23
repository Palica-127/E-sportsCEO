import { GAMES } from '../../engine/games';
import { moeda } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import { doCargo } from '../../engine/staff';
import { notaVista } from '../../engine/mercado';
import { useGame } from '../../store';
import { Crest, Estrelas, Ovr, Panel, RetratoJogador, RetratoStaff } from '../common';
import type { Tela } from '../Shell';

export function Olheiros({ ir }: { ir: (t: Tela, a?: string) => void }) {
  const s = useGame()!;
  const os = doCargo(s, 'olheiro');
  const rels = Object.entries(s.conhecido).filter(([, k]) => k.n === 2).map(([id]) => s.players[id]).filter(p => p && !s.teams[p.teamId ?? '']?.org).slice(-40).reverse();
  return (
    <div>
      <Panel ico="lupa" title="Seus olheiros" right={<button className="link" onClick={() => ir('staff')}>Contratar mais ›</button>}>
        <div className="staff-grid">
          {os.map(o => (
            <div key={o.id} className="scard">
              <RetratoStaff s={s} x={o} size={96} /><b>{o.nome}</b>
              <Estrelas v={Math.max(0.5, Math.min(5, (o.nota - 50) / 9))} size={15} />
              <small>{o.estilo}</small>
              <p>{o.tarefa ? <>Observando <b>{s.players[o.tarefa.pid]?.nick}</b> · relatório {fmtData(o.tarefa.fim, false)}</> : 'Livre: escolha alguém no mercado ou no perfil de um jogador.'}</p>
              {!o.tarefa && <button className="btn sm" onClick={() => ir('mercado')}>Escolher alvo</button>}
            </div>
          ))}
        </div>
        <p className="mut" style={{ marginTop: 10 }}>Quanto maior a nota do olheiro, mais rápido e mais preciso é o relatório (nota real, potencial, perfil e interesse em vir).</p>
      </Panel>
      <div style={{ height: 22 }} />
      <Panel ico="jornal" title="Relatórios" solto>
        <div className="box" style={{ padding: 0 }}>
          <table className="tab">
            <thead><tr><th className="tm">Jogador</th><th>Jogo</th><th>Função</th><th>Idade</th><th className="tm">Time</th><th>Nota</th><th>Potencial</th><th>Interesse</th><th>Salário atual</th></tr></thead>
            <tbody>{rels.map(p => {
              const k = s.conhecido[p.id];
              return (
                <tr key={p.id} className="clk" onClick={() => ir('perfil', p.id)}>
                  <td className="tm"><RetratoJogador s={s} p={p} size={34} />{p.nick}</td>
                  <td><span className="gtag" style={{ ['--g' as string]: GAMES[p.game].cor }}>{GAMES[p.game].curto}</span></td>
                  <td>{GAMES[p.game].roles[p.role]}</td><td>{p.idade}</td>
                  <td className="tm">{p.teamId ? <><Crest s={s} team={s.teams[p.teamId]} size={20} />{s.teams[p.teamId].nome}</> : 'Livre'}</td>
                  <td><Ovr v={notaVista(s, p).txt} /></td>
                  <td><Estrelas v={Math.max(1, Math.min(5, (p.pot - 58) / 8))} size={12} /></td>
                  <td>{k.int ?? '?'}%</td>
                  <td>{moeda(p.sal * 4)}</td>
                </tr>
              );
            })}</tbody>
          </table>
          {!rels.length && <p className="mut pad">Nenhum relatório ainda.</p>}
        </div>
      </Panel>
    </div>
  );
}
