window.AU = (function () {
  var ctx = null, master = null, windGain = null, env = "in", schedOn = false, night = false;
  var api = { onCaption: null };

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      startWind();
      startRain();
      if (!schedOn) { schedOn = true; schedule(); }
    } catch (e) { ctx = null; }
  }

  function now() { return ctx.currentTime; }

  function envVol() {
    if (env === "out") return 1;
    if (env === "gym" || env === "shop") return 0.45;
    if (env === "club") return 0.05;
    return 0.2;
  }

  function tone(f0, f1, dur, type, vol, filtFreq, when) {
    if (!ctx) return;
    var t0 = now() + (when || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    var dest = master;
    if (filtFreq) {
      var f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = filtFreq;
      o.connect(g); g.connect(f); f.connect(master);
    } else { o.connect(g); g.connect(dest); }
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  var nBuf = null;
  function noiseBuffer() {
    if (nBuf) return nBuf;
    var len = ctx.sampleRate * 2;
    nBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = nBuf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return nBuf;
  }

  function noiseHit(dur, vol, fType, f0, f1, when) {
    if (!ctx) return;
    var t0 = now() + (when || 0);
    var s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = fType; f.Q.value = 1.2;
    f.frequency.setValueAtTime(f0, t0);
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t0); s.stop(t0 + dur + 0.1);
  }

  function startWind() {
    var s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 320; f.Q.value = 0.5;
    windGain = ctx.createGain(); windGain.gain.value = 0.004;
    s.connect(f); f.connect(windGain); windGain.connect(master);
    s.start();
  }

  var rainGainN = null;
  function startRain() {
    var s = ctx.createBufferSource(); s.buffer = noiseBuffer(); s.loop = true;
    var f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1100; f.Q.value = 0.4;
    rainGainN = ctx.createGain(); rainGainN.gain.value = 0;
    s.connect(f); f.connect(rainGainN); rainGainN.connect(master);
    s.start();
  }

  // ---- car radio: lo-fi eurodance loop ----
  var radIv = null, rg = 0, rStep = 0, rScale = [0, 3, 5, 7, 10, 12, 15];
  function radioStart() {
    if (!ctx || radIv) return;
    rStep = 0;
    radIv = setInterval(function () {
      if (rg <= 0.001) { rStep++; return; }
      if (rStep % 2 === 0) tone(55, 55, 0.18, "square", rg * 0.8, 300);
      var n = 220 * Math.pow(2, rScale[(rStep * 3) % 7] / 12);
      tone(n, n, 0.15, "square", rg * 0.45, 1700);
      if (rStep % 8 === 4) noiseHit(0.04, rg * 0.4, "highpass", 7000, 0);
      if (rStep % 16 === 14) tone(n * 2, n * 1.5, 0.2, "sawtooth", rg * 0.3, 2200);
      rStep++;
    }, 240);
  }
  function radioGain(v) { rg = v; }
  function radioStop() { if (radIv) { clearInterval(radIv); radIv = null; } rg = 0; }

  function purr() {
    for (var i = 0; i < 9; i++) tone(88, 78, 0.06, "sawtooth", 0.028, 240, i * 0.07);
  }

  function beep(f, d, type, v) { if (ctx) tone(f, f, d, type || "square", v || 0.05); }

  var caps = {
    shout: ["somewhere between the blocks, a man yells 'OOOPA!'",
      "two men argue about basketball, at volume",
      "'VYTAI! VYTAAAAI!' — Vytas does not answer",
      "a man coaches a parallel-parking driver: 'davai, davai... STOP. stop. STOP!'"],
    kids: ["kids argue about whose turn it is",
      "a kid counts to ten; everyone hides",
      "kids' laughter ricochets between the blocks"],
    dog: ["a dog files its complaint with the whole courtyard"],
    crow: ["a crow says what everyone is thinking"],
    bounce: ["a basketball keeps a slow heartbeat somewhere"],
    whoosh: ["the 16 trolleybus hisses past, half empty"],
    revbeep: ["somewhere, a truck reverses, beeping, forever"]
  };

  function cap(key) {
    if (env === "out" && api.onCaption && Math.random() < 0.8) {
      var a = caps[key];
      api.onCaption(a[Math.floor(Math.random() * a.length)]);
    }
  }

  function shout() {
    var v = 0.05 * envVol();
    tone(280, 150, 0.3, "sawtooth", v, 700);
    tone(240, 130, 0.22, "sawtooth", v * 0.8, 700, 0.34);
    tone(260, 140, 0.28, "sawtooth", v * 0.4, 500, 0.55);
    cap("shout");
  }
  function kids() {
    var v = 0.028 * envVol(), t = 0;
    for (var i = 0; i < 5 + Math.random() * 3; i++) {
      tone(900 + Math.random() * 600, 1100 + Math.random() * 500, 0.09, "triangle", v, 0, t);
      t += 0.09 + Math.random() * 0.13;
    }
    cap("kids");
  }
  function dog() {
    var v = 0.045 * envVol();
    tone(150, 110, 0.08, "square", v, 600);
    tone(160, 115, 0.08, "square", v, 600, 0.18);
    if (Math.random() < 0.5) tone(150, 105, 0.09, "square", v, 600, 0.4);
    cap("dog");
  }
  function crow() {
    var v = 0.035 * envVol();
    tone(430, 290, 0.22, "sawtooth", v, 1400);
    tone(420, 280, 0.2, "sawtooth", v * 0.8, 1400, 0.3);
    cap("crow");
  }
  function bounce() {
    var v = 0.05 * envVol(), t = 0, gap = 0.55;
    for (var i = 0; i < 6; i++) { tone(95, 55, 0.1, "sine", v, 0, t); t += gap; gap *= 0.78; }
    cap("bounce");
  }
  function whoosh() {
    noiseHit(1.5, 0.035 * envVol(), "bandpass", 250, 1100);
    cap("whoosh");
  }
  function revbeep() {
    var v = 0.018 * envVol();
    for (var i = 0; i < 4; i++) tone(1000, 1000, 0.13, "square", v, 0, i * 0.55);
    cap("revbeep");
  }
  function clank() {
    tone(2100, 1900, 0.05, "square", 0.04);
    tone(1500, 1300, 0.07, "square", 0.03, 0, 0.01);
    noiseHit(0.08, 0.03, "highpass", 3000, 0);
  }
  function grunt() { tone(120, 70, 0.3, "sawtooth", 0.04, 350); }
  function scanner() { tone(1320, 1320, 0.07, "sine", 0.03); }
  function chime() { tone(880, 880, 0.12, "sine", 0.03); tone(660, 660, 0.16, "sine", 0.03, 0, 0.14); }

  function schedule() {
    var wait = 5000 + Math.random() * 9000;
    setTimeout(function () {
      if (ctx) fire();
      schedule();
    }, wait);
  }

  function fire() {
    var r = Math.random();
    if (env === "club") return;
    if (env === "gym") {
      if (r < 0.45) clank(); else if (r < 0.7) grunt(); else outdoorPick();
    } else if (env === "shop") {
      if (r < 0.4) scanner(); else if (r < 0.6) chime(); else outdoorPick();
    } else {
      outdoorPick();
    }
  }
  function outdoorPick() {
    var r = Math.random();
    if (night) {
      if (r < 0.3) shout();
      else if (r < 0.55) dog();
      else if (r < 0.7) crow();
      else if (r < 0.9) whoosh();
      else revbeep();
      return;
    }
    if (r < 0.2) shout();
    else if (r < 0.4) kids();
    else if (r < 0.52) dog();
    else if (r < 0.62) crow();
    else if (r < 0.74) bounce();
    else if (r < 0.88) whoosh();
    else revbeep();
  }

  var eng = null, engG = null;
  function engineOn() {
    if (!ctx || eng) return;
    eng = ctx.createOscillator(); engG = ctx.createGain();
    eng.type = "sawtooth"; eng.frequency.value = 55; engG.gain.value = 0.035;
    eng.connect(engG); engG.connect(master); eng.start();
  }
  function engineSet(spd) { if (eng) eng.frequency.value = 55 + Math.abs(spd) * 7; }
  function engineOff() { if (eng) { try { eng.stop(); } catch (e) {} eng = null; } }

  function ring(cb) {
    if (!ctx) { setTimeout(cb, 600); return; }
    for (var i = 0; i < 3; i++) {
      tone(587, 587, 0.16, "sine", 0.06, 0, i * 0.95);
      tone(880, 880, 0.22, "sine", 0.06, 0, i * 0.95 + 0.18);
    }
    setTimeout(cb, 2950);
  }
  function hangup() {
    tone(440, 440, 0.12, "sine", 0.06);
    tone(330, 330, 0.14, "sine", 0.06, 0, 0.16);
    tone(220, 220, 0.18, "sine", 0.05, 0, 0.32);
  }

  // ---- techno engine: ~130bpm kick / offbeat hat / occasional stab ----
  var technoIv = null, tg = 0, tStep = 0;
  function technoStart() {
    if (!ctx || technoIv) return;
    tStep = 0;
    technoIv = setInterval(function () {
      if (!ctx || tg <= 0.0015) { tStep++; return; }
      if (tStep % 2 === 0) {
        tone(78, 36, 0.16, "sine", tg);            // kick
        tone(160, 60, 0.03, "square", tg * 0.5);   // click transient
      } else {
        noiseHit(0.05, tg * 0.45, "highpass", 6500, 0); // offbeat hat
      }
      if (tStep % 16 === 8) tone(155, 155, 0.09, "sawtooth", tg * 0.3, 900); // stab
      tStep++;
    }, 230);
  }
  function technoGain(v) { tg = v; }
  function technoStop() {
    if (technoIv) { clearInterval(technoIv); technoIv = null; }
    tg = 0;
  }

  api.ensure = ensure;
  api.beep = beep;
  api.clank = clank;
  api.bounce = bounce;
  api.engineOn = engineOn;
  api.engineSet = engineSet;
  api.engineOff = engineOff;
  api.ring = ring;
  api.hangup = hangup;
  api.technoStart = technoStart;
  api.technoGain = technoGain;
  api.technoStop = technoStop;
  api.radioStart = radioStart;
  api.radioGain = radioGain;
  api.radioStop = radioStop;
  api.purr = purr;
  api.setRain = function (v) { if (rainGainN) rainGainN.gain.value = v; };
  api.setNight = function (n) { night = n; };
  api.setEnv = function (e) {
    env = e;
    if (windGain) windGain.gain.value = e === "out" ? 0.014 : 0.004;
  };
  return api;
})();
