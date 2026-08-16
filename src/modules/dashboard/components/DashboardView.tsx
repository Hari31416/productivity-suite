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
  Check,
  Circle
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
import { useHashRoute } from '@/core/router/hashRouter'
import { useBackButton } from '@/core/platform/backButton'
import { useHabits, useHabitLogs, useToggleHabitLog } from '@/modules/habits/hooks/useHabits'
import { useTasks, useUpdateTaskStatus } from '@/modules/tasks/hooks/useTasks'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { useNotes } from '@/modules/notes/hooks/useNotes'
import { HabitFormModal } from '@/modules/habits/components/HabitFormModal'
import { TaskFormModal } from '@/modules/tasks/components/TaskFormModal'
import { NoteFormModal } from '@/modules/notes/components/NoteFormModal'
import { isHabitScheduledOnDate, calculateStreak } from '@/modules/habits/utils/streakCalculator'
import { calculateDailyProductivityScore, getProductivityStatus } from '../utils/dashboardScore'
import { cn } from '@/lib/utils'

export function DashboardView() {
  const { navigate } = useHashRoute()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const formattedDate = format(today, 'EEEE, MMM d')

  // Modal states
  const [habitModalOpen, setHabitModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [scoreModalOpen, setScoreModalOpen] = useState(false)

  // Handle Android Back button inside Dashboard
  useBackButton(
    () => {
      if (scoreModalOpen) {
        setScoreModalOpen(false)
        return true
      }
      if (habitModalOpen) {
        setHabitModalOpen(false)
        return true
      }
      if (taskModalOpen) {
        setTaskModalOpen(false)
        return true
      }
      if (noteModalOpen) {
        setNoteModalOpen(false)
        return true
      }
      return false
    },
    Boolean(scoreModalOpen || habitModalOpen || taskModalOpen || noteModalOpen),
    10
  )

  // Data queries
  const { data: habits = [] } = useHabits(false)
  const { data: todayLogs = [] } = useHabitLogs(todayStr)
  const { data: tasks = [] } = useTasks({ includeArchived: false })
  const { data: projects = [] } = useProjects(false)
  const { data: notes = [] } = useNotes({ archived: false })

  // Mutations
  const toggleHabitMutation = useToggleHabitLog()
  const updateTaskStatusMutation = useUpdateTaskStatus()

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
  const { todayTasks, completedTasksCount, urgentTasksCount, completedTasksList, upcomingTasks } =
    useMemo(() => {
      const dueToday = tasks.filter((t) => t.dueDate === todayStr)
      const completedList = tasks.filter(
        (t) => t.status === 'done' && (t.dueDate === todayStr || t.updatedAt?.startsWith(todayStr))
      )
      const urgent = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length
      const upcoming = tasks.filter((t) => t.status !== 'done').slice(0, 5)

      return {
        todayTasks: dueToday,
        completedTasksCount: dueToday.filter((t) => t.status === 'done').length,
        completedTasksList: completedList,
        urgentTasksCount: urgent,
        upcomingTasks: upcoming
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

  const habitsPercentage =
    todayHabits.length > 0 ? Math.round((completedHabitsCount / todayHabits.length) * 100) : 100

  const tasksPercentage =
    todayTasks.length > 0 ? Math.round((completedTasksCount / todayTasks.length) * 100) : 100

  // Circular Progress calculations
  const ringRadius = 38
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference - (score / 100) * ringCircumference

  // Registered widgets from modules
  const registeredWidgets = useMemo(() => {
    const modules = moduleRegistry.getAll()
    return modules.filter((m) => m.dashboardWidget)
  }, [])

  const handleToggleHabit = (habitId: string) => {
    toggleHabitMutation.mutate({
      habitId,
      date: todayStr
    })
  }

  const handleToggleTask = (taskId: string, currentStatus: string) => {
    updateTaskStatusMutation.mutate({
      id: taskId,
      status: currentStatus === 'done' ? 'todo' : 'done'
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-6">
      {/* Daily Progress Score Card (Mockup style) */}
      <Card
        onClick={() => setScoreModalOpen(true)}
        className="p-4 sm:p-5 rounded-2xl border bg-card/90 shadow-xs hover:border-primary/40 transition-all cursor-pointer group"
      >
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          {/* Circular Progress Ring */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 96 96">
              {/* Background ring */}
              <circle
                cx="48"
                cy="48"
                r={ringRadius}
                stroke="currentColor"
                strokeWidth="7"
                className="text-muted/40"
                fill="none"
              />
              {/* Active progress ring */}
              <circle
                cx="48"
                cy="48"
                r={ringRadius}
                stroke="currentColor"
                strokeWidth="7"
                strokeDasharray={ringCircumference}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                className="text-primary transition-all duration-700 ease-out"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xl font-bold tracking-tight text-foreground leading-none">
                {score}%
              </span>
            </div>
          </div>

          {/* Progress Details */}
          <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-sm font-semibold text-foreground">Daily Progress</span>
              <Badge
                variant="outline"
                className={cn('text-[11px] font-semibold py-0.5 px-2', productivityStatus.color)}
              >
                {productivityStatus.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {completedHabitsCount + completedTasksCount} of{' '}
              {todayHabits.length + todayTasks.length} items completed today
            </p>
          </div>

          {/* Habits & Tasks Count Badges */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
            <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center px-3 sm:px-4 py-2 rounded-xl bg-muted/40 border">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Habits
              </span>
              <span className="text-sm font-bold text-foreground">
                {completedHabitsCount}/{todayHabits.length}
              </span>
            </div>
            <div className="flex-1 sm:flex-initial flex flex-col items-center justify-center px-3 sm:px-4 py-2 rounded-xl bg-muted/40 border">
              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                Tasks
              </span>
              <span className="text-sm font-bold text-foreground">
                {completedTasksCount}/{todayTasks.length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Grid: Today's Focus & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Today's Focus (Habits) */}
        <Card className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Today's Focus</h2>
              <span className="text-xs text-muted-foreground">({todayHabits.length} habits)</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHabitModalOpen(true)}
              className="h-7 text-xs text-primary hover:text-primary/90 gap-1 px-2"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </Button>
          </div>

          {todayHabits.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No habits scheduled for today.
            </div>
          ) : (
            <div className="space-y-2">
              {todayHabits.slice(0, 5).map((habit) => {
                const logs = todayLogs.filter((l) => l.habitId === habit.id)
                const isCompleted = logs.some((l) => l.completed)
                const streak = calculateStreak(habit, logs, todayStr).currentStreak

                return (
                  <div
                    key={habit.id}
                    onClick={() => navigate('/habits', { habitId: habit.id })}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer hover:shadow-2xs hover:border-primary/40 group',
                      isCompleted
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-background hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color || '#0A7A64' }}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'font-semibold text-sm truncate group-hover:text-primary transition-colors',
                            isCompleted && 'line-through text-muted-foreground'
                          )}
                        >
                          {habit.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {habit.targetType === 'numeric' && (
                            <span>
                              {habit.targetValue || 1} {habit.unit || 'times'}
                            </span>
                          )}
                          {habit.targetType === 'timer' && (
                            <span>{habit.targetValue || 10} min</span>
                          )}
                          {streak > 0 && (
                            <span className="text-amber-500 font-medium flex items-center gap-0.5">
                              <Flame className="h-3 w-3" />
                              {streak}d streak
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleHabit(habit.id)
                      }}
                      className={cn(
                        'flex h-9 w-9 min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-xl transition-transform active:scale-95',
                        isCompleted
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40'
                      )}
                      aria-label={`Toggle habit ${habit.title}`}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-4 rounded-2xl border bg-card shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">Upcoming Tasks</h2>
              <span className="text-xs text-muted-foreground">({upcomingTasks.length} tasks)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              className="h-7 text-xs gap-1 px-2.5 rounded-lg border-primary/30 text-primary hover:bg-primary/5 font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Task</span>
            </Button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              All tasks cleared! Great job!
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const project = task.projectId
                  ? projects.find((p) => p.id === task.projectId)
                  : undefined
                const isDone = task.status === 'done'

                return (
                  <div
                    key={task.id}
                    onClick={() => navigate('/tasks', { taskId: task.id })}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border text-xs transition-all cursor-pointer hover:shadow-2xs hover:border-primary/40 group',
                      isDone ? 'bg-primary/5 border-primary/20' : 'bg-background hover:bg-muted/40'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleTask(task.id, task.status)
                        }}
                        className={cn(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all active:scale-95',
                          isDone
                            ? 'bg-primary border-primary text-primary-foreground'
                            : 'border-muted-foreground/30 hover:border-primary text-transparent'
                        )}
                        aria-label={`Mark task ${task.title} as ${isDone ? 'incomplete' : 'complete'}`}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'font-semibold text-sm truncate group-hover:text-primary transition-colors',
                            isDone && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                          {task.dueDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {task.dueDate === todayStr ? 'Today' : task.dueDate}
                            </span>
                          )}
                          {project && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: `${project.color}20`,
                                color: project.color
                              }}
                            >
                              {project.name}
                            </span>
                          )}
                          {task.priority === 'urgent' && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] h-4 px-1 py-0 font-medium"
                            >
                              Urgent
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick Overview Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card
          onClick={() => navigate('/habits')}
          className="p-3.5 sm:p-4 flex items-center gap-3 rounded-2xl border bg-card shadow-xs cursor-pointer hover:border-primary/40 hover:shadow-2xs transition-all group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors">
              Active Habits
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{habits.length}</span>
              {maxStreak > 0 && (
                <span className="text-[11px] text-amber-500 font-medium flex items-center">
                  <Flame className="h-3 w-3" />
                  {maxStreak}d
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/tasks')}
          className="p-3.5 sm:p-4 flex items-center gap-3 rounded-2xl border bg-card shadow-xs cursor-pointer hover:border-primary/40 hover:shadow-2xs transition-all group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors">
              Tasks To-Do
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">
                {tasks.filter((t) => t.status !== 'done').length}
              </span>
              {urgentTasksCount > 0 && (
                <span className="text-[11px] text-red-500 font-medium">{urgentTasksCount} urg</span>
              )}
            </div>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/notes')}
          className="p-3.5 sm:p-4 flex items-center gap-3 rounded-2xl border bg-card shadow-xs cursor-pointer hover:border-primary/40 hover:shadow-2xs transition-all group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors">
              Notes & Docs
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">{notes.length}</span>
            </div>
          </div>
        </Card>

        <Card
          onClick={() => navigate('/tasks')}
          className="p-3.5 sm:p-4 flex items-center gap-3 rounded-2xl border bg-card shadow-xs cursor-pointer hover:border-primary/40 hover:shadow-2xs transition-all group"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate font-medium group-hover:text-foreground transition-colors">
              Projects
            </p>
            <span className="text-lg font-bold">{projects.length}</span>
          </div>
        </Card>
      </div>

      {/* Completed Today Daily Wins Feed */}
      {(completedHabitsList.length > 0 || completedTasksList.length > 0) && (
        <div className="rounded-2xl border bg-card/60 p-4 space-y-3">
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
                onClick={() => navigate('/habits', { habitId: habit.id })}
                className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-background text-xs shadow-2xs cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all group"
              >
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: habit.color || '#0A7A64' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {habit.title}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] h-4 px-1 py-0 text-primary border-primary/30 shrink-0"
                    >
                      Habit
                    </Badge>
                  </div>
                </div>
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
              </div>
            ))}

            {completedTasksList.map((task) => {
              const project = task.projectId
                ? projects.find((p) => p.id === task.projectId)
                : undefined
              return (
                <div
                  key={`completed-task-${task.id}`}
                  onClick={() => navigate('/tasks', { taskId: task.id })}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border bg-background text-xs shadow-2xs cursor-pointer hover:border-primary/40 hover:shadow-xs transition-all group"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-medium text-foreground truncate line-through text-muted-foreground group-hover:text-foreground transition-colors">
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
          <span className="text-xs text-muted-foreground">Live updates</span>
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
        <DialogContent className="sm:max-w-md rounded-2xl">
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
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Scheduled Habits</span>
                </div>
                <span className="text-foreground">
                  {habitsPercentage}% ({completedHabitsCount}/{todayHabits.length})
                </span>
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
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>Due Tasks</span>
                </div>
                <span className="text-foreground">
                  {tasksPercentage}% ({completedTasksCount}/{todayTasks.length})
                </span>
              </div>
              <Progress value={tasksPercentage} className="h-2" />
              <p className="text-[11px] text-muted-foreground">
                {todayTasks.length === 0
                  ? 'No tasks due today.'
                  : `${completedTasksCount} of ${todayTasks.length} tasks scheduled for today completed.`}
              </p>
            </div>

            {/* Formula explanation */}
            <div className="flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                The Daily Productivity Score blends your habit completion rate (50%) and your due
                task completion rate (50%). Checking in habits and clearing due tasks directly
                elevates your score!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals for Quick Creation */}
      <HabitFormModal open={habitModalOpen} onOpenChange={setHabitModalOpen} />
      <TaskFormModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        defaultDueDate={todayStr}
      />
      <NoteFormModal open={noteModalOpen} onOpenChange={setNoteModalOpen} />
    </div>
  )
}
