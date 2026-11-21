# Fumaça do mundo que envelhece no navegador: python3 tests/e2e_mundo.py
import asyncio, os
from playwright.async_api import async_playwright
URL = 'file://' + os.path.abspath('index.html')
async def main():
    fails = []
    def ok(c, m):
        print(('OK   ' if c else 'FAIL ') + m); (not c) and fails.append(m)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox', '--allow-file-access-from-files'])
        pg = await b.new_page(viewport={'width': 390, 'height': 780}); errs = []
        pg.on('requestfailed', lambda r: errs.append('REQ ' + r.url[-40:])); pg.on('pageerror', lambda e: errs.append(str(e))); pg.on('console', lambda m: m.type == 'error' and errs.append(m.text + ' ' + str(m.location.get('url', ''))[-50:]))
        await pg.goto(URL); await pg.wait_for_timeout(300)
        await pg.evaluate("() => { Org.comecar(); Org.iniciar({ nome: 'Mundo', game: 'lol', regiao: 'CBLOL' }); Org.semEstrela(); Org.save(); }")
        await pg.reload(); await pg.wait_for_timeout(300)
        antes = await pg.evaluate("() => { const p = Org.pool('lol').find(x => x.id === 'CBLOL-1-0-0'); return { n: p.n, a: p.a, o: p.o }; }")
        # 10 anos de mundo (sem jogar): idades e mercado atualizados
        r = await pg.evaluate("() => { const S = Org.get(); for (let i = 0; i < 10; i++) { S.org.ano++; Org.mundoTick(); } Org.save(); const p = Org.pool('lol'); return { n: p.length, reg: p.filter(x => x.id.includes('~')).length, ano: S.org.ano }; }")
        ok(r['n'] == 460 and r['reg'] > 100, f"mercado com regens após 10 anos ({r})")
        nick = await pg.evaluate("() => Org.pool('lol').find(x => x.id.includes('~')).n")
        await pg.reload(); await pg.wait_for_timeout(300)
        await pg.click('[data-act=tab][data-id=mercado]'); await pg.wait_for_timeout(200)
        ok(await pg.locator('#main .slot').count() > 0, 'mercado renderiza com o mundo evoluído')
        nome = (await pg.locator('#main .slot a[data-act=ficha]').first.text_content()).strip()
        await pg.locator('#main .slot a[data-act=ficha]').first.click(); await pg.wait_for_timeout(300)
        idade = await pg.evaluate("(n) => Org.pool('lol').find(x => x.n === n).a", nome)
        txt = (await pg.locator('body').inner_text())
        ok(f'{idade} anos' in txt, f'ficha de {nome} mostra a idade atual ({idade} anos)')
        await pg.reload(); await pg.wait_for_timeout(300)
        r2 = await pg.evaluate("() => ({ n: Org.get().mundo.n, reg: Org.pool('lol').filter(x => x.id.includes('~')).length })")
        ok(r2['n'] == 10 and r2['reg'] > 100, f'mundo persiste após recarregar ({r2})')
        ok(not errs, f'sem erros de console ({errs[:2]})')
        await b.close()
    print('FALHAS:', len(fails)); raise SystemExit(1 if fails else 0)
asyncio.run(main())
