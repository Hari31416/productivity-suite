import { describe, it, expect } from 'vitest'
import {
  calculateDailyProductivityScore,
  getProductivityStatus,
  getGreeting
} from '@/modules/dashboard/utils/dashboardScore'

describe('Automated Testing: Daily Productivity Score Calculations', () => {
  it('returns 0 when no habits or tasks exist', () => {
    const score = calculateDailyProductivityScore({
      habitsCompleted: 0,
      habitsTotal: 0,
      tasksCompleted: 0,
      tasksTotal: 0
    })
    expect(score).toBe(0)
    expect(getProductivityStatus(score).label).toBe('Ready to Begin')
  })

  it('calculates 50% habit completion when 1 of 2 habits is done and no tasks exist', () => {
    const score = calculateDailyProductivityScore({
      habitsCompleted: 1,
      habitsTotal: 2,
      tasksCompleted: 0,
      tasksTotal: 0
    })
    expect(score).toBe(50)
    expect(getProductivityStatus(score).label).toBe('Making Headway')
  })

  it('calculates weighted score accurately when both habits and tasks exist', () => {
    // 2 habits: 1 completed (50%)
    // 2 tasks: 2 completed (100%)
    // Combined: 50% * 0.5 + 100% * 0.5 = 75%
    const score = calculateDailyProductivityScore({
      habitsCompleted: 1,
      habitsTotal: 2,
      tasksCompleted: 2,
      tasksTotal: 2
    })
    expect(score).toBe(75)
    expect(getProductivityStatus(score).label).toBe('Great Progress')
  })

  it('calculates 100% when all habits and tasks are completed', () => {
    const score = calculateDailyProductivityScore({
      habitsCompleted: 4,
      habitsTotal: 4,
      tasksCompleted: 3,
      tasksTotal: 3
    })
    expect(score).toBe(100)
    expect(getProductivityStatus(score).label).toBe('Exceptional')
  })

  it('returns contextual greeting based on time of day', () => {
    expect(getGreeting(new Date('2026-08-15T09:00:00'))).toBe('Good morning')
    expect(getGreeting(new Date('2026-08-15T14:00:00'))).toBe('Good afternoon')
    expect(getGreeting(new Date('2026-08-15T20:00:00'))).toBe('Good evening')
  })
})
