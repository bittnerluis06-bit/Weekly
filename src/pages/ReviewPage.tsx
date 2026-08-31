import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getPreviousWeek,
  getReview,
  getWeek,
  getWeekById,
  listRoles,
  listWeekItems,
  saveReview,
} from '@/lib/api'
import { formatWeekRange, startOfWeek } from '@/lib/date'
import {
  QUADRANTS,
  QUADRANT_LABEL,
  completionRate,
  formatPercent,
  quadrantDistribution,
  statsPerRole,
} from '@/lib/weekMetrics'
import { ErrorState, LoadingState } from '@/components/States'
import type { Review, Role, Week, WeekItem } from '@/lib/database.types'

interface Draft {
  wins: string
  misses: string
  learnings: string
  next_week_focus: string
  rating: number | null
}

const EMPTY: Draft = { wins: '', misses: '', learnings: '', next_week_focus: '', rating: null }

export default function ReviewPage() {
  const { weekId } = useParams<{ weekId: string }>()
  const navigate = useNavigate()

  const [week, setWeek] = useState<Week | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [items, setItems] = useState<WeekItem[]>([])
  const [existing, setExisting] = useState<Review | null>(null)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Ohne Angabe: die Vorwoche — das ist der Normalfall am Wochenende.
      const target = weekId
        ? await getWeekById(weekId)
        : ((await getPreviousWeek(startOfWeek(new Date()))) ?? (await getWeek(startOfWeek(new Date()))))

      if (!target) {
        setWeek(null)
        return
      }

      const [roleList, itemList, reviewRow] = await Promise.all([
        listRoles(true),
        listWeekItems(target.id),
        getReview(target.id),
      ])
      setWeek(target)
      setRoles(roleList)
      setItems(itemList)
      setExisting(reviewRow)
      if (reviewRow) {
        setDraft({
          wins: reviewRow.wins,
          misses: reviewRow.misses,
          learnings: reviewRow.learnings,
          next_week_focus: reviewRow.next_week_focus,
          rating: reviewRow.rating,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Review konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [weekId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!week) return

    // Pflichtformular: alle Felder und eine Bewertung.
    const missing =
      draft.wins.trim() === '' ||
      draft.misses.trim() === '' ||
      draft.learnings.trim() === '' ||
      draft.next_week_focus.trim() === '' ||
      draft.rating === null

    if (missing) {
      setProblem('Bitte alle vier Felder ausfüllen und eine Bewertung von 1 bis 5 wählen.')
      return
    }

    setProblem(null)
    setSaving(true)
    setError(null)
    try {
      await saveReview({
        week_id: week.id,
        wins: draft.wins.trim(),
        misses: draft.misses.trim(),
        learnings: draft.learnings.trim(),
        next_week_focus: draft.next_week_focus.trim(),
        rating: draft.rating!,
      })
      void navigate('/woche')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Review wird geladen" />

  if (!week) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight">Wochenreview</h1>
        <div className="card border-dashed">
          <p className="text-neutral-600 dark:text-neutral-400">
            Es gibt noch keine Woche, auf die du zurückblicken könntest.
          </p>
        </div>
      </section>
    )
  }

  const rate = completionRate(items)
  const doneItems = items.filter((item) => item.done)
  const distribution = quadrantDistribution(doneItems)
  const stats = statsPerRole(
    roles.filter((role) => items.some((item) => item.role_id === role.id)),
    items,
  )
  const monday = new Date(`${week.start_date}T00:00:00`)

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Wochenreview</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          {formatWeekRange(monday)}
          {existing && ' · bereits abgeschlossen'}
        </p>
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Kennzahlen</h2>

        <div className="card">
          <p className="text-neutral-600 dark:text-neutral-400">Erledigungsquote gesamt</p>
          <p className="text-2xl font-semibold" data-testid="rate-total">
            {formatPercent(rate)}
          </p>
          <p className="text-neutral-600 dark:text-neutral-400">
            {doneItems.length} von {items.length} Aktivitäten
          </p>
        </div>

        <div className="card space-y-3">
          <h3 className="font-medium">Pro Rolle</h3>
          {stats.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400">Keine Aktivitäten in dieser Woche.</p>
          ) : (
            <ul className="space-y-2">
              {stats.map(({ role, total, done, rate: roleRate }) => (
                <li key={role.id} className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 break-words">{role.name}</span>
                  <span className="shrink-0 text-neutral-600 dark:text-neutral-400">
                    {done}/{total} · {formatPercent(roleRate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card space-y-2">
          <h3 className="font-medium">Erledigte Aktivitäten nach Quadrant</h3>
          <ul className="space-y-1">
            {QUADRANTS.map((quadrant) => (
              <li key={quadrant} className="flex items-baseline justify-between gap-2">
                <span>{QUADRANT_LABEL[quadrant]}</span>
                <span className="shrink-0 font-medium" data-testid={`done-${quadrant}`}>
                  {distribution[quadrant]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="text-lg font-semibold">Dein Rückblick</h2>

        {(
          [
            ['wins', 'Was lief gut?'],
            ['misses', 'Was lief nicht?'],
            ['learnings', 'Was nimmst du mit?'],
            ['next_week_focus', 'Fokus für nächste Woche'],
          ] as const
        ).map(([field, label]) => (
          <div key={field} className="space-y-1">
            <label htmlFor={field} className="block font-medium">
              {label}
            </label>
            <textarea
              id={field}
              className="input min-h-24 resize-y"
              value={draft[field]}
              onChange={(e) => setDraft({ ...draft, [field]: e.target.value })}
            />
          </div>
        ))}

        <fieldset className="space-y-2">
          <legend className="font-medium">Bewertung der Woche</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={
                  draft.rating === value
                    ? 'touch-target relative flex flex-1 items-center justify-center rounded-lg bg-accent-600 font-medium text-white'
                    : 'touch-target relative flex flex-1 items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700'
                }
              >
                {/* Das Eingabefeld deckt die ganze Fläche ab: ein Tap genügt,
                    und Tastatur wie Screenreader bekommen ein echtes Radio. */}
                <input
                  type="radio"
                  name="rating"
                  value={value}
                  aria-label={`${value} von 5`}
                  className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600"
                  checked={draft.rating === value}
                  onChange={() => setDraft({ ...draft, rating: value })}
                />
                <span aria-hidden="true">{value}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {problem && (
          <p role="alert" className="text-red-700 dark:text-red-400">
            {problem}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Wird gespeichert …' : existing ? 'Review aktualisieren' : 'Review abschließen'}
        </button>
      </form>
    </section>
  )
}
