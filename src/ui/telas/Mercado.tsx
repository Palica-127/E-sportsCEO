import { CSSProperties, useMemo, useState } from 'react';
import { Search, Star } from 'lucide-react';
import { GAMES, GameId, regioes } from '../../engine/games';
import { moeda } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import { valorMercado } from '../../engine/world';
import { abrirNeg, candidatosRosto, convidarRosto, exigenciasRosto, interesse, janelaAberta, maxElenco, notaVista, observar, pedidoSalario, proximaJanela, valorClube } from '../../engine/mercado';
import { act, useGame } from '../../store';
import { Crest, EstrelasNota, Flag, Ovr, Panel, RetratoJogador } from '../common';
import type { Tela } from '../Shell';

export function Proposta({ pid, onFechar }: { pid: string; onFechar: () => void }) {
  const s = useGame()!;
  const p = s.players[pid];
  const conhece = s.conhecido[pid]?.n === 2;
  const sugFee = p.teamId ? Math.round(valorClube(s, p) * (conhece ? 1 : 0.9) / 1000) * 1000 : 0;
  const [fee, setFee] = useState(sugFee);
  const [sal, setSal] = useState(pedidoSalario(s, p) * 4);
  const [anos, setAnos] = useState(2);
  const [papel, setPapel] = useState<'titular' | 'reserva'>('titular');
  const [erro, setErro] = useState('');
  const t = p.teamId ? s.teams[p.teamId] : null;
  function enviar() {
    const e = act(st => abrirNeg(st, pid, { fee, sal: Math.round(sal / 4), anos, papel }));
    if (e) setErro(e); else onFechar();
  }
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal ficha">
        <h2>Proposta <small>{p.nick}</small></h2>
        <div className="fi-h"><RetratoJogador s={s} p={p} size={70} /><div><b style={{ fontSize: 20 }}>{p.nick}</b><div className="mut">{GAMES[p.game].roleNomes[p.role]} · {p.idade} anos · {t ? t.nome : 'agente livre'}</div></div><Ovr v={notaVista(s, p).txt} /></div>
        <div className="form-neg">
          {t && <label>Valor ao clube (R$)<input type="number" step={10000} value={fee} onChange={e => setFee(Number(e.target.value))} /></label>}
          <label>Salário mensal (R$)<input type="number" step={1000} value={sal} onChange={e => setSal(Number(e.target.value))} /></label>
          <label>Contrato<select value={anos} onChange={e => setAnos(Number(e.target.value))}>{[1, 2, 3].map(a => <option key={a} value={a}>{a} ano{a > 1 ? 's' : ''}</option>)}</select></label>
          <label>Papel<select value={papel} onChange={e => setPapel(e.target.value as 'titular' | 'reserva')}><option value="titular">Titular</option><option value="reserva">Reserva</option></select></label>
          <p className="dica">
            {conhece ? <>Valor estimado: <b>{moeda(valorMercado(p))}</b>. Pedido salarial: <b>~{moeda(pedidoSalario(s, p) * 4)}/mês</b>. Interesse: <b>{s.conhecido[pid].int ?? interesse(s, p, p.game)}%</b>.</> : <>Sem relatório de olheiro: os valores são chutes. Observar antes ajuda a não pagar demais.</>}
            <br />{t ? (janelaAberta(s) ? 'Janela aberta.' : `Janela fechada: abre em ${fmtData(proximaJanela(s), false)}.`) : 'Agente livre: pode assinar a qualquer momento.'} Caixa: {moeda(s.org.caixa)}.
          </p>
        </div>
        {erro && <div className="erro" style={{ marginTop: 12 }}>{erro}</div>}
        <div className="modal-f"><button className="btn ghost" onClick={onFechar}>Cancelar</button><button className="btn primary" onClick={enviar}>Enviar proposta</button></div>
      </div>
    </div>
  );
}

export function Mercado({ ir, aba: aba0 }: { ir: (t: Tela, a?: string) => void; aba?: string }) {
  const s = useGame()!;
  const [aba, setAba] = useState(aba0 ?? 'buscar');
  const [g, setG] = useState<GameId>(s.jogos[0]);
  const [role, setRole] = useState(-1);
  const [reg, setReg] = useState('');
  const [status, setStatus] = useState<'todos' | 'livres' | 'time'>('todos');
  const [busca, setBusca] = useState('');
  const [prop, setProp] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [rostoSel, setRostoSel] = useState<string | null>(null);
  const lista = useMemo(() => {
    const ps = Object.values(s.players).filter(p => p.game === g && !s.teams[p.teamId ?? '']?.org && (role < 0 || p.role === role)
      && (!reg || s.teams[p.teamId ?? '']?.region === reg) && (status === 'todos' || (status === 'livres' ? !p.teamId : !!p.teamId))
      && (!busca || p.nick.toLowerCase().includes(busca.toLowerCase())));
    return ps.map(p => ({ p, nv: notaVista(s, p) })).sort((a, b) => (b.nv.b + b.nv.a) - (a.nv.b + a.nv.a) || b.p.ovr - a.p.ovr).slice(0, 80);
  }, [s, g, role, reg, status, busca, s.dia, s.conhecido]);
  const negs = s.negs.slice().reverse();
  const abertas = negs.filter(n => n.etapa === 'clube' || n.etapa === 'jogador').length;

  const Linha = ({ pid }: { pid: string }) => {
    const p = s.players[pid]; const nv = notaVista(s, p); const t = p.teamId ? s.teams[p.teamId] : null;
    const k = s.conhecido[pid];
    return (
      <tr className="clk" onClick={() => ir('perfil', pid)}>
        <td className="tm"><RetratoJogador s={s} p={p} size={34} /><Flag nat={p.nat} />{p.nick}</td>
        <td><span className="role">{GAMES[p.game].roles[p.role]}</span></td>
        <td>{p.idade}</td>
        <td className="tm">{t ? <><Crest s={s} team={t} size={20} />{t.nome}</> : <span className="mut">Livre</span>}</td>
        <td><Ovr v={nv.txt} /></td>
        <td>{k?.int != null ? <span className={'int ' + (k.int >= 65 ? 'hi' : k.int >= 40 ? 'md' : 'lo')}>{k.int}%</span> : <span className="mut">?</span>}</td>
        <td>{k ? moeda(valorMercado(p)) : <span className="mut">?</span>}</td>
        <td onClick={e => e.stopPropagation()}><div className="acts">
          <button className="btn ghost sm" title="Mandar olheiro" onClick={() => setMsg(act(st => observar(st, pid)) ?? `Olheiro a caminho para observar ${p.nick}.`)}><Search size={14} /></button>
          <button className="btn ghost sm" title="Lista de alvos" onClick={() => act(st => { st.alvos = st.alvos.includes(pid) ? st.alvos.filter(x => x !== pid) : [...st.alvos, pid]; })}><Star size={14} fill={s.alvos.includes(pid) ? '#f2c037' : 'none'} /></button>
          <button className="btn sm" onClick={() => setProp(pid)}>Proposta</button>
        </div></td>
      </tr>
    );
  };
  const cabec = <thead><tr><th className="tm">Jogador</th><th>Função</th><th>Idade</th><th className="tm">Time</th><th>Nota</th><th>Interesse</th><th>Valor</th><th /></tr></thead>;

  return (
    <div style={{ '--g': GAMES[g].cor } as CSSProperties}>
      <div className="tabs">
        {([['buscar', 'Buscar jogadores'], ['negs', `Negociações${abertas ? ` (${abertas})` : ''}`], ['alvos', `Lista de alvos (${s.alvos.length})`], ['rosto', 'Rosto da Org']] as const).map(([k, n]) => <button key={k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{n}</button>)}
        <span style={{ marginLeft: 'auto', alignSelf: 'center' }} className={janelaAberta(s) ? 'pos' : 'mut'}>{janelaAberta(s) ? '● Janela aberta' : `Janela fechada · abre ${fmtData(proximaJanela(s), false)}`}</span>
      </div>
      {msg && <div className="retorno" style={{ marginBottom: 12 }}>{msg}</div>}

      {aba === 'buscar' && (
        <>
          <div className="filtros">
            <div className="seg">{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} onClick={() => { setG(x); setRole(-1); setReg(''); }}>{GAMES[x].curto}</button>)}</div>
            <input placeholder="Buscar por nick" value={busca} onChange={e => setBusca(e.target.value)} />
            <select value={role} onChange={e => setRole(Number(e.target.value))}><option value={-1}>Todas as funções</option>{GAMES[g].roles.map((r, i) => <option key={r} value={i}>{GAMES[g].roleNomes[i]}</option>)}</select>
            <select value={reg} onChange={e => setReg(e.target.value)}><option value="">Todas as regiões</option>{regioes(g).map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select>
            <select value={status} onChange={e => setStatus(e.target.value as typeof status)}><option value="todos">Todos</option><option value="livres">Agentes livres</option><option value="time">Com time</option></select>
            <span className="mut">Elenco: {s.teams[s.orgTeams[g]!].elenco.length}/{maxElenco(g)}</span>
          </div>
          <Panel solto><div className="box" style={{ padding: 0 }}><table className="tab merc-tab">{cabec}<tbody>{lista.map(x => <Linha key={x.p.id} pid={x.p.id} />)}</tbody></table></div></Panel>
          <p className="mut">Notas com “?” são desconhecidas: mande um olheiro. Jogadores famosos aparecem com uma faixa aproximada.</p>
        </>
      )}

      {aba === 'negs' && (
        <Panel ico="aperto" title="Negociações">
          {!negs.length && <p className="mut">Nenhuma negociação ainda. Faça propostas na aba Buscar ou no perfil do jogador.</p>}
          {negs.map(n => {
            const p = s.players[n.pid];
            if (!p) return null;
            const est = n.etapa;
            return (
              <div key={n.id} className="neg-card">
                <RetratoJogador s={s} p={p} size={56} />
                <div>
                  <b style={{ fontSize: 17 }}>{p.nick}</b> <span className="mut">· {GAMES[n.game].curto} · {n.fee ? moeda(n.fee) : 'livre'} · {moeda(n.sal * 4)}/mês · {n.anos} ano(s) · {n.papel}{n.rosto ? ' · ⭐ Rosto da Org' : ''}</span>
                  <div className="etapas">
                    <span className={est === 'clube' ? 'on' : est === 'cancelada' && !n.fee ? 'no' : 'ok'}>Clube</span>›
                    <span className={est === 'jogador' ? 'on' : est === 'fechada' ? 'ok' : est === 'cancelada' ? 'no' : ''}>Jogador</span>›
                    <span className={est === 'fechada' ? 'ok' : est === 'cancelada' ? 'no' : ''}>{est === 'cancelada' ? 'Encerrada' : 'Assinatura'}</span>
                    {n.pedido != null && <span className="on">contraproposta: veja as mensagens</span>}
                    {(est === 'clube' || est === 'jogador') && n.pedido == null && <span>resposta em {Math.max(0, n.resp - s.dia)} dia(s)</span>}
                  </div>
                </div>
                {(est === 'clube' || est === 'jogador') && <button className="btn danger sm" onClick={() => act(() => { n.etapa = 'cancelada'; })}>Cancelar</button>}
              </div>
            );
          })}
        </Panel>
      )}

      {aba === 'alvos' && (
        <Panel solto>
          {s.alvos.length ? <div className="box" style={{ padding: 0 }}><table className="tab merc-tab">{cabec}<tbody>{s.alvos.filter(id => s.players[id] && !s.teams[s.players[id].teamId ?? '']?.org).map(id => <Linha key={id} pid={id} />)}</tbody></table></div> : <div className="box"><p className="mut">Marque jogadores com ★ para acompanhar aqui.</p></div>}
        </Panel>
      )}

      {aba === 'rosto' && (
        <>
          <div className="seg" style={{ marginBottom: 14 }}>{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} onClick={() => { setG(x); setRostoSel(null); }}>{GAMES[x].nome}</button>)}</div>
          {s.rosto[g] && s.players[s.rosto[g]!] ? (
            <Panel ico="estrela" title={`Rosto da Org · ${GAMES[g].curto}`}>
              <div className="row"><RetratoJogador s={s} p={s.players[s.rosto[g]!]} size={120} /><div><h2>{s.players[s.rosto[g]!].nick}</h2><p className="mut">É a cara da {s.org.nome} no {GAMES[g].nome}: atrai seguidores e patrocínio, mas cobra resultado. Se a confiança da diretoria cair muito, ele vai reclamar.</p><button className="btn sm" onClick={() => ir('perfil', s.rosto[g]!)}>Ver perfil</button></div></div>
            </Panel>
          ) : (
            <div className="rosto-c">
              <Panel ico="coroa" title="Estrelas possíveis">
                {candidatosRosto(s, g).map(p => (
                  <button key={p.id} className={'team-row ' + (rostoSel === p.id ? 'on' : '')} style={{ width: '100%', marginBottom: 4 }} onClick={() => setRostoSel(p.id)}>
                    <RetratoJogador s={s} p={p} size={40} /><span className="tn">{p.nick}<br /><small>{s.teams[p.teamId!]?.nome}</small></span><EstrelasNota ovr={p.ovr} size={12} />
                  </button>
                ))}
              </Panel>
              <Panel ico="contrato" title="Exigências">
                {!rostoSel ? <p className="mut">Escolha uma estrela para ver o que ela exige para assinar com a {s.org.nome}. Cumpra a lista ao longo da carreira e faça o convite.</p> : (() => {
                  const p = s.players[rostoSel];
                  const req = exigenciasRosto(s, g, p);
                  return (
                    <>
                      <div className="row" style={{ marginBottom: 12 }}><RetratoJogador s={s} p={p} size={90} /><div><h2>{p.nick}</h2><div className="mut">{GAMES[g].roleNomes[p.role]} · {p.idade} anos · {s.teams[p.teamId!]?.nome}</div></div></div>
                      {req.map((r, i) => <div key={i} className="req"><i className={r.ok ? 'ok' : 'no'}>{r.ok ? '✓' : '✕'}</i>{r.txt}</div>)}
                      <div className="row" style={{ marginTop: 14 }}><button className="btn primary" disabled={req.some(r => !r.ok)} onClick={() => setMsg(act(st => convidarRosto(st, g, p.id)) ?? `Convite enviado para ${p.nick}. A resposta chega pelas mensagens.`)}>Fazer o convite</button><span className="mut">{req.filter(r => r.ok).length}/{req.length} cumpridas</span></div>
                    </>
                  );
                })()}
              </Panel>
            </div>
          )}
        </>
      )}
      {prop && <Proposta pid={prop} onFechar={() => setProp(null)} />}
    </div>
  );
}
