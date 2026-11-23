import { academyDe, moverBase } from '../../engine/academy';
import { CSSProperties, useState } from 'react';
import { Award, Search, Star } from 'lucide-react';
import { GAMES } from '../../engine/games';
import { moeda } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import { ATRIBUTOS, atributos, valorMercado } from '../../engine/world';
import { custoRescisao, dispensar, interesse, notaVista, pedidoSalario, renovar } from '../../engine/mercado';
import { TRACOS } from '../../engine/types';
import { act, useGame } from '../../store';
import { Chips, Crest, Estrelas, Flag, Gauge, Linha, Radar, RetratoJogador } from '../common';
import { Proposta } from './Mercado';
import type { Tela } from '../Shell';

function reputacao(ovr: number, idade: number, pot: number) {
  if (ovr >= 90) return 'Lenda';
  if (ovr >= 85) return 'Superstar';
  if (ovr >= 80) return 'Estrela';
  if (idade <= 20 && pot - ovr >= 8) return 'Promessa';
  if (ovr >= 72) return 'Profissional';
  return 'Novato';
}

export function Perfil({ pid, ir }: { pid: string; ir: (t: Tela, a?: string) => void }) {
  const s = useGame()!;
  const p = s.players[pid];
  const [aba, setAba] = useState<'attr' | 'contrato' | 'carreira'>('attr');
  const [msg, setMsg] = useState('');
  const [prop, setProp] = useState(false);
  const [rsal, setRsal] = useState(() => pedidoSalario(s, p));
  const [ranos, setRanos] = useState(2);
  if (!p) return <p className="mut">Jogador não encontrado.</p>;
  const t = s.teams[p.teamId ?? ''];
  const meu = !!t?.org;
  const g = p.game, def = GAMES[g];
  const nv = notaVista(s, p);
  const conhece = true;
  const attrs = atributos(p);
  const titular = t ? t.elenco.indexOf(p.id) < def.roles.length : false;
  const potE = Math.max(1, Math.min(5, (p.pot - 58) / 8));
  const bio = `${p.nick} tem ${p.idade} anos e joga como ${def.roleNomes[p.role].toLowerCase()} no ${def.nome}. ${t ? `Defende a ${t.nome}` : 'Está sem clube'}${p.jogos ? ` e já disputou ${p.jogos} partidas na carreira${p.mvps ? `, com ${p.mvps} prêmio${p.mvps > 1 ? 's' : ''} de MVP` : ''}` : ''}. Perfil ${TRACOS[p.traco].nome.toLowerCase()}: ${TRACOS[p.traco].desc.toLowerCase()}`;

  return (
    <div style={{ '--g': def.cor } as CSSProperties}>
      <div className="tabs">{([['attr', 'Atributos'], ['contrato', 'Contrato'], ['carreira', 'Carreira']] as const).map(([k, n]) => <button key={k} className={aba === k ? 'on' : ''} onClick={() => setAba(k)}>{n}</button>)}</div>
      <div className="perfil">
        <div className="box">
          <div className="pf-head">
            <RetratoJogador s={s} p={p} size={210} />
            <div>
              <h2><b>{p.nick}</b></h2>
              <div className="pf-l">{conhece ? <Estrelas v={Math.max(0.5, Math.min(5, (p.ovr - 58) / 8))} size={24} /> : <span className="mut">nota: {nv.txt}</span>}<span className="role" style={{ fontSize: 16 }}>{def.roleNomes[p.role]}</span></div>
              <div className="pf-l">{t ? <><Crest s={s} team={t} size={26} />{t.nome}</> : 'Agente livre'}</div>
              <div className="pf-l"><Flag nat={p.nat} />{(p.nat ?? '').toUpperCase()} · {p.idade} anos</div>
              <div className="pf-l"><Chips p={p} titular={t ? titular : false} /></div>
              {meu && academyDe(s, g) && (
                <div className="pf-l"><button className="btn sm" onClick={() => setMsg(act(st => moverBase(st, g, p.id)) ?? '')}>{t?.acad ? '⬆ Promover ao time principal' : '⬇ Mandar para a Academy'}</button></div>
              )}
              <div className="pf-gauges">
                <Gauge v={50 + p.forma * 16} label="Forma" size={92} />
                <Gauge v={p.moral} label="Moral" size={92} />
                <Gauge v={conhece ? p.ovr : nv.exata ? nv.a : 0} max={100} label="Nota" size={92} txt={conhece ? String(p.ovr) : nv.txt} />
              </div>
            </div>
          </div>
          <div className="two" style={{ marginTop: 10 }}>
            <div>
              <div className="pf-sec"><h4>Função</h4><span className="chip">{def.roles[p.role]} · {def.roleNomes[p.role]}</span></div>
              <div className="pf-sec"><h4>Potencial</h4>{conhece ? <Estrelas v={potE} size={24} /> : <span className="mut">Mande um olheiro para descobrir.</span>}</div>
            </div>
            <div className="pf-sec"><h4>Reputação</h4><span className="badge-rep"><Award />{reputacao(p.ovr, p.idade, p.pot)}</span></div>
          </div>
          <div className="pf-sec"><h4>Biografia</h4><p style={{ margin: 0, color: '#d4dae5' }}>{bio}</p></div>
        </div>

        <div>
          {aba === 'attr' && (
            <>
              <section className="sec">
                <header className="sec-h"><h3><span className="chev">»</span>Atributos</h3></header>
                <div className="box" style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
                  <Radar labels={ATRIBUTOS} vals={conhece ? attrs : attrs.map(() => 60)} size={330} />
                </div>
              </section>
              <section className="sec" style={{ marginTop: 20 }}>
                <header className="sec-h"><h3><span className="chev">»</span>Evolução da nota</h3></header>
                <div className="box">{meu ? <Linha vals={p.evo ?? []} w={700} h={110} /> : <p className="mut">Só acompanhamos a evolução dos nossos jogadores.</p>}
                  <div className="three" style={{ marginTop: 10 }}><div className="kv"><span>Partidas</span><b>{p.jogos}</b></div><div className="kv"><span>MVPs</span><b>{p.mvps}</b></div><div className="kv"><span>Perfil</span><b>{TRACOS[p.traco].nome}</b></div></div>
                </div>
              </section>
            </>
          )}
          {aba === 'contrato' && (
            <>
              <section className="sec">
                <header className="sec-h"><h3><span className="chev">»</span>Contrato</h3></header>
                <div className="box kv-tab">
                  <div className="kv"><span>Tipo</span><b>{t ? 'Integral' : 'Sem contrato'}</b></div>
                  <div className="kv"><span>Salário (mês)</span><b>{meu || conhece ? moeda(p.sal * 4) : '?'}</b></div>
                  <div className="kv"><span>Fim</span><b>{t ? `dez/${p.contrato}` : '-'}</b></div>
                  <div className="kv"><span>Valor de mercado</span><b>{conhece || meu ? moeda(valorMercado(p)) : '?'}</b></div>
                  {!meu && <div className="kv"><span>Interesse em vir</span><b>{`${s.conhecido[p.id]?.int ?? interesse(s, p, g)}%`}</b></div>}
                </div>
              </section>
              <section className="sec" style={{ marginTop: 20 }}>
                <header className="sec-h"><h3><span className="chev">»</span>Ações</h3></header>
                <div className="acoes2">
                  {meu ? (
                    <>
                      <div className="box">
                        <div className="acao-box"><span className="ldot" /><p>Renovar contrato. Pedido estimado: {moeda(pedidoSalario(s, p) * 4)}/mês.</p></div>
                        <div className="row" style={{ marginTop: 10 }}>
                          <input type="number" value={rsal * 4} step={1000} onChange={e => setRsal(Math.round(Number(e.target.value) / 4))} style={{ width: 130 }} />
                          <select value={ranos} onChange={e => setRanos(Number(e.target.value))}>{[1, 2, 3].map(a => <option key={a} value={a}>{a} ano{a > 1 ? 's' : ''}</option>)}</select>
                          <button className="btn sm" onClick={() => setMsg(act(st => renovar(st, p.id, rsal, ranos)).txt)}>Propor</button>
                        </div>
                      </div>
                      <div className="box">
                        <div className="acao-box"><span className="ldot" /><p>Rescindir o contrato custa {moeda(custoRescisao(s, p))}.</p><button className="btn danger sm" onClick={() => { const e = act(st => dispensar(st, p.id)); setMsg(e ?? `${p.nick} foi dispensado.`); }}>Dispensar</button></div>
                        <div className="acao-box" style={{ marginTop: 10 }}><span className={'ldot ' + (p.venda ? '' : 'off')} /><p>{p.venda ? 'Está à venda: clubes vão fazer propostas.' : 'Colocar à venda na próxima janela.'}</p><button className="btn sm" onClick={() => act(() => { p.venda = !p.venda; })}>{p.venda ? 'Tirar da venda' : 'Vender'}</button></div>
                        {!titular && <div className="acao-box" style={{ marginTop: 10 }}><span className="ldot" /><p>Prometer chances de jogar (moral sobe; não cumprir irrita).</p><button className="btn sm" onClick={() => act(() => { p.prometido = s.dia + 60; p.moral = Math.min(98, p.moral + 10); })}>Prometer</button></div>}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="box"><div className="acao-box"><span className="ldot" /><p>Fazer proposta de contratação.</p><button className="btn sm" onClick={() => setProp(true)}>Proposta</button></div></div>
                      <div className="box"><div className="acao-box"><span className={'ldot ' + (s.alvos.includes(p.id) ? '' : 'off')} /><p>{s.alvos.includes(p.id) ? 'Está na sua lista de alvos.' : 'Acompanhar na lista de alvos.'}</p><button className="btn sm" onClick={() => act(st => { st.alvos = st.alvos.includes(p.id) ? st.alvos.filter(x => x !== p.id) : [...st.alvos, p.id]; })}><Star size={14} /> {s.alvos.includes(p.id) ? 'Remover' : 'Seguir'}</button></div></div>
                    </>
                  )}
                </div>
              </section>
            </>
          )}
          {aba === 'carreira' && (
            <section className="sec">
              <header className="sec-h"><h3><span className="chev">»</span>Carreira</h3></header>
              <div className="box">
                <ul className="carreira">{(p.hist ?? []).slice().reverse().map((h, i) => <li key={i}><small>{fmtData(h.d, false)}</small><span>{h.t}</span></li>)}</ul>
                {!(p.hist ?? []).length && <p className="mut">Nada registrado nesta carreira ainda.</p>}
              </div>
            </section>
          )}
          {msg && <div className="retorno">{msg}</div>}
          {!meu && t && <button className="link" style={{ marginTop: 12 }} onClick={() => ir('competicoes')}>Ver competições ›</button>}
        </div>
      </div>
      {prop && <Proposta pid={p.id} onFechar={() => setProp(false)} />}
    </div>
  );
}
