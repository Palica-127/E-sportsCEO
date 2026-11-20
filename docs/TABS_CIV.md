# Abas da Caverna ao Espaço: Mapa, Árvore e Maravilhas

Três plugins de aba (API em `docs/TABS_API.md`, `Engine.version === 1`) que gastam **🔬 Ciência** em bônus permanentes. Arquivos: `js/tabs/civ-mapa.js` (id `mapa`), `js/tabs/civ-tecnologia.js` (id `tecnologia`, rótulo "Árvore"), `js/tabs/civ-maravilhas.js` (id `maravilhas`), `css/tab-civ.css` (prefixo `.civ-`), testes em `tests/civ_tabs.js`. Nada em `engine.js`, `style.css`, `games/` ou `scenes/` foi tocado.

Nota de nomes: o pedido fala em "Descobertas"; no jogo a moeda é a Ciência (`api.cur` = 🔬), então todos os custos são em Ciência. O evento clicável "Descoberta!" continua sendo outra coisa.

## 1. Visão geral

| Aba | Chip | Abre quando | O que é |
|---|---|---|---|
| Mapa | 🗺️ Mapa | Agricultura nível 1 (~10 min) | 16 regiões: explorar, colonizar, conquistar (3 etapas cada) |
| Árvore | 🌳 Árvore | Escrita nível 1 (~26 min) | 3 caminhos (Guerra, Comércio, Ciência), 24 tecnologias, escolhas excludentes e uma doutrina final |
| Maravilhas | 🏛️ Maravilhas | 1ª Cidade (~30 min) | 15 maravilhas históricas, obras em tempo real, com canteiros limitados |

O desbloqueio é **permanente**: depois de aberta a aba fica aberta (flag `u` no save da aba), mesmo depois do prestígio. As abas escalonam a novidade: uma a cada ~10 a 20 minutos.

Interface comum: resumo no topo, lista com diff (`api.list`), painel inferior fixo (sticky) ao tocar num item, com texto, bônus, custo e botão de ação; alvos de toque >= 44 px (verificado no navegador); contraste AA com as variáveis do `style.css`; sem animações próprias (só transições curtas desligadas em `prefers-reduced-motion` e `.rm`); `aria-label` em todos os botões; botões indisponíveis usam `aria-disabled` (continuam focáveis e explicam o motivo ao tocar).

## 2. Mapa-múndi

Mapa estilizado (cartograma) desenhado em SVG inline: continentes e regiões são polígonos simplificados e originais, **fora de escala** (regiões pequenas foram ampliadas para caberem alvos de toque de 44 px). Cada região é um botão HTML sobre o SVG e também uma linha na lista abaixo do mapa.

Cada região tem 3 etapas, liberadas por era (`GAMES.civ.tiers`): **explorar** na era da região, **colonizar** na era seguinte, **conquistar** duas eras depois (máx. Era Espacial). Cada etapa dá uma fração do bônus: 30% / 60% / 100% (acumulado). A curiosidade verdadeira e curta aparece ao conquistar (e fica guardada: continua visível depois do prestígio). A Antártida usa verbos próprios ("Montar base", "Pesquisar"), porque o Tratado Antártico de 1959 reserva o continente à paz e à ciência.

| Região | Era | Bônus (conquistada) | Explorar | Colonizar | Conquistar |
|---|---|---|---|---|---|
| Mesopotâmia | Antiguidade | Contabilidade suméria: +1% de renda | 630 mil (Antiguidade) | 21 mi (Idade Média) | 3,1 bi (Era Industrial) |
| Vale do Nilo | Antiguidade | Cheias do Nilo: +0,8% de renda | 500 mil (Antiguidade) | 17 mi (Idade Média) | 2,5 bi (Era Industrial) |
| Vale do Indo | Antiguidade | Planejamento urbano: −6% no custo das tecnologias | 320 mil (Antiguidade) | 11 mi (Idade Média) | 1,5 bi (Era Industrial) |
| China (Rio Amarelo) | Antiguidade | Seda e papel: +0,9% de renda | 570 mil (Antiguidade) | 19 mi (Idade Média) | 2,8 bi (Era Industrial) |
| Mediterrâneo (Grécia e Roma) | Antiguidade | Arquitetura clássica: −6% no custo das maravilhas | 320 mil (Antiguidade) | 11 mi (Idade Média) | 1,5 bi (Era Industrial) |
| Europa | Idade Média | Feiras medievais: +0,7% de renda | 7,4 mi (Idade Média) | 1,2 bi (Era Industrial) | 110 bi (Era Espacial) |
| Ásia Central | Idade Média | Caravanas: −8% no custo do mapa | 5,3 mi (Idade Média) | 840 mi (Era Industrial) | 77 bi (Era Espacial) |
| África Subsaariana | Idade Média | Ouro do Sahel: +0,8% de renda | 8,4 mi (Idade Média) | 1,3 bi (Era Industrial) | 120 bi (Era Espacial) |
| Sudeste Asiático | Idade Média | Especiarias: +0,7% de renda | 7,4 mi (Idade Média) | 1,2 bi (Era Industrial) | 110 bi (Era Espacial) |
| Japão | Idade Média | Carpintaria precisa: −8% no tempo de obras | 5,8 mi (Idade Média) | 920 mi (Era Industrial) | 85 bi (Era Espacial) |
| Mesoamérica | Era Industrial | Calendário maia: +0,6% de renda | 500 mi (Era Industrial) | 50 bi (Era Espacial) | 92 bi (Era Espacial) |
| Andes | Era Industrial | Estradas incas: −6% no tempo de obras | 380 mi (Era Industrial) | 38 bi (Era Espacial) | 69 bi (Era Espacial) |
| Amazônia (Brasil) | Era Industrial | Terra preta: +0,7% de renda | 590 mi (Era Industrial) | 59 bi (Era Espacial) | 110 bi (Era Espacial) |
| América do Norte | Era Industrial | Rios navegáveis: +0,5% de renda | 420 mi (Era Industrial) | 42 bi (Era Espacial) | 77 bi (Era Espacial) |
| Oceania | Era Industrial | Navegação polinésia: −8% no custo do mapa | 420 mi (Era Industrial) | 42 bi (Era Espacial) | 77 bi (Era Espacial) |
| Antártida | Era Industrial | Ciência polar: −6% no custo das tecnologias | 420 mi (Era Industrial) | 42 bi (Era Espacial) | 77 bi (Era Espacial) |

Os custos acima são os da base (sem descontos). Descontos do próprio mapa, da árvore e das maravilhas (categoria "mapa") se somam, com teto de 40%.

## 3. Árvore de tecnologia

Três caminhos de 6 passos. Cada passo exige o anterior do mesmo caminho. Passos com duas opções são **escolhas excludentes** (comprou uma, a outra fica bloqueada até a próxima civilização). O passo 6 é a **doutrina final** e vale **uma só em todo o jogo**, entre os três caminhos. Dois passos têm pré-requisito cruzado (exércitos custam dinheiro; a bolsa precisa da imprensa). Estilos: Conquistador (Guerra), Mercador (Comércio), Estudioso (Ciência), Equilibrado (empate). Toque num nó: abre o painel com o efeito, o que ele bloqueia e o botão "Pesquisar".

**Guerra**

| Passo | Opção | Era | Efeito | Custo |
|---|---|---|---|---|
| 1 | 🗡️ Armas de bronze | Antiguidade | −4% no custo do mapa | 1,3 mi |
| 2 | 🏰 Fortificações | Antiguidade | +0,3% de renda | 1,1 mi |
| 3 (escolha) | 🛡️ Falange | Idade Média | −8% no custo do mapa | 36 mi |
| 3 (ou) | 🦅 Legião | Idade Média | +0,5% de renda | 30 mi |
| 4 | 🐎 Cavalaria | Idade Média | +0,3% de renda | 18 mi |
| 5 (escolha) | 💥 Pólvora (exige Comércio, passo 3) | Era Industrial | +0,5% de renda | 2,4 bi |
| 5 (ou) | 🏗️ Engenharia militar (exige Comércio, passo 3) | Era Industrial | −8% no tempo de obras | 2,4 bi |
| 6 | 🎖️ Superpotência [doutrina final: só uma] | Era Espacial | +0,7% de renda e −10% no custo do mapa | 220 bi |

**Comércio**

| Passo | Opção | Era | Efeito | Custo |
|---|---|---|---|---|
| 1 | 🪙 Moeda | Antiguidade | +0,4% de renda | 1,4 mi |
| 2 | 🐪 Rotas comerciais | Antiguidade | +0,4% de renda | 1,4 mi |
| 3 (escolha) | 🏦 Bancos | Idade Média | +0,6% de renda | 36 mi |
| 3 (ou) | 🧰 Guildas | Idade Média | −8% no custo das tecnologias | 36 mi |
| 4 | 🗺️ Cartografia comercial | Idade Média | −6% no custo do mapa | 24 mi |
| 5 (escolha) | 📈 Bolsa de valores (exige Ciência, passo 4) | Era Industrial | +0,6% de renda | 2,9 bi |
| 5 (ou) | 🚢 Livre comércio (exige Ciência, passo 4) | Era Industrial | −10% no custo das maravilhas | 2,6 bi |
| 6 | 🌐 Globalização [doutrina final: só uma] | Era Espacial | +0,8% de renda e −6% no custo das maravilhas | 220 bi |

**Ciência**

| Passo | Opção | Era | Efeito | Custo |
|---|---|---|---|---|
| 1 | 🌙 Calendário | Antiguidade | +0,3% de renda | 1,1 mi |
| 2 | 📐 Matemática | Antiguidade | −4% no custo das tecnologias | 1,3 mi |
| 3 (escolha) | 🎓 Universidades | Idade Média | +0,5% de renda | 30 mi |
| 3 (ou) | 🏛️ Casa da Sabedoria | Idade Média | −8% no custo das tecnologias | 36 mi |
| 4 | 🖨️ Imprensa | Idade Média | +0,4% de renda | 24 mi |
| 5 (escolha) | 🧪 Método científico | Era Industrial | +0,6% de renda | 2,9 bi |
| 5 (ou) | ⚙️ Engenharia aplicada | Era Industrial | −10% no tempo de obras | 2,9 bi |
| 6 | 💾 Era da Informação [doutrina final: só uma] | Era Espacial | +0,9% de renda | 220 bi |

Melhor combinação possível só de renda (verificada por força bruta em `tests/civ_tabs.js`): +6,5%.

## 4. Maravilhas

Obras em **tempo real** (`Date.now()`, via `CIVT.clock()` para os testes). O custo é pago ao iniciar; o progresso corre com o jogo aberto ou fechado e as obras terminam sozinhas ao reabrir. Limite de canteiros: 1 no início; a Pirâmide de Gizé dá +1 e a Torre Eiffel +1 (máx. 3). Cancelar uma obra devolve 50% (toque duplo para confirmar). O tempo é fixado no início da obra (descontos de tempo valem só para obras futuras). Maravilhas da mesma era têm custo crescente (fator `k`). As ilustrações são SVG inline (viewBox 64x48).

| Maravilha | Era | Tempo | Custo | Bônus |
|---|---|---|---|---|
| Pirâmide de Gizé (c. 2560 a.C. · Egito) | Idade Média | 6 min | 90 mi | Canteiros organizados: +1 obra simultânea |
| Jardins Suspensos da Babilônia (Lenda · Babilônia) | Idade Média | 8 min | 90 mi | Irrigação elegante: +0,5% de renda |
| Estátua de Zeus em Olímpia (c. 435 a.C. · Grécia) | Idade Média | 8 min | 130 mi | Mestre Fídias: −8% no custo das maravilhas |
| Farol de Alexandria (c. 280 a.C. · Egito) | Idade Média | 10 min | 160 mi | Rotas bem iluminadas: −8% no custo do mapa |
| Biblioteca de Alexandria (séc. III a.C. · Egito) | Idade Média | 12 min | 220 mi | Acervo do mundo: −8% no custo das tecnologias |
| Muralha da China (a partir de c. 220 a.C. · China) | Idade Média | 14 min | 360 mi | Fronteira segura: +0,8% de renda |
| Coliseu (80 d.C. · Roma) | Idade Média | 14 min | 380 mi | Pão e circo: +0,7% de renda |
| Angkor Wat (início do séc. XII · Camboja) | Idade Média | 16 min | 460 mi | Reservatórios e canais: +0,7% de renda |
| Chichén Itzá (c. 600 a 1200 d.C. · México) | Idade Média | 15 min | 430 mi | Calendário na pedra: −8% no tempo de obras |
| Taj Mahal (1632 a 1653 · Índia) | Era Industrial | 20 min | 11 bi | Mármore e simetria: +0,9% de renda |
| Machu Picchu (c. 1450 · Peru) | Era Industrial | 18 min | 9,6 bi | Terraços produtivos: +0,8% de renda |
| Torre Eiffel (1889 · França) | Era Industrial | 20 min | 11 bi | Estrutura de ferro: +0,5% de renda e +1 obra simultânea |
| Cristo Redentor (1931 · Brasil) | Era Industrial | 20 min | 9,6 bi | Vista privilegiada: +0,8% de renda |
| Estação Espacial Internacional (1998 · órbita da Terra) | Era Espacial | 25 min | 540 bi | Laboratório em órbita: +0,9% de renda |
| Programa Apollo (1969 · Lua) | Era Espacial | 30 min | 600 bi | Um grande salto: +1% de renda |

Os Jardins Suspensos aparecem como lenda de propósito: nunca foram confirmados pela arqueologia.

## 5. Economia e balanceamento

**Bônus**: renda via `api.mult` (3 ids: `civ-mapa:ps`, `civ-tec:ps`, `civ-mar:ps`, bem abaixo do limite de 40 multiplicadores do save), mais descontos de custo (mapa, árvore, maravilhas) e de tempo de obras, que valem entre as abas (`window.CIVT.fx`, recalculado em todo `load`). Teto de 40% por categoria de desconto.

**Teto de renda** (`node tests/civ_tabs.js`, teste "BONUS TOTAL MAXIMO"): com a Caverna toda maximizada, mapa 100% (x1,069) + melhor trilha da árvore (x1,065) + as 15 maravilhas (x1,079) = **x1,228 (+22,8%)**, abaixo do limite de +30%. Num jogo real o jogador não chega a tudo antes do fim (veja as simulações).

**Custo**: `custo = PSREF[era] * valor% * PB[aba] * fatia`, arredondado em 2 algarismos, onde `PSREF = [2e3, 3e4, 5e5, 4e7, 2e9]` é a produção/s típica ao entrar em cada era (medida na simulação), `valor%` é o valor do bônus em % de renda equivalente (desconto de 6 a 10% vale 0,45 a 0,6), `PB = {mapa: 14000, árvore: 12000, maravilhas: 30000}` e `fatia` = 15% / 30% / 55% nas etapas do mapa. Resultado: cada compra custa de ~5 a ~35 segundos de produção na hora em que o jogador chega nela, com retorno bem mais lento que o dos itens (por isso o jogador compra itens primeiro e as abas com a sobra, como num jogo de cartas de coleção). Os valores de `PB` foram calibrados por simulação (veja abaixo); mudar `PSREF`/`PB` no prelúdio dos três arquivos recalibra tudo.

**Sumidouros**: (a) mapa, árvore e maravilhas gastam Ciência o jogo inteiro (os custos acompanham as eras); (b) as maravilhas ocupam canteiros e tempo; (c) escolhas excludentes e doutrina única fazem o jogador abrir mão de bônus; (d) em nova civilização o mapa e a árvore voltam a custar de novo.

### Simulação (motor real, jsdom, `node tests/civ_tabs.js sim 5`)

Jogador sintético: 2 cliques/s, toca o evento Descoberta, compra sempre o item de menor retorno (c/ganho). "Focado em itens" só compra algo das abas se o retorno vencer o dos itens (K=3); "completista" também gasta até 30% do saldo em abas com retorno < 9000 s; "mesma prioridade" (K=1). Entre sementes a variação é desprezível (< 0,01 h): o jogo é determinístico exceto pelo sorteio do evento.

| Cenário | Fim da 1ª corrida | Mudança | Fim da 2ª corrida (após Nova civilização) | Bônus no fim | Gasto nas abas |
|---|---|---|---|---|---|
| Sem abas (referência) | 2,83 h | - | 1,13 h | - | - |
| Com abas, focado em itens | 2,70 h | -4,6% | 1,03 h (-9,2%) | x1,14 | 0,1% da renda total |
| Com abas, completista | 2,96 h | +4,7% | 1,17 h (+3,2%) | x1,21 (mapa 16/16, 16 techs, 15 obras) | 3,8% (79 compras) |
| Com abas, mesma prioridade | 2,68 h | -5,3% | 1,03 h (-9,0%) | x1,19 | 2,0% |

Entrada nas eras (sem abas): Antiguidade 6 min, Idade Média 30 min, Era Industrial 55 min, Era Espacial 104 min (com abas: 30 a 32, 54 a 62, 102 a 115 min). Abas abertas aos 10, 26 e 30 min. Leitura: o jogo continua fechando entre 2,7 e 3,0 h de jogo ativo; quem prioriza itens termina ~5% antes, quem coleciona tudo termina ~5% depois, mas com +21% de renda e o mapa inteiro.

Saída completa da última execução:

```
Simulacao: motor real, jogador sintetico (2 cliques/s, evento Descoberta, compra pelo menor retorno), 5 sementes por cenario.
Tempo = tempo de jogo ativo; relogio das obras = tempo simulado. "Fim" = todos os itens maximizados. A 2a corrida e depois de "Nova civilizacao".

== sem abas ==
  1a corrida: fim 2.83h [2.83h 2.83h 2.83h 2.83h 2.83h]  renda total 49.38 tri   |   2a corrida (apos Nova civilizacao): fim 1.13h, +14 Legado ao prestigiar
  eras na 1a corrida: T1 6m  T2 30m  T3 55m  T4 104m   abas abertas: Mapa 10m Tec 26m Mar 30m

== com abas, focado em itens (K=3: so compra aba se o retorno vencer) ==
  1a corrida: fim 2.70h [2.70h 2.70h 2.70h 2.70h 2.70h]  renda total 49.43 tri   |   2a corrida (apos Nova civilizacao): fim 1.03h, +14 Legado ao prestigiar
  eras na 1a corrida: T1 6m  T2 30m  T3 54m  T4 102m   abas abertas: Mapa 10m Tec 26m Mar 30m
  bonus no fim da 1a (semente 1): mapa +4.6% (5 conquistadas) | tec +2.7% (15 techs) | maravilhas +5.8% (13 obras) | produto x1.138
  bonus no fim da 2a: mapa +4.6% | tec +3.2% | maravilhas +5.8% (13 obras)
  gasto nas abas na 1a corrida: mapa 13.36 bi | tec 6.06 bi | maravilhas 33.30 bi  = 0.1% da renda total, 59 compras; 2a corrida: 0.0%

== com abas, completista (K=3 + gasta ate 30% do saldo em abas com retorno < 9000 s) ==
  1a corrida: fim 2.96h [2.96h 2.96h 2.96h 2.96h 2.96h]  renda total 51.37 tri   |   2a corrida (apos Nova civilizacao): fim 1.17h, +15 Legado ao prestigiar
  eras na 1a corrida: T1 6m  T2 32m  T3 62m  T4 115m   abas abertas: Mapa 10m Tec 28m Mar 32m
  bonus no fim da 1a (semente 1): mapa +6.9% (16 conquistadas) | tec +5.3% (16 techs) | maravilhas +7.9% (15 obras) | produto x1.214
  bonus no fim da 2a: mapa +6.9% | tec +4.1% | maravilhas +7.9% (15 obras)
  gasto nas abas na 1a corrida: mapa 889.12 bi | tec 179.09 bi | maravilhas 899.69 bi  = 3.8% da renda total, 79 compras; 2a corrida: 2.1%

== com abas, mesma prioridade (K=1) ==
  1a corrida: fim 2.68h [2.68h 2.68h 2.68h 2.68h 2.68h]  renda total 50.43 tri   |   2a corrida (apos Nova civilizacao): fim 1.03h, +14 Legado ao prestigiar
  eras na 1a corrida: T1 6m  T2 30m  T3 54m  T4 102m   abas abertas: Mapa 10m Tec 26m Mar 30m
  bonus no fim da 1a (semente 1): mapa +6.9% (16 conquistadas) | tec +4.7% (16 techs) | maravilhas +5.8% (13 obras) | produto x1.185
  bonus no fim da 2a: mapa +6.9% | tec +3.6% | maravilhas +5.8% (13 obras)
  gasto nas abas na 1a corrida: mapa 810.44 bi | tec 179.17 bi | maravilhas 33.30 bi  = 2.0% da renda total, 77 compras; 2a corrida: 2.1%

com abas, focado em itens (K=3: so compra aba se o retorno vencer) 1a: -4.6% | 2a: -9.2%  (negativo = mais rapido que sem abas)
com abas, completista (K=3 + gasta ate 30% do saldo em abas com retorno < 9000 s) 1a: 4.7% | 2a: 3.2%  (negativo = mais rapido que sem abas)
com abas, mesma prioridade (K=1)                             1a: -5.3% | 2a: -9.0%  (negativo = mais rapido que sem abas)
```

## 6. Persistência e prestígio

Save por aba (`g.civ.tabs.<id>`), sempre com `v: 1`; `load` valida tipos, limites e regras (ids desconhecidos descartados, excludentes respeitados, obras com datas absurdas descartadas ou limitadas a 3 h, relógio adulterado ou voltado não trava nem cria obra infinita). `load(null)` zera tudo (Zerar este jogo).

| Aba | Salvo | No prestígio ("Nova civilização") |
|---|---|---|
| Mapa | `u`, `r` (etapa por região), `seen` (curiosidades vistas) | **Recomeça**: regiões voltam a 0 e bônus zerados; curiosidades já vistas ficam; aba continua aberta |
| Árvore | `u`, `n` (nós pesquisados) | **Recomeça**: o jogador escolhe outro estilo; aba continua aberta |
| Maravilhas | `u`, `b` (concluídas), `q` (obras: início, fim, custo pago) | **Permanecem**: maravilhas concluídas, bônus e obras em andamento são patrimônio |

O motor limpa `api.mult` no prestígio; cada aba reaplica o seu em `onPrestige`. A 2ª corrida mostra o efeito: com as maravilhas já prontas ela é ~3 a 9% mais rápida que sem abas, e mapa/árvore voltam a ser um sumidouro de ~2% da renda.

## 7. Limitações da API (resolvidas dentro das abas)

- **Cliques**: não há hook de bônus de clique. O clique do jogo vale `clickBase + 0,10 * Legado + 0,03 * ps`, então todo bônus de renda já aumenta o clique na mesma proporção; não há bônus de clique separado.
- **Custo dos itens**: a API não permite descontar o preço dos itens da aba Comprar. Os bônus de "custo" valem para os custos do mapa, da árvore e das maravilhas, e há desconto de tempo de obras.
- **Tempo real**: `update` só roda com a página aberta e `api.now()` é por sessão, então as obras usam `Date.now()` (timestamps no save). O ganho offline de moeda continua sendo só do motor (50%, até 4 h).
- **Unlock**: o motor só avalia `unlock` das abas que têm `update` ou que aparecem no chip; por isso Mapa e Árvore declaram um `update` vazio, para a flag `u` ser gravada a cada tick.
- **Toasts**: o toast do motor aparece sobre o painel inferior por alguns segundos; nada a fazer na aba.
- **Chips**: com 4 abas ("Comprar", "Mapa", "Árvore", "Maravilhas") os chips passam de 360 px e rolam na horizontal (o container já tem `overflow-x:auto`).
- `api.stage().tier` é a única noção de "era" disponível; as eras do jogo não coincidem com as datas reais (por exemplo, o Coliseu abre na "Idade Média"), então cada item mostra a data real e a era de jogo separadas.

## 8. Testes

- `node --check js/tabs/civ-*.js tests/civ_tabs.js`
- `node tests/civ_tabs.js`: dados (16 regiões, 24 tecnologias, 15 maravilhas, distância dos pinos, arte SVG), unlocks, compras, eras, excludentes, doutrina única, pré-requisitos cruzados, slots, tempo real e offline, cancelamento, save/load, dados adulterados, prestígio, teto de +30%, descontos <= 40%, UI no jsdom (toque no pino, painel, lista com diff, barra de progresso).
- `node tests/civ_tabs.js sim [sementes]`: a simulação da seção 5 (`ONLY=completista,focado` filtra cenários; `PSREF='[...]'` e `PBF=2` testam outras calibrações).
- Navegador (Playwright, 390x780 e 360x640): chips aparecem em ordem (Agricultura, Escrita, Cidade), cada aba funciona por toque, nada de exceção no console, nenhum alvo < 44 px, sem overflow horizontal, `prefers-reduced-motion` sem animações, sem colisão entre pinos e rótulos do mapa.

## 9. Fatos históricos e geográficos

Só entraram fatos de ampla aceitação; quando havia dúvida, o texto ficou vago ou foi omitido ("cerca de", "c.", "segundo os relatos", "alguns estudiosos"). Pontos com ressalva explícita: Jardins Suspensos (lenda), Cai Lun (a tradição atribui; há papel mais antigo), Mansa Musa (relato de desvalorização do ouro), Cahokia (10 a 20 mil é estimativa), muralha "do espaço" (mito).
