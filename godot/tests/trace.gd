extends SceneTree
# Espelho de tests/trace.js: godot --headless --path godot --script tests/trace.gd -- 3 lol
func _initialize() -> void:
	var O = root.get_node("Org"); O.testando = true
	var args := OS.get_cmdline_user_args(); var anos: int = int(args[0]) if args.size() > 0 else 3; var jogo: String = args[1] if args.size() > 1 else "lol"
	O.S = O.novo_jogo(); O.S.seed = 424242; O.mundo_sync()
	O.iniciar({"game": jogo, "nome": "Teste"}); O.sem_estrela()
	var roles = O.GAMES[jogo].roles
	var lv: Array = O.livres(jogo).filter(func(p): return p.o <= 74)
	lv.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	for r in roles:
		for p in lv:
			if p.r == r: O.contratar(jogo, "t1", p); break
	O.comprar_infra("base", jogo); O.comprar_infra("casa", jogo); O.set_foco("treino")
	var out := []
	for w in range(1, 52 * anos + 1):
		if w % 100 == 0:
			var sl = O.S.games[jogo].squads.t1.slots
			for i in sl.size():
				if sl[i] != null: O.renovar(jogo, "t1", i, "justa", 2)
		O.avancar(1)
		if w % 52 == 0:
			out.append("ano %d cx=%d rep=%s seg=%d seed=%d logN=%d forca=%s mundo=%d apos=%d" % [O.S.org.ano, O.S.org.caixa, "%.4f" % O.S.org.rep, O.S.social.seg, O.S.seed, O.S.logN, "%.3f" % O.forca(jogo, "t1"), O.S.mundo.n, O.S.mundo.apos.size()])
	var sl2 := []
	for p in O.S.games[jogo].squads.t1.slots: sl2.append("-" if p == null else "%s:%d/%d/%s" % [p.n, p.o, p.pot, str(p.a)])
	out.append("elenco " + ",".join(sl2))
	var bs := []
	for p in O.S.base.get(jogo, []): bs.append("%s:%d/%d" % [p.n, p.o, p.pot])
	out.append("base " + ",".join(bs))
	var ih := []
	for x in O.S.intlHist: ih.append("%d%s:%s" % [x.y, x.tipo, x.camp])
	out.append("intl " + " | ".join(ih))
	var c = O.S.comp[jogo + "-t1"]; var hh := []
	for h in c.hist: hh.append("%ds%d:%s>%s%s" % [h.y, h.s, h.camp, h.vice, ("*" + h.eu) if h.eu != null else ""])
	out.append("hist " + " | ".join(hh))
	out.append("log " + " // ".join(O.S.log.slice(0, 6)))
	var rg := []
	for y in O.S.reg.get(jogo, {}): rg.append("%s:%d" % [y, O.S.reg[jogo][y].size()])
	out.append("reg " + ",".join(rg) + " bo=" + ",".join(O.S.bo.get(jogo, {}).keys()) + " hon=" + str(O.S.hon.get(jogo, {}).size()))
	print("\n".join(out))
	quit()
