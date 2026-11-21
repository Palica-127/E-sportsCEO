extends SceneTree
func _initialize() -> void:
	var O = root.get_node("Org"); O.testando = true
	var t := Time.get_ticks_msec()
	O.S = O.novo_jogo(); O.S.seed = 424242; print("novo ", Time.get_ticks_msec() - t)
	O.mundo_sync(); print("sync ", Time.get_ticks_msec() - t)
	O.iniciar({"game": "lol", "nome": "Teste"}); print("iniciar ", Time.get_ticks_msec() - t)
	var lv: Array = O.livres("lol"); print("livres ", lv.size(), " ", Time.get_ticks_msec() - t)
	for i in 10: O.avancar(1)
	print("10 sem ", Time.get_ticks_msec() - t)
	quit()
