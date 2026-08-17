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
  Info,
  MoreVertical,
  Shield,
  Layers,
  CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
import {
  calculateStreak,
  isHabitCompletedOnDate,
  isHabitFrozenOnDate,
  isHabitRestDayOnDate
} from '../utils/streakCalculator'
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
import { useHashRoute } from '@/core/router/hashRouter'
import { MarkdownRenderer } from '@/modules/notes/utils/markdownParser'
import { MarkdownEditor } from '@/modules/notes/components/MarkdownEditor'
import { useNotes, useCreateNote, useUpdateNote } from '@/modules/notes/hooks/useNotes'
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/modules/notes/types'
import { FileText, ExternalLink } from 'lucide-react'

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

  const { navigate } = useHashRoute()
  const { data: allNotes = [] } = useNotes()
  const [activeEditingNote, setActiveEditingNote] = useState<Note | null>(null)

  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()

  const handleSaveNote = async (
    noteData: CreateNoteInput | { id: string; input: UpdateNoteInput }
  ): Promise<Note | void> => {
    if ('id' in noteData) {
      await updateNoteMutation.mutateAsync(noteData)
    } else {
      const created = await createNoteMutation.mutateAsync(noteData)
      return created
    }
  }

  const handleCreateConnectedNote = async () => {
    const newNote = await createNoteMutation.mutateAsync({
      title: `Reflection: ${habit.title}`,
      content: `# Reflection: ${habit.title}\n\nHabit: #[${habit.title}](habit:${habit.id})\n\n- Date: ${selectedDate}\n\n### Observations & Notes\n`,
      linkedHabitId: habit.id,
      tags: []
    })
    setActiveEditingNote(newNote)
  }

  // Connected Notes: notes linked to, referencing or tagged with this habit
  const connectedNotes = useMemo(() => {
    const habitTitleLower = habit.title.trim().toLowerCase()
    const habitTag = `habit-${habit.id}`.toLowerCase()

    return allNotes.filter((note) => {
      // 1. First-class linkedHabitId
      if (note.linkedHabitId === habit.id) return true
      // 2. Explicit habit tag
      if (note.tags?.some((t) => t.toLowerCase() === habitTag)) return true
      // 3. Explicit habit ID reference in content
      if (note.content.includes(habit.id)) return true
      // 4. Mention by title
      if (
        habitTitleLower.length >= 3 &&
        (note.content.toLowerCase().includes(`#[${habitTitleLower}]`) ||
          note.title.toLowerCase() === `habit log: ${habitTitleLower}`)
      ) {
        return true
      }
      return false
    })
  }, [allNotes, habit.id, habit.title])

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

  const isSelectedDateFrozen = useMemo(() => {
    return isHabitFrozenOnDate(habit, selectedDate)
  }, [habit, selectedDate])

  const isSelectedDateRest = useMemo(() => {
    return isHabitRestDayOnDate(habit, selectedDate)
  }, [habit, selectedDate])

  const handleToggleFreezeDate = (dateToToggle: string) => {
    const existing = habit.frozenDates || []
    const isFrozen = existing.includes(dateToToggle)
    const updatedFrozen = isFrozen
      ? existing.filter((d) => d !== dateToToggle)
      : [...existing, dateToToggle].sort()

    updateMutation.mutate({
      id: habit.id,
      updates: { frozenDates: updatedFrozen }
    })
  }

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

  // Active Note Editor/Preview View
  if (activeEditingNote) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto pb-10 animate-in fade-in-50 duration-200">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveEditingNote(null)}
            className="h-8 px-2 sm:px-3 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-1 rounded-xl font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Habit ({habit.title})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/notes', { noteId: activeEditingNote.id })}
            className="h-8 px-3 text-xs gap-1.5 rounded-xl font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Notes</span>
          </Button>
        </div>

        <MarkdownEditor
          initialNote={activeEditingNote}
          onSave={handleSaveNote}
          onClose={() => setActiveEditingNote(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-8 animate-in fade-in-50 duration-200">
      {/* Top Navigation & Actions Bar */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2 sm:px-3 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-1 rounded-xl"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Habits</span>
        </Button>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="px-3 h-8 text-xs gap-1.5 rounded-xl font-medium"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl"
                aria-label="More habit actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleToggleFavorite} className="gap-2 cursor-pointer">
                <Star className={cn('h-4 w-4', habit.pinned && 'fill-current text-amber-500')} />
                <span>{habit.pinned ? 'Unpin Habit' : 'Pin to Top'}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleArchive} className="gap-2 cursor-pointer">
                <Archive className="h-4 w-4" />
                <span>{habit.archived ? 'Restore Habit' : 'Archive Habit'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Habit</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Hero Header Card with Integrated Streak Metrics */}
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-5 shadow-xs transition-all space-y-3.5"
        style={{
          background: `linear-gradient(135deg, ${themeColor}12 0%, var(--card) 60%)`
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon Box */}
            <div
              className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl shadow-xs transition-transform"
              style={{
                backgroundColor: `${themeColor}22`,
                color: themeColor,
                border: `1.5px solid ${themeColor}35`
              }}
            >
              <HabitIcon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {habit.title}
                </h1>
                {habit.pinned && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded">
                    <Star className="h-2.5 w-2.5 fill-current" />
                    <span>Pinned</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap text-[11px] sm:text-xs">
                {category && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full border"
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

                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border">
                  <Target className="h-3 w-3" />
                  <span>{frequencyLabel}</span>
                </span>

                <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border capitalize">
                  {habit.targetType === 'timer'
                    ? `${targetValue} min Timer`
                    : habit.targetType === 'numeric'
                      ? `${targetValue} ${habit.unit || 'units'} Target`
                      : 'Yes / No Check-in'}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Check-in Action Button (For boolean or quick toggle) */}
          <div className="flex items-center justify-end sm:justify-start">
            <Button
              size="sm"
              variant={isCompletedToday ? 'outline' : 'default'}
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
                'h-9 sm:h-10 px-4 sm:px-5 rounded-xl font-semibold gap-1.5 text-xs sm:text-sm transition-all active:scale-95 shadow-xs w-full sm:w-auto',
                isCompletedToday
                  ? 'border-emerald-600/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:text-emerald-400 bg-background'
                  : 'bg-primary text-primary-foreground'
              )}
            >
              <Check className="h-4 w-4 stroke-[2.5]" />
              <span>{isCompletedToday ? 'Completed' : 'Check In'}</span>
            </Button>
          </div>
        </div>

        {/* Integrated Streak & Stats Strip (Single clean segmented bar) */}
        <div className="grid grid-cols-3 divide-x divide-border/60 rounded-xl bg-background/60 border py-2 px-1 text-center">
          <div className="px-1">
            <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
              Current Streak
            </div>
            <div className="text-sm sm:text-lg font-bold text-amber-500 flex items-center justify-center gap-1 mt-0.5">
              <Flame className="h-3.5 w-3.5" />
              <span>{streakInfo.currentStreak} days</span>
            </div>
          </div>
          <div className="px-1">
            <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
              Best Streak
            </div>
            <div className="text-sm sm:text-lg font-bold text-indigo-500 flex items-center justify-center gap-1 mt-0.5">
              <Trophy className="h-3.5 w-3.5" />
              <span>{streakInfo.bestStreak} days</span>
            </div>
          </div>
          <div className="px-1">
            <div className="text-[10px] sm:text-[11px] font-medium text-muted-foreground truncate">
              All-Time Total
            </div>
            <div className="text-sm sm:text-lg font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              <span>{totalAllTimeCompletions} check-ins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Numeric Target Progress Workspace (Only for numeric habits) */}
      {habit.targetType === 'numeric' && (
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                {isDateToday
                  ? "Today's Progress"
                  : `Progress on ${format(parseISO(selectedDate), 'MMM d')}`}
              </CardTitle>
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
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isEditingDirect ? (
                  <form onSubmit={handleDirectSubmit} className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      min="0"
                      value={directValueInput}
                      onChange={(e) => setDirectValueInput(e.target.value)}
                      className="h-8 w-24 text-sm px-2 font-semibold"
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
          </CardContent>
        </Card>
      )}

      {/* Sub-day Interval Slots if applicable */}
      {(habit.frequencyType === 'subday_interval' || habit.frequencyType === 'times_per_day') && (
        <Card className="rounded-2xl border bg-card shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Interval Checkpoints</span>
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
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {/* Focus Timer Section (Only for Duration/Timer Habits) */}
      {habit.targetType === 'timer' && (
        <HabitFocusTimer
          habit={habit}
          selectedDate={selectedDate}
          logs={dateLogs}
          onSessionComplete={() => {
            // Trigger queries refresh automatically handled by mutation
          }}
        />
      )}

      {/* Streak Protection, Rest Days & Routine Stacking */}
      <div className="rounded-2xl border bg-card/60 p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span>Streak Protection & Planned Rest</span>
          </div>
          {isSelectedDateFrozen ? (
            <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Streak Frozen on {selectedDate}
            </span>
          ) : isSelectedDateRest ? (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Planned Rest Day
            </span>
          ) : null}
        </div>

        {/* Freeze / Unfreeze Action for Selected Date */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border flex-wrap">
          <div className="space-y-0.5 min-w-0">
            <div className="text-xs font-medium text-foreground">
              {isSelectedDateFrozen
                ? 'Streak is currently frozen'
                : 'Need a freeze for illness or travel?'}
            </div>
            <div className="text-[11px] text-muted-foreground">
              {isSelectedDateFrozen
                ? `Streak calculations preserve your streak on ${selectedDate}.`
                : `Freeze your streak on ${selectedDate} without resetting consecutive count.`}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant={isSelectedDateFrozen ? 'outline' : 'secondary'}
            onClick={() => handleToggleFreezeDate(selectedDate)}
            className={cn(
              'h-7 text-xs rounded-lg px-3 shrink-0',
              isSelectedDateFrozen && 'text-destructive hover:bg-destructive/10'
            )}
          >
            {isSelectedDateFrozen ? 'Unfreeze Date' : 'Freeze This Day'}
          </Button>
        </div>

        {/* Frozen Dates List */}
        {habit.frozenDates && habit.frozenDates.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Active Streak Freezes:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {habit.frozenDates.map((fDate) => (
                <span
                  key={fDate}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20"
                >
                  <CalendarDays className="h-3 w-3" />
                  <span>{fDate}</span>
                  <button
                    type="button"
                    onClick={() => handleToggleFreezeDate(fDate)}
                    className="hover:text-destructive transition-colors ml-0.5"
                    title={`Unfreeze ${fDate}`}
                    aria-label={`Unfreeze ${fDate}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Planned Rest Days Pills */}
        {habit.restDays && habit.restDays.length > 0 && (
          <div className="space-y-1 pt-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Configured Planned Rest Days:
            </label>
            <div className="flex items-center gap-1 flex-wrap">
              {habit.restDays.map((d) => {
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                return (
                  <span
                    key={d}
                    className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                  >
                    {dayNames[d]}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        {/* Routine Stacking Info */}
        {habit.routineName && (
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-foreground truncate">
                  {habit.routineName}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Step {habit.routineOrder || 1} in routine sequence stack
                </div>
              </div>
            </div>
            <span className="text-[11px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">
              Chain Step #{habit.routineOrder || 1}
            </span>
          </div>
        )}
      </div>

      {/* About, Motivation & Reminder Times Timeline */}
      <div className="rounded-2xl border bg-card/60 p-3.5 sm:p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Info className="h-3.5 w-3.5 text-primary" />
            <span>About & Schedule Context</span>
          </div>
          <span className="text-[11px] font-medium text-muted-foreground">
            {habit.archived ? 'Archived' : 'Active Routine'}
          </span>
        </div>

        {/* Motivation Notes */}
        {(habit.motivationNotes || habit.description) && (
          <div className="rounded-xl border bg-muted/20 p-2.5 sm:p-3 space-y-1">
            <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>Motivation</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {habit.motivationNotes || habit.description}
            </p>
          </div>
        )}

        {/* Scheduled Reminder Times Timeline & Smart Recalculation Status */}
        {habit.reminderTimes && habit.reminderTimes.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-1">
                <Bell className="h-3 w-3 text-primary" />
                <span>Scheduled Notifications:</span>
              </div>
              {isCompletedToday && isDateToday && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Target completed (today's remaining reminders silenced)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {habit.reminderTimes.map((timeStr) => (
                <span
                  key={timeStr}
                  className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border transition-colors',
                    isCompletedToday && isDateToday
                      ? 'bg-muted text-muted-foreground border-border/50 line-through opacity-70'
                      : 'bg-primary/10 text-primary border-primary/20'
                  )}
                >
                  <Clock className="h-2.5 w-2.5" />
                  <span>{timeStr}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Compact Metadata Row */}
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-1 border-t border-border/50 flex-wrap">
          <span>
            Schedule: <strong className="text-foreground font-medium">{frequencyLabel}</strong>
          </span>
          <span className="capitalize">
            Target: <strong className="text-foreground font-medium">{habit.targetType}</strong>
          </span>
          <span>
            Status:{' '}
            <strong className="text-foreground font-medium">
              {habit.archived ? 'Archived' : 'Active Routine'}
            </strong>
          </span>
        </div>
      </div>

      {/* Monthly History & Visual Calendar Component */}
      <HabitMonthlyCalendar
        habit={habit}
        logs={allLogs.filter((l) => l.habitId === habit.id)}
        onSelectDate={(d) => setSelectedDate(d)}
      />

      {/* Linked Notes & Reflections Card */}
      <Card className="rounded-2xl border-border/60 shadow-xs">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            <span>Linked Notes & Reflections</span>
            {connectedNotes.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal">
                ({connectedNotes.length})
              </span>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateConnectedNote}
            className="h-7 text-xs px-2.5 gap-1 rounded-lg"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Reflection</span>
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {connectedNotes.length === 0 ? (
            <div className="text-center py-6 text-xs text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/60">
              <p>No notes or reflections linked to this habit yet.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateConnectedNote}
                className="mt-2 h-7 text-xs text-primary hover:text-primary/80"
              >
                + Write Daily Reflection
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {connectedNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setActiveEditingNote(note)}
                  className="group flex items-start justify-between gap-3 p-3 rounded-xl border bg-card/50 hover:bg-muted/30 hover:border-primary/40 cursor-pointer transition-all"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-medium text-xs sm:text-sm text-foreground truncate group-hover:text-primary transition-colors">
                        {note.title || 'Untitled Note'}
                      </h4>
                      {note.tags && note.tags.length > 0 && (
                        <div className="hidden sm:flex items-center gap-1">
                          {note.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {note.content && (
                      <div className="text-xs text-muted-foreground line-clamp-1 pointer-events-none">
                        <MarkdownRenderer
                          content={note.content}
                          className="text-xs space-y-0 [&_h1]:text-xs [&_h2]:text-xs [&_p]:text-xs line-clamp-1"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0 pt-0.5">
                    <span>{note.updatedAt ? format(parseISO(note.updatedAt), 'MMM d') : ''}</span>
                    <ChevronLeft className="h-3.5 w-3.5 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
