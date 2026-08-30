import type { Weekday } from './database.types'

export const WEEKDAY_NAMES = [
  'Montag',
  'Dienstag',
  'Mittwoch',
  'Donnerstag',
  'Freitag',
  'Samstag',
  'Sonntag',
] as const

export const WEEKDAY_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'] as const

/** Wandelt `Date.getDay()` (0 = Sonntag) in unser Schema (0 = Montag). */
export function toWeekday(date: Date): Weekday {
  return ((date.getDay() + 6) % 7) as Weekday
}

/** Montag der Woche, in der `date` liegt — als lokales Datum ohne Zeitanteil. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  d.setDate(d.getDate() - toWeekday(d))
  return d
}

/** ISO-Datum `YYYY-MM-DD` in lokaler Zeit (nicht UTC — sonst kippt der Tag). */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/** `HH:MM:SS` oder `HH:MM` → `HH:MM` */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

export function formatDateLong(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

/** „12.05. – 18.05.2025“ */
export function formatWeekRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const start = monday.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
  const end = sunday.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  return `${start} – ${end}`
}
