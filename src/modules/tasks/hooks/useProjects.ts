import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectRepository } from '../repository/projectRepository'
import type { Project } from '../types'
import { taskQueryKeys } from './useTasks'

export const projectQueryKeys = {
  all: ['projects'] as const,
  list: (includeArchived: boolean) =>
    ['projects', 'list', { includeArchived }] as const,
  withCounts: (includeArchived: boolean) =>
    ['projects', 'withCounts', { includeArchived }] as const,
  detail: (id: string) => ['projects', 'detail', id] as const
}

export function useProjects(includeArchived: boolean = false) {
  return useQuery({
    queryKey: projectQueryKeys.list(includeArchived),
    queryFn: () => projectRepository.getAllProjects(includeArchived)
  })
}

export function useProjectsWithCounts(includeArchived: boolean = false) {
  return useQuery({
    queryKey: projectQueryKeys.withCounts(includeArchived),
    queryFn: () => projectRepository.getProjectsWithCounts(includeArchived)
  })
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectQueryKeys.detail(id),
    queryFn: () => projectRepository.getProjectById(id),
    enabled: Boolean(id)
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>
    ) => projectRepository.createProject(projectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
    }
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      updates
    }: {
      id: string
      updates: Partial<Project>
    }) => projectRepository.updateProject(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.detail(variables.id)
      })
    }
  })
}

export function useArchiveProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      projectRepository.archiveProject(id, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      deleteTasks
    }: {
      id: string
      deleteTasks?: boolean
    }) => projectRepository.deleteProject(id, deleteTasks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: taskQueryKeys.all })
    }
  })
}
