import { useState } from 'react'
import {
  Inbox,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Archive,
  Plus,
  MoreVertical,
  Edit2,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { Project, ProjectWithCount } from '../types'
import {
  useProjectsWithCounts,
  useArchiveProject,
  useDeleteProject
} from '../hooks/useProjects'
import { useTasks } from '../hooks/useTasks'
import { ProjectFormModal } from './ProjectFormModal'

interface ProjectSidebarProps {
  selectedSmartFilter?: string
  selectedProjectId?: string
  onSelectFilter: (filterType: string) => void
  onSelectProject: (projectId: string) => void
  className?: string
}

export function ProjectSidebar({
  selectedSmartFilter,
  selectedProjectId,
  onSelectFilter,
  onSelectProject,
  className
}: ProjectSidebarProps) {
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null)

  const { data: projects = [], isLoading: projectsLoading } = useProjectsWithCounts(false)
  const { data: allTasks = [] } = useTasks({ includeArchived: true })

  const archiveMutation = useArchiveProject()
  const deleteMutation = useDeleteProject()

  const todayStr = new Date().toISOString().split('T')[0]

  const smartCounts = {
    all: allTasks.filter((t) => !t.archived).length,
    today: allTasks.filter((t) => t.dueDate === todayStr && !t.archived).length,
    upcoming: allTasks.filter((t) => t.dueDate && t.dueDate > todayStr && !t.archived).length,
    overdue: allTasks.filter(
      (t) => t.dueDate && t.dueDate < todayStr && t.status !== 'done' && !t.archived
    ).length,
    completed: allTasks.filter((t) => t.status === 'done' && !t.archived).length,
    archived: allTasks.filter((t) => t.archived).length
  }

  const SMART_FILTERS = [
    {
      id: 'all',
      label: 'All Tasks',
      icon: Inbox,
      count: smartCounts.all,
      color: 'text-foreground'
    },
    {
      id: 'today',
      label: 'Today',
      icon: Calendar,
      count: smartCounts.today,
      color: 'text-primary'
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      icon: Clock,
      count: smartCounts.upcoming,
      color: 'text-blue-500'
    },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: AlertCircle,
      count: smartCounts.overdue,
      color: 'text-destructive',
      alert: smartCounts.overdue > 0
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: CheckCircle2,
      count: smartCounts.completed,
      color: 'text-emerald-500'
    },
    {
      id: 'archived',
      label: 'Archived',
      icon: Archive,
      count: smartCounts.archived,
      color: 'text-muted-foreground'
    }
  ]

  const handleEditProject = (proj: ProjectWithCount) => {
    setProjectToEdit(proj)
    setProjectModalOpen(true)
  }

  const handleNewProject = () => {
    setProjectToEdit(null)
    setProjectModalOpen(true)
  }

  return (
    <div className={cn('flex flex-col h-full space-y-6', className)}>
      <div className="space-y-1">
        <div className="px-2 pb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Views & Filters
        </div>
        {SMART_FILTERS.map((item) => {
          const Icon = item.icon
          const isSelected = !selectedProjectId && selectedSmartFilter === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFilter(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors text-left',
                isSelected
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon className={cn('h-4 w-4 shrink-0', item.color)} />
                <span className="truncate">{item.label}</span>
              </div>
              <Badge
                variant={isSelected ? 'default' : 'secondary'}
                className={cn(
                  'text-[11px] h-5 px-1.5 font-normal shrink-0',
                  item.alert && !isSelected && 'bg-destructive/15 text-destructive border-none'
                )}
              >
                {item.count}
              </Badge>
            </button>
          )
        })}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
            Projects
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleNewProject}
            className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            New
          </Button>
        </div>

        {projectsLoading ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="px-3 py-3 rounded-md border border-dashed text-center text-xs text-muted-foreground">
            No projects yet.
            <button
              type="button"
              onClick={handleNewProject}
              className="block w-full text-primary hover:underline font-medium mt-1"
            >
              + Create a project
            </button>
          </div>
        ) : (
          projects.map((proj) => {
            const isSelected = selectedProjectId === proj.id

            return (
              <div
                key={proj.id}
                className={cn(
                  'group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelectProject(proj.id)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color || '#3b82f6' }}
                  />
                  <span className="truncate">{proj.name}</span>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <Badge
                    variant={isSelected ? 'default' : 'secondary'}
                    className="text-[10px] h-4.5 px-1.5 font-normal"
                  >
                    {proj.taskCount}
                  </Badge>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => handleEditProject(proj)}>
                        <Edit2 className="h-3.5 w-3.5 mr-2" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          archiveMutation.mutate({ id: proj.id, archived: true })
                        }
                      >
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        <span>Archive</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteMutation.mutate({ id: proj.id })}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )
          })
        )}
      </div>

      <ProjectFormModal
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
        projectToEdit={projectToEdit}
      />
    </div>
  )
}
