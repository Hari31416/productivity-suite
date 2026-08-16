import {
  parseISO,
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  getDay,
  getDate,
  setDate,
  startOfDay
} from 'date-fns'
import type { RecurrenceRule } from '../types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface OccurrenceSlot {
  date: string
  time?: string
}

export function formatRecurrenceRule(rule: RecurrenceRule): string {
  const interval = Math.max(1, rule.interval || 1)
  let text = ''

  if (rule.frequency === 'hourly') {
    text = interval === 1 ? 'Hourly' : `Every ${interval} hours`
    if (rule.startTime && rule.endTime) {
      text += ` (${rule.startTime} - ${rule.endTime})`
    }
  } else if (rule.frequency === 'daily') {
    text = interval === 1 ? 'Daily' : `Every ${interval} days`
  } else if (rule.frequency === 'weekly') {
    const days =
      rule.daysOfWeek && rule.daysOfWeek.length > 0
        ? rule.daysOfWeek
            .slice()
            .sort((a, b) => a - b)
            .map((d) => DAY_NAMES[d])
            .join(', ')
        : ''
    const freqPart = interval === 1 ? 'Weekly' : `Every ${interval} weeks`
    text = days ? `${freqPart} on ${days}` : freqPart
  } else if (rule.frequency === 'monthly') {
    const freqPart = interval === 1 ? 'Monthly' : `Every ${interval} months`
    text = rule.dayOfMonth ? `${freqPart} on day ${rule.dayOfMonth}` : freqPart
  } else if (rule.frequency === 'yearly') {
    text = interval === 1 ? 'Yearly' : `Every ${interval} years`
  } else {
    text = 'Recurring'
  }

  if (rule.timesOfDay && rule.timesOfDay.length > 0 && rule.frequency !== 'hourly') {
    text += ` at ${rule.timesOfDay.join(', ')}`
  }

  if (rule.endCondition) {
    if (rule.endCondition.type === 'after_count' && rule.endCondition.count) {
      text += ` (for ${rule.endCondition.count} times)`
    } else if (rule.endCondition.type === 'on_date' && rule.endCondition.endDate) {
      try {
        const formattedEnd = format(parseISO(rule.endCondition.endDate), 'MMM d, yyyy')
        text += ` (until ${formattedEnd})`
      } catch {
        text += ` (until ${rule.endCondition.endDate})`
      }
    }
  }

  return text
}

export function computeNextDueDate(currentDueDate: string, rule: RecurrenceRule): string | null {
  const baseDate = parseISO(currentDueDate)
  const interval = Math.max(1, rule.interval || 1)
  let nextDate: Date

  switch (rule.frequency) {
    case 'hourly':
    case 'daily':
      nextDate = addDays(baseDate, interval)
      break
    case 'weekly':
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        const sortedDays = rule.daysOfWeek.slice().sort((a, b) => a - b)
        const currentDay = getDay(baseDate)
        const nextDayOfWeek = sortedDays.find((d) => d > currentDay)
        if (nextDayOfWeek !== undefined) {
          nextDate = addDays(baseDate, nextDayOfWeek - currentDay)
        } else {
          const firstDay = sortedDays[0]
          const daysToNextWeek = 7 - currentDay + firstDay
          nextDate = addDays(baseDate, daysToNextWeek + (interval - 1) * 7)
        }
      } else {
        nextDate = addWeeks(baseDate, interval)
      }
      break
    case 'monthly': {
      const targetDay = rule.dayOfMonth || getDate(baseDate)
      const futureMonth = addMonths(baseDate, interval)
      nextDate = setDate(futureMonth, Math.min(targetDay, 28))
      break
    }
    case 'yearly':
      nextDate = addYears(baseDate, interval)
      break
    default:
      nextDate = addDays(baseDate, interval)
  }

  const formattedNext = format(nextDate, 'yyyy-MM-dd')

  if (rule.endCondition?.type === 'on_date' && rule.endCondition.endDate) {
    if (formattedNext > rule.endCondition.endDate) {
      return null
    }
  }

  return formattedNext
}

export function generateOccurrenceSlots(
  rule: RecurrenceRule,
  startDateStr: string,
  upToDateStr: string,
  existingKeys: string[] = [],
  initialCount?: number
): OccurrenceSlot[] {
  const existingSet = new Set(existingKeys)
  const resultSlots: OccurrenceSlot[] = []

  const start = parseISO(startDateStr)
  const upTo = parseISO(upToDateStr)

  if (isAfter(start, upTo)) {
    return []
  }

  const interval = Math.max(1, rule.interval || 1)
  const maxOccurrences =
    rule.endCondition?.type === 'after_count' ? (rule.endCondition.count ?? 100) : 500

  let totalCount = initialCount !== undefined ? initialCount : existingSet.size
  let cursor = startOfDay(start)
  let loopGuard = 0
  const maxLoops = 2000

  // Helper to add slot
  const tryAddSlot = (dateStr: string, timeStr?: string): boolean => {
    if (
      rule.endCondition?.type === 'on_date' &&
      rule.endCondition.endDate &&
      dateStr > rule.endCondition.endDate
    ) {
      return false
    }
    const key = `${dateStr}@${timeStr || 'default'}`
    if (!existingSet.has(key)) {
      if (totalCount < maxOccurrences) {
        resultSlots.push({ date: dateStr, time: timeStr })
        existingSet.add(key)
        totalCount++
        return true
      }
      return false
    }
    return true
  }

  if (rule.frequency === 'hourly') {
    // Generate times between startTime and endTime
    const startHour = rule.startTime ? parseInt(rule.startTime.split(':')[0], 10) : 9
    const startMin = rule.startTime ? parseInt(rule.startTime.split(':')[1] || '0', 10) : 0
    const endHour = rule.endTime ? parseInt(rule.endTime.split(':')[0], 10) : 18
    const endMin = rule.endTime ? parseInt(rule.endTime.split(':')[1] || '0', 10) : 0

    const daysOfWeek =
      rule.daysOfWeek && rule.daysOfWeek.length > 0 ? new Set(rule.daysOfWeek) : null

    while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
      const currentDayOfWeek = getDay(cursor)
      if (!daysOfWeek || daysOfWeek.has(currentDayOfWeek)) {
        const dateStr = format(cursor, 'yyyy-MM-dd')
        let curMinute = startHour * 60 + startMin
        const endMinuteTotal = endHour * 60 + endMin

        while (curMinute <= endMinuteTotal) {
          const h = Math.floor(curMinute / 60)
          const m = curMinute % 60
          const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

          if (!tryAddSlot(dateStr, timeStr)) {
            return resultSlots
          }
          curMinute += interval * 60
        }
      }
      cursor = addDays(cursor, 1)
    }
  } else if (rule.timesOfDay && rule.timesOfDay.length > 0) {
    // Multi-time per day recurrence on daily/weekly schedules
    if (rule.frequency === 'daily') {
      while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
        const dateStr = format(cursor, 'yyyy-MM-dd')
        for (const t of rule.timesOfDay) {
          if (!tryAddSlot(dateStr, t)) {
            return resultSlots
          }
        }
        cursor = addDays(cursor, interval)
      }
    } else if (rule.frequency === 'weekly') {
      const daysOfWeek =
        rule.daysOfWeek && rule.daysOfWeek.length > 0
          ? rule.daysOfWeek.slice().sort((a, b) => a - b)
          : [getDay(cursor)]

      while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
        const weekStart = addDays(cursor, -getDay(cursor))
        for (const d of daysOfWeek) {
          const candidate = addDays(weekStart, d)
          if (!isBefore(candidate, startOfDay(start)) && !isAfter(candidate, upTo)) {
            const dateStr = format(candidate, 'yyyy-MM-dd')
            for (const t of rule.timesOfDay) {
              if (!tryAddSlot(dateStr, t)) {
                return resultSlots
              }
            }
          }
        }
        cursor = addWeeks(cursor, interval)
      }
    }
  } else {
    // Standard daily, weekly, monthly, yearly date slots
    if (rule.frequency === 'daily') {
      while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
        const dateStr = format(cursor, 'yyyy-MM-dd')
        if (!tryAddSlot(dateStr)) {
          break
        }
        cursor = addDays(cursor, interval)
      }
    } else if (rule.frequency === 'weekly') {
      const daysOfWeek =
        rule.daysOfWeek && rule.daysOfWeek.length > 0
          ? rule.daysOfWeek.slice().sort((a, b) => a - b)
          : [getDay(cursor)]

      while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
        const weekStart = addDays(cursor, -getDay(cursor))
        for (const d of daysOfWeek) {
          const candidate = addDays(weekStart, d)
          if (!isBefore(candidate, startOfDay(start)) && !isAfter(candidate, upTo)) {
            const dateStr = format(candidate, 'yyyy-MM-dd')
            if (!tryAddSlot(dateStr)) {
              break
            }
          }
        }
        cursor = addWeeks(cursor, interval)
      }
    } else if (rule.frequency === 'monthly') {
      const targetDay = rule.dayOfMonth || getDate(start)
      while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
        const dateStr = format(cursor, 'yyyy-MM-dd')
        if (!tryAddSlot(dateStr)) {
          break
        }
        const nextMonth = addMonths(cursor, interval)
        cursor = setDate(nextMonth, Math.min(targetDay, 28))
      }
    } else if (rule.frequency === 'yearly') {
      while (!isAfter(cursor, upTo) && loopGuard++ < maxLoops) {
        const dateStr = format(cursor, 'yyyy-MM-dd')
        if (!tryAddSlot(dateStr)) {
          break
        }
        cursor = addYears(cursor, interval)
      }
    }
  }

  return resultSlots.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.time || '').localeCompare(b.time || '')
  })
}

export function generateOccurrences(
  rule: RecurrenceRule,
  startDateStr: string,
  upToDateStr: string,
  existingDates: string[] = []
): string[] {
  const existingKeys = existingDates.map((d) => `${d}@default`)
  const slots = generateOccurrenceSlots(rule, startDateStr, upToDateStr, existingKeys)
  return Array.from(new Set(slots.map((s) => s.date))).sort()
}
