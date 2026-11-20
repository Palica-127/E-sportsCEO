# UI_SPEC — Mini Idle 3 em 1 (celular em retrato, uma mão)

Arquivo analisado: `/home/claude/idle3/index.html` (1117 linhas). As cenas (`SCENES.lan/civ/esp`, linhas 103-1029) **não precisam ser editadas**: o contrato `draw(ctx,W,H,o,t)` / `burst(ctx,W,H,t)` continua igual.
Tudo abaixo é CSS/JS puro, sem libs e sem imagens externas. Referência de tela: **360x560 CSS px úteis** (pior caso: Android com barra do navegador) e 390x844 (caso confortável).

Sumário: (A) problemas priorizados · (B) especificação visual (wireframes, tokens, CSS) · (C) microinterações e JS · (D) estrutura HTML · (E) ordem de implementação e checklist.

---

## (A) Problemas encontrados, do maior para o menor impacto

| # | Impacto | Problema | Onde (linha / trecho) | Correção (seção) |
|---|---------|----------|------------------------|------------------|
| 1 | Crítico | **Clicar e comprar não cabem na mesma tela.** Aba(38) + hero(~100) + canvas 230 + msg(34+16) + botão(~64+20) + modos(~44) = ~550px antes do primeiro upgrade. Em 360x560 a lista nem aparece; ao rolar para comprar o botão de clique some. | CSS 15-22; HTML 44-57; `SCENES.*.h=230` | B.1 (casca em grid 100dvh: HUD + cena + dock fixos, só a lista rola), B.2 (cena compacta ao rolar) |
| 2 | Crítico | **Progresso offline perdido ao voltar ao app sem recarregar.** `visibilitychange` só faz `prev=Date.now()` ao voltar, descartando o tempo fora; o `away` só é calculado no carregamento. Além disso o `setInterval` continua (estrangulado) em segundo plano e soma parcialmente, o que depois duplicaria se o `away` fosse somado. O aviso offline só mostra o jogo atual e some em 3,5 s. | JS 1106-1107, 1111, 1114 | C.9 |
| 3 | Alto | **Compra sem nenhum feedback.** O botão é `disabled` (não recebe foco, não explica por quê, tocar não faz nada) e, ao comprar, só o texto troca no próximo tick. Sem som, vibração, flash, animação de contador, nem resposta da cena. | CSS 34-35; JS 1097-1099 | C.2, C.3 |
| 4 | Alto | **Botão "morto" não informa nada.** Quando não dá para comprar, o jogador não vê quanto falta nem em quanto tempo. Não há destaque do item mais barato disponível. | JS 1083 (`b.disabled=s.m<c`) | B.5 (barra de preenchimento + "faltam 12 s"), C.3 (best) |
| 5 | Alto | **Todos os itens aparecem desde o segundo zero.** Lista de 8-9 cards iguais; nenhum senso de descoberta, e o jogador novo vê "Foguete R$ 5,1 bi". | JS 1070 | B.6 (item misterioso + "+N por descobrir") |
| 6 | Alto | **Navegação entre jogos ruim:** (a) 3 colunas de ~108px com "🚀 Caverna ao Espaço" quebram em 2 linhas e a barra muda de altura; (b) fica no topo, fora da zona do polegar; (c) alvo ~37px; (d) não mostra a renda nem avisa que algo pode ser comprado nos outros jogos (que continuam rendendo, linha 1048). | CSS 12-14; JS 1068 | B.1/B.4 (nav inferior com renda/s + ponto de aviso) |
| 7 | Alto | **Sem barra de progresso para a próxima fase** (só texto da fase atual) e o bônus "x2 a cada 25" (`mult`, linha 1038) é invisível: o jogador não sabe que existe nem quanto falta. | JS 1038, 1077-1079 | B.3 (barra no HUD), B.5 (mini barra de marco por item), C.4 (banner de nova fase) |
| 8 | Alto | **Performance.** (a) `update()` roda a cada 250 ms **e a cada clique** e reescreve `innerHTML` de todos os botões de compra + ~20 `textContent`, mesmo sem mudança (reflow/paint contínuo; também pode "comer" um toque se o nó é trocado entre down e up); (b) `requestAnimationFrame` a 60 fps com `devicePixelRatio` ilimitado (canvas de até 3x) e `try{}catch(e){}` vazio engole erros; (c) `resize` refaz o canvas (limpa o desenho) a cada mudança da barra do navegador; (d) cada clique cria um `div` + `setTimeout` sem limite; (e) `ps()` recalculado várias vezes por tick; (f) sem pausa quando uma sobreposição cobre a cena. | JS 1048, 1061-1063, 1074-1085, 1088-1096, 1111 | C.5 (render com diff, cache de renda, loop 30 fps, pool de popups, ResizeObserver) |
| 9 | Alto | **Zerar é arriscado e não há backup.** O botão "Zerar este jogo" fica colado no fim da lista, a confirmação é um segundo toque no mesmo lugar (3 s). Não existe exportar/importar save (perder o localStorage = perder tudo). | CSS 36; JS 1100-1103 | C.8 (diálogo, desfazer 10 s, exportar/importar com checksum) |
| 10 | Médio-alto | **Acessibilidade.** Contraste: `.buy:disabled` #6b7488 sobre #2a2f3a = **2,86:1** (falha); texto roxo `#a855f7` sobre cartão #171a21 = **4,4:1** (falha AA) em `.own`, `.mode.on`, `.stage` e `.tab` do jogo roxo. Alvos: `.mode` ~31px, `.tab` ~37px, `.reset` ~31px (< 44px). Canvas sem `role`/`aria-label` (linha 49). Toast sem `aria-live` (37, 62). Nenhum `:focus-visible`. **Nenhum `prefers-reduced-motion`**. `.pop` usa `e.clientX/Y` (0,0 quando o clique vem do teclado, linha 1095). `.msg` itálica 13px com `min-height` muda de altura e empurra a lista (20, 1086). | CSS 13, 20, 28, 33-37; HTML 49-50, 60 | B.2 tokens, B.7, C.6 |
| 11 | Médio | **Sem conquistas, estatísticas, som, vibração ou tela de ajustes.** | (ausente) | B.8, C.7, C.8 |
| 12 | Médio | **Entrada de toque.** Usa `click` (latência e sem multitoque), sem `touch-action:manipulation` (risco de zoom por toque duplo ao martelar), sem `user-select:none` (seleciona texto ao martelar). Só o botão grande clica; a cena (a coisa mais bonita) não responde ao toque. | CSS 22-23; JS 1088, 1092 | C.1 |
| 13 | Médio | **Hierarquia do HUD fraca:** saldo 40px fixo sem `tabular-nums` (dígitos "tremem"), pode estourar em "R$ 999,99 qui" (13 caracteres a 40px em 336px); a renda/s é cinza 13px, longe do saldo; fase em 12px caixa-alta sem relação com a barra. | CSS 15-18 | B.3 |
| 14 | Baixo | **Casca da página:** `viewport` sem `viewport-fit=cover`, sem `theme-color`; `body{padding-bottom:40px}` e `.toast{bottom:20px}` ignoram safe-area; página inteira rola (barra do navegador sobe e desce → resize → canvas é recriado). | HTML 5; CSS 10, 37 | B.1, D |

---

## (B) Especificação visual

### B.1 Tela principal (casca em grid, nada rola exceto a lista)

Altura total = `100dvh`. Linhas do grid (4 filhos de `.app`): `HUD(84) · CENA+DOCK(--stage-h + 56) · PAINEL(1fr, rola) · NAV(56 + safe-area)`.

```
 360 px
+----------------------------------------------+ 
| LAN LOTADA              Próx.: Referência... |  HUD 84px (fundo --s1)
| R$ 12,34 mil                  R$ 1,2 mil /s  |  saldo 28-38px / renda 13px bold
|##########-----------------------------------|  barra de fase 6px (sangra nas bordas)
+----------------------------------------------+
|  (  O ping está em 12ms, é festa!  )         |  ticker (pílula, fade) - aria-hidden
|                                              |
|        CENA ANIMADA (canvas, 30 fps)         |  --stage-h = clamp(176px, 30dvh, 230px)
|        toque em QUALQUER ponto = clique      |  (zoom-out via largura lógica, ver C.5)
|                          +1,2                |  popups (pool de 8)
+----------------------------------------------+
| [PC]  Atender cliente              +1,2 /toque|  DOCK 56px: botão de clique grudado
+----------------------------------------------+     na cena (sem espaço morto)
| Comprar  [ x1 ] [ x10 ] [ Máx ]         [ ^ ]|  PHEAD 52px (modos 44px + botão recolher)
+----------------------------------------------+
| [ic] PC Pentium  x12              [ Comprar ]|  LISTA (única parte que rola)
|      Roda CS 1.6 a 30 fps         [   x10   ]|  row min 76px
|      +1/s  [##---]  dobra em 13   [R$ 1,1 mil]|
| [ic] Ar-condicionado  x3          [ faltam  ]|
|      Cliente fica mais tempo      [  12 s   ]|
|      +1/s  [#----]  dobra em 22   [R$ 130    ]|
| [??] ???                                     |  item misterioso (tracejado)
|      Junte R$ 600 no total para descobrir    |
|      + 5 melhorias por descobrir             |
+----------------------------------------------+
|  LAN      |  CAVERNA   |  ESPORTS   |  MENU  |  NAV 56px (zona do polegar)
|  R$ 12/s  |  🔬 3/s  * |  ⭐ 0/s     |   (1)  |  * ponto = dá para comprar lá
+----------------------------------------------+
```

Orçamento vertical (px):

| Bloco | 360x560 | 390x844 |
|---|---|---|
| HUD | 84 | 84 |
| Cena (`clamp(176, 30dvh, 230)`) | 176 | 230 |
| Dock | 56 | 56 |
| Nav (56 + safe-area) | 56 | 56 + 34 |
| **Painel (cabeçalho 52 + lista)** | **188 (≈1,8 item)** | **384 (≈4,4 itens)** |
| Painel com cena compacta (92px) | **272 (≈3,0 itens)** | n/a (já confortável) |

Decisões de layout:
1. **Dock em vez de botão flutuante sobre a cena**: a cena tem coisas importantes em todo o chão (PCs, VIP, balcão até y=230), qualquer sobreposição esconde pedaço do que o jogador comprou. O dock fica colado na base da cena (mesmo "cartão"), 56px, alvo ≥ 44, e **a cena inteira também é alvo de toque** (o dock é só o "rótulo" do gesto). Variante opcional: FAB 72px no canto inferior direito da cena (modo canhoto = esquerdo); só ativar se o dono preferir sobrepor.
2. **Renda/s sobe para a mesma linha do saldo**, à direita. É o segundo número mais importante de um idle.
3. **Navegação embaixo** (zona do polegar), 3 jogos + Menu. Cada jogo mostra a renda/s na própria moeda (`R$ 12/s`, `🔬 3/s`, `⭐ 0/s`) e um ponto com a cor do jogo quando há algo comprável lá.
4. **Nada de `window` rolando**: `body{overflow:hidden}`; só `.list` rola, com `overscroll-behavior:contain` (resolve também o resize por barra de URL).

### B.2 Cena compacta ao rolar a lista (colapso)

```
+----------------------------------------------+
| LAN LOTADA              Próx.: Referência... |  HUD 84
| R$ 12,34 mil                  R$ 1,2 mil /s  |
|##########-----------------------------------|
+----------------------------------------------+
|  CENA recortada (92px, ancorada embaixo)     |  só o "chão" fica visível; canvas NÃO muda
+----------------------------------------------+     de tamanho (zero redesenho de buffer)
| [PC]  Atender cliente              +1,2 /toque|  DOCK 56
+----------------------------------------------+
| Comprar  [ x1 ] [ x10 ] [ Máx ]         [ v ]|
| ...lista com +84px de altura...              |
```
- Gatilho: `.list.scrollTop > 40` (volta quando `< 4`, histerese) **e** só se ainda sobrar rolagem depois de encolher (evita laço liga/desliga) **ou** toque no botão `[ ^ / v ]` do cabeçalho.
- Transição de `height` 220 ms, uma única propriedade (sem animação em reduced-motion).

### B.3 HUD (hierarquia: saldo > renda > fase > progresso)

```
+----------------------------------------------+
| FASE ATUAL (12px caps, cor do jogo)    Próx.: <nome> · <total>/<meta>  (12px cinza)
| SALDO (clamp 28-38px, 800, tabular)               RENDA/s (13px, 700, tx2)
| [=============barra 6px, cor do jogo=======----]  progresso da fase (total ganho no jogo)
+----------------------------------------------+
```
- Barra = `(s.t - stage[i].min) / (stage[i+1].min - stage[i].min)`. Na última fase: barra cheia e texto "Fase final".
- Usar `transform:scaleX()`, nunca `width` (sem layout).
- Ao cruzar a fase: banner na cena + som + confete (C.4).

### B.4 Navegação inferior

```
+------------+------------+------------+--------+
|    [ic]    |    [ic]    |    [ic]    |  [⚙]   |
|    Lan     |  Caverna   |  eSports   |  Menu  |
| R$ 12,3/s  |  🔬 3/s *  |  ⭐ 0/s    |   (1)  |   (1) = conquistas novas
+------------+------------+------------+--------+
 aba ativa: barra de 3px no topo na cor do jogo + texto --tx
```
- 4 colunas: `repeat(3,1fr) 64px`; cada alvo ≥ 64x56.
- Nomes curtos (`GAMES[k].short`) para nunca quebrar linha.

### B.5 Card de upgrade e seus estados

```
afford (pode comprar)                  poor (não pode)                     best (mais barato disponível)
+--------------------------------+     +--------------------------------+   +================================+
|[ic] PC Pentium  x12  +---------+|     |[ic] Ar-cond.  x3  +---------+  |   |[ic] PC Pentium  x12 +--------+ |
|     Roda CS 1.6...   |Comprar  ||     |     Cliente...    |#####----|  |   |    Roda CS...       |Comprar | |
|     +1/s [##-] x2:13 | x10     ||     |     +1/s [#--] 22 |faltam   |  |   |    +1/s [##-] x2:13 | x10    | |
|                      |R$ 1,1mil||     |                   | 12 s    |  |   |                     |R$ 1,1mi| |
+--------------------------------+     |                   |R$ 130   |  |   +================================+
 botão cor do jogo, texto escuro        +--------------------------------+    borda cor do jogo + anel pulsando
                                        botão escuro com preenchimento         no botão (a cada 1,6 s)
                                        proporcional ao saldo/custo
mystery (próximo bloqueado)            locked-more (restante)
+- - - - - - - - - - - - - - - - + +
|[?] ? ? ?                        |   + 5 melhorias por descobrir  (texto 12px, centralizado)
|    Junte R$ 600 no total...      |
|    [##-------]                   |  barra = total ganho / (custo*0,5)
+- - - - - - - - - - - - - - - - + +
```
Regras de revelação (por jogo, guardado em `st.g[k].rv` e nunca regride):
- Revelado: `owned>0` **ou** `t >= custo*0,5`.
- Misterioso: exatamente **um** item além do último revelado (`i === rv+1`).
- Oculto: o resto (`i > rv+1`), contado em "+N melhorias por descobrir".
- Em jogo novo (t=0) só aparecem PC Pentium (revelado: custo 15, t>=7,5 com cliques) e o misterioso. Antes de t=7,5 o primeiro item já é o "misterioso" (fica mais interessante; a regra `i===rv+1` com `rv=0` inicial mostra o item 0 como revelado e o 1 como misterioso, ajustar `rv` inicial para -1 se quiser o 0 também misterioso).

Destaque "melhor compra": entre os itens **comprováveis agora**, o de **menor custo unitário** (`c0`) recebe `data-best="1"` (borda na cor do jogo + anel pulsando no botão). Opcional (não implementado no JS abaixo): estrela "melhor retorno" no item com menor `custo/ganho` entre os visíveis.

### B.6 Tokens

**Cor (superfícies e texto)** — todos os pares abaixo foram medidos:

| Token | Valor | Uso | Contraste |
|---|---|---|---|
| `--bg` | `#0e1014` | fundo da página | — |
| `--s1` | `#12151b` | HUD, nav, sheet | — |
| `--s2` | `#171a21` | cartões | — |
| `--s3` | `#1f2430` | superfícies elevadas, trilhos de barra | — |
| `--line` | `#2a2f3a` | divisórias (decorativas) | 1,4:1 (só decoração) |
| `--line-strong` | `#667089` | borda de controles interativos | 3,5:1 em `--s2`, 3,85:1 em `--bg` (≥ 3:1) |
| `--tx` | `#e8eaf0` | texto principal | 14,5:1 em `--s2` |
| `--tx2` | `#aab3c7` | texto secundário | 8,3:1 em `--s2`; 7,4:1 em `--s3` |
| `--tx3` | `#8a93a8` | descrições, dicas | 5,65:1 em `--s2`; 5,0:1 em `--s3` |
| `--ok / --warn / --bad` | `#4ade80 / #fbbf24 / #f87171` | sucesso/aviso/perigo | 10,0 / 10,4 / 6,3 em `--s2` |
| `--on-c` | `#06090d` | texto sobre cor do jogo | 11,0 (ciano), 9,3 (âmbar), 5,0 (roxo) |

**Cor por jogo** (acrescentar em `GAMES`): `color` (preenchimento) e `tx` (texto sobre fundo escuro):

| Jogo | `color` (fundo de botão) | `tx` (texto/ícone sobre escuro) | `tx` em `--s2` |
|---|---|---|---|
| lan | `#22d3ee` | `#22d3ee` | 9,6:1 |
| civ | `#f59e0b` | `#f59e0b` | 8,1:1 |
| esp | `#a855f7` | **`#c084fc`** (o roxo atual falha: 4,4:1) | 6,6:1 |

**Tipografia:** `--fs-xs 12px` (mínimo absoluto) · `--fs-sm 13px` · `--fs-md 15px` · `--fs-lg 18px` · `--fs-xl clamp(28px, 8.5vw, 38px)`. Números sempre `font-variant-numeric:tabular-nums`. Sem itálico em texto de leitura.

**Espaçamento:** 4 / 8 / 12 / 16 / 24. **Raios:** 10 (botão) / 14 (cartão) / 18 / pílula 999. **Alvo de toque:** 44px (`--tap`), mínimo 8px entre alvos.

**Movimento:** curva `--ease: cubic-bezier(.2,.8,.2,1)`; microinterações 120-260 ms; banner 2,6 s; nada anima `width/height/top/left` exceto o colapso da cena (único, sob demanda).

### B.7 CSS pronto para colar (substitui o `<style>` inteiro das linhas 8-38)

```css
/* ===== TOKENS ===== */
:root{
  --bg:#0e1014; --s1:#12151b; --s2:#171a21; --s3:#1f2430;
  --line:#2a2f3a; --line-strong:#667089;
  --tx:#e8eaf0; --tx2:#aab3c7; --tx3:#8a93a8;
  --ok:#4ade80; --warn:#fbbf24; --bad:#f87171;
  /* por jogo: setados via JS em build() */
  --c:#22d3ee; --c-tx:#22d3ee; --on-c:#06090d; --c-soft:#22d3ee29; --c-glow:#22d3ee66;
  --r-sm:10px; --r-md:14px; --r-lg:18px; --r-pill:999px;
  --tap:44px; --hud-h:84px; --dock-h:56px; --nav-h:56px; --stage-h:176px;
  --safe-b:env(safe-area-inset-bottom,0px);
  --ease:cubic-bezier(.2,.8,.2,1);
  --fs-xs:12px; --fs-sm:13px; --fs-md:15px; --fs-lg:18px; --fs-xl:clamp(28px,8.5vw,38px);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
[hidden]{display:none!important}
html,body{height:100%}
body{margin:0;background:var(--bg);color:var(--tx);overflow:hidden;overscroll-behavior:none;
  font:15px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-text-size-adjust:100%}
button{font:inherit;color:inherit;cursor:pointer;touch-action:manipulation;
  -webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
:focus-visible{outline:3px solid #fff;outline-offset:2px}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}

/* ===== CASCA ===== */
.app{height:100vh;height:100dvh;max-width:520px;margin:0 auto;display:grid;
  grid-template-rows:auto auto minmax(0,1fr) auto;background:var(--bg)}

/* ===== HUD ===== */
.hud{height:var(--hud-h);padding:10px 14px 0;display:grid;grid-template-rows:18px 40px 6px;row-gap:4px;
  background:var(--s1);contain:layout paint}
.hud-top{display:flex;justify-content:space-between;gap:8px;font-size:var(--fs-xs);line-height:18px;white-space:nowrap}
.hud-stage{color:var(--c-tx);font-weight:800;letter-spacing:.06em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis}
.hud-next{color:var(--tx3);overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.hud-main{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.bal{font-size:var(--fs-xl);font-weight:800;line-height:40px;white-space:nowrap;overflow:hidden;
  text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.ps{flex:none;font-size:var(--fs-sm);font-weight:700;color:var(--tx2);font-variant-numeric:tabular-nums}
.bar{height:6px;margin:0 -14px;background:var(--s3);overflow:hidden}
.bar>i{display:block;height:100%;background:var(--c);transform-origin:0 50%;transform:scaleX(0);
  transition:transform .25s linear;will-change:transform}

/* ===== CENA + DOCK ===== */
.scene{position:relative;height:var(--stage-h);overflow:hidden;background:#000;transition:height .22s var(--ease)}
.app.compact .scene{height:92px}
.app.compact .ticker{display:none}
#sc{position:absolute;left:0;bottom:0;display:block;touch-action:manipulation}
.fx{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.pop{position:absolute;font-size:18px;font-weight:800;color:#fff;white-space:nowrap;will-change:transform,opacity;
  text-shadow:0 1px 3px #000,0 0 8px var(--c-glow)}
.ticker{position:absolute;left:8px;right:8px;top:8px;margin:0;padding:4px 12px;border-radius:var(--r-pill);
  background:rgba(8,10,14,.74);color:#dfe4f0;font-size:var(--fs-xs);line-height:1.3;text-align:center;
  max-height:2.7em;overflow:hidden;opacity:0;transition:opacity .4s;pointer-events:none}
.ticker.on{opacity:1}
.banner{position:absolute;left:0;right:0;top:30%;text-align:center;pointer-events:none;opacity:0}
.banner small{display:block;margin-bottom:4px;color:var(--c-tx);font-size:var(--fs-xs);font-weight:800;
  letter-spacing:.14em;text-transform:uppercase;text-shadow:0 1px 3px #000}
.banner b{display:inline-block;max-width:92%;padding:8px 18px;border-radius:var(--r-pill);font-size:var(--fs-lg);
  background:rgba(8,10,14,.84);border:2px solid var(--c);color:#fff}
.banner.go{animation:bn 2.6s var(--ease) both}
@keyframes bn{0%{opacity:0;transform:scale(.7)}12%{opacity:1;transform:scale(1.06)}18%{transform:scale(1)}
  85%{opacity:1}100%{opacity:0;transform:translateY(-8px)}}
.dock{display:flex;align-items:center;gap:12px;width:100%;height:var(--dock-h);padding:0 16px;border:0;
  background:var(--c);color:var(--on-c);text-align:left;box-shadow:inset 0 -4px 0 rgba(0,0,0,.28)}
.dock:active{transform:translateY(2px);box-shadow:inset 0 -2px 0 rgba(0,0,0,.28)}
.dock-ic{font-size:26px;line-height:1}
.dock-tx{display:flex;flex-direction:column;flex:1;min-width:0}
.dock-tx b{font-size:var(--fs-lg);font-weight:800;line-height:1.1}
.dock-tx small{font-size:var(--fs-xs);font-weight:700}

/* ===== PAINEL / LISTA ===== */
.panel{display:flex;flex-direction:column;min-height:0}
.phead{flex:none;display:flex;align-items:center;gap:8px;min-height:52px;padding:4px 12px;
  border-bottom:1px solid var(--line);background:var(--bg)}
.phead-lb{font-size:var(--fs-xs);color:var(--tx3)}
.modes{display:flex;gap:6px;flex:1}
.mode{min-width:56px;min-height:var(--tap);padding:0 14px;border-radius:var(--r-pill);font-size:var(--fs-sm);
  font-weight:700;background:var(--s2);border:1px solid var(--line-strong);color:var(--tx)}
.mode[aria-checked=true]{background:var(--c);border-color:var(--c);color:var(--on-c)}
.fold{flex:none;width:var(--tap);height:var(--tap);border-radius:var(--r-md);background:var(--s2);
  border:1px solid var(--line-strong);font-size:16px}
.list{list-style:none;margin:0;padding:8px 12px 12px;flex:1;min-height:0;overflow-y:auto;
  overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
.row{position:relative;display:grid;grid-template-columns:40px minmax(0,1fr) 96px;gap:10px;align-items:center;
  min-height:76px;margin-bottom:8px;padding:10px 12px;background:var(--s2);border:1px solid var(--line);
  border-radius:var(--r-md);contain:layout paint}
.ic{width:40px;height:40px;border-radius:12px;background:var(--s3);display:grid;place-items:center;font-size:22px}
.l1{display:flex;align-items:baseline;gap:8px;min-width:0}
.nm{font-size:var(--fs-md);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.own{flex:none;font-size:var(--fs-xs);font-weight:800;color:var(--c-tx);font-variant-numeric:tabular-nums}
.ds{font-size:var(--fs-xs);color:var(--tx3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ms{display:flex;align-items:center;gap:6px;margin-top:5px;font-size:var(--fs-xs);color:var(--tx2);
  white-space:nowrap;overflow:hidden;font-variant-numeric:tabular-nums}
.mbar{flex:none;width:28px;height:4px;border-radius:2px;background:var(--s3);overflow:hidden}
.mbar>b{display:block;height:100%;background:var(--c);transform-origin:0 50%;transform:scaleX(0)}
.mt{overflow:hidden;text-overflow:ellipsis;color:var(--tx3)}

.bw{position:relative}
.buy{position:relative;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;
  width:96px;min-height:52px;padding:6px 6px;border:0;border-radius:var(--r-sm);background:var(--c);
  color:var(--on-c);line-height:1.15;font-weight:800;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
.buy .b1,.buy .b2{position:relative}
.buy .b1{font-size:var(--fs-xs);font-weight:700}
.buy .b2{font-size:var(--fs-sm);font-variant-numeric:tabular-nums}
.buy .fill{position:absolute;inset:0;background:var(--c);opacity:0;transform-origin:0 50%;transform:scaleX(0)}
.buy[aria-disabled=true]{background:var(--s3);color:var(--tx);box-shadow:inset 0 0 0 1px var(--line-strong)}
.buy[aria-disabled=true] .fill{opacity:.35}      /* pior caso (ciano) texto #e8eaf0 = 6,0:1 */
.buy:not([aria-disabled=true]):active{transform:translateY(2px)}

.row[data-best="1"]{border-color:var(--c);box-shadow:inset 0 0 0 1px var(--c)}
.row[data-best="1"] .bw::after{content:"";position:absolute;inset:0;border-radius:var(--r-sm);
  border:2px solid var(--c);pointer-events:none;animation:ring 1.6s ease-out infinite}
@keyframes ring{from{transform:scale(1);opacity:.9}to{transform:scale(1.2,1.4);opacity:0}}

.row[data-state=mystery]{grid-template-columns:40px minmax(0,1fr);background:transparent;
  border:1px dashed var(--line-strong)}
.row[data-state=mystery] .ic{filter:grayscale(1) brightness(.6)}
.row[data-state=mystery] .nm{letter-spacing:.25em;color:var(--tx2)}
.row[data-state=mystery] .bw{display:none}
.more{padding:6px 0 2px;text-align:center;font-size:var(--fs-xs);color:var(--tx3)}

/* ===== NAV INFERIOR ===== */
.nav{display:grid;grid-template-columns:repeat(3,1fr) 64px;height:calc(var(--nav-h) + var(--safe-b));
  padding-bottom:var(--safe-b);background:var(--s1);border-top:1px solid var(--line)}
.nv{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;
  min-height:var(--nav-h);border:0;background:none;color:var(--tx2);min-width:0}
.nv-ic{font-size:20px;line-height:1}
.nv-nm{font-size:var(--fs-xs);font-weight:800}
.nv-ps{max-width:100%;padding:0 4px;font-size:var(--fs-xs);color:var(--tx3);white-space:nowrap;
  overflow:hidden;text-overflow:ellipsis;font-variant-numeric:tabular-nums}
.nv[aria-current=page]{color:var(--tx)}
.nv[aria-current=page]::before{content:"";position:absolute;top:0;left:18%;right:18%;height:3px;
  border-radius:0 0 3px 3px;background:var(--g)}
.nv .dot{position:absolute;top:7px;left:calc(50% + 14px);width:10px;height:10px;border-radius:50%;
  background:var(--g);box-shadow:0 0 0 2px var(--s1)}
.nv .cnt{position:absolute;top:5px;left:calc(50% + 8px);min-width:18px;height:18px;padding:0 5px;border-radius:9px;
  background:var(--bad);color:var(--on-c);font-size:12px;font-weight:800;line-height:18px;text-align:center}

/* ===== TOAST ===== */
.toast{position:fixed;left:50%;z-index:30;bottom:calc(var(--nav-h) + var(--safe-b) + 12px);
  transform:translate(-50%,8px);max-width:min(92vw,480px);display:flex;align-items:center;gap:12px;
  padding:10px 14px;border-radius:var(--r-md);background:var(--s3);border:1px solid var(--c);
  font-size:var(--fs-sm);opacity:0;pointer-events:none;transition:opacity .25s,transform .25s var(--ease)}
.toast.show{opacity:1;transform:translate(-50%,0)}
.toast.act{pointer-events:auto}
.toast button{min-height:var(--tap);padding:0 12px;border:0;background:none;color:var(--c-tx);font-weight:800}

/* ===== SHEET (Menu: conquistas / estatísticas / ajustes) ===== */
.sheet{width:100%;max-width:520px;height:min(88dvh,720px);margin:auto auto 0;padding:0;border:0;
  border-radius:20px 20px 0 0;background:var(--s1);color:var(--tx);overflow:hidden}
.sheet[open]{display:flex;flex-direction:column;animation:sheetIn .28s var(--ease)}
.sheet::backdrop{background:rgba(0,0,0,.62)}
@keyframes sheetIn{from{transform:translateY(24px);opacity:0}}
.shead{display:flex;align-items:center;border-bottom:1px solid var(--line);padding:0 4px 0 8px}
.stabs{display:flex;flex:1}
.stab{flex:1;min-height:var(--tap);border:0;background:none;color:var(--tx2);font-weight:700;
  font-size:var(--fs-sm);border-bottom:3px solid transparent}
.stab[aria-selected=true]{color:var(--tx);border-bottom-color:var(--c)}
.xbtn{width:var(--tap);height:var(--tap);border:0;background:none;font-size:22px;color:var(--tx2)}
.sbody{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:12px;padding-bottom:calc(12px + var(--safe-b))}
.agrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.ach{padding:10px;border-radius:var(--r-md);background:var(--s2);border:1px solid var(--line)}
.ach[data-on="1"]{border-color:var(--c)}
.ach .ai{font-size:24px;line-height:1}
.ach[data-on="0"] .ai{filter:grayscale(1);opacity:.45}
.ach b{display:block;margin-top:4px;font-size:var(--fs-sm)}
.ach small{display:block;color:var(--tx3);font-size:var(--fs-xs)}
.ach .pb{height:4px;margin-top:6px;border-radius:2px;background:var(--s3);overflow:hidden}
.ach .pb i{display:block;height:100%;background:var(--c)}
.stat{display:flex;justify-content:space-between;gap:12px;min-height:44px;align-items:center;
  border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
.stat span{color:var(--tx2)}
.set{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;min-height:56px;
  padding:6px 0;border:0;border-bottom:1px solid var(--line);background:none;text-align:left}
.set small{display:block;color:var(--tx3);font-size:var(--fs-xs)}
.sw{position:relative;flex:none;width:52px;height:32px;border-radius:16px;background:var(--s3);
  box-shadow:inset 0 0 0 2px var(--line-strong)}
.sw::after{content:"";position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;
  background:var(--tx2);transition:transform .18s var(--ease)}
.set[aria-checked=true] .sw{background:var(--c);box-shadow:none}
.set[aria-checked=true] .sw::after{transform:translateX(20px);background:var(--on-c)}
.btn{min-height:var(--tap);padding:0 16px;border-radius:var(--r-sm);border:1px solid var(--line-strong);
  background:var(--s2);color:var(--tx);font-weight:700}
.btn.pri{background:var(--c);border-color:var(--c);color:var(--on-c)}
.btn.danger{border-color:var(--bad);color:var(--bad)}
textarea.save{width:100%;min-height:96px;margin:8px 0;padding:10px;border-radius:var(--r-sm);
  background:var(--bg);color:var(--tx);border:1px solid var(--line-strong);font:12px/1.3 ui-monospace,monospace}
.dlg{width:min(92vw,420px);padding:20px;border:1px solid var(--line-strong);border-radius:var(--r-lg);
  background:var(--s1);color:var(--tx)}
.dlg::backdrop{background:rgba(0,0,0,.7)}
.dlg h2{margin:0 0 8px;font-size:var(--fs-lg)}
.dlg .acts{display:flex;gap:8px;justify-content:flex-end;margin-top:16px;flex-wrap:wrap}

/* ===== MOVIMENTO REDUZIDO (sistema OU ajuste do jogo) ===== */
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{animation-duration:.01ms!important;animation-iteration-count:1!important;
    transition-duration:.01ms!important;scroll-behavior:auto!important}
  .row[data-best="1"] .bw::after{display:none}
}
.rm *,.rm *::before,.rm *::after{animation-duration:.01ms!important;animation-iteration-count:1!important;
  transition-duration:.01ms!important}
.rm .row[data-best="1"] .bw::after{display:none}
```

### B.8 Menu (sheet) — Conquistas · Estatísticas · Ajustes

Aberto por `[ Menu ]` com `<dialog>.showModal()` (foco preso, Esc fecha, fundo inerte, sem lib). Enquanto aberto o loop da cena pausa.

```
+----------------------------------------------+
| [ Conquistas ] [ Estatísticas ] [ Ajustes ] [x]|  tabs 44px, "x" 44x44
+----------------------------------------------+
| CONQUISTAS                         7 / 14    |
| +-----------------+ +-----------------+      |
| | [ic]            | | [ic] (cinza)    |      |  grid 2 col, card 10px de padding
| | Dedo quente     | | Mil toques      |      |  desbloqueado: borda cor do jogo
| | 100 toques      | | 1.000 toques    |      |  bloqueado: ícone cinza + barra
| |                 | | [#######---] 72%|      |  de progresso cur/max
| +-----------------+ +-----------------+      |
+----------------------------------------------+

ESTATÍSTICAS                                       AJUSTES
+----------------------------------------------+   +----------------------------------------------+
| Toques                              1.234    |   | Som                              [  o--- ]  | 56px, linha inteira
| Compras                               312    |   |   Desligado por padrão                      |  é o alvo (role=switch)
| Tempo jogado                       2 h 14 min|   | Vibração                         [ ---o  ]  |
| Primeira partida                  12/11/2026 |   | Reduzir animações   [Auto|Sim|Não]          |
| ---- por jogo ----                           |   |---------------------------------------------|
| Lan House   total R$ 1,2 mi    fase 3/5     |   | SALVAR                                      |
| Caverna     total 🔬 52 mil     fase 2/5     |   | [ Exportar save ]   [ Importar save ]       |
| eSports     total ⭐ 12         fase 1/5     |   | (textarea com o texto + Copiar / Baixar)    |
+----------------------------------------------+   |---------------------------------------------|
                                                    | ZONA DE PERIGO                              |
                                                    | [ Zerar este jogo ] [ Zerar tudo ] (vermelho)|
                                                    +----------------------------------------------+
```

Diálogo de "Voltou"/offline (substitui o toast de 3,5 s, linha 1107):

```
+---------------------------------+
| Bem-vindo de volta!             |
| Você ficou fora por 7 h 12 min  |
| (limite de ganho offline: 8 h)  |
|                                 |
| Lan House        +R$ 4,2 mil    |
| Caverna ao Esp.  +🔬 310        |
| Time de eSports  +⭐ 1,8 mil    |
|                    [ Continuar ]|
+---------------------------------+
```

Banner de nova fase (sobre a cena, 2,6 s, `aria-hidden`; o aviso falado vai pelo toast `role=status`):

```
   N O V A   F A S E
 ( Referência na cidade )     + confete (burst x3) + som "up"
```

Confirmação de zerar (`<dialog class="dlg">`): título "Zerar Lan House?", texto "Isso apaga saldo e compras deste jogo. Um backup fica disponível por 10 s para desfazer."; botões `[Cancelar]` (autofocus, ação primária) e `[Zerar]` (vermelho, à direita).

---

## (C) Microinterações e JS prontos

Todos os trechos assumem `st`, `GAMES`, `fmt`, `ps`, `mult`, `nFor`, `costOf`, `c0`, `clickVal`, `save`, `$` do código atual. Onde um trecho **substitui** uma função existente isso está dito.

### C.0 Dados e migração do save (acrescentar depois da linha 1036, não muda a chave `idle3-v1`)

```js
GAMES.lan.short="Lan";     GAMES.lan.tx="#22d3ee"; GAMES.lan.icons=["🖥️","❄️","🥟","🏆","🌐","🛋️","🏪","🏟️"];
GAMES.civ.short="Caverna"; GAMES.civ.tx="#f59e0b"; GAMES.civ.icons=["🍎","🔥","🌾","🛞","📜","⛵","🚂","💻","🚀"];
GAMES.esp.short="eSports"; GAMES.esp.tx="#c084fc"; GAMES.esp.icons=["🎮","🧠","🏠","🤝","📺","📣","🏟️","🏆"];

st.set  =Object.assign({sound:false,haptic:true,motion:"auto"},st.set);          // motion: auto|reduce|full
st.stats=Object.assign({clicks:0,buys:0,play:0,since:Date.now(),awayMax:0},st.stats);
st.ach  =st.ach||{};                                                              // id -> timestamp
const mq=matchMedia("(prefers-reduced-motion: reduce)");
const RM=()=>st.set.motion==="reduce"||(st.set.motion==="auto"&&mq.matches);
```

### C.1 Entrada de toque (substitui o ramo `t.id==="big"` das linhas 1092-1096)

`pointerdown` na cena inteira: menor latência, multitoque (cada dedo conta), sem seleção de texto. O dock é filho do mesmo container; o teclado continua funcionando (`click` com `detail===0`).

```js
const stageBox=$("stagebox"), fx=$("fx"), big=$("big");
stageBox.addEventListener("pointerdown",e=>{ if(e.button>0) return; tap(e.clientX,e.clientY); });
big.addEventListener("click",e=>{ if(e.detail===0) tap(); });          // Enter/Espaço
function tap(x,y){
  const k=st.cur,v=clickVal(k),s=st.g[k]; s.m+=v; s.t+=v; st.stats.clicks++;
  const r=fx.getBoundingClientRect();
  const px=x==null?r.width/2:Math.min(Math.max(x-r.left,24),r.width-24);
  const py=y==null?r.height*.6:Math.min(Math.max(y-r.top,28),r.height-8);   // nunca fora da cena
  pop("+"+fmt(v),px,py);
  if(!RM()){ try{SCENES[k].burst&&SCENES[k].burst(cx,cw,ch,performance.now()/1000)}catch(_){} bump(big.firstElementChild); }
  sfx("tap"); buzz(6); scheduleRender();
}
```
Remover do handler global o ramo `t.id==="big"` e o `.pop` antigo (CSS 24-25).

### C.2 Pool de popups e animações curtas (sem criar nós por clique)

```js
const pool=[],NPOP=8; let pi=0;
for(let i=0;i<NPOP;i++){const d=document.createElement("div");d.className="pop";d.hidden=true;fx.appendChild(d);pool.push(d)}
function pop(txt,x,y){
  const d=pool[pi++%NPOP]; d.getAnimations().forEach(a=>a.cancel());
  d.textContent=txt; d.style.left=x+"px"; d.style.top=y+"px"; d.hidden=false;
  const fr=RM()?[{opacity:1,transform:"translate(-50%,-50%)"},{opacity:0,transform:"translate(-50%,-50%)"}]
    :[{opacity:0,transform:"translate(-50%,-50%) scale(.8)"},
      {opacity:1,transform:"translate(-50%,-70%) scale(1.1)",offset:.2},
      {opacity:0,transform:"translate(-50%,-260%) scale(1)"}];
  d.animate(fr,{duration:RM()?500:800,easing:"ease-out"}).onfinish=()=>{d.hidden=true};
}
function bump(el){ if(RM()||!el) return;
  el.animate([{transform:"scale(1)"},{transform:"scale(1.3)"},{transform:"scale(1)"}],{duration:200,easing:"cubic-bezier(.2,.8,.2,1)"}); }
function shake(el){ if(RM()) return;
  el.animate([{transform:"translateX(0)"},{transform:"translateX(-4px)"},{transform:"translateX(4px)"},
    {transform:"translateX(-3px)"},{transform:"translateX(0)"}],{duration:240}); }
function flash(el){ if(RM()) return;
  el.animate([{background:"var(--c-soft)"},{background:"var(--s2)"}],{duration:450,easing:"ease-out"}); }
```

### C.3 Compra com feedback (substitui o ramo `.buy`, linhas 1097-1099) — usa `aria-disabled`, não `disabled`

```js
$("rows").addEventListener("click",e=>{
  const b=e.target.closest(".buy"); if(!b) return;
  const k=st.cur,i=+b.dataset.i,s=st.g[k],n=nFor(k,i),c=costOf(k,i,n);
  const row=b.closest(".row");
  if(s.m<c){                                   // feedback negativo explica o motivo
    shake(b); sfx("no"); buzz(12);
    const r=psOf(k); toast("Faltam "+GAMES[k].cur+" "+fmt(c-s.m)+(r>0?" (~"+fmtT((c-s.m)/r)+")":""));
    return;
  }
  const before=mult(s.o[i]);
  s.m-=c; s.o[i]+=n; st.stats.buys+=n; dirtyPS(k);
  flash(row); bump(row.querySelector(".own")); sfx("buy"); buzz(10);
  pop("-"+fmt(c),fx.clientWidth/2,fx.clientHeight*.5);          // custo flutua na cena
  try{SCENES[k].burst&&SCENES[k].burst(cx,cw,ch,performance.now()/1000)}catch(_){}
  if(mult(s.o[i])>before){                                      // cruzou x25: marco!
    toast(GAMES[k].gens[i][0]+" rende x"+mult(s.o[i])+"!"); sfx("up");
  }
  dirtyScene=true; scheduleRender(); save();
});
```

Helpers de formatação e escrita com diff (evitam tocar o DOM sem mudança):

```js
const fmtT=s=>s<60?Math.ceil(s)+" s":s<3600?Math.ceil(s/60)+" min":Math.ceil(s/3600)+" h";
const setText=(n,v)=>{ if(n._v!==v){ n._v=v; n.textContent=v } };
const setAttr=(n,a,v)=>{ if(n["_"+a]!==v){ n["_"+a]=v; n.setAttribute(a,v) } };
const setData=(n,a,v)=>{ if(n.dataset[a]!==v) n.dataset[a]=v };
const setBar =(n,p)=>{ p=Math.round(Math.min(1,Math.max(0,p))*100)/100; if(n._q!==p){ n._q=p; n.style.transform="scaleX("+p+")" } };
const _ps={}; const psOf=k=>_ps[k]??(_ps[k]=ps(k)); const dirtyPS=k=>{ delete _ps[k] };
const gainOf=(k,i,n)=>{ const o=st.g[k].o[i],g=GAMES[k].gens[i]; return g[3]*((o+n)*mult(o+n)-o*mult(o)) };
const stageIdx=k=>{ let r=0; GAMES[k].stages.forEach((x,j)=>{ if(st.g[k].t>=x[0]) r=j }); return r };
```
`earn()` (linha 1048) passa a usar `psOf(k)`; `dirtyPS(k)` ao comprar/zerar/importar.

### C.4 Fase nova (banner + confete) — chamar a cada 1 s

```js
function checkStages(){
  for(const k in GAMES){
    const s=st.g[k],i=stageIdx(k);
    if(s.sg==null){ s.sg=i; continue }
    if(i>s.sg){
      s.sg=i; const nome=GAMES[k].stages[i][1];
      if(k===st.cur){ stageUp(nome) } else { toast(GAMES[k].name+": "+nome+"!") }
    }
  }
}
function stageUp(nome){
  const b=$("banner"); b.querySelector("b").textContent=nome;
  b.classList.remove("go"); void b.offsetWidth; b.classList.add("go");
  toast("Nova fase: "+nome); sfx("up"); buzz([20,40,20]);
  if(!RM()) for(let j=0;j<3;j++) setTimeout(()=>{ try{SCENES[st.cur].burst&&SCENES[st.cur].burst(cx,cw,ch,performance.now()/1000)}catch(_){} },j*220);
}
```

### C.5 Render com diff, loop de cena e canvas (substitui `fit`, `frame`, `update`, o `setInterval` de 250 ms e `say`, linhas 1060-1086, 1111, 1113)

```js
/* ---------- HUD ---------- */
const H={bal:$("bal"),ps:$("ps"),stage:$("stage"),next:$("next"),bar:$("stbar").firstElementChild};
function paintHud(){
  const k=st.cur,G=GAMES[k],s=st.g[k],i=stageIdx(k),nx=G.stages[i+1];
  setText(H.bal,G.cur+" "+fmt(s.m));
  setText(H.ps,G.cur+" "+fmt(psOf(k))+"/s");
  setText(H.stage,G.stages[i][1]);
  setText(H.next,nx?"Próx.: "+nx[1]+" · "+fmt(s.t)+" / "+fmt(nx[0]):"Fase final");
  setBar(H.bar,nx?(s.t-G.stages[i][0])/(nx[0]-G.stages[i][0]):1);
}

/* ---------- Lista: monta UMA vez por jogo, depois só diff ---------- */
let UI=[],MORE;
function buildRows(){
  const k=st.cur,G=GAMES[k];
  $("rows").innerHTML=G.gens.map((g,i)=>
   `<li class="row" data-i="${i}"><div class="ic" aria-hidden="true">${G.icons[i]}</div>
    <div><div class="l1"><span class="nm"></span><span class="own"></span></div><div class="ds"></div>
    <div class="ms"><span class="mg"></span><span class="mbar"><b></b></span><span class="mt"></span></div></div>
    <div class="bw"><button class="buy" data-i="${i}" aria-disabled="true"><i class="fill"></i><span class="b1"></span><span class="b2"></span></button></div></li>`
  ).join("")+`<li class="more" id="more"></li>`;
  const q=(r,s)=>r.querySelector(s);
  UI=[...$("rows").querySelectorAll(".row")].map(r=>({r,nm:q(r,".nm"),own:q(r,".own"),ds:q(r,".ds"),mg:q(r,".mg"),
    mb:q(r,".mbar>b"),mt:q(r,".mt"),buy:q(r,".buy"),fill:q(r,".fill"),b1:q(r,".b1"),b2:q(r,".b2"),ic:q(r,".ic")}));
  MORE=$("more");
}
function paintRows(){
  const k=st.cur,G=GAMES[k],s=st.g[k],rate=psOf(k); let rv=s.rv==null?0:s.rv,best=-1,bestC=Infinity;
  G.gens.forEach((g,i)=>{ if(s.o[i]>0||s.t>=g[2]*.5) rv=Math.max(rv,i) }); s.rv=rv;
  G.gens.forEach((g,i)=>{
    const u=UI[i]; if(!u) return;
    if(i>rv+1){ u.r.hidden=true; return } u.r.hidden=false;
    if(i===rv+1){                                              // misterioso
      setData(u.r,"state","mystery"); setText(u.nm,"???"); setText(u.own,""); setText(u.mg,""); setText(u.mt,"");
      setText(u.ds,"Junte "+G.cur+" "+fmt(g[2]*.5)+" no total para descobrir"); setBar(u.mb,s.t/(g[2]*.5));
      setText(u.ic,"?"); return;
    }
    const o=s.o[i],n=nFor(k,i),c=costOf(k,i,n),ok=s.m>=c;
    setText(u.ic,G.icons[i]); setText(u.nm,g[0]); setText(u.ds,g[1]); setText(u.own,o?"x"+o:"");
    setText(u.mg,"+"+fmt(gainOf(k,i,n))+"/s"); setBar(u.mb,(o%25)/25); setText(u.mt,"x2 em "+(25-o%25));
    setText(u.b1,ok?"Comprar x"+n:(rate>0?"faltam "+fmtT((c-s.m)/rate):"faltam "+fmt(c-s.m)));
    setText(u.b2,G.cur+" "+fmt(c)); setBar(u.fill,s.m/c);
    setAttr(u.buy,"aria-disabled",ok?"false":"true");
    setAttr(u.buy,"aria-label","Comprar "+n+" "+g[0]+" por "+G.cur+" "+fmt(c)+(ok?"":", ainda não disponível"));
    setData(u.r,"state",ok?"afford":"poor");
    if(ok&&c0(k,i)<bestC){ best=i; bestC=c0(k,i) }
  });
  UI.forEach((u,i)=>setData(u.r,"best",i===best?"1":"0"));
  const left=G.gens.length-(rv+2); setText(MORE,left>0?"+ "+left+" melhorias por descobrir":""); MORE.hidden=left<=0;
}

/* ---------- Nav ---------- */
const NAV={}; document.querySelectorAll(".nv[data-k]").forEach(b=>NAV[b.dataset.k]={b,ps:b.querySelector(".nv-ps"),dot:b.querySelector(".dot")});
const canBuyAny=k=>{ const s=st.g[k]; return GAMES[k].gens.some((g,i)=>(s.o[i]>0||s.t>=g[2]*.5)&&s.m>=c0(k,i)) };
function paintNav(){ for(const k in GAMES){ const n=NAV[k];
  setText(n.ps,GAMES[k].cur+" "+fmt(psOf(k))+"/s"); n.dot.hidden=!(k!==st.cur&&canBuyAny(k));
  setAttr(n.b,"aria-current",k===st.cur?"page":"false"); } }

/* ---------- Agendador: no máximo 1 render por quadro ---------- */
let rq=0; function scheduleRender(){ if(rq) return; rq=requestAnimationFrame(()=>{ rq=0; paintHud(); paintRows(); paintNav(); }) }

/* ---------- Tick de simulação (100 ms) ---------- */
let prev=Date.now(),tickN=0;
setInterval(()=>{
  if(document.hidden) return;                       // em segundo plano: só o cálculo de "away" (C.9)
  const n=Date.now(),dt=Math.min((n-prev)/1000,5); prev=n;
  earn(dt); st.stats.play+=dt;
  paintHud();
  if(++tickN%3===0) paintRows();                    // 300 ms
  if(tickN%10===0){ paintNav(); checkStages(); checkAch(); }   // 1 s
},100);

/* ---------- Canvas: 30 fps, DPR<=2, pausa, estático em reduced-motion ---------- */
const cv=$("sc"),cx=cv.getContext("2d"); let cw=0,ch=0,dirtyScene=true,sheetOpen=false,lastT=0;
function fit(){
  const sc=SCENES[st.cur]; if(!sc) return;
  const box=$("scene"),w=box.clientWidth; if(!w) return;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const h=Math.round(Math.max(176,Math.min(sc.h,innerHeight*.30)));    // altura CSS da cena
  const z=h/sc.h;                                                      // zoom-out (0,76..1)
  cw=Math.round(w/z); ch=sc.h;                                         // a cena enxerga uma largura lógica maior
  document.documentElement.style.setProperty("--stage-h",h+"px");
  cv.style.width=w+"px"; cv.style.height=h+"px";
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  cx.setTransform(dpr*z,0,0,dpr*z,0,0); dirtyScene=true;
}
let rzT=0,lw=0,lh=0;
new ResizeObserver(()=>{ clearTimeout(rzT); rzT=setTimeout(()=>{            // ignora a barra de URL subindo/descendo
  const w=$("scene").clientWidth; if(w!==lw||Math.abs(innerHeight-lh)>80){ lw=w; lh=innerHeight; fit(); } },150) }).observe($("scene"));
function frame(ts){
  requestAnimationFrame(frame);
  if(document.hidden||sheetOpen||!cw) return;
  if(RM()){ if(!dirtyScene) return; dirtyScene=false; ts=2000; }       // 1 quadro estático e só quando algo muda
  else if(ts-lastT<32) return;                                          // ~30 fps
  lastT=ts;
  const sc=SCENES[st.cur]; if(!sc) return;
  try{ sc.draw(cx,cw,ch,st.g[st.cur].o,ts/1000) }
  catch(e){ if(!frame.err){ frame.err=1; console.error("cena",e) } }    // loga uma vez em vez de engolir
}
requestAnimationFrame(frame);
```
Notas: (1) validar visualmente as três cenas com largura lógica de 360-560 px (todas usam `W` para layout); texto de 6-8px dentro da cena fica ~5-6px com zoom 0,76: é decorativo e não carrega informação essencial. (2) `ticker` (flavor text) substitui `#msg`: `setInterval(say,12000)` passa a alternar a classe `on` com `aria-hidden="true"`, altura fixa → a lista nunca "pula".

`build()` (substitui linhas 1064-1073):

```js
function build(){
  const k=st.cur,G=GAMES[k],r=document.documentElement.style;
  r.setProperty("--c",G.color); r.setProperty("--c-tx",G.tx);
  r.setProperty("--c-soft",G.color+"29"); r.setProperty("--c-glow",G.color+"66");
  document.title=G.name+" | Mini Idle";
  $("bigic").textContent=G.emoji; $("bigtx").textContent=G.click;
  $("sc").setAttribute("aria-label","Cena animada: "+G.name);
  document.querySelectorAll("#modes .mode").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.m===st.mode)));
  buildRows(); fit(); say(); dirtyScene=true; paintHud(); paintRows(); paintNav();
  document.querySelectorAll(".nv[data-k]").forEach(b=>setAttr(b,"aria-current",b.dataset.k===k?"page":"false"));
}
```
Eventos de navegação e modos (substitui linhas 1090-1091):

```js
document.querySelector(".nav").addEventListener("click",e=>{
  const b=e.target.closest(".nv"); if(!b) return;
  if(b.id==="menu") return openSheet();
  if(b.dataset.k!==st.cur){ st.cur=b.dataset.k; $("rows").scrollTop=0; build(); save(); sfx("tap"); }
});
$("modes").addEventListener("click",e=>{ const b=e.target.closest(".mode"); if(!b) return;
  st.mode=b.dataset.m; document.querySelectorAll("#modes .mode").forEach(x=>x.setAttribute("aria-checked",String(x===b))); paintRows(); save(); });
```

Colapso da cena (B.2):

```js
const app=$("app"),list=$("rows"); let compact=false;
function setCompact(v){ if(v===compact) return; compact=v; app.classList.toggle("compact",v); $("fold").textContent=v?"v":"^";
  $("fold").setAttribute("aria-expanded",String(!v)); $("fold").setAttribute("aria-label",v?"Mostrar cena":"Ampliar lista"); }
list.addEventListener("scroll",()=>{
  const y=list.scrollTop, spare=list.scrollHeight-list.clientHeight;
  if(!compact&&y>40&&spare>120) setCompact(true);      // só compacta se ainda sobrar rolagem (sem laço)
  else if(compact&&y<4) setCompact(false);
},{passive:true});
$("fold").addEventListener("click",()=>setCompact(!compact));
```

Ticker:

```js
const tk=$("msg");
function say(){ const m=GAMES[st.cur].msgs; tk.classList.remove("on"); setTimeout(()=>{ tk.textContent=m[Math.random()*m.length|0]; tk.classList.add("on"); },420); }
setInterval(()=>{ if(!document.hidden) say() },12000);
```

### C.6 Acessibilidade (resumo executável)

- Botões de compra: `aria-disabled` + `aria-label` completo (C.5); tocar num indisponível fala/mostra "Faltam X (~12 s)" (C.3).
- `toast`: `<div id="toast" role="status" aria-live="polite" aria-atomic="true">`; mensagens de compra/marco/fase/conquista passam por ele (não anunciar o saldo a cada tick).
- Canvas: `role="img"` + `aria-label` dinâmico (C.5 `build`). O ticker é `aria-hidden`.
- Modos de compra: `role="radiogroup"` + `role="radio" aria-checked` (HTML D). Nav: `aria-current="page"`. Barra de fase: `role="progressbar"` com `aria-valuenow` atualizado a cada 1 s (não por tick).
- Alvos: nav 64x56, modos 56x44, dock 56 de altura, linhas de ajuste 56, botões 44 (`--tap`).
- Foco visível global (`:focus-visible`, 3px branco, 12:1 sobre o fundo).
- `prefers-reduced-motion`: CSS global (B.7) + `RM()` no JS (sem burst, sem confete, sem ring, popups só em fade, cena estática redesenhada apenas quando algo muda). Ajuste manual "Reduzir animações: Auto / Sim / Não" (`st.set.motion`) aplica `document.body.classList.toggle("rm",RM())` ao abrir e ao mudar.
- Contraste: ver tabela B.6 (nenhum texto < 4,5:1; controles ≥ 3:1 de borda). Cor nunca é o único sinal: estados `poor/afford` também mudam texto ("faltam 12 s" × "Comprar x10"), `best` muda borda + anel, mistério usa borda tracejada e "???".

### C.7 Conquistas e estatísticas (data-driven, ~14 itens)

```js
const best=f=>Math.max(...Object.keys(GAMES).map(f));
const ACH=[
 {id:"c100", ic:"👆",nm:"Dedo quente",       ds:"100 toques",             max:100,   cur:()=>st.stats.clicks},
 {id:"c1k",  ic:"🖐️",nm:"Mil toques",         ds:"1.000 toques",           max:1e3,   cur:()=>st.stats.clicks},
 {id:"c10k", ic:"⚡",nm:"Dedo de aço",        ds:"10.000 toques",          max:1e4,   cur:()=>st.stats.clicks},
 {id:"b50",  ic:"🛒",nm:"Comprador",          ds:"50 compras",             max:50,    cur:()=>st.stats.buys},
 {id:"b500", ic:"🧾",nm:"Compulsivo",         ds:"500 compras",            max:500,   cur:()=>st.stats.buys},
 {id:"x25",  ic:"✖️",nm:"Dobrou!",            ds:"25 unidades de um item", max:25,    cur:()=>best(k=>Math.max(...st.g[k].o))},
 {id:"x100", ic:"💯",nm:"Centenário",         ds:"100 unidades de um item",max:100,   cur:()=>best(k=>Math.max(...st.g[k].o))},
 {id:"st2",  ic:"🌱",nm:"Crescendo",          ds:"Chegar à 3ª fase",       max:2,     cur:()=>best(stageIdx)},
 {id:"st4",  ic:"👑",nm:"Lenda",              ds:"Chegar à última fase",   max:4,     cur:()=>best(stageIdx)},
 {id:"t1m",  ic:"💰",nm:"Primeiro milhão",    ds:"Ganhar 1 mi no total",   max:1e6,   cur:()=>best(k=>st.g[k].t)},
 {id:"t1b",  ic:"🏦",nm:"Bilionário",         ds:"Ganhar 1 bi no total",   max:1e9,   cur:()=>best(k=>st.g[k].t)},
 {id:"all3", ic:"🎛️",nm:"Multitarefa",        ds:"Ter renda nos 3 jogos",  max:3,     cur:()=>Object.keys(GAMES).filter(k=>psOf(k)>0).length},
 {id:"last", ic:"🏁",nm:"Colecionador",       ds:"Comprar o último item de um jogo",max:1,cur:()=>best(k=>st.g[k].o[GAMES[k].gens.length-1]>0?1:0)},
 {id:"away", ic:"😴",nm:"Dorminhoco",         ds:"Voltar após 8 h fora",   max:28800, cur:()=>st.stats.awayMax},
];
function checkAch(){
  let novo=0;
  for(const a of ACH){ if(!st.ach[a.id]&&a.cur()>=a.max){ st.ach[a.id]=Date.now(); novo++; toast("Conquista: "+a.nm); sfx("ach"); buzz([10,30,10]); } }
  if(novo){ setText($("menucnt"),String(Object.keys(st.ach).length)); }
}
function renderAch(){
  const done=Object.keys(st.ach).length;
  $("pAch").innerHTML=`<p class="stat"><span>Conquistas</span><b>${done} / ${ACH.length}</b></p><div class="agrid">`+
   ACH.map(a=>{const on=!!st.ach[a.id],p=Math.min(1,a.cur()/a.max);
     return `<div class="ach" data-on="${+on}"><div class="ai" aria-hidden="true">${a.ic}</div><b>${a.nm}</b><small>${a.ds}</small>`+
       (on?"":`<div class="pb" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.floor(p*100)}"><i style="width:${p*100}%"></i></div>`)+`</div>`}).join("")+`</div>`;
}
function renderStats(){
  const T=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+" h "+m+" min":m+" min"};
  const rows=[["Toques",fmt(st.stats.clicks)],["Compras",fmt(st.stats.buys)],["Tempo jogado",T(st.stats.play)],
    ["Primeira partida",new Date(st.stats.since).toLocaleDateString("pt-BR")]];
  for(const k in GAMES){ const G=GAMES[k]; rows.push([G.name+" · total",G.cur+" "+fmt(st.g[k].t)],[G.name+" · fase",(stageIdx(k)+1)+" / "+G.stages.length]); }
  $("pStats").innerHTML=rows.map(r=>`<div class="stat"><span>${r[0]}</span><b>${r[1]}</b></div>`).join("");
}
```
Opcional (decisão de design do dono): cada conquista dar +1% de renda global. Não está incluído para não alterar o balanceamento.

### C.8 Menu, ajustes, exportar/importar, zerar com desfazer

```js
const sheet=$("sheet");
function openSheet(tab){ showTab(tab||"pAch"); document.body.classList.toggle("rm",RM()); sheetOpen=true; sheet.showModal(); }
sheet.addEventListener("close",()=>{ sheetOpen=false; dirtyScene=true; });
sheet.addEventListener("click",e=>{ if(e.target===sheet) sheet.close(); });          // toque no fundo fecha
function showTab(id){
  document.querySelectorAll(".stab").forEach(t=>t.setAttribute("aria-selected",String(t.dataset.p===id)));
  document.querySelectorAll(".sbody>section").forEach(p=>p.hidden=p.id!==id);
  if(id==="pAch") renderAch(); if(id==="pStats") renderStats();
}
$("stabs").addEventListener("click",e=>{ const t=e.target.closest(".stab"); if(t) showTab(t.dataset.p); });
$("xclose").addEventListener("click",()=>sheet.close());

/* switches */
function paintSettings(){
  document.querySelectorAll(".set[data-s]").forEach(b=>b.setAttribute("aria-checked",String(!!st.set[b.dataset.s])));
  document.querySelectorAll("#motion button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.v===st.set.motion)));
}
document.addEventListener("click",e=>{
  const b=e.target.closest(".set[data-s]"); if(b){ st.set[b.dataset.s]=!st.set[b.dataset.s]; paintSettings(); save(); if(b.dataset.s==="sound") sfx("buy"); return }
  const m=e.target.closest("#motion button"); if(m){ st.set.motion=m.dataset.v; document.body.classList.toggle("rm",RM()); dirtyScene=true; paintSettings(); save(); }
});

/* exportar / importar (texto) */
const crc=s=>{ let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))>>>0; return h.toString(36) };
function exportSave(){
  st.last=Date.now(); const j=JSON.stringify({v:1,d:st});
  return "IDLE3:"+btoa(String.fromCharCode(...new TextEncoder().encode(j)))+":"+crc(j);
}
function parseSave(txt){
  const [tag,b,ck]=String(txt).trim().split(":");
  if(tag!=="IDLE3"||!b) throw new Error("Formato inválido");
  const j=new TextDecoder().decode(Uint8Array.from(atob(b),c=>c.charCodeAt(0)));
  if(crc(j)!==ck) throw new Error("Texto incompleto ou alterado");
  const d=JSON.parse(j).d; if(!d||typeof d.g!=="object") throw new Error("Save sem dados");
  for(const k in GAMES){ const g=d.g[k]; if(!g) continue;                    // jogo ausente = começa do zero
    if(![g.m,g.t].every(Number.isFinite)||g.m<0||g.t<0||!Array.isArray(g.o)||g.o.length>GAMES[k].gens.length||
       !g.o.every(n=>Number.isInteger(n)&&n>=0&&n<1e7)) throw new Error("Dados fora do esperado ("+k+")"); }
  return d;
}
$("btnExport").addEventListener("click",()=>{ const t=$("saveTxt"); t.value=exportSave(); t.select(); });
$("btnCopy").addEventListener("click",async()=>{ const t=$("saveTxt"); t.select();
  try{ await navigator.clipboard.writeText(t.value) }catch(_){ document.execCommand("copy") } toast("Save copiado"); });
$("btnDown").addEventListener("click",()=>{ const a=document.createElement("a");
  a.href=URL.createObjectURL(new Blob([$("saveTxt").value||exportSave()],{type:"text/plain"}));
  a.download="idle3-save-"+new Date().toISOString().slice(0,10)+".txt"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),1000); });
$("btnImport").addEventListener("click",()=>{
  try{ const d=parseSave($("saveTxt").value);
    localStorage.setItem(K+"-undo",localStorage.getItem(K)||"");            // backup do save atual
    localStorage.setItem(K,JSON.stringify(d)); location.reload();
  }catch(err){ toast("Importar falhou: "+err.message); } });

/* zerar com <dialog> + desfazer */
let zerar=null;
function askReset(scope){ zerar=scope; $("dlgTitle").textContent=scope==="all"?"Zerar os 3 jogos?":"Zerar "+GAMES[st.cur].name+"?"; $("dlg").showModal(); }
$("btnResetOne").addEventListener("click",()=>askReset("one")); $("btnResetAll").addEventListener("click",()=>askReset("all"));
$("dlgNo").addEventListener("click",()=>$("dlg").close());
$("dlgYes").addEventListener("click",()=>{
  $("dlg").close(); const snap=JSON.stringify(st);
  (zerar==="all"?Object.keys(GAMES):[st.cur]).forEach(k=>{ st.g[k]={m:0,t:0,o:GAMES[k].gens.map(()=>0)}; dirtyPS(k) });
  build(); save(); sheet.close();
  toast("Jogo zerado.",{action:"Desfazer",ms:10000,fn:()=>{ st=JSON.parse(snap); Object.keys(GAMES).forEach(dirtyPS); build(); save(); }});
});
```
`st` precisa ser `let` (já é, linha 1033). Remover o `<button class="reset">` do fim da lista (linha 58) e o ramo `t.id==="reset"` (1100-1103).

Toast com ação (substitui linha 1058):

```js
let tt=0,tfn=null; const T=$("toast");
function toast(msg,opt){
  clearTimeout(tt); tfn=opt&&opt.fn||null;
  T.innerHTML=""; const s=document.createElement("span"); s.textContent=msg; T.append(s);
  if(opt&&opt.action){ const b=document.createElement("button"); b.textContent=opt.action; b.onclick=()=>{ tfn&&tfn(); T.classList.remove("show","act") }; T.append(b); }
  T.classList.toggle("act",!!(opt&&opt.action)); T.classList.add("show");
  tt=setTimeout(()=>T.classList.remove("show","act"),(opt&&opt.ms)||3000);
}
```

Som e vibração (WebAudio, sem arquivos; desligado por padrão — o jogo costuma ser jogado no trabalho):

```js
let AC,lastTap=0;
const SND={tap:[[660,.03]],buy:[[523,.06],[784,.09]],no:[[196,.1]],up:[[392,.08],[523,.08],[659,.08],[784,.22]],ach:[[523,.07],[659,.07],[784,.07],[1047,.16]]};
function sfx(n){
  if(!st.set.sound) return; const now=performance.now(); if(n==="tap"){ if(now-lastTap<50) return; lastTap=now; }
  AC=AC||new(window.AudioContext||window.webkitAudioContext)(); if(AC.state==="suspended") AC.resume();
  let t=AC.currentTime; for(const [f,d] of SND[n]){
    const o=AC.createOscillator(),g=AC.createGain(); o.type=n==="no"?"sawtooth":"square"; o.frequency.value=f;
    g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.05,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+d);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t+d+.02); t+=d*.9; }
}
function buzz(p){ if(st.set.haptic&&!RM()&&navigator.vibrate) navigator.vibrate(p); }
```

### C.9 Offline e volta ao app (corrige o problema #2; substitui linhas 1106-1107 e 1114)

```js
const snap=()=>Object.fromEntries(Object.keys(GAMES).map(k=>[k,st.g[k].m]));
function creditAway(sec){
  sec=Math.min(sec,MAXAWAY); if(sec<30) return;
  const b=snap(); earn(sec); st.stats.awayMax=Math.max(st.stats.awayMax,sec); showAway(sec,b); save();
}
function showAway(sec,b){
  const T=s=>{const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?h+" h "+m+" min":m+" min"};
  $("awayT").textContent="Você ficou fora por "+T(sec)+(sec>=MAXAWAY?" (limite de ganho offline: 8 h)":"");
  $("awayL").innerHTML=Object.keys(GAMES).map(k=>`<div class="stat"><span>${GAMES[k].name}</span><b>+${GAMES[k].cur} ${fmt(st.g[k].m-b[k])}</b></div>`).join("");
  $("away").showModal(); sfx("buy");
}
$("awayOk").addEventListener("click",()=>$("away").close());

creditAway((Date.now()-st.last)/1000); build();             // carga inicial (no lugar das linhas 1106-1108)

let hiddenAt=0;
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){ hiddenAt=Date.now(); save(); }
  else{ if(hiddenAt) creditAway((Date.now()-hiddenAt)/1000); hiddenAt=0; prev=Date.now(); dirtyScene=true; build(); }
});
addEventListener("pagehide",save);
setInterval(save,5000);
```
O tick (C.5) ignora `document.hidden`, então nada é contado duas vezes.

---

## (D) Estrutura de HTML sugerida (substitui `<body>` até a linha 60; o `<script>` com `GAMES/SCENES` permanece)

Acrescentar no `<head>`: `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">` e `<meta name="theme-color" content="#0e1014">`.

```html
<div class="app" id="app">

  <header class="hud" aria-label="Resumo">
    <div class="hud-top">
      <span class="hud-stage" id="stage"></span>
      <span class="hud-next" id="next"></span>
    </div>
    <div class="hud-main">
      <div class="bal" id="bal">0</div>
      <div class="ps" id="ps"></div>
    </div>
    <div class="bar" id="stbar" role="progressbar" aria-label="Progresso até a próxima fase"
         aria-valuemin="0" aria-valuemax="100"><i></i></div>
  </header>

  <section class="stage" id="stagebox" aria-label="Cena do jogo">
    <div class="scene" id="scene">
      <canvas id="sc" role="img" aria-label="Cena animada"></canvas>
      <div class="fx" id="fx"></div>
      <div class="banner" id="banner" aria-hidden="true"><small>Nova fase</small><b></b></div>
      <p class="ticker" id="msg" aria-hidden="true"></p>
    </div>
    <button class="dock" id="big" type="button">
      <span class="dock-ic" id="bigic" aria-hidden="true"></span>
      <span class="dock-tx"><b id="bigtx"></b><small id="bigv"></small></span>
    </button>
  </section>

  <main class="panel">
    <div class="phead">
      <span class="phead-lb" id="mlbl">Comprar</span>
      <div class="modes" id="modes" role="radiogroup" aria-labelledby="mlbl">
        <button class="mode" role="radio" aria-checked="true"  data-m="1"   type="button">x1</button>
        <button class="mode" role="radio" aria-checked="false" data-m="10"  type="button">x10</button>
        <button class="mode" role="radio" aria-checked="false" data-m="max" type="button">Máx</button>
      </div>
      <button class="fold" id="fold" type="button" aria-expanded="true" aria-label="Ampliar lista">^</button>
    </div>
    <ul class="list" id="rows" aria-label="Melhorias"></ul>
  </main>

  <nav class="nav" aria-label="Jogos e menu">
    <button class="nv" data-k="lan" type="button" style="--g:#22d3ee">
      <span class="nv-ic" aria-hidden="true">🖥️</span><span class="nv-nm">Lan</span><span class="nv-ps"></span><i class="dot" hidden></i></button>
    <button class="nv" data-k="civ" type="button" style="--g:#f59e0b">
      <span class="nv-ic" aria-hidden="true">🚀</span><span class="nv-nm">Caverna</span><span class="nv-ps"></span><i class="dot" hidden></i></button>
    <button class="nv" data-k="esp" type="button" style="--g:#a855f7">
      <span class="nv-ic" aria-hidden="true">🏆</span><span class="nv-nm">eSports</span><span class="nv-ps"></span><i class="dot" hidden></i></button>
    <button class="nv" id="menu" type="button" aria-haspopup="dialog">
      <span class="nv-ic" aria-hidden="true">⚙️</span><span class="nv-nm">Menu</span><span class="cnt" id="menucnt" hidden></span></button>
  </nav>
</div>

<div class="toast" id="toast" role="status" aria-live="polite" aria-atomic="true"></div>

<dialog class="sheet" id="sheet" aria-label="Menu">
  <div class="shead">
    <div class="stabs" id="stabs" role="tablist">
      <button class="stab" role="tab" data-p="pAch"   aria-selected="true"  type="button">Conquistas</button>
      <button class="stab" role="tab" data-p="pStats" aria-selected="false" type="button">Estatísticas</button>
      <button class="stab" role="tab" data-p="pSet"   aria-selected="false" type="button">Ajustes</button>
    </div>
    <button class="xbtn" id="xclose" type="button" aria-label="Fechar">×</button>
  </div>
  <div class="sbody">
    <section id="pAch" role="tabpanel"></section>
    <section id="pStats" role="tabpanel" hidden></section>
    <section id="pSet" role="tabpanel" hidden>
      <button class="set" data-s="sound"  role="switch" aria-checked="false" type="button">
        <span>Som<small>Desligado por padrão</small></span><span class="sw"></span></button>
      <button class="set" data-s="haptic" role="switch" aria-checked="true" type="button">
        <span>Vibração<small>Em celulares compatíveis</small></span><span class="sw"></span></button>
      <div class="set" style="cursor:default">
        <span>Reduzir animações<small>Auto segue o sistema</small></span>
        <span id="motion" class="modes" role="radiogroup" style="flex:none">
          <button class="mode" role="radio" data-v="auto"   aria-checked="true"  type="button">Auto</button>
          <button class="mode" role="radio" data-v="reduce" aria-checked="false" type="button">Sim</button>
          <button class="mode" role="radio" data-v="full"   aria-checked="false" type="button">Não</button></span>
      </div>
      <h3>Salvar</h3>
      <textarea class="save" id="saveTxt" aria-label="Texto do save" spellcheck="false" autocapitalize="off"
                placeholder="Toque em Exportar para gerar o texto, ou cole aqui um save para importar"></textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn pri" id="btnExport" type="button">Exportar</button>
        <button class="btn" id="btnCopy" type="button">Copiar</button>
        <button class="btn" id="btnDown" type="button">Baixar .txt</button>
        <button class="btn" id="btnImport" type="button">Importar</button>
      </div>
      <h3>Zona de perigo</h3>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn danger" id="btnResetOne" type="button">Zerar este jogo</button>
        <button class="btn danger" id="btnResetAll" type="button">Zerar tudo</button>
      </div>
    </section>
  </div>
</dialog>

<dialog class="dlg" id="dlg" aria-labelledby="dlgTitle">
  <h2 id="dlgTitle"></h2>
  <p>Isso apaga saldo e compras. Um backup fica disponível por 10 s para desfazer.</p>
  <div class="acts">
    <button class="btn pri" id="dlgNo" type="button" autofocus>Cancelar</button>
    <button class="btn danger" id="dlgYes" type="button">Zerar</button>
  </div>
</dialog>

<dialog class="dlg" id="away" aria-labelledby="awayH">
  <h2 id="awayH">Bem-vindo de volta!</h2>
  <p id="awayT"></p><div id="awayL"></div>
  <div class="acts"><button class="btn pri" id="awayOk" type="button" autofocus>Continuar</button></div>
</dialog>
```

Ordem de DOM = ordem de foco = ordem visual (HUD, cena, dock, modos, lista, nav). `h3` dentro de `#pSet` herda tipografia do navegador: estilizar `.sbody h3{margin:16px 0 4px;font-size:var(--fs-sm);color:var(--tx2);letter-spacing:.06em;text-transform:uppercase}`.

---

## (E) Ordem de implementação e checklist de aceitação

Ordem sugerida (cada passo deixa o jogo jogável):
1. **Casca + HUD + dock + nav** (B.1, B.7, D) e `build/fit/frame` novos (C.5). Resolve #1, #6, #13, #14 e boa parte de #8.
2. **Offline correto** (C.9). Resolve #2 (bug de progresso; fazer cedo).
3. **Lista com diff, estados, mistério, best, `aria-disabled`** (C.3, C.5). Resolve #3, #4, #5, #7 (parcial).
4. **Fase/marcos**: barra no HUD, banner (C.4). Fecha #7.
5. **Menu**: ajustes, exportar/importar, zerar com desfazer, som/vibração (C.8). Resolve #9, #11 (parcial).
6. **Conquistas + estatísticas** (C.7). Fecha #11.
7. **Passe de acessibilidade/reduced-motion** (C.6) e teste em aparelho real.

Checklist de aceitação (360x560 e 390x844):
- [ ] Sem rolagem da página; apenas `#rows` rola; barra do navegador subindo/descendo não recria o canvas.
- [ ] Primeiro item e o botão de clique visíveis ao mesmo tempo em 360x560; com a lista rolada a cena compacta e ≥ 3 itens aparecem.
- [ ] Toque em qualquer ponto da cena soma o valor; 3 dedos = 3 cliques; Enter/Espaço no dock soma 1 clique.
- [ ] Nenhum alvo interativo < 44x44 (inspecionar nav, modos, fold, switches, botões do sheet).
- [ ] Contraste ≥ 4,5:1 para texto (conferir roxo com `--c-tx:#c084fc`).
- [ ] `prefers-reduced-motion: reduce` (DevTools): sem ring, sem confete, cena estática, popups em fade.
- [ ] Trocar de app por 2 min e voltar sem recarregar: o diálogo "Bem-vindo de volta" lista os 3 jogos e o saldo cresceu uma única vez.
- [ ] Exportar → zerar tudo → importar o texto restaura o jogo; texto adulterado mostra "Texto incompleto ou alterado" e não altera nada.
- [ ] Performance: Performance panel com 6x CPU throttling, 30 fps estáveis; durante o jogo parado nenhum `innerHTML` (só `textContent`/`transform` nos nós que mudam); sem layout por tick (HUD tem `contain:layout paint`, linhas têm `contain:layout paint`).
- [ ] Console limpo; erro de cena aparece uma única vez (`console.error`).

Decisões em aberto para o dono do projeto (não bloqueiam a implementação):
- Dock embaixo da cena (padrão deste spec) **ou** FAB sobreposto; o dock foi escolhido porque a cena usa o chão inteiro.
- Se conquistas devem dar bônus permanente de renda (hoje só cosmético).
- Som: padrão desligado (jogado no trabalho); mudar para ligado se preferir.
