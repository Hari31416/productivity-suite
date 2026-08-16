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
  subWeeks,
  addDays,
  subDays
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Circle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Task, Project } from '../../types'
import { PRIORITY_CONFIG } from '../TaskCard'
import { useUpdateTaskStatus } from '../../hooks/useTasks'

interface TaskCalendarViewProps {
  tasks: Task[]
  projects: Project[]
  onEditTask: (task: Task) => void
  onAddTask?: (defaultDate?: string) => void
}

type CalendarMode = 'day' | 'week' | 'month'

const TIME_SLOTS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00'
]

export function TaskCalendarView({
  tasks,
  projects,
  onEditTask,
  onAddTask
}: TaskCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('month')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const updateStatusMutation = useUpdateTaskStatus()

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
    } else if (calendarMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    } else {
      // Day mode week strip
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 })
      return eachDayOfInterval({ start: weekStart, end: weekEnd })
    }
  }, [currentDate, selectedDate, calendarMode])

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const selectedDayTasks = tasksByDate.get(selectedDateStr) || []

  const handlePrev = () => {
    if (calendarMode === 'month') {
      setCurrentDate((d) => subMonths(d, 1))
    } else if (calendarMode === 'week') {
      setCurrentDate((d) => subWeeks(d, 1))
      setSelectedDate((d) => subWeeks(d, 1))
    } else {
      setSelectedDate((d) => subDays(d, 1))
      setCurrentDate((d) => subDays(d, 1))
    }
  }

  const handleNext = () => {
    if (calendarMode === 'month') {
      setCurrentDate((d) => addMonths(d, 1))
    } else if (calendarMode === 'week') {
      setCurrentDate((d) => addWeeks(d, 1))
      setSelectedDate((d) => addWeeks(d, 1))
    } else {
      setSelectedDate((d) => addDays(d, 1))
      setCurrentDate((d) => addDays(d, 1))
    }
  }

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    setSelectedDate(today)
  }

  const weekDayHeaders = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  // Split day tasks into All Day vs Hourly slots
  const { allDayTasks, hourlyTasks } = useMemo(() => {
    const allDay: Task[] = []
    const hourly: Record<string, Task[]> = {}

    for (const slot of TIME_SLOTS) {
      hourly[slot] = []
    }

    for (const task of selectedDayTasks) {
      if (!task.dueTime) {
        allDay.push(task)
      } else {
        const hourPrefix = task.dueTime.slice(0, 2) + ':00'
        if (hourly[hourPrefix]) {
          hourly[hourPrefix].push(task)
        } else {
          allDay.push(task)
        }
      }
    }

    return { allDayTasks: allDay, hourlyTasks: hourly }
  }, [selectedDayTasks])

  return (
    <div className="space-y-4">
      {/* Calendar Header & View Switcher */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
            {calendarMode === 'month' && format(currentDate, 'MMMM yyyy')}
            {calendarMode === 'day' && format(selectedDate, 'MMM d, yyyy')}
            {calendarMode === 'week' && `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs h-7 px-2"
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          {/* Segmented View Switcher: Day | Week | Month */}
          <div className="inline-flex rounded-xl border p-0.5 bg-muted/30 text-xs">
            {(['day', 'week', 'month'] as CalendarMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setCalendarMode(mode)}
                className={cn(
                  'px-2.5 py-1 rounded-lg font-medium capitalize transition-colors text-xs',
                  calendarMode === mode
                    ? 'bg-background text-primary font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => onAddTask?.(selectedDateStr)}
            className="h-8 w-8 sm:w-auto p-0 sm:px-3 text-xs gap-1.5 rounded-xl shrink-0"
            aria-label="Add task"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Task</span>
          </Button>
        </div>
      </div>

      {/* MONTH VIEW */}
      {calendarMode === 'month' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Month Calendar Grid */}
          <div className="lg:col-span-2 rounded-2xl border bg-card shadow-xs p-3 sm:p-4">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 text-center pb-3 text-[11px] font-semibold text-muted-foreground tracking-wider">
              {weekDayHeaders.map((day) => (
                <div key={day}>{day}</div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
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
                    className="flex flex-col items-center justify-center py-1 cursor-pointer select-none group"
                  >
                    <span
                      className={cn(
                        'h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-medium text-xs sm:text-sm transition-all',
                        isSelected
                          ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                          : dayIsToday
                          ? 'border-2 border-primary text-primary font-bold'
                          : isCurrentMonth
                          ? 'text-foreground group-hover:bg-muted/50'
                          : 'text-muted-foreground/40'
                      )}
                    >
                      {format(day, 'd')}
                    </span>

                    {/* Task Indicator Dot(s) */}
                    <div className="h-1.5 flex items-center justify-center gap-0.5 mt-0.5">
                      {dayTasks.length > 0 && (
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            isSelected
                              ? 'bg-primary-foreground'
                              : dayTasks.some((t) => t.priority === 'urgent' || t.priority === 'high')
                              ? 'bg-rose-500'
                              : 'bg-primary'
                          )}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda List for Selected Date */}
          <div className="rounded-2xl border bg-card shadow-xs p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b">
                <h4 className="font-semibold text-sm sm:text-base text-foreground">
                  {format(selectedDate, 'MMM d, yyyy')}
                </h4>
                <Badge variant="secondary" className="text-xs font-normal">
                  {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'task' : 'tasks'}
                </Badge>
              </div>

              <div className="space-y-2 pt-3">
                {selectedDayTasks.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-xs text-muted-foreground">No tasks scheduled for this day.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 text-xs gap-1 rounded-xl"
                      onClick={() => onAddTask?.(selectedDateStr)}
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Task</span>
                    </Button>
                  </div>
                ) : (
                  selectedDayTasks.map((task) => {
                    const priority = PRIORITY_CONFIG[task.priority]
                    const project = task.projectId ? projectMap.get(task.projectId) : undefined

                    return (
                      <div
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className={cn(
                          'group flex items-center justify-between gap-3 p-3 rounded-xl border bg-background/50 hover:bg-muted/40 transition-all cursor-pointer shadow-2xs',
                          task.status === 'done' && 'opacity-60 bg-muted/20'
                        )}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatusMutation.mutate({
                                id: task.id,
                                status: task.status === 'done' ? 'todo' : 'done'
                              })
                            }}
                            className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                          >
                            {task.status === 'done' ? (
                              <CheckCircle2 className="h-4 w-4 text-primary fill-primary/10" />
                            ) : (
                              <Circle className="h-4 w-4" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <p
                              className={cn(
                                'font-medium text-xs sm:text-sm text-foreground truncate',
                                task.status === 'done' && 'line-through text-muted-foreground'
                              )}
                            >
                              {task.title}
                            </p>
                            {project && (
                              <span className="text-[10px] text-muted-foreground">
                                {project.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-muted-foreground font-medium">
                          {task.dueTime ? (
                            <span>{task.dueTime}</span>
                          ) : (
                            <span className="text-[10px]">All Day</span>
                          )}
                          <span
                            className="h-2 w-2 rounded-full ml-1"
                            style={{ backgroundColor: priority?.color || '#10b981' }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {selectedDayTasks.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddTask?.(selectedDateStr)}
                className="w-full mt-4 text-xs gap-1.5 rounded-xl"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Task for {format(selectedDate, 'MMM d')}</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* DAY VIEW (Time-Blocked Timeline View) */}
      {calendarMode === 'day' && (
        <div className="space-y-4">
          {/* Day Selector Strip */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 p-2 rounded-2xl border bg-card text-center shadow-xs">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate)
              const dayStr = format(day, 'yyyy-MM-dd')
              const hasTasks = (tasksByDate.get(dayStr) || []).length > 0

              return (
                <div
                  key={dayStr}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-1 rounded-xl cursor-pointer transition-all select-none',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/40'
                  )}
                >
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground">
                    {format(day, 'EEE').toUpperCase()}
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all',
                      isSelected ? 'bg-primary text-primary-foreground shadow-xs' : 'text-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  {hasTasks && (
                    <span className="h-1 w-1 rounded-full bg-primary mt-1" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Time-Blocked Schedule Container */}
          <div className="rounded-2xl border bg-card shadow-xs p-4 sm:p-6 space-y-4">
            {/* All Day Section */}
            {allDayTasks.length > 0 && (
              <div className="space-y-2 pb-3 border-b">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  All Day
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allDayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="p-3 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-between border-l-4 border-l-primary"
                    >
                      <span className="font-medium text-xs sm:text-sm text-foreground truncate">
                        {task.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0 ml-2">All day</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly Time Slots */}
            <div className="space-y-3">
              {TIME_SLOTS.map((slot) => {
                const slotTasks = hourlyTasks[slot] || []
                return (
                  <div key={slot} className="flex items-start gap-4 group">
                    <span className="w-12 text-xs font-medium text-muted-foreground shrink-0 pt-2">
                      {slot}
                    </span>

                    <div className="flex-1 min-h-[44px] rounded-xl border border-dashed border-muted-foreground/20 p-1 transition-colors group-hover:border-primary/40">
                      {slotTasks.length === 0 ? (
                        <div
                          onClick={() => onAddTask?.(selectedDateStr)}
                          className="h-full min-h-[36px] flex items-center justify-start px-3 text-xs text-muted-foreground/40 hover:text-primary cursor-pointer transition-colors"
                        >
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            + Add at {slot}
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          {slotTasks.map((task) => {
                            const project = task.projectId ? projectMap.get(task.projectId) : undefined
                            return (
                              <div
                                key={task.id}
                                onClick={() => onEditTask(task)}
                                className={cn(
                                  'p-2.5 sm:p-3 rounded-xl border bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-between border-l-4 shadow-2xs',
                                  task.priority === 'urgent' || task.priority === 'high'
                                    ? 'border-l-rose-500 bg-rose-500/5'
                                    : 'border-l-primary bg-primary/5'
                                )}
                              >
                                <div className="min-w-0">
                                  <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                    {task.title}
                                  </p>
                                  {project && (
                                    <span className="text-[10px] text-muted-foreground">
                                      {project.name}
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] font-medium text-muted-foreground shrink-0 ml-2">
                                  {task.dueTime || slot}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* WEEK VIEW */}
      {calendarMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {calendarDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd')
            const dayTasks = tasksByDate.get(dayStr) || []
            const dayIsToday = isToday(day)

            return (
              <div
                key={dayStr}
                className={cn(
                  'rounded-2xl border bg-card p-3 shadow-xs space-y-2 min-h-[220px] flex flex-col justify-between',
                  dayIsToday && 'border-primary/40 bg-primary/5'
                )}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b text-xs">
                    <span className="font-semibold text-muted-foreground">
                      {format(day, 'EEE')}
                    </span>
                    <span
                      className={cn(
                        'h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs',
                        dayIsToday ? 'bg-primary text-primary-foreground shadow-xs' : 'text-foreground'
                      )}
                    >
                      {format(day, 'd')}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => onEditTask(task)}
                        className="p-2 rounded-lg border bg-background/80 hover:bg-muted/40 transition-colors cursor-pointer text-xs space-y-0.5"
                      >
                        <p className="font-medium text-foreground truncate">{task.title}</p>
                        {task.dueTime && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {task.dueTime}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask?.(dayStr)}
                  className="w-full text-xs h-7 text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add
                </Button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
