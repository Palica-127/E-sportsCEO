import { CSSProperties, useEffect, useRef, useState } from 'react';
import { moeda } from '../engine/org';
import { fmtData, passo, proximoEvento, temJogoOrgHoje } from '../engine/sim';
import { act, useGame } from '../store';
import { Crest } from './common';
import { DiaDeJogo } from './DiaDeJogo';
import { Inicio } from './telas/Inicio';
import { Inbox } from './telas/Inbox';
import { Calendario } from './telas/Calendario';
import { Competicoes } from './telas/Competicoes';
import { Elenco } from './telas/Elenco';
import { Financas } from './telas/Financas';
import { OrgTela } from './telas/OrgTela';

export type Tela = 'inicio' | 'inbox' | 'calendario' | 'competicoes' | 'elenco' | 'financas' | 'org';
const NAV: { sec?: string; id: Tela; nome: string; ico: string; curto?: string }[] = [
  { sec: 'Geral', id: 'inicio', nome: 'Visão geral', ico: '⌂', curto: 'Início' },
  { id: 'inbox', nome: 'Mensagens', ico: '✉' },
  { id: 'calendario', nome: 'Calendário', ico: '▦', curto: 'Agenda' },
  { sec: 'Esportivo', id: 'elenco', nome: 'Elencos', ico: '◉' },
  { id: 'competicoes', nome: 'Competições', ico: '♛', curto: 'Ligas' },
  { sec: 'Negócios', id: 'financas', nome: 'Finanças', ico: '$' },
  { id: 'org', nome: 'Organização', ico: '⚙', curto: 'Org' },
];

export function Shell() {
  const s = useGame()!;
  const [tela, setTela] = useState<Tela>('inicio');
  const [arg, setArg] = useState<string | undefined>();
  const [rodando, setRodando] = useState(false);
  const [diaJogo, setDiaJogo] = useState(false);
  const run = useRef(false);
  const naoLidas = s.inbox.filter(m => !m.lida).length;
  const decisoes = s.inbox.filter(m => m.acoes && !m.resolvida).length;
  const jogoHoje = temJogoOrgHoje(s);
  const prox = proximoEvento(s);

  const ir = (t: Tela, a?: string) => { setTela(t); setArg(a); window.scrollTo(0, 0); };

  /** um dia por clique (FM): para em jogo e decisões */
  function umDia() {
    if (rodando) return;
    if (jogoHoje) { setDiaJogo(true); return; }
    const r = act(st => passo(st));
    if (r === 'jogo') setDiaJogo(true);
    if (r === 'decisao') ir('inbox');
  }
  /** avança dia a dia até o próximo compromisso */
  async function ateEvento() {
    if (run.current) { run.current = false; return; }
    if (jogoHoje) { setDiaJogo(true); return; }
    run.current = true; setRodando(true);
    while (run.current) {
      const r = act(st => passo(st));
      if (r === 'jogo') { setDiaJogo(true); break; }
      if (r === 'decisao') { ir('inbox'); break; }
      await new Promise(res => setTimeout(res, 160));
    }
    run.current = false; setRodando(false);
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (diaJogo || (e.target as HTMLElement).closest('input,textarea,select')) return;
      if (e.code === 'Space') { e.preventDefault(); umDia(); }
      if (e.code === 'Enter' && e.shiftKey) { e.preventDefault(); ateEvento(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const orgTeam = s.teams[s.orgTeams[s.jogos[0]]!];
  const titulo = NAV.find(n => n.id === tela)!.nome;

  return (
    <div className="app" style={{ '--acc': s.org.cor } as CSSProperties}>
      <aside className="side">
        <div className="side-brand"><span className="brand-mark">e</span><span>eSports <b>CEO</b></span></div>
        <div className="side-org"><Crest s={s} team={orgTeam} size={34} /><div><b>{s.org.nome}</b><small>CEO · rep. {Math.round(s.org.rep)}</small></div></div>
        <nav>
          {NAV.map(n => (
            <div key={n.id} className="nav-blk">
              {n.sec && <div className="nav-sec">{n.sec}</div>}
              <button className={tela === n.id ? 'on' : ''} onClick={() => ir(n.id)}>
                <span className="ico">{n.ico}</span><span className="lbl">{n.nome}</span><span className="lbl-s">{n.curto ?? n.nome}</span>
                {n.id === 'inbox' && naoLidas > 0 && <span className="badge">{naoLidas}</span>}
              </button>
            </div>
          ))}
        </nav>
        <div className="side-f"><kbd>Espaço</kbd> 1 dia · <kbd>Shift+Enter</kbd> avançar</div>
      </aside>
      <div className="main">
        <header className="top">
          <div className="top-t"><small>{s.org.nome}</small><h1>{titulo}</h1></div>
          <div className="top-info">
            <div className="ti"><small>Caixa</small><b className={s.org.caixa < 0 ? 'neg' : ''}>{moeda(s.org.caixa)}</b></div>
            <div className="ti"><small>Confiança</small><b>{Math.round(s.diretoria.confianca)}%</b></div>
            {decisoes > 0 && <button className="ti alerta" onClick={() => ir('inbox')}><small>Pendências</small><b>{decisoes} decis{decisoes > 1 ? 'ões' : 'ão'}</b></button>}
          </div>
          <div className="top-date"><b>{fmtData(s.dia)}</b><small>{rodando ? 'avançando…' : jogoHoje ? 'dia de jogo' : prox ? `${prox.txt}: ${fmtData(prox.dia, false).replace(/ \d{4}$/, '')}` : ''}</small></div>
          <div className="go-grp">
            <button className={'btn go ' + (jogoHoje ? 'jogo' : '')} onClick={umDia} disabled={rodando} title="Avança 1 dia (Espaço)">{jogoHoje ? 'Dia de jogo' : 'Continuar'}<span>▶</span></button>
            <button className={'btn go2 ' + (rodando ? 'run' : '')} onClick={ateEvento} disabled={jogoHoje && !rodando} title="Avança até o próximo compromisso (Shift+Enter)">{rodando ? '❚❚' : '▶▶'}</button>
          </div>
        </header>
        <main className="content">
          {tela === 'inicio' && <Inicio ir={ir} abrirDia={() => setDiaJogo(true)} />}
          {tela === 'inbox' && <Inbox abrir={arg} />}
          {tela === 'calendario' && <Calendario />}
          {tela === 'competicoes' && <Competicoes key={arg} abrir={arg} />}
          {tela === 'elenco' && <Elenco jogo={arg} />}
          {tela === 'financas' && <Financas />}
          {tela === 'org' && <OrgTela />}
        </main>
      </div>
      {diaJogo && <DiaDeJogo onFechar={() => setDiaJogo(false)} />}
    </div>
  );
}
