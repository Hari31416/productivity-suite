import { useState, useMemo, useEffect, useRef } from 'react'
import { format } from 'date-fns'
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
import { useHashRoute } from '@/core/router/hashRouter'
import type {
  Task,
  TaskViewMode,
  PriorityLevel,
  TaskStatus,
  TaskFilter
} from '../types'
import { useTasks, useTaskTags, useCreateTask } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { parseSmartTaskInput } from '../utils/smartTaskParser'
import { taskRepository } from '../repository/taskRepository'
import { ProjectSidebar } from './ProjectSidebar'
import { TaskListView } from './views/TaskListView'
import { TaskCalendarView } from './views/TaskCalendarView'
import { TaskKanbanView } from './views/TaskKanbanView'
import { TaskFormModal } from './TaskFormModal'

export function TasksView() {
  const { queryParams, navigate } = useHashRoute()
  const deepLinkedTaskId = queryParams.taskId
  const processedDeepLinkRef = useRef<string | null>(null)

  const [viewMode, setViewMode] = useState<TaskViewMode>('list')
  const [selectedSmartFilter, setSelectedSmartFilter] = useState<string>('all')
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [quickTitle, setQuickTitle] = useState('')
  const [quickPriority, setQuickPriority] = useState<PriorityLevel>('medium')

  // Modals state
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)
  const [defaultDueDate, setDefaultDueDate] = useState<string | undefined>(undefined)
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus | undefined>(undefined)

  const { data: projects = [] } = useProjects(false)

  const parsedQuickTask = useMemo(() => {
    return parseSmartTaskInput(quickTitle, projects)
  }, [quickTitle, projects])

  const activeFilter: TaskFilter = useMemo(() => {
    return {
      projectId: selectedProjectId,
      smartFilter: selectedSmartFilter !== 'all'
        ? (selectedSmartFilter as TaskFilter['smartFilter'])
        : undefined,
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
  const { data: tags = [] } = useTaskTags()
  const createTaskMutation = useCreateTask()

  const highlightTaskCard = (taskId: string) => {
    let attempts = 0
    const tryHighlight = () => {
      const el = document.getElementById(`task-card-${taskId}`)
      if (el) {
        el.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
        el.classList.add(
          'ring-2',
          'ring-primary',
          'ring-offset-2',
          'ring-offset-background',
          'shadow-lg',
          'shadow-primary/25',
          'transition-all',
          'duration-300'
        )
        setTimeout(() => {
          el.classList.remove(
            'ring-2',
            'ring-primary',
            'ring-offset-2',
            'ring-offset-background',
            'shadow-lg',
            'shadow-primary/25'
          )
        }, 3000)
      } else if (attempts < 10) {
        attempts++
        setTimeout(tryHighlight, 100)
      }
    }
    setTimeout(tryHighlight, 50)
  }

  // Auto-open and focus target task when taskId is present in route query params
  useEffect(() => {
    if (!deepLinkedTaskId) {
      processedDeepLinkRef.current = null
      return
    }

    if (processedDeepLinkRef.current === deepLinkedTaskId) {
      return
    }

    let isMounted = true

    const openDeepLinkedTask = async () => {
      // First check in currently loaded tasks list
      const matched = tasks.find((t) => t.id === deepLinkedTaskId)
      if (matched) {
        processedDeepLinkRef.current = deepLinkedTaskId
        setTaskToEdit(matched)
        setTaskModalOpen(true)
        highlightTaskCard(deepLinkedTaskId)
        return
      }

      // If not yet in list (or loading / filtered out), fetch directly from repository
      try {
        const directTask = await taskRepository.getTaskById(deepLinkedTaskId)
        if (directTask && isMounted) {
          processedDeepLinkRef.current = deepLinkedTaskId
          setTaskToEdit(directTask)
          setTaskModalOpen(true)
          highlightTaskCard(deepLinkedTaskId)
        }
      } catch {
        // Task not found
      }
    }

    openDeepLinkedTask()

    return () => {
      isMounted = false
    }
  }, [deepLinkedTaskId, tasks])

  const handleModalOpenChange = (open: boolean) => {
    setTaskModalOpen(open)
    if (!open) {
      setTaskToEdit(null)
      if (deepLinkedTaskId) {
        navigate('/tasks', undefined, true)
      }
    }
  }

  const handleSelectSmartFilter = (filterType: string) => {
    setSelectedSmartFilter(filterType)
    setShowMobileSidebar(false)
  }

  const handleSelectProject = (projectId: string | undefined) => {
    setSelectedProjectId(projectId)
    setShowMobileSidebar(false)
  }

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = quickTitle.trim()
    if (!trimmed) return

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const finalDueDate = parsedQuickTask.dueDate || (selectedSmartFilter === 'today' ? todayStr : undefined)
    const finalPriority = parsedQuickTask.priority || quickPriority
    const finalProjectId = parsedQuickTask.projectId || selectedProjectId
    const finalTitle = parsedQuickTask.title || trimmed

    await createTaskMutation.mutateAsync({
      taskData: {
        title: finalTitle,
        projectId: finalProjectId,
        priority: finalPriority,
        status: 'todo',
        dueDate: finalDueDate,
        tags: parsedQuickTask.tags,
        archived: false
      }
    })

    setQuickTitle('')
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
    const parts: string[] = []
    if (activeProject) parts.push(activeProject.name)
    switch (selectedSmartFilter) {
      case 'today':
        parts.push("Today's Tasks")
        break
      case 'upcoming':
        parts.push('Upcoming Tasks')
        break
      case 'overdue':
        parts.push('Overdue Tasks')
        break
      case 'completed':
        parts.push('Completed Tasks')
        break
      case 'archived':
        parts.push('Archived Tasks')
        break
      case 'all':
      default:
        if (!activeProject) parts.push('All Tasks')
        break
    }
    return parts.join(' • ')
  }, [activeProject, selectedSmartFilter])

  const hasActiveFilters =
    searchQuery !== '' ||
    priorityFilter !== 'all' ||
    statusFilter !== 'all' ||
    tagFilter !== 'all' ||
    selectedProjectId !== undefined ||
    selectedSmartFilter !== 'all'

  const handleResetFilters = () => {
    setSearchQuery('')
    setPriorityFilter('all')
    setStatusFilter('all')
    setTagFilter('all')
    setSelectedProjectId(undefined)
    setSelectedSmartFilter('all')
  }

  const smartFilterCounts = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const activeTasks = tasks.filter((t) => !t.archived)
    return {
      all: activeTasks.length,
      today: activeTasks.filter((t) => t.dueDate === todayStr && t.status !== 'done').length,
      upcoming: activeTasks.filter((t) => t.dueDate && t.dueDate > todayStr && t.status !== 'done').length,
      overdue: activeTasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== 'done').length
    }
  }, [tasks])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Top Header Bar & View Switcher (No duplicate title banner) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* View Mode Toggle */}
        <div className="inline-flex rounded-xl border p-1 bg-muted/50 text-xs w-full sm:w-auto shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors flex-1 sm:flex-initial text-xs',
              viewMode === 'list'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-4 w-4" />
            <span>List</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors flex-1 sm:flex-initial text-xs',
              viewMode === 'calendar'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <span>Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors flex-1 sm:flex-initial text-xs',
              viewMode === 'kanban'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Kanban className="h-4 w-4" />
            <span>Kanban</span>
          </button>
        </div>

        {/* Quick Filter Chips (Shown only on List view) */}
        {viewMode === 'list' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Button
              variant={selectedSmartFilter === 'all' && !selectedProjectId ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectSmartFilter('all')}
              className="h-8 text-xs rounded-full px-3 gap-1.5 font-medium shrink-0"
            >
              <span>All</span>
              <span className="opacity-70 text-[11px]">{smartFilterCounts.all}</span>
            </Button>
            <Button
              variant={selectedSmartFilter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectSmartFilter('today')}
              className="h-8 text-xs rounded-full px-3 gap-1.5 font-medium shrink-0"
            >
              <span>Today</span>
              <span className="opacity-70 text-[11px]">{smartFilterCounts.today}</span>
            </Button>
            <Button
              variant={selectedSmartFilter === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSelectSmartFilter('upcoming')}
              className="h-8 text-xs rounded-full px-3 gap-1.5 font-medium shrink-0"
            >
              <span>Upcoming</span>
              <span className="opacity-70 text-[11px]">{smartFilterCounts.upcoming}</span>
            </Button>
            {smartFilterCounts.overdue > 0 && (
              <Button
                variant={selectedSmartFilter === 'overdue' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => handleSelectSmartFilter('overdue')}
                className="h-8 text-xs rounded-full px-3 gap-1.5 font-medium shrink-0"
              >
                <span>Overdue</span>
                <span className="opacity-80 text-[11px]">{smartFilterCounts.overdue}</span>
              </Button>
            )}

            <Button
              size="sm"
              onClick={() => handleOpenNewTask()}
              className="hidden sm:inline-flex h-8 gap-1.5 shadow-xs shrink-0 text-xs px-3.5 rounded-xl font-medium ml-auto"
            >
              <Plus className="h-4 w-4" />
              <span>New Task</span>
            </Button>
          </div>
        )}
      </div>

      {/* LIST VIEW */}
      {viewMode === 'list' && (
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border bg-card/60 shadow-sm">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Mobile Sidebar & Filters Trigger */}
                <Button
                  variant={showMobileSidebar || (priorityFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all') ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  className="md:hidden h-8 sm:h-9 px-2.5 shrink-0 text-xs gap-1.5"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>Filters</span>
                  {(priorityFilter !== 'all' || statusFilter !== 'all' || tagFilter !== 'all' || selectedProjectId || selectedSmartFilter !== 'all') && (
                    <span className="ml-0.5 rounded-full bg-primary-foreground text-primary text-[10px] w-4 h-4 inline-flex items-center justify-center font-bold">
                      {[priorityFilter !== 'all', statusFilter !== 'all', tagFilter !== 'all', !!selectedProjectId, selectedSmartFilter !== 'all'].filter(Boolean).length}
                    </span>
                  )}
                </Button>

                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tasks, tags..."
                    className="h-8 sm:h-9 pl-8 pr-8 text-xs sm:text-sm bg-background"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Dropdowns (Desktop always, mobile when toggled) */}
              <div className="hidden md:flex items-center gap-2 flex-wrap sm:flex-nowrap">
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

            {/* Active Filter Chips Banner */}
            {hasActiveFilters && (
              <div className="flex items-center gap-1.5 flex-wrap px-1 text-xs">
                <span className="text-muted-foreground font-medium text-[11px]">Active filters:</span>
                {selectedSmartFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <span>Filter: {selectedSmartFilter}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedSmartFilter('all')}
                      className="hover:text-foreground"
                      aria-label="Remove smart filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {selectedProjectId && activeProject && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: activeProject.color || '#3b82f6' }}
                    />
                    <span>Project: {activeProject.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProjectId(undefined)}
                      className="hover:text-foreground"
                      aria-label="Remove project filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {priorityFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal capitalize">
                    <span>Priority: {priorityFilter}</span>
                    <button
                      type="button"
                      onClick={() => setPriorityFilter('all')}
                      className="hover:text-foreground"
                      aria-label="Remove priority filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal capitalize">
                    <span>Status: {statusFilter.replace('_', ' ')}</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('all')}
                      className="hover:text-foreground"
                      aria-label="Remove status filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {tagFilter !== 'all' && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <span>Tag: #{tagFilter}</span>
                    <button
                      type="button"
                      onClick={() => setTagFilter('all')}
                      className="hover:text-foreground"
                      aria-label="Remove tag filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1 text-xs font-normal">
                    <span>Search: "{searchQuery}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="hover:text-foreground"
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] text-primary hover:underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Mobile Sidebar Collapsible */}
            {showMobileSidebar && (
              <div className="md:hidden border rounded-xl p-3 bg-card shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-semibold text-foreground">Filter Properties</span>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Reset all
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Priority</label>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="h-8 text-xs w-full">
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
                  </div>

                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-8 text-xs w-full">
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
                  </div>

                  {tags.length > 0 && (
                    <div className="col-span-2">
                      <label className="text-[11px] text-muted-foreground block mb-1">Tag</label>
                      <Select value={tagFilter} onValueChange={setTagFilter}>
                        <SelectTrigger className="h-8 text-xs w-full">
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
                    </div>
                  )}
                </div>

                <div className="border-t pt-2">
                  <span className="text-xs font-semibold text-foreground block mb-2">Projects & Lists</span>
                  <ProjectSidebar
                    selectedSmartFilter={selectedSmartFilter}
                    selectedProjectId={selectedProjectId}
                    onSelectFilter={handleSelectSmartFilter}
                    onSelectProject={handleSelectProject}
                  />
                </div>
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

            {/* Quick Add Task Input with Smart Parser */}
            <div className="space-y-1.5">
              <form onSubmit={handleQuickAddTask} className="flex gap-1.5 sm:gap-2 items-center">
                <Input
                  placeholder="Add task... (!urgent, @tomorrow, #tag)"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  className="h-9 text-xs sm:text-sm flex-1 min-w-0"
                />
                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as PriorityLevel)}
                  className="h-9 rounded-md border bg-background px-2 sm:px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring shrink-0"
                  aria-label="Task priority"
                >
                  <option value="low">Low</option>
                  <option value="medium">Med</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
                <Button type="submit" size="sm" className="h-9 px-3 sm:px-4 text-xs font-medium shrink-0" disabled={!quickTitle.trim()}>
                  Add
                </Button>
              </form>

              {/* Smart Token Live Preview */}
              {(parsedQuickTask.priority || parsedQuickTask.dueDate || parsedQuickTask.projectName || parsedQuickTask.tags.length > 0) && (
                <div className="flex items-center gap-1.5 text-[11px] px-1 flex-wrap text-muted-foreground">
                  <span className="font-medium text-foreground">Parsed:</span>
                  {parsedQuickTask.priority && (
                    <Badge variant="outline" className="text-[10px] h-4 py-0 capitalize border-amber-500/40 text-amber-600 dark:text-amber-400">
                      !{parsedQuickTask.priority}
                    </Badge>
                  )}
                  {parsedQuickTask.dueDate && (
                    <Badge variant="outline" className="text-[10px] h-4 py-0 border-blue-500/40 text-blue-600 dark:text-blue-400">
                      @{parsedQuickTask.dueDate}
                    </Badge>
                  )}
                  {parsedQuickTask.projectName && (
                    <Badge variant="outline" className="text-[10px] h-4 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                      #{parsedQuickTask.projectName}
                    </Badge>
                  )}
                  {parsedQuickTask.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] h-4 py-0">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* List View Component */}
            <TaskListView
              tasks={tasks}
              projects={projects}
              onEditTask={handleEditTask}
              onAddTask={handleOpenNewTask}
              isLoading={tasksLoading}
            />
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <TaskCalendarView
          tasks={tasks}
          projects={projects}
          onEditTask={handleEditTask}
          onAddTask={handleOpenNewTask}
        />
      )}

      {/* KANBAN VIEW */}
      {viewMode === 'kanban' && (
        <TaskKanbanView
          tasks={tasks}
          projects={projects}
          onEditTask={handleEditTask}
          onAddTask={(status) => handleOpenNewTask(undefined, status)}
        />
      )}

      {/* Task Modal */}
      <TaskFormModal
        open={taskModalOpen}
        onOpenChange={handleModalOpenChange}
        taskToEdit={taskToEdit}
        defaultDueDate={defaultDueDate}
        defaultProjectId={selectedProjectId}
        defaultStatus={defaultStatus}
      />
    </div>
  )
}
