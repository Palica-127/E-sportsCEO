import { expect, it } from 'vitest';
import { novoEstado, assumirCarreira, opcoesDeTime, resolver } from '../src/engine/org';
import { passo, jogarDia, jogosDoTorneio } from '../src/engine/sim';
import { entrarNoJogo, opcoesCompra, prepararJogo, pendencias } from '../src/engine/expansao';
import { abrirAcademy, academyDe, moverBase } from '../src/engine/academy';

it('expansão (compra e investidor) e Academy jogando a temporada', () => {
  const s = novoEstado(5, ['lol', 'cs2']);
  const tl = opcoesDeTime(s, 'lol', 'CBLOL', 'investidor')[0], tc = opcoesDeTime(s, 'cs2', 'AM', 'investidor')[0];
  assumirCarreira(s, { nome: 'Org', sigla: 'ORG', cor: '#fff', cenario: 'investidor', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl.id, cs2: tc.id } });
  s.sede.nivel = 3; s.org.caixa = 30_000_000; s.org.rep = 60;
  expect(abrirAcademy(s, 'lol')).toBeNull();
  const ac = academyDe(s, 'lol')!;
  expect(ac.tier).toBe(2);
  prepararJogo(s, 'valorant');
  const reg = Object.values(s.leagues).find(l => l.game === 'valorant')!.region;
  const alvo = opcoesCompra(s, 'valorant', reg, 'compra')[0];
  expect(pendencias(s, 'valorant', reg, 'compra', alvo.id)).toEqual([]);
  expect(entrarNoJogo(s, 'valorant', reg, 'compra', alvo.id)).toBeNull();
  expect(s.jogos).toContain('valorant');
  prepararJogo(s, 'dota2');
  const rd = Object.values(s.leagues).find(l => l.game === 'dota2')!.region;
  expect(entrarNoJogo(s, 'dota2', rd, 'investidor', opcoesCompra(s, 'dota2', rd, 'investidor')[0].id)).toBeNull();
  // promove um jovem
  const jovem = ac.elenco[5];
  expect(moverBase(s, 'lol', jovem)).toContain('subiu');
  while (s.dia < 364) { const r = passo(s); if (r === 'jogo') jogarDia(s); for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[m.acoes.length - 1].id); }
  const tv = s.orgTeams.valorant!;
  const jogosV = Object.values(s.matches).filter(m => m.a === tv || m.b === tv);
  expect(jogosV.length).toBeGreaterThan(10);
  const jogosA = Object.values(s.matches).filter(m => m.a === ac.id || m.b === ac.id);
  console.log('academy jogos', jogosA.length, 'valorant', jogosV.length, 'caixa', s.org.caixa);
  expect(jogosA.length).toBeGreaterThan(10);
  // Academy nunca disputa acesso
  expect(Object.values(s.torneios).some(t => t.kind === 'acesso' && t.teams.includes(ac.id))).toBe(false);
}, 120000);

it('entrada do zero abre peneira só do jogo novo', async () => {
  const { confirmarPeneira } = await import('../src/engine/org');
  const { GAMES } = await import('../src/engine/games');
  const s = novoEstado(9, ['lol', 'cs2']);
  const tl = opcoesDeTime(s, 'lol', 'CBLOL', 'crise')[0], tc = opcoesDeTime(s, 'cs2', 'AM', 'crise')[0];
  assumirCarreira(s, { nome: 'Org', sigla: 'ORG', cor: '#fff', cenario: 'crise', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl.id, cs2: tc.id } });
  s.sede.nivel = 3; s.org.caixa = 3_000_000; s.org.rep = 40;
  prepararJogo(s, 'r6');
  const reg = Object.values(s.leagues).find(l => l.game === 'r6')!.region;
  expect(entrarNoJogo(s, 'r6', reg, 'zero')).toBeNull();
  expect(s.fase).toBe('peneira');
  const P = s.peneira.r6!;
  const nR = GAMES.r6.roles.length;
  for (let r = 0; r < nR; r++) P.escolhidos.push(P.candidatos.find(c => s.players[c.pid].role === r && !P.escolhidos.includes(c.pid))!.pid);
  expect(confirmarPeneira(s)).toBeNull();
  expect(s.fase).toBe('jogo');
  expect(s.teams[s.orgTeams.r6!].elenco.length).toBe(nR);
});
