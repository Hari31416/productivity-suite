import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { taskRepository } from '../repository/taskRepository'
import type { Subtask } from '../types'
import { taskQueryKeys } from './useTasks'

export const subtaskQueryKeys = {
  all: ['subtasks'] as const,
  byTask: (taskId: string) => ['subtasks', 'task', taskId] as const
}

export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: subtaskQueryKeys.byTask(taskId),
    queryFn: () => taskRepository.getSubtasksForTask(taskId),
    enabled: Boolean(taskId)
  })
}

export function useCreateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      taskRepository.createSubtask(taskId, title),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskQueryKeys.byTask(variables.taskId)
      })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}

export function useUpdateSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: {
      id: string
      taskId: string
      updates: Partial<Subtask>
    }) => taskRepository.updateSubtask(variables.id, variables.updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskQueryKeys.byTask(variables.taskId)
      })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}

export function useToggleSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: {
      id: string
      taskId: string
    }) => taskRepository.toggleSubtask(variables.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskQueryKeys.byTask(variables.taskId)
      })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}

export function useDeleteSubtask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: {
      id: string
      taskId: string
    }) => taskRepository.deleteSubtask(variables.id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskQueryKeys.byTask(variables.taskId)
      })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}

export function useBatchUpdateSubtasks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      taskId,
      subtasks
    }: {
      taskId: string
      subtasks: Array<{
        id?: string
        title: string
        completed: boolean
        order: number
      }>
    }) => taskRepository.batchUpdateSubtasks(taskId, subtasks),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: subtaskQueryKeys.byTask(variables.taskId)
      })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}
