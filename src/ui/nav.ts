// navegação global: qualquer componente pode abrir uma tela (ex.: clicar no nome de um time abre a ficha)
let fn: ((tela: string, arg?: string) => void) | null = null;
export const setNav = (f: (tela: string, arg?: string) => void) => { fn = f; };
export const irPara = (tela: string, arg?: string) => fn?.(tela, arg);
export const abrirTime = (id: string) => irPara('time', id);
