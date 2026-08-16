import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { db } from '@/core/db'
import { taskRepository } from '../taskRepository'
import { projectRepository } from '../projectRepository'
import type { Task } from '../../types'
import { format, addDays } from 'date-fns'

describe('taskRepository', () => {
  beforeEach(async () => {
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.projects.clear()
  })

  afterEach(async () => {
    await db.tasks.clear()
    await db.subtasks.clear()
    await db.projects.clear()
  })

  it('creates and retrieves tasks', async () => {
    const taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtaskIds'> = {
      title: 'Implement database schema',
      description: 'Define tables and indexes in Dexie',
      priority: 'high',
      status: 'todo',
      dueDate: '2026-08-20',
      dueTime: '14:00',
      estimatedMinutes: 60,
      tags: ['backend', 'database'],
      archived: false
    }

    const created = await taskRepository.createTask(taskData)
    expect(created.id).toBeDefined()
    expect(created.title).toBe('Implement database schema')
    expect(created.status).toBe('todo')
    expect(created.priority).toBe('high')
    expect(created.tags).toEqual(['backend', 'database'])
    expect(created.createdAt).toBeDefined()

    const retrieved = await taskRepository.getTaskById(created.id)
    expect(retrieved).toBeDefined()
    expect(retrieved?.id).toBe(created.id)
    expect(retrieved?.title).toBe(created.title)

    const all = await taskRepository.getAllTasks()
    expect(all).toHaveLength(1)
  })

  it('creates task with initial subtasks', async () => {
    const created = await taskRepository.createTask(
      {
        title: 'Launch feature',
        priority: 'urgent',
        status: 'todo',
        tags: ['release'],
        archived: false
      },
      [
        { title: 'Write tests', completed: true },
        { title: 'Update documentation', completed: false }
      ]
    )

    expect(created.subtaskIds).toHaveLength(2)

    const subtasks = await taskRepository.getSubtasksForTask(created.id)
    expect(subtasks).toHaveLength(2)
    expect(subtasks[0].title).toBe('Write tests')
    expect(subtasks[0].completed).toBe(true)
    expect(subtasks[1].title).toBe('Update documentation')
    expect(subtasks[1].completed).toBe(false)
  })

  it('updates task status and sets completedAt', async () => {
    const created = await taskRepository.createTask({
      title: 'Refactor UI styles',
      priority: 'medium',
      status: 'todo',
      tags: [],
      archived: false
    })

    expect(created.completedAt).toBeUndefined()

    const updated = await taskRepository.updateTaskStatus(created.id, 'done')
    expect(updated.status).toBe('done')
    expect(updated.completedAt).toBeDefined()

    const reverted = await taskRepository.updateTaskStatus(created.id, 'in_progress')
    expect(reverted.status).toBe('in_progress')
    expect(reverted.completedAt).toBeUndefined()
  })

  it('archives and unarchives tasks', async () => {
    const created = await taskRepository.createTask({
      title: 'Old meeting notes review',
      priority: 'low',
      status: 'done',
      tags: [],
      archived: false
    })

    await taskRepository.archiveTask(created.id, true)

    const activeTasks = await taskRepository.getAllTasks({ includeArchived: false })
    expect(activeTasks).toHaveLength(0)

    const allTasks = await taskRepository.getAllTasks({ includeArchived: true })
    expect(allTasks).toHaveLength(1)
    expect(allTasks[0].archived).toBe(true)

    await taskRepository.archiveTask(created.id, false)
    const activeAgain = await taskRepository.getAllTasks({ includeArchived: false })
    expect(activeAgain).toHaveLength(1)
    expect(activeAgain[0].archived).toBe(false)
  })

  it('deletes task and cascades deletion to subtasks', async () => {
    const task = await taskRepository.createTask(
      {
        title: 'Project architecture',
        priority: 'high',
        status: 'todo',
        tags: [],
        archived: false
      },
      [
        { title: 'Subtask 1' },
        { title: 'Subtask 2' }
      ]
    )

    const subtasksBefore = await taskRepository.getSubtasksForTask(task.id)
    expect(subtasksBefore).toHaveLength(2)

    await taskRepository.deleteTask(task.id)

    const taskAfter = await taskRepository.getTaskById(task.id)
    expect(taskAfter).toBeUndefined()

    const subtasksAfter = await taskRepository.getSubtasksForTask(task.id)
    expect(subtasksAfter).toHaveLength(0)
  })

  it('filters tasks by project, priority, status, and search query', async () => {
    const projectA = await projectRepository.createProject({
      name: 'Project Alpha',
      color: '#3b82f6',
      archived: false
    })
    const projectB = await projectRepository.createProject({
      name: 'Project Beta',
      color: '#10b981',
      archived: false
    })

    await taskRepository.createTask({
      title: 'Alpha urgent task',
      description: 'Critical bug fix',
      projectId: projectA.id,
      priority: 'urgent',
      status: 'in_progress',
      tags: ['bug', 'frontend'],
      archived: false
    })

    await taskRepository.createTask({
      title: 'Alpha low task',
      projectId: projectA.id,
      priority: 'low',
      status: 'todo',
      tags: ['feature'],
      archived: false
    })

    await taskRepository.createTask({
      title: 'Beta medium task',
      projectId: projectB.id,
      priority: 'medium',
      status: 'blocked',
      tags: ['backend'],
      archived: false
    })

    const alphaTasks = await taskRepository.getAllTasks({ projectId: projectA.id })
    expect(alphaTasks).toHaveLength(2)

    const urgentTasks = await taskRepository.getAllTasks({ priority: 'urgent' })
    expect(urgentTasks).toHaveLength(1)
    expect(urgentTasks[0].title).toBe('Alpha urgent task')

    const blockedTasks = await taskRepository.getAllTasks({ status: 'blocked' })
    expect(blockedTasks).toHaveLength(1)
    expect(blockedTasks[0].title).toBe('Beta medium task')

    const searchResult = await taskRepository.getAllTasks({ searchQuery: 'Critical' })
    expect(searchResult).toHaveLength(1)
    expect(searchResult[0].title).toBe('Alpha urgent task')

    const tagResult = await taskRepository.getAllTasks({ tag: 'frontend' })
    expect(tagResult).toHaveLength(1)
  })

  it('manages subtasks: add, toggle, delete, batch update', async () => {
    const task = await taskRepository.createTask({
      title: 'Parent Task',
      priority: 'medium',
      status: 'todo',
      tags: [],
      archived: false
    })

    const sub1 = await taskRepository.createSubtask(task.id, 'First step')
    expect(sub1.title).toBe('First step')
    expect(sub1.completed).toBe(false)
    expect(sub1.order).toBe(0)

    const updatedTask = await taskRepository.getTaskById(task.id)
    expect(updatedTask?.subtaskIds).toContain(sub1.id)

    const toggled = await taskRepository.toggleSubtask(sub1.id)
    expect(toggled.completed).toBe(true)

    const batchResult = await taskRepository.batchUpdateSubtasks(task.id, [
      { id: sub1.id, title: 'First step updated', completed: true, order: 0 },
      { title: 'Second step', completed: false, order: 1 }
    ])
    expect(batchResult).toHaveLength(2)
    expect(batchResult[0].title).toBe('First step updated')
    expect(batchResult[1].title).toBe('Second step')

    await taskRepository.deleteSubtask(batchResult[1].id)
    const remainingSubtasks = await taskRepository.getSubtasksForTask(task.id)
    expect(remainingSubtasks).toHaveLength(1)
    expect(remainingSubtasks[0].id).toBe(sub1.id)
  })

  it('extracts all unique tags across tasks', async () => {
    await taskRepository.createTask({
      title: 'Task 1',
      priority: 'low',
      status: 'todo',
      tags: ['react', 'vite'],
      archived: false
    })
    await taskRepository.createTask({
      title: 'Task 2',
      priority: 'medium',
      status: 'todo',
      tags: ['vite', 'typescript'],
      archived: false
    })

    const tags = await taskRepository.getAllTags()
    expect(tags).toEqual(['react', 'typescript', 'vite'])
  })

  it('materializes recurring task instances ahead of time for rolling window', async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const createdParent = await taskRepository.createTask({
      title: 'Daily Standup',
      priority: 'medium',
      status: 'todo',
      dueDate: todayStr,
      dueTime: '09:30',
      isRecurring: true,
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endCondition: { type: 'after_count', count: 5 }
      },
      tags: ['scrum'],
      archived: false
    })

    expect(createdParent.isRecurring).toBe(true)

    // Check all tasks including generated instances
    const allTasks = await taskRepository.getAllTasks()
    // 1 parent + 4 future instances = 5 occurrences total
    expect(allTasks).toHaveLength(5)

    const futureInstances = allTasks.filter((t) => t.recurringParentId === createdParent.id)
    expect(futureInstances).toHaveLength(4)
    expect(futureInstances[0].title).toBe('Daily Standup')
    expect(futureInstances[0].dueDate).toBe(format(addDays(new Date(), 1), 'yyyy-MM-dd'))
  })

  it('allows completing one recurring occurrence without affecting other instances', async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const parent = await taskRepository.createTask({
      title: 'Workout',
      priority: 'high',
      status: 'todo',
      dueDate: todayStr,
      isRecurring: true,
      recurrence: {
        frequency: 'daily',
        interval: 1,
        endCondition: { type: 'after_count', count: 3 }
      },
      tags: ['health'],
      archived: false
    })

    // Complete today's task
    await taskRepository.updateTaskStatus(parent.id, 'done')

    const parentAfter = await taskRepository.getTaskById(parent.id)
    expect(parentAfter?.status).toBe('done')

    // Future instances remain 'todo'
    const futureInstances = await db.tasks.where('recurringParentId').equals(parent.id).toArray()
    expect(futureInstances).toHaveLength(2)
    expect(futureInstances[0].status).toBe('todo')
    expect(futureInstances[1].status).toBe('todo')
  })

  it('deletes entire recurring series when deleteAllOccurrences is selected', async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const parent = await taskRepository.createTask({
      title: 'Weekly Review',
      priority: 'medium',
      status: 'todo',
      dueDate: todayStr,
      isRecurring: true,
      recurrence: {
        frequency: 'weekly',
        interval: 1
      },
      tags: [],
      archived: false
    })

    const allBefore = await taskRepository.getAllTasks()
    expect(allBefore.length).toBeGreaterThan(1)

    // Delete all occurrences
    await taskRepository.deleteTask(parent.id, { deleteAllOccurrences: true })

    const allAfter = await taskRepository.getAllTasks()
    expect(allAfter).toHaveLength(0)
  })

  it('creates and manages tasks with reminders', async () => {
    const task = await taskRepository.createTask({
      title: 'Dentist Appointment',
      priority: 'urgent',
      status: 'todo',
      dueDate: '2026-08-25',
      dueTime: '15:00',
      reminders: [
        { id: 'rem-1', type: 'offset', offsetMinutes: 30 },
        { id: 'rem-2', type: 'exact', exactDateTime: '2026-08-25T14:00:00' }
      ],
      tags: ['health'],
      archived: false
    })

    expect(task.reminders).toHaveLength(2)
    expect(task.reminders?.[0].offsetMinutes).toBe(30)

    // Update reminders
    const updated = await taskRepository.updateTask(task.id, {
      reminders: [{ id: 'rem-1', type: 'offset', offsetMinutes: 60 }]
    })
    expect(updated.reminders).toHaveLength(1)
    expect(updated.reminders?.[0].offsetMinutes).toBe(60)
  })

  it('materializes sub-day recurring tasks with hourly windows and specific times', async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const parent = await taskRepository.createTask({
      title: 'Hydration Check',
      priority: 'low',
      status: 'todo',
      dueDate: todayStr,
      dueTime: '09:00',
      isRecurring: true,
      recurrence: {
        frequency: 'hourly',
        interval: 3,
        startTime: '09:00',
        endTime: '15:00',
        endCondition: { type: 'after_count', count: 3 }
      },
      tags: ['health'],
      archived: false
    })

    expect(parent.id).toBeDefined()

    const allTasks = await taskRepository.getAllTasks()
    // 1 parent + 2 children = 3 total occurrences
    expect(allTasks).toHaveLength(3)
    expect(allTasks.map((t) => t.dueTime)).toEqual(['09:00', '12:00', '15:00'])
  })
})

