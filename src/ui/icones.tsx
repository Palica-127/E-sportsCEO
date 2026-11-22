import { ClipboardList, Gamepad2, Handshake, Landmark, Newspaper, Search, Wallet } from 'lucide-react';
import type { Msg } from '../engine/types';

export const CAT: Record<Msg['cat'], { Ico: typeof Landmark; cor: string; nome: string }> = {
  diretoria: { Ico: Landmark, cor: '#8b5cf6', nome: 'Diretoria' },
  tecnico: { Ico: ClipboardList, cor: '#2ec5e8', nome: 'Comissão' },
  financas: { Ico: Wallet, cor: '#3fd17a', nome: 'Finanças' },
  patrocinio: { Ico: Handshake, cor: '#f59e0b', nome: 'Patrocínio' },
  jogo: { Ico: Gamepad2, cor: '#e5484d', nome: 'Elenco e mercado' },
  noticia: { Ico: Newspaper, cor: '#64748b', nome: 'Notícias' },
  peneira: { Ico: Search, cor: '#14b8c4', nome: 'Scouting' },
};
export function IcoCat({ cat, size = 30 }: { cat: Msg['cat']; size?: number }) {
  const c = CAT[cat];
  return <c.Ico width={size} height={size} style={{ background: c.cor, color: '#fff', padding: size * 0.14, borderRadius: 3 }} />;
}
