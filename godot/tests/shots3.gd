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
	for i in 60: O.passo(false)
	m.tab = "hall"; m.hall_mode = "lendas"
	for g in ["lol", "cs2"]:
		m.game = g; m.render(); await shot("20_lendas_" + g)
	m.tab = "mundo"; m.game = "lol"; m.render(); await shot("21_mundo_lol")
	m.game = "cs2"; m.render(); await shot("22_mundo_cs2")
	print("shots3 ok"); quit()
