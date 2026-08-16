export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

export type RecurrenceFrequency = 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export interface RecurrenceEndCondition {
  type: 'never' | 'after_count' | 'on_date'
  count?: number
  completedCount?: number
  endDate?: string
}

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number
  // Sub-day options
  timesOfDay?: string[] // e.g. ['08:00', '13:00', '19:00']
  startTime?: string // e.g. '09:00' for hourly window
  endTime?: string // e.g. '18:00' for hourly window
  // Day / Week / Month options
  daysOfWeek?: number[] // 0 (Sun) - 6 (Sat)
  dayOfMonth?: number
  endCondition?: RecurrenceEndCondition
}

export type ReminderType = 'offset' | 'exact'

export interface TaskReminder {
  id: string
  type: ReminderType
  offsetMinutes?: number // e.g., 0, 5, 15, 30, 60, 1440 (1 day)
  exactDateTime?: string // ISO string
  notificationId?: number
  triggered?: boolean
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  createdAt: string
  updatedAt: string
  archived: boolean
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: PriorityLevel
  dueDate?: string
  dueTime?: string
  estimatedMinutes?: number
  actualMinutes?: number
  tags: string[]
  subtaskIds: string[]
  completedAt?: string
  createdAt: string
  updatedAt: string
  archived: boolean
  // Recurrence fields
  isRecurring?: boolean
  recurrence?: RecurrenceRule
  recurringParentId?: string
  recurrenceInstanceDate?: string
  recurrenceInstanceTime?: string
  // Reminders
  reminders?: TaskReminder[]
}

export interface TaskFilter {
  projectId?: string
  status?: TaskStatus
  priority?: PriorityLevel
  tag?: string
  searchQuery?: string
  dueDate?: string
  startDate?: string
  endDate?: string
  includeArchived?: boolean
  isRecurring?: boolean
  smartFilter?: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed' | 'archived'
}

export interface ProjectWithCount extends Project {
  taskCount: number
  completedTaskCount: number
}

export type TaskViewMode = 'list' | 'calendar' | 'kanban'

export type CreateProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'archived'> & {
  archived?: boolean
}

export type UpdateProjectInput = Partial<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>

export type CreateTaskInput = Omit<
  Task,
  'id' | 'createdAt' | 'updatedAt' | 'subtaskIds' | 'status' | 'priority' | 'archived' | 'tags'
> & {
  status?: TaskStatus
  priority?: PriorityLevel
  archived?: boolean
  tags?: string[]
  isRecurring?: boolean
  recurrence?: RecurrenceRule
  recurringParentId?: string
  recurrenceInstanceDate?: string
  recurrenceInstanceTime?: string
  reminders?: TaskReminder[]
}

export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>
