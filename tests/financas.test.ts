import { it } from 'vitest';
import { novoEstado, assumirCarreira, opcoesDeTime, resolver, confirmarPeneira, custoCandidato, folhaSemanal, custosFixos, receitasFixas } from '../src/engine/org';
import { passo, jogarDia } from '../src/engine/sim';
import { GAMES } from '../src/engine/games';
import type { Cenario } from '../src/engine/types';
it.skipIf(!process.env.FIN)('diagnóstico financeiro', () => {
  for (const cen of ['nova', 'crise', 'investidor'] as Cenario[]) {
    const s = novoEstado(7, ['lol', 'cs2']);
    const tl = opcoesDeTime(s, 'lol', 'CBLOL', cen)[0], tc = opcoesDeTime(s, 'cs2', 'AM', cen)[0];
    assumirCarreira(s, { nome: 'Teste', sigla: 'TST', cor: '#3d8bff', cenario: cen, regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl?.id, cs2: tc?.id } } as any);
    if (cen === 'nova') {
      // escolhe o melhor de cada função que caiba em metade da verba por jogo + 1 reserva barato
      for (const g of s.jogos) {
        const P = s.peneira[g]!; const nR = GAMES[g].roles.length; const verba = s.org.caixa / 2 * 0.85;
        let gasto = 0;
        for (let r = 0; r < nR; r++) {
          const c = P.candidatos.filter(c => s.players[c.pid].role === r && !P.escolhidos.includes(c.pid)).sort((a, b) => s.players[b.pid].ovr - s.players[a.pid].ovr)
            .find(c => gasto + custoCandidato(s, c) <= verba * (r + 1) / nR) ?? P.candidatos.filter(c => s.players[c.pid].role === r).sort((a, b) => custoCandidato(s, a) - custoCandidato(s, b))[0];
          P.escolhidos.push(c.pid); gasto += custoCandidato(s, c);
        }
        const res = P.candidatos.filter(c => !P.escolhidos.includes(c.pid)).sort((a, b) => custoCandidato(s, a) - custoCandidato(s, b))[0];
        P.escolhidos.push(res.pid);
      }
      const e = confirmarPeneira(s); if (e) console.log('peneira', e);
    }
    const linhas: string[] = [];
    const caixa0 = s.org.caixa;
    let n = 0;
    while (s.dia < 364) {
      const r = passo(s); if (r === 'jogo') jogarDia(s);
      for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, (m.dados?.venda || m.dados?.emprestimo) ? m.acoes[m.acoes.length - 1].id : m.acoes[0].id);
      if (s.dia % 7 === 1 && [1, 8, 15, 29, 57, 99, 183, 274, 351].includes(s.dia)) {
        const elenco = s.jogos.reduce((a, g) => a + s.teams[s.orgTeams[g]!].elenco.length, 0);
        linhas.push(`d${s.dia} caixa ${Math.round(s.org.caixa / 1000)}k | elenco ${elenco} folha ${Math.round(folhaSemanal(s) / 1000)}k | fixos ${JSON.stringify(custosFixos(s))} | rec ${JSON.stringify(receitasFixas(s))} | rep ${s.org.rep} fas ${s.org.fas} patro ${s.patro.length}`);
      }
      n++;
    }
    console.log(`\n=== ${cen} (caixa inicial ${caixa0}) ===\n` + linhas.join('\n'));
  }
}, 120000);
