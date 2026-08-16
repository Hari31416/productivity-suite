import { z } from 'zod'
import { db } from '@/core/db'
import { saveAndExportTextFile } from '@/core/utils/fileExporter'
import type { BackupArchiveData, BackupMetadata, RestoreMode, ValidationResult } from './types'

export const CURRENT_BACKUP_FORMAT_VERSION = 1
export const APP_VERSION = '1.0.0'

export const backupMetadataSchema = z.object({
  formatVersion: z.number().int().positive(),
  exportTimestamp: z.string(),
  appVersion: z.string(),
  tableCounts: z.record(z.string(), z.number())
})

export const habitTimeWindowSchema = z.object({
  startTime: z.string(),
  endTime: z.string()
})

export const habitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string().optional(),
  categoryId: z.string().optional(),
  frequencyType: z.enum(['daily', 'weekly', 'custom_days', 'subday_interval', 'times_per_day']),
  targetDaysOfWeek: z.array(z.number()).optional(),
  targetCountPerWeek: z.number().optional(),
  intervalHours: z.number().optional(),
  timesPerDay: z.number().optional(),
  timeWindow: habitTimeWindowSchema.optional(),
  targetType: z.enum(['boolean', 'numeric', 'timer']),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean()
})

export const habitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  timestamp: z.string(),
  intervalIndex: z.number().optional(),
  completed: z.boolean(),
  value: z.number().optional(),
  durationSeconds: z.number().optional(),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const projectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean()
})

export const subtaskSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  title: z.string(),
  completed: z.boolean(),
  order: z.number(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const taskSchema = z.object({
  id: z.string(),
  projectId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  dueDate: z.string().optional(),
  dueTime: z.string().optional(),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string()),
  subtaskIds: z.array(z.string()),
  completedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean()
})

export const noteSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  projectId: z.string().optional(),
  pinned: z.boolean(),
  color: z.string().optional(),
  wordCount: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archived: z.boolean()
})

export const tagSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string()
})

export const backupArchiveDataSchema = z.object({
  metadata: backupMetadataSchema,
  habits: z.array(habitSchema),
  habitLogs: z.array(habitLogSchema),
  projects: z.array(projectSchema),
  tasks: z.array(taskSchema),
  subtasks: z.array(subtaskSchema),
  notes: z.array(noteSchema),
  tags: z.array(tagSchema)
})

export async function generateBackupData(): Promise<BackupArchiveData> {
  const [habits, habitLogs, projects, tasks, subtasks, notes, tags] = await Promise.all([
    db.habits.toArray(),
    db.habitLogs.toArray(),
    db.projects.toArray(),
    db.tasks.toArray(),
    db.subtasks.toArray(),
    db.notes.toArray(),
    db.tags.toArray()
  ])

  const metadata: BackupMetadata = {
    formatVersion: CURRENT_BACKUP_FORMAT_VERSION,
    exportTimestamp: new Date().toISOString(),
    appVersion: APP_VERSION,
    tableCounts: {
      habits: habits.length,
      habitLogs: habitLogs.length,
      projects: projects.length,
      tasks: tasks.length,
      subtasks: subtasks.length,
      notes: notes.length,
      tags: tags.length
    }
  }

  return {
    metadata,
    habits,
    habitLogs,
    projects,
    tasks,
    subtasks,
    notes,
    tags
  }
}

export async function triggerDownload(content: string, filename: string): Promise<void> {
  await saveAndExportTextFile(content, filename, 'application/json')
}

export async function exportBackup(): Promise<BackupArchiveData> {
  const backupData = await generateBackupData()
  const jsonContent = JSON.stringify(backupData, null, 2)
  const dateStr = new Date().toISOString().split('T')[0]
  const filename = `productivity-backup-${dateStr}.json`
  await triggerDownload(jsonContent, filename)
  return backupData
}

export function validateBackupJson(jsonString: string): ValidationResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonString)
  } catch (error) {
    return {
      success: false,
      error: `Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown parsing error'}`
    }
  }

  const result = backupArchiveDataSchema.safeParse(parsed)
  if (!result.success) {
    const errorMessages = result.error.errors
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .slice(0, 5)
      .join('; ')
    return {
      success: false,
      error: `Backup validation failed: ${errorMessages}`
    }
  }

  if (result.data.metadata.formatVersion > CURRENT_BACKUP_FORMAT_VERSION) {
    return {
      success: false,
      error: `Unsupported backup format version: ${result.data.metadata.formatVersion}. Current supported version is ${CURRENT_BACKUP_FORMAT_VERSION}.`
    }
  }

  return {
    success: true,
    data: result.data
  }
}

export async function restoreBackup(data: BackupArchiveData, mode: RestoreMode): Promise<void> {
  await db.transaction(
    'rw',
    [db.habits, db.habitLogs, db.projects, db.tasks, db.subtasks, db.notes, db.tags],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.habits.clear(),
          db.habitLogs.clear(),
          db.projects.clear(),
          db.tasks.clear(),
          db.subtasks.clear(),
          db.notes.clear(),
          db.tags.clear()
        ])

        if (data.habits.length > 0) await db.habits.bulkAdd(data.habits)
        if (data.habitLogs.length > 0) await db.habitLogs.bulkAdd(data.habitLogs)
        if (data.projects.length > 0) await db.projects.bulkAdd(data.projects)
        if (data.tasks.length > 0) await db.tasks.bulkAdd(data.tasks)
        if (data.subtasks.length > 0) await db.subtasks.bulkAdd(data.subtasks)
        if (data.notes.length > 0) await db.notes.bulkAdd(data.notes)
        if (data.tags.length > 0) await db.tags.bulkAdd(data.tags)
      } else if (mode === 'merge') {
        if (data.habits.length > 0) await db.habits.bulkPut(data.habits)
        if (data.habitLogs.length > 0) await db.habitLogs.bulkPut(data.habitLogs)
        if (data.projects.length > 0) await db.projects.bulkPut(data.projects)
        if (data.tasks.length > 0) await db.tasks.bulkPut(data.tasks)
        if (data.subtasks.length > 0) await db.subtasks.bulkPut(data.subtasks)
        if (data.notes.length > 0) await db.notes.bulkPut(data.notes)
        if (data.tags.length > 0) await db.tags.bulkPut(data.tags)
      }
    }
  )
}
