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
