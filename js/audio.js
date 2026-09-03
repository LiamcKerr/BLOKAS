window.AU = (function () {
  var ctx = null, master = null, windGain = null, env = "in", schedOn = false, night = false;
  var api = { onCaption: null };

  // ---- sample bank: voice acting + real SFX (local first, CDN fallback) ----
  var CDN = "https://d8j0ntlcm91z4.cloudfront.net/user_37DfdM6jwlG0p8AGJ2iHaA81mE3/";
  var SAMPLES = {
    petras_1: ["assets/va/petras_1.wav", "hf_20260613_004227_a82ef840-c18d-4dc3-90a0-379460f8565c.wav"],
    petras_2: ["assets/va/petras_2.wav", "hf_20260613_004309_940d0d21-0699-40eb-bce9-e5303777d814.wav"],
    petras_3: ["assets/va/petras_3.wav", "hf_20260613_004310_e1de4db8-418e-48da-873d-1ea8cb5b941a.wav"],
    petras_4: ["assets/va/petras_4.wav", "hf_20260613_004312_d5301fdf-5805-43fb-9837-d8d61d840bd5.wav"],
    petras_5: ["assets/va/petras_5.wav", "hf_20260613_004314_50027173-460d-4341-ada5-d90073b1e23f.wav"],
    geno_1: ["assets/va/geno_1.wav", "hf_20260613_004315_34ee7e02-21ad-487a-ab38-3f488a13a697.wav"],
    geno_2: ["assets/va/geno_2.wav", "hf_20260613_004316_18c5c26f-7239-46f7-93b4-417428254743.wav"],
    geno_3: ["assets/va/geno_3.wav", "hf_20260613_004317_92abb917-8ebc-458f-a83a-d2f2f2af3857.wav"],
    geno_4: ["assets/va/geno_4.wav", "hf_20260613_004319_29308468-00ee-4344-b133-b4a175bfa571.wav"],
    geno_5: ["assets/va/geno_5.wav", "hf_20260613_004320_579f2ead-e124-4706-9c02-2e39e7b6f954.wav"],
    sen_1: ["assets/va/sen_1.wav", "hf_20260613_004330_5ead6733-d743-414a-82bc-9c2dc379430b.wav"],
    sen_2: ["assets/va/sen_2.wav", "hf_20260613_004331_2db2a3a0-8441-4253-810a-4808c90bcc16.wav"],
    sen_3: ["assets/va/sen_3.wav", "hf_20260613_004333_0e8c0ca6-bacf-4d66-b546-b149f93fb5eb.wav"],
    mama_1: ["assets/va/mama_1.wav", "hf_20260613_004334_b8142fa5-c552-48b7-879e-3d993f14b167.wav"],
    mama_2: ["assets/va/mama_2.wav", "hf_20260613_004335_9afc4fb1-f57f-4508-b4a7-776438cfaf49.wav"],
    girl_1: ["assets/va/girl_1.wav", "hf_20260613_004336_69353552-75b0-4d0a-913a-339f626e9d19.wav"],
    girl_2: ["assets/va/girl_2.wav", "hf_20260613_004337_d4da3947-6557-497e-b002-ce6227d5e758.wav"],
    girl_3: ["assets/va/girl_3.wav", "hf_20260613_004339_e884028b-f0dd-4c5d-a2fc-f67df46f03fc.wav"],
    girl_4: ["assets/va/girl_4.wav", "hf_20260613_004340_be93350f-71ba-4ee1-9679-e0c588e58ea2.wav"],
    girl_5: ["assets/va/girl_5.wav", "hf_20260613_004341_60d9ef77-a442-450c-a5df-16eafdd3e57f.wav"],
    kas_1: ["assets/va/kas_1.wav", "hf_20260613_004344_1ed97e25-dbc1-420b-b5b0-dd1cf4489cba.wav"],
    kas_2: ["assets/va/kas_2.wav", "hf_20260613_004432_2e65cd96-ddd6-4188-9f03-b2d50a87adda.wav"],
    bounce_1: ["assets/va/bounce_1.wav", "hf_20260613_004346_26990fec-a5d6-4dfb-ba14-9a80d105323e.wav"],
    deli_1: ["assets/va/deli_1.wav", "hf_20260613_004430_faaa0c4b-bc40-48fb-b488-6ae2e39120f4.wav"],
    deli_2: ["assets/va/deli_2.wav", "hf_20260613_004431_07293758-251d-4a2e-81ae-c69dc8ff6347.wav"],
    tv_1: ["assets/va/tv_1.wav", "hf_20260613_000348_c899cfb7-9852-4c7b-abd1-db9609655775.wav"],
    tv_2: ["assets/va/tv_2.wav", "hf_20260613_000349_184d3f8a-232a-4936-a286-1e5fcad38e5f.wav"],
    tv_3: ["assets/va/tv_3.wav", "hf_20260613_000350_9c581c06-d5ac-4f1d-a86a-66d75e555861.wav"],
    tv_4: ["assets/va/tv_4.wav", "hf_20260613_000351_d29cfd05-4ea1-465c-9df1-d0ac9775a0ed.wav"],
    pigeons: ["assets/sfx/pigeons.mp3", "hf_20260613_004514_84deb236-73d1-41f1-96f4-79faddb65001.mp3"],
    trolley: ["assets/sfx/trolley.mp3", "hf_20260613_004515_f8c47439-880f-4178-8373-cca4798898ff.mp3"],
    taromat: ["assets/sfx/taromat.mp3", "hf_20260613_004516_cdd89ab4-b1ce-492f-8e0b-2f12335b85e1.mp3"],
    cat: ["assets/sfx/cat.mp3", "hf_20260613_004517_1ea9689b-6afb-453a-8a8e-e1cc1c7606bb.mp3"],
    ball: ["assets/sfx/ball.mp3", "hf_20260613_004518_b280a6e7-04fd-4025-b910-c9ef0c30ce87.mp3"],
    door: ["assets/sfx/door.mp3", "hf_20260613_004520_dfea6f54-ba82-44ad-a9e2-8aaa4e34ec85.mp3"],
    cardoor: ["assets/sfx/cardoor.mp3", "hf_20260613_004605_94bb832e-817b-4538-bd3a-07449274f8ca.mp3"],
    ignition: ["assets/sfx/ignition.mp3", "hf_20260613_004606_bba317a0-a660-4b99-9748-99aa4ce0d5cc.mp3"],
    dog: ["assets/sfx/dog.mp3", "hf_20260613_004607_c6d812c7-4712-4e87-9228-5a2f317de9cf.mp3"],
    amb_day: ["assets/sfx/amb_day.mp3", "hf_20260613_004608_dead3571-048a-4c3c-8671-6403f42fcfc2.mp3"],
    amb_night: ["assets/sfx/amb_night.mp3", "hf_20260613_004610_742d69b4-94a3-43d8-9165-1313d1abd7f9.mp3"],
    pop_1: ["assets/radio/pop_1.wav", "assets/radio/pop_1.wav"],
    pop_2: ["assets/radio/pop_2.wav", "assets/radio/pop_2.wav"],
    pop_3: ["assets/radio/pop_3.wav", "assets/radio/pop_3.wav"],
    rap_1: ["assets/radio/rap_1.wav", "assets/radio/rap_1.wav"],
    rap_2: ["assets/radio/rap_2.wav", "assets/radio/rap_2.wav"],
    rap_3: ["assets/radio/rap_3.wav", "assets/radio/rap_3.wav"],
    cls_1: ["assets/radio/cls_1.wav", "assets/radio/cls_1.wav"],
    cls_2: ["assets/radio/cls_2.wav", "assets/radio/cls_2.wav"],
    cls_3: ["assets/radio/cls_3.wav", "assets/radio/cls_3.wav"],
    djpop_1: ["assets/radio/djpop_1.wav", "hf_20260613_011043_a268c62e-d968-4056-9a9c-219005a8230a.wav"],
    djpop_2: ["assets/radio/djpop_2.wav", "hf_20260613_011044_b574a815-147e-49e4-ad37-d0687e0a3948.wav"],
    djpop_3: ["assets/radio/djpop_3.wav", "hf_20260613_011045_dedcaeea-e692-45ec-bb21-7ffdc91f0758.wav"],
    djblok_1: ["assets/radio/djblok_1.wav", "hf_20260613_011046_499fcfb6-2060-4e81-b984-d244a1341ea6.wav"],
    djblok_2: ["assets/radio/djblok_2.wav", "hf_20260613_011047_cfead369-6582-46ca-af51-ad322f02eacd.wav"],
    djblok_3: ["assets/radio/djblok_3.wav", "hf_20260613_011135_810ce78d-0314-45a5-bcd3-ee76ef058a0f.wav"],
    djcls_1: ["assets/radio/djcls_1.wav", "hf_20260613_011136_489b9f64-436d-4088-983c-9a76ba947023.wav"],
    djcls_2: ["assets/radio/djcls_2.wav", "hf_20260613_011138_35a051f1-846c-45b2-a488-7123b6a88e97.wav"],
    djcls_3: ["assets/radio/djcls_3.wav", "hf_20260613_011139_fc4348e5-aafc-441f-9996-f0ef411aa0d5.wav"],
    rap_mc: ["assets/radio/rap_mc.wav", "hf_20260613_011141_f18acea6-f70e-4983-bc68-0a82a80acdd5.wav"],
    lord_greet: ["assets/va/lord_greet.wav", "hf_20260613_035245_fa9ba417-bb38-49a4-a967-a6578b0a4878.wav"],
    lord_intro1: ["assets/va/lord_intro1.wav", "hf_20260613_035246_888039bd-8ed2-4605-9171-d3b59005746d.wav"],
    lord_intro2: ["assets/va/lord_intro2.wav", "hf_20260613_035247_23bd0175-ec72-4d6d-bbe5-efad59f31c6a.wav"],
    lord_collect: ["assets/va/lord_collect.wav", "hf_20260613_035248_1b21de29-4b25-42ed-bfc6-5d2ff391884c.wav"],
    lord_paid1: ["assets/va/lord_paid1.wav", "hf_20260613_035249_dafd7792-d5a8-488c-b318-60d83b548acf.wav"],
    lord_paid2: ["assets/va/lord_paid2.wav", "hf_20260613_035250_1310f617-94ac-41e5-adaf-258743df8abb.wav"],
    lord_nomoney1: ["assets/va/lord_nomoney1.wav", "hf_20260613_035251_e5f26a07-347d-448e-bdf3-34a3795c075b.wav"],
    lord_nomoney2: ["assets/va/lord_nomoney2.wav", "hf_20260613_035252_445c6179-d89e-4e71-bcb3-6ffa55c2c1c8.wav"],
    lord_linger1: ["assets/va/lord_linger1.wav", "hf_20260618_084557_cf6942d8-ce32-4acd-bb15-1a08bab6af3b.wav"],
    lord_linger2: ["assets/va/lord_linger2.wav", "hf_20260618_084601_fa7ab127-4f5b-46b6-a3fa-3d045d86b263.wav"],
    lord_linger3: ["assets/va/lord_linger3.wav", "hf_20260618_084605_528352dd-7bb1-4a07-bd95-4ae18f3d71b1.wav"],
    lord_linger4: ["assets/va/lord_linger4.wav", "hf_20260618_084619_3dcc7133-c876-4fa9-ae08-c999542fae73.wav"],
    lord_linger5: ["assets/va/lord_linger5.wav", "hf_20260618_084625_d1cbb1df-61a8-4015-bcf3-c929f99399c3.wav"],
    lord_okay1: ["assets/va/lord_okay1.wav", "hf_20260618_084646_14a14277-1a07-480d-80c2-3d02ad1ac639.wav"],
    lord_okay2: ["assets/va/lord_okay2.wav", "hf_20260618_084649_453118b0-6a71-431b-bdaa-acb38d972d0d.wav"],
    lord_okay3: ["assets/va/lord_okay3.wav", "hf_20260618_084652_d7025433-79d5-4201-a9a6-4c01a67fdc48.wav"],
    lord_ditch1: ["assets/va/lord_ditch1.wav", "hf_20260618_084657_faf3f235-4463-4ce6-902e-4fcba386db56.wav"],
    lord_ditch2: ["assets/va/lord_ditch2.wav", "hf_20260618_084703_fe942b90-8fa8-41e7-a702-4fb11a381a3a.wav"],
    dz_scream: ["assets/va/dz_scream.wav", "hf_20260618_173138_39024fa1-21fc-4d85-a044-043badb4592e.wav"]
  };
  var bank = {}; // key -> { url, ok }
  function resolveSample(key, cb) {
    var s = bank[key];
    if (s) { if (s.ok !== null) cb(s); else s.q.push(cb); return; }
    s = bank[key] = { url: SAMPLES[key][0], ok: null, q: [cb] };
    var tryUrl = function (url, next) {
      var a = new Audio();
      a.addEventListener("canplaythrough", function () { s.url = url; s.ok = true; flush(); }, { once: true });
      a.addEventListener("error", function () { next ? next() : (s.ok = false, flush()); }, { once: true });
      a.preload = "auto"; a.src = url;
    };
    var flush = function () { var q = s.q; s.q = []; q.forEach(function (f) { f(s); }); };
    tryUrl(SAMPLES[key][0], function () { tryUrl(CDN + SAMPLES[key][1], null); });
  }
  function playS(key, vol, cb) {
    resolveSample(key, function (s) {
      if (!s.ok) { if (cb) cb(false); return; }
      var a = new Audio(s.url);
      a.volume = Math.min(1, vol);
      a.play().catch(function () {});
      if (cb) cb(true);
    });
  }

  // ---- voice acting channel ----
  var voiceEl = null;
  var VOICE_MAP = [
    ["PETRAS", "Spare a euro", "petras_1"],
    ["PETRAS", "These cans?", "petras_2"],
    ["PETRAS", "Heard your Mercedes", "petras_3"],
    ["PETRAS", "Nobody listens to an engineer", "petras_4"],
    ["PETRAS", "Aciu, vaike", "petras_5"],
    ["PONIA GENOVAITE", "my knees can hear you", "geno_1"],
    ["PONIA GENOVAITE", "boiled potato water", "geno_2"],
    ["PONIA GENOVAITE", "Your mama called ME", "geno_3"],
    ["PONIA GENOVAITE", "walls in this house are paper", "geno_4"],
    ["PONIA GENOVAITE", "Eleven grandchildren", "geno_5"],
    ["SENELE", "weather station", "sen_1"],
    ["SENELE", "euros AND potatoes", "sen_2"],
    ["SENELE", "planted those currants", "sen_3"],
    ["MAMA", "You eat? Real food", "mama_1"],
    ["MAMA", "Come Sunday", "mama_2"],
    ["MERGINA", "Ne. Whatever it is", "girl_1"],
    ["MERGINA", "Go away, weirdo", "girl_2"],
    ["MERGINA", "smell the Svyturys", "girl_3"],
    ["MERGINA", "Romeo of the blokas", "girl_4"],
    ["MERGINA", "nice hoodie", "girl_5"],
    ["KULINARIJOS PONIA", "Silke? Desros", "deli_1"],
    ["KULINARIJOS PONIA", "Buy the pelmenai", "deli_2"],
    ["KASININKE", "Maxima card?", "kas_1"],
    ["KASININKE", "The card has you", "kas_2"],
    ["APSAUGA", "Nice car", "bounce_1"],
    ["SEIMININKAS", "I can hear you breathing", "lord_greet"],
    ["SEIMININKAS", "I am Vytautas", "lord_intro1"],
    ["SEIMININKAS", "I come back in seven days", "lord_intro2"],
    ["SEIMININKAS", "Where is it?", "lord_collect"],
    ["SEIMININKAS", "less useless than the last one", "lord_paid1"],
    ["SEIMININKAS", "Do not get comfortable", "lord_paid2"],
    ["SEIMININKAS", "walls do not hold themselves", "lord_nomoney1"],
    ["SEIMININKAS", "change the lock", "lord_nomoney2"],
    ["SEIMININKAS", "Mm. Good", "lord_linger1"],
    ["SEIMININKAS", "do not make tea", "lord_linger2"],
    ["SEIMININKAS", "daughter, she is in Ireland", "lord_linger3"],
    ["SEIMININKAS", "young ones all leave", "lord_linger4"],
    ["SEIMININKAS", "all I ask of anybody", "lord_linger5"],
    ["SEIMININKAS", "it's okay, brother", "lord_okay2"],
    ["SEIMININKAS", "Get some rest tonight", "lord_okay3"],
    ["SEIMININKAS", "told you to get some rest", "lord_ditch1"],
    ["SEIMININKAS", "have to worry about anymore", "lord_ditch2"],
    ["SEIMININKAS", "No money.", "lord_okay1"],
    ["DZIUGAS", "TAKE THIS SHIT", "dz_scream"]
  ];
  var voiceSeq = 0;   // bumped on every stop/new line so a late-resolving sample can tell it is stale
  function voiceStop() {
    voiceSeq++;
    if (voiceEl) { try { voiceEl.pause(); } catch (e) {} voiceEl = null; }
    duckTarget = 1;
  }
  function voiceLine(who, text) {
    if (!who || !text) return;
    for (var i = 0; i < VOICE_MAP.length; i++) {
      var m = VOICE_MAP[i];
      if (who === m[0] && text.indexOf(m[1]) !== -1) {
        voiceStop();
        var seq = voiceSeq;
        resolveSample(m[2], function (s) {
          if (!s.ok || seq !== voiceSeq) return;   // dialogue already moved on (or closed) while this resolved
          duckTarget = 0.45;
          var a = new Audio(s.url);
          a.volume = 0.85;
          a.addEventListener("ended", function () { if (voiceEl === a) { voiceEl = null; duckTarget = 1; } });
          voiceEl = a;
          a.play().catch(function () {});
        });
        return;
      }
    }
  }
  function tv(i) { playS("tv_" + ((i % 4) + 1), 0.35); }

  // ---- ambience beds (looped, crossfaded day/night, gated by env) ----
  var ambEls = {}, duckTarget = 1, duckCur = 1;
  function ambEl(key) {
    var el = ambEls[key];
    if (el) return el;
    el = ambEls[key] = { a: null, vol: 0 };
    resolveSample(key, function (s) {
      if (!s.ok) return;
      var a = new Audio(s.url);
      a.loop = true; a.volume = 0;
      el.a = a;
    });
    return el;
  }
  function ambTargets() {
    var day = 0, nite = 0;
    if (env === "out") { day = night ? 0 : 0.16; nite = night ? 0.2 : 0; }
    else if (env === "pond") { day = night ? 0 : 0.1; nite = night ? 0.12 : 0; }
    else if (env === "gym" || env === "shop") { day = 0.04; }
    else if (env === "in") { day = night ? 0 : 0.035; nite = night ? 0.045 : 0; }
    return { amb_day: day, amb_night: nite };
  }
  setInterval(function () {
    duckCur += (duckTarget - duckCur) * 0.25;
    var tg = ambTargets();
    ["amb_day", "amb_night"].forEach(function (k) {
      var el = ambEl(k);
      el.vol += ((tg[k] || 0) * duckCur - el.vol) * 0.12;
      if (!el.a) return;
      el.a.volume = Math.max(0, Math.min(1, el.vol));
      if (el.vol > 0.004 && el.a.paused) el.a.play().catch(function () {});
      if (el.vol <= 0.004 && !el.a.paused) el.a.pause();
    });
    if (master) master.gain.value = duckCur;
    if (radCur) radCur.volume = Math.min(1, (radCur._base || 0.42) * duckCur);
    if (radMC) radMC.volume = Math.min(1, (radMC._base || 0.7) * duckCur);
  }, 140);

  function ensure() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain();
      master.gain.value = 1;
      master.connect(ctx.destination);
      startVerb();
      startWind();
      startRain();
      if (!schedOn) { schedOn = true; schedule(); }
    } catch (e) { ctx = null; }
  }

  // ---- reverb: generated impulse, per-environment send ----
  var verb = null, verbSend = null;
  function startVerb() {
    var len = ctx.sampleRate * 1.6;
    var ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = ir.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
    }
    verb = ctx.createConvolver(); verb.buffer = ir;
    verbSend = ctx.createGain(); verbSend.gain.value = 0.12;
    master.connect(verbSend); verbSend.connect(verb); verb.connect(ctx.destination);
  }
  function verbFor(e) {
    return e === "club" ? 0.4 : e === "gym" ? 0.24 : e === "in" ? 0.18 :
      e === "shop" ? 0.2 : e === "pond" ? 0.05 : 0.08;
  }

  function now() { return ctx.currentTime; }

  function envVol() {
    if (env === "out") return 1;
    if (env === "pond") return 0.4;
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

  function gunshot() {
    if (!ctx) return;
    // bright crack, a sub thump under it, and a short tail of debris
    tone(2600, 700, 0.06, "square", 0.16, 6000);
    tone(70, 40, 0.22, "sine", 0.22);
    noiseHit(0.09, 0.4, "highpass", 7000, 1200);
    noiseHit(0.5, 0.08, "lowpass", 900, 200, 0.04);
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

  // ---- car radio: 3 stations, AI songs + DJ banter ----
  var STATIONS = {
    popas: {
      name: "NON-STOPAS POPAS",
      songs: [["pop_1", "Alkoholis Žudo", "Non-Stopas Popas"],
        ["pop_2", "Maximos Vinjetė", "Non-Stopas Popas"],
        ["pop_3", "Varna", "Non-Stopas Popas"]],
      djs: ["djpop_1", "djpop_2", "djpop_3"]
    },
    blokas: {
      name: "RADIO LOS BLOKAS",
      songs: [["rap_1", "Kietas Gyvenimas", "Radio Los Blokas"],
        ["rap_2", "No Contract Potato", "Radio Los Blokas"],
        ["rap_3", "Reikia Pūst", "Radio Los Blokas"]],
      djs: ["djblok_1", "djblok_2", "djblok_3"]
    },
    klaip: {
      name: "KLAIPEDIA CLASSICS",
      songs: [["cls_1", "Cepelinai", "Klaipedia Classics"],
        ["cls_2", "Licencija Lenktynėse", "Klaipedia Classics"],
        ["cls_3", "Viskas Gerai", "Klaipedia Classics"]],
      djs: ["djcls_1", "djcls_2", "djcls_3"]
    }
  };
  // Radio is OFF by default. It only plays once the user picks a station,
  // and that choice persists for the rest of the session (entering the car
  // again does not auto-start it).
  var radSt = "popas", radOn = false, radActive = false,
    radCur = null, radMC = null, radTimer = null,
    radLastSong = { popas: -1, blokas: -1, klaip: -1 }, radLastBanter = false, radFail = 0;
  function radClearEls() {
    if (radCur) { try { radCur.pause(); } catch (e) {} radCur = null; }
    if (radMC) { try { radMC.pause(); } catch (e) {} radMC = null; }
    if (radTimer) { clearTimeout(radTimer); radTimer = null; }
  }
  function radPickSong(st) {
    var n = st.songs.length;
    if (n <= 1) return 0;
    var i; do { i = Math.floor(Math.random() * n); } while (i === radLastSong[radSt]);
    return i;
  }
  // Each step independently rolls song-or-banter: ~35% banter, but never two
  // banters back to back, and never the same song twice in a row.
  function radNext() {
    radClearEls();
    if (!radOn || !radActive || !radSt) return;
    var st = STATIONS[radSt], gen = radSt;
    if (!radLastBanter && Math.random() < 0.35) {
      radLastBanter = true;
      var dj = st.djs[Math.floor(Math.random() * st.djs.length)];
      resolveSample(dj, function (s) {
        if (!radOn || !radActive || radSt !== gen || radCur) return;
        if (!s.ok) { radLastBanter = false; if (++radFail > 6) { radFail = 0; radOn = false; return; } radNext(); return; }   // nothing playable: give up, don't recurse forever
        radFail = 0;
        var a = new Audio(s.url);
        a._base = 0.55;
        a.addEventListener("ended", function () { if (radCur === a) radNext(); });
        radCur = a; a.volume = 0.55 * duckCur;
        a.play().catch(function () {});
      });
      return;
    }
    radLastBanter = false;
    var si = radPickSong(st); radLastSong[radSt] = si;
    var song = st.songs[si];
    resolveSample(song[0], function (s) {
      if (!radOn || !radActive || radSt !== gen || radCur) return;
      if (!s.ok) { if (++radFail > 6) { radFail = 0; radOn = false; return; } radNext(); return; }
      radFail = 0;
      var a = new Audio(s.url);
      a._base = 0.42;
      a.addEventListener("ended", function () { if (radCur === a) radNext(); });
      radCur = a; a.volume = 0.42 * duckCur;
      a.play().catch(function () {});
      if (api.onRadio) api.onRadio("♪ " + st.name + " — " + song[1] + " · " + song[2]);
    });
  }
  function radioTune(st) {
    radSt = st || radSt;
    radOn = !!st;
    radClearEls();
    radLastBanter = false;
    if (radOn && radActive) radNext();
  }
  function radioStart() { /* radio comes alive via radioGain each frame */ }
  function radioGain(v) {
    var act = v > 0;
    if (act === radActive) return;
    radActive = act;
    if (!radOn) return;
    if (act) {
      if (radCur) { radCur.play().catch(function () {}); if (radMC) radMC.play().catch(function () {}); }
      else radNext();
    } else {
      if (radCur) radCur.pause();
      if (radMC) radMC.pause();
      if (radTimer) { clearTimeout(radTimer); radTimer = null; }
    }
  }
  function radioStop() { radioGain(0); }
  function radioInfo() {
    return { on: radOn, st: radSt, name: radSt ? STATIONS[radSt].name : "" };
  }

  function purr() {
    playS("cat", 0.5, function (ok) {
      if (!ok) for (var i = 0; i < 9; i++) tone(88, 78, 0.06, "sawtooth", 0.028, 240, i * 0.07);
    });
  }
  function munch() {
    noiseHit(0.09, 0.045, "lowpass", 500, 250);
    noiseHit(0.07, 0.035, "lowpass", 420, 200, 0.13);
  }
  function gulp() {
    tone(190, 60, 0.14, "sine", 0.05);
    noiseHit(0.05, 0.02, "bandpass", 700, 300, 0.1);
  }

  // ---- accordion waltz (old town busker) ----
  var accIv = null, ag = 0, aStep = 0;
  var accMel = [0, 3, 7, 3, 5, 3, 2, 0, -2, 0, 3, 7];
  function accStart() {
    if (!ctx || accIv) return;
    aStep = 0;
    accIv = setInterval(function () {
      if (ag <= 0.001) { aStep++; return; }
      if (aStep % 3 === 0) {
        tone(110, 110, 0.22, "sawtooth", ag * 0.7, 500);          // oom
      } else {
        tone(220, 220, 0.14, "sawtooth", ag * 0.35, 1100);        // pah
        tone(262, 262, 0.14, "sawtooth", ag * 0.3, 1100);
      }
      var n = 440 * Math.pow(2, accMel[(aStep >> 1) % accMel.length] / 12);
      tone(n, n, 0.2, "sawtooth", ag * 0.4, 1600);
      aStep++;
    }, 300);
  }
  function accGain(v) { ag = v; }
  function accStop() { if (accIv) { clearInterval(accIv); accIv = null; } ag = 0; }

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
    playS("dog", 0.4 * envVol(), function (ok) {
      if (ok) return;
      var v = 0.045 * envVol();
      tone(150, 110, 0.08, "square", v, 600);
      tone(160, 115, 0.08, "square", v, 600, 0.18);
      if (Math.random() < 0.5) tone(150, 105, 0.09, "square", v, 600, 0.4);
    });
    cap("dog");
  }
  function crow() {
    var v = 0.035 * envVol();
    tone(430, 290, 0.22, "sawtooth", v, 1400);
    tone(420, 280, 0.2, "sawtooth", v * 0.8, 1400, 0.3);
    cap("crow");
  }
  function bounce() {
    playS("ball", 0.3 * envVol(), function (ok) {
      if (ok) return;
      var v = 0.05 * envVol(), t = 0, gap = 0.55;
      for (var i = 0; i < 6; i++) { tone(95, 55, 0.1, "sine", v, 0, t); t += gap; gap *= 0.78; }
    });
    cap("bounce");
  }
  function whoosh() {
    playS("trolley", 0.28 * envVol(), function (ok) {
      if (!ok) noiseHit(1.5, 0.035 * envVol(), "bandpass", 250, 1100);
    });
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
    if (env === "pond") {
      if (r < 0.4) crow(); else if (r < 0.65) dog(); else plop();
      return;
    }
    if (env === "gym") {
      if (r < 0.45) clank(); else if (r < 0.7) grunt(); else outdoorPick();
    } else if (env === "shop") {
      if (r < 0.4) scanner(); else if (r < 0.6) chime(); else outdoorPick();
    } else {
      outdoorPick();
    }
  }
  function plop() {
    tone(320, 90, 0.12, "sine", 0.05);
    noiseHit(0.1, 0.03, "bandpass", 900, 300);
  }
  function flutter() {
    playS("pigeons", 0.3, function (ok) {
      if (ok) return;
      noiseHit(0.28, 0.035, "bandpass", 1700, 900);
      noiseHit(0.18, 0.025, "bandpass", 2100, 1100, 0.12);
    });
  }
  function taromat() {
    playS("taromat", 0.45, function (ok) {
      if (!ok) for (var i = 0; i < 4; i++) tone(880 - i * 40, 880 - i * 40, 0.08, "sine", 0.03, 0, i * 0.3);
    });
  }
  function door() {
    playS("door", 0.5, function (ok) {
      if (ok) return;
      noiseHit(0.12, 0.06, "lowpass", 300, 120);
      tone(70, 50, 0.18, "sine", 0.06, 0, 0.02);
    });
  }
  function carDoor() {
    playS("cardoor", 0.5, function (ok) {
      if (ok) return;
      noiseHit(0.08, 0.05, "lowpass", 400, 150);
      tone(90, 60, 0.12, "sine", 0.05);
    });
  }
  function ignition() {
    playS("ignition", 0.45, function (ok) {
      if (!ok) { noiseHit(0.5, 0.04, "bandpass", 200, 90); tone(60, 55, 0.6, "sawtooth", 0.03, 200, 0.3); }
    });
  }

  // ---- footsteps ----
  var stepFlip = false;
  function step(surface) {
    if (!ctx) return;
    stepFlip = !stepFlip;
    var p = 1 + (Math.random() - 0.5) * 0.25 + (stepFlip ? 0.06 : -0.06);
    if (surface === "grass") {
      noiseHit(0.09, 0.022, "bandpass", 900 * p, 350 * p);
    } else if (surface === "stair") {
      noiseHit(0.07, 0.03, "lowpass", 420 * p, 160 * p);
      tone(95 * p, 70 * p, 0.05, "sine", 0.02);
      noiseHit(0.06, 0.012, "lowpass", 380 * p, 150 * p, 0.1); // concrete echo
    } else if (surface === "interior") {
      noiseHit(0.05, 0.016, "lowpass", 500 * p, 220 * p);
    } else { // concrete / asphalt
      noiseHit(0.07, 0.026, "lowpass", 460 * p, 170 * p);
      tone(110 * p, 80 * p, 0.04, "sine", 0.013);
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

  // ---- procedural V6 engine ----
  // Firing pulse (saw+square) over a sub sine, plus filtered intake noise,
  // all through a lowpass that opens with RPM. Fully synthesized — no samples.
  var engN = null, eSpd = 0;
  function engineOn() {
    if (!ctx || engN) return;
    var out = ctx.createGain(); out.gain.value = 0; out.connect(master);
    var o1 = ctx.createOscillator(); o1.type = "sawtooth";
    var o2 = ctx.createOscillator(); o2.type = "square";
    var sub = ctx.createOscillator(); sub.type = "sine";
    var g1 = ctx.createGain(); g1.gain.value = 0.5;
    var g2 = ctx.createGain(); g2.gain.value = 0.14;
    var gs = ctx.createGain(); gs.gain.value = 0.55;
    var lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 480; lp.Q.value = 7;
    var ns = ctx.createBufferSource(); ns.buffer = noiseBuffer(); ns.loop = true;
    var nf = ctx.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 300; nf.Q.value = 0.6;
    var ng = ctx.createGain(); ng.gain.value = 0.02;
    o1.connect(g1); o2.connect(g2); g1.connect(lp); g2.connect(lp); lp.connect(out);
    sub.connect(gs); gs.connect(out);
    ns.connect(nf); nf.connect(ng); ng.connect(out);
    o1.start(); o2.start(); sub.start(); ns.start();
    engN = { out: out, o1: o1, o2: o2, sub: sub, ns: ns, lp: lp, nf: nf, ng: ng };
    engineSet(0);
  }
  function engineSet(spd) {
    eSpd = Math.abs(spd);
    if (!engN) return;
    var s = Math.min(1, eSpd / 15);
    var rpm = 0.16 + s * 0.84;                 // 0..1 normalized
    var fire = 30 + rpm * 118;                 // firing fundamental, Hz
    var wob = 1 + Math.sin(now() * 7) * 0.012; // tiny idle wobble
    engN.o1.frequency.value = fire * wob;
    engN.o2.frequency.value = fire * 1.5;
    engN.sub.frequency.value = fire * 0.5;
    engN.lp.frequency.value = 280 + rpm * 2500;
    engN.nf.frequency.value = 250 + rpm * 900;
    engN.ng.gain.value = 0.015 + s * 0.06;
    engN.out.gain.value = (0.05 + s * 0.12) * duckCur;
  }
  function engineOff() {
    if (!engN) return;
    try { engN.o1.stop(); engN.o2.stop(); engN.sub.stop(); engN.ns.stop(); } catch (e) {}
    try { engN.out.disconnect(); } catch (e) {}   // free the whole bus, not just the oscillators
    engN = null;
  }
  var skidT = 0;
  function skid() {
    var t = Date.now();
    if (t - skidT < 1200) return;
    skidT = t;
    // tyre scrub: two bandpass noise layers with a little pitch movement
    noiseHit(0.55, 0.05, "bandpass", 1800, 1150);
    noiseHit(0.42, 0.03, "bandpass", 2900, 1700, 0.05);
  }
  function horn() {
    // two polite honks, a major third through a soft lowpass
    function honk(when) {
      tone(440, 440, 0.26, "sawtooth", 0.05, 1500, when);
      tone(554, 554, 0.26, "sawtooth", 0.045, 1500, when);
      tone(880, 880, 0.26, "square", 0.018, 1900, when);
    }
    honk(0); honk(0.34);
  }
  var brakeT = 0;
  function brake() {
    var t = Date.now();
    if (t - brakeT < 2500) return;
    brakeT = t;
    noiseHit(0.5, 0.022, "bandpass", 3000, 4400); // rising disc squeal
    noiseHit(0.5, 0.012, "bandpass", 5200, 6000, 0.03);
  }

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
        tone(41, 41, 0.2, "sine", tg * 0.6);       // sub weight
      } else {
        noiseHit(0.05, tg * 0.45, "highpass", 6500, 0); // offbeat hat
      }
      if (tStep % 8 === 2) noiseHit(0.09, tg * 0.35, "bandpass", 1500, 1100); // clap
      if (tStep % 16 === 8) tone(155, 155, 0.09, "sawtooth", tg * 0.3, 900); // stab
      if (tStep % 32 === 24) noiseHit(1.6, tg * 0.2, "bandpass", 500, 4500); // riser
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
  api.radioTune = radioTune;
  api.radioInfo = radioInfo;
  api.onRadio = null;
  api.purr = purr;
  api.plop = plop;
  api.flutter = flutter;
  api.munch = munch;
  api.gulp = gulp;
  api.accStart = accStart;
  api.accGain = accGain;
  api.accStop = accStop;
  api.setRain = function (v) { if (rainGainN) rainGainN.gain.value = v; };
  api.setNight = function (n) { night = n; };
  api.setEnv = function (e) {
    env = e;
    if (windGain) windGain.gain.value = e === "out" ? 0.014 : 0.004;
    if (verbSend) verbSend.gain.value = verbFor(e);
  };
  api.voiceLine = voiceLine;
  api.voiceStop = voiceStop;
  api.tv = tv;
  api.step = step;
  api.door = door;
  api.carDoor = carDoor;
  api.ignition = ignition;
  api.taromat = taromat;
  api.skid = skid;
  api.horn = horn;
  api.brake = brake;
  api.gunshot = gunshot;
  return api;
})();
