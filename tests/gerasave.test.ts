import { it } from 'vitest';
import fs from 'node:fs';
import { novoEstado, assumirCarreira, opcoesDeTime, resolver } from '../src/engine/org';
import { passo, jogarDia } from '../src/engine/sim';
it.skipIf(!process.env.GERA_SAVE)('gera save', () => {
  const s = novoEstado(11, ['lol', 'cs2']);
  const tl = opcoesDeTime(s, 'lol', 'CBLOL', 'investidor')[0];
  const tc = opcoesDeTime(s, 'cs2', 'AM', 'investidor')[0];
  assumirCarreira(s, { nome: 'Tubarão Gaming', sigla: 'TUB', cor: '#3d8bff', cenario: 'investidor', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl.id, cs2: tc.id } });
  const alvo = Number(process.env.GERA_SAVE);
  while (s.dia < alvo) { const r = passo(s); if (r === 'jogo') jogarDia(s); for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[0].id); }
  fs.writeFileSync('/tmp/save.json', JSON.stringify(s));
});
