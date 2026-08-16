import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/core/db'
import { generateBackupData, validateBackupJson, restoreBackup } from '@/core/backup/backupService'
import { habitRepository } from '@/modules/habits/repository/habitRepository'
import { taskRepository } from '@/modules/tasks/repository/taskRepository'
import { projectRepository } from '@/modules/tasks/repository/projectRepository'
import { noteRepository } from '@/modules/notes/repository/noteRepository'
import { tagRepository } from '@/modules/notes/repository/tagRepository'
import type { BackupArchiveData } from '@/core/backup/types'

describe('Automated Testing: Backup, Validation & Recovery Workflow', () => {
  beforeEach(async () => {
    await db.habits.clear()
    await db.habitLogs.clear()
    await db.projects.clear()
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.notes.clear()
    await db.tags.clear()
  })

  it('exports, validates, and accurately restores full suite state in Replace mode', async () => {
    // 1. Seed complete suite data
    const habit = await habitRepository.createHabit({
      title: 'Daily Reading',
      color: '#4F46E5',
      frequencyType: 'daily',
      targetType: 'boolean'
    })
    await habitRepository.saveHabitLog({
      habitId: habit.id,
      date: '2026-08-15',
      timestamp: '2026-08-15T10:00:00.000Z',
      completed: true
    })

    const project = await projectRepository.createProject({
      name: 'Q3 Goals',
      color: '#10B981'
    })
    const task = await taskRepository.createTask({
      title: 'Deliver Suite',
      projectId: project.id,
      priority: 'urgent',
      dueDate: '2026-08-15'
    })
    await taskRepository.createSubtask(task.id, 'Pass all tests')

    await tagRepository.createTag({ name: 'Important', color: '#EF4444' })
    await noteRepository.createNote({
      title: 'Release Notes',
      content: '# Version 1.0 Ready',
      tags: ['Important']
    })

    // 2. Export backup
    const backupData = await generateBackupData()
    expect(backupData.metadata.formatVersion).toBe(1)
    expect(backupData.metadata.tableCounts.habits).toBe(1)
    expect(backupData.metadata.tableCounts.tasks).toBe(1)
    expect(backupData.metadata.tableCounts.notes).toBe(1)
    expect(backupData.habits).toHaveLength(1)
    expect(backupData.tasks).toHaveLength(1)
    expect(backupData.notes).toHaveLength(1)

    // 3. Test validation of exported JSON string
    const jsonString = JSON.stringify(backupData, null, 2)
    const validationResult = validateBackupJson(jsonString)
    expect(validationResult.success).toBe(true)

    if (!validationResult.success) {
      throw new Error(validationResult.error)
    }

    expect(validationResult.data.metadata.formatVersion).toBe(1)

    // 4. Clear the database
    await db.habits.clear()
    await db.habitLogs.clear()
    await db.projects.clear()
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.notes.clear()
    await db.tags.clear()

    expect(await db.habits.count()).toBe(0)
    expect(await db.tasks.count()).toBe(0)

    // 5. Restore in Replace mode
    await restoreBackup(validationResult.data, 'replace')

    // 6. Verify restored database records
    const restoredHabits = await db.habits.toArray()
    expect(restoredHabits).toHaveLength(1)
    expect(restoredHabits[0].title).toBe('Daily Reading')

    const restoredTasks = await db.tasks.toArray()
    expect(restoredTasks).toHaveLength(1)
    expect(restoredTasks[0].title).toBe('Deliver Suite')

    const restoredNotes = await db.notes.toArray()
    expect(restoredNotes).toHaveLength(1)
    expect(restoredNotes[0].title).toBe('Release Notes')
  })

  it('performs non-destructive Merge mode restore without dropping existing items', async () => {
    // 1. Existing local state
    const existingHabit = await habitRepository.createHabit({
      title: 'Existing Habit',
      color: '#10B981',
      frequencyType: 'daily',
      targetType: 'boolean'
    })

    // 2. Incoming backup with a different habit
    const incomingData: BackupArchiveData = {
      metadata: {
        formatVersion: 1,
        exportTimestamp: new Date().toISOString(),
        appVersion: '1.0.0',
        tableCounts: {
          habits: 1,
          habitLogs: 0,
          projects: 0,
          tasks: 0,
          subtasks: 0,
          notes: 0,
          tags: 0
        }
      },
      habits: [
        {
          id: 'incoming-h1',
          title: 'Imported Habit',
          color: '#3B82F6',
          frequencyType: 'daily',
          targetType: 'boolean',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          archived: false
        }
      ],
      habitLogs: [],
      projects: [],
      tasks: [],
      subtasks: [],
      notes: [],
      tags: []
    }

    // 3. Restore in Merge mode
    await restoreBackup(incomingData, 'merge')

    // 4. Verify both habits exist in DB
    const allHabits = await db.habits.toArray()
    expect(allHabits).toHaveLength(2)
    expect(allHabits.some((h) => h.id === existingHabit.id)).toBe(true)
    expect(allHabits.some((h) => h.id === 'incoming-h1')).toBe(true)
  })

  it('strictly rejects corrupted or invalid backup files without altering database', async () => {
    const originalHabit = await habitRepository.createHabit({
      title: 'Protected Habit',
      color: '#10B981',
      frequencyType: 'daily',
      targetType: 'boolean'
    })

    // Corrupted JSON syntax
    const malformedResult = validateBackupJson('{ invalid json format')
    expect(malformedResult.success).toBe(false)
    if (!malformedResult.success) {
      expect(malformedResult.error).toContain('Invalid JSON')
    }

    // Unsupported future version
    const futureVersionJson = JSON.stringify({
      metadata: {
        formatVersion: 999,
        exportTimestamp: new Date().toISOString(),
        appVersion: '99.0.0',
        tableCounts: {}
      },
      habits: [],
      habitLogs: [],
      projects: [],
      tasks: [],
      subtasks: [],
      notes: [],
      tags: []
    })
    const futureResult = validateBackupJson(futureVersionJson)
    expect(futureResult.success).toBe(false)
    if (!futureResult.success) {
      expect(futureResult.error).toContain('Unsupported backup format version')
    }

    // Verify DB was untouched
    const habitsCount = await db.habits.count()
    expect(habitsCount).toBe(1)
    const habit = await db.habits.get(originalHabit.id)
    expect(habit?.title).toBe('Protected Habit')
  })
})
