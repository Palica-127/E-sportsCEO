// Estado global do jogo: o motor muda o objeto e a interface é avisada.
import { useSyncExternalStore } from 'react';
import type { State } from './engine/types';
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

const KEY = 'esportsceo-v2';
export let antigo = false;
let state: State | null = load();
let versao = 0;
const ouvintes = new Set<() => void>();

function load(): State | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw.startsWith('{') ? raw : decompressFromUTF16(raw) ?? 'null');
    if (s?.v === 3) {
      // sem sistema de olheiro: olheiros contratados em saves antigos saem da folha
      for (const [id, x] of Object.entries(s.staff ?? {}) as [string, { cargo: string }][]) if (x.cargo === 'olheiro') delete s.staff[id];
      return s;
    }
    if (s) antigo = true;
    return null;
  } catch { return null; }
}

let timer: ReturnType<typeof setTimeout> | null = null;
function salvar() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    try { if (state) localStorage.setItem(KEY, compressToUTF16(JSON.stringify(state))); else localStorage.removeItem(KEY); } catch (e) { console.warn('save falhou', e); }
  }, 400);
}

export function getState(): State | null { return state; }
export function setState(s: State | null) { state = s; mudou(); }
/** roda uma ação do motor e avisa a interface */
export function act<T>(fn: (s: State) => T): T {
  const r = fn(state!);
  mudou();
  return r;
}
export function mudou() { versao++; salvar(); ouvintes.forEach(f => f()); }
export function salvarAgora() {
  if (timer) clearTimeout(timer);
  try { if (state) localStorage.setItem(KEY, compressToUTF16(JSON.stringify(state))); } catch {}
}

export function useGame(): State | null {
  useSyncExternalStore(cb => { ouvintes.add(cb); return () => ouvintes.delete(cb); }, () => versao);
  return state;
}

window.addEventListener('beforeunload', salvarAgora);
