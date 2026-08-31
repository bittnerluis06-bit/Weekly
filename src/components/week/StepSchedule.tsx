import { useState } from 'react'
import { Clock, Lock } from 'lucide-react'
import { WEEKDAY_NAMES, formatTime } from '@/lib/date'
import type { FixedEvent, Role, WeekItem, Weekday } from '@/lib/database.types'

const DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

export default function StepSchedule({
  items,
  roles,
  fixedEvents,
  busy,
  onAssign,
  onSetTime,
}: {
  items: WeekItem[]
  roles: Role[]
  fixedEvents: FixedEvent[]
  busy: boolean
  onAssign: (id: string, day: Weekday | null) => void
  onSetTime: (id: string, time: string | null) => void
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Weekday | null>(null)

  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? ''
  const unplanned = items.filter((item) => item.planned_day === null)

  function drop(day: Weekday) {
    if (!dragging) return
    onAssign(dragging, day)
    setDragging(null)
    setDragOver(null)
  }

  return (
    <div className="space-y-4">
      <p className="text-neutral-600 dark:text-neutral-400">
        Fixtermine stehen fest. Alles andere ist eine Tagesliste ohne Uhrzeit — eine Zeit kannst du
        vergeben, musst du aber nicht.
      </p>

      <section aria-labelledby="unplanned-heading" className="card space-y-2">
        <h2 id="unplanned-heading" className="font-semibold">
          Noch keinem Tag zugeordnet ({unplanned.length})
        </h2>
        {unplanned.length === 0 ? (
          <p className="text-neutral-600 dark:text-neutral-400">Alles verteilt.</p>
        ) : (
          <ul className="space-y-2">
            {unplanned.map((item) => (
              <li
                key={item.id}
                draggable={!busy}
                onDragStart={() => setDragging(item.id)}
                onDragEnd={() => setDragging(null)}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-neutral-200 p-2 md:cursor-grab dark:border-neutral-800"
              >
                <span className="min-w-0 flex-1 break-words">
                  {item.title}
                  <span className="block text-neutral-500 dark:text-neutral-400">
                    {roleName(item.role_id)} · {item.quadrant}
                  </span>
                </span>
                <DaySelect item={item} busy={busy} onAssign={onAssign} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <ul className="grid gap-3 md:grid-cols-2">
        {DAYS.map((day) => {
          const dayEvents = fixedEvents.filter((e) => e.weekday === day && e.active)
          const dayItems = items.filter((item) => item.planned_day === day)

          return (
            <li
              key={day}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(day)
              }}
              onDragLeave={() => setDragOver((d) => (d === day ? null : d))}
              onDrop={(e) => {
                e.preventDefault()
                drop(day)
              }}
              className={
                dragOver === day
                  ? 'card border-accent-600 bg-accent-50 dark:bg-neutral-800'
                  : 'card'
              }
            >
              <h2 className="font-semibold">{WEEKDAY_NAMES[day]}</h2>

              {dayEvents.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {dayEvents.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400"
                    >
                      <Lock className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 break-words">
                        {formatTime(event.start_time)}–{formatTime(event.end_time)} {event.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {dayItems.length === 0 ? (
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">Keine Aktivität.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {dayItems.map((item) => (
                    <li
                      key={item.id}
                      draggable={!busy}
                      onDragStart={() => setDragging(item.id)}
                      onDragEnd={() => setDragging(null)}
                      className="space-y-2 border-t border-neutral-200 pt-2 md:cursor-grab dark:border-neutral-800"
                    >
                      <span className="block break-words">
                        {item.title}
                        <span className="block text-neutral-500 dark:text-neutral-400">
                          {roleName(item.role_id)} · {item.quadrant}
                        </span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <DaySelect item={item} busy={busy} onAssign={onAssign} />
                        <label htmlFor={`time-${item.id}`} className="sr-only">
                          Uhrzeit für „{item.title}“ (optional)
                        </label>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-neutral-500" aria-hidden="true" />
                          <input
                            id={`time-${item.id}`}
                            type="time"
                            className="input w-auto"
                            value={item.start_time ? formatTime(item.start_time) : ''}
                            disabled={busy}
                            onChange={(e) => onSetTime(item.id, e.target.value || null)}
                          />
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function DaySelect({
  item,
  busy,
  onAssign,
}: {
  item: WeekItem
  busy: boolean
  onAssign: (id: string, day: Weekday | null) => void
}) {
  return (
    <>
      <label htmlFor={`day-${item.id}`} className="sr-only">
        Tag für „{item.title}“
      </label>
      <select
        id={`day-${item.id}`}
        className="input w-auto"
        value={item.planned_day ?? ''}
        disabled={busy}
        onChange={(e) => onAssign(item.id, e.target.value === '' ? null : (Number(e.target.value) as Weekday))}
      >
        <option value="">Kein Tag</option>
        {DAYS.map((day) => (
          <option key={day} value={day}>
            {WEEKDAY_NAMES[day]}
          </option>
        ))}
      </select>
    </>
  )
}
