import { useMemo } from 'react'
import { Layers, ArrowRight, CheckCircle2, Circle, Play, ChevronRight, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { Habit, HabitLog, HabitRoutineStack } from '../types'
import { isHabitCompletedOnDate } from '../utils/streakCalculator'
import { getHabitIconComponent } from '../constants'
import { useToggleHabitLog } from '../hooks/useHabits'
import { fireConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'

interface HabitRoutineChainProps {
  routine: HabitRoutineStack
  allLogs: HabitLog[]
  selectedDate: string
  onSelectHabit?: (habitId: string) => void
  onOpenTimer?: (habit: Habit) => void
  onEditRoutine?: (routine: HabitRoutineStack) => void
}

export function HabitRoutineChain({
  routine,
  allLogs,
  selectedDate,
  onSelectHabit,
  onOpenTimer,
  onEditRoutine
}: HabitRoutineChainProps) {
  const toggleMutation = useToggleHabitLog()

  const habitsWithStatus = useMemo(() => {
    return routine.habits
      .map((habit, idx) => {
        const logsForDate = allLogs.filter((l) => l.habitId === habit.id && l.date === selectedDate)
        const completed = isHabitCompletedOnDate(habit, logsForDate)
        return {
          habit,
          order: habit.routineOrder || idx + 1,
          completed,
          logs: logsForDate
        }
      })
      .sort((a, b) => a.order - b.order)
  }, [routine.habits, allLogs, selectedDate])

  const nextIncomplete = useMemo(() => {
    return habitsWithStatus.find((item) => !item.completed)
  }, [habitsWithStatus])

  const completedCount = habitsWithStatus.filter((item) => item.completed).length
  const totalCount = habitsWithStatus.length
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const isAllComplete = completedCount === totalCount && totalCount > 0

  const handleQuickCheckIn = (habit: Habit, completed: boolean) => {
    if (!completed) {
      fireConfetti({
        particleCount: 35,
        colors: [habit.color || '#3b82f6', '#10b981', '#f59e0b']
      })
    }
    toggleMutation.mutate({
      habitId: habit.id,
      date: selectedDate
    })
  }

  return (
    <div className="rounded-2xl border bg-card/80 backdrop-blur-xs p-4 space-y-3.5 shadow-xs transition-all hover:border-primary/30">
      {/* Routine Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{routine.name}</h3>
            <p className="text-[11px] text-muted-foreground">
              {totalCount} sequence {totalCount === 1 ? 'step' : 'steps'} · {completedCount}/
              {totalCount} complete
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onEditRoutine && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Edit Routine Stack"
              onClick={() => onEditRoutine(routine)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}

          {isAllComplete ? (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <span>Routine Done!</span>
            </span>
          ) : (
            <span className="text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border">
              {percent}%
            </span>
          )}
        </div>
      </div>

      {/* Routine Progress Bar */}
      <Progress value={percent} className="h-2" />

      {/* Routine Step Chain Sequence */}
      <div className="space-y-2 pt-1">
        {habitsWithStatus.map((item, idx) => {
          const { habit, order, completed } = item
          const isNext = nextIncomplete?.habit.id === habit.id
          const IconComponent = getHabitIconComponent(habit.icon)
          const isLast = idx === habitsWithStatus.length - 1

          return (
            <div key={habit.id} className="relative">
              <div
                className={cn(
                  'flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all',
                  completed
                    ? 'bg-muted/30 border-muted text-muted-foreground'
                    : isNext
                      ? 'bg-primary/5 border-primary/40 shadow-xs ring-1 ring-primary/20'
                      : 'bg-card border-border/70 hover:bg-accent/40'
                )}
              >
                {/* Step Index & Habit Title */}
                <div
                  onClick={() => onSelectHabit && onSelectHabit(habit.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer select-none"
                >
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors',
                      completed
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : isNext
                          ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                          : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {order}
                  </div>

                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                    style={{
                      backgroundColor: `${habit.color}15`,
                      color: habit.color,
                      borderColor: `${habit.color}30`
                    }}
                  >
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          'text-xs font-semibold truncate',
                          completed ? 'line-through opacity-75' : 'text-foreground'
                        )}
                      >
                        {habit.title}
                      </span>
                      {isNext && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-1.5 py-0.2 rounded-md">
                          Next Up
                        </span>
                      )}
                    </div>
                    {habit.targetType === 'timer' && (
                      <span className="text-[10px] text-muted-foreground">
                        {habit.targetValue || 25}m timer block
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {habit.targetType === 'timer' && !completed && onOpenTimer && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenTimer(habit)}
                      className="h-7 text-xs px-2 text-primary hover:bg-primary/10 gap-1 rounded-lg"
                      title="Launch focus timer for this routine step"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span className="hidden xs:inline">Focus</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant={completed ? 'secondary' : isNext ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickCheckIn(habit, completed)}
                    className={cn(
                      'h-7 text-xs px-2.5 rounded-lg gap-1 font-medium transition-transform active:scale-95',
                      completed &&
                        'text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25',
                      isNext && !completed && 'bg-primary text-primary-foreground shadow-xs'
                    )}
                  >
                    {completed ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Done</span>
                      </>
                    ) : (
                      <>
                        <Circle className="h-3.5 w-3.5" />
                        <span>Check In</span>
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onSelectHabit && onSelectHabit(habit.id)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                    title="View habit details"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Connecting Chain Line */}
              {!isLast && (
                <div className="flex justify-center -my-1 relative z-0">
                  <div className="flex items-center justify-center h-3 text-muted-foreground/40">
                    <ArrowRight className="h-3 w-3 rotate-90" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
