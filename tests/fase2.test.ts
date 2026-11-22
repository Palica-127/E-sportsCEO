import { describe, expect, it } from 'vitest';
import { novoEstado, assumirCarreira, opcoesDeTime, resolver } from '../src/engine/org';
import { passo, jogarDia } from '../src/engine/sim';
import { abrirNeg, observar, notaVista, pedidoSalario, valorClube, candidatosRosto, exigenciasRosto, dispensar } from '../src/engine/mercado';
import { construir, mudarSede } from '../src/engine/sede';
import { contratarStaff, doCargo } from '../src/engine/staff';

function dias(s: any, n: number, auto = true) {
  const alvo = s.dia + n;
  while (s.dia < alvo) { const r = passo(s); if (r === 'jogo') jogarDia(s); if (auto) for (const m of s.inbox) if (m.acoes && !m.resolvida) resolver(s, m.id, m.acoes[0].id); }
}

describe('fase 2', () => {
  it('olheiro, negociação, sede e staff', () => {
    const s = novoEstado(5, ['lol', 'cs2']);
    const tl = opcoesDeTime(s, 'lol', 'CBLOL', 'crise')[0], tc = opcoesDeTime(s, 'cs2', 'AM', 'crise')[0];
    assumirCarreira(s, { nome: 'Teste', sigla: 'TST', cor: '#f00', cenario: 'crise', regioes: { lol: 'CBLOL', cs2: 'AM' }, times: { lol: tl.id, cs2: tc.id } });
    expect(Object.values(s.staff).filter(x => x.cargo === 'tecnico').length).toBe(2);
    expect(s.sede.nivel).toBe(1);
    // olheiro revela nota
    const alvo = Object.values(s.players).find(p => p.game === 'lol' && p.teamId && !s.teams[p.teamId].org && p.ovr < 78)!;
    expect(notaVista(s, alvo).txt).toBe('?');
    expect(observar(s, alvo.id)).toBeNull();
    dias(s, 12, false);
    expect(notaVista(s, alvo).txt).not.toBe('?');
    expect(s.inbox.some(m => m.titulo.startsWith('Relatório'))).toBe(true);
    // contratar agente livre com salário acima do pedido
    s.org.caixa = 3_000_000;
    const livre = Object.values(s.players).filter(p => p.game === 'lol' && !p.teamId).sort((a, b) => b.ovr - a.ovr)[0];
    const t = s.teams[s.orgTeams.lol!];
    while (t.elenco.length >= 8) dispensar(s, t.elenco[t.elenco.length - 1]);
    s.org.rep = 70;
    expect(abrirNeg(s, livre.id, { fee: 0, sal: pedidoSalario(s, livre) + 500, anos: 2, papel: 'reserva' })).toBeNull();
    dias(s, 5, false);
    // se pediu titularidade, refaz como titular
    if (livre.teamId !== t.id) { abrirNeg(s, livre.id, { fee: 0, sal: pedidoSalario(s, livre) + 500, anos: 2, papel: 'titular' }); dias(s, 5, false); }
    expect(livre.teamId).toBe(t.id);
    expect(livre.hist?.length).toBeGreaterThan(0);
    // comprar jogador com contrato na janela (dia 70+)
    dias(s, 75 - s.dia);
    const comTime = Object.values(s.players).find(p => p.game === 'lol' && p.teamId && !s.teams[p.teamId].org && p.ovr >= 70 && p.ovr <= 76)!;
    while (t.elenco.length >= 8) dispensar(s, t.elenco[t.elenco.length - 1]);
    abrirNeg(s, comTime.id, { fee: valorClube(s, comTime) * 2, sal: pedidoSalario(s, comTime) * 2, anos: 2, papel: 'titular' });
    dias(s, 8);
    expect(s.negs.find(n => n.pid === comTime.id)!.etapa === 'fechada' || s.negs.find(n => n.pid === comTime.id)!.etapa === 'cancelada').toBe(true);
    // sede: construir consultório e contratar psicólogo
    expect(contratarStaff(s, s.staffPool.find(x => x.cargo === 'psicologo')!.id)).toMatch(/Consultório/);
    expect(construir(s, 'consultorio')).toBeNull();
    dias(s, 8);
    expect(s.sede.comodos.consultorio?.nivel).toBe(1);
    expect(contratarStaff(s, s.staffPool.find(x => x.cargo === 'psicologo')!.id)).toBeNull();
    expect(doCargo(s, 'psicologo').length).toBe(1);
    expect(mudarSede(s, 2, 'aluguel')).toBeNull();
    // rosto
    const c = candidatosRosto(s, 'lol')[0];
    expect(exigenciasRosto(s, 'lol', c).length).toBe(6);
    dias(s, 300);
    console.log('redes', s.redes.slice(-3).map(r => r.txt), 'caixa', s.org.caixa, 'negs', s.negs.map(n => n.etapa).join(','));
  });
});
