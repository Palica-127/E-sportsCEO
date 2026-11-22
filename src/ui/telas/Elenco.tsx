import { CSSProperties, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { GAMES, GameId } from '../../engine/games';
import { trocar, voltarAuto } from '../../engine/org';
import { ligaDoTime } from '../../engine/sim';
import type { Player } from '../../engine/types';
import { estrelas, forca } from '../../engine/world';
import { maxElenco } from '../../engine/mercado';
import { tecnicoDe } from '../../engine/staff';
import { act, useGame } from '../../store';
import { academyDe } from '../../engine/academy';
import { Bar, Chips, Crest, Estrelas, Flag, Forma, RetratoJogador } from '../common';
import type { Tela } from '../Shell';

export function Elenco({ jogo, ir }: { jogo?: string; ir: (t: Tela, a?: string) => void }) {
  const s = useGame()!;
  const [g, setG] = useState<GameId>((jogo as GameId) && s.jogos.includes(jogo as GameId) ? (jogo as GameId) : s.jogos[0]);
  const [modo, setModo] = useState(false);
  const [sel, setSel] = useState<string | null>(null);
  const [base, setBase] = useState(false);
  const ac = academyDe(s, g);
  const t = base && ac ? ac : s.teams[s.orgTeams[g]!];
  const def = GAMES[g];
  const nR = def.roles.length;
  const L = ligaDoTime(s, t.id);
  const ps = t.elenco.map(id => s.players[id]);
  const tit = ps.slice(0, nR), res = ps.slice(nR);
  const f = forca(s, t);
  const fisico = Math.round(Math.min(100, Math.max(0, 70 + tit.reduce((a, p) => a + p.forma, 0) / Math.max(1, tit.length) * 10)));
  const moral = Math.round(tit.reduce((a, p) => a + p.moral, 0) / Math.max(1, tit.length));
  const entros = Math.round(Math.max(40, 100 - tit.filter(p => (p.hist ?? []).some(h => h.d > s.dia - 120 && h.t.startsWith('Contratado'))).length * 12));
  const rank = Object.values(s.teams).filter(x => x.game === g && (x.tier === 1 || (x.org && !x.acad))).sort((a, b) => forca(s, b) - forca(s, a)).findIndex(x => x.id === t.id) + 1;

  function clicar(p: Player) {
    if (!modo) { ir('perfil', p.id); return; }
    if (!sel) { setSel(p.id); return; }
    if (sel !== p.id) act(st => trocar(st, t.id, sel, p.id));
    setSel(null);
  }
  const Card = ({ p, i }: { p: Player; i: number }) => (
    <button className={'pcard ' + (i >= nR ? 'mini ' : '') + (sel === p.id ? 'sel' : '')} onClick={() => clicar(p)}>
      <div className="pc-top"><span className="pc-role">{i < nR ? def.roles[i] : 'Reserva'}<span>{def.roleNomes[p.role]}</span></span></div>
      <div className="pc-top"><Flag nat={p.nat} />{s.rosto[g] === p.id && <span className="chip2 meh">Rosto da Org</span>}</div>
      <div className="pc-img"><RetratoJogador s={s} p={p} size={i < nR ? 150 : 110} /></div>
      <div className="pc-n"><b>{p.nick}</b></div>
      <div className="pc-c"><Chips p={p} titular={i < nR} /></div>
      <div className="pc-f"><span><Estrelas v={estrelas(p.ovr)} size={13} /><b>{p.ovr}</b></span><span>{p.idade} anos</span><Forma v={p.forma} /></div>
    </button>
  );

  return (
    <div style={{ '--g': def.cor } as CSSProperties}>
      <div className="tabs">{s.jogos.map(x => <button key={x} className={x === g ? 'on' : ''} onClick={() => { setG(x); setSel(null); setBase(false); }}>{GAMES[x].nome}</button>)}
        {ac && <span className="seg base-seg"><button className={!base ? 'on' : ''} onClick={() => setBase(false)}>Principal</button><button className={base ? 'on' : ''} onClick={() => setBase(true)}>Academy</button></span>}</div>
      {base && ac && <div className="alerta ok" style={{ marginBottom: 12 }}><b>!</b>A Academy joga a {L.nome} e não pode subir. Abra a ficha de um jovem para promovê-lo ao principal.</div>}
      <section className="sec">
        <header className="sec-h"><h3><span className="chev">»</span>Informações do time</h3></header>
        <div className="team-info">
          <div className="ti-logo"><Crest s={s} team={t} size={92} /></div>
          <div>
            <h2>{t.nome} <small>#{rank} no ranking mundial · {L.nome}</small></h2>
            <Estrelas v={Math.max(0.5, Math.min(5, (f - 62) / 5))} size={22} />
            <div className="mut" style={{ marginTop: 6 }}>Técnico: <b style={{ color: '#fff' }}>{tecnicoDe(s, g)?.nome ?? 'sem técnico'}</b> · Força {f.toFixed(1)}</div>
          </div>
          <div className="ti-bars">
            <div>Estado físico: <b>{fisico}%</b><Bar v={fisico} /></div>
            <div>Moral: <b>{moral}%</b><Bar v={moral} /></div>
            <div>Entrosamento: <b>{entros}%</b><Bar v={entros} /></div>
          </div>
        </div>
      </section>
      <section className="sec" style={{ marginTop: 22 }}>
        <header className="sec-h">
          <h3><span className="chev">»</span>Titulares</h3>
          <div className="squad-tools">
            <span className="mut">{t.manual ? 'Escalação manual (você)' : 'O técnico escala'}</span>
            {t.manual && <button className="btn ghost sm" onClick={() => act(st => voltarAuto(st, t.id))}>Devolver ao técnico</button>}
            <button className={'btn sm ' + (modo ? 'primary' : '')} onClick={() => { setModo(!modo); setSel(null); }}><ArrowLeftRight size={15} /> {modo ? 'Concluir trocas' : 'Trocar posições'}</button>
          </div>
        </header>
        {modo && <p className="mut">Clique em dois jogadores para trocar de lugar. Isso coloca a escalação no manual.</p>}
        <div className="cards">{tit.map((p, i) => <Card key={p.id} p={p} i={i} />)}</div>
      </section>
      <section className="sec" style={{ marginTop: 22 }}>
        <header className="sec-h"><h3><span className="chev">»</span>Reservas</h3><button className="link" onClick={() => ir('mercado')}>Contratar ›</button></header>
        <div className="cards">
          {res.map((p, i) => <Card key={p.id} p={p} i={i + nR} />)}
          {Array.from({ length: Math.max(0, maxElenco(g) - ps.length) }, (_, i) => <div key={i} className="pcard mini vazio">vaga</div>)}
        </div>
      </section>
    </div>
  );
}
