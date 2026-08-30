import { test as base, expect, type Page } from '@playwright/test'
import { normalizeSupabaseUrl } from '../src/lib/supabaseUrl'

/**
 * Angemeldete Tests.
 *
 * Magic Link lässt sich nicht automatisieren, deshalb meldet sich der Test per
 * Passwort an der Supabase-Auth-API an und legt die Session in localStorage —
 * genau dort, wo supabase-js sie erwartet. Die App selbst bleibt unverändert
 * bei Magic Link.
 *
 * Nötige Env-Variablen (siehe README): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY,
 * E2E_EMAIL, E2E_PASSWORD. Fehlt eine davon, werden die Tests übersprungen.
 */

const url = normalizeSupabaseUrl(process.env.VITE_SUPABASE_URL)
const anonKey = process.env.VITE_SUPABASE_ANON_KEY
const email = process.env.E2E_EMAIL
const password = process.env.E2E_PASSWORD

export const hasCredentials = Boolean(url && anonKey && email && password)

/** `sb-<project-ref>-auth-token` — der Storage-Key von supabase-js v2. */
function storageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split('.')[0]
  return `sb-${ref}-auth-token`
}

async function signIn(page: Page) {
  const response = await page.request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anonKey!, 'Content-Type': 'application/json' },
    data: { email, password },
  })

  if (!response.ok()) {
    throw new Error(
      `Anmeldung des Testnutzers fehlgeschlagen (${response.status()}): ${await response.text()}`,
    )
  }

  const session = await response.json()
  const key = storageKey(url!)

  await page.addInitScript(
    ([k, value]) => {
      window.localStorage.setItem(k as string, value as string)
    },
    [key, JSON.stringify(session)] as const,
  )
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    test.skip(!hasCredentials, 'E2E_EMAIL/E2E_PASSWORD nicht gesetzt — angemeldete Tests übersprungen.')
    await signIn(page)
    await page.goto('./')
    await expect(
      page.getByRole('navigation', { name: 'Hauptnavigation' }).filter({ visible: true }),
    ).toBeVisible()
    await use(page)
  },
})

export { expect }
