import { useState, type CSSProperties, type ReactNode } from 'react';
import { GAMES, GameId } from '../engine/games';
import type { Player, State, Team } from '../engine/types';
import { logoUrl, slug } from '../engine/world';
import FOTOS from '../data/fotos.json';

const FOTO_SET = new Set<string>(FOTOS as string[]);

export function Crest({ s, team, size = 32 }: { s: State; team: Team | undefined; size?: number }) {
  const [falhou, setFalhou] = useState(false);
  if (!team) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  const real = team.slug === '__org' ? s.org.logo : logoUrl(team.slug);
  if (real && !falhou) return <img className="crest-img" src={real} alt={team.nome} width={size} height={size} loading="lazy" onError={() => setFalhou(true)} />;
  return <Escudo sigla={team.slug === '__org' ? s.org.sigla : team.sigla} cor={team.cor} size={size} />;
}

export function Escudo({ sigla, cor, size = 32 }: { sigla: string; cor: string; size?: number }) {
  const id = 'g' + Math.abs(hash(sigla + cor));
  const fs = sigla.length >= 4 ? 25 : sigla.length === 3 ? 30 : 36;
  return (
    <svg className="crest-svg" width={size} height={size} viewBox="0 0 100 100" aria-label={sigla}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={cor} />
          <stop offset="1" stopColor="#0b0f17" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M50 4 L90 16 L90 50 C90 74 72 88 50 96 C28 88 10 74 10 50 L10 16 Z" fill={`url(#${id})`} stroke="rgba(255,255,255,.55)" strokeWidth="3" />
      <path d="M50 4 L90 16 L90 30 L10 30 L10 16 Z" fill="rgba(255,255,255,.12)" />
      <text x="50" y="62" textAnchor="middle" fontFamily="Barlow Condensed, sans-serif" fontWeight="700" fontSize={fs} fill="#fff" letterSpacing="1">{sigla}</text>
    </svg>
  );
}
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }

export function Flag({ nat }: { nat: string | null }) {
  if (!nat) return null;
  return <img className="flag" src={`/flags/${nat}.svg`} alt={nat} width={18} height={12} onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />;
}

export function GameTag({ g, full }: { g: GameId; full?: boolean }) {
  return <span className="gtag" style={{ '--g': GAMES[g].cor } as CSSProperties}>{full ? GAMES[g].nome : GAMES[g].curto}</span>;
}

export function Panel({ title, right, children, className, g }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; g?: GameId }) {
  return (
    <section className={'panel ' + (className ?? '')} style={g ? ({ '--g': GAMES[g].cor } as CSSProperties) : undefined}>
      {title && <header className="panel-h"><h3>{title}</h3>{right}</header>}
      <div className="panel-b">{children}</div>
    </section>
  );
}

export function Bar({ v, max = 100, cor }: { v: number; max?: number; cor?: string }) {
  const pct = Math.max(0, Math.min(100, (v / max) * 100));
  const c = cor ?? (pct >= 66 ? 'var(--ok)' : pct >= 40 ? 'var(--warn)' : 'var(--bad)');
  return <span className="bar"><i style={{ width: pct + '%', background: c }} /></span>;
}

export function Forma({ v }: { v: number }) {
  const cls = v >= 1.2 ? 'up2' : v >= 0.4 ? 'up' : v <= -1.2 ? 'dn2' : v <= -0.4 ? 'dn' : 'eq';
  const sym = { up2: '▲▲', up: '▲', eq: '■', dn: '▼', dn2: '▼▼' }[cls];
  return <span className={'forma ' + cls} title={`Forma ${v.toFixed(1)}`}>{sym}</span>;
}

export function Ovr({ v }: { v: number }) {
  const cls = v >= 85 ? 'o5' : v >= 80 ? 'o4' : v >= 75 ? 'o3' : v >= 70 ? 'o2' : 'o1';
  return <span className={'ovr ' + cls}>{v}</span>;
}

export function Avatar({ p, size = 34 }: { p: Player; size?: number }) {
  const k = slug(p.nick).replace(/-/g, '');
  if (p.real && FOTO_SET.has(k)) return <img className="avatar" src={`/fotos/${k}.webp`} alt={p.nick} width={size} height={size} style={{ objectFit: 'cover' }} />;
  const ini = p.nick.replace(/[^\p{L}\p{N}]/gu, '').slice(0, 2).toUpperCase();
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${Math.abs(hash(p.nick)) % 360} 35% 28%)` }}>{ini}</span>;
}

export function Ult({ r }: { r: ('V' | 'D')[] }) {
  return <span className="ult">{r.map((x, i) => <i key={i} className={x === 'V' ? 'v' : 'd'}>{x}</i>)}</span>;
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
