/**
 * `createClient()` und die REST-Aufrufe hängen `/rest/v1/…` selbst an.
 * Steht der Pfad schon in der konfigurierten URL, entsteht
 * `/rest/v1/rest/v1/…` → PostgREST antwortet mit `PGRST125`.
 *
 * Im Supabase-Dashboard steht unter „Project URL“ die reine Basis-URL, aber der
 * REST-Endpunkt wird an anderer Stelle mit Suffix angezeigt — beide Varianten
 * landen erfahrungsgemäß in der Konfiguration. Deshalb hier normalisieren,
 * statt sich auf die Eingabe zu verlassen.
 */
export function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return raw
  return raw.trim().replace(/\/+$/, '').replace(/\/(rest|auth|realtime|storage)\/v1$/, '')
}
