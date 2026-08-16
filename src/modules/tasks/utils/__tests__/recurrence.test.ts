import { describe, it, expect } from 'vitest'
import {
  computeNextDueDate,
  generateOccurrenceSlots,
  formatRecurrenceRule
} from '../recurrence'

describe('recurrence utility', () => {
  describe('formatRecurrenceRule', () => {
    it('formats daily recurrence properly', () => {
      expect(formatRecurrenceRule({ frequency: 'daily', interval: 1 })).toBe('Daily')
      expect(formatRecurrenceRule({ frequency: 'daily', interval: 3 })).toBe('Every 3 days')
    })

    it('formats hourly and sub-day recurrence properly', () => {
      expect(
        formatRecurrenceRule({
          frequency: 'hourly',
          interval: 2,
          startTime: '09:00',
          endTime: '17:00'
        })
      ).toBe('Every 2 hours (09:00 - 17:00)')

      expect(
        formatRecurrenceRule({
          frequency: 'daily',
          interval: 1,
          timesOfDay: ['08:00', '13:00', '20:00']
        })
      ).toBe('Daily at 08:00, 13:00, 20:00')
    })

    it('formats weekly recurrence with days of week', () => {
      expect(
        formatRecurrenceRule({ frequency: 'weekly', interval: 1, daysOfWeek: [1, 3, 5] })
      ).toBe('Weekly on Mon, Wed, Fri')
      expect(
        formatRecurrenceRule({ frequency: 'weekly', interval: 2, daysOfWeek: [0] })
      ).toBe('Every 2 weeks on Sun')
    })

    it('formats monthly and yearly recurrence with end conditions', () => {
      expect(
        formatRecurrenceRule({
          frequency: 'monthly',
          interval: 1,
          dayOfMonth: 15,
          endCondition: { type: 'after_count', count: 5 }
        })
      ).toBe('Monthly on day 15 (for 5 times)')

      expect(
        formatRecurrenceRule({
          frequency: 'yearly',
          interval: 1,
          endCondition: { type: 'on_date', endDate: '2027-12-31' }
        })
      ).toBe('Yearly (until Dec 31, 2027)')
    })
  })

  describe('computeNextDueDate', () => {
    it('computes next daily due date correctly', () => {
      const next = computeNextDueDate('2026-08-16', { frequency: 'daily', interval: 1 })
      expect(next).toBe('2026-08-17')

      const next3Days = computeNextDueDate('2026-08-16', { frequency: 'daily', interval: 3 })
      expect(next3Days).toBe('2026-08-19')
    })

    it('computes next weekly due date with day of week jumping', () => {
      const nextMon = computeNextDueDate('2026-08-16', {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [1, 3]
      })
      expect(nextMon).toBe('2026-08-17') // Monday
    })
  })

  describe('generateOccurrenceSlots (sub-day)', () => {
    it('generates hourly occurrence slots in time window', () => {
      const slots = generateOccurrenceSlots(
        {
          frequency: 'hourly',
          interval: 3,
          startTime: '09:00',
          endTime: '15:00'
        },
        '2026-08-16',
        '2026-08-16'
      )
      // 09:00, 12:00, 15:00
      expect(slots).toEqual([
        { date: '2026-08-16', time: '09:00' },
        { date: '2026-08-16', time: '12:00' },
        { date: '2026-08-16', time: '15:00' }
      ])
    })

    it('generates multi-time slots per day for specific times', () => {
      const slots = generateOccurrenceSlots(
        {
          frequency: 'daily',
          interval: 1,
          timesOfDay: ['08:00', '14:00', '20:00']
        },
        '2026-08-16',
        '2026-08-17'
      )
      expect(slots).toHaveLength(6)
      expect(slots[0]).toEqual({ date: '2026-08-16', time: '08:00' })
      expect(slots[1]).toEqual({ date: '2026-08-16', time: '14:00' })
      expect(slots[2]).toEqual({ date: '2026-08-16', time: '20:00' })
      expect(slots[3]).toEqual({ date: '2026-08-17', time: '08:00' })
    })

    it('skips existing slots to prevent duplication', () => {
      const slots = generateOccurrenceSlots(
        {
          frequency: 'daily',
          interval: 1,
          timesOfDay: ['08:00', '14:00']
        },
        '2026-08-16',
        '2026-08-16',
        ['2026-08-16@08:00']
      )
      expect(slots).toEqual([{ date: '2026-08-16', time: '14:00' }])
    })
  })
})
