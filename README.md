# Weekly Planner

Wochenplanung nach Stephen Coveys Habit 3 („Put First Things First“).
Der Zyklus: Mission → Rollen → Ziele → Wochenplanung → Terminieren →
tägliches Anpassen → Wochenreview.

Einzelnutzer-App, deutsche UI, Mobile-first.

## Stack

Vite · React 19 · TypeScript · Tailwind CSS v4 · Supabase (Postgres + Magic-Link-Auth) ·
vite-plugin-pwa · Vitest · Playwright · GitHub Pages via Actions

## Einrichtung

```bash
npm install
cp .env.example .env      # Werte eintragen, siehe supabase/README.md
npm run dev
```

Ohne `.env` startet die App im Demo-Modus: die UI ist sichtbar, der Login zeigt
einen Hinweis auf die fehlende Konfiguration.

Supabase-Projekt, Migrationen und Auth-Redirects: **[supabase/README.md](supabase/README.md)**.

## Kommandos

| Kommando | Zweck |
|---|---|
| `npm run dev` | Dev-Server (Port 5173) |
| `npm run build` | Typecheck + Produktionsbuild nach `dist/` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Unit-Tests (Vitest) |
| `npm run test:e2e` | E2E-Tests (Playwright, Mobile 390×844 + Desktop 1440×900) |

Icons neu erzeugen (Windows): `powershell -File scripts/generate-icons.ps1`

### Angemeldete E2E-Tests

Magic Link lässt sich nicht automatisieren. Die Tests, die eine Session brauchen
(`e2e/mission.spec.ts`, `e2e/roles.spec.ts`), melden sich stattdessen per Passwort
an. Dafür in Supabase → Authentication → Users → **Add user** einen Testnutzer mit
Passwort und „Auto Confirm User“ anlegen und in die `.env` eintragen:

```
E2E_EMAIL=e2e@example.com
E2E_PASSWORD=…
```

Ohne diese Werte überspringen sich die betroffenen Tests, statt fehlzuschlagen.
Die App selbst kennt keinen Passwort-Login.

## Deployment

Push auf `main` startet `.github/workflows/deploy.yml`: Lint → Typecheck →
Unit-Tests → E2E → Build → GitHub Pages.

Einmalig im Repo einzurichten:

1. **Settings → Pages → Source**: `GitHub Actions`
2. **Settings → Secrets and variables → Actions**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`

Live-URL: `https://bittnerluis06-bit.github.io/Weekly/`

Der Anon-Key ist öffentlich und darf im Client stehen — abgesichert wird über
Row Level Security, nicht über Geheimhaltung.

## Weitere Dokumente

- [prompt.md](prompt.md) — Auftrag und Definition of Done
- [VERIFICATION.md](VERIFICATION.md) — Prüfstand pro Kriterium
- [DECISIONS.md](DECISIONS.md) — getroffene Entscheidungen
