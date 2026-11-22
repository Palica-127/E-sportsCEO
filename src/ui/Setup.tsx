import { CSSProperties, useMemo, useState } from 'react';
import { GAMES, GAME_IDS, GameId, regioes } from '../engine/games';
import { CENARIOS, assumirCarreira, novoEstado, opcoesDeTime } from '../engine/org';
import type { Cenario, State } from '../engine/types';
import { forca, titulares } from '../engine/world';
import { antigo, setState } from '../store';
import { Crest, Escudo, Flag, Ovr } from './common';

const CORES = ['#d4af37', '#e5484d', '#3d8bff', '#19c37d', '#a855f7', '#f08c2e', '#14b8c4', '#ec4899', '#e6ebf5'];

export function Setup() {
  const [etapa, setEtapa] = useState(0);
  const [nome, setNome] = useState('');
  const [sigla, setSigla] = useState('');
  const [cor, setCor] = useState(CORES[0]);
  const [logo, setLogo] = useState<string | undefined>();
  const [cen, setCen] = useState<Cenario>('nova');
  const [g2, setG2] = useState<GameId>('cs2');
  const [mundo, setMundo] = useState<State | null>(null);
  const [reg, setReg] = useState<Partial<Record<GameId, string>>>({});
  const [times, setTimes] = useState<Partial<Record<GameId, string>>>({});

  const jogos: GameId[] = ['lol', g2];
  const siglaAuto = sigla || nome.replace(/[^\p{L}\p{N} ]/gu, '').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 3).toUpperCase() || 'ORG';

  function irParaTimes() {
    const s = novoEstado((Date.now() % 1e9) | 0, jogos);
    setMundo(s);
    setReg({ lol: 'CBLOL', [g2]: regioes(g2)[0].id });
    setTimes({});
    setEtapa(3);
  }
  function comecar() {
    const s = mundo!;
    assumirCarreira(s, { nome: nome.trim(), sigla: siglaAuto, cor, logo, cenario: cen, regioes: reg, times });
    setState(s);
  }
  const prontoTimes = jogos.every(g => reg[g] && (cen === 'nova' || times[g]));

  return (
    <div className="setup">
      <div className="setup-top">
        <div className="brand"><span className="brand-mark">e</span>Sports <b>CEO</b></div>
        <ol className="steps">{['Organização', 'Cenário', 'Jogos', 'Times'].map((t, i) => <li key={t} className={i === etapa ? 'on' : i < etapa ? 'ok' : ''}>{t}</li>)}</ol>
      </div>
      {antigo && etapa === 0 && <div className="aviso-antigo">O save antigo é de uma versão anterior do jogo e não abre mais nesta. Comece uma carreira nova.</div>}

      {etapa === 0 && (
        <div className="setup-card">
          <h1>Crie sua organização</h1>
          <p className="mut">Você é o CEO. Os técnicos cuidam do jogo, você cuida da org.</p>
          <div className="org-form">
            <div className="org-preview">
              {logo ? <img src={logo} width={120} height={120} className="crest-img" /> : <Escudo sigla={siglaAuto} cor={cor} size={120} />}
              <strong>{nome || 'Sua org'}</strong>
            </div>
            <div className="fields">
              <label>Nome<input value={nome} maxLength={24} onChange={e => setNome(e.target.value)} placeholder="Ex.: Capivara Esports" autoFocus /></label>
              <label>Sigla<input value={sigla} maxLength={4} onChange={e => setSigla(e.target.value.toUpperCase())} placeholder={siglaAuto} /></label>
              <div className="lbl">Cor principal</div>
              <div className="swatches">{CORES.map(c => <button key={c} className={c === cor ? 'on' : ''} style={{ background: c }} onClick={() => setCor(c)} aria-label={c} />)}<input type="color" value={cor} onChange={e => setCor(e.target.value)} /></div>
              <label className="file">Logo (opcional)
                <input type="file" accept="image/*" onChange={e => e.target.files?.[0] && lerLogo(e.target.files[0]).then(setLogo)} />
              </label>
              {logo && <button className="btn ghost sm" onClick={() => setLogo(undefined)}>Remover logo</button>}
            </div>
          </div>
          <div className="setup-nav"><span /><button className="btn primary" disabled={nome.trim().length < 2} onClick={() => setEtapa(1)}>Próximo</button></div>
        </div>
      )}

      {etapa === 1 && (
        <div className="setup-card wide">
          <h1>Como a história começa?</h1>
          <div className="cen-grid">
            {(Object.keys(CENARIOS) as Cenario[]).map(k => {
              const c = CENARIOS[k];
              return (
                <button key={k} className={'cen ' + (cen === k ? 'on' : '')} onClick={() => setCen(k)}>
                  <span className="cen-ico">{k === 'nova' ? '🌱' : k === 'crise' ? '🔥' : '💼'}</span>
                  <h2>{c.nome}</h2>
                  <p>{c.resumo}</p>
                  <ul>{c.detalhes.map(d => <li key={d}>{d}</li>)}</ul>
                  <div className="meta">Meta: {c.meta}</div>
                </button>
              );
            })}
          </div>
          <div className="setup-nav"><button className="btn ghost" onClick={() => setEtapa(0)}>Voltar</button><button className="btn primary" onClick={() => setEtapa(2)}>Próximo</button></div>
        </div>
      )}

      {etapa === 2 && (
        <div className="setup-card wide">
          <h1>Seus dois primeiros jogos</h1>
          <p className="mut">O League of Legends é a base da org. Escolha o segundo jogo. Os outros você abre ao longo da carreira.</p>
          <div className="game-grid">
            {GAME_IDS.map(g => (
              <button key={g} disabled={g === 'lol'} className={'game-card ' + (g === 'lol' || g === g2 ? 'on' : '')} style={{ '--g': GAMES[g].cor } as CSSProperties} onClick={() => setG2(g)}>
                <span className="gc-curto">{GAMES[g].curto}</span>
                <span className="gc-nome">{GAMES[g].nome}</span>
                {g === 'lol' && <span className="gc-fixo">Base da org</span>}
              </button>
            ))}
          </div>
          <div className="setup-nav"><button className="btn ghost" onClick={() => setEtapa(1)}>Voltar</button><button className="btn primary" onClick={irParaTimes}>Próximo</button></div>
        </div>
      )}

      {etapa === 3 && mundo && (
        <div className="setup-card wide">
          <h1>{cen === 'nova' ? 'Onde você compra a vaga?' : cen === 'crise' ? 'Qual org em crise você assume?' : 'Em qual org você investe?'}</h1>
          {jogos.map(g => (
            <EscolhaJogo key={g} s={mundo} g={g} cen={cen} reg={reg[g]} time={times[g]}
              onReg={r => { setReg({ ...reg, [g]: r }); setTimes({ ...times, [g]: undefined }); }}
              onTime={t => setTimes({ ...times, [g]: t })} />
          ))}
          <div className="setup-nav"><button className="btn ghost" onClick={() => setEtapa(2)}>Voltar</button><button className="btn primary" disabled={!prontoTimes} onClick={comecar}>{cen === 'nova' ? 'Ir para a peneira' : 'Começar carreira'}</button></div>
        </div>
      )}
    </div>
  );
}

function EscolhaJogo({ s, g, cen, reg, time, onReg, onTime }: { s: State; g: GameId; cen: Cenario; reg?: string; time?: string; onReg: (r: string) => void; onTime: (t: string) => void }) {
  const ops = useMemo(() => (reg ? opcoesDeTime(s, g, reg, cen) : []), [s, g, reg, cen]);
  const sel = time ? s.teams[time] : null;
  return (
    <div className="esc-jogo" style={{ '--g': GAMES[g].cor } as CSSProperties}>
      <h2><span className="gtag" style={{ '--g': GAMES[g].cor } as CSSProperties}>{GAMES[g].curto}</span> {GAMES[g].nome}</h2>
      <div className="reg-row">
        {regioes(g).map(r => <button key={r.id} className={'chip ' + (r.id === reg ? 'on' : '')} onClick={() => onReg(r.id)}>{r.nome}<small>{r.regiao}</small></button>)}
      </div>
      {cen === 'nova' && reg && (
        <p className="mut">Você compra a vaga do time mais fraco da <b>{s.leagues[`${g}-${reg}-2`].nome}</b> e monta o elenco na peneira.</p>
      )}
      {cen !== 'nova' && reg && (
        <div className="team-pick">
          <div className="team-list">
            {ops.map(t => (
              <button key={t.id} className={'team-row ' + (t.id === time ? 'on' : '')} onClick={() => onTime(t.id)}>
                <Crest s={s} team={t} size={30} /><span className="tn">{t.nome}</span><span className="tf">Força <b>{forca(s, t).toFixed(1)}</b></span>
              </button>
            ))}
          </div>
          {sel && (
            <div className="team-prev">
              <div className="tp-h"><Crest s={s} team={sel} size={44} /><div><b>{sel.nome}</b><small>recebe o nome da sua org no rebrand</small></div></div>
              {titulares(s, sel).map(p => <div key={p.id} className="tp-p"><span className="role">{GAMES[g].roles[p.role]}</span><Flag nat={p.nat} /><span className="nick">{p.nick}</span><span className="age">{p.idade}a</span><Ovr v={p.ovr} /></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function lerLogo(f: File): Promise<string> {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = c.height = 160;
      const x = c.getContext('2d')!;
      const k = Math.min(160 / img.width, 160 / img.height);
      x.drawImage(img, (160 - img.width * k) / 2, (160 - img.height * k) / 2, img.width * k, img.height * k);
      res(c.toDataURL('image/png'));
    };
    img.src = URL.createObjectURL(f);
  });
}
