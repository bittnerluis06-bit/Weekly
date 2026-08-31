import { expect, test, type Db } from './fixtures'
import { startOfWeek, toISODate, toWeekday } from '../src/lib/date'

test.describe.configure({ mode: 'serial' })

const monday = toISODate(startOfWeek(new Date()))
const today = toWeekday(new Date())
const tomorrow = (today + 1) % 7

interface WeekRow {
  id: string
}
interface RoleRow {
  id: string
  name: string
}

/**
 * Setzt eine aktive Woche mit genau zwei Aktivitäten für heute auf.
 * Direkt über die API, damit der Test nicht bei jeder Vorbedingung
 * durch die ganze Planungsstrecke klicken muss.
 */
async function seedActiveWeek(db: Db) {
  let weeks = await db.select<WeekRow[]>(`weeks?start_date=eq.${monday}&select=id`)
  if (weeks.length === 0) {
    await db.post('weeks', { start_date: monday, status: 'active' })
    weeks = await db.select<WeekRow[]>(`weeks?start_date=eq.${monday}&select=id`)
  }
  const week = weeks[0]
  if (!week) throw new Error(`Woche für ${monday} konnte nicht angelegt werden.`)

  await db.remove(`week_items?week_id=eq.${week.id}`)
  await db.remove(`reviews?week_id=eq.${week.id}`)
  await db.patch(`weeks?id=eq.${week.id}`, { status: 'active' })

  const roles = await db.select<RoleRow[]>('roles?archived=eq.false&select=id,name&order=sort_order')
  const role = roles[0]
  if (!role) throw new Error('Keine Rolle vorhanden.')

  await db.post('week_items', [
    {
      week_id: week.id,
      role_id: role.id,
      title: 'Heute erledigen',
      quadrant: 'Q2',
      planned_day: today,
    },
    {
      week_id: week.id,
      role_id: role.id,
      title: 'Heute verschieben',
      quadrant: 'Q2',
      planned_day: today,
    },
  ])

  return { week, role }
}

// DoD 10: Aktivität abhaken → Reload → Status bleibt erhalten.
test('Abhaken übersteht einen Reload', async ({ authedPage: page, db }) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  await seedActiveWeek(db)

  // Neu laden statt den Tab anzuklicken: die Seite stand beim Anmelden schon
  // auf /heute, ein Klick auf den aktiven Tab holt keine Daten nach.
  await page.goto('./heute')
  await expect(page.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible()

  const toggle = page.getByRole('button', { name: /Heute erledigen/ })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')

  await page.reload()
  await expect(page.getByRole('button', { name: /Heute erledigen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

// DoD 11: Aktivität von heute auf morgen verschieben, in maximal 2 Interaktionen.
test('Verschieben auf morgen braucht einen Tap', async ({ authedPage: page, db }) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  const { week } = await seedActiveWeek(db)

  // Neu laden statt den Tab anzuklicken: die Seite stand beim Anmelden schon
  // auf /heute, ein Klick auf den aktiven Tab holt keine Daten nach.
  await page.goto('./heute')

  const card = page.getByRole('listitem').filter({ hasText: 'Heute verschieben' })
  // Interaktion 1 und einzige: ein Tap auf „Auf morgen“.
  await card.getByRole('button', { name: 'Auf morgen' }).click()

  // Am Abhak-Knopf prüfen, nicht am Text: den gibt es auch im sr-only-Label.
  await expect(page.getByRole('button', { name: /^Heute verschieben/ })).toBeHidden()

  const moved = await db.select<{ planned_day: number }[]>(
    `week_items?week_id=eq.${week.id}&title=eq.Heute%20verschieben&select=planned_day`,
  )
  expect(moved[0]?.planned_day).toBe(tomorrow)
})

// DoD 14: Zweites Gerät simulieren — zweiter Browser-Context, gleicher Login.
test('Zweiter Browser-Context sieht dieselben Daten', async ({ authedPage: page, db, browser }) => {
  test.skip(test.info().project.name !== 'mobile', 'Nur einmal ausführen — geteilte Daten.')
  await seedActiveWeek(db)

  // Neu laden statt den Tab anzuklicken: die Seite stand beim Anmelden schon
  // auf /heute, ein Klick auf den aktiven Tab holt keine Daten nach.
  await page.goto('./heute')
  await page.getByRole('button', { name: /Heute erledigen/ }).click()
  await expect(page.getByRole('button', { name: /Heute erledigen/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  )

  // Zweites „Gerät“: eigener Context, dieselbe Session aus dem localStorage.
  const storage = await page.context().storageState()
  const second = await browser.newContext({ storageState: storage })
  try {
    const secondPage = await second.newPage()
    await secondPage.goto(page.url())
    await expect(secondPage.getByRole('heading', { name: 'Heute', level: 1 })).toBeVisible()
    await expect(secondPage.getByRole('button', { name: /Heute erledigen/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(secondPage.getByRole('button', { name: /^Heute verschieben/ })).toBeVisible()
  } finally {
    await second.close()
  }
})
