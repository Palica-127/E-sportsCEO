/* Dados puros: TIME DE ESPORTS (DESIGN.md secao 4, CONTENT.md secao 3) */
GAMES.esp = {
  name: "Time de eSports", short: "eSports", emoji: "🏆", color: "#a855f7", tx: "#c084fc",
  cur: "⭐", click: "Farmar", clickIc: "🗡️",
  tabs: [{ id: "time", label: "Time", icon: "🎮" }], /* abas extras entram por Engine.registerTab (js/tabs/) */
  clickBase: 1, clickPs: 0.03,
  items: [
    { id: "tit", n: "Titular", d: "Top, Selva, Meio, Atirador ou Suporte. Joga por uma pizza.", t: "u", max: 5, c0: 15, g: 1.70, p: 0.5, req: null, ic: "🎮" },
    { id: "res", n: "Reserva", d: "Fica no banco treinando flash e paciência.", t: "u", max: 2, c0: 75, g: 3.24, p: 1.8, req: ["tit", 5], ic: "🪑" },
    { id: "coach", n: "Coach", d: "Faz o draft, pede café e culpa o suporte.", t: "u", max: 1, c0: 480, g: 1, p: 6, req: ["res", 1], ic: "📋" },
    { id: "treino", n: "Treino tático", d: "Rankeada, scrim, VOD review e bootcamp.", t: "l", max: 6, c0: 3820, g: 1.79, tgt: "tit", f: 1.6, req: ["coach", 1], ic: "🧠",
      lv: ["Rankeada solo", "Scrim amador", "Scrim com pro", "VOD review", "Bootcamp", "Draft perfeito"] },
    { id: "house", n: "Gaming house", d: "Moram, treinam e brigam por causa da louça.", t: "l", max: 6, c0: 36210, g: 1.72, tgt: "all", f: 1.3, req: ["treino", 1], ic: "🏠",
      lv: ["Garagem do tio", "Apê alugado", "Casa de 2 andares", "Casa com chef", "Centro de treinamento", "CT com academia"] },
    { id: "equip", n: "Equipamento", d: "Mouse, teclado e headset de pro player.", t: "l", max: 5, c0: 351900, g: 1.85, tgt: "tit", f: 1.5, req: ["house", 1], ic: "🖱️",
      lv: ["Mouse com fio", "Teclado mecânico", "Headset 7.1", "Monitor 240 Hz", "Setup completo RGB"] },
    { id: "anal", n: "Analista", d: "VOD, planilha e opinião forte sobre o Barão.", t: "u", max: 1, c0: 2499000, g: 1, p: 300, req: ["equip", 1], ic: "📊" },
    { id: "patro", n: "Patrocínio", d: "Da padaria do bairro à marca global.", t: "l", max: 6, c0: 4641000, g: 1.80, tgt: "all", f: 1.35, req: ["anal", 1], ic: "🤝",
      lv: ["Padaria do Zé", "Posto de gasolina", "Energético", "Banco", "Fabricante de periféricos", "Marca global"] },
    { id: "canal", n: "Canal do time", d: "Live de 12 horas e cortes de teamfight no TikTok.", t: "l", max: 6, c0: 14790000, g: 1.91, tgt: "all", f: 1.3, req: ["patro", 1], ic: "📺",
      lv: ["100 inscritos", "1 mil", "10 mil", "100 mil", "1 milhão", "Botão de diamante"] },
    { id: "psi", n: "Psicólogo", d: "Cuida da cabeça depois de perder o nexus por 1 torre.", t: "u", max: 1, c0: 81600000, g: 1, p: 560, req: ["canal", 1], ic: "🛋️" },
    { id: "fa", n: "Fã-clube", d: "Torcida organizada com bateria e bandeira.", t: "l", max: 6, c0: 219300000, g: 2.63, tgt: "all", f: 1.35, req: ["psi", 1], ic: "📣",
      lv: ["Mãe e tia", "Grupo do zap", "Torcida organizada", "Fã-clube oficial", "Caravana pro estádio", "Estádio de camisa"] },
    { id: "arena", n: "Arena própria", d: "Casa cheia em todo jogo.", t: "l", max: 4, c0: 1224000000, g: 3.10, tgt: "all", f: 1.6, req: ["fa", 2], ic: "🏟️",
      lv: ["Auditório alugado", "Ginásio", "Arena 5 mil", "Arena 20 mil"] },
    { id: "titulo", n: "Sala de troféus", d: "Cada taça na estante atrai mais fã e mais grana.", t: "l", max: 6, c0: 9180000000, g: 2.16, tgt: "all", f: 1.5, req: ["arena", 1], ic: "🏆",
      lv: ["Copa do bairro", "Taça regional", "Taça do split", "Troféu da liga", "Caneca do MSI", "Réplica do Mundial"] }
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
  ev: { type: "clutch", min: 120, a: 200, b: 360, dur: 6, fail: "A janela fechou... tem a próxima jogada.",
    variants: [
      { btn: "🐲 ROUBO DE BARÃO!", aria: "Roubo de Barão! Toque para triplicar a produção", msg: "O Barão está quase morto! Toque rápido e roube!", ok: "Roubo de Barão! Produção x3 por 20 s" },
      { btn: "💥 TEAMFIGHT!", aria: "Teamfight! Toque para triplicar a produção", msg: "Teamfight no meio! Toque para engajar!", ok: "Ace! Time limpou a teamfight. Produção x3 por 20 s" },
      { btn: "⚡ FLASH!", aria: "Flash salvador! Toque para triplicar a produção", msg: "O atirador está sem flash! Toque e salve!", ok: "Flash salvador! O suporte nem viu. Produção x3 por 20 s" },
      { btn: "🔥 PENTAKILL!", aria: "Pentakill! Toque para triplicar a produção", msg: "Quatro abates... vai de penta! Toque!", ok: "Pentakill! O atirador esqueceu de comemorar. Produção x3 por 20 s" },
      { btn: "🐉 ALMA DO DRAGÃO!", aria: "Alma do dragão! Toque para triplicar a produção", msg: "O Dragão nasceu! Toque para pegar a alma!", ok: "Alma do dragão garantida! Produção x3 por 20 s" }
    ] },
  pr: { coin: "🌟 Hall da Fama", name: "Nova temporada", T0: 5.2e7, ask: "Nova temporada! A geração atual se aposenta; os jogadores contratados no Mercado continuam." },
  goalMul: 150, /* DESIGN.md pede 300 x ps; com 300 o jogo fecha em ~2,47 h (ver relatorio) */
  goals: [
    { n: "Escalação completa", id: "tit", k: 5 },
    { n: "Banco de reservas", id: "res", k: 2 },
    { n: "Treino é treino", id: "treino", k: 3 },
    { n: "Gaming house", id: "house", k: 3 },
    { n: "Setup de pro", id: "equip", k: 3 },
    { n: "Patrocínio de verdade", id: "patro", k: 3 },
    { n: "Milhão de inscritos", id: "canal", k: 5 },
    { n: "Torcida gigante", id: "fa", k: 4 },
    { n: "Casa cheia", id: "arena", k: 3 },
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
    { id: "sp6", ic: "🤝", n: "Camisa cheia", d: "Patrocínio no nível máximo.", c: ["max", "patro"] },
    { id: "fan", ic: "📣", n: "Torcida organizada", d: "Fã-clube nível 3.", c: ["own", "fa", 3] },
    { id: "arena", ic: "🏟️", n: "Casa cheia", d: "Compre a primeira Arena própria.", c: ["own", "arena", 1] },
    { id: "tit1", ic: "🏆", n: "Primeira taça na estante", d: "Compre o primeiro troféu.", c: ["own", "titulo", 1] },
    { id: "tit6", ic: "🌍", n: "Réplica do Mundial", d: "Complete a sala de troféus.", c: ["max", "titulo"] },
    { id: "c1000", ic: "🗡️", n: "Mil last hits", d: "Farme 1.000 vezes.", c: ["click", 1000] },
    { id: "t100k", ic: "💰", n: "100 mil de fama", d: "Acumule 100 mil de Fama.", c: ["tot", 1e5] },
    { id: "goal5", ic: "🎯", n: "Meta batida", d: "Cumpra 5 metas de temporada.", c: ["goal", 5] },
    { id: "clutch", ic: "🔥", n: "Clutch master", d: "Acerte 3 jogadas clutch.", c: ["ev", 3] },
    { id: "star", ic: "🌟", n: "Hall da Fama", d: "Ganhe seu primeiro Hall da Fama.", c: ["stars", 1] }
  ],
  /* ---- Mercado (js/tabs/esp-mercado.js) e Liga (js/tabs/esp-liga.js) ---- */
  regions: {
    BR: { n: "Brasil", s: "Brasil", l: "CBLOL" }, NA: { n: "América do Norte", s: "NA", l: "LCS" }, EU: { n: "Europa", s: "Europa", l: "LEC" },
    KR: { n: "Coreia", s: "Coreia", l: "LCK" }, CN: { n: "China", s: "China", l: "LPL" }, AP: { n: "Ásia-Pacífico", s: "AP", l: "LCP" }
  },
  regionOrder: ["BR", "NA", "EU", "KR", "CN", "AP"],
  mk: { genNota: 58, emptyNota: 40, P0: 50000, kp: 1.1, kp2: 0.7, knee: 83, m74: 1.1, mk: 0.0456, sb74: 0.01, sb96: 0.08, subF: 0.4, agio: 1.5,
    refund: 0.5, photos: true, importMax: 2, lowFrac: 0.4, subS: 0.1 }
};
/* Liga (js/tabs/esp-liga.js): numeros de balanceamento; ver docs/LOL_MERCADO.md */
GAMES.esp.lg = {
  matchT: 7, breakT: 10, D: 7, t2games: 8, t1games: 9, promoW: 5, qualW: 6, promoS: 68, promoOpp: 66,
  t2opp: [47, 50, 53, 55, 57, 60, 63, 59], t1opp: [60, 64, 68, 71, 74, 77, 80, 83, 86],
  msi: [{ bo: 3, s: 80, n: "Quartas" }, { bo: 5, s: 88, n: "Semifinal" }, { bo: 5, s: 97, n: "Final" }],
  worlds: [{ bo: 3, s: 95, n: "Oitavas" }, { bo: 5, s: 101, n: "Quartas" }, { bo: 5, s: 107, n: "Semifinal" }, { bo: 5, s: 112.5, n: "Final" }],
  offs: { BR: 0, NA: 1, EU: 1.5, KR: 2, CN: 2, AP: 0.5 }, /* ligas mais fortes: adversários mais fortes (T1, MSI, Mundial) */
  pity: 0.75, pityMax: 9, uw: { treino: 1, house: 0.8, equip: 0.8, staff: 1.5 },
  rw: { promo: 300, msiPart: 200, msiFin: 500, msiWin: 1200, wdPart: 400, wdWin: 3000 },
  bonus: { promo: 1.10, msi: 1.15, wd: 1.25 }
};
GAMES.esp.t2name = function (reg) { return "Circuito Desafiante " + GAMES.esp.regions[reg].n; };
