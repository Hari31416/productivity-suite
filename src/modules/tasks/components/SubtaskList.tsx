import { useState } from 'react'
import { Plus, Trash2, CheckSquare, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  useSubtasks,
  useCreateSubtask,
  useToggleSubtask,
  useDeleteSubtask
} from '../hooks/useSubtasks'

interface SubtaskItem {
  id?: string
  title: string
  completed: boolean
  order?: number
}

interface SubtaskListProps {
  taskId?: string
  subtasks?: SubtaskItem[]
  onChange?: (subtasks: SubtaskItem[]) => void
  readOnly?: boolean
  showProgress?: boolean
  className?: string
}

export function SubtaskList({
  taskId,
  subtasks: externalSubtasks,
  onChange,
  readOnly = false,
  showProgress = true,
  className
}: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState('')

  const isLive = Boolean(taskId && !externalSubtasks)
  const { data: liveSubtasks = [] } = useSubtasks(taskId || '')
  const createMutation = useCreateSubtask()
  const toggleMutation = useToggleSubtask()
  const deleteMutation = useDeleteSubtask()

  const subtasks: SubtaskItem[] = isLive
    ? liveSubtasks
    : externalSubtasks || []

  const completedCount = subtasks.filter((s) => s.completed).length
  const totalCount = subtasks.length
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleAdd = () => {
    const trimmed = newTitle.trim()
    if (!trimmed) return

    if (isLive && taskId) {
      createMutation.mutate({ taskId, title: trimmed })
    } else if (onChange) {
      const newItem: SubtaskItem = {
        id: crypto.randomUUID(),
        title: trimmed,
        completed: false,
        order: subtasks.length
      }
      onChange([...subtasks, newItem])
    }

    setNewTitle('')
  }

  const handleToggle = (index: number, subtask: SubtaskItem) => {
    if (readOnly) return

    if (isLive && subtask.id && taskId) {
      toggleMutation.mutate({ id: subtask.id, taskId })
    } else if (onChange) {
      const updated = subtasks.map((item, i) =>
        i === index ? { ...item, completed: !item.completed } : item
      )
      onChange(updated)
    }
  }

  const handleDelete = (index: number, subtask: SubtaskItem) => {
    if (readOnly) return

    if (isLive && subtask.id && taskId) {
      deleteMutation.mutate({ id: subtask.id, taskId })
    } else if (onChange) {
      const updated = subtasks.filter((_, i) => i !== index)
      onChange(updated)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {showProgress && totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Subtasks progress</span>
            <span className="font-medium text-foreground">
              {completedCount} of {totalCount} completed ({progress}%)
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="space-y-1.5">
          {subtasks.map((subtask, index) => (
            <div
              key={subtask.id || index}
              className="flex items-center justify-between gap-2 p-1.5 rounded-md border bg-card/60 hover:bg-muted/40 transition-colors text-sm group"
            >
              <button
                type="button"
                disabled={readOnly}
                onClick={() => handleToggle(index, subtask)}
                className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer disabled:cursor-default"
              >
                {subtask.completed ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    'truncate text-xs sm:text-sm',
                    subtask.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {subtask.title}
                </span>
              </button>

              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(index, subtask)}
                  className="h-6 w-6 p-0 opacity-70 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAdd()
              }
            }}
            placeholder="Add a subtask..."
            className="h-8 text-xs sm:text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="h-8 px-2.5 text-xs shrink-0"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
