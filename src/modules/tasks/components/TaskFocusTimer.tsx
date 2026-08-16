import { useMemo } from 'react'
import { Clock, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CircularFocusTimer } from '@/components/timer/CircularFocusTimer'
import type { Task, Project } from '../types'
import { useUpdateTask, useUpdateTaskStatus } from '../hooks/useTasks'
import { formatEstimatedMinutes } from './TaskCard'

interface TaskFocusTimerProps {
  task: Task
  project?: Project
  onSessionComplete?: (durationMinutes: number) => void
}

export function TaskFocusTimer({ task, project, onSessionComplete }: TaskFocusTimerProps) {
  const updateTaskMutation = useUpdateTask()
  const updateStatusMutation = useUpdateTaskStatus()

  const estimatedMinutes = task.estimatedMinutes || 0
  const actualMinutes = task.actualMinutes || 0
  const themeColor = project?.color || '#3b82f6'

  const progressPercent = useMemo(() => {
    if (estimatedMinutes <= 0) return 0
    return Math.min(100, Math.round((actualMinutes / estimatedMinutes) * 100))
  }, [actualMinutes, estimatedMinutes])

  const handleLogSession = (elapsedMinutes: number) => {
    const nextActual = actualMinutes + elapsedMinutes
    updateTaskMutation.mutate({
      id: task.id,
      updates: {
        actualMinutes: nextActual
      }
    })
  }

  const handleMarkDone = () => {
    updateStatusMutation.mutate({
      id: task.id,
      status: 'done'
    })
  }

  return (
    <div className="space-y-3">
      {/* Time Spent vs Estimate Comparison Banner / Progress */}
      {estimatedMinutes > 0 && (
        <div className="rounded-xl border bg-card/60 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Time Tracking Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                <strong className="text-foreground">
                  {formatEstimatedMinutes(actualMinutes) || `${actualMinutes}m`}
                </strong>
                {' / '}
                <span>{formatEstimatedMinutes(estimatedMinutes)}</span>
              </span>
              <span className="font-semibold text-primary">({progressPercent}%)</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-muted-foreground" />
              {actualMinutes >= estimatedMinutes ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  Estimate reached ({actualMinutes - estimatedMinutes}m over)
                </span>
              ) : (
                <span>{estimatedMinutes - actualMinutes}m remaining on estimate</span>
              )}
            </span>

            {task.status !== 'done' && actualMinutes >= estimatedMinutes && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkDone}
                className="h-6 text-[11px] px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 gap-1 font-medium -my-1"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Mark Task Done</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Embedded Circular Focus Timer */}
      <CircularFocusTimer
        title="Task Focus Timer"
        targetMinutes={estimatedMinutes > 0 ? estimatedMinutes : 25}
        accumulatedMinutes={actualMinutes}
        targetLabel={estimatedMinutes > 0 ? 'estimate' : 'block'}
        themeColor={themeColor}
        defaultPresetMinutes={25}
        showAutofillRemaining={estimatedMinutes > 0 && estimatedMinutes > actualMinutes}
        onLogSession={handleLogSession}
        onSessionComplete={onSessionComplete}
      />
    </div>
  )
}
