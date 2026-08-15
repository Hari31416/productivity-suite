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
  Folder,
  Briefcase,
  Code,
  Sparkles,
  BookOpen,
  Target,
  Heart,
  Compass,
  CheckCircle2,
  Star,
  Rocket,
  ListTodo
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Project } from '../types'
import { useCreateProject, useUpdateProject } from '../hooks/useProjects'

interface ProjectFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectToEdit?: Project | null
  onSuccess?: (project: Project) => void
}

const COLOR_PRESETS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // purple
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#f97316' // orange
]

const ICONS = [
  { name: 'Folder', icon: Folder },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Code', icon: Code },
  { name: 'Sparkles', icon: Sparkles },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Target', icon: Target },
  { name: 'Heart', icon: Heart },
  { name: 'Compass', icon: Compass },
  { name: 'CheckCircle2', icon: CheckCircle2 },
  { name: 'Star', icon: Star },
  { name: 'Rocket', icon: Rocket },
  { name: 'ListTodo', icon: ListTodo }
]

export function ProjectFormModal({
  open,
  onOpenChange,
  projectToEdit,
  onSuccess
}: ProjectFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState('#3b82f6')
  const [icon, setIcon] = useState('Folder')
  const [error, setError] = useState<string | null>(null)

  const createMutation = useCreateProject()
  const updateMutation = useUpdateProject()

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name)
      setDescription(projectToEdit.description || '')
      setColor(projectToEdit.color || '#3b82f6')
      setIcon(projectToEdit.icon || 'Folder')
    } else {
      setName('')
      setDescription('')
      setColor('#3b82f6')
      setIcon('Folder')
    }
    setError(null)
  }, [projectToEdit, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Project name is required')
      return
    }

    try {
      if (projectToEdit) {
        const updated = await updateMutation.mutateAsync({
          id: projectToEdit.id,
          updates: {
            name: trimmedName,
            description: description.trim() || undefined,
            color,
            icon
          }
        })
        onSuccess?.(updated)
      } else {
        const created = await createMutation.mutateAsync({
          name: trimmedName,
          description: description.trim() || undefined,
          color,
          icon,
          archived: false
        })
        onSuccess?.(created)
      }
      onOpenChange(false)
    } catch (err) {
      setError('Failed to save project. Please try again.')
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {projectToEdit ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="p-2 text-xs rounded bg-destructive/15 text-destructive font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Project Name *
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (error) setError(null)
              }}
              placeholder="e.g. Website Redesign, Product Launch"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Description (Optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of this project"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Color Theme
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setColor(preset)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform hover:scale-110 flex items-center justify-center',
                    color === preset && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                  )}
                  style={{ backgroundColor: preset }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Icon
            </label>
            <div className="grid grid-cols-6 gap-2 pt-1">
              {ICONS.map((item) => {
                const IconComponent = item.icon
                const isSelected = icon === item.name
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIcon(item.name)}
                    className={cn(
                      'h-9 rounded-md border flex items-center justify-center text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50',
                      isSelected && 'border-primary bg-primary/10 text-primary'
                    )}
                  >
                    <IconComponent className="h-4 w-4" />
                  </button>
                )
              })}
            </div>
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
              {isPending ? 'Saving...' : projectToEdit ? 'Save Changes' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
