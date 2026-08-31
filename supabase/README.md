# Supabase-Setup

## 1. Projekt anlegen

1. https://supabase.com → New Project (Free Tier reicht).
2. Region: `Central EU (Frankfurt)`.
3. Datenbank-Passwort notieren (wird für die App nicht gebraucht, nur für direkte DB-Zugriffe).

## 2. Migrationen einspielen

Ohne CLI, per Dashboard:

1. Supabase → **SQL Editor** → New query.
2. Inhalt von `migrations/0001_init.sql` einfügen → **Run**.
3. Danach dasselbe mit `migrations/0002_seed_function.sql`.
4. Und mit `migrations/0003_seed_roles_update.sql` (aktualisierte Rollenliste).
5. Und mit `migrations/0004_fixed_events_no_seed.sql` (Fixtermine nicht mehr im Seed).

Mit CLI (optional, braucht `supabase login` + Projekt-Ref):

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

## 3. Auth konfigurieren

Supabase → **Authentication**:

- **Providers → Email**: aktiviert lassen, „Confirm email“ an. Passwort-Login kann aus bleiben, wir nutzen Magic Link.
- **URL Configuration → Site URL**: `https://bittnerluis06-bit.github.io/Weekly/`
- **URL Configuration → Redirect URLs**: zusätzlich `http://localhost:5173/Weekly/` und `http://localhost:4173/Weekly/` eintragen.

## 4. Werte in die App

`.env` im Projektroot (aus `.env.example` kopieren):

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

Beide Werte zusätzlich als GitHub Actions Secrets hinterlegen
(Repo → Settings → Secrets and variables → Actions).

## 5. Seed

Nach dem ersten Login ruft die App `seed_my_data()` automatisch auf, sobald noch
keine Rollen existieren. Angelegt werden nur die fünf Rollen und eine leere
Mission — Fixtermine legst du selbst unter **Einstellungen** in der App an. Manuell im SQL Editor geht das nicht (dort ist
`auth.uid()` null) — dafür in der App auf **Einstellungen → Beispieldaten anlegen**.

## Row Level Security

Jede Tabelle hat RLS aktiv und genau eine Policy: `user_id = auth.uid()`.
Eine Query ohne gültiges Token liefert null Datensätze — der Anon-Key allein
gewährt keinen Lesezugriff.
