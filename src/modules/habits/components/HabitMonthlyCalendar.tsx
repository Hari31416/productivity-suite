import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday as checkIsToday,
  addMonths,
  subMonths
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  Calendar as CalendarIcon,
  TrendingUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import type { Habit, HabitLog } from '../types'
import { isHabitScheduledOnDate } from '../utils/streakCalculator'
import { useToggleHabitLog } from '../hooks/useHabits'
import { cn } from '@/lib/utils'

interface HabitMonthlyCalendarProps {
  habit: Habit
  logs: HabitLog[]
  onSelectDate?: (dateStr: string) => void
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function HabitMonthlyCalendar({ habit, logs, onSelectDate }: HabitMonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const toggleMutation = useToggleHabitLog()

  const monthStart = useMemo(() => startOfMonth(currentMonth), [currentMonth])
  const monthEnd = useMemo(() => endOfMonth(currentMonth), [currentMonth])
  const calendarStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart])
  const calendarEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd])

  const calendarDays = useMemo(() => {
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [calendarStart, calendarEnd])

  const monthDays = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd })
  }, [monthStart, monthEnd])

  // Map of date string -> logs
  const logsByDate = useMemo(() => {
    const map = new Map<string, HabitLog[]>()
    for (const log of logs) {
      const existing = map.get(log.date) || []
      existing.push(log)
      map.set(log.date, existing)
    }
    return map
  }, [logs])

  // Monthly Metrics Calculation
  const monthlyMetrics = useMemo(() => {
    let completedDaysCount = 0
    let scheduledDaysCount = 0
    let currentMonthlyStreak = 0
    let bestMonthlyStreak = 0
    let totalCounterSum = 0
    let totalTimerMinutesSum = 0

    const targetVal = habit.targetValue || 1

    for (const d of monthDays) {
      const dateStr = format(d, 'yyyy-MM-dd')
      const isScheduled = isHabitScheduledOnDate(habit, dateStr)
      if (isScheduled) {
        scheduledDaysCount++
      }

      const dayLogs = logsByDate.get(dateStr) || []
      let dayCompleted = false

      if (habit.targetType === 'numeric') {
        const val = dayLogs.reduce((sum, l) => {
          if (typeof l.value === 'number') return sum + l.value
          return sum + (l.completed ? targetVal : 0)
        }, 0)
        totalCounterSum += val
        dayCompleted = val >= targetVal
      } else if (habit.targetType === 'timer') {
        const mins = dayLogs.reduce((sum, l) => {
          if (typeof l.durationSeconds === 'number') return sum + Math.round(l.durationSeconds / 60)
          if (typeof l.value === 'number') return sum + l.value
          return sum + (l.completed ? targetVal : 0)
        }, 0)
        totalTimerMinutesSum += mins
        dayCompleted = mins >= targetVal
      } else {
        dayCompleted = dayLogs.some((l) => l.completed)
      }

      if (dayCompleted) {
        completedDaysCount++
        currentMonthlyStreak++
        if (currentMonthlyStreak > bestMonthlyStreak) {
          bestMonthlyStreak = currentMonthlyStreak
        }
      } else if (isScheduled) {
        currentMonthlyStreak = 0
      }
    }

    const completionRate =
      scheduledDaysCount > 0 ? Math.round((completedDaysCount / scheduledDaysCount) * 100) : 0

    return {
      completedDaysCount,
      scheduledDaysCount,
      completionRate,
      bestMonthlyStreak,
      totalCounterSum,
      totalTimerMinutesSum
    }
  }, [monthDays, habit, logsByDate])

  const handlePrevMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1))
  }

  const handleCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const handleDayClick = (dateStr: string) => {
    if (onSelectDate) {
      onSelectDate(dateStr)
    } else {
      toggleMutation.mutate({
        habitId: habit.id,
        date: dateStr
      })
    }
  }

  const themeColor = habit.color || '#0A7A64'

  return (
    <Card className="rounded-2xl border bg-card shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <span>Monthly History & Visual Calendar</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Review your consistency, check-in records, and completion trends.
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrevMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold px-3"
              onClick={handleCurrentMonth}
            >
              {format(currentMonth, 'MMMM yyyy')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={handleNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Monthly Summary Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border bg-muted/30 p-3 flex flex-col justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Monthly Completion
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-xl sm:text-2xl font-bold text-foreground">
                {monthlyMetrics.completionRate}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                ({monthlyMetrics.completedDaysCount}/{monthlyMetrics.scheduledDaysCount}d)
              </span>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Best Month Streak</span>
              <Flame className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl sm:text-2xl font-bold text-amber-500">
                {monthlyMetrics.bestMonthlyStreak}
              </span>
              <span className="text-xs text-muted-foreground">days</span>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Total Logged</span>
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="flex items-baseline gap-1 mt-1">
              {habit.targetType === 'timer' ? (
                <>
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {monthlyMetrics.totalTimerMinutesSum}
                  </span>
                  <span className="text-xs text-muted-foreground">mins</span>
                </>
              ) : habit.targetType === 'numeric' ? (
                <>
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {monthlyMetrics.totalCounterSum}
                  </span>
                  <span className="text-xs text-muted-foreground">{habit.unit || 'units'}</span>
                </>
              ) : (
                <>
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {monthlyMetrics.completedDaysCount}
                  </span>
                  <span className="text-xs text-muted-foreground">check-ins</span>
                </>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
              <span>Status</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="mt-1">
              <span className="text-xs font-semibold text-foreground">
                {monthlyMetrics.completionRate >= 80
                  ? 'Consistent Pace'
                  : monthlyMetrics.completionRate >= 50
                    ? 'Making Progress'
                    : 'Building Momentum'}
              </span>
            </div>
          </div>
        </div>

        {/* 7-column Calendar Grid */}
        <div className="rounded-xl border p-2.5 sm:p-3.5 bg-background">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {WEEKDAY_NAMES.map((name) => (
              <span key={name} className="text-[11px] font-semibold text-muted-foreground py-1">
                {name}
              </span>
            ))}
          </div>

          {/* Calendar day cells */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {calendarDays.map((d) => {
              const dateStr = format(d, 'yyyy-MM-dd')
              const isMonthDay = isSameMonth(d, currentMonth)
              const isTodayDate = checkIsToday(d)
              const isScheduled = isHabitScheduledOnDate(habit, dateStr)

              const dayLogs = logsByDate.get(dateStr) || []
              let isCompleted = false
              let dayValue = 0

              const targetVal = habit.targetValue || 1
              if (habit.targetType === 'numeric') {
                dayValue = dayLogs.reduce((sum, l) => {
                  if (typeof l.value === 'number') return sum + l.value
                  return sum + (l.completed ? targetVal : 0)
                }, 0)
                isCompleted = dayValue >= targetVal
              } else if (habit.targetType === 'timer') {
                dayValue = dayLogs.reduce((sum, l) => {
                  if (typeof l.durationSeconds === 'number')
                    return sum + Math.round(l.durationSeconds / 60)
                  if (typeof l.value === 'number') return sum + l.value
                  return sum + (l.completed ? targetVal : 0)
                }, 0)
                isCompleted = dayValue >= targetVal
              } else {
                isCompleted = dayLogs.some((l) => l.completed)
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  disabled={!isMonthDay}
                  title={`${format(d, 'MMM d, yyyy')}: ${
                    isCompleted ? 'Completed' : isScheduled ? 'Scheduled' : 'Rest / Not scheduled'
                  }`}
                  className={cn(
                    'relative flex flex-col items-center justify-between p-1 rounded-lg min-h-[44px] sm:min-h-[50px] transition-all',
                    !isMonthDay && 'opacity-20 pointer-events-none',
                    isMonthDay && !isCompleted && isScheduled && 'hover:bg-muted/60',
                    isMonthDay && !isScheduled && 'opacity-60 hover:bg-muted/40',
                    isTodayDate && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
                    isCompleted && 'bg-primary/10 hover:bg-primary/15'
                  )}
                >
                  <span
                    className={cn(
                      'text-[11px] sm:text-xs font-semibold',
                      isTodayDate ? 'text-primary font-bold' : 'text-foreground'
                    )}
                  >
                    {format(d, 'd')}
                  </span>

                  {/* Completion Dot or Value Indicator */}
                  <div className="flex items-center justify-center my-0.5">
                    {isCompleted ? (
                      <div
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full flex items-center justify-center shadow-xs"
                        style={{ backgroundColor: themeColor }}
                      />
                    ) : dayValue > 0 ? (
                      <div
                        className="h-2 w-2 rounded-full border-2"
                        style={{ borderColor: themeColor }}
                      />
                    ) : isScheduled ? (
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                    ) : (
                      <div className="h-1 w-1 rounded-full bg-transparent" />
                    )}
                  </div>

                  {/* Extra micro-label for numeric/timer */}
                  {habit.targetType !== 'boolean' && dayValue > 0 && (
                    <span className="text-[9px] font-mono text-muted-foreground leading-none">
                      {dayValue}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full inline-block"
              style={{ backgroundColor: themeColor }}
            />
            <span>Completed</span>
          </div>
          {habit.targetType !== 'boolean' && (
            <div className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border-2 inline-block"
                style={{ borderColor: themeColor }}
              />
              <span>In Progress</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/30 inline-block" />
            <span>Scheduled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
