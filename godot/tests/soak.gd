extends SceneTree
# Soak: 6 anos com todos os jogos abertos, renderizando todas as abas todo ano.
func _initialize() -> void:
	var O = root.get_node("Org"); O.testando = true
	var m: Control = load("res://scenes/main.tscn").instantiate(); root.add_child(m); root.size = Vector2i(720, 1280)
	run(O, m)
func run(O, m) -> void:
	await process_frame
	O.iniciar({"game": "lol", "nome": "Soak", "regiao": "CBLOL"}); O.sem_estrela(); O.S.org.caixa = 50000000
	for g in O.GAMES:
		if not O.ativo(g): continue
		O.S.games[g]["aberto"] = true; O.S.games[g].squads.t1.on = true; O.S.games[g].squads.t2.on = true
		O.comprar_infra("base", g)
		var lv: Array = O.livres(g).filter(func(p): return p.o <= 76)
		lv.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
		for sq in ["t1", "t2"]:
			for r in O.GAMES[g].roles:
				for p in lv:
					if p.r == r and O.S.games[g].squads[sq].slots[O.GAMES[g].roles.find(r)] == null: O.contratar(g, sq, p); lv.erase(p); break
	m.auto = false; var parou := 0; var res := 0
	for w in 52 * 6:
		var r: Dictionary = O.passo(true)
		if r.get("parou", false):
			parou += 1; r = O.passo(false)
			for d in r.partidas: res += 1; var n: Dictionary = d.nar; assert(n.jogos.size() > 0 and n.mvp.n != "")
		if w % 52 == 51:
			for g in ["lol", "cs2", "ff", "fifa", "wr"]:
				m.game = g
				for t in ["org", "elenco", "mercado", "cal", "ligas", "neg", "hall"]: m.tab = t; m.render()
	print("soak ok parou=%d resultados=%d ano=%d caixa=%d" % [parou, res, O.S.org.ano, O.S.org.caixa])
	m.game = "lol"; m.tab = "hall"; m.render(); await process_frame; await process_frame; DirAccess.make_dir_recursive_absolute("/tmp/shots"); root.get_texture().get_image().save_png("/tmp/shots/hall_lol.png")
	m.game = "cs2"; m.render(); await process_frame; await process_frame; root.get_texture().get_image().save_png("/tmp/shots/hall_cs2.png")
	quit()
