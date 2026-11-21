# Gera js/data/hist_dota.js (Dota 2). Rodar: python3 tools/gen_hist_dota.py
# Fontes: esports.gg (TIs/rosters), Strafe (Majors e grandes eventos), Esports World Cup, GosuGamers, DotEsports. MVP de TI não é oficial: não incluído.
import json
from collections import defaultdict
T=[]
def add(n,a,tp,c,v='',p='',mvp=None,mt='',pais='',r=None):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    if r: d['r']=r
    T.append(d)
# The International (rosters de jogadores, sem coaches)
add('The International 2011',2011,'TI','Natus Vincere','EHOME',r=['Artstyle','Dendi','XBOCT','Puppey','LightofHeaven'])
add('The International 2012',2012,'TI','Invictus Gaming','Natus Vincere',r=['Zhou','Ferrari_430','YYF','ChuaN','Faith'])
add('The International 2013',2013,'TI','Alliance','Natus Vincere',r=['Loda','s4','AdmiralBulldog','EGM','Akke'])
add('The International 2014',2014,'TI','Newbee','ViCi Gaming',r=['Hao','Mu','xiao8','Banana','SanSheng'])
add('The International 2015',2015,'TI','Evil Geniuses','CDEC',r=['Fear','SumaiL','UNiVeRsE','Aui_2000','ppd'])
add('The International 2016',2016,'TI','Wings Gaming','Digital Chaos',r=['shadow','bLink','Faith_bian',"y'",'iceice'])
add('The International 2017',2017,'TI','Team Liquid','Newbee','3-0',r=['MATUMBAMAN','Miracle-','MinD_ContRoL','GH','KuroKy'])
add('The International 2018',2018,'TI','OG','PSG.LGD','3-2',r=['ana','Topson','Ceb','JerAx','N0tail'])
add('The International 2019',2019,'TI','OG','',r=['ana','Topson','Ceb','JerAx','N0tail'])
add('The International 2021',2021,'TI','Team Spirit','PSG.LGD',r=['Yatoro','TORONTOTOKYO','Collapse','Mira','Miposhka'])
add('The International 2022',2022,'TI','Tundra Esports','Team Secret',r=['skiter','Nine','33','Saksa','Sneyking'])
add('The International 2023',2023,'TI','Team Spirit','Gaimin Gladiators','3-0',r=['Yatoro','Larl','Collapse','Mira','Miposhka'])
add('The International 2024',2024,'TI','Team Liquid','Gaimin Gladiators','3-0',r=['miCKe','Nisha','33','Boxi','Insania'])
add('The International 2025 Hamburgo',2025,'TI','Team Falcons','Xtreme Gaming','3-2',r=['skiter','Malr1ne','ATF','Cr1t-','Sneyking'])
add('The International 2026 Xangai',2026,'TI','Team Spirit','PARIVISION','3-2',r=['Yatoro','Larl','Collapse','not_me','rue'])
# Riyadh Masters / Esports World Cup
add('Riyadh Masters 2022',2022,'EWC','PSG.LGD','Team Spirit','2-0','Faith_bian','PSG.LGD')
add('Riyadh Masters 2023',2023,'EWC','Team Spirit','Team Liquid')
add('Riyadh Masters 2024 (EWC)',2024,'EWC','Gaimin Gladiators','Team Liquid','3-0','Quinn','Gaimin Gladiators','EUA',['dyrachyo','Quinn','Ace','tOfu','Seleri'])
add('Esports World Cup 2025',2025,'EWC','Team Spirit','Team Falcons','3-0','Collapse','Team Spirit')
add('Esports World Cup 2026',2026,'EWC','PARIVISION','BetBoom Team','3-1','Noticed','PARIVISION')
# Majors e grandes eventos ligados à Valve/ESL (Strafe); sem rosters
M=[(2015,'The Frankfurt Major 2015','OG','Team Secret'),(2016,'The Shanghai Major 2016','Team Secret','Team Liquid'),(2016,'The Manila Major 2016','OG','Team Liquid'),(2016,'The Boston Major 2016','OG','Ad Finem'),
(2017,'The Kiev Major 2017','OG','Virtus.pro'),(2017,'ESL One Hamburg 2017','Virtus.pro','Team Secret'),(2017,'DreamLeague Season 8','Team Secret','Team Liquid'),
(2018,'ESL One Katowice 2018','Virtus.pro','Vici Gaming'),(2018,'The Bucharest Major','Virtus.pro','VGJ.Thunder'),(2018,'Dota 2 Asia Championships 2018','Mineski','PSG.LGD'),(2018,'EPICENTER XL','PSG.LGD','Team Liquid'),(2018,'MDL Changsha Major','PSG.LGD','VGJ.Storm'),(2018,'ESL One Birmingham 2018','Virtus.pro','OpTic Gaming'),(2018,'China Dota2 Supermajor','Team Liquid','Virtus.pro'),(2018,'The Kuala Lumpur Major','Virtus.pro','Team Secret'),
(2019,'The Chongqing Major','Team Secret','Virtus.pro'),(2019,'DreamLeague Season 11','Vici Gaming','Virtus.pro'),(2019,'MDL Disneyland Paris Major','Team Secret','Team Liquid'),(2019,'EPICENTER Major 2019','Vici Gaming','Team Liquid'),(2019,'MDL Chengdu Major','TNC Predator','Vici Gaming'),
(2020,'DreamLeague Season 13','Team Secret','Evil Geniuses'),(2020,'ESL One Germany 2020','Team Liquid','Natus Vincere'),
(2021,'ONE Esports Singapore Major 2021','Invictus Gaming','Evil Geniuses'),(2021,'WePlay AniMajor','PSG.LGD','Evil Geniuses'),(2021,'ESL One Summer 2021','T1','Virtus.pro'),(2021,'ESL One Fall 2021','Tundra Esports','PSG.LGD'),
(2022,'ESL One Stockholm Major 2022','OG','Team SoloMid'),(2022,'PGL Arlington Major 2022','Team Spirit','PSG.LGD'),(2022,'ESL One Malaysia 2022','OG','Team Aster'),
(2023,'The Lima Major 2023','Gaimin Gladiators','Team Liquid'),(2023,'DreamLeague Season 19','Gaimin Gladiators','Team Liquid'),(2023,'ESL One Berlin Major 2023','Gaimin Gladiators','Team Liquid'),(2023,'DreamLeague Season 20','Gaimin Gladiators','BetBoom Team'),(2023,'The Bali Major 2023','Gaimin Gladiators','Team Liquid'),(2023,'DreamLeague Season 21','Team Spirit','Shopify Rebellion'),(2023,'ESL One Kuala Lumpur 2023','Azure Ray','Gaimin Gladiators'),
(2024,'DreamLeague Season 22','Team Falcons','BetBoom Team'),(2024,'ESL One Birmingham 2024','Team Falcons','BetBoom Team'),(2024,'PGL Wallachia Season 1','Team Spirit','Xtreme Gaming'),(2024,'DreamLeague Season 23','Team Falcons','Gaimin Gladiators'),(2024,'DreamLeague Season 24','Team Falcons','BetBoom Team'),(2024,'BLAST Slam I','BetBoom Team','Tundra Esports'),(2024,'ESL One Bangkok 2024','PARIVISION','Team Falcons'),
(2025,'BLAST Slam II','Tundra Esports','Gaimin Gladiators'),(2025,'DreamLeague Season 25','Team Spirit','Tundra Esports'),(2025,'PGL Wallachia Season 3','Team Liquid','Tundra Esports'),(2025,'ESL One Raleigh 2025','PARIVISION','Team Spirit'),(2025,'PGL Wallachia Season 4','Team Liquid','PARIVISION'),(2025,'BLAST Slam III','Tundra Esports','Team Falcons'),(2025,'DreamLeague Season 26','PARIVISION','BetBoom Team'),(2025,'PGL Wallachia Season 5','BetBoom Team','Gaimin Gladiators'),(2025,'BLAST Slam IV','Tundra Esports','Team Falcons'),(2025,'PGL Wallachia Season 6','MOUZ','Team Spirit'),(2025,'BLAST Slam V','Tundra Esports','Team Yandex'),(2025,'DreamLeague Season 27','Team Yandex','Team Spirit'),
(2026,'BLAST Slam VI','Team Liquid','Natus Vincere'),(2026,'DreamLeague Season 28','Tundra Esports','Aurora Gaming'),(2026,'PGL Wallachia Season 7','Team Yandex','Team Liquid'),(2026,'ESL One Birmingham 2026','Tundra Esports','Team Yandex'),(2026,'PGL Wallachia Season 8','BetBoom Team','Aurora Gaming'),(2026,'DreamLeague Season 29','PARIVISION','Aurora Gaming'),(2026,'BLAST Slam VII','Team Yandex','LGD Gaming')]
for a,n,c,v in M: add(n,a,'Major',c,v)
# ---- Bola de Ouro: pesos do BrasLOL (TI = Mundial 10; EWC 2,5, MVP +1,2). Majors sem rosters não pontuam. Sem MVP oficial de TI ----
PTS=[25,18,15,12,10,8,6,4,2,1]
W={'TI':10,'EWC':2.5}; WM={'TI':2,'EWC':1.2}
sc=defaultdict(lambda: defaultdict(lambda:[0.0,0,0]))
for t in T:
    if t['tp'] not in W: continue
    y=t['a']
    for n in t.get('r',[]):
        e=sc[y][n]; e[0]+=W[t['tp']]; e[2]+=1
    if t.get('mvp'):
        e=sc[y][t['mvp'][0]]; e[0]+=WM[t['tp']]; e[1]+=1
bo={}
for y,d in sc.items():
    rows=sorted(d.items(),key=lambda kv:(-kv[1][0],-kv[1][1],-kv[1][2],kv[0].lower()))[:10]
    bo[str(y)]=[[n,'',PTS[i],round(v[0],1)] for i,(n,v) in enumerate(rows)]
H={'dota2':{'nome':'Dota 2','main':'TI','tipos':{'TI':'The International','EWC':'Riyadh Masters / EWC','Major':'Majors e Tier 1'},'torneios':T,'bo':bo,'boNota':'Pesos do BrasLOL (TI = Mundial 10 pts; Riyadh/EWC 2,5; MVP de EWC +1,2). Não há MVP oficial de TI e os Majors não têm line-ups levantadas, então só campeões de TI e do Riyadh/EWC com line-up verificada pontuam; empates por MVP, títulos e ordem alfabética. Provisório.'}}
open('js/data/hist_dota.js','w').write('/* Histórico real de Dota 2, pesquisado na web (gerado por tools/gen_hist_dota.py). */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T))
