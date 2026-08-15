import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { habitRepository } from '../repository/habitRepository'
import type { Habit, HabitLog } from '../types'

export const habitQueryKeys = {
  allHabits: ['habits'] as const,
  habitList: (includeArchived: boolean) =>
    ['habits', 'list', { includeArchived }] as const,
  habitDetail: (id: string) => ['habits', 'detail', id] as const,
  allLogs: ['habitLogs'] as const,
  logsByDate: (date: string) => ['habitLogs', 'date', date] as const,
  logsByRange: (startDate: string, endDate: string) =>
    ['habitLogs', 'range', { startDate, endDate }] as const,
  logsByHabit: (habitId: string) => ['habitLogs', 'habit', habitId] as const
}

export function useHabits(includeArchived: boolean = false) {
  return useQuery({
    queryKey: habitQueryKeys.habitList(includeArchived),
    queryFn: () => habitRepository.getAllHabits(includeArchived)
  })
}

export function useHabit(id: string) {
  return useQuery({
    queryKey: habitQueryKeys.habitDetail(id),
    queryFn: () => habitRepository.getHabitById(id),
    enabled: Boolean(id)
  })
}

export function useHabitLogs(date: string) {
  return useQuery({
    queryKey: habitQueryKeys.logsByDate(date),
    queryFn: () => habitRepository.getLogsForDate(date),
    enabled: Boolean(date)
  })
}

export function useHabitRangeLogs(startDate: string, endDate: string) {
  return useQuery({
    queryKey: habitQueryKeys.logsByRange(startDate, endDate),
    queryFn: () => habitRepository.getLogsForDateRange(startDate, endDate),
    enabled: Boolean(startDate && endDate)
  })
}

export function useHabitLogsForHabit(habitId: string) {
  return useQuery({
    queryKey: habitQueryKeys.logsByHabit(habitId),
    queryFn: () => habitRepository.getLogsForHabit(habitId),
    enabled: Boolean(habitId)
  })
}

export function useCreateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt'>) =>
      habitRepository.createHabit(habitData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allHabits })
    }
  })
}

export function useUpdateHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Habit> }) =>
      habitRepository.updateHabit(id, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allHabits })
      queryClient.invalidateQueries({
        queryKey: habitQueryKeys.habitDetail(variables.id)
      })
    }
  })
}

export function useArchiveHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, archived }: { id: string; archived: boolean }) =>
      habitRepository.archiveHabit(id, archived),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allHabits })
    }
  })
}

export function useDeleteHabit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => habitRepository.deleteHabit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allHabits })
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allLogs })
    }
  })
}

export function useToggleHabitLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      intervalIndex
    }: {
      habitId: string
      date: string
      intervalIndex?: number
    }) => habitRepository.toggleHabitLog(habitId, date, intervalIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allLogs })
    }
  })
}

export function useSetHabitLogValue() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      habitId,
      date,
      value,
      intervalIndex,
      completed
    }: {
      habitId: string
      date: string
      value: number
      intervalIndex?: number
      completed?: boolean
    }) =>
      habitRepository.setHabitLogValue(
        habitId,
        date,
        value,
        intervalIndex,
        completed
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allLogs })
    }
  })
}

export function useSaveHabitLog() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      log: Omit<HabitLog, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
    ) => habitRepository.saveHabitLog(log),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKeys.allLogs })
    }
  })
}
