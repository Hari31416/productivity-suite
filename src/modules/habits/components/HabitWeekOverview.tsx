import { useState, useMemo } from 'react'
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  parseISO,
  isToday as checkIsToday
} from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Activity,
  BarChart3,
  Flame
} from 'lucide-react'
import type { Habit, HabitLog } from '../types'
import { DEFAULT_HABIT_CATEGORIES, getHabitIconComponent } from '../constants'
import { isHabitCompletedOnDate, isHabitScheduledOnDate } from '../utils/streakCalculator'
import { useToggleHabitLog, useSetHabitLogValue } from '../hooks/useHabits'
import { fireConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'

interface HabitWeekOverviewProps {
  habits: Habit[]
  logs: HabitLog[]
  selectedDate: string
  onSelectDate: (date: string) => void
  onEditHabit?: (habit: Habit) => void
}

export function HabitWeekOverview({
  habits,
  logs,
  selectedDate,
  onSelectDate,
  onEditHabit
}: HabitWeekOverviewProps) {
  const [subView, setSubView] = useState<'matrix' | 'chart'>('matrix')
  const [weekReferenceDate, setWeekReferenceDate] = useState<Date>(() => {
    return selectedDate ? parseISO(selectedDate) : new Date()
  })

  const toggleMutation = useToggleHabitLog()
  const setValueMutation = useSetHabitLogValue()

  // Calculate 7-day interval starting from Monday of the referenced week
  const weekStart = useMemo(() => {
    return startOfWeek(weekReferenceDate, { weekStartsOn: 1 })
  }, [weekReferenceDate])

  const weekEnd = useMemo(() => {
    return endOfWeek(weekReferenceDate, { weekStartsOn: 1 })
  }, [weekReferenceDate])

  const weekDays = useMemo(() => {
    return eachDayOfInterval({ start: weekStart, end: weekEnd })
  }, [weekStart, weekEnd])

  const activeHabits = useMemo(() => {
    return habits.filter((h) => !h.archived)
  }, [habits])

  // Group logs by date string
  const logsByDateMap = useMemo(() => {
    const map = new Map<string, HabitLog[]>()
    for (const log of logs) {
      const existing = map.get(log.date) || []
      existing.push(log)
      map.set(log.date, existing)
    }
    return map
  }, [logs])

  const handlePrevWeek = () => {
    setWeekReferenceDate((prev) => subDays(prev, 7))
  }

  const handleNextWeek = () => {
    setWeekReferenceDate((prev) => addDays(prev, 7))
  }

  const handleCurrentWeek = () => {
    const today = new Date()
    setWeekReferenceDate(today)
    onSelectDate(format(today, 'yyyy-MM-dd'))
  }

  // Handle cell click / check toggle
  const handleCellToggle = (habit: Habit, dateStr: string) => {
    const dateLogs = logsByDateMap.get(dateStr) || []
    const habitLogs = dateLogs.filter((l) => l.habitId === habit.id)
    const isCompleted = isHabitCompletedOnDate(habit, habitLogs)

    if (habit.targetType === 'numeric') {
      const target = habit.targetValue || 1
      const nextValue = isCompleted ? 0 : target
      if (!isCompleted) {
        fireConfetti({
          particleCount: 30,
          colors: [habit.color || '#3b82f6', '#10b981', '#f59e0b']
        })
      }
      setValueMutation.mutate({
        habitId: habit.id,
        date: dateStr,
        value: nextValue,
        completed: nextValue >= target
      })
      return
    }

    if (habit.targetType === 'timer') {
      const targetSeconds = (habit.targetValue || 15) * 60
      const nextSeconds = isCompleted ? 0 : targetSeconds
      if (!isCompleted) {
        fireConfetti({
          particleCount: 30,
          colors: [habit.color || '#3b82f6', '#10b981', '#ec4899']
        })
      }
      setValueMutation.mutate({
        habitId: habit.id,
        date: dateStr,
        value: nextSeconds,
        completed: nextSeconds >= targetSeconds
      })
      return
    }

    if (!isCompleted) {
      fireConfetti({
        particleCount: 30,
        colors: [habit.color || '#3b82f6', '#10b981', '#38bdf8']
      })
    }

    toggleMutation.mutate({
      habitId: habit.id,
      date: dateStr
    })
  }

  // Compute daily stats for each day in week
  const dayRows = useMemo(() => {
    return weekDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dateLogs = logsByDateMap.get(dateStr) || []
      const isToday = checkIsToday(day)
      const isSelected = selectedDate === dateStr

      let scheduledCount = 0
      let completedCount = 0

      const habitStatuses = activeHabits.map((habit) => {
        const habitLogs = dateLogs.filter((l) => l.habitId === habit.id)
        const isScheduled = isHabitScheduledOnDate(habit, dateStr)
        const isCompleted = isHabitCompletedOnDate(habit, habitLogs)

        if (isScheduled) {
          scheduledCount += 1
          if (isCompleted) {
            completedCount += 1
          }
        } else if (isCompleted) {
          // If completed even though not strictly scheduled, count toward completions
          completedCount += 1
        }

        return {
          habit,
          isScheduled,
          isCompleted
        }
      })

      const percentage =
        scheduledCount > 0
          ? Math.round((completedCount / scheduledCount) * 100)
          : activeHabits.length > 0
            ? Math.round((completedCount / activeHabits.length) * 100)
            : 0

      return {
        date: day,
        dateStr,
        formattedFull: format(day, 'MMMM d, yyyy'),
        dayName: format(day, 'EEEE'),
        shortDay: format(day, 'EEE'),
        isToday,
        isSelected,
        scheduledCount,
        completedCount,
        percentage,
        habitStatuses
      }
    })
  }, [weekDays, logsByDateMap, activeHabits, selectedDate])

  // Compute column averages / summaries across the week
  const habitColumnAverages = useMemo(() => {
    return activeHabits.map((habit) => {
      let daysScheduled = 0
      let daysCompleted = 0

      for (const day of weekDays) {
        const dateStr = format(day, 'yyyy-MM-dd')
        const dateLogs = logsByDateMap.get(dateStr) || []
        const habitLogs = dateLogs.filter((l) => l.habitId === habit.id)
        const isScheduled = isHabitScheduledOnDate(habit, dateStr)
        const isCompleted = isHabitCompletedOnDate(habit, habitLogs)

        if (isScheduled) daysScheduled += 1
        if (isCompleted) daysCompleted += 1
      }

      const rate = daysScheduled > 0 ? Math.round((daysCompleted / daysScheduled) * 100) : 0

      return {
        habitId: habit.id,
        daysScheduled,
        daysCompleted,
        rate
      }
    })
  }, [activeHabits, weekDays, logsByDateMap])

  // Total average across the week
  const overallWeekAverage = useMemo(() => {
    if (dayRows.length === 0) return 0
    const sum = dayRows.reduce((acc, row) => acc + row.percentage, 0)
    return Math.round(sum / dayRows.length)
  }, [dayRows])

  // Chart data
  const chartData = useMemo(() => {
    return dayRows.map((row) => ({
      name: `${row.shortDay} ${format(row.date, 'd')}`,
      fullDate: row.formattedFull,
      percentage: row.percentage,
      completed: row.completedCount,
      scheduled: row.scheduledCount
    }))
  }, [dayRows])

  if (activeHabits.length === 0) {
    return (
      <Card className="p-10 text-center">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">No habits available</CardTitle>
          <CardDescription>
            Create your habits first to view and log them in the Week Overview matrix.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Subheader & Sub-view Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/30 p-1">
            <Button
              variant={subView === 'matrix' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs gap-1.5 font-medium"
              onClick={() => setSubView('matrix')}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Log Habits</span>
            </Button>
            <Button
              variant={subView === 'chart' ? 'default' : 'ghost'}
              size="sm"
              className="h-8 text-xs gap-1.5 font-medium"
              onClick={() => setSubView('chart')}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Weekly Progress Chart</span>
            </Button>
          </div>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handlePrevWeek}
            aria-label="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-3"
            onClick={handleCurrentWeek}
          >
            This Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={handleNextWeek}
            aria-label="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground sm:text-sm">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="text-foreground">
              {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}
            </span>
          </div>
        </div>
      </div>

      {subView === 'matrix' ? (
        <>
          {/* Mobile Day-by-Day Card View (< md) */}
          <div className="md:hidden space-y-3">
            {dayRows.map((row) => (
              <div
                key={row.dateStr}
                className={cn(
                  'rounded-xl border bg-card p-3 shadow-xs space-y-2.5 transition-all',
                  row.isToday && 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      onClick={() => onSelectDate(row.dateStr)}
                      className={cn(
                        'font-semibold text-xs cursor-pointer hover:underline',
                        row.isToday ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {row.formattedFull}
                    </span>
                    {row.isToday && (
                      <Badge
                        variant="secondary"
                        className="h-4 px-1.5 text-[9px] bg-primary/20 text-primary font-semibold"
                      >
                        Today
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-muted-foreground text-[11px]">
                      {row.completedCount}/{row.scheduledCount}
                    </span>
                    <span className="text-primary">{row.percentage}%</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full transition-all duration-300 rounded-full',
                      row.percentage === 100 ? 'bg-emerald-500' : 'bg-primary'
                    )}
                    style={{ width: `${row.percentage}%` }}
                  />
                </div>

                {/* Habit chips grid */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {row.habitStatuses.map(({ habit, isScheduled, isCompleted }) => {
                    if (!isScheduled) return null
                    return (
                      <button
                        key={habit.id}
                        type="button"
                        onClick={() => handleCellToggle(habit, row.dateStr)}
                        className={cn(
                          'flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all',
                          isCompleted
                            ? 'bg-primary text-primary-foreground border-primary shadow-2xs font-semibold'
                            : 'bg-muted/50 text-muted-foreground border-border hover:text-foreground'
                        )}
                      >
                        {isCompleted && <Check className="h-3 w-3" />}
                        <span className="truncate max-w-[100px]">{habit.title}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Matrix Grid Container (>= md) */}
          <div className="hidden md:block rounded-xl border bg-card text-card-foreground shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-xs font-medium text-muted-foreground">
                    {/* Date Column */}
                    <th className="py-3 px-4 min-w-[160px] font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span>Date</span>
                      </div>
                    </th>

                    {/* Daily Progress Bar Column */}
                    <th className="py-3 px-4 min-w-[180px] font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-muted-foreground" />
                        <span>Progress Bar</span>
                      </div>
                    </th>

                    {/* One column per habit */}
                    {activeHabits.map((habit) => {
                      const IconComponent = getHabitIconComponent(
                        habit.icon,
                        habit.title,
                        habit.categoryId
                      )
                      const category = DEFAULT_HABIT_CATEGORIES.find(
                        (c) => c.id === habit.categoryId
                      )

                      return (
                        <th
                          key={habit.id}
                          className="py-3 px-3 text-center min-w-[56px] max-w-[90px] group cursor-pointer hover:bg-muted/60 transition-colors"
                          onClick={() => onEditHabit?.(habit)}
                          title={`${habit.title} (${category?.name || 'General'})\nClick to view/edit habit`}
                        >
                          <div className="flex flex-col items-center justify-center gap-1">
                            <div
                              className="flex h-7 w-7 items-center justify-center rounded-lg border shadow-2xs transition-transform group-hover:scale-110"
                              style={{
                                backgroundColor: `${habit.color}15`,
                                borderColor: `${habit.color}40`,
                                color: habit.color
                              }}
                            >
                              <IconComponent className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-[11px] font-medium text-foreground truncate max-w-[75px] block">
                              {habit.title}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {dayRows.map((row) => (
                    <tr
                      key={row.dateStr}
                      className={cn(
                        'transition-colors hover:bg-muted/30',
                        row.isToday && 'bg-primary/5 font-medium'
                      )}
                    >
                      {/* Date Cell */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onSelectDate(row.dateStr)}
                            className={cn(
                              'cursor-pointer hover:underline text-xs sm:text-sm',
                              row.isToday ? 'font-bold text-primary' : 'text-foreground'
                            )}
                          >
                            {row.formattedFull}
                          </span>
                          {row.isToday && (
                            <Badge
                              variant="secondary"
                              className="h-4 px-1.5 text-[10px] bg-primary/20 text-primary border-primary/30 font-semibold"
                            >
                              Today
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Progress Bar Cell */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-3 w-full max-w-[130px] overflow-hidden rounded-full bg-muted border">
                            <div
                              className={cn(
                                'h-full transition-all duration-300 rounded-full',
                                row.percentage === 100
                                  ? 'bg-emerald-500'
                                  : row.percentage >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-primary/70'
                              )}
                              style={{ width: `${row.percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums min-w-[36px]">
                            {row.percentage}%
                          </span>
                        </div>
                      </td>

                      {/* Checkbox cell for each habit */}
                      {row.habitStatuses.map(({ habit, isScheduled, isCompleted }) => {
                        return (
                          <td key={habit.id} className="py-3.5 px-3 text-center align-middle">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => handleCellToggle(habit, row.dateStr)}
                                aria-label={`Mark ${habit.title} on ${row.formattedFull}`}
                                className={cn(
                                  'h-6 w-6 rounded-md border flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 cursor-pointer',
                                  isCompleted
                                    ? 'border-transparent shadow-xs scale-105'
                                    : isScheduled
                                      ? 'border-muted-foreground/30 bg-background hover:border-primary hover:bg-muted/50'
                                      : 'border-muted-foreground/15 bg-muted/20 opacity-40 hover:opacity-100 hover:border-muted-foreground/40'
                                )}
                                style={
                                  isCompleted
                                    ? {
                                        backgroundColor: habit.color || '#3b82f6',
                                        color: '#ffffff'
                                      }
                                    : undefined
                                }
                                title={`${habit.title} on ${row.formattedFull}: ${
                                  isCompleted
                                    ? 'Completed'
                                    : isScheduled
                                      ? 'Pending'
                                      : 'Not scheduled'
                                }`}
                              >
                                {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>

                {/* Bottom Summary / Average Row */}
                <tfoot>
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold text-xs text-muted-foreground">
                    <td className="py-3.5 px-4 uppercase tracking-wider text-[11px] font-bold text-foreground">
                      AVERAGE / TOTAL
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-2.5 w-full max-w-[130px] overflow-hidden rounded-full bg-muted border">
                          <div
                            className="h-full bg-emerald-500 transition-all rounded-full"
                            style={{ width: `${overallWeekAverage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground tabular-nums min-w-[36px]">
                          {overallWeekAverage}%
                        </span>
                      </div>
                    </td>
                    {habitColumnAverages.map((col) => (
                      <td
                        key={col.habitId}
                        className="py-3.5 px-3 text-center text-xs font-bold text-foreground"
                      >
                        <div className="flex flex-col items-center">
                          <span className="tabular-nums">{col.daysCompleted}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">
                            {col.rate}%
                          </span>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Weekly Progress Chart Sub-view */
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span>
                  Daily Completion Trend ({format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')})
                </span>
              </CardTitle>
              <CardDescription>
                Percentage of scheduled habits achieved each day across the week.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      className="stroke-muted"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      className="text-xs text-muted-foreground"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                      tickLine={false}
                      axisLine={false}
                      className="text-xs text-muted-foreground"
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-popover p-2.5 text-xs shadow-md">
                            <p className="font-semibold text-popover-foreground">{data.fullDate}</p>
                            <p className="text-primary mt-1">
                              Completion Rate: <span className="font-bold">{data.percentage}%</span>
                            </p>
                            <p className="text-muted-foreground text-[11px]">
                              {data.completed} of {data.scheduled} habits completed
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Bar
                      dataKey="percentage"
                      radius={[6, 6, 0, 0]}
                      className="transition-all duration-300"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.percentage === 100
                              ? '#10b981'
                              : entry.percentage >= 50
                                ? '#3b82f6'
                                : '#64748b'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary Metrics Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-500" />
                <span>Week Performance</span>
              </CardTitle>
              <CardDescription>Summary of habit consistency this week.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center justify-between rounded-lg border bg-muted/20 p-3">
                <span className="text-xs text-muted-foreground">Week Average</span>
                <span className="text-lg font-bold text-foreground">{overallWeekAverage}%</span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Habit Consistency
                </h4>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {activeHabits.map((habit) => {
                    const stats = habitColumnAverages.find((c) => c.habitId === habit.id)
                    return (
                      <div
                        key={habit.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-border/40 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: habit.color }}
                          />
                          <span className="truncate max-w-[130px] font-medium text-foreground">
                            {habit.title}
                          </span>
                        </div>
                        <span className="font-semibold tabular-nums text-muted-foreground">
                          {stats?.daysCompleted || 0} / 7 days ({stats?.rate || 0}%)
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
