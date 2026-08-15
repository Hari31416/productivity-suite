import { useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { CheckSquare, Square, ArrowRight, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'
import { PRIORITY_CONFIG } from './TaskCard'
import { cn } from '@/lib/utils'

export function TaskDashboardWidget() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ includeArchived: false })
  const { data: projects = [] } = useProjects(false)
  const updateStatusMutation = useUpdateTaskStatus()

  const projectMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of projects) {
      map.set(p.id, p.name)
    }
    return map
  }, [projects])

  // Get tasks that are either due today or marked urgent (and not completed/archived), plus recently completed today
  const { featuredTasks, todayCompletedCount, todayTotalCount } = useMemo(() => {
    const todayTasks = tasks.filter((t) => t.dueDate === todayStr)
    const completedToday = todayTasks.filter((t) => t.status === 'done').length

    const urgentOrTodayActive = tasks.filter(
      (t) => (t.dueDate === todayStr || t.priority === 'urgent') && t.status !== 'done'
    )

    // Also include up to 2 done tasks for visual feedback
    const doneToday = todayTasks.filter((t) => t.status === 'done').slice(0, 2)
    const combined = [...urgentOrTodayActive, ...doneToday].slice(0, 5)

    return {
      featuredTasks: combined,
      todayCompletedCount: completedToday,
      todayTotalCount: todayTasks.length
    }
  }, [tasks, todayStr])

  const completionPercentage =
    todayTotalCount > 0 ? Math.round((todayCompletedCount / todayTotalCount) * 100) : 0

  if (tasksLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Task Planner</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            Loading tasks...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Today & Priorities</CardTitle>
          </div>
          {todayTotalCount > 0 && (
            <Badge variant="secondary" className="text-xs font-normal">
              {todayCompletedCount} / {todayTotalCount} done
            </Badge>
          )}
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {todayTotalCount > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Daily Completion</span>
                <span className="font-medium text-foreground">
                  {completionPercentage}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          )}

          <div className="space-y-2">
            {featuredTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No urgent tasks or tasks due today.
              </p>
            ) : (
              featuredTasks.map((task) => {
                const isDone = task.status === 'done'
                const isUrgent = task.priority === 'urgent'
                const priority = PRIORITY_CONFIG[task.priority]

                return (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-md border text-xs transition-colors',
                      isDone
                        ? 'bg-primary/5 border-primary/20 opacity-75'
                        : 'hover:bg-muted/30',
                      isUrgent && !isDone && 'border-red-500/30 bg-red-500/5'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: task.id,
                            status: isDone ? 'todo' : 'done'
                          })
                        }
                        className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                      >
                        {isDone ? (
                          <CheckSquare className="h-4 w-4 text-primary" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>

                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span
                          className={cn(
                            'font-medium truncate',
                            isDone && 'line-through text-muted-foreground'
                          )}
                        >
                          {task.title}
                        </span>

                        {isUrgent && !isDone && (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-600 dark:text-red-400 font-semibold shrink-0">
                            <AlertTriangle className="h-3 w-3" />
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.projectId && projectMap.has(task.projectId) && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[80px]">
                          {projectMap.get(task.projectId)}
                        </span>
                      )}
                      <span
                        className={cn('h-2 w-2 rounded-full', priority.dotClass)}
                        title={`Priority: ${priority.label}`}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </div>

      <div className="p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs text-muted-foreground hover:text-foreground justify-between"
          onClick={() => {
            window.location.hash = '#/tasks'
          }}
        >
          <span>View All Tasks</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
