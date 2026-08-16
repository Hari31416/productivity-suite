import { db } from '@/core/db'
import type { Habit, HabitLog, CreateHabitInput, UpdateHabitInput } from '../types'

export const habitRepository = {
  async getAllHabits(includeArchived: boolean = false): Promise<Habit[]> {
    if (includeArchived) {
      return db.habits.toArray()
    }
    return db.habits.filter((habit) => !habit.archived).toArray()
  },

  async getHabitById(id: string): Promise<Habit | undefined> {
    return db.habits.get(id)
  },

  async createHabit(
    habitData: CreateHabitInput
  ): Promise<Habit> {
    const now = new Date().toISOString()
    const habit: Habit = {
      ...habitData,
      id: crypto.randomUUID(),
      archived: habitData.archived ?? false,
      createdAt: now,
      updatedAt: now
    }
    await db.habits.add(habit)
    return habit
  },

  async updateHabit(id: string, updates: UpdateHabitInput): Promise<Habit> {
    const existing = await db.habits.get(id)
    if (!existing) {
      throw new Error(`Habit with ID ${id} not found`)
    }

    const updated: Habit = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    await db.habits.put(updated)
    return updated
  },

  async archiveHabit(id: string, archived: boolean = true): Promise<Habit> {
    return this.updateHabit(id, { archived })
  },

  async deleteHabit(id: string): Promise<void> {
    await db.transaction('rw', db.habits, db.habitLogs, async () => {
      await db.habitLogs.where('habitId').equals(id).delete()
      await db.habits.delete(id)
    })
  },

  async getLogsForHabit(habitId: string): Promise<HabitLog[]> {
    return db.habitLogs.where('habitId').equals(habitId).toArray()
  },

  async getLogsForDate(date: string): Promise<HabitLog[]> {
    return db.habitLogs.where('date').equals(date).toArray()
  },

  async getLogsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<HabitLog[]> {
    return db.habitLogs
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray()
  },

  async getLogsForHabitAndDate(
    habitId: string,
    date: string
  ): Promise<HabitLog[]> {
    return db.habitLogs
      .where('[habitId+date]')
      .equals([habitId, date])
      .toArray()
  },

  async toggleHabitLog(
    habitId: string,
    date: string,
    intervalIndex?: number
  ): Promise<HabitLog> {
    const logs = await this.getLogsForHabitAndDate(habitId, date)
    const existing = logs.find((l) =>
      intervalIndex !== undefined
        ? l.intervalIndex === intervalIndex
        : l.intervalIndex === undefined || l.intervalIndex === 0
    )

    const now = new Date().toISOString()

    if (existing) {
      const updated: HabitLog = {
        ...existing,
        completed: !existing.completed,
        updatedAt: now
      }
      await db.habitLogs.put(updated)
      return updated
    }

    const newLog: HabitLog = {
      id: crypto.randomUUID(),
      habitId,
      date,
      timestamp: now,
      intervalIndex,
      completed: true,
      createdAt: now,
      updatedAt: now
    }

    await db.habitLogs.add(newLog)
    return newLog
  },

  async setHabitLogValue(
    habitId: string,
    date: string,
    value: number,
    intervalIndex?: number,
    completed?: boolean
  ): Promise<HabitLog> {
    const logs = await this.getLogsForHabitAndDate(habitId, date)
    const existing = logs.find((l) =>
      intervalIndex !== undefined
        ? l.intervalIndex === intervalIndex
        : l.intervalIndex === undefined || l.intervalIndex === 0
    )

    const now = new Date().toISOString()

    if (existing) {
      const updated: HabitLog = {
        ...existing,
        value,
        durationSeconds: value * 60,
        completed: completed !== undefined ? completed : value > 0,
        updatedAt: now
      }
      await db.habitLogs.put(updated)
      return updated
    }

    const newLog: HabitLog = {
      id: crypto.randomUUID(),
      habitId,
      date,
      timestamp: now,
      intervalIndex,
      value,
      durationSeconds: value * 60,
      completed: completed !== undefined ? completed : value > 0,
      createdAt: now,
      updatedAt: now
    }

    await db.habitLogs.add(newLog)
    return newLog
  },

  async saveHabitLog(
    log: Omit<HabitLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
  ): Promise<HabitLog> {
    const now = new Date().toISOString()
    const fullLog: HabitLog = {
      ...log,
      id: log.id || crypto.randomUUID(),
      createdAt: now,
      updatedAt: now
    }
    await db.habitLogs.put(fullLog)
    return fullLog
  },

  async deleteHabitLog(id: string): Promise<void> {
    await db.habitLogs.delete(id)
  }
}
