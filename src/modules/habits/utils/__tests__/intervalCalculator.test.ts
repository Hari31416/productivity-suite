import { describe, it, expect } from 'vitest'
import {
  generateSubdayIntervalSlots,
  generateTimesPerDaySlots,
  getHabitSlots,
  mapLogsToSlots,
  getSubdayProgress,
  isSubdayHabitCompleted
} from '../intervalCalculator'
import type { Habit, HabitLog } from '../../types'

describe('intervalCalculator', () => {
  describe('generateSubdayIntervalSlots', () => {
    it('generates slots from 08:00 to 20:00 with 3-hour interval', () => {
      const slots = generateSubdayIntervalSlots('08:00', '20:00', 3)
      expect(slots).toHaveLength(5)
      expect(slots.map((s) => s.label)).toEqual(['08:00', '11:00', '14:00', '17:00', '20:00'])
      expect(slots[0].index).toBe(0)
      expect(slots[4].index).toBe(4)
    })

    it('generates slots from 09:00 to 12:00 with 1-hour interval', () => {
      const slots = generateSubdayIntervalSlots('09:00', '12:00', 1)
      expect(slots).toHaveLength(4)
      expect(slots.map((s) => s.label)).toEqual(['09:00', '10:00', '11:00', '12:00'])
    })

    it('handles fractional interval hours (e.g. 0.5h / 30m)', () => {
      const slots = generateSubdayIntervalSlots('10:00', '11:30', 0.5)
      expect(slots).toHaveLength(4)
      expect(slots.map((s) => s.label)).toEqual(['10:00', '10:30', '11:00', '11:30'])
    })

    it('handles start time after end time gracefully', () => {
      const slots = generateSubdayIntervalSlots('20:00', '08:00', 2)
      expect(slots).toHaveLength(1)
      expect(slots[0].label).toBe('20:00')
    })
  })

  describe('generateTimesPerDaySlots', () => {
    it('generates slots for timesPerDay = 4', () => {
      const slots = generateTimesPerDaySlots(4)
      expect(slots).toHaveLength(4)
      expect(slots.map((s) => s.label)).toEqual(['#1', '#2', '#3', '#4'])
      expect(slots.map((s) => s.index)).toEqual([0, 1, 2, 3])
    })

    it('handles timesPerDay <= 0 by defaulting to 1', () => {
      const slots = generateTimesPerDaySlots(0)
      expect(slots).toHaveLength(1)
      expect(slots[0].label).toBe('#1')
    })
  })

  describe('getHabitSlots', () => {
    it('returns subday interval slots for subday_interval frequency', () => {
      const habit: Habit = {
        id: 'h1',
        title: 'Drink Water',
        color: '#3b82f6',
        frequencyType: 'subday_interval',
        timeWindow: { startTime: '09:00', endTime: '15:00' },
        intervalHours: 3,
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const slots = getHabitSlots(habit)
      expect(slots).toHaveLength(3)
      expect(slots.map((s) => s.label)).toEqual(['09:00', '12:00', '15:00'])
    })

    it('returns times per day slots for times_per_day frequency', () => {
      const habit: Habit = {
        id: 'h2',
        title: 'Posture Check',
        color: '#10b981',
        frequencyType: 'times_per_day',
        timesPerDay: 3,
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const slots = getHabitSlots(habit)
      expect(slots).toHaveLength(3)
      expect(slots.map((s) => s.label)).toEqual(['#1', '#2', '#3'])
    })

    it('returns single daily slot for daily frequency', () => {
      const habit: Habit = {
        id: 'h3',
        title: 'Read Book',
        color: '#8b5cf6',
        frequencyType: 'daily',
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const slots = getHabitSlots(habit)
      expect(slots).toHaveLength(1)
      expect(slots[0].label).toBe('Daily')
    })
  })

  describe('mapLogsToSlots and getSubdayProgress', () => {
    const habit: Habit = {
      id: 'h1',
      title: 'Eye Drops',
      color: '#06b6d4',
      frequencyType: 'subday_interval',
      timeWindow: { startTime: '09:00', endTime: '15:00' },
      intervalHours: 3,
      targetType: 'boolean',
      createdAt: '2026-08-01T00:00:00.000Z',
      updatedAt: '2026-08-01T00:00:00.000Z',
      archived: false
    }

    it('computes incomplete progress when only some slots are logged', () => {
      const logs: HabitLog[] = [
        {
          id: 'log-1',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T09:05:00.000Z',
          intervalIndex: 0,
          completed: true,
          createdAt: '2026-08-15T09:05:00.000Z',
          updatedAt: '2026-08-15T09:05:00.000Z'
        },
        {
          id: 'log-2',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T12:00:00.000Z',
          intervalIndex: 1,
          completed: true,
          createdAt: '2026-08-15T12:00:00.000Z',
          updatedAt: '2026-08-15T12:00:00.000Z'
        }
      ]

      const progress = getSubdayProgress(habit, logs)
      expect(progress.totalSlots).toBe(3)
      expect(progress.completedCount).toBe(2)
      expect(progress.percentage).toBe(67)
      expect(progress.isCompleted).toBe(false)
      expect(isSubdayHabitCompleted(habit, logs)).toBe(false)
    })

    it('computes complete progress when all slots are logged and completed', () => {
      const logs: HabitLog[] = [
        {
          id: 'log-1',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T09:05:00.000Z',
          intervalIndex: 0,
          completed: true,
          createdAt: '2026-08-15T09:05:00.000Z',
          updatedAt: '2026-08-15T09:05:00.000Z'
        },
        {
          id: 'log-2',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T12:00:00.000Z',
          intervalIndex: 1,
          completed: true,
          createdAt: '2026-08-15T12:00:00.000Z',
          updatedAt: '2026-08-15T12:00:00.000Z'
        },
        {
          id: 'log-3',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T15:00:00.000Z',
          intervalIndex: 2,
          completed: true,
          createdAt: '2026-08-15T15:00:00.000Z',
          updatedAt: '2026-08-15T15:00:00.000Z'
        }
      ]

      const progress = getSubdayProgress(habit, logs)
      expect(progress.totalSlots).toBe(3)
      expect(progress.completedCount).toBe(3)
      expect(progress.percentage).toBe(100)
      expect(progress.isCompleted).toBe(true)
      expect(isSubdayHabitCompleted(habit, logs)).toBe(true)
    })

    it('correctly maps slots using mapLogsToSlots', () => {
      const slots = getHabitSlots(habit)
      const logs: HabitLog[] = [
        {
          id: 'log-1',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T09:05:00.000Z',
          intervalIndex: 0,
          completed: true,
          createdAt: '2026-08-15T09:05:00.000Z',
          updatedAt: '2026-08-15T09:05:00.000Z'
        }
      ]

      const mapped = mapLogsToSlots(slots, logs)
      expect(mapped).toHaveLength(3)
      expect(mapped[0].completed).toBe(true)
      expect(mapped[1].completed).toBe(false)
      expect(mapped[2].completed).toBe(false)
    })
  })
})
