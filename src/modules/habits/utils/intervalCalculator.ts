import type { Habit, HabitLog } from '../types'

export interface HabitSlot {
  index: number
  label: string
  startTime?: string
  endTime?: string
}

export interface SubdaySlotProgress {
  slot: HabitSlot
  log?: HabitLog
  completed: boolean
  value?: number
}

export interface SubdayProgress {
  totalSlots: number
  completedCount: number
  isCompleted: boolean
  percentage: number
  slots: SubdaySlotProgress[]
}

function parseTimeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  if (isNaN(hours) || isNaN(minutes)) {
    return 0
  }
  return hours * 60 + minutes
}

function formatMinutesToTime(minutes: number): string {
  const normalized = Math.max(0, Math.min(24 * 60 - 1, minutes))
  const h = Math.floor(normalized / 60)
  const m = normalized % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function generateSubdayIntervalSlots(
  startTime: string = '08:00',
  endTime: string = '20:00',
  intervalHours: number = 3
): HabitSlot[] {
  const startMinutes = parseTimeToMinutes(startTime)
  const endMinutes = parseTimeToMinutes(endTime)
  const validInterval = intervalHours > 0 ? intervalHours : 1
  const stepMinutes = Math.round(validInterval * 60)

  if (startMinutes > endMinutes || stepMinutes <= 0) {
    return [
      {
        index: 0,
        label: startTime,
        startTime,
        endTime: startTime
      }
    ]
  }

  const slots: HabitSlot[] = []
  let currentMinutes = startMinutes
  let index = 0

  while (currentMinutes <= endMinutes) {
    const slotTime = formatMinutesToTime(currentMinutes)
    const nextSlotMinutes = Math.min(endMinutes, currentMinutes + stepMinutes)
    const nextSlotTime = formatMinutesToTime(nextSlotMinutes)

    slots.push({
      index,
      label: slotTime,
      startTime: slotTime,
      endTime: nextSlotTime
    })

    currentMinutes += stepMinutes
    index += 1
  }

  return slots
}

export function generateTimesPerDaySlots(timesPerDay: number = 1): HabitSlot[] {
  const count = Math.max(1, Math.floor(timesPerDay || 1))
  const slots: HabitSlot[] = []

  for (let i = 0; i < count; i++) {
    slots.push({
      index: i,
      label: `#${i + 1}`
    })
  }

  return slots
}

export function getHabitSlots(habit: Habit): HabitSlot[] {
  if (habit.frequencyType === 'subday_interval') {
    const startTime = habit.timeWindow?.startTime || '08:00'
    const endTime = habit.timeWindow?.endTime || '20:00'
    const intervalHours = habit.intervalHours || 3
    return generateSubdayIntervalSlots(startTime, endTime, intervalHours)
  }

  if (habit.frequencyType === 'times_per_day') {
    return generateTimesPerDaySlots(habit.timesPerDay || 1)
  }

  return [
    {
      index: 0,
      label: 'Daily'
    }
  ]
}

export function mapLogsToSlots(slots: HabitSlot[], logs: HabitLog[]): SubdaySlotProgress[] {
  return slots.map((slot) => {
    const log = logs.find((l) => l.intervalIndex === slot.index)
    return {
      slot,
      log,
      completed: log ? log.completed : false,
      value: log?.value
    }
  })
}

export function getSubdayProgress(habit: Habit, logsForDate: HabitLog[]): SubdayProgress {
  const slots = getHabitSlots(habit)
  const mappedSlots = mapLogsToSlots(slots, logsForDate)
  const completedCount = mappedSlots.filter((s) => s.completed).length
  const totalSlots = slots.length
  const isCompleted = totalSlots > 0 && completedCount >= totalSlots
  const percentage = totalSlots > 0 ? Math.round((completedCount / totalSlots) * 100) : 0

  return {
    totalSlots,
    completedCount,
    isCompleted,
    percentage,
    slots: mappedSlots
  }
}

export function isSubdayHabitCompleted(habit: Habit, logsForDate: HabitLog[]): boolean {
  return getSubdayProgress(habit, logsForDate).isCompleted
}
