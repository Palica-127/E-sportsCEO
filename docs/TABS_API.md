# API de abas (plugins por jogo)

Cada jogo pode ganhar sub-abas ao lado da aba padrão (a lista de compras). A aba padrão se chama **Time** no eSports e **Comprar** nos outros jogos (`GAMES.<jogo>.tabs[0]` define id, rótulo e ícone dela). As abas extras são **plugins**: um arquivo `js/tabs/<jogo>-<id>.js` que chama `Engine.registerTab(...)`. Este documento é a especificação completa; a aba `js/tabs/esp-mercado.js` e a aba `js/tabs/esp-liga.js` são exemplos de produção, e `tests/example-tab.js` é o exemplo mínimo testado (`node tests/tabs_api.js`).

Versão da API: `Engine.version === 1`.

## 1. Como adicionar uma aba

1. Crie `js/tabs/<jogo>-<id>.js` (`<jogo>` é `lan`, `civ` ou `esp`).
2. Inclua o `<script>` no `index.html`, **depois de `js/engine.js`**, no bloco comentado `ABAS (plugins)`. A ordem dos scripts é a ordem dos chips.
3. Não toque em `engine.js`, `style.css` global nem em `GAMES.<jogo>`. O CSS da aba deve usar um prefixo próprio (ex.: `.cofre-...`) e pode ficar no `style.css` ao final, em um bloco comentado com o nome da aba. Dados de balanceamento da aba ficam em `GAMES.<jogo>` no arquivo `js/games/<jogo>.js` só quando outras abas/simulações precisarem deles; caso contrário, fique dentro do arquivo da aba.

O motor só inicia no `DOMContentLoaded`, então todas as abas já estão registradas quando o jogo abre. Os chips só aparecem quando há 2 ou mais abas abertas (`unlock` verdadeiro).

## 2. Definição da aba

```js
Engine.registerTab('lan', {
  id: 'cofre',                 // obrigatório: [a-z0-9_-]+, único dentro do jogo
  label: 'Cofre', icon: '🐷',  // texto e emoji do chip (alvo >= 44 px já garantido pelo motor)
  ach: [ { id:'cofre1', ic:'🐷', n:'Poupador', d:'Guarde dinheiro no cofre.' } ], // opcional: conquistas manuais
  unlock: function (api) { return api.owned('pc') >= 1; },   // opcional (padrão: sempre aberta)
  mount:  function (root, api) {},   // 1x no início; root = <div class="tabroot"> exclusivo da aba
  load:   function (data, api) {},   // data = o que save() devolveu antes, ou null (jogo novo / zerado / sem save)
  save:   function (api) { return {}; },  // objeto JSON puro (< 300 KB); undefined = não salvar
  update: function (dt, api) {},     // a cada tick (~100 ms), de TODAS as abas abertas, visíveis ou não
  render: function (api) {},         // só com a aba visível; ~3x/s e após api.invalidate()
  show:   function (api) {},         // opcional: quando o jogador abre a aba
  onPrestige: function (api) {},     // opcional: depois do prestígio do jogo
  hud:    function (api) { return {stage, next, p} | undefined; }, // opcional: sobrescreve o placar
  tier:   function (api) { return 0..N-1 | undefined; },            // opcional: sobrescreve o estágio
  scene:  function (x, api) {}       // opcional: acrescenta campos em x (6º argumento da cena)
});
```

Todas as funções são opcionais exceto `id`. **Erros dentro das funções da aba são capturados**: o motor registra `console.error('aba <jogo>:<id>:<função>', e)` uma vez por função e segue jogando (a aba defeituosa só deixa de funcionar).

### Ciclo de vida

- **Início do app**: para cada aba, na ordem do registro: `mount(root, api)` e depois `load(save.g[jogo].tabs[id] || null, api)`.
- **A cada tick** (`~100 ms`, com a página visível): `update(dt, api)` (só se `unlock` for verdadeiro). `dt` em segundos (máx. 5). Tempo fora do app **não** gera `update`; só o ganho offline de moeda é creditado pelo motor (50%, até 4 h).
- **Render**: o motor chama `render(api)` da aba **visível** a cada 0,3 s e quando alguém chama `api.invalidate()`. Faça só atualizações com diff (veja `api.ui` e `api.list`); nunca reescreva `innerHTML` por tick.
- **Save**: o motor chama `save(api)` de cada aba antes de gravar (a cada 5 s, ao esconder a página, ao exportar). Guardado em `g.<jogo>.tabs[id]`.
- **Importar save / Desfazer / Zerar este jogo**: o motor chama `load(...)` de novo (com `null` ao zerar). Seu `load` deve **recriar todo o estado derivado** (multiplicadores, extras, `api.shared`) a partir de `data`.
- **Prestígio**: o motor zera itens e **limpa `api.mult` e `api.setExtra`** do jogo. Se a aba tiver `onPrestige(api)`, ela é chamada para você decidir o que mantém; senão o motor chama `load(save(), api)` (mantém seu estado e reaplica o derivado). `g.sh` (api.shared) **não** é limpo.

## 3. `api` (por jogo; mesma instância para todas as abas do jogo)

Leitura/identidade: `api.key` (`'lan'|'civ'|'esp'`), `api.cur` (símbolo da moeda), `api.G` (`GAMES[key]`, somente leitura), `api.fmt(n)` e `api.fmtT(seg)` (formatação em pt-BR), `api.now()` (segundos de jogo desde que a página abriu), `api.rm()` (movimento reduzido ligado?), `api.isCurrent()` (este jogo é o da tela?), `api.isVisible(tabId)` (a aba está na tela?), `api.stars()` (nível de prestígio), `api.runs()` (nº de prestígios).

Moeda:
- `api.money()` saldo atual. `api.life()` renda total acumulada.
- `api.canAfford(v)`; `api.spend(v)` gasta (devolve `false` se faltar; não mexe no total ganho).
- `api.earn(v, count)` ganha moeda. Por padrão conta como renda total (afeta o prestígio). Use `api.earn(v, false)` para **reembolsos** (não conta).
- `api.ps()` produção por segundo **com** bônus temporários; `api.psBase()` sem eles.
- `api.previewPs({extra:{itemId:+n}, mult:{id:f}, owned:{itemId:+n}})` produção por segundo hipotética (sem alterar nada). `extra` soma unidades efetivas ao item, `mult` define/substitui multiplicadores permanentes, `owned` soma níveis/unidades compradas.

Itens do jogo: `api.owned(itemId)`, `api.maxOf(itemId)`, `api.setOwned(itemId, n)` (perigoso: ignora custo; use para manter coerência, como "reais permanecem no prestígio").

Multiplicadores:
- `api.mult(id, f)` permanente (f > 0). `f === 1` remove. Vale como fator **global** na produção, é **salvo pelo motor** (`g.mu`) e limpo no prestígio. `api.getMult(id)`.
- `api.temp(id, f, seg)` temporário com duração (não salvo; some ao recarregar). Mesmo `id` substitui.
- `api.setExtra(owner, itemId, n)` soma `n` unidades efetivas a um item de unidade (`t:'u'`) como se o jogador tivesse `n` a mais (multiplicadores do item valem). Não salvo; recalcule em `load`/mudanças.
- Convenção dos ids: `<aba>:<nome>`.

Estado compartilhado e persistência:
- `api.shared` é um objeto JSON **persistente do jogo**, visível a todas as abas (`g.sh`). Use para informação que outra aba precisa ler. Cada aba escreve só nas próprias chaves, prefixadas por ela. Chaves em uso no eSports: `region` (`BR|NA|EU|KR|CN|AP`), `division` (`'T2'|'T1'`), `intl` (0/1, já disputou torneio internacional), `avg5`, `subS`, `nReal`, `imports` (do Mercado, usadas pela Liga).
- O estado privado da aba vai no retorno de `save()`.
- `api.save()` força gravar agora (use após ações do jogador, como contratar).

Estágio: `api.stage()` devolve `{tier, tierName, region, division, intl}` (`region`/`division` vêm de `api.shared`; `tier` é o índice em `GAMES[jogo].tiers`).

Feedback: `api.toast(msg, {action, fn, ms})`, `api.banner(texto)` (faixa "Nova fase" na cena), `api.sfx('tap'|'buy'|'no'|'up'|'ach')`, `api.buzz(ms|[...])`.

Conquistas: declare em `ach: [{id, ic, n, d}]` no registro (id único no jogo) e conceda com `api.unlock(id)` (devolve `true` só na primeira vez, mostra o toast). `api.isUnlocked(id)`.

UI: `api.invalidate()` pede render logo. `api.openDialog(dialogEl)` / `api.closeDialog(dialogEl)` abrem/fecham `<dialog>` (com fallback).

Helpers de DOM (todos com diff, só tocam o DOM quando o valor muda): `api.ui.text(node, str)`, `api.ui.attr(node, nome, valor)`, `api.ui.bar(node, 0..1)` (usa `transform:scaleX`), `api.ui.hide(node, bool)`, `api.ui.data(node, chave, valor)`.

Lista com diff:

```js
var list = api.list(hostEl, {
  key:    function (item) { return item.id; },        // chave estável
  create: function (item, i) { var li = document.createElement('li'); return { el: li, update: function (item, i) { api.ui.text(li, item.nome); } }; }
});
list.set(arrayDeItens);   // cria só o que falta, reaproveita nós, reordena, remove o que sumiu
list.clear(); list.size;
```
`hostEl` deve ser exclusivo da lista (sem outros filhos). Para listas grandes, passe só a fatia visível (paginação/"carregar mais").

## 4. Hooks de jogo (opcionais, a primeira aba que devolver valor vence)

- `hud(api) -> {stage, next, p}`: `stage` é o texto da esquerda do placar, `next` o da direita, `p` a barra (0..1). Mantenha curto: `stage` até ~22 caracteres e `next` até ~24 em 360 px de largura.
- `tier(api) -> inteiro`: estágio da carreira (usado no banner "Nova fase", nas estatísticas e em `x.tier` da cena).
- `scene(x, api)`: acrescente campos a `x`, o 6º argumento de `SCENES.<jogo>.draw(ctx,W,H,o,t,x)`. O objeto é reaproveitado entre quadros: **sempre sobrescreva** seus campos (os campos `roster`, `division`, `region`, `champ` são zerados antes). Não aloque objetos novos a cada quadro (cache).

## 5. Layout e estilo

- A raiz da aba (`root`) ocupa o painel inteiro e rola sozinha (`overflow-y:auto`); a página nunca rola (100dvh). Com uma aba extra aberta, a cena encolhe (92 px) e o botão de clique grande some; ao voltar para a aba padrão tudo volta.
- Alvos de toque >= 44 px; contraste AA; respeite `prefers-reduced-motion` (`api.rm()` para JS).
- Classes utilitárias já existentes: `.chip` (botão em pílula; `aria-pressed="true"` marca selecionado), `.btn`, `.btn.pri`, `.btn.danger`, `.stat`, e as variáveis CSS `--c`/`--c-tx`/`--on-c`/`--s1..s3`/`--line`/`--tx..tx3`/`--ok`/`--warn`/`--bad` (a cor do jogo atual já vem em `--c`).

## 6. Save

O motor grava em `localStorage['miniidle-v2']`. Campos novos (todos opcionais: saves antigos abrem com `{}`):

- `st.tab[jogo]`: id da sub-aba aberta.
- `g[jogo].tabs[id]`: retorno de `save()` da aba.
- `g[jogo].sh`: `api.shared`.
- `g[jogo].mu`: multiplicadores permanentes.

Para versionar o estado da aba, inclua `v` no objeto salvo e migre em `load` (trate `data` ausente/incompleto: ele pode vir de versões antigas ou de um save adulterado; valide tipos e limites).

## 7. Exemplo mínimo completo

Cofre para a Lan House (arquivo `tests/example-tab.js`; a Lan não ganha essa aba no jogo):

```js
(function () {
  var box = 0, el = {}, items = [];
  Engine.registerTab('lan', {
    id: 'cofre', label: 'Cofre', icon: '🐷',
    ach: [{ id: 'cofre1', ic: '🐷', n: 'Poupador', d: 'Guarde dinheiro no cofre.' }],
    unlock: function (api) { return api.owned('pc') >= 1; },
    mount: function (root, api) {
      root.innerHTML = '<p id="cf-v"></p><button id="cf-b" class="btn pri" type="button">Guardar</button><ul id="cf-l"></ul>';
      el.v = root.querySelector('#cf-v');
      el.list = api.list(root.querySelector('#cf-l'), {
        key: function (it) { return it.id; },
        create: function (it) { var li = document.createElement('li'); return { el: li, update: function (d) { api.ui.text(li, d.label); } }; }
      });
      root.querySelector('#cf-b').addEventListener('click', function () {
        if (!api.spend(10)) { api.toast('Sem dinheiro'); return; }
        box += 10; items.push({ id: 'i' + items.length, label: 'Depósito ' + items.length });
        apply(api); api.unlock('cofre1'); api.save(); api.invalidate();
      });
    },
    load: function (d, api) { box = d && d.box || 0; items = d && d.items || []; apply(api); },
    save: function () { return { box: box, items: items }; },
    render: function (api) { api.ui.text(el.v, 'No cofre: ' + api.fmt(box)); el.list.set(items); }
  });
  function apply(api) { api.mult('cofre:bonus', 1 + box / 1000); }   // +0,1% de produção por 1 guardado
})();
```

## 8. Testes

`tests/boot.js` sobe o jogo no jsdom (`boot({extra:[arquivos de abas extras], save: jsonDoSave})`); `tests/tabs_api.js` cobre cada método da API com a aba de exemplo e uma aba defeituosa. Rode `node tests/tabs_api.js` depois de mudar `engine.js`. As abas novas devem trazer um teste parecido (registrar, abrir, agir, `save()`, recarregar, conferir `load`).
