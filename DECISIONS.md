# Entscheidungen

Entscheidungen, die `prompt.md` offen lässt, mit Begründung.

## Phase 1

### D1 — Wochentage: 0 = Montag
`prompt.md` gibt `weekday` und `planned_day` als 0–6 vor, ohne den Startpunkt zu
nennen. Da `weeks.start_date` laut Vorgabe immer ein Montag ist, wäre eine
sonntagsbasierte Zählung ein Bruch. Deshalb durchgängig **0 = Montag … 6 = Sonntag**.
`toWeekday()` in `src/lib/date.ts` rechnet `Date.getDay()` entsprechend um.

### D2 — Tailwind v4 statt v3
v4 braucht keine `tailwind.config.js` und keine PostCSS-Kette; Konfiguration
läuft über `@theme` in `src/index.css` und das Vite-Plugin. Weniger bewegliche
Teile bei identischem Klassen-API. Folge: eigene Klassen werden als `@utility`
definiert, nicht als `@layer components` — sonst schlägt `@apply` darauf fehl.

### D3 — Handgepflegte DB-Typen
`src/lib/database.types.ts` wird nicht generiert. Sonst hinge `npm run build`
an einer laufenden Supabase-CLI mit Login — schlecht für CI. Die Datei ist die
manuelle Entsprechung zu `supabase/migrations/0001_init.sql`; bei Schemaänderung
mit ändern.

### D4 — Seed als SQL-Funktion `seed_my_data()`
Ein klassisches Seed-Script bräuchte eine feste `user_id`, die vor dem ersten
Login nicht existiert. Stattdessen eine idempotente Funktion, die `auth.uid()`
nutzt und aus der App heraus aufgerufen wird.

### D5 — `mission` mit `unique (user_id)`
Die App hat genau einen Nutzer und laut Screen-Beschreibung genau eine Mission
mit Versionshistorie. Die Historie liegt vollständig in `mission_versions`; das
Versionieren übernimmt ein Trigger, damit keine Version verloren geht, wenn
später ein anderer Client schreibt.

### D6 — `user_id` auch auf abgeleiteten Tabellen
`goals`, `week_items`, `reviews` und `mission_versions` hängen fachlich an einer
Elterntabelle. Trotzdem tragen sie `user_id`, damit jede RLS-Policy ohne Join
auskommt (`user_id = auth.uid()`) — einfacher zu prüfen und schneller.

### D7 — Demo-Modus ohne Supabase-Env
Fehlen `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, startet die App trotzdem
und zeigt einen erklärenden Hinweis auf dem Login-Screen, statt mit einem
Netzwerkfehler abzustürzen. Nötig, damit Build und E2E-Smoke-Tests ohne Secrets
laufen.

### D8 — SPA-Fallback über `public/404.html`
GitHub Pages liefert für `/Weekly/heute` einen 404. `404.html` merkt sich den
Pfad in `sessionStorage` und lädt die App-Wurzel, `index.html` stellt die Route
per `history.replaceState` wieder her.

### D9 — `base` = `/Weekly/`, per Env überschreibbar
Passend zum Repo `bittnerluis06-bit/Weekly`. Über `VITE_BASE_PATH` änderbar,
falls später eine eigene Domain dazukommt.

### D10 — Ein flaches `tsconfig.json`
Statt der Vite-üblichen Aufteilung in `tsconfig.app.json`/`tsconfig.node.json`
mit Project References. Grund: `prompt.md` fordert, dass `npx tsc --noEmit` null
Fehler meldet — bei Project References prüft dieser Aufruf gar nichts.

### D11 — Projekt-URL ohne `/rest/v1/`
Der gelieferte Wert für `VITE_SUPABASE_URL` endete auf `/rest/v1/`. `createClient()`
hängt diesen Pfad selbst an; mit dem Suffix entstünde `/rest/v1/rest/v1/…` → HTTP 404
(nachgemessen). In der `.env` steht deshalb die reine Projekt-URL.

### D12 — Publishable Key statt JWT-Anon-Key
`sb_publishable_…` funktioniert ab supabase-js v2 mit aktueller Minor-Version;
installiert ist 2.112.4. Bestätigt über `GET /auth/v1/settings` → HTTP 200.
Am Sicherheitsmodell ändert das nichts: der Schlüssel ist öffentlich, die
Absicherung macht RLS. Die Variable heißt weiterhin `VITE_SUPABASE_ANON_KEY`,
weil `prompt.md` diesen Namen vorgibt.

## Phase 2

### D13 — Eigener Markdown-Renderer statt Bibliothek
`prompt.md` erlaubt außer `lucide-react` keine zusätzlichen UI-Pakete. Der
Renderer in `src/lib/markdown.tsx` erzeugt ausschließlich React-Elemente, nutzt
kein `dangerouslySetInnerHTML` und lässt bei Links nur `http(s)` zu — HTML oder
`javascript:` aus dem Missionstext kann damit nicht ausgeführt werden. Der
Block-Parser liegt getrennt in `markdownParser.ts`, damit er ohne React testbar ist.

### D14 — Versionshistorie per Datenbank-Trigger
Das Anlegen einer Version macht der Trigger `mission_snapshot`, nicht der Client.
So geht keine Version verloren, egal welcher Client schreibt. „Wiederherstellen“
ist deshalb kein Sonderfall, sondern ein normales Speichern des alten Inhalts —
die Historie bleibt lückenlos.

### D15 — Rollen sortieren per Pfeiltasten, nicht Drag & Drop
Primäres Gerät ist das Smartphone; Drag & Drop mit 44px-Zielen ist dort fehleranfällig.
`prompt.md` fordert Drag & Drop ausdrücklich nur für das Terminieren (Phase 3, Desktop).

### D16 — Passwort-Login nur für E2E-Tests
Magic Link lässt sich nicht automatisieren. `e2e/fixtures.ts` holt sich per
`/auth/v1/token?grant_type=password` eine Session und legt sie in den
localStorage-Key von supabase-js. Die App selbst bleibt reiner Magic-Link-Login;
der Testpfad existiert nur im Testcode. Ohne `E2E_EMAIL`/`E2E_PASSWORD`
überspringen sich diese Tests, statt rot zu werden.

### D17 — ESLint-React-Regeln nur auf `src/`
Playwrights Fixture-Parameter heißt `use` und wurde von `react-hooks/rules-of-hooks`
als Hook-Aufruf gewertet. Statt die Regel global zu lockern, gilt sie jetzt nur
für `src/`; `e2e/` und die Config-Dateien laufen ohne React-Regeln.
