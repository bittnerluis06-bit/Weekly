import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import StepActivities from './StepActivities'
import StepConfirm from './StepConfirm'
import type { Goal, Quadrant, Role, WeekItem } from '@/lib/database.types'

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

function weekItem(id: string, roleId: string, title: string, quadrant: Quadrant = 'Q2'): WeekItem {
  return {
    id,
    user_id: 'u',
    week_id: 'w',
    role_id: roleId,
    goal_id: null,
    title,
    quadrant,
    done: false,
    planned_day: null,
    start_time: null,
    end_time: null,
    sort_order: 0,
    created_at: '2026-08-24T00:00:00Z',
  }
}

const ROLES = [role('r1', 'Freund'), role('r2', 'Sportler')]
const NO_GOALS: Goal[] = []

const noop = () => {}

describe('StepActivities', () => {
  it('warnt bei einer Rolle ohne Aktivität', () => {
    render(
      <StepActivities
        roles={ROLES}
        goals={NO_GOALS}
        items={[]}
        busy={false}
        onCreate={noop}
        onDelete={noop}
        onChangeQuadrant={noop}
      />,
    )
    expect(screen.getAllByText('Noch keine Aktivität für diese Rolle.')).toHaveLength(2)
  })

  it('warnt bei mehr als drei Aktivitäten', () => {
    const items = ['a', 'b', 'c', 'd'].map((s, i) => weekItem(`i${i}`, 'r1', `Aktivität ${s}`))
    render(
      <StepActivities
        roles={ROLES}
        goals={NO_GOALS}
        items={items}
        busy={false}
        onCreate={noop}
        onDelete={noop}
        onChangeQuadrant={noop}
      />,
    )
    expect(
      screen.getByText('Mehr als drei Aktivitäten — such dir die wichtigsten aus.'),
    ).toBeInTheDocument()
  })

  it('warnt nicht bei zwei Aktivitäten', () => {
    const items = [weekItem('i1', 'r1', 'Eins'), weekItem('i2', 'r1', 'Zwei')]
    render(
      <StepActivities
        roles={[ROLES[0]!]}
        goals={NO_GOALS}
        items={items}
        busy={false}
        onCreate={noop}
        onDelete={noop}
        onChangeQuadrant={noop}
      />,
    )
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('meldet eine neue Aktivität mit Rolle und Quadrant', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(
      <StepActivities
        roles={[ROLES[0]!]}
        goals={NO_GOALS}
        items={[]}
        busy={false}
        onCreate={onCreate}
        onDelete={noop}
        onChangeQuadrant={noop}
      />,
    )

    await user.type(screen.getByLabelText('Aktivität für Freund'), 'Anrufen')
    await user.selectOptions(screen.getByLabelText('Quadrant'), 'Q1')
    await user.click(screen.getByRole('button', { name: 'Aktivität hinzufügen' }))

    expect(onCreate).toHaveBeenCalledWith({
      role_id: 'r1',
      title: 'Anrufen',
      quadrant: 'Q1',
      goal_id: null,
    })
  })

  it('legt ohne Titel nichts an', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(
      <StepActivities
        roles={[ROLES[0]!]}
        goals={NO_GOALS}
        items={[]}
        busy={false}
        onCreate={onCreate}
        onDelete={noop}
        onChangeQuadrant={noop}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Aktivität hinzufügen' }))
    expect(onCreate).not.toHaveBeenCalled()
  })
})

describe('StepConfirm', () => {
  it('zählt Aktivitäten pro Rolle und über die Quadranten', () => {
    const items = [
      weekItem('i1', 'r1', 'Eins', 'Q2'),
      weekItem('i2', 'r1', 'Zwei', 'Q2'),
      weekItem('i3', 'r2', 'Drei', 'Q1'),
    ]
    render(<StepConfirm roles={ROLES} items={items} />)

    const perRole = screen.getByRole('heading', { name: 'Aktivitäten pro Rolle' }).parentElement!
    expect(within(perRole).getByText('Freund').parentElement).toHaveTextContent('2 Aktivitäten')
    expect(within(perRole).getByText('Sportler').parentElement).toHaveTextContent('1 Aktivität')

    expect(screen.getByLabelText('2 von 3 Aktivitäten')).toBeInTheDocument()
    expect(screen.getByLabelText('1 von 3 Aktivitäten')).toBeInTheDocument()
  })

  it('weist auf Aktivitäten ohne Tag hin', () => {
    render(<StepConfirm roles={ROLES} items={[weekItem('i1', 'r1', 'Eins')]} />)
    expect(screen.getByRole('status')).toHaveTextContent('1 Aktivitäten haben noch keinen Tag')
  })
})
