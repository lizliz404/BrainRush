# AGENTS.md

Project-specific guardrails for Brain Rush. Follow global instructions too; this file narrows recurring failure modes for this app.

## Product goal

Keep Brain Rush stable, fast, and maintainable. The desired end state is a mature game/app that only needs small tuning, copy, content, or visual tweaks later.

## Asset and brand rules

- The canonical neon Brain Rush logo asset is `public/brain-rush-icon-neon.svg`.
- Do not inline logo SVG in `index.html`, React components, JSON, or CSS.
- `components/BrainRushLogoIcon.tsx` must reuse the canonical static asset.
- Favicon/preload/OG/Twitter/Schema image references should stay aligned with the canonical asset unless there is a deliberate separate social image.
- Cross-product PEP Words links/icons should use existing static assets; do not paste SVG data URLs.

## Mobile interaction rules

- Do not implement mobile-only double-click/double-tap confirmation.
- For compact top-bar actions on coarse pointers, use: first tap shows tooltip/state, then an explicit visible confirm button performs the action; or use a clear long-press pattern with explicit code comments and cancellation behavior.
- Desktop/fine pointer clicks may execute immediately.
- Avoid interaction patterns that depend on browser double-tap timing or page zoom behavior.

## Particle and visual tuning rules

- Keep particle behavior bounded and tunable through `PARTICLE_CONFIG` / `INTERACTION_CONFIG`.
- Do not add a particle/animation library unless an existing dependency cannot do the job. `animejs` is already present.
- Particle bursts should have hard caps. Current target shape: max about 50 particles, pointer-trigger throttling by pointer type, finite animation duration, and cleanup after animation.
- Replace vague visual instructions (“more glow”, “less bright”, “longer”) with numeric config changes.

## State-management rules

- `gameState` is the source of truth for major game screens. Do not directly manipulate DOM to switch major states.
- Modal/open state should live in React state; Escape and outside-click handlers should call state transition helpers such as close/exit functions.
- Avoid new state-management dependencies.

## SEO/GEO rules

- SEO work is not “add a couple meta tags.” Check the concrete surfaces that already exist:
  - `index.html` title/description/canonical/hreflang/OG/Twitter/JSON-LD
  - `public/sitemap.xml`
  - heading hierarchy and important `aria-label`s
- Keep analytics ID `G-TXVLTJJ878` intact unless explicitly asked.

## Verification

Before finishing code changes, run at least:

```bash
npm run check
```

Run `npm run build` when changing assets, Vite config, `index.html`, imports, public/static output, or game state wiring.

## Git/deploy

This project is GitHub-connected for deployment. For low-risk completed fixes, commit and push on the current branch after verification.
