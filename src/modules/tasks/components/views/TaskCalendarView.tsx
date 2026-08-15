import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Project } from '../../types'
import { TaskCard, PRIORITY_CONFIG } from '../TaskCard'

interface TaskCalendarViewProps {
  tasks: Task[]
  projects: Project[]
  onEditTask: (task: Task) => void
  onAddTask?: (defaultDate?: string) => void
}

type CalendarMode = 'month' | 'week'

export function TaskCalendarView({
  tasks,
  projects,
  onEditTask,
  onAddTask
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const projectMap = useMemo(() => {
    const map = new Map<string, Project>()
    for (const p of projects) {
      map.set(p.id, p)
    }
    return map
  }, [projects])

  // Map tasks by due date (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>()
    for (const task of tasks) {
      if (task.dueDate) {
        const list = map.get(task.dueDate) || []
        list.push(task)
        map.set(task.dueDate, list)
      }
    }
    return map
  }, [tasks])

  const calendarDays = useMemo(() => {
    if (calendarMode === 'month') {
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(monthStart)
      const startDate = startOfWeek(monthStart, { weekStartsOn: 0 })
      const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: startDate, end: endDate })
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, calendarMode])

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayTasks = tasksByDate.get(selectedDateStr) || []

  const handlePrev = () => {
    if (calendarMode === 'month') {
      setCurrentDate((d) => subMonths(d, 1))
    } else {
      setCurrentDate((d) => subWeeks(d, 1))
    }
  }

  const handleNext = () => {
    if (calendarMode === 'month') {
      setCurrentDate((d) => addMonths(d, 1))
    } else {
      setCurrentDate((d) => addWeeks(d, 1))
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const weekDayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-4">
      {/* Calendar Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs h-8"
          >
            Today
          </Button>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="font-semibold text-base sm:text-lg text-foreground ml-1">
            {calendarMode === 'month'
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5 bg-muted/30 text-xs">
            <button
              type="button"
              onClick={() => setCalendarMode('month')}
              className={cn(
                'px-2.5 py-1 rounded font-medium transition-colors',
                calendarMode === 'month'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Month
            </button>
            <button
              type="button"
              onClick={() => setCalendarMode('week')}
              className={cn(
                'px-2.5 py-1 rounded font-medium transition-colors',
                calendarMode === 'week'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Week
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => onAddTask?.(selectedDateStr)}
            className="h-8 text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid & Selected Day Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Grid */}
        <div className="lg:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center py-2 text-xs font-semibold text-muted-foreground">
            {weekDayHeaders.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div
            className={cn(
              'grid grid-cols-7 divide-x divide-y border-b text-xs',
              calendarMode === 'month' ? 'auto-rows-[64px] sm:auto-rows-[105px]' : 'auto-rows-[120px] sm:auto-rows-[180px]'
            )}
          >
            {calendarDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd')
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentDate)
              const dayTasks = tasksByDate.get(dayStr) || []
              const dayIsToday = isToday(day)

              return (
                <div
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'p-1 sm:p-1.5 flex flex-col justify-between transition-colors cursor-pointer hover:bg-muted/30 relative select-none',
                    !isCurrentMonth && calendarMode === 'month' && 'bg-muted/15 text-muted-foreground/60',
                    isSelected && 'bg-primary/5 ring-2 ring-primary/60 ring-inset z-10'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'h-5 w-5 sm:h-6 sm:w-6 rounded-full flex items-center justify-center font-medium text-[11px] sm:text-xs',
                        dayIsToday && 'bg-primary text-primary-foreground font-bold shadow-xs',
                        !dayIsToday && isSelected && 'font-bold text-foreground',
                        !dayIsToday && !isSelected && 'text-muted-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                    {dayTasks.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] text-muted-foreground font-medium px-0.5 sm:px-1">
                        {dayTasks.length}
                      </span>
                    )}
                  </div>

                  {/* Mobile Compact Dots (shown on <sm) */}
                  <div className="flex sm:hidden items-center justify-center gap-1 my-auto flex-wrap max-h-[24px] overflow-hidden">
                    {dayTasks.slice(0, 4).map((task) => {
                      const priority = PRIORITY_CONFIG[task.priority]
                      return (
                        <span
                          key={task.id}
                          className={cn(
                            'h-1.5 w-1.5 rounded-full shrink-0',
                            task.status === 'done' ? 'bg-muted-foreground/40' : priority?.dotClass || 'bg-primary'
                          )}
                        />
                      )
                    })}
                    {dayTasks.length > 4 && (
                      <span className="text-[8px] text-muted-foreground font-semibold">+</span>
                    )}
                  </div>

                  {/* Desktop Task list pills (hidden on mobile, shown on sm+) */}
                  <div className="hidden sm:block space-y-1 overflow-hidden my-auto max-h-[56px] sm:max-h-[68px]">
                    {dayTasks.slice(0, 3).map((task) => {
                      const priority = PRIORITY_CONFIG[task.priority]
                      return (
                        <div
                          key={task.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTask(task)
                          }}
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded truncate border flex items-center gap-1 font-medium transition-transform hover:scale-[1.02]',
                            task.status === 'done'
                              ? 'bg-muted/60 text-muted-foreground line-through border-transparent'
                              : 'bg-card text-foreground border-border/80'
                          )}
                        >
                          <span
                            className={cn('h-1.5 w-1.5 rounded-full shrink-0', priority?.dotClass)}
                          />
                          <span className="truncate">{task.title}</span>
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1 font-medium">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected Day Task Panel */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <div className="space-y-0.5">
                <div className="text-xs text-muted-foreground font-medium">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
                </div>
                <h4 className="text-base font-semibold text-foreground">
                  {format(selectedDate, 'MMMM d, yyyy')}
                </h4>
              </div>
              <Badge variant="secondary" className="text-xs">
                {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
              </Badge>
            </div>

            {selectedDayTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <CalendarIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                <p>No tasks scheduled for this day.</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddTask?.(selectedDateStr)}
                  className="mt-3 text-xs gap-1.5"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Task</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {selectedDayTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    project={task.projectId ? projectMap.get(task.projectId) : undefined}
                    onEdit={onEditTask}
                    compact
                  />
                ))}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddTask?.(selectedDateStr)}
            className="w-full text-xs gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task for {format(selectedDate, 'MMM d')}</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
