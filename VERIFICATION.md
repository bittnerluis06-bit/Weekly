# Verification

Stand: 30.08.2026 · Phasen 1 und 2 umgesetzt.

Legende: **PASS** = geprüft und bestanden · **FAIL** = geprüft bzw. nicht
verifizierbar, mit Begründung · **OFFEN** = gehört zu einer späteren Phase.

## Technisch

| # | Kriterium | Status | Beleg |
|---|---|---|---|
| 1 | `npm run build` läuft ohne Fehler | **PASS** | `✓ built in 13.62s` · PWA `precache 12 entries (494.82 KiB)` |
| 2 | `npx tsc --noEmit` meldet null Fehler | **PASS** | Exit-Code 0, keine Ausgabe |
| 3 | `npm run lint` meldet null Errors | **PASS** | `eslint .` → keine Ausgabe, 0 Probleme |
| 4 | `npx playwright test` — alle Tests grün | **PASS** | `18 passed` (RLS-Suite) und `6 passed` (Smoke); 4 angemeldete Tests werden übersprungen, solange `E2E_EMAIL`/`E2E_PASSWORD` fehlen |
| 5 | GitHub Actions deployt auf Pages, Live-URL liefert HTTP 200 | **FAIL** | Noch kein Push erfolgt. Pages-Source und Secrets sind laut Nutzer gesetzt; wird mit dem Phase-2-Push geprüft. |

Zusätzlich, nicht in der DoD gefordert:

| Kriterium | Status | Beleg |
|---|---|---|
| Unit-Tests grün | **PASS** | `npm test` → `Test Files 2 passed (2)` · `Tests 14 passed (14)` |
| Migrationen im Live-Projekt eingespielt | **PASS** | Alle acht Tabellen antworten unter `/rest/v1/` mit HTTP 200; `rpc/seed_my_data` antwortet mit `P0001 seed_my_data: kein eingeloggter Nutzer` — Funktion existiert |

## Funktional

| # | Kriterium | Status | Beleg / Anmerkung |
|---|---|---|---|
| 6 | Mission speichern, neu laden, Version wiederherstellen | **FAIL** | Test ist geschrieben (`e2e/mission.spec.ts`), läuft aber noch nicht: es fehlt ein Supabase-Testnutzer mit Passwort. Magic Link lässt sich nicht automatisieren, deshalb meldet sich der Test per Passwort an (`e2e/fixtures.ts`). Sobald `E2E_EMAIL`/`E2E_PASSWORD` gesetzt sind, läuft er ohne weitere Änderung mit. |
| 7 | Rolle + kurz-/langfristiges Ziel, getrennt dargestellt | **FAIL** | Gleiche Ursache; Test liegt in `e2e/roles.spec.ts`. |
| 8 | Woche planen: 5 Rollen × 2 Aktivitäten, Quadrant, Verteilung, aktivieren | **OFFEN** | Phase 3 |
| 9 | Fixtermine erscheinen an den richtigen Wochentagen | **OFFEN** | Phase 3 |
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

1. **Supabase-Testnutzer** — Authentication → Users → Add user, mit Passwort und
   „Auto Confirm User“. E-Mail und Passwort dann als `E2E_EMAIL`/`E2E_PASSWORD`
   in die lokale `.env` und als GitHub-Actions-Secrets. Blockiert 6 und 7.
2. **Kriterium 5** wird mit dem ersten Push auf `main` geprüft.
