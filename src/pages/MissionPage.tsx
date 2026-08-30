import { useCallback, useEffect, useState } from 'react'
import { History, Pencil, RotateCcw, Save, X } from 'lucide-react'
import { getMission, listMissionVersions, saveMission } from '@/lib/api'
import { Markdown } from '@/lib/markdown'
import { ErrorState, LoadingState } from '@/components/States'
import type { Mission, MissionVersion } from '@/lib/database.types'

function formatStamp(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MissionPage() {
  const [mission, setMission] = useState<Mission | null>(null)
  const [versions, setVersions] = useState<MissionVersion[]>([])
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const current = await getMission()
      setMission(current)
      setDraft(current?.content ?? '')
      setVersions(current ? await listMissionVersions(current.id) : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mission konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave(content: string) {
    setSaving(true)
    setError(null)
    try {
      const saved = await saveMission(content)
      setMission(saved)
      setDraft(saved.content)
      setVersions(await listMissionVersions(saved.id))
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <LoadingState label="Mission wird geladen" />

  const content = mission?.content ?? ''
  const hasContent = content.trim() !== ''

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Mission</h1>
        {!editing && (
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowHistory((v) => !v)}
              aria-expanded={showHistory}
            >
              <History className="h-4 w-4" aria-hidden="true" />
              Versionen ({versions.length})
            </button>
            <button type="button" className="btn-primary" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Bearbeiten
            </button>
          </div>
        )}
      </header>

      {error && <ErrorState message={error} onRetry={() => void load()} />}

      {editing ? (
        <div className="space-y-3">
          <label htmlFor="mission-text" className="block font-medium">
            Mission (Markdown)
          </label>
          <textarea
            id="mission-text"
            className="input min-h-72 resize-y font-mono"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={'# Meine Mission\n\nWofür stehe ich? Welche Prinzipien leiten mich?'}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => void handleSave(draft)}
              disabled={saving}
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {saving ? 'Wird gespeichert …' : 'Speichern'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setDraft(content)
                setEditing(false)
              }}
              disabled={saving}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        <article className="card" data-testid="mission-content">
          {hasContent ? (
            <Markdown source={content} />
          ) : (
            <p className="text-neutral-600 dark:text-neutral-400">
              Noch keine Mission hinterlegt. Sie ist der Bezugspunkt jeder Wochenplanung — fang mit
              ein paar Sätzen an, sie darf wachsen.
            </p>
          )}
          {mission && hasContent && (
            <p className="mt-4 border-t border-neutral-200 pt-3 text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
              Zuletzt geändert: {formatStamp(mission.updated_at)}
            </p>
          )}
        </article>
      )}

      {showHistory && !editing && (
        <section className="space-y-3" aria-label="Versionshistorie">
          <h2 className="text-lg font-semibold">Frühere Versionen</h2>
          {versions.length === 0 ? (
            <p className="text-neutral-600 dark:text-neutral-400">Noch keine Versionen.</p>
          ) : (
            <ul className="space-y-3">
              {versions.map((version, index) => (
                <li key={version.id} className="card space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {formatStamp(version.created_at)}
                      {index === 0 && (
                        <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-sm font-normal text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                          aktuell
                        </span>
                      )}
                    </p>
                    {index > 0 && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => void handleSave(version.content)}
                        disabled={saving}
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Wiederherstellen
                      </button>
                    )}
                  </div>
                  <div className="border-t border-neutral-200 pt-3 text-neutral-600 dark:border-neutral-800 dark:text-neutral-400">
                    <Markdown source={version.content} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </section>
  )
}
