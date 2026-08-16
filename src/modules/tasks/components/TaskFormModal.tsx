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
import { Tag as TagIcon, X, Plus, RotateCw, Bell, Clock } from 'lucide-react'
import type {
  Task,
  PriorityLevel,
  TaskStatus,
  RecurrenceRule,
  RecurrenceFrequency,
  TaskReminder
} from '../types'
import { useProjects } from '../hooks/useProjects'
import { useCreateTask, useUpdateTask } from '../hooks/useTasks'
import { useSubtasks, useBatchUpdateSubtasks } from '../hooks/useSubtasks'
import { SubtaskList } from './SubtaskList'
import { formatRecurrenceRule } from '../utils/recurrence'

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

const WEEKDAYS = [
  { label: 'S', full: 'Sun', value: 0 },
  { label: 'M', full: 'Mon', value: 1 },
  { label: 'T', full: 'Tue', value: 2 },
  { label: 'W', full: 'Wed', value: 3 },
  { label: 'T', full: 'Thu', value: 4 },
  { label: 'F', full: 'Fri', value: 5 },
  { label: 'S', full: 'Sat', value: 6 }
]

const REMINDER_PRESETS = [
  { label: 'At due time', offset: 0 },
  { label: '5 min before', offset: 5 },
  { label: '15 min before', offset: 15 },
  { label: '30 min before', offset: 30 },
  { label: '1 hour before', offset: 60 },
  { label: '1 day before', offset: 1440 }
]

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

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [interval, setInterval] = useState(1)
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5])
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [timesOfDay, setTimesOfDay] = useState<string[]>([])
  const [timeOfDayInput, setTimeOfDayInput] = useState('')
  const [endType, setEndType] = useState<'never' | 'after_count' | 'on_date'>('never')
  const [endCount, setEndCount] = useState(5)
  const [endDate, setEndDate] = useState('')

  // Reminders state
  const [reminders, setReminders] = useState<TaskReminder[]>([])
  const [customReminderExact, setCustomReminderExact] = useState('')

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
      setEstimatedMinutes(taskToEdit.estimatedMinutes ? String(taskToEdit.estimatedMinutes) : '')
      setTags(taskToEdit.tags || [])
      setSubtasks(
        existingSubtasks.map((s) => ({
          id: s.id,
          title: s.title,
          completed: s.completed,
          order: s.order
        }))
      )
      setIsRecurring(Boolean(taskToEdit.isRecurring || taskToEdit.recurringParentId))
      if (taskToEdit.recurrence) {
        setFrequency(taskToEdit.recurrence.frequency)
        setInterval(taskToEdit.recurrence.interval || 1)
        setDaysOfWeek(taskToEdit.recurrence.daysOfWeek || [1, 2, 3, 4, 5])
        setStartTime(taskToEdit.recurrence.startTime || '09:00')
        setEndTime(taskToEdit.recurrence.endTime || '18:00')
        setTimesOfDay(taskToEdit.recurrence.timesOfDay || [])
        if (taskToEdit.recurrence.endCondition) {
          setEndType(taskToEdit.recurrence.endCondition.type)
          if (taskToEdit.recurrence.endCondition.count) {
            setEndCount(taskToEdit.recurrence.endCondition.count)
          }
          if (taskToEdit.recurrence.endCondition.endDate) {
            setEndDate(taskToEdit.recurrence.endCondition.endDate)
          }
        } else {
          setEndType('never')
        }
      }
      setReminders(taskToEdit.reminders || [])
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
      setIsRecurring(false)
      setFrequency('daily')
      setInterval(1)
      setDaysOfWeek([1, 2, 3, 4, 5])
      setStartTime('09:00')
      setEndTime('18:00')
      setTimesOfDay([])
      setEndType('never')
      setEndCount(5)
      setEndDate('')
      setReminders([])
    }
    setError(null)
    setTagInput('')
    setTimeOfDayInput('')
    setCustomReminderExact('')
  }, [taskToEdit, open, defaultDueDate, defaultProjectId, defaultStatus])

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

  const handleToggleDayOfWeek = (day: number) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== day))
      }
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort())
    }
  }

  const handleAddTimeOfDay = () => {
    if (timeOfDayInput && !timesOfDay.includes(timeOfDayInput)) {
      setTimesOfDay([...timesOfDay, timeOfDayInput].sort())
      setTimeOfDayInput('')
    }
  }

  const handleRemoveTimeOfDay = (t: string) => {
    setTimesOfDay(timesOfDay.filter((item) => item !== t))
  }

  const handleAddPresetReminder = (offsetMinutes: number) => {
    const exists = reminders.some((r) => r.type === 'offset' && r.offsetMinutes === offsetMinutes)
    if (!exists) {
      setReminders([
        ...reminders,
        {
          id: crypto.randomUUID(),
          type: 'offset',
          offsetMinutes
        }
      ])
    }
  }

  const handleAddExactReminder = () => {
    if (customReminderExact) {
      setReminders([
        ...reminders,
        {
          id: crypto.randomUUID(),
          type: 'exact',
          exactDateTime: customReminderExact
        }
      ])
      setCustomReminderExact('')
    }
  }

  const handleRemoveReminder = (id: string) => {
    setReminders(reminders.filter((r) => r.id !== id))
  }

  const buildRecurrenceRule = (): RecurrenceRule | undefined => {
    if (!isRecurring) return undefined

    const rule: RecurrenceRule = {
      frequency,
      interval: Math.max(1, interval)
    }

    if (frequency === 'hourly') {
      rule.startTime = startTime
      rule.endTime = endTime
      rule.daysOfWeek = daysOfWeek
    } else if (frequency === 'weekly') {
      rule.daysOfWeek = daysOfWeek
      if (timesOfDay.length > 0) {
        rule.timesOfDay = timesOfDay
      }
    } else if (frequency === 'daily') {
      if (timesOfDay.length > 0) {
        rule.timesOfDay = timesOfDay
      }
    }

    if (endType === 'after_count') {
      rule.endCondition = {
        type: 'after_count',
        count: Math.max(1, endCount)
      }
    } else if (endType === 'on_date' && endDate) {
      rule.endCondition = {
        type: 'on_date',
        endDate
      }
    }

    return rule
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = title.trim()

    if (!trimmedTitle) {
      setError('Task title is required')
      return
    }

    const estMins = estimatedMinutes.trim() ? parseInt(estimatedMinutes, 10) : undefined
    const recurrenceRule = buildRecurrenceRule()

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
            tags,
            isRecurring,
            recurrence: recurrenceRule,
            reminders
          }
        })

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
            isRecurring,
            recurrence: recurrenceRule,
            reminders,
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
    createTaskMutation.isPending || updateTaskMutation.isPending || batchSubtasksMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
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
              <Select value={priority} onValueChange={(val) => setPriority(val as PriorityLevel)}>
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
              <Select value={status} onValueChange={(val) => setStatus(val as TaskStatus)}>
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
                step="1"
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

          {/* Recurrence Settings Section */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  Recurring Schedule
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
              </label>
            </div>

            {isRecurring && (
              <div className="space-y-3 pt-1 border-t border-border/60">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Repeat Frequency
                    </label>
                    <Select
                      value={frequency}
                      onValueChange={(v) => setFrequency(v as RecurrenceFrequency)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly (Interval Window)</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Repeat Every
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={interval}
                        onChange={(e) =>
                          setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="h-8 text-xs"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {frequency === 'hourly'
                          ? interval === 1
                            ? 'hour'
                            : 'hours'
                          : frequency === 'daily'
                            ? interval === 1
                              ? 'day'
                              : 'days'
                            : frequency === 'weekly'
                              ? interval === 1
                                ? 'week'
                                : 'weeks'
                              : frequency === 'monthly'
                                ? interval === 1
                                  ? 'month'
                                  : 'months'
                                : interval === 1
                                  ? 'year'
                                  : 'years'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hourly time window options */}
                {frequency === 'hourly' && (
                  <div className="grid grid-cols-2 gap-3 p-2 bg-background/50 rounded border">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Window Start Time
                      </label>
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Window End Time
                      </label>
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                {/* Multiple specific times of day (Daily or Weekly) */}
                {(frequency === 'daily' || frequency === 'weekly') && (
                  <div className="space-y-1.5 p-2 bg-background/50 rounded border">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Specific Times of Day (Optional)
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={timeOfDayInput}
                        onChange={(e) => setTimeOfDayInput(e.target.value)}
                        className="h-8 text-xs flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleAddTimeOfDay}
                        disabled={!timeOfDayInput}
                        className="h-8 text-xs shrink-0"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Time
                      </Button>
                    </div>
                    {timesOfDay.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {timesOfDay.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center gap-1 text-[11px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-medium"
                          >
                            <span>@{t}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveTimeOfDay(t)}
                              className="hover:text-destructive focus:outline-none"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Day of week toggles for weekly / hourly */}
                {(frequency === 'weekly' || frequency === 'hourly') && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Repeat On Days
                    </label>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {WEEKDAYS.map((w) => {
                        const active = daysOfWeek.includes(w.value)
                        return (
                          <button
                            key={w.value}
                            type="button"
                            onClick={() => handleToggleDayOfWeek(w.value)}
                            className={`h-7 w-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
                              active
                                ? 'bg-primary text-primary-foreground shadow-xs'
                                : 'bg-muted/80 text-muted-foreground hover:bg-muted'
                            }`}
                            title={w.full}
                          >
                            {w.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* End condition */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">Ends</label>
                    <Select
                      value={endType}
                      onValueChange={(v) => setEndType(v as 'never' | 'after_count' | 'on_date')}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never ends</SelectItem>
                        <SelectItem value="after_count">After occurrences</SelectItem>
                        <SelectItem value="on_date">On specific date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {endType === 'after_count' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        Number of occurrences
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="365"
                        value={endCount}
                        onChange={(e) =>
                          setEndCount(Math.max(1, parseInt(e.target.value, 10) || 1))
                        }
                        className="h-8 text-xs"
                      />
                    </div>
                  )}

                  {endType === 'on_date' && (
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground">
                        End date
                      </label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Summary badge */}
                <div className="text-[11px] text-primary font-medium bg-primary/10 px-2 py-1 rounded">
                  {formatRecurrenceRule(buildRecurrenceRule()!)}
                </div>
              </div>
            )}
          </div>

          {/* Task Reminders Section */}
          <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Reminders & Notifications
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {REMINDER_PRESETS.map((preset) => {
                  const alreadyAdded = reminders.some(
                    (r) => r.type === 'offset' && r.offsetMinutes === preset.offset
                  )
                  return (
                    <button
                      key={preset.offset}
                      type="button"
                      disabled={alreadyAdded}
                      onClick={() => handleAddPresetReminder(preset.offset)}
                      className={`text-xs px-2 py-1 rounded border transition-colors ${
                        alreadyAdded
                          ? 'bg-muted text-muted-foreground/50 border-transparent cursor-not-allowed'
                          : 'bg-background hover:bg-primary/10 hover:text-primary border-border text-foreground'
                      }`}
                    >
                      +{preset.label}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="datetime-local"
                  value={customReminderExact}
                  onChange={(e) => setCustomReminderExact(e.target.value)}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddExactReminder}
                  disabled={!customReminderExact}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Exact
                </Button>
              </div>

              {reminders.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {reminders.map((r) => {
                    let label = ''
                    if (r.type === 'offset') {
                      const preset = REMINDER_PRESETS.find((p) => p.offset === r.offsetMinutes)
                      label = preset ? preset.label : `${r.offsetMinutes} mins before`
                    } else if (r.exactDateTime) {
                      label = `At ${r.exactDateTime.replace('T', ' ')}`
                    }
                    return (
                      <span
                        key={r.id}
                        className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-medium"
                      >
                        <Bell className="h-3 w-3" />
                        <span>{label}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReminder(r.id)}
                          className="hover:text-destructive focus:outline-none ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
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
                  placeholder="Add tag (type and tap Add)"
                  className="h-8.5 pl-8 text-xs sm:text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="h-8.5 px-3 text-xs shrink-0 min-h-[36px]"
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
                    className="inline-flex items-center gap-1.5 text-xs bg-secondary text-secondary-foreground pl-2.5 pr-1 py-0.5 rounded-md font-medium"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive focus:outline-none p-1 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3.5 w-3.5" />
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
            <SubtaskList subtasks={subtasks} onChange={setSubtasks} showProgress={true} />
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
