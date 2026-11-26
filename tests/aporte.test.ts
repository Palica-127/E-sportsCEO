import { describe, expect, it } from 'vitest';
import { novoEstado, assumirCarreira, opcoesDeTime, resolver, tickOrg, VALOR_APORTE } from '../src/engine/org';
import { diaSemana } from '../src/engine/sim';

// org em crise assumida, depois tratada como "nova" para testar o aporte sem passar pela peneira
function estado(confianca: number) {
  const s = novoEstado(3, ['lol', 'cs2']);
  const tl = opcoesDeTime(s, 'lol', 'CBLOL', 'crise')[0], tc = opcoesDeTime(s, 'cs2', 'AM', 'crise')[0];
  assumirCarreira(s, { nome: 'Teste', sigla: 'TST', cor: '#3d8bff', cenario: 'crise', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl.id, cs2: tc.id } } as any);
  s.org.cenario = 'nova'; s.fase = 'jogo'; s.org.caixa = 100_000; s.diretoria.confianca = confianca;
  while (diaSemana(s.dia) !== 1) s.dia++;
  return s;
}

describe('aporte do fundador', () => {
  it('oferece quando o caixa aperta, entra uma vez e cobra confiança', () => {
    const s = estado(70);
    tickOrg(s);
    const m = s.inbox.find(x => x.dados?.aporte)!;
    expect(m).toBeTruthy();
    const caixa = s.org.caixa;
    resolver(s, m.id, 'aceitar');
    expect(s.org.caixa).toBe(caixa + VALOR_APORTE.nova!);
    expect(s.diretoria.confianca).toBe(58);
    // na semana seguinte não oferece de novo (1x por ano)
    s.dia += 7; tickOrg(s);
    expect(s.inbox.filter(x => x.dados?.aporte).length).toBe(1);
  });
  it('com a diretoria sem confiança, o fundador nega', () => {
    const s = estado(20);
    tickOrg(s);
    expect(s.inbox.some(x => x.dados?.aporte)).toBe(false);
    expect(s.inbox.some(x => x.titulo === 'Sem dinheiro novo por enquanto')).toBe(true);
  });
  it('org em crise não tem sócio para injetar dinheiro', () => {
    const s = estado(70); s.org.cenario = 'crise';
    tickOrg(s);
    expect(s.inbox.some(x => x.dados?.aporte)).toBe(false);
  });
});
