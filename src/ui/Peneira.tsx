import { CSSProperties, useState } from 'react';
import { GAMES, GameId } from '../engine/games';
import { comentarioTecnico, confirmarPeneira, custoCandidato, moeda, validaPeneira, verbaPeneira } from '../engine/org';
import { TRACOS } from '../engine/types';
import { act, useGame } from '../store';
import { Avatar, Bar, Crest, Flag } from './common';

export function Peneira() {
  const s = useGame()!;
  const jogos = s.jogos.filter(g => s.peneira[g]);
  const [g, setG] = useState<GameId>(jogos[0]);
  const [role, setRole] = useState<number | null>(null);
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const P = s.peneira[g]!;
  const def = GAMES[g];
  const nR = def.roles.length;
  const v = verbaPeneira(s);
  const lista = P.candidatos.filter(c => role == null || s.players[c.pid].role === role)
    .sort((a, b) => s.players[a.pid].role - s.players[b.pid].role || (b.faixa[0] + b.faixa[1]) - (a.faixa[0] + a.faixa[1]));
  const escolhidos = P.escolhidos.map(id => s.players[id]);

  function toggle(pid: string) {
    act(st => {
      const pp = st.peneira[g]!;
      if (pp.escolhidos.includes(pid)) pp.escolhidos = pp.escolhidos.filter(x => x !== pid);
      else if (pp.escolhidos.length < nR + 2) { pp.escolhidos.push(pid); setUltimo(pid); }
    });
    setErro('');
  }
  function confirmar() {
    const e = act(st => confirmarPeneira(st));
    if (e) setErro(e);
  }
  const slots = [...def.roles.map((r, i) => ({ r: i, lbl: def.roleNomes[i] })), { r: -1, lbl: 'Reserva' }, { r: -1, lbl: 'Reserva' }];
  const usados = new Set<string>();
  const preench = slots.map(sl => {
    const p = escolhidos.find(x => !usados.has(x.id) && (sl.r === -1 || x.role === sl.r));
    if (p) usados.add(p.id);
    return { ...sl, p };
  });

  return (
    <div className="peneira" style={{ '--g': def.cor } as CSSProperties}>
      <header className="pen-h">
        <div>
          <h1>Peneira</h1>
          <p className="mut">Escolha 1 jogador por função e até 2 reservas. As notas são aproximadas: a gente só sabe o nível exato depois de ver o jogador treinando.</p>
        </div>
        <div className="verba">
          <span>Verba da org</span>
          <b className={v.gasto > v.total ? 'neg' : ''}>{moeda(v.total - v.gasto)}</b>
          <Bar v={v.total - v.gasto} max={v.total} cor="var(--g)" />
          <small>gasto: {moeda(v.gasto)} · salários entram na folha semanal</small>
        </div>
      </header>
      {jogos.length > 1 && <div className="tabs">{jogos.map(x => <button key={x} className={x === g ? 'on' : ''} style={{ '--g': GAMES[x].cor } as CSSProperties} onClick={() => { setG(x); setRole(null); }}>{GAMES[x].nome}{validaPeneira(s, x) ? '' : ' ✓'}</button>)}</div>}
      <div className="pen-grid">
        <section className="panel">
          <header className="panel-h">
            <h3>Candidatos</h3>
            <div className="chips"><button className={'chip sm ' + (role == null ? 'on' : '')} onClick={() => setRole(null)}>Todos</button>{def.roles.map((r, i) => <button key={r} className={'chip sm ' + (role === i ? 'on' : '')} onClick={() => setRole(i)}>{r}</button>)}</div>
          </header>
          <div className="cand-list">
            {lista.map(c => {
              const p = s.players[c.pid];
              const on = P.escolhidos.includes(p.id);
              const time = p.teamId ? s.teams[p.teamId] : null;
              return (
                <button key={p.id} className={'cand ' + (on ? 'on' : '')} onClick={() => toggle(p.id)}>
                  <Avatar p={p} />
                  <span className="c-main">
                    <span className="c-nick"><Flag nat={p.nat} /> {p.nick} <span className="role">{def.roles[p.role]}</span></span>
                    <span className="c-sub">{p.idade} anos · {TRACOS[p.traco].nome}{c.motivo ? ` · ${c.motivo}` : ''}</span>
                    {time && <span className="c-team"><Crest s={s} team={time} size={16} /> {time.nome} · multa {moeda(c.multa)}</span>}
                  </span>
                  <span className="c-faixa"><small>Nota</small><b>{c.faixa[0]}–{c.faixa[1]}</b></span>
                  <span className="c-custo"><small>Assinatura</small><b>{moeda(custoCandidato(s, c))}</b><small>{moeda(p.sal)}/sem</small></span>
                  <span className="c-check">{on ? '✓' : '+'}</span>
                </button>
              );
            })}
          </div>
        </section>
        <aside className="pen-side">
          <section className="panel">
            <header className="panel-h"><h3>Seu elenco · {def.curto}</h3></header>
            <div className="slots">
              {preench.map((sl, i) => (
                <div key={i} className={'slot ' + (sl.p ? 'full' : '')}>
                  <span className="sl-r">{sl.lbl}</span>
                  {sl.p ? <><span className="sl-n"><Flag nat={sl.p.nat} /> {sl.p.nick}</span><button className="x" onClick={() => toggle(sl.p!.id)}>×</button></> : <span className="sl-n mut">vazio</span>}
                </div>
              ))}
            </div>
          </section>
          {ultimo && s.players[ultimo] && P.escolhidos.includes(ultimo) && (
            <section className="panel coach">
              <header className="panel-h"><h3>{s.tecnicos[g]?.nome}</h3><small>técnico</small></header>
              <div className="panel-b"><p>“Sobre o <b>{s.players[ultimo].nick}</b>: {comentarioTecnico(s, g, ultimo)}”</p></div>
            </section>
          )}
          {erro && <div className="erro">{erro}</div>}
          <button className="btn primary big" onClick={confirmar} disabled={jogos.some(x => validaPeneira(s, x) != null)}>
            {jogos.some(x => validaPeneira(s, x) != null) ? (validaPeneira(s, g) ?? 'Complete o outro jogo') : 'Fechar elencos e começar'}
          </button>
        </aside>
      </div>
    </div>
  );
}
