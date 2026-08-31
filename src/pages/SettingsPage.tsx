import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import {
  createFixedEvent,
  deleteFixedEvent,
  listFixedEvents,
  updateFixedEvent,
} from '@/lib/api'
import { WEEKDAY_NAMES, formatTime } from '@/lib/date'
import { ErrorState, LoadingState } from '@/components/States'
import { useAuth } from '@/auth/AuthContext'
import type { FixedEvent, Weekday } from '@/lib/database.types'

interface Draft {
  title: string
  weekday: Weekday
  start_time: string
  end_time: string
}

const EMPTY: Draft = { title: '', weekday: 0, start_time: '08:00', end_time: '09:00' }

function validate(draft: Draft): string | null {
  if (draft.title.trim() === '') return 'Bitte einen Titel angeben.'
  if (!draft.start_time || !draft.end_time) return 'Bitte Start- und Endzeit angeben.'
  if (draft.end_time <= draft.start_time) return 'Die Endzeit muss nach der Startzeit liegen.'
  return null
}

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState<FixedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [editing, setEditing] = useState<{ id: string; draft: Draft } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setEvents(await listFixedEvents())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fixtermine konnten nicht geladen werden.')
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
      setEvents(await listFixedEvents())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Aktion fehlgeschlagen.')
    } finally {
      setBusy(false)
    }
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    const problem = validate(draft)
    if (problem) {
      setError(problem)
      return
    }
    const payload = { ...draft, title: draft.title.trim() }
    setDraft(EMPTY)
    void run(() => createFixedEvent(payload))
  }

  function handleSaveEdit(event: FormEvent) {
    event.preventDefault()
    if (!editing) return
    const problem = validate(editing.draft)
    if (problem) {
      setError(problem)
      return
    }
    const { id, draft: patch } = editing
    setEditing(null)
    void run(() => updateFixedEvent(id, { ...patch, title: patch.title.trim() }))
  }

  if (loading) return <LoadingState label="Einstellungen werden geladen" />

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Einstellungen</h1>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Fixtermine</h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Wiederkehrende Termine mit Uhrzeit. Sie erscheinen automatisch in jeder Woche und lassen
            sich dort nicht verschieben — nur hier.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="card border-dashed">
            <p className="text-neutral-600 dark:text-neutral-400">
              Noch keine Fixtermine. Trag unten ein, was jede Woche fest steht.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.map((event) => (
              <li key={event.id} className="card">
                {editing?.id === event.id ? (
                  <EventForm
                    draft={editing.draft}
                    idPrefix={`edit-${event.id}`}
                    busy={busy}
                    submitLabel="Speichern"
                    onChange={(next) => setEditing({ id: event.id, draft: next })}
                    onSubmit={handleSaveEdit}
                    onCancel={() => setEditing(null)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={event.active ? 'font-medium' : 'font-medium text-neutral-500'}>
                        {event.title}
                        {!event.active && ' (inaktiv)'}
                      </p>
                      <p className="text-neutral-600 dark:text-neutral-400">
                        {WEEKDAY_NAMES[event.weekday]} · {formatTime(event.start_time)}–
                        {formatTime(event.end_time)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy}
                        onClick={() => void run(() => updateFixedEvent(event.id, { active: !event.active }))}
                      >
                        {event.active ? 'Deaktivieren' : 'Aktivieren'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-2"
                        aria-label={`${event.title} bearbeiten`}
                        disabled={busy}
                        onClick={() =>
                          setEditing({
                            id: event.id,
                            draft: {
                              title: event.title,
                              weekday: event.weekday,
                              start_time: formatTime(event.start_time),
                              end_time: formatTime(event.end_time),
                            },
                          })
                        }
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn-secondary px-2"
                        aria-label={`${event.title} löschen`}
                        disabled={busy}
                        onClick={() => setConfirmDelete(event.id)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                )}

                {confirmDelete === event.id && (
                  <div
                    role="alertdialog"
                    aria-label={`${event.title} wirklich löschen?`}
                    className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-800"
                  >
                    <p className="flex-1">Wirklich löschen? Das lässt sich nicht rückgängig machen.</p>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={busy}
                      onClick={() => {
                        setConfirmDelete(null)
                        void run(() => deleteFixedEvent(event.id))
                      }}
                    >
                      <Check className="h-4 w-4" aria-hidden="true" />
                      Löschen
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setConfirmDelete(null)}>
                      <X className="h-4 w-4" aria-hidden="true" />
                      Abbrechen
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="card">
          <h3 className="mb-3 font-medium">Neuer Fixtermin</h3>
          <EventForm
            draft={draft}
            idPrefix="new"
            busy={busy}
            submitLabel="Hinzufügen"
            onChange={setDraft}
            onSubmit={handleCreate}
          />
        </div>
      </section>

      <section className="space-y-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <h2 className="text-lg font-semibold">Konto</h2>
        <p className="text-neutral-600 dark:text-neutral-400">{user?.email}</p>
        <button type="button" className="btn-secondary" onClick={() => void signOut()}>
          Abmelden
        </button>
      </section>
    </section>
  )
}

function EventForm({
  draft,
  idPrefix,
  busy,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Draft
  idPrefix: string
  busy: boolean
  submitLabel: string
  onChange: (draft: Draft) => void
  onSubmit: (event: FormEvent) => void
  onCancel?: () => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-title`} className="block font-medium">
          Titel
        </label>
        <input
          id={`${idPrefix}-title`}
          className="input"
          value={draft.title}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
          placeholder="z. B. Lauftraining"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-weekday`} className="block font-medium">
            Wochentag
          </label>
          <select
            id={`${idPrefix}-weekday`}
            className="input"
            value={draft.weekday}
            onChange={(e) => onChange({ ...draft, weekday: Number(e.target.value) as Weekday })}
          >
            {WEEKDAY_NAMES.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-start`} className="block font-medium">
            Beginn
          </label>
          <input
            id={`${idPrefix}-start`}
            type="time"
            className="input"
            value={draft.start_time}
            onChange={(e) => onChange({ ...draft, start_time: e.target.value })}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor={`${idPrefix}-end`} className="block font-medium">
            Ende
          </label>
          <input
            id={`${idPrefix}-end`}
            type="time"
            className="input"
            value={draft.end_time}
            onChange={(e) => onChange({ ...draft, end_time: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="submit" className="btn-primary" disabled={busy}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            <X className="h-4 w-4" aria-hidden="true" />
            Abbrechen
          </button>
        )}
      </div>
    </form>
  )
}
