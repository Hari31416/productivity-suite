import { useState, useMemo } from 'react'
import { format, parseISO, isToday as checkIsToday } from 'date-fns'
import {
  ChevronLeft,
  Flame,
  Trophy,
  Check,
  Edit2,
  Archive,
  Trash2,
  Star,
  Clock,
  Bell,
  Target,
  Minus,
  Plus,
  Pencil,
  Sparkles,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import type { Habit, HabitLog } from '../types'
import { DEFAULT_HABIT_CATEGORIES, getHabitIconComponent } from '../constants'
import { calculateStreak, isHabitCompletedOnDate } from '../utils/streakCalculator'
import { getHabitSlots } from '../utils/intervalCalculator'
import { getDynamicStepConfig, getDynamicTimerConfig } from '../utils/dynamicStepper'
import {
  useToggleHabitLog,
  useSetHabitLogValue,
  useUpdateHabit,
  useArchiveHabit,
  useDeleteHabit
} from '../hooks/useHabits'
import { HabitFocusTimer } from './HabitFocusTimer'
import { HabitMonthlyCalendar } from './HabitMonthlyCalendar'
import { HabitFormModal } from './HabitFormModal'
import { fireConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'

interface HabitDetailViewProps {
  habit: Habit
  logs: HabitLog[]
  allLogs: HabitLog[]
  selectedDate?: string
  onBack: () => void
}

export function HabitDetailView({
  habit,
  allLogs,
  selectedDate: initialSelectedDate,
  onBack
}: HabitDetailViewProps) {
  const [selectedDate, setSelectedDate] = useState(
    () => initialSelectedDate || format(new Date(), 'yyyy-MM-dd')
  )
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditingDirect, setIsEditingDirect] = useState(false)
  const [directValueInput, setDirectValueInput] = useState('')

  const updateMutation = useUpdateHabit()
  const archiveMutation = useArchiveHabit()
  const deleteMutation = useDeleteHabit()
  const toggleMutation = useToggleHabitLog()
  const setValueMutation = useSetHabitLogValue()

  const category = useMemo(() => {
    return DEFAULT_HABIT_CATEGORIES.find((c) => c.id === habit.categoryId)
  }, [habit.categoryId])

  const dateLogs = useMemo(() => {
    return allLogs.filter((l) => l.date === selectedDate && l.habitId === habit.id)
  }, [allLogs, selectedDate, habit.id])

  const streakInfo = useMemo(() => {
    return calculateStreak(habit, allLogs, selectedDate)
  }, [habit, allLogs, selectedDate])

  const isCompletedToday = useMemo(() => {
    return isHabitCompletedOnDate(habit, dateLogs)
  }, [habit, dateLogs])

  const slots = useMemo(() => {
    return getHabitSlots(habit)
  }, [habit])

  const targetValue = habit.targetValue || (habit.targetType === 'timer' ? 30 : 1)

  // Current values
  const currentNumericValue = useMemo(() => {
    if (habit.targetType !== 'numeric') return 0
    const val = dateLogs.reduce((sum, log) => {
      if (typeof log.value === 'number') return sum + log.value
      return sum + (log.completed ? targetValue : 0)
    }, 0)
    return Math.min(targetValue, val)
  }, [habit, dateLogs, targetValue])

  const currentTimerMinutes = useMemo(() => {
    if (habit.targetType !== 'timer') return 0
    const mins = dateLogs.reduce((sum, log) => {
      if (typeof log.durationSeconds === 'number') {
        return sum + Math.round(log.durationSeconds / 60)
      }
      if (typeof log.value === 'number') {
        return sum + log.value
      }
      return sum + (log.completed ? targetValue : 0)
    }, 0)
    return Math.min(targetValue, mins)
  }, [habit, dateLogs, targetValue])

  // Dynamic Stepper Configuration based on target number and unit!
  const stepConfig = useMemo(() => {
    if (habit.targetType === 'numeric') {
      return getDynamicStepConfig(targetValue, habit.unit)
    }
    if (habit.targetType === 'timer') {
      return getDynamicTimerConfig(targetValue)
    }
    return { primaryStep: 1, quickAddValues: [1] }
  }, [habit.targetType, targetValue, habit.unit])

  // Progress Dots calculation (up to 10 dots)
  const dotProgress = useMemo(() => {
    if (habit.targetType === 'numeric') {
      const totalDots = Math.min(10, Math.max(1, targetValue))
      const activeDots =
        targetValue <= 10
          ? Math.min(totalDots, Math.max(0, currentNumericValue))
          : Math.min(10, Math.round((currentNumericValue / targetValue) * 10))
      return { totalDots, activeDots, isRatio: targetValue > 10, target: targetValue }
    }
    if (habit.targetType === 'timer') {
      const totalDots = 10
      const activeDots = Math.min(10, Math.round((currentTimerMinutes / targetValue) * 10))
      return { totalDots, activeDots, isRatio: true, target: targetValue }
    }
    return null
  }, [habit, currentNumericValue, currentTimerMinutes, targetValue])

  const progressPercentage = useMemo(() => {
    if (habit.targetType === 'boolean') {
      return isCompletedToday ? 100 : 0
    }
    if (habit.targetType === 'numeric') {
      return Math.min(100, Math.round((currentNumericValue / targetValue) * 100))
    }
    if (habit.targetType === 'timer') {
      return Math.min(100, Math.round((currentTimerMinutes / targetValue) * 100))
    }
    return 0
  }, [habit.targetType, isCompletedToday, currentNumericValue, currentTimerMinutes, targetValue])

  const totalAllTimeCompletions = useMemo(() => {
    const dates = new Set(
      allLogs.filter((l) => l.habitId === habit.id && l.completed).map((l) => l.date)
    )
    return dates.size
  }, [allLogs, habit.id])

  // Action Handlers
  const handleToggleFavorite = () => {
    updateMutation.mutate({
      id: habit.id,
      updates: { pinned: !habit.pinned }
    })
  }

  const handleToggleBoolean = () => {
    if (!isCompletedToday) {
      fireConfetti({
        particleCount: 40,
        colors: [habit.color || '#0A7A64', '#10b981', '#f59e0b']
      })
    }
    toggleMutation.mutate({
      habitId: habit.id,
      date: selectedDate
    })
  }

  const handleNumericChange = (delta: number) => {
    const nextVal = Math.min(targetValue, Math.max(0, currentNumericValue + delta))
    if (nextVal >= targetValue && currentNumericValue < targetValue) {
      fireConfetti({
        particleCount: 40,
        colors: [habit.color || '#0A7A64', '#10b981', '#ec4899']
      })
    }
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextVal,
      completed: nextVal >= targetValue
    })
  }

  const handleTimerChange = (delta: number) => {
    const nextVal = Math.min(targetValue, Math.max(0, currentTimerMinutes + delta))
    if (nextVal >= targetValue && currentTimerMinutes < targetValue) {
      fireConfetti({
        particleCount: 40,
        colors: [habit.color || '#0A7A64', '#10b981', '#ec4899']
      })
    }
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: nextVal,
      completed: nextVal >= targetValue
    })
  }

  const handleSetExactValue = (val: number) => {
    const clampedVal = Math.min(targetValue, Math.max(0, val))
    if (clampedVal >= targetValue && currentNumericValue < targetValue) {
      fireConfetti({
        particleCount: 40,
        colors: [habit.color || '#0A7A64', '#10b981', '#ec4899']
      })
    }
    setValueMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      value: clampedVal,
      completed: clampedVal >= targetValue
    })
  }

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseFloat(directValueInput)
    if (!isNaN(parsed) && parsed >= 0) {
      if (habit.targetType === 'timer') {
        const clampedVal = Math.min(targetValue, parsed)
        if (clampedVal >= targetValue && currentTimerMinutes < targetValue) {
          fireConfetti({
            particleCount: 40,
            colors: [habit.color || '#0A7A64', '#10b981', '#ec4899']
          })
        }
        setValueMutation.mutate({
          habitId: habit.id,
          date: selectedDate,
          value: clampedVal,
          completed: clampedVal >= targetValue
        })
      } else {
        handleSetExactValue(parsed)
      }
    }
    setIsEditingDirect(false)
  }

  const handleToggleSlot = (intervalIndex: number) => {
    toggleMutation.mutate({
      habitId: habit.id,
      date: selectedDate,
      intervalIndex
    })
  }

  const handleArchive = () => {
    archiveMutation.mutate({
      id: habit.id,
      archived: !habit.archived
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(habit.id)
    setIsDeleteDialogOpen(false)
    onBack()
  }

  const HabitIcon = getHabitIconComponent(habit.icon, habit.title, habit.categoryId)
  const themeColor = habit.color || category?.color || '#0A7A64'
  const isDateToday = checkIsToday(parseISO(selectedDate))

  // Frequency string label
  const frequencyLabel = useMemo(() => {
    if (habit.frequencyType === 'daily') return 'Daily Habit'
    if (habit.frequencyType === 'weekly') return `${habit.targetCountPerWeek || 3}x / week`
    if (habit.frequencyType === 'custom_days') return 'Specific Days'
    if (habit.frequencyType === 'subday_interval')
      return `Every ${habit.intervalHours || 3}h (${habit.timeWindow?.startTime || '08:00'} - ${habit.timeWindow?.endTime || '20:00'})`
    if (habit.frequencyType === 'times_per_day') return `${habit.timesPerDay || 3} times daily`
    return 'Regular Habit'
  }, [habit])

  return (
    <div className="space-y-5 pb-8 animate-in fade-in-50 duration-200">
      {/* Top Navigation & Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Habits</span>
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleFavorite}
            className={cn(
              'h-8 text-xs gap-1.5 rounded-xl transition-all',
              habit.pinned && 'text-amber-500 border-amber-500/40 bg-amber-500/10'
            )}
            title={habit.pinned ? 'Unpin habit' : 'Pin to top'}
          >
            <Star className={cn('h-3.5 w-3.5', habit.pinned && 'fill-amber-500')} />
            <span className="hidden sm:inline">{habit.pinned ? 'Pinned' : 'Pin'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-8 text-xs gap-1.5 rounded-xl"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleArchive}
            className="h-8 text-xs gap-1.5 rounded-xl"
          >
            <Archive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{habit.archived ? 'Restore' : 'Archive'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-8 text-xs gap-1.5 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div
        className="relative overflow-hidden rounded-3xl border p-5 sm:p-6 shadow-sm transition-all"
        style={{
          background: `linear-gradient(135deg, ${themeColor}12 0%, var(--card) 60%)`
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            {/* Large Icon Box */}
            <div
              className="flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center rounded-3xl shadow-sm transition-transform"
              style={{
                backgroundColor: `${themeColor}22`,
                color: themeColor,
                border: `1.5px solid ${themeColor}35`
              }}
            >
              <HabitIcon className="h-8 w-8 sm:h-10 sm:w-10" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  {habit.title}
                </h1>
                {habit.pinned && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    <Star className="h-3 w-3 fill-current" />
                    <span>Pinned</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap text-xs">
                {category && (
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: `${category.color}15`,
                      borderColor: `${category.color}35`,
                      color: category.color
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{category.name}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border">
                  <Target className="h-3 w-3" />
                  <span>{frequencyLabel}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted/60 px-2.5 py-0.5 rounded-full border capitalize">
                  {habit.targetType === 'timer'
                    ? `${targetValue} min Timer`
                    : habit.targetType === 'numeric'
                      ? `${targetValue} ${habit.unit || 'units'} Target`
                      : 'Yes / No Check-in'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Check-in Giant Action Button */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              size="lg"
              onClick={() => {
                if (habit.targetType === 'numeric') {
                  if (isCompletedToday) {
                    handleSetExactValue(0)
                  } else {
                    handleSetExactValue(targetValue)
                  }
                } else if (habit.targetType === 'timer') {
                  if (isCompletedToday) {
                    handleTimerChange(-currentTimerMinutes)
                  } else {
                    handleTimerChange(targetValue - currentTimerMinutes)
                  }
                } else {
                  handleToggleBoolean()
                }
              }}
              className={cn(
                'h-11 sm:h-12 px-5 rounded-2xl font-semibold gap-2 transition-all active:scale-95 shadow-xs',
                isCompletedToday
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              <Check className="h-5 w-5 stroke-[2.5]" />
              <span>{isCompletedToday ? 'Completed' : 'Check In'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Streak and Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Current Streak */}
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Flame className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground">Current Streak</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-500">
                  {streakInfo.currentStreak}
                </span>
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Best Streak */}
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Trophy className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground">Best Streak</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-indigo-500">{streakInfo.bestStreak}</span>
                <span className="text-xs text-muted-foreground">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Completions */}
        <Card className="rounded-2xl border bg-card shadow-xs col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-medium text-muted-foreground">All-Time Total</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-foreground">
                  {totalAllTimeCompletions}
                </span>
                <span className="text-xs text-muted-foreground">check-ins</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Interactive Progress Tracker Card */}
      <Card className="rounded-2xl border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                {isDateToday
                  ? "Today's Progress"
                  : `Progress on ${format(parseISO(selectedDate), 'MMM d')}`}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-xs font-bold px-2.5 py-1 rounded-full border',
                  progressPercentage >= 100
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-muted text-foreground border-muted-foreground/20'
                )}
              >
                {progressPercentage}% Complete
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Numeric Target Progress Controls */}
          {habit.targetType === 'numeric' && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {isEditingDirect ? (
                    <form onSubmit={handleDirectSubmit} className="flex items-center gap-1.5">
                      <Input
                        type="number"
                        min="0"
                        value={directValueInput}
                        onChange={(e) => setDirectValueInput(e.target.value)}
                        className="h-8 w-24 text-sm px-2"
                        autoFocus
                      />
                      <Button type="submit" size="sm" className="h-8 px-2.5 text-xs font-medium">
                        Set
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={() => setIsEditingDirect(false)}
                      >
                        Cancel
                      </Button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDirectValueInput(`${currentNumericValue}`)
                        setIsEditingDirect(true)
                      }}
                      className="group flex items-center gap-1.5 hover:text-primary transition-colors text-left"
                      title="Click to edit value directly"
                    >
                      <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {currentNumericValue}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / {targetValue} {habit.unit || 'units'}
                      </span>
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                    </button>
                  )}
                </div>

                {/* Dynamic Stepper & Quick Add Chips (Proportional to the Target Number!) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNumericChange(-stepConfig.primaryStep)}
                    disabled={currentNumericValue <= 0}
                    className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                    title={`Subtract ${stepConfig.primaryStep}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                    <span>{stepConfig.primaryStep > 1 ? stepConfig.primaryStep : ''}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleNumericChange(stepConfig.primaryStep)}
                    className="h-8 px-2.5 text-xs font-semibold gap-1 rounded-lg"
                    title={`Add ${stepConfig.primaryStep}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{stepConfig.primaryStep > 1 ? stepConfig.primaryStep : ''}</span>
                  </Button>

                  {stepConfig.quickAddValues.map((val) => (
                    <Button
                      key={val}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleNumericChange(val)}
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                    >
                      +{val}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Visual Progress Dots (Max 10 dots, dynamic ratio) */}
              {dotProgress && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: dotProgress.totalDots }).map((_, idx) => {
                      const isFilled = idx < dotProgress.activeDots
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (!dotProgress.isRatio) {
                              handleSetExactValue(idx + 1)
                            } else {
                              const ratio = (idx + 1) / dotProgress.totalDots
                              handleSetExactValue(Math.round(ratio * targetValue))
                            }
                          }}
                          className={cn(
                            'h-3 flex-1 rounded-full transition-all hover:scale-105',
                            isFilled
                              ? 'shadow-xs'
                              : 'bg-muted-foreground/20 hover:bg-muted-foreground/30'
                          )}
                          style={{
                            backgroundColor: isFilled ? themeColor : undefined
                          }}
                          title={`Set progress to ${
                            dotProgress.isRatio
                              ? Math.round(((idx + 1) / dotProgress.totalDots) * targetValue)
                              : idx + 1
                          } ${habit.unit || 'units'}`}
                          aria-label={`Step ${idx + 1}`}
                        />
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Timer Habit Progress */}
          {habit.targetType === 'timer' && (
            <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDirectValueInput(`${currentTimerMinutes}`)
                      setIsEditingDirect(true)
                    }}
                    className="group flex items-center gap-1.5 hover:text-primary transition-colors text-left"
                    title="Click to edit timer minutes directly"
                  >
                    <span className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                      {currentTimerMinutes}
                    </span>
                    <span className="text-sm text-muted-foreground">/ {targetValue} min</span>
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary transition-colors" />
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {stepConfig.quickAddValues.map((mins) => (
                    <Button
                      key={mins}
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTimerChange(mins)}
                      className="h-8 px-2.5 text-xs font-semibold rounded-lg"
                    >
                      +{mins}m
                    </Button>
                  ))}
                </div>
              </div>

              {dotProgress && (
                <div className="flex items-center gap-1.5 pt-1">
                  {Array.from({ length: dotProgress.totalDots }).map((_, idx) => {
                    const isFilled = idx < dotProgress.activeDots
                    return (
                      <div
                        key={idx}
                        className={cn(
                          'h-3 flex-1 rounded-full transition-all',
                          isFilled ? 'shadow-xs' : 'bg-muted-foreground/20'
                        )}
                        style={{
                          backgroundColor: isFilled ? themeColor : undefined
                        }}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Boolean Habit Check-in Card */}
          {habit.targetType === 'boolean' && (
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-foreground">Daily Check-in</div>
                <div className="text-xs text-muted-foreground">
                  {isCompletedToday
                    ? 'Completed for this day'
                    : 'Mark as completed once done today'}
                </div>
              </div>
              <Button
                variant={isCompletedToday ? 'default' : 'outline'}
                onClick={handleToggleBoolean}
                className={cn(
                  'gap-1.5 rounded-xl font-semibold',
                  isCompletedToday && 'bg-emerald-600 hover:bg-emerald-700 text-white'
                )}
              >
                <Check className="h-4 w-4" />
                <span>{isCompletedToday ? 'Completed' : 'Mark Done'}</span>
              </Button>
            </div>
          )}

          {/* Sub-day Interval Slots if applicable */}
          {(habit.frequencyType === 'subday_interval' ||
            habit.frequencyType === 'times_per_day') && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium">Interval Checkpoints</span>
                <span>
                  {
                    slots.filter((slot) => {
                      const log = dateLogs.find((l) => l.intervalIndex === slot.index)
                      return log ? log.completed : false
                    }).length
                  }{' '}
                  / {slots.length} completed
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {slots.map((slot) => {
                  const log = dateLogs.find((l) => l.intervalIndex === slot.index)
                  const slotCompleted = log ? log.completed : false
                  return (
                    <Button
                      key={slot.index}
                      type="button"
                      size="sm"
                      variant={slotCompleted ? 'default' : 'outline'}
                      onClick={() => handleToggleSlot(slot.index)}
                      className={cn(
                        'h-8 px-3 text-xs font-medium rounded-xl gap-1.5 transition-all',
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
        </CardContent>
      </Card>

      {/* Focus Timer Section (Interactive for Timer Habits, or expandable for any habit) */}
      <HabitFocusTimer
        habit={habit}
        selectedDate={selectedDate}
        logs={dateLogs}
        onSessionComplete={() => {
          // Trigger queries refresh automatically handled by mutation
        }}
      />

      {/* About, Motivation & Reminder Times Timeline */}
      <Card className="rounded-2xl border bg-card shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            <span>About & Schedule Context</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Motivation Notes */}
          {(habit.motivationNotes || habit.description) && (
            <div className="rounded-xl border bg-muted/25 p-3.5 space-y-1">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Motivation & Notes</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {habit.motivationNotes || habit.description}
              </p>
            </div>
          )}

          {/* Scheduled Reminder Times Timeline */}
          {habit.reminderTimes && habit.reminderTimes.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Bell className="h-3.5 w-3.5 text-primary" />
                <span>Scheduled Daily Reminders</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {habit.reminderTimes.map((timeStr) => (
                  <span
                    key={timeStr}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20"
                  >
                    <Clock className="h-3 w-3" />
                    <span>{timeStr}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Frequency Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="rounded-xl border p-2.5 bg-background">
              <span className="text-[11px] text-muted-foreground block">Schedule</span>
              <span className="font-semibold text-foreground mt-0.5 block">{frequencyLabel}</span>
            </div>
            <div className="rounded-xl border p-2.5 bg-background">
              <span className="text-[11px] text-muted-foreground block">Target Type</span>
              <span className="font-semibold text-foreground mt-0.5 block capitalize">
                {habit.targetType}
              </span>
            </div>
            <div className="rounded-xl border p-2.5 bg-background col-span-2 sm:col-span-1">
              <span className="text-[11px] text-muted-foreground block">Status</span>
              <span className="font-semibold text-foreground mt-0.5 block">
                {habit.archived ? 'Archived' : 'Active Routine'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly History & Visual Calendar Component */}
      <HabitMonthlyCalendar habit={habit} logs={allLogs} onSelectDate={(d) => setSelectedDate(d)} />

      {/* Edit Habit Modal */}
      <HabitFormModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        habitToEdit={habit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete Habit</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">{habit.title}</strong>? All associated daily
              check-ins and streaks will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
