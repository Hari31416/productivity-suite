import { useState, useMemo, useCallback } from 'react'
import { format, parseISO } from 'date-fns'
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Calendar,
  Tag as TagIcon,
  Folder,
  Edit2,
  Trash2,
  Archive,
  ArchiveRestore,
  RotateCw,
  Bell,
  FileText,
  Plus,
  ExternalLink,
  Check,
  MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useHashRoute } from '@/core/router/hashRouter'
import { MarkdownRenderer } from '@/modules/notes/utils/markdownParser'
import { MarkdownEditor } from '@/modules/notes/components/MarkdownEditor'
import { useNotes, useCreateNote, useUpdateNote } from '@/modules/notes/hooks/useNotes'
import type { Note, CreateNoteInput, UpdateNoteInput } from '@/modules/notes/types'
import type { Task, PriorityLevel, TaskStatus } from '../types'
import {
  useUpdateTask,
  useUpdateTaskStatus,
  useArchiveTask,
  useDeleteTask
} from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { formatRecurrenceRule } from '../utils/recurrence'
import { SubtaskList } from './SubtaskList'
import { TaskFocusTimer } from './TaskFocusTimer'
import { TaskFormModal } from './TaskFormModal'
import { PRIORITY_CONFIG, STATUS_CONFIG, formatDueDate } from './TaskCard'

interface TaskDetailViewProps {
  task: Task
  onBack: () => void
}

export function TaskDetailView({ task, onBack }: TaskDetailViewProps) {
  const { navigate } = useHashRoute()
  const { data: projects = [] } = useProjects(false)
  const { data: allNotes = [] } = useNotes()

  const [activeEditingNote, setActiveEditingNote] = useState<Note | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Markdown inline editing state
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState(task.description || '')

  const updateTaskMutation = useUpdateTask()
  const updateStatusMutation = useUpdateTaskStatus()
  const archiveMutation = useArchiveTask()
  const deleteMutation = useDeleteTask()
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()

  const handleSaveNote = useCallback(
    async (
      noteData: CreateNoteInput | { id: string; input: UpdateNoteInput }
    ): Promise<Note | void> => {
      if ('id' in noteData) {
        await updateNoteMutation.mutateAsync(noteData)
      } else {
        const created = await createNoteMutation.mutateAsync(noteData)
        return created
      }
    },
    [updateNoteMutation, createNoteMutation]
  )

  const project = useMemo(() => {
    return projects.find((p) => p.id === task.projectId)
  }, [projects, task.projectId])

  const isDone = task.status === 'done'
  const isPartOfRecurringSeries = Boolean(task.isRecurring || task.recurringParentId)
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
  const dateInfo = useMemo(() => formatDueDate(task.dueDate), [task.dueDate])

  const recurrenceLabel = useMemo(() => {
    if (task.recurrence) {
      return formatRecurrenceRule(task.recurrence)
    }
    if (task.recurringParentId) {
      return 'Instance of recurring series'
    }
    return null
  }, [task.recurrence, task.recurringParentId])

  // Connected Notes: Strictly notes referencing or tagged with this specific task
  const connectedNotes = useMemo(() => {
    const taskTitleTrimmed = task.title.trim()
    const taskTagIdentifier = `task-${task.id}`

    return allNotes.filter((note) => {
      // 1. Explicit task tag
      if (note.tags?.some((t) => t.toLowerCase() === taskTagIdentifier.toLowerCase())) {
        return true
      }
      // 2. Explicit task ID reference in content
      if (note.content.includes(task.id)) {
        return true
      }
      // 3. Explicit markdown reference or note title for task
      if (
        taskTitleTrimmed.length >= 3 &&
        (note.content
          .toLowerCase()
          .includes(`# notes for task: ${taskTitleTrimmed.toLowerCase()}`) ||
          note.title.toLowerCase() === `notes: ${taskTitleTrimmed.toLowerCase()}` ||
          note.content.toLowerCase().includes(`[[${taskTitleTrimmed.toLowerCase()}]]`))
      ) {
        return true
      }
      return false
    })
  }, [allNotes, task.id, task.title])

  const handleStatusChange = (status: TaskStatus) => {
    updateStatusMutation.mutate({ id: task.id, status })
  }

  const handlePriorityChange = (priority: PriorityLevel) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { priority }
    })
  }

  const handleProjectChange = (projectId: string) => {
    const nextProjectId = projectId === 'none' ? undefined : projectId
    updateTaskMutation.mutate({
      id: task.id,
      updates: { projectId: nextProjectId }
    })
  }

  const handleToggleDone = () => {
    const nextStatus: TaskStatus = isDone ? 'todo' : 'done'
    updateStatusMutation.mutate({ id: task.id, status: nextStatus })
  }

  const handleToggleArchive = () => {
    archiveMutation.mutate({
      id: task.id,
      archived: !task.archived
    })
  }

  const handleDeleteConfirm = () => {
    deleteMutation.mutate(task.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        onBack()
      }
    })
  }

  const handleSaveDescription = () => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { description: descriptionDraft }
    })
    setIsEditingDescription(false)
  }

  const handleCancelDescription = () => {
    setDescriptionDraft(task.description || '')
    setIsEditingDescription(false)
  }

  const handleCreateConnectedNote = async () => {
    const newNote = await createNoteMutation.mutateAsync({
      title: `Notes: ${task.title}`,
      content: `# Notes for Task: ${task.title}\n\nTask ID: \`${task.id}\`\n\n- Created: ${format(new Date(), 'PPpp')}\n\n### Task Context\n- Status: **${statusInfo.label}**\n- Priority: **${priorityInfo.label}**\n\n### Notes & Execution Log\n`,
      projectId: task.projectId,
      tags: [...task.tags, `task-${task.id}`, 'task-note']
    })

    setActiveEditingNote(newNote)
  }

  // Active Note Editor/Preview View
  if (activeEditingNote) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto pb-10">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveEditingNote(null)}
            className="h-8 px-2 sm:px-3 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-1 rounded-xl font-medium"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Back to Task ({task.title})</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/notes', { noteId: activeEditingNote.id })}
            className="h-8 px-3 text-xs gap-1.5 rounded-xl font-medium"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Open in Notes</span>
          </Button>
        </div>

        <MarkdownEditor
          initialNote={activeEditingNote}
          onSave={handleSaveNote}
          onClose={() => setActiveEditingNote(null)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto pb-10">
      {/* Top Action & Navigation Bar */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="h-8 px-2 sm:px-3 gap-1 text-xs text-muted-foreground hover:text-foreground -ml-1 rounded-xl font-medium"
          aria-label="Back to tasks"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Tasks</span>
        </Button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Mark Complete Button */}
          <Button
            variant={isDone ? 'outline' : 'default'}
            size="sm"
            onClick={handleToggleDone}
            className={cn(
              'h-8 text-xs px-3 gap-1.5 font-medium rounded-xl',
              isDone && 'text-primary border-primary/40 bg-primary/5 hover:bg-primary/10'
            )}
          >
            {isDone ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Completed</span>
              </>
            ) : (
              <>
                <Circle className="h-3.5 w-3.5" />
                <span>Mark Done</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-8 px-3 text-xs gap-1.5 rounded-xl font-medium"
            aria-label="Edit task"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xl shrink-0"
                aria-label="More actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleToggleArchive} className="text-xs cursor-pointer">
                {task.archived ? (
                  <>
                    <ArchiveRestore className="h-3.5 w-3.5 mr-2" />
                    <span>Restore Task</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5 mr-2" />
                    <span>Archive Task</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-xs text-destructive focus:text-destructive cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                <span>Delete Task</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Task Hero Card: Title, Status, Priority, Project, Due Date */}
      <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {/* Status Badge */}
              <Badge
                variant="secondary"
                className="text-[11px] font-semibold px-2 py-0.5 capitalize gap-1.5"
                style={{
                  backgroundColor: `${statusInfo.color}15`,
                  color: statusInfo.color,
                  borderColor: `${statusInfo.color}30`
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: statusInfo.color }}
                />
                <span>{statusInfo.label}</span>
              </Badge>

              {/* Priority Badge */}
              <Badge
                variant="outline"
                className="text-[11px] font-medium px-2 py-0.5 gap-1.5"
                style={{
                  color: priorityInfo.color,
                  borderColor: `${priorityInfo.color}40`
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: priorityInfo.color }}
                />
                <span>{priorityInfo.label}</span>
              </Badge>

              {/* Relative Due Date Badge */}
              {task.dueDate && (
                <Badge
                  variant={dateInfo.isOverdue ? 'destructive' : 'secondary'}
                  className={cn(
                    'text-[11px] font-medium px-2 py-0.5 gap-1',
                    dateInfo.isToday && 'bg-primary/10 text-primary border-primary/30 font-semibold'
                  )}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{dateInfo.label}</span>
                  {task.dueTime && <span>· {task.dueTime}</span>}
                </Badge>
              )}

              {/* Recurrence Badge */}
              {recurrenceLabel && (
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium px-2 py-0.5 gap-1 text-primary border-primary/30 bg-primary/5"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>{recurrenceLabel}</span>
                </Badge>
              )}
            </div>

            {/* Task Title */}
            <h1
              className={cn(
                'text-xl sm:text-2xl font-bold tracking-tight text-foreground break-words',
                isDone && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </h1>
          </div>

          {/* Quick Property Switchers Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t text-xs">
            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Status</label>
              <Select
                value={task.status}
                onValueChange={(val) => handleStatusChange(val as TaskStatus)}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
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

            {/* Priority Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Priority</label>
              <Select
                value={task.priority}
                onValueChange={(val) => handlePriorityChange(val as PriorityLevel)}
              >
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="urgent">Urgent Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Project</label>
              <Select value={task.projectId || 'none'} onValueChange={handleProjectChange}>
                <SelectTrigger className="h-8 text-xs rounded-lg">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="truncate">{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date Info */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Due Date</label>
              <div className="flex items-center h-8 px-2.5 rounded-lg border bg-muted/30 text-xs text-foreground font-medium truncate">
                <Calendar className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <span className="truncate">
                  {task.dueDate ? format(parseISO(task.dueDate), 'MMM d, yyyy') : 'No Due Date'}
                </span>
              </div>
            </div>
          </div>

          {/* Tags list */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {task.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center text-[11px] font-medium bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md border"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Main Workspace Layout (2-Column on larger screens) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Subtasks & Rich Markdown Description (2/3 width) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Interactive Subtasks Checklist Card */}
          <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
            <CardHeader className="py-3 px-4 sm:px-6 border-b bg-muted/10">
              <CardTitle className="text-sm font-semibold">Subtasks Checklist</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <SubtaskList taskId={task.id} showProgress={true} />
            </CardContent>
          </Card>

          {/* Rich Markdown Description Card */}
          <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 sm:px-6 border-b bg-muted/10 space-y-0">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Task Description</CardTitle>
              </div>

              <div className="flex items-center gap-1.5">
                {isEditingDescription ? (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelDescription}
                      className="h-7 text-xs px-2.5 text-muted-foreground"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveDescription}
                      className="h-7 text-xs px-3 font-medium gap-1 rounded-lg"
                    >
                      <Check className="h-3 w-3" />
                      <span>Save</span>
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDescriptionDraft(task.description || '')
                      setIsEditingDescription(true)
                    }}
                    className="h-7 text-xs px-2.5 gap-1 rounded-lg text-muted-foreground hover:text-foreground"
                    aria-label="Edit description"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span>Edit</span>
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    value={descriptionDraft}
                    onChange={(e) => setDescriptionDraft(e.target.value)}
                    placeholder="Write detailed requirements, code snippets (```), markdown checklists (- [ ]), or links ([text](url))..."
                    className="min-h-[160px] text-xs sm:text-sm font-mono leading-relaxed"
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Markdown supported: **bold**, *italic*, `code`, ```code blocks```, - [ ]
                    checklists, tables.
                  </p>
                </div>
              ) : task.description && task.description.trim() ? (
                <div className="text-xs sm:text-sm leading-relaxed text-foreground">
                  <MarkdownRenderer content={task.description} />
                </div>
              ) : (
                <div
                  onClick={() => {
                    setDescriptionDraft('')
                    setIsEditingDescription(true)
                  }}
                  className="py-8 text-center border-2 border-dashed rounded-xl border-muted/80 hover:border-primary/40 transition-colors cursor-pointer text-xs text-muted-foreground space-y-1"
                >
                  <FileText className="h-6 w-6 mx-auto text-muted-foreground/50 mb-1" />
                  <p className="font-medium text-foreground">No description added</p>
                  <p>Click here to add markdown requirements, links, or code notes</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Context and Connected Notes Card */}
          <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 sm:px-6 border-b bg-muted/10 space-y-0">
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Connected Notes</CardTitle>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateConnectedNote}
                className="h-7 text-xs px-2.5 gap-1 rounded-lg font-medium text-primary hover:bg-primary/5"
              >
                <Plus className="h-3 w-3" />
                <span>New Note</span>
              </Button>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {connectedNotes.length > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {connectedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => setActiveEditingNote(note)}
                      className="group p-3 rounded-xl border bg-card/60 hover:bg-muted/40 hover:border-foreground/20 transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {note.title}
                        </h4>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {note.content.replace(/^#+\s+/gm, '')}
                      </p>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap pt-0.5">
                          {note.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="text-[9px] font-medium bg-muted px-1.5 py-0.2 rounded text-muted-foreground"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-1">
                  <p>No connected notes found for this task or project.</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateConnectedNote}
                    className="h-7 text-xs text-primary hover:bg-primary/5 gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Create a connected note</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Focus Timer & Execution Metadata (1/3 width) */}
        <div className="space-y-4 sm:space-y-6">
          {/* Task-Linked Focus Timer Hub */}
          <TaskFocusTimer task={task} project={project} />

          {/* Recurrence & History Metadata Card */}
          <Card className="rounded-2xl border bg-card shadow-xs overflow-hidden">
            <CardHeader className="py-3 px-4 border-b bg-muted/10">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Task Metadata & Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs">
              {/* Recurrence Info */}
              {recurrenceLabel && (
                <div className="flex items-start gap-2 text-muted-foreground pb-2 border-b">
                  <RotateCw className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">Recurrence Schedule</span>
                    <p className="text-[11px] text-muted-foreground">{recurrenceLabel}</p>
                  </div>
                </div>
              )}

              {/* Reminders Info */}
              {task.reminders && task.reminders.length > 0 && (
                <div className="flex items-start gap-2 text-muted-foreground pb-2 border-b">
                  <Bell className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-foreground">Active Reminders</span>
                    <p className="text-[11px] text-muted-foreground">
                      {task.reminders.length} scheduled reminder notification(s)
                    </p>
                  </div>
                </div>
              )}

              {/* Created / Updated / Completed Timestamps */}
              <div className="space-y-1.5 text-[11px] text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Created:</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(task.createdAt), 'MMM d, yyyy · p')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Updated:</span>
                  <span className="font-medium text-foreground">
                    {format(parseISO(task.updatedAt), 'MMM d, yyyy · p')}
                  </span>
                </div>
                {task.completedAt && (
                  <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                    <span>Completed:</span>
                    <span>{format(parseISO(task.completedAt), 'MMM d, yyyy · p')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Task Modal */}
      <TaskFormModal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} taskToEdit={task} />

      {/* In-App Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <span>Delete Task</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="text-foreground">{task.title}</strong>? All associated subtasks and
              focus time tracking will be removed.
              {isPartOfRecurringSeries && (
                <span className="block pt-1 text-amber-600 dark:text-amber-400 font-medium">
                  Note: This task is part of a recurring series.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              {isPartOfRecurringSeries ? 'Delete Series' : 'Delete Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
