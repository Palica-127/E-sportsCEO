# CONTENT.md — Mini Idle 3 em 1 (Lan House, Caverna ao Espaço, Time de eSports)

Tudo em pt-BR, pronto para colar. Nenhum outro arquivo foi alterado. Onde a cena (`scenes/*.js`) depende da ordem dos itens, isso está marcado como **[CENA]**.

---

## 0. Diagnóstico geral (vale para os 3 jogos)

1. **Todo item é "ilimitado e exponencial"** (`R=1.15`, bônus x2 a cada 25). Isso não serve para eSports (um "Coach" x40? um "Título mundial" comprável?) e distorce a Lan (200 PCs?). Falta o conceito de **unidade com limite** e de **nível**.
2. **Estágios não batem com os custos.** Ex.: civ mostra "Era Espacial" com 1e8 acumulados, mas o Foguete custa 5,1e9. No eSports "Classificado pro Mundial" aparece em 2e6, mas o Mundial custa 3,3e8. Aqui os limiares foram realinhados com o custo de cada item.
3. **Nome do estágio x nome da era na cena divergem** (civ: o painel diz "Antiguidade/Idade Média", o canvas diz "Domínio do Fogo/Idade da Roda"). Unifique usando os arrays deste arquivo.
4. **Só 6 mensagens por jogo** (pedido: 15+). Aqui há 20 por jogo. Sugestão: `say()` não repetir a mensagem anterior.
5. **Sem eventos e sem conquistas** no código. Abaixo há 10 a 12 eventos e 16 conquistas por jogo, com gramática simples (seção 0.2).
6. Valores em R$ (15 reais por PC?) são "gamificados". Mantive os números do jogo e coloquei os preços reais (R$ 2/hora, coxinha) só nos textos. Se quiser coerência total, troque o símbolo por "caixa" ou "pontos".

### 0.1 Extensão do formato `gens` (compatível com o código atual)
O código atual só lê as posições 0 a 3. As novas posições extras são ignoradas até você implementar.

```js
// [nome, descricao, custoBase, psPorUnidade, max, niveis, seq, R]
// max   : 0 = ilimitado; N = limite de unidades (botão vira "Máx." e desabilita)
// niveis: null ou 3 upgrades [[nome,desc],[nome,desc],[nome,desc]] (ver regra abaixo)
// seq   : null ou lista com o nome (ou [nome,desc]) de cada compra, na ordem. Mostrar "Próximo: ..."
// R     : taxa de crescimento de custo do item (padrão 1.15)
const NV_CUSTO = [30, 300, 3000];   // custo do nível k = custoBase * NV_CUSTO[k]
const NV_MULT  = [2, 2, 3];         // multiplicam a produção DO ITEM (acumulado x12)
const NV_REQ_CAP = [0.4, 0.7, 1];   // fração do max necessária (itens com limite)
const NV_REQ_INF = [10, 25, 50];    // unidades necessárias (itens sem limite)
// Itens "nível" (gaming house, fã-clube, link de internet) usam seq com um nome por nível e up=null.
// O bônus x2 a cada 25 só vale para itens com max=0.
```

### 0.2 Gramática de eventos e conquistas

```js
// CONDIÇÃO c: ["own", idxItem, n] posse >= n | ["maxed", idxItem] posse = max
//            ["ps", n] produção/s >= n | ["tot", n] total acumulado >= n
//            ["click", n] cliques >= n (precisa de st.g[k].c++ no clique)
//            ["stage", idx] estágio atual >= idx | ["ev", n] eventos vistos >= n
// EVENTO: {id,t,x,p,min,e,esc,mit}
//   p   = peso de sorteio | min = total acumulado mínimo para aparecer
//   e   = efeito: {bal:-0.1} (% do saldo atual; negativo perde) | {sec:60} (segundos de produção;
//         negativo = perde) | {mult:0.5,dur:30} (multiplicador de produção por dur segundos)
//   esc = escolhas opcionais [{b:"botão", e:{...}}]; sem esc, só um "Ok"
//   mit = mitigação ["own", idx, n, fator]: se tiver, o efeito negativo é multiplicado por fator
// Sugestão: sortear um evento a cada 90-180 s, com toast/modal e botões.
```

---

# 1. LAN HOUSE

## 1.1 O que não faz sentido hoje
- **"PC Pentium"**: Pentium é de 1993. A lan de CS 1.6 (lançado em 2003) era de **Celeron e Pentium 4**, monitor de tubo. "30 fps" é ok, é piada de lan.
- **"Fibra óptica"**: nos anos 2000 era ADSL, cabo e link de rádio. Fibra só popularizou nos anos 2010. Virou **"Link de internet"** em níveis: ADSL, cabo e fibra. **[CENA]** o letreiro "FIBRA 100M/500M/1G" pode virar a tabela `LINKS` abaixo.
- **"Cadeira gamer e RGB"** é coisa de 2015 em diante. A Sala VIP dos anos 2000 era PC melhor, cadeira com encosto e ar só para você.
- **"Inscrição R$10 por time"** é barato demais. Era comum R$ 5 a 10 **por jogador** (R$ 25 a 50 por time).
- **Preço da hora**: o letreiro "R$ 2 / hora" está ok. Faixa real era R$ 1,50 a 3,00. Pacotes de 5 horas eram comuns.
- Faltam ficha/caderninho, fiado, mãe buscando, pen drive, MSN e Orkut (o Orkut foi desativado em 30/09/2014).

## 1.2 Progressão correta (índices iguais aos da cena, não reordenar)
| idx | Item | Tipo | Limite | Observação |
|---|---|---|---|---|
| 0 | Computador de tubo | unidade | **24** | A cena mostra 24 PCs e depois "+n". Depois do limite, o crescimento vem dos 3 níveis. |
| 1 | Ar-condicionado | unidade | **5** | A cena mostra até 5 aparelhos. |
| 2 | Balcão de lanches | unidade | **16** | A cena mostra 16 embalagens. |
| 3 | Campeonato de CS | unidade | **8** | 8 edições; a torcida cresce até 24 pessoas. |
| 4 | Link de internet | **nível** (10) | 10 | Cada compra é um link melhor. |
| 5 | Sala VIP | unidade | **6** | A cena mostra 6 e depois "+n". |
| 6 | Filial (franquia) | unidade | **10** | |
| 7 | Arena de eSports | unidade | **8** | Ponte para o jogo de eSports. |

Regra: cada item de unidade tem 3 níveis (`NV_*`), com o nome em `up`. Os itens-nível (link) usam `seq`.

## 1.3 Itens prontos (`GAMES.lan.gens`)
```js
gens:[
 ["Computador de tubo","Celeron com 256 MB de RAM, monitor de tubo e mouse de bolinha. Roda CS 1.6 (2003) a 30 fps e o Habbo sem engasgar.",15,0.1,24,
  [["Mais memória","De 256 para 512 MB: o Windows XP até agradece."],["Placa de vídeo dedicada","Roda LoL e Ragnarök sem virar apresentação de slides."],["Monitor LCD","Adeus monitor de tubo, olá coluna vertebral."]],null,1.15],
 ["Ar-condicionado","Split de 12 mil BTUs. Cliente fica 5 horas em vez de 2 e pede casaco.",100,1,5,
  [["Filtro limpo","Parou de cheirar a tênis molhado."],["Insulfilme na vitrine","Sol da tarde? Nunca ouvi falar."],["Temperatura 18 graus","Virou geladeira. Ninguém quer ir embora."]],null,1.15],
 ["Balcão de lanches","Coxinha, pastel, Guaraná de 2 litros e salgadinho de pacote. Fiado só até sexta.",1100,8,16,
  [["Estufa de salgados","Coxinha quente o dia todo, o cheiro chama cliente."],["Freezer de picolé","No verão vende mais que hora de PC."],["Máquina de pipoca","Pipoca doce e salgada. Vira ponto de encontro."]],null,1.15],
 ["Campeonato de CS 1.6","Inscrição de R$ 10 por jogador. Prêmio: R$ 200, um mouse pad e muita zoeira.",12000,47,8,
  [["Narrador da casa","O primo narra tudo e inventa jogada que não existiu."],["Projetor na parede","Plateia de cadeira de plástico e pipoca."],["Transmissão com webcam","Meia dúzia de espectadores, inclusive a tia."]],null,1.15],
 ["Link de internet","Do ADSL que cai com a chuva até a fibra que quase não cai.",130000,260,10,null,
  ["ADSL de 1 mega (o terror do ping)","ADSL de 2 megas","Dois ADSL balanceados","Link de rádio","Cabo de 10 megas","Cabo de 35 megas","Fibra de 100 megas","Fibra de 300 megas","Fibra de 500 megas","Fibra de 1 giga (ping de 8 ms)"],1.35],
 ["Sala VIP","PC bom, cadeira com encosto, ar só para você e hora a R$ 6. Pra moleque cuja mãe deu mesada.",1.4e6,1400,6,
  [["Headset e teclado novo","Teclado que faz barulho, jogador feliz."],["Cadeira reclinável","Aguenta partida de 6 horas."],["Frigobar","Refri gelado sem sair do lugar."]],null,1.15],
 ["Filial (franquia)","Mais uma lan no bairro vizinho, mesmo letreiro e o primo no caixa.",20e6,7800,10,
  [["Contador próprio","Chega de misturar o caixa da lan com o da padaria."],["Letreiro padronizado","Neon igual em todas as lojas."],["Sistema de controle de horas","Acabou o caderninho e o 'tio, eu já paguei'."]],null,1.15],
 ["Arena de eSports","A lan virou casa de eventos: palco, telão e torcida. Nasce um time profissional.",330e6,44000,8,
  [["Telão e iluminação","Muita luz e fumaça."],["Cabine de narração","Dois narradores e uma mesa de som."],["Camarote para patrocinadores","Tem coxinha premium."]],null,1.15]
],
```
**Textos da cena (opcional)**: letreiro inicial `R$ 1,50 / hora`; depois `R$ 3 / hora`. Para o link, usar `var LINKS=["ADSL 1M","ADSL 2M","ADSL 2x","RÁDIO","CABO 10M","CABO 35M","FIBRA 100M","FIBRA 300M","FIBRA 500M","FIBRA 1G"]` e `LINKS[Math.min(fb,10)-1]` no lugar de `'FIBRA 100M'`.

## 1.4 Estágios (`stages`) e rótulo da moeda
Limiares alinhados com os custos: PC=15, AC=100, lanche=1,1 mil, campeonato=12 mil, link=130 mil, VIP=1,4 mi, filial=20 mi, arena=330 mi.
```js
stages:[[0,"Garagem do tio"],[100,"Puxadinho com 3 PCs"],[1e3,"Lan de esquina"],[2e4,"Lan lotada na sexta"],
        [5e5,"Referência no bairro"],[2e7,"Rede de lans"],[5e8,"Império dos eSports"]],
```

## 1.5 Mensagens aleatórias (20)
```js
msgs:[
 "O moleque pediu mais 5 minutinhos. Já faz 3 horas.",
 "A luz caiu e todo mundo perdeu a partida. O tio do caixa jura que não foi ele.",
 "Fila pro último PC com Ragnarök numa sexta à noite.",
 "Alguém reclamou do mouse. O problema era a mão suada.",
 "No Habbo, três salas viraram 'pizzaria'. Ninguém sabe quem paga.",
 "O Orkut ainda está aberto em 8 monitores. Sem ninguém por perto.",
 "Cliente perguntou se pode instalar o jogo. Já instalou.",
 "A mãe do moleque veio buscar. O moleque já está atrasado há 2 horas.",
 "Ping em 12 ms: é festa!",
 "Fiado no balcão. 'Sábado eu pago', disse o freguês pela terceira vez.",
 "O CS 1.6 saiu em 2003 e a molecada joga até hoje. Isso é fidelidade.",
 "Cliente salvou o trabalho da escola no pen drive. O pen drive tinha vírus.",
 "'Tio, esse PC tá lento.' Com 14 abas do Orkut e um torrent aberto? Tá.",
 "A coxinha do dia acabou às 15h. A fila foi pra pastel.",
 "O teclado tem 3 teclas gastas: W, A e S. Dá pra adivinhar o jogo.",
 "Alguém colocou o nome do primo no ranking e foi tema de briga até a noite.",
 "O ventilador faz barulho, mas ninguém liga: o jogo tá no talo.",
 "Primeiro cliente do dia: o moleque que mata aula toda quarta.",
 "O pacote de 5 horas por R$ 8 virou o plano mais vendido do bairro.",
 "O LoL chegou no começo dos anos 2010 e a lan viu a fila de CS dividir com a de MOBA."
],
```

## 1.6 Eventos aleatórios (12)
```js
events:[
 {id:"apagao",t:"Apagão no bairro",x:"A luz caiu geral. A molecada xingou a companhia de energia em coro.",p:3,min:0,e:{mult:0,dur:20}},
 {id:"virus",t:"Vírus no PC",x:"Alguém baixou um 'crack de jogo' e agora o PC abre sozinho 50 janelas de apostas.",p:3,min:0,e:{bal:-0.04},mit:["own",4,3,0.5]},
 {id:"naopaga",t:"O moleque que não paga",x:"'Tio, pago amanhã, juro.' Já é a quarta vez.",p:3,min:100,esc:[{b:"Cobrar na hora",e:{bal:-0.01}},{b:"Deixar pra lá",e:{bal:-0.05}}]},
 {id:"chuva",t:"A chuva queimou o roteador",x:"Pancada de chuva e o modem foi pro céu. Ping: 999.",p:3,min:200,e:{bal:-0.08},mit:["own",4,5,0.5]},
 {id:"promo",t:"Promoção de sexta",x:"A turma chegou em peso com mesada fresca. Fila na calçada.",p:3,min:100,e:{mult:2,dur:30}},
 {id:"campsurp",t:"Campeonato surpresa",x:"A turma do colégio quer disputar. Inscrição na mão do caixa.",p:2,min:2000,e:{sec:90}},
 {id:"gato",t:"Roubaram o cabo",x:"Levaram uns metros de cabo de rede (pra vender o cobre) e a lan ficou meia hora offline.",p:2,min:1000,e:{mult:0.2,dur:30}},
 {id:"fiscal",t:"Fiscalização da prefeitura",x:"O fiscal quer ver alvará, extintor e se tem menor fora do horário da escola.",p:2,min:500,esc:[{b:"Mostrar tudo certinho",e:{bal:-0.02}},{b:"Pedir um 'tempo'",e:{bal:-0.1}}]},
 {id:"cheater",t:"Cheater na partida",x:"Um cliente está com wallhack no campeonato. A plateia descobriu antes do juiz.",p:2,min:12000,esc:[{b:"Expulsar sem devolver",e:{sec:30}},{b:"Devolver o dinheiro",e:{bal:-0.01}}]},
 {id:"pecas",t:"Promoção de peças",x:"O fornecedor liquidou memória e placa. Aproveita?",p:2,min:2000,esc:[{b:"Comprar (+30 s)",e:{sec:-30}},{b:"Deixar passar",e:{}}]},
 {id:"chuvalotada",t:"Chuvarada do fim de semana",x:"Choveu o dia inteiro e o pessoal ficou preso na lan.",p:2,min:100,e:{mult:1.8,dur:40}},
 {id:"aluguel",t:"Fim de mês",x:"Chegou o aluguel e a conta de luz do ar-condicionado.",p:2,min:5000,e:{bal:-0.06},mit:["own",1,2,0.7]}
],
```

## 1.7 Conquistas (16)
```js
ach:[
 {id:"pc1",n:"Primeiro PC",d:"Compre seu primeiro computador.",c:["own",0,1]},
 {id:"pc6",n:"Meia dúzia",d:"Chegue a 6 computadores.",c:["own",0,6]},
 {id:"pc24",n:"Lan lotada",d:"Chegue a 24 computadores.",c:["maxed",0]},
 {id:"ac1",n:"Cliente com casaco",d:"Instale o primeiro ar-condicionado.",c:["own",1,1]},
 {id:"coxinha",n:"Coxinha liberada",d:"Abra o balcão de lanches.",c:["own",2,1]},
 {id:"camp1",n:"Primeiro campeonato",d:"Realize um campeonato de CS 1.6.",c:["own",3,1]},
 {id:"link",n:"Ping de gente grande",d:"Chegue a fibra de 100 megas.",c:["own",4,7]},
 {id:"vip",n:"Mesada fresca",d:"Abra a Sala VIP.",c:["own",5,1]},
 {id:"filial",n:"Mais uma esquina",d:"Abra a primeira filial.",c:["own",6,1]},
 {id:"arena",n:"Palco e telão",d:"Construa uma arena de eSports.",c:["own",7,1]},
 {id:"c100",n:"Atendente nato",d:"Atenda 100 clientes (cliques).",c:["click",100]},
 {id:"c1000",n:"O tio do caixa",d:"Atenda 1.000 clientes.",c:["click",1000]},
 {id:"t100k",n:"100 mil de renda",d:"Acumule R$ 100 mil.",c:["tot",1e5]},
 {id:"t1m",n:"Primeiro milhão",d:"Acumule R$ 1 milhão.",c:["tot",1e6]},
 {id:"ps1k",n:"Mil por segundo",d:"Chegue a R$ 1 mil de produção por segundo.",c:["ps",1000]},
 {id:"ev10",n:"Sobrevivente de apagão",d:"Passe por 10 eventos.",c:["ev",10]}
],
```

---

# 2. DA CAVERNA AO ESPAÇO

## 2.1 O que não faz sentido hoje (e erros factuais)
- **Estágios**: "Idade Média" aparece, mas não existe item para ela. A "Antiguidade" começa com 1e3 de pontos (antes da agricultura!). A Idade Moderna não existe, e as Grandes Navegações (séc. XV e XVI) são **Idade Moderna**, não Média. Falta a "Era da Informação" (o computador).
- **Mensagem "o Brasil foi chegado por Cabral em 1500"**: redação ruim. Correto: a esquadra de Cabral chegou à atual Bahia em **22 de abril de 1500**, e os povos indígenas já viviam aqui havia milhares de anos.
- **Fogo**: "dominado há mais de 400 mil anos" é aceitável, mas melhor dizer "há pelo menos 400 mil anos (há indícios mais antigos)".
- **"Foguete: conquista do espaço"**: o primeiro satélite foi o Sputnik 1 (1957) e o primeiro humano no espaço foi Yuri Gagarin (12/04/1961). Falta o pouso na Lua (Apollo 11, 20/07/1969).
- **"Computador: era digital"**: ok, mas o nome certo é "Era da Informação" (ENIAC, 1945; transistor, 1947; web, anos 1990).
- **Moeda 🔬**: sugestão de nome em texto "Conhecimento".
- Os rótulos de era da cena (`NOMES`) não batem com os do painel.

## 2.2 Progressão correta
Aqui, **unidades são ilimitadas** (população e construções crescem sem teto, com bônus x2 a cada 25) e os **níveis são tecnologias reais**, em ordem histórica. A ordem dos itens é a mesma da cena (índices 0 a 8, sem alterar).

| idx | Item | Marco histórico (correto) |
|---|---|---|
| 0 | Bando de coletores | Paleolítico (ferramentas de pedra com mais de 2,5 milhões de anos) |
| 1 | Fogueira | Domínio do fogo (há pelo menos 400 mil anos) |
| 2 | Aldeia agrícola | Revolução Neolítica, por volta de 10.000 a.C. (Crescente Fértil) |
| 3 | Roda e comércio | Roda por volta de 3500 a.C., na Mesopotâmia |
| 4 | Escrita e bibliotecas | Cuneiforme sumério, por volta de 3300 a.C. |
| 5 | Grandes Navegações | Séc. XV e XVI (Idade Moderna) |
| 6 | Máquina a vapor | Revolução Industrial, Inglaterra, séc. XVIII (Watt, 1769) |
| 7 | Computador | ENIAC, 1945; internet comercial nos anos 1990 |
| 8 | Foguete | Sputnik 1957, Gagarin 1961, Apollo 11 em 1969 |

## 2.3 Itens prontos (`GAMES.civ.gens`)
```js
gens:[
 ["Bando de coletores","Juntam frutas, raízes e gravetos. Ninguém sabe o que é segunda-feira.",15,0.1,0,
  [["Cesto trançado","Carrega o dobro de frutas (e de fofoca)."],["Lança de madeira","Agora o almoço também corre."],["Arco e flecha","Caça de longe. Tecnologia de ponta há dezenas de milhares de anos."]],null,1.15],
 ["Fogueira","Comida cozida, noites quentes e a primeira roda de conversa.",100,1,0,
  [["Cozinhar a carne","Mais fácil de mastigar e de digerir."],["Fornos de barro","A cerâmica já existia há mais de 20 mil anos."],["Defumar alimentos","Carne dura semanas sem geladeira."]],null,1.15],
 ["Aldeia agrícola","Trigo, cevada e a primeira reunião de condomínio. Nasce a vida sedentária.",1100,8,0,
  [["Arado puxado por boi","Menos coluna doendo, mais colheita."],["Irrigação","Canais levam a água do rio pra roça."],["Celeiro","Guardar grão pra época de seca. Inventou a poupança."]],null,1.15],
 ["Roda e comércio","Carroças, rotas e o primeiro engarrafamento da história.",12000,47,0,
  [["Eixo e cubo melhores","A carroça passou a aguentar a carga sem quebrar."],["Estradas de pedra","Os romanos pavimentaram a Via Ápia em 312 a.C."],["Moeda","A moeda surgiu na Lídia por volta do séc. VII a.C. Chega de trocar galinha por sandália."]],null,1.15],
 ["Escrita e bibliotecas","Cuneiforme na argila. O primeiro registro foi contabilidade de grãos e cerveja.",130000,260,0,
  [["Alfabeto fenício","Poucos sinais, qualquer um aprende. Por volta de 1050 a.C."],["Papel","A invenção é atribuída a Cai Lun, na China, em 105 d.C."],["Prensa de Gutenberg","Por volta de 1450. O livro deixa de ser coisa de rico."]],null,1.15],
 ["Grandes Navegações","Caravelas, bússola e mapas. Portugueses e espanhóis saem pelo oceano.",1.4e6,1400,0,
  [["Bússola","Usada na navegação a partir dos séculos XI e XII."],["Caravela","O navio das grandes viagens portuguesas do séc. XV."],["Cartografia","Mapas novos a cada viagem."]],null,1.15],
 ["Máquina a vapor","Fábricas, trens e chaminés. Começa a Revolução Industrial.",20e6,7800,0,
  [["Tear mecânico","Mais tecido, menos mão-de-obra."],["Locomotiva","A primeira ferrovia pública a vapor foi inaugurada em 1825, na Inglaterra."],["Aço","Bessemer barateou o aço em 1856."]],null,1.15],
 ["Computador","Do ENIAC (1945) ao celular no bolso. Entra a era da informação.",330e6,44000,0,
  [["Transistor","Inventado em 1947, trocou as válvulas gigantes."],["Internet","A rede cresce a partir dos anos 1960; a web surge em 1989."],["Smartphone","Um computador no bolso, usado pra ver meme."]],null,1.15],
 ["Foguete","Conquista do espaço. Sputnik (1957), Gagarin (1961), Apollo 11 (1969).",5.1e9,260000,0,
  [["Satélite artificial","O Sputnik 1 foi lançado em 1957."],["Humano no espaço","Gagarin deu uma volta na Terra em 12 de abril de 1961."],["Pouso na Lua","Apollo 11 pousou em 20 de julho de 1969."]],null,1.15]
],
```
**[CENA]** `NOMES` (rótulo no canvas) deve ficar igual aos estágios: `['Paleolítico','Domínio do fogo','Revolução Neolítica','Idade da Roda','Idade da Escrita','Grandes Navegações','Revolução Industrial','Era da Informação','Era Espacial']`.

## 2.4 Estágios
Limiares igual ao custo do item que marca a era.
```js
stages:[[0,"Paleolítico"],[1.1e3,"Neolítico"],[1.2e4,"Idade dos Metais"],[1.3e5,"Antiguidade"],
        [5e5,"Idade Média"],[1.4e6,"Idade Moderna"],[2e7,"Revolução Industrial"],[3.3e8,"Era da Informação"],[5.1e9,"Era Espacial"]],
```

## 2.5 Mensagens aleatórias (20)
Fatos conferidos. Piadas marcadas como "Humor".
```js
msgs:[
 "Fato: as ferramentas de pedra mais antigas têm mais de 2,5 milhões de anos.",
 "Fato: há indícios de controle do fogo com pelo menos 400 mil anos.",
 "Fato: a agricultura surgiu por volta de 10.000 a.C., no Crescente Fértil.",
 "Fato: a mandioca foi domesticada na Amazônia pelos povos indígenas.",
 "Fato: a roda de transporte aparece por volta de 3500 a.C. na Mesopotâmia.",
 "Fato: Mesopotâmia significa 'terra entre rios': o Tigre e o Eufrates.",
 "Fato: a escrita surgiu na Suméria, por volta de 3300 a.C. Começou como contabilidade.",
 "Fato: o Nilo corre do sul pro norte e suas cheias adubavam as terras do Egito.",
 "Fato: a Grande Pirâmide de Gizé foi a construção mais alta do mundo por cerca de 3.800 anos.",
 "Fato: o Império Romano do Ocidente caiu em 476 d.C., marco do fim da Antiguidade.",
 "Fato: Constantinopla caiu em 1453, marco do fim da Idade Média.",
 "Fato: a esquadra de Cabral chegou à Bahia em 22 de abril de 1500. Os indígenas já viviam aqui há milhares de anos.",
 "Fato: a Serra da Capivara (PI) guarda pinturas rupestres e é Patrimônio Mundial da UNESCO desde 1991.",
 "Fato: na Idade da Pedra do Brasil havia preguiças-gigantes e tigres-dentes-de-sabre.",
 "Fato: a Revolução Industrial começou na Inglaterra, no século XVIII.",
 "Fato: Santos Dumont voou com o 14-Bis em Paris, em 23 de outubro de 1906.",
 "Fato: Yuri Gagarin foi o primeiro humano no espaço, em 12 de abril de 1961.",
 "Fato: Apollo 11 pousou na Lua em 20 de julho de 1969.",
 "Humor: o primeiro 'bom dia' foi um grunhido. O segundo também.",
 "Humor: os mamutes fugiram de novo. (Eles nem viviam aqui, mas a tribo jura que viu.)"
],
```

## 2.6 Eventos aleatórios (10)
```js
events:[
 {id:"seca",t:"Seca",x:"Faz meses que não chove. As plantas murcharam e o rio virou fio d'água.",p:3,min:1000,e:{mult:0.5,dur:40},mit:["own",2,5,0.7]},
 {id:"descoberta",t:"Descoberta!",x:"Um coletor achou uma pedra que corta melhor. Agora todo mundo quer uma.",p:3,min:100,e:{sec:60}},
 {id:"peste",t:"Peste",x:"Uma doença se espalha pela aldeia. A Peste Negra matou milhões na Europa entre 1347 e 1351; aqui, o susto é menor.",p:2,min:10000,e:{mult:0.6,dur:45}},
 {id:"cheia",t:"Cheia do rio",x:"O rio transbordou e deixou lama fértil nas margens, como o Nilo no Egito.",p:3,min:1000,e:{mult:1.6,dur:40}},
 {id:"vulcao",t:"Vulcão acordou",x:"A montanha tossiu cinzas por uma semana. Algumas casas ficaram cobertas.",p:2,min:5000,e:{bal:-0.08}},
 {id:"aliança",t:"Tribo vizinha quer aliança",x:"Eles oferecem peles e sal em troca de comida e proteção.",p:2,min:2000,esc:[{b:"Aceitar",e:{sec:90}},{b:"Recusar",e:{}}]},
 {id:"eclipse",t:"Eclipse solar",x:"O dia virou noite por alguns minutos. A tribo entra em pânico.",p:2,min:500,esc:[{b:"Fazer um ritual",e:{sec:40}},{b:"Explicar com ciência",e:{sec:15}}]},
 {id:"incendio",t:"Incêndio na biblioteca",x:"Uma vela virou fogueira. Muita coisa foi perdida.",p:2,min:130000,e:{bal:-0.1}},
 {id:"cometa",t:"Cometa no céu",x:"Todo mundo parou pra olhar. Alguns acham que é presságio.",p:2,min:3000,e:{mult:1.4,dur:30}},
 {id:"naufragio",t:"Tempestade no mar",x:"Uma caravela se perdeu no meio do oceano.",p:2,min:1.4e6,e:{bal:-0.06}}
],
```

## 2.7 Conquistas (16)
```js
ach:[
 {id:"c1",n:"Primeiro bando",d:"Recrute os primeiros coletores.",c:["own",0,1]},
 {id:"fogo",n:"Domínio do fogo",d:"Acenda sua primeira fogueira.",c:["own",1,1]},
 {id:"agri",n:"Revolução Neolítica",d:"Funde sua primeira aldeia agrícola.",c:["own",2,1]},
 {id:"roda",n:"Rodou!",d:"Invente a roda.",c:["own",3,1]},
 {id:"escrita",n:"A história começa",d:"Invente a escrita.",c:["own",4,1]},
 {id:"nav",n:"Mar à vista",d:"Comece as Grandes Navegações.",c:["own",5,1]},
 {id:"vapor",n:"Fumaça e ferro",d:"Ligue sua primeira máquina a vapor.",c:["own",6,1]},
 {id:"pc",n:"Era da Informação",d:"Construa seu primeiro computador.",c:["own",7,1]},
 {id:"foguete",n:"Ao infinito e além",d:"Lance seu primeiro foguete.",c:["own",8,1]},
 {id:"col25",n:"Tribo grande",d:"Chegue a 25 coletores.",c:["own",0,25]},
 {id:"click100",n:"Explorador",d:"Explore 100 vezes.",c:["click",100]},
 {id:"click1000",n:"Sem medo de sair da caverna",d:"Explore 1.000 vezes.",c:["click",1000]},
 {id:"t100k",n:"100 mil de conhecimento",d:"Acumule 100 mil de conhecimento.",c:["tot",1e5]},
 {id:"t1b",n:"Um bilhão de ideias",d:"Acumule 1 bilhão.",c:["tot",1e9]},
 {id:"ps1k",n:"Mil por segundo",d:"Chegue a 1 mil por segundo.",c:["ps",1000]},
 {id:"era",n:"Chegou ao espaço",d:"Chegue ao estágio Era Espacial.",c:["stage",8]}
],
```

---

# 3. TIME DE ESPORTS

## 3.1 O que não faz sentido hoje
- **"Jogador de várzea" é uma unidade ilimitada.** Um time titular tem **5** jogadores (LoL e CS são 5 contra 5), mais **1 a 2 reservas**.
- **"Coach"** é um só (head coach). Ter "coach x30" não faz sentido. Falta o **analista de desempenho** e o **psicólogo**, hoje inexistentes.
- **"Gaming house"** é uma casa só e evolui por melhorias (nível), não por "comprar 40 casas".
- **"Título mundial"** não se compra. Vira "Campanha do Mundial" (viagem, bootcamp, inscrição), repetível a cada temporada. A cena mostra "CAMPEÃO MUNDIAL x n".
- "Patrocínio local" tem bom tema (padaria), mas deve ser **limitado a 5** (a cena tem 5 nomes fictícios) e **vir depois** da gaming house.
- "Arena própria": time não costuma ter arena. Vira "Evento do time" (arena alugada).
- **Estágios**: ligas sem nome e fora de ordem com os custos.
- Marcas registradas: tudo fictício (Padaria do Zé, EnergiMax, TurboNet, Posto Sol, Mega Byte). Sem personagens de jogo.

## 3.2 Progressão correta (ordem de entrada)
**Nova ordem** (a lista na tela deve seguir esta ordem para a progressão fazer sentido):

| novo idx | Item | Tipo | Limite | Requisito para liberar |
|---|---|---|---|---|
| 0 | Titulares | **unidade** | **5** | Início |
| 1 | Reservas | **unidade** | **2** | 5 titulares |
| 2 | Coach | **unidade** | **1** | 5 titulares |
| 3 | Analista de desempenho | **unidade** | **1** | Coach |
| 4 | Gaming house | **nível** | **12** | Coach |
| 5 | Psicólogo | **unidade** | **1** | Gaming house nível 3 |
| 6 | Patrocinadores | **unidade** | **5** | Gaming house nível 3 |
| 7 | Streamer do time | **unidade** | **3** | 1 patrocinador |
| 8 | Fã-clube | **nível** | **12** | 1 streamer |
| 9 | Evento do time | **unidade** | **6** | Fã-clube nível 3 |
| 10 | Campanha do Mundial | unidade (repetível) | sem limite | 3 eventos |

**[CENA]** `esp.js` lê `a=o[0], c=o[1], h=o[2], sp=o[3], st=o[4], f=o[5], e=o[6], w=o[7]`. Com a nova ordem, trocar para:
`a=nn(o[0]), c=nn(o[2]), h=nn(o[4]), sp=nn(o[6]), st=nn(o[7]), f=nn(o[8]), e=nn(o[9]), w=nn(o[10])`.
`o[1]` (reservas, banco de reservas), `o[3]` (analista, notebook), `o[5]` (psicólogo, sofá) podem ganhar sprites depois. Sem isso, os itens funcionam e só não têm visual.
Também em `esp.js`: a gaming house usa `h` até 12 (3 janelas x 4 andares), os patrocinadores usam `sp` até 5 e a torcida usa `f` até 12. Os limites escolhidos acima casam com isso.

## 3.3 Itens prontos (`GAMES.esp.gens`)
Valores de partida sugeridos, para ajustar no balanceamento. `seq` mostra o texto do **próximo** item a comprar.
```js
gens:[
 ["Titulares","Os cinco que jogam. Compre um por vez e monte o quinteto.",15,0.2,5,
  [["Cadeira e mouse de verdade","Chega de mouse emprestado do tio."],["Treino de mira todo dia","Mil abates antes do café."],["Fisioterapia de punho","Alongamento obrigatório. O punho agradece."]],
  [["Topo","Joga sozinho num canto do mapa e acha que ganhou a partida sozinho."],
   ["Selva","Passa o jogo explicando que 'o time não ajuda'."],
   ["Meio","Centro das atenções, e dos erros de leitura."],
   ["Atirador","Causa o dano e reclama da proteção."],
   ["Suporte","Segura o time, o mapa e a conta do lanche."]],1.5],
 ["Reservas","Quem entra quando o titular tem dor no punho ou dor de cabeça. Máximo de 2.",400,1,2,
  [["Treino em dupla","Os dois reservas evitam brigar por vaga."],["Função extra","Aprendeu uma segunda posição."],["Banco bem pago","Reserva feliz não vai embora pro rival."]],
  [["Primeiro reserva","Treina às escondidas só pra ser chamado."],["Segundo reserva","Já sabe que provavelmente vai ficar no banco."]],1.6],
 ["Coach","Ensina o time a ler o mapa e a perder com dignidade. Só existe um.",2500,6,1,
  [["Caderno de táticas","Rabiscos que viraram estratégia."],["Reunião de feedback","Sem choro, com pizza."],["Banco de estratégias","Para cada mapa, uma jogada."]],null,1.15],
 ["Analista de desempenho","Assiste aos replays para achar quem errou (spoiler: foi o suporte).",14000,30,1,
  [["Planilha de replays","Cada erro catalogado, com hora e minuto."],["Estudo dos rivais","Sabe o que o adversário faz antes dele."],["Painel de estatísticas","Gráficos que ninguém entende, mas impressionam."]],null,1.15],
 ["Gaming house","Moram, treinam e brigam por causa da louça. Cada compra é uma melhoria da casa.",90000,150,12,null,
  ["Casa alugada (3 quartos, 1 banheiro)","Colchões novos","Internet estável (finalmente)","Cozinheira","Sala de treino com ar-condicionado","Lavanderia (fim das meias no monitor)","Sala de análise de replay","Academia e fisioterapeuta","Estúdio de gravação","Segundo andar","Sala de descompressão (fliperama e sofá)","Mansão gamer (com regra de convivência)"],1.4],
 ["Psicólogo","Lida com a pressão, o sono e a culpa pelo 1 x 3. Sessão toda sexta.",400000,700,1,
  [["Rotina de sono","Dormir às 3 da manhã deixou de ser meta."],["Respiração e foco","Antes da final, respira fundo."],["Acompanhamento de pressão","Ajuda a lidar com o hate nas redes."]],null,1.15],
 ["Patrocinadores","Marcas pagando pra aparecer na camisa. Máximo de 5.",1.5e6,3000,5,null,
  [["Padaria do Zé","Logo na camisa e pão de queijo no treino."],["EnergiMax","Energético: o analista não aprova."],["TurboNet","Internet melhor, contrato mais longo."],["Posto Sol","Gasolina pra viajar pro campeonato."],["Mega Byte","Peças de PC pra casa toda."]],1.5],
 ["Streamer do time","Live de 12 horas e dois cafés. Vem com público fiel.",12e6,15000,3,
  [["Câmera e microfone","Agora a voz sai sem eco de banheiro."],["Parceria com plataforma","Começa a render de verdade."],["Clipes virais","Um vídeo bom paga o mês."]],
  ["Streamer principal","Editor de clipes","Podcast do time"],1.6],
 ["Fã-clube","Cada compra é um passo da torcida: de grupo no zap a sócio-torcedor.",8e7,65000,12,null,
  ["Grupo de fãs no zap","Primeiros 100 seguidores","Camisa oficial","Loja de merchandising","Sócio-torcedor","Torcida organizada","Caravana pros jogos","Bandeirão e instrumento","Fan meeting","Programa de sócio premium","Podcast do time","Fã-clube em outros países"],1.4],
 ["Evento do time","Show-match em arena alugada. Casa cheia e muito grito.",6e8,300000,6,
  [["Telão de LED","Mais imagem que a TV da sala."],["Luz e fumaça","Ficou com cara de final."],["Transmissão multicanal","O jogo vai pra todo canto."]],null,1.4],
 ["Campanha do Mundial","Viagem, bootcamp, inscrição e a taça. Cada compra é uma edição vencida.",1e10,2e6,0,null,null,1.15]
],
```
**Alternativa CS** (se quiser variar o tema): `seq` de titulares com `["Capitão (IGL)","Entry","Sniper","Suporte","Lurker"]`.

## 3.4 Estágios e ligas
Nomes fictícios (sem marcas registradas). Limiares alinhados aos custos.
```js
stages:[[0,"Time de várzea (rankeada às 3 da manhã)"],[1e3,"Copa amadora de bairro"],[2e4,"Circuito regional"],
        [3e5,"Liga de acesso (segunda divisão)"],[4e6,"Liga nacional: fase de pontos"],[5e7,"Liga nacional: playoffs"],
        [6e8,"Classificado pro Mundial"],[1e10,"Lenda dos eSports"]],
```
**[CENA]** `CAP` (legenda) pode ser: `['Garagem do time','Time de várzea','Gaming house','Arena alugada','Campeões do Mundo']` (hoje 'Casa do time' e 'Arena própria').

## 3.5 Mensagens aleatórias (20)
```js
msgs:[
 "O top laner jogou 14 horas seguidas. Ainda culpa o lag.",
 "O analista achou o erro no replay: foi o suporte (de novo).",
 "O psicólogo disse 'respira'. O atirador respondeu 'é o ping'.",
 "O coach pediu mais um café. Já é o oitavo.",
 "Treino às 14h, janta às 15h e rankeada até as 4 da manhã.",
 "Regra da gaming house: quem esquece a louça joga de suporte.",
 "O reserva está aquecendo os dedos e o coração.",
 "Chegou proposta de patrocínio de energético. O psicólogo torceu o nariz.",
 "O selva falou 'o time não ajuda'. O time não ajudou.",
 "Derrota por 1 torre. Dói.",
 "O contrato exige foto com a lata na mão, em todo treino.",
 "Os fãs lotaram os comentários da live: 'bora, bora!'.",
 "No LoL e no CS, o time titular tem 5 jogadores. Aqui também.",
 "A liga divide a temporada em etapas e a gente já faz conta de pontos.",
 "O streamer do time deu 'bom dia' às 17h.",
 "Mais uma palestra do coach: 'foco no objetivo'. O time focou no lanche.",
 "O fisioterapeuta mandou o top parar de jogar por 2 dias. O top está treinando escondido.",
 "O rival vazou nosso treino. Nosso analista já tem a resposta.",
 "Aniversário do suporte: o time deu um mouse pad e uma bronca.",
 "A mãe do atirador mandou pão de queijo. Moral do time: nas alturas."
],
```

## 3.6 Eventos aleatórios (12)
```js
events:[
 {id:"lesao",t:"Lesão no punho",x:"O titular sentiu uma fisgada no punho no meio do treino. Dá pra jogar, mas dói.",p:3,min:500,esc:[{b:"Entrar o reserva",e:{mult:0.8,dur:30}},{b:"Jogar com dor",e:{mult:0.5,dur:60}}],mit:["own",1,1,0.6]},
 {id:"polemica",t:"Polêmica na timeline",x:"Um jogador disse algo infeliz na live. Print viralizou e a internet pegou fogo.",p:3,min:5000,e:{bal:-0.07},mit:["own",5,1,0.4]},
 {id:"patrocinio",t:"Proposta de patrocínio",x:"A marca quer a logo na camisa e fotos com o produto. Fechamos?",p:3,min:1000,esc:[{b:"Aceitar (+2 min)",e:{sec:120}},{b:"Pedir mais",e:{sec:60}}]},
 {id:"burnout",t:"Esgotamento do time",x:"Dois dias sem folga e o time só sabe falar 'tô cansado'.",p:2,min:2000,e:{mult:0.6,dur:40},mit:["own",5,1,0.5]},
 {id:"patch",t:"Atualização do jogo",x:"A nova versão mexeu em tudo. O 'meta' virou do avesso.",p:2,min:3000,e:{mult:0.7,dur:45},mit:["own",3,1,0.5]},
 {id:"queda",t:"Queda de energia no treino",x:"A luz caiu no meio da scrim e o nobreak aguentou 40 segundos.",p:2,min:500,e:{mult:0,dur:15}},
 {id:"viral",t:"Clipe viralizou",x:"Uma jogada absurda virou meme e entrou nos assuntos do dia.",p:3,min:5000,e:{sec:90}},
 {id:"scrim",t:"Treino contra o rival",x:"O rival topou um treino. Dá pra aprender, mas ele também aprende.",p:2,min:1000,esc:[{b:"Treinar a sério",e:{sec:45}},{b:"Esconder as jogadas",e:{sec:20}}]},
 {id:"showmatch",t:"Convite de show-match",x:"Uma loja chamou o time pra jogar na inauguração.",p:2,min:20000,esc:[{b:"Aceitar",e:{sec:120}},{b:"Recusar",e:{}}]},
 {id:"multa",t:"Atraso no pagamento",x:"O pagamento do patrocinador atrasou e o aluguel da gaming house vence hoje.",p:2,min:20000,e:{bal:-0.05},mit:["own",6,2,0.5]},
 {id:"aposentadoria",t:"Veterano pensa em parar",x:"Aquele jogador de anos de estrada quer descansar. Dá pra convencer?",p:1,min:50000,esc:[{b:"Oferecer reajuste",e:{sec:-60}},{b:"Deixar ir",e:{mult:0.7,dur:60}}]},
 {id:"fas",t:"Torcida na porta",x:"Um grupo de fãs ficou na porta da gaming house esperando autógrafo.",p:2,min:100000,e:{mult:1.5,dur:30}}
],
```

## 3.7 Conquistas (16)
Os índices abaixo usam a **nova ordem** da seção 3.2.
```js
ach:[
 {id:"t1",n:"Primeiro titular",d:"Contrate o primeiro jogador.",c:["own",0,1]},
 {id:"t5",n:"Quinteto formado",d:"Complete os 5 titulares.",c:["maxed",0]},
 {id:"res",n:"Banco de reservas",d:"Contrate 2 reservas.",c:["maxed",1]},
 {id:"coach",n:"Coach contratado",d:"Contrate o coach.",c:["own",2,1]},
 {id:"analista",n:"Olho de analista",d:"Contrate o analista de desempenho.",c:["own",3,1]},
 {id:"gh1",n:"Casa própria",d:"Alugue a gaming house.",c:["own",4,1]},
 {id:"gh12",n:"Mansão gamer",d:"Chegue ao nível máximo da gaming house.",c:["maxed",4]},
 {id:"psi",n:"Mente sã",d:"Contrate o psicólogo.",c:["own",5,1]},
 {id:"sp1",n:"Primeiro patrocínio",d:"Feche o primeiro patrocinador.",c:["own",6,1]},
 {id:"sp5",n:"Camisa cheia",d:"Feche os 5 patrocinadores.",c:["maxed",6]},
 {id:"live",n:"Vai pro ar",d:"Contrate o streamer do time.",c:["own",7,1]},
 {id:"fan6",n:"Torcida organizada",d:"Chegue ao nível 6 do fã-clube.",c:["own",8,6]},
 {id:"evento",n:"Casa cheia",d:"Realize o primeiro evento do time.",c:["own",9,1]},
 {id:"mundial",n:"Campeões do Mundo",d:"Vença o Mundial.",c:["own",10,1]},
 {id:"t100k",n:"100 mil de renda",d:"Acumule 100 mil estrelas.",c:["tot",1e5]},
 {id:"c1000",n:"Mil treinos",d:"Treine 1.000 vezes.",c:["click",1000]}
],
```

---

## 4. Resumo de integração (opcional)
1. Copiar `gens`, `stages`, `msgs` direto em `GAMES.<jogo>`. O código atual ignora as posições extras de `gens`, então nada quebra.
2. Para limite, nível e `seq`, implementar `max`, `up`, `seq` e `R` em `nFor/costOf/build/update`. Para eventos e conquistas, implementar um sorteador simples e `st.g[k].c`.
3. Se for reordenar o jogo de eSports, atualizar o mapeamento de índices em `scenes/esp.js` (seção 3.2). Lan e Civ mantêm os índices atuais.
