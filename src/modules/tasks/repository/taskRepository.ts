import { db } from '@/core/db'
import { format, addDays } from 'date-fns'
import type {
  Task,
  Subtask,
  TaskFilter,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
  TaskReminder
} from '../types'
import { generateOccurrenceSlots } from '../utils/recurrence'
import {
  scheduleTaskReminder,
  cancelTaskReminder,
  getTaskNotificationId
} from '@/core/notifications/notificationService'

export const taskRepository = {
  async getAllTasks(filter?: TaskFilter): Promise<Task[]> {
    let collection = db.tasks.toCollection()

    if (filter?.includeArchived !== true && filter?.smartFilter !== 'archived') {
      collection = collection.filter((t) => !t.archived)
    }

    let tasks = await collection.toArray()

    if (filter) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')

      if (filter.projectId) {
        tasks = tasks.filter((t) => t.projectId === filter.projectId)
      }

      if (filter.status) {
        tasks = tasks.filter((t) => t.status === filter.status)
      }

      if (filter.priority) {
        tasks = tasks.filter((t) => t.priority === filter.priority)
      }

      if (filter.tag) {
        tasks = tasks.filter((t) => t.tags && t.tags.includes(filter.tag!))
      }

      if (filter.isRecurring !== undefined) {
        tasks = tasks.filter(
          (t) => Boolean(t.isRecurring || t.recurringParentId) === filter.isRecurring
        )
      }

      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase().trim()
        tasks = tasks.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q)))
        )
      }

      if (filter.dueDate) {
        tasks = tasks.filter((t) => t.dueDate === filter.dueDate)
      }

      if (filter.startDate && filter.endDate) {
        tasks = tasks.filter(
          (t) => t.dueDate && t.dueDate >= filter.startDate! && t.dueDate <= filter.endDate!
        )
      }

      if (filter.smartFilter) {
        switch (filter.smartFilter) {
          case 'today':
            tasks = tasks.filter((t) => t.dueDate === todayStr && !t.archived)
            break
          case 'upcoming':
            tasks = tasks.filter((t) => t.dueDate && t.dueDate > todayStr && !t.archived)
            break
          case 'overdue':
            tasks = tasks.filter(
              (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'done' && !t.archived
            )
            break
          case 'completed':
            tasks = tasks.filter((t) => t.status === 'done' && !t.archived)
            break
          case 'archived':
            tasks = tasks.filter((t) => t.archived)
            break
          case 'all':
          default:
            break
        }
      }
    }

    return tasks.sort((a, b) => {
      if (a.status === 'done' && b.status !== 'done') return 1
      if (a.status !== 'done' && b.status === 'done') return -1

      if (a.dueDate && b.dueDate) {
        if (a.dueDate !== b.dueDate) {
          return a.dueDate.localeCompare(b.dueDate)
        }
        if (a.dueTime && b.dueTime) {
          return a.dueTime.localeCompare(b.dueTime)
        }
        if (a.dueTime) return -1
        if (b.dueTime) return 1
      } else if (a.dueDate) {
        return -1
      } else if (b.dueDate) {
        return 1
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  },

  async getTaskById(id: string): Promise<Task | undefined> {
    return db.tasks.get(id)
  },

  async getTasksByProject(projectId: string, includeArchived: boolean = false): Promise<Task[]> {
    return this.getAllTasks({ projectId, includeArchived })
  },

  async getTasksByDueDate(date: string): Promise<Task[]> {
    return this.getAllTasks({ dueDate: date })
  },

  async getTasksByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    return this.getAllTasks({ startDate, endDate })
  },

  async createTask(
    taskData: CreateTaskInput,
    initialSubtasks?: Array<{ title: string; completed?: boolean }>
  ): Promise<Task> {
    const taskId = crypto.randomUUID()
    const now = new Date().toISOString()
    const subtaskIds: string[] = []

    const reminders: TaskReminder[] = (taskData.reminders || []).map((r) => ({
      ...r,
      id: r.id || crypto.randomUUID()
    }))

    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      if (initialSubtasks && initialSubtasks.length > 0) {
        for (let i = 0; i < initialSubtasks.length; i++) {
          const item = initialSubtasks[i]
          const subtaskId = crypto.randomUUID()
          const subtask: Subtask = {
            id: subtaskId,
            taskId,
            title: item.title,
            completed: Boolean(item.completed),
            order: i,
            createdAt: now,
            updatedAt: now
          }
          await db.subtasks.add(subtask)
          subtaskIds.push(subtaskId)
        }
      }

      const task: Task = {
        ...taskData,
        id: taskId,
        status: taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        archived: taskData.archived ?? false,
        tags: taskData.tags || [],
        subtaskIds,
        reminders,
        completedAt: taskData.status === 'done' ? now : undefined,
        createdAt: now,
        updatedAt: now
      }

      await db.tasks.add(task)
    })

    const created = await db.tasks.get(taskId)
    if (!created) {
      throw new Error('Failed to create task')
    }

    if (
      created.reminders &&
      created.reminders.length > 0 &&
      created.status !== 'done' &&
      !created.archived
    ) {
      await this.scheduleRemindersForTask(created)
    }

    if (created.isRecurring && created.recurrence && !created.recurringParentId) {
      const isSubday =
        created.recurrence.frequency === 'hourly' ||
        (created.recurrence.timesOfDay && created.recurrence.timesOfDay.length > 0)
      const forwardDays = isSubday ? 7 : 30
      await this.materializeRecurringInstances(created, forwardDays)
    }

    return created
  },

  async updateTask(id: string, updates: UpdateTaskInput): Promise<Task> {
    const existing = await db.tasks.get(id)
    if (!existing) {
      throw new Error(`Task with ID ${id} not found`)
    }

    const now = new Date().toISOString()
    let completedAt = existing.completedAt

    if (updates.status) {
      if (updates.status === 'done' && existing.status !== 'done') {
        completedAt = now
      } else if (updates.status !== 'done') {
        completedAt = undefined
      }
    }

    let reminders = updates.reminders !== undefined ? updates.reminders : existing.reminders
    if (reminders) {
      reminders = reminders.map((r) => ({
        ...r,
        id: r.id || crypto.randomUUID()
      }))
    }

    const updated: Task = {
      ...existing,
      ...updates,
      reminders,
      completedAt,
      updatedAt: now
    }

    await db.tasks.put(updated)

    if (existing.reminders) {
      for (const r of existing.reminders) {
        const notifId = r.notificationId || getTaskNotificationId(existing.id, r.id)
        await cancelTaskReminder(notifId)
      }
    }

    if (
      updated.reminders &&
      updated.reminders.length > 0 &&
      updated.status !== 'done' &&
      !updated.archived
    ) {
      await this.scheduleRemindersForTask(updated)
    }

    if (
      (updates.isRecurring !== undefined ||
        updates.recurrence !== undefined ||
        updates.dueDate !== undefined) &&
      !existing.recurringParentId
    ) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const futureChildren = await db.tasks
        .where('recurringParentId')
        .equals(id)
        .filter((t) => t.status !== 'done' && (t.dueDate ? t.dueDate >= todayStr : true))
        .toArray()

      for (const child of futureChildren) {
        await this.deleteTask(child.id)
      }

      if (updated.isRecurring && updated.recurrence) {
        const isSubday =
          updated.recurrence.frequency === 'hourly' ||
          (updated.recurrence.timesOfDay && updated.recurrence.timesOfDay.length > 0)
        const forwardDays = isSubday ? 7 : 30
        await this.materializeRecurringInstances(updated, forwardDays)
      }
    }

    return updated
  },

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.updateTask(id, { status })
  },

  async archiveTask(id: string, archived: boolean = true): Promise<Task> {
    return this.updateTask(id, { archived })
  },

  async deleteTask(id: string, options?: { deleteAllOccurrences?: boolean }): Promise<void> {
    const task = await db.tasks.get(id)
    if (!task) return

    if (task.reminders) {
      for (const r of task.reminders) {
        const notifId = r.notificationId || getTaskNotificationId(task.id, r.id)
        await cancelTaskReminder(notifId)
      }
    }

    if (options?.deleteAllOccurrences) {
      const parentId = task.recurringParentId || task.id
      const relatedTasks = await db.tasks
        .filter((t) => t.id === parentId || t.recurringParentId === parentId)
        .toArray()

      for (const t of relatedTasks) {
        if (t.reminders) {
          for (const r of t.reminders) {
            const notifId = r.notificationId || getTaskNotificationId(t.id, r.id)
            await cancelTaskReminder(notifId)
          }
        }
        await db.transaction('rw', db.tasks, db.subtasks, async () => {
          await db.subtasks.where('taskId').equals(t.id).delete()
          await db.tasks.delete(t.id)
        })
      }
      return
    }

    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      await db.subtasks.where('taskId').equals(id).delete()
      await db.tasks.delete(id)
    })
  },

  async scheduleRemindersForTask(task: Task): Promise<void> {
    if (!task.reminders || task.reminders.length === 0) return

    const updatedReminders: TaskReminder[] = []
    let modified = false

    for (const reminder of task.reminders) {
      const notificationId = await scheduleTaskReminder({
        taskId: task.id,
        taskTitle: task.title,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        reminder
      })

      if (notificationId) {
        updatedReminders.push({ ...reminder, notificationId })
        modified = true
      } else {
        updatedReminders.push(reminder)
      }
    }

    if (modified) {
      await db.tasks.update(task.id, { reminders: updatedReminders })
    }
  },

  async materializeRecurringInstances(parentTask: Task, windowDays: number = 30): Promise<Task[]> {
    if (!parentTask.isRecurring || !parentTask.recurrence || !parentTask.dueDate) {
      return []
    }

    const today = new Date()
    const todayStr = format(today, 'yyyy-MM-dd')
    const upToStr = format(addDays(today, windowDays), 'yyyy-MM-dd')

    const existingInstances = await db.tasks
      .where('recurringParentId')
      .equals(parentTask.id)
      .toArray()

    const existingKeys = [
      `${parentTask.dueDate}@default`,
      `${parentTask.dueDate}@${parentTask.dueTime || 'default'}`,
      ...existingInstances.map((t) => `${t.dueDate}@default`),
      ...existingInstances.map((t) => `${t.dueDate}@${t.dueTime || 'default'}`)
    ]

    const startDate = parentTask.dueDate < todayStr ? todayStr : parentTask.dueDate
    const existingCount = 1 + existingInstances.length
    const missingSlots = generateOccurrenceSlots(
      parentTask.recurrence,
      startDate,
      upToStr,
      existingKeys,
      existingCount
    )

    if (missingSlots.length === 0) {
      return []
    }

    const parentSubtasks = await this.getSubtasksForTask(parentTask.id)
    const newTasks: Task[] = []

    for (const slot of missingSlots) {
      const subtaskDrafts = parentSubtasks.map((s) => ({
        title: s.title,
        completed: false
      }))

      const clonedReminders = (parentTask.reminders || []).map((r) => ({
        ...r,
        id: crypto.randomUUID(),
        notificationId: undefined,
        triggered: false
      }))

      const instanceInput: CreateTaskInput = {
        title: parentTask.title,
        description: parentTask.description,
        projectId: parentTask.projectId,
        priority: parentTask.priority,
        status: 'todo',
        dueDate: slot.date,
        dueTime: slot.time || parentTask.dueTime,
        estimatedMinutes: parentTask.estimatedMinutes,
        tags: [...parentTask.tags],
        recurringParentId: parentTask.id,
        recurrenceInstanceDate: slot.date,
        recurrenceInstanceTime: slot.time,
        reminders: clonedReminders,
        archived: false
      }

      const instance = await this.createTask(instanceInput, subtaskDrafts)
      newTasks.push(instance)
    }

    return newTasks
  },

  async syncRecurringInstances(windowDays: number = 30): Promise<void> {
    const parentRecurringTasks = await db.tasks
      .filter((t) => Boolean(t.isRecurring && t.recurrence && !t.recurringParentId && !t.archived))
      .toArray()

    for (const parent of parentRecurringTasks) {
      const isSubday =
        parent.recurrence?.frequency === 'hourly' ||
        (parent.recurrence?.timesOfDay && parent.recurrence.timesOfDay.length > 0)
      const forwardDays = isSubday ? 7 : windowDays
      await this.materializeRecurringInstances(parent, forwardDays)
    }
  },

  async getSubtasksForTask(taskId: string): Promise<Subtask[]> {
    const subtasks = await db.subtasks.where('taskId').equals(taskId).toArray()
    return subtasks.sort((a, b) => a.order - b.order)
  },

  async createSubtask(taskId: string, title: string): Promise<Subtask> {
    const task = await db.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`)
    }

    const existingSubtasks = await this.getSubtasksForTask(taskId)
    const now = new Date().toISOString()
    const subtaskId = crypto.randomUUID()

    const subtask: Subtask = {
      id: subtaskId,
      taskId,
      title: title.trim(),
      completed: false,
      order: existingSubtasks.length,
      createdAt: now,
      updatedAt: now
    }

    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      await db.subtasks.add(subtask)
      const newSubtaskIds = [...(task.subtaskIds || []), subtaskId]
      await db.tasks.update(taskId, {
        subtaskIds: newSubtaskIds,
        updatedAt: now
      })
    })

    return subtask
  },

  async updateSubtask(subtaskId: string, updates: Partial<Subtask>): Promise<Subtask> {
    const existing = await db.subtasks.get(subtaskId)
    if (!existing) {
      throw new Error(`Subtask with ID ${subtaskId} not found`)
    }

    const now = new Date().toISOString()
    const updated: Subtask = {
      ...existing,
      ...updates,
      updatedAt: now
    }

    await db.subtasks.put(updated)
    return updated
  },

  async toggleSubtask(subtaskId: string): Promise<Subtask> {
    const existing = await db.subtasks.get(subtaskId)
    if (!existing) {
      throw new Error(`Subtask with ID ${subtaskId} not found`)
    }
    return this.updateSubtask(subtaskId, { completed: !existing.completed })
  },

  async deleteSubtask(subtaskId: string): Promise<void> {
    const subtask = await db.subtasks.get(subtaskId)
    if (!subtask) return

    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      await db.subtasks.delete(subtaskId)
      const task = await db.tasks.get(subtask.taskId)
      if (task) {
        const updatedSubtaskIds = (task.subtaskIds || []).filter((id) => id !== subtaskId)
        await db.tasks.update(subtask.taskId, {
          subtaskIds: updatedSubtaskIds,
          updatedAt: new Date().toISOString()
        })
      }
    })
  },

  async batchUpdateSubtasks(
    taskId: string,
    subtasks: Array<{ id?: string; title: string; completed: boolean; order: number }>
  ): Promise<Subtask[]> {
    const task = await db.tasks.get(taskId)
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`)
    }

    const now = new Date().toISOString()
    const resultSubtasks: Subtask[] = []

    await db.transaction('rw', db.tasks, db.subtasks, async () => {
      await db.subtasks.where('taskId').equals(taskId).delete()

      const newSubtaskIds: string[] = []
      for (let i = 0; i < subtasks.length; i++) {
        const item = subtasks[i]
        const id = item.id || crypto.randomUUID()
        const newSubtask: Subtask = {
          id,
          taskId,
          title: item.title,
          completed: item.completed,
          order: item.order ?? i,
          createdAt: now,
          updatedAt: now
        }
        await db.subtasks.add(newSubtask)
        newSubtaskIds.push(id)
        resultSubtasks.push(newSubtask)
      }

      await db.tasks.update(taskId, {
        subtaskIds: newSubtaskIds,
        updatedAt: now
      })
    })

    return resultSubtasks.sort((a, b) => a.order - b.order)
  },

  async getAllTags(): Promise<string[]> {
    const tasks = await db.tasks.toArray()
    const tagsSet = new Set<string>()
    for (const task of tasks) {
      if (task.tags) {
        for (const tag of task.tags) {
          if (tag.trim()) {
            tagsSet.add(tag.trim())
          }
        }
      }
    }
    return Array.from(tagsSet).sort()
  }
}
