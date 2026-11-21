extends SceneTree
func _initialize() -> void:
	run()
func dump(n: Node, d: int, lim: int) -> void:
	if d > lim: return
	if n is Control:
		var ms: Vector2 = (n as Control).get_combined_minimum_size()
		if ms.x > 380: print("  ".repeat(d), n.get_class(), " ", n.name, " min.x=", ms.x, " size.x=", (n as Control).size.x)
	for c in n.get_children(): dump(c, d + 1, lim)
func run() -> void:
	root.size = Vector2i(1672, 940)
	var O = root.get_node("Org"); O.testando = true
	var m = load("res://scenes/main.tscn").instantiate(); root.add_child(m)
	await process_frame; await process_frame
	O.iniciar({"game": "lol", "nome": "127 Thieves", "regiao": "CBLOL"}); O.sem_estrela(); O.S.org.caixa = 12450000
	for g in ["lol", "cs2"]:
		var lv: Array = O.livres(g).filter(func(p): return p.o <= 80)
		lv.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
		for r in O.GAMES[g].roles:
			for p in lv:
				if p.r == r and O.S.games[g].squads.t1.slots[O.GAMES[g].roles.find(r)] == null: O.contratar(g, "t1", p); lv.erase(p); break
	for i in 30: O.passo(false)
	m.tab = "org"; m.render(); await process_frame; await process_frame
	print("win ", get_root().size, " scale ", get_root().content_scale_size, " vp ", m.get_viewport_rect().size)
	await create_timer(0.5).timeout
	dump(m.content, 0, 9)
	print("main ", m.get_global_rect(), " side ", m.side_p.get_global_rect(), " topbar ", m.topbar_p.get_global_rect(), " tbh ", m.topbar_h.get_global_rect(), " mg ", m.mgc.get_global_rect(), " content ", m.content.get_global_rect())
	print("xform ", m.get_viewport().get_final_transform(), " win ", root.size, " ", root.content_scale_size, " mode ", root.content_scale_mode, " aspect ", root.content_scale_aspect)
	quit()
