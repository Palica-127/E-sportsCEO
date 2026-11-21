# Gera js/data/hist_wr.js (Wild Rift). Rodar: python3 tools/gen_hist_wr.py
# Fontes: Riot Wild Rift Esports, Yahoo/Upcomer/Dot Esports (Horizon Cup), esports.gg/Yahoo/AFK Gaming (Icons 2022), Yahoo/ABS-CBN (WRL Asia).
# O Wild Rift só teve dois torneios globais (Horizon Cup 2021 e Icons 2022); depois a Riot passou a ter só a WRL Asia.
import json
from collections import defaultdict
T=[]
def add(n,a,tp,c,v='',p='',mvp=None,mt='',pais='',r=None):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    if r: d['r']=r
    T.append(d)
add('Horizon Cup 2021',2021,'Horizon','Da Kun Gaming','ThunderTalk Gaming','4-2',r=['YK','Huiba','You','Wind','Emo'])
add('Icons Global Championship 2022',2022,'Icons','Nova Esports','J Team','4-0','Long','Nova Esports','CN',['Y1ze','Long','Nian','Remake','Yami'])
add('WRL Asia 2023 Season 1',2023,'WRL','KeepBest Gaming','Nigma Galaxy','4-0')
add('WRL Asia 2023 Season 2',2024,'WRL','KeepBest Gaming','G2 Blacklist','4-3')
PTS=[25,18,15,12,10,8,6,4,2,1]
W={'Icons':10,'Horizon':8}; WM={'Icons':2}
sc=defaultdict(lambda: defaultdict(lambda:[0.0,0,0]))
for t in T:
    if t['tp'] not in W: continue
    for n in t.get('r',[]):
        e=sc[t['a']][n]; e[0]+=W[t['tp']]; e[2]+=1
    if t.get('mvp') and t['mvp'][0] in t['r']:
        e=sc[t['a']][t['mvp'][0]]; e[0]+=WM[t['tp']]; e[1]+=1
bo={}
for y,d in sc.items():
    rows=sorted(d.items(),key=lambda kv:(-kv[1][0],-kv[1][1],-kv[1][2],kv[0].lower()))[:10]
    bo[str(y)]=[[n,'CN',PTS[i],round(v[0],1)] for i,(n,v) in enumerate(rows)]
H={'wr':{'nome':'Wild Rift','main':'Icons','tipos':{'Icons':'Icons (mundial)','Horizon':'Horizon Cup','WRL':'WRL Asia'},'torneios':T,'bo':bo,'boNome':'Golden Rift',
 'boNota':'Só há dois torneios globais (Horizon Cup 2021 e Icons 2022). Pontos: Icons 10 (MVP +2), Horizon Cup 8, por jogador de line-up conferida. 2023 e 2024 ficam sem Top 10: a WRL Asia é regional e as line-ups campeãs não foram conferidas. Provisório.'}}
open('js/data/hist_wr.js','w',encoding='utf8').write('/* Histórico real de Wild Rift, pesquisado na web (gerado por tools/gen_hist_wr.py). */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T),bo)
