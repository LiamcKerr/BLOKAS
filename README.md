# BLOKAS — a Vilnius story

A first-person PS2-style life sim. Vilnius, 2026. You are Dziugas, 22, broke,
hungover, and the proud owner of a Mercedes W124 with a court-ordered ignition
interlock device.

## What you can do

- Wander the flat: sleep, drink the fridge dry, watch election coverage, check
  the mirror
- Sit at the PC: **Call Youngmind** (plays the real call recording) or **Play
  League of Legends** (you will probably lose)
- Smoke on the balcony with a view of the Vilnius TV Tower — concrete shaft,
  ribbed observation cup, and the red-and-white striped antenna, modelled on
  the real thing. The balcony now overlooks the *actual* live neighbourhood:
  traffic, pedestrians, the car park, the shop, the gym, the club
- Brave the stairwell — ponia Genovaitė has opinions about your 1am guests
- Talk to **Petras**, the philosopher in residence outside the front door,
  seated among his can-based pension plan (you can spare him a euro)
- Try your luck with the girls on the street. Twenty different ways to be
  told no, all of them deserved
- Drive the Mercedes (if you can pass the breathalyser), or get locked out for
  45 minutes — and yes, you can get back out of the car now
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
