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
import { cn } from '@/lib/utils'
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
import { isHabitScheduledOnDate, calculateStreak } from './utils/streakCalculator'
import { HabitCard } from './components/HabitCard'
import { HabitFormModal } from './components/HabitFormModal'
import { HabitAnalytics } from './components/HabitAnalytics'
import { HabitWeekOverview } from './components/HabitWeekOverview'

export function HabitsView() {
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  )
  const [viewMode, setViewMode] = useState<'tracker' | 'week' | 'analytics'>('tracker')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showArchived, setShowArchived] = useState<boolean>(false)
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false)
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null)
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickCategory, setQuickCategory] = useState(DEFAULT_HABIT_CATEGORIES[0].id)
  const [sortBy, setSortBy] = useState<'default' | 'streak' | 'name' | 'category'>('default')

  const [showQuickAdd, setShowQuickAdd] = useState(false)

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

  const handleDeleteHabit = (habit: Habit) => {
    setHabitToDelete(habit)
  }

  const confirmDelete = () => {
    if (habitToDelete) {
      deleteMutation.mutate(habitToDelete.id)
      setHabitToDelete(null)
    }
  }

  const handleArchiveHabit = (habit: Habit) => {
    archiveMutation.mutate({
      id: habit.id,
      archived: !habit.archived
    })
  }

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickTitle.trim()) return

    await createMutation.mutateAsync({
      title: quickTitle.trim(),
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
    setShowQuickAdd(false)
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
    const list = filteredHabits.filter((h) =>
      showArchived ? true : isHabitScheduledOnDate(h, selectedDate)
    )

    if (sortBy === 'name') {
      return [...list].sort((a, b) => a.title.localeCompare(b.title))
    }
    if (sortBy === 'streak') {
      return [...list].sort((a, b) => {
        const streakA = calculateStreak(a, allRangeLogs, selectedDate).currentStreak
        const streakB = calculateStreak(b, allRangeLogs, selectedDate).currentStreak
        return streakB - streakA
      })
    }
    if (sortBy === 'category') {
      return [...list].sort((a, b) => (a.categoryId || '').localeCompare(b.categoryId || ''))
    }
    return list
  }, [filteredHabits, selectedDate, showArchived, sortBy, allRangeLogs])

  // Quick summary metrics for overview cards
  const { maxBestStreak, avgConsistency, activeCount } = useMemo(() => {
    const active = habits.filter((h) => !h.archived)
    if (active.length === 0) {
      return { maxBestStreak: 0, avgConsistency: 0, activeCount: 0 }
    }
    const streaks = active.map((h) => calculateStreak(h, allRangeLogs, selectedDate))
    const maxStreak = Math.max(...streaks.map((s) => s.currentStreak || s.bestStreak || 0), 0)
    const sumConsistency = streaks.reduce((acc, s) => acc + (s.completionRate30Days || 0), 0)
    const avg = Math.round(sumConsistency / active.length)
    return {
      maxBestStreak: maxStreak,
      avgConsistency: avg,
      activeCount: active.length
    }
  }, [habits, allRangeLogs, selectedDate])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Controls: Segmented Tabs & Actions (No duplicate title banner) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border p-1 bg-muted/50 text-xs w-full sm:w-auto shadow-xs">
          <Button
            variant={viewMode === 'tracker' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs px-3 sm:px-4 gap-1.5 flex-1 sm:flex-initial rounded-lg font-medium"
            onClick={() => setViewMode('tracker')}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Daily</span>
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs px-3 sm:px-4 gap-1.5 flex-1 sm:flex-initial rounded-lg font-medium"
            onClick={() => setViewMode('week')}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Week</span>
          </Button>
          <Button
            variant={viewMode === 'analytics' ? 'default' : 'ghost'}
            size="sm"
            className="h-8 text-xs px-3 sm:px-4 gap-1.5 flex-1 sm:flex-initial rounded-lg font-medium"
            onClick={() => setViewMode('analytics')}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Analytics</span>
          </Button>
        </div>

        <Button
          size="sm"
          onClick={handleCreateNew}
          className="hidden sm:inline-flex h-9 gap-1.5 shadow-xs shrink-0 text-xs px-4 rounded-xl font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>New Habit</span>
        </Button>
      </div>

      {/* Metric Summary Cards (from mockups) */}
      {viewMode === 'tracker' && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
          <Card className="p-3 sm:p-4 rounded-2xl border bg-card/70 backdrop-blur shadow-xs">
            <div className="text-[11px] sm:text-xs font-medium text-muted-foreground">Best Streak</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{maxBestStreak}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">days</span>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 rounded-2xl border bg-card/70 backdrop-blur shadow-xs">
            <div className="text-[11px] sm:text-xs font-medium text-muted-foreground">Consistency</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{avgConsistency}%</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">30-day</span>
            </div>
          </Card>
          <Card className="p-3 sm:p-4 rounded-2xl border bg-card/70 backdrop-blur shadow-xs">
            <div className="text-[11px] sm:text-xs font-medium text-muted-foreground">Active</div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{activeCount}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">habits</span>
            </div>
          </Card>
        </div>
      )}

      {viewMode === 'tracker' ? (
        <div className="space-y-3 sm:space-y-5">
          {/* Historical Date Indicator Banner */}
          {!isCurrentDateToday && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-xs">
              <div className="flex items-center gap-2 text-xs">
                <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>
                  Viewing <strong>{format(selectedDateObj, 'EEE, MMM d, yyyy')}</strong>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
                className="h-7 text-xs bg-background hover:bg-background/90 border-amber-500/40 text-foreground shrink-0 self-start sm:self-auto font-medium"
              >
                Return to Today
              </Button>
            </div>
          )}

          {/* Quick-Add Bar (Collapsible on mobile) */}
          <div className="space-y-1.5">
            {!showQuickAdd && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQuickAdd(true)}
                className="sm:hidden w-full h-8 text-xs text-muted-foreground hover:text-foreground border-dashed gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Quick Add Habit</span>
              </Button>
            )}

            <form
              onSubmit={handleQuickAdd}
              className={cn('flex gap-1.5 sm:gap-2 items-center', !showQuickAdd && 'hidden sm:flex')}
            >
              <div className="relative flex-1 min-w-0">
                <Input
                  placeholder="Quick add daily habit..."
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="h-8 sm:h-9 text-xs sm:text-sm"
                  autoFocus={showQuickAdd}
                />
              </div>
              <select
                value={quickCategory}
                onChange={(e) => setQuickCategory(e.target.value)}
                className="h-8 sm:h-9 rounded-md border bg-background px-2 sm:px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring shrink-0 max-w-[120px] sm:max-w-[130px]"
              >
                {DEFAULT_HABIT_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                size="sm"
                className="h-8 sm:h-9 px-3 sm:px-4 text-xs font-medium shrink-0"
                disabled={!quickTitle.trim()}
              >
                Add
              </Button>
              {showQuickAdd && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickAdd(false)}
                  className="sm:hidden h-8 px-2 text-xs text-muted-foreground"
                >
                  Cancel
                </Button>
              )}
            </form>
          </div>

          {/* Date Navigation & Rolling Week Strip */}
          <div className="flex flex-col gap-2 rounded-xl border bg-card p-2.5 sm:p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-1.5">
              <div className="flex items-center gap-1">
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
                  className="h-8 text-xs px-2.5"
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
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <CalendarIcon className="h-3.5 w-3.5 text-primary" />
                <span>{format(selectedDateObj, 'MMM d, yyyy')}</span>
              </div>
            </div>

            {/* Rolling 7-day clickable buttons */}
            <div className="flex items-center justify-between sm:justify-center gap-1 overflow-x-auto py-0.5">
              {weekDays.map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`flex flex-col items-center justify-center flex-1 sm:flex-initial min-w-[32px] sm:min-w-[36px] h-9 sm:h-10 px-1 rounded-md text-[11px] transition-all ${
                    d.isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : d.isToday
                      ? 'border border-primary/40 text-primary bg-primary/5 hover:bg-primary/10'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] leading-tight opacity-80">{d.dayName}</span>
                  <span className="font-semibold leading-tight text-xs">{d.dayNum}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
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

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search habits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {/* Sort selector */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-8 rounded-md border bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Sort habits"
              >
                <option value="default">Default Order</option>
                <option value="streak">Highest Streak</option>
                <option value="name">Name (A-Z)</option>
                <option value="category">Category</option>
              </select>

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
      ) : viewMode === 'week' ? (
        <div className="space-y-4">
          {/* Category & Search filter for Week Overview */}
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
              <div className="relative flex-1 sm:w-48">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter habits..."
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

          <HabitWeekOverview
            habits={filteredHabits}
            logs={allRangeLogs}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onEditHabit={handleEditHabit}
          />
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
