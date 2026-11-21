extends SceneTree
var m: Control
func shot(n: String) -> void:
	await process_frame; await process_frame; root.get_texture().get_image().save_png("/tmp/shots/%s.png" % n)
func _initialize() -> void:
	DirAccess.make_dir_recursive_absolute("/tmp/shots"); var O = root.get_node("Org"); O.testando = true
	m = load("res://scenes/main.tscn").instantiate(); root.add_child(m); root.size = Vector2i(720, 1280); run(O)
func run(O) -> void:
	await process_frame
	O.iniciar({"game": "lol", "nome": "Palica Esports", "regiao": "CBLOL"}); O.sem_estrela(); m.game = "lol"
	var lv: Array = O.livres("lol").filter(func(p): return p.o <= 76); lv.sort_custom(func(a, b): return a.o > b.o)
	for r in O.GAMES["lol"].roles:
		for p in lv:
			if p.r == r: O.contratar("lol", "t1", p); break
	O.S.org.caixa = 900000; O.contratar_staff("tecnico"); O.contratar_staff("analista")
	for i in 10: O.passo(false)
	m.tab = "elenco"; m.render(); m.scroll.scroll_vertical = 900; await shot("40_elenco_baixo")
	print("shots5 ok"); quit()
