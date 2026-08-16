import { describe, it, expect } from 'vitest'
import {
  calculateDailyProductivityScore,
  getGreeting,
  getProductivityStatus
} from '../utils/dashboardScore'

describe('dashboardScore', () => {
  describe('calculateDailyProductivityScore', () => {
    it('returns 0 when there are no scheduled habits and no tasks', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 0,
        habitsTotal: 0,
        tasksCompleted: 0,
        tasksTotal: 0
      })
      expect(score).toBe(0)
    })

    it('calculates score based solely on habits when no tasks exist', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 3,
        habitsTotal: 4,
        tasksCompleted: 0,
        tasksTotal: 0
      })
      expect(score).toBe(75)
    })

    it('calculates score based solely on tasks when no habits exist', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 0,
        habitsTotal: 0,
        tasksCompleted: 2,
        tasksTotal: 5
      })
      expect(score).toBe(40)
    })

    it('calculates score based on total items completed when both habits and tasks exist', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 2,
        habitsTotal: 2,
        tasksCompleted: 1,
        tasksTotal: 2
      })
      expect(score).toBe(75)
    })

    it('calculates consistent score matching copy for habits 3/3 and tasks 0/1', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 3,
        habitsTotal: 3,
        tasksCompleted: 0,
        tasksTotal: 1
      })
      expect(score).toBe(75) // 3 of 4 items completed = 75%
    })

    it('returns 100 when all habits and tasks are completed', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 4,
        habitsTotal: 4,
        tasksCompleted: 3,
        tasksTotal: 3
      })
      expect(score).toBe(100)
    })

    it('clamps values to 100% maximum even if completed exceeds total', () => {
      const score = calculateDailyProductivityScore({
        habitsCompleted: 5,
        habitsTotal: 4,
        tasksCompleted: 4,
        tasksTotal: 3
      })
      expect(score).toBe(100)
    })
  })

  describe('getGreeting', () => {
    it('returns Good morning before 12:00', () => {
      const morning = new Date('2026-08-15T08:30:00')
      expect(getGreeting(morning)).toBe('Good morning')
    })

    it('returns Good afternoon between 12:00 and 17:00', () => {
      const afternoon = new Date('2026-08-15T14:30:00')
      expect(getGreeting(afternoon)).toBe('Good afternoon')
    })

    it('returns Good evening after 17:00', () => {
      const evening = new Date('2026-08-15T19:30:00')
      expect(getGreeting(evening)).toBe('Good evening')
    })
  })

  describe('getProductivityStatus', () => {
    it('returns Exceptional for scores >= 90', () => {
      expect(getProductivityStatus(95).label).toBe('Exceptional')
    })

    it('returns Great Progress for scores between 70 and 89', () => {
      expect(getProductivityStatus(75).label).toBe('Great Progress')
    })

    it('returns Making Headway for scores between 40 and 69', () => {
      expect(getProductivityStatus(50).label).toBe('Making Headway')
    })

    it('returns Getting Started for scores between 1 and 39', () => {
      expect(getProductivityStatus(20).label).toBe('Getting Started')
    })

    it('returns Ready to Begin for score 0', () => {
      expect(getProductivityStatus(0).label).toBe('Ready to Begin')
    })
  })
})
