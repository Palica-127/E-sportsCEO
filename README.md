# eSports CEO

Jogo de gerenciamento de uma organização de esports, em site estático (sem build, sem backend). Abra `index.html` ou publique no Vercel (Framework "Other", sem build command).

**Visual:** inspirado no BrasLOL (azul-marinho e dourado, fontes Barlow, painéis com cantos dourados, escudos por time, trilha de etapas). Logo: símbolos prontos ou imagem enviada por você (reduzida para 128x128 e salva no navegador). Aba Calendário com próxima partida, chance de vitória, mês e agenda. Os escudos dos times são gerados (iniciais + cor), não são os logos reais.

**Layout:** feito principalmente para PC (barra lateral + cards em colunas a partir de 900px) e também funciona no celular.

**Começo de jogo:** você cria a org (nome e logo), escolhe UM jogo e região para começar e tenta convencer uma estrela a assinar (3 convites; a chance cai com a nota: ~87% na 70, ~22% na 80, ~1% na 91). Os outros jogos abrem com o tempo (o 1º após 26 semanas, o 2º após 52...) pagando licença.

## O que já tem (esqueleto)
- **Org**: caixa, reputação, semana/ano, região (liga de origem), avançar 1 ou 4 semanas, histórico.
- **Jogos**: os 8 estão ativos (LoL, CS2, Dota 2, Valorant, Free Fire, Rainbow Six Siege, EA FC, Wild Rift), cada um com elenco e funções próprias (ex.: Free Fire 4+2, EA FC 1+1) e 3 regiões com T1 e T2, liga, playoffs e 2 torneios internacionais por ano. LoL usa dados do BrasLOL (`tools/gen_lol.py`). Nos outros jogos os nomes das orgs são reais (aproximados), mas **jogadores, notas e idades são gerados/fictícios** (`tools/gen_outros.py`). Cada jogo tem sua própria região.
- **Elenco**: por jogo, 3 times (T1, T2, Academy): 5 titulares (um por função) + 2 reservas. T1 já nasce ativo, T2 custa licença, Academy liberada no LoL.
- **Mercado**: todos os jogadores do BrasLOL (T1 das 6 ligas + T2 com elenco), filtros por função, liga, nome, "posso pagar" e ordem por preço.
- **Estrutura**: gaming house, teclados/mouses, fones/monitores, psicólogo, nutricionista, academia e cozinha, com níveis e bônus de força.
- **Competições (LoL)**: calendário semanal. Cada time da org (T1 e T2) joga a liga da sua região: pontos corridos (todos contra todos, Bo1), playoffs com os 6 primeiros (quartas Bo3, semifinais Bo3, final Bo5), premiação em dinheiro, bônus por vitória, reputação e histórico de campeões. 2 splits por ano. O resultado de cada jogo vem da força dos elencos (média dos titulares + estrutura) com sorteio por semente salva no jogo. É preciso ter os titulares completos antes do split começar. O botão "Ir até a próxima partida" pula as semanas sem jogo.
- **Ligas**: além da competição da org, dá para explorar todas as ligas e times (T1 e T2) com seus elencos.
- Save automático no navegador (`localStorage`, chave `org-v1`).

## Estrutura
- `js/core.js`: regras, estado e simulação das competições (sem DOM, testável em Node)
- `js/ui.js`: telas e eventos
- `js/data/lol.js`: dados do LoL, gerado do BrasLOL com `python3 tools/gen_lol.py <braslol/index.html> js/data/lol.js`
- `tests/core.js`: testes da lógica (`node tests/core.js`)
- `tests/e2e.py`: teste de fumaça no navegador (Playwright)

## Próximos passos sugeridos
1. ~~Calendário e partidas simples~~ (feito para o LoL: tabela, playoffs, premiação).
2. ✓ Torneios internacionais (MSI com 8 times após o split 1, Mundial com 16 após o split 2), promoção e rebaixamento entre T2 e T1 (times da IA) e Academy do LoL.
3. ✓ Dados e competições dos outros jogos (CS2, Dota 2, Valorant, Free Fire, R6, EA FC, Wild Rift).
4. ✓ Contratos (2 anos, aviso 8 semanas antes, renovação por 50% da taxa), Categoria de base (revela jovens com potencial a cada split, evoluem) e mover jogadores entre T1, T2 e Academy.
5. ✓ Patrocínios (até 3, propostas a cada 6 semanas), redes sociais (seguidores e anúncios), foco da semana (treino/mídia) e eventos aleatórios — aba Negócios.
6. ✓ Nome do jogo: eSports CEO (o repositório você renomeia no GitHub).
