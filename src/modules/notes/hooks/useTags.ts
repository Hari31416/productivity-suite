import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tagRepository } from '../repository/tagRepository'
import type { CreateTagInput, UpdateTagInput } from '../types'
import { noteQueryKeys } from './useNotes'

export const tagQueryKeys = {
  all: ['tags'] as const,
  list: () => ['tags', 'list'] as const,
  detail: (id: string) => ['tags', 'detail', id] as const
}

export function useTags() {
  return useQuery({
    queryKey: tagQueryKeys.list(),
    queryFn: () => tagRepository.getAllTags()
  })
}

export function useTag(id: string) {
  return useQuery({
    queryKey: tagQueryKeys.detail(id),
    queryFn: () => tagRepository.getTagById(id),
    enabled: Boolean(id)
  })
}

export function useCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateTagInput) => tagRepository.createTag(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
    }
  })
}

export function useUpdateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) =>
      tagRepository.updateTag(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.detail(variables.id) })
    }
  })
}

export function useDeleteTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => tagRepository.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
    }
  })
}

export function useFindOrCreateTag() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) =>
      tagRepository.findOrCreateTag(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tagQueryKeys.all })
    }
  })
}
