# Sub Photo — struktur, workflow og overvejelser

## Struktur

Statisk side (ingen server/backend). Indhold ligger i [data.js](data.js), rendering/adfærd i [app.js](app.js), styling i [styles.css](styles.css). De enkelte `.html`-filer holder kun sidespecifikt indhold — header, footer og hero-slider bygges af `app.js` på alle sider.

**Sider:**
- `index.html` — forside: hero-slideshow, "Velkommen"-sektion, kategori-oversigt, kontakt-CTA
- `galleri.html` — kategori-/event-galleri, styret via URL-hash (`galleri.html#bryllup`, `#gravid` osv.)
- `om.html`, `prisliste.html`, `anmeldelser.html`, `kontakt.html` — statiske indholdssider

**Kategorier i `data.js`:** gravid, newborn, morfarmig (Mor, far og mig), boern, portraet, bryllup (den eneste med under-events — pt. 8 stk., "Bryllup 1-8").

**Billeder:** ligger i `billeder/<kategori>/`, refereres fra `data.js`. Nye billeder skal både (1) lægges i den rigtige undermappe og (2) tilføjes i det rigtige array i `data.js` — ellers vises de ikke på siden.

**Admin-tilstand:** Cmd/Ctrl+Shift+A (kræver kode, se `ADMIN_CODE` i `app.js`) åbner en redigerings-UI i browseren (rækkefølge, fokuspunkt, slet/tilføj events m.m.). Ændringer gemmes kun i den enkelte browsers `localStorage` — de rammer aldrig `data.js` eller andre besøgende automatisk. For at gøre en ændring permanent skal den migreres manuelt ind i `data.js` (se Workflow).

## Workflow — sådan opdateres den live side

1. Rediger filerne lokalt i `subphoto-site`-mappen (billeder, `data.js`, `.html`, `app.js` osv.)
2. `git add` + `git commit` + `git push` til `main`
3. GitHub Pages bygger og udgiver automatisk (typisk under et minut)
4. Siden opdateres på **subphoto.dk**

**Admin-ændringer i browseren → permanent:** Hvis du har rettet noget via Cmd+Shift+A (rækkefølge, sletninger, nye events, fokuspunkt), skal du gemme admin-JSON'en (💾 Gem-knappen), lægge den i projektmappen, og bede om at få den migreret ind i `data.js` — ellers forsvinder ændringen, og andre besøgende ser den aldrig.

**Hosting:** GitHub Pages, repo `subash4700-web/subphoto-site` (offentligt — nødvendigt for gratis Pages). Domænet `subphoto.dk` peger via DNS hos one.com (A-poster + CNAME for `www`) på GitHub. HTTPS er slået til og tvunget.

## Overvejelser — ting der ikke er besluttet endnu

### Anmeldelses-funktion på hjemmesiden
Idé om at lade besøgende skrive en anmeldelse (1-5 stjerner + tekst) direkte på siden, som sendes til din mail.
- Kræver en tredjeparts formular-/mail-tjeneste, da siden er statisk uden egen server.
- Kun en idé — ikke igangsat.

### Domæne-overførsel til one.com som registrar
One.com tilbød gratis overførsel af `subphoto.dk` (fra Punktum dk) + 1 års fornyelse, hvis det skete inden 30. juni 2026.
- Uafhængigt af hjemmesidens DNS/hosting — påvirker intet af det, vi har lavet.
- Tjek med one.com om tilbuddet stadig gælder.

### Oprydning i DNS hos one.com
`nas.subphoto.dk` (peger på jeres NAS) blev nævnt som kandidat til sletning, da I ikke bruger ekstern adgang til hjemme-serveren. Kun relevant, hvis du er sikker på, intet andet bruger navnet.

### Oprydning i GitHub-repoet
Fravalgt for nu, men kan genovervejes:
- `subphoto-admin-17.json` / `-18.json` — overflødige admin-eksportfiler, allerede migreret ind i `data.js`.
- Billeder bevidst fjernet fra offentlige gallerier ligger stadig som filer i repoet (synlige for den, der browser GitHub direkte).

### Stray fil: "Sub Photo — Galleri.html"
Ikke koblet til navigationen nogen steder. Uklart om den stadig bruges — tjek og fjern evt.
