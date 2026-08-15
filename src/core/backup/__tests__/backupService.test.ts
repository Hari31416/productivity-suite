import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/core/db'
import {
  exportBackup,
  generateBackupData,
  validateBackupJson,
  restoreBackup,
  CURRENT_BACKUP_FORMAT_VERSION
} from '../backupService'
import type { BackupArchiveData } from '../types'

describe('backupService', () => {
  beforeEach(async () => {
    await db.habits.clear()
    await db.habitLogs.clear()
    await db.projects.clear()
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.notes.clear()
    await db.tags.clear()
  })

  it('generates valid backup archive data with correct metadata and table counts', async () => {
    await db.habits.add({
      id: 'h1',
      title: 'Drink water',
      color: '#3b82f6',
      frequencyType: 'daily',
      targetType: 'boolean',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    })

    await db.tasks.add({
      id: 't1',
      title: 'Finish report',
      status: 'todo',
      priority: 'high',
      tags: [],
      subtaskIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    })

    const backup = await generateBackupData()

    expect(backup.metadata.formatVersion).toBe(CURRENT_BACKUP_FORMAT_VERSION)
    expect(backup.metadata.tableCounts.habits).toBe(1)
    expect(backup.metadata.tableCounts.tasks).toBe(1)
    expect(backup.metadata.tableCounts.notes).toBe(0)
    expect(backup.habits).toHaveLength(1)
    expect(backup.tasks).toHaveLength(1)
    expect(backup.notes).toHaveLength(0)
  })

  it('exports backup data successfully', async () => {
    const exported = await exportBackup()
    expect(exported.metadata.formatVersion).toBe(CURRENT_BACKUP_FORMAT_VERSION)
    expect(exported.habits).toBeDefined()
  })

  it('validates a valid backup JSON string successfully', async () => {
    const validData: BackupArchiveData = {
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
          id: 'h1',
          title: 'Morning Yoga',
          color: '#10b981',
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

    const json = JSON.stringify(validData)
    const result = validateBackupJson(json)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.habits[0].title).toBe('Morning Yoga')
    }
  })

  it('rejects invalid JSON syntax', () => {
    const result = validateBackupJson('{ not valid json')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Invalid JSON format')
    }
  })

  it('rejects schema missing required fields', () => {
    const invalidData = {
      metadata: {
        formatVersion: 1,
        appVersion: '1.0.0'
      },
      habits: []
    }

    const result = validateBackupJson(JSON.stringify(invalidData))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Backup validation failed')
    }
  })

  it('rejects unsupported future backup format versions', () => {
    const futureData = {
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
    }

    const result = validateBackupJson(JSON.stringify(futureData))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('Unsupported backup format version')
    }
  })

  it('restores backup with replace mode', async () => {
    await db.habits.add({
      id: 'old-habit',
      title: 'Old Habit',
      color: '#000000',
      frequencyType: 'daily',
      targetType: 'boolean',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    })

    const importData: BackupArchiveData = {
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
          id: 'imported-habit',
          title: 'Imported Habit',
          color: '#3b82f6',
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

    await restoreBackup(importData, 'replace')

    const allHabits = await db.habits.toArray()
    expect(allHabits).toHaveLength(1)
    expect(allHabits[0].id).toBe('imported-habit')
  })

  it('restores backup with merge mode', async () => {
    await db.habits.add({
      id: 'existing-habit',
      title: 'Existing Habit',
      color: '#000000',
      frequencyType: 'daily',
      targetType: 'boolean',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    })

    const importData: BackupArchiveData = {
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
          id: 'new-habit',
          title: 'New Habit',
          color: '#3b82f6',
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

    await restoreBackup(importData, 'merge')

    const allHabits = await db.habits.toArray()
    expect(allHabits).toHaveLength(2)
    const habitIds = allHabits.map((h) => h.id)
    expect(habitIds).toContain('existing-habit')
    expect(habitIds).toContain('new-habit')
  })
})
