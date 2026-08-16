import {
  format,
  parseISO,
  subDays,
  isBefore,
  isAfter,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import type { Habit, HabitLog } from '../types'
import { isSubdayHabitCompleted } from './intervalCalculator'

export interface StreakResult {
  currentStreak: number
  bestStreak: number
  completionRate30Days: number
  totalCompletions: number
}

export interface HeatmapDay {
  date: string
  count: number
  total: number
  ratio: number
  level: 0 | 1 | 2 | 3 | 4
}

export function isHabitCompletedOnDate(habit: Habit, logsForDate: HabitLog[]): boolean {
  if (!logsForDate || logsForDate.length === 0) {
    return false
  }

  if (habit.frequencyType === 'subday_interval' || habit.frequencyType === 'times_per_day') {
    return isSubdayHabitCompleted(habit, logsForDate)
  }

  if (habit.targetType === 'numeric') {
    const target = habit.targetValue || 1
    const totalValue = logsForDate.reduce((sum, log) => {
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? target : 0)
    }, 0)
    return totalValue >= target
  }

  if (habit.targetType === 'timer') {
    const targetMinutes = habit.targetValue || 1
    const totalMinutes = logsForDate.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number' && log.durationSeconds > 0) {
        return sum + Math.round(log.durationSeconds / 60)
      }
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? targetMinutes : 0)
    }, 0)
    return totalMinutes >= targetMinutes
  }

  return logsForDate.some((log) => log.completed)
}

export function isHabitScheduledOnDate(habit: Habit, date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (
    habit.frequencyType === 'daily' ||
    habit.frequencyType === 'subday_interval' ||
    habit.frequencyType === 'times_per_day'
  ) {
    return true
  }

  if (habit.frequencyType === 'custom_days') {
    const targetDays = habit.targetDaysOfWeek || []
    if (targetDays.length === 0) {
      return true
    }
    const dayOfWeek = dateObj.getDay()
    return targetDays.includes(dayOfWeek)
  }

  if (habit.frequencyType === 'weekly') {
    return true
  }

  return true
}

export function calculateStreak(
  habit: Habit,
  logs: HabitLog[],
  targetDateInput?: string | Date
): StreakResult {
  const targetDateObj = targetDateInput
    ? typeof targetDateInput === 'string'
      ? parseISO(targetDateInput)
      : targetDateInput
    : new Date()

  const targetDateStr = format(targetDateObj, 'yyyy-MM-dd')

  const logsByDate = new Map<string, HabitLog[]>()
  for (const log of logs) {
    if (log.habitId !== habit.id) {
      continue
    }
    const existing = logsByDate.get(log.date) || []
    existing.push(log)
    logsByDate.set(log.date, existing)
  }

  let totalCompletions = 0
  for (const [, dateLogs] of logsByDate.entries()) {
    if (isHabitCompletedOnDate(habit, dateLogs)) {
      totalCompletions += 1
    }
  }

  if (habit.frequencyType === 'weekly') {
    return calculateWeeklyStreak(habit, logsByDate, targetDateObj, totalCompletions)
  }

  let currentStreak = 0
  let bestStreak = 0
  let runningStreak = 0

  const habitCreatedDate = habit.createdAt ? parseISO(habit.createdAt) : subDays(targetDateObj, 90)

  let earliestLogDate = habitCreatedDate
  for (const dateKey of logsByDate.keys()) {
    try {
      const logD = parseISO(dateKey)
      if (isBefore(logD, earliestLogDate)) {
        earliestLogDate = logD
      }
    } catch {
      // Ignore parse error
    }
  }

  const startDate = isBefore(earliestLogDate, subDays(targetDateObj, 365))
    ? subDays(targetDateObj, 365)
    : earliestLogDate

  const normalizedStartDate = isAfter(startDate, targetDateObj) ? targetDateObj : startDate

  const allDays = eachDayOfInterval({
    start: normalizedStartDate,
    end: targetDateObj
  })

  for (const day of allDays) {
    const dayStr = format(day, 'yyyy-MM-dd')
    const scheduled = isHabitScheduledOnDate(habit, day)

    if (!scheduled) {
      continue
    }

    const dayLogs = logsByDate.get(dayStr) || []
    const completed = isHabitCompletedOnDate(habit, dayLogs)

    if (completed) {
      runningStreak += 1
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak
      }
    } else {
      runningStreak = 0
    }
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isTargetToday = targetDateStr === todayStr

  let checkDate = targetDateObj
  let targetScheduled = isHabitScheduledOnDate(habit, checkDate)
  let targetLogs = logsByDate.get(format(checkDate, 'yyyy-MM-dd')) || []
  let targetCompleted = targetScheduled && isHabitCompletedOnDate(habit, targetLogs)

  if (isTargetToday && !targetCompleted) {
    checkDate = subDays(checkDate, 1)
  }

  while (true) {
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    const scheduled = isHabitScheduledOnDate(habit, checkDate)

    if (scheduled) {
      const dateLogs = logsByDate.get(dateStr) || []
      const completed = isHabitCompletedOnDate(habit, dateLogs)

      if (completed) {
        currentStreak += 1
      } else {
        break
      }
    }

    if (isBefore(checkDate, normalizedStartDate)) {
      break
    }
    checkDate = subDays(checkDate, 1)
  }

  const last30Days = eachDayOfInterval({
    start: subDays(targetDateObj, 29),
    end: targetDateObj
  })

  let scheduled30Count = 0
  let completed30Count = 0

  for (const day of last30Days) {
    if (isHabitScheduledOnDate(habit, day)) {
      scheduled30Count += 1
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayLogs = logsByDate.get(dayStr) || []
      if (isHabitCompletedOnDate(habit, dayLogs)) {
        completed30Count += 1
      }
    }
  }

  const completionRate30Days =
    scheduled30Count > 0 ? Math.round((completed30Count / scheduled30Count) * 100) : 0

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    completionRate30Days,
    totalCompletions
  }
}

function calculateWeeklyStreak(
  habit: Habit,
  logsByDate: Map<string, HabitLog[]>,
  targetDate: Date,
  totalCompletions: number
): StreakResult {
  const targetCount = habit.targetCountPerWeek || 1
  let currentStreak = 0
  let bestStreak = 0
  let runningStreak = 0

  const weeksBack = 26
  const weekQualifies: boolean[] = []

  for (let w = weeksBack; w >= 0; w--) {
    const refDate = subDays(targetDate, w * 7)
    const start = startOfWeek(refDate, { weekStartsOn: 1 })
    const end = endOfWeek(refDate, { weekStartsOn: 1 })

    const daysInWeek = eachDayOfInterval({ start, end })
    let completedInWeek = 0

    for (const day of daysInWeek) {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayLogs = logsByDate.get(dayStr) || []
      if (isHabitCompletedOnDate(habit, dayLogs)) {
        completedInWeek += 1
      }
    }

    const qualified = completedInWeek >= targetCount
    weekQualifies.push(qualified)

    if (qualified) {
      runningStreak += 1
      if (runningStreak > bestStreak) {
        bestStreak = runningStreak
      }
    } else {
      runningStreak = 0
    }
  }

  const currentWeekQualified = weekQualifies[weekQualifies.length - 1]
  let idx = currentWeekQualified ? weekQualifies.length - 1 : weekQualifies.length - 2

  while (idx >= 0 && weekQualifies[idx]) {
    currentStreak += 1
    idx -= 1
  }

  const last4Weeks = weekQualifies.slice(-4)
  const completedWeeks = last4Weeks.filter(Boolean).length
  const completionRate30Days = Math.round((completedWeeks / last4Weeks.length) * 100)

  return {
    currentStreak,
    bestStreak: Math.max(bestStreak, currentStreak),
    completionRate30Days,
    totalCompletions
  }
}

export function generateHeatmapData(
  habits: Habit[],
  logs: HabitLog[],
  startDateInput: string | Date,
  endDateInput: string | Date
): HeatmapDay[] {
  const start = typeof startDateInput === 'string' ? parseISO(startDateInput) : startDateInput
  const end = typeof endDateInput === 'string' ? parseISO(endDateInput) : endDateInput

  const days = eachDayOfInterval({ start, end })

  const logsByDate = new Map<string, HabitLog[]>()
  for (const log of logs) {
    const existing = logsByDate.get(log.date) || []
    existing.push(log)
    logsByDate.set(log.date, existing)
  }

  const activeHabits = habits.filter((h) => !h.archived)

  return days.map((day) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const scheduledHabits = activeHabits.filter((h) => isHabitScheduledOnDate(h, day))

    const total = scheduledHabits.length
    const dayLogs = logsByDate.get(dateStr) || []

    let completedCount = 0
    for (const habit of scheduledHabits) {
      const habitLogs = dayLogs.filter((l) => l.habitId === habit.id)
      if (isHabitCompletedOnDate(habit, habitLogs)) {
        completedCount += 1
      }
    }

    const ratio = total > 0 ? completedCount / total : 0
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (ratio > 0.75) {
      level = 4
    } else if (ratio > 0.5) {
      level = 3
    } else if (ratio > 0.25) {
      level = 2
    } else if (ratio > 0) {
      level = 1
    }

    return {
      date: dateStr,
      count: completedCount,
      total,
      ratio: Number(ratio.toFixed(2)),
      level
    }
  })
}
