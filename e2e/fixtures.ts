import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'
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

interface Session {
  access_token: string
  [key: string]: unknown
}

async function signIn(request: APIRequestContext): Promise<Session> {
  const response = await request.post(`${url}/auth/v1/token?grant_type=password`, {
    headers: { apikey: anonKey!, 'Content-Type': 'application/json' },
    data: { email, password },
  })

  if (!response.ok()) {
    throw new Error(
      `Anmeldung des Testnutzers fehlgeschlagen (${response.status()}): ${await response.text()}`,
    )
  }

  return (await response.json()) as Session
}

/** Direkter REST-Zugriff als angemeldeter Testnutzer — zum Aufräumen. */
export interface Db {
  select: <T = unknown>(path: string) => Promise<T>
  patch: (path: string, body: unknown) => Promise<void>
  remove: (path: string) => Promise<void>
}

function makeDb(request: APIRequestContext, token: string): Db {
  const headers = {
    apikey: anonKey!,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  return {
    async select<T>(path: string) {
      const response = await request.get(`${url}/rest/v1/${path}`, { headers })
      expect(response.ok(), await response.text()).toBe(true)
      return (await response.json()) as T
    },
    async patch(path, body) {
      const response = await request.patch(`${url}/rest/v1/${path}`, { headers, data: body })
      expect(response.ok(), await response.text()).toBe(true)
    },
    async remove(path) {
      const response = await request.delete(`${url}/rest/v1/${path}`, { headers })
      expect(response.ok(), await response.text()).toBe(true)
    },
  }
}

export const test = base.extend<{ authedPage: Page; db: Db }>({
  authedPage: async ({ page, request }, use) => {
    test.skip(!hasCredentials, 'E2E_EMAIL/E2E_PASSWORD nicht gesetzt — angemeldete Tests übersprungen.')
    const session = await signIn(request)
    const key = storageKey(url!)

    await page.addInitScript(
      ([k, value]) => {
        window.localStorage.setItem(k as string, value as string)
      },
      [key, JSON.stringify(session)] as const,
    )

    await page.goto('./')
    await expect(
      page.getByRole('navigation', { name: 'Hauptnavigation' }).filter({ visible: true }),
    ).toBeVisible()
    await use(page)
  },

  db: async ({ request }, use) => {
    test.skip(!hasCredentials, 'E2E_EMAIL/E2E_PASSWORD nicht gesetzt — angemeldete Tests übersprungen.')
    const session = await signIn(request)
    await use(makeDb(request, session.access_token))
  },
})

export { expect }
