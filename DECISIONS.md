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
