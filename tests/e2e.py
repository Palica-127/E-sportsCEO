# Teste de fumaça no navegador: python3 tests/e2e.py  (usa Chrome via Playwright)
import asyncio, os
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath('index.html'); OUT = '/tmp/shots'; os.makedirs(OUT, exist_ok=True)
async def main():
    fails = []
    def ok(c, m):
        print(('OK   ' if c else 'FAIL ') + m); (not c) and fails.append(m)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
        for w, h in [(390, 780), (360, 640)]:
            pg = await b.new_page(viewport={'width': w, 'height': h}); errs = []
            pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            await pg.goto(URL); await pg.wait_for_timeout(300)
            ok(await pg.locator('#top').inner_text() != '', f'{w}: cabeçalho renderiza')
            await pg.click('[data-act=tab][data-id=mercado]')
            ok(await pg.locator('#main .slot').count() > 0, f'{w}: mercado lista jogadores')
            await pg.click('[data-act=mpay]'); await pg.click('[data-act=masc]')
            for _ in range(5): await pg.locator('[data-act=contratar]:not([disabled])').first.click()
            await pg.click('[data-act=tab][data-id=elenco]')
            filled = await pg.locator('#main .slot .ovr').count()
            ok(filled >= 5, f'{w}: 5+ contratados no elenco ({filled})')
            await pg.screenshot(path=f'{OUT}/elenco_{w}.png')
            await pg.click('[data-act=tab][data-id=estrutura]'); await pg.locator('[data-act=infra]:not([disabled])').first.click()
            await pg.screenshot(path=f'{OUT}/estrutura_{w}.png')
            await pg.click('[data-act=tab][data-id=org]'); await pg.click('[data-act=avancar][data-n="4"]')
            ok('Semana 5' in await pg.locator('#top').inner_text(), f'{w}: avançou 4 semanas')
            await pg.screenshot(path=f'{OUT}/org_{w}.png')
            await pg.click('[data-act=proximo]')
            await pg.click('[data-act=tab][data-id=ligas]'); txt = await pg.locator('#main').inner_text()
            ok('Rodada' in txt and 'Seus últimos jogos' in txt, f'{w}: ligas mostra rodada e jogos do usuário')
            await pg.screenshot(path=f'{OUT}/ligas_{w}.png')
            await pg.click('[data-act=time]') if await pg.locator('[data-act=time]').count() else None
            antes = await pg.locator('#top').inner_text()
            await pg.reload(); await pg.wait_for_timeout(200)
            ok(antes == await pg.locator('#top').inner_text(), f'{w}: save persiste após recarregar')
            await pg.click('[data-act=game][data-id=cs2]'); await pg.click('[data-act=tab][data-id=mercado]'); await pg.wait_for_timeout(100)
            ok('jogadores' in await pg.locator('#main').inner_text(), f'{w}: CS2 tem mercado')
            await pg.click('[data-act=tab][data-id=ligas]'); await pg.wait_for_timeout(100)
            ok('Américas' in await pg.locator('#main').inner_text(), f'{w}: CS2 mostra liga das Américas')
            await pg.click('[data-act=game][data-id=lol]')
            for gid in ['ff', 'r6', 'fifa', 'wr']:
                ok(await pg.locator(f'[data-act=game][data-id={gid}]').count() == 1, f'{w}: jogo {gid} aparece no seletor')
            sw = await pg.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
            ok(sw, f'{w}: sem rolagem horizontal'); ok(not errs, f'{w}: console limpo {errs[:2]}')
            await pg.close()
        await b.close()
    print('FALHAS:', len(fails)); raise SystemExit(1 if fails else 0)
asyncio.run(main())
