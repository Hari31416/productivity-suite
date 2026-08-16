import { useState } from 'react'
import { Plus, Trash2, CheckSquare, Square, ArrowUp, ArrowDown, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  useSubtasks,
  useCreateSubtask,
  useToggleSubtask,
  useDeleteSubtask,
  useBatchUpdateSubtasks
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
  const batchUpdateMutation = useBatchUpdateSubtasks()

  const subtasks: SubtaskItem[] = isLive ? liveSubtasks : externalSubtasks || []

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

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (readOnly) return
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= subtasks.length) return

    const newSubtasks = [...subtasks]
    const [moved] = newSubtasks.splice(index, 1)
    newSubtasks.splice(targetIndex, 0, moved)

    const reordered = newSubtasks.map((item, i) => ({
      ...item,
      order: i
    }))

    if (isLive && taskId) {
      batchUpdateMutation.mutate({
        taskId,
        subtasks: reordered.map((item, i) => ({
          id: item.id,
          title: item.title,
          completed: item.completed,
          order: i
        }))
      })
    } else if (onChange) {
      onChange(reordered)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {showProgress && totalCount > 0 && (
        <div className="space-y-1.5 rounded-xl border bg-card/60 p-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <ListChecks className="h-3.5 w-3.5 text-primary" />
              <span>Subtasks Checklist</span>
            </div>
            <Badge variant="secondary" className="text-[11px] font-medium h-5">
              {completedCount} of {totalCount} completed ({progress}%)
            </Badge>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="space-y-1.5">
          {subtasks.map((subtask, index) => (
            <div
              key={subtask.id || index}
              className="flex items-center justify-between gap-2 p-1.5 sm:p-2 rounded-lg border bg-card/70 hover:bg-muted/40 transition-colors text-sm group"
            >
              <button
                type="button"
                disabled={readOnly}
                onClick={() => handleToggle(index, subtask)}
                className="flex items-center gap-2.5 flex-1 min-w-0 min-h-[36px] sm:min-h-[28px] text-left cursor-pointer disabled:cursor-default"
              >
                {subtask.completed ? (
                  <CheckSquare className="h-4 w-4 text-primary shrink-0" />
                ) : (
                  <Square className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    'text-xs sm:text-sm text-foreground break-words leading-tight',
                    subtask.completed && 'line-through text-muted-foreground'
                  )}
                >
                  {subtask.title}
                </span>
              </button>

              {!readOnly && (
                <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 shrink-0">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Move up"
                    aria-label="Move subtask up"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={index === subtasks.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    title="Move down"
                    aria-label="Move subtask down"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index, subtask)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete subtask"
                    aria-label="Delete subtask"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
            className="h-8 sm:h-9 text-xs sm:text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleAdd}
            disabled={!newTitle.trim()}
            className="h-8 sm:h-9 px-3 text-xs shrink-0 font-medium"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  )
}
