import { useEffect } from 'react'
import { CalendarDays, Compass, ListChecks, Users } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { ensureSeeded } from '@/lib/api'

const NAV = [
  { to: '/heute', label: 'Heute', Icon: ListChecks },
  { to: '/woche', label: 'Woche', Icon: CalendarDays },
  { to: '/rollen', label: 'Rollen', Icon: Users },
  { to: '/mission', label: 'Mission', Icon: Compass },
] as const

function linkClasses(isActive: boolean) {
  return isActive
    ? 'text-accent-600 dark:text-accent-500'
    : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
}

export default function AppLayout() {
  const { user, signOut } = useAuth()

  // Beim ersten Login Rollen, Fixtermine und eine leere Mission anlegen.
  // Fehler hier sind nicht kritisch — die Seiten melden sie selbst.
  useEffect(() => {
    if (!user) return
    void ensureSeeded().catch((error: unknown) => {
      console.warn('Seed übersprungen:', error)
    })
  }, [user])

  return (
    <div className="min-h-dvh md:flex">
      {/* Desktop: Seitennavigation */}
      <aside className="hidden w-56 shrink-0 border-r border-neutral-200 p-4 md:block dark:border-neutral-800">
        <p className="px-2 pb-6 text-lg font-semibold tracking-tight">Weekly Planner</p>
        <nav aria-label="Hauptnavigation">
          <ul className="space-y-1">
            {NAV.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `touch-target flex items-center gap-3 rounded-lg px-3 py-2 ${linkClasses(isActive)}`
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {user && (
          <div className="mt-8 space-y-2 px-2 text-neutral-500 dark:text-neutral-400">
            <p className="break-words">{user.email}</p>
            <button type="button" className="underline" onClick={() => void signOut()}>
              Abmelden
            </button>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pt-4 pb-24 md:px-8 md:pb-8">
          <Outlet />
        </main>

        {/* Mobile: untere Tab-Leiste */}
        <nav
          aria-label="Hauptnavigation"
          className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-neutral-800 dark:bg-neutral-950"
        >
          <ul className="flex">
            {NAV.map(({ to, label, Icon }) => (
              <li key={to} className="flex-1">
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `touch-target flex flex-col items-center gap-1 py-2 ${linkClasses(isActive)}`
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm">{label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
