import type { Transaction } from 'dexie'
import type { Habit } from '@/modules/habits/types'
import type { Project, Task, Subtask } from '@/modules/tasks/types'
import type { Note, Tag } from '@/modules/notes/types'
import type { AppDatabase } from './index'

export const SEED_STORAGE_KEY = 'productivity_suite_seeded_v1'

export async function seedInitialData(target: AppDatabase | Transaction): Promise<void> {
  const now = new Date().toISOString()
  const today = now.slice(0, 10)

  const defaultProjects: Project[] = [
    {
      id: 'proj_getting_started',
      name: 'Personal Growth',
      description: 'Introductory project and goals',
      color: '#3B82F6',
      createdAt: now,
      updatedAt: now,
      archived: false
    }
  ]

  const defaultHabits: Habit[] = [
    {
      id: 'habit_drink_water',
      title: 'Hydration',
      description: 'Track daily water intake',
      color: '#06B6D4',
      categoryId: 'health',
      frequencyType: 'daily',
      targetType: 'numeric',
      targetValue: 2000,
      unit: 'ml',
      reminderTimes: ['09:00', '14:00', '18:00'],
      createdAt: now,
      updatedAt: now,
      archived: false
    },
    {
      id: 'habit_daily_reading',
      title: 'Mindful Reading',
      description: 'Read a book or article for 15 minutes',
      color: '#8B5CF6',
      categoryId: 'learning',
      frequencyType: 'daily',
      targetType: 'boolean',
      reminderTimes: ['21:00'],
      createdAt: now,
      updatedAt: now,
      archived: false
    }
  ]

  const defaultTasks: Task[] = [
    {
      id: 'task_explore_app',
      projectId: 'proj_getting_started',
      title: 'Explore Productivity Suite',
      description: 'Try checking off habits, managing tasks, and creating markdown notes.',
      status: 'todo',
      priority: 'high',
      dueDate: today,
      tags: ['guide', 'getting-started'],
      subtaskIds: ['subtask_explore_habits', 'subtask_explore_notes'],
      createdAt: now,
      updatedAt: now,
      archived: false
    }
  ]

  const defaultSubtasks: Subtask[] = [
    {
      id: 'subtask_explore_habits',
      taskId: 'task_explore_app',
      title: 'Complete a habit check-in',
      completed: false,
      order: 1,
      createdAt: now,
      updatedAt: now
    },
    {
      id: 'subtask_explore_notes',
      taskId: 'task_explore_app',
      title: 'Create or edit a note',
      completed: false,
      order: 2,
      createdAt: now,
      updatedAt: now
    }
  ]

  const defaultTags: Tag[] = [
    {
      id: 'tag_getting_started',
      name: 'getting-started',
      color: '#3B82F6'
    },
    {
      id: 'tag_guide',
      name: 'guide',
      color: '#10B981'
    }
  ]

  const welcomeNoteContent = `# Welcome to Local Productivity Suite

This is an offline-first workspace designed to keep your habits, tasks, and notes organized.

## Features Overview
- **Habits**: Track daily streaks and quantitative goals (like hydration or reading).
- **Tasks & Projects**: Break down complex work with priority flags, subtasks, and due dates.
- **Notes**: Capture thoughts with markdown support, tags, and project associations.
- **Offline & Private**: All data is stored locally in your browser database with full export/import capabilities.

Feel free to edit or delete this note at any time.`

  const defaultNotes: Note[] = [
    {
      id: 'note_welcome',
      projectId: 'proj_getting_started',
      title: 'Welcome & Quick Start',
      content: welcomeNoteContent,
      tags: ['guide', 'getting-started'],
      pinned: true,
      wordCount: welcomeNoteContent.split(/\s+/).filter(Boolean).length,
      createdAt: now,
      updatedAt: now,
      archived: false
    }
  ]

  if ('habits' in target && 'tasks' in target) {
    const appDb = target as AppDatabase
    await Promise.all([
      appDb.projects.bulkPut(defaultProjects),
      appDb.habits.bulkPut(defaultHabits),
      appDb.tasks.bulkPut(defaultTasks),
      appDb.subtasks.bulkPut(defaultSubtasks),
      appDb.tags.bulkPut(defaultTags),
      appDb.notes.bulkPut(defaultNotes)
    ])
  } else {
    const tx = target as Transaction
    await Promise.all([
      tx.table('projects').bulkPut(defaultProjects),
      tx.table('habits').bulkPut(defaultHabits),
      tx.table('tasks').bulkPut(defaultTasks),
      tx.table('subtasks').bulkPut(defaultSubtasks),
      tx.table('tags').bulkPut(defaultTags),
      tx.table('notes').bulkPut(defaultNotes)
    ])
  }
}

export async function ensureDatabaseSeeded(database: AppDatabase): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const [habitCount, taskCount] = await Promise.all([
      database.habits.count(),
      database.tasks.count()
    ])

    let didSeed = false
    if (habitCount === 0 && taskCount === 0) {
      await seedInitialData(database)
      didSeed = true
    } else {
      // Backfill categoryId on existing seed habits if missing
      const hydration = await database.habits.get('habit_drink_water')
      if (hydration && !hydration.categoryId) {
        await database.habits.update('habit_drink_water', { categoryId: 'health' })
        didSeed = true
      }
      const reading = await database.habits.get('habit_daily_reading')
      if (reading && !reading.categoryId) {
        await database.habits.update('habit_daily_reading', { categoryId: 'learning' })
        didSeed = true
      }
    }
    localStorage.setItem(SEED_STORAGE_KEY, 'true')
    return didSeed
  } catch {
    return false
  }
}
