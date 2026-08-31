import { useState } from 'react'
import { AlertTriangle, Plus, Trash2 } from 'lucide-react'
import { QUADRANTS, QUADRANT_LABEL, QUADRANT_SHORT, statsPerRole } from '@/lib/weekMetrics'
import type { Goal, Quadrant, Role, WeekItem } from '@/lib/database.types'

export interface NewActivity {
  role_id: string
  title: string
  quadrant: Quadrant
  goal_id: string | null
}

export default function StepActivities({
  roles,
  goals,
  items,
  busy,
  onCreate,
  onDelete,
  onChangeQuadrant,
}: {
  roles: Role[]
  goals: Goal[]
  items: WeekItem[]
  busy: boolean
  onCreate: (activity: NewActivity) => void
  onDelete: (id: string) => void
  onChangeQuadrant: (id: string, quadrant: Quadrant) => void
}) {
  const stats = statsPerRole(roles, items)

  return (
    <div className="space-y-4">
      <p className="text-neutral-600 dark:text-neutral-400">
        Zwei bis drei Aktivitäten pro Rolle. Die großen Steine zuerst — was wichtig ist, aber nicht
        dringend.
      </p>

      <ul className="space-y-4">
        {stats.map(({ role, total, warning }) => (
          <li key={role.id} className="card space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{role.name}</h2>
              <span className="text-neutral-500 dark:text-neutral-400">
                {total} {total === 1 ? 'Aktivität' : 'Aktivitäten'}
              </span>
            </div>

            {warning !== 'none' && (
              <p
                role="status"
                className="flex items-start gap-2 text-amber-700 dark:text-amber-500"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {warning === 'empty'
                  ? 'Noch keine Aktivität für diese Rolle.'
                  : 'Mehr als drei Aktivitäten — such dir die wichtigsten aus.'}
              </p>
            )}

            <ActivityList
              items={items.filter((item) => item.role_id === role.id)}
              goals={goals}
              busy={busy}
              onDelete={onDelete}
              onChangeQuadrant={onChangeQuadrant}
            />

            <AddActivityForm
              role={role}
              goals={goals.filter((goal) => goal.role_id === role.id && goal.status === 'open')}
              busy={busy}
              onCreate={onCreate}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ActivityList({
  items,
  goals,
  busy,
  onDelete,
  onChangeQuadrant,
}: {
  items: WeekItem[]
  goals: Goal[]
  busy: boolean
  onDelete: (id: string) => void
  onChangeQuadrant: (id: string, quadrant: Quadrant) => void
}) {
  if (items.length === 0) return null

  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const goal = goals.find((g) => g.id === item.goal_id)
        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800"
          >
            <span className="min-w-0 flex-1 break-words">
              {item.title}
              {goal && (
                <span className="block text-neutral-500 dark:text-neutral-400">Ziel: {goal.title}</span>
              )}
            </span>

            <label className="sr-only" htmlFor={`quadrant-${item.id}`}>
              Quadrant für „{item.title}“
            </label>
            <select
              id={`quadrant-${item.id}`}
              className="input w-auto"
              value={item.quadrant}
              disabled={busy}
              onChange={(e) => onChangeQuadrant(item.id, e.target.value as Quadrant)}
            >
              {QUADRANTS.map((q) => (
                <option key={q} value={q}>
                  {q} — {QUADRANT_SHORT[q]}
                </option>
              ))}
            </select>

            <button
              type="button"
              className="btn-secondary px-2"
              aria-label={`„${item.title}“ entfernen`}
              disabled={busy}
              onClick={() => onDelete(item.id)}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function AddActivityForm({
  role,
  goals,
  busy,
  onCreate,
}: {
  role: Role
  goals: Goal[]
  busy: boolean
  onCreate: (activity: NewActivity) => void
}) {
  const [title, setTitle] = useState('')
  const [quadrant, setQuadrant] = useState<Quadrant>('Q2')
  const [goalId, setGoalId] = useState('')

  return (
    <form
      className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
      onSubmit={(e) => {
        e.preventDefault()
        const value = title.trim()
        if (!value) return
        setTitle('')
        setGoalId('')
        onCreate({ role_id: role.id, title: value, quadrant, goal_id: goalId || null })
      }}
    >
      <label htmlFor={`activity-${role.id}`} className="block font-medium">
        Aktivität für {role.name}
      </label>
      <div className="flex gap-2">
        <input
          id={`activity-${role.id}`}
          className="input"
          placeholder="Was nimmst du dir vor?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={busy || title.trim() === ''}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Aktivität hinzufügen</span>
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label htmlFor={`new-quadrant-${role.id}`} className="sr-only">
            Quadrant
          </label>
          <select
            id={`new-quadrant-${role.id}`}
            className="input"
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value as Quadrant)}
          >
            {QUADRANTS.map((q) => (
              <option key={q} value={q}>
                {QUADRANT_LABEL[q]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`new-goal-${role.id}`} className="sr-only">
            Ziel verknüpfen (optional)
          </label>
          <select
            id={`new-goal-${role.id}`}
            className="input"
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
          >
            <option value="">Ohne Ziel</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  )
}
