import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Plus,
  CheckCircle2,
  Activity,
  FileText,
  FolderKanban,
  Zap,
  TrendingUp,
  Flame,
  Calendar
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { moduleRegistry } from '@/core/modules/registry'
import { useHabits, useHabitLogs } from '@/modules/habits/hooks/useHabits'
import { useTasks } from '@/modules/tasks/hooks/useTasks'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { useNotes } from '@/modules/notes/hooks/useNotes'
import { HabitFormModal } from '@/modules/habits/components/HabitFormModal'
import { TaskFormModal } from '@/modules/tasks/components/TaskFormModal'
import { NoteFormModal } from '@/modules/notes/components/NoteFormModal'
import { isHabitScheduledOnDate, calculateStreak } from '@/modules/habits/utils/streakCalculator'
import {
  calculateDailyProductivityScore,
  getGreeting,
  getProductivityStatus
} from '../utils/dashboardScore'

export function DashboardView() {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy')
  const greeting = getGreeting(today)

  // Modal states
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)

  // Data queries
  const { data: habits = [] } = useHabits(false)
  const { data: todayLogs = [] } = useHabitLogs(todayStr)
  const { data: tasks = [] } = useTasks({ includeArchived: false })
  const { data: projects = [] } = useProjects(false)
  const { data: notes = [] } = useNotes({ archived: false })

  // Habit metrics
  const { todayHabits, completedHabitsCount, maxStreak } = useMemo(() => {
    const scheduled = habits.filter((h) => isHabitScheduledOnDate(h, todayStr))
    let completed = 0
    let bestStreak = 0

    for (const habit of scheduled) {
      const logs = todayLogs.filter((l) => l.habitId === habit.id)
      if (logs.some((l) => l.completed)) {
        completed += 1
      }
    }

    for (const habit of habits) {
      const logs = todayLogs.filter((l) => l.habitId === habit.id)
      const streak = calculateStreak(habit, logs, todayStr).currentStreak
      if (streak > bestStreak) bestStreak = streak
    }

    return {
      todayHabits: scheduled,
      completedHabitsCount: completed,
      maxStreak: bestStreak
    }
  }, [habits, todayLogs, todayStr])

  // Task metrics
  const { todayTasks, completedTasksCount, urgentTasksCount } = useMemo(() => {
    const dueToday = tasks.filter((t) => t.dueDate === todayStr)
    const completedToday = dueToday.filter((t) => t.status === 'done').length
    const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length

    return {
      todayTasks: dueToday,
      completedTasksCount: completedToday,
      urgentTasksCount: urgent
    }
  }, [tasks, todayStr])

  // Overall Daily Productivity Score
  const score = useMemo(() => {
    return calculateDailyProductivityScore({
      habitsCompleted: completedHabitsCount,
      habitsTotal: todayHabits.length,
      tasksCompleted: completedTasksCount,
      tasksTotal: todayTasks.length
    })
  }, [completedHabitsCount, todayHabits.length, completedTasksCount, todayTasks.length])

  const productivityStatus = getProductivityStatus(score)

  // Registered widgets from modules
  const registeredWidgets = useMemo(() => {
    const modules = moduleRegistry.getAll()
    return modules.filter((m) => m.dashboardWidget)
  }, [])

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner & Score */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {greeting}
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your habits, prioritize daily tasks, and capture insights all in one place.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-3">
              <Button
                size="sm"
                onClick={() => setTaskModalOpen(true)}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHabitModalOpen(true)}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Habit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNoteModalOpen(true)}
                className="gap-1.5 h-8 text-xs font-medium"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Note</span>
              </Button>
            </div>
          </div>

          {/* Daily Productivity Score Card */}
          <div className="flex w-full flex-col gap-3 rounded-xl border bg-background/80 p-4 backdrop-blur sm:w-80 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Daily Score
                </span>
              </div>
              <Badge variant="outline" className={`text-xs font-semibold ${productivityStatus.color}`}>
                {productivityStatus.label}
              </Badge>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {score}%
              </span>
              <span className="text-xs text-muted-foreground">
                {completedHabitsCount + completedTasksCount} of {todayHabits.length + todayTasks.length} items done
              </span>
            </div>

            <Progress value={score} className="h-2" />

            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-muted-foreground">
              <div className="flex items-center justify-between border-r pr-2">
                <span>Habits:</span>
                <span className="font-medium text-foreground">
                  {completedHabitsCount}/{todayHabits.length}
                </span>
              </div>
              <div className="flex items-center justify-between pl-1">
                <span>Tasks:</span>
                <span className="font-medium text-foreground">
                  {completedTasksCount}/{todayTasks.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Overview Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">Active Habits</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold">{habits.length}</span>
              {maxStreak > 0 && (
                <span className="text-[11px] text-amber-500 font-medium flex items-center gap-0.5">
                  <Flame className="h-3 w-3" />
                  {maxStreak}d
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">Tasks To-Do</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold">
                {tasks.filter((t) => t.status !== 'done').length}
              </span>
              {urgentTasksCount > 0 && (
                <span className="text-[11px] text-red-500 font-medium">
                  {urgentTasksCount} urgent
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">Notes & Docs</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold">{notes.length}</span>
              <span className="text-[11px] text-muted-foreground">
                {notes.filter((n) => n.pinned).length} pinned
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">Active Projects</p>
            <span className="text-lg font-bold">{projects.length}</span>
          </div>
        </Card>
      </div>

      {/* Dynamic Module Widgets Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Module Focus & Action Items
            </h2>
          </div>
          <span className="text-xs text-muted-foreground">
            Live module updates
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {registeredWidgets.map((module) => {
            const WidgetComponent = module.dashboardWidget
            if (!WidgetComponent) return null
            return (
              <div key={module.id} className="h-full">
                <WidgetComponent />
              </div>
            )
          })}
        </div>
      </div>

      {/* Modals for Quick Creation */}
      <HabitFormModal
        open={habitModalOpen}
        onOpenChange={setHabitModalOpen}
      />
      <TaskFormModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        defaultDueDate={todayStr}
      />
      <NoteFormModal
        open={noteModalOpen}
        onOpenChange={setNoteModalOpen}
      />
    </div>
  )
}
