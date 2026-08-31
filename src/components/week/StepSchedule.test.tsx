import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StepSchedule from './StepSchedule'
import type { FixedEvent, Role, WeekItem, Weekday } from '@/lib/database.types'

const ROLE: Role = {
  id: 'r1',
  user_id: 'u',
  name: 'Sportler',
  description: '',
  sort_order: 0,
  archived: false,
  created_at: '2026-08-24T00:00:00Z',
}

function weekItem(id: string, title: string, day: Weekday | null): WeekItem {
  return {
    id,
    user_id: 'u',
    week_id: 'w',
    role_id: 'r1',
    goal_id: null,
    title,
    quadrant: 'Q2',
    done: false,
    planned_day: day,
    start_time: null,
    end_time: null,
    sort_order: 0,
    created_at: '2026-08-24T00:00:00Z',
  }
}

const FIXED: FixedEvent = {
  id: 'f1',
  user_id: 'u',
  title: 'Lauftraining',
  weekday: 2,
  start_time: '17:15:00',
  end_time: '19:00:00',
  active: true,
  created_at: '2026-08-24T00:00:00Z',
}

const noop = () => {}

describe('StepSchedule', () => {
  it('zeigt Fixtermine am richtigen Wochentag mit Uhrzeit', () => {
    render(
      <StepSchedule
        items={[]}
        roles={[ROLE]}
        fixedEvents={[FIXED]}
        busy={false}
        onAssign={noop}
        onSetTime={noop}
      />,
    )

    const wednesday = screen.getByRole('heading', { name: 'Mittwoch' }).closest('li')!
    expect(within(wednesday).getByText('17:15–19:00 Lauftraining')).toBeInTheDocument()

    const thursday = screen.getByRole('heading', { name: 'Donnerstag' }).closest('li')!
    expect(within(thursday).queryByText(/Lauftraining/)).toBeNull()
  })

  it('blendet inaktive Fixtermine aus', () => {
    render(
      <StepSchedule
        items={[]}
        roles={[ROLE]}
        fixedEvents={[{ ...FIXED, active: false }]}
        busy={false}
        onAssign={noop}
        onSetTime={noop}
      />,
    )
    expect(screen.queryByText(/Lauftraining/)).toBeNull()
  })

  it('meldet die Tageszuordnung per Auswahl', async () => {
    const user = userEvent.setup()
    const onAssign = vi.fn()
    render(
      <StepSchedule
        items={[weekItem('i1', 'Laufen gehen', null)]}
        roles={[ROLE]}
        fixedEvents={[]}
        busy={false}
        onAssign={onAssign}
        onSetTime={noop}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Tag für „Laufen gehen“'), '2')
    expect(onAssign).toHaveBeenCalledWith('i1', 2)
  })

  it('kann eine Aktivität wieder von einem Tag lösen', async () => {
    const user = userEvent.setup()
    const onAssign = vi.fn()
    render(
      <StepSchedule
        items={[weekItem('i1', 'Laufen gehen', 2)]}
        roles={[ROLE]}
        fixedEvents={[]}
        busy={false}
        onAssign={onAssign}
        onSetTime={noop}
      />,
    )

    await user.selectOptions(screen.getByLabelText('Tag für „Laufen gehen“'), '')
    expect(onAssign).toHaveBeenCalledWith('i1', null)
  })

  it('zählt die noch nicht zugeordneten Aktivitäten', () => {
    render(
      <StepSchedule
        items={[weekItem('i1', 'Eins', null), weekItem('i2', 'Zwei', 3)]}
        roles={[ROLE]}
        fixedEvents={[]}
        busy={false}
        onAssign={noop}
        onSetTime={noop}
      />,
    )
    expect(screen.getByRole('heading', { name: /Noch keinem Tag zugeordnet \(1\)/ })).toBeInTheDocument()
  })

  it('gibt eine optionale Uhrzeit als Feld aus', () => {
    const onSetTime = vi.fn()
    render(
      <StepSchedule
        items={[weekItem('i1', 'Laufen gehen', 2)]}
        roles={[ROLE]}
        fixedEvents={[]}
        busy={false}
        onAssign={noop}
        onSetTime={onSetTime}
      />,
    )

    // Das Feld ist controlled: userEvent.type() würde Ziffer für Ziffer feuern
    // und dabei am unveränderten Prop-Wert hängen bleiben.
    const field = screen.getByLabelText('Uhrzeit für „Laufen gehen“ (optional)')
    expect(field).toHaveValue('')
    fireEvent.change(field, { target: { value: '18:30' } })
    expect(onSetTime).toHaveBeenCalledWith('i1', '18:30')
  })

  it('leert die Uhrzeit wieder', () => {
    const onSetTime = vi.fn()
    render(
      <StepSchedule
        items={[{ ...weekItem('i1', 'Laufen gehen', 2), start_time: '18:30:00' }]}
        roles={[ROLE]}
        fixedEvents={[]}
        busy={false}
        onAssign={noop}
        onSetTime={onSetTime}
      />,
    )

    const field = screen.getByLabelText('Uhrzeit für „Laufen gehen“ (optional)')
    expect(field).toHaveValue('18:30')
    fireEvent.change(field, { target: { value: '' } })
    expect(onSetTime).toHaveBeenCalledWith('i1', null)
  })
})
