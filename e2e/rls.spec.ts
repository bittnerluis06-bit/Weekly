import { expect, test } from '@playwright/test'

// DoD 17: Ohne gültigen Login liefert jede Query null Datensätze und jeder
// Schreibversuch wird abgelehnt — abgesichert allein über Row Level Security.

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY

const TABLES = [
  'mission',
  'mission_versions',
  'roles',
  'goals',
  'weeks',
  'week_items',
  'fixed_events',
  'reviews',
] as const

test.describe('Row Level Security', () => {
  test.skip(!url || !anonKey, 'VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY nicht gesetzt.')

  for (const table of TABLES) {
    test(`${table} liefert ohne Login null Datensätze`, async ({ request }) => {
      const response = await request.get(`${url}/rest/v1/${table}?select=id`, {
        headers: { apikey: anonKey! },
      })
      expect(response.status()).toBe(200)
      expect(await response.json()).toEqual([])
    })
  }

  test('Schreibversuch ohne Login wird abgelehnt', async ({ request }) => {
    const response = await request.post(`${url}/rest/v1/roles`, {
      headers: { apikey: anonKey!, 'Content-Type': 'application/json' },
      data: { name: 'Ohne Login', sort_order: 99 },
    })
    expect(response.ok()).toBe(false)
    expect(await response.text()).toContain('row-level security')
  })
})
