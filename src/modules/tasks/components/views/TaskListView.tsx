import { useState, useMemo } from 'react'
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isPast,
  startOfDay,
  addDays
} from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Inbox
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Project } from '../../types'
import { TaskCard } from '../TaskCard'

interface TaskListViewProps {
  tasks: Task[]
  projects: Project[]
  onEditTask: (task: Task) => void
  onAddTask?: (defaultDate?: string) => void
  isLoading?: boolean
}

interface TaskGroup {
  id: string
  title: string
  icon: typeof AlertCircle
  tasks: Task[]
  headerColor: string
  badgeVariant?: 'default' | 'secondary' | 'outline' | 'destructive'
  defaultDate?: string
}

export function TaskListView({
  tasks,
  projects,
  onEditTask,
  onAddTask,
  isLoading
}: TaskListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>()
    for (const p of projects) {
      map.set(p.id, p)
    }
    return map
  }, [projects])

  const groups: TaskGroup[] = useMemo(() => {
    const today = startOfDay(new Date())
    const todayStr = format(today, 'yyyy-MM-dd')
    const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd')

    const overdueTasks: Task[] = []
    const todayTasks: Task[] = []
    const tomorrowTasks: Task[] = []
    const upcomingTasks: Task[] = []
    const noDueDateTasks: Task[] = []
    const completedTasks: Task[] = []

    for (const task of tasks) {
      if (task.status === 'done') {
        completedTasks.push(task)
        continue
      }

      if (!task.dueDate) {
        noDueDateTasks.push(task)
        continue
      }

      try {
        const taskDate = startOfDay(parseISO(task.dueDate))
        if (isToday(taskDate)) {
          todayTasks.push(task)
        } else if (isTomorrow(taskDate)) {
          tomorrowTasks.push(task)
        } else if (isPast(taskDate)) {
          overdueTasks.push(task)
        } else {
          upcomingTasks.push(task)
        }
      } catch {
        noDueDateTasks.push(task)
      }
    }

    const result: TaskGroup[] = []

    if (overdueTasks.length > 0) {
      result.push({
        id: 'overdue',
        title: 'Overdue',
        icon: AlertCircle,
        tasks: overdueTasks,
        headerColor: 'text-destructive',
        badgeVariant: 'destructive'
      })
    }

    result.push({
      id: 'today',
      title: 'Today',
      icon: Calendar,
      tasks: todayTasks,
      headerColor: 'text-primary',
      defaultDate: todayStr
    })

    result.push({
      id: 'tomorrow',
      title: 'Tomorrow',
      icon: Clock,
      tasks: tomorrowTasks,
      headerColor: 'text-blue-500',
      defaultDate: tomorrowStr
    })

    result.push({
      id: 'upcoming',
      title: 'Upcoming',
      icon: Calendar,
      tasks: upcomingTasks,
      headerColor: 'text-foreground'
    })

    result.push({
      id: 'no_due_date',
      title: 'No Due Date',
      icon: Inbox,
      tasks: noDueDateTasks,
      headerColor: 'text-muted-foreground'
    })

    if (completedTasks.length > 0) {
      result.push({
        id: 'completed',
        title: 'Completed',
        icon: CheckCircle2,
        tasks: completedTasks,
        headerColor: 'text-emerald-600 dark:text-emerald-400'
      })
    }

    return result
  }, [tasks])

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  if (isLoading) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Loading tasks...
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="py-16 text-center rounded-xl border border-dashed p-8 bg-card/40">
        <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground">No tasks found</h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
          Create tasks with due dates, priorities, and subtasks to keep yourself organized.
        </p>
        <Button onClick={() => onAddTask?.()} className="gap-2 text-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>Add New Task</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        if (group.tasks.length === 0 && group.id !== 'today') {
          return null
        }

        const isCollapsed = Boolean(collapsedGroups[group.id])
        const Icon = group.icon

        return (
          <div key={group.id} className="space-y-2.5">
            <div className="flex items-center justify-between group/header">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className="flex items-center gap-2 text-left font-semibold text-sm hover:text-foreground transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <Icon className={cn('h-4 w-4', group.headerColor)} />
                <span className="text-foreground">{group.title}</span>
                <Badge
                  variant={group.badgeVariant || 'secondary'}
                  className="text-[11px] h-5 px-1.5 font-normal ml-1"
                >
                  {group.tasks.length}
                </Badge>
              </button>

              {onAddTask && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask(group.defaultDate)}
                  className="h-7 px-2 text-xs text-muted-foreground opacity-0 group-hover/header:opacity-100 hover:opacity-100 hover:text-foreground transition-opacity"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Task
                </Button>
              )}
            </div>

            {!isCollapsed && (
              <div className="space-y-2 pl-2">
                {group.tasks.length === 0 ? (
                  <div className="text-xs text-muted-foreground italic py-2 pl-4">
                    No tasks for today.
                  </div>
                ) : (
                  group.tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      project={task.projectId ? projectMap.get(task.projectId) : undefined}
                      onEdit={onEditTask}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
