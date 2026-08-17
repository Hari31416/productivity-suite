import { useState, useRef } from 'react'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useCreateNote } from '../hooks/useNotes'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { useTasks } from '@/modules/tasks/hooks/useTasks'
import { useHabits } from '@/modules/habits/hooks/useHabits'
import { useTags } from '../hooks/useTags'
import { MarkdownRenderer } from '../utils/markdownParser'
import { Tag as TagIcon, X, CheckSquare, Activity, AtSign, Hash } from 'lucide-react'

interface NoteFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRESET_NOTE_COLORS = [
  { label: 'None', value: '' },
  { label: 'Red', value: '#ef4444' },
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Green', value: '#10b981' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Purple', value: '#8b5cf6' },
  { label: 'Pink', value: '#ec4899' }
]

export function NoteFormModal({ open, onOpenChange }: NoteFormModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [preview, setPreview] = useState(false)
  const [projectId, setProjectId] = useState<string | undefined>(undefined)
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(undefined)
  const [linkedHabitId, setLinkedHabitId] = useState<string | undefined>(undefined)
  const [color, setColor] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const { data: projects = [] } = useProjects()
  const { data: allTasks = [] } = useTasks()
  const { data: allHabits = [] } = useHabits(false)
  const { data: availableTags = [] } = useTags()
  const createNoteMutation = useCreateNote()

  const [mentionQuery, setMentionQuery] = useState<{
    type: 'task' | 'habit'
    query: string
    index: number
  } | null>(null)

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value
    setContent(newVal)

    const cursor = e.target.selectionStart
    const textBeforeCursor = newVal.slice(0, cursor)
    const taskMatch = textBeforeCursor.match(/@([a-zA-Z0-9_\s-]{0,25})$/)
    const habitMatch = textBeforeCursor.match(/#([a-zA-Z0-9_\s-]{0,25})$/)

    if (taskMatch && !taskMatch[0].includes('\n')) {
      setMentionQuery({
        type: 'task',
        query: taskMatch[1].trim().toLowerCase(),
        index: taskMatch.index!
      })
    } else if (habitMatch && !habitMatch[0].includes('\n') && !habitMatch[0].startsWith('##')) {
      setMentionQuery({
        type: 'habit',
        query: habitMatch[1].trim().toLowerCase(),
        index: habitMatch.index!
      })
    } else {
      setMentionQuery(null)
    }
  }

  const handleApplyMention = (item: { id: string; title: string; type: 'task' | 'habit' }) => {
    if (!mentionQuery || !textareaRef.current) return
    const textarea = textareaRef.current
    const cursor = textarea.selectionStart
    const before = content.slice(0, mentionQuery.index)
    const after = content.slice(cursor)
    const tag =
      item.type === 'task'
        ? `@[${item.title}](task:${item.id}) `
        : `#[${item.title}](habit:${item.id}) `
    const updated = before + tag + after
    setContent(updated)
    setMentionQuery(null)
    setTimeout(() => {
      textarea.focus()
      const newPos = before.length + tag.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleInsertMention = (item: { id: string; title: string; type: 'task' | 'habit' }) => {
    const textarea = textareaRef.current
    if (!textarea) {
      const tag =
        item.type === 'task'
          ? `@[${item.title}](task:${item.id}) `
          : `#[${item.title}](habit:${item.id}) `
      setContent((prev) => prev + tag)
      return
    }
    const cursor = textarea.selectionStart
    const tag =
      item.type === 'task'
        ? `@[${item.title}](task:${item.id}) `
        : `#[${item.title}](habit:${item.id}) `
    const updated = content.slice(0, cursor) + tag + content.slice(cursor)
    setContent(updated)
    setTimeout(() => {
      textarea.focus()
      const newPos = cursor + tag.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const matchingTasks = allTasks
    .filter(
      (t) =>
        !t.archived && (!mentionQuery?.query || t.title.toLowerCase().includes(mentionQuery.query))
    )
    .slice(0, 5)
  const matchingHabits = allHabits
    .filter(
      (h) =>
        !h.archived && (!mentionQuery?.query || h.title.toLowerCase().includes(mentionQuery.query))
    )
    .slice(0, 5)

  const handleAddTag = (tagToAdd: string) => {
    const trimmed = tagToAdd.trim().toLowerCase().replace(/^#/, '')
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
    if (!content.trim() && !title.trim()) return

    await createNoteMutation.mutateAsync({
      title: title.trim() || 'Untitled Note',
      content: content.trim(),
      tags,
      projectId: projectId || undefined,
      linkedTaskId: linkedTaskId || undefined,
      linkedHabitId: linkedHabitId || undefined,
      color: color || undefined,
      pinned: false
    })

    // Reset & close
    setTitle('')
    setContent('')
    setProjectId(undefined)
    setLinkedTaskId(undefined)
    setLinkedHabitId(undefined)
    setColor('')
    setTags([])
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Create Quick Note</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Note Title
              </label>
              <Input
                placeholder="Title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <label className="text-xs font-medium text-muted-foreground">
                    Content (Markdown)
                  </label>
                  {!preview && (
                    <div className="flex items-center gap-1">
                      {/* Mention Task dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 rounded"
                          >
                            <AtSign className="h-3 w-3" />
                            <span>Task</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-52 max-h-52 overflow-y-auto"
                        >
                          <DropdownMenuLabel className="text-xs">Mention Task</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {allTasks.filter((t) => !t.archived).length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">No active tasks</div>
                          ) : (
                            allTasks
                              .filter((t) => !t.archived)
                              .map((t) => (
                                <DropdownMenuItem
                                  key={t.id}
                                  onClick={() =>
                                    handleInsertMention({ id: t.id, title: t.title, type: 'task' })
                                  }
                                  className="text-xs flex items-center gap-2 cursor-pointer"
                                >
                                  <CheckSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                  <span className="truncate">{t.title}</span>
                                </DropdownMenuItem>
                              ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Mention Habit dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-1.5 py-0.5 rounded"
                          >
                            <Hash className="h-3 w-3" />
                            <span>Habit</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          className="w-52 max-h-52 overflow-y-auto"
                        >
                          <DropdownMenuLabel className="text-xs">Mention Habit</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {allHabits.length === 0 ? (
                            <div className="p-2 text-xs text-muted-foreground">No habits</div>
                          ) : (
                            allHabits.map((h) => (
                              <DropdownMenuItem
                                key={h.id}
                                onClick={() =>
                                  handleInsertMention({ id: h.id, title: h.title, type: 'habit' })
                                }
                                className="text-xs flex items-center gap-2 cursor-pointer"
                              >
                                <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span className="truncate">{h.title}</span>
                              </DropdownMenuItem>
                            ))
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                <div className="flex rounded border bg-muted p-0.5 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreview(false)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      !preview ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreview(true)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      preview ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    Preview
                  </button>
                </div>
              </div>

              {preview ? (
                <div className="w-full min-h-[140px] max-h-[260px] overflow-y-auto p-3 rounded-md border bg-muted/20 text-sm">
                  {content.trim() ? (
                    <MarkdownRenderer content={content} />
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Nothing to preview</span>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  {mentionQuery && (
                    <div className="p-2 rounded-lg border bg-muted/40 text-xs space-y-1">
                      <div className="font-medium text-muted-foreground flex items-center gap-1 text-[11px]">
                        {mentionQuery.type === 'task' ? (
                          <>
                            <CheckSquare className="h-3 w-3 text-blue-500" />
                            <span>Select Task to insert:</span>
                          </>
                        ) : (
                          <>
                            <Activity className="h-3 w-3 text-emerald-500" />
                            <span>Select Habit to insert:</span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {mentionQuery.type === 'task' &&
                          matchingTasks.map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() =>
                                handleApplyMention({ id: t.id, title: t.title, type: 'task' })
                              }
                              className="px-2 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1 text-xs"
                            >
                              <CheckSquare className="h-3 w-3" />
                              <span>{t.title}</span>
                            </button>
                          ))}
                        {mentionQuery.type === 'habit' &&
                          matchingHabits.map((h) => (
                            <button
                              key={h.id}
                              type="button"
                              onClick={() =>
                                handleApplyMention({ id: h.id, title: h.title, type: 'habit' })
                              }
                              className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 text-xs"
                            >
                              <Activity className="h-3 w-3" />
                              <span>{h.title}</span>
                            </button>
                          ))}
                        {mentionQuery.type === 'task' && matchingTasks.length === 0 && (
                          <span className="text-muted-foreground text-[11px]">
                            No matching tasks
                          </span>
                        )}
                        {mentionQuery.type === 'habit' && matchingHabits.length === 0 && (
                          <span className="text-muted-foreground text-[11px]">
                            No matching habits
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <textarea
                    ref={textareaRef}
                    className="w-full min-h-[140px] p-3 rounded-md border bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Write your note here... (type @ for tasks, # for habits)"
                    value={content}
                    onChange={handleContentChange}
                    required
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Project
                </label>
                <Select
                  value={projectId || 'none'}
                  onValueChange={(val) => setProjectId(val === 'none' ? undefined : val)}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Linked Task
                </label>
                <Select
                  value={linkedTaskId || 'none'}
                  onValueChange={(val) => setLinkedTaskId(val === 'none' ? undefined : val)}
                >
                  <SelectTrigger className="text-xs truncate">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="none">None</SelectItem>
                    {allTasks
                      .filter((t) => !t.archived)
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Linked Habit
                </label>
                <Select
                  value={linkedHabitId || 'none'}
                  onValueChange={(val) => setLinkedHabitId(val === 'none' ? undefined : val)}
                >
                  <SelectTrigger className="text-xs truncate">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    <SelectItem value="none">None</SelectItem>
                    {allHabits.map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {PRESET_NOTE_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className="h-6 w-6 rounded-full border border-border flex items-center justify-center transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c.value || 'transparent'
                    }}
                    title={c.label}
                  >
                    {color === c.value && (
                      <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-black shadow-sm" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tags</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add tag (type and tap Add)"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag(tagInput)
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddTag(tagInput)}
                  className="min-h-[36px]"
                >
                  <TagIcon className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs pl-2.5 pr-1 py-0.5 rounded-md"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive p-1 rounded min-w-[28px] min-h-[28px] flex items-center justify-center"
                        aria-label={`Remove tag ${tag}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {availableTags.length > 0 && tags.length < availableTags.length && (
                <div className="flex flex-wrap gap-1 mt-1.5 items-center">
                  <span className="text-[11px] text-muted-foreground">Suggestions:</span>
                  {availableTags
                    .filter((t) => !tags.includes(t.name))
                    .slice(0, 5)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleAddTag(t.name)}
                        className="text-[11px] text-primary hover:underline"
                      >
                        #{t.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createNoteMutation.isPending || (!title.trim() && !content.trim())}
            >
              {createNoteMutation.isPending ? 'Saving...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
