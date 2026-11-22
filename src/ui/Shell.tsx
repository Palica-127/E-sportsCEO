import { CSSProperties, useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Bell, Briefcase, Building2, CalendarDays, ChevronLeft, ChevronRight, ChevronsRight, Home, Mail, Pause, Search, Settings, Trophy, UserCog, Users } from 'lucide-react';
import { passo, temJogoOrgHoje, dataDe, proximoEvento, fmtData } from '../engine/sim';
import { act, useGame } from '../store';
import { Crest } from './common';
import { DiaDeJogo } from './DiaDeJogo';
import { Inicio } from './telas/Inicio';
import { Inbox } from './telas/Inbox';
import { Calendario } from './telas/Calendario';
import { Competicoes } from './telas/Competicoes';
import { Elenco } from './telas/Elenco';
import { Perfil } from './telas/Perfil';
import { Financas } from './telas/Financas';
import { OrgTela } from './telas/OrgTela';
import { StaffTela } from './telas/Staff';
import { Olheiros } from './telas/Olheiros';
import { Mercado } from './telas/Mercado';
import { SedeTela } from './telas/Sede';

export type Tela = 'inicio' | 'inbox' | 'elenco' | 'perfil' | 'staff' | 'olheiros' | 'mercado' | 'competicoes' | 'calendario' | 'sede' | 'financas' | 'org';
const NAV: ({ id: Tela; nome: string; Ico: typeof Home; curto?: string } | 'gap')[] = [
  { id: 'inicio', nome: 'Início', Ico: Home },
  { id: 'inbox', nome: 'Mensagens', Ico: Mail, curto: 'E-mail' },
  'gap',
  { id: 'elenco', nome: 'Elenco', Ico: Users },
  { id: 'staff', nome: 'Comissão', Ico: UserCog },
  'gap',
  { id: 'olheiros', nome: 'Olheiros', Ico: Search },
  { id: 'mercado', nome: 'Transferências', Ico: ArrowLeftRight, curto: 'Mercado' },
  'gap',
  { id: 'competicoes', nome: 'Competições', Ico: Trophy, curto: 'Ligas' },
  { id: 'calendario', nome: 'Calendário', Ico: CalendarDays, curto: 'Agenda' },
  'gap',
  { id: 'sede', nome: 'Sede', Ico: Building2 },
  { id: 'financas', nome: 'Finanças', Ico: Briefcase },
  'gap',
  { id: 'org', nome: 'Organização', Ico: Settings, curto: 'Org' },
];
const TITULO: Record<Tela, string> = { inicio: 'Início', inbox: 'Mensagens', elenco: 'Elenco', perfil: 'Perfil do jogador', staff: 'Comissão técnica', olheiros: 'Olheiros', mercado: 'Transferências', competicoes: 'Competições', calendario: 'Calendário', sede: 'Sede', financas: 'Finanças', org: 'Organização' };
const SEM = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const MES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function Shell() {
  const s = useGame()!;
  const [hist, setHist] = useState<{ t: Tela; a?: string }[]>([{ t: 'inicio' }]);
  const [pos, setPos] = useState(0);
  const [rodando, setRodando] = useState(false);
  const [diaJogo, setDiaJogo] = useState(false);
  const run = useRef(false);
  const atual = hist[pos];
  const tela = atual.t, arg = atual.a;
  const naoLidas = s.inbox.filter(m => !m.lida).length;
  const decisoes = s.inbox.filter(m => m.acoes && !m.resolvida).length;
  const jogoHoje = temJogoOrgHoje(s);
  const prox = proximoEvento(s);

  const ir = (t: Tela, a?: string) => {
    if (t === tela && a === arg) return;
    const h = [...hist.slice(0, pos + 1), { t, a }].slice(-40);
    setHist(h); setPos(h.length - 1);
  };

  function umDia() {
    if (rodando) return;
    if (jogoHoje) { setDiaJogo(true); return; }
    const r = act(st => passo(st));
    if (r === 'jogo') setDiaJogo(true);
    if (r === 'decisao') ir('inbox');
  }
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
      if (e.altKey && e.code === 'ArrowLeft' && pos > 0) setPos(pos - 1);
      if (e.altKey && e.code === 'ArrowRight' && pos < hist.length - 1) setPos(pos + 1);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const orgTeam = s.teams[s.orgTeams[s.jogos[0]]!];
  const d = dataDe(s.dia);
  const sub = tela === 'perfil' && arg && s.players[arg] ? s.players[arg].nick : tela === 'elenco' ? s.org.nome : '';

  return (
    <div className="app" style={{ '--acc': s.org.cor } as CSSProperties}>
      <header className="top">
        <div className="top-org"><Crest s={s} team={orgTeam} size={46} /><div><small>CEO</small><b>{s.org.nome}</b></div></div>
        <div className="top-nav">
          <button disabled={pos === 0} onClick={() => setPos(pos - 1)} title="Voltar (Alt+←)"><ChevronLeft size={34} strokeWidth={2.5} /></button>
          <button disabled={pos >= hist.length - 1} onClick={() => setPos(pos + 1)} title="Avançar (Alt+→)"><ChevronRight size={34} strokeWidth={2.5} /></button>
        </div>
        <div className="top-t"><h1>{TITULO[tela]}{sub && <span> | {sub}</span>}</h1></div>
        {decisoes > 0 && <button className="top-alert" onClick={() => ir('inbox')} title="Decisões pendentes"><Bell size={24} /><span className="badge">{decisoes}</span></button>}
        <div className="top-date"><b>{SEM[s.dia % 7]},</b><span>{String(d.getUTCDate()).padStart(2, '0')} {MES[d.getUTCMonth()]} {d.getUTCFullYear()}</span><small>{rodando ? 'avançando…' : jogoHoje ? 'dia de jogo!' : prox ? `${prox.txt}: ${fmtData(prox.dia, false).replace(/ \d{4}$/, '')}` : ''}</small></div>
        <div className="go-grp">
          <button className={'btn go ' + (jogoHoje ? 'jogo' : '')} onClick={umDia} disabled={rodando} title="Avança 1 dia (Espaço)">{jogoHoje ? 'JOGAR' : 'CONTINUAR'}</button>
          <button className={'btn go2 ' + (rodando ? 'run' : '')} onClick={ateEvento} disabled={jogoHoje && !rodando} title="Avança até o próximo compromisso (Shift+Enter)">{rodando ? <Pause size={22} /> : <ChevronsRight size={26} />}</button>
        </div>
      </header>
      <aside className="side">
        <nav>
          {NAV.map((n, i) => n === 'gap' ? <div key={i} className="nav-gap" /> : (
            <button key={n.id} className={tela === n.id || (tela === 'perfil' && n.id === 'elenco') ? 'on' : ''} onClick={() => ir(n.id)}>
              <n.Ico strokeWidth={1.8} />
              <span className="lbl">{n.nome}</span><span className="lbl-s">{n.curto ?? n.nome}</span>
              {n.id === 'inbox' && naoLidas > 0 && <span className="badge">{naoLidas}</span>}
            </button>
          ))}
        </nav>
        <div className="side-f"><kbd>Espaço</kbd> 1 dia · <kbd>Shift+Enter</kbd> avançar</div>
      </aside>
      <div className="main">
        <main className="content" key={tela + (arg ?? '')}>
          {tela === 'inicio' && <Inicio ir={ir} abrirDia={() => setDiaJogo(true)} />}
          {tela === 'inbox' && <Inbox abrir={arg} ir={ir} />}
          {tela === 'elenco' && <Elenco jogo={arg} ir={ir} />}
          {tela === 'perfil' && arg && <Perfil pid={arg} ir={ir} />}
          {tela === 'staff' && <StaffTela />}
          {tela === 'olheiros' && <Olheiros ir={ir} />}
          {tela === 'mercado' && <Mercado ir={ir} aba={arg} />}
          {tela === 'competicoes' && <Competicoes abrir={arg} />}
          {tela === 'calendario' && <Calendario />}
          {tela === 'sede' && <SedeTela />}
          {tela === 'financas' && <Financas />}
          {tela === 'org' && <OrgTela />}
        </main>
      </div>
      {diaJogo && <DiaDeJogo onFechar={() => setDiaJogo(false)} />}
    </div>
  );
}
