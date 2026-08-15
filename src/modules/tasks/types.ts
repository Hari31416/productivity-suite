export type PriorityLevel = 'low' | 'medium' | 'high' | 'urgent'

export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done'

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
  tags: string[]
  subtaskIds: string[]
  completedAt?: string
  createdAt: string
  updatedAt: string
  archived: boolean
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

export type CreateTaskInput = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtaskIds' | 'status' | 'priority' | 'archived' | 'tags'> & {
  status?: TaskStatus
  priority?: PriorityLevel
  archived?: boolean
  tags?: string[]
}

export type UpdateTaskInput = Partial<Omit<Task, 'id' | 'createdAt' | 'updatedAt'>>

