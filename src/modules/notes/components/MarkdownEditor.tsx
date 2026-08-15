import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  Save,
  Columns,
  Eye,
  Edit3,
  Folder,
  ListTree,
  Maximize2,
  Minimize2,
  Check,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MarkdownRenderer, extractHeadings, type MarkdownHeading } from '../utils/markdownParser'
import { getNoteStats } from '../utils/noteStats'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { useTags, useFindOrCreateTag } from '../hooks/useTags'
import { cn } from '@/lib/utils'
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types'

interface MarkdownEditorProps {
  initialNote?: Note | null
  onSave: (noteData: CreateNoteInput | { id: string; input: UpdateNoteInput }) => Promise<void>
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
  const [title, setTitle] = useState(initialNote?.title || '')
  const [content, setContent] = useState(initialNote?.content || '')
  const [tags, setTags] = useState<string[]>(initialNote?.tags || [])
  const [tagInput, setTagInput] = useState('')
  const [projectId, setProjectId] = useState<string | undefined>(initialNote?.projectId)
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
  const isFirstRender = useRef(true)

  const { data: projects = [] } = useProjects()
  const { data: existingTags = [] } = useTags()
  const findOrCreateTagMutation = useFindOrCreateTag()

  const stats = getNoteStats(content)
  const headings = useMemo(() => extractHeadings(content), [content])

  const handleToggleCheckbox = useCallback((lineIndex: number) => {
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
  }, [content])

  const handleJumpToHeading = (headingId: string) => {
    const el = document.getElementById(headingId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      if (initialNote?.id) {
        await onSave({
          id: initialNote.id,
          input: {
            title: title.trim() || 'Untitled Note',
            content,
            tags,
            projectId: projectId || undefined,
            pinned,
            color: color || undefined,
            wordCount: stats.wordCount
          }
        })
      } else {
        await onSave({
          title: title.trim() || 'Untitled Note',
          content,
          tags,
          projectId: projectId || undefined,
          pinned,
          color: color || undefined,
          wordCount: stats.wordCount,
          archived: false
        })
      }
      setSaveStatus('saved')
    } catch {
      setSaveStatus('unsaved')
    }
  }, [initialNote, title, content, tags, projectId, pinned, color, stats.wordCount, onSave])

  // Keyboard shortcut listener for Cmd+S / Ctrl+S and Esc for Zen mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      }
      if (e.key === 'Escape' && isZenMode) {
        setIsZenMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSave, isZenMode])

  // Debounced auto-save effect
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setSaveStatus('unsaved')
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    autoSaveTimerRef.current = setTimeout(() => {
      handleSave()
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [title, content, tags, projectId, pinned, color, handleSave])

  const insertFormatting = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const replacement = selectedText ? `${prefix}${selectedText}${suffix}` : `${prefix}${defaultPlaceholder}${suffix}`

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
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="flex flex-1 items-center gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title..."
            className="h-10 border-none bg-transparent px-2 text-xl font-bold tracking-tight shadow-none focus-visible:ring-1"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Color Selector */}
          <div className="flex items-center gap-1">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.name}
                type="button"
                onClick={() => setColor(opt.value)}
                title={opt.name}
                className={`h-5 w-5 rounded-full border transition-transform ${
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
            className="gap-1.5"
          >
            <Pin className={`h-4 w-4 ${pinned ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{pinned ? 'Pinned' : 'Pin'}</span>
          </Button>

          {/* View Mode Toggle */}
          <div className="flex rounded-md border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('edit')}
              className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                viewMode === 'edit' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Edit Only"
            >
              <span className="sm:hidden text-xs">Edit</span>
              <Edit3 className="hidden sm:inline h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`hidden md:inline-flex rounded px-2.5 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                viewMode === 'split' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Split View"
            >
              <Columns className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              className={`rounded px-2.5 py-1.5 text-xs font-medium transition-colors min-h-[32px] ${
                viewMode === 'preview' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground'
              }`}
              title="Preview Only"
            >
              <span className="sm:hidden text-xs">Preview</span>
              <Eye className="hidden sm:inline h-3.5 w-3.5" />
            </button>
          </div>

          {/* Table of Contents / Outline */}
          {headings.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 text-xs gap-1"
                  title="Table of Contents"
                >
                  <ListTree className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Outline</span>
                  <span className="text-[10px] text-muted-foreground">({headings.length})</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 max-h-72 overflow-y-auto">
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground border-b mb-1">
                  Table of Contents
                </div>
                {headings.map((h: MarkdownHeading, idx: number) => (
                  <DropdownMenuItem
                    key={`${h.id}-${idx}`}
                    onClick={() => handleJumpToHeading(h.id)}
                    className="text-xs py-1.5 cursor-pointer"
                    style={{ paddingLeft: `${(h.level - 1) * 12 + 8}px` }}
                  >
                    <span className="truncate">{h.text}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Zen Focus Mode Button */}
          <Button
            type="button"
            variant={isZenMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsZenMode(!isZenMode)}
            className="h-8 px-2 text-xs gap-1"
            title={isZenMode ? 'Exit Zen Focus Mode (Esc)' : 'Zen Focus Mode'}
          >
            {isZenMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isZenMode ? 'Exit Zen' : 'Zen'}</span>
          </Button>

          {/* Save Status / Button */}
          <Button
            type="button"
            variant={saveStatus === 'saved' ? 'outline' : 'default'}
            size="sm"
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="gap-1.5 min-w-[76px]"
          >
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span className="text-xs">Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">Saved</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span className="text-xs">Save</span>
              </>
            )}
          </Button>

          {/* Close Editor */}
          <Button type="button" variant="ghost" size="sm" onClick={onClose} title="Close Editor">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Meta Controls (Tags, Project) */}
      <div className="flex flex-wrap items-center gap-3 border-b bg-muted/20 px-4 py-2 text-xs">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Folder className="h-3.5 w-3.5" />
          <select
            value={projectId || ''}
            onChange={(e) => setProjectId(e.target.value || undefined)}
            className="rounded border bg-background px-2 py-1 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
          >
            <option value="">No Project</option>
            {projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags list and input */}
        <div className="flex flex-1 flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1 py-0.5 text-xs font-normal">
              <span>#{tag}</span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <div className="flex items-center">
            <input
              type="text"
              placeholder="+ tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDownTag}
              className="h-6 w-20 rounded border bg-background px-2 text-xs placeholder:text-muted-foreground focus:w-32 focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
            {tagInput.trim() && (
              <button
                type="button"
                onClick={() => handleAddTag(tagInput)}
                className="ml-1 rounded p-1 hover:bg-muted"
              >
                <Plus className="h-3 w-3" />
              </button>
            )}
          </div>
          {/* Quick existing tag suggestions */}
          {existingTags
            .filter((t) => !tags.includes(t.name))
            .slice(0, 3)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleAddTag(t.name)}
                className="rounded border border-dashed px-1.5 py-0.5 text-[11px] text-muted-foreground hover:border-primary hover:text-primary"
              >
                +{t.name}
              </button>
            ))}
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
              insertFormatting(
                '| Column 1 | Column 2 |\n| --- | --- |\n| Value 1 | Value 2 |\n'
              )
            }
            title="Insert Table"
          >
            <TableIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor & Preview Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Pane */}
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div
            className={`flex flex-1 flex-col overflow-auto p-4 ${
              viewMode === 'split' ? 'border-r' : ''
            }`}
          >
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here in Markdown format..."
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
