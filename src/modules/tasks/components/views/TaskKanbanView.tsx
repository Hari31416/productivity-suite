import { useState, useMemo } from 'react'
import {
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Circle,
  MoreVertical,
  ArrowRight,
  ArrowLeft
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
import { format, parseISO } from 'date-fns'
import type { Task, TaskStatus, Project } from '../../types'
import { useUpdateTaskStatus, useDeleteTask } from '../../hooks/useTasks'
import { PRIORITY_CONFIG } from '../TaskCard'

interface TaskKanbanViewProps {
  tasks: Task[]
  projects: Project[]
  onEditTask: (task: Task) => void
  onAddTask?: (defaultStatus?: TaskStatus) => void
}

interface KanbanColumn {
  id: TaskStatus
  title: string
  icon: typeof CheckSquare
  color: string
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    icon: CheckSquare,
    color: 'text-slate-600 dark:text-slate-400'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400'
  },
  {
    id: 'blocked',
    title: 'Blocked',
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400'
  },
  {
    id: 'done',
    title: 'Done',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400'
  }
]

export function TaskKanbanView({
  tasks,
  projects,
  onEditTask,
  onAddTask
}: TaskKanbanViewProps) {
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  const updateStatusMutation = useUpdateTaskStatus()
  const deleteTaskMutation = useDeleteTask()

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>()
    for (const p of projects) {
      map.set(p.id, p)
    }
    return map
  }, [projects])

  const tasksByColumn = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      blocked: [],
      done: []
    }
    for (const task of tasks) {
      if (map[task.status]) {
        map[task.status].push(task)
      } else {
        map.todo.push(task)
      }
    }
    return map
  }, [tasks])

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('text/plain', task.id)
    setDraggedTaskId(task.id)
  }

  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId)
    }
  }

  const handleDragLeave = (_e: React.DragEvent, columnId: TaskStatus) => {
    if (dragOverColumn === columnId) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId
    setDragOverColumn(null)
    setDraggedTaskId(null)

    if (taskId) {
      const task = tasks.find((t) => t.id === taskId)
      if (task && task.status !== columnId) {
        updateStatusMutation.mutate({ id: taskId, status: columnId })
      }
    }
  }

  const getAdjacentStatuses = (currentStatus: TaskStatus): { prev?: TaskStatus; next?: TaskStatus } => {
    const order: TaskStatus[] = ['todo', 'in_progress', 'blocked', 'done']
    const idx = order.indexOf(currentStatus)
    return {
      prev: idx > 0 ? order[idx - 1] : undefined,
      next: idx < order.length - 1 ? order[idx + 1] : undefined
    }
  }

  return (
    <div className="w-full">
      {/* Horizontal Multi-Column Board (Side-by-side with swipeable horizontal scroll on mobile) */}
      <div className="flex flex-row overflow-x-auto snap-x snap-mandatory gap-3 sm:gap-4 pb-6 pt-1 px-1 scrollbar-none items-start">
        {COLUMNS.map((column) => {
          const columnTasks = tasksByColumn[column.id] || []
          const isDragTarget = dragOverColumn === column.id

          return (
            <div
              key={column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={(e) => handleDragLeave(e, column.id)}
              onDrop={(e) => handleDrop(e, column.id)}
              className={cn(
                'w-[82vw] sm:w-[300px] md:w-[320px] lg:flex-1 shrink-0 snap-start flex flex-col rounded-2xl border bg-muted/20 p-3 sm:p-3.5 min-h-[480px] transition-all shadow-2xs',
                isDragTarget && 'ring-2 ring-primary/80 bg-primary/5'
              )}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-foreground">
                    {column.title}
                  </span>
                  <Badge variant="secondary" className="text-[11px] h-5 px-2 font-bold rounded-full bg-muted-foreground/15 text-foreground">
                    {columnTasks.length}
                  </Badge>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask?.(column.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-full"
                  aria-label={`Add task to ${column.title}`}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Task list */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-0.5">
                {columnTasks.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/20 text-xs text-muted-foreground">
                    <span>No tasks in {column.title}</span>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => onAddTask?.(column.id)}
                      className="text-xs h-auto p-0 mt-1 text-primary"
                    >
                      + Add task
                    </Button>
                  </div>
                ) : (
                  columnTasks.map((task) => {
                    const priority = PRIORITY_CONFIG[task.priority]
                    const project = task.projectId ? projectMap.get(task.projectId) : undefined
                    const formattedDueDate = task.dueDate
                      ? format(parseISO(task.dueDate), 'MMM d')
                      : undefined
                    const { prev, next } = getAdjacentStatuses(task.status)

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => onEditTask(task)}
                        className={cn(
                          'group rounded-2xl border bg-card p-3.5 shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all cursor-pointer space-y-2.5 select-none',
                          task.status === 'done' && 'opacity-65 bg-muted/25'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={cn(
                              'font-semibold text-xs sm:text-sm leading-snug text-foreground',
                              task.status === 'done' && 'line-through text-muted-foreground'
                            )}
                          >
                            {task.title}
                          </h4>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Mobile Quick Move / Context Menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-6 w-6 flex items-center justify-center text-muted-foreground/50 hover:text-foreground rounded-full hover:bg-muted/40 transition-colors"
                                  aria-label="Task options"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="text-xs">
                                {prev && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateStatusMutation.mutate({ id: task.id, status: prev })
                                    }}
                                  >
                                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                                    <span>Move to {COLUMNS.find((c) => c.id === prev)?.title}</span>
                                  </DropdownMenuItem>
                                )}
                                {next && (
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      updateStatusMutation.mutate({ id: task.id, status: next })
                                    }}
                                  >
                                    <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                                    <span>Move to {COLUMNS.find((c) => c.id === next)?.title}</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEditTask(task)
                                  }}
                                >
                                  Edit Task
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteTaskMutation.mutate(task.id)
                                  }}
                                  className="text-destructive"
                                >
                                  Delete Task
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateStatusMutation.mutate({
                                  id: task.id,
                                  status: task.status === 'done' ? 'todo' : 'done'
                                })
                              }}
                              className="text-muted-foreground hover:text-primary transition-colors shrink-0 pt-0.5"
                            >
                              {task.status === 'done' ? (
                                <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                              ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/50 hover:text-primary" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Project Tag if available */}
                        {project && (
                          <div>
                            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0 h-4">
                              {project.name}
                            </Badge>
                          </div>
                        )}

                        {/* Footer: Due Date & Priority Dot */}
                        <div className="flex items-center justify-between text-xs pt-1 text-muted-foreground">
                          {formattedDueDate ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                              <Calendar className="h-3 w-3" />
                              <span>{formattedDueDate}</span>
                            </span>
                          ) : (
                            <span />
                          )}

                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium capitalize">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: priority?.color || '#10b981' }}
                            />
                            <span>{task.priority}</span>
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Bottom Add Task Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddTask?.(column.id)}
                className="w-full mt-3 text-xs font-semibold gap-1.5 rounded-xl border-dashed hover:border-solid hover:bg-background"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task</span>
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
