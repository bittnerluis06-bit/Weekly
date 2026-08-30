import { describe, expect, it } from 'vitest'
import { addDays, formatTime, startOfWeek, toISODate, toWeekday } from './date'

describe('toWeekday', () => {
  it('bildet Montag auf 0 und Sonntag auf 6 ab', () => {
    expect(toWeekday(new Date(2026, 7, 24))).toBe(0) // Montag
    expect(toWeekday(new Date(2026, 7, 30))).toBe(6) // Sonntag
  })
})

describe('startOfWeek', () => {
  it('liefert für jeden Tag der Woche denselben Montag', () => {
    const monday = toISODate(startOfWeek(new Date(2026, 7, 24)))
    for (let i = 0; i < 7; i++) {
      expect(toISODate(startOfWeek(new Date(2026, 7, 24 + i)))).toBe(monday)
    }
    expect(monday).toBe('2026-08-24')
  })

  it('funktioniert über Monatsgrenzen hinweg', () => {
    expect(toISODate(startOfWeek(new Date(2026, 8, 1)))).toBe('2026-08-31')
  })
})

describe('toISODate', () => {
  it('nutzt lokale Zeit, nicht UTC', () => {
    expect(toISODate(new Date(2026, 0, 1))).toBe('2026-01-01')
  })
})

describe('addDays', () => {
  it('verändert das Ausgangsdatum nicht', () => {
    const base = new Date(2026, 7, 24)
    addDays(base, 5)
    expect(toISODate(base)).toBe('2026-08-24')
  })
})

describe('formatTime', () => {
  it('kürzt Sekunden weg', () => {
    expect(formatTime('07:15:00')).toBe('07:15')
    expect(formatTime('18:00')).toBe('18:00')
  })
})
