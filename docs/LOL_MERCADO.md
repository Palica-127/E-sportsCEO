# Time de eSports (tema LoL): Mercado, Liga e balanceamento

Este documento descreve as regras das abas **Mercado** e **Liga**, o contrato com a cena e os números de balanceamento. As abas são plugins (veja `docs/TABS_API.md`): `js/tabs/esp-mercado.js` e `js/tabs/esp-liga.js`. Os números ficam em `GAMES.esp.mk` (Mercado) e `GAMES.esp.lg` (Liga) em `js/games/esp.js`. Tema: só texto, cores e eventos de LoL em pt-BR; nenhum nome de campeão, logo ou marca (os nomes de jogadores/times vêm de `js/data/jogadores.js`, do BrasLOL; as equipes adversárias das chaves têm nomes genéricos inventados).

## 1. Regra do jogo

- 5 titulares (1 por função: TOP, JNG, MID, ADC, SUP), 2 reservas, 1 coach, 1 analista, 1 psicólogo; o resto é upgrade por nível (Treino tático, Gaming house, Equipamento, Patrocínio, Canal, Fã-clube, Arena, Sala de troféus).
- Cada vaga de titular está **vazia**, com **jogador genérico** ("Amador 1"... comprado na aba Time, item *Titular*) ou com um **jogador real** contratado no Mercado. O item *Titular* (o[tit]) conta as vagas ocupadas (genéricas + reais); o mesmo vale para *Reserva* (o[res], 2 vagas).
- Meta final: **vencer o Mundial** (estágio "Lenda dos eSports"). O jogo "fecha" aí.

## 2. Região, divisões e estágios (aba Liga)

- Ao abrir o eSports num jogo novo, o jogador escolhe a **região** (Brasil padrão). Mapa região → liga principal: Brasil = CBLOL, América do Norte = LCS, Europa = LEC, Coreia = LCK, China = LPL, Ásia-Pacífico = LCP. A região fica em `api.shared.region` e **só muda ao zerar o jogo** (decisão: não muda no prestígio, para a identidade do time se manter).
- O time começa a competir quando tem 5 titulares. Entra na **T2** ("Circuito Desafiante <região>", nome genérico) e joga **splits** de 8 jogos (7 s por jogo, 10 s de intervalo).
- **Promoção**: ao fim de um split da T2, se o time tem **5 vitórias ou mais** e **força >= 68**, disputa a **série de acesso** (melhor de 5 contra um adversário de força 66). Vencendo, sobe para a liga principal (T1; +10% de renda permanente e ⭐ = 300 s de produção). Perdendo, volta para a T2.
- **T1**: dois splits por ano, de 9 jogos. Split 1: 6 vitórias ou mais classificam ao **MSI** (meio do ano); split 2: 6 vitórias ou mais classificam ao **Mundial** (fim do ano). Quem não classifica segue para o próximo split/ano.
- **MSI**: Quartas (Bo3), Semifinal (Bo5), Final (Bo5), adversários de força 80, 88 e 97. **Mundial**: Oitavas (Bo3), Quartas, Semifinal e Final (Bo5), força 95, 101, 107 e 112,5. As chaves terminam na primeira derrota. Os adversários têm força **fixa** (tabela estável, nomes derivados de um hash, não do acaso); o acaso só decide cada jogo.
- **Resultado de cada jogo**: `P(vitória) = 1 / (1 + 10^((adversário − força) / 7))`, com sorteio por gerador com semente salva no save. Força do time = **nota média dos 5 titulares** (genérico = 58, vaga vazia = 40) **+ estrutura** (Treino tático x1 por nível, Gaming house x0,8, Equipamento x0,8, Coach/Analista/Psicólogo x1,5 cada) **+ reservas** (0,1 por ponto de nota acima de 70, só reservas reais) **+ moral** (+0,75 por eliminação nas semifinais/final do mesmo torneio, até +9).
- Ligas mais fortes têm adversários mais fortes na T1/MSI/Mundial: `+0` Brasil, `+0,5` Ásia-Pacífico, `+1` América do Norte, `+1,5` Europa, `+2` Coreia e China (`GAMES.esp.lg.offs`). A T2 e a série de acesso não mudam.
- **Recompensas** (em segundos de produção, `lg.rw`): promoção 300; MSI participar 200, chegar à final 500, campeão 1200 (+15% de renda permanente por título, até 3); Mundial participar 400, campeão 3000 (+25% por título, até 3) e cena de campeão.
- **Estágios** (`tier`, vira o banner "Nova fase"): 0 Ranqueada (elo baixo, sem time completo), 1 Cenário amador (T2), 2 Liga principal (T1), 3 MSI (disputou o primeiro), 4 Mundial (disputou o primeiro), 5 Lenda (campeão mundial).
- **Placar** (aba Time): esquerda "T2 · Desafiante Brasil", "CBLOL · Split 1", "CBLOL · MSI"..., direita o próximo marco ("Promoção: força 61/68", "Acesso: 3/5 vitórias", "MSI: 4/6 vitórias", "Quartas · 1x0"). A barra mostra o progresso do marco.
- A Liga só avança com o jogo aberto (como todo o tempo "ativo"); o ganho offline continua só de moeda.

## 3. Mercado

- Fonte: `js/data/jogadores.js` (280 jogadores reais de 6 ligas). Cartão: avatar gerado (círculo com iniciais na cor da função + ícone da função; nada é baixado), nome, time, liga, idade, função, **nota**, preço e botões **Contratar** (titular) e **Reserva**. Foto opcional: se existir `img/jogadores/<id>.webp` o cartão usa (carregada com `<img>`, `onerror` volta ao avatar); a pasta só tem `.gitkeep` e nenhuma foto é incluída ou baixada. Cada foto ausente gera um aviso de arquivo não encontrado no console do navegador (esperado, 1 por jogador por sessão); para silenciar, use `GAMES.esp.mk.photos = false`.
- Lista dos **280 jogadores** com cartões leves: paginação de 20 ("Carregar mais") e atualização por diff (`api.list`); medido: ~1 ms por render com os 280 cartões abertos. Filtros: função (chips), liga (chips; "★" na liga da região), "Liberados", busca por nome/time e ordenação (nota ↓/↑, preço ↑/↓).
- **Disponibilidade** (a região vem da Liga):
  - **Liga da sua região, na T2**: só os de **menor nota** de cada função (40% inferiores, 125 jogadores no total no jogo todo, ex.: CBLOL 75 a 80). As estrelas aparecem com cadeado: "Sobe com a promoção para o CBLOL".
  - **Liga da sua região, na T1**: todos.
  - **Importados** (outras regiões): só **depois da promoção**; **limite de 2** importados entre titulares e reservas; preço com **ágio de 50%**; os de **LCK/LPL** só **depois de disputar um torneio internacional** (MSI ou Mundial, mesmo perdendo). O cartão mostra o rótulo **Importado** e o elenco mostra "Importados 1/2". (Se a sua região é LCK ou LPL, os jogadores dela não são importados.)
- **Contratar titular**: o jogador só entra na **própria função**. Se a vaga está vazia, ocupa; se tem um genérico, substitui (o genérico some); se tem outro real, pede confirmação (2 toques) e dispensa o anterior devolvendo 50%.
- **Reserva**: aceita qualquer função (2 vagas), preço = 40% do de titular. Se as 2 estão ocupadas, é preciso dispensar uma.
- **Dispensar** (toque duplo na célula do elenco ou no botão do cartão): devolve **50% do valor pago** e libera a vaga (o `o[tit]`/`o[res]` cai em 1).
- **Efeito na produção**: o titular real vale `m(nota)` vezes um genérico, com `m(nota) = 1,1 · e^(0,0456 · (nota − 74))` (74 ≈ x1,10; 80 ≈ x1,45; 90 ≈ x2,28; 96 ≈ x3,0); implementado como unidades efetivas extras do item Titular (os níveis de Treino e Equipamento e os marcos continuam valendo). O reserva real dá **+1% (nota 74) a +8% (nota 96) de renda total** (multiplicador global). O elenco no topo da aba mostra os 5+2 slots com nome, nota e a **renda por segundo** que cada contratado adiciona.
- **Preço** (em ⭐): `P(nota) = 50 mil · e^(1,1 · min(nota − 74, 9) + 0,7 · max(0, nota − 83))`, arredondado a 2 algarismos significativos; importados x1,5; reservas x0,4.

| Nota | Titular (liga própria) | Titular importado | Reserva | Multiplicador | Bônus de reserva |
|---:|---:|---:|---:|---:|---:|
| 74 | 50 mil | 75 mil | 20 mil | x1,10 | +1,0% |
| 76 | 450 mil | 680 mil | 180 mil | x1,21 | +1,6% |
| 78 | 4,09 mi | 6,1 mi | 1,6 mi | x1,32 | +2,3% |
| 80 | 37 mi | 55 mi | 15 mi | x1,45 | +2,9% |
| 83 | 1 bi | 1,5 bi | 400 mi | x1,66 | +3,9% |
| 85 | 4 bi | 6,1 bi | 1,6 bi | x1,82 | +4,5% |
| 88 | 33 bi | 50 bi | 13 bi | x2,08 | +5,5% |
| 90 | 130 bi | 200 bi | 52 bi | x2,28 | +6,1% |
| 92 | 540 bi | 810 bi | 220 bi | x2,50 | +6,7% |
| 94 | 2,2 tri | 3,3 tri | 880 bi | x2,74 | +7,4% |
| 96 | 8,9 tri | 13 tri | 3,6 tri | x3,00 | +8,0% |

(A parte íngreme até a nota 83 acompanha a renda do meio do jogo; as notas 90+ só aparecem como importados, no fim do jogo.)

## 4. Prestígio ("Nova temporada")

Regra escolhida: **os jogadores reais contratados permanecem** (titulares e reservas) e **as compras genéricas reiniciam**:

- Saldo, itens, metas, Treino/Gaming house/etc. e o estágio voltam ao início; `o[tit]` e `o[res]` voltam ao número de reais (as vagas genéricas esvaziam). Multiplicadores do Mercado e da Liga são reaplicados.
- O time volta para a **T2** da mesma região (precisa subir de novo); **troféus**, bônus permanentes de título (`liga:*`) e o "passaporte internacional" (que libera LCK/LPL como importados) **ficam**.
- A região não muda. Os Hall da Fama (⭐ de prestígio) seguem a regra do motor (+10% cada).
- Efeito: a nova temporada começa com renda um pouco maior (os reais), mas o Mercado fecha os importados de novo até a promoção. A 2ª temporada não foi simulada nesta rodada.

## 5. Contrato com a cena

`SCENES.esp.draw(ctx, W, H, o, t, x)`: `o` e `x` continuam como antes e `x` ganha:

```js
x.roster = {
  starters: [ /* 5 itens, ordem TOP, JNG, MID, ADC, SUP */ null | { n:'Nome', r:'TOP|JNG|MID|ADC|SUP', real:true|false, o:nota } ],
  subs:     [ /* 2 itens */ null | { n, r, real, o } ]
};
x.division = 'T2' | 'T1' | 'MSI' | 'MUNDIAL';   // fase atual da carreira (MSI/MUNDIAL só enquanto o torneio acontece)
x.region   = 'Brasil' | 'América do Norte' | 'Europa' | 'Coreia' | 'China' | 'Ásia-Pacífico';
x.champ    = 0 | 1;                              // 1 por ~12 s (MSI) ou ~20 s (Mundial) depois de um título: cena de campeão
```

- `null` = vaga vazia. Genéricos têm `real:false`, `n:'Amador N'` (titulares) ou `'Reserva N'` (reservas), `o:58`. Nos reservas genéricos, `r` é só um valor de preenchimento (`TOP`/`JNG` por posição).
- O objeto `x.roster` é recriado só quando o elenco muda (não é alocado por quadro). `x.tier` agora vem da Liga (0 a 5). `o` (níveis/unidades) é o mesmo de antes: `o[0]` (Titular) e `o[1]` (Reserva) contam as vagas ocupadas.

## 6. Eventos, conquistas e mensagens

Evento clicável (`type:'clutch'`, produção x3 por 20 s), com 5 variações de LoL sorteadas: **Roubo de Barão**, **Teamfight**, **Flash salvador**, **Pentakill** e **Alma do dragão**. Conquistas novas: *Contratação de peso*, *Cinco reais*, *Mala pronta* (importado), *Estrela de 95*, *Subimos!*, *Passaporte carimbado*, *Campeões do meio do ano*, *Rumo ao Mundial*, *Campeões do Mundo*, *Split perfeito*. O botão grande da aba Time passou a se chamar **Farmar** (tema LoL).

> Nota: a economia semanal em R$ (docs/ESPORTS_ECONOMIA.md) substitui os preços, salários, reservas reais e o relógio interno da Liga descritos aqui; a lógica de elegibilidade e a lista de jogadores continuam valendo. O simulador desta seção foi trocado por `tests/sim_esp.js`.

## 7. Balanceamento e simulação

Mudanças de números (o jogo-base fechava em ~1 h com o simulador abaixo, bem antes das 2,5 h do projeto original, então foi preciso alongar): custos base dos 10 itens de **Treino tático em diante** x5,1 (x3 e depois x1,7, sem mudar a progressão de crescimento `g`); Titular, Reserva e Coach ficam iguais (o começo do jogo não muda). Fecha-se agora no **título mundial**, que depende de força do time (elenco + estrutura), não só de renda.

Simulador (`tests/sim.js`): roda o **motor real** no jsdom com um jogador sintético ativo (2 toques/s, toca todos os eventos, decide a cada 1 s): compra o que tem menor payback entre itens, titulares/reservas reais e, quando o melhor payback passa de 15 min, passa para a **fase de estrelas** (compra o jogador de maior ganho de nota que consegue pagar, trocando importados mais fracos). Uso: `node tests/sim.js <região> <nº de sementes> <limite em horas>` (opcional `v` para tabela de força/renda, `DUMP=1` para o elenco final, `SEED0=n` para outras sementes).

Resultados (tempo de jogo ativo até o **título mundial**, em horas; 8 sementes no Brasil e 3 nas demais):

| Região | Mín | Mediana | Máx |
|---|---:|---:|---:|
| Brasil | 2,55 | 2,9 | 3,07 |
| América do Norte | 2,72 | 2,74 | 3,23 |
| Europa | 2,66 | 2,89 | 3,02 |
| Coreia | 3,03 | 3,06 | 3,07 |
| China | 2,97 | 3,03 | 3,44 |
| Ásia-Pacífico | 2,56 | 2,75 | 2,95 |

Marcos típicos (Brasil): inscrição na T2 ~1 min; promoção à T1 ~42 min; 1º MSI ~48 min; 1º Mundial ~50 min; título do MSI ~70 a 90 min; título mundial ~2,9 h. A força do jogador sintético chega a ~99 em 1 h e ~104 em 2 h (máximo teórico no Brasil ~109 com 2 importados de nota 92+; Coreia ~117).

Limites da simulação: o jogador real escolhe melhor (ou pior) o elenco; é provável uma distribuição de 2 a 4 h. Sem a regra de "moral" a cauda passava de 7 h.

## 8. Save

`localStorage['miniidle-v2']`, mesma chave. Campos novos por jogo: `tabs.mercado = {s:[{id,paid,imp}|null x5], b:[... x2]}`, `tabs.liga = {...}` (estado da liga, semente, troféus, log), `sh` (`region`, `division`, `intl`, `avg5`, ...) e `mu` (multiplicadores permanentes); `tab[jogo]` guarda a aba aberta. **Migração**: um save anterior sem esses campos abre com região **Brasil**, divisão **T2** e elenco vazio (se o jogo já tinha progresso; num jogo realmente novo a região é perguntada). Dados inválidos (ids que não existem, tipos errados) são ignorados.

## 9. Testes

`node tests/tabs_api.js` (API de abas), `node tests/esp_logic.js` (Mercado, Liga, prestígio, contrato, migração), `python3 tests/e2e.py` (Playwright + Chrome, 390x780 e 360x640, capturas em `tests/shots/`) e `node tests/sim_esp.js` (balanceamento semanal). `tests/boot.js` usa o jsdom de `/tmp/t/node_modules` (ajuste o caminho se necessário).
