import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tag as TagIcon, X, Plus } from 'lucide-react'
import type { Task, PriorityLevel, TaskStatus } from '../types'
import { useProjects } from '../hooks/useProjects'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { useSubtasks, useBatchUpdateSubtasks } from '../hooks/useSubtasks'
import { SubtaskList } from './SubtaskList'

interface TaskFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToEdit?: Task | null
  defaultDueDate?: string
  defaultProjectId?: string
  defaultStatus?: TaskStatus
  onSuccess?: (task: Task) => void
}

interface SubtaskDraft {
  id?: string
  title: string
  completed: boolean
  order?: number
}

export function TaskFormModal({
  open,
  onOpenChange,
  taskToEdit,
  defaultDueDate,
  defaultProjectId,
  defaultStatus,
  onSuccess
}: TaskFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState<string>('none')
  const [priority, setPriority] = useState<PriorityLevel>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [subtasks, setSubtasks] = useState<SubtaskDraft[]>([])
  const [error, setError] = useState<string | null>(null)

  const { data: projects = [] } = useProjects(false)
  const { data: existingSubtasks = [] } = useSubtasks(taskToEdit?.id || '')

  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const batchSubtasksMutation = useBatchUpdateSubtasks()

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title)
      setDescription(taskToEdit.description || '')
      setProjectId(taskToEdit.projectId || 'none')
      setPriority(taskToEdit.priority)
      setStatus(taskToEdit.status)
      setDueDate(taskToEdit.dueDate || '')
      setDueTime(taskToEdit.dueTime || '')
      setEstimatedMinutes(
        taskToEdit.estimatedMinutes ? String(taskToEdit.estimatedMinutes) : ''
      )
      setTags(taskToEdit.tags || [])
      setSubtasks(
        existingSubtasks.map((s) => ({
          id: s.id,
          title: s.title,
          completed: s.completed,
          order: s.order
        }))
      )
    } else {
      setTitle('')
      setDescription('')
      setProjectId(defaultProjectId || 'none')
      setPriority('medium')
      setStatus(defaultStatus || 'todo')
      setDueDate(defaultDueDate || '')
      setDueTime('')
      setEstimatedMinutes('')
      setTags([])
      setSubtasks([])
    }
    setError(null)
    setTagInput('')
  }, [taskToEdit, open, defaultDueDate, defaultProjectId, defaultStatus])

  // Sync subtasks if editing and existingSubtasks loads
  useEffect(() => {
    if (taskToEdit && existingSubtasks.length > 0 && subtasks.length === 0) {
      setSubtasks(
        existingSubtasks.map((s) => ({
          id: s.id,
          title: s.title,
          completed: s.completed,
          order: s.order
        }))
      )
    }
  }, [existingSubtasks, taskToEdit])

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Task title is required')
      return
    }

    const estMins = estimatedMinutes.trim() ? parseInt(estimatedMinutes, 10) : undefined

    try {
      if (taskToEdit) {
        const updated = await updateTaskMutation.mutateAsync({
          id: taskToEdit.id,
          updates: {
            title: trimmedTitle,
            description: description.trim() || undefined,
            projectId: projectId === 'none' ? undefined : projectId,
            priority,
            status,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            estimatedMinutes: isNaN(Number(estMins)) ? undefined : estMins,
            tags
          }
        })

        // Also batch update subtasks if modified
        if (subtasks.length > 0 || (existingSubtasks && existingSubtasks.length > 0)) {
          await batchSubtasksMutation.mutateAsync({
            taskId: taskToEdit.id,
            subtasks: subtasks.map((s, index) => ({
              id: s.id,
              title: s.title,
              completed: s.completed,
              order: index
            }))
          })
        }

        onSuccess?.(updated)
      } else {
        const created = await createTaskMutation.mutateAsync({
          taskData: {
            title: trimmedTitle,
            description: description.trim() || undefined,
            projectId: projectId === 'none' ? undefined : projectId,
            priority,
            status,
            dueDate: dueDate || undefined,
            dueTime: dueTime || undefined,
            estimatedMinutes: isNaN(Number(estMins)) ? undefined : estMins,
            tags,
            archived: false
          },
          initialSubtasks: subtasks.map((s) => ({
            title: s.title,
            completed: s.completed
          }))
        })
        onSuccess?.(created)
      }

      onOpenChange(false)
    } catch (err) {
      setError('Failed to save task. Please try again.')
    }
  }

  const isPending =
    createTaskMutation.isPending ||
    updateTaskMutation.isPending ||
    batchSubtasksMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{taskToEdit ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="p-2 text-xs rounded bg-destructive/15 text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Task Title *
            </label>
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (error) setError(null)
              }}
              placeholder="What needs to be done?"
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional context, notes, or links..."
              rows={2}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs sm:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Project
              </label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || '#3b82f6' }}
                        />
                        <span className="truncate">{proj.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as PriorityLevel)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as TaskStatus)}
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Estimated Time (Mins)
              </label>
              <Input
                type="number"
                min="1"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="e.g. 30"
                className="h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Due Time (Optional)
              </label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tags
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <TagIcon className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                  placeholder="Type tag and press Enter"
                  className="h-8.5 pl-8 text-xs sm:text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="h-8.5 px-2.5 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Tag
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive focus:outline-none"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5 pt-1 border-t">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Subtasks Checklist
            </label>
            <SubtaskList
              subtasks={subtasks}
              onChange={setSubtasks}
              showProgress={true}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
