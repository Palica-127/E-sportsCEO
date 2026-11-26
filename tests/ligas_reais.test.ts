import { describe, expect, it } from 'vitest';
import { novoEstado, assumirCarreira, confirmarPeneira, validaPeneira, resolver } from '../src/engine/org';
import { passo, jogarDia, anoDe } from '../src/engine/sim';
import { GAMES, premioReal, rawLeagues } from '../src/engine/games';

function rodaDias(s: any, n: number) {
  const alvo = s.dia + n;
  while (s.dia < alvo) {
    if (passo(s) === 'jogo') jogarDia(s);
    for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[0].id);
  }
}

describe('ligas reais (tools/ligas_reais.py)', () => {
  it('Free Fire, Wild Rift e EA FC: temporada completa com os campeonatos reais', () => {
    const s = novoEstado(7, ['ff', 'wr', 'fifa']);
    assumirCarreira(s, { nome: 'Capivara Esports', sigla: 'CAP', cor: '#22aa88', cenario: 'nova', regioes: { ff: 'BR', wr: 'CN', fifa: 'BR' }, times: {} });
    for (const g of s.jogos) {
      const P = s.peneira[g]!;
      for (let r = 0; r < GAMES[g].roles.length; r++) {
        const c = P.candidatos.filter(c => s.players[c.pid].role === r && !c.multa).sort((a, b) => b.faixa[1] - a.faixa[1])[0];
        P.escolhidos.push(c.pid);
      }
      expect(validaPeneira(s, g)).toBeNull();
    }
    expect(confirmarPeneira(s)).toBeNull();
    rodaDias(s, 364);
    expect(anoDe(s.dia)).toBe(2028);
    const nomes = s.hist.filter(h => h.ano === 2027).map(h => h.nome);
    for (const n of ['FFWS Brasil · Split 1', 'Esports World Cup 2027', 'FFWS Global Finals 2027', 'Wild Rift Super League · Split 1',
      'Icons Global Championship 2027', 'eLibertadores · Split 1', 'FC Pro World Championship 2027']) expect(nomes).toContain(n);
  });

  it('times reais nas ligas e prêmio real do campeão', () => {
    expect(rawLeagues('ff').BR.t1.map(t => t.n)).toContain('Fluxo W7M');
    expect(rawLeagues('wr').CN.t1[0].n).toBe('ThunderTalk Gaming');
    expect(rawLeagues('fifa').EU.t1[0].p[0][0]).toBe('Vejrgang');
    expect(premioReal('ff', 'split', 'BR')).toBe(44_081 * 4);
    expect(premioReal('ff', 'intlB')).toBe(350_000 * 4);
    expect(premioReal('lol', 'split', 'CBLOL')).toBeUndefined();
  });
});
