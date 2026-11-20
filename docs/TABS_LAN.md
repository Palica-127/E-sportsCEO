# Abas da Lan House: Torneios, Equipe e Ranking

Três plugins de aba (API em `docs/TABS_API.md`, `Engine.version === 1`). Arquivos: `js/tabs/lan-torneios.js`, `js/tabs/lan-funcionarios.js`, `js/tabs/lan-ranking.js`, `css/tab-lan.css` (prefixo `.lan-`). Testes: `node tests/lan_tabs.js` (79 verificações) e `node tests/lan_tabs.js sim [n]` (balanceamento). Nenhuma aba mexe em `engine.js`, `style.css`, `games/*` ou `scenes/*`.

## 1. Resumo

| Aba | Chip | Abre quando | Ideia |
|---|---|---|---|
| Torneios | 🏆 Torneios | 4 PCs + 1 Placa de vídeo (~2 min) | Organiza campeonatos (CS 1.6, FIFA/PES, MK, LoL, DotA, Ragnarök), paga custo, recebe inscrições + consumo, rola evento, ganha R$ e Reputação |
| Equipe | 🧑‍💼 Equipe | 1º Atendente comprado (~7 min) | Contrata e melhora 6 cargos (8 vagas); salário recorrente; efeitos de renda, eventos e automação |
| Ranking | 🥇 Ranking | 1º SSD (~11 min) | Clientes fixos procedurais, top 10, rivalidades, recordes, Campeão da lan semanal, patrocínio |

Moeda nova: **⭐ Reputação da lan** (aba Torneios). Atenção ao nome: o prestígio da Lan já se chama "🏆 Reputação" (`GAMES.lan.pr.coin`); na aba o texto sempre diz "Reputação da lan" / ⭐ para não confundir.

Os chips dos 4 sub-menus (Comprar + 3) só cabem em 360 px com o ícone sobre o rótulo; isso é feito em `tab-lan.css` com `.subtabs:has(.subtab[data-t="torneios"])` (só afeta a Lan; sem `:has` a barra rola na horizontal).

## 2. Torneios

- **Escolha**: jogo (chips) e formato (chips). Travas por Reputação acumulada (`S.life`, nunca cai) e por estrutura:

| Nível | Reputação acumulada | Jogos liberados | Formatos |
|---|--:|---|---|
| Rachão do quarteirão | 0 | CS 1.6, FIFA/PES | Mata-mata relâmpago (30 s) |
| Copa Interbairros | 6 | Mortal Kombat | Grupos + final (90 s) |
| Torneio da cidade | 22 | LoL (precisa de 5 PCs) | Pontos corridos (3 min) |
| Estadual das lans | 60 | DotA/Warcraft III (8 PCs) | Chave dupla (5 min) |
| Nacional ao vivo | 130 | Ragnarök (Internet nível 2) | |

- **Custo** = `c_f × duração × P × g_jogo`, com `P = max(2, psBase)` e `c_f` = 0,09 / 0,10 / 0,11 / 0,12 por formato (30 s / 90 s / 3 min / 5 min). Dividido em prêmio (65%) e estrutura (35%), só para exibição. Debitado ao iniciar.
- **Retorno esperado** = `custo × (1 + ρ)`, `ρ = 0,14 + 0,10·PCs/12 + 0,04·Internet/5 + 0,04·Cantina/6` (0,14 a 0,32). 72% são inscrições; 28% é consumo (salgadinho), que depende da Cantina, do jogo (FIFA 1,3x, MK 0,9x...) e do bônus de consumo da Equipe. Inscritos exibidos: `PCs × (1,4 + 0,3·Internet)`.
- **Evento** (55% de chance; sorteado ao iniciar, revelado entre 50% e 80% do tempo): negativos (Apagão x0,55, Trapaça x0,85 e -3 rep, Briga de torcida x0,80 e -4, Ping 999 x0,90, Inscrição fiada x0,85, Fiscal x0,85) e positivos (Casa cheia x1,25, Bombou no Orkut x1,12 e +3, Final épica x1,08 e +4, Padaria patrocinou x1,18). A Equipe reduz a chance de os negativos acontecerem (`fn:fx.mit`, teto 85%); quando evita, aparece uma linha de humor.
- **Pagamento**: no fim, `receita = retorno × evento`. Só o **lucro** conta como renda total (prestígio): devolve o custo com `earn(custo, false)` e o excedente com `earn(lucro)`.
- **Reputação por torneio** = `rep_formato (1/3/6/10) × rep_jogo (1 a 1,6) × (0,9 + 0,2·PCs/12)` + eventos (mínimo -2 por torneio). Bônus permanente: `1 + 0,04 · rep/(rep+80)` via `api.mult('tn:rep')` (teto +4%).
- **Duração em tempo real**: usa `dt` do `update`; o salvo guarda `ts = Date.now()`. Ao recarregar, o tempo fora (até 4 h) avança o torneio; se terminou, o resultado entra no histórico e aparece um toast. Quando a página volta ao primeiro plano, o `update` detecta o intervalo pelo relógio e faz o mesmo (a API não dá `update` durante o tempo fora).
- **Agenda automática** (Gerente nível 3): repete o último torneio se houver 2,5x o custo em caixa. Não encadeia durante o tempo offline.
- **Integração**: o campeão do torneio sai do ranking (`rk:pool`, peso `(hab/100)³`, 2x se o jogo é o favorito); o resultado vai em `tn:res` para o Ranking dar pontos.
- Histórico: últimos 8 torneios.

## 3. Equipe (funcionários)

Custos em **segundos de renda** (`P`), para continuar sendo sumidouro em qualquer fase: contratar = `k·P`; subir do nível `n` para `n+1` = `k·1,7ⁿ·P`.

| Cargo | Vagas | Libera com | k | Renda por nível (1..5) | Salário (% de P/s, nível 1) | Efeitos por nível |
|---|--:|---|--:|---|--:|---|
| Atendente | 2 | (aba aberta) | 10 | 0,7 / 0,4 / 0,3 / 0,2 / 0,2% | 0,18% | consumo +4% |
| Técnico de TI | 1 | SSD | 12 | 0,3 / 0,2 / 0,2 / 0,1 / 0,1% | 0,22% | apagão -18% (perda), lag -10%, trapaça -6% (chance) |
| Faxineiro | 1 | Monitor gamer | 8 | 0,4 / 0,2 / 0,2 / 0,1 / 0,1% | 0,12% | briga -3%, fiscal -4% |
| Cantineiro | 1 | Cantina | 12 | 0,5 / 0,3 / 0,2 / 0,2 / 0,1% | 0,15% | consumo +8% |
| Gerente | 1 | Internet | 20 | 0,8 / 0,5 / 0,4 / 0,3 / 0,2% | 0,30% | salários -4%, fiscal -8%; nível 3 liga a agenda automática |
| Segurança | 2 | Campeonato de CS | 25 | 0,2 / 0,1 / 0,1 / 0,05 / 0,05% | 0,25% | briga -9%, calote -8%, trapaça -5% |

- Salário de um funcionário = `sal × (1 + 0,3·(nível-1))`, cobrado a cada 60 s de jogo (dia de pagamento). Com equipe completa e nível máximo a folha é ~3% da renda.
- Renda total: `api.mult('fn:staff', 1 + Σ)`, teto 12% (o máximo real das vagas é 10,0%).
- **Apagão do motor**: com o Técnico, o apagão (x0,25) é compensado por `api.temp('fn:estab', 0,25^-mit, 0,35 s)`; o apagão é detectado por `ps/psBase`. O temporário é removido no instante em que o apagão acaba.
- **Sem salário**: se o saldo não cobre o pagamento, o funcionário fica "atrasado" (⚠); no pagamento seguinte, se continuar sem dinheiro, pede demissão (toast humorado). Consequência amena: perde só o cargo; ao recontratar volta com metade da experiência (`vet`, nível `ceil(maior_nível/2)`).
- Dispensar pede dois toques; não devolve dinheiro.
- Cada funcionário tem nome fixo de uma lista de 22 e frases por cargo que rotacionam a cada 30 s.

## 4. Ranking da lan

- Chegada de clientes: 4 ao abrir, depois 1 a cada ~120 s até `min(20, 4 + PCs + Internet + Cantina)`. Apelidos: "Zé do AWP", "xX_Sniper_Xx", "Dragão2005", "Naruto_BR"... únicos. Cada um tem jogo favorito, habilidade (1 a 100), pontuação (Elo 1000), lealdade (0 a 100).
- A cada 20 s há uma partida (50% de chance de ser entre rivais). `P(vitória) = 1/(1+e^-(Δhab/10))`; Elo com K = 24; habilidade sobe `0,35·(1-hab/100)` por partida (dobro se patrocinado) e com os torneios (favorito do jogo +1,2, campeão +2).
- **Lealdade**: +0,05/s, +3 por partida, +2/+6 por torneio; ≥ 50 = **fiel** (+0,22% de renda cada). **Patrocinar** (máx. 3): custo `40·P·(1 + 0,75·patrocínios)`; +0,5% cada, treina em dobro, o campeão patrocinado rende +1 de Reputação extra. Bônus total `api.mult('rk:fiel')`, teto +7%.
- **Semana da lan** = 480 s de jogo. No fim, o líder de pontos da semana vira Campeão da lan: prêmio `6·P` (conta como renda), +1 Reputação (via `rk:repOut`, consumido pelos Torneios), toast e banner. A cada semana a habilidade sobe um pouco, as rivalidades são refeitas (até 3 pares) e, com a lan lotada, o cliente menos fiel sem patrocínio pode "mudar de bairro".
- UI: card do campeão (barra da semana), card de fiéis/bônus, top 10 (diff via `api.list`, botão Patrocinar de 44 px), rivalidades (placar), recordes (sequência, pontuação, torneios vencidos, títulos, últimos campeões).

## 5. Persistência e prestígio

| Dado | Salvo em | Prestígio (Vender a lan) |
|---|---|---|
| Torneios: reputação, histórico, torneio em curso, escolha, agenda, sementes | `g.lan.tabs.torneios` (~2 KB) | **permanece** (o torneio em curso continua), bônus reaplicado em `onPrestige` |
| Equipe: contratados, níveis, dia de pagamento, experiência (`vet`) | `g.lan.tabs.funcionarios` | contratados saem (a lan foi vendida); `vet` fica e reduz o recomeço; `fn:staff` volta a 1 |
| Ranking: clientes, semana, recordes, rivalidades, campeões | `g.lan.tabs.ranking` (~5 KB) | **permanece** (os clientes seguem para a nova lan) |
| `api.shared`: `fn:fx` (efeitos da Equipe), `rk:pool`, `rk:repOut`, `tn:res` | `g.lan.sh` | `g.sh` não é limpo pelo motor |
| Multiplicadores `tn:rep`, `fn:staff`, `rk:fiel` | `g.lan.mu` (motor) | o motor limpa; cada aba reaplica em `onPrestige` e em `load` |

`load` valida tipos e limites de tudo (dados adulterados e saves antigos sem `tabs` abrem com padrões). Sem `setOwned`/`setExtra`: as abas só usam `api.mult`, `api.temp`, `api.earn`, `api.spend` e `api.shared`.

## 6. Balanceamento (simulação com o motor real)

`node tests/lan_tabs.js sim 5` (5 sementes; jogador sintético a 2 cliques/s, compra gananciosa pelo menor retorno; toca o disjuntor). Modos: **off** = abas travadas; **passive** = abas abertas, bot só compra itens (vale o bônus automático dos clientes); **on** = bot racional (só contrata/sobe nível o que se paga em 40 min, organiza torneio sempre que há caixa, patrocina se compensa); **max** = compra tudo da Equipe o quanto antes (pior caso de teto).

| Modo | Arena de eSports | Tudo no máximo | Bônus multiplicativo final (Equipe / Ranking / Torneios) |
|---|--:|--:|---|
| off | 126,7 min | 138,6 min | 1,000 / 1,000 / 1,000 |
| passive | 121,5 min | 132,7 min | 1,000 / 1,042 / 1,006 (+4,8%) |
| on | 119,7 min | 130,2 min | 1,023 / 1,043 / 1,034 (+10,3%) + lucro de torneios = 2,9% da renda |
| max | 141,2 min | 150,7 min | 1,100 / 1,058 / 1,035 (+20,4%) + lucro de torneios = 4,9% da renda |

- Teto de projeto: `1,10 × 1,07 × 1,04` = **+22,4%** de multiplicador + ~5% de lucro de torneio = **~+27%** (< 30%). Medido no pior caso (max): +20,4% e +4,9%.
- Jogador racional termina ~6% mais cedo (arena -7 min, tudo máximo -8 min). Comprar toda a Equipe cedo demais **atrasa** o jogo em 8 a 9% (a Equipe é sumidouro de moeda; a recompensa é pequena, de propósito).
- Sumidouros: custo e prêmio dos torneios (devolvidos com ~30% a 45% de margem, menos eventos), contratação e níveis (segundos de renda crescentes 1,7x), salários (0,5% a 2% da renda total no jogo todo), patrocínio (crescente 0,75x por vaga).
- Medido: o jogo base da Lan (bot guloso) termina em ~2,3 h com tudo no máximo e ~2,1 h na Arena; o `DESIGN.md` fala em ~2,9 h (jogador humano mais lento). Os tempos acima valem para o bot.
- A razão `ps@120 on/off` (~1,8x) não é bônus: é apenas o bot "on" estar adiantado numa curva exponencial. O ganho real é o multiplicador acima.

Constantes para ajustar (início de cada arquivo): `BONUS_CAP`, `c_f`, `ρ`, probabilidade e fatores dos eventos (Torneios); `INC_CAP`, `k`, `GROW`, `sal`, `PAY_EVERY` (Equipe); `FIEL`, `FIEL_B`, `SPON_B`, `BONUS_CAP`, `WEEK` (Ranking).

## 7. Limitações da API e soluções

1. Sem `update` durante o tempo fora: Torneios compara `Date.now()` com o último `update`/`save` e aplica o intervalo (máx. 4 h).
2. `api.mult` é global na produção; não há gancho no valor do clique.
3. Os eventos do motor (apagão) não são acessíveis pela API: a Equipe detecta por `ps/psBase` e compensa com `api.temp`.
4. `api.shared` é o único canal entre abas; as chaves seguem o prefixo da aba (`tn:`, `fn:`, `rk:`).
5. A barra de sub-abas é do motor; o ajuste para 4 chips em 360 px usa CSS com `:has()`.
6. `tests/boot.js` lê todos os `<script>` do `index.html`; `lan_tabs.js` trata como vazio um arquivo de `js/` ainda inexistente (outras abas em desenvolvimento).
