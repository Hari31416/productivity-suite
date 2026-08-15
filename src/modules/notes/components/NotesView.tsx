import { useState, useMemo } from 'react'
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Download,
  Pin,
  FileText,
  Tag as TagIcon,
  Folder,
  Archive,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { NoteCard } from './NoteCard'
import { MarkdownEditor } from './MarkdownEditor'
import {
  useNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
  useTogglePinNote,
  useToggleArchiveNote,
  useDuplicateNote
} from '../hooks/useNotes'
import { useTags } from '../hooks/useTags'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { exportAllNotesAsZip } from '../utils/noteExporter'
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types'

export function NotesView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [layout, setLayout] = useState<'grid' | 'list'>('grid')
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Data fetching
  const { data: notes = [], isLoading } = useNotes({ archived: showArchived })
  const { data: tags = [] } = useTags()
  const { data: projects = [] } = useProjects()

  // Mutations
  const createNoteMutation = useCreateNote()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()
  const togglePinMutation = useTogglePinNote()
  const toggleArchiveMutation = useToggleArchiveNote()
  const duplicateNoteMutation = useDuplicateNote()

  // Project map for quick lookup
  const projectMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) {
      map.set(p.id, p.name)
    }
    return map
  }, [projects])

  // Filter notes client-side for immediate responsiveness
  const filteredNotes = useMemo(() => {
    let result = notes

    if (selectedTag) {
      const targetTag = selectedTag.toLowerCase()
      result = result.filter((n) =>
        n.tags?.some((t) => t.toLowerCase() === targetTag)
      )
    }

    if (selectedProjectId) {
      result = result.filter((n) => n.projectId === selectedProjectId)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags?.some((t) => t.toLowerCase().includes(q))
      )
    }

    return result
  }, [notes, selectedTag, selectedProjectId, searchQuery])

  // Split into pinned and other notes
  const { pinnedNotes, regularNotes } = useMemo(() => {
    if (showArchived) {
      return { pinnedNotes: [], regularNotes: filteredNotes }
    }
    return {
      pinnedNotes: filteredNotes.filter((n) => n.pinned),
      regularNotes: filteredNotes.filter((n) => !n.pinned)
    }
  }, [filteredNotes, showArchived])

  const handleSaveNote = async (
    noteData: CreateNoteInput | { id: string; input: UpdateNoteInput }
  ) => {
    if ('id' in noteData) {
      await updateNoteMutation.mutateAsync(noteData)
      // Update local state if editing
      if (editingNote && editingNote.id === noteData.id) {
        setEditingNote((prev) => (prev ? { ...prev, ...noteData.input } : null))
      }
    } else {
      const created = await createNoteMutation.mutateAsync(noteData)
      setEditingNote(created)
      setIsCreatingNew(false)
    }
  }

  const handleExportAll = async () => {
    if (notes.length === 0) return
    setIsExporting(true)
    try {
      await exportAllNotesAsZip(notes, `notes-backup-${new Date().toISOString().slice(0, 10)}.zip`)
    } catch {
      // Handle error gracefully
    } finally {
      setIsExporting(false)
    }
  }

  const handleStartCreate = () => {
    setEditingNote(null)
    setIsCreatingNew(true)
  }

  const handleCloseEditor = () => {
    setEditingNote(null)
    setIsCreatingNew(false)
  }

  // Active Editor View (Modal or Full Screen)
  if (isCreatingNew || editingNote) {
    return (
      <div className="space-y-4">
        <MarkdownEditor
          initialNote={editingNote}
          onSave={handleSaveNote}
          onClose={handleCloseEditor}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="hidden sm:block">
          <h2 className="text-xl font-bold tracking-tight">Notepad</h2>
          <p className="text-xs text-muted-foreground">
            Write markdown notes, organize ideas with tags, and search your thoughts instantly.
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={notes.length === 0 || isExporting}
            className="h-8 gap-1.5 text-xs px-2.5"
            title="Export all notes to a zip archive"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export (.zip)'}</span>
          </Button>

          <Button size="sm" onClick={handleStartCreate} className="h-8 gap-1.5 shadow-xs text-xs px-3">
            <Plus className="h-3.5 w-3.5" />
            <span>New Note</span>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border bg-card p-2.5 sm:p-3 shadow-xs md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes by title, content, or tag..."
            className="pl-9 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Project Filter */}
          <div className="flex items-center gap-1">
            <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(e.target.value || null)}
              className="rounded-md border bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="">All Projects</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          {/* Archived Toggle */}
          <Button
            variant={showArchived ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="h-8 gap-1.5 text-xs"
          >
            <Archive className="h-3.5 w-3.5" />
            <span>{showArchived ? 'Archived' : 'Active'}</span>
          </Button>

          {/* Layout Toggle */}
          <div className="flex rounded-md border bg-muted p-0.5">
            <button
              type="button"
              onClick={() => setLayout('grid')}
              className={`rounded p-1 text-xs transition-colors ${
                layout === 'grid'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout('list')}
              className={`rounded p-1 text-xs transition-colors ${
                layout === 'list'
                  ? 'bg-background shadow-xs text-foreground'
                  : 'text-muted-foreground'
              }`}
              title="List View"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tag Chips Filters */}
      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <TagIcon className="h-3 w-3" />
            Tags:
          </span>
          <Badge
            variant={selectedTag === null ? 'default' : 'outline'}
            className="cursor-pointer text-xs font-normal"
            onClick={() => setSelectedTag(null)}
          >
            All
          </Badge>
          {tags.map((tag) => {
            const isSelected = selectedTag?.toLowerCase() === tag.name.toLowerCase()
            return (
              <Badge
                key={tag.id}
                variant={isSelected ? 'default' : 'secondary'}
                className="cursor-pointer text-xs font-normal transition-colors"
                style={
                  isSelected
                    ? { backgroundColor: tag.color, color: '#ffffff' }
                    : { borderLeftColor: tag.color, borderLeftWidth: '3px' }
                }
                onClick={() => setSelectedTag(isSelected ? null : tag.name)}
              >
                #{tag.name}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading notes...
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredNotes.length === 0 && (
        <Card className="p-8 text-center">
          <CardContent className="space-y-3 pt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">
              {searchQuery || selectedTag || selectedProjectId
                ? 'No matching notes found'
                : showArchived
                ? 'No archived notes'
                : 'No notes yet'}
            </h3>
            <p className="mx-auto max-w-sm text-xs text-muted-foreground">
              {searchQuery || selectedTag || selectedProjectId
                ? 'Try clearing your search query or filters.'
                : 'Create markdown notes with live syntax preview, tags, and local-first storage.'}
            </p>
            {(!searchQuery && !selectedTag && !selectedProjectId && !showArchived) && (
              <Button onClick={handleStartCreate} className="mt-2 gap-1.5 text-xs">
                <Plus className="h-4 w-4" />
                <span>Create Your First Note</span>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content View: Pinned Section + Regular Section */}
      {!isLoading && filteredNotes.length > 0 && (
        <div className="space-y-6">
          {/* Pinned Notes Section */}
          {pinnedNotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Pin className="h-3.5 w-3.5 fill-primary text-primary" />
                <span>Pinned Notes ({pinnedNotes.length})</span>
              </div>
              <div
                className={
                  layout === 'grid'
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-2'
                }
              >
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    layout={layout}
                    projectName={note.projectId ? projectMap.get(note.projectId) : undefined}
                    searchQuery={searchQuery}
                    onEdit={(n) => setEditingNote(n)}
                    onTogglePin={(id) => togglePinMutation.mutate(id)}
                    onToggleArchive={(id) => toggleArchiveMutation.mutate(id)}
                    onDuplicate={(id) => duplicateNoteMutation.mutate(id)}
                    onDelete={(id) => deleteNoteMutation.mutate(id)}
                    onTagClick={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Regular Notes Section */}
          {regularNotes.length > 0 && (
            <div className="space-y-3">
              {pinnedNotes.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Other Notes ({regularNotes.length})</span>
                </div>
              )}
              <div
                className={
                  layout === 'grid'
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-2'
                }
              >
                {regularNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    layout={layout}
                    projectName={note.projectId ? projectMap.get(note.projectId) : undefined}
                    searchQuery={searchQuery}
                    onEdit={(n) => setEditingNote(n)}
                    onTogglePin={(id) => togglePinMutation.mutate(id)}
                    onToggleArchive={(id) => toggleArchiveMutation.mutate(id)}
                    onDuplicate={(id) => duplicateNoteMutation.mutate(id)}
                    onDelete={(id) => deleteNoteMutation.mutate(id)}
                    onTagClick={(tag) => setSelectedTag(tag)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
