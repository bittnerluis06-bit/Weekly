import { describe, expect, it } from 'vitest'
import { normalizeSupabaseUrl } from './supabaseUrl'

const BASE = 'https://abc.supabase.co'

describe('normalizeSupabaseUrl', () => {
  it('lässt die reine Projekt-URL unverändert', () => {
    expect(normalizeSupabaseUrl(BASE)).toBe(BASE)
  })

  it('entfernt den REST-Pfad', () => {
    expect(normalizeSupabaseUrl(`${BASE}/rest/v1/`)).toBe(BASE)
    expect(normalizeSupabaseUrl(`${BASE}/rest/v1`)).toBe(BASE)
  })

  it('entfernt auch andere API-Pfade', () => {
    expect(normalizeSupabaseUrl(`${BASE}/auth/v1/`)).toBe(BASE)
    expect(normalizeSupabaseUrl(`${BASE}/storage/v1`)).toBe(BASE)
  })

  it('entfernt Leerzeichen und überzählige Schrägstriche', () => {
    expect(normalizeSupabaseUrl(`  ${BASE}//  `)).toBe(BASE)
  })

  it('reicht leere Werte durch', () => {
    expect(normalizeSupabaseUrl(undefined)).toBeUndefined()
    expect(normalizeSupabaseUrl('')).toBe('')
  })
})
