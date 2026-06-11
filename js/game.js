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
  var darkM = C(0x23262a), whiteM = C(0xdfe0d8), greyM = C(0x8d9094),
    redM = C(0x7c2a22), greenM = C(0x274d33), mercM = C(0x16301e),
    yellowM = C(0xc9a03f), blueM = C(0x2c4a6e);
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
  var gA = new THREE.Group(), gB = new THREE.Group(), gC = new THREE.Group(),
    gD = new THREE.Group(), gS = new THREE.Group();
  scene.add(gA); scene.add(gB); scene.add(gC); scene.add(gD); scene.add(gS);
  var flatCols = [], hallCols = [], yardCols = [], shopCols = [], gymCols = [];

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

  var FY = 12, WH = 2.7, WT = 0.15, HX = 20, HW = 2.2, SX = 200, GX = 300;

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
  function person(top, bottom, scarf, s) {
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
    var face = plane(p, B(faceT), 0.27 * s, 0.29 * s, 0, 1.4 * s, -0.135 * s, Math.PI);
    if (scarf) {
      box(p, C(scarf), -0.17 * s, 1.5 * s, -0.16 * s, 0.17 * s, 1.62 * s, 0.16 * s);
      box(p, C(scarf), -0.17 * s, 1.25 * s, 0.1 * s, 0.17 * s, 1.58 * s, 0.18 * s);
    } else {
      box(p, C(0x4a3520), -0.15 * s, 1.52 * s, -0.14 * s, 0.15 * s, 1.6 * s, 0.14 * s);
    }
    return p;
  }
  // neighbour babushka
  var npc = person(0x7a4040, 0x4a3450, 0xc9a03f, 1);
  npc.position.set(HX + 1.65, FY, 4.7); npc.rotation.y = Math.PI / 2; npc.visible = false; gA.add(npc);

  // ---------- SHARED: ground, tower, skyline ----------
  box(gS, grassM, -220, -0.12, -220, 320, 0, 320);
  var twr = new THREE.Group();
  function cyl(g, m, r0, r1, h, y, seg) {
    var c = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, h, seg || 10), m);
    c.position.y = y; g.add(c); return c;
  }
  cyl(twr, concM, 4, 9, 30, 15);
  cyl(twr, concM, 2.6, 3.6, 100, 80);
  cyl(twr, panelM2, 10, 7, 12, 118, 12);
  cyl(twr, concM, 3, 6, 8, 128);
  cyl(twr, greyM, 0.4, 1.2, 38, 150, 6);
  var tl = new THREE.Mesh(new THREE.SphereGeometry(1, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3a2a }));
  tl.position.y = 169; twr.add(tl);
  twr.position.set(-160, 0, 40); gS.add(twr);
  [[-80, -40, 30], [-70, 95, 28], [45, 130, 33], [130, 60, 24], [-130, 140, 30],
   [95, -55, 27], [170, 115, 30], [-40, 170, 33], [60, 180, 30], [150, 170, 26],
   [-110, 60, 24], [-150, -10, 30]].forEach(function (p) {
    box(gS, panelM, p[0] - 22, 0, p[1] - 6, p[0] + 22, p[2], p[1] + 6);
  });

  // ---------- THE YARD (Vilnius street level) ----------
  box(gS, asphM, -16, 0.005, 0.05, 52, 0.02, 14.8);
  box(gS, sideM, -26, 0.015, 14.8, 76, 0.035, 16.2);
  box(gS, roadM, -26, 0.005, 16.2, 76, 0.03, 22.2);
  box(gS, sideM, -26, 0.015, 22.2, 76, 0.035, 23.6);
  for (var dx0 = -24; dx0 < 76; dx0 += 6) box(gS, whiteM, dx0, 0.032, 19.05, dx0 + 2.6, 0.04, 19.35);
  for (var zx = 16.6; zx < 22; zx += 1.1) box(gS, whiteM, 11.5, 0.033, zx, 15.5, 0.042, zx + 0.55);

  solid(yardCols, gB, panelM, -14, -8, 50, 0.05, 0, 33);
  box(gB, woodM, 11.5, 0, 0.05, 12.9, 2.3, 0.14);
  box(gB, concM, 11, 2.4, 0, 13.4, 2.55, 1.5);
  plane(gB, B(textTex(96, 24, "#b9b4ab", "#4a3015", ["ARCHITEKTU G. 47"], 10)), 2.2, 0.5, 12.2, 2.85, 0.12, 0);
  plane(gB, B(textTex(96, 48, "#9aa39a", "#1e2a1e", ["BLOKAS", "2026"], 14)), 2.0, 1.0, 30, 1.6, 0.12, 0);
  // dumpsters
  solid(yardCols, gB, greenM, 15.9, 0.9, 17.5, 2.1, 0, 1.3);
  solid(yardCols, gB, greenM, 17.9, 0.9, 19.5, 2.1, 0, 1.3);
  // playground
  solid(yardCols, gB, greyM, 0.9, 10.4, 3.1, 11.6, 0, 0.1);
  box(gB, greyM, 0.95, 0, 10.9, 1.1, 2.1, 11.1); box(gB, greyM, 2.9, 0, 10.9, 3.05, 2.1, 11.1);
  box(gB, greyM, 0.95, 2.0, 10.85, 3.05, 2.12, 11.15);
  box(gB, darkM, 1.7, 0.5, 10.95, 2.3, 0.56, 11.05);
  box(gB, woodM, 4.5, 0, 9.5, 7.5, 0.25, 12.5);
  box(gB, yellowM, 4.7, 0.25, 9.7, 7.3, 0.3, 12.3);
  yardCols.push({ a: 4.5, b: 7.5, c: 9.5, d: 12.5 });
  // parked cars along the building
  function parkedCar(x, col) {
    var pc = new THREE.Group();
    box(pc, C(col), -2.1, 0.3, -0.85, 2.1, 0.75, 0.85);
    box(pc, C(col), -1.2, 0.75, -0.78, 0.9, 1.18, 0.78);
    box(pc, glassM, -1.1, 0.78, -0.74, 0.8, 1.12, 0.74);
    [[-1.4], [1.4]].forEach(function (w) {
      var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.74, 8), darkM);
      wh.rotation.x = Math.PI / 2; wh.position.set(w[0], 0.3, 0); pc.add(wh);
    });
    pc.position.set(x, 0, 3.4); gB.add(pc);
    yardCols.push({ a: x - 2.2, b: x + 2.2, c: 2.4, d: 4.4 });
  }
  parkedCar(21, 0x6e7076); parkedCar(27, 0x4a3550); parkedCar(33, 0x8a2c2c); parkedCar(44, 0xd8d6cc);
  // basketball court
  box(gB, courtM, 36, 0.025, 5, 46, 0.045, 13);
  cyl(gB, greyM, 0.1, 0.1, 3.4, 1.7, 6).position.set(41, 1.7, 5.5);
  box(gB, whiteM, 40.1, 2.9, 5.45, 41.9, 4.0, 5.55);
  var ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 6, 10), C(0xc96a2a));
  ring.rotation.x = Math.PI / 2; ring.position.set(41, 3.05, 5.95); gB.add(ring);
  yardCols.push({ a: 40.8, b: 41.2, c: 5.3, d: 5.7 });
  // billboard: elections 2026
  cyl(gB, greyM, 0.12, 0.12, 3.2, 1.6, 6).position.set(-8, 1.6, 24);
  cyl(gB, greyM, 0.12, 0.12, 3.2, 1.6, 6).position.set(-3, 1.6, 24);
  box(gB, B(textTex(256, 96, "#d8cfc0", "#7c2a22", ["PIRMYN, VILNIAU!", "SEIMO RINKIMAI 2026"], 18)), -8.6, 3.0, 23.9, -2.4, 5.2, 24.1);
  yardCols.push({ a: -8.4, b: -2.6, c: 23.8, d: 24.2 });
  // kiosk
  solid(yardCols, gB, C(0x3a5a4a), 20, 24, 23, 26.4, 0, 2.6);
  plane(gB, B(textTex(96, 24, "#1e3a2c", "#e0d8a0", ["SPAUDA"], 13)), 2.4, 0.55, 21.5, 2.2, 23.97, Math.PI);
  plane(gB, B(prodM.map), 1.8, 1.0, 21.5, 1.2, 23.98, Math.PI);
  // bus stop
  cyl(gB, greyM, 0.08, 0.08, 2.6, 1.3, 6).position.set(30.4, 1.3, 23.0);
  cyl(gB, greyM, 0.08, 0.08, 2.6, 1.3, 6).position.set(33.6, 1.3, 23.0);
  box(gB, greyM, 30, 2.5, 22.5, 34, 2.62, 23.5);
  box(gB, glassM, 30.1, 0.4, 23.35, 33.9, 2.5, 23.45);
  plane(gB, B(textTex(64, 32, "#2c4a6e", "#e9e6d8", ["16", "STOTELE"], 10)), 0.5, 0.4, 34.1, 2.0, 23.0, 0);
  yardCols.push({ a: 30, b: 34, c: 22.4, d: 23.6 });
  // trees
  [[-6, 9], [10, 12.5], [30, 11], [-12, 20.8], [50, 13], [-18, 12], [54, 24.5],
   [25, 24.6], [-14, 24.5], [62, 12]].forEach(function (p) {
    var tr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 2.6, 6), woodM);
    tr.position.set(p[0], 1.3, p[1]); gB.add(tr);
    var cn = new THREE.Mesh(new THREE.ConeGeometry(1.9, 4.2, 7), greenM);
    cn.position.set(p[0], 4.6, p[1]); gB.add(cn);
    yardCols.push({ a: p[0] - 0.4, b: p[0] + 0.4, c: p[1] - 0.4, d: p[1] + 0.4 });
  });
  // SHOP building
  solid(yardCols, gB, C(0xc9c4b8), -2, 26, 16, 36, 0, 5);
  box(gB, B(textTex(256, 48, "#c92c2c", "#f0ece0", ["PARDUOTUVE"], 26)), -1, 4.0, 25.85, 15, 5.0, 25.95);
  box(gB, B(textTex(256, 32, "#f0ece0", "#5a564c", ["ALUS · DUONA · TAROMATAS"], 14)), 1, 3.3, 25.88, 13, 3.8, 25.94);
  box(gB, glassM, -1, 0.4, 25.9, 5.8, 3.0, 26.0);
  box(gB, glassM, 8.2, 0.4, 25.9, 15, 3.0, 26.0);
  box(gB, C(0x4a5560), 6.3, 0, 25.88, 7.7, 2.6, 26.0);
  // GYM building
  solid(yardCols, gB, C(0x3a3c40), 30, 26, 48, 38, 0, 6);
  box(gB, B(textTex(256, 48, "#16181c", "#e0c33a", ['SPORTO KLUBAS "GELEZIS"'], 20)), 31, 4.6, 25.85, 47, 5.7, 25.95);
  box(gB, B(textTex(128, 64, "#2a2c30", "#8a8f96", ["KAINA:", "5 EUR / DIENA"], 13)), 36.6, 2.4, 25.88, 39.4, 3.6, 25.94);
  box(gB, C(0x6a4420), 38.3, 0, 25.88, 39.7, 2.6, 26.0);
  // graffiti on home block
  plane(gB, B(textTex(128, 48, "#b9b4ab", "#2c7a3a", ["BLOKAS '04"], 20)), 3.2, 1.2, 6, 1.3, 0.12, 0);
  // far rows of blocks
  solid(yardCols, gB, panelM, -22, 44, 2, 52, 0, 33);
  solid(yardCols, gB, panelM2, 8, 46, 28, 54, 0, 27);
  solid(yardCols, gB, panelM, 34, 48, 56, 56, 0, 33);
  solid(yardCols, gB, panelM2, 62, 44, 84, 52, 0, 30);
  solid(yardCols, gB, panelM, 56, 2, 70, 18, 0, 24);
  solid(yardCols, gB, panelM2, -32, 4, -22, 30, 0, 27);
  // washing lines
  for (var wl = 0; wl < 3; wl++) {
    box(gB, whiteM, 36 + wl * 1.5, 1.5, 1.0, 36.6 + wl * 1.5, 2.1, 1.05);
  }

  // ---------- THE MERCEDES ----------
  var car = new THREE.Group();
  box(car, mercM, -0.95, 0.3, -2.35, 0.95, 0.78, 2.35);
  box(car, mercM, -0.9, 0.78, -1.5, 0.9, 0.8, 0.95);
  box(car, glassM, -0.82, 0.78, -1.35, 0.82, 1.32, 0.85);
  box(car, mercM, -0.84, 1.3, -1.4, 0.84, 1.38, 0.9);
  box(car, greyM, -0.7, 0.45, -2.42, 0.7, 0.72, -2.34);
  box(car, new THREE.MeshBasicMaterial({ color: 0xf0e6b0 }), -0.88, 0.5, -2.4, -0.6, 0.66, -2.35);
  box(car, new THREE.MeshBasicMaterial({ color: 0xf0e6b0 }), 0.6, 0.5, -2.4, 0.88, 0.66, -2.35);
  box(car, redM, -0.85, 0.5, 2.34, 0.85, 0.64, 2.4);
  box(car, darkM, -0.8, 0.82, -1.32, 0.8, 1.0, -0.9);
  box(car, darkM, -0.5, 0.95, -1.28, -0.2, 1.12, -1.2);
  box(car, greenM, -0.05, 0.85, -1.1, 0.12, 1.0, -0.95);
  [[-0.85, -1.6], [0.85, -1.6], [-0.85, 1.55], [0.85, 1.55]].forEach(function (w) {
    var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.22, 8), darkM);
    wh.rotation.z = Math.PI / 2; wh.position.set(w[0], 0.34, w[1]); car.add(wh);
  });
  car.position.set(15.5, 0, 6.5); car.rotation.y = Math.PI / 2; gB.add(car);
  var carYaw = Math.PI / 2;

  // ---------- traffic + pedestrians + kids ----------
  var traffic = [];
  [[0x8a2c2c, 17.7, 1, -20, 9], [0x5a6a7c, 17.7, 1, 30, 8],
   [0xd8d6cc, 20.7, -1, 60, 10], [0x3a5a3a, 20.7, -1, 5, 8.5]].forEach(function (cf) {
    var g = new THREE.Group();
    box(g, C(cf[0]), -2.0, 0.3, -0.8, 2.0, 0.72, 0.8);
    box(g, C(cf[0]), -1.1, 0.72, -0.74, 0.85, 1.12, 0.74);
    box(g, glassM, -1.0, 0.75, -0.7, 0.75, 1.08, 0.7);
    g.position.set(cf[3], 0, cf[1]);
    g.rotation.y = cf[2] > 0 ? -Math.PI / 2 : Math.PI / 2;
    gB.add(g);
    traffic.push({ m: g, z: cf[1], dir: cf[2], x: cf[3], sp: cf[4] });
  });
  var peds = [];
  [[0x4a4a5a, 0x2c2c34, 15.4, -16, 1], [0x7a3a3a, 0x3a3a44, 22.95, 50, -1],
   [0x3a5a6a, 0x4a4438, 22.95, 10, 1]].forEach(function (pf) {
    var p = person(pf[0], pf[1], null, 0.95);
    p.position.set(pf[3], 0, pf[2]); gB.add(p);
    peds.push({ m: p, x: pf[3], z: pf[2], dir: pf[4], sp: 1 + Math.random() * 0.5 });
  });
  var kids = [];
  [[0xc9423a, 0x2c4a6e, 0], [0x3ac96a, 0x4a3550, Math.PI]].forEach(function (kf) {
    var kd = person(kf[0], kf[1], null, 0.55);
    gB.add(kd);
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
  // beer fridge
  solid(shopCols, gC, C(0x2c4a6e), SX, 2, SX + 0.7, 4.5, 0, 2.2);
  plane(gC, glassM, 2.3, 1.8, SX + 0.71, 1.1, 3.25, Math.PI / 2);
  plane(gC, B(textTex(96, 24, "#2c4a6e", "#e9e6d8", ["SVYTURYS -20%"], 10)), 2.0, 0.4, SX + 0.72, 2.0, 3.25, Math.PI / 2);
  // gondolas
  solid(shopCols, gC, prodM, SX + 2.5, 2.6, SX + 7.5, 3.4, 0, 1.8);
  solid(shopCols, gC, prodM, SX + 2.5, 5.0, SX + 7.5, 5.8, 0, 1.8);
  // counter + cashier
  solid(shopCols, gC, woodM, SX + 6.5, 0.8, SX + 9.5, 1.6, 0, 1.0);
  box(gC, prodM, SX + 7.0, 1.7, 7.0, SX + 9.5, 2.6, 7.4);
  solid(shopCols, gC, prodM, SX + 7.0, 7.0, SX + 9.5, 7.4, 0, 1.7);
  var cashier = person(0xc92c2c, 0x2c2c34, null, 1);
  cashier.position.set(SX + 8, 0, 2.3); cashier.rotation.y = 0; gC.add(cashier);
  // taromat
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
  // mirror wall with reflection
  plane(gD, C(0x9aa8b0), 6, 2.0, GX + 13.98, 1.6, 5, -Math.PI / 2);
  var gport = plane(gD, B(portT), 0.7, 0.9, GX + 13.96, 1.45, 5, -Math.PI / 2);
  // bench press
  solid(gymCols, gD, darkM, GX + 2.2, 5.4, GX + 3.8, 6.6, 0, 0.55);
  box(gD, greyM, GX + 2.3, 0, 5.0, GX + 2.5, 1.45, 5.2); box(gD, greyM, GX + 3.5, 0, 5.0, GX + 3.7, 1.45, 5.2);
  var bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), greyM);
  bar1.rotation.z = Math.PI / 2; bar1.position.set(GX + 3, 1.45, 5.1); gD.add(bar1);
  cyl(gD, darkM, 0.22, 0.22, 0.1, 0, 8).position.set(GX + 2.1, 1.45, 5.1);
  cyl(gD, darkM, 0.22, 0.22, 0.1, 0, 8).position.set(GX + 3.9, 1.45, 5.1);
  // lat pulldown
  solid(gymCols, gD, darkM, GX + 6.2, 7.0, GX + 7.8, 8.6, 0, 0.5);
  box(gD, greyM, GX + 6.9, 0, 8.4, GX + 7.1, 2.6, 8.6);
  box(gD, greyM, GX + 6.3, 2.4, 8.3, GX + 7.7, 2.55, 8.5);
  bar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3, 6), greyM);
  bar1.rotation.z = Math.PI / 2; bar1.position.set(GX + 7, 2.1, 8.2); gD.add(bar1);
  // treadmill
  solid(gymCols, gD, darkM, GX + 10.4, 2.2, GX + 11.4, 4.4, 0, 0.3);
  box(gD, greyM, GX + 10.45, 0.3, 2.2, GX + 10.6, 1.5, 2.4); box(gD, greyM, GX + 11.2, 0.3, 2.2, GX + 11.35, 1.5, 2.4);
  box(gD, darkM, GX + 10.45, 1.4, 2.15, GX + 11.35, 1.7, 2.35);
  // dumbbell rack
  solid(gymCols, gD, greyM, GX + 1, 0.5, GX + 5, 1.1, 0, 1.0);
  for (var db = 0; db < 6; db++) {
    cyl(gD, darkM, 0.12, 0.12, 0.3, 0, 6).position.set(GX + 1.4 + db * 0.6, 1.1, 0.8);
  }
  // gym bro
  var bro = person(0x16181c, 0x3a3c40, null, 1.18);
  bro.position.set(GX + 9.5, 0, 4.0); bro.rotation.y = Math.PI / 2; gD.add(bro);
  var lampG1 = new THREE.PointLight(0xf0f4ff, 0.9, 14); lampG1.position.set(GX + 4, 3.1, 5); gD.add(lampG1);
  var lampG2 = new THREE.PointLight(0xf0f4ff, 0.8, 14); lampG2.position.set(GX + 10, 3.1, 5); gD.add(lampG2);

  gB.visible = false; gC.visible = false; gD.visible = false;

  // ---------- state ----------
  var pos = new THREE.Vector3(1.0, 0, 1.0), yaw = -2.356, pitch = 1.3, baseY = FY,
    area = "flat", mode = "intro";
  var k = {}, joy = { x: 0, y: 0 };
  var gameMin = 13 * 60 + 47, dayIdx = 2, absMin = 0;
  var mood = 35, bac = 0, money = 23.47, cigs = 5, beersFridge = 2, empties = 7,
    drinkCount = 0, lockT = -999, gymPaid = false, pumped = {}, inCar = false,
    lookOff = 0, spd = 0, eCool = 0;
  var days = ["Pirmadienis", "Antradienis", "Treciadienis", "Ketvirtadienis", "Penktadienis", "Sestadienis", "Sekmadienis"];
  var D = "DZIUGAS", G = "PONIA GENOVAITE";

  function moodLbl() {
    return mood >= 75 ? "almost human" : mood >= 55 ? "okay-ish" : mood >= 38 ? "numb" : mood >= 20 ? "miserable" : "rock bottom";
  }
  function tStr() {
    var h = Math.floor(gameMin / 60) % 24, m = Math.floor(gameMin % 60);
    return (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") + m;
  }
  function hud() {
    hudL.innerHTML = days[dayIdx] + " &middot; 2026<br>" + tStr();
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
    ["A court-ordered breathalyser in a thirty-year-old Mercedes. Quite the look, Dziugai."]
  ], mirI = 0;
  var gmirP = [
    ["The pump is real. Briefly, you are statuesque. Then you remember rent."],
    ["You flex at the mirror. The mirror, a professional, does not laugh."]
  ], gmirI = 0;
  var smkP = [
    "The TV Tower. 326 metres of Soviet concrete. Tallest thing in the country.",
    "There's a restaurant at the top that spins. Full circle every 45 minutes. You can't afford the bread basket.",
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
     { w: D, t: "...I'll pass it on." }]
  ], nbrI = 0, nbrHere = false;

  // ---------- actions ----------
  function doLift() { say([{ t: "A handwritten note: 'NEVEIKIA'. Out of order since 2019. The note has yellowed. It is 2026." }]); }
  function doNbr() { var s = nbrP[nbrI % nbrP.length]; nbrI++; say(s, function () { mood = Math.min(100, mood + 3); }); }
  function doMirror() { var s = mirP[mirI % mirP.length]; mirI++; say(s.map(function (t) { return { t: t }; })); }
  function doGymMirror() { var s = gmirP[gmirI % gmirP.length]; gmirI++; say(s.map(function (t) { return { t: t }; })); }
  function doTV() {
    addT(14);
    say([{ t: "Panorama. Election season — a candidate promises to renovate every blokas by 2030. Yours wasn't renovated by 2020, 2024, or 2026. You switch it off." }]);
  }
  function doBeer() {
    if (beersFridge <= 0) {
      say([{ t: "Empty. The fridge hums, judgmental. The parduotuve across the road has more — and the taromat takes your empties." }]);
      return;
    }
    beersFridge--; empties++; drinkCount++;
    bac = Math.min(2.4, bac + 0.35); mood = Math.min(100, mood + 6); addT(5);
    AU.beep(620, 0.06, "square", 0.04);
    var t = drinkCount === 1 ? "Svyturys for breakfast. The Lithuanian food pyramid." :
      drinkCount === 2 ? "The flat already looks softer around the edges." : "The room tilts, agreeably.";
    var L = [{ t: t }];
    if (bac > 0.6) L.push({ t: "Somewhere downstairs, the IID is judging you in advance." });
    say(L);
  }
  function doSleep() {
    fade(function () {
      var h = Math.floor(gameMin / 60);
      gymPaid = false; pumped = {}; drinkCount = 0;
      if (h >= 17 || h < 5) {
        addT(((24 - h) + 9) * 60 - (gameMin % 60) + 12);
        bac = 0; mood = Math.min(100, mood + 12);
        say([{ t: "09:12. The ceiling again. At least the headache is new." }]);
      } else {
        addT(180); bac = Math.max(0, bac - 0.5); mood = Math.min(100, mood + 6);
        say([{ t: "You nap like a man avoiding something. Because you are." }]);
      }
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
    var dx = twr.position.x - pos.x, dz = twr.position.z - pos.z;
    smkYawT = Math.atan2(-dx, -dz); smkPitT = 0.18;
    setTimeout(function () {
      var i = Math.floor(Math.random() * smkP.length), j = (i + 1) % smkP.length;
      vig.style.opacity = 0; addT(7); mood = Math.min(100, mood + 4);
      say([{ t: smkP[i] }, { t: smkP[j] }]);
    }, 2600);
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
    say([{ t: "Lottery tickets, gum, three newspapers arguing about the 2026 elections. The kiosk lady watches you not buy anything, again." }]);
  }
  function doBusStop() {
    addT(6);
    say([{ t: "The board says the 16 is due in 4 minutes. Lithuanian minutes. You give up after six of them." }]);
  }
  // shop actions
  function buyBeer() {
    if (money < 1.4) { say([{ t: "Card declined energy. You have " + money.toFixed(2) + " EUR and the can costs 1.40." }]); return; }
    money -= 1.4; beersFridge++; addT(2); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "One Svyturys for the fridge. For later. 'Later.'" }]);
  }
  function buyCigs() {
    if (money < 4.5) { say([{ t: "4.50 for a pack of Klaipeda. You have " + money.toFixed(2) + ". The lungs win this round by default." }]); return; }
    money -= 4.5; cigs += 20; addT(2); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "A fresh pack of Klaipeda. Twenty small appointments with the balcony." }]);
  }
  function buyKebab() {
    if (money < 3) { say([{ t: "Kebabas: 3.00. You: " + money.toFixed(2) + ". Tragedy in one act." }]); return; }
    money -= 3; mood = Math.min(100, mood + 7); addT(6); AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "Kebabas su viskuo. For ninety seconds, life is uncomplicated." }]);
  }
  function doTaromat() {
    if (empties <= 0) { say([{ t: "The taromat waits, green and patient. You have nothing to feed it. A rare feeling: the machine has more than you." }]); return; }
    var got = empties * 0.1; money += got; addT(3);
    for (var i = 0; i < Math.min(empties, 6); i++) AU.beep(880 - i * 40, 0.08, "sine", 0.03);
    var n = empties; empties = 0;
    say([{ t: "The taromat sings its one happy note " + n + " times as it eats each bottle. +" + got.toFixed(2) + " EUR. Honest money." }]);
  }
  function doCashier() {
    say([{ w: "KASININKE", t: "Vel tu." }, { w: D, t: "Vel as." },
      { w: "KASININKE", t: "She scans your future without looking up. Beep." }]);
  }
  function doBro() {
    say([{ w: "BROLIS", t: "Kiek spaudi, broli?" }, { w: D, t: "...simta." },
      { w: "BROLIS", t: "He nods, unconvinced, and racks another twenty kilos." }]);
  }

  // ---------- transitions ----------
  function setWorld(a) {
    gA.visible = (a === "flat" || a === "hall");
    gB.visible = (a === "yard");
    gC.visible = (a === "shop");
    gD.visible = (a === "gym");
  }
  function toHall() {
    fade(function () {
      area = "hall"; pos.set(HX + 1.0, 0, 2.7); baseY = FY; yaw = -Math.PI / 2; pitch = 0;
      nbrHere = Math.random() < 0.55; npc.visible = nbrHere; setWorld(area); mode = "walk";
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
      nbrHere = Math.random() < 0.55; npc.visible = nbrHere; setWorld(area); mode = "walk";
    });
  }
  function toShop() {
    fade(function () { area = "shop"; pos.set(SX + 5, 0, 1.2); baseY = 0; yaw = Math.PI; pitch = 0; setWorld(area); mode = "walk"; });
  }
  function exitShop() { toYard(7, 24.4, 0); }
  function toGym() {
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
  function exitGym() { toYard(39, 24.4, 0); }

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
  $("pcLol").onclick = function () { pcmenu.style.display = "none"; pclg.style.display = "block"; runMatch(); };
  var lolIv = null;
  function runMatch() {
    pclog.innerHTML = ""; pcbtns.style.display = "none";
    var win = Math.random() < 0.25;
    var L = ["CONNECTING TO EUNE...", "Queue accepted. Estimated wait: 0:42",
      "Match found. You lock in Yasuo mid. Someone in champ select sighs audibly.",
      "Minute 8 — you are 0/3. Your jungler pings '?' on your corpse fourteen times.",
      "Minute 19 — you steal Baron with last-hit luck. Chat erupts. Mostly at you."];
    if (win) L.push("Minute 31 — the enemy mid disconnects. You will take it.", "VICTORY  +21 LP",
      "You feel something almost like joy. It is small and it is yours.");
    else L.push("Minute 27 — open mid. The nexus explodes in 4K at 12 frames per second.",
      "DEFEAT  -18 LP", "'gg go next', types the jungler, queueing instantly.");
    var i = 0;
    if (lolIv) clearInterval(lolIv);
    lolIv = setInterval(function () {
      if (mode !== "pc") { clearInterval(lolIv); return; }
      var d = document.createElement("div");
      d.textContent = "> " + L[i];
      if (L[i].indexOf("VICTORY") === 0) d.style.color = "#7fe08a";
      if (L[i].indexOf("DEFEAT") === 0) d.style.color = "#e08a7f";
      pclog.appendChild(d);
      AU.beep(300 + Math.random() * 200, 0.04, "square", 0.02);
      i++;
      if (i >= L.length) {
        clearInterval(lolIv);
        addT(38); mood = Math.max(0, Math.min(100, mood + (win ? 9 : -7))); hud();
        pcbtns.style.display = "block";
      }
    }, 700);
  }
  $("pcQ").onclick = function () { runMatch(); };
  $("pcX").onclick = function () { pcmenu.style.display = "flex"; pclg.style.display = "none"; };

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
    if (absMin < lockT) {
      say([{ t: "The interlock display blinks: UZBLOKUOTA — " + Math.ceil(lockT - absMin) + " min. The Mercedes is not speaking to you right now." }]);
      return;
    }
    mode = "iid"; unlockPtr(); iidP = 0; blowing = false;
    iidbar.style.width = "0%";
    iidtxt.innerHTML = "P&Umacr;SKITE / BLOW<br>hold SPACE or the button";
    iidEl.style.display = "flex";
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
          say([{ t: "The OM602 diesel clatters to life like an old dog getting up. The only thing in your life that still runs properly." }],
            startDrive);
        }, 900);
      } else {
        iidtxt.innerHTML = "<span style='color:#e08a7f'>NEPRAEJO · " + bac.toFixed(2) + "&permil;<br>UZBLOKUOTA 45 MIN</span>";
        AU.beep(220, 0.18, "square", 0.07);
        setTimeout(function () { AU.beep(220, 0.18, "square", 0.07); }, 250);
        lockT = absMin + 45; mood = Math.max(0, mood - 5);
        setTimeout(function () {
          iidEl.style.display = "none";
          say([{ w: D, t: "Negaliu... come on." },
            { t: "The Mercedes knows. The Mercedes always knows. Across the yard, a curtain twitches." }]);
        }, 1400);
      }
    }, 1500);
  }
  $("iidx").onclick = function () { iidEl.style.display = "none"; mode = "walk"; };
  $("blow").addEventListener("pointerdown", function (e) { e.preventDefault(); blowing = true; });
  window.addEventListener("pointerup", function () { blowing = false; });

  function startDrive() {
    mode = "drive"; spd = 0; lookOff = 0; spdEl.style.display = "block";
    say([{ t: "Mirror. Signal. The IID hums on the dash like a parole officer. Drive carefully — half the yard is watching." }]);
  }
  function exitCar() {
    if (Math.abs(spd) > 1.5) return;
    AU.engineOff(); inCar = false; spdEl.style.display = "none";
    pos.set(car.position.x - Math.cos(carYaw) * 1.8, 0, car.position.z + Math.sin(carYaw) * 1.8);
    pos.x = Math.max(-28, Math.min(74, pos.x));
    pos.z = Math.max(1.0, Math.min(64, pos.z));
    yaw = carYaw; mode = "walk";
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
  function repPress() {
    repPow = Math.min(1.05, repPow + 0.22); repIdle = 0;
  }
  function finishRep(quit) {
    repEl.style.display = "none";
    if (quit) { say([{ t: "You rack it halfway through the set. The machine sighs. So does the bro by the dumbbells." }]); return; }
    var first = !pumped[repKey];
    pumped[repKey] = true;
    mood = Math.min(100, mood + (first ? 9 : 3));
    addT(12); AU.clank();
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
    return [
      { ar: "flat", x: 1.3, z: 1.2, r: 1.6, l: "Sleep", f: doSleep },
      { ar: "flat", x: 5.2, z: 1.0, r: 1.5, l: "Sit at the PC", f: openPC },
      { ar: "flat", x: 0.65, z: 5.45, r: 1.5, l: "Fridge — Svyturys x" + beersFridge, f: doBeer },
      { ar: "flat", x: 3.25, z: 0.6, r: 1.4, l: "Watch TV", f: doTV },
      { ar: "flat", x: 7.6, z: 4.85, r: 1.3, l: "Look in the mirror", f: doMirror },
      { ar: "flat", x: 7.9, z: 2.7, r: 1.5, l: "Leave the flat", f: toHall },
      { ar: "flat", x: -1.3, z: 3.9, r: 1.4, l: "Smoke a cigarette (" + cigs + " left)", f: doSmoke },
      { ar: "hall", x: HX + 0.1, z: 2.7, r: 1.4, l: "Go back inside", f: toFlat },
      { ar: "hall", x: HX + 1.1, z: 7.8, r: 1.5, l: "Take the stairs down", f: function () { toYard(12.2, 2.0, Math.PI); } },
      { ar: "hall", x: HX + HW - 0.1, z: 6.45, r: 1.3, l: "Call the lift", f: doLift },
      { ar: "hall", x: HX + 1.65, z: 4.7, r: 1.7, l: "Talk to ponia Genovaite", f: doNbr, c: function () { return nbrHere; } },
      { ar: "yard", x: 12.2, z: 1.4, r: 1.8, l: "Go back up", f: toHallUp },
      { ar: "yard", x: car.position.x, z: car.position.z, r: 2.8, l: "Get in the Mercedes", f: enterCar },
      { ar: "yard", x: 7, z: 25.6, r: 2.0, l: "Enter the parduotuve", f: toShop },
      { ar: "yard", x: 39, z: 25.6, r: 2.0, l: "Enter Gelezis gym — 5 EUR/day", f: toGym },
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
      { ar: "gym", x: GX + 7, z: 0.5, r: 1.5, l: "Leave the gym", f: exitGym }
    ];
  }

  // ---------- movement / collision ----------
  function slide(dx, dz, cols) {
    var r = 0.32, i, c;
    var nx2 = pos.x + dx, hit = false;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      if (nx2 > c.a - r && nx2 < c.b + r && pos.z > c.c - r && pos.z < c.d + r) { hit = true; break; }
    }
    if (!hit) pos.x = nx2;
    var nz2 = pos.z + dz; hit = false;
    for (i = 0; i < cols.length; i++) {
      c = cols[i];
      if (pos.x > c.a - r && pos.x < c.b + r && nz2 > c.c - r && nz2 < c.d + r) { hit = true; break; }
    }
    if (!hit) pos.z = nz2;
  }
  function curCols() {
    if (area === "flat") return flatCols;
    if (area === "hall") return hallCols;
    if (area === "shop") return shopCols;
    if (area === "gym") return gymCols;
    var c = yardCols.slice();
    if (!inCar) c.push({ a: car.position.x - 2.2, b: car.position.x + 2.2, c: car.position.z - 2.2, d: car.position.z + 2.2 });
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
  if (TOUCH) { joyEl.style.display = "block"; $("btnE").style.display = "block"; }
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
    if (mode === "intro") { begin(); return; }
    k[e.code] = true;
    if (e.code === "Space" && mode === "iid") blowing = true;
    if ((e.code === "KeyE" || e.code === "Enter" || e.code === "Space") && !e.repeat) {
      if (mode === "dialog") nx(); else pressE();
    }
    if (e.code === "Escape") {
      if (mode === "pc") $("pcOff").onclick();
      else if (mode === "call") endCall(false);
      else if (mode === "rep") finishRep(true);
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
    var dl = (h >= 6 && h < 22) ? 1 : 0.28;
    hemi.intensity = 0.95 * dl; sun.intensity = 0.5 * dl;
    tmpC.copy(nightC).lerp(dayC, dl);
    scene.background = tmpC; scene.fog.color.copy(tmpC);

    AU.setEnv(area === "yard" || mode === "drive" ? "out" :
      area === "gym" ? "gym" : area === "shop" ? "shop" :
      (area === "flat" && pos.x < 0) ? "out" : "in");

    // traffic, peds, kids
    if (gB.visible) {
      traffic.forEach(function (c) {
        c.x += c.dir * c.sp * dt;
        if (c.x > 110) c.x = -70; if (c.x < -70) c.x = 110;
        c.m.position.x = c.x;
        var px = mode === "drive" ? car.position.x : pos.x;
        var pz = mode === "drive" ? car.position.z : pos.z;
        if (Math.abs(c.x - px) < 4 && Math.abs(c.z - pz) < 2.2 && Math.random() < dt * 1.5)
          AU.beep(420, 0.25, "square", 0.04);
      });
      peds.forEach(function (p) {
        p.x += p.dir * p.sp * dt;
        if (p.x > 58) p.dir = -1; if (p.x < -18) p.dir = 1;
        p.m.position.x = p.x;
        p.m.position.y = Math.abs(Math.sin(et * 5 + p.z)) * 0.04;
        p.m.rotation.y = p.dir > 0 ? -Math.PI / 2 : Math.PI / 2;
      });
      kids.forEach(function (kd, i) {
        var a = et * 0.9 + kd.ph;
        kd.m.position.set(5.8 + Math.cos(a) * 1.6, Math.abs(Math.sin(et * 6 + i * 2)) * 0.22, 10.8 + Math.sin(a) * 1.2);
        kd.m.rotation.y = -a + Math.PI / 2;
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
      for (var ci = 0; ci < yardCols.length; ci++) {
        var cc = yardCols[ci];
        if (nx2 > cc.a - 1.4 && nx2 < cc.b + 1.4 && nz2 > cc.c - 1.4 && nz2 < cc.d + 1.4) { hit = true; break; }
      }
      if (nx2 < -27 || nx2 > 73 || nz2 < 2.6 || nz2 > 63) hit = true;
      if (hit) { spd *= -0.25; AU.beep(120, 0.12, "square", 0.06); }
      else { car.position.x = nx2; car.position.z = nz2; }
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
        var sp = 3.4;
        slide((fx * iz + rx * ix) * sp * dt, (fz * iz + rz * ix) * sp * dt, curCols());
        if (area === "yard") { pos.x = Math.max(-28, Math.min(74, pos.x)); pos.z = Math.max(1.0, Math.min(64, pos.z)); }
        if (area === "flat") { pos.x = Math.max(-1.45, Math.min(7.9, pos.x)); pos.z = Math.max(0.12, Math.min(5.9, pos.z)); }
        if (area === "shop") { pos.x = Math.max(SX + 0.35, Math.min(SX + 9.65, pos.x)); pos.z = Math.max(0.35, Math.min(7.65, pos.z)); }
        if (area === "gym") { pos.x = Math.max(GX + 0.35, Math.min(GX + 13.65, pos.x)); pos.z = Math.max(0.35, Math.min(9.65, pos.z)); }
      }
      if (mode === "smoke") {
        yaw += (smkYawT - yaw) * Math.min(1, dt * 2.2);
        pitch += (smkPitT - pitch) * Math.min(1, dt * 2.2);
      }
      if (mode === "iid" && blowing) {
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
      var moving = mode === "walk" && (Math.abs(joy.x) + Math.abs(joy.y) > 0.1 || k.KeyW || k.KeyA || k.KeyS || k.KeyD);
      var bobAmt = moving ? 0.035 : 0.008;
      var dr = Math.min(1.5, bac);
      var roll = Math.sin(et * 1.6) * 0.02 * dr + Math.sin(et * 0.9) * 0.012 * dr;
      camera.position.set(pos.x, baseY + 1.6 + Math.sin(et * 7) * bobAmt + Math.sin(et * 1.1) * 0.04 * dr, pos.z);
      camera.rotation.set(pitch + Math.sin(et * 1.3) * 0.01 * bac, yaw, roll);
    }
    findT(); hud();
    renderer.render(scene, camera);
  }
  hud();
  loop();
})();
