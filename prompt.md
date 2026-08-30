# Auftrag: Weekly Planner Web-App nach Covey Habit 3

## Rolle & Arbeitsweise

Du baust eine produktionsreife Web-App. Arbeite in Phasen (siehe unten). Nach **jeder** Phase:
1. Führe die Verifikations-Kommandos aus.
2. Trage das Ergebnis in `VERIFICATION.md` ein (Kriterium → PASS/FAIL → Beleg).
3. Bei FAIL: selbst fixen, erneut prüfen. Erst dann weiter zur nächsten Phase.

Stelle mir Rückfragen nur, wenn eine Entscheidung nicht aus diesem Dokument ableitbar ist. Sonst entscheide selbst und dokumentiere die Entscheidung in `DECISIONS.md`.

---

## 1. Kontext

Die App bildet Stephen Coveys Habit 3 ("Put First Things First") als Wochenprozess ab. Der Zyklus, den die App erzwingen soll:

**Mission → Rollen → Ziele → Wochenplanung (2–3 Aktivitäten pro Rolle) → Terminieren → Tägliches Anpassen → Wochenreview**

Zentrale Logik: Zuerst kommen die "Big Rocks" (Quadrant II: wichtig, nicht dringend) in die Woche, danach der Rest. Die App darf mich nicht in eine reine To-do-Liste rutschen lassen — jede Woche startet bei den Rollen, nicht bei den Aufgaben.

Nutzer: eine einzige Person (ich). Sprache der gesamten UI: **Deutsch**. Primäres Gerät: **Smartphone** (tägliches Abhaken unterwegs), sekundär Laptop (Wochenplanung).

---

## 2. Tech-Stack (fix, nicht diskutieren)

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **State/Daten:** Supabase (Postgres + Auth via Magic Link) über `@supabase/supabase-js`, kein eigenes Backend
- **Hosting:** GitHub Pages, Deployment über GitHub Actions Workflow bei Push auf `main`
- **PWA:** `vite-plugin-pwa`, damit die App auf dem Homescreen installierbar ist und offline lesbar bleibt
- **Tests:** Vitest (Unit) + Playwright (E2E, inkl. Mobile-Viewport)
- Keine UI-Component-Library außer optional `lucide-react` für Icons. Kein Redux, kein Next.js.

Secrets: `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` über `.env` lokal und GitHub Secrets im Workflow. Der Anon-Key ist öffentlich — Absicherung passiert über Row Level Security, nicht über Geheimhaltung. RLS ist Pflicht: jede Tabelle nur für `auth.uid() = user_id` lesbar/schreibbar.

---

## 3. Datenmodell (Supabase)

Lege ein SQL-Migrationsfile `supabase/migrations/0001_init.sql` an mit:

- `mission` — id, user_id, content (text, Markdown), updated_at. Zusätzlich `mission_versions` (id, mission_id, content, created_at) für Versionshistorie.
- `roles` — id, user_id, name, description, sort_order, archived (bool)
- `goals` — id, role_id, title, description, horizon (`short` | `long`), target_date (nullable), status (`open` | `done` | `dropped`), created_at
- `weeks` — id, user_id, start_date (Montag, unique pro user), status (`planning` | `active` | `closed`)
- `week_items` — id, week_id, role_id, goal_id (nullable), title, quadrant (`Q1`–`Q4`), done (bool), planned_day (0–6, nullable), start_time (nullable), end_time (nullable), sort_order
- `fixed_events` — id, user_id, title, weekday (0–6), start_time, end_time, active (bool) → wiederkehrende Fixtermine
- `reviews` — id, week_id, wins (text), misses (text), learnings (text), next_week_focus (text), rating (1–5), created_at

Schreibe dazu ein Seed-Script mit meinen realen Daten:

**Rollen:** Freund · Sportler · Sohn · Kollege · Side Hustle - Persönlich


---

## 4. Screens & Funktionen

### 4.1 Mission
- Mission in Markdown schreiben, speichern, jederzeit bearbeiten.
- Bei jedem Speichern automatisch eine Version anlegen; alte Versionen einsehbar und wiederherstellbar.
- Die Mission ist beim Start der Wochenplanung **immer** sichtbar (eingeklappter Block oben, aufklappbar).

### 4.2 Rollen & Ziele
- Rollen anlegen, umbenennen, sortieren, archivieren (nicht löschen, wenn historische Wochen daran hängen).
- Pro Rolle: Liste kurzfristiger Ziele (dieses Quartal) und langfristiger Ziele (1–5 Jahre), klar getrennt.
- Ziele abhaken oder verwerfen; erledigte Ziele bleiben sichtbar in einem Archiv-Tab.

### 4.3 Wochenplanung (Kern)
Ein geführter Ablauf in vier Schritten, jeder Schritt ein eigener Bildschirm mit Fortschrittsanzeige:

1. **Rückblick auf die Mission** — Mission anzeigen, Review der Vorwoche anzeigen (falls vorhanden).
2. **Ziele pro Rolle wählen** — für jede Rolle 2–3 Aktivitäten für die kommende Woche festlegen. Jede Aktivität kann optional mit einem bestehenden Ziel verknüpft werden. Jede Aktivität bekommt eine Quadranten-Einordnung (Q1–Q4). Warnung anzeigen, wenn eine Rolle 0 oder mehr als 3 Aktivitäten hat.
3. **Terminieren** — Wochenansicht Mo–So. Fixtermine sind bereits eingetragen und nicht verschiebbar (nur global änderbar). Aktivitäten werden per Drag & Drop (Desktop) bzw. per Tap → Tagesauswahl (Mobile) auf einen Tag gelegt. **Planungsmodell: Fixtermine haben Uhrzeit, alle anderen Aktivitäten sind eine Tagesliste ohne Uhrzeit.** Optional kann einer einzelnen Aktivität trotzdem eine Uhrzeit gegeben werden, Pflicht ist es nie.
4. **Bestätigen** — Woche auf `active` setzen. Zusammenfassung: Aktivitäten pro Rolle, Verteilung über die Quadranten.

### 4.4 Tagesansicht (mobiles Hauptscreen)
- Zeigt den heutigen Tag: Fixtermine chronologisch, darunter die Tagesliste.
- Abhaken mit einem Tap, große Touch-Targets.
- Aktivitäten auf einen anderen Tag verschieben oder für heute neu hinzufügen ("Daily Adapting" — das muss schnell gehen, max. 2 Taps).
- Fortschrittsanzeige der Woche pro Rolle.

### 4.5 Wochenreview
- Am Ende der Woche (ab Sonntag, oder manuell auslösbar) Pflichtformular: Was lief gut / Was nicht / Learnings / Fokus nächste Woche / Bewertung 1–5.
- Automatisch berechnet und angezeigt: Erledigungsquote gesamt, Erledigungsquote pro Rolle, Verteilung der erledigten Aktivitäten über die Quadranten.
- Ohne abgeschlossenes Review lässt sich keine neue Woche planen — stattdessen erscheint der Hinweis mit direktem Link zum Review.

### 4.6 Google Calendar Sync (Phase 5, optional)
- Einbahn-Sync: geplante Aktivitäten mit Uhrzeit + Fixtermine als Events in einen dedizierten Kalender "Weekly Planner" schreiben.
- Rein clientseitig über Google Identity Services Token Client (OAuth Client ID als env-Variable), kein Server.
- Abschaltbar in den Einstellungen, App muss ohne diese Funktion voll nutzbar bleiben. Baue das **zuletzt** und breche nichts Bestehendes dafür.

---

## 5. UI-Anforderungen

- **Mobile-first.** Entwickle und teste primär bei 390×844. Danach Desktop bei 1440×900 prüfen.
- Untere Tab-Navigation auf Mobile: Heute · Woche · Rollen · Mission. Seitliche Navigation auf Desktop.
- Alle Touch-Targets mindestens 44×44 px. Kein horizontales Scrollen. Kein Text unter 14 px.
- Dark Mode über `prefers-color-scheme`.
- Ladezustände und Fehlerzustände sind ausgestaltet, keine leeren weißen Screens.
- Ruhiges, reduziertes Design: eine Akzentfarbe, klare Typo-Hierarchie, viel Weißraum. Keine Verläufe, keine Emojis in der UI.

---

## 6. Definition of Done — du prüfst das selbst

Lege `VERIFICATION.md` an und halte jedes Kriterium mit PASS/FAIL plus Beleg (Kommando-Output oder Screenshot-Pfad) fest. Die Aufgabe gilt erst als erledigt, wenn alle Punkte PASS sind:

**Technisch**
1. `npm run build` läuft ohne Fehler durch.
2. `npx tsc --noEmit` meldet null Fehler.
3. `npm run lint` meldet null Errors.
4. `npx playwright test` — alle Tests grün.
5. GitHub Actions Workflow läuft grün durch und deployt auf GitHub Pages; die Live-URL liefert HTTP 200.

**Funktional (als Playwright-E2E-Test abgebildet, Viewport 390×844)**
6. Mission anlegen → speichern → neu laden → Inhalt ist da → bearbeiten → alte Version ist wiederherstellbar.
7. Rolle anlegen → kurzfristiges und langfristiges Ziel hinzufügen → beides erscheint getrennt.
8. Neue Woche planen: für 5 Rollen je 2 Aktivitäten anlegen → Quadrant setzen → auf Tage verteilen → Woche aktivieren.
9. Fixtermine erscheinen automatisch in der neuen Woche an den richtigen Wochentagen.
10. In der Tagesansicht: Aktivität abhaken → Reload → Status bleibt erhalten.
11. Aktivität von heute auf morgen verschieben, in maximal 2 Interaktionen.
12. Woche abschließen: Review ausfüllen → Kennzahlen (Quote gesamt, pro Rolle, Quadranten) werden korrekt berechnet.
13. Ohne Review lässt sich keine neue Woche starten; der Hinweis erscheint.
14. Zweites Gerät simulieren (zweiter Browser-Context, gleicher Login) → Daten sind identisch sichtbar.

**Qualität**
15. Playwright-Screenshots bei 390×844 und 1440×900 von jedem Hauptscreen liegen unter `screenshots/` — prüfe sie selbst auf abgeschnittene Elemente, Overflow und unlesbare Textgrößen und behebe Gefundenes.
16. Lighthouse-Score (Mobile) ≥ 90 in Performance und Accessibility.
17. RLS-Test: eine Query ohne gültigen Login liefert null Datensätze. Belege das mit einem Testfall.

---

## 7. Vorgehen in Phasen

- **Phase 1:** Repo-Setup, Vite/React/TS/Tailwind, Supabase-Projekt-Anbindung, Migrations + Seed, Auth per Magic Link, GitHub Actions Deployment. → Kriterien 1–5.
- **Phase 2:** Mission + Rollen + Ziele. → Kriterien 6, 7.
- **Phase 3:** Wochenplanung (4 Schritte) + Fixtermine. → Kriterien 8, 9.
- **Phase 4:** Tagesansicht + Review + Kennzahlen. → Kriterien 10–14.
- **Phase 5:** PWA, Politur, Accessibility, Screenshots. → Kriterien 15–17.
- **Phase 6 (optional, erst nach Freigabe):** Google Calendar Sync.

Nach jeder Phase: committen mit aussagekräftiger Message, `VERIFICATION.md` aktualisieren, kurze Statusmeldung an mich (max. 5 Zeilen: was fertig ist, was PASS/FAIL ist, was als Nächstes kommt).

---

## 8. Was du nicht tust

- Keine Features, die hier nicht stehen (kein Habit-Tracker, keine Statistik-Dashboards, keine KI-Vorschläge, keine Team-Funktionen).
- Kein Erfinden von Daten in Tests — nutze das Seed-Script.
- Kein "sollte funktionieren". Wenn du ein Kriterium nicht verifizieren konntest, steht in `VERIFICATION.md` FAIL mit Begründung.
- Keine Secrets im Repo.

---

## 9. Was ich dir liefern muss

Sag mir **zu Beginn von Phase 1 in einer Liste**, welche Zugänge und Werte du von mir brauchst (Supabase-URL, Anon-Key, GitHub-Repo-Name, ggf. Google OAuth Client ID) und wie ich sie beschaffe. Warte diese Angaben ab, bevor du deployst — aber bau bis dahin alles, was ohne sie möglich ist.
