export const STEP_TITLES = ['Mission', 'Aktivitäten', 'Terminieren', 'Bestätigen'] as const

export default function StepIndicator({ current }: { current: number }) {
  return (
    <nav aria-label="Fortschritt der Wochenplanung">
      <ol className="flex gap-2">
        {STEP_TITLES.map((title, index) => {
          const state = index === current ? 'current' : index < current ? 'done' : 'todo'
          return (
            <li key={title} className="flex-1">
              <div
                className={
                  state === 'todo'
                    ? 'h-1 rounded bg-neutral-200 dark:bg-neutral-800'
                    : 'h-1 rounded bg-accent-600'
                }
              />
              <p
                className={
                  state === 'current'
                    ? 'pt-1 font-medium'
                    : 'pt-1 text-neutral-500 dark:text-neutral-400'
                }
              >
                <span className="sr-only">
                  Schritt {index + 1} von {STEP_TITLES.length}
                  {state === 'current' ? ', aktuell' : state === 'done' ? ', erledigt' : ''}:{' '}
                </span>
                {title}
              </p>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
