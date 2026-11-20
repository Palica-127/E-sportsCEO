/* Dados puros: TIME DE ESPORTS (economia semanal: docs/ESPORTS_ECONOMIA.md). Sem botao de clicar: R$ entra e sai 1x por semana (js/tabs/esp-semana.js). */
GAMES.esp = {
  name: "Time de eSports", short: "eSports", emoji: "🏆", color: "#a855f7", tx: "#c084fc",
  cur: "R$", click: "Farmar", clickIc: "🗡️",
  weekly: true, noClick: true, ver: 2, m0: 3000, buyLabel: "Contratações",
  eco: { WK: 40, away: { eff: 0.9, max: 14400 } },
  tabs: [{ id: "time", label: "Time", icon: "🎮" }], /* abas extras entram por Engine.registerTab (js/tabs/) */
  clickBase: 1, clickPs: 0,
  items: [
    { id: "tit", n: "Titular amador", d: "Top, Selva, Meio, Atirador ou Suporte. Joga por uma pizza.", t: "u", max: 5, c0: 800, g: 1.5, p: 0, req: null, ic: "🎮",
      fx: "Nota 58 (+2 por Centro de treino, +1 por Gaming house)", sal: 150 },
    { id: "res", n: "Reserva amador", d: "Fica no banco treinando flash e paciência.", t: "u", max: 2, c0: 6000, g: 3, p: 0, req: ["tit", 5], ic: "🪑",
      fx: "Lesão pesa menos (-25% por reserva)", sal: 80 },
    { id: "coach", n: "Coach", d: "Faz o draft, pede café e culpa o suporte.", t: "u", max: 1, c0: 70000, g: 1, p: 0, req: ["tit", 5], ic: "📋",
      fx: "+1,5 força · treino e bootcamp rendem mais", sal: 2500 },
    { id: "treino", n: "Centro de treino", d: "Rankeada, scrim, VOD review e bootcamp.", t: "l", max: 6, c0: 12000, g: 3.3, tgt: "all", f: 1, req: ["tit", 5], ic: "🧠",
      fx: "+1,0 força por nível · amadores +2 de nota", up: 1,
      lv: ["Rankeada solo", "Scrim amador", "Scrim com pro", "VOD review", "Bootcamp", "Draft perfeito"] },
    { id: "house", n: "Gaming house", d: "Moram, treinam e brigam por causa da louça.", t: "l", max: 6, c0: 48000, g: 3.5, tgt: "all", f: 1, req: ["treino", 1], ic: "🏠",
      fx: "+0,8 força por nível · moral-alvo +3", up: 1,
      lv: ["Garagem do tio", "Apê alugado", "Casa de 2 andares", "Casa com chef", "Centro de treinamento", "CT com academia"] },
    { id: "equip", n: "Equipamento", d: "Mouse, teclado e headset de pro player.", t: "l", max: 5, c0: 190000, g: 3.7, tgt: "all", f: 1, req: ["house", 1], ic: "🖱️",
      fx: "+0,8 força por nível", up: 1,
      lv: ["Mouse com fio", "Teclado mecânico", "Headset 7.1", "Monitor 240 Hz", "Setup completo RGB"] },
    { id: "anal", n: "Analista", d: "VOD, planilha e opinião forte sobre o Barão.", t: "u", max: 1, c0: 1100000, g: 1, p: 0, req: ["equip", 1], ic: "📊",
      fx: "+1,5 força · scrim +1 · forma x1,2", sal: 4000 },
    { id: "patro", n: "Patrocínio", d: "Da padaria do bairro à marca global.", t: "l", max: 6, c0: 0, g: 1, tgt: "all", f: 1, req: null, auto: 1, ic: "🤝",
      lv: ["Padaria do Zé", "Posto Tanque Cheio", "Raio Verde", "Banco Faísca", "Periféricos Nexa", "Aurora Global"] },
    { id: "canal", n: "Canal do time", d: "Live de 12 horas e cortes de teamfight no TikTok.", t: "l", max: 6, c0: 0, g: 1, tgt: "all", f: 1, req: null, auto: 1, ic: "📺",
      lv: ["100 inscritos", "1 mil", "10 mil", "100 mil", "1 milhão", "5 milhões"] },
    { id: "psi", n: "Psicólogo", d: "Cuida da cabeça depois de perder o nexus por 1 torre.", t: "u", max: 1, c0: 4800000, g: 1, p: 0, req: ["anal", 1], ic: "🛋️",
      fx: "+1,5 força · moral-alvo +5 · derrota pesa metade", sal: 4500 },
    { id: "fa", n: "Fã-clube", d: "Torcida organizada com bateria e bandeira.", t: "l", max: 6, c0: 0, g: 1, tgt: "all", f: 1, req: null, auto: 1, ic: "📣",
      lv: ["Mãe e tia", "Grupo do zap", "Torcida organizada", "Fã-clube oficial", "Caravana pro estádio", "Estádio de camisa"] },
    { id: "arena", n: "Arena própria", d: "Casa cheia em todo jogo.", t: "l", max: 4, c0: 240000, g: 4, tgt: "all", f: 1, req: ["house", 1], gate: "arena", ic: "🏟️",
      fx: "Bilheteria + loja +25% por nível · só na liga principal", up: 1,
      lv: ["Auditório alugado", "Ginásio", "Arena 5 mil", "Arena 20 mil"] },
    { id: "titulo", n: "Sala de troféus", d: "Cada taça na estante atrai mais fã e mais grana.", t: "l", max: 6, c0: 0, g: 1, tgt: "all", f: 1, req: null, auto: 1, ic: "🏆",
      lv: ["Copa do bairro", "Taça regional", "Taça do split", "Troféu da liga", "Caneca do MSI", "Réplica do Mundial"] },
    { id: "smm", n: "Social media", d: "Vive de notebook, café e meme com 3 milhões de views.", t: "u", max: 1, c0: 480000, g: 1, p: 0, req: ["equip", 1], ic: "📱",
      fx: "Seguidores, publi e Imprensa x1,5", sal: 2000 }
  ],
  /* Os estágios vêm da aba Liga (hook tier). Os requisitos abaixo só valem se a aba não estiver carregada. */
  tiers: [
    { n: "Ranqueada (elo baixo)", c: null },
    { n: "Cenário amador (T2)", c: ["coach", 1] },
    { n: "Liga principal (T1)", c: ["patro", 1] },
    { n: "MSI", c: ["arena", 1] },
    { n: "Mundial", c: ["titulo", 3] },
    { n: "Lenda dos eSports", c: ["titulo", 6] }
  ],
  msgs: [
    "O top laner jogou 14 horas seguidas. Ainda culpa o lag.",
    "O analista achou o erro no VOD: foi o suporte (de novo).",
    "O psicólogo disse 'respira'. O atirador respondeu 'é o ping'.",
    "O coach pediu mais um café. Já é o oitavo.",
    "Treino às 14h, janta às 15h e rankeada até as 4 da manhã.",
    "Regra da gaming house: quem esquece a louça joga de suporte.",
    "O reserva está aquecendo os dedos e o coração.",
    "Chegou proposta de patrocínio de energético. O psicólogo torceu o nariz.",
    "O selva falou 'o time não ajuda'. O time não ajudou.",
    "Perdeu o nexus por 1 torre. Dói.",
    "O contrato exige foto com a lata na mão, em todo treino.",
    "Os fãs lotaram o chat da live: 'bora, bora!'.",
    "No draft, o coach baniu o campeão favorito do próprio atirador. Sem comentários.",
    "O selva passou 10 minutos no farm e a wave foi sozinha pro lado inimigo.",
    "O suporte comprou ward. O time não olhou o minimapa.",
    "O Arauto foi pra torre errada. O coach pediu pausa.",
    "Mais uma palestra do coach: 'foco no objetivo'. O time focou no lanche.",
    "O fisioterapeuta mandou o top parar de jogar por 2 dias. O top está treinando escondido.",
    "O rival vazou nosso scrim. Nosso analista já tem a resposta.",
    "Aniversário do suporte: o time deu um mouse pad e uma bronca.",
    "A mãe do atirador mandou pão de queijo. Moral do time: nas alturas.",
    "O meio deu flash pra dentro da parede. Foi de propósito, ele jura.",
    "Time dormindo no ônibus a caminho do bootcamp. O coach cantou parabéns de novo.",
    "A torcida gritou 'ganha o Barão!' e o time foi fazer o Dragão. Na dúvida, os dois.",
    "O analista jura que a derrota foi 'variância'. Era a quinta seguida."
  ],
  ev: null, /* sem eventos clicaveis: os eventos do eSports sao as decisoes semanais (esp-semana.js) */
  pr: { coin: "🌟 Hall da Fama", name: "Nova temporada", hook: true, T0: 1, ask: "Nova temporada! Os troféus ficam, o craque de maior nota vira camisa aposentada e o resto recomeça." },
  goalMul: 3, /* recompensa de meta = max(2.000, goalMul x bruto semanal medio) em R$ (ver goalRw em esp-semana.js) */
  goals: [
    { n: "Escalação completa", id: "tit", k: 5 },
    { n: "Treino é treino", id: "treino", k: 2 },
    { n: "Gaming house", id: "house", k: 2 },
    { n: "Patrocínio de verdade", id: "patro", k: 2 },
    { n: "Setup de pro", id: "equip", k: 2 },
    { n: "Dez mil olhos", id: "canal", k: 3 },
    { n: "Casa de banco", id: "patro", k: 4 },
    { n: "Sala de troféus", id: "titulo", k: 1 },
    { n: "Torcida gigante", id: "fa", k: 4 },
    { n: "Milhão de inscritos", id: "canal", k: 5 },
    { n: "Estante cheia de troféus", id: "titulo", k: 3 }
  ],
  ach: [
    { id: "t1", ic: "🎮", n: "Primeiro pick", d: "Contrate o primeiro titular.", c: ["own", "tit", 1] },
    { id: "t5", ic: "🖐️", n: "Cinco no mapa", d: "Complete os 5 titulares.", c: ["max", "tit"] },
    { id: "res", ic: "🪑", n: "Banco de reservas", d: "Contrate 2 reservas.", c: ["max", "res"] },
    { id: "coach", ic: "📋", n: "Draft com coach", d: "Contrate o coach.", c: ["own", "coach", 1] },
    { id: "anal", ic: "📊", n: "Olho de analista", d: "Contrate o analista.", c: ["own", "anal", 1] },
    { id: "gh6", ic: "🏠", n: "Mansão gamer", d: "Gaming house no nível máximo.", c: ["max", "house"] },
    { id: "psi", ic: "🛋️", n: "Mente sã", d: "Contrate o psicólogo.", c: ["own", "psi", 1] },
    { id: "sp6", ic: "🤝", n: "Camisa cheia", d: "Feche um contrato de nível máximo.", c: ["max", "patro"] },
    { id: "fan", ic: "📣", n: "Torcida organizada", d: "Fama no nível Estrela.", c: ["own", "fa", 4] },
    { id: "arena", ic: "🏟️", n: "Casa cheia", d: "Compre a primeira Arena própria.", c: ["own", "arena", 1] },
    { id: "tit1", ic: "🏆", n: "Primeira taça na estante", d: "Conquiste o primeiro troféu.", c: ["own", "titulo", 1] },
    { id: "tit6", ic: "🌍", n: "Réplica do Mundial", d: "Complete a sala de troféus.", c: ["max", "titulo"] },
    { id: "t100k", ic: "💰", n: "Primeiro milhão", d: "Fature R$ 1 milhão no total.", c: ["tot", 1e6] },
    { id: "goal5", ic: "🎯", n: "Meta batida", d: "Cumpra 5 metas de temporada.", c: ["goal", 5] },
    { id: "star", ic: "🌟", n: "Hall da Fama", d: "Ganhe seu primeiro Hall da Fama.", c: ["stars", 1] }
  ],
  /* ---- Mercado (js/tabs/esp-mercado.js) e Liga (js/tabs/esp-liga.js) ---- */
  regions: {
    BR: { n: "Brasil", s: "Brasil", l: "CBLOL" }, NA: { n: "América do Norte", s: "NA", l: "LCS" }, EU: { n: "Europa", s: "Europa", l: "LEC" },
    KR: { n: "Coreia", s: "Coreia", l: "LCK" }, CN: { n: "China", s: "China", l: "LPL" }, AP: { n: "Ásia-Pacífico", s: "AP", l: "LCP" }
  },
  regionOrder: ["BR", "NA", "EU", "KR", "CN", "AP"],
  mk: { importMax: 2, lowFrac: 0.4, photos: true }
};
/* Liga (js/tabs/esp-liga.js): os numeros vivem em ECO.C.lg (js/data/esp-eco.js); a Liga nao tem relogio proprio, quem chama step() e a Semana */
GAMES.esp.lg = ECO.C.lg;
GAMES.esp.t2name = function (reg) { return "Circuito Desafiante " + GAMES.esp.regions[reg].n; };
