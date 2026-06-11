# BLOKAS — a Vilnius story

A first-person PS2-style life sim. Vilnius, 2026. You are Dziugas, 22, broke,
hungover, and the proud owner of a Mercedes W124 with a court-ordered ignition
interlock device.

## What you can do

- Wander the flat: sleep, drink the fridge dry, watch election coverage, check
  the mirror
- Sit at the PC: **Call Youngmind** (plays the real call recording) or **Play
  League of Legends** — now fully interactive: pick a role, pick a champion
  (Ezreal bot? "E in — kill Kai'Sa"), and make three in-game calls — the lane
  window, the Baron decision, the last fight — while the match unfolds on a
  live pixel minimap. Your choices set the win odds and your final KDA
- Earn honest money: **weed senelė's daržas** for 8 EUR a day (she has
  opinions, all of them affectionate), return empties at the taromat
- Follow the trail past the last block to the **tvenkinys**: birches, reeds,
  and a fishing minigame — cast, wait for the bite, strike. Kuoja, karosas,
  the rare lydeka, an old boot, and the occasional taromat-able beer can.
  Stone-skimming included
- **Drive beyond the blokas** — take the A1 exit at the **east end of the
  road, opposite klubas RŪSYS**, and pick a destination; a "VAŽIUOJAM"
  loading screen rolls its road stripes
  while the radio plays, then you arrive **behind the wheel** on that zone's
  own approach road. Drive up to the building, park anywhere, get out. Leave
  by driving back down the road past the "← A1" sign:
  - **MAXIMA** — aisles, a freezer row, the kulinarija lady with life advice,
    a self-checkout that accuses you, the loyalty card that has you, and
    everything cheaper: beer €1.09, pelmenai, black bread, energy drinks
  - **AKROPOLIS** — the mall: buy a HiM hoodie that marginally improves how
    girls reject you, grab a Čili Pica slice, see a film at Forum Kinas
    (four films, all devastating), toss a coin in the fountain, mourn the
    escalator (NEVEIKIA, tradition)
  - **SENAMIESTIS** — Old Town: cobblestones, the cathedral and its bell
    tower, a busker whose accordion waltz gets louder as you approach,
    tourists who need photos taken, a bench worth half an hour, and
    **Gediminas hill** — climb it, stand under the tower and the flag, and
    see the whole city including your own TV tower, small in the distance
- **Inventory [I]** — food and drink now go in your kuprinė. Beer, kebabas,
  pelmenai, bread, pizza, energy drinks: press I (or the touch button), pick
  an item, and eat or drink it anywhere with a first-person hand animation,
  gulps and munches included. Empties from cans go straight to your taromat
  stash. The fridge now drinks from the same supply
- **Saves automatically** — sleep or just play, then press C (or tap CONTINUE)
  on the title screen to pick up where you left off, day counter and all
- The blokas breathes: pigeons that scatter when you walk at them, streetlights
  that hum on at night, the shop keeping 8:00–22:00 and the gym 6:00–23:00,
  and traffic that finally looks like cars (wheels, headlights, the lot)
- Smoke on the balcony with a view of the Vilnius TV Tower — concrete shaft,
  ribbed observation cup, and the red-and-white striped antenna, modelled on
  the real thing. The balcony now overlooks the *actual* live neighbourhood:
  traffic, pedestrians, the car park, the shop, the gym, the club
- Brave the stairwell — ponia Genovaitė has opinions about your 1am guests
- Talk to **Petras**, the philosopher in residence outside the front door,
  seated among his can-based pension plan (you can spare him a euro)
- Try your luck with the girls on the street. Twenty different ways to be
  told no, all of them deserved
- Drive the white **2010 Mercedes-Benz E 350 4MATIC (W212)** — climb in first,
  *then* blow into the interlock from the driver's seat. Fail and you're back
  on the kerb for 45 minutes. While driving, **R** toggles the radio
  (lo-fi eurodance, four stations' worth of captions)
- Get the **hangover** you've earned: sleep drunk and wake to a grey vignette
  and heavy legs until you make coffee at the kettle
- **Answer Mama** when your phone buzzes on the desk — or doomscroll the rest:
  Greta's last read message, the banking app, the Oslo group chat
- Pet the **courtyard cat** (it usually allows it)
- Some days it **rains** — darker skies, closer fog, static on the courtyard
- Smoking is now a proper first-person animation (hand, ember, exhaled smoke),
  and the League match plays out live on a pixel minimap — feeding, the Baron
  steal, the nexus going up
- Cross the road and the **car park** to the **parduotuvė**: beer, cigarettes,
  a kebab, and the taromat for your empties
- Pay €5 at **Sporto klubas "Geležis"**: bench press, lat pulldown, treadmill —
  tap E to rep
- After 22:00, pay the cover at **klubas RŪSYS**: strobing basement techno
  (your looped track plus a synthesized kick), overpriced beer, an
  unbotherable DJ, and a dance floor that fixes nothing but helps anyway
- Shoot hoops, browse the kiosk, give up on the trolleybus
- Listen: men shouting between the blocks, kids on the playground (daytime
  only — nights belong to the dogs and the drunks), the 16 hissing past

## Controls

| Input | Action |
|---|---|
| WASD / arrows | Move / drive |
| Mouse (click to lock) or drag | Look |
| E / Enter | Interact, advance dialogue, rep in the gym |
| Space (hold) | Blow into the IID |
| Esc | Close the PC / end call / rack the weights |

Touch devices get a virtual stick and an on-screen E button.

## Run locally

Any static server works:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy to Netlify

**Via git:**

1. Push this folder to a GitHub/GitLab repo
2. In Netlify: Add new site → Import an existing project → pick the repo
3. Build command: *(leave empty)* · Publish directory: `.`
4. Deploy

**Via drag-and-drop:** zip nothing, build nothing — just drag this folder onto
https://app.netlify.com/drop

## Structure

```
index.html        shell + UI overlays
css/style.css     HUD, dialogue, PC, call, IID, gym minigame styles
js/audio.js       WebAudio: ambient courtyard synth, engine, IID, call ring
js/game.js        three.js world, areas, NPCs, traffic, minigames, game loop
assets/youngmind.ogg   the call recording
assets/club.ogg        the techno loop for klubas RŪSYS
netlify.toml      static publish config
```

three.js (r128) is loaded from cdnjs.
