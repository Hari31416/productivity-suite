import { useMemo } from 'react'
import type { Habit, HabitLog } from '../types'
import { useSetHabitLogValue } from '../hooks/useHabits'
import { CircularFocusTimer } from '@/components/timer/CircularFocusTimer'

interface HabitFocusTimerProps {
  habit: Habit
  selectedDate: string
  logs: HabitLog[]
  onSessionComplete?: (durationMinutes: number) => void
}

export function HabitFocusTimer({
  habit,
  selectedDate,
  logs,
  onSessionComplete
}: HabitFocusTimerProps) {
  const targetMinutes = Math.max(1, habit.targetValue || 25)

  // Calculate accumulated minutes tracked for today from habit logs
  const todayAccumulatedMinutes = useMemo(() => {
    return logs.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number' && log.durationSeconds > 0) {
        return sum + Math.round(log.durationSeconds / 60)
      }
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? targetMinutes : 0)
    }, 0)
  }, [logs, targetMinutes])

  const setValueMutation = useSetHabitLogValue()

  const handleLogSession = (elapsedMinutes: number) => {
    const nextTotal = todayAccumulatedMinutes + elapsedMinutes
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextTotal,
      completed: nextTotal >= targetMinutes
    })
  }

  return (
    <CircularFocusTimer
      title="Focus Timer"
      targetMinutes={targetMinutes}
      accumulatedMinutes={todayAccumulatedMinutes}
      targetLabel="target"
      themeColor={habit.color || '#0A7A64'}
      showAutofillRemaining={true}
      onLogSession={handleLogSession}
      onSessionComplete={onSessionComplete}
    />
  )
}
