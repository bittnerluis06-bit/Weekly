import { QUADRANTS, QUADRANT_LABEL, quadrantDistribution, statsPerRole } from '@/lib/weekMetrics'
import { WEEKDAY_SHORT } from '@/lib/date'
import type { Role, WeekItem } from '@/lib/database.types'

export default function StepConfirm({ roles, items }: { roles: Role[]; items: WeekItem[] }) {
  const stats = statsPerRole(roles, items)
  const distribution = quadrantDistribution(items)
  const max = Math.max(1, ...Object.values(distribution))

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Aktivitäten pro Rolle</h2>
        <ul className="space-y-2">
          {stats.map(({ role, total, warning }) => (
            <li key={role.id} className="card flex items-center justify-between gap-2">
              <span className="min-w-0 break-words">{role.name}</span>
              <span
                className={
                  warning === 'none'
                    ? 'shrink-0'
                    : 'shrink-0 text-amber-700 dark:text-amber-500'
                }
              >
                {total} {total === 1 ? 'Aktivität' : 'Aktivitäten'}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Verteilung über die Quadranten</h2>
        <ul className="card space-y-3">
          {QUADRANTS.map((quadrant) => (
            <li key={quadrant} className="space-y-1">
              <div className="flex items-baseline justify-between gap-2">
                <span>{QUADRANT_LABEL[quadrant]}</span>
                <span className="shrink-0 font-medium">{distribution[quadrant]}</span>
              </div>
              <div
                className="h-2 rounded bg-neutral-100 dark:bg-neutral-800"
                role="img"
                aria-label={`${distribution[quadrant]} von ${items.length} Aktivitäten`}
              >
                <div
                  className={quadrant === 'Q2' ? 'h-2 rounded bg-accent-600' : 'h-2 rounded bg-neutral-400'}
                  style={{ width: `${(distribution[quadrant] / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        <p className="text-neutral-600 dark:text-neutral-400">
          Je mehr in Q2 liegt, desto besser — das sind die großen Steine.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Verteilung über die Woche</h2>
        <ul className="card flex justify-between gap-1">
          {WEEKDAY_SHORT.map((short, day) => {
            const count = items.filter((item) => item.planned_day === day).length
            return (
              <li key={short} className="flex-1 text-center">
                <span className="block text-neutral-500 dark:text-neutral-400">{short}</span>
                <span className="block font-medium">{count}</span>
              </li>
            )
          })}
        </ul>
        {items.some((item) => item.planned_day === null) && (
          <p role="status" className="text-amber-700 dark:text-amber-500">
            {items.filter((item) => item.planned_day === null).length} Aktivitäten haben noch keinen
            Tag. Du kannst die Woche trotzdem starten und sie unterwegs einplanen.
          </p>
        )}
      </section>
    </div>
  )
}
