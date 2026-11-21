import { CSSProperties, useEffect, useRef, useState } from 'react';
import { moeda } from '../engine/org';
import { fmtData, isOrg, jogosDoDia, passo } from '../engine/sim';
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
const NAV: { id: Tela; nome: string; ico: string; curto?: string }[] = [
  { id: 'inicio', nome: 'Início', ico: '⌂' },
  { id: 'inbox', nome: 'Caixa de entrada', ico: '✉', curto: 'Mensagens' },
  { id: 'calendario', nome: 'Calendário', ico: '▦' },
  { id: 'competicoes', nome: 'Competições', ico: '🏆', curto: 'Ligas' },
  { id: 'elenco', nome: 'Elenco', ico: '👥' },
  { id: 'financas', nome: 'Finanças', ico: '$' },
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
  const temJogoHoje = jogosDoDia(s, s.dia).some(m => m.sa == null && (isOrg(s, m.a) || isOrg(s, m.b)));
  const jogouHoje = s.diaJogo?.dia === s.dia;

  const ir = (t: Tela, a?: string) => { setTela(t); setArg(a); window.scrollTo(0, 0); };

  async function continuar() {
    if (run.current) { run.current = false; return; }
    if (temJogoHoje) { setDiaJogo(true); return; }
    run.current = true; setRodando(true);
    while (run.current) {
      const r = act(st => passo(st));
      if (r === 'jogo') { setDiaJogo(true); break; }
      if (r === 'decisao') { ir('inbox'); break; }
      await new Promise(res => setTimeout(res, 45));
    }
    run.current = false; setRodando(false);
  }
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Space' && !(e.target as HTMLElement).closest('input,textarea,select') && !diaJogo) { e.preventDefault(); continuar(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const orgTeam = s.teams[s.orgTeams[s.jogos[0]]!];
  const btnTxt = rodando ? 'Pausar' : temJogoHoje ? 'Dia de jogo' : 'Continuar';

  return (
    <div className="app" style={{ '--acc': s.org.cor } as CSSProperties}>
      <aside className="side">
        <div className="side-org"><Crest s={s} team={orgTeam} size={40} /><div><b>{s.org.nome}</b><small>CEO</small></div></div>
        <nav>
          {NAV.map(n => (
            <button key={n.id} className={tela === n.id ? 'on' : ''} onClick={() => ir(n.id)}>
              <span className="ico">{n.ico}</span><span className="lbl">{n.nome}</span><span className="lbl-s">{n.curto ?? n.nome}</span>
              {n.id === 'inbox' && naoLidas > 0 && <span className="badge">{naoLidas}</span>}
            </button>
          ))}
        </nav>
        <div className="side-f">eSports <b>CEO</b></div>
      </aside>
      <div className="main">
        <header className="top">
          <div className="top-date"><b>{fmtData(s.dia)}</b><small>{decisoes ? (decisoes > 1 ? `${decisoes} decisões pendentes` : '1 decisão pendente') : rodando ? 'avançando…' : jogouHoje ? 'partidas do dia encerradas' : ''}</small></div>
          <div className="top-cash"><small>Caixa</small><b className={s.org.caixa < 0 ? 'neg' : ''}>{moeda(s.org.caixa)}</b></div>
          <button className={'btn continuar ' + (temJogoHoje && !rodando ? 'jogo' : '') + (rodando ? ' run' : '')} onClick={continuar}>
            <span>{btnTxt}</span><span className="arr">{rodando ? '❚❚' : '▶'}</span>
          </button>
        </header>
        <main className="content">
          {tela === 'inicio' && <Inicio ir={ir} abrirDia={() => setDiaJogo(true)} />}
          {tela === 'inbox' && <Inbox abrir={arg} />}
          {tela === 'calendario' && <Calendario />}
          {tela === 'competicoes' && <Competicoes ir={ir} />}
          {tela === 'elenco' && <Elenco jogo={arg} />}
          {tela === 'financas' && <Financas />}
          {tela === 'org' && <OrgTela />}
        </main>
      </div>
      {diaJogo && <DiaDeJogo onFechar={() => setDiaJogo(false)} />}
    </div>
  );
}
