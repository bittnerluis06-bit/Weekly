# Verification

Stand: 31.08.2026 · Phasen 1–4 umgesetzt, live deployt.
Offen: Phase 5 (PWA-Politur, Screenshots, Lighthouse) und die optionale Phase 6.

Legende: **PASS** = geprüft und bestanden · **FAIL** = geprüft bzw. nicht
verifizierbar, mit Begründung · **OFFEN** = gehört zu einer späteren Phase.

## Technisch

| # | Kriterium | Status | Beleg |
|---|---|---|---|
| 1 | `npm run build` läuft ohne Fehler | **PASS** | `✓ built in 13.62s` · PWA `precache 12 entries (494.82 KiB)` |
| 2 | `npx tsc --noEmit` meldet null Fehler | **PASS** | Exit-Code 0, keine Ausgabe |
| 3 | `npm run lint` meldet null Errors | **PASS** | `eslint .` → keine Ausgabe, 0 Probleme |
| 4 | `npx playwright test` — alle Tests grün | **PASS** | Lokal `37 passed, 7 skipped`. Übersprungen sind ausschließlich die datenverändernden Tests im Desktop-Projekt: sie arbeiten auf demselben Testnutzer und laufen deshalb bewusst nur im Mobile-Projekt (390×844, das Zielgerät). |
| 5 | GitHub Actions deployt auf Pages, Live-URL liefert HTTP 200 | **PASS** | Lauf `33402965808`: `Lint, Typecheck, Tests, Build: success`, `GitHub Pages: success`. `curl https://bittnerluis06-bit.github.io/Weekly/` → **200**, Titel `Weekly Planner`; `/manifest.webmanifest` → 200. |

Zusätzlich, nicht in der DoD gefordert:

| Kriterium | Status | Beleg |
|---|---|---|
| Unit- und Komponententests grün | **PASS** | `npm test` → `Test Files 6 passed (6)` · `Tests 41 passed (41)` |
| Migrationen im Live-Projekt eingespielt | **PASS** | Alle acht Tabellen antworten unter `/rest/v1/` mit HTTP 200; `rpc/seed_my_data` antwortet mit `P0001 seed_my_data: kein eingeloggter Nutzer` — Funktion existiert. Migration `0003` ist noch einzuspielen. |
| SPA-Deeplink auf GitHub Pages | **PASS** | `e2e/deeplink.spec.ts` → 2 passed. Live liefert `/Weekly/heute` das `404.html` mit Redirect-Skript aus; der HTTP-Status bleibt bauartbedingt 404, im Browser landet man auf der richtigen Route. |

## Funktional

| # | Kriterium | Status | Beleg / Anmerkung |
|---|---|---|---|
| 6 | Mission speichern, neu laden, Version wiederherstellen | **PASS** | `e2e/mission.spec.ts`, grün in CI-Lauf `33402965808` (mobil und Desktop). Speichern → Reload → Inhalt da → zweite Fassung → Wiederherstellen der ersten → Reload. |
| 7 | Rolle + kurz-/langfristiges Ziel, getrennt dargestellt | **PASS** | `e2e/roles.spec.ts`, grün im selben Lauf. Prüft zusätzlich, dass kein Ziel im falschen Abschnitt auftaucht. |
| 8 | Woche planen: 5 Rollen × 2 Aktivitäten, Quadrant, Verteilung, aktivieren | **PASS** | `e2e/week.spec.ts`, grün im selben Lauf. Ergänzend 13 Komponententests zu Warnungen bei 0 und >3 Aktivitäten, Quadrantenwahl und Zusammenfassung. |
| 9 | Fixtermine erscheinen an den richtigen Wochentagen | **PASS** | `e2e/week.spec.ts`: Fixtermin über die Einstellungen angelegt, erscheint unter Mittwoch mit `17:15–19:00` und nicht unter Donnerstag. Ergänzend `StepSchedule.test.tsx` (inaktive Termine werden ausgeblendet). |
| 10 | Abhaken übersteht einen Reload | **PASS** | `e2e/today.spec.ts`: abhaken → `aria-pressed="true"` → Reload → weiterhin `true`. |
| 11 | Verschieben auf morgen in max. 2 Interaktionen | **PASS** | `e2e/today.spec.ts`: **eine** Interaktion — ein Tap auf „Auf morgen“. Der Test liest anschließend `planned_day` aus der Datenbank und vergleicht mit dem morgigen Wochentag. |
| 12 | Review-Kennzahlen korrekt berechnet | **PASS** | `e2e/review.spec.ts` mit bekannter Bilanz (4 Aktivitäten, 3 erledigt): gesamt `75 %`, Rolle A `1/2 · 50 %`, Rolle B `2/2 · 100 %`, erledigte Quadranten Q1 = 1, Q2 = 2, Q3 = 0, Q4 = 0. Zusätzlich: leeres Absenden wird abgewiesen. |
| 13 | Ohne Review keine neue Woche | **PASS** | `e2e/review.spec.ts`: Vorwoche ohne Review → `/woche` zeigt „Zuerst die Vorwoche abschließen“ mit Link zum Review, kein „Weiter“-Knopf. Nach dem Review ist die Planung offen und zeigt den Rückblick. |
| 14 | Zweiter Browser-Context sieht dieselben Daten | **PASS** | `e2e/today.spec.ts`: abhaken im ersten Context, zweiter Context mit demselben `storageState` sieht denselben Status. |

## Qualität

| # | Kriterium | Status | Beleg / Anmerkung |
|---|---|---|---|
| 15 | Screenshots 390×844 und 1440×900 unter `screenshots/` | **OFFEN** | Phase 5 |
| 16 | Lighthouse Mobile ≥ 90 (Performance, Accessibility) | **OFFEN** | Phase 5 |
| 17 | RLS-Test: Query ohne Login liefert null Datensätze | **PASS** | `e2e/rls.spec.ts` → `18 passed`. Alle acht Tabellen liefern ohne Login `[]`; ein `POST /rest/v1/roles` ohne Login scheitert mit `42501 new row violates row-level security policy`. |

## Offene Blocker

1. Migrationen 0001–0004 sind laut Nutzer eingespielt; die Tests laufen gegen das
   Live-Projekt und bestätigen das indirekt.
2. Keine weiteren. Phase 5 (Kriterien 15–17, davon 17 bereits PASS) steht als
   Nächstes an.
