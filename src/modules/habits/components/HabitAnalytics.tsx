import { useMemo, useState } from 'react'
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isSameMonth,
  addMonths,
  subMonths
} from 'date-fns'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Flame,
  CheckCircle2,
  TrendingUp,
  Activity,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react'
import type { Habit, HabitLog } from '../types'
import { calculateStreak, generateHeatmapData } from '../utils/streakCalculator'
import { cn } from '@/lib/utils'

interface HabitAnalyticsProps {
  habits: Habit[]
  logs: HabitLog[]
}

const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function HabitAnalytics({ habits, logs }: HabitAnalyticsProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d')

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits])

  const streaks = useMemo(() => {
    return activeHabits.map((habit) => {
      const habitLogs = logs.filter((l) => l.habitId === habit.id)
      const res = calculateStreak(habit, habitLogs)
      return {
        habit,
        streak: res.currentStreak,
        best: res.bestStreak,
        consistency30: res.completionRate30Days
      }
    })
  }, [activeHabits, logs])

  const topStreaks = useMemo(() => {
    return [...streaks].sort((a, b) => b.streak - a.streak).slice(0, 5)
  }, [streaks])

  const bestOverallStreak = useMemo(() => {
    if (streaks.length === 0) return 0
    return Math.max(...streaks.map((s) => s.best))
  }, [streaks])

  const avgConsistency = useMemo(() => {
    if (streaks.length === 0) return 0
    const sum = streaks.reduce((acc, s) => acc + s.consistency30, 0)
    return Math.round(sum / streaks.length)
  }, [streaks])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const completedTodayCount = useMemo(() => {
    const todayLogs = logs.filter((l) => l.date === todayStr)
    let count = 0
    for (const h of activeHabits) {
      const hLogs = todayLogs.filter((l) => l.habitId === h.id)
      if (hLogs.some((l) => l.completed)) {
        count += 1
      }
    }
    return count
  }, [logs, todayStr, activeHabits])

  const trendChartData = useMemo(() => {
    const daysBack = timeRange === '7d' ? 6 : 29
    const startDate = subDays(new Date(), daysBack)
    const heatmap = generateHeatmapData(activeHabits, logs, startDate, new Date())

    return heatmap.map((d) => ({
      date: format(parseISO(d.date), timeRange === '7d' ? 'EEE' : 'MMM d'),
      completionRate: Math.round(d.ratio * 100),
      completed: d.count,
      total: d.total
    }))
  }, [activeHabits, logs, timeRange])

  const monthHeatmapData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const heatmap = generateHeatmapData(activeHabits, logs, monthStart, monthEnd)

    const map = new Map(heatmap.map((h) => [h.date, h]))
    return days.map((d) => {
      const dateStr = format(d, 'yyyy-MM-dd')
      const data = map.get(dateStr)
      return {
        date: d,
        dateStr,
        dayNumber: format(d, 'd'),
        dayOfWeek: d.getDay(),
        data: data || { count: 0, total: 0, ratio: 0, level: 0 }
      }
    })
  }, [currentMonth, activeHabits, logs])

  const firstDayOfMonthOffset = startOfMonth(currentMonth).getDay()

  const levelColorClass = (level: number) => {
    switch (level) {
      case 4:
        return 'bg-primary text-primary-foreground font-semibold'
      case 3:
        return 'bg-primary/80 text-primary-foreground'
      case 2:
        return 'bg-primary/50 text-foreground'
      case 1:
        return 'bg-primary/25 text-foreground'
      default:
        return 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeHabits.length}</div>
            <p className="text-xs text-muted-foreground mt-0.5">Routines currently tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedTodayCount} / {activeHabits.length}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeHabits.length > 0
                ? `${Math.round((completedTodayCount / activeHabits.length) * 100)}% daily rate`
                : 'No habits active'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Best Habit Streak</CardTitle>
            <Flame className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestOverallStreak} days</div>
            <p className="text-xs text-muted-foreground mt-0.5">All-time record across habits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">30-Day Consistency</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConsistency}%</div>
            <p className="text-xs text-muted-foreground mt-0.5">Average adherence score</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-base font-semibold">Completion Trend</CardTitle>
              <p className="text-xs text-muted-foreground">
                Percentage of active habits completed per day
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setTimeRange('7d')}
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => setTimeRange('30d')}
              >
                30 Days
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendChartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                  <XAxis
                    dataKey="date"
                    className="text-[10px] text-muted-foreground"
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    unit="%"
                    className="text-[10px] text-muted-foreground"
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completionRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rateGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Top Streaks</CardTitle>
            <p className="text-xs text-muted-foreground">Most consistent active habits</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topStreaks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No active habits found.
              </p>
            ) : (
              topStreaks.map(({ habit, streak, consistency30 }) => (
                <div
                  key={habit.id}
                  className="flex items-center justify-between rounded-lg border p-2.5 transition-colors hover:bg-muted/20"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: habit.color || '#3b82f6' }}
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate leading-tight">{habit.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {consistency30}% consistency
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="gap-1 font-medium text-xs">
                    <Flame className="h-3 w-3 text-amber-500" />
                    {streak}d
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Monthly Consistency Heatmap</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{format(currentMonth, 'MMMM yyyy')}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCurrentMonth(new Date())}
              >
                Current
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-medium text-muted-foreground pb-1">
            {WEEKDAY_HEADERS.map((day) => (
              <div key={day} className="py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOfMonthOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="h-10 rounded-md bg-transparent" />
            ))}

            {monthHeatmapData.map((item) => {
              const isToday = item.dateStr === todayStr
              const isCurrentMonth = isSameMonth(item.date, currentMonth)

              return (
                <div
                  key={item.dateStr}
                  title={`${item.dateStr}: ${item.data.count}/${item.data.total} habits (${Math.round(item.data.ratio * 100)}%)`}
                  className={cn(
                    'h-10 rounded-md flex flex-col items-center justify-center text-xs transition-transform hover:scale-105 cursor-pointer relative',
                    levelColorClass(item.data.level),
                    !isCurrentMonth && 'opacity-30',
                    isToday && 'ring-2 ring-primary ring-offset-1'
                  )}
                >
                  <span className="leading-none">{item.dayNumber}</span>
                  {item.data.total > 0 && (
                    <span className="text-[10px] opacity-80 mt-0.5 leading-none">
                      {item.data.count}/{item.data.total}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground pt-2">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <span className="h-3 w-3 rounded-sm bg-muted/40" />
              <span className="h-3 w-3 rounded-sm bg-primary/25" />
              <span className="h-3 w-3 rounded-sm bg-primary/50" />
              <span className="h-3 w-3 rounded-sm bg-primary/80" />
              <span className="h-3 w-3 rounded-sm bg-primary" />
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
