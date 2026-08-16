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
  AlertTriangle,
  GripVertical,
  RotateCw,
  Bell
} from 'lucide-react'
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
import { formatRecurrenceRule } from '../utils/recurrence'

interface TaskCardProps {
  task: Task
  project?: Project
  onEdit?: (task: Task) => void
  compact?: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent, task: Task) => void
  className?: string
  selectable?: boolean
  isSelected?: boolean
  onToggleSelect?: (taskId: string) => void
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
      return { label: 'Tom', isOverdue: false, isToday: false }
    }
    if (isYesterday(taskDay)) {
      return { label: 'Yest', isOverdue: true, isToday: false }
    }

    const isPastDate = isPast(taskDay)
    const formatted = format(date, 'MMM d')

    return {
      label: formatted,
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
  return `${remainingMinutes}m`
}

export const PRIORITY_CONFIG: Record<
  PriorityLevel,
  { label: string; dotClass: string; borderClass: string; color: string }
> = {
  urgent: {
    label: 'Urgent Priority',
    dotClass: 'bg-red-500 ring-red-500/20',
    borderClass: 'border-l-red-500',
    color: '#ef4444'
  },
  high: {
    label: 'High Priority',
    dotClass: 'bg-amber-500 ring-amber-500/20',
    borderClass: 'border-l-amber-500',
    color: '#f59e0b'
  },
  medium: {
    label: 'Medium Priority',
    dotClass: 'bg-blue-500 ring-blue-500/20',
    borderClass: 'border-l-blue-500',
    color: '#3b82f6'
  },
  low: {
    label: 'Low Priority',
    dotClass: 'bg-emerald-500 ring-emerald-500/20',
    borderClass: 'border-l-emerald-500',
    color: '#10b981'
  }
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
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
  className,
  selectable = false,
  isSelected = false,
  onToggleSelect
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isDone = task.status === 'done'
  const isPartOfRecurringSeries = Boolean(task.isRecurring || task.recurringParentId)

  const updateStatusMutation = useUpdateTaskStatus()
  const archiveMutation = useArchiveTask()
  const deleteMutation = useDeleteTask()

  const { data: subtasks = [] } = useSubtasks(task.id)
  const completedSubtasks = subtasks.filter((s) => s.completed).length
  const totalSubtasks = subtasks.length

  const dateInfo = useMemo(() => formatDueDate(task.dueDate), [task.dueDate])
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const recurrenceLabel = useMemo(() => {
    if (task.recurrence) {
      return formatRecurrenceRule(task.recurrence)
    }
    if (task.recurringParentId) {
      return 'Recurring instance'
    }
    return ''
  }, [task.recurrence, task.recurringParentId])

  const reminderCount = task.reminders ? task.reminders.length : 0

  const handleToggleCompletion = () => {
    const nextStatus: TaskStatus = isDone ? 'todo' : 'done'
    updateStatusMutation.mutate({ id: task.id, status: nextStatus })
  }

  const handleStatusChange = (status: TaskStatus) => {
    updateStatusMutation.mutate({ id: task.id, status })
  }

  return (
    <div
      id={`task-card-${task.id}`}
      data-task-id={task.id}
      draggable={draggable}
      onDragStart={(e) => onDragStart?.(e, task)}
      className={cn(
        'group relative rounded-lg border bg-card shadow-xs transition-all hover:shadow-sm hover:border-foreground/20',
        compact ? 'p-2' : 'p-2 sm:p-2.5',
        isDone && 'bg-muted/30 opacity-75',
        isSelected && 'border-primary ring-2 ring-primary/20 bg-primary/5',
        draggable && 'cursor-grab active:cursor-grabbing',
        className
      )}
    >
      <div className="flex items-start justify-between gap-1.5">
        <div className="flex items-start gap-1.5 flex-1 min-w-0">
          {draggable && (
            <div className="hidden sm:block text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0 pt-0.5">
              <GripVertical className="h-3.5 w-3.5" />
            </div>
          )}
          {selectable ? (
            <button
              type="button"
              onClick={() => onToggleSelect?.(task.id)}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none flex items-center justify-center min-h-[32px] min-w-[32px] -m-1 p-1"
              aria-label={isSelected ? 'Deselect task' : 'Select task'}
            >
              {isSelected ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4 text-muted-foreground/60" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleToggleCompletion}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none flex items-center justify-center min-h-[32px] min-w-[32px] -m-1 p-1"
              aria-label={isDone ? 'Mark task incomplete' : 'Mark task complete'}
            >
              {isDone ? (
                <CheckSquare className="h-4 w-4 text-primary" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          )}

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Priority indicator dot */}
              <span
                title={priorityInfo.label}
                aria-label={priorityInfo.label}
                className={cn(
                  'h-2 w-2 rounded-full ring-2 shrink-0 cursor-help',
                  priorityInfo.dotClass
                )}
              />

              <span
                onClick={() => onEdit?.(task)}
                className={cn(
                  'font-medium text-xs sm:text-sm text-foreground hover:underline cursor-pointer break-words leading-tight',
                  isDone && 'line-through text-muted-foreground'
                )}
              >
                {task.title}
              </span>

              {/* Icon-only Recurrence Indicator */}
              {isPartOfRecurringSeries && (
                <span
                  title={recurrenceLabel || 'Recurring task'}
                  className="inline-flex items-center text-primary hover:opacity-80 transition-opacity shrink-0 cursor-help"
                >
                  <RotateCw className="h-3 w-3 shrink-0" />
                </span>
              )}

              {/* Icon-only Reminder Indicator */}
              {reminderCount > 0 && (
                <span
                  title={`${reminderCount} active reminder(s)`}
                  className="inline-flex items-center text-amber-500 hover:opacity-80 transition-opacity shrink-0 cursor-help"
                >
                  <Bell className="h-3 w-3 shrink-0" />
                </span>
              )}

              {/* Compact Project Tag */}
              {project && (
                <span
                  title={project.name}
                  className="inline-flex items-center gap-1 text-[9px] font-medium text-muted-foreground bg-muted/60 px-1 py-0 h-3.5 rounded shrink-0 whitespace-nowrap max-w-[90px] truncate"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: project.color || '#3b82f6' }}
                  />
                  <span className="truncate">{project.name}</span>
                </span>
              )}
            </div>

            {task.description && !compact && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Meta badges: due date, subtasks, tags, estimated minutes */}
            <div className="flex items-center gap-2 pt-0.5 flex-wrap text-xs text-muted-foreground">
              {task.dueDate && (
                <div
                  className={cn(
                    'flex items-center gap-1 font-medium whitespace-nowrap shrink-0 text-[11px]',
                    dateInfo.isOverdue && 'text-red-600 dark:text-red-400 font-semibold',
                    dateInfo.isToday && 'text-blue-600 dark:text-blue-400 font-semibold'
                  )}
                >
                  {dateInfo.isOverdue ? (
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                  ) : (
                    <Calendar className="h-3 w-3 shrink-0" />
                  )}
                  <span>
                    {dateInfo.label}
                    {task.dueTime ? ` @ ${task.dueTime}` : ''}
                  </span>
                </div>
              )}

              {totalSubtasks > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 hover:text-foreground transition-colors font-medium text-[11px] whitespace-nowrap shrink-0"
                >
                  <ListChecks className="h-3 w-3 shrink-0" />
                  <span>
                    {completedSubtasks}/{totalSubtasks}
                  </span>
                  {expanded ? (
                    <ChevronDown className="h-2.5 w-2.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-2.5 w-2.5 shrink-0" />
                  )}
                </button>
              )}

              {task.estimatedMinutes && task.estimatedMinutes > 0 && (
                <div className="flex items-center gap-1 text-[11px] whitespace-nowrap shrink-0">
                  <Clock className="h-3 w-3 shrink-0" />
                  <span>{formatEstimatedMinutes(task.estimatedMinutes)}</span>
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center text-[9px] text-muted-foreground bg-muted/60 px-1 py-0 rounded whitespace-nowrap shrink-0"
                    >
                      <Tag className="h-2 w-2 mr-0.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right action menus */}
        <div className="flex items-center gap-1 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0"
                aria-label="Task options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>
                <Edit2 className="h-3.5 w-3.5 mr-2" />
                Edit Task
              </DropdownMenuItem>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <span className="text-xs">Change Status</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleStatusChange('todo')}>
                    To Do
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('in_progress')}>
                    In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('blocked')}>
                    Blocked
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('done')}>
                    Done
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: task.id, archived: !task.archived })}>
                {task.archived ? (
                  <>
                    <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                    Restore Task
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5 mr-2" />
                    Archive Task
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => deleteMutation.mutate(task.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {isPartOfRecurringSeries ? 'Delete This Task' : 'Delete Task'}
              </DropdownMenuItem>

              {isPartOfRecurringSeries && (
                <DropdownMenuItem
                  onClick={() =>
                    deleteMutation.mutate({
                      id: task.id,
                      deleteAllOccurrences: true
                    })
                  }
                  className="text-destructive focus:text-destructive font-medium"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Entire Series
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Expandable Subtasks Checklist */}
      {expanded && (
        <div className="mt-2 pt-2 border-t pl-5">
          <SubtaskList taskId={task.id} />
        </div>
      )}
    </div>
  )
}
