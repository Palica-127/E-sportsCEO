import { useState, type CSSProperties, type ReactNode } from 'react';
import { GAMES, GameId } from '../engine/games';
import type { Player, Staff, State, Team } from '../engine/types';
import { estrelas, humor, logoUrl, slug } from '../engine/world';
import FOTOS from '../data/fotos.json';
import ROSTOS from '../data/rostos.json';
import { abrirJogador, abrirTime } from './nav';

// fotos por jogo ({ lol: [...], cs2: [...] }): só jogadores reais daquele jogo têm foto
const FOTO_SETS: Record<string, Set<string>> = Object.fromEntries(Object.entries(FOTOS as Record<string, string[]>).map(([g, l]) => [g, new Set(l)]));
export function fotoDe(game: string, nick: string): string | null {
  const k = slug(nick).replace(/-/g, '');
  return FOTO_SETS[game]?.has(k) ? `/fotos/${game}/${k}.webp` : null;
}
function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

// ---------- escudos ----------
/** escudo do time; clicar abre a ficha (link={false} em telas de escolha e na janela do dia de jogo) */
export function Crest({ s, team, size = 32, link = true }: { s: State; team: Team | undefined; size?: number; link?: boolean }) {
  const [falhou, setFalhou] = useState(false);
  if (!team) return <span style={{ width: size, height: size, display: 'inline-block' }} />;
  const real = team.slug === '__org' ? s.org.logo : logoUrl(team.slug);
  const img = real && !falhou
    ? <img className="crest-img" src={real} alt={team.nome} width={size} height={size} loading="lazy" onError={() => setFalhou(true)} />
    : <Escudo sigla={team.slug === '__org' ? s.org.sigla : team.sigla} cor={team.cor} size={size} />;
  if (!link || !s.teams[team.id]) return img;
  return <span className="lnk-crest" role="link" tabIndex={0} title={team.nome} onClick={e => { e.stopPropagation(); abrirTime(team.id); }}
    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); abrirTime(team.id); } }}>{img}</span>;
}
export function Escudo({ sigla, cor, size = 32 }: { sigla: string; cor: string; size?: number }) {
  const id = 'g' + hash(sigla + cor);
  const fs = sigla.length >= 4 ? 25 : sigla.length === 3 ? 30 : 36;
  return (
    <svg className="crest-svg" width={size} height={size} viewBox="0 0 100 100" aria-label={sigla}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={cor} /><stop offset="1" stopColor="#0b0f17" stopOpacity="0.85" /></linearGradient></defs>
      <path d="M50 4 L90 16 L90 50 C90 74 72 88 50 96 C28 88 10 74 10 50 L10 16 Z" fill={`url(#${id})`} stroke="rgba(255,255,255,.6)" strokeWidth="3" />
      <path d="M50 4 L90 16 L90 30 L10 30 L10 16 Z" fill="rgba(255,255,255,.12)" />
      <text x="50" y="62" textAnchor="middle" fontFamily="Saira, sans-serif" fontWeight="700" fontSize={fs} fill="#fff">{sigla}</text>
    </svg>
  );
}

// ---------- retrato ilustrado (no lugar de fotos de pessoas reais) ----------
const PELES = ['#f1c9a5', '#e0ac85', '#c98e63', '#a8704a', '#7d5235', '#5b3a26'];
const CABELOS = ['#1b1410', '#2c1d14', '#4a2f1d', '#7a4b26', '#b98a4e', '#d9c08a', '#7d7d7d', '#3b2a4a'];
export function Retrato({ nome, cor, size = 64, foto, fone, sigla }: { nome: string; cor: string; size?: number; foto?: string | null; fone?: boolean; sigla?: string }) {
  const [falhou, setFalhou] = useState(false);
  if (foto && !falhou) return <img className="retrato foto" src={foto} width={size} height={size} alt={nome} onError={() => setFalhou(true)} />;
  const h = hash(nome);
  const pele = PELES[h % PELES.length], cab = CABELOS[(h >> 3) % CABELOS.length], estilo = (h >> 6) % 5;
  const id = 'r' + h;
  const comFone = fone ?? (h >> 9) % 3 === 0;
  return (
    <svg className="retrato" width={size} height={size} viewBox="0 0 100 100">
      <defs>
        <radialGradient id={id + 'b'} cx="50%" cy="35%" r="70%"><stop offset="0" stopColor="#4a5670" /><stop offset="1" stopColor="#1a2030" /></radialGradient>
        <linearGradient id={id + 's'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={cor} /><stop offset="1" stopColor="#0d1118" /></linearGradient>
        <clipPath id={id + 'c'}><circle cx="50" cy="50" r="50" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}c)`}>
        <rect width="100" height="100" fill={`url(#${id}b)`} />
        <path d="M8 104 C12 80 28 71 50 71 C72 71 88 80 92 104 Z" fill={`url(#${id}s)`} />
        <path d="M40 72 L50 84 L60 72" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="2.5" />
        {sigla && <text x="70" y="92" textAnchor="middle" fontFamily="Saira" fontWeight="700" fontSize="8" fill="rgba(255,255,255,.75)">{sigla}</text>}
        <rect x="43" y="56" width="14" height="16" rx="5" fill={pele} />
        <path d="M43 66 Q50 71 57 66" fill="rgba(0,0,0,.12)" />
        <ellipse cx="32.5" cy="45" rx="3.5" ry="5" fill={pele} />
        <ellipse cx="67.5" cy="45" rx="3.5" ry="5" fill={pele} />
        <ellipse cx="50" cy="42" rx="17" ry="20" fill={pele} />
        {estilo === 0 && <path d="M33 38 C33 22 67 22 67 38 C64 30 58 27 50 28 C42 27 36 30 33 38 Z" fill={cab} />}
        {estilo === 1 && <path d="M33.5 40 C32 20 68 20 66.5 40 C66 33 62 28 50 28.5 C38 28 34 33 33.5 40 Z" fill={cab} opacity=".75" />}
        {estilo === 2 && <path d="M32 46 C28 18 72 18 68 46 L66 40 C62 30 40 28 34 40 Z M62 30 C56 36 46 36 38 33" fill={cab} />}
        {estilo === 3 && <g fill={cab}>{[34, 40, 46, 52, 58, 64, 37, 44, 51, 58, 64].map((x, i) => <circle key={i} cx={x} cy={i < 6 ? 28 : 24 + (i % 2) * 2} r="6" />)}</g>}
        {estilo === 4 && <path d="M31 44 C30 20 70 20 69 44 C68 36 66 31 62 29 L60 34 L54 29 L48 34 L42 29 L38 34 C34 34 32 38 31 44 Z" fill={cab} />}
        <ellipse cx="43" cy="44" rx="2.1" ry="2.4" fill="#1a1a1a" />
        <ellipse cx="57" cy="44" rx="2.1" ry="2.4" fill="#1a1a1a" />
        <path d="M39 38.5 L46 37.8 M54 37.8 L61 38.5" stroke={cab} strokeWidth="2" strokeLinecap="round" />
        <path d="M46 53 Q50 55.5 54 53" stroke="#6b3d2e" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        {comFone && <g><path d="M30 46 C28 18 72 18 70 46" fill="none" stroke="#1d2230" strokeWidth="4" /><rect x="25" y="40" width="9" height="14" rx="4" fill="#232a3a" stroke={cor} strokeWidth="1.2" /><rect x="66" y="40" width="9" height="14" rx="4" fill="#232a3a" stroke={cor} strokeWidth="1.2" /></g>}
      </g>
      <circle cx="50" cy="50" r="48.5" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
    </svg>
  );
}
export function RetratoJogador({ s, p, size = 64 }: { s: State; p: Player; size?: number }) {
  const t = s.teams[p.teamId ?? ''];
  const foto = p.real ? fotoDe(p.game, p.nick) : null;
  return <Retrato nome={p.nick + p.id} cor={t ? (t.org ? s.org.cor : t.cor) : '#4a5568'} size={size} foto={foto} sigla={t?.sigla} />;
}
// rostos gerados por IA (pessoas que não existem) para a comissão fictícia; técnicos reais usam a foto deles
const FEM = new Set(['ana', 'juliana', 'bruna', 'paula', 'camila', 'larissa', 'emily', 'sarah', 'lena', 'sofia', 'seo-yeon']);
export function fem(nome: string) { const p = nome.split(' '); return FEM.has(p[0].toLowerCase()) || FEM.has((p[p.length - 1] ?? '').toLowerCase()); }
export function rostoStaff(x: Pick<Staff, 'nome' | 'foto' | 'fem'>): string | null {
  if (x.foto) return x.foto;
  const lista = (ROSTOS as Record<string, string[]>)[(x.fem ?? fem(x.nome)) ? 'f' : 'm'] ?? [];
  return lista.length ? `/fotos/staff/ia/${lista[hash(x.nome) % lista.length]}.webp` : null;
}
export function RetratoStaff({ s, x, size = 64 }: { s: State; x: Staff; size?: number }) {
  return <Retrato nome={x.nome} cor={s.org.cor} size={size} fone={false} sigla={s.org.sigla} foto={rostoStaff(x)} />;
}
/** nome do time clicável: abre a ficha */
export function NomeTime({ s, id, children }: { s: State; id: string; children?: ReactNode }) {
  const t = s.teams[id];
  if (!t) return <>{children ?? '—'}</>;
  return <span className="lnk-time" role="link" tabIndex={0} onClick={e => { e.stopPropagation(); abrirTime(id); }} onKeyDown={e => e.key === 'Enter' && abrirTime(id)}>{children ?? t.nome}</span>;
}

/** nick do jogador clicável: abre o perfil */
export function NomeJogador({ s, id, children }: { s: State; id: string | undefined | null; children?: ReactNode }) {
  const p = id ? s.players[id] : undefined;
  if (!p) return <>{children ?? '—'}</>;
  return <span className="lnk-time" role="link" tabIndex={0} onClick={e => { e.stopPropagation(); abrirJogador(p.id); }} onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); abrirJogador(p.id); } }}>{children ?? p.nick}</span>;
}

// ---------- pequenos componentes ----------
export function Flag({ nat }: { nat: string | null }) {
  if (!nat) return null;
  return <img className="flag" src={`/flags/${nat}.svg`} alt={nat} width={20} height={14} onError={e => ((e.target as HTMLImageElement).style.display = 'none')} />;
}
export function GameTag({ g, full }: { g: GameId; full?: boolean }) {
  return <span className="gtag" style={{ '--g': GAMES[g].cor } as CSSProperties}>{full ? GAMES[g].nome : GAMES[g].curto}</span>;
}
/** seção no estilo "» Título" com caixa de cantos em colchete */
export function Panel({ title, right, children, className, g, solto, ico }: { title?: ReactNode; right?: ReactNode; children: ReactNode; className?: string; g?: GameId; solto?: boolean; ico?: string }) {
  return (
    <section className={'sec ' + (className ?? '')} style={g ? ({ '--g': GAMES[g].cor } as CSSProperties) : undefined}>
      {title && <header className="sec-h"><h3>{ico ? <Ico3D n={ico} size={26} className="h-ico" /> : <span className="chev">»</span>}{title}</h3>{right}</header>}
      <div className={solto ? 'sec-b solto' : 'box sec-b'}>{children}</div>
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
export function Ovr({ v }: { v: number | string }) {
  const n = typeof v === 'number' ? v : parseInt(v) || 0;
  const cls = n >= 85 ? 'o5' : n >= 80 ? 'o4' : n >= 75 ? 'o3' : n >= 70 ? 'o2' : 'o1';
  return <span className={'ovr ' + cls}>{v}</span>;
}
export function Estrelas({ v, size = 14 }: { v: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }}>
      {[0, 1, 2, 3, 4].map(i => { const f = Math.max(0, Math.min(1, v - i)); return <i key={i}><b style={{ width: f * 100 + '%' }}>★</b>★</i>; })}
    </span>
  );
}
export const EstrelasNota = ({ ovr, size }: { ovr: number; size?: number }) => <Estrelas v={estrelas(ovr)} size={size} />;
export function Chips({ p, titular }: { p: Player; titular?: boolean }) {
  const h = humor(p);
  return <span className="chips2"><span className={'chip2 ' + (titular === false ? 'meh' : 'ok')}>{titular === false ? 'Reserva' : 'Ativo'}</span><span className={'chip2 ' + h.cls}>{h.txt}</span></span>;
}
export function Gauge({ v, max = 100, label, size = 96, txt }: { v: number; max?: number; label: string; size?: number; txt?: string }) {
  const pct = Math.max(0, Math.min(1, v / max));
  const r = 40, c = 2 * Math.PI * r, arco = c * 0.75;
  const cor = pct >= 0.7 ? '#3fd17a' : pct >= 0.45 ? '#f2c037' : '#e5484d';
  return (
    <div className="gauge" style={{ width: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" strokeDasharray={`${arco} ${c}`} transform="rotate(135 50 50)" strokeLinecap="round" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={cor} strokeWidth="8" strokeDasharray={`${arco * pct} ${c}`} transform="rotate(135 50 50)" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 4px ${cor})` }} />
        <text x="50" y="54" textAnchor="middle" fontFamily="Saira" fontWeight="700" fontSize="24" fill="#fff">{txt ?? Math.round(v)}</text>
        <text x="50" y="72" textAnchor="middle" fontFamily="Saira" fontWeight="600" fontSize="9" fill="#9aa4b8" letterSpacing="1">{label.toUpperCase()}</text>
      </svg>
    </div>
  );
}
export function Radar({ labels, vals, size = 260 }: { labels: string[]; vals: number[]; size?: number }) {
  const n = labels.length, cx = 100, cy = 100, R = 70;
  const pt = (i: number, f: number) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / n; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
  const poly = (f: (i: number) => number) => labels.map((_, i) => pt(i, f(i)).join(',')).join(' ');
  return (
    <svg className="radar" viewBox="-50 0 300 200" width={size * 1.5} height={size}>
      {[0.25, 0.5, 0.75, 1].map(k => <polygon key={k} points={poly(() => k)} fill="none" stroke="rgba(255,255,255,.1)" />)}
      {labels.map((_, i) => { const [x, y] = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,.08)" />; })}
      <polygon points={poly(i => Math.max(0.05, (vals[i] - 40) / 60))} fill="rgba(46,197,232,.22)" stroke="#2ec5e8" strokeWidth="2" />
      {labels.map((_, i) => { const [x, y] = pt(i, Math.max(0.05, (vals[i] - 40) / 60)); return <circle key={i} cx={x} cy={y} r="3.5" fill="#2ec5e8" />; })}
      {labels.map((l, i) => { const [x, y] = pt(i, 1.28); return <text key={l} x={x} y={y + 3} textAnchor="middle" fontFamily="Saira" fontWeight="700" fontSize="9.5" fill="#dfe5ee">{l.toUpperCase()} <tspan fill="#2ec5e8">{vals[i]}</tspan></text>; })}
    </svg>
  );
}
export function Linha({ vals, w = 300, h = 80, cor = '#2ec5e8' }: { vals: number[]; w?: number; h?: number; cor?: string }) {
  if (vals.length < 2) return <p className="mut">O gráfico aparece depois de alguns meses.</p>;
  const mn = Math.min(...vals) - 1, mx = Math.max(...vals) + 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * w},${h - ((v - mn) / (mx - mn)) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h + 14}`} width="100%" height={h + 14} className="linha">
      <polyline points={pts} fill="none" stroke={cor} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 3px ${cor})` }} />
      <text x="0" y={h + 12} fontSize="9" fill="#9aa4b8">{vals[0]}</text>
      <text x={w} y={h + 12} fontSize="9" fill="#9aa4b8" textAnchor="end">{vals[vals.length - 1]}</text>
    </svg>
  );
}
export function Ult({ r }: { r: ('V' | 'D')[] }) {
  return <span className="ult">{r.map((x, i) => <i key={i} className={x === 'V' ? 'v' : 'd'}>{x}</i>)}</span>;
}
export function Alerta({ tipo, children }: { tipo: 'ok' | 'meh' | 'bad'; children: ReactNode }) {
  return <div className={'alerta ' + tipo}><b>!</b><span>{children}</span></div>;
}
/** para compatibilidade com telas antigas */
export function Avatar({ p, size = 34, s }: { p: Player; size?: number; s?: State }) {
  if (s) return <RetratoJogador s={s} p={p} size={size} />;
  return <Retrato nome={p.nick + p.id} cor="#4a5568" size={size} />;
}
export const pct = (v: number) => `${Math.round(v * 100)}%`;

/** ícone 3D (Fluent Emoji, Microsoft, licença MIT) — arquivos em public/img/3d */
export function Ico3D({ n, size = 40, className }: { n: string; size?: number; className?: string }) {
  return <img className={'ico3d ' + (className ?? '')} src={`/img/3d/${n}.webp`} width={size} height={size} alt="" draggable={false} />;
}
