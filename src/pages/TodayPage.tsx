import { useCallback, useEffect, useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  createWeekItem,
  getWeek,
  listFixedEvents,
  listRoles,
  listWeekItems,
  updateWeekItem,
} from '@/lib/api'
import {
  WEEKDAY_NAMES,
  formatDateLong,
  formatTime,
  startOfWeek,
  toWeekday,
} from '@/lib/date'
import { QUADRANTS, QUADRANT_LABEL, formatPercent, statsPerRole } from '@/lib/weekMetrics'
import { ErrorState, LoadingState } from '@/components/States'
import type { FixedEvent, Quadrant, Role, Week, WeekItem, Weekday } from '@/lib/database.types'

export default function TodayPage() {
  const [today] = useState(() => new Date())
  const weekday = toWeekday(today)
  const tomorrow = ((weekday + 1) % 7) as Weekday

  const [week, setWeek] = useState<Week | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [items, setItems] = useState<WeekItem[]>([])
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const currentWeek = await getWeek(startOfWeek(today))
      const [roleList, eventList] = await Promise.all([listRoles(), listFixedEvents(true)])
      setWeek(currentWeek)
      setRoles(roleList)
      setFixedEvents(eventList)
      setItems(currentWeek ? await listWeekItems(currentWeek.id) : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der Tag konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => {
    void load()
  }, [load])

  async function run(action: () => Promise<unknown>) {
    if (!week) return
    setBusy(true)
    setError(null)
    try {
      await action()
      setItems(await listWeekItems(week.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingState label="Heute wird geladen" />

  const dayEvents = fixedEvents
    .filter((e) => e.weekday === weekday)
    .sort((a, b) => a.start_time.localeCompare(b.start_time))
  const dayItems = items.filter((item) => item.planned_day === weekday)
  const stats = statsPerRole(roles, items)

  return (
    <section className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Heute</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{formatDateLong(today)}</p>
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {!week ? (
        <div className="card border-dashed space-y-3">
          <p className="text-neutral-600 dark:text-neutral-400">
            Für diese Woche ist noch nichts geplant.
          </p>
          <Link to="/woche" className="btn-primary inline-flex">
            Woche planen
          </Link>
        </div>
      ) : (
        <>
          {dayEvents.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-lg font-semibold">Fest im Kalender</h2>
              <ul className="card space-y-2">
                {dayEvents.map((event) => (
                  <li key={event.id} className="flex gap-3">
                    <span className="shrink-0 tabular-nums text-neutral-600 dark:text-neutral-400">
                      {formatTime(event.start_time)}–{formatTime(event.end_time)}
                    </span>
                    <span className="min-w-0 break-words">{event.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Heute vorgenommen</h2>
              <button
                type="button"
                className="btn-secondary"
                aria-expanded={adding}
                onClick={() => setAdding((v) => !v)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Hinzufügen
              </button>
            </div>

            {adding && (
              <QuickAdd
                roles={roles}
                busy={busy}
                onCancel={() => setAdding(false)}
                onCreate={(input) => {
                  setAdding(false)
                  void run(() =>
                    createWeekItem({
                      week_id: week.id,
                      role_id: input.role_id,
                      title: input.title,
                      quadrant: input.quadrant,
                      sort_order: dayItems.length,
                    }).then((created) => updateWeekItem(created.id, { planned_day: weekday })),
                  )
                }}
              />
            )}

            {dayItems.length === 0 ? (
              <div className="card border-dashed">
                <p className="text-neutral-600 dark:text-neutral-400">
                  Für heute steht nichts an. Das kann richtig sein — oder du holst dir etwas aus der
                  Woche her.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {dayItems.map((item) => (
                  <TodayItem
                    key={item.id}
                    item={item}
                    roleName={roles.find((r) => r.id === item.role_id)?.name ?? ''}
                    tomorrow={tomorrow}
                    busy={busy}
                    onToggle={() => void run(() => updateWeekItem(item.id, { done: !item.done }))}
                    onMove={(day) => void run(() => updateWeekItem(item.id, { planned_day: day }))}
                  />
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Fortschritt der Woche</h2>
            <ul className="card space-y-3">
              {stats.map(({ role, total, done, rate }) => (
                <li key={role.id} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 break-words">{role.name}</span>
                    <span className="shrink-0 text-neutral-600 dark:text-neutral-400">
                      {done}/{total} · {formatPercent(rate)}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded bg-neutral-100 dark:bg-neutral-800"
                    role="img"
                    aria-label={`${role.name}: ${done} von ${total} erledigt`}
                  >
                    <div
                      className="h-2 rounded bg-accent-600"
                      style={{ width: `${(rate ?? 0) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </section>
  )
}

function TodayItem({
  item,
  roleName,
  tomorrow,
  busy,
  onToggle,
  onMove,
}: {
  item: WeekItem
  roleName: string
  tomorrow: Weekday
  busy: boolean
  onToggle: () => void
  onMove: (day: Weekday) => void
}) {
  return (
    <li className="card space-y-3">
      {/* Ein Tap zum Abhaken, Fläche über die ganze Zeile. */}
      <button
        type="button"
        className="touch-target flex w-full items-center gap-3 text-left"
        aria-pressed={item.done}
        disabled={busy}
        onClick={onToggle}
      >
        <span
          className={
            item.done
              ? 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-600 text-white'
              : 'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-neutral-300 dark:border-neutral-600'
          }
          aria-hidden="true"
        >
          {item.done && <Check className="h-4 w-4" />}
        </span>
        <span className="min-w-0">
          <span className={item.done ? 'block break-words line-through opacity-60' : 'block break-words'}>
            {item.start_time && `${formatTime(item.start_time)} `}
            {item.title}
          </span>
          <span className="block text-neutral-500 dark:text-neutral-400">
            {roleName} · {item.quadrant}
          </span>
        </span>
      </button>

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
        {/* Ein Tap — der häufigste Fall beim täglichen Anpassen. */}
        <button
          type="button"
          className="btn-secondary"
          disabled={busy}
          onClick={() => onMove(tomorrow)}
        >
          Auf morgen
        </button>

        <label htmlFor={`move-${item.id}`} className="sr-only">
          „{item.title}“ auf einen anderen Tag verschieben
        </label>
        <select
          id={`move-${item.id}`}
          className="input w-auto"
          value=""
          disabled={busy}
          onChange={(e) => {
            if (e.target.value === '') return
            onMove(Number(e.target.value) as Weekday)
          }}
        >
          <option value="">Anderer Tag …</option>
          {WEEKDAY_NAMES.map((name, day) => (
            <option key={name} value={day}>
              {name}
            </option>
          ))}
        </select>
      </div>
    </li>
  )
}

function QuickAdd({
  roles,
  busy,
  onCreate,
  onCancel,
}: {
  roles: Role[]
  busy: boolean
  onCreate: (input: { role_id: string; title: string; quadrant: Quadrant }) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState('')
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const [quadrant, setQuadrant] = useState<Quadrant>('Q2')

  return (
    <form
      className="card space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        const value = title.trim()
        if (!value || !roleId) return
        onCreate({ role_id: roleId, title: value, quadrant })
      }}
    >
      <div className="space-y-1">
        <label htmlFor="quick-title" className="block font-medium">
          Was kommt dazu?
        </label>
        <input
          id="quick-title"
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="quick-role" className="block font-medium">
            Rolle
          </label>
          <select
            id="quick-role"
            className="input"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="quick-quadrant" className="block font-medium">
            Quadrant
          </label>
          <select
            id="quick-quadrant"
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
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy || title.trim() === ''}>
          Für heute übernehmen
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Abbrechen
        </button>
      </div>
    </form>
  )
}
