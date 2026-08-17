export type HabitFrequencyType =
  'daily' | 'weekly' | 'custom_days' | 'subday_interval' | 'times_per_day'

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
  pinned?: boolean
  reminderTimes?: string[]
  motivationNotes?: string
  // Streak Protection & Rest Days
  restDays?: number[] // Days of week (0=Sun, 6=Sat) where rest is planned without breaking streaks
  frozenDates?: string[] // ISO dates (YYYY-MM-DD) frozen for illness/travel/recovery
  // Routine Stacking
  routineId?: string
  routineName?: string
  routineOrder?: number
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

export interface HabitRoutineStack {
  id: string
  name: string
  habits: Habit[]
  completedTodayCount: number
  totalCount: number
  isFullyCompletedToday: boolean
}

export type CreateHabitInput = Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'archived'> & {
  archived?: boolean
}

export type UpdateHabitInput = Partial<Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>>
