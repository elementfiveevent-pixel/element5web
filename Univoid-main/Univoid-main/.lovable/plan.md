# UniVoid Landing Page — Full Redesign (Neubrutalism, No Gradients)

## Locked constraints (from your feedback)

- **No gradients anywhere.** Flat fills only. Depth comes from chunky borders + hard offset shadows.
- **Pure neubrutalism** — extends existing brand (paper bg `#FFFDF5`, 2.5px borders, `rounded-3xl`, hard `shadow-sketch`).
- **No theme/color/font changes** — reuse existing tokens in `index.css` and `tailwind.config.ts` as-is.
- **Real 3D feel** — achieved with generated 3D-rendered PNG illustrations (clay/plastic style, hard shadows, no gradient lighting) + parallax/tilt on scroll & hover. No Three.js/Spline (perf + matches flat brand).

## Page structure

```text
1.  HERO            — H1, sub, 2 CTAs, live stat chips, 3 floating 3D objects
2.  TRUST STRIP     — live counts in bordered chips (existing pattern)
3.  PROBLEM         — "scattered everywhere" — sticky-note collage of WhatsApp/Telegram/Drive icons crossed out
4.  SOLUTION        — "OS for college life" — single big 3D laptop render + 4 pillar cards
5.  FEATURES        — 5 zigzag rows (Materials, Events, Books, Projects, Community), each with its own 3D asset
6.  HOW IT WORKS    — 4 step cards with numbered brutalist badges
7.  WHY UNIVOID     — comparison table vs Telegram / WhatsApp / Drive / Random sites
8.  STATS           — animated counters in bordered tiles (live data)
9.  ROADMAP         — horizontal scroll timeline of upcoming features
10. FAQ             — existing 5 + 3 new, accordion (current pattern)
11. FINAL CTA       — oversized brutalist panel, single huge button, 3D trophy
```

Sections **not built** (need content from you, will scaffold empty so you can fill later): testimonials, partner-college logos, real product screenshots.

## 3D asset plan (generated PNGs, transparent bg)

Style prompt template: *"3D rendered clay/plastic illustration, matte finish, hard directional shadow, no gradient lighting, isolated on solid white background, flat color palette matching #FFFDF5 paper aesthetic."*

| File | Subject | Used in |
|---|---|---|
| `src/assets/3d-cap.png` | Graduation cap | Hero |
| `src/assets/3d-books.png` | Stack of books | Hero + Books feature row |
| `src/assets/3d-ticket.png` | Event ticket | Hero + Events feature row |
| `src/assets/3d-laptop.png` | Open laptop showing dashboard | Solution section |
| `src/assets/3d-folder.png` | Document folder | Materials feature row |
| `src/assets/3d-handshake.png` | Two hands meeting / puzzle pieces | Projects feature row |
| `src/assets/3d-community.png` | Group of avatars | Community feature row |
| `src/assets/3d-trophy.png` | Trophy | Final CTA |

Generated at `premium` tier where text/logo legibility matters, otherwise `standard`. All `transparent_background: true`.

## Motion (Framer Motion)

- Scroll-reveal: rise + fade per section (no scale gradients).
- 3D assets: subtle Y-float loop (3-4s) + mouse-tilt on desktop.
- Counters: count-up on intersection.
- Buttons: existing `btn-sketch` hover (translate + shadow snap) — no new gradient hover states.
- Respect `prefers-reduced-motion`; disable parallax/tilt on mobile.

## Files

**New**
- `src/components/landing/HeroBrutalist.tsx`
- `src/components/landing/ProblemCollage.tsx`
- `src/components/landing/SolutionSection.tsx`
- `src/components/landing/FeatureRow.tsx` (reusable zigzag)
- `src/components/landing/HowItWorksBrutalist.tsx`
- `src/components/landing/ComparisonTable.tsx`
- `src/components/landing/AnimatedStats.tsx` (uses existing `getPlatformStats`)
- `src/components/landing/Roadmap.tsx`
- `src/components/landing/FinalCTABrutalist.tsx`
- `src/components/landing/Floating3D.tsx` (wrapper: float loop + mouse-tilt)
- 8× `src/assets/3d-*.png`

**Edited**
- `src/pages/Index.tsx` — composes the new sections; keeps `AuthModal`, `useAuth`, role-redirect, `SEOHead`, `FloatingDoodles`, Header/Footer/BottomNav.

**Untouched**
- `src/index.css`, `tailwind.config.ts` (no token, no keyframe changes — float/tilt done inline via Framer Motion)
- Header, Footer, BottomNav, AuthModal
- All routes, services, auth, backend

**Dependencies**
- `framer-motion` if not already present (one add). No other deps.

## Performance

- Hero PNG `loading="eager" fetchpriority="high"`; rest `loading="lazy"`.
- Below-fold sections wrapped in `React.lazy` + `Suspense` (matches current `Index.tsx` pattern with `FloatingDoodles`).
- Parallax/tilt off below `md` and under reduced-motion.
- Reuses cached `getPlatformStats`; no new queries.

## SEO

- Refine `SEOHead` title to `"UniVoid — The Operating System for College Life"`, description to match new hero copy.
- One `<h1>` (hero). Section `<h2>`s carry keywords: study materials, college events, project partners, book exchange.
- Structured data unchanged.

## Out of scope

- Header / Footer / BottomNav redesign
- Theme tokens, brand colors, fonts
- Any gradient (banned)
- Backend, auth, routes
- Testimonials / partner logos / real screenshots (need your content)

Approve and I build it in one pass.