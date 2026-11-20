// Cena "Lan House Tycoon" (modelo novo: itens com limite + niveis).
// o[] (12 inteiros): 0 PC(0-12) 1 Placa(0-6) 2 Ar(0-4) 3 Atendente(0-3) 4 SSD(0-5) 5 Monitor(0-5)
// 6 Cantina(0-6) 7 Internet(0-5) 8 Campeonato(0-6) 9 Sala VIP(0-3) 10 Filial(0-4) 11 Arena(0-1)
// x (opcional): {ev:null|'apagao'|'bonus', combo:0..30, ...}
(function () {
  var X, T = 0, PA = [], lastSp = -9;
  for (var q = 0; q < 24; q++) PA.push({ a: 0, x: 0, y: 0, vx: 0, vy: 0, t0: null, k: 0 });
  var SKIN = ['#f2c9a0', '#d9a06b', '#b87a4b', '#8a5a3a'];
  var SHIRT = ['#e63946', '#3a86ff', '#2a9d8f', '#f4a261', '#9b5de5', '#fee440'];
  var SCR = ['#46e6ff', '#7dff9a', '#ffb347', '#ff6bd6'];
  var CHIP = ['#e63946', '#f4a261', '#ffd23f', '#2a9d8f', '#3a86ff'];
  var NEON = ['#ff4fd8', '#4ff0ff', '#ffe14f', '#7dff6a', '#ff7a4f'];
  var MAXV = [12, 6, 4, 3, 5, 5, 6, 5, 6, 3, 4, 1];
  var NETL = ['', '256k', '2 Mb', '35 Mb', '300 Mb', '1 Giga'];
  var CROWD = [0, 2, 4, 4, 8, 12, 18];
  var PX = [46, 59, 72];
  var V = { gpu: 0, ssd: 0, mon: 0 };

  function G(o, i) {
    var v = o && +o[i];
    if (!(v > 0)) return 0;
    v = Math.floor(v);
    return v > MAXV[i] ? MAXV[i] : v;
  }
  function hs(n) { var s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function rect(c, x, y, w, h) { X.fillStyle = c; X.fillRect(x, y, w, h); }
  function dot(c, x, y, r) { X.fillStyle = c; X.beginPath(); X.arc(x, y, r, 0, 6.2832); X.fill(); }
  function txt(s, x, y, c, px, al) { X.font = 'bold ' + px + 'px monospace'; X.textAlign = al || 'center'; X.fillStyle = c; X.fillText(s, x, y); }
  function A(a) { X.globalAlpha = a; }
  function HC(h, l) { return 'hsl(' + ((((h % 360) + 360) % 360) | 0) + ',95%,' + (l || 60) + '%)'; }
  function mix(a, b, k) { return (a + (b - a) * k) | 0; }
  function tri(c, x1, y1, x2, y2, x3, y3) { X.fillStyle = c; X.beginPath(); X.moveTo(x1, y1); X.lineTo(x2, y2); X.lineTo(x3, y3); X.fill(); }

  function person(x, y, i, bob, hair) {
    rect(SHIRT[i % 6], x - 6, y + 3 + bob * 0.5, 12, 5);
    dot(SKIN[(i * 7) % 4], x, y + bob, 3.2);
    rect(hair || '#2b2118', x - 3.2, y - 3.4 + bob, 6.4, 2.2);
  }
  function trophy(x, y, s) {
    rect('#ffd23f', x - 3 * s, y, 6 * s, 4.5 * s);
    rect('#ffd23f', x - 0.6 * s, y + 4.5 * s, 1.2 * s, 2.5 * s);
    rect('#c9a021', x - 2.5 * s, y + 7 * s, 5 * s, 1.5 * s);
    rect('#fff3a0', x - 2 * s, y + 0.6 * s, 1 * s, 3 * s);
  }

  // Um monitor: m=nivel do monitor, w/h, sc=cor da tela
  function screen(x, y, w, h, i, sc, sc2) {
    var m = V.mon, k, pr;
    if (m === 0) {
      rect('#25252c', x + 2, y + h, w - 4, 3);
      rect('#9a9a8c', x - 0.5, y - 0.5, w + 1, h + 1);
    }
    rect('#16161c', x, y, w, h);
    var ins = m === 0 ? 1.8 : m >= 4 ? 0.6 : m >= 3 ? 0.9 : 1.2;
    rect(sc, x + ins, y + ins, w - ins * 2, h - ins * 2);
    if (sc2) rect(sc2, x + ins, y + h * 0.5, w - ins * 2, h * 0.5 - ins);
    A(0.8); rect('#fff', x + ins + (T * 18 + i * 5) % Math.max(2, w - ins * 2 - 2), y + ins + (i * 3) % Math.max(1, h - 4), 2, 1); A(1);
    if (m <= 1) { A(0.2); for (k = 1; k < h - 1; k += 2) rect('#000', x + ins, y + k, w - ins * 2, 0.8); A(1); }
    if (m >= 3) { A(0.28); rect('#fff', x + ins, y + ins, (w - ins * 2) * 0.35, 0.9); A(1); }
    if (V.ssd > 0) {
      pr = (T * (0.4 + V.ssd * 0.55) + i * 0.13) % 1.5; if (pr > 1) pr = 1;
      rect('#0a0a10', x + ins, y + h - ins - 1.4, w - ins * 2, 1.4);
      rect(V.ssd >= 4 ? '#ffe14f' : '#7dff9a', x + ins, y + h - ins - 1.4, (w - ins * 2) * pr, 1.4);
    }
  }

  // Um posto de PC: cx = centro, dy = linha da mesa
  function pc(i, cx, dy) {
    var g = V.gpu, m = V.mon, bob = Math.sin(T * 5 + i * 1.9) * 0.8, sc, sc2 = null, gc, tw;
    if (g === 0) sc = '#6a8a7a';
    else if (g <= 2) sc = (((T * 2 + i) | 0) % 2) ? '#3aa0ff' : '#68c2ff';
    else if (g <= 4) sc = HC(T * 70 + i * 50, 56);
    else sc = HC(T * 140 + i * 50, 62);
    gc = g <= 2 ? '#3aa0ff' : g <= 4 ? HC(T * 70 + i * 50, 58) : HC(T * 140 + i * 50, 62);
    if (m >= 4 && g > 0) sc2 = g <= 2 ? '#2a78d8' : HC(T * 70 + i * 50 + 70, 50);
    else if (m >= 4) sc2 = '#587868';
    person(cx, dy - 17, i, bob, i % 3 ? '#2b2118' : '#d8b04a');
    if (i % 2) { rect('#222', cx - 4, dy - 18 + bob, 1.5, 4); rect('#222', cx + 2.5, dy - 18 + bob, 1.5, 4); }
    if (g >= 3) { A(0.1 + (g >= 5 ? 0.12 : 0) + 0.04 * Math.sin(T * 4 + i)); rect(gc, cx - 14, dy - 14, 28, 17); A(1); }
    if (m >= 5) {
      screen(cx - 11.5, dy - 11, 11, 9, i, sc, sc2);
      screen(cx + 0.5, dy - 11, 11, 9, i + 7, sc, sc2);
      tw = 12;
    } else {
      var w = [11, 12, 13, 15, 17][m], h = m >= 3 ? 9 : 10;
      screen(cx - w / 2, dy - 1 - h, w, h, i, sc, sc2);
      tw = w / 2 + 2;
    }
    rect('#2c2c34', cx - 1, dy - 1.5, 2, 1.5);
    rect('#cfd2d6', cx - 5, dy - 1, 10, 2);
    if (g >= 3) { rect(HC(T * 90 + i * 30, 60), cx - 5, dy + 0.2, 3, 0.8); rect(HC(T * 90 + i * 30 + 120, 60), cx - 1.5, dy + 0.2, 3, 0.8); rect(HC(T * 90 + i * 30 + 240, 60), cx + 2, dy + 0.2, 3, 0.8); }
    rect('#6b4a2f', cx - 11, dy + 1, 22, 3); rect('#4d341f', cx - 11, dy + 4, 22, 6);
    if (g > 0) {
      // torre com placa de video
      var tx = cx + tw, ty = dy - 10;
      rect('#23232c', tx, ty, 5, 10);
      A(0.9); rect(gc, tx + 0.8, ty + 1, 3.4, 5); A(1);
      dot('#0d0d14', tx + 2.5, ty + 3.5, 1.4);
      A(0.5 + 0.5 * Math.sin(T * (6 + g) + i)); dot('#fff', tx + 2.5, ty + 3.5, 0.6); A(1);
      A(0.8); rect(gc, cx - 10, dy + 9.2, 20, 1.2); A(1);
      if (g >= 5) { A(0.35); rect(gc, cx - 12, dy + 10, 24, 3); A(1); }
    }
    if (V.ssd >= 4) {
      for (var k = 0; k < 2; k++) {
        var ph = (T * 1.6 + k * 0.5 + i * 0.21) % 1;
        A(1 - ph); rect('#fff3a0', cx + tw + 1 + k * 2 + Math.sin(T * 9 + k + i) * 1.5, dy - 12 - ph * 9, 1.2, 1.2);
      }
      A(1);
    }
  }

  SCENES.lan = {
    h: 230,
    draw: function (ctx, W, H, o, t, xs) {
      X = ctx; T = t || 0; t = T;
      X.textBaseline = 'alphabetic';
      var p = G(o, 0), gpu = G(o, 1), ac = G(o, 2), at = G(o, 3), ssd = G(o, 4), mn = G(o, 5), cant = G(o, 6),
        net = G(o, 7), cs = G(o, 8), vip = G(o, 9), fil = G(o, 10), ar = G(o, 11);
      var ev = xs && xs.ev, combo = xs && +xs.combo > 0 ? Math.min(30, +xs.combo) : 0;
      V.gpu = gpu; V.ssd = ssd; V.mon = mn;
      var sum = 0, i, k, x, y, g, c, tot = 0;
      for (i = 0; i < 12; i++) { var gv = G(o, i); sum += gv / MAXV[i]; tot += gv; }
      var lvl = Math.min(1, sum / 7), poor = tot < 2;

      // ---------- Ceu, skyline, filiais, arena ----------
      g = X.createLinearGradient(0, 0, 0, 80);
      g.addColorStop(0, ar > 0 ? '#1d1042' : '#0a0e2a'); g.addColorStop(1, ar > 0 ? '#d68a2e' : '#2a3260');
      X.fillStyle = g; X.fillRect(0, 0, W, 84);
      for (i = 0; i < 16; i++) { A(0.3 + 0.5 * Math.abs(Math.sin(t * 1.7 + i * 2.3))); rect(ar > 0 ? '#ffe9a6' : '#fff', hs(i) * W, hs(i + 40) * 38, 1.2, 1.2); }
      A(1);
      dot('#f4efcf', W * 0.5, 15, 6); dot(ar > 0 ? '#2a1850' : '#101640', W * 0.5 + 3, 13, 5.5);
      for (x = -4, k = 0; x < W; x += 16, k++) {
        var bh = 12 + hs(k) * 28;
        rect('#141a38', x, 80 - bh, 15, bh);
        for (i = 0; i < 2; i++) {
          if (hs(k * 3 + i) > 0.5) { A(0.5 + 0.4 * Math.sin(t * 0.8 + k + i)); rect('#ffd66b', x + 3 + i * 6, 80 - bh + 4 + (hs(k + i) * 8 | 0), 3, 3); }
        }
      }
      A(1);
      for (i = 0; i < fil; i++) {
        x = 4 + i * 38; c = NEON[i % 5];
        rect('#262a4c', x, 54, 34, 24); rect('#1a1d38', x, 54, 34, 3);
        for (k = 0; k < 4; k++) rect(k % 2 ? '#f0f0f0' : '#e63946', x + k * 8.5, 57, 8.5, 4);
        A(0.55 + 0.45 * Math.sin(t * 3 + i * 2)); rect(c, x + 3, 63, 28, 7); A(1);
        txt('LAN ' + (i + 2), x + 17, 69, '#10101c', 6);
        rect('#101424', x + 4, 71, 8, 7); rect('#3a4a7a', x + 17, 72, 13, 5);
      }
      if (ar > 0) {
        var cx = W * 0.74;
        var ang = Math.sin(t * 1.1) * 0.6, bx = cx + Math.sin(ang) * 70;
        A(0.16); tri('#fff6c8', cx - 3, 24, bx - 9, -4, bx + 9, -4); A(1);
        rect('#2b2f5e', cx - 33, 52, 66, 28);
        X.fillStyle = '#4048a0'; X.beginPath(); X.arc(cx, 52, 33, Math.PI, 0); X.fill();
        rect(HC(t * 60, 55), cx - 33, 58, 66, 2);
        for (i = 0; i < 6; i++) { A(0.5 + 0.5 * Math.sin(t * 3 + i)); dot('#fff6c8', cx - 25 + i * 10, 47 - Math.sin(i / 5 * 3.14) * 6, 1.3); }
        A(1);
        txt('ARENA', cx, 74, '#ffe9a6', 8);
        rect('#888', cx, 14, 1, 8); rect('#ffd23f', cx + 1, 14, 7 + Math.sin(t * 4) * 1.5, 4);
      }

      // ---------- Sala: teto, parede, piso ----------
      rect('#0d0f1f', 0, 78, W, 7); rect('#2a2d52', 0, 78, W, 1);
      g = X.createLinearGradient(0, 85, 0, 170);
      g.addColorStop(0, 'rgb(' + mix(62, 38, lvl) + ',' + mix(54, 40, lvl) + ',' + mix(60, 110, lvl) + ')');
      g.addColorStop(1, 'rgb(' + mix(50, 28, lvl) + ',' + mix(44, 30, lvl) + ',' + mix(52, 84, lvl) + ')');
      X.fillStyle = g; X.fillRect(0, 85, W, 85);
      rect('#17121f', 0, 166, W, 4);
      rect('rgb(' + mix(74, 30, lvl) + ',' + mix(62, 36, lvl) + ',' + mix(54, 64, lvl) + ')', 0, 170, W, 60);
      A(0.25); for (y = 180; y < 230; y += 14) rect('#000', 0, y, W, 1); A(1);
      if (lvl > 0.5) { A(0.08); for (x = 0; x < W; x += 20) rect('#8a7aff', x, 170, 10, 60); A(1); }
      if (lvl > 0.45) { A(0.8); for (k = 0; k < 16; k++) rect(HC(t * 60 + k * 22, 55), k * W / 16, 83, W / 16 + 1, 1.5); A(1); }

      // zonas
      var hasB = at > 0 || cant > 0, hasR = cs > 0 || vip > 0;
      var lm = hasB ? 78 : 6;
      var rm = hasR ? Math.max(86, Math.floor(W * 0.27)) : 6;
      var aw = W - lm - rm, x0 = lm, mid = x0 + aw / 2;
      var sx = W - rm + 3, sw = rm - 8;

      // luzes do teto
      if (ac === 0) {
        rect('#222', mid, 85, 1, 9);
        A(hs(Math.floor(t * 9)) > 0.93 ? 0.08 : 0.18); dot('#ffe9a6', mid, 96, 15); A(1);
        dot('#ffe9a6', mid, 96, 3.5);
      } else {
        var nt = 1 + Math.min((lvl * 6) | 0, 4);
        for (i = 0; i < nt; i++) {
          x = W * (i + 1) / (nt + 1) - 13;
          A(0.12); rect('#cfe8ff', x - 3, 86, 32, 5); A(1); rect('#eaf6ff', x, 85, 26, 3);
        }
      }

      // ---------- Ar-condicionado ----------
      if (ac === 1) {
        // ventilador de pe (desenhado depois dos PCs)
      } else if (ac >= 2) {
        var nsp = ac >= 3 ? 2 : 1;
        for (i = 0; i < nsp; i++) {
          x = 6 + i * 44;
          rect('#e9edf2', x, 86, 40, 10); rect('#b9c0cc', x, 94, 40, 2); rect('#8f99a8', x + 3, 91, 34, 2);
          dot(Math.sin(t * 3 + i) > 0 ? '#5cff8a' : '#2a8a48', x + 35, 88, 1.2);
          if (ac === 2 && i === 0) txt('9k', x + 8, 90, '#6a7484', 5);
          for (k = 0; k < 3; k++) {
            var ph = (t * 0.8 + k * 0.33 + i * 0.2) % 1;
            A(0.55 * (1 - ph)); rect('#bfefff', x + 7 + k * 12 + Math.sin(t * 3 + k + ph * 5) * 3, 97 + ph * 26, 1.6, 5);
          }
          A(1);
        }
        if (ac >= 4) {
          for (i = 0; i < 3; i++) {
            x = W * (0.3 + 0.2 * i);
            rect('#c9d0da', x - 12, 85, 24, 4); rect('#8f99a8', x - 12, 88, 24, 1);
            for (k = 0; k < 5; k++) {
              var ph2 = (t * 0.6 + k * 0.2 + i * 0.3) % 1;
              A(0.4 * (1 - ph2)); rect('#dff6ff', x - 10 + k * 5 + Math.sin(t * 2 + k + i) * 2, 90 + ph2 * 60, 2.5, 6 + ph2 * 6);
            }
            A(1);
          }
          rect('#e9edf2', mid + 56, 112, 9, 10); txt('18', mid + 60.5, 119.5, '#2a7ad8', 6);
        }
      }

      // letreiro
      if (poor) {
        rect('#4b3a24', mid - 44, 95, 88, 19); rect('#7a6446', mid - 42, 97, 84, 15);
        txt('LAN HOUSE', mid, 108, '#f1e4c0', 11);
        txt('R$ 2 / hora', mid, 124, '#cbbf9f', 7);
      } else {
        c = NEON[(t / 2 | 0) % 5];
        var on = hs(Math.floor(t * 7)) > 0.07 ? 1 : 0.45;
        rect('#120d1c', mid - 44, 93, 88, 27);
        A(0.7 * on); rect(c, mid - 44, 93, 88, 1.5); rect(c, mid - 44, 118.5, 88, 1.5); rect(c, mid - 44, 93, 1.5, 27); rect(c, mid + 42.5, 93, 1.5, 27);
        A(0.3 * on); txt('LAN HOUSE', mid + 1, 108, c, 13); A(on); txt('LAN HOUSE', mid, 107, c, 13); A(1);
        txt(fil > 0 ? 'REDE OFICIAL' : 'R$ 2 / hora', mid, 116, '#d7dbea', 7);
      }
      // posters
      if (p >= 2) { rect('#d62828', x0 + 4, 94, 14, 20); txt('CS', x0 + 11, 106, '#fff', 7); }
      if (p >= 5) { rect('#5b3fd0', x0 + 19, 98, 12, 16); txt('LoL', x0 + 25, 108, '#ffd23f', 6); }

      // ---------- Internet: roteador, antena, cabos ----------
      if (net > 0) {
        var rx = x0 + aw - 28, ry = 104;
        rect('#2b2f3a', rx, ry, 22, 6); rect('#14161c', rx, ry + 5, 22, 1);
        rect('#555', rx + 3, ry - 8, 1.5, 8); dot('#777', rx + 3.7, ry - 8, 1.4);
        if (net >= 3) { rect('#555', rx + 17, ry - 10, 1.5, 10); dot('#777', rx + 17.7, ry - 10, 1.4); }
        for (k = 0; k < 4; k++) dot(net >= 5 ? (Math.sin(t * 8 + k * 1.7) > -0.3 ? '#5cff8a' : '#1f6a3a') : (Math.sin(t * (2 + k) + k) > 0 ? '#ffb347' : '#6a4a1a'), rx + 8 + k * 3.4, ry + 3, 0.9);
        if (net >= 3) {
          X.strokeStyle = '#7dd8ff'; X.lineWidth = 1;
          for (k = 0; k < 2; k++) { A(0.2 + 0.6 * ((t * 1.3 + k * 0.5) % 1 < 0.5 ? 1 : 0.3)); X.beginPath(); X.arc(rx + 17.7, ry - 10, 4 + k * 4, -2.4, -0.7); X.stroke(); }
          A(1);
        }
        if (net >= 5) {
          txt('PING 8ms', rx + 11, ry + 15, '#5cff8a', 6);
          for (k = 0; k < 4; k++) rect('#5cff8a', rx + 1 + k * 3, ry + 24 - k * 1.8, 2, 1.8 + k * 1.8);
        }
        var cy = 219, cwd = net >= 3 ? 3 : 2, np = 1 + net, spd = 40 + net * 14;
        rect('#5a4310', x0 + aw, ry + 6, 1.5, cy - ry - 6);
        A(0.8); rect(net >= 4 ? '#7dffe0' : '#ffcf4a', x0 + aw + 0.4, ry + 6, 0.7, cy - ry - 6); A(1);
        for (k = 0; k < (net >= 4 ? 2 : 1); k++) {
          var ly = cy + k * 4;
          rect('#5a4310', 0, ly, W, cwd); A(0.8); rect(net >= 4 ? '#7dffe0' : '#ffcf4a', 0, ly + 0.5, W, cwd - 1); A(1);
          for (i = 0; i < np; i++) {
            var px = (t * spd + i * W / np + k * 23) % W;
            A(0.35); rect('#fff6c8', px - 12, ly, 12, cwd); A(1); rect('#fffbe0', px, ly - 0.5, 3, cwd + 1);
          }
        }
        txt(net >= 4 ? 'FIBRA ' + NETL[net] : net === 1 ? 'RADIO ' + NETL[net] : NETL[net].indexOf('Mb') > 0 && net === 2 ? 'ADSL ' + NETL[net] : 'CABO ' + NETL[net], 3, 216, '#ffcf4a', 6, 'left');
      }

      // ---------- Balcao / atendentes / cantina ----------
      if (hasB) {
        var cw = lm - 6;
        A(0.4); rect('#1a0f08', 2, 112, cw + 2, 54); A(1);
        if (cant >= 1) {
          var jx0 = cant >= 4 ? 26 : 6, nj = Math.floor((lm - 4 - jx0) / 7);
          rect('#5b3d24', jx0 - 2, 133, nj * 7 + 2, 2);
          for (i = 0; i < nj; i++) { rect(CHIP[(i * 3) % 5], jx0 + i * 7, 125, 5.4, 8); rect('#eee', jx0 + i * 7, 123.5, 5.4, 1.6); }
        }
        if (cant >= 4) {
          rect('#d8dde6', 4, 116, 19, 48); rect('#7fb6d6', 6, 119, 15, 42);
          A(0.18 + 0.05 * Math.sin(t * 3)); rect('#fff', 6, 119, 15, 42); A(1);
          for (k = 0; k < 3; k++) for (i = 0; i < 3; i++) rect(CHIP[(k + i * 2) % 5], 7.5 + i * 4.6, 123 + k * 12, 3, 8);
        }
        for (i = 0; i < at; i++) person(PX[i], 152, i + 2, Math.sin(t * 2 + i) * 0.8, '#5a2d12');
        rect('#3f2a18', 4, 168, cw, 56); rect('#5a3d22', 4, 168, cw, 3);
        rect('#9a6a3c', 2, 164, cw + 4, 5);
        // caixa registradora
        rect('#2a2a33', 6, 156, 12, 8); rect('#7dff9a', 8, 157.5, 8, 2.5); rect('#14141a', 8, 161, 8, 2);
        if (cant >= 2) {
          rect('#bcd8e8', 22, 150, 22, 14); A(0.45); rect('#ffcf70', 22, 150, 22, 14); A(1);
          rect('#8a8a96', 22, 149, 22, 1.5);
          var nc = cant >= 3 ? 5 : 3;
          for (i = 0; i < nc; i++) { var tx = 24 + (i % 3) * 6.5, ty = 154 + (i / 3 | 0) * 6; tri('#d98b2b', tx, ty + 5, tx + 2.6, ty - 1, tx + 5.2, ty + 5); }
          if (Math.sin(t * 2) > 0) { A(0.4); rect('#fff', 28 + Math.sin(t) * 4, 142 - (t * 6 % 6), 1.2, 4); A(1); }
        }
        if (cant >= 6) {
          for (k = 0; k < 5; k++) { rect('#c9c9d0', 46 + k * 6.5, 160, 6, 4); rect(CHIP[k], 47 + k * 6.5, 158.5, 4, 2); }
          A(0.4); for (k = 0; k < 3; k++) rect('#fff', 49 + k * 9 + Math.sin(t * 2 + k) * 2, 150 - (t * 8 + k * 3) % 10, 1.2, 4); A(1);
          rect('#5a2d12', 6, 108, cw - 4, 9); txt('BUFFET', 4 + cw / 2, 115.5, '#ffd23f', 7);
        }
        txt(cant >= 6 ? 'BUFFET LIVRE' : cant >= 4 ? 'LANCHE+GELADA' : cant >= 2 ? 'SALGADOS' : cant >= 1 ? 'BALAS' : 'CAIXA', 4 + cw / 2, 190, '#ffd23f', 6);
        if (cant >= 2) txt(cant >= 6 ? 'R$ 25 a vontade' : 'coxinha R$3', 4 + cw / 2, 202, '#e8e0d0', 5);
      }

      // ---------- PCs ----------
      var cols = Math.max(3, Math.min(6, Math.floor(aw / 26)));
      var rows = Math.max(1, Math.ceil(p / cols));
      var cell = Math.min(aw / cols, 34), rg = rows <= 2 ? 30 : 24, dy0 = rows === 1 ? 162 : rows === 2 ? 148 : 144;
      if (p === 0) {
        rect('#6b4a2f', mid - 11, 163, 22, 3); rect('#4d341f', mid - 11, 166, 22, 6);
        rect('#16161c', mid - 6, 152, 12, 10); rect('#2a3a34', mid - 5, 153, 10, 8);
        txt('em breve...', mid, 186, '#a89878', 7);
      }
      for (i = 0; i < p; i++) {
        var r = (i / cols) | 0, cc = i - r * cols, cnt = Math.min(cols, p - r * cols);
        pc(i, x0 + aw / 2 + (cc - (cnt - 1) / 2) * cell, dy0 + r * rg);
      }

      // ventilador de pe
      if (ac === 1) {
        var fx = x0 + aw - 12, fa = t * 9;
        rect('#555', fx - 1, 202, 2, 12); rect('#444', fx - 6, 213, 12, 2); dot('#777', fx, 200, 8);
        X.strokeStyle = '#ccd'; X.lineWidth = 3;
        for (k = 0; k < 3; k++) { X.beginPath(); X.moveTo(fx, 200); X.lineTo(fx + Math.cos(fa + k * 2.094) * 7, 200 + Math.sin(fa + k * 2.094) * 7); X.stroke(); }
        dot('#333', fx, 200, 1.5);
      }

      // ---------- Campeonato / palco ----------
      if (cs > 0) {
        rect('#7a1020', sx, 88, sw, 11); rect('#ffd23f', sx, 88, sw, 1); rect('#ffd23f', sx, 98, sw, 1);
        txt('CAMPEONATO', sx + sw / 2, 96.5, '#fff2c0', 7);
        for (i = 0; i < 6; i++) { A(Math.sin(t * 4 + i) > 0 ? 1 : 0.25); dot(NEON[i % 5], sx + 3 + i * (sw - 6) / 5, 100.5, 1.1); }
        A(1);
        if (cs < 3) {
          rect('#5b3d24', sx + sw / 2 - 14, 124, 28, 2); trophy(sx + sw / 2, 110, 1.8);
        } else {
          rect('#0a0a12', sx, 103, sw, 26); rect('#06223a', sx + 2, 105, sw - 4, 22);
          txt('TR ' + (7 + ((t / 4 | 0) % 9)) + ' x ' + (3 + ((t / 3 | 0) % 12)) + ' CT', sx + sw / 2, 118, '#7dff9a', 8);
          for (k = 0; k < 2; k++) { A(0.8); rect(k % 2 ? '#46e6ff' : '#ff6b6b', sx + 5, 121 + k * 3, 6 + (t * 10 + k * 7) % (sw - 16), 1.6); }
          A(0.07); for (y = 105; y < 127; y += 3) rect('#fff', sx + 2, y, sw - 4, 1); A(1);
          rect('#3d2c52', sx - 1, 130, sw + 2, 6); rect('#2a1d3a', sx - 1, 136, sw + 2, 3);
          var ntr = cs >= 5 ? 3 : cs >= 4 ? 2 : 1;
          for (i = 0; i < ntr; i++) trophy(sx + sw - 8 - i * 11, 121, 0.9);
        }
        if (cs >= 6) {
          for (k = 0; k < 2; k++) {
            x = sx + sw * (0.3 + 0.4 * k);
            person(x, 121, k + 1, Math.sin(t * 6 + k) * 0.7, '#222');
            rect('#1b1b22', x - 5, 125.5, 10, 4); rect(SCR[(k + (t * 3 | 0)) % 4], x - 4, 126, 8, 2.4);
          }
          A(0.1); tri('#ffe14f', sx + 4, 88, sx - 6, 140, sx + 34, 140); tri('#46e6ff', sx + sw - 4, 88, sx + sw - 34, 140, sx + sw + 6, 140); A(1);
          for (i = 0; i < 12; i++) { A(0.85); rect(SHIRT[i % 6], sx + hs(i * 7) * sw, 100 + (t * 25 + hs(i) * 80) % 70, 2, 2); }
          A(1);
        }
        var ncr = CROWD[cs], cols2 = Math.max(3, Math.floor(sw / 9)), cy0 = vip > 0 ? 146 : 150;
        for (i = 0; i < ncr; i++) {
          var r2 = (i / cols2) | 0, c2 = i - r2 * cols2, n2 = Math.min(cols2, ncr - r2 * cols2);
          var sxx = sx + sw / 2 + (c2 - (n2 - 1) / 2) * 9, syy = cy0 + r2 * 8;
          var jmp = Math.abs(Math.sin(t * 5 + i * 1.3)) * (1 + cs * 0.3);
          rect(SHIRT[(i * 5) % 6], sxx - 3, syy + 2 - jmp, 6, 5);
          dot(SKIN[(i * 3) % 4], sxx, syy - jmp, 2.6);
          if (Math.sin(t * 5 + i * 1.3) > 0.6) rect(SKIN[(i * 3) % 4], sxx + 2.5, syy - 5 - jmp, 1.5, 4);
        }
      }

      // ---------- Sala VIP ----------
      if (vip > 0) {
        var hu = t * 90, vy0 = 174, bw = sw / 3 - 2;
        if (cs === 0) {
          rect('#120a20', sx, 92, sw, 28);
          A(0.5 + 0.4 * Math.sin(t * 3)); rect(HC(hu), sx, 92, sw, 1.5); rect(HC(hu), sx, 118.5, sw, 1.5); A(1);
          txt('SALA VIP', sx + sw / 2, 110, HC(hu + 90), 11);
        }
        A(0.1 + 0.05 * Math.sin(t * 2)); rect(HC(hu + 200, 55), sx - 4, vy0 - 6, sw + 8, 56); A(1);
        txt('VIP', sx + sw / 2, vy0 - 2, HC(hu + 120), 7);
        for (i = 0; i < vip; i++) {
          x = sx + i * (sw / 3) + 1; c = HC(hu + i * 60);
          rect('#1b0f2e', x, vy0, bw, 50);
          rect(c, x, vy0, bw, 1.5); rect(c, x, vy0 + 48.5, bw, 1.5); rect(c, x, vy0, 1.2, 50); rect(c, x + bw - 1.2, vy0, 1.2, 50);
          var vc = x + bw / 2;
          rect('#16161d', vc - 6, vy0 + 22, 3, 18); rect('#16161d', vc + 3, vy0 + 22, 3, 18); rect(c, vc - 6, vy0 + 22, 1, 18);
          dot(SKIN[(i + 1) % 4], vc, vy0 + 20 + Math.sin(t * 5 + i) * 0.8, 3);
          rect('#16161d', vc - 4, vy0 + 23, 8, 4);
          rect('#0d0d14', vc - 6, vy0 + 29, 12, 9); A(0.85); rect(c, vc - 5, vy0 + 30, 10, 6); A(1);
          rect('#c9c9d6', vc - 4, vy0 + 38.5, 8, 1.2);
          A(0.12); tri('#c8a2ff', vc - 5, vy0 + 2, vc - bw / 2, vy0 + 48, vc + bw / 2, vy0 + 48); A(1);
        }
      }

      // ---------- Fila de clientes (combo) ----------
      if (combo > 0) {
        var nq = Math.min(7, Math.ceil(combo / 4));
        for (i = 0; i < nq; i++) person(x0 + 8 + i * 14, 224, i + 1, Math.sin(t * 4 + i) * 0.5, '#2b2118');
        if (combo >= 30) txt('LOTADA!', x0 + 8 + nq * 14, 227, '#ffd23f', 7, 'left');
      }

      // ---------- Atmosfera ----------
      var dim = 0.22 - lvl * 0.7;
      if (dim > 0) { A(dim); rect('#000', 0, 85, W, 145); A(1); }
      if (lvl > 0.15) { A(0.04 + lvl * 0.03); tri('#fff', mid - 5, 88, mid + 5, 88, mid + 40, 170); tri('#fff', mid - 5, 88, mid + 40, 170, mid - 40, 170); A(1); }
      for (i = 0; i < 14; i++) {
        var mx = ((hs(i) * W + t * (2 + i % 3) + Math.sin(t * 0.3 + i) * 12) % W + W) % W;
        var my = 90 + hs(i + 9) * 110 + Math.sin(t * 0.5 + i * 2) * 6;
        A(0.12 + 0.25 * (Math.sin(t * 1.5 + i) + 1) / 2); rect('#fff6d0', mx, my, 1.4, 1.4);
      }
      A(1);

      // ---------- Eventos ----------
      if (ev === 'apagao') {
        A(0.3); rect('#000', 0, 0, W, 85); A(0.78); rect('#02030a', 0, 85, W, 145); A(1);
        for (i = 0; i < 4; i++) {
          var fpx = W * (0.15 + 0.23 * i) + Math.sin(t * 0.9 + i) * 6, fpy = 150 + (i % 2) * 28;
          A(0.12 + 0.05 * Math.sin(t * 3 + i)); tri('#fff', fpx, fpy, fpx - 24, fpy - 62, fpx + 24, fpy - 62); A(1);
          rect('#222', fpx - 1.5, fpy - 1, 3, 5); dot('#fff', fpx, fpy - 1.5, 1.6);
        }
        if (Math.sin(t * 5) > -0.3) txt('SEM LUZ!', mid, 112, '#ff5a5a', 11);
      } else if (ev === 'bonus') {
        A(0.5 + 0.3 * Math.sin(t * 6)); c = NEON[(t * 3 | 0) % 5];
        rect(c, 0, 85, W, 1.5); rect(c, 0, 228, W, 2); rect(c, 0, 85, 1.5, 145); rect(c, W - 1.5, 85, 1.5, 145); A(1);
        for (i = 0; i < 28; i++) { A(0.9); rect(HC(i * 37, 60), (hs(i) * W + Math.sin(t * 2 + i) * 8 + W) % W, (t * 45 + hs(i + 5) * 230) % 230, 2, 3); }
        A(1);
      }

      // ---------- Particulas do clique ----------
      for (i = 0; i < PA.length; i++) {
        var pa = PA[i];
        if (!pa.a) continue;
        if (pa.t0 === null || t < pa.t0) pa.t0 = t;
        var ag = t - pa.t0;
        if (ag > 1) { pa.a = 0; continue; }
        A(1 - ag);
        if (pa.k === 1) txt('+R$', pa.x, pa.y - 34 * ag, '#ffd23f', 11);
        else rect(pa.k === 2 ? '#fff6c8' : '#ffd23f', pa.x + pa.vx * ag, pa.y + pa.vy * ag + 70 * ag * ag, 2.2, 2.2);
      }
      A(1);
    },
    burst: function (ctx, W, H, t) {
      if (t - lastSp < 0.06) return;
      lastSp = t;
      var bx = W * (0.25 + Math.random() * 0.5), by = 118 + Math.random() * 40, n = 0, i, a;
      for (i = 0; i < PA.length && n < 8; i++) {
        if (PA[i].a) continue;
        a = Math.random() * 6.2832;
        PA[i].a = 1; PA[i].t0 = null; PA[i].x = bx; PA[i].y = by; PA[i].k = n === 0 ? 1 : (n & 1 ? 0 : 2);
        PA[i].vx = Math.cos(a) * 55; PA[i].vy = Math.sin(a) * 55 - 30;
        n++;
      }
    }
  };
})();
