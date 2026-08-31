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

### D18 — Fixtermine bleiben im Seed, obwohl aus `prompt.md` entfernt
Commit `2df7eee` hat die Rollenliste geändert (jetzt: Freund · Sportler · Sohn ·
Kollege · Side Hustle - Persönlich) und die Fixtermin-Tabelle ersatzlos gestrichen.
Die Rollen sind in `0003_seed_roles_update.sql` nachgezogen. Die Fixtermine bleiben
vorerst im Seed: `fixed_events` ist in Abschnitt 3 weiterhin Teil des Datenmodells,
Phase 3 baut darauf auf, und es sind reale Termine — sie wieder zu entfernen ist
billiger, als sie zu rekonstruieren. **Rückfrage an den Nutzer offen.**

### D19 — Fixtermine werden nicht mehr geseedet (ersetzt D18)
Auf Rückfrage bestätigt: `fixed_events` bleibt im Datenmodell, startet aber leer
und wird in der App gepflegt. `0004_fixed_events_no_seed.sql` löscht die früher
geseedeten Zeilen (nur exakte Treffer der alten Seed-Werte, von Hand angelegte
Termine bleiben) und nimmt sie aus `seed_my_data()` heraus.

## Phase 3

### D20 — Einstellungen außerhalb der Tab-Leiste
Die untere Tab-Leiste ist laut Abschnitt 5 auf Heute · Woche · Rollen · Mission
festgelegt, ein fünfter Tab wäre ein Verstoß. Die Einstellungen hängen deshalb
auf Mobile in einer schmalen Kopfzeile (Zahnrad, 44px) und auf Desktop unten in
der Seitenleiste.

### D21 — Zuordnung per Auswahlfeld, Drag & Drop zusätzlich
`prompt.md` verlangt Tap → Tagesauswahl auf Mobile und Drag & Drop auf Desktop.
Umgesetzt als `<select>` pro Aktivität — das ist auf dem Smartphone ein Tap plus
Tagesauswahl und funktioniert per Tastatur — ergänzt um natives HTML5-Drag-&-Drop
auf die Tageskarten für die Maus. Kein DnD-Paket nötig.

### D22 — Uhrzeit nur als Startzeit
Für frei geplante Aktivitäten ist die Uhrzeit laut Abschnitt 4.3 optional und nie
Pflicht. Gespeichert wird nur `start_time`; `end_time` bleibt leer, weil eine
Dauer nirgends verlangt ist und ein Pflicht-Ende dem Tageslisten-Modell
widerspräche.

### D23 — Woche wird beim Öffnen angelegt
`getOrCreateWeek()` legt die Woche im Status `planning` an, sobald der Bereich
„Woche“ geöffnet wird. Alternative wäre ein expliziter Knopf gewesen; der
geführte Ablauf beginnt aber ohnehin bei Schritt 1, und `weeks` hat einen
Unique-Index auf `(user_id, start_date)`, sodass nichts doppelt entsteht.

### D24 — Komponententests für die Planungsschritte
Die angemeldeten E2E-Tests sind blockiert (kein Testnutzer-Passwort). Damit
Phase 3 nicht völlig ungeprüft bleibt, sind die drei Schritt-Komponenten mit
Testing Library abgedeckt: Warnungen bei 0 bzw. >3 Aktivitäten, Quadranten- und
Tageszuordnung, Fixtermine am richtigen Tag, optionale Uhrzeit.

## Phase 4

### D25 — „Auf morgen“ als eigener Knopf
Kriterium 11 verlangt höchstens zwei Interaktionen. Ein Auswahlfeld braucht zwei
(öffnen, Tag wählen); der häufigste Fall beim täglichen Anpassen ist aber
„schiebe ich auf morgen“. Dafür gibt es einen Knopf mit **einem** Tap, das
Auswahlfeld für jeden anderen Tag bleibt daneben.

### D26 — Review schließt die Woche ab
`saveReview()` setzt die Woche direkt auf `closed`. Ein separater Knopf „Woche
abschließen“ wäre ein zweiter Weg zum selben Ziel und könnte einen Zustand
erzeugen, in dem die Woche geschlossen ist, aber kein Review existiert — genau
das, was Kriterium 13 verhindern soll.

### D27 — Review-Zwang gilt nur für die unmittelbare Vorwoche
Geprüft wird die jüngste Woche vor der aktuellen (`getPreviousWeek`). Alle Wochen
davor zu prüfen würde nach einer Pause eine Kette von Pflicht-Reviews erzeugen,
die niemand nachholt. Der Zyklus soll tragen, nicht blockieren.

### D28 — Bewertungs-Radios als volle Klickfläche
Ein `sr-only`-Radio im Label ist für Zeigegeräte nicht direkt anklickbar (das
Label fängt den Klick ab) — Playwright ist darüber gestolpert, und
Automatisierung wie Screenreader-Fokus leiden gleichermaßen. Jetzt liegt das
Eingabefeld mit `absolute inset-0 opacity-0` über der ganzen Fläche: echtes
Radio, 44px Ziel, ein Tap.

### D29 — Playwright läuft mit einem Worker
Alle angemeldeten Tests teilen sich einen Supabase-Testnutzer. Parallel laufende
Dateien haben sich gegenseitig Wochen und Aktivitäten gelöscht. Deshalb
`fullyParallel: false` und `workers: 1`. Zusätzlich räumt jede Datei ihre
Vorbedingungen selbst auf, sodass die Reihenfolge egal ist.

### D30 — Datenverändernde E2E-Tests nur im Mobile-Projekt
Dieselben Tests in zwei Projekten würden auf denselben Daten arbeiten. Sie laufen
deshalb nur bei 390×844 — dem laut Abschnitt 5 primären Gerät. Die Tests ohne
Datenzugriff (Smoke, RLS, Deeplink) laufen weiterhin in beiden Viewports.

### D17 — ESLint-React-Regeln nur auf `src/`
Playwrights Fixture-Parameter heißt `use` und wurde von `react-hooks/rules-of-hooks`
als Hook-Aufruf gewertet. Statt die Regel global zu lockern, gilt sie jetzt nur
für `src/`; `e2e/` und die Config-Dateien laufen ohne React-Regeln.
