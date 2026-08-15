import { useState } from 'react'
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
import { useCreateNote } from '../hooks/useNotes'
import { useProjects } from '@/modules/tasks/hooks/useProjects'
import { useTags } from '../hooks/useTags'
import { MarkdownRenderer } from '../utils/markdownParser'
import { Tag as TagIcon, X } from 'lucide-react'

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
  const [color, setColor] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  const { data: projects = [] } = useProjects()
  const { data: availableTags = [] } = useTags()
  const createNoteMutation = useCreateNote()

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
      color: color || undefined,
      pinned: false
    })

    // Reset & close
    setTitle('')
    setContent('')
    setProjectId(undefined)
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-muted-foreground">
                  Content (Markdown supported)
                </label>
                <div className="flex rounded border bg-muted p-0.5 text-xs">
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
                <textarea
                  className="w-full min-h-[140px] p-3 rounded-md border bg-background text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Write your note here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Associated Project
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
                  Accent Color
                </label>
                <div className="flex items-center gap-1.5 pt-1.5">
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
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">
                Tags
              </label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add tag and press Enter"
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
                      className="inline-flex items-center gap-1 bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createNoteMutation.isPending || (!title.trim() && !content.trim())}>
              {createNoteMutation.isPending ? 'Saving...' : 'Create Note'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
