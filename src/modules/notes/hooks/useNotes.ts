import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { noteRepository } from '../repository/noteRepository'
import type { NoteFilter, CreateNoteInput, UpdateNoteInput } from '../types'

export const noteQueryKeys = {
  all: ['notes'] as const,
  list: (filter?: NoteFilter) => ['notes', 'list', filter] as const,
  detail: (id: string) => ['notes', 'detail', id] as const,
  pinned: () => ['notes', 'pinned'] as const,
  recent: (limit?: number) => ['notes', 'recent', limit] as const
}

export function useNotes(filter?: NoteFilter) {
  return useQuery({
    queryKey: noteQueryKeys.list(filter),
    queryFn: () => noteRepository.getAllNotes(filter)
  })
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteQueryKeys.detail(id),
    queryFn: () => noteRepository.getNoteById(id),
    enabled: Boolean(id)
  })
}

export function usePinnedNotes() {
  return useQuery({
    queryKey: noteQueryKeys.pinned(),
    queryFn: () => noteRepository.getPinnedNotes()
  })
}

export function useRecentNotes(limit = 5) {
  return useQuery({
    queryKey: noteQueryKeys.recent(limit),
    queryFn: () => noteRepository.getRecentNotes(limit)
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateNoteInput) => noteRepository.createNote(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
    }
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateNoteInput }) =>
      noteRepository.updateNote(id, input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(variables.id) })
    }
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteRepository.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
    }
  })
}

export function useTogglePinNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteRepository.togglePinNote(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(id) })
    }
  })
}

export function useToggleArchiveNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteRepository.toggleArchiveNote(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.detail(id) })
    }
  })
}

export function useDuplicateNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => noteRepository.duplicateNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteQueryKeys.all })
    }
  })
}
