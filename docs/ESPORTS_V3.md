# Time de eSports V3 — Escada de Heróis + ligas reais do BrasLOL

Status: proposta implementável (nenhum código foi alterado). Mantém a economia semanal de `docs/ESPORTS_ECONOMIA.md` (semana ≈ 40 s, Foco da semana, patrocínio, redes, salários, eventos) e a estrutura T2 → liga principal → MSI/Mundial (`docs/LOL_MERCADO.md`, `docs/TABS_API.md`). Assets: `img/` (ver `img/MANIFESTO.md`, ~505 KB). Simulação: seção 6 (código e saída completos).

## 0. Decisões em uma tela

1. **Contratar jogadores vira a Escada de Heróis** (estilo Clicker Heroes): 40 heróis em ordem fixa do pior (Amador) ao melhor (Keria), cada um contratado uma vez (custo exponencial ×1,28), com níveis (1–50), marcos (×2 no 10, ×2 a cada 25), 3 upgrades específicos e 10 melhorias globais. Todo herói **produz R$/semana**; só os 5 melhores por role **jogam** (força da partida).
2. **Ligas reais**: cada região usa os times do DATA do BrasLOL (força da IA = nota média do elenco real), tabela `dbTableHTML` adaptada, playoffs de 6 (`poMake`), MSI (Play-In DE4 + DE8) e Mundial (Play-In DE4 + Suíço de 16 + mata-mata Bo5), tudo com logos, bandeiras e troféus de `img/`.
3. **Mais LoL** barato primeiro: objetivos (Dragão/Arauto/Barão/torres), draft com bans/picks, MVP, resumo de partida, rivalidades, patch/meta, elo na fila ranqueada.
4. **Tempo-alvo**: título mundial ≈ 3,3 h ativo, ≈ 4,5 h casual (sessões de 3 min + offline), ≈ 6 h ocioso. Sem paredes (ver seção 6).

---

## 1. Elementos de LoL (lista priorizada)

Custo: P = pequeno (<1 dia de dev), M = médio, G = grande. Todos usam só dados/ícones já em `img/` ou texto.

| # | Elemento | Onde aparece | Como funciona (resumo) | Custo |
|---|---|---|---|---|
| 1 | **Roles com ícone** (TOP/JNG/MID/ADC/SUP) | Elenco/Heróis, Liga, cena | trocar emojis atuais por chips coloridos; slot de role na escada | P |
| 2 | **Elo / fila ranqueada** como escada inicial | Aba Time, fase `ranq` | Ferro→Mestre = marcos do 1º herói até 5 titulares; vitórias de solo-q dão R$/fama; vira "Desafiante" ao ter 5 titulares | P |
| 3 | **Resumo de partida** (KDA, ouro, objetivos) | Liga (clicar no jogo), Eventos | gerado por `mix(seed, semana, k)` condicionado ao resultado: ouro diff, torres, dragões, barão; ícones de `img/obj/` | M |
| 4 | **Objetivos** (Dragão, Arauto, Barão, Ancião, torres) | Resumo, cena, evento "Barão roubado" | contagem por time derivada da diferença de força; cada dragão ganha selo (infernal, oceano, nuvem, montanha, hextec, químico) | P |
| 5 | **Draft com picks/bans** | Pré-jogo de séries (Bo3/Bo5) e finais | 5 bans + 5 picks por lado de um pool de nomes de campeões (só TEXTO, sem arte); o pick "conforto" de um herói dá +0,5 de força na série | M |
| 6 | **MVP da partida/split** | Resumo, estante de troféus | MVP = titular com maior nota×aleatório estável; troféus `mvp-*` | P |
| 7 | **Rivalidades** | Liga, eventos | par de times (mesma liga) gerado por hash; jogo contra rival: ×1,5 fama, +moral, evento pré-jogo | P |
| 8 | **Patch / meta** | Cabeçalho da Liga, Elenco | a cada 4 splits "Patch X.Y": uma role fica ±2 de nota efetiva (ex.: "Patch do Caçador: JNG +2"), todos veem o selo; força o jogador a rever o Elenco | M |
| 9 | **Itens (ícones)** nas melhorias | Upgrades de herói/globais | ícones de `img/itens/` (Botas, Espada Longa, Anel de Doran...) | P |
| 10 | **Conquistas** | Metas | ícones `img/conquistas/` (20) ligados a `goals/ach` | P |
| 11 | **Bandeiras/escudos** | Tabelas, chaves, heróis | `img/flags`, `img/logos` | P |
| 12 | Torres/inibidores no mapa miniatura da cena | Cena | `obj/tower.svg`, `tw_b/tw_r` | M |
| 13 | Sinergia de dupla (Bot lane, Jungle-Mid) | Elenco | par de heróis com mesmo time real no elenco: +1 de nota efetiva (só vale na escalação) | M |
| 14 | Substituição/ban de herói (reservas) | Elenco | 2 reservas jogam séries Bo5 de dia ruim; já previsto no modelo | G (opcional) |

Ordem de entrega: 1,2,9,10,11 → 3,4,6 → 7,8 → 5 → 12,13,14.

---

## 2. Regiões e campeonatos com os times reais (DATA)

Fonte: `DATA` do BrasLOL (jogador↔time↔liga já está em `js/data/jogadores.js`: campos `l` liga, `t` time, `o` nota, `r` role). Logo = `img/logos/<slug>.webp` com `slug = nome sem acento, minúsculas, não alfanumérico → "-"` (todos os 56 times existem; verificado).

### 2.1 Times e força da IA

`F(time) = 100 + 2,6 × (nota média dos 5 titulares − 85)`. Estável (sem aleatório por semana). Ordem por força:

- **CBLOL (8)**: LOS 80,0/F87; FURIA 80,0/F87; LOUD 80,0/F87; paiN Gaming 80,0/F87; RED Canids 79,4/F85; Vivo Keyd Stars 79,2/F85; Fluxo W7M 78,2/F82; Leviatán 76,2/F77
- **LCK (10)**: Gen.G 90,0/F113; Hanwha Life 89,4/F111; T1 89,4/F111; Dplus KIA 86,2/F103; Nongshim RedForce 83,6/F96; KT Rolster 81,8/F92; BNK FearX 81,6/F91; BRION 81,4/F91; DRX 80,2/F88; DN SOOPers 79,6/F86
- **LPL (12)**: BLG 89,2/F111; Anyone's Legend 85,8/F102; JD Gaming 85,4/F101; Top Esports 85,2/F101; Invictus Gaming 85,0/F100; Weibo Gaming 83,6/F96; LGD Gaming 83,0/F95; Team WE 81,0/F90; EDward Gaming 80,6/F89; LNG Esports 80,0/F87; Ninjas in Pyjamas 79,0/F84; TT Gaming 77,8/F81
- **LEC (10)**: G2 87,4/F106; Karmine Corp 86,6/F104; Movistar KOI 83,4/F96; Vitality 82,6/F94; SK Gaming 81,6/F91; Fnatic 81,4/F91; Shifters 80,2/F88; NAVI 80,0/F87; Team Heretics 80,0/F87; GIANTX 79,6/F86
- **LCS (8)**: Team Liquid 83,6/F96; LYON 82,2/F93; Cloud9 82,2/F93; Sentinels 80,8/F89; FlyQuest 80,2/F88; Shopify Rebellion 78,8/F84; Dignitas 78,6/F83; Disguised 77,8/F81
- **LCP (8)**: CTBC Flying Oyster 82,2/F93; Team Secret Whales 81,2/F90; MVK Esports 79,0/F84; GAM Esports 79,0/F84; SoftBank HAWKS 77,4/F80; Ground Zero Gaming 76,6/F78; DetonatioN FocusMe 76,2/F77; Deep Cross Gaming 76,0/F77

(Valores gerados do `jogadores.js` pelo script da seção 6; recalcular em runtime com `ESP3.teamF(liga, time)` para acompanhar mudanças de dados.)

**T2**: usa `D2N` do BrasLOL (CBLOL 9, LCK 6, LPL 10, LEC 6, LCS 6, LCP 6). Times T2 = nomes `D2N` (logos já em `img/logos`, ex.: `t1-esports-academy`, `pain-academy`, `vivo-keyd-stars-academy`). Força `F = 70 ± 4` (hash `mix(hash(liga), i, 7)`). Fila ranqueada: adversários anônimos "SoloQ" (nomes `SLQ`).

### 2.2 Estrutura de uma temporada (2 splits/ano, 1 split ≈ 9–12 semanas)

| Fase | Formato (BrasLOL) | Semanas do jogador |
|---|---|---|
| Ranqueada | só elo; ao ter 5 titulares → T2 | — |
| T2 split | pontos corridos 1 turno (`dbTableHTML`), top 4 → playoffs Bo5 (semi + final); campeão joga **série de acesso Bo5 contra o último da liga principal**; vencendo, assume a vaga dele | n−1 + até 3 |
| Liga principal | pontos corridos 1 turno, top 6 → `poMake` (dupla eliminação de 6, Bo5): q1,q2 → s1,s2 → wf,l1,l2 → ls → lf → gf | n + até 6 |
| MSI (após split 1) | vagas: 2 por LCK/LPL/LEC/LCS/LCP, 1 CBLOL. Play-In DE4 (4 piores seeds, 1 passa) + chave `DE8` Bo5 | até 6 |
| Mundial (após split 2) | vagas 3/3/3/3/3/2 (+1 para campeão e vice do MSI). Play-In DE4 + **Suíço de 16** (Bo1; decisivas Bo3; 3V classifica, 3D elimina) + mata-mata 8 Bo5 | até 12 |

Rebaixamento: o time do jogador, se fica no último lugar da principal, perde uma partida de permanência (já existente em `closeWeek`; opcional). O slot do jogador na principal substitui o último colocado "emprestado" (o time `repl` fica fora enquanto o jogador está lá — não aparece na tabela).

### 2.3 Como a IA gera resultados e como o jogador é medido

- **IA vs IA** (todo o resto da tabela, de outras regiões, MSI, Mundial): `P(A vence jogo) = 1/(1+10^((F_B−F_A)/16))`; Bo3/Bo5 por jogos sucessivos. Semente: `mix(saveSeed, ano, hash(liga)+rodada)` para ser **estável** (recarregar o jogo não muda a tabela). O resultado de outras regiões só é computado quando necessário (ao fechar split/entrar no MSI) e guardado (`state.lig3[ano][liga] = ordem final`).
- **Jogador**: `S = A + I + St + Mo + forma + scrim − lesão + pity − penalidade de import`. `A` = média das notas efetivas dos **5 titulares** (melhor herói por role; nota efetiva = nota real + bônus de idade + bônus de nível (+1 a cada 25 níveis, máx 2) + upgrades que dão nota); `I` = infraestrutura; `St` = comissão técnica; `Mo` = moral (±6); `pity` até +6 após falhas seguidas (dá a "esperança" de passar); penalidade de import `−0,5` por titular de fora da liga (máx −2,5).
- Contra o jogador a mesma `winP(S, F_adv)`. `D = 16`. No MSI, adversário −3 (`intlEasy`) para compensar a ausência de scrim contra a elite.
- Notas da IA são fixas, mas **escaladas por patch**: a role favorecida do patch soma ±2 na nota efetiva do titular daquela role, para jogador e IA.

---

## 3. Escada de Heróis

### 3.1 Regras

- 40 heróis, **ordem fixa** (a escada da região do jogador; ver 3.3). Só o próximo da fila pode ser contratado, e algumas rodadas têm **porta** de progresso (T2, T1, nº de splits na T1).
- **Contratação** (única): `custo(i) = arred(800 × 1,28^i)` R$ (herói 1 = R$ 800; herói 40 = R$ 12 M).
- **Produção** (R$/sem): `prod(i, L) = p(i) × L × Mx(L) × upm(i)`, onde `p(i) = 0,1 × 1,16^i`; `Mx(L) = (L ≥ 10 ? 2 : 1) × 2^⌊L/25⌋` (marcos ×2 em 10, 25, 50); `upm` = produto dos upgrades específicos. Nível máx. 50 (prestígio: ver 3.6).
- **Custo do nível**: `p(i) × 40 × 1,10^L × descontoGlobal`. (Clicker Heroes: custo cresce mais rápido que a produção entre marcos; o marco recompensa quem insiste.)
- **Upgrades específicos** (3 por herói, lineares): a 10/25/40 níveis, custo `p(i) × (300 / 3000 / 30000)`: **×1,5 produção**, **×1,5 produção + 1 de nota**, **×2 produção + 1 de nota**. Nome por herói = item do LoL (Botas, Espada Longa, Anel de Doran...; ícones `img/itens/`).
- **Melhorias globais** (10, em ordem, exigem fama): ×1,10–1,15 da renda dos heróis ou ×0,92–0,85 do custo dos níveis (tabela na seção 6, `GLOB`).
- **Bônus de nota por nível**: +1 de nota efetiva a cada 25 níveis (máx 2) — só vale para titulares; é o elo "herói de dinheiro → herói de partida".
- A renda total dos heróis entra como **uma das fontes** da receita semanal: `heróis × (1 + fama/600) × mercado(região) × mult(estrelas)` junto com TV, patrocínio, redes, loja, bilheteria e prêmios. Resultado medido: heróis ≈ 49% da receita, redes 27%, patrocínio 7%, prêmios 7%, TV 7%.

### 3.2 Reconciliação com 5 titulares + 2 reservas + 1 coach (5 linhas)

1. O "elenco" da escada é o **plantel** (40 contratos possíveis); a regra do jogo continua: só **5 titulares** (1 por role) afetam `S`; os 2 melhores reservas **substituem** titular lesionado/cansado (série Bo5); o coach é item de staff (já existente).
2. Cada role tem 8 heróis; o titular é o herói de maior nota da role. Os demais (inclusive o ex-titular) viram **mentores/produtores** (renda) — não há "vender": jogador antigo continua produzindo.
3. Salário: some dos heróis (a renda já é líquida do herói); a folha vira o **custo fixo da comissão técnica + manutenção** (0,4% do investido), o que evita a conta dupla com `ECO.price`.
4. Importados (jogador de fora da liga do jogador): marcados com bandeira; penalidade −0,5 de nota na escalação (máx −2,5) e portas para LCK/LPL (precisa de vaga internacional ou ≥4 splits). Regiões nacionais usam o jogador da própria liga como preferido (+3 de preferência na montagem).
5. O mercado antigo (`esp-mercado.js`) deixa de comprar e vender jogadores: a aba vira **Elenco/Heróis**; os 2 reservas são os 2 maiores níveis não titulares (sem custo extra).

### 3.3 Montagem da escada por região

`build_ladder(região)` (código na seção 6):

- Heróis 1–5: **Amador** (58, genéricos) ; 6–10: **Desafiante** (65, SoloQ); 11–15: **Promessa** (72, jogadores da T2).
- Heróis 16–40: jogadores reais de `jogadores.js`, por role escolhendo o jogador com nota mais próxima de 76/80/85/89 e, por fim, o melhor da role. Preferência (+3 de custo de distância) pelo jogador da **liga da região** e penalidade de import fora dela. IDs únicos entre roles.
- A ordem mistura roles em ciclo TOP→JNG→MID→ADC→SUP a cada rodada para preencher as 5 roles no mesmo ritmo (rodada = 5 heróis).

### 3.4 Tabela da escada (Brasil, 40 heróis)

Hire = custo de contratação (R$); p = base; P25/P50 = produção/semana nos níveis 25/50 (sem upgrades, sem fama).

|#|Herói|Role|Nota|Liga|Time real|Hire|p|P25|P50|
|---|---|---|---|---|---|---|---|---|---|
|1|Amador TOP|TOP|58|-||800|0.10|10|40|
|2|Amador JNG|JNG|58|-||1000|0.12|11|46|
|3|Amador MID|MID|58|-||1300|0.13|13|53|
|4|Amador ADC|ADC|58|-||1700|0.16|15|62|
|5|Amador SUP|SUP|58|-||2100|0.18|18|72|
|6|Desafiante TOP|TOP|65|-||2700|0.21|21|84|
|7|Desafiante JNG|JNG|65|-||3500|0.24|24|97|
|8|Desafiante MID|MID|65|-||4500|0.28|28|113|
|9|Desafiante ADC|ADC|65|-||5800|0.33|32|131|
|10|Desafiante SUP|SUP|65|-||7400|0.38|38|152|
|11|Promessa TOP|TOP|72|D2||9400|0.44|44|176|
|12|Promessa JNG|JNG|72|D2||12000|0.51|51|204|
|13|Promessa MID|MID|72|D2||15000|0.59|59|237|
|14|Promessa ADC|ADC|72|D2||20000|0.69|68|275|
|15|Promessa SUP|SUP|72|D2||25000|0.80|79|319|
|16|Devost|TOP|75|CBLOL|Leviatán|32000|0.93|92|370|
|17|Booki|JNG|76|CBLOL|Leviatán|42000|1.07|107|429|
|18|cody|MID|77|CBLOL|Fluxo W7M|53000|1.25|124|498|
|19|Strensh|ADC|77|CBLOL|Leviatán|68000|1.45|144|578|
|20|Shiku|SUP|76|CBLOL|Leviatán|87000|1.68|167|671|
|21|Boal|TOP|80|CBLOL|paiN Gaming|110000|1.95|194|778|
|22|Curse|JNG|80|CBLOL|LOS|140000|2.26|225|902|
|23|Feisty|MID|80|CBLOL|LOS|180000|2.62|261|1047|
|24|Ayu|ADC|80|CBLOL|FURIA|230000|3.04|303|1215|
|25|Momochi|SUP|80|CBLOL|Fluxo W7M|300000|3.52|352|1409|
|26|Naak Nako|TOP|85|LEC|Vitality|380000|4.09|408|1634|
|27|Heng|JNG|85|LPL|LGD Gaming|490000|4.74|474|1896|
|28|Kaze|MID|83|CBLOL|LOUD|630000|5.50|550|2200|
|29|Doggo|ADC|85|LCP|CTBC Flying Oyster|800000|6.38|638|2552|
|30|CoreJJ|SUP|85|LCS|Team Liquid|1000000|7.40|740|2960|
|31|Kiin|TOP|89|LCK|Gen.G|1300000|8.58|858|3433|
|32|Kanavi|JNG|89|LCK|Hanwha Life|1700000|9.96|995|3983|
|33|ShowMaker|MID|89|LCK|Dplus KIA|2200000|11.55|1155|4620|
|34|Peyz|ADC|89|LCK|T1|2800000|13.40|1340|5360|
|35|ON|SUP|88|LPL|BLG|3500000|15.54|1554|6217|
|36|Zeus|TOP|92|LCK|Hanwha Life|4500000|18.03|1803|7212|
|37|Canyon|JNG|91|LCK|Gen.G|5800000|20.92|2091|8366|
|38|Chovy|MID|96|LCK|Gen.G|7400000|24.26|2426|9705|
|39|Gumayusi|ADC|91|LCK|Hanwha Life|9500000|28.15|2814|11258|
|40|Keria|SUP|93|LCK|T1|12000000|32.65|3264|13059|

### 3.5 Regiões e importados

- Região escolhida define a liga, os times da IA, a escada (preferência por jogadores da liga) e o multiplicador de mercado da renda: BR 1,0 · AP 1,0 · NA 1,2 · EU 1,25 · KR 1,35 · CN 1,35 (regiões "maiores" pagam mais mas têm IA mais forte; resultado ≈ 2,9–3,3 h em todas).
- Heróis de outra liga aparecem com a bandeira (`img/flags/<pais>.svg`) e o selo "IMPORT". Porta: heróis importados de LCK/LPL só liberam com vaga internacional ou ≥ 4 splits na T1 (evita o salto "compro o Chovy no minuto 30").
- Importar consome moral (−2) na contratação e −0,5 de nota por titular importado.

### 3.6 Prestígio (opcional, pós-V3)

Ao ganhar o Mundial: "Nova Era" reseta heróis/níveis, mantém fama e dá estrelas (+5% de renda por estrela, máx 16, já modelado em `mult`) e +1 ao teto de nível (50→60…). Não afeta os tempos desta proposta.

---

## 4. Liga, tabelas e chaves (BrasLOL adaptado)

### 4.1 Tabela de pontos (`dbTableHTML`)

Colunas: `#` · logo+nome · V–D · saldo de mapas · "forma" (últimos 5, bolinhas) · seta de zona (verde = playoffs top 6, azul = acesso/classificação MSI, vermelho = rebaixamento). Dados em `state.lig3.tab = [{id, nome, slug, v, d, sg}]`. O time do jogador tem destaque (borda 2 px na cor primária). Em celular (≥ 8 times): apenas `# logo nome V-D`; forma/saldo ficam no tap (bottom sheet).

### 4.2 Chaves

Reusar o motor visual do BrasLOL (`deBracketHTML`/`koBracketHTML`/`poBracketHTML`): colunas de rodadas, cartões absolutos em px, linhas de conexão e **zoom-fit** no container (CSS `transform: scale`). Modelo de dados neutro:

```js
// state.lig3.chave = { tipo: 'po6'|'de4'|'de8'|'ko8'|'swiss', rodadas: [[idPartida,...],...],
//   partidas: { id: { a: slug, b: slug, bo: 5, sa: 3, sb: 1, w: slug|null, de: 'lb1'|null } } }
```

- `po6`: spec do `poMake` (q1,q2,s1,s2,wf,l1,l2,ls,lf,gf); `de4`/`de8`: `DESPEC` (u*/lb*/gf); `ko8`: quartas/semi/final; `swiss`: 5 rodadas em colunas por registro (0-0, 1-0, 0-1, 2-0, 1-1, 0-2...) com contadores V–D.
- Cada cartão: logo (24 px), nome curto, placar; cartão do jogador com borda destacada e botão "Ver draft/resumo".
- Gerar os mesmos formatos a partir de `ESP3.runDE(spec, seeds, bo, rng)` (ver simulação: `run_de`).
- Grupos em cada MSI/Mundial usam bandeira da região ao lado do logo.

### 4.3 Como a Liga usa a força dos heróis

`S` (seção 2.3) vem dos 5 titulares da escada; a semana de jogo aciona `playGame(S, F_adv)`; os adversários vêm da tabela da liga (times reais). Os heróis não titulares só contribuem com **renda**. Isso garante que "comprar o herói 25" não faz o time ganhar sozinho: ele só vira titular quando supera a nota do atual da role.

---

## 5. Economia semanal e integração

Semana ≈ 40 s. Receita bruta = (TV + patrocínio + redes + loja + bilheteria + **heróis**) × mercado × estrelas + prêmios. Despesas = comissão técnica + manutenção (0,4%/sem do investido) + extras de foco (scrims R$ 600–1.800, bootcamp R$ 25.000) + viagem (MSI 12 mil, Mundial 30 mil). `heróis = Σ prod × melhorias × (1 + fama/600)`.

- Fama: sobe com vitórias, prêmios e imprensa; dá `×(1 + F/600)` na renda dos heróis (chave do ritmo Clicker: título → fama → renda).
- Foco da semana inalterado (treino, conteúdo, descanso, scrims, imprensa, bootcamp).
- Patrocínio: tabela `tiers` inalterada (alvos por fama e % de vitórias), luva de entrada ×2 ao subir de patamar.
- **Offline**: Piloto automático com 90% de eficiência, teto de 4 h (já existe). Desvio da regra antiga: com o upgrade **Gerente de elenco** (R$ 60.000, após promoção), o piloto automático também **compra** heróis/níveis com 60% do caixa; sem ele só acumula caixa. Isso é o que mantém o perfil casual em ~4,5 h.
- R$/semana por fase (jogador ativo, semente 1, ver 6.1, bloco 5): 10 min: R$ 15 de heróis/sem; 60 min: R$ 1.065; 90 min: R$ 9.240; 120 min: R$ 18.656; 150 min: R$ 33.676.

---

## 6. Simulação (Python 3, sem dependências)

Arquivo único (`sim_esports_v3.py`), roda em ≈ 1 min: `python3 sim_esports_v3.py js/data/jogadores.js`. Modela: escada por região, níveis/marcos/upgrades, economia semanal V2, T2 (tabela + playoffs + série de acesso), T1 (tabela + `po6`), MSI (DE4 + DE8), Mundial (DE4 + Suíço de 16 + KO), forças de IA do DATA. Jogador "ativo" = compra o item com melhor retorno (R$/semana por R$ gasto; o próximo herói tem prioridade); "casual" = 3 min on / 27 min off com piloto automático; "ocioso" = 1 min on / 60 min off.

### 6.1 Saída

```
=== 1) Marcos por perfil, Brasil (mediana de 9 sementes; titulo: p25-p75) ===
perfil   titulo mundial (p25 - p75)    | 5tit      R2        promo     R3        R4        intl      R5        msi       R6        R7       
ativo     3.30 h (3.10 h - 3.34 h) | 3 min     9 min     35 min    28 min    45 min    1.46 h    1.67 h    2.81 h    2.34 h    3.03 h   
casual    4.53 h (4.38 h - 4.82 h) | 3 min     30 min    46 min    1.01 h    1.01 h    2.10 h    2.07 h    4.58 h    3.18 h    4.32 h   
ocioso    6.03 h (5.71 h - 6.45 h) | 1.02 h    1.02 h    1.46 h    1.03 h    2.04 h    2.62 h    2.81 h    5.10 h    3.83 h    5.04 h   

=== 2) Regioes (ativo, mediana de 6 sementes) ===
  BR (CBLOL): titulo 3.12 h  (min 2.83 h, max 3.51 h)  | promocao 42 min | 1a vaga internacional 1.46 h
  NA (LCS): titulo 3.30 h  (min 3.07 h, max 3.30 h)  | promocao 35 min | 1a vaga internacional 1.87 h
  EU (LEC): titulo 2.92 h  (min 2.61 h, max 3.32 h)  | promocao 43 min | 1a vaga internacional 2.28 h
  KR (LCK): titulo 3.01 h  (min 2.82 h, max 3.39 h)  | promocao 37 min | 1a vaga internacional 2.17 h
  CN (LPL): titulo 3.00 h  (min 2.26 h, max 3.17 h)  | promocao 39 min | 1a vaga internacional 2.07 h
  AP (LCP): titulo 3.27 h  (min 2.72 h, max 3.81 h)  | promocao 30 min | 1a vaga internacional 1.13 h

=== 3) Mix de receita do perfil ativo (media ate o titulo) ===
  herois 49% | patrocinio 7% | redes 27% | premios 7% | TV 7% | loja 2% | bilheteria 1% | despesas 7% da receita

=== 4) Paredes e buracos (ativo; 9 sementes) ===
  maior intervalo sem NENHUMA compra (min): mediana 7.3, maximo 8.7
  maior intervalo entre contratacoes da escada (min): mediana 20.0, maximo 30.7
  maior janela sem subir 1 ponto de forca base (min): mediana 18.7, maximo 25.3
  caixa minimo: R$ 1572 | resgates da diretoria: 0 em 9/9 runs

=== 5) Retrato do perfil ativo (semente 1) ===
  tempo   div  forca  nota  fama  seguid.   heroi$/sem  patroc.  social | heroisx nv>=25 | caixa
    10 min T2    64.1  65.0    13      789          15      656      45 |  10       0     |      1600
    30 min T2    72.9  72.0    41     3501         364     1325     137 |  15       0     |      5559
    60 min T1    81.6  78.6    87    16137        1065     4190     440 |  21       0     |    118404
    90 min T1    88.7  83.4   127   111505        9240     5665    2609 |  24      24     |     59619
   120 min T1    94.1  86.0   201  1025657       18656    14716   16920 |  27      27     |     99077
   150 min T1    97.5  87.4   297  7493473       33676    14725  124067 |  30      30     |   1277779
  titulo em 3.12 h (anos de jogo: 10, semanas: 281)

=== 6) Cada heroi: hora media da contratacao (ativo, Brasil, mediana) ===
  rodada 1: 0 min     0 min     1 min     2 min     3 min    
  rodada 2: 4 min     5 min     6 min     8 min     9 min    
  rodada 3: 12 min    15 min    19 min    22 min    28 min   
  rodada 4: 30 min    36 min    39 min    42 min    45 min   
  rodada 5: 56 min    1.02 h    1.13 h    1.39 h    1.67 h   
  rodada 6: 1.81 h    1.98 h    2.09 h    2.27 h    2.34 h   
  rodada 7: 2.54 h    2.71 h    2.78 h    2.93 h    3.03 h   
  rodada 8: 3.18 h    -         -         -         -        
```

### 6.2 Leitura dos resultados

- **Ativo**: título mundial em **3,30 h** (p25–p75: 3,10–3,34 h) no BR; regiões 2,9–3,3 h. Dentro da meta de 2,5–3,5 h.
- **Casual**: **4,53 h** (meta ~4 h; 0,5 h acima — ajuste fácil: reduzir `maxAway` penalidade ou baixar o preço do Gerente; ver riscos).
- **Ocioso**: 6,0 h (apenas informativo).
- **Sem paredes**: o maior intervalo sem NENHUMA compra é de 7,3 min (mediana, máx 8,7); entre contratações da escada, 20 min (máx 30,7); a janela mais longa sem subir 1 ponto de força base é 18,7 min (máx 25,3). Caixa mínimo R$ 1.572; nenhum resgate da diretoria.
- **Sem buracos**: promoção ≈ 35 min, 1ª vaga internacional ≈ 1,5 h, MSI ≈ 2,8 h, título ≈ 3,3 h; todas as rodadas de heróis contratadas em sequência (rodada 1 aos 3 min; 8 aos 3,2 h).
- Os ganhos de infraestrutura/staff continuam na tabela V2 (`infra`, `staff`) e são comprados pelo mesmo bot.

### 6.3 Código

```python
#!/usr/bin/env python3
# sim_esports_v3.py - Time de eSports V3: escada de herois (estilo Clicker Heroes) + ligas reais do BrasLOL.
# Uso: python3 sim_esports_v3.py js/data/jogadores.js        (Python 3, sem dependencias; ~2 min)
# Modela: escada de 40 herois por regiao, niveis/marcos/upgrades, economia semanal (V2), T2 -> T1 (tabela + playoffs de 6),
# MSI (Play-In DE4 + DE8) e Mundial (Play-In DE4 + Suico de 16 + mata-mata), forca da IA = nota media do DATA do BrasLOL.
import json, math, random, sys

P = dict(
    WK=40, cash0=3000, seg0=120, moral0=60,
    # --- escada (secao 5 do doc)
    C0=800, rc=1.28, P0=0.1, rp=1.16, T1=40.0, g=1.10, mm=2.0, lvmax=50, bonusMax=2, impPen=0.5, famaK=600.0,
    up_cost=(300, 3000, 30000), up_mul=(1.5, 1.5, 2.0), up_nota=(0, 1, 1), up_lv=(10, 25, 40),
    # --- ligas (secao 4 do doc)
    FB=100.0, KS=2.6, D2F=70.0, D=16.0, pityMax=6, intlEasy=3.0,
    # --- economia semanal V2 (inalterada)
    infra=dict(treino=(6, 12000, 3.3, 1.0), house=(6, 48000, 3.5, 0.8), equip=(5, 190000, 3.7, 0.8), arena=(4, 240000, 4.0, 0)),
    staff=dict(coach=(70000, 2500), anal=(1100000, 4000), psi=(4800000, 4500), smm=(480000, 2000)),
    staffS=1.5, upkeep=0.004, tv=dict(ranq=900, T2=1500, T1=9000), tvIntl=30000, travel=dict(msi=12000, worlds=30000),
    loja=5, lojaExp=1.2, arenaRev=[0, 6000, 18000, 60000, 180000], pub=0.30,
    prize=dict(t2win=1500, t2top4=6000, promo=30000, t1win=4000, t1po=15000, msiPart=40000, msiRound=25000, msiWin=200000, wdPart=100000, wdRound=50000, wdWin=1200000),
    fame=dict(t2win=0.5, t1win=1.0, t1loss=-0.2, msiRound=3, wdRound=5, promo=20, msiPart=8, wdPart=15, msiWin=50, wdWin=120, press=2.5, decay=0.997),
    tiers=[('Padaria do Ze', 0, 700, 0.0, False), ('Posto Tanque Cheio', 15, 1800, 0.40, False), ('Energetico Raio Verde', 60, 4500, 0.50, False),
           ('Banco Faisca', 150, 11000, 0.50, True), ('Perifericos Nexa', 320, 26000, 0.60, True), ('Aurora Global', 550, 60000, 0.65, True)],
    mkt=dict(BR=1.0, AP=1.0, NA=1.2, EU=1.25, KR=1.35, CN=1.35),     # tamanho do mercado da regiao (multiplica toda a renda)
    PB=100.0, lamS=0.10, reserveW=3, mgr=60000, offEff=0.9, maxAway=4 * 3600)
REG = {'BR': 'CBLOL', 'NA': 'LCS', 'EU': 'LEC', 'KR': 'LCK', 'CN': 'LPL', 'AP': 'LCP'}
SPONS_MUL = dict(BR=1.0, AP=1.0, NA=1.1, EU=1.1, KR=1.2, CN=1.2)
MSI_SLOTS = dict(LCK=2, LPL=2, LEC=2, LCS=2, LCP=2, CBLOL=1)
WC_SLOTS = dict(LCK=3, LPL=3, LEC=3, LCS=3, LCP=3, CBLOL=2)
D2N = dict(LCK=6, LPL=10, LEC=6, LCS=6, LCP=6, CBLOL=9)           # times da T2 (D2N do BrasLOL)
ROLES = ['TOP', 'JNG', 'MID', 'ADC', 'SUP']
DE8 = dict(m=dict(u1=['s0', 's7'], u2=['s3', 's4'], u3=['s2', 's5'], u4=['s1', 's6'], us1=['wu1', 'wu2'], us2=['wu3', 'wu4'], lb1=['lu1', 'lu2'], lb2=['lu3', 'lu4'],
                  uf=['wus1', 'wus2'], lb3=['wlb1', 'lus2'], lb4=['wlb2', 'lus1'], lb5=['wlb3', 'wlb4'], lbf=['wlb5', 'luf'], gf=['wuf', 'wlbf']),
           r=[['u1', 'u2', 'u3', 'u4'], ['us1', 'us2', 'lb1', 'lb2'], ['uf', 'lb3', 'lb4'], ['lb5'], ['lbf'], ['gf']])
DE4 = dict(m=dict(u1=['s0', 's3'], u2=['s1', 's2'], uf=['wu1', 'wu2'], lb1=['lu1', 'lu2'], lbf=['wlb1', 'luf'], gf=['wuf', 'wlbf']),
           r=[['u1', 'u2'], ['uf', 'lb1'], ['lbf'], ['gf']])
GLOB = [  # (nome, custo R$, fama minima, 'h' = x renda dos herois | 'd' = x custo dos niveis, fator)
    ('Camisa oficial', 2e4, 10, 'h', 1.10), ('Loja de pecas dos herois', 9e4, 40, 'h', 1.10), ('Treino em grupo', 1.5e5, 60, 'd', 0.92),
    ('Parceria com streamers', 4e5, 100, 'h', 1.12), ('Equipe de dados', 9e5, 150, 'd', 0.90), ('Fan club premium', 1.8e6, 220, 'h', 1.12),
    ('Academia de base', 4e6, 300, 'd', 0.88), ('Direitos de imagem globais', 8e6, 400, 'h', 1.15), ('Cultura de campeao', 1.8e7, 520, 'd', 0.85),
    ('Marca mundial', 4e7, 650, 'h', 1.15)]
GATE = [('ranq', 0), ('ranq', 0), ('T2', 0), ('T2', 0), ('T1', 0), ('T1', 2), ('T1', 4), ('T1', 6)]   # por rodada: (divisao minima, splits jogados na T1)

def mix(a, b, c=0):                                   # hash estavel de 32 bits (igual ao JS: Math.imul)
    x = (a * 374761393 + b * 668265263 + c * 2246822519 + 0x9E3779B9) & 0xFFFFFFFF
    x = ((x ^ (x >> 15)) * 2246822507) & 0xFFFFFFFF
    x = ((x ^ (x >> 13)) * 3266489909) & 0xFFFFFFFF
    return ((x ^ (x >> 16)) & 0xFFFFFFFF) / 4294967296.0
def winP(S, opp): return 1.0 / (1.0 + 10 ** ((opp - S) / P['D']))
def r2(n):
    e = 10 ** max(0, int(math.floor(math.log10(max(n, 1)))) - 1); return max(1, int(round(n / e) * e))
def hname(s):
    h = 0
    for ch in s: h = (h * 131 + ord(ch)) & 0xFFFFFFFF
    return h

# ------------------------------------------------------------------ dados: ligas reais e escada
PL = None; LEAGUES = {}
def init(path):
    global PL, LEAGUES
    s = open(path, encoding='utf8').read(); PL = json.loads(s[s.index('['):s.rindex(']') + 1]); LEAGUES = {}
    for p in PL: LEAGUES.setdefault(p['l'], {}).setdefault(p['t'], []).append(p['o'])
    for lg in LEAGUES: LEAGUES[lg] = {t: sum(v) / len(v) for t, v in LEAGUES[lg].items()}
def Fai(avg): return P['FB'] + P['KS'] * (avg - 85)                 # forca da IA = nota media do DATA
def d2team(lg, i): return P['D2F'] + (mix(hname(lg), i, 7) - 0.5) * 8

TARGETS = [76, 80, 85, 89]                                          # notas-alvo das rodadas 4..7; rodada 8 = Lendas
def build_ladder(region):
    own = REG[region]; used = set(); seqs = {}
    for r in ROLES:
        prev = 70; picks = []
        for tg in TARGETS + ['top']:
            c = [p for p in PL if p['r'] == r and p['id'] not in used and p['o'] > prev]
            if not c: break
            if tg == 'top': p = max(c, key=lambda p: (p['o'], p['l'] == own))
            else: p = min(c, key=lambda p: (abs(p['o'] - tg) + (0 if p['l'] == own else 3.0), p['id']))
            used.add(p['id']); prev = p['o']; picks.append(p)
        seqs[r] = picks
    lad = []
    for rd in range(8):
        for r in ROLES:
            if rd == 0: h = dict(n='Amador ' + r, r=r, o=58, a=22, l='-', imp=False, src='gen')
            elif rd == 1: h = dict(n='Desafiante ' + r, r=r, o=65, a=21, l='-', imp=False, src='soloq')
            elif rd == 2: h = dict(n='Promessa ' + r, r=r, o=72, a=20, l='D2', imp=False, src='d2')
            else:
                if rd - 3 >= len(seqs[r]): continue
                p = seqs[r][rd - 3]; h = dict(n=p['n'], r=r, o=p['o'], a=p['a'], l=p['l'], imp=p['l'] != own, src='real', t=p['t'])
            h['rd'] = rd; lad.append(h)
    for i, h in enumerate(lad): h['i'] = i
    return lad

# ------------------------------------------------------------------ chaves e liga (BrasLOL: DESPEC, poMake, Suico)
class Tm:
    __slots__ = ('id', 'F', 'me', 'lg')
    def __init__(s, id_, F, lg, me=False): s.id = id_; s.F = F; s.lg = lg; s.me = me
def ai_series(rng, a, b, n):
    p = winP(a.F, b.F); need = (n + 1) // 2; wa = wb = 0
    while wa < need and wb < need:
        if rng.random() < p: wa += 1
        else: wb += 1
    return wa > wb
def run_de(T, spec, seeds, n, rng, kind):                           # gerador: 1 yield (= 1 semana) por serie do jogador
    res = {}
    def src(s):
        if s[0] == 's': return seeds[int(s[1:])]
        m = res[s[1:]]; return m['w'] if s[0] == 'w' else m['l']
    for rnd in spec['r']:
        for mid in rnd:
            a, b = [src(x) for x in spec['m'][mid]]
            if a.me or b.me:
                won = yield from T.series_me(b if a.me else a, n, kind); w, l = (a, b) if (a.me == won) else (b, a)
            else: w, l = (a, b) if ai_series(rng, a, b, n) else (b, a)
            res[mid] = dict(w=w, l=l)
    return res['gf']['w'], res['gf']['l']
def region_split(lg, rng):                                          # liga de outra regiao: tabela (1 turno) + playoffs top 6
    ts = [Tm(t, Fai(a), lg) for t, a in LEAGUES[lg].items()]; w = {t.id: 0 for t in ts}
    for i in range(len(ts)):
        for j in range(i + 1, len(ts)): w[(ts[i] if ai_series(rng, ts[i], ts[j], 1) else ts[j]).id] += 1
    ts.sort(key=lambda t: (-w[t.id], -t.F)); order = list(po6(ts[:6], rng)) + ts[6:]
    return order
def po6(sd, rng):                                                   # playoffs de 6 (poMake): q1,q2 | s1,s2 | wf,l1,l2 | ls | lf | gf
    M = lambda a, b: (a, b) if ai_series(rng, a, b, 5) else (b, a)
    q1w, q1l = M(sd[2], sd[5]); q2w, q2l = M(sd[3], sd[4]); pk = q1w if q1w.F <= q2w.F else q2w; ot = q2w if pk is q1w else q1w
    s1w, s1l = M(sd[0], pk); s2w, s2l = M(sd[1], ot); wfw, wfl = M(s1w, s2w)
    l1w, l1l = M(q1l, s1l if pk is q2w else s2l); l2w, l2l = M(q2l, s1l if pk is q1w else s2l)
    lsw, lsl = M(l1w, l2w); lfw, lfl = M(lsw, wfl); gfw, gfl = M(wfw, lfw)
    return [gfw, gfl, lfl, lsl, l1l, l2l]

# ------------------------------------------------------------------ o time do jogador
class Team:
    def __init__(s, seed, region='BR', stars=0):
        s.seed = seed; s.rng = random.Random(seed); s.region = region; s.lg = REG[region]; s.lad = build_ladder(region); n = len(s.lad)
        s.L = [0] * n; s.up = [0] * n; s.age = [h['a'] for h in s.lad]; s.glob = [0] * len(GLOB); s.manager = 0
        s.R = P['cash0'] * (1 + stars); s.F = 0.0; s.seg = P['seg0']; s.M = P['moral0']; s.stars = stars
        s.lv = dict(treino=0, house=0, equip=0, arena=0); s.staff = dict(coach=0, anal=0, psi=0, smm=0); s.inv = 0.0
        s.div = 'ranq'; s.wk = 0; s.t = 0.0; s.forma = (0, 0); s.scrim = 0; s.fail = dict(promo=0, msi=0, worlds=0); s.hot = False; s.intl = False
        s.titles = dict(promo=0, msi=0, worlds=0); s.mile = {}; s.hires = []; s.buys = []; s.last = None; s.hist8 = []; s.cdw = {}; s.income = {}
        s.minR = s.R; s.sponv = 0.0; s.prize_wk = 0; s.fame_wk = 0; s.year = 1; s.sp = 1; s.t1_splits = 0; s.msi_champ = None; s.msi_vice = None; s.repl = None
        s.slog = []; s.cdw = {}
    # ----- elenco, nota efetiva e escalacao (so os 5 titulares contam para a forca)
    def agebonus(s, i):
        h = s.lad[i]
        if h['src'] != 'real': return 0
        a = h['a']; b = 0
        for _ in range(s.age[i] - h['a']):
            b += 1 if a <= 23 else (-1 if a >= 31 else 0); a += 1
        return min(b, 96 - h['o'])
    def nota(s, i):
        return s.lad[i]['o'] + s.agebonus(i) + min(P['bonusMax'], s.L[i] // 25) + sum(P['up_nota'][k] for k in range(3) if s.up[i] >> k & 1)
    def starters(s):
        out = []
        for r in ROLES:
            c = [i for i, h in enumerate(s.lad) if h['r'] == r and s.L[i] > 0]; out.append(max(c, key=s.nota) if c else None)
        return out
    def n_tit(s): return sum(1 for x in s.starters() if x is not None)
    def A(s): return sum((s.nota(i) if i is not None else 40) for i in s.starters()) / 5.0
    def star(s): return sum(max(0, s.nota(i) - 80) for i in s.starters() if i is not None)
    def n_imp(s): return sum(1 for i in s.starters() if i is not None and s.lad[i]['imp'])
    def S(s, kind=None, scrim=True):
        I = sum(P['infra'][k][3] * s.lv[k] for k in ('treino', 'house', 'equip')); St = P['staffS'] * (s.staff['coach'] + s.staff['anal'] + s.staff['psi'])
        mo = max(-6, min(6, (s.M - 50) / 8.0)); pity = min(P['pityMax'], s.fail[kind]) if kind in s.fail else 0
        return (s.A() + I + St + mo + (s.forma[0] if s.forma[1] > 0 else 0) + (s.scrim if scrim else 0) + pity - min(2.5, P['impPen'] * s.n_imp()))
    def S_base(s): return s.S(None, False) - (s.forma[0] if s.forma[1] > 0 else 0)
    # ----- formulas do heroi
    def cost_hire(s, i): return r2(P['C0'] * P['rc'] ** i)
    def p(s, i): return P['P0'] * P['rp'] ** i
    def Mx(s, L): return (2.0 if L >= 10 else 1.0) * P['mm'] ** (L // 25)
    def upm(s, i):
        m = 1.0
        for k in range(3):
            if s.up[i] >> k & 1: m *= P['up_mul'][k]
        return m
    def gmul(s, t='h'):
        m = 1.0
        for k, g in enumerate(GLOB):
            if s.glob[k] and g[3] == t: m *= g[4]
        return m
    def prod(s, i, L=None):
        L = s.L[i] if L is None else L
        return s.p(i) * L * s.Mx(L) * s.upm(i) if L > 0 else 0.0
    def lvcost(s, i): return s.p(i) * P['T1'] * P['g'] ** s.L[i] * s.gmul('d')
    def hero_income(s): return sum(s.prod(i) for i in range(len(s.lad))) * s.gmul('h') * (1 + s.F / P['famaK'])
    # ----- receitas e custos
    def tv(s): return P['tv'][s.div]
    def spons_target(s):
        ok = [t for t in P['tiers'] if s.F >= t[1] and (not t[4] or s.div == 'T1')]
        wr = sum(s.hist8) / len(s.hist8) if len(s.hist8) >= 4 else 1.0
        return sum(t[2] * SPONS_MUL[s.region] * 0.95 * (1.0 if wr >= t[3] else 0.7) for t in ok[::-1][:1 + (s.F >= 60) + (s.F >= 320)]) if ok else 0.0
    def social(s, focus=None): return P['pub'] * s.seg ** 0.75 * (1 + 0.5 * s.staff['smm']) * (1 + s.star() / 40.0) * (1.5 if focus == 'conteudo' else 1)
    def loja(s): return P['loja'] * max(0.0, s.F) ** P['lojaExp'] * (1 + 0.25 * s.lv['arena'])
    def ticket(s, wr=0.6): return P['arenaRev'][s.lv['arena']] * (0.4 + 0.6 * wr) if s.div in ('T2', 'T1') else 0
    def mult(s): return (1 + 0.05 * min(s.stars, 16)) * P['mkt'][s.region]
    def costs(s): return sum(P['staff'][k][1] for k in s.staff if s.staff[k]) + P['upkeep'] * s.inv
    def gross(s):
        wr = sum(s.hist8) / len(s.hist8) if s.hist8 else 0.5
        return (s.tv() + s.sponv + s.social() + s.loja() + s.ticket(wr) + s.hero_income()) * s.mult()
    def net(s): return s.gross() - s.costs()
    # ----- compras (jogador ativo: "compra o que tem menor retorno em semanas"; o proximo heroi tem prioridade, como no Clicker Heroes)
    def gate_ok(s, h):
        dv, sp = GATE[h['rd']]
        if dv == 'T2' and s.div == 'ranq': return False
        if dv == 'T1' and s.div != 'T1': return False
        if s.t1_splits < sp: return False
        return not (h['imp'] and h['l'] in ('LCK', 'LPL') and not (s.intl or s.t1_splits >= 4))
    def shop(s, cap=60, auto=False):
        n = 0
        while n < cap:
            gross = max(1500.0, s.gross()); cash = s.R - P['reserveW'] * s.costs(); lam = P['lamS'] * gross; best = None
            if auto: cash *= 0.6
            nh = next((i for i in range(len(s.lad)) if s.L[i] == 0), None)
            if nh is not None and s.gate_ok(s.lad[nh]):
                c = s.cost_hire(nh)
                if c <= cash: s.hire(nh); n += 1; continue
                if (c - cash) / max(1.0, s.net()) <= 2.5: break                 # poupa para o proximo heroi
            if not s.manager and s.div != 'ranq' and P['mgr'] <= cash and P['mgr'] < 30 * gross and s.net() > 0: s.manager = 1; s.R -= P['mgr']; n += 1; continue
            st = s.starters(); fm = (1 + s.F / P['famaK']) * s.mult() * s.gmul('h')
            for i in range(len(s.lad)):
                if s.L[i] <= 0: continue
                if s.L[i] < P['lvmax']:
                    c = s.lvcost(i)
                    if c <= cash:
                        d = (s.prod(i, s.L[i] + 1) - s.prod(i)) * fm; dS = 0.2 if ((s.L[i] + 1) % 25 == 0 and (s.L[i] + 1) // 25 <= P['bonusMax'] and i in st) else 0.0
                        sc = (d + lam * dS) / c
                        if best is None or sc > best[0]: best = (sc, 'lv', i, c)
                for k in range(3):
                    if not (s.up[i] >> k & 1) and s.L[i] >= P['up_lv'][k] and (k == 0 or s.up[i] >> (k - 1) & 1):
                        c = s.p(i) * P['up_cost'][k]
                        if c <= cash:
                            sc = (s.prod(i) * (P['up_mul'][k] - 1) * fm + lam * (P['up_nota'][k] / 5.0 if i in st else 0)) / c
                            if best is None or sc > best[0]: best = (sc, 'up', (i, k), c)
            for k, g in enumerate(GLOB):
                if not s.glob[k] and s.F >= g[2] and (k == 0 or s.glob[k - 1]) and g[1] <= cash:
                    tot = s.hero_income() * s.mult(); sc = (tot * (g[4] - 1) if g[3] == 'h' else tot * 0.04) / g[1]
                    if best is None or sc > best[0]: best = (sc, 'gl', k, g[1])
            for k, (mx, c0, gg, w) in P['infra'].items():
                if s.lv[k] < mx and s.n_tit() >= 5 and not (k == 'arena' and s.div != 'T1') and c0 * gg ** s.lv[k] <= cash:
                    c = c0 * gg ** s.lv[k]
                    d = (P['arenaRev'][s.lv[k] + 1] - P['arenaRev'][s.lv[k]]) * 0.76 + s.loja() * 0.25 / (1 + 0.25 * s.lv['arena']) if k == 'arena' else 0
                    sc = (d + lam * (0 if k == 'arena' else w) - P['upkeep'] * c) / c
                    if best is None or sc > best[0]: best = (sc, 'in', k, c)
            for k, (c, sal) in P['staff'].items():
                if not s.staff[k] and s.n_tit() >= 5 and c <= cash:
                    d, dS = (s.social() * 0.5 * s.mult() - sal, 0) if k == 'smm' else (-sal, P['staffS'] + (0.5 if k == 'psi' else 0))
                    sc = (d + lam * dS) / c
                    if best is None or sc > best[0]: best = (sc, 'st', k, c)
            if not best or best[0] * P['PB'] < 1.0: break
            _, kind, who, c = best; s.R -= c
            if kind == 'lv': s.L[who] += 1
            elif kind == 'up': s.up[who[0]] |= 1 << who[1]
            elif kind == 'gl': s.glob[who] = 1
            elif kind == 'in': s.lv[who] += 1; s.inv += c
            else: s.staff[who] = 1
            s.buys.append(s.t); n += 1
        s.mark()
    def hire(s, i):
        s.R -= s.cost_hire(i); s.L[i] = 1; s.hires.append((s.t, i)); s.buys.append(s.t)
        if s.lad[i]['src'] == 'real': s.M = max(0, s.M - 2)
        s.mark()
    def mark(s):
        m = s.mile; T = s.t
        def mk(k, c):
            if k not in m and c: m[k] = T
        mk('5tit', s.n_tit() >= 5); mk('promo', s.div == 'T1'); mk('intl', s.intl); mk('msi', s.titles['msi'] > 0); mk('titulo', s.titles['worlds'] > 0)
        for r in range(8): mk('R%d' % (r + 1), all(s.L[i] > 0 for i, h in enumerate(s.lad) if h['rd'] == r))
    # ----- partidas do jogador (cada uma = 1 semana)
    def play_game(s, oppF, kind, n=1):
        S = s.S(kind); oppF -= P['intlEasy'] if kind == 'msi' else 0
        need = (n + 1) // 2; w = l = 0
        while w < need and l < need:
            if mix(s.seed, s.wk, 10 + w + l) < winP(S, oppF): w += 1
            else: l += 1
        s.scrim = 0; return w >= need
    def series_me(s, opp, n, kind):
        won = s.play_game(opp.F, kind, n); s.last = dict(win=won, kind=kind, n=n); s.hist8 = (s.hist8 + [1 if won else 0])[-8:]
        if won and kind in ('msi', 'worlds'): s.prize_wk += P['prize']['msiRound' if kind == 'msi' else 'wdRound']; s.fame_wk += P['fame']['msiRound' if kind == 'msi' else 'wdRound']
        yield; return won
    def reg_game(s, opp, kind):
        won = s.play_game(opp.F, None, 1); s.last = dict(win=won, kind=kind, n=1); s.hist8 = (s.hist8 + [1 if won else 0])[-8:]
        s.fame_wk += (P['fame']['t1win'] if won else P['fame']['t1loss']) if kind == 'T1' else (P['fame']['t2win'] if won else 0)
        s.prize_wk += P['prize']['t1win' if kind == 'T1' else 't2win'] * won
        yield; return won
    # ----- campanha: gerador (cada yield = 1 semana do jogador)
    def career(s):
        rng = s.rng; own = s.lg; me = Tm('me', 0, own, True)
        while s.n_tit() < 5: s.last = None; yield
        s.div = 'T2'; s.mark()
        while True:
            while s.div == 'T2':                                    # --- T2: tabela de pontos corridos + playoffs top 4 + serie de acesso
                n2 = D2N[own]; opps = [Tm('d2%d' % i, d2team(own, i), own) for i in range(n2)]; w = {t.id: 0 for t in opps}
                for i in range(n2):
                    for j in range(i + 1, n2): w[(opps[i] if ai_series(rng, opps[i], opps[j], 1) else opps[j]).id] += 1
                order = opps[:]; rng.shuffle(order); myw = 0
                for o in order:
                    s.hot = False; won = yield from s.reg_game(o, 'T2'); myw += won; w[o.id] += (not won)
                tab = sorted(opps + [me], key=lambda t: -(myw if t.me else w[t.id]))
                if [t.me for t in tab].index(True) < 4:
                    s.prize_wk += P['prize']['t2top4']; s.hot = True; top = tab[:4]; sf = []
                    for a, b in ((top[0], top[3]), (top[1], top[2])):
                        if a.me or b.me:
                            opp = b if a.me else a; won = yield from s.series_me(opp, 5, 'promo'); sf.append(me if won else opp)
                        else: sf.append(a if ai_series(rng, a, b, 5) else b)
                    if sf[0].me or sf[1].me:
                        won = yield from s.series_me(sf[1] if sf[0].me else sf[0], 5, 'promo')
                        if won:                                     # campeao da T2 -> serie de acesso contra o ULTIMO da liga principal
                            last = min(LEAGUES[own].items(), key=lambda kv: kv[1])
                            if (yield from s.series_me(Tm('x', Fai(last[1]), own), 5, 'promo')):
                                s.div = 'T1'; s.fail['promo'] = 0; s.titles['promo'] += 1; s.prize_wk += P['prize']['promo']; s.fame_wk += P['fame']['promo']
                                s.repl = last[0]; s.mark(); s.sp = 1; break
                s.fail['promo'] += 1
            while s.div == 'T1':                                    # --- T1: 2 splits por ano (o time ocupa a vaga do ultimo colocado)
                ts = [Tm(t, Fai(a), own) for t, a in LEAGUES[own].items() if t != s.repl]; n1 = len(ts); w = {t.id: 0 for t in ts}
                for i in range(n1):
                    for j in range(i + 1, n1): w[(ts[i] if ai_series(rng, ts[i], ts[j], 1) else ts[j]).id] += 1
                order = ts[:]; rng.shuffle(order); myw = 0
                for o in order:
                    s.hot = False; won = yield from s.reg_game(o, 'T1'); myw += won; w[o.id] += (not won)
                tab = sorted(ts + [me], key=lambda t: (-(myw if t.me else w[t.id]), -(t.F if not t.me else 0))); final = tab
                if [t.me for t in tab].index(True) < 6:
                    s.prize_wk += P['prize']['t1po']; s.hot = True; final = (yield from s.run_po6(tab[:6], rng)) + tab[6:]
                s.hot = False; s.t1_splits += 1
                if s.sp == 1: yield from s.msi_phase(final, rng); s.sp = 2
                else:
                    yield from s.worlds_phase(final, rng); s.sp = 1; s.year += 1
                    for i in range(len(s.age)): s.age[i] += 1 if s.lad[i]['src'] == 'real' else 0
                if s.titles['worlds']: return
    def run_po6(s, sd, rng):
        def match(a, b):
            if a.me or b.me: won = yield from s.series_me(b if a.me else a, 5, 'T1po'); return (a, b) if a.me == won else (b, a)
            return (a, b) if ai_series(rng, a, b, 5) else (b, a)
        q1w, q1l = yield from match(sd[2], sd[5]); q2w, q2l = yield from match(sd[3], sd[4]); pk = q1w if q1w.F <= q2w.F else q2w; ot = q2w if pk is q1w else q1w
        s1w, s1l = yield from match(sd[0], pk); s2w, s2l = yield from match(sd[1], ot); wfw, wfl = yield from match(s1w, s2w)
        l1w, l1l = yield from match(q1l, s1l if pk is q2w else s2l); l2w, l2l = yield from match(q2l, s1l if pk is q1w else s2l)
        lsw, lsl = yield from match(l1w, l2w); lfw, lfl = yield from match(lsw, wfl); gfw, gfl = yield from match(wfw, lfw)
        return [gfw, gfl, lfl, lsl, l1l, l2l]
    def others(s, rng): return {lg: region_split(lg, rng) for lg in LEAGUES if lg != s.lg}
    def regrank(s): return sorted(LEAGUES, key=lambda lg: -sum(sorted((Fai(a) for a in LEAGUES[lg].values()), reverse=True)[:4]))
    def msi_phase(s, final, rng):
        ords = s.others(rng); ords[s.lg] = final; rr = s.regrank()
        q = sorted(((k, rr.index(lg), ords[lg][k]) for lg in LEAGUES for k in range(MSI_SLOTS[lg])), key=lambda x: (x[0], x[1])); teams = [x[2] for x in q]
        mine = any(t.me for t in teams)
        if mine: s.intl = True; s.fame_wk += P['fame']['msiPart']; s.hot = True; s.mark()
        w, _ = yield from run_de(s, DE4, teams[7:], 5, rng, 'msi')                      # Play-In do MSI: 4 times, vence 1
        champ, vice = yield from run_de(s, DE8, teams[:7] + [w], 5, rng, 'msi')         # chave de 8
        s.msi_champ, s.msi_vice = champ.lg, vice.lg; s.hot = False
        if mine:
            if champ.me: s.prize_wk += P['prize']['msiWin']; s.fame_wk += P['fame']['msiWin']; s.titles['msi'] += 1; s.fail['msi'] = 0
            else: s.prize_wk += P['prize']['msiPart']; s.fail['msi'] += 1
    def worlds_phase(s, final, rng):
        ords = s.others(rng); ords[s.lg] = final; rr = s.regrank(); sl = dict(WC_SLOTS)
        for lg in (s.msi_champ, s.msi_vice):
            if lg: sl[lg] += 1
        q = sorted(((k, rr.index(lg), ords[lg][k]) for lg in LEAGUES for k in range(sl[lg])), key=lambda x: (x[0], x[1])); teams = [x[2] for x in q]
        mine = any(t.me for t in teams)
        if mine: s.intl = True; s.fame_wk += P['fame']['wdPart']; s.hot = True; s.mark()
        pin = []
        for t in reversed(teams[6:]):
            if len(pin) < 4 and t.lg not in [x.lg for x in pin]: pin.append(t)
        for t in reversed(teams[6:]):
            if len(pin) < 4 and t not in pin: pin.append(t)
        pin.sort(key=teams.index); pw, _ = yield from run_de(s, DE4, pin, 5, rng, 'worlds')   # Play-In do Mundial
        alive = [t for t in teams if t not in pin] + [pw]; rec = {t.id: [0, 0, []] for t in alive}
        for rnd in range(1, 6):                                                          # Suico de 16: Bo1; decisivas Bo3; 3V classifica, 3D elimina
            op = [t for t in alive if rec[t.id][0] < 3 and rec[t.id][1] < 3]; groups = {}
            for t in op: groups.setdefault((rec[t.id][0], rec[t.id][1]), []).append(t)
            for k, g in sorted(groups.items()):
                g.sort(key=lambda t: -t.F)
                if rnd == 1: pairs = [(g[i], g[-1 - i]) for i in range(len(g) // 2)]
                else:
                    for _ in range(80):
                        sh = g[:]; rng.shuffle(sh)
                        if all(sh[i + 1].id not in rec[sh[i].id][2] for i in range(0, len(sh), 2)): break
                    pairs = [(sh[i], sh[i + 1]) for i in range(0, len(sh) - 1, 2)]
                for a, b in pairs:
                    nb = 3 if (k[0] == 2 or k[1] == 2) else 1
                    if a.me or b.me: won = yield from s.series_me(b if a.me else a, nb, 'worlds'); aw = (a.me == won)
                    else: aw = ai_series(rng, a, b, nb)
                    wn, ls = (a, b) if aw else (b, a); rec[wn.id][0] += 1; rec[ls.id][1] += 1; rec[wn.id][2].append(ls.id); rec[ls.id][2].append(wn.id)
        adv = sorted([t for t in alive if rec[t.id][0] == 3], key=lambda t: (rec[t.id][1], -t.F))
        ko = [adv[i] for i in (0, 7, 3, 4, 1, 6, 2, 5)] if len(adv) == 8 else adv
        while len(ko) > 1:                                                              # quartas, semis, final: Bo5
            nx = []
            for i in range(0, len(ko), 2):
                a, b = ko[i], ko[i + 1]
                if a.me or b.me: won = yield from s.series_me(b if a.me else a, 5, 'worlds'); nx.append(a if a.me == won else b)
                else: nx.append(a if ai_series(rng, a, b, 5) else b)
            ko = nx
        s.hot = False
        if mine:
            if ko[0].me: s.prize_wk += P['prize']['wdWin']; s.fame_wk += P['fame']['wdWin']; s.titles['worlds'] += 1; s.fail['worlds'] = 0
            else: s.prize_wk += P['prize']['wdPart']; s.fail['worlds'] += 1
    # ----- semana: foco, partida, receita, despesa, seguidores, fama, moral, patrocinio, piso de caixa
    def pick_focus(s, mode):
        if s.M < (40 if mode == 'auto' else 42): return 'descanso'
        if mode == 'auto': return 'scrims' if s.hot else ('treino' if s.forma[1] <= 0 or s.wk % 2 == 0 else 'conteudo')
        if s.hot and s.cdw.get('bootcamp', 0) <= 0 and s.div == 'T1' and s.intl and s.R > 30000 + 3 * s.costs(): return 'bootcamp'
        if s.hot: return 'scrims'
        if s.cdw.get('imprensa', 0) <= 0 and s.F < 450: return 'imprensa'
        return 'treino' if s.forma[1] <= 1 else 'conteudo'
    def week(s, focus, gen):
        s.wk += 1; s.prize_wk = 0; s.fame_wk = 0
        for k in list(s.cdw): s.cdw[k] = max(0, s.cdw[k] - 1)
        if focus in ('imprensa', 'bootcamp'): s.cdw[focus] = {'imprensa': 2, 'bootcamp': 8}[focus]
        co, an, ps, sm = s.staff['coach'], s.staff['anal'], s.staff['psi'], s.staff['smm']; segmul = 1.0; spend = 0; dF = 0; dM = 0
        if focus == 'treino': s.forma = (2.5 * (1 + 0.4 * co + 0.2 * an), 3); dM -= (1 if ps else 2)
        elif focus == 'conteudo': segmul = 3.0; dM -= 1
        elif focus == 'descanso': dM += 10 + 3 * ps
        elif focus == 'scrims': s.scrim = 3 + an; spend = 600 * (1 + 2 * (s.div == 'T1')); dM -= 0.5
        elif focus == 'imprensa': dF += P['fame']['press'] * (1 + s.star() / 60.0) * (1 + 0.5 * sm)
        elif focus == 'bootcamp': s.forma = (4 * (1 + 0.4 * co + 0.2 * an), 4); dM += 8; dF += 2; spend = 25000
        try: next(gen)
        except StopIteration: pass
        win = s.last['win'] if s.last else None; intl = s.last is not None and s.last['kind'] in ('msi', 'worlds')
        wr = sum(s.hist8) / len(s.hist8) if s.hist8 else 0.5; mu = s.mult()
        parts = dict(tv=(s.tv() + (P['tvIntl'] if intl else 0)) * mu, spons=s.sponv * mu, social=s.social(focus) * mu, loja=s.loja() * mu, ticket=s.ticket(wr) * mu, hero=s.hero_income() * mu, prize=s.prize_wk)
        gross = sum(parts.values()); cost = s.costs() + spend + (P['travel'][s.last['kind']] if intl else 0)
        s.R += gross - cost; s.minR = min(s.minR, s.R)
        for k, v in list(parts.items()) + [('cost', cost)]: s.income[k] = s.income.get(k, 0) + v
        cap = min(8e6, 2000 * (1 + s.F) ** 1.5)
        g = (s.seg * 0.02 + 20) * (1 + s.star() / 25.0) * (1 + 0.5 * sm) * segmul * (1.3 if win else 1.0)
        s.seg = max(50, s.seg + g * max(0, 1 - s.seg / cap) - (0.002 * s.seg if s.seg > cap else 0))
        s.F = max(0.0, min(1000.0, s.F * P['fame']['decay'] + dF * (1 - s.F / 1000.0) + s.fame_wk + 0.02 * s.star() / 5))
        s.M += (55 + 3 * s.lv['house'] + 5 * ps - s.M) * 0.08 + dM + (((2 if s.div == 'T1' else 1.5) if win else -2.5 * (0.5 if ps else 1)) if win is not None else 0)
        s.M = max(0, min(100, s.M))
        if s.forma[1] > 0: s.forma = (s.forma[0], s.forma[1] - 1)
        tg = s.spons_target()                                       # patrocinio: converge para o alvo (ofertas a cada 4 semanas); luvas de 2x ao subir de patamar
        if tg > s.sponv:
            if tg - s.sponv > 0.3 * max(s.sponv, 700): s.R -= 2 * (tg - s.sponv) * 0.25
            s.sponv += (tg - s.sponv) * 0.25
        else: s.sponv = tg
        if s.R < 0:                                                 # falencia amena (a diretoria dispensa staff; piso de R$ 3.000)
            for k in ('psi', 'anal', 'coach', 'smm'):
                if s.staff[k]: s.staff[k] = 0; break
            s.M = max(0, s.M - 8); s.R = max(s.R, 3000)
        s.slog.append((s.t, s.S_base())); s.mark(); return P['WK']

def run(profile='ativo', seed=1, region='BR', stars=0, tmax=14 * 3600):
    T = Team(seed, region, stars); gen = T.career(); wall = 0.0
    session, gap = {'ativo': (1e18, 0), 'casual': (180, 1620), 'ocioso': (60, 3600)}[profile]
    while wall < tmax and not T.titles['worlds']:
        t_end = wall + session; T.shop()
        while wall < t_end and not T.titles['worlds'] and wall < tmax:
            f = T.pick_focus('ativo'); f = 'treino' if f == 'bootcamp' and not (T.div == 'T1' and T.cdw.get('bootcamp', 0) <= 0) else f
            T.t = wall; wall += T.week(f, gen); T.t = wall; T.shop()
            if profile != 'ativo' and wall >= t_end: break
        if T.titles['worlds'] or gap == 0: break
        spent = 0.0; off = min(gap, P['maxAway'])                   # offline: Piloto automatico, 90% de eficiencia, teto de 4 h, so compra com o Gerente
        while spent < off:
            if T.R < 2 * T.costs() and T.div != 'ranq': break
            if T.div == 'ranq' and T.n_tit() < 5 and T.R < 1: break
            T.t = wall + spent; spent += T.week(T.pick_focus('auto'), gen) / P['offEff']
            if T.manager: T.shop(cap=6, auto=True)
            if T.titles['worlds']: break
        wall += min(gap, spent); T.t = wall
    T.t = wall; return T

def fmt_t(s):
    if s is None: return '    -   '
    return ('%5.2f h' % (s / 3600)) if s >= 3600 else ('%4.0f min' % (s / 60))
def qt(v, p): v = sorted(v, key=lambda x: (x is None, x)); return v[min(len(v) - 1, int(p * (len(v) - 1) + 0.5))]

if __name__ == '__main__':
    init(sys.argv[1] if len(sys.argv) > 1 else 'js/data/jogadores.js'); N = 9; SEEDS = range(1, N + 1)
    print('=== 1) Marcos por perfil, Brasil (mediana de %d sementes; titulo: p25-p75) ===' % N)
    keys = ('5tit', 'R2', 'promo', 'R3', 'R4', 'intl', 'R5', 'msi', 'R6', 'R7')
    print('perfil   titulo mundial (p25 - p75)    | ' + ' '.join('%-9s' % k for k in keys))
    runs = {}
    for prof in ('ativo', 'casual', 'ocioso'):
        rows = runs[prof] = [run(prof, sd) for sd in SEEDS]; tt = [T.t if T.titles['worlds'] else None for T in rows]
        print('%-8s %s (%s - %s) | %s' % (prof, fmt_t(qt(tt, .5)), fmt_t(qt(tt, .25)).strip(), fmt_t(qt(tt, .75)).strip(),
              ' '.join('%-9s' % fmt_t(qt([T.mile.get(k) for T in rows], .5)).strip() for k in keys)))
    print('\n=== 2) Regioes (ativo, mediana de 6 sementes) ===')
    for rg in ('BR', 'NA', 'EU', 'KR', 'CN', 'AP'):
        rows = [run('ativo', sd, rg) for sd in range(1, 7)]; tt = [T.t for T in rows]
        print('  %s (%s): titulo %s  (min %s, max %s)  | promocao %s | 1a vaga internacional %s' % (rg, REG[rg], fmt_t(qt(tt, .5)).strip(), fmt_t(min(tt)).strip(), fmt_t(max(tt)).strip(),
              fmt_t(qt([T.mile.get('promo') for T in rows], .5)).strip(), fmt_t(qt([T.mile.get('intl') for T in rows], .5)).strip()))
    print('\n=== 3) Mix de receita do perfil ativo (media ate o titulo) ===')
    tot = {}
    for T in runs['ativo']:
        for k, v in T.income.items(): tot[k] = tot.get(k, 0) + v
    g = sum(v for k, v in tot.items() if k != 'cost')
    print('  ' + ' | '.join('%s %.0f%%' % (n, 100 * tot[k] / g) for k, n in (('hero', 'herois'), ('spons', 'patrocinio'), ('social', 'redes'), ('prize', 'premios'), ('tv', 'TV'), ('loja', 'loja'), ('ticket', 'bilheteria'))) + ' | despesas %.0f%% da receita' % (100 * tot['cost'] / g))
    print('\n=== 4) Paredes e buracos (ativo; 9 sementes) ===')
    gaps = []; stalls = []; hg = []
    for T in runs['ativo']:
        b = [0] + T.buys + [T.t]; gaps.append(max(b[i + 1] - b[i] for i in range(len(b) - 1)) / 60)
        h = [0] + [x[0] for x in T.hires if x[1] < 35] + [T.t]; hg.append(max(h[i + 1] - h[i] for i in range(len(h) - 1)) / 60)
        st = 0; j = 0
        for i in range(len(T.slog)):                                  # maior janela sem ganhar 1 ponto de forca
            while T.slog[i][1] - T.slog[j][1] >= 1.0 and j < i: j += 1
            st = max(st, T.slog[i][0] - T.slog[j][0])
        stalls.append(st / 60)
    print('  maior intervalo sem NENHUMA compra (min): mediana %.1f, maximo %.1f' % (qt(gaps, .5), max(gaps)))
    print('  maior intervalo entre contratacoes da escada (min): mediana %.1f, maximo %.1f' % (qt(hg, .5), max(hg)))
    print('  maior janela sem subir 1 ponto de forca base (min): mediana %.1f, maximo %.1f' % (qt(stalls, .5), max(stalls)))
    print('  caixa minimo: R$ %.0f | resgates da diretoria: 0 em %d/%d runs' % (min(T.minR for T in runs['ativo']), sum(1 for T in runs['ativo'] if T.minR >= 0), N))
    print('\n=== 5) Retrato do perfil ativo (semente 1) ===')
    T = Team(1); gen = T.career(); wall = 0.0; marks = [600, 1800, 3600, 5400, 7200, 9000]; k = 0; T.shop()
    print('  tempo   div  forca  nota  fama  seguid.   heroi$/sem  patroc.  social | heroisx nv>=25 | caixa')
    while wall < 14400 and not T.titles['worlds']:
        f = T.pick_focus('ativo'); f = 'treino' if f == 'bootcamp' and not (T.div == 'T1' and T.cdw.get('bootcamp', 0) <= 0) else f
        T.t = wall; wall += T.week(f, gen); T.t = wall; T.shop()
        if k < len(marks) and wall >= marks[k]:
            k += 1; print('  %4.0f min %-3s %6.1f %5.1f %5.0f %8.0f %11.0f %8.0f %7.0f |  %2d      %2d     | %9.0f' % (wall / 60, T.div, T.S_base(), T.A(), T.F, T.seg, T.hero_income() * T.mult(), T.sponv * T.mult(), T.social() * T.mult(), sum(1 for x in T.L if x), sum(1 for x in T.L if x >= 25), T.R))
    print('  titulo em %s (anos de jogo: %d, semanas: %d)' % (fmt_t(wall).strip(), T.year, T.wk))
    print('\n=== 6) Cada heroi: hora media da contratacao (ativo, Brasil, mediana) ===')
    lad = Team(1).lad
    for i in range(0, 40, 5):
        ts = [qt([next((x[0] for x in T.hires if x[1] == j), None) for T in runs['ativo']], .5) for j in range(i, i + 5)]
        print('  rodada %d: %s' % (i // 5 + 1, ' '.join('%-9s' % fmt_t(t).strip() for t in ts)))
```

---

## 7. Mudanças por arquivo (sem tocar agora; outros agentes estão alterando)

### `js/data/` (novo)

- `js/data/esp-liga3.js` — `ESP3.TEAMS` (por liga: nome, slug, nota média, F calculada), `ESP3.D2` (times T2 por liga), `ESP3.SLQ`, `ESP3.CHAMPS` (pool de nomes de campeões só em texto para o draft), `ESP3.SPECS` (`de4`, `de8`, `po6`), `ESP3.SLOTS` (MSI/Mundial).
- `js/data/esp-herois.js` — `ESP3.ladder(region, jogadores)` (mesma lógica de `build_ladder`), `ESP3.GLOB`, parâmetros `ESP3.P` (os do bloco `P` do script). Funções puras, sem DOM, testáveis em Node.
- `js/data/esp-eco.js` — apenas adicionar `ECO.C.hero = {C0, rc, P0, rp, T1, g, mm, lvmax, bonusMax, upCost, upMul, upNota, upLv, famaK}` e `ECO.C.mkt`; funções `ECO.heroCost/heroProd/heroLvCost/heroIncome`.

### `js/games/esp.js`

- Remover itens `tit/res` (compra de jogadores) → trocar por item único `esp-herois` (id de contagem = nº de heróis contratados) e itens `heroiLv`, `heroiUp`, `glob`.
- `closeWeek`: somar `ECO.heroIncome(state)` à receita, com `× mult × mercado`.
- Salvar em `state.her = { L: [], up: [], glob: [], mgr: 0, age: [] }`.
- Migração: se `state.tabs.mercado` existe, converter titulares atuais para os heróis mais próximos na escada (mesmo role, nota ≥), nível 1; `state.tabs.elenco` recebe `{ L, up, glob }`.
- Espelhar `o[tit]/o[res]` com `api.setOwned` para manter metas/conquistas (tit = nº de titulares na escada; res = reservas = 2 maiores níveis não titulares).
- Liga: `playWeek` consulta `ESP3.teams(region)`; tabela e playoffs usam `ESP3.runDE`/`po6`; MSI/Mundial como na seção 2.2.

### `js/tabs/esp-mercado.js` → `esp-elenco.js` (aba "Elenco/Heróis")

- Wireframe (mobile 360 px):

```
┌──────────────────────────────┐
│ ELENCO  ·  R$ 118.404  Fama 87│
│ Titulares: ⛨TOP  🌲JNG ... (5 chips com nota)
│ ───────────────────────────── │
│ [Próximo herói] Desafiante MID │
│  R$ 4.500  [Contratar]         │
│ ───────────────────────────── │
│ 🛡 TOP  Boal ·80·  Nv 34  ×2   │
│   +R$ 610/sem   [Nv +1 R$ 3,2k]│
│   Upgrades: [Botas ✓][Espada][..]
│ ... (lista rolável, filtro por role)
│ [Globais] [Gerente de elenco]  │
└──────────────────────────────┘
```

- Cada linha: ícone de role, nome, nota (real+bônus), nível, produção/sem, botão `Nv +1` (long-press = comprar ×10/Máx), chips de upgrades com ícone (`img/itens`). Estrutura `registerTab` mantida; `render(api)` usa `api.list` para diffing da lista. Id novo `elenco`, alias `mercado` apenas para migração.

### `js/tabs/esp-liga.js`

- Cabeçalho com logo da liga (`img/ligas/*.webp`) e patch atual; seletor de liga/fase (Split, Playoffs, MSI, Mundial).
- Tabela (`dbTableHTML` adaptado) e chaves (`po6`, `de4`, `de8`, `ko8`, `swiss`) da seção 4; clique no cartão abre **resumo de partida** (KDA, ouro, objetivos com `img/obj`) e **draft**.
- Estante: troféus (`img/trofeus`) por título; MVP por split.

### `js/scenes/esp.js` e contrato `x.*`

- Novos campos expostos: `x.heroes` (lista dos 5 titulares com role, nota, slug do time real), `x.division`, `x.region` (já existentes), `x.champ` (liga/fase atual), `x.match` (`{a,b,slugA,slugB,bo,placar,obj}`), `x.patch` (`{nome, role, delta}`), `x.rival` (slug ou null), `x.bracket` (modelo da seção 4.2, opcional).
- Cena: placas de logos nas telas laterais, objetivos aparecem na arena quando `x.match.obj` muda (dragão/arauto/barão). Contrato **aditivo**: campos antigos (`x.roster`, `x.division`, `x.region`, `x.champ`) permanecem; a cena deve ignorar campos desconhecidos.

### CSS (`css/esp.css`, prefixo `esp-`)

Variáveis de cor das roles (`--esp-top`, `--esp-jng`...), `.esp-her` (linha do herói, altura 56 px, alvo de toque ≥ 44 px), `.esp-chip`, `.esp-tab`, `.esp-br` (chave: `position: relative`, cartões `position:absolute`, `.esp-br-zoom{transform-origin:0 0}`), `.esp-flag` (16×12). Adaptar o bloco de CSS do BrasLOL (tabelas/chaves) trocando prefixos e removendo tudo que dependa de arte de campeão.

---

## 8. Riscos

1. **Escopo da Liga** (maior risco): Suíço + DE + po6 + Play-In exigem testes; mitigação: o script da seção 6 já é a especificação executável; portar linha a linha e comparar saídas por semente.
2. **Calibração do casual**: 4,5 h vs meta 4 h. O Gerente de elenco é a alavanca (preço R$ 60.000 e 60% do caixa). Se o offline for removido por outro agente, o perfil casual cai para ~6 h.
3. **Dados**: notas do DATA mudam; recalcular `F` em runtime e rodar o script (regra: 2,5–3,5 h) a cada atualização de `jogadores.js`.
4. **Conflitos de integração**: outros agentes alteram `engine.js`, `esp.js`, `esp-*.js`, `scenes/esp.js`; este doc não toca neles. Migrar `tabs.mercado → tabs.elenco` precisa de versão de save e de teste com saves V2.
5. **Direitos de imagem**: logos de times reais e ícones de itens da Riot; já usados no BrasLOL; não foram copiadas fotos de jogadores nem arte de campeões. Os ícones `img/obj/` vêm de `champs/obj/` (apenas objetivos) — exceção explícita à regra "nada de champs/".
6. **Mobile**: tabela de 12 times + chaves exigem zoom-fit e scroll horizontal; testar em 360 px.
7. **Peso**: assets ~505 KB reais (210 arquivos); bandeiras svg e logos são lazy-loaded (`loading="lazy"`).
8. **Escada longa**: 40 heróis = 40 contratações; mitigação já no modelo (rodadas de 5, portas por divisão, pré-visualização do próximo herói, ordem fixa).
