# Brain Rush

> A 60-second mental math and English vocabulary reaction game. Answers fall from the sky — catch the right ones, dodge the wrong ones, chase your high score.

![Brain Rush screenshot](screenshot.png)

**[brainrush.run](https://brainrush.run)** · Free, fully client-side, all data stays local · *[中文](README.md)*

## Quick Start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (includes typecheck + tests)
```

## How to Play

A question appears at the top, multiple answer blocks fall from above. Move your character left and right to catch the correct answer while avoiding wrong ones.

- **Controls**: Arrow keys or A/D on keyboard, drag on touch devices
- **Game over**: Lose all lives (1 life lost per wrong answer or missed question)
- **60s Timed Mode**: Unlimited lives + faster pace, perfect for quick rounds

| Difficulty | Lives | Design |
| --- | --- | --- |
| Easy | 4 | Slower blocks, simpler questions |
| Normal | 3 | Default — balanced speed and difficulty |
| Hard | 2 | Faster blocks, more options, harder questions |
| Devil | 1 | One mistake and you're out |

## Two Modes

### Math Rush

Addition, subtraction, multiplication, and division. Tune from the menu:

- **Operation focus**: Random / Mostly + − / Mostly × ÷
- **Number range**: Random / Within 10 / Within 20 / 50+
- **Toggles**: Allow remainders, allow negatives
- **Quick presets**: Balanced · Add/Sub 20 · Mul/Div Drill · Remainder · Signed Challenge

### Word Rush

English ↔ Chinese translation and sentence cloze. Toggle question direction and whether cloze questions appear.

Word bank is local (`data/vocab.ts` + `data/cloze.ts`), works offline, no external API. Difficulty tiers filter the word pool — harder difficulties draw from broader vocab and show more cloze questions.

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

## Data

Everything lives in browser `localStorage`: per-subject high scores, mistake log, 60s run history, avatar config, tuning preferences. No login, no uploads, exportable.

## Tech Stack

React 19 · TypeScript · Vite · Tailwind CSS · Canvas 2D · animejs · Web Audio API

Deployed on Cloudflare Pages — push to GitHub and it's live.

---

Docs · [Pixel character spec](docs/pixel-character-spec.md) · [Dev log](docs/progress.md)
