import { useState } from 'react';
import { FAIXAS, LOCAIS, LOTES, PRECOS_SOCIO, PRODUTOS, agendarEvento, alvoSocios, ativarSocio, custoLote, demanda, liquidar, lancar, marca, mudarFaixa, precoVenda, publicoPrevisto } from '../../engine/marca';
import { moeda } from '../../engine/org';
import { fmtData, proximosJogosOrg } from '../../engine/sim';
import type { FaixaPreco } from '../../engine/types';
import { act, useGame } from '../../store';
import { Crest, Escudo, Gauge, Ico3D, Linha, Panel } from '../common';

export function MarcaTela() {
  const s = useGame()!;
  const [aba, setAba] = useState<'loja' | 'socio' | 'eventos'>('loja');
  const [aviso, setAviso] = useState('');
  const m = s.marca ?? { hype: 30, produtos: {}, eventos: [], hist: [] };
  const faz = (f: () => string | null | void, ok?: string) => { const r = act(f); setAviso(typeof r === 'string' ? r : ok ?? ''); };
  const totLoja = m.hist.reduce((a, h) => a + h.loja, 0), totSoc = m.hist.reduce((a, h) => a + h.socio, 0);

  return (
    <div>
      <div className="marca-top">
        <div className="mt-brand">{s.org.logo ? <img src={s.org.logo} width={84} height={84} /> : <Escudo sigla={s.org.sigla} cor={s.org.cor} size={84} />}<div><h2>{s.org.nome}</h2><small>{s.org.fas.toLocaleString('pt-BR')} seguidores · reputação {s.org.rep}</small></div></div>
        <Gauge v={Math.round(m.hype)} label="HYPE" size={104} />
        <div className="mt-kpi"><span>Loja (últimas 52 sem.)</span><b>{moeda(totLoja)}</b></div>
        <div className="mt-kpi"><span>Sócio-torcedor</span><b>{m.socio ? `${m.socio.membros.toLocaleString('pt-BR')} sócios` : 'desligado'}</b><small>{moeda(totSoc)} no período</small></div>
        <p className="mut mt-dica">O hype sobe com vitórias, títulos, Rosto da Org e eventos lotados, e cai com derrotas. Ele multiplica vendas, sócios e público.</p>
      </div>
      <div className="tabs">{([['loja', 'Loja'], ['socio', 'Sócio-torcedor'], ['eventos', 'Eventos e ingressos']] as const).map(([k, n]) => <button key={k} className={aba === k ? 'on' : ''} onClick={() => { setAba(k); setAviso(''); }}>{n}</button>)}</div>
      {aviso && <div className="alerta ok" style={{ marginBottom: 12 }}><b>!</b>{aviso}</div>}

      {aba === 'loja' && (
        <div className="loja-grid">
          {Object.entries(PRODUTOS).map(([id, P]) => <Produto key={id} id={id} faz={faz} />)}
          {m.hist.length > 2 && <Panel title="Vendas da loja por semana" className="span2"><Linha vals={m.hist.map(h => Math.round(h.loja / 1000))} w={1200} h={110} /><p className="mut">Em R$ mil.</p></Panel>}
        </div>
      )}

      {aba === 'socio' && <Socio faz={faz} />}
      {aba === 'eventos' && <Eventos faz={faz} />}
    </div>
  );
}

function Produto({ id, faz }: { id: string; faz: (f: () => string | null | void, ok?: string) => void }) {
  const s = useGame()!;
  const P = PRODUTOS[id], st = s.marca?.produtos[id];
  const [lote, setLote] = useState(P.lote ? Math.min(500, P.lote) : 500);
  const [faixa, setFaixa] = useState<FaixaPreco>(st?.preco ?? 'padrao');
  const bloq = P.req?.(s);
  const dem = demanda(s, id, st?.preco ?? faixa);
  const custo = custoLote(s, id, lote);
  const margem = precoVenda(id, faixa) - P.custo;
  return (
    <div className={'produto ' + (bloq ? 'bloq' : '')}>
      <div className="pr-ico"><Ico3D n={P.ico} size={56} /></div>
      <div className="pr-info">
        <b>{P.nome}</b>
        <small>{P.desc}</small>
        {st ? (
          <div className="pr-st">
            <span>Estoque <b>{st.estoque.toLocaleString('pt-BR')}</b></span>
            <span>Vendeu na semana <b>{st.semana ?? 0}</b></span>
            <span>Total <b>{st.vendidos.toLocaleString('pt-BR')}</b> · {moeda(st.receita)}</span>
            {st.chegando && <span className="chip2 meh">Lote de {st.chegando.qtd} chega em {fmtData(st.chegando.dia, false)}</span>}
          </div>
        ) : <div className="pr-st"><span className="mut">Ainda não lançado</span></div>}
        <div className="pr-prev">Demanda prevista: <b>~{Math.round(dem)} por semana</b> · preço {moeda(precoVenda(id, st?.preco ?? faixa))} · margem {moeda(margem)}/un.</div>
      </div>
      <div className="pr-acoes">
        {bloq ? <span className="mut">🔒 {bloq}</span> : (
          <>
            <div className="seg">{(Object.keys(FAIXAS) as FaixaPreco[]).map(f => <button key={f} className={(st?.preco ?? faixa) === f ? 'on' : ''} onClick={() => { setFaixa(f); if (st) faz(() => mudarFaixa(s, id, f), `Preço de ${P.nome}: ${FAIXAS[f].nome.toLowerCase()}.`); }}>{FAIXAS[f].nome}</button>)}</div>
            <div className="seg">{LOTES.filter(l => !P.lote || l <= P.lote).map(l => <button key={l} className={lote === l ? 'on' : ''} onClick={() => setLote(l)}>{l >= 1000 ? `${l / 1000} mil` : l}</button>)}</div>
            <button className="btn primary" disabled={!!st?.chegando} onClick={() => faz(() => lancar(s, id, lote, st?.preco ?? faixa), `Lote encomendado. Chega em 14 dias.`)}>{st ? 'Encomendar lote' : 'Lançar'} · {moeda(custo)}</button>
            {st && st.estoque > 0 && <button className="btn ghost sm" onClick={() => faz(() => liquidar(s, id))}>Liquidar metade do estoque</button>}
          </>
        )}
      </div>
    </div>
  );
}

function Socio({ faz }: { faz: (f: () => string | null | void, ok?: string) => void }) {
  const s = useGame()!;
  const so = s.marca?.socio;
  return (
    <div className="grid2">
      <Panel title="Programa de sócio-torcedor">
        <p>Fãs pagam uma mensalidade e ganham conteúdo exclusivo, desconto na loja e prioridade nos eventos. É receita que entra toda semana. Cerca de 25% vai para os benefícios.</p>
        <div className="socio-planos">
          {PRECOS_SOCIO.map(p => (
            <button key={p} className={'plano ' + (so?.preco === p ? 'on' : '')} onClick={() => faz(() => ativarSocio(s, p), so ? 'Mensalidade atualizada.' : 'Programa lançado! Os sócios chegam ao longo das semanas.')}>
              <b>{moeda(p).replace(' mil', '')}<small>/mês</small></b>
              <span>{p < 20 ? 'Acessível: mais sócios' : p < 40 ? 'Equilibrado' : 'Premium: poucos e fiéis'}</span>
              <small>Meta: ~{alvoSocios(s, p).toLocaleString('pt-BR')} sócios</small>
            </button>
          ))}
        </div>
        {!so && <p className="mut">Montar o programa custa R$ 20 mil. O estúdio de conteúdo na sede aumenta a adesão em 25%.</p>}
      </Panel>
      <Panel title="Situação">
        {so ? (
          <>
            <div className="kv"><span>Sócios</span><b>{so.membros.toLocaleString('pt-BR')}</b></div>
            <div className="kv"><span>Meta com o hype atual</span><b>{alvoSocios(s, so.preco).toLocaleString('pt-BR')}</b></div>
            <div className="kv"><span>Receita líquida por semana</span><b className="pos">{moeda(Math.round(so.membros * so.preco * 0.75 / 4.3))}</b></div>
            <div className="kv"><span>Desde</span><b>{fmtData(so.desde, false)}</b></div>
          </>
        ) : <p className="mut">Programa desligado.</p>}
      </Panel>
    </div>
  );
}

function Eventos({ faz }: { faz: (f: () => string | null | void, ok?: string) => void }) {
  const s = useGame()!;
  const m = marca(s);
  const jogos = proximosJogosOrg(s, 12).filter(j => j.dia > s.dia && j.dia <= s.dia + 70 && !m.eventos.some(e => e.mid === j.id));
  const [mid, setMid] = useState(jogos[0]?.id ?? '');
  const [local, setLocal] = useState('bar');
  const [preco, setPreco] = useState(LOCAIS.bar.preco);
  const L = LOCAIS[local];
  const prev = mid ? publicoPrevisto(s, mid, local, preco) : 0;
  return (
    <div className="grid2">
      <Panel title="Organizar evento">
        <p className="mut">Watch party ou fan fest num jogo da org: você aluga o local, vende ingresso e fatura com consumo e loja. Final e internacional enchem mais. Vitória no dia aumenta o consumo.</p>
        <label className="lbl">Partida</label>
        {jogos.length === 0 ? <p className="mut">Nenhuma partida da org nos próximos 70 dias.</p> : (
          <select value={mid} onChange={e => setMid(e.target.value)}>
            {jogos.map(j => <option key={j.id} value={j.id}>{fmtData(j.dia, false)} · {s.teams[j.a].sigla} x {s.teams[j.b].sigla} · {s.torneios[j.tor]?.nome} ({j.label})</option>)}
          </select>
        )}
        <label className="lbl">Local</label>
        <div className="locais">
          {Object.entries(LOCAIS).map(([k, x]) => (
            <button key={k} className={'local ' + (local === k ? 'on' : '') + (s.org.rep < x.rep ? ' bloq' : '')} style={{ backgroundImage: `linear-gradient(180deg, rgba(10,14,22,.15), rgba(10,14,22,.92) 70%), url(/locais/${k}.webp)` }} onClick={() => { setLocal(k); setPreco(x.preco); }}>
              <b>{x.nome}</b><span>{x.cap.toLocaleString('pt-BR')} lugares</span><small>{moeda(x.custo)}{x.rep ? ` · rep ${x.rep}` : ''}</small>
            </button>
          ))}
        </div>
        <label className="lbl">Ingresso: {moeda(preco).replace(' mil', '')}</label>
        <input type="range" min={Math.round(L.preco * 0.4)} max={Math.round(L.preco * 2)} step={5} value={preco} onChange={e => setPreco(Number(e.target.value))} />
        <div className="ev-prev">
          <div><span>Público previsto</span><b>{prev.toLocaleString('pt-BR')} / {L.cap.toLocaleString('pt-BR')}</b></div>
          <div><span>Ocupação</span><b className={prev / L.cap >= 0.6 ? 'pos' : prev / L.cap < 0.35 ? 'neg' : ''}>{Math.round(prev / L.cap * 100)}%</b></div>
          <div><span>Ingressos</span><b>{moeda(prev * preco)}</b></div>
          <div><span>Custo do local</span><b className="neg">{moeda(L.custo)}</b></div>
        </div>
        <button className="btn primary" disabled={!mid} onClick={() => faz(() => agendarEvento(s, mid, local, preco), 'Evento marcado! O resultado chega na caixa de entrada no dia do jogo.')}>Marcar evento · {moeda(L.custo)}</button>
      </Panel>
      <Panel title="Agenda e histórico">
        {m.eventos.length === 0 ? <p className="mut">Nenhum evento ainda.</p> : m.eventos.slice().reverse().map(e => {
          const j = s.matches[e.mid];
          return (
            <div key={e.id} className="ev-l">
              <span>{fmtData(e.dia, false)}</span>
              {j && <span className="ev-j"><Crest s={s} team={s.teams[j.a]} size={20} />x<Crest s={s} team={s.teams[j.b]} size={20} /></span>}
              <b>{LOCAIS[e.local].nome}</b>
              {e.res ? <span className={e.res.publico / e.res.cap >= 0.6 ? 'pos' : 'neg'}>{e.res.publico.toLocaleString('pt-BR')} pessoas · {moeda(e.res.receita)}</span> : <span className="chip2 meh">Agendado</span>}
            </div>
          );
        })}
      </Panel>
    </div>
  );
}
