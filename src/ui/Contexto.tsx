import type { ReactNode } from 'react';
import { GAMES } from '../engine/games';
import type { ReactElement } from 'react';
import { notaVista } from '../engine/mercado';
import { custosFixos, folhaSemanal, maxPatro, moeda, receitasFixas } from '../engine/org';
import { anoDe, jogosDoTorneio } from '../engine/sim';
import type { Msg, Player, State } from '../engine/types';
import { humor, valorMercado } from '../engine/world';
import { TabelaLiga } from './Bracket';
import { Bar, Crest, EstrelasNota, Flag, Ico3D, RetratoJogador, NomeTime, NomeJogador } from './common';

/** painéis de contexto da mensagem aberta: dão os números para a decisão */
export function Contexto({ s, m, ir }: { s: State; m: Msg; ir: (t: any, a?: string) => void }) {
  const blocos: ReactElement[] = [];
  const d = m.dados ?? {};
  // jogador envolvido
  let pid: string | undefined;
  if (d.neg) pid = s.negs.find(n => n.id === d.neg)?.pid;
  pid ??= d.venda?.pid ?? d.sair ?? d.pid;
  if (pid && s.players[pid]) blocos.push(<CardJogador key="j" s={s} p={s.players[pid]} m={m} ir={ir} />);
  if (d.conflito) for (const id of d.conflito as string[]) if (s.players[id]) blocos.push(<CardJogador key={id} s={s} p={s.players[id]} m={m} ir={ir} />);
  if (d.tor && s.torneios[d.tor]) blocos.push(<CardTorneio key="t" s={s} m={m} />);
  if (m.cat === 'patrocinio' && d.semanal) blocos.push(<CardPatro key="p" s={s} m={m} />);
  if (m.cat === 'financas' || d.emprestimo || d.custo) blocos.push(<CardCaixa key="c" s={s} />);
  if (!blocos.length) return null;
  return <div className="ctx">{blocos}</div>;
}

const Kpi = ({ ico, rot, v, cls }: { ico: string; rot: string; v: ReactNode; cls?: string }) => (
  <div className="ctx-kpi"><Ico3D n={ico} size={34} /><div><span>{rot}</span><b className={cls}>{v}</b></div></div>
);

function CardJogador({ s, p, m, ir }: { s: State; p: Player; m: Msg; ir: (t: any, a?: string) => void }) {
  const t = s.teams[p.teamId ?? ''];
  const nv = notaVista(s, p);
  const neg = m.dados?.neg ? s.negs.find(n => n.id === m.dados.neg) : null;
  const h = humor(p);
  const g = GAMES[p.game];
  return (
    <section className="ctx-card">
      <header><h4>» Ficha do jogador</h4><button className="link" onClick={() => ir('perfil', p.id)}>Abrir perfil ›</button></header>
      <div className="cj">
        <RetratoJogador s={s} p={p} size={92} />
        <div className="cj-info">
          <b>{p.nick}</b>
          <small><Flag nat={p.nat} /> {g.roleNomes[p.role]} · {p.idade} anos · {t ? <><Crest s={s} team={t} size={16} /> <NomeTime s={s} id={t.id} /></> : 'Sem time'}</small>
          <EstrelasNota ovr={nv.exata ? nv.a : Math.round((nv.a + nv.b) / 2)} />
          <div className="cj-barras">
            <span>Forma</span><Bar v={50 + p.forma * 10} cor={p.forma >= 0 ? '#3fd17a' : '#e5484d'} />
            <span>Moral</span><Bar v={p.moral} cor={p.moral >= 60 ? '#3fd17a' : p.moral >= 40 ? '#f5b83d' : '#e5484d'} />
          </div>
          <small className={'chip2 ' + h.cls}>{h.txt}</small>
        </div>
      </div>
      <div className="ctx-kpis">
        <Kpi ico="estrela" rot="Nota" v={nv.txt} />
        <Kpi ico="nota" rot="Salário atual" v={`${moeda(p.sal * 4)}/mês`} />
        {neg && <Kpi ico="contrato" rot="Proposta" v={`${moeda(neg.sal * 4)}/mês`} cls={neg.sal > p.sal ? 'pos' : ''} />}
        <Kpi ico="dinheiro" rot="Valor de mercado" v={moeda(valorMercado(p))} />
        <Kpi ico="calendario" rot="Contrato até" v={String(p.contrato)} cls={p.contrato <= anoDe(s.dia) ? 'neg' : ''} />
        <Kpi ico="medalha" rot="Carreira" v={`${p.titulos ?? 0} títulos · ${p.mvps} MVPs`} />
      </div>
    </section>
  );
}

function CardTorneio({ s, m }: { s: State; m: Msg }) {
  const tor = s.torneios[m.dados.tor];
  const org = s.orgTeams[tor.game]!;
  const jogos = jogosDoTorneio(s, tor.id).filter(x => x.sa != null && (x.a === org || x.b === org));
  let v = 0, dd = 0, mv = 0, md = 0;
  const mvps: Record<string, number> = {};
  for (const x of jogos) {
    const meus = x.a === org ? x.sa! : x.sb!, deles = x.a === org ? x.sb! : x.sa!;
    if (meus > deles) v++; else dd++;
    mv += meus; md += deles;
    if (x.mvp && s.players[x.mvp]?.teamId === org) mvps[x.mvp] = (mvps[x.mvp] ?? 0) + 1;
  }
  const destaque = Object.entries(mvps).sort((a, b) => b[1] - a[1])[0];
  const temTabela = tor.stages[0]?.tipo === 'rr' && tor.kind !== 'acesso';
  const camp = tor.campeao ? s.teams[tor.campeao] : null, vice = tor.vice ? s.teams[tor.vice] : null;
  return (
    <section className="ctx-card" style={{ ['--g' as string]: GAMES[tor.game].cor }}>
      <header><h4>» {tor.nome}</h4>{m.dados.fase && <span className="chip2 ok">{m.dados.fase}</span>}</header>
      {(camp || vice) && (
        <div className="podio">
          {camp && <div className="pd ouro"><Ico3D n="trofeu" size={40} /><Crest s={s} team={camp} size={44} /><b><NomeTime s={s} id={camp.id} /></b><small>Campeão</small></div>}
          {vice && <div className="pd"><Ico3D n="medalha" size={34} /><Crest s={s} team={vice} size={38} /><b><NomeTime s={s} id={vice.id} /></b><small>Vice</small></div>}
        </div>
      )}
      <div className="ctx-kpis">
        {jogos.length > 0 && <Kpi ico="controle" rot="Campanha" v={`${v}V ${dd}D · mapas ${mv}-${md}`} />}
        {destaque && <Kpi ico="estrela" rot="Destaque da org" v={<><NomeJogador s={s} id={destaque[0]} /> ({destaque[1]} MVPs)</>} />}
        {m.dados.premio ? <Kpi ico="dinheiro" rot="Premiação" v={moeda(m.dados.premio)} cls="pos" /> : null}
        {m.dados.rep != null && <Kpi ico="coroa" rot="Reputação" v={`${m.dados.rep >= 0 ? '+' : ''}${m.dados.rep}`} cls={m.dados.rep >= 0 ? 'pos' : 'neg'} />}
        {m.dados.dc != null && <Kpi ico="predio-classico" rot="Confiança" v={`${m.dados.dc >= 0 ? '+' : ''}${m.dados.dc}`} cls={m.dados.dc >= 0 ? 'pos' : 'neg'} />}
      </div>
      {temTabela && <div className="ctx-tab"><TabelaLiga s={s} tor={tor} compacta /></div>}
    </section>
  );
}

function CardPatro({ s, m }: { s: State; m: Msg }) {
  const atual = s.patro;
  const media = atual.length ? atual.reduce((a, x) => a + x.semanal, 0) / atual.length : 0;
  const dif = media ? (m.dados.semanal / media - 1) : 0;
  return (
    <section className="ctx-card">
      <header><h4>» Patrocínios da org</h4><span className="mut">{atual.length}/{maxPatro(s)} vagas</span></header>
      <div className="ctx-kpis">
        <Kpi ico="aperto" rot="Esta oferta" v={`${moeda(m.dados.semanal * 4)}/mês`} />
        {media > 0 && <Kpi ico="grafico-sobe" rot="Comparado à média" v={`${dif >= 0 ? '+' : ''}${Math.round(dif * 100)}%`} cls={dif >= 0 ? 'pos' : 'neg'} />}
        <Kpi ico="dinheiro" rot="Total do contrato" v={moeda(m.dados.semanal * m.dados.semanas)} />
      </div>
      {atual.length > 0 && <div className="ctx-lista">{atual.map(x => <div key={x.id}><Ico3D n="aperto" size={22} /><b>{x.marca}</b><span>{moeda(x.semanal * 4)}/mês</span></div>)}</div>}
      {atual.length >= maxPatro(s) && <p className="neg">Sem vaga: para aceitar, a org precisa de mais reputação.</p>}
    </section>
  );
}

function CardCaixa({ s }: { s: State }) {
  const rec = Object.values(receitasFixas(s)).reduce((a, b) => a + b, 0);
  const custos = Object.values(custosFixos(s)).reduce((a, b) => a + b, 0) + folhaSemanal(s);
  const ult = s.fin[s.fin.length - 1];
  const saldo = ult ? ult.rec - ult.desp : rec - custos;
  return (
    <section className="ctx-card">
      <header><h4>» Situação do caixa</h4></header>
      <div className="ctx-kpis">
        <Kpi ico="banco" rot="Caixa" v={moeda(s.org.caixa)} cls={s.org.caixa < 0 ? 'neg' : ''} />
        <Kpi ico={saldo >= 0 ? 'grafico-sobe' : 'grafico-desce'} rot="Saldo da última semana" v={moeda(saldo)} cls={saldo >= 0 ? 'pos' : 'neg'} />
        <Kpi ico="nota" rot="Folha salarial" v={`${moeda(folhaSemanal(s))}/sem`} />
        <Kpi ico="recibo" rot="Custos fixos" v={`${moeda(custos - folhaSemanal(s))}/sem`} />
      </div>
    </section>
  );
}

