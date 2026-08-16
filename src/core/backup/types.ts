import type { Habit, HabitLog } from '@/modules/habits/types'
import type { Project, Task, Subtask } from '@/modules/tasks/types'
import type { Note, Tag } from '@/modules/notes/types'

export interface BackupMetadata {
  formatVersion: number
  exportTimestamp: string
  appVersion: string
  tableCounts: Record<string, number>
}

export interface BackupArchiveData {
  metadata: BackupMetadata
  habits: Habit[]
  habitLogs: HabitLog[]
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  notes: Note[]
  tags: Tag[]
}

export type RestoreMode = 'replace' | 'merge'

export type ValidationResult =
  { success: true; data: BackupArchiveData } | { success: false; error: string }
