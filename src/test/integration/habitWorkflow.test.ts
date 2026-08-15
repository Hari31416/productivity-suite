import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/core/db'
import { habitRepository } from '@/modules/habits/repository/habitRepository'
import { calculateStreak, generateHeatmapData } from '@/modules/habits/utils/streakCalculator'
import {
  generateSubdayIntervalSlots,
  getSubdayProgress,
  isSubdayHabitCompleted
} from '@/modules/habits/utils/intervalCalculator'
import type { Habit } from '@/modules/habits/types'

describe('Automated Testing: Habit Tracker End-to-End Workflow', () => {
  beforeEach(async () => {
    await db.habits.clear()
    await db.habitLogs.clear()
  })

  it('completes the full lifecycle for a daily boolean habit', async () => {
    // 1. Create habit
    const habit = await habitRepository.createHabit({
      title: 'Morning Meditation',
      description: '15 minutes mindfulness',
      color: '#4F46E5',
      frequencyType: 'daily',
      targetType: 'boolean'
    })

    expect(habit.id).toBeDefined()
    expect(habit.title).toBe('Morning Meditation')
    expect(habit.archived).toBe(false)

    // 2. Log completions on 3 consecutive days
    const dates = ['2026-08-10', '2026-08-11', '2026-08-12']
    for (const date of dates) {
      await habitRepository.saveHabitLog({
        habitId: habit.id,
        date,
        timestamp: `${date}T08:00:00.000Z`,
        completed: true
      })
    }

    // 3. Verify logs retrieval
    const logs = await habitRepository.getLogsForHabit(habit.id)
    expect(logs).toHaveLength(3)

    // 4. Test streak calculation on 2026-08-12
    const streakResult = calculateStreak(habit, logs, new Date('2026-08-12T12:00:00Z'))
    expect(streakResult.currentStreak).toBe(3)
    expect(streakResult.bestStreak).toBe(3)
    expect(streakResult.totalCompletions).toBe(3)

    // 5. Test streak break (skip 2026-08-13, log on 2026-08-14)
    await habitRepository.saveHabitLog({
      habitId: habit.id,
      date: '2026-08-14',
      timestamp: '2026-08-14T08:00:00.000Z',
      completed: true
    })

    const updatedLogs = await habitRepository.getLogsForHabit(habit.id)
    const brokenStreak = calculateStreak(habit, updatedLogs, new Date('2026-08-14T12:00:00Z'))
    expect(brokenStreak.currentStreak).toBe(1)
    expect(brokenStreak.bestStreak).toBe(3)
    expect(brokenStreak.totalCompletions).toBe(4)

    // 6. Test heatmap generation
    const heatmap = generateHeatmapData(
      [habit],
      updatedLogs,
      new Date('2026-08-01T00:00:00Z'),
      new Date('2026-08-15T00:00:00Z')
    )
    expect(heatmap.length).toBeGreaterThanOrEqual(14)
    const activeDay = heatmap.find((cell) => cell.date === '2026-08-12')
    expect(activeDay?.ratio).toBe(1)
    expect(activeDay?.count).toBe(1)

    // 7. Archive and delete
    await habitRepository.archiveHabit(habit.id, true)
    const archived = await habitRepository.getHabitById(habit.id)
    expect(archived?.archived).toBe(true)

    await habitRepository.deleteHabit(habit.id)
    const deleted = await habitRepository.getHabitById(habit.id)
    expect(deleted).toBeUndefined()
    const remainingLogs = await habitRepository.getLogsForHabit(habit.id)
    expect(remainingLogs).toHaveLength(0)
  })

  it('completes the full lifecycle for a sub-day interval habit', async () => {
    // 1. Create sub-day interval habit (every 3 hours between 09:00 and 18:00)
    const subdayHabit: Habit = await habitRepository.createHabit({
      title: 'Hydration Checkpoints',
      color: '#06B6D4',
      frequencyType: 'subday_interval',
      targetType: 'boolean',
      intervalHours: 3,
      timeWindow: {
        startTime: '09:00',
        endTime: '18:00'
      }
    })

    // 2. Verify generated interval slots (09:00, 12:00, 15:00, 18:00)
    const slots = generateSubdayIntervalSlots('09:00', '18:00', 3)
    expect(slots).toHaveLength(4)
    expect(slots[0].startTime).toBe('09:00')
    expect(slots[3].startTime).toBe('18:00')

    // 3. Log 2 out of 4 slots for today
    const today = '2026-08-15'
    await habitRepository.saveHabitLog({
      habitId: subdayHabit.id,
      date: today,
      timestamp: `${today}T09:00:00.000Z`,
      intervalIndex: 0,
      completed: true
    })
    await habitRepository.saveHabitLog({
      habitId: subdayHabit.id,
      date: today,
      timestamp: `${today}T12:00:00.000Z`,
      intervalIndex: 1,
      completed: true
    })

    const todayLogs = await habitRepository.getLogsForDate(today)
    const progress = getSubdayProgress(subdayHabit, todayLogs)
    expect(progress.completedCount).toBe(2)
    expect(progress.totalSlots).toBe(4)
    expect(progress.percentage).toBe(50)
    expect(isSubdayHabitCompleted(subdayHabit, todayLogs)).toBe(false)

    // 4. Complete remaining slots
    await habitRepository.saveHabitLog({
      habitId: subdayHabit.id,
      date: today,
      timestamp: `${today}T15:00:00.000Z`,
      intervalIndex: 2,
      completed: true
    })
    await habitRepository.saveHabitLog({
      habitId: subdayHabit.id,
      date: today,
      timestamp: `${today}T18:00:00.000Z`,
      intervalIndex: 3,
      completed: true
    })

    const allTodayLogs = await habitRepository.getLogsForDate(today)
    const finalProgress = getSubdayProgress(subdayHabit, allTodayLogs)
    expect(finalProgress.percentage).toBe(100)
    expect(isSubdayHabitCompleted(subdayHabit, allTodayLogs)).toBe(true)
  })

  it('completes the full lifecycle for a numeric target habit', async () => {
    // 1. Create numeric habit (target: 8 glasses of water)
    const numericHabit = await habitRepository.createHabit({
      title: 'Drink 8 Glasses of Water',
      color: '#3B82F6',
      frequencyType: 'daily',
      targetType: 'numeric',
      targetValue: 8,
      unit: 'glasses'
    })

    const date = '2026-08-15'
    // Log incremental values
    await habitRepository.setHabitLogValue(numericHabit.id, date, 4)

    let logs = await habitRepository.getLogsForHabitAndDate(numericHabit.id, date)
    expect(logs[0]?.value).toBe(4)

    // Reach target value
    await habitRepository.setHabitLogValue(numericHabit.id, date, 8, undefined, true)

    logs = await habitRepository.getLogsForHabitAndDate(numericHabit.id, date)
    expect(logs[0]?.value).toBe(8)
    expect(logs[0]?.completed).toBe(true)
  })
})
