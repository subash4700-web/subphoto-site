# Sub Photo — Homepage Map (index.html)

Static, no-build site. Content lives in [data.js](data.js), rendering/behavior in [app.js](app.js), styling in [styles.css](styles.css). `index.html` itself only holds the page-specific sections — header, footer, hero-slider chrome, and lightbox are injected by `app.js` on every page.

## Page shell (injected by app.js, all pages)

- **`<header id="hd">`** — built in the `/* header */` IIFE (app.js:52-68)
  - Brand link → `index.html` (`C.brand` = "Sub Photo")
  - Burger menu (mobile) + `<ul class="menu">` built from `NAV` (app.js:48):
    1. Hjem → index.html
    2. Om mig → om.html
    3. Galleri → galleri.html (has dropdown `<ul class="sub">` listing each `kategorier[].navn`)
    4. Prisliste → prisliste.html
    5. Anmeldelser → anmeldelser.html
    6. Kontakt → kontakt.html
  - `index.html`/`galleri.html` are `HERO_PAGES` — header starts transparent, gets `.scrolled` class after 60px scroll
- **`<footer>`** — brand, tagline (`C.tagline`), copyright line with phone (`C.tlf`)
- **Lightbox `#lb`** — hidden overlay for enlarging gallery images (not used directly on homepage, but markup is always present)

## index.html sections (top to bottom)

1. **Hero** (`<section class="hero">`, index.html:13-17)
   - `#slides` — populated by the `/* hero (forside) */` block (app.js:~93+) from `CONFIG.heroSlides` (data.js:7-16), an 8-image slideshow cycling through gravid/newborn/morfarmig/bryllup
   - `.hero-caption` — `#heroTag` (= `C.tagline`) + `#heroTitle` (= current slide's category name)
   - `.hero-arrows` — prev/next buttons + `#heroCount` ("1 / 8" style counter)

2. **Velkommen / intro band** (`<section class="band">`, two-col, index.html:19-30)
   - Left: eyebrow "Velkommen", H2 "Forevig en særlig begivenhed i dit liv med Sub Photo", two intro paragraphs, "Gå til galleri" button → galleri.html
   - Right: framed image (`billeder/morfarmig/morfarmig-04.jpg`)

3. **Galleri category grid** (`<section class="band">`, index.html:33-36)
   - Eyebrow "Galleri", H2 "Find inspiration til jeres shoot"
   - `#catgrid` (`.homecats`) — populated from `CONFIG.kategorier` (data.js:20+), one card per category (id, navn, hero image) linking to `galleri.html#<id>`. Categories currently: gravid, newborn, morfarmig (?), bryllup

4. **CTA / contact band** (`<section class="band">`, two-col, index.html:39-46)
   - Left: H2 "Skal vi skabe billeder sammen?", lead text, "Kontakt" button → kontakt.html
   - Right: framed image (`billeder/morfarmig/morfarmig-05.jpg`)

## Data dependencies (data.js → homepage)

| Field | Used for |
|---|---|
| `CONFIG.brand`, `CONFIG.tagline` | header brand, hero tag, footer, `<title>` |
| `CONFIG.tlf` / `tlfRaw` | footer, call links |
| `CONFIG.heroSlides[]` | hero slideshow (src + kat) |
| `CONFIG.kategorier[]` | nav "Galleri" dropdown + homepage `#catgrid` cards |
| `CONFIG.kontakt`, `CONFIG.ratings` | not used on homepage directly (kontakt/anmeldelser pages) |

## Other pages (not homepage, for reference)

- `galleri.html` — full gallery, categories + events, admin edit mode (`deleteKat`, `deleteEvent`, `EXTRA_EVENTS`, `TEXT_OVERRIDE` via localStorage)
- `om.html`, `prisliste.html`, `anmeldelser.html`, `kontakt.html` — static content pages
- `Sub Photo — Galleri.html` — appears to be a stray/duplicate file, not linked from NAV; verify if still needed

## Open questions / possible next steps

- [ ] Confirm all 4 category ids/names in `data.js` (gravid, newborn, morfarmig, bryllup) match what should show in the homepage grid and nav dropdown
- [ ] Decide whether `Sub Photo — Galleri.html` is dead weight and can be removed
- [ ] No `.git` repo currently initialized in this folder — consider `git init` if version history is wanted
