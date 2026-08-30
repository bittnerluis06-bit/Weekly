import { useState, type FormEvent } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { useAuth } from './AuthContext'

type Status = { kind: 'idle' | 'sending' | 'sent' } | { kind: 'error'; message: string }

export default function LoginScreen() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus({ kind: 'sending' })
    try {
      await signInWithEmail(email.trim())
      setStatus({ kind: 'sent' })
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Anmeldung fehlgeschlagen.',
      })
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-5 py-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Weekly Planner</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Wochenplanung entlang deiner Rollen. Anmeldung per Magic Link — kein Passwort.
        </p>
      </header>

      {!isSupabaseConfigured && (
        <div role="alert" className="card border-amber-300 dark:border-amber-900">
          <p className="font-medium text-amber-800 dark:text-amber-400">Supabase ist nicht konfiguriert.</p>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Trage <code>VITE_SUPABASE_URL</code> und <code>VITE_SUPABASE_ANON_KEY</code> in die
            Datei <code>.env</code> ein und starte den Dev-Server neu.
          </p>
        </div>
      )}

      {status.kind === 'sent' ? (
        <div role="status" className="card">
          <h2 className="font-semibold">Link verschickt</h2>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Wir haben eine E-Mail an <strong>{email}</strong> geschickt. Öffne den Link auf diesem
            Gerät, um dich anzumelden.
          </p>
          <button
            type="button"
            className="btn-secondary mt-4"
            onClick={() => setStatus({ kind: 'idle' })}
          >
            Andere Adresse verwenden
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="block font-medium">
              E-Mail-Adresse
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              className="input"
              placeholder="du@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {status.kind === 'error' && (
            <p role="alert" className="text-red-700 dark:text-red-400">
              {status.message}
            </p>
          )}

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={!isSupabaseConfigured || status.kind === 'sending' || email.trim() === ''}
          >
            {status.kind === 'sending' ? 'Wird gesendet …' : 'Magic Link senden'}
          </button>
        </form>
      )}
    </main>
  )
}
