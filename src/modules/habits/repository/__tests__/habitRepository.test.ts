import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/core/db'
import { habitRepository } from '../habitRepository'
import type { Habit } from '../../types'

describe('habitRepository', () => {
  beforeEach(async () => {
    await db.habits.clear()
    await db.habitLogs.clear()
  })

  afterEach(async () => {
    await db.habits.clear()
    await db.habitLogs.clear()
  })

  it('creates and retrieves habits', async () => {
    const habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'> = {
      title: 'Morning Meditation',
      description: '10 minutes of mindfulness',
      color: '#8b5cf6',
      categoryId: 'mindfulness',
      frequencyType: 'daily',
      targetType: 'boolean',
      archived: false
    }

    const created = await habitRepository.createHabit(habitData)
    expect(created.id).toBeDefined()
    expect(created.title).toBe('Morning Meditation')
    expect(created.createdAt).toBeDefined()

    const retrieved = await habitRepository.getHabitById(created.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.title).toBe('Morning Meditation')

    const all = await habitRepository.getAllHabits(false)
    expect(all).toHaveLength(1)
  })

  it('updates and archives habits', async () => {
    const created = await habitRepository.createHabit({
      title: 'Evening Run',
      color: '#f97316',
      frequencyType: 'daily',
      targetType: 'boolean',
      archived: false
    })

    const updated = await habitRepository.updateHabit(created.id, {
      title: 'Evening Jog'
    })
    expect(updated.title).toBe('Evening Jog')

    await habitRepository.archiveHabit(created.id, true)
    const active = await habitRepository.getAllHabits(false)
    expect(active).toHaveLength(0)

    const all = await habitRepository.getAllHabits(true)
    expect(all).toHaveLength(1)
    expect(all[0].archived).toBe(true)
  })

  it('deletes habit and cascades deletion of its logs', async () => {
    const created = await habitRepository.createHabit({
      title: 'Cold Shower',
      color: '#06b6d4',
      frequencyType: 'daily',
      targetType: 'boolean',
      archived: false
    })

    await habitRepository.toggleHabitLog(created.id, '2026-08-15')
    const logsBefore = await habitRepository.getLogsForHabit(created.id)
    expect(logsBefore).toHaveLength(1)

    await habitRepository.deleteHabit(created.id)

    const habitAfter = await habitRepository.getHabitById(created.id)
    expect(habitAfter).toBeUndefined()

    const logsAfter = await habitRepository.getLogsForHabit(created.id)
    expect(logsAfter).toHaveLength(0)
  })

  it('toggles habit logs correctly', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Daily Journal',
      color: '#10b981',
      frequencyType: 'daily',
      targetType: 'boolean',
      archived: false
    })

    // Toggle on
    const log1 = await habitRepository.toggleHabitLog(habit.id, '2026-08-15')
    expect(log1.completed).toBe(true)

    // Toggle off
    const log2 = await habitRepository.toggleHabitLog(habit.id, '2026-08-15')
    expect(log2.completed).toBe(false)

    // Toggle on with intervalIndex
    const log3 = await habitRepository.toggleHabitLog(habit.id, '2026-08-15', 1)
    expect(log3.completed).toBe(true)
    expect(log3.intervalIndex).toBe(1)
  })

  it('sets and updates numeric values in habit logs', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Water Intake',
      color: '#3b82f6',
      frequencyType: 'daily',
      targetType: 'numeric',
      targetValue: 8,
      unit: 'glasses',
      archived: false
    })

    const log1 = await habitRepository.setHabitLogValue(habit.id, '2026-08-15', 4, undefined, false)
    expect(log1.value).toBe(4)
    expect(log1.completed).toBe(false)

    const log2 = await habitRepository.setHabitLogValue(habit.id, '2026-08-15', 8, undefined, true)
    expect(log2.value).toBe(8)
    expect(log2.completed).toBe(true)
  })

  it('queries logs by date range', async () => {
    const habit = await habitRepository.createHabit({
      title: 'Reading',
      color: '#ec4899',
      frequencyType: 'daily',
      targetType: 'boolean',
      archived: false
    })

    await habitRepository.toggleHabitLog(habit.id, '2026-08-10')
    await habitRepository.toggleHabitLog(habit.id, '2026-08-12')
    await habitRepository.toggleHabitLog(habit.id, '2026-08-15')

    const rangeLogs = await habitRepository.getLogsForDateRange('2026-08-10', '2026-08-13')
    expect(rangeLogs).toHaveLength(2)
  })
})
