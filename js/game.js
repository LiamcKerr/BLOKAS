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
    gD = new THREE.Group(), gE = new THREE.Group(), gS = new THREE.Group();
  scene.add(gA); scene.add(gB); scene.add(gC); scene.add(gD); scene.add(gE); scene.add(gS);
  var flatCols = [], hallCols = [], yardCols = [], shopCols = [], gymCols = [], clubCols = [];

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
  box(gS, roadM, -26, 0.005, 16.2, 86, 0.03, 22.2);
  box(gS, sideM, -26, 0.015, 22.2, 86, 0.035, 23.6);
  for (var dx0 = -24; dx0 < 86; dx0 += 6) box(gS, whiteM, dx0, 0.032, 19.05, dx0 + 2.6, 0.04, 19.35);
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
  // parked cars by the building
  function parkedCar(x, z, col) {
    var pc = new THREE.Group();
    box(pc, C(col), -2.1, 0.3, -0.85, 2.1, 0.75, 0.85);
    box(pc, C(col), -1.2, 0.75, -0.78, 0.9, 1.18, 0.78);
    box(pc, glassM, -1.1, 0.78, -0.74, 0.8, 1.12, 0.74);
    [-1.4, 1.4].forEach(function (w) {
      var wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.74, 8), darkM);
      wh.rotation.x = Math.PI / 2; wh.position.set(w, 0.3, 0); pc.add(wh);
    });
    pc.position.set(x, 0, z); gS.add(pc);
    yardCols.push({ a: x - 2.2, b: x + 2.2, c: z - 1.0, d: z + 1.0 });
    return pc;
  }
  parkedCar(21, 3.4, 0x6e7076); parkedCar(27, 3.4, 0x4a3550); parkedCar(33, 3.4, 0x8a2c2c);
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
    var c2 = parkedCar(pp[0], pp[1], pp[2]); c2.rotation.y = Math.PI / 2;
    yardCols.pop();
    yardCols.push({ a: pp[0] - 1.0, b: pp[0] + 1.0, c: pp[1] - 2.2, d: pp[1] + 2.2 });
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
  solid(yardCols, gS, panelM, 78, 2, 92, 18, 0, 24);
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
  car.position.set(15.5, 0, 6.5); car.rotation.y = Math.PI / 2; gS.add(car);
  var carYaw = Math.PI / 2;

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
    var g = new THREE.Group();
    box(g, C(cf[0]), -2.0, 0.3, -0.8, 2.0, 0.72, 0.8);
    box(g, C(cf[0]), -1.1, 0.72, -0.74, 0.85, 1.12, 0.74);
    box(g, glassM, -1.0, 0.75, -0.7, 0.75, 1.08, 0.7);
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
  var clubLights = [];
  for (var cl = 0; cl < 3; cl++) {
    var L2 = new THREE.PointLight(0xff44cc, 1.2, 16);
    L2.position.set(NX + 3.5 + cl * 3.5, 3.0, 5); gE.add(L2); clubLights.push(L2);
  }

  gB.visible = false; gC.visible = false; gD.visible = false; gE.visible = false;

  // ---------- state ----------
  var pos = new THREE.Vector3(1.0, 0, 1.0), yaw = -2.356, pitch = 1.3, baseY = FY,
    area = "flat", mode = "intro";
  var k = {}, joy = { x: 0, y: 0 };
  var gameMin = 13 * 60 + 47, dayIdx = 2, absMin = 0;
  var mood = 35, bac = 0, money = 23.47, cigs = 5, beersFridge = 2, empties = 7,
    drinkCount = 0, lockT = -999, gymPaid = false, clubPaid = false, pumped = {}, inCar = false,
    lookOff = 0, spd = 0, eCool = 0, danceT = 0;
  var seated = false, iidLocked = false, hungover = false;
  var raining = Math.random() < 0.35, lastDay = -1, prevRainOut = false;
  var mamaPending = true, nextMama = 0, lastBuzz = -99, mamaI = 0, phoneI = 0;
  var radioOn = true, radI = 0, nbrMet = false;
  var smkT = 0, smkDragged = [false, false, false];
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
     { w: D, t: "...I'll pass it on." }]
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
     { w: P, t: "The future is cruel and German." }]
  ], petI = 0;

  // ---------- actions ----------
  function doLift() { say([{ t: "A handwritten note: 'NEVEIKIA'. Out of order since 2019. The note has yellowed. It is 2026." }]); }
  function doNbr() { var s = nbrP[nbrI % nbrP.length]; nbrI++; say(s, function () { mood = Math.min(100, mood + 3); }); }
  function doMirror() { var s = mirP[mirI % mirP.length]; mirI++; say(s.map(function (t) { return { t: t }; })); }
  function doGymMirror() { var s = gmirP[gmirI % gmirP.length]; gmirI++; say(s.map(function (t) { return { t: t }; })); }
  function doGirl() {
    mood = Math.max(0, mood - 2);
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
    say([{ w: "APSAUGA", t: "..." },
      { t: "He communicates entirely in centimetres of raised eyebrow. Today: one centimetre. It means no." }]);
  }
  function doTV() {
    addT(14);
    say([{ t: "Panorama. Election season — a candidate promises to renovate every blokas by 2030. Yours wasn't renovated by 2020, 2024, or 2026. You switch it off." }]);
  }
  function doBeer() {
    if (beersFridge <= 0) {
      say([{ t: "Empty. The fridge hums, judgmental. The parduotuve across the car park has more — and the taromat takes your empties." }]);
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
      var h = Math.floor(gameMin / 60), b0 = bac;
      gymPaid = false; clubPaid = false; pumped = {}; drinkCount = 0;
      if (h >= 17 || h < 5) {
        addT(((24 - h) + 9) * 60 - (gameMin % 60) + 12);
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
    say([{ t: "Lottery tickets, gum, three newspapers arguing about the 2026 elections. The kiosk lady watches you not buy anything, again." }]);
  }
  function doBusStop() {
    addT(6);
    say([{ t: "The board says the 16 is due in 4 minutes. Lithuanian minutes. You give up after six of them." }]);
  }
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
  function buyClubBeer() {
    if (money < 4) { say([{ t: "Club prices: 4.00 for the same Svyturys that costs 1.40 across the car park. You have " + money.toFixed(2) + "." }]); return; }
    money -= 4; drinkCount++; bac = Math.min(2.4, bac + 0.35); mood = Math.min(100, mood + 5);
    AU.beep(1320, 0.07, "sine", 0.03);
    say([{ t: "Four euro. The barman keeps the can, the can keeps its deposit. Everyone here is losing money except the kick drum." }]);
  }
  function doDJ() {
    say([{ w: "DJ", t: "..." },
      { t: "He lifts one headphone, hears nothing you say over the techno, nods gravely, and drops the same track again." }]);
  }
  function doDance() {
    mode = "dance"; danceT = 0;
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
    gS.visible = (a !== "shop" && a !== "gym" && a !== "club");
  }
  function toHall() {
    fade(function () {
      area = "hall"; pos.set(HX + 1.0, 0, 2.7); baseY = FY; yaw = -Math.PI / 2; pitch = 0;
      nbrHere = !nbrMet || Math.random() < 0.65;
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
      nbrHere = !nbrMet || Math.random() < 0.65;
      if (nbrHere) nbrMet = true;
      npc.visible = nbrHere; setWorld(area); mode = "walk";
      if (nbrHere) say([{ w: G, t: "Dziugas! Vaikeli! Come here a minute—" }]);
    });
  }
  function toShop() {
    fade(function () { area = "shop"; pos.set(SX + 5, 0, 1.2); baseY = 0; yaw = Math.PI; pitch = 0; setWorld(area); mode = "walk"; });
  }
  function exitShop() { toYard(5, 42.6, 0); }
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
  function mapStart(win) {
    mst = { t: 0, win: win, mn: [], fl: [], sp: 0, end: 0, px: 48, py: 48 };
    if (mapIv) clearInterval(mapIv);
    mapIv = setInterval(drawMap, 60);
  }
  function mapEvent(kind) {
    if (!mst) return;
    if (kind === "death") mst.fl.push({ x: mst.px, y: mst.py, t: 1.2, c: "#e05548" });
    if (kind === "baron") mst.fl.push({ x: 30, y: 28, t: 1.6, c: "#b06ae0" });
    if (kind === "end") mst.end = 0.01;
  }
  function drawMap() {
    if (mode !== "pc") { clearInterval(mapIv); mapIv = null; return; }
    if (!mst) return;
    var g = mctx; mst.t += 0.06;
    g.fillStyle = "#16321e"; g.fillRect(0, 0, 96, 96);
    g.strokeStyle = "#23506e"; g.lineWidth = 9;
    g.beginPath(); g.moveTo(0, 0); g.lineTo(96, 96); g.stroke();
    g.strokeStyle = "#2c5a34"; g.lineWidth = 6;
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
    // the player, feeding in mid
    var pp = 0.32 + 0.16 * Math.sin(mst.t * 0.45) + 0.04 * Math.sin(mst.t * 2.3);
    var pxy = laneP(1, Math.max(0.05, Math.min(0.9, pp)));
    mst.px = pxy[0]; mst.py = pxy[1];
    if ((mst.t * 4 | 0) % 2 === 0) {
      g.fillStyle = "#ffd34a"; g.fillRect(pxy[0] - 1.5, pxy[1] - 1.5, 3, 3);
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

  var lolIv = null;
  function runMatch() {
    pclog.innerHTML = ""; pcbtns.style.display = "none";
    var win = Math.random() < 0.25;
    mapStart(win);
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
      if (i === 3) {
        mapEvent("death");
        setTimeout(function () { mapEvent("death"); }, 220);
        setTimeout(function () { mapEvent("death"); }, 440);
      }
      if (i === 4) mapEvent("baron");
      if (L[i].indexOf("VICTORY") === 0 || L[i].indexOf("DEFEAT") === 0) mapEvent("end");
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
    pos.x = Math.max(-28, Math.min(84, pos.x));
    pos.z = Math.max(1.0, Math.min(70, pos.z));
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
          say([{ t: "The V6 wakes with a smooth, expensive hum. 2010 E 350 4MATIC — the last grown-up decision you ever made." }],
            startDrive);
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
    if (radioOn) radioCap();
    say([{ t: "Mirror. Signal. The IID hums on the dash like a parole officer. Drive carefully — half the yard is watching. [R] radio" }]);
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
    var arr = [
      { ar: "flat", x: 1.3, z: 1.2, r: 1.6, l: "Sleep", f: doSleep },
      { ar: "flat", x: 5.2, z: 1.0, r: 1.5, l: "Sit at the PC", f: openPC },
      { ar: "flat", x: 0.65, z: 5.45, r: 1.5, l: "Fridge — Svyturys x" + beersFridge, f: doBeer },
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
      { ar: "yard", x: car.position.x, z: car.position.z, r: 2.8, l: "Get in the E 350", f: enterCar },
      { ar: "yard", x: katz.position.x, z: katz.position.z, r: 1.5, l: "Pet the cat", f: doCat },
      { ar: "yard", x: 7.2, z: 1.6, r: 1.8, l: "Talk to Petras", f: doPetras },
      { ar: "yard", x: 5, z: 43.4, r: 2.0, l: "Enter the parduotuve", f: toShop },
      { ar: "yard", x: 39, z: 43.4, r: 2.0, l: "Enter Gelezis gym — 5 EUR/day", f: toGym },
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
      { ar: "club", x: NX + 7, z: 0.6, r: 1.5, l: "Leave the club", f: exitClub }
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
    if (e.code === "KeyR" && mode === "drive" && !e.repeat) {
      radioOn = !radioOn;
      if (radioOn) radioCap(); else showCap("radio off. just the V6 and your thoughts. mostly the V6.");
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

  // ---------- club music ----------
  var clubA = new Audio("assets/club.ogg");
  clubA.loop = true;

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
    var outdoors = (area === "yard" || mode === "drive" || (area === "flat" && pos.x < 0));
    if (raining && outdoors !== prevRainOut && outdoors) showCap("rain needles the courtyard, soft static on everything");
    prevRainOut = outdoors;
    AU.setRain(raining ? (outdoors ? 0.022 : area === "club" ? 0.001 : 0.007) : 0);
    AU.radioGain(mode === "drive" && radioOn ? 0.035 : 0);
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
    AU.setEnv(area === "yard" || mode === "drive" ? "out" :
      area === "gym" ? "gym" : area === "shop" ? "shop" : area === "club" ? "club" :
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
      for (var ci = 0; ci < yardCols.length; ci++) {
        var cc = yardCols[ci];
        if (insideCol(cc, car.position.x, car.position.z, 1.4)) continue;
        if (insideCol(cc, nx2, nz2, 1.4)) { hit = true; break; }
      }
      if (nx2 < -27 || nx2 > 83 || nz2 < 2.6 || nz2 > 69) hit = true;
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
        var sp = 3.4 * (hungover ? 0.72 : 1);
        slide((fx * iz + rx * ix) * sp * dt, (fz * iz + rz * ix) * sp * dt, curCols());
        if (area === "yard") { pos.x = Math.max(-28, Math.min(84, pos.x)); pos.z = Math.max(1.0, Math.min(70, pos.z)); }
        if (area === "flat") { pos.x = Math.max(-1.45, Math.min(7.9, pos.x)); pos.z = Math.max(0.12, Math.min(5.9, pos.z)); }
        if (area === "shop") { pos.x = Math.max(SX + 0.35, Math.min(SX + 9.65, pos.x)); pos.z = Math.max(0.35, Math.min(7.65, pos.z)); }
        if (area === "gym") { pos.x = Math.max(GX + 0.35, Math.min(GX + 13.65, pos.x)); pos.z = Math.max(0.35, Math.min(9.65, pos.z)); }
        if (area === "club") { pos.x = Math.max(NX + 0.35, Math.min(NX + 13.65, pos.x)); pos.z = Math.max(0.35, Math.min(9.65, pos.z)); }
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
