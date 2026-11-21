# Gera js/data/hist_r6.js (Rainbow Six Siege). Rodar: python3 tools/gen_hist_r6.py
# Fontes: Wikipedia/Strafe/SiegeGG/Esports World Cup/Ubisoft. Line-ups só quando conferidas (a da época do título). MVPs: SiegeGG/EWC/Strafe.
import json
from collections import defaultdict
T=[]
def add(n,a,tp,c,v='',p='',mvp=None,mt='',pais='',r=None):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    if r: d['r']=r
    T.append(d)
# Six Invitational (mundial). 2017 teve duas edições (Xbox One e PC)
add('Six Invitational 2017 (Xbox One)',2017,'SI','Elevate','Team Vitality','2-0')
add('Six Invitational 2017 (PC)',2017,'SI','Continuum','eRa Eternity','2-0')
add('Six Invitational 2018',2018,'SI','PENTA Sports','Evil Geniuses','3-2','Pengu','PENTA Sports')
add('Six Invitational 2019',2019,'SI','G2 Esports','Team Empire','3-0','Kantoraketti','G2 Esports')
add('Six Invitational 2020',2020,'SI','Spacestation Gaming','Ninjas in Pyjamas','3-2','Rampy','Spacestation Gaming')
add('Six Invitational 2021',2021,'SI','Ninjas in Pyjamas','Team Liquid','3-2','Paluh','Team Liquid')
add('Six Invitational 2022',2022,'SI','TSM','Team Empire','3-1')
add('Six Invitational 2023',2023,'SI','G2 Esports','w7m esports','3-1','Benjamaster','G2 Esports','DK',['Doki','Blurr','Virtue','Alem4o','Benjamaster'])
add('Six Invitational 2024',2024,'SI','w7m esports','FaZe Clan','3-2','Kheyze','w7m esports','BR',['HerdsZ','FelipoX','Kheyze','Jv92','nade'])
add('Six Invitational 2025',2025,'SI','FaZe Clan','Team BDS','3-1','Handyy','FaZe Clan','BR')
add('Six Invitational 2026',2026,'SI','FaZe Clan','Team Secret','3-1','Handyy','FaZe Clan','BR')
# Esports World Cup
add('Esports World Cup 2024',2024,'EWC','Team BDS','w7m esports')
add('Esports World Cup 2025',2025,'EWC','Team Secret','G2 Esports','3-0','Adrian','Team Secret','PL')
add('Esports World Cup 2026',2026,'EWC','FaZe Clan','FURIA','3-1','Cyber','FaZe Clan')
# Six Majors (o de nov/2020 foi cancelado)
add('Six Major Paris 2018',2018,'Major','G2 Esports','Evil Geniuses','3-0')
add('Six Major Raleigh 2019',2019,'Major','Team Empire','G2 Esports','3-1')
add('Six Mexico Major 2021',2021,'Major','Team oNe eSports','Team Empire','3-2')
add('Six Sweden Major 2021',2021,'Major','FaZe Clan','Ninjas in Pyjamas','3-2')
add('Six Charlotte Major 2022',2022,'Major','DarkZero','Astralis','3-2')
add('Six Jönköping Major 2022',2022,'Major','Team BDS','Team Liquid','3-2')
add('Six Berlin Major 2022',2022,'Major','Rogue','FaZe Clan','3-2')
add('BLAST R6 Major Copenhagen 2023',2023,'Major','w7m esports','Team Liquid','3-0')
add('BLAST R6 Major Atlanta 2023',2023,'Major','w7m esports','LOS','3-1')
add('BLAST R6 Major Manchester 2024',2024,'Major','beastcoast','Team BDS','3-2')
add('BLAST R6 Major Montreal 2024',2024,'Major','w7m esports','Team BDS','3-1','Dodez','w7m esports','',['d4sh','Dodez','Dotz','L0BIN','volpz'])
add('BLAST R6 Major Munich 2025',2025,'Major','M80','Team Falcons')
add('BLAST R6 Major Salt Lake City 2026',2026,'Major','DarkZero')
add('RE:L0:AD Rio de Janeiro 2025',2025,'Outros','FURIA')
# ---- Bola de Ouro: pesos do BrasLOL (SI 10, MVP +2; Major 5, MVP +1,5; EWC 2,5, MVP +1,2). Só line-ups conferidas pontuam ----
PTS=[25,18,15,12,10,8,6,4,2,1]
W={'SI':10,'Major':5,'EWC':2.5}; WM={'SI':2,'Major':1.5,'EWC':1.2}
sc=defaultdict(lambda: defaultdict(lambda:[0.0,0,0]))
iso={}
for t in T:
    if t['tp'] not in W: continue
    y=t['a']
    for n in t.get('r',[]):
        e=sc[y][n]; e[0]+=W[t['tp']]; e[2]+=1
    if t.get('mvp') and t['mvp'][0] in t.get('r',[]):
        e=sc[y][t['mvp'][0]]; e[0]+=WM[t['tp']]; e[1]+=1
        if t['mvp'][2]: iso[t['mvp'][0]]=t['mvp'][2]
bo={}
for y,d in sc.items():
    rows=sorted(d.items(),key=lambda kv:(-kv[1][0],-kv[1][1],-kv[1][2],kv[0].lower()))[:10]
    bo[str(y)]=[[n,iso.get(n,''),PTS[i],round(v[0],1)] for i,(n,v) in enumerate(rows)]
H={'r6':{'nome':'Rainbow Six Siege','main':'SI','tipos':{'SI':'Six Invitational','Major':'Six Majors','EWC':'Esports World Cup','Outros':'Outros'},'torneios':T,'bo':bo,'boNota':'Pesos do BrasLOL (Six Invitational = Mundial 10 pts; Major 5; EWC 2,5; MVP +2 / +1,5 / +1,2). Só títulos com line-up da época conferida pontuam (SI 2023 e 2024 e Major Montreal 2024), por isso só 2023 e 2024 têm Top 10. Provisório.'}}
open('js/data/hist_r6.js','w').write('/* Histórico real de Rainbow Six Siege, pesquisado na web (gerado por tools/gen_hist_r6.py). */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T),{y:len(v) for y,v in bo.items()})
