# ESPORTS_ECONOMIA.md - Nova economia do "Time de eSports"

Substitui a seção 4 de `DESIGN.md` (itens-que-produzem) e a parte de balanceamento do eSports na seção 5. Os outros dois jogos (Lan House, Caverna) não mudam.
Tudo aqui é implementável em JS puro. Os números vêm da simulação da seção 8 (rodada de verdade, 9 sementes por perfil).

## 0. Resumo em 10 linhas

1. **Acabou o botão de clicar.** Não existe mais `ps` (produção por segundo). O dinheiro (R$) entra e sai **uma vez por semana de jogo**.
2. **Semana = 40 s** (barra de progresso). Cada semana tem 1 jogo (ou 1 rodada de série), 1 **Foco** e, de vez em quando, 1 **Evento** com 2 escolhas.
3. **Foco da semana**: 7 opções (treino, conteúdo, descanso, scrims, imprensa, negociar, bootcamp). Um toque. Se o jogador não tocar, o foco anterior se repete (ou o **Piloto automático** escolhe).
4. **Recursos**: R$ (caixa), Fama (0-1000), Seguidores, Moral (0-100). Mais 3 efeitos temporários (forma, scrim, lesão). Nada além disso.
5. **Receitas**: patrocínio (contratos que o jogador aceita ou recusa), redes sociais, direitos de TV por divisão, premiações em blocos (split, MSI, Mundial), loja/camisa, bilheteria, venda de jogador.
6. **Gastos**: salários (reais caros, por nota e idade), staff, manutenção da estrutura, viagens (MSI/Mundial), bootcamp e scrims.
7. **Falência amena**: aviso amarelo (caixa para 4 semanas), vermelho (2 semanas); se o caixa fechar negativo a diretoria vende 1 jogador a 70% do preço e o jogo segue. Nunca se perde o save.
8. **Offline**: o jogo simula as semanas que passaram (até 4 h, 90% de eficiência) no Piloto automático. Sem eventos offline e sem compras. Se o caixa ficar baixo, o time entra em "recesso" (para de simular), nunca em prejuízo.
9. **Tempos (perfil ativo, com Mercado)**: 5 titulares em 6 min, promoção em 33 min, 1ª vaga internacional em 50 min, 1º patrocínio grande (Banco) em 1,1 h, título do MSI em ~2 h, **título mundial em 3,3 h** (p25-p75: 2,7-3,5 h). Casual (3 min a cada 30 min): **4,2 h**. Ocioso (1 min por hora): 5,0 h. Sem estrelas do Mercado: 4,8 h (ativo), nunca trava.
10. **Nova temporada** depois do título: reinicia na T2 com bônus permanente; a 2ª volta leva ~1,1 a 1,9 h.

### 0.1 O que acontece com os 13 itens atuais

O array `o[]` (13 inteiros + 1 novo) continua existindo porque a cena `scenes/esp.js` lê dele. Mas a maioria deixa de ser "produtor" e vira **compra de estrutura em R$** ou **espelho visual** (preenchido por plugin via `api.setOwned`).

| `o[i]` | id | Antes | Agora | Máx | Custo (R$) | Efeito |
|--:|---|---|---|--:|---|---|
| 0 | `tit` | Titular (produz) | **Titular amador** (compra) | 5 | 800 x1,5^n (800; 1,2 mil; 1,8 mil; 2,7 mil; 4,1 mil) | nota 58 + 2 por nível de Treino + 1 por nível de Gaming house; salário R$ 150/sem. Jogador real do Mercado ocupa a vaga. |
| 1 | `res` | Reserva (produz) | **Reserva amador** | 2 | 6 mil x3^n | salário R$ 80/sem; reduz pela metade a penalidade de lesão (efeito pequeno, não simulado) |
| 2 | `coach` | Coach | **Coach** (staff) | 1 | 70 mil | +1,5 força; forma do Treino x1,4; salário R$ 2.500/sem |
| 3 | `treino` | Treino tático | **Centro de treino** | 6 | 12 mil x3,3^n | +1,0 força por nível; Amadores +2 nota por nível |
| 4 | `house` | Gaming house | **Gaming house** | 6 | 48 mil x3,5^n | +0,8 força por nível; Amadores +1 nota por nível; alvo de moral +3 por nível |
| 5 | `equip` | Equipamento | **Equipamento** | 5 | 190 mil x3,7^n | +0,8 força por nível |
| 6 | `anal` | Analista | **Analista** (staff) | 1 | 1,1 mi | +1,5 força; scrim +1; forma x1,2; salário R$ 4.000/sem |
| 7 | `patro` | Patrocínio (nível) | **espelho** (`auto`) | 6 | - | nível do maior contrato ativo (1 a 6 = Padaria... Aurora Global) |
| 8 | `canal` | Canal do time | **espelho** (`auto`) | 6 | - | nível de seguidores: 100, 1 mil, 10 mil, 100 mil, 1 mi, 5 mi |
| 9 | `psi` | Psicólogo | **Psicólogo** (staff) | 1 | 4,8 mi | +1,5 força; alvo de moral +5; derrota tira metade da moral; descanso +3; salário R$ 4.500/sem |
| 10 | `fa` | Fã-clube | **espelho** (`auto`) | 6 | - | nível de Fama: limiares 5, 15, 60, 150, 320, 550 |
| 11 | `arena` | Arena própria | **Arena própria** | 4 | 240 mil x4^n | bilheteria R$ 6 mil, 18 mil, 60 mil, 180 mil por semana (x(0,4+0,6 x vitórias%)); loja +25% por nível; **só na liga principal** |
| 12 | `titulo` | Sala de troféus | **espelho** (`auto`) | 6 | - | `min(6, promoção(1) + min(3, MSI) + 2 se campeão mundial)` |
| 13 | `smm` | (novo) | **Social media** (staff) | 1 | 480 mil | seguidores e publi x1,5; imprensa x1,5; salário R$ 2.000/sem |

Itens `auto` não têm linha de compra. Os níveis 5-6 de Treino/House/Equip são sumidouros de fim de jogo (somam R$ 6,7 mi, 35 mi e 49 mi); uma run típica para no nível 3-5.

---

## 1. Recursos e fórmulas semanais

Unidade de tempo: **semana de 40 s** (`WK = 40`). Todas as fórmulas abaixo rodam uma vez por semana, na ordem da seção 1.6.

### 1.1 Os quatro recursos

| Recurso | Faixa | Início | Para que serve |
|---|---|---|---|
| **R$ (caixa)** | pode ficar negativo só dentro da semana | 3.000 | compra tudo; salários saem dele |
| **Fama** (F) | 0 a 1000 | 0 | libera patrocinadores e vagas de contrato, loja, "Estrela" |
| **Seguidores** (seg) | 50 a 8 mi | 120 | renda de redes sociais |
| **Moral** (M) | 0 a 100 | 60 | soma de -6 a +6 na força do time |

Efeitos temporários (não são recursos): **forma** (+força por N semanas), **scrim** (+força no próximo jogo), **lesão** (-força por N semanas). Um de cada por vez; o maior vale.

Níveis de Fama (texto na tela): 0 Desconhecido, 5 Conhecido, 15 Em alta, 60 Famoso, 150 Estrela, 320 Lenda, 550 Ícone.

### 1.2 Força do time (S)

```
S = A + I + St + Mo + forma + scrim - lesão + pity
A  = média das 5 notas dos titulares (vaga vazia = 40; Amador = 58 + 2*treino + 1*house; real = nota do jogador)
I  = 1,0*treino + 0,8*house + 0,8*equip            (máx 14,8)
St = 1,5 * (coach + analista + psicólogo)            (máx 4,5)
Mo = clamp((M - 50) / 8, -6, +6)
pity = min(6, 1,0 * falhas seguidas naquele torneio)  (promoção, MSI e Mundial contam separado)
Estrela = soma de max(0, nota - 80) dos titulares reais   (5 titulares nota 88 = 40)
```

### 1.3 Ganhos por semana (copiar para o código)

```
bruto   = (TV + patrocínio + social + loja + bilheteria) * (1 + 0,05 * min(🌟, 16)) + prêmios
despesa = salários + salário do staff + 0,4% * investido_em_estrutura + viagem + custo do foco
caixa  += bruto - despesa

TV        = 900 (fase "Rankeada") | 1.500 (T2) | 9.000 (T1)    +30.000 em semana de MSI/Mundial
social    = 0,30 * seg^0,75 * (1 + 0,5*smm) * (1 + Estrela/40) * (1,5 se foco = Conteúdo)
loja      = 5 * F^1,2 * (1 + 0,25*arena)
bilheteria= arenaRev[arena] * (0,4 + 0,6*WR)      WR = % de vitórias nas últimas 8 partidas (só em T2/T1)

seguidores: cap = min(8 mi, 2000 * (1+F)^1,5)
  seg += (0,02*seg + 20) * (1 + Estrela/25) * (1 + 0,5*smm) * (3 se Conteúdo) * (1,3 se venceu o jogo) * max(0, 1 - seg/cap)
  se seg > cap: seg -= 0,2% * seg
fama:     F = clamp(0..1000)( F*0,997 + ΔF + 0,004*Estrela )      (ΔF de Imprensa/Bootcamp é multiplicado por (1 - F/1000); os demais ganhos da 1.4 entram direto)
moral:    M += (alvo - M)*0,08 + efeitos;  alvo = 55 + 3*house + 5*psicólogo
          vitória +2 (T1) / +1,5 (T2);  derrota -2,5 (-1,25 com psicólogo);  contratar titular real: -6 (entrosamento)
```

Exemplos de `social` por semana (sem bônus): seg 10 mil = R$ 300; 100 mil = R$ 1.700; 1 mi = R$ 9.500; 5 mi = R$ 31 mil. Com 5 titulares nota 88 (Estrela 40) e smm, multiplique por 3,0.

### 1.4 ΔFama por evento

| Evento | ΔF | Evento | ΔF |
|---|--:|---|--:|
| vitória T2 | +0,5 | classificar para o MSI | +8 |
| vitória T1 | +1,0 | classificar para o Mundial | +15 |
| derrota T1 | -0,2 | rodada de MSI vencida | +3 |
| promoção (acesso) | +20 | rodada de Mundial vencida | +5 |
| foco Imprensa | +2,5 x (1+Estrela/60) x (1+0,5 smm) | título do MSI | +50 |
| foco Bootcamp | +2 | título do Mundial | +120 |

### 1.5 Pontos de Lenda (PL) e troféus (alimentam a Nova temporada, seção 7)

+1 promoção, +1 classificar para o MSI, +2 classificar para o Mundial, +4 título do MSI, +10 título do Mundial. Acumulam para sempre.

### 1.6 Ordem de processamento de uma semana (`closeWeek`)

1. **Foco**: aplica efeito e custo (seção 4).
2. **Partida**: `Liga.step` joga o jogo da semana (seção 5). Devolve `{win, kind, prize, fame}`.
3. **Receitas** (TV, patrocínio, social, loja, bilheteria, prêmios) e **despesas**.
4. **Seguidores, Fama, Moral**; `forma/lesão` perdem 1 semana.
5. **Patrocínio**: revisão de metas, renovações, ofertas novas, validade das ofertas.
6. **Evento** (25% por semana online, mínimo 4 semanas entre eventos, nunca offline).
7. **Alerta / resgate de caixa** (seção 3.4) e **salvar**.

---

## 2. Fontes de receita

### 2.1 Patrocínio (contratos)

Seis marcas fictícias, uma por nível (espelha `o[patro]`):

| Nível | Marca | Fama mín. | R$/sem | Prazo | Meta (vitórias nas últimas 8) | Só T1 |
|--:|---|--:|--:|--:|---|:-:|
| 1 | Padaria do Zé | 0 | 700 | 12 sem | nenhuma | não |
| 2 | Posto Tanque Cheio | 15 | 1.800 | 16 | 40% | não |
| 3 | Energético Raio Verde | 60 | 4.500 | 20 | 50% | não |
| 4 | Banco Faísca | 150 | 11.000 | 24 | 50% | sim |
| 5 | Periféricos Nexa | 320 | 26.000 | 26 | 60% | sim |
| 6 | Aurora Global | 550 | 60.000 | 40 | 65% | sim |

Valor da oferta = base x sorteio(0,90 a 1,15) x fator de região (BR/AP 1,0; NA/EU 1,1; CN/KR 1,2).

**Slots ativos (N)**: `1 + (F >= 60) + (F >= 320)`, máximo 3.

**Ofertas**: a cada 4 semanas, se o quadro tem menos de 3 ofertas, entra uma nova. O tier sai dos **3 maiores liberados** pela Fama, com pesos 50/30/20. Cada oferta vale por 4 semanas (o relógio da oferta só corre online). Foco **Negociar** e o evento "Proposta relâmpago" criam ofertas extras. Depois de promoção, título e classificação internacional, a Fama sobe e os tiers novos aparecem sozinhos.

**O jogador ACEITA ou RECUSA** (card com marca, R$/sem, prazo, meta, multa):
- Aceitar: paga **luvas de 2x o valor semanal** na hora. Sem slot livre, o botão vira "Trocar": escolhe qual contrato rescindir (multa 2x o valor dele).
- Recusar: a oferta some.
- Aviso na tela antes de aceitar quando a meta está acima da vitória esperada: "Meta 60% - seu time vence ~48%. Risco de multa."

**Revisão a cada 8 semanas** (olhando os últimos 8 jogos de split, mínimo 4):
- Passou: valor integral.
- Falhou a 1ª vez: **aviso** e valor x0,7 nas próximas 8 semanas ("Banco Faísca está de olho em vocês").
- Falhou 2 revisões seguidas: **contrato cancelado e multa de 2x o valor semanal**.

**Fim do prazo**: bônus de renovação de **3x o valor semanal**. Renova sozinho com +10% (teto 1,6x a base do tier), a menos que já exista um tier maior liberado (aí o slot fica livre para a oferta melhor). Opção "Renovação automática" nas configurações do plugin.

### 2.2 Redes sociais

Seguidores crescem sozinhos (fórmula 1.3) e pagam `social` por semana. Quem faz render:
- **Foco Conteúdo**: crescimento x3 e publi x1,5 na semana.
- **Jogador famoso**: `Estrela` multiplica crescimento (1+E/25) e publi (1+E/40). Cinco titulares de nota 88 triplicam a renda de redes.
- **Social media** (staff, 480 mil): x1,5 em crescimento, publi e Imprensa.
- **Eventos**: viral, polêmica, collab (seção 6) mexem em % de seguidores.

### 2.3 Premiações em blocos

| Marco | Prêmio (R$) |
|---|--:|
| Fim de split T2 | 1.500 x vitórias; +6.000 se 5V ou mais |
| Promoção (série de acesso vencida) | 30.000 |
| Fim de split T1 | 4.000 x vitórias; +15.000 se classificou (6V ou mais) |
| MSI: cada rodada vencida | 25.000 |
| MSI: eliminado | 40.000 (consolação) |
| MSI: título | 200.000 |
| Mundial: cada rodada vencida | 50.000 |
| Mundial: eliminado | 100.000 |
| Mundial: título | 1.200.000 |

### 2.4 Outras

- **Direitos de transmissão por divisão**: TV semanal na fórmula 1.3 (R$ 900 / 1.500 / 9.000; +30.000 em semanas de MSI/Mundial).
- **Loja/camisa e bilheteria**: fórmula 1.3. Bilheteria só depois da Arena.
- **Venda de jogador**: dispensar no Mercado devolve **60%** do preço pago; o evento "Proposta por jogador" paga **130%**; o resgate da diretoria paga **70%**. Nunca dá lucro sozinho (ninguém "valoriza"), a não ser pelo evento.

Mix de receita medido na simulação (ativo, até o título): patrocínio 42%, redes sociais 24%, premiações 16%, TV 10%, loja 5%, bilheteria 2%. Despesas somam 24% da receita bruta.

---

## 3. Gastos

### 3.1 Salários

```
salário/sem = R$ 700 * e^(0,20 * (nota - 74)) * idade * região * (1,25 se importado)      (2 algarismos significativos)
preço       = R$ 70.000 * e^(0,30 * (nota - 74)) * idade * região * (1,5 se importado)
idade (salário): <=21 x0,8 | 22-27 x1,0 | >=28 x1,1
idade (preço):   <=21 x1,3 | 22-24 x1,1 | 25-27 x1,0 | 28-29 x0,8 | >=30 x0,65
região (preço e salário): BR 0,85 | AP 0,85 | NA 1,0 | EU 1,0 | CN 1,15 | KR 1,2
```

Amador: R$ 150/sem (titular), R$ 80/sem (reserva). Passagem de ano: jogador com 23 anos ou menos ganha +1 de nota (máx 96); com 31 ou mais perde 1; todos envelhecem 1 ano.

| Nota (25 anos, BR, liga própria) | Preço | Salário/sem |
|--:|--:|--:|
| 75 | R$ 80 mil | 730 |
| 78 | R$ 200 mil | 1.300 |
| 80 | R$ 360 mil | 2.000 |
| 83 | R$ 890 mil | 3.600 |
| 85 | R$ 1,6 mi | 5.400 |
| 88 | R$ 4,0 mi | 9.800 |
| 90 | R$ 7,2 mi | 15 mil |
| 92 | R$ 13 mi | 22 mil |
| 95 | R$ 32 mi | 40 mil |

Exemplos reais (time BR): Kaze (83, 20 anos) R$ 1,2 mi; Faker (91, 30 anos) R$ 9,5 mi e R$ 25 mil/sem; Keria (93, 24) R$ 29 mi; Chovy (96, 25) R$ 66 mi e R$ 61 mil/sem (objetivo de sonho, ninguém compra na primeira volta). As regras de disponibilidade do Mercado (T2 só os 40% mais fracos da liga própria; T1 libera a liga toda; até 2 importados; LCK e LPL só depois de disputar torneio internacional) **não mudam**.

### 3.2 Staff e estrutura

| Item | Compra (R$) | Salário/sem |
|---|--:|--:|
| Coach | 70 mil | 2.500 |
| Social media | 480 mil | 2.000 |
| Analista | 1,1 mi | 4.000 |
| Psicólogo | 4,8 mi | 4.500 |
| Estrutura (Treino, House, Equip, Arena) | tabela 0.1 | **manutenção 0,4% do total investido por semana** |

### 3.3 Viagem, bootcamp, scrims

- **Viagem**: R$ 12.000 por semana de MSI; R$ 30.000 por semana de Mundial.
- **Bootcamp** (foco): R$ 25.000.
- **Scrims** (foco): R$ 600 na T2, R$ 1.800 na T1.
- O "U" dos eventos = receita bruta média das últimas 4 semanas (mínimo R$ 1.500); custos de evento são em múltiplos de U para escalar com o jogo.

### 3.4 Falência amena: avisos e resgate

**Saldo semanal previsto** (`bruto médio - despesa`) aparece sempre no HUD (verde/vermelho). Se for negativo:

| Condição | Aviso |
|---|---|
| caixa < 4 x \|saldo\| | **Amarelo** (faixa no topo): "Caixa para 3 semanas. Troque para Conteúdo ou venda um jogador." |
| caixa < 2 x \|saldo\| | **Vermelho** + vibração leve: "Caixa para 1 semana! A diretoria vai intervir." |
| antes de contratar/comprar algo que torne o saldo negativo com caixa < 8 x \|novo saldo\| | **Confirmação**: "Seu caixa vai cair R$ 31 mil por semana. Dá para ~2 semanas. Continuar?" |

**Resgate (caixa < 0 no fim da semana)**, nesta ordem, só uma vez por semana:
1. A diretoria **vende o jogador real de maior salário** por 70% do preço pago; ele vira Amador; moral -8.
2. Sem jogador real: **dispensa um staff** (maior salário primeiro; sem reembolso).
3. Se ainda negativo: **"A diretoria cobriu o rombo"**: caixa = R$ 3.000.

Texto: "A diretoria vendeu Fulano por R$ X para fechar as contas. Ele deixa saudades e um buraco na defesa." Conquista "Vendeu o craque" (sem punição, só brincadeira). O save **nunca** é apagado nem o progresso de divisão/troféus.

**Piso anti-espiral**: o time mais pobre possível (5 Amadores, sem staff) gasta R$ 750/sem e recebe TV R$ 900 (rankeada) ou R$ 1.500 (T2): sempre positivo. Não existe estado sem saída.

**Offline**: a simulação para ("recesso") quando o caixa fica abaixo de 2 x despesa semanal. Nunca há resgate offline.

---

## 4. FOCO DA SEMANA

Um toque em um cartão define o foco da **próxima** semana (a barra atual continua). Sem toque, repete o anterior. Cartão "Auto" liga o Piloto automático.

| Foco | Texto do cartão (curto) | Efeito | Custo | Cooldown |
|---|---|---|--:|--:|
| 🏋️ **Treino pesado** | "Time afiado. +força por 3 semanas." | forma **+2,5 x (1 + 0,4 coach + 0,2 analista)** por 3 semanas (até 4,0 com Coach e Analista); moral -2 (-1 com psicólogo) | 0 | - |
| 🎥 **Conteúdo e lives** | "Seguidores x3 e mais publi." | crescimento de seguidores x3 e `social` x1,5 na semana; moral -1 | 0 | - |
| 😴 **Descanso** | "Moral +10. O time agradece." | moral **+10** (+3 com psicólogo); sem forma | 0 | - |
| 🎯 **Scrims** | "Próximo jogo +3 de força." | scrim **+3 (+1 com analista)** no jogo/rodada da semana; moral -0,5 | R$ 600 (T2) / 1.800 (T1) | - |
| 🎤 **Imprensa** | "Fama +2,5. Fale bonito." | ΔF = 2,5 x (1 + Estrela/60) x (1 + 0,5 social media) | 0 | 2 sem |
| 🤝 **Negociar** | "Chega uma oferta de patrocínio (+15%)." | cria 1 oferta (3 maiores tiers liberados, valor +15%); se o quadro já tem 3, a mais antiga sai | 0 | 3 sem |
| 🏕️ **Bootcamp** | "Força +4 por 4 semanas. Ocupa 2 semanas." | forma **+4 x (1 + 0,4 coach + 0,2 analista)** por 4 semanas; moral +8; Fama +2; a 2ª semana mantém a forma (>= 3) e dá moral +2 | R$ 25.000 | 8 sem |

Regras:
- **Bootcamp** só na liga principal (T1). Ocupa 2 semanas (80 s) e só fica ativo com caixa >= R$ 30 mil + 3 semanas de despesa.
- Foco indisponível (cooldown/caixa) fica cinza com o motivo ("Pronto em 2 sem"). Se o foco escolhido ficou indisponível no início da semana, vira **Conteúdo**.
- **Sinergia**: Coach e Analista aumentam Treino/Bootcamp e Scrims; Psicólogo melhora Treino (menos cansaço) e Descanso; Social media melhora Conteúdo e Imprensa; jogador famoso melhora Conteúdo e Imprensa (Estrela).
- Nenhum foco sozinho vence: a simulação (seção 8) mostra que rodar um único foco o tempo todo leva 5,0 a 6,6 h até o título contra 3,5 h do misto.

### 4.1 Piloto automático (offline e jogador "deixa rendendo")

Ordem das regras, a cada semana: (1) moral < 40: **Descanso**; (2) caixa para menos de 4 semanas: **Conteúdo**; (3) 1ª rodada de MSI/Mundial, bootcamp pronto e caixa >= 30 mil + 3 semanas de despesa: **Bootcamp**; (4) série em andamento: **Scrims**; (5) forma < 3 ou expirada: **Treino**; (6) semana par e Imprensa pronta: **Imprensa**; (7) senão alterna **Conteúdo**/**Treino**. Além disso aceita ofertas "seguras" (vitória esperada >= meta + 7 pontos) e renova contratos. Compras, trocas de contrato e eventos ficam para o jogador.

### 4.2 O que um jogador ativo faz (heurística usada na simulação)

Moral < 42: Descanso. 1ª rodada de MSI/Mundial: Bootcamp (se pode). Em série ou no último jogo do split: Scrims. Quadro de ofertas vazio e slot livre: Negociar. Caixa < 4 semanas: Conteúdo. Imprensa pronta e Fama < 450: Imprensa. Forma acabando: Treino. Senão: Conteúdo.

---

## 5. Resultado de partidas, splits e torneios

### 5.1 Modelo (igual ao plugin Liga, com semente estável)

```
P(vitória no jogo) = 1 / (1 + 10^((adversário - S) / 16))
u = mix(seed, semana, jogo)    // hash 32 bits; mesma entrada = mesmo resultado (recarregar a página não rerrola)
vence se u < P
```

`mix` em JS (idêntico ao da simulação):

```js
function mix(a, b, c) {
  var x = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519) + 0x9E3779B9) >>> 0;
  x = Math.imul(x ^ (x >>> 15), 2246822507) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489909) >>> 0;
  return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
}
```

Como `u` não depende do foco, mudar o foco **muda a chance, mas não permite "rolar de novo"**.

### 5.2 Calendário (1 jogo ou 1 rodada por semana)

| Fase | Duração | Adversários (força) | Regra |
|---|--:|---|---|
| Rankeada (antes da inscrição) | até ter 5 titulares | - | só renda de live; sem jogo |
| T2, split | 8 semanas | 47, 50, 53, 55, 57, 60, 63, 59 | 3 pontos por vitória |
| Série de acesso | 1 semana | Bo5 vs 66 | precisa de **>= 5V no split e S(promoção) >= 68** (S inclui pity) |
| T1, split 1 | 9 semanas | 60, 64, 68, 71, 74, 77, 80, 83, 86 | **>= 6V (18 pontos)** classifica para o MSI |
| MSI | até 3 semanas | Quartas Bo3 vs 88; Semi Bo5 vs 95; Final Bo5 vs 102 | cada rodada = 1 semana |
| T1, split 2 | 9 semanas | igual | **>= 6V ou 33 pontos somados no ano** classifica para o Mundial |
| Mundial | até 4 semanas | Oitavas Bo3 vs 98; Quartas Bo5 vs 105; Semi Bo5 vs 112; Final Bo5 vs 118 | cada rodada = 1 semana |
| Fim de ano | 0 | - | idade +1, evolução de nota, pontos do ano zerados |

Mudanças em relação ao plugin atual (`esp-liga.js`): adversários de MSI/Mundial sobem (antes 80/86/92 e 88/94/100/105), `pity` passa a **1,0 por falha até 6** (antes 1,5 até 6, só para MSI/Mundial; agora vale também para a promoção), e o plugin **perde o seu relógio interno** (`cd`, `matchT`, `breakT`): quem chama `step` é a Semana.

### 5.3 Série (Bo3/Bo5)

Joga-se jogo a jogo na mesma semana com `u = mix(seed, semana, 10+n)` até alguém chegar a 2 (Bo3) ou 3 (Bo5). Perdeu a rodada: eliminado, recebe a consolação; ganhou: segue na semana seguinte. A força usada inclui forma, scrim e pity.

### 5.4 Como a força vira dinheiro e fama

Vitória no split: +fama (0,5/1,0), +moral, +30% de crescimento de seguidores na semana, mais WR para metas de patrocínio e bilheteria. Fim de split: prêmio em bloco (2.3). Torneio internacional: fama, prêmio por rodada, TV +30 mil/sem, contratos novos de tier alto (a Fama sobe e libera Banco/Nexa/Aurora) e PL.

Referência (chance de ser campeão na temporada, S efetiva = base + forma + scrim + pity): MSI: S 100 = 28%, 104 = 57%, 108 = 82%. Mundial: S 108 = 1%, 112 = 7%, 114 = 14%, 116 = 26%, 118 = 41%, 120 = 56%. O jogador ativo chega ao título com S base ~ 100 a 105 mais forma (até 4), scrim (até 4) e pity (até 6).

---

## 6. Eventos semanais (15)

**Quando**: depois da inscrição na T2, 25% de chance por semana online, mínimo 4 semanas entre eventos; escolhido ao acaso entre os que cumprem a condição. A barra da semana **pausa** enquanto o diálogo está aberto. Offline não há eventos. `U` = receita bruta média das últimas 4 semanas (mín. R$ 1.500). "Força -3 por 3 sem" = lesão (penalidade de força). A 1ª opção listada é a "segura".

| # | Condição | Texto | Opção A | Opção B |
|--:|---|---|---|---|
| 1 | seg > 1.500 | **Polêmica no Twitter.** "O suporte tuitou 'o jogo tá fácil' às 3 da manhã. O print já virou figurinha." | **Pedir desculpas**: moral -2, Fama -1 | **Dobrar a aposta**: 50%: seguidores +10%, Fama +2, +0,5 U; 50%: Fama -4, -0,5 U, moral -3 |
| 2 | seg > 800 | **Clipe viral.** "O atirador errou o flash e o vídeo bombou. Metade ri, metade chora." | **Impulsionar com anúncio** (-0,3 U): seguidores +12%, Fama +2 | **Deixar orgânico**: seguidores +4% |
| 3 | 5 titulares | **Lesão.** "O meio sentiu o punho depois de 9 horas de rankeada. O fisio usou a palavra 'repouso'." | **Jogar machucado**: força -3 por 3 sem (30%: -6) | **Fisio e reserva** (-0,3 U): força -1,5 por 2 sem |
| 4 | Fama >= 15 | **Proposta relâmpago.** "Uma marca mandou DM às 23h47: 'bora fechar?'. Parece urgente. Parece." | **Fechar na hora**: oferta do maior tier liberado, +25% de valor, meta +10 pontos | **Negociar mais**: 50%: oferta +45%; 50%: a marca some |
| 5 | T1 | **Convite de bootcamp.** "Um time coreano chamou vocês para Seul. Kimchi incluso." | **Aceitar** (-1,0 U): forma +4 por 4 sem, moral +6, Fama +1 | **Recusar**: moral +1 ("Vamos ficar em casa treinando o que sabemos") |
| 6 | em jogo | **Rivalidade.** "O rival disse na live que vocês 'só ganham por sorte'. A sorte está de camisa do seu time." | **Responder em campo**: próximo jogo +3 de força, Fama -0,5 | **Postar meme**: seguidores +5%, Fama +1, moral +2 |
| 7 | em jogo | **Vazamento de scrim.** "O scrim vazou no Discord. O rival já sabe o que o seu atirador vai pickar." | **Mudar o draft** (-0,3 U): forma +2 por 2 sem | **Fingir que não viu**: força -2 por 2 sem |
| 8 | 5 titulares | **Treta na gaming house.** "A discussão sobre quem esqueceu a louça virou 'conversa séria'." | **Chamar o psicólogo** (-0,2 U): moral +5 (+9 se tiver psicólogo) | **Deixar resolver sozinhos**: 60%: moral +6; 40%: moral -10 |
| 9 | seg > 3.000 | **Collab com streamer.** "Um streamer famoso quer jogar uma ranked com vocês. E aparecer no seu canal." | **Aceitar collab** (-0,3 U): seguidores +15%, Fama +2 | **Cobrar cachê**: +0,8 U, seguidores +3% |
| 10 | T1 | **Reality show.** "A liga propôs 'Bastidores da Gaming House'. A câmera entra até na cozinha." | **Participar**: +1,2 U, moral -5 | **Recusar**: moral +2, Fama +0,5 |
| 11 | tem jogador real | **Proposta por jogador.** "Um clube rival ofereceu 1,3x o que você pagou pelo seu menos estrelado. Ele está lendo com muito interesse." | **Vender**: +1,3 x o preço pago; vira Amador; moral -3 | **Recusar**: moral +4 |
| 12 | Fama >= 5 | **Vaquinha da torcida.** "A torcida fez uma rifa para comprar mouses novos. O prêmio é um churrasco." | **Aceitar a rifa**: +0,8 U, Fama +1 | **Agradecer e recusar**: Fama +2, moral +2 |
| 13 | tem contrato | **Ação do patrocinador.** "O patrocinador quer foto de todos segurando o produto. Sorrindo!" | **Fazer a ação**: +0,6 U, moral -3 | **Recusar educadamente**: 25%: -0,3 U (marca chateada) |
| 14 | em jogo | **A internet caiu.** "Minutos antes do scrim. A operadora disse que 'é normal'." | **Fibra dedicada** (-0,4 U): força +1 por 6 sem | **Jogar no 4G**: 50%: força -3 por 1 sem |
| 15 | tem staff | **Rival tenta roubar o staff.** "Chegou uma proposta 'irrecusável' para o seu coach (e um salário com dois dígitos a mais)." | **Cobrir a oferta** (-0,5 U): nada muda | **Deixar ir**: perde 1 membro do staff (recontratar custa de novo), +0,3 U |

Nenhuma opção domina: as arriscadas têm esperança de ganho parecida, só com variância. Na simulação o jogador ativo escolhe pela tabela `bot` e os 30 a 44 eventos de uma run não quebram o balanceamento.

---

## 7. Prestígio: Nova temporada

**Quando**: botão no Time depois de **1 título mundial** ou **PL >= 10**.

**Hall da Fama (🌟)** = `floor(PL / 10)` (PL acumulados em todas as temporadas; mínimo 1 ao ser campeão mundial). Cada 🌟: **+5% em toda renda** (TV, patrocínio, social, loja, bilheteria; teto 16 🌟 = +80%) e **+100% do caixa inicial** por 🌟 (R$ 3.000 x (1+🌟)).

| Persiste | Zera |
|---|---|
| 🌟 e PL; troféus (`promo`, `msi`, `wd`) e histórico; conquistas; região; configurações | caixa (volta a 3.000 x (1+🌟)); divisão (volta à Rankeada/T2); estrutura (Treino, House, Equip, Arena); staff; contratos e ofertas; moral; calendário e pity |
| **Camisa aposentada**: o titular real de **maior nota** continua no elenco (salário continua) | os demais jogadores reais saem do elenco (sem devolução) |
| 25% da Fama e 25% dos seguidores | 75% da Fama e dos seguidores |

Resultado simulado: a 2ª volta leva **1,1 a 1,9 h** (média 1,5 h; ~45% da 1ª volta) e a graça é buscar mais títulos (cada Mundial = +10 PL).

---

## 8. Metas de tempo e simulação

### 8.1 Metas e resultado

| Meta | Alvo | Simulado |
|---|---|---|
| Título mundial, jogador ativo (com Mercado) | 2,5 a 3,5 h | **3,3 h** (p25 2,7 h, p75 3,5 h) |
| Título mundial, casual (3 min a cada 30 min) | ~4 h | **4,2 h** |
| Título mundial, ocioso (1 min por hora) | - | 5,0 h |
| Sem estrelas do Mercado (ativo / casual / ocioso) | sem parede | 4,8 h / 5,8 h / 7,7 h |
| Marcos do ativo | - | 5 titulares 6 min; promoção 33 min; 1ª vaga internacional 50 min; 1º Banco 1,1 h; MSI 2,0 h |
| Caixa mínimo em todas as runs | > 0 | R$ 1.539 (nunca negativo) |
| Maior intervalo sem nada para comprar (ativo) | < 20 min | 12 a 15 min |
| Resgates da diretoria em runs normais | 0 | 0 |

Leituras importantes:
- **Dinheiro limita a 1ª metade; a 2ª metade é limitada por Fama e por resultado.** Ao fim, sobram R$ 2 a 4 mi no caixa (não há buraco de "não tenho o que comprar" até o título).
- **Casual e ocioso não perdem nada permanente**: só chegam depois (menos compras e sem foco tático).
- **Sem Mercado** o time usa Amadores evoluídos (nota até 76 com Treino 6 + House 6): fica ~1,5x mais lento e ganha o título com pity e variância.
- Regiões diferem pouco (BR 3,5 h, EU 2,9 h, KR 3,2 h; amostra pequena).

### 8.2 Código (Python 3, sem dependências)

Rodar: `python3 sim_esports.py js/data/jogadores.js` (usa os 280 jogadores reais, ~20 s).
O que modela: preço e salário por região (6 regiões), patrocínio com revisão/multa/troca, redes, premiações, 15 eventos, offline com Piloto automático e 90% de eficiência, resgate de caixa. **Não modela** (efeito pequeno): reservas, metas de temporada (recompensa), conquistas, loja de reservas.

```python
#!/usr/bin/env python3
# sim_esports.py - simulacao da nova economia do "Time de eSports" (Python 3, sem dependencias).
# Uso: python3 sim_esports.py [caminho/jogadores.js]   (padrao: js/data/jogadores.js)
import json, math, random, sys, copy

# ---------------------------------------------------------------- constantes (tabelas do doc)
C = dict(
    cash0=3000, seg0=120, moral0=60,
    WK=40,
    cd=dict(imprensa=2, negociar=3, bootcamp=8),
    gen=dict(c0=800, g=1.5, sal=150, nota=58, kT=2.0, kH=1.0),
    infra=dict(treino=(6, 12000, 3.3, 1.0), house=(6, 48000, 3.5, 0.8), equip=(5, 190000, 3.7, 0.8), arena=(4, 240000, 4.0, 0)),
    staff=dict(coach=(70000, 2500), anal=(1100000, 4000), psi=(4800000, 4500), smm=(480000, 2000)),
    staffS=1.5, upkeep=0.004,
    tv=dict(ranq=900, T2=1500, T1=9000), tvIntl=30000,
    travel=dict(msi=12000, worlds=30000),
    loja=5, lojaExp=1.2, arenaRev=[0, 6000, 18000, 60000, 180000],
    pubRate=0.30,
    P0=70000, kp=0.30, sal0=700, ks=0.20, agio=1.5, impSal=1.25, refund=0.6, importMax=2, lowFrac=0.4,
    reg={'BR': ('CBLOL', 0.85), 'NA': ('LCS', 1.0), 'EU': ('LEC', 1.0), 'KR': ('LCK', 1.2), 'CN': ('LPL', 1.15), 'AP': ('LCP', 0.85)},
    lg=dict(D=16, t2games=8, t1games=9, promoW=5, qualW=6, promoS=68, promoOpp=66, pity=1.0, pityMax=6,
            t2opp=[47, 50, 53, 55, 57, 60, 63, 59], t1opp=[60, 64, 68, 71, 74, 77, 80, 83, 86],
            msi=[(3, 88, 'Quartas'), (5, 95, 'Semifinal'), (5, 102, 'Final')],
            worlds=[(3, 98, 'Oitavas'), (5, 105, 'Quartas'), (5, 112, 'Semifinal'), (5, 118, 'Final')]),
    prize=dict(t2win=1500, t2bonus=6000, promo=30000, t1win=4000, t1bonus=15000, msiPart=40000, msiRound=25000, msiWin=200000,
               wdPart=100000, wdRound=50000, wdWin=1200000),
    fame=dict(t2win=0.5, t1win=1.0, t1loss=-0.2, msiRound=3, wdRound=5, promo=20, msiPart=8, wdPart=15, msiWin=50, wdWin=120, press=2.5, decay=0.997),
    tiers=[  # (marca, fama min, R$/sem, prazo, meta winrate, so T1)
        ('Padaria do Zé', 0, 700, 12, 0.0, False), ('Posto Tanque Cheio', 15, 1800, 16, 0.40, False),
        ('Energético Raio Verde', 60, 4500, 20, 0.50, False), ('Banco Faísca', 150, 11000, 24, 0.50, True),
        ('Periféricos Nexa', 320, 26000, 26, 0.60, True), ('Aurora Global', 550, 60000, 40, 0.65, True)],
    slotsF=(0, 60, 320), offerEvery=4, offerLife=4, offEff=0.9, maxAway=4 * 3600,
)

def load_players(path):
    s = open(path, encoding='utf8').read()
    return json.loads(s[s.index('['):s.rindex(']') + 1])

def r2(n):
    e = 10 ** max(0, int(math.floor(math.log10(n))) - 1)
    return max(1, int(round(n / e) * e))

def mix(a, b, c=0):  # hash estavel -> [0,1)  (em JS: Math.imul, igual ao mulberry32)
    x = (a * 374761393 + b * 668265263 + c * 2246822519 + 0x9E3779B9) & 0xFFFFFFFF
    x = ((x ^ (x >> 15)) * 2246822507) & 0xFFFFFFFF
    x = ((x ^ (x >> 13)) * 3266489909) & 0xFFFFFFFF
    return ((x ^ (x >> 16)) & 0xFFFFFFFF) / 4294967296.0

def winP(S, opp, D=16):
    return 1.0 / (1.0 + 10 ** ((opp - S) / D))

def ageP(a): return 1.3 if a <= 21 else 1.1 if a <= 24 else 1.0 if a <= 27 else 0.8 if a <= 29 else 0.65
def ageS(a): return 0.8 if a <= 21 else 1.0 if a <= 27 else 1.1

PL = None
def init_players(path):
    global PL, LOW
    PL = load_players(path)
    grp = {}
    for p in PL: grp.setdefault((p['l'], p['r']), []).append(p)
    LOW = set()
    for k, a in grp.items():
        a.sort(key=lambda p: (p['o'], p['id']))
        for p in a[:max(1, math.ceil(len(a) * C['lowFrac']))]: LOW.add(p['id'])

class Team:
    def __init__(s, seed, region='BR', market=True, stars=0, keep=None):
        s.seed = seed; s.rng = random.Random(seed); s.region = region; s.market = market; s.stars = stars
        s.R = C['cash0'] * (1 + stars); s.F = 0.0; s.seg = C['seg0']; s.M = C['moral0']
        s.slots = [0] * 5; s.lv = dict(treino=0, house=0, equip=0, arena=0); s.staff = dict(coach=0, anal=0, psi=0, smm=0)
        s.inv = 0.0; s.con = []; s.offers = []; s.div = 'ranq'; s.ph = 'split'; s.gi = 0; s.w = 0; s.l = 0; s.pts_y = 0
        s.yr = 1; s.sp = 1; s.ser = None; s.wk = 0; s.fail = dict(promo=0, msi=0, worlds=0); s.played_intl = False
        s.forma = (0, 0); s.scrim = 0; s.cdw = {}; s.last = []; s.focus = 'treino'; s.stats = {}; s.log = []
        s.titles = dict(promo=0, msi=0, worlds=0); s.mile = {}; s.t = 0.0; s.inter = 0; s.off_age = 0; s.hist = []
        s.income = {}; s.lp = 0; s.pen = (0, 0); s.gh = []; s.evcd = 0; s.buys = []; s.minR = s.R; s.sold = 0; s.reserve_w = 3; s.evlog = {}; s.reckless = False
        if keep:
            s.F = keep['F']; s.seg = keep['seg']; s.hall = dict(keep['titles'])
            if keep['star']: s.slots[0] = keep['star']
    # ---------------- elenco
    def n_tit(s): return sum(1 for x in s.slots if x)
    def nota(s, x):
        return 40 if not x else (C['gen']['nota'] + C['gen']['kT'] * s.lv['treino'] + C['gen']['kH'] * s.lv['house'] if x == 'gen' else x['o'])
    def A(s): return sum(s.nota(x) for x in s.slots) / 5.0
    def star(s): return sum(max(0, x['o'] - 80) for x in s.slots if isinstance(x, dict))
    def regsal(s): return C['reg'][s.region][1]
    def price(s, p): return r2(C['P0'] * math.exp(C['kp'] * (p['o'] - 74)) * ageP(p['a']) * s.regsal() * (C['agio'] if p['l'] != C['reg'][s.region][0] else 1))
    def salary(s, x):
        if not x: return 0
        if x == 'gen': return C['gen']['sal']
        p = x; imp = p['l'] != C['reg'][s.region][0]
        return r2(C['sal0'] * math.exp(C['ks'] * (p['o'] - 74)) * ageS(p['a']) * s.regsal() * (C['impSal'] if imp else 1))
    def n_imp(s): return sum(1 for x in s.slots if isinstance(x, dict) and x['l'] != C['reg'][s.region][0])
    def avail(s, p):
        own = C['reg'][s.region][0]
        if p['l'] == own: return s.div == 'T1' or p['id'] in LOW
        if s.div != 'T1': return False
        if p['l'] in ('LCK', 'LPL') and not s.played_intl: return False
        return True
    # ---------------- forca
    def moral_term(s): return max(-6, min(6, (s.M - 50) / 8.0))
    def S(s, kind=None, scrim=True):
        I = sum(C['infra'][k][3] * s.lv[k] for k in ('treino', 'house', 'equip'))
        St = C['staffS'] * (s.staff['coach'] + s.staff['anal'] + s.staff['psi'])
        pity = min(C['lg']['pityMax'], C['lg']['pity'] * s.fail[kind]) if kind else 0
        return s.A() + I + St + s.moral_term() + (s.forma[0] if s.forma[1] > 0 else 0) - (s.pen[0] if s.pen[1] > 0 else 0) + (s.scrim if scrim else 0) + pity
    def S_base(s): return s.S(None, False) - (s.forma[0] if s.forma[1] > 0 else 0) + (s.pen[0] if s.pen[1] > 0 else 0)
    # ---------------- receita / custo (semanal, em regime)
    def sponsor_slots(s): return 1 + sum(1 for f in C['slotsF'][1:] if s.F >= f)
    def cap_seg(s): return min(8e6, 2000 * (1 + max(0.0, s.F)) ** 1.5)
    def social(s, focus=None):
        return C['pubRate'] * s.seg ** 0.75 * (1 + 0.5 * s.staff['smm']) * (1 + s.star() / 40.0) * (1.5 if focus == 'conteudo' else 1)
    def loja(s):
        return C['loja'] * (max(0.0, s.F) ** C['lojaExp']) * (1 + 0.25 * s.lv['arena'])
    def ticket(s, wr=0.6):
        return C['arenaRev'][s.lv['arena']] * (0.4 + 0.6 * wr) if s.div != 'ranq' else 0
    def tv(s): return C['tv'][s.div]
    def spons(s): return sum(c['val'] for c in s.con)
    def gross(s, focus=None, wr=0.6):
        return (s.tv() + s.spons() + s.social(focus) + s.loja() + s.ticket(wr)) * (1 + 0.05 * min(s.stars, 16))
    def costs(s):
        sal = sum(s.salary(x) for x in s.slots)
        st = sum(C['staff'][k][1] for k in s.staff if s.staff[k])
        return sal + st + C['upkeep'] * s.inv
    def net(s): return s.gross() - s.costs()
    # ---------------- compras
    def options(s):
        out = []; reserve = s.reserve_w * s.costs()
        n = s.n_tit()
        # titular generico
        if n < 5:
            cst = C['gen']['c0'] * C['gen']['g'] ** n
            out.append(('tit', cst, lambda t, c=cst: t.fill_gen(c)))
        for k, (mx, c0, g, w) in C['infra'].items():
            if s.lv[k] < mx and n >= 5 and not (k == 'arena' and s.div != 'T1'):
                cst = c0 * g ** s.lv[k]; out.append((k, cst, lambda t, k=k, c=cst: t.buy_lv(k, c)))
        for k, (cst, sal) in C['staff'].items():
            if not s.staff[k] and n >= 5:
                out.append((k, cst, lambda t, k=k, c=cst: t.buy_staff(k, c)))
        if s.market and n >= 5:
            for i in range(5):
                role = ['TOP', 'JNG', 'MID', 'ADC', 'SUP'][i]; old = s.slots[i]
                for p in PL:
                    if p['r'] != role or not s.avail(p): continue
                    if any(isinstance(x, dict) and x['id'] == p['id'] for x in s.slots): continue
                    if p['o'] <= s.nota(old) + 1.5: continue
                    imp = p['l'] != C['reg'][s.region][0]
                    if imp and s.n_imp() - (1 if isinstance(old, dict) and old['l'] != C['reg'][s.region][0] else 0) + 1 > C['importMax']: continue
                    cst = s.price(p) - (int(old['paid'] * C['refund']) if isinstance(old, dict) else 0)
                    out.append(('real', cst, lambda t, i=i, p=p: t.hire(i, p)))
        return out
    def U(s): return max(1500.0, sum(s.gh) / len(s.gh) if s.gh else 1500.0)
    def fill_gen(s, c):
        s.R -= c; s.slots[s.slots.index(0)] = 'gen'; s.check_mile()
    def buy_lv(s, k, c):
        s.R -= c; s.lv[k] += 1; s.inv += c
    def buy_staff(s, k, c):
        s.R -= c; s.staff[k] = 1; s.inv += 0
    def hire(s, i, p):
        old = s.slots[i]; cst = s.price(p)
        if isinstance(old, dict): s.R += int(old['paid'] * C['refund'])
        s.R -= cst; q = dict(p); q['paid'] = cst; s.slots[i] = q; s.M = max(0, s.M - 6)  # entrosamento
    def best_buy(s, mode='S'):
        base_S = s.S_base(); base_net = s.net(); best = None; res = s.reserve_w * s.costs()
        for name, cst, fn in s.options():
            if cst > s.R - res: continue
            t = copy.copy(s); t.slots = list(s.slots); t.lv = dict(s.lv); t.staff = dict(s.staff); t.con = s.con; t.R = s.R
            fn(t)
            dS = t.S_base() - base_S; dN = t.net() - base_net
            if name in ('arena',) or (name in ('smm',)): score = (dN * 35) / cst * 1.0 + dS * 0
            else: score = dS / cst * 1.0
            if not s.reckless and name != 'arena' and name != 'smm' and dN < -0.5 * max(1, base_net) and base_net > 0: continue
            if name == 'tit' and dS <= 0: continue
            if name in ('arena', 'smm') and dN * 70 < cst: continue
            if name == 'tit': score = 1e9 / cst  # primeiro completar o time
            if score <= 0: continue
            if best is None or score > best[0]: best = (score, name, cst, fn)
        return best
    def shop(s, cap=60):
        n = 0
        while n < cap:
            b = s.best_buy()
            if not b: break
            b[3](s); s.check_mile(); n += 1; s.buys.append(s.t)
        return n
    # ---------------- patrocinio
    def gen_offer(s, wk):
        F = s.F; ok = [i for i, t in enumerate(C['tiers']) if F >= t[1] and (not t[5] or s.div == 'T1')]
        if not ok or len(s.offers) >= 3: return
        top = ok[-3:][::-1]; i = s.rng.choices(top, [50, 30, 20][:len(top)])[0]; t = C['tiers'][i]
        val = r2(t[2] * (0.9 + 0.25 * s.rng.random()) * s.regmul())
        s.offers.append(dict(tier=i, val=val, term=t[3], meta=t[4], left=C['offerLife']))
    def regmul(s): return {'BR': 1.0, 'AP': 1.0, 'NA': 1.1, 'EU': 1.1, 'CN': 1.2, 'KR': 1.2}[s.region]
    def exp_wr(s):
        lst = C['lg']['t2opp'] if s.div == 'T2' else C['lg']['t1opp']
        return sum(winP(s.S_base() + 3, o) for o in lst) / len(lst)
    def take_offers(s):
        for o in sorted(s.offers, key=lambda o: -o['val']):
            if o['meta'] > 0 and s.exp_wr() < o['meta'] + 0.07: continue
            if len(s.con) >= s.sponsor_slots():
                worst = min(s.con, key=lambda c: c['val'])
                if o['val'] < 1.8 * worst['val']: continue
                s.R -= 2 * worst['val0']; s.con.remove(worst); s.stats['swap'] = s.stats.get('swap', 0) + 1  # rescisao: multa 2x
            s.R += 2 * o['val']  # luvas
            s.con.append(dict(tier=o['tier'], val=o['val'], val0=o['val'], left=o['term'], rev=8, strike=0, hist=[]))
            s.offers.remove(o); s.check_mile()
    def review(s):
        for c in list(s.con):
            c['left'] -= 1; c['rev'] -= 1; meta = C['tiers'][c['tier']][4]
            if c['rev'] <= 0:
                c['rev'] = 8; h = c['hist'][-8:]; wr = sum(h) / len(h) if len(h) >= 4 else 1
                if wr < meta:
                    c['strike'] += 1
                    if c['strike'] == 1: c['val'] = int(c['val0'] * 0.7); s.stats['warn'] = s.stats.get('warn', 0) + 1
                    else: s.R -= 2 * c['val0']; s.con.remove(c); s.stats['broke'] = s.stats.get('broke', 0) + 1; continue
                else: c['strike'] = 0; c['val'] = c['val0']
            if c['left'] <= 0:
                s.R += 3 * c['val0']
                if s.F >= C['tiers'][c['tier']][1] and not any(s.F >= t[1] and (s.div == 'T1' or not t[5]) for t in C['tiers'][c['tier'] + 1:]): c['val0'] = int(min(c['val0'] * 1.1, 1.6 * C['tiers'][c['tier']][2] * s.regmul())); c['val'] = c['val0']; c['left'] = C['tiers'][c['tier']][3]
                else: s.con.remove(c)
    # ---------------- marcos
    def check_mile(s):
        m = s.mile; T = s.t
        def mk(k, cond):
            if k not in m and cond: m[k] = T
        mk('5tit', s.n_tit() >= 5); mk('promo', s.div == 'T1'); mk('spons3', any(c['tier'] >= 3 for c in s.con))
        mk('spons5', any(c['tier'] >= 4 for c in s.con)); mk('intl', s.played_intl); mk('msi', s.titles['msi'] > 0)
        mk('titulo', s.titles['worlds'] > 0); mk('reais', any(isinstance(x, dict) for x in s.slots))
    # ---------------- semana
    def pick_focus(s, mode):
        if mode == 'auto':  # piloto automatico (offline): regras fixas
            runway = s.R / max(1, s.costs())
            if s.M < 40: return 'descanso'
            if runway < 4: return 'conteudo'
            if s.ser and s.ser['k'] in ('msi', 'worlds') and s.ser['r'] == 0 and s.div == 'T1' and s.cdw.get('bootcamp', 0) <= 0 and s.R > 30000 + 3 * s.costs(): return 'bootcamp'
            if s.ser: return 'scrims'
            if s.forma[1] <= 0 or s.forma[0] < 3: return 'treino'
            if s.cdw.get('imprensa', 0) <= 0 and s.wk % 2 == 0: return 'imprensa'
            return 'conteudo' if s.wk % 2 else 'treino'
        # ativo
        if s.M < 42: return 'descanso'
        if s.ser and s.cdw.get('bootcamp', 0) <= 0 and s.div == 'T1' and s.ser['k'] in ('msi', 'worlds') and s.ser['r'] == 0 and s.R > 30000 + 3 * s.costs(): return 'bootcamp'
        if s.ser or (s.div != 'ranq' and s.gi == (C['lg']['t1games'] if s.div == 'T1' else C['lg']['t2games']) - 1): return 'scrims'
        if len(s.offers) < 2 and s.cdw.get('negociar', 0) <= 0 and len(s.con) < s.sponsor_slots(): return 'negociar'
        if s.R / max(1, s.costs()) < 4: return 'conteudo'
        if s.cdw.get('imprensa', 0) <= 0 and s.F < 450: return 'imprensa'
        if s.forma[1] <= 1: return 'treino'
        return 'conteudo'
    def week(s, focus, online=True):
        L = C['lg']; s.wk += 1; s.t_week = C['WK']
        for k in list(s.cdw): s.cdw[k] = max(0, s.cdw[k] - 1)
        if focus in C['cd']: s.cdw[focus] = C['cd'][focus]
        inc = {}; dF = 0; dM = 0
        # --- efeito do foco
        coach, anal, psi, smm = s.staff['coach'], s.staff['anal'], s.staff['psi'], s.staff['smm']
        segmul = 1.0; spend = 0
        if focus == 'treino':
            s.forma = (2.5 * (1 + 0.4 * coach + 0.2 * anal), 3); dM -= (1 if psi else 2)
        elif focus == 'conteudo':
            segmul = 3.0; dM -= 1
        elif focus == 'descanso':
            dM += 10 + 3 * psi
        elif focus == 'scrims':
            s.scrim = 3 + 1.0 * anal; spend = 600 * (1 + 2 * (s.div == 'T1')); dM -= 0.5
        elif focus == 'imprensa':
            dF += C['fame']['press'] * (1 + s.star() / 60.0) * (1 + 0.5 * smm)
        elif focus == 'negociar':
            if s.div != 'ranq':
                o0 = len(s.offers); s.offers = s.offers[:2]; s.gen_offer(s.wk)
                if s.offers: s.offers[-1]['val'] = int(s.offers[-1]['val'] * 1.15)
        elif focus == 'bootcamp':
            s.forma = (4 * (1 + 0.4 * coach + 0.2 * anal), 4); dM += 8; dF += 2; spend = 25000
        elif focus == 'bootcamp2':  # 2a semana do bootcamp: sem custo, mantem a forma
            s.forma = (s.forma[0], max(s.forma[1], 3)); dM += 2
        # --- partida
        win = None
        if s.div != 'ranq': win = s.play(inc)
        # --- receita
        wr = 0.6
        inc['tv'] = s.tv() + (C['tvIntl'] if s.ser and s.ser['k'] in ('msi', 'worlds') else 0)
        inc['spons'] = s.spons(); inc['social'] = s.social(focus)
        inc['loja'] = s.loja(); inc['ticket'] = s.ticket(wr)
        mult = 1 + 0.05 * min(s.stars, 16)
        for k in ('tv', 'spons', 'social', 'loja', 'ticket'): inc[k] *= mult
        gross = sum(inc[k] for k in ('tv', 'spons', 'social', 'loja', 'ticket'))
        prize = inc.pop('prize', 0); gross += prize; inc['prize'] = prize
        travel = 0
        if s.ser and s.ser['k'] in ('msi', 'worlds'): travel = C['travel'][s.ser['k']]
        cost = s.costs() + spend + travel
        s.R += gross - cost; s.minR = min(s.minR, s.R)
        for k, v in inc.items(): s.income[k] = s.income.get(k, 0) + v
        s.income['cost'] = s.income.get('cost', 0) + cost
        # --- seguidores, fama, moral
        g = (s.seg * 0.02 + 20) * (1 + s.star() / 25.0) * (1 + 0.5 * smm) * segmul * (1.3 if win else 1.0)
        s.seg = max(50, s.seg + g * max(0, 1 - s.seg / s.cap_seg()) - (0.002 * s.seg if s.seg > s.cap_seg() else 0))
        s.F = max(0.0, min(1000.0, s.F * C['fame']['decay'] + dF * (1 - s.F / 1000.0) + 0.02 * s.star() / 5))
        tgt = 55 + 3 * s.lv['house'] + 5 * psi
        s.M += (tgt - s.M) * 0.08 + dM + ((2 if s.div == 'T1' else 1.5) if win else (-2.5 * (0.5 if psi else 1) if win is False else 0))
        s.M = max(0, min(100, s.M))
        if s.forma[1] > 0: s.forma = (s.forma[0], s.forma[1] - 1)
        if s.pen[1] > 0: s.pen = (s.pen[0], s.pen[1] - 1)
        s.gh.append(gross); s.gh = s.gh[-4:]
        if online and s.evcd <= 0 and s.div != 'ranq' and s.rng.random() < 0.25: s.event()
        s.evcd -= 1
        # --- patrocinio (ofertas e revisao)
        s.review()
        if s.wk % C['offerEvery'] == 0: s.gen_offer(s.wk)
        for o in s.offers:
            if online: o['left'] -= 1
        s.offers = [o for o in s.offers if o['left'] > 0]
        if online: s.take_offers()
        # --- falencia amena
        if s.R < 0: s.rescue()
        s.check_mile(); s.hist.append((s.t, s.R))
        return C['WK']

    # ---------------- eventos (15). cada opcao: (texto curto, funcao(t,U) que aplica os efeitos)
    def event(s):
        U = s.U(); r = s.rng; ok = []
        for i, (nm, cond, opts, bot) in enumerate(EVENTS):
            if cond(s): ok.append(i)
        if not ok: return
        i = r.choice(ok); nm, cond, opts, bot = EVENTS[i]; s.evcd = 4
        opts[bot][1](s, U); s.evlog[nm] = s.evlog.get(nm, 0) + 1
    def rescue(s):
        s.stats['rescue'] = s.stats.get('rescue', 0) + 1
        reals = [(s.salary(x), i) for i, x in enumerate(s.slots) if isinstance(x, dict)]
        if reals:
            _, i = max(reals); x = s.slots[i]; s.R += int(x['paid'] * 0.7); s.slots[i] = 'gen'
        else:
            for k in ('psi', 'anal', 'coach', 'smm'):
                if s.staff[k]: s.staff[k] = 0; break
        s.M = max(0, s.M - 8)
        if s.R < 0: s.R = 3000  # doacao da diretoria (piso)
    def play(s, inc):
        L = C['lg']; win = None
        if s.div == 'T2' and s.ph == 'split':
            opp = L['t2opp'][s.gi % 8]; u = mix(s.seed, s.wk, 1)
            win = u < winP(s.S(None), opp, L['D']); s.scrim = 0
            s.w += win; s.l += (not win); s.gi += 1; s.hist2(win)
            if win: s.F += C['fame']['t2win']
            if s.gi >= L['t2games']:
                inc['prize'] = inc.get('prize', 0) + s.w * C['prize']['t2win'] + (C['prize']['t2bonus'] if s.w >= L['promoW'] else 0)
                if s.w >= L['promoW'] and s.S('promo', False) >= L['promoS']: s.ph = 'promo'; s.ser = dict(k='promo', r=0, plan=[(5, L['promoOpp'], 'Série de acesso')])
                s.gi = 0; s.w = 0; s.l = 0
            return win
        if s.div == 'T1' and s.ph == 'split':
            opp = L['t1opp'][s.gi % 9]; u = mix(s.seed, s.wk, 1)
            win = u < winP(s.S(None), opp, L['D']); s.scrim = 0
            s.w += win; s.l += (not win); s.gi += 1; s.hist2(win)
            s.F += C['fame']['t1win'] if win else C['fame']['t1loss']
            if s.gi >= L['t1games']:
                inc['prize'] = inc.get('prize', 0) + s.w * C['prize']['t1win'] + (C['prize']['t1bonus'] if s.w >= L['qualW'] else 0)
                s.pts_y += 3 * s.w
                if s.sp == 1 and s.w >= L['qualW']:
                    s.ph = 'msi'; s.ser = dict(k='msi', r=0, plan=L['msi']); s.played_intl = True; s.F += C['fame']['msiPart']; s.lp += 1
                elif s.sp == 2 and (s.w >= L['qualW'] or s.pts_y >= 33):
                    s.ph = 'worlds'; s.ser = dict(k='worlds', r=0, plan=L['worlds']); s.played_intl = True; s.F += C['fame']['wdPart']; s.lp += 2
                elif s.sp == 1: s.sp = 2
                else: s.new_year()
                s.gi = 0; s.w = 0; s.l = 0
            return win
        # serie (promo / msi / worlds) = 1 rodada por semana
        ser = s.ser; bo, opp, nm = ser['plan'][ser['r']]; need = (bo + 1) // 2; sw = sl = 0; g = 0
        S = s.S(ser['k'] if ser['k'] != 'worlds' else 'worlds'); s.scrim = 0
        while sw < need and sl < need:
            g += 1; u = mix(s.seed, s.wk, 10 + g)
            if u < winP(S, opp, L['D']): sw += 1
            else: sl += 1
        won = sw >= need; k = ser['k']; P = C['prize']; Fm = C['fame']
        if won:
            s.F += {'promo': 0, 'msi': Fm['msiRound'], 'worlds': Fm['wdRound']}[k]
            if k == 'msi': inc['prize'] = inc.get('prize', 0) + P['msiRound']
            if k == 'worlds': inc['prize'] = inc.get('prize', 0) + P['wdRound']
            ser['r'] += 1
            if ser['r'] >= len(ser['plan']):
                if k == 'promo':
                    s.div = 'T1'; s.sp = 1; s.yr = 1; s.pts_y = 0; s.fail['promo'] = 0; inc['prize'] = inc.get('prize', 0) + P['promo']; s.F += Fm['promo']; s.titles['promo'] += 1; s.lp += 1
                elif k == 'msi':
                    inc['prize'] = inc.get('prize', 0) + P['msiWin']; s.F += Fm['msiWin']; s.titles['msi'] += 1; s.fail['msi'] = 0; s.lp += 4; s.sp = 2
                else:
                    inc['prize'] = inc.get('prize', 0) + P['wdWin']; s.F += Fm['wdWin']; s.titles['worlds'] += 1; s.fail['worlds'] = 0; s.lp += 10; s.new_year()
                s.ph = 'split'; s.ser = None
        else:
            if k == 'promo': s.fail['promo'] += 1; s.ph = 'split'; s.ser = None
            elif k == 'msi': inc['prize'] = inc.get('prize', 0) + P['msiPart']; s.fail['msi'] += 1; s.ph = 'split'; s.ser = None; s.sp = 2
            else: inc['prize'] = inc.get('prize', 0) + P['wdPart']; s.fail['worlds'] += 1; s.ph = 'split'; s.ser = None; s.new_year()
        return won
    def hist2(s, win):
        for c in s.con: c['hist'].append(1 if win else 0)
    def new_year(s):
        s.yr += 1; s.sp = 1; s.pts_y = 0
        for i, x in enumerate(s.slots):
            if isinstance(x, dict):
                x['a'] += 1
                if x['a'] <= 23 and x['o'] < 96: x['o'] += 1
                elif x['a'] >= 31: x['o'] -= 1
    def inscribe(s):
        if s.div == 'ranq' and s.n_tit() >= 5: s.div = 'T2'; s.ph = 'split'; s.gi = 0


def _pen(t, v, w): t.pen = (max(v, t.pen[0] if t.pen[1] > 0 else 0), w)
def _forma(t, v, w):
    if v >= (t.forma[0] if t.forma[1] > 0 else 0): t.forma = (v, w)
def _offer(t, mult, dm=0.0):
    ok = [i for i, x in enumerate(C['tiers']) if t.F >= x[1] and (not x[5] or t.div == 'T1')]
    i = ok[-1]; x = C['tiers'][i]
    t.offers.append(dict(tier=i, val=r2(x[2] * mult * t.regmul()), term=x[3], meta=min(0.8, x[4] + dm) if x[4] else 0.0, left=4))
def _sell(t, U):
    reals = [(x['o'], i) for i, x in enumerate(t.slots) if isinstance(x, dict)]
    if not reals: return
    _, i = min(reals); x = t.slots[i]; t.R += int(1.3 * x['paid']); t.slots[i] = 'gen'; t.M -= 3; t.sold += 1
def _lose_staff(t, U):
    ks = [k for k in t.staff if t.staff[k]]
    if ks: t.staff[ks[0]] = 0; t.R += 0.3 * U
def _spons_cut(t, U):
    if t.con and t.rng.random() < 0.25: t.R -= 0.3 * U
EVENTS = [
 # (id, condicao, [(texto, efeito) x2], indice da opcao do bot)
 ('polemica', lambda t: t.seg > 1500, [('Pedir desculpas', lambda t, U: (setattr(t, 'M', t.M - 2), setattr(t, 'F', t.F - 1))),
    ('Dobrar a aposta', lambda t, U: (setattr(t, 'seg', t.seg * 1.10), setattr(t, 'F', t.F + 2), setattr(t, 'R', t.R + 0.5 * U)) if t.rng.random() < 0.5
       else (setattr(t, 'F', t.F - 4), setattr(t, 'R', t.R - 0.5 * U), setattr(t, 'M', t.M - 3)))], 1),
 ('viral', lambda t: t.seg > 800, [('Impulsionar (-0,3 U)', lambda t, U: (setattr(t, 'R', t.R - 0.3 * U), setattr(t, 'seg', t.seg * 1.12), setattr(t, 'F', t.F + 2))),
    ('Deixar organico', lambda t, U: setattr(t, 'seg', t.seg * 1.04))], 0),
 ('lesao', lambda t: t.n_tit() >= 5, [('Jogar machucado', lambda t, U: _pen(t, 6 if t.rng.random() < 0.3 else 3, 3)),
    ('Fisio e reserva (-0,3 U)', lambda t, U: (setattr(t, 'R', t.R - 0.3 * U), _pen(t, 1.5, 2)))], 1),
 ('proposta', lambda t: t.F >= 15, [('Fechar na hora', lambda t, U: _offer(t, 1.25, 0.10)),
    ('Negociar mais', lambda t, U: _offer(t, 1.45) if t.rng.random() < 0.5 else None)], 1),
 ('bootcamp', lambda t: t.div == 'T1', [('Aceitar (-1,0 U)', lambda t, U: (setattr(t, 'R', t.R - U), _forma(t, 4, 4), setattr(t, 'M', t.M + 6), setattr(t, 'F', t.F + 1))),
    ('Recusar', lambda t, U: setattr(t, 'M', t.M + 1))], 0),
 ('rival', lambda t: t.div != 'ranq', [('Responder em campo', lambda t, U: (setattr(t, 'scrim', max(t.scrim, 3)), setattr(t, 'F', t.F - 0.5))),
    ('Postar meme', lambda t, U: (setattr(t, 'seg', t.seg * 1.05), setattr(t, 'F', t.F + 1), setattr(t, 'M', t.M + 2)))], 1),
 ('vazamento', lambda t: t.div != 'ranq', [('Mudar o draft (-0,3 U)', lambda t, U: (setattr(t, 'R', t.R - 0.3 * U), _forma(t, 2, 2))),
    ('Fingir que nao viu', lambda t, U: _pen(t, 2, 2))], 0),
 ('briga', lambda t: t.n_tit() >= 5, [('Chamar o psicologo (-0,2 U)', lambda t, U: (setattr(t, 'R', t.R - 0.2 * U), setattr(t, 'M', t.M + (9 if t.staff['psi'] else 5)))),
    ('Deixar resolver', lambda t, U: setattr(t, 'M', t.M + (6 if t.rng.random() < 0.6 else -10)))], 0),
 ('collab', lambda t: t.seg > 3000, [('Aceitar collab (-0,3 U)', lambda t, U: (setattr(t, 'R', t.R - 0.3 * U), setattr(t, 'seg', t.seg * 1.15), setattr(t, 'F', t.F + 2))),
    ('Cobrar cache', lambda t, U: (setattr(t, 'R', t.R + 0.8 * U), setattr(t, 'seg', t.seg * 1.03)))], 0),
 ('reality', lambda t: t.div == 'T1', [('Participar', lambda t, U: (setattr(t, 'R', t.R + 1.2 * U), setattr(t, 'M', t.M - 5))),
    ('Recusar', lambda t, U: (setattr(t, 'M', t.M + 2), setattr(t, 'F', t.F + 0.5)))], 0),
 ('compra', lambda t: any(isinstance(x, dict) for x in t.slots), [('Vender (1,3x o preco)', _sell),
    ('Recusar', lambda t, U: setattr(t, 'M', t.M + 4))], 1),
 ('vaquinha', lambda t: t.F >= 5, [('Aceitar a rifa', lambda t, U: (setattr(t, 'R', t.R + 0.8 * U), setattr(t, 'F', t.F + 1))),
    ('Agradecer e recusar', lambda t, U: (setattr(t, 'F', t.F + 2), setattr(t, 'M', t.M + 2)))], 0),
 ('ativacao', lambda t: len(t.con) > 0, [('Fazer a acao', lambda t, U: (setattr(t, 'R', t.R + 0.6 * U), setattr(t, 'M', t.M - 3))),
    ('Recusar educadamente', _spons_cut)], 0),
 ('internet', lambda t: t.div != 'ranq', [('Fibra dedicada (-0,4 U)', lambda t, U: (setattr(t, 'R', t.R - 0.4 * U), _forma(t, 1, 6))),
    ('Jogar no 4G', lambda t, U: _pen(t, 3, 1) if t.rng.random() < 0.5 else None)], 0),
 ('staff', lambda t: any(t.staff.values()), [('Cobrir a oferta (-0,5 U)', lambda t, U: setattr(t, 'R', t.R - 0.5 * U)),
    ('Deixar ir', _lose_staff)], 0),
]

# ---------------------------------------------------------------- perfis
def run(profile, seed=1, market=True, region='BR', stars=0, keep=None, fixed=None, tmax=60 * 3600, verbose=False):
    T = Team(seed, region, market, stars, keep); wall = 0.0
    session, gap = {'ativo': (1e18, 0), 'casual': (180, 1620), 'ocioso': (60, 3600)}[profile]
    away = False
    while wall < tmax and T.titles['worlds'] == 0:
        # sessao online
        t_end = wall + session; T.shop(); T.inscribe(); T.take_offers()
        while wall < t_end and T.titles['worlds'] == 0 and wall < tmax:
            f = fixed or T.pick_focus('ativo')
            if f == 'bootcamp' and not (T.div == 'T1' and T.cdw.get('bootcamp', 0) <= 0): f = 'treino'
            if f in ('imprensa', 'negociar') and T.cdw.get(f, 0) > 0: f = 'conteudo'
            d = T.week(f, True); wall += d; T.t = wall
            if f == 'bootcamp': d += T.week('bootcamp2', True); wall += C['WK']; T.t = wall
            T.shop(); T.inscribe()
            if profile != 'ativo' and wall >= t_end: break
        if T.titles['worlds']: break
        # periodo offline (piloto automatico, 70% de eficiencia, teto 4 h)
        off = min(gap, C['maxAway']); spent = 0.0
        while spent < off:
            if T.R < 2 * T.costs() and T.div != 'ranq': T.stats['recesso'] = T.stats.get('recesso', 0) + 1; break
            if T.div == 'ranq' and T.n_tit() < 5 and T.R < 1: break
            f = T.pick_focus('auto')
            T.take_offers(); d = T.week(f, False)
            if f == 'bootcamp': d += T.week('bootcamp2', False)
            cost = d / C['offEff']; spent += cost; T.t = wall + spent
            if T.titles['worlds']: break
        wall += min(gap, spent if spent < gap else gap) if gap else 0
        T.t = wall; T.inscribe()
        if gap == 0: break
    T.t = wall
    return T

def fmt_t(s):
    if s is None: return '    -   '
    h = s / 3600
    return ('%5.2f h' % h) if h >= 1 else ('%4.0f min' % (s / 60))

def q(vals, p):
    v = sorted(vals, key=lambda x: (x is None, x)); return v[min(len(v) - 1, int(p * (len(v) - 1) + 0.5))]

def imprudente(T):  # perfil de teste: gasta tudo, sem reserva, ignora o salario, so faz 'conteudo'
    T.reserve_w = 0; T.reckless = True

if __name__ == '__main__':
    init_players(sys.argv[1] if len(sys.argv) > 1 else 'js/data/jogadores.js')
    N = 9; SEEDS = range(1, N + 1)
    print('=== 1) Marcos por perfil (mediana de %d sementes; entre parenteses: p25-p75 do titulo) ===' % N)
    print('perfil    mercado  titulo (p25 - p75)      | 5 titul.  promocao  1o patr.>=Banco  patr.>=Nexa  1a intl  1o MSI | caixa min  caixa fim  resgates')
    runs = {}
    for market in (True, False):
        for prof in ('ativo', 'casual', 'ocioso'):
            rows = [run(prof, sd, market) for sd in SEEDS]; runs[(prof, market)] = rows
            def med(k):
                v = [T.mile.get(k) if k != 'titulo' else (T.t if T.titles['worlds'] else None) for T in rows]; return q(v, 0.5)
            tt = [T.t if T.titles['worlds'] else None for T in rows]
            print('%-9s %-6s %s (%s - %s) |' % (prof, 'com' if market else 'sem', fmt_t(q(tt, .5)), fmt_t(q(tt, .25)).strip(), fmt_t(q(tt, .75)).strip()),
                  ' '.join(fmt_t(med(k)) for k in ('5tit', 'promo', 'spons3', 'spons5', 'intl', 'msi')),
                  '| %9.0f %10.0f  %d' % (min(T.minR for T in rows), sum(T.R for T in rows) / N, sum(T.stats.get('rescue', 0) for T in rows)))
    print()
    print('=== 2) Mix de receita do perfil ativo com Mercado (media das sementes, % da receita bruta ate o titulo) ===')
    rows = runs[('ativo', True)]; tot = {}
    for T in rows:
        for k, v in T.income.items(): tot[k] = tot.get(k, 0) + v
    g = sum(v for k, v in tot.items() if k != 'cost')
    names = dict(tv='direitos de TV', spons='patrocinio', social='redes sociais', loja='loja/camisa', ticket='bilheteria', prize='premiacoes')
    print('  ' + ' | '.join('%s %.0f%%' % (names[k], 100 * tot[k] / g) for k in ('tv', 'spons', 'social', 'loja', 'ticket', 'prize')) + ' | despesas = %.0f%% da receita' % (100 * tot['cost'] / g))
    print()
    print('=== 3) Paredes e buracos (ativo com Mercado) ===')
    for T in rows[:3]:
        b = [0] + T.buys + [T.t]; gap = max(b[i + 1] - b[i] for i in range(len(b) - 1))
        print('  semente %d: titulo em %s | maior intervalo sem compra: %.0f min | resgates: %d | caixa minimo: R$ %.0f | semanas: %d | eventos: %d | patrocinio: %d avisos, %d quebras, %d trocas' % (
            T.seed, fmt_t(T.t).strip(), gap / 60, T.stats.get('rescue', 0), T.minR, T.wk, sum(T.evlog.values()), T.stats.get('warn', 0), T.stats.get('broke', 0), T.stats.get('swap', 0)))
    print()
    print('=== 4) Teste de estresse: time imprudente (sem reserva, compra tudo, so faz Conteudo) ===')
    for sd in (1, 2, 3):
        T = Team(sd, 'BR', True); imprudente(T); wall = 0.0
        while wall < 12 * 3600 and not T.titles['worlds']:
            T.shop(); T.inscribe(); T.take_offers(); wall += T.week('conteudo', True); T.t = wall
        print('  semente %d: resgates %d, caixa minimo R$ %.0f, divisao %s, titulos %s, tempo %s (o jogo segue; o save nunca e perdido)' % (
            sd, T.stats.get('rescue', 0), T.minR, T.div, T.titles, fmt_t(wall).strip()))
    print()
    print('  --- choque de caixa: time KR na T1 sem patrocinios, 5 titulares da LCK (nota ~86) e R$ 50 mil no cofre ---')
    T = Team(7, 'KR', True); T.div = 'T1'; T.ph = 'split'; T.F = 120; T.seg = 30000
    for i, role in enumerate(['TOP', 'JNG', 'MID', 'ADC', 'SUP']):
        p = min([x for x in PL if x['l'] == 'LCK' and x['r'] == role], key=lambda x: abs(x['o'] - 86)); q_ = dict(p); q_['paid'] = T.price(p); T.slots[i] = q_
    T.R = 50000; g0, c0_ = T.gross(), T.costs(); ev = []; seen = set()
    for w in range(1, 61):
        run_w = T.R / max(1.0, T.costs() - T.gross() + 1e-9) if T.costs() > T.gross() else 99
        r0 = T.stats.get('rescue', 0); T.week('conteudo', True); T.con = []
        if run_w < 4 and 'am' not in seen: seen.add('am'); ev.append('sem %d: AVISO AMARELO (caixa para %.1f sem)' % (w, run_w))
        if run_w < 2 and 'vm' not in seen: seen.add('vm'); ev.append('sem %d: AVISO VERMELHO (%.1f sem)' % (w, run_w))
        if T.stats.get('rescue', 0) > r0: ev.append('sem %d: diretoria vende 1 jogador (caixa R$ %.0f; reais no elenco: %d)' % (w, T.R, sum(1 for x in T.slots if isinstance(x, dict))))
    print('  receita %.0f/sem x despesa %.0f/sem (saldo %.0f/sem)' % (g0, c0_, g0 - c0_)); print('  ' + '\n  '.join(ev[:7]))
    print('  em 60 semanas: caixa R$ %.0f, resgates %d, moral %.0f, o time segue na %s' % (T.R, T.stats.get('rescue', 0), T.M, T.div))
    print()
    print('=== 4b) Retrato semanal do perfil ativo (semente 1): receita, custo e forca em 4 momentos ===')
    T = Team(1, 'BR', True); wall = 0.0; marks = [600, 2400, 5400, 9000]; k = 0
    print('  tempo   divisao  forca  elenco  fama  seguidores  moral | TV  patroc.  social  loja  bilhet. | custo/sem  saldo/sem')
    while wall < 9100 and not T.titles['worlds']:
        T.shop(); T.inscribe(); T.take_offers(); f = T.pick_focus('ativo')
        if f == 'bootcamp' and not (T.div == 'T1' and T.cdw.get('bootcamp', 0) <= 0): f = 'treino'
        if f in ('imprensa', 'negociar') and T.cdw.get(f, 0) > 0: f = 'conteudo'
        wall += T.week(f, True); T.t = wall
        if k < len(marks) and wall >= marks[k]:
            k += 1; print('  %5.0f min %-5s %6.1f %6.1f %6.0f %10.0f %6.0f | %5.0f %7.0f %7.0f %5.0f %6.0f | %9.0f %9.0f' % (wall / 60, T.div, T.S_base(), T.A(), T.F, T.seg, T.M,
                T.tv(), T.spons(), T.social(), T.loja(), T.ticket(), T.costs(), T.net()))
    print()
    print('=== 5) Cada foco tem o seu papel (ativo, com Mercado; foco fixo vs. misto; mediana de 5 sementes) ===')
    for f in (None, 'treino', 'conteudo', 'imprensa', 'scrims', 'negociar', 'descanso'):
        tt = [run('ativo', sd, True, fixed=f, tmax=14 * 3600) for sd in range(1, 6)]
        tt = [T.t if T.titles['worlds'] else None for T in tt]
        print('  %-10s titulo em %s' % (f or 'misto', fmt_t(q(tt, .5))))
    print()
    print('=== 6) Regioes (ativo, com Mercado, mediana de 5 sementes) ===')
    for rg in ('BR', 'EU', 'KR'):
        tt = [run('ativo', sd, True, region=rg) for sd in range(1, 6)]
        print('  %s: titulo em %s' % (rg, fmt_t(q([T.t if T.titles['worlds'] else None for T in tt], .5))))
    print()
    print('=== 7) Nova temporada (prestigio): 2a run do perfil ativo, com Hall da Fama = PL//10 e o melhor titular mantido ===')
    r2s = []
    for sd in range(1, 6):
        T1 = run('ativo', sd, True)
        best = max([x for x in T1.slots if isinstance(x, dict)] or [None], key=lambda x: x['o'] if x else 0)
        keep = dict(F=T1.F * 0.25, seg=T1.seg * 0.25, titles=T1.titles, star=dict(best, paid=best['paid']) if best else None)
        stars = max(1, T1.lp // 10)
        T2 = run('ativo', sd + 100, True, stars=stars, keep=keep); r2s.append((T1.t, T2.t if T2.titles['worlds'] else None, stars))
    for a, b, st in r2s: print('  run 1: %s | run 2: %s (estrelas %d)' % (fmt_t(a).strip(), fmt_t(b).strip(), st))
```

### 8.3 Saída (rodada de verdade, `python3 sim_esports.py js/data/jogadores.js`)

```
=== 1) Marcos por perfil (mediana de 9 sementes; entre parenteses: p25-p75 do titulo) ===
perfil    mercado  titulo (p25 - p75)      | 5 titul.  promocao  1o patr.>=Banco  patr.>=Nexa  1a intl  1o MSI | caixa min  caixa fim  resgates
ativo     com     3.27 h (2.70 h - 3.49 h) |    6 min   33 min  1.14 h  1.94 h   50 min  2.02 h |      1539    2168214  0
casual    com     4.22 h (3.69 h - 4.56 h) |   30 min  1.08 h  2.36 h  3.13 h  1.73 h  2.67 h |      1539    4821288  0
ocioso    com     5.02 h (4.63 h - 5.34 h) |  1.02 h  1.12 h  2.83 h  3.66 h  2.10 h  3.21 h |      1611   11547141  0
ativo     sem     4.79 h (4.58 h - 5.01 h) |    6 min   33 min  1.19 h  2.12 h   50 min  2.46 h |      1539   18134245  0
casual    sem     5.76 h (5.17 h - 6.36 h) |   30 min  1.08 h  2.31 h  3.52 h  1.73 h  3.41 h |      1539   13920989  0
ocioso    sem     7.70 h (6.35 h - 8.27 h) |  1.02 h  1.12 h  3.15 h  4.28 h  2.20 h  4.49 h |      1611   19594157  0

=== 2) Mix de receita do perfil ativo com Mercado (media das sementes, % da receita bruta ate o titulo) ===
  direitos de TV 10% | patrocinio 42% | redes sociais 24% | loja/camisa 5% | bilheteria 2% | premiacoes 16% | despesas = 24% da receita

=== 3) Paredes e buracos (ativo com Mercado) ===
  semente 1: titulo em 3.49 h | maior intervalo sem compra: 15 min | resgates: 0 | caixa minimo: R$ 1539 | semanas: 314 | eventos: 44 | patrocinio: 2 avisos, 0 quebras, 7 trocas
  semente 2: titulo em 3.51 h | maior intervalo sem compra: 12 min | resgates: 0 | caixa minimo: R$ 1539 | semanas: 316 | eventos: 43 | patrocinio: 0 avisos, 0 quebras, 9 trocas
  semente 3: titulo em 2.47 h | maior intervalo sem compra: 12 min | resgates: 0 | caixa minimo: R$ 1539 | semanas: 222 | eventos: 30 | patrocinio: 0 avisos, 0 quebras, 8 trocas

=== 4) Teste de estresse: time imprudente (sem reserva, compra tudo, so faz Conteudo) ===
  semente 1: resgates 1, caixa minimo R$ 917, divisao T1, titulos {'promo': 1, 'msi': 6, 'worlds': 1}, tempo 5.29 h (o jogo segue; o save nunca e perdido)
  semente 2: resgates 0, caixa minimo R$ 917, divisao T1, titulos {'promo': 1, 'msi': 7, 'worlds': 1}, tempo 5.53 h (o jogo segue; o save nunca e perdido)
  semente 3: resgates 0, caixa minimo R$ 917, divisao T1, titulos {'promo': 1, 'msi': 9, 'worlds': 1}, tempo 6.49 h (o jogo segue; o save nunca e perdido)

  --- choque de caixa: time KR na T1 sem patrocinios, 5 titulares da LCK (nota ~86) e R$ 50 mil no cofre ---
  receita 11777/sem x despesa 43500/sem (saldo -31723/sem)
  sem 1: AVISO AMARELO (caixa para 1.6 sem)
  sem 1: AVISO VERMELHO (1.6 sem)
  sem 2: diretoria vende 1 jogador (caixa R$ 3208050; reais no elenco: 4)
  em 60 semanas: caixa R$ 4328041, resgates 1, moral 50, o time segue na T1

=== 4b) Retrato semanal do perfil ativo (semente 1): receita, custo e forca em 4 momentos ===
  tempo   divisao  forca  elenco  fama  seguidores  moral | TV  patroc.  social  loja  bilhet. | custo/sem  saldo/sem
     10 min T2      57.7   58.0     14        827     47 |  1500     780      46   120      0 |       750      1696
     40 min T2      68.8   65.4     61       7832     55 |  1500    3857     250   699      0 |      1578      4727
     90 min T1      87.2   78.2    219     174021     66 |  9000   21890    2556  3222      0 |     11653     25015
    150 min T1      95.8   82.6    469    6135746     68 |  9000   94818   73507 10030   4560 |     38302    153613

=== 5) Cada foco tem o seu papel (ativo, com Mercado; foco fixo vs. misto; mediana de 5 sementes) ===
  misto      titulo em  3.49 h
  treino     titulo em  5.87 h
  conteudo   titulo em  5.01 h
  imprensa   titulo em  5.52 h
  scrims     titulo em  5.03 h
  negociar   titulo em  6.63 h
  descanso   titulo em  6.58 h

=== 6) Regioes (ativo, com Mercado, mediana de 5 sementes) ===
  BR: titulo em  3.49 h
  EU: titulo em  2.91 h
  KR: titulo em  3.23 h

=== 7) Nova temporada (prestigio): 2a run do perfil ativo, com Hall da Fama = PL//10 e o melhor titular mantido ===
  run 1: 3.49 h | run 2: 1.10 h (estrelas 6)
  run 1: 3.51 h | run 2: 1.40 h (estrelas 6)
  run 1: 2.47 h | run 2: 1.37 h (estrelas 4)
  run 1: 3.94 h | run 2: 1.92 h (estrelas 7)
  run 1: 3.36 h | run 2: 1.68 h (estrelas 5)
```

### 8.4 Como ler a saída

- **Tabela 1**: tempos medianos por marco. "5 titul." = inscrição na T2; "1o patr.>=Banco" = 1º contrato de nível 4 (R$ 11 mil/sem); "patr.>=Nexa" = nível 5; "1a intl" = 1ª vaga no MSI/Mundial. O casual abre 3 min a cada 30 min; o ocioso 1 min por hora; ambos jogam o resto no Piloto automático (90% da velocidade, sem eventos nem compras).
- **Tabela 2**: nenhuma fonte passa de 42% da receita; todas aparecem (nenhum botão "obrigatório").
- **Tabela 3 (paredes e buracos)**: o maior intervalo sem nenhuma compra possível é de 12 a 15 min, o caixa mínimo nunca ficou negativo e nenhum resgate foi preciso. Patrocínio: poucos avisos, nenhuma quebra de contrato, 7 a 9 trocas por run (o jogador troca contratos pequenos por grandes).
- **Tabela 4 (estresse)**: o time imprudente (gasta tudo, ignora salário, só faz Conteúdo) sofre 0 a 1 resgate, perde um jogador e segue; chega ao título em 5,3 a 6,5 h. No "choque de caixa" (5 titulares da LCK, sem patrocínio, R$ 50 mil) os avisos amarelo e vermelho disparam na semana 1 e, na semana 2, a diretoria vende 1 jogador e o time passa a ter 60 semanas de caixa. **Não existe falência inevitável.**
- **Tabela 4b**: o retrato semanal: no minuto 10 o time vive de R$ 1,7 mil/sem; aos 150 min fatura ~R$ 190 mil/sem com patrocínio 95 mil, redes 74 mil, TV 9 mil, loja 10 mil, bilheteria 5 mil, e gasta 38 mil.
- **Tabela 5**: nenhum foco sozinho passa do misto (3,5 h): treino 5,9 h, conteúdo 5,0 h, scrims 5,0 h, imprensa 5,5 h, descanso 6,6 h, negociar 6,6 h. Cada um tem um papel.
- **Tabela 7**: a Nova temporada acelera a 2ª volta para ~1,1 a 1,9 h.

### 8.5 Como o jogador percebe o ritmo (sem paredes)

| Fase | O que o jogador faz | Sinal de progresso |
|---|---|---|
| 0 a 6 min | compra os 5 Amadores com a renda de live e o 1º patrocínio (padaria) | "Inscrição na T2: 3/5" |
| 6 a 33 min | Coach, Treino, Gaming house; escolhe Treino/Conteúdo; vai ao 1º split de T2 | força 68 e "Série de acesso" |
| 33 min a 1,1 h | T1: ofertas melhores, 1º Banco Faísca, primeiras estrelas baratas do Mercado | Fama 150 libera tier 4 |
| 1,1 h a 2 h | classificação internacional (50 min na 1ª vez), Bootcamp, MSI, Analista e Psicólogo | taça do MSI |
| 2 h a 3,3 h | estrelas de nota 85 a 88 (R$ 1,6 a 4 mi), Arena, Social media, Mundial | título mundial |

---

## 9. Contrato com o motor

### 9.1 Estado e save

Moeda e itens continuam no motor (`g.m` = R$, `g.o[]`, `g.stars` = 🌟 Hall da Fama, `g.pc` = nº de temporadas). O resto vive em `g.tabs.<plugin>` (cada plugin guarda o seu).

```js
GAMES.esp.cur = "R$";  GAMES.esp.weekly = true;  GAMES.esp.noClick = true;  GAMES.esp.ver = 2;
GAMES.esp.eco = { WK: 40, away: { eff: 0.9, max: 14400 } };

// g.tabs.semana (plugin esp-semana.js)  -  tudo numero/string pequena, sem objetos grandes
{ v: 1, seed: 123456789, wk: 0, wp: 0,             // semana atual e progresso em segundos (0..40)
  foco: "treino", prox: "treino", auto: 1,         // foco em andamento, foco da proxima semana, piloto automatico
  F: 0, seg: 120, M: 60,                           // Fama, seguidores, moral
  forma: [0, 0], scrim: 0, lesao: [0, 0],          // [valor, semanas]
  cd: { imprensa: 0, negociar: 0, bootcamp: 0 },   // semanas restantes de cooldown
  con: [{ t: 1, v: 700, v0: 700, rest: 12, rev: 8, st: 0, h: [] }],   // contratos: t=nivel 1..6, v=valor atual, v0=base,
                                                   // rest=semanas, rev=semanas ate a revisao, st=avisos, h=ultimas 8 partidas (1/0)
  of: [{ t: 2, v: 1800, prazo: 16, meta: 0.4, vida: 4 }],           // ofertas (max 3)
  gh: [], inv: 0,                                  // bruto das ultimas 4 semanas; total investido em estrutura (manutencao)
  evcd: 4, ev: null,                               // cooldown de evento; evento pendente { id } (barra pausada)
  pl: 0, hall: { promo: 0, msi: 0, wd: 0 },        // Pontos de Lenda e titulos
  ren: 1, log: [],                                 // renovacao automatica; ate 6 linhas de texto
  st: { resg: 0, ev: 0, venda: 0 } }               // estatisticas (conquistas)
```

**Sanitização** (`load`): `wk`, `wp`, `seg`, `F` (0..1000), `M` (0..100), valores de contrato e arrays com `num()` do motor e tamanhos máximos (`con` <= 3, `of` <= 3, `log` <= 6, `h` <= 8). `foco` e `prox` precisam estar na lista dos 7. **Nunca** salvar com caixa < 0 (o resgate roda antes de salvar).

`g.tabs.liga` mantém o formato atual (`div`, `yr`, `sp`, `ph`, `gi`, `w`, `l`, `ser`, `ti`, `fail`, `played`, `intl`), **sem** `cd` e com `seed` passando a ser o `seed` da Semana. `g.tabs.mercado` mantém `S.s[5]`, `S.b[2]` com `{id, paid, imp}`.

**Migração**: se `g.ver` não existir (save antigo do eSports), manter só `ach`, `stars`, `pc` e `t`; zerar `m` (= 3000), `o[]`, `vis`, `goal` e descartar `tabs.liga/mercado`; toast "A economia do eSports mudou: o time recomeça, mas Hall da Fama e conquistas ficam." Lan House e Caverna não mudam.

### 9.2 O que vira aba (plugin) e o que fica na tela Time

| Parte | Onde | Arquivo | Conteúdo |
|---|---|---|---|
| Dados e funções puras | módulo de dados | `js/data/esp-eco.js` | constantes (`C`), `price`, `salary`, `winP`, `mix`, tabela de contratos, `FOCOS`, `EVENTOS`, formatos de texto. Sem DOM, testável em Node. |
| Relógio da semana, Foco, Piloto, eventos, offline, prestígio | **painel "home" da tela Time** + plugin sem aba | `js/tabs/esp-semana.js` (`registerTab('esp', { id: 'semana', home: true, ... })`) | `update(dt)` avança `wp`; ao chegar a 40 s roda `closeWeek` (1.6). Roda mesmo com a aba fechada. |
| **Time** (tela principal) | core | motor + painel home | ver 9.3 |
| **Liga** | aba | `js/tabs/esp-liga.js` (refatorar) | classificação, chave, últimos jogos; **sem relógio**: expõe `shared.liga.step(S, semana)`. |
| **Mercado** | aba | `js/tabs/esp-mercado.js` (ajustar preços) | contratar/vender com R$; mostra `preço` e `salário/sem`; usa `eco.price/salary`. |
| **Negócios** (nova) | aba | `js/tabs/esp-negocios.js` | 3 blocos: Patrocínio (ofertas, contratos, meta/multa, Trocar), Redes (seguidores, crescimento, publi/sem), Finanças (receita por fonte, despesa, saldo/sem, caixa para N semanas). |
| Evento semanal | diálogo | `esp-semana.js` | `api.openDialog` com 2 botões; pausa a barra. |

Abas finais: **Time | Liga | Mercado | Negócios**. A aba Negócios ganha um ponto (badge) quando há oferta nova ou contrato em aviso.

### 9.3 O que a tela Time mostra no lugar do botão grande

De cima para baixo (uma coluna, mobile):
1. **Faixa de alerta** (só quando existe): amarela/vermelha com o texto da 3.4 e botão "Ver finanças".
2. **Barra da semana**: "Semana 14 · Treino pesado" com barra de 40 s e, ao fechar, 1 linha de resumo: "Vitória vs Corujas da Noite · +R$ 18,4 mil · Fama +1,2".
3. **4 chips**: `R$ 124 mil (+3,1 mil/sem)`, `Fama 214 (Estrela)`, `Seguidores 174 mil`, `Moral 66` (barra de cor).
4. **Grade de foco**: 7 cartões + "Auto" (2 colunas). O ativo da próxima semana tem borda; indisponíveis ficam cinza com o motivo.
5. **Meta de temporada** (uma linha, como hoje) e, no rodapé, **lista de compras do motor** (Amadores, Coach, Treino, Gaming house...).

O botão `#big`, o contador "+N por toque" e o combo somem (`GAMES.esp.noClick = true`).

### 9.4 Mudanças no motor (`engine.js`)

| Mudança | Detalhe |
|---|---|
| `G.weekly` | O motor **não** chama `earn(k, dt)`, não usa `psBase` na produção e não aplica `boost/combo`. `ps()` devolve 0. |
| `G.noClick` | Esconde o botão grande e o combo; `doClick` ignora o jogo. Remove conquistas `click` do eSports (`c1000`) e `ev` clutch (`G.ev = null`; o motor precisa tolerar `G.ev` ausente). |
| HUD | O hook `hud` pode devolver `bal` e `ps` (strings): `R$ 124 mil` e `+R$ 3,1 mil/sem`. O motor mostra no lugar de `G.cur + fmt(m)` e `fmt(ps)/s`. |
| `api.pay(v)` | Novo: `m -= v` **sem** piso (só o plugin Semana usa; o resgate garante `m >= 0` antes de salvar). `api.earn` continua igual (alimenta `t`/`life`). |
| Offline | Para jogos `weekly`, `creditAway` chama o hook `away(sec, api)`; ele simula as semanas, atualiza o estado e devolve `{ lines: [...] }` para o diálogo ("Você ficou fora por 2 h 10 min. Piloto automático: 195 semanas, 12 vitórias..., +R$ 3,2 mi"). A taxa de 50% do motor **não** se aplica; vale `eco.away.eff = 0.9` e `max = 4 h`. |
| Prestígio | `G.pr.hook = true`: `pending(k)` consulta o hook `prestigeInfo()` -> `{ gain, can }` e `prestige(k)` chama `doPrestige(api)` (7). O texto do botão continua `G.pr.ask`. |
| Itens | `it.auto = true` (sem linha de compra; só `setOwned`); `it.gate` = nome de um hook que devolve o motivo do bloqueio (Arena fora da T1: "Só na liga principal"). Novo `smm` no fim do array (índice 13). |
| Metas de temporada | recompensa `max(2.000, 3 x bruto semanal médio)` em R$ (via `G.goalRw(api)`; substitui `goalMul x ps`). |
| Formatação | `fmt` precisa de variante monetária: `R$ 1,2 mil`, `R$ 3,4 mi`, `R$ 1,1 bi`. |
| Conquistas novas (`api.unlock`) | "Cem semanas de gestão" (wk >= 100), "Fama 100", "Gestão de crise" (10 eventos), "Vendeu o craque" (resgate), "Contrato dos sonhos" (tier 6), "Casa cheia" (Arena 1) etc. |

### 9.5 Contrato entre plugins (`api.shared`)

```js
shared.region, shared.division ('T2'|'T1'), shared.intl           // Liga (como hoje)
shared.roster = { notas: [5], reais: [{ id, o, a, paid, imp }], star, avg5 }   // Mercado: Estrela = soma(max(0, o-80))
shared.genNota = 58 + 2*treino + 1*house                           // Semana escreve; Mercado usa para vaga Amadora
shared.liga.step(S, semana)  -> { win, kind, round, done, title, prize, fame, pl, log }   // Semana chama 1x por semana
shared.eco = { S(kind), U(), runway(), saldo(), sellForced() }     // Semana expõe; Negócios e Mercado leem
```

`Liga.step` recebe a força **já calculada** (a Semana monta `S` com forma, scrim, lesão e pity) e a semana; devolve o resultado e o prêmio/fama/PL do bloco correspondente. `Mercado.sellForced()` executa o resgate (vende o jogador real de maior salário a 70%).

### 9.6 Contrato com a cena (`scenes/esp.js`)

`o[]` continua com os 13 primeiros índices e **um novo** (13 = `smm`: pessoa com notebook e perfil de rede). Os espelhos preenchem a cena sem lógica extra:

| Índice | Quem preenche | Regra |
|---|---|---|
| 7 `patro` | Negócios | nível do maior contrato ativo (0 a 6) |
| 8 `canal` | Semana | seguidores >= 100 / 1 mil / 10 mil / 100 mil / 1 mi / 5 mi |
| 10 `fa` | Semana | limiares de Fama 5, 15, 60, 150, 320, 550 |
| 12 `titulo` | Liga | `min(6, promo + min(3, msi) + 2 se campeão mundial)` |

Campos novos em `x` (opcionais; sem eles a cena segue como hoje):

| Campo | Faixa | Uso sugerido na cena |
|---|---|---|
| `x.focus` | `"treino"`, `"conteudo"`, `"descanso"`, `"scrims"`, `"imprensa"`, `"negociar"`, `"bootcamp"` | treino: telas de VOD acesas; conteúdo: ring light e câmera ligadas; descanso: luz baixa e "Zzz"; scrims: um 2º time no fundo; imprensa: microfones; negociar: homem de terno; bootcamp: malas |
| `x.mood` | 0 a 100 (moral) | < 40 cabeça baixa; > 80 comemorando |
| `x.wp` | 0 a 1 | progresso da semana (a cena pode piscar placar no fim) |
| `x.last` | `"W"`, `"L"` ou `null` | confete/luz vermelha por ~2 s |
| `x.alert` | 0, 1, 2 | 2 = lâmpada vermelha piscando |
| `x.ev`, `x.boost`, `x.combo` | - | deixam de ser usados no eSports (o motor preenche valores neutros) |

### 9.7 Textos fixos

- Aviso amarelo: "Caixa para {n} semanas. Troque para Conteúdo ou venda um jogador."
- Aviso vermelho: "Caixa para 1 semana! A diretoria vai intervir."
- Resgate: "A diretoria vendeu {nome} por R$ {x} para fechar as contas. Ele deixa saudades e um buraco na defesa."
- Recesso offline: "O time entrou em recesso: o caixa estava baixo e a comissão preferiu não arriscar. Volte e ajuste as contas."
- Offline: "Você ficou fora por {tempo}. O Piloto automático tocou {n} semanas: {v} vitórias, {d} derrotas, {t} troféus. Caixa: +R$ {x}."
- Meta de contrato: "Meta: vencer {m}% dos jogos (você vence ~{p}%)."
- Contrato em aviso: "{marca} está de olho em vocês: valor reduzido por 8 semanas."
- Contrato quebrado: "{marca} rompeu o contrato. Multa: R$ {x}."

### 9.8 Testes que valem a pena

1. `mix(seed, wk, g)` determinístico: mesmo save + mesmas escolhas = mesmos resultados; recarregar a página no meio da semana não muda o jogo.
2. Offline: simular N semanas de uma vez (Piloto automático) = N chamadas a `closeWeek` seguidas.
3. Resgate: com `m < 0` no fechamento da semana o estado pós-fechamento tem `m >= 0` e um jogador a menos.
4. Regressão de balanceamento: portar `sim_esports.py` para Node (ou rodá-lo em CI) e exigir: ativo/com Mercado entre 2,5 e 3,5 h (mediana de 9 sementes), casual 3,6 a 4,8 h, caixa mínimo > 0, maior intervalo sem compra < 20 min.

### 9.9 Ordem sugerida de implementação

1. `esp-eco.js` + `esp-semana.js` (relógio, Foco, receitas e despesas, Piloto) sem Liga nova: usar o Liga atual com `step`.
2. Refatorar Liga (remover `cd`, adversários novos, pity) e Mercado (preços R$, `shared.roster`).
3. Aba Negócios (patrocínio e finanças), depois redes.
4. Eventos e alertas; offline e prestígio.
5. Motor: `weekly`, `noClick`, `pay`, `away`, `hud.bal/ps`, formatação R$.
6. Cena: `focus`, `mood` (opcional).


## 10. Implementação (desvios e resultados)

Arquivos: `js/data/esp-eco.js` (constantes e funções puras `ECO`), `js/tabs/esp-semana.js` (plugin `home`: semana, foco, eventos, ofertas, resgate, prestígio), `esp-liga.js` (sem relógio próprio; `step(Sf, wk, seed)`), `esp-mercado.js` (preços/salários em R$), `esp-negocios.js` (Patrocínio, Redes, Finanças), `scenes/esp.js`. Funções entre plugins em `window.ESPX`.

Simulação do motor real (`node tests/sim_esp.js todos 9`, região BR, jogador sintético): ativo ~3,3 h (alvo 2,5-3,5), casual ~4,5 h (alvo ~4), ocioso (volta a cada 1 h) ~6,1 h; caixa mínimo > 0, sem resgates, maior intervalo sem compra do ativo ~11 min.

Desvios: (1) viagem e bônus de TV usam `res.kind` (o Python original usava o resultado errado); (2) sem reservas reais no Mercado e sem `offs` de região na Liga; dispensar um real vira amador; (3) recompensa de meta = 3x a receita bruta semanal; (4) a semana só começa a contar depois da escolha da região e a barra pausa com evento pendente; (5) funções compartilhadas em `ESPX`, não em `api.shared`.
