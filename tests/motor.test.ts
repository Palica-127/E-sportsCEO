import { describe, expect, it } from 'vitest';
import { novoEstado, assumirCarreira, confirmarPeneira, opcoesDeTime, validaPeneira, resolver } from '../src/engine/org';
import { passo, jogarDia, tabela, anoDe } from '../src/engine/sim';
import { GAMES } from '../src/engine/games';

function rodaDias(s: any, n: number) {
  let jogos = 0;
  for (let i = 0; i < n; i++) {
    const r = passo(s);
    if (r === 'jogo') { jogos += jogarDia(s).length; i--; continue; }
    for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[0].id);
  }
  return jogos;
}

describe('motor', () => {
  it('org nova: peneira e um ano inteiro', () => {
    const s = novoEstado(42, ['lol', 'cs2']);
    assumirCarreira(s, { nome: 'Capivara Esports', sigla: 'CAP', cor: '#22aa88', cenario: 'nova', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: {} });
    expect(s.fase).toBe('peneira');
    for (const g of s.jogos) {
      const P = s.peneira[g]!;
      const nR = GAMES[g].roles.length;
      for (let r = 0; r < nR; r++) {
        const c = P.candidatos.filter(c => s.players[c.pid].role === r && !c.multa).sort((a, b) => a.luvas - b.luvas)[0];
        P.escolhidos.push(c.pid);
      }
      expect(validaPeneira(s, g)).toBeNull();
    }
    expect(confirmarPeneira(s)).toBeNull();
    expect(s.fase).toBe('jogo');
    const jogos = rodaDias(s, 370);
    expect(anoDe(s.dia)).toBe(2028);
    const camp28 = () => s.hist.filter((h: any) => h.ano === 2028).length;
    expect(jogos).toBeGreaterThan(20);
    const camp = s.hist.filter(h => h.ano === 2027);
    // 2 splits x (6 regiões LoL + 3 CS) x 2 tiers
    expect(camp.length).toBe(3 * (6 + 3) * 2);
    const det = Object.values(s.matches).find(m => m.det)!;
    expect(det.det!.length).toBeGreaterThan(0);
    expect(det.det![0].ev.length).toBeGreaterThan(2);
    rodaDias(s, 364);
    expect(camp28()).toBe(54);
    console.log('caixa final', s.org.caixa, 'confiança', s.diretoria.confianca, 'inbox', s.inbox.length, 'tamanho save KB', Math.round(JSON.stringify(s).length / 1024));
    console.log(tabela(s, 'lol-CBLOL-1', 2).map(l => `${l.pos} ${l.team.nome} ${l.v}-${l.d}`).join('\n'));
  });
  it('investidor assume time T1', () => {
    const s = novoEstado(7, ['lol', 'valorant']);
    const tl = opcoesDeTime(s, 'lol', 'LCK', 'investidor')[0];
    const tv = opcoesDeTime(s, 'valorant', 'AM', 'investidor')[0];
    assumirCarreira(s, { nome: 'Rico FC', sigla: 'RICO', cor: '#ff0', cenario: 'investidor', regioes: { lol: 'LCK', valorant: 'AM' }, times: { lol: tl.id, valorant: tv.id } });
    expect(s.fase).toBe('jogo');
    expect(s.teams[tl.id].nome).toBe('Rico FC');
    rodaDias(s, 200);
    expect(s.hist.some(h => h.org)).toBe(true);
  });
});
