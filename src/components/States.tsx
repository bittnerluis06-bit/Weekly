import type { ReactNode } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'

export function LoadingState({ label = 'Wird geladen' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500 dark:text-neutral-400"
    >
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p>{label} …</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="card flex flex-col items-start gap-3 border-red-300 dark:border-red-900">
      <div className="flex items-start gap-2 text-red-700 dark:text-red-400">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="font-medium">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Erneut versuchen
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-start gap-2 border-dashed">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
      {action}
    </div>
  )
}
