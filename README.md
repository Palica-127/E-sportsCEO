# Esports Org (nome provisório)

Jogo de gerenciamento de uma organização de esports, em site estático (sem build, sem backend). Abra `index.html` ou publique no Vercel (Framework "Other", sem build command).

## O que já tem (esqueleto)
- **Org**: caixa, reputação, semana/ano, região (liga de origem), avançar 1 ou 4 semanas, histórico.
- **Jogos**: LoL ativo; CS2, Dota 2 e Valorant já existem no modelo (funções de cada jogo), mas ainda sem dados.
- **Elenco**: por jogo, 3 times (T1, T2, Academy): 5 titulares (um por função) + 2 reservas. T1 já nasce ativo, T2 custa licença, Academy ainda sem dados.
- **Mercado**: todos os jogadores do BrasLOL (T1 das 6 ligas + T2 com elenco), filtros por função, liga, nome, "posso pagar" e ordem por preço.
- **Estrutura**: gaming house, teclados/mouses, fones/monitores, psicólogo, nutricionista, academia e cozinha, com níveis e bônus de força.
- **Ligas**: navegar por todas as ligas e times (T1 e T2) com seus elencos; tabela provisória por força do elenco (ainda sem partidas).
- Save automático no navegador (`localStorage`, chave `org-v1`).

## Estrutura
- `js/core.js`: regras e estado (sem DOM, testável em Node)
- `js/ui.js`: telas e eventos
- `js/data/lol.js`: dados do LoL, gerado do BrasLOL com `python3 tools/gen_lol.py <braslol/index.html> js/data/lol.js`
- `tests/e2e.py`: teste de fumaça no navegador (Playwright)

## Próximos passos sugeridos
1. Calendário e partidas simples (resultado por força), com tabela real, playoffs e premiação.
2. Dados de CS2, Dota 2 e Valorant (ligas, times, jogadores) e Academy do LoL.
3. Contratos (duração, salário, renovação), base/revelação de jogadores, transferências entre times da org.
4. Patrocínios, redes sociais e eventos.
5. Nome definitivo do jogo e do repositório.
