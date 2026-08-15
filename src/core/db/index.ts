import Dexie, { type Table } from 'dexie'
import type { Habit, HabitLog } from '@/modules/habits/types'
import type { Project, Task, Subtask } from '@/modules/tasks/types'
import type { Note, Tag } from '@/modules/notes/types'

export class AppDatabase extends Dexie {
  habits!: Table<Habit, string>
  habitLogs!: Table<HabitLog, string>
  projects!: Table<Project, string>
  tasks!: Table<Task, string>
  subtasks!: Table<Subtask, string>
  notes!: Table<Note, string>
  tags!: Table<Tag, string>

  constructor() {
    super('LocalProductivitySuiteDB')
    this.version(1).stores({
      habits: 'id, categoryId, frequencyType, archived, createdAt',
      habitLogs: 'id, habitId, date, timestamp, [habitId+date], completed',
      projects: 'id, name, archived, createdAt',
      tasks: 'id, projectId, status, priority, dueDate, archived, createdAt',
      subtasks: 'id, taskId, completed, order',
      notes: 'id, projectId, pinned, archived, updatedAt, *tags',
      tags: 'id, name'
    })
  }
}

export const db = new AppDatabase()
