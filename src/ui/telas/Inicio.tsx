import { CSSProperties, ReactElement, useState } from 'react';
import { AlertTriangle, ThumbsUp, Trophy } from 'lucide-react';
import { GAMES, GameId } from '../../engine/games';
import { calendario, inicioAno, nomeIntl } from '../../engine/comp';
import { probSerie } from '../../engine/match';
import { moeda } from '../../engine/org';
import { anoDe, fmtData, isOrg, jogosDoDia, ligaDoTime, proximosJogosOrg, torneioDaLiga } from '../../engine/sim';
import { forca, titulares } from '../../engine/world';
import { janelaAberta, maxElenco } from '../../engine/mercado';
import { useGame } from '../../store';
import { Alerta, Bar, Crest, Panel, RetratoJogador, pct } from '../common';
import { IcoCat } from '../icones';
import type { Tela } from '../Shell';
import type { State } from '../../engine/types';

const LOGO_LIGA: Record<string, string> = { CBLOL: 'cblol', LCK: 'lck', LPL: 'lpl', LEC: 'lec', LCS: 'lcs', LCP: 'lcp' };
function logoComp(g: GameId, kind: string, region?: string): string | null {
  if (g !== 'lol') return null;
  if (kind === 'msi' || kind === 'fs') return '/ligas/msi.webp';
  if (kind === 'worlds' || kind === 'ewc') return '/ligas/mundial.webp';
  return region && LOGO_LIGA[region] ? `/ligas/${LOGO_LIGA[region]}.webp` : null;
}

function faixa(s: State) {
  const ano = anoDe(s.dia), y0 = inicioAno(ano);
  const itens: { id: string; nome: string; logo: string | null; g: GameId; dia: number; t2: boolean; tor?: string; atual: boolean }[] = [];
  for (const g of s.jogos) {
    const L = ligaDoTime(s, s.orgTeams[g]!);
    for (const ev of calendario(g)) {
      const tor = Object.values(s.torneios).find(t => t.game === g && t.ano === ano && (ev.kind === 'split' ? t.league === L.id && t.split === ev.split && t.kind !== 'acesso' : t.kind === ev.kind));
      if (ev.kind !== 'split' && !tor?.teams.includes(s.orgTeams[g]!) && (tor || y0 + ev.d < s.dia)) continue;
      itens.push({ id: g + ev.kind + (ev.split ?? ''), nome: ev.kind === 'split' ? `${L.nome.replace(' Challengers', '')} S${ev.split}` : nomeIntl(g, ev.kind), logo: logoComp(g, ev.kind, L.region), g, dia: y0 + ev.d, t2: ev.kind === 'split' && L.tier === 2, tor: tor?.id, atual: !!tor && !tor.fim });
    }
  }
  return itens.sort((a, b) => a.dia - b.dia);
}

export function Inicio({ ir, abrirDia }: { ir: (t: Tela, a?: string) => void; abrirDia: () => void }) {
  const s = useGame()!;
  const [gR, setGR] = useState<GameId>(s.jogos[0]);
  const decisoes = s.inbox.filter(m => m.acoes && !m.resolvida);
  const itens = faixa(s);
  const proxIntl = itens.find(i => i.dia > s.dia && !i.nome.includes(' S'));
  const g0 = s.jogos[0];
  const t0 = s.teams[s.orgTeams[g0]!];
  const tit0 = titulares(s, t0);
  // alertas da organização
  const alertas: { tipo: 'ok' | 'meh' | 'bad'; el: ReactElement }[] = [];
  for (const g of s.jogos) {
    const t = s.teams[s.orgTeams[g]!];
    const nR = GAMES[g].roles.length;
    if (t.elenco.length < nR) alertas.push({ tipo: 'bad', el: <>Menos de <strong>{nR} jogadores</strong> no {GAMES[g].curto}!</> });
    const tristes = t.elenco.map(id => s.players[id]).filter(p => p.moral < 45).length;
    if (tristes) alertas.push({ tipo: 'meh', el: <><strong>{tristes} jogador{tristes > 1 ? 'es' : ''}</strong> insatisfeito{tristes > 1 ? 's' : ''} no {GAMES[g].curto}.</> });
  }
  const promessas = s.jogos.flatMap(g => s.teams[s.orgTeams[g]!].elenco).filter(id => (s.players[id].prometido ?? 0) > s.dia).length;
  if (promessas) alertas.push({ tipo: 'meh', el: <>Há <strong>promessas</strong> pendentes para cumprir.</> });
  if (s.org.caixa < 0) alertas.push({ tipo: 'bad', el: <>Caixa <strong>negativo</strong>: a diretoria está de olho.</> });
  const obras = Object.values(s.sede.comodos).filter(c => c?.obraAte && c.obraAte > s.dia).length;
  if (obras) alertas.push({ tipo: 'meh', el: <><strong>{obras} obra{obras > 1 ? 's' : ''}</strong> em andamento na sede.</> });
  if (janelaAberta(s)) alertas.push({ tipo: 'ok', el: <>Janela de <strong>transferências</strong> aberta.</> });
  if (!alertas.some(a => a.tipo !== 'ok')) alertas.unshift({ tipo: 'ok', el: <>Todo o <strong>treino</strong> segue conforme o planejado.</> });
  // jogos do dia (ou do próximo dia com jogos da org)
  const prox = proximosJogosOrg(s, 1)[0];
  const diaJ = prox ? prox.dia : s.dia;
  const ligasOrg = new Set(s.jogos.map(g => torneioDaLiga(s, ligaDoTime(s, s.orgTeams[g]!).id)?.id));
  const jogosDia = jogosDoDia(s, diaJ).filter(m => ligasOrg.has(m.tor) || isOrg(s, m.a) || isOrg(s, m.b)).slice(0, 10);
  // ranking mundial do jogo escolhido
  const rank = Object.values(s.teams).filter(t => t.game === gR && (t.tier === 1 || (t.org && !t.acad))).sort((a, b) => forca(s, b) - forca(s, a));
  const posOrg = rank.findIndex(t => t.org && !t.acad);

  return (
    <div className="home">
      <div className="home-top">
        <div className="pendente" onClick={() => decisoes.length && ir('inbox', decisoes[0].id)}>
          {decisoes.length ? <AlertTriangle color="#f2c037" /> : <ThumbsUp color="#dfe5ee" />}
          <div>{decisoes.length ? <><b>{decisoes.length} decis{decisoes.length > 1 ? 'ões' : 'ão'} pendente{decisoes.length > 1 ? 's' : ''}</b><span>Responda na caixa de <strong>mensagens</strong>.</span></> : <><b>Nada pendente</b><span>Você pode <strong>avançar</strong> para o próximo dia.</span></>}</div>
        </div>
        <div className="faixa-comp">
          {itens.filter(i => i.dia <= s.dia + 120).slice(0, 7).map((i, k) => (
            <div key={i.id} style={{ display: 'contents' }}>
              {k > 0 && <span className="fc-dot" />}
              <div className={'fc-item ' + (i.atual ? 'atual' : '')} style={{ '--g': GAMES[i.g].cor } as CSSProperties} onClick={() => i.tor && ir('competicoes', i.tor)} title={i.nome}>
                <div className="fc-logo">{i.logo ? <img src={i.logo} alt={i.nome} /> : <Trophy size={34} color={GAMES[i.g].cor} />}</div>
                {i.t2 && <span className="t2">T2</span>}
                <small>{i.nome}</small>
              </div>
            </div>
          ))}
          {proxIntl && <div className="fc-prox"><div><b>{proxIntl.nome}</b><span>{Math.max(1, Math.round((proxIntl.dia - s.dia) / 30))} {Math.round((proxIntl.dia - s.dia) / 30) > 1 ? 'meses' : 'mês'}</span></div></div>}
        </div>
      </div>

      <div className="home-grid">
        <div className="hc">
          <Panel title="Organização">
            {alertas.slice(0, 4).map((a, i) => <Alerta key={i} tipo={a.tipo}>{a.el}</Alerta>)}
            <div className="sub-t">Titulares · {GAMES[g0].curto}</div>
            <div className="squad-row">
              {tit0.map(p => <button key={p.id} onClick={() => ir('perfil', p.id)} title={p.nick}><RetratoJogador s={s} p={p} size={72} /></button>)}
              {Array.from({ length: Math.max(0, GAMES[g0].roles.length - tit0.length) }, (_, i) => <span key={i} className="vago">+</span>)}
            </div>
            {tit0.every(p => p.moral >= 50 && p.forma > -1)
              ? <Alerta tipo="ok">Todos os jogadores estão em <strong>boa condição</strong>!</Alerta>
              : <Alerta tipo="meh">Alguns titulares estão com <strong>forma ou moral</strong> baixa.</Alerta>}
            <div className="kv"><span>Elenco</span><b>{s.jogos.map(g => `${GAMES[g].curto} ${s.teams[s.orgTeams[g]!].elenco.length}/${maxElenco(g)}`).join(' · ')}</b></div>
          </Panel>
          <Panel title="Eventos importantes" right={<button className="link" onClick={() => ir('inbox')}>Todos ›</button>}>
            {s.inbox.slice(0, 4).map(m => (
              <div key={m.id} className="evento" onClick={() => ir('inbox', m.id)}>
                <span className="ev-ico"><IcoCat cat={m.cat} size={30} /></span>
                <div><b>{m.titulo}</b><span>{m.corpo.split('\n')[0]}</span></div>
              </div>
            ))}
          </Panel>
        </div>

        <div className="hc">
          <Panel title={diaJ === s.dia ? 'Jogos de hoje' : `Próxima rodada · ${fmtData(diaJ, true).replace(/ \d{4}$/, '')}`}>
            {jogosDia.length === 0 && <p className="mut">Sem jogos marcados por enquanto.</p>}
            {jogosDia.map(m => (
              <div key={m.id} className={'jogo-l ' + (isOrg(s, m.a) || isOrg(s, m.b) ? 'org' : '')} style={{ '--g': GAMES[m.game].cor } as CSSProperties} onClick={() => ir('competicoes', m.tor)}>
                <Trophy size={22} color={GAMES[m.game].cor} />
                <span className="jl-c"><b>{GAMES[m.game].curto}</b> | {m.label}</span>
                <Crest s={s} team={s.teams[m.a]} size={26} />
                <span className={m.sa != null ? 'res' : 'vs'}>{m.sa != null ? `${m.sa}-${m.sb}` : 'vs'}</span>
                <Crest s={s} team={s.teams[m.b]} size={26} />
                <span />
              </div>
            ))}
            {prox && (() => {
              const A = s.teams[prox.a], B = s.teams[prox.b];
              const pa = probSerie(forca(s, A), forca(s, B), prox.bo);
              return (
                <>
                  <div className="sub-t" style={{ marginTop: 18 }}>Partida em destaque</div>
                  <div className="destaque" onClick={prox.dia === s.dia ? abrirDia : () => ir('competicoes', prox.tor)}>
                    <div><Crest s={s} team={A} size={96} /><b>{A.nome}</b></div>
                    <div className="dc"><b>{GAMES[prox.game].curto}</b><span>{prox.label}</span><small>{prox.dia === s.dia ? 'HOJE' : fmtData(prox.dia)}</small><small>Chance: {pct(isOrg(s, A.id) ? pa : 1 - pa)}</small></div>
                    <div><Crest s={s} team={B} size={96} /><b>{B.nome}</b></div>
                  </div>
                </>
              );
            })()}
          </Panel>
        </div>

        <div className="hc">
          <Panel title="Ranking mundial" right={<div className="seg sm">{s.jogos.map(g => <button key={g} className={g === gR ? 'on' : ''} style={{ '--g': GAMES[g].cor } as CSSProperties} onClick={() => setGR(g)}>{GAMES[g].curto}</button>)}</div>}>
            {rank.slice(0, 7).map((t, i) => <div key={t.id} className={'rank-l ' + (t.org ? 'org' : '')}><span className="rp"># {i + 1}</span><Crest s={s} team={t} size={26} /><b>{t.nome}</b><span>{Math.round(forca(s, t) * 20)}</span><span className="mut">-</span></div>)}
            {posOrg >= 7 && <div className="rank-l org"><span className="rp"># {posOrg + 1}</span><Crest s={s} team={rank[posOrg]} size={26} /><b>{rank[posOrg].nome}</b><span>{Math.round(forca(s, rank[posOrg]) * 20)}</span><span className="mut">-</span></div>}
          </Panel>
          <Panel title="Redes sociais">
            {(s.redes ?? []).slice(-5).reverse().map((p, i) => <div key={i} className={'post ' + p.tom}><div style={{ flex: 1 }}><span className="pa">{p.autor}</span><p>{p.txt}</p></div><small>♥ {p.likes.toLocaleString('pt-BR')}</small></div>)}
            {!(s.redes ?? []).length && <p className="mut">A torcida ainda está esperando o primeiro jogo.</p>}
          </Panel>
          <Panel title="Diretoria">
            <div className="dir">
              <small>Meta da temporada {anoDe(s.dia)}</small>
              <b>{s.diretoria.meta}</b>
              <div className="conf"><span>Confiança</span><Bar v={s.diretoria.confianca} /><b>{Math.round(s.diretoria.confianca)}%</b></div>
              <div className="kv"><span>Caixa</span><b className={s.org.caixa < 0 ? 'neg' : ''}>{moeda(s.org.caixa)}</b></div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
