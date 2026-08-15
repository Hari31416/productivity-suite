import { describe, it, expect } from 'vitest'
import {
  isHabitCompletedOnDate,
  isHabitScheduledOnDate,
  calculateStreak,
  generateHeatmapData
} from '../streakCalculator'
import type { Habit, HabitLog } from '../../types'

describe('streakCalculator', () => {
  describe('isHabitCompletedOnDate', () => {
    it('returns true for boolean habit when completed log exists', () => {
      const habit: Habit = {
        id: 'h1',
        title: 'Meditate',
        color: '#8b5cf6',
        frequencyType: 'daily',
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const logs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        }
      ]

      expect(isHabitCompletedOnDate(habit, logs)).toBe(true)
    })

    it('returns false for boolean habit when log is not completed or empty', () => {
      const habit: Habit = {
        id: 'h1',
        title: 'Meditate',
        color: '#8b5cf6',
        frequencyType: 'daily',
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      expect(isHabitCompletedOnDate(habit, [])).toBe(false)

      const incompleteLogs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          completed: false,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        }
      ]
      expect(isHabitCompletedOnDate(habit, incompleteLogs)).toBe(false)
    })

    it('evaluates numeric habit completion against targetValue', () => {
      const habit: Habit = {
        id: 'h2',
        title: 'Drink Water',
        color: '#3b82f6',
        frequencyType: 'daily',
        targetType: 'numeric',
        targetValue: 8,
        unit: 'glasses',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const partialLogs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h2',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          value: 4,
          completed: false,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        }
      ]
      expect(isHabitCompletedOnDate(habit, partialLogs)).toBe(false)

      const completedLogs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h2',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          value: 8,
          completed: true,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        }
      ]
      expect(isHabitCompletedOnDate(habit, completedLogs)).toBe(true)
    })
  })

  describe('isHabitScheduledOnDate', () => {
    it('returns true every day for daily habits', () => {
      const habit: Habit = {
        id: 'h1',
        title: 'Daily Walk',
        color: '#10b981',
        frequencyType: 'daily',
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      expect(isHabitScheduledOnDate(habit, '2026-08-15')).toBe(true)
      expect(isHabitScheduledOnDate(habit, '2026-08-16')).toBe(true)
    })

    it('returns true only on specified days of week for custom_days', () => {
      // 2026-08-10 is Monday (1), 2026-08-11 is Tuesday (2), 2026-08-12 is Wednesday (3)
      const habit: Habit = {
        id: 'h2',
        title: 'Gym Workout',
        color: '#f97316',
        frequencyType: 'custom_days',
        targetDaysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      expect(isHabitScheduledOnDate(habit, '2026-08-10')).toBe(true) // Mon
      expect(isHabitScheduledOnDate(habit, '2026-08-11')).toBe(false) // Tue
      expect(isHabitScheduledOnDate(habit, '2026-08-12')).toBe(true) // Wed
    })
  })

  describe('calculateStreak', () => {
    it('calculates current streak and best streak for consecutive daily logs', () => {
      const habit: Habit = {
        id: 'h1',
        title: 'Morning Yoga',
        color: '#8b5cf6',
        frequencyType: 'daily',
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const logs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h1',
          date: '2026-08-11',
          timestamp: '2026-08-11T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-11T08:00:00.000Z',
          updatedAt: '2026-08-11T08:00:00.000Z'
        },
        {
          id: 'l2',
          habitId: 'h1',
          date: '2026-08-12',
          timestamp: '2026-08-12T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-12T08:00:00.000Z',
          updatedAt: '2026-08-12T08:00:00.000Z'
        },
        {
          id: 'l3',
          habitId: 'h1',
          date: '2026-08-13',
          timestamp: '2026-08-13T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-13T08:00:00.000Z',
          updatedAt: '2026-08-13T08:00:00.000Z'
        },
        {
          id: 'l4',
          habitId: 'h1',
          date: '2026-08-14',
          timestamp: '2026-08-14T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-14T08:00:00.000Z',
          updatedAt: '2026-08-14T08:00:00.000Z'
        },
        {
          id: 'l5',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        }
      ]

      const result = calculateStreak(habit, logs, '2026-08-15')
      expect(result.currentStreak).toBe(5)
      expect(result.bestStreak).toBe(5)
      expect(result.totalCompletions).toBe(5)
      expect(result.completionRate30Days).toBeGreaterThan(0)
    })

    it('handles custom days without breaking streak on unscheduled days', () => {
      // 2026-08-10 (Mon), 2026-08-12 (Wed), 2026-08-14 (Fri)
      const habit: Habit = {
        id: 'h2',
        title: 'Strength Training',
        color: '#ef4444',
        frequencyType: 'custom_days',
        targetDaysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        targetType: 'boolean',
        createdAt: '2026-08-01T00:00:00.000Z',
        updatedAt: '2026-08-01T00:00:00.000Z',
        archived: false
      }

      const logs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h2',
          date: '2026-08-10', // Mon
          timestamp: '2026-08-10T10:00:00.000Z',
          completed: true,
          createdAt: '2026-08-10T10:00:00.000Z',
          updatedAt: '2026-08-10T10:00:00.000Z'
        },
        {
          id: 'l2',
          habitId: 'h2',
          date: '2026-08-12', // Wed
          timestamp: '2026-08-12T10:00:00.000Z',
          completed: true,
          createdAt: '2026-08-12T10:00:00.000Z',
          updatedAt: '2026-08-12T10:00:00.000Z'
        },
        {
          id: 'l3',
          habitId: 'h2',
          date: '2026-08-14', // Fri
          timestamp: '2026-08-14T10:00:00.000Z',
          completed: true,
          createdAt: '2026-08-14T10:00:00.000Z',
          updatedAt: '2026-08-14T10:00:00.000Z'
        }
      ]

      const result = calculateStreak(habit, logs, '2026-08-14')
      expect(result.currentStreak).toBe(3)
      expect(result.bestStreak).toBe(3)
      expect(result.totalCompletions).toBe(3)
    })
  })

  describe('generateHeatmapData', () => {
    it('computes daily completion ratio and levels across multiple habits', () => {
      const habits: Habit[] = [
        {
          id: 'h1',
          title: 'Hydrate',
          color: '#3b82f6',
          frequencyType: 'daily',
          targetType: 'boolean',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
          archived: false
        },
        {
          id: 'h2',
          title: 'Stretch',
          color: '#10b981',
          frequencyType: 'daily',
          targetType: 'boolean',
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-01T00:00:00.000Z',
          archived: false
        }
      ]

      const logs: HabitLog[] = [
        {
          id: 'l1',
          habitId: 'h1',
          date: '2026-08-14',
          timestamp: '2026-08-14T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-14T08:00:00.000Z',
          updatedAt: '2026-08-14T08:00:00.000Z'
        },
        {
          id: 'l2',
          habitId: 'h1',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        },
        {
          id: 'l3',
          habitId: 'h2',
          date: '2026-08-15',
          timestamp: '2026-08-15T08:00:00.000Z',
          completed: true,
          createdAt: '2026-08-15T08:00:00.000Z',
          updatedAt: '2026-08-15T08:00:00.000Z'
        }
      ]

      const heatmap = generateHeatmapData(
        habits,
        logs,
        '2026-08-13',
        '2026-08-15'
      )
      expect(heatmap).toHaveLength(3)

      // 2026-08-13: 0 completed out of 2 -> ratio 0, level 0
      expect(heatmap[0].date).toBe('2026-08-13')
      expect(heatmap[0].count).toBe(0)
      expect(heatmap[0].ratio).toBe(0)
      expect(heatmap[0].level).toBe(0)

      // 2026-08-14: 1 completed out of 2 -> ratio 0.5, level 2
      expect(heatmap[1].date).toBe('2026-08-14')
      expect(heatmap[1].count).toBe(1)
      expect(heatmap[1].ratio).toBe(0.5)
      expect(heatmap[1].level).toBe(2)

      // 2026-08-15: 2 completed out of 2 -> ratio 1.0, level 4
      expect(heatmap[2].date).toBe('2026-08-15')
      expect(heatmap[2].count).toBe(2)
      expect(heatmap[2].ratio).toBe(1)
      expect(heatmap[2].level).toBe(4)
    })
  })
})
