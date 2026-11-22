# eSports CEO

Jogo de gestão de uma organização de esports, inspirado no Football Manager. Você é o **CEO**: os técnicos cuidam do jogo, você cuida da org (dinheiro, elenco, patrocínio, metas da diretoria).

Feito em **React + TypeScript + Vite**. Roda no navegador do PC e no celular (instalável), e é publicado no Vercel.

## Rodar
```bash
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes do motor (2 temporadas completas)
npm run build    # gera dist/ (é isso que o Vercel publica)
```
No Vercel: Framework Preset **Vite** (build `npm run build`, saída `dist`).

## O que já tem (Fase 1)
- **Cenários de início:** Org nova (compra vaga na Challengers e monta o time na peneira), Org em crise (time da elite endividado) e Investidor (time forte, diretoria exigente). Rebrand do time assumido.
- **Dois jogos desde o início:** LoL + 1 à escolha (CS2, VALORANT, Dota 2, Free Fire, R6, EA FC ou Wild Rift).
- **Peneira:** agentes livres, talentos da solo queue e jogadores com contrato interessados no projeto, com notas aproximadas, custo de assinatura e comentário do técnico.
- **Ritmo:** **Continuar** avança 1 dia (barra de espaço). O botão **▶▶** (Shift+Enter) avança dia a dia até o próximo compromisso, parando em jogos e decisões.
- **Dia de jogo:** chance de vitória, resumo animado de ~30 s por série (placar ao vivo, eventos, gráfico de ouro no LoL/Dota/WR, MVP, estatísticas por mapa) e painel com todos os resultados do dia.
- **Campeonatos no formato do BrasLOL** (`src/engine/comp.ts`), iguais para todas as modalidades. Só muda o calendário, os nomes e as vagas:
  - Ligas: 3 splits por ano com pontos corridos (ida e volta) e playoffs de 6 com chave superior e inferior. A Challengers tem semis e final. Ao fim de cada split, série de acesso (MD5): o último da elite enfrenta o campeão da Challengers.
  - LoL: First Stand (dupla eliminação de 8), MSI (Play-In e chave de 8), Esports World Cup (grupos GSL e mata-mata) e Mundial (Play-In, fase suíça de 16 e mata-mata).
  - Outros jogos: internacional de 8 (dupla eliminação) após o split 2 e mundial de 16 (suíço e mata-mata) após o split 3, com os nomes reais (IEM Major, Masters, Champions, The International...).
  - Telas: tabela, chave com conectores, fase suíça, grupos e lista de jogos.
- **Caixa de entrada** com decisões: patrocínios, reservas insatisfeitos, pedidos do técnico.
- **Elenco:** nota, forma, moral, perfil, salário e contrato. O técnico escala sozinho, mas o CEO pode intervir trocando jogadores.
- **Finanças:** receitas e despesas semanais, patrocinadores, gráfico do caixa. **Diretoria** com meta e confiança.

## Estrutura
- `src/engine/`: motor sem interface (testável). `world.ts` (times/jogadores), `sim.ts` (calendário, ligas, playoffs, virada de ano), `match.ts` (partidas e resumos), `org.ts` (cenários, peneira, finanças, caixa de entrada).
- `src/ui/`: telas em React. `src/styles.css`: tema escuro.
- `src/data/*.json`: dados reais (times, elencos, históricos). Os geradores antigos estão em `tools/gen_*.py`. Para converter um `.js` antigo: `node tools/js2json.cjs <pasta-js> src/data`.
- Save no navegador (`localStorage`, chave `esportsceo-v2`).

## Logos e fotos
1. Abra `/pendencias.html` (no site ou em `public/pendencias.html`). Lá estão os times sem logo e os jogadores sem foto, com link direto para a Leaguepedia/Liquipedia.
2. Salve as imagens com **qualquer nome** em `entrada/logos/` ou `entrada/fotos/`.
3. Rode `python3 tools/importar_imagens.py` (precisa do Pillow). Ele reconhece de quem é cada arquivo, recorta, tira o fundo dos logos, converte para webp e atualiza as listas do jogo.

Quem não tem logo usa um escudo gerado com sigla e cor. Quem não tem foto usa um avatar com as iniciais.

## Fase 2 (feita)
- Visual de jogo de PC (inspirado no Esports Manager 2026): barra lateral fixa, CONTINUAR no topo, painéis com cantos, retratos ilustrados.
- Jogadores vivos: forma, moral, humor, evolução mensal, histórico, biografia, atributos em radar.
- Notas escondidas: famosos aparecem com faixa; olheiros geram relatórios.
- Negociação em 2 etapas (clube, depois jogador) com rivais disputando; vendas e renovações.
- Rosto da Org com exigências visíveis.
- Sede visível (casa mediana → casa grande → mansão → prédio), alugar ou comprar, cômodos com obra.
- Comissão técnica e staff como pessoas; cada cômodo libera um cargo.
- Periféricos por time (4 níveis, desgaste, patrocinador).
- Saves da versão anterior não abrem: comece uma carreira nova.

## Fase 3 (feita)
- Expansão até 8 jogos em Organização → Modalidades: do zero (vaga + peneira), comprando uma org (rebrand) ou como investidor master. Pede reputação e camas na sede; o time estreia no próximo split.
- Academies: jogam a Challengers (não sobem), jovens evoluem mais rápido; promover/rebaixar pela ficha do jogador. Rebaixamento do principal fecha a Academy.
- Marca e loja: produtos com lote, faixa de preço e estoque (camisa, moletom, boné, mousepad, camisa assinada do Rosto, coleção de campeão, collab), sócio-torcedor, eventos com ingresso (bar, teatro, ginásio, arena) e hype.
- Finanças rebalanceadas com valores reais do cenário e crédito bancário quando o caixa aperta.

## Próximas fases
4. Históricos e prêmios (Golden Crown etc.), Hall da Fama, versão .exe.
