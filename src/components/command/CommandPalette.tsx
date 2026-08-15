import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Search,
  CheckSquare,
  Activity,
  FileText,
  Settings as SettingsIcon,
  LayoutGrid,
  Plus,
  Moon,
  Sun,
  Laptop,
  Download,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import {
  Dialog,
  DialogContent
} from '@/components/ui/dialog'
import { useTheme } from '@/core/theme/useTheme'
import { useHabits } from '@/modules/habits/hooks/useHabits'
import { useTasks } from '@/modules/tasks/hooks/useTasks'
import { useNotes } from '@/modules/notes/hooks/useNotes'
import { exportBackup } from '@/core/backup/backupService'
import { cn } from '@/lib/utils'

export interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRouteChange: (route: string) => void
  onOpenTaskModal: () => void
  onOpenHabitModal: () => void
  onOpenNoteModal: () => void
}

interface CommandItem {
  id: string
  title: string
  subtitle?: string
  icon: React.ElementType
  category: 'actions' | 'navigation' | 'tasks' | 'habits' | 'notes' | 'system'
  onSelect: () => void
  keywords?: string[]
}

export function CommandPalette({
  open,
  onOpenChange,
  onRouteChange,
  onOpenTaskModal,
  onOpenHabitModal,
  onOpenNoteModal
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const { setTheme } = useTheme()
  const listRef = useRef<HTMLDivElement>(null)

  // Data for searching
  const { data: habits = [] } = useHabits(false)
  const { data: tasks = [] } = useTasks({ includeArchived: false })
  const { data: notes = [] } = useNotes({ archived: false })

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  // Reset query and selected index on open
  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Build command items
  const allCommands = useMemo<CommandItem[]>(() => {
    const commands: CommandItem[] = [
      // Quick Actions
      {
        id: 'action-create-task',
        title: 'Create New Task',
        subtitle: 'Add a to-do item with priority and due date',
        icon: Plus,
        category: 'actions',
        keywords: ['task', 'todo', 'add', 'create', 'new'],
        onSelect: () => {
          onOpenChange(false)
          onOpenTaskModal()
        }
      },
      {
        id: 'action-create-habit',
        title: 'Create New Habit',
        subtitle: 'Set up a new recurring habit routine',
        icon: Plus,
        category: 'actions',
        keywords: ['habit', 'streak', 'routine', 'add', 'create', 'new'],
        onSelect: () => {
          onOpenChange(false)
          onOpenHabitModal()
        }
      },
      {
        id: 'action-create-note',
        title: 'Create New Note',
        subtitle: 'Capture a quick note or markdown document',
        icon: Plus,
        category: 'actions',
        keywords: ['note', 'markdown', 'notepad', 'doc', 'write', 'add', 'new'],
        onSelect: () => {
          onOpenChange(false)
          onOpenNoteModal()
        }
      },

      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Go to Dashboard',
        subtitle: 'Overview, productivity score & widgets',
        icon: LayoutGrid,
        category: 'navigation',
        keywords: ['home', 'dashboard', 'score', 'widgets'],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/')
        }
      },
      {
        id: 'nav-habits',
        title: 'Go to Habits',
        subtitle: 'Daily check-ins, streaks & analytics',
        icon: Activity,
        category: 'navigation',
        keywords: ['habits', 'streaks', 'tracking', 'daily'],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/habits')
        }
      },
      {
        id: 'nav-tasks',
        title: 'Go to Tasks',
        subtitle: 'Kanban, list & project view',
        icon: CheckSquare,
        category: 'navigation',
        keywords: ['tasks', 'projects', 'kanban', 'todo', 'list'],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/tasks')
        }
      },
      {
        id: 'nav-notes',
        title: 'Go to Notes',
        subtitle: 'Markdown documents & tagged thoughts',
        icon: FileText,
        category: 'navigation',
        keywords: ['notes', 'notepad', 'docs', 'search', 'markdown'],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/notes')
        }
      },
      {
        id: 'nav-settings',
        title: 'Go to Settings',
        subtitle: 'Storage diagnostics, backup & theme',
        icon: SettingsIcon,
        category: 'navigation',
        keywords: ['settings', 'preferences', 'backup', 'export', 'storage'],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/settings')
        }
      },

      // System / Quick Actions
      {
        id: 'system-export-backup',
        title: 'Export Backup JSON',
        subtitle: 'Download complete local database backup',
        icon: Download,
        category: 'system',
        keywords: ['export', 'backup', 'json', 'download', 'save'],
        onSelect: async () => {
          onOpenChange(false)
          await exportBackup()
        }
      },
      {
        id: 'theme-toggle-light',
        title: 'Theme: Switch to Light',
        subtitle: 'Set clean light appearance',
        icon: Sun,
        category: 'system',
        keywords: ['theme', 'light', 'appearance', 'white', 'bright'],
        onSelect: () => {
          setTheme('light')
          onOpenChange(false)
        }
      },
      {
        id: 'theme-toggle-dark',
        title: 'Theme: Switch to Dark',
        subtitle: 'Set high-contrast dark appearance',
        icon: Moon,
        category: 'system',
        keywords: ['theme', 'dark', 'appearance', 'black', 'night'],
        onSelect: () => {
          setTheme('dark')
          onOpenChange(false)
        }
      },
      {
        id: 'theme-toggle-system',
        title: 'Theme: Match System',
        subtitle: 'Sync with operating system preference',
        icon: Laptop,
        category: 'system',
        keywords: ['theme', 'system', 'auto', 'appearance', 'os'],
        onSelect: () => {
          setTheme('system')
          onOpenChange(false)
        }
      }
    ]

    // Append habits matching
    for (const habit of habits) {
      commands.push({
        id: `habit-${habit.id}`,
        title: habit.title,
        subtitle: `Habit • ${habit.frequencyType}`,
        icon: Activity,
        category: 'habits',
        keywords: ['habit', habit.title, habit.frequencyType, habit.description || ''],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/habits')
        }
      })
    }

    // Append tasks matching
    for (const task of tasks) {
      commands.push({
        id: `task-${task.id}`,
        title: task.title,
        subtitle: `Task • ${task.status} • Priority: ${task.priority}`,
        icon: CheckSquare,
        category: 'tasks',
        keywords: ['task', task.title, task.status, task.priority, ...(task.tags || [])],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/tasks')
        }
      })
    }

    // Append notes matching
    for (const note of notes) {
      commands.push({
        id: `note-${note.id}`,
        title: note.title || 'Untitled Note',
        subtitle: `Note • ${note.wordCount} words`,
        icon: FileText,
        category: 'notes',
        keywords: ['note', note.title, note.content, ...(note.tags || [])],
        onSelect: () => {
          onOpenChange(false)
          onRouteChange('/notes')
        }
      })
    }

    return commands
  }, [habits, tasks, notes, onRouteChange, onOpenTaskModal, onOpenHabitModal, onOpenNoteModal, onOpenChange, setTheme])

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      // Return default top list
      return allCommands.filter(
        (c) => c.category === 'actions' || c.category === 'navigation' || c.category === 'system'
      )
    }

    return allCommands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q)
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(q)
      const matchKeywords = cmd.keywords?.some((k) => k.toLowerCase().includes(q))
      return matchTitle || matchSubtitle || matchKeywords
    })
  }, [allCommands, query])

  // Reset selected index when filtered list changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredCommands.length, query])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev <= 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      )
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].onSelect()
      }
    }
   Stephen:
    if (e.key === 'Escape') {
      onOpenChange(false)
    }
  }

  // Group filtered items for nice category display
  const categoryLabels: Record<string, string> = {
    actions: 'Quick Actions',
    navigation: 'Navigation',
    tasks: 'Tasks',
    habits: 'Habits',
    notes: 'Notes',
    system: 'Preferences & System'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-xl overflow-hidden shadow-2xl border bg-card">
        {/* Search Input Bar */}
        <div className="flex items-center border-b px-3.5 py-3 gap-2.5">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Type a command, jump to task, habit, note..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none text-foreground"
            autoFocus
          />
          <kbd className="pointer-events-none hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto p-2 divide-y divide-border/40"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands or items found for "{query}".
            </div>
          ) : (
            <div className="space-y-1">
              {filteredCommands.map((command, idx) => {
                const isSelected = idx === selectedIndex
                const Icon = command.icon

                return (
                  <button
                    key={command.id}
                    type="button"
                    onClick={() => command.onSelect()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={cn(
                      'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition-colors',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted/60'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md border',
                          isSelected
                            ? 'border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground'
                            : 'border-border bg-muted/40 text-muted-foreground'
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn('font-medium truncate', isSelected ? 'text-primary-foreground' : 'text-foreground')}>
                          {command.title}
                        </p>
                        {command.subtitle && (
                          <p
                            className={cn(
                              'text-[11px] truncate',
                              isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                            )}
                          >
                            {command.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded capitalize font-medium',
                          isSelected
                            ? 'bg-primary-foreground/20 text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {categoryLabels[command.category] || command.category}
                      </span>
                      {isSelected && (
                        <ArrowRight className="h-3.5 w-3.5 text-primary-foreground" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="border-t bg-muted/30 px-3 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border bg-background px-1 py-0.5 font-mono text-[10px]">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <Sparkles className="h-3 w-3 text-primary" /> Command Suite
          </span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
