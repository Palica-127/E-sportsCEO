# Gera js/data/hist_val.js (Valorant) a partir de dados pesquisados na web. Rodar: python3 tools/gen_hist_val.py
import json
T=[]
def add(n,a,tp,c,v,p='',mvp=None,mt='',pais='',r=None):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    if r: d['r']=r
    T.append(d)
# Champions (MVP 2022 omitido: fontes divergem; 2021-2023 MVPs eram escolhidos pela imprensa, 2024+ oficial)
add('Champions Berlin 2021',2021,'Champions','Acend','Gambit Esports','3-2','zeek','Acend','',['starxo','cNed','zeek','BONECOLD','Kiles'])
add('Champions Istanbul 2022',2022,'Champions','LOUD','OpTic Gaming','3-1','pANcada','LOUD','',r=['Sacy','saadhak','Less','pANcada','aspas'])
add('Champions Los Angeles 2023',2023,'Champions','Evil Geniuses','Paper Rex','3-1','Demon1','Evil Geniuses','',['Demon1','jawgemo','Boostio','C0M','Ethan'])
add('Champions Seoul 2024',2024,'Champions','EDward Gaming','Team Heretics','3-2','ZmjjKK','EDward Gaming','China',['ZmjjKK','CHICHOO','Smoggy','S1Mon','nobody'])
add('Champions Paris 2025',2025,'Champions','NRG','Fnatic','3-2','brawk','NRG','EUA',['brawk','Ethan','skuba','mada','s0m'])
add('Champions Shanghai 2026',2026,'Champions','LOUD','Team Vitality','3-1','erde','LOUD','',['erde','tkzin','DaviH','Darker','lukxo'])
# Masters (MVPs só quando as fontes concordam; MVP de Masters nunca foi oficial)
M=[('Masters Reykjavík 2021',2021,'Sentinels','Fnatic','3-0','TenZ','Sentinels',['ShahZaM','SicK','zombs','dapr','TenZ']),
('Masters Berlin 2021',2021,'Gambit Esports','Team Envy','3-0',None,'',['d3ffo','Chronicle','nAts','Redgar','Sheydos']),
('Masters Reykjavík 2022',2022,'OpTic Gaming','LOUD','3-0','yay','OpTic Gaming',['FNS','Victor','crashies','yay','Marved']),
('Masters Copenhagen 2022',2022,'FunPlus Phoenix','Paper Rex','3-2',None,'',['ANGE1','Shao','Zyppan','SUYGETSU','ardiis']),
('LOCK//IN São Paulo 2023',2023,'Fnatic','LOUD','3-2',None,'',['Boaster','Derke','Alfajer','Leo','Chronicle']),
('Masters Tokyo 2023',2023,'Fnatic','Evil Geniuses','3-0',None,'',['Boaster','Derke','Alfajer','Leo','Chronicle']),
('Masters Madrid 2024',2024,'Sentinels','Gen.G','3-2','zekken','Sentinels',['TenZ','Sacy','zekken','Zellsis','johnqt']),
('Masters Shanghai 2024',2024,'Gen.G','Team Heretics','3-2','t3xture','Gen.G',['Meteor','t3xture','Lakia','Munchkin','Karon']),
('Masters Bangkok 2025',2025,'T1','G2 Esports','3-2','Meteor','T1',['carpe','iZu','stax','Sylvan','Meteor']),
('Masters Toronto 2025',2025,'Paper Rex','Fnatic','3-1','f0rsakeN','Paper Rex',['d4v41','f0rsakeN','something','Jinggg','PatMen']),
('Masters Santiago 2026',2026,'Nongshim RedForce','Paper Rex','3-0','Dambi','Nongshim RedForce',['Xross','Rb','Francis','Dambi','Ivy']),
('Masters London 2026',2026,'Leviatán','Paper Rex','3-2','Neon','Leviatán',['kiNgg','Sato','blowz','Neon','spikeziN'])]
for n,a,c,v,p,mv,mt,r in M: add(n,a,'Masters',c,v,p,mv,mt,'',r)
add('Esports World Cup 2025',2025,'EWC','Team Heretics','Fnatic','3-2')
add('Esports World Cup 2026',2026,'EWC','100 Thieves','NRG','3-1')
# Ligas internacionais (campeões de cada região)
L=[(2023,'Americas','LOUD'),(2023,'EMEA','Team Liquid'),(2023,'Pacific','Paper Rex'),
(2024,'Kickoff Americas','Sentinels'),(2024,'Kickoff EMEA','Karmine Corp'),(2024,'Kickoff Pacific','Gen.G'),(2024,'Kickoff China','EDward Gaming'),
(2024,'Stage 1 Americas','100 Thieves'),(2024,'Stage 1 EMEA','Fnatic'),(2024,'Stage 1 Pacific','Paper Rex'),(2024,'Stage 1 China','EDward Gaming'),
(2024,'Stage 2 Americas','Leviatán'),(2024,'Stage 2 EMEA','Fnatic'),(2024,'Stage 2 Pacific','Gen.G'),(2024,'Stage 2 China','EDward Gaming'),
(2025,'Kickoff Americas','G2 Esports'),(2025,'Kickoff EMEA','Team Vitality'),(2025,'Kickoff Pacific','DRX'),(2025,'Kickoff China','EDward Gaming'),
(2025,'Stage 1 EMEA','Fnatic'),(2025,'Stage 1 Pacific','Paper Rex'),
(2025,'Stage 2 EMEA','Team Liquid'),(2025,'Stage 2 Pacific','Paper Rex'),(2025,'Stage 2 China','Bilibili Gaming')]
for a,k,c in L: add(f'VCT {a} {k}' if a!=2023 else f'VCT 2023 {k}',a,'Liga',c,'')

# ---- Bola de Ouro (mesma lógica do BrasLOL: bônus por título/MVP; sem nota de desempenho por jogador, então só pesos de títulos) ----
# Pesos do BrasLOL: Mundial C 10 / MSI C 5 / MVP Mundial 2 / MVP MSI 1.5 / ligas 3 por título. Aqui: Champions=Mundial, Masters=MSI.
# Limitações: line-ups de vice e de campeões de liga não foram levantadas, então só campeões de Champions/Masters pontuam;
# empates são desfeitos por MVPs, depois nº de títulos, depois ordem alfabética (arbitrário).
PTS=[25,18,15,12,10,8,6,4,2,1]
W={'Champions':10,'Masters':5}; WM={'Champions':2,'Masters':1.5}
from collections import defaultdict
sc=defaultdict(lambda: defaultdict(lambda:[0.0,0,0]))  # ano -> nick -> [pts, mvps, titulos]
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
H={'valorant':{'nome':'Valorant','main':'Champions','tipos':{'Champions':'Champions','Masters':'Masters','EWC':'Esports World Cup','Liga':'Ligas VCT'},'torneios':T,'bo':bo,'boNota':'Mesma lógica do BrasLOL (Champions = Mundial, Masters = MSI): 10 pts por Champions, 5 por Masters, MVP +2 / +1,5. Sem nota de desempenho por jogador e sem line-ups de vices/ligas, então só campeões pontuam; empates por MVP, títulos e ordem alfabética. Provisório.'}}
open('js/data/hist_val.js','w').write('/* Histórico real de Valorant, pesquisado na web (gerado por tools/gen_hist_val.py). MVP de Masters não é oficial: só entram os que as fontes confirmam. Sem Bola de Ouro: a Riot não tem ranking anual oficial. */\nwindow.HIST = Object.assign(window.HIST || {}, '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+');\n')
print(len(T))
