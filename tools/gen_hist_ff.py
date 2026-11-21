# Gera js/data/hist_ff.js (Free Fire). Rodar: python3 tools/gen_hist_ff.py
# Só dados confirmados em fontes (Wikipedia FFWS, Sportskeeda, Esports World Cup, Free Fire Mania, Folha Vitória). Sem rosters (não verificados).
import json
T=[]
def add(n,a,tp,c,v='',p='',mvp=None,mt='',pais='',r=None):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    if r: d['r']=r
    T.append(d)
# Mundiais
add('Free Fire World Cup 2019 Bangkok',2019,'Mundial','EVOS Esports',mvp='Kronos',mt='EVOS Esports',pais='Brasil')
add('FFWS 2019 Rio de Janeiro',2019,'Mundial','Corinthians','Sbornaya ChR','132–98','Nobru','Corinthians','Brasil',['Japa','Fixa','Pires','LevelUp','Nobru'])
add('FFWS 2021 Singapura',2021,'Mundial','Phoenix Force','LOUD','113–77','TheCruz','Phoenix Force','Tailândia',['Lukz','Zeenon','Rambo','TheCruz','Joena','Olong'])
add('FFWS 2022 Sentosa',2022,'Mundial','Attack All Around','EVOS Phoenix','92–91','JLX','Attack All Around','Tailândia',['Hoysang','JLX','Keroro','Folkky','Pookeiei'])
add('FFWS 2022 Bangkok',2022,'Mundial','EVOS Phoenix','Vivo Keyd Stats','117–114','Moshi','EVOS Phoenix','Tailândia',['Already','GetHigh','Joena','Moshi','DLong'])
add('FFWS 2023 Bangkok',2023,'Mundial','Magic Squad','Buriram United Esports','112–95','DEW','EXP Esports','Tailândia',['Bops','Giuh','Butzin','MT7'])
add('FFWS 2024 Rio de Janeiro',2024,'Mundial','Fluxo','RRQ Kazu','86–83','Wassana','Buriram United Esports','Tailândia',['Bops','Giuh','Butzin','MT7'])
add('FFWS 2025 Jacarta',2025,'Mundial','Buriram United Esports','Fluxo','103–102','Wassana','Buriram United Esports','Tailândia',['GetHigh','Wassana','Joena','Moshi','TheCruz'])
# Esports World Cup
add('Esports World Cup 2024',2024,'EWC','Team Falcons')
add('Esports World Cup 2025',2025,'EWC','EVOS Divine','','170 pts','Rasyah','EVOS Divine','Indonésia',['Rasyah','AimGOD','Reyyy','Koceel'])
add('Esports World Cup 2026',2026,'EWC','LYON','','','Gamezking','LYON','',['Gamezking','Haaxsz','Della','Joacozd'])
# Liga Brasileira (LBFF) e FFWS Brasil
add('LBFF 3',2020,'Liga','SS Esports')
add('LBFF 4',2021,'Liga','Fluxo','LOUD','103 pts',r=['Nobru','Japa','Syaz','Fac','Godkill'])
add('LBFF 5',2021,'Liga','Vivo Keyd')
add('LBFF 6',2021,'Liga','B4')
add('LBFF 7',2022,'Liga','LOUD')
add('LBFF 8',2022,'Liga','Vivo Keyd','','138 pts')
add('LBFF 2023',2023,'Liga','LOUD')
add('FFWS Brasil 2024 (2º split)',2024,'Liga','Fluxo','','','Bops','Fluxo','Brasil',['Bops','Giuh','Butzin','MT7'])

# ---- Bola de Ouro (pesos do BrasLOL; sem nota de desempenho por jogador) ----
# Mundial=10 (MVP +2), EWC=2.5 (MVP +1,2), Liga=3 (MVP +1). Só campeões com line-up verificada pontuam. 2026 fica de fora (Mundial em andamento).
PTS=[25,18,15,12,10,8,6,4,2,1]
W={'Mundial':10,'EWC':2.5,'Liga':3}; WM={'Mundial':2,'EWC':1.2,'Liga':1}
ISO={n:'BR' for n in ['Nobru','Japa','Fixa','Pires','LevelUp','Bops','Giuh','Butzin','MT7','Kronos','Syaz','Fac','Godkill']}
ISO.update({n:'ID' for n in ['Rasyah','AimGOD','Reyyy','Koceel']}); ISO.update({n:'TH' for n in ['Wassana','Moshi','Joena','TheCruz','GetHigh','JLX','DEW']})
from collections import defaultdict
sc=defaultdict(lambda: defaultdict(lambda:[0.0,0,0]))
for t in T:
    y=t['a']
    if y>=2026: continue
    for n in t.get('r',[]):
        e=sc[y][n]; e[0]+=W[t['tp']]; e[2]+=1
    if t.get('mvp'):
        e=sc[y][t['mvp'][0]]; e[0]+=WM[t['tp']]; e[1]+=1
canon={}
bo={}
for y,d in sc.items():
    rows=sorted(d.items(),key=lambda kv:(-kv[1][0],-kv[1][1],-kv[1][2],kv[0].lower()))[:10]
    bo[str(y)]=[[n,ISO.get(n,''),PTS[i],round(v[0],1)] for i,(n,v) in enumerate(rows)]
H={'ff':{'nome':'Free Fire','main':'Mundial','tipos':{'Mundial':'Mundial (FFWS)','EWC':'Esports World Cup','Liga':'Brasil (LBFF/FFWS)'},'torneios':T,'bo':bo,'boNota':'Pesos do BrasLOL (Mundial = 10 pts, EWC = 2,5, ligas = 3; MVP +2 / +1,2 / +1). Sem nota de desempenho por jogador: só campeões com line-up verificada pontuam; empates por MVP, títulos e ordem alfabética. 2026 ainda não entra (Mundial em andamento). Provisório.'}}
open('js/data/hist_ff.js','w').write('/* Histórico real de Free Fire, pesquisado na web (gerado por tools/gen_hist_ff.py). Rosters só dos campeões com line-up verificada. Bola de Ouro provisória. */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T))
