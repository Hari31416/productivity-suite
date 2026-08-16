import { useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Activity, ArrowRight, Flame, Sparkles } from 'lucide-react'
import { useHabits, useHabitLogs } from '../hooks/useHabits'
import { isHabitScheduledOnDate, calculateStreak } from '../utils/streakCalculator'
import { DEFAULT_HABIT_CATEGORIES } from '../constants'

export function HabitDashboardWidget() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: habits = [], isLoading: habitsLoading } = useHabits(false)
  const { data: todayLogs = [], isLoading: logsLoading } = useHabitLogs(todayStr)

  const todayHabits = useMemo(() => {
    return habits.filter((h) => isHabitScheduledOnDate(h, todayStr))
  }, [habits, todayStr])

  const completionStats = useMemo(() => {
    if (todayHabits.length === 0) {
      return { completed: 0, total: 0, percentage: 0 }
    }

    let completed = 0
    for (const habit of todayHabits) {
      const logs = todayLogs.filter((l) => l.habitId === habit.id)
      if (logs.some((l) => l.completed)) {
        completed += 1
      }
    }

    return {
      completed,
      total: todayHabits.length,
      percentage: Math.round((completed / todayHabits.length) * 100)
    }
  }, [todayHabits, todayLogs])

  const { maxStreak, categoryCounts } = useMemo(() => {
    let max = 0
    const catMap = new Map<string, number>()

    for (const habit of habits) {
      const logs = todayLogs.filter((l) => l.habitId === habit.id)
      const streak = calculateStreak(habit, logs, todayStr).currentStreak
      if (streak > max) max = streak

      const cat = habit.categoryId || 'other'
      catMap.set(cat, (catMap.get(cat) || 0) + 1)
    }

    return { maxStreak: max, categoryCounts: catMap }
  }, [habits, todayLogs, todayStr])

  if (habitsLoading || logsLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Habit Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            Loading habit metrics...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Habits Insights</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {habits.length} active
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Daily Adherence</span>
              <span className="font-medium text-foreground">{completionStats.percentage}%</span>
            </div>
            <Progress value={completionStats.percentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Today's Target</span>
              </div>
              <p className="text-sm font-bold">
                {completionStats.completed} / {completionStats.total} done
              </p>
            </div>

            <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Flame className="h-3.5 w-3.5 text-amber-500" />
                <span>Best Streak</span>
              </div>
              <p className="text-sm font-bold text-amber-500">
                {maxStreak > 0 ? `${maxStreak} ${maxStreak === 1 ? 'day' : 'days'}` : 'None yet'}
              </p>
            </div>
          </div>

          {/* Category distribution */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Categories
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_HABIT_CATEGORIES.filter((cat) => (categoryCounts.get(cat.id) || 0) > 0).map(
                (cat) => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-lg border font-medium whitespace-nowrap"
                    style={{
                      backgroundColor: `${cat.color}15`,
                      borderColor: `${cat.color}35`,
                      color: cat.color
                    }}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span>{cat.name}</span>
                    <span className="opacity-75">({categoryCounts.get(cat.id)})</span>
                  </span>
                )
              )}
            </div>
          </div>
        </CardContent>
      </div>

      <div className="p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground justify-between"
          onClick={() => {
            window.location.hash = '#/habits'
          }}
        >
          <span>Open Habits Tracker</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
