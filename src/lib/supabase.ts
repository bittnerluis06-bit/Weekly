import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Ohne konfigurierte Env-Variablen läuft die App im Demo-Modus:
 * die UI ist bedienbar, jeder Datenzugriff meldet einen klaren Fehler,
 * statt mit einem kryptischen Netzwerkfehler abzustürzen.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'public-anon-key-missing',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

/** Redirect-Ziel für den Magic Link — respektiert die GitHub-Pages-Base. */
export function authRedirectUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString()
}
