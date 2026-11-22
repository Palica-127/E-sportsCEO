import { expect, it } from 'vitest';
import { novoEstado, assumirCarreira, opcoesDeTime, resolver } from '../src/engine/org';
import { passo, jogarDia } from '../src/engine/sim';

it('prêmios anuais, aposentadorias, Hall da Fama e temporadas', () => {
  const s = novoEstado(11, ['lol', 'cs2']);
  const tl = opcoesDeTime(s, 'lol', 'CBLOL', 'investidor')[0], tc = opcoesDeTime(s, 'cs2', 'AM', 'investidor')[0];
  assumirCarreira(s, { nome: 'Org', sigla: 'ORG', cor: '#fff', cenario: 'investidor', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl.id, cs2: tc.id } });
  const n0 = Object.keys(s.players).length;
  while (s.dia < 364 * 4) { const r = passo(s); if (r === 'jogo') jogarDia(s); for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[m.acoes.length - 1].id); }
  console.log('premios', s.premiosAno?.length, 'hall', s.hall?.length, 'hof', s.hall?.filter(h => h.hof).length, 'lendas', s.hall?.filter(h => h.lendaOrg).length, 'jogadores', n0, '→', Object.keys(s.players).length, 'temporadas', s.temporadas?.length);
  console.log(s.premiosAno?.slice(0, 2).map(p => `${p.game} MVP ${p.mvp?.nick} ${p.mvp?.sigla} rev ${p.revelacao?.nick} time ${p.timeDoAno}`).join('\n'));
  console.log(s.hall?.slice(0, 5).map(h => `${h.nick} ${h.game} ${h.titulos}t ${h.premios.length}p ${h.pontos} hof=${h.hof} lenda=${h.lendaOrg}`).join('\n'));
  expect(s.premiosAno!.length).toBe(8);
  expect(s.temporadas!.length).toBe(4);
  expect(Object.keys(s.players).length).toBeLessThan(n0 * 1.6);
}, 300000);
