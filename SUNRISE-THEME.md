# Sunrise — theme layer for the JMB Contractor Portal (read this before touching the look)

Tested on a local copy of `employee-portal` (commit `b69c32d`) in Chromium. Nothing in the data, logic or features changes — this is three files plus two lines in `index.html`.

## The palette

| Role | Hex | Use |
|---|---|---|
| Ink 900 / 700 | `#1C1714` / `#3D3530` | headings, big numbers / body text, menu labels |
| Grey 600 / 400 | `#6E655F` / `#9A918A` | captions, inactive icons / placeholders only |
| Line | `#ECE6E0` | card borders, dividers |
| Canvas / Surface | `#FAF8F6` / `#FFFFFF` | page background / cards, sidebar, inputs |
| Orange 500 | `#F26A1B` | icons, bars, active marks, hero watermark (not small text) |
| Button | `#C84A0C` | primary buttons, badges (white text 4.7:1) |
| Orange 700 | `#C2410C` | orange text: links, active menu label, greeting |
| Orange 100 / 50 | `#FFE4D1` / `#FFF4EC` | chip backgrounds / active row, hero wash |
| Success | `#16A34A` (text `#15803D`) | on time, approved, clean |
| Warning | `#D97706` (text `#B45309`) | late, low, needs attention |
| Danger | `#DC2626` (text `#B91C1C`) | absent, rejected, errors |
| Teal | `#0F8F8F` (text `#0B7A7A`) | charts, "Live", info banners |
| Plum | `#6A3FC7` | Ora only |

Rules: one orange focus per area; green/amber/red only ever mean status; plum only means Ora; cards are white with a 1 px Line border; the only gradients are the hero wash and the logo. All tokens are at the top of `sunrise.css` — change a hex there and it changes everywhere.

## What's in the zip

| File | What it is |
|---|---|
| `sunrise.css` | The whole look. Every rule is scoped to `body.au-sunrise`. |
| `sunrise.js` | Reads `?theme=sunrise`, adds the body class, keeps the real JMB logo in the sidebar, writes the page title + date into the top bar, starts the Messages rail collapsed. |
| `sunrise-logo.png` | The full-color JMB logo (256 px): sidebar + hero watermark. |
| `sunrise-theme.patch` | A git patch with all of the above incl. the `index.html` change (`git apply sunrise-theme.patch`). |
| `screenshots/` | Before/after and the themed tabs. |

## Install (2 minutes)

1. Copy `sunrise.css`, `sunrise.js` and `sunrise-logo.png` next to `index.html` (repo root).
2. Add these two lines right before `</body>` in `index.html` — the **last** `</body>`; there is an earlier one inside a JS string:
   ```html
   <!-- SUNRISE THEME: loads last so it wins the cascade; scoped to body.au-sunrise -->
   <link rel="stylesheet" href="sunrise.css?v=1">
   <script src="sunrise.js?v=1"></script>
   ```
   Or apply the patch: `git apply sunrise-theme.patch`
3. Deploy. Open `https://portal.jmbvirtuals.com/?theme=sunrise` — it is remembered in `localStorage['aura_theme']` (the key Aura already uses). `?theme=light` switches back to Aura.

**Default:** `sunrise.js` line 10 makes the new look the default for everyone. For an opt-in rollout (URL only), change
`var mode = q || saved || 'sunrise';` to `var mode = q || saved || 'light';`.

## How it works (so you can edit it safely)

- The portal's old style layers use id-heavy selectors with `!important` (e.g. `html body.app-authed #dashboard-hero .hstat:nth-child(2) .hstat-ic`). To outrank them without editing them, the theme nests everything under `#dashboard-screen#dashboard-screen#dashboard-screen` — a repeated id counts three times, which is legal CSS.
- It uses **native CSS nesting** (Chrome 120+, Safari 17.2+, Firefox 117+). Older browsers skip the nested blocks and just show the Aura look. To support older browsers, run the file through Lightning CSS / postcss-nesting once.
- Inline-styled colors from the old code (`style="color:#a855f7"` etc.) are remapped in section 8 of the CSS. If a new component still shows an off-palette color, add its hex to that list or give it a class.
- Top bar title + date: `sunrise.js` wraps `switchTab()` and sets `data-sr-title` / `data-sr-date` on the `<header>`; the CSS draws them with `::before` / `::after`. Tab names are in the `TITLES` map in `sunrise.js`.
- Sidebar: `.header-logo` is moved into `.tabs` by `renderDashboard()`, and the app swaps the logo `<img>` for an inline outline SVG — `sunrise.js` watches that `src` and puts `sunrise-logo.png` back.
- Messages rail: starts collapsed (`body.au-dock-hidden`); the chat button in the header opens it, remembered in `localStorage['sunrise_rail']`.
- Phones (< 900 px): the sidebar rules are desktop-only; the portal's own bottom bar is only recolored, and the hero stacks into one column.

## Motion (all in `sunrise.js` / `sunrise.css`, honours `prefers-reduced-motion`)

- **Sidebar "dock" magnification** — like the macOS Dock: the menu row under the cursor grows (+8.5%), its icon grows more (+42%), neighbours grow less and rows spread apart; everything springs back on mouse-leave. Tuning knobs at the top of the `dock()` block in `sunrise.js`: `RADIUS`, `ROW`, `ICON`, `SPREAD`. Desktop only (≥ 900 px).
- Hero: greeting, KPI tiles, clock and Ora pill rise in on load; the logo watermark floats slowly.
- Cards lift 2 px on hover; primary buttons lift on hover and press on click; tab content fades in on switch.

## Known leftovers (small, optional)

- Emoji used as icons (🌙 ✅ 👋 🏆 etc.) are untouched — replacing them needs markup changes (Lucide/Tabler icons), not CSS.
- On phones the Ora orb still floats bottom-right over the tab bar (Aura behaviour). To remove it there: `@media (max-width:899px){ #sprout-fab{ display:none !important } }`.
- Tabs I could only test empty (no API locally): Feed posts, Scorecard tables, Payslip list, Productivity charts, QA calendar. The generic card/chip/button/table rules cover them, but please eyeball each once with real data and send a screenshot if something still looks "Aura".

## Verify checklist

- [ ] Top bar shows the page name + today's date on the left.
- [ ] Overview: warm hero wash with the logo watermark, 3 KPI tiles, compact world clock, plum "✦ Ask Ora" pill, no rainbow borders.
- [ ] Sidebar: real JMB logo, grey icons, active row = Orange 50 + orange bar + orange icon.
- [ ] Attendance: green battery when clean (amber/red otherwise), step 1 orange, Time In orange button.
- [ ] Messages: opens from the header chat button; no rainbow lines.
- [ ] `?theme=light` restores Aura exactly.
