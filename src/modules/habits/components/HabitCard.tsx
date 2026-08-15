import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Check,
  Flame,
  MoreVertical,
  Edit2,
  Archive,
  Trash2,
  Plus,
  Minus,
  Clock,
  RotateCcw
} from 'lucide-react'
import type { Habit, HabitLog } from '../types'
import { DEFAULT_HABIT_CATEGORIES } from '../constants'
import { getHabitSlots } from '../utils/intervalCalculator'
import { calculateStreak, isHabitCompletedOnDate } from '../utils/streakCalculator'
import {
  useToggleHabitLog,
  useSetHabitLogValue
} from '../hooks/useHabits'
import { cn } from '@/lib/utils'

interface HabitCardProps {
  habit: Habit
  logs: HabitLog[]
  allLogs?: HabitLog[]
  selectedDate: string
  onEdit: (habit: Habit) => void
  onArchive: (habit: Habit) => void
  onDelete: (habit: Habit) => void
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HabitCard({
  habit,
  logs,
  allLogs = [],
  selectedDate,
  onEdit,
  onArchive,
  onDelete
}: HabitCardProps) {
  const toggleMutation = useToggleHabitLog()
  const setValueMutation = useSetHabitLogValue()

  const category = useMemo(() => {
    return DEFAULT_HABIT_CATEGORIES.find((c) => c.id === habit.categoryId)
  }, [habit.categoryId])

  const streakInfo = useMemo(() => {
    const relevantLogs = allLogs.length > 0 ? allLogs : logs
    return calculateStreak(habit, relevantLogs, selectedDate)
  }, [habit, allLogs, logs, selectedDate])

  const isCompleted = useMemo(() => {
    return isHabitCompletedOnDate(habit, logs)
  }, [habit, logs])

  const slots = useMemo(() => {
    return getHabitSlots(habit)
  }, [habit])

  const currentNumericValue = useMemo(() => {
    if (habit.targetType !== 'numeric') return 0
    return logs.reduce((sum, log) => {
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? (habit.targetValue || 1) : 0)
    }, 0)
  }, [habit, logs])

  const currentTimerMinutes = useMemo(() => {
    if (habit.targetType !== 'timer') return 0
    const totalSeconds = logs.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number') {
        return sum + log.durationSeconds
      }
      return sum + (log.completed ? (habit.targetValue || 0) * 60 : 0)
    }, 0)
    return Math.round(totalSeconds / 60)
  }, [habit, logs])

  const handleToggleBoolean = () => {
    toggleMutation.mutate({
      habitId: habit.id,
      date: selectedDate
    })
  }

  const handleToggleSlot = (intervalIndex: number) => {
    toggleMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      intervalIndex
    })
  }

  const handleNumericChange = (delta: number) => {
    const target = habit.targetValue || 1
    const nextVal = Math.max(0, currentNumericValue + delta)
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextVal,
      completed: nextVal >= target
    })
  }

  const handleTimerAdd = (minutes: number) => {
    const targetMinutes = habit.targetValue || 30
    const nextTotalMinutes = Math.max(0, currentTimerMinutes + minutes)
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextTotalMinutes,
      completed: nextTotalMinutes >= targetMinutes
    })
  }

  const frequencyLabel = useMemo(() => {
    switch (habit.frequencyType) {
      case 'daily':
        return 'Daily'
      case 'custom_days': {
        const days = (habit.targetDaysOfWeek || []).map((d) => DAY_NAMES[d])
        return days.length > 0 ? days.join(', ') : 'Daily'
      }
      case 'weekly':
        return `${habit.targetCountPerWeek || 1}x / week`
      case 'subday_interval':
        return `Every ${habit.intervalHours || 3}h (${habit.timeWindow?.startTime || '08:00'} - ${habit.timeWindow?.endTime || '20:00'})`
      case 'times_per_day':
        return `${habit.timesPerDay || 1}x / day`
      default:
        return 'Daily'
    }
  }, [habit])

  const targetDisplay = useMemo(() => {
    if (habit.targetType === 'numeric') {
      const target = habit.targetValue || 1
      const unit = habit.unit || 'units'
      return `${currentNumericValue} / ${target} ${unit}`
    }
    if (habit.targetType === 'timer') {
      const target = habit.targetValue || 30
      return `${currentTimerMinutes} / ${target} mins`
    }
    return null
  }, [habit, currentNumericValue, currentTimerMinutes])

  const numericPercent = useMemo(() => {
    if (habit.targetType === 'numeric') {
      const target = habit.targetValue || 1
      return Math.min(100, Math.round((currentNumericValue / target) * 100))
    }
    if (habit.targetType === 'timer') {
      const target = habit.targetValue || 30
      return Math.min(100, Math.round((currentTimerMinutes / target) * 100))
    }
    return isCompleted ? 100 : 0
  }, [habit, currentNumericValue, currentTimerMinutes, isCompleted])

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        habit.archived && 'opacity-60 bg-muted/30',
        isCompleted && 'border-primary/40 bg-primary/5'
      )}
    >
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="mt-1 h-3.5 w-3.5 rounded-full shrink-0"
              style={{ backgroundColor: habit.color || '#3b82f6' }}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3
                  className={cn(
                    'font-semibold text-base leading-snug truncate',
                    isCompleted && 'line-through text-muted-foreground'
                  )}
                >
                  {habit.title}
                </h3>
                {category && (
                  <Badge
                    variant="outline"
                    className="text-xs px-2 py-0 h-5 font-normal"
                    style={{
                      borderColor: `${category.color}40`,
                      color: category.color
                    }}
                  >
                    {category.name}
                  </Badge>
                )}
              </div>
              {habit.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {habit.description}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                <span>{frequencyLabel}</span>
                {streakInfo.currentStreak > 0 && (
                  <span className="flex items-center gap-1 font-medium text-amber-500">
                    <Flame className="h-3.5 w-3.5" />
                    {streakInfo.currentStreak} {streakInfo.currentStreak === 1 ? 'day' : 'days'} streak
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {habit.targetType === 'boolean' &&
              habit.frequencyType !== 'subday_interval' &&
              habit.frequencyType !== 'times_per_day' && (
                <Button
                  size="sm"
                  variant={isCompleted ? 'default' : 'outline'}
                  onClick={handleToggleBoolean}
                  className={cn(
                    'h-11 w-11 sm:h-9 sm:w-9 min-h-[44px] min-w-[44px] p-0 rounded-full transition-transform active:scale-95',
                    isCompleted && 'bg-primary text-primary-foreground'
                  )}
                  aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
                >
                  <Check
                    className={cn(
                      'h-5 w-5 sm:h-4 sm:w-4',
                      !isCompleted && 'text-muted-foreground'
                    )}
                  />
                </Button>
              )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] p-0 text-muted-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(habit)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Habit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onArchive(habit)}>
                  {habit.archived ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restore Habit
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive Habit
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(habit)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Habit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {(habit.frequencyType === 'subday_interval' ||
          habit.frequencyType === 'times_per_day') && (
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Interval Progress</span>
              <span>
                {slots.filter((slot) => {
                  const log = logs.find((l) => l.intervalIndex === slot.index)
                  return log ? log.completed : false
                }).length}{' '}
                / {slots.length} completed
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {slots.map((slot) => {
                const log = logs.find((l) => l.intervalIndex === slot.index)
                const slotCompleted = log ? log.completed : false
                return (
                  <Button
                    key={slot.index}
                    type="button"
                    size="sm"
                    variant={slotCompleted ? 'default' : 'outline'}
                    onClick={() => handleToggleSlot(slot.index)}
                    className={cn(
                      'min-h-[44px] sm:min-h-[32px] px-3.5 sm:px-2.5 text-xs font-medium rounded-lg sm:rounded-md gap-1.5 transition-all',
                      slotCompleted && 'bg-primary text-primary-foreground font-semibold'
                    )}
                  >
                    {slotCompleted && <Check className="h-3.5 w-3.5" />}
                    <span>{slot.label}</span>
                  </Button>
                )
              })}
            </div>
          </div>
        )}

        {habit.targetType === 'numeric' && (
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{targetDisplay}</span>
              <span className="font-medium text-foreground">{numericPercent}%</span>
            </div>
            <Progress value={numericPercent} className="h-2" />
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-0"
                onClick={() => handleNumericChange(-1)}
                disabled={currentNumericValue <= 0}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 w-11 sm:h-8 sm:w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-0"
                onClick={() => handleNumericChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {habit.targetType === 'timer' && (
          <div className="space-y-2 pt-1 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {targetDisplay}
              </span>
              <span className="font-medium text-foreground">{numericPercent}%</span>
            </div>
            <Progress value={numericPercent} className="h-2" />
            <div className="flex items-center justify-end gap-2 pt-1 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 text-xs"
                onClick={() => handleTimerAdd(5)}
              >
                +5m
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 text-xs"
                onClick={() => handleTimerAdd(15)}
              >
                +15m
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 text-xs"
                onClick={() => handleTimerAdd(30)}
              >
                +30m
              </Button>
              <Button
                type="button"
                variant={isCompleted ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'h-11 sm:h-8 min-h-[44px] sm:min-h-0 px-3 text-xs',
                  isCompleted && 'bg-primary'
                )}
                onClick={handleToggleBoolean}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                {isCompleted ? 'Done' : 'Complete'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
