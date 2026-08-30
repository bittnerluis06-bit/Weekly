// Handgepflegte Typen zum Schema in supabase/migrations.
// Bewusst kein generiertes File, damit der Build nicht von der CLI abhängt.

export type Horizon = 'short' | 'long'
export type GoalStatus = 'open' | 'done' | 'dropped'
export type WeekStatus = 'planning' | 'active' | 'closed'
export type Quadrant = 'Q1' | 'Q2' | 'Q3' | 'Q4'

/** 0 = Montag ... 6 = Sonntag */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface Mission {
  id: string
  user_id: string
  content: string
  updated_at: string
  created_at: string
}

export interface MissionVersion {
  id: string
  mission_id: string
  user_id: string
  content: string
  created_at: string
}

export interface Role {
  id: string
  user_id: string
  name: string
  description: string
  sort_order: number
  archived: boolean
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  role_id: string
  title: string
  description: string
  horizon: Horizon
  target_date: string | null
  status: GoalStatus
  created_at: string
}

export interface Week {
  id: string
  user_id: string
  start_date: string
  status: WeekStatus
  created_at: string
}

export interface WeekItem {
  id: string
  user_id: string
  week_id: string
  role_id: string
  goal_id: string | null
  title: string
  quadrant: Quadrant
  done: boolean
  planned_day: Weekday | null
  start_time: string | null
  end_time: string | null
  sort_order: number
  created_at: string
}

export interface FixedEvent {
  id: string
  user_id: string
  title: string
  weekday: Weekday
  start_time: string
  end_time: string
  active: boolean
  created_at: string
}

export interface Review {
  id: string
  user_id: string
  week_id: string
  wins: string
  misses: string
  learnings: string
  next_week_focus: string
  rating: number
  created_at: string
}
