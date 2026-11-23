// Comissão técnica e staff da org como pessoas: técnico, auxiliar e analista por jogo; psicólogo,
// nutricionista, chef, preparador físico, social media e olheiros para a org toda.
import { moradores } from './academy';
import { GAMES, GameId } from './games';
import { chance, clamp, pick, ri, rnd } from './rng';
import type { Cargo, ComodoId, Staff, State } from './types';
import { novoId } from './world';

export const CARGOS: Record<Cargo, { nome: string; porJogo?: boolean; comodo?: ComodoId; desc: string; base: number; cap?: number }> = {
  tecnico: { nome: 'Técnico', porJogo: true, desc: 'Treino, escalação e tática. Aumenta a força do time e a evolução dos jogadores.', base: 3500 },
  auxiliar: { nome: 'Auxiliar técnico', porJogo: true, desc: 'Cuida dos treinos individuais. Acelera a evolução dos jovens.', base: 1600 },
  analista: { nome: 'Analista de desempenho', porJogo: true, comodo: 'analise', desc: 'Estuda os adversários. Aumenta a força em partida (rende mais com a sala de análise).', base: 2000 },
  psicologo: { nome: 'Psicólogo', comodo: 'consultorio', desc: 'Segura a moral do elenco e a pressão em jogos grandes.', base: 2200, cap: 14 },
  nutricionista: { nome: 'Nutricionista', comodo: 'cozinha', desc: 'Dieta e rotina: a forma oscila menos.', base: 1600, cap: 16 },
  chef: { nome: 'Chef', comodo: 'cozinha', desc: 'Comida boa na gaming house. Moral do dia a dia.', base: 1200, cap: 18 },
  preparador: { nome: 'Preparador físico', comodo: 'academia', desc: 'Condicionamento físico: evolução mais rápida e menos queda de forma.', base: 1700, cap: 16 },
  social: { nome: 'Social media', comodo: 'estudio', desc: 'Redes sociais e streams: mais seguidores e renda de conteúdo.', base: 1400 },
  olheiro: { nome: 'Olheiro', desc: 'Observa jogadores e revela a nota real, o potencial e o interesse em vir.', base: 1200 },
};
export const CARGOS_ORG: Cargo[] = ['psicologo', 'nutricionista', 'chef', 'preparador', 'social'];
export const CARGOS_JOGO: Cargo[] = ['tecnico', 'auxiliar', 'analista'];

const PRIMEIROS: Record<string, string[]> = {
  br: ['Rodrigo', 'Carlos', 'Fábio', 'Marcelo', 'Ana', 'Juliana', 'Thiago', 'Bruna', 'Gustavo', 'Paula', 'Renato', 'Camila', 'Diego', 'Larissa'],
  kr: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang'],
  us: ['Mark', 'Chris', 'Emily', 'Jacob', 'Sarah', 'Ryan'],
  eu: ['Dylan', 'Tomás', 'Lena', 'Marco', 'Sofia', 'Lukas', 'Pierre'],
};
const SOBRE: Record<string, string[]> = {
  br: ['Silva', 'Souza', 'Lima', 'Costa', 'Alves', 'Pereira', 'Rocha', 'Ribeiro', 'Martins', 'Barbosa'],
  kr: ['Min-jun', 'Seo-yeon', 'Ji-ho', 'Hyun-woo', 'Dae-ho'],
  us: ['Miller', 'Johnson', 'Brooks', 'Carter', 'Hayes'],
  eu: ['Petit', 'Ruiz', 'Schmidt', 'Rossi', 'Novak', 'Dubois'],
};
const APELIDOS = ['Mestre', 'Prof', 'Tático', 'Lobo', 'Faro', 'Zen', 'Coruja', 'Raio', 'Tigre', 'Neo', 'Dex', 'Kami', 'Vigia', 'Bússola'];
const ESTILOS: Record<Cargo, string[]> = {
  tecnico: ['Agressivo, gosta de lutas cedo', 'Metódico, joga por objetivos', 'Formador, aposta em jovens', 'Disciplinador, cobra treino', 'Motivador, cuida do vestiário'],
  auxiliar: ['Detalhista', 'Paciente com jovens', 'Exigente'],
  analista: ['Especialista em draft', 'Foco em dados', 'Lê bem os rivais'],
  psicologo: ['Abordagem calma', 'Linha esportiva', 'Escuta ativa'],
  nutricionista: ['Dieta rígida', 'Equilibrado'],
  chef: ['Comida caseira', 'Alta gastronomia', 'Fit e saboroso'],
  preparador: ['Força e postura', 'Cardio e sono'],
  social: ['Memes e cortes', 'Conteúdo de bastidor', 'Lives diárias'],
  olheiro: ['Olho clínico para jovens', 'Rede de contatos na Ásia', 'Especialista na América', 'Faro para pechinchas'],
};

export function salarioStaff(cargo: Cargo, nota: number) {
  return Math.round((CARGOS[cargo].base * Math.pow(1.07, nota - 70)) / 100) * 100;
}

export function geraStaff(s: State, cargo: Cargo, nota: number, game?: GameId): Staff {
  const cc = pick(s, ['br', 'br', 'br', 'kr', 'us', 'eu']);
  const nome = `${pick(s, PRIMEIROS[cc])} "${pick(s, APELIDOS)}" ${pick(s, SOBRE[cc])}`;
  return { id: novoId(s, 'f'), nome, nat: cc === 'eu' ? pick(s, ['fr', 'es', 'de', 'it']) : cc, cargo, nota: clamp(Math.round(nota), 50, 95), sal: salarioStaff(cargo, nota), estilo: pick(s, ESTILOS[cargo]), game, contrato: 0 };
}

/** mercado de staff: renova a cada 4 semanas */
export function renovaPool(s: State) {
  const pool: Staff[] = [];
  for (const c of [...CARGOS_JOGO, ...CARGOS_ORG]) for (let k = 0; k < (c === 'tecnico' ? 4 : 3); k++) pool.push(geraStaff(s, c, ri(s, 55, 88)));
  s.staffPool = pool;
}

export const doCargo = (s: State, c: Cargo, g?: GameId) => Object.values(s.staff).filter(x => x.cargo === c && (!g || x.game === g));
export const tecnicoDe = (s: State, g: GameId) => doCargo(s, 'tecnico', g)[0];

export function contratarStaff(s: State, id: string, game?: GameId): string | null {
  const c = s.staffPool.find(x => x.id === id);
  if (!c) return 'Profissional não está mais disponível.';
  const info = CARGOS[c.cargo];
  if (info.porJogo && !game) return 'Escolha o jogo.';
  if (info.porJogo && doCargo(s, c.cargo, game).length) return `Já existe um ${info.nome.toLowerCase()} no ${GAMES[game!].curto}. Demita antes.`;
  if (!info.porJogo && c.cargo !== 'olheiro' && doCargo(s, c.cargo).length) return `A org já tem ${info.nome.toLowerCase()}.`;
  if (c.cargo === 'olheiro' && doCargo(s, 'olheiro').length >= 3) return 'Máximo de 3 olheiros.';
  if (info.comodo && !(s.sede.comodos[info.comodo]?.nivel)) return `Precisa do cômodo "${NOME_COMODO[info.comodo]}" pronto na sede.`;
  const luvas = c.sal * 4;
  if (s.org.caixa < luvas) return 'Caixa insuficiente para as luvas.';
  s.org.caixa -= luvas;
  s.staffPool = s.staffPool.filter(x => x.id !== id);
  s.staff[c.id] = { ...c, game: info.porJogo ? game : undefined, contrato: anoAtual(s) + 2 };
  return null;
}
export function demitirStaff(s: State, id: string): string | null {
  const x = s.staff[id];
  if (!x) return 'Não encontrado.';
  const multa = x.sal * 8;
  s.org.caixa -= multa;
  delete s.staff[id];
  return null;
}
export const multaStaff = (x: Staff) => x.sal * 8;
const anoAtual = (s: State) => 2027 + Math.floor(s.dia / 364);

export const NOME_COMODO: Record<ComodoId, string> = {
  treino: 'Sala de treino', quartos: 'Quartos', academia: 'Academia', cozinha: 'Cozinha', consultorio: 'Consultório', analise: 'Sala de análise', estudio: 'Estúdio de conteúdo', lazer: 'Área de lazer',
};

/** cobertura de um profissional da org: atende até "cap" jogadores */
export function cobertura(s: State, c: Cargo): number {
  const x = doCargo(s, c)[0];
  if (!x) return 0;
  const n = s.jogos.reduce((a, g) => a + (s.teams[s.orgTeams[g]!]?.elenco.length ?? 0), 0);
  const cap = (CARGOS[c].cap ?? 99) + Math.floor((x.nota - 60) / 5) * 2;
  return Math.min(1, cap / Math.max(1, n)) * (x.nota / 80);
}

/** staff inicial de cada cenário */
export function staffInicial(s: State) {
  const faixa = s.org.cenario === 'investidor' ? [74, 82] : s.org.cenario === 'crise' ? [66, 74] : [60, 68];
  for (const g of s.jogos) { const t = geraStaff(s, 'tecnico', ri(s, faixa[0], faixa[1]), g); t.contrato = 2029; s.staff[t.id] = t; }
  if (s.org.cenario === 'investidor') {
    for (const g of s.jogos) { const a = geraStaff(s, 'analista', ri(s, 68, 76), g); a.contrato = 2029; s.staff[a.id] = a; }
    const p = geraStaff(s, 'psicologo', ri(s, 66, 74)); p.contrato = 2029; s.staff[p.id] = p;
  }
  renovaPool(s);
}

/** evolução mensal no meio da temporada (treino) */
export function treinoMensal(s: State) {
  for (const g of s.jogos) {
    const tec = tecnicoDe(s, g), aux = doCargo(s, 'auxiliar', g)[0];
    const t = s.teams[s.orgTeams[g]!];
    if (!t) continue;
    const acad = s.sede.comodos.academia?.nivel ?? 0;
    const bonus = (tec ? (tec.nota - 65) / 100 : 0) + (aux ? (aux.nota - 60) / 150 : 0) + cobertura(s, 'preparador') * 0.08 + acad * 0.04;
    for (const id of t.elenco) {
      const p = s.players[id];
      if (!p || p.ovr >= p.pot) continue;
      const base = p.idade <= 20 ? 0.35 : p.idade <= 23 ? 0.25 : p.idade <= 26 ? 0.12 : 0.04;
      if (chance(s, base + bonus + (p.traco === 'profissional' ? 0.06 : 0) + (p.traco === 'talentoso' ? 0.05 : 0))) {
        p.ovr++;
        if (p.ovr % 3 === 0) (p.hist ??= []).push({ d: s.dia, t: `Evoluiu para nota ${p.ovr} nos treinos` });
      }
    }
  }
  // IA: evolução simples para jovens
  for (const p of Object.values(s.players)) {
    if (s.teams[p.teamId ?? '']?.org || !s.jogos.includes(p.game) || p.ovr >= p.pot) continue;
    if (p.idade <= 23 && rnd(s) < 0.18) p.ovr++;
  }
}

/** moral semanal: puxa para um alvo que depende da estrutura e do staff */
export function moralSemanal(s: State) {
  const lazer = s.sede.comodos.lazer?.nivel ?? 0;
  const lotado = moradores(s) > QUARTOS[s.sede.nivel];
  const alvoBase = 60 + cobertura(s, 'psicologo') * 10 + cobertura(s, 'chef') * 5 + lazer * 2 - (lotado ? 8 : 0) + (s.org.cenario === 'crise' ? -4 : 0);
  for (const g of s.jogos) {
    const t = s.teams[s.orgTeams[g]!];
    if (!t) continue;
    const nR = GAMES[g].roles.length;
    t.elenco.forEach((id, i) => {
      const p = s.players[id];
      if (!p) return;
      const alvo = alvoBase + (i < nR ? 6 : -8) + (p.traco === 'lider' ? 4 : 0) + (s.rosto[g] === id ? 6 : 0) + (p.prometido && p.prometido > s.dia ? 6 : 0);
      p.moral = clamp(p.moral + (alvo - p.moral) * 0.15, 15, 98);
      // nutricionista e preparador seguram a forma
      const segura = cobertura(s, 'nutricionista') * 0.5 + cobertura(s, 'preparador') * 0.3;
      p.forma = clamp(p.forma * (0.92 + segura * 0.08), -3, 3);
    });
  }
}
export const QUARTOS = [8, 14, 22, 40];
