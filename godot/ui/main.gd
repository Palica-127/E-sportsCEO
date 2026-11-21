extends Control
## Interface do eSports CEO (Godot). Tudo é montado por código; render() refaz a tela atual.

const TABS := [["org", "Org"], ["elenco", "Elenco"], ["mercado", "Mercado"], ["cal", "Agenda"], ["ligas", "Ligas"], ["neg", "Negócios"], ["hall", "Hall"]]
const BG := Color("0f1220"); const CARD := Color("1a1f35"); const ACC := Color("7c8cff"); const TXT := Color("e8ebff"); const DIM := Color("8b93b8")
const OK := Color("49d17d"); const BAD := Color("ff6b6b"); const GOLD := Color("ffc857")
var O: Node
var tab = "org"; var game = "lol"; var squad = "t1"
var content: VBoxContainer; var top: Label; var topsub: Label; var gbar: HFlowContainer; var nav: HBoxContainer; var scroll: ScrollContainer
var modal_layer: Control
var play = false; var auto = false; var timer: Timer; var vel = 0.45
var merc = {"role": "", "pay": true, "n": 25, "liga": ""}
var hy = 0; var hall_mode = "ano"; var fm = ""   # ano do Hall; modo
var toast_lbl: Label; var cfg = {"nome": "Minha Org", "game": "lol", "regiao": ""}

func _ready() -> void:
	O = get_node("/root/Org"); O.carregar_dados()
	var th = Theme.new(); th.default_font_size = 26; set_theme(th)
	var bg = ColorRect.new(); bg.color = BG; bg.set_anchors_preset(Control.PRESET_FULL_RECT); add_child(bg)
	var root = VBoxContainer.new(); root.set_anchors_preset(Control.PRESET_FULL_RECT); root.add_theme_constant_override("separation", 6); add_child(root)
	var hb = PanelContainer.new(); hb.add_theme_stylebox_override("panel", _sb(CARD, 0)); root.add_child(hb)
	var tv = VBoxContainer.new(); hb.add_child(tv)
	top = Label.new(); top.add_theme_font_size_override("font_size", 30); tv.add_child(top)
	topsub = Label.new(); topsub.add_theme_color_override("font_color", DIM); tv.add_child(topsub)
	gbar = HFlowContainer.new(); root.add_child(gbar)
	scroll = ScrollContainer.new(); scroll.size_flags_vertical = Control.SIZE_EXPAND_FILL; scroll.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; root.add_child(scroll)
	content = VBoxContainer.new(); content.size_flags_horizontal = Control.SIZE_EXPAND_FILL; content.add_theme_constant_override("separation", 10); scroll.add_child(content)
	nav = HBoxContainer.new(); nav.add_theme_constant_override("separation", 2); root.add_child(nav)
	modal_layer = Control.new(); modal_layer.set_anchors_preset(Control.PRESET_FULL_RECT); modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE; add_child(modal_layer)
	toast_lbl = Label.new(); toast_lbl.visible = false; toast_lbl.add_theme_color_override("font_color", GOLD); toast_lbl.set_anchors_preset(Control.PRESET_CENTER_BOTTOM); toast_lbl.position.y -= 130; toast_lbl.autowrap_mode = TextServer.AUTOWRAP_WORD; toast_lbl.custom_minimum_size.x = 640; add_child(toast_lbl)
	timer = Timer.new(); timer.one_shot = false; timer.timeout.connect(_tick); add_child(timer)
	auto = FileAccess.file_exists("user://auto") 
	if O.tem_save() and O.load_save(): pass
	else: O.reset_estado(); O.comecar()
	if O.S.get("inicio") != null and O.GAMES.has(O.S.inicio): game = O.S.inicio if O.aberto(O.S.inicio) else "lol"
	render()

# ---------- helpers de UI ----------
func _sb(c: Color, r := 14) -> StyleBoxFlat:
	var s = StyleBoxFlat.new(); s.bg_color = c; s.set_corner_radius_all(r); s.set_content_margin_all(12); return s
func lbl(p, t, size := 0, col = null, wrap := true) -> Label:
	var l = Label.new(); l.text = str(t); if wrap: l.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	l.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	if size: l.add_theme_font_size_override("font_size", size)
	if col != null: l.add_theme_color_override("font_color", col)
	p.add_child(l); return l
func btn(p, t, cb: Callable, dis := false, accent := false) -> Button:
	var b = Button.new(); b.text = t; b.disabled = dis; b.pressed.connect(cb); b.custom_minimum_size.y = 56
	if accent: b.add_theme_stylebox_override("normal", _sb(ACC, 12)); b.add_theme_color_override("font_color", Color.WHITE)
	p.add_child(b); return b
func card(title := "", parent = null) -> VBoxContainer:
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sb(CARD)); (parent if parent != null else content).add_child(pc)
	var v = VBoxContainer.new(); v.add_theme_constant_override("separation", 8); pc.add_child(v)
	if title != "": lbl(v, title, 30, TXT)
	return v
func hrow(p) -> HBoxContainer:
	var h = HBoxContainer.new(); h.add_theme_constant_override("separation", 8); p.add_child(h); return h
func chips(p, items: Array, sel, cb: Callable) -> void:
	var f = HFlowContainer.new(); f.add_theme_constant_override("h_separation", 6); f.add_theme_constant_override("v_separation", 6); p.add_child(f)
	for it in items:
		var b = Button.new(); b.text = str(it[1]); b.toggle_mode = true; b.button_pressed = (str(it[0]) == str(sel)); b.custom_minimum_size.y = 50
		b.pressed.connect(cb.bind(it[0])); f.add_child(b)
func toast(t: String) -> void:
	toast_lbl.text = t; toast_lbl.visible = true
	get_tree().create_timer(2.4).timeout.connect(func(): toast_lbl.visible = false)
func res(r: Dictionary) -> void:  # mostra o resultado de uma ação e redesenha
	toast(r.get("msg", "")); render()
func modal(title: String) -> VBoxContainer:
	for c in modal_layer.get_children(): c.queue_free()
	modal_layer.mouse_filter = Control.MOUSE_FILTER_STOP
	var dim = ColorRect.new(); dim.color = Color(0, 0, 0, 0.7); dim.set_anchors_preset(Control.PRESET_FULL_RECT); modal_layer.add_child(dim)
	var mc = MarginContainer.new(); mc.set_anchors_preset(Control.PRESET_FULL_RECT)
	for s in ["left", "right"]: mc.add_theme_constant_override("margin_" + s, 24)
	for s in ["top", "bottom"]: mc.add_theme_constant_override("margin_" + s, 80)
	modal_layer.add_child(mc)
	var pc = PanelContainer.new(); pc.add_theme_stylebox_override("panel", _sb(Color("20264a"))); mc.add_child(pc)
	var sc = ScrollContainer.new(); sc.horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED; pc.add_child(sc)
	var v = VBoxContainer.new(); v.size_flags_horizontal = Control.SIZE_EXPAND_FILL; v.add_theme_constant_override("separation", 8); sc.add_child(v)
	var h = hrow(v); lbl(h, title, 32, TXT); var x = Button.new(); x.text = "✕"; x.custom_minimum_size = Vector2(60, 56); x.pressed.connect(close_modal); h.add_child(x)
	return v
func close_modal() -> void:
	for c in modal_layer.get_children(): c.queue_free()
	modal_layer.mouse_filter = Control.MOUSE_FILTER_IGNORE; render()
func clear(n: Node) -> void:
	for c in n.get_children(): n.remove_child(c); c.queue_free()
func stars(n) -> String: return "★".repeat(int(n)) + "☆".repeat(5 - int(n))
func gname(g) -> String: return O.GAMES[g].curto

# ---------- render ----------
func render() -> void:
	var S = O.S
	clear(content); clear(gbar); clear(nav)
	if S.setup == "config": top.text = "Nova org"; topsub.text = "Configure e comece"; vsetup(); return
	if S.setup == "estrela": top.text = S.org.nome; topsub.text = "Convide uma estrela"; vestrela(); return
	top.text = "%s · %s" % [S.org.nome, O.money(S.org.caixa)]
	topsub.text = "Semana %d/%d · Rep %.1f · %s seguidores" % [S.org.semana, S.org.ano, S.org.rep, _fmt_n(S.social.seg)]
	for g in O.GAMES:
		if not O.ativo(g): continue
		if O.aberto(g): var b = Button.new(); b.text = gname(g); b.toggle_mode = true; b.button_pressed = (g == game); b.pressed.connect(func(): game = g; squad = "t1"; render()); gbar.add_child(b)
	for t in TABS:
		var b = Button.new(); b.text = t[1]; b.toggle_mode = true; b.button_pressed = (t[0] == tab); b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 64; b.add_theme_font_size_override("font_size", 20)
		b.pressed.connect(func(): tab = t[0]; render()); nav.add_child(b)
	match tab:
		"org": vorg()
		"elenco": velenco()
		"mercado": vmercado()
		"cal": vcal()
		"ligas": vligas()
		"neg": vneg()
		"hall": vhall()
	scroll.scroll_vertical = 0
func _fmt_n(n) -> String: return "%.1f mi" % (n / 1e6) if n >= 1e6 else "%.1f mil" % (n / 1e3) if n >= 1e4 else str(int(n))

# ---------- Início de jogo ----------
func vsetup() -> void:
	var c = card("Sua organização")
	var le = LineEdit.new(); le.text = cfg.nome; le.custom_minimum_size.y = 60; le.text_changed.connect(func(t): cfg.nome = t); c.add_child(le)
	lbl(c, "Jogo inicial", 26, DIM)
	var its = []
	for g in O.GAMES:
		if O.ativo(g): its.append([g, gname(g)])
	chips(c, its, cfg.game, func(id): cfg.game = id; cfg.regiao = ""; render())
	lbl(c, "Região", 26, DIM)
	var regs = []
	for k in O.D(cfg.game).leagues: regs.append([k, O.D(cfg.game).leagues[k].get("nome", k)])
	if cfg.regiao == "" or not O.D(cfg.game).leagues.has(cfg.regiao): cfg.regiao = O.D(cfg.game).inicio
	chips(c, regs, cfg.regiao, func(id): cfg.regiao = id; render())
	btn(c, "Criar org", func():
		var r: Dictionary = O.iniciar({"game": cfg.game, "nome": cfg.nome, "regiao": cfg.regiao}); game = cfg.game; render(), false, true)
func vestrela() -> void:
	var c = card("Convide uma estrela")
	lbl(c, "Tentativas: %d. Estrelas aceitam menos; a chance depende da nota. Quem aceitar entra sem taxa e vira o rosto da org." % O.S.tent, 24, DIM)
	btn(c, "Começar sem estrela", func(): O.sem_estrela(); render())
	var g: String = O.S.inicio; var lst: Array = O.livres(g).filter(func(p): return p.tier == "T1")
	lst.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	var c2 = card("Candidatos")
	for p in lst.slice(0, 15):
		var h = hrow(c2); lbl(h, "%s  %s  nota %d  (%d%%)" % [p.n, p.r, p.o, jr100(O.chance_estrela(p.o))], 24)
		btn(h, "Convidar", func(): var r: Dictionary = O.convidar_estrela(p); toast(r.msg); render())
func jr100(x) -> int: return int(round(x * 100))

# ---------- Org ----------
func vorg() -> void:
	var S = O.S; var pr: Dictionary = O.projecao_org()
	var c = card("Resumo semanal")
	lbl(c, "Receita %s · Despesa %s · Saldo %s" % [O.money(pr.receita), O.money(pr.despesa), O.money(pr.saldo)], 24, OK if pr.saldo >= 0 else BAD)
	var h = hrow(c)
	btn(h, "⏸ Parar" if play else "▶ Avançar", _toggle_play, false, true)
	btn(h, "+1 semana", func(): _manual(1))
	btn(h, "Até o jogo", _ate_jogo)
	var h2 = hrow(c)
	var tg = CheckButton.new(); tg.text = "Pular partidas"; tg.button_pressed = auto; tg.toggled.connect(func(on):
		auto = on
		if on: FileAccess.open("user://auto", FileAccess.WRITE).store_string("1")
		else: DirAccess.remove_absolute(ProjectSettings.globalize_path("user://auto"))); h2.add_child(tg)
	var sp = OptionButton.new(); sp.add_item("1x"); sp.add_item("2x"); sp.add_item("6x"); sp.selected = [0.45, 0.22, 0.07].find(vel) if [0.45, 0.22, 0.07].has(vel) else 0
	sp.item_selected.connect(func(i): vel = [0.45, 0.22, 0.07][i]; if play: timer.start(vel)); h2.add_child(sp)
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		var cg = card(O.GAMES[g].nome)
		for sq in O.SQUADS:
			var cp = O.comp_for(g, sq)
			if cp == null: continue
			var st: String = {"off": "entressafra", "wait": "à espera (complete os titulares)", "reg": "rodada %d" % (cp.round + 1), "po": "playoffs", "intl": "internacional"}[cp.phase]
			lbl(cg, "%s · força %.1f · %s" % [O.SQUADS[sq].nome, O.forca(g, sq), st], 24)
	var cn = card("Notícias")
	for l in S.log.slice(0, 10): lbl(cn, l, 22, DIM)
	var cr = card()
	btn(cr, "Tem certeza? Toque de novo" if fm == "reset" else "Nova org (apaga o save)", func():
		if fm == "reset": fm = ""; O.reset_estado(); O.comecar(); render()
		else: fm = "reset"; render())
func _toggle_play() -> void:
	play = not play
	if play: timer.start(vel)
	else: timer.stop()
	render()
func _manual(n: int) -> void:
	for i in n:
		var r: Dictionary = O.passo(not auto)
		if r.get("parou", false): mostra_pre(r); return
		_depois(r)
	render()
func _ate_jogo() -> void:
	for i in 60:
		var r: Dictionary = O.passo(not auto)
		if r.get("parou", false): mostra_pre(r); return
		if r.get("partidas", []).size() or r.get("motivo") != null: _depois(r); break
	render()
func _tick() -> void:
	if modal_layer.get_child_count() > 0: return
	var r: Dictionary = O.passo(not auto)
	if r.get("parou", false): timer.stop(); mostra_pre(r); return
	_depois(r)
	if play: render()
func _depois(r: Dictionary) -> void:
	if r.get("partidas", []).size() and not auto: timer.stop(); mostra_res(r.partidas); return
	if r.get("motivo") != null:
		play = false; timer.stop(); toast(str(r.motivo))
func mostra_pre(r: Dictionary) -> void:
	var v = modal("Partida na semana %d" % r.semana)
	for p in r.partidas:
		var c = card("", v)
		lbl(c, p.tag, 24, DIM); lbl(c, "%s  vs  %s" % [p.euNome, p.op], 30, TXT)
		lbl(c, "%s · Bo%d · força %.1f x %.1f · chance %d%%" % [p.fase, p.bo, p.fMeu, p.fOp, jr100(p.p)], 24)
	btn(v, "Simular partida", func(): _simular(), false, true)
func _simular() -> void:
	var r: Dictionary = O.passo(false); for c in modal_layer.get_children(): c.queue_free()
	if r.get("partidas", []).size(): mostra_res(r.partidas)
	else: close_modal()
func mostra_res(ps: Array) -> void:
	var v = modal("Resultado")
	for d in ps:
		var nar: Dictionary = d.nar; var c = card("", v)
		lbl(c, d.tag + " · " + d.fase, 22, DIM)
		lbl(c, "%s %d x %d %s" % [d.euNome, d.meus, d.deles, d.op], 34, OK if d.v else BAD)
		lbl(c, "VITÓRIA" if d.v else "DERROTA", 26, OK if d.v else BAD)
		for j in nar.jogos:
			var t = "%s (%s)" % [j.lbl, j.sub]; for m in j.m: t += "  %s %d-%d" % [m.n, m.a, m.b]
			lbl(c, t, 22)
		for m in nar.momentos: lbl(c, "• " + m.txt, 22, DIM)
		lbl(c, "MVP: %s (%s) · %s" % [nar.mvp.n, nar.mvp.time, nar.mvp.stat], 24, GOLD)
		var e = d.get("efeito")
		if e != null: lbl(c, "Caixa %s · Rep %+.2f · Torcida %+.1f%%" % [O.money(e.caixa), e.rep, e.seg * 100], 22, DIM)
		for n in d.get("notas", []): lbl(c, "→ " + n, 22, GOLD)
	btn(v, "Continuar", close_modal_continue, false, true)
func close_modal_continue() -> void:
	close_modal()
	if play: timer.start(vel)

# ---------- Elenco ----------
func velenco() -> void:
	var g = game; var S = O.S
	var c0 = card()
	var its = []
	for sq in O.SQUADS: its.append([sq, O.SQUADS[sq].nome.split(" (")[0] + ("" if S.games[g].squads[sq].on else " +")])
	chips(c0, its, squad, func(id): squad = id; render())
	var q = S.games[g].squads[squad]
	if not q.on:
		var c = card(O.SQUADS[squad].nome)
		lbl(c, "Criar este time custa %s de licença." % O.money(O.SQUADS[squad].licenca))
		btn(c, "Criar time", func(): res(O.ativar_squad(g, squad)), false, true)
		return
	var c = card("%s · força %.1f" % [O.SQUADS[squad].nome, O.forca(g, squad)])
	lbl(c, "Folha %s/sem · moral média %s" % [O.money(O.folha(g, squad)), O.moral_rot(_moral_media(g, squad))], 22, DIM)
	lbl(c, "Foco de treino do time:", 22, DIM)
	var fs = []
	for f in O.FOCOS: fs.append([f, O.FOCOS[f].nome])
	chips(c, fs, "", func(id): res(O.foco_equipe(g, squad, id)))
	var roles = O.GAMES[g].roles; var n = roles.size()
	for i in q.slots.size():
		var p = q.slots[i]; var tit = "Titular" if i < n else "Reserva"; var rl: String = roles[i] if i < n else "RES"
		var row = hrow(c)
		if p == null:
			lbl(row, "%s — vaga vazia (%s)" % [rl, tit], 24, DIM); continue
		var tr: Dictionary = O.tendencia(p, g, squad, i < n)
		var b = Button.new(); b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 64; b.clip_text = true
		b.text = "%s  %s  %d/%d %s  %sa  ct %d" % [rl, p.n, p.o, p.pot, tr.s, str(p.get("a", "?")), int(p.get("ct", O.CONTRATO))]
		b.pressed.connect(func(): ficha_slot(g, squad, i)); row.add_child(b)
	_base_card(g)
func _moral_media(g, sq) -> float:
	var t: Array = O.titulares(g, sq).filter(func(p): return p != null)
	if t.is_empty(): return 70.0
	var s = 0.0
	for p in t: s += p.mo
	return s / t.size()
func ficha_slot(g, sq, i) -> void:
	var p = O.S.games[g].squads[sq].slots[i]
	if p == null: return
	var v = modal("%s · %s" % [p.n, O.GAMES[g].roles[i] if i < O.nT(g) else "Reserva"])
	var pv: Dictionary = O.pot_visivel(p, g); var tr: Dictionary = O.tendencia(p, g, sq, i < O.nT(g))
	lbl(v, "Nota %d · potencial %s%s · idade %s · %s" % [p.o, stars(pv.estrelas), "?" if pv.incerto else "", str(p.get("a", "?")), str(p.get("c", ""))], 26)
	lbl(v, "Moral: %s (%d) · XP %d/%d · tendência %s (%+.1f/ano)" % [O.moral_rot(p.mo), p.mo, p.xp, O.xp_necessario(p.o), tr.s, tr.anual], 24, DIM)
	if p.get("tr") != null: lbl(v, "Traço: %s — %s" % [O.TRACOS[p.tr].nome, O.TRACOS[p.tr].desc], 22, GOLD)
	lbl(v, "Contrato: %d semanas · salário %s/sem · valor de venda %s" % [int(p.get("ct", O.CONTRATO)), O.money(O.salario_de(p)), O.money(O.valor_venda(p))], 22, DIM)
	lbl(v, "Foco de treino:", 24)
	var fs = []
	for f in O.FOCOS: fs.append([f, O.FOCOS[f].nome])
	chips(v, fs, p.foco, func(id): O.trocar_foco(g, sq, i, id); ficha_slot(g, sq, i))
	lbl(v, "Renovar contrato:", 24)
	for of in O.OFERTAS:
		var pr: Dictionary = O.proposta_renovar(p, of, 2)
		btn(v, "%s · 2 anos · %s · aceita %d%%" % [O.OFERTAS[of].nome, O.money(pr.custo), jr100(pr.chance)], func(): var r: Dictionary = O.renovar(g, sq, i, of, 2); toast(r.msg); ficha_slot(g, sq, i))
	if not p.get("estrela", false):
		btn(v, "Vender (%s)" % O.money(O.valor_venda(p)), func(): var r: Dictionary = O.vender(g, sq, i); toast(r.msg); close_modal())
		btn(v, "Dispensar", func(): var r: Dictionary = O.dispensar(g, sq, i); toast(r.msg); close_modal())
		for o in O.SQUADS:
			if o != sq and O.S.games[g].squads[o].on: btn(v, "Mover para " + O.SQUADS[o].nome, func(): var r: Dictionary = O.mover(g, sq, o, i); toast(r.msg); close_modal())
func _base_card(g) -> void:
	var nv: int = O.infra_nivel("base", g)
	var c = card("Categoria de base (nível %d)" % nv)
	if nv == 0: lbl(c, "Compre a Categoria de base em Negócios para revelar jovens a cada split.", 22, DIM); return
	lbl(c, "Vagas %d/%d · custo %s/sem" % [O.S.base.get(g, []).size(), O.cap_base(nv), O.money(O.custo_base(g))], 22, DIM)
	for p in O.S.base.get(g, []):
		var pv: Dictionary = O.pot_visivel(p, g); var b = Button.new(); b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.custom_minimum_size.y = 64; b.clip_text = true
		b.text = "%s %s (%s) %da · nota %d · pot %s%s" % [p.r, p.n, p.c, p.a, p.o, stars(pv.estrelas), "?" if pv.incerto else ""]
		b.pressed.connect(func(): ficha_base(g, p)); c.add_child(b)
func ficha_base(g, p) -> void:
	var v = modal("%s (base)" % p.n)
	var pv: Dictionary = O.pot_visivel(p, g)
	lbl(v, "%s · %s · %d anos · nota %d · potencial %s%s%s" % [p.r, p.c, p.a, p.o, stars(pv.estrelas), "?" if pv.incerto else "", " · JOIA RARA" if p.get("genio", false) else ""], 24)
	lbl(v, "Moral %s · XP %d/%d" % [O.moral_rot(p.mo), p.mo, O.xp_necessario(p.o)], 22, DIM)
	if p.get("tr") != null: lbl(v, "Traço: %s — %s" % [O.TRACOS[p.tr].nome, O.TRACOS[p.tr].desc], 22, GOLD)
	var fs = []
	for f in O.FOCOS: fs.append([f, O.FOCOS[f].nome])
	chips(v, fs, p.foco, func(id): O.trocar_foco(g, "base", p.id, id); ficha_base(g, p))
	for sq in O.SQUADS:
		if O.S.games[g].squads[sq].on: btn(v, "Promover para " + O.SQUADS[sq].nome, func(): var r: Dictionary = O.promover_base(g, sq, p.id); toast(r.msg); close_modal(), false, true)
	btn(v, "Vender (%s)" % O.money(O.valor_venda(p)), func(): var r: Dictionary = O.vender_base(g, p.id); toast(r.msg); close_modal())
	btn(v, "Dispensar", func(): var r: Dictionary = O.dispensar_base(g, p.id); toast(r.msg); close_modal())

# ---------- Mercado ----------
func vmercado() -> void:
	var g = game; var roles: Array = O.GAMES[g].roles
	var c = card("Mercado · contratar para " + O.SQUADS[squad].nome)
	if not O.S.games[g].squads[squad].on: lbl(c, "Crie esse time na aba Elenco.", 24, DIM); return
	var its = [["", "Todos"]]; for r in roles: its.append([r, r])
	chips(c, its, merc.role, func(id): merc.role = id; merc.n = 25; render())
	var tg = CheckButton.new(); tg.text = "Só quem posso pagar"; tg.button_pressed = merc.pay; tg.toggled.connect(func(on): merc.pay = on; render()); c.add_child(tg)
	var lst: Array = O.livres(g).filter(func(p): return (merc.role == "" or p.r == merc.role) and (not merc.pay or O.S.org.caixa >= O.fee(p.o)))
	lst.sort_custom(func(a, b): return a.o > b.o or (a.o == b.o and a.id < b.id))
	var c2 = card("%d jogadores" % lst.size())
	for p in lst.slice(0, merc.n):
		var h = hrow(c2); var b = Button.new(); b.alignment = HORIZONTAL_ALIGNMENT_LEFT; b.size_flags_horizontal = Control.SIZE_EXPAND_FILL; b.custom_minimum_size.y = 64; b.clip_text = true
		b.text = "%s %s · %d · %sa · %s" % [p.r, p.n, p.o, str(p.get("a", "?")), p.t]; b.pressed.connect(func(): ficha_mercado(g, p)); h.add_child(b)
		btn(h, O.money(O.fee(p.o)), func(): res(O.contratar(g, squad, p)), O.S.org.caixa < O.fee(p.o))
	if lst.size() > merc.n: btn(c2, "Mostrar mais", func(): merc.n += 25; render())
func ficha_mercado(g, p) -> void:
	var v = modal(p.n)
	var pv: Dictionary = O.pot_visivel(O.iniciar_jogador(p.duplicate()), g)
	lbl(v, "%s · %s (%s) · nota %d · %s anos · %s" % [p.r, p.t, p.l, p.o, str(p.get("a", "?")), str(p.get("c", ""))], 26)
	lbl(v, "Potencial %s%s (%d–%d)" % [stars(pv.estrelas), "?" if pv.incerto else "", pv.lo, pv.hi], 24, DIM)
	lbl(v, "Contratação %s · salário %s/sem" % [O.money(O.fee(p.o)), O.money(O.salary(p.o))], 24)
	btn(v, "Contratar para " + O.SQUADS[squad].nome, func(): var r: Dictionary = O.contratar(g, squad, p); toast(r.msg); close_modal(), false, true)

# ---------- Agenda (calendário geral: todos os jogos juntos) ----------
func vcal() -> void:
	var itens = []; var res_l = []
	for g in O.GAMES:
		if not O.ativo(g) or not O.aberto(g): continue
		for sq in O.SQUADS:
			var c = O.comp_for(g, sq)
			if c == null: continue
			for a in O.agenda(g, sq, 6): a["tag"] = O.tag_de(g, sq); itens.append(a)
			for l in c.last: var x: Dictionary = l.duplicate(); x["tag"] = O.tag_de(g, sq); res_l.append(x)
	itens.sort_custom(func(a, b): return a.em < b.em)
	var c1 = card("Próximas partidas")
	if itens.is_empty(): lbl(c1, "Nada agendado: complete os titulares de um time.", 24, DIM)
	for a in itens.slice(0, 14):
		var t = "%s · sem. +%d · %s" % [a.data.txt, a.em, a.tag]
		lbl(c1, t, 20, DIM); lbl(c1, "%s%s" % [a.label, (" — vs " + str(a.op)) if a.op != null else ""], 24)
	var c2 = card("Resultados")
	if res_l.is_empty(): lbl(c2, "Ainda sem jogos.", 24, DIM)
	res_l.sort_custom(func(a, b): return a.y * 100 + a.s > b.y * 100 + b.s)
	for r in res_l.slice(0, 20): lbl(c2, "%s · S%d/%d · %s %s vs %s (%s)" % [r.tag, r.s, r.y, "V" if r.v else "D", r.pl, r.op, r.f], 22, OK if r.v else BAD)

# ---------- Ligas ----------
func vligas() -> void:
	var g = game; var its = []
	for sq in O.SQUADS:
		if O.S.games[g].squads[sq].on: its.append([sq, O.SQUADS[sq].nome.split(" (")[0]])
	var c0 = card(); chips(c0, its, squad, func(id): squad = id; render())
	var c = O.comp_for(g, squad)
	if c == null: lbl(card(), "Ative esse time.", 24, DIM); return
	var cc = card("%s · %s · split %d" % [gname(g), O.regiao_de(g), c.split])
	if c.phase == "reg" or c.phase == "po":
		var cls: Array = O.classificacao(c); var k = 0
		for r in cls:
			k += 1; lbl(cc, "%2d. %s  %d-%d  (força %.1f)" % [r.pos, r.n, r.w, r.l, r.f], 22, GOLD if r.eu else TXT)
	else: lbl(cc, "Fase: " + {"off": "entressafra", "wait": "aguardando titulares", "intl": "internacional"}.get(c.phase, c.phase), 24, DIM)
	if c.phase == "intl":
		var ci = card("Internacional: " + O.intl_def(g)[c.intl.tipo].nome)
		for i in c.intl.alive: lbl(ci, O.nome_t(c.intl.teams[i]), 22, GOLD if c.intl.teams[i].eu else TXT)
	var ch = card("Campeões recentes")
	for h in c.hist: lbl(ch, "%d · split %d · %s (vice %s)%s" % [h.y, h.s, h.camp, h.vice, (" · você: " + str(h.eu)) if h.eu != null else ""], 22)
	var ci2 = card("Internacionais")
	for x in O.S.intlHist.filter(func(x): return x.g == g).slice(0, 10): lbl(ci2, "%d · %s · %s%s" % [x.y, x.nome, x.camp, (" · você: " + str(x.eu)) if x.eu != null else ""], 22)

# ---------- Negócios ----------
func vneg() -> void:
	var S = O.S; var g = game
	if S.evento != null:
		var e = null
		for x in O.EVENTOS:
			if x.id == S.evento.id: e = x
		var ce = card("Evento"); lbl(ce, e.txt, 26); lbl(ce, "Expira em %d sem." % S.evento.sem, 20, DIM)
		for i in e.ops.size(): var ii = i; btn(ce, e.ops[i].t, func(): res(O.escolher_evento(ii)))
	var cf = card("Foco da semana")
	chips(cf, [["nenhum", "Nenhum"], ["treino", "Treino (+custo de moral)"], ["midia", "Mídia (R$ 3 mil/sem)"]], S.foco, func(id): res(O.set_foco(id)))
	var cp = card("Patrocínios (%d/3) · renda %s/sem" % [S.patro.size(), O.money(O.renda_patro())])
	for x in S.patro: lbl(cp, "%s · %s/sem · %d sem." % [x.n, O.money(x.pay), x.sem], 22)
	for o in O.ofertas():
		var h = hrow(cp); lbl(h, "%s · %s/sem · %d sem." % [o.n, O.money(o.pay), o.sem], 22); btn(h, "Fechar", func(): res(O.aceitar_patro(o.id)))
	var ci = card("Estrutura · " + gname(g))
	for it in O.INFRA:
		var nv: int = O.infra_nivel(it.id, g); var h = hrow(ci)
		lbl(h, "%s  nv %d/%d\n%s" % [it.nome, nv, it.max, it.desc], 22)
		btn(h, "Maxímo" if nv >= it.max else O.money(O.infra_custo(it, g)), func(): res(O.comprar_infra(it.id, g)), nv >= it.max)
	var cl_ = card("Loja (renova a cada 4 sem.)")
	for it in O.loja_itens():
		var h = hrow(cl_); lbl(h, "%s\n%s" % [it.nome, it.desc], 22)
		btn(h, "Ativo" if O.item_ativo(it, g) else O.money(it.c), func(): res(O.comprar_loja(it.id, g)), O.item_ativo(it, g))
	for it in S.itens: lbl(cl_, "Ativo: %s (%d sem.)" % [it.nome, it.sem], 20, DIM)
	var ca = card("Abrir novos jogos")
	var algum = false
	for x in S.ordem:
		if O.aberto(x): continue
		algum = true; var d: Dictionary = O.desbloqueio(x); var falta: int = d.sem - S.tempo; var h = hrow(ca)
		lbl(h, "%s · %s" % [O.GAMES[x].nome, ("em %d sem." % falta) if falta > 0 else "disponível"], 22)
		btn(h, O.money(d.custo), func(): var r: Dictionary = O.abrir_jogo(x); toast(r.msg); if r.ok: game = x; render(), falta > 0 or S.org.caixa < d.custo)
	if not algum: lbl(ca, "Todos os jogos abertos.", 22, DIM)

# ---------- Hall ----------
func vhall() -> void:
	var g = game; var H: Dictionary = O.hist_de(g); var real: Dictionary = O.HIST.get(g, {})
	var tor: Array = []
	if g == "lol":  # história real do LoL (Mundial e MSI) vem do LOLX
		for y in O.LOLX.get("wct", {}):
			tor.append({"n": "Mundial " + str(y), "a": int(y), "tp": "WORLDS", "c": O.LOLX.wct[y], "v": O.LOLX.get("wcv", {}).get(y, "?"), "p": ""})
		for y in O.LOLX.get("mst", {}):
			tor.append({"n": "MSI " + str(y), "a": int(y), "tp": "MSI", "c": O.LOLX.mst[y], "v": O.LOLX.get("msv", {}).get(y, "?"), "p": ""})
	for t in real.get("torneios", []): tor.append(t)
	for t in H.torneios: tor.append(t)
	var anos = {}
	for t in tor: anos[int(t.a)] = true
	for y in O.S.bo.get(g, {}): anos[int(y)] = true
	var ys: Array = anos.keys(); ys.sort(); ys.reverse()
	if ys.is_empty(): lbl(card("Hall"), "Sem histórico para este jogo ainda.", 24, DIM); return
	if hy == 0 or not ys.has(hy): hy = ys[0]
	var cn = card("Torneios por ano")
	var h = hrow(cn)
	var i: int = ys.find(hy)
	btn(h, "◀", func(): hy = ys[min(i + 1, ys.size() - 1)]; render(), i >= ys.size() - 1)
	lbl(h, str(hy), 34, GOLD).horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	btn(h, "▶", func(): hy = ys[max(i - 1, 0)]; render(), i <= 0)
	var ya = []; for y in ys.slice(0, 40): ya.append([y, str(y)])
	chips(cn, ya.slice(0, 16), hy, func(id): hy = int(id); render())
	for t in tor:
		if int(t.a) != hy: continue
		var ct = card("%s%s" % [t.n, " (simulado)" if t.get("sim", 0) else ""])
		lbl(ct, "Campeão: %s  ·  vice %s%s" % [t.c, str(t.v), (" · " + str(t.p)) if str(t.get("p", "")) != "" else ""], 24, GOLD if t.c == O.S.org.nome else TXT)
		if t.get("mvp") != null: lbl(ct, "MVP: %s (%s)" % [t.mvp[0], t.mvp[1]], 20, DIM)
	var B = O.S.bo.get(g, {}).get(str(hy))
	if B != null:
		var cb = card("Bola de Ouro %d (Top 10)" % hy)
		for k in B.t.size(): lbl(cb, "%d. %s (%s) · nota %s" % [k + 1, B.t[k][0], B.t[k][1], str(B.t[k][2])], 22, GOLD if k == 0 else TXT)
		var ctoy = card("Time do ano %d" % hy)
		for x in B.a: lbl(ctoy, "%s · %s (%s)" % [x[0], x[1], x[2]], 22)
	var cl_ = card("Aposentadorias de lendas")
	var ap: Array = O.aposentados(g)
	if ap.is_empty(): lbl(cl_, "Nenhuma ainda.", 22, DIM)
	for x in ap.slice(0, 10): lbl(cl_, "%d · %s (%da) · pico %d" % [x.ano, x.nick, x.idade, x.o], 22)
