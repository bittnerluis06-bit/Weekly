import { useCallback, useEffect, useMemo, useState } from 'react'
import { Archive, ArchiveRestore, ChevronDown, ChevronUp, Check, Pencil, Plus, Undo2, X } from 'lucide-react'
import {
  createGoal,
  createRole,
  listGoals,
  listRoles,
  reorderRoles,
  setGoalStatus,
  updateRole,
} from '@/lib/api'
import { ErrorState, LoadingState } from '@/components/States'
import type { Goal, Horizon, Role } from '@/lib/database.types'

const HORIZON_LABEL: Record<Horizon, string> = {
  short: 'Kurzfristig (dieses Quartal)',
  long: 'Langfristig (1–5 Jahre)',
}

type Tab = 'active' | 'archive'

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [tab, setTab] = useState<Tab>('active')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newRole, setNewRole] = useState('')
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [r, g] = await Promise.all([listRoles(true), listGoals()])
      setRoles(r)
      setGoals(g)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Daten konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      const [r, g] = await Promise.all([listRoles(true), listGoals()])
      setRoles(r)
      setGoals(g)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  const activeRoles = useMemo(() => roles.filter((r) => !r.archived), [roles])
  const archivedRoles = useMemo(() => roles.filter((r) => r.archived), [roles])

  function move(index: number, delta: number) {
    const next = [...activeRoles]
    const target = index + delta
    const a = next[index]
    const b = next[target]
    if (!a || !b) return
    next[index] = b
    next[target] = a
    void run(() => reorderRoles(next.map((r) => r.id)))
  }

  if (loading) return <LoadingState label="Rollen werden geladen" />

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Rollen &amp; Ziele</h1>

      <div role="tablist" aria-label="Ansicht" className="flex gap-2">
        {(
          [
            ['active', 'Aktiv'],
            ['archive', 'Archiv'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="tab"
            type="button"
            aria-selected={tab === value}
            className={
              tab === value
                ? 'btn-primary'
                : 'btn-secondary'
            }
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {tab === 'active' ? (
        <>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              const name = newRole.trim()
              if (!name) return
              setNewRole('')
              void run(() => createRole(name, activeRoles.length))
            }}
          >
            <label htmlFor="new-role" className="sr-only">
              Neue Rolle
            </label>
            <input
              id="new-role"
              className="input"
              placeholder="Neue Rolle"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            />
            <button type="submit" className="btn-primary shrink-0" disabled={busy || newRole.trim() === ''}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only md:not-sr-only">Anlegen</span>
            </button>
          </form>

          {activeRoles.length === 0 ? (
            <div className="card border-dashed">
              <p className="text-neutral-600 dark:text-neutral-400">
                Noch keine Rollen. Die Wochenplanung startet immer bei den Rollen — leg zuerst an,
                wer du in dieser Woche bist.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {activeRoles.map((role, index) => (
                <li key={role.id} className="card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {renaming?.id === role.id ? (
                      <form
                        className="flex flex-1 gap-2"
                        onSubmit={(e) => {
                          e.preventDefault()
                          const name = renaming.name.trim()
                          if (!name) return
                          setRenaming(null)
                          void run(() => updateRole(role.id, { name }))
                        }}
                      >
                        <label htmlFor={`rename-${role.id}`} className="sr-only">
                          Rolle umbenennen
                        </label>
                        <input
                          id={`rename-${role.id}`}
                          className="input"
                          value={renaming.name}
                          onChange={(e) => setRenaming({ id: role.id, name: e.target.value })}
                          autoFocus
                        />
                        <button type="submit" className="btn-primary shrink-0" aria-label="Namen speichern">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn-secondary shrink-0"
                          aria-label="Umbenennen abbrechen"
                          onClick={() => setRenaming(null)}
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <h2 className="text-lg font-semibold">{role.name}</h2>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="btn-secondary px-2"
                            aria-label={`${role.name} nach oben`}
                            disabled={index === 0 || busy}
                            onClick={() => move(index, -1)}
                          >
                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2"
                            aria-label={`${role.name} nach unten`}
                            disabled={index === activeRoles.length - 1 || busy}
                            onClick={() => move(index, 1)}
                          >
                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2"
                            aria-label={`${role.name} umbenennen`}
                            onClick={() => setRenaming({ id: role.id, name: role.name })}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary px-2"
                            aria-label={`${role.name} archivieren`}
                            disabled={busy}
                            onClick={() => void run(() => updateRole(role.id, { archived: true }))}
                          >
                            <Archive className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {(['short', 'long'] as const).map((horizon) => (
                    <GoalSection
                      key={horizon}
                      role={role}
                      horizon={horizon}
                      goals={goals.filter(
                        (g) => g.role_id === role.id && g.horizon === horizon && g.status === 'open',
                      )}
                      busy={busy}
                      onCreate={(title) => void run(() => createGoal({ role_id: role.id, title, horizon }))}
                      onStatus={(id, status) => void run(() => setGoalStatus(id, status))}
                    />
                  ))}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <ArchiveTab
          roles={roles}
          archivedRoles={archivedRoles}
          goals={goals}
          busy={busy}
          onRestoreRole={(id) => void run(() => updateRole(id, { archived: false }))}
          onReopenGoal={(id) => void run(() => setGoalStatus(id, 'open'))}
        />
      )}
    </section>
  )
}

function GoalSection({
  role,
  horizon,
  goals,
  busy,
  onCreate,
  onStatus,
}: {
  role: Role
  horizon: Horizon
  goals: Goal[]
  busy: boolean
  onCreate: (title: string) => void
  onStatus: (id: string, status: 'done' | 'dropped') => void
}) {
  const [title, setTitle] = useState('')
  const inputId = `goal-${role.id}-${horizon}`

  return (
    <section className="space-y-2 border-t border-neutral-200 pt-3 dark:border-neutral-800">
      <h3 className="font-medium text-neutral-600 dark:text-neutral-400">{HORIZON_LABEL[horizon]}</h3>

      {goals.length === 0 ? (
        <p className="text-neutral-500 dark:text-neutral-400">Noch kein Ziel.</p>
      ) : (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li key={goal.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 break-words">{goal.title}</span>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="btn-secondary px-2"
                  aria-label={`„${goal.title}“ erledigt`}
                  disabled={busy}
                  onClick={() => onStatus(goal.id, 'done')}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="btn-secondary px-2"
                  aria-label={`„${goal.title}“ verwerfen`}
                  disabled={busy}
                  onClick={() => onStatus(goal.id, 'dropped')}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          const value = title.trim()
          if (!value) return
          setTitle('')
          onCreate(value)
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          {HORIZON_LABEL[horizon]} für {role.name} hinzufügen
        </label>
        <input
          id={inputId}
          className="input"
          placeholder={horizon === 'short' ? 'Ziel für dieses Quartal' : 'Ziel für 1–5 Jahre'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="btn-secondary shrink-0" disabled={busy || title.trim() === ''}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Ziel hinzufügen</span>
        </button>
      </form>
    </section>
  )
}

function ArchiveTab({
  roles,
  archivedRoles,
  goals,
  busy,
  onRestoreRole,
  onReopenGoal,
}: {
  roles: Role[]
  archivedRoles: Role[]
  goals: Goal[]
  busy: boolean
  onRestoreRole: (id: string) => void
  onReopenGoal: (id: string) => void
}) {
  const closedGoals = goals.filter((g) => g.status !== 'open')
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? 'Unbekannte Rolle'

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Archivierte Rollen</h2>
        {archivedRoles.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">Keine archivierten Rollen.</p>
        ) : (
          <ul className="space-y-2">
            {archivedRoles.map((role) => (
              <li key={role.id} className="card flex items-center justify-between gap-2">
                <span>{role.name}</span>
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={() => onRestoreRole(role.id)}
                >
                  <ArchiveRestore className="h-4 w-4" aria-hidden="true" />
                  Reaktivieren
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Abgeschlossene und verworfene Ziele</h2>
        {closedGoals.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">Noch keine abgeschlossenen Ziele.</p>
        ) : (
          <ul className="space-y-2">
            {closedGoals.map((goal) => (
              <li key={goal.id} className="card flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0">
                  <span className={goal.status === 'dropped' ? 'line-through' : ''}>{goal.title}</span>
                  <span className="block text-neutral-500 dark:text-neutral-400">
                    {roleName(goal.role_id)} · {goal.horizon === 'short' ? 'kurzfristig' : 'langfristig'} ·{' '}
                    {goal.status === 'done' ? 'erledigt' : 'verworfen'}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn-secondary shrink-0"
                  disabled={busy}
                  onClick={() => onReopenGoal(goal.id)}
                >
                  <Undo2 className="h-4 w-4" aria-hidden="true" />
                  Wieder öffnen
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
