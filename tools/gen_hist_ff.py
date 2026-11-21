# Gera js/data/hist_ff.js (Free Fire). Rodar: python3 tools/gen_hist_ff.py
# Só dados confirmados em fontes (Wikipedia FFWS, Sportskeeda, Esports World Cup, Free Fire Mania, Folha Vitória). Sem rosters (não verificados).
import json
T=[]
def add(n,a,tp,c,v='',p='',mvp=None,mt='',pais=''):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    T.append(d)
# Mundiais
add('Free Fire World Cup 2019 Bangkok',2019,'Mundial','EVOS Esports',mvp='Kronos',mt='EVOS Esports')
add('FFWS 2019 Rio de Janeiro',2019,'Mundial','Corinthians','Sbornaya ChR','132–98','Nobru','Corinthians','Brasil')
add('FFWS 2021 Singapura',2021,'Mundial','Phoenix Force','LOUD','113–77','The Cruz','Phoenix Force','Tailândia')
add('FFWS 2022 Sentosa',2022,'Mundial','Attack All Around','EVOS Phoenix','92–91','JLX','Attack All Around','Tailândia')
add('FFWS 2022 Bangkok',2022,'Mundial','EVOS Phoenix','Vivo Keyd Stats','117–114','Moshi','EVOS Phoenix','Tailândia')
add('FFWS 2023 Bangkok',2023,'Mundial','Magic Squad','Buriram United Esports','112–95','DEW','EXP Esports','Tailândia')
add('FFWS 2024 Rio de Janeiro',2024,'Mundial','Fluxo','RRQ Kazu','86–83','Wassana','Buriram United Esports','Tailândia')
add('FFWS 2025 Jacarta',2025,'Mundial','Buriram United Esports','Fluxo','103–102','Wassana','Buriram United Esports','Tailândia')
# Esports World Cup
add('Esports World Cup 2024',2024,'EWC','Team Falcons')
add('Esports World Cup 2025',2025,'EWC','EVOS Divine','','170 pts','Rasyah','EVOS Divine','Indonésia')
add('Esports World Cup 2026',2026,'EWC','LYON','','','Gamezking','LYON','Argentina')
# Liga Brasileira (LBFF) e FFWS Brasil
add('LBFF 5',2021,'Liga','Vivo Keyd')
add('LBFF 6',2021,'Liga','B4')
add('LBFF 7',2022,'Liga','LOUD')
add('LBFF 8',2022,'Liga','Vivo Keyd','','138 pts')
add('LBFF 2023',2023,'Liga','LOUD')
add('FFWS Brasil 2024 (2º split)',2024,'Liga','Fluxo','','','BOPS','Fluxo','Brasil')
H={'ff':{'nome':'Free Fire','main':'Mundial','tipos':{'Mundial':'Mundial (FFWS)','EWC':'Esports World Cup','Liga':'Brasil (LBFF/FFWS)'},'torneios':T}}
open('js/data/hist_ff.js','w').write('/* Histórico real de Free Fire, pesquisado na web (gerado por tools/gen_hist_ff.py). Sem rosters nem Bola de Ouro: line-ups não verificadas. */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T))
