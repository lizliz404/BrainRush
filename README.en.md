# Brain Rush

> A free kids' mental math × English vocabulary reaction game. Questions stay at the top, answers fall from the sky — catch the right ones, dodge the wrong ones, chase your 60-second high score.

![Brain Rush screenshot](screenshot.png)

**[brainrush.run](https://brainrush.run)** · Free · fully client-side · offline-friendly · all data stays local · *[中文](README.md)*

## Why it exists

Brain Rush is not a worksheet pasted into a browser. It turns **basic arithmetic, English vocabulary, and reaction speed** into short, repeatable game rounds.

Good for:

- 3-5 minute practice sessions for kids
- parent-child quick drills
- mental math speed, vocabulary recall, and attention training outside class
- a no-login, no-upload, offline-friendly educational game

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (includes typecheck + tests)
```

## How to Play

A question appears at the top, multiple answer blocks fall from above. Move your character left and right to catch the correct answer while avoiding wrong ones. Wrong answers and missed questions cost lives.

- **Controls**: Arrow keys or A/D on keyboard, drag on touch devices
- **Classic mode**: game ends when lives hit zero
- **60s timed mode**: unlimited lives + faster pace, built for quick score runs

| Difficulty | Lives | Design |
| --- | --- | --- |
| Easy | 4 | Slower blocks, simpler questions |
| Normal | 3 | Default — balanced speed and difficulty |
| Hard | 2 | Faster blocks, more options, harder questions |
| Devil | 1 | One mistake and you're out |

## Two Training Modes

### Math Rush

Addition, subtraction, multiplication, and division. Tune from the menu:

- **Operation focus**: Random / Mostly + − / Mostly × ÷
- **Number range**: Random / Within 10 / Within 20 / 50+
- **Toggles**: Allow remainders, allow negatives
- **Quick presets**: Balanced · Add/Sub 20 · Mul/Div Drill · Remainder · Signed Challenge

### Word Rush

English ↔ Chinese translation and sentence cloze. Toggle question direction and whether cloze questions appear.

The word bank is local (`data/vocab.ts` + `data/cloze.ts`), works offline, and uses no external API. Difficulty tiers filter the word pool — harder difficulties draw from broader vocab and show more cloze questions.

## Key Features

- **60-second mental math challenge**: short rounds, fast feedback, repeatable score chasing
- **Mistake log**: local review list for math and vocabulary misses
- **Local privacy**: high scores, mistakes, 60s run history, avatar config, and preferences stay in `localStorage`
- **Pixel characters**: 8 Canvas 2D pixel-art avatars unlocked by score
- **Zero account dependency**: no login, no uploads, no external question service

## Pixel Characters

8 pixel-art characters drawn entirely in Canvas 2D, unlocked by score:

| Score | Character | Head | Body | Legs |
| --- | --- | --- | --- | --- |
| 0 | Runner | 😄 | 🎽 | 👟 |
| 8 | Ninja | 🥷 | 🥋 | 🥾 |
| 16 | Skater | 😎 | 🧥 | 🛹 |
| 24 | Robot | 🤖 | 🔋 | 🦿 |
| 32 | Astronaut | 👩‍🚀 | 🛰️ | 🥾 |
| 40 | Scientist | 🧠 | 🥼 | 🧪 |
| 50 | Hero | 🦸 | ⚡ | 🥾 |
| 65 | Boss | 😈 | 🛡️ | 🔥 |

> Drawing contract → [pixel-character-spec.md](docs/pixel-character-spec.md)

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · Canvas 2D · animejs · Web Audio API

Deployed on Cloudflare Pages — push to GitHub and it's live.

---

Docs · [Pixel character spec](docs/pixel-character-spec.md) · [Dev log](docs/progress.md)
