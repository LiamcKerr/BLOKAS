(function () {
  "use strict";
  var $ = function (i) { return document.getElementById(i); };
  var gw = $("gw"), hudL = $("hudL"), hudR = $("hudR"), pr = $("pr"), dlg = $("dlg"),
    dwho = $("dwho"), dtxt = $("dtxt"), fdr = $("fdr"), vig = $("vig"), spdEl = $("spd"),
    capEl = $("cap");
  var TOUCH = window.matchMedia && matchMedia("(pointer:coarse)").matches;

  // ---------- renderer / scene ----------
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9fb2c0);
  scene.fog = new THREE.Fog(0x9fb2c0, 35, 280);
  var camera = new THREE.PerspectiveCamera(72, 16 / 9, 0.1, 600);
  camera.rotation.order = "YXZ";
  scene.add(camera);
  var renderer = new THREE.WebGLRenderer({ antialias: false });
  renderer.domElement.id = "cv";
  gw.insertBefore(renderer.domElement, gw.firstChild);
  function rsz() {
    var w = gw.clientWidth || 640, h = gw.clientHeight || 480;
    renderer.setSize(Math.max(2, Math.floor(w / 3)), Math.max(2, Math.floor(h / 3)), false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  rsz();
  window.addEventListener("resize", rsz);

  var hemi = new THREE.HemisphereLight(0xbfd0dd, 0x6a6a5f, 0.95);
  scene.add(hemi);
  var sun = new THREE.DirectionalLight(0xfff2dd, 0.5);
  sun.position.set(-90, 110, 40);
  scene.add(sun);

  // ---------- textures / materials ----------
  function tex(w, h, f, rx, ry) {
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    f(c.getContext("2d"), w, h);
    var t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); }
    return t;
  }
  function noise(g, w, h, base, amt) {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (var i = 0; i < w * h / 6; i++) {
      g.fillStyle = "rgba(0,0,0," + (Math.random() * amt) + ")";
      g.fillRect(Math.random() * w | 0, Math.random() * h | 0, 1, 1);
    }
  }
  var M = function (t) { return new THREE.MeshLambertMaterial({ map: t }); };
  var C = function (c) { return new THREE.MeshLambertMaterial({ color: c }); };
  var B = function (t) { return new THREE.MeshBasicMaterial({ map: t }); };

  var wallM = M(tex(64, 64, function (g) {
    g.fillStyle = "#cfc4a6"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#c2b694"; for (var x = 0; x < 64; x += 16) g.fillRect(x, 0, 6, 64);
  }, 4, 2));
  var carpetM = M(tex(64, 64, function (g) {
    noise(g, 64, 64, "#7a4a3a", 0.18);
    g.strokeStyle = "#5e362a"; for (var i = 0; i < 4; i++) g.strokeRect(i * 16 + 4, 4, 8, 56);
  }, 5, 4));
  var concM = M(tex(64, 64, function (g) {
    noise(g, 64, 64, "#9a9a96", 0.14); g.strokeStyle = "#7c7c78"; g.strokeRect(0, 0, 64, 64);
  }, 6, 6));
  var hallM = M(tex(64, 64, function (g) {
    g.fillStyle = "#cfc8b4"; g.fillRect(0, 0, 64, 32);
    g.fillStyle = "#3f5a4a"; g.fillRect(0, 32, 64, 32);
    g.fillStyle = "#2e4438"; g.fillRect(0, 31, 64, 2);
  }, 4, 1));
  function panelTex(rx, ry, lit) {
    return M(tex(128, 128, function (g) {
      g.fillStyle = "#b9b4ab"; g.fillRect(0, 0, 128, 128);
      for (var y = 0; y < 128; y += 32) for (var x = 0; x < 128; x += 32) {
        g.strokeStyle = "#8e8a80"; g.strokeRect(x, y, 32, 32);
        g.fillStyle = "#4a4f55"; g.fillRect(x + 9, y + 8, 14, 17);
        g.fillStyle = Math.random() < lit ? "#e8d36b" : "#2e3d4a";
        g.fillRect(x + 11, y + 10, 10, 13);
      }
    }, rx, ry));
  }
  var panelM = panelTex(14, 8, 0.18);
  var panelM2 = panelTex(10, 8, 0.25);
  var asphM = M(tex(64, 64, function (g) { noise(g, 64, 64, "#56565a", 0.2); }, 20, 6));
  var lotM = M(tex(64, 64, function (g) { noise(g, 64, 64, "#5a5a60", 0.18); }, 16, 5));
  var roadM = M(tex(64, 64, function (g) { noise(g, 64, 64, "#3e3e44", 0.22); }, 24, 2));
  var sideM = M(tex(64, 64, function (g) {
    noise(g, 64, 64, "#8e8c84", 0.12);
    g.strokeStyle = "#6e6c64"; g.strokeRect(0, 0, 32, 64); g.strokeRect(32, 0, 32, 64);
  }, 30, 1));
  var grassM = M(tex(64, 64, function (g) { noise(g, 64, 64, "#5d7a40", 0.25); }, 60, 60));
  var courtM = M(tex(64, 64, function (g) {
    noise(g, 64, 64, "#4a4a52", 0.18);
    g.strokeStyle = "#cfd0d4"; g.lineWidth = 2; g.strokeRect(3, 3, 58, 58); g.beginPath();
    g.arc(32, 60, 14, Math.PI, 2 * Math.PI); g.stroke();
  }, 1, 1));
  var woodM = M(tex(32, 32, function (g) {
    g.fillStyle = "#8a5a32"; g.fillRect(0, 0, 32, 32);
    g.strokeStyle = "#6e4424";
    for (var y = 4; y < 32; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(32, y); g.stroke(); }
  }, 1, 1));
  var linoM = M(tex(64, 64, function (g) {
    g.fillStyle = "#b8b09a"; g.fillRect(0, 0, 64, 64);
    g.fillStyle = "#a39a82";
    for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++) if ((x + y) % 2) g.fillRect(x * 8, y * 8, 8, 8);
  }, 8, 6));
  var rubberM = M(tex(64, 64, function (g) { noise(g, 64, 64, "#2e3034", 0.3); }, 10, 8));
  var clubWallM = M(tex(64, 64, function (g) { noise(g, 64, 64, "#1a1a20", 0.4); }, 8, 3));
  var prodM = M(tex(64, 64, function (g) {
    g.fillStyle = "#7a6248"; g.fillRect(0, 0, 64, 64);
    var cols = ["#c9423a", "#3a7ac9", "#e0c33a", "#3ac96a", "#e08a3a", "#c93ab0", "#e9e6d8"];
    for (var y = 0; y < 4; y++) {
      g.fillStyle = "#5a4a38"; g.fillRect(0, y * 16 + 13, 64, 3);
      for (var x = 0; x < 8; x++) {
        g.fillStyle = cols[(Math.random() * cols.length) | 0];
        g.fillRect(x * 8 + 1, y * 16 + 2, 6, 11);
      }
    }
  }, 3, 1));
  var ribM = M(tex(64, 32, function (g) {
    g.fillStyle = "#b8b6ae"; g.fillRect(0, 0, 64, 32);
    g.fillStyle = "#84827a"; for (var x = 0; x < 64; x += 8) g.fillRect(x, 0, 3, 32);
  }, 6, 1));
  var stripeM = M(tex(8, 64, function (g) {
    g.fillStyle = "#dcd8d0"; g.fillRect(0, 0, 8, 64);
    g.fillStyle = "#c22418"; g.fillRect(0, 0, 8, 16); g.fillRect(0, 32, 8, 16);
  }, 1, 4));
  var darkM = C(0x23262a), whiteM = C(0xdfe0d8), greyM = C(0x8d9094),
    redM = C(0x7c2a22), greenM = C(0x274d33), mercM = C(0x16301e),
    yellowM = C(0xc9a03f), darkRingM = C(0x3a3c40);
  var glassM = new THREE.MeshLambertMaterial({ color: 0x8fb6c9, transparent: true, opacity: 0.45 });

  function textTex(w, h, bg, fg, lines, size) {
    return tex(w, h, function (g) {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = fg; g.font = "bold " + size + "px monospace"; g.textAlign = "center";
      var lh = size + 4, y0 = h / 2 - (lines.length - 1) * lh / 2 + size * 0.35;
      lines.forEach(function (L, i) { g.fillText(L, w / 2, y0 + i * lh); });
    });
  }

  // ---------- groups / colliders ----------
  // gS: shared outdoors (always visible — also from the balcony)
  // gA: flat + stairwell | gB: own building exterior | gC: shop | gD: gym | gE: club
  var gA = new THREE.Group(), gB = new THREE.Group(), gC = new THREE.Group(),
    gD = new THREE.Group(), gE = new THREE.Group(), gS = new THREE.Group(), gF = new THREE.Group(),
    gM = new THREE.Group(), gK = new THREE.Group(), gO = new THREE.Group();
  [gA, gB, gC, gD, gE, gS, gF, gM, gK, gO].forEach(function (g) { scene.add(g); });
  var flatCols = [], hallCols = [], yardCols = [], shopCols = [], gymCols = [], clubCols = [],
    pondCols = [], maxCols = [], akroCols = [], oldCols = [];

  function box(g, m, x0, y0, z0, x1, y1, z1) {
    var b = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), m);
    b.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    g.add(b); return b;
  }
  function solid(arr, g, m, x0, z0, x1, z1, y0, y1) {
    box(g, m, x0, y0, z0, x1, y1, z1);
    arr.push({ a: x0, b: x1, c: z0, d: z1 });
  }
  function plane(g, m, w, h, x, y, z, ry) {
    var p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
    p.position.set(x, y, z); if (ry) p.rotation.y = ry; g.add(p); return p;
  }
  function cyl(g, m, r0, r1, h, y, seg) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 10), m);
    c.position.y = y; g.add(c); return c;
  }

  var FY = 12, WH = 2.7, WT = 0.15, HX = 20, HW = 2.2, SX = 200, GX = 300, NX = 400;

  // ---------- THE FLAT ----------
  box(gA, carpetM, -0.15, FY - 0.1, -0.15, 8.15, FY, 6.15);
  box(gA, whiteM, -1.7, FY + WH, 2.9, 8.15, FY + WH + 0.12, 6.15);
  box(gA, whiteM, -0.15, FY + WH, -0.15, 8.15, FY + WH + 0.12, 2.9);
  solid(flatCols, gA, wallM, -0.15, -WT, 8.15, 0, FY, FY + WH);
  solid(flatCols, gA, wallM, -0.15, 6, 8.15, 6 + WT, FY, FY + WH);
  solid(flatCols, gA, wallM, 8, -WT, 8 + WT, 6 + WT, FY, FY + WH);
  solid(flatCols, gA, wallM, -WT, 0, 0, 1.1, FY, FY + WH);
  solid(flatCols, gA, wallM, -WT, 2.7, 0, 3.4, FY, FY + WH);
  solid(flatCols, gA, wallM, -WT, 4.3, 0, 6, FY, FY + WH);
  solid(flatCols, gA, wallM, -WT, 1.1, 0, 2.7, FY, FY + 0.9);
  box(gA, wallM, -WT, FY + 2.4, 1.1, 0, FY + WH, 2.7);
  box(gA, glassM, -0.07, FY + 0.9, 1.1, -0.05, FY + 2.4, 2.7);
  flatCols.push({ a: -WT, b: 0, c: 1.1, d: 2.7 });
  box(gA, wallM, -WT, FY + 2.3, 3.4, 0, FY + WH, 4.3);
  solid(flatCols, gA, wallM, 6.2, 3.6, 6.35, 6, FY, FY + WH);
  solid(flatCols, gA, wallM, 6.35, 3.6, 6.9, 3.75, FY, FY + WH);
  solid(flatCols, gA, wallM, 7.6, 3.6, 8, 3.75, FY, FY + WH);
  box(gA, wallM, 6.9, FY + 2.2, 3.6, 7.6, FY + WH, 3.75);
  box(gA, whiteM, 6.35, FY - 0.02, 3.75, 8, FY + 0.02, 6);
  // bed
  solid(flatCols, gA, woodM, 0.35, 0.35, 2.2, 2.05, FY, FY + 0.45);
  box(gA, redM, 0.4, FY + 0.45, 0.4, 2.15, FY + 0.6, 2.0);
  box(gA, whiteM, 0.45, FY + 0.6, 0.45, 1.05, FY + 0.72, 1.1);
  // desk + pc
  solid(flatCols, gA, woodM, 4.3, 0.15, 6.1, 0.9, FY, FY + 0.78);
  box(gA, darkM, 4.95, FY + 0.78, 0.25, 5.75, FY + 1.32, 0.38);
  var lolT = tex(32, 24, function (g) {
    g.fillStyle = "#0a1420"; g.fillRect(0, 0, 32, 24);
    g.strokeStyle = "#c8a13c"; g.strokeRect(1, 1, 30, 22);
    g.fillStyle = "#c8a13c"; g.fillRect(8, 9, 4, 8); g.fillRect(14, 9, 4, 8); g.fillRect(20, 9, 4, 8);
  });
  plane(gA, B(lolT), 0.72, 0.46, 5.35, FY + 1.05, 0.39, 0);
  box(gA, darkM, 5.95, FY + 0.78, 0.2, 6.08, FY + 1.2, 0.7);
  box(gA, darkM, 4.45, FY + 0.785, 0.5, 4.62, FY + 0.8, 0.62);
  box(gA, new THREE.MeshBasicMaterial({ color: 0x1c2630 }), 4.465, FY + 0.8, 0.512, 4.605, FY + 0.805, 0.608);
  solid(flatCols, gA, darkM, 5.0, 1.05, 5.6, 1.6, FY, FY + 0.5);
  box(gA, darkM, 5.05, FY + 0.5, 1.45, 5.55, FY + 1.05, 1.58);
  // tv
  solid(flatCols, gA, woodM, 2.6, 0.15, 3.9, 0.65, FY, FY + 0.5);
  box(gA, darkM, 2.72, FY + 0.5, 0.22, 3.78, FY + 1.12, 0.45);
  box(gA, new THREE.MeshBasicMaterial({ color: 0x101812 }), 2.78, FY + 0.56, 0.46, 3.72, FY + 1.06, 0.47);
  // kitchen
  solid(flatCols, gA, whiteM, 0.25, 5.1, 1.05, 5.85, FY, FY + 1.9);
  box(gA, darkM, 0.3, FY + 0.9, 5.84, 1.0, FY + 0.98, 5.86);
  solid(flatCols, gA, woodM, 1.2, 5.45, 3.4, 6, FY, FY + 0.95);
  box(gA, whiteM, 1.2, FY + 0.95, 5.45, 3.4, FY + 1.0, 6);
  box(gA, darkM, 1.5, FY + 1.0, 5.6, 2.0, FY + 1.02, 5.95);
  // bathroom
  box(gA, whiteM, 7.55, FY, 4.6, 8, FY + 0.82, 5.1);
  flatCols.push({ a: 7.55, b: 8, c: 4.6, d: 5.1 });
  box(gA, whiteM, 7.35, FY, 5.45, 7.95, FY + 0.42, 5.95);
  box(gA, whiteM, 7.45, FY + 0.42, 5.55, 7.85, FY + 0.78, 5.9);
  var portT = tex(64, 80, function (g) {
    g.fillStyle = "#33424a"; g.fillRect(0, 0, 64, 80);
    g.fillStyle = "#dcab7c"; g.fillRect(8, 58, 48, 22);
    g.fillStyle = "#161616"; g.fillRect(14, 60, 36, 20);
    g.fillStyle = "#dcab7c"; g.fillRect(27, 44, 10, 16); g.fillRect(22, 14, 20, 28);
    g.fillRect(20, 18, 24, 18); g.fillRect(18, 24, 4, 7); g.fillRect(42, 24, 4, 7);
    g.fillStyle = "#c4905f"; g.fillRect(22, 35, 20, 7);
    g.fillStyle = "#6d4c28"; g.fillRect(19, 9, 26, 9); g.fillRect(18, 12, 5, 9); g.fillRect(41, 12, 5, 9);
    g.fillRect(24, 6, 4, 5); g.fillRect(31, 5, 4, 6); g.fillRect(37, 7, 4, 4);
    g.fillStyle = "#4a3015"; g.fillRect(23, 24, 8, 2); g.fillRect(33, 24, 8, 2);
    g.fillStyle = "#efe7da"; g.fillRect(24, 27, 6, 3); g.fillRect(34, 27, 6, 3);
    g.fillStyle = "#3a2a18"; g.fillRect(26, 27, 2, 3); g.fillRect(36, 27, 2, 3);
    g.fillStyle = "#c4905f"; g.fillRect(30, 29, 3, 6);
    g.fillStyle = "#a3624c"; g.fillRect(27, 40, 9, 2);
    g.fillStyle = "rgba(70,50,30,0.3)"; g.fillRect(22, 36, 20, 8);
  });
  plane(gA, B(portT), 0.55, 0.7, 7.97, FY + 1.55, 4.85, -Math.PI / 2);
  box(gA, woodM, 7.98, FY + 1.16, 4.5, 8, FY + 1.94, 5.2);
  plane(gA, woodM, 0.95, 2.05, 7.99, FY + 1.03, 2.7, -Math.PI / 2);
  // balcony
  box(gA, greenM, -1.6, FY - 0.15, 3.0, 0.05, FY, 4.8);
  box(gA, whiteM, -1.6, FY + WH, 3.0, 0.05, FY + WH + 0.15, 4.8);
  solid(flatCols, gA, concM, -1.6, 3.0, 0, 3.12, FY, FY + WH);
  solid(flatCols, gA, concM, -1.6, 4.68, 0, 4.8, FY, FY + WH);
  solid(flatCols, gA, concM, -1.6, 3.0, -1.45, 4.8, FY, FY + 1.02);
  box(gA, darkM, -1.5, FY + 1.02, 3.05, -1.43, FY + 1.07, 4.75);
  var bot = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 6), greenM);
  bot.position.set(-1.2, FY + 0.15, 4.4); gA.add(bot);
  var bot2 = bot.clone(); bot2.position.set(-1.05, FY + 0.15, 4.5); gA.add(bot2);
  var bot3 = bot.clone(); bot3.position.set(-1.32, FY + 0.15, 3.4); gA.add(bot3);
  var lampF = new THREE.PointLight(0xffe2b0, 0.8, 15); lampF.position.set(4, FY + 2.35, 3); gA.add(lampF);
  var lampB = new THREE.PointLight(0xdfe8ff, 0.45, 6); lampB.position.set(7.2, FY + 2.3, 4.8); gA.add(lampB);

  // ---------- THE STAIRWELL ----------
  box(gA, concM, HX - 0.15, FY - 0.1, -0.15, HX + HW + 0.15, FY, 8.15);
  box(gA, concM, HX - 0.15, FY + WH, -0.15, HX + HW + 0.15, FY + WH + 0.12, 8.15);
  solid(hallCols, gA, hallM, HX - WT, 0, HX, 8, FY, FY + WH);
  solid(hallCols, gA, hallM, HX + HW, 0, HX + HW + WT, 8, FY, FY + WH);
  solid(hallCols, gA, hallM, HX - WT, -WT, HX + HW + WT, 0, FY, FY + WH);
  solid(hallCols, gA, hallM, HX - WT, 8, HX + HW + WT, 8 + WT, FY, FY + WH);
  plane(gA, woodM, 0.95, 2.05, HX + 0.01, FY + 1.03, 2.7, Math.PI / 2);
  plane(gA, B(textTex(32, 32, "#caa64c", "#3a2c10", ["47"], 14)), 0.16, 0.16, HX + 0.02, FY + 1.8, 2.7, Math.PI / 2);
  plane(gA, C(0x5e2c24), 0.95, 2.05, HX + HW - 0.01, FY + 1.03, 4.25, -Math.PI / 2);
  plane(gA, greyM, 1.0, 2.1, HX + 1.1, FY + 1.05, 7.99, Math.PI);
  plane(gA, B(textTex(64, 20, "#2c5a3a", "#dff0df", ["LAIPTAI"], 11)), 0.6, 0.2, HX + 1.1, FY + 2.3, 7.98, Math.PI);
  plane(gA, greyM, 0.95, 2.05, HX + HW - 0.01, FY + 1.05, 6.45, -Math.PI / 2);
  plane(gA, B(textTex(48, 48, "#efe9d8", "#555555", ["NE-", "VEIKIA"], 11)), 0.24, 0.24, HX + HW - 0.02, FY + 1.6, 6.45, -Math.PI / 2);
  var lampH = new THREE.PointLight(0xcfe0c8, 0.6, 10); lampH.position.set(HX + 1.1, FY + 2.35, 4); gA.add(lampH);

  // ---------- people factory ----------
  function person(top, bottom, scarf, s, hair) {
    s = s || 1;
    var p = new THREE.Group();
    box(p, C(bottom), -0.32 * s, 0, -0.24 * s, 0.32 * s, 0.75 * s, 0.24 * s);
    box(p, C(top), -0.3 * s, 0.75 * s, -0.21 * s, 0.3 * s, 1.25 * s, 0.21 * s);
    box(p, C(top), -0.42 * s, 0.8 * s, -0.1 * s, -0.3 * s, 1.2 * s, 0.1 * s);
    box(p, C(top), 0.3 * s, 0.8 * s, -0.1 * s, 0.42 * s, 1.2 * s, 0.1 * s);
    box(p, C(0xe0b48e), -0.14 * s, 1.25 * s, -0.13 * s, 0.14 * s, 1.55 * s, 0.13 * s);
    var faceT = tex(24, 24, function (g) {
      g.fillStyle = "#e0b48e"; g.fillRect(0, 0, 24, 24);
      g.fillStyle = "#222"; g.fillRect(7, 10, 2, 2); g.fillRect(16, 10, 2, 2);
      g.fillStyle = "#b06a55"; g.fillRect(9, 18, 6, 2);
    });
    plane(p, B(faceT), 0.27 * s, 0.29 * s, 0, 1.4 * s, -0.135 * s, Math.PI);
    if (scarf) {
      box(p, C(scarf), -0.17 * s, 1.5 * s, -0.16 * s, 0.17 * s, 1.62 * s, 0.16 * s);
      box(p, C(scarf), -0.17 * s, 1.25 * s, 0.1 * s, 0.17 * s, 1.58 * s, 0.18 * s);
    } else if (hair) {
      box(p, C(hair), -0.16 * s, 1.5 * s, -0.15 * s, 0.16 * s, 1.6 * s, 0.15 * s);
      box(p, C(hair), -0.17 * s, 1.05 * s, 0.08 * s, 0.17 * s, 1.55 * s, 0.18 * s);
      box(p, C(hair), -0.18 * s, 1.2 * s, -0.05 * s, -0.14 * s, 1.55 * s, 0.13 * s);
      box(p, C(hair), 0.14 * s, 1.2 * s, -0.05 * s, 0.18 * s, 1.55 * s, 0.13 * s);
    } else {
      box(p, C(0x4a3520), -0.15 * s, 1.52 * s, -0.14 * s, 0.15 * s, 1.6 * s, 0.14 * s);
    }
    return p;
  }
  var npc = person(0x7a4040, 0x4a3450, 0xc9a03f, 1);
  npc.position.set(HX + 1.65, FY, 4.7); npc.rotation.y = Math.PI / 2; npc.visible = false; gA.add(npc);

  // ---------- SHARED: ground, the TV Tower ----------
  box(gS, grassM, -220, -0.12, -220, 520, 0, 320);
  var twr = new THREE.Group();
  cyl(twr, concM, 5, 11, 26, 13, 12);
  cyl(twr, concM, 3.0, 4.4, 98, 75, 12);
  cyl(twr, ribM, 8.6, 3.4, 9, 128.5, 14);
  cyl(twr, ribM, 8.6, 8.6, 11, 138.5, 14);
  cyl(twr, darkRingM, 8.7, 8.7, 3.5, 145.7, 14);
  cyl(twr, concM, 2.4, 8.0, 7, 151, 12);
  cyl(twr, concM, 2.0, 2.4, 10, 159.5, 8);
  cyl(twr, stripeM, 1.1, 1.6, 34, 181.5, 8);
  cyl(twr, stripeM, 0.5, 1.0, 34, 215.5, 8);
  var tl = new THREE.Mesh(new THREE.SphereGeometry(0.9, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a }));
  tl.position.y = 233.5; twr.add(tl);
  twr.position.set(-160, 0, 40); gS.add(twr);
  [[-80, -40, 30], [-70, 95, 28], [45, 150, 33], [130, 80, 24], [-130, 140, 30],
   [95, -55, 27], [170, 115, 30], [-40, 170, 33], [60, 190, 30], [150, 170, 26],
   [-110, 60, 24], [-150, -10, 30], [110, 30, 27]].forEach(function (p) {
    box(gS, panelM, p[0] - 22, 0, p[1] - 6, p[0] + 22, p[2], p[1] + 6);
  });

  // ---------- STREET LEVEL (shared — visible from the balcony too) ----------
  box(gS, asphM, -16, 0.005, 0.05, 52, 0.02, 14.8);
  box(gS, sideM, -26, 0.015, 14.8, 86, 0.035, 16.2);
  box(gS, roadM, -26, 0.005, 16.2, 104, 0.03, 22.2);
  box(gS, sideM, -26, 0.015, 22.2, 86, 0.035, 23.6);
  for (var dx0 = -24; dx0 < 104; dx0 += 6) box(gS, whiteM, dx0, 0.032, 19.05, dx0 + 2.6, 0.04, 19.35);
  for (var zx = 16.6; zx < 22; zx += 1.1) box(gS, whiteM, 11.5, 0.033, zx, 15.5, 0.042, zx + 0.55);
  // dumpsters
  solid(yardCols, gS, greenM, 15.9, 0.9, 17.5, 2.1, 0, 1.3);
  solid(yardCols, gS, greenM, 17.9, 0.9, 19.5, 2.1, 0, 1.3);
  // playground
  solid(yardCols, gS, greyM, 0.9, 10.4, 3.1, 11.6, 0, 0.1);
  box(gS, greyM, 0.95, 0, 10.9, 1.1, 2.1, 11.1); box(gS, greyM, 2.9, 0, 10.9, 3.05, 2.1, 11.1);
  box(gS, greyM, 0.95, 2.0, 10.85, 3.05, 2.12, 11.15);
  box(gS, darkM, 1.7, 0.5, 10.95, 2.3, 0.56, 11.05);
  box(gS, woodM, 4.5, 0, 9.5, 7.5, 0.25, 12.5);
  box(gS, yellowM, 4.7, 0.25, 9.7, 7.3, 0.3, 12.3);
  yardCols.push({ a: 4.5, b: 7.5, c: 9.5, d: 12.5 });
  // ---------- generic vehicle (front at -z) ----------
  function vehicle(col) {
    var v = new THREE.Group();
    box(v, C(col), -0.88, 0.3, -2.05, 0.88, 0.72, 2.05);
    box(v, C(col), -0.8, 0.72, -1.05, 0.8, 1.12, 0.95);
    box(v, glassM, -0.84, 0.75, -0.98, 0.84, 1.08, 0.55);
    box(v, new THREE.MeshBasicMaterial({ color: 0xe8e2b8 }), -0.78, 0.45, -2.07, -0.45, 0.62, -2.02);
    box(v, new THREE.MeshBasicMaterial({ color: 0xe8e2b8 }), 0.45, 0.45, -2.07, 0.78, 0.62, -2.02);
    box(v, new THREE.MeshBasicMaterial({ color: 0xb52a22 }), -0.78, 0.5, 2.02, -0.4, 0.66, 2.06);
    box(v, new THREE.MeshBasicMaterial({ color: 0xb52a22 }), 0.4, 0.5, 2.02, 0.78, 0.66, 2.06);
    [[-0.82, -1.35], [0.82, -1.35], [-0.82, 1.35], [0.82, 1.35]].forEach(function (w) {
      var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.18, 8), darkM);
      wh.rotation.z = Math.PI / 2; wh.position.set(w[0], 0.3, w[1]); v.add(wh);
    });
    return v;
  }
  // parked cars by the building
  function parkedCar(x, z, col, alongX) {
    var v = vehicle(col);
    v.position.set(x, 0, z);
    if (alongX) {
      v.rotation.y = Math.PI / 2;
      yardCols.push({ a: x - 2.2, b: x + 2.2, c: z - 1.05, d: z + 1.05 });
    } else {
      yardCols.push({ a: x - 1.05, b: x + 1.05, c: z - 2.2, d: z + 2.2 });
    }
    gS.add(v); return v;
  }
  parkedCar(21, 3.4, 0x6e7076, true); parkedCar(27, 3.4, 0x4a3550, true); parkedCar(33, 3.4, 0x8a2c2c, true);
  // basketball court
  box(gS, courtM, 36, 0.025, 5, 46, 0.045, 13);
  cyl(gS, greyM, 0.1, 0.1, 3.4, 1.7, 6).position.set(41, 1.7, 5.5);
  box(gS, whiteM, 40.1, 2.9, 5.45, 41.9, 4.0, 5.55);
  var hoopRing = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 10), C(0xc96a2a));
  hoopRing.rotation.x = Math.PI / 2; hoopRing.position.set(41, 3.05, 5.95); gS.add(hoopRing);
  yardCols.push({ a: 40.8, b: 41.2, c: 5.3, d: 5.7 });
  // billboard
  cyl(gS, greyM, 0.12, 0.12, 3.2, 1.6, 6).position.set(-8, 1.6, 24);
  cyl(gS, greyM, 0.12, 0.12, 3.2, 1.6, 6).position.set(-3, 1.6, 24);
  box(gS, B(textTex(256, 96, "#d8cfc0", "#7c2a22", ["PIRMYN, VILNIAU!", "SEIMO RINKIMAI 2026"], 18)), -8.6, 3.0, 23.9, -2.4, 5.2, 24.1);
  yardCols.push({ a: -8.4, b: -2.6, c: 23.8, d: 24.2 });
  // kiosk
  solid(yardCols, gS, C(0x3a5a4a), 20, 24, 23, 26.4, 0, 2.6);
  plane(gS, B(textTex(96, 24, "#1e3a2c", "#e0d8a0", ["SPAUDA"], 13)), 2.4, 0.55, 21.5, 2.2, 23.97, Math.PI);
  plane(gS, B(prodM.map), 1.8, 1.0, 21.5, 1.2, 23.98, Math.PI);
  // bus stop
  cyl(gS, greyM, 0.08, 0.08, 2.6, 1.3, 6).position.set(30.4, 1.3, 23.0);
  cyl(gS, greyM, 0.08, 0.08, 2.6, 1.3, 6).position.set(33.6, 1.3, 23.0);
  box(gS, greyM, 30, 2.5, 22.5, 34, 2.62, 23.5);
  box(gS, glassM, 30.1, 0.4, 23.35, 33.9, 2.5, 23.45);
  plane(gS, B(textTex(64, 32, "#2c4a6e", "#e9e6d8", ["16", "STOTELE"], 10)), 0.5, 0.4, 34.1, 2.0, 23.0, 0);
  yardCols.push({ a: 30, b: 34, c: 22.4, d: 23.6 });
  // A1 exit: overhead gantry opposite the club + painted chevrons
  cyl(gS, greyM, 0.14, 0.14, 6.2, 3.1, 6).position.set(78, 3.1, 14.6);
  cyl(gS, greyM, 0.14, 0.14, 6.2, 3.1, 6).position.set(78, 3.1, 23.8);
  yardCols.push({ a: 77.7, b: 78.3, c: 14.3, d: 14.9 });
  yardCols.push({ a: 77.7, b: 78.3, c: 23.5, d: 24.1 });
  box(gS, greyM, 77.8, 6.0, 14.4, 78.2, 6.5, 24.0);
  box(gS, B(textTex(320, 72, "#1c6e3a", "#f0f4f8", ["A1 \u2192  MAXIMA · AKROPOLIS", "SENAMIESTIS · SODYBA"], 18)), 77.85, 4.4, 14.9, 78.0, 6.1, 23.5);
  for (var ch2 = 0; ch2 < 4; ch2++) {
    box(gS, yellowM, 66 + ch2 * 3.6, 0.034, 17.6, 67.6 + ch2 * 3.6, 0.044, 18.2);
    box(gS, yellowM, 67.6 + ch2 * 3.6, 0.034, 18.2, 68.6 + ch2 * 3.6, 0.044, 19.2);
    box(gS, yellowM, 66 + ch2 * 3.6, 0.034, 20.8, 67.6 + ch2 * 3.6, 0.044, 20.2);
    box(gS, yellowM, 67.6 + ch2 * 3.6, 0.034, 19.2, 68.6 + ch2 * 3.6, 0.044, 20.2);
  }
  // west end closed: roadworks barrier
  solid(yardCols, gS, M(tex(32, 16, function (g) {
    g.fillStyle = "#c92c2c"; g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#f0ece0"; for (var bx2 = 0; bx2 < 32; bx2 += 8) g.fillRect(bx2, 0, 4, 16);
  }, 4, 1)), -25.5, 15.8, -24.5, 22.6, 0.4, 1.3);
  box(gS, greyM, -25.3, 0, 16.2, -25.1, 0.4, 16.4);
  box(gS, greyM, -25.3, 0, 22.0, -25.1, 0.4, 22.2);
  plane(gS, B(textTex(128, 48, "#e8a020", "#1a1a1a", ["KELIO DARBAI", "A1 \u2192 RYTUS"], 13)), 2.4, 0.9, -24.4, 1.9, 19.2, -Math.PI / 2);
  // trees
  [[-6, 9], [10, 12.5], [30, 11], [-12, 20.8], [50, 13], [-18, 12], [54, 24.5],
   [25, 24.6], [-14, 24.5], [62, 12], [-4, 41.5], [16, 41.5], [54, 41.5], [26, 58], [52, 58]].forEach(function (p) {
    var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.6, 6), woodM);
    tr.position.set(p[0], 1.3, p[1]); gS.add(tr);
    var cn = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4.2, 7), greenM);
    cn.position.set(p[0], 4.6, p[1]); gS.add(cn);
    yardCols.push({ a: p[0] - 0.4, b: p[0] + 0.4, c: p[1] - 0.4, d: p[1] + 0.4 });
  });
  // CAR PARK between road and the shops
  box(gS, lotM, -6, 0.005, 26, 52, 0.02, 40);
  for (var bx = -4; bx < 50; bx += 3.2) {
    box(gS, whiteM, bx, 0.03, 26.5, bx + 0.18, 0.04, 30.5);
    box(gS, whiteM, bx, 0.03, 35.5, bx + 0.18, 0.04, 39.5);
  }
  [[2, 28.5, 0xd8d6cc], [12, 28.5, 0x4a5a6e], [34, 28.5, 0x6e3a3a], [21, 37.5, 0x3a5a3a], [44, 37.5, 0x8a8a92]].forEach(function (pp) {
    parkedCar(pp[0], pp[1], pp[2], false);
  });
  [[-2, 33], [24, 33], [48, 33]].forEach(function (lp) {
    cyl(gS, greyM, 0.1, 0.1, 5.2, 2.6, 6).position.set(lp[0], 2.6, lp[1]);
    yardCols.push({ a: lp[0] - 0.25, b: lp[0] + 0.25, c: lp[1] - 0.25, d: lp[1] + 0.25 });
  });
  // SHOP building (across the car park)
  solid(yardCols, gS, C(0xc9c4b8), -4, 44, 14, 54, 0, 5);
  box(gS, B(textTex(256, 48, "#c92c2c", "#f0ece0", ["PARDUOTUVE"], 26)), -3, 4.0, 43.85, 13, 5.0, 43.95);
  box(gS, B(textTex(256, 32, "#f0ece0", "#5a564c", ["ALUS · DUONA · TAROMATAS"], 14)), -1, 3.3, 43.88, 11, 3.8, 43.94);
  box(gS, glassM, -3, 0.4, 43.9, 3.8, 3.0, 44.0);
  box(gS, glassM, 6.2, 0.4, 43.9, 13, 3.0, 44.0);
  box(gS, C(0x4a5560), 4.3, 0, 43.88, 5.7, 2.6, 44.0);
  // GYM building
  solid(yardCols, gS, C(0x3a3c40), 30, 44, 48, 56, 0, 6);
  box(gS, B(textTex(256, 48, "#16181c", "#e0c33a", ['SPORTO KLUBAS "GELEZIS"'], 20)), 31, 4.6, 43.85, 47, 5.7, 43.95);
  box(gS, B(textTex(128, 64, "#2a2c30", "#8a8f96", ["KAINA:", "5 EUR / DIENA"], 13)), 36.6, 2.4, 43.88, 39.4, 3.6, 43.94);
  box(gS, C(0x6a4420), 38.3, 0, 43.88, 39.7, 2.6, 44.0);
  // NIGHTCLUB "RUSYS"
  solid(yardCols, gS, C(0x1c1c22), 58, 26, 74, 42, 0, 7);
  box(gS, new THREE.MeshBasicMaterial({ color: 0xd838c8 }), 61, 4.4, 25.85, 71, 5.8, 25.95);
  box(gS, B(textTex(192, 48, "#100a14", "#f06ae0", ["RUSYS"], 32)), 61.2, 4.5, 25.8, 70.8, 5.7, 25.9);
  box(gS, B(textTex(128, 48, "#100a14", "#8a6a96", ["TECHNO · 22:00-05:00", "5 EUR"], 11)), 63.6, 2.5, 25.88, 68.4, 3.5, 25.94);
  box(gS, C(0x0c0c10), 65.3, 0, 25.88, 66.7, 2.6, 26.0);
  var bouncer = person(0x16161c, 0x101014, null, 1.22);
  bouncer.position.set(64.4, 0, 24.9); gS.add(bouncer);
  yardCols.push({ a: 64.0, b: 64.8, c: 24.5, d: 25.3 });
  // far rows of blocks behind everything
  solid(yardCols, gS, panelM, -22, 62, 2, 70, 0, 33);
  solid(yardCols, gS, panelM2, 8, 64, 28, 72, 0, 27);
  solid(yardCols, gS, panelM, 34, 62, 56, 70, 0, 33);
  solid(yardCols, gS, panelM2, 62, 64, 84, 72, 0, 30);
  solid(yardCols, gS, panelM, 78, 2, 92, 14, 0, 24);
  solid(yardCols, gS, panelM2, -32, 4, -22, 30, 0, 27);

  // ---------- OWN BUILDING exterior (hidden while indoors) ----------
  solid(yardCols, gB, panelM, -14, -8, 50, 0.05, 0, 33);
  box(gB, woodM, 11.5, 0, 0.05, 12.9, 2.3, 0.14);
  box(gB, concM, 11, 2.4, 0, 13.4, 2.55, 1.5);
  plane(gB, B(textTex(96, 24, "#b9b4ab", "#4a3015", ["ARCHITEKTU G. 47"], 10)), 2.2, 0.5, 12.2, 2.85, 0.12, 0);
  plane(gB, B(textTex(128, 48, "#b9b4ab", "#2c7a3a", ["BLOKAS '04"], 20)), 3.2, 1.2, 6, 1.3, 0.12, 0);
  for (var wl = 0; wl < 3; wl++) box(gB, whiteM, 36 + wl * 1.5, 1.5, 1.0, 36.6 + wl * 1.5, 2.1, 1.05);

  // ---------- PETRAS (homeless) + his cans ----------
  var petras = new THREE.Group();
  box(petras, C(0x4a4438), -0.3, 0.45, -0.2, 0.3, 0.95, 0.2);
  box(petras, C(0x4a4438), -0.42, 0.5, -0.08, -0.3, 0.85, 0.1);
  box(petras, C(0x4a4438), 0.3, 0.5, -0.08, 0.42, 0.85, 0.1);
  box(petras, C(0x35302a), -0.28, 0.12, -0.7, -0.06, 0.32, 0.05);
  box(petras, C(0x35302a), 0.06, 0.12, -0.7, 0.28, 0.32, 0.05);
  box(petras, C(0xd8a878), -0.13, 0.95, -0.12, 0.13, 1.22, 0.12);
  box(petras, C(0x6e6258), -0.14, 1.18, -0.13, 0.14, 1.3, 0.13);
  var petFace = tex(24, 24, function (g) {
    g.fillStyle = "#d8a878"; g.fillRect(0, 0, 24, 24);
    g.fillStyle = "#222"; g.fillRect(7, 9, 2, 2); g.fillRect(15, 9, 2, 2);
    g.fillStyle = "#8a8078"; g.fillRect(5, 14, 14, 7);
    g.fillStyle = "#9a6a55"; g.fillRect(10, 15, 5, 2);
  });
  plane(petras, B(petFace), 0.25, 0.26, 0, 1.08, -0.125, Math.PI);
  petras.position.set(7.2, 0, 1.0); petras.rotation.y = Math.PI; gS.add(petras);
  yardCols.push({ a: 6.7, b: 7.7, c: 0.6, d: 1.5 });
  for (var cn2 = 0; cn2 < 9; cn2++) {
    var can = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 6),
      cn2 % 3 ? C(0xc9b03f) : C(0x3a7ac9));
    var ca = cn2 * 0.7 + 0.4;
    can.position.set(7.2 + Math.cos(ca) * (0.7 + cn2 * 0.07), 0.065, 1.1 + Math.abs(Math.sin(ca)) * (0.6 + cn2 * 0.05));
    can.rotation.z = (cn2 % 2) * Math.PI / 2;
    gS.add(can);
  }

  // ---------- pigeons ----------
  var pigeons = [];
  for (var pg = 0; pg < 4; pg++) {
    var pig = new THREE.Group();
    box(pig, C(0x8d9098), -0.05, 0.03, -0.09, 0.05, 0.12, 0.09);
    box(pig, C(0x6a7280), -0.03, 0.1, -0.14, 0.03, 0.17, -0.08);
    gS.add(pig);
    pigeons.push({ m: pig, x: 26 + pg * 1.1, z: 12 + (pg % 2) * 1.4, tx: 26 + pg, tz: 12, wait: pg, sc: 0 });
  }

  // ---------- streetlights (on at night) ----------
  var lampLights = [];
  [[-2, 33], [24, 33], [48, 33], [6, 13.8], [36, 13.8]].forEach(function (lp, li) {
    if (li >= 3) {
      cyl(gS, greyM, 0.1, 0.1, 5.2, 2.6, 6).position.set(lp[0], 2.6, lp[1]);
      yardCols.push({ a: lp[0] - 0.25, b: lp[0] + 0.25, c: lp[1] - 0.25, d: lp[1] + 0.25 });
    }
    var LL = new THREE.PointLight(0xffd9a0, 0, 13);
    LL.position.set(lp[0], 4.8, lp[1]); gS.add(LL);
    lampLights.push(LL);
  });

  // ---------- SENELES SODYBA + THE POND (tvenkinys) ----------
  var PX = 600;
  box(gF, grassM, PX - 56, -0.12, -24, PX + 48, 0, 44);
  // approach road + gravel yard
  box(gF, roadM, PX - 40, -0.08, 22.5, PX - 12, 0.02, 27.5);
  for (var sr = 0; sr < 5; sr++) box(gF, whiteM, PX - 38 + sr * 5, 0.03, 24.75, PX - 35.4 + sr * 5, 0.04, 25.25);
  box(gF, M(tex(32, 32, function (g) { noise(g, 32, 32, "#9a8e78", 0.2); }, 6, 5)), PX - 13, -0.05, 16, PX + 3, 0.02, 30);
  cyl(gF, greyM, 0.09, 0.09, 4.2, 2.1, 6).position.set(PX - 34, 2.1, 21.6);
  box(gF, B(textTex(160, 48, "#1c4a8a", "#f0f4f8", ["\u2190 A1", "VISI KELIAI"], 15)), PX - 36, 3.2, 21.5, PX - 32, 4.3, 21.7);
  // grandma's wooden house
  var logM = M(tex(64, 64, function (g) {
    g.fillStyle = "#7a5232"; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "#5a3a20";
    for (var y = 0; y < 64; y += 9) { g.beginPath(); g.moveTo(0, y); g.lineTo(64, y); g.stroke(); }
    g.fillStyle = "#5a3a20"; g.fillRect(0, 0, 3, 64); g.fillRect(61, 0, 3, 64);
  }, 4, 2));
  solid(pondCols, gF, logM, PX - 11, -4, PX - 2, 4, 0, 3.1);
  var roofA = box(gF, darkM, PX - 11.6, 3.4, -2.35, PX - 1.4, 3.6, 2.5);
  roofA.rotation.x = -0.42; roofA.position.z = -2.0; roofA.position.y = 3.95;
  var roofB = box(gF, darkM, PX - 11.6, 3.4, -2.5, PX - 1.4, 3.6, 2.35);
  roofB.rotation.x = 0.42; roofB.position.z = 2.0; roofB.position.y = 3.95;
  box(gF, darkM, PX - 11.7, 4.72, -0.35, PX - 1.3, 4.92, 0.35);
  box(gF, brickishM(), PX - 4.2, 4.4, -1.0, PX - 3.2, 6.0, 0);
  box(gF, C(0x4a3015), PX - 7.3, 0, 3.92, PX - 5.9, 2.3, 4.05);
  box(gF, whiteM, PX - 10.4, 1.0, 3.94, PX - 8.6, 2.2, 4.02);
  box(gF, glassM, PX - 10.25, 1.1, 3.96, PX - 8.75, 2.1, 4.04);
  box(gF, whiteM, PX - 4.4, 1.0, 3.94, PX - 2.6, 2.2, 4.02);
  box(gF, glassM, PX - 4.25, 1.1, 3.96, PX - 2.75, 2.1, 4.04);
  plane(gF, B(textTex(112, 28, "#7a5232", "#f0e8d0", ["SODYBA 1962"], 12)), 1.6, 0.4, PX - 6.6, 2.7, 4.06, 0);
  // the well
  cyl(gF, M(tex(32, 32, function (g) { noise(g, 32, 32, "#8a8a86", 0.25); }, 3, 1)), 0.55, 0.6, 0.9, 0.45, 8).position.set(PX - 6.5, 0.45, 8);
  box(gF, woodM, PX - 6.65, 0.9, 7.3, PX - 6.45, 2.0, 7.45);
  box(gF, woodM, PX - 6.65, 0.9, 8.55, PX - 6.45, 2.0, 8.7);
  box(gF, woodM, PX - 7.3, 2.0, 7.2, PX - 5.7, 2.18, 8.8);
  pondCols.push({ a: PX - 7.2, b: PX - 5.8, c: 7.3, d: 8.7 });
  // apple trees
  [[PX - 16, 12], [PX - 17, 0], [PX - 15, -8]].forEach(function (ap) {
    var at = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 2.2, 6), woodM);
    at.position.set(ap[0], 1.1, ap[1]); gF.add(at);
    var ac = new THREE.Mesh(new THREE.SphereGeometry(1.6, 7, 6), C(0x4d7a36));
    ac.position.set(ap[0], 3.1, ap[1]); ac.scale.y = 0.8; gF.add(ac);
    for (var apn = 0; apn < 4; apn++) {
      var apl = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), C(0xc92c2c));
      apl.position.set(ap[0] + Math.cos(apn * 1.7) * 1.2, 2.7 + (apn % 2) * 0.7, ap[1] + Math.sin(apn * 1.7) * 1.2);
      gF.add(apl);
    }
    pondCols.push({ a: ap[0] - 0.35, b: ap[0] + 0.35, c: ap[1] - 0.35, d: ap[1] + 0.35 });
  });
  // the darzas
  box(gF, M(tex(32, 32, function (g) { noise(g, 32, 32, "#4a3622", 0.25); }, 4, 4)), PX - 10, 0.02, 12, PX + 1, 0.14, 19);
  for (var gr = 0; gr < 4; gr++) {
    box(gF, C(0x3a2a18), PX - 9.5, 0.14, 12.8 + gr * 1.6, PX + 0.5, 0.24, 13.4 + gr * 1.6);
    for (var gv = 0; gv < 7; gv++)
      box(gF, C(gr % 2 ? 0x3a7a30 : 0x4d8a3a), PX - 9 + gv * 1.4, 0.24, 12.9 + gr * 1.6, PX - 8.6 + gv * 1.4, 0.42 + (gv % 3) * 0.08, 13.3 + gr * 1.6);
  }
  for (var fp = 0; fp < 6; fp++) {
    box(gF, woodM, PX - 10.2 + fp * 2.3, 0, 11.6, PX - 10.05 + fp * 2.3, 0.85, 11.75);
    box(gF, woodM, PX - 10.2 + fp * 2.3, 0, 19.25, PX - 10.05 + fp * 2.3, 0.85, 19.4);
  }
  box(gF, woodM, PX - 10.2, 0.6, 11.6, PX + 1, 0.7, 11.75);
  box(gF, woodM, PX - 10.2, 0.6, 19.25, PX + 1, 0.7, 19.4);
  pondCols.push({ a: PX - 10.3, b: PX + 1, c: 11.5, d: 11.85 });
  pondCols.push({ a: PX - 10.3, b: PX + 1, c: 19.15, d: 19.5 });
  plane(gF, B(textTex(96, 28, "#6a5232", "#f0e8d0", ["DARZAS"], 16)), 1.6, 0.45, PX - 4.5, 1.1, 11.56, 0);
  var senele = person(0x6a3a4a, 0x3a3440, 0xd8d0b0, 0.92);
  senele.position.set(PX - 4.5, 0, 15.5); senele.rotation.y = Math.PI; gF.add(senele);
  pondCols.push({ a: PX - 5, b: PX - 4, c: 15.1, d: 16 });
  function brickishM() {
    return M(tex(32, 32, function (g) {
      g.fillStyle = "#8a4a32"; g.fillRect(0, 0, 32, 32);
      g.strokeStyle = "#5e3220";
      for (var y = 0; y < 32; y += 8) g.strokeRect((y % 16) ? 4 : 0, y, 16, 8);
    }, 1, 2));
  }
  var water = new THREE.Mesh(new THREE.CylinderGeometry(9.5, 9.5, 0.06, 24),
    new THREE.MeshLambertMaterial({ color: 0x32607e, transparent: true, opacity: 0.93 }));
  water.position.set(PX + 10, 0.03, 9); gF.add(water);
  pondCols.push({ a: PX + 1.5, b: PX + 18.5, c: 1.0, d: 17.0 });
  var birchM = M(tex(16, 64, function (g) {
    g.fillStyle = "#e8e6dc"; g.fillRect(0, 0, 16, 64);
    g.fillStyle = "#2c2c28";
    for (var i = 0; i < 9; i++) g.fillRect(Math.random() * 12 | 0, Math.random() * 60 | 0, 5, 2);
  }, 1, 1));
  [[PX - 20, -14], [PX + 2, -6], [PX + 18, -4], [PX + 26, 4], [PX + 26, 16], [PX + 18, 22], [PX + 6, 24], [PX - 2, 22]].forEach(function (bp) {
    var bt = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 4.2, 6), birchM);
    bt.position.set(bp[0], 2.1, bp[1]); gF.add(bt);
    var bc = new THREE.Mesh(new THREE.ConeGeometry(1.7, 3.2, 7), C(0x6a8a3a));
    bc.position.set(bp[0], 5.4, bp[1]); gF.add(bc);
    pondCols.push({ a: bp[0] - 0.4, b: bp[0] + 0.4, c: bp[1] - 0.4, d: bp[1] + 0.4 });
  });
  for (var rd = 0; rd < 14; rd++) {
    var ra = rd / 14 * Math.PI * 2;
    if (ra > 2.4 && ra < 3.9) continue;
    var rx = PX + 10 + Math.cos(ra) * (9.8 + Math.random() * 0.8),
      rz2 = 9 + Math.sin(ra) * (9.8 + Math.random() * 0.8);
    var reed = new THREE.Mesh(new THREE.ConeGeometry(0.12, 1.2 + Math.random() * 0.5, 4), C(0x4d6a2c));
    reed.position.set(rx, 0.6, rz2); gF.add(reed);
  }
  solid(pondCols, gF, woodM, PX + 7, 19.2, PX + 13, 20, 0, 0.5);
  plane(gF, B(textTex(128, 48, "#6a5232", "#f0e8d0", ["TVENKINYS", "ZVEJYBA LEIDZIAMA"], 12)), 1.8, 0.7, PX + 15, 1.3, 19.6, Math.PI / 2);
  cyl(gF, woodM, 0.06, 0.06, 1.8, 0.9, 5).position.set(PX + 15, 0.9, 19.6);
  [[PX + 21, 12], [PX + 0.5, 3]].forEach(function (rk) {
    var rock = new THREE.Mesh(new THREE.SphereGeometry(0.5, 6, 5), greyM);
    rock.position.set(rk[0], 0.2, rk[1]); rock.scale.y = 0.55; gF.add(rock);
  });

  // ---------- fishing rod rig ----------
  var rodRig = new THREE.Group(); camera.add(rodRig); rodRig.visible = false;
  var rod = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.012, 0.85, 6), woodM);
  rod.position.set(0.2, -0.12, -0.42); rod.rotation.x = -1.0; rod.rotation.z = -0.12;
  rodRig.add(rod);
  var fline = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.55, 0.003),
    new THREE.MeshBasicMaterial({ color: 0xd8dce0 }));
  fline.position.set(0.245, -0.18, -0.78); rodRig.add(fline);

  // ---------- MAXIMA (MX zone) ----------
  var MX = 700;
  box(gM, grassM, MX - 50, -0.14, -34, MX + 64, -0.02, 40);
  box(gM, asphM, MX - 30, -0.1, -10, MX + 34, 0.02, 6);          // road + car park
  for (var mr = 0; mr < 13; mr++) box(gM, whiteM, MX - 28 + mr * 4.6, 0.03, -8.25, MX - 25.6 + mr * 4.6, 0.04, -7.75);
  for (var mb = 0; mb < 6; mb++) box(gM, whiteM, MX + mb * 4, 0.03, 0.4, MX + mb * 4 + 0.18, 0.04, 4.4);
  box(gM, whiteM, MX - 30, 0.028, -5.6, MX + 34, 0.038, -5.3);   // lot divider line
  cyl(gM, greyM, 0.09, 0.09, 4.2, 2.1, 6).position.set(MX - 26, 2.1, -5.0);
  box(gM, B(textTex(160, 48, "#1c4a8a", "#f0f4f8", ["\u2190 A1", "VISI KELIAI"], 15)), MX - 28, 3.2, -5.1, MX - 24, 4.3, -4.9);
  box(gM, linoM, MX - 0.15, -0.05, 6, MX + 26.15, 0.02, 24);     // interior floor
  box(gM, whiteM, MX - 0.15, 3.4, 6, MX + 26.15, 3.55, 24);
  solid(maxCols, gM, whiteM, MX - WT, 6, MX + 11, 6 + WT, 0, 3.4);     // facade left of door
  solid(maxCols, gM, whiteM, MX + 13, 6, MX + 26 + WT, 6 + WT, 0, 3.4);
  box(gM, whiteM, MX + 11, 2.7, 6, MX + 13, 3.4, 6 + WT);
  solid(maxCols, gM, whiteM, MX - WT, 24, MX + 26 + WT, 24 + WT, 0, 3.4);
  solid(maxCols, gM, whiteM, MX - WT, 6, MX, 24, 0, 3.4);
  solid(maxCols, gM, whiteM, MX + 26, 6, MX + 26 + WT, 24, 0, 3.4);
  box(gM, B(textTex(256, 56, "#c9252c", "#ffe14a", ["MAXIMA"], 36)), MX + 6, 3.6, 5.85, MX + 20, 4.9, 5.98);
  box(gM, B(textTex(192, 28, "#ffe14a", "#7a1418", ["VISKAS, KO REIKIA"], 14)), MX + 8.5, 2.9, 5.88, MX + 17.5, 3.4, 5.96);
  box(gM, glassM, MX + 0.5, 0.4, 5.9, MX + 10.5, 2.7, 6.0);
  box(gM, glassM, MX + 13.5, 0.4, 5.9, MX + 25.5, 2.7, 6.0);
  // trolleys
  for (var tr2 = 0; tr2 < 3; tr2++) {
    box(gM, greyM, MX + 1 + tr2 * 0.5, 0.3, 1.0, MX + 2 + tr2 * 0.5, 0.85, 1.8);
  }
  maxCols.push({ a: MX + 0.8, b: MX + 3.2, c: 0.8, d: 2.0 });
  // aisles
  solid(maxCols, gM, prodM, MX + 4, 10, MX + 11, 11, 0, 1.9);
  solid(maxCols, gM, prodM, MX + 15, 10, MX + 22, 11, 0, 1.9);
  solid(maxCols, gM, prodM, MX + 4, 14, MX + 11, 15, 0, 1.9);
  solid(maxCols, gM, prodM, MX + 15, 14, MX + 22, 15, 0, 1.9);
  // beer wall + freezer row
  solid(maxCols, gM, C(0x2c4a6e), MX + 0.3, 9, MX + 1.1, 16, 0, 2.2);
  plane(gM, B(textTex(96, 24, "#2c4a6e", "#e9e6d8", ["ALUS 1.09"], 12)), 2.2, 0.5, MX + 1.12, 1.9, 12.5, Math.PI / 2);
  solid(maxCols, gM, C(0xbfd6e0), MX + 24.9, 9, MX + 25.7, 17, 0, 1.5);
  plane(gM, B(textTex(112, 24, "#bfd6e0", "#2c3a44", ["SALDYTA · PELMENAI"], 11)), 2.6, 0.5, MX + 24.88, 1.9, 13, -Math.PI / 2);
  // deli counter
  solid(maxCols, gM, whiteM, MX + 7, 21.2, MX + 19, 22.2, 0, 1.05);
  box(gM, glassM, MX + 7.2, 1.05, 21.3, MX + 18.8, 1.6, 21.5);
  plane(gM, B(textTex(160, 28, "#f0ece0", "#8a2c2c", ["KULINARIJA · DESROS · SILKE"], 11)), 4.5, 0.6, MX + 13, 2.6, 23.9, Math.PI);
  var deli = person(0xf0ece0, 0x8a2c2c, 0xf0ece0, 1);
  deli.position.set(MX + 13, 0, 23.0); gM.add(deli);
  // self-checkout + cashier
  for (var sc2 = 0; sc2 < 3; sc2++) {
    solid(maxCols, gM, C(0x3a4a3a), MX + 3.5 + sc2 * 2, 7.6, MX + 4.6 + sc2 * 2, 8.4, 0, 1.3);
    box(gM, new THREE.MeshBasicMaterial({ color: 0x9fd0a8 }), MX + 3.7 + sc2 * 2, 1.3, 7.7, MX + 4.4 + sc2 * 2, 1.75, 7.75);
  }
  solid(maxCols, gM, woodM, MX + 16, 7.6, MX + 21, 8.5, 0, 1.0);
  var maxCash = person(0xc9252c, 0x2c2c34, null, 1);
  maxCash.position.set(MX + 18.5, 0, 9.2); gM.add(maxCash);
  var lampM1 = new THREE.PointLight(0xf2f6fa, 0.9, 16); lampM1.position.set(MX + 7, 3.2, 12); gM.add(lampM1);
  var lampM2 = new THREE.PointLight(0xf2f6fa, 0.9, 16); lampM2.position.set(MX + 19, 3.2, 16); gM.add(lampM2);

  // ---------- AKROPOLIS (AX zone) ----------
  var AX = 800;
  box(gK, grassM, AX - 50, -0.14, -34, AX + 74, -0.02, 44);
  box(gK, asphM, AX - 30, -0.1, -10, AX + 42, 0.02, 6);          // road + plaza apron
  for (var ar2 = 0; ar2 < 14; ar2++) box(gK, whiteM, AX - 28 + ar2 * 4.6, 0.03, -8.25, AX - 25.6 + ar2 * 4.6, 0.04, -7.75);
  box(gK, whiteM, AX - 30, 0.028, -5.6, AX + 42, 0.038, -5.3);
  cyl(gK, greyM, 0.09, 0.09, 4.2, 2.1, 6).position.set(AX - 26, 2.1, -5.0);
  box(gK, B(textTex(160, 48, "#1c4a8a", "#f0f4f8", ["\u2190 A1", "VISI KELIAI"], 15)), AX - 28, 3.2, -5.1, AX - 24, 4.3, -4.9);
  var tileM2 = M(tex(64, 64, function (g) {
    g.fillStyle = "#d8d6d0"; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "#b8b6b0"; g.strokeRect(0, 0, 32, 32); g.strokeRect(32, 32, 32, 32);
    g.strokeRect(32, 0, 32, 32); g.strokeRect(0, 32, 32, 32);
  }, 16, 12));
  box(gK, tileM2, AX - 0.15, -0.05, 6, AX + 34.15, 0.02, 28);
  box(gK, whiteM, AX - 0.15, 4.6, 6, AX + 34.15, 4.75, 28);
  solid(akroCols, gK, C(0x9aa0a8), AX - WT, 6, AX + 15, 6 + WT, 0, 4.6);
  solid(akroCols, gK, C(0x9aa0a8), AX + 19, 6, AX + 34 + WT, 6 + WT, 0, 4.6);
  box(gK, C(0x9aa0a8), AX + 15, 3.0, 6, AX + 19, 4.6, 6 + WT);
  solid(akroCols, gK, C(0x9aa0a8), AX - WT, 28, AX + 34 + WT, 28 + WT, 0, 4.6);
  solid(akroCols, gK, C(0x9aa0a8), AX - WT, 6, AX, 28, 0, 4.6);
  solid(akroCols, gK, C(0x9aa0a8), AX + 34, 6, AX + 34 + WT, 28, 0, 4.6);
  box(gK, B(textTex(256, 48, "#16181c", "#e84a8a", ["AKROPOLIS"], 30)), AX + 9, 4.8, 5.85, AX + 25, 6.0, 5.98);
  box(gK, glassM, AX + 0.5, 0.4, 5.9, AX + 14.5, 3.0, 6.0);
  box(gK, glassM, AX + 19.5, 0.4, 5.9, AX + 33.5, 3.0, 6.0);
  // fountain
  var fount = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.8, 0.55, 14), greyM);
  fount.position.set(AX + 17, 0.27, 17); gK.add(fount);
  var fwat = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.1, 14),
    new THREE.MeshLambertMaterial({ color: 0x4a8ab0, transparent: true, opacity: 0.9 }));
  fwat.position.set(AX + 17, 0.55, 17); gK.add(fwat);
  var fjet = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 1.2, 6),
    new THREE.MeshLambertMaterial({ color: 0x9fd0e8, transparent: true, opacity: 0.7 }));
  fjet.position.set(AX + 17, 1.1, 17); gK.add(fjet);
  akroCols.push({ a: AX + 14.2, b: AX + 19.8, c: 14.2, d: 19.8 });
  // storefronts: HiM, Cili Pica, cinema, dead escalator
  solid(akroCols, gK, C(0xe8e6e0), AX + 0.3, 9, AX + 1.3, 16, 0, 3.2);
  plane(gK, B(textTex(96, 40, "#e8e6e0", "#c92c2c", ["HiM", "DRABUZIAI"], 14)), 2.2, 1.0, AX + 1.32, 2.2, 12.5, Math.PI / 2);
  plane(gK, B(prodM.map), 2.6, 1.6, AX + 1.31, 1.1, 12.5, Math.PI / 2);
  solid(akroCols, gK, C(0x6a2c1c), AX + 0.3, 19, AX + 1.3, 26, 0, 3.2);
  plane(gK, B(textTex(112, 40, "#6a2c1c", "#ffd34a", ["CILI PICA", "SKANU!"], 13)), 2.4, 1.0, AX + 1.32, 2.2, 22.5, Math.PI / 2);
  solid(akroCols, gK, C(0x14161c), AX + 32.7, 9, AX + 33.7, 18, 0, 3.6);
  plane(gK, B(textTex(128, 48, "#14161c", "#e8d9a0", ["FORUM", "KINAS"], 16)), 2.6, 1.2, AX + 32.68, 2.6, 13.5, -Math.PI / 2);
  plane(gK, B(textTex(128, 36, "#101218", "#8a8f96", ["SEANSAI: 6 EUR"], 11)), 2.2, 0.5, AX + 32.68, 1.5, 13.5, -Math.PI / 2);
  // dead escalator to nowhere
  var esc = box(gK, greyM, AX + 24, 0, 24.5, AX + 27, 2.2, 27.8);
  esc.rotation.x = 0;
  akroCols.push({ a: AX + 23.8, b: AX + 27.2, c: 24.3, d: 28 });
  plane(gK, B(textTex(64, 40, "#efe9d8", "#555555", ["NE-", "VEIKIA"], 12)), 0.6, 0.55, AX + 25.5, 1.4, 24.4, Math.PI);
  // benches
  [[AX + 9, 17], [AX + 25, 17]].forEach(function (bb) {
    solid(akroCols, gK, woodM, bb[0] - 1.2, bb[1] - 0.35, bb[0] + 1.2, bb[1] + 0.35, 0.4, 0.55);
  });
  var lampK1 = new THREE.PointLight(0xf6f4ee, 1.0, 20); lampK1.position.set(AX + 10, 4.2, 14); gK.add(lampK1);
  var lampK2 = new THREE.PointLight(0xf6f4ee, 1.0, 20); lampK2.position.set(AX + 24, 4.2, 20); gK.add(lampK2);

  // ---------- OLD TOWN / GEDIMINAS (OX zone) ----------
  var OX = 900;
  var cobbleM = M(tex(64, 64, function (g) {
    noise(g, 64, 64, "#8a8278", 0.18);
    g.strokeStyle = "#6a6258";
    for (var y = 0; y < 64; y += 8) for (var x = 0; x < 64; x += 10)
      g.strokeRect(x + (y % 16 ? 5 : 0), y, 10, 8);
  }, 14, 12));
  var brickM = M(tex(64, 64, function (g) {
    g.fillStyle = "#8a4a32"; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "#5e3220";
    for (var y = 0; y < 64; y += 8) for (var x = 0; x < 64; x += 16)
      g.strokeRect(x + (y % 16 ? 8 : 0), y, 16, 8);
  }, 4, 4));
  box(gO, cobbleM, OX - 14, -0.1, -14, OX + 44, 0.02, 30);
  box(gO, grassM, OX - 56, -0.14, -36, OX + 70, -0.02, 50);
  box(gO, roadM, OX - 34, -0.08, 18, OX - 14, 0.02, 22.5);       // approach road
  for (var or2 = 0; or2 < 4; or2++) box(gO, whiteM, OX - 32 + or2 * 4.6, 0.03, 20, OX - 29.6 + or2 * 4.6, 0.04, 20.5);
  cyl(gO, greyM, 0.09, 0.09, 4.2, 2.1, 6).position.set(OX - 28, 2.1, 17.2);
  box(gO, B(textTex(160, 48, "#1c4a8a", "#f0f4f8", ["\u2190 A1", "VISI KELIAI"], 15)), OX - 30, 3.2, 17.1, OX - 26, 4.3, 17.3);
  box(gO, grassM, OX + 12, 0.025, -2, OX + 42, 0.04, 22);
  // Gediminas hill + tower
  var mound = new THREE.Mesh(new THREE.ConeGeometry(13, 11.5, 12), grassM);
  mound.position.set(OX + 27, 5.75, 9); gO.add(mound);
  oldCols.push({ a: OX + 16, b: OX + 38, c: -2, d: 20 });
  var gedi = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 6, 8), brickM);
  gedi.position.set(OX + 27, 14.4, 9); gO.add(gedi);
  for (var cr = 0; cr < 8; cr++) {
    var crA = cr / 8 * Math.PI * 2;
    box(gO, brickM, OX + 27 + Math.cos(crA) * 2.1 - 0.25, 17.4, 9 + Math.sin(crA) * 2.1 - 0.25,
      OX + 27 + Math.cos(crA) * 2.1 + 0.25, 18.1, 9 + Math.sin(crA) * 2.1 + 0.25);
  }
  cyl(gO, greyM, 0.04, 0.04, 2.2, 18.5, 5).position.set(OX + 27, 18.5, 9);
  var ltFlag = plane(gO, B(tex(48, 30, function (g) {
    g.fillStyle = "#FDB913"; g.fillRect(0, 0, 48, 10);
    g.fillStyle = "#006A44"; g.fillRect(0, 10, 48, 10);
    g.fillStyle = "#C1272D"; g.fillRect(0, 20, 48, 10);
  })), 1.1, 0.7, OX + 27.6, 19.1, 9, 0);
  // cathedral + bell tower
  solid(oldCols, gO, whiteM, OX - 12, -12, OX + 2, -4, 0, 7);
  for (var cl2 = 0; cl2 < 5; cl2++)
    cyl(gO, whiteM, 0.32, 0.32, 6.4, 3.2, 8).position.set(OX - 10.5 + cl2 * 2.6, 3.2, -3.7);
  box(gO, whiteM, OX - 12.5, 7, -12.2, OX + 2.5, 7.7, -3.6);
  var ped = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.8, 4), whiteM);
  ped.position.set(OX - 5, 8.6, -8); ped.rotation.y = Math.PI / 4; gO.add(ped);
  solid(oldCols, gO, whiteM, OX + 5, -11.5, OX + 8.5, -8, 0, 11);
  box(gO, C(0x2c4a3a), OX + 5.4, 11, -11.1, OX + 8.1, 12.4, -8.4);
  plane(gO, B(textTex(48, 64, "#f0ece0", "#3a3a3a", ["IX", "III"], 14)), 0.9, 1.2, OX + 6.75, 9.6, -7.98, 0);
  // old-town facades
  [[0xc9a888, -8], [0x9ab0a0, -3], [0xd8c0a0, 2], [0xb09098, 7]].forEach(function (fc, fi) {
    solid(oldCols, gO, C(fc[0]), OX + fc[1], 24, OX + fc[1] + 4.6, 30, 0, 6 + (fi % 2) * 1.5);
    box(gO, C(0x4a3a2c), OX + fc[1] + 1.6, 0, 23.9, OX + fc[1] + 3.0, 2.4, 24.05);
    for (var fw = 0; fw < 2; fw++)
      box(gO, glassM, OX + fc[1] + 0.7 + fw * 2.4, 3.2, 23.92, OX + fc[1] + 1.9 + fw * 2.4, 4.6, 24.0);
  });
  // busker + tourists + bench
  var busker = person(0x3a2c24, 0x2c2c34, null, 1);
  busker.position.set(OX - 1, 0, 21.5); gO.add(busker);
  box(gO, C(0x8a2c2c), OX - 1.35, 0.7, 21.0, OX - 0.65, 1.1, 21.3);
  box(gO, C(0x4a3015), OX - 1.6, 0, 22.2, OX - 0.9, 0.12, 22.7);
  oldCols.push({ a: OX - 1.6, b: OX - 0.4, c: 20.9, d: 22.0 });
  var tour1 = person(0xe07a3a, 0x4a5a6e, null, 0.95);
  tour1.position.set(OX + 8, 0, 14); tour1.rotation.y = -0.6; gO.add(tour1);
  var tour2 = person(0x4ac9b0, 0x2c2c34, null, 0.92, 0xe8d36b);
  tour2.position.set(OX + 8.8, 0, 14.4); tour2.rotation.y = -0.9; gO.add(tour2);
  oldCols.push({ a: OX + 7.5, b: OX + 9.3, c: 13.5, d: 14.9 });
  solid(oldCols, gO, woodM, OX + 2, 5.6, OX + 4.4, 6.3, 0.4, 0.58);
  box(gO, woodM, OX + 2, 0.58, 6.15, OX + 4.4, 1.15, 6.3);

  // ---------- first-person eating rig ----------
  var eatRig = new THREE.Group(); camera.add(eatRig); eatRig.visible = false;
  var hand2 = new THREE.Group(); eatRig.add(hand2);
  box(hand2, C(0xdcab7c), -0.045, -0.032, -0.05, 0.045, 0.032, 0.05);
  var itemCan = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.1, 8), C(0xc9b03f));
  itemCan.position.set(0, 0.07, -0.02); hand2.add(itemCan);
  var itemBox = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.06), C(0xc9803a));
  itemBox.position.set(0, 0.05, -0.04); hand2.add(itemBox);
  var EAT_REST = new THREE.Vector3(0.17, -0.19, -0.36),
    EAT_MOUTH = new THREE.Vector3(0.02, -0.07, -0.27);
  hand2.position.copy(EAT_REST);

  // ---------- THE MERCEDES: 2010 E 350 4MATIC (W212), white sedan ----------
  var car = new THREE.Group();
  var bodyW = C(0xecedea);
  var glassT = new THREE.MeshLambertMaterial({ color: 0x35424e, transparent: true, opacity: 0.85 });
  box(car, bodyW, -0.93, 0.3, -2.44, 0.93, 0.8, 2.44);            // lower body
  box(car, bodyW, -0.9, 0.8, -2.36, 0.9, 0.96, -0.78);            // bonnet
  box(car, bodyW, -0.9, 0.8, 1.5, 0.9, 0.99, 2.36);               // boot lid
  box(car, glassT, -0.86, 0.96, -1.08, 0.86, 1.4, 1.52);          // glasshouse
  box(car, bodyW, -0.83, 1.38, -0.92, 0.83, 1.45, 1.36);          // roof
  box(car, bodyW, -0.87, 0.96, -0.4, -0.84, 1.4, -0.28);          // B pillars
  box(car, bodyW, 0.84, 0.96, -0.4, 0.87, 1.4, -0.28);
  box(car, darkM, -0.44, 0.5, -2.46, 0.44, 0.74, -2.42);          // grille
  box(car, greyM, -0.44, 0.6, -2.47, 0.44, 0.64, -2.455);         // chrome bar
  var star = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 10), greyM);
  star.rotation.x = Math.PI / 2; star.position.set(0, 0.62, -2.465); car.add(star);
  box(car, new THREE.MeshBasicMaterial({ color: 0xe8eef6 }), -0.88, 0.55, -2.46, -0.5, 0.74, -2.42); // headlights
  box(car, new THREE.MeshBasicMaterial({ color: 0xe8eef6 }), 0.5, 0.55, -2.46, 0.88, 0.74, -2.42);
  box(car, new THREE.MeshBasicMaterial({ color: 0xcfd8e6 }), -0.88, 0.5, -2.455, -0.55, 0.54, -2.43); // DRL strips
  box(car, new THREE.MeshBasicMaterial({ color: 0xcfd8e6 }), 0.55, 0.5, -2.455, 0.88, 0.54, -2.43);
  box(car, new THREE.MeshBasicMaterial({ color: 0xb52a22 }), -0.88, 0.62, 2.42, -0.4, 0.82, 2.46);   // tail lights
  box(car, new THREE.MeshBasicMaterial({ color: 0xb52a22 }), 0.4, 0.62, 2.42, 0.88, 0.82, 2.46);
  plane(car, B(textTex(96, 20, "#ecedea", "#5a5e64", ["E 350 4MATIC"], 12)), 0.62, 0.13, 0.4, 0.92, 2.47, 0);
  plane(car, B(textTex(96, 24, "#f0f2f4", "#1a1a22", ["DZG:047"], 14)), 0.5, 0.13, 0, 0.45, 2.47, 0);
  plane(car, B(textTex(96, 24, "#f0f2f4", "#1a1a22", ["DZG:047"], 14)), 0.5, 0.13, 0, 0.45, -2.47, Math.PI);
  box(car, bodyW, -1.02, 1.0, -0.62, -0.93, 1.1, -0.44);          // mirrors
  box(car, bodyW, 0.93, 1.0, -0.62, 1.02, 1.1, -0.44);
  box(car, darkM, -0.8, 0.84, -1.04, 0.8, 1.02, -0.7);            // dash
  box(car, darkM, -0.5, 0.98, -1.0, -0.2, 1.16, -0.92);           // wheel
  box(car, greenM, -0.05, 0.88, -0.86, 0.12, 1.02, -0.72);        // IID unit
  [[-0.86, -1.62], [0.86, -1.62], [-0.86, 1.58], [0.86, 1.58]].forEach(function (w) {
    var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.2, 10), darkM);
    wh.rotation.z = Math.PI / 2; wh.position.set(w[0], 0.33, w[1]); car.add(wh);
    var rim = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.22, 8), greyM);
    rim.rotation.z = Math.PI / 2; rim.position.set(w[0], 0.33, w[1]); car.add(rim);
  });
  car.position.set(15.5, 0, 6.5); car.rotation.y = Math.PI / 2; scene.add(car);
  var carYaw = Math.PI / 2, carZone = "yard";

  // ---------- first-person cigarette rig ----------
  var cigRig = new THREE.Group(); camera.add(cigRig); cigRig.visible = false;
  var hand = new THREE.Group(); cigRig.add(hand);
  box(hand, C(0xdcab7c), -0.045, -0.032, -0.05, 0.045, 0.032, 0.05);
  var cigStick = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.09, 6),
    new THREE.MeshBasicMaterial({ color: 0xf2efe6 }));
  cigStick.rotation.x = Math.PI / 2; cigStick.position.set(0.01, 0.024, -0.07); hand.add(cigStick);
  var ember = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0xff7a2a }));
  ember.position.set(0.01, 0.024, -0.118); hand.add(ember);
  var HAND_REST = new THREE.Vector3(0.17, -0.17, -0.38),
    HAND_MOUTH = new THREE.Vector3(0.035, -0.06, -0.3);
  hand.position.copy(HAND_REST);
  var puffs = [];
  for (var pf0 = 0; pf0 < 7; pf0++) {
    var pf = new THREE.Mesh(new THREE.SphereGeometry(0.02, 5, 5),
      new THREE.MeshBasicMaterial({ color: 0xc9ced4, transparent: true, opacity: 0 }));
    pf.userData = { a: 0, vx: 0, vy: 0 };
    cigRig.add(pf); puffs.push(pf);
  }

  // ---------- the courtyard cat ----------
  var katz = new THREE.Group();
  box(katz, C(0xc9803a), -0.06, 0.1, -0.2, 0.06, 0.22, 0.16);
  box(katz, C(0xc9803a), -0.055, 0.18, -0.32, 0.055, 0.3, -0.2);
  var ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.05, 4), C(0xb06a2c));
  ear1.position.set(-0.032, 0.32, -0.27); katz.add(ear1);
  var ear2 = ear1.clone(); ear2.position.x = 0.032; katz.add(ear2);
  var tail = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 0.22), C(0xb06a2c));
  tail.position.set(0, 0.22, 0.26); katz.add(tail);
  box(katz, whiteM, -0.05, 0.0, -0.3, 0.05, 0.1, 0.14);
  katz.position.set(24, 0, 8); gS.add(katz);
  var cat = { x: 24, z: 8, tx: 28, tz: 6, wait: 1, flee: 0 };

  // ---------- rain ----------
  var RAIN_N = 420;
  var rainGeo = new THREE.BufferGeometry();
  var rpArr = new Float32Array(RAIN_N * 3);
  for (var ri0 = 0; ri0 < RAIN_N; ri0++) {
    rpArr[ri0 * 3] = (Math.random() - 0.5) * 56;
    rpArr[ri0 * 3 + 1] = Math.random() * 22;
    rpArr[ri0 * 3 + 2] = (Math.random() - 0.5) * 56;
  }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rpArr, 3));
  var rain = new THREE.Points(rainGeo,
    new THREE.PointsMaterial({ color: 0x9fb0bd, size: 0.07, transparent: true, opacity: 0.65 }));
  rain.visible = false; scene.add(rain);
  var rainC = new THREE.Color(0x76828c);

  // ---------- traffic / pedestrians / girls / kids ----------
  var traffic = [];
  [[0x8a2c2c, 17.7, 1, -20, 9], [0x5a6a7c, 17.7, 1, 30, 8],
   [0xd8d6cc, 20.7, -1, 60, 10], [0x3a5a3a, 20.7, -1, 5, 8.5]].forEach(function (cf) {
    var g = vehicle(cf[0]);
    g.position.set(cf[3], 0, cf[1]);
    g.rotation.y = cf[2] > 0 ? -Math.PI / 2 : Math.PI / 2;
    gS.add(g);
    traffic.push({ m: g, z: cf[1], dir: cf[2], x: cf[3], sp: cf[4] });
  });
  var peds = [];
  [[0x4a4a5a, 0x2c2c34, 15.4, -16, 1], [0x3a5a6a, 0x4a4438, 22.95, 10, 1]].forEach(function (pf) {
    var p = person(pf[0], pf[1], null, 0.95);
    p.position.set(pf[3], 0, pf[2]); gS.add(p);
    peds.push({ m: p, x: pf[3], z: pf[2], dir: pf[4], sp: 1 + Math.random() * 0.5 });
  });
  var girls = [];
  [[0xe07aa8, 0x2c2c34, 0xe8d36b, 15.4, 30, -1], [0xc92c4a, 0x16161c, 0x4a3015, 22.95, 44, -1],
   [0xf0ece0, 0x6e3a5a, 0x8a4a20, 22.95, -6, 1]].forEach(function (gf) {
    var g = person(gf[0], gf[1], null, 0.92, gf[2]);
    g.position.set(gf[4], 0, gf[3]); gS.add(g);
    girls.push({ m: g, x: gf[4], z: gf[3], dir: gf[5], sp: 1.1 + Math.random() * 0.4, where: "yard" });
  });
  var kids = [];
  [[0xc9423a, 0x2c4a6e, 0], [0x3ac96a, 0x4a3550, Math.PI]].forEach(function (kf) {
    var kd = person(kf[0], kf[1], null, 0.55);
    gS.add(kd);
    kids.push({ m: kd, ph: kf[2] });
  });

  // ---------- SHOP interior ----------
  box(gC, linoM, SX - 0.15, -0.1, -0.15, SX + 10.15, 0, 8.15);
  box(gC, whiteM, SX - 0.15, 3.0, -0.15, SX + 10.15, 3.12, 8.15);
  solid(shopCols, gC, whiteM, SX - WT, -WT, SX + 10 + WT, 0, 0, 3.0);
  solid(shopCols, gC, whiteM, SX - WT, 8, SX + 10 + WT, 8 + WT, 0, 3.0);
  solid(shopCols, gC, whiteM, SX - WT, 0, SX, 8, 0, 3.0);
  solid(shopCols, gC, whiteM, SX + 10, 0, SX + 10 + WT, 8, 0, 3.0);
  plane(gC, C(0x4a5560), 1.2, 2.4, SX + 5, 1.2, 0.01, 0);
  plane(gC, B(prodM.map), 3.5, 2.0, SX + 2.2, 1.5, 0.02, 0);
  plane(gC, B(prodM.map), 3.0, 2.0, SX + 8.2, 1.5, 0.02, 0);
  solid(shopCols, gC, C(0x2c4a6e), SX, 2, SX + 0.7, 4.5, 0, 2.2);
  plane(gC, glassM, 2.3, 1.8, SX + 0.71, 1.1, 3.25, Math.PI / 2);
  plane(gC, B(textTex(96, 24, "#2c4a6e", "#e9e6d8", ["SVYTURYS -20%"], 10)), 2.0, 0.4, SX + 0.72, 2.0, 3.25, Math.PI / 2);
  solid(shopCols, gC, prodM, SX + 2.5, 2.6, SX + 7.5, 3.4, 0, 1.8);
  solid(shopCols, gC, prodM, SX + 2.5, 5.0, SX + 7.5, 5.8, 0, 1.8);
  solid(shopCols, gC, woodM, SX + 6.5, 0.8, SX + 9.5, 1.6, 0, 1.0);
  box(gC, prodM, SX + 7.0, 1.7, 7.0, SX + 9.5, 2.6, 7.4);
  solid(shopCols, gC, prodM, SX + 7.0, 7.0, SX + 9.5, 7.4, 0, 1.7);
  var cashier = person(0xc92c2c, 0x2c2c34, null, 1);
  cashier.position.set(SX + 8, 0, 2.3); gC.add(cashier);
  solid(shopCols, gC, C(0x2c7a3a), SX + 0.2, 6.6, SX + 1.4, 7.9, 0, 2.1);
  plane(gC, B(textTex(64, 64, "#2c7a3a", "#e9f0e0", ["TARO-", "MATAS", "0.10 EUR"], 11)), 1.0, 1.0, SX + 0.8, 1.4, 6.58, Math.PI);
  var lampS1 = new THREE.PointLight(0xeef2f8, 0.8, 12); lampS1.position.set(SX + 3, 2.7, 3); gC.add(lampS1);
  var lampS2 = new THREE.PointLight(0xeef2f8, 0.7, 12); lampS2.position.set(SX + 7.5, 2.7, 5.5); gC.add(lampS2);

  // ---------- GYM interior ----------
  box(gD, rubberM, GX - 0.15, -0.1, -0.15, GX + 14.15, 0, 10.15);
  box(gD, darkM, GX - 0.15, 3.4, -0.15, GX + 14.15, 3.52, 10.15);
  solid(gymCols, gD, concM, GX - WT, -WT, GX + 14 + WT, 0, 0, 3.4);
  solid(gymCols, gD, concM, GX - WT, 10, GX + 14 + WT, 10 + WT, 0, 3.4);
  solid(gymCols, gD, concM, GX - WT, 0, GX, 10, 0, 3.4);
  solid(gymCols, gD, concM, GX + 14, 0, GX + 14 + WT, 10, 0, 3.4);
  plane(gD, C(0x6a4420), 1.2, 2.4, GX + 7, 1.2, 0.01, 0);
  plane(gD, B(textTex(192, 48, "#16181c", "#e0c33a", ["GELEZIS"], 30)), 5, 1.3, GX + 7, 2.6, 9.98, Math.PI);
  plane(gD, B(textTex(192, 48, "#7c2a22", "#f0ece0", ["SKAUSMAS LAIKINAS", "SLOVE AMZINA"], 14)), 3.4, 0.9, GX + 0.02, 2.2, 5, Math.PI / 2);
  plane(gD, C(0x9aa8b0), 6, 2.0, GX + 13.98, 1.6, 5, -Math.PI / 2);
  plane(gD, B(portT), 0.7, 0.9, GX + 13.96, 1.45, 5, -Math.PI / 2);
  solid(gymCols, gD, darkM, GX + 2.2, 5.4, GX + 3.8, 6.6, 0, 0.55);
  box(gD, greyM, GX + 2.3, 0, 5.0, GX + 2.5, 1.45, 5.2); box(gD, greyM, GX + 3.5, 0, 5.0, GX + 3.7, 1.45, 5.2);
  var bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), greyM);
  bar1.rotation.z = Math.PI / 2; bar1.position.set(GX + 3, 1.45, 5.1); gD.add(bar1);
  cyl(gD, darkM, 0.22, 0.22, 0.1, 0, 8).position.set(GX + 2.1, 1.45, 5.1);
  cyl(gD, darkM, 0.22, 0.22, 0.1, 0, 8).position.set(GX + 3.9, 1.45, 5.1);
  solid(gymCols, gD, darkM, GX + 6.2, 7.0, GX + 7.8, 8.6, 0, 0.5);
  box(gD, greyM, GX + 6.9, 0, 8.4, GX + 7.1, 2.6, 8.6);
  box(gD, greyM, GX + 6.3, 2.4, 8.3, GX + 7.7, 2.55, 8.5);
  bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), greyM);
  bar1.rotation.z = Math.PI / 2; bar1.position.set(GX + 7, 2.1, 8.2); gD.add(bar1);
  solid(gymCols, gD, darkM, GX + 10.4, 2.2, GX + 11.4, 4.4, 0, 0.3);
  box(gD, greyM, GX + 10.45, 0.3, 2.2, GX + 10.6, 1.5, 2.4); box(gD, greyM, GX + 11.2, 0.3, 2.2, GX + 11.35, 1.5, 2.4);
  box(gD, darkM, GX + 10.45, 1.4, 2.15, GX + 11.35, 1.7, 2.35);
  solid(gymCols, gD, greyM, GX + 1, 0.5, GX + 5, 1.1, 0, 1.0);
  for (var db = 0; db < 6; db++) cyl(gD, darkM, 0.12, 0.12, 0.3, 0, 6).position.set(GX + 1.4 + db * 0.6, 1.1, 0.8);
  var bro = person(0x16181c, 0x3a3c40, null, 1.18);
  bro.position.set(GX + 9.5, 0, 4.0); bro.rotation.y = Math.PI / 2; gD.add(bro);
  var lampG1 = new THREE.PointLight(0xf0f4ff, 0.9, 14); lampG1.position.set(GX + 4, 3.1, 5); gD.add(lampG1);
  var lampG2 = new THREE.PointLight(0xf0f4ff, 0.8, 14); lampG2.position.set(GX + 10, 3.1, 5); gD.add(lampG2);

  // ---------- NIGHTCLUB interior ----------
  box(gE, rubberM, NX - 0.15, -0.1, -0.15, NX + 14.15, 0, 10.15);
  box(gE, C(0x0c0c10), NX - 0.15, 3.4, -0.15, NX + 14.15, 3.52, 10.15);
  solid(clubCols, gE, clubWallM, NX - WT, -WT, NX + 14 + WT, 0, 0, 3.4);
  solid(clubCols, gE, clubWallM, NX - WT, 10, NX + 14 + WT, 10 + WT, 0, 3.4);
  solid(clubCols, gE, clubWallM, NX - WT, 0, NX, 10, 0, 3.4);
  solid(clubCols, gE, clubWallM, NX + 14, 0, NX + 14 + WT, 10, 0, 3.4);
  plane(gE, C(0x0c0c10), 1.2, 2.4, NX + 7, 1.2, 0.01, 0);
  plane(gE, B(textTex(192, 48, "#100a14", "#f06ae0", ["RUSYS"], 32)), 4, 1.0, NX + 7, 2.5, 9.96, Math.PI);
  // DJ booth
  solid(clubCols, gE, darkM, NX + 5, 8.6, NX + 9, 9.6, 0, 1.1);
  box(gE, C(0x16161c), NX + 5.8, 1.1, 8.9, NX + 8.2, 1.25, 9.4);
  var dj = person(0x16161c, 0x101014, null, 1.0);
  dj.position.set(NX + 7, 0, 9.0); gE.add(dj);
  // speakers
  solid(clubCols, gE, darkM, NX + 0.4, 8.4, NX + 1.6, 9.6, 0, 2.2);
  solid(clubCols, gE, darkM, NX + 12.4, 8.4, NX + 13.6, 9.6, 0, 2.2);
  cyl(gE, C(0x0c0c10), 0.35, 0.35, 0.06, 0, 10).position.set(NX + 1.0, 1.5, 8.36);
  cyl(gE, C(0x0c0c10), 0.35, 0.35, 0.06, 0, 10).position.set(NX + 13.0, 1.5, 8.36);
  // bar
  solid(clubCols, gE, woodM, NX + 11.8, 3, NX + 13.6, 7, 0, 1.05);
  box(gE, prodM, NX + 13.6, 1.4, 3.4, NX + 13.98, 2.6, 6.6);
  // dancers + club girls
  var dancers = [];
  [[0x4a3550, 0x16161c], [0x2c4a6e, 0x101014], [0x6e3a3a, 0x16161c]].forEach(function (dc, i) {
    var d = person(dc[0], dc[1], null, 0.97);
    d.position.set(NX + 4.5 + i * 2.2, 0, 4.5 + (i % 2)); gE.add(d);
    dancers.push(d);
  });
  [[0xe07aa8, 0x16161c, 0xe8d36b, NX + 5.5, 6.2], [0xc92c4a, 0x101014, 0x4a3015, NX + 9, 5.2]].forEach(function (gf) {
    var g = person(gf[0], gf[1], null, 0.92, gf[2]);
    g.position.set(gf[3], 0, gf[4]); gE.add(g);
    girls.push({ m: g, fixed: true, where: "club" });
    dancers.push(g);
  });
  [[0xe8b0c9, 0x2c2c34, 0x4a3015, AX + 6, 12], [0xb0e0d8, 0x16161c, 0xe8d36b, AX + 22, 22]].forEach(function (gf) {
    var g = person(gf[0], gf[1], null, 0.92, gf[2]);
    g.position.set(gf[3], 0, gf[4]); gK.add(g);
    girls.push({ m: g, fixed: true, where: "akro" });
  });
  var clubLights = [];
  for (var cl = 0; cl < 3; cl++) {
    var L2 = new THREE.PointLight(0xff44cc, 1.2, 16);
    L2.position.set(NX + 3.5 + cl * 3.5, 3.0, 5); gE.add(L2); clubLights.push(L2);
  }

  gB.visible = false; gC.visible = false; gD.visible = false; gE.visible = false; gF.visible = false;

  // ---------- state ----------
  var pos = new THREE.Vector3(1.0, 0, 1.0), yaw = -2.356, pitch = 1.3, baseY = FY,
    area = "flat", mode = "intro";
  var k = {}, joy = { x: 0, y: 0 };
  var gameMin = 13 * 60 + 47, dayIdx = 2, absMin = 0;
  var mood = 35, bac = 0, money = 23.47, cigs = 5, empties = 7,
    drinkCount = 0, lockT = -999, gymPaid = false, clubPaid = false, pumped = {}, inCar = false,
    lookOff = 0, spd = 0, eCool = 0, danceT = 0;
  var inv = { beer: 2, kebab: 0, pelmenai: 0, bread: 0, pizza: 0, energy: 0 };
  var hasHoodie = false, eatT = 0, eatId = null, eatBit = [false, false];
  var introMax = false, introAkro = false, introOld = false, oldUp = false, sitT = -1, filmI = 0;
  var deliI = 0, scI = 0, tourI = 0, buskI = 0;
  var seated = false, iidLocked = false, hungover = false;
  var raining = Math.random() < 0.35, lastDay = -1, prevRainOut = false;
  var mamaPending = true, nextMama = 0, lastBuzz = -99, mamaI = 0, phoneI = 0;
  var radioOn = true, radI = 0, nbrMet = false;
  var smkT = 0, smkDragged = [false, false, false];
  var gardenDone = false, senI = 0, dayCount = 1, v6Intro = false, driveIntro = false;
  var fishSt = "", fishT = 0, biteT = 0, fishCount = 0;
  var casI = 0, broI = 0, bncI = 0, djI = 0, kioI = 0, busI = 0, tvI = 0;
  var repPay = 0;
  var days = ["Pirmadienis", "Antradienis", "Treciadienis", "Ketvirtadienis", "Penktadienis", "Sestadienis", "Sekmadienis"];
  var D = "DZIUGAS", G = "PONIA GENOVAITE", P = "PETRAS";

  function isNight() { var h = Math.floor(gameMin / 60); return h >= 22 || h < 5; }
  function moodLbl() {
    return mood >= 75 ? "almost human" : mood >= 55 ? "okay-ish" : mood >= 38 ? "numb" : mood >= 20 ? "miserable" : "rock bottom";
  }
  function tStr() {
    var h = Math.floor(gameMin / 60) % 24, m = Math.floor(gameMin % 60);
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function hud() {
    hudL.innerHTML = days[dayIdx] + " &middot; Diena " + dayCount + " &middot; 2026<br>" + tStr();
    hudR.innerHTML = "&euro;" + money.toFixed(2) + "<br>mood: " + moodLbl() +
      (bac > 0.01 ? "<br>BAK: " + bac.toFixed(2) + "&permil;" : "");
  }
  function addT(m) {
    gameMin += m; absMin += m;
    while (gameMin >= 1440) { gameMin -= 1440; dayIdx = (dayIdx + 1) % 7; }
  }
  function fade(cb) {
    fdr.style.opacity = 1; mode = "fade";
    setTimeout(function () { cb(); fdr.style.opacity = 0; }, 460);
  }
  var capT = null;
  function showCap(t) {
    capEl.textContent = t; capEl.style.opacity = 1;
    if (capT) clearTimeout(capT);
    capT = setTimeout(function () { capEl.style.opacity = 0; }, 4200);
  }
  AU.onCaption = showCap;
  window.addEventListener("error", function (e) {
    try { showCap("[klaida] " + (e && e.message ? e.message : "unknown error")); } catch (err) {}
  });

  // ---------- dialogue ----------
  var dq = [], dcb = null;
  function say(l, cb) { dq = l.slice(); dcb = cb || null; mode = "dialog"; nx(); }
  function nx() {
    if (!dq.length) {
      dlg.style.display = "none"; mode = inCar ? "drive" : "walk";
      var c = dcb; dcb = null; if (c) c(); return;
    }
    var L = dq.shift();
    dwho.textContent = L.w || ""; dwho.style.display = L.w ? "block" : "none";
    dtxt.textContent = L.t; dlg.style.display = "block";
  }
  dlg.addEventListener("pointerdown", function (e) { e.stopPropagation(); if (mode === "dialog") nx(); });

  // ---------- dialogue pools ----------
  var mirP = [
    ["Still got the jawline. The jawline is doing fine. Everything behind it — less so."],
    ["Three missed calls from Mama. You'll call her tomorrow. You said that yesterday too."],
    ["You used to have plans. Basketball. Erasmus. Something with computers."],
    ["A court-ordered breathalyser in a white E-Class. Premium problems, Dziugai."]
  ], mirI = 0;
  var gmirP = [
    ["The pump is real. Briefly, you are statuesque. Then you remember rent."],
    ["You flex at the mirror. The mirror, a professional, does not laugh."]
  ], gmirI = 0;
  var smkP = [
    "The TV Tower. 326 metres — concrete to the cup, then that red-and-white needle stabbing the clouds.",
    "There's a restaurant in the cup that spins. Full circle every 45 minutes. You can't afford the bread basket.",
    "You've watched it from this balcony your whole life. It never moves. Lately, neither do you.",
    "In January they light it up like a giant Christmas tree. Today it just stands there. Relatable.",
    "Greta liked the tower. Said it looked like a syringe full of sky. You miss her. And the weird things she said."
  ];
  var nbrP = [
    [{ w: G, t: "Dziugas! There you are. Don't run, my knees can hear you." },
     { w: G, t: "I saw another mergaite leaving your flat at ONE in the morning. Heels like little hammers on the stairs." },
     { w: D, t: "Labas, ponia Genovaite. She was... a friend." },
     { w: G, t: "A friend. Of course. You are using protection, taip? Condoms! Don't make that face at me." },
     { w: G, t: "The walls in this house are paper, vaikeli. Paper and gossip." }],
    [{ w: G, t: "I left something by your door. A box. From the vaistine." },
     { w: D, t: "Ponia, please—" },
     { w: G, t: "The German ones! Quality. No shame in safety — only shame in eleven grandchildren. I would know. I have eleven." }],
    [{ w: G, t: "You look grey. Like boiled potato water. Less beer, more saltibarsciai." },
     { w: G, t: "And tell your lady friends the lift is broken. The whole laiptine hears their business on the stairs at 1am." },
     { w: D, t: "...I'll pass it on." }],
    [{ w: G, t: "Your mama called ME, Dziugai. ME. Because you don't answer." },
     { w: D, t: "I was going to—" },
     { w: G, t: "She left soup. I ate it. That is what happens to soup that waits." }],
    [{ w: G, t: "I saw you talking to that Petras downstairs. Good. He was the best engineer in Vilnius once." },
     { w: G, t: "Then the factory closed, then his Ona died, then the bottle. In that order. Remember the order, vaikeli." },
     { t: "She pats your arm with a hand like dry paper, and shuffles inside." }],
    [{ w: G, t: "Eleven grandchildren and not ONE visits. You know what I have instead? Blood pressure." },
     { w: G, t: "You, at least, I can hear through the wall. It's almost company. Drink less, the snoring gets worse." },
     { w: D, t: "I don't snore." },
     { w: G, t: "Flat 47 says otherwise." }]
  ], nbrI = 0, nbrHere = false;
  var girlL = [
    "Fuck off, creep.",
    "Go away, weirdo.",
    "Ne. Whatever it is — ne.",
    "I have pepper spray and a brown belt in judo.",
    "My boyfriend is two metres tall and plays for Rytas.",
    "Do I look like I want to talk to a man in a tank top at noon?",
    "Eww. No. Keep walking.",
    "I can smell the Svyturys from here.",
    "Blink twice if you really thought that would work.",
    "Not if you were the last man in Seskine.",
    "I'd rather wait for the 16. And the 16 never comes.",
    "You again? Somehow it gets worse every time.",
    "One more word and I'm calling my mum. She's scarier than the police.",
    "Hard pass. Soft pass. Every kind of pass.",
    "Is that a court-ordered breathalyser fob on your keys? Bye.",
    "I don't date men whose flat smells like an ashtray. I can tell from here.",
    "Zero out of ten. Zero.",
    "Keep walking, Romeo of the blokas.",
    "My babcia warned me about exactly you.",
    "Shoo. Like a pigeon. Shoo."
  ];
  var girlF = [
    "Devastating. Accurate, but devastating.",
    "You nod, as if she had read you the weather forecast.",
    "Somewhere, ponia Genovaite cackles without knowing why.",
    "The blokas has seen it all before. The blokas does not flinch."
  ];
  var petTalk = [
    [{ w: P, t: "Dziugai! Brolau! Spare a euro for an honest liar?" },
     { w: D, t: "Not today, Petrai." },
     { w: P, t: "Respect. Honesty for honesty. That's the whole economy right there." }],
    [{ w: P, t: "These cans? Not garbage, boy. A pension plan. Ten cents each at the taromat — better interest than my bank ever gave me." },
     { w: P, t: "I used to be an engineer, you know. Built half of these blocks. Now I guard them." }],
    [{ w: P, t: "Heard your Mercedes won't start unless you're sober." },
     { w: P, t: "The future is cruel and German." }],
    [{ w: P, t: "See that crack in the third panel, fourth floor? 1986. I told them the concrete batch was bad." },
     { w: P, t: "Nobody listens to an engineer. Everybody listens to a crack." }],
    [{ w: P, t: "Genovaite still feeding you advice through the wall? Listen to her. She buried two husbands and outlived three governments." },
     { w: P, t: "That is what winning looks like, around here." }],
    [{ w: P, t: "The club kids walk past me every night at three. Boom, boom, boom in their chests still going." },
     { w: P, t: "I had a heartbeat like that once. Spent it all at once, like you're doing." },
     { w: D, t: "...You want a kebabas sometime, Petrai?" },
     { w: P, t: "Now you're talking like an engineer." }]
  ], petI = 0;
  var senP = [
    [{ w: "SENELE", t: "Dziugeli! My back is a weather station and it says rain. The weeds don't care. Come, help senele." }],
    [{ w: "SENELE", t: "Your senelis planted those currants in '79. They've outlived him, the Union, and three of my hips." }],
    [{ w: "SENELE", t: "You're thin. The garden pays in euros AND potatoes. Mostly euros, don't worry." }],
    [{ w: "SENELE", t: "I saw you with that white car. Beautiful. Now show me hands that can hold a hoe, not just a steering wheel." }]
  ];

  // ---------- actions ----------
  function doLift() { say([{ t: "A handwritten note: 'NEVEIKIA'. Out of order since 2019. The note has yellowed. It is 2026." }]); }
  function doNbr() { var s = nbrP[nbrI % nbrP.length]; nbrI++; say(s, function () { mood = Math.min(100, mood + 3); }); }
  function doMirror() { var s = mirP[mirI % mirP.length]; mirI++; say(s.map(function (t) { return { t: t }; })); }
  function doGymMirror() { var s = gmirP[gmirI % gmirP.length]; gmirI++; say(s.map(function (t) { return { t: t }; })); }
  function doGirl() {
    mood = Math.max(0, mood - 2);
    if (hasHoodie && Math.random() < 0.25) {
      say([{ w: "MERGINA", t: "...nice hoodie. Still no." },
        { t: "Progress is measured in centimetres around here. That was one." }]);
      return;
    }
    var L = [{ w: "MERGINA", t: girlL[Math.floor(Math.random() * girlL.length)] }];
    if (Math.random() < 0.35) L.push({ t: girlF[Math.floor(Math.random() * girlF.length)] });
    say(L);
  }
  function doPetras() {
    if (money >= 1 && Math.random() < 0.4) {
      money -= 1; mood = Math.min(100, mood + 3);
      say([{ t: "You hand Petras a euro before he even asks. He looks at it like it owes him an apology." },
        { w: P, t: "Aciu, vaike. May your taromat always be full and your stairwell quiet." },
        { t: "Unclear if that was a blessing or a curse. Mood improves anyway." }]);
      return;
    }
    var s = petTalk[petI % petTalk.length]; petI++;
    say(s, function () { mood = Math.min(100, mood + 2); });
  }
  function doBouncer() {
    var bcp = [
      [{ w: "APSAUGA", t: "..." },
       { t: "He communicates entirely in centimetres of raised eyebrow. Today: one centimetre. It means no." }],
      [{ w: "APSAUGA", t: "..." },
       { t: "He shifts his weight from one leg to the other. Somewhere, a seismograph notices." }],
      [{ w: "APSAUGA", t: "Nice car." },
       { t: "Three syllables. Witnesses say he once used five, in 2019, at a funeral." }]
    ];
    say(bcp[bncI % bcp.length]); bncI++;
  }
  var tvP = [
    [{ t: "Panorama. Election season — a candidate promises to renovate every blokas by 2030. Yours wasn't renovated by 2020, 2024, or 2026. You switch it off." }],
    [{ t: "A cooking show. A man in Uzupis makes saltibarsciai 'deconstructed'. It's pink soup in three separate glasses. Grandma would call the police." }],
    [{ t: "Basketball highlights. Rytas lost by one. The commentator sounds personally wounded. The whole country is." }],
    [{ t: "Eurovision retrospective. Lithuania's entries, ranked. The wound of 2006 reopens live on air. 'WE ARE THE WINNERS'. We were not." }]
  ];
  function doTV() {
    addT(14);
    say(tvP[tvI % tvP.length]); tvI++;
  }
  function doBeer() {
    if (inv.beer <= 0) {
      say([{ t: "Empty. The fridge hums, judgmental. The parduotuve across the car park has more — and Maxima has it cheaper." }]);
      return;
    }
    eatStart("beer");
  }
  function doSleep() {
    fade(function () {
      var h = Math.floor(gameMin / 60), b0 = bac;
      gymPaid = false; clubPaid = false; pumped = {}; drinkCount = 0; gardenDone = false;
      if (h >= 17 || h < 5) {
        addT(((24 - h) + 9) * 60 - (gameMin % 60) + 12);
        dayCount++;
        bac = 0;
        if (b0 > 0.6) {
          hungover = true; mood = Math.min(100, mood + 5);
          say([{ t: "09:12. Your skull is two sizes too small for its contents. The light is a personal attack." },
            { t: "Coffee. Coffee is the entire plan for today." }]);
        } else {
          hungover = false; mood = Math.min(100, mood + 12);
          say([{ t: "09:12. The ceiling again. At least the headache is new." }]);
        }
      } else {
        addT(180); bac = Math.max(0, bac - 0.5); mood = Math.min(100, mood + 6);
        say([{ t: "You nap like a man avoiding something. Because you are." }]);
      }
      vig.style.opacity = hungover ? 0.35 : 0;
      saveGame();
    });
  }
  var smkYawT = 0, smkPitT = 0;
  function doSmoke() {
    if (cigs <= 0) {
      say([{ t: "The pack is empty. Klaipeda, 4.50 a box at the parduotuve. The balcony will wait." }]);
      return;
    }
    cigs--;
    mode = "smoke"; vig.style.opacity = 1;
    smkT = 0; smkDragged = [false, false, false];
    cigRig.visible = true; hand.position.copy(HAND_REST);
    var dx = twr.position.x - pos.x, dz = twr.position.z - pos.z;
    smkYawT = Math.atan2(-dx, -dz); smkPitT = 0.22;
  }
  function spawnPuff() {
    for (var i = 0; i < 2; i++) {
      var best = null;
      for (var j = 0; j < puffs.length; j++) if (puffs[j].userData.a <= 0) { best = puffs[j]; break; }
      if (!best) return;
      best.position.set(0.02 + Math.random() * 0.02, -0.05, -0.32);
      best.scale.setScalar(0.7 + Math.random() * 0.4);
      best.userData.a = 1;
      best.userData.vx = 0.015 + Math.random() * 0.02;
      best.userData.vy = 0.09 + Math.random() * 0.05;
    }
  }
  function endSmoke() {
    cigRig.visible = false;
    vig.style.opacity = hungover ? 0.35 : 0;
    addT(7); mood = Math.min(100, mood + 4);
    var i = Math.floor(Math.random() * smkP.length), j = (i + 1) % smkP.length;
    say([{ t: smkP[i] }, { t: smkP[j] }]);
  }
  function doHoops() {
    mode = "fade";
    AU.bounce();
    setTimeout(function () {
      addT(15); mood = Math.min(100, mood + 5);
      say([{ t: "You miss eleven, make three. The rim, generously, counts two of the rimouts." },
        { t: "For a few minutes you are fourteen again, and the blokas is the whole world, and that is enough." }]);
    }, 2200);
  }
  function doKiosk() {
    var kp = [
      [{ t: "Lottery tickets, gum, three newspapers arguing about the 2026 elections. The kiosk lady watches you not buy anything, again." }],
      [{ t: "The kiosk lady is doing a crossword. Seven across: 'wasted potential', seven letters. She glances at you. Writes something." }],
      [{ t: "A new lottery scratcher: 'AUKSO BLOKAS'. Top prize: renovated flat. You don't buy it. You couldn't survive winning." }]
    ];
    say(kp[kioI % kp.length]); kioI++;
  }
  function doBusStop() {
    addT(6);
    var bp2 = [
      [{ t: "The board says the 16 is due in 4 minutes. Lithuanian minutes. You give up after six of them." }],
      [{ t: "An old man at the stop tells you the 16 was better under... he doesn't finish. You both know how the sentence ends." }],
      [{ t: "The 16 appears! It's full. It does not stop. You and the driver make eye contact. He has seen empires fall." }]
    ];
    say(bp2[busI % bp2.length]); busI++;
  }
  function buyBeer() {
    if (money < 1.4) { say([{ t: "Card declined energy. You have " + money.toFixed(2) + " EUR and the can costs 1.40." }]); return; }
    money -= 1.4; inv.beer++; addT(2); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "One Svyturys into the kuprine. For later. 'Later.' [I] to drink it." }]);
  }
  function buyCigs() {
    if (money < 4.5) { say([{ t: "4.50 for a pack of Klaipeda. You have " + money.toFixed(2) + ". The lungs win this round by default." }]); return; }
    money -= 4.5; cigs += 20; addT(2); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "A fresh pack of Klaipeda. Twenty small appointments with the balcony." }]);
  }
  function buyKebab() {
    if (money < 3) { say([{ t: "Kebabas: 3.00. You: " + money.toFixed(2) + ". Tragedy in one act." }]); return; }
    money -= 3; inv.kebab++; addT(4); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "Kebabas su viskuo, wrapped in foil, warm against your ribs in the kuprine. [I] when ready." }]);
  }
  function doTaromat() {
    if (empties <= 0) { say([{ t: "The taromat waits, green and patient. You have nothing to feed it. A rare feeling: the machine has more than you." }]); return; }
    var got = empties * 0.1; money += got; addT(3);
    for (var i = 0; i < Math.min(empties, 6); i++) AU.beep(880 - i * 40, 0.08, "sine", 0.03);
    var n = empties; empties = 0;
    say([{ t: "The taromat sings its one happy note " + n + " times as it eats each bottle. +" + got.toFixed(2) + " EUR. Honest money." }]);
  }
  function doCashier() {
    var cp = [
      [{ w: "KASININKE", t: "Vel tu." }, { w: D, t: "Vel as." },
       { w: "KASININKE", t: "She scans your future without looking up. Beep." }],
      [{ w: "KASININKE", t: "We have a loyalty card now." }, { w: D, t: "What do I get?" },
       { w: "KASININKE", t: "A card." }],
      [{ w: "KASININKE", t: "The taromat likes you. It talks about you when you leave." },
       { t: "You cannot tell if she is joking. Her face has never once committed to anything." }],
      [{ w: "KASININKE", t: "Tell Petras his cans are bending the taromat's mood. It only sings for him now." }]
    ];
    say(cp[casI % cp.length]); casI++;
  }
  function doBro() {
    var bp3 = [
      [{ w: "BROLIS", t: "Kiek spaudi, broli?" }, { w: D, t: "...simta." },
       { w: "BROLIS", t: "He nods, unconvinced, and racks another twenty kilos." }],
      [{ w: "BROLIS", t: "Legs day, broli. Every day I say it. Every day you do bench." },
       { w: D, t: "The Mercedes is my legs." },
       { w: "BROLIS", t: "He stares for four seconds. Then he laughs once, like a plate dropping." }],
      [{ w: "BROLIS", t: "Protein is cheaper at the turgus. Eggs. Curd. Forget the powders." },
       { t: "Free nutrition advice from a man shaped like a wardrobe. You take it seriously." }],
      [{ w: "BROLIS", t: "Saw you running on the treadmill. From what?" },
       { w: D, t: "..." },
       { w: "BROLIS", t: "He taps his temple. 'It catches up either way. Better be strong when it does.'" }]
    ];
    say(bp3[broI % bp3.length]); broI++;
  }
  function doSenele() {
    say(senP[senI % senP.length], function () { mood = Math.min(100, mood + 2); });
    senI++;
  }
  function doGarden() {
    if (gardenDone) {
      say([{ w: "SENELE", t: "Done for today, Dziugeli. The weeds need time to grow back, and you need time to miss me." }]);
      return;
    }
    say(senP[senI % senP.length].concat([{ t: "You roll up your sleeves." }]), function () {
      repPay = 8;
      startRep("RAVEJIMAS — senele's darzas", "garden", "tap E to pull weeds",
        ["Eight rows weeded. Dirt under your nails, sun on your neck — the oldest honest feeling there is.",
         "Senele presses 8 EUR into your hand and won't hear a word about it. 'Strong boy. Stupid, but strong.'"]);
    });
    senI++;
  }
  function buyClubBeer() {
    if (money < 4) { say([{ t: "Club prices: 4.00 for the same Svyturys that costs 1.40 across the car park. You have " + money.toFixed(2) + "." }]); return; }
    money -= 4; drinkCount++; bac = Math.min(2.4, bac + 0.35); mood = Math.min(100, mood + 5);
    AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "Four euro. The barman keeps the can, the can keeps its deposit. Everyone here is losing money except the kick drum." }]);
  }
  function doDJ() {
    var dp2 = [
      [{ w: "DJ", t: "..." },
       { t: "He lifts one headphone, hears nothing you say over the techno, nods gravely, and drops the same track again." }],
      [{ w: "DJ", t: "..." },
       { t: "You request a song. He looks at you the way a surgeon looks at someone offering to help." }],
      [{ w: "DJ", t: "..." },
       { t: "He holds up one finger: wait. The drop arrives. He points at you as if you personally caused it. You did not." }]
    ];
    say(dp2[djI % dp2.length]); djI++;
  }
  function doDance() {
    mode = "dance"; danceT = 0;
  }

  // ---------- inventory & eating ----------
  var ITEMS = {
    beer: { n: "Svyturys", v: "Drink", shape: "can", col: 0xc9b03f, gulp: true,
      fx: function () { inv.beer--; empties++; drinkCount++; bac = Math.min(2.4, bac + 0.35); mood = Math.min(100, mood + 6); },
      lines: function () {
        var t = drinkCount === 1 ? "Svyturys. The Lithuanian food pyramid has one floor." :
          drinkCount === 2 ? "The world already looks softer around the edges." : "The room tilts, agreeably.";
        var L = [{ t: t }];
        if (bac > 0.6) L.push({ t: "Somewhere, the IID is judging you in advance." });
        return L;
      } },
    energy: { n: "Energy drink 'VELNIAS'", v: "Drink", shape: "can", col: 0x3ac96a, gulp: true,
      fx: function () { inv.energy--; empties++; mood = Math.min(100, mood + 4); },
      lines: function () { return [{ t: "Tastes like batteries and ambition. Your heart performs a brief drumroll." }]; } },
    kebab: { n: "Kebabas su viskuo", v: "Eat", shape: "box", col: 0xc9c4b8, gulp: false,
      fx: function () { inv.kebab--; mood = Math.min(100, mood + 7); },
      lines: function () { return [{ t: "Garlic sauce on your thumb, peace in your heart. For ninety seconds, life is uncomplicated." }]; } },
    pelmenai: { n: "Pelmenai (cold)", v: "Eat", shape: "box", col: 0xe8e2cc, gulp: false,
      fx: function () { inv.pelmenai--; mood = Math.min(100, mood + 5); },
      lines: function () { return [{ t: "You eat them cold, straight from the bag, like an animal. A well-fed animal." }]; } },
    bread: { n: "Juoda duona", v: "Eat", shape: "box", col: 0x4a3015, gulp: false,
      fx: function () { inv.bread--; mood = Math.min(100, mood + 3); },
      lines: function () { return [{ t: "Black bread, dense as the blokas itself. Senelis ate this every day of his ninety-one years." }]; } },
    pizza: { n: "Cili Pica slice", v: "Eat", shape: "box", col: 0xe0a83a, gulp: false,
      fx: function () { inv.pizza--; mood = Math.min(100, mood + 6); },
      lines: function () { return [{ t: "Mall pizza. It tastes of nothing and of being fourteen at Akropolis with no money. Both flavors land." }]; } }
  };
  var invEl = $("inv"), invList = $("invlist");
  function openInv() {
    if (mode !== "walk") return;
    mode = "inv"; unlockPtr();
    invList.innerHTML = "";
    var any = false;
    Object.keys(ITEMS).forEach(function (id) {
      if (inv[id] <= 0) return;
      any = true;
      var row = document.createElement("div"); row.className = "invrow";
      var nm = document.createElement("span"); nm.className = "invn";
      nm.innerHTML = ITEMS[id].n + " <span class='invc'>x" + inv[id] + "</span>";
      var btn = document.createElement("button"); btn.className = "invuse";
      btn.textContent = ITEMS[id].v;
      btn.onclick = function () { closeInv(); eatStart(id); };
      row.appendChild(nm); row.appendChild(btn); invList.appendChild(row);
    });
    if (cigs > 0) {
      var rc = document.createElement("div"); rc.className = "invrow";
      rc.innerHTML = "<span class='invn'>Klaipeda cigarettes <span class='invc'>x" + cigs + "</span></span><span class='invinfo'>smoke on the balcony</span>";
      invList.appendChild(rc); any = true;
    }
    if (empties > 0) {
      var re = document.createElement("div"); re.className = "invrow";
      re.innerHTML = "<span class='invn'>Empty cans <span class='invc'>x" + empties + "</span></span><span class='invinfo'>taromat: 0.10 each</span>";
      invList.appendChild(re); any = true;
    }
    if (hasHoodie) {
      var rh = document.createElement("div"); rh.className = "invrow";
      rh.innerHTML = "<span class='invn'>HiM hoodie</span><span class='invinfo'>worn. it helps, marginally</span>";
      invList.appendChild(rh); any = true;
    }
    if (!any) invList.innerHTML = "<div class='invempty'>An empty kuprine and a heavy heart. The parduotuve is open 8–22.</div>";
    invEl.style.display = "flex";
  }
  function closeInv() { invEl.style.display = "none"; if (mode === "inv") mode = "walk"; }
  $("invx").onclick = closeInv;
  $("btnI").addEventListener("pointerdown", function (e) {
    e.stopPropagation(); AU.ensure();
    if (mode === "inv") closeInv(); else openInv();
  });
  function eatStart(id) {
    eatId = id; eatT = 0; eatBit = [false, false];
    mode = "eat"; eatRig.visible = true;
    hand2.position.copy(EAT_REST);
    var it = ITEMS[id];
    itemCan.visible = it.shape === "can";
    itemBox.visible = it.shape === "box";
    (it.shape === "can" ? itemCan : itemBox).material.color.setHex(it.col);
  }
  function endEat() {
    eatRig.visible = false;
    var it = ITEMS[eatId];
    it.fx(); addT(4);
    say(it.lines());
    eatId = null;
  }

  // ---------- MAXIMA actions ----------
  function buyMax(id, price, name) {
    return function () {
      if (money < price) { say([{ t: name + ": " + price.toFixed(2) + " EUR. You have " + money.toFixed(2) + ". Even Maxima has limits." }]); return; }
      money -= price; inv[id]++; addT(2); AU.beep(1320, 0.07, "sine", 0.03);
      say([{ t: name + " into the kuprine. The yellow price tag promised, and for once, delivered." }]);
    };
  }
  function buyMaxCigs() {
    if (money < 4.2) { say([{ t: "4.20 here. Twenty cents cheaper than home. You have " + money.toFixed(2) + " — still not enough." }]); return; }
    money -= 4.2; cigs += 20; addT(2); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "Klaipeda, twenty cents cheaper. The savings, invested wisely, will be worth nothing." }]);
  }
  function doSelfCheck() {
    var sp2 = [
      [{ w: "SAVITARNA", t: "NETIKETAS DAIKTAS KREPSELYJE." },
       { t: "Unexpected item. The item is your hand. A light flashes. A teenager with a key fob is dispatched. Everyone waits." }],
      [{ w: "SAVITARNA", t: "AR TURITE MAXIMA KORTELE?" },
       { w: D, t: "Ne." },
       { w: "SAVITARNA", t: "AR TIKRAI?" },
       { t: "The machine sounds genuinely hurt." }],
      [{ t: "You scan a single item flawlessly. The machine approves in silence. This is the greatest victory available to you today." }]
    ];
    say(sp2[scI % sp2.length]); scI++;
  }
  function doDeli() {
    var dp3 = [
      [{ w: "KULINARIJOS PONIA", t: "Silke? Desros? Balta misraine?" },
       { w: D, t: "Just looking." },
       { w: "KULINARIJOS PONIA", t: "Looking is free. Eating is 2.49 per hundred grams. Life is in between." }],
      [{ w: "KULINARIJOS PONIA", t: "You look like a boy who eats standing up over a sink." },
       { w: D, t: "..." },
       { w: "KULINARIJOS PONIA", t: "I have seen a thousand of you. Buy the pelmenai. Boil them. SIT DOWN to eat. That is the whole secret." }]
    ];
    say(dp3[deliI % dp3.length]); deliI++;
  }
  function doLoyalty() {
    say([{ w: "KASININKE", t: "Maxima card?" }, { w: D, t: "No—" },
      { w: "KASININKE", t: "It says here you bought 214 cans of Svyturys this year." },
      { w: D, t: "I don't HAVE a card." },
      { w: "KASININKE", t: "The card has you." }]);
  }

  // ---------- AKROPOLIS actions ----------
  function doHoodieShop() {
    if (hasHoodie) {
      say([{ t: "You already own the hoodie. The mannequin wears your old life: a tank top, EUR 7.99. You don't look back." }]);
      return;
    }
    if (money < 25) {
      say([{ w: "PARDAVEJA", t: "The hoodie is 25." },
        { t: "You have " + money.toFixed(2) + ". You touch the sleeve once, like saying goodbye to a horse, and leave." }]);
      return;
    }
    money -= 25; hasHoodie = true; mood = Math.min(100, mood + 6); addT(15);
    mirP.push(["The hoodie fits. You look like a man with a subscription to something. It's not nothing."]);
    say([{ t: "25 EUR. A plain dark hoodie, the kind worn by men whose lives work. You wear it out of the shop." },
      { t: "In the shop mirror, briefly, a stranger with potential." }]);
  }
  function doCinema() {
    if (money < 6) { say([{ t: "Seansai: 6 EUR. You have " + money.toFixed(2) + ". You read the posters very slowly instead, for free." }]); return; }
    var films = [
      "a Lithuanian drama: two hours of a man staring at a field. The field stares back. You cry twice and can't say why.",
      "an American action film: cars, explosions, a man who never calls his mother either. Solidarity.",
      "a horror film: the monster lives in a panel building's basement. The audience of locals laughs. The tourists don't.",
      "a romantic comedy: they kiss at the airport. The whole row of single men exhales as one."
    ];
    money -= 6; mood = Math.min(100, mood + 8); addT(126);
    say([{ t: "You watch " + films[filmI % films.length] }, { t: "Two hours in the dark where nobody needed anything from you. Cinema: the respectable coma." }]);
    filmI++;
  }
  function doFountain() {
    if (money < 0.1) { say([{ t: "You have nothing to toss. The fountain has more money than you. You make a wish anyway, on credit." }]); return; }
    money -= 0.1; mood = Math.min(100, mood + 2);
    AU.plop();
    say([{ t: "Ten cents into the fountain. You wish for the usual. The water keeps the receipt." }]);
  }
  function doEscalator() {
    say([{ t: "NEVEIKIA. The escalator to the second floor hasn't moved since 2023. Neither has the second floor. Tradition." }]);
  }

  // ---------- OLD TOWN actions ----------
  function doBusker() {
    var bk = [
      [{ t: "He plays an old waltz on the accordion. The cobblestones have heard it ten thousand times and still lean in." }],
      [{ w: "MUZIKANTAS", t: "Requests, jaunuoli?" }, { w: D, t: "Something happy." },
       { t: "He plays the same waltz, two beats faster. In Lithuania, this is happy." }]
    ];
    if (money >= 1 && Math.random() < 0.5) {
      money -= 1; mood = Math.min(100, mood + 3);
      say([{ t: "You drop a euro in the accordion case. He nods without missing a note. The waltz gains, briefly, a little gold." }]);
      return;
    }
    say(bk[buskI % bk.length]); buskI++;
  }
  function doTourists() {
    var tp2 = [
      [{ w: "TURISTAS", t: "Excuse me! Photo? You take?" },
       { t: "You take four photos of two Germans in front of the hill. They examine them like land deeds. They approve. Everyone is briefly happy." }],
      [{ w: "TURISTE", t: "Is it true the tower is on TOP of the hill?" },
       { w: D, t: "...Taip." },
       { w: "TURISTE", t: "Incredible country." }]
    ];
    mood = Math.min(100, mood + 4);
    say(tp2[tourI % tp2.length]); tourI++;
  }
  function doBench() {
    mode = "sit"; sitT = 0;
    var bdx = (OX + 27) - pos.x, bdz = 9 - pos.z;
    smkYawT = Math.atan2(-bdx, -bdz); smkPitT = 0.12;
  }
  function climbHill() {
    fade(function () {
      oldUp = true; pos.set(OX + 27, 0, 11.5); baseY = 11.2; yaw = Math.PI; pitch = 0;
      mode = "walk"; addT(10);
      say([{ t: "You climb the spiral path, breathing like a man who smokes. At the top: the tower, the wind, and all of Vilnius at once." },
        { t: "Red roofs, the river, and far off — small from here — your TV tower, standing over the blokai like a lighthouse for the landlocked." }]);
    });
  }
  function descendHill() {
    fade(function () {
      oldUp = false; pos.set(OX + 18, 0, 14); baseY = 0; yaw = Math.PI / 2; pitch = 0;
      mode = "walk"; addT(8);
    });
  }
  function doTower() {
    mood = Math.min(100, mood + 5); addT(10);
    say([{ t: "Gediminas Tower. Brick on brick since the 1400s. It has outlasted dukes, tsars, empires, and every plan you ever made." },
      { t: "The flag snaps in the wind. You stand there until your ears hurt from the cold, and it is somehow exactly enough." }]);
  }

  // ---------- travel system ----------
  var travEl = $("trav"), travBtns = $("travbtns"), loadEl = $("load");
  var ZONES = {
    yard: { n: "BLOKAS — home", short: "NAMO", min: 18,
      entry: { x: 79, z: 19.2, yaw: Math.PI / 2 },
      fl: ["the city thins back into panels and pylons", "the 16 overtakes you, somehow"] },
    pond: { n: "SENELES SODYBA — darzas & tvenkinys", short: "SODYBA", min: 22,
      entry: { x: PX - 35, z: 25, yaw: -Math.PI / 2 },
      fl: ["asphalt gives way to gravel; the radio gives way to birds", "apple trees lean over the fence like old neighbours"] },
    maxima: { n: "MAXIMA — viskas, ko reikia", short: "MAXIMA", min: 14,
      entry: { x: MX - 23, z: -8, yaw: -Math.PI / 2 },
      fl: ["the A1 unrolls; pylons count themselves past the window", "red and yellow on the horizon, like a warning you keep ignoring"] },
    akro: { n: "AKROPOLIS — the mall", short: "AKROPOLI", min: 20,
      entry: { x: AX - 23, z: -8, yaw: -Math.PI / 2 },
      fl: ["half of Vilnius is driving the same direction", "the car park appears first; it is the true mall"] },
    old: { n: "SENAMIESTIS — Old Town", short: "SENAMIESTI", min: 24,
      entry: { x: OX - 25, z: 20, yaw: -Math.PI / 2 },
      fl: ["cobbles begin; the suspension files a complaint", "church spires rise over the roofs, patient as ever"] }
  };
  function showTravel() {
    mode = "travel"; unlockPtr();
    travBtns.innerHTML = "";
    Object.keys(ZONES).forEach(function (z) {
      if (z === carZone) return;
      var b = document.createElement("button"); b.className = "travbtn";
      b.innerHTML = ZONES[z].n + "<small>~" + ZONES[z].min + " min</small>";
      b.onclick = function () { travEl.style.display = "none"; travelTo(z); };
      travBtns.appendChild(b);
    });
    travEl.style.display = "flex";
  }
  $("travx").onclick = function () {
    travEl.style.display = "none";
    car.position.x += (area === "yard" ? -2.4 : 2.4);
    mode = "drive";
  };
  function travelTo(z) {
    var Z = ZONES[z];
    mode = "load";
    spdEl.style.display = "none";
    $("loadtxt").textContent = "VAZIUOJAM " + (z === "yard" ? "NAMO" : "I " + Z.short);
    $("loadsub").textContent = Z.fl[Math.floor(Math.random() * Z.fl.length)];
    loadEl.style.display = "flex";
    AU.engineSet(7);
    setTimeout(function () {
      loadEl.style.display = "none";
      carZone = z; area = z; addT(Z.min);
      car.position.set(Z.entry.x, 0, Z.entry.z);
      carYaw = Z.entry.yaw; car.rotation.y = carYaw;
      inCar = true; seated = true; spd = 2.5; lookOff = 0;
      oldUp = false; baseY = 0;
      setWorld(area);
      spdEl.style.display = "block";
      mode = "drive";
      if (z === "maxima" && !introMax) {
        introMax = true;
        say([{ t: "MAXIMA. Red and yellow like a warning you've chosen to ignore. The doors will open for you the way nothing else does — automatically, unconditionally." }]);
      } else if (z === "pond" && !pondIntro) {
        pondIntro = true;
        say([{ t: "Senelės sodyba. Wood smoke, currant bushes, the well senelis dug and the pond he dug after it, 'for balance'." },
          { t: "She'll have heard the car from the kitchen. There is no arriving here unannounced. There is also no leaving unfed." }]);
      } else if (z === "akro" && !introAkro) {
        introAkro = true;
        say([{ t: "Akropolis. The whole city under one roof, lit like a hospital, smelling of cinnamon and new trainers. You used to come here at fourteen with five litai and infinite time. Now it's reversed." }]);
      } else if (z === "old" && !introOld) {
        introOld = true;
        say([{ t: "Senamiestis. Cobblestones, church bells, tourists photographing doors. Six kilometres from the blokas; a different century entirely." },
          { t: "And above it all, on its green hill — Gediminas Tower, holding the flag up into the wind." }]);
      } else {
        showCap(z === "yard" ? "home. the blokas takes you back without comment" : "arrived: " + Z.short.toLowerCase());
      }
    }, 2300);
  }
  function doCoffee() {
    addT(6);
    if (hungover) {
      hungover = false; vig.style.opacity = 0; mood = Math.min(100, mood + 5);
      say([{ t: "The kettle screams; you let it. Black, two sugars, drunk standing up at the counter." },
        { t: "The fog lifts to a survivable altitude. You can hear individual thoughts again. Unfortunately." }]);
    } else {
      mood = Math.min(100, mood + 2);
      say([{ t: "Coffee, black. You drink it leaning on the counter like a man in an advert for disappointment." }]);
    }
  }
  var mamaP = [
    [{ w: "MAMA", t: "Dziugai! Finally. You eat? Real food, I mean. Not kebabas." },
     { w: D, t: "Taip, Mama. Sometimes." },
     { w: "MAMA", t: "I made saltibarsciai. I'll leave a jar with ponia Genovaite. Don't argue with me." },
     { t: "You argue with no one. Something in your chest unclenches half a centimetre." }],
    [{ w: "MAMA", t: "Tevas saw your car in town yesterday. He says you drove nicely. Slowly." },
     { w: D, t: "...tell him thanks." },
     { w: "MAMA", t: "Come Sunday. I'm making cepelinai. Bring nobody, just yourself." },
     { t: "Sunday. You might actually go." }]
  ];
  function doPhone() {
    if (mamaPending) {
      mamaPending = false; nextMama = absMin + 300 + Math.random() * 240;
      mood = Math.min(100, mood + 6); addT(6);
      say(mamaP[mamaI % mamaP.length]); mamaI++;
      return;
    }
    var pools = [
      [{ t: "No new messages. Greta's last one is still there, from March. 'take care of yourself, dziugai'. Read, 11:47." }],
      [{ t: "Banking app: " + money.toFixed(2) + " EUR. There's a little chart. The chart should not point that way." }],
      [{ t: "Group chat 'KURSIOKAI 2022': 47 unread. Mantas got a job in Oslo. Thumbs up. Thumbs up. Fire emoji. You lock the phone." }],
      [{ t: "Battery 14%. You and the phone are running on similar reserves." }]
    ];
    say(pools[phoneI % pools.length]); phoneI++;
  }
  var catP = [
    "The cat allows it. Three strokes, no more — it has standards, unlike you with the kebabas.",
    "The cat leans into your hand and switches its engine on. Best conversation you've had all week.",
    "It headbutts your shin once, professionally, and resumes ignoring the universe."
  ], catI = 0;
  function doCat() {
    if (Math.random() < 0.7) {
      AU.purr(); mood = Math.min(100, mood + 5); addT(3);
      say([{ t: catP[catI % catP.length] }]); catI++;
    } else {
      cat.flee = 1.4; cat.wait = 0;
      cat.tx = 2 + Math.random() * 32; cat.tz = 2 + Math.random() * 11;
      say([{ t: "The cat has somewhere to be. Everyone in this city has somewhere to be except you." }]);
    }
  }

  // ---------- transitions ----------
  function setWorld(a) {
    gA.visible = (a === "flat" || a === "hall");
    gB.visible = (a === "yard");
    gC.visible = (a === "shop");
    gD.visible = (a === "gym");
    gE.visible = (a === "club");
    gF.visible = (a === "pond");
    gM.visible = (a === "maxima");
    gK.visible = (a === "akro");
    gO.visible = (a === "old");
    gS.visible = (a === "flat" || a === "hall" || a === "yard");
  }
  function shopOpen() { var h = Math.floor(gameMin / 60); return h >= 8 && h < 22; }
  function gymOpen() { var h = Math.floor(gameMin / 60); return h >= 6 && h < 23; }
  function toHall() {
    fade(function () {
      area = "hall"; pos.set(HX + 1.0, 0, 2.7); baseY = FY; yaw = -Math.PI / 2; pitch = 0;
      nbrHere = !nbrMet || Math.random() < (nbrI < nbrP.length ? 0.65 : 0.3);
      if (nbrHere) nbrMet = true;
      npc.visible = nbrHere; setWorld(area); mode = "walk";
      if (nbrHere) say([{ w: G, t: "Dziugas! Vaikeli! Come here a minute—" }]);
    });
  }
  function toFlat() {
    fade(function () { area = "flat"; pos.set(7.0, 0, 2.7); baseY = FY; yaw = Math.PI / 2; pitch = 0; setWorld(area); mode = "walk"; });
  }
  function toYard(px, pz, py2) {
    fade(function () {
      area = "yard"; pos.set(px, 0, pz); baseY = 0; yaw = py2; pitch = 0; setWorld(area); mode = "walk";
    });
  }
  function toHallUp() {
    fade(function () {
      area = "hall"; pos.set(HX + 1.1, 0, 7.0); baseY = FY; yaw = 0; pitch = 0;
      nbrHere = !nbrMet || Math.random() < (nbrI < nbrP.length ? 0.65 : 0.3);
      if (nbrHere) nbrMet = true;
      npc.visible = nbrHere; setWorld(area); mode = "walk";
      if (nbrHere) say([{ w: G, t: "Dziugas! Vaikeli! Come here a minute—" }]);
    });
  }
  function toShop() {
    if (!shopOpen()) {
      say([{ t: "Closed. 8:00–22:00, says the sign. Through the glass, the taromat glows green in the dark, waiting like a loyal dog." }]);
      return;
    }
    fade(function () { area = "shop"; pos.set(SX + 5, 0, 1.2); baseY = 0; yaw = Math.PI; pitch = 0; setWorld(area); mode = "walk"; });
  }
  function exitShop() { toYard(5, 42.6, 0); }
  function toGym() {
    if (!gymOpen()) {
      say([{ t: "GELEZIS sleeps 23:00–06:00. Even iron rests. The sign suggests you do the same." }]);
      return;
    }
    if (!gymPaid) {
      if (money < 5) { say([{ t: "Day pass: 5 EUR. You have " + money.toFixed(2) + ". The receptionist's smile does not waver. The door does not open." }]); return; }
      money -= 5; gymPaid = true;
      fade(function () {
        area = "gym"; pos.set(GX + 7, 0, 1.2); baseY = 0; yaw = Math.PI; pitch = 0; setWorld(area); mode = "walk";
        say([{ t: "5 EUR. The smell of iron, rubber and ambition. Somebody's playlist is all bass." }]);
      });
    } else {
      fade(function () { area = "gym"; pos.set(GX + 7, 0, 1.2); baseY = 0; yaw = Math.PI; pitch = 0; setWorld(area); mode = "walk"; });
    }
  }
  function exitGym() { toYard(39, 42.6, 0); }
  function doClub() {
    if (!isNight()) {
      say([{ w: "APSAUGA", t: "Closed. Come back after twenty-two." },
        { t: "Behind the door, the sound system sleeps. The bouncer does not. The bouncer never sleeps." }]);
      return;
    }
    if (!clubPaid) {
      if (money < 5) {
        say([{ w: "APSAUGA", t: "Five euro cover. You have " + money.toFixed(2) + ". Mathematics is also a bouncer." }]);
        return;
      }
      money -= 5; clubPaid = true;
    }
    fade(function () {
      area = "club"; pos.set(NX + 7, 0, 1.4); baseY = 0; yaw = Math.PI; pitch = 0; setWorld(area); mode = "walk";
      say([{ t: "RUSYS. A basement pretending to be Berlin. The kick drum replaces your heartbeat at the door, no questions asked." }]);
    });
  }
  function exitClub() { toYard(66, 24.6, 0); }
  var pondIntro = false;
  function doKnock() {
    say([{ t: "You knock. Inside: a radio playing Radiocentras, the smell of soup that has been improving since Tuesday." },
      { w: "SENELE", t: "(from the darzas) I'M IN THE GARDEN, DZIUGELI! Where else would I be!" }],
      function () { mood = Math.min(100, mood + 2); });
  }
  function doFish() {
    mode = "fish"; fishSt = "wait"; fishT = 3 + Math.random() * 6; biteT = 0;
    rodRig.visible = true;
    var wdx = (PX + 10) - pos.x, wdz = 9 - pos.z;
    smkYawT = Math.atan2(-wdx, -wdz); smkPitT = 0.3;
    showCap("you cast. the water ignores you, politely");
  }
  var fishTable = [
    { n: "a kuoja the size of your hand", m: 6 },
    { n: "a decent karosas", m: 6 },
    { n: "a fat karsis — senelis would nod", m: 8 },
    { n: "a LYDEKA. An actual pike. Your heart does something it hasn't in months", m: 12 },
    { n: "an old boot. It fights harder than the kuoja did", m: 2 },
    { n: "a beer can. You know the brand. Intimately", m: 2, can: true }
  ];
  function fishResolve(caught) {
    rodRig.visible = false;
    if (!caught) {
      mood = Math.max(0, mood - 1); addT(20);
      say([{ t: "The line goes slack. Gone. The pond keeps its secrets and your bait." }]);
      return;
    }
    var f = fishTable[Math.floor(Math.random() * fishTable.length)];
    fishCount++;
    mood = Math.min(100, mood + f.m); addT(20);
    if (f.can) empties++;
    var L = [{ t: "You pull out " + f.n + "." }];
    if (f.can) L.push({ t: "Ten cents at the taromat. The pond pays better than League." });
    else L.push({ t: "You let it go. Catch and release — you know how it feels to be thrown back." });
    say(L);
  }
  function doSkim() {
    AU.plop(); AU.plop && setTimeout(function () { AU.plop(); }, 280); setTimeout(function () { AU.plop(); }, 480);
    mood = Math.min(100, mood + 2); addT(5);
    say([{ t: "Three skips. Senelis once did eleven. The record stands, like all the best records, unbeaten and unwitnessed." }]);
  }

  // ---------- PC: menu, league, the call ----------
  var pcEl = $("pc"), pcmenu = $("pcmenu"), pclg = $("pclg"), pclog = $("pclog"),
    pcbtns = $("pcbtns"), pcclock = $("pcclock");
  function openPC() {
    mode = "pc"; unlockPtr();
    pcclock.textContent = tStr();
    pcmenu.style.display = "flex"; pclg.style.display = "none"; pcEl.style.display = "block";
  }
  function closePC(line) {
    pcEl.style.display = "none"; mode = "walk";
    if (line) say(line);
  }
  $("pcOff").onclick = function () {
    closePC([{ t: drinkCount > 0 ? "Enough. Your eyes feel like ashtrays." : "Enough. Daylight still exists, allegedly." }]);
  };
  $("pcLol").onclick = function () { pcmenu.style.display = "none"; pclg.style.display = "block"; startLol(); };
  // -- League minimap battle sim --
  var mcv = $("pclmap"), mctx = mcv.getContext("2d"), mapIv = null, mst = null;
  var LANES = [
    [[12, 84], [12, 12], [84, 12]],
    [[12, 84], [84, 12]],
    [[12, 84], [84, 84], [84, 12]]
  ];
  function laneP(lane, p) {
    var pts = LANES[lane];
    if (pts.length === 2) {
      return [pts[0][0] + (pts[1][0] - pts[0][0]) * p, pts[0][1] + (pts[1][1] - pts[0][1]) * p];
    }
    if (p < 0.5) {
      var q = p * 2;
      return [pts[0][0] + (pts[1][0] - pts[0][0]) * q, pts[0][1] + (pts[1][1] - pts[0][1]) * q];
    }
    var q2 = (p - 0.5) * 2;
    return [pts[1][0] + (pts[2][0] - pts[1][0]) * q2, pts[1][1] + (pts[2][1] - pts[1][1]) * q2];
  }
  function mapStart(lane) {
    mst = { t: 0, win: false, lane: lane, mn: [], fl: [], sp: 0, end: 0, px: 48, py: 48 };
    if (mapIv) clearInterval(mapIv);
    mapIv = setInterval(function () {
      try { drawMap(); } catch (err) {
        clearInterval(mapIv); mapIv = null;
        lolErr(err);
      }
    }, 60);
  }
  function mapEvent(kind) {
    if (!mst) return;
    if (kind === "death") mst.fl.push({ x: mst.px, y: mst.py, t: 1.2, c: "#e05548" });
    if (kind === "kill") mst.fl.push({ x: mst.px, y: mst.py, t: 1.2, c: "#7fe08a" });
    if (kind === "baron") mst.fl.push({ x: 30, y: 28, t: 1.6, c: "#b06ae0" });
    if (kind === "end") mst.end = 0.01;
  }
  function drawMap() {
    if (pcEl.style.display !== "block") { clearInterval(mapIv); mapIv = null; return; }
    if (!mst) return;
    var g = mctx; mst.t += 0.06;
    g.fillStyle = "#16321e"; g.fillRect(0, 0, 96, 96);
    g.strokeStyle = "#23506e"; g.lineWidth = 8;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(96, 96); g.stroke();
    g.strokeStyle = "#3a7a46"; g.lineWidth = 5;
    LANES.forEach(function (pts) {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    });
    // towers
    [[12, 50, 1], [12, 26, 1], [40, 56, 1], [50, 84, 1], [74, 84, 1],
     [12, 70, 0], [26, 84, 0]].forEach(function (tw) {
      g.fillStyle = tw[2] ? "#c94a3a" : "#3a7ac9";
      g.fillRect(96 - tw[0] - 1.5, 96 - tw[1] - 1.5, 3, 3);
      g.fillStyle = tw[2] ? "#3a7ac9" : "#c94a3a";
      g.fillRect(tw[0] - 1.5, tw[1] - 1.5, 3, 3);
    });
    // nexus
    var blink = mst.end > 0 && (mst.t * 6 | 0) % 2 === 0;
    g.fillStyle = (!mst.win && blink) ? "#ffd34a" : "#3a7ac9"; g.fillRect(7, 81, 9, 9);
    g.fillStyle = (mst.win && blink) ? "#ffd34a" : "#c94a3a"; g.fillRect(80, 6, 9, 9);
    // minions
    mst.sp -= 0.06;
    if (mst.sp <= 0 && !mst.end) {
      mst.sp = 1.1;
      for (var ln = 0; ln < 3; ln++) {
        mst.mn.push({ l: ln, p: 0, s: 0 });
        mst.mn.push({ l: ln, p: 0, s: 1 });
      }
    }
    mst.mn = mst.mn.filter(function (m) { return m.p < 1; });
    if (mst.mn.length > 90) mst.mn.splice(0, mst.mn.length - 90);
    mst.mn.forEach(function (m) {
      m.p += 0.0045;
      var q = m.s ? 1 - m.p : m.p;
      var xy = laneP(m.l, q);
      g.fillStyle = m.s ? "#c94a3a" : "#3a7ac9";
      g.fillRect(xy[0] - 1, xy[1] - 1, 2, 2);
    });
    // the player (after a role is locked)
    if (mst.lane >= 0) {
      var pp = 0.32 + 0.16 * Math.sin(mst.t * 0.45) + 0.04 * Math.sin(mst.t * 2.3);
      var pxy = laneP(mst.lane, Math.max(0.05, Math.min(0.9, pp)));
      mst.px = pxy[0]; mst.py = pxy[1];
      if ((mst.t * 4 | 0) % 2 === 0) {
        g.fillStyle = "#ffd34a"; g.fillRect(pxy[0] - 2, pxy[1] - 2, 4, 4);
      }
    } else if ((mst.t * 2 | 0) % 2 === 0) {
      g.fillStyle = "#9fc9a8"; g.font = "bold 9px monospace"; g.textAlign = "center";
      g.fillText("PICK YOUR ROLE", 48, 51);
    }
    // event flashes
    mst.fl = mst.fl.filter(function (f) { return f.t > 0; });
    mst.fl.forEach(function (f) {
      f.t -= 0.06;
      g.strokeStyle = f.c; g.lineWidth = 1.5;
      var r = (1.2 - f.t) * 9 + 2;
      g.beginPath(); g.arc(f.x, f.y, r, 0, Math.PI * 2); g.stroke();
    });
    // nexus explosion
    if (mst.end > 0) {
      mst.end += 0.06;
      var ex = mst.win ? 84 : 11, ey = mst.win ? 10 : 85;
      g.strokeStyle = "#ffd34a"; g.lineWidth = 2;
      for (var e2 = 0; e2 < 3; e2++) {
        g.beginPath(); g.arc(ex, ey, mst.end * 14 + e2 * 5, 0, Math.PI * 2); g.stroke();
      }
    }
  }

  var CHAMPS = {
    TOP: [
      { n: "Garen", e: "Darius", a: "Spin to win — run straight at Darius" },
      { n: "Malphite", e: "Sett", a: "Rock solid — engage Sett at level 3" },
      { n: "Teemo", e: "Nasus", a: "Blind Nasus and kite him to despair" }],
    JNG: [
      { n: "Lee Sin", e: "their jungler", a: "Invade — kick him out of his own red" },
      { n: "Warwick", e: "their jungler", a: "Smell blood — dive top lane at level 2" },
      { n: "Master Yi", e: "their jungler", a: "Q into five people and trust the lifesteal" }],
    MID: [
      { n: "Yasuo", e: "Ahri", a: "All-in — E-Q through the wave onto Ahri" },
      { n: "Ahri", e: "Yasuo", a: "Charm Yasuo the instant he dashes" },
      { n: "Veigar", e: "Zed", a: "Cage Zed and stack Q off his head" }],
    ADC: [
      { n: "Ezreal", e: "Kai'Sa", a: "E in — kill Kai'Sa" },
      { n: "Jinx", e: "Caitlyn", a: "Rocket-spam Caitlyn at level 2" },
      { n: "Miss Fortune", e: "Draven", a: "Q-bounce Draven off the cannon" }],
    SUP: [
      { n: "Thresh", e: "their ADC", a: "Hook their ADC under your tower" },
      { n: "Blitzcrank", e: "their ADC", a: "The claw decides — go for the grab" },
      { n: "Soraka", e: "their ADC", a: "Aggressive banana poke, no fear" }]
  };
  var roleLane = { TOP: 0, JNG: 1, MID: 1, ADC: 2, SUP: 2 };
  var lolT = [], mt = null, lolSession = 0;
  function lolAlive(s) { return s === lolSession && pcEl.style.display === "block"; }
  function lolErr(err) {
    var d2 = document.createElement("div");
    d2.style.color = "#e08a7f";
    d2.textContent = "> [client crashed: " + (err && err.message ? err.message : err) + "] ALT+F4 and queue again.";
    pclog.appendChild(d2);
    pcbtns.style.display = "block";
  }
  function lolWait(ms, fn) {
    var s = lolSession;
    lolT.push(setTimeout(function () {
      if (!lolAlive(s)) return;
      try { fn(); } catch (err) { lolErr(err); }
    }, ms));
  }
  function lolClear() { lolT.forEach(clearTimeout); lolT = []; lolSession++; }
  function lolLog(t, c) {
    var d = document.createElement("div");
    d.textContent = "> " + t;
    if (c) d.style.color = c;
    pclog.appendChild(d); pclog.scrollTop = pclog.scrollHeight;
    AU.beep(300 + Math.random() * 200, 0.04, "square", 0.02);
  }
  function lolOpts(title, opts, cb) {
    var bx = document.createElement("div"); bx.className = "lolopts";
    if (title) {
      var hh = document.createElement("div"); hh.className = "lolopth";
      hh.textContent = title; bx.appendChild(hh);
    }
    var s = lolSession;
    opts.forEach(function (o) {
      var b = document.createElement("button"); b.className = "lolopt";
      b.textContent = o.t;
      b.onclick = function () {
        if (!lolAlive(s)) return;
        bx.remove(); AU.beep(700, 0.05, "square", 0.03);
        try { cb(o); } catch (err) { lolErr(err); }
      };
      bx.appendChild(b);
    });
    pclog.appendChild(bx); pclog.scrollTop = pclog.scrollHeight;
  }
  function startLol() {
    lolClear(); pclog.innerHTML = ""; pcbtns.style.display = "none"; mt = null;
    try {
      mapStart(-1);
      lolLog("CONNECTING TO EUNE...");
    } catch (err) { lolErr(err); return; }
    lolWait(600, function () {
      lolOpts("CHOOSE YOUR ROLE:",
        ["TOP", "JNG", "MID", "ADC", "SUP"].map(function (r) { return { t: r, r: r }; }),
        function (o) { pickChamp(o.r); });
    });
  }
  function pickChamp(role) {
    lolLog("Role locked: " + role + ".");
    lolOpts("CHOOSE YOUR CHAMPION:",
      CHAMPS[role].map(function (c) { return { t: c.n, c: c }; }),
      function (o) { beginMatch(role, o.c); });
  }
  function beginMatch(role, ch) {
    mt = { role: role, ch: ch, score: 0, kills: 0, deaths: 0 };
    mapStart(roleLane[role]);
    lolLog("Queue accepted. Estimated wait: 0:42");
    lolWait(900, function () {
      lolLog("Match found. You lock in " + ch.n + " " + role.toLowerCase() + ". Someone in champ select sighs audibly.");
    });
    lolWait(2200, function () {
      lolLog("Minute 6 — lane is even. " + ch.e + " mispositions. A window opens.");
      lolOpts(null, [
        { t: ch.a, k: "aggro" },
        { t: role === "ADC" ? "Kill the cannon minion, bank the gold" : "Farm safely, scale for later", k: "safe" },
        { t: "Back off and ward the river bush", k: "macro" }
      ], function (o) { lolResolve(o.k, 1); });
    });
  }
  function lolResolve(k, stage) {
    var ch = mt.ch;
    if (k === "aggro") {
      if (Math.random() < 0.45) {
        mt.score += 2; mt.kills++; mapEvent("kill");
        lolLog("+ It works. " + ch.e + " evaporates. Chat, grudgingly: 'gap.'", "#7fe08a");
      } else {
        mt.score -= 1; mt.deaths++; mapEvent("death");
        lolLog("- " + ch.e + " was waiting. You die instantly. Your jungler pings '?' fourteen times.", "#e08a7f");
      }
    } else if (k === "safe") {
      if (Math.random() < 0.9) { mt.score += 1; lolLog("+ Sensible. Gold trickles in. Nobody claps for discipline, but it compounds.", "#9fc9a8"); }
      else lolLog("- You get poked off the wave anyway. Existence is chip damage.", "#e08a7f");
    } else {
      if (Math.random() < 0.7) { mt.score += 1; lolLog("+ Vision. The map breathes easier with one candle lit.", "#9fc9a8"); }
      else lolLog("- Your ward dies to a control ward. The void stares back.", "#e08a7f");
    }
    if (stage === 1) {
      lolWait(1500, function () {
        lolLog("Minute 19 — Baron spawns. Your team starts arguing in /all.");
        lolOpts(null, [
          { t: mt.role === "JNG" ? "Flash over the wall — smite-steal Baron" : "Call a 50/50 Baron with zero vision", k: "aggro2" },
          { t: "Take the free dragon instead", k: "safe" },
          { t: "Split-push bot and pull their pressure", k: "macro" }
        ], function (o) { lolResolve(o.k === "aggro2" ? "baron" : o.k, 2); });
      });
    } else if (stage === 2) {
      lolWait(1500, function () {
        lolLog("Minute 31 — last fight brewing at their nexus.");
        lolOpts(null, [
          { t: "Dive their backline", k: "aggro" },
          { t: mt.role === "SUP" ? "Peel for your carry like a bodyguard" : "Kite off the front line", k: "safe" },
          { t: "Ignore it — backdoor the nexus alone", k: "door" }
        ], function (o) { lolResolve(o.k, 3); });
      });
    } else if (stage === 3) {
      lolWait(1300, lolFinish);
    }
  }
  // special stage-2/3 branches share lolResolve via custom keys
  var lolResolveBase = lolResolve;
  lolResolve = function (k, stage) {
    if (k === "baron") {
      if (Math.random() < 0.4) {
        mt.score += 2; mapEvent("baron");
        lolLog("+ THE STEAL. The pit erupts. Somewhere across town, Youngmind feels a disturbance and smiles.", "#b06ae0");
      } else {
        mt.score -= 1; mt.deaths++; mapEvent("death");
        lolLog("- It lands in their smite. Your team types its grief in four languages.", "#e08a7f");
      }
      lolWait(1500, function () {
        lolLog("Minute 31 — last fight brewing at their nexus.");
        lolOpts(null, [
          { t: "Dive their backline", k: "aggro" },
          { t: mt.role === "SUP" ? "Peel for your carry like a bodyguard" : "Kite off the front line", k: "safe" },
          { t: "Ignore it — backdoor the nexus alone", k: "door" }
        ], function (o) { lolResolve(o.k, 3); });
      });
      return;
    }
    if (k === "door") {
      if (Math.random() < 0.5) {
        mt.score += 2;
        lolLog("+ The nexus falls while ten people fight over nothing. Criminal. Beautiful.", "#7fe08a");
      } else {
        mt.score -= 1; mt.deaths++; mapEvent("death");
        lolLog("- Caught alone in their base. A 1v4 is just a long, well-attended death.", "#e08a7f");
      }
      lolWait(1300, lolFinish);
      return;
    }
    lolResolveBase(k, stage);
  };
  function lolFinish() {
    var p = Math.max(0.08, Math.min(0.88, 0.16 + mt.score * 0.12));
    var win = Math.random() < p;
    if (mst) mst.win = win;
    mapEvent("end");
    if (win) {
      lolLog("VICTORY  +21 LP", "#7fe08a");
      lolLog("KDA " + mt.kills + "/" + mt.deaths + "/7. You feel something almost like joy. It is small and it is yours.");
    } else {
      lolLog("DEFEAT  -18 LP", "#e08a7f");
      lolLog("KDA " + mt.kills + "/" + mt.deaths + "/2. 'gg go next', types the jungler, queueing instantly.");
    }
    addT(38); mood = Math.max(0, Math.min(100, mood + (win ? 9 : -7))); hud();
    pcbtns.style.display = "block";
  }
  $("pcQ").onclick = function () { startLol(); };
  $("pcX").onclick = function () { lolClear(); pcmenu.style.display = "flex"; pclg.style.display = "none"; };

  var callEl = $("call"), callstat = $("callstat");
  var ym = new Audio("assets/youngmind.ogg");
  var callTimer = null, callT0 = 0;
  function startCall() {
    pcEl.style.display = "none";
    mode = "call"; callEl.style.display = "flex"; callstat.textContent = "calling...";
    AU.ring(function () {
      if (mode !== "call") return;
      callstat.textContent = "connected · 0:00"; callT0 = Date.now();
      callTimer = setInterval(function () {
        var s = Math.floor((Date.now() - callT0) / 1000);
        callstat.textContent = "connected · 0:" + (s < 10 ? "0" : "") + s;
      }, 1000);
      ym.currentTime = 0;
      ym.play().catch(function () { endCall(true); });
    });
  }
  ym.onended = function () { endCall(false); };
  function endCall(failed) {
    if (mode !== "call") return;
    if (callTimer) { clearInterval(callTimer); callTimer = null; }
    try { ym.pause(); } catch (e) {}
    AU.hangup();
    callstat.textContent = failed ? "no answer" : "call ended";
    setTimeout(function () {
      callEl.style.display = "none"; addT(3);
      if (failed) say([{ t: "Straight to voicemail energy. Youngmind lives his own broadcast schedule." }]);
      else say([{ w: D, t: "...Gerai. Gerai, brolau." },
        { t: "You stare at the wallpaper for a second after he hangs up. Calls with Youngmind always end right before they start meaning something." }]);
      mood = Math.min(100, mood + 4);
    }, 900);
  }
  $("pcCall").onclick = function () { AU.ensure(); startCall(); };
  $("callend").onclick = function () { endCall(false); };

  // ---------- IID ----------
  var iidEl = $("iid"), iidbar = $("iidbar"), iidtxt = $("iidtxt"), blowing = false, iidP = 0;
  function enterCar() {
    fade(function () {
      seated = true; unlockPtr(); mode = "iid"; iidP = 0; blowing = false;
      iidLocked = absMin < lockT;
      iidbar.style.width = "0%";
      if (iidLocked) {
        $("blow").style.display = "none";
        iidtxt.innerHTML = "<span style='color:#e08a7f'>UZBLOKUOTA · " + Math.ceil(lockT - absMin) +
          " MIN</span><br>the interlock is not speaking to you";
      } else {
        $("blow").style.display = "";
        iidtxt.innerHTML = "P&Umacr;SKITE / BLOW<br>hold SPACE or the button";
      }
      iidEl.style.display = "flex";
    });
  }
  function stepOut(msg) {
    seated = false; inCar = false; spdEl.style.display = "none";
    pos.set(car.position.x - Math.cos(carYaw) * 3.3, 0, car.position.z + Math.sin(carYaw) * 3.3);
    if (area === "yard") {
      pos.x = Math.max(-28, Math.min(84, pos.x));
      pos.z = Math.max(1.0, Math.min(70, pos.z));
    }
    yaw = carYaw; pitch = 0; mode = "walk";
    if (msg) say(msg);
  }
  function iidDone() {
    mode = "iidwait"; iidtxt.textContent = "ANALIZUOJAMA...";
    AU.beep(880, 0.1, "sine", 0.05);
    setTimeout(function () {
      if (bac < 0.2) {
        iidtxt.innerHTML = "<span style='color:#7fe08a'>PRAEJO · " + bac.toFixed(2) + "&permil;</span>";
        AU.beep(990, 0.12, "sine", 0.06);
        setTimeout(function () {
          iidEl.style.display = "none"; inCar = true; AU.engineOn();
          if (!v6Intro) {
            v6Intro = true;
            say([{ t: "The V6 wakes with a smooth, expensive hum. 2010 E 350 4MATIC — the last grown-up decision you ever made." }],
              startDrive);
          } else startDrive();
        }, 900);
      } else {
        iidtxt.innerHTML = "<span style='color:#e08a7f'>NEPRAEJO · " + bac.toFixed(2) + "&permil;<br>UZBLOKUOTA 45 MIN</span>";
        AU.beep(220, 0.18, "square", 0.07);
        setTimeout(function () { AU.beep(220, 0.18, "square", 0.07); }, 250);
        lockT = absMin + 45; mood = Math.max(0, mood - 5);
        setTimeout(function () {
          iidEl.style.display = "none";
          stepOut([{ w: D, t: "Negaliu... come on." },
            { t: "You climb back out. The E-Class sits there, white and immaculate and unimpressed. Across the yard, a curtain twitches." }]);
        }, 1400);
      }
    }, 1500);
  }
  $("iidx").onclick = function () {
    iidEl.style.display = "none";
    if (seated && !inCar) stepOut(null);
    else mode = "walk";
  };
  $("blow").addEventListener("pointerdown", function (e) { e.preventDefault(); blowing = true; });
  window.addEventListener("pointerup", function () { blowing = false; });

  var radioCaps = [
    "M-1: a eurodance hit from 2004, somehow still charting",
    "Radiocentras: two hosts laugh very hard at their own joke",
    "Power Hit Radio: the bass arrives before the song does",
    "Opus 3: ambient synths for sad driving"
  ];
  function radioCap() { showCap("\u266a " + radioCaps[radI % radioCaps.length]); radI++; }
  function startDrive() {
    mode = "drive"; spd = 0; lookOff = 0; spdEl.style.display = "block";
    AU.radioStart();
    if (!driveIntro) {
      driveIntro = true;
      say([{ t: "Mirror. Signal. The IID hums on the dash like a parole officer. Drive carefully — half the yard is watching. [R] radio" }]);
    } else if (radioOn) radioCap();
    if (area === "yard") setTimeout(function () {
      if (mode === "drive") showCap("A1 \u2192 east: follow the road past klubas RUSYS, under the green gantry");
    }, 1600);
  }
  function exitCar() {
    if (Math.abs(spd) > 1.5) return;
    AU.engineOff();
    stepOut(null);
  }

  // ---------- workout minigame ----------
  var repEl = $("rep"), repname = $("repname"), repcount = $("repcount"),
    repbar = $("repbar"), rephint = $("rephint");
  var repPow = 0, repN = 0, repIdle = 0, repKey = "", repLines = null;
  function startRep(name, key, hint, lines) {
    mode = "rep"; repPow = 0.3; repN = 0; repIdle = 0; repKey = key; repLines = lines;
    repname.textContent = name; rephint.textContent = hint;
    repcount.textContent = "REPS: 0 / 8"; repbar.style.width = "30%";
    repEl.style.display = "block";
  }
  function repPress() { repPow = Math.min(1.05, repPow + 0.22); repIdle = 0; }
  function finishRep(quit) {
    repEl.style.display = "none";
    if (quit) {
      repPay = 0;
      say([{ t: repKey === "garden" ?
        "You quit mid-row. Senele says nothing. The silence pays 0 EUR." :
        "You rack it halfway through the set. The machine sighs. So does the bro by the dumbbells." }]);
      return;
    }
    var first = !pumped[repKey];
    pumped[repKey] = true;
    mood = Math.min(100, mood + (first ? 9 : 3));
    addT(repKey === "garden" ? 50 : 12);
    if (repPay > 0) { money += repPay; gardenDone = true; repPay = 0; AU.beep(1320, 0.07, "sine", 0.04); }
    else AU.clank();
    say(repLines.map(function (t) { return { t: t }; }));
  }
  function doBench() {
    startRep("BENCH PRESS — 60 KG", "bench", "tap E to push",
      ["Eight shaky reps. The bar wobbles like your life choices, but it goes up.",
       "Chest: pumped. Problems: identical. Still — the bar went up."]);
  }
  function doLat() {
    startRep("LAT PULLDOWN — 50 KG", "lat", "tap E to pull",
      ["Lat pulldowns. You imagine pulling yourself together. Close enough."]);
  }
  function doTread() {
    startRep("TREADMILL — 12 KM/H", "tread", "tap E to keep pace",
      ["You run nowhere, fast. It is the most honest machine in the building."]);
  }

  // ---------- interactables ----------
  function items() {
    var arr = [
      { ar: "flat", x: 1.3, z: 1.2, r: 1.6, l: "Sleep", f: doSleep },
      { ar: "flat", x: 5.2, z: 1.0, r: 1.5, l: "Sit at the PC", f: openPC },
      { ar: "flat", x: 0.65, z: 5.45, r: 1.5, l: "Fridge — Svyturys x" + inv.beer, f: doBeer },
      { ar: "flat", x: 3.25, z: 0.6, r: 1.4, l: "Watch TV", f: doTV },
      { ar: "flat", x: 4.55, z: 0.56, r: 1.4, l: mamaPending ? "Answer Mama's call" : "Check your phone", f: doPhone },
      { ar: "flat", x: 1.75, z: 5.2, r: 1.5, l: "Make coffee", f: doCoffee },
      { ar: "flat", x: 7.6, z: 4.85, r: 1.3, l: "Look in the mirror", f: doMirror },
      { ar: "flat", x: 7.9, z: 2.7, r: 1.5, l: "Leave the flat", f: toHall },
      { ar: "flat", x: -1.3, z: 3.9, r: 1.4, l: "Smoke a cigarette (" + cigs + " left)", f: doSmoke },
      { ar: "hall", x: HX + 0.1, z: 2.7, r: 1.4, l: "Go back inside", f: toFlat },
      { ar: "hall", x: HX + 1.1, z: 7.8, r: 1.5, l: "Take the stairs down", f: function () { toYard(12.2, 2.0, Math.PI); } },
      { ar: "hall", x: HX + HW - 0.1, z: 6.45, r: 1.3, l: "Call the lift", f: doLift },
      { ar: "hall", x: HX + 1.65, z: 4.7, r: 1.7, l: "Talk to ponia Genovaite", f: doNbr, c: function () { return nbrHere; } },
      { ar: "yard", x: 12.2, z: 1.4, r: 1.8, l: "Go back up", f: toHallUp },
      { ar: carZone, x: car.position.x, z: car.position.z, r: 2.8, l: "Get in the E 350", f: enterCar },
      { ar: "yard", x: katz.position.x, z: katz.position.z, r: 1.5, l: "Pet the cat", f: doCat },
      { ar: "yard", x: 7.2, z: 1.6, r: 1.8, l: "Talk to Petras", f: doPetras },
      { ar: "yard", x: 5, z: 43.4, r: 2.0, l: "Enter the parduotuve" + (shopOpen() ? "" : " (closed)"), f: toShop },
      { ar: "yard", x: 39, z: 43.4, r: 2.0, l: gymOpen() ? "Enter Gelezis gym — 5 EUR/day" : "Gelezis gym (closed)", f: toGym },
      { ar: "yard", x: 66, z: 25.2, r: 2.0, l: isNight() ? "Klubas RUSYS — 5 EUR cover" : "Klubas RUSYS (opens 22:00)", f: doClub },
      { ar: "yard", x: 64.4, z: 24.9, r: 1.5, l: "Talk to the bouncer", f: doBouncer },
      { ar: "yard", x: 41.5, z: 7.5, r: 2.4, l: "Shoot some hoops", f: doHoops },
      { ar: "yard", x: 21.5, z: 24.6, r: 1.8, l: "Browse the kiosk", f: doKiosk },
      { ar: "yard", x: 32, z: 23.0, r: 1.8, l: "Wait at the bus stop", f: doBusStop },
      { ar: "shop", x: SX + 1.0, z: 3.25, r: 1.5, l: "Buy Svyturys — 1.40 EUR", f: buyBeer },
      { ar: "shop", x: SX + 5, z: 3.0, r: 1.5, l: "Buy kebabas — 3.00 EUR", f: buyKebab },
      { ar: "shop", x: SX + 8, z: 1.3, r: 1.6, l: "Buy Klaipeda cigarettes — 4.50 EUR", f: buyCigs },
      { ar: "shop", x: SX + 8, z: 2.0, r: 1.3, l: "Chat with the cashier", f: doCashier },
      { ar: "shop", x: SX + 0.8, z: 7.2, r: 1.6, l: "Taromat — return empties x" + empties, f: doTaromat },
      { ar: "shop", x: SX + 5, z: 0.5, r: 1.5, l: "Leave the shop", f: exitShop },
      { ar: "gym", x: GX + 3, z: 5.6, r: 1.7, l: "Bench press", f: doBench },
      { ar: "gym", x: GX + 7, z: 7.6, r: 1.6, l: "Lat pulldown", f: doLat },
      { ar: "gym", x: GX + 10.9, z: 3.2, r: 1.6, l: "Treadmill", f: doTread },
      { ar: "gym", x: GX + 13.5, z: 5, r: 1.6, l: "Check the mirror", f: doGymMirror },
      { ar: "gym", x: GX + 9.5, z: 4.0, r: 1.6, l: "Talk to the gym bro", f: doBro },
      { ar: "gym", x: GX + 7, z: 0.5, r: 1.5, l: "Leave the gym", f: exitGym },
      { ar: "club", x: NX + 12.7, z: 5, r: 1.7, l: "Bar — Svyturys 4.00 EUR", f: buyClubBeer },
      { ar: "club", x: NX + 6, z: 4.8, r: 2.2, l: "Dance", f: doDance },
      { ar: "club", x: NX + 7, z: 8.4, r: 1.8, l: "Bother the DJ", f: doDJ },
      { ar: "club", x: NX + 7, z: 0.6, r: 1.5, l: "Leave the club", f: exitClub },
      { ar: "pond", x: PX + 10, z: 18.6, r: 2.4, l: "Cast a line", f: doFish },
      { ar: "pond", x: PX + 4.5, z: 10, r: 2.0, l: "Skim a stone", f: doSkim },
      { ar: "pond", x: PX - 4.5, z: 16.3, r: 1.9, l: "Talk to senele", f: doSenele },
      { ar: "pond", x: PX - 4.5, z: 13.5, r: 2.4, l: gardenDone ? "Darzas (done for today)" : "Pull weeds for senele — 8 EUR", f: doGarden },
      { ar: "pond", x: PX - 6.6, z: 4.6, r: 1.7, l: "Knock on the sodyba door", f: doKnock },
      { ar: "maxima", x: MX + 0.7, z: 12.5, r: 1.8, l: "Svyturys — 1.09 EUR", f: buyMax("beer", 1.09, "Svyturys") },
      { ar: "maxima", x: MX + 25.3, z: 13, r: 1.8, l: "Pelmenai — 2.20 EUR", f: buyMax("pelmenai", 2.2, "A bag of pelmenai") },
      { ar: "maxima", x: MX + 7.5, z: 10.5, r: 1.8, l: "Juoda duona — 0.89 EUR", f: buyMax("bread", 0.89, "Black bread") },
      { ar: "maxima", x: MX + 18.5, z: 14.5, r: 1.8, l: "Energy drink — 1.50 EUR", f: buyMax("energy", 1.5, "VELNIAS energy") },
      { ar: "maxima", x: MX + 18.5, z: 8.0, r: 1.6, l: "Klaipeda cigarettes — 4.20 EUR", f: buyMaxCigs },
      { ar: "maxima", x: MX + 18.5, z: 9.2, r: 1.5, l: "Ask about the loyalty card", f: doLoyalty },
      { ar: "maxima", x: MX + 5.5, z: 7.6, r: 1.8, l: "Use the self-checkout", f: doSelfCheck },
      { ar: "maxima", x: MX + 13, z: 21.6, r: 2.0, l: "Browse the kulinarija", f: doDeli },
      { ar: "akro", x: AX + 1.1, z: 12.5, r: 2.0, l: hasHoodie ? "HiM (you have the hoodie)" : "HiM — buy a hoodie, 25 EUR", f: doHoodieShop },
      { ar: "akro", x: AX + 1.1, z: 22.5, r: 2.0, l: "Cili Pica — slice 3.50 EUR", f: function () {
        if (money < 3.5) { say([{ t: "3.50 a slice. Mall prices. You have " + money.toFixed(2) + "." }]); return; }
        money -= 3.5; inv.pizza++; addT(3); AU.beep(1320, 0.07, "sine", 0.03);
        say([{ t: "One slice, boxed, into the kuprine. The cheese will congeal into something honest by the time you eat it." }]);
      } },
      { ar: "akro", x: AX + 33, z: 13.5, r: 2.0, l: "Forum Kinas — film, 6 EUR", f: doCinema },
      { ar: "akro", x: AX + 17, z: 20.2, r: 2.0, l: "Toss a coin in the fountain", f: doFountain },
      { ar: "akro", x: AX + 25.5, z: 24.6, r: 1.8, l: "The escalator", f: doEscalator },
      { ar: "old", x: OX - 1, z: 21.2, r: 2.0, l: "Listen to the busker", f: doBusker },
      { ar: "old", x: OX + 8.4, z: 14.2, r: 1.9, l: "Talk to the tourists", f: doTourists },
      { ar: "old", x: OX + 3.2, z: 6.3, r: 1.8, l: "Sit on the bench", f: doBench, c: function () { return !oldUp; } },
      { ar: "old", x: OX + 18, z: 12, r: 2.4, l: "Climb Gediminas hill", f: climbHill, c: function () { return !oldUp; } },
      { ar: "old", x: OX + 27, z: 9, r: 3.4, l: "Gediminas Tower", f: doTower, c: function () { return oldUp; } },
      { ar: "old", x: OX + 27, z: 12.2, r: 2.6, l: "Walk back down", f: descendHill, c: function () { return oldUp; } }
    ];
    girls.forEach(function (g) {
      arr.push({ ar: g.where, x: g.m.position.x, z: g.m.position.z, r: 1.7, l: "Say labas", f: doGirl });
    });
    return arr;
  }

  // ---------- movement / collision ----------
  function insideCol(c, x, z, r) {
    return x > c.a - r && x < c.b + r && z > c.c - r && z < c.d + r;
  }
  function slide(dx, dz, cols) {
    var r = 0.32, i, c;
    var nx2 = pos.x + dx, hit = false;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      if (insideCol(c, pos.x, pos.z, r)) continue;
      if (insideCol(c, nx2, pos.z, r)) { hit = true; break; }
    }
    if (!hit) pos.x = nx2;
    var nz2 = pos.z + dz; hit = false;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      if (insideCol(c, pos.x, pos.z, r)) continue;
      if (insideCol(c, pos.x, nz2, r)) { hit = true; break; }
    }
    if (!hit) pos.z = nz2;
  }
  function curCols() {
    if (area === "flat") return flatCols;
    if (area === "hall") return hallCols;
    if (area === "shop") return shopCols;
    if (area === "gym") return gymCols;
    if (area === "club") return clubCols;
    if (area === "pond") return pondCols;
    var c;
    if (area === "maxima") c = maxCols.slice();
    else if (area === "akro") c = akroCols.slice();
    else if (area === "old") c = oldCols.slice();
    else c = yardCols.slice();
    if (!inCar && carZone === area)
      c.push({ a: car.position.x - 2.2, b: car.position.x + 2.2, c: car.position.z - 2.2, d: car.position.z + 2.2 });
    return c;
  }

  // ---------- input ----------
  var cv = renderer.domElement, lookId = null, lx = 0, ly = 0, ptrLocked = false;
  function unlockPtr() { if (document.pointerLockElement) document.exitPointerLock(); }
  document.addEventListener("pointerlockchange", function () { ptrLocked = document.pointerLockElement === cv; });
  document.addEventListener("mousemove", function (e) {
    if (!ptrLocked) return;
    if (mode === "drive") {
      lookOff -= e.movementX * 0.0028; lookOff = Math.max(-2.4, Math.min(2.4, lookOff));
    } else if (mode === "walk") {
      yaw -= e.movementX * 0.0028; pitch -= e.movementY * 0.0028;
      pitch = Math.max(-1.35, Math.min(1.35, pitch));
    }
  });
  cv.addEventListener("pointerdown", function (e) {
    AU.ensure();
    if (mode === "intro") { begin(); return; }
    if (mode === "dialog") { nx(); return; }
    if (!TOUCH && !ptrLocked && (mode === "walk" || mode === "drive")) {
      try { cv.requestPointerLock(); } catch (err) {}
    }
    lookId = e.pointerId; lx = e.clientX; ly = e.clientY;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  });
  cv.addEventListener("pointermove", function (e) {
    if (ptrLocked || e.pointerId !== lookId) return;
    var dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY;
    if (mode === "drive") {
      lookOff -= dx * 0.004; lookOff = Math.max(-2.4, Math.min(2.4, lookOff));
    } else if (mode === "walk") {
      yaw -= dx * 0.0042; pitch -= dy * 0.0042;
      pitch = Math.max(-1.35, Math.min(1.35, pitch));
    }
  });
  cv.addEventListener("pointerup", function (e) { if (e.pointerId === lookId) lookId = null; });

  var joyEl = $("joy"), knob = $("knob"), joyId = null;
  if (TOUCH) { joyEl.style.display = "block"; $("btnE").style.display = "block"; $("btnI").style.display = "block"; }
  joyEl.addEventListener("pointerdown", function (e) {
    e.stopPropagation(); AU.ensure(); joyId = e.pointerId;
    try { joyEl.setPointerCapture(e.pointerId); } catch (err) {}
    jm(e);
  });
  joyEl.addEventListener("pointermove", function (e) { if (e.pointerId === joyId) jm(e); });
  function jend(e) {
    if (e.pointerId === joyId) {
      joyId = null; joy.x = 0; joy.y = 0;
      knob.style.left = "36px"; knob.style.top = "36px";
    }
  }
  joyEl.addEventListener("pointerup", jend);
  joyEl.addEventListener("pointercancel", jend);
  function jm(e) {
    var r = joyEl.getBoundingClientRect();
    var dx = (e.clientX - r.left - 55) / 42, dy = (e.clientY - r.top - 55) / 42;
    var m = Math.sqrt(dx * dx + dy * dy);
    if (m > 1) { dx /= m; dy /= m; }
    joy.x = dx; joy.y = dy;
    knob.style.left = (36 + dx * 34) + "px"; knob.style.top = (36 + dy * 34) + "px";
  }
  $("btnE").addEventListener("pointerdown", function (e) { e.stopPropagation(); AU.ensure(); pressE(); });

  window.addEventListener("keydown", function (e) {
    if (e.code === "Space" || e.code.indexOf("Arrow") === 0) e.preventDefault();
    AU.ensure();
    if (mode === "intro") {
      if (e.code === "KeyC" && hasSave) { contStart(); return; }
      begin(); return;
    }
    k[e.code] = true;
    if (e.code === "Space" && mode === "iid") blowing = true;
    if ((e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && !e.repeat) {
      if (mode === "dialog") nx(); else pressE();
    }
    if (e.code === "KeyR" && mode === "drive" && !e.repeat) {
      radioOn = !radioOn;
      if (radioOn) radioCap(); else showCap("radio off. just the V6 and your thoughts. mostly the V6.");
    }
    if (e.code === "KeyI" && !e.repeat) {
      if (mode === "inv") closeInv();
      else if (mode === "walk") openInv();
    }
    if (e.code === "Escape") {
      if (mode === "pc") $("pcOff").onclick();
      else if (mode === "call") endCall(false);
      else if (mode === "rep") finishRep(true);
      else if (mode === "inv") closeInv();
    }
  });
  window.addEventListener("keyup", function (e) {
    k[e.code] = false;
    if (e.code === "Space") blowing = false;
  });

  var target = null;
  function pressE() {
    if (eCool > 0) return; eCool = 0.22;
    if (mode === "rep") { repPress(); return; }
    if (mode === "drive") { exitCar(); return; }
    if (mode === "fish") {
      if (fishSt === "bite") { fishSt = "done"; fishResolve(true); }
      else if (fishSt === "wait") {
        fishSt = "done"; rodRig.visible = false;
        say([{ t: "You reel in early. The water keeps its counsel." }]);
      }
      return;
    }
    if (mode !== "walk") return;
    if (target) target.f();
  }
  function findT() {
    target = null;
    if (mode !== "walk") { pr.style.display = "none"; return; }
    var best = 99, fx = -Math.sin(yaw), fz = -Math.cos(yaw);
    items().forEach(function (it) {
      if (it.ar !== area) return;
      if (it.c && !it.c()) return;
      var dx = it.x - pos.x, dz = it.z - pos.z;
      var d = Math.sqrt(dx * dx + dz * dz);
      if (d > it.r) return;
      var dot = (dx * fx + dz * fz) / (d || 1);
      if (d > 0.5 && dot < 0.05) return;
      if (d < best) { best = d; target = it; }
    });
    if (target) { pr.textContent = "[E]  " + target.l; pr.style.display = "block"; }
    else pr.style.display = "none";
  }

  // ---------- club music ----------
  var clubA = new Audio("assets/club.ogg");
  clubA.loop = true;

  // ---------- save / continue ----------
  var SK = "blokas_save";
  function saveGame() {
    try {
      localStorage.setItem(SK, JSON.stringify({
        m: money, md: mood, b: bac, c: cigs, iv: inv, em: empties,
        gm: Math.floor(gameMin), di: dayIdx, am: Math.floor(absMin), lt: Math.floor(lockT),
        hg: hungover, rn: raining, dc: dayCount, v6: v6Intro, dr2: driveIntro,
        nb: nbrI, nm: nbrMet, pt: petI, fc: fishCount, pi2: pondIntro, mi: mirI, si: senI,
        hd: hasHoodie, im: introMax, ia: introAkro, io: introOld
      }));
    } catch (e) {}
  }
  function loadGame() {
    try {
      var s = JSON.parse(localStorage.getItem(SK) || "null");
      if (!s) return false;
      money = s.m; mood = s.md; bac = s.b || 0; cigs = s.c; empties = s.em;
      if (s.iv) Object.keys(inv).forEach(function (k2) { inv[k2] = s.iv[k2] || 0; });
      else if (s.bf) inv.beer = s.bf;
      gameMin = s.gm; dayIdx = s.di; absMin = s.am; lockT = s.lt;
      hungover = !!s.hg; raining = !!s.rn; dayCount = s.dc || 1;
      v6Intro = !!s.v6; driveIntro = !!s.dr2;
      nbrI = s.nb || 0; nbrMet = !!s.nm; petI = s.pt || 0; fishCount = s.fc || 0;
      pondIntro = !!s.pi2; mirI = s.mi || 0; senI = s.si || 0;
      hasHoodie = !!s.hd; introMax = !!s.im; introAkro = !!s.ia; introOld = !!s.io;
      if (hasHoodie) mirP.push(["The hoodie fits. You look like a man with a subscription to something. It's not nothing."]);
      carZone = "yard";
      car.position.set(15.5, 0, 6.5); car.rotation.y = Math.PI / 2; carYaw = Math.PI / 2;
      lastDay = dayIdx;
      return true;
    } catch (e) { return false; }
  }
  var hasSave = false;
  try { hasSave = !!localStorage.getItem(SK); } catch (e) {}
  function contStart() {
    if (!loadGame()) { begin(); return; }
    $("intro").style.display = "none";
    hudL.style.display = "block"; hudR.style.display = "block";
    area = "flat"; pos.set(2.6, 0, 2.4); baseY = FY; yaw = -2.0; pitch = 0;
    setWorld(area); vig.style.opacity = hungover ? 0.35 : 0; mode = "walk";
    say([{ t: "Diena " + dayCount + ". Same flat, same ceiling, slightly different number in the banking app." }]);
  }
  if (hasSave) {
    var contBtn = document.createElement("div");
    contBtn.id = "contbtn";
    contBtn.innerHTML = "&#9654; CONTINUE &middot; press C";
    contBtn.addEventListener("pointerdown", function (e) {
      e.stopPropagation(); AU.ensure(); contStart();
    });
    $("intro").appendChild(contBtn);
  }
  setInterval(function () { if (mode !== "intro") saveGame(); }, 90000);
  window.addEventListener("beforeunload", function () { if (mode !== "intro") saveGame(); });

  // ---------- intro / boot ----------
  var wakeT = 0;
  function begin() {
    $("intro").style.display = "none";
    mode = "wake"; wakeT = 0;
    hudL.style.display = "block"; hudR.style.display = "block";
  }
  $("intro").addEventListener("pointerdown", function () { AU.ensure(); begin(); });
  function sm(t) { return t * t * (3 - 2 * t); }

  // ---------- main loop ----------
  var dayC = new THREE.Color(0x9fb2c0), nightC = new THREE.Color(0x161c28), tmpC = new THREE.Color();
  var clock = new THREE.Clock(), et = 0;
  function loop() {
    requestAnimationFrame(loop);
    var dt = Math.min(0.05, clock.getDelta());
    et += dt; eCool = Math.max(0, eCool - dt);
    if (mode !== "intro") {
      gameMin += dt; absMin += dt;
      if (gameMin >= 1440) { gameMin -= 1440; dayIdx = (dayIdx + 1) % 7; }
      bac = Math.max(0, bac - dt * 0.004);
    }
    var h = Math.floor(gameMin / 60);
    if (dayIdx !== lastDay) {
      if (lastDay >= 0) raining = Math.random() < 0.35;
      lastDay = dayIdx;
    }
    var dl = (h >= 6 && h < 22) ? 1 : 0.28;
    var wMul = raining ? 0.78 : 1;
    hemi.intensity = 0.95 * dl * wMul; sun.intensity = 0.5 * dl * (raining ? 0.4 : 1);
    tmpC.copy(nightC).lerp(dayC, dl);
    if (raining) tmpC.lerp(rainC, 0.45);
    scene.background = tmpC; scene.fog.color.copy(tmpC);
    scene.fog.far = raining ? 175 : 280;
    var night = isNight();
    AU.setNight(night);
    var outdoors = (area === "yard" || area === "pond" || area === "old" || mode === "drive" || (area === "flat" && pos.x < 0));
    car.visible = (carZone === "yard" && gS.visible) || (carZone !== "yard" && area === carZone);
    if (area === "old") {
      var bdx2 = (OX - 1) - pos.x, bdz2 = 21.5 - pos.z;
      var bd2 = Math.sqrt(bdx2 * bdx2 + bdz2 * bdz2);
      if (bd2 < 22) { AU.accStart(); AU.accGain(0.05 * (1 - bd2 / 22)); }
      else AU.accGain(0);
    } else AU.accGain(0);
    if (raining && outdoors !== prevRainOut && outdoors) showCap("rain needles the courtyard, soft static on everything");
    prevRainOut = outdoors;
    AU.setRain(raining ? (outdoors ? 0.022 : area === "club" ? 0.001 : 0.007) : 0);
    AU.radioGain((mode === "drive" || mode === "load") && radioOn ? 0.035 : 0);
    if (area === "flat" && mamaPending && et - lastBuzz > 40 && mode === "walk") {
      lastBuzz = et;
      showCap("your phone buzzes against the desk");
      AU.beep(660, 0.04, "sine", 0.02);
      setTimeout(function () { AU.beep(660, 0.04, "sine", 0.02); }, 180);
    }
    if (!mamaPending && absMin > nextMama && nextMama > 0) { mamaPending = true; nextMama = 0; }
    rain.visible = raining && outdoors;
    if (rain.visible) {
      rain.position.set(camera.position.x, 0, camera.position.z);
      var pa = rainGeo.attributes.position;
      for (var rr = 0; rr < RAIN_N; rr++) {
        pa.array[rr * 3 + 1] -= dt * 16;
        if (pa.array[rr * 3 + 1] < 0) pa.array[rr * 3 + 1] = 22;
      }
      pa.needsUpdate = true;
    }
    AU.setEnv(area === "yard" || area === "old" || mode === "drive" ? "out" :
      area === "gym" ? "gym" : area === "shop" || area === "maxima" || area === "akro" ? "shop" :
      area === "club" ? "club" :
      area === "pond" ? "pond" :
      (area === "flat" && pos.x < 0) ? "out" : "in");

    // club music: full inside, faint near the door at night
    if (area === "club") {
      AU.technoStart(); AU.technoGain(0.075);
      if (clubA.paused) { clubA.volume = 0.55; clubA.play().catch(function () {}); }
    } else {
      if (!clubA.paused) clubA.pause();
      if (night && (area === "yard" || mode === "drive")) {
        var px2 = mode === "drive" ? car.position.x : pos.x;
        var pz2 = mode === "drive" ? car.position.z : pos.z;
        var dd = Math.sqrt((66 - px2) * (66 - px2) + (30 - pz2) * (30 - pz2));
        if (dd < 30) { AU.technoStart(); AU.technoGain(0.045 * (1 - dd / 30)); }
        else AU.technoGain(0);
      } else AU.technoGain(0);
    }

    // street life (always animated — it shows from the balcony too)
    traffic.forEach(function (c) {
      c.x += c.dir * c.sp * dt;
      if (c.x > 110) c.x = -70; if (c.x < -70) c.x = 110;
      c.m.position.x = c.x;
      if (area === "yard" || mode === "drive") {
        var px = mode === "drive" ? car.position.x : pos.x;
        var pz = mode === "drive" ? car.position.z : pos.z;
        if (Math.abs(c.x - px) < 4 && Math.abs(c.z - pz) < 2.2 && Math.random() < dt * 1.5)
          AU.beep(420, 0.25, "square", 0.04);
      }
    });
    peds.forEach(function (p) {
      p.x += p.dir * p.sp * dt;
      if (p.x > 58) p.dir = -1; if (p.x < -18) p.dir = 1;
      p.m.position.x = p.x;
      p.m.position.y = Math.abs(Math.sin(et * 5 + p.z)) * 0.04;
      p.m.rotation.y = p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    });
    girls.forEach(function (g) {
      if (g.fixed) {
        g.m.position.y = Math.abs(Math.sin(et * 4.3 + g.m.position.x)) * 0.14;
        return;
      }
      g.x += g.dir * g.sp * dt;
      if (g.x > 58) g.dir = -1; if (g.x < -18) g.dir = 1;
      g.m.position.x = g.x;
      g.m.position.y = Math.abs(Math.sin(et * 5.5 + g.z)) * 0.045;
      g.m.rotation.y = g.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
    });
    kids.forEach(function (kd, i) {
      var a = et * 0.9 + kd.ph;
      kd.m.position.set(5.8 + Math.cos(a) * 1.6, Math.abs(Math.sin(et * 6 + i * 2)) * 0.22, 10.8 + Math.sin(a) * 1.2);
      kd.m.rotation.y = -a + Math.PI / 2;
    });
    // the cat
    if (cat.flee > 0) cat.flee -= dt;
    if (cat.wait > 0 && cat.flee <= 0) cat.wait -= dt;
    else {
      var cdx = cat.tx - cat.x, cdz = cat.tz - cat.z;
      var cd = Math.sqrt(cdx * cdx + cdz * cdz);
      if (cd < 0.15) {
        cat.wait = 2.5 + Math.random() * 5;
        if (night) { cat.tx = 15 + Math.random() * 5; cat.tz = 1.5 + Math.random() * 1.5; }
        else { cat.tx = 2 + Math.random() * 32; cat.tz = 2 + Math.random() * 11; }
      } else {
        var cs = (cat.flee > 0 ? 4.2 : 0.85) * dt;
        cat.x += cdx / cd * cs; cat.z += cdz / cd * cs;
        katz.rotation.y = Math.atan2(cdx, cdz) + Math.PI;
      }
    }
    katz.position.set(cat.x, 0, cat.z);
    tail.rotation.x = Math.sin(et * 2.6) * 0.4;
    // pigeons
    pigeons.forEach(function (pg2, pi3) {
      if (area === "yard" && mode === "walk") {
        var pdx = pg2.x - pos.x, pdz = pg2.z - pos.z;
        if (pdx * pdx + pdz * pdz < 2.6 && pg2.sc <= 0) {
          pg2.sc = 1.1;
          var pd = Math.sqrt(pdx * pdx + pdz * pdz) || 1;
          pg2.tx = pg2.x + pdx / pd * (4 + Math.random() * 3);
          pg2.tz = Math.max(2, Math.min(13.5, pg2.z + pdz / pd * (3 + Math.random() * 3)));
          if (Math.random() < 0.25) showCap("pigeons explode upward, deeply offended");
          AU.flutter();
        }
      }
      if (pg2.sc > 0) pg2.sc -= dt;
      if (pg2.wait > 0 && pg2.sc <= 0) pg2.wait -= dt;
      else {
        var tdx = pg2.tx - pg2.x, tdz = pg2.tz - pg2.z;
        var td = Math.sqrt(tdx * tdx + tdz * tdz);
        if (td < 0.1) {
          pg2.wait = 1.5 + Math.random() * 4;
          pg2.tx = 18 + Math.random() * 18; pg2.tz = 5 + Math.random() * 9;
        } else {
          var psv = (pg2.sc > 0 ? 5.5 : 0.55) * dt;
          pg2.x += tdx / td * psv; pg2.z += tdz / td * psv;
          pg2.m.rotation.y = Math.atan2(tdx, tdz) + Math.PI;
        }
      }
      pg2.m.position.set(pg2.x, pg2.sc > 0 ? Math.abs(Math.sin(et * 18 + pi3)) * 0.5 : 0, pg2.z);
      pg2.m.scale.y = pg2.sc > 0 ? 1 + Math.abs(Math.sin(et * 24)) * 0.6 : 1;
    });
    // streetlights at night
    lampLights.forEach(function (LL) { LL.intensity = night ? 0.85 : 0; });
    if (gO.visible) ltFlag.rotation.y = Math.sin(et * 2.2) * 0.35;
    if (gK.visible) { fjet.scale.y = 0.85 + Math.sin(et * 5) * 0.15; fjet.position.y = 0.55 + fjet.scale.y * 0.55; }
    if (gE.visible) {
      clubLights.forEach(function (L2, i) {
        L2.color.setHSL((et * 0.25 + i / 3) % 1, 1, 0.5);
        L2.intensity = 0.9 + 0.6 * Math.max(0, Math.sin(et * 13.6 + i));
      });
      dancers.forEach(function (d2, i) {
        d2.position.y = Math.abs(Math.sin(et * 4.3 + i * 1.7)) * 0.18;
        d2.rotation.y = Math.sin(et * 1.1 + i) * 0.5;
      });
    }

    if (mode === "wake") {
      wakeT += dt;
      var t = sm(Math.min(1, wakeT / 2));
      pos.x = 1.0 + 1.6 * t; pos.z = 1.0 + 1.4 * t; pitch = 1.3 * (1 - t);
      camera.position.set(pos.x, FY + 0.75 + 0.85 * t, pos.z);
      camera.rotation.set(pitch, yaw, 0);
      if (wakeT >= 2) {
        mode = "walk";
        say([{ t: days[dayIdx] + ", " + tStr() + ", 2026. Your head is a construction site. The flat smells of yesterday." },
          { t: "23.47 EUR to your name. Seven empties by the door. Election posters on every lamppost. The economy, baby." },
          { w: D, t: "Kava... no. Beer first. No — coffee. ...We'll see." }]);
      }
    } else if (mode === "drive") {
      var thr = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0) - joy.y;
      var st = (k.KeyA || k.ArrowLeft ? 1 : 0) - (k.KeyD || k.ArrowRight ? 1 : 0) - joy.x;
      spd += thr * 8 * dt; spd -= spd * 0.7 * dt;
      spd = Math.max(-4.5, Math.min(13.5, spd));
      carYaw += st * 1.5 * dt * Math.min(1, Math.abs(spd) / 4) * (spd < 0 ? -1 : 1);
      var cfx = -Math.sin(carYaw), cfz = -Math.cos(carYaw);
      var nx2 = car.position.x + cfx * spd * dt, nz2 = car.position.z + cfz * spd * dt;
      var hit = false;
      var dCols = area === "maxima" ? maxCols : area === "akro" ? akroCols :
        area === "old" ? oldCols : area === "pond" ? pondCols : yardCols;
      for (var ci = 0; ci < dCols.length; ci++) {
        var cc = dCols[ci];
        if (insideCol(cc, car.position.x, car.position.z, 1.4)) continue;
        if (insideCol(cc, nx2, nz2, 1.4)) { hit = true; break; }
      }
      var db = area === "maxima" ? { x0: MX - 28, x1: MX + 33, z0: -9.6, z1: 5.2 } :
        area === "akro" ? { x0: AX - 28, x1: AX + 41, z0: -9.6, z1: 5.2 } :
        area === "old" ? { x0: OX - 32, x1: OX + 42, z0: -13, z1: 29 } :
        area === "pond" ? { x0: PX - 39, x1: PX + 30, z0: -8, z1: 30 } :
        { x0: -27, x1: 86, z0: 2.6, z1: 69 };
      if (nx2 < db.x0 || nx2 > db.x1 || nz2 < db.z0 || nz2 > db.z1) hit = true;
      if (hit) { spd *= -0.25; AU.beep(120, 0.12, "square", 0.06); }
      else { car.position.x = nx2; car.position.z = nz2; }
      var exiting = false;
      if (area === "yard" && car.position.x > 82 && car.position.z > 15.5 && car.position.z < 23) {
        exiting = true; car.position.x = 81.7;
      } else if (area === "pond" && car.position.x < PX - 37 && car.position.z > 22 && car.position.z < 28) {
        exiting = true; car.position.x = PX - 36.7;
      } else if (area === "maxima" && car.position.x < MX - 26.5 && car.position.z < -5.4) {
        exiting = true; car.position.x = MX - 26.2;
      } else if (area === "akro" && car.position.x < AX - 26.5 && car.position.z < -5.4) {
        exiting = true; car.position.x = AX - 26.2;
      } else if (area === "old" && car.position.x < OX - 29.5 && car.position.z > 17 && car.position.z < 23.5) {
        exiting = true; car.position.x = OX - 29.2;
      }
      if (exiting) { spd = 0; AU.engineSet(0); showTravel(); }
      car.rotation.y = carYaw;
      AU.engineSet(spd);
      var lxo = -0.38, lzo = 0.2;
      camera.position.set(
        car.position.x + lxo * Math.cos(carYaw) + lzo * Math.sin(carYaw), 1.12,
        car.position.z - lxo * Math.sin(carYaw) + lzo * Math.cos(carYaw));
      camera.rotation.set(-0.04, carYaw + lookOff, Math.sin(et * 1.6) * 0.015 * bac);
      spdEl.textContent = Math.round(Math.abs(spd) * 3.6) + " km/h" + (Math.abs(spd) < 1.5 ? "  ·  [E] get out" : "");
    } else if (mode === "intro") {
      camera.position.set(1.0, FY + 0.75, 1.0);
      camera.rotation.set(1.3, yaw, 0);
    } else {
      if (mode === "walk") {
        var ix = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0) + joy.x;
        var iz = (k.KeyW ? 1 : 0) - (k.KeyS ? 1 : 0) - joy.y;
        var fx = -Math.sin(yaw), fz = -Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
        var sp = 3.4 * (hungover ? 0.72 : 1);
        slide((fx * iz + rx * ix) * sp * dt, (fz * iz + rz * ix) * sp * dt, curCols());
        if (area === "yard") { pos.x = Math.max(-28, Math.min(84, pos.x)); pos.z = Math.max(1.0, Math.min(70, pos.z)); }
        if (area === "flat") { pos.x = Math.max(-1.45, Math.min(7.9, pos.x)); pos.z = Math.max(0.12, Math.min(5.9, pos.z)); }
        if (area === "shop") { pos.x = Math.max(SX + 0.35, Math.min(SX + 9.65, pos.x)); pos.z = Math.max(0.35, Math.min(7.65, pos.z)); }
        if (area === "gym") { pos.x = Math.max(GX + 0.35, Math.min(GX + 13.65, pos.x)); pos.z = Math.max(0.35, Math.min(9.65, pos.z)); }
        if (area === "club") { pos.x = Math.max(NX + 0.35, Math.min(NX + 13.65, pos.x)); pos.z = Math.max(0.35, Math.min(9.65, pos.z)); }
        if (area === "pond") { pos.x = Math.max(PX - 39, Math.min(PX + 30, pos.x)); pos.z = Math.max(-8, Math.min(30, pos.z)); }
        if (area === "maxima") { pos.x = Math.max(MX - 28, Math.min(MX + 32, pos.x)); pos.z = Math.max(-9.6, Math.min(23.6, pos.z)); }
        if (area === "akro") { pos.x = Math.max(AX - 28, Math.min(AX + 40, pos.x)); pos.z = Math.max(-9.6, Math.min(27.6, pos.z)); }
        if (area === "old") {
          if (oldUp) { pos.x = Math.max(OX + 24, Math.min(OX + 30, pos.x)); pos.z = Math.max(6, Math.min(12.5, pos.z)); }
          else { pos.x = Math.max(OX - 31, Math.min(OX + 42, pos.x)); pos.z = Math.max(-13, Math.min(29, pos.z)); }
        }
      }
      if (mode === "smoke") {
        yaw += (smkYawT - yaw) * Math.min(1, dt * 2.2);
        pitch += (smkPitT - pitch) * Math.min(1, dt * 2.2);
        smkT += dt;
        var ds = [0.9, 2.5, 4.1], f = 0;
        for (var di = 0; di < 3; di++) {
          var u = (smkT - ds[di]) / 0.95;
          if (u > 0 && u < 1) f = Math.max(f, 1 - Math.abs(u * 2 - 1));
          if (smkT > ds[di] + 0.78 && !smkDragged[di]) { smkDragged[di] = true; spawnPuff(); }
        }
        var ff = sm(f);
        hand.position.lerpVectors(HAND_REST, HAND_MOUTH, ff);
        hand.position.x += Math.sin(et * 1.8) * 0.004;
        hand.position.y += Math.sin(et * 2.3) * 0.003;
        ember.scale.setScalar(1 + ff * 1.6);
        if (smkT >= 5.4) endSmoke();
      }
      if (mode === "fish") {
        yaw += (smkYawT - yaw) * Math.min(1, dt * 2.4);
        pitch += (smkPitT - pitch) * Math.min(1, dt * 2.4);
        if (fishSt === "wait") {
          fishT -= dt;
          rod.rotation.x = -1.0 + Math.sin(et * 0.8) * 0.02;
          if (fishT <= 0) {
            fishSt = "bite"; biteT = 0.95;
            AU.plop(); showCap("! ! !  something pulls  ! ! !");
          }
        } else if (fishSt === "bite") {
          biteT -= dt;
          rod.rotation.x = -1.32 + Math.sin(et * 22) * 0.05;
          if (biteT <= 0) { fishSt = "done"; fishResolve(false); }
        }
      }
      if (mode === "eat") {
        eatT += dt;
        var eds = [0.4, 1.4], ef = 0;
        for (var ei = 0; ei < 2; ei++) {
          var eu = (eatT - eds[ei]) / 0.8;
          if (eu > 0 && eu < 1) ef = Math.max(ef, 1 - Math.abs(eu * 2 - 1));
          if (eatT > eds[ei] + 0.4 && !eatBit[ei]) {
            eatBit[ei] = true;
            if (ITEMS[eatId].gulp) AU.gulp(); else AU.munch();
          }
        }
        hand2.position.lerpVectors(EAT_REST, EAT_MOUTH, sm(ef));
        hand2.rotation.x = sm(ef) * -0.5;
        if (eatT >= 2.5) endEat();
      }
      if (mode === "sit") {
        sitT += dt;
        yaw += (smkYawT - yaw) * Math.min(1, dt * 2.0);
        pitch += (smkPitT - pitch) * Math.min(1, dt * 2.0);
        if (sitT >= 6) {
          sitT = -1; mood = Math.min(100, mood + 6); addT(30);
          say([{ t: "You sit on the bench and let the Old Town happen around you: bells, pigeons, a tour group learning the word 'didingas'." },
            { t: "Half an hour passes without your permission. Mood, quietly, files a small gain." }]);
        }
      }
      if (cigRig.visible) {
        puffs.forEach(function (p2) {
          if (p2.userData.a <= 0) { p2.material.opacity = 0; return; }
          p2.userData.a -= dt * 0.45;
          p2.position.y += p2.userData.vy * dt;
          p2.position.x += p2.userData.vx * dt;
          p2.scale.multiplyScalar(1 + dt * 0.8);
          p2.material.opacity = Math.max(0, p2.userData.a) * 0.45;
        });
      }
      if (mode === "iid" && blowing && !iidLocked) {
        iidP += dt / 2.4;
        iidbar.style.width = Math.min(100, iidP * 100) + "%";
        if (Math.random() < dt * 8) AU.beep(740, 0.03, "sine", 0.02);
        if (iidP >= 1) { blowing = false; iidDone(); }
      }
      if (mode === "rep") {
        repPow -= dt * 0.45; repIdle += dt;
        if (repPow >= 1) {
          repN++; repPow = 0.3; AU.clank();
          repcount.textContent = "REPS: " + repN + " / 8";
          if (repN >= 8) finishRep(false);
        }
        if (repPow < 0) repPow = 0;
        repbar.style.width = Math.min(100, repPow * 100) + "%";
        if (repIdle > 4.5) finishRep(true);
      }
      if (mode === "dance") {
        danceT += dt;
        if (danceT >= 4.5) {
          mood = Math.min(100, mood + 8); addT(45);
          say([{ t: "The kick drum makes the decisions for a while. Nobody needs anything from you in here." },
            { t: "You dance like nobody's watching. Two girls are watching. They look concerned." }]);
        }
      }
      var moving = mode === "walk" && (Math.abs(joy.x) + Math.abs(joy.y) > 0.1 || k.KeyW || k.KeyA || k.KeyS || k.KeyD);
      var bobAmt = moving ? 0.035 : 0.008;
      var dr = Math.min(1.5, bac);
      var roll = Math.sin(et * 1.6) * 0.02 * dr + Math.sin(et * 0.9) * 0.012 * dr;
      var danceBob = mode === "dance" ? Math.sin(et * 8.7) * 0.12 : 0;
      var danceRoll = mode === "dance" ? Math.sin(et * 4.35) * 0.06 : 0;
      if (seated) {
        var sxo = -0.38, szo = 0.2;
        camera.position.set(
          car.position.x + sxo * Math.cos(carYaw) + szo * Math.sin(carYaw), 1.12,
          car.position.z - sxo * Math.sin(carYaw) + szo * Math.cos(carYaw));
        camera.rotation.set(-0.02, carYaw, Math.sin(et * 1.6) * 0.012 * dr);
      } else {
        camera.position.set(pos.x, baseY + 1.6 + Math.sin(et * 7) * bobAmt + Math.sin(et * 1.1) * 0.04 * dr + danceBob, pos.z);
        camera.rotation.set(pitch + Math.sin(et * 1.3) * 0.01 * bac, yaw, roll + danceRoll);
      }
    }
    findT(); hud();
    renderer.render(scene, camera);
  }
  hud();
  loop();
})();
