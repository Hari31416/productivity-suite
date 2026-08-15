import { useState, useMemo } from 'react'
import {
  List,
  Calendar as CalendarIcon,
  Kanban,
  Plus,
  Search,
  X,
  SlidersHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type {
  Task,
  TaskViewMode,
  PriorityLevel,
  TaskStatus,
  TaskFilter
} from '../types'
import { useTasks, useTaskTags } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { ProjectSidebar } from './ProjectSidebar'
import { TaskListView } from './views/TaskListView'
import { TaskCalendarView } from './views/TaskCalendarView'
import { TaskKanbanView } from './views/TaskKanbanView'
import { TaskFormModal } from './TaskFormModal'

export function TasksView() {
  const [viewMode, setViewMode] = useState<TaskViewMode>('list')
  const [selectedSmartFilter, setSelectedSmartFilter] = useState<string>('all')
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>(undefined)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus | undefined>(undefined)

  const activeFilter: TaskFilter = useMemo(() => {
    return {
      projectId: selectedProjectId,
      smartFilter: selectedProjectId
        ? undefined
        : (selectedSmartFilter as TaskFilter['smartFilter']),
      priority: priorityFilter !== 'all' ? (priorityFilter as PriorityLevel) : undefined,
      status: statusFilter !== 'all' ? (statusFilter as TaskStatus) : undefined,
      tag: tagFilter !== 'all' ? tagFilter : undefined,
      searchQuery: searchQuery.trim() || undefined,
      includeArchived: selectedSmartFilter === 'archived'
    }
  }, [
    selectedProjectId,
    selectedSmartFilter,
    priorityFilter,
    statusFilter,
    tagFilter,
    searchQuery
  ])

  const { data: tasks = [], isLoading: tasksLoading } = useTasks(activeFilter)
  const { data: projects = [] } = useProjects(false)
  const { data: tags = [] } = useTaskTags()

  const handleSelectSmartFilter = (filterType: string) => {
    setSelectedSmartFilter(filterType)
    setSelectedProjectId(undefined)
    setShowMobileSidebar(false)
  }

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId)
    setSelectedSmartFilter('all')
    setShowMobileSidebar(false)
  }

  const handleOpenNewTask = (date?: string, status?: TaskStatus) => {
    setTaskToEdit(null)
    setDefaultDueDate(date)
    setDefaultStatus(status || 'todo')
    setTaskModalOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setTaskToEdit(task)
    setDefaultDueDate(undefined)
    setDefaultStatus(undefined)
    setTaskModalOpen(true)
  }

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId)
  }, [projects, selectedProjectId])

  const activeFilterTitle = useMemo(() => {
    if (activeProject) return activeProject.name
    switch (selectedSmartFilter) {
      case 'today':
        return "Today's Tasks"
      case 'upcoming':
        return 'Upcoming Tasks'
      case 'overdue':
        return 'Overdue Tasks'
      case 'completed':
        return 'Completed Tasks'
      case 'archived':
        return 'Archived Tasks'
      case 'all':
      default:
        return 'All Tasks'
    }
  }, [activeProject, selectedSmartFilter])

  const hasActiveFilters =
    searchQuery !== '' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    tagFilter !== 'all'

  const handleResetFilters = () => {
    setSearchQuery('')
    setPriorityFilter('all')
    setStatusFilter('all')
    setTagFilter('all')
  }

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tasks & Projects</h2>
          <p className="text-sm text-muted-foreground">
            Manage your projects, deadlines, priorities, and subtask checklists.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border p-1 bg-muted/40 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors',
                viewMode === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Kanban className="h-4 w-4" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <Button
            onClick={() => handleOpenNewTask()}
            className="gap-2 shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout (Sidebar + Content) */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 items-start">
        {/* Left Sidebar (Desktop) */}
        <div className="hidden md:block md:col-span-1 lg:col-span-1 border rounded-xl p-3.5 bg-card/60 shadow-sm sticky top-4">
          <ProjectSidebar
            selectedSmartFilter={selectedSmartFilter}
            selectedProjectId={selectedProjectId}
            onSelectFilter={handleSelectSmartFilter}
            onSelectProject={handleSelectProject}
          />
        </div>

        {/* Right Main Content Area */}
        <div className="md:col-span-3 lg:col-span-4 space-y-4">
          {/* Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border bg-card/60 shadow-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Mobile Sidebar Trigger */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="md:hidden h-9 px-2.5 shrink-0"
              >
                <SlidersHorizontal className="h-4 w-4 mr-1.5" />
                <span>Filters</span>
              </Button>

              {/* Search input */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tasks, descriptions, tags..."
                  className="h-9 pl-8.5 pr-8 text-xs sm:text-sm bg-background"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Filter Dropdowns */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs w-[125px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              {viewMode !== 'kanban' && (
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 text-xs w-[115px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {tags.length > 0 && (
                <Select value={tagFilter} onValueChange={setTagFilter}>
                  <SelectTrigger className="h-9 text-xs w-[115px]">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {tags.map((t) => (
                      <SelectItem key={t} value={t}>
                        #{t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Sidebar Collapsible */}
          {showMobileSidebar && (
            <div className="md:hidden border rounded-xl p-3 bg-card shadow-sm">
              <ProjectSidebar
                selectedSmartFilter={selectedSmartFilter}
                selectedProjectId={selectedProjectId}
                onSelectFilter={handleSelectSmartFilter}
                onSelectProject={handleSelectProject}
              />
            </div>
          )}

          {/* Content Header Title */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              {activeProject && (
                <span
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: activeProject.color || '#3b82f6' }}
                />
              )}
              <h3 className="font-semibold text-lg text-foreground">
                {activeFilterTitle}
              </h3>
              <Badge variant="secondary" className="text-xs font-normal">
                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
              </Badge>
            </div>
          </div>

          {/* Views Area */}
          {viewMode === 'list' && (
            <TaskListView
              tasks={tasks}
              projects={projects}
              onEditTask={handleEditTask}
              onAddTask={handleOpenNewTask}
              isLoading={tasksLoading}
            />
          )}

          {viewMode === 'calendar' && (
            <TaskCalendarView
              tasks={tasks}
              projects={projects}
              onEditTask={handleEditTask}
              onAddTask={handleOpenNewTask}
            />
          )}

          {viewMode === 'kanban' && (
            <TaskKanbanView
              tasks={tasks}
              projects={projects}
              onEditTask={handleEditTask}
              onAddTask={(status) => handleOpenNewTask(undefined, status)}
            />
          )}
        </div>
      </div>

      {/* Task Modal */}
      <TaskFormModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        taskToEdit={taskToEdit}
        defaultDueDate={defaultDueDate}
        defaultProjectId={selectedProjectId}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
