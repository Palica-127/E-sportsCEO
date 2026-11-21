# Gera js/data/hist_fifa.js (EA FC / FIFA). Rodar: python3 tools/gen_hist_fifa.py
# Fontes: FIFA.com/inside.fifa.com, fifa.gg, EA (FC Pro), Esports World Cup, Wikipedia (FIFAe World Cup). Só títulos mundiais com resultado conferido.
# Edições de 2020 e 2021 do Mundial foram canceladas (COVID); 2021 do eClub foi regional (6 zonas) e não entra.
import json
from collections import defaultdict
T=[]
def add(n,a,tp,c,v='',p='',r=None):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if r: d['r']=r
    T.append(d)
# Mundial individual (FIWC -> FIFA eWorld Cup -> FIFAe World Cup -> FC Pro World Championship)
M=[(2004,'Thiago Carrico de Azevedo','Matija Biljeskovic','2-1','BR'),(2005,'Chris Bullard','','','GB'),(2006,'Andries Smit','','','NL'),
   (2008,'Alfonso Ramos','','','ES'),(2009,'Bruce Grannec','','','FR'),(2010,'Nenad Stojkovic','Ayhan Altundag','','US'),(2011,'Francisco Cruz','','','PT'),
   (2012,'Alfonso Ramos','Bruce Grannec','pênaltis','ES'),(2013,'Bruce Grannec','','','FR'),(2014,'August Rosenmeier','','','DK'),(2015,'Abdulaziz Alshehri','','','SA'),
   (2016,'Mohamad Al-Bacha','Sean Allen','','DK'),(2017,'Gorilla (Spencer Ealing)','Deto (Kai Wollin)','7-3 agg.','GB'),(2018,'Msdossary','StefanoPinna','4-0 agg.','SA'),
   (2019,'MoAuba','Msdossary','3-2 agg.','DE'),(2022,'Umut','nicolas99fc','0-0, 0-0 (5-4 pên.)',''),(2023,'ManuBachoore','Mark11','3-3 agg. (5-4 pên.)','NL'),
   (2024,'Vejrgang','YuvalBeli','7-0','DK'),(2025,'ManuBachoore','Brice','5-3','NL'),(2026,'RVPLegend','LevyFinn','','RO')]
NOMES={2004:'FIFA Interactive World Cup 2004',2018:'FIFA eWorld Cup 2018',2019:'FIFA eWorld Cup 2019',2022:'FIFAe World Cup 2022',2023:'FIFAe World Cup 2023',
       2024:'FC Pro World Championship 2024',2025:'FC Pro World Championship 2025 (Esports World Cup)',2026:'FC Pro World Championship 2026 (Esports World Cup)'}
iso={}
for y,c,v,p,i in M:
    add(NOMES.get(y,f'FIFA Interactive World Cup {y}' if y<2018 else ''),y,'Mundial',c,v,p,[c])
    if i: iso[c]=i
# Esports World Cup (evento próprio de EA FC 24)
add('Esports World Cup 2024 (EA FC 24)',2024,'EWC','jafonso','Young','6-2',['jafonso']); iso['jafonso']='PT'
# Clubes (2v2 a partir de 2018)
add('FIFA eClub World Cup 2017',2017,'Clubes','Brøndby IF','Olympique Lyonnais','',['Marcuzo'])
add('FIFA eClub World Cup 2018',2018,'Clubes','Brøndby IF','Team Envy','',['Fredberg','Ustun'])
add('FIFA eClub World Cup 2019',2019,'Clubes','KiNG eSports','Dijon FCO','',['Tekkz','Nicolas99fc']); iso['Nicolas99fc']='AR'
add('FIFA eClub World Cup 2020',2020,'Clubes','Complexity','Ellevens','',['Joksan','MaXe']); iso['Joksan']='MX'
add('FIFAe Club World Cup 2022',2022,'Clubes','Riders','','',['AndoniiPM','Tuga810']); iso['Tuga810']='PT'
add('FIFAe Club World Cup 2023',2023,'Clubes','RBLZ Gaming – RB Leipzig','Team FUTWIZ Europe','',['Umut','Vejrgang'])
# Nações (line-up de 2019 da França não conferida)
add('FIFA eNations Cup 2019',2019,'Nações','França')
add('FIFAe Nations Cup 2022',2022,'Nações','Brasil','Polônia','',['PHzin','Crepaldi','Klinger'])
add('FIFAe Nations Cup 2023',2023,'Nações','Brasil','Países Baixos','3-2',['Paulo Henrique Chaves','Pedro Henrique Soares','Paulo Neto'])
for n in ['PHzin','Crepaldi','Klinger','Paulo Henrique Chaves','Pedro Henrique Soares','Paulo Neto']: iso[n]='BR'
iso['Vejrgang']='DK'
for t in T:
    if not t['n']: t['n']=f"FIFA Interactive World Cup {t['a']}"
# Prêmio individual (Ballon d'Or): pontos por títulos mundiais verificados
PTS=[25,18,15,12,10,8,6,4,2,1]
W={'Mundial':10,'EWC':5,'Clubes':4,'Nações':3}
sc=defaultdict(lambda: defaultdict(lambda:[0.0,0,0]))
for t in T:
    for n in t.get('r',[]):
        e=sc[t['a']][n]; e[0]+=W[t['tp']]; e[2]+=1
        if t['tp']=='Mundial': e[1]+=1
bo={}
for y,d in sc.items():
    rows=sorted(d.items(),key=lambda kv:(-kv[1][0],-kv[1][1],-kv[1][2],kv[0].lower()))[:10]
    bo[str(y)]=[[n,iso.get(n,''),PTS[i],round(v[0],1)] for i,(n,v) in enumerate(rows)]
H={'fifa':{'nome':'EA FC / FIFA','main':'Mundial','tipos':{'Mundial':'Mundial individual','EWC':'Esports World Cup','Clubes':'eClub World Cup','Nações':'Nations Cup'},'torneios':T,'bo':bo,'boNome':"Ballon d'Or",
 'boNota':"Pontos por títulos mundiais conferidos (Mundial individual 10, Esports World Cup 5, eClub World Cup 4 por jogador, Nations Cup 3 por jogador; desempate: títulos mundiais, depois ordem alfabética, que é arbitrária). Não há ranking oficial. 2020 e 2021 não tiveram Mundial. Provisório."}}
open('js/data/hist_fifa.js','w',encoding='utf8').write('/* Histórico real de EA FC/FIFA, pesquisado na web (gerado por tools/gen_hist_fifa.py). */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T),{y:len(v) for y,v in bo.items()})
