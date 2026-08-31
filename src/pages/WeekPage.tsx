import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  createWeekItem,
  deleteWeekItem,
  getMission,
  getOrCreateWeek,
  getPreviousWeek,
  getReview,
  listFixedEvents,
  listGoals,
  listRoles,
  listWeekItems,
  setWeekStatus,
  updateWeekItem,
} from '@/lib/api'
import { WEEKDAY_NAMES, addDays, formatTime, formatWeekRange, startOfWeek } from '@/lib/date'
import { Markdown } from '@/lib/markdown'
import { ErrorState, LoadingState } from '@/components/States'
import StepActivities, { type NewActivity } from '@/components/week/StepActivities'
import StepConfirm from '@/components/week/StepConfirm'
import StepIndicator, { STEP_TITLES } from '@/components/week/StepIndicator'
import StepSchedule from '@/components/week/StepSchedule'
import type {
  FixedEvent,
  Goal,
  Quadrant,
  Review,
  Role,
  Week,
  WeekItem,
  Weekday,
} from '@/lib/database.types'

export default function WeekPage() {
  const [monday] = useState(() => startOfWeek(new Date()))
  const [week, setWeek] = useState<Week | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [items, setItems] = useState<WeekItem[]>([])
  const [fixedEvents, setFixedEvents] = useState<FixedEvent[]>([])
  const [mission, setMission] = useState('')
  const [previousWeek, setPreviousWeek] = useState<Week | null>(null)
  const [previousReview, setPreviousReview] = useState<Review | null>(null)
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Vor allem anderen: hat die Vorwoche ein Review? Ohne das wird nicht geplant.
      const previous = await getPreviousWeek(monday)
      const previousReviewRow = previous ? await getReview(previous.id) : null
      setPreviousWeek(previous)
      setPreviousReview(previousReviewRow)
      if (previous && !previousReviewRow) {
        setLoading(false)
        return
      }

      const currentWeek = await getOrCreateWeek(monday)
      const [roleList, goalList, itemList, eventList, missionRow] = await Promise.all([
        listRoles(),
        listGoals(),
        listWeekItems(currentWeek.id),
        listFixedEvents(true),
        getMission(),
      ])
      setWeek(currentWeek)
      setRoles(roleList)
      setGoals(goalList)
      setItems(itemList)
      setFixedEvents(eventList)
      setMission(missionRow?.content ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Woche konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [monday])

  useEffect(() => {
    void load()
  }, [load])

  const refreshItems = useCallback(async (weekId: string) => {
    setItems(await listWeekItems(weekId))
  }, [])

  async function run(action: () => Promise<unknown>) {
    if (!week) return
    setBusy(true)
    setError(null)
    try {
      await action()
      await refreshItems(week.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <LoadingState label="Woche wird geladen" />

  // DoD 13: ohne abgeschlossenes Review der Vorwoche keine neue Planung.
  if (previousWeek && !previousReview) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Woche planen</h1>
        <div role="alert" className="card space-y-3 border-amber-300 dark:border-amber-900">
          <h2 className="font-semibold">Zuerst die Vorwoche abschließen</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Die Woche vom {formatWeekRange(new Date(`${previousWeek.start_date}T00:00:00`))} hat noch
            kein Review. Der Rückblick gehört zum Zyklus — ohne ihn planst du blind weiter.
          </p>
          <Link to={`/review/${previousWeek.id}`} className="btn-primary inline-flex">
            Zum Wochenreview
          </Link>
        </div>
      </section>
    )
  }

  if (!week) return <ErrorState message={error ?? 'Woche nicht verfügbar.'} onRetry={() => void load()} />

  if (week.status !== 'planning') {
    return (
      <WeekOverview
        week={week}
        monday={monday}
        roles={roles}
        items={items}
        fixedEvents={fixedEvents}
        error={error}
        busy={busy}
        onReopen={() => void run(() => setWeekStatus(week.id, 'planning'))}
      />
    )
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Woche planen</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{formatWeekRange(monday)}</p>
      </header>

      <StepIndicator current={step} />

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {step === 0 && <StepMission mission={mission} previousReview={previousReview} />}

      {step === 1 && (
        <StepActivities
          roles={roles}
          goals={goals}
          items={items}
          busy={busy}
          onCreate={(activity: NewActivity) =>
            void run(() =>
              createWeekItem({
                week_id: week.id,
                role_id: activity.role_id,
                title: activity.title,
                quadrant: activity.quadrant,
                goal_id: activity.goal_id,
                sort_order: items.filter((i) => i.role_id === activity.role_id).length,
              }),
            )
          }
          onDelete={(id) => void run(() => deleteWeekItem(id))}
          onChangeQuadrant={(id, quadrant: Quadrant) => void run(() => updateWeekItem(id, { quadrant }))}
        />
      )}

      {step === 2 && (
        <StepSchedule
          items={items}
          roles={roles}
          fixedEvents={fixedEvents}
          busy={busy}
          onAssign={(id, day: Weekday | null) => void run(() => updateWeekItem(id, { planned_day: day }))}
          onSetTime={(id, time) =>
            void run(() => updateWeekItem(id, { start_time: time ? `${time}:00` : null }))
          }
        />
      )}

      {step === 3 && <StepConfirm roles={roles} items={items} />}

      <nav aria-label="Schritte" className="flex flex-wrap justify-between gap-2 pt-2">
        <button
          type="button"
          className="btn-secondary"
          disabled={step === 0 || busy}
          onClick={() => setStep((s) => s - 1)}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Zurück
        </button>

        {step < STEP_TITLES.length - 1 ? (
          <button type="button" className="btn-primary" disabled={busy} onClick={() => setStep((s) => s + 1)}>
            Weiter
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || items.length === 0}
            onClick={() =>
              void run(async () => {
                await setWeekStatus(week.id, 'active')
                setWeek({ ...week, status: 'active' })
              })
            }
          >
            Woche starten
          </button>
        )}
      </nav>
    </section>
  )
}

function StepMission({
  mission,
  previousReview,
}: {
  mission: string
  previousReview: Review | null
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-4">
      <section className="card space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Deine Mission</h2>
          <button
            type="button"
            className="btn-secondary"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Einklappen' : 'Aufklappen'}
          </button>
        </div>
        {open ? (
          <Markdown source={mission} />
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400">
            {mission.trim() === ''
              ? 'Noch keine Mission hinterlegt.'
              : 'Lies sie, bevor du planst — sie entscheidet, was diese Woche zählt.'}
          </p>
        )}
      </section>

      <section className="card space-y-2">
        <h2 className="text-lg font-semibold">Rückblick auf die Vorwoche</h2>
        {previousReview ? (
          <dl className="space-y-2">
            {(
              [
                ['Lief gut', previousReview.wins],
                ['Lief nicht', previousReview.misses],
                ['Learnings', previousReview.learnings],
                ['Fokus für diese Woche', previousReview.next_week_focus],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="font-medium">{label}</dt>
                <dd className="break-words text-neutral-600 dark:text-neutral-400">{value}</dd>
              </div>
            ))}
            <div>
              <dt className="font-medium">Bewertung</dt>
              <dd className="text-neutral-600 dark:text-neutral-400">{previousReview.rating} von 5</dd>
            </div>
          </dl>
        ) : (
          <p className="text-neutral-600 dark:text-neutral-400">
            Noch kein Review vorhanden — das ist die erste geplante Woche.
          </p>
        )}
      </section>
    </div>
  )
}

function WeekOverview({
  week,
  monday,
  roles,
  items,
  fixedEvents,
  error,
  busy,
  onReopen,
}: {
  week: Week
  monday: Date
  roles: Role[]
  items: WeekItem[]
  fixedEvents: FixedEvent[]
  error: string | null
  busy: boolean
  onReopen: () => void
}) {
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? ''

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Diese Woche</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {formatWeekRange(monday)} · {week.status === 'active' ? 'aktiv' : 'abgeschlossen'}
        </p>
      </header>

      {error && <ErrorState message={error} />}

      <ul className="space-y-3">
        {([0, 1, 2, 3, 4, 5, 6] as Weekday[]).map((day) => {
          const dayEvents = fixedEvents.filter((e) => e.weekday === day && e.active)
          const dayItems = items.filter((item) => item.planned_day === day)
          const date = addDays(monday, day)

          return (
            <li key={day} className="card space-y-2">
              <h2 className="font-semibold">
                {WEEKDAY_NAMES[day]}
                <span className="ml-2 font-normal text-neutral-500 dark:text-neutral-400">
                  {date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
              </h2>

              {dayEvents.map((event) => (
                <p key={event.id} className="text-neutral-600 dark:text-neutral-400">
                  {formatTime(event.start_time)}–{formatTime(event.end_time)} {event.title}
                </p>
              ))}

              {dayItems.length === 0 && dayEvents.length === 0 ? (
                <p className="text-neutral-500 dark:text-neutral-400">Nichts geplant.</p>
              ) : (
                <ul className="space-y-1">
                  {dayItems.map((item) => (
                    <li key={item.id} className={item.done ? 'line-through opacity-60' : ''}>
                      {item.start_time && `${formatTime(item.start_time)} `}
                      {item.title}
                      <span className="block text-neutral-500 dark:text-neutral-400">
                        {roleName(item.role_id)} · {item.quadrant}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      {week.status === 'active' && (
        <button type="button" className="btn-secondary" disabled={busy} onClick={onReopen}>
          Planung erneut öffnen
        </button>
      )}
    </section>
  )
}
