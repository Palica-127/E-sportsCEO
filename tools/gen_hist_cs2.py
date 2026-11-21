# Gera js/data/hist.js (CS2) a partir de dados pesquisados na web. Rodar: python3 tools/gen_hist_cs2.py
import json,re
R={'DreamHack Winter 2013':['pronax','JW','flusha','KRIMZ','schneider'],
'ESL One Katowice 2014':['TaZ','NEO','pashaBiceps','Snax','byali'],
'ESL One Katowice 2015':['olofmeister','flusha','JW','KRIMZ','pronax'],
'ESL One Cologne 2015':['olofmeister','flusha','JW','KRIMZ','pronax'],
'DreamHack Cluj-Napoca 2015':['Happy','NBK-','kioShiMa','kennyS','apEX'],
'MLG Columbus 2016':['FalleN','fer','coldzera','fnx','TACO'],
'ESL One Cologne 2016':['FalleN','fer','coldzera','fnx','TACO'],
'ELEAGUE Atlanta 2017':['device','dupreeh','Xyp9x','Kjaerbye','gla1ve'],
'PGL Kraków 2017':['Zeus','AdreN','Dosia','HObbit','mou'],
'ELEAGUE Boston 2018':['Skadoodle','Stewie2K','AutimatiC','RUSH','tarik'],
'FACEIT London 2018':['device','dupreeh','Xyp9x','Magisk','gla1ve'],
'IEM Katowice 2019':['device','dupreeh','Xyp9x','Magisk','gla1ve'],
'StarLadder Berlin 2019':['device','dupreeh','Xyp9x','Magisk','gla1ve'],
'PGL Stockholm 2021':['s1mple','electroNic','Perfecto','b1t','Boombl4'],
'PGL Antwerp 2022':['karrigan','rain','Twistzz','ropz','broky'],
'IEM Rio 2022':['Jame','qikert','FL1T','n0rb3r7','fame'],
'BLAST.tv Paris 2023':['apEX','ZywOo','Magisk','dupreeh','Spinx'],
'PGL Copenhagen 2024':['jL','iM','b1t','w0nderful','Aleksib'],
'Perfect World Shanghai 2024':['donk','sh1ro','magixx','zont1x','chopper'],
'BLAST.tv Austin 2025':['apEX','ZywOo','flameZ','mezii','ropz'],
'StarLadder Budapest 2025':['apEX','ZywOo','flameZ','mezii','ropz']}
T=[]
def add(n,a,tp,c,v,p='',mvp=None,mt='',pais=''):
    d={'n':n,'a':a,'tp':tp,'c':c,'v':v,'p':p}
    if mvp: d['mvp']=[mvp,mt,pais]
    if n in R: d['r']=R[n]
    T.append(d)
old=open('/tmp/hist_old.js').read()
for m in re.finditer(r"\{ n: '([^']+)', a: (\d+), c: '([^']+)', v: '([^']+)', p: '([^']+)', mvp: \['([^']+)', '([^']+)', '([^']+)'\] \}",old):
    n,a,c,v,p,mv,mt,pa=m.groups(); add(n,int(a),'Major',c,v,p,mv,mt,pa)
assert len(T)==24,len(T)
for a,c,v,p,mv,mt in [(2016,'Fnatic','Luminosity','','',''),(2017,'Astralis','','','',''),(2018,'Fnatic','','','',''),(2020,'NAVI','G2 Esports','3-0','',''),(2021,'Gambit','','','',''),(2022,'FaZe Clan','','','',''),(2023,'G2 Esports','','','huNter-','G2 Esports'),(2024,'Spirit','FaZe Clan','3-0','',''),(2025,'Vitality','Spirit','3-0','','')]:
    add(f'IEM Katowice {a}',a,'IEM',c,v,p,mv or None,mt)
add('IEM Kraków 2026',2026,'IEM','Vitality','')
for a,c,v in [(2017,'SK Gaming','Cloud9'),(2018,'NAVI',''),(2019,'Team Liquid',''),(2021,'NAVI',''),(2022,'FaZe Clan','NAVI'),(2023,'G2 Esports',''),(2024,'Vitality',''),(2025,'Spirit','')]:
    add(f'IEM Cologne {a}',a,'IEM',c,v)
epl=[('Fnatic','Cloud9','3-1'),('Fnatic','NAVI','3-2'),('Luminosity','G2 Esports','3-2'),('Cloud9','SK Gaming','2-1'),('G2 Esports','North','3-1'),('SK Gaming','FaZe Clan','3-1'),('Astralis','Team Liquid','3-1'),('Astralis','Team Liquid','3-1'),('Team Liquid','G2 Esports','3-1'),('mousesports','Fnatic','3-0'),('Fnatic','mousesports','3-2'),('Astralis','NAVI','3-2'),('Heroic','Gambit','3-2'),('NAVI','Vitality','3-2'),('FaZe Clan','ENCE','3-1'),('Vitality','Team Liquid','3-2'),('FaZe Clan','Cloud9','3-1'),('MOUZ','NAVI','3-0'),('MOUZ','Vitality','3-0'),('NAVI','Eternal Fire','3-2'),('Vitality','MOUZ','3-0'),('Vitality','Team Falcons','3-0'),('NAVI','Aurora','3-1')]
for i,(c,v,p) in enumerate(epl):
    s=i+1; y=2015+(s-1)//2
    mv=('jL','NAVI','Lituânia') if s==20 else (('ZywOo','Vitality','França') if s in (21,22) else None)
    add(f'ESL Pro League Season {s}',y,'EPL',c,v,p,*(mv if mv else (None,)))
B=[('BLAST Premier Spring Final 2020 (Europa)',2020,'Complexity','Vitality','','ZywOo','Vitality'),('BLAST Premier Fall Final 2020',2020,'Vitality','Astralis','','ZywOo','Vitality'),('BLAST Premier Global Final 2020',2021,'NAVI','Astralis','','s1mple','NAVI'),('BLAST Premier Spring Final 2021',2021,'Gambit','NAVI','','HObbit','Gambit'),('BLAST Premier Fall Final 2021',2021,'NAVI','Vitality','','s1mple','NAVI'),('BLAST Premier World Final 2021',2021,'NAVI','Gambit','2-1','s1mple','NAVI'),('BLAST Premier Spring Final 2022',2022,'NAVI','Vitality','','s1mple','NAVI'),('BLAST Premier Fall Final 2022',2022,'Heroic','FaZe Clan','','broky','FaZe Clan'),('BLAST Premier World Final 2022',2022,'G2 Esports','Team Liquid','','m0NESY','G2 Esports'),('BLAST Premier Spring Final 2023',2023,'Heroic','Vitality','','cadiaN','Heroic'),('BLAST Premier Fall Final 2023',2023,'Vitality','FaZe Clan','','ZywOo','Vitality'),('BLAST Premier World Final 2023',2023,'Vitality','FaZe Clan','2-0','ZywOo','Vitality'),('BLAST Premier Spring Final 2024',2024,'Spirit','NAVI','','donk','Spirit'),('BLAST Premier Fall Final 2024',2024,'G2 Esports','NAVI','','m0NESY','G2 Esports'),('BLAST Premier World Final 2024',2024,'G2 Esports','Spirit','','m0NESY','G2 Esports'),('BLAST Bounty 2025 Season 1',2025,'Spirit','Eternal Fire','','donk','Spirit'),('BLAST Open Lisbon 2025',2025,'Vitality','MOUZ','','ZywOo','Vitality'),('BLAST Rivals 2025 Season 1',2025,'Vitality','Team Falcons','','ZywOo','Vitality'),('BLAST Bounty 2025 Season 2',2025,'Spirit','The MongolZ','','donk','Spirit'),('BLAST Open London 2025',2025,'G2 Esports','Vitality','','HeavyGod','G2 Esports'),('BLAST Rivals 2025 Season 2',2025,'FURIA','Team Falcons','','m0NESY','Team Falcons'),('BLAST Bounty 2026 Season 1',2026,'PARIVISION','Team Falcons','','NiKo','PARIVISION'),('BLAST Open Rotterdam 2026',2026,'Vitality','NAVI','','ropz','Vitality'),('BLAST Rivals 2026 Season 1',2026,'Vitality','NAVI','','ZywOo','Vitality')]
for n,a,c,v,p,mv,mt in B: add(n,a,'BLAST',c,v,p,mv,mt)
TOP={2013:'GeT_RiGhT:SE,f0rest:SE,shox:FR,Dosia:RU,NBK-:FR,Xizt:SE,ScreaM:BE,JW:SE,Hiko:US,GuardiaN:SK',
2014:'GeT_RiGhT:SE,flusha:SE,pashaBiceps:PL,Snax:PL,JW:SE,kennyS:FR,f0rest:SE,shox:FR,KRIMZ:SE,Happy:FR',
2015:'olofmeister:SE,GuardiaN:SK,dev1ce:DK,Snax:PL,flusha:SE,kennyS:FR,KRIMZ:SE,Happy:FR,NBK-:FR,JW:SE',
2016:'coldzera:BR,FalleN:BR,dev1ce:DK,s1mple:UA,Snax:PL,shox:FR,f0rest:SE,olofmeister:SE,ScreaM:BE,flusha:SE',
2017:'coldzera:BR,NiKo:BA,fer:BR,rain:NO,dev1ce:DK,FalleN:BR,kennyS:FR,s1mple:UA,GuardiaN:SK,dupreeh:DK',
2018:'s1mple:UA,dev1ce:DK,NiKo:BA,electroNic:RU,dupreeh:DK,NAF:CA,Magisk:DK,gla1ve:DK,KRIMZ:SE,coldzera:BR',
2019:'ZywOo:FR,s1mple:UA,dev1ce:DK,EliGE:US,Magisk:DK,electroNic:RU,NAF:CA,Brehze:US,Twistzz:CA,ropz:EE',
2020:'ZywOo:FR,s1mple:UA,dev1ce:DK,NiKo:BA,electroNic:RU,blameF:DK,ropz:EE,EliGE:US,dupreeh:DK,syrsoN:DE',
2021:'s1mple:UA,ZywOo:FR,NiKo:BA,sh1ro:RU,Ax1Le:RU,HObbit:KZ,electroNic:RU,YEKINDAR:LV,b1t:UA,Jame:RU',
2022:'s1mple:UA,ZywOo:FR,sh1ro:RU,Ax1Le:RU,NiKo:BA,broky:LV,m0NESY:RU,ropz:EE,KSCERATO:BR,stavn:DK',
2023:'ZywOo:FR,NiKo:BA,ropz:EE,m0NESY:RU,Spinx:IL,SunPayus:ES,s1mple:UA,sh1ro:RU,stavn:DK,broky:LV',
2024:'donk:RU,m0NESY:RU,ZywOo:FR,NiKo:BA,jL:LT,sh1ro:RU,flameZ:IL,broky:LV,b1t:UA,frozen:SK',
2025:'ZywOo:FR,donk:RU,ropz:EE,m0NESY:RU,sh1ro:RU,molodoy:KZ,flameZ:IL,frozen:SK,KSCERATO:BR,Spinx:IL'}
bo={str(y):[x.split(':') for x in v.split(',')] for y,v in TOP.items()}
H={'cs2':{'nome':'Counter-Strike','torneios':T,'bo':bo}}
open('js/data/hist.js','w').write('/* Histórico real por jogo, pesquisado na web (gerado por tools/gen_hist_cs2.py). Torneio: n, a (ano), tp (tipo), c (campeão), v (vice), p (placar), mvp [nick,time,país], r (line-up, só quando certa). bo: Top 10 anual da HLTV como Bola de Ouro: ano -> [[nick, país ISO2]]. Ausente = não conferido. */\nwindow.HIST = '+json.dumps(H,ensure_ascii=False,separators=(',',':'))+';\n')
print(len(T))
