// Cena "Da Caverna ao Espaço": civilização evoluindo numa paisagem horizontal.
// Contrato (DESIGN.md 3.4): o = 14 inteiros (coletor, fogo, ferramentas, vila, agricultura, roda, escrita,
// cidade, navegação, vapor, fábrica, computador, programa espacial, colônia). Itens "nível" evoluem o visual.
SCENES.civ = (function () {
  var NOMES = ['Paleolítico', 'Domínio do fogo', 'Revolução Neolítica', 'Idade da Roda', 'Idade da Escrita',
    'Grandes Navegações', 'Revolução Industrial', 'Era da Informação', 'Era Espacial'];
  // [topo, horizonte] do céu por era mais avançada desbloqueada
  var CEU = [['#3a3a6e', '#f0a070'], ['#46508a', '#f5b27a'], ['#6a9ad0', '#f9d9a0'], ['#5aa8e8', '#cfeaf5'],
    ['#4fa0e6', '#bfe6f5'], ['#3f93e0', '#b0e2f2'], ['#6a3f6a', '#f08a50'], ['#0c1033', '#3a2a7a'], ['#02030c', '#0b1240']];
  var SOLY = [0.62, 0.5, 0.38, 0.28, 0.25, 0.28, 0.55];
  var CORES = ['#ffd23a', '#ff8a3a', '#ffffff', '#7ee8ff'];
  var MAXV = [10, 4, 5, 5, 6, 4, 6, 4, 5, 5, 4, 6, 6, 3];
  var ERAIDX = [-1, 1, 3, 5, 6, 8, 9, 11, 12]; // item que destrava cada era (era 0 sempre)
  var RH = [0, 24, 30, 36, 46, 54, 64];        // altura do foguete por nível
  var RW = [0, 3, 3, 4, 5, 9, 7];              // meia-largura da chama por nível
  var N = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], XT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  // estado do burst (faíscas de clique)
  var SP = [], sT0 = -99, sX = 0, sY = 0, i0;
  for (i0 = 0; i0 < 20; i0++) SP.push({ vx: 0, vy: 0 });

  function rnd(i) { var s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
  function R(c, col, x, y, w, h) { c.fillStyle = col; c.fillRect(x, y, w, h); }
  function C(c, col, x, y, r) { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill(); }
  function Tri(c, col, x1, y1, x2, y2, x3, y3) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.closePath(); c.fill();
  }
  function L(c, col, w, x1, y1, x2, y2) {
    c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
  }
  function mais(c, x, y, extra, col) {
    if (extra > 0 && extra < 1e7) { c.fillStyle = col; c.font = 'bold 10px sans-serif'; c.textAlign = 'left'; c.fillText('+' + extra, x, y); }
  }
  function smoke(c, x, y, t, seed, n, rise, drift, col) {
    for (var k = 0; k < n; k++) {
      var p = (t * 0.35 + k / n + seed) % 1;
      c.globalAlpha = (1 - p) * 0.55;
      C(c, col, x + drift * p + Math.sin(p * 6 + seed) * 2, y - rise * p, 2 + p * 5);
    }
    c.globalAlpha = 1;
  }
  function wheel(c, x, y, r, a, col) {
    c.strokeStyle = col; c.lineWidth = 1.3; c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.stroke();
    c.beginPath();
    c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.lineTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
    c.moveTo(x - Math.sin(a) * r, y + Math.cos(a) * r); c.lineTo(x + Math.sin(a) * r, y - Math.cos(a) * r);
    c.stroke();
  }
  function dome(c, x, y, r, t, k) { // cúpula de base lunar/marciana
    c.globalAlpha = 0.9; c.fillStyle = '#bfe3ff'; c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.closePath(); c.fill();
    c.globalAlpha = 1; R(c, '#6a7080', x - r - 0.5, y, r * 2 + 1, 1.5);
    c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + k); R(c, '#ffe58a', x - 0.7, y - r * 0.6, 1.4, 1.4); c.globalAlpha = 1;
  }
  function tool(c, lv, x, y, t, k) { // ferramenta na mão: pedra, polida, bronze, ferro, aço
    L(c, '#6b4a2a', 1, x, y, x + 1, y - 11);
    if (lv === 1) Tri(c, '#8e8e8e', x - 2, y - 9, x + 3, y - 10, x + 1, y - 14);
    else if (lv === 2) { C(c, '#b9c2c9', x + 1, y - 11.5, 2.4); }
    else if (lv === 3) Tri(c, '#cf8a3c', x - 1.8, y - 10, x + 3.6, y - 10, x + 0.8, y - 16);
    else if (lv === 4) { Tri(c, '#6f7782', x - 3, y - 9, x + 4, y - 9, x + 0.5, y - 15); R(c, '#4a4f58', x - 3, y - 10, 7, 1.2); }
    else {
      Tri(c, '#dfeaf5', x - 3, y - 9, x + 4, y - 9, x + 0.5, y - 17); R(c, '#9db4cc', x - 3, y - 10, 7, 1.2);
      c.globalAlpha = Math.max(0, Math.sin(t * 4 + k)); R(c, '#ffffff', x - 0.5, y - 15, 1.6, 1.6); c.globalAlpha = 1;
    }
  }
  function boat(c, x, y, kind, t, i) { // 1 canoa, 2 barco a vela, 3 caravela, 4 vapor
    var sw = Math.sin(t * 3 + i) * 0.8;
    if (kind === 1) {
      c.fillStyle = '#8a5a2a'; c.beginPath(); c.moveTo(x - 7, y - 1); c.lineTo(x + 7, y - 1); c.lineTo(x + 4, y + 2); c.lineTo(x - 4, y + 2); c.closePath(); c.fill();
      R(c, '#8a5a3a', x - 1.2, y - 5, 2.4, 4); C(c, '#e0b088', x, y - 7, 1.7);
      L(c, '#5a3a1a', 1, x - 5, y - 4 + sw, x + 5, y + 2 - sw);
    } else if (kind === 2) {
      R(c, '#6b3a1a', x - 6, y, 12, 3); Tri(c, '#6b3a1a', x + 6, y, x + 9, y - 1, x + 6, y + 3);
      L(c, '#4a2a10', 1, x, y, x, y - 11);
      Tri(c, '#f5f0e0', x + 0.5, y - 10, x + 0.5, y - 1, x + 6 + sw * 0.5, y - 2);
      Tri(c, '#e8e0c8', x - 0.5, y - 9, x - 0.5, y - 1, x - 4, y - 1.5);
    } else if (kind === 3) {
      R(c, '#5a2e12', x - 9, y, 18, 4); Tri(c, '#5a2e12', x + 9, y, x + 13, y - 2, x + 9, y + 4);
      R(c, '#7a4a22', x - 9, y - 2, 5, 2);
      L(c, '#3a1e0a', 1, x - 3, y, x - 3, y - 14); L(c, '#3a1e0a', 1, x + 4, y, x + 4, y - 12);
      Tri(c, '#f5f0e0', x - 2.5, y - 13, x - 2.5, y - 1, x + 3 + sw * 0.5, y - 2);
      Tri(c, '#f5f0e0', x + 4.5, y - 11, x + 4.5, y - 1, x + 9 + sw * 0.5, y - 2);
      R(c, '#c0392b', x - 1, y - 9, 1.4, 4); R(c, '#c0392b', x - 2.4, y - 7.6, 4.2, 1.4);
      R(c, '#e74c3c', x - 3, y - 16, 3, 2);
    } else {
      c.fillStyle = '#2f3138'; c.beginPath(); c.moveTo(x - 10, y - 1); c.lineTo(x + 11, y - 1); c.lineTo(x + 7, y + 4); c.lineTo(x - 8, y + 4); c.closePath(); c.fill();
      R(c, '#eee', x - 5, y - 6, 9, 5); R(c, '#5ec8ff', x - 4, y - 5, 2, 2); R(c, '#5ec8ff', x - 1, y - 5, 2, 2);
      R(c, '#c0392b', x + 4, y - 9, 3, 8);
      smoke(c, x + 5.5, y - 9, t, i * 0.17, 4, 14, -6, '#cfcfcf');
    }
  }
  // foguete por nível 1..6 (y = base; fl = comprimento da chama)
  function rocketK(c, x, y, k, fl) {
    var h = RH[k], hw = RW[k];
    if (fl > 0) {
      Tri(c, '#ff7a1a', x - hw, y, x + hw, y, x, y + fl);
      Tri(c, '#ffe27a', x - hw * 0.5, y, x + hw * 0.5, y, x, y + fl * 0.6);
    }
    if (k === 1) { // V2
      Tri(c, '#2a2a30', x - 4, y, x - 8, y, x - 4, y - 8); Tri(c, '#2a2a30', x + 4, y, x + 8, y, x + 4, y - 8);
      R(c, '#d8d2c0', x - 4, y - 18, 8, 18); R(c, '#222', x - 4, y - 13, 8, 5);
      Tri(c, '#b33a2a', x - 4, y - 18, x + 4, y - 18, x, y - h);
    } else if (k === 2) { // lançador de satélite
      Tri(c, '#c0392b', x - 3, y - 3, x - 7, y, x - 3, y - 10); Tri(c, '#c0392b', x + 3, y - 3, x + 7, y, x + 3, y - 10);
      R(c, '#f2f2f2', x - 3, y - 23, 6, 23); R(c, '#333', x - 3, y - 14, 6, 2);
      Tri(c, '#c0392b', x - 3, y - 23, x + 3, y - 23, x, y - h);
    } else if (k === 3) { // cápsula tripulada
      Tri(c, '#555', x - 4, y - 3, x - 8, y, x - 4, y - 9); Tri(c, '#555', x + 4, y - 3, x + 8, y, x + 4, y - 9);
      R(c, '#f4f4f4', x - 4, y - 26, 8, 26); R(c, '#222', x - 4, y - 16, 8, 3);
      Tri(c, '#aaa', x - 4, y - 26, x + 4, y - 26, x, y - 32); L(c, '#999', 1, x, y - 32, x, y - h);
      C(c, '#5ec8ff', x, y - 21, 1.5);
    } else if (k === 4) { // Saturn V
      Tri(c, '#222', x - 5, y - 4, x - 10, y, x - 5, y - 12); Tri(c, '#222', x + 5, y - 4, x + 10, y, x + 5, y - 12);
      R(c, '#f4f4f4', x - 5, y - 22, 10, 22); R(c, '#222', x - 5, y - 16, 10, 3); R(c, '#222', x - 5, y - 8, 10, 2);
      R(c, '#e8e8e8', x - 4, y - 34, 8, 12); R(c, '#222', x - 4, y - 28, 8, 2);
      R(c, '#f4f4f4', x - 3, y - 40, 6, 6);
      Tri(c, '#f4f4f4', x - 3, y - 40, x + 3, y - 40, x, y - h + 2); L(c, '#bbb', 1, x, y - h + 2, x, y - h);
    } else if (k === 5) { // lançador com boosters
      R(c, '#e8e8ec', x - 10, y - 26, 4, 26); Tri(c, '#c0392b', x - 10, y - 26, x - 6, y - 26, x - 8, y - 32);
      R(c, '#e8e8ec', x + 6, y - 26, 4, 26); Tri(c, '#c0392b', x + 6, y - 26, x + 10, y - 26, x + 8, y - 32);
      R(c, '#f4f4f4', x - 5, y - 44, 10, 44); R(c, '#222', x - 5, y - 30, 10, 3); R(c, '#2a6fb0', x - 5, y - 14, 10, 3);
      Tri(c, '#f4f4f4', x - 5, y - 44, x + 5, y - 44, x, y - h);
      Tri(c, '#222', x - 5, y - 6, x - 10, y, x - 5, y - 14);
    } else { // lançador pesado reutilizável
      R(c, '#9aa3ad', x - 7, y - 20, 14, 20);
      R(c, '#777', x - 9, y - 21, 3, 3); R(c, '#777', x + 6, y - 21, 3, 3);
      R(c, '#d4d9df', x - 6, y - 46, 12, 26); R(c, '#2a2a30', x - 6, y - 40, 12, 2);
      Tri(c, '#d4d9df', x - 6, y - 46, x + 6, y - 46, x, y - h + 6);
      Tri(c, '#2a2a30', x - 6, y - 40, x - 11, y - 34, x - 6, y - 30); Tri(c, '#2a2a30', x + 6, y - 40, x + 11, y - 34, x + 6, y - 30);
      Tri(c, '#2a2a30', x - 7, y - 4, x - 12, y, x - 7, y - 11); Tri(c, '#2a2a30', x + 7, y - 4, x + 12, y, x + 7, y - 11);
      C(c, '#5ec8ff', x, y - 40, 1.3);
    }
  }

  function draw(c, W, H, o, t) {
    o = o || [];
    var i, j, k, x, y, any = 0, v;
    for (i = 0; i < 14; i++) {
      v = o[i]; v = v > 0 ? Math.floor(v) : 0;
      XT[i] = v > MAXV[i] ? v - MAXV[i] : 0; N[i] = v > MAXV[i] ? MAXV[i] : v; any += N[i];
    }
    var cl = N[0], fogo = N[1], fer = N[2], vil = N[3], agr = N[4], rod = N[5], esc = N[6], cid = N[7], nav = N[8],
      vap = N[9], fab = N[10], com = N[11], esp = N[12], clo = N[13];
    var e = any > 0 ? 0 : -1;
    for (i = 8; i >= 1; i--) if (N[ERAIDX[i]] >= 1) { e = i; break; }
    var ei = e < 0 ? 0 : e;
    var gy = H - 60, g;
    var sx0 = W * 0.70, sw = W * 0.15, river = nav > 0 || rod >= 4;
    var moonX = W * 0.62, moonY = gy * 0.24, marsX = W * 0.30, marsY = gy * 0.46;
    var showMoon = esp >= 4 || clo >= 1, showMars = esp >= 6 || clo >= 2;

    // ---- céu ----
    g = c.createLinearGradient(0, 0, 0, gy);
    g.addColorStop(0, CEU[ei][0]); g.addColorStop(1, CEU[ei][1]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);

    var sa = ei >= 8 ? 1 : ei === 7 ? 0.7 : ei === 6 ? 0.15 : 0;
    if (sa > 0) {
      for (i = 0; i < 40; i++) {
        c.globalAlpha = sa * (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7));
        R(c, '#ffffff', rnd(i) * W, rnd(i + 99) * gy * 0.9, 1.5, 1.5);
      }
      c.globalAlpha = 1;
    }
    if (ei <= 6) {
      var sx = W * 0.82, sy = SOLY[ei] * gy;
      c.globalAlpha = 0.25; C(c, ei === 6 ? '#ff7a3a' : '#ffe27a', sx, sy, 20); c.globalAlpha = 1;
      C(c, ei === 6 ? '#ff7a3a' : '#ffe27a', sx, sy, 11);
    } else {
      C(c, '#e8ecff', W * 0.82, gy * 0.25, 10);
      C(c, CEU[ei][0], W * 0.82 + 4, gy * 0.25 - 2, 8);
    }
    if (ei >= 8) { // planeta com anel
      C(c, '#b07a50', W * 0.14, gy * 0.3, 13);
      c.strokeStyle = '#e8c9a0'; c.lineWidth = 1.5; c.beginPath();
      c.ellipse(W * 0.14, gy * 0.3, 22, 5, -0.3, 0, 6.2832); c.stroke();
    }
    // Lua (programa espacial 4+ ou colônia) com bandeira e bases
    if (showMoon) {
      C(c, '#d8d8de', moonX, moonY, 12);
      C(c, '#b4b4bc', moonX - 4, moonY - 3, 2.6); C(c, '#b4b4bc', moonX + 3, moonY + 2, 3); C(c, '#b4b4bc', moonX + 5, moonY - 5, 1.6);
      if (esp >= 4) { L(c, '#eee', 1, moonX - 1, moonY - 2, moonX - 1, moonY - 10); R(c, '#e74c3c', moonX - 1, moonY - 10, 5, 3); }
      if (clo >= 1) dome(c, moonX - 6, moonY + 9, 3, t, 0);
      if (clo >= 3) dome(c, moonX + 4, moonY + 10, 2.6, t, 2);
    }
    // Marte (rumo a Marte ou colônia 2+)
    if (showMars) {
      C(c, '#c1583a', marsX, marsY, 9);
      C(c, '#9a4228', marsX - 3, marsY + 1, 2.4); C(c, '#9a4228', marsX + 3, marsY - 3, 1.8);
      R(c, '#f2e8e0', marsX - 2, marsY - 9, 4, 1.4);
      if (clo >= 2) dome(c, marsX + 1, marsY + 7, 2.6, t, 1);
    }
    // satélite (programa espacial 2+) em órbita
    if (esp >= 2) {
      var sa1 = t * 0.4, stx = W * 0.5 + Math.cos(sa1) * W * 0.42, sty = gy * 0.42 + Math.sin(sa1) * gy * 0.22;
      R(c, '#9aa', stx - 2, sty - 1.5, 4, 3); R(c, '#2a6fb0', stx - 8, sty - 1, 5, 2); R(c, '#2a6fb0', stx + 3, sty - 1, 5, 2);
      c.globalAlpha = Math.max(0, Math.sin(t * 5)); C(c, '#ff4a4a', stx, sty - 2.6, 1); c.globalAlpha = 1;
    }
    // astronauta flutuando (3+)
    if (esp >= 3) {
      c.save(); c.translate(W * 0.74, gy * 0.52 + Math.sin(t * 0.9) * 3); c.rotate(Math.sin(t * 0.5) * 0.5);
      R(c, '#f4f4f4', -2.5, -1, 5, 6); C(c, '#f4f4f4', 0, -4, 3); C(c, '#5ec8ff', 0.6, -4, 1.7);
      L(c, '#f4f4f4', 1.4, -2.5, 0, -6, 3); L(c, '#f4f4f4', 1.4, 2.5, 0, 6, -2);
      L(c, '#f4f4f4', 1.4, -1.5, 5, -3, 9); L(c, '#f4f4f4', 1.4, 1.5, 5, 3, 9);
      c.restore();
    }
    // estação espacial (5+)
    if (esp >= 5) {
      var sa2 = -t * 0.22 + 2, ssx = W * 0.5 + Math.cos(sa2) * W * 0.3, ssy = gy * 0.2 + Math.sin(sa2) * gy * 0.1;
      R(c, '#d8dce4', ssx - 5, ssy - 1.5, 10, 3); R(c, '#aab', ssx - 1.5, ssy - 4, 3, 8);
      R(c, '#2a6fb0', ssx - 14, ssy - 1, 8, 2.4); R(c, '#2a6fb0', ssx + 6, ssy - 1, 8, 2.4);
    }
    // nave rumo a Marte (6)
    if (esp >= 6) {
      var pp = (t / 18) % 1, shx = W * 0.8 + (marsX - W * 0.8) * pp, shy = gy * 0.78 + (marsY - gy * 0.78) * pp;
      for (k = 1; k < 7; k++) { c.globalAlpha = 0.5 * (1 - k / 7); C(c, '#ffb03a', shx + k * 2.4 * (W * 0.5 / W), shy + k * 0.9, 1.7); }
      c.globalAlpha = 1; C(c, '#e8ecf4', shx, shy, 2.2);
    }
    // nuvem digital (computador 5+) e rede de IA (6)
    if (com >= 5) {
      var ncx = W * 0.46, ncy = gy * 0.3;
      c.globalAlpha = 0.4; C(c, '#8fd8ff', ncx, ncy, 9); C(c, '#8fd8ff', ncx + 10, ncy + 2, 7); C(c, '#8fd8ff', ncx - 10, ncy + 2, 7); c.globalAlpha = 1;
      for (k = 0; k < 4; k++) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + k * 1.6); R(c, '#ffffff', ncx - 9 + k * 6, ncy + (k & 1) * 2 - 1, 1.6, 1.6); }
      c.globalAlpha = 1;
      if (com >= 6) {
        for (k = 0; k < 7; k++) {
          var ax = ncx + Math.cos(k * 0.9 + t * 0.15) * 36, ay = ncy + Math.sin(k * 0.9 + t * 0.15) * 15;
          c.globalAlpha = 0.25 + 0.2 * Math.sin(t * 2 + k); L(c, '#7ee8ff', 0.8, ncx, ncy, ax, ay);
          c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 3 + k * 2); C(c, '#b6f3ff', ax, ay, 1.8);
        }
        c.globalAlpha = 1;
      }
    }
    if (ei >= 2 && ei <= 6) {
      c.globalAlpha = 0.8;
      for (i = 0; i < 3; i++) {
        x = ((t * 4 + i * W / 3) % (W + 80)) - 40; y = 18 + i * 14;
        var cc = ei === 6 ? '#e8a98a' : '#ffffff';
        C(c, cc, x, y, 6); C(c, cc, x + 7, y + 2, 5); C(c, cc, x - 7, y + 2, 5);
      }
      c.globalAlpha = 1;
    }
    // colinas
    c.fillStyle = ei < 2 ? '#5a4a52' : ei < 7 ? '#3f7a5a' : '#1c2a3a';
    c.beginPath(); c.moveTo(0, gy);
    for (x = 0; x <= W + 8; x += 8) c.lineTo(x, gy - 12 - Math.sin(x * 0.02) * 8 - Math.sin(x * 0.05 + 1) * 4);
    c.lineTo(W, gy); c.closePath(); c.fill();

    // ---- torre de celular (computador 4+) ----
    if (com >= 4) {
      var twx = W * 0.62;
      L(c, '#9aa', 1.4, twx - 4, gy, twx, gy - 62); L(c, '#9aa', 1.4, twx + 4, gy, twx, gy - 62);
      for (j = 0; j < 5; j++) L(c, '#778', 0.8, twx - 3.4 + j * 0.45, gy - 4 - j * 11, twx + 3.4 - j * 0.45, gy - 11 - j * 11);
      if (Math.sin(t * 4) > 0) C(c, '#ff3b3b', twx, gy - 64, 1.6);
      for (k = 0; k < 3; k++) {
        var rp = (t * 0.7 + k / 3) % 1; c.globalAlpha = 0.6 * (1 - rp); c.strokeStyle = '#7ee8ff'; c.lineWidth = 1;
        c.beginPath(); c.arc(twx, gy - 60, 3 + rp * 14, 0, 6.2832); c.stroke();
      }
      c.globalAlpha = 1;
    }

    // ---- cidade (fundo): um bairro (5 prédios) por unidade + muralha ----
    if (cid > 0) {
      var nb = cid * 5, bs = W * 0.4 / 20, lx2 = -1, ly2 = 0, med = ei < 5;
      for (i = 0; i < nb; i++) {
        var bw = 8 + rnd(i) * 4, bh = (22 + rnd(i + 5) * 46) * (ei >= 7 ? 1.25 : 1), bx = W * 0.3 + i * bs;
        R(c, med ? (i % 2 ? '#8a7f72' : '#a3978a') : (i % 2 ? '#2b3350' : '#394266'), bx, gy - bh, bw, bh + 2);
        if (med) Tri(c, '#a8453a', bx - 1, gy - bh, bx + bw + 1, gy - bh, bx + bw / 2, gy - bh - 6);
        for (j = 0; j < bh / 6 - 1; j++) for (k = 0; k < 2; k++) {
          if (rnd(i * 13 + j * 7 + k) > 0.35 && ((j + k + ((t * 0.5) | 0) + i) % 11 !== 0)) R(c, '#ffe58a', bx + 1.5 + k * 4, gy - bh + 3 + j * 6, 2, 3);
        }
        if (com >= 1 && i % 3 === 0) {
          L(c, '#99a', 1, bx + bw / 2, gy - bh, bx + bw / 2, gy - bh - 8);
          if (Math.sin(t * 4 + i) > 0) C(c, '#ff3b3b', bx + bw / 2, gy - bh - 8, 1.3);
        }
        if (com >= 2 && i % 4 === 1) { c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 6 + i); R(c, '#5ee7ff', bx + 1, gy - bh - 3, 5, 3); c.globalAlpha = 1; }
        if (com >= 3 && i % 4 === 0) { // enlaces de internet entre prédios
          var tx0 = bx + bw / 2, ty0 = gy - bh - 8;
          if (lx2 >= 0) {
            c.globalAlpha = 0.35; L(c, '#7ee8ff', 0.8, lx2, ly2, tx0, ty0);
            var pk = (t * 0.7 + i * 0.13) % 1; c.globalAlpha = 0.9; R(c, '#ffffff', lx2 + (tx0 - lx2) * pk - 1, ly2 + (ty0 - ly2) * pk - 1, 2, 2);
            c.globalAlpha = 1;
          }
          lx2 = tx0; ly2 = ty0;
        }
      }
      var wx = W * 0.3 - 4, wl = nb * bs + 14;
      c.globalAlpha = ei >= 7 ? 0.55 : 1;
      R(c, '#7d7568', wx, gy - 8, wl, 9);
      for (x = wx; x < wx + wl; x += 6) R(c, '#7d7568', x, gy - 11, 3, 3);
      R(c, '#6d665a', wx - 2, gy - 17, 6, 18); R(c, '#6d665a', wx + wl - 4, gy - 17, 6, 18);
      R(c, '#6d665a', wx - 2, gy - 20, 2, 3); R(c, '#6d665a', wx + 2, gy - 20, 2, 3);
      R(c, '#6d665a', wx + wl - 4, gy - 20, 2, 3); R(c, '#6d665a', wx + wl, gy - 20, 2, 3);
      c.globalAlpha = 1;
      mais(c, W * 0.7 + 2, gy - 4, XT[7], '#fff');
    }

    // ---- fábricas (uma por unidade) e caldeira a vapor ----
    var x0 = W * 0.03;
    if (fab > 0) {
      for (i = 0; i < fab; i++) {
        var fx = x0 + i * 21;
        R(c, '#8a4b3a', fx, gy - 22, 18, 24);
        Tri(c, '#6b3a2c', fx, gy - 22, fx + 9, gy - 22, fx, gy - 30); Tri(c, '#6b3a2c', fx + 9, gy - 22, fx + 18, gy - 22, fx + 9, gy - 30);
        for (j = 0; j < 3; j++) { c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 3 + i + j); R(c, '#ffd37a', fx + 2 + j * 5, gy - 14, 3, 4); }
        c.globalAlpha = 1;
        R(c, '#5a3328', fx + 12, gy - 44 - i * 2, 5, 24 + i * 2);
        smoke(c, fx + 14.5, gy - 44 - i * 2, t, i * 0.23, 5, 30, 14, vap >= 3 ? '#777' : '#9a9a9a');
      }
      mais(c, x0 + fab * 21 + 2, gy - 6, XT[10], '#fff');
    }
    if (vap >= 1) { // caldeira
      var bxb = x0 + 88;
      R(c, '#4a4a52', bxb, gy - 14, 12, 15); C(c, '#4a4a52', bxb + 6, gy - 14, 6);
      R(c, '#2a2a30', bxb + 4, gy - 24, 3, 8); R(c, '#777', bxb + 1, gy - 9, 10, 1); R(c, '#777', bxb + 1, gy - 4, 10, 1);
      c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8); R(c, '#ff8a2a', bxb + 3, gy - 2, 6, 3); c.globalAlpha = 1;
      smoke(c, bxb + 5.5, gy - 24, t, 0.6, 4, 22, 8, '#d8d8d8');
    }

    // ---- chão ----
    R(c, ei < 2 ? '#7a6a45' : ei < 7 ? '#4c8a3a' : '#2a3a3a', 0, gy, W, H - gy);
    R(c, ei < 2 ? '#8a7a52' : ei < 7 ? '#62a64a' : '#3a4e4e', 0, gy, W, 3);
    R(c, 'rgba(0,0,0,0.18)', 0, H - 8, W, 8);

    // ---- mar (navegação) / rio (ponte) ----
    if (river) {
      R(c, '#2a6fb0', sx0, gy - 2, sw, 42);
      c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 1; c.beginPath();
      for (j = 0; j < 6; j++) {
        c.moveTo(sx0, gy + 5 + j * 6);
        for (x = 0; x <= sw; x += 4) c.lineTo(sx0 + x, gy + 5 + j * 6 + Math.sin(x * 0.4 + t * 2 + j) * 1.2);
      }
      c.stroke();
    }
    if (nav > 0) {
      R(c, '#7a5a3a', sx0 - 7, gy - 3, 11, 3);
      R(c, '#5a3a22', sx0 - 5, gy, 2, 5); R(c, '#5a3a22', sx0 + 1, gy, 2, 5);
      // frota: canoa (1), vela (2), caravela (3); vapor a partir do vapor 3
      boat(c, sx0 + sw * 0.3 + Math.sin(t * 0.5) * 3, gy + 9 + Math.sin(t * 2) * 1.2, 1, t, 0);
      if (nav >= 2) boat(c, sx0 + sw * 0.62 + Math.sin(t * 0.5 + 1) * 3, gy + 17 + Math.sin(t * 2 + 1) * 1.2, 2, t, 1);
      if (nav >= 3) boat(c, sx0 + sw * 0.42 + Math.sin(t * 0.4 + 2) * 3, gy + 25 + Math.sin(t * 2 + 2) * 1.2, 3, t, 2);
      if (vap >= 3) boat(c, sx0 + sw * 0.7 + Math.sin(t * 0.3) * 4, gy + 6 + Math.sin(t * 1.5) * 0.8, 4, t, 3);
      if (nav >= 4) { // bússola no cais
        var cpx = sx0 - 14, cpy = gy - 10;
        L(c, '#5a3a22', 1.4, cpx, cpy + 3, cpx, gy);
        C(c, '#e8d8a0', cpx, cpy, 4.6); C(c, '#f8f3e0', cpx, cpy, 3.4);
        var na = Math.sin(t * 1.3) * 0.7 - 1.57;
        L(c, '#c0392b', 1.2, cpx, cpy, cpx + Math.cos(na) * 3, cpy + Math.sin(na) * 3);
        L(c, '#333', 1.2, cpx, cpy, cpx - Math.cos(na) * 3, cpy - Math.sin(na) * 3);
      }
      if (nav >= 5) { // mapa-múndi
        var mpx = sx0 + sw + 5, mpy = gy - 20;
        L(c, '#5a3a22', 1.4, mpx + 3, mpy + 11, mpx + 3, gy); L(c, '#5a3a22', 1.4, mpx + 9, mpy + 11, mpx + 9, gy);
        R(c, '#e8d8a0', mpx - 1, mpy, 15, 11); R(c, '#7a5a2a', mpx - 1, mpy, 15, 1);
        R(c, '#5a9a4a', mpx + 1, mpy + 3, 4, 3); R(c, '#5a9a4a', mpx + 7, mpy + 2, 5, 4); R(c, '#5a9a4a', mpx + 5, mpy + 7, 3, 2);
        L(c, '#c0392b', 0.8, mpx + 2, mpy + 8, mpx + 10, mpy + 4);
      }
    }

    // ---- agricultura: plantio (n plots), canal, arado, rotação, celeiro, adubo ----
    var fx0 = W * 0.31, fspan = W * 0.25, fw = fspan / 6;
    if (agr > 0) {
      for (i = 0; i < agr; i++) {
        var fx1 = fx0 + i * fw, fal = agr >= 4 && i % 3 === 2;
        R(c, fal ? '#7a5a38' : '#6b4a2a', fx1, gy + 5, fw - 1, 22);
        if (fal) continue;
        for (j = 0; j < 3; j++) for (k = 0; k < 2; k++) {
          var cx = fx1 + 2 + j * (fw - 4) / 2.2, cy = gy + 11 + k * 9, sw2 = Math.sin(t * 2 + i + j) * 1;
          var ch = agr >= 6 ? 7 : agr >= 3 ? 5 : 3, wheat = agr >= 4 ? (i % 3 === 0) : (i % 2 === 0);
          L(c, wheat ? '#c9b43a' : '#8fc43a', 1, cx, cy + 4, cx + sw2, cy + 4 - ch);
          if (agr >= 2) R(c, wheat ? '#e8c24a' : '#6fa42a', cx - 1 + sw2, cy + 3 - ch, 2, 2);
        }
      }
      if (agr >= 2) { // canal de irrigação
        R(c, '#3a8fd0', fx0, gy + 27, agr * fw - 1, 3);
        c.globalAlpha = 0.6; for (i = 0; i < agr; i++) R(c, '#bfe6f5', fx0 + ((t * 8 + i * 9) % (agr * fw)), gy + 27.8, 3, 1); c.globalAlpha = 1;
        for (i = 0; i < agr; i++) R(c, '#3a8fd0', fx0 + i * fw + fw / 2 - 1, gy + 24, 1.6, 3.5);
      }
      if (agr >= 3) { // arado puxado por boi
        var ax = fx0 + ((t * 5) % Math.max(4, agr * fw - 10));
        R(c, '#4a2a18', ax + 6, gy + 3, 7, 4); R(c, '#2a1a10', ax + 11, gy + 3.5, 2.4, 2); L(c, '#5a3a22', 1, ax, gy + 6, ax + 6, gy + 5);
        L(c, '#5a3a22', 1.2, ax, gy + 3, ax - 2, gy + 8);
      }
      if (agr >= 5) { // celeiro
        var bxx = W * 0.545, bww = Math.min(16, W * 0.045);
        R(c, '#a8402e', bxx, gy - 12, bww, 13); Tri(c, '#5a2a22', bxx - 2, gy - 12, bxx + bww + 2, gy - 12, bxx + bww / 2, gy - 20);
        R(c, '#f2e8d0', bxx + bww / 2 - 2.5, gy - 7, 5, 8); L(c, '#a8402e', 0.8, bxx + bww / 2 - 2.5, gy - 7, bxx + bww / 2 + 2.5, gy + 1);
        L(c, '#a8402e', 0.8, bxx + bww / 2 + 2.5, gy - 7, bxx + bww / 2 - 2.5, gy + 1);
      }
      if (agr >= 6) { // adubo: brilho nas plantações e monte de feno
        C(c, '#e8c24a', W * 0.545 - 3, gy - 1, 3);
        for (k = 0; k < 5; k++) {
          var sp2 = (t * 0.6 + k / 5) % 1; c.globalAlpha = 1 - sp2;
          R(c, '#d8ff7a', fx0 + (k * 0.2 + 0.1) * agr * fw, gy + 24 - sp2 * 14, 1.5, 1.5);
        }
        c.globalAlpha = 1;
      }
    }

    // ---- vilas: uma casa por unidade (cabana de palha antes da Roda, casa de telha depois) ----
    if (vil > 0) {
      var hw = Math.min(14, W * 0.042), hsp = W * 0.05, tel = ei >= 3 ? '#b5503a' : '#b8923a';
      for (i = 0; i < vil; i++) {
        var hx = W * 0.30 + i * hsp, hy = gy + 1 - (i & 1) * 3;
        if (ei < 3) {
          Tri(c, tel, hx - 1, hy - 7, hx + hw + 1, hy - 7, hx + hw / 2, hy - 16); R(c, '#9a7a4a', hx + 1, hy - 7, hw - 2, 7);
          R(c, '#3a2a1a', hx + hw / 2 - 1.5, hy - 5, 3, 5);
        } else {
          R(c, '#d9c39a', hx, hy - 9, hw, 9); Tri(c, tel, hx - 1.5, hy - 9, hx + hw + 1.5, hy - 9, hx + hw / 2, hy - 16);
          R(c, ei >= 6 ? '#ffe58a' : '#6b4a2a', hx + hw / 2 - 1, hy - 6, 2, 3);
        }
      }
      mais(c, W * 0.30 + vil * hsp, gy - 2, XT[3], '#fff');
    }

    // ---- escrita: pictogramas > alfabeto > papiro > pergaminho > prensa > jornal ----
    if (esc > 0) {
      var lw = Math.min(34, W * 0.09), lx = W * 0.585, wcx = lx + lw / 2, ey = gy + 15;
      if (esc >= 4) { // biblioteca ao fundo
        var nc = Math.min(esc - 2, 4);
        R(c, '#cfc4a8', lx - 2, gy - 2, lw + 4, 4);
        R(c, '#e6dcc4', lx, gy - 20, lw, 18);
        for (i = 0; i < nc; i++) R(c, '#f7f1e0', lx + 2 + i * (lw - 6) / (nc - 1), gy - 19, 2.5, 17);
        Tri(c, '#e6dcc4', lx - 3, gy - 20, lx + lw + 3, gy - 20, wcx, gy - 30);
        C(c, '#c9a34a', wcx, gy - 23, 1.8);
      }
      if (esc === 1) { // riscos na pedra
        Tri(c, '#8d8d96', lx + 1, ey, lx + lw - 1, ey, wcx - 2, ey - 17); Tri(c, '#a2a2ac', wcx - 2, ey - 17, lx + lw - 1, ey, wcx + 7, ey - 7);
        C(c, '#b5452e', wcx - 5, ey - 10, 1.2); L(c, '#b5452e', 1, wcx - 5, ey - 9, wcx - 5, ey - 5);
        L(c, '#b5452e', 1, wcx - 8, ey - 8, wcx - 2, ey - 8); L(c, '#b5452e', 1, wcx - 5, ey - 5, wcx - 7, ey - 2); L(c, '#b5452e', 1, wcx - 5, ey - 5, wcx - 3, ey - 2);
        R(c, '#b5452e', wcx + 1, ey - 6, 6, 2.4); L(c, '#b5452e', 1, wcx + 2, ey - 4, wcx + 2, ey - 2); L(c, '#b5452e', 1, wcx + 6, ey - 4, wcx + 6, ey - 2);
      } else if (esc === 2) { // tábua com letras
        R(c, '#b0b0b8', wcx - 7, ey - 17, 14, 17); C(c, '#b0b0b8', wcx, ey - 17, 7);
        for (k = 0; k < 3; k++) {
          L(c, '#4a4a52', 1, wcx - 4, ey - 15 + k * 5, wcx - 1, ey - 15 + k * 5); L(c, '#4a4a52', 1, wcx + 1, ey - 15 + k * 5, wcx + 3, ey - 12 + k * 5);
          L(c, '#4a4a52', 1, wcx - 4, ey - 15 + k * 5, wcx - 4, ey - 12 + k * 5);
        }
      } else if (esc === 3) { // papiro numa mesa, com caniço
        R(c, '#7a5a3a', lx + 2, ey - 8, lw - 4, 2); L(c, '#5a3a22', 1.4, lx + 4, ey - 6, lx + 4, ey); L(c, '#5a3a22', 1.4, lx + lw - 4, ey - 6, lx + lw - 4, ey);
        R(c, '#f3e6b8', wcx - 9, ey - 12, 18, 4); C(c, '#d8c88a', wcx - 9, ey - 10, 2.5); C(c, '#d8c88a', wcx + 9, ey - 10, 2.5);
        for (k = 0; k < 4; k++) L(c, '#7a5a2a', 0.8, wcx - 6 + k * 3.4, ey - 11, wcx - 4.5 + k * 3.4, ey - 9);
        L(c, '#4a3a1a', 1, wcx + 2, ey - 16 + Math.sin(t * 3), wcx + 5, ey - 10);
        L(c, '#4f9a3a', 1, lx + 1, ey, lx - 1, ey - 11); L(c, '#4f9a3a', 1, lx + 1, ey, lx + 2, ey - 12); Tri(c, '#6fba4a', lx - 2, ey - 11, lx + 4, ey - 12, lx + 1, ey - 16);
      } else if (esc === 4) { // pergaminho aberto no atril
        L(c, '#5a3a22', 1.6, wcx, ey - 2, wcx, ey - 8); L(c, '#5a3a22', 1.6, wcx - 4, ey, wcx, ey - 3); L(c, '#5a3a22', 1.6, wcx + 4, ey, wcx, ey - 3);
        Tri(c, '#6b4a2a', wcx - 8, ey - 8, wcx + 8, ey - 8, wcx + 8, ey - 14); Tri(c, '#6b4a2a', wcx - 8, ey - 8, wcx - 8, ey - 14, wcx + 8, ey - 14);
        R(c, '#f0e4c0', wcx - 7, ey - 13, 14, 3); L(c, '#7a5a2a', 0.8, wcx - 5, ey - 12, wcx + 5, ey - 12);
        C(c, '#c0392b', wcx + 6, ey - 9, 1.4);
      } else if (esc >= 5) { // prensa de Gutenberg (+ jornal no nível 6)
        R(c, '#5a3a22', wcx - 9, ey - 20, 3, 20); R(c, '#5a3a22', wcx + 6, ey - 20, 3, 20); R(c, '#5a3a22', wcx - 9, ey - 22, 18, 3);
        var pr = Math.sin(t * 3) * 2;
        L(c, '#888', 1.6, wcx, ey - 22, wcx, ey - 15 + pr); R(c, '#7a7a7a', wcx - 6, ey - 14 + pr, 12, 3);
        R(c, '#8a6a3a', wcx - 8, ey - 6, 16, 4); R(c, '#f4f4f0', wcx - 5, ey - 7, 10, 1.4);
        L(c, '#5a3a22', 1.4, wcx + 9, ey - 17, wcx + 14, ey - 15 + pr);
        if (esc >= 6) {
          R(c, '#eeeeea', wcx + 11, ey - 7, 7, 7); R(c, '#bbb', wcx + 11, ey - 5, 7, 0.8); R(c, '#bbb', wcx + 11, ey - 3, 7, 0.8);
          for (k = 0; k < 3; k++) {
            var fp = (t * 0.5 + k / 3) % 1; c.globalAlpha = 1 - fp;
            R(c, '#f5f5f0', wcx + 6 + fp * 14 + k * 2, ey - 14 - fp * 22, 3, 4); R(c, '#999', wcx + 6.6 + fp * 14 + k * 2, ey - 12.6 - fp * 22, 1.8, 0.7);
          }
          c.globalAlpha = 1;
        }
      }
    }

    // ---- roda: roda maciça > carroça > estrada de pedra > ponte ----
    if (rod > 0) {
      var span = river && rod < 4 ? sx0 - 8 : W, rdy = gy + 30;
      if (rod >= 2) {
        R(c, rod >= 3 ? '#8f8f94' : '#8a7556', 0, rdy - 1, river && rod < 4 ? sx0 : W, 6);
        if (river && rod < 4) R(c, rod >= 3 ? '#8f8f94' : '#8a7556', sx0 + sw, rdy - 1, W - sx0 - sw, 6);
        if (rod >= 3) {
          c.fillStyle = '#6f6f76';
          for (x = 0; x < W; x += 7) {
            if (river && rod < 4 && x > sx0 - 4 && x < sx0 + sw) continue;
            c.fillRect(x + (((x / 7) | 0) & 1) * 3, rdy + 1 + (((x / 7) | 0) & 1) * 2, 4, 1.5);
          }
        }
      }
      if (rod === 1) { // roda maciça rolando
        x = ((t * 14) % (span + 30)) - 15;
        C(c, '#8a5a2a', x, rdy, 5); C(c, '#6b4a2a', x, rdy, 1.6);
        L(c, '#5a3a22', 1, x, rdy, x + Math.cos(x * 0.2) * 4.6, rdy + Math.sin(x * 0.2) * 4.6);
        R(c, '#c9b48a', x - 12, rdy + 4, 24, 1.2);
      } else {
        var ncar = Math.min(rod - 1, 3);
        for (i = 0; i < ncar; i++) {
          x = ((t * 20 * (0.8 + 0.1 * i) + i * span / ncar) % (span + 50)) - 25;
          y = gy + 30;
          R(c, '#5a3a22', x + 8, y - 9, 8, 5); R(c, '#2a1a10', x + 14, y - 8, 3, 2); // boi
          L(c, '#5a3a22', 1, x + 8, y - 6, x + 5, y - 6);
          R(c, '#8a5a2a', x - 8, y - 8, 14, 4);
          R(c, '#c9a34a', x - 6, y - 12, 4, 4); R(c, '#b8923a', x - 1, y - 11, 4, 3);
          wheel(c, x - 5, y - 2, 3.5, x * 0.25, '#3a2410'); wheel(c, x + 3, y - 2, 3.5, x * 0.25, '#3a2410');
        }
      }
      if (rod >= 4 && river) { // ponte de pedra em arcos sobre o rio
        R(c, '#8a8478', sx0 - 3, gy + 33, sw + 6, 7);
        c.fillStyle = '#1e5a95';
        for (k = 0; k < 3; k++) { c.beginPath(); c.arc(sx0 + sw * (0.17 + 0.33 * k), gy + 40, sw * 0.13, Math.PI, 0); c.closePath(); c.fill(); }
        R(c, '#9a9488', sx0 - 3, gy + 28, sw + 6, 6);
        R(c, '#7d776c', sx0 - 3, gy + 26, sw + 6, 2);
        for (x = sx0 - 3; x < sx0 + sw + 4; x += 8) R(c, '#6d675c', x, gy + 24, 2, 4);
      }
    }

    // ---- trilhos e trem (vapor 2+), postes (4+), linha de montagem (5) ----
    var ry = gy + 52;
    if (vap >= 2) {
      for (x = 0; x < W; x += 8) R(c, '#5a3a22', x, ry, 3, 4);
      R(c, '#666', 0, ry - 1, W, 2);
    }
    if (vap >= 4) {
      var lpx = W * 0.5, lpg = W * 0.09, lpy = gy + 46;
      for (i = 0; i < 5; i++) {
        var px1 = lpx + i * lpg;
        L(c, '#444', 1.4, px1, lpy, px1, lpy - 16); L(c, '#444', 1.2, px1, lpy - 16, px1 + 3, lpy - 16);
        if (i < 4) { c.globalAlpha = 0.5; L(c, '#222', 0.8, px1 + 3, lpy - 16, px1 + lpg, lpy - 15); c.globalAlpha = 1; }
        c.globalAlpha = 0.25; C(c, '#ffe27a', px1 + 3, lpy - 14, 6); c.globalAlpha = 0.95; C(c, '#fff3b0', px1 + 3, lpy - 15, 1.8); c.globalAlpha = 1;
      }
    }
    if (vap >= 5) { // linha de montagem
      var cvx = W * 0.05, cvw = W * 0.25, cvy = gy + 44;
      R(c, '#3a3d46', cvx, cvy, cvw, 4);
      for (x = 0; x < cvw; x += 7) C(c, '#777', cvx + x + 3.5, cvy + 5, 1.6);
      for (i = 0; i < 4; i++) {
        var bxm = cvx + ((t * 10 + i * cvw / 4) % cvw);
        R(c, i & 1 ? '#c9a34a' : '#7ec8e8', bxm, cvy - 6, 6, 6);
      }
      var rbx = cvx + cvw * 0.55, ra = Math.sin(t * 2) * 0.5;
      R(c, '#555', rbx - 3, cvy - 5, 6, 5); L(c, '#e8a42a', 2, rbx, cvy - 5, rbx + Math.sin(ra) * 7, cvy - 5 - Math.cos(ra) * 8);
      C(c, '#ffd23a', rbx + Math.sin(ra) * 7, cvy - 5 - Math.cos(ra) * 8, 1.5);
    }
    if (vap >= 2) {
      var tx = ((t * 32) % (W + 150)) - 20, ncr = Math.min(vap - 1, 4);
      R(c, '#222', tx, ry - 11, 18, 8); C(c, '#333', tx + 6, ry - 11, 5);
      R(c, '#222', tx + 14, ry - 17, 4, 7); R(c, '#c0392b', tx + 12, ry - 14, 6, 3);
      R(c, '#c0392b', tx + 1, ry - 15, 8, 4);
      wheel(c, tx + 4, ry - 2, 3, -tx * 0.3, '#ddd'); wheel(c, tx + 13, ry - 2, 3, -tx * 0.3, '#ddd');
      smoke(c, tx + 16, ry - 18, t, 0.1, 5, 22, -18, '#cfcfcf');
      for (i = 0; i < ncr - 1; i++) {
        var vx = tx - (i + 1) * 17;
        R(c, i % 2 ? '#2a6fb0' : '#8a5a2a', vx, ry - 11, 15, 8);
        wheel(c, vx + 3, ry - 2, 2.5, -tx * 0.3, '#ddd'); wheel(c, vx + 12, ry - 2, 2.5, -tx * 0.3, '#ddd');
      }
    }

    // ---- mesa de computação: calculadora > PC > rede > celular ----
    if (com > 0) {
      var dx = W * 0.34, dy = gy + 46;
      R(c, '#7a5a3a', dx, dy, 28, 3); L(c, '#5a3a22', 1.4, dx + 2, dy + 3, dx + 2, dy + 6); L(c, '#5a3a22', 1.4, dx + 26, dy + 3, dx + 26, dy + 6);
      if (com === 1) {
        R(c, '#3b3b3b', dx + 9, dy - 9, 8, 9); R(c, '#9ee89e', dx + 10, dy - 8, 6, 2.4);
        for (k = 0; k < 6; k++) R(c, '#ddd', dx + 10 + (k % 3) * 2.2, dy - 4.6 + ((k / 3) | 0) * 2.4, 1.4, 1.4);
      } else {
        R(c, '#222', dx + 3, dy - 13, 15, 11); R(c, com >= 3 ? '#1a4a8a' : '#103a1a', dx + 4, dy - 12, 13, 8);
        R(c, '#555', dx + 9, dy - 2, 3, 2);
        if (com >= 3) { C(c, '#5ec8ff', dx + 10.5, dy - 8, 3); L(c, '#bfe6f5', 0.6, dx + 7.5, dy - 8, dx + 13.5, dy - 8); L(c, '#bfe6f5', 0.6, dx + 10.5, dy - 11, dx + 10.5, dy - 5); }
        else for (k = 0; k < 3; k++) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 4 + k); R(c, '#7aff8a', dx + 5, dy - 11 + k * 2.6, 6 + k, 1); }
        c.globalAlpha = 1;
        R(c, '#c9c9d0', dx + 20, dy - 11, 6, 11); R(c, '#777', dx + 21, dy - 9, 4, 1);
      }
      if (com >= 3) {
        c.strokeStyle = '#7ee8ff'; c.lineWidth = 1;
        for (k = 0; k < 3; k++) { c.globalAlpha = Math.max(0, 0.9 - ((t * 1.2 + k * 0.33) % 1)); c.beginPath(); c.arc(dx + 10.5, dy - 14, 3 + k * 3, -2.4, -0.74); c.stroke(); }
        c.globalAlpha = 1;
      }
      if (com >= 4) { R(c, '#111', dx + 16, dy - 7, 4, 7); R(c, '#5ec8ff', dx + 16.6, dy - 6, 2.8, 4.4); }
    }

    // ---- coletores (tribo) com ferramenta na mão ----
    if (cl > 0) {
      var nbu = Math.min(Math.ceil(cl / 3), 4), pw = W * 0.22 / 10;
      for (i = 0; i < nbu; i++) {
        x = 8 + i * W * 0.22 / nbu; y = gy + 6 + (i % 2) * 6;
        C(c, '#2f6a2a', x, y, 4); C(c, '#3a7a32', x + 3, y + 1, 3);
        R(c, '#e74c3c', x - 2, y - 1, 1.5, 1.5); R(c, '#e74c3c', x + 2, y - 2, 1.5, 1.5); R(c, '#e74c3c', x + 1, y + 1, 1.5, 1.5);
      }
      for (var par = 0; par < 2; par++) for (i = par; i < cl; i += 2) {
        x = 6 + i * pw; var fy = gy + 13 + par * 8 + Math.sin(t * 3 + i) * 0.8;
        L(c, '#6b4a2a', 1, x, fy - 3, x - 1, fy); L(c, '#6b4a2a', 1, x, fy - 3, x + 1, fy);
        R(c, par ? '#9a6a3a' : '#8a5a3a', x - 1.5, fy - 8, 3, 5);
        C(c, '#e0b088', x, fy - 10, 2.2);
        L(c, '#e0b088', 1, x, fy - 7, x - 2, fy - 4 + Math.cos(t * 4 + i) * 1.2);
        if (fer > 0) { tool(c, fer, x + 3, fy - 3, t, i); L(c, '#e0b088', 1, x, fy - 7, x + 3, fy - 4); }
        else L(c, '#e0b088', 1, x, fy - 7, x + 2 + Math.sin(t * 4 + i) * 1.5, fy - 4 + Math.cos(t * 4 + i) * 1.5);
      }
      mais(c, W * 0.22, gy + 34, XT[0], '#fff');
    }

    // ---- fogo: faísca > fogueira > espeto > forno de barro ----
    if (fogo > 0) {
      var fxx = W * 0.255, fyy = gy + 20, nfl = fogo === 1 ? 1 : 4, fs = fogo === 1 ? 0.55 : 1;
      c.globalAlpha = 0.18; C(c, '#ff9a2a', fxx, fyy - 6 * fs, 22 * fs); c.globalAlpha = 1;
      for (i = 0; i < 5; i++) C(c, '#777', fxx + Math.cos(i * 1.26) * 7 * fs, fyy + 1 + Math.sin(i * 1.26) * 2, 1.8);
      if (fogo >= 2) { L(c, '#5a3a1a', 2, fxx - 6, fyy, fxx + 6, fyy - 3); L(c, '#6b4a2a', 2, fxx - 6, fyy - 3, fxx + 6, fyy); }
      else { L(c, '#5a3a1a', 1.4, fxx - 3, fyy, fxx + 3, fyy - 1); }
      for (i = 0; i < nfl; i++) {
        var fo = (i - (nfl - 1) / 2) * 2.6 * fs, fh = (10 + Math.sin(t * 9 + i * 2) * 3) * fs - Math.abs(i - (nfl - 1) / 2) * 1.5;
        Tri(c, '#ff7a1a', fxx + fo - 3 * fs, fyy - 1, fxx + fo + 3 * fs, fyy - 1, fxx + fo + Math.sin(t * 7 + i) * 1.5, fyy - fh);
        Tri(c, '#ffd23a', fxx + fo - 1.7 * fs, fyy - 1, fxx + fo + 1.7 * fs, fyy - 1, fxx + fo, fyy - fh * 0.6);
      }
      for (i = 0; i < 3; i++) {
        var p = (t * 0.8 + i / 3) % 1;
        c.globalAlpha = 1 - p; R(c, '#ffb03a', fxx + Math.sin(i * 5 + t) * 5, fyy - 8 * fs - p * 22, 1.3, 1.3);
      }
      c.globalAlpha = 1;
      if (fogo >= 3) { // espeto com carne
        L(c, '#5a3a1a', 1.4, fxx - 9, fyy + 2, fxx - 9, fyy - 13); L(c, '#5a3a1a', 1.4, fxx + 9, fyy + 2, fxx + 9, fyy - 13);
        L(c, '#6b4a2a', 1.2, fxx - 11, fyy - 12, fxx + 11, fyy - 12);
        c.fillStyle = '#a0522d'; c.beginPath(); c.ellipse(fxx, fyy - 12, 6, 2.6 + Math.sin(t * 2) * 0.4, 0, 0, 6.2832); c.fill();
        R(c, '#c8743a', fxx - 3, fyy - 13.5, 3, 1.2);
      }
      if (fogo >= 4) { // forno de barro
        var ox = fxx + 19;
        c.fillStyle = '#b5683a'; c.beginPath(); c.arc(ox, fyy + 1, 9, Math.PI, 0); c.closePath(); c.fill();
        R(c, '#8a4a28', ox - 9, fyy + 1, 18, 2);
        c.fillStyle = '#2a1408'; c.beginPath(); c.arc(ox, fyy + 1, 4, Math.PI, 0); c.closePath(); c.fill();
        c.globalAlpha = 0.6 + 0.4 * Math.sin(t * 8); Tri(c, '#ff9a2a', ox - 2.5, fyy + 1, ox + 2.5, fyy + 1, ox, fyy - 2.5); c.globalAlpha = 1;
        R(c, '#8a4a28', ox + 3, fyy - 12, 3, 5);
        smoke(c, ox + 4.5, fyy - 12, t, 0.7, 4, 22, 6, '#aaa');
      } else smoke(c, fxx, fyy - 14 * fs, t, 0.3, 5, 34, 8, '#888');
    }

    // ---- base de lançamento: do foguete pequeno ao lançador ----
    if (esp > 0) {
      var px0 = W * 0.935, rh = RH[esp], per = Math.max(7, 17 - esp * 1.4), ph = (t % per) / per;
      var tw = rh + 6;
      R(c, '#555', px0 - 11, gy, 22, 3);
      R(c, '#777', px0 + 10, gy - tw, 2, tw + 1); R(c, '#777', px0 + 14, gy - tw, 2, tw + 1);
      for (j = 0; j < tw / 7 - 1; j++) L(c, '#999', 1, px0 + 10, gy - tw + 3 + j * 7, px0 + 16, gy - tw + 9 + j * 7);
      if (ph < 0.55) {
        var fl = ph > 0.45 ? 7 + Math.sin(t * 50) * 2 + esp : 0, shk = ph > 0.45 ? Math.sin(t * 60) * 0.6 : 0;
        rocketK(c, px0 + shk, gy, esp, fl);
      } else {
        var q = (ph - 0.55) / 0.45, off = (H + 80) * Math.pow(q, 1.8);
        for (k = 1; k < 6; k++) {
          var qk = q - k * 0.035;
          if (qk > 0) {
            c.globalAlpha = 0.5 * (1 - k / 6);
            C(c, '#eee', px0 + Math.sin(k) * 2, gy - (H + 80) * Math.pow(qk, 1.8), 3 + k);
          }
        }
        c.globalAlpha = 1;
        if (q < 0.25) { c.globalAlpha = 0.4 * (1 - q * 4); C(c, '#fff', px0, gy, 12 + q * 40); c.globalAlpha = 1; }
        rocketK(c, px0, gy - off, esp, 10 + q * 12 + esp);
      }
    }

    // ---- bases na Lua/Marte: excesso de colônias ----
    if (clo > 0 && XT[13] > 0) mais(c, W - 28, gy * 0.12, XT[13], '#fff');

    // ---- faíscas do burst ----
    var dt = t - sT0;
    if (dt >= 0 && dt < 1) {
      for (i = 0; i < SP.length; i++) {
        var sp = SP[i];
        c.globalAlpha = 1 - dt;
        C(c, CORES[i & 3], sX + sp.vx * dt, sY + sp.vy * dt + 140 * dt * dt, 2.2 * (1 - dt) + 0.5);
      }
      c.globalAlpha = 1;
    }

    // ---- rótulo da era ----
    c.font = 'bold 11px sans-serif'; c.textAlign = 'left';
    var rot = e < 0 ? 'Compre algo para começar!' : NOMES[e];
    c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillText(rot, 9, 17);
    c.fillStyle = '#ffffff'; c.fillText(rot, 8, 16);
  }

  function burst(c, W, H, t) {
    sT0 = t; sX = W * 0.5; sY = H * 0.5;
    for (var i = 0; i < SP.length; i++) { SP[i].vx = (Math.random() - 0.5) * 160; SP[i].vy = -50 - Math.random() * 100; }
    c.globalAlpha = 0.6; c.strokeStyle = '#ffd23a'; c.lineWidth = 2;
    c.beginPath(); c.arc(sX, sY, 10, 0, 6.2832); c.stroke(); c.globalAlpha = 1;
  }

  return { h: 230, draw: draw, burst: burst };
})();
