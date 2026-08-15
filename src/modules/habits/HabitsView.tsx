import { useState, useMemo } from 'react'
import {
  format,
  addDays,
  subDays,
  parseISO,
  isToday as checkIsToday,
  isSameDay
} from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Activity,
  BarChart3,
  Calendar as CalendarIcon,
  Archive,
  RotateCcw,
  Trash2
} from 'lucide-react'
import type { Habit } from './types'
import { DEFAULT_HABIT_CATEGORIES } from './constants'
import {
  useHabits,
  useHabitLogs,
  useHabitRangeLogs,
  useArchiveHabit,
  useDeleteHabit,
  useCreateHabit
} from './hooks/useHabits'
import { isHabitScheduledOnDate } from './utils/streakCalculator'
import { HabitCard } from './components/HabitCard'
import { HabitFormModal } from './components/HabitFormModal'
import { HabitAnalytics } from './components/HabitAnalytics'

export function HabitsView() {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  )
  const [viewMode, setViewMode] = useState<'tracker' | 'analytics'>('tracker')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showArchived, setShowArchived] = useState<boolean>(false)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null)
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCategory, setQuickCategory] = useState(DEFAULT_HABIT_CATEGORIES[0].id)

  const { data: habits = [], isLoading: habitsLoading } = useHabits(showArchived)
  const { data: currentLogs = [] } = useHabitLogs(selectedDate)

  const rangeStart = useMemo(() => {
    return format(subDays(new Date(), 90), 'yyyy-MM-dd')
  }, [])
  const rangeEnd = useMemo(() => {
    return format(addDays(new Date(), 1), 'yyyy-MM-dd')
  }, [])

  const { data: allRangeLogs = [] } = useHabitRangeLogs(rangeStart, rangeEnd)

  const createMutation = useCreateHabit()
  const archiveMutation = useArchiveHabit()
  const deleteMutation = useDeleteHabit()

  const selectedDateObj = useMemo(() => {
    return parseISO(selectedDate)
  }, [selectedDate])

  const isCurrentDateToday = useMemo(() => {
    return checkIsToday(selectedDateObj)
  }, [selectedDateObj])

  // Rolling 7-day strip centered on selected date
  const weekDays = useMemo(() => {
    return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
      const d = addDays(selectedDateObj, offset)
      return {
        dateStr: format(d, 'yyyy-MM-dd'),
        dateObj: d,
        dayName: format(d, 'EEE'),
        dayNum: format(d, 'd'),
        isToday: checkIsToday(d),
        isSelected: isSameDay(d, selectedDateObj)
      }
    })
  }, [selectedDateObj])

  const handlePrevDay = () => {
    setSelectedDate((prev) => format(subDays(parseISO(prev), 1), 'yyyy-MM-dd'))
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => format(addDays(parseISO(prev), 1), 'yyyy-MM-dd'))
  }

  const handleToday = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
  }

  const handleCreateNew = () => {
    setHabitToEdit(null)
    setIsFormOpen(true)
  }

  const handleEditHabit = (habit: Habit) => {
    setHabitToEdit(habit)
    setIsFormOpen(true)
  }

  const handleArchiveHabit = (habit: Habit) => {
    archiveMutation.mutate({
      id: habit.id,
      archived: !habit.archived
    })
  }

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit)
  }

  const confirmDelete = () => {
    if (habitToDelete) {
      deleteMutation.mutate(habitToDelete.id)
      setHabitToDelete(null)
    }
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = quickTitle.trim()
    if (!trimmed) return

    await createMutation.mutateAsync({
      title: trimmed,
      description: '',
      categoryId: quickCategory,
      frequencyType: 'daily',
      targetDaysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      targetType: 'boolean',
      targetValue: 1,
      color: DEFAULT_HABIT_CATEGORIES.find((c) => c.id === quickCategory)?.color || '#3b82f6',
      icon: 'Activity',
      archived: false
    })

    setQuickTitle('')
  }

  const filteredHabits = useMemo(() => {
    return habits.filter((habit) => {
      if (selectedCategory !== 'all' && habit.categoryId !== selectedCategory) {
        return false
      }
      if (
        searchQuery.trim() &&
        !habit.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !habit.description?.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }
      return true
    })
  }, [habits, selectedCategory, searchQuery])

  const scheduledHabits = useMemo(() => {
    return filteredHabits.filter((h) =>
      showArchived ? true : isHabitScheduledOnDate(h, selectedDate)
    )
  }, [filteredHabits, selectedDate, showArchived])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Habit Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Track daily check-ins, recurring sub-day intervals, and streak analytics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/30 p-1">
            <Button
              variant={viewMode === 'tracker' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setViewMode('tracker')}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Daily Tracker</span>
            </Button>
            <Button
              variant={viewMode === 'analytics' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs gap-1.5"
              onClick={() => setViewMode('analytics')}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Analytics</span>
            </Button>
          </div>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>New Habit</span>
          </Button>
        </div>
      </div>

      {viewMode === 'tracker' ? (
        <div className="space-y-5">
          {/* Quick-Add Bar */}
          <form onSubmit={handleQuickAdd} className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Input
                placeholder="Quick add a daily habit (press Enter)..."
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                className="h-10 text-sm"
              />
            </div>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="h-10 rounded-md border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {DEFAULT_HABIT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm" className="h-10 px-4 text-xs font-medium" disabled={!quickTitle.trim()}>
              Add Habit
            </Button>
          </form>

          {/* Date Navigation & Rolling Week Strip */}
          <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handlePrevDay}
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant={isCurrentDateToday ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs px-3"
                onClick={handleToday}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleNextDay}
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <div className="ml-2 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {format(selectedDateObj, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
            </div>

            {/* Rolling 7-day clickable buttons */}
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {weekDays.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[36px] h-10 px-1.5 rounded-md text-[11px] transition-all ${
                    d.isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-sm'
                      : d.isToday
                      ? 'border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-[10px] leading-tight opacity-80">{d.dayName}</span>
                  <span className="font-semibold leading-tight">{d.dayNum}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(e.target.value)
                  }
                }}
                className="h-8 w-36 text-xs"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                size="sm"
                className="h-8 text-xs shrink-0"
                onClick={() => setSelectedCategory('all')}
              >
                All Categories
              </Button>
              {DEFAULT_HABIT_CATEGORIES.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs shrink-0 gap-1.5"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              <Button
                variant={showArchived ? 'secondary' : 'outline'}
                size="sm"
                className="h-8 text-xs shrink-0 gap-1"
                onClick={() => setShowArchived(!showArchived)}
                title="Toggle archived habits"
              >
                <Archive className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Archived</span>
              </Button>
            </div>
          </div>

          {habitsLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading habits...
            </div>
          ) : scheduledHabits.length === 0 ? (
            <Card className="p-10 text-center">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {habits.length === 0
                    ? 'No habits created yet'
                    : 'No habits scheduled for this day'}
                </CardTitle>
                <CardDescription>
                  {habits.length === 0
                    ? 'Create your first daily, weekly, or sub-day recurring habit routine to get started.'
                    : 'Try changing the date, clearing search filters, or adding a new habit.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center gap-3">
                {habits.length === 0 ? (
                  <Button onClick={handleCreateNew} className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Create Your First Habit</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCategory('all')
                      setSearchQuery('')
                    }}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset Filters</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {scheduledHabits.map((habit) => {
                const habitLogs = currentLogs.filter((l) => l.habitId === habit.id)
                const habitHistoryLogs = allRangeLogs.filter(
                  (l) => l.habitId === habit.id
                )

                return (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    logs={habitLogs}
                    allLogs={habitHistoryLogs}
                    selectedDate={selectedDate}
                    onEdit={handleEditHabit}
                    onArchive={handleArchiveHabit}
                    onDelete={handleDeleteHabit}
                  />
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <HabitAnalytics habits={habits} logs={allRangeLogs} />
      )}

      <HabitFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        habitToEdit={habitToEdit}
      />

      {/* In-App Habit Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(habitToDelete)}
        onOpenChange={(open) => {
          if (!open) setHabitToDelete(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete Habit</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">{habitToDelete?.title}</strong>? All associated daily check-ins and streaks will be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setHabitToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete Habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
