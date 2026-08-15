export type HabitFrequencyType =
  | 'daily'
  | 'weekly'
  | 'custom_days'
  | 'subday_interval'
  | 'times_per_day'

export type HabitTargetType = 'boolean' | 'numeric' | 'timer'

export interface HabitTimeWindow {
  startTime: string
  endTime: string
}

export interface Habit {
  id: string
  title: string
  description?: string
  color: string
  icon?: string
  categoryId?: string
  frequencyType: HabitFrequencyType
  targetDaysOfWeek?: number[]
  targetCountPerWeek?: number
  intervalHours?: number
  timesPerDay?: number
  timeWindow?: HabitTimeWindow
  targetType: HabitTargetType
  targetValue?: number
  unit?: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface HabitLog {
  id: string
  habitId: string
  date: string
  timestamp: string
  intervalIndex?: number
  completed: boolean
  value?: number
  durationSeconds?: number
  note?: string
  createdAt: string
  updatedAt: string
}

export interface HabitCategory {
  id: string
  name: string
  color: string
  icon?: string
}
