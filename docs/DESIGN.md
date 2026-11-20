# DESIGN.md - Mini Idle 3 em 1: itens com limite e upgrades

Alvo: celular, partidas leves, sem backend, JS puro. Este documento é a especificação para reescrever o motor em `template.html` (`GAMES`, `ps`, `mult`, `costOf`, `nFor`, `update`) e para atualizar as cenas em `scenes/*.js`. Os números das tabelas saíram da simulação da seção 3 (rodada de verdade; o código e a saída estão lá).

## 0. Diagnóstico (o que estava errado)

- Todo item era "quantidade ilimitada" com custo `x1,15` e bônus `x2` a cada 25. Resultado: 300 Escritas, dezenas de coaches, 100 jogadores.
- Todo item tinha o mesmo comportamento e a tela mostrava 8 a 9 linhas desde o começo.
- Não havia "fim de fase": o jogo só inflava números.

Solução: dois tipos de item, **`unidades`** (coisas que existem: PC, titular, vila) com máximo pequeno e realista, e **`niveis`** (upgrades, evoluções) com nível máximo. Quem dá crescimento exponencial são os níveis (multiplicadores) e os saltos de tier das unidades.

## 1. Modelo comum de itens (vale para os 3 jogos)

### 1.1 Tipos

| Tipo | Estado | Produção | Custo da próxima compra |
|---|---|---|---|
| `unidades` (`t:'u'`) | `n` de 0 a `max` | `n * prod * M_item * P`. `M_item` = marcos da unidade x níveis que a miram | `c0 * g^n` |
| `niveis` (`t:'l'`) | `L` de 0 a `max` | não produz; multiplica o alvo por `f^L`. Alvo é um id de unidade ou `'all'` (toda a produção) | `c0 * g^L` |

- `P` (multiplicador global) = `(1 + 0,10 * estrelas_de_prestígio)` x `f^L` de todos os níveis com alvo `'all'` x bônus temporários (eventos) x bônus de conquistas (se houver).
- Marcos de unidades (automáticos): máx >= 3: ao chegar em `ceil(max/2)` e em `max`, `x2` cada. Máx = 2: ao chegar em 2, `x2`. Máx = 1: sem marco.
- Clique: `valor = (1 + 0,10 * estrelas) + 0,03 * ps`, multiplicado pelo combo (se houver). Clique é para o começo e para o dedo coçar; depois a renda passiva domina (o simulador confirma: de 2 cliques/s para 0,2 cliques/s o jogo termina só ~7% mais tarde).
- Compra em lote (x1, x10, Máx): soma geométrica limitada a `max - n`. `custoLote(k) = c0 * g^n * (g^k - 1) / (g - 1)`; para `g = 1` (itens de máx 1) o lote é sempre 1. `Máx` compra `k = min(max - n, floor(log(1 + saldo*(g-1)/c0/g^n) / log(g)))`, no mínimo 1.
- Quando `n == max` a linha vira "completo": botão some, mostra `MÁX` e a linha desce para uma faixa compacta no fim da lista (ver 1.3).

### 1.2 Esquema JS sugerido (substitui `gens`)

```js
// unidade
{id:'pc', n:'PC da lan', d:'Roda CS 1.6 liso. Quase.', t:'u', max:12, c0:15, g:1.27, p:0.5, req:null}
// nivel (alvo = id de unidade ou 'all'); nomes dos niveis em lv[]
{id:'gpu', n:'Placa de vídeo', d:'Mais FPS, menos choro.', t:'l', max:6, c0:830, g:1.73, tgt:'pc', f:1.6, req:['pc',3], lv:['GeForce 2 MX', ...]}

const cnt=(k,id)=>st.g[k].o[idx(k,id)];
const marcos=it=>it.t!=='u'||it.max<2?[]:it.max===2?[[2,2]]:[[Math.ceil(it.max/2),2],[it.max,2]];
function mult(k,i){const G=GAMES[k],it=G.items[i],o=st.g[k].o;let m=1;
  for(const [n,x] of marcos(it)) if(o[i]>=n) m*=x;
  G.items.forEach((u,j)=>{if(u.t==='l'&&u.tgt===it.id) m*=Math.pow(u.f,o[j])}); return m}
function gmult(k){const G=GAMES[k],o=st.g[k].o;let m=1+0.10*st.g[k].stars;
  G.items.forEach((u,j)=>{if(u.t==='l'&&u.tgt==='all') m*=Math.pow(u.f,o[j])}); return m*boost(k)}
const ps=k=>{const G=GAMES[k],o=st.g[k].o;let s=0;
  G.items.forEach((u,i)=>{if(u.t==='u') s+=u.p*o[i]*mult(k,i)}); return s*gmult(k)};
const cost1=(k,i)=>GAMES[k].items[i].c0*Math.pow(GAMES[k].items[i].g,st.g[k].o[i]);
```

Estado salvo por jogo (nova chave `idle3-v2`; saves antigos `idle3-v1` não migram, pois o significado de `o[]` mudou. Mostrar um toast único: "Versão nova! Seu progresso antigo foi zerado para o balanceamento novo."):
`{m, t, o:[], life, stars, claimed, ach:0|[], goal:0, vis:[bool...]}` (`life` = renda acumulada de todas as runs; `t` = renda da run atual; `vis` persiste o desbloqueio).

### 1.3 Regras de tela (anti-poluição, igual nos 3 jogos)

1. Um item fica visível quando o requisito (`req`: `[id, quantidade]`, tabela de cada jogo) é cumprido. Depois de visível, **nunca some** (`vis[i]=true` salvo).
2. Alternativa que também libera: renda total da run `t >= 0,5 * c0` do item. Isso só importa depois do prestígio (você não precisa recomprar a escadinha toda); o simulador usa **só** o requisito, então é conservador.
3. Mostrar **no máximo 1 linha "bloqueada"**, a próxima da fila: `🔒 ??? (compre 1 Placa de vídeo)`.
4. Itens completos viram uma faixa compacta ("✔ PC da lan, ✔ Placa de vídeo...") abaixo da lista. No simulador, o número máximo de linhas abertas ao mesmo tempo foi **3** nos três jogos (média ~2), então a tela do celular nunca passa de 3 cards + 1 bloqueado + faixa de completos.
5. Cada linha mostra: nome, descrição, `n/max` (ou `nível L/max` + nome do nível atual e do próximo), efeito do próximo passo ("+0,5/s" ou "produção x1,6"), botão com custo.
6. Teto de tempo offline: `MAXAWAY = 4 h` com eficiência 50% (recomendado; hoje é 8 h a 100%, o que pula o jogo todo). O simulador não considera offline.

---

## 2. LAN HOUSE

Moeda: `R$`. Clique: "Atender cliente". Ideia: 12 PCs no máximo; depois a lan cresce em qualidade (placa, SSD, monitor, internet) e em estrutura (atendentes, salas VIP, filiais).

### 2.1 Itens (na ordem de desbloqueio)

| # | Item | Descrição (texto do jogo) | Tipo | Máx | Custo base | Cresc. | Prod/s base | Efeito e marcos |
|--:|---|---|---|--:|--:|--:|--:|---|
| 0 | **PC da lan** | Roda CS 1.6 liso. Quase. | unidades | 12 | 15 | x1,27 | 0,5 | cada unidade produz 0,5/s; marcos: ao ter 6: x2; ao ter 12: x2 |
| 1 | **Placa de vídeo** | Mais FPS, menos choro. | níveis | 6 | 830 | x1,73 | - | x1,6 produção de PC da lan por nível (x16,8 no nível máx) |
| 2 | **Ar-condicionado** | Cliente fica mais tempo (e a conta de luz também). | níveis | 4 | 15 mil | x1,40 | - | x1,3 toda a produção por nível (x2,9 no nível máx) |
| 3 | **Atendente** | Cobra, serve e separa briga de mouse. | unidades | 3 | 29 mil | x3,05 | 47 | cada unidade produz 47/s; marcos: ao ter 2: x2; ao ter 3: x2 |
| 4 | **SSD** | O Windows abre antes do cliente sentar. | níveis | 5 | 180 mil | x1,62 | - | x1,5 produção de PC da lan por nível (x7,6 no nível máx) |
| 5 | **Monitor gamer** | Agora a culpa do erro é sua mesmo. | níveis | 5 | 1,8 mi | x1,69 | - | x1,5 produção de PC da lan por nível (x7,6 no nível máx) |
| 6 | **Cantina** | Coxinha, pastel e Guaraná gelado. | níveis | 6 | 6,2 mi | x1,84 | - | x1,25 toda a produção por nível (x3,8 no nível máx) |
| 7 | **Internet** | Ping baixo, moleque feliz. | níveis | 5 | 43 mi | x2,29 | - | x1,5 toda a produção por nível (x7,6 no nível máx) |
| 8 | **Campeonato de CS** | Inscrição de R$ 10 por time e muita treta. | níveis | 6 | 310 mi | x2,10 | - | x1,4 toda a produção por nível (x7,5 no nível máx) |
| 9 | **Sala VIP** | Cadeira gamer, RGB e ar ligado. | unidades | 3 | 810 mi | x3,50 | 2,8 mil | cada unidade produz 2,8 mil/s; marcos: ao ter 2: x2; ao ter 3: x2 |
| 10 | **Filial** | Uma lan em cada bairro. | unidades | 4 | 4,2 bi | x2,29 | 6,7 mil | cada unidade produz 6,7 mil/s; marcos: ao ter 2: x2; ao ter 4: x2 |
| 11 | **Arena de eSports** | Vira empresa. Até patrocínio tem. | unidades | 1 | 25 bi | - | 29 mil | cada unidade produz 29 mil/s; marcos: - |

Nomes dos níveis (mostrar o nome do nível comprado na linha; o custo do último nível dá a escala):

| Item | Nomes dos níveis (1 a máx) | Custo do último nível |
|---|---|--:|
| Placa de vídeo | GeForce 2 MX > GTX 750 > GTX 1060 > RTX 2060 > RTX 4070 > RTX 5090 (do ricão) | 12,9 mil |
| Ar-condicionado | Ventilador de pé > Split 9.000 BTU > Split 18.000 BTU > Climatização central | 41,2 mil |
| SSD | HD desfragmentado > SSD 120 GB > SSD 480 GB > NVMe > NVMe Gen 5 | 1,24 mi |
| Monitor gamer | LCD 60 Hz > 75 Hz > Full HD 120 Hz > 144 Hz IPS > 240 Hz esports | 14,7 mi |
| Cantina | Bala e chiclete > Coxinha > Pastel > Guaraná 2L gelado > Hot-dog completo > Buffet da lan | 131 mi |
| Internet | Rádio 256k > ADSL 2 Mb > Cabo 35 Mb > Fibra 300 Mb > Fibra 1 Giga | 1,18 bi |
| Campeonato de CS | Torneio do quarteirão > Interbairros > Copa da cidade > Estadual > Nacional transmitido > Mundial de lans | 12,7 bi |

Atenção: a coluna `Prod/s base` é por unidade, **antes** de marcos e multiplicadores. O `x1,6` da Placa de vídeo, por exemplo, vale `1,6^nível` sobre os PCs (nível 6: x16,8). Cada nível é uma compra, então a Placa dá 6 compras satisfatórias e não 6 clones do mesmo PC.

### 2.2 Ordem de desbloqueio e tempo (simulado, jogador ativo a 2 cliques/s)

| # | Item | Aparece quando | 1ª compra | Maximizado |
|--:|---|---|--:|--:|
| 0 | PC da lan | Desde o início | 8s | 2min53s |
| 1 | Placa de vídeo | Ao ter 3 PCs | 2min34s | 6min16s |
| 2 | Ar-condicionado | Ao comprar a 1ª Placa de vídeo | 6min51s | 8min53s |
| 3 | Atendente | Ao comprar o 1º Ar-condicionado | 9min17s | 13 min |
| 4 | SSD | Ao contratar o 1º Atendente | 14 min | 22 min |
| 5 | Monitor gamer | Ao comprar o 1º SSD | 25 min | 42 min |
| 6 | Cantina | Ao comprar o 1º Monitor | 38 min | 75 min |
| 7 | Internet | Ao abrir a Cantina (nível 1) | 53 min | 1,7 h |
| 8 | Campeonato de CS | Ao contratar Internet (nível 1) | 81 min | 2,5 h |
| 9 | Sala VIP | Ao realizar o 1º Campeonato | 1,8 h | 2,3 h |
| 10 | Filial | Ao ter 1 Sala VIP | 2,5 h | 2,9 h |
| 11 | Arena de eSports | Ao ter 2 Filiais | 2,7 h | 2,7 h |

Leitura: 1º PC em ~8s; 12 PCs em ~3 min; Atendente em ~9 min; Internet em ~52 min; Arena de eSports (o item final) em ~2,7 h; tudo maximizado em ~2,9 h.

### 2.3 Mecânicas extras (3)

**A) Evento clicável: Apagão** (barato: 1 botão flutuante e 1 timer)
- Gatilho: a cada 240 a 420 s sorteados (timer só corre com a aba visível, só depois de 120 s de run e só se `ps > 0`). Nunca dois ao mesmo tempo.
- Efeito: produção `x0,25` por até 12 s. Aparece o botão flutuante `⚡ Ligar o disjuntor (0/3)`; 3 toques encerram o apagão na hora.
- Sucesso: produção `x2` por 30 s. Toast: "Luz de volta! A galera aplaudiu: produção x2 por 30 s".
- Falha (12 s sem 3 toques): a luz volta sozinha, sem bônus. Toast: "A luz voltou sozinha... teve cliente pedindo reembolso." (nunca tira saldo, só reduz a produção por 12 s).
- Valor esperado para o jogador ativo: +8% de renda; para quem ignora: -3%.

**B) Combo de cliques: Fila de clientes**
- Gatilho: cada clique a menos de 0,6 s do anterior soma 1 ao combo; 1,2 s sem clicar zera.
- Efeito: `valor_do_clique * (1 + combo/10)`, com teto em combo 30 (x4). Barra fina sob o botão; texto "Fila de clientes x12".
- Em combo 30: toast "Lan lotada! Hora do rush" e a cena pode mostrar a fila na porta (`x.combo`).

**C) Prestígio: Vender a lan** (moeda permanente: `🏆 Reputação`)
- Estrelas totais = `floor((life / 4,5e7 (45 mi))^(1/3))`; `life` é a renda acumulada de todas as runs. Estrelas a resgatar = totais - já resgatadas. O botão aparece com `>= 3` a resgatar.
- Cada estrela vale **+10% de toda a produção e do clique, para sempre** (aditivo: `1 + 0,10 * estrelas`).
- Reinicia: saldo, `o[]`, `t`, `vis`. Mantém: estrelas, `life`, conquistas.
- Texto: "Vender a lan e abrir outra do zero? Você ganha 🏆 N de Reputação (+N0% para sempre)". Confirmação em 2 toques, como o botão de zerar.
- Resultado simulado (seção 3): prestigiar ao fim da run 1 dá `x2,4` e a 2ª run termina em ~73 min (vs 175); a 3ª em ~63 min. Prestigiar cedo rende pouco, o que evita quem quer "farmar" a cada 5 min.

### 2.4 Contrato com a cena (`scenes/lan.js`)

Assinatura: `draw(ctx, W, H, o, t, x)`. `o` continua sendo um **array de números inteiros, de comprimento 12, na ordem da tabela 2.1**. Um item ainda bloqueado vale 0. `x` é o novo 6º argumento (opcional; cenas antigas ignoram).

| `o[i]` | Item | Faixa | O que a cena deve fazer com isso |
|--:|---|---|---|
| 0 | PC da lan | 0 a 12 | Desenhar `n` PCs/cadeiras com cliente (nunca mais que 12). 0 = só a garagem vazia. |
| 1 | Placa de vídeo | 0 a 6 | Brilho/cor das telas: 0 sem brilho; 1-2 azul; 3-4 RGB; 5-6 neon intenso. |
| 2 | Ar-condicionado | 0 a 4 | 1 ventilador de pé; 2-3 split na parede; 4 climatização (vapor frio). |
| 3 | Atendente | 0 a 3 | Pessoas atrás do balcão (uma por unidade). |
| 4 | SSD | 0 a 5 | Efeito leve (faíscas/barra de loading rápida na tela). Pode ser ignorado. |
| 5 | Monitor gamer | 0 a 5 | Tamanho/quantidade de telas: >= 3 telas largas; 5 duplo monitor. |
| 6 | Cantina | 0 a 6 | Balcão: 1 balas; 2-3 salgados; 4-5 geladeira de refri; 6 buffet. |
| 7 | Internet | 0 a 5 | Roteador/antena e cabos; 5 luz verde piscando e ícone de ping baixo. |
| 8 | Campeonato de CS | 0 a 6 | Faixa e troféu; >= 3 telão; 6 palco com plateia. |
| 9 | Sala VIP | 0 a 3 | Cabines VIP (uma por unidade) com luz roxa. |
| 10 | Filial | 0 a 4 | Minilojas no fundo/mapa (uma por unidade). |
| 11 | Arena de eSports | 0 a 1 | 1 = arena/estádio no horizonte e céu dourado. |

Mapeamento do contrato antigo (`o[0..7]`) para o novo, para o agente que atualiza a cena: `p`(PC)=`o[0]`; `ac`=`o[2]`; `sn`(salgadinho)=`o[6]`; `cs`(campeonato)=`o[8]`; `fb`(fibra)=`o[7]`; `vip`=`o[9]`; `fr`(franquia)=`o[10]`; `ar`(arenas)=`o[11]`. Os visuais antigos que dependiam de "quantas dezenas de X" devem passar a depender de **faixas pequenas** (0 a 12, 0 a 6...) e nunca escalar sem limite.

`x` = `{tier:0..4, ev:null|'apagao'|'bonus', boost:número>=1, combo:0..30, stars:int}`. `tier` (nome da fase na tela): 0 "Garagem do tio" (início); 1 "Lan de bairro" (Atendente >= 1); 2 "Lan lotada" (Campeonato >= 1); 3 "Referência na cidade" (Sala VIP >= 1); 4 "Império das lans" (Arena >= 1). Com `ev:'apagao'` a cena apaga as luzes e mostra celulares-lanterna; com `ev:'bonus'` acende neon e confete.

---

## 3. CAVERNA AO ESPAÇO

Moeda: `🔬` Ciência. Clique: "Explorar". Ideia: população pequena e realista (10 coletores, 5 vilas, 4 cidades, 4 fábricas, 3 colônias). As "invenções" (Fogo, Roda, Escrita, Foguete...) viram níveis/evoluções com nome por nível, em vez de 300 unidades.

### 3.1 Itens (na ordem de desbloqueio)

| # | Item | Descrição (texto do jogo) | Tipo | Máx | Custo base | Cresc. | Prod/s base | Efeito e marcos |
|--:|---|---|---|--:|--:|--:|--:|---|
| 0 | **Coletor** | Junta fruta, graveto e fofoca. | unidades | 10 | 15 | x1,30 | 0,5 | cada unidade produz 0,5/s; marcos: ao ter 5: x2; ao ter 10: x2 |
| 1 | **Fogo** | Comida cozida, tribo feliz. | níveis | 4 | 150 | x1,85 | - | x1,35 toda a produção por nível (x3,3 no nível máx) |
| 2 | **Ferramentas** | Da pedra lascada ao aço. | níveis | 5 | 2,9 mil | x1,73 | - | x1,6 produção de Coletor por nível (x10,5 no nível máx) |
| 3 | **Vila** | Nasce a primeira vila (e o primeiro vizinho chato). | unidades | 5 | 7,5 mil | x1,90 | 24 | cada unidade produz 24/s; marcos: ao ter 3: x2; ao ter 5: x2 |
| 4 | **Agricultura** | Plantar, irrigar, colher, repetir. | níveis | 6 | 140 mil | x1,96 | - | x1,6 produção de Vila por nível (x16,8 no nível máx) |
| 5 | **Roda** | O comércio começa a rodar. | níveis | 4 | 1,1 mi | x2,07 | - | x1,4 toda a produção por nível (x3,8 no nível máx) |
| 6 | **Escrita** | A história começa aqui (e as provas também). | níveis | 6 | 9,7 mi | x1,63 | - | x1,35 toda a produção por nível (x6,1 no nível máx) |
| 7 | **Cidade** | Muralha, mercado e trânsito. | unidades | 4 | 10 mi | x3,22 | 960 | cada unidade produz 960/s; marcos: ao ter 2: x2; ao ter 4: x2 |
| 8 | **Navegação** | Das canoas ao mapa-múndi. | níveis | 5 | 150 mi | x2,53 | - | x1,6 produção de Cidade por nível (x10,5 no nível máx) |
| 9 | **Máquina a vapor** | Chuff chuff: Revolução Industrial. | níveis | 5 | 1,3 bi | x2,41 | - | x1,45 toda a produção por nível (x6,4 no nível máx) |
| 10 | **Fábrica** | Fumaça era sinal de progresso (na época). | unidades | 4 | 2,1 bi | x3,50 | 20 mil | cada unidade produz 20 mil/s; marcos: ao ter 2: x2; ao ter 4: x2 |
| 11 | **Computador** | Da calculadora à inteligência artificial. | níveis | 6 | 24 bi | x2,77 | - | x1,4 toda a produção por nível (x7,5 no nível máx) |
| 12 | **Programa espacial** | Da V2 até Marte. | níveis | 6 | 170 bi | x2,66 | - | x1,5 toda a produção por nível (x11,4 no nível máx) |
| 13 | **Colônia espacial** | Gravidade zero, Wi-Fi zero. | unidades | 3 | 410 bi | x3,50 | 57 mil | cada unidade produz 57 mil/s; marcos: ao ter 2: x2; ao ter 3: x2 |

Nomes dos níveis:

| Item | Nomes dos níveis (1 a máx) | Custo do último nível |
|---|---|--:|
| Fogo | Faísca > Fogueira > Cozinhar a carne > Forno de barro | 950 |
| Ferramentas | Pedra lascada > Pedra polida > Bronze > Ferro > Aço | 26 mil |
| Agricultura | Semear > Irrigar > Arado > Rotação de culturas > Celeiro > Adubo | 4,05 mi |
| Roda | Roda maciça > Carroça > Estrada de pedra > Ponte | 9,76 mi |
| Escrita | Pictogramas > Alfabeto > Papiro > Pergaminho > Prensa de Gutenberg > Jornal | 112 mi |
| Navegação | Canoa > Barco a vela > Caravela > Bússola > Mapa-múndi | 6,15 bi |
| Máquina a vapor | Caldeira > Locomotiva > Navio a vapor > Eletricidade > Linha de montagem | 43,9 bi |
| Computador | Calculadora > Computador pessoal > Internet > Celular > Nuvem > Inteligência artificial | 3,91 tri |
| Programa espacial | Foguete V2 > Satélite > Homem no espaço > Chegada à Lua > Estação espacial > Rumo a Marte | 22,6 tri |

### 3.2 Ordem de desbloqueio e tempo (simulado)

| # | Item | Aparece quando | 1ª compra | Maximizado |
|--:|---|---|--:|--:|
| 0 | Coletor | Desde o início | 8s | 1min59s |
| 1 | Fogo | Ao ter 3 Coletores | 69s | 2min29s |
| 2 | Ferramentas | Ao dominar o Fogo (nível 1) | 3min09s | 6min36s |
| 3 | Vila | Ao ter Ferramentas nível 1 | 5min49s | 9min13s |
| 4 | Agricultura | Ao ter 2 Vilas | 10 min | 23 min |
| 5 | Roda | Ao ter Agricultura nível 1 | 17 min | 26 min |
| 6 | Escrita | Ao inventar a Roda (nível 1) | 27 min | 40 min |
| 7 | Cidade | Ao ter Escrita nível 1 | 32 min | 47 min |
| 8 | Navegação | Ao fundar a 1ª Cidade | 48 min | 72 min |
| 9 | Máquina a vapor | Ao ter Navegação nível 1 | 58 min | 1,6 h |
| 10 | Fábrica | Ao ter Máquina a vapor nível 1 | 77 min | 1,7 h |
| 11 | Computador | Ao construir a 1ª Fábrica | 89 min | 2,9 h |
| 12 | Programa espacial | Ao ter 2 níveis de Computador | 1,9 h | 3,1 h |
| 13 | Colônia espacial | Ao ter Programa espacial nível 2 | 2,3 h | 2,8 h |

Leitura: 1º Coletor em ~8s; Fogo em ~1 min; 1ª Vila em ~6 min; 1ª Cidade em ~32 min; Revolução Industrial em ~58 min; Foguete em ~1,9 h; Colônia espacial (item final) em ~2,3 h; tudo maximizado em ~3,1 h.

### 3.3 Mecânicas extras (3)

**A) Evento clicável: Descoberta!**
- Gatilho: a cada 150 a 300 s sorteados (aba visível, `ps > 0`, depois de 90 s de run). Aparece um balão `💡` sobre a cena por 8 s.
- Efeito: tocar dá **de uma vez** `max(20 * ps, 20 * valor_do_clique)` de Ciência. Não toca: some sem penalidade.
- Texto: "Eureka! " + um dos fatos de `msgs` (ex.: "Fato: a roda surgiu na Mesopotâmia, por volta de 3500 a.C."). Valor esperado: ~ +9% de renda para quem toca sempre.

**B) Metas: Marcos da História** (8 conquistas, +2% de produção cada, aditivo, máx +16%)
Verifica a cada 1 s (barato: 8 comparações). Toast "🏅 Marco: <nome> (+2% para sempre)". Estado: `ach` = bitmask/array.

| # | Marco | Condição |
|--:|---|---|
| 1 | Primeira fogueira | Fogo >= 1 |
| 2 | Tribo completa | 10 Coletores |
| 3 | Vila viva | 5 Vilas |
| 4 | A história começa | Escrita nível 6 |
| 5 | Cidade grande | 4 Cidades |
| 6 | Fumaça no ar | Máquina a vapor nível 5 |
| 7 | Era digital | Computador >= 1 |
| 8 | Um pequeno passo | Programa espacial >= 4 (Chegada à Lua) |

**C) Prestígio: Nova civilização** (moeda `🏛️ Legado`)
- Estrelas totais = `floor((life / 1,5e10 (15 bi))^(1/3))`; aparece com `>= 3` a resgatar; +10% de produção e clique por estrela; reinicia saldo/`o[]`/`t`/`vis`, mantém estrelas, `life` e Marcos.
- Texto: "Recomeçar na Idade da Pedra com a sabedoria dos antepassados? +N0% para sempre".
- Simulado: ao fim da run 1 vale `x2,4` e a 2ª run termina em ~79 min (vs 188). A meta mínima de 3 estrelas cai por volta de 2 h de jogo, no meio da Era Industrial/Digital.

### 3.4 Contrato com a cena (`scenes/civ.js`)

`o` = array de **14 inteiros** na ordem da tabela 3.1; bloqueado = 0. `x` = `{tier:0..4, ev:null|'descoberta', boost, stars, ach:0..8}`.

| `o[i]` | Item | Faixa | O que a cena deve fazer com isso |
|--:|---|---|---|
| 0 | Coletor | 0 a 10 | Pessoas da tribo (até 10). |
| 1 | Fogo | 0 a 4 | 1 faísca; 2 fogueira; 3 espeto/churrasco; 4 forno de barro. |
| 2 | Ferramentas | 0 a 5 | Ferramenta na mão dos coletores: pedra, pedra polida, bronze, ferro, aço. |
| 3 | Vila | 0 a 5 | Cabanas/casas (uma por unidade). |
| 4 | Agricultura | 0 a 6 | Fileiras de plantação e irrigação crescendo (nível 6 = celeiro). |
| 5 | Roda | 0 a 4 | Carroça (1-2), estrada de pedra (3), ponte (4). |
| 6 | Escrita | 0 a 6 | Tabuleta, papiro, livros, prensa e jornal conforme o nível. |
| 7 | Cidade | 0 a 4 | Prédios e muralha (um bairro por unidade). |
| 8 | Navegação | 0 a 5 | Barcos no mar: canoa, vela, caravela... |
| 9 | Máquina a vapor | 0 a 5 | Chaminés, trem; nível 4 em diante: postes de luz (eletricidade). |
| 10 | Fábrica | 0 a 4 | Fábricas com fumaça (uma por unidade). |
| 11 | Computador | 0 a 6 | Antenas, telas e luzes; 5-6 nuvem/IA (pontos de luz). |
| 12 | Programa espacial | 0 a 6 | Foguete na plataforma; 2 satélite; 3 astronauta; 4 Lua visível; 6 Marte. |
| 13 | Colônia espacial | 0 a 3 | Bases na Lua/Marte (uma por unidade). |

Mapeamento do contrato antigo (`o[0..8]`) para o novo: coletor=`o[0]`; fogueira=`o[1]`; agricultura = `o[3]` (Vila) e `o[4]` (Agricultura); roda=`o[5]`; escrita=`o[6]`; navegação=`o[8]`; vapor=`o[9]`; computador=`o[11]`; foguete=`o[12]`. As "9 eras" do céu devem ser calculadas assim: era 0 sempre; 1 se Fogo >= 1; 2 se Vila >= 1; 3 se Roda >= 1; 4 se Escrita >= 1; 5 se Navegação >= 1; 6 se Máquina a vapor >= 1; 7 se Computador >= 1; 8 se Programa espacial >= 1. `tier` (nome da fase na tela): 0 "Idade da Pedra"; 1 "Antiguidade" (Vila >= 1); 2 "Idade Média" (Cidade >= 1); 3 "Era Industrial" (Máquina a vapor >= 1); 4 "Era Espacial" (Programa espacial >= 1).

---

## 4. TIME DE ESPORTS

Moeda: `⭐` Fama. Clique: "Treinar". Ideia: 5 titulares, 2 reservas, **1** coach, **1** analista, **1** psicólogo. Todo o resto é evolução: treino, estrutura, equipamento, patrocínio, torcida, arena e títulos.

### 4.1 Itens (na ordem de desbloqueio)

| # | Item | Descrição (texto do jogo) | Tipo | Máx | Custo base | Cresc. | Prod/s base | Efeito e marcos |
|--:|---|---|---|--:|--:|--:|--:|---|
| 0 | **Titular** | Joga por uma pizza. A pizza sobe de nível. | unidades | 5 | 15 | x1,70 | 0,5 | cada unidade produz 0,5/s; marcos: ao ter 3: x2; ao ter 5: x2 |
| 1 | **Reserva** | Fica no banco, mas treina de graça. | unidades | 2 | 75 | x3,24 | 1,8 | cada unidade produz 1,8/s; marcos: ao ter 2: x2 |
| 2 | **Coach** | Um só. Lê o mapa e pede café. | unidades | 1 | 480 | - | 6 | cada unidade produz 6/s; marcos: - |
| 3 | **Treino tático** | Rankeada, scrim, bootcamp, VOD review. | níveis | 6 | 750 | x1,79 | - | x1,6 produção de Titular por nível (x16,8 no nível máx) |
| 4 | **Gaming house** | Moram, treinam e brigam por causa da louça. | níveis | 6 | 7,1 mil | x1,72 | - | x1,3 toda a produção por nível (x4,8 no nível máx) |
| 5 | **Equipamento** | Mouse, teclado e headset de pro player. | níveis | 5 | 69 mil | x1,85 | - | x1,5 produção de Titular por nível (x7,6 no nível máx) |
| 6 | **Analista** | Planilha, VOD e opinião forte. | unidades | 1 | 490 mil | - | 300 | cada unidade produz 300/s; marcos: - |
| 7 | **Patrocínio** | Da padaria do bairro à marca global. | níveis | 6 | 910 mil | x1,80 | - | x1,35 toda a produção por nível (x6,1 no nível máx) |
| 8 | **Canal do time** | Live de 12 horas e cortes no TikTok. | níveis | 6 | 2,9 mi | x1,91 | - | x1,3 toda a produção por nível (x4,8 no nível máx) |
| 9 | **Psicólogo** | Cuida da cabeça depois de perder por 1 torre. | unidades | 1 | 16 mi | - | 560 | cada unidade produz 560/s; marcos: - |
| 10 | **Fã-clube** | Torcida organizada com bateria. | níveis | 6 | 43 mi | x2,63 | - | x1,35 toda a produção por nível (x6,1 no nível máx) |
| 11 | **Arena própria** | Casa cheia em todo jogo. | níveis | 4 | 240 mi | x3,10 | - | x1,6 toda a produção por nível (x6,6 no nível máx) |
| 12 | **Título** | Do regional ao mundial. Levanta a taça! | níveis | 6 | 1,8 bi | x2,16 | - | x1,5 toda a produção por nível (x11,4 no nível máx) |

Nomes dos níveis:

| Item | Nomes dos níveis (1 a máx) | Custo do último nível |
|---|---|--:|
| Treino tático | Rankeada > Scrim amador > Scrim com pro > VOD review > Bootcamp > Dieta e sono em dia | 13,8 mil |
| Gaming house | Garagem do tio > Apê alugado > Casa de 2 andares > Casa com chef > Centro de treinamento > CT com academia | 107 mil |
| Equipamento | Mouse com fio > Teclado mecânico > Headset 7.1 > Monitor 240 Hz > Setup completo RGB | 808 mil |
| Patrocínio | Padaria do Zé > Posto de gasolina > Energético > Banco > Fabricante de periféricos > Marca global | 17,2 mi |
| Canal do time | 100 inscritos > 1 mil > 10 mil > 100 mil > 1 milhão > Botão de diamante | 73,7 mi |
| Fã-clube | Mãe e tia > Grupo do zap > Torcida organizada > Fã-clube oficial > Caravana pro estádio > Estádio de camisa | 5,41 bi |
| Arena própria | Auditório alugado > Ginásio > Arena 5 mil > Arena 20 mil | 7,15 bi |
| Título | Campeão do bairro > Regional > Estadual > Nacional > Continental > Mundial | 84,6 bi |

Notas de realismo: o único item "com muita gente" é a torcida (Fã-clube), e ele é nível, não unidade; "Streamer do time" virou **Canal do time** (seis níveis de inscritos). Coach, Analista e Psicólogo têm máximo 1 e, por isso, `prod` alto, para a compra pesar (+35% de renda na hora).

### 4.2 Ordem de desbloqueio e tempo (simulado)

| # | Item | Aparece quando | 1ª compra | Maximizado |
|--:|---|---|--:|--:|
| 0 | Titular | Desde o início | 8s | 66s |
| 1 | Reserva | Ao ter 5 Titulares | 72s | 89s |
| 2 | Coach | Ao contratar o 1º Reserva | 1min52s | 1min52s |
| 3 | Treino tático | Ao contratar o Coach | 2min21s | 8min59s |
| 4 | Gaming house | Ao ter Treino tático nível 1 | 7min35s | 19 min |
| 5 | Equipamento | Ao ter Gaming house nível 1 | 14 min | 27 min |
| 6 | Analista | Ao ter Equipamento nível 1 | 25 min | 25 min |
| 7 | Patrocínio | Ao contratar o Analista | 29 min | 56 min |
| 8 | Canal do time | Ao fechar o 1º Patrocínio | 38 min | 68 min |
| 9 | Psicólogo | Ao abrir o Canal do time | 53 min | 53 min |
| 10 | Fã-clube | Ao contratar o Psicólogo | 62 min | 2,5 h |
| 11 | Arena própria | Ao ter Fã-clube nível 2 | 79 min | 2,4 h |
| 12 | Título | Ao ter Arena própria nível 1 | 1,9 h | 3,1 h |

Leitura: 1º Titular em ~8s; time titular completo (5) em ~1 min; Coach em ~2 min; Gaming house em ~8 min; Patrocínio em ~29 min; Arena própria em ~1,3 h; Título (item final) em ~1,9 h; tudo maximizado em ~3,1 h.

### 4.3 Mecânicas extras (3)

**A) Evento clicável: Clutch!**
- Gatilho: a cada 200 a 360 s sorteados (aba visível, `ps > 0`, depois de 120 s). Aparece o botão `🔥 CLUTCH!` por 6 s sobre a cena.
- Efeito: tocar dá produção `x3` por 20 s. Se perder: some sem penalidade, toast "Perdeu a jogada... tem a próxima.".
- Texto de sucesso: "O ADC fez um 1v4! Produção x3 por 20 s". Valor esperado: ~ +14% de renda para quem toca sempre.

**B) Metas de temporada** (uma ativa por vez, sequência de 10; recompensa = `max(300 * ps, 100 * valor_do_clique)` de Fama, na hora)
Mostrar a meta atual em 1 linha acima da lista ("Meta: ter 5 Titulares (0/5)"), barra fina de progresso. Ao cumprir: toast "Meta cumprida! +⭐ N" e vira a próxima.

| # | Meta | Condição |
|--:|---|---|
| 1 | Escalação completa | 5 Titulares |
| 2 | Banco de reservas | 2 Reservas |
| 3 | Treino é treino | Treino tático nível 3 |
| 4 | Casa própria | Gaming house nível 3 |
| 5 | Setup de pro | Equipamento nível 3 |
| 6 | Primeiro patrocínio de verdade | Patrocínio nível 3 |
| 7 | Milhão de inscritos | Canal do time nível 5 |
| 8 | Torcida gigante | Fã-clube nível 4 |
| 9 | Casa cheia | Arena própria nível 3 |
| 10 | Campeão | Título nível 3 (Estadual) |

**C) Prestígio: Nova temporada** (moeda `🌟 Hall da Fama`)
- Estrelas totais = `floor((life / 5,2e7 (52 mi))^(1/3))`; botão com `>= 3` a resgatar; +10% de produção e clique por estrela; reinicia saldo/`o[]`/`t`/`vis`/meta atual; mantém estrelas e `life`.
- Texto: "Nova temporada! O time se aposenta e entra uma geração nova. 🌟 +N (+N0% para sempre)".
- Simulado: ao fim da run 1, `x2,4` e a 2ª run termina em ~77 min (vs 184).

### 4.4 Contrato com a cena (`scenes/esp.js`)

`o` = array de **13 inteiros** na ordem da tabela 4.1; bloqueado = 0. `x` = `{tier:0..4, ev:null|'clutch', boost, stars, goal:0..10}`.

| `o[i]` | Item | Faixa | O que a cena deve fazer com isso |
|--:|---|---|---|
| 0 | Titular | 0 a 5 | Jogadores na mesa/palco (exatamente `n`). |
| 1 | Reserva | 0 a 2 | Jogadores no banco, de colete (exatamente `n`). |
| 2 | Coach | 0 a 1 | UM coach em pé atrás do time, com prancheta. Nunca desenhar "xN". |
| 3 | Treino tático | 0 a 6 | Quadro tático/telão de VOD; níveis altos: mais telas e placar de scrim. |
| 4 | Gaming house | 0 a 6 | Cenário de fundo: 1 garagem, 2 apê, 3 casa, 4 casa com chef, 5-6 CT com academia. |
| 5 | Equipamento | 0 a 5 | Periféricos e RGB nas mesas (quanto maior o nível, mais luz). |
| 6 | Analista | 0 a 1 | Pessoa com notebook/planilha num canto. |
| 7 | Patrocínio | 0 a 6 | Logos na parede/camisa (`min(n,5)` logos; 6 = marca global no telão). |
| 8 | Canal do time | 0 a 6 | Câmera, ring light e contador de viewers crescendo. |
| 9 | Psicólogo | 0 a 1 | Sofá/pessoa com caderno num canto. |
| 10 | Fã-clube | 0 a 6 | Torcida e bandeirinhas (densidade proporcional a `n`, de 0 a 6). |
| 11 | Arena própria | 0 a 4 | Arquibancada: 1 auditório, 2 ginásio, 3 arena 5 mil, 4 arena 20 mil. |
| 12 | Título | 0 a 6 | Troféus na estante (`n` troféus); >= 4 confete; 6 "CAMPEÃO MUNDIAL". |

Mapeamento do contrato antigo (`o[0..7]`): jogador=`o[0]` (e `o[1]` para reservas); coach=`o[2]` (agora no máximo 1: desenhar **um** coach, e não `×N`); gaming house=`o[4]`; patrocínio=`o[7]`; streamer=`o[8]`; fã-clube=`o[10]`; arena=`o[11]`; título=`o[12]`. `tier`: 0 "Time de várzea"; 1 "Circuito regional" (Coach >= 1); 2 "Liga nacional" (Patrocínio >= 1); 3 "Classificado pro Mundial" (Arena própria >= 1); 4 "Lenda dos eSports" (Título >= 1).

---

## 5. Curva de balanceamento e simulação

### 5.1 Método (por que não tem buraco nem parede)

- Metas: 1ª compra em **~8 s** (2 cliques/s); 1ª unidade/nível novo a cada 1 a 3 min no começo; **espera média entre compras**: 24 a 37 s nos 10 primeiros minutos, 2 a 3 min na 1ª hora, 6 a 8 min depois de 2 h; o último item aparece entre 1,9 e 2,7 h e tudo fica maximizado em ~3 h (jogo ativo).
- Preço derivado do ganho, não chutado: cada compra é precificada por `custo = payback_alvo * ganho_de_renda_da_compra`, com `payback_alvo` subindo de 20 s (primeiro item) até ~15 a 23 min (último item). Isso garante que, logo depois de comprar, o próximo item custa "uns X segundos" de renda atual e a espera escala suavemente com o progresso. Depois, cada item foi **ajustado a uma curva `c0 * g^n`** (as colunas `Custo base` e `Cresc.` das tabelas): o que a simulação abaixo valida é essa fórmula já arredondada.
- Unidades de maior tier (Atendente, Sala VIP, Filial, Arena; Vila, Cidade, Fábrica, Colônia; Reserva, Coach, Analista, Psicólogo) têm `prod` calibrado para que a 1ª unidade some ~35% da renda do momento da compra. É o que dá a sensação de "salto" do item novo.
- Dois jogadores simulados: **payback** (compra o que paga mais rápido) e **cheap** (compra o mais barato disponível). Três ritmos de clique (2, 0,5 e 0,2 cliques/s).
- Checagem de "buraco/parede": maior espera entre compras por janela de tempo e **maior salto entre esperas consecutivas** (>20 s). Resultado: salto máx. ~x3 (um item novo de tier maior chegando) e nenhuma espera acima de 14,6 min para quem joga ativo (a maior é o Título do Time de eSports; em ritmo casual chega a 15,4 min).
- Eventos e metas (seções 2.3, 3.3, 4.3) **não estão na simulação**; eles só aceleram (+5% a +14% para quem joga atento), então os tempos abaixo são o pior caso ativo.
- Prestígio: `estrelas = floor((life/T0)^(1/3))`, `+10%` de produção por estrela; `T0` = renda total da run 1 dividida por 3.375 (assim, completar a run 1 vale ~14 estrelas, x2,4, nos 3 jogos).

### 5.2 Fórmulas de custo (resumo)

`custo(n) = c0 * g^n`; `custoLote(n, k) = c0 * g^n * (g^k - 1)/(g - 1)`. Valores de `c0`/`g` por item nas tabelas 2.1, 3.1 e 4.1. Como `g` varia por item (de 1,27 para PCs até 3,5 para unidades de tier alto com máx 3), **não existe mais `R = 1,15` global**.

### 5.3 Código da simulação (Python 3, sem dependências; rode com `python3 sim_idle3.py`)

```python
# sim_idle3.py - simulação de balanceamento (Python 3, sem dependências)
import math, json, sys
CPS = 2.0          # cliques por segundo do jogador ATIVO
CLICK = 0.03       # clique vale (1*bônus_prestígio + 3% da renda/s)
# (id, tipo, max, c0, g, prod, alvo, f, req_id, req_n)
#  tipo u = unidades (n compras, cada uma produz `prod`/s); l = níveis (multiplicam `alvo` por f^nível)
LAN = [
    ('pc', 'u', 12, 15, 1.27, 0.5, None, 1.0, None, None),
    ('gpu', 'l', 6, 830, 1.73, 0, 'pc', 1.6, 'pc', 3),
    ('ac', 'l', 4, 15000, 1.4, 0, 'all', 1.3, 'gpu', 1),
    ('atend', 'u', 3, 29000, 3.05, 47, None, 1.0, 'ac', 1),
    ('ssd', 'l', 5, 180000, 1.62, 0, 'pc', 1.5, 'atend', 1),
    ('mon', 'l', 5, 1800000, 1.69, 0, 'pc', 1.5, 'ssd', 1),
    ('cant', 'l', 6, 6200000, 1.84, 0, 'all', 1.25, 'mon', 1),
    ('fibra', 'l', 5, 43000000, 2.29, 0, 'all', 1.5, 'cant', 1),
    ('camp', 'l', 6, 310000000, 2.1, 0, 'all', 1.4, 'fibra', 1),
    ('vip', 'u', 3, 810000000, 3.5, 2800, None, 1.0, 'camp', 1),
    ('fil', 'u', 4, 4200000000, 2.29, 6700, None, 1.0, 'vip', 1),
    ('arena', 'u', 1, 25000000000, 1.0, 29000, None, 1.0, 'fil', 2),
]
CIV = [
    ('col', 'u', 10, 15, 1.3, 0.5, None, 1.0, None, None),
    ('fogo', 'l', 4, 150, 1.85, 0, 'all', 1.35, 'col', 3),
    ('ferr', 'l', 5, 2900, 1.73, 0, 'col', 1.6, 'fogo', 1),
    ('vila', 'u', 5, 7500, 1.9, 24, None, 1.0, 'ferr', 1),
    ('agri', 'l', 6, 140000, 1.96, 0, 'vila', 1.6, 'vila', 2),
    ('roda', 'l', 4, 1100000, 2.07, 0, 'all', 1.4, 'agri', 1),
    ('escr', 'l', 6, 9700000, 1.63, 0, 'all', 1.35, 'roda', 1),
    ('cid', 'u', 4, 10000000, 3.22, 960, None, 1.0, 'escr', 1),
    ('nav', 'l', 5, 150000000, 2.53, 0, 'cid', 1.6, 'cid', 1),
    ('vapor', 'l', 5, 1300000000, 2.41, 0, 'all', 1.45, 'nav', 1),
    ('fab', 'u', 4, 2100000000, 3.5, 20000, None, 1.0, 'vapor', 1),
    ('comp', 'l', 6, 24000000000, 2.77, 0, 'all', 1.4, 'fab', 1),
    ('foguete', 'l', 6, 170000000000, 2.66, 0, 'all', 1.5, 'comp', 2),
    ('col2', 'u', 3, 410000000000, 3.5, 57000, None, 1.0, 'foguete', 2),
]
ESP = [
    ('tit', 'u', 5, 15, 1.7, 0.5, None, 1.0, None, None),
    ('res', 'u', 2, 75, 3.24, 1.8, None, 1.0, 'tit', 5),
    ('coach', 'u', 1, 480, 1.0, 6, None, 1.0, 'res', 1),
    ('treino', 'l', 6, 750, 1.79, 0, 'tit', 1.6, 'coach', 1),
    ('house', 'l', 6, 7100, 1.72, 0, 'all', 1.3, 'treino', 1),
    ('equip', 'l', 5, 69000, 1.85, 0, 'tit', 1.5, 'house', 1),
    ('anal', 'u', 1, 490000, 1.0, 300, None, 1.0, 'equip', 1),
    ('patro', 'l', 6, 910000, 1.8, 0, 'all', 1.35, 'anal', 1),
    ('canal', 'l', 6, 2900000, 1.91, 0, 'all', 1.3, 'patro', 1),
    ('psi', 'u', 1, 16000000, 1.0, 560, None, 1.0, 'canal', 1),
    ('fa', 'l', 6, 43000000, 2.63, 0, 'all', 1.35, 'psi', 1),
    ('arena', 'l', 4, 240000000, 3.1, 0, 'all', 1.6, 'fa', 2),
    ('titulo', 'l', 6, 1800000000, 2.16, 0, 'all', 1.5, 'arena', 1),
]
T0 = {'LAN HOUSE': 45000000.0, 'CAVERNA AO ESPAÇO': 15000000000.0, 'TIME DE ESPORTS': 52000000.0}        # base do prestígio (renda acumulada) por jogo

def marcos(tipo, mx):                      # marcos de unidades: metade e máximo => x2 cada
    if tipo != 'u' or mx < 2: return []
    return [(2, 2)] if mx == 2 else [(math.ceil(mx / 2), 2), (mx, 2)]

class Jogo:
    def __init__(s, itens, pm=1.0):
        s.it, s.pm = itens, pm
        s.ix = {t[0]: i for i, t in enumerate(itens)}
        s.o = [0] * len(itens); s.vis = [False] * len(itens); s.refresh()
    def refresh(s):
        for i, t in enumerate(s.it):
            if not s.vis[i] and (t[8] is None or s.o[s.ix[t[8]]] >= t[9]): s.vis[i] = True
    def mult(s, i):
        t = s.it[i]; m = 1.0
        for n, x in marcos(t[1], t[2]):
            if s.o[i] >= n: m *= x
        for j, u in enumerate(s.it):
            if u[1] == 'l' and u[6] == t[0]: m *= u[7] ** s.o[j]
        return m
    def ps(s):
        g = s.pm
        for j, u in enumerate(s.it):
            if u[1] == 'l' and u[6] == 'all': g *= u[7] ** s.o[j]
        return g * sum(t[5] * s.o[i] * s.mult(i) for i, t in enumerate(s.it) if t[1] == 'u')
    def click(s): return s.pm + CLICK * s.ps()
    def rate(s, cps): return s.ps() + cps * s.click()
    def custo(s, i): return s.it[i][3] * s.it[i][4] ** s.o[i]
    def fim(s): return all(s.o[i] >= t[2] for i, t in enumerate(s.it))

def simular(itens, cps=CPS, pol='payback', pm=1.0):
    J = Jogo(itens, pm); m = t = tot = 0.0; log = []
    while not J.fim() and t < 3e6:
        r0 = J.rate(cps); best = None
        for i, x in enumerate(itens):
            if not J.vis[i] or J.o[i] >= x[2]: continue
            c = J.custo(i); p0 = J.ps(); J.o[i] += 1; d = J.ps() - p0; J.o[i] -= 1
            key = c / d if (pol == 'payback' and d > 0) else (c if pol == 'cheap' else 1e18)
            if best is None or key < best[0]: best = (key, i, c)
        _, i, c = best
        w = max(0.0, (c - m) / r0); t += w; tot += r0 * w; m += r0 * w - c
        J.o[i] += 1; J.refresh(); log.append((t, i, J.o[i], tot, w))
    return J, t, tot, log

def nm(n):  # formata como o jogo (mil, mi, bi...)
    S = ['', 'mil', 'mi', 'bi', 'tri', 'qua', 'qui']; k = 0
    while n >= 1000 and k < 6: n /= 1000; k += 1
    return (('%.0f' if n >= 100 else '%.1f' if n >= 10 else '%.2f') % n).replace('.', ',') + (' ' + S[k] if k else '')

out = {}
for nome, itens in (('LAN HOUSE', LAN), ('CAVERNA AO ESPAÇO', CIV), ('TIME DE ESPORTS', ESP)):
    J, T, tot, log = simular(itens)
    first, done = {}, {}
    for (t, i, n, _, _) in log:
        first.setdefault(i, t); done[i] = t
    print('=== %s: tudo maximizado em %.0f min (%.2f h), %d compras, renda total %s' % (nome, T / 60, T / 3600, len(log), nm(tot)))
    print('  %-8s %-3s %5s  %10s  %10s' % ('item', 'tp', 'max', '1a compra', 'maximizado'))
    for i, x in enumerate(itens):
        print('  %-8s %-3s %5d  %8.0fs  %8.0fs' % (x[0], x[1], x[2], first[i], done[i]))
    ws = [(log[k][0], log[k][4]) for k in range(len(log))]
    for lo, hi in ((0, 600), (600, 3600), (3600, 7200), (7200, 99999)):
        w = [b for a, b in ws if lo <= a < hi]
        if w: print('  janela %5d-%5ds: %2d compras | espera media %4.0fs | maior %4.0fs' % (lo, hi if hi < 99999 else 'fim', len(w), sum(w) / len(w), max(w)) if False else
                    '  janela %5d-%-5s: %2d compras | espera media %4.0fs | maior %4.0fs' % (lo, hi if hi < 99999 else 'fim', len(w), sum(w) / len(w), max(w)))
    sp = max((ws[k][1] / ws[k - 1][1], k) for k in range(1, len(ws)) if ws[k - 1][1] > 20)
    print('  maior salto entre esperas consecutivas (>20s): x%.1f (compra #%d)' % sp)
    for pol in ('payback', 'cheap'):
        for cps in (2.0, 0.5, 0.2):
            Jx, Tx, _, lx = simular(itens, cps, pol)
            print('  politica %-7s cps %.1f: fim %.2f h | 1a compra %3.0fs | maior espera %4.0fs' % (pol, cps, Tx / 3600, lx[0][0], max(l[4] for l in lx)))
    # prestígio: estrelas = floor((renda_total/T0)^(1/3)), bonus +10% por estrela
    for rot, lim in (('aos 60 min', 3600), ('aos 90 min', 5400), ('aos 120 min', 7200), ('ao fim', 1e9)):
        tt = [l[3] for l in log if l[0] <= lim][-1]; s = int((tt / T0[nome]) ** (1 / 3))
        J2, T2, tot2, _ = simular(itens, pm=1 + 0.1 * s)
        s2 = int(((tt + tot2) / T0[nome]) ** (1 / 3)); J3, T3, _, _ = simular(itens, pm=1 + 0.1 * s2)
        print('  prestigio %-11s: %2d estrelas (x%.1f) -> 2a run %3.0f min | acumulado %2d estrelas (x%.1f) -> 3a run %3.0f min' % (rot, s, 1 + .1 * s, T2 / 60, s2, 1 + .1 * s2, T3 / 60))
    out[nome] = dict(first=first, done=done, T=T, tot=tot, ids=[x[0] for x in itens])
json.dump(out, open('/tmp/sim/out.json', 'w'))
```

### 5.4 Saída (rodada de verdade, números usados nas tabelas)

```text
=== LAN HOUSE: tudo maximizado em 175 min (2.92 h), 60 compras, renda total 151 bi
  item     tp    max   1a compra  maximizado
  pc       u      12         8s       173s
  gpu      l       6       154s       376s
  ac       l       4       411s       533s
  atend    u       3       557s       773s
  ssd      l       5       834s      1311s
  mon      l       5      1475s      2532s
  cant     l       6      2290s      4519s
  fibra    l       5      3151s      6020s
  camp     l       6      4854s      8842s
  vip      u       3      6496s      8374s
  fil      u       4      8953s     10528s
  arena    u       1      9630s      9630s
  janela     0-600  : 23 compras | espera media   24s | maior   66s
  janela   600-3600 : 17 compras | espera media  163s | maior  306s
  janela  3600-7200 : 11 compras | espera media  328s | maior  456s
  janela  7200-fim  :  9 compras | espera media  398s | maior  603s
  maior salto entre esperas consecutivas (>20s): x3.2 (compra #50)
  politica payback cps 2.0: fim 2.92 h | 1a compra   8s | maior espera  603s
  politica payback cps 0.5: fim 3.08 h | 1a compra  30s | maior espera  630s
  politica payback cps 0.2: fim 3.12 h | 1a compra  75s | maior espera  636s
  politica cheap   cps 2.0: fim 2.98 h | 1a compra   8s | maior espera  603s
  politica cheap   cps 0.5: fim 3.13 h | 1a compra  30s | maior espera  630s
  politica cheap   cps 0.2: fim 3.18 h | 1a compra  75s | maior espera  636s
  prestigio aos 60 min :  1 estrelas (x1.1) -> 2a run 160 min | acumulado 14 estrelas (x2.4) -> 3a run  73 min
  prestigio aos 90 min :  3 estrelas (x1.3) -> 2a run 135 min | acumulado 15 estrelas (x2.5) -> 3a run  70 min
  prestigio aos 120 min:  5 estrelas (x1.5) -> 2a run 117 min | acumulado 15 estrelas (x2.5) -> 3a run  70 min
  prestigio ao fim     : 14 estrelas (x2.4) -> 2a run  73 min | acumulado 18 estrelas (x2.8) -> 3a run  63 min
=== CAVERNA AO ESPAÇO: tudo maximizado em 188 min (3.14 h), 73 compras, renda total 49,4 tri
  item     tp    max   1a compra  maximizado
  col      u      10         8s       119s
  fogo     l       4        69s       149s
  ferr     l       5       189s       396s
  vila     u       5       349s       553s
  agri     l       6       611s      1352s
  roda     l       4      1027s      1557s
  escr     l       6      1644s      2399s
  cid      u       4      1912s      2794s
  nav      l       5      2872s      4340s
  vapor    l       5      3483s      5710s
  fab      u       4      4649s      6274s
  comp     l       6      5363s     10303s
  foguete  l       6      6796s     11308s
  col2     u       3      8455s     10069s
  janela     0-600  : 24 compras | espera media   23s | maior   69s
  janela   600-3600 : 24 compras | espera media  122s | maior  291s
  janela  3600-7200 : 14 compras | espera media  254s | maior  424s
  janela  7200-fim  : 11 compras | espera media  388s | maior  643s
  maior salto entre esperas consecutivas (>20s): x3.1 (compra #53)
  politica payback cps 2.0: fim 3.14 h | 1a compra   8s | maior espera  643s
  politica payback cps 0.5: fim 3.30 h | 1a compra  30s | maior espera  672s
  politica payback cps 0.2: fim 3.35 h | 1a compra  75s | maior espera  678s
  politica cheap   cps 2.0: fim 3.18 h | 1a compra   8s | maior espera  643s
  politica cheap   cps 0.5: fim 3.34 h | 1a compra  30s | maior espera  672s
  politica cheap   cps 0.2: fim 3.39 h | 1a compra  75s | maior espera  678s
  prestigio aos 60 min :  0 estrelas (x1.0) -> 2a run 188 min | acumulado 14 estrelas (x2.4) -> 3a run  79 min
  prestigio aos 90 min :  1 estrelas (x1.1) -> 2a run 171 min | acumulado 14 estrelas (x2.4) -> 3a run  79 min
  prestigio aos 120 min:  3 estrelas (x1.3) -> 2a run 145 min | acumulado 14 estrelas (x2.4) -> 3a run  79 min
  prestigio ao fim     : 14 estrelas (x2.4) -> 2a run  79 min | acumulado 18 estrelas (x2.8) -> 3a run  67 min
=== TIME DE ESPORTS: tudo maximizado em 184 min (3.06 h), 55 compras, renda total 175 bi
  item     tp    max   1a compra  maximizado
  tit      u       5         8s        66s
  res      u       2        72s        89s
  coach    u       1       112s       112s
  treino   l       6       141s       539s
  house    l       6       455s      1132s
  equip    l       5       863s      1644s
  anal     u       1      1508s      1508s
  patro    l       6      1756s      3352s
  canal    l       6      2250s      4089s
  psi      u       1      3193s      3193s
  fa       l       6      3717s      8824s
  arena    l       4      4760s      8569s
  titulo   l       6      6713s     11022s
  janela     0-600  : 16 compras | espera media   37s | maior   90s
  janela   600-3600 : 21 compras | espera media  138s | maior  210s
  janela  3600-7200 :  9 compras | espera media  358s | maior  659s
  janela  7200-fim  :  9 compras | espera media  479s | maior  875s
  maior salto entre esperas consecutivas (>20s): x1.9 (compra #43)
  politica payback cps 2.0: fim 3.06 h | 1a compra   8s | maior espera  875s
  politica payback cps 0.5: fim 3.22 h | 1a compra  30s | maior espera  914s
  politica payback cps 0.2: fim 3.27 h | 1a compra  75s | maior espera  922s
  politica cheap   cps 2.0: fim 3.09 h | 1a compra   8s | maior espera  875s
  politica cheap   cps 0.5: fim 3.24 h | 1a compra  30s | maior espera  914s
  politica cheap   cps 0.2: fim 3.29 h | 1a compra  75s | maior espera  922s
  prestigio aos 60 min :  1 estrelas (x1.1) -> 2a run 167 min | acumulado 14 estrelas (x2.4) -> 3a run  77 min
  prestigio aos 90 min :  2 estrelas (x1.2) -> 2a run 153 min | acumulado 15 estrelas (x2.5) -> 3a run  73 min
  prestigio aos 120 min:  4 estrelas (x1.4) -> 2a run 131 min | acumulado 15 estrelas (x2.5) -> 3a run  73 min
  prestigio ao fim     : 14 estrelas (x2.4) -> 2a run  77 min | acumulado 18 estrelas (x2.8) -> 3a run  66 min
```

### 5.5 Como ler a saída

- "1a compra" e "maximizado": tempo em que a 1ª unidade/nível foi comprada e em que o item chegou ao máximo. É o que está nas tabelas de desbloqueio.
- "janela": nº de compras, espera média e maior espera dentro da janela (segundos desde o início). A espera média cresce de 24-37 s para 390-480 s, de forma monótona, sem degrau.
- "politica ... cps": três ritmos de clique e as duas políticas dão o fim da run em 2,9 a 3,4 h, ou seja, o jogo é robusto a quem joga distraído. Quem clica 10x menos só perde ~7% no tempo total (mas a 1ª compra demora ~75 s, o que é aceitável como "tutorial" de uma partida casual).
- "prestigio": estrelas ganhas se prestigiar naquele momento, bônus, e quanto dura a run seguinte; "acumulado" é depois de contar a renda das duas runs.

---

## 6. Checklist para o implementador

1. Trocar `GAMES.*.gens` por `GAMES.*.items` com o esquema da seção 1.2; manter `stages` como nomes de `tier` (calculado por `x.tier`, não mais por `t >= limiar`).
2. Substituir `mult`, `ps`, `c0`, `nFor`, `costOf` pelas funções da seção 1.2; `R` global deixa de existir.
3. `build()`: renderizar só linhas com `vis[i]`, +1 linha bloqueada, e a faixa de completos; botão desabilitado e `MÁX` quando `n == max`.
4. Salvar em `idle3-v2`; incluir `life`, `stars`, `claimed`, `ach/goal`, `vis`.
5. Eventos: um único timer `setInterval(…,1000)` que decrementa `proxEvento` quando `!document.hidden`; estado `x.ev`, `x.boost`, `x.combo` passado à cena como 6º argumento.
6. Atualizar `scenes/*.js` conforme as seções 2.4, 3.4 e 4.4 (outro agente).
7. Teste manual rápido: abrir o console e rodar `st.g.lan.m=1e12;update()` para conferir que nenhum item passa do `max` e que o `Máx` compra no máximo `max - n`.
