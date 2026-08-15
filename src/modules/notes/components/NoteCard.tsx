import { format, parseISO } from 'date-fns'
import {
  Pin,
  MoreVertical,
  Edit2,
  Trash2,
  Copy,
  Download,
  Archive,
  ArchiveRestore,
  Clock,
  FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { calculateReadingTime } from '../utils/noteStats'
import { exportNoteAsMarkdown } from '../utils/noteExporter'
import type { Note } from '../types'

interface NoteCardProps {
  note: Note
  layout?: 'grid' | 'list'
  projectName?: string
  searchQuery?: string
  onEdit: (note: Note) => void
  onTogglePin: (id: string) => void
  onToggleArchive: (id: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onTagClick?: (tag: string) => void
}

function getSnippet(content: string, searchQuery?: string, maxLength = 160): React.ReactNode {
  // Strip common markdown characters for snippet
  const cleaned = content
    .replace(/^#+\s+/gm, '')
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return ''

  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase()
    const index = cleaned.toLowerCase().indexOf(q)
    if (index !== -1) {
      const start = Math.max(0, index - 40)
      const end = Math.min(cleaned.length, index + q.length + 80)
      const prefix = start > 0 ? '...' : ''
      const suffix = end < cleaned.length ? '...' : ''
      const segment = cleaned.substring(start, end)

      const regex = new RegExp(`(${searchQuery.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      const parts = segment.split(regex)
      return (
        <span>
          {prefix}
          {parts.map((part, i) =>
            part.toLowerCase() === q ? (
              <mark key={i} className="bg-amber-300/50 dark:bg-amber-500/40 text-foreground px-0.5 rounded font-medium">
                {part}
              </mark>
            ) : (
              part
            )
          )}
          {suffix}
        </span>
      )
    }
  }

  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength).trim() + '...'
}

export function NoteCard({
  note,
  layout = 'grid',
  projectName,
  searchQuery,
  onEdit,
  onTogglePin,
  onToggleArchive,
  onDuplicate,
  onDelete,
  onTagClick
}: NoteCardProps) {
  const formattedDate = note.updatedAt
    ? format(parseISO(note.updatedAt), 'MMM d, yyyy')
    : 'Unknown'

  const readingTime = calculateReadingTime(note.wordCount)
  const snippet = getSnippet(note.content, searchQuery)

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation()
    exportNoteAsMarkdown(note)
  }

  if (layout === 'list') {
    return (
      <div
        onClick={() => onEdit(note)}
        className={cn(
          'group relative flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-xs',
          note.pinned && 'border-primary/40 bg-accent/20'
        )}
        style={note.color ? { borderLeftColor: note.color, borderLeftWidth: '4px' } : undefined}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex items-center gap-2">
            {note.pinned && (
              <Pin className="h-3.5 w-3.5 fill-primary text-primary" />
            )}
            <h3 className="truncate font-semibold text-foreground">{note.title}</h3>
          </div>

          {projectName && (
            <Badge variant="outline" className="hidden sm:inline-flex text-[10px]">
              {projectName}
            </Badge>
          )}

          <p className="hidden max-w-md truncate text-xs text-muted-foreground md:block">
            {snippet || 'Empty note'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {note.tags && note.tags.length > 0 && (
            <div className="hidden items-center gap-1 sm:flex">
              {note.tags.slice(0, 2).map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer text-[10px] font-normal hover:bg-primary/20"
                  onClick={(e) => {
                    e.stopPropagation()
                    onTagClick?.(tag)
                  }}
                >
                  #{tag}
                </Badge>
              ))}
              {note.tags.length > 2 && (
                <span className="text-[10px] text-muted-foreground">
                  +{note.tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>

          {/* Action Menu */}
          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-80 group-hover:opacity-100">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(note)} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Note</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePin(note.id)} className="gap-2">
                  <Pin className="h-4 w-4" />
                  <span>{note.pinned ? 'Unpin Note' : 'Pin Note'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(note.id)} className="gap-2">
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleArchive(note.id)} className="gap-2">
                  {note.archived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      <span>Unarchive</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      <span>Archive</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    )
  }

  // Grid layout
  return (
    <div
      onClick={() => onEdit(note)}
      className={cn(
        'group relative flex h-60 cursor-pointer flex-col justify-between rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md',
        note.pinned && 'border-primary/40 bg-accent/15'
      )}
      style={
        note.color
          ? {
              borderTopColor: note.color,
              borderTopWidth: '4px'
            }
          : undefined
      }
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {note.pinned && (
              <Pin className="h-3.5 w-3.5 shrink-0 fill-primary text-primary" />
            )}
            <h3 className="truncate font-semibold tracking-tight text-foreground">
              {note.title || 'Untitled Note'}
            </h3>
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-70 hover:opacity-100"
                >
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onEdit(note)} className="gap-2">
                  <Edit2 className="h-4 w-4" />
                  <span>Edit Note</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePin(note.id)} className="gap-2">
                  <Pin className="h-4 w-4" />
                  <span>{note.pinned ? 'Unpin Note' : 'Pin Note'}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(note.id)} className="gap-2">
                  <Copy className="h-4 w-4" />
                  <span>Duplicate</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} className="gap-2">
                  <Download className="h-4 w-4" />
                  <span>Export Markdown</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleArchive(note.id)} className="gap-2">
                  {note.archived ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      <span>Unarchive</span>
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      <span>Archive</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Project badge if available */}
        {projectName && (
          <div className="mt-1.5">
            <Badge variant="outline" className="text-[10px]">
              {projectName}
            </Badge>
          </div>
        )}

        {/* Body snippet */}
        <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-muted-foreground">
          {snippet || 'Empty note'}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-4 border-t pt-3">
        {/* Tags */}
        {note.tags && note.tags.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="cursor-pointer text-[10px] font-normal hover:bg-primary/20"
                onClick={(e) => {
                  e.stopPropagation()
                  onTagClick?.(tag)
                }}
              >
                #{tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{note.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            <span>{note.wordCount} words ({readingTime}m)</span>
          </div>
          <span>{formattedDate}</span>
        </div>
      </div>
    </div>
  )
}
