# BLOKAS — a Vilnius story

A first-person PS2-style life sim. Vilnius, 2026. You are Dziugas, 22, broke,
hungover, and the proud owner of a Mercedes W124 with a court-ordered ignition
interlock device.

## What you can do

- Wander the flat: sleep, drink the fridge dry, watch election coverage, check
  the mirror
- Sit at the PC: **Call Youngmind** (plays the real call recording) or **Play
  League of Legends** (you will probably lose)
- Smoke on the balcony with a view of the Vilnius TV Tower
- Brave the stairwell — ponia Genovaitė has opinions about your 1am guests
- Drive the Mercedes (if you can pass the breathalyser), or get locked out for
  45 minutes
- Cross the road to the **parduotuvė**: buy beer, cigarettes, a kebab, and feed
  your empties to the taromat for honest money
- Pay €5 at **Sporto klubas "Geležis"**: bench press, lat pulldown, treadmill —
  tap E to rep
- Shoot hoops, browse the kiosk, give up on the trolleybus
- Listen: men shouting between the blocks, kids on the playground, dogs, crows,
  the 16 hissing past

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
netlify.toml      static publish config
```

three.js (r128) is loaded from cdnjs.
