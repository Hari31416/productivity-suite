import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { AppDatabase } from './index'
import type { Habit, HabitLog } from '@/modules/habits/types'
import type { Project, Task, Subtask } from '@/modules/tasks/types'
import type { Note, Tag } from '@/modules/notes/types'

describe('AppDatabase Dexie Stores', () => {
  let testDb: AppDatabase

  beforeEach(() => {
    testDb = new AppDatabase()
  })

  afterEach(async () => {
    await testDb.delete()
  })

  it('initializes all 7 tables with defined stores', () => {
    expect(testDb.habits).toBeDefined()
    expect(testDb.habitLogs).toBeDefined()
    expect(testDb.projects).toBeDefined()
    expect(testDb.tasks).toBeDefined()
    expect(testDb.subtasks).toBeDefined()
    expect(testDb.notes).toBeDefined()
    expect(testDb.tags).toBeDefined()
  })

  it('can perform CRUD operations on habits and habitLogs', async () => {
    const habit: Habit = {
      id: 'habit-1',
      title: 'Morning Workout',
      color: '#3b82f6',
      frequencyType: 'daily',
      targetType: 'boolean',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    }

    await testDb.habits.add(habit)
    const retrievedHabit = await testDb.habits.get('habit-1')
    expect(retrievedHabit?.title).toBe('Morning Workout')

    const log: HabitLog = {
      id: 'log-1',
      habitId: 'habit-1',
      date: '2026-08-15',
      timestamp: new Date().toISOString(),
      completed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await testDb.habitLogs.add(log)
    const logs = await testDb.habitLogs.where('habitId').equals('habit-1').toArray()
    expect(logs).toHaveLength(1)
    expect(logs[0].completed).toBe(true)
  })

  it('can perform CRUD operations on projects, tasks, and subtasks', async () => {
    const project: Project = {
      id: 'proj-1',
      name: 'Q3 Launch',
      color: '#10b981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    }
    await testDb.projects.add(project)

    const task: Task = {
      id: 'task-1',
      projectId: 'proj-1',
      title: 'Setup Database',
      status: 'todo',
      priority: 'high',
      tags: ['core', 'infra'],
      subtaskIds: ['sub-1'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    }
    await testDb.tasks.add(task)

    const subtask: Subtask = {
      id: 'sub-1',
      taskId: 'task-1',
      title: 'Write schemas',
      completed: false,
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    await testDb.subtasks.add(subtask)

    const retrievedTask = await testDb.tasks.get('task-1')
    expect(retrievedTask?.priority).toBe('high')

    const subtasks = await testDb.subtasks.where('taskId').equals('task-1').toArray()
    expect(subtasks).toHaveLength(1)
    expect(subtasks[0].title).toBe('Write schemas')
  })

  it('can perform CRUD operations on notes and tags', async () => {
    const tag: Tag = {
      id: 'tag-1',
      name: 'architecture',
      color: '#8b5cf6'
    }
    await testDb.tags.add(tag)

    const note: Note = {
      id: 'note-1',
      title: 'Architecture Overview',
      content: 'Offline first local storage design',
      tags: ['architecture'],
      pinned: true,
      wordCount: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archived: false
    }
    await testDb.notes.add(note)

    const notesWithTag = await testDb.notes.where('tags').equals('architecture').toArray()
    expect(notesWithTag).toHaveLength(1)
    expect(notesWithTag[0].pinned).toBe(true)
  })

  it('populates initial seed data on fresh database creation without duplicating on reopen', async () => {
    const seedDbName = 'SeedTestDB_' + Date.now()
    const freshDb = new AppDatabase(seedDbName)

    // First open triggers populate
    const initialProjects = await freshDb.projects.toArray()
    const initialHabits = await freshDb.habits.toArray()
    const initialTasks = await freshDb.tasks.toArray()
    const initialNotes = await freshDb.notes.toArray()

    expect(initialProjects.length).toBeGreaterThan(0)
    expect(initialHabits.length).toBeGreaterThan(0)
    expect(initialTasks.length).toBeGreaterThan(0)
    expect(initialNotes.length).toBeGreaterThan(0)

    const initialHabitsCount = initialHabits.length
    const initialTasksCount = initialTasks.length

    // Close and reopen the same database
    freshDb.close()
    const reopenedDb = new AppDatabase(seedDbName)

    const reopenedHabitsCount = await reopenedDb.habits.count()
    const reopenedTasksCount = await reopenedDb.tasks.count()

    expect(reopenedHabitsCount).toBe(initialHabitsCount)
    expect(reopenedTasksCount).toBe(initialTasksCount)

    await reopenedDb.delete()
  })
})

