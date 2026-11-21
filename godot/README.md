# eSports CEO — versão Godot 4

Port do jogo web (`../js`) para Godot 4.4. O motor (`core/org.gd`) é uma tradução fiel de `js/core.js`:
com a mesma semente, o resultado é **idêntico ao do JS** (conferido em LoL, CS2, Free Fire e EA FC por 3–4 anos).

## Rodar / exportar
1. Abra a pasta `godot/` no Godot 4.4 (ou mais novo) e aperte F5.
2. Exportar: Projeto → Exportar. Já há presets de **Web** e **Windows**. Para Android, instale o template e adicione um preset.

## Estrutura
- `core/p1..p7.part` → `core/org.gd` (autoload `Org`). **Edite os `.part` e rode `./build.sh`**: ele concatena em `org.gd` e `ui/main.gd`.
- `ui/u1..u4.part` → `ui/main.gd` (a interface é toda montada por código).
- `data/*.json` vêm de `js/data/*.js`: `node tools/export_godot.js` (na raiz do repo) regenera.
- Save em `user://org-v1.json`.

## Testes (headless)
- Paridade com o JS: `node tests/trace.js 3 lol` e `godot --headless --path godot --script tests/trace.gd -- 3 lol` devem imprimir o mesmo texto.
- Visual/fumaça: `xvfb-run -a godot --path godot --rendering-driver opengl3 --script tests/shots.gd` (PNGs em /tmp/shots) e `tests/soak.gd` (6 anos, 8 jogos).

## O que ainda não foi portado da versão web
Fotos de jogadores (a versão web também usa só iniciais enquanto `fotos/` estiver vazia). Hall → Lendas e a aba Mundo já estão portados.

## Android
O preset "Android" já está em `export_presets.cfg`. No editor: Editor → Gerenciar modelos de exportação (instalar), configurar o Android SDK e o JDK em Configurações do Editor → Exportar → Android, criar um keystore de debug, depois Projeto → Exportar → Android → Exportar projeto (.apk) e instalar no celular.

## Novidades só do Godot
Diretoria (objetivos anuais e confiança), aba Finanças, bônus por título e rescisão de patrocínio, comissão técnica, vestiário (conversas e eventos), olheiros e propostas de compra. Tudo isso está em `core/p8.part` e `ui/u7.part` e não existe na versão web. Os testes de paridade com o JS (`tests/trace.gd`) ligam `dir_off` para desativar essas regras e continuarem idênticos.
