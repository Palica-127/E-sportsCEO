// Gerador aleatório com semente guardada no save (mulberry32).
export interface HasSeed { seed: number }

export function rnd(s: HasSeed): number {
  let t = (s.seed = (s.seed + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const ri = (s: HasSeed, a: number, b: number) => a + Math.floor(rnd(s) * (b - a + 1));
export const pick = <T>(s: HasSeed, arr: T[]): T => arr[Math.floor(rnd(s) * arr.length)];
export const chance = (s: HasSeed, p: number) => rnd(s) < p;
export function shuffle<T>(s: HasSeed, arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd(s) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** escolhe com pesos */
export function weighted<T>(s: HasSeed, items: T[], w: (x: T) => number): T {
  const ws = items.map(w);
  let t = rnd(s) * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; }
  return items[items.length - 1];
}
/** hash de texto estável (cores de escudo etc.) */
export function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
