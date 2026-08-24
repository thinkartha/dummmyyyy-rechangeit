# frontend

The React port of the pug/gulp site. Next.js App Router, static export.

```bash
npm run dev      # http://localhost:3001
npm run build    # -> out/
```

## What it is

Every page is a 1:1 transcription of the **compiled** HTML in `../public`, not of the
`.pug` sources — that HTML is what the browser renders today, so transcribing it is what
keeps the layout identical. Styling is the Phoenix theme CSS the gulp build already
produces (`/assets/css/theme.min.css`, `user.min.css`); nothing was restyled.

`public/assets` and `public/vendors` are symlinks to the gulp build's output, so the
theme's CSS, images, vendor libraries and `assets/js/integration/*` are shared, not
copied.

## Regenerating

`scripts/port-html.mjs` writes `app/**/page.tsx` and `components/app-layout.tsx` from
`../public/*.html`. Re-run it after the gulp build changes:

```bash
node scripts/port-html.mjs && npm run build
```

Hand edits to the generated files will be overwritten — change the source HTML, or the
script's rules, instead.

## Verifying

```bash
# static markup, all 50 pages
node scripts/compare.mjs index.html dashboard/observability.html ...

# post-JavaScript DOM, needs ../public on :8898 and out/ on :8899
node scripts/compare-rendered.mjs index.html dashboard/observability.html ...
```

Both diff the ported page against the pug page tag-for-tag.

## Deliberate differences

- **Full page loads, no client-side routing.** Links stay plain `<a href>`, exactly as
  the pug build had them. Phoenix's `phoenix.js` initialises everything once on
  DOMContentLoaded and offers no re-init, so SPA navigation would need every widget
  re-bound on each route change. Add `next/link` when that work is worth doing.
- **LTR only.** The pug build shipped an RTL copy of every stylesheet plus a head script
  that disabled one set at runtime; nothing sets `phoenixIsRTL`.
- **All vendor stylesheets load on every page** (9 small files) rather than per-page.
- **Legacy `.html` URLs redirect.** `npm run build` writes a stub at every route's old
  path, because `assets/js/integration/auth.js` — shared with the gulp build — redirects
  to hardcoded `.html` targets.

## Scope

50 pages: the landing page, the 5 auth pages, the observability dashboard, everything
under `apps/observability`, `apps/platform`, `apps/organization`, and the template pages
the sidebar links to. The other ~550 compiled Phoenix demo pages were left behind.
