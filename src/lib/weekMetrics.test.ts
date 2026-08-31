import { describe, expect, it } from 'vitest'
import {
  completionRate,
  formatPercent,
  quadrantDistribution,
  statsPerRole,
} from './weekMetrics'
import type { Quadrant, Role, WeekItem } from './database.types'

function role(id: string, name: string): Role {
  return {
    id,
    user_id: 'u',
    name,
    description: '',
    sort_order: 0,
    archived: false,
    created_at: '2026-08-24T00:00:00Z',
  }
}

function item(roleId: string, done: boolean, quadrant: Quadrant = 'Q2'): WeekItem {
  return {
    id: `${roleId}-${Math.random()}`,
    user_id: 'u',
    week_id: 'w',
    role_id: roleId,
    goal_id: null,
    title: 'Aktivität',
    quadrant,
    done,
    planned_day: null,
    start_time: null,
    end_time: null,
    sort_order: 0,
    created_at: '2026-08-24T00:00:00Z',
  }
}

describe('completionRate', () => {
  it('rechnet den Anteil erledigter Aktivitäten', () => {
    expect(completionRate([item('a', true), item('a', false)])).toBe(0.5)
    expect(completionRate([item('a', true), item('a', true)])).toBe(1)
  })

  it('liefert ohne Aktivitäten null statt NaN', () => {
    expect(completionRate([])).toBeNull()
  })
})

describe('statsPerRole', () => {
  it('zählt pro Rolle getrennt', () => {
    const roles = [role('a', 'Freund'), role('b', 'Sportler')]
    const items = [item('a', true), item('a', false), item('b', true)]
    const stats = statsPerRole(roles, items)

    expect(stats[0]).toMatchObject({ total: 2, done: 1, rate: 0.5 })
    expect(stats[1]).toMatchObject({ total: 1, done: 1, rate: 1 })
  })

  it('warnt bei 0 und bei mehr als 3 Aktivitäten', () => {
    const roles = [role('a', 'Leer'), role('b', 'Zuviel'), role('c', 'Passt')]
    const items = [
      ...Array.from({ length: 4 }, () => item('b', false)),
      item('c', false),
      item('c', false),
    ]
    const stats = statsPerRole(roles, items)

    expect(stats[0]?.warning).toBe('empty')
    expect(stats[1]?.warning).toBe('too-many')
    expect(stats[2]?.warning).toBe('none')
  })

  it('setzt rate auf null, wenn eine Rolle keine Aktivitäten hat', () => {
    expect(statsPerRole([role('a', 'Leer')], [])[0]?.rate).toBeNull()
  })
})

describe('quadrantDistribution', () => {
  it('nennt jeden Quadranten, auch mit null Treffern', () => {
    const items = [item('a', false, 'Q2'), item('a', true, 'Q2'), item('a', false, 'Q1')]
    expect(quadrantDistribution(items)).toEqual({ Q1: 1, Q2: 2, Q3: 0, Q4: 0 })
  })
})

describe('formatPercent', () => {
  it('rundet auf ganze Prozent', () => {
    expect(formatPercent(0.666)).toBe('67 %')
    expect(formatPercent(1)).toBe('100 %')
  })

  it('zeigt einen Strich, wenn nichts zu rechnen ist', () => {
    expect(formatPercent(null)).toBe('–')
  })
})
