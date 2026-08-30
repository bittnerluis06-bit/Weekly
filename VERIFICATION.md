# Verification

Stand: 30.08.2026 · Phase 1 abgeschlossen (bis auf das Deployment, das auf
Zugangsdaten wartet).

Legende: **PASS** = geprüft und bestanden · **FAIL** = geprüft, nicht bestanden ·
**OFFEN** = gehört zu einer späteren Phase, noch nicht prüfbar.

## Technisch

| # | Kriterium | Status | Beleg |
|---|---|---|---|
| 1 | `npm run build` läuft ohne Fehler | **PASS** | `✓ 1733 modules transformed` · `✓ built in 55.10s` · PWA `precache 7 entries (465.09 KiB)` |
| 2 | `npx tsc --noEmit` meldet null Fehler | **PASS** | Exit-Code 0, keine Ausgabe |
| 3 | `npm run lint` meldet null Errors | **PASS** | `eslint .` → Exit-Code 0, keine Ausgabe |
| 4 | `npx playwright test` — alle Tests grün | **PASS** | `6 passed (1.4m)` — 3 Tests × Projekte `mobile` (390×844) und `desktop` (1440×900) |
| 5 | GitHub Actions deployt auf Pages, Live-URL liefert HTTP 200 | **FAIL** | Workflow liegt unter `.github/workflows/deploy.yml`, ist aber noch nie gelaufen. Blockiert durch: Repo-Secrets `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` fehlen und Pages-Source steht noch nicht auf „GitHub Actions“. |

Zusätzlich geprüft, nicht in der DoD gefordert:

| Kriterium | Status | Beleg |
|---|---|---|
| Unit-Tests grün | **PASS** | `npm test` → `Test Files 1 passed (1)` · `Tests 6 passed (6)` (`src/lib/date.test.ts`) |

## Funktional

| # | Kriterium | Status | Anmerkung |
|---|---|---|---|
| 6 | Mission speichern, neu laden, Version wiederherstellen | **OFFEN** | Phase 2 |
| 7 | Rolle + kurz-/langfristiges Ziel, getrennt dargestellt | **OFFEN** | Phase 2 |
| 8 | Woche planen: 5 Rollen × 2 Aktivitäten, Quadrant, Verteilung, aktivieren | **OFFEN** | Phase 3 |
| 9 | Fixtermine erscheinen an den richtigen Wochentagen | **OFFEN** | Phase 3 — Daten liegen bereits in `seed_my_data()` |
| 10 | Abhaken übersteht einen Reload | **OFFEN** | Phase 4 |
| 11 | Verschieben auf morgen in max. 2 Interaktionen | **OFFEN** | Phase 4 |
| 12 | Review-Kennzahlen korrekt berechnet | **OFFEN** | Phase 4 |
| 13 | Ohne Review keine neue Woche | **OFFEN** | Phase 4 |
| 14 | Zweiter Browser-Context sieht dieselben Daten | **OFFEN** | Phase 4 |

## Qualität

| # | Kriterium | Status | Anmerkung |
|---|---|---|---|
| 15 | Screenshots 390×844 und 1440×900 unter `screenshots/` | **OFFEN** | Phase 5 |
| 16 | Lighthouse Mobile ≥ 90 (Performance, Accessibility) | **OFFEN** | Phase 5 |
| 17 | RLS-Test: Query ohne Login liefert null Datensätze | **OFFEN** | Prüfbar, sobald das Supabase-Projekt existiert. Migration `0001_init.sql` aktiviert RLS auf allen acht Tabellen mit genau einer Policy `user_id = auth.uid()`. |

## Offene Blocker

1. `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` — für `.env` lokal und als
   GitHub-Actions-Secrets.
2. Migrationen `0001` und `0002` im Supabase SQL Editor ausführen.
3. Repo → Settings → Pages → Source auf „GitHub Actions“ stellen.
4. Supabase → Authentication → URL Configuration: Site URL und Redirect URLs
   eintragen (siehe `supabase/README.md`).
