// busca global (barra de cima): acha qualquer time ou jogador do mundo e abre a ficha
import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { GAMES } from '../engine/games';
import { slug } from '../engine/world';
import type { State } from '../engine/types';
import { Crest, Flag, GameTag, RetratoJogador } from './common';
import { abrirJogador, abrirTime } from './nav';

type Res = { tipo: 'time' | 'jogador'; id: string; score: number };
const norm = (x: string) => slug(x).replace(/-/g, '');

export function busca(s: State, q: string, max = 12): Res[] {
  const k = norm(q);
  if (k.length < 2) return [];
  const pont = (nome: string) => { const n = norm(nome); return n === k ? 3 : n.startsWith(k) ? 2 : n.includes(k) ? 1 : 0; };
  const out: Res[] = [];
  for (const t of Object.values(s.teams)) { const sc = Math.max(pont(t.nome), pont(t.sigla) > 1 ? 2 : 0); if (sc) out.push({ tipo: 'time', id: t.id, score: sc + 0.5 }); }
  for (const p of Object.values(s.players)) {
    const sc = Math.max(pont(p.nick), p.nome ? pont(p.nome) * 0.8 : 0);
    if (sc) out.push({ tipo: 'jogador', id: p.id, score: sc + p.ovr / 1000 });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, max);
}

export function Busca({ s }: { s: State }) {
  const [q, setQ] = useState('');
  const [aberta, setAberta] = useState(false);
  const [sel, setSel] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const inp = useRef<HTMLInputElement>(null);
  const res = useMemo(() => busca(s, q), [s, q]);
  useEffect(() => setSel(0), [q]);
  useEffect(() => {
    const fora = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setAberta(false); };
    const atalho = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); inp.current?.focus(); setAberta(true); } };
    window.addEventListener('mousedown', fora); window.addEventListener('keydown', atalho);
    return () => { window.removeEventListener('mousedown', fora); window.removeEventListener('keydown', atalho); };
  }, []);
  const abrir = (r: Res) => { (r.tipo === 'time' ? abrirTime : abrirJogador)(r.id); setQ(''); setAberta(false); inp.current?.blur(); };
  return (
    <div className="busca" ref={box}>
      <Search size={18} />
      <input ref={inp} value={q} placeholder="Buscar time ou jogador (Ctrl+K)" onFocus={() => setAberta(true)}
        onChange={e => { setQ(e.target.value); setAberta(true); }}
        onKeyDown={e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSel(i => Math.min(i + 1, res.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(i => Math.max(i - 1, 0)); }
          else if (e.key === 'Enter' && res[sel]) abrir(res[sel]);
          else if (e.key === 'Escape') { setAberta(false); inp.current?.blur(); }
          e.stopPropagation();  // espaço/enter digitados aqui não avançam o dia
        }} />
      {aberta && q.trim().length >= 2 && (
        <div className="busca-r">
          {res.length === 0 && <div className="busca-vazio">Nada encontrado.</div>}
          {res.map((r, i) => {
            if (r.tipo === 'time') {
              const t = s.teams[r.id];
              return <button key={'t' + r.id} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => abrir(r)}>
                <Crest s={s} team={t} size={28} link={false} /><span className="grow"><b>{t.nome}</b><small>{s.leagues[`${t.game}-${t.region}-${t.tier}`]?.nome ?? 'Time'}</small></span><GameTag g={t.game} />
              </button>;
            }
            const p = s.players[r.id], t = p.teamId ? s.teams[p.teamId] : undefined;
            return <button key={'p' + r.id} className={i === sel ? 'on' : ''} onMouseEnter={() => setSel(i)} onClick={() => abrir(r)}>
              <RetratoJogador s={s} p={p} size={28} /><span className="grow"><b><Flag nat={p.nat} /> {p.nick}</b><small>{GAMES[p.game].roleNomes[p.role]} · {t ? t.nome : 'agente livre'}</small></span><GameTag g={p.game} />
            </button>;
          })}
        </div>
      )}
    </div>
  );
}
