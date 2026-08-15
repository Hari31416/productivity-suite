import { useState, useMemo } from 'react'
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  startOfDay
} from 'date-fns'
import {
  MoreVertical,
  CheckSquare,
  Square,
  Calendar,
  Clock,
  Tag,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  ListChecks,
  AlertTriangle
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Task, PriorityLevel, TaskStatus, Project } from '../types'
import {
  useUpdateTaskStatus,
  useArchiveTask,
  useDeleteTask
} from '../hooks/useTasks'
import { SubtaskList } from './SubtaskList'
import { useSubtasks } from '../hooks/useSubtasks'

interface TaskCardProps {
  task: Task
  project?: Project
  onEdit?: (task: Task) => void
  compact?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, task: Task) => void
  className?: string
}

export function formatDueDate(dueDateStr?: string): {
  label: string
  isOverdue: boolean
  isToday: boolean
} {
  if (!dueDateStr) return { label: '', isOverdue: false, isToday: false }

  try {
    const date = parseISO(dueDateStr)
    const taskDay = startOfDay(date)

    if (isToday(taskDay)) {
      return { label: 'Today', isOverdue: false, isToday: true }
    }
    if (isTomorrow(taskDay)) {
      return { label: 'Tomorrow', isOverdue: false, isToday: false }
    }
    if (isYesterday(taskDay)) {
      return { label: 'Yesterday', isOverdue: true, isToday: false }
    }

    const isPastDate = isPast(taskDay)
    const formatted = format(date, 'MMM d')

    return {
      label: isPastDate ? `Overdue (${formatted})` : formatted,
      isOverdue: isPastDate,
      isToday: false
    }
  } catch {
    return { label: dueDateStr, isOverdue: false, isToday: false }
  }
}

export function formatEstimatedMinutes(minutes?: number): string {
  if (!minutes || minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}h ${remainingMinutes}m`
  }
  if (hours > 0) {
    return `${hours}h`
  }
  return `${minutes}m`
}

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; badgeClass: string; dotClass: string }
> = {
  urgent: {
    label: 'Urgent',
    badgeClass: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    dotClass: 'bg-red-500'
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    dotClass: 'bg-amber-500'
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    dotClass: 'bg-blue-500'
  },
  low: {
    label: 'Low',
    badgeClass: 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-400 border-zinc-500/30',
    dotClass: 'bg-zinc-400'
  }
}

export const STATUS_CONFIG: Record<
  TaskStatus,
  { label: string; color: string }
> = {
  todo: { label: 'To Do', color: '#64748b' },
  in_progress: { label: 'In Progress', color: '#3b82f6' },
  blocked: { label: 'Blocked', color: '#ef4444' },
  done: { label: 'Done', color: '#10b981' }
}

export function TaskCard({
  task,
  project,
  onEdit,
  compact = false,
  draggable = false,
  onDragStart,
  className
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isDone = task.status === 'done'

  const updateStatusMutation = useUpdateTaskStatus()
  const archiveMutation = useArchiveTask()
  const deleteMutation = useDeleteTask()

  const { data: subtasks = [] } = useSubtasks(task.id)
  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const totalSubtasks = subtasks.length

  const dateInfo = useMemo(() => formatDueDate(task.dueDate), [task.dueDate])
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const handleToggleCompletion = () => {
    const nextStatus: TaskStatus = isDone ? 'todo' : 'done'
    updateStatusMutation.mutate({ id: task.id, status: nextStatus })
  }

  const handleStatusChange = (status: TaskStatus) => {
    updateStatusMutation.mutate({ id: task.id, status })
  }

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      className={cn(
        'group relative rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md hover:border-foreground/20',
        isDone && 'bg-muted/30 opacity-75',
        draggable && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <button
            type="button"
            onClick={handleToggleCompletion}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none flex items-center justify-center min-h-[44px] min-w-[44px] -m-2 p-2"
            aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
          >
            {isDone ? (
              <CheckSquare className="h-4 w-4 text-primary" />
            ) : (
              <Square className="h-4 w-4" />
            )}
          </button>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                onClick={() => onEdit?.(task)}
                className={cn(
                  'font-medium text-sm text-foreground hover:underline cursor-pointer break-words',
                  isDone && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </span>

              <Badge
                variant="outline"
                className={cn('text-[10px] px-1.5 py-0 h-4 font-medium', priorityInfo.badgeClass)}
              >
                {priorityInfo.label}
              </Badge>

              {project && (
                <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: project.color || '#3b82f6' }}
                  />
                  <span className="truncate max-w-[100px]">{project.name}</span>
                </div>
              )}
            </div>

            {task.description && !compact && (
              <p className="text-xs text-muted-foreground line-clamp-2 pr-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-3 pt-1 flex-wrap text-xs text-muted-foreground">
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1',
                    dateInfo.isOverdue && !isDone && 'text-destructive font-medium',
                    dateInfo.isToday && !isDone && 'text-primary font-medium'
                  )}
                >
                  {dateInfo.isOverdue && !isDone ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : (
                    <Calendar className="h-3 w-3" />
                  )}
                  <span>
                    {dateInfo.label}
                    {task.dueTime && ` at ${task.dueTime}`}
                  </span>
                </div>
              )}

              {task.estimatedMinutes && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatEstimatedMinutes(task.estimatedMinutes)}</span>
                </div>
              )}

              {totalSubtasks > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 hover:text-foreground font-medium transition-colors"
                >
                  <ListChecks className="h-3 w-3" />
                  <span>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                  {expanded ? (
                    <ChevronDown className="h-3 w-3 ml-0.5" />
                  ) : (
                    <ChevronRight className="h-3 w-3 ml-0.5" />
                  )}
                </button>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <Tag className="h-3 w-3 shrink-0" />
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] bg-secondary/80 text-secondary-foreground px-1.5 py-0.2 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-10 w-10 sm:h-7 sm:w-7 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-0 opacity-80 hover:opacity-100 group-hover:opacity-100 shrink-0"
              aria-label="Task options"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onEdit?.(task)}>
              <Edit2 className="h-3.5 w-3.5 mr-2" />
              <span>Edit Task</span>
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: STATUS_CONFIG[task.status]?.color || '#64748b'
                    }}
                  />
                  <span>Move Status</span>
                </span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={cn(task.status === status && 'font-semibold bg-muted/60')}
                  >
                    <span
                      className="h-2 w-2 rounded-full mr-2"
                      style={{ backgroundColor: STATUS_CONFIG[status].color }}
                    />
                    <span>{STATUS_CONFIG[status].label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() =>
                archiveMutation.mutate({ id: task.id, archived: !task.archived })
              }
            >
              {task.archived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                  <span>Unarchive</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5 mr-2" />
                  <span>Archive</span>
                </>
              )}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => deleteMutation.mutate(task.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5 mr-2" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && totalSubtasks > 0 && (
        <div className="mt-3 pt-3 border-t pl-6">
          <SubtaskList taskId={task.id} showProgress={false} />
        </div>
      )}
    </div>
  )
}
