import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Minus,
  Plus,
  RotateCcw,
  Pencil
} from 'lucide-react'
import type { Habit, HabitLog } from '../types'
import { DEFAULT_HABIT_CATEGORIES, getHabitIconComponent } from '../constants'
import { getHabitSlots } from '../utils/intervalCalculator'
import { calculateStreak, isHabitCompletedOnDate } from '../utils/streakCalculator'
import {
  useToggleHabitLog,
  useSetHabitLogValue
} from '../hooks/useHabits'
import { cn } from '@/lib/utils'
import { fireConfetti } from '@/lib/confetti'

interface HabitCardProps {
  habit: Habit
  logs: HabitLog[]
  allLogs?: HabitLog[]
  selectedDate: string
  onEdit: (habit: Habit) => void
  onArchive: (habit: Habit) => void
  onDelete: (habit: Habit) => void
}

export function HabitCard({
  habit,
  logs,
  allLogs = [],
  selectedDate,
  onEdit,
  onArchive,
  onDelete
}: HabitCardProps) {
  const [isEditingDirect, setIsEditingDirect] = useState(false)
  const [directValueInput, setDirectValueInput] = useState('')

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
    const target = habit.targetValue || 1
    const val = logs.reduce((sum, log) => {
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? target : 0)
    }, 0)
    return Math.min(target, val)
  }, [habit, logs])

  const currentTimerMinutes = useMemo(() => {
    if (habit.targetType !== 'timer') return 0
    const target = habit.targetValue || 30
    const mins = logs.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number') {
        return sum + Math.round(log.durationSeconds / 60)
      }
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? target : 0)
    }, 0)
    return Math.min(target, mins)
  }, [habit, logs])

  const handleToggleBoolean = () => {
    if (!isCompleted) {
      fireConfetti({ particleCount: 35, colors: [habit.color || '#0A7A64', '#10b981', '#f59e0b'] })
    }
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
    const nextVal = Math.min(target, Math.max(0, currentNumericValue + delta))
    if (nextVal >= target && currentNumericValue < target) {
      fireConfetti({ particleCount: 35, colors: [habit.color || '#0A7A64', '#10b981', '#ec4899'] })
    }
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextVal,
      completed: nextVal >= target
    })
  }

  const handleTimerChange = (delta: number) => {
    const target = habit.targetValue || 30
    const nextVal = Math.min(target, Math.max(0, currentTimerMinutes + delta))
    if (nextVal >= target && currentTimerMinutes < target) {
      fireConfetti({ particleCount: 35, colors: [habit.color || '#0A7A64', '#10b981', '#ec4899'] })
    }
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextVal,
      completed: nextVal >= target
    })
  }

  const handleSetExactValue = (val: number) => {
    const target = habit.targetValue || 1
    const clampedVal = Math.min(target, Math.max(0, val))
    if (clampedVal >= target && currentNumericValue < target) {
      fireConfetti({ particleCount: 35, colors: [habit.color || '#0A7A64', '#10b981', '#ec4899'] })
    }
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: clampedVal,
      completed: clampedVal >= target
    })
  }

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(directValueInput)
    if (!isNaN(parsed) && parsed >= 0) {
      if (habit.targetType === 'timer') {
        const target = habit.targetValue || 30
        const clampedVal = Math.min(target, parsed)
        if (clampedVal >= target && currentTimerMinutes < target) {
          fireConfetti({ particleCount: 35, colors: [habit.color || '#0A7A64', '#10b981', '#ec4899'] })
        }
        setValueMutation.mutate({
          habitId: habit.id,
          date: selectedDate,
          value: clampedVal,
          completed: clampedVal >= target
        })
      } else {
        handleSetExactValue(parsed)
      }
    }
    setIsEditingDirect(false)
  }

  const HabitIcon = getHabitIconComponent(
    habit.icon,
    habit.title,
    habit.categoryId
  )

  // Progress Dots calculation (Max 10 dots, single row)
  const dotProgress = useMemo(() => {
    if (habit.targetType === 'numeric') {
      const target = habit.targetValue || 1
      const totalDots = Math.min(10, Math.max(1, target))
      const activeDots = target <= 10
        ? Math.min(totalDots, Math.max(0, currentNumericValue))
        : Math.min(10, Math.round((currentNumericValue / target) * 10))
      return { totalDots, activeDots, isRatio: target > 10, target }
    }
    if (habit.targetType === 'timer') {
      const target = habit.targetValue || 30
      const totalDots = 10
      const activeDots = Math.min(10, Math.round((currentTimerMinutes / target) * 10))
      return { totalDots, activeDots, isRatio: true, target }
    }
    return null
  }, [habit, currentNumericValue, currentTimerMinutes])

  const habitThemeColor = habit.color || category?.color || '#0A7A64'

  return (
    <Card
      className={cn(
        'rounded-2xl border bg-card transition-all hover:shadow-xs',
        habit.archived && 'opacity-60 bg-muted/30',
        isCompleted && 'border-primary/30 bg-primary/5'
      )}
    >
      <CardContent className="p-3.5 sm:p-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* Left: Icon in soft rounded square */}
          <div
            className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl transition-transform"
            style={{
              backgroundColor: `${habitThemeColor}18`,
              color: habitThemeColor
            }}
          >
            <HabitIcon className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>

          {/* Middle: Title, target/status, and progress dots */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <h3
                className={cn(
                  'font-semibold text-sm sm:text-base leading-snug text-foreground',
                  isCompleted && 'text-foreground font-semibold'
                )}
                title={habit.title}
              >
                {habit.title}
              </h3>
              {category ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 border"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}35`,
                    color: category.color
                  }}
                  title={category.name}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span>{category.name}</span>
                </span>
              ) : habit.categoryId ? (
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 border border-muted bg-muted/40 text-muted-foreground capitalize"
                >
                  <span>{habit.categoryId}</span>
                </span>
              ) : null}
            </div>

            {/* Subtitle / Counter / Status */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {habit.targetType === 'numeric' && (
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {isEditingDirect ? (
                    <form onSubmit={handleDirectSubmit} className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={directValueInput}
                        onChange={(e) => setDirectValueInput(e.target.value)}
                        className="h-6 w-16 text-xs px-1.5"
                        autoFocus
                      />
                      <Button type="submit" size="sm" className="h-6 px-1.5 text-[10px]">
                        Set
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px]"
                        onClick={() => setIsEditingDirect(false)}
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDirectValueInput(`${currentNumericValue}`)
                        setIsEditingDirect(true)
                      }}
                      className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 group truncate"
                      title="Click to edit value directly"
                    >
                      <span>
                        {currentNumericValue} / {habit.targetValue || 1} {habit.unit || 'units'}
                      </span>
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  )}

                  {/* Stepper & Quick Add buttons */}
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleNumericChange(-1)}
                      disabled={currentNumericValue <= 0}
                      className="h-5 w-5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center disabled:opacity-40 shrink-0"
                      aria-label="Decrease value"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumericChange(1)}
                      className="h-5 w-5 rounded bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center shrink-0"
                      aria-label="Increase value"
                    >
                      <Plus className="h-3 w-3" />
                    </button>

                    {[5, 10].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleNumericChange(val)}
                        className="px-1.5 py-0.5 rounded bg-muted/60 hover:bg-primary/10 hover:text-primary text-[10px] font-medium text-muted-foreground transition-colors shrink-0"
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {habit.targetType === 'timer' && (
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  {isEditingDirect ? (
                    <form onSubmit={handleDirectSubmit} className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        value={directValueInput}
                        onChange={(e) => setDirectValueInput(e.target.value)}
                        className="h-6 w-16 text-xs px-1.5"
                        autoFocus
                      />
                      <Button type="submit" size="sm" className="h-6 px-1.5 text-[10px]">
                        Set
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 px-1.5 text-[10px]"
                        onClick={() => setIsEditingDirect(false)}
                      >
                        ✕
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDirectValueInput(`${currentTimerMinutes}`)
                        setIsEditingDirect(true)
                      }}
                      className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1 group truncate"
                      title="Click to edit timer minutes directly"
                    >
                      <span>
                        {currentTimerMinutes} / {habit.targetValue || 30} min
                      </span>
                      <Pencil className="h-2.5 w-2.5 text-muted-foreground/60 group-hover:text-primary transition-colors shrink-0" />
                    </button>
                  )}

                  <div className="inline-flex items-center gap-1">
                    {[5, 10, 15, 30].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => handleTimerChange(mins)}
                        className="px-1.5 py-0.5 rounded bg-muted/60 hover:bg-primary/10 hover:text-primary text-[10px] font-medium text-muted-foreground transition-colors shrink-0"
                      >
                        +{mins}m
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {habit.targetType === 'boolean' && (
                <span className="truncate">{habit.description || (isCompleted ? 'Completed' : 'Daily check-in')}</span>
              )}

              {streakInfo.currentStreak > 0 && (
                <span className="flex items-center gap-0.5 font-medium text-amber-500 text-[11px] shrink-0 ml-auto sm:ml-0">
                  <Flame className="h-3 w-3" />
                  {streakInfo.currentStreak}d
                </span>
              )}
            </div>

            {/* Dot Progress Indicators (Single row, comfortably fit without clipping) */}
            {dotProgress && (
              <div className="flex items-center gap-1 sm:gap-1.5 pt-1.5 flex-nowrap max-w-fit">
                {Array.from({ length: dotProgress.totalDots }).map((_, idx) => {
                  const isDotFilled = idx < dotProgress.activeDots
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        if (!dotProgress.isRatio) {
                          handleSetExactValue(idx + 1)
                        } else {
                          const ratio = (idx + 1) / dotProgress.totalDots
                          if (habit.targetType === 'timer') {
                            const targetMin = Math.round(ratio * dotProgress.target)
                            handleTimerChange(targetMin - currentTimerMinutes)
                          } else {
                            handleSetExactValue(Math.round(ratio * dotProgress.target))
                          }
                        }
                      }}
                      className={cn(
                        'h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full transition-all shrink-0 hover:scale-125 focus:outline-hidden',
                        isDotFilled
                          ? 'bg-primary shadow-2xs'
                          : 'bg-muted-foreground/25 hover:bg-muted-foreground/35'
                      )}
                      style={isDotFilled && habit.color ? { backgroundColor: habit.color } : undefined}
                      aria-label={`Step ${idx + 1}`}
                    />
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Circular Check Action & Menu (Fixed shrink-0 and explicit gap) */}
          <div className="flex items-center gap-1 shrink-0 ml-auto pl-1">
            <button
              type="button"
              onClick={() => {
                if (habit.targetType === 'numeric') {
                  if (isCompleted) {
                    handleSetExactValue(0)
                  } else {
                    handleSetExactValue(habit.targetValue || 1)
                  }
                } else if (habit.targetType === 'timer') {
                  if (isCompleted) {
                    handleTimerChange(-currentTimerMinutes)
                  } else {
                    handleTimerChange((habit.targetValue || 30) - currentTimerMinutes)
                  }
                } else {
                  handleToggleBoolean()
                }
              }}
              className={cn(
                'flex h-10 w-10 sm:h-11 sm:w-11 min-h-[40px] min-w-[40px] items-center justify-center rounded-full transition-transform active:scale-95 shadow-xs shrink-0',
                isCompleted
                  ? 'bg-primary text-primary-foreground'
                  : 'border-2 border-muted-foreground/30 bg-background text-transparent hover:border-primary/60'
              )}
              aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
            >
              <Check className="h-5 w-5 stroke-[2.5]" />
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 text-muted-foreground hover:text-foreground rounded-full shrink-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
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

        {/* Sub-day Interval Slots if applicable */}
        {(habit.frequencyType === 'subday_interval' ||
          habit.frequencyType === 'times_per_day') && (
            <div className="space-y-2 pt-2 mt-2 border-t">
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
              <div className="flex items-center gap-1.5 flex-wrap">
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
                        'h-8 px-2.5 text-xs font-medium rounded-lg gap-1 transition-all',
                        slotCompleted && 'bg-primary text-primary-foreground font-semibold'
                      )}
                    >
                      {slotCompleted && <Check className="h-3 w-3" />}
                      <span>{slot.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
