# Craft checklist pass — 2026-08-03

Product: **Brain Rush** (`brainrush.run`)  
Type: **kids game / practice tool**  
Starter: feel/feedback, reduced-motion, selection, loading honesty — **light motion only**; no serif chapter theater

## Already present

- OG / Twitter / WebApplication JSON-LD (`index.html`)
- Local autosave for scores, avatar, tuning, mistakes, timed runs
- Empty-ish strings for mistakes + timed board (thin)
- Feedback modal with submitting / submitted / error states
- Micro press shadows on primary CTAs; Escape exits play
- Particle confetti capped via `PARTICLE_CONFIG` / `INTERACTION_CONFIG`
- Mobile single-tap actions (no confirm-then-act)

## Implemented this pass

| Item | Files |
|---|---|
| 附 A: top progress bar | `src/styles/premium-one-pager.css`, `src/lib/premium-one-pager.ts`, wired in `App.tsx` |
| 附 A: SVG noise (dark `overlay` blend) | same; tokens cyan `#06b6d4` → indigo `#4f46e5` |
| 附 A: `::selection` + thin scrollbar + smooth scroll + prm kill-switch | same; removed root `selection:bg-none` |
| Skip chapter dots | `initPremiumOnePager({ enableChapters: false })` — game shell, not narrative LP |
| Skip pop-reveal | `enableReveal: false` — protect menu/LCP first paint |
| #22 prm on UI motion | `src/index.css` kills fade/pop/pulse; confetti skipped when reduced |
| #22 focus + ≤100ms press | `:focus-visible` ring + `button:active` in craft CSS |
| #3 loading honesty | `#root:empty` boot copy; in-round `preparingQuestion`; feedback “Sending…” |
| #11 / #12 / #13 copy | feedback error + next step; clear-data forever wording; empty states with CTA hint |

## Explicitly skipped

- **Chapter dots** — brief: no serif chapter theater; single-viewport game; &lt;3 narrative sections
- **pop-reveal** — protect brand/menu LCP; no long marketing scroll
- Scroll progress usefulness — `body` / shell `overflow: hidden`; bar mounts for pack consistency (dormant OK, same as carver/holopinch)
- Full 附 A package, Cmd+K, undo toast, dynamic OG — wrong stage for a free kids practice game

## Residual P2/P3 (do not implement now)

- Stronger `prefers-reduced-motion` path for canvas answer particles / shake in `GameEngine.tsx` (higher risk than chrome)
- Bind progress to nested menu/story scrollers if those panels grow past viewport
- Optional story-modal one-shot reveal on below-fold paragraphs only
- Status page / changelog — ops growth, out of this pass
