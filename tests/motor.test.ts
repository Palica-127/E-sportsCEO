import { describe, expect, it } from 'vitest';
import { novoEstado, assumirCarreira, confirmarPeneira, opcoesDeTime, validaPeneira, resolver } from '../src/engine/org';
import { passo, jogarDia, anoDe } from '../src/engine/sim';
import { GAMES } from '../src/engine/games';

function rodaDias(s: any, n: number) {
  let jogos = 0;
  const alvo = s.dia + n;
  while (s.dia < alvo) {
    const r = passo(s);
    if (r === 'jogo') jogos += jogarDia(s).length;
    for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[0].id);
  }
  return jogos;
}

describe('motor', () => {
  it('org nova: peneira e duas temporadas completas', async () => {
    const s = novoEstado(42, ['lol', 'cs2']);
    assumirCarreira(s, { nome: 'Capivara Esports', sigla: 'CAP', cor: '#22aa88', cenario: 'nova', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: {} });
    expect(s.fase).toBe('peneira');
    for (const g of s.jogos) {
      const P = s.peneira[g]!;
      for (let r = 0; r < GAMES[g].roles.length; r++) {
        const c = P.candidatos.filter(c => s.players[c.pid].role === r && !c.multa).sort((a, b) => b.faixa[1] - a.faixa[1])[0];
        P.escolhidos.push(c.pid);
      }
      expect(validaPeneira(s, g)).toBeNull();
    }
    expect(confirmarPeneira(s)).toBeNull();
    const jogos = rodaDias(s, 364);
    expect(anoDe(s.dia)).toBe(2028);
    expect(jogos).toBeGreaterThan(40);
    const h27 = s.hist.filter(h => h.ano === 2027);
    // LoL: 3 splits x 12 ligas + First Stand, MSI, EWC, Mundial; CS2: 3 x 6 + 2 internacionais
    expect(h27.length).toBe(36 + 4 + 18 + 2);
    const nomes = h27.map(h => h.nome);
    for (const n of ['First Stand 2027', 'MSI 2027', 'Esports World Cup 2027', 'Mundial 2027', 'IEM Cologne Major 2027', 'CS2 Major Championship 2027']) expect(nomes).toContain(n);
    const acessos = Object.values(s.torneios).filter(t => t.kind === 'acesso' && t.fim);
    expect(acessos.length).toBe(3 * 9);
    rodaDias(s, 364);
    expect(s.hist.filter(h => h.ano === 2028).length).toBe(60);
    const det = Object.values(s.matches).find(m => m.det)!;
    expect(det.det![0].ev.length).toBeGreaterThan(2);
    for (const k of Object.keys(s)) console.log('  ', k, Math.round(JSON.stringify((s as any)[k]).length / 1024), 'KB'); console.log('partidas', Object.keys(s.matches).length, 'com det', Object.values(s.matches).filter((m: any) => m.det).length);
    const { compressToUTF16 } = await import('lz-string'); console.log('comprimido KB', Math.round(compressToUTF16(JSON.stringify(s)).length * 2 / 1024));
    console.log('caixa', s.org.caixa, 'conf', s.diretoria.confianca, 'save KB', Math.round(JSON.stringify(s).length / 1024), 'tiers', s.jogos.map(g => s.teams[s.orgTeams[g]!].tier));
    console.log(s.hist.filter(h => h.ano === 2028 && !h.nome.includes('Split')).map(h => `${h.nome}: ${h.campeao}`).join('\n'));
  });
  it('investidor joga internacional', () => {
    const s = novoEstado(7, ['lol', 'valorant']);
    const tl = opcoesDeTime(s, 'lol', 'LCK', 'investidor')[0];
    const tv = opcoesDeTime(s, 'valorant', 'AM', 'investidor')[0];
    assumirCarreira(s, { nome: 'Rico FC', sigla: 'RICO', cor: '#ff0', cenario: 'investidor', regioes: { lol: 'LCK', valorant: 'AM' }, times: { lol: tl.id, valorant: tv.id } });
    expect(s.fase).toBe('jogo');
    rodaDias(s, 364);
    const intl = Object.values(s.torneios).filter(t => ['fs', 'msi', 'ewc', 'worlds', 'intlA', 'intlB'].includes(t.kind) && t.teams.some(id => s.teams[id].org));
    console.log('internacionais da org:', intl.map(t => `${t.nome} (${t.campeao && s.teams[t.campeao].org ? 'campeã' : t.elim[t.teams.find(id => s.teams[id].org)!] ?? '?'})`).join(', '));
    expect(intl.length).toBeGreaterThan(0);
  });
});
