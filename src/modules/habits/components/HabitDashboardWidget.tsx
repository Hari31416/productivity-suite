import { useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Activity, Check, ArrowRight, Flame } from 'lucide-react'
import { useHabits, useHabitLogs, useToggleHabitLog } from '../hooks/useHabits'
import { isHabitScheduledOnDate, calculateStreak } from '../utils/streakCalculator'
import { cn } from '@/lib/utils'

export function HabitDashboardWidget() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: habits = [], isLoading: habitsLoading } = useHabits(false)
  const { data: todayLogs = [], isLoading: logsLoading } = useHabitLogs(todayStr)
  const toggleMutation = useToggleHabitLog()

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

  const topHabits = useMemo(() => {
    return todayHabits.slice(0, 4)
  }, [todayHabits])

  if (habitsLoading || logsLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Habit Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            Loading today's habits...
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
            <CardTitle className="text-sm font-semibold">Today's Habits</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {completionStats.completed} / {completionStats.total} done
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Daily Completion</span>
              <span className="font-medium text-foreground">
                {completionStats.percentage}%
              </span>
            </div>
            <Progress value={completionStats.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            {todayHabits.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No habits scheduled for today.
              </p>
            ) : (
              topHabits.map((habit) => {
                const logs = todayLogs.filter((l) => l.habitId === habit.id)
                const isCompleted = logs.some((l) => l.completed)
                const streak = calculateStreak(habit, logs, todayStr).currentStreak

                return (
                  <div
                    key={habit.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md border text-xs transition-colors',
                      isCompleted ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color || '#3b82f6' }}
                      />
                      <span
                        className={cn(
                          'font-medium truncate',
                          isCompleted && 'line-through text-muted-foreground'
                        )}
                      >
                        {habit.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {streak > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] text-amber-500 font-medium mr-1">
                          <Flame className="h-3 w-3" />
                          {streak}
                        </span>
                      )}
                      <Button
                        size="sm"
                        variant={isCompleted ? 'default' : 'outline'}
                        className={cn(
                          'h-6 w-6 p-0 rounded-full',
                          isCompleted && 'bg-primary text-primary-foreground'
                        )}
                        onClick={() =>
                          toggleMutation.mutate({
                            habitId: habit.id,
                            date: todayStr
                          })
                        }
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
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
          <span>View All Habits</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
