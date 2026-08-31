import { isSupabaseConfigured, supabase } from './supabase'
import { toISODate } from './date'
import type {
  FixedEvent,
  Goal,
  GoalStatus,
  Horizon,
  Mission,
  MissionVersion,
  Quadrant,
  Role,
  Week,
  WeekItem,
  Weekday,
} from './database.types'

export class NotConfiguredError extends Error {
  constructor() {
    super('Supabase ist nicht konfiguriert. Trage VITE_SUPABASE_URL und VITE_SUPABASE_ANON_KEY in die .env ein.')
    this.name = 'NotConfiguredError'
  }
}

function assertConfigured() {
  if (!isSupabaseConfigured) throw new NotConfiguredError()
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  if (!data.user) throw new Error('Nicht angemeldet.')
  return data.user.id
}

// ------------------------------------------------------------------ Seed

/** Legt Rollen, Fixtermine und eine leere Mission an, falls noch nichts existiert. */
export async function ensureSeeded(): Promise<void> {
  assertConfigured()
  const { count, error } = await supabase
    .from('roles')
    .select('id', { count: 'exact', head: true })
  if (error) throw error
  if ((count ?? 0) > 0) return

  const { error: seedError } = await supabase.rpc('seed_my_data')
  if (seedError) throw seedError
}

// ------------------------------------------------------------------ Mission

export async function getMission(): Promise<Mission | null> {
  assertConfigured()
  const { data, error } = await supabase.from('mission').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function saveMission(content: string): Promise<Mission> {
  assertConfigured()
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('mission')
    .upsert({ user_id, content }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listMissionVersions(missionId: string): Promise<MissionVersion[]> {
  assertConfigured()
  const { data, error } = await supabase
    .from('mission_versions')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ------------------------------------------------------------------ Rollen

export async function listRoles(includeArchived = false): Promise<Role[]> {
  assertConfigured()
  let query = supabase.from('roles').select('*').order('sort_order').order('created_at')
  if (!includeArchived) query = query.eq('archived', false)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createRole(name: string, sortOrder: number): Promise<Role> {
  assertConfigured()
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('roles')
    .insert({ user_id, name, sort_order: sortOrder })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRole(id: string, patch: Partial<Pick<Role, 'name' | 'description' | 'sort_order' | 'archived'>>): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('roles').update(patch).eq('id', id)
  if (error) throw error
}

/** Schreibt die neue Reihenfolge in einem Rutsch. */
export async function reorderRoles(ids: string[]): Promise<void> {
  assertConfigured()
  await Promise.all(ids.map((id, index) => updateRole(id, { sort_order: index })))
}

// ------------------------------------------------------------------ Ziele

export async function listGoals(): Promise<Goal[]> {
  assertConfigured()
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function createGoal(input: {
  role_id: string
  title: string
  horizon: Horizon
  description?: string
  target_date?: string | null
}): Promise<Goal> {
  assertConfigured()
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id,
      role_id: input.role_id,
      title: input.title,
      horizon: input.horizon,
      description: input.description ?? '',
      target_date: input.target_date ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setGoalStatus(id: string, status: GoalStatus): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('goals').update({ status }).eq('id', id)
  if (error) throw error
}

export async function updateGoal(id: string, patch: Partial<Pick<Goal, 'title' | 'description' | 'target_date'>>): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('goals').update(patch).eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------ Fixtermine

export async function listFixedEvents(onlyActive = false): Promise<FixedEvent[]> {
  assertConfigured()
  let query = supabase.from('fixed_events').select('*').order('weekday').order('start_time')
  if (onlyActive) query = query.eq('active', true)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function createFixedEvent(input: {
  title: string
  weekday: Weekday
  start_time: string
  end_time: string
}): Promise<FixedEvent> {
  assertConfigured()
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('fixed_events')
    .insert({ user_id, ...input })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateFixedEvent(
  id: string,
  patch: Partial<Pick<FixedEvent, 'title' | 'weekday' | 'start_time' | 'end_time' | 'active'>>,
): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('fixed_events').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteFixedEvent(id: string): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('fixed_events').delete().eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------ Wochen

export async function getWeek(startDate: Date): Promise<Week | null> {
  assertConfigured()
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('start_date', toISODate(startDate))
    .maybeSingle()
  if (error) throw error
  return data
}

/** Holt die Woche oder legt sie im Status `planning` an. */
export async function getOrCreateWeek(startDate: Date): Promise<Week> {
  const existing = await getWeek(startDate)
  if (existing) return existing

  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('weeks')
    .insert({ user_id, start_date: toISODate(startDate) })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function setWeekStatus(id: string, status: Week['status']): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('weeks').update({ status }).eq('id', id)
  if (error) throw error
}

// ------------------------------------------------------------------ Wochen-Aktivitäten

export async function listWeekItems(weekId: string): Promise<WeekItem[]> {
  assertConfigured()
  const { data, error } = await supabase
    .from('week_items')
    .select('*')
    .eq('week_id', weekId)
    .order('sort_order')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function createWeekItem(input: {
  week_id: string
  role_id: string
  title: string
  quadrant: Quadrant
  goal_id?: string | null
  sort_order?: number
}): Promise<WeekItem> {
  assertConfigured()
  const user_id = await currentUserId()
  const { data, error } = await supabase
    .from('week_items')
    .insert({
      user_id,
      week_id: input.week_id,
      role_id: input.role_id,
      title: input.title,
      quadrant: input.quadrant,
      goal_id: input.goal_id ?? null,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWeekItem(
  id: string,
  patch: Partial<
    Pick<WeekItem, 'title' | 'quadrant' | 'goal_id' | 'done' | 'planned_day' | 'start_time' | 'end_time' | 'sort_order'>
  >,
): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('week_items').update(patch).eq('id', id)
  if (error) throw error
}

export async function deleteWeekItem(id: string): Promise<void> {
  assertConfigured()
  const { error } = await supabase.from('week_items').delete().eq('id', id)
  if (error) throw error
}
