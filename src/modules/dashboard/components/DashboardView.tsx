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
  Calendar,
  Sparkles,
  Info,
  Check
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
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
  const [scoreModalOpen, setScoreModalOpen] = useState(false)

  // Data queries
  const { data: habits = [] } = useHabits(false)
  const { data: todayLogs = [] } = useHabitLogs(todayStr)
  const { data: tasks = [] } = useTasks({ includeArchived: false })
  const { data: projects = [] } = useProjects(false)
  const { data: notes = [] } = useNotes({ archived: false })

  // Habit metrics
  const { todayHabits, completedHabitsCount, maxStreak, completedHabitsList } = useMemo(() => {
    const scheduled = habits.filter((h) => isHabitScheduledOnDate(h, todayStr))
    const completedList: typeof habits = []
    let bestStreak = 0

    for (const habit of scheduled) {
      const logs = todayLogs.filter((l) => l.habitId === habit.id)
      if (logs.some((l) => l.completed)) {
        completedList.push(habit)
      }
    }

    for (const habit of habits) {
      const logs = todayLogs.filter((l) => l.habitId === habit.id)
      const streak = calculateStreak(habit, logs, todayStr).currentStreak
      if (streak > bestStreak) bestStreak = streak
    }

    return {
      todayHabits: scheduled,
      completedHabitsCount: completedList.length,
      completedHabitsList: completedList,
      maxStreak: bestStreak
    }
  }, [habits, todayLogs, todayStr])

  // Task metrics
  const { todayTasks, completedTasksCount, urgentTasksCount, completedTasksList } = useMemo(() => {
    const dueToday = tasks.filter((t) => t.dueDate === todayStr)
    const completedList = tasks.filter((t) => t.status === 'done' && (t.dueDate === todayStr || t.updatedAt?.startsWith(todayStr)))
    const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length

    return {
      todayTasks: dueToday,
      completedTasksCount: dueToday.filter((t) => t.status === 'done').length,
      completedTasksList: completedList,
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

  const habitsPercentage = todayHabits.length > 0
    ? Math.round((completedHabitsCount / todayHabits.length) * 100)
    : 100

  const tasksPercentage = todayTasks.length > 0
    ? Math.round((completedTasksCount / todayTasks.length) * 100)
    : 100

  // Registered widgets from modules
  const registeredWidgets = useMemo(() => {
    const modules = moduleRegistry.getAll()
    return modules.filter((m) => m.dashboardWidget)
  }, [])

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Header Banner & Score */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl border bg-gradient-to-br from-card via-card to-primary/5 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formattedDate}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight sm:text-3xl text-foreground">
              {greeting}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track your habits, prioritize daily tasks, and capture insights all in one place.
            </p>

            {/* Quick action buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 sm:pt-3">
              <Button
                size="sm"
                onClick={() => setTaskModalOpen(true)}
                className="gap-1 h-7.5 sm:h-8 text-xs font-medium px-2.5 sm:px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setHabitModalOpen(true)}
                className="gap-1 h-7.5 sm:h-8 text-xs font-medium px-2.5 sm:px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Habit</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setNoteModalOpen(true)}
                className="gap-1 h-7.5 sm:h-8 text-xs font-medium px-2.5 sm:px-3"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>New Note</span>
              </Button>
            </div>
          </div>

          {/* Daily Productivity Score Card (Clickable for breakdown) */}
          <div
            onClick={() => setScoreModalOpen(true)}
            className="flex w-full flex-col gap-2.5 sm:gap-3 rounded-xl border bg-background/80 p-3 sm:p-4 backdrop-blur sm:w-80 shrink-0 cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all group"
            title="Click to view full score breakdown"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Daily Score
                </span>
              </div>
              <Badge variant="outline" className={`text-xs font-semibold ${productivityStatus.color}`}>
                {productivityStatus.label}
              </Badge>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {score}%
              </span>
              <span className="text-xs text-muted-foreground">
                {completedHabitsCount + completedTasksCount} of {todayHabits.length + todayTasks.length} done
              </span>
            </div>

            <Progress value={score} className="h-1.5 sm:h-2" />

            <div className="grid grid-cols-2 gap-2 pt-0.5 text-[11px] text-muted-foreground">
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Active Habits</p>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold">{habits.length}</span>
              {maxStreak > 0 && (
                <span className="text-[10px] sm:text-[11px] text-amber-500 font-medium flex items-center">
                  <Flame className="h-3 w-3" />
                  {maxStreak}d
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Tasks To-Do</p>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold">
                {tasks.filter((t) => t.status !== 'done').length}
              </span>
              {urgentTasksCount > 0 && (
                <span className="text-[10px] sm:text-[11px] text-red-500 font-medium">
                  {urgentTasksCount} urg
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Notes & Docs</p>
            <div className="flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-bold">{notes.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
            <FolderKanban className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate">Active Projects</p>
            <span className="text-base sm:text-lg font-bold">{projects.length}</span>
          </div>
        </Card>
      </div>

      {/* Completed Today Daily Wins Feed */}
      {(completedHabitsList.length > 0 || completedTasksList.length > 0) && (
        <div className="rounded-xl border bg-card/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Completed Today ({completedHabitsList.length + completedTasksList.length})
              </h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Daily Wins</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {completedHabitsList.map((habit) => (
              <div
                key={`completed-habit-${habit.id}`}
                className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-background text-xs shadow-2xs"
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color || '#3b82f6' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-foreground truncate">{habit.title}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 text-emerald-600 border-emerald-500/30 shrink-0">
                      Habit
                    </Badge>
                  </div>
                </div>
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              </div>
            ))}

            {completedTasksList.map((task) => {
              const project = task.projectId ? projects.find((p) => p.id === task.projectId) : undefined
              return (
                <div
                  key={`completed-task-${task.id}`}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg border bg-background text-xs shadow-2xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-foreground truncate line-through text-muted-foreground">
                        {task.title}
                      </span>
                      {project && (
                        <span
                          className="text-[10px] px-1 py-0 rounded font-normal shrink-0"
                          style={{
                            backgroundColor: `${project.color}20`,
                            color: project.color
                          }}
                        >
                          {project.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Score Breakdown Dialog */}
      <Dialog open={scoreModalOpen} onOpenChange={setScoreModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <DialogTitle>Daily Productivity Score Breakdown</DialogTitle>
            </div>
            <DialogDescription>
              How your daily score of {score}% is calculated for {formattedDate}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Habits component */}
            <div className="space-y-2 rounded-xl border p-3.5 bg-muted/20">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span>Scheduled Habits</span>
                </div>
                <span className="text-foreground">{habitsPercentage}% ({completedHabitsCount}/{todayHabits.length})</span>
              </div>
              <Progress value={habitsPercentage} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                {todayHabits.length === 0
                  ? 'No habits scheduled for today.'
                  : `${completedHabitsCount} of ${todayHabits.length} daily habits logged.`}
              </p>
            </div>

            {/* Tasks component */}
            <div className="space-y-2 rounded-xl border p-3.5 bg-muted/20">
              <div className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>Due Tasks</span>
                </div>
                <span className="text-foreground">{tasksPercentage}% ({completedTasksCount}/{todayTasks.length})</span>
              </div>
              <Progress value={tasksPercentage} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                {todayTasks.length === 0
                  ? 'No tasks due today.'
                  : `${completedTasksCount} of ${todayTasks.length} tasks scheduled for today completed.`}
              </p>
            </div>

            {/* Formula explanation */}
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                The Daily Productivity Score blends your habit completion rate (50%) and your due task completion rate (50%). Checking in habits and clearing due tasks directly elevates your score!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
