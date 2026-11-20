# Mini Idle 3 em 1

Três jogos idle/tycoon em um só site estático:

- **Lan House**: do PC de tubo à rede de arenas.
- **Caverna ao Espaço**: da fogueira ao foguete.
- **Time de eSports** (tema LoL): 5 titulares, reservas, coach, **Mercado** de jogadores reais (BrasLOL) e **Liga** (T2, promoção, MSI e Mundial).

Cada jogo tem cena animada, upgrades por nível, eventos clicáveis, conquistas e prestígio.

## Como rodar

Abra `index.html` no navegador. Não precisa de build nem de servidor.

## Publicar no Vercel

Importe este repositório no Vercel (Framework: *Other*, sem build command). O site é estático.

## Save

O progresso fica salvo no navegador (`localStorage`, chave `miniidle-v2`). No menu há **exportar/importar save** em texto para levar o progresso para outro aparelho.

## Estrutura

- `index.html`, `css/style.css`: casca e estilos
- `js/engine.js`: motor, interface, save
- `js/games/*.js`: dados de cada jogo
- `js/tabs/<jogo>-<id>.js`: abas extras de cada jogo (plugins; `Engine.registerTab`). Hoje: `esp-mercado.js` e `esp-liga.js`
- `js/data/jogadores.js`: 280 jogadores reais de 6 ligas (BrasLOL); `img/jogadores/<id>.webp` é opcional (foto no cartão)
- `js/scenes/*.js`: cenas animadas em canvas
- `docs/`: especificações de design, conteúdo e interface; `docs/TABS_API.md` (API de abas), `docs/LOL_MERCADO.md` (Mercado, Liga, balanceamento)
- `tests/`: testes (`node tests/tabs_api.js`, `node tests/esp_logic.js`, `python3 tests/e2e.py`) e simulador do motor real (`node tests/sim_esp.js todos 9`)
