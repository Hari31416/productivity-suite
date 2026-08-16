import { useMemo } from 'react'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useTasks } from '../hooks/useTasks'
import { useProjects } from '../hooks/useProjects'

export function TaskDashboardWidget() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const { data: tasks = [], isLoading: tasksLoading } = useTasks({ includeArchived: false })
  const { data: projects = [] } = useProjects(false)

  const { openTasksCount, todayDueCount, urgentCount, completionPercentage, projectTaskCounts } =
    useMemo(() => {
      const todayTasks = tasks.filter((t) => t.dueDate === todayStr)
      const completedToday = todayTasks.filter((t) => t.status === 'done').length
      const openTasks = tasks.filter((t) => t.status !== 'done')
      const todayDue = openTasks.filter((t) => t.dueDate === todayStr).length
      const urgent = openTasks.filter((t) => t.priority === 'urgent').length

      const projCounts = new Map<string, number>()
      for (const task of tasks) {
        if (task.projectId) {
          projCounts.set(task.projectId, (projCounts.get(task.projectId) || 0) + 1)
        }
      }

      const pct = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0

      return {
        openTasksCount: openTasks.length,
        todayCompletedCount: completedToday,
        todayDueCount: todayDue,
        urgentCount: urgent,
        completionPercentage: pct,
        projectTaskCounts: projCounts
      }
    }, [tasks, todayStr])

  if (tasksLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Task Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">
            Loading task metrics...
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
            <CardTitle className="text-sm font-semibold">Tasks Insights</CardTitle>
          </div>
          <Badge variant="secondary" className="text-xs font-normal">
            {openTasksCount} open
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Today's Task Completion</span>
              <span className="font-medium text-foreground">{completionPercentage}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span>Due Today</span>
              </div>
              <p className="text-sm font-bold">
                {todayDueCount} {todayDueCount === 1 ? 'task' : 'tasks'}
              </p>
            </div>

            <div className="p-2.5 rounded-xl border bg-muted/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span>Urgent</span>
              </div>
              <p className="text-sm font-bold text-red-600 dark:text-red-400">
                {urgentCount} {urgentCount === 1 ? 'task' : 'tasks'}
              </p>
            </div>
          </div>

          {/* Projects distribution */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Active Projects
            </span>
            <div className="flex flex-wrap gap-1.5">
              {projects.length === 0 ? (
                <span className="text-xs text-muted-foreground">No active projects</span>
              ) : (
                projects.map((proj) => {
                  const count = projectTaskCounts.get(proj.id) || 0
                  return (
                    <span
                      key={proj.id}
                      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-lg border font-medium whitespace-nowrap"
                      style={{
                        backgroundColor: `${proj.color || '#3b82f6'}15`,
                        borderColor: `${proj.color || '#3b82f6'}35`,
                        color: proj.color || '#3b82f6'
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: proj.color || '#3b82f6' }}
                      />
                      <span>{proj.name}</span>
                      <span className="opacity-75">({count})</span>
                    </span>
                  )
                })
              )}
            </div>
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
          <span>Open Task Planner</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  )
}
