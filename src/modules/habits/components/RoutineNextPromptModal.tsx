import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, Play, Sparkles, Layers } from 'lucide-react'
import type { Habit } from '../types'
import { getHabitIconComponent } from '../constants'

interface RoutineNextPromptModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  completedHabit: Habit | null
  nextHabit: Habit | null
  routineName: string
  onCheckInNext: (habit: Habit) => void
  onLaunchTimerNext: (habit: Habit) => void
}

export function RoutineNextPromptModal({
  open,
  onOpenChange,
  completedHabit,
  nextHabit,
  routineName,
  onCheckInNext,
  onLaunchTimerNext
}: RoutineNextPromptModalProps) {
  if (!completedHabit || !nextHabit) return null

  const NextIcon = getHabitIconComponent(nextHabit.icon)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl p-5">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Routine Step Completed!</span>
          </div>
          <DialogTitle className="text-base font-bold text-foreground">
            Continue {routineName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3.5 py-2">
          {/* Progression flow visual */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-medium text-muted-foreground line-through truncate">
                {completedHabit.title}
              </span>
            </div>

            <ArrowRight className="h-4 w-4 text-muted-foreground/60 shrink-0 mx-1" />

            <div className="flex items-center gap-2 min-w-0">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-xs"
                style={{
                  backgroundColor: `${nextHabit.color}20`,
                  color: nextHabit.color,
                  borderColor: `${nextHabit.color}40`
                }}
              >
                <NextIcon className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold text-foreground truncate">{nextHabit.title}</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground space-y-1 bg-primary/5 p-3 rounded-xl border border-primary/20">
            <div className="flex items-center gap-1.5 font-semibold text-primary text-xs">
              <Layers className="h-3.5 w-3.5" />
              <span>
                Step #{nextHabit.routineOrder || 2}: {nextHabit.title}
              </span>
            </div>
            {nextHabit.targetType === 'timer' && (
              <p>Duration goal: {nextHabit.targetValue || 25} minutes focus block</p>
            )}
            {nextHabit.targetType === 'numeric' && (
              <p>
                Target goal: {nextHabit.targetValue} {nextHabit.unit || 'units'}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-xl flex-1 text-xs"
          >
            Later
          </Button>

          {nextHabit.targetType === 'timer' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onLaunchTimerNext(nextHabit)
                onOpenChange(false)
              }}
              className="rounded-xl flex-1 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Start Timer</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onCheckInNext(nextHabit)
                onOpenChange(false)
              }}
              className="rounded-xl flex-1 text-xs gap-1.5 bg-primary text-primary-foreground font-semibold"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Check In Next</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
