# img/ - manifesto dos assets (V3 do Time de eSports)

Origem: repo BrasLOL (somente leitura), copiado/reduzido em 2026 para a V3. Formato: webp (e svg para bandeiras/objetivos).
NAO foram copiados: jogadores/ (fotos), tecnicos/, champs/ (arte de campeoes), fundos/ (splash de campeoes). `img/jogadores/` ja existia e nao foi tocada.

| Pasta | Origem (BrasLOL) | Uso na V3 | Obs |
|---|---|---|---|
| ligas/ | ligas/ (8 webp: cblol lck lcp lcs lec lpl msi mundial) | emblema da liga/torneio no cabecalho da Liga, tabelas, chaves, cenas | max 128 px |
| logos/ | logos/ (107 webp, nome = slug do time: minusculas, sem acento, hifens) | escudo dos times da IA, tabelas, chaves, cenas | reduzidos para 96 px |
| trofeus/ | trofeus/ (18: CBLOL LCK LCS LEC LPL, c e f m w, mvp-*) | estante de trofeus, banner de campeao, MVP | reduzidos para 128 px, png->webp |
| flags/ | flags/ (12 svg: br us kr cn tw jp vn fr de sg th ph) | bandeira de regiao/jogador/time | so as de menor peso |
| conquistas/ | conquistas/ (20 webp, sem LEIA-ME) | icones das conquistas (aba Metas) | original, sem reducao |
| itens/ | itens/ (21 icones do patch 16.22.1) | icones de melhorias globais e upgrades de heroi (Botas, Espada Longa, Anel de Doran...) | 48 px; ids em itens.js |
| obj/ | champs/obj/ (EXCECAO: so icones de OBJETIVOS, nao arte de campeao): baron/elder/herald/tower svg; dragoes dr_*, bn_*, el_*, hd_*, inh_*, larva, tw_* | icones de objetivo no resumo de partida e eventos | 64 px webp |
| adornos/ | adornos/escudo_sm.webp | escudo generico do time do jogador | |

Tamanho total: ver linha final (gerada na criacao).
TOTAL: 517950 bytes (~505 KB; 210 arquivos; ocupa ~1 MB em disco por blocos)
