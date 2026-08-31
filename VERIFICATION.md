# Verification

Stand: 31.08.2026 · Phasen 1–3 umgesetzt, live deployt.

Legende: **PASS** = geprüft und bestanden · **FAIL** = geprüft bzw. nicht
verifizierbar, mit Begründung · **OFFEN** = gehört zu einer späteren Phase.

## Technisch

| # | Kriterium | Status | Beleg |
|---|---|---|---|
| 1 | `npm run build` läuft ohne Fehler | **PASS** | `✓ built in 13.62s` · PWA `precache 12 entries (494.82 KiB)` |
| 2 | `npx tsc --noEmit` meldet null Fehler | **PASS** | Exit-Code 0, keine Ausgabe |
| 3 | `npm run lint` meldet null Errors | **PASS** | `eslint .` → keine Ausgabe, 0 Probleme |
| 4 | `npx playwright test` — alle Tests grün | **PASS** | Lokal `26 passed, 4 skipped`; in CI (Lauf 33327264963) grün. Die 4 übersprungenen sind die angemeldeten Tests, solange `E2E_EMAIL`/`E2E_PASSWORD` fehlen. |
| 5 | GitHub Actions deployt auf Pages, Live-URL liefert HTTP 200 | **PASS** | Lauf `33327264963`: `Lint, Typecheck, Tests, Build: success`, `GitHub Pages: success`. `curl https://bittnerluis06-bit.github.io/Weekly/` → **200**, Titel `Weekly Planner`; `/manifest.webmanifest` → 200. |

Zusätzlich, nicht in der DoD gefordert:

| Kriterium | Status | Beleg |
|---|---|---|
| Unit- und Komponententests grün | **PASS** | `npm test` → `Test Files 6 passed (6)` · `Tests 41 passed (41)` |
| Migrationen im Live-Projekt eingespielt | **PASS** | Alle acht Tabellen antworten unter `/rest/v1/` mit HTTP 200; `rpc/seed_my_data` antwortet mit `P0001 seed_my_data: kein eingeloggter Nutzer` — Funktion existiert. Migration `0003` ist noch einzuspielen. |
| SPA-Deeplink auf GitHub Pages | **PASS** | `e2e/deeplink.spec.ts` → 2 passed. Live liefert `/Weekly/heute` das `404.html` mit Redirect-Skript aus; der HTTP-Status bleibt bauartbedingt 404, im Browser landet man auf der richtigen Route. |

## Funktional

| # | Kriterium | Status | Beleg / Anmerkung |
|---|---|---|---|
| 6 | Mission speichern, neu laden, Version wiederherstellen | **FAIL** | Test ist geschrieben (`e2e/mission.spec.ts`), läuft aber nicht: `E2E_PASSWORD` ist noch der Platzhalter `<dein Passwort>`, die Anmeldung scheitert mit `invalid_credentials` (HTTP 400). Magic Link lässt sich nicht automatisieren, deshalb meldet sich der Test per Passwort an (`e2e/fixtures.ts`). Mit dem echten Passwort läuft er ohne weitere Änderung mit. |
| 7 | Rolle + kurz-/langfristiges Ziel, getrennt dargestellt | **FAIL** | Gleiche Ursache; Test liegt in `e2e/roles.spec.ts`. |
| 8 | Woche planen: 5 Rollen × 2 Aktivitäten, Quadrant, Verteilung, aktivieren | **FAIL** | Gleiche Ursache; Test liegt in `e2e/week.spec.ts`. Ersatzweise geprüft: 13 Komponententests decken Warnungen bei 0 und >3 Aktivitäten, Quadrantenwahl, Tageszuordnung und die Zusammenfassung ab (`src/components/week/*.test.tsx`). |
| 9 | Fixtermine erscheinen an den richtigen Wochentagen | **FAIL** | Gleiche Ursache. Ersatzweise geprüft: `StepSchedule` zeigt einen Mittwochstermin unter Mittwoch und nicht unter Donnerstag, inaktive Termine gar nicht (`StepSchedule.test.tsx`). |
| 10 | Abhaken übersteht einen Reload | **OFFEN** | Phase 4 |
| 11 | Verschieben auf morgen in max. 2 Interaktionen | **OFFEN** | Phase 4 |
| 12 | Review-Kennzahlen korrekt berechnet | **OFFEN** | Phase 4 |
| 13 | Ohne Review keine neue Woche | **OFFEN** | Phase 4 |
| 14 | Zweiter Browser-Context sieht dieselben Daten | **OFFEN** | Phase 4 |

## Qualität

| # | Kriterium | Status | Beleg / Anmerkung |
|---|---|---|---|
| 15 | Screenshots 390×844 und 1440×900 unter `screenshots/` | **OFFEN** | Phase 5 |
| 16 | Lighthouse Mobile ≥ 90 (Performance, Accessibility) | **OFFEN** | Phase 5 |
| 17 | RLS-Test: Query ohne Login liefert null Datensätze | **PASS** | `e2e/rls.spec.ts` → `18 passed`. Alle acht Tabellen liefern ohne Login `[]`; ein `POST /rest/v1/roles` ohne Login scheitert mit `42501 new row violates row-level security policy`. |

## Offene Blocker

1. **Echtes Passwort des Testnutzers** — geliefert wurde der Platzhalter
   `<dein Passwort>`. Blockiert die Kriterien 6, 7, 8 und 9.
2. **Migration `0004_fixed_events_no_seed.sql`** im SQL Editor ausführen — löscht
   die alten Seed-Fixtermine und nimmt sie aus `seed_my_data()` heraus.
