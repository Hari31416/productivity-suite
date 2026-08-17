import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  Code,
  List,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Pin,
  X,
  Plus,
  Columns,
  Eye,
  Edit3,
  Folder,
  Maximize2,
  Minimize2,
  Check,
  Loader2,
  Activity,
  AtSign,
  Hash
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MarkdownRenderer } from '../utils/markdownParser'
import { getNoteStats } from '../utils/noteStats'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { useTasks } from '@/modules/tasks/hooks/useTasks'
import { useHabits } from '@/modules/habits/hooks/useHabits'
import { useFindOrCreateTag } from '../hooks/useTags'
import { cn } from '@/lib/utils'
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types'

interface MarkdownEditorProps {
  initialNote?: Note | null
  onSave: (
    noteData: CreateNoteInput | { id: string; input: UpdateNoteInput }
  ) => Promise<Note | void>
  onClose: () => void
}

type ViewMode = 'edit' | 'split' | 'preview'

const COLOR_OPTIONS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Green', value: '#10b981' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' }
]

export function MarkdownEditor({ initialNote, onSave, onClose }: MarkdownEditorProps) {
  const [noteId, setNoteId] = useState<string | undefined>(initialNote?.id)
  const [title, setTitle] = useState(initialNote?.title || '')
  const [content, setContent] = useState(initialNote?.content || '')
  const [tags, setTags] = useState<string[]>(initialNote?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [projectId, setProjectId] = useState<string | undefined>(initialNote?.projectId)
  const [linkedTaskId, setLinkedTaskId] = useState<string | undefined>(initialNote?.linkedTaskId)
  const [linkedHabitId, setLinkedHabitId] = useState<string | undefined>(initialNote?.linkedHabitId)
  const [pinned, setPinned] = useState(initialNote?.pinned || false)
  const [color, setColor] = useState(initialNote?.color || '')
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'edit'
    }
    return 'split'
  })
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [isZenMode, setIsZenMode] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const onSaveRef = useRef(onSave)
  const isSavingRef = useRef(false)
  const isMountedRef = useRef(true)

  // Track the last saved state to prevent redundant or loop saves
  const lastSavedRef = useRef({
    noteId: initialNote?.id,
    title: initialNote?.title || '',
    content: initialNote?.content || '',
    tagsStr: JSON.stringify(initialNote?.tags || []),
    projectId: initialNote?.projectId,
    linkedTaskId: initialNote?.linkedTaskId,
    linkedHabitId: initialNote?.linkedHabitId,
    pinned: initialNote?.pinned || false,
    color: initialNote?.color || ''
  })

  // Always keep onSaveRef current
  useEffect(() => {
    onSaveRef.current = onSave
  })

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const { data: projects = [] } = useProjects()
  const { data: allTasks = [] } = useTasks()
  const { data: allHabits = [] } = useHabits(false)
  const findOrCreateTagMutation = useFindOrCreateTag()

  const stats = getNoteStats(content)

  const handleToggleCheckbox = useCallback(
    (lineIndex: number) => {
      const lines = content.split(/\r?\n/)
      if (lineIndex < 0 || lineIndex >= lines.length) return
      const targetLine = lines[lineIndex]
      const checkMatch = targetLine.match(/^(\s*[-*]\s+\[)([ xX])(\]\s+.*)$/)
      if (checkMatch) {
        const isChecked = checkMatch[2].toLowerCase() === 'x'
        const newChar = isChecked ? ' ' : 'x'
        lines[lineIndex] = `${checkMatch[1]}${newChar}${checkMatch[3]}`
        const newContent = lines.join('\n')
        setContent(newContent)
      }
    },
    [content]
  )

  const performSave = useCallback(async () => {
    const trimmedTitle = title.trim()
    const tagsStr = JSON.stringify(tags)

    // Skip if note is empty and never created
    if (!trimmedTitle && !content.trim() && !noteId) {
      if (isMountedRef.current) setSaveStatus('saved')
      return
    }

    // Skip if unchanged
    const last = lastSavedRef.current
    if (
      last.noteId === noteId &&
      last.title === trimmedTitle &&
      last.content === content &&
      last.tagsStr === tagsStr &&
      last.projectId === projectId &&
      last.linkedTaskId === linkedTaskId &&
      last.linkedHabitId === linkedHabitId &&
      last.pinned === pinned &&
      last.color === color
    ) {
      if (isMountedRef.current) setSaveStatus('saved')
      return
    }

    if (isSavingRef.current) return
    isSavingRef.current = true
    if (isMountedRef.current) setSaveStatus('saving')

    try {
      if (noteId) {
        await onSaveRef.current({
          id: noteId,
          input: {
            title: trimmedTitle || 'Untitled Note',
            content,
            tags,
            projectId: projectId || undefined,
            linkedTaskId: linkedTaskId || undefined,
            linkedHabitId: linkedHabitId || undefined,
            pinned,
            color: color || undefined,
            wordCount: stats.wordCount
          }
        })
        lastSavedRef.current = {
          noteId,
          title: trimmedTitle,
          content,
          tagsStr,
          projectId,
          linkedTaskId,
          linkedHabitId,
          pinned,
          color
        }
      } else {
        const created = await onSaveRef.current({
          title: trimmedTitle || 'Untitled Note',
          content,
          tags,
          projectId: projectId || undefined,
          linkedTaskId: linkedTaskId || undefined,
          linkedHabitId: linkedHabitId || undefined,
          pinned,
          color: color || undefined,
          wordCount: stats.wordCount,
          archived: false
        })
        if (created && created.id) {
          setNoteId(created.id)
          lastSavedRef.current = {
            noteId: created.id,
            title: trimmedTitle,
            content,
            tagsStr,
            projectId,
            linkedTaskId,
            linkedHabitId,
            pinned,
            color
          }
        }
      }
      if (isMountedRef.current) setSaveStatus('saved')
    } catch {
      if (isMountedRef.current) setSaveStatus('unsaved')
    } finally {
      isSavingRef.current = false
    }
  }, [
    noteId,
    title,
    content,
    tags,
    projectId,
    linkedTaskId,
    linkedHabitId,
    pinned,
    color,
    stats.wordCount
  ])

  // Keyboard shortcut listener for Cmd+S / Ctrl+S and Esc for Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        performSave()
      }
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [performSave, isZenMode])

  // Debounced auto-save effect on user changes
  useEffect(() => {
    const trimmedTitle = title.trim()
    const tagsStr = JSON.stringify(tags)
    const last = lastSavedRef.current

    const isDirty =
      last.noteId !== noteId ||
      last.title !== trimmedTitle ||
      last.content !== content ||
      last.tagsStr !== tagsStr ||
      last.projectId !== projectId ||
      last.pinned !== pinned ||
      last.color !== color

    if (!isDirty) {
      return
    }

    setSaveStatus('unsaved')
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performSave()
    }, 700)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [noteId, title, content, tags, projectId, pinned, color, performSave])

  // Flush save on close
  const handleClose = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }
    await performSave()
    onClose()
  }

  const insertFormatting = (
    prefix: string,
    suffix: string = '',
    defaultPlaceholder: string = ''
  ) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = selectedText
      ? `${prefix}${selectedText}${suffix}`
      : `${prefix}${defaultPlaceholder}${suffix}`

    const newContent = content.substring(0, start) + replacement + content.substring(end)
    setContent(newContent)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = selectedText
        ? start + prefix.length + selectedText.length + suffix.length
        : start + prefix.length + defaultPlaceholder.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleInsertTaskMention = (task: { id: string; title: string }) => {
    insertFormatting(`@[${task.title}](task:${task.id}) `, '', '')
    setMentionQuery(null)
  }

  const handleInsertHabitMention = (habit: { id: string; title: string }) => {
    insertFormatting(`#[${habit.title}](habit:${habit.id}) `, '', '')
    setMentionQuery(null)
  }

  const [mentionQuery, setMentionQuery] = useState<{
    type: 'task' | 'habit'
    query: string
    index: number
  } | null>(null)

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleAddTag = async (tagName: string) => {
    const trimmed = tagName.trim().replace(/^#/, '')
    if (!trimmed || tags.includes(trimmed)) return

    await findOrCreateTagMutation.mutateAsync({ name: trimmed })
    setTags((prev) => [...prev, trimmed])
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove))
  }

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      handleAddTag(tagInput)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-all',
        isZenMode
          ? 'fixed inset-0 z-50 h-screen w-screen rounded-none border-none p-4 sm:p-6 bg-background overflow-y-auto'
          : 'h-full min-h-[600px]'
      )}
    >
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-2 border-b px-3 sm:px-4 py-2 sm:py-2.5 bg-muted/20">
        <div className="flex items-center gap-2">
          {/* Auto-Save Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground select-none"
            title={`Status: ${saveStatus}`}
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                <span className="text-xs">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">Unsaved</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Color Selector (Desktop) */}
          <div className="hidden lg:flex items-center gap-1">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                type="button"
                onClick={() => setColor(opt.value)}
                title={opt.name}
                className={`h-4.5 w-4.5 rounded-full border transition-transform ${
                  color === opt.value ? 'scale-125 ring-2 ring-primary' : 'hover:scale-110'
                }`}
                style={{
                  backgroundColor: opt.value || 'hsl(var(--muted))',
                  borderColor: 'hsl(var(--border))'
                }}
              />
            ))}
          </div>

          {/* Pin Button */}
          <Button
            type="button"
            variant={pinned ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setPinned(!pinned)}
            title={pinned ? 'Unpin Note' : 'Pin Note'}
            className="h-8 px-2.5 gap-1 text-xs"
          >
            <Pin className={`h-3.5 w-3.5 ${pinned ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{pinned ? 'Pinned' : 'Pin'}</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'edit'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground'
              }`}
              title="Edit Only"
            >
              <span className="sm:hidden text-xs">Edit</span>
              <Edit3 className="hidden sm:inline h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:inline-flex rounded px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'split'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground'
              }`}
              title="Split View"
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                viewMode === 'preview'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground'
              }`}
              title="Preview Markdown"
            >
              <span className="sm:hidden text-xs">Preview</span>
              <Eye className="hidden sm:inline h-3.5 w-3.5" />
            </button>
          </div>

          {/* Zen Mode Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsZenMode(!isZenMode)}
            className="hidden sm:inline-flex h-8 px-2 text-xs gap-1"
            title={isZenMode ? 'Exit Zen Focus Mode (Esc)' : 'Zen Focus Mode'}
          >
            {isZenMode ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">{isZenMode ? 'Exit Zen' : 'Zen'}</span>
          </Button>

          {/* Close Editor */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
            title="Close Editor"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Note Title Input (Full width, responsive, no clipping) */}
      <div className="border-b px-3 sm:px-4 py-2.5 sm:py-3 bg-background">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="w-full border-none bg-transparent p-0 text-lg sm:text-2xl font-bold tracking-tight text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-0"
        />
      </div>
      {/* Sleek Compact Meta Pills Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/20 px-3 sm:px-4 py-1.5 text-xs min-h-[36px]">
        {/* Active Project Badge */}
        {projectId && projects.find((p) => p.id === projectId) && (
          <Badge variant="outline" className="gap-1 text-[11px] py-0.5 font-normal bg-background">
            <Folder className="h-3 w-3 text-muted-foreground" />
            <span className="max-w-[120px] truncate">
              {projects.find((p) => p.id === projectId)?.name}
            </span>
            <button
              type="button"
              onClick={() => setProjectId(undefined)}
              className="rounded-full hover:bg-muted p-0.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        )}

        {/* Active Task Badge */}
        {linkedTaskId && allTasks.find((t) => t.id === linkedTaskId) && (
          <Badge
            variant="outline"
            className="gap-1 text-[11px] py-0.5 font-normal border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5"
          >
            <CheckSquare className="h-3 w-3" />
            <span className="max-w-[130px] truncate">
              {allTasks.find((t) => t.id === linkedTaskId)?.title}
            </span>
            <button
              type="button"
              onClick={() => setLinkedTaskId(undefined)}
              className="rounded-full hover:bg-blue-500/20 p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        )}

        {/* Active Habit Badge */}
        {linkedHabitId && allHabits.find((h) => h.id === linkedHabitId) && (
          <Badge
            variant="outline"
            className="gap-1 text-[11px] py-0.5 font-normal border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
          >
            <Activity className="h-3 w-3" />
            <span className="max-w-[130px] truncate">
              {allHabits.find((h) => h.id === linkedHabitId)?.title}
            </span>
            <button
              type="button"
              onClick={() => setLinkedHabitId(undefined)}
              className="rounded-full hover:bg-emerald-500/20 p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        )}

        {/* Active User Tags */}
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1 py-0.5 text-[11px] font-normal">
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() => handleRemoveTag(tag)}
              className="rounded-full hover:bg-muted-foreground/20 p-0.5"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}

        {/* + Link dropdown (Attach Project, Task, or Habit) */}
        {(!projectId || !linkedTaskId || !linkedHabitId) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded border border-dashed px-2 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors bg-background"
              >
                <Plus className="h-3 w-3" />
                <span>Link</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
              {!linkedTaskId && allTasks.filter((t) => !t.archived).length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider py-1">
                    Link Task
                  </DropdownMenuLabel>
                  {allTasks
                    .filter((t) => !t.archived)
                    .slice(0, 5)
                    .map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        onClick={() => setLinkedTaskId(t.id)}
                        className="text-xs flex items-center gap-2 cursor-pointer"
                      >
                        <CheckSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="truncate">{t.title}</span>
                      </DropdownMenuItem>
                    ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {!linkedHabitId && allHabits.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider py-1">
                    Link Habit
                  </DropdownMenuLabel>
                  {allHabits.slice(0, 5).map((h) => (
                    <DropdownMenuItem
                      key={h.id}
                      onClick={() => setLinkedHabitId(h.id)}
                      className="text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">{h.title}</span>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                </>
              )}

              {!projectId && projects.length > 0 && (
                <>
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground uppercase tracking-wider py-1">
                    Assign Project
                  </DropdownMenuLabel>
                  {projects.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => setProjectId(p.id)}
                      className="text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{p.name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Compact + tag input */}
        <div className="flex items-center">
          <input
            type="text"
            placeholder="+ tag"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDownTag}
            className="h-5 w-14 rounded border border-dashed bg-transparent px-1.5 text-[11px] placeholder:text-muted-foreground/60 focus:w-24 focus:border-solid focus:bg-background focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Formatting Toolbar */}
      {viewMode !== 'preview' && (
        <div className="flex items-center gap-1 border-b bg-muted/40 px-3 py-1.5 text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('# ', '', 'Heading 1')}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('## ', '', 'Heading 2')}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('### ', '', 'Heading 3')}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border shrink-0" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('**', '**', 'bold text')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('*', '*', 'italic text')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('`', '`', 'code')}
            title="Inline Code"
          >
            <Code className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border shrink-0" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('- ', '', 'List item')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('- [ ] ', '', 'Task item')}
            title="Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() => insertFormatting('> ', '', 'Quote text')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 min-h-[32px] min-w-[32px] p-0 shrink-0"
            onClick={() =>
              insertFormatting('| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n')
            }
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border shrink-0" />

          {/* Mention Task Popover */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 min-h-[32px] gap-1 text-xs shrink-0 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                title="Mention Task (@task)"
              >
                <AtSign className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Task</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Mention a Task</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allTasks.filter((t) => !t.archived).length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">No active tasks</div>
              ) : (
                allTasks
                  .filter((t) => !t.archived)
                  .map((task) => (
                    <DropdownMenuItem
                      key={task.id}
                      onClick={() => handleInsertTaskMention(task)}
                      className="text-xs flex items-center gap-2 cursor-pointer"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{task.title}</span>
                    </DropdownMenuItem>
                  ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mention Habit Popover */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 min-h-[32px] gap-1 text-xs shrink-0 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                title="Mention Habit (#habit)"
              >
                <Hash className="h-3.5 w-3.5" />
                <span className="text-[11px] font-medium">Habit</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-60 overflow-y-auto">
              <DropdownMenuLabel className="text-xs">Mention a Habit</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allHabits.length === 0 ? (
                <div className="p-2 text-xs text-muted-foreground">No active habits</div>
              ) : (
                allHabits.map((habit) => (
                  <DropdownMenuItem
                    key={habit.id}
                    onClick={() => handleInsertHabitMention(habit)}
                    className="text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{habit.title}</span>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`flex flex-1 flex-col overflow-auto p-4 relative ${
              viewMode === 'split' ? 'border-r' : ''
            }`}
          >
            {/* Mention Suggestions Floating Bar */}
            {mentionQuery && (
              <div className="mb-2 p-2 rounded-xl border bg-card/95 backdrop-blur-xs shadow-md flex flex-col gap-1 z-20 shrink-0">
                <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  {mentionQuery.type === 'task' ? (
                    <>
                      <CheckSquare className="h-3 w-3 text-blue-500" />
                      <span>Matching Tasks:</span>
                    </>
                  ) : (
                    <>
                      <Activity className="h-3 w-3 text-emerald-500" />
                      <span>Matching Habits:</span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {mentionQuery.type === 'task' &&
                    matchingTasks.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          handleApplyMention({ id: t.id, title: t.title, type: 'task' })
                        }
                        className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1"
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
                        className="text-xs px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1"
                      >
                        <Activity className="h-3 w-3" />
                        <span>{h.title}</span>
                      </button>
                    ))}
                  {mentionQuery.type === 'task' && matchingTasks.length === 0 && (
                    <span className="text-xs text-muted-foreground">No matching tasks</span>
                  )}
                  {mentionQuery.type === 'habit' && matchingHabits.length === 0 && (
                    <span className="text-xs text-muted-foreground">No matching habits</span>
                  )}
                </div>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleTextareaChange}
              placeholder="Write your note here in Markdown format... (type @ for tasks, # for habits)"
              className="h-full min-h-[350px] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-hidden"
              spellCheck="false"
            />
          </div>
        )}

        {/* Preview Pane */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className="flex-1 overflow-auto bg-muted/10 p-4">
            <MarkdownRenderer content={content} onToggleCheckbox={handleToggleCheckbox} />
          </div>
        )}
      </div>

      {/* Statistics Footer */}
      <div className="flex flex-wrap items-center justify-between border-t bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{stats.wordCount} words</span>
          <span>{stats.charCount} characters</span>
          <span>~{stats.readingTimeMinutes} min read</span>
        </div>
        <div>
          <span className="capitalize">{saveStatus}</span>
        </div>
      </div>
    </div>
  )
}
