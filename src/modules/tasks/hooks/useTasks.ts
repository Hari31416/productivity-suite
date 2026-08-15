import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskRepository } from '../repository/taskRepository'
import type { Task, TaskFilter, TaskStatus } from '../types'
import { projectQueryKeys } from './useProjects'

export const taskQueryKeys = {
  all: ['tasks'] as const,
  list: (filter?: TaskFilter) => ['tasks', 'list', filter] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  tags: ['tasks', 'tags'] as const
}

export function useTasks(filter?: TaskFilter) {
  return useQuery({
    queryKey: taskQueryKeys.list(filter),
    queryFn: () => taskRepository.getAllTasks(filter)
  })
}

export function useTask(id: string) {
  return useQuery({
    queryKey: taskQueryKeys.detail(id),
    queryFn: () => taskRepository.getTaskById(id),
    enabled: Boolean(id)
  })
}

export function useTaskTags() {
  return useQuery({
    queryKey: taskQueryKeys.tags,
    queryFn: () => taskRepository.getAllTags()
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskData,
      initialSubtasks
    }: {
      taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'subtaskIds'>
      initialSubtasks?: Array<{ title: string; completed?: boolean }>
    }) => taskRepository.createTask(taskData, initialSubtasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
    }
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) =>
      taskRepository.updateTask(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(variables.id)
      })
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
    }
  })
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      taskRepository.updateTaskStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: taskQueryKeys.detail(variables.id)
      })
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
    }
  })
}

export function useArchiveTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      taskRepository.archiveTask(id, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => taskRepository.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
    }
  })
}
