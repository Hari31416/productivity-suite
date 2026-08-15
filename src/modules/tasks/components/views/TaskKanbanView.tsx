import { useState, useMemo } from 'react'
import { Plus, CheckSquare, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, TaskStatus, Project } from '../../types'
import { useUpdateTaskStatus } from '../../hooks/useTasks'
import { TaskCard } from '../TaskCard'

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
  bgColor: string
  borderColor: string
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    icon: CheckSquare,
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-500/5',
    borderColor: 'border-slate-500/20'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: Clock,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/5',
    borderColor: 'border-blue-500/20'
  },
  {
    id: 'blocked',
    title: 'Blocked',
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/5',
    borderColor: 'border-red-500/20'
  },
  {
    id: 'done',
    title: 'Done',
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-500/5',
    borderColor: 'border-emerald-500/20'
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((column) => {
        const columnTasks = tasksByColumn[column.id] || []
        const Icon = column.icon
        const isDragTarget = dragOverColumn === column.id

        return (
          <div
            key={column.id}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={(e) => handleDragLeave(e, column.id)}
            onDrop={(e) => handleDrop(e, column.id)}
            className={cn(
              'flex flex-col rounded-xl border bg-muted/20 p-3 min-h-[480px] transition-all',
              column.borderColor,
              isDragTarget && 'ring-2 ring-primary/80 bg-primary/5'
            )}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b">
              <div className="flex items-center gap-2">
                <Icon className={cn('h-4 w-4', column.color)} />
                <span className="font-semibold text-sm text-foreground">
                  {column.title}
                </span>
                <Badge variant="secondary" className="text-[11px] h-5 px-1.5 font-normal">
                  {columnTasks.length}
                </Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAddTask?.(column.id)}
                className="h-7 w-7 p-0 hover:bg-background/80"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Task list */}
            <div className="space-y-2.5 flex-1">
              {columnTasks.length === 0 ? (
                <div className="h-28 flex flex-col items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
                  <span>No tasks</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => onAddTask?.(column.id)}
                    className="text-xs h-auto p-0 mt-1"
                  >
                    + Add task
                  </Button>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectMap.get(task.projectId) : undefined}
                    onEdit={onEditTask}
                    draggable
                    onDragStart={handleDragStart}
                    compact
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
