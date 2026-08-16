import { useState, useMemo } from 'react'
import { format, parseISO, isToday, isTomorrow, isPast, startOfDay, addDays } from 'date-fns'
import {
  ChevronDown,
  ChevronRight,
  Plus,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Clock,
  Inbox,
  CheckSquare,
  Trash2,
  Folder,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Task, Project } from '../../types'
import { TaskCard } from '../TaskCard'
import { useUpdateTaskStatus, useDeleteTask, useUpdateTask } from '../../hooks/useTasks'

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
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])

  const updateStatusMutation = useUpdateTaskStatus()
  const deleteTaskMutation = useDeleteTask()
  const updateTaskMutation = useUpdateTask()

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

  const handleToggleSelect = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    )
  }

  const handleSelectAll = () => {
    setSelectedTaskIds(tasks.map((t) => t.id))
  }

  const handleDeselectAll = () => {
    setSelectedTaskIds([])
  }

  const handleBatchMarkDone = () => {
    for (const taskId of selectedTaskIds) {
      updateStatusMutation.mutate({ id: taskId, status: 'done' })
    }
    setSelectedTaskIds([])
    setIsSelectMode(false)
  }

  const handleBatchDelete = () => {
    for (const taskId of selectedTaskIds) {
      deleteTaskMutation.mutate(taskId)
    }
    setSelectedTaskIds([])
    setIsSelectMode(false)
  }

  const handleBatchMoveProject = (projectId: string | undefined) => {
    for (const taskId of selectedTaskIds) {
      const task = tasks.find((t) => t.id === taskId)
      if (task) {
        updateTaskMutation.mutate({
          id: taskId,
          updates: {
            projectId: projectId || undefined
          }
        })
      }
    }
    setSelectedTaskIds([])
    setIsSelectMode(false)
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Loading tasks...</div>
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
    <div className="space-y-6 pb-16">
      {/* Top list mode controls */}
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="text-xs text-muted-foreground">
          {isSelectMode ? (
            <span>
              <strong>{selectedTaskIds.length}</strong> of {tasks.length} selected
            </span>
          ) : (
            <span>
              {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} total
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isSelectMode ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs px-2.5"
                onClick={
                  selectedTaskIds.length === tasks.length ? handleDeselectAll : handleSelectAll
                }
              >
                {selectedTaskIds.length === tasks.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs px-2.5"
                onClick={() => {
                  setIsSelectMode(false)
                  setSelectedTaskIds([])
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2.5 gap-1.5"
              onClick={() => setIsSelectMode(true)}
            >
              <CheckSquare className="h-3.5 w-3.5" />
              <span>Select</span>
            </Button>
          )}
        </div>
      </div>

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

              {onAddTask && !isSelectMode && (
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
                      selectable={isSelectMode}
                      isSelected={selectedTaskIds.includes(task.id)}
                      onToggleSelect={handleToggleSelect}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Floating Batch Actions Bar */}
      {isSelectMode && selectedTaskIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 px-4 rounded-xl border bg-background/95 backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-4 duration-200 max-w-[95vw] flex-wrap justify-center">
          <span className="text-xs font-semibold px-1 text-foreground shrink-0">
            {selectedTaskIds.length} selected
          </span>

          <Button
            type="button"
            size="sm"
            onClick={handleBatchMarkDone}
            className="h-9 sm:h-8 px-3 text-xs gap-1.5 font-medium bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Mark Done</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 sm:h-8 px-3 text-xs gap-1.5 font-medium shrink-0"
              >
                <Folder className="h-3.5 w-3.5" />
                <span>Move Project</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              <DropdownMenuItem onClick={() => handleBatchMoveProject(undefined)}>
                <span>No Project</span>
              </DropdownMenuItem>
              {projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => handleBatchMoveProject(p.id)}>
                  <span
                    className="h-2 w-2 rounded-full mr-2"
                    style={{ backgroundColor: p.color || '#3b82f6' }}
                  />
                  <span className="truncate">{p.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleBatchDelete}
            className="h-9 sm:h-8 px-3 text-xs gap-1.5 font-medium shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            className="h-9 sm:h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0"
            title="Deselect all"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
