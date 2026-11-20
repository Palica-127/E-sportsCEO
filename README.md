# Mini Idle 3 em 1

Três jogos idle/tycoon em um só site estático:

- **Lan House**: do PC de tubo à rede de arenas.
- **Caverna ao Espaço**: da fogueira ao foguete.
- **Time de Esports**: 5 titulares, reservas, 1 coach e muita torcida.

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
- `js/scenes/*.js`: cenas animadas em canvas
- `docs/`: especificações de design, conteúdo e interface
