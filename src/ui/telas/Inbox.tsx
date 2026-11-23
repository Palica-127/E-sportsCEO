import { useEffect, useState } from 'react';
import { ArrowDown, CheckCheck, Gamepad2 } from 'lucide-react';
import { moeda, resolver } from '../../engine/org';
import { fmtData } from '../../engine/sim';
import type { Msg, State } from '../../engine/types';
import { act, useGame } from '../../store';
import { Crest, GameTag, Ico3D, Retrato, RetratoJogador } from '../common';
import { CAT, ico3dMsg, remetente } from '../icones';
import type { Tela } from '../Shell';

/** avatar do remetente (lista e detalhe) */
export function AvatarMsg({ s, m, size }: { s: State; m: Msg; size: number }) {
  const r = remetente(s, m);
  if (r.tipo === 'time') return <span className="av av-time"><Crest s={s} team={s.teams[r.id]} size={size * 0.8} /></span>;
  if (r.tipo === 'jogador') return <span className="av av-p"><RetratoJogador s={s} p={s.players[r.id]} size={size} /></span>;
  if (r.tipo === 'pessoa') return <span className="av av-p"><Retrato nome={r.nome} cor={s.org.cor} size={size} fone={false} sigla={s.org.sigla} /></span>;
  return <span className="av av-3d" style={{ ['--c' as string]: CAT[m.cat].cor }}><Ico3D n={r.n} size={size * 0.72} /></span>;
}

function Termos({ s, m }: { s: State; m: Msg }) {
  const linhas: [string, string][] = [];
  if (m.dados?.venda) { const v = m.dados.venda; linhas.push(['Jogador', s.players[v.pid]?.nick ?? ''], ['Comprador', s.teams[v.comprador]?.nome ?? ''], ['Oferta', moeda(v.oferta)]); }
  if (m.dados?.neg) {
    const n = s.negs.find(x => x.id === m.dados.neg);
    if (n) linhas.push(['Jogador', s.players[n.pid]?.nick ?? ''], ['Transferência', n.fee ? moeda(n.fee) : 'livre'], ['Salário oferecido', `${moeda(n.sal * 4)}/mês`], ['Contrato', `${n.anos} ano${n.anos > 1 ? 's' : ''} · ${n.papel}`], ...(n.pedido ? [['Pedido', n.etapa === 'clube' ? moeda(n.pedido) : `${moeda(n.pedido * 4)}/mês`] as [string, string]] : []));
  }
  if (m.cat === 'patrocinio' && m.dados?.semanal) linhas.push(['Valor', `${moeda(m.dados.semanal * 4)}/mês`], ['Duração', `${m.dados.semanas} semanas`], ['Total', moeda(m.dados.semanal * m.dados.semanas)]);
  if (!linhas.length) return null;
  return (
    <section className="sec termos">
      <header className="sec-h"><h3><span className="chev">»</span>Termos</h3></header>
      <div className="box kv-tab">{linhas.map(([k, v]) => <div key={k} className="kv"><span>{k}</span><b>{v}</b></div>)}</div>
    </section>
  );
}

export function Inbox({ abrir, ir }: { abrir?: string; ir: (t: Tela, a?: string) => void }) {
  const s = useGame()!;
  const [filtro, setFiltro] = useState<'todas' | 'decisoes' | 'novas'>('todas');
  const lista = s.inbox.filter(m => filtro === 'todas' || (filtro === 'decisoes' ? m.acoes && !m.resolvida : !m.lida));
  const [sel, setSel] = useState<string | undefined>(abrir ?? s.inbox.find(m => m.acoes && !m.resolvida)?.id ?? s.inbox[0]?.id);
  const [retorno, setRetorno] = useState('');
  const m = s.inbox.find(x => x.id === sel);
  useEffect(() => { if (m && !m.lida) act(() => { m.lida = true; }); }, [sel]);
  const quem = (x: Msg) => (x.dados?.pid && s.players[x.dados.pid] ? x.dados.pid : null);

  return (
    <div className={'mail ' + (sel ? 'aberto' : '')}>
      <div className="mail-col">
        <div className="mail-tools">
          {([['todas', 'Todas'], ['decisoes', 'Decisões'], ['novas', 'Não lidas']] as const).map(([k, n]) => <button key={k} className={filtro === k ? 'on' : ''} onClick={() => setFiltro(k)}>{n}{k === 'decisoes' && <ArrowDown size={16} color="#3fd17a" />}</button>)}
          <span className="sep" />
          <button className="acao" onClick={() => act(st => st.inbox.forEach(x => { x.lida = true; }))}><CheckCheck size={18} /> Ler todas</button>
        </div>
        <div className="mail-list">
          {lista.map(x => (
            <button key={x.id} style={{ ['--c' as string]: CAT[x.cat].cor }} className={'mail-it ' + (x.id === sel ? 'on ' : '') + (x.lida ? '' : 'nova ') + (x.acoes && !x.resolvida ? 'acao' : '')} onClick={() => { setSel(x.id); setRetorno(''); }}>
              <span className="mi-cat" style={{ ['--c' as string]: CAT[x.cat].cor }}><AvatarMsg s={s} m={x} size={46} /><span className="dot" /></span>
              <span style={{ minWidth: 0 }}>
                <span className="mi-t"><b>{x.de}</b><small>{x.dia === s.dia ? 'Hoje' : fmtData(x.dia, false)}</small></span>
                <span className="mi-s" style={{ display: 'block' }}>{x.titulo}</span>
                <span className="mi-p">{x.corpo.replace(/\n+/g, ' ')}</span>
              </span>
            </button>
          ))}
          {!lista.length && <p className="mut pad">Nada por aqui.</p>}
        </div>
      </div>
      <article className="mail-det box">
        {m ? (
          <>
            <button className="link voltar" onClick={() => setSel(undefined)}>← Mensagens</button>
            <img className="md-hero" src={`/img/3d/${ico3dMsg(m)}.webp`} alt="" />
            <header className="md-h" style={{ ['--c' as string]: CAT[m.cat].cor }}>
              <div className="md-av"><AvatarMsg s={s} m={m} size={106} /></div>
              <div>
                <h2>{m.de}</h2>
                <div className="mut">{m.cargo}{m.game && <> · <GameTag g={m.game} /></>}</div>
                <div className="md-s">{m.titulo}</div>
              </div>
              <div className="md-data">{fmtData(m.dia)}</div>
            </header>
            <div className="md-body">
              <p>Caro(a) CEO da <b>{s.org.nome}</b>,</p>
              {m.corpo.split('\n').map((p, i) => (p ? <p key={i}>{p}</p> : <br key={i} />))}
            </div>
            <Termos s={s} m={m} />
            {quem(m) && <button className="btn sm" onClick={() => ir('perfil', quem(m)!)}><Gamepad2 size={16} /> Ver perfil</button>}
            {m.dados?.tela && <button className="btn sm" onClick={() => ir(m.dados.tela)}>Abrir {m.dados.tela === 'historia' ? 'História' : m.dados.tela}</button>}
            {m.acoes && (
              <div className="md-acoes">
                {m.resolvida ? <span className="mut">Decisão: {m.resolvida === 'expirou' ? 'a proposta expirou' : m.acoes.find(a => a.id === m.resolvida)?.txt}</span> :
                  m.acoes.map(a => <button key={a.id} className={'btn ' + (a.tipo === 'bom' ? 'primary' : a.tipo === 'ruim' ? 'danger' : '')} onClick={() => setRetorno(act(st => resolver(st, m.id, a.id)))}>{a.txt}</button>)}
              </div>
            )}
            {retorno && <div className="retorno">{retorno}</div>}
          </>
        ) : <p className="mut">Nenhuma mensagem selecionada.</p>}
      </article>
    </div>
  );
}
