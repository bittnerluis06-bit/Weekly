import type { Quadrant, Role, WeekItem } from './database.types'

export const QUADRANTS: Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4']

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  Q1: 'Q1 — wichtig und dringend',
  Q2: 'Q2 — wichtig, nicht dringend',
  Q3: 'Q3 — dringend, nicht wichtig',
  Q4: 'Q4 — weder noch',
}

export const QUADRANT_SHORT: Record<Quadrant, string> = {
  Q1: 'wichtig · dringend',
  Q2: 'wichtig · nicht dringend',
  Q3: 'dringend · nicht wichtig',
  Q4: 'weder noch',
}

/** Coveys Vorgabe: 2–3 Aktivitäten pro Rolle und Woche. */
export const MIN_PER_ROLE = 2
export const MAX_PER_ROLE = 3

export interface RoleStats {
  role: Role
  total: number
  done: number
  /** Anteil erledigter Aktivitäten, 0–1. Ohne Aktivitäten: null. */
  rate: number | null
  /** Weicht die Anzahl von 2–3 ab? */
  warning: 'none' | 'empty' | 'too-many'
}

export function statsPerRole(roles: Role[], items: WeekItem[]): RoleStats[] {
  return roles.map((role) => {
    const own = items.filter((item) => item.role_id === role.id)
    const done = own.filter((item) => item.done).length
    return {
      role,
      total: own.length,
      done,
      rate: own.length === 0 ? null : done / own.length,
      warning: own.length === 0 ? 'empty' : own.length > MAX_PER_ROLE ? 'too-many' : 'none',
    }
  })
}

/** Erledigungsquote über alle Aktivitäten, 0–1. Ohne Aktivitäten: null. */
export function completionRate(items: WeekItem[]): number | null {
  if (items.length === 0) return null
  return items.filter((item) => item.done).length / items.length
}

/** Verteilung über die Quadranten — jeder Quadrant kommt vor, auch mit 0. */
export function quadrantDistribution(items: WeekItem[]): Record<Quadrant, number> {
  const result: Record<Quadrant, number> = { Q1: 0, Q2: 0, Q3: 0, Q4: 0 }
  for (const item of items) result[item.quadrant] += 1
  return result
}

export function formatPercent(rate: number | null): string {
  if (rate === null) return '–'
  return `${Math.round(rate * 100)} %`
}
